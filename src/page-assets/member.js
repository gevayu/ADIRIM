(function () {
  const M = window.MEMBERS;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // same slug rule as data.js and the old /members/<slug> pages; applied to the query too, so a raw name also resolves
  const slugify = s => s.trim().replace(/[׳״']/g, "").replace(/\s+/g, "-");
  const TONES = ["--t1", "--t2", "--t3", "--t4", "--t5"];  // same tone per member as on the home gallery
  const portrait = (m, cls = "", lazy = true) => `<div class="p ${cls}" style="--tone:var(${TONES[M.indexOf(m) % TONES.length]})">${m.img
    ? `<img src="${m.img}" alt="${esc(m.name)}"${lazy ? ' loading="lazy"' : ""}>`
    : `<span class="ini" aria-hidden="true">${esc(m.initials)}</span>`}</div>`;
  const waIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z"/></svg>`;
  const telIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/></svg>`;
  const setMeta = text => document.querySelector('meta[name="description"]').setAttribute("content", text);
  const main = document.getElementById("main");
  const crumbs = last => `<p class="crumbs"><a href="/">בית</a> › <a href="/#people">החברים</a> › <span aria-current="page">${esc(last)}</span></p>`;

  let raw = "";
  try { raw = new URLSearchParams(location.search).get("m") || ""; } catch (e) { raw = ""; }
  const slug = slugify(raw);
  const m = slug && M.find(x => x.slug === slug);

  if (!m) {
    document.title = "החבר לא נמצא · BNI אדירים";
    setMeta("הקישור לא מוביל לאף חבר בקבוצת BNI אדירים. כל החברים מופיעים בעמוד הבית.");
    main.innerHTML = `<section class="page-hero missing"><div class="wrap">
      ${crumbs("לא נמצא")}
      <h1>אין חבר בכתובת הזאת</h1>
      <p class="lede">${raw ? `לא מצאנו בקבוצה חבר בשם <bdi>"${esc(raw)}"</bdi>. אולי נפלה אות בקישור, ואולי הוא מהאתר הקודם.` : "הקישור הגיע בלי שם של חבר."} כל ${M.length} החברים מופיעים ברשימה בעמוד הבית.</p>
      <div class="actions"><a class="btn red" href="/#people">לרשימת החברים</a><a class="btn line" href="/invite">לפרטי המפגש הקרוב</a></div>
    </div></section>`;
    return;
  }

  const first = m.name.split(" ")[0];
  const biz = m.biz && m.biz !== m.name ? m.biz : null;
  document.title = `${m.name} · BNI אדירים`;
  setMeta(m.bio ? `${m.name}, ${m.role}. ${m.bio}` : `${m.name}, ${[m.role, biz].filter(Boolean).join(", ")}. חבר במעגל ${m.group || "BNI"} של BNI אדירים, קבוצת נטוורקינג עסקית בתל אביב.`);

  // talks: the next meeting's speaker, then the presenters after it (only dates still ahead)
  const now = Date.now(), MT = window.MEETING || {}, UP = window.UPCOMING || {};
  const talks = [];
  if (MT.speaker === m.name && (!MT.end || MT.end > now))
    talks.push({ when: `חמישי ${MT.dayShort}`, topic: MT.title, hours: MT.hours, next: true });
  (UP.list || []).forEach(([iso, name, topic]) => {
    const d = new Date(iso + "T09:30:00+02:00");
    if (name === m.name && d > now) talks.push({ when: `חמישי ${d.getDate()}/${d.getMonth() + 1}`, topic, hours: UP.hours });
  });
  const talkHtml = talks.map(t => `<div class="callout talk">
      <p class="kicker">${t.next ? "המצגת המרכזית במפגש הקרוב" : "מצגת מרכזית"} · ${esc(t.when)}</p>
      <b>${esc(t.topic)}</b>
      <p>${esc(t.hours)} · <a href="/invite">פרטים והרשמה</a></p>
    </div>`).join("");

  let host = "";
  if (m.site) { try { host = new URL(m.site).hostname.replace(/^www\./, ""); } catch (e) { host = m.site; } }
  const actions = [
    m.wa ? `<a class="btn red" href="https://wa.me/${m.wa}" target="_blank" rel="noopener" aria-label="WhatsApp ל${esc(m.name)}">${waIcon}WhatsApp</a>` : "",
    m.wa && m.phone ? `<a class="btn line" href="tel:+${m.wa}" aria-label="להתקשר ל${esc(m.name)}, ${esc(m.phone)}">${telIcon}<span class="ltr">${esc(m.phone)}</span></a>` : "",
    host ? `<a class="btn line" href="${esc(m.site)}" target="_blank" rel="noopener">לאתר <span class="ltr">${esc(host)}</span></a>` : "",
  ].join("");

  const mates = m.group ? M.filter(x => x.group === m.group && x !== m) : [];
  const circleHtml = mates.length ? `<section class="circle" aria-labelledby="circle-h"><div class="wrap">
      <div class="sec-head">
        <h2 id="circle-h">חברים נוספים במעגל ${esc(m.group)}</h2>
        <p>במעגל יושבים מקצועות שפונים לאותם לקוחות, ולכן הם מעבירים זה לזה הכי הרבה הפניות.</p>
      </div>
      <ul class="mates">${mates.map(x => `<li class="mate">${portrait(x)}
        <h3><a href="${x.page}">${esc(x.name)}</a></h3><p>${esc(x.role)}</p></li>`).join("")}</ul>
      <a class="btn line all" href="/#people">לכל החברים</a>
    </div></section>` : `<section class="circle"><div class="wrap"><a class="btn line all" href="/#people">לכל החברים</a></div></section>`;

  main.innerHTML = `<section class="page-hero"><div class="wrap">
      ${crumbs(m.name)}
      <div class="member">
        <div>
          ${m.cat ? `<p class="kicker">${esc(m.cat)}</p>` : ""}
          <h1>${esc(m.name)}</h1>
          <p class="role">${esc(m.role)}</p>
          ${biz ? `<p class="biz">${esc(biz)}</p>` : ""}
          ${m.group ? `<a class="chip" href="/#people">מעגל ${esc(m.group)}</a>` : ""}
          ${actions ? `<div class="actions">${actions}</div>` : ""}
          ${talkHtml}
          ${m.bio ? `<p class="bio">${esc(m.bio)}</p>` : `<div class="pending"><span class="tag">ממתין לתוכן</span>
            <p>פרטים נוספים על ${esc(first)} בקרוב: במה העסק עוסק ואיזה לקוח מתאים לו.</p></div>`}
        </div>
        ${portrait(m, "portrait", false)}
      </div>
    </div></section>
    ${circleHtml}
    <section class="cta-band" aria-labelledby="cta-h"><div class="wrap">
      <h2 id="cta-h">להכיר את ${esc(first)}</h2>
      <div>
        <p>רוצים פגישת היכרות עם ${esc(m.name)}? בואו לבוקר חמישי הקרוב${MT.dayShort ? `, ${esc(MT.dayShort)}` : ""} ב-7:30 ב${esc(MT.place || "מגדל אדגר 360")}. אנחנו נחבר ביניכם אישית.</p>
        <a class="btn white" href="/invite">שריינו לי מקום</a>
      </div>
    </div></section>`;
})();
