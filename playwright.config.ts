import { defineConfig, devices } from "@playwright/test";

/**
 * E2E проти продакшн-збірки (`next build && next start`), а не dev-сервера:
 * так ловимо саме те, що поїде на Vercel.
 *
 * Сторінки читають базу з .env.local, але жоден тест у неї не пише: запити
 * форм (/api/lead, /api/orders) перехоплюються в самому браузері.
 */
const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
