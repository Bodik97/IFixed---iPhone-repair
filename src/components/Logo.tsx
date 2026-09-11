import Link from "next/link";
import styles from "./Logo.module.css";

export default function Logo({ as = "link" }: { as?: "link" | "text" }) {
  const inner = (
    <>
      <span className={styles.mark}>iF</span>
      iFix
    </>
  );

  if (as === "text") return <span className={styles.logo}>{inner}</span>;

  return (
    <Link href="/" className={styles.logo}>
      {inner}
    </Link>
  );
}
