"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { del, put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { devices, leadMessages, leads, pushSubscriptions, reviews } from "@/db/schema";
import { STATUS_OPTIONS } from "@/db/leads";
import { guessWarrantyDays, isWarrantyTerm, warrantyEnd } from "@/data/warranty";
import { addEvent, getLeadById } from "@/db/events";
import { addExpense, EXPENSE_CATEGORIES, removeExpense } from "@/db/expenses";
import { addPart, removePart, shiftPartQty } from "@/db/parts";
import { rateLimit, release } from "@/lib/rateLimit";
import { sendPush } from "@/lib/push";
import { notifyClientStatus, offerPrice } from "@/lib/clientBot";
import { closeOrder } from "@/lib/handover";
import { normalizeUaPhone } from "@/lib/phone";
import { LIMITS, plainText, validName } from "@/lib/validate";
import { start } from "workflow/api";
import { watchParcel } from "@/workflows/watch-parcel";
import { checkCredentials, createSession, currentAdmin, destroySession, isAdmin } from "@/lib/admin";

/** Адреса, з якої прийшов запит — за нею теж рахуємо спроби входу */
async function clientAddress(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Межі входу: на пошту суворіша, бо адреса може бути спільна у двох майстрів */
const LOGIN_WINDOW = 15 * 60_000;
const BY_EMAIL = 5;
const BY_IP = 15;

/** 900 → «15 хв», 90 → «2 хв»: точні секунди тут нікому не потрібні */
function waitLabel(sec: number): string {
  const min = Math.ceil(sec / 60);
  return min <= 1 ? "хвилину" : `${min} хв`;
}

export async function signIn(_prev: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = await clientAddress();

  // Межу перевіряємо ДО пароля: інакше сама перевірка стає тим, що перебирають
  const byEmail = await rateLimit(`login:email:${email}`, BY_EMAIL, LOGIN_WINDOW);
  if (!byEmail.ok) return `Забагато спроб входу. Спробуйте за ${waitLabel(byEmail.retryAfter)}.`;

  const byIp = await rateLimit(`login:ip:${ip}`, BY_IP, LOGIN_WINDOW);
  if (!byIp.ok) return `Забагато спроб входу. Спробуйте за ${waitLabel(byIp.retryAfter)}.`;

  let master: number | null = null;
  try {
    master = checkCredentials(email, password);
  } catch {
    return "Адмінка не налаштована: немає ADMIN_EMAIL, ADMIN_PASSWORD або ADMIN_SESSION_SECRET.";
  }

  if (master === null) {
    // Спробу вже списано в rateLimit — окремо записувати нічого.
    // Затримка лишається: вона нічого не варта проти паралельних спроб,
    // але робить послідовний перебір ще повільнішим
    await new Promise((r) => setTimeout(r, 700));
    return "Пошта або пароль не підходять.";
  }

  // Успіх знімає лічильник, щоб майстер не лишався заблокованим
  // через власні помилки перед вдалим входом
  await release(`login:email:${email}`);
  await createSession(master);
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/admin/vhid");
}

export async function setStatus(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  const allowed = STATUS_OPTIONS.map((o) => o.value);
  if (!allowed.includes(status as (typeof allowed)[number])) return;

  const next = status as (typeof allowed)[number];

  const before = await getLeadById(id);

  // «Відправлено» ставить лише збереження ТТН: без накладної клієнту нема що відстежувати
  if (next === "shipped" && !before?.ttn) return;

  if (next === "done" && before) {
    // Пристрій у клієнта — заявка закривається, і з цього дня рахується гарантія
    await closeOrder(before);
  } else {
    await getDb().update(leads).set({ status: next, updatedAt: new Date() }).where(eq(leads.id, id));

    // Хроніка: клієнт бачить, що саме сталося, а не лише підсвічену стадію
    await addEvent(id, { status: next });

    // Клієнт із підключеним ботом дізнається про новий етап одразу, у Telegram
    if (before) await notifyClientStatus({ ...before, status: next });
  }

  revalidatePath("/admin");
  revalidatePath("/moi-remonty");
}

/**
 * Строк гарантії для заявки. До видачі — просто запамʼятовуємо вибір;
 * після — перераховуємо дату від того самого дня видачі, щоб майстер міг
 * виправити помилку, не подарувавши й не забравши клієнту дні.
 */
export async function setWarranty(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const id = String(formData.get("id") ?? "");
  const days = Number(formData.get("days"));
  if (!id || !isWarrantyTerm(days)) return;

  const lead = await getLeadById(id);
  if (!lead) return;

  let warrantyUntil = lead.warrantyUntil;
  if (lead.status === "done") {
    // День видачі: кінець гарантії мінус попередній строк; для старих заявок без дати — остання зміна
    const previous = lead.warrantyDays ?? guessWarrantyDays(lead.service ?? lead.problem);
    const handedOver = lead.warrantyUntil ? new Date(lead.warrantyUntil) : new Date(lead.updatedAt);
    if (lead.warrantyUntil) handedOver.setDate(handedOver.getDate() - previous);

    warrantyUntil = warrantyEnd(handedOver, days);
    // Клієнт з акаунтом бачить гарантію в кабінеті з таблиці пристроїв — тримаємо її в лад
    if (warrantyUntil) await getDb().update(devices).set({ warrantyUntil }).where(eq(devices.leadId, id));
  }

  await getDb().update(leads).set({ warrantyDays: days, warrantyUntil, updatedAt: new Date() }).where(eq(leads.id, id));

  revalidatePath("/admin");
  revalidatePath("/moi-remonty");
}

/**
 * Майстер бере заявку собі — або відпускає її. Другий майстер бачить, хто
 * чим займається, і не дзвонить тому самому клієнту вдруге.
 *
 * У хроніку не пишемо: її бачить клієнт, а розподіл робіт — внутрішня справа.
 */
export async function setAssignee(formData: FormData): Promise<void> {
  const me = await currentAdmin();
  if (!me) redirect("/admin/vhid");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const take = String(formData.get("take") ?? "") === "1";

  await getDb()
    .update(leads)
    .set({ assignee: take ? me.email : null, updatedAt: new Date() })
    .where(eq(leads.id, id));

  revalidatePath("/admin");
}

/**
 * Заявка, яку майстер заводить сам: клієнт подзвонив або приніс пристрій без
 * запису. Інакше такий ремонт не потрапляє ні в касу, ні в гарантію.
 *
 * Заявка одразу за тим, хто її створив. Якщо пристрій уже в сервісі — вона
 * «У роботі», інакше «Нова». Після збереження відкриваємо її розгорнутою,
 * щоб одразу надрукувати квитанцію.
 */
export async function createLead(_prev: string | null, formData: FormData): Promise<string | null> {
  const me = await currentAdmin();
  if (!me) redirect("/admin/vhid");

  // Ті самі правила, що й у формах на сайті: майстер теж може помилитись клавішею
  const field = (key: string) => String(formData.get(key) ?? "");
  const name = field("name").trim();
  const phone = normalizeUaPhone(field("phone"));
  const model = plainText(field("model"), LIMITS.short).trim() || null;
  const problem = plainText(field("problem"), LIMITS.problem, true).trim() || null;
  const handedOver = formData.get("handedOver") === "on";

  if (!validName(name)) return "Впишіть імʼя клієнта — лише літери, від 2 до 50.";
  if (!phone) return "Впишіть телефон повністю: після +38 — десять цифр.";

  const [row] = await getDb()
    .insert(leads)
    .values({
      name,
      phone,
      model,
      problem,
      source: "manual",
      status: handedOver ? "in_progress" : "new",
      assignee: me.email,
    })
    .returning({ id: leads.id, orderNo: leads.orderNo });

  revalidatePath("/admin");
  redirect(`/admin/zayavky?q=${row.orderNo}&open=${row.id}`);
}

/** Підписка браузера на push — те, що віддає PushSubscription.toJSON() */
export type PushKeys = { endpoint: string; keys: { p256dh: string; auth: string } };

/**
 * Майстер увімкнув сповіщення на цьому телефоні. Повторне ввімкнення на тому
 * ж пристрої оновлює запис (endpoint унікальний) — дублікатів немає.
 */
export async function savePushSubscription(sub: PushKeys, userAgent: string): Promise<void> {
  const me = await currentAdmin();
  if (!me) redirect("/admin/vhid");

  const endpoint = String(sub?.endpoint ?? "");
  const p256dh = String(sub?.keys?.p256dh ?? "");
  const auth = String(sub?.keys?.auth ?? "");
  // Endpoint видає браузер, і це завжди https-адреса push-сервісу
  if (!/^https:\/\//.test(endpoint) || !p256dh || !auth) return;

  await getDb()
    .insert(pushSubscriptions)
    .values({ adminEmail: me.email, endpoint, p256dh, auth, userAgent: String(userAgent ?? "").slice(0, 300) })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { adminEmail: me.email, p256dh, auth },
    });
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/vhid");
  await getDb().delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, String(endpoint ?? "")));
}

