"use client";

import { useRef, useState } from "react";
import FormError from "@/components/FormError";
import { shrinkImage, type Shrunk } from "@/lib/shrinkImage";
import { addReview } from "./actions";
import styles from "./AddReview.module.css";

/**
 * Відгук, який майстер заводить сам.
 *
 * Більшість людей дякують усно або в месенджері й до сайту вже не
 * повертаються. Щоб ці слова не пропадали, майстер вносить їх тут — і може
 * докласти фото роботи.
 */
export default function AddReview() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [photo, setPhoto] = useState<Shrunk | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPhoto(await shrinkImage(file));
    } catch {
      setError("Не вдалося підготувати фото.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    form.set("rating", String(rating));
    if (photo) {
      form.set("image", photo.file);
      form.set("width", String(photo.width));
      form.set("height", String(photo.height));
    }

    setBusy(true);
    setError("");
    try {
      const err = await addReview(form);
      if (err) {
        setError(err);
        return;
      }
      formRef.current?.reset();
      setPhoto(null);
      setRating(5);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="btn btn-accent" onClick={() => setOpen(true)}>
        Додати відгук
      </button>
    );
  }

  return (
    <form ref={formRef} className={styles.form} onSubmit={submit}>
      <div className={styles.head}>
        <h3 className={styles.title}>Новий відгук</h3>
        <button type="button" className={styles.cancel} onClick={() => setOpen(false)}>
          Скасувати
        </button>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>Імʼя</span>
          <input name="authorName" className="field" type="text" placeholder="Оксана" required />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Місто</span>
          <input name="city" className="field" type="text" placeholder="Львів" />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Пристрій</span>
          <input name="device" className="field" type="text" placeholder="iPhone 13" />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Оцінка</span>
          <div className={styles.stars} role="group" aria-label="Оцінка">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={n <= rating ? styles.starOn : styles.star}
                aria-pressed={n <= rating}
                aria-label={`${n} з 5`}
                onClick={() => setRating(n)}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Текст відгуку</span>
        <textarea
          name="text"
          className={`field ${styles.textarea}`}
          placeholder="Що саме сказала людина — своїми словами, як почули"
          required
        />
      </label>

      <div className={styles.photoRow}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={(e) => pickPhoto(e.target.files?.[0])}
        />

        <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
          {photo ? "Замінити фото" : "Додати фото роботи"}
        </button>

        {photo && (
          <div className={styles.preview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.preview} alt="Фото роботи" />
            <button type="button" onClick={() => setPhoto(null)} aria-label="Прибрати фото">
              ×
            </button>
          </div>
        )}
      </div>

      <FormError>{error}</FormError>

      <button type="submit" className="btn btn-accent" disabled={busy}>
        {busy ? "Зберігаємо…" : "Опублікувати відгук"}
      </button>
    </form>
  );
}
