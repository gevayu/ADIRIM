// The live tool reads each week from its own backend (/api/weeks). This page shows the week that was
// public on 2026-10-24 as a sample; inviters are matched to window.MEMBERS for photo and member page.
(function () {
  const WEEKS = ["2026-10-15", "2026-10-08", "2026-09-24", "2026-09-17", "2026-09-10", "2026-09-03", "2026-08-20", "2026-08-06", "2026-07-23"];
  const SAMPLE = { date: "2026-10-15", total: 28, guests: 28, subs: 0, visitors: 0, top: [["יניב כהן", 4], ["שירן חמדי", 4]] };
  const M = window.MEMBERS || [], esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const long = d => new Date(d + "T12:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const short = d => d.split("-").reverse().join("/");
  const sel = document.getElementById("week");
  sel.innerHTML = WEEKS.map(d => `<option value="${d}">${short(d)}</option>`).join("");

  function show(d) {
    const has = d === SAMPLE.date;
    document.getElementById("week-label").textContent = long(d);
    document.getElementById("week-foot").textContent = short(d);
    document.getElementById("sample-note").textContent = has
      ? "הנתונים של המפגש הזה הועתקו מהכלי הקיים לדוגמה. בגרסה החיה הם נטענים מהמערכת לכל מפגש."
      : "הנתונים של המפגש הזה נמצאים בכלי הקיים ונטענים משם. כאן מוצג רק המפגש של 15/10/2026, לדוגמה.";
    document.querySelectorAll("[data-k]").forEach(el => el.textContent = has ? SAMPLE[el.dataset.k] : "?");
    let pos = 0, last = null;
    document.getElementById("rank").innerHTML = has ? SAMPLE.top.map(([n, c], i) => {
      if (c !== last) { pos = i + 1; last = c; }
      const m = M.find(x => x.name === n) || { name: n, initials: n.split(" ").map(w => w[0]).join("") };
      const ph = m.img ? `<img src="${m.img}" alt="" loading="lazy">` : `<span class="ini">${esc(m.initials)}</span>`;
      const inner = `<span class="pos">${pos}</span><span class="p" style="--tone:var(--t${i % 5 + 1})">${ph}</span><span><b>${esc(n)}</b><small>${c} אורחים</small></span>`;
      return m.page ? `<a href="${m.page}">${inner}</a>` : `<a>${inner}</a>`;
    }).join("") : `<p class="muted">אין כאן נתונים למפגש הזה.</p>`;
  }
  sel.addEventListener("change", () => show(sel.value));
  show(WEEKS[0]);

  document.getElementById("export").addEventListener("click", () => {
    const n = document.getElementById("export-note"); n.hidden = false; n.focus();
  });
})();
