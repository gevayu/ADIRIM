// סכימת Drizzle (Postgres / Supabase).
import { pgTable, serial, integer, text, boolean, bigint } from "drizzle-orm/pg-core";

export const weeks = pgTable("weeks", {
  id: serial("id").primaryKey(),
  meetingDate: text("meeting_date").notNull().unique(), // YYYY-MM-DD
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  weekId: integer("week_id").notNull(),
  position: integer("position").notNull(),
  first: text("first").notNull(),
  last: text("last").notNull(),
  company: text("company").notNull().default(""),
  inviter: text("inviter").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  type: text("type").notNull().default("guest"),
  gender: text("gender").notNull().default("m"),
  bniMember: boolean("bni_member").notNull().default(false),
});
