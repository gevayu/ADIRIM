#!/usr/bin/env python3
"""
בונה את קובץ ה-HTML השבועי של מבקרי אדירים מקובץ נתונים JSON.

שימוש:
    python3 references/build.py <data.json> <YYYY-MM-DD> [out.html]

קלט JSON: רשימה של רשומות מבקרים, כל אחת:
    {
      "first": "מיטל", "last": "בוארון",
      "company": "עריכת דין",
      "inviter": "הילה דיין",
      "phone": "050-301-3560",
      "email": "Meital0511@gmail.com",
      "type": "visitor",          # guest | sub | visitor
      "gender": "f",              # m | f
      "bniMember": true            # אופציונלי, רק אם אומת חבר BNI
    }

הסקריפט:
- מנרמל טלפונים לפורמט 0XX-XXX-XXXX (מספרי נייד ישראליים).
- מחשב את ארבעת המונים אוטומטית מתוך שדה type.
- ממלא תאריכים (כותרת, הדר, פוטר, שם קובץ הייצוא) מהתאריך שנמסר.
- מזריק את מערך הרשומות ל-template.html.

הערה: הסקריפט לא מאמת חברות BNI. אימות נעשה מראש ב-bni_verify.py,
והתוצאה נכנסת לשדה bniMember בקובץ ה-JSON. ראה SKILL.md.
"""
import json, sys, re, os

HEB_MONTHS = {
    1: "בינואר", 2: "בפברואר", 3: "במרץ", 4: "באפריל", 5: "במאי", 6: "ביוני",
    7: "ביולי", 8: "באוגוסט", 9: "בספטמבר", 10: "באוקטובר", 11: "בנובמבר", 12: "בדצמבר",
}

SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE = os.path.join(SKILL_DIR, "assets", "template.html")


def norm_phone(p):
    """נרמול מספר נייד ישראלי לפורמט 0XX-XXX-XXXX. משאיר כמו שהוא אם לא תואם."""
    d = re.sub(r'\D', '', str(p or ''))
    if d.startswith('00'):
        d = d[2:]
    if d.startswith('972'):
        d = '0' + d[3:]
    # הסרת אפס תא מיותר אחרי קידומת אם נשאר
    if len(d) == 10 and d.startswith('0'):
        return f"{d[0:3]}-{d[3:6]}-{d[6:10]}"
    return str(p or '').strip()


def esc(s):
    """הגנה על גרש בודד לתוך מחרוזת JS."""
    return str(s or '').replace('\\', '\\\\').replace("'", "\\'")


def record_line(v):
    fields = []
    fields.append(f"first:'{esc(v.get('first'))}'")
    fields.append(f"last:'{esc(v.get('last'))}'")
    fields.append(f"company:'{esc(v.get('company'))}'")
    fields.append(f"inviter:'{esc(v.get('inviter'))}'")
    fields.append(f"phone:'{esc(norm_phone(v.get('phone')))}'")
    fields.append(f"email:'{esc(v.get('email'))}'")
    fields.append(f"type:'{esc(v.get('type', 'guest'))}'")
    fields.append(f"gender:'{esc(v.get('gender', 'm'))}'")
    if v.get('bniMember'):
        fields.append("bniMember:true")
    return "  { " + ", ".join(fields) + " },"


def main():
    if len(sys.argv) < 3:
        print("usage: python3 build.py <data.json> <YYYY-MM-DD> [out.html]")
        sys.exit(1)

    data_path, date_iso = sys.argv[1], sys.argv[2]
    y, m, d = map(int, date_iso.split('-'))
    date_slash = f"{d:02d}/{m:02d}/{y}"
    date_heb = f"{d} {HEB_MONTHS[m]} {y}"
    date_file = f"{d:02d}{m:02d}{y}"

    with open(data_path, encoding='utf-8') as f:
        visitors = json.load(f)

    total = len(visitors)
    guests = sum(1 for v in visitors if v.get('type') == 'guest')
    subs = sum(1 for v in visitors if v.get('type') == 'sub')
    vis = sum(1 for v in visitors if v.get('type') == 'visitor')

    rows = "\n".join(record_line(v) for v in visitors)

    html = open(TEMPLATE, encoding='utf-8').read()
    html = html.replace("  // {DATA_ROWS}", rows)
    html = html.replace("{DATE_SLASH}", date_slash)
    html = html.replace("{DATE_HEB}", date_heb)
    html = html.replace("{DATE_FILE}", date_file)

    # מילוי המונים לפי סדר הופעתם בתבנית: סה"כ, אורחים, ממלאי מקום, מבקרים
    counts = [str(total), str(guests), str(subs), str(vis)]
    labels = ['סה"כ מבקרים', 'אורחים', 'ממלאי מקום', 'מבקרים']
    for cnt, lbl in zip(counts, labels):
        html = re.sub(
            r'(<div class="stat-card"><div class="number">)0(</div><div class="label">' + re.escape(lbl) + ')',
            r'\g<1>' + cnt + r'\g<2>',
            html, count=1
        )

    out = sys.argv[3] if len(sys.argv) > 3 else f"adirim-guests-{date_file}.html"
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"wrote {out}")
    print(f"total={total} guests={guests} subs={subs} visitors={vis}")
    members = [f"{v['first']} {v['last']}" for v in visitors if v.get('bniMember')]
    print(f"BNI members ({len(members)}): {', '.join(members) if members else 'none'}")


if __name__ == "__main__":
    main()
