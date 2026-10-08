import Link from "next/link";
import { site } from "@/data/site";
import styles from "./Logo.module.css";

/**
 * Логотип GadgetFix: знак «Power G» і назва вже в одному SVG (шрифт
 * переведений у криві). Кольори логотипа не змінюються ніколи: салатовий
 * знак і «Fix», світлий «Gadget». На світлому тлі салатовий нечитабельний,
 * тож у світлій темі логотип стоїть на графітовій плашці.
 */
export default function Logo({ as = "link" }: { as?: "link" | "text" }) {
  const img = (
    <span className={styles.plate}>
      {/* eslint-disable-next-line @next/next/no-img-element -- векторний SVG, оптимізатор картинок тут нічого не дасть */}
      <img src="/brand/gadgetfix-logo-dark.svg" alt={site.name} className={styles.img} />
    </span>
  );

  if (as === "text") return <span className={styles.logo}>{img}</span>;

  return (
    <Link href="/" className={styles.logo} aria-label={`${site.name} — на головну`}>
      {img}
    </Link>
  );
}
