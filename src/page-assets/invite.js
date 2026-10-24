const M = window.MEMBERS, MT = window.MEETING, L = window.LINKS, T = window.TERM;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const byName = n => M.find(m => m.name === n);
  const photo = (m, cls = "") => `<div class="p ${cls}">${m?.img ? `<img src="${m.img}" alt="" loading="lazy">` : ""}</div>`;
  const waIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z"/></svg>`;

  // Google Calendar wants local Israel time as YYYYMMDDTHHMMSS
  const gcal = d => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .format(d).replace(/[-: ]/g, "").replace(/^(\d{8})/, "$1T");
  const ISR = { timeZone: "Asia/Jerusalem" };
  const dm = d => { const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { ...ISR, day: "numeric", month: "numeric" }).formatToParts(d).map(x => [x.type, x.value])); return `${p.day}.${p.month}`; };
  const key = d => new Intl.DateTimeFormat("en-CA", ISR).format(d).replace(/-/g, "");  // 20261029
  const daysLeft = date => {  // calendar days in Israel, so Thursday morning counts as "in 5 days" from Saturday night
    const day = d => Date.parse(new Intl.DateTimeFormat("en-CA", ISR).format(d));
    const n = Math.round((day(date) - day(new Date())) / 864e5);
    return n > 1 ? `בעוד ${n} ימים` : n === 1 ? "מחר" : n === 0 ? "היום" : "";
  };

  // Meeting picker, as on the Premium guest form: the nearest meeting is the default, any later one can be chosen.
  // Every part of the page that describes "the meeting" follows the choice. ?d=YYYYMMDD preselects a date.
  const MEETS = window.MEETINGS;
  let S = MEETS[0];
  $("hero-pick").innerHTML = MEETS.map(m => `<label><input type="radio" name="meet-hero" value="${key(m.date)}"><span>חמישי ${dm(m.date)}</span></label>`).join("");
  $("meet-pick").innerHTML = MEETS.map((m, i) => `<label class="pick"><input type="radio" name="meet" value="${key(m.date)}">
    <span class="pick-body"><span class="pick-date">חמישי <b>${dm(m.date)}</b></span>${i ? "" : '<span class="pick-next">המפגש הקרוב</span>'}
    <span class="pick-line">המצגת המרכזית: <b>${esc(m.speaker)}</b>${m.topic ? ` · ${esc(m.topic)}` : ""}</span></span></label>`).join("");
  document.addEventListener("change", e => { if (e.target.name === "meet" || e.target.name === "meet-hero") select(e.target.value); });

  function select(k, scroll) {
    S = MEETS.find(m => key(m.date) === k) || MEETS[0];
    const first = S === MEETS[0], d = dm(S.date), sp = byName(S.speaker);
    document.querySelectorAll('input[name="meet"], input[name="meet-hero"]').forEach(r => { r.checked = r.value === key(S.date); });
    $("n-kicker").textContent = first ? "המפגש הקרוב" : "המפגש שבחרתם";
    $("n-day").textContent = d;
    $("n-count").textContent = daysLeft(S.date);
    $("next-h").textContent = S.title || `המצגת המרכזית: ${S.speaker}`;
    $("n-speaker").innerHTML = S.title ? `הרצאה מרכזית: <b>${esc(S.speaker)}</b> · ${esc(S.topic)}` : esc(S.topic);
    $("n-when").textContent = `חמישי ${d} · ${MT.hours}`;
    $("n-where").textContent = S.place;
    $("cal").href = "https://calendar.google.com/calendar/render?action=TEMPLATE"
      + "&text=" + encodeURIComponent(`קבוצת אדירים · BNI · ${S.speaker}`)
      + `&dates=${gcal(S.date)}/${gcal(S.end)}&ctz=Asia/Jerusalem`
      + "&location=" + encodeURIComponent(S.place)
      + "&details=" + encodeURIComponent(`${S.title ? S.title + "\n" : ""}${S.speaker} · ${S.topic}\nתשלום: ${L.pay}`);
    $("speaker-card").innerHTML = `${photo(sp)}<figcaption><b>${esc(S.speaker)}</b>${first ? "מציג/ה במפגש הקרוב" : `מציג/ה ב-${d}`} · ${esc(S.topic)}</figcaption>`;
    $("agenda").innerHTML = MT.agenda.map(([t, h, p]) =>
      `<li><time>${t}</time><h3>${h}</h3><p>${p}</p>${t === "08:30" ? `<p class="who">מציג/ה: ${esc(S.speaker)} · ${esc(S.topic)}</p>` : ""}</li>`).join("");
    $("join-h").textContent = `בואו לחמישי ${d}.`;
    $("j-when").textContent = `חמישי ${d} · 7:30 עד 9:30`;
    $("j-where").textContent = S.place;
    $("g-meet").value = key(S.date);
    document.querySelectorAll("#meet li").forEach(li => li.classList.toggle("on", li.dataset.k === key(S.date)));
    if (scroll) $("join").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $("n-parking").textContent = MT.parking;
  $("n-price").textContent = MT.priceNote;
  $("pay").href = $("g-pay").href = L.pay;
  $("nav").href = L.parking;
  $("terms").innerHTML = MT.terms.map(t => `<li>${esc(t)}</li>`).join("");

  // term numbers
  $("bento").innerHTML = `
    <div class="tile sand"><b>${M.length}</b><span>חברים</span></div>
    <div class="tile teal"><b>${T.referrals}</b><span>הפניות</span></div>
    <div class="tile graphite"><b>${T.oneOnOnes}</b><span>פגישות אישיות בין החברים</span></div>
    <div class="tile red"><b>${T.income}</b><span>הכנסות<small>מתחילת הקדנציה (אוקטובר 26)</small></span></div>
    <div class="tile graphite"><b>${T.previous}</b><span>סה״כ הכנסות<small>קדנציה קודמת</small></span></div>`;

  // upcoming
  $("up-place").textContent = `אלא אם צוין אחרת: ${window.UPCOMING.place}`;
  $("meet").innerHTML = MEETS.slice(1).map(m => {
    const k = key(m.date);
    return `<li data-k="${k}"><div class="d"><span>חמישי</span><b>${dm(m.date)}</b></div>${photo(byName(m.speaker))}
      <div><h3>${esc(m.speaker)}</h3><p>${esc(m.topic)}</p></div>
      <span class="h">${window.UPCOMING.hours}<button type="button" class="pill-btn go" data-go="${k}">להירשם למפגש הזה ←</button></span></li>`;
  }).join("");
  $("meet").addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) select(b.dataset.go, true); });

  // members
  mountDirectory($("dir"), {
    render: m => `<li class="card">${photo(m)}
      <div><h3>${esc(m.name)}</h3><p>${esc(m.role)}${m.biz ? ` · ${esc(m.biz)}` : ""}</p>
      ${m.phone ? `<a class="tel" href="tel:+${m.wa}" dir="ltr">${m.phone}</a>` : ""}</div>
      ${m.wa ? `<a class="wa" href="https://wa.me/${m.wa}" target="_blank" rel="noopener" aria-label="WhatsApp ל${esc(m.name)}">${waIcon}</a>` : "<span></span>"}
    </li>`,
    empty: q => `<li class="empty">לא נמצא חבר עבור "${esc(q)}".</li>`,
  });

  // links
  $("link-grid").innerHTML = [
    [L.pay, "תשלום למפגש", "70 ₪", "primary"],
    [L.parking, "ניווט לחניון", "Waze"],
    [L.apply, "הגשת מועמדות", "BNI ישראל"],
    [L.whatsapp, "WhatsApp", "שאלות על המפגש"],
    [L.facebook, "Facebook", "BNIAdirim"],
    [L.instagram, "Instagram", "adirim.bni"],
  ].map(([href, label, sub, cls = ""]) => `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${label}<span>${sub} ←</span></a>`).join("");

  // guest form (no backend yet)
  $("g-ref").insertAdjacentHTML("beforeend", M.map(m => `<option>${esc(m.name)}</option>`).join("") + '<option value="none">לא ידוע / לא הוזמנתי</option>');
  $("guest-form").addEventListener("submit", e => { e.preventDefault(); $("g-sent").hidden = false; });

  select(new URLSearchParams(location.search).get("d") || key(MEETS[0].date));

  // invite dialog: message built from the selected meeting
  const msgFor = S => `נשמח לארח אותך בכנס העסקי של קבוצת אדירים 🤝

🕗 חמישי ${dm(S.date)}, 7:30-9:30
📍 ${S.place.replace(" · ", ", ")}
🅿️ ${MT.parking}
🎤 הרצאה מרכזית: ${S.speaker} (${S.topic})${S.title ? `: "${S.title}"` : ""}
עלות המפגש 70 ש"ח. כל הפרטים, התשלום וניווט לחניון נמצאים בלינק:
${L.invitePage}
מומלץ להסדיר תשלום מראש.

נשתמע,
קבוצת אדירים`;
  const dlg = $("invite"), txt = $("inv-text"), wa = $("inv-wa");
  const syncWa = () => wa.href = "https://wa.me/?text=" + encodeURIComponent(txt.value);
  $("open-invite").addEventListener("click", () => { txt.value = msgFor(S); syncWa(); $("inv-copied").textContent = ""; dlg.showModal(); });
  txt.addEventListener("input", syncWa);
  $("inv-copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(txt.value); $("inv-copied").textContent = "הועתק"; }
    catch { txt.select(); $("inv-copied").textContent = "סמנו והעתיקו ידנית"; }
  });
