import { describeStatus } from "@/db/leads";
import type { Lead, LeadEvent } from "@/db/schema";
import { site } from "@/data/site";
import DeliveryRequest from "./DeliveryRequest";
import Parcel from "./Parcel";
import RepairSteps from "./RepairSteps";
import Timeline from "./Timeline";
import styles from "./RepairCard.module.css";

const dateTime = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

/** Іконка стадії — щоб стан читався не лише кольором */
function StatusIcon({ tone }: { tone: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (tone === "shipped") {
    return (
      <svg {...common}>
        <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
        <path d="M3 7l9 4 9-4" />
      </svg>
    );
  }

  if (tone === "ready" || tone === "done") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.5 2.5L16 9.5" />
      </svg>
    );
  }

  if (tone === "closed") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9l-6 6" />
        <path d="M9 9l6 6" />
      </svg>
    );
  }

  // У роботі
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function RepairCard({ lead, events }: { lead: Lead; events: LeadEvent[] }) {
  const s = describeStatus(lead.status);
  const what = lead.model ?? lead.service ?? "Ремонт";
  const phone = site.phones[0];

  return (
    <article className={`${styles.card} ${styles[s.tone]}`}>
      <header className={styles.head}>
        <div className={styles.headMain}>
          <span className={styles.orderNo}>№&#8202;{lead.orderNo}</span>
          <h2 className={styles.what}>{what}</h2>
        </div>

        <span className={styles.badge}>
          <StatusIcon tone={s.tone} />
          {s.label}
        </span>
      </header>

      <p className={styles.hint}>{s.hint}</p>

      <RepairSteps status={s} />

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>Прийнято</dt>
          <dd>{dateTime.format(lead.createdAt)}</dd>
        </div>

        {lead.problem && (
          <div className={styles.fact}>
            <dt>Проблема</dt>
            <dd>{lead.problem}</dd>
          </div>
        )}

        {lead.price !== null && (
          <div className={styles.fact}>
            <dt>Ціна</dt>
            <dd className={styles.price}>
              {lead.price.toLocaleString("uk-UA")} ₴
              <span className={styles.priceNote}>
                {lead.paidAt ? "оплачено" : "погоджена — не зміниться"}
              </span>
            </dd>
          </div>
        )}
      </dl>

      {/* Посилка — головне, що людина шукає, коли пристрій уже відправили */}
      {lead.ttn && <Parcel ttn={lead.ttn} address={lead.deliveryAddress} />}

      {/* Доставку пропонуємо, лише коли є що відправляти */}
      {s.finished && !lead.ttn && (
        <DeliveryRequest
          id={lead.id}
          requested={lead.deliveryRequested}
          address={lead.deliveryAddress}
        />
      )}

      <Timeline events={events} />

      <div className={styles.actions}>
        <a href={phone.href} className={`btn btn-ghost ${styles.action}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
          </svg>
          Подзвонити
        </a>

        {site.messengers[0] && (
          <a
            href={site.messengers[0].href}
            target="_blank"
            rel="noopener"
            className={`btn btn-ghost ${styles.action}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 5h16v11H9l-5 4z" />
            </svg>
            Написати
          </a>
        )}
      </div>
    </article>
  );
}
