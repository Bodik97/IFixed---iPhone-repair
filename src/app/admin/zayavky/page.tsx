import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import { getEventsFor } from "@/db/adminStats";
import { findLeads, STATUS_OPTIONS } from "@/db/leads";
import { isAdmin } from "@/lib/admin";
import LeadCard from "../LeadCard";
import Search, { adminHref, type Query } from "../Search";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Заявки — адміністрування",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Заявок на сторінці — щоб база не віддавала все одразу, коли їх стануть сотні */
const PER_PAGE = 20;

export default async function LeadsPage({
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

  const { rows, found } = await findLeads({
    q: params.q,
    status,
    shipping: Boolean(params.shipping),
    page,
    perPage: PER_PAGE,
  });

  const pages = Math.max(1, Math.ceil(found / PER_PAGE));
  const eventsByLead = await getEventsFor(rows.map((r) => r.id));

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <BackButton fallback="/admin" />
          <h1 className={styles.title}>Заявки</h1>
        </div>
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
          {rows.map((r) => (
            <LeadCard key={r.id} lead={r} events={eventsByLead.get(r.id) ?? []} />
          ))}
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
    </section>
  );
}
