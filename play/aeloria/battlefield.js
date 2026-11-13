// Aeloria battlefield: two armies of soldiers marching, charging and fighting on a canvas.
// It is a view of the fight state owned by game.js: squad sizes follow each unit's health.
const BF = (() => {
  const IMG = {};
  const img = url => { if (!url) return null; let i = IMG[url]; if (!i || (i.dataset.failed && Date.now() > +i.dataset.retryAt)) { const n = i ? (+i.dataset.tries || 0) + 1 : 0; i = IMG[url] = new Image(); i.decoding = 'async'; i.dataset.tries = n; i.onerror = () => { i.dataset.failed = 1; i.dataset.retryAt = Date.now() + Math.min(30000, 1000 * 2 ** n); }; i.src = url; } return i.complete && i.naturalWidth ? i : null; };
  const ROLE = { Tank: 'foot', Warrior: 'cav', Assassin: 'foot', Ranged: 'archer', Engineer: 'archer', Mage: 'mage', Support: 'mage' };
  const KIND = { ghoul: 'ghoul', hound: 'hound', raider: 'raider', stalker: 'hound', wraith: 'wraith', troll: 'brute', phantom: 'wraith', serpent: 'ghoul', golem: 'brute', warlord: 'raider', queen: 'wraith', wyrm: 'brute', lantern: 'wraith', kraken: 'brute', hollow: 'raider' };
  const SIZE = { foot: 1, archer: 1.05, cav: 1.3, mage: 1.05, raider: 1.1, ghoul: .95, hound: .78, brute: 1.55, wraith: 1.1 };
  const COUNT = { foot: 9, archer: 6, cav: 6, mage: 5, raider: 9, ghoul: 9, hound: 8, brute: 3, wraith: 6 };
  // enemy squads are made of their own creature; big ones come in smaller packs
  const FSIZE = { ghoul: .95, hound: .85, raider: 1.1, stalker: .95, wraith: 1.1, troll: 1.4, phantom: 1.05, serpent: 1.15, golem: 1.45, warlord: 1.3, queen: 1.15, wyrm: 1.35, lantern: 1.2, kraken: 1.35, hollow: 1.3 };
  const FCOUNT = { ghoul: 9, hound: 8, raider: 9, stalker: 6, wraith: 6, troll: 4, phantom: 6, serpent: 5, golem: 3, warlord: 5, queen: 5, wyrm: 3, lantern: 5, kraken: 3, hollow: 5 };
  const WIDE = new Set(['cav', 'hound', 'stalker', 'serpent', 'wyrm', 'kraken']);
  Object.assign(SIZE, FSIZE); Object.assign(COUNT, FCOUNT);
  const RANGED = new Set(['archer', 'mage', 'wraith', 'phantom', 'queen', 'lantern']);
  const SHOT = { archer: '#f4e6c0', mage: '#5ff0e0', wraith: '#ff9a3d' };
  let needSize = true, ro = null, groundCv = null; const SC = {};
  let cv = null, ctx, F = null, raf = 0, W = 0, H = 0, dpr = 1, S0 = 40, squads = [], parts = [], floats = [], shots = [], rings = [], last = 0, T = 0, ended = 0, shakeT = 0, shakeP = 0;
  const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const still = () => window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;

  function squadOf(u) { return squads.find(q => q.u === u || q.u.id === u); }
  function build(u, side, i, n, boss) {
    const own = !u.hero && ART.asset('fiends', u.kind), type = u.hero ? ROLE[u.hero.role] || 'foot' : own ? u.kind : KIND[u.kind] || 'raider', ranged = RANGED.has(type), N = boss ? 5 : COUNT[type] || 6, cols = ranged ? 2 : 3;
    const q = { u, side, i, n, type, ranged, boss, N, dir: side === 'h' ? 1 : -1, sol: [], surge: null, flash: 0, kick: 0, cheer: 0, por: ART.asset(u.hero ? 'heroes' : 'foes', u.hero ? u.hero.id : u.kind), spr: own || ART.asset('army', type), champ: u.hero ? ART.asset('champions', u.hero.id) : null };
    for (let k = 0; k < N; k++) {
      const giant = boss && k === 0, c = giant ? 0 : Math.floor((boss ? k + 2 : k) / 3) % (cols + 2), r = giant ? 1 : (boss ? k + 2 : k) % 3;
      q.sol.push({ c, r, giant, x: null, y: 0, ph: Math.random() * 6.28, alive: true, die: 0, hop: 0, nextHop: rnd(.3, 1.6), jx: rnd(-.12, .12), jy: rnd(-.08, .08) });
    }
    if (q.champ) q.sol.unshift({ c: ranged ? -.2 : -.55, r: 1.9, cmd: true, x: null, y: 0, ph: 0, alive: true, die: 0, hop: 0, nextHop: rnd(.3, 1.2), jx: 0, jy: .02 });
    return q;
  }
  function start(fight, canvas) {
    stop(); F = fight; cv = canvas; ctx = cv.getContext('2d'); squads = []; parts = []; floats = []; shots = []; rings = []; ended = 0; T = 0; last = 0;
    const base = fight.foes[0] ? fight.foes[0].max : 0;
    fight.heroes.forEach((u, i) => squads.push(build(u, 'h', i, fight.heroes.length, false)));
    fight.foes.forEach((u, i) => squads.push(build(u, 'f', i, fight.foes.length, !u.hero && u.max > 2 * base)));
    squads.forEach(q => { img(q.spr); img(q.por); img(q.champ); });
    cv.onpointerdown = tap; needSize = true; W = H = 0; if (window.ResizeObserver) { ro = new ResizeObserver(() => { needSize = true; }); ro.observe(cv); } raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; if (ro) { ro.disconnect(); ro = null; } if (cv) cv.onpointerdown = null; cv = null; F = null; squads = []; }
  function end(win) { ended = win ? 1 : -1; squads.forEach(q => { q.cheer = (q.side === 'h') === win ? 1 : 0; }); }

  /* ---------- geometry ---------- */
  function size() {
    if (needSize || !ro) { needSize = false; const w = cv.clientWidth, h = cv.clientHeight; dpr = Math.min(1.5, window.devicePixelRatio || 1); if (w !== W || h !== H || cv.width !== Math.round(w * dpr)) { W = w; H = h; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); groundCv = null; } }
    const L = Math.max(F.heroes.length, F.foes.length, 2); S0 = clamp(Math.min(H / (L * 2.35), W / 8.2), 26, 80);
  }
  const laneY = q => H * (.3 + .66 * (q.i + .5) / q.n);
  const depth = q => .88 + .24 * (q.i + .5) / q.n;
  const anchorX = q => W * .5 - q.dir * (q.ranged ? Math.min(W * .3, S0 * 3.4) : S0 * .42);
  const center = q => ({ x: anchorX(q) - q.dir * S0 * (q.ranged ? .35 : .6), y: laneY(q) });
  function home(q, s) {
    const sc = S0 * depth(q), sp = q.type === 'cav' || q.type === 'hound' ? .82 : q.type === 'brute' ? .9 : .62;
    return { x: anchorX(q) - q.dir * (s.c * sp + (s.r % 2) * sp * .45 + s.jx) * sc, y: laneY(q) + ((s.r - 1) * .36 + s.jy) * sc };
  }

  /* ---------- events from the fight ---------- */
  function attack(side, u, target) {
    const q = squadOf(u), tq = squadOf(target); if (!q || !tq || !cv) return;
    const c = center(tq), sp = F.speed || 1;
    if (q.ranged) q.sol.filter(s => s.alive).slice(0, 6).forEach((s, k) => shots.push({ x0: s.x, y0: s.y - S0 * .7, x1: c.x + rnd(-.5, .5) * S0, y1: c.y - S0 * rnd(.2, .8), t: T + k * .03, d: .24 / sp, col: SHOT[q.type], magic: q.type !== 'archer' }));
    else q.surge = { x: c.x, y: c.y, t: T, d: .42 / sp };
  }
  function hit(side, id, txt, cls) {
    const q = squadOf(id); if (!q || !cv) return; const c = center(q);
    if (cls === 'heal') { for (let k = 0; k < 14; k++) parts.push({ x: c.x + rnd(-1, 1) * S0, y: c.y - rnd(0, 1) * S0, vx: 0, vy: -rnd(20, 60), life: rnd(.5, 1), max: 1, col: '#6fe39a', sz: rnd(2, 4), g: 0 }); }
    else if (cls !== 'info') {
      q.flash = 1; q.kick = 1; const n = cls === 'crit' ? 22 : 10;
      for (let k = 0; k < n; k++) { const a = rnd(0, 6.28), v = rnd(40, cls === 'crit' ? 240 : 150); parts.push({ x: c.x + rnd(-.4, .4) * S0, y: c.y - S0 * rnd(.3, .9), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: rnd(.2, .5), max: .5, col: cls === 'crit' ? '#ffd36b' : '#fff3c4', sz: rnd(1.5, 3.5), g: 300 }); }
      if (cls === 'crit') { shakeT = .25; shakeP = 5; }
    }
    floats.push({ x: c.x + rnd(-.3, .3) * S0, y: c.y - S0 * 1.5, txt, cls, t: T });
  }
  function skill(u, kind) {
    const q = squadOf(u); if (!q || !cv) return; const c = center(q), foes = squads.filter(s => s.side !== q.side && s.u.hp > 0), mine = squads.filter(s => s.side === q.side && s.u.hp > 0);
    rings.push({ x: c.x, y: c.y - S0 * .4, t: T, d: .5, r: S0 * 2.2, col: '#ffd36b' });
    const col = { aoe: '#ff7a3d', stun: '#b79cff', single: '#fff', crit: '#fff', heal: '#6fe39a', shield: '#3fd7c8', buff: '#ffd36b' }[kind] || '#fff';
    const on = kind === 'heal' || kind === 'shield' || kind === 'buff' ? mine : kind === 'single' || kind === 'crit' ? foes.filter(s => s.flash > 0 || s.u.id === F.target).slice(0, 1).concat(foes).slice(0, 1) : foes;
    on.forEach(s => {
      const p = center(s); rings.push({ x: p.x, y: p.y - S0 * .3, t: T + .05, d: .6, r: S0 * 2.6, col, fill: true });
      for (let k = 0; k < 26; k++) { const a = rnd(0, 6.28), v = rnd(60, 260); parts.push({ x: p.x, y: p.y - S0 * .5, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6 - (kind === 'aoe' ? 90 : 30), life: rnd(.4, .9), max: .9, col, sz: rnd(2, 5), g: kind === 'heal' || kind === 'buff' ? -120 : 220 }); }
    });
    if (on === foes) { shakeT = .4; shakeP = 9; }
  }
  function tap(e) {
    if (!F || F.over) return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let best = null, bd = 1e9;
    squads.forEach(q => { if (q.u.hp <= 0) return; const c = center(q), d = Math.hypot(c.x - x, (c.y - S0 * .5 - y) * 1.3); if (d < bd) { bd = d; best = q; } });
    if (best && bd < S0 * 2.2 && api.onTap) api.onTap(best.side, best.u);
  }

  /* ---------- simulation of the picture ---------- */
  function step(dt) {
    squads.forEach(q => {
      const u = q.u, want = u.hp <= 0 ? 0 : Math.max(1, Math.ceil(u.hp / u.max * q.N)) + (q.champ ? 1 : 0); let live = q.sol.filter(s => s.alive);
      while (live.length > want) { const pool = live.filter(s => !s.giant && !s.cmd), s = pool.length ? pool.reduce((a, b) => (a.c + Math.random() * .8 < b.c + Math.random() * .8 ? a : b)) : live[0]; s.alive = false; s.die = T; live = live.filter(v => v !== s); }
      if (live.length < want) { const d = q.sol.filter(s => !s.alive).sort((a, b) => b.die - a.die); for (let k = 0; k < want - live.length && d[k]; k++) { d[k].alive = true; d[k].x = null; } }
      q.flash = Math.max(0, q.flash - dt * 5); q.kick = Math.max(0, q.kick - dt * 5);
      let sx = 0, sy = 0, surging = 0;
      if (q.surge) { const p = (T - q.surge.t) / q.surge.d; if (p >= 1) q.surge = null; else { const k = Math.sin(Math.PI * p), a = { x: anchorX(q), y: laneY(q) }; sx = (q.surge.x - q.dir * S0 * .2 - a.x) * k; sy = (q.surge.y - a.y) * k; surging = k; } }
      const foeLive = squads.some(o => o.side !== q.side && o.u.hp > 0);
      q.sol.forEach(s => {
        if (!s.alive) return; const h = home(q, s);
        if (s.x === null) { s.x = h.x - q.dir * (W * .55 + rnd(0, 40)); s.y = h.y; }
        // idle skirmishing: front ranks keep stabbing at the line while the battle rages
        if (!ended && foeLive && !q.ranged && T > s.nextHop && Math.abs(s.x - h.x) < 6) { s.hop = T; s.nextHop = T + rnd(.7, 1.9) * (s.c ? 1.8 : 1); if (s.c === 0 && Math.random() < .5) parts.push({ x: h.x + q.dir * S0 * .55, y: h.y - S0 * rnd(.4, .8), vx: q.dir * rnd(20, 80), vy: -rnd(20, 90), life: .25, max: .25, col: '#fff3c4', sz: 2, g: 300 }); }
        const hp = clamp((T - s.hop) / .28, 0, 1), hopK = s.hop ? Math.sin(Math.PI * hp) : 0;
        const tx = h.x + sx * (1 - s.c * .12) + q.dir * (hopK * S0 * .3 - q.kick * S0 * .18), ty = h.y + sy * (1 - s.c * .1);
        const k = Math.min(1, dt * (surging ? 22 : 5)); s.moving = Math.abs(tx - s.x) > 2.5; s.x += (tx - s.x) * k; s.y += (ty - s.y) * k; s.lean = hopK + surging * .8;
        if (s.moving && Math.random() < dt * 6) parts.push({ x: s.x - q.dir * S0 * .2, y: s.y, vx: -q.dir * rnd(5, 25), vy: -rnd(4, 18), life: .5, max: .5, col: '#c9b08a', sz: rnd(2, 4), g: 0, dust: true });
      });
    });
    parts = parts.filter(p => (p.life -= dt) > 0); parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; });
    shots = shots.filter(s => T < s.t + s.d + .05); floats = floats.filter(f => T - f.t < 1); rings = rings.filter(r => T < r.t + r.d);
    if (parts.length > 500) parts.splice(0, parts.length - 500);
  }

  /* ---------- drawing ---------- */
  function drawSoldier(q, s) {
    const sc = S0 * depth(q) * (s.cmd ? (q.u.hero.id === 'kofi' ? 1.9 : 2.15) : SIZE[q.type] * (s.giant ? 2.1 : 1)), im = img(s.cmd ? q.champ : q.spr), dead = !s.alive, age = dead ? T - s.die : 0; if (dead && age > 1.1) return;
    const bob = s.moving ? Math.abs(Math.sin(T * 11 + s.ph)) * sc * .07 : Math.sin(T * 2.2 + s.ph) * sc * .012, cheer = q.cheer ? Math.abs(Math.sin(T * 7 + s.ph)) * sc * .22 : 0;
    const float = !s.cmd && (q.type === 'wraith' || q.type === 'phantom' || q.type === 'lantern') ? sc * .12 + Math.sin(T * 3 + s.ph) * sc * .05 : 0;
    ctx.save(); ctx.translate(s.x, s.y);
    ctx.globalAlpha = dead ? clamp(1 - age / 1.1, 0, 1) * .5 : .34; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 0, sc * (WIDE.has(q.type) && !s.cmd ? .5 : .3), sc * .09, 0, 0, 6.28); ctx.fill();
    if (s.cmd && !dead) { const rd = q.u.en >= 100 && !F.auto; ctx.globalAlpha = rd ? .55 + Math.sin(T * 8) * .25 : .35; ctx.strokeStyle = rd ? '#ffd36b' : '#5ab0ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, sc * .34, sc * .1, 0, 0, 6.28); ctx.stroke(); }
    ctx.globalAlpha = dead ? clamp(1 - (age - .35) / .7, 0, 1) : 1;
    ctx.translate(0, -bob - cheer - float); ctx.scale(q.dir, 1);
    if (dead) ctx.rotate(-Math.min(1, age / .35) * 1.45); else if (s.lean) ctx.rotate(s.lean * .16);
    if (im) {
      const h = sc, w = h * im.naturalWidth / im.naturalHeight, ph = Math.max(8, Math.ceil(h * dpr / 6) * 6), key = (s.cmd ? q.champ : q.spr) + ph; let cs = SC[key];
      if (!cs) { cs = SC[key] = document.createElement('canvas'); cs.height = ph; cs.width = Math.max(1, Math.round(ph * im.naturalWidth / im.naturalHeight)); const cc = cs.getContext('2d'); cc.imageSmoothingQuality = 'high'; cc.drawImage(im, 0, 0, cs.width, cs.height); }
      ctx.drawImage(cs, -w / 2, -h, w, h);
      if (q.flash > .25 && !dead) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = q.flash * .75; ctx.drawImage(cs, -w / 2, -h, w, h); ctx.globalCompositeOperation = 'source-over'; }
    } else { ctx.fillStyle = q.side === 'h' ? '#5a8fd8' : '#b3433a'; ctx.fillRect(-sc * .18, -sc * .8, sc * .36, sc * .8); ctx.beginPath(); ctx.arc(0, -sc * .9, sc * .16, 0, 6.28); ctx.fill(); }
    ctx.restore();
  }
  function say(u, txt) { const q = squadOf(u); if (q) { q.say = txt; q.sayT = T; } }
  function drawPlate(q) {
    const u = q.u, s = q.sol[0]; if (u.hp <= 0 || !s || !s.cmd || s.x === null) return;
    const sc = S0 * depth(q) * 2.15, w = Math.max(54, S0 * 1.5), x = s.x, y = s.y - sc - 10, ready = u.en >= 100 && !F.auto;
    ctx.save(); ctx.font = `800 ${Math.round(clamp(S0 * .26, 10, 14))}px Cairo,system-ui,sans-serif`; ctx.textAlign = 'center';
    const nm = u.name, tw = Math.max(w, ctx.measureText(nm).width + 12);
    ctx.fillStyle = ready ? `rgba(255,211,107,${.85 + Math.sin(T * 9) * .15})` : 'rgba(20,15,34,.85)'; ctx.beginPath(); ctx.roundRect(x - tw / 2, y - 26, tw, 17, 8); ctx.fill();
    ctx.fillStyle = ready ? '#2c1604' : '#f3ecff'; ctx.fillText(ready ? nm + ' ⚡' : nm, x, y - 13);
    if (q.say && T - q.sayT < 1.8) { const a = clamp(Math.min((T - q.sayT) * 6, (1.8 - (T - q.sayT)) * 4), 0, 1); ctx.globalAlpha = a; ctx.font = `800 ${Math.round(clamp(S0 * .3, 11, 15))}px Cairo,system-ui,sans-serif`; const bw = ctx.measureText(q.say).width + 18, bx = clamp(x, bw / 2 + 4, W - bw / 2 - 4), by = y - 58; ctx.fillStyle = '#fff8e6'; ctx.beginPath(); ctx.roundRect(bx - bw / 2, by - 15, bw, 26, 13); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 6, by + 10); ctx.lineTo(x, by + 20); ctx.lineTo(x + 6, by + 10); ctx.fill(); ctx.fillStyle = '#2c1604'; ctx.fillText(q.say, bx, by + 3); ctx.globalAlpha = 1; ctx.font = `800 ${Math.round(clamp(S0 * .26, 10, 14))}px Cairo,system-ui,sans-serif`; }
    ctx.fillStyle = '#000a'; ctx.fillRect(x - w / 2 - 1, y - 7, w + 2, 9); ctx.fillStyle = '#5fd38a'; ctx.fillRect(x - w / 2, y - 6, w * clamp(u.hp / u.max, 0, 1), 4); ctx.fillStyle = '#ffd36b'; ctx.fillRect(x - w / 2, y - 1, w * clamp(u.en / 100, 0, 1), 2);
    ctx.restore();
  }
  function drawBanner(q) {
    if (q.champ) return drawPlate(q);
    const u = q.u; if (u.hp <= 0) return; const c = center(q), sc = S0 * depth(q), r = sc * .3, x = c.x - q.dir * sc * (q.ranged ? .5 : 1.25), y = c.y - sc * (q.boss ? 2.55 : 1.62), col = q.side === 'h' ? '#5ab0ff' : '#ff5e3a';
    ctx.save(); ctx.strokeStyle = '#3a2414'; ctx.lineWidth = Math.max(2, sc * .05); ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x, c.y - sc * .1); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); const wv = Math.sin(T * 5 + q.i) * r * .18; ctx.moveTo(x, y + r * 1.05); ctx.lineTo(x + q.dir * r * 1.5, y + r * 1.3 + wv); ctx.lineTo(x, y + r * 1.9); ctx.fill();
    const ready = q.side === 'h' && u.en >= 100 && !F.auto;
    if (ready) { ctx.fillStyle = `rgba(255,211,107,${.25 + Math.sin(T * 9) * .15})`; ctx.beginPath(); ctx.arc(x, y, r + 8, 0, 6.28); ctx.fill(); }
    ctx.fillStyle = '#140f22'; ctx.beginPath(); ctx.arc(x, y, r + 2.5, 0, 6.28); ctx.fill();
    const p = img(q.por); if (p) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.clip(); const m = Math.min(p.naturalWidth, p.naturalHeight); ctx.drawImage(p, (p.naturalWidth - m) / 2, 0, m, m, x - r, y - r, r * 2, r * 2); ctx.restore(); }
    ctx.lineWidth = 2.2; ctx.strokeStyle = ready ? '#ffd36b' : col; ctx.beginPath(); ctx.arc(x, y, r + 1.2, 0, 6.28); ctx.stroke();
    if (q.side === 'h' && !ready) { ctx.strokeStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(x, y, r + 1.2, -1.57, -1.57 + 6.28 * clamp(u.en / 100, 0, 1)); ctx.stroke(); }
    const bw = sc * 1.25, bx = x - bw / 2, by = y - r - 8; ctx.fillStyle = '#000a'; ctx.fillRect(bx - 1, by - 1, bw + 2, 6); ctx.fillStyle = q.side === 'h' ? '#5fd38a' : '#e0503c'; ctx.fillRect(bx, by, bw * clamp(u.hp / u.max, 0, 1), 4);
    ctx.restore();
  }
  function drawMarks(q) {
    const u = q.u; if (u.hp <= 0 || q.side !== 'f') return; const c = center(q), sc = S0 * depth(q), foes = F.foes.filter(v => v.hp > 0), tg = foes.find(v => v.id === F.target) || foes[0];
    if (u.wind) { ctx.save(); const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, sc * 1.6); g.addColorStop(0, `rgba(255,60,40,${.45 + Math.sin(T * 14) * .2})`); g.addColorStop(1, 'rgba(255,60,40,0)'); ctx.fillStyle = g; ctx.scale(1, .45); ctx.beginPath(); ctx.arc(c.x, c.y / .45, sc * 1.6, 0, 6.28); ctx.fill(); ctx.restore(); }
    if (tg === u && foes.length > 1) { ctx.save(); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -T * 30; ctx.beginPath(); ctx.ellipse(c.x, c.y, sc * 1.25, sc * .5, 0, 0, 6.28); ctx.stroke(); ctx.restore(); }
  }
  function frame(ts) {
    if (!cv || !F || !cv.isConnected) { raf = 0; return; }
    raf = requestAnimationFrame(frame); const now = ts / 1000, dt = Math.min(.05, last ? now - last : .016); last = now; T += dt; size(); if (!W || !H) return; step(dt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (shakeT > 0) { shakeT -= dt; ctx.translate(rnd(-1, 1) * shakeP, rnd(-1, 1) * shakeP * .6); }
    // trampled ground so the armies stand on something
    if (!groundCv) { groundCv = document.createElement('canvas'); groundCv.width = Math.max(1, Math.round(W / 2)); groundCv.height = Math.max(1, Math.round(H / 2)); const gc = groundCv.getContext('2d'); gc.scale(.5, .5); gc.translate(W / 2, H * .66); gc.scale(1, H * .5 / (W * .62)); const g = gc.createRadialGradient(0, 0, 0, 0, 0, W * .62); g.addColorStop(0, 'rgba(30,20,12,.7)'); g.addColorStop(.7, 'rgba(30,20,12,.45)'); g.addColorStop(1, 'rgba(30,20,12,0)'); gc.fillStyle = g; gc.beginPath(); gc.arc(0, 0, W * .62, 0, 6.28); gc.fill(); }
    ctx.drawImage(groundCv, 0, 0, W, H);
    squads.forEach(drawMarks);
    parts.forEach(p => { if (!p.dust) return; ctx.globalAlpha = p.life / p.max * .35; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * (2 - p.life / p.max), 0, 6.28); ctx.fill(); }); ctx.globalAlpha = 1;
    const all = []; squads.forEach(q => q.sol.forEach(s => { if (s.x !== null) all.push([q, s]); })); all.sort((a, b) => a[1].y - b[1].y); all.forEach(([q, s]) => drawSoldier(q, s));
    squads.forEach(drawBanner);
    shots.forEach(s => { const p = clamp((T - s.t) / s.d, 0, 1); if (T < s.t) return; const x = s.x0 + (s.x1 - s.x0) * p, y = s.y0 + (s.y1 - s.y0) * p - Math.sin(Math.PI * p) * S0 * (s.magic ? .2 : .7), p2 = Math.max(0, p - .12), x2 = s.x0 + (s.x1 - s.x0) * p2, y2 = s.y0 + (s.y1 - s.y0) * p2 - Math.sin(Math.PI * p2) * S0 * (s.magic ? .2 : .7); ctx.strokeStyle = s.col; ctx.lineWidth = s.magic ? 4 : 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x, y); ctx.stroke(); if (s.magic) { ctx.globalAlpha = .35; ctx.lineWidth = 9; ctx.stroke(); ctx.globalAlpha = 1; } });
    rings.forEach(r => { if (T < r.t) return; const p = (T - r.t) / r.d; ctx.save(); ctx.translate(r.x, r.y); ctx.scale(1, .5); ctx.globalAlpha = (1 - p) * .9; ctx.strokeStyle = r.col; ctx.lineWidth = 5 * (1 - p) + 1; ctx.beginPath(); ctx.arc(0, 0, r.r * p, 0, 6.28); ctx.stroke(); if (r.fill) { ctx.globalAlpha = (1 - p) * .3; ctx.fillStyle = r.col; ctx.fill(); } ctx.restore(); });
    ctx.globalCompositeOperation = 'lighter'; parts.forEach(p => { if (p.dust) return; ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, 6.28); ctx.fill(); }); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    floats.forEach(f => { const p = T - f.t, big = f.cls === 'crit'; ctx.globalAlpha = clamp(2 - p * 2, 0, 1); ctx.font = `900 ${Math.round(S0 * (big ? .62 : f.cls === 'info' ? .34 : .46))}px Cinzel,serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000c'; const y = f.y - p * S0 * .9; ctx.strokeText(f.txt, clamp(f.x, 40, W - 40), y); ctx.fillStyle = f.cls === 'heal' ? '#6fe39a' : big ? '#ffd36b' : f.cls === 'info' ? '#d9ccff' : '#fff'; ctx.fillText(f.txt, clamp(f.x, 40, W - 40), y); }); ctx.globalAlpha = 1;
  }
  const api = { say, start, stop, end, attack, hit, skill, onTap: null, get active() { return !!cv; } };
  return api;
})();
