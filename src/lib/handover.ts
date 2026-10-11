import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { addEvent, registerDevice } from "@/db/events";
import { leads, type Lead } from "@/db/schema";
import { guessWarrantyDays, warrantyEnd } from "@/data/warranty";
import { notifyClientStatus } from "./clientBot";

/**
 * Пристрій у клієнта: заявка закривається, і з цього дня рахується гарантія.
 *
 * Сюди ведуть усі шляхи: майстер видав у руки, клієнт підтвердив у боті, що
 * забрав посилку, Нова Пошта повідомила про отримання або майстер закрив
 * відправлену заявку сам. Дата гарантії ставиться раз — повторне закриття
 * її не зсуває.
 *
 * `note` — рядок у хроніку, коли закрив не майстер («клієнт підтвердив…»).
 */
export async function closeOrder(lead: Lead, note?: string): Promise<Lead> {
  const days = lead.warrantyDays ?? guessWarrantyDays(lead.service ?? lead.problem);
  const warrantyUntil = lead.warrantyUntil ?? warrantyEnd(new Date(), days);

  await getDb()
    .update(leads)
    .set({ status: "done", warrantyUntil, updatedAt: new Date() })
    .where(eq(leads.id, lead.id));

  // Хроніка: клієнт бачить, що саме сталося, а не лише підсвічену стадію
  await addEvent(lead.id, { status: "done", text: note });

  const closed: Lead = { ...lead, status: "done", warrantyUntil };

  // Пристрій потрапляє в список клієнта з гарантією — якщо вона є
  if (days > 0) await registerDevice(closed, days);

  await notifyClientStatus(closed);
  return closed;
}
