// שער עריכה פשוט לכלי חד-משתמש. הסיסמה ב-ADMIN_PASSWORD (env).
// אם לא הוגדרה סיסמה — העריכה נעולה לכולם (מצב כשל בטוח).
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "adm";

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}

export function isAdmin(): boolean {
  const pw = adminPassword();
  if (!pw) return false;
  const c = cookies().get(ADMIN_COOKIE)?.value;
  return !!c && c === pw;
}
