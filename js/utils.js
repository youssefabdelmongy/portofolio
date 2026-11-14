/* utils.js — tiny helpers + shared ticker */
window.PF = window.PF || {};

(function (PF) {
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = () => window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* shared requestAnimationFrame ticker */
  const subs = new Set();
  let running = false, last = performance.now();
  function frame(t) {
    const dt = Math.min(64, t - last); last = t;
    subs.forEach(fn => fn(t, dt));
    if (subs.size) requestAnimationFrame(frame); else running = false;
  }
  function add(fn) {
    subs.add(fn);
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    return () => subs.delete(fn);
  }

  let toastTimer;
  function toast(msg, ms) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), ms || 2600);
  }

  function debounce(fn, wait) {
    let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), wait || 120); };
  }

  /* seeded RNG (mulberry32) */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function hasArabic(str) { return /[\u0600-\u06FF]/.test(str || ''); }

  function cairoTime() {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date());
    } catch (e) { return '--:--'; }
  }

  PF.$ = $; PF.$$ = $$;
  PF.clamp = clamp; PF.lerp = lerp; PF.rand = rand;
  PF.reduceMotion = reduceMotion; PF.isCoarse = isCoarse;
  PF.tick = add; PF.toast = toast; PF.debounce = debounce;
  PF.rng = rng; PF.hasArabic = hasArabic; PF.cairoTime = cairoTime;
})(window.PF);
