# BNI Adirim site on EmDash

The BNI Adirim site (the design from `../redesign`), with every page and every piece of shared data editable in EmDash.

## Run locally

Runs on Cloudflare Workers (D1 for content, R2 for media). `npm run dev` runs the same Worker locally
in workerd, with a local D1 and R2 under `.wrangler/state`.

```bash
npm install
npm run dev
```

- Site: http://localhost:4321
- Admin: http://localhost:4321/_emdash/admin
- Secrets for local runs come from `.env` (`EMDASH_ENCRYPTION_KEY`, `ANTHROPIC_API_KEY`).

A fresh local database is empty. Load the content with the latest export:
`npx emdash site import backups/<file>.emdash --analyze -u http://localhost:4321`, then the same with
`--plan <digest> --confirm`.

On a machine low on memory, the bundler can crash during "bundling dependencies". Running with fewer bundler threads helps:
`RAYON_NUM_THREADS=2 npx astro dev`.

## Deploy (Cloudflare)

One-time, in the Cloudflare account: enable R2 (Dashboard › R2; free tier, asks for a payment method). The Workers
Paid plan ($5/month) is recommended: the free plan allows 10 ms of CPU per request, which server rendering, the
first-request migrations and the import are likely to exceed. Not measured yet; check `wrangler tail` after deploy.

```bash
npx wrangler login
npx wrangler secret put EMDASH_ENCRYPTION_KEY   # the same value as in .env
npx wrangler secret put ANTHROPIC_API_KEY
npm run deploy                                  # build + wrangler deploy; creates D1, R2 and KV on the first run
npx emdash doctor --url https://<worker>.workers.dev
```

Then, before anyone sets up the admin: set `EMDASH_SITE_URL` in `wrangler.jsonc` to the final domain
(passkeys bind to the address where setup runs) and deploy again. In the admin's first-run setup choose
"Import an existing EmDash site" and upload the newest `backups/*.emdash`, or run `emdash site import`
against the live URL with an API token.

Custom domain: the domain must be on Cloudflare in the same account; add
`"routes": [{ "pattern": "example.com", "custom_domain": true }]` to `wrangler.jsonc` and deploy.

## Where things live

| What | Where |
|---|---|
| Page text (all 41 pages) | Admin › עמודים. Rich text, plus HTML blocks for markup with its own structure (cards, forms, callouts) |
| Members, photos, circles, phones | Admin › חברים |
| Meetings (date, speaker, place) | Admin › מפגשים. A meeting disappears from the site once it ends |
| Home-page Q&A | Admin › שאלות בעמוד הבית |
| Address, price, payment terms, agenda, term figures, links, footer text | Admin › פרטי הקבוצה (one entry, `main`) |
| Header, CTA button, footer columns | Admin › Menus (`primary`, `cta`, `footer_*`) |
| Design: shared CSS, fonts, logo | `public/shared/site.css`, `public/assets/` |
| Per-page CSS and scripts | `src/page-assets/<slug>.css` / `.js` |
| Layout per template (legal, guide chapter, club, landing) | `src/components/PageView.astro` |

The page scripts from the static site run unchanged. They read the same globals as before
(`window.MEMBERS`, `MEETINGS`, `MEETING`, `LINKS`, `TERM`, `FAQ`), now served by
`src/pages/shared/data.js.ts` from the CMS.

The chapter list and pager in the guide, the club side menu and "פרק NN מתוך N" are built from the
pages' `sort`, `nav_label` and `nav_group` fields, so reordering in the admin updates them everywhere.

## Guest matcher (מדריך לאורח, פרק 02)

The guest answers a few questions (trade, goals, ideal client, who refers work to them) and gets 3 members to meet,
each with "why this one" and a question to ask, plus up to 2 members from the trade that refers work to them.

- `src/pages/api/match.ts`: sends the answers and the member list (bios + hidden tags) to Claude (`claude-opus-5-5`,
  low effort, JSON schema, server-side refusal fallback). Unknown ids are dropped. If the API fails, a keyword match
  on the tags answers instead.
- Needs the `ANTHROPIC_API_KEY` Worker secret (`.env` locally). Limits: 3 requests per visitor address per minute
  (Cloudflare rate limiting binding `MATCH_LIMIT`, not enforced in local dev) and a honeypot field. Set a monthly
  spend limit on the key in the Anthropic console as the overall cap.
- `src/page-assets/guest-guide.js|.css`: the form and the result cards. The last result is kept in the browser.

## Home page

`/` is the card-tunnel version since 2026-10-24 (`/index-tunnel` redirects there). The previous home page is kept as
the hidden page `home-classic` (noindex) with its own `src/page-assets/home-classic.*`.

## Backups and the content snapshot

- `backups/*.emdash` (not in git): the whole site, content and media, from
  `npx emdash site export -o backups/<date>.emdash -u <site url>`. This is what moves the site between
  servers. Make one before every deploy that changes the schema.
- `seed/snapshot.json` (in git): schema, menus and content as JSON, for reading diffs. Not loaded
  automatically (an import needs an empty site). Refresh with
  `npx emdash export-seed --with-content=all > seed/snapshot.json`, then drop members' `photo` values.

## Original migration from the static site

The one-time conversion from `../redesign`, kept for reference:

```bash
node tools/dump_data.mjs ../redesign > tools/data.json
python tools/build_seed.py ../redesign     # add --assets to also rewrite src/page-assets (overwrites edits made since)
python tools/upload_photos.py ../redesign   # with the dev server running
python tools/compare.py                     # every page vs. the static site (both servers running)
```

EmDash refuses to download seed images from localhost, so photos go up through the running site
(`upload_photos.py`) instead of `$media` in the seed.

## Secrets

`.env` holds `EMDASH_ENCRYPTION_KEY`. It is git-ignored. Keep a copy somewhere safe: the deployed
site needs the same key, or stored secrets can't be decrypted.
