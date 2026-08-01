// עיצוב תאריכים בעברית. מקביל ל-HEB_MONTHS ב-build.py המקורי.

const HEB_MONTHS: Record<number, string> = {
  1: "בינואר", 2: "בפברואר", 3: "במרץ", 4: "באפריל", 5: "במאי", 6: "ביוני",
  7: "ביולי", 8: "באוגוסט", 9: "בספטמבר", 10: "באוקטובר", 11: "בנובמבר", 12: "בדצמבר",
};

function parts(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return { y, m, d };
}

export function dateSlash(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

export function dateHeb(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${d} ${HEB_MONTHS[m]} ${y}`;
}

export function dateFile(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${String(d).padStart(2, "0")}${String(m).padStart(2, "0")}${y}`;
}
