import { getLeadById } from "@/db/events";
import { isAdmin } from "@/lib/admin";
import { site } from "@/data/site";
import type { Lead } from "@/db/schema";

/**
 * Квитанція про прийом у ремонт — окремий документ для друку.
 *
 * Навмисно не сторінка застосунку: у квитанції не має бути ні меню, ні
 * підвалу, ні темної теми. Самодостатній HTML друкується однаково з будь-якого
 * браузера й не залежить від стилів сайту.
 *
 * Дві половини на аркуші: одна лишається клієнту, друга — у сервісі.
 */

const esc = (v: unknown) =>
  String(v ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

const dateFormat = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const uah = (n: number) => `${n.toLocaleString("uk-UA")} ₴`;

function half(lead: Lead, copy: string): string {
  const rows: [string, string][] = [
    ["Клієнт", esc(lead.name)],
    ["Телефон", esc(lead.phone ?? "—")],
    ["Пристрій", esc(lead.model ?? "—")],
    ["Послуга", esc(lead.service ?? "—")],
    ["Несправність зі слів клієнта", esc(lead.problem ?? "—")],
    ["Прийнято", esc(dateFormat.format(lead.createdAt))],
  ];

  // Ціна може бути ще не визначена: діагностика безкоштовна, ціна після неї
  const price = lead.price ? uah(lead.price) : "після діагностики, за погодженням";
  const prepaid = lead.prepayment ? uah(lead.prepayment) : null;

  return `
  <section class="half">
    <div class="top">
      <div>
        <div class="brand">${esc(site.name)}</div>
        <div class="muted">${esc(site.tagline)}</div>
      </div>
      <div class="right">
        <div class="no">№&thinsp;${lead.orderNo}</div>
        <div class="muted">${esc(copy)}</div>
      </div>
    </div>

    <table>
      ${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}
      <tr><th>Вартість робіт</th><td><b>${price}</b></td></tr>
      ${prepaid ? `<tr><th>Передоплата</th><td>${prepaid}</td></tr>` : ""}
    </table>

    <ul class="terms">
      <li>Діагностика безкоштовна. Ціну погоджуємо до початку робіт і далі не змінюємо.</li>
      <li>Ремонт виконується за передоплатою вартості деталі.</li>
      <li>Гарантія ${site.warrantyDays} днів на виконану роботу й встановлену деталь.</li>
      <li>Гарантія не поширюється на механічні пошкодження та потрапляння вологи після ремонту.</li>
      <li>Пристрій зберігається 90 днів після повідомлення про готовність.</li>
    </ul>

    <div class="signs">
      <div class="sign"><span>Прийняв майстер</span></div>
      <div class="sign"><span>Клієнт, підпис</span></div>
    </div>

    <div class="foot">
      ${site.phones.map((p) => esc(p.label)).join(" · ")} · ${esc(site.hours)}
    </div>
  </section>`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response("Немає доступу", { status: 403 });

  const lead = await getLeadById((await params).id);
  if (!lead) return new Response("Заявку не знайдено", { status: 404 });

  const html = `<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Квитанція №${lead.orderNo} — ${esc(site.name)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 12mm;
    background: #f4f4f5;
    color: #111;
    font: 13px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  .sheet { max-width: 190mm; margin: 0 auto; }
  .half {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 8mm;
    margin-bottom: 6mm;
  }
  .cut {
    border: 0;
    border-top: 1px dashed #bbb;
    margin: 0 0 6mm;
  }
  .top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
  .brand { font-size: 20px; font-weight: 700; letter-spacing: -.02em; }
  .right { text-align: right; }
  .no { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .muted { color: #666; font-size: 11.5px; }
  table { width: 100%; border-collapse: collapse; margin: 6mm 0; }
  th, td { text-align: left; vertical-align: top; padding: 4px 0; font-weight: 400; }
  th { width: 62mm; color: #666; font-size: 12px; padding-right: 8px; }
  .terms { margin: 0 0 6mm; padding-left: 16px; color: #333; font-size: 11.5px; }
  .terms li { margin-bottom: 2px; }
  .signs { display: flex; gap: 12mm; margin-bottom: 5mm; }
  .sign { flex: 1; border-top: 1px solid #999; padding-top: 3px; }
  .sign span { color: #666; font-size: 11px; }
  .foot { color: #666; font-size: 11px; }
  .print {
    display: block;
    margin: 0 auto 6mm;
    padding: 10px 20px;
    border: 0;
    border-radius: 999px;
    background: #111;
    color: #fff;
    font: inherit;
    cursor: pointer;
  }
  @media print {
    body { padding: 0; background: #fff; }
    .half { border: 0; border-radius: 0; padding: 6mm 0; margin: 0; }
    .print { display: none; }
    .cut { margin: 0; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <button class="print" onclick="window.print()">Друкувати</button>
    ${half(lead, "примірник клієнта")}
    <hr class="cut">
    ${half(lead, "примірник сервісу")}
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
