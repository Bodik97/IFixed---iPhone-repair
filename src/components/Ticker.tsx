import styles from "./Ticker.module.css";

export default function Ticker({ items }: { items: string[] }) {
  const row = (
    <div className={styles.row}>
      {items.map((t) => (
        <span key={t} className={styles.item}>
          {t}
          <span className={styles.dot}>·</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={styles.wrap}>
      <div className={`${styles.track} ticker-track`}>
        {row}
        <span aria-hidden="true" className={styles.clone}>
          {row}
        </span>
      </div>
    </div>
  );
}
