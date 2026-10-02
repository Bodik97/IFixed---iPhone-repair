import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Статус замовлення за номером і останніми 4 цифрами телефону. Номер — не
 * таємниця, тож без правильних цифр не віддаємо нічого, і відповідь на «не той
 * телефон» має бути такою ж, як на «немає такого номера».
 */

const m = vi.hoisted(() => ({
  limit: { ok: true } as { ok: true } | { ok: false; retryAfter: number },
  rows: [] as Record<string, unknown>[],
  dbCalls: 0,
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: async () => m.limit,
  clientIp: () => "1.2.3.4",
}));

vi.mock("@/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => {
            m.dbCalls++;
            return m.rows;
          },
        }),
      }),
    }),
  }),
}));

vi.mock("@/db/events", () => ({
  getEvents: async () => [{ createdAt: new Date("2026-05-01T10:00:00Z"), text: "Прийняли в ремонт" }],
}));

import { GET } from "@/app/api/orders/[no]/route";

const get = (no: string, phone?: string) =>
  GET(
    new Request(`http://test/api/orders/${no}${phone !== undefined ? `?phone=${encodeURIComponent(phone)}` : ""}`),
    { params: Promise.resolve({ no }) },
  );

const LEAD = {
  id: "lead-1",
  orderNo: 105,
  phone: "+380733150238",
  model: "iPhone 12",
  service: "Заміна екрана",
  problem: null,
  status: "new",
};

beforeEach(() => {
  m.limit = { ok: true };
  m.rows = [LEAD];
  m.dbCalls = 0;
});

describe("GET /api/orders/[no]", () => {
  it("правильний номер і цифри — віддає статус і журнал", async () => {
    const res = await get("105", "0238");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ no: "105", device: "iPhone 12", work: "Заміна екрана" });
    expect(Array.isArray(body.stages)).toBe(true);
    expect(body.log).toHaveLength(1);
    expect(body.log[0].text).toBe("Прийняли в ремонт");
  });

  it("не віддає телефон, ім'я чи внутрішній id", async () => {
    const body = JSON.stringify(await (await get("105", "0238")).json());
    expect(body).not.toContain("380733150238");
    expect(body).not.toContain("lead-1");
  });

  it("цифри з пробілами чи дефісом теж підходять", async () => {
    expect((await get("105", "02-38")).status).toBe(200);
    expect((await get(" 105 ", "0238")).status).toBe(200);
  });

  it("не той телефон і неіснуючий номер — однакова відповідь", async () => {
    const wrong = await get("105", "1111");
    m.rows = [];
    const missing = await get("999", "0238");

    expect(wrong.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(await wrong.json()).toEqual(await missing.json());
  });

  it("замовлення без телефону не відкривається жодними цифрами", async () => {
    m.rows = [{ ...LEAD, phone: null }];
    expect((await get("105", "0000")).status).toBe(404);
  });

  it("номер не з цифр — 400, до бази не йдемо", async () => {
    for (const no of ["abc", "1; drop table", "12345678901", ""]) {
      expect((await get(no, "0238")).status, no).toBe(400);
    }
    expect(m.dbCalls).toBe(0);
  });

  it("без цифр телефону або не 4 цифри — 400", async () => {
    expect((await get("105")).status).toBe(400);
    expect((await get("105", "238")).status).toBe(400);
    expect((await get("105", "50238")).status).toBe(400);
    expect(m.dbCalls).toBe(0);
  });

  it("перевищено ліміт — 429", async () => {
    m.limit = { ok: false, retryAfter: 60 };
    expect((await get("105", "0238")).status).toBe(429);
    expect(m.dbCalls).toBe(0);
  });
});
