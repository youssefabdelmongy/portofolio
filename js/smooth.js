/* smooth.js — rAF-driven inertial scrolling (own engine, no dependencies)
   + scroll velocity, header states, progress bar, generic parallax layers. */
window.PF = window.PF || {};
(function (PF) {
  const html = document.documentElement;
  const state = { y: window.scrollY, vy: 0, dir: 1, smoothY: window.scrollY };
  PF.scroll = state;

  const reduce = PF.reduceMotion() || PF.isCoarse() === false && false;
  const useInertia = !PF.reduceMotion() && !PF.isCoarse() &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let current = window.scrollY, target = window.scrollY;
  let lastY = window.scrollY, lastT = performance.now(), programmatic = false;

  /* ---------- inertion engine: wheel is intercepted, rAF eases to target ---------- */
  if (useInertia) {
    html.classList.add('has-inertia');

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return;                                  // let pinch-zoom through
      if (document.body.classList.contains('menu-open') || document.body.classList.contains('modal-open')) return;
      // zones that hijack the wheel themselves keep native scrolling
      if (e.target.closest('[data-no-inertia], .modal__panel')) return;
      e.preventDefault();
      target += e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      target = PF.clamp(target, 0, html.scrollHeight - window.innerHeight);
    }, { passive: false });

    window.addEventListener('scroll', function () {
      if (programmatic) return;
      // scrollbar drag / anchor jump / keyboard — resync
      if (Math.abs(window.scrollY - Math.round(current)) > 3) {
        current = target = window.scrollY;
      }
    }, { passive: true });
  }

  /* ---------- anchor scrolling works in both modes ---------- */
  PF.scrollToY = function (y) {
    if (useInertia) {
      target = PF.clamp(y, 0, html.scrollHeight - window.innerHeight);
      programmatic = true;
      setTimeout(function () { programmatic = false; }, 900);
    } else {
      window.scrollTo({ top: y, behavior: PF.reduceMotion() ? 'auto' : 'smooth' });
    }
  };

  /* ---------- main loop ---------- */
  PF.tick(function (t, dt) {
    if (useInertia && !document.body.classList.contains('modal-open')) {
      current = PF.lerp(current, target, PF.clamp(0.13 * (dt / 16.7), 0.02, 0.6));
      if (Math.abs(target - current) < 0.4) current = target;
      programmatic = true;
      window.scrollTo(0, Math.round(current));
      programmatic = false;
    } else {
      current = window.scrollY;
      target = current;
    }

    const d = current - lastY;
    const now = performance.now();
    const ms = Math.max(8, now - lastT);
    state.vy = PF.lerp(state.vy, (d / ms) * 16.7, 0.22);
    if (Math.abs(d) > 0.6) state.dir = d > 0 ? 1 : -1;
    state.y = current;
    state.smoothY = current;
    lastY = current; lastT = now;
    html.style.setProperty('--scroll-vel', Math.min(30, Math.abs(state.vy)).toFixed(2));

    // header + progress
    const head = document.getElementById('siteHead');
    if (head) {
      head.classList.toggle('is-stuck', current > 40);
      const moving = Math.abs(state.vy) > 1.2;
      if (current > 420 && state.dir === 1 && moving && !document.body.classList.contains('menu-open')) head.classList.add('is-hidden');
      else head.classList.remove('is-hidden');
    }
    const bar = document.getElementById('scrollProgress');
    if (bar && bar.firstElementChild) {
      const max = html.scrollHeight - window.innerHeight;
      bar.firstElementChild.style.width = (max > 0 ? PF.clamp(current / max, 0, 1) * 100 : 0) + '%';
    }
  });

  /* ---------- generic [data-parallax] layers ---------- */
  PF.$$('[data-parallax]').forEach(function (el) {
    const speed = parseFloat(el.dataset.parallax) || 0.15;
    PF.tick(function () {
      if (PF.reduceMotion()) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      const off = (r.top + r.height / 2 - window.innerHeight / 2) * -speed;
      el.style.transform = 'translate3d(0,' + off.toFixed(2) + 'px,0)';
    });
  });

  /* ---------- resize housekeeping ---------- */
  window.addEventListener('resize', PF.debounce(function () {
    target = current = window.scrollY;
  }, 150));
})(window.PF);
