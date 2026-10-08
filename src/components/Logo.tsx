import Link from "next/link";
import { site } from "@/data/site";
import styles from "./Logo.module.css";

/**
 * Логотип GadgetFix: знак «Power G» і назва вже в одному SVG (шрифт
 * переведений у криві). Дві версії з брендбука — для темної й світлої теми;
 * яку показати, вирішує CSS за атрибутом теми.
 */
export default function Logo({ as = "link" }: { as?: "link" | "text" }) {
  /* eslint-disable @next/next/no-img-element -- векторні SVG, оптимізатор картинок тут нічого не дасть */
  const img = (
    <>
      <img src="/brand/gadgetfix-logo-dark.svg" alt={site.name} className={`${styles.img} ${styles.onDark}`} />
      <img src="/brand/gadgetfix-logo-light.svg" alt="" aria-hidden="true" className={`${styles.img} ${styles.onLight}`} />
    </>
  );
  /* eslint-enable @next/next/no-img-element */

  if (as === "text") return <span className={styles.logo}>{img}</span>;

  return (
    <Link href="/" className={styles.logo} aria-label={`${site.name} — на головну`}>
      {img}
    </Link>
  );
}
