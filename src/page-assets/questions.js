(function () {
  const items = [...document.querySelectorAll("details.qa")];
  document.getElementById("q-count").textContent = items.length;

  // Yotam (hospitality) and any named member come from window.MEMBERS, never typed in.
  const byName = n => window.MEMBERS.find(m => m.name === n);
  const yotam = byName("יובל גבע");
  document.querySelectorAll("[data-yotam-wa]").forEach(a => {
    const base = (yotam && window.waLink(yotam)) || window.LINKS.whatsapp;
    a.href = a.dataset.text ? base + "?text=" + encodeURIComponent(a.dataset.text) : base;
    if (a.hasAttribute("data-phone")) a.textContent = yotam && yotam.phone ? yotam.phone : "WhatsApp";
  });
  document.querySelectorAll("[data-member]").forEach(a => {
    const m = byName(a.dataset.member);
    if (m) a.href = m.page; else a.removeAttribute("href");
  });
  document.querySelectorAll("[data-link]").forEach(a => a.href = window.LINKS[a.dataset.link]);

  // Search: hide non-matching questions and empty groups.
  const groups = [...document.querySelectorAll(".q-group")];
  const empty = document.getElementById("q-empty");
  document.getElementById("q-search").addEventListener("input", e => {
    const q = e.target.value.trim();
    items.forEach(d => {
      const hit = !q || d.textContent.includes(q);
      d.hidden = !hit;
      d.open = !!q && hit;
    });
    groups.forEach(g => g.hidden = !g.querySelector("details.qa:not([hidden])"));
    empty.hidden = groups.some(g => !g.hidden);
  });
})();
