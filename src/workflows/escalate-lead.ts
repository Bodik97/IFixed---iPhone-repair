import { sleep } from "workflow";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { leadLink } from "@/lib/adminLinks";
import { sendPush } from "@/lib/push";
import { esc, notifyMaster } from "@/lib/telegram";

/**
 * Нова заявка «дзвонить», доки її хтось не візьме.
 *
 * Сайт обіцяє передзвонити за 25 хвилин, а одне сповіщення легко прогавити.
 * Тож: через 5 хвилин без реакції — повторний push, ще через 5 — Telegram як
 * запасний канал. Реакція — будь-яка: майстер натиснув «Взяти собі» чи
 * змінив статус. Тоді нагадування тихо припиняються.
 *
 * Чекання — sleep() Workflow: функція не працює й не коштує нічого, поки
 * спить, і прокидається сама, без cron.
 */

type Waiting = { id: string; orderNo: number; name: string; what: string | null; phone: string | null };

/** Заявка досі нічия й нова? Повертає її дані, інакше null */
export async function stillWaiting(leadId: string): Promise<Waiting | null> {
  "use step";
  const [r] = await getDb().select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!r || r.status !== "new" || r.assignee) return null;
  return { id: r.id, orderNo: r.orderNo, name: r.name, what: r.model ?? r.service, phone: r.phone };
}

export async function remindByPush(lead: Waiting, minutes: number): Promise<number> {
  "use step";
  return sendPush({
    title: `Заявка №${lead.orderNo} чекає ${minutes} хв`,
    body: [lead.name, lead.what].filter(Boolean).join(" · ") + " — ніхто ще не взяв",
    url: leadLink(lead.orderNo, lead.id),
    tag: `lead-${lead.id}`,
  });
}

export async function remindByTelegram(lead: Waiting, minutes: number): Promise<void> {
  "use step";
  await notifyMaster(
    [
      `<b>Заявка №${lead.orderNo} чекає вже ${minutes} хв — ніхто не взяв</b>`,
      `${esc(lead.name)}${lead.what ? ` · ${esc(lead.what)}` : ""}`,
      lead.phone ? `Телефон: ${esc(lead.phone)}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

export async function escalateLead(leadId: string) {
  "use workflow";

  await sleep("5m");
  const first = await stillWaiting(leadId);
  if (!first) return { handled: "within 5m" };
  await remindByPush(first, 5);

  await sleep("5m");
  const second = await stillWaiting(leadId);
  if (!second) return { handled: "within 10m" };
  await remindByTelegram(second, 10);
  await remindByPush(second, 10);

  return { handled: "escalated" };
}
