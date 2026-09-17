"use client";

import { useState } from "react";
import { deleteLead } from "./actions";
import styles from "./DeleteLead.module.css";

/**
 * Видалення заявки на вимогу клієнта.
 *
 * Два кроки замість вікна підтвердження: вікно браузера легко закрити
 * навмання, а тут треба свідомо натиснути вдруге. Передумав — кнопка
 * сама повертається у звичайний стан.
 */
export default function DeleteLead({ id, orderNo }: { id: string; orderNo: number }) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button type="button" className={styles.button} onClick={() => setArmed(true)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 7h14" />
          <path d="M9 7V5h6v2" />
          <path d="M7 7l1 13h8l1-13" />
        </svg>
        Видалити дані
      </button>
    );
  }

  return (
    <span className={styles.confirm}>
      <span className={styles.warn}>№&#8202;{orderNo} — назовсім, разом із листуванням і фото</span>

      <form action={deleteLead}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className={styles.yes}>
          Так, видалити
        </button>
      </form>

      <button type="button" className={styles.no} onClick={() => setArmed(false)}>
        Скасувати
      </button>
    </span>
  );
}
