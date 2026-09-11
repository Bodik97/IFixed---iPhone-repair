"use client";

import { useState } from "react";
import { site } from "@/data/site";
import styles from "./BookingForm.module.css";

export type LeadSource = "landing" | "model" | "services" | "mail-in";

type Props = {
  source: LeadSource;
  /** Випадний список: моделі на лендінгу, послуги на /poslugy */
  select?: { name: "model" | "service"; label: string; placeholder: string; options: string[] };
  /** Модель уже відома (сторінка моделі) — списку немає, значення йде в заявку як є */
  model?: string;
  submitLabel?: string;
};

export default function BookingForm({
  source,
  select,
  model,
  submitLabel = "Записатись на безкоштовну діагностику",
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [choice, setChoice] = useState("");
  const [problem, setProblem] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = () => {
    setName("");
    setPhone("");
    setChoice("");
    setProblem("");
    setError("");
    setSent(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || phone.replace(/\D/g, "").length < 9) {
      setError("Вкажіть ім'я та телефон — решту з'ясуємо в розмові.");
      return;
    }

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          problem,
          source,
          ...(select ? { [select.name]: choice } : {}),
          ...(model ? { model } : {}),
        }),
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
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#DAFF3D" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5l2.5 2.5L16 9.5" />
          </svg>
          <h3>Заявку прийнято</h3>
          <p className={styles.doneText}>
            Передзвонимо протягом 15 хвилин у робочі години. Якщо терміново — {site.phones[0].label}.
          </p>
          <button type="button" onClick={reset} className="btn btn-ghost">
            Надіслати ще одну
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.box}>
      <form onSubmit={submit} className={styles.form} noValidate>
        <div className={styles.row}>
          <label htmlFor="bf-name">Ім&apos;я</label>
          <input
            id="bf-name"
            className="field"
            type="text"
            autoComplete="name"
            placeholder="Як до вас звертатись"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
          />
        </div>

        <div className={styles.row}>
          <label htmlFor="bf-phone">Телефон</label>
          <input
            id="bf-phone"
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

        {select && (
          <div className={styles.row}>
            <label htmlFor="bf-choice">{select.label}</label>
            <select
              id="bf-choice"
              className="field"
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
            >
              <option value="">{select.placeholder}</option>
              {select.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.row}>
          <label htmlFor="bf-problem">Що трапилось</label>
          <textarea
            id="bf-problem"
            className={`field ${styles.textarea}`}
            placeholder="Наприклад: розбитий екран, не тримає заряд"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
          />
        </div>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-accent btn-lg" disabled={sending}>
          {sending ? "Надсилаємо…" : submitLabel}
        </button>

        <p className={styles.note}>Телефон потрібен лише щоб передзвонити. Нікуди його не передаємо.</p>
      </form>
    </div>
  );
}
