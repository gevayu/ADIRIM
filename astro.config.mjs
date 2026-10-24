import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, dirname, join } from "node:path";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";

// The EmDash admin ships its interface in ~36 languages, ~70 KB compressed each, and the Worker bundles them all
// (over the free plan's 3 MB limit). Keep Hebrew and English; every other catalog becomes a one-line module that
// re-exports English, the same fallback the admin uses for a language it has no catalog for.
const ADMIN_LOCALES_KEPT = ["he", "en"];
function adminLocales() {
	const dist = dirname(fileURLToPath(import.meta.resolve("@emdash-cms/admin"))); // .../@emdash-cms/admin/dist
	const { locales } = JSON.parse(readFileSync(join(dist, "locales-manifest.json"), "utf8"));
	const english = locales.en;
	const dropped = new Set(Object.entries(locales).filter(([l]) => !ADMIN_LOCALES_KEPT.includes(l)).map(([, file]) => file));
	return {
		name: "adirim:admin-locales",
		enforce: "pre",
		load(id) {
			const file = basename(id.split("?")[0]);
			if (id.includes("@emdash-cms") && id.includes("admin") && dropped.has(file)) return `export { messages } from "./${english}";`;
		},
	};
}

// Astro leaves server code unminified, and the Worker is uploaded as built (the free plan caps it at 3 MB).
// Runs after Astro's own config so it isn't reset.
function minifyServer() {
	return {
		name: "adirim:minify-server",
		enforce: "post",
		configEnvironment(name) {
			if (name !== "client") return { build: { minify: true } };
		},
	};
}

// Cloudflare Workers: content in D1 (binding DB), media in R2 (binding MEDIA). See wrangler.jsonc.
export default defineConfig({
	output: "server",
	adapter: cloudflare({ imageService: "passthrough" }), // photos are served as uploaded; no Cloudflare Images
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto", coalesce: true }),
			storage: r2({ binding: "MEDIA" }),
		}),
	],
	vite: { plugins: [adminLocales(), minifyServer()] },
	devToolbar: { enabled: false },
});
