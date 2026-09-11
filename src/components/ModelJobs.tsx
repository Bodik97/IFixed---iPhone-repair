"use client";

import { useState } from "react";
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
  { title: "Акумулятор", body: "Новий АКБ, показуємо ємність до та після. Циклів — 0.", time: "30 хв при вас" },
  { title: "Роз'єм заряджання", body: "Спершу чистка — часто цього достатньо. Якщо ні, міняємо шлейф.", time: "від 40 хв" },
  { title: "Камера / скло камери", body: "Мутне фото, пил під склом, не працює автофокус — модуль або лише скло.", time: "того ж дня" },
  { title: "Залив водою", body: "Розбирання, сушіння, ультразвукова чистка плати від корозії.", time: "1–3 дні" },
  { title: "Не вмикається", body: "Шукаємо причину на платі: живлення, підсвітка, контролери заряду.", time: "діагностика безкоштовна" },
];

export default function ModelJobs() {
  const [part, setPart] = useState<"original" | "analog">("original");

  const jobs = [
    { title: "Заміна екрана", body: screenBody[part], time: "40 хв при вас" },
    ...restJobs,
  ];

  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.head}>
        <div>
          <div className="kicker">Роботи</div>
          <h2 className={styles.title}>Що робимо для цієї моделі</h2>
        </div>

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
      </div>

      <p className={styles.note}>{partNote[part]}</p>

      <div className={styles.list}>
        {jobs.map((j) => (
          <div key={j.title} className={styles.job}>
            <div className={styles.jobTitle}>{j.title}</div>
            <div className={styles.jobBody}>{j.body}</div>
            <div className={styles.jobTime}>{j.time}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
