// Aeloria: Age of Crowns — every picture in the game is drawn here in code (SVG + canvas).
// Painted art can replace any hero, foe or key art: list the files in art/manifest.json (see ART_BIBLE.md).
'use strict';
const ART = (() => {
  let UID = 0; const uid = p => p + (++UID);
  const svg = (vb, inner, cls = '') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" class="${cls}" aria-hidden="true">${inner}</svg>`;
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255; const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join(''); };

  /* ---------- painted-art overrides (art/manifest.json) ---------- */
  let MAN = {};
  fetch('art/manifest.json').then(r => r.ok ? r.json() : {}).then(j => { MAN = j || {}; window.dispatchEvent(new Event('artready')); }).catch(() => { });
  const painted = (kind, id, s, cls = 'portrait') => MAN[kind] && MAN[kind][id] ? `<img src="art/${MAN[kind][id]}" width="${s}" height="${s}" class="${cls} painted" alt="" loading="lazy" decoding="async">` : null;

  /* ---------- emblem: crown over a radiant sun on a shield ---------- */
  const crownPath = (fill, stroke) => `<path d="M30 46l-4-20 12 10 12-16 12 16 12-10-4 20z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/><rect x="29" y="45" width="42" height="7" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/><circle cx="50" cy="20" r="3.2" fill="#ff5e7a"/><circle cx="26" cy="26" r="2.4" fill="#3fd7c8"/><circle cx="74" cy="26" r="2.4" fill="#3fd7c8"/>`;
  const emblem = (size = 64) => {
    const u = uid('e');
    return svg('0 0 100 100', `<defs><linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1c4"/><stop offset=".45" stop-color="#ffd36b"/><stop offset="1" stop-color="#b9741f"/></linearGradient>
      <linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4a8a"/><stop offset="1" stop-color="#0e1838"/></linearGradient>
      <radialGradient id="${u}r" cx="50%" cy="62%" r="45%"><stop offset="0" stop-color="#fff1c4"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient></defs>
      <path d="M50 3l42 13v30c0 27-19 43-42 51C27 89 8 73 8 46V16z" fill="url(#${u}g)"/>
      <path d="M50 10l35 11v25c0 23-16 37-35 44-19-7-35-21-35-44V21z" fill="url(#${u}s)"/>
      <g opacity=".9">${Array.from({ length: 12 }, (_, i) => `<path d="M50 64L${50 + Math.cos(i * Math.PI / 6) * 30} ${64 + Math.sin(i * Math.PI / 6) * 30}" stroke="#ffd36b" stroke-width="${i % 2 ? 1.2 : 2.4}" opacity=".6"/>`).join('')}</g>
      <circle cx="50" cy="64" r="22" fill="url(#${u}r)"/><circle cx="50" cy="64" r="9" fill="#fff1c4"/>
      <g transform="translate(0 4)">${crownPath(`url(#${u}g)`, '#7e4a22')}</g>`).replace('<svg ', `<svg width="${size}" height="${size}" `);
  };

  /* ---------- icons ---------- */
  const IC = {
    grain: '<g><path d="M12 22V6" stroke="#8a5a1c" stroke-width="1.6"/><g fill="#f0c04a"><ellipse cx="12" cy="6" rx="2" ry="3.4"/><ellipse cx="9" cy="10" rx="2" ry="3.2" transform="rotate(-30 9 10)"/><ellipse cx="15" cy="10" rx="2" ry="3.2" transform="rotate(30 15 10)"/><ellipse cx="9" cy="15" rx="2" ry="3.2" transform="rotate(-30 9 15)"/><ellipse cx="15" cy="15" rx="2" ry="3.2" transform="rotate(30 15 15)"/></g></g>',
    timber: '<g><rect x="3" y="9" width="17" height="7" rx="3.5" fill="#9c5f2e"/><ellipse cx="20" cy="12.5" rx="3" ry="3.5" fill="#e3b07a"/><circle cx="20" cy="12.5" r="1.4" fill="#9c5f2e"/><rect x="5" y="15" width="12" height="6" rx="3" fill="#7e4a22"/></g>',
    stone: '<g><path d="M3 18l3-8 7-3 7 4 1 8-6 3H7z" fill="#a9a39a"/><path d="M6 10l7-3 7 4-7 2z" fill="#d6d0c6"/><path d="M13 13l7-2 1 8-6 3z" fill="#857f77"/></g>',
    ore: '<g><path d="M4 17l4-9h8l4 9-8 4z" fill="#5a6f86"/><path d="M8 8h8l-4 6z" fill="#c9d6e3"/><path d="M4 17l8-3 8 3-8 4z" fill="#3f4f63"/></g>',
    gold: '<g><circle cx="12" cy="12" r="9" fill="#e8a33d"/><circle cx="12" cy="12" r="6.5" fill="#ffd36b"/><path d="M8 14l1-5 3 3 3-3 1 5z" fill="#b9741f"/></g>',
    gem: '<g><path d="M5 9l3-4h8l3 4-7 11z" fill="#3fd7c8"/><path d="M5 9h14l-7 11z" fill="#1fa596"/><path d="M8 5l1 4h6l1-4" fill="#9ff4ea"/></g>',
    essence: '<g><path d="M12 2l6 8-6 12-6-12z" fill="#ff7a2a"/><path d="M12 2l6 8-6 3-6-3z" fill="#ffd36b"/><path d="M12 13l6-3-6 12z" fill="#c0392b"/></g>',
    might: '<g><path d="M12 2l3 6 6 1-4.5 4.5 1 6.5L12 17l-5.5 3 1-6.5L3 9l6-1z" fill="#ff7a59"/></g>',
    vigor: '<g><path d="M13 2L5 13h6l-2 9 9-12h-6z" fill="#ffd36b"/></g>',
    clock: '<g fill="none" stroke="#f2e6cf" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></g>',
    help: '<g><path d="M4 14c3-1 5-4 8-4s3 2 6 2l2 4c-3 2-6 3-9 3-3 0-5-2-7-5z" fill="#ffd36b"/><path d="M8 9l3-4 3 4" stroke="#f2e6cf" stroke-width="2" fill="none"/></g>',
    shield: '<g><path d="M12 2l8 3v6c0 6-4 9-8 11-4-2-8-5-8-11V5z" fill="#3fd7c8"/><path d="M12 5l5 2v4c0 4-2.5 6-5 7.5z" fill="#1fa596"/></g>',
    crate: '<g><rect x="3" y="6" width="18" height="14" rx="2" fill="#9c5f2e"/><path d="M3 10h18M12 6v14" stroke="#e8a33d" stroke-width="2"/></g>',
    scroll: '<g><rect x="5" y="4" width="14" height="16" rx="2" fill="#f2e6cf"/><path d="M8 9h8M8 12h8M8 15h5" stroke="#9c5f2e" stroke-width="1.5"/></g>',
    chest: '<g><rect x="3" y="9" width="18" height="11" rx="2" fill="#9c5f2e"/><path d="M3 11c0-5 4-7 9-7s9 2 9 7z" fill="#c07a3a"/><rect x="10" y="10" width="4" height="5" rx="1" fill="#ffd36b"/></g>'
  };
  const icon = (k, s = 18) => MAN.icons && MAN.icons[k] ? `<img class="ic pic" src="art/${MAN.icons[k]}" width="${Math.round(s * 1.25)}" height="${Math.round(s * 1.25)}" alt="">` : `<svg width="${s}" height="${s}" viewBox="0 0 24 24" class="ic" aria-hidden="true">${IC[k] || IC.scroll}</svg>`;

  const iconSvg = (k, s = 22) => MAN.icons && MAN.icons[k] ? `<image href="art/${MAN.icons[k]}" x="${-s * .1}" y="${-s * .1}" width="${s * 1.2}" height="${s * 1.2}"/>` : icon(k, s).replace(/<svg[^>]*>/, `<svg width="${s}" height="${s}" viewBox="0 0 24 24">`);

  /* ---------- troops ---------- */
  const TROOP_ART = {
    inf: c => `<path d="M34 6l2 52" stroke="#8a6a3c" stroke-width="3"/><path d="M31 2l4-4 4 4-4 9z" fill="#cfd8e2"/><path d="M14 26c0-8 4-12 9-12s9 4 9 12" fill="#9aa6b2"/><circle cx="23" cy="25" r="6" fill="#e0b08a"/><path d="M15 23h16l-2-6H17z" fill="#9aa6b2"/><path d="M14 32h18l2 22H12z" fill="${c}"/><path d="M6 30c0 12 4 18 10 22V30z" fill="${c}"/><path d="M6 30h10v22c-6-4-10-10-10-22z" fill="none" stroke="#e8c35a" stroke-width="2"/>`,
    rng: c => `<path d="M44 8c12 12 12 34 0 46" stroke="#7e4a22" stroke-width="3" fill="none"/><path d="M44 8v46" stroke="#f2e6cf" stroke-width="1"/><path d="M14 31h32" stroke="#c9b48a" stroke-width="2"/><path d="M48 31l-5-3v6z" fill="#cfd8e2"/><circle cx="24" cy="21" r="6" fill="#e0b08a"/><path d="M16 20c0-9 16-9 16 0l-3-2H19z" fill="${c}"/><path d="M15 28h18l2 26H13z" fill="${c}"/><path d="M13 22l-4 10 6-2z" fill="${c}"/>`,
    cav: c => `<path d="M8 40c0-8 8-12 20-12h14l6-10 5 2-2 10c3 3 3 8 0 11z" fill="#8a5a3a"/><path d="M48 18l4-6 3 2-2 6z" fill="#8a5a3a"/><path d="M42 20c2-4 6-6 9-4" stroke="#3a2414" stroke-width="3" fill="none"/><path d="M12 46v12M20 46v12M40 46v12M46 44v12" stroke="#5a3418" stroke-width="3"/><path d="M8 40c-4 2-6 8-4 12" stroke="#3a2414" stroke-width="3" fill="none"/><circle cx="28" cy="12" r="5" fill="#e0b08a"/><path d="M22 10h12l-2-5h-8z" fill="#9aa6b2"/><path d="M22 16h12v12H22z" fill="${c}"/><path d="M34 18l16-14" stroke="#cfd8e2" stroke-width="2"/><path d="M14 30h20v6H14z" fill="${c}" opacity=".85"/>`,
    sie: c => `<rect x="8" y="40" width="44" height="7" rx="2" fill="#7e4a22"/><circle cx="16" cy="50" r="7" fill="#5a3418"/><circle cx="44" cy="50" r="7" fill="#5a3418"/><circle cx="16" cy="50" r="2" fill="#e8a33d"/><circle cx="44" cy="50" r="2" fill="#e8a33d"/><path d="M20 40l10-26 10 26" fill="none" stroke="#9c5f2e" stroke-width="3"/><path d="M12 30L48 8" stroke="#9c5f2e" stroke-width="4"/><circle cx="12" cy="30" r="5" fill="#857f77"/><path d="M48 8l4 10" stroke="${c}" stroke-width="2"/>`
  };
  const troop = (type, tier, s = 56) => {
    const tp = asset('troops', type); if (tp) return `<span class="tpaint t${tier}" style="width:${s}px;height:${s}px"><img src="${tp}" alt="" loading="lazy"><i>${'I'.repeat(tier)}</i></span>`;
    const c = ['#b3433a', '#2f5a8a', '#7a4fb3'][tier - 1] || '#b3433a';
    return `<svg width="${s}" height="${s}" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="32" r="28" fill="#1d1530"/>${TROOP_ART[type](c)}<text x="54" y="14" font-size="11" font-weight="800" fill="#ffd36b" text-anchor="end">${'I'.repeat(tier)}</text></svg>`;
  };

  /* ---------- hero portraits ---------- */
  const FEM = new Set(['astrid', 'sigrun', 'elowen', 'rania', 'layla', 'saqr', 'lian', 'kaimana', 'amara', 'zarqa']);
  const MOTIF = {
    frostmark: c => `<g fill="none" stroke="${c}" stroke-width="2" opacity=".35">${[0, 60, 120].map(a => `<path d="M50 6v56M38 14l12 8 12-8M38 54l12-8 12 8" transform="rotate(${a} 50 34)"/>`).join('')}</g>`,
    greenhold: c => `<g fill="${c}" opacity=".3"><path d="M18 40c-8-14 2-30 18-30-2 14-8 24-18 30z"/><path d="M82 30c8-14-2-28-18-26 2 12 8 22 18 26z"/><path d="M78 70c10-6 14-18 8-28-8 6-12 16-8 28z"/></g>`,
    amber: c => `<g opacity=".35"><circle cx="72" cy="30" r="16" fill="${c}"/>${Array.from({ length: 12 }, (_, i) => `<path d="M72 30L${72 + Math.cos(i * .52) * 34} ${30 + Math.sin(i * .52) * 34}" stroke="${c}" stroke-width="1.5"/>`).join('')}</g>`,
    jade: c => `<g opacity=".35" fill="${c}"><path d="M10 40c10-10 30-10 40 0-10 6-30 6-40 0z"/><path d="M56 22c8-8 24-8 32 0-8 5-24 5-32 0z"/><circle cx="80" cy="64" r="7"/><path d="M80 57v-8M80 71v6" stroke="${c}"/></g>`,
    coral: c => `<g fill="none" stroke="${c}" stroke-width="3" opacity=".35"><path d="M0 70c10-8 20-8 30 0s20 8 30 0 20-8 30 0 20 8 30 0"/><path d="M0 84c10-8 20-8 30 0s20 8 30 0 20-8 30 0"/></g>`,
    sunveldt: c => `<g opacity=".3" fill="${c}"><path d="M60 64c0-20 20-26 30-18-4-12-24-14-32-2-6 8-4 16 2 20z"/><circle cx="24" cy="24" r="12"/></g>`
  };
  // Hair back layers (drawn behind the body) and front layers (over the forehead)
  const HAIR_BACK = {
    braids: c => `<path d="M30 44c-4 14-4 30 0 44l6-2c-2-12-2-26 2-40zM70 44c4 14 4 30 0 44l-6-2c2-12 2-26-2-40z" fill="${c}"/><g fill="${shade(c, -.25)}">${[56, 64, 72, 80].map(y => `<ellipse cx="32" cy="${y}" rx="4" ry="3"/><ellipse cx="68" cy="${y}" rx="4" ry="3"/>`).join('')}</g>`,
    long: c => `<path d="M30 36c-6 20-8 40-4 62h48c4-22 2-42-4-62z" fill="${c}"/><path d="M34 60c-2 12-2 24 0 36M66 60c2 12 2 24 0 36" stroke="${shade(c, -.2)}" stroke-width="2" fill="none"/>`,
    wavy: c => `<path d="M28 34c-8 14-6 24-10 34 6 8 2 16 8 26h48c6-10 2-18 8-26-4-10-2-20-10-34z" fill="${c}"/><path d="M26 66c4 6 2 14 6 20M74 66c-4 6-2 14-6 20" stroke="${shade(c, -.25)}" stroke-width="2.5" fill="none"/>`,
    curly: c => `<g fill="${c}">${[[30, 34, 10], [26, 48, 10], [28, 62, 10], [70, 34, 10], [74, 48, 10], [72, 62, 10], [50, 22, 14], [36, 24, 11], [64, 24, 11], [32, 74, 8], [68, 74, 8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`,
    afro: c => `<circle cx="50" cy="34" r="27" fill="${c}"/><g fill="${shade(c, .12)}" opacity=".5">${[[36, 18], [58, 14], [72, 30], [30, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>`,
    locs: c => `<g stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none">${[[33, 40, 28, 74], [37, 38, 34, 80], [63, 38, 66, 80], [67, 40, 72, 74], [42, 30, 38, 66], [58, 30, 62, 66]].map(([a, b, c2, d]) => `<path d="M${a} ${b}C${a - 3} ${b + 14} ${c2 + 3} ${d - 14} ${c2} ${d}"/>`).join('')}</g>`,
    bun: c => `<circle cx="50" cy="14" r="9" fill="${c}"/>`,
    tied: c => `<path d="M58 22c10-2 16 4 16 10-4-2-8-2-10 0z" fill="${c}"/>`,
    topknot: c => `<path d="M46 10c0-6 8-6 8 0v8h-8z" fill="${c}"/><rect x="45" y="15" width="10" height="3" fill="#c9a24a"/>`
  };
  const HAIR_FRONT = {
    braids: c => `<path d="M33 40c0-14 8-20 17-20s17 6 17 20c-4-6-10-10-17-10-2 4-10 8-17 10z" fill="${c}"/><path d="M50 21v9" stroke="${shade(c, -.2)}" stroke-width="1.2"/>`,
    long: c => `<path d="M33 42c0-16 8-22 17-22s17 6 17 22c-2-8-8-14-14-14-6 6-12 10-20 14z" fill="${c}"/>`,
    wavy: c => `<path d="M33 42c-2-16 8-23 17-23 10 0 19 6 17 23-4-10-10-14-18-12 2 4-6 10-16 12z" fill="${c}"/>`,
    short: c => `<path d="M34 40c0-14 7-20 16-20s16 6 16 20c-2-4-4-8-8-9-6 3-14 3-20 0-2 3-3 6-4 9z" fill="${c}"/>`,
    curly: c => `<g fill="${c}">${[[38, 28, 7], [46, 24, 7], [54, 24, 7], [62, 28, 7], [35, 35, 5], [65, 35, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`,
    afro: c => `<path d="M34 38c0-12 7-18 16-18s16 6 16 18c-4-5-10-7-16-7s-12 2-16 7z" fill="${c}"/>`,
    locs: c => `<path d="M34 38c0-12 7-18 16-18s16 6 16 18c-3-4-8-7-16-7s-13 3-16 7z" fill="${c}"/>`,
    bun: c => `<path d="M34 40c0-14 7-21 16-21s16 7 16 21c-3-7-8-11-16-11s-13 4-16 11z" fill="${c}"/><path d="M50 19v10" stroke="${shade(c, .2)}" stroke-width="1"/>`,
    tied: c => `<path d="M34 40c0-14 7-20 16-20s16 6 16 20c-3-6-9-9-16-9s-13 3-16 9z" fill="${c}"/>`,
    topknot: c => `<path d="M35 38c0-12 7-18 15-18s15 6 15 18c-3-5-8-8-15-8s-12 3-15 8z" fill="${c}"/>`,
    scarf: () => '', hidden: () => ''
  };
  const HEADWEAR = {
    none: () => '',
    wingedhelm: (L, m) => `<path d="M32 36c0-14 8-20 18-20s18 6 18 20z" fill="${m}"/><path d="M32 36h36v4H32z" fill="${shade(m, -.3)}"/><path d="M48 36h4v12h-4z" fill="${shade(m, -.15)}"/><path d="M33 30c-8-6-14-14-14-22 6 4 12 10 16 18z" fill="#f2ede4"/><path d="M67 30c8-6 14-14 14-22-6 4-12 10-16 18z" fill="#f2ede4"/><path d="M38 22c6-4 18-4 24 0" stroke="#fff" stroke-width="1.5" opacity=".6" fill="none"/>`,
    hood: (L) => `<path d="M24 70c-6-32 6-56 26-56s32 24 26 56c-4-4-6-10-6-20 0-14-8-24-20-24S30 36 30 50c0 10-2 16-6 20z" fill="${L.outfit[0]}"/><path d="M30 50c0-14 8-24 20-24s20 10 20 24" fill="none" stroke="${L.outfit[1]}" stroke-width="1.5" opacity=".7"/>`,
    hoodmask: (L) => `<path d="M24 72c-6-34 6-58 26-58s32 24 26 58c-4-4-6-12-6-22 0-14-8-24-20-24S30 36 30 50c0 10-2 18-6 22z" fill="${L.outfit[0]}"/><path d="M36 52c4 4 24 4 28 0v10c-4 6-24 6-28 0z" fill="${shade(L.outfit[0], .1)}"/><path d="M36 52c8 3 20 3 28 0" stroke="${L.outfit[1]}" stroke-width="1.2" fill="none"/>`,
    leafcrown: () => `<g>${[-28, -18, -8, 2, 12, 22, 32].map((a, i) => `<ellipse cx="${50 + a * .62}" cy="${27 + Math.abs(a) * .12}" rx="4" ry="2.2" fill="${i % 2 ? '#6fbf5a' : '#3e8a4a'}" transform="rotate(${a * 1.6} ${50 + a * .62} ${27 + Math.abs(a) * .12})"/>`).join('')}<circle cx="50" cy="25" r="2" fill="#f0a0c0"/></g>`,
    headscarf: (L) => `<path d="M30 46c-2-18 6-28 20-28s22 10 20 28c-2-8-8-14-20-14s-18 6-20 14z" fill="${L.headColor}"/><path d="M30 46c-2 12 0 24 6 30h-10c-4-10-2-22 4-30zM70 46c2 12 0 24-6 30h10c4-10 2-22-4-30z" fill="${L.headColor}"/><path d="M32 40c8-6 28-6 36 0" stroke="${L.outfit[1]}" stroke-width="2" fill="none"/>`,
    crown: () => `<g transform="translate(14 1) scale(.72)">${crownPath('#ffd36b', '#b9741f')}</g>`,
    hairpins: () => `<path d="M40 16l20 6M44 10l14 14" stroke="#f2e6cf" stroke-width="1.5"/><circle cx="60" cy="22" r="2.6" fill="#3fd7c8"/><circle cx="58" cy="24" r="2" fill="#7fffd4"/><path d="M58 24l2 8" stroke="#c9a24a" stroke-width="1"/><circle cx="60" cy="33" r="1.6" fill="#ff7a9c"/>`,
    flower: () => `<g transform="translate(66 30)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-5" rx="3.6" ry="5.5" fill="#ff7a8a" transform="rotate(${a})"/>`).join('')}<circle r="2.4" fill="#ffd36b"/></g>`,
    goggles: () => `<rect x="33" y="30" width="34" height="6" rx="3" fill="#5a3418"/><circle cx="42" cy="32" r="5.5" fill="#9fc3e6" stroke="#c9a24a" stroke-width="2"/><circle cx="58" cy="32" r="5.5" fill="#9fc3e6" stroke="#c9a24a" stroke-width="2"/><circle cx="40" cy="30" r="1.6" fill="#fff"/><circle cx="56" cy="30" r="1.6" fill="#fff"/>`
  };
  const ARMOR = {
    plate: (o) => `<path d="M14 100c2-14 10-22 24-26l12 6 12-6c14 4 22 12 24 26z" fill="${o[2]}"/><ellipse cx="22" cy="82" rx="12" ry="9" fill="${shade(o[2], .15)}" stroke="${shade(o[2], -.35)}"/><ellipse cx="78" cy="82" rx="12" ry="9" fill="${shade(o[2], .15)}" stroke="${shade(o[2], -.35)}"/><path d="M38 80l12 8 12-8v20H38z" fill="${o[0]}"/><path d="M44 86l6 6 6-6" stroke="${o[1]}" stroke-width="2" fill="none"/><path d="M14 92c8-2 12-2 18 0M68 92c6-2 10-2 18 0" stroke="${shade(o[2], -.3)}" fill="none"/>`,
    fur: (o) => `<path d="M12 100c2-14 10-22 26-26l12 4 12-4c16 4 24 12 26 26z" fill="${o[0]}"/><path d="M14 84c6-6 10-8 16-10l4 4 4-5 4 4 4-4 4 5 4-4 4 5 4-4 4 4 4-4c6 2 10 4 16 10-8 0-12 2-16 0l-4 4-4-4-4 4-4-4-4 4-4-4-4 4-4-4-4 4-4-4-4 4z" fill="${o[1]}"/><circle cx="50" cy="90" r="4" fill="${o[2]}" stroke="${shade(o[2], -.3)}"/>`,
    robe: (o) => `<path d="M12 100c2-14 10-22 26-26l12 10 12-10c16 4 24 12 26 26z" fill="${o[0]}"/><path d="M38 74l12 10 12-10" stroke="${o[1]}" stroke-width="3" fill="none"/><path d="M50 84v16" stroke="${o[1]}" stroke-width="2"/><path d="M20 90c4-2 8-2 12 2M80 90c-4-2-8-2-12 2" stroke="${shade(o[0], -.3)}" stroke-width="2" fill="none"/>`,
    leather: (o) => `<path d="M12 100c2-14 10-22 26-26l12 6 12-6c16 4 24 12 26 26z" fill="${o[0]}"/><path d="M30 76l40 24M70 76L46 100" stroke="${shade(o[0], -.35)}" stroke-width="4"/><circle cx="50" cy="88" r="3" fill="${o[2]}"/><path d="M16 88c6-4 12-4 16 0" stroke="${o[1]}" stroke-width="2" fill="none"/>`,
    lamellar: (o) => `<path d="M12 100c2-14 10-22 26-26l12 6 12-6c16 4 24 12 26 26z" fill="${o[0]}"/><g fill="none" stroke="${o[2]}" stroke-width="1.2" opacity=".8">${[82, 88, 94].map(y => `<path d="M${18 + (y - 82) / 3} ${y}h${64 - (y - 82) / 1.5}"/>`).join('')}${[24, 32, 40, 48, 56, 64, 72].map(x => `<path d="M${x} 80v20"/>`).join('')}</g><path d="M14 84c4-8 10-10 18-10l-2 14z" fill="${o[1]}"/><path d="M86 84c-4-8-10-10-18-10l2 14z" fill="${o[1]}"/>`,
    silk: (o) => `<path d="M12 100c2-14 10-22 26-26l12 4 12-4c16 4 24 12 26 26z" fill="${o[0]}"/><path d="M40 72l10 18 10-18" fill="${o[1]}"/><path d="M38 74l12 22M62 74L50 96" stroke="${o[2]}" stroke-width="2.5"/><path d="M18 92c8-6 14-6 20-2M82 92c-8-6-14-6-20-2" stroke="${shade(o[0], .25)}" stroke-width="1.5" fill="none"/>`,
    wrap: (o, L) => `<path d="M12 100c2-14 10-22 26-26l12 4 12-4c16 4 24 12 26 26z" fill="${L.skin}"/><path d="M12 100c4-10 12-18 30-20 6 6 20 20 46 20z" fill="${o[0]}"/><path d="M30 80c8 2 18 8 26 20" stroke="${o[1]}" stroke-width="3" fill="none"/><g fill="${o[2]}">${[38, 43, 50, 57, 62].map((x, i) => `<path d="M${x} ${76 + (i === 2 ? 3 : i % 2 ? 2 : 0)}l2.4 4h-4.8z"/>`).join('')}</g>`,
    royal: (o) => `<path d="M10 100c2-14 12-22 28-26l12 6 12-6c16 4 26 12 28 26z" fill="${o[0]}"/><path d="M30 76c6 8 14 12 20 12s14-4 20-12l-4 10c-4 6-10 8-16 8s-12-2-16-8z" fill="${o[1]}"/><circle cx="50" cy="90" r="4" fill="#3fd7c8" stroke="${o[1]}" stroke-width="1.5"/><circle cx="38" cy="86" r="2" fill="#ff5e7a"/><circle cx="62" cy="86" r="2" fill="#ff5e7a"/><path d="M14 94c6-4 10-4 14 0M86 94c-6-4-10-4-14 0" stroke="${o[1]}" stroke-width="2" fill="none"/>`
  };
  const WEAPON = {
    sword: () => `<path d="M78 98L94 18" stroke="#dfe7ee" stroke-width="5" stroke-linecap="round"/><path d="M94 18l2-8-6 6z" fill="#dfe7ee"/><path d="M73 84h16" stroke="#c9a24a" stroke-width="4" stroke-linecap="round"/>`,
    longblade: () => `<path d="M12 96C14 60 24 30 40 8" stroke="#e8eef5" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M8 92l10 4" stroke="#7a1f2a" stroke-width="5" stroke-linecap="round"/><path d="M10 82c2 2 6 2 8 0" stroke="#c9a24a" stroke-width="3" fill="none"/>`,
    axeshield: (L) => `<path d="M84 100L90 30" stroke="#7e4a22" stroke-width="4"/><path d="M90 30c10 2 12 14 6 22-4-6-8-8-12-8z" fill="#b8c4d0" stroke="#5f6a77"/><circle cx="16" cy="86" r="18" fill="${L.outfit[0]}" stroke="#c9a24a" stroke-width="3"/><circle cx="16" cy="86" r="5" fill="#b8c4d0"/><path d="M16 68v36M-2 86h36" stroke="${L.outfit[1]}" stroke-width="2" opacity=".6"/>`,
    bow: () => `<path d="M84 8c16 22 16 66 0 88" stroke="#7e4a22" stroke-width="4" fill="none"/><path d="M84 8v88" stroke="#f2e6cf" stroke-width="1"/><path d="M84 8l-3-4M84 96l-3 4" stroke="#e8a33d" stroke-width="3"/>`,
    runestaff: (L) => `<path d="M86 100L88 12" stroke="#8a6a4a" stroke-width="4"/><path d="M80 14l8-8 8 8-8 10z" fill="${L.glow}" opacity=".9"/><circle cx="88" cy="14" r="12" fill="${L.glow}" opacity=".25"/><g stroke="#e8eef5" stroke-width="1.2">${[40, 56, 72].map(y => `<path d="M85 ${y}l3 4 3-4"/>`).join('')}</g>`,
    branchstaff: () => `<path d="M86 100C84 70 90 40 84 16" stroke="#6a4a2a" stroke-width="4" fill="none"/><path d="M84 16c-6-6-4-12 2-14M86 22c6-6 12-4 12 2" stroke="#6a4a2a" stroke-width="2.5" fill="none"/><g fill="#6fbf5a">${[[80, 10], [90, 6], [96, 22], [78, 20]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.4" transform="rotate(30 ${x} ${y})"/>`).join('')}</g><circle cx="86" cy="14" r="3" fill="#ffd36b"/>`,
    daggers: () => `<path d="M8 100L30 64M92 100L70 64" stroke="#c9d2dc" stroke-width="3.5" stroke-linecap="round"/><path d="M14 92l8 4M86 92l-8 4" stroke="#7a4fb3" stroke-width="4" stroke-linecap="round"/>`,
    falcon: () => `<g transform="translate(64 50) scale(.42)"><path d="M46 34L30 26L11 17L17 25L8 28L19 33L10 37L23 40L16 45L33 45L46 46ZM54 34L70 26L89 17L83 25L92 28L81 33L90 37L77 40L84 45L67 45L54 46ZM44 34C44 28 47 25 50 25C53 25 56 28 56 34L57 50C57 56 54 60 50 60C46 60 43 56 43 50ZM45 57L41 70L46 67L50 73L54 67L59 70L55 57ZM50 15.5A5.5 5.5 0 1 1 49.9 15.5ZM54.5 18.5L61 21L55 24Z" fill="#e8a33d" stroke="#7e4a22" stroke-width="2"/></g>`,
    fan: () => `<g transform="translate(78 70) rotate(-25)"><path d="M0 0L-22-24A32 32 0 0 1 22-24z" fill="#f2e6cf" stroke="#1f7a64" stroke-width="2"/><g stroke="#1f7a64" stroke-width="1">${[-16, -8, 0, 8, 16].map(x => `<path d="M0 0L${x}-28"/>`).join('')}</g><path d="M-14-18c6-6 20-6 26 2" stroke="#ff7a9c" stroke-width="2" fill="none"/></g>`,
    trident: () => `<path d="M86 100V14" stroke="#c9a24a" stroke-width="3.5"/><path d="M76 24V12l2-4 2 4v8h12V12l2-4 2 4v12c0 4-4 6-10 6s-10-2-10-6z" fill="#3fd7c8" stroke="#1c6f73"/><path d="M86 8l2-6 2 6z" fill="#3fd7c8"/>`,
    club: () => `<path d="M84 100l8-60" stroke="#8a5a3a" stroke-width="6" stroke-linecap="round"/><path d="M86 48c-6-14 0-30 10-34 6 8 6 26-4 36z" fill="#ff8a7a" stroke="#c9584a" stroke-width="2"/><g fill="#fff3e0">${[[90, 22], [94, 30], [88, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join('')}</g>`,
    cannon: () => `<g transform="translate(70 82) rotate(-35)"><rect x="0" y="-7" width="34" height="14" rx="4" fill="#c9a24a" stroke="#7e4a22" stroke-width="2"/><rect x="30" y="-9" width="6" height="18" rx="2" fill="#7e4a22"/><circle cx="10" cy="0" r="3" fill="#ff7a2a"/></g>`,
    spear: () => `<path d="M80 100L92 6" stroke="#7e4a22" stroke-width="3.5"/><path d="M92 6l4-8 1 12-6 6z" fill="#dfe7ee"/><path d="M88 30l8 2" stroke="#e8c35a" stroke-width="3"/>`
  };
  function portrait(h, s = 72) {
    const p = painted('heroes', h.id, s); if (p) return p;
    const L = h.look, R = REALMS[h.realm] || { color: '#7a4fb3' }, u = uid('h'), fem = FEM.has(h.id);
    const skin = L.skin, skinD = shade(skin, -.18), skinL = shade(skin, .15), hair = L.hair, o = L.outfit, metal = o[2];
    const face = fem ? 'M36 42C36 27 42 22 50 22C58 22 64 27 64 42C64 53 59 62 50 65C41 62 36 53 36 42Z' : 'M34 41C34 26 42 21 50 21C58 21 66 26 66 41C66 53 61 62 50 66C39 62 34 53 34 41Z';
    const eyeY = 45, lash = fem ? `<path d="M38 ${eyeY - 2.4}l-2.4-1.6M62 ${eyeY - 2.4}l2.4-1.6" stroke="#1b120c" stroke-width="1.2" stroke-linecap="round"/>` : '';
    const eye = x => `<ellipse cx="${x}" cy="${eyeY}" rx="3.6" ry="${fem ? 2.7 : 2.3}" fill="#fff"/><circle cx="${x + .2}" cy="${eyeY + .2}" r="2.1" fill="${L.eye}"/><circle cx="${x + .2}" cy="${eyeY + .2}" r="1" fill="#0a0604"/><circle cx="${x + 1}" cy="${eyeY - .7}" r=".7" fill="#fff"/><path d="M${x - 3.8} ${eyeY - .6}C${x - 2} ${eyeY - 3.4} ${x + 2} ${eyeY - 3.4} ${x + 3.8} ${eyeY - .6}" stroke="#1b120c" stroke-width="${fem ? 1.4 : 1.1}" fill="none"/>`;
    const brow = fem ? `<path d="M38 40c2-2 6-2.4 8-1.4M54 38.6c2-1 6-.6 8 1.4" stroke="${shade(hair === '#e6eef5' ? '#9aa6b2' : hair, -.15)}" stroke-width="1.5" fill="none" stroke-linecap="round"/>` : `<path d="M37 39.5c3-2 7-2 9-.8M54 38.7c2-1.2 6-1.2 9 .8" stroke="${shade(hair, -.1)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    const beard = L.beard ? `<path d="M36 50c0 10 6 18 14 19 8-1 14-9 14-19-3 5-8 7-14 7s-11-2-14-7z" fill="${L.beard}"/><path d="M44 57c4 1.5 8 1.5 12 0" stroke="${shade(L.beard, .25)}" stroke-width="1.2" fill="none"/>` : '';
    const mouth = L.beard ? `<path d="M46 57.5c2.5 1 5.5 1 8 0" stroke="#5a2a1a" stroke-width="1.4" fill="none" stroke-linecap="round"/>` : `<path d="M45.5 56.5c3 1.6 6 1.6 9 0" stroke="${fem ? '#a8434a' : '#7a3b2a'}" stroke-width="${fem ? 2 : 1.5}" fill="none" stroke-linecap="round"/>${fem ? '<path d="M46.5 57.3c2.2 1 4.8 1 7 0" stroke="#d9707a" stroke-width=".8" fill="none"/>' : ''}`;
    const marks = L.tattoo ? `<g stroke="${L.marks}" stroke-width="1.2" fill="none" opacity=".75"><path d="M18 84l6-4 6 4 6-4M16 90l6-4 6 4 6-4M20 96l4-3 4 3"/></g>` : L.marks && h.role !== 'Tank' ? `<path d="M60 50l5-1.5M60.5 52.5l4.5-.5" stroke="${L.marks}" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>` : '';
    const glow = L.glow ? `<circle cx="${45}" cy="${eyeY}" r="7" fill="${L.glow}" opacity=".18"/><circle cx="57" cy="${eyeY}" r="7" fill="${L.glow}" opacity=".18"/>` : '';
    const hs = L.hs, hairBack = (HAIR_BACK[hs] || (() => ''))(hair), hairFront = (HAIR_FRONT[hs] || (() => ''))(hair);
    const head = (HEADWEAR[L.head] || HEADWEAR.none)(L, metal);
    const masked = L.head === 'hoodmask';
    return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" class="portrait" aria-hidden="true">
      <defs><radialGradient id="${u}b" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${shade(R.color, .35)}"/><stop offset=".55" stop-color="${shade(R.color, -.35)}"/><stop offset="1" stop-color="#0d0918"/></radialGradient>
      <linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${skinL}"/><stop offset=".55" stop-color="${skin}"/><stop offset="1" stop-color="${skinD}"/></linearGradient>
      <linearGradient id="${u}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      <rect width="100" height="100" rx="12" fill="url(#${u}b)"/>${(MOTIF[h.realm] || (() => ''))(shade(R.color, .5))}
      ${['bow', 'runestaff', 'branchstaff', 'trident', 'spear', 'sword', 'club'].includes(L.weapon) ? WEAPON[L.weapon](L) : ''}
      ${L.head === 'hood' || L.head === 'hoodmask' ? '' : hairBack}
      ${(ARMOR[L.armor] || ARMOR.robe)(o, L)}
      <path d="M43 60h14v16c-4 3-10 3-14 0z" fill="${skinD}"/>
      ${L.head === 'hood' || L.head === 'hoodmask' ? head : ''}
      <ellipse cx="${fem ? 35.5 : 33.5}" cy="47" rx="3" ry="5" fill="${skinD}"/><ellipse cx="${fem ? 64.5 : 66.5}" cy="47" rx="3" ry="5" fill="${skinD}"/>
      ${fem && !['hood', 'hoodmask', 'headscarf'].includes(L.head) ? `<circle cx="${35.5}" cy="53" r="1.6" fill="${metal}"/><circle cx="64.5" cy="53" r="1.6" fill="${metal}"/>` : ''}
      <path d="${face}" fill="url(#${u}s)"/>
      <ellipse cx="41" cy="52" rx="4" ry="2.4" fill="#ff8a7a" opacity="${fem ? .28 : .12}"/><ellipse cx="59" cy="52" rx="4" ry="2.4" fill="#ff8a7a" opacity="${fem ? .28 : .12}"/>
      ${glow}${eye(43)}${eye(57)}${lash}${brow}
      <path d="M50 46c-.6 3-1.6 5.5-2.6 7 1.4.8 3.6.8 5 0" stroke="${skinD}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      ${masked ? '' : beard + mouth}${marks}
      ${hairFront}${L.head === 'hood' || L.head === 'hoodmask' ? `<path d="M30 52c0-16 8-27 20-27s20 11 20 27c-1-12-9-21-20-21s-19 9-20 21z" fill="${o[0]}"/>` + (masked ? HEADWEAR.hoodmask(L).replace(/^<path[^>]*>/, '') : '') : head}
      ${['axeshield', 'daggers', 'fan', 'cannon', 'falcon', 'longblade'].includes(L.weapon) ? WEAPON[L.weapon](L) : ''}
      <rect width="100" height="100" rx="12" fill="url(#${u}r)"/>
    </svg>`;
  }
  const RARITY = { rare: '#5a8ac9', epic: '#b48cff', legendary: '#ffd36b' };

  /* ---------- foes: the Ashen Court ---------- */
  const ash = '#5a5560', ashD = '#2e2a33', ember = '#ff7a2a', emberL = '#ffd36b';
  const glowEyes = (x1, x2, y, c = ember, r = 2.6) => `<circle cx="${x1}" cy="${y}" r="${r * 2}" fill="${c}" opacity=".25"/><circle cx="${x2}" cy="${y}" r="${r * 2}" fill="${c}" opacity=".25"/><circle cx="${x1}" cy="${y}" r="${r}" fill="${emberL}"/><circle cx="${x2}" cy="${y}" r="${r}" fill="${emberL}"/>`;
  const cracks = (d, c = ember) => `<path d="${d}" stroke="${c}" stroke-width="1.6" fill="none" opacity=".9"/>`;
  const FOE_ART = {
    ghoul: () => `<path d="M18 100c0-26 10-44 32-44s32 18 32 44z" fill="${ash}"/><path d="M28 64l-10 10 6 2-8 10M72 64l10 10-6 2 8 10" stroke="${ashD}" stroke-width="5" stroke-linecap="round"/><ellipse cx="50" cy="42" rx="16" ry="19" fill="#8a8590"/><path d="M34 40c0-16 8-22 16-22s16 6 16 22c-4-8-10-10-16-10s-12 2-16 10z" fill="${ashD}"/>${glowEyes(43, 57, 44)}<path d="M42 54l2 4 2-3 2 4 2-4 2 3 2-4" stroke="#1b1416" stroke-width="2" fill="none"/>${cracks('M40 70l6 8-2 8M60 72l-4 10')}`,
    hound: () => `<path d="M14 96c4-20 14-30 30-32l6-30 8 14 10-8 2 18c14 8 18 22 16 38z" fill="${ashD}"/><path d="M44 34l-12-12 4 18zM66 34l10-14-2 18z" fill="${ash}"/><path d="M40 58c4 10 12 14 20 14 6 0 10-2 12-6-6 0-12-2-16-8z" fill="#8a8590"/>${glowEyes(48, 62, 48, ember, 2.4)}<path d="M54 66l2 4 2-4 2 4" stroke="#fff" stroke-width="1.5" fill="none"/>${cracks('M24 80l8-6 6 8 8-6M60 84l8-8')}<circle cx="34" cy="40" r="3" fill="${ember}" opacity=".7"/><circle cx="72" cy="32" r="2" fill="${emberL}" opacity=".8"/>`,
    raider: () => `<path d="M16 100c2-22 14-32 34-32s32 10 34 32z" fill="#3a2a2a"/><path d="M30 76l40 24" stroke="#7a2f2f" stroke-width="5"/><ellipse cx="50" cy="46" rx="16" ry="19" fill="#a06a44"/><path d="M30 46c-2-22 10-30 20-30s22 8 20 30c-4-4-6-10-6-14-6 4-22 4-28 0 0 4-2 10-6 14z" fill="#2a2228"/><path d="M34 50h32v8c-6 6-26 6-32 0z" fill="${ash}"/><path d="M34 52h32" stroke="${ember}" stroke-width="1.2"/>${glowEyes(43, 57, 45, '#ff3a2a', 2)}<path d="M80 100L94 40" stroke="#9aa6b2" stroke-width="4"/>`,
    stalker: () => `<ellipse cx="50" cy="74" rx="28" ry="14" fill="#5a3a24"/><path d="M74 70c18-8 22-30 12-44s-22-8-20 4" stroke="#7a4a2a" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M64 26l8-12 4 14z" fill="${ember}"/><path d="M24 70l-16-12-4 7 14 9zM26 80l-18 2v7l18-4zM76 82l14 4 2 6-16-3z" fill="#7a4a2a"/><path d="M28 62c-6-4-10-12-6-16 4 2 8 8 8 14zM40 60c-2-8 0-14 4-14 2 4 0 10-2 14z" fill="#5a3a24"/>${glowEyes(42, 52, 68, ember, 2.2)}${cracks('M34 80h14l6-4h10')}`,
    wraith: () => `<path d="M22 96c0-40 10-72 28-72s28 32 28 72l-9-8-6 8-6-8-7 8-7-8-6 8-6-8z" fill="#3a1f2a"/><path d="M30 92c0-30 8-58 20-58s20 28 20 58" fill="none" stroke="${ember}" stroke-width="2" opacity=".7"/><path d="M50 10c-6 8-12 12-10 22 4-4 8-4 10 2 2-6 6-6 10-2 2-10-4-14-10-22z" fill="${ember}"/><path d="M50 18c-3 4-5 8-4 12 2-2 3-2 4 1 1-3 2-3 4-1 1-4-1-8-4-12z" fill="${emberL}"/>${glowEyes(42, 58, 48, emberL, 3)}<path d="M44 62c4 4 8 4 12 0" stroke="${ember}" stroke-width="2" fill="none"/>`,
    troll: () => `<path d="M8 100c2-28 18-42 42-42s40 14 42 42z" fill="#6a8aa0"/><path d="M14 84c-6-8-6-18 0-22l10 10zM86 84c6-8 6-18 0-22l-10 10z" fill="#4f6f86"/><ellipse cx="50" cy="44" rx="22" ry="20" fill="#8aa6ba"/><path d="M30 38c4-14 14-18 20-18s16 4 20 18c-6-4-12-6-20-6s-14 2-20 6z" fill="#e8eef5"/><path d="M40 56l-4 10 6-4zM60 56l4 10-6-4z" fill="#f2ede4"/>${glowEyes(42, 58, 44, '#7fe0ff', 2.6)}${cracks('M34 72l8 6 6-4 8 6', '#7fe0ff')}<path d="M48 50c2 2 4 2 6 0" stroke="#3a4a56" stroke-width="2" fill="none"/>`,
    phantom: () => `<path d="M30 92c4-8 10-6 12 0 2-8 10-8 12 0 2-6 8-8 12 0" stroke="#9a8aa8" stroke-width="3" fill="none" opacity=".6"/><path d="M50 8v8" stroke="#3a2a1a" stroke-width="2"/><path d="M32 22h36l4 6v40l-4 6H32l-4-6V28z" fill="#c9302a"/><path d="M28 30h44M28 46h44M28 62h44" stroke="#7a1f1a" stroke-width="2"/><path d="M32 22h36v-4H32zM32 74h36v4H32z" fill="#2a1f14"/><ellipse cx="50" cy="48" rx="16" ry="22" fill="#ffd36b" opacity=".35"/>${glowEyes(43, 57, 44, '#2a0e0a', 3.2)}<path d="M42 56c4 6 12 6 16 0l-3 8h-10z" fill="#2a0e0a"/>`,
    serpent: () => `<path d="M10 100c10-30 24-40 36-46 20-10 30-24 28-40-12 2-24 10-28 22" fill="none" stroke="#1f6a7a" stroke-width="18" stroke-linecap="round"/><path d="M10 100c10-30 24-40 36-46" fill="none" stroke="#7fd0c0" stroke-width="5" opacity=".6"/><path d="M58 10c14-6 30 2 30 14-8 6-24 6-32-2z" fill="#2a8a9a"/><path d="M60 6l-4-6 10 4zM74 4l2-8 4 8zM84 12l8-4-4 8z" fill="#ffd36b"/>${glowEyes(72, 82, 16, ember, 2)}<path d="M74 26l2 6 2-6 2 6 2-6" stroke="#fff" stroke-width="1.4" fill="none"/>${cracks('M30 70l8-4M40 60l6 2', ember)}`,
    golem: () => `<path d="M18 98l6-42 26-16 26 16 6 42z" fill="#3a3238"/><path d="M24 56l26-16 26 16-26 12z" fill="#5a5058"/><rect x="34" y="16" width="32" height="26" rx="5" fill="#4a4248"/>${glowEyes(43, 57, 29, ember, 3)}<path d="M8 58l14-6 4 26-14 4zM92 58l-14-6-4 26 14 4z" fill="#3a3238"/>${cracks('M30 70l10 8 8-6 10 10 10-8M42 30h16M28 90l8-6', ember)}<circle cx="50" cy="62" r="6" fill="${ember}" opacity=".85"/><circle cx="50" cy="62" r="3" fill="${emberL}"/>`,
    warlord: () => `<path d="M10 100c2-26 18-38 40-38s38 12 40 38z" fill="#3a2a2a"/><path d="M14 74c6-10 14-12 22-10l-4 16zM86 74c-6-10-14-12-22-10l4 16z" fill="#5a4a4a" stroke="${ember}" stroke-width="1.5"/><ellipse cx="50" cy="44" rx="17" ry="19" fill="#7a6a6a"/><path d="M30 40c0-18 10-26 20-26s20 8 20 26z" fill="#2a2228"/><path d="M30 26c-10-6-14-16-12-24 6 4 12 12 14 20zM70 26c10-6 14-16 12-24-6 4-12 12-14 20z" fill="#e8e0d0"/><path d="M34 40h32v6H34z" fill="#1b1416"/>${glowEyes(43, 57, 43, ember, 2.4)}<path d="M40 56c6 4 14 4 20 0l-2 6c-4 2-12 2-16 0z" fill="#2a1a1a"/>${cracks('M30 84l10-6 8 8 10-6 10 6')}`,
    queen: () => `<path d="M16 100c4-30 14-46 34-46s30 16 34 46z" fill="#4a2a5a"/><path d="M30 100c4-20 10-32 20-32s16 12 20 32" fill="#7a4a8a" opacity=".6"/><ellipse cx="50" cy="44" rx="15" ry="18" fill="#d9c0e8"/><path d="M28 50c-2-26 8-38 22-38s24 12 22 38c-6-10-10-22-22-22S34 40 28 50z" fill="#c9b8e8" opacity=".9"/><path d="M36 30l6-14 8 10 8-10 6 14z" fill="#ffd36b" opacity=".85"/>${glowEyes(44, 56, 45, '#e0a0ff', 2.2)}<path d="M45 55c3 2 7 2 10 0" stroke="#7a3a8a" stroke-width="1.6" fill="none"/><g fill="#e8f8ff" opacity=".85"><path d="M12 30l6-8 4 10zM86 24l6 6-8 4zM18 62l-6 6 8 2zM84 60l8 4-8 4z"/></g>`,
    wyrm: () => `<path d="M6 100c6-22 18-30 30-34 14-4 22-14 22-30" stroke="#d9e4ee" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M40 10c22-8 46 4 50 22-10 10-38 12-50 0z" fill="#e8eef5"/><path d="M42 12l-8-10 14 4zM56 6l2-10 6 10zM72 8l10-6-4 12z" fill="#9aa6b2"/><path d="M48 30c10 8 28 10 40 2-4 10-18 14-30 10z" fill="#c9d6e3"/>${glowEyes(62, 76, 20, ember, 2.4)}<path d="M66 36l2 6 2-6 2 6 2-6 2 6" stroke="#fff" stroke-width="1.5" fill="none"/><g stroke="#5a5560" stroke-width="3" fill="none"><path d="M20 70c6 4 12 4 16 0M28 80c6 4 12 4 16 0"/></g>${cracks('M14 86l8-6 6 4', ember)}`,
    lantern: () => `<path d="M16 100c2-26 14-38 34-38s32 12 34 38z" fill="#2a1a2a"/><path d="M26 80c8-6 16-8 24-8s16 2 24 8" stroke="#c9302a" stroke-width="3" fill="none"/><path d="M50 4v8" stroke="#3a2a1a" stroke-width="2"/><path d="M34 14h32l4 6v28l-4 6H34l-4-6V20z" fill="#e8402a"/><path d="M30 24h40M30 36h40" stroke="#7a1f1a" stroke-width="2"/><ellipse cx="50" cy="34" rx="12" ry="16" fill="#ffd36b" opacity=".5"/>${glowEyes(44, 56, 32, '#2a0e0a', 2.6)}<g fill="#7a6a7a" opacity=".55"><circle cx="20" cy="40" r="10"/><circle cx="80" cy="36" r="12"/><circle cx="14" cy="60" r="8"/><circle cx="88" cy="58" r="9"/></g>`,
    kraken: () => `<g stroke="#5a2a3a" stroke-width="10" fill="none" stroke-linecap="round"><path d="M20 100c-4-20 8-26 0-44"/><path d="M80 100c4-20-8-26 0-44"/><path d="M36 100c0-14 6-18 2-30"/><path d="M64 100c0-14-6-18-2-30"/></g><ellipse cx="50" cy="44" rx="28" ry="30" fill="#7a3a4a"/><ellipse cx="50" cy="40" rx="20" ry="22" fill="#9a4a5a"/><circle cx="50" cy="48" r="12" fill="#1b0e10"/><circle cx="50" cy="48" r="9" fill="${ember}"/><circle cx="50" cy="48" r="4" fill="#1b0e10"/><circle cx="53" cy="45" r="2" fill="#fff"/>${cracks('M30 30l8 6M70 30l-8 6M40 70l10-4 10 4', ember)}`,
    hollow: () => `<path d="M8 100c4-34 20-50 42-50s38 16 42 50z" fill="#140f1a"/><path d="M8 100c4-34 20-50 42-50s38 16 42 50" fill="none" stroke="#3a2a4a" stroke-width="2"/><path d="M26 68c8 10 16 14 24 14s16-4 24-14" stroke="#ffd36b" stroke-width="1.5" fill="none" opacity=".5"/><ellipse cx="50" cy="44" rx="16" ry="20" fill="#1b141f"/><path d="M30 50c-4-24 6-38 20-38s24 14 20 38c-4-8-10-14-20-14s-16 6-20 14z" fill="#2a1f33"/><path d="M32 22l-2-16 10 10 10-14 10 14 10-10-2 16z" fill="#6a5a3a" stroke="#ffd36b" stroke-width="1.5"/><path d="M48 8l4 8-6 4z" fill="#140f1a"/><ellipse cx="43" cy="44" rx="3.6" ry="4.6" fill="#000"/><ellipse cx="57" cy="44" rx="3.6" ry="4.6" fill="#000"/><circle cx="43" cy="44" r="1.6" fill="#b48cff"/><circle cx="57" cy="44" r="1.6" fill="#b48cff"/><circle cx="43" cy="44" r="6" fill="#b48cff" opacity=".2"/><circle cx="57" cy="44" r="6" fill="#b48cff" opacity=".2"/>${cracks('M34 30l4 6M66 30l-4 6', '#b48cff')}`
  };
  const enemy = (kind, s = 72) => painted('foes', kind, s) || (() => { const u = uid('f'); return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" class="portrait" aria-hidden="true"><defs><radialGradient id="${u}" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#5a2a24"/><stop offset=".6" stop-color="#2a1418"/><stop offset="1" stop-color="#0d0709"/></radialGradient></defs><rect width="100" height="100" rx="12" fill="url(#${u})"/><g opacity=".5" fill="${ember}"><circle cx="14" cy="18" r="1.4"/><circle cx="84" cy="12" r="1"/><circle cx="90" cy="70" r="1.4"/><circle cx="8" cy="76" r="1"/></g>${(FOE_ART[kind] || FOE_ART.ghoul)()}</svg>`; })();

  /* ---------- buildings (palette follows your home realm) ---------- */
  let P = { wall: '#d9d2c0', wall2: '#b3ab97', wall3: '#8a826e', roof: '#3d6fb3', cap: 'pitch', tree: 'oak', ground: ['#9cc46a', '#6f9a48', '#4f7a34'], water: '#4aa3c9', realm: 'greenhold' };
  const setRealm = (id, pal) => { const R = REALMS[id] || REALMS.greenhold; P = { ...R, ...(pal || {}), realm: id }; };
  const flag = (x, y, c = '#e8a33d') => `<path d="M${x} ${y}v-22" stroke="#5a3418" stroke-width="2"/><path class="wave" d="M${x} ${y - 22}l14 4-14 5z" fill="${c}"/>`;
  const crenel = (x, y, w, c) => { let s = ''; for (let i = x; i < x + w - 4; i += 8) s += `<rect x="${i}" y="${y - 5}" width="5" height="5" fill="${c || P.wall2}"/>`; return s; };
  const box = (x, y, w, h, top, side) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${top || P.wall}"/><rect x="${x}" y="${y + h - 6}" width="${w}" height="6" fill="${side || P.wall2}"/><rect x="${x + w - 8}" y="${y}" width="8" height="${h}" fill="#000" opacity=".08"/>`;
  // Roof caps: one look per realm
  const cap = (cx, cy, r, c) => {
    c = c || P.roof; const d = shade(c, -.3);
    switch (P.cap) {
      case 'dome': return `<path d="M${cx - r} ${cy}a${r} ${r} 0 0 1 ${2 * r} 0z" fill="${c}"/><path d="M${cx - r * .4} ${cy - r * .8}a${r} ${r} 0 0 1 ${r * .5} -.1" stroke="#fff" stroke-width="2" opacity=".35" fill="none"/><path d="M${cx} ${cy - r}v-7" stroke="#ffd36b" stroke-width="2"/><circle cx="${cx}" cy="${cy - r - 8}" r="2.6" fill="#ffd36b"/>`;
      case 'pagoda': return `<path d="M${cx - r * 1.5} ${cy}q${r * .3} -${r * .25} ${r * .5} -${r * .5}h${r * 2}q${r * .2} ${r * .25} ${r * .5} ${r * .5}z" fill="${c}"/><path d="M${cx - r * .9} ${cy - r * .5}h${r * 1.8}v-${r * .3}h-${r * 1.8}z" fill="${P.wall2}"/><path d="M${cx - r * 1.2} ${cy - r * .8}q${r * .3} -${r * .2} ${r * .4} -${r * .5}h${r * 1.6}q${r * .1} ${r * .3} ${r * .4} ${r * .5}z" fill="${d}"/><path d="M${cx} ${cy - r * 1.3}v-8" stroke="#ffd36b" stroke-width="2"/><circle cx="${cx}" cy="${cy - r * 1.3 - 9}" r="2.4" fill="#ffd36b"/>`;
      case 'thatch': return `<path d="M${cx - r * 1.3} ${cy}c${r * .3} -${r} ${r * .8} -${r * 1.4} ${r * 1.3} -${r * 1.4}s${r} ${r * .4} ${r * 1.3} ${r * 1.4}z" fill="${c}"/><g stroke="${d}" stroke-width="1.4" opacity=".7">${[-.6, -.2, .2, .6].map(k => `<path d="M${cx + k * r} ${cy}l${k * r * .2} -${r * .9}"/>`).join('')}</g>`;
      case 'cone': return `<path d="M${cx - r * 1.2} ${cy}L${cx} ${cy - r * 1.5}L${cx + r * 1.2} ${cy}z" fill="${c}"/><path d="M${cx - r * 1.2} ${cy}L${cx} ${cy - r * 1.5}" stroke="${shade(c, .25)}" stroke-width="2"/><g stroke="${d}" stroke-width="1.2" opacity=".6"><path d="M${cx - r * .8} ${cy - r * .5}h${r * 1.6}M${cx - r * .4} ${cy - r}h${r * .8}"/></g>`;
      default: return `<path d="M${cx - r * 1.25} ${cy}L${cx} ${cy - r * 1.1}L${cx + r * 1.25} ${cy}z" fill="${c}"/><path d="M${cx} ${cy - r * 1.1}L${cx + r * 1.25} ${cy}h-${r * .5}z" fill="${d}"/><path d="M${cx - r * 1.25} ${cy}L${cx} ${cy - r * 1.1}" stroke="${shade(c, .3)}" stroke-width="2"/>`;
    }
  };
  const door = (x, y, w = 10, h = 14) => `<path d="M${x} ${y}v-${h - w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0v${h - w / 2}z" fill="#3a2414"/>`;
  const win = (x, y) => `<path d="M${x} ${y}v-5a3 3 0 0 1 6 0v5z" fill="#3a2414"/><path class="lit" d="M${x + 1} ${y}v-4.4a2 2 0 0 1 4 0v4.4z" fill="#ffcf6b" opacity="0"/>`;
  const TREES = {
    palm: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0c1-10 3-20 1-30" stroke="#8a5a1c" stroke-width="3.5" fill="none"/><g fill="#3e8a4a"><path d="M1-30c-10-4-18 0-22 6 8-4 14-4 22-6z"/><path d="M1-30c10-4 18 0 22 6-8-4-14-4-22-6z"/><path d="M1-30c-6-8-14-10-20-8 8 1 13 3 20 8z"/><path d="M1-30c6-8 14-10 20-8-8 1-13 3-20 8z"/><path d="M1-30c0-8 2-12 6-14-2 5-4 9-6 14z"/></g></g>`,
    pine: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-1 0h3v-8h-3z" fill="#5a3a24"/><path d="M0-40l-12 18h6l-9 12h6l-8 10h34l-8-10h6l-9-12h6z" fill="#2f5a4a"/><path d="M0-40l-6 10 8-2-6 10 8-2-6 10 12-1-8-10h6l-9-12h6z" fill="#f2f6fb" opacity=".75"/></g>`,
    oak: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-2 0h5l-1-14h-3z" fill="#6a4a2a"/><circle cx="-8" cy="-20" r="10" fill="#4f8a3c"/><circle cx="8" cy="-22" r="11" fill="#5f9a48"/><circle cx="0" cy="-32" r="11" fill="#6faa52"/><circle cx="-4" cy="-34" r="4" fill="#8fc46a" opacity=".7"/></g>`,
    bamboo: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${[-6, 0, 6].map((dx, i) => `<path d="M${dx} 0V-${34 + i * 6}" stroke="#7fae5a" stroke-width="3"/><g stroke="#5a8a3a" stroke-width="3">${[8, 18, 28].map(h => `<path d="M${dx - 1.6} -${h}h3.2"/>`).join('')}</g><path d="M${dx}-${30 + i * 6}c6-2 10 0 12 4M${dx}-${22 + i * 4}c-6-2-10 0-12 4" stroke="#6fbf5a" stroke-width="2" fill="none"/>`).join('')}</g>`,
    acacia: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0c0-10 2-16-6-24M0-10c4-6 8-10 8-16" stroke="#6a4a2a" stroke-width="2.5" fill="none"/><ellipse cx="0" cy="-28" rx="22" ry="6" fill="#7a8a3a"/><ellipse cx="-4" cy="-31" rx="14" ry="4" fill="#9aa64a"/></g>`,
    cherry: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0c0-10 2-16-6-24M0-12c4-6 8-8 10-14" stroke="#5a3a2a" stroke-width="2.5" fill="none"/><circle cx="-8" cy="-26" r="9" fill="#f5b0c8"/><circle cx="8" cy="-28" r="9" fill="#f0a0bc"/><circle cx="0" cy="-34" r="8" fill="#ffc8da"/></g>`
  };
  const tree = (x, y, s = 1, kind) => { const a = MAN.map && MAN.map.trees; return a ? `<image href="art/${a}" x="${x - 46 * s}" y="${y - 70 * s}" width="${92 * s}" height="${92 * s}"/>` : (TREES[kind || P.tree] || TREES.oak)(x, y, s); };
  const shadow = (w) => `<ellipse cx="0" cy="4" rx="${w}" ry="8" fill="#000" opacity=".18"/>`;
  const B = {
    citadel: L => `${shadow(72)}${box(-58, -50, 116, 54)}${crenel(-58, -50, 116)}<rect x="-70" y="-78" width="24" height="82" fill="${P.wall2}"/><rect x="46" y="-78" width="24" height="82" fill="${P.wall2}"/>${crenel(-70, -78, 24, P.wall3)}${crenel(46, -78, 24, P.wall3)}${cap(-58, -83, 12)}${cap(58, -83, 12)}${box(-30, -86, 60, 40, shade(P.wall, .15))}${cap(0, -86, 24, L >= 10 ? '#e8a33d' : P.roof)}${door(-9, 4, 18, 26)}${win(-62, -40)}${win(54, -40)}${win(-20, -62)}${win(14, -62)}${flag(-58, -100, '#e8a33d')}${flag(58, -100, P.color)}`,
    barracks: () => `${shadow(52)}${box(-50, -34, 100, 38)}${crenel(-50, -34, 100)}${door(-8, 4, 16, 20)}<path d="M-44-4l12-20M44-4l-12-20" stroke="#cfd8e2" stroke-width="2"/><circle cx="-24" cy="-16" r="7" fill="#b3433a" stroke="#e8c35a" stroke-width="2"/><circle cx="24" cy="-16" r="7" fill="#2f5a8a" stroke="#e8c35a" stroke-width="2"/>${flag(40, -34, '#b3433a')}`,
    academy: () => `${shadow(46)}${box(-42, -36, 84, 40, shade(P.wall, .1))}${cap(0, -36, 24)}${door(-7, 4, 14, 18)}${win(-32, -14)}${win(26, -14)}<rect x="30" y="-64" width="10" height="30" fill="${P.wall2}"/><circle cx="35" cy="-68" r="5" fill="#9fc3e6"/><path d="M33-70l4 4" stroke="#fff" stroke-width="1"/>`,
    infirmary: () => `${shadow(42)}${box(-40, -30, 80, 34)}${cap(0, -30, 16, '#f2ede4')}<rect x="-4" y="-24" width="8" height="20" fill="#3fd7c8"/><rect x="-10" y="-18" width="20" height="8" fill="#3fd7c8"/>${door(-24, 4)}${tree(32, 6, .7)}`,
    vault: () => `${shadow(40)}${box(-38, -40, 76, 44, P.wall2, P.wall3)}<rect x="-14" y="-28" width="28" height="30" rx="3" fill="#5a3418"/><circle cx="0" cy="-12" r="7" fill="#e8a33d"/><path d="M0-12l5-3" stroke="#5a3418" stroke-width="2"/>${crenel(-38, -40, 76, P.wall3)}`,
    tower: () => `${shadow(26)}<path d="M-18 4l4-90h28l4 90z" fill="${P.wall}"/><path d="M6-86h8l4 90H8z" fill="#000" opacity=".08"/><rect x="-20" y="-96" width="40" height="14" fill="${P.wall2}"/>${cap(0, -96, 16)}${win(-3, -60)}${win(-3, -30)}`,
    embassy: () => `${shadow(46)}${box(-44, -32, 88, 36, shade(P.wall, .1))}${cap(0, -32, 30)}${door(-8, 4, 16, 20)}<path d="M-30-30v-40" stroke="#5a3418" stroke-width="2"/><path class="wave" d="M-30-70h22v14h-22z" fill="#2b4a8a"/><path d="M-24-63l5-4 5 4" stroke="#ffd36b" stroke-width="1.5" fill="none"/>`,
    mews: () => `${shadow(42)}${box(-40, -32, 80, 36)}${cap(0, -32, 26)}${door(-8, 4, 16, 18)}<g transform="translate(-14 -14) scale(.28)">${crownPath('#ffd36b', '#7e4a22')}</g>`,
    market: () => `${shadow(46)}${box(-44, -18, 88, 22)}<path d="M-48-18h32l-4-14h-24zM-16-18h32l-4-14h-24zM16-18h32l-4-14h-24z" fill="#b3433a"/><path d="M-44-32h24M-12-32h24M20-32h24" stroke="#f2ede4" stroke-width="2" stroke-dasharray="4 4"/><circle cx="-30" cy="-6" r="4" fill="#f0c04a"/><circle cx="2" cy="-6" r="4" fill="#9fc3e6"/><circle cx="32" cy="-6" r="4" fill="#3e8a4a"/>`,
    wall: L => `${shadow(46)}<rect x="-46" y="-44" width="22" height="48" fill="${P.wall2}"/><rect x="24" y="-44" width="22" height="48" fill="${P.wall2}"/>${crenel(-46, -44, 22, P.wall3)}${crenel(24, -44, 22, P.wall3)}${box(-24, -34, 48, 38, shade(P.wall, .1))}${crenel(-24, -34, 48)}<path d="M-12 4v-16a12 12 0 0 1 24 0v16z" fill="#5a3418"/><path d="M-12-6h24M-12 0h24M-6-22v26M0-24v28M6-22v26" stroke="#3a2414" stroke-width="1.5"/>${flag(-35, -44, L >= 5 ? '#e8a33d' : P.color)}${flag(35, -44, L >= 5 ? '#e8a33d' : P.color)}`,
    farm: () => `${shadow(30)}<path d="M-34 0l34-14 34 14-34 14z" fill="#7aa64a"/><path d="M-26 0l26-10 26 10-26 10z" fill="#c9b24a"/><g stroke="#e8c35a" stroke-width="2">${[-16, -6, 4, 14].map(x => `<path d="M${x}-${4 + (x + 20) / 8}v-8"/>`).join('')}</g>${box(-34, -26, 18, 16, P.wall)}<path d="M-36-26l11-8 11 8z" fill="${P.roof}"/>`,
    lumber: () => `${shadow(30)}${tree(-20, 0, .9)}${tree(18, -2, .8)}<rect x="-14" y="-8" width="28" height="7" rx="3.5" fill="#9c5f2e"/><rect x="-10" y="-14" width="20" height="7" rx="3.5" fill="#7e4a22"/>`,
    quarry: () => `${shadow(32)}<path d="M-34 2l8-26 20-8 22 6 14 24z" fill="#a9a39a"/><path d="M-20-6l10-12 12 4-4 10z" fill="#d6d0c6"/><path d="M10-4l10-10 6 12z" fill="#857f77"/><path d="M-6-28l-8 30" stroke="#5a3418" stroke-width="2"/>`,
    mine: () => `${shadow(30)}<path d="M-32 4c0-24 14-38 32-38s32 14 32 38z" fill="#857f77"/><path d="M-12 4v-16a12 12 0 0 1 24 0v16z" fill="#1b1430"/><path d="M-14-12h28M-14-12v16M14-12v16" stroke="#9c5f2e" stroke-width="3"/><path d="M18-22l6-6 4 4-6 4z" fill="#c9d6e3"/>`,
    empty: () => `<path d="M-30 0l30-12 30 12-30 12z" fill="#000" opacity=".12" stroke="#fff" stroke-dasharray="4 4" stroke-opacity=".55"/><text x="0" y="5" text-anchor="middle" font-size="16" fill="#fff" opacity=".8">+</text>`
  };
  const BSIZE = { citadel: 204, empty: 96, farm: 128, lumber: 128, quarry: 128, mine: 128, tower: 118, wall: 128 };
  const building = (id, L) => {
    const a = MAN.buildings && MAN.buildings[B[id] ? id : 'empty']; if (!a) return (B[id] || B.empty)(L || 1);
    const z = (BSIZE[id] || 132) * (id === 'empty' ? 1 : 1 + Math.min(L || 1, 20) * .01);
    return `<ellipse cy="${z * .04}" rx="${z * .4}" ry="${z * .13}" fill="#000" opacity=".3"/><image href="art/${a}" x="${-z / 2}" y="${-z * .86}" width="${z}" height="${z}"/>${id === 'empty' || !B[id] ? '<text x="0" y="2" text-anchor="middle" font-size="20" font-weight="900" fill="#fff" stroke="#000" stroke-width=".8" opacity=".9">+</text>' : ''}`;
  };

  /* ---------- city ground per realm ---------- */
  const cityBg = () => {
    { const c = MAN.city && MAN.city[P.realm]; if (c) { const gt = MAN.ground && MAN.ground[{ frostmark: 'snow', amber: 'sand', sunveldt: 'sand' }[P.realm] || 'grass'];
      // the painted city sits in the middle of a wider realm: tiled ground beyond it, the painting feathered into it
      return `<defs><pattern id="cgnd" width="320" height="320" patternUnits="userSpaceOnUse"><image href="art/${gt}" width="320" height="320" preserveAspectRatio="none"/></pattern><linearGradient id="cfx" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#000"/><stop offset=".09" stop-color="#fff"/><stop offset=".91" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><linearGradient id="cfy" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".12" stop-color="#fff"/><stop offset=".88" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="cmask" maskUnits="userSpaceOnUse" x="-119" y="-55" width="1235" height="823"><rect x="-119" y="-55" width="1235" height="823" fill="url(#cfx)"/></mask><mask id="cmask2" maskUnits="userSpaceOnUse" x="-119" y="-55" width="1235" height="823"><rect x="-119" y="-55" width="1235" height="823" fill="url(#cfy)"/></mask><radialGradient id="cvig" cx=".5" cy=".47" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05030d" stop-opacity=".55"/></radialGradient></defs><rect x="-420" y="-300" width="1840" height="1288" fill="url(#cgnd)"/><g mask="url(#cmask2)"><image href="art/${c}" x="-119" y="-55" width="1235" height="823" preserveAspectRatio="none" mask="url(#cmask)"/></g>`; } }
    const g = P.ground, u = uid('c'), GT = { frostmark: 'snow', amber: 'sand', sunveldt: 'sand' }, gt = MAN.ground && MAN.ground[GT[P.realm] || 'grass'], st = MAN.ground && MAN.ground.stone;
    const texture = {
      amber: `<path d="M0 30c20-12 40-12 80 0" stroke="${g[2]}" stroke-width="2" fill="none" opacity=".4"/>`,
      frostmark: `<path d="M0 28c20-6 40-6 80 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/><circle cx="20" cy="12" r="1.5" fill="#fff"/>`,
      coral: `<path d="M0 30c20-8 40-8 80 0" stroke="${g[2]}" stroke-width="1.5" fill="none" opacity=".35"/><circle cx="60" cy="10" r="1.6" fill="#fff" opacity=".6"/>`
    }[P.realm] || `<g stroke="${g[2]}" stroke-width="1.6" opacity=".45"><path d="M10 30l2-6 2 6M50 14l2-6 2 6M64 34l2-5 2 5"/></g>`;
    const trees = [[120, 600, 1.1], [70, 380, 1], [960, 560, 1.1], [40, 220, .9], [980, 300, 1], [300, 680, .9], [700, 690, 1]];
    const coast = P.realm === 'coral' ? `<path d="M1000 0V700H940C900 600 960 500 920 400S960 200 900 100 960 0 1000 0z" fill="${P.water}"/><path d="M940 700C900 600 960 500 920 400S960 200 900 100 960 0 960 0" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-dasharray="14 10"/>` : '';
    return `<defs><radialGradient id="${u}g" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="${g[0]}"/><stop offset=".7" stop-color="${g[1]}"/><stop offset="1" stop-color="${g[2]}"/></radialGradient>
      <linearGradient id="${u}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(P.water, .3)}"/><stop offset="1" stop-color="${shade(P.water, -.35)}"/></linearGradient>
      <pattern id="${u}p" width="80" height="40" patternUnits="userSpaceOnUse">${texture}</pattern>
      ${gt ? `<pattern id="${u}t" width="220" height="220" patternUnits="userSpaceOnUse"><image href="art/${gt}" width="220" height="220"/></pattern>` : ''}${st ? `<pattern id="${u}s" width="150" height="150" patternUnits="userSpaceOnUse" patternTransform="rotate(27) scale(1 .6)"><image href="art/${st}" width="150" height="150"/></pattern>` : ''}</defs>
      <rect width="1000" height="700" fill="url(#${u}g)"/>${gt ? `<rect width="1000" height="700" fill="url(#${u}t)" opacity=".82"/><rect width="1000" height="700" fill="url(#${u}g)" opacity=".25"/>` : `<rect width="1000" height="700" fill="url(#${u}p)"/>`}${coast}
      <ellipse cx="880" cy="120" rx="80" ry="34" fill="url(#${u}w)"/><ellipse cx="880" cy="120" rx="80" ry="34" fill="none" stroke="${shade(P.ground[2], -.2)}" stroke-width="3"/>${tree(820, 120, 1)}${tree(940, 110, .9)}${tree(860, 150, .8, P.realm === 'jade' ? 'cherry' : undefined)}
      <path d="M500 130L820 290 500 450 180 290z" fill="${st ? `url(#${u}s)` : shade(P.ground[0], P.realm === 'frostmark' ? -.06 : .12)}" stroke="${P.wall3}" stroke-width="2"/>
      <path d="M500 112L850 290 500 468 150 290z" fill="none" stroke="${shade(P.wall3, -.25)}" stroke-width="22" stroke-linejoin="round" opacity=".55" transform="translate(0 7)"/><path d="M500 112L850 290 500 468 150 290z" fill="none" stroke="${P.wall2}" stroke-width="16" stroke-linejoin="round"/>
      <path d="M500 112L850 290 500 468 150 290z" fill="none" stroke="${shade(P.wall, .2)}" stroke-width="5" stroke-dasharray="10 6" stroke-linejoin="round"/>
      <path d="M500 468v240" stroke="${shade(P.ground[1], -.12)}" stroke-width="26"/>
      ${trees.map(([x, y, s], i) => tree(x, y, s, P.realm === 'jade' && i % 3 === 0 ? 'cherry' : undefined)).join('')}`;
  };

  /* ---------- world map painters (canvas) ---------- */
  const mapTree = (ctx, kind, x, y, s) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40);
    if (kind === 'pine') { ctx.fillStyle = '#5a3a24'; ctx.fillRect(-1, -6, 3, 6); ctx.fillStyle = '#2f5a4a'; ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(-11, -4); ctx.lineTo(11, -4); ctx.fill(); ctx.fillStyle = '#f2f6fb'; ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(-5, -22); ctx.lineTo(4, -24); ctx.fill(); }
    else if (kind === 'palm') { ctx.strokeStyle = '#8a5a1c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(3, -14, 1, -26); ctx.stroke(); ctx.fillStyle = '#3e8a4a'; for (let a = 0; a < 6; a++) { ctx.beginPath(); ctx.ellipse(1 + Math.cos(a * 1.05) * 8, -26 + Math.sin(a * 1.05) * 3, 10, 2.6, a * 1.05, 0, 7); ctx.fill(); } }
    else if (kind === 'bamboo') { ctx.strokeStyle = '#7fae5a'; ctx.lineWidth = 2.6; for (const dx of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx, -26 - Math.abs(dx)); ctx.stroke(); } ctx.fillStyle = '#6fbf5a'; ctx.beginPath(); ctx.ellipse(0, -26, 9, 4, 0, 0, 7); ctx.fill(); }
    else if (kind === 'acacia') { ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-3, -18); ctx.stroke(); ctx.fillStyle = '#8a9a3a'; ctx.beginPath(); ctx.ellipse(-2, -20, 16, 4.5, 0, 0, 7); ctx.fill(); }
    else if (kind === 'dead') { ctx.strokeStyle = '#2a2228'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -20); ctx.moveTo(0, -12); ctx.lineTo(-7, -18); ctx.moveTo(0, -15); ctx.lineTo(6, -22); ctx.stroke(); }
    else { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-1.5, -10, 3, 10); ctx.fillStyle = '#4f8a3c'; ctx.beginPath(); ctx.arc(-5, -15, 8, 0, 7); ctx.arc(5, -17, 8, 0, 7); ctx.arc(0, -24, 8, 0, 7); ctx.fill(); ctx.fillStyle = '#7fb85a'; ctx.beginPath(); ctx.arc(-2, -25, 3.5, 0, 7); ctx.fill(); }
    ctx.restore();
  };
  const mapPaint = {
    city(ctx, x, y, s, color, realm) {
      const R = REALMS[realm] || REALMS.greenhold;
      ctx.fillStyle = '#0000004a'; ctx.beginPath(); ctx.ellipse(x, y + s * .3, s * .46, s * .15, 0, 0, 7); ctx.fill();
      ctx.fillStyle = R.wall; ctx.fillRect(x - s * .32, y - s * .18, s * .64, s * .44);
      ctx.fillStyle = R.wall2; ctx.fillRect(x - s * .42, y - s * .34, s * .15, s * .6); ctx.fillRect(x + s * .27, y - s * .34, s * .15, s * .6);
      ctx.fillStyle = R.roof; const cy = y - s * .18;
      if (R.cap === 'dome') { ctx.beginPath(); ctx.arc(x, cy, s * .17, Math.PI, 0); ctx.fill(); }
      else if (R.cap === 'cone' || R.cap === 'thatch') { ctx.beginPath(); ctx.moveTo(x - s * .22, cy); ctx.lineTo(x, cy - s * .3); ctx.lineTo(x + s * .22, cy); ctx.fill(); }
      else if (R.cap === 'pagoda') { ctx.beginPath(); ctx.moveTo(x - s * .28, cy); ctx.quadraticCurveTo(x - s * .1, cy - s * .08, x, cy - s * .24); ctx.quadraticCurveTo(x + s * .1, cy - s * .08, x + s * .28, cy); ctx.fill(); }
      else { ctx.beginPath(); ctx.moveTo(x - s * .26, cy); ctx.lineTo(x, cy - s * .26); ctx.lineTo(x + s * .26, cy); ctx.fill(); }
      for (const dx of [-.345, .345]) { ctx.beginPath(); ctx.moveTo(x + dx * s - s * .09, y - s * .34); ctx.lineTo(x + dx * s, y - s * .48); ctx.lineTo(x + dx * s + s * .09, y - s * .34); ctx.fill(); }
      ctx.fillStyle = '#3a2414'; ctx.fillRect(x - s * .05, y + s * .06, s * .1, s * .2);
      ctx.strokeStyle = '#3a2414'; ctx.lineWidth = Math.max(1, s * .02); ctx.beginPath(); ctx.moveTo(x, y - s * .42); ctx.lineTo(x, y - s * .68); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y - s * .68); ctx.lineTo(x + s * .2, y - s * .62); ctx.lineTo(x, y - s * .56); ctx.fill();
    },
    node(ctx, x, y, s, kind) {
      ctx.fillStyle = '#00000033'; ctx.beginPath(); ctx.ellipse(x, y + s * .22, s * .36, s * .12, 0, 0, 7); ctx.fill();
      if (kind === 'grain') { ctx.fillStyle = '#c9b24a'; ctx.beginPath(); ctx.ellipse(x, y + s * .05, s * .34, s * .18, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#e8c35a'; ctx.lineWidth = 2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * s * .1, y + s * .1); ctx.lineTo(x + i * s * .1, y - s * .1); ctx.stroke(); } ctx.fillStyle = '#9c5f2e'; ctx.fillRect(x + s * .12, y - s * .22, s * .16, s * .14); }
      else if (kind === 'timber') { mapTree(ctx, 'pine', x - s * .14, y + s * .14, s * .7); mapTree(ctx, 'oak', x + s * .14, y + s * .18, s * .7); ctx.fillStyle = '#9c5f2e'; ctx.fillRect(x - s * .2, y + s * .12, s * .4, s * .08); }
      else if (kind === 'stone') { ctx.fillStyle = '#a9a39a'; ctx.beginPath(); ctx.moveTo(x - s * .34, y + s * .2); ctx.lineTo(x - s * .12, y - s * .24); ctx.lineTo(x + s * .14, y - s * .12); ctx.lineTo(x + s * .34, y + s * .2); ctx.fill(); ctx.fillStyle = '#d6d0c6'; ctx.beginPath(); ctx.moveTo(x - s * .12, y - s * .24); ctx.lineTo(x - s * .02, y); ctx.lineTo(x - s * .22, y); ctx.fill(); }
      else if (kind === 'ore') { ctx.fillStyle = '#5a6f86'; ctx.beginPath(); ctx.moveTo(x - s * .32, y + s * .2); ctx.lineTo(x - s * .1, y - s * .2); ctx.lineTo(x + s * .12, y - s * .06); ctx.lineTo(x + s * .32, y + s * .2); ctx.fill(); ctx.fillStyle = '#c9d6e3'; ctx.beginPath(); ctx.moveTo(x - s * .04, y - s * .12); ctx.lineTo(x + s * .06, y + s * .04); ctx.lineTo(x - s * .12, y + s * .04); ctx.fill(); }
      else { ctx.fillStyle = '#7e4a22'; ctx.fillRect(x - s * .2, y - s * .04, s * .4, s * .24); ctx.fillStyle = '#ffd36b'; for (const [dx, dy] of [[-.1, -.06], [.06, -.08], [-.02, -.16], [.14, .0]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, s * .07, 0, 7); ctx.fill(); } }
    },
    camp(ctx, x, y, s, lvl) {
      ctx.fillStyle = '#00000044'; ctx.beginPath(); ctx.ellipse(x, y + s * .24, s * .4, s * .13, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a2228'; ctx.beginPath(); ctx.moveTo(x - s * .14, y + s * .22); ctx.lineTo(x - s * .06, y - s * .38); ctx.lineTo(x + s * .06, y - s * .38); ctx.lineTo(x + s * .14, y + s * .22); ctx.fill();
      ctx.fillStyle = '#ff7a2a'; ctx.globalAlpha = .9; ctx.beginPath(); ctx.moveTo(x, y - s * .3); ctx.lineTo(x - s * .03, y - s * .05); ctx.lineTo(x + s * .03, y - s * .05); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#3a2a2a'; for (const dx of [-.28, .28]) { ctx.beginPath(); ctx.moveTo(x + dx * s - s * .12, y + s * .2); ctx.lineTo(x + dx * s, y - s * .06); ctx.lineTo(x + dx * s + s * .12, y + s * .2); ctx.fill(); }
      const g = ctx.createRadialGradient(x, y - s * .1, 0, x, y - s * .1, s * .5); g.addColorStop(0, 'rgba(255,122,42,.35)'); g.addColorStop(1, 'rgba(255,122,42,0)'); ctx.fillStyle = g; ctx.fillRect(x - s * .5, y - s * .6, s, s);
    },
    throne(ctx, x, y, s, mine) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, s * 1.8); g.addColorStop(0, mine ? 'rgba(255,211,107,.6)' : 'rgba(180,140,255,.35)'); g.addColorStop(1, 'rgba(255,211,107,0)'); ctx.fillStyle = g; ctx.fillRect(x - s * 2, y - s * 2, s * 4, s * 4);
      ctx.fillStyle = '#00000055'; ctx.beginPath(); ctx.ellipse(x, y + s * .55, s * 1.1, s * .35, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x - s * .8, y - s * .1, s * 1.6, s * .65);
      ctx.fillStyle = '#c9b48a'; for (const dx of [-.9, .62]) { ctx.fillRect(x + dx * s, y - s * .5, s * .28, s * 1.05); ctx.beginPath(); ctx.moveTo(x + dx * s - s * .04, y - s * .5); ctx.lineTo(x + dx * s + s * .14, y - s * .85); ctx.lineTo(x + dx * s + s * .32, y - s * .5); ctx.fill(); }
      ctx.fillStyle = '#f2e6cf'; ctx.beginPath(); ctx.moveTo(x - s * .28, y - s * .1); ctx.lineTo(x, y - s * 1.6); ctx.lineTo(x + s * .28, y - s * .1); ctx.fill();
      ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.moveTo(x, y - s * 1.6); ctx.lineTo(x + s * .28, y - s * .1); ctx.lineTo(x + s * .1, y - s * .1); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y - s * 1.7, s * .12, 0, 7); ctx.fill();
      ctx.fillStyle = '#3a2414'; ctx.fillRect(x - s * .12, y + s * .2, s * .24, s * .35);
    },
    tree: mapTree
  };

  const asset = (kind, id) => MAN[kind] && MAN[kind][id] ? 'art/' + MAN[kind][id] : null;
  // Key art comes in a portrait cut for phones and a wide cut ("<id>_w") for tablets and PC; pick by the screen's shape.
  const keyUrl = (id, wide) => { if (!MAN.key) return null; wide ??= innerWidth > innerHeight * 1.05; const k = (wide && MAN.key[id + '_w']) || MAN.key[id] || MAN.key[id + '_w']; return k ? 'art/' + k : null; };
  return { loopLen: k => (MAN.loops && MAN.loops[k]) || 0, iconSvg, asset, keyUrl, svg, shade, emblem, crownPath, icon, troop, portrait, enemy, building, cityBg, tree, mapPaint, setRealm, RARITY, painted, get P() { return P; } };
})();
