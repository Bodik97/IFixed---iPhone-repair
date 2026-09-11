// Переводить фонові знімки в WebP і оновлює посилання в коді.
// Запуск: node scripts/convert-assets-to-webp.mjs
import sharp from "sharp";
import { readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "public/assets";
const files = readdirSync(DIR).filter((f) => /\.(jpe?g|png)$/i.test(f));

let before = 0;
let after = 0;

for (const f of files) {
  const from = join(DIR, f);
  const to = from.replace(/\.(jpe?g|png)$/i, ".webp");

  before += statSync(from).size;
  await sharp(from).webp({ quality: 80, effort: 6 }).toFile(to);
  after += statSync(to).size;

  unlinkSync(from);
}

// Посилання на .jpeg у стилях і даних
const sources = [
  "src/app/page.module.css",
  "src/app/poslugy/page.module.css",
  "src/app/modeli/page.module.css",
  "src/app/poshtoyu/page.module.css",
  "src/app/modeli/[slug]/page.module.css",
  "src/app/kabinet/page.module.css",
  "src/app/vhid/page.module.css",
  "src/data/landing.ts",
  "src/data/mailIn.ts",
  "src/data/models.ts",
];

let touched = 0;
for (const path of sources) {
  try {
    const text = readFileSync(path, "utf8");
    const next = text.replace(/(\/assets\/[a-z0-9-]+)\.jpe?g/gi, "$1.webp");
    if (next !== text) {
      writeFileSync(path, next);
      touched++;
    }
  } catch {
    // файлу може не бути — пропускаємо
  }
}

const kb = (n) => Math.round(n / 1024);
console.log(`Конвертовано: ${files.length} файлів`);
console.log(`Було ${kb(before)} КБ → стало ${kb(after)} КБ`);
console.log(`Оновлено посилань у файлах: ${touched}`);
