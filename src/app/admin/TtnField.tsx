"use client";

import { useRef, useState, useTransition } from "react";
import { setTtn } from "./actions";
import styles from "./page.module.css";

export default function TtnField({ id, ttn }: { id: string; ttn: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  // Поле не блокуємо на час збереження — лише тихо кажемо, що відбувається
  const [saved, setSaved] = useState(false);

  return (
    <form
      ref={formRef}
      action={setTtn}
      className={styles.ttnForm}
      onSubmit={() => startTransition(() => {})}
    >
      <input type="hidden" name="id" value={id} />
      <label className="visually-hidden" htmlFor={`ttn-${id}`}>
        Накладна Нової Пошти
      </label>
      <input
        id={`ttn-${id}`}
        name="ttn"
        type="text"
        inputMode="numeric"
        defaultValue={ttn ?? ""}
        placeholder="ТТН"
        className={styles.ttnInput}
        onChange={() => setSaved(false)}
        onBlur={(e) => {
          // Зберігаємо, лише якщо значення справді змінилось
          if (e.target.value.trim() !== (ttn ?? "")) {
            startTransition(() => {
              formRef.current?.requestSubmit();
              setSaved(true);
            });
          }
        }}
      />
      <span className={styles.ttnState} aria-live="polite">
        {pending ? "Зберігаємо…" : saved ? "Збережено" : ""}
      </span>
    </form>
  );
}
