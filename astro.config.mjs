import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";

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
	devToolbar: { enabled: false },
});
