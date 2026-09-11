"use client";

import { useState } from "react";
import styles from "./Accordion.module.css";

export default function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className={styles.list}>
      {items.map((f, i) => {
        const on = open === i;
        return (
          <div key={f.q} className={styles.item}>
            <button
              type="button"
              className={styles.q}
              aria-expanded={on}
              onClick={() => setOpen(on ? -1 : i)}
            >
              <span>{f.q}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#DAFF3D"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
                style={{ transform: on ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <div className={styles.panel} style={{ gridTemplateRows: on ? "1fr" : "0fr" }}>
              <div className={styles.panelInner}>
                <p className={styles.a}>{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
