/**
 * Проста памʼять на час життя інстансу: скільки запитів прийшло з IP.
 * Для одного сервісу з кількома заявками на день цього досить; якщо
 * трафік зросте — замінити на Redis, інтерфейс лишиться тим самим.
 */
const hits = new Map<string, number[]>();

/** Прибирає старі записи, щоб мапа не росла нескінченно */
function sweep(now: number, windowMs: number) {
  for (const [key, times] of hits) {
    const fresh = times.filter((t) => now - t < windowMs);
    if (fresh.length === 0) hits.delete(key);
    else hits.set(key, fresh);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();

  if (hits.size > 500) sweep(now, windowMs);

  const times = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (times.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - times[0])) / 1000);
    return { ok: false, retryAfter };
  }

  times.push(now);
  hits.set(key, times);
  return { ok: true, retryAfter: 0 };
}

/** IP клієнта за заголовками проксі Vercel */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
