import { expect, test } from "@playwright/test";

/**
 * Кожна публічна сторінка відкривається, має заголовок і h1, не сиплe
 * помилками в консоль і не дає горизонтальної прокрутки на телефоні.
 */

const PAGES = [
  "/",
  "/poslugy",
  "/poslugy/zamina-ekrana",
  "/modeli",
  "/modeli/iphone-16-pro-max",
  "/android",
  "/planshety",
  "/godynnyky",
  "/poshtoyu",
  "/personalni-dani",
  "/vhid",
];

for (const path of PAGES) {
  test(`сторінка ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));

    const res = await page.goto(path, { waitUntil: "networkidle" });
    expect(res?.status()).toBe(200);

    await expect(page).toHaveTitle(/\S/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);

    const a11y = await page.evaluate(() => {
      const ids = new Map<string, number>();
      document.querySelectorAll("[id]").forEach((e) => ids.set(e.id, (ids.get(e.id) ?? 0) + 1));
      return {
        dupIds: [...ids].filter(([, n]) => n > 1).map(([id]) => id),
        // Видимі кнопки й посилання без імені для скрінрідера
        unnamed: [...document.querySelectorAll<HTMLElement>("button, a")]
          .filter((e) => e.offsetParent !== null)
          .filter((e) => !(e.innerText.trim() || e.getAttribute("aria-label") || e.querySelector("img[alt]:not([alt=''])")))
          .map((e) => e.outerHTML.slice(0, 80)),
      };
    });
    expect(a11y.dupIds, "повторювані id").toEqual([]);
    expect(a11y.unnamed, "кнопки без назви").toEqual([]);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, "горизонтальна прокрутка").toBeLessThanOrEqual(0);

    expect(errors, "помилки в консолі").toEqual([]);
  });
}

test("захисні заголовки на місці", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-frame-options"]).toBe("DENY");
  const csp = h["content-security-policy"];
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toMatch(/script-src [^;]*https:\/\/[a-z0-9.-]+\.clerk/); // домен Clerk узято з ключа
  expect(csp).not.toContain("unsafe-eval");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("індексовані сторінки мають canonical", async ({ request }) => {
  for (const path of PAGES.filter((p) => p !== "/vhid")) {
    const html = await (await request.get(path)).text();
    expect(html, path).toMatch(/<link rel="canonical"/);
  }
});

test("неіснуюча сторінка — 404", async ({ page }) => {
  const res = await page.goto("/takoi-storinky-nemaye");
  expect(res?.status()).toBe(404);
});

test("неіснуюча модель і послуга — 404", async ({ request }) => {
  expect((await request.get("/modeli/nokia-3310")).status()).toBe(404);
  expect((await request.get("/poslugy/nema-takoi")).status()).toBe(404);
});

test("кабінет без входу веде на /vhid", async ({ page }) => {
  await page.goto("/moi-remonty");
  await expect(page).toHaveURL(/\/vhid/);
});

test("адмінка без входу веде на /admin/vhid", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/vhid/);
});

test("robots.txt і sitemap.xml віддаються", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/Sitemap:/i);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("<urlset");
});
