"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import AuthModal from "./auth/AuthModal";
import styles from "./AccountButton.module.css";

function UserIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  );
}

export default function AccountButton() {
  const { isSignedIn, isLoaded } = useUser();
  const [open, setOpen] = useState(false);

  // Поки Clerk вантажиться, тримаємо місце тієї ж ширини — інакше шапка
  // смикнеться, коли стан приїде
  if (!isLoaded) {
    return <span className={styles.placeholder} aria-hidden="true" />;
  }

  if (isSignedIn) {
    return (
      <Link href="/moi-remonty" className={styles.button}>
        <UserIcon />
        <span className={styles.label}>Мої ремонти</span>
      </Link>
    );
  }

  return (
    <>
      <button type="button" className={styles.button} onClick={() => setOpen(true)}>
        <UserIcon />
        <span className={styles.label}>Вхід</span>
      </button>

      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
