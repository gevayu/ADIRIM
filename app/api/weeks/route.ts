import { NextResponse } from "next/server";
import { listWeeks, saveWeek } from "@/lib/repo";
import { isAdmin } from "@/lib/auth";
import type { Visitor } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const weeks = await listWeeks();
  return NextResponse.json({ weeks });
}

export async function POST(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ error: "אין הרשאת עריכה" }, { status: 401 });
  }

  let body: { meetingDate?: string; visitors?: Visitor[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const meetingDate = (body.meetingDate || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meetingDate)) {
    return NextResponse.json({ error: "meetingDate must be YYYY-MM-DD" }, { status: 400 });
  }
  const visitors = Array.isArray(body.visitors) ? body.visitors : [];

  const week = await saveWeek(meetingDate, visitors);
  return NextResponse.json({ week });
}
