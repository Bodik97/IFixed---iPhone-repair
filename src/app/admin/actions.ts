"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, reviews } from "@/db/schema";
import { STATUS_OPTIONS } from "@/db/leads";
import { addEvent, getLeadById, registerDevice } from "@/db/events";
import { checkCredentials, createSession, destroySession, isAdmin } from "@/lib/admin";

export async function signIn(_prev: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  let ok = false;
  try {
    ok = checkCredentials(email, password);
  } catch {
    return "Адмінка не налаштована: немає ADMIN_EMAIL, ADMIN_PASSWORD або ADMIN_SESSION_SECRET.";
  }

  if (!ok) {
    // Невелика затримка, щоб перебір паролів був повільним
    await new Promise((r) => setTimeout(r, 700));
    return "Пошта або пароль не підходять.";
  }

  await createSession();
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
