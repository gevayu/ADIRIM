// סכימת Drizzle (דיאלקט SQLite / libSQL).
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const weeks = sqliteTable("weeks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  meetingDate: text("meeting_date").notNull(), // YYYY-MM-DD, ייחודי בפועל
  createdAt: integer("created_at").notNull(),
});

export const visitors = sqliteTable("visitors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  bniMember: integer("bni_member").notNull().default(0),
});
