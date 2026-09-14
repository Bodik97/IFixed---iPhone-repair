"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/app/api/chat/[lead]/route";
import FormError from "./FormError";
import styles from "./Chat.module.css";

const stamp = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Поки чат відкритий, перепитуємо сервер. Вебсокет тут — зайва інфраструктура. */
const POLL_MS = 10_000;

type Props = {
  leadId: string;
  /** Хто дивиться — від цього залежить бік бульбашок і підписи */
  side: "client" | "master";
  /** Скільки непрочитаних було на момент рендера сторінки */
  unread?: number;
};

export default function Chat({ leadId, side, unread = 0 }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/${leadId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { messages: ChatMessage[] };
      setMessages(data.messages);
    } catch {
      setError("Не вдалося завантажити листування. Спробуйте пізніше.");
    }
  }, [leadId]);

  // Перше читання — на кліку «відкрити», далі лише опитування за таймером.
  // Виклик load() у тілі ефекту був би синхронним setState на кожен рендер.
  useEffect(() => {
    if (!open) return;

    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [open, load]);

  const openChat = () => {
    setOpen(true);
    load();
  };

  // Нове повідомлення має бути видно без прокрутки вручну
  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || sending) return;

    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/chat/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не вдалося надіслати.");
        return;
      }
      setText("");
      await load();
    } catch {
      setError("Не вдалося надіслати. Перевірте зв'язок.");
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className={`btn btn-ghost ${styles.opener}`} onClick={openChat}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5h16v11H9l-5 4z" />
        </svg>
        {side === "client" ? "Написати майстру" : "Листування"}
        {unread > 0 && <span className={styles.badge}>{unread}</span>}
      </button>
    );
  }

  return (
    <section className={styles.panel} aria-label="Листування з майстром">
      <header className={styles.head}>
        <span className={styles.title}>
          {side === "client" ? "Чат із майстром" : "Чат із клієнтом"}
        </span>
        <button
          type="button"
          className={styles.close}
          onClick={() => setOpen(false)}
          aria-label="Згорнути чат"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        </button>
      </header>

      <div className={styles.list} ref={listRef}>
        {messages === null ? (
          <p className={styles.hint}>Завантажуємо…</p>
        ) : messages.length === 0 ? (
          <p className={styles.hint}>
            {side === "client"
              ? "Питайте що завгодно про свій ремонт — майстер відповість тут."
              : "Клієнт ще нічого не писав. Можете написати першим."}
          </p>
        ) : (
          <ol className={styles.messages}>
            {messages.map((m) => (
              <li key={m.id} className={m.author === side ? styles.mine : styles.theirs}>
                <div className={styles.bubble}>
                  <span className={styles.author}>
                    {m.author === side ? "Ви" : side === "client" ? "Майстер" : "Клієнт"}
                  </span>
                  <p className={styles.text}>{m.text}</p>
                  <time className={styles.time} dateTime={m.at}>
                    {stamp.format(new Date(m.at))}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <form className={styles.form} onSubmit={send}>
        <label htmlFor={`chat-${leadId}`} className="visually-hidden">
          Повідомлення
        </label>
        <textarea
          id={`chat-${leadId}`}
          className={`field ${styles.input}`}
          rows={2}
          placeholder={side === "client" ? "Напишіть питання майстрові…" : "Відповідь клієнту…"}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            // Enter надсилає, Shift+Enter переносить рядок
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e);
            }
          }}
        />

        <button type="submit" className={`btn btn-accent ${styles.send}`} disabled={sending || !text.trim()}>
          {sending ? "…" : "Надіслати"}
        </button>
      </form>

      <FormError>{error}</FormError>
    </section>
  );
}
