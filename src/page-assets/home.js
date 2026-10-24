const M = window.MEMBERS;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const TONES = ["--t1", "--t2", "--t3", "--t4", "--t5"];
  const tone = m => `var(${TONES[M.indexOf(m) % TONES.length]})`;
  const portrait = (m, extra = "") => `<div class="p" style="--tone:${tone(m)}">${m.img
    ? `<img src="${m.img}" alt="${esc(m.name)}" loading="lazy">`
    : `<span class="ini" aria-hidden="true">${esc(m.initials)}</span>`}${extra}</div>`;

  const photos = M.filter(m => m.img && !m.lowres);  // also used by the stats bento
  // hero tunnel: member photos fly out of depth as the wheel / finger moves (vanilla port of PerspectiveTunnelHero)
  (function tunnel(el, pool) {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const plane = el.querySelector(".t-plane"), title = el.querySelector(".t-title"), prompt = el.querySelector(".t-prompt");
    const SPAN = .55;
    const shuffled = pool.slice().sort(() => Math.random() - .5);
    // 7 more members come out of the centre at the very end (15-20% opacity, mixed sizes) and stay
    const ghosts = shuffled.slice(16, 23).map((m, i) => {
      const a = (i + .5) * (360 / 7) * Math.PI / 180;
      const node = document.createElement("div");
      node.className = "t-card ghost"; node.setAttribute("aria-hidden", "true");
      node.innerHTML = `<img src="${m.img}" alt="" draggable="false">`;
      plane.append(node);
      return { node, cos: Math.cos(a), sin: Math.sin(a), r: .34 + (i % 2) * .08, rot: (i % 2 ? -1 : 1) * (4 + i), size: [.7, 1.6, .9, 1.9, .8, 1.3, 1.1][i], alpha: [.15, .2, .15, .2, .2, .15, .2][i], start: .84 + i * .018 };
    });
    const cards = shuffled.slice(0, 16).map((m, i) => {
      const a = i * 137.5 * Math.PI / 180;
      const node = document.createElement("a");
      node.className = "t-card"; node.href = m.page; node.style.zIndex = i + 1;
      node.innerHTML = `<img src="${m.img}" alt="" draggable="false"><span><b>${esc(m.name)}</b>${esc(m.role)}</span>`;
      node.setAttribute("aria-label", `${m.name}, ${m.role}`);
      plane.append(node);
      return { node, i, cos: Math.cos(a), sin: Math.sin(a), rx: .28 + (i % 3) * .08, ry: .26 + (i % 2) * .09, rot: (i % 2 ? -1 : 1) * (3 + (i % 5) * 2) };
    });
    const N = cards.length;
    const clamp = v => Math.min(1, Math.max(0, v));
    const ramp = (v, xs, ys) => {  // piecewise-linear, like framer-motion useTransform
      if (v <= xs[0]) return ys[0];
      for (let k = 1; k < xs.length; k++) if (v <= xs[k]) return ys[k - 1] + (ys[k] - ys[k - 1]) * (v - xs[k - 1]) / (xs[k] - xs[k - 1]);
      return ys[ys.length - 1];
    };
    let W = 0, H = 0, mobile = false;
    const size = () => { W = el.clientWidth; H = el.clientHeight; mobile = innerWidth < 768; el.style.perspective = (mobile ? 900 : 1200) + "px"; };
    size(); addEventListener("resize", size);

    // Wheel and touch move the tunnel; at either end the page scrolls as usual, so nobody gets stuck in the hero.
    let raw = 0, prog = 0, touched = false;
    const push = (delta, e) => {
      const next = clamp(raw + delta);
      if (next === raw) return;
      e.preventDefault(); raw = next;
      if (!touched) { touched = true; prompt.classList.add("gone"); }
    };
    el.addEventListener("wheel", e => push(e.deltaY * .0008, e), { passive: false });
    let lastY = null;
    el.addEventListener("touchstart", e => { lastY = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchmove", e => { const y = e.touches[0].clientY; push((lastY - y) * .0025, e); lastY = y; }, { passive: false });

    let px = 0, py = 0, tx = 0, ty = 0;
    if (!reduce) addEventListener("pointermove", e => { tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2; }, { passive: true });

    raw = .14;  // open with the first faces already in view
    (function frame() {
      prog += (raw - prog) * (reduce ? 1 : .08);
      px += (tx - px) * .06; py += (ty - py) * .06;
      const farZ = mobile ? -1200 : -1700, nearZ = mobile ? 350 : 500, pan = mobile ? 20 : 45;
      const w = mobile ? Math.max(130, Math.min(180, W * .38)) : Math.max(180, Math.min(270, W * .18));
      for (const c of cards) {
        const lp = clamp((prog - c.i / N * (1 - SPAN)) / SPAN);
        const op = ramp(lp, [0, .18, .82, .98], [0, 1, 1, 0]);
        const x = c.cos * W * c.rx - px * pan, y = c.sin * H * c.ry - py * pan, z = farZ + (nearZ - farZ) * lp;
        c.node.style.width = w + "px";
        c.node.style.opacity = op;
        c.node.style.visibility = op < .02 ? "hidden" : "visible";
        c.node.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) rotateZ(${c.rot}deg)`;
      }
      for (const g of ghosts) {
        const x = g.cos * W * g.r - px * pan * .5, y = g.sin * H * g.r - py * pan * .5;
        g.node.style.width = w * g.size + "px";
        // like the flying cards they emerge from the centre and travel outwards, but stop short and stay faint
        const lp = clamp((prog - g.start) / (1 - g.start));
        g.node.style.opacity = ramp(lp, [0, .4], [0, g.alpha]);
        g.node.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${farZ + (-100 - farZ) * lp}px) rotateZ(${g.rot}deg)`;
      }
      title.style.opacity = ramp(prog, [0, .12], [.25, 1]);  // headline and rings stay; only the photos pass
      title.style.transform = `scale(${ramp(prog, [0, .5], [.7, 1])})`;
      requestAnimationFrame(frame);
    })();
  })(document.getElementById("tunnel"), M.filter(m => m.img && !m.lowres));

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
