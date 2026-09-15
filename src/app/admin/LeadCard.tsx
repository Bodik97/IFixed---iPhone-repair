import Link from "next/link";
import type { Lead, LeadEvent } from "@/db/schema";
import Chat from "@/components/Chat";
import { describeStatus } from "@/db/leads";
import MoneyFields from "./MoneyFields";
import NoteField from "./NoteField";
import StatusSelect from "./StatusSelect";
import TtnField from "./TtnField";
import styles from "./page.module.css";

const sourceLabel: Record<string, string> = {
  landing: "головна",
  model: "модель",
  services: "послуги",
  "mail-in": "поштою",
};

const dateFormat = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default function LeadCard({
  lead: r,
  events,
  unread = 0,
  orders = 1,
}: {
  lead: Lead;
  events: LeadEvent[];
  /** Непрочитані від клієнта — майстер має бачити, що на нього чекають */
  unread?: number;
  /** Скільки всього звернень з цього номера, разом із цим */
  orders?: number;
}) {
  const s = describeStatus(r.status);
  const waitingShip = r.deliveryRequested && !r.ttn;

  return (
    <article
      className={`${styles.card} ${r.status === "new" ? styles.cardNew : ""} ${waitingShip ? styles.cardShip : ""}`}
    >
      <div className={styles.cardMain}>
        <div className={styles.cardTop}>
          {/* Номер, який клієнт диктує по телефону — тримаємо першим */}
          <span className={styles.orderNo}>№&#8202;{r.orderNo}</span>
          <span className={styles.name}>{r.name}</span>
          {r.clerkUserId ? (
            <span className={styles.tagAccount} title="Має акаунт — бачить статус у себе на сторінці">
              акаунт
            </span>
          ) : (
            <span className={styles.tagAnon} title="Без акаунта — пішло в Telegram">
              анонім
            </span>
          )}
          {orders > 1 && r.phone && (
            <Link
              href={`/admin/zayavky?q=${encodeURIComponent(r.phone)}`}
              className={styles.tagRepeat}
              title="Цей номер звертався раніше — показати всі його заявки"
            >
              {orders}-е звернення
            </Link>
          )}
          <span className={styles.when}>{dateFormat.format(r.createdAt)}</span>
          <span className={styles.source}>{sourceLabel[r.source] ?? r.source}</span>
        </div>

        <div className={styles.contacts}>
          {r.phone && (
            <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className={styles.link}>
              {r.phone}
            </a>
          )}
          {r.email && (
            <a href={`mailto:${r.email}`} className={styles.link}>
              {r.email}
            </a>
          )}
        </div>

        {(r.model || r.service) && <div className={styles.what}>{r.model ?? r.service}</div>}
        {r.problem && <p className={styles.problem}>{r.problem}</p>}

        {/* Доставка: показуємо, лише коли клієнт її попросив */}
        {r.deliveryRequested && (
          <div className={waitingShip ? styles.shipBoxHot : styles.shipBox}>
            <div className={styles.shipHead}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
                <path d="M3 7l9 4 9-4" />
                <path d="M12 11v10" />
              </svg>
              {waitingShip ? "Просить надіслати — ТТН не вписано" : "Відправлено"}
            </div>

            {r.deliveryAddress && <div className={styles.shipAddress}>{r.deliveryAddress}</div>}

            <TtnField id={r.id} ttn={r.ttn} />
          </div>
        )}

        {r.city && !r.deliveryRequested && <div className={styles.city}>{r.city}</div>}

        <NoteField id={r.id} events={events} />

        <MoneyFields
          id={r.id}
          price={r.price}
          partsCost={r.partsCost}
          prepayment={r.prepayment}
          prepaidAt={r.prepaidAt}
          paidAt={r.paidAt}
        />

        <div className={styles.chatRow}>
          <Chat leadId={r.id} side="master" unread={unread} />

          <a
            href={`/admin/zayavky/${r.id}/kvytantsiya`}
            target="_blank"
            rel="noopener"
            className="btn btn-ghost"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9V3h12v6" />
              <path d="M6 18H4v-6h16v6h-2" />
              <path d="M6 14h12v7H6z" />
            </svg>
            Квитанція
          </a>
        </div>
      </div>

      <div className={styles.cardSide}>
        <StatusSelect id={r.id} status={r.status} />
        <span className={styles.hint}>{s.hint}</span>
      </div>
    </article>
  );
}
