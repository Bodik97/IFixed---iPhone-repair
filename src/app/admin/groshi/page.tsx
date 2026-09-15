import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMoney, getOutstanding, monthStart } from "@/db/adminStats";
import { isAdmin } from "@/lib/admin";
import PeriodFilter from "./PeriodFilter";
import { isPeriod, periodLabel, periodRange } from "./period";
import styles from "./page.module.css";
import shared from "../page.module.css";

export const metadata: Metadata = {
  title: "Каса — адміністрування",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const uah = (n: number) => `${n.toLocaleString("uk-UA")} ₴`;

const monthName = new Intl.DateTimeFormat("uk-UA", { month: "long", year: "numeric" });

/** Скільки місяців показуємо в історії */
const MONTHS = 6;

export default async function MoneyPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const raw = (await searchParams).period;
  const period = isPeriod(raw) ? raw : "month";
  const { from, to } = periodRange(period);

  const [chosen, owed] = await Promise.all([getMoney(from, to), getOutstanding()]);
  // Середній чек рахуємо від чистого: скільки в середньому лишається з роботи
  const average = chosen.jobs > 0 ? Math.round(chosen.profit / chosen.jobs) : 0;

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
          <h1 className={shared.title}>Каса</h1>
          <p className={shared.sectionNote}>
            Рахуємо за датою оплати, а не за датою заявки: ремонт, прийнятий торік і оплачений
            цього місяця, належить цьому місяцю.
          </p>
        </div>
      </div>

      <div className={styles.tools}>
        <PeriodFilter value={period} />

        <a
          href={`/admin/groshi/csv?period=${period}`}
          className="btn btn-ghost"
          download
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 4v11" />
            <path d="M8 11l4 4 4-4" />
            <path d="M5 19h14" />
          </svg>
          Вивантажити
        </a>
      </div>

      <div className={styles.big}>
        <div className={styles.bigItem}>
          <span className={styles.bigLabel}>Оплачено · {periodLabel(period).toLowerCase()}</span>
          <span className={styles.bigValue}>{uah(chosen.revenue)}</span>
        </div>
        <div className={styles.bigItem}>
          <span className={styles.bigLabel}>Деталі</span>
          <span className={styles.bigValue}>
            {chosen.cost > 0 ? "−" : ""}
            {uah(chosen.cost)}
          </span>
        </div>
        <div className={styles.bigItemAccent}>
          <span className={styles.bigLabel}>
            Чистими
            {period === "month" && delta !== null && (
              <span className={delta >= 0 ? styles.up : styles.down}>
                {delta >= 0 ? "+" : ""}
                {delta}% до минулого
              </span>
            )}
          </span>
          <span className={styles.bigProfit}>{uah(chosen.profit)}</span>
        </div>
        <div className={styles.bigItem}>
          <span className={styles.bigLabel}>Ремонтів · у середньому</span>
          <span className={styles.bigValue}>
            {chosen.jobs} <span className={styles.sub}>· {uah(average)}</span>
          </span>
        </div>
      </div>

      {owed.jobs > 0 && (
        <div className={styles.owed}>
          <div>
            <span className={styles.owedLabel}>Очікує оплати</span>
            <span className={styles.owedValue}>{uah(owed.due)}</span>
          </div>
          <p className={styles.owedNote}>
            {owed.jobs} {owed.jobs === 1 ? "робота з виставленою ціною" : "робіт з виставленою ціною"}{" "}
            ще не позначені як оплачені
            {owed.prepaid > 0 && <> · з них уже внесено передоплат на {uah(owed.prepaid)}</>}.
          </p>
        </div>
      )}

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
