"use client";

import { useRef, useTransition } from "react";
import { setTtn } from "./actions";
import styles from "./page.module.css";

export default function TtnField({ id, ttn }: { id: string; ttn: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

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
        disabled={pending}
        className={styles.ttnInput}
        onBlur={(e) => {
          // Зберігаємо, лише якщо значення справді змінилось
          if (e.target.value.trim() !== (ttn ?? "")) {
            startTransition(() => formRef.current?.requestSubmit());
          }
        }}
      />
    </form>
  );
}
