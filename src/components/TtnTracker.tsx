"use client";

import { useState } from "react";
import styles from "./StatusCheck.module.css";

export default function TtnTracker() {
  const [ttn, setTtn] = useState("");
  const [message, setMessage] = useState("");

  const track = () => {
    const n = ttn.trim();
    if (!n) {
      setMessage("Впишіть ТТН або номер замовлення — або просто зателефонуйте нам.");
      return;
    }
    // Заглушка до підключення API Нової Пошти й CRM
    setMessage(
      `№${n} — посилку отримано, діагностика завершена. Майстер телефонував із ціною сьогодні о 11:20.`,
    );
  };

  return (
    <section id="track" className={styles.section}>
      <div className={styles.box}>
        <div>
          <div className="kicker">Трекінг</div>
          <h2 className={styles.title}>Де моя посилка</h2>
          <p className={styles.lead}>
            Введіть ТТН Нової Пошти або номер замовлення — покажемо, на якому етапі ремонт.
          </p>
        </div>

        <div className={styles.form}>
          <label htmlFor="p-ttn" className={styles.label}>
            ТТН або номер замовлення
          </label>
          <input
            id="p-ttn"
            className="field"
            type="text"
            inputMode="numeric"
            placeholder="напр. 20450099887766"
            value={ttn}
            onChange={(e) => {
              setTtn(e.target.value);
              setMessage("");
            }}
            onKeyDown={(e) => e.key === "Enter" && track()}
          />
          <button type="button" onClick={track} className="btn btn-ghost">
            Перевірити
          </button>

          {message && <div className="info">{message}</div>}
        </div>
      </div>
    </section>
  );
}
