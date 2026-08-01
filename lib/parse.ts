// פרסור קלט גולמי לרשומות מבקרים. שלוש דרכים: הדבקת טקסט, CSV, אקסל.
// הפרסור הוא best-effort. הדיוק הסופי נקבע בטבלת הביקורת, לא כאן.
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { GuestType, ParsedRow } from "./types";
import { inferGender } from "./classify";

// מיפוי שמות עמודות אפשריים (עברית ואנגלית) לשדות שלנו.
const FIELD_ALIASES: Record<string, string[]> = {
  first: ["שם פרטי", "שם", "first", "firstname", "first name"],
  last: ["שם משפחה", "משפחה", "last", "lastname", "last name"],
  company: ["שם חברה", "חברה", "עיסוק", "מומחיות", "שם חברה/מומחיות", "עיסוק/חברה", "company", "business"],
  inviter: ['הוזמן ע"י', "מזמין", "מי הזמין", "הוזמן על ידי", "inviter", "host"],
  phone: ["טלפון", "נייד", "פלאפון", "phone", "mobile", "tel"],
  email: ['דוא"ל', "דואל", "אימייל", "מייל", "email", "e-mail", "mail"],
  sourceType: ["סוג", "סיווג", "type", "category"],
  bni: ["חבר bni", "bni", "חבר"],
};

// מיפוי הסיווג במקור ל-type. שים לב: ממלא מקום נשאר sub גם כשהוא חבר מאושר.
function mapSourceType(raw: string): GuestType {
  const s = (raw || "").trim();
  if (/ממלא|ממלאת|מ.מ|substitute|sub/i.test(s)) return "sub";
  if (/מועמד|candidate/i.test(s)) return "candidate";
  if (/מבקר/i.test(s)) return "visitor";
  return "guest";
}

function truthy(raw: unknown): boolean {
  const s = String(raw ?? "").trim().toLowerCase();
  return ["כן", "yes", "true", "1", "✓", "v", "member", "חבר"].includes(s);
}

// לוקח חלק עברי בלבד משם דו-לשוני ("תומר Tomer" -> "תומר").
function hebrewPart(s: string): string {
  const v = String(s || "").trim();
  const hasHeb = /[֐-׿]/.test(v);
  const hasLat = /[A-Za-z]/.test(v);
  if (hasHeb && hasLat) {
    const heb = v.split(/\s+/).filter((w) => /[֐-׿]/.test(w));
    if (heb.length) return heb.join(" ");
  }
  return v;
}

function canonicalKey(header: string): string | null {
  const h = header.trim().toLowerCase().replace(/["'.״׳]/g, "");
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((a) => a.toLowerCase().replace(/["'.״׳]/g, "") === h)) return field;
  }
  return null;
}

// ממיר רשומת אובייקט (מפתחות = כותרות) לרשומת מבקר מנורמלת.
function rowToVisitor(obj: Record<string, string>): ParsedRow {
  const get = (field: string): string => {
    for (const [k, v] of Object.entries(obj)) {
      if (canonicalKey(k) === field) return String(v ?? "").trim();
    }
    return "";
  };
  const first = hebrewPart(get("first"));
  const last = hebrewPart(get("last"));
  const source = get("sourceType");
  return {
    first,
    last,
    company: get("company"),
    inviter: hebrewPart(get("inviter")),
    phone: get("phone"),
    email: get("email"),
    type: mapSourceType(source),
    gender: inferGender(first, source),
    bniMember: truthy(get("bni")),
  };
}

// האם שורת המפתחות היא כותרת אמיתית (מכילה לפחות שדה מזוהה אחד).
function looksLikeHeader(cells: string[]): boolean {
  return cells.filter((c) => canonicalKey(c) !== null).length >= 2;
}

// ---- טקסט מודבק (טאב / פסיק / רווחים מרובים) ----
export function parseText(raw: string): ParsedRow[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim() !== "");
  if (!lines.length) return [];

  const split = (line: string): string[] => {
    if (line.includes("\t")) return line.split("\t");
    if (line.includes(",")) return line.split(",");
    return line.split(/\s{2,}/);
  };

  const rows = lines.map(split).map((cells) => cells.map((c) => c.trim()));
  let headers: string[];
  let dataRows: string[][];

  if (looksLikeHeader(rows[0])) {
    headers = rows[0];
    dataRows = rows.slice(1);
  } else {
    // אין כותרת: הנחת סדר עמודות סטנדרטי.
    headers = ["שם פרטי", "שם משפחה", "עיסוק", "מזמין", "טלפון", "אימייל", "סוג"];
    dataRows = rows;
  }

  return dataRows.map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = cells[i] ?? ""; });
    return rowToVisitor(obj);
  }).filter((v) => v.first || v.last);
}

// ---- CSV ----
export function parseCsv(text: string): ParsedRow[] {
  const res = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return (res.data || []).map(rowToVisitor).filter((v) => v.first || v.last);
}

// ---- אקסל ----
export function parseXlsx(buf: ArrayBuffer): ParsedRow[] {
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
  return json.map(rowToVisitor).filter((v) => v.first || v.last);
}
