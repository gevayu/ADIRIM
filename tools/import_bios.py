# Writes researched bios and hidden search tags into the members collection.
#   python tools/import_bios.py out1.json out2.json ...   (later files win for the same slug)
import json, pathlib, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8")
SITE = pathlib.Path(__file__).resolve().parent.parent
def em(*args):
    out = subprocess.run(["npx.cmd", "emdash", *args, "--json", "-u", "http://localhost:4321"], cwd=SITE, capture_output=True, text=True, encoding="utf-8")
    if out.returncode: raise RuntimeError(out.stderr[-800:])
    return json.loads(out.stdout)
rows = {}
for f in sys.argv[1:]:
    for r in json.loads(pathlib.Path(f).read_text(encoding="utf-8")): rows[r["slug"]] = r
tmp = SITE / "tools" / ".bio.json"
for slug, r in sorted(rows.items()):
    e = em("content", "get", "members", slug, "--raw")
    assert e["data"]["name"] == r["name"], (slug, e["data"]["name"], r["name"])
    tags = r["tags"] if isinstance(r["tags"], str) else ", ".join(r["tags"])
    tmp.write_text(json.dumps({**e["data"], "bio": r["bio"].strip(), "tags": tags}, ensure_ascii=False), encoding="utf-8")
    em("content", "update", "members", slug, "--rev", e["_rev"], "--file", str(tmp))
    print("ok", slug, r["name"], r["confidence"], flush=True)
tmp.unlink(missing_ok=True)
