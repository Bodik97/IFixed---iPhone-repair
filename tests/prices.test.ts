import { describe, expect, it } from "vitest";
import {
  flatPrices,
  jobRange,
  modelPrices,
  PRICED_JOBS,
  serviceFrom,
  uah,
  type PricedJob,
} from "@/data/prices";
import { allModels } from "@/data/catalog";

/**
 * Прайс правиться руками й скриптами, і саме тут ми двічі вже помилялись:
 * то ряд ішов перекосом (стара модель дорожча за новішу), то ціна лишалась
 * від коефіцієнта, який промахнувся. Ці перевірки ловлять такі речі самі.
 */

const entries = Object.entries(modelPrices);

describe("прайс: цілісність", () => {
  it("має записи", () => {
    expect(entries.length).toBeGreaterThan(30);
  });

  it("усі ціни додатні й цілі", () => {
    for (const [slug, price] of entries) {
      for (const [job, value] of Object.entries(price)) {
        const nums = typeof value === "number" ? [value] : [value.analog, value.original];
        for (const n of nums) {
          expect(Number.isInteger(n), `${slug} / ${job} = ${n}`).toBe(true);
          expect(n, `${slug} / ${job}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("копія екрана дешевша за оригінал", () => {
    for (const [slug, price] of entries) {
      const screen = price["zamina-ekrana"];
      if (!screen || typeof screen === "number") continue;
      expect(screen.analog, `${slug}: копія має бути дешевшою`).toBeLessThan(screen.original);
    }
  });

  it("кожна модель прайсу є в каталозі", () => {
    const known = new Set(allModels.map((m) => m.slug));
    for (const [slug] of entries) {
      expect(known.has(slug), `${slug} немає в каталозі`).toBe(true);
    }
  });
});

describe("прайс: ряд без грубих перекосів", () => {
  /**
   * Новіша модель зазвичай дорожча за старішу, але не завжди: рідкісні панелі
   * й зняті з випуску деталі справді бувають дорожчими, і різниця у 2–7%
   * по ринку — норма. Ловимо лише грубі провали, які майже напевно є
   * помилкою в даних. Саме так знайшлась ціна роз'єму на 11 Pro: 1 751 ₴
   * проти 584 ₴ у базової 11-ки того ж покоління.
   */
  const TOLERANCE = 0.25;
  const gens = ["16", "15", "14", "13", "12", "11"];
  const tiers = [
    ["базова", ""],
    ["Pro", "-pro"],
    ["Pro Max", "-pro-max"],
  ] as const;

  for (const [tierName, suffix] of tiers) {
    for (const job of PRICED_JOBS) {
      it(`${tierName} · ${job}`, () => {
        const row = gens
          .map((g) => ({ gen: g, price: modelPrices[`iphone-${g}${suffix}`]?.[job] }))
          .filter((r): r is { gen: string; price: NonNullable<typeof r.price> } => r.price != null)
          .map((r) => ({
            gen: r.gen,
            value: typeof r.price === "number" ? r.price : r.price.original,
          }));

        for (let i = 0; i < row.length - 1; i++) {
          const newer = row[i];
          const older = row[i + 1];
          const floor = older.value * (1 - TOLERANCE);

          expect(
            newer.value,
            `iPhone ${newer.gen} ${tierName} (${newer.value} ₴) дешевший за ${older.gen} (${older.value} ₴) більш ніж на ${TOLERANCE * 100}%`,
          ).toBeGreaterThanOrEqual(floor);
        }
      });
    }
  }
});

describe("похідні від прайсу", () => {
  it("jobRange: мінімум не більший за максимум", () => {
    for (const job of PRICED_JOBS) {
      const r = jobRange(job as PricedJob);
      expect(r, job).not.toBeNull();
      expect(r!.min).toBeLessThanOrEqual(r!.max);
    }
  });

  it("serviceFrom: у робіт від моделі ціна орієнтовна, у фіксованих — точна", () => {
    for (const job of PRICED_JOBS) {
      const f = serviceFrom(job);
      expect(f, job).not.toBeNull();
      expect(f!.exact, `${job} не може мати точну ціну`).toBe(false);
      expect(f!.price).toBe(jobRange(job as PricedJob)!.min);
    }

    for (const { slug, price } of flatPrices) {
      const f = serviceFrom(slug);
      expect(f, slug).not.toBeNull();
      expect(f!.exact, `${slug} має фіксовану ціну`).toBe(true);
      expect(f!.price).toBe(price);
    }
  });

  it("serviceFrom: невідома послуга — null", () => {
    expect(serviceFrom("takoi-posluhy-nemaie")).toBeNull();
  });

  it("uah: сума не ламається на два рядки", () => {
    // Звичайних пробілів бути не повинно — лише нерозривні
    expect(uah(2800)).not.toMatch(/ /);
    expect(uah(2800)).toMatch(/₴$/);
  });
});
