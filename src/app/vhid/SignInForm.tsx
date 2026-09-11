"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import styles from "./page.module.css";

type Step = "email" | "code";

/** Clerk не знає наперед, чи клієнт уже реєструвався — тому пробуємо вхід,
 *  а на «такого користувача немає» перемикаємось на реєстрацію. */
export default function SignInForm() {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(value)) {
      setError("Перевірте адресу пошти — здається, у ній помилка.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const { error: signInError } = await signIn.emailCode.sendCode({ emailAddress: value });

      if (signInError) {
        // Немає такого користувача — реєструємо
        await signUp.create({ emailAddress: value, ...(name.trim() ? { firstName: name.trim() } : {}) });
        const { error: signUpError } = await signUp.verifications.sendEmailCode();
        if (signUpError) throw signUpError;
        setIsNew(true);
      }

      setStep("code");
    } catch {
      setError("Не вдалося надіслати код. Спробуйте ще раз або зателефонуйте нам.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = code.trim();
    if (value.length < 6) {
      setError("Код складається з 6 цифр.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      if (isNew) {
        await signUp.verifications.verifyEmailCode({ code: value });
        if (signUp.status !== "complete") throw new Error("incomplete");
        await signUp.finalize({ navigate: () => router.push("/kabinet") });
      } else {
        await signIn.emailCode.verifyCode({ code: value });
        if (signIn.status !== "complete") throw new Error("incomplete");
        await signIn.finalize({ navigate: () => router.push("/kabinet") });
      }
    } catch {
      setError("Код не підійшов. Перевірте останній лист або надішліть код ще раз.");
      setBusy(false);
    }
  };

  const restart = () => {
    setStep("email");
    setCode("");
    setError("");
    setIsNew(false);
  };

  if (step === "code") {
    return (
      <div className={styles.card}>
        <form onSubmit={verify} className={styles.form} noValidate>
          <p className={styles.sentTo}>
            Надіслали код на <strong>{email}</strong>
          </p>

          <div className={styles.row}>
            <label htmlFor="v-code">Код із листа</label>
            <input
              id="v-code"
              className={`field ${styles.codeField}`}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="······"
              value={code}
              autoFocus
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
            />
            <span className={styles.hint}>Лист іде до хвилини. Гляньте теку «Спам», якщо не видно.</span>
          </div>

          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-accent btn-lg" disabled={busy}>
            {busy ? "Перевіряємо…" : "Увійти"}
          </button>

          <div className={styles.actions}>
            <button type="button" className={styles.linkBtn} onClick={restart} disabled={busy}>
              Змінити пошту
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <form onSubmit={sendCode} className={styles.form} noValidate>
        <div className={styles.row}>
          <label htmlFor="v-email">Пошта</label>
          <input
            id="v-email"
            className="field"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />
        </div>

        <div className={styles.row}>
          <label htmlFor="v-name">Ім&apos;я — якщо заходите вперше</label>
          <input
            id="v-name"
            className="field"
            type="text"
            autoComplete="given-name"
            placeholder="Як до вас звертатись"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {/* Сюди Clerk монтує Smart CAPTCHA — без цього елемента він падає на invisible-варіант */}
        <div id="clerk-captcha" />

        <button type="submit" className="btn btn-accent btn-lg" disabled={busy}>
          {busy ? "Надсилаємо…" : "Надіслати код"}
        </button>

        <p className={styles.note}>
          Пароль не потрібен — надішлемо код на пошту. Адресу використовуємо лише для входу.
        </p>
      </form>
    </div>
  );
}
