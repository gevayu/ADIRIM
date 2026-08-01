"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Week } from "@/lib/types";
import BackgroundCanvas from "./BackgroundCanvas";
import GuestsBoard from "./GuestsBoard";
import ImportPanel from "./ImportPanel";

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function GuestsApp({ initialWeek, isAdmin }: { initialWeek: Week | null; isAdmin: boolean }) {
  const router = useRouter();
  const [week, setWeek] = useState<Week | null>(initialWeek);
  // עורך בלבד; ציבור לעולם לא נכנס למצב עריכה.
  const [editing, setEditing] = useState(isAdmin && initialWeek === null);

  const editDate = week?.meetingDate ?? todayISO();
  const editVisitors = week?.visitors ?? [];

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
            onSaved={(w) => { setWeek(w); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        ) : week ? (
          <GuestsBoard
            visitors={week.visitors}
            meetingDate={week.meetingDate}
            isAdmin={isAdmin}
            onUpdateClick={() => setEditing(true)}
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
