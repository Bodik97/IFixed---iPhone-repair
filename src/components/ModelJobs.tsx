"use client";

import { useState } from "react";
import { boardPrices, PRICES_PUBLISHED, uah, type ModelPrice } from "@/data/prices";
import styles from "./ModelJobs.module.css";

const partNote = {
  original:
    "Оригінальні модулі: рідна кольоропередача, True Tone і Face ID працюють без застережень. Дорожче, але поводиться як заводський.",
  analog:
    "Якісні аналоги: перевірені постачальники, та сама гарантія 30 днів. Дешевше, кольори трохи інші при максимальній яскравості.",
};

const screenBody = {
  original: "Оригінальний модуль, перенесення рідного Face ID, перевірка True Tone.",
  analog: "Аналог від перевіреного постачальника, перенесення Face ID, перевірка сенсора.",
};

const restJobs = [
  { slug: "akumuliator", title: "Акумулятор", body: "Новий АКБ, показуємо ємність до та після. Циклів — 0.", time: "30 хв при вас" },
  { slug: "roziem-zariadzhannia", title: "Роз'єм заряджання", body: "Спершу чистка — часто цього достатньо. Якщо ні, міняємо шлейф.", time: "від 40 хв" },
  { slug: "kamera", title: "Камера / скло камери", body: "Мутне фото, пил під склом, не працює автофокус — модуль або лише скло.", time: "того ж дня" },
  { slug: "zalyv-vodoiu", title: "Залив водою", body: "Розбирання, сушіння, ультразвукова чистка плати від корозії.", time: "1–3 дні" },
  { slug: "ne-vmykaietsia", title: "Не вмикається", body: "Шукаємо причину на платі: живлення, підсвітка, контролери заряду.", time: "діагностика безкоштовна" },
] as const;

const boardFrom = new Map(boardPrices.map((b) => [b.slug, b.from]));

export default function ModelJobs({ prices }: { prices?: ModelPrice }) {
  const [part, setPart] = useState<"original" | "analog">("original");

  // Перемикач має сенс лише там, де деталь буває двох рівнів — тобто де є екран
  const screen = prices?.["zamina-ekrana"];
  const tiered = typeof screen === "object";

  /** Ціна роботи так, як її треба показати: точна сума або «від» */
  function priceOf(slug: string): { text: string; exact: boolean } | null {
    const board = boardFrom.get(slug);
    if (board !== undefined) return { text: uah(board), exact: false };

    const value = prices?.[slug as keyof ModelPrice];
    if (value === undefined) return null;
    if (typeof value === "number") return { text: uah(value), exact: true };
    return { text: uah(value[part]), exact: true };
  }

  // Роботи без ціни для цієї моделі не показуємо: у годинника немає ні камери,
  // ні роз'єму, і порожній рядок поруч із цінами читався б як «ціну приховали».
  const jobs = [
    { slug: "zamina-ekrana", title: "Заміна екрана", body: tiered ? screenBody[part] : "Нове скло або модуль у зборі, з відновленням герметизації.", time: "40 хв при вас" },
    ...restJobs,
  ].filter((j) => priceOf(j.slug) !== null);

  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.head}>
        <div>
          <div className="kicker">{PRICES_PUBLISHED ? "Роботи й ціни" : "Роботи"}</div>
          <h2 className={styles.title}>Що робимо для цієї моделі</h2>
        </div>

        {tiered && (
          <div className={styles.toggle} role="group" aria-label="Тип запчастини">
            <button
              type="button"
              className={part === "original" ? styles.tabActive : styles.tab}
              aria-pressed={part === "original"}
              onClick={() => setPart("original")}
            >
              Оригінал
            </button>
            <button
              type="button"
              className={part === "analog" ? styles.tabActive : styles.tab}
              aria-pressed={part === "analog"}
              onClick={() => setPart("analog")}
            >
              Аналог
            </button>
          </div>
        )}
      </div>

      {tiered && <p className={styles.note}>{partNote[part]}</p>}

      <div className={styles.list}>
        {jobs.map((j) => {
          const price = priceOf(j.slug);

          return (
            <div key={j.title} className={styles.job}>
              <div className={styles.jobTitle}>{j.title}</div>
              <div className={styles.jobBody}>{j.body}</div>

              <div className={styles.jobFoot}>
                <span className={styles.jobTime}>{j.time}</span>
                {PRICES_PUBLISHED && price && (
                  <span className={price.exact ? styles.price : styles.priceFrom}>
                    {price.exact ? price.text : `від ${price.text}`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className={styles.priceNote}>
        {PRICES_PUBLISHED
          ? "Ціни під ключ — робота разом із деталлю. Точну суму називаємо після безкоштовної діагностики, і далі вона вже не змінюється. Ремонт іде за передоплатою: після погодження ціни ви вносите передоплату за деталь, решту — при видачі."
          : "Ціну називаємо після безкоштовної діагностики — і далі вона вже не змінюється. Ремонт іде за передоплатою за деталь, решта при видачі."}
      </p>
    </section>
  );
}
