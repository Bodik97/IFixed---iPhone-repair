import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { leads } from "@/db/schema";
import { describeStatus, findLeads, STATUS_OPTIONS } from "@/db/leads";
import { getAllReviews } from "@/db/reviews";
import { leadEvents } from "@/db/schema";
import { asc, count, inArray } from "drizzle-orm";
import { isAdmin } from "@/lib/admin";
import { signOut } from "./actions";
import NoteField from "./NoteField";
import Search, { adminHref, type Query } from "./Search";
import ReviewList from "./ReviewList";
import StatusSelect from "./StatusSelect";
import TtnField from "./TtnField";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Заявки — адміністрування",
  robots: { index: false, follow: false },
};

// Список має бути свіжим завжди
export const dynamic = "force-dynamic";

const sourceLabel: Record<string, string> = {
  landing: "головна",
  model: "модель",
  services: "послуги",
  "mail-in": "поштою",
};

const dateFormat = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Заявок на сторінці — щоб база не віддавала все одразу, коли їх стануть сотні */
const PER_PAGE = 20;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string; shipping?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  // Невідомий статус із адреси ігноруємо, щоб фільтр не міг зламати вибірку
  const status = STATUS_OPTIONS.some((o) => o.value === params.status)
    ? (params.status as (typeof STATUS_OPTIONS)[number]["value"])
    : undefined;

  const query: Query = { q: params.q, status, shipping: params.shipping };

  const [{ rows, found }, [{ total }], allReviews] = await Promise.all([
    findLeads({ q: params.q, status, shipping: Boolean(params.shipping), page, perPage: PER_PAGE }),
    getDb().select({ total: count() }).from(leads),
    getAllReviews(),
  ]);

  const pages = Math.max(1, Math.ceil(found / PER_PAGE));

  const pendingReviews = allReviews.filter((r) => !r.published).length;

  // Хроніка одним запитом на всі заявки, а не по одному на кожну
  const events = rows.length
    ? await getDb()
        .select()
        .from(leadEvents)
        .where(inArray(leadEvents.leadId, rows.map((r) => r.id)))
        .orderBy(asc(leadEvents.createdAt))
    : [];

  const eventsByLead = new Map<string, typeof events>();
  for (const e of events) {
    const list = eventsByLead.get(e.leadId) ?? [];
    list.push(e);
    eventsByLead.set(e.leadId, list);
  }

  // Рахуємо по всій базі, а не по сторінці — інакше цифри брехали б
  const [[{ fresh }], [{ toShip }]] = await Promise.all([
    getDb().select({ fresh: count() }).from(leads).where(eq(leads.status, "new")),
    getDb()
      .select({ toShip: count() })
      .from(leads)
      .where(and(eq(leads.deliveryRequested, true), isNull(leads.ttn))),
  ]);

  return (
    <section className={`container ${styles.wrap}`}>
      <div className={styles.head}>
        <div>
          <div className="kicker">Адміністрування</div>
          <h1 className={styles.title}>Заявки</h1>
        </div>

        <form action={signOut}>
          <button type="submit" className="btn btn-ghost">
            Вийти
          </button>
        </form>
      </div>

      {/* Лічильники рахуються по всій базі, не по сторінці — і кожен одразу фільтрує */}
      <div className={styles.summary}>
        <Link href="/admin" className={styles.stat}>
          <span className={styles.statValue}>{total}</span>
          <span className={styles.statLabel}>усього</span>
        </Link>
        <Link
          href={adminHref(query, { status: "new", shipping: "", page: 1 })}
          className={fresh > 0 ? styles.statHot : styles.stat}
        >
          <span className={styles.statValue}>{fresh}</span>
          <span className={styles.statLabel}>нових</span>
        </Link>
        <Link
          href={adminHref(query, { shipping: "1", status: "", page: 1 })}
          className={toShip > 0 ? styles.statHot : styles.stat}
        >
          <span className={styles.statValue}>{toShip}</span>
          <span className={styles.statLabel}>чекають відправки</span>
        </Link>
        <a href="#vidhuky" className={pendingReviews > 0 ? styles.statHot : styles.stat}>
          <span className={styles.statValue}>{pendingReviews}</span>
          <span className={styles.statLabel}>відгуки на перевірці</span>
        </a>
      </div>

      <Search query={query} found={found} />

      {rows.length === 0 ? (
        <div className={styles.empty}>
          {params.q || status || params.shipping
            ? "За цим запитом нічого не знайшли. Спробуйте інший або скиньте фільтр."
            : "Заявок ще немає."}
        </div>
      ) : (
        <div className={styles.cards}>
          {rows.map((r) => {
            const s = describeStatus(r.status);
            const waitingShip = r.deliveryRequested && !r.ttn;

            return (
              <article
                key={r.id}
                className={`${styles.card} ${r.status === "new" ? styles.cardNew : ""} ${waitingShip ? styles.cardShip : ""}`}
              >
                <div className={styles.cardMain}>
                  <div className={styles.cardTop}>
                    {/* Номер, який клієнт диктує по телефону — тримаємо першим */}
                    <span className={styles.orderNo}>№&#8202;{r.orderNo}</span>
                    <span className={styles.name}>{r.name}</span>
                    {r.clerkUserId ? (
                      <span className={styles.tagAccount} title="Бачить статус у своєму кабінеті">
                        кабінет
                      </span>
                    ) : (
                      <span className={styles.tagAnon} title="Без акаунта — пішло в Telegram">
                        анонім
                      </span>
                    )}
                    <span className={styles.when}>{dateFormat.format(r.createdAt)}</span>
                    <span className={styles.source}>{sourceLabel[r.source] ?? r.source}</span>
                  </div>

                  <div className={styles.contacts}>
                    {r.phone && (
                      <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className={styles.link}>
                        {r.phone}
                      </a>
                    )}
                    {r.email && (
                      <a href={`mailto:${r.email}`} className={styles.link}>
                        {r.email}
                      </a>
                    )}
                  </div>

                  {(r.model || r.service) && (
                    <div className={styles.what}>{r.model ?? r.service}</div>
                  )}
                  {r.problem && <p className={styles.problem}>{r.problem}</p>}

                  {/* Доставка: показуємо, лише коли клієнт її попросив */}
                  {r.deliveryRequested && (
                    <div className={waitingShip ? styles.shipBoxHot : styles.shipBox}>
                      <div className={styles.shipHead}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
                          <path d="M3 7l9 4 9-4" />
                          <path d="M12 11v10" />
                        </svg>
                        {waitingShip ? "Просить надіслати — ТТН не вписано" : "Відправлено"}
                      </div>

                      {r.deliveryAddress && (
                        <div className={styles.shipAddress}>{r.deliveryAddress}</div>
                      )}

                      <TtnField id={r.id} ttn={r.ttn} />
                    </div>
                  )}

                  {r.city && !r.deliveryRequested && <div className={styles.city}>{r.city}</div>}

                  <NoteField id={r.id} events={eventsByLead.get(r.id) ?? []} />
                </div>

                <div className={styles.cardSide}>
                  <StatusSelect id={r.id} status={r.status} />
                  <span className={styles.hint}>{s.hint}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <nav className={styles.pager} aria-label="Сторінки заявок">
          {page > 1 && (
            <Link href={adminHref(query, { page: page - 1 })} className="btn btn-ghost">
              Новіші
            </Link>
          )}
          <span className={styles.pagerInfo}>
            Сторінка {page} з {pages}
          </span>
          {page < pages && (
            <Link href={adminHref(query, { page: page + 1 })} className="btn btn-ghost">
              Старіші
            </Link>
          )}
        </nav>
      )}

      <div className={styles.reviewsHead}>
        <h2 id="vidhuky" className={styles.sectionTitle}>Відгуки</h2>
        <p className={styles.sectionNote}>
          Опубліковані показуються на головній. Нові чекають вашого схвалення.
        </p>
      </div>

      <ReviewList reviews={allReviews} />
    </section>
  );
}
