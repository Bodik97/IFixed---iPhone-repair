"use client";

import { useState } from "react";
import styles from "./Parcel.module.css";

const trackUrl = (ttn: string) =>
  `https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(ttn)}`;

/**
 * Посилка з готовим пристроєм. Номер накладної — те, що клієнт копіює й вставляє
 * у застосунок Нової Пошти, тож кнопка копіювання тут не прикраса.
 */
export default function Parcel({ ttn, address }: { ttn: string; address: string | null }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ttn);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Буфер недоступний (http або відмова в дозволі) — номер видно й так
    }
  };

  return (
    <div className={styles.box}>
      <div className={styles.head}>
        <span className={styles.icon} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
            <path d="M3 7l9 4 9-4" />
            <path d="M12 11v10" />
          </svg>
        </span>
        <div>
          <div className={styles.title}>Відстеження посилки</div>
          {address && <div className={styles.address}>{address}</div>}
        </div>
      </div>

      <div className={styles.ttnRow}>
        <div className={styles.ttnField}>
          <span className={styles.ttnLabel}>Накладна Нової Пошти</span>
          <span className={styles.ttn}>{ttn}</span>
        </div>

        <button type="button" className={styles.copy} onClick={copy}>
          {copied ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h8" />
            </svg>
          )}
          {copied ? "Скопійовано" : "Копіювати"}
        </button>
      </div>

      <a href={trackUrl(ttn)} target="_blank" rel="noopener" className={`btn btn-accent ${styles.track}`}>
        Відстежити на Новій Пошті
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 17L17 7" />
          <path d="M9 7h8v8" />
        </svg>
      </a>
    </div>
  );
}
