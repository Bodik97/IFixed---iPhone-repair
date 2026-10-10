import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { phoneKey } from "@/db/clients";
import { telegramChats, type Lead } from "@/db/schema";
import { describeStatus } from "@/data/leadStatus";
import { esc } from "./telegram";

/**
 * Бот для клієнтів: пише в Telegram, коли майстер міняє статус ремонту.
 *
 * Окремий від службового бота майстрів — зі своїм токеном
 * (TELEGRAM_CLIENT_BOT_TOKEN) та імʼям (TELEGRAM_CLIENT_BOT_USERNAME).
 * Telegram не дає боту написати першим, тож клієнт сам відкриває його за
 * посиланням і тисне «Start». У посиланні — за ким закріпити чат і підпис,
 * щоб чужий номер не можна було підставити.
 *
 * Ніколи не кидаємо помилку назовні: зміна статусу в адмінці не має залежати
 * від Telegram.
 */

function config(): { token: string; username: string } | null {
  const token = process.env.TELEGRAM_CLIENT_BOT_TOKEN?.trim();
  const username = process.env.TELEGRAM_CLIENT_BOT_USERNAME?.trim().replace(/^@/, "");
  return token && username ? { token, username } : null;
}

export function clientBotReady(): boolean {
  return config() !== null;
}

type Who = Pick<Lead, "id" | "phone" | "clerkUserId">;

/**
 * За ким закріплюється чат. Телефон — щоб раз підключений клієнт отримував
 * статуси й за наступними заявками; без телефону — акаунт, без акаунта — сама заявка.
 */
export function subjectOf(lead: Who): string {
  const phone = phoneKey(lead.phone);
  if (phone) return `t${phone}`;
  if (lead.clerkUserId && /^[A-Za-z0-9_]{1,40}$/.test(lead.clerkUserId)) return `u${lead.clerkUserId}`;
  return `l${lead.id.replace(/-/g, "")}`;
}

const sign = (value: string, token: string) =>
  createHmac("sha256", token).update(value).digest("hex").slice(0, 20);

/** Посилання «відкрити бота й підключити статуси» — або null, якщо бот не налаштований */
export function connectLink(lead: Who): string | null {
  const cfg = config();
  if (!cfg) return null;
  const subject = subjectOf(lead);
  return `https://t.me/${cfg.username}?start=${subject}-${sign(subject, cfg.token)}`;
}

/** Те, що прийшло після /start → за ким закріпити чат; null, якщо підпис не наш */
export function readStart(payload: string): string | null {
  const cfg = config();
  const cut = payload.lastIndexOf("-");
  if (!cfg || cut < 1) return null;

  const subject = payload.slice(0, cut);
  const given = Buffer.from(payload.slice(cut + 1));
  const expected = Buffer.from(sign(subject, cfg.token));
  return given.length === expected.length && timingSafeEqual(given, expected) ? subject : null;
}

/** Секрет, яким Telegram підписує запити на наш webhook — виводимо з токена, окремої змінної не треба */
export function webhookSecret(): string | null {
  const cfg = config();
  return cfg ? createHmac("sha256", cfg.token).update("webhook").digest("hex").slice(0, 32) : null;
}

export async function linkChat(subject: string, chatId: string): Promise<void> {
  await getDb()
    .insert(telegramChats)
    .values({ subject, chatId })
    .onConflictDoUpdate({ target: telegramChats.subject, set: { chatId } });
}

/** У кого з цих заявок бот уже підключений — для позначки в адмінці */
export async function linkedLeads(rows: Who[]): Promise<Set<string>> {
  if (!config() || rows.length === 0) return new Set();

  const bySubject = new Map(rows.map((r) => [r.id, subjectOf(r)]));
  const found = await getDb()
    .select({ subject: telegramChats.subject })
    .from(telegramChats)
    .where(inArray(telegramChats.subject, [...new Set(bySubject.values())]));

  const linked = new Set(found.map((f) => f.subject));
  return new Set(rows.filter((r) => linked.has(bySubject.get(r.id)!)).map((r) => r.id));
}

export async function sendToChat(chatId: string, html: string): Promise<number> {
  const cfg = config();
  if (!cfg) return 0;
  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
    });
    if (!res.ok) console.error("[client-bot] відмова:", res.status, await res.text().catch(() => ""));
    return res.status;
  } catch (e) {
    console.error("[client-bot] не вдалося надіслати:", e);
    return 0;
  }
}

/** Що бот пише клієнту про поточний статус заявки */
export function statusText(lead: Pick<Lead, "orderNo" | "model" | "service" | "status" | "ttn">): string {
  const s = describeStatus(lead.status);
  const what = lead.model ?? lead.service;

  return [
    `<b>Замовлення №${lead.orderNo} — ${esc(s.label)}</b>`,
    what ? esc(what) : "",
    "",
    esc(s.hint),
    lead.status === "shipped" && lead.ttn ? `Накладна Нової Пошти: <code>${esc(lead.ttn)}</code>` : "",
  ]
    .filter((line, i) => line || i === 2)
    .join("\n");
}

/**
 * Написати клієнту про новий статус. Повертає, чи дійшло: false — бот не
 * підключений або клієнт його заблокував (тоді запис прибираємо).
 */
export async function notifyClientStatus(lead: Lead): Promise<boolean> {
  // «Нова» — це ще не подія для клієнта: він щойно сам лишив заявку
  if (!config() || lead.status === "new") return false;

  try {
    const subject = subjectOf(lead);
    const [chat] = await getDb().select().from(telegramChats).where(eq(telegramChats.subject, subject)).limit(1);
    if (!chat) return false;

    const status = await sendToChat(chat.chatId, statusText(lead));
    // 403 — клієнт зупинив бота: чат більше не наш
    if (status === 403) await getDb().delete(telegramChats).where(eq(telegramChats.id, chat.id));
    return status === 200;
  } catch (e) {
    console.error("[client-bot] статус не надіслано:", e);
    return false;
  }
}
