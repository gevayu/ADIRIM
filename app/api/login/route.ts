import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkCredentials, credentialsConfigured, sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

// כניסת עורך: בודק יוזר+סיסמה מול ה-env ומגדיר עוגייה httpOnly עם טוקן הפעלה.
export async function POST(req: Request) {
  let user = "";
  let password = "";
  try {
    ({ user, password } = await req.json());
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  if (!credentialsConfigured()) {
    return NextResponse.json({ error: "לא הוגדרו פרטי עורך בשרת" }, { status: 500 });
  }
  if (!checkCredentials(user, password)) {
    return NextResponse.json({ error: "יוזר או סיסמה שגויים" }, { status: 401 });
  }

  cookies().set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // חצי שנה
  });
  return NextResponse.json({ ok: true });
}

// יציאה: מוחק את העוגייה.
export async function DELETE() {
  cookies().delete(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
