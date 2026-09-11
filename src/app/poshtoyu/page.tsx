import type { Metadata } from "next";
import Link from "next/link";
import Accordion from "@/components/Accordion";
import MailInForm from "@/components/MailInForm";
import PackingList from "@/components/PackingList";
import TtnTracker from "@/components/TtnTracker";
import { faq, heroStats, popular, steps } from "@/data/mailIn";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Ремонт поштою — Нова Пошта по Україні",
  description:
    "Надішліть iPhone Новою Поштою з будь-якого міста: безкоштовна діагностика, фіксована ціна після дзвінка, повернення за наш кошт, гарантія 30 днів.",
  alternates: { canonical: "/poshtoyu" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function MailInPage() {
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
              Приймаємо посилки з усієї України
            </span>

            <h1 className={`${styles.h1} nUp nUp-1`}>
              Ремонт <span className={styles.accent}>поштою</span> — без поїздки до Львова
            </h1>

            <p className={`${styles.heroLead} nUp nUp-2`}>
              Надсилаєте Новою Поштою — діагностуємо, телефонуємо з фіксованою ціною, ремонтуємо і
              повертаємо за свій кошт.
            </p>

            <div className={`${styles.heroCta} nUp nUp-3`}>
              <Link href="#send" className="btn btn-accent btn-lg btn-hero">
                Оформити відправку
              </Link>
              <Link href="#track" className="btn btn-ghost btn-lg">
                Де моя посилка
              </Link>
            </div>
          </div>

          <div className={`${styles.heroSide} nUp nUp-2`}>
            <div className={styles.statsCard}>
              {heroStats.map((s, i) => (
                <div key={s.note} className={styles.statRow}>
                  {i > 0 && <span className={styles.divider} />}
                  <div className={styles.stat}>
                    <span className={styles.statValue}>
                      {s.value}
                      <span className={styles.statUnit}>{s.unit}</span>
                    </span>
                    <span className={styles.statNote}>{s.note}</span>
                  </div>
                </div>
              ))}
            </div>

            <div aria-hidden="true" className={styles.tracker}>
              <span className={`${styles.parcel} anim-roll`}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#DAFF3D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
                  <path d="M3 7l9 4 9-4" />
                  <path d="M12 11v10" />
                </svg>
              </span>
              <div className={styles.trackerBody}>
                <div className={styles.trackerLabel}>Ваша посилка в дорозі</div>
                <div className={styles.trackerBar}>
                  <div className={`${styles.trackerFill} anim-grow`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Кроки */}
      <section className={`container ${styles.steps}`}>
        <div className="kicker">Як це працює</div>
        <h2 className={styles.stepsTitle}>П&apos;ять кроків від відправки до повернення</h2>

        <div className={styles.stepGrid}>
          {steps.map((s) => (
            <article key={s.no} className={`card ${styles.step}`}>
              <div className={styles.stepNo}>{s.no}</div>
              <div className={styles.stepTitle}>{s.title}</div>
              <p className={styles.stepBody}>{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Пам'ятка */}
      <section className={styles.packing}>
        <div className={`container ${styles.packingGrid}`}>
          <div>
            <div className="kicker">Пам&apos;ятка</div>
            <h2 className={styles.packingTitle}>Як спакувати, щоб доїхало цілим</h2>
            <p className={styles.packingLead}>
              Відмітьте пункти — це той самий список, який ми диктуємо телефоном.
            </p>
          </div>

          <PackingList />
        </div>
      </section>

      {/* Популярні моделі */}
      <section className={`container ${styles.popular}`}>
        <div className={styles.popularHead}>
          <div>
            <div className="kicker">Що надсилають найчастіше</div>
            <h2 className={styles.popularTitle}>Оберіть модель — і одразу до деталей</h2>
          </div>
          <Link href="/modeli" className={styles.allLink}>
            Весь каталог
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12h13" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        <div className={styles.popularGrid}>
          {popular.map((p) => (
            <Link key={p.name} href={`/modeli/${p.slug}`} className={styles.popularCard}>
              <span className={styles.popularPhoto} style={{ backgroundImage: `url("${p.img}")` }} />
              <span className={styles.popularVeil} />
              <span className={styles.popularName}>{p.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <TtnTracker />

      {/* Оформлення */}
      <section id="send" className={`container ${styles.send}`}>
        <div className={styles.sendGrid}>
          <div>
            <div className="kicker">Оформлення</div>
            <h2 className={styles.sendTitle}>Заповніть — надішлемо адресу відділення</h2>
            <p className={styles.sendLead}>
              Після заявки приходить SMS з адресою, отримувачем і номером замовлення. Далі просто
              віддаєте пакунок на пошту.
            </p>

            <div className={styles.notes}>
              <div className={styles.note}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DAFF3D" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3.5 2" />
                </svg>
                <span>Приймаємо посилки Пн–Сб до 18:00</span>
              </div>

              <div className={styles.note}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DAFF3D" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 6h16v12H4z" />
                  <path d="M4 7l8 6 8-6" />
                </svg>
                <span>Пишемо в Telegram чи Viber, якщо так зручніше</span>
              </div>

              <div className={styles.note}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DAFF3D" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <span>Оплата після ремонту — накладеним платежем</span>
              </div>
            </div>
          </div>

          <MailInForm />
        </div>
      </section>

      {/* FAQ */}
      <section className={`container ${styles.faqSection}`}>
        <div>
          <div className="kicker">Часті питання</div>
          <h2 className={styles.faqTitle}>Про доставку й оплату</h2>
        </div>
        <div className={styles.faqList}>
          <Accordion items={faq} />
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </>
  );
}
