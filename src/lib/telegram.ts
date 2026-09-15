import "server-only";

/**
 * Сповіщення майстрам у Telegram.
 *
 * Заявка й повідомлення вже збережені в базі до того, як ми сюди потрапляємо,
 * тож збій зв'язку нічого не втрачає — лишається слід у логах. Ніколи не
 * кидаємо помилку назовні: відповідь клієнту не має залежати від Telegram.
 */

/** Кілька отримувачів — через кому: майстрів двоє, сповіщення потрібне обом */
function config(): { token: string; chats: string[] } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const raw = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !raw) return null;

  const chats = raw.split(",").map((c) => c.trim()).filter(Boolean);
  return chats.length > 0 ? { token, chats } : null;
}

export function telegramReady(): boolean {
  return config() !== null;
}

/** Екранування для parse_mode: HTML — застосовувати до значень, не до розмітки */
export function esc(v: unknown): string {
  return String(v ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
}

export async function notifyMaster(html: string): Promise<void> {
  const cfg = config();
  if (!cfg) return;

  await Promise.all(
    cfg.chats.map(async (chat) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chat,
            text: html,
            parse_mode: "HTML",
            link_preview_options: { is_disabled: true },
          }),
        });

        if (!res.ok) {
          console.error("[telegram] відмова:", res.status, await res.text().catch(() => ""));
        }
      } catch (e) {
        console.error("[telegram] не вдалося надіслати:", e);
      }
    }),
  );
}
