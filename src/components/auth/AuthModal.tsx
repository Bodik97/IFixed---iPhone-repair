"use client";

import { useEffect, useRef } from "react";
import SignInForm from "./SignInForm";
import styles from "./AuthModal.module.css";

const perks = [
  "Статус ремонту в реальному часі — без дзвінків",
  "Номер посилки Нової Пошти одразу на сторінці",
  "Гарантія на кожен пристрій — видно, доки діє",
];

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  // Нативний <dialog> сам тримає фокус усередині, закривається на Esc
  // і малює підкладку — власний код для цього не потрібен
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Поки вікно відкрите, сторінка під ним не має прокручуватись
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="auth-title"
      onClose={onClose}
      // Клік по підкладці — це клік по самому <dialog>, а не по вмісту
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className={styles.body}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Закрити">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        </button>

        <div className={styles.head}>
          <span className={styles.icon} aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8.5" r="3.75" />
              <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
            </svg>
          </span>

          <h2 id="auth-title" className={styles.title}>
            Вхід або реєстрація
          </h2>
          <p className={styles.lead}>
            Пошта й пароль — це все. Заходите вперше: акаунт створимо автоматично, окремої
            реєстрації не треба.
          </p>
        </div>

        <ul className={styles.perks}>
          {perks.map((p) => (
            <li key={p}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              {p}
            </li>
          ))}
        </ul>

        <SignInForm onDone={onClose} bare />
      </div>
    </dialog>
  );
}
