import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookingForm from "@/components/BookingForm";
import ModelJobs from "@/components/ModelJobs";
import { getModel, models } from "@/data/models";
import { site } from "@/data/site";
import styles from "./page.module.css";

export function generateStaticParams() {
  return models.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = getModel(slug);
  if (!model) return {};

  return {
    title: `Ремонт ${model.name}`,
    description: `Ремонт ${model.name} у Львові та Новому Розділі: ${model.jobs.join(", ").toLowerCase()}. ${model.time}. Безкоштовна діагностика, гарантія 30 днів.`,
    alternates: { canonical: `/modeli/${model.slug}` },
  };
}

const warranty = [
  {
    no: "01",
    title: "Перевірка при вас",
    body: "Показуємо знятий модуль, тестуємо сенсор, True Tone і Face ID перед тим, як зібрати.",
  },
  {
    no: "02",
    title: "Дані на місці",
    body: "Нічого не скидаємо і не переносимо. Пароль потрібен лише для фінальної перевірки — за вашої присутності.",
  },
  {
    no: "03",
    title: "Гарантія 30 днів",
    body: "На роботу й на встановлену деталь. Щось пішло не так — повертайтесь без питань.",
  },
];

export default async function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = getModel(slug);
  if (!model) notFound();

  const idx = models.indexOf(model);
  const related = [models[(idx + 1) % models.length], models[(idx + 2) % models.length]];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Ремонт ${model.name}`,
    serviceType: model.jobs.join(", "),
    provider: {
      "@type": "LocalBusiness",
      name: site.name,
      telephone: site.phones.map((p) => p.href.replace("tel:", "")),
    },
    areaServed: site.cities,
  };

  return (
    <>
      <section className={styles.hero}>
        <span aria-hidden="true" className={styles.heroBg}>
          <span className={styles.heroGlow} />
        </span>

        <div className={styles.heroInner}>
          <nav className={styles.crumbs} aria-label="Хлібні крихти">
            <Link href="/">Головна</Link>
            <span className={styles.sep}>/</span>
            <Link href="/modeli">Моделі</Link>
            <span className={styles.sep}>/</span>
            <span className={styles.current}>{model.name}</span>
          </nav>

          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={`${model.inStock ? styles.badgeIn : styles.badgeOut} nUp`}>
                <span className="pulse" />
                {model.inStock ? "Екран і акумулятор — у наявності" : "Деталі — під замовлення, 1–3 дні"}
              </span>

              <h1 className={`${styles.h1} nUp nUp-1`}>Ремонт {model.name}</h1>

              <p className={`${styles.heroLead} nUp nUp-2`}>
                Найчастіші роботи робимо при вас за 40 хвилин. Ціну називаємо після безкоштовної
                діагностики — і вона вже не змінюється.
              </p>

              <div className={`${styles.heroCta} nUp nUp-3`}>
                <Link href="#book" className="btn btn-accent btn-lg btn-hero">
                  Записатись
                </Link>
                <a href={site.phones[0].href} className="btn btn-ghost btn-lg">
                  Спитати про модель
                </a>
              </div>
            </div>

            <div className={styles.heroShot}>
              <span className={styles.shotPhoto} style={{ backgroundImage: `url("${model.image}")` }} />
              <span className={styles.shotVeil} />
              <span className={styles.shotCaption}>{model.name}</span>
            </div>
          </div>
        </div>
      </section>

      <ModelJobs />

      <section className={styles.warranty}>
        <div className={`container ${styles.warrantyGrid}`}>
          {warranty.map((w) => (
            <div key={w.no}>
              <div className={styles.wNo}>{w.no}</div>
              <span className={styles.wLine} />
              <h3 className={styles.wTitle}>{w.title}</h3>
              <p className={styles.wBody}>{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="book" className={`container ${styles.book}`}>
        <div className={styles.bookGrid}>
          <div>
            <div className="kicker">Запис</div>
            <h2 className={styles.bookTitle}>Записатись на {model.name}</h2>
            <p className={styles.bookLead}>
              Залиште телефон — передзвонимо за 15 хвилин і скажемо орієнтир по вашій ситуації.
            </p>

            <div className={styles.related}>
              {related.map((r) => (
                <Link key={r.slug} href={`/modeli/${r.slug}`} className={styles.relatedLink}>
                  <span>{r.name}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DAFF3D" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M5 12h13" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </Link>
              ))}
              <Link href="/modeli" className={styles.relatedLink}>
                <span>Усі моделі в каталозі</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DAFF3D" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 12h13" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>

          <BookingForm source="model" model={model.name} submitLabel="Записатись" />
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
