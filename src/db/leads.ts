import { desc, eq, or } from "drizzle-orm";
import { getDb } from "./index";
import { leads, type Lead } from "./schema";

/** Стадії, як їх бачить клієнт. Порядок важливий — з нього рахується прогрес. */
export const STAGES = ["Прийнято", "Діагностика", "Ремонт", "Готово"] as const;

type Progress = {
  label: string;
  /** Індекс поточної стадії у STAGES; -1 для відмови */
  stage: number;
  percent: number;
  active: boolean;
};

export function describeStatus(status: Lead["status"]): Progress {
  switch (status) {
    case "new":
      return { label: "Прийнято", stage: 0, percent: 25, active: true };
    case "in_progress":
      return { label: "У роботі", stage: 2, percent: 65, active: true };
    case "done":
      return { label: "Готово", stage: 3, percent: 100, active: false };
    case "rejected":
      return { label: "Закрито", stage: -1, percent: 0, active: false };
  }
}

/**
 * Заявки клієнта. Шукаємо і за акаунтом, і за поштою — щоб людина побачила
 * те, що лишала до реєстрації з тією самою адресою.
 */
export async function getClientLeads(clerkUserId: string, email?: string | null): Promise<Lead[]> {
  const match = email
    ? or(eq(leads.clerkUserId, clerkUserId), eq(leads.email, email))
    : eq(leads.clerkUserId, clerkUserId);

  return getDb().select().from(leads).where(match).orderBy(desc(leads.createdAt));
}
