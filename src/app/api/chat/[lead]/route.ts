import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { addMessage, getMessages, markRead, MAX_MESSAGE, ownsLead } from "@/db/messages";
import { isAdmin } from "@/lib/admin";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export type ChatMessage = {
  id: string;
  author: "client" | "master";
  text: string;
  at: string;
};

/**
 * Хто звертається і чи має право до цієї заявки.
 * Майстер має доступ до всіх, клієнт — лише до своїх.
 */
async function authorize(leadId: string): Promise<"client" | "master" | null> {
  if (await isAdmin()) return "master";

  const user = await currentUser();
  if (!user) return null;

  const email = user.primaryEmailAddress?.emailAddress;
  return (await ownsLead(leadId, user.id, email)) ? "client" : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ lead: string }> }) {
  const { lead } = await params;
  const role = await authorize(lead);
  if (!role) return NextResponse.json({ error: "Немає доступу" }, { status: 403 });

  const messages = await getMessages(lead);
  // Відкрили чат — усе від іншого боку вважаємо прочитаним
  await markRead(lead, role);

  return NextResponse.json({
    role,
    messages: messages.map(
      (m): ChatMessage => ({
        id: m.id,
        author: m.author,
        text: m.text,
        at: m.createdAt.toISOString(),
      }),
    ),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ lead: string }> }) {
  const { lead } = await params;

  const limit = rateLimit(`chat:${clientIp(request)}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Забагато повідомлень. Трохи зачекайте." }, { status: 429 });
  }

  const role = await authorize(lead);
  if (!role) return NextResponse.json({ error: "Немає доступу" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { text?: string } | null;
  const text = String(body?.text ?? "").trim();

  if (!text) return NextResponse.json({ error: "Повідомлення порожнє" }, { status: 400 });
  if (text.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: `Задовге повідомлення — максимум ${MAX_MESSAGE} символів.` },
      { status: 400 },
    );
  }

  await addMessage(lead, role, text);
  return NextResponse.json({ ok: true });
}
