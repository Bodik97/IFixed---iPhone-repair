"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { bookingModels } from "@/data/landing";
import { site } from "@/data/site";
import FormError from "../FormError";
import styles from "./NewRepair.module.css";

export default function NewRepair() {
  const { user } = useUser();
  const [note, setNote] = useState("");
  const [model, setModel] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [requested, setRequested] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const phone = user?.primaryPhoneNumber?.phoneNumber ?? "";
  const contact = phone || email;

  const request = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Контакти беремо з профілю — клієнт уже авторизований
        body: JSON.stringify({
          name: user?.firstName ?? email,
          phone: phone || "—",
          email,
          model,
          problem: note,
          source: "landing",
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setRequested(true);
    } catch {
      setError("Не вдалося надіслати. Зателефонуйте, будь ласка: " + site.phones[0].label);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Новий ремонт</h3>
      <p className={styles.lead}>
        Ще щось зламалось? Оформимо швидше — дані вже є, потрібно лише сказати симптом.
      </p>

      <div className={styles.body}>
        {requested ? (
          <div className="info">
            Прийняли — зв&apos;яжемося {contact ? <>з вами ({contact})</> : "з вами"} протягом 15
            хвилин.
          </div>
        ) : (
          <>
            <label htmlFor="new-model" className={styles.label}>
              Модель
            </label>
            <select
              id="new-model"
              className="field"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="">Оберіть модель</option>
              {bookingModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <label htmlFor="new-note" className={styles.label}>
              Що трапилось
            </label>
            <textarea
              id="new-note"
              className={`field ${styles.textarea}`}
              placeholder="Що трапилось цього разу?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <FormError>{error}</FormError>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={request}
        className={`btn btn-accent ${styles.submit}`}
        disabled={requested || sending}
      >
        {requested ? "Заявку надіслано" : sending ? "Надсилаємо…" : "Залишити заявку"}
      </button>
    </div>
  );
}
