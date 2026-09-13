// Прайс по моделях, у гривнях, «під ключ»: робота разом із деталлю.
//
// Звідки числа. Зведено з відкритих прайсів конкурентів (вересень 2026):
//   · RobimGood, Київ    — 11, 11 Pro, 12, 12 Pro, 13, 14 Pro, 15, 16 Pro Max
//   · Технарі, Київ      — екрани 6 → XS Max (їхні ціни на 11 Pro — викид, не брали)
//   · AppLab, Київ/Львів — повний розклад по XR
//   · AppleFix           — акумулятори iPad
//   · sklorepair         — вилки по Apple Watch
//
// Рівень цін — приблизно на 10% нижче київського: у Львові дешевша оренда й
// зарплати. Нижче не опускались свідомо — у iFix є кабінет, хроніка ремонту
// й гарантія, яких у конкурентів немає, і демпінг цю перевагу знецінює.
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
  "iphone-16-pro-max": { "zamina-ekrana": { analog: 9300, original: 17000 }, "akumuliator": 4000, "roziem-zariadzhannia": 4200, "kamera": 5000, "dynamik-i-mikrofon": 1500, "korpus": 5700, "knopky-y-vibro": 1300 },
  "iphone-16-pro": { "zamina-ekrana": { analog: 8800, original: 15000 }, "akumuliator": 3900, "roziem-zariadzhannia": 4100, "kamera": 4800, "dynamik-i-mikrofon": 1500, "korpus": 5400, "knopky-y-vibro": 1300 },
  "iphone-16-plus": { "zamina-ekrana": { analog: 8000, original: 12500 }, "akumuliator": 3700, "roziem-zariadzhannia": 4000, "kamera": 4400, "dynamik-i-mikrofon": 1400, "korpus": 5100, "knopky-y-vibro": 1250 },
  "iphone-16": { "zamina-ekrana": { analog: 7500, original: 11500 }, "akumuliator": 3600, "roziem-zariadzhannia": 4000, "kamera": 4200, "dynamik-i-mikrofon": 1400, "korpus": 4900, "knopky-y-vibro": 1250 },
  "iphone-15-pro-max": { "zamina-ekrana": { analog: 7200, original: 11500 }, "akumuliator": 3700, "roziem-zariadzhannia": 4100, "kamera": 5900, "dynamik-i-mikrofon": 1400, "korpus": 5500, "knopky-y-vibro": 1250 },
  "iphone-15-pro": { "zamina-ekrana": { analog: 6800, original: 10800 }, "akumuliator": 3600, "roziem-zariadzhannia": 4000, "kamera": 5600, "dynamik-i-mikrofon": 1400, "korpus": 5300, "knopky-y-vibro": 1250 },
  "iphone-15-plus": { "zamina-ekrana": { analog: 6600, original: 9800 }, "akumuliator": 3500, "roziem-zariadzhannia": 4000, "kamera": 5600, "dynamik-i-mikrofon": 1350, "korpus": 5100, "knopky-y-vibro": 1200 },
  "iphone-15": { "zamina-ekrana": { analog: 6300, original: 9400 }, "akumuliator": 3500, "roziem-zariadzhannia": 4000, "kamera": 5400, "dynamik-i-mikrofon": 1350, "korpus": 5000, "knopky-y-vibro": 1200 },
  "iphone-14-pro-max": { "zamina-ekrana": { analog: 7800, original: 10200 }, "akumuliator": 3200, "roziem-zariadzhannia": 4200, "kamera": 4800, "dynamik-i-mikrofon": 1350, "korpus": 3200, "knopky-y-vibro": 1200 },
  "iphone-14-pro": { "zamina-ekrana": { analog: 7500, original: 9500 }, "akumuliator": 3100, "roziem-zariadzhannia": 4000, "kamera": 4500, "dynamik-i-mikrofon": 1350, "korpus": 2700, "knopky-y-vibro": 1200 },
  "iphone-14-plus": { "zamina-ekrana": { analog: 5200, original: 6800 }, "akumuliator": 3000, "roziem-zariadzhannia": 3600, "kamera": 3900, "dynamik-i-mikrofon": 1300, "korpus": 2400, "knopky-y-vibro": 1150 },
  "iphone-14": { "zamina-ekrana": { analog: 4900, original: 6400 }, "akumuliator": 2900, "roziem-zariadzhannia": 3500, "kamera": 3800, "dynamik-i-mikrofon": 1300, "korpus": 2200, "knopky-y-vibro": 1150 },
  "iphone-13-pro-max": { "zamina-ekrana": { analog: 4600, original: 5900 }, "akumuliator": 2500, "roziem-zariadzhannia": 2600, "kamera": 4000, "dynamik-i-mikrofon": 1300, "korpus": 2100, "knopky-y-vibro": 1100 },
  "iphone-13-pro": { "zamina-ekrana": { analog: 4200, original: 5400 }, "akumuliator": 2400, "roziem-zariadzhannia": 2500, "kamera": 3800, "dynamik-i-mikrofon": 1300, "korpus": 2000, "knopky-y-vibro": 1100 },
  "iphone-13": { "zamina-ekrana": { analog: 3900, original: 5000 }, "akumuliator": 2300, "roziem-zariadzhannia": 2200, "kamera": 3500, "dynamik-i-mikrofon": 1250, "korpus": 1800, "knopky-y-vibro": 1100 },
  "iphone-13-mini": { "zamina-ekrana": { analog: 3700, original: 4800 }, "akumuliator": 2200, "roziem-zariadzhannia": 2200, "kamera": 3400, "dynamik-i-mikrofon": 1250, "korpus": 1750, "knopky-y-vibro": 1050 },
  "iphone-12-pro-max": { "zamina-ekrana": { analog: 3700, original: 5400 }, "akumuliator": 2400, "roziem-zariadzhannia": 2100, "kamera": 4100, "dynamik-i-mikrofon": 1150, "korpus": 2100, "knopky-y-vibro": 1050 },
  "iphone-12-pro": { "zamina-ekrana": { analog: 3200, original: 4600 }, "akumuliator": 2300, "roziem-zariadzhannia": 2000, "kamera": 3900, "dynamik-i-mikrofon": 1100, "korpus": 2000, "knopky-y-vibro": 1050 },
  "iphone-12": { "zamina-ekrana": { analog: 3200, original: 4600 }, "akumuliator": 2300, "roziem-zariadzhannia": 2000, "kamera": 3500, "dynamik-i-mikrofon": 1100, "korpus": 1800, "knopky-y-vibro": 1000 },
  "iphone-12-mini": { "zamina-ekrana": { analog: 3000, original: 4300 }, "akumuliator": 2200, "roziem-zariadzhannia": 2000, "kamera": 3400, "dynamik-i-mikrofon": 1100, "korpus": 1700, "knopky-y-vibro": 1000 },
  "iphone-11-pro-max": { "zamina-ekrana": { analog: 2400, original: 3700 }, "akumuliator": 1800, "roziem-zariadzhannia": 2400, "kamera": 3300, "dynamik-i-mikrofon": 1050, "korpus": 1450, "knopky-y-vibro": 1000 },
  "iphone-11-pro": { "zamina-ekrana": { analog: 2100, original: 3200 }, "akumuliator": 1700, "roziem-zariadzhannia": 2300, "kamera": 3100, "dynamik-i-mikrofon": 1050, "korpus": 1350, "knopky-y-vibro": 1000 },
  "iphone-11": { "zamina-ekrana": { analog: 1500, original: 2200 }, "akumuliator": 1600, "roziem-zariadzhannia": 1500, "kamera": 2600, "dynamik-i-mikrofon": 1000, "korpus": 1200, "knopky-y-vibro": 950 },
  "iphone-xs-max": { "zamina-ekrana": { analog: 2900, original: 4800 }, "akumuliator": 1400, "roziem-zariadzhannia": 1300, "kamera": 1900, "dynamik-i-mikrofon": 1000, "korpus": 1100, "knopky-y-vibro": 900 },
  "iphone-xs": { "zamina-ekrana": { analog: 2300, original: 3600 }, "akumuliator": 1300, "roziem-zariadzhannia": 1200, "kamera": 1800, "dynamik-i-mikrofon": 950, "korpus": 1000, "knopky-y-vibro": 900 },
  "iphone-xr": { "zamina-ekrana": { analog: 1700, original: 2100 }, "akumuliator": 1000, "roziem-zariadzhannia": 1000, "kamera": 1600, "dynamik-i-mikrofon": 900, "korpus": 850, "knopky-y-vibro": 850 },
  "iphone-x": { "zamina-ekrana": { analog: 2250, original: 3500 }, "akumuliator": 1200, "roziem-zariadzhannia": 1200, "kamera": 1700, "dynamik-i-mikrofon": 950, "korpus": 1000, "knopky-y-vibro": 850 },
  "iphone-8-plus": { "zamina-ekrana": { analog: 1000, original: 1700 }, "akumuliator": 1000, "roziem-zariadzhannia": 1000, "kamera": 1200, "dynamik-i-mikrofon": 900, "korpus": 850, "knopky-y-vibro": 800 },
  "iphone-8": { "zamina-ekrana": { analog: 850, original: 1450 }, "akumuliator": 950, "roziem-zariadzhannia": 1000, "kamera": 1100, "dynamik-i-mikrofon": 900, "korpus": 800, "knopky-y-vibro": 800 },
  "iphone-7-plus": { "zamina-ekrana": { analog: 900, original: 1550 }, "akumuliator": 900, "roziem-zariadzhannia": 950, "kamera": 1100, "dynamik-i-mikrofon": 850, "korpus": 800, "knopky-y-vibro": 750 },
  "iphone-7": { "zamina-ekrana": { analog: 850, original: 1150 }, "akumuliator": 900, "roziem-zariadzhannia": 950, "kamera": 1000, "dynamik-i-mikrofon": 850, "korpus": 750, "knopky-y-vibro": 750 },
  "iphone-se-3": { "zamina-ekrana": { analog: 1050, original: 1650 }, "akumuliator": 1000, "roziem-zariadzhannia": 1000, "kamera": 1100, "dynamik-i-mikrofon": 900, "korpus": 800, "knopky-y-vibro": 800 },
  "iphone-se-2": { "zamina-ekrana": { analog: 950, original: 1500 }, "akumuliator": 950, "roziem-zariadzhannia": 1000, "kamera": 1000, "dynamik-i-mikrofon": 900, "korpus": 750, "knopky-y-vibro": 800 },
  "iphone-6s-6s-plus": { "zamina-ekrana": { analog: 800, original: 1150 }, "akumuliator": 900, "roziem-zariadzhannia": 900, "kamera": 900, "dynamik-i-mikrofon": 800, "korpus": 700, "knopky-y-vibro": 700 },
  "iphone-6-6-plus": { "zamina-ekrana": { analog: 750, original: 1100 }, "akumuliator": 900, "roziem-zariadzhannia": 900, "kamera": 900, "dynamik-i-mikrofon": 800, "korpus": 700, "knopky-y-vibro": 700 },

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

/** 3400 → «3 400 ₴» — нерозривний пробіл, щоб сума не ламалась на два рядки */
export function uah(value: Money): string {
  return `${value.toLocaleString("uk-UA").replace(/\s/g, "\u202f")}\u202f₴`;
}
