"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

/** 40 с → «щойно», 12 хв, 3 год, 2 дн */
function label(ms: number): string {
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "щойно";
  if (min < 60) return `${min} хв`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} год`;
  return `${Math.floor(h / 24)} дн`;
}

/**
 * Скільки чекає сигнал. Тікає сам: сторінка перемальовується лише тоді, коли
 * в базі щось змінилось, а «12 хв» мусить ставати «16 хв» і без цього.
 *
 * `overdueMin` — після скількох хвилин вважати простроченим (червоне).
 */
export default function Age({ at, overdueMin }: { at: string; overdueMin?: number }) {
  // Перший рендер — без часу: на сервері й у браузері «зараз» різне,
  // і текст розійшовся б при гідратації
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return <span className={styles.age}>&nbsp;</span>;

  const ms = Math.max(0, now - new Date(at).getTime());
  const overdue = overdueMin !== undefined && ms > overdueMin * 60_000;

  return (
    <time
      dateTime={at}
      className={overdue ? styles.ageOverdue : styles.age}
      title={overdue ? "Довше, ніж обіцяємо клієнту" : undefined}
    >
      {label(ms)}
    </time>
  );
}
