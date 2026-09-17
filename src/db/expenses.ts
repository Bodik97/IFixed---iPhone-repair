import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "./index";
import { expenses, type Expense } from "./schema";
export { EXPENSE_CATEGORIES, categoryLabel } from "@/data/expenseCategories";


function range(from: Date, to?: Date) {
  return to ? and(gte(expenses.spentAt, from), lt(expenses.spentAt, to)) : gte(expenses.spentAt, from);
}

export async function getExpenses(from: Date, to?: Date): Promise<Expense[]> {
  return getDb().select().from(expenses).where(range(from, to)).orderBy(desc(expenses.spentAt));
}

/** Разом за проміжок — щоб не тягнути всі рядки заради однієї суми */
export async function getExpenseTotal(from: Date, to?: Date): Promise<number> {
  const [row] = await getDb()
    .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)::int` })
    .from(expenses)
    .where(range(from, to));

  return row?.total ?? 0;
}

export async function addExpense(input: {
  amount: number;
  category: Expense["category"];
  note: string | null;
  spentAt: Date;
}): Promise<void> {
  await getDb().insert(expenses).values(input);
}

export async function removeExpense(id: string): Promise<void> {
  await getDb().delete(expenses).where(eq(expenses.id, id));
}
