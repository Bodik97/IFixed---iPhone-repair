"use client";

import { useRouter } from "next/navigation";
import { STATUS_OPTIONS } from "@/db/leads";
import { adminHref, type Query } from "./Search";
import styles from "./Search.module.css";

/**
 * Статус як випадаючий список, а не ряд чипів.
 *
 * Чипи займали два рядки й на телефоні їхали вбік; майстру ж потрібен
 * один рух — відкрив, обрав, список перезавантажився.
 *
 * «Чекають відправки» живе тут же, хоч це й інший параметр: для майстра
 * це такий самий стан роботи, і тримати його окремою кнопкою немає сенсу.
 */
const SHIPPING = "shipping";

export default function StatusFilter({ query }: { query: Query }) {
  const router = useRouter();

  const value = query.shipping ? SHIPPING : (query.status ?? "");

  return (
    <label className={styles.status}>
      <span className={styles.statusLabel}>Статус</span>

      <select
        className={`field ${styles.select}`}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          router.push(
            v === SHIPPING
              ? adminHref(query, { shipping: "1", status: "", page: 1 })
              : adminHref(query, { status: v, shipping: "", page: 1 }),
          );
        }}
      >
        <option value="">Усі заявки</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
        <option value={SHIPPING}>Чекають відправки</option>
      </select>
    </label>
  );
}
