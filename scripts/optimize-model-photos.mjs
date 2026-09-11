// Стискає фото моделей у WebP зі збереженням прозорості.
// Запуск: node scripts/optimize-model-photos.mjs
import sharp from "sharp";
import { readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "public/models";
const files = readdirSync(DIR).filter((f) => f.endsWith(".png"));

let before = 0;
let after = 0;

/** Частина знімків прийшла на білому тлі — робимо його прозорим */
async function dropWhiteBackground(input) {
  const img = sharp(input).ensureAlpha();
  const { width, height } = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });

  const corner = (x, y) => data[(y * width + x) * 4 + 3];
  const opaqueCorners = [corner(1, 1), corner(width - 2, 1), corner(1, height - 2)].every((a) => a > 200);
  if (!opaqueCorners) return null;

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const grey = Math.max(r, g, b) - Math.min(r, g, b) < 12;
    if (r > 245 && g > 245 && b > 245 && grey) data[i + 3] = 0;
  }

  return sharp(data, { raw: { width, height, channels: 4 } });
}

let cleaned = 0;

for (const f of files) {
  const from = join(DIR, f);
  const to = from.replace(/\.png$/, ".webp");

  before += statSync(from).size;

  const withoutBg = await dropWhiteBackground(from);
  if (withoutBg) cleaned++;

  await (withoutBg ?? sharp(from))
    .resize({ height: 500, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(to);

  after += statSync(to).size;
  unlinkSync(from);
}

// Перемикаємо шляхи в даних на .webp
const path = "src/data/models.ts";
writeFileSync(path, readFileSync(path, "utf8").replaceAll(".png\"", ".webp\""));

const mb = (n) => Math.round((n / 1024 / 1024) * 10) / 10;
console.log(`Оптимізовано: ${files.length} файлів`);
console.log(`Було ${mb(before)} МБ → стало ${mb(after)} МБ`);
if (cleaned) console.log(`Прибрано біле тло: ${cleaned}`);
