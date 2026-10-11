"use client";

import { Suspense, useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import { site } from "@/data/site";
import FormError from "./FormError";
import styles from "./BookingForm.module.css";
import TelegramConnect from "@/components/TelegramConnect";
import PhoneInput, { phoneComplete } from "./PhoneInput";
import { LIMITS, onlyLetters, plainText, validName } from "@/lib/validate";

export type LeadSource = "landing" | "model" | "services" | "mail-in";

type Props = {
  source: LeadSource;
  /** Випадний список: моделі на лендінгу, послуги на /poslugy */
  select?: { name: "model" | "service"; label: string; placeholder: string; options: string[] };
  /** Модель уже відома (сторінка моделі) — списку немає, значення йде в заявку як є */
  model?: string;
  submitLabel?: string;
  /** Початковий вибір, коли він відомий наперед — напр. у вікні запису */
  initialChoice?: string;
  /** У модальному вікні рамку дає саме вікно — друга не потрібна */
  bare?: boolean;
  /** Форма з кнопки: лише імʼя й телефон, решта — за посиланням «Додати деталі» */
  simple?: boolean;
  /** Підзаголовок над полями форми на сторінці: що вписати й що буде далі */
  subtitle?: string;
};

function BookingFormInner({
  source,
  select,
  model,
  submitLabel = "Записатись на безкоштовну діагностику",
  initialChoice = "",
  bare,
  simple = false,
  subtitle = "Впишіть імʼя й телефон — передзвонимо за 25 хвилин. Модель і опис допоможуть одразу назвати ціну.",
}: Props & { initialChoice?: string }) {
  // Форма буває на сторінці двічі — у тексті й у вікні запису; з однаковими id
  // підпис поля у вікні вів би до поля під ним
  const uid = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [choice, setChoice] = useState(initialChoice);
  const [problem, setProblem] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [telegram, setTelegram] = useState<string | null>(null);
  // Обовʼязкові лише імʼя й телефон. У простій формі решта ховається, щоб не
  // лякати; відкрита одразу, коли послугу вже обрали кнопкою на сайті
  const [details, setDetails] = useState(!simple || Boolean(initialChoice));

  const reset = () => {
    setName("");
    setPhone("");
    setChoice("");
    setProblem("");
    setError("");
    setSent(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameOk = validName(name);
    const phoneOk = phoneComplete(phone);
    if (!nameOk || !phoneOk) {
      setError(
        !nameOk && !phoneOk
          ? "Вкажіть ім'я та телефон повністю — решту з'ясуємо в розмові."
          : !nameOk
            ? "Впишіть ім'я — лише літери, щонайменше дві."
            : "Допишіть номер телефону: після +38 — десять цифр.",
      );
      return;
    }

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          problem,
          source,
          ...(select ? { [select.name]: choice } : {}),
          ...(model ? { model } : {}),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setTelegram((await res.json().catch(() => null))?.telegram ?? null);
      setSent(true);
    } catch {
      setError("Не вдалося надіслати. Зателефонуйте, будь ласка: " + site.phones[0].label);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className={bare ? styles.boxBare : styles.box}>
        <div className={styles.done}>
          <svg className={styles.doneMark} width="42" height="42" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--accent-text)" }} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" pathLength="1" />
            <path d="M8 12.5l2.5 2.5L16 9.5" pathLength="1" />
          </svg>
          <h3>Заявку прийнято</h3>
          <p className={styles.doneText}>
            Передзвонимо протягом 25 хвилин у робочі години. Якщо терміново — {site.phones[0].label}.
          </p>
          <TelegramConnect href={telegram} />
          <button type="button" onClick={reset} className="btn btn-ghost">
            Надіслати ще одну
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={bare ? styles.boxBare : styles.box}>
      <form onSubmit={submit} className={styles.form} noValidate>
        {!bare && <p className={styles.sub}>{subtitle}</p>}

        <div className={styles.row}>
          <label htmlFor={`${uid}-name`}>Ім&apos;я</label>
          <input
            id={`${uid}-name`}
            className="field"
            type="text"
            autoComplete="name"
            placeholder="Як до вас звертатись"
            value={name}
            maxLength={LIMITS.name.max}
            onChange={(e) => {
              setName(onlyLetters(e.target.value));
              setError("");
            }}
          />
        </div>

        <div className={styles.row}>
          <label htmlFor={`${uid}-phone`}>Телефон</label>
          <PhoneInput
            id={`${uid}-phone`}
            value={phone}
            onChange={(v) => {
              setPhone(v);
              setError("");
            }}
          />
        </div>

        {!details && (
          <button type="button" className={styles.more} onClick={() => setDetails(true)}>
            Додати деталі — необов&apos;язково
          </button>
        )}

        {details && select && (
          <div className={styles.row}>
            <label htmlFor={`${uid}-choice`}>{select.label}</label>
            <select
              id={`${uid}-choice`}
              className="field"
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
            >
              <option value="">{select.placeholder}</option>
              {select.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        )}

        {details && (
          <div className={styles.row}>
            <label htmlFor={`${uid}-problem`}>Що трапилось</label>
            <textarea
              id={`${uid}-problem`}
              className={`field ${styles.textarea}`}
              placeholder="Наприклад: розбитий екран, не тримає заряд"
              value={problem}
              maxLength={LIMITS.problem}
              onChange={(e) => setProblem(plainText(e.target.value, LIMITS.problem, true))}
            />
          </div>
        )}

        <FormError>{error}</FormError>

        <button type="submit" className="btn btn-accent btn-lg" disabled={sending}>
          {sending ? "Надсилаємо…" : submitLabel}
        </button>

        <p className={styles.note}>
          Передзвонимо за 25 хвилин у робочий час. Діагностика безкоштовна.{" "}
          <a href="/personalni-dani" target="_blank" rel="noopener">
            Як ми зберігаємо дані
          </a>
        </p>
      </form>
    </div>
  );
}

/** Дістає вибір із адреси: ?service=… або ?model=… від картки на сайті */
function BookingFormWithChoice(props: Props) {
  const params = useSearchParams();
  // Значення з властивості важливіше за адресу: вікно відкрили з конкретної кнопки
  const choice = props.initialChoice || (props.select ? (params.get(props.select.name) ?? "") : "");
  return <BookingFormInner {...props} initialChoice={choice} />;
}

export default function BookingForm(props: Props) {
  // Запасний варіант — та сама форма без підстановки. Так розмітка потрапляє
  // в статичний пререндер, а підстановка додається вже на клієнті.
  return (
    <Suspense fallback={<BookingFormInner {...props} />}>
      <BookingFormWithChoice {...props} />
    </Suspense>
  );
}
