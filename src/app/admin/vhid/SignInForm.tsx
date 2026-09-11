"use client";

import { useActionState } from "react";
import { signIn } from "../actions";
import styles from "./page.module.css";

export default function SignInForm() {
  const [error, action, pending] = useActionState(signIn, null);

  return (
    <form action={action} className={styles.form}>
      <div className={styles.row}>
        <label htmlFor="a-email">Пошта</label>
        <input id="a-email" name="email" type="email" className="field" autoComplete="username" required />
      </div>

      <div className={styles.row}>
        <label htmlFor="a-password">Пароль</label>
        <input
          id="a-password"
          name="password"
          type="password"
          className="field"
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <button type="submit" className="btn btn-accent btn-lg" disabled={pending}>
        {pending ? "Перевіряємо…" : "Увійти"}
      </button>
    </form>
  );
}
