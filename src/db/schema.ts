import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

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

    /**
     * Короткий номер для клієнта: його диктують по телефону, пишуть у квитанції
     * і вводять у перевірку статусу на сайті. UUID для цього не годиться.
     */
    orderNo: integer("order_no").notNull().generatedByDefaultAsIdentity({
      name: "leads_order_no_seq",
      startWith: 1001,
    }),

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

    /**
     * Гроші, у гривнях.
     * price клієнт бачить у кабінеті — це та сама «фіксована ціна», яку ми
     * обіцяємо не змінювати. partsCost і прибуток лишаються тільки в адмінці.
     */
    price: integer("price"),
    partsCost: integer("parts_cost"),
    /** Коли клієнт розрахувався. NULL = ще не оплачено. */
    paidAt: timestamp("paid_at", { withTimezone: true }),

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
    // Перевірка статусу шукає заявку саме за цим номером
    uniqueIndex("leads_order_no_idx").on(t.orderNo),
  ],
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

/** Відгук клієнта про роботу майстерні. Публікується лише після схвалення майстром. */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    /** Автор — лише зареєстрований клієнт, тож акаунт обовʼязковий */
    clerkUserId: text("clerk_user_id").notNull(),
    authorName: text("author_name").notNull(),
    /** Модель пристрою, якщо клієнт вказав — «iPhone 13» під відгуком */
    device: text("device"),

    rating: integer("rating").notNull(),
    text: text("text").notNull(),

    /** Автор увійшов поштою Gmail — показуємо значок «підтверджено Google» */
    viaGoogle: boolean("via_google").notNull().default(false),

    /** Показувати на сайті. Нові відгуки чекають на схвалення. */
    published: boolean("published").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reviews_published_idx").on(t.published),
    index("reviews_created_at_idx").on(t.createdAt),
  ],
);

export type Review = typeof reviews.$inferSelect;

/** Подія в хроніці ремонту — те, що клієнт бачить у кабінеті як стрічку подій */
export const leadEvents = pgTable(
  "lead_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),

    /** Текст для клієнта: «Погодили ціну», «Замінили модуль» */
    text: text("text").notNull(),

    /** Статус, у який перевели заявку разом із цією подією (якщо переводили) */
    status: leadStatus("status"),

    /** Подію створив майстер вручну, чи вона з'явилась автоматично при зміні статусу */
    byMaster: boolean("by_master").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lead_events_lead_idx").on(t.leadId, t.createdAt)],
);

export type LeadEvent = typeof leadEvents.$inferSelect;

/** Хто написав повідомлення в чаті ремонту */
export const messageAuthor = pgEnum("message_author", ["client", "master"]);

/**
 * Листування по конкретному ремонту. Прив'язка до заявки, а не до клієнта:
 * майстер одразу бачить, про який пристрій мова, і не питає зайвого.
 */
export const leadMessages = pgTable(
  "lead_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),

    author: messageAuthor("author").notNull(),
    text: text("text").notNull(),

    /** Коли другий бік прочитав. NULL = ще не бачив — з цього рахуємо лічильник. */
    readAt: timestamp("read_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("lead_messages_lead_idx").on(t.leadId, t.createdAt),
    // Лічильник непрочитаних питає саме за цією парою
    index("lead_messages_unread_idx").on(t.author, t.readAt),
  ],
);

export type LeadMessage = typeof leadMessages.$inferSelect;

/** Пристрій клієнта: зʼявляється, коли ремонт завершено, і несе дату кінця гарантії */
export const devices = pgTable(
  "devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    clerkUserId: text("clerk_user_id").notNull(),
    /** Заявка, після якої пристрій потрапив у список */
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),

    name: text("name").notNull(),
    /** Що саме робили — показуємо поруч із гарантією */
    work: text("work"),

    /** Гарантія 30 днів від дати видачі */
    warrantyUntil: timestamp("warranty_until", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("devices_user_idx").on(t.clerkUserId, t.createdAt)],
);

export type Device = typeof devices.$inferSelect;
