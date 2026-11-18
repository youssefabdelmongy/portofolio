/* reveal.js — IntersectionObserver reveals, char/word splitting, counters,
   scroll-spy, scroll-lit statement, velocity-aware marquee */
window.PF = window.PF || {};
(function (PF) {
  const $ = PF.$, $$ = PF.$$;

  /* ---------- split text ---------- */
  function splitChars(el) {
    if (el.dataset.splitted) return;
    const raw = el.textContent.trim();
    el.setAttribute('aria-label', raw);
    el.innerHTML = '';
    const frag = document.createDocumentFragment();
    let idx = 0;
    raw.split(/(\s+)/).forEach(function (chunk) {
      if (/^\s+$/.test(chunk)) { frag.appendChild(document.createTextNode(' ')); return; }
      const wrap = document.createElement('span');
      wrap.className = 'word';
      wrap.setAttribute('aria-hidden', 'true');
      Array.from(chunk).forEach(function (ch) {
        const c = document.createElement('span');
        c.className = 'char';
        c.textContent = ch;
        c.style.transitionDelay = (idx * 16) + 'ms';
        idx++;
        wrap.appendChild(c);
      });
      wrap.style.overflow = 'hidden';
      wrap.style.display = 'inline-block';
      wrap.style.verticalAlign = 'top';
      frag.appendChild(wrap);
      idx++;
    });
    el.appendChild(frag);
    el.dataset.splitted = '1';
  }

  function splitWords(el) {
    if (el.dataset.splitted) return;
    const raw = el.textContent.trim();
    el.setAttribute('aria-label', raw);
    el.innerHTML = raw.split(/\s+/).map(function (w, i) {
      return '<span class="word" style="transition-delay:' + (i * 45) + 'ms" aria-hidden="true"><span>' + w + '</span></span>';
    }).join(' ');
    el.dataset.splitted = '1';
  }

  /* ---------- reveal observer ---------- */
  function initObserver() {
    const targets = $$('[data-split], [data-reveal], .card, .section, .js-inview');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('is-inview'); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-inview');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- counters (progressive: HTML already holds the real number) ---------- */
  function initCounters() {
    const nums = $$('[data-count]');
    if (PF.reduceMotion()) return;
    const run = function (el) {
      const target = parseFloat(el.dataset.count) || 0;
      if (!target || el.dataset.done) return;
      el.dataset.done = '1';
      const dur = 1500, t0 = performance.now();
      el.textContent = '0';
      (function step(t) {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = String(target);
      })(t0);
    };
    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------- scroll-lit statement ---------- */
  function initStatement() {
    const el = $('#statement');
    if (!el) return;
    const txt = el.textContent.replace(/\s+/g, ' ').trim();
    el.innerHTML = txt.split(' ').map(function (w) {
      return '<span class="sw">' + w + '</span>';
    }).join(' ');

    const spans = $$('.sw', el);
    const accents = ["identities", "cursor", "16", "pixels"];
    spans.forEach(function (s) {
      const clean = s.textContent.replace(/[^\w]/g, '').toLowerCase();
      if (accents.indexOf(clean) > -1) s.classList.add('sw--accent');
    });

    PF.tick(function () {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = PF.clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
      const lit = Math.floor(p * spans.length * 1.2);
      for (let i = 0; i < spans.length; i++) {
        spans[i].classList.toggle('lit', i < lit);
      }
    });
  }

  /* ---------- scroll spy ---------- */
  function initSpy() {
    /* only in-page links are spy targets — tools.html is a different document and
       document.querySelector('tools.html') would throw and kill the whole ticker */
    const links = $$('.nav__link').filter(function (l) {
      return (l.getAttribute('href') || '').charAt(0) === '#';
    });
    const secs = links.map(function (l) { return document.querySelector(l.getAttribute('href')); });
    PF.tick(function () {
      let active = -1;
      secs.forEach(function (s, i) {
        if (!s) return;
        const r = s.getBoundingClientRect();
        if (r.top <= window.innerHeight * 0.4 && r.bottom > window.innerHeight * 0.4) active = i;
      });
      links.forEach(function (l, i) { l.classList.toggle('is-active', i === active); });
    });
  }

  PF.splitChars = splitChars;
  PF.splitWords = splitWords;

  function boot() {
    $$('[data-split="chars"]').forEach(splitChars);
    $$('[data-split="words"]').forEach(splitWords);
    initObserver();
    initCounters();
    initStatement();
    initSpy();
    // elements added later (cards) get observed by work.js itself
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})(window.PF);
