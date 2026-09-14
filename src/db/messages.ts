import { and, asc, count, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "./index";
import { leadMessages, leads, type LeadMessage } from "./schema";

/** Довше писати в чат сенсу немає — деталі простіше сказати по телефону */
export const MAX_MESSAGE = 1000;

export async function getMessages(leadId: string): Promise<LeadMessage[]> {
  return getDb()
    .select()
    .from(leadMessages)
    .where(eq(leadMessages.leadId, leadId))
    .orderBy(asc(leadMessages.createdAt));
}

/**
 * Заявка належить цьому клієнту?
 * Перевіряємо і за акаунтом, і за поштою — так само, як getClientLeads:
 * заявка могла бути залишена до реєстрації з тією самою адресою.
 */
export async function ownsLead(
  leadId: string,
  clerkUserId: string,
  email?: string | null,
): Promise<boolean> {
  const match = email
    ? or(eq(leads.clerkUserId, clerkUserId), eq(leads.email, email))
    : eq(leads.clerkUserId, clerkUserId);

  const [row] = await getDb()
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.id, leadId), match))
    .limit(1);

  return Boolean(row);
}

export async function addMessage(
  leadId: string,
  author: "client" | "master",
  text: string,
): Promise<void> {
  const clean = text.trim().slice(0, MAX_MESSAGE);
  if (!clean) return;

  await getDb().insert(leadMessages).values({ leadId, author, text: clean });
}

/** Позначити прочитаним усе, що написав інший бік */
export async function markRead(leadId: string, reader: "client" | "master"): Promise<void> {
  const from = reader === "client" ? "master" : "client";

  await getDb()
    .update(leadMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(leadMessages.leadId, leadId),
        eq(leadMessages.author, from),
        isNull(leadMessages.readAt),
      ),
    );
}

/** Скільки непрочитаних від одного боку в конкретній заявці */
export async function countUnread(
  leadId: string,
  from: "client" | "master",
): Promise<number> {
  const [row] = await getDb()
    .select({ n: count() })
    .from(leadMessages)
    .where(
      and(
        eq(leadMessages.leadId, leadId),
        eq(leadMessages.author, from),
        isNull(leadMessages.readAt),
      ),
    );

  return row?.n ?? 0;
}

/** Непрочитані від клієнтів по всіх заявках — бейдж у меню адмінки */
export async function countUnreadForMaster(): Promise<number> {
  const [row] = await getDb()
    .select({ n: count() })
    .from(leadMessages)
    .where(and(eq(leadMessages.author, "client"), isNull(leadMessages.readAt)));

  return row?.n ?? 0;
}

/**
 * Непрочитані, згруповані за заявками.
 * `from` — чиї повідомлення рахуємо: "master" для сторінки клієнта,
 * "client" для адмінки.
 */
export async function unreadByLead(
  leadIds: string[],
  from: "client" | "master",
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (leadIds.length === 0) return map;

  const rows = await getDb()
    .select({ leadId: leadMessages.leadId, n: count() })
    .from(leadMessages)
    .where(
      and(
        inArray(leadMessages.leadId, leadIds),
        eq(leadMessages.author, from),
        isNull(leadMessages.readAt),
      ),
    )
    .groupBy(leadMessages.leadId);

  for (const r of rows) map.set(r.leadId, r.n);
  return map;
}
