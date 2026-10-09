import { isAdmin } from "@/lib/admin";

/**
 * Перевірка сповіщень про збої: навмисна помилка сервера, яка має прийти
 * в Telegram-чат розробника тим самим шляхом, що й справжня (instrumentation
 * → lib/alerts.ts). Сторінка після цього показує помилку — так і задумано.
 *
 * Час у тексті — щоб повторна перевірка не впиралась у паузу між однаковими
 * помилками.
 */
export async function GET(): Promise<Response> {
  if (!(await isAdmin())) return new Response("Немає доступу", { status: 403 });

  throw new Error(`Тестовий збій ${new Date().toISOString()} — перевірка сповіщень`);
}
