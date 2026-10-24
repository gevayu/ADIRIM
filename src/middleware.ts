// /sitemap.xml belongs to EmDash, which only lists collections with its SEO module and a URL
// pattern; robots.txt points there. Serve our sitemap (pages + member cards) at that address.
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((ctx, next) =>
	ctx.url.pathname === "/sitemap.xml" ? ctx.rewrite("/sitemap-site.xml") : next(),
);
