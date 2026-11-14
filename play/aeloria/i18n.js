// Aeloria: Age of Crowns — runtime localisation. English is the source language; translations live in
// i18n/<lang>.js as { "English text": "translation" }, with {0}, {1}… standing for numbers and {name}
// for the player's name. Every text node, tooltip and canvas label is translated as it appears, so the
// rest of the game is written in plain English.
'use strict';
const I18N = (() => {
  const LANGS = { en: 'English', ar: 'العربية', zh: '中文', de: 'Deutsch', ru: 'Русский' };
  const STORE_KEY = 'aeloria-lang';
  const NUM = /\d+(?:[.,]\d+)*(?:[KMB](?![A-Za-z]))?/g;
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'NOSCRIPT']);
  const ATTRS = ['title', 'placeholder', 'aria-label', 'alt', 'data-l'];

  const detect = () => {
    try { const s = localStorage.getItem(STORE_KEY); if (s && LANGS[s]) return s; } catch (e) { }
    for (const l of (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'])) {
      const p = String(l).slice(0, 2).toLowerCase(); if (LANGS[p]) return p;
    }
    return 'en';
  };
  let lang = detect(), D = null, cache = new Map();
  const dict = () => (window.AELORIA_I18N && window.AELORIA_I18N[lang]) || null;

  const playerName = () => { try { return (typeof S !== 'undefined' && S && S.name) || ''; } catch (e) { return ''; } };

  // Translate one string; returns the input unchanged when there is no translation.
  function tr(s) {
    if (lang === 'en' || !s || typeof s !== 'string') return s;
    if (!D) D = dict(); if (!D) return s;
    const hit = cache.get(s); if (hit !== undefined) return hit;
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), core = m[2].replace(/\s+/g, ' ');
    let v;
    if (/[A-Za-z]/.test(core)) {
      v = D[core];
      if (v === undefined) v = withNumbers(core);
      if (v === undefined) {   // the player's name inside a sentence
        const nm = playerName();
        if (nm && core.includes(nm)) { const k = core.split(nm).join('{name}'); v = D[k] ?? withNumbers(k); if (v !== undefined) v = v.split('{name}').join(nm); }
      }
    }
    if (v === undefined && core.includes(' · ')) {   // "Frostmark · 924", "Omar · Barracks": translate each part
      const parts = core.split(' · '), done = parts.map(p => tr(p));
      if (done.some((p, i) => p !== parts[i])) v = done.join(' · ');
    }
    if (v === undefined) {   // "Emir Finn": a known title in front of a generated name
      const sp = core.indexOf(' ');
      if (sp > 0 && sp < core.length - 1) { const head = core.slice(0, sp), t1 = D[head]; if (t1 !== undefined && /^[A-Z][a-z]+$/.test(core.slice(sp + 1))) v = t1 + ' ' + core.slice(sp + 1); }
    }
    const out = v === undefined ? s : m[1] + v + m[3];
    if (cache.size > 30000) cache = new Map();
    cache.set(s, out); return out;
  }
  function withNumbers(core) {
    const nums = []; const k = core.replace(NUM, x => `{${nums.push(x) - 1}}`);
    if (!nums.length) return undefined;
    const v = D[k]; if (v === undefined) return undefined;
    return v.replace(/\{(\d+)\}/g, (a, i) => nums[i] ?? '');
  }

  // ---- DOM: translate text as it is rendered, remembering the English so the language can change live.
  const ORIG = new WeakMap();
  const skipEl = el => !el || SKIP.has(el.nodeName) || (el.closest && el.closest('.notr,[data-notr]'));
  function textNode(n) {
    const cur = n.nodeValue; if (!cur || !/[A-Za-z]/.test(cur)) return;
    const o = ORIG.get(n); if (o && o.out === cur) return;
    if (skipEl(n.parentNode)) return;
    const out = tr(cur); ORIG.set(n, { src: cur, out });
    if (out !== cur) n.nodeValue = out;
  }
  function attrs(el) {
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const cur = el.getAttribute(a), keep = el.getAttribute('data-en-' + a);
      const src = keep !== null && tr(keep) === cur ? keep : cur;
      if (keep === null || src !== keep) el.setAttribute('data-en-' + a, src);
      const out = tr(src); if (out !== cur) el.setAttribute(a, out);
    }
  }
  function walk(root) {
    if (root.nodeType === 3) return textNode(root);
    if (root.nodeType !== 1 || skipEl(root)) return;
    attrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n; while ((n = w.nextNode())) { if (n.nodeType === 3) textNode(n); else if (!skipEl(n)) attrs(n); }
  }
  const obs = new MutationObserver(list => {
    if (lang === 'en') return;
    for (const m of list) {
      if (m.type === 'characterData') textNode(m.target);
      else if (m.type === 'attributes') { if (ATTRS.includes(m.attributeName)) attrs(m.target); }
      else m.addedNodes.forEach(walk);
    }
  });

  // ---- Canvas: map labels, battle numbers and names are drawn as text.
  const P = CanvasRenderingContext2D.prototype;
  for (const fn of ['fillText', 'strokeText', 'measureText']) {
    const orig = P[fn]; P[fn] = function (t, ...rest) { return orig.call(this, lang === 'en' ? t : tr(String(t)), ...rest); };
  }

  function applyDocLang() {
    const h = document.documentElement; h.lang = lang === 'zh' ? 'zh-Hans' : lang; h.dataset.lang = lang;
  }
  function restoreAll(root) {   // put the English back before re-translating into another language
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); let n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) { const o = ORIG.get(n); if (o && n.nodeValue === o.out) n.nodeValue = o.src; ORIG.delete(n); }
      else for (const a of ATTRS) { const k = n.getAttribute && n.getAttribute('data-en-' + a); if (k !== null && k !== undefined) n.setAttribute(a, k); }
    }
  }
  function set(code) {
    if (!LANGS[code] || code === lang) return;
    restoreAll(document.body); lang = code; D = dict(); cache = new Map();
    try { localStorage.setItem(STORE_KEY, code); } catch (e) { }
    applyDocLang(); if (lang !== 'en') walk(document.body);
    try { if (window.AeloriaNative && window.AeloriaNative.setLang) window.AeloriaNative.setLang(code); } catch (e) { }
    try { if (typeof render === 'function' && typeof S !== 'undefined' && S && S.b) render(); } catch (e) { }
    document.querySelectorAll('select.langsel').forEach(s => { s.value = lang; });
    window.dispatchEvent(new Event('aelorialang'));
  }
  function start() {
    applyDocLang(); D = dict();
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    if (lang !== 'en') walk(document.body);
    try { if (window.AeloriaNative && window.AeloriaNative.setLang) window.AeloriaNative.setLang(lang); } catch (e) { }
    const top = document.getElementById('langTop'); if (top) { top.innerHTML = '<span aria-hidden="true">🌐</span>' + picker('langSelTop'); ['pointerdown', 'click', 'touchstart'].forEach(ev => top.addEventListener(ev, e => e.stopPropagation())); }
  }

  // A language menu (native names, never translated).
  const picker = (id = '') => `<select class="langsel notr" ${id ? `id="${id}"` : ''} aria-label="Language">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === lang ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
  document.addEventListener('change', e => { if (e.target && e.target.classList && e.target.classList.contains('langsel')) set(e.target.value); });

  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  return { tr, set, picker, get lang() { return lang; }, LANGS };
})();
