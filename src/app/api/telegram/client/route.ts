import { linkChat, readStart, sendToChat, webhookSecret } from "@/lib/clientBot";
import { site } from "@/data/site";

export const dynamic = "force-dynamic";

type Update = { message?: { text?: unknown; chat?: { id?: number; type?: string } } };

/**
 * Webhook клієнтського бота: сюди Telegram приносить те, що людина написала
 * боту. Нас цікавить одне — «Start» за посиланням із сайту чи квитанції:
 * тоді запамʼятовуємо чат, і статуси ремонту підуть у нього.
 *
 * Telegram чекає 200 на будь-яке оновлення, інакше повторює його знову й знову.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = webhookSecret();
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new Response("Немає доступу", { status: 403 });
  }

  const update = (await request.json().catch(() => null)) as Update | null;
  const chat = update?.message?.chat;
  const text = typeof update?.message?.text === "string" ? update.message.text : "";

  // Лише особисті чати: у групі статуси чужого ремонту ні до чого
  if (chat?.id === undefined || chat.type !== "private") return new Response("ok");
  const chatId = String(chat.id);

  const payload = /^\/start(?:@\w+)?\s+(\S+)/.exec(text)?.[1];
  const subject = payload ? readStart(payload) : null;

  if (subject) {
    await linkChat(subject, chatId);
    await sendToChat(
      chatId,
      `<b>Готово — статуси підключено.</b>\nСюди прийде повідомлення щоразу, коли зміниться етап вашого ремонту в ${site.name}.`,
    );
  } else {
    await sendToChat(
      chatId,
      "Щоб отримувати статус ремонту, відкрийте бота кнопкою на сайті після оформлення заявки або QR-кодом із квитанції.",
    );
  }

  return new Response("ok");
}
