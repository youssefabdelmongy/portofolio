/* cursorlab.js — the "what you get" section
   Four services, each with a live specimen you can compare before/after.
   The section uses the normal system cursor on purpose: the demo has to be
   usable by a business owner, not impressive to a designer.

   Rules this file keeps:
   · one rAF for the whole section (PF.tick), no timers per frame
   · scroll picks the service, the tabs pick the before/after view
   · the ambient canvas reacts to the hand but never competes with the card
   · prefers-reduced-motion → no ambient motion, stages change on scroll only
   · with JavaScript off the four services stay as readable text                 */
window.PF = window.PF || {};
(function (PF) {
  const $ = PF.$;
  const section = $('#pointer');
  const stage = $('#cstage');
  if (!section || !stage) return;

  const sticky = $('.cstage__sticky', stage);
  const steps = PF.$$('.cstep', $('#cstageStory'));
  const bg = $('#cstageBg');
  const grid = $('#cstageGrid');
  const portrait = $('#cstagePortrait');
  const rail = $('#cstageRail');
  const mob = $('#cstageMob');
  const idxEl = $('#cstageIdx');
  const totalEl = $('#cstageTotal');
  const bigEl = $('#cstageBig');
  const hint = $('#cstageHint');
  const cue = $('#cstageCue');
  const endCard = $('.cstage__end');
  const urlEl = $('#cspecUrl');
  const spec = $('#cspec');
  const panel = $('#cstagePanel');
  const panelK = $('#panelK'), panelT = $('#panelT'), panelD = $('#panelD'), panelMeta = $('#panelMeta');
  const panelTry = $('#panelTry');
  const toggle = $('#cspecToggle');
  const toggleState = $('#cspecToggleState');
  const toggleHint = $('#cspecToggleHint');
  const what = $('#cspecWhat');
  const result = $('#cspecResult');
  const tabBefore = $('#tabBefore'), tabAfter = $('#tabAfter');
  const proofT = $('#cspecProofT');
  const getList = $('#cspecGet');

  const coarse = PF.isCoarse();
  const reduce = PF.reduceMotion();
  const bctx = bg.getContext('2d');
  const sec = section;

  /* ───────────────────────── the four acts ───────────────────────── */
  const STAGES = [
    {
      key: 'MENUS', name: 'Menus', tint: '#F1EEE6', bg: 'dots',
      foot: '01 · MENUS — print-ready, sold before it is printed',
      before: 'What most places print today',
      after: 'What leaves my studio',
      what: 'A menu page. Tap “Today” to see what most places hand the printer.',
      result: 'Guests notice the plates worth selling, and the printer gets files that work first time — so no second print bill.',
      get: ['A print-ready PDF, Arabic + English', 'Bleed and CMYK set for your printer', 'The editable source file', 'Delivered in 5–7 working days'],
      proof: 'Qandil Seafood — menu & brand, 2024. Printed and used in the branch.',
      url: 'live work / qandil-menu',
      blurb: 'Hierarchy that pushes the plates you actually want to sell.'
    },
    {
      key: 'CAMPAIGNS', name: 'Campaigns', tint: '#F1EEE6', bg: 'lines',
      foot: '02 · CAMPAIGNS — one key visual, every channel',
      before: 'The usual campaign',
      after: 'The same offer, one voice',
      what: 'One offer. Tap “Today” to see how it usually falls apart across channels.',
      result: 'The same offer looks like one business everywhere your customer meets it. No confusion about whether it’s really you.',
      get: ['Key visual in 3 sizes', 'Feed + story set', 'Print / in-store version', 'Photo and copy brief'],
      proof: 'Talabat — 10 Years campaign, 2025. Ran across feed, stories and print.',
      url: 'live work / talabat-10yrs',
      blurb: 'Key visual, feed set, stories and print from one idea.'
    },
    {
      key: 'IDENTITY', name: 'Identity', tint: '#F2A93B', bg: 'halftone',
      foot: '03 · IDENTITY — one brand your team can run on its own',
      before: 'The logo file you have',
      after: 'The system you keep',
      what: 'A logo. Tap “Today” to see the file most businesses send over WhatsApp.',
      result: 'Sign, menu, packaging and posts look like one business — and new staff can stay on brand without asking you first.',
      get: ['Logo set (all formats)', 'Colours + type rules', 'Mini rulebook (few pages)', 'Editable source files'],
      proof: 'Sheikh El Balad — identity used on print, social and packaging.',
      url: 'live work / brand-system',
      blurb: 'Logo, colours, type and a rulebook your team can follow.'
    },
    {
      key: 'SOCIAL', name: 'Social', tint: '#F1EEE6', bg: 'blur',
      foot: '04 · SOCIAL — a feed that stays on brand',
      before: 'A busy week, no system',
      after: 'A busy week, still on brand',
      what: 'A week of posts. Tap “Today” to see a busy week with no templates.',
      result: 'Your page keeps posting through the busy weeks, on brand, without a designer on call — and without you chasing anyone.',
      get: ['Editable post templates', 'Offer + menu formats', 'Monthly set you can reuse', 'Handover walkthrough'],
      proof: 'Eight live projects on Behance — check the work before we talk.',
      url: 'live work / social-system',
      blurb: 'Templates and monthly sets you can reuse for weeks.'
    }
  ];


  totalEl.textContent = String(STAGES.length).padStart(2, '0');

  /* one instruction per act — the thing the visitor should actually do */
  const TRY = [
    'See the menu this came from <span aria-hidden="true">↗</span>',
    'See the full campaign <span aria-hidden="true">↗</span>',
    'See the mark on the shopfront <span aria-hidden="true">↗</span>',
    'See a month of posts <span aria-hidden="true">↗</span>'
  ];

  /* the rail: one line per act, reads like a table of contents */
  if (rail) {
    rail.innerHTML = STAGES.map(function (s, i) {
      return '<li><button class="cstage__rail-i" type="button" data-i="' + i + '">' +
        '<span class="mono">0' + (i + 1) + '</span>' + s.name + '<i aria-hidden="true"></i></button></li>';
    }).join('');
    PF.$$('.cstage__rail-i', rail).forEach(function (b) {
      b.addEventListener('click', function () { goTo(+b.dataset.i); });
    });
  }
  if (mob) {
    mob.innerHTML = STAGES.map(function (s, i) {
      return '<li><button class="cstage__mob-b" type="button" data-i="' + i + '"><span>0' + (i + 1) + '</span>' + s.name + '</button></li>';
    }).join('');
    PF.$$('.cstage__mob-b', mob).forEach(function (b) {
      b.addEventListener('click', function () { goTo(+b.dataset.i); });
    });
  }

  let current = -1;
  function setStage(i, force) {
    if (i === current && !force) return;
    current = i;
    const st = STAGES[i];
    if (!st) return;

    section.dataset.stage = st.key.toLowerCase();
    section.dataset.bg = st.bg;
    sec.style.setProperty('--tint', st.tint);
    if (idxEl) idxEl.textContent = '0' + (i + 1);
    if (bigEl) bigEl.textContent = '0' + (i + 1);
    if (urlEl) urlEl.textContent = st.url;

    steps.forEach(function (n, k) { n.classList.toggle('is-on', k === i); });
    PF.$$('.cstage__rail-i', section).forEach(function (li, k) {
      li.classList.toggle('is-on', k === i);
    });
    if (mob) PF.$$('.cstage__mob-b', mob).forEach(function (b, k) {
      b.classList.toggle('is-on', k === i);
      b.setAttribute('aria-current', k === i ? 'true' : 'false');
    });

    if (spec) spec.dataset.on = String(i);
    if (spec) spec.dataset.view = 'after';
    if (what) what.textContent = st.what || '';
    if (result) result.textContent = st.result || '';
    if (proofT) proofT.textContent = st.proof || '';
    if (getList) getList.innerHTML = (st.get || []).map(function (x) {
      return '<li>' + x + '</li>';
    }).join('');
    if (tabBefore) { tabBefore.classList.remove('is-on'); tabBefore.setAttribute('aria-selected', 'false'); }
    if (tabAfter) { tabAfter.classList.add('is-on'); tabAfter.setAttribute('aria-selected', 'true'); }
    if (typeof resetSpecimen === 'function') resetSpecimen(i);

    /* the pinned copy column swaps to the current act's words */
    if (panelT) {
      const src = steps[i];
      if (src) {
        panelK.textContent = src.querySelector('.cstep__k').textContent;
        panelT.textContent = src.querySelector('.cstep__t').textContent;
        /* the first sentence is what a phone shows — the rest is on wide screens */
        panelD.innerHTML = src.querySelector('.cstep__d').innerHTML.replace(
          /^([^.]+\.)\s*(.+)$/,
          '<b>$1</b><span class="cstage__panel-rest"> $2</span>'
        );
        panelMeta.textContent = src.querySelector('.cstep__meta').textContent;
        if (panelTry) panelTry.innerHTML = TRY[i] || '';
        panel.classList.remove('is-swap');
        void panel.offsetWidth;
        panel.classList.add('is-swap');
      }
    }
  }

  /* ───────────────────────── scroll → act ───────────────────────── */
  /* the line a step must cross to own the act: mid-screen on desktop,
     upper third on phones where the story sits under the specimen */
  let measureLine = 0.55;
  function setLine() {
    measureLine = window.matchMedia('(max-width:860px)').matches ? 0.28 : 0.55;
  }
  setLine();
  window.addEventListener('resize', PF.debounce(setLine, 150));

  let inView = false;
  let scrollClaim = 0;

  function measure() {
    const vh = window.innerHeight;
    const r = section.getBoundingClientRect();
    inView = r.top < vh * 0.95 && r.bottom > vh * 0.15;
    const total = section.offsetHeight - vh;
    scrollClaim = PF.clamp(-r.top / Math.max(1, total), 0, 1);

    const line = vh * measureLine;
    let i = 0;
    for (let k = 0; k < steps.length; k++) {
      if (steps[k].getBoundingClientRect().top <= line) i = k;
    }
    setStage(i);

    /* the scroll cue steps aside once the closing card arrives */
    if (endCard) {
      const closing = endCard.getBoundingClientRect().top < vh * 0.8;
      if (cue) cue.classList.toggle('is-off', closing);
      sticky.classList.toggle('is-closing', closing);
    }
    return i;
  }

  function goTo(i) {
    const vh = window.innerHeight;
    const target = steps[PF.clamp(i, 0, steps.length - 1)];
    if (!target) return;
    /* absolute document offsets — the smoothed scroll value lags behind the rect */
    const sy = window.scrollY || document.documentElement.scrollTop || 0;
    const top = section.getBoundingClientRect().top + sy;
    /* the first act starts where the stage pins; the rest sit measureLine down their step.
       Use the story's document offset (it is the runway) instead of the sticky's rect,
       which moves while the inertia scroll is still settling. */
    const story = steps[0].parentElement;
    const storyTop = story.getBoundingClientRect().top + sy;
    const k = PF.clamp(i, 0, steps.length - 1);
    const y = k === 0
      ? storyTop + 2
      : steps[k].getBoundingClientRect().top + sy - vh * measureLine + 2;
    if (PF.scrollToY) PF.scrollToY(Math.max(storyTop + 2, y));
  }

  /* ───────────────────────── pointer state ───────────────────────── */
  let w = 0, h = 0, dpr = 1;
  const tx = { x: 0, y: 0 };              // where the hand wants to go
  const ring = { x: 0, y: 0, vx: 0, vy: 0 };
  const dot = { x: 0, y: 0 };
  let press = 0, pressT = 0;
  let mx = 0, my = 0, px = 0, py = 0;     // specimen-local coords (px = previous)
  let inSpec = false;
  let lastMove = 0, lastRaf = 0;
  let time = 0;
  let demoIdx = 0, demoStart = 0;

  function size() {
    w = sticky.clientWidth || window.innerWidth;
    h = sticky.clientHeight || window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    bg.width = Math.round(w * dpr);
    bg.height = Math.round(h * dpr);
    bg.style.width = w + 'px';
    bg.style.height = h + 'px';
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = centre();
    dot.x = ring.x = tx.x = px = c.x;
    dot.y = ring.y = tx.y = py = c.y;
    mx = c.x; my = c.y;
    drawGrid();
  }

  /* the specimen's centre in stage space — everything orbits this point */
  function centre() {
    if (!spec) return { x: w * 0.52, y: h * 0.52 };
    const r = spec.getBoundingClientRect();
    const s = sticky.getBoundingClientRect();
    if (!r.width) return { x: w * 0.52, y: h * 0.52 };
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + Math.min(r.height, h * 0.62) / 2 };
  }

  function toLocal(e) {
    const s = sticky.getBoundingClientRect();
    return { x: e.clientX - s.left, y: e.clientY - s.top };
  }

  window.addEventListener('pointermove', function (e) {
    if (!inView) return;
    const p = toLocal(e);
    tx.x = PF.clamp(p.x, 0, w);
    tx.y = PF.clamp(p.y, 0, h);
    lastMove = time;
    if (spec) {
      const r = spec.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      inSpec = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      /* hover targets are plain CSS states now — no JS glyph switching */
    }
  }, { passive: true });

  window.addEventListener('pointerdown', function () {
    if (!inView) return;
    pressT = 1;
  });
  window.addEventListener('pointerup', function () { pressT = 0; });

  /* ───────────────────────── specimens ───────────────────────── */
  /* the specimen is a real piece of work now — it has no fake controls to drive */
  const TYPE = '';
  function runTyping() {}

  /* before / after — the whole point of the card is that you can see both */
  function setView(next) {
    if (!spec) return;
    spec.dataset.view = next;
    const isBefore = next === 'before';
    if (tabBefore) {
      tabBefore.classList.toggle('is-on', isBefore);
      tabBefore.setAttribute('aria-selected', isBefore ? 'true' : 'false');
    }
    if (tabAfter) {
      tabAfter.classList.toggle('is-on', !isBefore);
      tabAfter.setAttribute('aria-selected', isBefore ? 'false' : 'true');
    }
  }
  /* the card opens on the fixed version — "today" is an invitation, not a default */
  if (spec) spec.dataset.view = 'after';
  if (tabBefore) tabBefore.addEventListener('click', function () { setView('before'); });
  if (tabAfter) tabAfter.addEventListener('click', function () { setView('after'); });


  /* ───────────────────────── canvas scenes ───────────────────────── */
  function drawGrid() {
    if (!grid) return;
    grid.innerHTML = '';
    const css = 'position:absolute;left:0;top:0;width:1px;height:100%;background:rgba(241,238,230,.045)';
    const cols = Math.max(2, Math.min(6, Math.round(w / 260)));
    for (let i = 1; i < cols; i++) {
      const d = document.createElement('i');
      d.style.cssText = css + ';transform:translateX(' + Math.round((w / cols) * i) + 'px)';
      grid.appendChild(d);
    }
  }

  function sceneDots(t) {
    const c = centre();
    const gap = 34;
    bctx.clearRect(0, 0, w, h);
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = gap / 2; x < w; x += gap) {
        const dx = x - ring.x, dy = y - ring.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const pull = PF.clamp(1 - d / 260, 0, 1);
        const px = x - dx * pull * 0.34, py = y - dy * pull * 0.34;
        const s = 1 + pull * 2.6;
        bctx.globalAlpha = 0.06 + pull * 0.5;
        bctx.fillStyle = pull > 0.55 ? '#E4572E' : '#F1EEE6';
        bctx.beginPath();
        bctx.arc(px, py, s, 0, Math.PI * 2);
        bctx.fill();
      }
    }
    bctx.globalAlpha = 1;
  }

  function sceneLines(t) {
    bctx.clearRect(0, 0, w, h);
    const rows = Math.round(h / 46);
    bctx.strokeStyle = '#F1EEE6';
    for (let i = 0; i < rows; i++) {
      const y = (i + 0.5) * (h / rows);
      const near = PF.clamp(1 - Math.abs(y - ring.y) / 220, 0, 1);
      bctx.globalAlpha = 0.05 + near * 0.22;
      bctx.lineWidth = 1 + near * 1.2;
      bctx.beginPath();
      bctx.moveTo(0, y);
      const bend = (ring.x / w - 0.5) * 40 * near;
      bctx.bezierCurveTo(w * 0.33, y - bend, w * 0.66, y + bend, w, y);
      bctx.stroke();
    }
    bctx.globalAlpha = 1;
  }

  function sceneHalftone(t) {
    bctx.clearRect(0, 0, w, h);
    const gap = 20;
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = gap / 2; x < w; x += gap) {
        const dx = (x - ring.x) / w, dy = (y - ring.y) / h;
        const d = Math.sqrt(dx * dx + dy * dy);
        const r = PF.clamp(3.4 - d * 9, 0.4, 3.6);
        bctx.globalAlpha = PF.clamp(0.42 - d * 0.7, 0.02, 0.42);
        bctx.fillStyle = '#F2A93B';
        bctx.beginPath();
        bctx.arc(x, y, r, 0, Math.PI * 2);
        bctx.fill();
      }
    }
    bctx.globalAlpha = 1;
  }

  function sceneBlur(t) {
    bctx.clearRect(0, 0, w, h);
    const c = centre();
    /* concentric rings that tighten around the lens — attention, drawn */
    for (let i = 7; i >= 0; i--) {
      const r = 90 + i * 78 - (pressT ? 22 : 0);
      bctx.globalAlpha = 0.045 + i * 0.008;
      bctx.strokeStyle = '#F1EEE6';
      bctx.lineWidth = 1;
      bctx.beginPath();
      bctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      bctx.stroke();
    }
    /* a soft veil everywhere except under the lens */
    const g = bctx.createRadialGradient(ring.x, ring.y, 10, ring.x, ring.y, 190);
    g.addColorStop(0, 'rgba(10,10,11,0)');
    g.addColorStop(1, 'rgba(10,10,11,.55)');
    bctx.fillStyle = g;
    bctx.fillRect(0, 0, w, h);
    bctx.globalAlpha = 1;
  }

  function drawScene(t) {
    const st = STAGES[current] || STAGES[0];
    if (reduce) { bctx.clearRect(0, 0, w, h); return; }
    if (st.bg === 'dots') sceneDots(t);
    else if (st.bg === 'lines') sceneLines(t);
    else if (st.bg === 'halftone') sceneHalftone(t);
    else if (st.bg === 'blur') sceneBlur(t);
    else bctx.clearRect(0, 0, w, h);
  }

  /* ───────────────────────── the loop ───────────────────────── */
  function frame(ts) {
    if (!lastRaf) lastRaf = ts;
    const dt = Math.min(48, ts - lastRaf);
    lastRaf = ts;
    time += dt;

    measure();
    if (!inView) { bctx.clearRect(0, 0, w, h); return; }

    const k = reduce ? 1 : PF.clamp(dt / 16.67, 0.4, 2.2);

    /* idle → the page performs, but on the specimen, not randomly across the screen */
    if (!coarse && time - lastMove > 2200) {
      const c = centre();
      const ph = time * 0.00042;
      tx.x = c.x + Math.cos(ph * 1.7) * w * 0.115;
      tx.y = c.y + Math.sin(ph * 2.3) * h * 0.085;
    }
    if (coarse) {
      const c = centre();
      const ph = time * 0.00042;
      tx.x = c.x + Math.cos(ph * 1.7) * w * 0.16;
      tx.y = c.y + Math.sin(ph * 2.3) * h * 0.1;
    }

    /* easing: the dot is quick, the ring trails with a spring-ish lerp */
    dot.x += (tx.x - dot.x) * (1 - Math.pow(0.82, k));
    dot.y += (tx.y - dot.y) * (1 - Math.pow(0.82, k));
    const lerpAmt = 1 - Math.pow(0.9, k);
    const nvx = PF.lerp(ring.vx, dot.x - ring.x, lerpAmt * 0.9);
    const nvy = PF.lerp(ring.vy, dot.y - ring.y, lerpAmt * 0.9);
    ring.vx = nvx;
    ring.vy = nvy;
    ring.x = PF.lerp(ring.x, dot.x - ring.vx * 0.55, lerpAmt);
    ring.y = PF.lerp(ring.y, dot.y - ring.vy * 0.55, lerpAmt);

    press = PF.lerp(press, pressT, 1 - Math.pow(0.72, k));

    /* specimen-local pointer driver (the page moves it when idle) */
    if (!coarse && time - lastMove > 2200) {
      const c = centre();
      mx = ring.x - (c.x - specSize() / 2);
      my = ring.y - (c.y - specSize() / 2);
    }
    px += (mx - px) * (1 - Math.pow(0.85, k));
    py += (my - py) * (1 - Math.pow(0.85, k));



    /* the specimen reacts to the pointer */
    if (spec) {
      spec.style.setProperty('--lx', mx.toFixed(1) + 'px');
      spec.style.setProperty('--ly', my.toFixed(1) + 'px');
      spec.classList.toggle('is-near', inSpec);
    }

    /* scene */
    drawScene(time);

    /* portrait drifts a few pixels against the hand — parallax, not wandering */
    if (portrait && !reduce) {
      portrait.style.transform = 'translate3d(' + ((ring.x / w - 0.5) * -16).toFixed(1) + 'px,' +
        ((ring.y / h - 0.5) * -12).toFixed(1) + 'px,0)';
    }
  }

  function specSize() {
    if (!spec) return 0;
    const r = spec.getBoundingClientRect();
    return r.width;
  }

  /* ───────────────────────── boot ───────────────────────── */
  size();
  setStage(0, true);
  window.addEventListener('resize', PF.debounce(function () {
    size(); measure();
    if (!reduce) drawScene(time);
  }, 160));
  PF.tick(frame);

  if (hint) {
    hint.hidden = !coarse;
  }

  /* deep link: #cursor/3 opens act 03 */
  function fromHash() {
    const m = /^#cursor\/(\d+)/.exec(location.hash);
    if (!m) return;
    const i = PF.clamp(parseInt(m[1], 10) - 1, 0, STAGES.length - 1);
    setTimeout(function () { goTo(i); }, 600);
  }
  window.addEventListener('hashchange', fromHash);

  PF.cursorLab = {
    goTo: goTo,
    stages: STAGES,
    get index() { return current; },
    /* kept for the palette + deep links */
    demo: function (i) { if (typeof i === 'number') goTo(i); }
  };
  window.addEventListener('load', fromHash);
  fromHash();
})(window.PF);
