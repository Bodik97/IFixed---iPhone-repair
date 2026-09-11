import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import ActiveOrder from "@/components/account/ActiveOrder";
import History from "@/components/account/History";
import NewRepair from "@/components/account/NewRepair";
import SignOutButton from "@/components/account/SignOutButton";
import { describeStatus, getClientLeads } from "@/db/leads";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Кабінет клієнта",
  description: "Статус ремонту, історія заявок і гарантія на ваші пристрої.",
  robots: { index: false, follow: false },
};

// Статус може змінитися будь-коли — кешувати не можна
export const dynamic = "force-dynamic";

const dateShort = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short", year: "numeric" });

export default async function AccountPage() {
  // Маршрут закритий у middleware — сюди потрапляє лише авторизований клієнт
  const user = await currentUser();
  const name = user?.firstName?.trim();
  const email = user?.primaryEmailAddress?.emailAddress;

  const leads = user ? await getClientLeads(user.id, email) : [];
  const active = leads.find((l) => describeStatus(l.status).active);
  const done = leads.filter((l) => !describeStatus(l.status).active).length;

  const rows = leads.map((l) => {
    const p = describeStatus(l.status);
    return {
      id: l.id,
      what: l.model ?? l.service ?? "Ремонт",
      problem: l.problem,
      date: dateShort.format(l.createdAt),
      status: l.status,
      label: p.label,
      active: p.active,
    };
  });

  return (
    <>
      <section className={styles.hero}>
        <span aria-hidden="true" className={styles.heroBg}>
          <span className={styles.heroGlow} />
        </span>

        <div className={styles.heroInner}>
          <div className={styles.heroTop}>
            <div className="kicker">Кабінет</div>
            <SignOutButton />
          </div>

          <h1 className={`${styles.h1} nUp`}>Вітаємо!</h1>

          <p className={`${styles.heroLead} nUp nUp-1`}>
            {active
              ? "Один ремонт у роботі. Статус оновлюємо щоразу, коли щось змінюється."
              : leads.length > 0
                ? "Активних ремонтів немає. Нижче — ваші попередні заявки."
                : "Заявок поки немає. Залиште — і стежте за статусом тут."}
          </p>

          <p className={`${styles.signedAs} nUp nUp-1`}>
            Ви увійшли як {name ? <strong>{name}</strong> : null}
            {name && email ? " · " : null}
            {email}
          </p>
        </div>
      </section>

      {active && (
        <section className="container">
          <ActiveOrder lead={active} />
        </section>
      )}

      <section className={`container ${styles.tiles}`}>
        <div className={styles.tileGrid}>
          <div className={`card ${styles.tile}`}>
            <div className={styles.tileLabel}>Активні</div>
            <div className={styles.tileValue}>{active ? 1 : 0}</div>
            <div className={styles.tileNote}>
              {active ? (active.model ?? active.service ?? "у роботі") : "немає в роботі"}
            </div>
          </div>

          <div className={`card ${styles.tile}`}>
            <div className={styles.tileLabel}>Завершені</div>
            <div className={styles.tileValue}>{done}</div>
            <div className={styles.tileNote}>закриті заявки</div>
          </div>

          <div className={`card ${styles.tile}`}>
            <div className={styles.tileLabel}>Усього заявок</div>
            <div className={styles.tileValue}>{leads.length}</div>
            <div className={styles.tileNote}>за весь час</div>
          </div>
        </div>
      </section>

      {leads.length > 0 ? (
        <History rows={rows} />
      ) : (
        <section className={`container ${styles.emptyState}`}>
          <div className={styles.emptyBox}>
            <h2 className={styles.emptyTitle}>Тут з&apos;являться ваші ремонти</h2>
            <p className={styles.emptyText}>
              Залиште заявку — і побачите тут стадію, на якій зараз телефон, без дзвінків і
              очікування.
            </p>
            <Link href="/#book" className="btn btn-accent">
              Залишити заявку
            </Link>
          </div>
        </section>
      )}

      <section className={`container ${styles.bottom}`}>
        <div className={styles.bottomGrid}>
          <NewRepair />
        </div>
      </section>
    </>
  );
}
