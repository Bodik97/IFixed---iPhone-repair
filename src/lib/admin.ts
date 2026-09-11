import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "ifix_admin";
const MAX_AGE = 60 * 60 * 12; // 12 годин

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} не задано — адмінка вимкнена`);
  return value;
}

/** Порівняння, стійке до timing-атак (однакова довжина обовʼязкова) */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function sign(payload: string): string {
  return createHmac("sha256", requireEnv("ADMIN_SESSION_SECRET")).update(payload).digest("hex");
}

/**
 * Доступ мають лише перелічені майстри. Кожен зі своєю парою:
 * ADMIN_EMAIL / ADMIN_PASSWORD — перший, ADMIN_EMAIL_2 / ADMIN_PASSWORD_2 — другий.
 * Другий необовʼязковий: якщо змінних немає, працює один акаунт.
 */
function accounts(): { email: string; password: string }[] {
  const list = [
    { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
    { email: process.env.ADMIN_EMAIL_2, password: process.env.ADMIN_PASSWORD_2 },
  ];

  return list
    .filter((a): a is { email: string; password: string } => Boolean(a.email && a.password))
    .map((a) => ({ email: a.email.trim().toLowerCase(), password: a.password }));
}

/** Перевіряє пару email+пароль проти списку майстрів */
export function checkCredentials(email: string, password: string): boolean {
  const list = accounts();
  if (list.length === 0) throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD не задано — адмінка вимкнена");

  const given = email.trim().toLowerCase();

  // Перебираємо всі акаунти до кінця — час відповіді не має видавати, який саме не зійшовся
  let matched = false;
  for (const a of list) {
    const ok = safeEqual(given, a.email) && safeEqual(password, a.password);
    matched = matched || ok;
  }

  return matched;
}

export async function createSession(): Promise<void> {
  const expires = Date.now() + MAX_AGE * 1000;
  const value = `${expires}.${sign(String(expires))}`;

  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** true, якщо cookie підписана нашим секретом і ще не протухла */
export async function isAdmin(): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;

  const [expires, signature] = raw.split(".");
  if (!expires || !signature) return false;
  if (Number(expires) < Date.now()) return false;

  try {
    return safeEqual(signature, sign(expires));
  } catch {
    // Секрет не заданий — вважаємо, що доступу немає
    return false;
  }
}
