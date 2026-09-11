"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { leads } from "@/db/schema";

/**
 * Клієнт просить надіслати готовий пристрій Новою Поштою.
 * Оновлюємо тільки заявку цього клієнта — звідси перевірка clerkUserId у WHERE.
 */
export async function requestDelivery(formData: FormData): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  const id = String(formData.get("id") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  if (!id || address.length < 5) return;

  await getDb()
    .update(leads)
    .set({
      deliveryRequested: true,
      deliveryAddress: address.slice(0, 300),
      updatedAt: new Date(),
    })
    .where(and(eq(leads.id, id), eq(leads.clerkUserId, userId)));

  revalidatePath("/kabinet");
}
