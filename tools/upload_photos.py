# Uploads each member's photo from ../redesign/photos into the running EmDash instance
# and links it to the member entry. Run while `npm run dev` is up (localhost dev bypass).
#   python tools/upload_photos.py ../redesign
import json, pathlib, subprocess, sys, functools
print = functools.partial(print, flush=True)
sys.stdout.reconfigure(encoding="utf-8")
SRC = pathlib.Path(sys.argv[1])
SITE = pathlib.Path(__file__).resolve().parent.parent
URL = "http://localhost:4321"
data = json.loads((SITE / "tools" / "data.json").read_text(encoding="utf-8"))

def em(*args):
    out = subprocess.run(["npx.cmd", "emdash", *args, "--json", "-u", URL], cwd=SITE, capture_output=True, text=True, encoding="utf-8")
    if out.returncode: raise RuntimeError(out.stderr[-800:])
    return json.loads(out.stdout)

for i, m in enumerate(data["members"]):
    slug = f"member-{i + 1:02d}"
    entry = em("content", "get", "members", slug, "--raw")
    if entry["data"].get("photo"):
        print("skip", slug, m["name"]); continue
    photo = data["photos"].get(m["name"])
    if not photo:
        print("no photo", slug, m["name"]); continue
    media = em("media", "upload", str(SRC / "photos" / photo["file"]), "--alt", m["name"])
    value = {"provider": "local", "id": media["id"], "alt": m["name"], "width": media["width"], "height": media["height"],
             "mimeType": media["mimeType"], "filename": media["filename"], "meta": {"storageKey": media["storageKey"]}}
    # --file, not --data: values like "Y&S 360" break the Windows shell that npx.cmd runs in
    tmp = SITE / "tools" / ".update.json"
    tmp.write_text(json.dumps({**entry["data"], "photo": value}, ensure_ascii=False), encoding="utf-8")
    em("content", "update", "members", slug, "--rev", entry["_rev"], "--file", str(tmp))
    tmp.unlink()
    print("ok", slug, m["name"], media["width"])
