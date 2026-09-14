"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Reveal.module.css";

/**
 * Показує елемент, коли він доходить до екрана.
 *
 * Кроки процесу так читаються по одному: прогортав — з'явився наступний.
 * Спостерігач вимикається після першої появи: повторна анімація на зворотній
 * прокрутці дратує більше, ніж допомагає.
 */
export default function Reveal({
  children,
  /** Затримка в межах одного ряду, щоб сусідні картки виходили каскадом */
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Запит «менше руху» обробляє CSS: там .hidden одразу видимий,
    // тож окремої гілки в JS не потрібно.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        io.disconnect();
      },
      // Трохи раніше за нижній край: до моменту появи анімація вже почалась
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${shown ? styles.shown : styles.hidden} ${className ?? ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
