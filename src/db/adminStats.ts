import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import { getDb } from "./index";
import { leadEvents, leads, type LeadEvent } from "./schema";

/** Лічильники в шапці адмінки — рахуються по всій базі, не по сторінці */
export type Counters = {
  total: number;
  fresh: number;
  toShip: number;
};

export async function getCounters(): Promise<Counters> {
  const [[{ total }], [{ fresh }], [{ toShip }]] = await Promise.all([
    getDb().select({ total: count() }).from(leads),
    getDb().select({ fresh: count() }).from(leads).where(eq(leads.status, "new")),
    getDb()
      .select({ toShip: count() })
      .from(leads)
      .where(and(eq(leads.deliveryRequested, true), isNull(leads.ttn))),
  ]);

  return { total, fresh, toShip };
}

export type Money = {
  revenue: number;
  cost: number;
  profit: number;
  jobs: number;
};

/** Перше число місяця, зсунуте на `back` місяців назад */
export function monthStart(back = 0): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - back);
  return d;
}

/**
 * Гроші за проміжок. Рахуємо за датою оплати, а не за датою заявки: ремонт,
 * прийнятий у серпні й оплачений у вересні, належить вересню.
 */
export async function getMoney(from: Date, to?: Date): Promise<Money> {
  const where = to
    ? and(gte(leads.paidAt, from), lt(leads.paidAt, to))
    : gte(leads.paidAt, from);

  const [row] = await getDb()
    .select({
      revenue: sql<number>`coalesce(sum(${leads.price}), 0)::int`,
      cost: sql<number>`coalesce(sum(${leads.partsCost}), 0)::int`,
      jobs: count(),
    })
    .from(leads)
    .where(where);

  return { ...row, profit: row.revenue - row.cost };
}

/** Хроніка для набору заявок — одним запитом, а не по одному на кожну */
export async function getEventsFor(ids: string[]): Promise<Map<string, LeadEvent[]>> {
  const byLead = new Map<string, LeadEvent[]>();
  if (ids.length === 0) return byLead;

  const rows = await getDb()
    .select()
    .from(leadEvents)
    .where(inArray(leadEvents.leadId, ids))
    .orderBy(asc(leadEvents.createdAt));

  for (const e of rows) {
    const list = byLead.get(e.leadId) ?? [];
    list.push(e);
    byLead.set(e.leadId, list);
  }

  return byLead;
}

/** Скільки грошей ще не зайшло: ціна виставлена, робота не відмовлена, оплати немає */
export type Outstanding = { jobs: number; billed: number; prepaid: number; due: number };

export async function getOutstanding(): Promise<Outstanding> {
  const [row] = await getDb()
    .select({
      jobs: count(),
      billed: sql<number>`coalesce(sum(${leads.price}), 0)::int`,
      prepaid: sql<number>`coalesce(sum(${leads.prepayment}), 0)::int`,
    })
    .from(leads)
    .where(
      and(isNotNull(leads.price), isNull(leads.paidAt), ne(leads.status, "rejected")),
    );

  // Передоплату клієнт уже вніс, тож до отримання лишається різниця
  return { ...row, due: row.billed - row.prepaid };
}

/** Оплачені роботи за проміжок — рядками, для таблиці та вивантаження */
export async function getPaidLeads(from: Date, to?: Date) {
  const where = to
    ? and(gte(leads.paidAt, from), lt(leads.paidAt, to))
    : gte(leads.paidAt, from);

  return getDb()
    .select({
      orderNo: leads.orderNo,
      paidAt: leads.paidAt,
      name: leads.name,
      phone: leads.phone,
      model: leads.model,
      service: leads.service,
      price: leads.price,
      partsCost: leads.partsCost,
      prepayment: leads.prepayment,
    })
    .from(leads)
    .where(where)
    .orderBy(desc(leads.paidAt));
}
