import styles from "./History.module.css";

export type HistoryRow = {
  id: string;
  orderNo: number;
  price: number | null;
  paid: boolean;
  what: string;
  problem: string | null;
  date: string;
  label: string;
  hint: string;
  tone: "progress" | "ready" | "shipped" | "done" | "closed";
  active: boolean;
  ttn: string | null;
};

export default function History({ rows }: { rows: HistoryRow[] }) {
  const shown = rows;

  return (
    <section className={styles.section}>
      {shown.length > 0 ? (
        <div className={styles.list}>
          {shown.map((r) => (
            <article key={r.id} className={styles.row}>
              <div className={styles.main}>
                <div className={styles.device}>
                  <span className={styles.no}>№&#8202;{r.orderNo}</span>
                  {r.what}
                </div>
                {r.problem && <div className={styles.work}>{r.problem}</div>}
                {r.price !== null && (
                  <div className={styles.price}>
                    {r.price.toLocaleString("uk-UA")} ₴
                    {r.paid && <span className={styles.paid}>оплачено</span>}
                  </div>
                )}
                {r.ttn && (
                  <div className={styles.ttn}>
                    Накладна{" "}
                    <a
                      href={`https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(r.ttn)}`}
                      target="_blank"
                      rel="noopener"
                    >
                      {r.ttn}
                    </a>
                  </div>
                )}
              </div>

              <div className={styles.side}>
                <span className={`${styles.badge} ${styles[`tone_${r.tone}`]}`}>{r.label}</span>
                <time className={styles.date}>{r.date}</time>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>Тут поки порожньо.</div>
      )}
    </section>
  );
}
