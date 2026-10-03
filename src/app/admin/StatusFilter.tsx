"use client";

import { useRouter } from "next/navigation";
import { ARCHIVED, STATUS_OPTIONS } from "@/data/leadStatus";
import { adminHref, type ListKind, type Query } from "./Search";
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

export default function StatusFilter({ query, kind }: { query: Query; kind: ListKind }) {
  const router = useRouter();

  const value = query.shipping ? SHIPPING : (query.status ?? "");

  // Закриті статуси живуть в архіві, робочі — у списку заявок
  const options = STATUS_OPTIONS.filter((s) => ARCHIVED.includes(s.value) === (kind === "archive"));

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
              ? adminHref(query, { shipping: "1", status: "", page: 1 }, kind)
              : adminHref(query, { status: v, shipping: "", page: 1 }, kind),
          );
        }}
      >
        <option value="">{kind === "archive" ? "Усі закриті" : "Усі в роботі"}</option>
        {options.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
        {kind === "active" && <option value={SHIPPING}>Чекають відправки</option>}
      </select>
    </label>
  );
}
