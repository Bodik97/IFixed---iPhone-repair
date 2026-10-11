/**
 * Перевірка того, що люди вписують у форми. Одні й ті самі правила для
 * браузера й сервера: поле не дає набрати зайве, а сервер не вірить на слово
 * й перевіряє ще раз — запит можна надіслати й повз форму.
 */

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
