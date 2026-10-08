/**
 * Тексти з контрастом нижче за WCAG AA (4.5:1; великий текст — 3:1).
 *
 * Тло — накладені одне на одне непрозорі кольори предків аж до body. Якщо
 * серед предків є фонове зображення (банер із фото), елемент пропускаємо:
 * колір під текстом там визначає картинка, а не CSS.
 *
 * Декоративне (aria-hidden) пропускаємо: його зміст уже переданий інакше,
 * наприклад, згаслі зірочки рейтингу — оцінкою в aria-label.
 *
 * Виконується в браузері: page.evaluate(lowContrastTexts).
 */
export function lowContrastTexts(): string[] {
  type Rgba = { r: number; g: number; b: number; a: number };

  const parse = (c: string): Rgba | null => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };

  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (c: Rgba) => 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);

  const over = (top: Rgba, bottom: Rgba): Rgba => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });

  const backgroundOf = (el: Element): Rgba | null => {
    const layers: Rgba[] = [];
    for (let n: Element | null = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
    }
    let out = parse(getComputedStyle(document.body).backgroundColor) ?? { r: 255, g: 255, b: 255, a: 1 };
    for (const layer of layers.reverse()) out = over(layer, out);
    return out;
  };

  const bad = new Set<string>();
  for (const el of document.querySelectorAll("body *")) {
    const text = [...el.childNodes]
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() ?? "")
      .join(" ")
      .trim();
    if (!text) continue;

    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    if (el.closest('[aria-hidden="true"]')) continue;

    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;

    const color = parse(cs.color);
    const bg = backgroundOf(el);
    if (!color || !bg) continue;

    const fg = over(color, bg);
    const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
    const ratio = (hi + 0.05) / (lo + 0.05);

    const size = parseFloat(cs.fontSize);
    const bold = Number(cs.fontWeight) >= 600;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;

    if (ratio < need) bad.add(`${ratio.toFixed(2)} < ${need} · «${text.slice(0, 40)}» · ${el.className.toString().slice(0, 50)}`);
  }
  return [...bad];
}