/** Перевірка з телефона: push лише на пристрої того, хто натиснув */
export async function sendTestPush(): Promise<number> {
  const me = await currentAdmin();
  if (!me) redirect("/admin/vhid");
  return sendPush({ title: "Сповіщення працюють", body: "Так виглядатиме нова заявка.", url: "/admin", tag: "test" }, [me.email]);
}

/** Майстер дописує подію в хроніку своїми словами */
export async function addNote(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const id = String(formData.get("id") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!id || text.length < 3) return;

  await addEvent(id, { text, byMaster: true });

  revalidatePath("/admin");
  revalidatePath("/moi-remonty");
}

/** Майстер вписує накладну — статус одразу стає «Відправлено» */
export async function setTtn(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const id = String(formData.get("id") ?? "");
  const ttn = String(formData.get("ttn") ?? "").trim();
  if (!id) return;

  await getDb()
    .update(leads)
    .set({
      ttn: ttn ? ttn.slice(0, 40) : null,
      ...(ttn ? { status: "shipped" as const } : {}),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id));

  if (ttn) {
    await addEvent(id, { text: `Відправлено Новою Поштою, накладна ${ttn}`, status: "shipped" });

    const lead = await getLeadById(id);
    if (lead) await notifyClientStatus(lead);

    // Стежимо за посилкою: клієнт забрав — заявка закриється, почнеться гарантія.
    // Збій тут не має зачіпати майстра: накладна вже збережена
    try {
      await start(watchParcel, [id, ttn.slice(0, 40)]);
    } catch (e) {
      console.error("[ttn] стеження за посилкою не запущено:", e);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/moi-remonty");
}

/** Схвалити або сховати відгук */
export async function setReviewPublished(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const id = String(formData.get("id") ?? "");
  const publish = String(formData.get("publish") ?? "") === "1";
  if (!id) return;

  await getDb().update(reviews).set({ published: publish }).where(eq(reviews.id, id));

  revalidatePath("/admin");
  revalidatePath("/");
}

/** Видалити відгук назовсім */
export async function deleteReview(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getDb().delete(reviews).where(eq(reviews.id, id));

  revalidatePath("/admin");
  revalidatePath("/");
}

/**
 * Гривні з того, що ввів майстер.
 * undefined = поля у формі не було, значення не чіпаємо;
 * null = майстер очистив поле.
 */
function parseUah(form: FormData, key: string): number | null | undefined {
  if (!form.has(key)) return undefined;

  const text = String(form.get(key) ?? "").replace(/\s/g, "").replace(",", ".");
  if (!text) return null;

  const n = Math.round(Number(text));
  // Не число або дурниця на кшталт від'ємної суми — поле не чіпаємо
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return undefined;
  return n;
}

/** Погоджена ціна, собівартість деталі та відмітка про оплату */
export async function setMoney(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const price = parseUah(formData, "price");
  const partsCost = parseUah(formData, "partsCost");
  const prepayment = parseUah(formData, "prepayment");
  const prepaid = formData.get("prepaid") === "on";
  const paid = formData.get("paid") === "on";

  const [before] = await getDb().select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!before) return;

  await getDb()
    .update(leads)
    .set({
      ...(price === undefined ? {} : { price }),
      ...(partsCost === undefined ? {} : { partsCost }),
      ...(prepayment === undefined ? {} : { prepayment }),
      // Дату ставимо раз: повторне збереження не має її зсувати
      prepaidAt: prepaid ? (before.prepaidAt ?? new Date()) : null,
      // Відмітку ставимо раз: повторне збереження не має зсувати дату оплати
      paidAt: paid ? (before.paidAt ?? new Date()) : null,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id));

  // Клієнт бачить ціну в кабінеті, тож про її появу пишемо в хроніку
  if (price !== undefined && price !== null && price !== before.price) {
    await addEvent(id, { text: `Погодили ціну ремонту: ${price} ₴` });

    // Клієнт із ботом погоджує ціну кнопкою — без дзвінка
    await offerPrice({ ...before, price });
  }

  // Передоплата — умова початку робіт, тож її надходження теж подія
  if (prepaid && !before.prepaidAt) {
    const sum = prepayment ?? before.prepayment;
    await addEvent(id, {
      text: sum ? `Отримали передоплату: ${sum} ₴. Беремо пристрій у роботу.` : "Отримали передоплату. Беремо пристрій у роботу.",
    });
  }

  revalidatePath("/admin");
  revalidatePath("/moi-remonty");
}

/** Відгук, який майстер заводить сам: людина лишила його усно або в месенджері */
export async function addReview(formData: FormData): Promise<string | null> {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const authorName = String(formData.get("authorName") ?? "").trim().slice(0, 60);
  const text = String(formData.get("text") ?? "").trim().slice(0, 600);
  const device = String(formData.get("device") ?? "").trim().slice(0, 60) || null;
  const city = String(formData.get("city") ?? "").trim().slice(0, 60) || null;

  const rating = Number(formData.get("rating"));
  const safeRating = Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 5;

  if (authorName.length < 2) return "Впишіть імʼя автора.";
  if (text.length < 10) return "Відгук закороткий — щонайменше 10 символів.";

  let imagePath: string | null = null;
  let imageWidth: number | null = null;
  let imageHeight: number | null = null;

  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) return "Можна додавати лише фото.";
    if (file.size > 6 * 1024 * 1024) return "Фото завелике.";

    const blob = await put(`reviews/${crypto.randomUUID()}`, file, {
      access: "private",
      contentType: file.type,
    });
    imagePath = blob.pathname;
    imageWidth = Number(formData.get("width")) || null;
    imageHeight = Number(formData.get("height")) || null;
  }

  await getDb().insert(reviews).values({
    clerkUserId: null,
    authorName,
    device,
    city,
    rating: safeRating,
    text,
    byMaster: true,
    // Свій відгук майстер публікує одразу — модерувати себе немає сенсу
    published: true,
    imagePath,
    imageWidth,
    imageHeight,
  });

  revalidatePath("/admin/vidhuky");
  revalidatePath("/");
  return null;
}

