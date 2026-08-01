# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The repo holds **two coexisting things** for the weekly BNI אדירים visitor list:

1. **A Next.js app** (App Router, TypeScript) — the live weekly tool. Import a list
   (paste / CSV / Excel), correct it in an editable review grid, save to a database, and
   render the styled board (stats, inviter ranking, sortable table, WhatsApp, Excel export).
2. **The original skill** (`SKILL.md`, `references/`, `assets/`) — still the source of truth
   for **BNI membership verification**, which runs *offline* via Playwright. See below.

The two are decoupled by design: **the app does not verify BNI membership.** Verification
happens outside the browser (the skill's `bni_verify.py`), and its result is entered into the
app through the review grid's per-row `BNI` checkbox and `type` dropdown.

## Commands

Node/npm for the app; `python3` + POSIX `timeout` (via the **Bash** tool) for the skill scripts.

```bash
npm install         # once
npm run seed        # load the 23/07/2026 sample week into the local DB
npm run dev         # http://localhost:3000
npm run build       # production build
npx tsc --noEmit    # typecheck (no dedicated test suite)
```

Skill-side verification (unchanged, offline):

```bash
timeout 118 python3 references/bni_verify.py "[('שניר','אוזנוביץ'),('רונית','שגיב')]"
```

## App architecture

```
Import (paste/CSV/Excel) ──parse──> Review grid (edit every field) ──POST /api/weeks──> DB
                                                                                          │
                                              page.tsx (server) reads current week ◄──────┘
                                                        │
                                                 GuestsBoard (client) renders the design
```

- **Data flow is server → client.** `app/page.tsx` is a server component that reads the
  current week via `lib/repo.ts` and hands it to `components/GuestsApp.tsx` (client), which
  toggles between the board and the import/edit panel.
- **`lib/repo.ts` is the only data-access layer.** `getCurrentWeek` = latest `meeting_date`.
  `saveWeek` is an **upsert by date**: saving a date that already exists replaces that week's
  visitors (delete + insert), so re-importing the same week overwrites rather than duplicates.
- **API routes** (`app/api/weeks/…`) are thin wrappers over `repo.ts`. `POST /api/weeks`
  validates the date shape and returns the saved week; the client swaps it into state.

### Database (libSQL / Turso, via Drizzle)

- `lib/db/index.ts` creates a libSQL client from `DATABASE_URL` (+ `DATABASE_AUTH_TOKEN`).
  Local dev uses `file:./data/local.db` (gitignored); Vercel uses a Turso URL + token.
- **No migration step.** `ensureSchema()` runs idempotent `CREATE TABLE IF NOT EXISTS` and is
  awaited by every repo call. If you change `lib/db/schema.ts`, update the raw DDL in
  `ensureSchema()` too — they are two hand-kept copies of the same schema.
- Schema: `weeks (id, meeting_date UNIQUE, created_at)` and `visitors (…, position, type,
  gender, bni_member)`. `bni_member` is stored `0/1`; `repo.ts` maps it to the boolean
  `bniMember`. Visitor order is preserved via `position`.

### Editor gate (`lib/auth.ts`)

Editing is password-gated; the public view is read-only. Login (`/login` → `POST
/api/login`) checks `ADMIN_USER` (case-insensitive) + `ADMIN_PASSWORD` and sets an httpOnly
cookie holding `sessionToken()` — a SHA-256 of `user:password`, not the raw password.
`isAdmin()` (used by `app/page.tsx` and guarding `POST /api/weeks`) recomputes that token and
compares. **If either env var is unset, editing is locked for everyone** (fail-safe). Changing
either env value rotates the token and invalidates existing sessions. The gate is enforced
server-side on the write API, so hiding the button is not the security boundary.

### Domain logic (ported from the skill, shared client/server)

- `lib/classify.ts` — gender inference and the guest/sub/visitor/candidate labels. **The
  expensive rule survives here: a `sub` who is a verified member stays `sub`** (only gains the
  BNI badge). The review grid never auto-flips type. `femaleNames` is a fallback set for when
  `gender` is absent; prefer the explicit `gender` field.
- `lib/phone.ts` — `normPhone` (display `0XX-XXX-XXXX`, applied on save in `repo.ts`) and
  `waLink` (wa.me form). Both strip an accidental trunk-zero after `972`; fix them together.
- `lib/parse.ts` — best-effort import. Maps many Hebrew/English header aliases, infers `type`
  from the source label, takes the **Hebrew part of bilingual names** ("תומר Tomer" → "תומר"),
  and reads a `חבר BNI` column if present. Parsing is deliberately fuzzy; **the review grid is
  where accuracy is enforced**, not the parser.
- `lib/dates.ts` — Hebrew/slash/file date formats (ports `HEB_MONTHS` from `build.py`).

### Design port notes

The board (`GuestsBoard`), animated background (`BackgroundCanvas`), and confetti
(`useConfetti`) are 1:1 ports of the original standalone HTML. The site font is **Google Sans**
(OFL, Hebrew + Latin subsets), loaded via a Google Fonts `<link>` in `app/layout.tsx` and set
on `body` in `globals.css`; it replaced the original proprietary `'YouTube Sans'`. Google Sans
is a variable font capped at weight 700, so `font-weight: 900` (e.g. `.bni-logo`) renders at
700. The paste `<textarea>` stays monospace on purpose (column alignment while pasting).
`xlsx` is dynamically imported in the export handler to keep it out of the initial bundle.

## Deployment (GitHub + Vercel)

`data/local.db` is gitignored and won't deploy. On Vercel, set `DATABASE_URL` (Turso
`libsql://…`), `DATABASE_AUTH_TOKEN`, and the editor login `ADMIN_USER` + `ADMIN_PASSWORD`;
the app starts with an empty-state and the first import creates the first week. To preload the
sample week against a remote DB, run `npm run seed` with those env vars set. See `README.md`.

## The original skill (offline verification)

Unchanged. `references/bni_verify.py` drives real Chromium against the official
`bni.co.il/iw/findamember` form; only an exact match prints `MEMBER-EXACT`. **Google/web_search
is not used** — it misses most `memberdetails` pages. `references/build.py` (the old static-HTML
generator) and `assets/template.html` remain as reference for the original output; the app has
superseded them for producing the weekly page. See `SKILL.md` and `references/verification.md`
for the verification decision table.
