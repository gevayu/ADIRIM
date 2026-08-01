"use client";
import { useRef, useState } from "react";
import type { Gender, GuestType, Visitor, Week } from "@/lib/types";
import { emptyVisitor } from "@/lib/types";
import { TYPE_OPTIONS } from "@/lib/classify";
import { parseText, parseCsv, parseXlsx } from "@/lib/parse";

type Tab = "paste" | "csv" | "xlsx";

export default function ImportPanel({
  initialVisitors,
  initialDate,
  onSaved,
  onCancel,
}: {
  initialVisitors: Visitor[];
  initialDate: string;
  onSaved: (week: Week) => void;
  onCancel: () => void;
}) {
  const [tab, setTab] = useState<Tab>("paste");
  const [rows, setRows] = useState<Visitor[]>(initialVisitors);
  const [meetingDate, setMeetingDate] = useState(initialDate);
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function append(parsed: Visitor[]) {
    if (!parsed.length) { setError("לא זוהו שורות. בדוק שהעמודות תקינות."); return; }
    setError(null);
    setRows((r) => [...r, ...parsed]);
  }

  function handlePaste() {
    try { append(parseText(pasteText)); setPasteText(""); }
    catch (e: any) { setError("שגיאת פרסור: " + (e?.message || e)); }
  }

  async function handleFile(file: File) {
    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        append(parseCsv(await file.text()));
      } else {
        append(parseXlsx(await file.arrayBuffer()));
      }
    } catch (e: any) {
      setError("שגיאת קריאת קובץ: " + (e?.message || e));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function setCell(i: number, field: keyof Visitor, value: string | boolean) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }

  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/weeks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingDate, visitors: rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שמירה נכשלה");
      onSaved(data.week as Week);
    } catch (e: any) {
      setError(e?.message || "שמירה נכשלה");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel">
      <h2>עדכון רשימת מבקרים</h2>
      <p className="sub">
        הדבק טקסט, או ייבא CSV / אקסל. הנתונים ייכנסו לטבלת ביקורת שאפשר לתקן בה כל שדה לפני שמירה.
        סימון חבר BNI וסיווג נעשים כאן ידנית (האימות רץ מחוץ לעמוד).
      </p>

      <div className="import-tabs">
        <button className={`import-tab ${tab === "paste" ? "active" : ""}`} onClick={() => setTab("paste")}>📋 הדבקת טקסט</button>
        <button className={`import-tab ${tab === "csv" ? "active" : ""}`} onClick={() => setTab("csv")}>📄 CSV</button>
        <button className={`import-tab ${tab === "xlsx" ? "active" : ""}`} onClick={() => setTab("xlsx")}>📊 אקסל</button>
      </div>

      {tab === "paste" && (
        <div>
          <textarea
            className="paste-box"
            placeholder={"הדבק כאן שורות. עמודה ראשונה כותרות (שם פרטי, שם משפחה, עיסוק, מזמין, טלפון, אימייל, סוג) או רק נתונים בסדר הזה.\nמפריד: טאב, פסיק, או רווחים כפולים."}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={handlePaste} disabled={!pasteText.trim()}>
            ➕ הוסף לטבלה
          </button>
          <div className="hint">שמות דו-לשוניים (&quot;תומר Tomer&quot;) — נלקח החלק העברי. מין וסיווג ננחשים ראשונית וניתן לתקן למטה.</div>
        </div>
      )}

      {(tab === "csv" || tab === "xlsx") && (
        <div
          className="file-drop"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <div style={{ fontSize: "2em" }}>{tab === "csv" ? "📄" : "📊"}</div>
          <div>גרור לכאן קובץ {tab === "csv" ? "CSV" : "אקסל"} או לחץ לבחירה</div>
          <input
            ref={fileRef}
            type="file"
            accept={tab === "csv" ? ".csv,text/csv" : ".xlsx,.xls"}
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      <div style={{ marginTop: 20, overflowX: "auto" }}>
        <table className="review-table">
          <thead>
            <tr>
              <th style={{ width: 30 }}>#</th>
              <th>שם פרטי</th>
              <th>שם משפחה</th>
              <th>חברה/מומחיות</th>
              <th>מזמין</th>
              <th>טלפון</th>
              <th>אימייל</th>
              <th style={{ width: 110 }}>סוג</th>
              <th style={{ width: 70 }}>מין</th>
              <th style={{ width: 60 }}>BNI</th>
              <th style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={11} style={{ textAlign: "center", color: "#999", padding: 20 }}>אין שורות עדיין. הדבק או ייבא נתונים.</td></tr>
            )}
            {rows.map((v, i) => (
              <tr key={i}>
                <td style={{ color: "#aaa" }}>{i + 1}</td>
                <td><input value={v.first} onChange={(e) => setCell(i, "first", e.target.value)} /></td>
                <td><input value={v.last} onChange={(e) => setCell(i, "last", e.target.value)} /></td>
                <td><input value={v.company} onChange={(e) => setCell(i, "company", e.target.value)} /></td>
                <td><input value={v.inviter} onChange={(e) => setCell(i, "inviter", e.target.value)} /></td>
                <td><input value={v.phone} onChange={(e) => setCell(i, "phone", e.target.value)} /></td>
                <td><input value={v.email} onChange={(e) => setCell(i, "email", e.target.value)} /></td>
                <td>
                  <select value={v.type} onChange={(e) => setCell(i, "type", e.target.value as GuestType)}>
                    {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>
                <td>
                  <select value={v.gender} onChange={(e) => setCell(i, "gender", e.target.value as Gender)}>
                    <option value="m">זכר</option>
                    <option value="f">נקבה</option>
                  </select>
                </td>
                <td style={{ textAlign: "center" }}>
                  <input className="chk" type="checkbox" checked={v.bniMember} onChange={(e) => setCell(i, "bniMember", e.target.checked)} />
                </td>
                <td><button className="row-del" title="מחק שורה" onClick={() => removeRow(i)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10 }}>
        <button className="btn btn-ghost" onClick={() => setRows((r) => [...r, emptyVisitor()])}>➕ שורה ריקה</button>
        {rows.length > 0 && (
          <button className="btn btn-ghost" style={{ marginInlineStart: 8 }} onClick={() => setRows([])}>🗑️ נקה הכל</button>
        )}
      </div>

      <div className="review-actions">
        <label className="date-field">
          תאריך המפגש:
          <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={onCancel} disabled={saving}>ביטול</button>
          <button className="btn btn-primary" onClick={save} disabled={saving || !meetingDate}>
            {saving ? "שומר…" : `💾 שמור ופרסם (${rows.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
