import type { Metadata } from "next";
import Link from "next/link";
import ModelGrid from "@/components/ModelGrid";
import Ticker from "@/components/Ticker";
import { models } from "@/data/models";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Каталог моделей Apple",
  description:
    "42 моделі iPhone, iPad та Apple Watch: перелік робіт, терміни й наявність деталей. Оберіть свою модель — покажемо, що робимо і скільки це триває.",
  alternates: { canonical: "/modeli" },
};

const tickerItems = [
  "Екрани в наявності",
  "Акумулятори з ємністю 100%",
  "Гарантія 30 днів",
  "Діагностика безкоштовна",
  "Ремонт при вас за 40 хвилин",
];

export default function CatalogPage() {
  return (
    <>
      <section className={styles.hero}>
        <span aria-hidden="true" className={styles.heroBg}>
          <span className={styles.heroPhoto} />
          <span className={styles.heroVeil} />
          <span className={styles.heroGlow} />
        </span>

        <div className={styles.heroInner}>
          <span className={`${styles.badge} nUp`}>
            <span className="pulse" />
            {models.length} моделей · склад оновлено сьогодні
          </span>

          <h1 className={`${styles.h1} nUp nUp-1`}>
            Каталог моделей <span className={styles.accent}>Apple</span>
          </h1>

          <p className={`${styles.heroLead} nUp nUp-2`}>
            Натисніть на свою модель — відкриється сторінка з переліком робіт, термінами й наявністю
            деталей.
          </p>
        </div>
      </section>

      <Ticker items={tickerItems} />

      <ModelGrid />

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
