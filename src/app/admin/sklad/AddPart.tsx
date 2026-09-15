"use client";

import { useRef, useState } from "react";
import FormError from "@/components/FormError";
import { createPart } from "../actions";
import styles from "./page.module.css";

/** Форма нової позиції — згорнута, поки не потрібна */
export default function AddPart() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const err = await createPart(new FormData(e.currentTarget));
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

  if (!open) {
    return (
      <button type="button" className="btn btn-accent" onClick={() => setOpen(true)}>
        Додати позицію
      </button>
    );
  }

  return (
    <form ref={formRef} className={styles.form} onSubmit={submit}>
      <label className={styles.field}>
        <span className={styles.label}>Деталь</span>
        <input name="name" className="field" type="text" placeholder="Акумулятор" required autoFocus />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Модель</span>
        <input name="model" className="field" type="text" placeholder="iPhone 13" />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Скільки є</span>
        <input name="qty" className="field" type="number" min="0" step="1" defaultValue={1} />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Ціна закупівлі, ₴</span>
        <input name="unitCost" className="field" type="number" min="0" step="1" />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Замовляти, коли менше</span>
        <input name="minQty" className="field" type="number" min="0" step="1" defaultValue={1} />
      </label>

      <div className={styles.submit}>
        <FormError>{error}</FormError>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          Скасувати
        </button>
        <button type="submit" className="btn btn-accent" disabled={busy}>
          {busy ? "Записуємо…" : "Записати"}
        </button>
      </div>
    </form>
  );
}
