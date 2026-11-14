/* cursor.js — multi-state custom cursor + magnetic elements + sparkle trail */
window.PF = window.PF || {};
(function (PF) {
  if (PF.isCoarse()) { document.body.classList.add('cursor-hidden'); return; }

  const root = document.getElementById('cursor');
  const label = root.querySelector('.cursor__label');
  const trailCanvas = document.getElementById('cursorTrail');
  if (!root) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my, vx = 0, vy = 0;
  let down = false, visible = false;

  window.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (!visible) { visible = true; root.classList.remove('is-hidden'); document.body.classList.remove('cursor-hidden'); }
  }, { passive: true });
  window.addEventListener('mousedown', function () { down = true; root.classList.add('is-down'); });
  window.addEventListener('mouseup', function () { down = false; root.classList.remove('is-down'); });
  document.addEventListener('mouseleave', function () { root.classList.add('is-hidden'); });

  /* ring follows with a spring */
  PF.tick(function () {
    const prevX = rx, prevY = ry;
    rx = PF.lerp(rx, mx, 0.18);
    ry = PF.lerp(ry, my, 0.18);
    vx = rx - prevX; vy = ry - prevY;
    const stretch = Math.min(0.28, Math.hypot(vx, vy) * 0.012);
    const angle = Math.atan2(vy, vx) * 180 / Math.PI;
    root.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
    const ring = root.querySelector('.cursor__ring');
    if (ring && !root.classList.contains('is-label')) {
      ring.style.transform = 'rotate(' + angle + 'deg) scale(' + (1 + stretch) + ',' + (1 - stretch * 0.55) + ')';
    } else if (ring) {
      ring.style.transform = '';
    }
    // the dot is instant
    const dot = root.querySelector('.cursor__dot');
    if (dot) dot.style.transform = 'translate3d(' + (mx - rx) + 'px,' + (my - ry) + 'px,0)';
  });

  /* ---------- state machine ---------- */
  function setState(kind, text) {
    root.classList.remove('is-hover', 'is-label', 'is-big', 'is-invert', 'is-snap', 'is-text', 'is-none');
    if (kind && kind !== 'default') root.classList.add('is-' + kind);
    label.textContent = text || '';
  }

  const SEL = 'a, button, input, textarea, select, [data-cursor], .play, .card, .style-btn, .sw, .chip';

  document.addEventListener('mouseover', function (e) {
    const el = e.target.closest(SEL);
    if (!el) { setState('default'); return; }
    const kind = el.dataset.cursor;
    const text = el.dataset.cursorText || '';
    if (kind) setState(kind, text);
    else if (el.matches('input, textarea')) setState('none');
    else setState('hover');
  });

  document.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget) return;
    const from = e.target.closest(SEL);
    if (from && !from.contains(e.relatedTarget)) setState('default');
  });

  /* click ripple */
  document.addEventListener('click', function (e) {
    const r = document.createElement('span');
    r.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;border:1px solid rgba(228,87,46,.9);pointer-events:none;z-index:9600;transition:transform .6s cubic-bezier(.16,1,.3,1),opacity .6s';
    document.body.appendChild(r);
    requestAnimationFrame(function () {
      r.style.transform = 'scale(9)';
      r.style.opacity = '0';
    });
    setTimeout(function () { r.remove(); }, 700);
  });

  /* ---------- magnetic elements ---------- */
  PF.$$('[data-magnetic]').forEach(function (el) {
    const strength = parseFloat(el.dataset.magnetic) || 0.32;
    let rect = null;
    el.addEventListener('mouseenter', function () {
      rect = el.getBoundingClientRect();
      el.classList.add('is-active');
    });
    el.addEventListener('mousemove', function (e) {
      if (!rect) rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      const inner = el.firstElementChild;
      if (inner) inner.style.transform = 'translate3d(' + (x * 0.25).toFixed(1) + 'px,' + (y * 0.25).toFixed(1) + 'px,0)';
    });
    el.addEventListener('mouseleave', function () {
      el.classList.remove('is-active');
      el.style.transform = '';
      const inner = el.firstElementChild;
      if (inner) inner.style.transform = '';
      rect = null;
    });
  });

  /* ---------- sparkle trail ---------- */
  if (!trailCanvas) return;
  const ctx = trailCanvas.getContext('2d');
  let W, H, dpr;
  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = trailCanvas.width = Math.floor(window.innerWidth * dpr);
    H = trailCanvas.height = Math.floor(window.innerHeight * dpr);
    trailCanvas.style.width = window.innerWidth + 'px';
    trailCanvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
  }
  size();
  window.addEventListener('resize', PF.debounce(size, 200));

  const parts = [];
  let lastSpawn = 0;
  window.addEventListener('mousemove', function (e) {
    const now = performance.now();
    if (now - lastSpawn < 22) return;
    lastSpawn = now;
    if (PF.reduceMotion()) return;
    const speed = Math.hypot(vx, vy);
    const n = speed > 6 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      parts.push({
        x: e.clientX + PF.rand(-6, 6), y: e.clientY + PF.rand(-6, 6),
        r: PF.rand(1.2, 3.4), life: 1,
        vx: PF.rand(-0.6, 0.6) - vx * 0.15, vy: PF.rand(-0.9, 0.2) - vy * 0.15,
        hue: Math.random() > 0.72 ? '242,169,59' : '228,87,46'
      });
    }
    if (parts.length > 90) parts.splice(0, parts.length - 90);
  }, { passive: true });

  PF.tick(function (t, dt) {
    const step = Math.min(2, dt / 16.7);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= 0.022 * step;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx * step; p.y += p.vy * step; p.vy += 0.015 * step;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + p.hue + ',' + (p.life * 0.55).toFixed(3) + ')';
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
  });
})(window.PF);
