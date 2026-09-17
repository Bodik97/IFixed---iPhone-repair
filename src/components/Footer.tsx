import Link from "next/link";
import Logo from "./Logo";
import { site } from "@/data/site";
import styles from "./Footer.module.css";

const serviceLinks = [
  { href: "/poslugy", label: "Послуги" },
  { href: "/modeli", label: "iPhone" },
  { href: "/planshety", label: "iPad" },
  { href: "/godynnyky", label: "Apple Watch" },
  { href: "/poshtoyu", label: "Ремонт поштою" },
  { href: "/#book", label: "Запис" },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div>
          <Logo as="text" />
          <p className={styles.tagline}>{site.tagline}</p>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Контакти</div>
          {site.phones.map((p) => (
            <a key={p.href} href={p.href} className={styles.link}>
              {p.label}
            </a>
          ))}
          <span className={styles.muted}>{site.hours}</span>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Написати</div>
          {site.messengers.map((m) => (
            <a
              key={m.label}
              href={m.href}
              className={styles.link}
              {...(m.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
            >
              {m.label}
            </a>
          ))}
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Сервіс</div>
          {serviceLinks.map((l) => (
            <Link key={l.href} href={l.href} className={styles.link}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <span>
            © {new Date().getFullYear()} {site.name} · {site.cities.join(", ")}
          </span>
          <span className={styles.bottomLinks}>
            <Link href="/personalni-dani">Персональні дані</Link>
            <span aria-hidden="true">·</span>
            Гарантія {site.warrantyDays} днів на роботу
          </span>
        </div>
      </div>
    </footer>
  );
}
