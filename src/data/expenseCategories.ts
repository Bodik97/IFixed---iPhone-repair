import type { Expense } from "@/db/schema";

/**
 * Категорії витрат сервісу. Окремо від запитів до бази, бо цей список
 * малює форма в браузері — інакше вона тягнула б за собою драйвер бази.
 */
export const EXPENSE_CATEGORIES: { value: Expense["category"]; label: string }[] = [
  { value: "rent", label: "Оренда" },
  { value: "ads", label: "Реклама" },
  { value: "tools", label: "Інструмент" },
  { value: "parts", label: "Запчастини про запас" },
  { value: "tax", label: "Податки" },
  { value: "other", label: "Інше" },
];

export function categoryLabel(value: Expense["category"]): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? "Інше";
}
