import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fake } from "./helpers/fakeDb";
import { leads, telegramChats, type Lead } from "@/db/schema";

/**
 * Бот для клієнтів. Головне: чат закріплюється лише за посиланням із нашим
 * підписом, статус іде тільки тому, хто підключився, а збій Telegram не
 * ламає зміну статусу в адмінці.
 */

vi.mock("@/db", async () => {
  const { fake } = await import("./helpers/fakeDb");
  return { getDb: () => fake.db };
});

import * as bot from "@/lib/clientBot";
import { POST } from "@/app/api/telegram/client/route";

const LEAD = {
  id: "11111111-1111-1111-1111-111111111111",
  orderNo: 1001,
  name: "Олег",
  phone: "073 315 02 38",
  clerkUserId: null,
  model: "iPhone 13",
  service: null,
  status: "ready",
  ttn: null,
} as unknown as Lead;

const CHAT = { id: "c1", subject: "t733150238", chatId: "555", createdAt: new Date() };

let sent: { chat_id: string; text: string }[] = [];
let telegramStatus = 200;

beforeEach(() => {
  fake.reset();
  sent = [];
  telegramStatus = 200;
  vi.stubEnv("TELEGRAM_CLIENT_BOT_TOKEN", "123:token");
  vi.stubEnv("TELEGRAM_CLIENT_BOT_USERNAME", "@GadgetFixStatusBot");
  vi.stubGlobal("fetch", async (_url: string, init: { body: string }) => {
    sent.push(JSON.parse(init.body));
    return new Response("{}", { status: telegramStatus });
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const payloadOf = (link: string) => new URL(link).searchParams.get("start")!;

describe("посилання на бота", () => {
  it("закріплює чат за телефоном, як би його не записали", () => {
    expect(bot.subjectOf(LEAD)).toBe("t733150238");
    expect(bot.subjectOf({ ...LEAD, phone: "+380733150238" })).toBe("t733150238");
  });

  it("без телефону — за акаунтом, без акаунта — за заявкою", () => {
    expect(bot.subjectOf({ ...LEAD, phone: null, clerkUserId: "user_2abc" })).toBe("uuser_2abc");
    expect(bot.subjectOf({ ...LEAD, phone: null })).toBe("l11111111111111111111111111111111");
  });

  it("веде в бота й уміщається в ліміт Telegram на параметр start", () => {
    const link = bot.connectLink({ ...LEAD, phone: null, clerkUserId: "user_2abcdefghijklmnopqrstuvwxyz0" })!;
    expect(link.startsWith("https://t.me/GadgetFixStatusBot?start=")).toBe(true);
    expect(payloadOf(link)).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
  });

  it("підпис звіряється: своє посилання читається, підроблене — ні", () => {
    const payload = payloadOf(bot.connectLink(LEAD)!);
    expect(bot.readStart(payload)).toBe("t733150238");
    expect(bot.readStart(payload.replace("t733150238", "t501234567"))).toBeNull();
    expect(bot.readStart("t733150238")).toBeNull();
  });

  it("бот не налаштований — посилання немає", () => {
    vi.stubEnv("TELEGRAM_CLIENT_BOT_TOKEN", "");
    expect(bot.connectLink(LEAD)).toBeNull();
    expect(bot.clientBotReady()).toBe(false);
  });
});

describe("повідомлення про статус", () => {
  it("у тексті номер, пристрій, етап і накладна для відправленого", () => {
    const text = bot.statusText({ ...LEAD, status: "shipped", ttn: "20450000000000" });
    expect(text).toContain("Замовлення №1001 — Відправлено");
    expect(text).toContain("iPhone 13");
    expect(text).toContain("20450000000000");
  });

  it("іде в чат клієнта, який підключив бота", async () => {
    fake.onSelect(telegramChats, () => [CHAT]);
    expect(await bot.notifyClientStatus(LEAD)).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0].chat_id).toBe("555");
    expect(sent[0].text).toContain("Готово");
  });

  it("не підключив — нічого не шлемо", async () => {
    expect(await bot.notifyClientStatus(LEAD)).toBe(false);
    expect(sent).toHaveLength(0);
  });

  it("про «Нову» не пишемо — клієнт щойно сам лишив заявку", async () => {
    fake.onSelect(telegramChats, () => [CHAT]);
    expect(await bot.notifyClientStatus({ ...LEAD, status: "new" })).toBe(false);
    expect(sent).toHaveLength(0);
  });

  it("клієнт зупинив бота — запис прибираємо", async () => {
    fake.onSelect(telegramChats, () => [CHAT]);
    telegramStatus = 403;
    expect(await bot.notifyClientStatus(LEAD)).toBe(false);
    expect(fake.writes().some((q) => /^delete from "telegram_chats"/.test(q.sql))).toBe(true);
  });

  it("Telegram недоступний — помилка не виходить назовні", async () => {
    fake.onSelect(telegramChats, () => [CHAT]);
    vi.stubGlobal("fetch", async () => {
      throw new Error("network");
    });
    expect(await bot.notifyClientStatus(LEAD)).toBe(false);
  });
});

describe("webhook бота", () => {
  const update = (text: string, type = "private") =>
    new Request("http://localhost/api/telegram/client", {
      method: "POST",
      headers: { "x-telegram-bot-api-secret-token": bot.webhookSecret()! },
      body: JSON.stringify({ message: { text, chat: { id: 555, type } } }),
    });

  it("без секрету Telegram запит відхиляється", async () => {
    const res = await POST(new Request("http://localhost/api/telegram/client", { method: "POST", body: "{}" }));
    expect(res.status).toBe(403);
    expect(fake.writes()).toHaveLength(0);
  });

  it("Start за нашим посиланням закріплює чат і підтверджує клієнту", async () => {
    const res = await POST(update(`/start ${payloadOf(bot.connectLink(LEAD)!)}`));
    expect(res.status).toBe(200);

    const [insert] = fake.writes();
    expect(insert.sql).toMatch(/^insert into "telegram_chats"/);
    expect(insert.params).toEqual(expect.arrayContaining(["t733150238", "555"]));
    expect(sent[0].text).toContain("статуси підключено");
  });

  it("Start без посилання чи з підробленим нічого не закріплює", async () => {
    await POST(update("/start"));
    await POST(update("/start t501234567-00000000000000000000"));
    expect(fake.writes()).toHaveLength(0);
    expect(sent).toHaveLength(2);
  });

  it("«Перевірити статус» показує незакриті ремонти того, хто пише", async () => {
    fake.onSelect(telegramChats, () => [CHAT]);
    fake.onSelect(leads, () => [
      { ...LEAD, orderNo: 1003, status: "in_progress", createdAt: new Date() },
      { ...LEAD, orderNo: 1002, status: "done", createdAt: new Date() },
    ]);

    await POST(update(bot.CHECK_BUTTON));

    expect(sent).toHaveLength(1);
    expect(sent[0].text).toContain("№1003 — У роботі");
    expect(sent[0].text).not.toContain("№1002");
    // Шукаємо лише заявки з телефону, за яким закріплений чат
    expect(fake.queries.some((q) => /from "leads"/.test(q.sql) && q.params.includes("733150238"))).toBe(true);
  });

  it("усе закрито — показує останню заявку", async () => {
    fake.onSelect(telegramChats, () => [CHAT]);
    fake.onSelect(leads, () => [{ ...LEAD, orderNo: 1002, status: "done", createdAt: new Date() }]);

    await POST(update("/status"));
    expect(sent[0].text).toContain("№1002 — Завершено");
  });

  it("чат не підключений — чужих заявок не шукаємо, пояснюємо, як підключити", async () => {
    await POST(update(bot.CHECK_BUTTON));
    expect(fake.queries.some((q) => /from "leads"/.test(q.sql))).toBe(false);
    expect(sent[0].text).toContain("QR-кодом із квитанції");
  });

  it("у групі бот мовчить", async () => {
    await POST(update(`/start ${payloadOf(bot.connectLink(LEAD)!)}`, "group"));
    expect(fake.writes()).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });
});
