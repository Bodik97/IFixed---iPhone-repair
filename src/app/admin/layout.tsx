import { getAllReviews } from "@/db/reviews";
import { getCounters } from "@/db/adminStats";
import { isAdmin } from "@/lib/admin";
import AdminShell from "./AdminShell";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Сторінка входу теж лежить під /admin, тож меню показуємо лише тим, хто зайшов
  if (!(await isAdmin())) return <>{children}</>;

  const [counters, reviews] = await Promise.all([getCounters(), getAllReviews()]);
  const pendingReviews = reviews.filter((r) => !r.published).length;

  return (
    <AdminShell
      badges={{ fresh: counters.fresh, toShip: counters.toShip, pendingReviews }}
      actions={
        <form action={signOut}>
          <button type="submit" className="btn btn-ghost">
            Вийти
          </button>
        </form>
      }
    >
      {children}
    </AdminShell>
  );
}
