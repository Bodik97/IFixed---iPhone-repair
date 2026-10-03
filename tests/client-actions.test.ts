import { beforeEach, describe, expect, it, vi } from "vitest";
import { fake } from "./helpers/fakeDb";
import { reviews } from "@/db/schema";

/**
 * Дії клієнта з кабінету. Головне — клієнт змінює лише своє: доставку тільки
 * своєї заявки, відгук тільки один і тільки з підтвердженою поштою.
 */

type User = {
  id: string;
  firstName: string | null;
  hasImage: boolean;
  imageUrl: string;
  primaryEmailAddress: { emailAddress: string; verification: { status: string } } | null;
};

const m = vi.hoisted(() => ({
  userId: null as string | null,
  user: null as User | null,
}));

vi.mock("@/db", async () => {
  const { fake } = await import("./helpers/fakeDb");
  return { getDb: () => fake.db };
});
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: m.userId }),
  currentUser: async () => m.user,
}));

import { requestDelivery } from "@/app/moi-remonty/actions";
import { submitReview } from "@/app/actions/reviews";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
};

const USER: User = {
  id: "user_1",
  firstName: " Олег ",
  hasImage: false,
  imageUrl: "https://img.clerk.com/initials",
  primaryEmailAddress: { emailAddress: "oleg@gmail.com", verification: { status: "verified" } },
};

beforeEach(() => {
  fake.reset();
  m.userId = null;
  m.user = null;
});

describe("requestDelivery", () => {
  it("без входу — нічого не пишемо", async () => {
    await requestDelivery(form({ id: "l1", address: "Львів, відділення 5" }));
    expect(fake.queries).toEqual([]);
  });

  it("закоротка адреса — нічого не пишемо", async () => {
    m.userId = "user_1";
    await requestDelivery(form({ id: "l1", address: " Л " }));
    expect(fake.queries).toEqual([]);
  });

  it("оновлює лише заявку цього клієнта", async () => {
    m.userId = "user_1";
    await requestDelivery(form({ id: "l1", address: "  Львів, відділення 5  " }));

    const [q] = fake.writes();
    expect(q.sql).toMatch(/^update "leads" set .* where \("leads"\."id" = \$\d+ and "leads"\."clerk_user_id" = \$\d+\)$/);
    expect(q.params).toEqual(expect.arrayContaining([true, "Львів, відділення 5", "l1", "user_1"]));
  });

  it("задовга адреса обрізається до 300 символів", async () => {
    m.userId = "user_1";
    await requestDelivery(form({ id: "l1", address: "а".repeat(1000) }));
    expect(fake.writes()[0].params).toContain("а".repeat(300));
  });
});

describe("submitReview", () => {
  const submit = (fields: Record<string, string>) => submitReview(null, form(fields));
  const GOOD = { text: "Замінили екран за годину, все працює.", rating: "5", device: "iPhone 13" };

  it("без входу — просимо увійти", async () => {
    expect(await submit(GOOD)).toEqual({ ok: false, error: expect.stringMatching(/увійдіть/) });
    expect(fake.queries).toEqual([]);
  });

  it("закороткий текст або оцінка поза 1–5 — помилка", async () => {
    m.user = USER;
    expect((await submit({ ...GOOD, text: "Добре" })).ok).toBe(false);
    for (const rating of ["0", "6", "4.5", "abc"]) {
      expect(await submit({ ...GOOD, rating }), rating).toEqual({ ok: false, error: "Оберіть оцінку від 1 до 5." });
    }
    expect(fake.writes()).toEqual([]);
  });

  it("непідтверджена пошта — відгук не приймаємо", async () => {
    m.user = { ...USER, primaryEmailAddress: { emailAddress: "a@b.cc", verification: { status: "unverified" } } };
    expect(await submit(GOOD)).toEqual({ ok: false, error: expect.stringMatching(/підтвердіть пошту/) });
    expect(fake.writes()).toEqual([]);
  });

  it("другий відгук від того самого клієнта — відмова", async () => {
    m.user = USER;
    fake.onSelect(reviews, () => [{ id: "r1", clerkUserId: "user_1", authorName: "Олег", rating: 5, text: "x", createdAt: new Date() }]);
    expect(await submit(GOOD)).toEqual({ ok: false, error: "Ви вже лишали відгук. Дякуємо!" });
    expect(fake.writes()).toEqual([]);
  });

  it("перший відгук — у базу неопублікованим, з позначкою Google для gmail", async () => {
    m.user = USER;
    expect(await submit(GOOD)).toEqual({ ok: true });

    const [q] = fake.writes();
    expect(q.sql).toMatch(/^insert into "reviews"/);
    // published не передаємо — лишається default (false, на модерації)
    const [cols, vals] = [...q.sql.matchAll(/\(([^)]*)\)/g)].map((x) => x[1].split(", "));
    expect(vals[cols.indexOf('"published"')]).toBe("default");
    expect(q.params).toEqual(expect.arrayContaining(["user_1", "Олег", "iPhone 13", 5, true]));
  });

  it("ініціали Clerk не видаються за фото", async () => {
    m.user = USER;
    await submit(GOOD);
    expect(fake.writes()[0].params).not.toContain(USER.imageUrl);
  });
});
