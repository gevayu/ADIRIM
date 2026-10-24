// Sitemap: every indexable page plus every member card, served at /sitemap.xml by src/middleware.ts.
import type { APIRoute } from "astro";
import { getEmDashCollection } from "emdash";
import { getMembers, pagePath, publicOrigin } from "../lib/site";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const day = (d: any) => (d ? new Date(d).toISOString().slice(0, 10) : undefined);

export const GET: APIRoute = async ({ url }) => {
	const origin = await publicOrigin(url);
	const [{ entries: pages }, members] = await Promise.all([getEmDashCollection("pages", { limit: 500 }), getMembers()]);
	const urls: { loc: string; lastmod?: string }[] = [];
	for (const p of pages as any[]) {
		if (p.data.noindex || p.id === "member") continue;
		urls.push({ loc: origin + pagePath(p.id), lastmod: day(p.data.updatedAt) });
	}
	for (const { data: m } of members as any[]) {
		const slug = m.name.replace(/[׳״']/g, "").replace(/ /g, "-");
		urls.push({ loc: `${origin}/member?m=${encodeURIComponent(slug)}`, lastmod: day(m.updatedAt) });
	}
	const body = urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n");
	return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
		{ headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
