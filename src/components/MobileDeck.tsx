"use client";

import { Children, useRef, useState, useSyncExternalStore } from "react";
import styles from "./MobileDeck.module.css";

/** Межа «телефона» — та сама, що в @media у MobileDeck.module.css */
const MOBILE = "(max-width: 700px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(MOBILE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Сітка карток, яка на телефоні стає колодою.
 *
 * На широкому екрані обгортки карток — display: contents, і сітка лишається
 * такою, як її задає className. На телефоні ті самі картки лягають одна на одну:
 * зверху поточна, позаду краї наступних; гортаються свайпом або кнопкою «Далі».
 * Окремої мобільної розмітки немає — колодою стають самі картки.
 */
export default function MobileDeck({
  children,
  className,
  labels,
  label,
  padded,
}: {
  children: React.ReactNode;
  /** Клас сітки для широкого екрана */
  className?: string;
  /** Назви карток по порядку — для кнопки «Далі: …» і лічильника */
  labels: string[];
  /** Що це за колода — для читачів екрана */
  label: string;
  /** Картки без власної рамки й відступів (напр. кроки) — колода дасть свої */
  padded?: boolean;
}) {
  const cards = Children.toArray(children);
  const n = cards.length;

  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [moved, setMoved] = useState(false);

  const isMobile = useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE).matches, () => false);

  const swipeX = useRef<number | null>(null);
  /** Щойно гортали пальцем — клік, що настає після свайпу, не має відкрити посилання */
  const swiped = useRef(false);

  const go = (next: number) => {
    const target = (next + n) % n;
    if (target === active) return;
    setMoved(true);
    setLeaving(target === (active + 1) % n ? active : null);
    setActive(target);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    swipeX.current = e.clientX;
    swiped.current = false;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (swipeX.current === null) return;
    const dx = e.clientX - swipeX.current;
    swipeX.current = null;
    if (Math.abs(dx) < 40) return;
    swiped.current = true;
    go(dx < 0 ? active + 1 : active - 1);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (!swiped.current) return;
    swiped.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  if (n === 0) return null;

  const last = active === n - 1;

  return (
    <div className={styles.root} role={isMobile ? "region" : undefined} aria-roledescription={isMobile ? "карусель" : undefined} aria-label={isMobile ? label : undefined}>
      <p className={styles.hint}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L4 15a1.5 1.5 0 0 1 2.5-1.7L9 16" />
        </svg>
        Гортайте пальцем ← → або тисніть «Далі»
      </p>

      <div
        className={`${className ?? ""} ${styles.deck}`}
        data-hint={!moved || undefined}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {cards.map((card, i) => {
          const offset = (i - active + n) % n;
          const behind = isMobile && offset !== 0;
          return (
            <div
              key={i}
              className={`${styles.slot} ${padded ? styles.padded : ""} ${i === leaving ? styles.leaving : ""}`}
              data-active={offset === 0 || undefined}
              aria-hidden={behind || undefined}
              inert={behind}
              onAnimationEnd={(e) => e.target === e.currentTarget && setLeaving(null)}
              style={
                {
                  "--offset": Math.min(offset, 3),
                  "--z": n - offset,
                  "--shown": offset > 3 ? 0 : 1,
                } as React.CSSProperties
              }
            >
              {card}
            </div>
          );
        })}
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.arrow} onClick={() => go(active - 1)} aria-label="Попередня картка">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H6" />
            <path d="M11 6l-6 6 6 6" />
          </svg>
        </button>

        <button type="button" className={styles.next} onClick={() => go(active + 1)}>
          <span className={styles.nextText}>{last ? "Ще раз спочатку" : `Далі: ${labels[active + 1] ?? ""}`}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {last ? (
              <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
            ) : (
              <>
                <path d="M5 12h13" />
                <path d="M13 6l6 6-6 6" />
              </>
            )}
          </svg>
        </button>
      </div>

      <div className={styles.dots} aria-live="polite">
        <span className="visually-hidden">
          {active + 1} з {n}: {labels[active]}
        </span>
        {cards.map((_, i) => (
          <span key={i} className={styles.dot} data-on={i === active || undefined} aria-hidden="true" />
        ))}
      </div>
    </div>
  );
}
