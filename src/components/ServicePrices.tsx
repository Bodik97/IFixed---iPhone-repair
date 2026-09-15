import Link from "next/link";
import { iphones } from "@/data/models";
import { getModelPrice, PRICES_PUBLISHED, uah, type PricedJob } from "@/data/prices";
import styles from "./ServicePrices.module.css";

/**
 * Ціна цієї роботи по кожній моделі.
 *
 * Вилка «2 600 — 23 000 ₴» у шапці показує лише порядок сум. Людина ж приходить
 * із конкретним телефоном, і їй потрібен один рядок — свій.
 */
export default function ServicePrices({ job }: { job: PricedJob }) {
  if (!PRICES_PUBLISHED) return null;

  const rows = iphones
    .map((m) => ({ model: m, price: getModelPrice(m.slug)?.[job] }))
    .filter((r): r is { model: (typeof iphones)[number]; price: NonNullable<typeof r.price> } =>
      r.price !== undefined,
    );

  if (rows.length === 0) return null;

  // Чи є хоч у когось два варіанти модуля — від цього залежить, чи потрібен
  // другий стовпчик
  const hasTwo = rows.some((r) => typeof r.price !== "number");

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>Ціна за моделями</h2>
        <p className={styles.lead}>
          Під ключ — робота разом із деталлю. Остаточну суму називаємо після безкоштовної
          діагностики, і далі вона вже не змінюється.
        </p>
      </div>

      <div className={styles.table}>
        <div className={styles.headRow}>
          <span>Модель</span>
          {hasTwo ? (
            <>
              <span className={styles.col}>Аналог</span>
              <span className={styles.col}>Оригінал</span>
            </>
          ) : (
            <span className={styles.col}>Ціна</span>
          )}
        </div>

        {rows.map(({ model, price }) => (
          <Link key={model.slug} href={`/modeli/${model.slug}`} className={styles.row}>
            <span className={styles.model}>{model.name}</span>

            {typeof price === "number" ? (
              <span className={hasTwo ? styles.valueWide : styles.value}>{uah(price)}</span>
            ) : (
              <>
                <span className={styles.value}>{uah(price.analog)}</span>
                <span className={styles.value}>{uah(price.original)}</span>
              </>
            )}
          </Link>
        ))}
      </div>

      <p className={styles.note}>
        Немає вашої моделі в списку?{" "}
        <Link href="/modeli" className={styles.link}>
          Подивіться каталог
        </Link>{" "}
        або зателефонуйте — скажемо ціну одразу.
      </p>
    </section>
  );
}
