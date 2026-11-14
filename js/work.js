/* work.js — the work list is already in the HTML (SEO + no-JS).
   This script only adds behaviour: case-study modal, keyboard nav, deep links. */
window.PF = window.PF || {};
(function (PF) {
  const $ = PF.$;
  const grid = $('#workGrid');
  if (!grid) return;
  const projects = PF.DATA.projects;
  const cards = PF.$$('.card', grid);

  /* reveal rows */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-inview'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    cards.forEach(function (c) { io.observe(c); });
  } else {
    cards.forEach(function (c) { c.classList.add('is-inview'); });
  }

  /* ---------- modal ---------- */
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'caseTitle');
  modal.innerHTML = '<div class="modal__panel">' +
    '<button class="modal__close" aria-label="Close case study">✕</button>' +
    '<div class="modal__media" id="modalMedia"></div>' +
    '<div class="modal__body"><div class="modal__main"></div><div class="modal__facts"></div></div></div>';
  document.body.appendChild(modal);
  const panel = modal.querySelector('.modal__panel');
  const media = modal.querySelector('#modalMedia');
  const main = modal.querySelector('.modal__main');
  const facts = modal.querySelector('.modal__facts');
  const closeBtn = modal.querySelector('.modal__close');
  let current = 0;
  let lastFocus = null;

  function open(i, push) {
    current = (i + projects.length) % projects.length;
    const p = projects[current];
    const shots = [p.img].concat(p.gallery || []);
    media.innerHTML = shots.map(function (src, k) {
      const sm = src.replace('.webp', '-sm.webp');
      return '<figure class="modal__shot modal__shot--' + k + '">' +
        '<img src="' + src + '" srcset="' + sm + ' 640w, ' + src + ' 1400w" sizes="(max-width:900px) 92vw, 60vw" alt="' + p.title + ' — frame ' + (k + 1) + '" width="1000" height="1000">' +
        '</figure>';
    }).join('');
    main.innerHTML =
      '<h3 id="caseTitle">' + p.title + '</h3>' +
      '<p>' + p.blurb + '</p>' +
      '<ul class="modal__list">' + p.details.map(function (d) { return '<li>' + d + '</li>'; }).join('') + '</ul>' +
      '<div class="modal__nav">' +
        '<button class="btn btn--ghost" data-prev>← Prev</button>' +
        '<button class="btn btn--ghost" data-next>Next →</button>' +
        '<a class="btn btn--solid" href="' + p.url + '" target="_blank" rel="noopener">Full project on Behance ↗</a>' +
      '</div>';
    facts.innerHTML = '<div><span class="mono">CLIENT</span><b>' + p.client + '</b></div>' +
      '<div><span class="mono">YEAR</span><b>' + p.year + '</b></div>' +
      '<div><span class="mono">SCOPE</span><b>' + p.service + '</b></div>' +
      '<div><span class="mono">TYPE</span><b>' + p.kind + '</b></div>';
    modal.classList.add('is-on');
    document.body.classList.add('modal-open');
    panel.scrollTop = 0;
    if (push !== false) {
      try { history.pushState({ case: p.id }, '', '#work/' + p.id); } catch (e) {}
    }
    main.querySelector('[data-prev]').onclick = function () { open(current - 1); };
    main.querySelector('[data-next]').onclick = function () { open(current + 1); };
    setTimeout(function () { closeBtn.focus({ preventScroll: true }); }, 40);
  }

  function close(pop) {
    modal.classList.remove('is-on');
    document.body.classList.remove('modal-open');
    if (pop !== false && /#work\//.test(location.hash)) {
      try { history.pushState({}, '', location.pathname + location.search); } catch (e) {}
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  grid.addEventListener('click', function (e) {
    const card = e.target.closest('.card');
    if (!card) return;
    lastFocus = card.querySelector('.card__open') || card;
    open(parseInt(card.dataset.index, 10));
  });

  /* whole row is clickable, but only the button is in the tab order */
  PF.$$('.card__open', grid).forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const card = btn.closest('.card');
      lastFocus = btn;
      open(parseInt(card.dataset.index, 10));
    });
  });

  closeBtn.onclick = function () { close(); };
  modal.addEventListener('click', function (e) { if (!panel.contains(e.target)) close(); });
  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('is-on')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'ArrowRight') open(current + 1, false);
    if (e.key === 'ArrowLeft') open(current - 1, false);
    if (e.key === 'Tab') { // keep focus inside the dialog
      const f = PF.$$('button, a[href]', panel).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* deep links: #work/talabat opens straight into the case */
  function fromHash() {
    const m = /^#work\/([\w-]+)$/.exec(location.hash);
    if (!m) return;
    const i = projects.findIndex(function (p) { return p.id === m[1]; });
    if (i > -1) open(i, false);
  }
  window.addEventListener('popstate', function () {
    const m = /^#work\/([\w-]+)$/.exec(location.hash);
    if (m) fromHash(); else if (modal.classList.contains('is-on')) close(false);
  });
  fromHash();
  window.PF.openCase = open;
})(window.PF);
