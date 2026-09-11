"use client";

import { useState } from "react";
import type { Order } from "@/app/api/orders/[no]/route";
import styles from "./StatusCheck.module.css";

export default function StatusCheck() {
  const [orderNo, setOrderNo] = useState("");
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    const n = orderNo.trim();
    setOrder(null);

    if (!n) {
      setMessage("Впишіть номер із квитанції — або просто зателефонуйте нам.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(n)}`);
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Не знайшли таке замовлення.");
        return;
      }
      setOrder(data as Order);
      setMessage("");
    } catch {
      setMessage("Не вдалося перевірити. Спробуйте пізніше або зателефонуйте нам.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="status" className={styles.section}>
      <div className={styles.box}>
        <div>
          <div className="kicker">Статус ремонту</div>
          <h2 className={styles.title}>Телефон уже в нас? Перевірте етап</h2>
          <p className={styles.lead}>Номер замовлення з квитанції — і побачите, що робимо саме зараз.</p>
        </div>

        <div className={styles.form}>
          <label htmlFor="n-order" className={styles.label}>
            Номер замовлення
          </label>
          <input
            id="n-order"
            className="field"
            type="text"
            inputMode="numeric"
            placeholder="напр. 1042"
            value={orderNo}
            onChange={(e) => {
              setOrderNo(e.target.value);
              setMessage("");
              setOrder(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && check()}
          />
          <button type="button" onClick={check} className="btn btn-ghost" disabled={loading}>
            {loading ? "Перевіряємо…" : "Перевірити"}
          </button>

          {message && <div className="info">{message}</div>}

          {order && (
            <div className="info">
              <strong>
                Замовлення №{order.no} · {order.device}
              </strong>
              <div className={styles.stages}>
                {order.stages.map((s, i) => (
                  <span key={s} className={i <= order.stage ? styles.stageDone : styles.stage}>
                    {s}
                  </span>
                ))}
              </div>
              <div>
                {order.work} · готовність {order.eta}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
