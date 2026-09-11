"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { site } from "@/data/site";
import styles from "./NewRepair.module.css";

export default function NewRepair() {
  const { user } = useUser();
  const [note, setNote] = useState("");
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
            <label htmlFor="new-note" className="visually-hidden">
              Що трапилось цього разу?
            </label>
            <textarea
              id="new-note"
              className={`field ${styles.textarea}`}
              placeholder="Що трапилось цього разу?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {error && (
              <div className={styles.error} role="alert">
                {error}
              </div>
            )}
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
