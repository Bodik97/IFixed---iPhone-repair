// Вирівнює поля навколо пристрою на фото моделей.
//
// Частина знімків прийшла обрізаною впритул до краю кадру — у картці каталогу
// пристрій виглядав так, ніби не поміщається. Обрізаємо прозорі поля до
// силуету і додаємо однакові 8% з кожного боку. Пікселі самого пристрою не
// масштабуються, тож якість не страждає; скрипт ідемпотентний — поля щоразу
// рахуються від силуету.
//
// Запуск: node scripts/pad-model-photos.mjs

import sharp from "sharp";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIR = "public/models";
const MARGIN = 0.08; // частка сторони кадру з кожного боку
const ALPHA = 40; // нижче — вважаємо пікселі фоном

/** Прямокутник силуету за альфою */
function bounds(data, width, height) {
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > ALPHA) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

let changed = 0;
let clipped = 0;
const files = readdirSync(DIR).filter((f) => f.endsWith(".webp"));

for (const f of files) {
  const path = join(DIR, f);
  const src = sharp(path).ensureAlpha();
  const { data, info } = await src.raw().toBuffer({ resolveWithObject: true });
  const box = bounds(data, info.width, info.height);
  if (!box) continue;

  // Пристрій, зрізаний ще у вихідному кадрі, полями не врятуєш — лише позначаємо
  if (box.x0 === 0 || box.y0 === 0 || box.x0 + box.w === info.width || box.y0 + box.h === info.height) {
    clipped++;
  }

  const pad = Math.round((box.w / (1 - 2 * MARGIN) - box.w) / 2);
  const padY = Math.round((box.h / (1 - 2 * MARGIN) - box.h) / 2);

  const subject = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract({ left: box.x0, top: box.y0, width: box.w, height: box.h })
    .png()
    .toBuffer();

  const before = statSync(path).size;
  const out = await sharp(subject)
    .extend({
      top: padY,
      bottom: padY,
      left: pad,
      right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 82, effort: 6 })
    .toBuffer();

  await sharp(out).toFile(path);
  changed++;
  console.log(`${f} ${info.width}×${info.height} → ${box.w + pad * 2}×${box.h + padY * 2} (${before} → ${out.length} Б)`);
}

console.log(`\nОброблено: ${changed} з ${files.length}`);
console.log(`Зрізані ще у вихідному кадрі: ${clipped} — поля не відновлять втрачене`);
