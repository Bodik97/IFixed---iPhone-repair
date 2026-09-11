"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, reviews } from "@/db/schema";
import { STATUS_OPTIONS } from "@/db/leads";
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

  await getDb()
    .update(leads)
    .set({ status: status as (typeof allowed)[number], updatedAt: new Date() })
    .where(eq(leads.id, id));

  revalidatePath("/admin");
  revalidatePath("/kabinet");
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

  revalidatePath("/admin");
  revalidatePath("/kabinet");
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
