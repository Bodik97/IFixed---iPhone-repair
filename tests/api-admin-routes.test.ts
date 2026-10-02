import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Маршрути, що віддають дані поза сторінками: фото відгуку (публічне, але лише
 * опубліковане), вивантаження каси й квитанція (лише майстру), відбиток стану.
 */

const m = vi.hoisted(() => ({
  admin: false,
  user: null as { id: string; primaryEmailAddress: { emailAddress: string } } | null,
  review: undefined as Record<string, unknown> | undefined,
  blob: null as unknown,
  lead: undefined as Record<string, unknown> | undefined,
  dbTouched: 0,
}));

vi.mock("@/lib/admin", () => ({ isAdmin: async () => m.admin }));
vi.mock("@clerk/nextjs/server", () => ({ currentUser: async () => m.user }));
vi.mock("@vercel/blob", () => ({ get: async () => m.blob }));

/** Будь-який ланцюжок drizzle завершується масивом з одним рядком */
function chain(): unknown {
  return new Proxy(() => {}, {
    get: (_t, key) => {
      if (key === "then") {
        m.dbTouched++;
        const row = m.review ?? { leads: 3, updated: new Date(1000), unread: 2 };
        return (resolve: (v: unknown) => void) => resolve([row]);
      }
      return chain();
    },
    apply: () => chain(),
  });
}
vi.mock("@/db", () => ({ getDb: () => chain() }));

vi.mock("@/db/adminStats", () => ({
  getPaidLeads: async () => [
    { orderNo: 1, paidAt: new Date("2026-05-02"), name: 'Олег "Ремонт"; ТОВ', phone: "0733150238", model: "iPhone", service: "Екран", price: 3000, partsCost: 1200, prepayment: 500 },
  ],
}));
vi.mock("@/db/expenses", () => ({
  getExpenses: async () => [],
  categoryLabel: (c: string) => c,
}));
vi.mock("@/db/events", () => ({ getLeadById: async () => m.lead }));

import { GET as reviewImage } from "@/app/api/reviews/[id]/image/route";
import { GET as csv } from "@/app/admin/groshi/csv/route";
import { GET as receipt } from "@/app/admin/zayavky/[id]/kvytantsiya/route";
import { GET as state } from "@/app/api/state/route";

const okBlob = { statusCode: 200, stream: new ReadableStream(), blob: { contentType: "image/webp" } };

beforeEach(() => {
  m.admin = false;
  m.user = null;
  m.review = undefined;
  m.blob = null;
  m.lead = undefined;
  m.dbTouched = 0;
});

describe("GET /api/reviews/[id]/image", () => {
  const get = () => reviewImage(new Request("http://test"), { params: Promise.resolve({ id: "r1" }) });

  it("опублікований відгук із фото — віддає фото", async () => {
    m.review = { published: true, imagePath: "reviews/r1" };
    m.blob = okBlob;
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/webp");
  });

  it("чернетка — 404, навіть якщо фото є", async () => {
    m.review = { published: false, imagePath: "reviews/r1" };
    m.blob = okBlob;
    expect((await get()).status).toBe(404);
  });

  it("відгук без фото або файл зник — 404", async () => {
    m.review = { published: true, imagePath: null };
    expect((await get()).status).toBe(404);
    m.review = { published: true, imagePath: "reviews/r1" };
    m.blob = null;
    expect((await get()).status).toBe(404);
  });
});

describe("GET /admin/groshi/csv", () => {
  it("не майстру — 403, до бази не йдемо", async () => {
    const res = await csv(new Request("http://test/admin/groshi/csv"));
    expect(res.status).toBe(403);
  });

  it("майстру — CSV з BOM, «;» і лапки екрановані, не кешується", async () => {
    m.admin = true;
    const res = await csv(new Request("http://test/admin/groshi/csv?period=month"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("cache-control")).toBe("no-store");

    // text() знімає BOM при декодуванні, тож дивимось сирі байти
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('"Олег ""Ремонт""; ТОВ"');
    expect(text).toContain('"1800"'); // 3000 - 1200
  });
});

describe("GET /admin/zayavky/[id]/kvytantsiya", () => {
  const get = () => receipt(new Request("http://test"), { params: Promise.resolve({ id: "l1" }) });
  const LEAD = {
    orderNo: 12,
    name: '<script>alert(1)</script>',
    phone: "0733150238",
    model: "iPhone",
    service: null,
    problem: 'Не вмикається "зовсім"',
    createdAt: new Date("2026-05-01T10:00:00Z"),
    price: null,
    prepayment: 400,
  };

  it("не майстру — 403", async () => {
    m.lead = LEAD;
    expect((await get()).status).toBe(403);
  });

  it("неіснуюча заявка — 404", async () => {
    m.admin = true;
    expect((await get()).status).toBe(404);
  });

  it("квитанція: дві копії, дані клієнта екрановані", async () => {
    m.admin = true;
    m.lead = LEAD;
    const res = await get();
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("примірник клієнта");
    expect(html).toContain("примірник сервісу");
    expect(html).toContain("після діагностики");
  });
});

describe("GET /api/state", () => {
  it("анонім — version: null, до бази не йдемо", async () => {
    const res = await state();
    expect(await res.json()).toEqual({ version: null });
    expect(m.dbTouched).toBe(0);
  });

  it("майстер — відбиток із кількості, часу й непрочитаних", async () => {
    m.admin = true;
    expect(await (await state()).json()).toEqual({ version: "3:1000:2" });
  });

  it("клієнт — свій відбиток", async () => {
    m.user = { id: "u1", primaryEmailAddress: { emailAddress: "a@b.cc" } };
    expect(await (await state()).json()).toEqual({ version: "3:1000:2" });
  });
});
