import { getLeadById } from "@/db/events";
import { isAdmin } from "@/lib/admin";
import { site } from "@/data/site";
import { guessWarrantyDays, warrantyLabel } from "@/data/warranty";

/**
 * Гарантійний талон — документ для друку, який клієнт забирає разом із
 * пристроєм. Як і квитанція, це самодостатній HTML без меню й теми сайту.
 *
 * Друкується лише для виданої заявки з гарантією: дата кінця вже відома.
 */

const esc = (v: unknown) =>
  String(v ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

const dateFormat = new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Kyiv" });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response("Немає доступу", { status: 403 });

  const lead = await getLeadById((await params).id);
  if (!lead) return new Response("Заявку не знайдено", { status: 404 });
  if (lead.status !== "done" || !lead.warrantyUntil) {
    return new Response("Гарантійний талон друкується після видачі пристрою з гарантією", { status: 409 });
  }

  const days = lead.warrantyDays ?? guessWarrantyDays(lead.service ?? lead.problem);
  const from = new Date(lead.warrantyUntil);
  from.setDate(from.getDate() - days);

  const rows: [string, string][] = [
    ["Клієнт", esc(lead.name)],
    ["Телефон", esc(lead.phone ?? "—")],
    ["Пристрій", esc(lead.model ?? "—")],
    ["Виконана робота", esc(lead.service ?? lead.problem ?? "—")],
    ["Дата видачі", esc(dateFormat.format(from))],
    ["Строк гарантії", esc(warrantyLabel(days))],
  ];

  const html = `<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Гарантійний талон №${lead.orderNo} — ${esc(site.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 12mm; background: #f4f4f5; color: #111; font: 13px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  .sheet { max-width: 190mm; margin: 0 auto; background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 10mm; }
  .top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
  .brand { font-size: 20px; font-weight: 700; letter-spacing: -.02em; }
  .right { text-align: right; }
  .no { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .muted { color: #666; font-size: 11.5px; }
  h1 { margin: 8mm 0 0; font-size: 17px; }
  .until { margin: 2mm 0 0; font-size: 15px; }
  table { width: 100%; border-collapse: collapse; margin: 6mm 0; }
  th, td { text-align: left; vertical-align: top; padding: 4px 0; font-weight: 400; }
  th { width: 62mm; color: #666; font-size: 12px; padding-right: 8px; }
  .terms { margin: 0 0 8mm; padding-left: 16px; color: #333; font-size: 12px; }
  .terms li { margin-bottom: 3px; }
  .signs { display: flex; gap: 12mm; margin-bottom: 5mm; }
  .sign { flex: 1; border-top: 1px solid #999; padding-top: 3px; }
  .sign span { color: #666; font-size: 11px; }
  .print { display: block; margin: 0 auto 6mm; padding: 10px 20px; border: 0; border-radius: 999px; background: #111; color: #fff; font: inherit; cursor: pointer; }
  @media print {
    body { padding: 0; background: #fff; }
    .sheet { border: 0; border-radius: 0; padding: 6mm 0; }
    .print { display: none; }
  }
</style>
</head>
<body>
  <button class="print" onclick="window.print()">Друкувати</button>
  <div class="sheet">
    <div class="top">
      <div>
        <div class="brand">${esc(site.name)}</div>
        <div class="muted">${esc(site.tagline)}</div>
      </div>
      <div class="right">
        <div class="no">№&thinsp;${lead.orderNo}</div>
        <div class="muted">гарантійний талон</div>
      </div>
    </div>

    <h1>Гарантія на виконаний ремонт</h1>
    <p class="until">Діє до <b>${esc(dateFormat.format(lead.warrantyUntil))}</b> включно.</p>

    <table>
      ${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}
    </table>

    <ul class="terms">
      <li>Гарантія поширюється на виконану роботу й встановлену деталь, зазначені в цьому талоні.</li>
      <li>Якщо несправність повториться в гарантійний строк, усунемо її безкоштовно.</li>
      <li>Гарантія не діє при механічних пошкодженнях, потраплянні вологи та після втручання іншого сервісу.</li>
      <li>Строк гарантії подовжується на час, який пристрій перебував у гарантійному ремонті.</li>
      <li>Для звернення назвіть номер замовлення або покажіть цей талон.</li>
    </ul>

    <div class="signs">
      <div class="sign"><span>Видав майстер</span></div>
      <div class="sign"><span>Клієнт, підпис</span></div>
    </div>

    <div class="muted">${site.phones.map((p) => esc(p.label)).join(" · ")} · ${esc(site.hours)}</div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
