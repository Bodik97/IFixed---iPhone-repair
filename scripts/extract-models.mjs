// Одноразовий витяг моделей із макета design/iFix-Catalog-iPhone.dc.html у src/data/models.ts
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("design/iFix-Catalog-iPhone.dc.html", "utf8");
const body = html.slice(html.indexOf("models = ["), html.indexOf("];", html.indexOf("models = [")) + 2);
const rows = eval(body.replace("models =", ""));

const translit = { а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia" };

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[а-яґєії]/g, (c) => translit[c] ?? "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const photos = ["/assets/bg-phone-a.jpeg", "/assets/bg-phone-b.jpeg", "/assets/bg-tech.jpeg", "/assets/bg-circuit.jpeg"];

const models = rows.map(([name, year, group, jobs, time, inStock], i) => ({
  slug: slugify(name),
  name,
  year,
  group,
  jobs,
  time,
  inStock: Boolean(inStock),
  image: photos[i % photos.length],
}));

const dupes = models.map((m) => m.slug).filter((s, i, a) => a.indexOf(s) !== i);
if (dupes.length) throw new Error("Дублікати slug: " + dupes.join(", "));

const out = `// Згенеровано з design/iFix-Catalog-iPhone.dc.html — scripts/extract-models.mjs

export type ModelGroup = "new" | "popular" | "old" | "other";

export type Model = {
  slug: string;
  name: string;
  year: string;
  group: ModelGroup;
  jobs: string[];
  time: string;
  inStock: boolean;
  image: string;
};

export const models: Model[] = ${JSON.stringify(models, null, 2)};

export const modelGroups: { id: ModelGroup | "all"; label: string }[] = [
  { id: "all", label: "Усі" },
  { id: "new", label: "Нові" },
  { id: "popular", label: "Популярні" },
  { id: "old", label: "Старші" },
  { id: "other", label: "iPad · Watch" },
];

export const getModel = (slug: string) => models.find((m) => m.slug === slug);
`;

writeFileSync("src/data/models.ts", out);
console.log(`${models.length} моделей →  src/data/models.ts`);
console.log(models.slice(0, 3).map((m) => `${m.slug}  ←  ${m.name}`).join("\n"));
console.log("...");
console.log(models.slice(-3).map((m) => `${m.slug}  ←  ${m.name}`).join("\n"));
