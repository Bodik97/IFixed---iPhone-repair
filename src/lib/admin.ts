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

/** Перевіряє пару email+пароль проти ADMIN_EMAIL / ADMIN_PASSWORD */
export function checkCredentials(email: string, password: string): boolean {
  const okEmail = safeEqual(email.trim().toLowerCase(), requireEnv("ADMIN_EMAIL").toLowerCase());
  const okPassword = safeEqual(password, requireEnv("ADMIN_PASSWORD"));
  // Обидві перевірки виконуються завжди — щоб час відповіді не видавав, яка з них не зійшлась
  return okEmail && okPassword;
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
