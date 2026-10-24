# Builds seed/seed.json and src/page-assets/ from the static site in ../redesign.
#
#   node tools/dump_data.mjs ../redesign > tools/data.json
#   python tools/build_seed.py ../redesign
#
# Content goes to the seed (editable in the admin). Design stays in code: each page's own
# <style> and <script> are written to src/page-assets/<slug>.css / .js, unchanged except for links.
# Prose that is plain rich text becomes Portable Text; anything with its own markup
# (cards, callouts, forms, data-* hooks) becomes an HTML block so it renders exactly as before.
import hashlib, json, pathlib, re, sys
from bs4 import BeautifulSoup, NavigableString, Tag

sys.stdout.reconfigure(encoding="utf-8")
SRC = pathlib.Path(sys.argv[1]).resolve()
SITE = pathlib.Path(__file__).resolve().parent.parent
DATA = json.loads((SITE / "tools" / "data.json").read_text(encoding="utf-8"))
ASSETS = SITE / "src" / "page-assets"
SKIP = {"d1-directory.html", "d2-portraits.html", "d3-morning.html", "directions.html"}

def key(*parts):
    return hashlib.md5("|".join(map(str, parts)).encode()).hexdigest()[:12]

# ---------- links: page.html -> /page ----------
LINK = re.compile(r'(?<![\w./-])([a-z][a-z0-9-]*)\.html')
def rw_url(u):
    if not u or re.match(r"^(https?:|mailto:|tel:|#|/|data:|javascript:)", u): return u
    u = re.sub(r"^index\.html", "/", u)
    u = LINK.sub(lambda m: "/" + m[1], u)
    if u.startswith(("assets/", "shared/")): u = "/" + u
    return u.replace("/#", "/#") if u != "/" else u
def rw_text(s):  # JS / CSS bodies
    s = re.sub(r'(?<![\w./-])index\.html', "/", s)
    s = LINK.sub(lambda m: "/" + m[1], s)
    return re.sub(r'(["\'(])assets/', r"\1/assets/", s)
def rw_tree(el):
    for t in ([el] if el.name else []) + el.find_all(True):
        for a in ("href", "src", "action"):
            if t.has_attr(a): t[a] = rw_url(t[a])

# ---------- Portable Text ----------
BLOCK_STYLE = {"p": "normal", "h2": "h2", "h3": "h3", "h4": "h4", "blockquote": "blockquote"}
INLINE_MARK = {"strong": "strong", "b": "strong", "em": "em", "i": "em"}
MEMBER_PAGE = {m["name"]: "/member?m=" + m["page"].split("m=")[1] for m in DATA["members"]}

def inline_ok(el):
    for t in el.find_all(True):
        if t.name in INLINE_MARK and not t.attrs: continue
        if t.name == "a" and set(t.attrs) <= {"href", "target", "rel", "data-member", "data-member-name"}:
            name = t.get("data-member") or t.get("data-member-name")
            if name and name not in MEMBER_PAGE: return False
            continue
        return False
    return True

def plain(el):
    if el.name in BLOCK_STYLE: return not el.attrs and inline_ok(el)
    if el.name in ("ul", "ol"):
        lis = [c for c in el.children if isinstance(c, Tag)]
        return not el.attrs and all(li.name == "li" and not li.attrs and inline_ok(li) for li in lis) and \
            not any(isinstance(c, NavigableString) and c.strip() for c in el.children)
    return False

