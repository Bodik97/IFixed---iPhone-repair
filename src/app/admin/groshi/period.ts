import { monthStart } from "@/db/adminStats";

export const PERIODS = [
  { value: "month", label: "Цей місяць" },
  { value: "prev", label: "Минулий місяць" },
  { value: "quarter", label: "Останні 3 місяці" },
  { value: "year", label: "Цей рік" },
  { value: "all", label: "За весь час" },
] as const;

export type PeriodValue = (typeof PERIODS)[number]["value"];

export function isPeriod(v: string | undefined): v is PeriodValue {
  return PERIODS.some((p) => p.value === v);
}

/**
 * Проміжок для вибраного періоду. `to` не задаємо там, де період
 * триває досі — інакше сьогоднішні оплати в нього не потраплять.
 */
export function periodRange(period: PeriodValue): { from: Date; to?: Date } {
  switch (period) {
    case "prev":
      return { from: monthStart(1), to: monthStart(0) };
    case "quarter":
      return { from: monthStart(2) };
    case "year": {
      const d = new Date();
      return { from: new Date(d.getFullYear(), 0, 1) };
    }
    case "all":
      return { from: new Date(0) };
    default:
      return { from: monthStart(0) };
  }
}

export function periodLabel(period: PeriodValue): string {
  return PERIODS.find((p) => p.value === period)?.label ?? PERIODS[0].label;
}
