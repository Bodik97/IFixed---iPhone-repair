"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Що з'являється при прокрутці: заголовки й картки у смугах, плюс позначене вручну */
const TARGETS = ".band h2, .band .card, [data-reveal]";

/**
 * М'яка поява блоків, коли до них догортали — одна на весь сайт.
 *
 * Ховаємо лише те, що на момент завантаження нижче екрана: видиме не блимає.
 * Якщо скрипт не запустився, нічого не сховано — вміст на місці.
 */
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: number[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          io.unobserve(el);
          el.classList.add("rv-in");
          // Після появи прибираємо свої класи й затримку: далі елемент живе
          // власними переходами (наведення на картку не має чекати)
          timers.push(
            window.setTimeout(() => {
              el.classList.remove("rv", "rv-in");
              el.style.transitionDelay = "";
            }, 1100),
          );
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );

    const fold = window.innerHeight;
    document.querySelectorAll<HTMLElement>(TARGETS).forEach((el) => {
      if (el.getBoundingClientRect().top < fold) return;

      // Сусідні картки виходять каскадом, але не довше чотирьох кроків
      const order = Array.from(el.parentElement?.children ?? []).filter((c) => c.matches(TARGETS)).indexOf(el);
      el.style.transitionDelay = `${Math.min(order, 4) * 70}ms`;
      el.classList.add("rv");
      io.observe(el);
    });

    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
      document.querySelectorAll<HTMLElement>(".rv").forEach((el) => {
        el.classList.remove("rv", "rv-in");
        el.style.transitionDelay = "";
      });
    };
  }, [pathname]);

  return null;
}
