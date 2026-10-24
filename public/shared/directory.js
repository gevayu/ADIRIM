// Shared search + group filter for the member directory.
// mountDirectory(rootEl, { render: member => html, empty: query => html })
// rootEl must contain [data-q] (input), [data-groups] (chip container), [data-list], [data-count].
// Optional [data-suggest="text"] buttons fill the search box.

const SYNONYMS = {
  "רוח": "רואה חשבון", "עורך דין": "עוד", "עורכת דין": "עוד", "עורכי דין": "עוד",
  "משכנתא": "משכנתאות", "מחשבים": "it", "אתר": "אתרי", "ביטוחים": "ביטוח",
};

const norm = s => (s || "").toLowerCase().replace(/[׳״'"]/g, "").trim();

function matches(m, q) {
  const nq = norm(q);
  if (!nq) return true;
  const hay = norm([m.name, m.role, m.biz, m.cat, m.group, m.tags].join(" "));
  // A synonym replaces the query: "רוח" alone would also hit "אירוח".
  return hay.includes(SYNONYMS[nq] ?? nq);
}

window.mountDirectory = function (root, { render, empty }) {
  const input = root.querySelector("[data-q]");
  const chips = root.querySelector("[data-groups]");
  const list = root.querySelector("[data-list]");
  const count = root.querySelector("[data-count]");
  let group = null;

  chips.innerHTML = [null, ...window.GROUPS].map(g => {
    const n = g ? window.MEMBERS.filter(m => m.group === g).length : window.MEMBERS.length;
    return `<button type="button" class="chip" data-g="${g || ""}" aria-pressed="${g === null}">${g || "הכל"} <span>${n}</span></button>`;
  }).join("");

  function draw() {
    const hits = window.MEMBERS.filter(m => (!group || m.group === group) && matches(m, input.value));
    list.innerHTML = hits.length ? hits.map(render).join("") : empty(input.value);
    count.textContent = hits.length;
  }

  chips.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    group = b.dataset.g || null;
    chips.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
    draw();
  });
  input.addEventListener("input", draw);
  root.querySelectorAll("[data-suggest]").forEach(s =>
    s.addEventListener("click", () => { input.value = s.dataset.suggest; draw(); input.focus(); }));

  draw();
};

// Self-check: run `node directory.js` (no DOM needed).
if (typeof module !== "undefined" && !globalThis.document) {
  const m = { name: "אריאל כץ", role: "רואה חשבון", biz: "עמוס כץ ושות׳ רו״ח", cat: "חשבונאות", group: "משפט ופיננסים" };
  console.assert(matches(m, "רו״ח"), "geresh-insensitive");
  console.assert(matches(m, "רואה"), "plain substring");
  console.assert(!matches(m, "אדריכל"), "no false hit");
  console.assert(matches({ ...m, role: "עו״ד מסחרי" }, "עורך דין"), "synonym");
  console.assert(!matches({ ...m, role: "צוות אירוח", biz: "יחסי ציבור" }, "רו״ח"), "synonym replaces query");
  console.log("directory.js ok");
}
