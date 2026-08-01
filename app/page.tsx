import { getCurrentWeek } from "@/lib/repo";
import { isAdmin } from "@/lib/auth";
import GuestsApp from "@/components/GuestsApp";

export const dynamic = "force-dynamic";

export default async function Page() {
  const week = await getCurrentWeek();
  return <GuestsApp initialWeek={week} isAdmin={isAdmin()} />;
}
