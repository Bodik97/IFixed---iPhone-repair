import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const rows = await sql`
  SELECT name, phone, email, model, service, city, problem, source, status, created_at
  FROM leads ORDER BY created_at DESC`;

console.log(`Заявок у базі: ${rows.length}\n`);
for (const r of rows) {
  const when = new Date(r.created_at as string).toLocaleString("uk-UA");
  console.log(`${when} · ${r.status} · ${r.source}`);
  console.log(`  ${r.name} — ${r.phone ?? r.email ?? "без контакту"}`);
  if (r.model || r.service) console.log(`  ${r.model ?? r.service}`);
  if (r.city) console.log(`  ${r.city}`);
  if (r.problem) console.log(`  «${r.problem}»`);
  console.log();
}
