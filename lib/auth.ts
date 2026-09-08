// שער עריכה מבוסס דאטהבייס: טבלת admins עם token = sha256(email:password).
// הוספת/הסרת אדמין = שורה בטבלה (דרך ה-MCP של Supabase), בלי redeploy ובלי env.
// אם הטבלה ריקה — העריכה נעולה לכולם (מצב כשל בטוח).
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db, ensureSchema, schema } from "./db";

export const ADMIN_COOKIE = "adm";

// טוקן הפעלה נגזר מהאימייל (כ-salt) והסיסמה. אין צורך לשמור סיסמה בטקסט גלוי.
export function tokenFor(email: string, password: string): string {
  const e = (email || "").trim().toLowerCase();
  return createHash("sha256").update(`${e}:${password}`).digest("hex");
}

// מאמת כניסה מול טבלת admins. מחזיר את הטוקן אם תקין, אחרת null.
export async function checkLogin(email: string, password: string): Promise<string | null> {
  await ensureSchema();
  const token = tokenFor(email, password);
  const rows = await db.select().from(schema.admins).where(eq(schema.admins.token, token)).limit(1);
  return rows.length ? token : null;
}

// האם הבקשה הנוכחית מזוהה כאדמין (העוגייה מכילה טוקן שקיים בטבלה).
export async function isAdmin(): Promise<boolean> {
  const c = cookies().get(ADMIN_COOKIE)?.value;
  if (!c) return false;
  await ensureSchema();
  const rows = await db.select().from(schema.admins).where(eq(schema.admins.token, c)).limit(1);
  return rows.length > 0;
}
