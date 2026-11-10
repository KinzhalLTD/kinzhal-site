// Rimal Realms — every picture in the game is drawn here as SVG (no image files).
// Original art: desert-kingdom buildings, falcon emblem, hero portraits, troops and icons.
'use strict';
const ART = (() => {
  const svg = (vb, inner, cls = '') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" class="${cls}" aria-hidden="true">${inner}</svg>`;

  /* ---------- emblem: falcon over a rising sun on a shield ---------- */
  const falcon = (fill = '#1b1430') => `<path fill="${fill}" d="M46 34L30 26L11 17L17 25L8 28L19 33L10 37L23 40L16 45L33 45L46 46ZM54 34L70 26L89 17L83 25L92 28L81 33L90 37L77 40L84 45L67 45L54 46ZM44 34C44 28 47 25 50 25C53 25 56 28 56 34L57 50C57 56 54 60 50 60C46 60 43 56 43 50ZM45 57L41 70L46 67L50 73L54 67L59 70L55 57ZM50 15.5A5.5 5.5 0 1 1 49.9 15.5ZM54.5 18.5L61 21L55 24Z"/><circle cx="52" cy="20" r="1.3" fill="#ffd36b"/>`;
  const emblem = (size = 64) => svg('0 0 100 100', `
    <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd36b"/><stop offset="1" stop-color="#d9822b"/></linearGradient>
    <linearGradient id="es" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c6f73"/><stop offset="1" stop-color="#0d3640"/></linearGradient></defs>
    <path d="M50 4l40 12v30c0 26-18 42-40 50C28 88 10 72 10 46V16z" fill="url(#eg)"/>
    <path d="M50 11l33 10v25c0 22-15 36-33 43-18-7-33-21-33-43V21z" fill="url(#es)"/>
    <circle cx="50" cy="62" r="17" fill="#ffb84a" opacity=".9"/>
    <path d="M18 66c10-5 20-6 32-2s22 3 32-2v10c-10 6-22 7-32 3s-22-4-32 2z" fill="#e8a33d"/>
    ${falcon('#0b1b22')}`, '').replace('<svg ', `<svg width="${size}" height="${size}" `);

  /* ---------- resource & misc icons ---------- */
  const IC = {
    grain: '<g><path d="M12 22V6" stroke="#8a5a1c" stroke-width="1.6"/><g fill="#f0c04a"><ellipse cx="12" cy="6" rx="2" ry="3.4"/><ellipse cx="9" cy="10" rx="2" ry="3.2" transform="rotate(-30 9 10)"/><ellipse cx="15" cy="10" rx="2" ry="3.2" transform="rotate(30 15 10)"/><ellipse cx="9" cy="15" rx="2" ry="3.2" transform="rotate(-30 9 15)"/><ellipse cx="15" cy="15" rx="2" ry="3.2" transform="rotate(30 15 15)"/></g></g>',
    timber: '<g><rect x="3" y="9" width="17" height="7" rx="3.5" fill="#9c5f2e"/><ellipse cx="20" cy="12.5" rx="3" ry="3.5" fill="#e3b07a"/><circle cx="20" cy="12.5" r="1.4" fill="#9c5f2e"/><rect x="5" y="15" width="12" height="6" rx="3" fill="#7e4a22"/></g>',
    stone: '<g><path d="M3 18l3-8 7-3 7 4 1 8-6 3H7z" fill="#a9a39a"/><path d="M6 10l7-3 7 4-7 2z" fill="#d6d0c6"/><path d="M13 13l7-2 1 8-6 3z" fill="#857f77"/></g>',
    ore: '<g><path d="M4 17l4-9h8l4 9-8 4z" fill="#5a6f86"/><path d="M8 8h8l-4 6z" fill="#9fc3e6"/><path d="M4 17l8-3 8 3-8 4z" fill="#3f4f63"/></g>',
    gold: '<g><circle cx="12" cy="12" r="9" fill="#e8a33d"/><circle cx="12" cy="12" r="6.5" fill="#ffd36b"/><path d="M12 7l1.5 3.4 3.5.3-2.7 2.3.8 3.5L12 14.6 8.9 16.5l.8-3.5L7 10.7l3.5-.3z" fill="#d9822b"/></g>',
    gem: '<g><path d="M5 9l3-4h8l3 4-7 11z" fill="#3fd7c8"/><path d="M5 9h14l-7 11z" fill="#1fa596"/><path d="M8 5l1 4h6l1-4" fill="#9ff4ea"/></g>',
    might: '<g><path d="M12 2l3 6 6 1-4.5 4.5 1 6.5L12 17l-5.5 3 1-6.5L3 9l6-1z" fill="#ff7a59"/></g>',
    vigor: '<g><path d="M13 2L5 13h6l-2 9 9-12h-6z" fill="#ffd36b"/></g>',
    clock: '<g fill="none" stroke="#f2e6cf" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></g>',
    help: '<g><path d="M4 14c3-1 5-4 8-4s3 2 6 2l2 4c-3 2-6 3-9 3-3 0-5-2-7-5z" fill="#ffd36b"/><path d="M8 9l3-4 3 4" stroke="#f2e6cf" stroke-width="2" fill="none"/></g>',
    shield: '<g><path d="M12 2l8 3v6c0 6-4 9-8 11-4-2-8-5-8-11V5z" fill="#3fd7c8"/><path d="M12 5l5 2v4c0 4-2.5 6-5 7.5z" fill="#1fa596"/></g>',
    crate: '<g><rect x="3" y="6" width="18" height="14" rx="2" fill="#9c5f2e"/><path d="M3 10h18M12 6v14" stroke="#e8a33d" stroke-width="2"/></g>',
    scroll: '<g><rect x="5" y="4" width="14" height="16" rx="2" fill="#f2e6cf"/><path d="M8 9h8M8 12h8M8 15h5" stroke="#9c5f2e" stroke-width="1.5"/></g>',
    chest: '<g><rect x="3" y="9" width="18" height="11" rx="2" fill="#9c5f2e"/><path d="M3 11c0-5 4-7 9-7s9 2 9 7z" fill="#c07a3a"/><rect x="10" y="10" width="4" height="5" rx="1" fill="#ffd36b"/></g>'
  };
  const icon = (k, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" class="ic" aria-hidden="true">${IC[k] || IC.scroll}</svg>`;

  /* ---------- troops ---------- */
  const TROOP_ART = {
    inf: c => `<path d="M30 8l2 50" stroke="#c9b48a" stroke-width="3"/><path d="M27 4l3-4 3 4-3 8z" fill="#cfd8e2"/><circle cx="20" cy="22" r="7" fill="#c98f5e"/><path d="M12 20c0-8 16-8 16 0z" fill="${c}"/><path d="M12 30h16l3 20H9z" fill="${c}"/><path d="M6 32c0 10 4 16 10 18V30z" fill="#7e4a22"/><path d="M8 34h6v10H8z" fill="#e8a33d"/>`,
    rng: c => `<path d="M42 10c10 12 10 32 0 44" stroke="#9c5f2e" stroke-width="3" fill="none"/><path d="M42 10v44" stroke="#f2e6cf" stroke-width="1"/><path d="M14 32h32" stroke="#c9b48a" stroke-width="2"/><path d="M46 32l-5-3v6z" fill="#cfd8e2"/><circle cx="24" cy="20" r="7" fill="#c98f5e"/><path d="M16 18c0-9 16-9 16 0l-2 3H18z" fill="${c}"/><path d="M16 28h16l2 24H14z" fill="${c}"/>`,
    cav: c => `<path d="M10 40c0-8 8-12 20-12h12l8-10 4 3-3 9c2 3 2 7 0 10z" fill="#c9a26b"/><path d="M28 28c-2-6 2-10 6-10s4 6 2 10z" fill="#b48b55"/><path d="M14 46v12M22 46v12M40 46v12M46 44v12" stroke="#8a6a3c" stroke-width="3"/><circle cx="30" cy="10" r="5" fill="#c98f5e"/><path d="M24 14h12v12H24z" fill="${c}"/><path d="M36 16l14-12" stroke="#cfd8e2" stroke-width="2"/>`,
    sie: c => `<rect x="8" y="38" width="44" height="8" rx="2" fill="#7e4a22"/><circle cx="16" cy="50" r="7" fill="#5a3418"/><circle cx="44" cy="50" r="7" fill="#5a3418"/><circle cx="16" cy="50" r="2" fill="#e8a33d"/><circle cx="44" cy="50" r="2" fill="#e8a33d"/><path d="M14 38L44 14" stroke="#9c5f2e" stroke-width="5"/><path d="M38 12c6-6 14-2 12 6" stroke="${c}" stroke-width="3" fill="none"/><path d="M20 38l8-14 8 14" fill="none" stroke="#9c5f2e" stroke-width="3"/>`
  };
  const troop = (type, tier, s = 56) => {
    const c = ['#b3433a', '#2f7d8c', '#7a4fb3'][tier - 1] || '#b3433a';
    return `<svg width="${s}" height="${s}" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="32" r="28" fill="#2a1f3d"/>${TROOP_ART[type](c)}<text x="52" y="14" font-size="11" font-weight="800" fill="#ffd36b" text-anchor="end">${'I'.repeat(tier)}</text></svg>`;
  };

  /* ---------- hero portraits (parametric) ---------- */
  const portrait = (h, s = 72) => {
    const p = h.look;
    const skin = p.skin, bg = p.bg, robe = p.robe, acc = p.acc;
    let head = '';
    switch (p.head) {
      case 'turban': head = `<path d="M24 36c-2-16 10-24 26-24s28 8 26 24c-6-6-14-8-26-8s-20 2-26 8z" fill="${acc}"/><path d="M28 26c8-6 30-6 44 2" stroke="${robe}" stroke-width="4" fill="none"/><circle cx="50" cy="20" r="4" fill="#3fd7c8"/>`; break;
      case 'hood': head = `<path d="M20 70c-4-30 6-56 30-56s34 26 30 56l-10-4c2-22-6-36-20-36S28 44 30 66z" fill="${acc}"/>`; break;
      case 'helm': head = `<path d="M26 40c0-18 10-26 24-26s24 8 24 26z" fill="#9aa6b2"/><path d="M48 8h4v12h-4z" fill="${acc}"/><path d="M47 40h6v14h-6z" fill="#9aa6b2"/><path d="M26 38h48v5H26z" fill="#6d7884"/>`; break;
      case 'scarf': head = `<path d="M22 72c-6-30 2-58 28-58s34 28 28 58c-6-4-8-14-8-28 0-12-8-18-20-18s-20 6-20 18c0 14-2 24-8 28z" fill="${acc}"/><path d="M30 26c6-6 34-6 40 0" stroke="${robe}" stroke-width="3" fill="none"/>`; break;
      case 'keffiyeh': head = `<path d="M22 70c-2-26 4-52 28-52s30 26 28 52l-8-2c0-20-6-36-20-36S30 48 30 68z" fill="#f2ede4"/><path d="M28 28h44" stroke="${acc}" stroke-width="5"/><path d="M27 24h46" stroke="#1b1430" stroke-width="3"/><path d="M34 34l4 4 4-4 4 4 4-4 4 4 4-4 4 4" stroke="${acc}" stroke-width="1.2" fill="none" opacity=".7"/>`; break;
      case 'crown': head = `<path d="M30 30l4-14 8 8 8-12 8 12 8-8 4 14z" fill="#ffd36b"/><circle cx="50" cy="22" r="2.5" fill="#ff5e7a"/><path d="M28 36c2-10 10-12 22-12s20 2 22 12" fill="${acc}"/>`; break;
      case 'goggles': head = `<path d="M26 38c0-16 10-24 24-24s24 8 24 24z" fill="${acc}"/><rect x="30" y="26" width="40" height="7" rx="3" fill="#5a3418"/><circle cx="40" cy="29" r="5" fill="#9fc3e6" stroke="#e8a33d" stroke-width="2"/><circle cx="60" cy="29" r="5" fill="#9fc3e6" stroke="#e8a33d" stroke-width="2"/>`; break;
      default: head = `<path d="M26 38c0-18 10-24 24-24s24 6 24 24c-6-8-14-10-24-10s-18 2-24 10z" fill="${acc}"/>`;
    }
    const beard = p.beard ? `<path d="M36 58c2 12 8 16 14 16s12-4 14-16c-4 4-8 5-14 5s-10-1-14-5z" fill="${p.beard}"/>` : '';
    const mask = p.mask ? `<path d="M34 56h32v8c-6 4-26 4-32 0z" fill="${p.mask}"/>` : '';
    return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" class="portrait" aria-hidden="true">
      <defs><radialGradient id="pb${h.id}" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#140f22"/></radialGradient></defs>
      <rect width="100" height="100" rx="14" fill="url(#pb${h.id})"/>
      <path d="M14 100c2-20 16-30 36-30s34 10 36 30z" fill="${robe}"/>
      <path d="M40 72l10 14 10-14" fill="none" stroke="${acc}" stroke-width="3"/>
      <rect x="42" y="58" width="16" height="16" fill="${skin}"/>
      <ellipse cx="50" cy="46" rx="18" ry="21" fill="${skin}"/>
      <ellipse cx="43" cy="46" rx="2.6" ry="3" fill="${p.eye}"/><ellipse cx="57" cy="46" rx="2.6" ry="3" fill="${p.eye}"/>
      <path d="M39 40l8 1M53 41l8-1" stroke="#2a1a10" stroke-width="2" stroke-linecap="round"/>
      <path d="M45 58c3 2 7 2 10 0" stroke="#7a3b2a" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${beard}${mask}${head}
      ${p.mark ? `<path d="M60 52l6-2" stroke="${p.mark}" stroke-width="2"/>` : ''}
    </svg>`;
  };

  /* ---------- enemies ---------- */
  const ENEMY = {
    jackal: `<path d="M20 70c0-20 12-32 30-32s30 12 30 32z" fill="#b48b55"/><path d="M28 40l-6-24 16 14zM72 40l6-24-16 14z" fill="#9c7444"/><ellipse cx="50" cy="50" rx="20" ry="16" fill="#c9a26b"/><path d="M42 60l8 14 8-14z" fill="#9c7444"/><circle cx="42" cy="48" r="3" fill="#ff5e3a"/><circle cx="58" cy="48" r="3" fill="#ff5e3a"/>`,
    scorpion: `<ellipse cx="50" cy="66" rx="24" ry="12" fill="#5a3418"/><path d="M70 62c14-6 18-22 10-34s-20-8-18 2" stroke="#7e4a22" stroke-width="7" fill="none"/><path d="M60 30l6-10 4 10z" fill="#ff5e3a"/><path d="M28 60l-14-10-4 6 12 8zM28 68l-16 2 0 6 16-4z" fill="#7e4a22"/><circle cx="40" cy="60" r="3" fill="#ffd36b"/><circle cx="50" cy="58" r="3" fill="#ffd36b"/>`,
    raider: `<path d="M18 100c2-20 14-30 32-30s30 10 32 30z" fill="#4a2a2a"/><ellipse cx="50" cy="48" rx="17" ry="20" fill="#a06a44"/><path d="M30 44c0-20 10-28 20-28s20 8 20 28c-4-4-10-6-20-6s-16 2-20 6z" fill="#2b2b2b"/><path d="M32 52h36v10c-10 6-26 6-36 0z" fill="#2b2b2b"/><circle cx="43" cy="46" r="2.5" fill="#ffd36b"/><circle cx="57" cy="46" r="2.5" fill="#ffd36b"/>`,
    wraith: `<path d="M24 92c0-40 8-70 26-70s26 30 26 70l-8-8-6 8-6-8-6 8-6-8-6 8-6-8z" fill="#c9b8e8" opacity=".85"/><ellipse cx="42" cy="44" rx="5" ry="7" fill="#1b1430"/><ellipse cx="58" cy="44" rx="5" ry="7" fill="#1b1430"/><path d="M44 62c4 3 8 3 12 0" stroke="#1b1430" stroke-width="3" fill="none"/>`,
    golem: `<path d="M22 92l6-40 22-14 22 14 6 40z" fill="#7fb7c9" opacity=".9"/><path d="M28 52l22-14 22 14-22 10z" fill="#bfe6f0"/><rect x="36" y="20" width="28" height="22" rx="4" fill="#9fd0de"/><circle cx="44" cy="31" r="3" fill="#ff5e7a"/><circle cx="56" cy="31" r="3" fill="#ff5e7a"/><path d="M12 56l12-4 4 22-12 2zM88 56l-12-4-4 22 12 2z" fill="#7fb7c9"/>`,
    colossus: `<rect x="26" y="40" width="48" height="52" rx="6" fill="#b5803a"/><rect x="32" y="12" width="36" height="30" rx="6" fill="#d9a04a"/><rect x="36" y="22" width="28" height="8" fill="#1b1430"/><circle cx="44" cy="26" r="3" fill="#ff5e3a"/><circle cx="56" cy="26" r="3" fill="#ff5e3a"/><circle cx="50" cy="62" r="8" fill="#ffd36b"/><path d="M10 44h16v30H10zM74 44h16v30H74z" fill="#9c6a2a"/>`
  };
  const enemy = (kind, s = 72) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100" class="portrait" aria-hidden="true"><rect width="100" height="100" rx="14" fill="#2a1520"/>${ENEMY[kind] || ENEMY.raider}</svg>`;

  /* ---------- buildings (drawn around 0,0, about 120 wide) ---------- */
  const sand = '#e3c08a', sand2 = '#c99e63', sand3 = '#a87b45', teal = '#1c6f73';
  const flag = (x, y, c = '#e8a33d') => `<path d="M${x} ${y}v-22" stroke="#5a3418" stroke-width="2"/><path d="M${x} ${y - 22}l14 4-14 5z" fill="${c}"/>`;
  const crenel = (x, y, w, c = sand2) => { let s = ''; for (let i = x; i < x + w - 4; i += 8) s += `<rect x="${i}" y="${y - 5}" width="5" height="5" fill="${c}"/>`; return s; };
  const box = (x, y, w, h, top = sand, side = sand2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${top}"/><rect x="${x}" y="${y + h - 6}" width="${w}" height="6" fill="${side}"/>`;
  const dome = (cx, cy, r, c = teal) => `<path d="M${cx - r} ${cy}a${r} ${r} 0 0 1 ${2 * r} 0z" fill="${c}"/><path d="M${cx} ${cy - r}v-6" stroke="#ffd36b" stroke-width="2"/><circle cx="${cx}" cy="${cy - r - 7}" r="2.4" fill="#ffd36b"/>`;
  const door = (x, y, w = 10, h = 14) => `<path d="M${x} ${y}v-${h - w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0v${h - w / 2}z" fill="#3a2414"/>`;
  const win = (x, y) => `<path d="M${x} ${y}v-5a3 3 0 0 1 6 0v5z" fill="#3a2414"/>`;
  const palm = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0c1-10 3-20 1-30" stroke="#8a5a1c" stroke-width="3.5" fill="none"/><g fill="#3e8a4a"><path d="M1-30c-10-4-18 0-22 6 8-4 14-4 22-6z"/><path d="M1-30c10-4 18 0 22 6-8-4-14-4-22-6z"/><path d="M1-30c-6-8-14-10-20-8 8 1 13 3 20 8z"/><path d="M1-30c6-8 14-10 20-8-8 1-13 3-20 8z"/><path d="M1-30c0-8 2-12 6-14-2 5-4 9-6 14z"/></g></g>`;
  const shadow = (w) => `<ellipse cx="0" cy="4" rx="${w}" ry="8" fill="#000" opacity=".18"/>`;

  const B = {
    citadel: L => `${shadow(70)}${box(-58, -50, 116, 54)}${crenel(-58, -50, 116)}<rect x="-70" y="-78" width="24" height="82" fill="${sand2}"/><rect x="46" y="-78" width="24" height="82" fill="${sand2}"/>${crenel(-70, -78, 24, sand3)}${crenel(46, -78, 24, sand3)}${box(-30, -86, 60, 40, '#ead0a0')}${dome(0, -86, 22, L >= 10 ? '#e8a33d' : teal)}${door(-9, 4, 18, 26)}${win(-62, -40)}${win(54, -40)}${win(-20, -60)}${win(14, -60)}${flag(-58, -78)}${flag(58, -78, '#3fd7c8')}${L >= 5 ? `<rect x="-6" y="-120" width="12" height="16" fill="${sand2}"/>` : ''}`,
    barracks: () => `${shadow(52)}${box(-50, -34, 100, 38)}${crenel(-50, -34, 100)}${door(-8, 4, 16, 20)}<path d="M-40-20l14 0M28-20l14 0" stroke="#5a3418" stroke-width="3"/><path d="M-44-4l12-20M44-4l-12-20" stroke="#cfd8e2" stroke-width="2"/>${flag(40, -34, '#b3433a')}`,
    academy: () => `${shadow(46)}${box(-42, -36, 84, 40, '#ead0a0')}${dome(0, -36, 24, '#2f7d8c')}${door(-7, 4, 14, 18)}${win(-32, -14)}${win(26, -14)}<rect x="30" y="-64" width="10" height="30" fill="${sand2}"/><circle cx="35" cy="-68" r="5" fill="#9fc3e6"/>`,
    infirmary: () => `${shadow(42)}${box(-40, -30, 80, 34)}${dome(0, -30, 16, '#f2ede4')}<rect x="-4" y="-24" width="8" height="20" fill="#3fd7c8"/><rect x="-10" y="-18" width="20" height="8" fill="#3fd7c8"/>${door(-24, 4)}${palm(32, 6, .7)}`,
    vault: () => `${shadow(40)}${box(-38, -40, 76, 44, sand2, sand3)}<rect x="-14" y="-28" width="28" height="30" rx="3" fill="#5a3418"/><circle cx="0" cy="-12" r="7" fill="#e8a33d"/><path d="M0-12l5-3" stroke="#5a3418" stroke-width="2"/>${crenel(-38, -40, 76, sand3)}`,
    tower: () => `${shadow(26)}<path d="M-18 4l4-90h28l4 90z" fill="${sand}"/><rect x="-20" y="-96" width="40" height="14" fill="${sand2}"/>${crenel(-20, -96, 40, sand3)}${win(-3, -60)}${win(-3, -30)}${flag(0, -100, '#3fd7c8')}`,
    embassy: () => `${shadow(46)}${box(-44, -32, 88, 36, '#ead0a0')}<path d="M-50-32h100l-50-22z" fill="#9c5f2e"/>${door(-8, 4, 16, 20)}<path d="M-30-30v-40" stroke="#5a3418" stroke-width="2"/><path d="M-30-70h22v14h-22z" fill="#1c6f73"/><path d="M-24-63l5-4 5 4" stroke="#ffd36b" stroke-width="1.5" fill="none"/>`,
    mews: () => `${shadow(40)}${box(-38, -30, 76, 34)}<path d="M-38-30c0-20 76-20 76 0" fill="#9c5f2e"/>${door(-8, 4, 16, 18)}<g transform="translate(-26 -70) scale(.5)">${falcon('#3a2414')}</g>`,
    market: () => `${shadow(46)}${box(-44, -18, 88, 22)}<path d="M-48-18h32l-4-14h-24zM-16-18h32l-4-14h-24zM16-18h32l-4-14h-24z" fill="#b3433a"/><path d="M-44-32h24M-12-32h24M20-32h24" stroke="#f2ede4" stroke-width="2" stroke-dasharray="4 4"/><circle cx="-30" cy="-6" r="4" fill="#f0c04a"/><circle cx="2" cy="-6" r="4" fill="#9fc3e6"/><circle cx="32" cy="-6" r="4" fill="#3e8a4a"/>`,
    wall: L => `${shadow(46)}<rect x="-46" y="-44" width="22" height="48" fill="${sand2}"/><rect x="24" y="-44" width="22" height="48" fill="${sand2}"/>${crenel(-46, -44, 22, sand3)}${crenel(24, -44, 22, sand3)}${box(-24, -34, 48, 38, '#ead0a0')}${crenel(-24, -34, 48)}<path d="M-12 4v-16a12 12 0 0 1 24 0v16z" fill="#5a3418"/><path d="M-12-6h24M-12 0h24M-6-22v26M0-24v28M6-22v26" stroke="#3a2414" stroke-width="1.5"/>${flag(-35, -44, L >= 5 ? '#e8a33d' : '#3fd7c8')}${flag(35, -44, L >= 5 ? '#e8a33d' : '#3fd7c8')}`,
    farm: L => `${shadow(30)}<path d="M-34 0l34-14 34 14-34 14z" fill="#7aa64a"/><path d="M-26 0l26-10 26 10-26 10z" fill="#9cc25c"/><g stroke="#f0c04a" stroke-width="2">${[-16, -6, 4, 14].map(x => `<path d="M${x}-${4 + (x + 20) / 8}v-8"/>`).join('')}</g>${box(-34, -26, 18, 16, '#ead0a0')}<path d="M-36-26l11-8 11 8z" fill="#9c5f2e"/>`,
    lumber: () => `${shadow(30)}${palm(-20, 0, .9)}${palm(18, -2, .8)}<rect x="-14" y="-8" width="28" height="7" rx="3.5" fill="#9c5f2e"/><rect x="-10" y="-14" width="20" height="7" rx="3.5" fill="#7e4a22"/>`,
    quarry: () => `${shadow(32)}<path d="M-34 2l8-26 20-8 22 6 14 24z" fill="#a9a39a"/><path d="M-20-6l10-12 12 4-4 10z" fill="#d6d0c6"/><path d="M10-4l10-10 6 12z" fill="#857f77"/><path d="M-6-28l-8 30" stroke="#5a3418" stroke-width="2"/>`,
    mine: () => `${shadow(30)}<path d="M-32 4c0-24 14-38 32-38s32 14 32 38z" fill="#857f77"/><path d="M-12 4v-16a12 12 0 0 1 24 0v16z" fill="#1b1430"/><path d="M-14-12h28M-14-12v16M14-12v16" stroke="#9c5f2e" stroke-width="3"/><path d="M18-22l6-6 4 4-6 4z" fill="#9fc3e6"/>`,
    empty: () => `<path d="M-30 0l30-12 30 12-30 12z" fill="#000" opacity=".12" stroke="#f2e6cf" stroke-dasharray="4 4" stroke-opacity=".5"/><text x="0" y="5" text-anchor="middle" font-size="16" fill="#f2e6cf" opacity=".7">+</text>`
  };
  const building = (id, L) => (B[id] || B.empty)(L || 1);

  /* ---------- city background ---------- */
  const cityBg = () => `
    <defs>
      <radialGradient id="sandG" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#f0d29c"/><stop offset=".7" stop-color="#dbb277"/><stop offset="1" stop-color="#b98a52"/></radialGradient>
      <linearGradient id="waterG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3fd7c8"/><stop offset="1" stop-color="#1c6f73"/></linearGradient>
      <pattern id="dunes" width="80" height="40" patternUnits="userSpaceOnUse"><path d="M0 30c20-12 40-12 80 0" stroke="#c99e63" stroke-width="2" fill="none" opacity=".45"/></pattern>
    </defs>
    <rect width="1000" height="700" fill="url(#sandG)"/><rect width="1000" height="700" fill="url(#dunes)"/>
    <ellipse cx="880" cy="120" rx="80" ry="34" fill="url(#waterG)"/>${palm(820, 120, 1)}${palm(940, 110, .9)}${palm(860, 150, .8)}
    <path d="M500 130L820 290 500 450 180 290z" fill="#e8c993" stroke="${sand3}" stroke-width="2"/>
    <path d="M500 112L850 290 500 468 150 290z" fill="none" stroke="${sand2}" stroke-width="14" stroke-linejoin="round"/>
    <path d="M500 112L850 290 500 468 150 290z" fill="none" stroke="#ead0a0" stroke-width="5" stroke-dasharray="10 6" stroke-linejoin="round"/>
    <path d="M500 468v120" stroke="#cfae78" stroke-width="26"/>
    ${palm(120, 600, 1.1)}${palm(70, 380, 1)}${palm(960, 560, 1.1)}`;

  /* ---------- world map tile painters (canvas) ---------- */
  const mapPaint = {
    city(ctx, x, y, s, color, lvl) {
      ctx.fillStyle = '#00000033'; ctx.beginPath(); ctx.ellipse(x, y + s * .3, s * .42, s * .14, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#e3c08a'; ctx.fillRect(x - s * .32, y - s * .18, s * .64, s * .42);
      ctx.fillStyle = '#c99e63'; ctx.fillRect(x - s * .4, y - s * .34, s * .14, s * .58); ctx.fillRect(x + s * .26, y - s * .34, s * .14, s * .58);
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y - s * .18, s * .16, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#3a2414'; ctx.fillRect(x - s * .05, y + s * .06, s * .1, s * .18);
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + s * .33, y - s * .34); ctx.lineTo(x + s * .33, y - s * .58); ctx.lineTo(x + s * .5, y - s * .52); ctx.lineTo(x + s * .33, y - s * .46); ctx.fill();
    },
    node(ctx, x, y, s, kind) {
      const c = { grain: ['#9cc25c', '#f0c04a'], timber: ['#3e8a4a', '#9c5f2e'], stone: ['#a9a39a', '#d6d0c6'], ore: ['#5a6f86', '#9fc3e6'], gold: ['#e8a33d', '#ffd36b'] }[kind];
      ctx.fillStyle = '#00000026'; ctx.beginPath(); ctx.ellipse(x, y + s * .22, s * .36, s * .12, 0, 0, 7); ctx.fill();
      ctx.fillStyle = c[0]; ctx.beginPath(); ctx.moveTo(x - s * .34, y + s * .2); ctx.lineTo(x - s * .1, y - s * .26); ctx.lineTo(x + s * .12, y - s * .1); ctx.lineTo(x + s * .34, y + s * .2); ctx.fill();
      ctx.fillStyle = c[1]; ctx.beginPath(); ctx.arc(x - s * .06, y - s * .02, s * .1, 0, 7); ctx.arc(x + s * .14, y + s * .08, s * .08, 0, 7); ctx.fill();
    },
    camp(ctx, x, y, s) {
      ctx.fillStyle = '#00000030'; ctx.beginPath(); ctx.ellipse(x, y + s * .24, s * .38, s * .12, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#7e2f2f'; ctx.beginPath(); ctx.moveTo(x - s * .34, y + s * .22); ctx.lineTo(x, y - s * .3); ctx.lineTo(x + s * .34, y + s * .22); ctx.fill();
      ctx.fillStyle = '#4a1a1a'; ctx.beginPath(); ctx.moveTo(x - s * .08, y + s * .22); ctx.lineTo(x, y); ctx.lineTo(x + s * .08, y + s * .22); ctx.fill();
      ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - s * .3); ctx.lineTo(x, y - s * .48); ctx.stroke();
      ctx.fillStyle = '#ff5e3a'; ctx.fillRect(x, y - s * .48, s * .16, s * .08);
    },
    throne(ctx, x, y, s) {
      ctx.fillStyle = '#3fd7c8'; ctx.beginPath(); ctx.ellipse(x, y + s * .5, s * 1.3, s * .5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ead0a0'; ctx.fillRect(x - s * .8, y - s * .4, s * 1.6, s * .9);
      ctx.fillStyle = '#c99e63'; for (const dx of [-0.95, 0.65]) ctx.fillRect(x + dx * s, y - s * .9, s * .3, s * 1.4);
      ctx.fillStyle = '#e8a33d'; ctx.beginPath(); ctx.arc(x, y - s * .4, s * .5, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(x, y - s * .95, s * .08, 0, 7); ctx.fill();
      ctx.fillStyle = '#3a2414'; ctx.fillRect(x - s * .12, y + s * .1, s * .24, s * .4);
    },
    palm(ctx, x, y, s) {
      ctx.strokeStyle = '#8a5a1c'; ctx.lineWidth = Math.max(1, s * .06); ctx.beginPath(); ctx.moveTo(x, y + s * .2); ctx.quadraticCurveTo(x + s * .05, y - s * .1, x, y - s * .3); ctx.stroke();
      ctx.fillStyle = '#3e8a4a'; for (let a = 0; a < 5; a++) { ctx.beginPath(); ctx.ellipse(x + Math.cos(a * 1.26) * s * .14, y - s * .3 + Math.sin(a * 1.26) * s * .06, s * .16, s * .05, a * 1.26, 0, 7); ctx.fill(); }
    }
  };

  return { svg, emblem, icon, troop, portrait, enemy, building, cityBg, mapPaint, falcon };
})();
