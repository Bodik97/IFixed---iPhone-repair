// Планшети й годинники — розгорнуті поколіннями, з фото на кожну модель.
// iPhone лишається в models.ts (перенесений з макета каталогу).

import type { Model } from "./models";

/** Поля, однакові для всіх записів розділу */
const pad = (m: Omit<Model, "group" | "image"> & { image?: string }): Model => ({
  ...m,
  group: "other",
  image: m.image ?? `/models/${m.slug}.webp`,
});

export const ipads: Model[] = [
  pad({ slug: "ipad-pro-13-m4", name: "iPad Pro 13″ M4", year: "2024", jobs: ["Скло", "АКБ", "Роз'єм"], time: "1–2 дні", inStock: false }),
  pad({ slug: "ipad-pro-11-m1", name: "iPad Pro 11″ M1", year: "2021", jobs: ["Скло", "АКБ", "Роз'єм"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-pro-11-2020", name: "iPad Pro 11″", year: "2020", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-pro-11-2018", name: "iPad Pro 11″", year: "2018", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-pro-12-9-2020", name: "iPad Pro 12.9″", year: "2020", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-pro-12-9-2018", name: "iPad Pro 12.9″", year: "2018", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-pro-12-9-2017", name: "iPad Pro 12.9″", year: "2017", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: false }),
  pad({ slug: "ipad-pro-12-9-2015", name: "iPad Pro 12.9″", year: "2015", jobs: ["Скло", "АКБ"], time: "2–3 дні", inStock: false }),
  pad({ slug: "ipad-pro-10-5", name: "iPad Pro 10.5″", year: "2017", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-pro-9-7", name: "iPad Pro 9.7″", year: "2016", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: false }),

  pad({ slug: "ipad-air-5", name: "iPad Air 5", year: "2022", jobs: ["Скло", "АКБ", "Роз'єм"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-air-4", name: "iPad Air 4", year: "2020", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-air-3", name: "iPad Air 3", year: "2019", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),

  pad({ slug: "ipad-10", name: "iPad 10", year: "2022", jobs: ["Скло", "АКБ", "Роз'єм"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-9", name: "iPad 9", year: "2021", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-8", name: "iPad 8", year: "2020", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-7", name: "iPad 7", year: "2019", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-6", name: "iPad 6", year: "2018", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-5", name: "iPad 5", year: "2017", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: false }),

  pad({ slug: "ipad-mini-6", name: "iPad mini 6", year: "2021", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-mini-5", name: "iPad mini 5", year: "2019", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "ipad-mini-4", name: "iPad mini 4", year: "2015", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: false }),
];

export const watches: Model[] = [
  pad({ slug: "apple-watch-ultra", name: "Apple Watch Ultra", year: "2022–2024", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: false }),
  pad({ slug: "apple-watch-s9", name: "Apple Watch Series 9", year: "2023", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "apple-watch-s8", name: "Apple Watch Series 8", year: "2022", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "apple-watch-se", name: "Apple Watch SE", year: "2022", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "apple-watch-s7", name: "Apple Watch Series 7", year: "2021", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "apple-watch-s5", name: "Apple Watch Series 5", year: "2019", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "apple-watch-s4", name: "Apple Watch Series 4", year: "2018", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: true }),
  pad({ slug: "apple-watch-s3", name: "Apple Watch Series 3", year: "2017", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: false }),
  pad({ slug: "apple-watch-s2", name: "Apple Watch Series 2", year: "2016", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: false }),
  pad({ slug: "apple-watch-s1", name: "Apple Watch Series 1", year: "2015", jobs: ["Скло", "АКБ"], time: "1–2 дні", inStock: false }),

  pad({
    slug: "airpods-airpods-pro",
    name: "AirPods / AirPods Pro",
    year: "усі покоління",
    jobs: ["Діагностика", "Чистка"],
    time: "того ж дня",
    inStock: true,
    image: "",
  }),
];
