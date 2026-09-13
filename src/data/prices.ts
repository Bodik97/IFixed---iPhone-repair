// Прайс по моделях, у гривнях, «під ключ»: робота разом із деталлю.
//
// ⚠️ ЦІ СУМИ — ОРІЄНТИРИ З РИНКУ (прайси iLounge і Технарів, вересень 2026).
// Вони підставлені, щоб бачити готову сторінку. Замініть на власні перед тим,
// як показувати сайт клієнтам.
//
// Щоб змінити ціну — правте число тут. Прибрана робота просто зникає з таблиці
// на сторінці моделі.

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
  "iphone-16-pro-max": { "zamina-ekrana": { analog: 7400, original: 12900 }, "akumuliator": 2400, "roziem-zariadzhannia": 1900, "kamera": 3200, "dynamik-i-mikrofon": 1500, "korpus": 4200, "knopky-y-vibro": 1400 },
  "iphone-16-pro": { "zamina-ekrana": { analog: 6900, original: 11900 }, "akumuliator": 2200, "roziem-zariadzhannia": 1800, "kamera": 3000, "dynamik-i-mikrofon": 1500, "korpus": 3900, "knopky-y-vibro": 1400 },
  "iphone-16-plus": { "zamina-ekrana": { analog: 6200, original: 10400 }, "akumuliator": 2000, "roziem-zariadzhannia": 1700, "kamera": 2400, "dynamik-i-mikrofon": 1400, "korpus": 3600, "knopky-y-vibro": 1300 },
  "iphone-16": { "zamina-ekrana": { analog: 5700, original: 9600 }, "akumuliator": 1900, "roziem-zariadzhannia": 1700, "kamera": 2300, "dynamik-i-mikrofon": 1400, "korpus": 3400, "knopky-y-vibro": 1300 },
  "iphone-15-pro-max": { "zamina-ekrana": { analog: 5900, original: 10200 }, "akumuliator": 2100, "roziem-zariadzhannia": 1700, "kamera": 2900, "dynamik-i-mikrofon": 1400, "korpus": 3700, "knopky-y-vibro": 1300 },
  "iphone-15-pro": { "zamina-ekrana": { analog: 5400, original: 9500 }, "akumuliator": 2000, "roziem-zariadzhannia": 1700, "kamera": 2700, "dynamik-i-mikrofon": 1400, "korpus": 3500, "knopky-y-vibro": 1300 },
  "iphone-15-plus": { "zamina-ekrana": { analog: 4900, original: 8300 }, "akumuliator": 1800, "roziem-zariadzhannia": 1600, "kamera": 2200, "dynamik-i-mikrofon": 1300, "korpus": 3200, "knopky-y-vibro": 1200 },
  "iphone-15": { "zamina-ekrana": { analog: 4600, original: 7900 }, "akumuliator": 1800, "roziem-zariadzhannia": 1600, "kamera": 2100, "dynamik-i-mikrofon": 1300, "korpus": 3000, "knopky-y-vibro": 1200 },
  "iphone-14-pro-max": { "zamina-ekrana": { analog: 5300, original: 9200 }, "akumuliator": 1900, "roziem-zariadzhannia": 1600, "kamera": 2600, "dynamik-i-mikrofon": 1300, "korpus": 3400, "knopky-y-vibro": 1200 },
  "iphone-14-pro": { "zamina-ekrana": { analog: 4900, original: 8500 }, "akumuliator": 1800, "roziem-zariadzhannia": 1600, "kamera": 2500, "dynamik-i-mikrofon": 1300, "korpus": 3200, "knopky-y-vibro": 1200 },
  "iphone-14-plus": { "zamina-ekrana": { analog: 3900, original: 6900 }, "akumuliator": 1700, "roziem-zariadzhannia": 1500, "kamera": 1900, "dynamik-i-mikrofon": 1200, "korpus": 2900, "knopky-y-vibro": 1100 },
  "iphone-14": { "zamina-ekrana": { analog: 3600, original: 6500 }, "akumuliator": 1600, "roziem-zariadzhannia": 1500, "kamera": 1800, "dynamik-i-mikrofon": 1200, "korpus": 2700, "knopky-y-vibro": 1100 },
  "iphone-13-pro-max": { "zamina-ekrana": { analog: 3900, original: 6900 }, "akumuliator": 1700, "roziem-zariadzhannia": 1500, "kamera": 2300, "dynamik-i-mikrofon": 1200, "korpus": 2800, "knopky-y-vibro": 1100 },
  "iphone-13-pro": { "zamina-ekrana": { analog: 3400, original: 6200 }, "akumuliator": 1600, "roziem-zariadzhannia": 1400, "kamera": 2100, "dynamik-i-mikrofon": 1200, "korpus": 2600, "knopky-y-vibro": 1100 },
  "iphone-13": { "zamina-ekrana": { analog: 2900, original: 5200 }, "akumuliator": 1500, "roziem-zariadzhannia": 1400, "kamera": 1700, "dynamik-i-mikrofon": 1100, "korpus": 2400, "knopky-y-vibro": 1000 },
  "iphone-13-mini": { "zamina-ekrana": { analog: 2800, original: 5000 }, "akumuliator": 1400, "roziem-zariadzhannia": 1400, "kamera": 1700, "dynamik-i-mikrofon": 1100, "korpus": 2300, "knopky-y-vibro": 1000 },
  "iphone-12-pro-max": { "zamina-ekrana": { analog: 3200, original: 5600 }, "akumuliator": 1500, "roziem-zariadzhannia": 1400, "kamera": 1900, "dynamik-i-mikrofon": 1100, "korpus": 2400, "knopky-y-vibro": 1000 },
  "iphone-12-pro": { "zamina-ekrana": { analog: 2800, original: 4900 }, "akumuliator": 1400, "roziem-zariadzhannia": 1300, "kamera": 1800, "dynamik-i-mikrofon": 1100, "korpus": 2200, "knopky-y-vibro": 1000 },
  "iphone-12": { "zamina-ekrana": { analog: 2700, original: 4800 }, "akumuliator": 1400, "roziem-zariadzhannia": 1300, "kamera": 1500, "dynamik-i-mikrofon": 1100, "korpus": 2100, "knopky-y-vibro": 1000 },
  "iphone-12-mini": { "zamina-ekrana": { analog: 2600, original: 4600 }, "akumuliator": 1300, "roziem-zariadzhannia": 1300, "kamera": 1500, "dynamik-i-mikrofon": 1000, "korpus": 2000, "knopky-y-vibro": 950 },
  "iphone-11-pro-max": { "zamina-ekrana": { analog: 2600, original: 4400 }, "akumuliator": 1400, "roziem-zariadzhannia": 1300, "kamera": 1700, "dynamik-i-mikrofon": 1000, "korpus": 2000, "knopky-y-vibro": 950 },
  "iphone-11-pro": { "zamina-ekrana": { analog: 2300, original: 3900 }, "akumuliator": 1300, "roziem-zariadzhannia": 1200, "kamera": 1600, "dynamik-i-mikrofon": 1000, "korpus": 1900, "knopky-y-vibro": 950 },
  "iphone-11": { "zamina-ekrana": { analog: 1700, original: 2900 }, "akumuliator": 1200, "roziem-zariadzhannia": 1200, "kamera": 1200, "dynamik-i-mikrofon": 950, "korpus": 1700, "knopky-y-vibro": 900 },
  "iphone-xs-max": { "zamina-ekrana": { analog: 2200, original: 3800 }, "akumuliator": 1200, "roziem-zariadzhannia": 1200, "kamera": 1400, "dynamik-i-mikrofon": 950, "korpus": 1800, "knopky-y-vibro": 900 },
  "iphone-xs": { "zamina-ekrana": { analog: 1900, original: 3400 }, "akumuliator": 1100, "roziem-zariadzhannia": 1100, "kamera": 1300, "dynamik-i-mikrofon": 950, "korpus": 1700, "knopky-y-vibro": 900 },
  "iphone-xr": { "zamina-ekrana": { analog: 1600, original: 2700 }, "akumuliator": 1100, "roziem-zariadzhannia": 1100, "kamera": 1100, "dynamik-i-mikrofon": 900, "korpus": 1600, "knopky-y-vibro": 850 },
  "iphone-x": { "zamina-ekrana": { analog: 1800, original: 3200 }, "akumuliator": 1100, "roziem-zariadzhannia": 1100, "kamera": 1300, "dynamik-i-mikrofon": 900, "korpus": 1600, "knopky-y-vibro": 850 },
  "iphone-8-plus": { "zamina-ekrana": { analog: 1200, original: 1900 }, "akumuliator": 950, "roziem-zariadzhannia": 1000, "kamera": 950, "dynamik-i-mikrofon": 850, "korpus": 1400, "knopky-y-vibro": 800 },
  "iphone-8": { "zamina-ekrana": { analog: 1100, original: 1700 }, "akumuliator": 900, "roziem-zariadzhannia": 1000, "kamera": 900, "dynamik-i-mikrofon": 850, "korpus": 1300, "knopky-y-vibro": 800 },
  "iphone-7-plus": { "zamina-ekrana": { analog: 1000, original: 1600 }, "akumuliator": 850, "roziem-zariadzhannia": 950, "kamera": 900, "dynamik-i-mikrofon": 800, "korpus": 1200, "knopky-y-vibro": 750 },
  "iphone-7": { "zamina-ekrana": { analog: 900, original: 1500 }, "akumuliator": 850, "roziem-zariadzhannia": 950, "kamera": 850, "dynamik-i-mikrofon": 800, "korpus": 1100, "knopky-y-vibro": 750 },
  "iphone-se-3": { "zamina-ekrana": { analog: 1400, original: 2300 }, "akumuliator": 1000, "roziem-zariadzhannia": 1000, "kamera": 950, "dynamik-i-mikrofon": 850, "korpus": 1300, "knopky-y-vibro": 800 },
  "iphone-se-2": { "zamina-ekrana": { analog: 1300, original: 2100 }, "akumuliator": 950, "roziem-zariadzhannia": 1000, "kamera": 900, "dynamik-i-mikrofon": 850, "korpus": 1200, "knopky-y-vibro": 800 },
  "iphone-6s-6s-plus": { "zamina-ekrana": { analog: 850, original: 1400 }, "akumuliator": 800, "roziem-zariadzhannia": 900, "kamera": 800, "dynamik-i-mikrofon": 750, "korpus": 1000, "knopky-y-vibro": 700 },
  "iphone-6-6-plus": { "zamina-ekrana": { analog: 800, original: 1300 }, "akumuliator": 800, "roziem-zariadzhannia": 900, "kamera": 800, "dynamik-i-mikrofon": 750, "korpus": 1000, "knopky-y-vibro": 700 },

  // ─── iPad ───
  "ipad-pro-13-m4": { "zamina-ekrana": 6900, "akumuliator": 2600, "roziem-zariadzhannia": 1800 },
  "ipad-pro-11-m1": { "zamina-ekrana": 4900, "akumuliator": 2200, "roziem-zariadzhannia": 1600 },
  "ipad-pro-11-2020": { "zamina-ekrana": 4200, "akumuliator": 2000, "roziem-zariadzhannia": 1500 },
  "ipad-pro-11-2018": { "zamina-ekrana": 3900, "akumuliator": 1900, "roziem-zariadzhannia": 1500 },
  "ipad-pro-12-9-2020": { "zamina-ekrana": 5900, "akumuliator": 2400, "roziem-zariadzhannia": 1600 },
  "ipad-pro-12-9-2018": { "zamina-ekrana": 5400, "akumuliator": 2300, "roziem-zariadzhannia": 1600 },
  "ipad-pro-12-9-2017": { "zamina-ekrana": 4900, "akumuliator": 2200, "roziem-zariadzhannia": 1500 },
  "ipad-pro-12-9-2015": { "zamina-ekrana": 4200, "akumuliator": 2000, "roziem-zariadzhannia": 1400 },
  "ipad-pro-10-5": { "zamina-ekrana": 3400, "akumuliator": 1800, "roziem-zariadzhannia": 1400 },
  "ipad-pro-9-7": { "zamina-ekrana": 2900, "akumuliator": 1700, "roziem-zariadzhannia": 1300 },
  "ipad-air-5": { "zamina-ekrana": 3200, "akumuliator": 1900, "roziem-zariadzhannia": 1500 },
  "ipad-air-4": { "zamina-ekrana": 2900, "akumuliator": 1800, "roziem-zariadzhannia": 1400 },
  "ipad-air-3": { "zamina-ekrana": 2400, "akumuliator": 1600, "roziem-zariadzhannia": 1300 },
  "ipad-10": { "zamina-ekrana": 2400, "akumuliator": 1600, "roziem-zariadzhannia": 1300 },
  "ipad-9": { "zamina-ekrana": 1900, "akumuliator": 1400, "roziem-zariadzhannia": 1200 },
  "ipad-8": { "zamina-ekrana": 1800, "akumuliator": 1400, "roziem-zariadzhannia": 1200 },
  "ipad-7": { "zamina-ekrana": 1700, "akumuliator": 1300, "roziem-zariadzhannia": 1200 },
  "ipad-6": { "zamina-ekrana": 1500, "akumuliator": 1300, "roziem-zariadzhannia": 1100 },
  "ipad-5": { "zamina-ekrana": 1400, "akumuliator": 1200, "roziem-zariadzhannia": 1100 },
  "ipad-mini-6": { "zamina-ekrana": 3200, "akumuliator": 1800, "roziem-zariadzhannia": 1400 },
  "ipad-mini-5": { "zamina-ekrana": 2200, "akumuliator": 1500, "roziem-zariadzhannia": 1200 },
  "ipad-mini-4": { "zamina-ekrana": 1900, "akumuliator": 1400, "roziem-zariadzhannia": 1200 },

  // ─── Apple Watch ───
  "apple-watch-ultra": { "zamina-ekrana": 4900, "akumuliator": 2200 },
  "apple-watch-s9": { "zamina-ekrana": 3400, "akumuliator": 1700 },
  "apple-watch-s8": { "zamina-ekrana": 2900, "akumuliator": 1600 },
  "apple-watch-se": { "zamina-ekrana": 2400, "akumuliator": 1400 },
  "apple-watch-s7": { "zamina-ekrana": 2700, "akumuliator": 1600 },
  "apple-watch-s5": { "zamina-ekrana": 1900, "akumuliator": 1300 },
  "apple-watch-s4": { "zamina-ekrana": 1800, "akumuliator": 1300 },
  "apple-watch-s3": { "zamina-ekrana": 1400, "akumuliator": 1100 },
  "apple-watch-s2": { "zamina-ekrana": 1300, "akumuliator": 1000 },
  "apple-watch-s1": { "zamina-ekrana": 1200, "akumuliator": 1000 },
};

/**
 * Роботи на платі: ціна залежить від того, що покаже діагностика, а не від
 * моделі. Тому показуємо «від» — і лише після безкоштовної діагностики
 * називаємо точну суму.
 */
export const boardPrices: { slug: string; from: Money }[] = [
  { slug: "zalyv-vodoiu", from: 900 },
  { slug: "ne-vmykaietsia", from: 1200 },
  { slug: "ne-bachyt-merezhu", from: 1500 },
  { slug: "vidnovlennia-danykh", from: 1800 },
];

/** Фіксовані ціни, однакові для всіх моделей */
export const flatPrices: { slug: string; price: Money }[] = [
  { slug: "profilaktyka", price: 600 },
];

export function getModelPrice(slug: string): ModelPrice | undefined {
  return modelPrices[slug];
}

/** Нижня межа ціни роботи — «від» у зведеній таблиці на сторінці послуг */
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

/** 3400 → «3 400 ₴» — нерозривний пробіл, щоб сума не ламалась на два рядки */
export function uah(value: Money): string {
  return `${value.toLocaleString("uk-UA").replace(/\s/g, "\u202f")}\u202f₴`;
}
