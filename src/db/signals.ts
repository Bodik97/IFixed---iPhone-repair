import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "./index";
import { leadMessages, leads, reviews } from "./schema";

/**
 * Сигнали для головної адмінки — усе, що чекає на майстра просто зараз.
 *
 * Найстаріше першим: сайт обіцяє передзвонити за 15 хвилин, і заявка, що
 * чекає найдовше, — найгарячіша.
 */

export type FreshSignal = {
  leadId: string;
  orderNo: number;
  name: string;
  phone: string | null;
  what: string | null;
  at: Date;
};

export type ChatSignal = {
  leadId: string;
  orderNo: number;
  name: string;
  count: number;
  /** Останнє непрочитане — щоб було видно, про що пишуть, не відкриваючи чат */
  lastText: string;
  at: Date;
};

export type ShipSignal = {
  leadId: string;
  orderNo: number;
  name: string;
  address: string | null;
  at: Date;
};

export type ReviewSignal = {
  id: string;
  author: string;
  rating: number;
  text: string;
  at: Date;
};

export type Signals = {
  fresh: FreshSignal[];
  chats: ChatSignal[];
  ship: ShipSignal[];
  reviews: ReviewSignal[];
};

/** Більше на одному екрані все одно не опрацювати — решта у списках */
const LIMIT = 20;

export async function getSignals(): Promise<Signals> {
  const db = getDb();

  const [fresh, unread, ship, pending] = await Promise.all([
    db
      .select({
        leadId: leads.id,
        orderNo: leads.orderNo,
        name: leads.name,
        phone: leads.phone,
        model: leads.model,
        service: leads.service,
        at: leads.createdAt,
      })
      .from(leads)
      .where(eq(leads.status, "new"))
      .orderBy(asc(leads.createdAt))
      .limit(LIMIT),

    // Непрочитані від клієнтів, новіші першими — перше по кожній заявці і є останнім
    db
      .select({
        leadId: leadMessages.leadId,
        text: leadMessages.text,
        image: leadMessages.imagePath,
        at: leadMessages.createdAt,
        orderNo: leads.orderNo,
        name: leads.name,
      })
      .from(leadMessages)
      .innerJoin(leads, eq(leads.id, leadMessages.leadId))
      .where(and(eq(leadMessages.author, "client"), isNull(leadMessages.readAt)))
      .orderBy(desc(leadMessages.createdAt))
      .limit(200),

    db
      .select({
        leadId: leads.id,
        orderNo: leads.orderNo,
        name: leads.name,
        address: leads.deliveryAddress,
        at: leads.updatedAt,
      })
      .from(leads)
      .where(and(eq(leads.deliveryRequested, true), isNull(leads.ttn)))
      .orderBy(asc(leads.updatedAt))
      .limit(LIMIT),

    db
      .select({
        id: reviews.id,
        author: reviews.authorName,
        rating: reviews.rating,
        text: reviews.text,
        at: reviews.createdAt,
      })
      .from(reviews)
      .where(eq(reviews.published, false))
      .orderBy(asc(reviews.createdAt))
      .limit(LIMIT),
  ]);

  const chats = new Map<string, ChatSignal>();
  for (const m of unread) {
    const seen = chats.get(m.leadId);
    if (seen) {
      seen.count++;
      // Рядки йдуть від нових до старих — час сигналу тримаємо за найстарішим
      seen.at = m.at;
      continue;
    }
    chats.set(m.leadId, {
      leadId: m.leadId,
      orderNo: m.orderNo,
      name: m.name,
      count: 1,
      lastText: m.text || (m.image ? "Фото" : ""),
      at: m.at,
    });
  }

  return {
    fresh: fresh.map(({ model, service, ...r }) => ({ ...r, what: model ?? service })),
    chats: [...chats.values()].sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, LIMIT),
    ship,
    reviews: pending,
  };
}
