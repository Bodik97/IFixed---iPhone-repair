import Link from "next/link";
import { STATUS_OPTIONS } from "@/db/leads";
import styles from "./Search.module.css";

export type Query = { q?: string; status?: string; shipping?: string };

/** Адреса зі зміненим одним параметром — решта фільтрів лишається */
export function adminHref(current: Query & { page?: number }, patch: Partial<Query & { page?: number }>) {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(next)) {
    // page=1 у адресі не потрібна, а порожні фільтри тільки засмічують рядок
    if (value === undefined || value === "" || (key === "page" && value === 1)) continue;
    params.set(key, String(value));
  }

  const qs = params.toString();
  return qs ? `/admin/zayavky?${qs}` : "/admin/zayavky";
}

export default function Search({ query, found }: { query: Query; found: number }) {
  const filtered = Boolean(query.q || query.status || query.shipping);

  return (
    <div className={styles.wrap}>
      {/* Звичайна GET-форма: працює й без JS, адреса лишається такою, щоб її можна було зберегти */}
      <form className={styles.form} action="/admin/zayavky" method="get">
        {query.status && <input type="hidden" name="status" value={query.status} />}
        {query.shipping && <input type="hidden" name="shipping" value={query.shipping} />}

        <label htmlFor="admin-q" className="visually-hidden">
          Пошук заявки
        </label>
        <input
          id="admin-q"
          name="q"
          type="search"
          className="field"
          defaultValue={query.q ?? ""}
          placeholder="Номер, ім'я, телефон, пошта або модель"
          autoComplete="off"
        />

        <button type="submit" className="btn btn-ghost">
          Знайти
        </button>
      </form>

      <div className={styles.chips}>
        <Link
          href={adminHref(query, { status: "", shipping: "", page: 1 })}
          className="chip"
          aria-pressed={!query.status && !query.shipping}
        >
          Усі
        </Link>

        {STATUS_OPTIONS.map((s) => (
          <Link
            key={s.value}
            href={adminHref(query, { status: s.value, shipping: "", page: 1 })}
            className="chip"
            aria-pressed={query.status === s.value}
          >
            {s.label}
          </Link>
        ))}

        <Link
          href={adminHref(query, { shipping: "1", status: "", page: 1 })}
          className="chip"
          aria-pressed={Boolean(query.shipping)}
        >
          Чекають відправки
        </Link>
      </div>

      {filtered && (
        <div className={styles.result}>
          Знайдено: <strong>{found}</strong>
          <Link href="/admin/zayavky" className={styles.reset}>
            Скинути
          </Link>
        </div>
      )}
    </div>
  );
}
