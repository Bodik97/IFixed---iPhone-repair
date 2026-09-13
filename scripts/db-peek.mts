// Разова перевірка стану таблиці заявок.
// Запуск: source <(grep -v '^#' .env.local | sed 's/^/export /') && npx tsx scripts/db-peek.mts
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const rows = await sql`select order_no, name, phone, model, status from leads order by order_no desc limit 20`;
console.table(rows);
