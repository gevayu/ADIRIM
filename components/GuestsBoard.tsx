"use client";
import { useMemo, useState } from "react";
import type { Visitor } from "@/lib/types";
import { checkFemale, typeLabel, badgeClass } from "@/lib/classify";
import { waLink } from "@/lib/phone";
import { dateHeb, dateSlash, dateFile } from "@/lib/dates";
import { useConfetti } from "./useConfetti";

const WA_ICON_PATH =
  "M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.099-.473-.149-.673.15-.198.297-.771.964-.945 1.162-.174.198-.347.223-.646.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

// הודעה מוכנה מראש שנפתחת בווטסאפ בלחיצה על האייקון.
const WA_MESSAGE = "היי, נפגשנו בקב' אדירים";

const RANK_COLORS = ["#2e7d32", "#6ab04c", "#f9ca24", "#f0932b", "#cc0000"];
const rankColor = (rank: number) => RANK_COLORS[Math.min(rank - 1, RANK_COLORS.length - 1)];

const SORT_COLS: { key: keyof Visitor; label: string }[] = [
  { key: "first", label: "שם פרטי" },
  { key: "last", label: "שם משפחה" },
  { key: "company", label: "שם חברה/מומחיות" },
  { key: "inviter", label: 'הוזמן ע"י' },
  { key: "phone", label: "טלפון" },
  { key: "email", label: "אימייל" },
  { key: "type", label: "סוג" },
];

