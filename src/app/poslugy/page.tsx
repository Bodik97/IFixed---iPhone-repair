import type { Metadata } from "next";
import Link from "next/link";
import BookingForm from "@/components/BookingForm";
import ServiceCatalog from "@/components/ServiceCatalog";
import Ticker from "@/components/Ticker";
import { services } from "@/data/services";
import { flow, promises, tickerItems } from "@/data/servicesPage";
import { site } from "@/data/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Послуги сервісу",
  description:
    "12 видів ремонту iPhone, iPad і Apple Watch: екран, акумулятор, роз'єм, камера, залив водою, мікропайка. Безкоштовна діагностика, фіксована ціна, гарантія 30 днів.",
  alternates: { canonical: "/poslugy" },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: services.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      name: s.title,
      description: s.body,
      provider: { "@type": "LocalBusiness", name: site.name },
      areaServed: site.cities,
    },
  })),
};

export default function ServicesPage() {
  return (
    <>
      {/* Герой */}
      <section className={styles.hero}>
        <span aria-hidden="true" className={styles.heroBg}>
          <span className={styles.heroPhoto} />
          <span className={styles.heroVeil} />
          <span className={`${styles.heroGlow} anim-drift`} />
        </span>

        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <span className={`${styles.badge} nUp`}>
              <span className="pulse" />
              Діагностика безкоштовна · ціна фіксується до робіт
            </span>

            <h1 className={`${styles.h1} nUp nUp-1`}>
              Послуги <span className={styles.accent}>сервісу</span> iFix
            </h1>

            <p className={`${styles.heroLead} nUp nUp-2`}>
              Від заміни екрана за 40 хвилин до пайки на платі. Оберіть послугу — покажемо, як вона
              проходить і скільки триває.
            </p>

            <div className={`${styles.heroCta} nUp nUp-3`}>
              <Link href="#book" className="btn btn-accent btn-lg btn-hero">
                Записатись
              </Link>
              <Link href="/modeli" className="btn btn-ghost btn-lg">
                Обрати модель
              </Link>
            </div>
          </div>

          <div className={`${styles.heroShot} nUp nUp-2 anim-float`}>
            <span className={styles.shotPhoto} />
            <span className={styles.shotVeil} />
            <span className={styles.shotCaption}>Пайка й мікроелектроніка — наш профіль</span>
          </div>
        </div>
      </section>

      <Ticker items={tickerItems} />

      <ServiceCatalog />

      {/* Процес */}
      <section className={styles.process}>
        <div className={`container ${styles.processInner}`}>
          <div className="kicker">Процес</div>
          <h2 className={styles.processTitle}>Як проходить будь-яка робота</h2>

          <div className={styles.flowGrid}>
            {flow.map((f) => (
              <div key={f.no} className={styles.flowItem}>
                <div className={styles.flowNo}>{f.no}</div>
                <div className={styles.bar}>
                  <div className={`${styles.barFill} anim-grow`} />
                </div>
                <h3 className={styles.flowTitle}>{f.title}</h3>
                <p className={styles.flowBody}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Показники */}
      <section className={`container ${styles.promises}`}>
        <div className={styles.promiseGrid}>
          {promises.map((p) => (
            <div key={p.note} className={`card ${styles.promise}`}>
              <div className={styles.promiseValue}>{p.value}</div>
              <div className={styles.promiseNote}>{p.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Запис */}
      <section id="book" className={`container ${styles.book}`}>
        <div className={styles.bookGrid}>
          <div>
            <div className="kicker">Запис</div>
            <h2 className={styles.bookTitle}>Оберіть послугу — решту з&apos;ясуємо в розмові</h2>
            <p className={styles.bookLead}>
              Передзвонимо за 15 хвилин у робочі години й одразу скажемо орієнтир по ціні та терміну.
            </p>

            <div className={styles.contacts}>
              <div className={styles.contact}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DAFF3D" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
                </svg>
                <span>
                  {site.phones.map((p, i) => (
                    <span key={p.href}>
                      {i > 0 && " · "}
                      <a href={p.href} className={styles.contactLink}>
                        {p.label}
                      </a>
                    </span>
                  ))}
                </span>
              </div>

              <div className={styles.contact}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DAFF3D" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3.5 2" />
                </svg>
                <span>
                  {site.hours} · {site.hoursNote}
                </span>
              </div>
            </div>
          </div>

          <BookingForm
            source="services"
            select={{
              name: "service",
              label: "Послуга",
              placeholder: "Оберіть послугу",
              options: services.map((s) => s.title),
            }}
            submitLabel="Записатись"
          />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
    </>
  );
}
