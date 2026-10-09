import { and, count, desc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import { getDb } from "./index";
import { leads, siteEvents } from "./schema";

/**
 * Статистика сайту для адмінки. Усе рахується за проміжок [from, to).
 *
 * «Відвідувачі» — кількість різних денних ідентифікаторів: людина, яка
 * зайшла у два різні дні, порахована двічі (див. site_events у схемі).
 */

const visitors = sql<number>`count(distinct ${siteEvents.visitor})::int`;

const inRange = (from: Date, to?: Date) =>
  to ? and(gte(siteEvents.at, from), lt(siteEvents.at, to)) : gte(siteEvents.at, from);

export type SiteStats = {
  views: number;
  visitors: number;
  pages: { path: string; views: number; visitors: number }[];
  clicks: { name: string; clicks: number; visitors: number }[];
  sources: { source: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
  funnel: { visitors: number; intent: number; leads: number; repairs: number };
};

/** Заявки, що дійшли до роботи: майстер узяв пристрій або вже закінчив */
const REPAIR_STATUSES = ["in_progress", "ready", "shipped", "done"] as const;

export async function getSiteStats(from: Date, to?: Date): Promise<SiteStats> {
  const db = getDb();
  const range = inRange(from, to);
  const viewsOnly = and(range, eq(siteEvents.kind, "view"));

  // Заявки з сайту за той самий проміжок; заведені майстром вручну — не воронка сайту
  const leadRange = and(
    to ? and(gte(leads.createdAt, from), lt(leads.createdAt, to)) : gte(leads.createdAt, from),
    ne(leads.source, "manual"),
  );

  const [[totals], pages, clicks, sources, devices, [intent], [leadCount], [repairs]] = await Promise.all([
    db.select({ views: count(), visitors }).from(siteEvents).where(viewsOnly),
    db
      .select({ path: siteEvents.path, views: count(), visitors })
      .from(siteEvents)
      .where(viewsOnly)
      .groupBy(siteEvents.path)
      .orderBy(desc(count()))
      .limit(15),
    db
      .select({ name: sql<string>`${siteEvents.name}`, clicks: count(), visitors })
      .from(siteEvents)
      .where(and(range, eq(siteEvents.kind, "click")))
      .groupBy(siteEvents.name)
      .orderBy(desc(count())),
    db
      .select({
        source: sql<string>`coalesce(${siteEvents.utm}, ${siteEvents.referrer}, '')`,
        visitors,
      })
      .from(siteEvents)
      .where(viewsOnly)
      .groupBy(sql`1`)
      .orderBy(desc(visitors))
      .limit(12),
    db
      .select({ device: siteEvents.device, visitors })
      .from(siteEvents)
      .where(viewsOnly)
      .groupBy(siteEvents.device)
      .orderBy(desc(visitors)),
    // Намір записатись: натиснули будь-яку кнопку запису
    db
      .select({ n: visitors })
      .from(siteEvents)
      .where(and(range, eq(siteEvents.kind, "click"), sql`${siteEvents.name} like '%book%'`)),
    db.select({ n: count() }).from(leads).where(leadRange),
    db
      .select({ n: count() })
      .from(leads)
      .where(and(leadRange, inArray(leads.status, [...REPAIR_STATUSES]))),
  ]);

  return {
    views: totals.views,
    visitors: totals.visitors,
    pages,
    clicks,
    sources,
    devices,
    funnel: { visitors: totals.visitors, intent: intent.n, leads: leadCount.n, repairs: repairs.n },
  };
}
