(function () {
  const M = window.MEMBERS || [];
  const n = M.length;
  // counts derived from the member list (never typed into the copy)
  document.querySelectorAll("[data-calc]").forEach(el => {
    const k = el.dataset.calc;
    el.textContent = k === "minus1" ? n - 1 : k === "x52" ? (n * 52).toLocaleString("he-IL") : "";
  });
  const find = name => M.find(m => m.name === name);
  const photo = m => m.img ? `<img src="${m.img}" alt="" loading="lazy">` : `<span class="ini">${m.initials}</span>`;
  // full member card
  document.querySelectorAll("a[data-member]").forEach(el => {
    const m = find(el.dataset.member);
    if (!m) { el.hidden = true; console.warn("member not found:", el.dataset.member); return; }
    el.href = m.page;
    el.innerHTML = `<span class="p">${photo(m)}</span><span><b>${m.name}</b><span class="role">${m.role || ""}</span>${m.group ? `<small>מעגל ${m.group}</small>` : ""}</span>`;
  });
  // inline name link
  document.querySelectorAll("a[data-member-name]").forEach(el => {
    const m = find(el.dataset.memberName);
    if (m) el.href = m.page; else el.removeAttribute("href");
  });
  // a whole circle as a photo strip
  document.querySelectorAll("ul[data-circle]").forEach(ul => {
    ul.innerHTML = M.filter(m => m.group === ul.dataset.circle).map(m =>
      `<li><a href="${m.page}"><span class="p">${photo(m)}</span><b>${m.name}</b><span class="r">${m.role || ""}</span></a></li>`).join("");
  });
})();
