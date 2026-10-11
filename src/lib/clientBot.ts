import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { desc, eq, inArray, or, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { phoneKey, phoneKeySql } from "@/db/clients";
import { leads, telegramChats, type Lead } from "@/db/schema";
import { ARCHIVED, describeStatus } from "@/data/leadStatus";
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

/** Підпис кнопки в боті: натиснув — отримав поточний стан своїх ремонтів */
export const CHECK_BUTTON = "Перевірити статус";
/** Кнопка для того, хто ще не підключився: Telegram сам передає боту його номер */
export const SHARE_BUTTON = "Поділитися номером";

/** Чат за номером із Telegram — той самий ключ, що й у заявок із цим телефоном */
export function subjectOfPhone(phone: string): string | null {
  const key = phoneKey(phone);
  return key ? `t${key}` : null;
}

/** Кнопки просто під повідомленням: натискання приходить на webhook як callback_query */
export type InlineButton = { text: string; callback_data: string };

/** Довільний метод Bot API; повертає код відповіді, 0 — немає звʼязку чи бот не налаштований */
export async function callBot(method: string, body: object): Promise<number> {
  const cfg = config();
  if (!cfg) return 0;
  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.error("[client-bot] відмова:", method, res.status, await res.text().catch(() => ""));
    return res.status;
  } catch (e) {
    console.error("[client-bot] не вдалося надіслати:", method, e);
    return 0;
  }
}

/**
 * `keyboard` — що під повідомленням: кнопка під полем вводу («Перевірити
 * статус» для підключеного чату, «Поділитися номером» для того, кого ще не
 * впізнали) або кнопки-відповіді під самим повідомленням.
 */
export async function sendToChat(
  chatId: string,
  html: string,
  keyboard: "check" | "share" | InlineButton[] = "check",
): Promise<number> {
  return callBot("sendMessage", {
    chat_id: chatId,
    text: html,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: Array.isArray(keyboard)
      ? { inline_keyboard: [keyboard] }
      : {
          // Кнопка під полем вводу — завжди під рукою, з кожним повідомленням бота
          keyboard: [[keyboard === "share" ? { text: SHARE_BUTTON, request_contact: true } : { text: CHECK_BUTTON }]],
          resize_keyboard: true,
          is_persistent: true,
        },
  });
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

/** Заявки, за якими закріплений цей запис: за телефоном, акаунтом чи одна конкретна */
function leadsOf(subject: string): SQL | undefined {
  const value = subject.slice(1);
  if (subject[0] === "t") return eq(phoneKeySql, value);
  if (subject[0] === "u") return eq(leads.clerkUserId, value);
  if (subject[0] === "l" && /^[0-9a-f]{32}$/.test(value)) {
    return eq(leads.id, value.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5"));
  }
  return undefined;
}

/**
 * Заявки того, хто пише з цього чату, найсвіжіші перші.
 * null — чат бота ще не підключав, і шукати чужі заявки ми не будемо.
 */
export async function chatLeads(chatId: string): Promise<Lead[] | null> {
  const chats = await getDb().select().from(telegramChats).where(eq(telegramChats.chatId, chatId));
  const filters = chats.map((c) => leadsOf(c.subject)).filter((f): f is SQL => Boolean(f));
  if (filters.length === 0) return null;

  return getDb()
    .select()
    .from(leads)
    .where(or(...filters))
    .orderBy(desc(leads.createdAt))
    .limit(10);
}

/**
 * Відповідь на «Перевірити статус»: що зараз із ремонтами того, хто пише.
 * Показуємо незакриті заявки; якщо таких немає — останню закриту.
 * null — цей чат бота ще не підключав.
 */
export async function statusReport(chatId: string): Promise<string | null> {
  const rows = await chatLeads(chatId);
  if (!rows) return null;

  if (rows.length === 0) return "Заявок за вашим номером зараз немає. Щойно зʼявиться — напишемо сюди.";

  const open = rows.filter((r) => !ARCHIVED.includes(r.status));
  return (open.length > 0 ? open : rows.slice(0, 1)).map(statusText).join("\n\n");
}

/**
 * Написати клієнту цієї заявки. Повертає, чи дійшло: false — бот не
 * підключений або клієнт його заблокував (тоді запис прибираємо).
 */
async function tellClient(lead: Who, html: string, buttons?: InlineButton[]): Promise<boolean> {
  if (!config()) return false;

  try {
    const subject = subjectOf(lead);
    const [chat] = await getDb().select().from(telegramChats).where(eq(telegramChats.subject, subject)).limit(1);
    if (!chat) return false;

    const status = await sendToChat(chat.chatId, html, buttons);
    // 403 — клієнт зупинив бота: чат більше не наш
    if (status === 403) await getDb().delete(telegramChats).where(eq(telegramChats.id, chat.id));
    return status === 200;
  } catch (e) {
    console.error("[client-bot] не надіслано:", e);
    return false;
  }
}

export async function notifyClientStatus(lead: Lead): Promise<boolean> {
  // «Нова» — це ще не подія для клієнта: він щойно сам лишив заявку
  if (lead.status === "new") return false;
  return tellClient(lead, statusText(lead));
}

const uah = (n: number) => `${n.toLocaleString("uk-UA")} ₴`;

/** Дані кнопок під ціною: дія, заявка і сама сума — щоб стара кнопка не погодила нову ціну */
export const priceButton = (action: "ok" | "call", lead: Pick<Lead, "id">, price: number) =>
  `${action}:${lead.id.replace(/-/g, "")}:${price}`;

/**
 * Майстер вписав ціну — клієнт погоджує її кнопкою, без дзвінка.
 * Відповідь приходить на webhook і потрапляє в чат заявки в адмінці.
 */
export async function offerPrice(lead: Lead): Promise<boolean> {
  if (lead.price === null) return false;
  const what = lead.model ?? lead.service;

  return tellClient(
    lead,
    [
      `<b>Замовлення №${lead.orderNo} — ціна ремонту ${uah(lead.price)}</b>`,
      what ? esc(what) : "",
      "",
      "Ціна фіксована й далі не зміниться. Погоджуєте?",
    ]
      .filter((line, i) => line || i === 2)
      .join("\n"),
    [
      { text: "Погоджуюсь", callback_data: priceButton("ok", lead, lead.price) },
      { text: "Передзвоніть мені", callback_data: priceButton("call", lead, lead.price) },
    ],
  );
}

/** Майстер відповів у чаті заявки — пересилаємо клієнту в Telegram */
export async function forwardMasterMessage(leadId: string, text: string, hasPhoto: boolean): Promise<boolean> {
  if (!config()) return false;

  const [lead] = await getDb().select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return false;

  const body = [text ? esc(text) : "", hasPhoto ? "Майстер надіслав фото — воно в чаті заявки на сайті." : ""]
    .filter(Boolean)
    .join("\n\n");

  return tellClient(lead, `<b>Майстер · замовлення №${lead.orderNo}</b>\n${body}`);
}
