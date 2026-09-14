"use client";

import { useState } from "react";
import { bookingModels } from "@/data/landing";
import { site } from "@/data/site";
import FormError from "./FormError";
import styles from "./BookingForm.module.css";

export default function MailInForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [model, setModel] = useState("");
  const [problem, setProblem] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = () => {
    setName("");
    setPhone("");
    setCity("");
    setModel("");
    setProblem("");
    setError("");
    setSent(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || phone.replace(/\D/g, "").length < 9 || city.trim().length < 3) {
      setError("Вкажіть ім'я, телефон і місто з відділенням — решту з'ясуємо в розмові.");
      return;
    }

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, city, model, problem, source: "mail-in" }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSent(true);
    } catch {
      setError("Не вдалося надіслати. Зателефонуйте, будь ласка: " + site.phones[0].label);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.box}>
        <div className={styles.done}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DAFF3D" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5l2.5 2.5L16 9.5" />
          </svg>
          <h3>Заявку прийнято</h3>
          <p className={styles.doneText}>
            Надішлемо SMS з адресою відділення та номером замовлення протягом 15 хвилин.
          </p>
          <button type="button" onClick={reset} className="btn btn-ghost">
            Оформити ще одну
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.box}>
      <form onSubmit={submit} className={styles.form} noValidate>
        <div className={styles.row}>
          <label htmlFor="p-name">Ім&apos;я та прізвище</label>
          <input
            id="p-name"
            className="field"
            type="text"
            autoComplete="name"
            placeholder="Для відправки Новою Поштою"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
          />
        </div>

        <div className={styles.row}>
          <label htmlFor="p-phone">Телефон</label>
          <input
            id="p-phone"
            className="field"
            type="tel"
            autoComplete="tel"
            placeholder="+380 __ ___ __ __"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError("");
            }}
          />
        </div>

        <div className={styles.row}>
          <label htmlFor="p-city">Місто й відділення</label>
          <input
            id="p-city"
            className="field"
            type="text"
            placeholder="Напр. Тернопіль, відділення 12"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setError("");
            }}
          />
        </div>

        <div className={styles.row}>
          <label htmlFor="p-model">Модель</label>
          <select id="p-model" className="field" value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="">Оберіть модель</option>
            {bookingModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.row}>
          <label htmlFor="p-issue">Що трапилось</label>
          <textarea
            id="p-issue"
            className={`field ${styles.textarea}`}
            placeholder="Наприклад: не тримає заряд, розбите скло спинки"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
          />
        </div>

        <FormError>{error}</FormError>

        <button type="submit" className="btn btn-accent btn-lg" disabled={sending}>
          {sending ? "Надсилаємо…" : "Оформити відправку"}
        </button>

        <p className={styles.note}>
          Телефон потрібен лише щоб передзвонити й надіслати SMS. Нікуди його не передаємо.
          Діагностика безкоштовна; ремонт — за передоплатою за деталь після того, як
          погодимо ціну.
        </p>
      </form>
    </div>
  );
}
