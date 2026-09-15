import { and, gte, isNotNull, lt } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { getDb } from "./index";
import { expenses, leads } from "./schema";
import { categoryLabel } from "./expenses";

/**
 * Поденна історія руху грошей.
 *
 * Зведені цифри показують підсумок, але не відповідають на питання «звідки
 * це взялось». Журнал показує кожен рух окремо: хто заплатив, коли, за що,
 * чи був до того завдаток.
 *
 * Три джерела, бо це три різні події в часі: завдаток вносять до ремонту,
 * решту — при видачі, а витрати живуть самі по собі.
 */
export type MoneyEntry = {
  id: string;
  at: Date;
  kind: "prepaid" | "paid" | "expense";

  /** Заявка, якої стосується рух */
  leadId: string | null;
  orderNo: number | null;
  client: string | null;
  phone: string | null;
  model: string | null;
  service: string | null;

  /** Скільки грошей рухнулось: «+» прихід, «−» витрата рахуємо на боці сторінки */
  amount: number;

  /** Для оплати — собівартість деталі й раніше внесений завдаток */
  partsCost: number | null;
  prepayment: number | null;
  prepaidAt: Date | null;

  /** Для витрати — категорія й коментар */
  category: string | null;
  note: string | null;
};

function within(column: PgColumn, from: Date, to?: Date) {
  return to ? and(isNotNull(column), gte(column, from), lt(column, to)) : and(isNotNull(column), gte(column, from));
}

export async function getMoneyJournal(from: Date, to?: Date): Promise<MoneyEntry[]> {
  const leadColumns = {
    leadId: leads.id,
    orderNo: leads.orderNo,
    client: leads.name,
    phone: leads.phone,
    model: leads.model,
    service: leads.service,
    price: leads.price,
    partsCost: leads.partsCost,
    prepayment: leads.prepayment,
    prepaidAt: leads.prepaidAt,
    paidAt: leads.paidAt,
  };

  const [paid, prepaid, spent] = await Promise.all([
    getDb().select(leadColumns).from(leads).where(within(leads.paidAt, from, to)),
    getDb().select(leadColumns).from(leads).where(within(leads.prepaidAt, from, to)),
    getDb()
      .select()
      .from(expenses)
      .where(
        to
          ? and(gte(expenses.spentAt, from), lt(expenses.spentAt, to))
          : gte(expenses.spentAt, from),
      ),
  ]);

  const entries: MoneyEntry[] = [
    ...paid.map((r) => ({
      id: `paid-${r.leadId}`,
      at: r.paidAt!,
      kind: "paid" as const,
      leadId: r.leadId,
      orderNo: r.orderNo,
      client: r.client,
      phone: r.phone,
      model: r.model,
      service: r.service,
      // Якщо завдаток уже внесли, при видачі доплачують решту
      amount: (r.price ?? 0) - (r.prepaidAt ? (r.prepayment ?? 0) : 0),
      partsCost: r.partsCost,
      prepayment: r.prepayment,
      prepaidAt: r.prepaidAt,
      category: null,
      note: null,
    })),

    ...prepaid.map((r) => ({
      id: `pre-${r.leadId}`,
      at: r.prepaidAt!,
      kind: "prepaid" as const,
      leadId: r.leadId,
      orderNo: r.orderNo,
      client: r.client,
      phone: r.phone,
      model: r.model,
      service: r.service,
      amount: r.prepayment ?? 0,
      partsCost: null,
      prepayment: r.prepayment,
      prepaidAt: r.prepaidAt,
      category: null,
      note: null,
    })),

    ...spent.map((e) => ({
      id: `exp-${e.id}`,
      at: e.spentAt,
      kind: "expense" as const,
      leadId: null,
      orderNo: null,
      client: null,
      phone: null,
      model: null,
      service: null,
      amount: e.amount,
      partsCost: null,
      prepayment: null,
      prepaidAt: null,
      category: categoryLabel(e.category),
      note: e.note,
    })),
  ];

  return entries.sort((a, b) => b.at.getTime() - a.at.getTime());
}
