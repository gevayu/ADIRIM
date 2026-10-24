# Compares every page of the static site (localhost:5180) with the EmDash site (localhost:4321):
# the text of <main>, the header and footer links, the <title>, and every link target in <main>.
#   python tools/compare.py
import re, sys, urllib.request, difflib
from bs4 import BeautifulSoup
sys.stdout.reconfigure(encoding="utf-8")
OLD, NEW = "http://localhost:5180/", "http://localhost:4321/"
PAGES = ["index"] + sys.argv[1:] or []
import pathlib
SKIP = {"d1-directory", "d2-portraits", "d3-morning", "directions"}
names = sys.argv[1:] or [p.stem for p in sorted(pathlib.Path("../redesign").glob("*.html")) if p.stem not in SKIP]

def get(url):
    with urllib.request.urlopen(url, timeout=120) as r: return r.read().decode("utf-8")
def norm_link(h, a=None):
    # data-member-name links get their href from the page script at load; the CMS version has it already.
    if a is not None and a.get("data-member-name") and a.get("href") == "index.html#people": return "member:" + a["data-member-name"]
    h = (h or "").strip()
    h = re.sub(r"^index\.html", "/", h); h = re.sub(r"^([a-z][a-z0-9-]*)\.html", r"/\1", h)
    return h
def text(el):
    for s in el.find_all(["script", "style"]): s.decompose()
    return re.sub(r"\s+", " ", el.get_text(" ")).strip()
import json, urllib.parse
MEMBER = {m["name"]: "/member?m=" + m["page"].split("m=")[1] for m in json.load(open("tools/data.json", encoding="utf-8"))["members"]}
bad = 0
for n in names:
    o = BeautifulSoup(get(OLD + n + ".html"), "html.parser")
    w = BeautifulSoup(get(NEW + ("" if n == "index" else n)), "html.parser")
    issues = []
    if o.title.get_text(strip=True) != w.title.get_text(strip=True): issues.append(f"title: {o.title.get_text(strip=True)!r} != {w.title.get_text(strip=True)!r}")
    om, wm = o.find("main"), w.find("main")
    ol = [norm_link(a.get("href"), a) for a in om.find_all("a")]; wl = [a.get("href") or "" for a in wm.find_all("a")]
    ol = [MEMBER.get(h[7:], h) if h.startswith("member:") else h for h in ol]
    if ol != wl: issues.append("links: " + " | ".join(f"{a}->{b}" for a, b in zip(ol, wl) if a != b)[:400] + (f" (count {len(ol)} vs {len(wl)})" if len(ol) != len(wl) else ""))
    ot, wt = text(om), text(wm)
    if ot != wt:
        sm = difflib.SequenceMatcher(None, ot, wt)
        diffs = [f"[{ot[i1-20:i2+20]!r} => {wt[j1-20:j2+20]!r}]" for t, i1, i2, j1, j2 in sm.get_opcodes() if t != "equal"][:4]
        issues.append("text: " + " ".join(diffs))
    status = "OK  " if not issues else "DIFF"
    bad += bool(issues)
    print(status, n); [print("     ", i) for i in issues]
print(f"{len(names) - bad}/{len(names)} identical")
