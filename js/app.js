/* app.js — menu, anchors, toggles, small delights */
window.PF = window.PF || {};
(function (PF) {
  const $ = PF.$, body = document.body;

  /* ---------- mobile menu ---------- */
  const burger = $('#burger'), menu = $('#menu');
  function toggleMenu(force) {
    const open = typeof force === 'boolean' ? force : !body.classList.contains('menu-open');
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
  }
  burger.addEventListener('click', function () { toggleMenu(); });

  /* ---------- smooth anchor scrolling ---------- */
  function scrollToTarget(sel) {
    const el = document.querySelector(sel);
    if (!el) return;
    const y = el.getBoundingClientRect().top + PF.scroll.y - 76;
    if (PF.scrollToY) PF.scrollToY(y); else window.scrollTo({ top: y, behavior: 'smooth' });
  }
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href^="#"]');
    const b = e.target.closest('[data-scroll]');
    if (a) {
      const href = a.getAttribute('href');
      if (href && href.length > 1) {
        e.preventDefault();
        scrollToTarget(href);
        toggleMenu(false);
      }
    } else if (b) {
      e.preventDefault();
      scrollToTarget(b.dataset.scroll);
    }
  });

  /* ---------- designer grid mode: press G ---------- */
  function toggleGrid() {
    body.classList.toggle('show-grid');
    PF.toast(body.classList.contains('show-grid') ? 'Grid on' : 'Grid off');
  }

  /* ---------- typing "ink!" gives a little ink ---------- */
  let buf = '';
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') toggleMenu(false);
    if (e.target.matches('input, textarea')) return;
    if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey) toggleGrid();
    buf = (buf + e.key.toLowerCase()).slice(-4);
    if (buf === 'ink!') {
      body.classList.add('ink-burst');
      PF.toast('You found the ink.');
      setTimeout(function () { body.classList.remove('ink-burst'); }, 2200);
    }
  });

  /* ---------- random micro-copy on the hero badge ---------- */
  const badge = $('#heroBadge');
  if (badge) {
    badge.addEventListener('mouseenter', function () {
      const core = badge.querySelector('.badge-core');
      if (core) core.style.transform = 'rotate(' + PF.rand(-12, 12).toFixed(1) + 'deg) scale(1.08)';
    });
    badge.addEventListener('mouseleave', function () {
      const core = badge.querySelector('.badge-core');
      if (core) core.style.transform = '';
    });
  }

  /* ---------- PWA: register the offline shell ---------- */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* file:// or blocked — fine */ });
    });
  }

  /* ---------- native share (mobile) with clipboard fallback ---------- */
  PF.share = function () {
    const data = {
      title: 'Youssef Mohamed — Graphic Designer',
      text: 'Social media, advertising & brand design from Cairo.',
      url: location.href.split('?')[0]
    };
    if (navigator.share) {
      navigator.share(data).catch(function () {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(data.url).then(function () { PF.toast('Link copied'); });
    } else {
      PF.toast(data.url);
    }
  };
  PF.$$('[data-share]').forEach(function (b) { b.addEventListener('click', PF.share); });

  /* ---------- copy the email in one click ---------- */
  const MAIL = (PF.INFO && PF.INFO.email) || '';
  PF.copyMail = function () {
    if (!MAIL) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(MAIL).then(function () { PF.toast('Email copied — ' + MAIL); },
        function () { PF.toast(MAIL); });
    } else {
      const t = document.createElement('textarea');
      t.value = MAIL; t.setAttribute('readonly', '');
      t.style.cssText = 'position:fixed;left:-999px;opacity:0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); PF.toast('Email copied — ' + MAIL); } catch (e) { PF.toast(MAIL); }
      t.remove();
    }
  };
  PF.$$('[data-copy-mail]').forEach(function (b) { b.addEventListener('click', PF.copyMail); });

  /* ---------- platform-accurate shortcut labels ---------- */
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  PF.isMac = isMac;
  if (!isMac) {
    PF.$$('.kbd-btn b').forEach(function (b) { b.textContent = 'Ctrl K'; });
    const hint = PF.$('.contact__actions .mono');
    if (hint) hint.textContent = 'Ctrl K';
  }

  /* ---------- the page is interactive; palette can build its item list ---------- */
  document.dispatchEvent(new CustomEvent('pf:ready'));

  /* ---------- preloader safety: if fonts take forever ---------- */
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (!body.classList.contains('is-loaded')) {
        body.classList.remove('is-loading');
        body.classList.add('is-loaded');
        const intro = document.getElementById('intro');
        if (intro) intro.style.display = 'none';
      }
    }, 2500);
  });
})(window.PF);
