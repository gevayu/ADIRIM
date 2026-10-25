// Health check for the live Worker: requests every page in the sitemap (twice) while listening to
// `wrangler tail`, then reports failed requests, CPU time per request, exceptions and error logs.
// Real visitors' requests during the window are counted too. The tail samples under bursts, so expect
// fewer events than requests: it shows trends, not an exact count.
//   node tools/health_check.mjs [base-url]          (needs `wrangler login`)
// Exit code 1 when something failed, so a scheduled run can flag it.
import { spawn } from "node:child_process";

const BASE = (process.argv[2] || "https://bni-adirim.co.il").replace(/\/$/, "");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 adirim-health-check";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tail = spawn("npx wrangler tail bni-adirim --format json", { shell: true }); // one string: npx is a .cmd on Windows
let raw = "";
tail.stdout.on("data", (d) => (raw += d));
await sleep(12_000); // let the tail connect

const sitemap = await (await fetch(`${BASE}/sitemap.xml`, { headers: { "User-Agent": UA } })).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, BASE));
const statuses = {};
for (const round of [1, 2]) {
	for (const u of urls) {
		const res = await fetch(u, { headers: { "User-Agent": UA }, redirect: "manual" }).catch((e) => ({ status: `fetch failed: ${e.message}` }));
		if (res.status !== 200) statuses[u] = res.status;
	}
}
await sleep(10_000); // let the last events arrive
tail.kill();

// wrangler prints one JSON object per event, pretty-printed: split on top-level braces.
const events = [];
let depth = 0, start = -1;
for (let i = 0; i < raw.length; i++) {
	if (raw[i] === "{") { if (depth++ === 0) start = i; }
	else if (raw[i] === "}" && --depth === 0) { try { events.push(JSON.parse(raw.slice(start, i + 1))); } catch {} }
}
const requests = events.filter((e) => e.event?.request);
const cpu = requests.map((e) => e.cpuTime ?? 0).sort((a, b) => a - b);
const pct = (p) => cpu[Math.min(cpu.length - 1, Math.floor(cpu.length * p))] ?? 0;
const failed = events.filter((e) => e.outcome && e.outcome !== "ok");
const exceptions = events.flatMap((e) => (e.exceptions || []).map((x) => `${x.message} (${e.event?.request?.url ?? "cron"})`));
const logs = events.flatMap((e) => (e.logs || []).filter((l) => ["warn", "error"].includes(l.level)).map((l) => String(l.message).slice(0, 200)));

const lines = [
	`Health check ${new Date().toISOString().slice(0, 16)} | ${BASE}`,
	`Pages requested: ${urls.length * 2}; non-200: ${Object.keys(statuses).length}`,
	`Worker events seen: ${events.length} (requests ${requests.length})`,
	`CPU ms per request: median ${pct(0.5)}, p90 ${pct(0.9)}, max ${cpu.at(-1) ?? 0}; over 10 ms: ${cpu.filter((c) => c > 10).length}`,
	`Failed requests: ${failed.length}${failed.length ? "  " + failed.map((e) => `${e.outcome} ${e.cpuTime}ms ${e.event?.request?.url ?? "cron"}`).join("; ") : ""}`,
	`Exceptions: ${exceptions.length}${exceptions.length ? "  " + exceptions.slice(0, 5).join("; ") : ""}`,
	`Warnings/errors logged: ${logs.length}${logs.length ? "  " + logs.slice(0, 5).join("; ") : ""}`,
	...Object.entries(statuses).map(([u, s]) => `  ${s}  ${u}`),
];
console.log(lines.join("\n"));
process.exit(failed.length || exceptions.length || Object.keys(statuses).length || events.length === 0 ? 1 : 0);
