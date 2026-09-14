import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { reviews } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * Фото роботи з відгуку.
 *
 * Сховище приватне, тож файл віддаємо самі. Перевірки прав тут немає
 * навмисно: відгук публічний, і фото — його частина. Але показуємо лише для
 * опублікованих відгуків, щоб чернетка не витекла разом із посиланням.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [review] = await getDb().select().from(reviews).where(eq(reviews.id, id)).limit(1);
  if (!review || !review.published || !review.imagePath) {
    return new NextResponse("Не знайдено", { status: 404 });
  }

  const file = await get(review.imagePath, { access: "private" }).catch(() => null);
  if (!file || file.statusCode !== 200 || !file.stream) {
    return new NextResponse("Не знайдено", { status: 404 });
  }

  return new NextResponse(file.stream, {
    headers: {
      "Content-Type": file.blob.contentType ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