def spans(el, k):
    out, defs = [], []
    def walk(node, marks):
        for c in node.children:
            if isinstance(c, NavigableString):
                out.append([str(c), marks])
            elif c.name in INLINE_MARK:
                walk(c, marks + [INLINE_MARK[c.name]])
            elif c.name == "a":
                name = c.get("data-member") or c.get("data-member-name")
                href = MEMBER_PAGE[name] if name else rw_url(c.get("href", ""))
                d = {"_type": "link", "_key": key(k, "l", len(defs)), "href": href}
                if c.get("target") == "_blank": d["blank"] = True
                defs.append(d); walk(c, marks + [d["_key"]])
    walk(el, [])
    # collapse whitespace the way the browser does, then trim the block's ends
    text = [[re.sub(r"\s+", " ", t), m] for t, m in out]
    merged = []
    for t, m in text:
        if merged and merged[-1][1] == m: merged[-1][0] += t
        else: merged.append([t, m])
    if merged: merged[0][0] = merged[0][0].lstrip(); merged[-1][0] = merged[-1][0].rstrip()
    for i in range(1, len(merged)):
        if merged[i - 1][0].endswith(" ") and merged[i][0].startswith(" "): merged[i][0] = merged[i][0][1:]
    children = [{"_type": "span", "_key": key(k, "s", i), "text": t, "marks": m} for i, (t, m) in enumerate(merged) if t]
    return children or [{"_type": "span", "_key": key(k, "s0"), "text": "", "marks": []}], defs

def to_pt(el, k):
    if el.name in BLOCK_STYLE:
        ch, defs = spans(el, k)
        return [{"_type": "block", "_key": k, "style": BLOCK_STYLE[el.name], "markDefs": defs, "children": ch}]
    kind = "bullet" if el.name == "ul" else "number"
    res = []
    for i, li in enumerate(c for c in el.children if isinstance(c, Tag)):
        kk = key(k, i); ch, defs = spans(li, kk)
        res.append({"_type": "block", "_key": kk, "style": "normal", "listItem": kind, "level": 1, "markDefs": defs, "children": ch})
    return res

def html_block(html, k):
    return {"_type": "htmlBlock", "_key": k, "html": html.strip()}

def content_from(nodes, slug, field="content"):
    """Plain prose -> Portable Text; runs of anything else -> one HTML block."""
    blocks, pending = [], []
    def flush():
        if pending:
            blocks.append(html_block("\n".join(pending), key(slug, field, "h", len(blocks)))); pending.clear()
    for i, n in enumerate(nodes):
        if isinstance(n, NavigableString):
            if n.strip(): pending.append(str(n).strip())
            continue
        rw_tree(n)
        if plain(n):
            flush(); blocks += to_pt(n, key(slug, field, i))
        else:
            pending.append(str(n))
    flush()
    return blocks

def sections_as_html(nodes, slug, field):
    out = []
    for i, n in enumerate(n for n in nodes if isinstance(n, Tag)):
        rw_tree(n); out.append(html_block(str(n), key(slug, field, "sec", i)))
    return out

# ---------- hero ----------
HERO_PARTS = [("crumbs", "p"), ("kicker", "p"), ("title", "h1"), ("lede", "p"), ("meta", "p")]
def read_hero(sec):
    """Standard page hero -> fields; None when the hero has its own markup."""
    if not sec or sec.get("class") != ["page-hero"] or set(sec.attrs) - {"class", "aria-labelledby"}: return None
    kids = [c for c in sec.children if isinstance(c, Tag)]
    if len(kids) != 1 or kids[0].name != "div" or kids[0].get("class") not in (["wrap"], ["narrow"]) or len(kids[0].attrs) != 1: return None
    wrap = kids[0]; f = {"hero_wrap": wrap["class"][0], "hero_aria": sec.get("aria-labelledby") == "h1"}
    rest = [c for c in wrap.children if isinstance(c, Tag)]
    for c in rest:
        name = c.get("class", [None])[0] if c.name == "p" else "title"
        if c.name == "h1":
            if set(c.attrs) - {"id"}: return None
        elif c.name != "p" or len(c.get("class", [])) != 1 or name not in ("crumbs", "kicker", "lede", "meta") or len(c.attrs) != 1:
            return None
        if name in f: return None
        rw_tree(c); f[name] = c.decode_contents().strip()
    if "title" not in f: return None
    return f

# ---------- pages ----------
pages, manifest = [], {}
ASSETS.mkdir(parents=True, exist_ok=True)
# One-time migration: this overwrites src/page-assets, which has been edited since. Pass --assets to allow it.
WRITE_ASSETS = "--assets" in sys.argv
if WRITE_ASSETS:
    for old in ASSETS.glob("*"): old.unlink()
