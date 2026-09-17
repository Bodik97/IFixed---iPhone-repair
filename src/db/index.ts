import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL не задано — перевірте .env.local або змінні у Vercel");
  return drizzle(neon(url), { schema });
}

// Ліниво: Next.js виконує код модулів на етапі збірки, а DATABASE_URL
// там може бути ще не заданий. Без Proxy — він ламає бібліотеки,
// які інспектують об'єкт клієнта.
let db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!db) db = createDb();
  return db;
}
