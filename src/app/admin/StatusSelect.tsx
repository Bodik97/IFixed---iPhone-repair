"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setStatus } from "./actions";
import TtnField from "./TtnField";
import { STATUS_OPTIONS } from "@/data/leadStatus";
import type { Lead } from "@/db/schema";
import styles from "./page.module.css";

type Status = Lead["status"];

/**
 * Наступний крок ремонту — одна кнопка замість розгортання списку.
 * Після «Готово» шляхів два: видати в руки або відправити. Відправку окремим
 * кроком не даємо — «Відправлено» ставиться разом із ТТН.
 */
function nextStep(status: Status): { to: Status; label: string } | null {
  switch (status) {
    case "new":
      return { to: "in_progress", label: "Взяти в роботу" };
    case "in_progress":
      return { to: "ready", label: "Готово" };
    case "ready":
      return { to: "done", label: "Видано клієнту" };
    case "shipped":
      return { to: "done", label: "Клієнт отримав — почати гарантію" };
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
  ttn = null,
}: {
  id: string;
  status: Status;
  /** Клієнт просив надіслати — поле ТТН відкрите одразу, без кнопки «Відправити» */
  delivery?: boolean;
  ttn?: string | null;
}) {
  const [shown, setShown] = useOptimistic(status);
  const [, startTransition] = useTransition();
  const [shipping, setShipping] = useState(false);

  const change = (to: Status) => {
    if (to === shown) return;
    // «Відправлено» без накладної клієнту нічого не дає: спершу просимо ТТН,
    // а статус поставить уже її збереження
    if (to === "shipped" && !ttn) {
      setShipping(true);
      return;
    }
    const form = new FormData();
    form.set("id", id);
    form.set("status", to);
    startTransition(async () => {
      setShown(to);
      await setStatus(form);
    });
  };

  const next = nextStep(shown);
  const canShip = shown === "ready" && !ttn;
  const ttnOpen = canShip && (shipping || delivery);

  return (
    <div className={styles.statusControl}>
      {next && (
        <button type="button" className={`${styles.nextStep} accent-edge`} onClick={() => change(next.to)}>
          {next.label}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      )}

      {canShip && !ttnOpen && (
        <button type="button" className={styles.nextAlt} onClick={() => setShipping(true)}>
          Відправити Новою Поштою
        </button>
      )}

      {ttnOpen && (
        <div className={styles.shipNow}>
          <span className={styles.hint}>Впишіть ТТН — статус стане «Відправлено», клієнт отримає номер.</span>
          <TtnField id={id} ttn={ttn} autoFocus={shipping} />
        </div>
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
