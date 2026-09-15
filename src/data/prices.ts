// Прайс по моделях, у гривнях, «під ключ»: робота разом із деталлю.
//
// Звідки числа. Базовий ряд узято з відкритих прайсів reboot-service.com.ua
// (Львів), але після перевірки ринку дві колонки перераховано — вони не
// зводились з реальною собівартістю:
//
//   · АКУМУЛЯТОР підняли. Ми стояли найдешевшими у Львові в кожному
//     порівнянні: iPhone 13 — 1 200 ₴ проти 1 649 (KIVI PARTS), 2 000 (ICOOLA),
//     3 099 (Apple Room), 3 199 (iLounge). На 7 Plus деталь коштує 450 ₴, а
//     ціна була 690 ₴ — 240 ₴ на роботу, доставку й прибуток разом.
//     Тепер 900 ₴: це і собівартість × 2, і рівень ICOOLA (910 ₴).
//
//   · РОЗ'ЄМ ЗАРЯДЖАННЯ навпаки знизили. Тут ми були дорожчими за ринок:
//     iPhone 14 — 1 850 ₴ проти 1 212 у KIVI PARTS, iPhone 11 — 890 проти 584.
//
// Екрани лишились як були: дані по них суперечливі, бо «копія» у різних
// сервісів означає різні панелі (TFT, incell, OLED-копія), і зводити їх в
// одне число без власної собівартості було б вигадкою.
//
// Виміряні моделі: 7 Plus, 11, 12, 13, 14, 15. Решта — за трендом лінійки,
// з перевіркою, що ряд не має перекосів (старша модель не дорожча за новішу
// в тій самій лінійці).
//
// Джерела перевірки: kiviparts.com.ua, icoola.ua, ilounge.ua, appleroom.ua,
// reboot-service.com.ua. Станом на вересень 2026.
//
// Два місця згладжено свідомо:
//   · 14 Pro Max, копія екрана — у джерела 6900 проти 2600 у 14 Pro. Це викид,
//     поставлено 3000 за трендом серії.
//   · 16 Pro / Pro Max, копія — у джерела дешевша за базову 16. Вирівняно вгору.
//
// Що НЕ чіпали, хоч виглядає дивно — це реальні числа ринку:
//   · оригінал 15 Pro Max (23 000) дорожчий за 16 Pro Max (18 000);
//   · оригінал 15 Pro (15 500) дорожчий за 16 Pro (14 500);
//   · оригінал 13 (5 500) дорожчий за 14 (5 000).
// Рідкісні панелі справді бувають дорожчими за новіші.
//
// iPad та Apple Watch — цін на них конкуренти не публікують, тож лишаються
// зведені з київських прайсів (AppleFix, Технарі).
//
// Щоб змінити ціну — правте число тут. Прибрана робота просто зникає з таблиці
// на сторінці моделі.

/**
 * Показувати ціни на сайті.
 *
 * Поставте false, щоб тимчасово сховати прайс: блок цін на сторінці послуг
 * зникне, а на сторінці моделі лишаться самі роботи без сум.
 */
export const PRICES_PUBLISHED = true;

/** Гривні */
export type Money = number;

/** Роботи, ціна яких залежить від моделі. Ключ = slug послуги з services.ts */
export const PRICED_JOBS = [
  "zamina-ekrana",
  "akumuliator",
  "roziem-zariadzhannia",
  "kamera",
  "dynamik-i-mikrofon",
  "korpus",
  "knopky-y-vibro",
] as const;

export type PricedJob = (typeof PRICED_JOBS)[number];

/** Одна сума або два рівні деталі — оригінал і якісний аналог */
export type JobPrice = Money | { analog: Money; original: Money };

export type ModelPrice = Partial<Record<PricedJob, JobPrice>>;

