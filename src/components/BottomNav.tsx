"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";

/**
 * Нижня навігація для телефона. Угорі шапки лишається лише логотип і дві
 * іконки — решта переїхала сюди, у зону, куди дістає великий палець.
 */
const items = [
  {
    href: "/",
    label: "Головна",
    icon: (
      <>
        <path d="M4 11l8-6.5 8 6.5" />
        <path d="M6.5 9.8V19h11V9.8" />
      </>
    ),
  },
  {
    href: "/poslugy",
    label: "Послуги",
    // Гайковий ключ: пізнаваний силует ремонту, а не абстрактна викрутка
    icon: (
      <path d="M14.6 6.4a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.7-3.7a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z" />
    ),
  },
  {
    href: "/modeli",
    label: "Моделі",
    icon: (
      <>
        <rect x="7" y="2.8" width="10" height="18.4" rx="2.4" />
        <path d="M10.6 5.6h2.8" />
      </>
    ),
  },
  {
    href: "/poshtoyu",
    label: "Поштою",
    icon: (
      <>
        <path d="M3.5 7.5l8.5-4 8.5 4v9l-8.5 4-8.5-4z" />
        <path d="M3.5 7.5l8.5 4 8.5-4" />
        <path d="M12 11.5v9" />
      </>
    ),
  },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  // В адмінці своя навігація — ця тільки заважала б
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className={styles.bar} aria-label="Основна навігація">
      <ul className={styles.list}>
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={active ? styles.itemActive : styles.item}
                aria-current={active ? "page" : undefined}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {item.icon}
                </svg>
                <span className={styles.label}>{item.label}</span>
              </Link>
            </li>
          );
        })}

        {/* Головна дія завжди під рукою — за нею сюди й приходять */}
        <li className={styles.ctaCell}>
          <Link href="/#book" className={styles.cta}>
            Записатись
          </Link>
        </li>
      </ul>
    </nav>
  );
}
