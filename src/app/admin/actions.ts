"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, reviews } from "@/db/schema";
import { STATUS_OPTIONS } from "@/db/leads";
import { addEvent, getLeadById, registerDevice } from "@/db/events";
import { addExpense, EXPENSE_CATEGORIES, removeExpense } from "@/db/expenses";
import { addPart, removePart, shiftPartQty } from "@/db/parts";
import { checkCredentials, createSession, destroySession, isAdmin } from "@/lib/admin";

export async function signIn(_prev: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  let master: number | null = null;
  try {
    master = checkCredentials(email, password);
  } catch {
    return "Адмінка не налаштована: немає ADMIN_EMAIL, ADMIN_PASSWORD або ADMIN_SESSION_SECRET.";
  }

  if (master === null) {
    // Невелика затримка, щоб перебір паролів був повільним
    await new Promise((r) => setTimeout(r, 700));
    return "Пошта або пароль не підходять.";
  }

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

  await getDb().update(leads).set({ status: next, updatedAt: new Date() }).where(eq(leads.id, id));

  // Хроніка: клієнт бачить, що саме сталося, а не лише підсвічену стадію
  await addEvent(id, { status: next });

  // Ремонт завершено — пристрій потрапляє в список клієнта з гарантією
  if (next === "done") {
    const lead = await getLeadById(id);
    if (lead) await registerDevice(lead);
  }

  revalidatePath("/admin");
  revalidatePath("/moi-remonty");
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
