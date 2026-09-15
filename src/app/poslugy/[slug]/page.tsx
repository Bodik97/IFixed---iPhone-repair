import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import BookLink from "@/components/BookLink";
import Reveal from "@/components/Reveal";
import ServicePrices from "@/components/ServicePrices";
import { serviceDetails } from "@/data/serviceDetails";
import { services } from "@/data/services";
import { jobRange, PRICED_JOBS, PRICES_PUBLISHED, uah } from "@/data/prices";
import { site } from "@/data/site";
import styles from "./page.module.css";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};

  return {
    title: `${service.title} — як ми це робимо`,
    description: serviceDetails[slug]?.intro ?? service.body,
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const service = services.find((s) => s.slug === slug);
  const detail = serviceDetails[slug];
  if (!service || !detail) notFound();

  // Вилка по каталогу — лише для робіт, ціна яких залежить від моделі
  const range = PRICED_JOBS.includes(slug as (typeof PRICED_JOBS)[number])
    ? jobRange(slug as (typeof PRICED_JOBS)[number])
    : null;

  const others = services.filter((s) => s.slug !== slug && serviceDetails[s.slug]).slice(0, 4);

  return (
    <div className={styles.page}>
      <div className={styles.navRow}>
        <BackButton fallback="/poslugy" />
        <nav className={styles.crumbs} aria-label="Хлібні крихти">
          <Link href="/">Головна</Link>
          <span className={styles.sep}>/</span>
          <Link href="/poslugy">Послуги</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>{service.title}</span>
        </nav>
      </div>

      <header className={styles.hero}>
        <span className={styles.icon} aria-hidden="true">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            dangerouslySetInnerHTML={{ __html: service.icon }}
          />
        </span>

        <h1 className={styles.h1}>{service.title}</h1>
        <p className={styles.intro}>{detail.intro}</p>

        <div className={styles.meta}>
          <span className={styles.time}>{service.time}</span>
          {service.tags.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
          {PRICES_PUBLISHED && range && (
            <span className={styles.price}>
              {uah(range.min)} — {uah(range.max)}
            </span>
          )}
        </div>

        <div className={styles.cta}>
          <BookLink service={service.title} className="btn btn-accent btn-lg btn-hero">
            Записатись
          </BookLink>
          <a href={site.phones[0].href} className="btn btn-ghost btn-lg">
            {site.phones[0].label}
          </a>
        </div>
      </header>

      {detail.warning && (
        <aside className={styles.warning}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3.5l9 16H3z" />
            <path d="M12 10v4" />
            <path d="M12 17v.1" />
          </svg>
          <p>{detail.warning}</p>
        </aside>
      )}

      <section className={styles.section} aria-labelledby="oznaky">
        <h2 id="oznaky" className={styles.h2}>
          Коли це до нас
        </h2>
        <ul className={styles.signs}>
          {detail.signs.map((s) => (
            <li key={s}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              {s}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="yak">
        <h2 id="yak" className={styles.h2}>
          Як ми це робимо
        </h2>
        <ol className={styles.steps}>
          {detail.how.map((step, i) => (
            <Reveal key={step.title} delay={i * 90}>
              <li className={styles.step}>
                <span className={styles.stepNo}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepBody}>{step.body}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="vhodyt">
        <h2 id="vhodyt" className={styles.h2}>
          Що входить у ціну
        </h2>
        <ul className={styles.included}>
          {detail.included.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <p className={styles.note}>
          Точну суму називаємо після безкоштовної діагностики, і далі вона не змінюється. Ремонт
          іде за передоплатою за деталь — решту сплачуєте при видачі.
        </p>
      </section>

      {range && <ServicePrices job={slug as (typeof PRICED_JOBS)[number]} />}

      <section className={styles.section} aria-labelledby="inshi">
        <h2 id="inshi" className={styles.h2}>
          Інші роботи
        </h2>
        <div className={styles.others}>
          {others.map((s) => (
            <Link key={s.slug} href={`/poslugy/${s.slug}`} className={styles.other}>
              <span className={styles.otherTitle}>{s.title}</span>
              <span className={styles.otherTime}>{s.time}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
