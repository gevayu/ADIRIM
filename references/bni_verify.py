#!/usr/bin/env python3
"""
אימות חברות BNI דרך טופס החיפוש הרשמי, בעזרת דפדפן אמיתי (Playwright).

שימוש:
    python3 bni_verify.py "[('שניר','אוזנוביץ'),('רונית','שגיב')]"

פלט לכל שם (מופרד בטאב):
    "שם משפחה\tMEMBER-EXACT"            -> חבר BNI מאושר (התאמת שם מדויקת בתוצאות)
    "שם משפחה\tnames:['...','...']"      -> לא נמצאה התאמה מדויקת; אלה השמות הדומים שחזרו
    "שם משפחה\tNONE"                     -> אין תוצאות כלל

הערות תפעול:
- הרץ בקבוצות של עד ~5 שמות כדי להישאר מתחת למגבלת זמן הריצה (עטוף ב-`timeout 118`).
- רק MEMBER-EXACT מאשר חברות. שם דומה אינו מספיק.
- למה לא גוגל: גוגל לא מאנדקס את רוב עמודי memberdetails, אז web_search מחזיר
  "לא נמצא" שגוי גם על חברים אמיתיים. חובה להריץ את הטופס הרשמי כאן.
"""
from playwright.sync_api import sync_playwright
import sys, time, unicodedata


def norm(s: str) -> str:
    """נרמול להשוואת שמות: הסרת רווחים כפולים ותווי רווח מיוחדים."""
    s = ''.join(c for c in s if not unicodedata.category(c).startswith('Z') or c == ' ')
    return ' '.join(s.split()).strip()


def run_search(page, first: str, last: str):
    page.goto('https://bni.co.il/iw/findamember', timeout=45000)
    page.wait_for_load_state('domcontentloaded')
    time.sleep(0.8)
    # להפעיל את טאב "חיפוש מתקדם" שבו נמצאים שדות השם
    page.click('a[href="#search-advanced-tab"]', timeout=10000)
    page.wait_for_selector('#search-advanced-tab.active, #search-advanced-tab.in', timeout=10000)
    time.sleep(0.4)
    page.fill('#memberFirstName', first, timeout=8000)
    page.fill('#memberLastName', last, timeout=8000)
    # ללחוץ על כפתור "חיפוש" בתוך הפאנל המתקדם
    page.evaluate('''() => {
        const pane = document.querySelector('#search-advanced-tab');
        const btns = Array.from((pane || document).querySelectorAll('button, input[type=submit], a'));
        for (const b of btns) {
            const t = (b.textContent || b.value || '').trim();
            if (t === 'חיפוש') { b.click(); return; }
        }
    }''')
    time.sleep(4.5)  # להמתין לתוצאות ה-AJAX
    return page.evaluate('''() => {
        const out = [];
        document.querySelectorAll('a[href*="memberdetails"]').forEach(a => {
            out.push((a.textContent || '').trim().replace(/\\s+/g, ' '));
        });
        return out;
    }''')


def main():
    if len(sys.argv) < 2:
        print("usage: python3 bni_verify.py \"[('first','last'), ...]\"")
        sys.exit(1)
    names = eval(sys.argv[1])
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        for first, last in names:
            try:
                results = run_search(page, first, last)
                target = norm(first + ' ' + last)
                exact = any(norm(r) == target for r in results)
                if exact:
                    status = "MEMBER-EXACT"
                elif results:
                    status = "names:" + str(results[:3])
                else:
                    status = "NONE"
                print(f"{first} {last}\t{status}")
            except Exception as e:
                print(f"{first} {last}\tERROR {str(e)[:60]}")
        browser.close()


if __name__ == "__main__":
    main()
