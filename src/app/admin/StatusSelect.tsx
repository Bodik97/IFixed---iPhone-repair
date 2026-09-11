"use client";

import { useRef, useTransition } from "react";
import { setStatus } from "./actions";
import styles from "./page.module.css";

const options = [
  { value: "new", label: "Нова" },
  { value: "in_progress", label: "У роботі" },
  { value: "done", label: "Готово" },
  { value: "rejected", label: "Відмова" },
];

export default function StatusSelect({ id, status }: { id: string; status: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form ref={formRef} action={setStatus}>
      <input type="hidden" name="id" value={id} />
      <label className="visually-hidden" htmlFor={`status-${id}`}>
        Статус заявки
      </label>
      <select
        id={`status-${id}`}
        name="status"
        defaultValue={status}
        disabled={pending}
        className={styles.status}
        onChange={() => startTransition(() => formRef.current?.requestSubmit())}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
