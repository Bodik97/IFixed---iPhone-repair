import { getAllReviews } from "@/db/reviews";
import { getCounters } from "@/db/adminStats";
import { countUnreadForMaster } from "@/db/messages";
import { isAdmin } from "@/lib/admin";
import LiveRefresh from "@/components/LiveRefresh";
import AdminShell from "./AdminShell";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Сторінка входу теж лежить під /admin, тож меню показуємо лише тим, хто зайшов
  if (!(await isAdmin())) return <>{children}</>;

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
      actions={
        <>
          <LiveRefresh label="Нові заявки — самі" />
          <form action={signOut}>
            <button type="submit" className="btn btn-ghost">
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
