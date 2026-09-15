import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import BookingForm from "@/components/BookingForm";
import Reveal from "@/components/Reveal";
import ReviewSlider from "@/components/ReviewSlider";
import ReviewForm from "@/components/ReviewForm";
import StatusCheck from "@/components/StatusCheck";
import { getPublishedReviews, getReviewByUser } from "@/db/reviews";
import { services } from "@/data/services";
import { site } from "@/data/site";
import {
  bookingModels,
  faq,
  heroStats,
  howItWorks,
  mailInSteps,
  modelGroups,
  reviews as fallbackReviews,
  topServices,
  works,
} from "@/data/landing";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "iFix — ремонт iPhone у Львові та Новому Роздолі",
  description:
    "Безкоштовна діагностика, фіксована ціна після неї, гарантія 30 днів. Екран або акумулятор — 40 хвилин при вас. Приймаємо й Новою Поштою.",
  alternates: { canonical: "/" },
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

export default async function Home() {
  // Справжні відгуки клієнтів; поки їх немає — показуємо початкові з макета
  const published = await getPublishedReviews(6);
  const shownReviews = published.length
    ? published.map((r) => ({
        id: r.id,
        text: r.text,
        author: [r.authorName, r.city, r.device].filter(Boolean).join(" · "),
        viaGoogle: r.viaGoogle,
        rating: r.rating,
        // Фото роботи лежить у приватному сховищі — віддаємо своїм маршрутом
        image: r.imagePath ? `/api/reviews/${r.id}/image` : null,
      }))
    : fallbackReviews.map((r, i) => ({
        ...r,
        id: `fallback-${i}`,
        viaGoogle: false,
        rating: 5,
        image: null,
      }));

  const hasRealReviews = published.length > 0;

  const { userId } = await auth();
  const alreadyLeft = userId ? Boolean(await getReviewByUser(userId)) : false;

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
              Відкрито · відповідь за 15 хвилин
            </span>

            <h1 className={`${styles.h1} nUp nUp-1`}>
              Ремонт iPhone <span className={styles.accent}>без сюрпризів</span> у ціні
            </h1>

            <p className={`${styles.heroLead} nUp nUp-2`}>
              Безкоштовна діагностика, потім фіксована ціна — і вона вже не змінюється. Екран або
              акумулятор міняємо за 40 хвилин при вас.
            </p>

            <div className={`${styles.heroCta} nUp nUp-3`}>
              <Link href="#book" className="btn btn-accent btn-lg btn-hero">
                Безкоштовна діагностика
              </Link>
              <a href={site.phones[0].href} className="btn btn-ghost btn-lg">
                Подзвонити
              </a>
            </div>
          </div>

          <div className={`${styles.heroSide} nUp nUp-2`}>
            <div className={`${styles.heroShot} anim-float`} />
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
          </div>
        </div>
      </section>

      {/* Послуги */}
      <section id="services" className={`container ${styles.services}`}>
        <div className={styles.sectionHead}>
          <div>
            <div className="kicker">Що ремонтуємо</div>
            <h2 className={styles.h2}>Усе, що трапляється з iPhone</h2>
          </div>
          <p className={styles.sectionNote}>
            Оригінал або якісний аналог — показуємо обидва варіанти й різницю в ціні.
          </p>
        </div>

        <div className={styles.serviceGrid}>
          {topServices.map((s) => {
            const icon = services.find((x) => x.slug === s.slug)?.icon;
            return (
              <Link key={s.no} href="/poslugy" className={`card ${styles.serviceCard}`}>
                <div className={styles.serviceHead}>
                  <span className={styles.serviceIcon}>
                    {icon && (
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#DAFF3D"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        dangerouslySetInnerHTML={{ __html: icon }}
                      />
                    )}
                  </span>
                  <span className={styles.serviceNo}>{s.no}</span>
                </div>

                <h3>{s.title}</h3>
                <p className={styles.serviceBody}>{s.body}</p>

                <div className={styles.serviceMeta}>
                  <span>{s.meta}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" className={styles.serviceArrow}>
                    <path d="M5 12h13" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        <p className={styles.sectionLink}>
          <Link href="/poslugy">Усі 12 послуг детально →</Link>
        </p>
      </section>

      {/* Репутація */}
      <section className={styles.reputation}>
        <span aria-hidden="true" className={styles.repBg}>
          <span className={styles.repPhoto} />
          <span className={styles.repVeil} />
        </span>
        <div className={styles.repInner}>
          <h2 className={styles.repTitle}>Кожен ремонт — це наша репутація в місті</h2>
          <p className={styles.repText}>
            Ми невеликий сервіс. Простіше зробити добре з першого разу, ніж потім комусь дивитися в
            очі. Тому показуємо зняті деталі, ємність акумулятора до і після — і не міняємо ціну на
            ходу.
          </p>
        </div>
      </section>

      {/* Як це працює */}
      <section id="how" className={`container ${styles.how}`}>
        <div className="kicker">Як це працює</div>
        <h2 className={`${styles.h2} ${styles.howTitle}`}>Три кроки — і телефон знову ваш</h2>

        <div className={styles.steps}>
          {howItWorks.map((s, i) => (
            <Reveal key={s.no} delay={i * 110}>
              <div className={styles.stepNo}>{s.no}</div>
              <span className={`${styles.stepLine} anim-grow`} />
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepBody}>{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Моделі */}
      <section id="models" className={styles.models}>
        <div className={`container ${styles.modelsInner}`}>
          <div className={styles.sectionHead}>
            <div>
              <div className="kicker">Моделі</div>
              <h2 className={styles.h2}>Які пристрої беремо</h2>
            </div>
            <p className={styles.sectionNote}>
              Екрани й акумулятори на ці моделі зазвичай у наявності.
            </p>
          </div>

          <div className={styles.groupList}>
            {modelGroups.map((g) => (
              <div key={g.label} className={styles.group}>
                <div className={styles.groupLabel}>{g.label}</div>
                <div className={styles.groupItems}>
                  {g.items.map((m) => (
                    <span key={m} className={styles.modelChip}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className={styles.modelsNote}>
            Не знайшли свою модель — <a href={site.phones[0].href}>зателефонуйте</a>, майже завжди
            беремо. <Link href="/modeli">Усі моделі детально</Link>
          </p>
        </div>
      </section>

      {/* До і після */}
      <section className={styles.worksSection}>
        <div className={`container ${styles.worksInner}`}>
          <div className="kicker">Наші роботи</div>
          <h2 className={`${styles.h2} ${styles.worksTitle}`}>До і після</h2>

          <div className={styles.worksGrid}>
            {works.map((w) => (
              <figure key={w.caption} className={styles.work}>
                <div className={`zoom ${styles.workMedia}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={w.img} alt="" loading="lazy" />
                </div>
                <figcaption className={styles.workCaption}>{w.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Відгуки */}
      <section className={styles.reviewsSection}>
        <div className={`container ${styles.reviewsInner}`}>
          <div className={styles.reviewsHead}>
            <div>
              <div className="kicker">Відгуки</div>
              <h2 className={styles.h2}>Що кажуть клієнти</h2>
            </div>

            {hasRealReviews && (
              <p className={styles.reviewsProof}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                Пишуть лише клієнти з акаунтом і підтвердженою поштою
              </p>
            )}
          </div>

          <ReviewSlider reviews={shownReviews} />


          <div className={styles.reviewFormWrap}>
            <div>
              <h3 className={styles.reviewFormTitle}>Розкажіть, як усе пройшло</h3>
              <p className={styles.reviewFormText}>
                Відгуки лишають клієнти з акаунтом. Це найчесніший спосіб показати
                новим людям, чого чекати від сервісу.
              </p>
            </div>
            <ReviewForm signedIn={Boolean(userId)} alreadyLeft={alreadyLeft} />
          </div>
        </div>
      </section>

      {/* Поштою */}
      <section className={`container ${styles.mailSection}`}>
        <div className={styles.mailBox}>
          <div>
            <div className="kicker">Ремонт поштою</div>
            <h2 className={styles.mailTitle}>Не у Львові? Надішліть Новою Поштою</h2>
            <p className={styles.mailLead}>
              Діагностуємо, телефонуємо з ціною, ремонтуємо. Назад надсилаємо за свій кошт.
            </p>
            <Link href="/poshtoyu" className="btn btn-accent">
              Як надіслати
            </Link>
          </div>

          <div className={styles.mailSteps}>
            {mailInSteps.map((s, i) => (
              <div key={s.no}>
                {i > 0 && <span className={styles.divider} />}
                <div className={styles.mailStep}>
                  <span className={styles.mailNo}>{s.no}</span>
                  <span className={styles.mailText}>{s.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={`container ${styles.faqSection}`}>
        <div>
          <div className="kicker">Часті питання</div>
          <h2 className={styles.h2}>Коротко про головне</h2>
        </div>

        <div className={styles.faqList}>
          {faq.map((f) => (
            <details key={f.q} className={styles.faqItem}>
              <summary className={styles.faqQ}>{f.q}</summary>
              <p className={styles.faqA}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <StatusCheck />

      {/* Запис */}
      <section id="book" className={`container ${styles.book}`}>
        <div className={styles.bookGrid}>
          <div className={styles.bookCopy}>
            <div className="kicker">Запис на діагностику</div>
            <h2 className={styles.h2}>Опишіть проблему — відповімо за 15 хвилин</h2>
            <p className={styles.bookLead}>
              Достатньо моделі та кількох слів про симптом. Передзвонимо, скажемо орієнтовну ціну й
              термін.
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

              <div className={styles.contact}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DAFF3D" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span>Львів і Новий Розділ · адресу надсилаємо після запису</span>
              </div>
            </div>
          </div>

          <BookingForm
            source="landing"
            select={{ name: "model", label: "Модель", placeholder: "Оберіть модель", options: [...bookingModels] }}
          />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
