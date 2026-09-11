"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { nav, site } from "@/data/site";
import styles from "./Header.module.css";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Logo />

        <div className={styles.links}>
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
          <a href={site.phones[0].href} className={styles.phone}>
            {site.phones[0].label}
          </a>
          <Link href="/#book" className="btn btn-accent">
            Записатись
          </Link>
        </div>
      </nav>
    </header>
  );
}
