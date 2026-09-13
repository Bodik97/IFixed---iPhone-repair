import { describeStatus, STAGES } from "@/db/leads";
import type { Lead, LeadEvent } from "@/db/schema";
import { site } from "@/data/site";
import DeliveryRequest from "./DeliveryRequest";
import Timeline from "./Timeline";
import styles from "./ActiveOrder.module.css";

const dateTime = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default function ActiveOrder({ lead, events }: { lead: Lead; events: LeadEvent[] }) {
  const s = describeStatus(lead.status);
  const what = lead.model ?? lead.service ?? "Ремонт";

  return (
    <div className={`${styles.card} ${styles[s.tone]}`}>
      {/* Головна новина зверху — те, заради чого клієнт відкрив кабінет */}
      {s.finished && (
        <div className={styles.banner}>
          <span className={styles.bannerIcon} aria-hidden="true">
            {lead.status === "shipped" ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
                <path d="M3 7l9 4 9-4" />
                <path d="M12 11v10" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12.5l2.5 2.5L16 9.5" />
              </svg>
            )}
          </span>

          <div>
            <div className={styles.bannerTitle}>
              {lead.status === "shipped"
                ? "Пристрій відправлено"
                : lead.status === "done"
                  ? "Ремонт завершено"
                  : "Пристрій готовий"}
            </div>
            <p className={styles.bannerText}>{s.hint}</p>

            {lead.ttn && (
              <p className={styles.ttn}>
                Накладна <strong>{lead.ttn}</strong> ·{" "}
                <a
                  href={`https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(lead.ttn)}`}
                  target="_blank"
                  rel="noopener"
                >
                  відстежити
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      <div className={styles.head}>
        <div>
          <span className={`${styles.status} ${styles[`tone_${s.tone}`]}`}>
            {s.active && s.tone === "progress" && <span className="pulse" />}
            {s.label}
          </span>

          <h2 className={styles.title}>{what}</h2>

          <div className={styles.meta}>
            Замовлення №{lead.orderNo} · прийнято {dateTime.format(lead.createdAt)}
          </div>

          {lead.problem && <p className={styles.problem}>«{lead.problem}»</p>}

          {/* Фіксована ціна — головна обіцянка сервісу, тож показуємо її прямо тут */}
          {lead.price !== null && (
            <div className={styles.price}>
              <span className={styles.priceValue}>{lead.price.toLocaleString("uk-UA")} ₴</span>
              <span className={styles.priceNote}>
                {lead.paidAt ? "оплачено" : "погоджена ціна — не зміниться"}
              </span>
            </div>
          )}
        </div>

        <div className={styles.eta}>
          <div className={styles.etaLabel}>Оновлено</div>
          <div className={styles.etaValue}>{dateTime.format(lead.updatedAt)}</div>
        </div>
      </div>

      {s.stage >= 0 ? (
        <>
          <div className={styles.bar}>
            <div className={`${styles.barFill} anim-grow`} style={{ width: `${s.percent}%` }} />
          </div>

          <ol className={styles.stages}>
            {STAGES.map((title, i) => {
              const done = i <= s.stage;
              return (
                <li key={title} className={styles.stage}>
                  <span className={done ? styles.dotDone : styles.dot}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0B0C0E" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: done ? 1 : 0 }} aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                  </span>
                  <span className={done ? styles.stageTitleDone : styles.stageTitle}>{title}</span>
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <p className={styles.closedText}>{s.hint}</p>
      )}

      {/* Доставка: пропонуємо, щойно пристрій готовий */}
      {lead.status === "ready" && (
        <DeliveryRequest
          id={lead.id}
          requested={lead.deliveryRequested}
          address={lead.deliveryAddress}
        />
      )}

      <Timeline events={events} />

      <div className={styles.actions}>
        <a href={site.phones[0].href} className="btn btn-ghost">
          Подзвонити майстру
        </a>
      </div>
    </div>
  );
}