INLINE = re.compile(r'<(script|style) data-inline="([^"]+)">.*?</\1>', re.S)

guide_order, club_nav = [], []
for p in sorted(SRC.glob("*.html")):
    if p.name in SKIP: continue
    slug = "home" if p.stem == "index" else p.stem
    raw = p.read_text(encoding="utf-8")
    shared = [m[2] for m in INLINE.finditer(raw)]
    soup = BeautifulSoup(INLINE.sub("", raw), "html.parser")
    title_tag = soup.title.get_text(strip=True) if soup.title else ""
    desc = (soup.find("meta", attrs={"name": "description"}) or {}).get("content", "")
    css = "\n".join(s.string or "" for s in soup.find_all("style"))
    js = [s.string or "" for s in soup.find_all("script") if not s.get("src")]
    if WRITE_ASSETS and css.strip(): (ASSETS / f"{slug}.css").write_text(rw_text(css).strip() + "\n", encoding="utf-8")
    if WRITE_ASSETS and any(j.strip() for j in js): (ASSETS / f"{slug}.js").write_text(rw_text("\n;\n".join(js)).strip() + "\n", encoding="utf-8")
    body_attrs = {k: (rw_url(v) if k == "data-page" else v) for k, v in soup.body.attrs.items()}
    manifest[slug] = {"directory": "shared/directory.js" in shared, "body": body_attrs}

    main = soup.find("main")
    kids = [c for c in main.children if isinstance(c, Tag)]
    hero = read_hero(kids[0]) if kids else None
    rest = kids[1:] if hero else kids
    entry = {"seo_title": title_tag, "description": desc, "title": (hero or {}).get("title") or title_tag.split(" · ")[0]}
    if hero: entry.update({k: v for k, v in hero.items() if k != "title"})
    template, content, after = "landing", None, []

    def sec(cls): return next((c for c in rest if c.get("class") and c["class"][0] == cls), None)
    if (art := sec("legal")) and len(rest) == 1 and (pr := art.select_one(":scope > div.narrow.prose")):
        template, content = "legal", content_from(list(pr.children), slug)
    elif (ch := sec("ch-body")) and (pr := ch.select_one(".ch-grid > article.prose")):
        template = "guide_chapter"
        pager = pr.select_one(":scope > nav.pager")
        if pager: pager.extract()
        content = content_from(list(pr.children), slug)
        after = sections_as_html(rest[rest.index(ch) + 1:], slug, "after")
        if not guide_order:
            guide_order = [(a["href"].replace(".html", ""), a.get_text(" ", strip=True)[2:].strip(), a.span.get_text()) for a in ch.select(".toc a[href$='.html']") if a.span]
    elif (cb := sec("club-body")):
        wrap = cb.select_one(":scope > div.wrap")
        doc = wrap.select_one(":scope > div.doc") if wrap else None
        dm = doc.select_one(":scope > div.doc-main") if doc else None
        if dm and doc.select_one(":scope > nav.side"):
            template = "club"
            kids = [c for c in dm.children if isinstance(c, Tag)]
            prose = next((c for c in kids if c.get("class") == ["prose"]), None)
            if prose:
                i = kids.index(prose)
                assert i == len(kids) - 1, f"{slug}: markup after .prose"
                if i: entry["intro"] = sections_as_html(kids[:i], slug, "intro")
                content = content_from(list(prose.children), slug)
            else:   # no prose column: the page body is its own markup
                entry["prose_wrap"] = False
                content = content_from(kids, slug)
            if not club_nav:
                side = doc.select_one(":scope > nav.side")
                grp = None
                for el in side.find_all(["p", "a"]):
                    if el.name == "p": grp = el.get_text(strip=True)
                    elif "side-home" not in el.get("class", []): club_nav.append((el["href"].replace(".html", ""), el.get_text(strip=True), grp))
        else:
            template = "club_home"
            content = sections_as_html([c for c in wrap.children if isinstance(c, Tag)], slug, "content")
        after = sections_as_html(rest[rest.index(cb) + 1:], slug, "after")
    if content is None:
        content = sections_as_html(rest, slug, "content")
    entry["template"] = template
    entry["content"] = content
    if after: entry["after"] = after
    pages.append((slug, entry))

