import { getAllReviews } from "@/db/reviews";
import { getCounters } from "@/db/adminStats";
import { countUnreadForMaster } from "@/db/messages";
import { currentAdmin } from "@/lib/admin";
import LiveRefresh from "@/components/LiveRefresh";
import AdminShell from "./AdminShell";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Сторінка входу теж лежить під /admin, тож меню показуємо лише тим, хто зайшов
  const master = await currentAdmin();
  if (!master) return <>{children}</>;

  const [counters, reviews, unreadChats] = await Promise.all([
    getCounters(),
    getAllReviews(),
    countUnreadForMaster(),
  ]);
  const pendingReviews = reviews.filter((r) => !r.published).length;

  return (
    <AdminShell
      badges={{
        fresh: counters.fresh + unreadChats,
        toShip: counters.toShip,
        pendingReviews,
      }}
      master={master.name}
      actions={
        <>
          <LiveRefresh silent />
          <form action={signOut}>
            <button type="submit" className="btn btn-ghost">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 17l5-5-5-5" />
                <path d="M20 12H9" />
                <path d="M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" />
              </svg>
              Вийти
            </button>
          </form>
        </>
      }
    >
      {children}
    </AdminShell>
  );
}
