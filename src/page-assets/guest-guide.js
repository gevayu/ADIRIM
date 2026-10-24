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
;
// Guest matcher: the answers here and in chapter 01 go to /api/match, which picks members
// from the CMS list. The last result stays in this browser so a revisit shows it again.
(function () {
  const form = document.getElementById("match-form"), out = document.getElementById("matches");
  if (!form || !out) return;
  const intro = document.getElementById("f"), go = document.getElementById("match-go"), status = document.getElementById("match-status");
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const KEY = "adirim:guest-match:v1";
  const boxes = [...form.querySelectorAll('input[name="goals"]')];
  const limit = () => { const n = boxes.filter(b => b.checked).length; boxes.forEach(b => b.disabled = !b.checked && n >= 3); };
  boxes.forEach(b => b.addEventListener("change", limit));

  const byName = n => (window.MEMBERS || []).find(m => m.name === n);
  const card = p => {
    const m = byName(p.name) || { name: p.name, role: "", page: "#" };
    return `<li class="match">
      <a class="who" href="${m.page}"><span class="p">${m.img ? `<img src="${m.img}" alt="" loading="lazy">` : esc(m.initials || "")}</span>
        <span><b>${esc(m.name)}</b><span>${esc(m.role)}</span></span></a>
      <div><p class="lbl">למה דווקא ${esc(m.name.split(" ")[0])}</p><p>${esc(p.why)}</p></div>
      <div><p class="lbl">שאלה שאפשר לשאול</p><blockquote>${esc(p.question)}</blockquote></div>
    </li>`;
  };
  const draw = r => {
    out.innerHTML = `<h3 class="mh">${r.primary.length} אנשים שכדאי שתכיר</h3>
      <p>נציג אותך אליהם בלובי או במינגלינג. לא חובה לדבר עם כולם, זו הזמנה, לא משימה.</p>
      <ol>${r.primary.map(card).join("")}</ol>
      ${r.referral.length ? `<h3 class="mh">ומי יכול להפנות אליך עבודה</h3><p>מהתחום שציינת. שווה לתפוס אותם לשיחה קצרה.</p>
      <ol class="${r.referral.length === 2 ? "two" : ""}">${r.referral.map(card).join("")}</ol>` : ""}
      <button class="again" type="button">לשנות תשובות ולחפש שוב</button>`;
    out.hidden = false;
    out.querySelector(".again").addEventListener("click", () => { out.hidden = true; form.scrollIntoView({ behavior: "smooth" }); });
  };
  try { const saved = JSON.parse(localStorage.getItem(KEY) || "null"); if (saved?.primary?.length) draw(saved); } catch (e) {}

  const LOADING = ["מחפש אנשים שרלוונטיים לך…", "קורא מה כל חבר עושה…", "בודק מי פוגש את הלקוחות שלך…", "מנסח לך שאלה לכל אחד…"];
  form.addEventListener("submit", async () => {
    const v = n => (form.elements[n]?.value || intro?.elements[n]?.value || "").trim();
    if (v("profession").length < 2) { status.className = "status err"; status.textContent = "כתוב את תחום העיסוק שלך, כדי שנדע את מי להציע."; form.elements.profession.focus(); return; }
    const body = { firstName: v("firstName"), profession: v("profession"), oneLiner: v("oneLiner"), idealClient: v("idealClient"),
      referralSource: v("referralSource"), goals: boxes.filter(b => b.checked).map(b => b.value), website: form.elements.website.value };
    go.disabled = true; status.className = "status"; let i = 0; status.textContent = LOADING[0];
    const tick = setInterval(() => status.textContent = LOADING[++i % LOADING.length], 2500);
    try {
      const res = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error || "משהו השתבש");
      if (!r.primary?.length) throw new Error("לא מצאנו התאמות. נסו לנסח את התחום אחרת.");
      try { localStorage.setItem(KEY, JSON.stringify(r)); } catch (e) {}
      status.textContent = ""; draw(r); out.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      status.className = "status err"; status.textContent = e.message || "משהו השתבש. נסו שוב.";
    } finally { clearInterval(tick); go.disabled = false; }
  });
})();