# order + labels for the chapter list and the club side menu
gi = {s: (i, label) for i, (s, label, _) in enumerate(guide_order)}
ci = {s: (i, label, g) for i, (s, label, g) in enumerate(club_nav)}
for slug, e in pages:
    if slug in gi: e["sort"], e["nav_label"] = gi[slug][0] + 1, gi[slug][1]
    if slug in ci: e["sort"], e["nav_label"], e["nav_group"] = ci[slug][0] + 1, ci[slug][1], ci[slug][2]
    if e["template"] == "guide_chapter":
        e.pop("kicker", None)   # "פרק NN מתוך N" is computed from the order
assert all(e.get("sort") for s, e in pages if e["template"] == "guide_chapter"), "chapter missing from the toc"

if WRITE_ASSETS: (ASSETS / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")

# ---------- data collections ----------
members = []
for i, m in enumerate(DATA["members"]):
    members.append({"id": f"member-{i + 1:02d}", "slug": f"member-{i + 1:02d}", "status": "published", "data": {
        "name": m["name"], "role": m["role"], "business": m["biz"], "category": m["cat"], "circle": m["group"],
        "phone": m["phone"], "whatsapp": None if m["phone"] else m["wa"], "website": m["site"], "sort": i + 1,
    }})
for e in members:
    e["data"] = {k: v for k, v in e["data"].items() if v is not None}

meetings = [{"id": "meeting-" + mt["date"][:10], "slug": mt["date"][:10], "status": "published", "data": {k: v for k, v in {
    "starts_at": mt["date"], "ends_at": mt["end"], "speaker": mt["speaker"], "topic": mt["topic"],
    "talk_title": mt["title"], "place": mt["place"]}.items() if v}} for mt in DATA["meetings"]]

faqs = [{"id": f"faq-{i + 1}", "slug": f"faq-{i + 1}", "status": "published", "data": {"question": q, "answer": a, "sort": i + 1}}
        for i, (q, a) in enumerate(DATA["faq"])]

M, L, T = DATA["meeting"], DATA["links"], DATA["term"]
group = [{"id": "group-main", "slug": "main", "status": "published", "data": {
    "title": "פרטי הקבוצה",
    "hours": M["hours"], "place": M["place"], "address": M["address"], "parking": M["parking"],
    "price": M["price"], "price_note": M["priceNote"],
    "pay_terms": [{"text": t} for t in M["terms"]],
    "agenda": [{"time": a, "title": b, "text": c} for a, b, c in M["agenda"]],
    "term_referrals": T["referrals"], "term_one_on_ones": T["oneOnOnes"], "term_income": T["income"], "term_previous": T["previous"],
    "link_pay": L["pay"], "link_parking": L["parking"], "link_apply": L["apply"], "link_whatsapp": L["whatsapp"],
    "link_facebook": L["facebook"], "link_instagram": L["instagram"], "link_invite_page": L["invitePage"],
    "footer_about": "קבוצת נטוורקינג של BNI בתל אביב. נפגשים כל חמישי ב-7:30 במגדל אדגר 360, ומעבירים עבודה רק למי שסומכים עליו.",
    "footer_base": "BNI אדירים · חלק מרשת BNI ישראל",
}}]

page_entries = []
for slug, e in pages:
    page_entries.append({"id": "page-" + slug, "slug": slug, "status": "published", "data": e})

# ---------- schema ----------
def f(slug, label, type_, **kw): return {"slug": slug, "label": label, "type": type_, **kw}
TEMPLATES = ["landing", "legal", "guide_chapter", "club", "club_home"]
collections = [
    {"slug": "pages", "label": "עמודים", "labelSingular": "עמוד", "supports": ["drafts", "revisions", "search"], "fields": [
        f("title", "כותרת (H1)", "string", required=True, searchable=True),
        f("seo_title", "כותרת בלשונית ובגוגל", "string"),
        f("description", "תיאור לגוגל", "text"),
        f("template", "תבנית", "select", required=True, validation={"options": TEMPLATES}),
        f("crumbs", "פירורי לחם (HTML)", "text"),
        f("kicker", "שורה מעל הכותרת", "string"),
        f("lede", "פסקת פתיחה", "text"),
        f("meta", "שורת מידע מתחת לפתיחה (HTML)", "text"),
        f("hero_wrap", "רוחב ההירו", "select", validation={"options": ["wrap", "narrow"]}),
        f("hero_aria", "ההירו מסומן ככותרת העמוד", "boolean"),
        f("intro", "לפני התוכן (הערות בדיקה וכו׳)", "portableText"),
        f("content", "תוכן", "portableText", searchable=True),
        f("prose_wrap", "התוכן בעמודת טקסט (מועדון)", "boolean"),
        f("after", "אחרי התוכן (פס הזמנה וכו׳)", "portableText"),
        f("nav_label", "שם בתפריט הצד", "string"),
        f("nav_group", "קבוצה בתפריט המועדון", "select", validation={"options": sorted({g for *_, g in club_nav})}),
        f("sort", "סדר", "integer"),
    ]},
    {"slug": "members", "label": "חברים", "labelSingular": "חבר", "supports": ["drafts", "revisions"], "fields": [
        f("name", "שם", "string", required=True, searchable=True),
        f("role", "תפקיד ותחום (תפקיד בקבוצה לפני ·)", "string", required=True),
        f("business", "שם העסק", "string"),
        f("category", "קטגוריה", "string"),
        f("circle", "מעגל כוח", "select", validation={"options": DATA["groups"]}),
        f("photo", "תמונה", "image"),
        f("phone", "טלפון", "string"),
        f("whatsapp", "וואטסאפ (רק אם אין טלפון)", "string"),
        f("website", "אתר", "url"),
        f("sort", "סדר בגלריה", "integer"),
        f("bio", "תיאור קצר (בכרטיס האישי)", "text"),
        f("tags", "תגיות חיפוש נסתרות (מופרדות בפסיקים)", "text"),
    ]},
    {"slug": "meetings", "label": "מפגשים", "labelSingular": "מפגש", "supports": ["drafts"], "fields": [
        f("starts_at", "התחלה", "datetime", required=True),
        f("ends_at", "סיום", "datetime", required=True),
        f("speaker", "המציג (שם החבר, בדיוק כמו ברשימת החברים)", "string", required=True),
        f("topic", "התחום של המציג", "string"),
        f("talk_title", "כותרת ההרצאה", "string"),
        f("place", "מקום", "text", required=True),
    ]},
    {"slug": "faqs", "label": "שאלות בעמוד הבית", "labelSingular": "שאלה", "supports": ["drafts"], "fields": [
        f("question", "שאלה", "string", required=True),
        f("answer", "תשובה", "text", required=True),
        f("sort", "סדר", "integer"),
    ]},
    {"slug": "group_info", "label": "פרטי הקבוצה", "labelSingular": "פרטי הקבוצה", "supports": ["revisions"], "fields": [
        f("title", "שם פנימי", "string", required=True),
        f("hours", "שעות", "string"), f("place", "שם המקום", "string"), f("address", "כתובת קצרה", "string"),
        f("parking", "חניה", "string"), f("price", "מחיר לאורח (₪)", "integer"), f("price_note", "הערת מחיר", "string"),
        f("pay_terms", "תנאי תשלום", "repeater", validation={"subFields": [f("text", "סעיף", "text", required=True)]}),
        f("agenda", "סדר הבוקר", "repeater", validation={"subFields": [
            f("time", "שעה", "string", required=True), f("title", "כותרת", "string", required=True), f("text", "תיאור", "text")]}),
        f("term_referrals", "הפניות בקדנציה", "integer"), f("term_one_on_ones", "מפגשי 1:1 בקדנציה", "integer"),
        f("term_income", "הכנסות בקדנציה", "string"), f("term_previous", "קדנציה קודמת", "string"),
        f("link_pay", "קישור תשלום", "url"), f("link_parking", "קישור ניווט לחניון", "url"), f("link_apply", "קישור הגשת מועמדות", "url"),
        f("link_whatsapp", "קישור וואטסאפ", "url"), f("link_facebook", "פייסבוק", "url"), f("link_instagram", "אינסטגרם", "url"),
        f("link_invite_page", "הקישור שאורחים מקבלים", "url"),
        f("footer_about", "טקסט בפוטר", "text"), f("footer_base", "שורה תחתונה בפוטר", "string"),
    ]},
]

def item(label, url, blank=False):
    d = {"type": "custom", "label": label, "url": url}
    if blank: d["target"] = "_blank"
    return d
menus = [
    {"name": "primary", "label": "תפריט ראשי", "items": [item("מי אנחנו", "/#about"), item("החברים", "/#people"), item("המדריך", "/guide"),
        item("פגישה ראשונה", "/first-meeting"), item("שאלות", "/questions")]},
    {"name": "cta", "label": "כפתור בהדר", "items": [item("שמרו לי מקום", "/invite")]},
    {"name": "footer_site", "label": "באתר", "items": [item("מי אנחנו", "/#about"), item("החברים", "/#people"), item("המדריך", "/guide"),
        item("פגישה ראשונה", "/first-meeting"), item("מדריך לאורח", "/guest-guide"), item("שאלות", "/questions"), item("מה אנחנו לא", "/what-we-are-not")]},
    {"name": "footer_invite", "label": "הזמנה ותשלום", "items": [item("המפגש הקרוב", "/invite"), item("תשלום למפגש", L["pay"], True),
        item("ניווט לחניון", L["parking"], True), item("הגשת מועמדות", L["apply"], True)]},
    {"name": "footer_club", "label": "לחברי הקבוצה", "items": [item("מועדון החברים", "/club"), item("חוברת החבר", "/club-handbook"),
        item("הדרכות", "/club-trainings"), item("רשימת אורחים", "/visitors")]},
    {"name": "footer_contact", "label": "קשר", "items": [item("WhatsApp", L["whatsapp"], True), item("Facebook", L["facebook"], True),
        item("Instagram", L["instagram"], True), item("BNI ישראל", "https://www.bni.co.il", True)]},
    {"name": "footer_legal", "label": "משפטי", "items": [item("הצהרת נגישות", "/accessibility"), item("מדיניות פרטיות", "/privacy"), item("תנאי שימוש", "/terms")]},
]

seed = {
    "$schema": "https://emdashcms.com/seed.schema.json", "version": "1",
    "meta": {"name": "BNI אדירים", "description": "אתר קבוצת BNI אדירים, תל אביב"},
    "settings": {"title": "BNI אדירים", "tagline": "קבוצת נטוורקינג של BNI בתל אביב", "timezone": "Asia/Jerusalem"},
    "collections": collections, "menus": menus,
    "content": {"pages": page_entries, "members": members, "meetings": meetings, "faqs": faqs, "group_info": group},
}
(SITE / "seed" / "seed.json").write_text(json.dumps(seed, ensure_ascii=False, indent=1), encoding="utf-8")

# report
for slug, e in pages:
    c = e["content"]; n_pt = sum(b["_type"] == "block" for b in c); n_html = sum(b["_type"] == "htmlBlock" for b in c)
    print(f"{slug:28s} {e['template']:14s} hero={'Y' if 'hero_wrap' in e else '-'} pt={n_pt:3d} html={n_html:2d} after={len(e.get('after', []))}")
print("chapters", [s for s, *_ in guide_order]); print("club nav", [(s, g) for s, _, g in club_nav])
