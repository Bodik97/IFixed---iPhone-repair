"use client";

import { useRef, useTransition } from "react";
import { setStatus } from "./actions";
import { STATUS_OPTIONS } from "@/db/leads";
import type { Lead } from "@/db/schema";
import styles from "./page.module.css";

export default function StatusSelect({ id, status }: { id: string; status: Lead["status"] }) {
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
        className={`${styles.status} ${styles[`st_${status}`]}`}
        onChange={() => startTransition(() => formRef.current?.requestSubmit())}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
