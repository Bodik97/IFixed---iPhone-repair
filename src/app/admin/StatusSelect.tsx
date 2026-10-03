"use client";

import { useOptimistic, useTransition } from "react";
import { setStatus } from "./actions";
import { STATUS_OPTIONS } from "@/data/leadStatus";
import type { Lead } from "@/db/schema";
import styles from "./page.module.css";

type Status = Lead["status"];

/**
 * Наступний крок ремонту — одна кнопка замість розгортання списку.
 * Доставку окремим кроком не даємо: «Відправлено» ставиться разом із ТТН.
 */
function nextStep(status: Status, delivery: boolean): { to: Status; label: string } | null {
  switch (status) {
    case "new":
      return { to: "in_progress", label: "Взяти в роботу" };
    case "in_progress":
      return { to: "ready", label: "Готово" };
    case "ready":
      return delivery ? null : { to: "done", label: "Видано клієнту" };
    case "shipped":
      return { to: "done", label: "Завершити" };
    default:
      return null;
  }
}

/**
 * Статус заявки. Зміна видна одразу — сервер підтверджує у фоні: на
 * мобільному інтернеті пауза до відповіді змушувала натискати вдруге.
 * Список лишається для нетипового: відмова, крок назад.
 */
export default function StatusSelect({
  id,
  status,
  delivery = false,
}: {
  id: string;
  status: Status;
  /** Клієнт просив надіслати — після «Готово» далі йде ТТН, а не видача */
  delivery?: boolean;
}) {
  const [shown, setShown] = useOptimistic(status);
  const [, startTransition] = useTransition();

  const change = (to: Status) => {
    if (to === shown) return;
    const form = new FormData();
    form.set("id", id);
    form.set("status", to);
    startTransition(async () => {
      setShown(to);
      await setStatus(form);
    });
  };

  const next = nextStep(shown, delivery);

  return (
    <div className={styles.statusControl}>
      {next && (
        <button type="button" className={styles.nextStep} onClick={() => change(next.to)}>
          {next.label}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      )}

      <label className="visually-hidden" htmlFor={`status-${id}`}>
        Статус заявки
      </label>
      <select
        id={`status-${id}`}
        value={shown}
        className={`${styles.status} ${styles[`st_${shown}`]}`}
        onChange={(e) => change(e.target.value as Status)}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
