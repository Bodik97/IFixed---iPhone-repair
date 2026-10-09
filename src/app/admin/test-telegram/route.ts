import { isAdmin } from "@/lib/admin";

type Reply = { ok: boolean; description?: string; result?: { username?: string; title?: string } };

async function call(token: string, method: string, body?: object): Promise<Reply> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    return (await res.json()) as Reply;
  } catch (e) {
    return { ok: false, description: `немає зв'язку з Telegram: ${e instanceof Error ? e.message : e}` };
  }
}

const verdict = (r: Reply) => (r.ok ? "так" : `НІ — ${r.description ?? "невідома відмова"}`);

/**
 * Перевірка налаштувань Telegram на живому сервері: чи задані змінні, який
 * бот за токеном і чи може він писати в кожен чат. У чат збоїв іде справжнє
 * тестове повідомлення; чати майстрів лише перевіряємо, не турбуючи їх.
 *
 * Значення чатів показуємо як є (в лапках) — так видно зайвий пробіл чи лапку.
 * Токен не показуємо ніколи.
 */
export async function GET(): Promise<Response> {
  if (!(await isAdmin())) return new Response("Немає доступу", { status: 403 });

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const masters = process.env.TELEGRAM_CHAT_ID;
  const alert = process.env.TELEGRAM_ALERT_CHAT_ID;

  const lines = [
    `TELEGRAM_BOT_TOKEN: ${token ? "задано" : "НЕ ЗАДАНО"}`,
    `TELEGRAM_CHAT_ID (майстри): ${masters === undefined ? "НЕ ЗАДАНО" : JSON.stringify(masters)}`,
    `TELEGRAM_ALERT_CHAT_ID (збої): ${alert === undefined ? "НЕ ЗАДАНО" : JSON.stringify(alert)}`,
    "",
  ];

  if (token) {
    const me = await call(token, "getMe");
    lines.push(`Бот за токеном: ${me.ok ? `@${me.result?.username}` : verdict(me)}`);

    for (const chat of (masters ?? "").split(",").map((c) => c.trim()).filter(Boolean)) {
      lines.push(`Бачить чат майстра ${chat}: ${verdict(await call(token, "getChat", { chat_id: chat }))}`);
    }

    if (alert?.trim()) {
      const sent = await call(token, "sendMessage", {
        chat_id: alert.trim(),
        text: "Перевірка: сповіщення про збої налаштовано.",
      });
      lines.push(`Тестове повідомлення в чат збоїв: ${verdict(sent)}`);
    }
  }

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
