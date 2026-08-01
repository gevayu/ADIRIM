// סיווג מין ותוויות סוג. מקביל ל-checkFemale וללוגיקת התוויות בתבנית המקורית.
import type { GuestType, Gender, Visitor } from "./types";

// שמות נשיים שבהם אי אפשר להסיק מין מהצורה. משמש כרשת ביטחון כשאין gender מפורש.
export const femaleNames = new Set<string>([
  "יהודית", "דיקלה", "אילנה", "שרי", "שירי", "אורית", "גלית", "שיר", "דגנית",
  "יערה", "אור", 'ד"ר ענת', "שרון", "אלינה", "ויקטוריה", "הילה", "אורלי", "מיה",
  "מיטל", "נופר", "סתו", "ציפי", "ליזה", "איילת", "שרית", "קטי", "טליה", "מעיין",
  "חגית", "יפעת", "יעל", "ליאת", "אילונה", "נוי",
]);

// סימני נקבה בטקסט: תארים נשיים, והצורה הנקבית של הסיווג במקור (אורחת/מבקרת/ממלאת/מועמדת).
const FEMALE_CUE = /(גברת|גב'|מרת|העלמה|אורחת|מבקרת|ממלאת|מועמדת)/;

export function checkFemale(v: Visitor): boolean {
  if (v.gender === "f") return true;
  if (v.gender === "m") return false;
  return femaleNames.has(v.first) || (v.first === "דניאל" && v.last === "כהן");
}

// ניחוש מין ראשוני לשלב הפרסור, לפני ביקורת ידנית.
// קודם הצורה הנקבית בסיווג/תואר, אחר כך רשימת השמות הנשיים.
export function inferGender(first: string, rawSource?: string): Gender {
  const s = (rawSource || "").trim();
  if (FEMALE_CUE.test(s)) return "f";
  if (femaleNames.has(first.trim())) return "f";
  return "m";
}

export function typeLabel(type: GuestType, isFemale: boolean): string {
  switch (type) {
    case "guest": return isFemale ? "אורחת" : "אורח";
    case "sub": return isFemale ? "ממלאת מקום" : "ממלא מקום";
    case "candidate": return isFemale ? "מועמדת" : "מועמד";
    case "visitor": return isFemale ? "מבקרת" : "מבקר";
  }
}

export function badgeClass(type: GuestType): string {
  return `badge-${type}`;
}

export const TYPE_OPTIONS: { value: GuestType; label: string }[] = [
  { value: "guest", label: "אורח/ת" },
  { value: "sub", label: "ממלא/ת מקום" },
  { value: "visitor", label: "מבקר/ת" },
  { value: "candidate", label: "מועמד/ת" },
];
