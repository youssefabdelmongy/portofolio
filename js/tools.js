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

  const SIZES = [
    { group: 'Instagram', name: 'Post — square', w: 1080, h: 1080 },
    { group: 'Instagram', name: 'Post — portrait', w: 1080, h: 1350 },
    { group: 'Instagram', name: 'Story / Reel', w: 1080, h: 1920 },
    { group: 'Instagram', name: 'Profile photo', w: 320, h: 320 },
    { group: 'Facebook', name: 'Feed post', w: 1200, h: 630 },
    { group: 'Facebook', name: 'Story', w: 1080, h: 1920 },
    { group: 'Facebook', name: 'Cover photo', w: 851, h: 315 },
    { group: 'Facebook', name: 'Event cover', w: 1920, h: 1005 },
    { group: 'LinkedIn', name: 'Feed post', w: 1200, h: 627 },
    { group: 'LinkedIn', name: 'Banner', w: 1584, h: 396 },
    { group: 'X / Twitter', name: 'Post image', w: 1600, h: 900 },
    { group: 'X / Twitter', name: 'Header', w: 1500, h: 500 },
    { group: 'TikTok', name: 'Video cover', w: 1080, h: 1920 },
    { group: 'YouTube', name: 'Thumbnail', w: 1280, h: 720 },
    { group: 'YouTube', name: 'Channel banner', w: 2560, h: 1440 },
    { group: 'Pinterest', name: 'Pin', w: 1000, h: 1500 },
    { group: 'WhatsApp', name: 'Status', w: 1080, h: 1920 }
  ];

  function buildSizes() {
    const host = $('#tSizeList');
    if (!host) return;
    const groups = [...new Set(SIZES.map(s => s.group))];
    host.innerHTML = groups.map(g => `
      <div class="tsize__group">
        <p class="tsize__g mono">${g}</p>
        ${SIZES.filter(s => s.group === g).map(s => {
          const r = (s.w / s.h);
          const ratio = Math.abs(r - 1) < 0.02 ? '1:1'
            : Math.abs(r - 16 / 9) < 0.03 ? '16:9'
            : Math.abs(r - 9 / 16) < 0.03 ? '9:16'
            : Math.abs(r - 4 / 5) < 0.03 ? '4:5'
            : r > 1 ? r.toFixed(2) + ':1' : '1:' + (1 / r).toFixed(2);
          return `<button class="tsize" type="button" data-w="${s.w}" data-h="${s.h}" data-name="${s.group} ${s.name}">
            <span class="tsize__box" style="aspect-ratio:${s.w}/${s.h}"></span>
            <span class="tsize__txt"><b>${s.name}</b><small class="mono">${s.w}×${s.h} · ${ratio}</small></span>
          </button>`;
        }).join('')}
      </div>`).join('');

    /* the phone shows the chosen aspect ratio as a crop inside a 9:19.5 screen */
    const art = $('#tSizeArt'), meta = $('#tSizeMeta'), clone = $('#tSizeClone');
    let current = null;

    function preview(b) {
      const w = +b.dataset.w, h = +b.dataset.h;
      current = { w, h, name: b.dataset.name };
      art.style.width = '';
      art.style.height = '';
      /* fit the aspect ratio inside the phone screen */
      if (w >= h) { art.style.width = '86%'; art.style.height = 'auto'; art.style.aspectRatio = w + '/' + h; }
      else { art.style.height = '78%'; art.style.width = 'auto'; art.style.aspectRatio = w + '/' + h; }
      art.style.borderRadius = (w === h ? '6px' : '3px');
      const r = (w / h);
      const ratio = Math.abs(r - 1) < 0.02 ? '1:1'
        : Math.abs(r - 16 / 9) < 0.03 ? '16:9'
        : Math.abs(r - 9 / 16) < 0.03 ? '9:16'
        : Math.abs(r - 4 / 5) < 0.03 ? '4:5'
        : r > 1 ? r.toFixed(2) + ':1' : '1:' + (1 / r).toFixed(2);
      meta.textContent = `${b.dataset.name} — ${w}×${h} · ${ratio}`;
    }

    host.addEventListener('click', e => {
      const b = e.target.closest('.tsize');
      if (!b) return;
      copy(`${b.dataset.w}×${b.dataset.h}`, b.dataset.name);
      $$('.tsize', host).forEach(x => x.classList.toggle('is-on', x === b));
      preview(b);
    });

    /* open on the most common size so the preview is never an empty box */
    const first = host.querySelector('.tsize');
    if (first) {
      first.classList.add('is-on');
      preview(first);
    }

    /* hand the size over to the print tool — the two tools talk to each other */
    if (clone) clone.addEventListener('click', () => {
      if (!current) { toast('Pick a size first'); return; }
      /* px → mm at 300dpi, so "1080×1920" arrives as a real print size */
      const mm = px => Math.round(px / 300 * 25.4 * 10) / 10;
      const wIn = $('#tPrintW'), hIn = $('#tPrintH'), pr = $('#tPrintPreset');
      if (!wIn) return;
      wIn.value = mm(current.w);
      hIn.value = mm(current.h);
      if (pr) pr.value = '';
      wIn.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('print').scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast(`${current.w}×${current.h}px → ${mm(current.w)}×${mm(current.h)}mm at 300dpi`);
    });
  }

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

  /* ─────────────── 4 · px / rem / pt ─────────────── */

  function buildUnits() {
    const root = $('#tUnitRoot');
    if (!root) return;
    const inputs = $$('.tunit__in');

    function render(src) {
      const base = Math.max(1, +root.value || 16);
      const v = +src.value || 0;
      const unit = src.dataset.unit;
      // convert to px first
      let px = v;
      if (unit === 'rem') px = v * base;
      if (unit === 'pt') px = v / 72 * 96;

      $$('.tunit__in').forEach(i => {
        if (i === src) return;
        const u = i.dataset.unit;
        let val = px;
        if (u === 'rem') val = px / base;
        if (u === 'pt') val = px * 72 / 96;
        i.value = px === 0 ? '' : (Math.round(val * 1000) / 1000);
      });
      $('#tUnitNote').textContent =
        `1 rem = ${base}px · 1 pt = ${(96 / 72).toFixed(4)}px · 1 px = ${(72 / 96).toFixed(4)}pt`;
    }

    inputs.forEach(i => i.addEventListener('input', () => render(i)));
    root.addEventListener('input', () => {
      const filled = inputs.find(i => i.value !== '');
      if (filled) render(filled);
    });
    inputs[0].value = 16;
    render(inputs[0]);
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

      const tint = (i) => hslToHex(h, Math.max(8, sBase - i * 6), 94 - i * 8);
      const shade = (i) => hslToHex(h, Math.min(100, sBase + i * 4), Math.max(6, 46 - i * 8));
      const comp = hslToHex(h + 180, Math.max(20, sBase), 52);
      const analogA = hslToHex(h + 30, sBase, 55);
      const analogB = hslToHex(h - 30, sBase, 55);

      /* ten steps, light to dark, so the grid always fills cleanly (2 rows of 5) */
      const rows = [
        ['50', tint(1)], ['100', tint(2)], ['200', tint(3)], ['300', tint(4)], ['400', tint(5)],
        ['BASE', base.value.toUpperCase()],
        ['600', shade(0)], ['700', shade(1)], ['800', shade(2)], ['900', shade(3)]
      ].sort((a, b) => 0);
      out.innerHTML = rows.map(([k, c]) => {
        const rgb2 = hexToRgb(c);
        const onWhite = (contrast(rgb2, { r: 255, g: 255, b: 255 })).toFixed(1);
        const onBlack = (contrast(rgb2, { r: 0, g: 0, b: 0 })).toFixed(1);
        /* put the label in whichever of paper/ink actually reads on this swatch */
        const lc = parseFloat(onWhite) > parseFloat(onBlack) ? '#F1EEE6' : '#0A0A0B';
        return `<button class="tpal__sw" type="button" data-hex="${c}" style="background:${c};color:${lc}">
          <span class="tpal__k mono">${k}</span>
          <span class="tpal__hex mono">${c}</span>
          <span class="tpal__cr mono">${onWhite} / ${onBlack}</span>
        </button>`;
      }).join('');

      /* the whole palette as an export block — this is the step everyone does by hand */
      PAL_LAST = rows.map(([k, c]) => ({ step: k, hex: c }))
        .concat([{ step: 'accent', hex: comp }, { step: 'accent-2', hex: analogA }, { step: 'accent-3', hex: analogB }]);

      $('#tPalAccents').innerHTML = [['Complement', comp], ['Analogous +30', analogA], ['Analogous −30', analogB]]
        .map(([n, c]) => `<button class="tpal__ac" type="button" data-hex="${c}" style="background:${c}">
            <span class="mono">${n}</span><b class="mono">${c}</b></button>`).join('');
    }

    out.parentElement.addEventListener('click', e => {
      const b = e.target.closest('[data-hex]');
      if (b) copy(b.dataset.hex, 'Hex');
    });

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

  /* ─────────────── 6 · file size budget ─────────────── */

  function buildWeight() {
    const wIn = $('#tWtW'), hIn = $('#tWtH'), budget = $('#tWtBudget');
    if (!wIn) return;
    const out = $('#tWtOut');

    function render() {
      const w = Math.max(1, +wIn.value || 0), h = Math.max(1, +hIn.value || 0);
      const kb = Math.max(1, +budget.value || 0);
      const px = w * h;
      const bpp = (kb * 1024 * 8) / px;          // bits per pixel at the budget
      const verdict =
        bpp >= 1.0 ? ['Very safe', 'is-pass'] :
        bpp >= 0.55 ? ['Safe', 'is-pass'] :
        bpp >= 0.3 ? ['Tight — watch the detail', 'is-mid'] :
        ['Too small — expect blocking', 'is-fail'];
      out.innerHTML = `
        <div class="tp__row"><span>Pixels</span><b>${px.toLocaleString('en-US')}</b></div>
        <div class="tp__row"><span>Budget per pixel</span><b>${bpp.toFixed(2)} bits</b></div>
        <div class="tp__row"><span>Verdict</span><b class="${verdict[1]}">${verdict[0]}</b></div>
        <div class="tp__row tp__row--note"><span>Rule of thumb</span><b>Photos 0.5–0.8 bpp · flat graphics 0.15–0.3 bpp</b></div>`;
    }
    [wIn, hIn, budget].forEach(i => i && i.addEventListener('input', render));
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

      list.innerHTML = faces.map((f, i) => {
        const isWin = f.resolved && f === first;
        return `<li class="tfont__row ${f.resolved ? 'is-ok' : 'is-miss'} ${isWin ? 'is-win' : ''}">
          <span class="tfont__dot" aria-hidden="true"></span>
          <span class="tfont__nm mono">${escapeHtml(f.name)}</span>
          <span class="tfont__tag mono">${f.generic ? 'generic' : f.resolved ? (isWin ? 'in use' : 'installed') : 'missing'}</span>
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

  /* ─────────────── 8 · image auditor ───────────────
   * Real measurements off a real canvas: dimensions, effective DPI at a chosen print
   * size, alpha presence, ink coverage, and a noise estimate from neighbouring-pixel
   * deltas. All local.
   */

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

  function markSvg(kind, cx, cy, r, ink) {
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
      default:
        return '';
    }
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
        markSvg(opt.mark, cx, markY, 78, ink) +
        '<text x="' + cx + '" y="' + (markY + 190) + '" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="' + weight + '" font-size="112" letter-spacing="' + track + '" fill="' + ink + '">' + name + '</text>' +
        (tag ? '<text x="' + cx + '" y="' + (markY + 252) + '" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="34" letter-spacing="6" fill="' + ink + '" opacity=".7">' + tag.toUpperCase() + '</text>' : '');
    } else if (opt.mode === 'horizontal') {
      body =
        markSvg(opt.mark, 150, H / 2, 64, ink) +
        '<text x="270" y="' + (H / 2 + 4) + '" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="' + weight + '" font-size="96" letter-spacing="' + track + '" fill="' + ink + '">' + name + '</text>' +
        (tag ? '<text x="272" y="' + (H / 2 + 58) + '" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="28" letter-spacing="5" fill="' + ink + '" opacity=".7">' + tag.toUpperCase() + '</text>' : '');
    } else {
      body = markSvg(opt.mark, cx, H / 2, 190, ink) || '<text x="' + cx + '" y="' + (H / 2 + 40) + '" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="' + weight + '" font-size="200" fill="' + ink + '">' + name.slice(0, 1) + '</text>';
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
    buildSizes();
    buildPrint();
    buildContrast();
    buildUnits();
    buildPalette();
    buildFonts();
    buildWeight();
    buildAudit();
    buildLockup();
    buildDirectory();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
