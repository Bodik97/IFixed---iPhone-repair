import type { Instrumentation } from "next";

/**
 * Кожна помилка сервера — сторінки, API, server actions, proxy — летить
 * сповіщенням у Telegram розробника (див. lib/alerts.ts).
 *
 * Імпорт усередині: instrumentation завантажується для всіх рантаймів, а
 * сповіщення потрібні лише там, де справді обробляються запити.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { reportError } = await import("@/lib/alerts");
  await reportError(err, request, context);
};
