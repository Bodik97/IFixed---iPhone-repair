import { boolean, index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Звідки прийшла заявка — відповідає полю `source` у формах */
export const leadSource = pgEnum("lead_source", ["landing", "model", "services", "mail-in"]);

/**
 * Стадії обробки заявки майстром.
 * Порядок = шлях ремонту: прийняли → робимо → готово → (за потреби) відправили → закрили.
 */
export const leadStatus = pgEnum("lead_status", [
  "new",
  "in_progress",
  "ready",
  "shipped",
  "done",
  "rejected",
]);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Контакти клієнта
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),

    // Що саме треба
    model: text("model"),
    service: text("service"),
    problem: text("problem"),

    // Ремонт поштою
    city: text("city"),
    branch: text("branch"),

    /** ID клієнта в Clerk, якщо заявку лишив залогінений. NULL = анонімна заявка. */
    clerkUserId: text("clerk_user_id"),

    /** Клієнт попросив надіслати готовий пристрій Новою Поштою */
    deliveryRequested: boolean("delivery_requested").notNull().default(false),
    /** Куди слати — місто й відділення, які вказав клієнт */
    deliveryAddress: text("delivery_address"),
    /** Накладна Нової Пошти, коли майстер відправив */
    ttn: text("ttn"),

    source: leadSource("source").notNull(),
    status: leadStatus("status").notNull().default("new"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Адмінка сортує за датою й фільтрує за статусом
    index("leads_created_at_idx").on(t.createdAt),
    index("leads_status_idx").on(t.status),
    // Кабінет вибирає заявки свого клієнта
    index("leads_clerk_user_idx").on(t.clerkUserId),
    index("leads_email_idx").on(t.email),
  ],
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
