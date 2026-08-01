import { NextResponse } from "next/server";
import { getCurrentWeek } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const week = await getCurrentWeek();
  return NextResponse.json({ week });
}
