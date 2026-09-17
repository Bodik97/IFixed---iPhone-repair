import "server-only";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "./index";
import { loginAttempts } from "./schema";

/**
 * Обмеження спроб входу в адмінку.
 *
 * Дві межі одночасно:
 *   · на пошту — щоб не підбирали пароль до конкретного майстра;
 *   · на адресу — щоб не перебирали пошти з одного місця.
 *
 * Межа на адресу вища: двоє майстрів можуть сидіти в одній мережі, і один
 * не повинен блокувати іншого власною помилкою.
 */
export const WINDOW_MS = 15 * 60_000;
const BY_EMAIL = 5;
const BY_IP = 15;

export type Verdict = { ok: true } | { ok: false; retryAfterSec: number };

function since(): Date {
  return new Date(Date.now() - WINDOW_MS);
}


/** Коли спаде найстаріша спроба у вікні — стільки й лишилось чекати */
async function retryAfter(subject: string): Promise<number> {
  const [row] = await getDb()
    .select({ oldest: sql<string>`min(${loginAttempts.at})` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.subject, subject), gte(loginAttempts.at, since())));

  if (!row?.oldest) return Math.ceil(WINDOW_MS / 1000);

  const freeAt = new Date(row.oldest).getTime() + WINDOW_MS;
  return Math.max(1, Math.ceil((freeAt - Date.now()) / 1000));
}

/**
 * Займає одну спробу — атомарно, однією командою.
 *
 * Спершу тут були дві дії: порахувати, тоді записати. Перевірка показала,
 * що так захисту немає: 20 паралельних запитів усі прочитали лічильник до
 * того, як хоч один записав, і всі 20 пройшли. Тепер підрахунок і запис —
 * один INSERT з умовою, і прочитати застаріле значення нікому.
 *
 * Спроба списується на кожен вхід, зокрема вдалий; успіх її одразу повертає
 * через clearFailures.
 *
 * Під сплеском із 20 паралельних запитів проходить 5–6 замість 20. Зайва
 * одиниця — вікно між підрахунком і вставкою в межах READ COMMITTED; прибрати
 * її можна лише блокуванням, а воно потребує сесійного зʼєднання, якого в
 * HTTP-драйвері Neon немає. 6 спроб на 15 хвилин — це 576 на добу, і для
 * пароля нормальної довжини перебір лишається неможливим.
 */
async function take(subject: string, limit: number): Promise<boolean> {
  const rows = await getDb().execute(sql`
    insert into ${loginAttempts} (subject)
    select ${subject}
    where (
      select count(*) from ${loginAttempts}
      where subject = ${subject} and at >= ${since()}
    ) < ${limit}
    returning id
  `);

  return (rows.rows ?? []).length > 0;
}

/** Чи можна пробувати далі. Викликати ДО перевірки пароля. */
export async function mayTry(email: string, ip: string): Promise<Verdict> {
  const okEmail = await take(`email:${email}`, BY_EMAIL);
  if (!okEmail) return { ok: false, retryAfterSec: await retryAfter(`email:${email}`) };

  const okIp = await take(`ip:${ip}`, BY_IP);
  if (!okIp) return { ok: false, retryAfterSec: await retryAfter(`ip:${ip}`) };

  // Прибираємо все, що вже поза вікном: таблиця не має рости нескінченно
  await getDb().delete(loginAttempts).where(lt(loginAttempts.at, since()));

  return { ok: true };
}

/** Успішний вхід знімає обмеження з цієї пошти */
export async function clearFailures(email: string): Promise<void> {
  await getDb().delete(loginAttempts).where(eq(loginAttempts.subject, `email:${email}`));
}
