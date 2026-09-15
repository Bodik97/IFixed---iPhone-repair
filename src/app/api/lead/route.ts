import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { esc, notifyMaster } from "@/lib/telegram";
import { siteUrl } from "@/lib/siteUrl";

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

async function notifyTelegram(lead: Lead, orderNo?: number) {
  const head = orderNo ? `<b>Нова заявка №${orderNo}</b>` : "<b>Нова заявка</b>";

  const rows: [string, string | undefined][] = [
    ["Ім'я", lead.name],
    ["Телефон", lead.phone],
    ["Пошта", lead.email],
    ["Модель", lead.model],
    ["Послуга", lead.service],
    ["Місто", lead.city],
    ["Відділення", lead.branch],
    ["Проблема", lead.problem],
  ];

  const body = rows
    .filter(([, v]) => v && String(v).trim())
    .map(([k, v]) => `${k}: ${esc(v)}`)
    .join("\n");

  await notifyMaster(`${head}\n${body}\n\n${siteUrl()}/admin/zayavky`);
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

  let orderNo: number | undefined;

  try {
    const [row] = await getDb()
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
      })
      .returning({ orderNo: leads.orderNo });

    orderNo = row?.orderNo;
  } catch (e) {
    // Заявку втрачати не можна: лишаємо слід у логах і пробуємо сповістити майстра
    console.error("[lead] не вдалося записати в базу:", e);
    try {
      await notifyTelegram(lead);
    } catch {}
    return NextResponse.json({ error: "Не вдалося зберегти заявку" }, { status: 500 });
  }

  // Сповіщаємо про кожну заявку, не лише анонімну: заявка о 21:00 інакше
  // пролежить до ранку, бо майстер не тримає адмінку відкритою.
  await notifyTelegram(lead, orderNo);

  return NextResponse.json({ ok: true });
}
