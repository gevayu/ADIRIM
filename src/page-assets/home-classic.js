const M = window.MEMBERS;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const TONES = ["--t1", "--t2", "--t3", "--t4", "--t5"];
  const tone = m => `var(${TONES[M.indexOf(m) % TONES.length]})`;
  const portrait = (m, extra = "") => `<div class="p" style="--tone:${tone(m)}">${m.img
    ? `<img src="${m.img}" alt="${esc(m.name)}" loading="lazy">`
    : `<span class="ini" aria-hidden="true">${esc(m.initials)}</span>`}${extra}</div>`;

  // hero rotator: every member, shuffled, one at a time (same list as the member count)
  const photos = M.filter(m => m.img && !m.lowres);
  (function rotator(el, pool) {
    pool = pool.slice().sort(() => Math.random() - .5);
    const [a, b] = el.querySelectorAll("img"), cap = el.querySelector("figcaption"), dots = el.querySelector(".dots");
    let i = 0, front = a, paused = false;
    function show(n) {
      const m = pool[n], back = front === a ? b : a;
      back.onload = () => {
        back.classList.add("on"); front.classList.remove("on"); front = back;
        cap.querySelector("b").textContent = m.name;
        cap.querySelector(".role").textContent = [m.role, m.biz].filter(Boolean).join(" · ");
        dots.textContent = `${n + 1} / ${pool.length}`;
        new Image().src = pool[(n + 1) % pool.length].img;  // warm the next one
      };
      back.alt = m.name; back.src = m.img;
    }
    show(0);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ["mouseenter", "focusin"].forEach(e => el.addEventListener(e, () => paused = true));
    ["mouseleave", "focusout"].forEach(e => el.addEventListener(e, () => paused = false));
    setInterval(() => { if (!paused && !document.hidden) show(i = (i + 1) % pool.length); }, 4000);
  })(document.getElementById("rotator"), M.filter(m => m.img));

  mountDirectory(document.getElementById("dir"), {
    render: m => `<li class="card">
      ${portrait(m)}
      <h3><a href="${m.page}">${esc(m.name)}</a></h3>
      <p>${esc(m.role)}${m.biz ? `<br>${esc(m.biz)}` : ""}</p>
      ${m.wa ? `<a class="wa" href="https://wa.me/${m.wa}" target="_blank" rel="noopener">וואטסאפ ←</a>` : ""}
    </li>`,
    empty: q => `<li class="empty"><h3>אין בקבוצה ${esc(q) || "חבר בתחום הזה"}.</h3><p>זה אומר שהמקום פנוי. אם זה המקצוע שלכם, בואו לבוקר אחד.</p><a class="btn" href="#invite">להגיע כאורח ←</a></li>`,
  });

  // bento: real numbers + two member faces that take turns dissolving to another member every 4s
  const faces = photos.slice().sort(() => Math.random() - .5);
  const swapTile = m => `<div class="p swap"><img class="on" src="${m.img}" alt="${esc(m.name)}"><img alt=""></div>`;
  document.getElementById("bento").innerHTML = `
    <div class="tile red"><b>${window.TERM.income}</b><span>הכנסות מהפניות בתוך הקבוצה, מתחילת הקדנציה (אוקטובר 26)<small>קדנציה קודמת: ${window.TERM.previous}</small></span></div>
    ${swapTile(faces[0])}
    <div class="tile sand"><b>${window.TERM.referrals}</b><span>הפניות שעברו מיד ליד</span></div>
    <div class="tile teal"><b>${window.TERM.oneOnOnes}</b><span>פגישות אישיות בין החברים</span></div>
    ${swapTile(faces[1])}
    <div class="tile quote"><q>כאן ייכנס סיפור אמיתי של חבר: מה הוא קיבל, ממי, וכמה זה היה שווה.</q><small>ממתין לתוכן · שם, תמונה, עסק ומספר אחד</small></div>`;

  (function swapFaces(tiles) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let next = 2, turn = 0;
    setInterval(() => {
      if (document.hidden) return;
      const tile = tiles[turn++ % tiles.length], m = faces[next++ % faces.length];
      const [front, back] = tile.querySelector("img.on") === tile.children[0] ? tile.children : [...tile.children].reverse();
      back.onload = () => { back.classList.add("on"); front.classList.remove("on"); };
      back.alt = m.name; back.src = m.img;
    }, 4000);
  })(document.querySelectorAll("#bento .swap"));

  document.getElementById("agenda").innerHTML = window.MEETING.agenda.map(([t, h, p]) =>
    `<li><time>${t}</time><h3>${h}</h3><p>${p}</p></li>`).join("");
