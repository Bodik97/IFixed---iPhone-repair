"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LiveRefresh.module.css";

/** Як часто питаємо сервер, чи щось змінилось */
const POLL_MS = 8_000;

/**
 * Тримає сторінку свіжою без участі людини.
 *
 * Майстер виставив статус — клієнт бачить це сам, не знаючи, що таке
 * «оновити сторінку». Питаємо короткий відбиток стану і, якщо він змінився,
 * робимо м'яке оновлення: воно перемальовує дані й лишає прокрутку на місці.
 */
export default function LiveRefresh({ label }: { label?: string }) {
  const router = useRouter();
  const seen = useRef<string | null>(null);
  const [justUpdated, setJustUpdated] = useState(false);

  const check = useCallback(async () => {
    // Фонова вкладка нічого не показує — не смикаємо сервер марно
    if (document.hidden) return;

    // Поки людина щось вписує, оновлення почекає: воно могло б скинути
    // введене в полі, якого ще не зберегли
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;

    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) return;

      const { version } = (await res.json()) as { version: string | null };
      if (!version) return;

      if (seen.current === null) {
        seen.current = version;
        return;
      }

      if (seen.current !== version) {
        seen.current = version;
        router.refresh();
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 3500);
      }
    } catch {
      // Зв'язок пропав — просто спробуємо наступного разу
    }
  }, [router]);

  useEffect(() => {
    const id = setInterval(check, POLL_MS);

    // Повернулись на вкладку — перевіряємо одразу, не чекаючи таймера
    const onVisible = () => !document.hidden && check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [check]);

  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      {justUpdated ? (
        <span className={styles.updated}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          Оновлено
        </span>
      ) : (
        <span className={styles.live}>
          <span className={styles.dot} aria-hidden="true" />
          {label ?? "Оновлюється саме"}
        </span>
      )}
    </div>
  );
}
