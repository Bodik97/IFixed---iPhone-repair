import { describeStatus, STAGES } from "@/db/leads";
import type { Lead } from "@/db/schema";
import { site } from "@/data/site";
import styles from "./ActiveOrder.module.css";

const dateTime = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default function ActiveOrder({ lead }: { lead: Lead }) {
  const progress = describeStatus(lead.status);
  const what = lead.model ?? lead.service ?? "Ремонт";
  const shortId = lead.id.slice(0, 8);

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div>
          <span className={styles.status}>
            {progress.active && <span className="pulse" />}
            {progress.label}
          </span>

          <h2 className={styles.title}>{what}</h2>

          <div className={styles.meta}>
            Заявка №{shortId} · прийнято {dateTime.format(lead.createdAt)}
          </div>

          {lead.problem && <p className={styles.problem}>«{lead.problem}»</p>}
        </div>

        <div className={styles.eta}>
          <div className={styles.etaLabel}>Оновлено</div>
          <div className={styles.etaValue}>{dateTime.format(lead.updatedAt)}</div>
        </div>
      </div>

      {progress.stage >= 0 ? (
        <>
          <div className={styles.bar}>
            <div className={styles.barFill} style={{ width: `${progress.percent}%` }} />
          </div>

          <div className={styles.stages}>
            {STAGES.map((title, i) => {
              const done = i <= progress.stage;
              return (
                <div key={title} className={styles.stage}>
                  <div className={styles.stageTop}>
                    <span className={done ? styles.dotDone : styles.dot}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0B0C0E" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: done ? 1 : 0 }} aria-hidden="true">
                        <path d="M5 12.5l4.5 4.5L19 7" />
                      </svg>
                    </span>
                    <span className={done ? styles.stageTitleDone : styles.stageTitle}>{title}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className={styles.closed}>
          Заявку закрито. Якщо це помилка — зателефонуйте, розберемось.
        </p>
      )}

      <div className={styles.actions}>
        <a href={site.phones[0].href} className="btn btn-accent btn-hero">
          Подзвонити майстру
        </a>
      </div>
    </div>
  );
}
