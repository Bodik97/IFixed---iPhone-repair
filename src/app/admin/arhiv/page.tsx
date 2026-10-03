import type { Metadata } from "next";
import LeadList, { type ListParams } from "../LeadList";

export const metadata: Metadata = {
  title: "Архів — адміністрування",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Завершені й відхилені заявки — щоб не заважали в робочому списку, але й не губились */
export default async function ArchivePage({ searchParams }: { searchParams: Promise<ListParams> }) {
  return <LeadList kind="archive" params={await searchParams} />;
}
