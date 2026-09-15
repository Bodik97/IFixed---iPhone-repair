"use client";

import { useRouter } from "next/navigation";
import { PERIODS, type PeriodValue } from "./period";
import styles from "./page.module.css";

/** Період, за який показуємо касу. Перемикання одразу перезавантажує цифри. */
export default function PeriodFilter({ value }: { value: PeriodValue }) {
  const router = useRouter();

  return (
    <label className={styles.period}>
      <span className={styles.periodLabel}>Період</span>

      <select
        className={`field ${styles.periodSelect}`}
        value={value}
        onChange={(e) => router.push(`/admin/groshi?period=${e.target.value}`)}
      >
        {PERIODS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </label>
  );
}
