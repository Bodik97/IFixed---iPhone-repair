/**
 * Перевірка того, що люди вписують у форми. Одні й ті самі правила для
 * браузера й сервера: поле не дає набрати зайве, а сервер не вірить на слово
 * й перевіряє ще раз — запит можна надіслати й повз форму.
 */

import { normalizeUaPhone } from "./phone";

export const LIMITS = {
  name: { min: 2, max: 50 },
  /** Місто й відділення Нової Пошти */
  place: { min: 3, max: 100 },
  /** Модель чи послуга, вписані вручну */
  short: 80,
  /** «Що трапилось» */
  problem: 500,
} as const;

/** Не літера, не апостроф, не дефіс і не пробіл — в імені зайве */
const NOT_NAME = /[^\p{L}'’ʼ\- ]/gu;
/** Усе, крім літер, цифр, пробілів і звичайної пунктуації: <>{}[]\|^~`$, емодзі, керівні символи */
const NOT_TEXT = /[^\p{L}\p{N} \n.,!?:;()"'’ʼ«»\-–—+№%/&@#]/gu;

/** Імʼя під час набору: лише літери, апостроф, дефіс і одинарні пробіли */
export function onlyLetters(value: string): string {
  return value.replace(NOT_NAME, "").replace(/ {2,}/g, " ").replace(/^ /, "").slice(0, LIMITS.name.max);
}

/** Імʼя годиться: від двох літер, без цифр і знаків */
export function validName(value: string): boolean {
  const v = value.trim();
  return (
    v.length <= LIMITS.name.max &&
    !new RegExp(NOT_NAME.source, "u").test(v) &&
    (v.match(/\p{L}/gu)?.length ?? 0) >= LIMITS.name.min
  );
}

/** Вільний текст: без спецсимволів і не довший за `max`. Абзаци лишаються, якщо `multiline` */
export function plainText(value: string, max: number, multiline = false): string {
  const flat = multiline ? value.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n") : value.replace(/\s+/g, " ");
  return flat.replace(/\t/g, " ").replace(NOT_TEXT, "").replace(/ {2,}/g, " ").replace(/^\s+/, "").slice(0, max);
}

/**
 * Що не так із полем — словами для людини; null, коли все гаразд.
 * Ці ж тексти показує форма під полем.
 */
export function nameProblem(value: string): string | null {
  if (!value.trim()) return "Впишіть імʼя — як до вас звертатись.";
  return validName(value) ? null : "Імʼя — щонайменше дві літери, без цифр і знаків.";
}

/** `value` — «+380731234567» або частина, як його віддає поле телефону */
export function phoneProblem(value: string): string | null {
  const local = value.replace(/\D/g, "").replace(/^38/, "");
  if (!local) return "Впишіть номер телефону — після +38 починайте з 0.";

  const missing = 10 - local.length;
  if (missing > 0) {
    const word = missing === 1 ? "цифру" : missing < 5 ? "цифри" : "цифр";
    return `Допишіть номер: бракує ще ${missing} ${word}.`;
  }
  return normalizeUaPhone(value) ? null : "Перевірте номер: такого коду оператора немає.";
}

export function placeProblem(value: string): string | null {
  return value.trim().length >= LIMITS.place.min ? null : "Впишіть місто й номер відділення Нової Пошти.";
}
