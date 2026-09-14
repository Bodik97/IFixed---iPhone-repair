"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { bookingModels } from "@/data/landing";
import { askContacts, done, greeting, symptoms, type Symptom } from "@/data/botScript";
import { site } from "@/data/site";
import FormError from "./FormError";
import styles from "./ChatBot.module.css";

type Line = { from: "bot" | "me"; text: string };

/** Пауза перед відповіддю помічника — щоб репліки не з'являлись усі разом */
const TYPING_MS = 550;

export default function ChatBot() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([{ from: "bot", text: greeting }]);
  const [step, setStep] = useState<"symptom" | "model" | "contacts" | "sent">("symptom");
  const [typing, setTyping] = useState(false);

  const [symptom, setSymptom] = useState<Symptom | null>(null);
  const [model, setModel] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  // Нова репліка має бути видно без прокрутки вручну
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [lines, step, typing]);

  // В адмінці й на сторінці клієнта помічник зайвий: там є справжній чат
  if (pathname.startsWith("/admin") || pathname.startsWith("/moi-remonty")) return null;

  const say = (text: string) => {
    setTyping(true);
    setTimeout(() => {
      setLines((l) => [...l, { from: "bot", text }]);
      setTyping(false);
    }, TYPING_MS);
  };

  const pickSymptom = (s: Symptom) => {
    setSymptom(s);
    setLines((l) => [...l, { from: "me", text: s.label }]);
    say(s.reply);
    setTimeout(() => {
      setStep("model");
      say("Яка у вас модель?");
    }, TYPING_MS + 100);
  };

  const pickModel = (value: string) => {
    setModel(value);
    setLines((l) => [...l, { from: "me", text: value }]);
    setStep("contacts");
    say(askContacts);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim();
    const digits = phone.replace(/\D/g, "");

    if (cleanName.length < 2) {
      setError("Впишіть, будь ласка, імʼя — щоб майстер знав, як до вас звертатись.");
      return;
    }
    if (digits.length < 9) {
      setError("Перевірте номер телефону — здається, у ньому бракує цифр.");
      return;
    }

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          phone: phone.trim(),
          model,
          service: symptom?.service ?? "",
          problem: symptom ? `Через помічника на сайті: ${symptom.label}` : "Через помічника на сайті",
          source: "landing",
        }),
      });
      if (!res.ok) throw new Error(String(res.status));

      setLines((l) => [...l, { from: "me", text: `${cleanName}, ${phone.trim()}` }]);
      setStep("sent");
      say(done);
    } catch {
      setError(`Не вдалося надіслати. Зателефонуйте, будь ласка: ${site.phones[0].label}`);
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className={styles.launcher} onClick={() => setOpen(true)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5h16v11H9l-5 4z" />
        </svg>
        <span className={styles.launcherLabel}>Підібрати ремонт</span>
      </button>
    );
  }

  return (
    <section className={styles.panel} aria-label="Помічник підбору ремонту">
      <header className={styles.head}>
        <div>
          <div className={styles.title}>Помічник iFix</div>
          {/* Чесно кажемо, що це не людина */}
          <div className={styles.subtitle}>Відповідає автоматично · майстер передзвонить</div>
        </div>

        <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Закрити помічника">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        </button>
      </header>

      <div className={styles.list} ref={listRef}>
        {lines.map((l, i) => (
          <div key={i} className={l.from === "me" ? styles.me : styles.bot}>
            {l.text}
          </div>
        ))}

        {typing && (
          <div className={styles.typing} aria-label="Помічник друкує">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <div className={styles.foot}>
        {step === "symptom" && !typing && (
          <div className={styles.chips}>
            {symptoms.map((s) => (
              <button key={s.id} type="button" className={styles.chip} onClick={() => pickSymptom(s)}>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {step === "model" && !typing && (
          <div className={styles.chips}>
            {bookingModels.slice(0, 6).map((m) => (
              <button key={m} type="button" className={styles.chip} onClick={() => pickModel(m)}>
                {m}
              </button>
            ))}
            <button type="button" className={styles.chip} onClick={() => pickModel("Інша модель")}>
              Інша модель
            </button>
          </div>
        )}

        {step === "contacts" && (
          <form className={styles.form} onSubmit={send}>
            <label htmlFor="bot-name" className="visually-hidden">
              Імʼя
            </label>
            <input
              id="bot-name"
              className="field"
              type="text"
              placeholder="Як до вас звертатись"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />

            <label htmlFor="bot-phone" className="visually-hidden">
              Телефон
            </label>
            <input
              id="bot-phone"
              className="field"
              type="tel"
              inputMode="tel"
              placeholder="+380 __ ___ __ __"
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError("");
              }}
            />

            <FormError>{error}</FormError>

            <button type="submit" className="btn btn-accent btn-lg" disabled={sending}>
              {sending ? "Надсилаємо…" : "Хай передзвонять"}
            </button>
          </form>
        )}

        {step === "sent" && (
          <a href={site.phones[0].href} className="btn btn-ghost">
            Або подзвоніть самі: {site.phones[0].label}
          </a>
        )}
      </div>
    </section>
  );
}
