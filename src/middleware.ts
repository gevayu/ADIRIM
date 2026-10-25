// Runs before routing.
// 0. www goes to the bare domain.
// 1. Old addresses keep working (301): this site's .html file names, and the previous live site's
//    /members/<name> and /guide/<chapter> (indexed by search engines; the same name slugs as /member?m=).
// 2. /sitemap.xml belongs to EmDash, which only lists collections with its SEO module and a URL pattern;
//    robots.txt points there, so serve our sitemap (pages + member cards) at that address.
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((ctx, next) => {
	// www.bni-adirim.co.il -> bni-adirim.co.il, as the previous site did.
	if (ctx.url.hostname.startsWith("www.")) {
		const to = new URL(ctx.url);
		to.hostname = to.hostname.slice(4);
		return ctx.redirect(to.toString(), 301);
	}
	const path = ctx.url.pathname;
	const moved = (to: string) => ctx.redirect(to + (to.includes("?") ? "" : ctx.url.search), 301);

	if (path.endsWith(".html") && !path.startsWith("/_emdash")) {
		const name = path.slice(1, -5);
		return moved(name === "index" ? "/" : `/${name}`);
	}
	const member = path.match(/^\/members\/([^/]+)\/?$/);
	if (member) return moved(`/member?m=${encodeURIComponent(decodeURIComponent(member[1]))}`);
	const chapter = path.match(/^\/guide\/([a-z0-9-]+)\/?$/);
	if (chapter) return moved(`/guide-${chapter[1]}`);

	if (path === "/sitemap.xml") return ctx.rewrite("/sitemap-site.xml");
	return next();
});
