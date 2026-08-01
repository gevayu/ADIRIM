// לקוח Postgres (Supabase) + Drizzle.
// אין שלב מיגרציה נפרד: ensureSchema יוצר את הטבלאות אם חסרות (idempotent).
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Use the Supabase Postgres connection string " +
      "(Connection Pooler / Transaction, port 6543)."
  );
}

// prepare:false נדרש מול ה-pooler של Supabase (Supavisor) במצב transaction.
const client = postgres(url, { prepare: false });

export const db = drizzle(client, { schema });

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await client.unsafe(`
        CREATE TABLE IF NOT EXISTS weeks (
          id SERIAL PRIMARY KEY,
          meeting_date TEXT NOT NULL UNIQUE,
          created_at BIGINT NOT NULL
        )`);
      await client.unsafe(`
        CREATE TABLE IF NOT EXISTS visitors (
          id SERIAL PRIMARY KEY,
          week_id INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
          position INTEGER NOT NULL,
          "first" TEXT NOT NULL,
          "last" TEXT NOT NULL,
          company TEXT NOT NULL DEFAULT '',
          inviter TEXT NOT NULL DEFAULT '',
          phone TEXT NOT NULL DEFAULT '',
          email TEXT NOT NULL DEFAULT '',
          "type" TEXT NOT NULL DEFAULT 'guest',
          gender TEXT NOT NULL DEFAULT 'm',
          bni_member BOOLEAN NOT NULL DEFAULT FALSE
        )`);
    })();
  }
  return schemaReady;
}

export { schema };
