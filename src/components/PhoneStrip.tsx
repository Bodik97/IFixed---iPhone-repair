"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./PhoneStrip.module.css";

/**
 * Ряд популярних моделей. На телефоні він гортається, і не кожен здогадається
 * потягнути пальцем — тому під рядом стрілки.
 */
export default function PhoneStrip({ models }: { models: { name: string; slug: string; img: string }[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  /** Гортаємо на дві плитки — стільки видно на екрані телефона */
  const move = (dir: 1 | -1) => {
    const el = ref.current;
    const tile = el?.firstElementChild as HTMLElement | null;
    if (!el || !tile) return;
    el.scrollBy({ left: dir * tile.offsetWidth * 2, behavior: "smooth" });
  };

  return (
    <>
      <ul className={styles.phones} ref={ref}>
        {models.map((m) => (
          <li key={m.slug}>
            <Link href={`/modeli/${m.slug}`} className={styles.phone}>
              <span className={styles.phoneShot}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.img} alt="" loading="lazy" />
              </span>
              <span className={styles.phoneName}>{m.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.arrows}>
        <button type="button" className={styles.arrow} onClick={() => move(-1)} disabled={atStart} aria-label="Попередні моделі">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <button type="button" className={styles.arrow} onClick={() => move(1)} disabled={atEnd} aria-label="Наступні моделі">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </>
  );
}
