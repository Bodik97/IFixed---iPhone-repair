"use client";

import { useRef, useState } from "react";
import FormError from "@/components/FormError";
import { EXPENSE_CATEGORIES } from "@/db/expenses";
import { createExpense, deleteExpense } from "../actions";
import styles from "./Expenses.module.css";

export type ExpenseRow = {
  id: string;
  день: string;
  сума: string;
  категорія: string;
  нотатка: string | null;
};

/**
 * Витрати сервісу за вибраний період.
 *
 * Форма згорнута, поки не потрібна: у касу заходять здебільшого дивитись
 * цифри, а не вносити чеки.
 */
export default function Expenses({ rows, today }: { rows: ExpenseRow[]; today: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const err = await createExpense(new FormData(e.currentTarget));
      if (err) {
        setError(err);
        return;
      }
      formRef.current?.reset();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <h2 className={styles.h2}>Витрати</h2>

        <button type="button" className="btn btn-ghost" onClick={() => setOpen(!open)}>
          {open ? "Згорнути" : "Додати витрату"}
        </button>
      </div>

      {open && (
        <form ref={formRef} className={styles.form} onSubmit={submit}>
          <label className={styles.field}>
            <span className={styles.label}>Сума, ₴</span>
            <input name="amount" className="field" type="number" min="1" step="1" required autoFocus />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>На що</span>
            <select name="category" className="field" defaultValue="other">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Коли</span>
            <input name="spentAt" className="field" type="date" defaultValue={today} />
          </label>

          <label className={styles.fieldWide}>
            <span className={styles.label}>Коментар</span>
            <input name="note" className="field" type="text" placeholder="Оренда за вересень" />
          </label>

          <div className={styles.submit}>
            <FormError>{error}</FormError>
            <button type="submit" className="btn btn-accent" disabled={busy}>
              {busy ? "Записуємо…" : "Записати"}
            </button>
          </div>
        </form>
      )}

      {rows.length === 0 ? (
        <p className={styles.empty}>За цей період витрат не вносили.</p>
      ) : (
        <ul className={styles.list}>
          {rows.map((r) => (
            <li key={r.id} className={styles.row}>
              <span className={styles.day}>{r.день}</span>
              <span className={styles.category}>{r.категорія}</span>
              <span className={styles.note}>{r.нотатка}</span>
              <span className={styles.amount}>−{r.сума}</span>

              <form action={deleteExpense}>
                <input type="hidden" name="id" value={r.id} />
                <button type="submit" className={styles.remove} aria-label="Прибрати витрату">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12" />
                    <path d="M18 6L6 18" />
                  </svg>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
