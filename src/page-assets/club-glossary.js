// Members club pages. Everything about members, meetings and figures is read from shared/data.js.
(function () {
  const M = window.MEMBERS || [], $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tones = ["var(--t1)", "var(--t2)", "var(--t3)", "var(--t4)", "var(--t5)"];
  const photo = (m, i = 0) => `<span class="p" style="--tone:${tones[i % 5]}">${m.img ? `<img src="${m.img}" alt="" loading="lazy">` : `<span class="ini">${esc(m.initials)}</span>`}</span>`;
  const byName = n => M.find(m => m.name === n);
  // data.js puts a group role before " · " ("יו״ר · חוקר פרטי"); other " · " roles are just trade details.
  const ROLE = /^(יו״ר|סגנ|גזבר|ועדת|חונכות|צוות|תיאום|אחראי)/;
  const title = m => { const t = (m.role || "").split(" · ")[0]; return (m.role || "").includes(" · ") && ROLE.test(t) ? t : null; };
  const trade = m => title(m) ? m.role.split(" · ").slice(1).join(" · ") : m.role;

  const GUESTS = "אחראי קשר עם האורחים";
  const LEAD = /^(יו״ר|סגנית יו״ר|גזברית|אחראי קשר עם האורחים)$/;
  const DESC = {
    "יו״ר": "סדר היום של המפגש, והובלת צוות ההנהגה.",
    "סגנית יו״ר": "נוכחות והיעדרויות, דו״ח הסגן בקונקט, קבלת חברים וחידוש חברות.",
    "גזברית": "דמי חבר ותשלומים.",
    [GUESTS]: "כל שאלה על אורחים: הזמנה, הרשמה, תשלום וסטטוס.",
    "חונכות": "ליווי חבר חדש בשנה הראשונה בקבוצה: פגישות חניכה, צ׳ק ליסט, ושאלות בדרך.",
    "תיאום הדרכה": "מועדי ההדרכות של הקבוצה.",
  };
  const desc = t => DESC[t] || "";
  const phoneFmt = p => { const d = p.replace(/\D/g, ""); return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : p; };

  $$("[data-groups]").forEach(el => el.textContent = (window.GROUPS || []).length);
  $$("[data-group-list]").forEach(el => el.textContent = (window.GROUPS || []).join(", "));
  // <span data-role="..."> -> the members holding that role prefix in data.js
  $$("[data-role]").forEach(el => {
    const ms = M.filter(m => title(m) === el.dataset.role);
    if (!ms.length) return;
    el.innerHTML = ", " + ms.map(m => `<a href="${m.page}">${esc(m.name)}</a>` +
      (el.dataset.role === GUESTS && m.phone ? ` (<a href="tel:+972${m.phone.replace(/\D/g, "").slice(1)}" dir="ltr">${esc(phoneFmt(m.phone))}</a>)` : "")).join(", ");
  });

  // device-only checklists (connect profile)
  $$("[data-check]").forEach(box => {
    const key = "club-check-" + box.dataset.check, inputs = $$("input", box), out = $(".count", box);
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) {}
    inputs.forEach(i => i.checked = saved.includes(+i.dataset.i));
    const sync = () => {
      out.textContent = `${inputs.filter(i => i.checked).length} מתוך ${inputs.length}`;
      try { localStorage.setItem(key, JSON.stringify(inputs.filter(i => i.checked).map(i => +i.dataset.i))); } catch (e) {}
    };
    inputs.forEach(i => i.addEventListener("change", sync)); sync();
  });

  // the link a member sends a guest
  const inviteUrl = (window.LINKS || {}).invitePage;
  $$("[data-invite-url]").forEach(el => el.textContent = inviteUrl);
  const meet = window.MEETING || {};
  const waText = `היי, אני מ-BNI אדירים, קבוצת נטוורקינג עסקי שנפגשת בתל אביב בכל יום חמישי בבוקר. אשמח לארח אותך באחד המפגשים הקרובים. כל הפרטים וההרשמה כאן, ובטופס בוחרים את השם שלי ברשימת "החבר המזמין": ${inviteUrl}`;
  $$("[data-invite-wa]").forEach(a => a.href = "https://wa.me/?text=" + encodeURIComponent(waText));
  $$("[data-copy-invite]").forEach(b => b.addEventListener("click", async () => {
    const st = $("[data-copy-status]");
    try { await navigator.clipboard.writeText(inviteUrl); st.textContent = "הקישור הועתק. אפשר להדביק בוואטסאפ או במייל."; }
    catch (e) { st.textContent = "ההעתקה נחסמה בדפדפן. סמנו את הקישור והעתיקו ידנית."; }
  }));

  // upcoming meetings
  const place = $("#mtg-place");
  if (place && meet.fullAddress) place.textContent = `כל יום חמישי, ${meet.hours}. ${meet.fullAddress}. חניה: ${meet.parking}.`;
  const mtg = $("#mtg");
  if (mtg) {
    const up = window.UPCOMING || { list: [] };
    const rows = [[meet.date, meet.speaker, meet.speakerTopic || meet.title, true],
      ...up.list.map(([d, n, t]) => [new Date(d + "T07:30:00+02:00"), n, t, false])];
    mtg.innerHTML = rows.map(([d, n, t, next], i) => {
      const m = byName(n) || { name: n, initials: n.split(" ").map(w => w[0]).join("").slice(0, 2) };
      const day = d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });
      return `<li><time datetime="${d.toISOString().slice(0, 10)}">${day}</time>${photo(m, i)}
        <div><b>${esc(n)}${next ? '<span class="tag">המפגש הבא</span>' : ""}</b><span class="muted">${esc(t)}</span></div>
        ${m.page ? `<a class="btn line" href="${m.page}">לכרטיס החבר</a>` : "<span></span>"}</li>`;
    }).join("");
  }

  // forms that post to the members system: mockups here
  $$("#md-sender").forEach(sel => sel.insertAdjacentHTML("beforeend", M.map(m => `<option>${esc(m.name)}</option>`).join("")));
  $$("form[data-mock], #media-form").forEach(f => f.addEventListener("submit", e => {
    e.preventDefault(); const n = $(".mock", f); n.hidden = false; n.focus?.();
  }));

  const nm = $("#next-mtg");
  if (nm && meet.date) nm.textContent = "המפגש הבא: " + meet.date.toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "numeric" }).replace(/\//g, ".");

  // club home
  const pick = $("#pick");
  if (pick) {
    pick.innerHTML = M.map((m, i) => `<li data-q="${esc((m.name + " " + m.role + " " + (m.biz || "")).toLowerCase())}">
      <input type="radio" name="member" id="mb-${i}" value="${esc(m.slug)}"><label for="mb-${i}">${photo(m, i)}<span><b>${esc(m.name)}</b><small>${esc(trade(m))}</small></span></label></li>`).join("");
    const q = $("#who-q"), none = $("#who-none"), btn = $("#who-go");
    q.addEventListener("input", () => {
      const v = q.value.trim().toLowerCase(); let n = 0;
      $$("li", pick).forEach(li => { const on = !v || li.dataset.q.includes(v); li.hidden = !on; n += on; });
      none.hidden = n > 0;
    });
    pick.addEventListener("change", () => {
      const m = M.find(x => x.slug === $("input:checked", pick).value);
      btn.disabled = false; btn.textContent = `שליחת קישור כניסה ל${m.name}`;
    });
    // leadership and teams from the role prefix in data.js ("יו״ר · חוקר פרטי")
    const lead = M.filter(m => LEAD.test(title(m) || ""));
    $("#leaders").innerHTML = lead.map((m, i) => `<div><a href="${m.page}">${photo(m, i)}<span class="t">${esc(title(m))}</span><b>${esc(m.name)}</b></a><p>${esc(desc(title(m)))}${title(m) === GUESTS && m.phone ? ` <a href="tel:+972${m.phone.replace(/\D/g, "").slice(1)}" dir="ltr">${esc(phoneFmt(m.phone))}</a>` : ""}</p></div>`).join("");
    const teams = {};
    // guest-related roles other than GUESTS are not named (Yuval, 2026-10-24)
    M.filter(m => title(m) && !lead.includes(m) && !/אירוח/.test(title(m))).forEach(m => (teams[title(m)] ||= []).push(m));
    $("#teams").innerHTML = Object.entries(teams).map(([t, ms]) => `<li><h3>${esc(t)}</h3><div>
      <span class="names">${ms.map(m => `<a href="${m.page}">${esc(m.name)}</a>`).join(", ")}</span>${desc(t) ? `<p>${esc(desc(t))}</p>` : ""}</div></li>`).join("");
  }
})();
