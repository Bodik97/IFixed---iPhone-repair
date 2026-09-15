import { desc, inArray, isNotNull, sql } from "drizzle-orm";
import { getDb } from "./index";
import { leads } from "./schema";

/**
 * Клієнт — це не заявка, а телефон.
 *
 * Одна людина приходить із тріснутим екраном, через рік — з акумулятором,
 * ще за пів року приводить дружину. У базі це три різні заявки, і поки їх
 * ніщо не поєднувало, майстер не бачив, що перед ним постійний клієнт.
 *
 * Ключ — останні дев'ять цифр номера: у базі він записаний то з «+380»,
 * то з «0», то з пробілами, і зводити їх треба вже на боці SQL.
 */
const key = sql<string>`right(regexp_replace(${leads.phone}, '\\D', '', 'g'), 9)`;

export type Client = {
  key: string;
  name: string;
  phone: string;
  orders: number;
  paid: number;
  lastAt: Date;
};

/** Останнє значення поля — те, що клієнт указав при свіжому зверненні */
const latest = (column: typeof leads.name | typeof leads.phone) =>
  sql<string>`(array_agg(${column} order by ${leads.createdAt} desc))[1]`;

export async function getClients(): Promise<Client[]> {
  const rows = await getDb()
    .select({
      key,
      name: latest(leads.name),
      phone: latest(leads.phone),
      orders: sql<number>`count(*)::int`,
      paid: sql<number>`coalesce(sum(case when ${leads.paidAt} is not null then ${leads.price} else 0 end), 0)::int`,
      lastAt: sql<string>`max(${leads.createdAt})`,
    })
    .from(leads)
    .where(isNotNull(leads.phone))
    .groupBy(key)
    .orderBy(desc(sql`max(${leads.createdAt})`));

  // Драйвер віддає агрегати рядками — доводимо до Date тут, щоб сторінка
  // не мала знати про цю особливість
  return rows.map((r) => ({ ...r, lastAt: new Date(r.lastAt) }));
}

/**
 * Скільки звернень у кожного з переданих номерів — щоб позначити повторних
 * у списку заявок, не роблячи запит на кожну картку.
 */
export async function getOrderCounts(phones: (string | null)[]): Promise<Map<string, number>> {
  const keys = [...new Set(phones.map(phoneKey).filter((k): k is string => Boolean(k)))];
  if (keys.length === 0) return new Map();

  const rows = await getDb()
    .select({ key, orders: sql<number>`count(*)::int` })
    .from(leads)
    .where(inArray(key, keys))
    .groupBy(key);

  return new Map(rows.map((r) => [r.key, r.orders]));
}

/** Той самий ключ, але для значень, які вже в руках у JS */
export function phoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : null;
}
