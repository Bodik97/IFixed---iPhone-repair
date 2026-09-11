import type { Metadata } from "next";
import CatalogSection from "@/components/CatalogSection";
import { getSection } from "@/data/catalog";

const section = getSection("ipad");

export const metadata: Metadata = {
  title: "Ремонт iPad у Львові",
  description: `${section.models.length} моделей iPad: заміна скла, акумулятора та роз'єму заряджання. Безкоштовна діагностика, фіксована ціна, гарантія 30 днів.`,
  alternates: { canonical: "/planshety" },
};

export default function TabletsPage() {
  return <CatalogSection section={section} />;
}
