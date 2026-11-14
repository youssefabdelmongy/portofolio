/* intro.js — once-per-session counter curtain */
window.PF = window.PF || {};
(function (PF) {
  const intro = document.getElementById('intro');
  const countEl = document.getElementById('introCount');
  const bar = intro ? intro.querySelector('.intro__bar i') : null;
  const body = document.body;

  function finish() {
    body.classList.add('is-loaded');
    body.classList.remove('is-loading');
    setTimeout(function () { if (intro) intro.style.display = 'none'; }, 1200);
    document.dispatchEvent(new CustomEvent('pf:loaded'));
  }

  const already = sessionStorage.getItem('pf-intro') === '1' || PF.reduceMotion();
  if (already) {
    if (intro) { intro.style.display = 'none'; }
    body.classList.remove('is-loading');
    body.classList.add('is-loaded');
    document.dispatchEvent(new CustomEvent('pf:loaded'));
    return;
  }
  sessionStorage.setItem('pf-intro', '1');

  const start = performance.now();
  const DUR = 1500;
  let progress = 0;

  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  // preload the heavy assets while counting
  const warm = ['assets/portrait-cut.webp', 'assets/portrait-square.webp',
    'assets/work/talabat.webp', 'assets/work/sheikh.webp', 'assets/work/qandil.webp'];
  warm.forEach(function (src) { const i = new Image(); i.src = src; });

  function tick(t) {
    const p = Math.min(1, (t - start) / DUR);
    const v = Math.round(ease(p) * 100);
    if (v !== progress) {
      progress = v;
      if (countEl) countEl.textContent = String(v).padStart(2, '0');
      if (bar) bar.style.width = v + '%';
    }
    if (p < 1) requestAnimationFrame(tick);
    else setTimeout(finish, 220);
  }
  requestAnimationFrame(tick);

  // safety: never trap the visitor
  setTimeout(function () { if (!body.classList.contains('is-loaded')) finish(); }, 4200);
})(window.PF);
