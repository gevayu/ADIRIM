// Arrows for every photo carousel (.gal) on the page. The row itself scrolls natively
// (swipe, trackpad, keyboard); the buttons move it by most of a screen, right to left in RTL.
document.querySelectorAll(".gal").forEach(gal => {
  const track = gal.querySelector(".gal-track"), prev = gal.querySelector(".gal-prev"), next = gal.querySelector(".gal-next");
  if (!track || !prev || !next) return;
  const rtl = getComputedStyle(track).direction === "rtl";
  const step = () => Math.max(track.clientWidth * 0.8, 200);
  const sync = () => {
    const pos = Math.abs(track.scrollLeft), end = track.scrollWidth - track.clientWidth - 2;
    prev.disabled = pos < 2; next.disabled = pos >= end;
    gal.classList.toggle("gal-fits", end <= 0); // every photo already in view: no arrows
  };
  prev.addEventListener("click", () => track.scrollBy({ left: rtl ? step() : -step() }));
  next.addEventListener("click", () => track.scrollBy({ left: rtl ? -step() : step() }));
  track.addEventListener("scroll", sync, { passive: true });
  addEventListener("resize", sync);
  sync();
});
