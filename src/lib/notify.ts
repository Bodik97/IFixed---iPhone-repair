import "server-only";
import { sendPush, type PushPayload } from "./push";
import { notifyMaster } from "./telegram";

/**
 * Сповістити майстрів: спершу push на телефони, і лише якщо жоден пристрій
 * його не прийняв (ніхто ще не ввімкнув сповіщення, ключі не задані, збій) —
 * Telegram, як було до push. Так сповіщення не губиться на перехідний час.
 *
 * `telegramHtml` — той самий зміст у розмітці Telegram.
 */
export async function alertMasters(push: PushPayload, telegramHtml: string): Promise<"push" | "telegram"> {
  const delivered = await sendPush(push).catch((e) => {
    console.error("[notify] push упав:", e);
    return 0;
  });

  if (delivered > 0) return "push";

  await notifyMaster(telegramHtml);
  return "telegram";
}