/** Записати витрату: оренду, рекламу, інструмент — усе, що не деталь конкретного ремонту */
export async function createExpense(formData: FormData): Promise<string | null> {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const amount = Math.round(Number(String(formData.get("amount") ?? "").replace(/\s/g, "")));
  if (!Number.isFinite(amount) || amount <= 0) return "Вкажіть суму більшу за нуль.";

  const raw = String(formData.get("category") ?? "other");
  const category = EXPENSE_CATEGORIES.some((c) => c.value === raw)
    ? (raw as (typeof EXPENSE_CATEGORIES)[number]["value"])
    : "other";

  // Дата з поля типу date приходить як «2026-09-15»; порожню замінюємо на сьогодні
  const day = String(formData.get("spentAt") ?? "");
  const spentAt = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00`) : new Date();

  const note = String(formData.get("note") ?? "").trim().slice(0, 300);

  await addExpense({ amount, category, note: note || null, spentAt });

  revalidatePath("/admin/groshi");
  revalidatePath("/admin");
  return null;
}

export async function deleteExpense(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await removeExpense(id);

  revalidatePath("/admin/groshi");
  revalidatePath("/admin");
}

/** Нова позиція на складі */
export async function createPart(formData: FormData): Promise<string | null> {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  if (!name) return "Вкажіть, що це за деталь.";

  const num = (key: string) => {
    const n = Math.round(Number(String(formData.get(key) ?? "").replace(/\s/g, "")));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  await addPart({
    name,
    model: String(formData.get("model") ?? "").trim().slice(0, 120) || null,
    qty: num("qty") ?? 0,
    unitCost: num("unitCost"),
    minQty: num("minQty") ?? 1,
  });

  revalidatePath("/admin/sklad");
  return null;
}

/** ±1 до залишку: поставили деталь у телефон або привезли партію */
export async function shiftPart(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const id = String(formData.get("id") ?? "");
  const delta = Number(formData.get("delta"));
  if (!id || !Number.isFinite(delta) || delta === 0) return;

  await shiftPartQty(id, Math.trunc(delta));

  revalidatePath("/admin/sklad");
}

export async function deletePart(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await removePart(id);

  revalidatePath("/admin/sklad");
}

/**
 * Видалити заявку назовсім — на вимогу клієнта.
 *
 * Закон дає людині право забрати свої дані, і без цієї дії обіцянка на
 * сторінці про персональні дані була б порожньою. Разом із заявкою
 * зникають листування (за звʼязком у базі) і фото зі сховища — їх треба
 * прибирати окремо, бо каскад до сховища не дотягується.
 */
export async function deleteLead(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/vhid");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const photos = await getDb()
    .select({ path: leadMessages.imagePath })
    .from(leadMessages)
    .where(eq(leadMessages.leadId, id));

  for (const { path } of photos) {
    if (!path) continue;
    // Одне невдале фото не має лишати заявку невидаленою
    await del(path).catch((e) => console.error("[deleteLead] фото не прибралось:", path, e));
  }

  await getDb().delete(leads).where(eq(leads.id, id));

  revalidatePath("/admin/zayavky");
  revalidatePath("/admin");
}
