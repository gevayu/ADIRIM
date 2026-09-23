import { getCurrentWeek, getWeekByDate, listWeeks } from "@/lib/repo";
import { isAdmin } from "@/lib/auth";
import GuestsApp from "@/components/GuestsApp";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { date?: string } }) {
  const admin = await isAdmin();
  const weeks = await listWeeks();
  const date = typeof searchParams?.date === "string" ? searchParams.date : undefined;
  // מפגש לפי תאריך שנבחר, ואם אין/לא נמצא — המפגש הקרוב להיום.
  const week = (date ? await getWeekByDate(date) : null) ?? (await getCurrentWeek());
  return <GuestsApp week={week} weeks={weeks} isAdmin={admin} />;
}
