"use client";

import { useCallback, useId, useSyncExternalStore } from "react";
import styles from "./Guide.module.css";

/**
 * «Як користуватись кабінетом» — коротка памʼятка вгорі сторінки.
 *
 * Розгорнута, доки людина сама її не згорне; вибір живе в localStorage, щоб
 * не показувати те саме щоразу. useSyncExternalStore робить читання безпечним
 * для гідрації — до першого рендера на клієнті памʼятка вважається розгорнутою.
 */
const STORAGE_KEY = "gadgetfix-cabinet-guide";

let listeners: (() => void)[] = [];

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function readClosed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "closed";
  } catch {
    // Приватне вікно або заблоковане сховище — лишаємо розгорнутою
    return false;
  }
}

function writeClosed(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "closed" : "open");
  } catch {
    // Не змогли запамʼятати — стан діє до кінця сеансу
  }
  for (const l of listeners) l();
}

/** Що де в кабінеті — словами того, хто зайшов сюди вперше */
const tips: { title: string; text: string }[] = [
  {
    title: "Етап ремонту",
    text: "У блоці «Зараз у роботі» видно, що відбувається з пристроєм. Сторінка оновлюється сама — перезавантажувати не треба.",
  },
  {
    title: "Питання майстру",
    text: "Кнопка «Написати майстру» в картці ремонту. Можна додати фото; відповідь прийде сюди ж.",
  },
  {
    title: "Сповіщення в Telegram",
    text: "Натисніть «Статус у Telegram» і «Start» у боті — він сам напише про кожен етап і про ціну.",
  },
  {
    title: "Коли пристрій готовий",
    text: "Заберіть його в сервісі або замовте доставку Новою Поштою — кнопка зʼявиться в картці ремонту.",
  },
  {
    title: "Гарантія й історія",
    text: "Нижче на сторінці — до якої дати діє гарантія на кожен пристрій і всі ваші завершені ремонти.",
  },
];

export default function Guide() {
  const closed = useSyncExternalStore(subscribe, readClosed, () => false);
  const toggle = useCallback(() => writeClosed(!closed), [closed]);
  const listId = useId();

  return (
    <section className={styles.guide} aria-label="Як користуватись кабінетом">
      <button type="button" className={styles.toggle} aria-expanded={!closed} aria-controls={listId} onClick={toggle}>
        <span className={styles.title}>Як користуватись кабінетом</span>
        <span className={styles.action}>
          {closed ? "Показати" : "Згорнути"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={closed ? "M6 9l6 6 6-6" : "M6 15l6-6 6 6"} />
          </svg>
        </span>
      </button>

      {!closed && (
        <dl id={listId} className={styles.list}>
          {tips.map((t) => (
            <div key={t.title} className={styles.tip}>
              <dt>{t.title}</dt>
              <dd>{t.text}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
