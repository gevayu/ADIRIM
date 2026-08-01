// נרמול טלפון וקישור ווטסאפ. מקביל ל-norm_phone ב-build.py ו-waLink בתבנית.
// שתי הפונקציות מסירות אפס-תא מיותר אחרי קידומת 972. אם משנים אחת, לבדוק את השנייה.

export function normPhone(raw: string): string {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("972")) d = "0" + d.slice(3);
  if (d.length === 10 && d.startsWith("0")) {
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
  }
  return String(raw || "").trim();
}

export function waLink(phone: string, text?: string): string {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("972")) {
    if (d.charAt(3) === "0") d = "972" + d.slice(4);
  } else if (d.startsWith("0")) {
    d = "972" + d.slice(1);
  }
  const base = "https://wa.me/" + d;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
