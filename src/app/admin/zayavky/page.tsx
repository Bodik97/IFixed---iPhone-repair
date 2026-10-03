import type { Metadata } from "next";
import LeadList, { type ListParams } from "../LeadList";

export const metadata: Metadata = {
  title: "Заявки — адміністрування",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<ListParams> }) {
  return <LeadList kind="active" params={await searchParams} />;
}
