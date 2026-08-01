// שער עריכה לכלי חד-משתמש: יוזר + סיסמה מ-env (ADMIN_USER, ADMIN_PASSWORD).
// אם אחד מהם חסר — העריכה נעולה לכולם (מצב כשל בטוח).
// העוגייה שומרת hash של יוזר+סיסמה, לא את הסיסמה עצמה.
import { cookies } from "next/headers";
import { createHash } from "crypto";

export const ADMIN_COOKIE = "adm";

export function adminUser(): string {
  return (process.env.ADMIN_USER || "").trim().toLowerCase();
}

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}

export function credentialsConfigured(): boolean {
  return !!adminUser() && !!adminPassword();
}

// טוקן הפעלה: תלוי בשם המשתמש ובסיסמה. משתנה מוריד את כל הכניסות הקיימות.
export function sessionToken(): string {
  return createHash("sha256").update(`${adminUser()}:${adminPassword()}`).digest("hex");
}

// אימות שם משתמש (case-insensitive) וסיסמה (מדויקת) מול ה-env.
export function checkCredentials(user: string, password: string): boolean {
  if (!credentialsConfigured()) return false;
  return (user || "").trim().toLowerCase() === adminUser() && password === adminPassword();
}

export function isAdmin(): boolean {
  if (!credentialsConfigured()) return false;
  const c = cookies().get(ADMIN_COOKIE)?.value;
  return !!c && c === sessionToken();
}
