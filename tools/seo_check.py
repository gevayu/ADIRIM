# SEO pass over every URL in the sitemap plus the noindex pages: title, description, h1, canonical,
# og:image, robots, image alt text, internal links that 404. Server HTML only (what a crawler gets first).
#   python tools/seo_check.py [base]
import re, sys, json, urllib.request, urllib.error, collections
from bs4 import BeautifulSoup
sys.stdout.reconfigure(encoding="utf-8")
BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4321").rstrip("/")
def get(u):
    try:
        with urllib.request.urlopen(u, timeout=120) as r: return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e: return e.code, ""
_, sm = get(BASE + "/sitemap.xml")
urls = [re.sub(r"^https?://[^/]+", BASE, u) for u in re.findall(r"<loc>([^<]+)</loc>", sm)]
seed = json.load(open("seed/snapshot.json", encoding="utf-8"))
urls += [BASE + "/" + e["slug"] for e in seed["content"]["pages"] if e["slug"].startswith("club") or e["slug"] in ("visitors", "home-classic")]
titles, descs, issues, linkcache = collections.defaultdict(list), collections.defaultdict(list), collections.defaultdict(list), {}
for u in urls:
    st, html = get(u)
    if st != 200: issues[u].append(f"status {st}"); continue
    s = BeautifulSoup(html, "html.parser")
    for sc in s.find_all("script"): sc.decompose()
    t = s.title.get_text(strip=True) if s.title else ""
    d = [m.get("content", "") for m in s.find_all("meta", attrs={"name": "description"})]
    robots = (s.find("meta", attrs={"name": "robots"}) or {}).get("content", "")
    titles[t].append(u)
    if not t: issues[u].append("no <title>")
    elif len(t) > 70: issues[u].append(f"title {len(t)} chars")
    if len(d) != 1: issues[u].append(f"{len(d)} description tags")
    elif not (50 <= len(d[0]) <= 165): issues[u].append(f"description {len(d[0])} chars")
    else: descs[d[0]].append(u)
    h1 = s.find_all("h1")
    if len(h1) != 1 and "noindex" not in robots: issues[u].append(f"{len(h1)} <h1>")
    if not s.find("link", rel="canonical") and "noindex" not in robots: issues[u].append("no canonical")
    if not s.find("meta", property="og:image"): issues[u].append("no og:image")
    if s.html.get("lang") != "he": issues[u].append("lang")
    noalt = [i.get("src", "")[:40] for i in s.find_all("img") if i.get("alt") is None]
    if noalt: issues[u].append(f"img without alt: {noalt[:3]}")
    for a in s.find_all("a", href=True):
        h = a["href"].split("#")[0]
        if not h.startswith("/") or h.startswith("//") or h.startswith("/_emdash"): continue
        if h not in linkcache: linkcache[h] = get(BASE + h)[0]
        if linkcache[h] >= 400: issues[u].append(f"link {h} -> {linkcache[h]}")
for t, us in titles.items():
    if len(us) > 1: issues["(site)"].append(f"duplicate title {t!r} x{len(us)}")
for dd, us in descs.items():
    if len(us) > 1: issues["(site)"].append(f"duplicate description x{len(us)}: {dd[:50]!r}")
print(f"{len(urls)} URLs, {len(linkcache)} internal links checked")
for u, li in issues.items():
    print(u.replace(BASE, "")); [print("   ", i) for i in sorted(set(li))]