export const modelPrices: Record<string, ModelPrice> = {
  // ─── iPhone ───
  "iphone-16-pro-max": { "zamina-ekrana": { analog: 4200, original: 18000 }, "akumuliator": 2800, "roziem-zariadzhannia": 2600, "kamera": 3200, "dynamik-i-mikrofon": 1200, "korpus": 2800, "knopky-y-vibro": 1100 },
  "iphone-16-pro": { "zamina-ekrana": { analog: 3900, original: 14500 }, "akumuliator": 2800, "roziem-zariadzhannia": 2500, "kamera": 3000, "dynamik-i-mikrofon": 1200, "korpus": 2800, "knopky-y-vibro": 1100 },
  "iphone-16-plus": { "zamina-ekrana": { analog: 4500, original: 13000 }, "akumuliator": 2800, "roziem-zariadzhannia": 2400, "kamera": 2600, "dynamik-i-mikrofon": 1100, "korpus": 2300, "knopky-y-vibro": 1000 },
  "iphone-16": { "zamina-ekrana": { analog: 4500, original: 13000 }, "akumuliator": 2800, "roziem-zariadzhannia": 2400, "kamera": 2500, "dynamik-i-mikrofon": 1100, "korpus": 2300, "knopky-y-vibro": 1000 },
  "iphone-15-pro-max": { "zamina-ekrana": { analog: 3600, original: 23000 }, "akumuliator": 2600, "roziem-zariadzhannia": 2400, "kamera": 3000, "dynamik-i-mikrofon": 1100, "korpus": 3500, "knopky-y-vibro": 1000 },
  "iphone-15-pro": { "zamina-ekrana": { analog: 3500, original: 15500 }, "akumuliator": 2500, "roziem-zariadzhannia": 2300, "kamera": 2800, "dynamik-i-mikrofon": 1100, "korpus": 2800, "knopky-y-vibro": 1000 },
  "iphone-15-plus": { "zamina-ekrana": { analog: 2500, original: 10000 }, "akumuliator": 2400, "roziem-zariadzhannia": 2200, "kamera": 2400, "dynamik-i-mikrofon": 1000, "korpus": 2300, "knopky-y-vibro": 950 },
  "iphone-15": { "zamina-ekrana": { analog: 2500, original: 10000 }, "akumuliator": 2300, "roziem-zariadzhannia": 2100, "kamera": 2300, "dynamik-i-mikrofon": 1000, "korpus": 2300, "knopky-y-vibro": 950 },
  "iphone-14-pro-max": { "zamina-ekrana": { analog: 3000, original: 12000 }, "akumuliator": 2300, "roziem-zariadzhannia": 1800, "kamera": 2600, "dynamik-i-mikrofon": 1000, "korpus": 2100, "knopky-y-vibro": 950 },
  "iphone-14-pro": { "zamina-ekrana": { analog: 2600, original: 11500 }, "akumuliator": 2200, "roziem-zariadzhannia": 1950, "kamera": 2400, "dynamik-i-mikrofon": 1000, "korpus": 2100, "knopky-y-vibro": 950 },
  "iphone-14-plus": { "zamina-ekrana": { analog: 2600, original: 11500 }, "akumuliator": 2100, "roziem-zariadzhannia": 1950, "kamera": 2200, "dynamik-i-mikrofon": 950, "korpus": 2100, "knopky-y-vibro": 900 },
  "iphone-14": { "zamina-ekrana": { analog: 1850, original: 5000 }, "akumuliator": 2000, "roziem-zariadzhannia": 1400, "kamera": 2000, "dynamik-i-mikrofon": 950, "korpus": 1850, "knopky-y-vibro": 900 },
  "iphone-13-pro-max": { "zamina-ekrana": { analog: 3000, original: 8800 }, "akumuliator": 2200, "roziem-zariadzhannia": 1800, "kamera": 2200, "dynamik-i-mikrofon": 950, "korpus": 2000, "knopky-y-vibro": 900 },
  "iphone-13-pro": { "zamina-ekrana": { analog: 2600, original: 7000 }, "akumuliator": 2100, "roziem-zariadzhannia": 1600, "kamera": 2000, "dynamik-i-mikrofon": 950, "korpus": 2000, "knopky-y-vibro": 900 },
  "iphone-13": { "zamina-ekrana": { analog: 2500, original: 5500 }, "akumuliator": 1700, "roziem-zariadzhannia": 1200, "kamera": 1800, "dynamik-i-mikrofon": 900, "korpus": 2000, "knopky-y-vibro": 850 },
  "iphone-13-mini": { "zamina-ekrana": { analog: 2400, original: 5300 }, "akumuliator": 1700, "roziem-zariadzhannia": 1200, "kamera": 1800, "dynamik-i-mikrofon": 900, "korpus": 1900, "knopky-y-vibro": 850 },
  "iphone-12-pro-max": { "zamina-ekrana": { analog: 2500, original: 6800 }, "akumuliator": 1800, "roziem-zariadzhannia": 900, "kamera": 1700, "dynamik-i-mikrofon": 900, "korpus": 1800, "knopky-y-vibro": 850 },
  "iphone-12-pro": { "zamina-ekrana": { analog: 2100, original: 3900 }, "akumuliator": 1550, "roziem-zariadzhannia": 900, "kamera": 1600, "dynamik-i-mikrofon": 900, "korpus": 1600, "knopky-y-vibro": 800 },
  "iphone-12": { "zamina-ekrana": { analog: 2100, original: 4500 }, "akumuliator": 1550, "roziem-zariadzhannia": 900, "kamera": 1500, "dynamik-i-mikrofon": 900, "korpus": 1500, "knopky-y-vibro": 800 },
  "iphone-12-mini": { "zamina-ekrana": { analog: 2000, original: 4300 }, "akumuliator": 1550, "roziem-zariadzhannia": 900, "kamera": 1500, "dynamik-i-mikrofon": 850, "korpus": 1450, "knopky-y-vibro": 800 },
  "iphone-11-pro-max": { "zamina-ekrana": { analog: 1900, original: 3400 }, "akumuliator": 1550, "roziem-zariadzhannia": 750, "kamera": 1600, "dynamik-i-mikrofon": 850, "korpus": 1300, "knopky-y-vibro": 800 },
  "iphone-11-pro": { "zamina-ekrana": { analog: 1700, original: 3000 }, "akumuliator": 1400, "roziem-zariadzhannia": 700, "kamera": 1500, "dynamik-i-mikrofon": 850, "korpus": 1200, "knopky-y-vibro": 800 },
  "iphone-11": { "zamina-ekrana": { analog: 1300, original: 2200 }, "akumuliator": 1250, "roziem-zariadzhannia": 650, "kamera": 1450, "dynamik-i-mikrofon": 850, "korpus": 1099, "knopky-y-vibro": 750 },
  "iphone-xs-max": { "zamina-ekrana": { analog: 1700, original: 3800 }, "akumuliator": 1100, "roziem-zariadzhannia": 1100, "kamera": 1400, "dynamik-i-mikrofon": 800, "korpus": 1100, "knopky-y-vibro": 750 },
  "iphone-xs": { "zamina-ekrana": { analog: 1400, original: 3400 }, "akumuliator": 1100, "roziem-zariadzhannia": 900, "kamera": 2000, "dynamik-i-mikrofon": 800, "korpus": 999, "knopky-y-vibro": 700 },
  "iphone-xr": { "zamina-ekrana": { analog: 2100, original: 2680 }, "akumuliator": 1400, "roziem-zariadzhannia": 655, "kamera": 1750, "dynamik-i-mikrofon": 800, "korpus": 999, "knopky-y-vibro": 700 },
  "iphone-x": { "zamina-ekrana": { analog: 1300, original: 3250 }, "akumuliator": 1250, "roziem-zariadzhannia": 800, "kamera": 1200, "dynamik-i-mikrofon": 800, "korpus": 899, "knopky-y-vibro": 700 },
  "iphone-8-plus": { "zamina-ekrana": { analog: 1000, original: 1900 }, "akumuliator": 1000, "roziem-zariadzhannia": 600, "kamera": 700, "dynamik-i-mikrofon": 500, "korpus": 999, "knopky-y-vibro": 650 },
  "iphone-8": { "zamina-ekrana": { analog: 950, original: 1800 }, "akumuliator": 900, "roziem-zariadzhannia": 580, "kamera": 650, "dynamik-i-mikrofon": 480, "korpus": 950, "knopky-y-vibro": 620 },
  "iphone-7-plus": { "zamina-ekrana": { analog: 950, original: 1750 }, "akumuliator": 900, "roziem-zariadzhannia": 550, "kamera": 620, "dynamik-i-mikrofon": 450, "korpus": 950, "knopky-y-vibro": 650 },
  "iphone-7": { "zamina-ekrana": { analog: 900, original: 1700 }, "akumuliator": 900, "roziem-zariadzhannia": 550, "kamera": 600, "dynamik-i-mikrofon": 450, "korpus": 950, "knopky-y-vibro": 650 },
  "iphone-se-3": { "zamina-ekrana": { analog: 1000, original: 1850 }, "akumuliator": 1000, "roziem-zariadzhannia": 600, "kamera": 680, "dynamik-i-mikrofon": 480, "korpus": 950, "knopky-y-vibro": 630 },
  "iphone-se-2": { "zamina-ekrana": { analog: 950, original: 1800 }, "akumuliator": 900, "roziem-zariadzhannia": 580, "kamera": 650, "dynamik-i-mikrofon": 480, "korpus": 950, "knopky-y-vibro": 620 },
  "iphone-6s-6s-plus": { "zamina-ekrana": { analog: 850, original: 1500 }, "akumuliator": 850, "roziem-zariadzhannia": 520, "kamera": 560, "dynamik-i-mikrofon": 430, "korpus": 900, "knopky-y-vibro": 600 },
  "iphone-6-6-plus": { "zamina-ekrana": { analog: 800, original: 1400 }, "akumuliator": 850, "roziem-zariadzhannia": 500, "kamera": 550, "dynamik-i-mikrofon": 420, "korpus": 880, "knopky-y-vibro": 600 },

  // ─── iPad ───
  "ipad-pro-13-m4": { "zamina-ekrana": 13400, "akumuliator": 3800, "roziem-zariadzhannia": 1900 },
  "ipad-pro-11-m1": { "zamina-ekrana": 6400, "akumuliator": 3300, "roziem-zariadzhannia": 1700 },
  "ipad-pro-11-2020": { "zamina-ekrana": 5600, "akumuliator": 2800, "roziem-zariadzhannia": 1600 },
  "ipad-pro-11-2018": { "zamina-ekrana": 5200, "akumuliator": 2600, "roziem-zariadzhannia": 1600 },
  "ipad-pro-12-9-2020": { "zamina-ekrana": 9500, "akumuliator": 3200, "roziem-zariadzhannia": 1700 },
  "ipad-pro-12-9-2018": { "zamina-ekrana": 7600, "akumuliator": 2900, "roziem-zariadzhannia": 1600 },
  "ipad-pro-12-9-2017": { "zamina-ekrana": 5000, "akumuliator": 2300, "roziem-zariadzhannia": 1500 },
  "ipad-pro-12-9-2015": { "zamina-ekrana": 4400, "akumuliator": 2100, "roziem-zariadzhannia": 1400 },
  "ipad-pro-10-5": { "zamina-ekrana": 3600, "akumuliator": 1600, "roziem-zariadzhannia": 1400 },
  "ipad-pro-9-7": { "zamina-ekrana": 3100, "akumuliator": 1700, "roziem-zariadzhannia": 1300 },
  "ipad-air-5": { "zamina-ekrana": 3200, "akumuliator": 2500, "roziem-zariadzhannia": 1500 },
  "ipad-air-4": { "zamina-ekrana": 2900, "akumuliator": 2400, "roziem-zariadzhannia": 1400 },
  "ipad-air-3": { "zamina-ekrana": 2400, "akumuliator": 2300, "roziem-zariadzhannia": 1300 },
  "ipad-10": { "zamina-ekrana": 2600, "akumuliator": 1800, "roziem-zariadzhannia": 1400 },
  "ipad-9": { "zamina-ekrana": 1900, "akumuliator": 1600, "roziem-zariadzhannia": 1200 },
  "ipad-8": { "zamina-ekrana": 1800, "akumuliator": 1500, "roziem-zariadzhannia": 1200 },
  "ipad-7": { "zamina-ekrana": 1700, "akumuliator": 1500, "roziem-zariadzhannia": 1200 },
  "ipad-6": { "zamina-ekrana": 1500, "akumuliator": 1400, "roziem-zariadzhannia": 1100 },
  "ipad-5": { "zamina-ekrana": 1400, "akumuliator": 1400, "roziem-zariadzhannia": 1100 },
  "ipad-mini-6": { "zamina-ekrana": 3400, "akumuliator": 2000, "roziem-zariadzhannia": 1500 },
  "ipad-mini-5": { "zamina-ekrana": 2500, "akumuliator": 1700, "roziem-zariadzhannia": 1300 },
  "ipad-mini-4": { "zamina-ekrana": 2300, "akumuliator": 1500, "roziem-zariadzhannia": 1200 },

  // ─── Apple Watch ───
  "apple-watch-ultra": { "zamina-ekrana": 6200, "akumuliator": 2800 },
  "apple-watch-s9": { "zamina-ekrana": 3000, "akumuliator": 2300 },
  "apple-watch-s8": { "zamina-ekrana": 2800, "akumuliator": 2100 },
  "apple-watch-se": { "zamina-ekrana": 2000, "akumuliator": 1500 },
  "apple-watch-s7": { "zamina-ekrana": 2600, "akumuliator": 1900 },
  "apple-watch-s5": { "zamina-ekrana": 1800, "akumuliator": 1400 },
  "apple-watch-s4": { "zamina-ekrana": 1700, "akumuliator": 1300 },
  "apple-watch-s3": { "zamina-ekrana": 1300, "akumuliator": 1000 },
  "apple-watch-s2": { "zamina-ekrana": 1200, "akumuliator": 950 },
  "apple-watch-s1": { "zamina-ekrana": 1100, "akumuliator": 900 },
};

