"use client";

import { useState } from "react";
import type { Lead } from "@/db/schema";
import styles from "./History.module.css";

type Row = {
  id: string;
  what: string;
  problem: string | null;
  date: string;
  status: Lead["status"];
  label: string;
  active: boolean;
};

const tabs = [
  { id: "all", label: "Усі" },
  { id: "active", label: "У роботі" },
  { id: "done", label: "Завершені" },
] as const;

export default function History({ rows }: { rows: Row[] }) {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("all");

  const shown =
    tab === "all" ? rows : tab === "active" ? rows.filter((r) => r.active) : rows.filter((r) => !r.active);

  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.head}>
        <h2 className={styles.title}>Мої заявки</h2>

        <div className={styles.tabs} role="group" aria-label="Фільтр заявок">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className="chip"
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length > 0 ? (
        <div className={styles.list}>
          {shown.map((r) => (
            <div key={r.id} className={styles.row}>
              <div className={styles.device}>{r.what}</div>
              <div className={styles.work}>{r.problem ?? "—"}</div>
              <div className={styles.date}>{r.date}</div>
              <span className={r.active ? styles.badgeActive : styles.badgeDone}>{r.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>Тут поки порожньо.</div>
      )}
    </section>
  );
}
