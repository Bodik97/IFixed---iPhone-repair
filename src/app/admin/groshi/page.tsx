import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import { getMoney, monthStart } from "@/db/adminStats";
import { isAdmin } from "@/lib/admin";
import styles from "./page.module.css";
import shared from "../page.module.css";

export const metadata: Metadata = {
  title: "Гроші — адміністрування",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const uah = (n: number) => `${n.toLocaleString("uk-UA")} ₴`;

const monthName = new Intl.DateTimeFormat("uk-UA", { month: "long", year: "numeric" });

/** Скільки місяців показуємо в історії */
const MONTHS = 6;

export default async function MoneyPage() {
  if (!(await isAdmin())) redirect("/admin/vhid");

  // Кожен місяць — окремий проміжок [початок, початок наступного)
  const months = await Promise.all(
    Array.from({ length: MONTHS }, (_, i) => i).map(async (back) => ({
      from: monthStart(back),
      money: await getMoney(monthStart(back), back === 0 ? undefined : monthStart(back - 1)),
    })),
  );

  const current = months[0];
  const previous = months[1];

  // На скільки відсотків місяць відрізняється від попереднього
  const delta =
    previous && previous.money.profit > 0
      ? Math.round(((current.money.profit - previous.money.profit) / previous.money.profit) * 100)
      : null;

  const best = Math.max(...months.map((m) => m.money.profit), 1);
  const anyMoney = months.some((m) => m.money.jobs > 0);

  return (
    <section className={shared.wrap}>
      <div className={shared.head}>
        <div>
          <BackButton fallback="/admin" />
          <h1 className={shared.title}>Гроші</h1>
          <p className={shared.sectionNote}>
            Рахуємо за датою оплати, а не за датою заявки: ремонт, прийнятий торік і оплачений
            цього місяця, належить цьому місяцю.
          </p>
        </div>
      </div>

      <div className={styles.big}>
        <div className={styles.bigItem}>
          <span className={styles.bigLabel}>Оплачено цього місяця</span>
          <span className={styles.bigValue}>{uah(current.money.revenue)}</span>
        </div>
        <div className={styles.bigItem}>
          <span className={styles.bigLabel}>Деталі</span>
          <span className={styles.bigValue}>
            {current.money.cost > 0 ? "−" : ""}
            {uah(current.money.cost)}
          </span>
        </div>
        <div className={styles.bigItemAccent}>
          <span className={styles.bigLabel}>
            Чистими
            {delta !== null && (
              <span className={delta >= 0 ? styles.up : styles.down}>
                {delta >= 0 ? "+" : ""}
                {delta}% до минулого
              </span>
            )}
          </span>
          <span className={styles.bigProfit}>{uah(current.money.profit)}</span>
        </div>
        <div className={styles.bigItem}>
          <span className={styles.bigLabel}>Оплачених ремонтів</span>
          <span className={styles.bigValue}>{current.money.jobs}</span>
        </div>
      </div>

      <h2 className={styles.h2}>Останні {MONTHS} місяців</h2>

      {anyMoney ? (
        <div className={styles.table}>
          {months.map((m) => {
            const label = monthName.format(m.from);
            const width = Math.max(2, Math.round((m.money.profit / best) * 100));

            return (
              <div key={label} className={styles.row}>
                <span className={styles.month}>{label}</span>

                <span className={styles.bar} aria-hidden="true">
                  <span className={styles.barFill} style={{ width: `${width}%` }} />
                </span>

                <span className={styles.cell}>
                  <span className={styles.cellLabel}>оплачено</span>
                  {uah(m.money.revenue)}
                </span>
                <span className={styles.cell}>
                  <span className={styles.cellLabel}>деталі</span>
                  {m.money.cost > 0 ? "−" : ""}
                  {uah(m.money.cost)}
                </span>
                <span className={styles.cellStrong}>
                  <span className={styles.cellLabel}>чистими</span>
                  {uah(m.money.profit)}
                </span>
                <span className={styles.cell}>
                  <span className={styles.cellLabel}>ремонтів</span>
                  {m.money.jobs}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={shared.empty}>
          Поки нічого не оплачено. Впишіть ціну в заявці й позначте «оплачено» — суми зʼявляться
          тут.
        </div>
      )}
    </section>
  );
}
