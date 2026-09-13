"use client";

import { useState } from "react";
import styles from "./History.module.css";

export type HistoryRow = {
  id: string;
  orderNo: number;
  what: string;
  problem: string | null;
  date: string;
  label: string;
  hint: string;
  tone: "progress" | "ready" | "shipped" | "done" | "closed";
  active: boolean;
  ttn: string | null;
};

const tabs = [
  { id: "all", label: "Усі" },
  { id: "active", label: "У роботі" },
  { id: "done", label: "Завершені" },
] as const;

export default function History({ rows }: { rows: HistoryRow[] }) {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("all");

  const shown =
    tab === "all" ? rows : tab === "active" ? rows.filter((r) => r.active) : rows.filter((r) => !r.active);

  const count = (id: (typeof tabs)[number]["id"]) =>
    id === "all" ? rows.length : id === "active" ? rows.filter((r) => r.active).length : rows.filter((r) => !r.active).length;

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
              <span className={styles.count}>{count(t.id)}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length > 0 ? (
        <div className={styles.list}>
          {shown.map((r) => (
            <article key={r.id} className={styles.row}>
              <div className={styles.main}>
                <div className={styles.device}>
                  <span className={styles.no}>№&#8202;{r.orderNo}</span>
                  {r.what}
                </div>
                {r.problem && <div className={styles.work}>{r.problem}</div>}
                {r.ttn && (
                  <div className={styles.ttn}>
                    Накладна{" "}
                    <a
                      href={`https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(r.ttn)}`}
                      target="_blank"
                      rel="noopener"
                    >
                      {r.ttn}
                    </a>
                  </div>
                )}
              </div>

              <div className={styles.side}>
                <span className={`${styles.badge} ${styles[`tone_${r.tone}`]}`}>{r.label}</span>
                <time className={styles.date}>{r.date}</time>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>Тут поки порожньо.</div>
      )}
    </section>
  );
}
