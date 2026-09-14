import "server-only";

/**
 * Базова адреса сайту для sitemap, robots і OG-розмітки.
 *
 * Жодного домену в коді не зашито — беремо по черзі:
 *   1. NEXT_PUBLIC_SITE_URL — власний домен, коли він з'явиться;
 *   2. VERCEL_PROJECT_PRODUCTION_URL — фактична адреса продакшн-деплою;
 *   3. localhost — локальна розробка.
 *
 * Через server-only: адреса потрібна лише на сервері, і так її не можна
 * випадково прочитати з клієнтського компонента, де змінної не буде.
 */
export function siteUrl(): string {
  const own = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (own) return own.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}
