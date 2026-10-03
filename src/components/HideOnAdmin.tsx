"use client";

import { usePathname } from "next/navigation";

/**
 * Ховає частини публічного сайту в адмінці. Підвал серверний і сам не знає,
 * на якій він сторінці, — тож обгортка вирішує за нього.
 */
export default function HideOnAdmin({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith("/admin") ? null : <>{children}</>;
}
