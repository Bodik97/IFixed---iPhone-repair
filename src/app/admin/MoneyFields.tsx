"use client";

import { useRef, useState, useTransition } from "react";
import { setMoney } from "./actions";
import styles from "./MoneyFields.module.css";

type Props = {
  id: string;
  price: number | null;
  partsCost: number | null;
  paidAt: Date | null;
};

const digits = (v: string) => v.replace(/\D/g, "");

export default function MoneyFields({ id, price, partsCost, paidAt }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  // Поля керовані: збереження одного з них перемальовує картку, і некерований
  // input підхопив би старе значення сусіда просто під час набору. Вимикати
  // їх на час збереження теж не можна — disabled-input не потрапляє у
  // FormData, і сусіднє поле приїхало б на сервер порожнім.
  const [priceText, setPriceText] = useState(price?.toString() ?? "");
  const [costText, setCostText] = useState(partsCost?.toString() ?? "");

  // З чим порівнювати, щоб не смикати сервер на кожен вихід із поля
  const saved = useRef({ price: priceText, cost: costText });

  const save = () => {
    saved.current = { price: priceText, cost: costText };
    startTransition(() => formRef.current?.requestSubmit());
  };

  const profit = (Number(priceText) || 0) - (Number(costText) || 0);
  const hasMoney = priceText !== "" || costText !== "";

  return (
    <form ref={formRef} action={setMoney} className={styles.form} aria-busy={pending}>
      <input type="hidden" name="id" value={id} />

      <div className={styles.field}>
        <label htmlFor={`price-${id}`} className={styles.label}>
          Ціна клієнту
        </label>
        <input
          id={`price-${id}`}
          name="price"
          type="text"
          inputMode="numeric"
          value={priceText}
          placeholder="₴"
          className={styles.input}
          onChange={(e) => setPriceText(digits(e.target.value))}
          onBlur={() => priceText !== saved.current.price && save()}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={`cost-${id}`} className={styles.label}>
          Деталь
        </label>
        <input
          id={`cost-${id}`}
          name="partsCost"
          type="text"
          inputMode="numeric"
          value={costText}
          placeholder="₴"
          className={styles.input}
          onChange={(e) => setCostText(digits(e.target.value))}
          onBlur={() => costText !== saved.current.cost && save()}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Прибуток</span>
        <output className={profit < 0 ? styles.profitBad : styles.profit}>
          {hasMoney ? `${profit.toLocaleString("uk-UA")} ₴` : "—"}
        </output>
      </div>

      <label className={styles.paid}>
        <input
          type="checkbox"
          name="paid"
          defaultChecked={Boolean(paidAt)}
          onChange={save}
        />
        Оплачено
      </label>
    </form>
  );
}
