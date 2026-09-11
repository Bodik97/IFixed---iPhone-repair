// Готує геройський знімок «розібраного телефона» так, щоб він не читався як
// картка з рамкою.
//
// Ключувати фон за яскравістю не вийшло: темна підкладка рендера (20–45) і
// темні частини корпусу телефона потрапляють в один діапазон — або лишається
// прямокутник, або телефон стає привидом. Тому середину лишаємо цілою, а краї
// розчиняємо в альфу: на темному тлі сторінки межа кадру зникає.

import sharp from "sharp";

const SRC = process.argv[2];
const OUT = process.argv[3];

const FEATHER = 0.16; // частка сторони, на якій знімок сходить нанівець

const { data: rgb, info } = await sharp(SRC)
  .resize({ width: 1200, withoutEnlargement: true })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height } = info;
const n = width * height;

const fx = width * FEATHER;
const fy = height * FEATHER;

// smoothstep, щоб перехід не мав видимого зламу
const ramp = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

const rgba = Buffer.alloc(n * 4);
for (let y = 0; y < height; y++) {
  const ey = ramp(Math.min(y, height - 1 - y) / fy);
  for (let x = 0; x < width; x++) {
    const ex = ramp(Math.min(x, width - 1 - x) / fx);
    const i = y * width + x;
    rgba[i * 4] = rgb[i * 3];
    rgba[i * 4 + 1] = rgb[i * 3 + 1];
    rgba[i * 4 + 2] = rgb[i * 3 + 2];
    rgba[i * 4 + 3] = Math.round(255 * ex * ey);
  }
}

await sharp(rgba, { raw: { width, height, channels: 4 } })
  .webp({ quality: 80, alphaQuality: 92, effort: 6 })
  .toFile(OUT);

console.log(`${OUT} ${width}×${height}`);
