"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
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

  const allowed = ["new", "in_progress", "done", "rejected"] as const;
  if (!allowed.includes(status as (typeof allowed)[number])) return;

  await getDb()
    .update(leads)
    .set({ status: status as (typeof allowed)[number], updatedAt: new Date() })
    .where(eq(leads.id, id));

  revalidatePath("/admin");
}
