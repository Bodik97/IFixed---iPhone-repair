/**
 * Строки гарантії за видом роботи.
 *
 * Один строк на все не годиться: оригінальний екран служить довше за аналог,
 * а після ремонту плати чи води ризик повторної поломки найвищий. Список
 * живе окремо від бази — ним користуються і адмінка, і тексти сайту.
 */
export const WARRANTY_TERMS = [
  { days: 180, label: "6 місяців", scope: "екран, оригінал" },
  { days: 90, label: "3 місяці", scope: "екран-аналог, акумулятор, роз'єм, камера, динамік, кнопки" },
  { days: 30, label: "30 днів", scope: "ремонт плати, відновлення після води" },
  { days: 0, label: "без гарантії", scope: "діагностика, чистка без заміни деталей" },
] as const;

/** Для текстів сайту: найдовший строк і діапазон */
export const WARRANTY_MAX = "до 6 місяців";
export const WARRANTY_RANGE = "від 30 днів до 6 місяців";

export const isWarrantyTerm = (days: number) => WARRANTY_TERMS.some((t) => t.days === days);

export const warrantyLabel = (days: number) =>
  WARRANTY_TERMS.find((t) => t.days === days)?.label ?? `${days} днів`;

/**
 * Строк, поки майстер не обрав сам, — за назвою послуги. Екран за
 * замовчуванням вважаємо аналогом: оригінал майстер позначає вручну.
 */
export function guessWarrantyDays(work: string | null | undefined): number {
  const w = (work ?? "").toLowerCase();
  if (/плат|вод[иіуо]|залит|корозі/.test(w)) return 30;
  if (/діагност|чист/.test(w)) return 0;
  return 90;
}

/** До якої дати діє гарантія, якщо рахувати від `from`; null — без гарантії */
export function warrantyEnd(from: Date, days: number): Date | null {
  if (days <= 0) return null;
  const until = new Date(from);
  until.setDate(until.getDate() + days);
  return until;
}

/** Гарантія ще діє? Рахує сервер — у браузері «зараз» інше, і текст розійшовся б */
export const warrantyActive = (until: Date) => until.getTime() > Date.now();
