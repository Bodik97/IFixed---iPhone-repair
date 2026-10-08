import Link from "next/link";
import { site } from "@/data/site";
import styles from "./Logo.module.css";

/**
 * Логотип GadgetFix: знак «Power G» і назва вже в одному SVG (шрифт
 * переведений у криві). Версія для темного фону — сайт темний.
 */
export default function Logo({ as = "link" }: { as?: "link" | "text" }) {
  // eslint-disable-next-line @next/next/no-img-element -- векторний SVG, оптимізатор картинок тут нічого не дасть
  const img = <img src="/brand/gadgetfix-logo-dark.svg" alt={site.name} className={styles.img} />;

  if (as === "text") return <span className={styles.logo}>{img}</span>;

  return (
    <Link href="/" className={styles.logo} aria-label={`${site.name} — на головну`}>
      {img}
    </Link>
  );
}
