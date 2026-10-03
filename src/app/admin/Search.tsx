import Link from "next/link";
import StatusFilter from "./StatusFilter";
import styles from "./Search.module.css";

export type Query = { q?: string; status?: string; shipping?: string };

/** Робочий список заявок чи архів закритих — у кожного своя адреса й свої статуси */
export type ListKind = "active" | "archive";

const BASE: Record<ListKind, string> = { active: "/admin/zayavky", archive: "/admin/arhiv" };

/** Адреса зі зміненим одним параметром — решта фільтрів лишається */
export function adminHref(
  current: Query & { page?: number },
  patch: Partial<Query & { page?: number }>,
  kind: ListKind = "active",
) {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(next)) {
    // page=1 у адресі не потрібна, а порожні фільтри тільки засмічують рядок
    if (value === undefined || value === "" || (key === "page" && value === 1)) continue;
    params.set(key, String(value));
  }

  const qs = params.toString();
  return qs ? `${BASE[kind]}?${qs}` : BASE[kind];
}

export default function Search({
  query,
  found,
  kind = "active",
}: {
  query: Query;
  found: number;
  kind?: ListKind;
}) {
  const filtered = Boolean(query.q || query.status || query.shipping);

  return (
    <div className={styles.wrap}>
      {/* Пошук і фільтр — один рядок: на телефоні три рядки на всю ширину
          з'їдали пів екрана ще до першої заявки */}
      <div className={styles.bar}>
        {/* Звичайна GET-форма: працює й без JS, адреса лишається такою, щоб її можна було зберегти */}
        <form className={styles.form} action={BASE[kind]} method="get">
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
            placeholder="№, імʼя, телефон"
            autoComplete="off"
          />

          <button type="submit" className={styles.searchBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <span className="visually-hidden">Знайти</span>
          </button>
        </form>

        <StatusFilter query={query} kind={kind} />
      </div>

      {filtered && (
        <div className={styles.result}>
          Знайдено: <strong>{found}</strong>
          <Link href={BASE[kind]} className={styles.reset}>
            Скинути
          </Link>
        </div>
      )}
    </div>
  );
}
