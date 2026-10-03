import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import NewLeadForm from "./NewLeadForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Нова заявка — адміністрування",
  robots: { index: false, follow: false },
};

export default async function NewLeadPage() {
  if (!(await isAdmin())) redirect("/admin/vhid");

  return (
    <section className={styles.wrap}>
      <h1 className={styles.title}>Нова заявка</h1>
      <p className={styles.lead}>Клієнт подзвонив або прийшов без запису. Заявка буде за вами.</p>
      <NewLeadForm />
    </section>
  );
}
