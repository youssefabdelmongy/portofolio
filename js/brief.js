/* brief.js — the 30-second brief builder
   A visitor picks three things and gets a short brief they can send or keep.
   Everything stays in the browser: nothing is posted anywhere, and the mailto
   link is the only way the words leave the page.                            */
window.PF = window.PF || {};
(function (PF) {
  const root = PF.$('#cbrief');
  if (!root) return;

  const text = PF.$('#cbriefText', root);
  const meta = PF.$('#cbriefMeta', root);
  const send = PF.$('#cbriefSend', root);
  const copy = PF.$('#cbriefCopy', root);
  const reset = PF.$('#cbriefReset', root);
  let email = (PF.INFO && PF.INFO.email) || 'jomongy52@gmail.com';
  /* content/site.json is the source of truth once it lands */
  document.addEventListener('pf:content', function (e) {
    if (e.detail && e.detail.person && e.detail.person.email) email = e.detail.person.email;
    if (typeof render === 'function') render();
  });

  const FIELDS = ['need', 'when', 'where'];
  const LABEL = { need: 'Need', when: 'Timing', where: 'Used for' };
  let state = { need: '', when: '', where: '' };

  const opts = PF.$$('.cbrief__opt', root);
  opts.forEach(function (b) {
    b.addEventListener('click', function () {
      const field = b.closest('.cbrief__opts').dataset.field;
      PF.$$('.cbrief__opt', b.closest('.cbrief__opts')).forEach(function (o) {
        o.classList.toggle('is-on', o === b);
        o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
      });
      state[field] = b.dataset.v;
      render();
    });
  });

  function defaults() {
    /* whatever is marked "on" in the markup is the starting answer */
    FIELDS.forEach(function (f) {
      const on = PF.$('.cbrief__opts[data-field="' + f + '"] .cbrief__opt.is-on', root);
      state[f] = on ? on.dataset.v : '';
    });
  }

  /* a plain, friendly message — no lorem, no agency speak */
  function build() {
    const lines = [];
    lines.push('Hi Youssef,');
    lines.push('');
    lines.push('I need: ' + state.need + '.');
    lines.push('Timing: ' + state.when + '.');
    lines.push('Where it will be used: ' + state.where + '.');
    lines.push('');
    lines.push('A bit about the business: ');
    lines.push('');
    lines.push('You can reply to me at this address.');
    return lines.join('\n');
  }

  function render() {
    if (!text.dataset.touched) text.value = build();
    const subject = 'Brief — ' + (state.need || 'project');
    send.href = 'mailto:' + email +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(text.value);

    /* the same brief, ready to paste into WhatsApp */
    const wa = PF.$('#cbriefWhats', root);
    if (wa) {
      const num = (PF.content && PF.content.person && PF.content.person.whatsappDigits) || '';
      wa.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(text.value);
      if (!num) wa.setAttribute('hidden', '');
      else wa.removeAttribute('hidden');
    }
    meta.textContent = 'Sends from your own email app · nothing is stored on this site';
  }

  text.addEventListener('input', function () { text.dataset.touched = '1'; });

  if (copy) {
    copy.addEventListener('click', function () {
      const done = function () { if (PF.toast) PF.toast('Brief copied — paste it anywhere'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text.value).then(done).catch(function () {
          text.select(); document.execCommand && document.execCommand('copy'); done();
        });
      } else {
        text.select();
        try { document.execCommand('copy'); done(); } catch (e) { /* select is enough */ }
      }
      render();
    });
  }

  if (reset) {
    reset.addEventListener('click', function () {
      delete text.dataset.touched;
      defaults();
      PF.$$('.cbrief__opt', root).forEach(function (o) {
        const f = o.closest('.cbrief__opts').dataset.field;
        const first = PF.$('.cbrief__opt', o.closest('.cbrief__opts'));
        const on = o === first;
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) state[f] = o.dataset.v;
      });
      render();
      if (PF.toast) PF.toast('Back to the start');
    });
  }

  defaults();
  render();

  PF.brief = { build: build, state: function () { return state; } };
})(window.PF);
