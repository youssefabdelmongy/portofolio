/* projects-loader.js — builds the Selected Work grid from /content/projects/*.json
 *
 * The grid is rendered here rather than kept in index.html, because adding a
 * project should be "drop a JSON file + add its id" instead of editing markup.
 * index.html still ships the full grid as a no-JS fallback; this module
 * replaces it once the JSON arrives.
 */
window.PF = window.PF || {};
(function (PF) {
  'use strict';

  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  function figure(src, alt, k) {
    var f = el('figure', 'shot shot--' + k);
    var img = el('img', '', {
      src: src.base, srcset: src.sm + ' 640w, ' + src.base + ' 1400w',
      sizes: '(max-width:900px) 92vw, 46vw',
      alt: alt, loading: 'lazy', decoding: 'async', width: '1000', height: '1000'
    });
    f.appendChild(img);
    return f;
  }

  /* "assets/work/talabat.webp" -> { base, sm } where sm is the 640px copy */
  function variants(path) {
    return { base: path, sm: path.replace(/\.webp$/, '-sm.webp') };
  }

  function card(p, i) {
    var a = el('article', 'card', { role: 'listitem', 'data-index': String(i) });
    a.style.setProperty('--shot-bg', p.bg || '#111');

    var shots = [p.img].concat(p.gallery || []).filter(Boolean).slice(0, 3);
    var g = el('div', 'card__gallery card__gallery--' + shots.length);
    shots.forEach(function (s, k) {
      g.appendChild(figure(variants(s), p.alt + ' — frame ' + (k + 1), k));
    });
    a.appendChild(g);

    var info = el('div', 'card__info');
    info.appendChild(el('span', 'card__n mono', {})).textContent = String(i + 1).padStart(2, '0');
    var h3 = el('h3', 'card__title');
    h3.textContent = p.title;
    info.appendChild(h3);
    var kind = el('p', 'card__kind mono');
    kind.textContent = [p.kind, p.year].filter(Boolean).join(' · ');
    info.appendChild(kind);
    var open = el('button', 'card__open', {
      type: 'button', 'aria-label': 'Open case study: ' + p.title
    });
    open.textContent = '↗';
    info.appendChild(open);
    a.appendChild(info);
    return a;
  }

  function normalize(list) {
    // the legacy shape used `gallery` for the secondary shots and `img` for the hero
    return list.map(function (p) {
      var out = Object.assign({}, p);
      out.gallery = (p.gallery || []).filter(function (s) { return s !== p.img; });
      return out;
    });
  }

  PF.projectsReady = Promise.all([
    fetch('content/projects.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }),
    PF.contentReady || Promise.resolve(null)
  ]).then(function (res) {
    var order = (res[0] && res[0].order) || [];
    return Promise.all(order.map(function (id) {
      return fetch('content/projects/' + id + '.json', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error(id); return r.json(); })
        .then(function (data) { data.id = id; return data; })
        .catch(function () { return null; });   // a missing file must not kill the grid
    }));
  }).then(function (raw) {
    var projects = normalize(raw.filter(Boolean));
    if (!projects.length) return [];

    PF.projects = projects;
    PF.DATA = PF.DATA || {};
    PF.DATA.projects = projects;

    var grid = document.querySelector('#workGrid') || document.querySelector('.work__grid');
    if (grid) {
      grid.innerHTML = '';
      projects.forEach(function (p, i) { grid.appendChild(card(p, i)); });
    }
    document.dispatchEvent(new CustomEvent('pf:projects', { detail: projects }));
    return projects;
  }).catch(function () {
    /* no JSON: the cards already in the HTML stay, nothing breaks */
    return [];
  });
})(window.PF);
