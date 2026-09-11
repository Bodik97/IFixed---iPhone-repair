"use client";

import { useState } from "react";
import Link from "next/link";
import { services, serviceCats, type ServiceCat } from "@/data/services";
import styles from "./ServiceCatalog.module.css";

export default function ServiceCatalog() {
  const [cat, setCat] = useState<ServiceCat | "all">("all");
  const shown = cat === "all" ? services : services.filter((s) => s.cat === cat);

  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.head}>
        <div>
          <div className="kicker">Каталог послуг</div>
          <h2 className={styles.title}>Оберіть, що потрібно зробити</h2>
        </div>

        <div className={styles.filters} role="group" aria-label="Фільтр послуг">
          {serviceCats.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              aria-pressed={cat === c.id}
              onClick={() => setCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {shown.map((s) => (
          <article key={s.no} className={`card ${styles.card}`}>
            <div className={styles.cardTop}>
              <span className={styles.icon}>
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#DAFF3D"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: s.icon }}
                />
              </span>
              <span className={styles.no}>{s.no}</span>
            </div>

            <h3 className={styles.cardTitle}>{s.title}</h3>
            <p className={styles.body}>{s.body}</p>

            <div className={styles.tags}>
              {s.tags.map((t) => (
                <span key={t} className={styles.tag}>
                  {t}
                </span>
              ))}
            </div>

            <div className={styles.foot}>
              <span className={styles.time}>{s.time}</span>
              <Link href="#book" className={styles.book}>
                Записатись
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 12h13" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
