import { beforeEach, describe, expect, it, vi } from "vitest";
import { fake } from "./helpers/fakeDb";
import { devices, leadMessages, leads } from "@/db/schema";

/**
 * Дії адмінки — ними змінюються заявки, гроші, відгуки й склад. Server action
 * — це публічна POST-точка, викликати її може будь-хто, хто знає її id. Тож
 * кожна має сама перевіряти, що перед нею майстер, і не пускати сміття в базу.
 */

const m = vi.hoisted(() => ({
  admin: true,
  limits: {} as Record<string, { ok: true } | { ok: false; retryAfter: number }>,
  released: [] as string[],
  credentials: null as number | null | "throw",
  sessions: [] as number[],
  uploaded: [] as string[],
  deleted: [] as string[],
  delFails: false,
}));

vi.mock("@/db", async () => {
  const { fake } = await import("./helpers/fakeDb");
  return { getDb: () => fake.db };
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

vi.mock("@vercel/blob", () => ({
  put: async (path: string) => {
    m.uploaded.push(path);
    return { pathname: path };
  },
  del: async (path: string) => {
    if (m.delFails) throw new Error("blob down");
    m.deleted.push(path);
  },
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: async (subject: string) => m.limits[subject] ?? { ok: true },
  release: async (subject: string) => {
    m.released.push(subject);
  },
}));

vi.mock("@/lib/admin", () => ({
  isAdmin: async () => m.admin,
  currentAdmin: async () => (m.admin ? { name: "Богдан", email: "b@gadgetfix.ua" } : null),
  checkCredentials: () => {
    if (m.credentials === "throw") throw new Error("no env");
    return m.credentials;
  },
  createSession: async (i: number) => {
    m.sessions.push(i);
  },
  destroySession: async () => {},
}));

import * as actions from "@/app/admin/actions";

const form = (fields: Record<string, string | File> = {}) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
};

const LEAD = {
  id: "11111111-1111-1111-1111-111111111111",
  orderNo: 1001,
  name: "Олег",
  phone: "0733150238",
  model: "iPhone 13",
  clerkUserId: "user_1",
  deliveryRequested: false,
  source: "landing",
  status: "ready",
  price: null,
  prepayment: null,
  prepaidAt: null,
  paidAt: null,
  createdAt: new Date("2026-05-01T10:00:00Z"),
  updatedAt: new Date("2026-05-01T10:00:00Z"),
};

/** Текст запиту з параметрами — щоб перевіряти, що саме пішло в базу */
const writesText = () => fake.writes().map((q) => `${q.sql} ${JSON.stringify(q.params)}`);

beforeEach(() => {
  fake.reset();
  m.admin = true;
  m.limits = {};
  m.released = [];
  m.credentials = null;
  m.sessions = [];
  m.uploaded = [];
  m.deleted = [];
  m.delFails = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("без входу майстра жодна дія не змінює базу", () => {
  const guarded = Object.entries(actions).filter(([name]) => !["signIn", "signOut"].includes(name));

  it("перевірені всі дії адмінки", () => {
    // Нова дія без перевірки має потрапити сюди, а не прослизнути повз
    expect(guarded.map(([n]) => n).sort()).toEqual(
      [
        "addNote", "addReview", "createExpense", "createLead", "createPart", "deleteExpense", "deleteLead",
        "deletePart", "deleteReview", "removePushSubscription", "savePushSubscription", "sendTestPush",
        "setAssignee", "setMoney", "setReviewPublished", "setStatus", "setTtn", "setWarranty",
        "shiftPart",
      ].sort(),
    );
  });

  for (const [name, action] of guarded) {
    it(name, async () => {
      m.admin = false;
      const f = form({
        id: LEAD.id, status: "done", text: "Довгий текст відгуку", ttn: "204500", publish: "1",
        price: "100", authorName: "Олег", amount: "100", name: "Екран", delta: "1",
      });
      await expect((action as (f: FormData) => Promise<unknown>)(f)).rejects.toThrow("REDIRECT:/admin/vhid");
      expect(fake.queries).toEqual([]);
    });
  }
});

describe("signIn", () => {
  const signIn = (email: string, password: string) =>
    actions.signIn(null, form({ email, password }));

  it("ліміт на пошту перевіряється до пароля", async () => {
    m.limits["login:email:a@b.cc"] = { ok: false, retryAfter: 600 };
    m.credentials = 0;
    expect(await signIn(" A@B.cc ", "x")).toBe("Забагато спроб входу. Спробуйте за 10 хв.");
    expect(m.sessions).toEqual([]);
  });

  it("ліміт рахується за першою адресою з x-forwarded-for", async () => {
    m.limits["login:ip:9.9.9.9"] = { ok: false, retryAfter: 30 };
    expect(await signIn("a@b.cc", "x")).toBe("Забагато спроб входу. Спробуйте за хвилину.");
  });

  it("неправильний пароль — повідомлення, без сесії й без зняття лічильника", async () => {
    vi.useFakeTimers();
    const pending = signIn("a@b.cc", "bad");
    await vi.advanceTimersByTimeAsync(700);
    expect(await pending).toBe("Пошта або пароль не підходять.");
    vi.useRealTimers();
    expect(m.sessions).toEqual([]);
    expect(m.released).toEqual([]);
  });

  it("правильний — сесія саме цього майстра, лічильник знято, переходимо в адмінку", async () => {
    m.credentials = 1;
    await expect(signIn("a@b.cc", "ok")).rejects.toThrow("REDIRECT:/admin");
    expect(m.sessions).toEqual([1]);
    expect(m.released).toEqual(["login:email:a@b.cc"]);
  });

  it("адмінка не налаштована — зрозуміле повідомлення, а не падіння", async () => {
    m.credentials = "throw";
    expect(await signIn("a@b.cc", "x")).toMatch(/Адмінка не налаштована/);
  });
});

describe("setStatus", () => {
  it("невідомий статус — нічого не пишемо", async () => {
    await actions.setStatus(form({ id: LEAD.id, status: "hacked" }));
    expect(fake.writes()).toEqual([]);
  });

  it("новий статус — оновлення заявки й подія в хроніці", async () => {
    await actions.setStatus(form({ id: LEAD.id, status: "in_progress" }));
    const w = writesText();
    expect(w[0]).toMatch(/^update "leads" set "status" = \$1/);
    expect(w[0]).toContain('"in_progress"');
    expect(w[1]).toMatch(/^insert into "lead_events"/);
    expect(w).toHaveLength(2);
  });

  it("«Відправлено» без ТТН не ставиться — статус дає лише збереження накладної", async () => {
    fake.onSelect(leads, () => [LEAD]);
    await actions.setStatus(form({ id: LEAD.id, status: "shipped" }));
    expect(fake.writes()).toEqual([]);
  });

  it("«Відправлено» з уже вписаною ТТН ставиться", async () => {
    fake.onSelect(leads, () => [{ ...LEAD, ttn: "20450000000000" }]);
    await actions.setStatus(form({ id: LEAD.id, status: "shipped" }));
    expect(writesText()[0]).toContain('"shipped"');
  });

  it("«Завершено» — пристрій клієнта потрапляє в гарантійний список", async () => {
    fake.onSelect(leads, () => [LEAD]);
    fake.onSelect(devices, () => []);
    await actions.setStatus(form({ id: LEAD.id, status: "done" }));
    const device = fake.writes().find((q) => q.sql.startsWith('insert into "devices"'));
    expect(device?.params).toEqual(expect.arrayContaining(["user_1", LEAD.id, "iPhone 13"]));
  });

  it("«Завершено» вдруге — пристрій не дублюється", async () => {
    fake.onSelect(leads, () => [LEAD]);
    fake.onSelect(devices, () => [{ id: "d1", clerkUserId: "user_1", leadId: LEAD.id, name: "x", warrantyUntil: new Date(), createdAt: new Date() }]);
    await actions.setStatus(form({ id: LEAD.id, status: "done" }));
    expect(fake.writes().some((q) => q.sql.startsWith('insert into "devices"'))).toBe(false);
  });
});

describe("гарантія", () => {
  const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000);
  const untilIn = (sqlStart: string) => {
    const q = fake.writes().find((w) => w.sql.startsWith(sqlStart) && w.sql.includes('"warranty_until"'))!;
    return new Date(q.params.find((p) => typeof p === "string" && /^\d{4}-\d\d-\d\dT/.test(p)) as string);
  };

  it("видача запускає гарантію на строк, який обрав майстер", async () => {
    fake.onSelect(leads, () => [{ ...LEAD, warrantyDays: 180 }]);
    fake.onSelect(devices, () => []);
    await actions.setStatus(form({ id: LEAD.id, status: "done" }));
    expect(daysBetween(new Date(), untilIn('update "leads"'))).toBe(180);
  });

  it("майстер не обирав — строк за видом роботи: після води 30 днів", async () => {
    fake.onSelect(leads, () => [{ ...LEAD, service: "Відновлення після води" }]);
    fake.onSelect(devices, () => []);
    await actions.setStatus(form({ id: LEAD.id, status: "done" }));
    expect(daysBetween(new Date(), untilIn('update "leads"'))).toBe(30);
  });

  it("діагностика — без гарантії: дати немає, пристрій у гарантійний список не потрапляє", async () => {
    fake.onSelect(leads, () => [{ ...LEAD, service: "Діагностика" }]);
    await actions.setStatus(form({ id: LEAD.id, status: "done" }));
    expect(fake.writes().some((q) => q.sql.startsWith('insert into "devices"'))).toBe(false);
  });

  it("повторне «Видано» не зсуває дату гарантії", async () => {
    const until = new Date("2026-12-01T10:00:00Z");
    fake.onSelect(leads, () => [{ ...LEAD, status: "done", warrantyUntil: until }]);
    fake.onSelect(devices, () => [{ id: "d1" }]);
    await actions.setStatus(form({ id: LEAD.id, status: "done" }));
    expect(untilIn('update "leads"').toISOString()).toBe(until.toISOString());
  });

  it("строк, змінений після видачі, рахується від того самого дня видачі", async () => {
    const handedOver = new Date("2026-10-01T10:00:00Z");
    const until = new Date(handedOver);
    until.setDate(until.getDate() + 90);
    fake.onSelect(leads, () => [{ ...LEAD, status: "done", warrantyDays: 90, warrantyUntil: until }]);

    await actions.setWarranty(form({ id: LEAD.id, days: "180" }));
    expect(daysBetween(handedOver, untilIn('update "leads"'))).toBe(180);
  });

  it("строк не зі списку не зберігається", async () => {
    fake.onSelect(leads, () => [LEAD]);
    await actions.setWarranty(form({ id: LEAD.id, days: "999" }));
    expect(fake.writes()).toEqual([]);
  });
});

describe("createLead — заявка, яку заводить майстер", () => {
  const create = (fields: Record<string, string>) => actions.createLead(null, form(fields));

  it("без імені чи телефону — підказка, без запису", async () => {
    expect(await create({ name: "О", phone: "0733150238" })).toMatch(/імʼя клієнта/);
    expect(await create({ name: "Олег2", phone: "0733150238" })).toMatch(/лише літери/);
    expect(await create({ name: "Олег", phone: "123" })).toMatch(/телефон/);
    expect(fake.writes()).toEqual([]);
  });

  it("джерело «вручну», заявка за тим, хто створив, далі — відкрити її розгорнутою", async () => {
    fake.onInsert(leads, () => [{ id: "new-id", orderNo: 1077 }]);
    await expect(create({ name: " Олег ", phone: "073 315 02 38", model: "iPhone 13" })).rejects.toThrow(
      "REDIRECT:/admin/zayavky?q=1077&open=new-id",
    );
    const [q] = fake.writes();
    expect(q.sql).toMatch(/^insert into "leads"/);
    expect(q.params).toEqual(expect.arrayContaining(["Олег", "+380733150238", "iPhone 13", "b@gadgetfix.ua", "manual", "new"]));
  });

  it("пристрій уже в сервісі — одразу «У роботі»", async () => {
    fake.onInsert(leads, () => [{ id: "new-id", orderNo: 1078 }]);
    await expect(create({ name: "Олег", phone: "0733150238", handedOver: "on" })).rejects.toThrow(/REDIRECT/);
    expect(fake.writes()[0].params).toContain("in_progress");
  });
});

describe("savePushSubscription", () => {
  const KEYS = { endpoint: "https://push.example/abc", keys: { p256dh: "p", auth: "a" } };

  it("підписка — за майстром, який увімкнув; повторне ввімкнення оновлює, а не дублює", async () => {
    await actions.savePushSubscription(KEYS, "iPhone");
    const [q] = fake.writes();
    expect(q.sql).toMatch(/^insert into "push_subscriptions"/);
    expect(q.sql).toMatch(/on conflict \("endpoint"\) do update/);
    expect(q.params).toEqual(expect.arrayContaining(["b@gadgetfix.ua", "https://push.example/abc", "p", "a", "iPhone"]));
  });

  it("не https-адреса чи без ключів — нічого не пишемо", async () => {
    await actions.savePushSubscription({ endpoint: "javascript:alert(1)", keys: { p256dh: "p", auth: "a" } }, "x");
    await actions.savePushSubscription({ endpoint: "https://push.example/abc", keys: { p256dh: "", auth: "a" } }, "x");
    expect(fake.writes()).toEqual([]);
  });
});

describe("setAssignee", () => {
  it("«Взяти собі» — заявка на пошту того, хто зайшов, без події в хроніці", async () => {
    await actions.setAssignee(form({ id: LEAD.id, take: "1" }));
    const w = fake.writes();
    expect(w).toHaveLength(1);
    expect(w[0].sql).toMatch(/^update "leads" set "assignee" = \$1/);
    expect(w[0].params[0]).toBe("b@gadgetfix.ua");
  });

  it("«Відпустити» — поле очищається", async () => {
    await actions.setAssignee(form({ id: LEAD.id, take: "0" }));
    expect(fake.writes()[0].params[0]).toBeNull();
  });

  it("без id — нічого не пишемо", async () => {
    await actions.setAssignee(form({ take: "1" }));
    expect(fake.writes()).toEqual([]);
  });
});

describe("addNote і setTtn", () => {
  it("закоротка нотатка не пишеться", async () => {
    await actions.addNote(form({ id: LEAD.id, text: " ok " }));
    expect(fake.writes()).toEqual([]);
  });

  it("накладна — статус «Відправлено» і подія з номером", async () => {
    await actions.setTtn(form({ id: LEAD.id, ttn: " 20450012345678 " }));
    const w = writesText();
    expect(w[0]).toMatch(/update "leads" set "ttn" = \$1, "status" = \$2/);
    expect(w[0]).toContain('"shipped"');
    expect(w[1]).toContain("накладна 20450012345678");
  });

  it("порожня накладна — очищає поле, статус не чіпає, події немає", async () => {
    await actions.setTtn(form({ id: LEAD.id, ttn: "" }));
    const w = writesText();
    expect(w).toHaveLength(1);
    expect(w[0]).not.toContain('"status"');
  });
});

describe("setMoney", () => {
  it("ціна з пробілами й комою, подія про погоджену ціну", async () => {
    fake.onSelect(leads, () => [LEAD]);
    await actions.setMoney(form({ id: LEAD.id, price: "3 499,6" }));
    const w = writesText();
    expect(w[0]).toMatch(/"price" = \$1/);
    expect(fake.writes()[0].params[0]).toBe(3500);
    expect(w[1]).toContain("Погодили ціну ремонту: 3500 ₴");
  });

  it("від'ємна чи нечислова сума поле не чіпає", async () => {
    fake.onSelect(leads, () => [LEAD]);
    await actions.setMoney(form({ id: LEAD.id, price: "-5", partsCost: "abc" }));
    const [update] = fake.writes();
    expect(update.sql).not.toMatch(/"price"|"parts_cost"/);
    expect(fake.writes()).toHaveLength(1); // без події про ціну
  });

  it("повторне збереження не зсуває дату оплати", async () => {
    const paidAt = new Date("2026-04-01T09:00:00.000Z");
    fake.onSelect(leads, () => [{ ...LEAD, paidAt }]);
    await actions.setMoney(form({ id: LEAD.id, paid: "on" }));
    expect(fake.writes()[0].params).toContain(paidAt.toISOString());
  });

  it("зняли відмітку «оплачено» — дата оплати стирається", async () => {
    fake.onSelect(leads, () => [{ ...LEAD, paidAt: new Date() }]);
    await actions.setMoney(form({ id: LEAD.id }));
    expect(fake.writes()[0].sql).toMatch(/"paid_at" = \$\d+/);
    expect(fake.writes()[0].params).toContain(null);
  });

  it("передоплата вперше — подія з сумою; повторно — без події", async () => {
    fake.onSelect(leads, () => [LEAD]);
    await actions.setMoney(form({ id: LEAD.id, prepaid: "on", prepayment: "800" }));
    expect(writesText()[1]).toContain("Отримали передоплату: 800 ₴");

    fake.reset();
    fake.onSelect(leads, () => [{ ...LEAD, prepaidAt: new Date(), prepayment: 800 }]);
    await actions.setMoney(form({ id: LEAD.id, prepaid: "on", prepayment: "800" }));
    expect(fake.writes()).toHaveLength(1);
  });

  it("неіснуюча заявка — нічого не пишемо", async () => {
    await actions.setMoney(form({ id: LEAD.id, price: "100" }));
    expect(fake.writes()).toEqual([]);
  });
});

describe("addReview", () => {
  it("закороткий текст чи без імені — помилка, без запису", async () => {
    expect(await actions.addReview(form({ authorName: "О", text: "Дуже добре все" }))).toBe("Впишіть імʼя автора.");
    expect(await actions.addReview(form({ authorName: "Олег", text: "ок" }))).toMatch(/закороткий/);
    expect(fake.writes()).toEqual([]);
  });

  it("оцінка поза 1–5 стає 5, відгук майстра публікується одразу", async () => {
    expect(await actions.addReview(form({ authorName: "Олег", text: "Швидко й чесно, раджу", rating: "9" }))).toBeNull();
    const [insert] = fake.writes();
    expect(insert.sql).toMatch(/^insert into "reviews"/);
    expect(insert.params).toEqual(expect.arrayContaining([5, true]));
  });

  it("не фото — помилка, у сховище нічого не йде", async () => {
    const file = new File(["<svg/>"], "x.svg", { type: "text/html" });
    expect(await actions.addReview(form({ authorName: "Олег", text: "Швидко й чесно, раджу", image: file }))).toBe("Можна додавати лише фото.");
    expect(m.uploaded).toEqual([]);
  });
});

describe("витрати й склад", () => {
  it("витрата без суми — помилка", async () => {
    expect(await actions.createExpense(form({ amount: "0" }))).toMatch(/більшу за нуль/);
    expect(await actions.createExpense(form({ amount: "abc" }))).toMatch(/більшу за нуль/);
    expect(fake.writes()).toEqual([]);
  });

  it("невідома категорія стає «other»", async () => {
    expect(await actions.createExpense(form({ amount: "1 200", category: "hack" }))).toBeNull();
    const [insert] = fake.writes();
    expect(insert.sql).toMatch(/^insert into "expenses"/);
    expect(insert.params).toEqual(expect.arrayContaining([1200, "other"]));
  });

  it("деталь без назви — помилка", async () => {
    expect(await actions.createPart(form({ name: "  " }))).toMatch(/що це за деталь/);
  });

  it("зсув залишку: дробне обрізається, нуль ігнорується", async () => {
    await actions.shiftPart(form({ id: "p1", delta: "0" }));
    expect(fake.writes()).toEqual([]);
    await actions.shiftPart(form({ id: "p1", delta: "-1.7" }));
    expect(fake.writes()[0].sql).toMatch(/greatest\(0, "parts"\."qty" \+ \$1\)/);
    expect(fake.writes()[0].params[0]).toBe(-1);
  });
});

describe("deleteLead", () => {
  it("прибирає фото зі сховища, потім заявку", async () => {
    fake.onSelect(leadMessages, () => [{ imagePath: "chat/l1/a" }, { imagePath: null }, { imagePath: "chat/l1/b" }]);
    await actions.deleteLead(form({ id: LEAD.id }));
    expect(m.deleted).toEqual(["chat/l1/a", "chat/l1/b"]);
    expect(fake.writes().map((q) => q.sql)).toEqual(['delete from "leads" where "leads"."id" = $1']);
  });

  it("збій сховища не лишає заявку невидаленою", async () => {
    m.delFails = true;
    fake.onSelect(leadMessages, () => [{ imagePath: "chat/l1/a" }]);
    await actions.deleteLead(form({ id: LEAD.id }));
    expect(fake.writes()[0].sql).toMatch(/^delete from "leads"/);
  });
});
