import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSiteStats } from "@/db/siteStats";
import { isAdmin } from "@/lib/admin";
import PeriodFilter from "../groshi/PeriodFilter";
import { resolveRange } from "../groshi/period";
import shared from "../page.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Статистика — адміністрування",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Назви кнопок із data-track — людською мовою */
const CLICK_LABELS: Record<string, string> = {
  "hero-book": "Головна: «Безкоштовна діагностика»",
  "hero-call": "Головна: «Подзвонити»",
  "header-book": "Шапка: «Записатись»",
  "header-call": "Шапка: телефон",
  "nav-book": "Нижнє меню: «Записатись»",
  "book-link": "«Записатись» біля послуги чи моделі",
  login: "Шапка: «Вхід»",
  "chat-open": "«Консультація» (бот)",
  "footer-call": "Підвал: телефон",
  "footer-viber": "Підвал: Viber",
};

const DEVICE_LABELS: Record<string, string> = { mobile: "Телефон", desktop: "Комп'ютер" };

const num = (n: number) => n.toLocaleString("uk-UA");

/** Частка від попереднього кроку воронки; без бази — прочерк */
const share = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—");

export default async function SiteStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const range = resolveRange(await searchParams);
  const stats = await getSiteStats(range.from, range.to);
  const { funnel } = stats;

  const steps = [
    { label: "Зайшли на сайт", value: funnel.visitors, of: null as number | null },
    { label: "Натиснули «Записатись»", value: funnel.intent, of: funnel.visitors },
    { label: "Надіслали заявку", value: funnel.leads, of: funnel.visitors },
    { label: "Заявка стала ремонтом", value: funnel.repairs, of: funnel.leads },
  ];

  return (
    <section className={shared.wrap}>
      <div className={shared.head}>
        <div>
          <div className="kicker">Адміністрування</div>
          <h1 className={shared.title}>Статистика сайту</h1>
          <p className={shared.sectionNote}>
            Анонімно, без cookie. Відвідувачі рахуються за днями: хто зайшов у два різні дні —
            це два відвідувачі. Ваші власні заходи з адмінки не враховано.
          </p>
        </div>
      </div>

      <PeriodFilter range={range} base="/admin/statystyka" />

      {stats.views === 0 ? (
        <div className={shared.empty}>За цей період відвідувань ще не записано.</div>
      ) : (
        <div className={styles.grid}>
          <div className={styles.totals}>
            <div className={styles.total}>
              <span className={styles.totalValue}>{num(stats.visitors)}</span>
              <span className={styles.totalLabel}>відвідувачів</span>
            </div>
            <div className={styles.total}>
              <span className={styles.totalValue}>{num(stats.views)}</span>
              <span className={styles.totalLabel}>переглядів сторінок</span>
            </div>
            <div className={styles.total}>
              <span className={styles.totalValue}>{num(funnel.leads)}</span>
              <span className={styles.totalLabel}>заявок із сайту</span>
            </div>
            <div className={styles.total}>
              <span className={styles.totalValue}>{share(funnel.leads, funnel.visitors)}</span>
              <span className={styles.totalLabel}>відвідувачів лишили заявку</span>
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.h2}>Воронка заявок</h2>
            <table className={styles.table}>
              <tbody>
                {steps.map((s) => (
                  <tr key={s.label}>
                    <th scope="row">{s.label}</th>
                    <td>{num(s.value)}</td>
                    <td className={styles.muted}>{s.of === null ? "" : share(s.value, s.of)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={styles.note}>
              Відсоток «стала ремонтом» — від заявок, решта — від відвідувачів. Дзвінки напряму
              сюди не потрапляють: видно лише натискання на номер.
            </p>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.h2}>Кліки на кнопки</h2>
            {stats.clicks.length === 0 ? (
              <p className={styles.note}>Натискань за цей період немає.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Кнопка</th>
                    <th scope="col">Кліків</th>
                    <th scope="col">Людей</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.clicks.map((c) => (
                    <tr key={c.name}>
                      <th scope="row">{CLICK_LABELS[c.name] ?? c.name}</th>
                      <td>{num(c.clicks)}</td>
                      <td className={styles.muted}>{num(c.visitors)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className={styles.panel}>
            <h2 className={styles.h2}>Сторінки</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Адреса</th>
                  <th scope="col">Переглядів</th>
                  <th scope="col">Людей</th>
                </tr>
              </thead>
              <tbody>
                {stats.pages.map((p) => (
                  <tr key={p.path}>
                    <th scope="row">{p.path}</th>
                    <td>{num(p.views)}</td>
                    <td className={styles.muted}>{num(p.visitors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.h2}>Звідки приходять</h2>
            <table className={styles.table}>
              <tbody>
                {stats.sources.map((s) => (
                  <tr key={s.source}>
                    <th scope="row">{s.source || "Прямий захід або перехід усередині сайту"}</th>
                    <td>{num(s.visitors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 className={`${styles.h2} ${styles.h2Next}`}>Пристрої</h2>
            <table className={styles.table}>
              <tbody>
                {stats.devices.map((d) => (
                  <tr key={d.device}>
                    <th scope="row">{DEVICE_LABELS[d.device] ?? d.device}</th>
                    <td>{num(d.visitors)}</td>
                    <td className={styles.muted}>{share(d.visitors, stats.visitors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
