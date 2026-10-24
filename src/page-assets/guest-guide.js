const MT = window.MEETING, L = window.LINKS;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  $("m-label").textContent = `${MT.dateLabel} · ${MT.hours}`;
  $("m-where").textContent = MT.fullAddress;
  $("addr").textContent = MT.fullAddress;
  $("park").textContent = MT.parking;
  $("waze").href = L.parking;
  $("print").addEventListener("click", () => print());

  // intro template, filled live from the form; nothing leaves the page
  const f = $("f");
  const slot = (v, ph) => `<mark>${v.trim() ? esc(v.trim()) : ph}</mark>`;
  const drawScript = () => {
    const g = n => f.elements[n].value;
    $("script").innerHTML = `
      <p>שלום, אני ${slot(g("firstName"), "[שם]")}.</p>
      <p>בעסק שלי אני ${slot(g("oneLiner"), "[משפט אחד. מה אתה עושה]")}.</p>
      <p>הלקוח המושלם שלי: ${slot(g("idealClient"), "[דוגמה קונקרטית]")}.</p>
      <p>השבוע אני מחפש: <mark>_______________</mark><span class="fill">מלא בעצמך</span></p>
      <p>נעים מאוד.</p>`;
  };
  f.addEventListener("input", drawScript);
  drawScript();

  // members, grouped by circle, from window.MEMBERS
  mountDirectory($("dir"), {
    render: m => `<li><a class="mcard" href="${m.page}">
      <div class="p">${m.img ? `<img src="${m.img}" alt="" loading="lazy">` : `<span class="ini">${esc(m.initials)}</span>`}</div>
      <div><h3>${esc(m.name)}</h3><p>${esc(m.role)}${m.biz ? ` · ${esc(m.biz)}` : ""}</p>${m.group ? `<p class="g">${esc(m.group)}</p>` : ""}</div>
    </a></li>`,
    empty: q => `<li class="empty">לא נמצא חבר עבור "${esc(q)}".</li>`,
  });
