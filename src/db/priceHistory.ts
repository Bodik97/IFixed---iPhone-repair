import { and, isNotNull, sql } from "drizzle-orm";
import { getDb } from "./index";
import { leads } from "./schema";

/**
 * За скільки ми вже робили те саме.
 *
 * Ціну майстер виставляє з пам'яті, і на однакову роботу вона щоразу трохи
 * інша. Підказка з попередніх ремонтів вирівнює прайс і прискорює відповідь
 * клієнту: «заміна екрана на 13-ту — 2 800, як минулого разу».
 */
export type PriceHint = {
  count: number;
  last: number;
  min: number;
  max: number;
};

/** Ключ підказки — пара «модель + послуга», обидві як їх записано в заявці */
export function hintKey(model: string | null, service: string | null): string | null {
  const m = model?.trim();
  const s = service?.trim();
  return m && s ? `${m}|${s}` : null;
}

export async function getPriceHints(): Promise<Map<string, PriceHint>> {
  const rows = await getDb()
    .select({
      model: leads.model,
      service: leads.service,
      count: sql<number>`count(*)::int`,
      last: sql<number>`(array_agg(${leads.price} order by ${leads.createdAt} desc))[1]::int`,
      min: sql<number>`min(${leads.price})::int`,
      max: sql<number>`max(${leads.price})::int`,
    })
    .from(leads)
    .where(and(isNotNull(leads.price), isNotNull(leads.model), isNotNull(leads.service)))
    .groupBy(leads.model, leads.service);

  const map = new Map<string, PriceHint>();
  for (const r of rows) {
    const key = hintKey(r.model, r.service);
    if (key) map.set(key, { count: r.count, last: r.last, min: r.min, max: r.max });
  }

  return map;
}
