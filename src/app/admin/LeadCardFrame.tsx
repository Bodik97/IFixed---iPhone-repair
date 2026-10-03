"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./page.module.css";

/**
 * Рамка картки заявки зі згортанням.
 *
 * Згорнута картка — це те, за чим майстер шукає заявку в списку: номер, імʼя,
 * що за пристрій, телефон і статус. Решта (доставка, нотатки, гроші, чат)
 * зʼявляється лише в розгорнутій — інакше одна заявка займає кілька екранів.
 *
 * Стан живе тут, на клієнті: LiveRefresh перемальовує сторінку кожні кілька
 * секунд, і розгорнута картка має лишатися розгорнутою.
 */
export default function LeadCardFrame({
  className,
  summary,
  side,
  defaultOpen = false,
  children,
}: {
  className: string;
  /** Видно завжди */
  summary: React.ReactNode;
  /** Статус — теж завжди: його міняють найчастіше */
  side: React.ReactNode;
  /** Прийшли з сигналу на головній — одразу показати все */
  defaultOpen?: boolean;
  /** Видно лише в розгорнутій */
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const detailsId = useId();
  const ref = useRef<HTMLElement>(null);

  // Прийшли із сигналу — картку одразу в поле зору, повз пошук і фільтри
  useEffect(() => {
    if (defaultOpen) ref.current?.scrollIntoView({ block: "start" });
  }, [defaultOpen]);

  return (
    <article ref={ref} className={className} data-open={open || undefined}>
      <div className={styles.cardMain}>{summary}</div>
      <div className={styles.cardSide}>{side}</div>

      {open && (
        <div id={detailsId} className={styles.cardDetails}>
          {children}
        </div>
      )}

      <button
        type="button"
        className={styles.expand}
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen(!open)}
      >
        {open ? "Згорнути" : "Розгорнути"}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={open ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
        </svg>
      </button>
    </article>
  );
}
