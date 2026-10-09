"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function send(event: Record<string, string | undefined>) {
  // Автотести й керовані браузери — не відвідувачі, і в базу писати не повинні
  if (navigator.webdriver) return;

  // keepalive: клік по посиланню встигає долетіти, хоча сторінка вже йде
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Анонімна статистика: перегляд на кожен перехід і кліки на елементи
 * з data-track. Без cookie; адмінку не рахуємо.
 */
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    send({
      kind: "view",
      path: pathname,
      ref: document.referrer || undefined,
      utm: new URLSearchParams(location.search).get("utm_source") ?? undefined,
    });
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-track]");
      const name = el?.getAttribute("data-track");
      if (!name || location.pathname.startsWith("/admin")) return;
      send({ kind: "click", path: location.pathname, name });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
