import type { Metadata } from "next";
import CatalogSection from "@/components/CatalogSection";
import { getSection } from "@/data/catalog";

const section = getSection("iphone");

export const metadata: Metadata = {
  title: "Каталог моделей iPhone",
  description: `${section.models.length} моделей iPhone: перелік робіт, терміни й наявність деталей. Оберіть свою модель — покажемо, що робимо і скільки це триває.`,
  alternates: { canonical: "/modeli" },
};

export default function CatalogPage() {
  return <CatalogSection section={section} />;
}
