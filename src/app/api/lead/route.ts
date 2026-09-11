import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getDb } from "@/db";
import { leads } from "@/db/schema";

const SOURCES = ["landing", "model", "services", "mail-in"] as const;
type Source = (typeof SOURCES)[number];

export type Lead = {
  name: string;
  phone?: string;
  /** Заповнюється, коли заявку лишає авторизований клієнт із кабінету */
  email?: string;
  problem?: string;
  model?: string;
  service?: string;
  city?: string;
  branch?: string;
  source: Source;
};

const escapeHtml = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

async function notifyTelegram(lead: Lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const lines = [
    `<b>Нова заявка</b> · ${lead.source}`,
    `Ім'я: ${lead.name}`,
    lead.phone && `Телефон: ${lead.phone}`,
    lead.email && `Пошта: ${lead.email}`,
    lead.model && `Модель: ${lead.model}`,
    lead.service && `Послуга: ${lead.service}`,
    lead.city && `Місто: ${lead.city}`,
    lead.branch && `Відділення: ${lead.branch}`,
    lead.problem && `Проблема: ${lead.problem}`,
  ]
    .filter(Boolean)
    .map((l) => escapeHtml(String(l)).replace(/&lt;(\/?b)&gt;/g, "<$1>"))
    .join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: lines, parse_mode: "HTML" }),
  });
}

/** Порожній рядок у базі не потрібен — краще NULL */
const clean = (v: unknown) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s.slice(0, 2000) : null;
};

export async function POST(request: Request) {
  // Не більше 5 заявок за 10 хвилин з однієї адреси
  const limit = rateLimit(`lead:${clientIp(request)}`, 5, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Забагато заявок поспіль. Спробуйте за кілька хвилин або зателефонуйте нам." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let lead: Lead;
  try {
    lead = await request.json();
  } catch {
    return NextResponse.json({ error: "Некоректний запит" }, { status: 400 });
  }

  // Якщо клієнт залогінений — прив'язуємо заявку до його акаунта,
  // щоб вона з'явилась у кабінеті. Пошту в такому разі беремо з профілю.
  const { userId } = await auth();
  const profile = userId ? await currentUser() : null;
  const profileEmail = profile?.primaryEmailAddress?.emailAddress ?? null;

  // Потрібне ім'я і хоча б один спосіб зв'язку. З кабінету при email-вході
  // телефону може не бути взагалі — тоді вистачає пошти.
  const hasPhone = (lead?.phone ?? "").replace(/\D/g, "").length >= 9;
  const hasEmail = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(lead?.email ?? "");

  if (!lead?.name?.trim() || (!hasPhone && !hasEmail && !profileEmail)) {
    return NextResponse.json({ error: "Потрібні ім'я та телефон або пошта" }, { status: 422 });
  }

  const source: Source = SOURCES.includes(lead.source) ? lead.source : "landing";

  try {
    await getDb()
      .insert(leads)
      .values({
        name: lead.name.trim().slice(0, 200),
        phone: hasPhone ? clean(lead.phone) : null,
        email: hasEmail ? clean(lead.email) : profileEmail,
        model: clean(lead.model),
        service: clean(lead.service),
        problem: clean(lead.problem),
        city: clean(lead.city),
        branch: clean(lead.branch),
        clerkUserId: userId ?? null,
        source,
      });
  } catch (e) {
    // Заявку втрачати не можна: лишаємо слід у логах і пробуємо сповістити майстра
    console.error("[lead] не вдалося записати в базу:", e);
    try {
      await notifyTelegram(lead);
    } catch {}
    return NextResponse.json({ error: "Не вдалося зберегти заявку" }, { status: 500 });
  }

  // Заявки залогінених клієнтів майстер бачить у кабінеті-адмінці разом з історією.
  // Анонімні ніде більше не «висять», тому про них сповіщаємо в Telegram одразу.
  if (!userId) {
    try {
      await notifyTelegram(lead);
    } catch (e) {
      // Заявку вже прийнято — збій сповіщення не має ламати відповідь клієнту
      console.error("[lead] Telegram не відповів:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
