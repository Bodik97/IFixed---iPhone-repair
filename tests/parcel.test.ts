import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fake } from "./helpers/fakeDb";
import { leads } from "@/db/schema";

/**
 * Стеження за посилкою: заявка закривається й гарантія стартує лише тоді,
 * коли Нова Пошта каже «отримано». Збій звʼязку — не привід закривати.
 */

vi.mock("@/db", async () => {
  const { fake } = await import("./helpers/fakeDb");
  return { getDb: () => fake.db };
});
vi.mock("workflow", () => ({ sleep: async () => {} }));

import { checkParcel } from "@/workflows/watch-parcel";
import { parcelReceived } from "@/lib/novaPoshta";

const LEAD = {
  id: "11111111-1111-1111-1111-111111111111",
  orderNo: 1001,
  name: "Олег",
  phone: "0733150238",
  service: "Заміна екрана",
  status: "shipped",
  ttn: "20450000000000",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const np = (code: string | null) =>
  vi.stubGlobal("fetch", async () => {
    if (code === null) throw new Error("network");
    return Response.json({ success: true, data: [{ StatusCode: code }] });
  });

beforeEach(() => {
  fake.reset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

const closed = () => fake.writes().some((q) => q.sql.startsWith('update "leads"') && q.params.includes("done"));

describe("посилка Новою Поштою", () => {
  it("«отримано» — так, «у дорозі» — ні, без звʼязку — невідомо", async () => {
    np("9");
    expect(await parcelReceived("2045 0000 0000 00")).toBe(true);
    np("7");
    expect(await parcelReceived("20450000000000")).toBe(false);
    np(null);
    expect(await parcelReceived("20450000000000")).toBeNull();
  });

  it("клієнт забрав посилку — заявка закривається, стартує гарантія", async () => {
    fake.onSelect(leads, () => [LEAD]);
    np("9");
    expect(await checkParcel(LEAD.id, LEAD.ttn)).toBe("closed");
    expect(closed()).toBe(true);
    expect(fake.writes().find((q) => q.sql.startsWith('update "leads"'))!.sql).toContain('"warranty_until"');
  });

  it("посилка ще в дорозі або Нова Пошта мовчить — чекаємо далі, нічого не закриваємо", async () => {
    fake.onSelect(leads, () => [LEAD]);
    np("7");
    expect(await checkParcel(LEAD.id, LEAD.ttn)).toBe("wait");
    np(null);
    expect(await checkParcel(LEAD.id, LEAD.ttn)).toBe("wait");
    expect(closed()).toBe(false);
  });

  it("заявку вже закрили або накладну замінили — стеження припиняється", async () => {
    fake.onSelect(leads, () => [{ ...LEAD, status: "done" }]);
    np("9");
    expect(await checkParcel(LEAD.id, LEAD.ttn)).toBe("stop");

    fake.reset();
    fake.onSelect(leads, () => [{ ...LEAD, ttn: "59000000000000" }]);
    expect(await checkParcel(LEAD.id, LEAD.ttn)).toBe("stop");
    expect(closed()).toBe(false);
  });
});
