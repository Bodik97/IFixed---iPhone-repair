import Link from "next/link";
import ModelGrid from "./ModelGrid";
import Ticker from "./Ticker";
import { sections, type Section } from "@/data/catalog";
import styles from "./CatalogSection.module.css";

const tickerItems = [
  "Екрани в наявності",
  "Акумулятори з ємністю 100%",
  "Гарантія 30 днів",
  "Діагностика безкоштовна",
  "Ремонт при вас за 40 хвилин",
];

export default function CatalogSection({ section }: { section: Section }) {
  const inStock = section.models.filter((m) => m.inStock).length;

  return (
    <>
      <section className={styles.hero}>
        <span aria-hidden="true" className={styles.heroBg}>
          <span className={styles.heroPhoto} />
          <span className={styles.heroVeil} />
          <span className={`${styles.heroGlow} anim-drift`} />
        </span>

        <div className={styles.heroInner}>
          <span className={`${styles.badge} nUp`}>
            <span className="pulse" />
            {section.models.length} моделей · {inStock} з деталями в наявності
          </span>

          <h1 className={`${styles.h1} nUp nUp-1`}>{section.title}</h1>
          <p className={`${styles.heroLead} nUp nUp-2`}>{section.lead}</p>

          {/* Розділи каталогу — щоб перемикатись, не повертаючись у меню */}
          <nav className={`${styles.tabs} nUp nUp-3`} aria-label="Розділи каталогу">
            {sections.map((s) => {
              const active = s.kind === section.kind;
              return (
                <Link
                  key={s.kind}
                  href={s.href}
                  className={active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                  aria-current={active ? "page" : undefined}
                >
                  {s.tab}
                  <span className={styles.tabCount}>{s.models.length}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      <Ticker items={tickerItems} />

      <ModelGrid
        models={section.models}
        withGroups={section.kind === "iphone"}
        searchPlaceholder={
          section.kind === "iphone"
            ? "Пошук: 13 Pro, XR, SE…"
            : section.kind === "ipad"
              ? "Пошук: Air, mini, Pro…"
              : "Пошук: Series 8, SE, Ultra…"
        }
      />

      <section className={`container ${styles.cta}`}>
        <div className={styles.ctaBox}>
          <div>
            <h2 className={styles.ctaTitle}>Не бачите своєї моделі?</h2>
            <p className={styles.ctaLead}>
              Напишіть модель і симптом — відповімо за 15 хвилин, разом із орієнтиром по ціні й
              терміну.
            </p>
          </div>

          <div className={styles.ctaButtons}>
            <Link href="/#book" className="btn btn-accent btn-lg btn-hero">
              Написати нам
            </Link>
            <Link href="/poshtoyu" className="btn btn-ghost btn-lg">
              Надіслати поштою
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
