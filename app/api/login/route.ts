import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// כניסת עורך: בודק סיסמה מול ADMIN_PASSWORD ומגדיר עוגייה httpOnly.
export async function POST(req: Request) {
  let password = "";
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const pw = adminPassword();
  if (!pw) return NextResponse.json({ error: "לא הוגדרה סיסמת עורך בשרת" }, { status: 500 });
  if (password !== pw) return NextResponse.json({ error: "סיסמה שגויה" }, { status: 401 });

  cookies().set(ADMIN_COOKIE, password, {
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
