import { isAdmin } from "@/lib/admin";
import { webhookSecret } from "@/lib/clientBot";
import { siteUrl } from "@/lib/siteUrl";

type Reply = { ok: boolean; description?: string; result?: { username?: string; url?: string; last_error_message?: string } };

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
 * Підключення клієнтського бота до сайту. Відкрити один раз після того, як
 * задано змінні: сторінка каже Telegram, куди приносити повідомлення
 * (адреса — із siteUrl, не з коду), і показує, що вийшло.
 * Відкривати повторно безпечно — вона лише ставить ту саму адресу ще раз.
 */
export async function GET(): Promise<Response> {
  if (!(await isAdmin())) return new Response("Немає доступу", { status: 403 });

  const token = process.env.TELEGRAM_CLIENT_BOT_TOKEN?.trim();
  const username = process.env.TELEGRAM_CLIENT_BOT_USERNAME?.trim().replace(/^@/, "");
  const secret = webhookSecret();

  const lines = [
    `TELEGRAM_CLIENT_BOT_TOKEN: ${token ? "задано" : "НЕ ЗАДАНО"}`,
    `TELEGRAM_CLIENT_BOT_USERNAME: ${username ? JSON.stringify(username) : "НЕ ЗАДАНО"}`,
    "",
  ];

  if (token && username && secret) {
    const me = await call(token, "getMe");
    lines.push(`Бот за токеном: ${me.ok ? `@${me.result?.username}` : verdict(me)}`);
    if (me.ok && me.result?.username?.toLowerCase() !== username.toLowerCase()) {
      lines.push("УВАГА: імʼя бота не збігається з TELEGRAM_CLIENT_BOT_USERNAME — посилання вестимуть не туди.");
    }

    const url = `${siteUrl()}/api/telegram/client`;
    const set = await call(token, "setWebhook", { url, secret_token: secret, allowed_updates: ["message"] });
    lines.push(`Адреса для повідомлень ${url}: ${verdict(set)}`);

    const info = await call(token, "getWebhookInfo");
    if (info.result?.last_error_message) lines.push(`Остання помилка доставки: ${info.result.last_error_message}`);
  }

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
