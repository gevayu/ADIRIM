// סוגי הרשומות המשותפים לכל האפליקציה.

export type GuestType = "guest" | "sub" | "visitor" | "candidate";
export type Gender = "m" | "f";

export interface Visitor {
  first: string;
  last: string;
  company: string;
  inviter: string;
  phone: string;
  email: string;
  type: GuestType;
  gender: Gender;
  bniMember: boolean;
}

export interface Week {
  id: number;
  meetingDate: string; // YYYY-MM-DD
  visitors: Visitor[];
}

// שורה כפי שהיא יוצאת מפרסור גולמי, לפני ביקורת ואישור.
// כל שדה יכול להיות ריק/לא ודאי, וטבלת הביקורת מתקנת.
export interface ParsedRow extends Visitor {}

export const emptyVisitor = (): Visitor => ({
  first: "",
  last: "",
  company: "",
  inviter: "",
  phone: "",
  email: "",
  type: "guest",
  gender: "m",
  bniMember: false,
});
