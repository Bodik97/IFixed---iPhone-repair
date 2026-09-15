"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PERIODS, type Range } from "./period";
import styles from "./page.module.css";

/**
 * Період: готові проміжки й календар для довільних дат.
 *
 * Дати застосовуються кнопкою, а не одразу після вибору: інакше сторінка
 * перезавантажувалась після першої ж дати, ще до того, як майстер обрав другу.
 *
 * Пресети лишаються миттєвими — там вибір уже завершений одним дотиком.
 */
export default function PeriodFilter({ range }: { range: Range }) {
  const router = useRouter();

  const [from, setFrom] = useState(range.fromDay);
  const [to, setTo] = useState(range.toDay);

  const changed = from !== range.fromDay || to !== range.toDay;

  const apply = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(params.toString() ? `/admin/groshi?${params}` : "/admin/groshi");
  };

  return (
    <div className={styles.period}>
      <div className={styles.presets}>
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={range.label === p.label ? styles.presetOn : styles.preset}
            onClick={() => router.push(`/admin/groshi?period=${p.value}`)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <form className={styles.dates} onSubmit={apply}>
        <label className={styles.dateField}>
          <span className={styles.dateLabel}>з</span>
          <input
            type="date"
            className={`field ${styles.date}`}
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>

        <label className={styles.dateField}>
          <span className={styles.dateLabel}>по</span>
          <input
            type="date"
            className={`field ${styles.date}`}
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>

        <button type="submit" className={changed ? styles.applyOn : styles.apply} disabled={!changed}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          Застосувати
        </button>
      </form>
    </div>
  );
}
