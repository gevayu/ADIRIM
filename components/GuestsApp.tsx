"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Week } from "@/lib/types";
import { dateSlash } from "@/lib/dates";
import BackgroundCanvas from "./BackgroundCanvas";
import GuestsBoard from "./GuestsBoard";
import ImportPanel from "./ImportPanel";

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function GuestsApp({
  week,
  weeks,
  isAdmin,
}: {
  week: Week | null;
  weeks: { meetingDate: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  // עורך בלבד; ציבור לעולם לא נכנס למצב עריכה. פתוח אוטומטית רק כשאין אף מפגש.
  const [editing, setEditing] = useState(isAdmin && week === null);

  const editDate = week?.meetingDate ?? todayISO();
  const editVisitors = week?.visitors ?? [];

  function selectWeek(date: string) {
    router.push(`/?date=${date}`);
  }

  async function saved(w: Week) {
    setEditing(false);
    router.push(`/?date=${w.meetingDate}`);
    router.refresh();
  }

  async function removeWeek(date: string) {
    if (!confirm(`למחוק את המפגש מ-${dateSlash(date)} ואת כל המבקרים שלו? פעולה בלתי הפיכה.`)) return;
    const res = await fetch(`/api/weeks?date=${date}`, { method: "DELETE" });
    if (!res.ok) {
      alert("מחיקה נכשלה");
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/login", { method: "DELETE" });
    setEditing(false);
    router.refresh();
  }

  return (
    <>
      <BackgroundCanvas />
      <div className="container">
        {isAdmin && editing ? (
          <ImportPanel
            initialVisitors={editVisitors}
            initialDate={editDate}
            onSaved={saved}
            onCancel={() => setEditing(false)}
          />
        ) : week ? (
          <GuestsBoard
            visitors={week.visitors}
            meetingDate={week.meetingDate}
            weeks={weeks}
            isAdmin={isAdmin}
            onUpdateClick={() => setEditing(true)}
            onSelectWeek={selectWeek}
            onDeleteWeek={removeWeek}
            onLogout={logout}
          />
        ) : (
          <div className="section empty-state">
            <h2>אין עדיין רשימה</h2>
            {isAdmin ? (
              <>
                <p>לחץ למטה כדי לייבא את מבקרי השבוע.</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setEditing(true)}>➕ צור רשימה</button>
              </>
            ) : (
              <p>הרשימה השבועית תתפרסם כאן.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
