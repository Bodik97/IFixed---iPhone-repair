import { and, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { getDb } from "./index";
import { leads, type Lead } from "./schema";

/** Стадії, як їх бачить клієнт. Порядок важливий — з нього рахується прогрес. */
export const STAGES = ["Прийнято", "Діагностика", "Ремонт", "Готово"] as const;

export type StatusInfo = {
  /** Як стадія називається для клієнта */
  label: string;
  /** Коротке пояснення — що це означає на практиці */
  hint: string;
  /** Індекс у STAGES; -1 коли шкала не застосовна (відмова) */
  stage: number;
  percent: number;
  /** Ремонт ще триває — заявка вважається активною */
  active: boolean;
  /** Пристрій готовий: телефон полагоджено */
  finished: boolean;
  tone: "progress" | "ready" | "shipped" | "done" | "closed";
};

export function describeStatus(status: Lead["status"]): StatusInfo {
  switch (status) {
    case "new":
      return {
        label: "Прийнято",
        hint: "Заявку отримали, скоро візьмемо в роботу.",
        stage: 0,
        percent: 20,
        active: true,
        finished: false,
        tone: "progress",
      };
    case "in_progress":
      return {
        label: "У роботі",
        hint: "Майстер працює над пристроєм.",
        stage: 2,
        percent: 60,
        active: true,
        finished: false,
        tone: "progress",
      };
    case "ready":
      return {
        label: "Готово",
        hint: "Пристрій полагоджено — можна забирати або надішлемо поштою.",
        stage: 3,
        percent: 100,
        active: true,
        finished: true,
        tone: "ready",
      };
    case "shipped":
      return {
        label: "Відправлено",
        hint: "Посилка вже їде до вас Новою Поштою.",
        stage: 3,
        percent: 100,
        active: true,
        finished: true,
        tone: "shipped",
      };
    case "done":
      return {
        label: "Завершено",
        hint: "Пристрій у вас. Гарантія 30 днів від дати видачі.",
        stage: 3,
        percent: 100,
        active: false,
        finished: true,
        tone: "done",
      };
    case "rejected":
      return {
        label: "Закрито",
        hint: "Заявку закрито. Якщо це помилка — зателефонуйте нам.",
        stage: -1,
        percent: 0,
        active: false,
        finished: false,
        tone: "closed",
      };
  }
}

/** Підписи статусів для випадного списку в адмінці */
export const STATUS_OPTIONS: { value: Lead["status"]; label: string }[] = [
  { value: "new", label: "Нова" },
  { value: "in_progress", label: "У роботі" },
  { value: "ready", label: "Готово" },
  { value: "shipped", label: "Відправлено" },
  { value: "done", label: "Завершено" },
  { value: "rejected", label: "Відмова" },
];

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

/** Що майстер шукає і як звузив список */
export type LeadFilter = {
  /** Ім'я, телефон, пошта, модель, опис поломки або номер замовлення */
  q?: string;
  status?: Lead["status"];
  /** Лише ті, що клієнт просив надіслати, а ТТН ще немає */
  shipping?: boolean;
  page: number;
  perPage: number;
};

/** Умова вибірки — спільна для списку і для підрахунку сторінок */
function leadWhere({ q, status, shipping }: LeadFilter) {
  const parts = [];

  const text = q?.trim();
  if (text) {
    const like = `%${text}%`;
    const fields = [
      ilike(leads.name, like),
      ilike(leads.phone, like),
      ilike(leads.email, like),
      ilike(leads.model, like),
      ilike(leads.problem, like),
    ];

    // Номер замовлення майстер шукає так само, як ім'я — в тому ж полі
    if (/^\d+$/.test(text)) fields.push(eq(leads.orderNo, Number(text)));

    parts.push(or(...fields));
  }

  if (status) parts.push(eq(leads.status, status));
  if (shipping) parts.push(and(eq(leads.deliveryRequested, true), isNull(leads.ttn)));

  return parts.length ? and(...parts) : undefined;
}

/** Сторінка заявок для адмінки разом із кількістю знайдених */
export async function findLeads(filter: LeadFilter): Promise<{ rows: Lead[]; found: number }> {
  const where = leadWhere(filter);

  const [rows, [{ found }]] = await Promise.all([
    getDb()
      .select()
      .from(leads)
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(filter.perPage)
      .offset((filter.page - 1) * filter.perPage),
    getDb().select({ found: count() }).from(leads).where(where),
  ]);

  return { rows, found };
}
