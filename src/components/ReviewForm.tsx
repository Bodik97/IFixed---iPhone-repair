"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitReview, type ReviewResult } from "@/app/actions/reviews";
import FormError from "./FormError";
import styles from "./ReviewForm.module.css";

export default function ReviewForm({
  signedIn,
  alreadyLeft,
}: {
  signedIn: boolean;
  alreadyLeft: boolean;
}) {
  const [state, action, pending] = useActionState<ReviewResult | null, FormData>(submitReview, null);
  const [rating, setRating] = useState(5);

  return (
    <div className={styles.box}>
      {!signedIn && (
        <div className={styles.gate}>
          <h3 className={styles.gateTitle}>Ремонтувались у нас?</h3>
          <p className={styles.gateText}>
            Увійдіть у свій акаунт — і зможете лишити відгук. Так ми певні, що пишуть справжні клієнти,
            а не боти.
          </p>
          <Link href="/vhid" className="btn btn-accent">
            Увійти й лишити відгук
          </Link>
        </div>
      )}

      {signedIn &&
        (alreadyLeft || state?.ok ? (
          <div className={styles.thanks}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#DAFF3D" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12.5l2.5 2.5L16 9.5" />
            </svg>
            <h3 className={styles.gateTitle}>Дякуємо за відгук</h3>
            <p className={styles.gateText}>
              {state?.ok
                ? "Опублікуємо його після перевірки — зазвичай того ж дня."
                : "Ви вже лишали відгук про нашу роботу."}
            </p>
          </div>
        ) : (
          <form action={action} className={styles.form}>
            <div className={styles.ratingRow}>
              <span className={styles.label}>Оцінка</span>
              <div className={styles.stars} role="radiogroup" aria-label="Оцінка від 1 до 5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} з 5`}
                    className={n <= rating ? styles.starOn : styles.star}
                    onClick={() => setRating(n)}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
                    </svg>
                  </button>
                ))}
              </div>
              <input type="hidden" name="rating" value={rating} />
            </div>

            <div className={styles.row}>
              <label htmlFor="r-device" className={styles.label}>
                Модель — необовʼязково
              </label>
              <input
                id="r-device"
                name="device"
                type="text"
                className="field"
                placeholder="Напр. iPhone 13"
                maxLength={60}
              />
            </div>

            <div className={styles.row}>
              <label htmlFor="r-text" className={styles.label}>
                Ваш відгук
              </label>
              <textarea
                id="r-text"
                name="text"
                className={`field ${styles.textarea}`}
                placeholder="Що ремонтували, як швидко, чи все чесно пояснили"
                minLength={20}
                maxLength={1000}
                required
              />
            </div>

            {state && !state.ok && <FormError>{state.error}</FormError>}

            <button type="submit" className="btn btn-accent btn-lg" disabled={pending}>
              {pending ? "Надсилаємо…" : "Лишити відгук"}
            </button>

            <p className={styles.note}>
              Публікуємо після перевірки. Показуємо імʼя з вашого профілю й модель — телефон і пошта
              лишаються прихованими.
            </p>
          </form>
        ))}
    </div>
  );
}