export default function GuestsBoard({
  visitors,
  meetingDate,
  isAdmin,
  onUpdateClick,
  onLogout,
}: {
  visitors: Visitor[];
  meetingDate: string;
  isAdmin: boolean;
  onUpdateClick: () => void;
  onLogout: () => void;
}) {
  const [sortKey, setSortKey] = useState<keyof Visitor | null>(null);
  const [sortDir, setSortDir] = useState(1);
  const launchConfetti = useConfetti();

  const stats = useMemo(() => ({
    total: visitors.length,
    guests: visitors.filter((v) => v.type === "guest").length,
    subs: visitors.filter((v) => v.type === "sub").length,
    visitors: visitors.filter((v) => v.type === "visitor").length,
  }), [visitors]);

  const { podium, maxRank } = useMemo(() => {
    const counts: Record<string, number> = {};
    visitors.filter((v) => v.type === "guest" && v.inviter).forEach((v) => {
      counts[v.inviter] = (counts[v.inviter] || 0) + 1;
    });
    // מזמין של אורח בודד לא נספר בדירוג.
    const ranking = Object.entries(counts).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]);
    const rankArr: number[] = [];
    let curRank = 1;
    ranking.forEach((entry, i) => {
      if (i > 0 && entry[1] < ranking[i - 1][1]) curRank = i + 1;
      rankArr.push(curRank);
    });
    const rank3Count = rankArr.filter((r) => r === 3).length;
    const mr = rank3Count <= 2 ? 3 : 2;
    const top: { name: string; count: number; rank: number }[] = [];
    ranking.forEach(([name, count], i) => {
      if (rankArr[i] <= mr) top.push({ name, count, rank: rankArr[i] });
    });
    return { podium: top, maxRank: mr };
  }, [visitors]);

  const sorted = useMemo(() => {
    if (!sortKey) return visitors;
    return [...visitors].sort((a, b) =>
      sortDir * String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), "he")
    );
  }, [visitors, sortKey, sortDir]);

  function toggleSort(key: keyof Visitor) {
    if (sortKey === key) setSortDir((d) => -d);
    else { setSortKey(key); setSortDir(1); }
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const headers = ["שם פרטי", "שם משפחה", "חבר BNI", "שם חברה/מומחיות", 'הוזמן ע"י', "טלפון", "אימייל", "סוג"];
    const rows: (string)[][] = [headers];
    sorted.forEach((v) => {
      const isF = checkFemale(v);
      rows.push([
        v.first, v.last, v.bniMember ? "כן" : "",
        v.company, v.inviter, v.phone, v.email, typeLabel(v.type, isF),
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "נתונים");
    XLSX.writeFile(wb, `אורחים אדירים_${dateFile(meetingDate)}.xlsx`);
  }

  return (
    <>
      <div className="header">
        <h1>רשימת אורחים אדירים</h1>
        <p>פגישה שבועית | {dateHeb(meetingDate)}</p>
      </div>

      {isAdmin && (
        <div className="toolbar">
          <button className="btn btn-primary" onClick={onUpdateClick}>✏️ עדכן רשימה</button>
          <button className="btn btn-ghost" onClick={onLogout}>יציאה</button>
        </div>
      )}

      <div className="stats">
        <div className="stat-card"><div className="number">{stats.total}</div><div className="label">סה&quot;כ מבקרים</div></div>
        <div className="stat-card"><div className="number">{stats.guests}</div><div className="label">אורחים</div></div>
        <div className="stat-card"><div className="number">{stats.subs}</div><div className="label">ממלאי מקום</div></div>
        <div className="stat-card"><div className="number">{stats.visitors}</div><div className="label">מבקרים</div></div>
      </div>

      <div className="section">
        <div className="section-header">
          <span>🏆 דירוג מזמינים (אורחים בלבד) - טופ {maxRank}</span>
        </div>
        <div style={{ display: "flex", gap: 12, padding: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {podium.length === 0 && <div style={{ color: "#999" }}>אין עדיין אורחים לדירוג</div>}
          {podium.map(({ name, count, rank }, i) => {
            const color = rankColor(rank);
            return (
              <div
                key={name}
                onClick={rank === 1 ? () => launchConfetti() : undefined}
                style={{
                  flex: 1, minWidth: 180, maxWidth: 280,
                  background: `linear-gradient(135deg,${color}15,${color}05)`,
                  border: `2px solid ${color}`, borderRadius: 12, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  animation: `fadeInUp 0.45s ease-out ${0.5 + i * 0.08}s both`,
                  cursor: rank === 1 ? "pointer" : "default",
                }}
              >
                <div style={{ background: color, color: "white", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.2em", flexShrink: 0 }}>{rank}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", color, fontSize: "1.05em" }}>{name}{rank === 1 ? " 🏆" : ""}</div>
                  <div style={{ color: "#666", fontSize: "0.85em", marginTop: 2 }}>{count} אורחים</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <span>📋 רשימת מבקרים מלאה (לפי מזמין)</span>
          <button className="export-btn" onClick={exportExcel}>📥 ייצוא לאקסל</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: "center", width: 50 }}>ווטסאפ</th>
                {SORT_COLS.map((c) => (
                  <th
                    key={c.key}
                    className={`sortable ${sortKey === c.key ? (sortDir === 1 ? "sort-asc" : "sort-desc") : ""}`}
                    onClick={() => toggleSort(c.key)}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((v, i) => {
                const isF = checkFemale(v);
                return (
                  <tr key={i}>
                    <td style={{ textAlign: "center" }}>
                      {v.phone && (
                        <a href={waLink(v.phone, WA_MESSAGE)} target="_blank" rel="noopener" className="wa-btn" title="שלח ווטסאפ" aria-label="ווטסאפ">
                          <svg viewBox="0 0 24 24" fill="#25D366" width="16" height="16"><path d={WA_ICON_PATH} /></svg>
                        </a>
                      )}
                    </td>
                    <td><strong>{v.first}</strong></td>
                    <td><strong>{v.last}</strong>{v.bniMember && <span className="bni-logo">BNI</span>}</td>
                    <td>{v.company}</td>
                    <td className="inviter-name">{v.inviter || ""}</td>
                    <td>{v.phone || ""}</td>
                    <td>{v.email ? <a className="email-link" href={`mailto:${v.email}`}>{v.email}</a> : ""}</td>
                    <td><span className={`badge ${badgeClass(v.type)}`}>{typeLabel(v.type, isF)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="note">* ממלאי מקום ומבקרים אינם נספרים בדירוג. מזמין של אורח בודד אינו מופיע בדירוג.</div>
      </div>

      <div className="footer">BNI Israel | דוח שבועי מבקרים | {dateSlash(meetingDate)}</div>
    </>
  );
}
