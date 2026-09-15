import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "./index";
import { parts, type Part } from "./schema";

export async function getParts(): Promise<Part[]> {
  return getDb().select().from(parts).orderBy(asc(parts.name), asc(parts.model));
}

/** Скільки грошей лежить на полиці — для каси й для розуміння запасів */
export async function getStockValue(): Promise<{ positions: number; items: number; value: number }> {
  const [row] = await getDb()
    .select({
      positions: sql<number>`count(*)::int`,
      items: sql<number>`coalesce(sum(${parts.qty}), 0)::int`,
      value: sql<number>`coalesce(sum(${parts.qty} * coalesce(${parts.unitCost}, 0)), 0)::int`,
    })
    .from(parts);

  return row ?? { positions: 0, items: 0, value: 0 };
}

export async function addPart(input: {
  name: string;
  model: string | null;
  qty: number;
  unitCost: number | null;
  minQty: number;
}): Promise<void> {
  await getDb().insert(parts).values(input);
}

/**
 * Зміна залишку на ±1 — саме так склад і живе: поставили деталь у телефон,
 * привезли партію. Нижче нуля не опускаємось: від'ємний залишок нічого
 * не означає, а плутає.
 */
export async function shiftPartQty(id: string, delta: number): Promise<void> {
  await getDb()
    .update(parts)
    .set({ qty: sql`greatest(0, ${parts.qty} + ${delta})` })
    .where(eq(parts.id, id));
}

export async function removePart(id: string): Promise<void> {
  await getDb().delete(parts).where(eq(parts.id, id));
}
