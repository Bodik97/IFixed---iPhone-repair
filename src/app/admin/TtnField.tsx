"use client";

import { useId, useRef, useState, useTransition } from "react";
import { setTtn } from "./actions";
import styles from "./page.module.css";

export default function TtnField({
  id,
  ttn,
  autoFocus = false,
}: {
  id: string;
  ttn: string | null;
  /** Поле щойно відкрили кнопкою «Відправити» — одразу можна вписувати */
  autoFocus?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  // Поле буває на картці двічі: біля статусу й у блоці доставки
  const fieldId = useId();
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
      <label className="visually-hidden" htmlFor={fieldId}>
        Накладна Нової Пошти
      </label>
      <input
        id={fieldId}
        name="ttn"
        autoFocus={autoFocus}
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
