import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { signOut } from "./actions";
import StatusSelect from "./StatusSelect";
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

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const rows = await getDb().select().from(leads).orderBy(desc(leads.createdAt));
  const fresh = rows.filter((r) => r.status === "new").length;

  return (
    <section className={`container ${styles.wrap}`}>
      <div className={styles.head}>
        <div>
          <div className="kicker">Адміністрування</div>
          <h1 className={styles.title}>
            Заявки <span className={styles.count}>{rows.length}</span>
          </h1>
          {fresh > 0 && <p className={styles.fresh}>Нових: {fresh}</p>}
        </div>

        <form action={signOut}>
          <button type="submit" className="btn btn-ghost">
            Вийти
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className={styles.empty}>Заявок ще немає.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Коли</th>
                <th>Клієнт</th>
                <th>Контакт</th>
                <th>Що треба</th>
                <th>Проблема</th>
                <th>Звідки</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={r.status === "new" ? styles.rowNew : undefined}>
                  <td className={styles.nowrap}>{dateFormat.format(r.createdAt)}</td>
                  <td>
                    {r.name}
                    {r.clerkUserId ? (
                      <span className={styles.tagAccount} title="Клієнт бачить статус у своєму кабінеті">
                        кабінет
                      </span>
                    ) : (
                      <span className={styles.tagAnon} title="Без акаунта — сповіщення пішло в Telegram">
                        анонім
                      </span>
                    )}
                  </td>
                  <td className={styles.contact}>
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
                    {r.city && <span className={styles.muted}>{r.city}</span>}
                  </td>
                  <td>{r.model ?? r.service ?? "—"}</td>
                  <td className={styles.problem}>{r.problem || "—"}</td>
                  <td className={styles.nowrap}>{sourceLabel[r.source] ?? r.source}</td>
                  <td>
                    <StatusSelect id={r.id} status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
