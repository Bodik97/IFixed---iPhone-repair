"use client";

import { useRouter } from "next/navigation";
import styles from "./BackButton.module.css";

type Props = {
  /** Куди вести, якщо історії немає — наприклад, коли сторінку відкрили з пошуку */
  fallback: string;
  label?: string;
  className?: string;
};

export default function BackButton({ fallback, label = "Назад", className }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={`${styles.back} ${className ?? ""}`}
      onClick={() => {
        // Перевіряємо в момент кліку, а не при рендері: інакше довелось би
        // тримати стан, якого на сервері ще немає
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
      {label}
    </button>
  );
}
