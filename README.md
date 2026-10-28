# רשימת אורחים אדירים — כלי שבועי

אפליקציית Next.js (App Router) לניהול רשימת המבקרים השבועית של צ'פטר BNI. ייבוא (הדבקה / CSV /
אקסל), תיקון בטבלת ביקורת, שמירה ל-Postgres, ותצוגה מעוצבת עם דירוג מזמינים, בורר מפגשים לפי
תאריך, מיון, ווטסאפ וייצוא לאקסל.

הדאטהבייס הוא **Postgres** (נבנה מול Supabase). אין שלב מיגרציה: הטבלאות נוצרות אוטומטית
בפנייה הראשונה (`ensureSchema` ב-`lib/db/index.ts`).

## הרצה מקומית

```bash
npm install
cp .env.example .env.local        # ואז מלא DATABASE_URL
npm run dev                       # http://localhost:3000
```

`DATABASE_URL` חייב להצביע על Postgres (Supabase או כל Postgres אחר). `npm run seed` טוען
שבוע דוגמה אחד, אופציונלי; למופע נקי מדלגים עליו.

## שימוש שבועי

1. היכנס דרך **`/login`** (יוזר = אימייל, והסיסמה שלך). בלי כניסה הדף לצפייה בלבד.
2. **עדכן רשימה** → הדבק טקסט או ייבא CSV / אקסל. השורות נכנסות לטבלת ביקורת.
3. תקן כל שדה: שם, חברה, מזמין, טלפון, סוג (אורח / ממלא מקום / מבקר / מועמד), מין, וסימון **BNI**.
   אימות חברות BNI נעשה מחוץ לעמוד (ראה `SKILL.md`); כאן רק מסמנים את התוצאה.
4. קבע **תאריך מפגש** ולחץ **שמור ופרסם**. שמירה על תאריך קיים דורסת את אותו מפגש.
5. בורר המפגשים בראש הלוח עובר בין תאריכים. המפגש המוצג כברירת מחדל הוא הקרוב להיום.

## הרשאות עריכה (טבלת admins)

העריכה נעולה מאחורי טבלת `admins` בדאטהבייס. כל שורה: `email` + `token`, כש-`token` הוא
`sha256(email_lowercase + ":" + password)`. אין משתני סביבה לסיסמאות. הוספת עורך = שורה בטבלה,
בלי redeploy. בלי אף שורה — העריכה נעולה לכולם.

להוספת אדמין, חשב טוקן והכנס שורה:

```bash
node -e "const c=require('crypto');console.log(c.createHash('sha256').update('you@example.com'.toLowerCase()+':'+'YOUR_PASSWORD').digest('hex'))"
```

```sql
insert into admins (email, token) values ('you@example.com', '<the-hash-above>');
```

## הקמת מופע חדש (העברה לחשבון/אתר אחר)

1. **Supabase:** פתח פרויקט. Settings → Database → Connection string → **Transaction pooler**
   (פורט 6543, מארח `...pooler.supabase.com`). זו מחרוזת ה-`DATABASE_URL`.
2. **Vercel:** חבר את הריפו, והגדר משתנה סביבה אחד: `DATABASE_URL` = מחרוזת ה-pooler. פרוס.
   העמוד עולה במצב ריק; הייבוא הראשון יוצר את המפגש הראשון.
3. **אדמין ראשון:** הרץ את ה-SQL שלמעלה (דרך Supabase → SQL Editor) כדי שתוכל להתחבר.
4. **מיתוג:** מחרוזות "אדירים"/"BNI" נמצאות ב-`components/GuestsBoard.tsx`,
   `app/layout.tsx`, `data/seed.ts` וב-`SKILL.md`. החלף אם זה צ'פטר אחר.

## מבנה

- `app/` — עמודים ו-API (`/api/weeks` שמירה/מחיקה/רשימה, `/api/login`).
- `components/` — לוח התצוגה, בורר מפגשים, פאנל הייבוא, רקע וקונפטי.
- `lib/` — טיפוסים, פרסור, סיווג, טלפון, תאריכים, אימות (`auth.ts`), גישת DB (`db/`, `repo.ts`).
- `data/seed.ts` — נתוני שבוע לדוגמה (אופציונלי).
- `SKILL.md`, `references/`, `assets/` — אימות BNI אופליין (Playwright). לא חלק מזמן הריצה של האפליקציה.
