/* sw.js — offline-first shell for the portfolio.
   Bump CACHE when you ship new assets; old caches are dropped on activate. */
const CACHE = 'ym-portfolio-v14';
const OFFLINE = 'offline.html';

const PRECACHE = [
  './',
  'index.html',
  'tools.html',
  'offline.html',
  'fonts.css',
  'css/base.css',
  'css/sections.css',
  'css/tools.css',
  'css/effects.css',
  'css/print.css',
  'js/utils.js', 'js/data.js', 'js/smooth.js', 'js/cursor.js', 'js/intro.js',
  'js/reveal.js', 'js/hero.js', 'js/work.js', 'js/reel.js', 'js/cursorlab.js', 'js/brief.js',
  'js/shader.js', 'js/palette.js', 'js/app.js',
  'js/content.js', 'js/projects-loader.js', 'js/tools.js',
  'content/site.json', 'content/acts.json', 'content/projects.json',
  'content/acts/menus.json', 'content/acts/campaigns.json',
  'content/acts/identity.json', 'content/acts/social.json',
  'content/projects/talabat.json', 'content/projects/sheikh.json',
  'content/projects/alhazem-tech.json', 'content/projects/qandil.json',
  'content/projects/cookin-aboud.json', 'content/projects/menus.json',
  'content/projects/company.json', 'content/projects/seafood.json',
  'assets/spec/menu-page.webp', 'assets/spec/key-visual.webp',
  'assets/spec/applied.webp', 'assets/spec/logo.webp', 'assets/spec/logo-raw.webp',
  'assets/spec/social-1.webp', 'assets/spec/social-2.webp', 'assets/spec/social-3.webp',
  'assets/spec/social-4.webp', 'assets/spec/social-5.webp', 'assets/spec/social-6.webp',
  'assets/spec/mismatch-1.webp', 'assets/spec/mismatch-2.webp',
  'assets/spec/mismatch-3.webp', 'assets/spec/mismatch-4.webp',
  'assets/portrait-cut.webp',
  'assets/portrait-square.webp',
  'assets/work/talabat.webp',
  'assets/work/sheikh.webp',
  'assets/work/alhazem-tech.webp',
  'assets/work/qandil.webp',
  'assets/work/cookin.webp',
  'assets/work/menus.webp',
  'assets/work/company.webp',
  'assets/work/seafood.webp',
  'manifest.webmanifest',
  'assets/icon-192.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // addAll fails the whole install if one file 404s — add individually instead
      return Promise.all(PRECACHE.map(function (url) {
        return cache.add(new Request(url, { cache: 'reload' })).catch(function () { /* ignore */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // network-first for documents, so a new deploy is picked up immediately
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req).then(function (res) {
        const copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) { return hit || caches.match(OFFLINE); });
      })
    );
    return;
  }

  // cache-first for static assets
  event.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(OFFLINE);
      });
    })
  );
});
