import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getParts, getStockValue } from "@/db/parts";
import { isAdmin } from "@/lib/admin";
import { deletePart, shiftPart } from "../actions";
import AddPart from "./AddPart";
import shared from "../page.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Склад — адміністрування",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const uah = (n: number) => `${n.toLocaleString("uk-UA")} ₴`;

export default async function StockPage() {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const [rows, total] = await Promise.all([getParts(), getStockValue()]);
  const toOrder = rows.filter((p) => p.qty <= p.minQty);

  return (
    <section className={shared.wrap}>
      <div className={shared.head}>
        <div>
          <div className="kicker">Адміністрування</div>
          <h1 className={shared.title}>Склад</h1>
          <p className={shared.sectionNote}>
            Залишки й ціна закупівлі. Кнопки «−» і «+» міняють кількість на одиницю: поставили
            деталь у телефон — мінус, привезли партію — плюс.
          </p>
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Позицій</span>
          <span className={styles.statValue}>{total.positions}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Деталей усього</span>
          <span className={styles.statValue}>{total.items}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Лежить на полиці</span>
          <span className={styles.statValue}>{uah(total.value)}</span>
        </div>
        <div className={toOrder.length > 0 ? styles.statHot : styles.stat}>
          <span className={styles.statLabel}>Час замовляти</span>
          <span className={styles.statValue}>{toOrder.length}</span>
        </div>
      </div>

      <div className={styles.tools}>
        <AddPart />
      </div>

      {rows.length === 0 ? (
        <div className={shared.empty}>
          Склад порожній. Додайте те, що тримаєте під рукою — акумулятори, дисплеї, шлейфи.
        </div>
      ) : (
        <ul className={styles.list}>
          {rows.map((p) => {
            const low = p.qty <= p.minQty;

            return (
              <li key={p.id} className={low ? styles.rowLow : styles.row}>
                <span className={styles.name}>
                  {p.name}
                  {p.model && <span className={styles.model}>{p.model}</span>}
                  {low && (
                    <span className={styles.lowTag}>{p.qty === 0 ? "закінчилась" : "мало"}</span>
                  )}
                </span>

                <span className={styles.cost}>
                  {p.unitCost ? uah(p.unitCost) : <span className={styles.noCost}>ціни немає</span>}
                </span>

                <span className={styles.qtyBox}>
                  <form action={shiftPart}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="delta" value={-1} />
                    <button type="submit" className={styles.step} aria-label={`Мінус одна: ${p.name}`}>
                      −
                    </button>
                  </form>

                  <span className={styles.qty}>{p.qty}</span>

                  <form action={shiftPart}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="delta" value={1} />
                    <button type="submit" className={styles.step} aria-label={`Плюс одна: ${p.name}`}>
                      +
                    </button>
                  </form>
                </span>

                <form action={deletePart}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className={styles.remove} aria-label={`Прибрати зі складу: ${p.name}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12" />
                      <path d="M18 6L6 18" />
                    </svg>
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