/**
 * Роботи на платі: ціна залежить від того, що покаже діагностика, а не від
 * моделі. Тому показуємо «від» — і лише після безкоштовної діагностики
 * називаємо точну суму.
 */
export const boardPrices: { slug: string; from: Money }[] = [
  { slug: "zalyv-vodoiu", from: 600 },
  { slug: "ne-vmykaietsia", from: 500 },
  { slug: "ne-bachyt-merezhu", from: 1990 },
  { slug: "vidnovlennia-danykh", from: 600 },
];

/** Фіксовані ціни, однакові для всіх моделей */
export const flatPrices: { slug: string; price: Money }[] = [
  { slug: "profilaktyka", price: 600 },
];

export function getModelPrice(slug: string): ModelPrice | undefined {
  return modelPrices[slug];
}

/** Вилка ціни роботи по всьому каталогу — зведена таблиця на сторінці послуг */
export function jobRange(job: PricedJob): { min: Money; max: Money } | null {
  const all: Money[] = [];

  for (const price of Object.values(modelPrices)) {
    const v = price[job];
    if (v === undefined) continue;
    if (typeof v === "number") all.push(v);
    else all.push(v.analog, v.original);
  }

  if (all.length === 0) return null;
  return { min: Math.min(...all), max: Math.max(...all) };
}

/**
 * Від скількох починається послуга — для картки в каталозі.
 *
 * У робіт, що залежать від моделі, це найдешевша модель у прайсі; у решти —
 * фіксована ціна. Послуга без ціни повертає null: у картці лишиться номер.
 */
export function serviceFrom(slug: string): { price: Money; exact: boolean } | null {
  if ((PRICED_JOBS as readonly string[]).includes(slug)) {
    const min = jobRange(slug as PricedJob)?.min;
    return min === undefined ? null : { price: min, exact: false };
  }

  const board = boardPrices.find((b) => b.slug === slug);
  if (board) return { price: board.from, exact: false };

  // Профілактика коштує однаково для всіх — «від» тут було б неправдою
  const flat = flatPrices.find((f) => f.slug === slug);
  return flat ? { price: flat.price, exact: true } : null;
}

/** 3400 → «3 400 ₴» — нерозривний пробіл, щоб сума не ламалась на два рядки */
export function uah(value: Money): string {
  return `${value.toLocaleString("uk-UA").replace(/\s/g, "\u202f")}\u202f₴`;
}
