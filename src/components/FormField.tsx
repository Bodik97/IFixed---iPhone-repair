import styles from "./FormField.module.css";

/**
 * Поле форми з підписом, підказкою й помилкою.
 *
 * Під полем завжди щось одне: поки все гаразд — підказка, що сюди вписати;
 * щойно щось не так — помилка на її місці, словами, що саме виправити.
 * Саме поле передається всередину: йому треба дати `id`, а при помилці —
 * клас `field-invalid`, `aria-invalid` і `aria-describedby={`${id}-note`}`.
 */
export default function FormField({
  id,
  label,
  hint,
  error,
  counter,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  /** Лічильник символів праворуч, напр. «12 / 500» */
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.row}>
      <label htmlFor={id}>{label}</label>
      {children}

      <div className={styles.under}>
        {error ? (
          <span id={`${id}-note`} className={styles.error} role="alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5v5" />
              <path d="M12 16.2v.1" />
            </svg>
            {error}
          </span>
        ) : (
          <span id={`${id}-note`} className={styles.hint}>
            {hint}
          </span>
        )}
        {counter && <span className={styles.counter}>{counter}</span>}
      </div>
    </div>
  );
}

/** Властивості самого поля: стан помилки для стилю й для читача екрана */
export function fieldState(id: string, error?: string | null) {
  return {
    id,
    className: error ? "field field-invalid" : "field",
    "aria-invalid": error ? true : undefined,
    "aria-describedby": `${id}-note`,
  } as const;
}
