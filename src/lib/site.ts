// Content queries shared by the layout, the pages and /shared/data.js.
import { getEmDashCollection, getEmDashEntry } from "emdash";
import seed from "../../seed/snapshot.json";

const all = { limit: 500 } as const;

export async function getMembers() {
	const { entries } = await getEmDashCollection("members", { ...all, orderBy: { sort: "asc" } });
	return entries;
}

export async function getMeetings() {
	const { entries } = await getEmDashCollection("meetings", { ...all, orderBy: { starts_at: "asc" } });
	return entries;
}

export async function getFaqs() {
	const { entries } = await getEmDashCollection("faqs", { ...all, orderBy: { sort: "asc" } });
	return entries;
}

export async function getGroup() {
	const { entry } = await getEmDashEntry("group_info", "main");
	return (entry?.data ?? {}) as Record<string, any>;
}

export async function getPagesByTemplate(template: string) {
	const { entries } = await getEmDashCollection("pages", { ...all, where: { template }, orderBy: { sort: "asc" } });
	return entries;
}

// ponytail: circle order comes from the seed's select options, because the schema's options
// aren't exposed to site code. A circle added in the admin still shows, appended at the end.
const seedCircles: string[] =
	(seed as any).collections.find((c: any) => c.slug === "members").fields.find((f: any) => f.slug === "circle").validation.options;
export function circleOrder(used: string[]) {
	return [...seedCircles.filter((c) => used.includes(c)), ...used.filter((c) => !seedCircles.includes(c))];
}

// The "home" page entry is served at "/".
export const pagePath = (slug: string) => (slug === "home" ? "/" : `/${slug}`);

// A role may start with a chapter title before " · " ("צוות אירוח · יחסי ציבור"). Public listings show
// only the leadership titles (chair, vice chair, treasurer); other titles stay in fullRole for the club pages.
const CHAPTER_TITLE = /^(יו״ר|סגנ|גזבר|ועדת|חונכות|צוות|תיאום|אחראי|אוריינטציה)/;
const SHOWN_TITLE = /^(יו״ר|סגנ\S* יו״ר|גזבר)/;
export const publicRole = (role: string) => {
	const [first, ...rest] = role.split(" · ");
	return rest.length && CHAPTER_TITLE.test(first) && !SHOWN_TITLE.test(first) ? rest.join(" · ") : role;
};
