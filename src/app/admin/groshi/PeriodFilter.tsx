"use client";

import { useRouter } from "next/navigation";
import { PERIODS, type Range } from "./period";
import styles from "./page.module.css";

/**
 * Період: готові проміжки й календар для довільних дат.
 *
 * Пресети — це швидкий спосіб заповнити ті самі дати, тому після натискання
 * вони одразу видно в полях: майстер бачить, за що саме дивиться.
 */
export default function PeriodFilter({ range }: { range: Range }) {
  const router = useRouter();

  const go = (from: string, to: string) => {
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

      <div className={styles.dates}>
        <label className={styles.dateField}>
          <span className={styles.dateLabel}>з</span>
          <input
            type="date"
            className={`field ${styles.date}`}
            value={range.fromDay}
            onChange={(e) => go(e.target.value, range.toDay)}
          />
        </label>

        <label className={styles.dateField}>
          <span className={styles.dateLabel}>по</span>
          <input
            type="date"
            className={`field ${styles.date}`}
            value={range.toDay}
            onChange={(e) => go(range.fromDay, e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
