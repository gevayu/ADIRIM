// זריעת נתוני השבוע של 23/07/2026 (הרשימה מהתבנית המקורית).
// הרצה: npm run seed
import { saveWeek } from "../lib/repo";
import type { Visitor } from "../lib/types";

const visitors: Visitor[] = [
  { first: "מיטל", last: "בוארון", company: "עריכת דין", inviter: "הילה דיין", phone: "050-301-3560", email: "Meital0511@gmail.com", type: "visitor", gender: "f", bniMember: true },
  { first: "ארז", last: "בכר", company: "דוקטור לניקוי מזגנים", inviter: "יובל גבע", phone: "052-482-5010", email: "erez.hamama@gmail.com", type: "visitor", gender: "m", bniMember: false },
  { first: "ליאת", last: "דוד", company: "מנתחת התנהגות מוסמכת", inviter: "חרמון דוד", phone: "052-623-4456", email: "liatkd07@gmail.com", type: "sub", gender: "f", bniMember: false },
  { first: "רפאל", last: "דמרי", company: "תריסי אומן", inviter: "רפאל דמרי", phone: "050-858-0861", email: "Rafael.damari1980@gmail.com", type: "visitor", gender: "m", bniMember: true },
  { first: "אילונה", last: "דנילביץ", company: "ייעוץ ארגוני אימון אישי - אפשר אחרת", inviter: "דניאל מרגולין", phone: "053-788-7997", email: "ilonad@gmail.com", type: "guest", gender: "f", bniMember: false },
  { first: "חזי", last: "יעל", company: "עריכת דין - דיני עבודה", inviter: "אבישג הורוויץ", phone: "054-466-7471", email: "Heziyael82@gmail.com", type: "sub", gender: "m", bniMember: true },
  { first: "דור", last: "כהן", company: "עורך דין פלילי ותעבורה", inviter: "אביטל טבצ'ניק", phone: "052-950-0500", email: "Dorcohenlaw@gmail.com", type: "sub", gender: "m", bniMember: true },
  { first: "אוריה", last: "כוכבי", company: "מוסטאש מדיה - שיווק דיגיטלי", inviter: "יובל גבע", phone: "052-687-4088", email: "uriako@mustache-media.com", type: "guest", gender: "m", bniMember: false },
  { first: "זיו", last: "ליטני", company: "יועץ בינה מלאכותית - Artsense", inviter: "דניאל מרגולין", phone: "052-823-0168", email: "Ziv.litani@gmail.com", type: "guest", gender: "m", bniMember: false },
  { first: "אליעזר", last: "לייאנס", company: "בנקאות אישית", inviter: "אייל חריף", phone: "058-790-0001", email: "chabad.lyons@gmail.com", type: "guest", gender: "m", bniMember: false },
  { first: "שיר", last: "סטון", company: "סושיאל - Shir Digitals", inviter: "יובל גבע", phone: "055-975-8200", email: "shircob@gmail.com", type: "visitor", gender: "f", bniMember: false },
  { first: "טליה", last: "סספורטס", company: "הפקות וידאו - אולפני צעד", inviter: "הילה דיין", phone: "052-486-8929", email: "Office@zaad.co.il", type: "guest", gender: "f", bniMember: false },
  { first: "יובל", last: "פנקס", company: 'השקעות נדל"ן - Y&S 360', inviter: "אליאן אבן", phone: "054-454-7183", email: "yuvalp01@gmail.com", type: "sub", gender: "m", bniMember: true },
  { first: "נוי", last: "רובינשטיין", company: "פרסום ושיווק", inviter: "דניאל מרגולין", phone: "050-232-0103", email: "noyrubin@gmail.com", type: "guest", gender: "f", bniMember: false },
  { first: "מעיין", last: "רונן ברן", company: "מעיין רונן מעצבת פנים", inviter: "מעיין רונן ברן", phone: "052-269-0321", email: "maayanron11@gmail.com", type: "visitor", gender: "f", bniMember: true },
  { first: "יעל", last: "שביט", company: "הדרכה ואימון", inviter: "אסנת בירן", phone: "054-421-1082", email: "Yaelshavit1@gmail.com", type: "guest", gender: "f", bniMember: false },
  { first: "חגית", last: "שוורץ", company: "פרסום ושיווק", inviter: "גדי סולומון", phone: "052-461-7161", email: "Sgulat@gmail.com", type: "guest", gender: "f", bniMember: false },
  { first: "יפעת", last: "שטרנברג", company: "פיתוח אפליקציות", inviter: "יניב כהן", phone: "050-421-2787", email: "ifatshterenberg@gmail.com", type: "guest", gender: "f", bniMember: false },
  { first: "תומר", last: "שילה", company: "עריכת דין - הוצאה לפועל", inviter: "תומר שילה", phone: "052-259-4506", email: "tomer@shilolaw.com", type: "sub", gender: "m", bniMember: true },
];

async function main() {
  const week = await saveWeek("2026-07-23", visitors);
  console.log(`seeded week ${week.meetingDate} with ${week.visitors.length} visitors`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
