// Фото планшетів і годинників → public/models.
// Запуск: node scripts/import-device-photos.mjs [шлях]
import { copyFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2] ?? "/Users/bohdanvoitsikhovskyi/Downloads/iphone";
const OUT = "public/models";

const MAP = {
  // iPad Pro
  "ipad-pro-13-m4": "ipad-pro-11-2021-m1.png",
  "ipad-pro-11-m1": "ipad-pro-11-2021-m1.png",
  "ipad-pro-11-2020": "ipad-pro-11-2020.png",
  "ipad-pro-11-2018": "ipad-pro-11-2018.png",
  "ipad-pro-12-9-2020": "ipad-pro-12.9-2020.png",
  "ipad-pro-12-9-2018": "ipad-pro-12.9-2018.png",
  "ipad-pro-12-9-2017": "ipad-12.9-2017.png",
  "ipad-pro-12-9-2015": "pro-12.9-2015.png",
  "ipad-pro-10-5": "ipad-pro-10.5-1.png",
  "ipad-pro-9-7": "ipad-pro-9.7-1.png",

  // iPad Air
  "ipad-air-5": "air.png",
  "ipad-air-4": "ipad-air-4-2020.png",
  "ipad-air-3": "ipad-air-3-2019.png",

  // iPad
  "ipad-10": "ipad-10.9-2022.png",
  "ipad-9": "ipad-10.2-2021.png",
  "ipad-8": "ipad-10.2-2020.png",
  "ipad-7": "ipad-10.2-2019.png",
  "ipad-6": "ipad-2018-1.png",
  "ipad-5": "ipad-2017-1.png",

  // iPad mini
  "ipad-mini-6": "ipad-mini-5-2019.png",
  "ipad-mini-5": "ipad-mini-5-2019.png",
  "ipad-mini-4": "mini-4.png",

  // Apple Watch
  "apple-watch-ultra": "apple-watch-ultra.png",
  "apple-watch-s9": "1-2.png",
  "apple-watch-s8": "series-8.png",
  "apple-watch-se": "series-se-2022.png",
  "apple-watch-s7": "series-7.png",
  "apple-watch-s5": "s5-1.png",
  "apple-watch-s4": "s4-1.png",
  "apple-watch-s3": "s3-1.png",
  "apple-watch-s2": "s2-1.png",
  "apple-watch-s1": "s1-1.png",
};

let copied = 0;
const missing = [];

for (const [slug, file] of Object.entries(MAP)) {
  const from = join(SRC, file);
  if (!existsSync(from)) {
    missing.push(`${slug} ← ${file}`);
    continue;
  }
  copyFileSync(from, join(OUT, `${slug}.png`));
  copied++;
}

console.log(`Скопійовано: ${copied} з ${Object.keys(MAP).length}`);
if (missing.length) {
  console.log("Не знайдено:");
  for (const m of missing) console.log("  · " + m);
}
