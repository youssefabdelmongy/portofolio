/* palette.js — ⌘K / Ctrl+K command bar.
   Everything on the site is reachable from the keyboard: sections, the eight
   case studies, the eight cursor stages, contact, share and the PDF export. */
window.PF = window.PF || {};
(function (PF) {
  const $ = PF.$, $$ = PF.$$;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const KEYLBL = isMac ? '⌘' : 'Ctrl';

  function build() {
    const el = document.createElement('div');
    el.className = 'palette';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Command palette');
    el.innerHTML =
      '<div class="palette__panel">' +
        '<div class="palette__head">' +
          '<span class="palette__icon mono" aria-hidden="true">⌕</span>' +
          '<input class="palette__input" id="paletteInput" type="text" role="combobox" aria-expanded="true" ' +
            'aria-controls="paletteList" aria-autocomplete="list" autocomplete="off" spellcheck="false" ' +
            'placeholder="Jump to a project, style or section…" />' +
          '<button class="palette__esc mono" type="button" aria-label="Close command palette">esc</button>' +
        '</div>' +
        '<ul class="palette__list" id="paletteList" role="listbox" aria-label="Results"></ul>' +
        '<div class="palette__foot mono">' +
          '<span><i>↑</i><i>↓</i> move</span><span><i>↵</i> open</span><span><i>esc</i> close</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  const root = build();
  const input = $('#paletteInput', root);
  const list = $('#paletteList', root);
  let items = [];
  let filtered = [];
  let sel = 0;
  let lastFocus = null;

  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function go(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + PF.scroll.y - 70;
    PF.scrollToY(y);
  }
  function close() {
    root.classList.remove('is-on');
    document.body.classList.remove('palette-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    input.value = '';
  }
  function open(trigger) {
    lastFocus = trigger || document.activeElement;
    root.classList.add('is-on');
    document.body.classList.add('palette-open');
    render('');
    // focus once the layer is actually painted, otherwise some browsers drop it
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        input.focus({ preventScroll: true });
        if (document.activeElement !== input) {
          input.setAttribute('tabindex', '0');
          input.focus();
        }
      });
    });
  }

  function buildItems() {
    const out = [
      { group: 'Sections', label: 'Hire me', hint: 'what I deliver · live demo', run: function () { go('pointer'); } },
      { group: 'Sections', label: 'Work', hint: '8 projects', run: function () { go('work'); } },
      { group: 'Sections', label: 'About', hint: 'toolkit & services', run: function () { go('about'); } },
      { group: 'Sections', label: 'Contact', hint: 'email & Behance', run: function () { go('contact'); } }
    ];

    (PF.DATA.projects || []).forEach(function (p, i) {
      out.push({
        group: 'Case studies',
        label: p.title,
        hint: p.kind + ' · ' + p.year,
        run: function () { if (PF.openCase) PF.openCase(i); }
      });
    });

    ((PF.cursorLab && PF.cursorLab.stages) || []).forEach(function (st, i) {
      out.push({
        group: 'What I deliver · four acts',
        label: (i + 1) + ' — ' + st.name,
        hint: st.foot.replace(/^0\d · [A-Z]+ — /, ''),
        run: function () { if (PF.cursorLab) PF.cursorLab.goTo(i); }
      });
    });

    out.push(
      { group: 'Actions', label: 'Start the demo from act 01', hint: 'live demo', run: function () { if (PF.cursorLab) PF.cursorLab.goTo(0); } },
      { group: 'Actions', label: 'Email Youssef', hint: (PF.INFO && PF.INFO.email) || '', run: function () { location.href = 'mailto:' + ((PF.INFO && PF.INFO.email) || ''); } },
      { group: 'Actions', label: 'Copy email address', hint: 'clipboard', run: function () { copyMail(); } },
      { group: 'Actions', label: 'Share this site', hint: 'link', run: function () { if (PF.share) PF.share(); } },
      { group: 'Actions', label: 'Open Behance profile', hint: 'behance.net', run: function () { window.open('https://www.behance.net/65c12764', '_blank', 'noopener'); } },
      { group: 'Actions', label: 'Toggle the layout grid', hint: 'or press G', run: function () { document.body.classList.toggle('show-grid'); } },
      { group: 'Actions', label: 'Download the portfolio as PDF', hint: 'print to PDF', run: function () { document.body.classList.remove('palette-open'); root.classList.remove('is-on'); setTimeout(function () { window.print(); }, 120); } }
    );
    return out;
  }

  function copyMail() {
    const mail = (PF.INFO && PF.INFO.email) || '';
    if (!mail) return;
    if (navigator.clipboard) navigator.clipboard.writeText(mail).then(function () { PF.toast('Email copied'); });
    else PF.toast(mail);
  }

  function render(q) {
    const query = q.trim().toLowerCase();
    filtered = items.filter(function (it) {
      if (!query) return true;
      return (it.label + ' ' + it.hint + ' ' + it.group).toLowerCase().indexOf(query) > -1;
    });
    sel = 0;
    if (!filtered.length) {
      list.innerHTML = '<li class="palette__empty mono">Nothing matches “' + q.replace(/[<>&]/g, '') + '”</li>';
      return;
    }
    let html = '';
    let group = '';
    filtered.forEach(function (it, i) {
      if (it.group !== group) {
        group = it.group;
        html += '<li class="palette__group mono" role="presentation">' + group + '</li>';
      }
      html += '<li class="palette__item" role="option" id="pal-' + i + '" data-i="' + i + '" aria-selected="' + (i === 0) + '">' +
        '<span class="palette__label">' + it.label + '</span>' +
        '<span class="palette__hint mono">' + it.hint + '</span></li>';
    });
    list.innerHTML = html;
  }

  function selNode(i) { return list.querySelector('[data-i="' + i + '"]'); }

  function move(d) {
    if (!filtered.length) return;
    sel = (sel + d + filtered.length) % filtered.length;
    $$('.palette__item', list).forEach(function (n, i) { n.setAttribute('aria-selected', String(i === sel)); });
    const n = selNode(sel);
    if (n) {
      n.scrollIntoView({ block: 'nearest' });
      input.setAttribute('aria-activedescendant', 'pal-' + sel);
    }
  }

  function runSel() {
    const it = filtered[sel];
    if (!it) return;
    close();
    setTimeout(it.run, 60);
  }

  input.addEventListener('input', function () { render(input.value); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); runSel(); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') { e.preventDefault(); }
  });

  list.addEventListener('click', function (e) {
    const n = e.target.closest('[data-i]');
    if (!n) return;
    sel = parseInt(n.dataset.i, 10);
    runSel();
  });
  root.addEventListener('click', function (e) { if (e.target === root) close(); });
  root.querySelector('.palette__esc').addEventListener('click', close);

  /* global shortcut */
  document.addEventListener('keydown', function (e) {
    const typing = /^(input|textarea|select)$/i.test((e.target.tagName || ''));
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (root.classList.contains('is-on')) close(); else open();
      return;
    }
    if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
      e.preventDefault(); open();
      return;
    }
    if (e.key === 'Escape' && root.classList.contains('is-on')) close();
  });

  PF.$$('[data-palette]').forEach(function (b) {
    b.addEventListener('click', function () { open(b); });
    b.setAttribute('aria-keyshortcuts', isMac ? 'Meta+K' : 'Control+K');
  });

  /* items need the data files, which are deferred earlier in the page */
  function init() { items = buildItems(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  document.addEventListener('pf:ready', init);

  PF.palette = { open: open, close: close };
})(window.PF);
