import { beforeEach, describe, expect, it, vi } from "vitest";
import { fake } from "./helpers/fakeDb";

/**
 * Робочий список і архів ділять заявки за статусом: закриті («Завершено»,
 * «Відмова») — лише в архіві. Пошук без області шукає скрізь.
 */

vi.mock("@/db", async () => {
  const { fake } = await import("./helpers/fakeDb");
  return { getDb: () => fake.db };
});

import { findLeads } from "@/db/leads";
import { leads } from "@/db/schema";

const where = () => fake.queries[0].sql.split(" where ")[1] ?? "";

beforeEach(() => {
  fake.reset();
  // Список порожній, але підрахунок має повернути рядок із кількістю
  fake.onSelect(leads, (q) => (q.sql.startsWith("select count") ? [{ found: 0 }] : []));
});

describe("findLeads: область", () => {
  it("робочий список — без закритих", async () => {
    await findLeads({ scope: "active", page: 1, perPage: 20 });
    expect(where()).toMatch(/"leads"\."status" not in \(\$1, \$2\)/);
    expect(fake.queries[0].params).toEqual(expect.arrayContaining(["done", "rejected"]));
  });

  it("архів — лише закриті", async () => {
    await findLeads({ scope: "archive", page: 1, perPage: 20 });
    expect(where()).toMatch(/"leads"\."status" in \(\$1, \$2\)/);
  });

  it("пошук скрізь — без умови на статус", async () => {
    await findLeads({ scope: "all", q: "Олег", page: 1, perPage: 20 });
    expect(where()).not.toMatch(/"status"/);
  });
});
