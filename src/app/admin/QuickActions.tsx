"use client";

import { useState } from "react";
import styles from "./QuickActions.module.css";

/**
 * Дії, які майстер робить найчастіше — просто з картки, не відкриваючи заявку.
 *
 * Подзвонити й написати у Viber були доступні й раніше, але як звичайні
 * посилання в тексті: у них треба цілитись. Копіювання ТТН і відділення
 * не було зовсім — номер переписували руками.
 */

/** Viber і tel: розуміють лише міжнародний формат */
function intl(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("380")) return `+${d}`;
  if (d.startsWith("0")) return `+38${d}`;
  if (d.length === 9) return `+380${d}`;
  return `+${d}`;
}

function Copy({ value, label, done }: { value: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      className={copied ? styles.actionDone : styles.action}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setFailed(false);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Браузер не дав доступу до буфера — кажемо прямо, а не мовчимо
          setFailed(true);
        }
      }}
    >
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2.5" />
          <path d="M5 15V6a2 2 0 0 1 2-2h8" />
        </svg>
      )}
      {failed ? "Не вдалося — скопіюйте вручну" : copied ? done : label}
    </button>
  );
}

export default function QuickActions({
  phone,
  address,
  ttn,
}: {
  phone: string | null;
  address: string | null;
  ttn: string | null;
}) {
  const tel = phone ? intl(phone) : null;

  return (
    <div className={styles.row}>
      {tel && (
        <>
          <a href={`tel:${tel}`} className={styles.actionCall}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1.1 1A16 16 0 0 1 4 5.1 1 1 0 0 1 5 4z" />
            </svg>
            Подзвонити
          </a>

          <a href={`viber://chat?number=${encodeURIComponent(tel)}`} className={styles.action}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L4 20.5l1.4-4.6A8.5 8.5 0 1 1 21 11.5z" />
            </svg>
            Viber
          </a>

          <Copy value={tel} label="Номер" done="Номер скопійовано" />
        </>
      )}

      {ttn && <Copy value={ttn} label="ТТН" done="ТТН скопійовано" />}
      {address && <Copy value={address} label="Відділення" done="Відділення скопійовано" />}
    </div>
  );
}
