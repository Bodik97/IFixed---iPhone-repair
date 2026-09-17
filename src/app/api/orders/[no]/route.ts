import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { getEvents } from "@/db/events";
import { describeStatus, STAGES } from "@/db/leads";
import { leads } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { digits, lastFour } from "@/lib/phone";

export const dynamic = "force-dynamic";

export type Order = {
  no: string;
  device: string;
  work: string;
  stage: number;
  stages: string[];
  eta: string;
  log: { time: string; text: string }[];
};

/** Одна відповідь на «не знайшли» і на «не той телефон» — щоб номери не можна було перебрати */
const NOT_FOUND = "Не знайшли замовлення з таким номером і телефоном.";

const formatTime = (d: Date) =>
  d.toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export async function GET(request: Request, { params }: { params: Promise<{ no: string }> }) {
  // Перебір номерів замовлень — теж форма атаки
  const limit = await rateLimit(`order:ip:${clientIp(request)}`, 20, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Забагато запитів. Спробуйте пізніше." }, { status: 429 });
  }

  const { no } = await params;
  const clean = no.trim();

  if (!/^\d{1,10}$/.test(clean)) {
    return NextResponse.json({ error: "Номер замовлення — лише цифри з квитанції" }, { status: 400 });
  }

  // Номер сам по собі не таємниця, тож без другого поля статус не віддаємо
  const check = digits(new URL(request.url).searchParams.get("phone") ?? "");
  if (check.length !== 4) {
    return NextResponse.json(
      { error: "Впишіть останні 4 цифри телефону, який лишали при зверненні." },
      { status: 400 },
    );
  }

  const [lead] = await getDb()
    .select()
    .from(leads)
    .where(eq(leads.orderNo, Number(clean)))
    .limit(1);

  if (!lead || lastFour(lead.phone) !== check) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }

  const info = describeStatus(lead.status);
  const events = await getEvents(lead.id);

  return NextResponse.json({
    no: String(lead.orderNo),
    device: lead.model || "Ваш пристрій",
    work: lead.service || lead.problem || "Ремонт",
    stage: info.stage,
    stages: [...STAGES],
    eta: info.hint,
    log: events.map((e) => ({ time: formatTime(e.createdAt), text: e.text })),
  } satisfies Order);
}
