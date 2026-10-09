import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { clerkSetup } from "@clerk/testing/playwright";

/**
 * Тестовий клієнт для E2E кабінету.
 *
 * Лише для dev-інстансу Clerk (sk_test_…): clerkSetup сам відмовляється від
 * продакшн-ключа, а ми ще й не доходимо до нього. Пошта з «+clerk_test» —
 * для такої Clerk приймає код 424242 замість справжнього листа.
 *
 * Пароль новий на кожен запуск і живе лише в process.env цього прогону —
 * у репозиторії його немає. Заявок у такого клієнта немає, тож кабінет
 * порожній і в базу ніхто не пише.
 */
export const E2E_EMAIL = "gadgetfix-e2e+clerk_test@example.com";

export default async function globalSetup() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");

  const secret = process.env.CLERK_SECRET_KEY ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  if (!secret.startsWith("sk_test_")) {
    console.warn("[e2e] немає тестового ключа Clerk — тести кабінету буде пропущено");
    return;
  }

  await clerkSetup({ publishableKey, secretKey: secret });

  const password = `e2e-${randomBytes(12).toString("hex")}`;
  const api = (path: string, init?: RequestInit) =>
    fetch(`https://api.clerk.com/v1${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    });

  const found = await (await api(`/users?email_address=${encodeURIComponent(E2E_EMAIL)}`)).json();
  const res = found[0]
    ? await api(`/users/${found[0].id}`, {
        method: "PATCH",
        body: JSON.stringify({ password, skip_password_checks: true }),
      })
    : await api("/users", {
        method: "POST",
        body: JSON.stringify({
          email_address: [E2E_EMAIL],
          password,
          first_name: "E2E",
          skip_password_checks: true,
        }),
      });

  if (!res.ok) throw new Error(`[e2e] Clerk не прийняв тестового клієнта: ${res.status} ${await res.text()}`);

  process.env.E2E_CLIENT_PASSWORD = password;
}
