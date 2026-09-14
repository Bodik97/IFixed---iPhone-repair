"use client";

import { useEffect, useRef, useState } from "react";
import { services } from "@/data/services";
import styles from "./ServiceSelect.module.css";

function Icon({ path }: { path: string }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

/**
 * Вибір послуги списком, що розкривається.
 *
 * Дванадцять чипів займали пів екрана й змушували гортати, щоб дійти до
 * решти форми. Список згорнутий показує лише обране, а іконка допомагає
 * впізнати послугу швидше за текст.
 */
export default function ServiceSelect({
  value,
  onChange,
  id = "service-select",
}: {
  value: string;
  onChange: (title: string) => void;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const chosen = services.find((s) => s.title === value) ?? null;

  // Клік повз список і Esc закривають його — як у звичайного select
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (title: string) => {
    onChange(title === value ? "" : title);
    setOpen(false);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        id={id}
        className={open ? styles.triggerOpen : styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.chosen}>
          {chosen ? (
            <>
              <span className={styles.chosenIcon}>
                <Icon path={chosen.icon} />
              </span>
              {chosen.title}
            </>
          ) : (
            <span className={styles.placeholder}>Оберіть послугу</span>
          )}
        </span>

        <svg
          className={styles.caret}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9.5l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul className={styles.list} role="listbox" aria-labelledby={id}>
          {services.map((s) => {
            const active = s.title === value;
            return (
              <li key={s.slug}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={active ? styles.optionOn : styles.option}
                  onClick={() => pick(s.title)}
                >
                  <span className={styles.optionIcon}>
                    <Icon path={s.icon} />
                  </span>

                  <span className={styles.optionText}>
                    <span className={styles.optionTitle}>{s.title}</span>
                    <span className={styles.optionTime}>{s.time}</span>
                  </span>

                  {active && (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
