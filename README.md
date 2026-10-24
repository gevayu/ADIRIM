# BNI Adirim site on EmDash

The BNI Adirim site (the design from `../redesign`), with every page and every piece of shared data editable in EmDash.

## Run locally

```bash
npm install
npm run dev
```

- Site: http://localhost:4321
- Admin: http://localhost:4321/_emdash/admin

On a machine low on memory, the bundler can crash during "bundling dependencies". Running with fewer bundler threads helps:
`RAYON_NUM_THREADS=2 npx astro dev`.

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

## The seed

`seed/seed.json` is a snapshot of the CMS (schema, menus and all content except photos). Refresh it before committing content changes:

```bash
npx emdash export-seed --with-content=all > seed/seed.json   # then drop members' "photo" values: local media URLs don't carry over
```

A fresh copy: `npm install`, `npx emdash seed seed/seed.json --database ./data.db`, `npm run dev`, then `python tools/upload_photos.py ../redesign`.

## Original migration from the static site

The one-time conversion from `../redesign`, kept for reference:

```bash
node tools/dump_data.mjs ../redesign > tools/data.json
python tools/build_seed.py ../redesign     # add --assets to also rewrite src/page-assets (overwrites edits made since)
npx emdash seed seed/seed.json --database ./data.db
python tools/upload_photos.py ../redesign   # with the dev server running
python tools/compare.py                     # every page vs. the static site (both servers running)
```

EmDash refuses to download seed images from localhost, so photos go up through the running site
(`upload_photos.py`) instead of `$media` in the seed.

## Secrets

`.env` holds `EMDASH_ENCRYPTION_KEY`. It is git-ignored. Keep a copy somewhere safe: the deployed
site needs the same key, or stored secrets can't be decrypted.
