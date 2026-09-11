// Одноразовий імпорт фото моделей з теки завантажень у public/models.
// Запуск: node scripts/import-model-photos.mjs /шлях/до/теки
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2] ?? "/Users/bohdanvoitsikhovskyi/Downloads/iphone";
const OUT = "public/models";

/**
 * slug моделі → файл. `null` означає «власного фото немає»:
 * ставимо знімок найближчої моделі покоління — вони візуально не відрізняються.
 */
const MAP = {
  // 16 — знімки без імен, розпізнані за виглядом
  "iphone-16-pro-max": "3.png",
  "iphone-16-pro": "1.png",
  "iphone-16-plus": "4.png",
  "iphone-16": "2.png",

  // 15
  "iphone-15-pro-max": "iphone_15_pro_max.png",
  "iphone-15-pro": "natural-iphone-15-pro-sku-header-120923.png",
  "iphone-15-plus": "iphone-14.png",
  "iphone-15": "iphone-14.png",

  // 14
  "iphone-14-pro-max": "natural-iphone-15-pro-sku-header-120923.png",
  "iphone-14-pro": "natural-iphone-15-pro-sku-header-120923.png",
  "iphone-14-plus": "iphone-14.png",
  "iphone-14": "iphone-14.png",

  // 13
  "iphone-13-pro-max": "iphone-13-lviv-remont.png",
  "iphone-13-pro": "iphone-13-lviv-remont.png",
  "iphone-13": "iphone12.png",
  "iphone-13-mini": "iphone12.png",

  // 12
  "iphone-12-pro-max": "iphone-12-pro-max-graphite-hero.png",
  "iphone-12-pro": "iphone-12-pro-max-graphite-hero.png",
  "iphone-12": "iphone12.png",
  "iphone-12-mini": "iphone-12-mini-green-250x250-1.png",

  // 11
  "iphone-11-pro-max": "iphone-11-pro-green-250x250-2.png",
  "iphone-11-pro": "iphone-11-pro-green-250x250-2.png",
  "iphone-11": "xr.png",

  // X
  "iphone-xs-max": "iphone-xs-max-3.png",
  "iphone-xs": "iphone-xs-2.png",
  "iphone-xr": "xr.png",
  "iphone-x": "iphone-x-2.png",

  // 8 / 7 / 6 / SE
  "iphone-8-plus": "iphone-8-plus-1.png",
  "iphone-8": "iphone_8.png",
  "iphone-7-plus": "iphone_7-plus.png",
  "iphone-7": "iphone_7-1.png",
  "iphone-se-3": "iphone-se-2020-250x250-2.png",
  "iphone-se-2": "iphone-se-2020-250x250-2.png",
  "iphone-6s-6s-plus": "iphone_6_s-1.png",
  "iphone-6-6-plus": "iphone_6.png",

  // iPad
  "ipad-pro-11-12-9": "ipad-pro-11-2021-m1.png",
  "ipad-air-3-5": "ipad-air-4-2020.png",
  "ipad-7-10": "ipad-10.2-2021.png",
  "ipad-mini-5-6": "ipad-mini-5-2019.png",

  // Watch
  "apple-watch-s4-s9": "1-2.png",
  "apple-watch-ultra": "apple-watch-ultra.png",

  // AirPods — фото немає
  "airpods-airpods-pro": null,
};

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const models = JSON.parse(
  readFileSync("src/data/models.ts", "utf8").match(
    /export const models: Model\[\] = ([\s\S]*?);\n\nexport const modelGroups/,
  )[1],
);

const done = [];
const missing = [];

for (const m of models) {
  const file = MAP[m.slug];
  if (!file) {
    missing.push(m.name);
    continue;
  }

  const from = join(SRC, file);
  if (!existsSync(from)) {
    missing.push(`${m.name} (немає файлу ${file})`);
    continue;
  }

  const to = join(OUT, `${m.slug}.png`);
  copyFileSync(from, to);

  // Приводимо до однієї висоти — картки мають виглядати рівно
  execFileSync("sips", ["--resampleHeightWidthMax", "560", "-s", "format", "png", to, "--out", to], {
    stdio: "ignore",
  });

  done.push({ slug: m.slug, name: m.name, kb: Math.round(statSync(to).size / 1024) });
}

// Оновлюємо шляхи в models.ts
let ts = readFileSync("src/data/models.ts", "utf8");
for (const d of done) {
  ts = ts.replace(
    new RegExp(`("slug": "${d.slug}"[\\s\\S]*?"image": ")[^"]*(")`),
    `$1/models/${d.slug}.png$2`,
  );
}
writeFileSync("src/data/models.ts", ts);

console.log(`Перенесено фото: ${done.length} з ${models.length}`);
console.log(`Загальна вага: ${Math.round(done.reduce((s, d) => s + d.kb, 0) / 1024 * 10) / 10} МБ\n`);
if (missing.length) {
  console.log("Без власного фото:");
  for (const m of missing) console.log(`  · ${m}`);
}
