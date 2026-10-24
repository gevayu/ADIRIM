// Content queries shared by the layout, the pages and /shared/data.js.
import { env } from "cloudflare:workers";
import { getEmDashCollection, getEmDashEntry, getSiteSettings } from "emdash";

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

// Circle display order. ponytail: mirrors the options of the members' "מעגל כוח" select field, which site code
// can't read at runtime; a circle added in the admin still shows (appended) until it's added here.
const seedCircles: string[] = ["B2B", "שיווק ודיגיטל", "ייעוץ אסטרטגי לעסקים", "משפחה", "בית ונדל״ן", "בריאות וזכויות", "אירועים וחוויות"];
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

// The public address for canonical links, the sitemap and structured data: the admin's "Site URL" setting,
// else EMDASH_SITE_URL (wrangler.jsonc), else the address of this request (local dev, previews).
export async function publicOrigin(requestUrl: URL) {
	const url = (await getSiteSettings()).url || ((env as any).EMDASH_SITE_URL as string | undefined) || requestUrl.origin;
	return url.replace(/\/$/, "");
}
