import { getPaidLeads } from "@/db/adminStats";
import { isAdmin } from "@/lib/admin";
import { isPeriod, periodRange } from "../period";

/** Один стовпчик CSV: лапки подвоюємо, бо всередині може бути «;» або перенос */
function cell(v: string | number | null): string {
  if (v === null) return "";
  return `"${String(v).replace(/"/g, '""')}"`;
}

const date = new Intl.DateTimeFormat("uk-UA", { dateStyle: "short" });

/**
 * Вивантаження оплачених робіт за період.
 *
 * Крапка з комою й BOM — щоб Excel відкривав файл одразу по стовпчиках,
 * а кирилиця не перетворювалась на кракозябри.
 */
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Немає доступу", { status: 403 });

  const raw = new URL(request.url).searchParams.get("period") ?? "month";
  const period = isPeriod(raw) ? raw : "month";
  const { from, to } = periodRange(period);

  const rows = await getPaidLeads(from, to);

  const head = ["Номер", "Оплачено", "Клієнт", "Телефон", "Модель", "Послуга", "Ціна", "Деталі", "Передоплата", "Чистими"];
  const body = rows.map((r) => {
    const price = r.price ?? 0;
    const cost = r.partsCost ?? 0;
    return [
      cell(r.orderNo),
      cell(r.paidAt ? date.format(r.paidAt) : ""),
      cell(r.name),
      cell(r.phone),
      cell(r.model),
      cell(r.service),
      cell(price),
      cell(cost),
      cell(r.prepayment ?? 0),
      cell(price - cost),
    ].join(";");
  });

  const csv = "﻿" + [head.map(cell).join(";"), ...body].join("\r\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ifix-kasa-${period}.csv"`,
      "cache-control": "no-store",
    },
  });
}
