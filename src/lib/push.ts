import "server-only";
import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { pushSubscriptions } from "@/db/schema";

/**
 * Push-сповіщення на телефони майстрів.
 *
 * Ключі VAPID — зі змінних оточення: NEXT_PUBLIC_VAPID_PUBLIC_KEY (його ж
 * бере браузер при підписці) і VAPID_PRIVATE_KEY. Контакт для push-сервісів —
 * пошта першого майстра, без зашитих адрес.
 */

export type PushPayload = {
  title: string;
  body: string;
  /** Куди вести при натисканні — сторінка адмінки */
  url: string;
  /** Однаковий tag замінює попереднє сповіщення, а не додає ще одне */
  tag?: string;
};

function configured(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  const contact = process.env.ADMIN_EMAIL?.trim();
  if (!pub || !priv || !contact) return false;
  webpush.setVapidDetails(`mailto:${contact}`, pub, priv);
  return true;
}

export function pushReady(): boolean {
  return configured();
}

/**
 * Надіслати всім пристроям майстрів (або лише перелічених за поштою).
 * Повертає, скільки пристроїв прийняли повідомлення: 0 означає, що треба
 * запасний канал.
 */
export async function sendPush(payload: PushPayload, to?: string[]): Promise<number> {
  if (!configured()) return 0;

  const rows = await getDb()
    .select()
    .from(pushSubscriptions)
    .where(to?.length ? inArray(pushSubscriptions.adminEmail, to) : undefined);

  const body = JSON.stringify(payload);
  let delivered = 0;

  await Promise.all(
    rows.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          // Не доставили за годину — нагадування вже неактуальне.
          // high — телефон будить мережу одразу, а не в пакеті «згодом».
          { TTL: 60 * 60, urgency: "high" },
        );
        delivered++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Телефон відписався чи застосунок видалено — запис більше не потрібен
          await getDb().delete(pushSubscriptions).where(eq(pushSubscriptions.id, s.id));
        } else {
          console.error("[push] не доставлено:", status, e);
        }
      }
    }),
  );

  return delivered;
}
