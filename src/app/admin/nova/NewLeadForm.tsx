"use client";

import { useActionState } from "react";
import FormError from "@/components/FormError";
import { createLead } from "../actions";
import styles from "./page.module.css";

/** Три поля й галочка — заводиться за пів хвилини, поки клієнт на лінії */
export default function NewLeadForm() {
  const [error, action, pending] = useActionState(createLead, null);

  return (
    <form action={action} className={styles.form}>
      <div className={styles.row}>
        <label htmlFor="nl-name">Імʼя клієнта</label>
        <input id="nl-name" name="name" className="field" autoComplete="off" required autoFocus />
      </div>

      <div className={styles.row}>
        <label htmlFor="nl-phone">Телефон</label>
        <input id="nl-phone" name="phone" type="tel" inputMode="tel" className="field" placeholder="0__ ___ __ __" required />
      </div>

      <div className={styles.row}>
        <label htmlFor="nl-model">Пристрій</label>
        <input id="nl-model" name="model" className="field" placeholder="Напр. iPhone 13" />
      </div>

      <div className={styles.row}>
        <label htmlFor="nl-problem">Що трапилось</label>
        <textarea id="nl-problem" name="problem" className={`field ${styles.textarea}`} rows={3} />
      </div>

      <label className={styles.check}>
        <input type="checkbox" name="handedOver" />
        Клієнт уже залишив пристрій — одразу «У роботі»
      </label>

      <FormError>{error}</FormError>

      <button type="submit" className="btn btn-accent btn-lg" disabled={pending}>
        {pending ? "Зберігаємо…" : "Створити заявку"}
      </button>
    </form>
  );
}
