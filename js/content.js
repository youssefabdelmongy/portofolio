/* content.js — one source of truth for every word, number and image on the site.
 *
 * HOW IT WORKS
 *   1. Every editable string lives in /content/*.json
 *   2. index.html keeps the markup but its text nodes carry data-t="path.to.key"
 *   3. This file fetches the JSON and overwrites only those text nodes
 *   4. Because the text is ALREADY in the HTML, nothing breaks if JS or the
 *      network fails: crawlers, no-JS visitors and the offline PWA all read
 *      the shipped HTML. The JSON is the override layer, not the source of
 *      the page.
 *
 * WHY NOT RENDER THE PAGE FROM JSON
 *   Client-side rendering would hide all copy from crawlers and would turn
 *   the PWA into a blank page offline. Overriding in place gets the editing
 *   win without losing SEO or offline.
 */
window.PF = window.PF || {};
(function (PF) {
  'use strict';

  var CACHE_KEY = 'pf-content-v1';

  function get(obj, path) {
    return path.split('.').reduce(function (o, k) {
      return o == null ? undefined : o[k];
    }, obj);
  }

  /* set a text node, but never wipe an existing value with undefined */
  function setText(el, value) {
    if (value == null || value === '') return;
    el.textContent = String(value);
  }

  function applyText(doc, content) {
    var nodes = doc.querySelectorAll('[data-t]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var v = get(content, el.getAttribute('data-t'));
      if (v == null) continue;
      if (el.hasAttribute('data-t-html')) el.innerHTML = v;
      else setText(el, v);
    }
  }

  /* lists: a container whose children are rebuilt from an array in the JSON */
  function applyLists(doc, content) {
    var hosts = doc.querySelectorAll('[data-list]');
    for (var i = 0; i < hosts.length; i++) {
      var host = hosts[i];
      var items = get(content, host.getAttribute('data-list'));
      if (!Array.isArray(items) || !items.length) continue;
      var tpl = host.querySelector('template[data-item]');
      if (!tpl) continue;
      var html = items.map(function (item, k) {
        // one pass, so a replacement can never be re-read by the next pattern.
        //   {{.}} = the item itself (lists of plain strings)
        //   {{#}} = 1-based position, zero padded
        //   {{key}} = a field of the item (lists of objects)
        return tpl.innerHTML.replace(/\{\{(.*?)\}\}/g, function (m, key) {
          if (key === '.') return item == null ? '' : String(item);
          if (key === '#') return String(k + 1).padStart(2, '0');
          var val = item == null ? null : item[key];
          return val == null ? '' : String(val);
        });
      }).join('');
      host.innerHTML = html;
    }
  }

  /* attributes that must stay in sync (mailto:, href, alt, images) */
  function applyAttrs(doc, content) {
    var nodes = doc.querySelectorAll('[data-attr]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      // data-attr="href:contact.emailUrl"
      el.getAttribute('data-attr').split(';').forEach(function (pair) {
        var bits = pair.split(':');
        if (bits.length !== 2) return;
        var attr = bits[0].trim();
        var v = get(content, bits[1].trim());
        if (v != null && v !== '') el.setAttribute(attr, v);
      });
    }
  }

  /* fill in the derived values so the JSON can't drift:
     change person.email and every mailto: link follows automatically */
  function derive(content) {
    var person = content && content.person;
    if (!person) return content;
    if (!person.email) return content;
    var mail = person.email;
    if (!person.emailUrl || person.emailUrl.indexOf(mail) === -1) {
      person.emailUrl = 'mailto:' + mail;
    }
    /* WhatsApp: store only digits in person.whatsapp, the wa.me link is derived.
       Works with or without a leading + or 00. */
    if (person.whatsapp) {
      var digits = String(person.whatsapp).replace(/[^0-9]/g, '');
      person.whatsappDigits = digits;
      person.whatsappUrl = 'https://wa.me/' + digits;
      person.whatsappLabel = 'Chat on WhatsApp: +' + digits;
    }

    var contact = content.contact;
    if (contact && contact.mailtoUrl && contact.mailtoUrl.indexOf(mail) === -1) {
      var q = contact.mailtoUrl.indexOf('?');
      contact.mailtoUrl = 'mailto:' + mail + (q > -1 ? contact.mailtoUrl.slice(q) : '');
    }
    return content;
  }

  function applyAll(content) {
    if (!content) return;
    derive(content);
    applyText(document, content);
    applyLists(document, content);
    applyAttrs(document, content);
    // let other modules (cursorlab, work, brief) rewire themselves
    document.dispatchEvent(new CustomEvent('pf:content', { detail: content }));
  }

  /* ── one file per editorial screen ──
   * These used to all live in site.json, which meant six different entries in the
   * CMS pointed at the same path. Pages CMS then resolved "the person file" and
   * "the contact file" to the same object, so a screen that tried to render one
   * entry's fields against another entry's data came out half-empty.
   * Each section now has its own file and its own fields. site.json is still read
   * as a fallback so an older deploy or a stale cache never leaves the page blank.
   */
  var PARTS = ['person', 'hero', 'about', 'contact', 'seo'];

  function merge(target, src) {
    if (!src) return target;
    Object.keys(src).forEach(function (k) {
      var v = src[k];
      var cur = target[k];
      /* deep-merge plain objects so seo.meta and a stray site.json both survive */
      if (v && typeof v === 'object' && !Array.isArray(v) && cur && typeof cur === 'object' && !Array.isArray(cur)) {
        merge(cur, v);
      } else {
        target[k] = v;
      }
    });
    return target;
  }

  PF.contentReady = Promise.all([
    fetch('content/site.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
  ].concat(PARTS.map(function (part) {
    return fetch('content/' + part + '.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  })))
    .then(function (results) {
      var content = results[0] || {};
      var anyPart = false;
      results.slice(1).forEach(function (part) {
        if (!part) return;
        anyPart = true;
        /* a part file may be flat ({name:...}) or wrapped ({person:{...}}) */
        var keys = Object.keys(part);
        if (keys.length === 1 && part[keys[0]] && typeof part[keys[0]] === 'object' && !Array.isArray(part[keys[0]])) {
          merge(content, part);
        } else {
          merge(content, {});
        }
      });
      if (!anyPart && !Object.keys(content).length) throw new Error('no content');
      return content;
    })
    .then(function (content) {
      PF.content = content;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(content)); } catch (e) {}
      applyAll(content);
      return content;
    })
    .catch(function () {
      /* offline or missing file: fall back to the last good copy, then to the HTML */
      try {
        var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached) { PF.content = cached; applyAll(cached); return cached; }
      } catch (e) {}
      return null;
    });
})(window.PF);
