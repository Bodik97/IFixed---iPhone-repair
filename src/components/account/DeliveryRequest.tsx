"use client";

import { useState } from "react";
import { requestDelivery } from "@/app/moi-remonty/actions";
import styles from "./DeliveryRequest.module.css";

export default function DeliveryRequest({
  id,
  requested,
  address,
}: {
  id: string;
  requested: boolean;
  address: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (requested) {
    return (
      <div className={styles.done}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DAFF3D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l2.5 2.5L16 9.5" />
        </svg>
        <div>
          Запит на відправку прийнято{address ? <> — {address}</> : null}. Надішлемо накладну, щойно
          передамо посилку.
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className={styles.offer}>
        <div className={styles.offerText}>Не можете заїхати? Надішлемо Новою Поштою за наш кошт.</div>
        <button type="button" className="btn btn-accent" onClick={() => setOpen(true)}>
          Надіслати поштою
        </button>
      </div>
    );
  }

  return (
    <form action={requestDelivery} className={styles.form}>
      <input type="hidden" name="id" value={id} />
      <label htmlFor={`addr-${id}`} className={styles.label}>
        Місто й відділення Нової Пошти
      </label>
      <div className={styles.row}>
        <input
          id={`addr-${id}`}
          name="address"
          className="field"
          type="text"
          required
          minLength={5}
          placeholder="Напр. Тернопіль, відділення 12"
          autoFocus
        />
        <button type="submit" className="btn btn-accent">
          Замовити відправку
        </button>
      </div>
      <button type="button" className={styles.cancel} onClick={() => setOpen(false)}>
        Скасувати
      </button>
    </form>
  );
}
