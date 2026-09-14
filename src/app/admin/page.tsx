import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import { getCounters, getEventsFor, getMoney, monthStart } from "@/db/adminStats";
import { unreadByLead } from "@/db/messages";
import { leads } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import LeadCard from "./LeadCard";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Огляд — адміністрування",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Скільки заявок показати в «потребує уваги» — решта лишається у повному списку */
const ATTENTION = 5;

export default async function AdminOverview() {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const [counters, money, attention] = await Promise.all([
    getCounters(),
    getMoney(monthStart()),
    // Нові заявки й ті, що чекають ТТН — усе, що вимагає дії просто зараз
    getDb()
      .select()
      .from(leads)
      .where(
        or(
          eq(leads.status, "new"),
          and(eq(leads.deliveryRequested, true), isNull(leads.ttn)),
        ),
      )
      .orderBy(desc(leads.createdAt))
      .limit(ATTENTION),
  ]);

  const ids = attention.map((r) => r.id);
  const [eventsByLead, unread] = await Promise.all([
    getEventsFor(ids),
    unreadByLead(ids, "client"),
  ]);
  const uah = (n: number) => `${n.toLocaleString("uk-UA")} ₴`;

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <div className="kicker">Адміністрування</div>
          <h1 className={styles.title}>Огляд</h1>
        </div>
      </div>

      <div className={styles.summary}>
        <Link href="/admin/zayavky" className={styles.stat}>
          <span className={styles.statValue}>{counters.total}</span>
          <span className={styles.statLabel}>заявок усього</span>
        </Link>
        <Link
          href="/admin/zayavky?status=new"
          className={counters.fresh > 0 ? styles.statHot : styles.stat}
        >
          <span className={styles.statValue}>{counters.fresh}</span>
          <span className={styles.statLabel}>нових</span>
        </Link>
        <Link
          href="/admin/zayavky?shipping=1"
          className={counters.toShip > 0 ? styles.statHot : styles.stat}
        >
          <span className={styles.statValue}>{counters.toShip}</span>
          <span className={styles.statLabel}>чекають відправки</span>
        </Link>
        <Link href="/admin/groshi" className={styles.stat}>
          <span className={styles.statValue}>{uah(money.profit)}</span>
          <span className={styles.statLabel}>чистими за місяць</span>
        </Link>
      </div>

      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Потребує уваги</h2>
        <Link href="/admin/zayavky" className="btn btn-ghost">
          Усі заявки
        </Link>
      </div>

      {attention.length === 0 ? (
        <div className={styles.empty}>
          Нових заявок немає, все відправлено. Можна видихнути.
        </div>
      ) : (
        <div className={styles.cards}>
          {attention.map((r) => (
            <LeadCard
              key={r.id}
              lead={r}
              events={eventsByLead.get(r.id) ?? []}
              unread={unread.get(r.id) ?? 0}
            />
          ))}
        </div>
      )}
    </section>
  );
}
