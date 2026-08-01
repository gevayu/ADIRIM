// לקוח libSQL + Drizzle. עובד מקומית מול קובץ, ובוורסל מול Turso.
// אין שלב מיגרציה נפרד: ensureSchema יוצר את הטבלאות אם חסרות (idempotent).
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL || "file:./data/local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client: Client = createClient({ url, authToken });

export const db = drizzle(client, { schema });

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      // קשיחות מול גישה מרובת-תהליכים לקובץ מקומי (WAL + המתנה על נעילה).
      // בענן (Turso) אלה מנוהלים ממילא ואין להם השפעה.
      if (url.startsWith("file:")) {
        try {
          await client.execute("PRAGMA journal_mode=WAL");
          await client.execute("PRAGMA busy_timeout=5000");
        } catch {
          /* לא קריטי */
        }
      }
      await client.execute(`
        CREATE TABLE IF NOT EXISTS weeks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          meeting_date TEXT NOT NULL UNIQUE,
          created_at INTEGER NOT NULL
        )`);
      await client.execute(`
        CREATE TABLE IF NOT EXISTS visitors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          week_id INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
          position INTEGER NOT NULL,
          first TEXT NOT NULL,
          last TEXT NOT NULL,
          company TEXT NOT NULL DEFAULT '',
          inviter TEXT NOT NULL DEFAULT '',
          phone TEXT NOT NULL DEFAULT '',
          email TEXT NOT NULL DEFAULT '',
          type TEXT NOT NULL DEFAULT 'guest',
          gender TEXT NOT NULL DEFAULT 'm',
          bni_member INTEGER NOT NULL DEFAULT 0
        )`);
    })();
  }
  return schemaReady;
}

export { schema };
