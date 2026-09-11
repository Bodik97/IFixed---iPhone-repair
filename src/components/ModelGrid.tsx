"use client";

import { useState } from "react";
import Link from "next/link";
import { models, modelGroups, type ModelGroup } from "@/data/models";
import { site } from "@/data/site";
import styles from "./ModelGrid.module.css";

export default function ModelGrid() {
  const [filter, setFilter] = useState<ModelGroup | "all">("all");
  const [q, setQ] = useState("");

  const query = q.trim().toLowerCase();
  const shown = models.filter(
    (m) => (filter === "all" || m.group === filter) && (!query || m.name.toLowerCase().includes(query)),
  );

  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.controls}>
        <div className={styles.filters} role="group" aria-label="Фільтр моделей">
          {modelGroups.map((g) => (
            <button
              key={g.id}
              type="button"
              className="chip"
              aria-pressed={filter === g.id}
              onClick={() => setFilter(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className={styles.search}>
          <label htmlFor="model-q" className="visually-hidden">
            Пошук моделі
          </label>
          <input
            id="model-q"
            type="search"
            className={styles.searchInput}
            placeholder="Пошук: 13 Pro, XR, SE…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(241,243,239,.5)" strokeWidth="1.5" strokeLinecap="round" className={styles.searchIcon} aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4 4" />
          </svg>
        </div>
      </div>

      <div className={styles.grid}>
        {shown.map((m) => (
          <Link key={m.slug} href={`/modeli/${m.slug}`} className={styles.card}>
            <span className={styles.media}>
              <span className={styles.photo} style={{ backgroundImage: `url("${m.image}")` }} />
              <span className={styles.veil} />
              <span className={m.inStock ? styles.stockIn : styles.stockOut}>
                {m.inStock ? "в наявності" : "під замовлення"}
              </span>
            </span>

            <span className={styles.body}>
              <span className={styles.name}>{m.name}</span>
              <span className={styles.year}>{m.year}</span>

              <span className={styles.jobs}>
                {m.jobs.map((j) => (
                  <span key={j} className={styles.job}>
                    {j}
                  </span>
                ))}
              </span>

              <span className={styles.foot}>
                <span>{m.time}</span>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#DAFF3D" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 12h13" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </span>
            </span>
          </Link>
        ))}
      </div>

      {shown.length === 0 && (
        <div className={styles.empty}>
          Такої моделі в списку немає — але майже завжди беремо.{" "}
          <a href={site.phones[0].href}>Зателефонуйте</a>, скажемо одразу.
        </div>
      )}
    </section>
  );
}
