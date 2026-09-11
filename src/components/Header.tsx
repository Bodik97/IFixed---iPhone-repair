"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { nav, site } from "@/data/site";
import styles from "./Header.module.css";

export default function Header() {
  const pathname = usePathname();

  // В адмінці навігація сайту тільки заважає
  if (pathname.startsWith("/admin")) {
    return (
      <header className={styles.header}>
        <nav className={`${styles.nav} ${styles.navPlain}`}>
          <Logo />
          <span className={styles.adminMark}>Адміністрування</span>
        </nav>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Logo />

        <div className={styles.links}>
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? `${styles.link} ${styles.active}` : styles.link}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className={styles.actions}>
          {/* На великому екрані — номер текстом, на малому — кнопка-дзвінок */}
          <a href={site.phones[0].href} className={styles.phone}>
            {site.phones[0].label}
          </a>

          <a
            href={site.phones[0].href}
            className={styles.callButton}
            aria-label={`Подзвонити ${site.phones[0].label}`}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
            </svg>
          </a>

          <Link href="/#book" className={`btn btn-accent ${styles.cta}`}>
            Записатись
          </Link>
        </div>
      </nav>
    </header>
  );
}
