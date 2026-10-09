"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** «до 2», «30», «6 000 ₴» → текст до числа, саме число, текст після й роздільник тисяч */
function parse(value: string) {
  const m = value.match(/^(\D*)(\d[\d\s  ]*\d|\d)(.*)$/);
  if (!m) return null;
  const sep = m[2].match(/[\s  ]/)?.[0] ?? "";
  return { before: m[1], n: Number(m[2].replace(/\D/g, "")), after: m[3], sep };
}

const group = (n: number, sep: string) => (sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(n));

/**
 * Число, що «добігає» до свого значення: від нуля, коли вперше потрапляє на
 * екран, і від попереднього, коли значення міняється (ціни «Аналог / Оригінал»).
 *
 * Сервер віддає одразу готове значення — без скриптів і для пошуковика текст
 * правильний. Тим, хто просив менше руху, число просто підставляється.
 */
export default function CountUp({ value }: { value: string }) {
  const parsed = parse(value);
  const target = parsed?.n ?? 0;

  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(false);
  const last = useRef(target);
  const [n, setN] = useState(target);

  const run = useCallback((from: number, to: number, ms: number) => {
    const still = from === to || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = requestAnimationFrame(function step(now) {
      const k = still ? 1 : Math.min(1, (now - start) / ms);
      // Швидко на початку, м'яко наприкінці — число «сідає» на місце
      setN(Math.round(from + (to - from) * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Перша поява на екрані
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let stop = () => {};
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        shown.current = true;
        stop = run(0, last.current, 900);
      },
      { threshold: 0.6 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      stop();
    };
  }, [run]);

  // Значення змінилось уже на екрані
  useEffect(() => {
    const from = last.current;
    last.current = target;
    if (!shown.current || from === target) return;
    return run(from, target, 450);
  }, [target, run]);

  if (!parsed) return <>{value}</>;

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {parsed.before}
      {group(n, parsed.sep)}
      {parsed.after}
    </span>
  );
}
