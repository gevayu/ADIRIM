// גישת נתונים: קריאת השבוע הנוכחי, רשימת שבועות, ושמירת שבוע (upsert לפי תאריך).
import { desc, eq } from "drizzle-orm";
import { db, ensureSchema, schema } from "./db";
import { normPhone } from "./phone";
import type { Visitor, Week } from "./types";

function rowToVisitor(r: typeof schema.visitors.$inferSelect): Visitor {
  return {
    first: r.first,
    last: r.last,
    company: r.company,
    inviter: r.inviter,
    phone: r.phone,
    email: r.email,
    type: r.type as Visitor["type"],
    gender: r.gender as Visitor["gender"],
    bniMember: r.bniMember,
  };
}

// התאריך של היום בישראל בפורמט YYYY-MM-DD.
function israelToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
}

// השבוע הנוכחי = המפגש הקרוב ביותר להיום (בעבר או בעתיד), לא הרחוק ביותר.
// כך תאריך-עתיד שגוי לא "חוטף" את התצוגה, ומפגש שנשמר להיום מוצג מיד.
export async function getCurrentWeek(): Promise<Week | null> {
  await ensureSchema();
  const weeks = await db.select().from(schema.weeks);
  if (!weeks.length) return null;
  const t = Date.parse(israelToday());
  weeks.sort((a, b) => {
    const da = Math.abs(Date.parse(a.meetingDate) - t);
    const db2 = Math.abs(Date.parse(b.meetingDate) - t);
    if (da !== db2) return da - db2; // הקרוב ביותר
    return b.meetingDate.localeCompare(a.meetingDate); // תיקו: מעדיפים את העתידי
  });
  const w = weeks[0];
  return loadWeek(w.id, w.meetingDate);
}

export async function getWeekByDate(meetingDate: string): Promise<Week | null> {
  await ensureSchema();
  const [w] = await db.select().from(schema.weeks).where(eq(schema.weeks.meetingDate, meetingDate)).limit(1);
  if (!w) return null;
  return loadWeek(w.id, w.meetingDate);
}

async function loadWeek(id: number, meetingDate: string): Promise<Week> {
  const rows = await db
    .select()
    .from(schema.visitors)
    .where(eq(schema.visitors.weekId, id))
    .orderBy(schema.visitors.position);
  return { id, meetingDate, visitors: rows.map(rowToVisitor) };
}

export async function listWeeks(): Promise<{ id: number; meetingDate: string }[]> {
  await ensureSchema();
  const rows = await db
    .select({ id: schema.weeks.id, meetingDate: schema.weeks.meetingDate })
    .from(schema.weeks)
    .orderBy(desc(schema.weeks.meetingDate));
  return rows;
}

// שומר שבוע. אם התאריך כבר קיים, דורס את הרשומות שלו.
export async function saveWeek(meetingDate: string, visitors: Visitor[]): Promise<Week> {
  await ensureSchema();

  const existing = await db
    .select()
    .from(schema.weeks)
    .where(eq(schema.weeks.meetingDate, meetingDate))
    .limit(1);

  let weekId: number;
  if (existing.length) {
    weekId = existing[0].id;
    await db.delete(schema.visitors).where(eq(schema.visitors.weekId, weekId));
  } else {
    const [inserted] = await db
      .insert(schema.weeks)
      .values({ meetingDate, createdAt: Date.now() })
      .returning({ id: schema.weeks.id });
    weekId = inserted.id;
  }

  if (visitors.length) {
    await db.insert(schema.visitors).values(
      visitors.map((v, i) => ({
        weekId,
        position: i,
        first: v.first,
        last: v.last,
        company: v.company,
        inviter: v.inviter,
        phone: normPhone(v.phone),
        email: v.email,
        type: v.type,
        gender: v.gender,
        bniMember: v.bniMember,
      }))
    );
  }

  return loadWeek(weekId, meetingDate);
}

// מחיקת מפגש שלם לפי תאריך (כולל המבקרים שלו).
export async function deleteWeek(meetingDate: string): Promise<void> {
  await ensureSchema();
  const [w] = await db
    .select({ id: schema.weeks.id })
    .from(schema.weeks)
    .where(eq(schema.weeks.meetingDate, meetingDate))
    .limit(1);
  if (!w) return;
  await db.delete(schema.visitors).where(eq(schema.visitors.weekId, w.id));
  await db.delete(schema.weeks).where(eq(schema.weeks.id, w.id));
}
