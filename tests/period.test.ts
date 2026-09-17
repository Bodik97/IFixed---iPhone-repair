import { describe, expect, it } from "vitest";
import { dayString, isPeriod, PERIODS, resolveRange } from "@/app/admin/groshi/period";

/**
 * Каса рахує гроші за проміжок. Помилка на один день тут — це неправильний
 * підсумок місяця, і помітять її не одразу.
 */
describe("проміжок каси", () => {
  it("за замовчуванням — поточний місяць", () => {
    const r = resolveRange({});
    const now = new Date();
    expect(r.label).toBe("Цей місяць");
    expect(r.from.getDate()).toBe(1);
    expect(r.from.getMonth()).toBe(now.getMonth());
    expect(r.from.getFullYear()).toBe(now.getFullYear());
  });

  it("невідомий період не ламає вибірку", () => {
    expect(resolveRange({ period: "казна-що" }).label).toBe("Цей місяць");
    expect(isPeriod("казна-що")).toBe(false);
    for (const p of PERIODS) expect(isPeriod(p.value)).toBe(true);
  });

  it("кінцевий день входить у проміжок повністю", () => {
    const r = resolveRange({ from: "2026-03-01", to: "2026-03-31" });
    // `to` — межа «до», не включно, тож це має бути початок 1 квітня
    expect(r.to).toBeDefined();
    expect(dayString(r.to!)).toBe("2026-04-01");
    expect(r.toDay).toBe("2026-03-31");
  });

  it("дати мають перевагу над готовим періодом", () => {
    const r = resolveRange({ period: "year", from: "2026-05-10", to: "2026-05-20" });
    expect(r.label).toBe("вибрані дати");
    expect(r.fromDay).toBe("2026-05-10");
  });

  it("одна дата без другої теж працює", () => {
    const only = resolveRange({ from: "2026-07-04" });
    expect(only.fromDay).toBe("2026-07-04");
    expect(only.to).toBeUndefined();
  });

  it("минулий місяць має обидві межі й не залазить у поточний", () => {
    const r = resolveRange({ period: "prev" });
    expect(r.to).toBeDefined();
    expect(r.from.getTime()).toBeLessThan(r.to!.getTime());
    expect(r.to!.getDate()).toBe(1);
  });

  it("dayString не з'їжджає на день назад", () => {
    expect(dayString(new Date(2026, 0, 1))).toBe("2026-01-01");
    expect(dayString(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});
