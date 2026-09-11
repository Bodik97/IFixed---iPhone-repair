// Одноразовий витяг послуг із макета design/iFix-Services.dc.html у src/data/services.ts
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("design/iFix-Services.dc.html", "utf8");
const start = html.indexOf("all = [");
const body = html.slice(start, html.indexOf("\n  ];", start) + 4);
const rows = eval(body.replace("all =", ""));

const slugs = {
  "Заміна екрана": "zamina-ekrana",
  "Акумулятор": "akumuliator",
  "Роз'єм заряджання": "roziem-zariadzhannia",
  "Камера і скло камери": "kamera",
  "Залив водою": "zalyv-vodoiu",
  "Не вмикається": "ne-vmykaietsia",
  "Не бачить мережу": "ne-bachyt-merezhu",
  "Динамік і мікрофон": "dynamik-i-mikrofon",
  "Корпус і задня кришка": "korpus",
  "Кнопки й вібро": "knopky-y-vibro",
  "Відновлення даних": "vidnovlennia-danykh",
  "Профілактика": "profilaktyka",
};

const services = rows.map((s) => {
  const slug = slugs[s.title];
  if (!slug) throw new Error("Немає slug для послуги: " + s.title);
  return { no: s.no, slug, cat: s.cat, title: s.title, body: s.body, tags: s.tags, time: s.time, icon: s.icon.__html };
});

const out = `// Згенеровано з design/iFix-Services.dc.html — scripts/extract-services.mjs

export type ServiceCat = "quick" | "board" | "body";

export type Service = {
  no: string;
  slug: string;
  cat: ServiceCat;
  title: string;
  body: string;
  tags: string[];
  time: string;
  /** Вміст <svg viewBox="0 0 24 24"> — обведення, без заливки */
  icon: string;
};

export const services: Service[] = ${JSON.stringify(services, null, 2)};

export const serviceCats: { id: ServiceCat | "all"; label: string }[] = [
  { id: "all", label: "Усі" },
  { id: "quick", label: "Швидкі при вас" },
  { id: "board", label: "Плата й вода" },
  { id: "body", label: "Корпус" },
];
`;

writeFileSync("src/data/services.ts", out);
console.log(`${services.length} послуг →  src/data/services.ts`);
services.forEach((s) => console.log(`${s.no}  ${s.slug.padEnd(24)} ${s.cat.padEnd(6)} ${s.title}`));
