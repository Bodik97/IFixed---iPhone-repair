import {
  CHECK_BUTTON,
  SHARE_BUTTON,
  linkChat,
  readStart,
  sendToChat,
  statusReport,
  subjectOfPhone,
  webhookSecret,
} from "@/lib/clientBot";
import { site } from "@/data/site";

export const dynamic = "force-dynamic";

type Update = {
  message?: {
    text?: unknown;
    from?: { id?: number };
    chat?: { id?: number; type?: string };
    contact?: { phone_number?: unknown; user_id?: number };
  };
};

/**
 * Webhook клієнтського бота: сюди Telegram приносить те, що людина написала
 * боту. Чат закріплюємо за клієнтом двома шляхами: «Start» за посиланням із
 * сайту чи квитанції або кнопка «Поділитися номером» просто в боті — без
 * сайту й реєстрації. Далі статуси ремонту йдуть у цей чат самі, а кнопка
 * «Перевірити статус» показує поточний стан.
 *
 * Telegram чекає 200 на будь-яке оновлення, інакше повторює його знову й знову.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = webhookSecret();
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new Response("Немає доступу", { status: 403 });
  }

  const update = (await request.json().catch(() => null)) as Update | null;
  const message = update?.message;
  const chat = message?.chat;
  const text = typeof message?.text === "string" ? message.text : "";

  // Лише особисті чати: у групі статуси чужого ремонту ні до чого
  if (chat?.id === undefined || chat.type !== "private") return new Response("ok");
  const chatId = String(chat.id);

  const report = () =>
    statusReport(chatId).catch((e) => {
      console.error("[client-bot] статус не зібрано:", e);
      return null;
    });

  // Номер із кнопки «Поділитися номером». Приймаємо лише власний контакт:
  // чужий можна переслати вручну, і тоді прийшли б статуси чужого ремонту
  const contact = message?.contact;
  if (contact) {
    const own = contact.user_id !== undefined && contact.user_id === message?.from?.id;
    const subject = own && typeof contact.phone_number === "string" ? subjectOfPhone(contact.phone_number) : null;

    if (!subject) {
      await sendToChat(chatId, `Потрібен саме ваш номер — натисніть кнопку «${SHARE_BUTTON}» нижче.`, "share");
      return new Response("ok");
    }

    await linkChat(subject, chatId);
    await sendToChat(
      chatId,
      `<b>Готово — статуси підключено.</b>\nСюди прийде повідомлення щоразу, коли зміниться етап вашого ремонту в ${site.name}.\n\n${(await report()) ?? ""}`,
    );
    return new Response("ok");
  }

  const payload = /^\/start(?:@\w+)?\s+(\S+)/.exec(text)?.[1];
  const subject = payload ? readStart(payload) : null;

  if (subject) {
    await linkChat(subject, chatId);
    await sendToChat(
      chatId,
      `<b>Готово — статуси підключено.</b>\nСюди прийде повідомлення щоразу, коли зміниться етап вашого ремонту в ${site.name}. Поточний стан — кнопкою «${CHECK_BUTTON}».`,
    );
    return new Response("ok");
  }

  // Кнопка, команда /status чи будь-який інший текст — відповідаємо станом ремонтів
  const current = await report();
  if (current) {
    await sendToChat(chatId, current);
  } else {
    // Ще не знаємо, хто це: просимо номер — за ним знайдемо заявки
    await sendToChat(
      chatId,
      `Щоб побачити статус ремонту, натисніть «${SHARE_BUTTON}» нижче. Знайдемо ваші заявки за номером телефону й надалі писатимемо сюди про кожну зміну.`,
      "share",
    );
  }

  return new Response("ok");
}
