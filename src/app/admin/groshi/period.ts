import { monthStart } from "@/db/adminStats";

export const PERIODS = [
  { value: "month", label: "Цей місяць" },
  { value: "prev", label: "Минулий місяць" },
  { value: "quarter", label: "Останні 3 місяці" },
  { value: "year", label: "Цей рік" },
  { value: "all", label: "За весь час" },
] as const;

export type PeriodValue = (typeof PERIODS)[number]["value"];

/** Проміжок, за який дивимось касу. `to` — уже за межею, не включно. */
export type Range = { from: Date; to?: Date; label: string; fromDay: string; toDay: string };

export function isPeriod(v: string | undefined): v is PeriodValue {
  return PERIODS.some((p) => p.value === v);
}

const isDay = (v: string | undefined): v is string => /^\d{4}-\d{2}-\d{2}$/.test(v ?? "");

/** «2026-09-15» → Date на початок цього дня за місцевим часом */
function dayStart(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dayString(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function preset(period: PeriodValue): { from: Date; to?: Date } {
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
      return { from: new Date(2020, 0, 1) };
    default:
      return { from: monthStart(0) };
  }
}

/**
 * Довільні дати мають перевагу над готовим періодом: щойно майстер обрав
 * день у календарі, кнопки-пресети стають лише швидким способом ці дати
 * заповнити.
 */
export function resolveRange(params: { period?: string; from?: string; to?: string }): Range {
  if (isDay(params.from) || isDay(params.to)) {
    const from = isDay(params.from) ? dayStart(params.from) : new Date(2020, 0, 1);

    // Кінцевий день має входити повністю, тому беремо початок наступного
    const toDay = isDay(params.to) ? dayStart(params.to) : null;
    const to = toDay ? new Date(toDay.getTime() + 24 * 60 * 60 * 1000) : undefined;

    return {
      from,
      to,
      label: "вибрані дати",
      fromDay: dayString(from),
      toDay: toDay ? dayString(toDay) : "",
    };
  }

  const period = isPeriod(params.period) ? params.period : "month";
  const { from, to } = preset(period);

  return {
    from,
    to,
    label: PERIODS.find((p) => p.value === period)!.label,
    fromDay: dayString(from),
    // У відкритого періоду кінця немає, але порожнє поле в календарі читається
    // як незаповнене — показуємо сьогодні, бо саме до сьогодні й рахуємо
    toDay: to ? dayString(new Date(to.getTime() - 24 * 60 * 60 * 1000)) : dayString(new Date()),
  };
}
