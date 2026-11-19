/* tools.js — the six working tools on /tools.
 *
 * Everything runs in the browser. No network, no upload, no tracking:
 * a designer on a print job should be able to use these offline on a phone.
 */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ───────────────────────── helpers ───────────────────────── */

  function hexToRgb(hex) {
    let h = hex.trim().replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v =>
      Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')
    ).join('').toUpperCase();
  }

  function srgbToLin(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function luminance(rgb) {
    return 0.2126 * srgbToLin(rgb.r) + 0.7152 * srgbToLin(rgb.g) + 0.0722 * srgbToLin(rgb.b);
  }

  function contrast(a, b) {
    const la = luminance(a), lb = luminance(b);
    const hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  function copy(text, label) {
    const done = () => toast((label || 'Copied') + ' — ' + text);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else done();
  }

  let toastT;
  function toast(msg) {
    let el = $('#toolToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toolToast';
      el.className = 'tool-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('is-on'), 2200);
  }

  /* ─────────────── 1 · social sizes ─────────────── */

  /* ─────────────── 2 · print bleed ─────────────── */

  const PRESETS = [
    { name: 'A6', w: 105, h: 148 }, { name: 'A5', w: 148, h: 210 },
    { name: 'A4', w: 210, h: 297 }, { name: 'A3', w: 297, h: 420 },
    { name: 'A2', w: 420, h: 594 }, { name: 'A1', w: 594, h: 841 },
    { name: 'Square 21', w: 210, h: 210 }, { name: 'Business card', w: 85, h: 55 },
    { name: 'US Letter', w: 216, h: 279 }, { name: 'Menu 21×30', w: 210, h: 300 }
  ];

  function buildPrint() {
    const presetSel = $('#tPrintPreset');
    if (!presetSel) return;
    presetSel.innerHTML = '<option value="">Custom…</option>' +
      PRESETS.map((p, i) => `<option value="${i}">${p.name} — ${p.w}×${p.h} mm</option>`).join('');

    const wIn = $('#tPrintW'), hIn = $('#tPrintH');
    const bleedIn = $('#tPrintBleed'), safeIn = $('#tPrintSafe'), dpiIn = $('#tPrintDpi');
    const out = $('#tPrintOut');

    presetSel.addEventListener('change', () => {
      const p = PRESETS[presetSel.value];
      if (!p) return;
      wIn.value = p.w; hIn.value = p.h;
      render();
    });

    function render() {
      const w = Math.max(1, +wIn.value || 0);
      const h = Math.max(1, +hIn.value || 0);
      const b = Math.max(0, +bleedIn.value || 0);
      const s = Math.max(0, +safeIn.value || 0);
      const dpi = Math.max(72, +dpiIn.value || 300);

      const docW = w + b * 2, docH = h + b * 2;
      const safeW = Math.max(0, w - s * 2), safeH = Math.max(0, h - s * 2);
      const px = mm => Math.round(mm / 25.4 * dpi);

      out.innerHTML = `
        <div class="tp__row"><span>Document with bleed</span><b>${docW.toFixed(1)} × ${docH.toFixed(1)} mm</b></div>
        <div class="tp__row"><span>Trim (finished size)</span><b>${w.toFixed(1)} × ${h.toFixed(1)} mm</b></div>
        <div class="tp__row"><span>Safe area</span><b>${safeW.toFixed(1)} × ${safeH.toFixed(1)} mm</b></div>
        <div class="tp__row"><span>Pixels at ${dpi} dpi</span><b>${px(docW)} × ${px(docH)} px</b></div>
        <div class="tp__row tp__row--note"><span>Marks to send</span><b>Crop marks + ${b} mm bleed</b></div>`;

      // the diagram: trim inside bleed inside document, to scale
      /* the figure is a square box; the doc is drawn inside it at true proportion.
         inset values are % of the DOCUMENT, not of the square, so the layers line up. */
      const scale = 100 / Math.max(docW, docH);
      const insetPct = mm => (mm / Math.max(docW, docH)) * 100;
      /* millimetres per screen pixel, read live from the box on every move —
         capturing it here goes stale the moment the diagram re-renders */
      const mmPerPx = () => {
        const bx = live();
        const w = bx ? bx.getBoundingClientRect().width : 0;
        return w ? Math.max(docW, docH) / w : 0;
      };

      $('#tPrintFig').innerHTML = `
        <div class="tpfig" id="tpFigBox" style="width:${docW * scale}%;aspect-ratio:${docW}/${docH}">
          <div class="tpfig__bleed"></div>
          <div class="tpfig__trim" data-grab="bleed" role="slider" tabindex="0"
               aria-label="Bleed size in millimetres" aria-valuemin="0" aria-valuemax="20" aria-valuenow="${b}"
               style="inset:${insetPct(b)}%"><span class="tpfig__grip"></span></div>
          <div class="tpfig__safe" data-grab="safe" role="slider" tabindex="0"
               aria-label="Safe margin in millimetres" aria-valuemin="0" aria-valuemax="40" aria-valuenow="${s}"
               style="inset:${insetPct(b + s)}%"><span class="tpfig__grip"></span></div>
        </div>
        <div class="tpfig__legend mono">
          <span><i class="lg lg--bleed"></i>bleed ${b}mm</span>
          <span><i class="lg lg--trim"></i>trim</span>
          <span><i class="lg lg--safe"></i>safe ${s}mm</span>
          <span class="tpfig__tip">drag the edges ↔</span>
        </div>`;

      /* ── drag the diagram to set the numbers ──
         the trim edge is the bleed handle, the dashed line is the safe margin. */
      /* render() replaces the diagram on every change, so nothing below may hold on to
         the element. `live()` always returns the one currently in the document. */
      const live = () => $('#tpFigBox');
      if (!live()) return;
      let drag = null;

      function mmFrom(ev) {
        const bx = live();
        if (!bx) return 0;
        const r = bx.getBoundingClientRect();
        const pt = ev.touches ? ev.touches[0] : ev;
        /* distance from the nearest edge, converted to mm off the TRIM edge */
        const dx = Math.min(pt.clientX - r.left, r.right - pt.clientX);
        const dy = Math.min(pt.clientY - r.top, r.bottom - pt.clientY);
        return Math.min(dx, dy) * mmPerPx();
      }

      function onMove(ev) {
        if (!drag) return;
        ev.preventDefault();
        const mm = mmFrom(ev);
        if (drag === 'bleed') {
          const v = Math.round(Math.max(0, Math.min(20, mm)) * 2) / 2;
          if (v !== +bleedIn.value) { bleedIn.value = v; render(); }
        } else {
          /* the handle sits at bleed + safe, so subtract the bleed first */
          const v = Math.round(Math.max(0, Math.min(40, mm - (+bleedIn.value || 0))));
          if (v !== +safeIn.value) { safeIn.value = v; render(); }
        }
      }

      /* keep the spoken value in step with the sliders */
      function syncAria(bb, ss) {
        const bx = live();
        if (!bx) return;
        const t = bx.querySelector('[data-grab="bleed"]');
        const a = bx.querySelector('[data-grab="safe"]');
        if (t) t.setAttribute('aria-valuenow', bb);
        if (a) a.setAttribute('aria-valuenow', ss);
      }
      function onUp() {
        drag = null;
        const bx = $('#tpFigBox');
        if (bx) bx.classList.remove('is-dragging');
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      }

      /* render() rebuilds the diagram, which throws away focus mid-drag. Put it back. */
      function restoreFocus(grab) {
        if (!grab) return;
        const bx = live();
        if (!bx) return;
        const el = bx.querySelector('[data-grab="' + grab + '"]');
        if (el && document.activeElement !== el) el.focus({ preventScroll: true });
      }

      /* Delegated on #tPrintFig — the only element here that render() does NOT replace.
         Listening on the box dies on the first move, because the move calls render(). */
      const host = $('#tPrintFig');
      if (host && !host.dataset.dragWired) {
        host.dataset.dragWired = '1';
        host.addEventListener('pointerdown', ev => {
          const g = ev.target.closest && ev.target.closest('[data-grab]');
          if (!g) return;
          ev.preventDefault();
          const bx = $('#tpFigBox');
          if (bx) bx.classList.add('is-dragging');
          drag = g.dataset.grab;
          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
          window.addEventListener('pointercancel', onUp);
        });
        /* keyboard lives here too, so it also survives re-renders */
        host.addEventListener('keydown', ev => {
          const g = ev.target.closest && ev.target.closest('[data-grab]');
          if (!g) return;
          const key = ev.key;
          if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'ArrowLeft' && key !== 'ArrowRight') return;
          ev.preventDefault();
          const step = ev.shiftKey ? 2 : 0.5;
          const dir = (key === 'ArrowUp' || key === 'ArrowRight') ? 1 : -1;
          if (g.dataset.grab === 'bleed') {
            bleedIn.value = Math.max(0, Math.min(20, (+bleedIn.value || 0) + dir * step));
          } else {
            safeIn.value = Math.max(0, Math.min(40, (+safeIn.value || 0) + dir * step));
          }
          const keep = g.dataset.grab;
          render();
          restoreFocus(keep);
        });
      }

      syncAria(b, s);
    }

    [wIn, hIn, bleedIn, safeIn, dpiIn].forEach(i => i && i.addEventListener('input', render));
    render();
  }

  /* ─────────────── 3 · contrast checker ─────────────── */

  function buildContrast() {
    const fg = $('#tConFg'), bg = $('#tConBg'), text = $('#tConText');
    if (!fg || !bg) return;
    const swap = $('#tConSwap');

    if (swap) swap.addEventListener('click', () => {
      const a = fg.value; fg.value = bg.value; bg.value = a; render();
    });

    function render() {
      const f = hexToRgb(fg.value), b = hexToRgb(bg.value);
      if (!f || !b) return;
      const ratio = contrast(f, b);
      const big = ratio >= 3, normal = ratio >= 4.5, aaa = ratio >= 7;

      $('#tConRatio').textContent = ratio.toFixed(2) + ':1';
      $('#tConRatio').className = 'tcon__ratio ' + (normal ? 'is-pass' : ratio >= 3 ? 'is-mid' : 'is-fail');

      const rows = [
        ['AA · normal text (4.5:1)', normal],
        ['AA · large text (3:1)', big],
        ['AAA · normal text (7:1)', aaa],
        ['AAA · large text (4.5:1)', normal]
      ];
      $('#tConChecks').innerHTML = rows.map(([label, ok]) =>
        `<li class="${ok ? 'is-pass' : 'is-fail'}"><span>${ok ? '✓' : '✕'}</span>${label}</li>`
      ).join('');

      if (text) {
        text.style.color = fg.value;
        text.style.background = bg.value;
      }

      /* a live size slider on the sample: does it still pass when it gets small? */
      const sizeSlider = $('#tConSize');
      if (sizeSlider) {
        const px = +sizeSlider.value || 16;
        $('#tConSizeVal').textContent = px;
        const big = px >= 24 || (px >= 18.66 && +($('#tConSizeBold') && $('#tConSizeBold').checked ? 700 : 400) >= 700);
        text.style.fontSize = px + 'px';
        const largeOk = ratio >= 3, normalOk = ratio >= 4.5;
        const passes = big ? largeOk : normalOk;
        text.dataset.pass = passes ? 'yes' : 'no';
        const badge = $('#tConLivePass');
        if (badge) {
          badge.textContent = passes ? 'PASSES at ' + px + 'px' : 'FAILS at ' + px + 'px';
          badge.className = 'tcon__live-badge ' + (passes ? 'is-pass' : 'is-fail');
        }
      }
      $('#tConSwatchFg').style.background = fg.value;
      $('#tConSwatchBg').style.background = bg.value;
    }

    /* Eyedropper API (Chrome/Edge, and Android Chrome). Where it is missing the
       button is removed rather than left as a dead control. */
    const pick = $('#tConPick');
    if (pick) {
      if (window.EyeDropper) {
        pick.addEventListener('click', async () => {
          try {
            const { sRGBHex } = await new window.EyeDropper().open();
            fg.value = sRGBHex;
            render();
            toast('Picked ' + sRGBHex);
          } catch (e) { /* user cancelled — not an error */ }
        });
      } else {
        pick.remove();
      }
    }

    [fg, bg].forEach(i => i.addEventListener('input', render));
    $$('.tcon__pick').forEach(p => p.addEventListener('click', () => {
      fg.value = p.dataset.fg; bg.value = p.dataset.bg; render();
    }));

    const liveSize = $('#tConSize');
    if (liveSize) liveSize.addEventListener('input', render);
    render();
  }

  /* ─────────────── 5 · palette from one colour ─────────────── */

  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(Math.min(k(n) - 3, 9 - k(n)), 1));
    return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
  }

  let PAL_LAST = [];

  const PAL_NAME = step => /^[0-9]+$/.test(step) ? 'brand-' + step : 'brand-' + step;

  function toCss(list) {
    return ':root {\n' + list.map(t => '  --' + PAL_NAME(t.step) + ': ' + t.hex + ';').join('\n') + '\n}';
  }
  function toJson(list) {
    return JSON.stringify(list.reduce((o, t) => { o[PAL_NAME(t.step)] = t.hex; return o; }, {}), null, 2);
  }
  function toTailwind(list) {
    return 'theme: {\n  extend: {\n    colors: {\n' +
      list.map(t => '      "' + PAL_NAME(t.step) + '": "' + t.hex + '",').join('\n') +
      '\n    }\n  }\n}';
  }

  function buildPalette() {
    const base = $('#tPalBase');
    if (!base) return;
    const out = $('#tPalOut');

    function render() {
      const rgb = hexToRgb(base.value);
      if (!rgb) return;
      // hue from rgb, then build a usable set
      const max = Math.max(rgb.r, rgb.g, rgb.b) / 255;
      const min = Math.min(rgb.r, rgb.g, rgb.b) / 255;
      const d = max - min;
      let h = 0;
      if (d !== 0) {
        const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
        h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h *= 60;
      }
      const sBase = max === 0 ? 0 : Math.round((d / max) * 100);

      /* A ramp is only honest if the base colour actually lands where it belongs.
         Build ten fixed lightness steps, find the one nearest the base, and put the
         base there untouched — so #F1EEE6 saturates at the top of the scale and
         #0A0A0B at the bottom, instead of both producing the same middle ramp. */
      const LADDER = [97, 93, 87, 79, 70, 60, 50, 42, 34, 26];
      const KEYS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
      const baseL = (max + min) / 2 * 100;

      let anchor = 0, best = 999;
      LADDER.forEach((L, i) => { const d2 = Math.abs(L - baseL); if (d2 < best) { best = d2; anchor = i; } });

      /* saturation falls off as the step darkens, matching how real ramps behave */
      const stepColour = (i) => {
        const L = LADDER[i];
        const sat = Math.max(6, Math.min(96, sBase * (0.55 + 0.45 * Math.sin((1 - i / 9) * Math.PI / 2))));
        return hslToHex(h, Math.round(sat), L);
      };

      const rows = KEYS.map((k, i) => i === anchor
        ? ['BASE', base.value.toUpperCase()]
        : [k, stepColour(i)]);

      /* accents follow the chosen harmony instead of a fixed rule */
      const harm = ($('#tPalHarmony') && $('#tPalHarmony').value) || 'comp';
      /* three accents per harmony, always three distinct hues — a ramp tool that
         hands you duplicate accents is a ramp tool you have to correct by hand */
      const acc = {
        comp:   [h + 180, h + 150, h + 210],
        split:  [h + 150, h + 210, h + 180],
        triad:  [h + 120, h + 240, h + 60],
        analog: [h + 30, h - 30, h + 60]
      }[harm] || [h + 180, h + 150, h + 210];
      const comp = hslToHex(acc[0], Math.max(20, sBase), 52);
      const analogA = hslToHex(acc[1], sBase, 55);
      const analogB = hslToHex(acc[2], sBase, 55);
      const ACCENT_LABELS = {
        comp: ['Complement', 'Split −30', 'Split +30'],
        split: ['Split −30', 'Split +30', 'Complement'],
        triad: ['Triad +120', 'Triad +240', 'Triad +60'],
        analog: ['Analog +30', 'Analog −30', 'Analog +60']
      }[harm] || ['Complement', 'Split −30', 'Split +30'];

      const all = rows.map(r => hexToRgb(r[1])).filter(Boolean);
      const rampL = all.map(r => (Math.max(r.r, r.g, r.b) + Math.min(r.r, r.g, r.b)) / 2 / 255 * 100);
      const spread = Math.round(Math.max.apply(null, rampL) - Math.min.apply(null, rampL));

      out.innerHTML = rows.map(([k, c]) => {
        const rgb2 = hexToRgb(c);
        const onWhite = (contrast(rgb2, { r: 255, g: 255, b: 255 })).toFixed(1);
        const onBlack = (contrast(rgb2, { r: 0, g: 0, b: 0 })).toFixed(1);
        /* put the label in whichever of paper/ink actually reads on this swatch */
        const lc = parseFloat(onWhite) > parseFloat(onBlack) ? '#F1EEE6' : '#0A0A0B';
        const isBase = k === 'BASE';
        return `<button class="tpal__sw${isBase ? ' is-base' : ''}" type="button" data-hex="${c}" style="background:${c};color:${lc}">
          <span class="tpal__k mono">${k}</span>
          <span class="tpal__hex mono">${c}</span>
          <span class="tpal__cr mono">${onWhite} / ${onBlack}</span>
        </button>`;
      }).join('');

      /* say out loud whether this ramp is actually a ramp */
      const verdict = $('#tPalVerdict');
      if (verdict) {
        const cold = spread < 40;
        verdict.innerHTML = `Base sits at step <b>${KEYS[anchor]}</b> · lightness runs <b>${spread}</b> of 100 across the ramp`
          + (cold ? ' · <b class="is-warn">flat — this colour has almost no range to give</b>' : '');
        verdict.classList.toggle('is-flat', cold);
      }

      /* the whole palette as an export block — this is the step everyone does by hand */
      PAL_LAST = rows.map(([k, c]) => ({ step: k, hex: c }))
        .concat([{ step: 'accent', hex: comp }, { step: 'accent-2', hex: analogA }, { step: 'accent-3', hex: analogB }]);

      $('#tPalAccents').innerHTML = [[ACCENT_LABELS[0], comp], [ACCENT_LABELS[1], analogA], [ACCENT_LABELS[2], analogB]]
        .map(([n, c]) => `<button class="tpal__ac" type="button" data-hex="${c}" style="background:${c}">
            <span class="mono">${n}</span><b class="mono">${c}</b></button>`).join('');
    }

    out.parentElement.addEventListener('click', e => {
      const b = e.target.closest('[data-hex]');
      if (b) copy(b.dataset.hex, 'Hex');
    });

    /* the harmony choice was previously hard-coded; make it a decision */
    const harmSel = $('#tPalHarmony');
    const lockBtn = $('#tPalLock');
    if (lockBtn) lockBtn.addEventListener('click', () => {
      const on = lockBtn.getAttribute('aria-pressed') === 'true';
      lockBtn.setAttribute('aria-pressed', on ? 'false' : 'true');
      lockBtn.textContent = on ? 'Lock the base' : 'Base locked';
      if (base) base.disabled = !on;
    });

    const harmEl = $('#tPalHarmony');
    if (harmEl) harmEl.addEventListener('change', () => { render(); });

    /* export the ramp as the three formats you would otherwise retype */
    const cssBtn = $('#tPalCss'), jsonBtn = $('#tPalJson'), tailBtn = $('#tPalTailwind');
    if (cssBtn) cssBtn.addEventListener('click', () => copy(toCss(PAL_LAST), 'CSS variables'));
    if (jsonBtn) jsonBtn.addEventListener('click', () => copy(toJson(PAL_LAST), 'JSON tokens'));
    if (tailBtn) tailBtn.addEventListener('click', () => copy(toTailwind(PAL_LAST), 'Tailwind config'));
    base.addEventListener('input', () => { syncKnob(); render(); });

    /* drag pad: x = hue (0–360), y = saturation (100→12 top to bottom) */
    const pad = $('#tPalDrag'), knob = $('#tPalKnob');
    function paint(p) {
      const h = Math.round(Math.max(0, Math.min(1, p.x)) * 360);
      const sat = Math.round(100 - Math.max(0, Math.min(1, p.y)) * 88);
      const hex = hslToHex(h, sat, 50);
      base.value = hex;
      syncKnob();
      render();
    }
    function syncKnob() {
      const rgb = hexToRgb(base.value);
      if (!rgb || !pad) return;
      const max = Math.max(rgb.r, rgb.g, rgb.b) / 255;
      const min = Math.min(rgb.r, rgb.g, rgb.b) / 255;
      const d = max - min;
      let h = 0;
      if (d !== 0) {
        const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
        h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h *= 60;
      }
      if (h < 0) h += 360;
      const sat = max === 0 ? 0 : d / max;
      knob.style.left = (h / 360 * 100) + '%';
      knob.style.top = (100 - sat / 100 * 88) + '%';
      knob.style.background = base.value;
      pad.setAttribute('aria-valuenow', Math.round(h));
      base.dataset.hue = Math.round(h);
    }

    if (pad) {
      let padDrag = false;
      const posOf = ev => {
        const r = pad.getBoundingClientRect();
        const pt = ev.touches ? ev.touches[0] : ev;
        return {
          x: (pt.clientX - r.left) / r.width,
          y: (pt.clientY - r.top) / r.height
        };
      };
      pad.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        padDrag = true;
        paint(posOf(ev));
      });
      window.addEventListener('pointermove', ev => {
        if (!padDrag) return;
        ev.preventDefault();
        paint(posOf(ev));
      });
      window.addEventListener('pointerup', () => { padDrag = false; });
      /* keyboard: hue by arrows, saturate with shift */
      pad.addEventListener('keydown', ev => {
        const k = ev.key;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(k) < 0) return;
        ev.preventDefault();
        const rgb = hexToRgb(base.value);
        const hue = +(base.dataset.hue || 16);
        if (k === 'ArrowLeft' || k === 'ArrowRight') {
          const nh = (hue + (k === 'ArrowRight' ? 4 : -4) + 360) % 360;
          base.value = hslToHex(nh, satOf(rgb), 50);
        } else {
          const sat = k === 'ArrowUp' ? Math.min(100, satOf(rgb) + 6) : Math.max(0, satOf(rgb) - 6);
          base.value = hslToHex(hue, sat, 50);
        }
        syncKnob(); render();
      });
    }

    function satOf(rgb) {
      if (!rgb) return 100;
      const max = Math.max(rgb.r, rgb.g, rgb.b) / 255;
      const min = Math.min(rgb.r, rgb.g, rgb.b) / 255;
      return max === 0 ? 0 : Math.round((max - min) / max * 100);
    }

    syncKnob();
    render();
  }

  /* ─────────────── 7 · font stack inspector ───────────────
   * You cannot ask the browser "which font did you use?" — but you can measure.
   * Draw the same string in the candidate and in a probe family, compare widths.
   * A candidate that is not installed falls through to the generic, so the widths
   * match; the first candidate that differs from the fallback is the one in play.
   */

  const PROBE = 'mmmmmmmmmmlliWWQ0123456789HHH';

  function widthOf(text, font) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text).width;
  }

  function resolveStack(stack) {
    const families = splitStack(stack);
    if (!families.length) return [];

    /* three generic probes, because a stack may end in serif, sans or mono and each
       has its own fallback metrics — this is how you tell "Arial" from "the default" */
    const generics = ['monospace', 'serif', 'sans-serif'];
    const baseline = {};
    generics.forEach(g => { baseline[g] = widthOf(PROBE, '72px ' + g); });

    const q = f => '"' + f.replace(/"/g, '') + '"';
    return families.map(name => {
      const lower = name.toLowerCase();
      if (generics.indexOf(lower) > -1) return { name, generic: true, resolved: true };
      /* differs in ANY generic -> the face is installed */
      let installed = false;
      generics.forEach(g => {
        if (widthOf(PROBE, '72px ' + q(name) + ', ' + g) !== baseline[g]) installed = true;
      });
      return { name, generic: false, resolved: installed };
    });
  }

  /* a CSS font-family list can contain quoted commas; split on the ones outside quotes */
  function splitStack(str) {
    const out = []; let cur = ''; let quote = null;
    for (const ch of (str || '')) {
      if (ch === '"' || ch === "'") { quote = quote === ch ? null : (quote || ch); cur += ch; continue; }
      if (ch === ',' && !quote) { out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out.map(f => f.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
  }

  function buildFonts() {
    const stackIn = $('#tFontStack');
    if (!stackIn) return;
    const sample = $('#tFontSample'), size = $('#tFontSize'), big = $('#tFontBig');
    const list = $('#tFontList'), resolvedOut = $('#tFontResolved');

    function render() {
      const stack = stackIn.value;
      const text = sample.value || 'Hamburgefonstiv';
      const px = +size.value || 64;
      $('#tFontSizeVal').textContent = px;

      const faces = resolveStack(stack);
      const first = faces.find(f => f.resolved);
      const winner = first ? first.name : (faces.length ? faces[faces.length - 1].name : 'sans-serif');

      /* the big sample uses the stack as written — this is the money shot */
      big.style.fontFamily = stack;
      big.style.fontSize = px + 'px';
      big.textContent = text;

      resolvedOut.innerHTML = faces.length
        ? 'Resolves to <b>' + winner + '</b> on this device'
        : 'Type a font stack to begin';

      /* The question a client actually feels: what happens when the webfont does not
         arrive? Measure the stack as written against the same stack with its webfont
         entries removed, and report the real px shift — not a guess about FOUT. */
      const shiftEl = $('#tFontShift');
      if (shiftEl) {
        const asWritten = widthOf(PROBE, px + 'px ' + (stack || 'sans-serif'));
        const fallbackOnly = faces.length > 1
          ? splitStack(stack).slice(1).map(f => /^[a-z-]+$/.test(f) ? f : '"' + f + '"').join(', ')
          : '';
        const safeOnly = fallbackOnly || 'sans-serif';
        const fallbackW = widthOf(PROBE, px + 'px ' + safeOnly);
        const delta = asWritten - fallbackW;
        const pct = fallbackW ? (delta / fallbackW) * 100 : 0;
        const abs = Math.abs(pct);
        const level = abs < 2 ? 'safe' : abs < 8 ? 'noticeable' : 'reflow';
        const words = { safe: 'no visible shift', noticeable: 'text will visibly re-settle', reflow: 'headlines will reflow — reserve the space' };
        shiftEl.className = 'tfont__shift is-' + level;
        shiftEl.innerHTML = `
          <span class="mono tfont__shift-k">IF THE FONT FAILS</span>
          <b class="mono tfont__shift-v">${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(0)}px · ${abs.toFixed(1)}%</b>
          <span class="mono tfont__shift-w">${words[level]} — measured against <code>${escapeHtml(safeOnly.slice(0, 42))}</code></span>
          <span class="tfont__shift-bar" aria-hidden="true"><i style="width:${Math.min(100, abs * 6)}%"></i></span>`;
      }

      list.innerHTML = faces.map((f, i) => {
        const isWin = f.resolved && f === first;
        return `<li class="tfont__row ${f.resolved ? 'is-ok' : 'is-miss'} ${isWin ? 'is-win' : ''}">
          <span class="tfont__dot" aria-hidden="true"></span>
          <span class="tfont__nm mono">${escapeHtml(f.name)}</span>
          <span class="tfont__tag mono">${f.generic ? 'generic' : f.resolved ? (isWin ? 'in use' : 'installed') : 'missing'}</span>
          <span class="tfont__w mono" title="advance width of the probe text at the current size">${Math.round(widthOf(PROBE, px + 'px ' + (f.generic ? f.name : "'" + f.name.replace(/'/g, '') + "'"))) }px</span>
          <span class="tfont__prev" style="font-family:${f.generic ? f.name : "'" + f.name.replace(/'/g, '') + "', " + (f.name.match(/serif$/i) && !/sans/i.test(f.name) ? 'serif' : 'sans-serif')}">${escapeHtml(text.slice(0, 22))}</span>
        </li>`;
      }).join('');
    }

    [stackIn, sample].forEach(i => i && i.addEventListener('input', render));
    size.addEventListener('input', render);
    big.addEventListener('input', () => { sample.value = big.textContent; render(); });
    render();

    /* the first pass can run before a webfont has arrived, which would report the
       site's own typeface as "missing". Re-measure once fonts settle. */
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(render);
      document.fonts.addEventListener('loadingdone', render);
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }


  /* ─────────────── 5 · press check ─────────────── */

  function buildPress() {
    const input = $('#tPrFile');
    if (!input) return;
    const drop = $('#tPrDrop'), canvas = $('#tPrCanvas'), empty = $('#tPrEmpty');
    const stats = $('#tPrStats'), paperSel = $('#tPrPaper');
    const tacIn = $('#tPrTac'), tacVal = $('#tPrTacVal');
    const gamutChk = $('#tPrGamut'), viewChk = $('#tPrView');

    let SRC = null;   /* {data,w,h} of the sampled artwork */
    let LAST = null;  /* last computed result, for re-paints that skip the maths */

    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
      e.preventDefault(); drop.classList.add('is-over');
    }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
      e.preventDefault(); drop.classList.remove('is-over');
    }));
    drop.addEventListener('drop', e => {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) load(f);
    });
    input.addEventListener('change', () => { if (input.files[0]) load(input.files[0]); });

    function load(file) {
      if (!/^image\//.test(file.type)) { empty.textContent = 'That is not an image file.'; return; }
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => {
        URL.revokeObjectURL(url);
        /* sample by area so a 6000px file does not lock up a phone */
        const AREA = 140000;
        const k = Math.min(1, Math.sqrt(AREA / (im.naturalWidth * im.naturalHeight)));
        const W = Math.max(1, Math.round(im.naturalWidth * k));
        const H = Math.max(1, Math.round(im.naturalHeight * k));
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(im, 0, 0, W, H);
        SRC = { data: cx.getImageData(0, 0, W, H).data, w: W, h: H };
        empty.hidden = true;
        paint();
      };
      im.onerror = () => { empty.hidden = false; empty.textContent = 'That file could not be decoded.'; };
      im.src = url;
    }

    function paint() {
      if (!SRC) { updateStats(); return; }
      const paper = PAPER_PROFILES[paperSel.value] || PAPER_PROFILES.coated;
      const tacLimit = Math.min(paper.tac, (+tacIn.value || 300)) / 100;
      const showGamut = gamutChk.checked, showProof = viewChk.checked;
      const { data, w, h } = SRC;

      /* size the visible canvas to the real aspect, capped so a phone stays responsive */
      const MAXW = 760;
      const scale = Math.min(1, MAXW / w);
      const VW = Math.round(w * scale), VH = Math.round(h * scale);
      canvas.width = VW; canvas.height = VH;
      const ctx = canvas.getContext('2d');
      const out = ctx.createImageData(VW, VH);

      /* a coarse Lab hue histogram: 12 wedges × 3 lightness bands. This is what turns
         "some colours will shift" into "your greens, specifically". */
      const family = {};
      let outCount = 0, visCount = 0, tacCount = 0, total = 0, worstDE = 0, sumDE = 0;
      const worstSeen = new Map();

      for (let y = 0; y < VH; y++) {
        const sy = Math.min(h - 1, Math.floor(y / scale));
        for (let x = 0; x < VW; x++) {
          const sx = Math.min(w - 1, Math.floor(x / scale));
          const si = (sy * w + sx) * 4;
          const r = data[si], g = data[si + 1], b = data[si + 2];

          const ink = decomposeInk(r, g, b, tacLimit);
          /* what those plates actually lay down, through impure inks */
          const sim = inkToRgb(ink.c, ink.m, ink.y, ink.k);

          /* dot gain: midtones darken most, and the stock casts slightly warm */
          const gain = paper.dotGain;
          const mid = v => {
            const t = Math.max(0, Math.min(1, v / 255));
            return v - t * (1 - t) * 4 * gain * 255 * 0.55;
          };
          const sr = Math.max(0, Math.min(255, mid(sim.r) + paper.cast[0]));
          const sg = Math.max(0, Math.min(255, mid(sim.g) + paper.cast[1]));
          const sb = Math.max(0, Math.min(255, mid(sim.b) + paper.cast[2]));

          /* The gamut test compares the file against what the INK can do. Dot gain
             and paper cast are applied afterwards, for the proof only — folding them
             in here would double-count them and call every dark tone unprintable. */
          const srcLab = srgbToLab(r, g, b);
          const dE = deltaE(srcLab, srgbToLab(sim.r, sim.g, sim.b));
          const isOut = dE > DE_OUT;
          const isVisible = dE > DE_VISIBLE;

          total++;
          sumDE += dE;
          if (dE > worstDE) worstDE = dE;
          if (isVisible) visCount++;
          if (isOut) outCount++;
          /* Histogram and chip list are driven by VISIBLE shift, not by "outside"
             shift, so the report can still name where the damage is on artwork that
             is merely on the edge rather than hopeless. */
          if (isVisible) {
            const fam = hueFamily(srcLab);
            family[fam] = (family[fam] || 0) + 1;
            const key = (r >> 4) + ',' + (g >> 4) + ',' + (b >> 4);
            const prev = worstSeen.get(key);
            if (!prev || dE > prev.dE) {
              worstSeen.set(key, {
                r, g, b, dE,
                hex: '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase(),
                print: '#' + [sr, sg, sb].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()
              });
            }
          }
          if (ink.clamped) tacCount++;

          const oi = (y * VW + x) * 4;
          let R = showProof ? sr : r, G = showProof ? sg : g, B = showProof ? sb : b;

          if (showGamut && isOut) {
            /* red wash that keeps the original colour readable underneath */
            R = R * 0.35 + 228 * 0.65; G = G * 0.35; B = B * 0.35;
          } else if (showGamut && isVisible) {
            /* amber for the honest middle ground: this colour prints, but not as the
               colour you see. Without this band the overlay would be empty on almost
               every real file, which would read as "no problems" — untrue. */
            const k2 = Math.min(1, (dE - DE_VISIBLE) / (DE_OUT - DE_VISIBLE));
            const amt = 0.18 + k2 * 0.42;
            R = R * (1 - amt) + 242 * amt;
            G = G * (1 - amt) + 169 * amt;
            B = B * (1 - amt) + 59 * amt;
          } else if (ink.clamped) {
            /* hatch the areas where ink had to be pulled back to stay printable */
            const stripe = (((x >> 2) + (y >> 2)) % 2);
            const amt = stripe ? 0.55 : 0.18;
            R = R * (1 - amt) + 24 * amt; G = G * (1 - amt) + 24 * amt; B = B * (1 - amt) + 96 * amt;
          }

          out.data[oi] = R; out.data[oi + 1] = G; out.data[oi + 2] = B;
          out.data[oi + 3] = 255;
        }
      }
      ctx.putImageData(out, 0, 0);

      LAST = {
        total, outCount, visCount, tacCount,
        src: SRC,
        pctOut: total ? outCount / total * 100 : 0,
        pctVis: total ? visCount / total * 100 : 0,
        pctTac: total ? tacCount / total * 100 : 0,
        avgDE: total ? sumDE / total : 0,
        worstDE, family,
        worst: [...worstSeen.values()].sort((a, b) => b.dE - a.dE).slice(0, 5)
      };
      updateStats();
    }

    function updateStats() {
      const tacLimit = Math.round(Math.min((PAPER_PROFILES[paperSel.value] || PAPER_PROFILES.coated).tac, (+tacIn.value || 300)));
      tacVal.textContent = tacLimit;
      if (!LAST) {
        stats.innerHTML = '<p class="tpress__wait mono">Load artwork to measure it.</p>';
        return;
      }
      const vis = LAST.pctVis, pct = LAST.pctOut;

      /* The headline is the share that will visibly move on paper, because that is
         the number that always exists. "Beyond any ink match" is the sharper failure
         and is reported underneath, but on ordinary brand artwork it is often zero —
         so it would be a misleading thing to lead with. */
      const cls = vis > 60 && pct > 25 ? 'is-bad'
        : vis > 35 || pct > 8 ? 'is-warn' : 'is-ok';
      const verdict = cls === 'is-bad'
        ? 'This will disappoint you on paper — most of the colour moves, and much of it has no ink equivalent at all'
        : cls === 'is-warn'
          ? 'Mostly safe — a noticeable share will shift, and the list below says which'
          : 'Safe to send — what shifts here is inside normal press tolerance';

      const top = Object.keys(LAST.family)
        .map(name => ({ n: LAST.family[name], name }))
        .sort((a, b) => b.n - a.n).slice(0, 2);

      stats.innerHTML = `
        <div class="tpress__verdict ${cls}">
          <b class="mono">${vis.toFixed(1)}% shifts visibly</b>
          <span>${verdict}</span>
        </div>
        <div class="tpress__row"><span>Average shift</span><b>ΔE ${LAST.avgDE.toFixed(1)} · worst ${LAST.worstDE.toFixed(1)}</b></div>
        <div class="tpress__row"><span>Over the ${tacLimit}% ink limit</span><b>${LAST.pctTac.toFixed(1)}%</b></div>
        <div class="tpress__row"><span>Where it hurts</span><b>${top.length ? top.map(t => t.name + ' ' + Math.round(t.n / Math.max(1, LAST.visCount) * 100) + '%').join(' · ') : 'nowhere — nothing shifts'}</b></div>
        ${LAST.worst.length ? `<div class="tpress__worst">
          <p class="mono tpress__worst-h">The five colours that move most</p>
          ${LAST.worst.map(c => `<div class="tpress__chip">
            <i style="--c:${c.hex}"></i>
            <span class="tpress__arrow mono">→</span>
            <i style="--c:${c.print}"></i>
            <b class="mono">${c.hex} prints ${c.print}</b>
            <span class="mono">ΔE ${c.dE.toFixed(1)}</span></div>`).join('')}
        </div>` : ''}`;
    }

    /* Eyedropper: read the ink build under a pixel in the artwork. This is the bit a
       designer actually needs when a printer says "your black is 320%". */
    canvas.addEventListener('click', e => {
      if (!LAST || !LAST.src) return;
      const r = canvas.getBoundingClientRect();
      const px = Math.floor((e.clientX - r.left) / r.width * canvas.width);
      const py = Math.floor((e.clientY - r.top) / r.height * canvas.height);
      const { data, w, h } = LAST.src;
      const sx = Math.min(w - 1, Math.floor(px / canvas.width * w));
      const sy = Math.min(h - 1, Math.floor(py / canvas.height * h));
      const i = (sy * w + sx) * 4;
      const R = data[i], G = data[i + 1], B = data[i + 2];
      const paper = PAPER_PROFILES[paperSel.value] || PAPER_PROFILES.coated;
      const tacLimit = Math.min(paper.tac, (+tacIn.value || 300)) / 100;
      const ink = decomposeInk(R, G, B, tacLimit);
      const sim = inkToRgb(ink.c, ink.m, ink.y, ink.k);
      const dE = deltaE(srgbToLab(R, G, B), srgbToLab(sim.r, sim.g, sim.b));
      const hex = '#' + [R, G, B].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
      const pc = v => Math.round(v * 100) + '%';
      const eye = $('#tPrEye');
      if (!eye) return;
      eye.innerHTML = `<b>${hex}</b> at (${sx}, ${sy}) · `
        + `C ${pc(ink.c)} M ${pc(ink.m)} Y ${pc(ink.y)} K ${pc(ink.k)} · `
        + `${Math.round(ink.tac * 100)}% total ink`
        + `${ink.clamped ? ' <b>— pulled back to stay printable</b>' : ''} · ΔE ${dE.toFixed(1)}`;
    });

    if (tacIn) tacIn.addEventListener('input', paint);
    [paperSel, gamutChk, viewChk].forEach(el => el && el.addEventListener('change', () => {
      if (el === paperSel || el === viewChk) paint(); else repaintOnly();
    }));

    /* toggling the gamut overlay does not change the measurement, so skip the maths */
    function repaintOnly() { if (SRC) paint(); }
  }
  
  /* ─────────────── 8 · image auditor ───────────────
   * Real measurements off a real canvas: dimensions, effective DPI at a chosen print
   * size, alpha presence, ink coverage, and a noise estimate from neighbouring-pixel
   * deltas. All local.
   */

  /* ─────────────── press check: RGB → CMYK with a real gamut test ───────────────
   * There is no ICC profile in a single JS file, so this does the honest thing instead
   * of pretending to be Photoshop. Process inks are not pure: magenta ink absorbs some
   * green, cyan absorbs some blue. That impurity is the entire reason a screen's neon
   * green and electric blue are unprintable, so the model below encodes it directly.
   * Every pixel is decomposed to ink, re-composed through the impure ink, then compared
   * to the original in CIE Lab. The gap is a real ΔE, not a guess.
   */

  const PAPER_PROFILES = {
    /* dot gain and how much the stock drinks ink — why the same file looks different
       on silk and on newsprint. tac is a percentage, the way a printer quotes it. */
    coated:    { dotGain: 0.10, tac: 300, cast: [0, 0, 0] },
    uncoated:  { dotGain: 0.18, tac: 275, cast: [2, 1, -3] },
    newsprint: { dotGain: 0.26, tac: 240, cast: [6, 2, -9] }
  };

  /* how much each ink pollutes the other two channels: [M→R, Y→R, C→G, Y→G, C→B, M→B] */
  const INK_CROSSTALK = [0.065, 0.015, 0.06, 0.011, 0.035, 0.035];

  function inkToRgb(c, m, y, k) {
    const a = INK_CROSSTALK;
    return {
      r: (1 - c) * (1 - a[0] * m) * (1 - a[1] * y) * (1 - k) * 255,
      g: (1 - m) * (1 - a[2] * c) * (1 - a[3] * y) * (1 - k) * 255,
      b: (1 - y) * (1 - a[4] * c) * (1 - a[5] * m) * (1 - k) * 255
    };
  }

  /* sRGB → linear → CIE XYZ (D65) → Lab, for the difference measurement */
  function srgbToLab(r, g, b) {
    const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const R = f(r), G = f(g), B = f(b);
    let X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047;
    let Y = (0.2126 * R + 0.7152 * G + 0.0722 * B);
    let Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
    const g2 = t => t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116);
    X = g2(X); Y = g2(Y); Z = g2(Z);
    return { L: 116 * Y - 16, a: 500 * (X - Y), b: 200 * (Y - Z) };
  }

  /* RGB → ink, with grey-component replacement and a total-ink clamp, the way a RIP
     actually builds a separation. GCR matters: without it dark neutrals are printed
     as three heavy plates and look like wet mud. */
  function decomposeInk(r, g, b, tacLimit) {
    const rr = r / 255, gg = g / 255, bb = b / 255;
    const k = 1 - Math.max(rr, gg, bb);
    let c = 0, m = 0, y = 0;
    if (k < 1) {
      c = (1 - rr - k) / (1 - k);
      m = (1 - gg - k) / (1 - k);
      y = (1 - bb - k) / (1 - k);
    }
    const gcr = Math.min(c, m, y) * 0.55;
    c -= gcr; m -= gcr; y -= gcr;
    let kk = Math.min(1, k + gcr);
    let tac = c + m + y + kk;
    let clamped = false;
    if (tac > tacLimit) {
      const sc = tacLimit / tac;
      c *= sc; m *= sc; y *= sc; kk = Math.min(1, kk * sc);
      tac = tacLimit; clamped = true;
    }
    return { c, m, y, k: kk, tac, clamped };
  }


  /* Named hue families using the boundaries the Lab angles above actually produce
     (blue sits near 300°, cyan near 196°, green near 144°). Neutrals are pulled out
     separately — a failing grey is not a "violet", and saying so would be a lie. */
  const HUE_FAMILIES = [
    [345, 'magenta'], [315, 'violet'], [285, 'blue'], [255, 'sky blue'],
    [215, 'azure'], [185, 'cyan'], [160, 'teal'], [120, 'green'],
    [85, 'yellow-green'], [55, 'yellow'], [25, 'orange'], [0, 'red']
  ];

  function hueFamily(lab) {
    const chroma = Math.hypot(lab.a, lab.b);
    if (chroma < 12) return 'neutral';
    const hue = (Math.atan2(lab.b, lab.a) * 180 / Math.PI + 360) % 360;
    for (let i = 0; i < HUE_FAMILIES.length; i++) {
      const [edge, name] = HUE_FAMILIES[i];
      const prev = i === 0 ? 360 : HUE_FAMILIES[i - 1][0];
      if (hue >= edge || i === HUE_FAMILIES.length - 1) {
        if (i === HUE_FAMILIES.length - 1 && hue < edge) break;
        return name;
      }
    }
    return 'red';
  }

  /* ΔE tolerances taken from print practice, not invented: under about 5 is inside
     normal commercial tolerance (ISO 12647 proof checks work to ΔE 5), 5–10 is a
     shift you will notice on a proof, above 10 the ink simply will not match. */
  const DE_VISIBLE = 5;
  const DE_OUT = 10;

  function deltaE(x, y) {
    return Math.sqrt(Math.pow(x.L - y.L, 2) + Math.pow(x.a - y.a, 2) + Math.pow(x.b - y.b, 2));
  }

  function buildAudit() {
    const input = $('#tAudFile');
    if (!input) return;
    const drop = $('#tAudDrop'), out = $('#tAudOut'), facts = $('#tAudFacts');
    const note = $('#tAudNote'), img = $('#tAudImg');

    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
      e.preventDefault(); drop.classList.add('is-over');
    }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
      e.preventDefault(); drop.classList.remove('is-over');
    }));
    drop.addEventListener('drop', e => {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) audit(f);
    });
    input.addEventListener('change', () => { if (input.files[0]) audit(input.files[0]); });

    function audit(file) {
      if (!/^image\//.test(file.type)) { note.textContent = 'That is not an image file.'; return; }
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const w = img.naturalWidth, h = img.naturalHeight;

        /* sample by area, not by width: a 4000×6000 phone photo should not become a
           320×480 canvas with 230k samples to walk on a mid-range Android */
        const AREA = 90000;
        const k = Math.min(1, Math.sqrt(AREA / (w * h)));
        const SW = Math.max(1, Math.round(w * k)), SH = Math.max(1, Math.round(h * k));
        const c = document.createElement('canvas');
        c.width = SW; c.height = SH;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, SW, SH);
        const d = ctx.getImageData(0, 0, SW, SH).data;

        let alpha = 0, black = 0, white = 0, opaque = 0, noise = 0, n = 0;
        const total = SW * SH;
        const lum = new Float32Array(total);
        for (let i = 0, p = 0; i < d.length; i += 4, p++) {
          const a = d[i + 3];
          const isClear = a < 250;
          if (isClear) alpha++; else opaque++;
          /* luminance only means something on pixels that actually have ink;
             a transparent PNG must not be scored as 100% black */
          const L = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
          lum[p] = isClear ? -1 : L;
          if (!isClear) { if (L < 8) black++; if (L > 247) white++; }
        }
        /* horizontal neighbour delta, normalised — a proxy for how much of the file
           is spent on grain rather than edges */
        for (let y = 0; y < SH; y++) {
          for (let x = 1; x < SW; x++) {
            const i = y * SW + x;
            if (lum[i] < 0 || lum[i - 1] < 0) continue;
            noise += Math.abs(lum[i] - lum[i - 1]); n++;
          }
        }
        const noiseAvg = n ? noise / n : 0;
        const solid = Math.max(1, opaque);
        const ink = 1 - (black + white) / solid;

        const kb = file.size / 1024;
        const bpp = (file.size * 8) / (w * h);
        const hasAlpha = alpha > 0;
        const isFlat = noiseAvg < 3;

        /* effective DPI: how dense this pixel count is when printed at a given size */
        const dpiAt = mm => Math.round(w / (mm / 25.4));
        const A4px = Math.ceil(210 / 25.4 * 300);
        const A5px = Math.ceil(148 / 25.4 * 300);
        const printUse = w >= A4px ? 'Print-ready at A4 (300 dpi)'
          : w >= A5px ? 'Print-ready at A5 only'
          : 'Screen only — printing this at A4 gives ' + dpiAt(210) + ' dpi';

        /* same ink engine as the press check: a file that is 40MP but unprintable
           is a worse file than a 2MP one that prints, and only this line says so */
        let gamutNote = 'clean — sampled colours print as they look';
        try {
          let out = 0, seen = 0;
          for (let i = 0; i < d.length; i += 4 * 37) {   /* strided sample, fast */
            const r = d[i], g = d[i + 1], b = d[i + 2], a2 = d[i + 3];
            if (a2 < 250) continue;
            const ink = decomposeInk(r, g, b, 3.0);
            const sim = inkToRgb(ink.c, ink.m, ink.y, ink.k);
            if (deltaE(srgbToLab(r, g, b), srgbToLab(sim.r, sim.g, sim.b)) > DE_VISIBLE) out++;
            seen++;
          }
          const pct = seen ? out / seen * 100 : 0;
          gamutNote = pct < 0.5 ? 'clean — sampled colours print as they look'
            : pct.toFixed(1) + '% of sampled pixels will shift on press';
        } catch (err) { /* never let this break the rest of the report */ }

        const rows = [
          ['Dimensions', w + ' × ' + h + ' px'],
          ['Format', (file.type || 'unknown').replace('image/', '').toUpperCase() + ' · ' + (file.name || '')],
          ['File size', kb < 1024 ? kb.toFixed(0) + ' KB' : (kb / 1024).toFixed(2) + ' MB'],
          ['Bits per pixel', bpp.toFixed(2) + '  ·  ' + (bpp > 1.5 ? 'generous for screen' : bpp < 0.25 ? (isFlat ? 'light — flat art, expected' : 'heavy compression') : 'reasonable')],
          ['Effective DPI · A4', dpiAt(210) + ' dpi' + (dpiAt(210) >= 300 ? ' ✓' : ' ✕ needs ' + Math.ceil(210 / 25.4 * 300) + 'px wide')],
          ['Effective DPI · A5', dpiAt(148) + ' dpi'],
          ['On a 1080 canvas', w === 1080 ? 'exact fit' : w > 1080 ? Math.round(w / 1080 * 100) + '% — downscales cleanly' : 'upscales ' + (1080 / w).toFixed(1) + '× — will soften'],
          ['Transparency', hasAlpha ? 'Yes — ' + Math.round(alpha / total * 100) + '% clear' : 'None (opaque)'],
          ['Tone spread', Math.round(ink * 100) + '% midtone · ' + Math.round(black / solid * 100) + '% black · ' + Math.round(white / solid * 100) + '% white'],
          ['Grain / noise index', noiseAvg.toFixed(1) + ' ' + (noiseAvg > 14 ? '— heavy, likely re-saved or upscaled' : noiseAvg > 4 ? '— normal photographic texture' : '— clean, flat or vector-like')],
          ['Ink check', gamutNote],
          ['Verdict', printUse]
        ];

        facts.innerHTML = rows.map(([k, v], i) =>
          '<div class="taud__row' + (i === rows.length - 1 ? ' taud__row--verdict' : '') + '"><span>' + k + '</span><b>' + escapeHtml(v) + '</b></div>'
        ).join('');
        out.hidden = false;
        note.textContent = 'Read in memory — ' + (file.name || 'image') + ' was never uploaded.';

        /* ── what would a real export look like? re-encode in the browser and
              show the size + quality cost side by side, live. ── */
        const cmp = $('#tAudCmp');
        if (cmp) {
          cmp.hidden = false;
          const canvas = $('#tAudCmpCanvas');
          const ctx2 = canvas.getContext('2d');
          canvas.width = w; canvas.height = h;
          ctx2.drawImage(img, 0, 0);
          const slider = $('#tAudQ'), qVal = $('#tAudQVal');
          const jpgOut = $('#tAudJpgSize'), pngOut = $('#tAudPngSize'), save = $('#tAudSave');

          function encode(type, q) {
            return new Promise(res => canvas.toBlob(res, type, q));
          }

          async function update() {
            const q = +slider.value / 100;
            qVal.textContent = Math.round(q * 100) + '%';
            const jpg = await encode('image/jpeg', q);
            const png = await encode('image/png');
            const fmt = b => b < 1024 * 1024 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(2) + ' MB';
            const delta = ((jpg.size - file.size) / file.size) * 100;
            jpgOut.textContent = fmt(jpg.size);
            pngOut.textContent = fmt(png.size);
            save.textContent = (delta <= 0 ? '−' : '+') + Math.abs(delta).toFixed(0) + '% vs the original';
            save.className = 'taud__save ' + (delta <= 0 ? 'is-pass' : 'is-fail');
            cmp.dataset.jpgSize = jpg.size;
          }

          slider.addEventListener('input', update);
          update();

          const dl = $('#tAudDownload');
          if (dl) dl.addEventListener('click', () => {
            canvas.toBlob(blob => {
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              const base = (file.name || 'image').replace(/\.[^.]+$/, '');
              a.download = base + '-q' + slider.value + '.jpg';
              document.body.appendChild(a); a.click(); a.remove();
              setTimeout(() => URL.revokeObjectURL(a.href), 4000);
              toast('Saved ' + a.download);
            }, 'image/jpeg', +slider.value / 100);
          });
        }
      };
      img.onerror = () => { note.textContent = 'That file could not be decoded as an image.'; URL.revokeObjectURL(url); };
      img.src = url;
    }
  }

  /* ─────────────── 9 · lockup exporter ───────────────
   * Writes real SVG text: no <img> wrapper, no raster, no watermark. Type is set in
   * a generic stack so the file opens anywhere and is still selectable/outlineable
   * in Illustrator.
   */

  const LOCKUPS = [
    { id: 'primary', label: 'Primary — stacked', mode: 'stacked' },
    { id: 'horizontal', label: 'Horizontal', mode: 'horizontal' },
    { id: 'mark', label: 'Mark only', mode: 'mark' },
    { id: 'inverse', label: 'Inverse (on ink)', mode: 'stacked', inverse: true }
  ];

  function markSvg(kind, cx, cy, r, ink, opt) {
    const s = 'fill="none" stroke="' + ink + '" stroke-width="' + (r * 0.22).toFixed(2) + '"';
    switch (kind) {
      case 'circle':
        return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + ink + '"/>';
      case 'ring':
        return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.78).toFixed(2) + '" ' + s + '/>';
      case 'square':
        return '<rect x="' + (cx - r * 0.85).toFixed(2) + '" y="' + (cy - r * 0.85).toFixed(2) + '" width="' + (r * 1.7).toFixed(2) + '" height="' + (r * 1.7).toFixed(2) + '" fill="' + ink + '"/>';
      case 'arc':
        return '<path d="M ' + (cx - r).toFixed(2) + ' ' + (cy + r * 0.5).toFixed(2) + ' A ' + r + ' ' + r + ' 0 0 1 ' + (cx + r).toFixed(2) + ' ' + (cy + r * 0.5).toFixed(2) + '" ' + s + ' stroke-linecap="round"/>';
      case 'initial':
        return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + ink + '"/>' +
          initialMark(opt.name, cx, cy, r, opt.inverse ? opt.ink : '#F1EEE6', opt.weight || 600);
      case 'monogram':
        return '<rect x="' + (cx - r).toFixed(2) + '" y="' + (cy - r).toFixed(2) + '" width="' + (r * 2).toFixed(2) + '" height="' + (r * 2).toFixed(2) + '" rx="' + (r * 0.34).toFixed(2) + '" fill="' + ink + '"/>' +
          initialMark(opt.name, cx, cy, r, opt.inverse ? opt.ink : '#F1EEE6', opt.weight || 600);
      case 'bars':
        return [0, 1, 2].map(i =>
          '<rect x="' + (cx - r).toFixed(2) + '" y="' + (cy - r + i * r * 0.72).toFixed(2) + '" width="' + (r * 2).toFixed(2) + '" height="' + (r * 0.4).toFixed(2) + '" fill="' + ink + '"/>'
        ).join('');
      default:
        return '';
    }
  }

  /* A mark built from the mark's own initials, as real SVG paths would be.
     We measure the letters in the same stack the SVG will use, so the geometry
     in the file matches what the preview shows. */
  function initialMark(name, cx, cy, r, ink, weight) {
    const letter = (name || 'B').trim().charAt(0).toUpperCase() || 'B';
    const c = document.createElement('canvas').getContext('2d');
    const fs = r * 1.45;
    c.font = weight + ' ' + fs + 'px "Helvetica Neue", Helvetica, Arial, sans-serif';
    const w = c.measureText(letter).width;
    return '<text x="' + cx + '" y="' + (cy + fs * 0.36) + '" text-anchor="middle" ' +
      'font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="' + weight + '" ' +
      'font-size="' + fs.toFixed(1) + '" fill="' + ink + '">' + escapeHtml(letter) + '</text>';
  }

  function lockupSvg(opt) {
    const W = 1000, H = 1000;
    const ink = opt.inverse ? '#F1EEE6' : opt.ink;
    const bg = opt.inverse ? '<rect width="1000" height="1000" fill="' + opt.ink + '"/>' : '';
    const name = escapeHtml(opt.name || 'Brand');
    const tag = opt.tagline ? escapeHtml(opt.tagline) : '';
    const cx = W / 2;

    const weight = opt.weight || 600;
    const track = opt.track != null ? opt.track : -4;
    let body = '';
    if (opt.mode === 'stacked') {
      const markY = tag ? 330 : 380;
      body =
        markSvg(opt.mark, cx, markY, 78, ink, opt) +
        '<text x="' + cx + '" y="' + (markY + 190) + '" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="' + weight + '" font-size="112" letter-spacing="' + track + '" fill="' + ink + '">' + name + '</text>' +
        (tag ? '<text x="' + cx + '" y="' + (markY + 252) + '" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="34" letter-spacing="6" fill="' + ink + '" opacity=".7">' + tag.toUpperCase() + '</text>' : '');
    } else if (opt.mode === 'horizontal') {
      body =
        markSvg(opt.mark, 150, H / 2, 64, ink, opt) +
        '<text x="270" y="' + (H / 2 + 4) + '" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="' + weight + '" font-size="96" letter-spacing="' + track + '" fill="' + ink + '">' + name + '</text>' +
        (tag ? '<text x="272" y="' + (H / 2 + 58) + '" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="28" letter-spacing="5" fill="' + ink + '" opacity=".7">' + tag.toUpperCase() + '</text>' : '');
    } else {
      body = markSvg(opt.mark, cx, H / 2, 190, ink, opt) || '<text x="' + cx + '" y="' + (H / 2 + 40) + '" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="' + weight + '" font-size="200" fill="' + ink + '">' + name.slice(0, 1) + '</text>';
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' +
      '<title>' + name + ' — ' + opt.label + '</title>' + bg + body + '</svg>';
  }

  function buildLockup() {
    const nameIn = $('#tlkName');
    if (!nameIn) return;
    const tagIn = $('#tlkTag'), markIn = $('#tlkMark'), inkIn = $('#tlkInk');
    const stage = $('#tlkStage'), allBtn = $('#tlkAll');

    const wIn = $('#tlkWeight'), tIn = $('#tlkTrack');

    function opts() {
      return {
        name: nameIn.value || 'Brand', tagline: tagIn.value,
        mark: markIn.value, ink: inkIn.value,
        weight: wIn ? +wIn.value : 600,
        track: tIn ? +tIn.value : -4
      };
    }

    function render() {
      const o = opts();
      if (wIn) $('#tlkWeightVal').textContent = o.weight;
      if (tIn) $('#tlkTrackVal').textContent = o.track > 0 ? '+' + o.track : '−' + Math.abs(o.track);
      stage.innerHTML = LOCKUPS.map(l => {
        const conf = Object.assign({}, o, l);
        const svg = lockupSvg(conf);
        return '<figure class="tlk__fig' + (l.inverse ? ' tlk__fig--dark' : '') + '">' +
          '<div class="tlk__prev">' + svg + '</div>' +
          '<figcaption class="mono"><span>' + l.label + '</span>' +
          '<button type="button" class="tlk__dl" data-lk="' + l.id + '">SVG ↓</button></figcaption>' +
          '</figure>';
      }).join('');
    }

    function download(svg, filename) {
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }

    stage.addEventListener('click', e => {
      const b = e.target.closest('[data-lk]');
      if (!b) return;
      const l = LOCKUPS.find(x => x.id === b.dataset.lk);
      const o = Object.assign({}, opts(), l);
      const slug = (o.name || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      download(lockupSvg(o), slug + '-' + l.id + '.svg');
      toast('Saved ' + slug + '-' + l.id + '.svg');
    });

    allBtn.addEventListener('click', () => {
      const o = opts();
      const slug = (o.name || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      LOCKUPS.forEach((l, i) => setTimeout(() => {
        download(lockupSvg(Object.assign({}, o, l)), slug + '-' + l.id + '.svg');
      }, i * 320));
      toast('Saving four SVGs — allow multiple downloads');
    });

    [nameIn, tagIn, inkIn, wIn, tIn].forEach(i => {
      if (!i) return;
      i.addEventListener('input', render);
      i.addEventListener('change', render);
    });
    markIn.addEventListener('change', render);
    render();
  }


  /* ─────────────── A · colours really in an image ───────────────
   * Median-cut over a sampled canvas. This is the thing a colour picker cannot do:
   * it names the colours that dominate the picture rather than one pixel you hit.
   */

  function medianCut(pixels, count) {
    let boxes = [pixels];
    while (boxes.length < count) {
      /* split the box with the widest channel range — and only boxes big enough
         to be worth splitting, or we end up with the same colour twice */
      let target = -1, bestRange = 0, bestCh = 'r';
      boxes.forEach((bx, i) => {
        if (bx.length < 2) return;
        /* weight by population: a big flat area deserves to be split over two
           pixels of noise */
        ['r', 'g', 'b'].forEach(ch => {
          let lo = 255, hi = 0;
          for (const p of bx) { if (p[ch] < lo) lo = p[ch]; if (p[ch] > hi) hi = p[ch]; }
          const range = (hi - lo);
          if (range > bestRange) { bestRange = range; target = i; bestCh = ch; }
        });
      });
      if (target < 0 || bestRange < 8) break;
      const box = boxes[target].slice().sort((a, b) => a[bestCh] - b[bestCh]);
      const mid = Math.floor(box.length / 2);
      /* don't split off an empty half */
      if (mid === 0 || mid >= box.length) break;
      boxes.splice(target, 1, box.slice(0, mid), box.slice(mid));
    }
    /* merge boxes that average to (nearly) the same colour, so the result is
       genuinely distinct colours rather than duplicates */
    const raw = boxes.filter(b => b.length).map(bx => {
      let r = 0, g = 0, b = 0;
      for (const p of bx) { r += p.r; g += p.g; b += p.b; }
      const n = bx.length;
      return { hex: rgbToHex(r / n, g / n, b / n), share: n / pixels.length, n };
    });

    /* Collapse near-duplicates, but never below the number asked for: widen the
       "near enough" threshold only as far as needed to make room. */
    const sorted = raw.slice().sort((a, b) => b.share - a.share);
    let merged = [];
    for (const thresh of [18, 34, 52, 74]) {
      merged = [];
      sorted.forEach(col => {
        const rgb = hexToRgb(col.hex);
        const near = merged.find(m => {
          const c = hexToRgb(m.hex);
          return Math.abs(c.r - rgb.r) + Math.abs(c.g - rgb.g) + Math.abs(c.b - rgb.b) < thresh;
        });
        if (near) { near.share += col.share; near.n += col.n; }
        else merged.push(Object.assign({}, col));
      });
      if (merged.length >= count) break;
    }
    return merged.slice(0, count);
  }

  let LAST_PIXELS = null, LAST_META = null;

  function buildExtract() {
    const input = $('#txFile');
    if (!input) return;
    const drop = $('#txDrop'), out = $('#txOut'), wrap = $('#txSwatches'), note = $('#txNote');
    const img = $('#txImg');
    const countIn = $('#txCount'), countVal = $('#txCountVal'), sortIn = $('#txSort');

    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', e => {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) go(f);
    });
    input.addEventListener('change', () => { if (input.files[0]) go(input.files[0]); });

    function go(file) {
      if (!/^image\//.test(file.type)) { note.textContent = 'That is not an image.'; return; }
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const w = img.naturalWidth, h = img.naturalHeight;
        const AREA = 40000;
        const k = Math.min(1, Math.sqrt(AREA / (w * h)));
        const SW = Math.max(1, Math.round(w * k)), SH = Math.max(1, Math.round(h * k));
        const c = document.createElement('canvas');
        c.width = SW; c.height = SH;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, SW, SH);
        const d = ctx.getImageData(0, 0, SW, SH).data;

        const px = [];
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 24) continue;              /* ignore transparent */
          px.push({ r: d[i] & 0xF8, g: d[i + 1] & 0xF8, b: d[i + 2] & 0xF8 });
        }
        if (!px.length) { note.textContent = 'That image is fully transparent.'; return; }

        LAST_PIXELS = px;
        LAST_META = { w, h, name: file.name || 'image', size: file.size };
        $('#txImgMeta').textContent = w + ' × ' + h + ' px · ' + (file.size / 1024).toFixed(0) + ' KB';
        out.hidden = false;
        paint();
      };
      img.onerror = () => { note.textContent = 'That file could not be decoded.'; URL.revokeObjectURL(url); };
      img.src = url;
    }

    function hueOf(hex) {
      const c = hexToRgb(hex);
      const mx = Math.max(c.r, c.g, c.b) / 255, mn = Math.min(c.r, c.g, c.b) / 255;
      const d2 = mx - mn;
      if (d2 === 0) return -1;
      const r = c.r / 255, g = c.g / 255, b = c.b / 255;
      let h2 = mx === r ? ((g - b) / d2) % 6 : mx === g ? (b - r) / d2 + 2 : (r - g) / d2 + 4;
      h2 *= 60;
      return (h2 + 360) % 360;
    }

    function paint() {
      if (!LAST_PIXELS) return;
      const n = +countIn.value || 8;
      countVal.textContent = n;
      let cols = medianCut(LAST_PIXELS, n);

      const mode = sortIn ? sortIn.value : 'share';
      if (mode === 'dark' || mode === 'light') {
        const lum = hx => { const c = hexToRgb(hx); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };
        cols.sort((a, b) => mode === 'dark' ? lum(a.hex) - lum(b.hex) : lum(b.hex) - lum(a.hex));
      } else if (mode === 'hue') {
        cols.sort((a, b) => hueOf(a.hex) - hueOf(b.hex));
      }

      wrap.innerHTML = cols.map(col => {
        const rgb = hexToRgb(col.hex);
        const onWhite = contrast(rgb, { r: 255, g: 255, b: 255 });
        const onBlack = contrast(rgb, { r: 0, g: 0, b: 0 });
        const text = onWhite > onBlack ? '#F1EEE6' : '#0A0A0B';
        return `<button class="tx__sw" type="button" data-hex="${col.hex}" style="background:${col.hex};color:${text}">
            <span class="tx__pct">${Math.round(col.share * 100)}%</span>
            <span class="tx__hex">${col.hex}</span>
            <span class="tx__cr">${onWhite.toFixed(1)} / ${onBlack.toFixed(1)}</span>
          </button>`;
      }).join('');
      /* be honest when the image simply does not contain the number asked for */
      const short = n - cols.length;
      note.textContent = `Read in memory · ${cols.length} dominant colour${cols.length === 1 ? '' : 's'}`
        + (short > 0 ? ` · this image only holds ${cols.length} — ${short} short of ${n}, not padded with invented tints` : '')
        + ' · tap one to build a ramp';
    }

    if (countIn) countIn.addEventListener('input', paint);
    if (sortIn) sortIn.addEventListener('change', paint);

    /* tap a swatch → it becomes the palette tool's base colour and we jump there */
    wrap.addEventListener('click', e => {
      const b = e.target.closest('[data-hex]');
      if (!b) return;
      const base = $('#tPalBase');
      if (!base) return;
      base.value = b.dataset.hex;
      base.dispatchEvent(new Event('input', { bubbles: true }));
      copy(b.dataset.hex, 'Copied');
      document.getElementById('palette').scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast('Sent ' + b.dataset.hex + ' to the palette');
    });

    const all = () => [...wrap.querySelectorAll('[data-hex]')].map(x => x.dataset.hex);
    if ($('#txCopyHex')) $('#txCopyHex').addEventListener('click', () => copy(all().join(', '), 'Hex list'));
    if ($('#txCopyAll')) $('#txCopyAll').addEventListener('click', () => {
      const css = ':root {\n' + all().map((hx, i) => '  --swatch-' + (i + 1) + ': ' + hx + ';').join('\n') + '\n}';
      copy(css, 'Swatch CSS');
    });
  }

  /* ─────────────── C · modular type scale ─────────────── */

  function buildScale() {
    const baseIn = $('#tscBase');
    if (!baseIn) return;
    const ratioSel = $('#tscRatio'), ink = $('#tscInk'), bg = $('#tscBg');
    const out = $('#tscOut'), verdict = $('#tscVerdict'), copyBtn = $('#tscCopy');
    let SCALE = [];

    const STEPS = [
      ['xs', -2], ['sm', -1], ['base', 0], ['lg', 1], ['xl', 2],
      ['2xl', 3], ['3xl', 4], ['4xl', 5], ['5xl', 6]
    ];

    function render() {
      const base = Math.max(8, +baseIn.value || 16);
      const ratio = +ratioSel.value || 1.333;
      const f = hexToRgb(ink.value), b = hexToRgb(bg.value);
      const cr = (f && b) ? contrast(f, b) : 21;

      SCALE = STEPS.map(([name, n]) => {
        const px = base * Math.pow(ratio, n);
        const rounded = Math.round(px * 100) / 100;
        /* WCAG "large text" is 18.66px bold or 24px regular */
        const isLarge = rounded >= 24;
        const need = isLarge ? 3 : 4.5;
        /* leading that holds at this size — big type wants tight, small type wants air */
        const lh = rounded >= 48 ? 1.02
          : rounded >= 32 ? 1.1
          : rounded >= 22 ? 1.25
          : rounded >= 16 ? 1.5
          : 1.6;
        /* 45 characters is the comfortable line length for body copy */
        const measure = Math.round(rounded * 0.5 * 45);
        return { name, px: rounded, large: isLarge, pass: cr >= need, need, lh, measure };
      });

      out.innerHTML = SCALE.map(s => `
        <div class="tscale__row ${s.pass ? 'is-pass' : 'is-fail'}">
          <span class="mono tscale__name">${s.name}</span>
          <span class="tscale__sample" style="font-size:${Math.min(s.px, 96)}px;color:${ink.value}">Ag</span>
          <span class="mono tscale__px">${s.px}px · ${(s.px / base).toFixed(3)}rem<span class="tscale__lh">lh ${s.lh}</span></span>
          <span class="tscale__badge mono">${s.pass ? '✓' : '✕'} ${s.need}:1</span>
        </div>`).join('');

      const failing = SCALE.filter(s => !s.pass);
      verdict.textContent = failing.length
        ? `${failing.length} step${failing.length > 1 ? 's' : ''} under ${cr.toFixed(2)}:1 fails WCAG — ${failing.map(s => s.name).join(', ')}`
        : `All ${SCALE.length} steps pass at ${cr.toFixed(2)}:1`;
      verdict.className = 'mono tscale__wcag ' + (failing.length ? 'is-fail' : 'is-pass');

      out.style.background = bg.value;
    }

    if (copyBtn) copyBtn.addEventListener('click', () => {
      const base = Math.max(8, +baseIn.value || 16);
      const css = '/* type scale — base ' + base + 'px */\n:root {\n' +
        SCALE.map(s => '  --text-' + s.name + ': ' + (s.px / base).toFixed(3) + 'rem; /* ' + s.px + 'px */\n' +
          '  --leading-' + s.name + ': ' + s.lh + ';\n' +
          '  --measure-' + s.name + ': ' + s.measure + 'px;').join('\n') +
        '\n}';
      copy(css, 'Type scale CSS');
    });

    [baseIn, ink, bg].forEach(i => i && i.addEventListener('input', render));
    ratioSel.addEventListener('change', render);
    render();
  }

  /* ─────────────── 08 · text over an image ───────────────
   * This is the only real way to answer "is it readable": render the headline to an
   * offscreen canvas, then walk the pixels UNDER the glyphs in the photo and take the
   * contrast against each one. A single average would lie — a photo can be bright on
   * one side of the word and black on the other.
   */

  function buildOverlay() {
    const input = $('#tovFile');
    if (!input) return;
    const drop = $('#tovDrop'), stage = $('#tovStage'), canvas = $('#tovCanvas');
    const verdictBox = $('#tovVerdict'), big = $('#tovBig'), msg = $('#tovMsg'), list = $('#tovList');
    const textIn = $('#tovText'), sizeIn = $('#tovSize'), weightIn = $('#tovWeight');
    const inkIn = $('#tovInk'), scrimIn = $('#tovScrim'), scrimVal = $('#tovScrimVal');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let photo = null;          /* the decoded Image */
    let placed = { x: 0.5, y: 0.72 };  /* text anchor as a fraction of the canvas */

    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', e => {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) load(f);
    });
    input.addEventListener('change', () => { if (input.files[0]) load(input.files[0]); });

    function load(file) {
      if (!/^image\//.test(file.type)) return;
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => {
        URL.revokeObjectURL(url);
        photo = im;
        /* draw the photo at a sane working size so the maths stays fast on a phone */
        const MAXW = 900;
        const k = Math.min(1, MAXW / im.naturalWidth);
        canvas.width = Math.round(im.naturalWidth * k);
        canvas.height = Math.round(im.naturalHeight * k);
        stage.hidden = false;
        verdictBox.hidden = false;
        render();
      };
      im.src = url;
    }

    function measure() {
      if (!photo) return null;
      const W = canvas.width, H = canvas.height;
      const fs = Math.max(6, Math.round(+sizeIn.value * (W / 1080)));   /* px on the working canvas */
      const weight = weightIn.value;
      const family = '"Bricolage Grotesque", "Helvetica Neue", Helvetica, Arial, sans-serif';
      const label = textIn.value || 'Headline';

      /* 1) where do the glyphs actually sit? */
      ctx.font = weight + ' ' + fs + 'px ' + family;
      const tw = ctx.measureText(label).width;
      const x = Math.round(placed.x * W - tw / 2);
      const y = Math.round(placed.y * H);

      /* 2) render the glyphs to an offscreen mask */
      const mask = document.createElement('canvas');
      mask.width = W; mask.height = H;
      const mctx = mask.getContext('2d', { willReadFrequently: true });
      mctx.font = weight + ' ' + fs + 'px ' + family;
      mctx.textBaseline = 'alphabetic';
      mctx.fillStyle = '#fff';
      mctx.fillText(label, x, y);
      const mdata = mctx.getImageData(0, 0, W, H).data;

      /* 3) sample the photo under every filled pixel */
      const pdata = ctx.getImageData(0, 0, W, H).data;
      const ink = hexToRgb(inkIn.value) || { r: 255, g: 255, b: 255 };
      const scrim = +scrimIn.value / 100;
      const scrimRgb = { r: 10, g: 10, b: 11 };

      let n = 0, worst = 21, best = 0, sum = 0, fails = 0, darkest = 255, lightest = 0;
      const hist = new Array(24).fill(0);   /* contrast histogram, 0–21 in 1-stop bins */

      /* step in 2px steps: 8x fewer samples, same answer */
      for (let py = 0; py < H; py += 2) {
        for (let px = 0; px < W; px += 2) {
          const i = (py * W + px) * 4;
          if (mdata[i + 3] < 128) continue;      /* not on a glyph */
          let r = pdata[i], g = pdata[i + 1], b = pdata[i + 2];
          if (scrim > 0) {
            r = r * (1 - scrim) + scrimRgb.r * scrim;
            g = g * (1 - scrim) + scrimRgb.g * scrim;
            b = b * (1 - scrim) + scrimRgb.b * scrim;
          }
          const cr = contrast(ink, { r, g, b });
          const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          if (L < darkest) darkest = L;
          if (L > lightest) lightest = L;
          if (cr < worst) worst = cr;
          if (cr > best) best = cr;
          sum += cr; n++;
          if (cr < 4.5) fails++;
          hist[Math.min(23, Math.floor(cr))]++;
        }
      }
      return { n, worst, best, avg: n ? sum / n : 0, fails, fs, x, y, tw, darkest, lightest, hist };
    }

    function render() {
      if (!photo) return;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(photo, 0, 0, W, H);

      const scrim = +scrimIn.value / 100;
      const m = measure();

      /* the scrim goes on AFTER measuring, so what you see is what was measured */
      if (scrim > 0) {
        ctx.fillStyle = 'rgba(10,10,11,' + scrim + ')';
        ctx.fillRect(0, 0, W, H);
      }

      if (m) {
        const fs = m.fs;
        ctx.font = weightIn.value + ' ' + fs + 'px "Bricolage Grotesque", "Helvetica Neue", Helvetica, Arial, sans-serif';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = inkIn.value;
        ctx.fillText(textIn.value || 'Headline', m.x, m.y);
        /* a hairline box so you can see what was measured */
        ctx.strokeStyle = 'rgba(228,87,46,.9)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(m.x - 2, m.y - fs * 0.92, m.tw + 4, fs * 1.2);
        ctx.setLineDash([]);
      }

      scrimVal.textContent = scrimIn.value + '%';
      showVerdict(m);
    }

    function showVerdict(m) {
      if (!m || !m.n) { big.textContent = '—'; return; }
      const smallOk = m.worst >= 4.5, largeOk = m.worst >= 3;
      const isLarge = m.fs >= 24;
      const passes = isLarge ? largeOk : smallOk;

      big.textContent = m.worst.toFixed(2) + ':1';
      big.className = 'tov__big ' + (passes ? 'is-pass' : m.worst >= 2.5 ? 'is-mid' : 'is-fail');

      msg.textContent = passes
        ? 'Worst-case pixel under the letters still clears ' + (isLarge ? '3:1' : '4.5:1') + '.'
        : 'On its worst pixel this fails. ' + Math.round(m.fails / m.n * 100) + '% of the letters sit on something too close to the text colour.';

      const rows = [
        ['Contrast range', m.worst.toFixed(2) + ' → ' + m.best.toFixed(2)],
        ['Average', m.avg.toFixed(2) + ':1'],
        ['Pixels measured', m.n.toLocaleString('en-US')],
        ['Letters below 4.5:1', Math.round(m.fails / m.n * 100) + '%'],
        ['Background brightness', Math.round((m.darkest + m.lightest) / 2 / 2.55) + '% · spread ' + Math.round((m.lightest - m.darkest) / 2.55) + '%']
      ];
      list.innerHTML = rows.map(([k, v]) => '<li><span>' + k + '</span><b>' + v + '</b></li>').join('');
    }

    /* the smallest scrim that gets every glyph pixel over the line */
    function autoFix() {
      if (!photo) return;
      const start = +scrimIn.value;
      for (let s = 0; s <= 85; s += 1) {
        scrimIn.value = s;
        const m = measure();
        if (!m) break;
        const need = m.fs >= 24 ? 3 : 4.5;
        if (m.worst >= need) {
          render();
          toast('Scrim at ' + s + '% is the minimum that works');
          return;
        }
      }
      scrimIn.value = 85;
      render();
      toast('Even 85% is not enough — move the text or change the colour');
    }

    if ($('#tovAuto')) $('#tovAuto').addEventListener('click', autoFix);

    /* tap the photo to move the text there, and it re-measures */
    canvas.addEventListener('click', ev => {
      const r = canvas.getBoundingClientRect();
      placed.x = (ev.clientX - r.left) / r.width;
      placed.y = (ev.clientY - r.top) / r.height;
      render();
    });
    if ($('#tovMove')) $('#tovMove').addEventListener('click', () => {
      toast('Tap anywhere on the photo to move the text');
      canvas.classList.add('is-targeting');
      setTimeout(() => canvas.classList.remove('is-targeting'), 2600);
    });

    [textIn, sizeIn, weightIn, inkIn].forEach(i => i && i.addEventListener('input', render));
    if (weightIn) weightIn.addEventListener('change', render);
    scrimIn.addEventListener('input', render);

    const dl = $('#tovDownload');
    if (dl) dl.addEventListener('click', () => {
      canvas.toBlob(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'headline-' + (textIn.value || 'composite').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.jpg';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        toast('Saved ' + a.download);
      }, 'image/jpeg', 0.92);
    });
  }

  /* ─────────────── the link guide ─────────────── */

  function buildDirectory() {
    const host = $('#tDir');
    if (!host) return;
    const items = $$('.tdir__item', host);
    const search = $('#tDirSearch');
    let active = 'all';

    function apply() {
      const q = (search.value || '').toLowerCase().trim();
      items.forEach(it => {
        const matchCat = active === 'all' || it.dataset.cat === active;
        const matchTxt = !q || it.textContent.toLowerCase().includes(q);
        it.hidden = !(matchCat && matchTxt);
      });
      $$('.tdir__group').forEach(g => {
        g.hidden = $$('.tdir__item', g).every(i => i.hidden);
      });
      const none = items.every(i => i.hidden);
      $('#tDirEmpty').hidden = !none;
    }

    $$('.tdir__chip').forEach(c => c.addEventListener('click', () => {
      active = c.dataset.cat;
      $$('.tdir__chip').forEach(x => x.classList.toggle('is-on', x === c));
      apply();
    }));
    if (search) search.addEventListener('input', apply);
    apply();
  }

  /* ───────────────────────── boot ───────────────────────── */

  function boot() {
    buildExtract();
    buildPrint();
    buildScale();
    buildPress();
    buildContrast();
    buildPalette();
    buildFonts();
    buildOverlay();
    buildAudit();
    buildLockup();
    buildDirectory();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
