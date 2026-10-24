// Runs the static site's shared/photos.js + shared/data.js in a stub browser
// and prints the globals they build as JSON, so the seed is made from exactly what the site shows.
import fs from "node:fs";
import vm from "node:vm";
const dir = process.argv[2];
const win = {};
const ctx = vm.createContext({
  window: win, console, Date, Object, encodeURIComponent,
  location: { protocol: "http:", pathname: "/index.html" },
  document: { querySelectorAll: () => [], body: { insertAdjacentHTML() {} } },
});
for (const f of ["photos.js", "data.js"]) vm.runInContext(fs.readFileSync(`${dir}/shared/${f}`, "utf8"), ctx);
const src = fs.readFileSync(`${dir}/shared/data.js`, "utf8");
const circles = vm.runInNewContext("(" + src.match(/const CIRCLES = (\{[\s\S]*?\n\});/)[1] + ")");
const upcoming = win.UPCOMING;
const all = [
  { date: win.MEETING.date, end: win.MEETING.end, speaker: win.MEETING.speaker, topic: win.MEETING.speakerTopic, title: win.MEETING.title, place: win.MEETING.fullAddress },
  ...upcoming.list.map(([iso, speaker, topic]) => ({ date: new Date(iso + "T07:30:00+02:00"), end: new Date(iso + "T09:30:00+02:00"), speaker, topic, title: null, place: upcoming.place })),
];
console.log(JSON.stringify({ members: win.MEMBERS, photos: win.PHOTOS, groups: win.GROUPS, circles, meeting: win.MEETING,
  upcoming, meetings: all, links: win.LINKS, term: win.TERM, faq: win.FAQ }, null, 1));
