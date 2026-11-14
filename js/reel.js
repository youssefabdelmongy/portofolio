/* reel.js — the work cards turn in 3D as you scroll.
   Desktop only needs a little tilt; phones get the full effect because that is
   where a portfolio is usually first seen. One rAF, transform + opacity only,
   and it stops entirely when a card is far from the viewport. */
window.PF = window.PF || {};
(function (PF) {
  if (PF.reduceMotion()) return;
  const grid = document.getElementById('workGrid');
  if (!grid) return;
  const cards = PF.$$('.card', grid);
  if (!cards.length) return;

  const coarse = PF.isCoarse();
  const LIMIT = coarse ? 0.55 : 0.8;      // tilt amount
  const active = new Set();

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (e.isIntersecting) active.add(e.target);
        else active.delete(e.target);
      });
    }, { rootMargin: '18% 0px 18% 0px' });
    cards.forEach(function (c) { io.observe(c); });
  } else {
    cards.forEach(function (c) { active.add(c); });
  }

  /* the gallery inside each card is what turns — the text stays readable */
  const parts = cards.map(function (c) {
    return { card: c, media: PF.$('.card__gallery', c), info: PF.$('.card__info', c) };
  });

  PF.tick(function () {
    if (!active.size) return;
    const vh = window.innerHeight;
    active.forEach(function (card) {
      const p = parts.find(function (x) { return x.card === card; });
      if (!p || !p.media) return;
      const r = card.getBoundingClientRect();
      /* -1 above the fold, 0 centred, +1 below */
      const n = PF.clamp((r.top + r.height / 2 - vh / 2) / (vh * 0.9), -1, 1);
      const near = 1 - Math.abs(n);
      /* gentle: it should read as depth, never as a broken layout */
      p.media.style.willChange = 'transform, opacity';
      p.media.style.transform =
        'perspective(1400px) rotateX(' + (n * 6 * LIMIT).toFixed(2) + 'deg)' +
        ' rotateY(' + (n * -4 * LIMIT).toFixed(2) + 'deg)' +
        ' scale(' + (0.982 + near * 0.018).toFixed(3) + ')';
      p.media.style.opacity = String(0.9 + near * 0.1);
      if (p.info) p.info.style.opacity = String(0.82 + near * 0.18);
    });
  });
})(window.PF);
