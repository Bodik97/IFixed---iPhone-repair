import type { Metadata } from "next";
import CatalogSection from "@/components/CatalogSection";
import { getSection } from "@/data/catalog";

const section = getSection("watch");

export const metadata: Metadata = {
  title: "Ремонт Apple Watch у Львові",
  description: `${section.models.length} моделей Apple Watch: заміна скла й акумулятора, відновлення герметизації. Гарантія 30 днів на роботу й деталь.`,
  alternates: { canonical: "/godynnyky" },
};

export default function WatchesPage() {
  return <CatalogSection section={section} />;
}
