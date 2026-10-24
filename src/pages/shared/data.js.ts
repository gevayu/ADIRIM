// The globals every page script reads (window.MEMBERS, MEETINGS, MEETING, LINKS, TERM, FAQ...),
// built from the CMS. Same names and shapes as the static site's shared/data.js, so the page
// scripts run unchanged.
import type { APIRoute } from "astro";
import { circleOrder, getFaqs, getGroup, getMeetings, getMembers, publicRole } from "../../lib/site";

const digits = (s: string) => s.replace(/\D/g, "");
const slugOf = (name: string) => name.replace(/[׳״']/g, "").replace(/ /g, "-");


export const GET: APIRoute = async ({ locals }) => {
	const [members, meetings, faqs, g] = await Promise.all([getMembers(), getMeetings(), getFaqs(), getGroup()]);
	// Local media keep only a storage key; the public URL is derived here.
	const photoUrl = (p: any) => {
		const k = p?.meta?.storageKey;
		return p?.src ?? (k ? ((locals as any).emdash?.getPublicMediaUrl?.(k) ?? `/_emdash/api/media/file/${k}`) : null);
	};

	const MEMBERS = members.map(({ data: m }: any) => ({
		name: m.name, role: publicRole(m.role ?? ""), fullRole: m.role ?? "", biz: m.business ?? null, cat: m.category ?? null, site: m.website || null,
		phone: m.phone || null,
		wa: m.phone ? "972" + digits(m.phone).slice(1) : m.whatsapp || null,
		group: m.circle || undefined,
		img: photoUrl(m.photo),
		lowres: (m.photo?.width ?? 400) < 400,
		initials: m.name.split(" ").slice(0, 2).map((w: string) => w[0]).join(""),
		slug: slugOf(m.name),
		page: `/member?m=${encodeURIComponent(slugOf(m.name))}`,
		bio: m.bio || null,
		tags: m.tags || "",
	}));
	const GROUPS = circleOrder([...new Set(MEMBERS.map((m) => m.group).filter(Boolean) as string[])]);

	const MEETINGS = meetings.map(({ data: m }: any) => ({
		date: new Date(m.starts_at).toISOString(), end: new Date(m.ends_at).toISOString(),
		speaker: m.speaker, topic: m.topic ?? "", title: m.talk_title || null, place: m.place,
	}));

	const BASE = {
		hours: g.hours, place: g.place, address: g.address, parking: g.parking,
		price: g.price, priceNote: g.price_note,
		terms: (g.pay_terms ?? []).map((t: any) => t.text),
		agenda: (g.agenda ?? []).map((a: any) => [a.time, a.title, a.text ?? ""]),
	};
	const LINKS = {
		pay: g.link_pay, parking: g.link_parking, apply: g.link_apply, whatsapp: g.link_whatsapp,
		facebook: g.link_facebook, instagram: g.link_instagram, invitePage: g.link_invite_page,
	};
	const TERM = { referrals: g.term_referrals, oneOnOnes: g.term_one_on_ones, income: g.term_income, previous: g.term_previous };
	const FAQ = faqs.map(({ data: f }: any) => [f.question, f.answer]);

	const js = `// Generated from the CMS on every request. Edit the content in /_emdash/admin.
window.MEMBERS = ${JSON.stringify(MEMBERS)};
window.GROUPS = ${JSON.stringify(GROUPS)};
window.MEMBERS.filter(m => !m.group).forEach(m => console.warn("member without a circle:", m.name));

// Every bookable meeting, nearest first. A meeting disappears once it has ended.
window.MEETINGS = ${JSON.stringify(MEETINGS)}
  .map(m => ({ ...m, date: new Date(m.date), end: new Date(m.end) }))
  .filter(m => m.end > Date.now());

// The next meeting, in the shape the pages were written for.
(function () {
  const BASE = ${JSON.stringify(BASE)};
  const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const MONTHS = ["בינואר", "בפברואר", "במרץ", "באפריל", "במאי", "ביוני", "ביולי", "באוגוסט", "בספטמבר", "באוקטובר", "בנובמבר", "בדצמבר"];
  const m = window.MEETINGS[0];
  if (!m) { window.MEETING = { ...BASE, date: new Date(0), end: new Date(0), title: "", speaker: "", speakerTopic: "", fullAddress: "", day: "", dayShort: "", dateLabel: "" }; return; }
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", weekday: "short" })
    .formatToParts(m.date).map(x => [x.type, x.value]));
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  window.MEETING = { ...BASE, title: m.title || "", speaker: m.speaker, speakerTopic: m.topic, date: m.date, end: m.end,
    fullAddress: m.place, day: p.day + "." + p.month, dayShort: p.day + "/" + p.month,
    dateLabel: DAYS[dow] + ", " + p.day + " " + MONTHS[p.month - 1] };
})();

window.UPCOMING = { place: window.MEETINGS[1]?.place || window.MEETING.fullAddress, hours: window.MEETING.hours,
  list: window.MEETINGS.slice(1).map(m => [m.date.toISOString().slice(0, 10), m.speaker, m.topic]) };

window.LINKS = ${JSON.stringify(LINKS)};
window.TERM = ${JSON.stringify(TERM)};
window.FAQ = ${JSON.stringify(FAQ)};

// Every member count in the copy is <span data-members>, filled from the list itself.
document.querySelectorAll("[data-members]").forEach(el => el.textContent = window.MEMBERS.length);
// Same for the term figures: <b data-term="referrals"> etc. read window.TERM.
document.querySelectorAll("[data-term]").forEach(el => el.textContent = window.TERM[el.dataset.term]);

window.waLink = m => m.wa ? \`https://wa.me/\${m.wa}\` : null;
window.countdown = () => {
  const ms = window.MEETING.date - Date.now();
  if (ms <= 0) return null;
  return { d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60 };
};
`;
	return new Response(js, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" } });
};
