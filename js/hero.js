/* hero.js — pointer-reactive variable type, parallax portrait, live clock */
window.PF = window.PF || {};
(function (PF) {
  const $ = PF.$;
  const hero = $('#hero');
  const name = $('.hero__name');
  const figure = $('#heroFigure');
  const badge = $('#heroBadge');

  /* ---------- clocks ---------- */
  function clocks() {
    const t = PF.cairoTime();
    ['clock', 'clock2', 'clock3'].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === 'clock') el.innerHTML = 'CAIRO <b>' + t + '</b>';
      else el.textContent = t;
    });
    const tz = $('#tzName');
    if (tz) tz.textContent = 'Africa/Cairo';
  }
  clocks();
  setInterval(clocks, 20000);

  /* ---------- the type reacts to the hand — or the thumb ---------- */
  const letters = PF.$$('.hero__name .w');
  const coarse = PF.isCoarse();
  const reduce = PF.reduceMotion();
  let mx = window.innerWidth / 2, my = window.innerHeight / 2, px = mx, py = my;
  let idle = 0;                       // ms since the last touch/mouse
  let auto = 0;

  window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; idle = 0; }, { passive: true });
  window.addEventListener('touchstart', function (e) {
    const t = e.touches[0];
    if (!t) return;
    mx = t.clientX; my = t.clientY; idle = 0;
  }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    const t = e.touches[0];
    if (!t) return;
    mx = t.clientX; my = t.clientY; idle = 0;
  }, { passive: true });

  if (!reduce) {
    PF.tick(function (t, dt) {
      idle += dt;
      /* nobody touching? the name breathes on its own, like it is alive */
      if (coarse && idle > 1400) {
        auto += dt * 0.0004;
        mx = window.innerWidth * (0.5 + Math.cos(auto * 1.6) * 0.32);
        my = window.innerHeight * (0.34 + Math.sin(auto * 2.2) * 0.18);
      }
      px = PF.lerp(px, mx, 0.1);
      py = PF.lerp(py, my, 0.1);
      letters.forEach(function (el) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const d = Math.hypot(px - cx, py - cy);
        const near = PF.clamp(1 - d / 420, 0, 1);
        const wght = 320 + near * 480;
        el.style.fontVariationSettings = '"wght" ' + wght.toFixed(0) + ', "opsz" 96';
        const tx = (px - cx) / 260, ty = (py - cy) / 260;
        el.style.transform = 'translate3d(' + (tx * near * 6).toFixed(1) + 'px,' + (ty * near * 6).toFixed(1) + 'px,0)';
      });

      /* portrait + badge parallax, same maths on every device */
      const nx = (px / window.innerWidth - 0.5), ny = (py / window.innerHeight - 0.5);
      if (figure) figure.style.transform = 'translate3d(' + (nx * -18).toFixed(1) + 'px,' + (ny * -14).toFixed(1) + 'px,0)';
      if (badge) badge.style.transform = 'translate3d(' + (nx * 26).toFixed(1) + 'px,' + (ny * 22).toFixed(1) + 'px,0)';
    });
  }

  /* ---------- hero fade on scroll ---------- */
  PF.tick(function () {
    if (!hero) return;
    const y = PF.scroll.y;
    const h = hero.offsetHeight;
    const p = PF.clamp(y / (h * 0.85), 0, 1);
    if (name) {
      name.style.transform = 'translate3d(0,' + (p * -70).toFixed(1) + 'px,0)';
      name.style.opacity = String(1 - p * 0.85);
      name.style.filter = 'blur(' + (p * 4).toFixed(2) + 'px)';
    }
    if (figure) figure.style.opacity = String(1 - p * 1.15);
  });
})(window.PF);
