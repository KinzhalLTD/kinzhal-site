// Aeloria: Age of Crowns — kingdom strategy. Game state, simulation and interface.
'use strict';
const $ = s => document.querySelector(s);
const now = () => Date.now();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = n => { n = Math.floor(n || 0); const a = Math.abs(n); return a >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : a >= 1e4 ? (n / 1e3).toFixed(1) + 'K' : n.toLocaleString('en'); };
const fmtT = s => { s = Math.max(0, Math.ceil(s)); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : m ? `${m}m ${x}s` : `${x}s`; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const SAVE_KEY = GAME.saveKey;
let S; // the whole game state (saved to localStorage)

/* ======================= state ======================= */
function newState(name, color, realm) {
  const s = {
    v: 1, name, color, realm: realm || 'greenhold', created: now(), last: now(),
    res: { grain: 6000, timber: 6000, stone: 4000, ore: 1500, gold: 3000 }, gems: 300,
    b: { citadel: 1, barracks: 1, mews: 1, academy: 0, infirmary: 0, vault: 0, tower: 0, wall: 0, embassy: 0, market: 0 },
    fields: Array(24).fill(null),
    queue: [], builderUntil: 0,
    troops: { inf1: 60, rng1: 40, cav1: 20 }, wounded: {}, training: null,
    tech: {}, rq: null,
    heroes: Object.fromEntries(STARTERS.map(id => [id, { lvl: 1, xp: 0, stars: 1, shards: 0 }])),
    squad: [...STARTERS], seenStory: {}, stages: {}, vigor: 60, vigorT: now(),
    items: { sp5: 3, sp60: 1, shield: 1, crate: 1, scroll: 2 }, shieldUntil: now() + 3600e3,
    marches: [], reports: [], unread: 0, quest: 0, chestAt: now(),
    stats: { trained: 0, gathered: 0, camps: 0, campMax: 0, scouts: 0, rivals: 0, stageWins: 0 },
    house: { honor: 0, chat: [], requests: [] }, helps: [],
    raidAt: now() + 15 * 60e3, incoming: null, throne: false, seed: Math.floor(Math.random() * 1e9), mid: 1
  };
  s.fields[0] = { t: 'farm', l: 1 }; s.fields[1] = { t: 'lumber', l: 1 }; s.fields[2] = { t: 'quarry', l: 1 }; s.fields[5] = { t: 'mine', l: 1 };
  genWorld(s);
  return META.migrate(s);
}

const W = 56, H = 56, CX = 28, CY = 28;
const REGION_SEEDS = { frostmark: [28, 8], greenhold: [9, 24], jade: [47, 20], sunveldt: [11, 45], amber: [28, 47], coral: [46, 44], ash: [16, 12], sunspire: [CX, CY] };
const REGION_COL = {
  frostmark: [[236, 242, 248], [196, 210, 226]], greenhold: [[134, 178, 92], [96, 142, 66]], jade: [[120, 170, 120], [84, 140, 100]], sunveldt: [[214, 188, 104], [180, 150, 76]],
  amber: [[238, 206, 150], [214, 172, 112]], coral: [[240, 222, 172], [200, 176, 120]], ash: [[78, 72, 80], [52, 46, 54]], sunspire: [[226, 210, 160], [196, 176, 120]]
};
const REGION_RES = { frostmark: ['ore', 'stone', 'timber'], greenhold: ['grain', 'timber', 'grain'], jade: ['timber', 'grain', 'stone'], sunveldt: ['grain', 'ore', 'gold'], amber: ['gold', 'stone', 'grain'], coral: ['gold', 'grain', 'timber'], ash: ['ore', 'ore', 'stone'], sunspire: ['gold', 'stone'] };
const REGION_TREE = { frostmark: 'pine', greenhold: 'oak', jade: 'bamboo', sunveldt: 'acacia', amber: 'palm', coral: 'palm', ash: 'dead', sunspire: 'oak' };
const REGION_NAME = { ...Object.fromEntries(Object.entries(REALMS).map(([k, v]) => [k, v.name])), ash: 'The Ashen Scar', sunspire: 'The Sunspire' };

/* ---------- terrain: rebuilt from the seed each session (not saved) ---------- */
let TERR = null;
function valueNoise(seed) {
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const sm = t => t * t * (3 - 2 * t);
  const n = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf; };
  return (x, y) => n(x, y) * .5 + n(x * 2.1, y * 2.1) * .25 + n(x * 4.3, y * 4.3) * .15 + n(x * 8.7, y * 8.7) * .1;
}
function buildTerrain(seed) {
  const N = valueNoise(seed % 100000), N2 = valueNoise((seed + 77) % 100000);
  const T = { h: new Float32Array(W * H), region: new Array(W * H), water: new Uint8Array(W * H), mount: new Uint8Array(W * H), forest: new Uint8Array(W * H), river: new Uint8Array(W * H) };
  const seeds = Object.entries(REGION_SEEDS);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    let e = N(x * .085, y * .085);
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y) / 7; e -= (1 - Math.min(1, edge)) * .55;
    const jx = x + (N2(x * .2, y * .2) - .5) * 9, jy = y + (N2(y * .2 + 9, x * .2) - .5) * 9;
    let best = 'greenhold', bd = 1e9; for (const [k, [sx, sy]] of seeds) { const d = Math.hypot(jx - sx, jy - sy) * (k === 'sunspire' ? 1.9 : k === 'ash' ? 1.25 : 1); if (d < bd) { bd = d; best = k; } }
    if (best === 'coral') e -= .16; if (best === 'sunspire') e += .12;
    T.h[i] = e; T.region[i] = best;
  }
  for (let i = 0; i < W * H; i++) { T.water[i] = T.h[i] < .3 ? 1 : 0; T.mount[i] = !T.water[i] && T.h[i] > .7 && T.region[i] !== 'sunspire' ? 1 : 0; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!T.water[i] && !T.mount[i] && N2(x * .18 + 40, y * .18) > .56 && T.region[i] !== 'amber' && T.region[i] !== 'sunspire') T.forest[i] = 1; }
  // rivers: walk downhill from a few high points
  const r = rng(seed + 5); const tops = [];
  for (let i = 0; i < W * H; i++) if (T.mount[i] && r() < .05) tops.push(i);
  T.rivers = [];
  for (const s of tops.slice(0, 7)) { let i = s, guard = 0; const path = []; T.rivers.push(path); while (guard++ < 80) { path.push(i); if (T.water[i]) break; T.river[i] = 1; const x = i % W, y = (i / W) | 0; let nb = i, nh = T.h[i]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = yy * W + xx; if (T.h[j] < nh && !T.river[j]) { nh = T.h[j]; nb = j; } } if (nb === i) break; i = nb; } }
  for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) { const i = (CY + dy) * W + CX + dx; T.water[i] = 0; T.mount[i] = 0; T.forest[i] = 0; T.river[i] = 0; }
  T.canvas = paintTerrain(T, seed); return T;
}
const tIdx = (x, y) => y * W + x;
const isLand = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && !TERR.water[tIdx(x, y)] && !TERR.mount[tIdx(x, y)];
const TB = 40;
function paintTerrain(T, seed) {
  const small = document.createElement('canvas'); small.width = W; small.height = H; const sx = small.getContext('2d'); const img = sx.createImageData(W, H);
  const hAt = (x, y) => T.h[tIdx(clamp(x, 0, W - 1), clamp(y, 0, H - 1))];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = tIdx(x, y), e = T.h[i]; let c;
    if (T.water[i]) { const d = clamp((.3 - e) / .3, 0, 1); c = [Math.round(90 - 60 * d), Math.round(190 - 90 * d), Math.round(215 - 60 * d)]; if (T.region[i] === 'coral') c = [Math.round(60 - 30 * d), Math.round(205 - 80 * d), Math.round(214 - 50 * d)]; if (T.region[i] === 'frostmark') c = [Math.round(70 - 40 * d), Math.round(140 - 60 * d), Math.round(180 - 50 * d)]; }
    else {
      const [a, b] = REGION_COL[T.region[i]]; const k = clamp((e - .3) / .45, 0, 1); c = a.map((v, j) => v + (b[j] - v) * k);
      const shore = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const xx = x + dx, yy = y + dy; return xx >= 0 && yy >= 0 && xx < W && yy < H && T.water[tIdx(xx, yy)]; });
      if (shore && T.region[i] !== 'frostmark' && T.region[i] !== 'ash') c = c.map((v, j) => v + ([240, 224, 180][j] - v) * .55);
      if (T.forest[i]) c = c.map(v => v * .86);
      if (T.mount[i]) c = c.map((v, j) => v * .78 + [120, 110, 100][j] * .22);
      const light = (hAt(x - 1, y - 1) - hAt(x + 1, y + 1)) * 160; c = c.map(v => v + light);
    }
    img.data.set([...c.map(v => clamp(Math.round(v), 0, 255)), 255], i * 4);
  }
  sx.putImageData(img, 0, 0);
  const cv = document.createElement('canvas'); cv.width = W * TB; cv.height = H * TB; const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(small, -TB / 2, -TB / 2, (W + 1) * TB, (H + 1) * TB);
  const r = rng(seed + 11);
  // grain
  for (let i = 0; i < 9000; i++) { ctx.fillStyle = r() < .5 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.05)'; ctx.fillRect(r() * cv.width, r() * cv.height, 2 + r() * 3, 1 + r() * 2); }
  // sunspire plaza
  const g = ctx.createRadialGradient(CX * TB + TB / 2, CY * TB + TB / 2, 0, CX * TB + TB / 2, CY * TB + TB / 2, TB * 3.4); g.addColorStop(0, 'rgba(255,230,160,.9)'); g.addColorStop(.7, 'rgba(232,200,130,.6)'); g.addColorStop(1, 'rgba(232,200,130,0)'); ctx.fillStyle = g; ctx.fillRect((CX - 4) * TB, (CY - 4) * TB, TB * 9, TB * 9);
  // roads from each realm to the Sunspire
  ctx.lineCap = 'round';
  for (const [k, [sx2, sy2]] of Object.entries(REGION_SEEDS)) { if (k === 'sunspire' || k === 'ash') continue; const ax = sx2 * TB + TB / 2, ay = sy2 * TB + TB / 2, bx = CX * TB + TB / 2, by = CY * TB + TB / 2, mx = (ax + bx) / 2 + (r() - .5) * TB * 6, my = (ay + by) / 2 + (r() - .5) * TB * 6;
    ctx.strokeStyle = 'rgba(90,60,30,.35)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke();
    ctx.strokeStyle = 'rgba(226,200,150,.85)'; ctx.lineWidth = 5; ctx.setLineDash([14, 8]); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke(); ctx.setLineDash([]); }
  // rivers (smooth curves through tile centres)
  for (const path of T.rivers) { if (path.length < 3) continue; const pts = path.map(k => [(k % W) * TB + TB / 2 + (r() - .5) * 10, ((k / W) | 0) * TB + TB / 2 + (r() - .5) * 10]);
    for (const [col, lw] of [['#2f6f9f', 9], ['#5fb0e0', 5], ['#b8e4f8', 1.6]]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(...pts[0]); for (let q = 1; q < pts.length - 1; q++) { const mx = (pts[q][0] + pts[q + 1][0]) / 2, my = (pts[q][1] + pts[q + 1][1]) / 2; ctx.quadraticCurveTo(pts[q][0], pts[q][1], mx, my); } ctx.lineTo(...pts[pts.length - 1]); ctx.stroke(); } }
  // coast foam + waves
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = tIdx(x, y), px = x * TB, py = y * TB;
    if (T.water[i]) {
      const coast = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const xx = x + dx, yy = y + dy; return xx >= 0 && yy >= 0 && xx < W && yy < H && !T.water[tIdx(xx, yy)]; });
      if (coast) { const fg = ctx.createRadialGradient(px + TB / 2, py + TB / 2, 0, px + TB / 2, py + TB / 2, TB * .75); fg.addColorStop(0, 'rgba(255,255,255,.22)'); fg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = fg; ctx.fillRect(px - TB * .25, py - TB * .25, TB * 1.5, TB * 1.5); }
      else if (r() < .12) { ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px + 8, py + 20); ctx.quadraticCurveTo(px + 14, py + 14, px + 20, py + 20); ctx.quadraticCurveTo(px + 26, py + 26, px + 32, py + 20); ctx.stroke(); }
      continue;
    }
    const reg = T.region[i];
    if (T.mount[i]) {
      for (let k = 0; k < 2; k++) { const mx = px + TB * (.25 + k * .45) + r() * 6, my = py + TB * .85, mh = TB * (.7 + r() * .4), mw = TB * .42;
        ctx.fillStyle = reg === 'ash' ? '#3a3238' : '#8a8478'; ctx.beginPath(); ctx.moveTo(mx - mw, my); ctx.lineTo(mx, my - mh); ctx.lineTo(mx + mw, my); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.moveTo(mx, my - mh); ctx.lineTo(mx + mw, my); ctx.lineTo(mx + mw * .2, my); ctx.fill();
        ctx.fillStyle = reg === 'ash' ? '#ff7a2a' : '#f6f8fb'; ctx.beginPath(); ctx.moveTo(mx - mw * .32, my - mh * .68); ctx.lineTo(mx, my - mh); ctx.lineTo(mx + mw * .32, my - mh * .68); ctx.lineTo(mx + mw * .1, my - mh * .6); ctx.lineTo(mx - mw * .05, my - mh * .72); ctx.fill(); }
    } else if (T.forest[i]) {
      for (let k = 0; k < 3; k++) ART.mapPaint.tree(ctx, REGION_TREE[reg], px + 8 + r() * (TB - 16), py + 18 + r() * (TB - 18), TB * (.55 + r() * .25));
    } else if (r() < (reg === 'amber' ? .0 : .1)) ART.mapPaint.tree(ctx, REGION_TREE[reg], px + r() * TB, py + 12 + r() * (TB - 12), TB * .5);
    if (reg === 'amber' && r() < .35) { ctx.strokeStyle = 'rgba(160,110,60,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + 4, py + 28); ctx.quadraticCurveTo(px + 20, py + 16 + r() * 8, px + 36, py + 28); ctx.stroke(); }
    if (reg === 'ash' && r() < .3) { ctx.strokeStyle = 'rgba(255,122,42,.7)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px + r() * TB, py + r() * TB); ctx.lineTo(px + r() * TB, py + r() * TB); ctx.lineTo(px + r() * TB, py + r() * TB); ctx.stroke(); }
    if (reg === 'jade' && r() < .12) { ctx.fillStyle = 'rgba(255,190,210,.8)'; ctx.beginPath(); ctx.arc(px + r() * TB, py + r() * TB, 4, 0, 7); ctx.fill(); }
    if (reg === 'frostmark' && r() < .2) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(px + r() * TB, py + r() * TB, 7, 3, 0, 0, 7); ctx.fill(); }
  }
  // realm borders
  ctx.strokeStyle = 'rgba(40,20,60,.35)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
  for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) { const i = tIdx(x, y); if (T.water[i]) continue; if (T.region[i] !== T.region[i + 1] && !T.water[i + 1]) { ctx.beginPath(); ctx.moveTo((x + 1) * TB, y * TB); ctx.lineTo((x + 1) * TB, (y + 1) * TB); ctx.stroke(); } if (T.region[i] !== T.region[i + W] && !T.water[i + W]) { ctx.beginPath(); ctx.moveTo(x * TB, (y + 1) * TB); ctx.lineTo((x + 1) * TB, (y + 1) * TB); ctx.stroke(); } }
  ctx.setLineDash([]);
  // vignette edges
  const vg = ctx.createRadialGradient(cv.width / 2, cv.height / 2, cv.width * .3, cv.width / 2, cv.height / 2, cv.width * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,20,40,.45)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

/* ---------- objects ---------- */
function genWorld(s) {
  TERR = buildTerrain(s.seed);
  const r = rng(s.seed), occ = new Set(), objs = [];
  const take = (x, y) => occ.add(x + ',' + y), free = (x, y) => isLand(x, y) && !occ.has(x + ',' + y);
  for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) take(CX + dx, CY + dy);
  objs.push({ id: 1, kind: 'throne', x: CX, y: CY, troops: { inf3: 9000, rng3: 9000, cav3: 7000, sie3: 3000 }, wall: 18 });
  const near = (cx, cy, dmin, dmax) => { for (let i = 0; i < 600; i++) { const a = r() * 6.283, d = dmin + r() * (dmax - dmin), x = Math.round(cx + Math.cos(a) * d), y = Math.round(cy + Math.sin(a) * d); if (free(x, y)) return [x, y]; } for (let i = 0; i < 2000; i++) { const x = 1 + Math.floor(r() * (W - 2)), y = 1 + Math.floor(r() * (H - 2)); if (free(x, y)) return [x, y]; } return [cx, cy]; };
  const [hx, hy] = REGION_SEEDS[s.realm] || REGION_SEEDS.greenhold; const hp = near(hx, hy, 0, 4); s.home = { x: hp[0], y: hp[1] }; take(...hp);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) take(s.home.x + dx, s.home.y + dy);
  let id = 2;
  RIVALS.forEach(([name, realm], i) => {
    const [sx, sy] = REGION_SEEDS[realm]; const p = near(sx, sy, realm === s.realm ? 7 : 2, realm === s.realm ? 11 : 8); take(...p);
    const lvl = 3 + i, k = 1 + i * .5;
    objs.push({ id: id++, kind: 'city', ai: true, x: p[0], y: p[1], name, realm, color: REALMS[realm].color, lvl, wall: Math.floor(lvl / 2),
      troops: { inf1: Math.floor(220 * k), rng1: Math.floor(180 * k), cav1: Math.floor(150 * k), ...(i > 3 ? { inf2: Math.floor(90 * k), rng2: Math.floor(70 * k) } : {}), ...(i > 6 ? { cav3: Math.floor(40 * k) } : {}) },
      res: { grain: 8000 * k, timber: 8000 * k, stone: 5000 * k, ore: 2000 * k, gold: 3000 * k } });
  });
  const anywhere = () => { for (let i = 0; i < 3000; i++) { const x = 1 + Math.floor(r() * (W - 2)), y = 1 + Math.floor(r() * (H - 2)); if (free(x, y) && Math.hypot(x - s.home.x, y - s.home.y) > 3) return [x, y]; } return near(s.home.x, s.home.y, 3, 20); };
  for (let i = 0; i < 12; i++) { const p = near(s.home.x, s.home.y, 2.5, 7); take(...p); objs.push(i < 8 ? makeNode(id++, p, r) : makeCamp(id++, p, r)); }
  for (let i = 0; i < 150; i++) { const p = anywhere(); take(...p); objs.push(makeNode(id++, p, r)); }
  for (let i = 0; i < 24; i++) { const p = near(...REGION_SEEDS.ash, 1, 8); take(...p); objs.push(makeCamp(id++, p, r)); }
  for (let i = 0; i < 56; i++) { const p = anywhere(); take(...p); objs.push(makeCamp(id++, p, r)); }
  s.world = objs; s.nextId = id;
  s.fog = '0'.repeat(W * H); reveal(s, s.home.x, s.home.y, 7);
}
const regionAt = (x, y) => TERR ? TERR.region[tIdx(clamp(x, 0, W - 1), clamp(y, 0, H - 1))] : 'greenhold';
const ringLevel = (x, y, r) => clamp(Math.round((1 - Math.hypot(x - CX, y - CY) / 30) * 6 + r() * 1.6 + (regionAt(x, y) === 'ash' ? 2 : 0)), 1, 8);
function makeNode(id, [x, y], r = Math.random) { const kind = pick(REGION_RES[regionAt(x, y)] || RES); const lvl = clamp(ringLevel(x, y, r) - 1, 1, 6); return { id, kind: 'node', res: kind, x, y, lvl, amount: Math.floor((kind === 'gold' ? 6000 : 20000) * lvl * (1 + lvl * .2)) }; }
function makeCamp(id, [x, y], r = Math.random) {
  const lvl = clamp(ringLevel(x, y, r) + Math.floor(r() * 3) - 2, 1, 10);
  const n = Math.floor(30 * Math.pow(lvl, 1.6)), tier = lvl >= 8 ? 3 : lvl >= 5 ? 2 : 1;
  return { id, kind: 'camp', x, y, lvl, troops: { ['inf' + tier]: Math.floor(n * .4), ['rng' + tier]: Math.floor(n * .35), ['cav' + tier]: Math.floor(n * .25) } };
}
function freeSpot() { const occ = new Set(S.world.map(o => o.x + ',' + o.y)); occ.add(S.home.x + ',' + S.home.y); for (let i = 0; i < 800; i++) { const x = 1 + Math.floor(Math.random() * (W - 2)), y = 1 + Math.floor(Math.random() * (H - 2)); if (isLand(x, y) && !occ.has(x + ',' + y) && Math.hypot(x - CX, y - CY) > 3) return [x, y]; } return [S.home.x + 2, S.home.y]; }
// Lost treasure chests and wandering merchants on the world map (added to old saves too).
function nearSpot() { const occ = new Set(S.world.map(o => o.x + ',' + o.y)); occ.add(S.home.x + ',' + S.home.y); for (let i = 0; i < 500; i++) { const a = Math.random() * 6.283, d = 2.5 + Math.random() * (i < 300 ? 6 : 14), x = Math.round(S.home.x + Math.cos(a) * d), y = Math.round(S.home.y + Math.sin(a) * d); if (x > 0 && y > 0 && x < W - 1 && y < H - 1 && isLand(x, y) && !occ.has(x + ',' + y) && (i >= 300 || seen(x, y))) return [x, y]; } return freeSpot(); }
function ensureExtras() {
  let id = S.world.reduce((m, o) => Math.max(m, o.id), 0) + 1; const n = k => S.world.filter(o => o.kind === k).length;
  while (n('chest') < 6) { const [x, y] = nearSpot(); S.world.push({ id: id++, kind: 'chest', x, y, lvl: 1 }); }
  while (n('merchant') < 2) { const [x, y] = nearSpot(); S.world.push({ id: id++, kind: 'merchant', x, y, lvl: 1 }); }
}
const mapFx = [], MIMG = {};
const mimg = url => { if (!url) return null; let i = MIMG[url]; if (!i) { i = MIMG[url] = new Image(); i.src = url; } return i.complete && i.naturalWidth ? i : null; };
function reveal(s, cx, cy, rad) {
  const f = s.fog.split(''); for (let y = Math.max(0, cy - rad); y <= Math.min(H - 1, cy + rad); y++) for (let x = Math.max(0, cx - rad); x <= Math.min(W - 1, cx + rad); x++) if (Math.hypot(x - cx, y - cy) <= rad + .3) f[tIdx(x, y)] = '1';
  s.fog = f.join(''); fogDirty = true;
}
const seen = (x, y) => S.fog[tIdx(x, y)] === '1';
let fogCv = null, fogDirty = true;
function fogCanvas() {
  if (!fogCv) { fogCv = document.createElement('canvas'); fogCv.width = W + 2; fogCv.height = H + 2; }
  if (fogDirty) { const c = fogCv.getContext('2d'), img = c.createImageData(W + 2, H + 2); for (let y = 0; y < H + 2; y++) for (let x = 0; x < W + 2; x++) { const s2 = x > 0 && y > 0 && x <= W && y <= H && S.fog[tIdx(x - 1, y - 1)] === '1'; img.data.set([22, 16, 40, s2 ? 0 : 228], (y * (W + 2) + x) * 4); } c.putImageData(img, 0, 0); fogDirty = false; }
  return fogCv;
}

function save() { try { S.last = now(); localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage blocked: game still runs */ } }
function load() { try { const j = localStorage.getItem(SAVE_KEY); if (j) { const s = JSON.parse(j); if (s && s.v === 1) return META.migrate(s); } } catch (e) { } return null; }

/* ======================= economy ======================= */
const RB = k => (REALMS[S.realm] && REALMS[S.realm].bonus[k]) || 0;
const tech = id => (S.tech[id] || 0) * (TECHM[id]?.eff || 0);
const prodBoost = { grain: 'agri', timber: 'forest', stone: 'mason', ore: 'metal' };
const fieldRate = L => L ? 800 * L * Math.pow(1.13, L - 1) : 0; // per hour
function rates() {
  const r = { grain: 0, timber: 0, stone: 0, ore: 0, gold: 0 };
  S.fields.forEach(f => { if (f && f.l) r[BLD[f.t].field] += fieldRate(f.l); });
  for (const k of ['grain', 'timber', 'stone', 'ore']) r[k] = r[k] * (1 + tech(prodBoost[k])) + 120;
  r.gold = 200 + 160 * S.b.citadel + 260 * S.b.market;
  r.grain *= 1 + RB('grain'); r.gold *= 1 + RB('gold');
  const vb = 1 + vipLvl() * .03; for (const k of RES) r[k] *= vb;
  r.upkeep = troopCount(S.troops) * 0.25; // grain eaten per hour
  r.grain -= r.upkeep;
  return r;
}
const cap = () => 30000 + 25000 * S.b.citadel * S.b.citadel;
const vaultSafe = () => 3000 + 6000 * S.b.vault * S.b.vault / 2;
const troopCount = t => Object.values(t || {}).reduce((a, b) => a + b, 0);
const troopMight = t => Object.entries(t || {}).reduce((a, [k, n]) => a + n * TIER_MIGHT[tparse(k)[1] - 1], 0);
function heroStats(id) {
  const d = HERO[id], h = S.heroes[id]; const m = (1 + .13 * (h.lvl - 1)) * (1 + .2 * (h.stars - 1));
  const g = LIVE.gearMult(id);
  return { hp: Math.round(d.hp * m * g.hp), atk: Math.round(d.atk * m * g.atk), def: Math.round(d.def * m * g.def), spd: d.spd };
}
const heroMight = () => Object.entries(S.heroes).reduce((a, [id, h]) => a + h.lvl * 40 * h.stars, 0);
function might() {
  let m = 0; for (const [k, l] of Object.entries(S.b)) m += l * l * (k === 'citadel' ? 40 : 14);
  S.fields.forEach(f => { if (f) m += f.l * f.l * 6; });
  m += troopMight(S.troops) + S.marches.reduce((a, x) => a + troopMight(x.troops), 0);
  m += heroMight() + LIVE.gearMight() + Object.values(S.tech).reduce((a, l) => a + l * 60, 0);
  return Math.floor(m);
}
const vigorMax = () => 60 + S.b.mews * 2 + vipLvl() * 5;
const heroCap = () => 10 + S.b.mews * 3;
const squadBonus = () => S.squad.reduce((a, id) => a + (S.heroes[id] ? S.heroes[id].lvl * S.heroes[id].stars * .004 : 0), 0);
const maxMarches = () => 2 + (S.tech.slots || 0);
const marchCap = () => 300 + S.b.barracks * 250 + S.b.mews * 120;

function costOf(id, toL) {
  const base = BLD[id].cost, m = Math.pow(1.62, toL - 1) * (toL === 1 ? .6 : 1), out = {};
  for (const k in base) out[k] = Math.floor(base[k] * m);
  if (toL >= 8 && !out.ore) out.ore = Math.floor(80 * Math.pow(1.5, toL - 8));
  return out;
}
const timeOf = (id, toL) => BLD[id].base * Math.pow(1.58, toL - 1) / (1 + tech('build'));
const afford = c => Object.entries(c).every(([k, v]) => k === 'gems' ? S.gems >= v : (S.res[k] || 0) >= v);
const pay = c => { for (const [k, v] of Object.entries(c)) { if (k === 'gems') spendGems(v); else S.res[k] -= v; } };
function give(r, label) {
  const parts = [];
  for (const [k, v] of Object.entries(r || {})) {
    if (k === 'items') for (const [i, n] of Object.entries(v)) { S.items[i] = (S.items[i] || 0) + n; parts.push(`${n}× ${ITEMS[i].name}`); }
    else if (k === 'gems') { S.gems += v; parts.push(`${v} gems`); }
    else if (k === 'essence') { S.essence = (S.essence || 0) + v; parts.push(`${v} Ember Essence`); }
    else if (k === 'tokens') { S.tokens = (S.tokens || 0) + v; parts.push(`${v} Crown Sigil${v > 1 ? 's' : ''}`); }
    else if (k === 'shards') for (const [h, n] of Object.entries(v)) { addShards(h, n); parts.push(`${n} ${shortName(h)} shards`); }
    else if (RES.includes(k)) { S.res[k] += v; parts.push(`${fmt(v)} ${RNAME[k]}`); }
  }
  if (label && parts.length) toast(`${label}: ${parts.join(', ')}`);
  return parts.join(', ');
}
const costHTML = c => Object.entries(c).map(([k, v]) => `<span class="cost ${(k === 'gems' ? S.gems : S.res[k]) >= v ? '' : 'short'}">${ART.icon(k === 'gems' ? 'gem' : k, 15)}${fmt(v)}</span>`).join('');
function addShards(id, n) { const h = S.heroes[id]; if (h) h.shards += n; else S.heroes[id] = { lvl: 0, xp: 0, stars: 0, shards: n }; }

/* ======================= building ======================= */
const lvlOf = key => key[0] === 'f' && key !== 'farm' ? (S.fields[+key.slice(1)]?.l || 0) : S.b[key] || 0;
const idOf = key => key[0] === 'f' && key !== 'farm' ? S.fields[+key.slice(1)]?.t : key;
const openPlots = () => Math.min(FIELD_POS.length, 4 + S.b.citadel * 2);
const builders = () => 1 + (S.builderUntil > now() ? 1 : 0);
const inQueue = key => S.queue.find(q => q.key === key);
function upgradeCheck(key, typeForEmpty) {
  const id = typeForEmpty || idOf(key), L = lvlOf(key), to = L + 1, d = BLD[id];
  if (to > d.max) return { ok: false, why: 'Maximum level' };
  if (id !== 'citadel' && to > Math.max(1, S.b.citadel)) return { ok: false, why: `Needs Citadel level ${to}` };
  if (id === 'citadel' && to >= 4) { const need = ['wall', 'barracks'].find(b => (S.b[b] || 0) < to - 2); if (need) return { ok: false, why: `Needs ${BLD[need].name} level ${to - 2}` }; }
  if (d.unlock && S.b.citadel < d.unlock) return { ok: false, why: `Unlocks at Citadel ${d.unlock}` };
  if (d.field && +key.slice(1) >= openPlots()) return { ok: false, why: 'Raise the Citadel to unlock this plot' };
  if (inQueue(key)) return { ok: false, why: 'Already upgrading' };
  if (S.queue.length >= builders()) return { ok: false, why: 'All builders busy', busy: true };
  const c = costOf(id, to); if (!afford(c)) return { ok: false, why: 'Not enough resources', cost: c, short: true };
  return { ok: true, cost: c, time: timeOf(id, to) };
}
function startUpgrade(key, typeForEmpty) {
  const chk = upgradeCheck(key, typeForEmpty); if (!chk.ok) return toast(chk.why, 'bad');
  pay(chk.cost);
  if (typeForEmpty) S.fields[+key.slice(1)] = { t: typeForEmpty, l: 0 };
  const id = idOf(key), to = lvlOf(key) + 1, t = chk.time * 1000;
  S.queue.push({ key, id, to, start: now(), end: now() + t, total: t });
  requestHelps('b:' + key, t);
  sfx('build'); closeSheet(); render();
}
function finishBuild(q) {
  if (q.key[0] === 'f' && q.key !== 'farm') S.fields[+q.key.slice(1)].l = q.to; else S.b[q.key] = q.to;
  S.queue = S.queue.filter(x => x !== q);
  S.stats.builds = (S.stats.builds || 0) + 1; LIVE.on('build', 1); META.xp(q.id === 'citadel' ? 60 : 20); buildFx(q); if (tab === 'city' && window.CITY3D && CITY3D.ok && CITY3D.celebrate) CITY3D.celebrate(q.key);
  toast(`${BLD[q.id].name} reached level ${q.to}`, 'good'); sfx('done');
  if (q.id === 'citadel') { log(`Your Citadel rose to level ${q.to}.`); citadelBanner(q.to); }
}

/* ======================= training & healing ======================= */
const tierOpen = tier => tier === 1 || (tier === 2 && S.tech.tier2) || (tier === 3 && S.tech.tier3);
const trainCost = (type, tier, n) => { const c = {}; for (const [k, v] of Object.entries(TROOP[type].cost)) c[k] = Math.ceil(v * TIER_MULT[tier - 1] * .8 * n); return c; };
const trainTime = (tier, n) => TIER_TIME[tier - 1] * n / (1 + tech('drill') + S.b.barracks * .04 + RB('train'));
const batchMax = () => 50 + S.b.barracks * 60;
function startTraining(type, tier, n) {
  if (S.training) return toast('The Barracks are already training', 'bad');
  if (!tierOpen(tier)) return toast('Research this tier first', 'bad');
  n = clamp(Math.floor(n), 1, batchMax());
  const c = trainCost(type, tier, n); if (!afford(c)) return toast('Not enough resources', 'bad');
  pay(c); const t = trainTime(tier, n) * 1000;
  S.training = { k: tkey(type, tier), n, start: now(), end: now() + t, total: t };
  sfx('build'); closeSheet(); render();
}
const infCap = () => S.b.infirmary * 300;
function addWounded(w) {
  let room = infCap() - troopCount(S.wounded), saved = 0;
  for (const [k, n] of Object.entries(w)) { const s = Math.min(n, Math.max(0, room)); if (s > 0) { S.wounded[k] = (S.wounded[k] || 0) + s; room -= s; saved += s; } }
  return saved;
}
function healAll() {
  const c = {}; for (const [k, n] of Object.entries(S.wounded)) { const [t, tier] = tparse(k); for (const [r, v] of Object.entries(trainCost(t, tier, n))) c[r] = (c[r] || 0) + Math.ceil(v * .35); }
  if (!troopCount(S.wounded)) return toast('No wounded troops');
  if (!afford(c)) return toast('Not enough resources to heal', 'bad');
  pay(c); for (const [k, n] of Object.entries(S.wounded)) S.troops[k] = (S.troops[k] || 0) + n;
  toast(`Healed ${fmt(troopCount(S.wounded))} troops`, 'good'); S.wounded = {}; render(); openBuilding('infirmary');
}

/* ======================= research ======================= */
const techCost = (t, to) => ({ grain: Math.floor(600 * Math.pow(1.7, to - 1)), timber: Math.floor(500 * Math.pow(1.7, to - 1)), ore: Math.floor(150 * Math.pow(1.7, to - 1)), gold: Math.floor(500 * Math.pow(1.75, to - 1) * (t.max === 1 ? 4 : 1)) });
const techTime = (t, to) => 30 * Math.pow(1.75, to - 1) * (t.max === 1 ? 8 : 1) / (1 + S.b.academy * .03 + RB('research'));
const techNeed = (t, to) => Math.max(t.need || 1, to * 2 - 1);
function startResearch(id) {
  const t = TECHM[id], to = (S.tech[id] || 0) + 1;
  if (S.rq) return toast('Already researching', 'bad');
  if (!S.b.academy) return toast('Build the Royal Academy first', 'bad');
  if (to > t.max) return toast('Fully researched');
  if (S.b.academy < techNeed(t, to)) return toast(`Needs Royal Academy level ${techNeed(t, to)}`, 'bad');
  if (t.req && !S.tech[t.req]) return toast(`Research ${TECHM[t.req].name} first`, 'bad');
  const c = techCost(t, to); if (!afford(c)) return toast('Not enough resources', 'bad');
  pay(c); const ms = techTime(t, to) * 1000; S.rq = { id, to, start: now(), end: now() + ms, total: ms };
  requestHelps('r', ms); sfx('build'); render(); openTab('research');
}

/* ======================= House helps ======================= */
function requestHelps(tag, totalMs) {
  if (!S.b.embassy) return;
  const n = 2 + S.b.embassy;
  for (let i = 0; i < n; i++) S.helps.push({ tag, at: now() + 3000 + Math.random() * 40000, ms: Math.max(30000, totalMs * .03), from: pick(HOUSE_NAMES) });
}
function applyHelp(h) {
  let target = h.tag === 'r' ? S.rq : S.queue.find(q => 'b:' + q.key === h.tag);
  if (!target) return;
  target.end -= h.ms; S.house.helpsGot = (S.house.helpsGot || 0) + 1;
  if (Math.random() < .25) floatNote(`${h.from} helped you`);
}

/* ======================= speed-ups ======================= */
function timerRef(kind, key) { return kind === 'b' ? S.queue.find(q => q.key === key) : kind === 't' ? S.training : kind === 'r' ? S.rq : null; }
const freeLimit = () => (5 + vipLvl() * 2) * 60e3;
function speedUp(kind, key, how) {
  const t = timerRef(kind, key); if (!t) return;
  const left = t.end - now();
  if (how === 'free') { if (left > freeLimit() || kind !== 'b') return; t.end = now(); }
  else if (how === 'gems') { const g = gemCost(left); if (S.gems < g) return toast('Not enough gems', 'bad'); spendGems(g); t.end = now(); }
  else { if (!S.items[how]) return; S.items[how]--; t.end -= ITEMS[how].sec * 1000; }
  sfx('click'); tick(); render(); if ($('#sheet').open) openSpeed(kind, key);
}
const gemCost = ms => Math.max(1, Math.ceil(ms / 60000 * 1.2));

/* ======================= battles (troops) ======================= */
const tstat = (k, side) => { const [t, tier] = tparse(k), d = TROOP[t], m = TIER_MULT[tier - 1]; return { t, atk: d.atk * m * (1 + side.atkB), def: d.def * m * (1 + side.defB), hp: d.hp * m }; };
function battle(att, def) {
  // att/def: { troops, atkB, defB, wall }
  const A = { troops: { ...att.troops }, atkB: att.atkB || 0, defB: att.defB || 0 }, D = { troops: { ...def.troops }, atkB: def.atkB || 0, defB: (def.defB || 0) + (def.wall || 0) * .035 };
  const startA = { ...A.troops }, startD = { ...D.troops };
  const hpTotal = side => Object.entries(side.troops).reduce((a, [k, n]) => a + n * tstat(k, side).hp, 0);
  const dmg = (X, Y, wall) => {
    const tot = hpTotal(Y); if (tot <= 0) return {};
    const out = {};
    for (const [kx, nx] of Object.entries(X.troops)) {
      if (nx <= 0) continue; const sx = tstat(kx, X);
      for (const [ky, ny] of Object.entries(Y.troops)) {
        if (ny <= 0) continue; const sy = tstat(ky, Y); const share = ny * sy.hp / tot;
        let mult = COUNTER[sx.t] === sy.t ? 1.35 : COUNTER[sy.t] === sx.t ? .8 : 1;
        if (sx.t === 'sie') mult *= wall ? 1.6 : .9;
        out[ky] = (out[ky] || 0) + nx * sx.atk * share * mult * .32;
      }
    }
    return out;
  };
  const apply = (Y, d) => { for (const [k, v] of Object.entries(d)) { const s = tstat(k, Y); Y.troops[k] = Math.max(0, Y.troops[k] - v / (s.hp * (1 + s.def / 60))); } };
  let rounds = 0;
  for (; rounds < 8; rounds++) {
    if (hpTotal(A) <= 0 || hpTotal(D) <= 0) break;
    const da = dmg(A, D, def.wall > 0), dd = dmg(D, A, false); apply(D, da); apply(A, dd);
  }
  const fl = o => { for (const k in o) o[k] = Math.floor(o[k]); return o; };
  fl(A.troops); fl(D.troops);
  const powA = Object.entries(A.troops).reduce((a, [k, n]) => a + n * tstat(k, A).atk, 0), powD = Object.entries(D.troops).reduce((a, [k, n]) => a + n * tstat(k, D).atk, 0);
  const lossA = {}, lossD = {};
  for (const k in startA) lossA[k] = startA[k] - (A.troops[k] || 0);
  for (const k in startD) lossD[k] = startD[k] - (D.troops[k] || 0);
  return { win: powA > powD * 1.05 || troopCount(D.troops) === 0, leftA: A.troops, leftD: D.troops, lossA, lossD, rounds };
}
const playerAtk = () => ({ atkB: tech('blade') + squadBonus(), defB: tech('armor') + RB('def') });
function troopsHTML(t, cls = '') { const e = Object.entries(t || {}).filter(([, n]) => n > 0); return e.length ? `<div class="tlist ${cls}">${e.map(([k, n]) => { const [ty, ti] = tparse(k); return `<span class="tchip">${ART.troop(ty, ti, 26)}${fmt(n)}</span>`; }).join('')}</div>` : '<span class="muted">none</span>'; }

/* ======================= world marches ======================= */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const marchSpeed = () => 1 + tech('march') + RB('march');
const travelMs = (o, troops) => { const slow = troops.sie1 || troops.sie2 || troops.sie3 ? 1.3 : 1; return dist(S.home, o) * 2200 * slow / marchSpeed(); };
const loadOf = t => Object.entries(t).reduce((a, [k, n]) => { const [ty, ti] = tparse(k); return a + n * TROOP[ty].load * (1 + (ti - 1) * .5); }, 0) * (1 + tech('gather'));
function sendMarch(o, kind, troops) {
  if (S.marches.length >= maxMarches()) return toast('All march slots are busy', 'bad');
  if (kind !== 'scout' && kind !== 'explore' && kind !== 'collect' && troopCount(troops) <= 0) return toast('Choose some troops', 'bad');
  for (const [k, n] of Object.entries(troops)) { if ((S.troops[k] || 0) < n) return toast('Not enough troops at home', 'bad'); }
  for (const [k, n] of Object.entries(troops)) S.troops[k] -= n;
  if (kind === 'attack' && S.shieldUntil > now()) { S.shieldUntil = 0; toast('Attacking lifted your Aegis Ward'); }
  const ms = kind === 'scout' || kind === 'explore' || kind === 'collect' ? travelMs(o, {}) * .5 : travelMs(o, troops);
  S.marches.push({ id: S.mid++, kind, target: o.id, tx: o.x, ty: o.y, troops, start: now(), arrive: now() + ms, out: ms, state: 'out', loot: {} });
  sfx('horn'); closeSheet(); render();
}
function recall(id) { const m = S.marches.find(x => x.id === id); if (!m || m.state === 'back') return; const el = m.state === 'out' ? now() - m.start : m.out; if (m.state === 'gather') { const o = S.world.find(w => w.id === m.target); collectGather(m, o); } m.state = 'back'; m.back = now() + el; m.bstart = now(); render(); }
function collectGather(m, o) {
  const got = Math.min(m.load, o ? o.amount : 0, (now() - m.gstart) / 1000 * m.rate);
  if (got > 0) { m.loot[m.res] = (m.loot[m.res] || 0) + Math.floor(got); if (o) o.amount -= got; }
  if (o && o.amount <= 50) { const p = freeSpot(); Object.assign(o, makeNode(o.id, p)); }
}
function arrive(m) {
  const o = S.world.find(w => w.id === m.target);
  const goBack = () => { m.state = 'back'; m.bstart = now(); m.back = now() + m.out; };
  reveal(S, m.tx, m.ty, m.kind === 'explore' ? 5 : m.kind === 'scout' ? 3 : 2);
  if (m.kind === 'explore') { S.stats.scouts++; const found = S.world.filter(q => !q.dead && Math.hypot(q.x - m.tx, q.y - m.ty) <= 5); const n = k => found.filter(q => q.kind === k).length; report(`Lands charted · ${REGION_NAME[regionAt(m.tx, m.ty)]}`, `<p>Your scouts mapped the land around (${m.tx}, ${m.ty}).</p><p>Found: ${n('node')} resource sites, ${n('camp')} Ashen outposts${n('city') ? `, ${n('city')} rival citadel` : ''}${found.some(q => q.kind === 'throne') ? ' and <b>the Sunspire Throne</b>' : ''}.</p>`, 'scout'); META.xp(10); return goBack(); }
  if (!o || o.dead || o.x !== m.tx || o.y !== m.ty) { report('March returned', m.kind === 'collect' ? 'Someone reached the treasure before your riders.' : 'The target was gone before your troops arrived.'); return goBack(); }
  if (m.kind === 'collect') {
    const L = 1 + Math.floor(dist(S.home, o) / 8), rw = { gold: 300 * L, [pick(['grain', 'timber', 'stone', 'ore'])]: 2000 * L }; const r = Math.random(); if (r < .3) rw.gems = 5 * L; else if (r < .45) rw.items = { sp5: 1 }; else if (r < .5) rw.shards = { [pick(HEROES).id]: 2 };
    const txt = give(rw); o.dead = true; o.respawnAt = now() + 3 * 60e3; S.stats.chests = (S.stats.chests || 0) + 1; META.xp(8); LIVE.on('treasure', 1); mapFx.push({ x: o.x, y: o.y, t: now(), win: true }); report('Treasure recovered', `<p>Your riders opened a lost chest in ${REGION_NAME[regionAt(o.x, o.y)]}.</p><p>Found: ${txt}</p>`, 'win'); sfx('chest'); return goBack();
  }
  if (m.kind === 'scout') {
    S.stats.scouts++;
    const lvl = S.b.tower; const show = t => lvl >= 3 ? troopsHTML(t) : `about ${fmt(troopCount(t) * (0.8 + Math.random() * .4))} troops`;
    report(`Scout report · ${o.name || 'Ashen outpost L' + o.lvl}`, `<p>Army: ${show(o.troops)}</p>${o.res ? `<p>Resources: ${RES.map(k => ART.icon(k, 14) + fmt(o.res[k])).join(' ')}</p>` : ''}${o.wall ? `<p>Ramparts level ${o.wall}</p>` : ''}${lvl < 3 ? '<p class="muted">Raise the Watchtower to level 3 for exact numbers.</p>' : ''}`, 'scout');
    return goBack();
  }
  if (m.kind === 'gather') {
    if (o.kind !== 'node') return goBack();
    m.res = o.res; m.load = loadOf(m.troops); m.rate = (6 + o.lvl * 4) * (1 + tech('gather')) * (o.res === 'gold' ? .4 : 1);
    m.state = 'gather'; m.gstart = now(); m.gend = now() + Math.min(m.load, o.amount) / m.rate * 1000; return;
  }
  // attack
  if (o.kind === 'boss') { if (o.dead) report('World Boss', 'The Colossus had already fallen when your army arrived.'); else LIVE.hitBoss(m, o); return goBack(); }
  const p = playerAtk(); const isCity = o.kind === 'city' || o.kind === 'throne';
  const res = battle({ troops: m.troops, ...p }, { troops: o.troops, defB: o.kind === 'throne' ? .5 : o.kind === 'city' ? o.lvl * .02 : 0, wall: o.wall || 0 });
  m.troops = res.leftA;
  const deadMine = troopCount(res.lossA), healed = addWounded(Object.fromEntries(Object.entries(res.lossA).map(([k, n]) => [k, Math.floor(n * .6)])));
  o.troops = res.leftD;
  let body = `<p><b>${res.win ? 'Victory!' : 'Defeat.'}</b> ${res.rounds} rounds.</p><p>Your losses: ${troopsHTML(res.lossA)} <span class="muted">(${fmt(healed)} sent to the Infirmary)</span></p><p>Enemy losses: ${troopsHTML(res.lossD)}</p>`;
  if (res.win) {
    if (o.kind === 'camp') {
      META.xp(30); LIVE.on('camp', 1); S.essence += 4 * o.lvl; S.stats.camps++; S.stats.campMax = Math.max(S.stats.campMax, o.lvl);
      const L = o.lvl; m.loot = { gold: 300 * L * L, grain: 800 * L, timber: 600 * L, stone: 400 * L, ore: 150 * L };
      const extra = { items: { gift: 1 + (L >= 5 ? 1 : 0) } }; if (Math.random() < .35) extra.items.sp5 = 1 + Math.floor(L / 3); if (Math.random() < .25) extra.gems = 5 * L;
      if (L >= 4 && Math.random() < .3) extra.shards = { [pick(HEROES).id]: 1 + Math.floor(L / 4) };
      body += `<p>Spoils: ${give(extra)} and resources carried home.</p>`;
      o.respawnAt = now() + 4 * 60e3; o.dead = true;
    } else if (o.kind === 'city') {
      META.xp(60); LIVE.on('rival', 1); S.stats.rivals++; const take = {}; for (const k of RES) { take[k] = Math.floor(Math.min(o.res[k] * .4, loadOf(m.troops) / 5)); o.res[k] -= take[k]; }
      m.loot = take; body += `<p>You plundered ${RES.map(k => ART.icon(k, 14) + fmt(take[k])).join(' ')}</p>`; o.lvl = Math.max(1, o.lvl); o.angry = (o.angry || 0) + 1;
    } else if (o.kind === 'throne') {
      if (troopCount(o.troops) === 0) { S.throne = true; body += '<p><b>The Sunspire Throne is yours. All six realms bow to you, Sovereign.</b></p>'; burst(); burst(); log('You captured the Sunspire Throne!'); }
      else body += `<p>The Throne garrison still holds ${fmt(troopCount(o.troops))} troops. Keep attacking!</p>`;
    }
  }
  report(`${res.win ? 'Victory' : 'Defeat'} · ${o.name || (o.kind === 'camp' ? 'Ashen outpost L' + o.lvl : 'Sunspire Throne')}`, body, res.win ? 'win' : 'loss');
  mapFx.push({ x: o.x, y: o.y, t: now(), win: res.win });
  if (!fight && !document.querySelector('.story,.reveal,.cine')) { FX.banner(res.win ? 'VICTORY' : 'DEFEAT', `${esc(o.name || (o.kind === 'camp' ? 'Ashen outpost level ' + o.lvl : 'Sunspire Throne'))} · ${res.win ? 'the spoils are on their way home' : 'your army was driven back'}`, { ms: 1500, cls: res.win ? '' : 'boss', art: o.kind === 'camp' ? ART.enemy('raider', 110) : '' }); if (res.win) setTimeout(() => FX.confetti(), 300); }
  sfx(res.win ? 'win' : 'loss'); void deadMine; void isCity;
  if (troopCount(m.troops) === 0) { S.marches = S.marches.filter(x => x !== m); give(m.loot); return; }
  goBack();
}
function marchHome(m) {
  for (const [k, n] of Object.entries(m.troops)) S.troops[k] = (S.troops[k] || 0) + n;
  if (m.kind === 'gather') { META.xp(15); LIVE.on('gather', Object.values(m.loot).reduce((a, b) => a + b, 0)); }
  if (m.kind === 'gather') S.stats.gathered += Object.values(m.loot).reduce((a, b) => a + b, 0);
  const t = give(m.loot); if (t) toast(`March home: ${t}`, 'good');
  S.marches = S.marches.filter(x => x !== m);
}

/* ======================= rival raids ======================= */
function scheduleRaid() { S.raidAt = now() + (8 + Math.random() * 10) * 60e3; }
function startRaid() {
  const rivals = S.world.filter(o => o.kind === 'city'); const r = pick(rivals.sort((a, b) => (b.angry || 0) - (a.angry || 0)).slice(0, 4));
  const pm = Math.max(800, troopMight(S.troops)) * (0.6 + Math.random() * .6);
  const tier = S.b.citadel >= 10 ? 2 : 1, per = TIER_MIGHT[tier - 1];
  const n = pm / per, troops = { ['inf' + tier]: Math.floor(n * .4), ['rng' + tier]: Math.floor(n * .3), ['cav' + tier]: Math.floor(n * .3) };
  const warn = (60 + S.b.tower * 15) * 1000;
  S.incoming = { from: r.id, name: r.name, color: r.color, troops, arrive: now() + warn };
  toast(`⚠ ${r.name} is marching on your city!`, 'bad'); sfx('alarm');
}
function resolveRaid() {
  const inc = S.incoming; S.incoming = null; scheduleRaid();
  if (S.shieldUntil > now()) { report('Raid turned away', `${esc(inc.name)}'s army broke against your Aegis Ward. The city is safe.`, 'scout'); return; }
  const res = battle({ troops: inc.troops, atkB: .05 }, { troops: S.troops, ...playerAtk(), defB: tech('armor') + squadBonus() / 2, wall: S.b.wall });
  const healed = addWounded(res.lossD); S.troops = res.leftD; for (const k in S.troops) if (!S.troops[k]) delete S.troops[k];
  let body = `<p>${esc(inc.name)} attacked with ${fmt(troopCount(inc.troops))} troops.</p><p>Your losses: ${troopsHTML(res.lossD)} <span class="muted">(${fmt(healed)} saved by the Infirmary)</span></p><p>Their losses: ${troopsHTML(res.lossA)}</p>`;
  if (res.win) {
    const safe = vaultSafe(), lost = {};
    for (const k of RES) { lost[k] = Math.floor(Math.max(0, S.res[k] - safe) * .25); S.res[k] -= lost[k]; }
    body += `<p><b>Your city was plundered:</b> ${RES.map(k => ART.icon(k, 14) + fmt(lost[k])).join(' ')}</p><p class="muted">Upgrade the Vault and Ramparts, train more troops, or use a Aegis Ward.</p>`;
    S.shieldUntil = now() + 20 * 60e3; body += '<p>A 20-minute Aegis Ward now protects you.</p>';
  } else { S.stats.defWins = (S.stats.defWins || 0) + 1; META.xp(40); const g = 10 + Math.floor(Math.random() * 20); S.gems += g; body += `<p><b>Your defenders held!</b> +${g} gems</p>`; const o = S.world.find(w => w.id === inc.from); if (o) for (const k in o.troops) o.troops[k] = Math.floor(o.troops[k] * .9); }
  report(`${res.win ? 'City raided' : 'Defence won'} · ${inc.name}`, body, res.win ? 'loss' : 'win'); sfx(res.win ? 'loss' : 'win');
}

/* ======================= reports & log ======================= */
function report(title, body, kind = 'info') { toast(`✉ ${title}`, kind === 'win' ? 'good' : kind === 'loss' ? 'bad' : ''); S.reports.unshift({ t: now(), title, body, kind }); S.reports = S.reports.slice(0, 40); S.unread++; }
function log(t) { S.house.chat.push({ from: 'Herald', t, at: now() }); S.house.chat = S.house.chat.slice(-30); }

/* ======================= tick ======================= */
let lastTick = now();
function tick() {
  const t = now(); let dt = (t - lastTick) / 1000; lastTick = t; if (dt < 0) dt = 0;
  produce(dt);
  for (const q of [...S.queue]) if (q.end <= t) finishBuild(q);
  if (S.training && S.training.end <= t) { const { k, n } = S.training; S.troops[k] = (S.troops[k] || 0) + n; S.stats.trained += n; S.training = null; META.xp(10); LIVE.on('train', n); const [ty, ti] = tparse(k); toast(`${fmt(n)} ${TROOP[ty].name} ${'I'.repeat(ti)} ready`, 'good'); sfx('done'); }
  if (S.rq && S.rq.end <= t) { S.tech[S.rq.id] = S.rq.to; toast(`${TECHM[S.rq.id].name} level ${S.rq.to} complete`, 'good'); sfx('done'); S.rq = null; META.xp(25); LIVE.on('research', 1); }
  for (const h of [...S.helps]) if (h.at <= t) { applyHelp(h); S.helps.splice(S.helps.indexOf(h), 1); }
  for (const m of [...S.marches]) {
    if (m.state === 'out' && t >= m.arrive) arrive(m);
    else if (m.state === 'gather' && t >= m.gend) { collectGather(m, S.world.find(w => w.id === m.target)); m.state = 'back'; m.bstart = t; m.back = t + m.out; }
    else if (m.state === 'back' && t >= m.back) marchHome(m);
  }
  for (const o of S.world) {
    if (o.dead && o.kind === 'chest' && o.respawnAt <= t) { const [x, y] = nearSpot(); o.x = x; o.y = y; delete o.dead; delete o.respawnAt; }
    if (o.dead && o.kind === 'camp' && o.respawnAt <= t) { const p = freeSpot(); Object.assign(o, makeCamp(o.id, p)); delete o.dead; delete o.respawnAt; }
    if (o.kind === 'city' && Math.random() < dt / 60) { for (const k in o.troops) o.troops[k] += Math.ceil(o.troops[k] * .01); for (const k of RES) o.res[k] = Math.min(o.res[k] + 400 * o.lvl, 60000 * o.lvl); }
  }
  // vigor regen 1 per 40s, max 60 (+mews)
  const vmax = vigorMax();
  if (S.vigor < vmax) { const gain = Math.floor((t - S.vigorT) / 40000); if (gain > 0) { S.vigor = Math.min(vmax, S.vigor + gain); S.vigorT += gain * 40000; } } else S.vigorT = t;
  // raids
  if (!S.incoming && S.b.citadel >= 4 && t >= S.raidAt) { if (S.shieldUntil > t) scheduleRaid(); else startRaid(); }
  if (S.incoming && t >= S.incoming.arrive) resolveRaid();
  LIVE.tick(dt);
  // a treasure caravan passes the gates now and then: a small surprise for whoever is watching the city
  if (!caravan && t >= (S.caravanAt || (S.caravanAt = t + 45000))) { if (S.caravanDay !== today()) { S.caravanDay = today(); S.caravanN = 0; } if (S.caravanN < 30 && paintedCity()) { caravan = { until: t + 36000 }; if (tab === 'city') { toast('✨ A treasure caravan is passing your gates: tap it!', 'good'); sfx('coin'); } } else S.caravanAt = t + 600000; }
  if (caravan && t > caravan.until) { caravan = null; S.caravanAt = t + (80 + Math.random() * 80) * 1000; }
  // house chatter
  if (Math.random() < dt / 45) { S.house.chat.push({ from: pick(HOUSE_NAMES), t: pick(HOUSE_CHAT), at: t }); S.house.chat = S.house.chat.slice(-30); }
  if (Math.random() < dt / 70 && S.house.requests.length < 6) S.house.requests.push({ from: pick(HOUSE_NAMES), what: pick(['Citadel', 'Barracks', 'Ramparts', 'Smelting', 'Date Farm', 'Infirmary']) });
}
function produce(dt) {
  if (dt <= 0) return; const r = rates(), c = cap();
  for (const k of RES) {
    const before = S.res[k]; const add = r[k] / 3600 * dt;
    if (add >= 0) S.res[k] = before >= c ? before : Math.min(c, before + add); else S.res[k] = Math.max(0, before + add);
  }
}

/* ======================= audio ======================= */
const sfx = k => FX.sound(k);

/* ======================= UI helpers ======================= */
function toast(msg, kind = '') { const box = $('#toasts'); [...box.children].filter(c => c.innerHTML === msg).forEach(c => c.remove()); while (box.children.length >= 3) box.firstChild.remove(); const el = document.createElement('div'); el.className = 'toast ' + kind; el.innerHTML = msg; $('#toasts').appendChild(el); setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3100); }
function floatNote(msg) { const el = document.createElement('div'); el.className = 'float-note'; el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 1800); }
function burst() { FX.confetti(); }
function burstOld() { const c = document.createElement('div'); c.className = 'burst'; for (let i = 0; i < 28; i++) { const s = document.createElement('i'); s.style.setProperty('--a', (i * 360 / 28) + 'deg'); s.style.setProperty('--d', (90 + Math.random() * 120) + 'px'); s.style.background = pick(['#ffd36b', '#3fd7c8', '#ff7a59', '#f2e6cf']); c.appendChild(s); } document.body.appendChild(c); setTimeout(() => c.remove(), 1200); }
const sheet = () => $('#sheet');
function openSheet(title, html, wide) { const d = sheet(); d.classList.toggle('wide', !!wide); $('#sheetTitle').innerHTML = title; $('#sheetBody').innerHTML = html; if (!d.open) d.showModal(); }
function closeSheet() { if (sheet().open) sheet().close(); }
const bar = (p, cls = '') => `<div class="bar ${cls}"><i style="width:${clamp(p * 100, 0, 100)}%"></i></div>`;

/* ======================= HUD ======================= */
function renderHud() {
  const r = rates(), c = cap();
  const mt = might(); $('#hudName').textContent = S.name; $('#hudMight').innerHTML = `${ART.icon('might', 14)} ${fmt(mt)} <span class="vipchip" data-act="sub" data-s="vip">VIP ${vipLvl()}</span>`;
  if (renderHud.m && mt > renderHud.m) { const c = FX.centerOf($('#hudMight')); FX.text(c.x + 30, c.y + 10, `+${fmt(mt - renderHud.m)} Might`, 'might'); $('#hudMight').classList.remove('gain'); void $('#hudMight').offsetWidth; $('#hudMight').classList.add('gain'); }
  renderHud.m = mt;
  const hudHtml = RES.map(k => `<div class="res ${S.res[k] >= c ? 'full' : ''}" data-res="${k}" title="${RNAME[k]}: ${fmt(r[k])}/h, storage ${fmt(c)}">${ART.icon(k, 18)}<b>${fmt(S.res[k]).replace(/^(\d{3})\.\d+([KMB])$/, '$1$2')}</b><small class="${r[k] < 0 ? 'neg' : ''}">${r[k] >= 0 ? '+' : ''}${fmt(r[k])}/h</small></div>`).join('') +
    `<div class="res gem" data-res="gems" data-act="sub" data-s="gems">${ART.icon('gem', 18)}<b>${fmt(S.gems)}</b><span class="plus">+</span></div>`;
  { const hr = $('#hudRes'); if (hr._h !== hudHtml) { hr.innerHTML = hudHtml; hr._h = hudHtml; } }
  { const nv = $('#navVigor'); if (nv) { nv.textContent = '⚡' + S.vigor; nv.parentNode.classList.toggle('go', S.vigor >= 6); } const md = $('#moreDot'); if (md) md.hidden = !(S.house.requests.length || (S.arena && S.arena.tickets > 0 && S.b.citadel >= 3)); }
  $('#mailDot').hidden = !S.unread; $('#mailDot').textContent = S.unread;
  { const hd = $('#heroDot'); if (hd && !(renderHud.hdT > now())) { renderHud.hdT = now() + 3000; hd.hidden = !(collectionReady() || HEROES.some(h => { const st = S.heroes[h.id]; return st && STAR_SHARDS[st.stars + 1] && st.shards >= STAR_SHARDS[st.stars + 1]; })); } }
  const qd = S.quest < QUESTS.length && QUESTS[S.quest].c(S); const passReady = Math.min(30, Math.floor(S.pass.xp / 120)) > Object.keys(S.pass.claimed).length; $('#questDot').hidden = !(qd || now() >= S.chestAt || passReady || LIVE.deedReady());
  $('#storeDot').hidden = !(S.free !== today() || (vipLvl() && S.vipDay !== today()) || S.tokens > 0 || (S.market || {}).spin !== today());
  const shield = S.shieldUntil > now();
  $('#status').innerHTML = (S.incoming ? `<button class="alert" data-act="incoming">⚠ ${esc(S.incoming.name)} attacks in ${fmtT((S.incoming.arrive - now()) / 1000)}</button>` : '') +
    (shield ? `<span class="veil">${ART.icon('shield', 14)} Ward ${fmtT((S.shieldUntil - now()) / 1000)}</span>` : '') +
    `<button class="evchip" data-act="tab" data-tab="quests" data-res="event" style="--ec:${LIVE.curEvent().color}">✦ ${LIVE.curEvent().name}: ${fmt(S.event.pts)}</button>`;
}
function renderQueues() {
  const t = now(), rows = [];
  for (let i = 0; i < builders(); i++) {
    const q = S.queue[i];
    if (q) { const left = (q.end - t) / 1000; rows.push(`<div class="q" data-act="speed" data-kind="b" data-key="${q.key}">${ART.icon('help', 16)}<div><b>${BLD[q.id].name} → ${q.to}</b>${bar(1 - (q.end - t) / q.total)}<small>${fmtT(left)}</small></div>${left * 1000 <= freeLimit() ? '<span class="free">FREE</span>' : ''}</div>`); }
    else rows.push(`<div class="q idle" data-act="tab" data-tab="city">${ART.icon('help', 16)}<div><b>Builder idle</b><small>Tap a building</small></div></div>`);
  }
  if (S.training) { const tr = S.training, [ty, ti] = tparse(tr.k); rows.push(`<div class="q" data-act="speed" data-kind="t">${ART.troop(ty, ti, 18)}<div><b>${fmt(tr.n)} ${TROOP[ty].name}</b>${bar(1 - (tr.end - t) / tr.total)}<small>${fmtT((tr.end - t) / 1000)}</small></div></div>`); }
  else rows.push(`<div class="q idle" data-act="bld" data-key="barracks">${ART.troop('inf', 1, 18)}<div><b>Barracks idle</b><small>Train troops</small></div></div>`);
  if (S.rq) rows.push(`<div class="q" data-act="speed" data-kind="r">${ART.icon('scroll', 16)}<div><b>${TECHM[S.rq.id].name}</b>${bar(1 - (S.rq.end - t) / S.rq.total)}<small>${fmtT((S.rq.end - t) / 1000)}</small></div></div>`);
  else if (S.b.academy) rows.push(`<div class="q idle" data-act="tab" data-tab="research">${ART.icon('scroll', 16)}<div><b>Research idle</b><small>Study a science</small></div></div>`);
  for (const m of S.marches) {
    const end = m.state === 'out' ? m.arrive : m.state === 'gather' ? m.gend : m.back, st = m.state === 'out' ? m.start : m.state === 'gather' ? m.gstart : m.bstart;
    rows.push(`<div class="q march" data-act="march" data-id="${m.id}">${ART.icon(m.kind === 'gather' ? (m.res || 'crate') : m.kind === 'collect' ? 'chest' : m.kind === 'scout' || m.kind === 'explore' ? 'scroll' : 'might', 16)}<div><b>${{ gather: 'Gathering', attack: 'Attack', scout: 'Scout', explore: 'Exploring', collect: 'Treasure run' }[m.kind]} · ${m.state === 'back' ? 'returning' : m.state === 'gather' ? 'gathering' : 'marching'}</b>${bar((t - st) / Math.max(1, end - st), 'teal')}<small>${fmtT((end - t) / 1000)}</small></div></div>`);
  }
  $('#queues').innerHTML = rows.filter(r => tab === 'city' || !r.includes('q idle')).join('');
}

/* ======================= City view ======================= */
const DAY_MS = 10 * 60e3;
const dayP = () => (((now() - (S.created || 0)) % DAY_MS) + DAY_MS) % DAY_MS / DAY_MS;
function nightAmt() { const p = dayP(); return p < .45 ? 0 : p < .55 ? (p - .45) / .1 : p < .9 ? 1 : 1 - (p - .9) / .1; }
function warmAmt() { const p = dayP(); const d = x => Math.max(0, 1 - Math.abs(p - x) / .07); return Math.max(d(.5), d(.95), p < .05 ? 1 - p / .07 : 0); }
function cityAmbient() {
  const camel = (c, i) => i % 2 ? `<g><ellipse cx="0" cy="5" rx="16" ry="3" fill="#0002"/><rect x="-14" y="-12" width="24" height="12" rx="2" fill="#8a5a3a"/><path d="M-15-12c2-10 24-10 26 0z" fill="${c}"/><circle cx="-8" cy="2" r="4.5" fill="#5a3418"/><circle cx="6" cy="2" r="4.5" fill="#5a3418"/><circle cx="-8" cy="2" r="1.4" fill="#e8c35a"/><circle cx="6" cy="2" r="1.4" fill="#e8c35a"/></g>` : `<g><ellipse cx="0" cy="5" rx="14" ry="3" fill="#0002"/><path d="M-12-2c0-6 4-8 12-8h6l5-7 3 2-2 7c2 3 1 6-2 7H-10z" fill="#8a5a3a"/><path d="M-9-1v8M-4-1v8M5-1v8M9-1v8" stroke="#5a3418" stroke-width="2"/><path d="M-12-4c-4 2-5 6-4 9" stroke="#3a2414" stroke-width="2" fill="none"/><circle cx="1" cy="-15" r="3" fill="#e0b08a"/><path d="M-3-13h8v6h-8z" fill="${c}"/></g>`;
  const bird = `<g class="flap"><path d="M-12 0c4-6 8-6 12 0 4-6 8-6 12 0-4-2-8-2-12 2-4-4-8-4-12-2z" fill="#1b1430" opacity=".75"/></g>`;
  const guard = `<g><circle r="4" fill="#5a3418"/><circle cy="-5" r="2.6" fill="#c98f5e"/><path d="M4-9v12" stroke="#cfd8e2" stroke-width="1.4"/></g>`;
  const wall = 'M500 112L850 290L500 468L150 290Z';
  return `<path id="caravanPath" d="M-80 668C160 640 330 680 500 652S820 610 1080 650" fill="none"/>
    <path id="wallPath" d="${wall}" fill="none"/>
    <g class="amb-caravan">${[0, 1, 2, 3].map(i => `<g>${camel(['#b3433a', '#2f5a8a', '#e8a33d', '#7a4fb3'][i], i)}<animateMotion dur="70s" repeatCount="indefinite" rotate="auto" begin="-${i * 1.3}s"><mpath href="#caravanPath"/></animateMotion></g>`).join('')}</g>
    ${[0, 1, 2].map(i => `<g>${guard}<animateMotion dur="48s" repeatCount="indefinite" begin="-${i * 16}s"><mpath href="#wallPath"/></animateMotion></g>`).join('')}
    <g class="water"><ellipse cx="880" cy="120" rx="58" ry="20" fill="none" stroke="#c8fff6" stroke-width="2" opacity=".5"><animate attributeName="rx" values="40;70;40" dur="5s" repeatCount="indefinite"/><animate attributeName="opacity" values=".6;0;.6" dur="5s" repeatCount="indefinite"/></ellipse><ellipse cx="860" cy="125" rx="20" ry="6" fill="none" stroke="#c8fff6" stroke-width="1.5" opacity=".5"><animate attributeName="rx" values="10;34;10" dur="3.6s" repeatCount="indefinite"/></ellipse></g>`;
}
function citySky() {
  const bird = `<g class="flap"><path d="M-12 0c4-6 8-6 12 0 4-6 8-6 12 0-4-2-8-2-12 2-4-4-8-4-12-2z" fill="#1b1430" opacity=".7"/></g>`;
  return `${[[640, 220, 150, 26], [360, 300, 110, 34]].map(([x, y, r, d], i) => `<g transform="translate(${x} ${y})"><g><animateTransform attributeName="transform" type="rotate" from="${i ? 360 : 0}" to="${i ? 0 : 360}" dur="${d}s" repeatCount="indefinite"/><g transform="translate(${r} 0) rotate(${i ? -90 : 90})">${bird}</g></g></g>`).join('')}
    <g opacity=".09" fill="#1b1430">${[0, 1].map(i => `<ellipse cx="0" cy="${180 + i * 300}" rx="${220 - i * 60}" ry="${70 - i * 20}"><animate attributeName="cx" from="-300" to="1300" dur="${90 + i * 40}s" begin="-${i * 50}s" repeatCount="indefinite"/></ellipse>`).join('')}</g>`;
}
function cityLanterns() {
  const pts = [...Object.values(INNER), ...FIELD_POS.slice(0, 6)].map(([x, y]) => [x + 26, y - 6]);
  return pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17" fill="url(#lglow)"/><circle cx="${x}" cy="${y}" r="3" fill="#ffe7a8"/>`).join('');
}
// The painted city is the default; the 3D city is an opt-in setting.
const use3D = () => !!(window.CITY3D && CITY3D.ok !== undefined && S.settings.gfx3d === true && !window.CITY3D_FAIL);
const paintedCity = () => !!ART.asset('city', S.realm);
window.CITY3D_PICK = d => { if (d.act === 'bld') openBuilding(d.key); else if (d.act === 'field') openField(+d.i); };
window.addEventListener('city3dready', () => { if (S && tab === 'city') { $('#cityView').innerHTML = ''; render(); } });
window.addEventListener('city3dlost', () => { window.CITY3D_FAIL = true; $('#city3d').hidden = true; $('#cityView').hidden = false; if (S && tab === 'city') renderCity(); });
function cityUiRender() { const n = META.readyCount(); $('#cityUi').innerHTML = META.guide() + (n >= 2 ? `<button class="collect" data-act="harvestall">${ART.icon('crate', 18)} Collect all <b>${n}</b></button>` : ''); }
// Size the painted city in pixels from the real viewport: it always fills the view with no bands, and pans sideways on phones.
function fitCity(recentre) {
  const cv = $('#cityView'), sv = $('#citySvg'); if (!cv || !sv || !paintedCity()) return; const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
  const z = CITY_Z[fitCity.zi || 0], sw = Math.ceil(Math.max(w, h * 1840 / 1288) * z), sh = Math.ceil(sw * 1288 / 1840);
  if (!$('#cityZoom')) { const b = document.createElement('button'); b.id = 'cityZoom'; b.dataset.act = 'czoom'; b.title = 'Zoom the city'; cv.after(b); }
  $('#cityZoom').textContent = (fitCity.zi || 0) === 1 ? '－' : '＋';
  sv.style.setProperty('width', sw + 'px', 'important'); sv.style.setProperty('height', sh + 'px', 'important'); { const fx = $('#cityFx'); if (fx) { fx.style.width = sw + 'px'; fx.style.height = sh + 'px'; } }
  if (recentre || fitCity.w !== w || fitCity.h !== h) requestAnimationFrame(() => { cv.scrollLeft = sw * .5 - w / 2; cv.scrollTop = Math.max(0, sh * .47 - h / 2); });
  fitCity.w = w; fitCity.h = h;
}
const CITY_Z = [1.64, 2.5, 1];
addEventListener('resize', () => fitCity());
// Drifting cloud shadows and birds so the painted city does not sit perfectly still.
function cityLife() {
  const cl = [[8, 26, 0, 70], [36, 30, -30, 95], [70, 22, -55, 80]].map(([y, w, dl, d]) => `<i class="cshadow" style="top:${y}%;width:${w}%;animation-duration:${d}s;animation-delay:${dl}s"></i>`).join('');
  const bird = (y, d, dl, s) => `<div class="cbirdrow" style="top:${y}%;animation-duration:${d}s;animation-delay:${dl}s"><svg viewBox="-10 -8 20 10" width="${Math.round(18 * s)}" height="${Math.round(9 * s)}"><path class="cwing" d="M-9-3Q-4-7 0 0Q4-7 9-3" fill="none" stroke="#1b1430" stroke-width="2.2" stroke-linecap="round"/></svg></div>`;
  return `<div id="cityFx" aria-hidden="true">${cl}${bird(34, 38, 0, 1)}${bird(35.5, 38, -.6, .8)}${bird(36, 38, -1.1, .7)}${bird(62, 52, -20, .9)}${bird(61, 52, -20.7, .7)}</div>`;
}
function renderCity() {
  if (use3D()) { const h = $('#city3d'); if (CITY3D.init(h)) { $('#cityView').hidden = true; h.hidden = tab !== 'city'; CITY3D.setActive(tab === 'city'); CITY3D.sync(); cityUiRender(); return; } window.CITY3D_FAIL = true; $('#city3d').hidden = true; $('#cityView').hidden = tab !== 'city'; }
  const cv = $('#cityView');
  if (!$('#cityDyn')) {
    cv.classList.toggle('painted', paintedCity()); cv.innerHTML = `<svg viewBox="${paintedCity() ? '-420 -300 1840 1288' : '0 0 1000 700'}" preserveAspectRatio="xMidYMid meet" id="citySvg">${ART.cityBg()}${paintedCity() ? cityScenery() : ''}<defs><radialGradient id="lglow"><stop offset="0" stop-color="#ffcf6b" stop-opacity=".75"/><stop offset="1" stop-color="#ffcf6b" stop-opacity="0"/></radialGradient></defs><g id="cityAmb">${cityAmbient()}</g><g id="cityDyn"></g><g id="citySky" pointer-events="none">${citySky()}</g><rect id="warmA" x="-420" y="-300" width="1840" height="1288" fill="#ff8a3d" opacity="0" pointer-events="none" style="mix-blend-mode:multiply"/><rect id="nightA" x="-420" y="-300" width="1840" height="1288" fill="#1a2350" opacity="0" pointer-events="none" style="mix-blend-mode:multiply"/><g id="lanterns" pointer-events="none" opacity="0">${cityLanterns()}</g><g id="cityTop"></g></svg>${paintedCity() ? cityLife() : ''}`;
    cv.style.background = paintedCity() ? '#0b0818' : ART.P.ground[2]; fitCity(true);
  }
  const items = [];
  for (const [id, [x, y]] of Object.entries(INNER)) {
    const L = S.b[id] || 0, d = BLD[id], locked = d.unlock > S.b.citadel, q = inQueue(id), can = !locked && !q && upgradeCheck(id).ok;
    items.push({ y, html: `<g class="bld ${locked ? 'locked' : ''} ${L ? '' : 'unbuilt'}" data-act="bld" data-key="${id}" transform="translate(${x} ${y})">${L ? ART.building(id, L) : ART.building('empty')}${q ? scaffold(id === 'citadel' ? 70 : 46) : ''}${can && L ? '<g class="upar" transform="translate(40 -40)"><circle r="10" fill="#6fe39a" stroke="#0b3a22" stroke-width="2"/><path d="M0-5l5 6h-3v4h-4v-4h-3z" fill="#0b3a22"/></g>' : ''}</g>`, lab: (() => { const nm = `${locked ? '🔒 ' : ''}${d.name.replace('Royal Academy', 'Academy').replace('Alliance ', '').replace('Grand ', '')}${L ? ' ' + L : ''}`, w = Math.max(64, nm.length * (paintedCity() ? 8.6 : 7) + 20); return `<g class="bld-lab ${locked ? 'locked' : ''}" data-act="bld" data-key="${id}" transform="translate(${x} ${y + 24})"><rect x="${-w / 2}" y="-11" width="${w}" height="22" rx="11" fill="#140f22e6" stroke="#e8a33d88"/><text y="5" text-anchor="middle">${nm}</text></g>`; })() });
  }
  const open = openPlots();
  FIELD_POS.forEach(([x, y], i) => {
    const f = S.fields[i], key = 'f' + i, q = inQueue(key);
    if (i >= open) { items.push({ y, html: `<g class="bld locked" transform="translate(${x} ${y})" data-act="lockedfield">${ART.building('empty')}<text y="28" text-anchor="middle" class="lbl">🔒</text></g>` }); return; }
    items.push({ y, html: `<g class="bld" data-act="field" data-i="${i}" transform="translate(${x} ${y})">${f ? ART.building(f.t, f.l) : ART.building('empty')}${q ? scaffold(30) : ''}${f && f.l ? `<g transform="translate(0 20)"><circle r="10" fill="#140f22d9" stroke="#e8a33d88"/><text y="4" text-anchor="middle">${f.l}</text></g>` : ''}</g>` });
  });
  if (paintedCity()) for (const [id, [x, y, nm]] of Object.entries(LANDMARKS)) {
    const u = ART.asset('landmark', id); if (!u) continue; const dot = id === 'arena' ? S.arena && S.arena.tickets > 0 : id === 'bazaar' ? (S.market || {}).spin !== today() || S.free !== today() : id === 'altar' ? S.tokens > 0 : false, w = nm.length * 8.6 + 22;
    items.push({ y, html: `<g class="bld lmk" data-act="landmark" data-id="${id}" transform="translate(${x} ${y})"><ellipse cx="0" cy="6" rx="96" ry="26" fill="#0005"/><image href="${u}" x="-110" y="-172" width="220" height="200"/></g>`, lab: `<g class="bld-lab lmk" data-act="landmark" data-id="${id}" transform="translate(${x} ${y + 40})"><rect x="${-w / 2}" y="-12" width="${w}" height="24" rx="12" fill="#2a1508f0" stroke="#ffd36b"/><text y="5" text-anchor="middle" style="fill:#ffe08a">${nm}</text>${dot ? `<circle cx="${w / 2 - 2}" cy="-11" r="8" fill="#e5484d" stroke="#fff" stroke-width="1.5"/><text x="${w / 2 - 2}" y="-6.500" text-anchor="middle" style="font-size:11px;font-weight:900">!</text>` : ''}</g>` });
  }
  if (paintedCity()) S.squad.filter(id => S.heroes[id] && S.heroes[id].stars && ART.asset('champions', id)).slice(0, 3).forEach((id, i) => {
    const [x, y] = [[446, 400], [554, 400], [500, 420]][i];
    items.push({ y, html: `<g class="cityhero" data-act="herotalk" data-id="${id}" transform="translate(${x} ${y})"><ellipse rx="24" ry="7" fill="#0007"/><g class="ch-bob" style="animation-delay:${-i * .7}s"><image href="${ART.asset('champions', id)}" x="-44" y="-114" width="88" height="118"/></g></g>` });
  });
  items.sort((a, b) => a.y - b.y);
  const banner = paintedCity() ? '' : `<g transform="translate(500 92)"><path d="M0 0v-40" stroke="#5a3418" stroke-width="3"/><path class="wave" d="M0-40h40l-8 9 8 9H0z" fill="${S.color}"/></g>`;
  const troopsN = troopCount(S.troops);
  const camp = troopsN ? `<g transform="translate(560 540)" class="bld" data-act="tab" data-tab="army">${Array.from({ length: Math.min(6, Math.ceil(troopsN / 150)) }, (_, i) => `<g transform="translate(${(i % 3) * 30} ${Math.floor(i / 3) * 22})"><path d="M-10 10l10-18 10 18z" fill="#f2ede4"/><path d="M0-8v-6" stroke="#5a3418"/><path class="wave" d="M0-14l6 2-6 2z" fill="${S.color}"/></g>`).join('')}<text x="30" y="56" text-anchor="middle" class="lbl">${fmt(troopsN)} troops</text></g>` : '';
  // replace the SVG only when it changed, so a tap is never lost to the 3-second refresh
  const dyn = banner + items.map(i => i.html).join('') + camp + items.map(i => i.lab || '').join('').replace(/(<g class="bld-lab[^>]*>)/g, '$1<rect x="-70" y="-22" width="140" height="44" fill="#0000"/>'), top = META.bubbles() + caravanSvg();
  if ($('#cityDyn')._h !== dyn) { $('#cityDyn').innerHTML = dyn; $('#cityDyn')._h = dyn; }
  if ($('#cityTop')._h !== top) { $('#cityTop').innerHTML = top; $('#cityTop')._h = top; }
  cityLight(); fitCity();
  const n = META.readyCount();
  $('#cityUi').innerHTML = META.guide() + (n >= 2 ? `<button class="collect" data-act="harvestall">${ART.icon('crate', 18)} Collect all <b>${n}</b></button>` : '');
}
function scaffold(h) { return `<g class="scaf"><path d="M-${h * .6} 4V-${h}M${h * .6} 4V-${h}M-${h * .6}-${h * .5}H${h * .6}M-${h * .6}-${h}H${h * .6}M-${h * .6} 4L${h * .6}-${h * .5}" stroke="#7e4a22" stroke-width="3" fill="none"/><g class="hammer" transform="translate(0 -${h + 14})"><circle r="13" fill="#140f22"/><path d="M-6-2l8-8 4 4-8 8zM0-4l6 6" stroke="#ffd36b" stroke-width="2.5"/></g><circle class="puff" cx="-10" cy="0" r="8" fill="#f2e6cf"/><circle class="puff p2" cx="12" cy="-4" r="6" fill="#f2e6cf"/></g>`; }
function cityLight() {
  const n = nightAmt(), w = warmAmt();
  const na = $('#nightA'), wa = $('#warmA'), la = $('#lanterns'); if (!na) return;
  na.setAttribute('opacity', (n * .42).toFixed(3)); wa.setAttribute('opacity', (w * .22).toFixed(3)); la.setAttribute('opacity', n.toFixed(3));
  $('#cityView').classList.toggle('night', n > .5);
}
function buildFx(q) {
  if (tab !== 'city') return;
  const el = q.key[0] === 'f' ? document.querySelector(`#city3d [data-act=field][data-i="${q.key.slice(1)}"], [data-act=field][data-i="${q.key.slice(1)}"]`) : document.querySelector(`#city3d [data-key="${q.key}"], #cityDyn [data-key="${q.key}"]`);
  if (!el) return; const c = FX.centerOf(el);
  FX.burst(c.x, c.y, { n: 40, shape: 'star', size: 5, speed: 7, ring: '#ffd36b', life: 1.1 }); FX.text(c.x, c.y - 40, `Level ${q.to}!`, 'lvl');
}
function citadelBanner(to) {
  const unl = Object.values(BLD).filter(b => b.unlock === to).map(b => b.name);
  const plots = Math.min(16, 4 + to * 2) - Math.min(16, 4 + (to - 1) * 2);
  const sub = [unl.length ? 'Unlocked: ' + unl.join(', ') : '', plots ? `+${plots} field plots` : '', `Storage ${fmt(cap())}`].filter(Boolean).join(' · ');
  FX.banner(`Citadel Level ${to}`, sub, { art: ART.asset('buildings', 'citadel') ? `<img src="${ART.asset('buildings', 'citadel')}" width="190" height="190" alt="">` : `<svg viewBox="-80 -140 160 160" width="150" height="150">${ART.building('citadel', to)}</svg>` });
}
function openField(i) {
  const f = S.fields[i], key = 'f' + i;
  if (!f) {
    openSheet('Empty field', `<p class="muted">Choose what to build on this plot.</p><div class="pick">${FIELD_TYPES.map(t => { const c = costOf(t, 1); return `<button class="card-btn" data-act="buildfield" data-i="${i}" data-t="${t}">${ART.asset('buildings', t) ? `<img class="bpaint" src="${ART.asset('buildings', t)}" width="84" height="84" alt="">` : `<svg viewBox="-60 -50 120 80" width="96" height="64">${ART.building(t, 1)}</svg>`}<b>${BLD[t].name}</b><small>${ART.icon(BLD[t].field, 14)} +${fmt(fieldRate(1))}/h</small><span class="costs">${costHTML(c)}</span></button>`; }).join('')}</div>`);
    return;
  }
  openBuilding(key);
}
function openBuilding(key) {
  const id = idOf(key), d = BLD[id], L = lvlOf(key), chk = upgradeCheck(key), q = inQueue(key);
  let extra = '';
  if (d.field) extra = `<p>${ART.icon(d.field, 16)} Produces <b>${fmt(fieldRate(L))}/h</b>${L < d.max ? ` → ${fmt(fieldRate(L + 1))}/h at level ${L + 1}` : ''}</p>`;
  if (id === 'citadel') extra = `<p>Storage per resource: <b>${fmt(cap())}</b> · Tax: ${ART.icon('gold', 14)} ${fmt(rates().gold)}/h · Field plots: ${openPlots()}/16</p><p class="muted">Next level unlocks: ${Object.entries(BLD).filter(([, b]) => b.unlock === L + 1).map(([, b]) => b.name).join(', ') || 'higher building levels'}.</p>`;
  if (id === 'barracks' && L) extra = trainHTML();
  if (id === 'infirmary' && L) extra = `<p>Capacity: <b>${fmt(troopCount(S.wounded))} / ${fmt(infCap())}</b> wounded.</p>${troopsHTML(S.wounded)}<button class="btn" data-act="heal">Heal all</button>`;
  if (id === 'vault' && L) extra = `<p>Protects <b>${fmt(vaultSafe())}</b> of each resource from raiders.</p>`;
  if (id === 'wall' && L) extra = `<p>Defence bonus for city guards: <b>+${(L * 3.5).toFixed(1)}%</b>. Enemy ballistae deal extra damage to ramparts.</p>`;
  if (id === 'tower' && L) extra = `<p>Raid warning: <b>${fmtT(60 + L * 15)}</b> ahead. ${L >= 3 ? 'Scouts report exact troop numbers.' : 'Level 3: exact scout reports.'}</p>`;
  if (id === 'embassy' && L) extra = `<p>Each building or research gets <b>${2 + L}</b> helps from your Alliance, each cutting 3% (at least 30s).</p>`;
  if (id === 'market' && L) extra = marketHTML();
  if (id === 'mews' && L) extra = `<p>Hero level cap: <b>${heroCap()}</b> · March size: <b>${fmt(marchCap())}</b> troops.</p><button class="btn" data-act="tab" data-tab="heroes">Open Heroes</button>`;
  if (id === 'academy' && L) extra = `<button class="btn" data-act="tab" data-tab="research">Open research</button>`;
  const head = `<div class="bhead">${ART.asset('buildings', id) ? `<img class="bpaint" src="${ART.asset('buildings', id)}" width="120" height="120" alt="">` : `<svg viewBox="-80 -130 160 160" width="120" height="120">${L ? ART.building(id, L) : ART.building('empty')}</svg>`}<div><p>${d.desc}</p><p class="lvl">Level <b>${L}</b> / ${d.max}</p></div></div>`;
  let up = '';
  if (q) up = `<div class="upbox"><p>Upgrading to level ${q.to} · ${fmtT((q.end - now()) / 1000)}</p><button class="btn" data-act="speed" data-kind="b" data-key="${key}">Speed up</button></div>`;
  else if (L < d.max) {
    const c = costOf(id, L + 1), t = timeOf(id, L + 1);
    up = `<div class="upbox"><h4>${L ? 'Upgrade to level ' + (L + 1) : 'Build'}</h4><div class="costs">${costHTML(c)}<span class="cost">${ART.icon('clock', 15)}${fmtT(t)}</span></div>${chk.ok ? `<button class="btn gold" data-act="upgrade" data-key="${key}">${L ? 'Upgrade' : 'Build'}</button><button class="btn" data-act="upnow" data-key="${key}">${ART.icon('gem', 14)} ${gemCost(t * 1000) + gemFill(c)} Instant</button>` : `<p class="why">${chk.why}</p>${chk.short ? `<button class="btn" data-act="upnow" data-key="${key}">${ART.icon('gem', 14)} ${gemCost(t * 1000) + gemFill(c)} Instant</button>` : ''}`}</div>`;
  }
  openSheet(`${d.name}`, head + up + extra, id === 'barracks');
}
const gemFill = c => Math.ceil(Object.entries(c).reduce((a, [k, v]) => a + Math.max(0, v - (S.res[k] || 0)), 0) / 120);
function upgradeNow(key) {
  const id = idOf(key), to = lvlOf(key) + 1, c = costOf(id, to), g = gemCost(timeOf(id, to) * 1000) + gemFill(c);
  const chk = upgradeCheck(key); if (!chk.ok && !chk.short && !chk.busy) return toast(chk.why, 'bad');
  if (S.gems < g) return toast('Not enough gems', 'bad');
  spendGems(g); for (const k in c) S.res[k] = Math.max(0, S.res[k] - c[k]);
  finishBuild({ key, id, to }); closeSheet(); render();
}

function trainHTML() {
  const sel = trainSel;
  const rows = TYPES.map(t => `<button class="ttab ${sel.t === t ? 'on' : ''}" data-act="tsel" data-t="${t}">${ART.troop(t, sel.tier, 42)}<small>${TROOP[t].name}</small></button>`).join('');
  const tiers = TIERS.map(n => `<button class="chip ${sel.tier === n ? 'on' : ''} ${tierOpen(n) ? '' : 'locked'}" data-act="tier" data-n="${n}">Tier ${'I'.repeat(n)}${tierOpen(n) ? '' : ' 🔒'}</button>`).join('');
  const d = TROOP[sel.t], m = TIER_MULT[sel.tier - 1], c = trainCost(sel.t, sel.tier, sel.n);
  return `<div class="train"><div class="ttabs">${rows}</div><div class="chips">${tiers}</div>
    <p><b>${d.name} ${'I'.repeat(sel.tier)}</b> · ${d.role}</p>
    <div class="stats"><span>ATK ${Math.round(d.atk * m)}</span><span>DEF ${Math.round(d.def * m)}</span><span>HP ${Math.round(d.hp * m)}</span><span>Load ${d.load}</span><span>Might ${TIER_MIGHT[sel.tier - 1]}</span><span>At home ${fmt(S.troops[tkey(sel.t, sel.tier)] || 0)}</span></div>
    <label class="slider">Amount <input type="range" min="1" max="${batchMax()}" value="${sel.n}" data-act="tn"><b id="tnv">${sel.n}</b></label>
    <div class="costs">${costHTML(c)}<span class="cost">${ART.icon('clock', 15)}${fmtT(trainTime(sel.tier, sel.n))}</span></div>
    ${S.training ? '<p class="why">Barracks busy — speed up the current batch first.</p>' : `<button class="btn gold" data-act="train">Train ${sel.n}</button>`}</div>`;
}
let trainSel = { t: 'inf', tier: 1, n: 50 };
function marketHTML() {
  return `<h4>Trade resources</h4><p class="muted">Swap 1,000 of one resource for 800 of another (better rate at higher levels: ${Math.min(95, 80 + S.b.market)}%).</p><div class="trade">${['grain', 'timber', 'stone', 'ore'].map(a => `<div>${ART.icon(a, 18)} → ${['grain', 'timber', 'stone', 'ore'].filter(b => b !== a).map(b => `<button class="mini" data-act="trade" data-a="${a}" data-b="${b}">${ART.icon(b, 16)}</button>`).join('')}</div>`).join('')}</div>`;
}
function trade(a, b) { if (S.res[a] < 1000) return toast('Need 1,000 to trade', 'bad'); S.res[a] -= 1000; S.res[b] += 10 * Math.min(95, 80 + S.b.market); sfx('click'); render(); openBuilding('market'); }

/* ======================= Speed-up sheet ======================= */
function openSpeed(kind, key) {
  const t = timerRef(kind, key); if (!t) return closeSheet();
  const left = t.end - now(), title = kind === 'b' ? `${BLD[t.id].name} → ${t.to}` : kind === 't' ? 'Troop training' : TECHM[t.id].name;
  const its = ['sp5', 'sp60', 'sp480'].filter(i => S.items[i]).map(i => `<button class="btn" data-act="usesp" data-kind="${kind}" data-key="${key || ''}" data-i="${i}">${ART.icon('clock', 14)} ${ITEMS[i].name} ×${S.items[i]}</button>`).join('');
  openSheet('Speed up', `<p><b>${title}</b></p>${bar(1 - left / t.total)}<p>Time left: <b>${fmtT(left / 1000)}</b></p>
    ${kind === 'b' && left <= freeLimit() ? `<button class="btn gold" data-act="usesp" data-kind="b" data-key="${key}" data-i="free">Finish free</button>` : ''}
    <div class="btns">${its || '<span class="muted">No hourglasses in your bag.</span>'}</div>
    <button class="btn gold" data-act="usesp" data-kind="${kind}" data-key="${key || ''}" data-i="gems">${ART.icon('gem', 14)} ${gemCost(left)} Finish now</button>${LIVE.adButton('speed', 'Watch an ad: −15 min', `data-kind="${kind}" data-key="${key || ''}"`)}`);
}

/* ======================= Army tab ======================= */
function renderArmy() {
  const all = {}; for (const m of S.marches) for (const [k, n] of Object.entries(m.troops)) all[k] = (all[k] || 0) + n;
  return `<h2>Army</h2><div class="cards">${TYPES.map(t => `<div class="card"><h4>${TROOP[t].name}</h4><p class="muted">${TROOP[t].role}</p>${TIERS.map(n => `<div class="trow">${ART.troop(t, n, 40)}<div><b>${fmt(S.troops[tkey(t, n)] || 0)}</b> at home${all[tkey(t, n)] ? ` · ${fmt(all[tkey(t, n)])} marching` : ''}${S.wounded[tkey(t, n)] ? ` · <span class="neg">${fmt(S.wounded[tkey(t, n)])} wounded</span>` : ''}</div></div>`).join('')}</div>`).join('')}</div>
  <div class="card"><h4>Counters</h4><p>Spearmen beat Cavalry · Cavalry beat Archers · Archers beat Spearmen. Trebuchets shine against Ramparts.</p><p>Total might from troops: ${ART.icon('might', 14)} ${fmt(troopMight(S.troops))} · Grain upkeep ${fmt(rates().upkeep)}/h</p>
  <button class="btn gold" data-act="bld" data-key="barracks">Train troops</button> ${S.b.infirmary ? '<button class="btn" data-act="bld" data-key="infirmary">Infirmary</button>' : ''}</div>`;
}

/* ======================= Heroes tab ======================= */
/* ---------- Hero collections: complete a set for a one-time reward ---------- */
function collections() {
  const sets = Object.keys(REALMS).map(r => ({ k: r, name: `Heroes of ${REALMS[r].name}`, color: REALMS[r].color, ids: HEROES.filter(h => h.realm === r).map(h => h.id), r: { gems: 120, essence: 20 } }));
  sets.push({ k: 'legends', name: 'Legends of the World', color: '#ffd36b', ids: HEROES.filter(h => h.legend).map(h => h.id), r: { gems: 400, essence: 60, tokens: 3 } });
  return sets.map(s => ({ ...s, got: s.ids.filter(id => S.heroes[id] && S.heroes[id].stars > 0).length }));
}
function collectionsHTML() {
  const cl = S.colClaimed || {};
  return `<div class="cols"><h3>Collections <small class="muted">complete a set for a one-time reward</small></h3><div class="colrow">${collections().sort((a, b) => ((b.got >= b.ids.length && !cl[b.k]) - (a.got >= a.ids.length && !cl[a.k])) || (b.got / b.ids.length - a.got / a.ids.length)).map(s => { const done = s.got >= s.ids.length, claimed = cl[s.k];
    return `<div class="col ${done ? 'done' : ''} ${claimed ? 'claimed' : ''}" style="--rc:${s.color}"><b>${s.name}</b><div class="colfaces">${s.ids.map(id => `<span class="${S.heroes[id] && S.heroes[id].stars ? 'own' : ''}">${ART.portrait(HERO[id], 34)}</span>`).join('')}</div><div class="colbar"><i style="width:${s.got / s.ids.length * 100}%"></i><em>${s.got}/${s.ids.length}</em></div>${done && !claimed ? `<button class="btn gold sm" data-act="colclaim" data-k="${s.k}">Claim</button>` : claimed ? '<small class="good">✓ Complete</small>' : `<small class="muted">${META.rewardHTML(s.r)}</small>`}</div>`; }).join('')}</div></div>`;
}
function claimCollection(k) {
  const s = collections().find(x => x.k === k); S.colClaimed ??= {}; if (!s || S.colClaimed[k] || s.got < s.ids.length) return;
  S.colClaimed[k] = 1; META.grant(s.r, s.name + ' complete'); FX.banner('Collection complete', esc(s.name), { art: `<div class="colfaces big">${s.ids.map(id => `<span class="own">${ART.portrait(HERO[id], 56)}</span>`).join('')}</div>` }); render();
}
const collectionReady = () => collections().some(s => s.got >= s.ids.length && !(S.colClaimed || {})[s.k]);
function renderHeroes() {
  const owned = HEROES.filter(h => S.heroes[h.id] && S.heroes[h.id].stars > 0), rest = HEROES.filter(h => !owned.includes(h));
  const card = h => { const st = S.heroes[h.id] || { lvl: 0, stars: 0, shards: 0 }; const own = st.stars > 0, fig = ART.asset('champions', h.id), need = STAR_SHARDS[st.stars + 1], ready = need && st.shards >= need;
    if (!fig) return `<button class="hero r-${h.rarity} ${own ? '' : 'dim'} ${S.squad.includes(h.id) ? 'insq' : ''}" data-act="hero" data-id="${h.id}"><span class="rtag">${h.rarity}</span>${ART.portrait(h, 92)}<b>${h.name}</b><small>${h.role}${own ? ` · Lv ${st.lvl}` : ''}</small><span class="stars">${own ? '★'.repeat(st.stars) : `${st.shards}/${STAR_SHARDS[1]} shards`}</span></button>`;
    return `<button class="hfig r-${h.rarity} ${own ? '' : 'locked'} ${S.squad.includes(h.id) ? 'insq' : ''} ${ready ? 'can' : ''}" style="--rc:${(REALMS[h.realm] || {}).color || '#7a4fb3'}" data-act="hero" data-id="${h.id}"><span class="rtag">${h.rarity}</span>${S.squad.includes(h.id) ? '<span class="sqtag">Squad</span>' : ''}${ready ? '<span class="uptag">⬆</span>' : ''}<img src="${fig}" alt="" loading="lazy"><span class="hf-info"><b>${shortName(h.id)}</b><small>${h.role}${own ? ` · Lv ${st.lvl}` : ''}</small>${own ? `<span class="stars">${'★'.repeat(st.stars)}<i>${'★'.repeat(5 - st.stars)}</i></span>` : `<span class="shardbar"><i style="width:${Math.min(100, st.shards / STAR_SHARDS[1] * 100)}%"></i><em>${st.shards}/${STAR_SHARDS[1]}</em></span>`}</span></button>`; };
  return `<h2>Heroes</h2><div class="squad"><span>Squad</span>${[0, 1, 2].map(i => S.squad[i] ? `<span class="slot">${ART.portrait(HERO[S.squad[i]], 44)}</span>` : '<span class="slot empty">+</span>').join('')}<span class="muted">Squad leads your armies: +${(squadBonus() * 100).toFixed(1)}% troop ATK${(() => { const l = LIVE.synergy(S.squad.filter(id => S.heroes[id] && S.heroes[id].stars)).label; return l ? ` · <b class="good">${l}</b>` : ''; })()}</span></div>
  ${collectionsHTML()}<div class="heroes figs">${owned.map(card).join('')}${rest.map(card).join('')}</div>
  <div class="card stagecard"><div><h3>${ART.icon('vigor', 18)} Story Campaign</h3><p class="muted">Follow the story across the six realms of Aeloria. Each stage costs 6 Vigor. Vigor: <b>${S.vigor}</b> / ${vigorMax()}</p></div><button class="btn gold" data-act="stages">Open campaign</button></div>
  <div class="card stagecard arenacard"><div><h3>⚔ Arena of Crowns</h3><p class="muted">Duel other lords' hero squads. Climb from Bronze to Champion, earn Glory and daily gems. Tickets today: <b>${S.arena.day === today() ? S.arena.tickets : 5}</b></p></div><button class="btn gold" data-act="arena">Enter Arena</button></div>`;
}
function openHero(id) {
  const h = HERO[id], st = S.heroes[id] || { lvl: 0, stars: 0, shards: 0, xp: 0 }, own = st.stars > 0;
  const s = own ? heroStats(id) : { hp: h.hp, atk: h.atk, def: h.def, spd: h.spd };
  const need = STAR_SHARDS[st.stars + 1], xpNeed = xpFor(st.lvl);
  const tutor = Math.floor(150 * st.lvl * st.lvl);
  openSheet(`${h.name}`, `${ART.asset('champions', h.id) ? `<div class="hshow r-${h.rarity}" style="--rc:${REALMS[h.realm].color}"><img src="${ART.asset('champions', h.id)}" alt="${esc(h.name)}"></div>` : ''}<div class="hhead r-${h.rarity}"><div class="hport">${ART.portrait(h, 150)}</div><div><span class="rtag">${h.rarity}</span><p class="realmtag" style="--rc:${REALMS[h.realm].color}">${REALMS[h.realm].name}</p><p><b>${h.title}</b> · ${h.role}</p>${h.origin ? `<p class="origin">✦ ${h.origin}</p>` : ''}<p class="stars big">${own ? '★'.repeat(st.stars) + '☆'.repeat(5 - st.stars) : 'Not recruited'}</p>${own ? `<p>Level ${st.lvl} / ${heroCap()}</p>${bar(st.xp / xpNeed, 'teal')}<small>${fmt(st.xp)} / ${fmt(xpNeed)} XP</small>` : ''}</div></div>
  <p class="bio">“${h.bio}”</p>
  <div class="stats"><span>HP ${fmt(s.hp)}</span><span>ATK ${fmt(s.atk)}</span><span>DEF ${fmt(s.def)}</span><span>SPD ${s.spd}</span></div>
  <div class="card"><h4>${ART.icon('vigor', 14)} ${h.skill.name}</h4><p>${h.skill.desc}</p></div>
  <p>Shards: <b>${st.shards}</b>${need ? ` / ${need} for ${own ? 'next star' : 'recruit'}` : ''}. <span class="muted">Win campaign stages, destroy Ashen outposts or use the Crown Summon to find shards.</span></p>
  ${own ? LIVE.gearHTML(id) : ''}
  <div class="btns">
  ${need && st.shards >= need ? `<button class="btn gold" data-act="star" data-id="${id}">${own ? 'Raise star' : 'Recruit'}</button>` : ''}
  ${own ? `<button class="btn" data-act="squad" data-id="${id}">${S.squad.includes(id) ? 'Remove from squad' : 'Add to squad'}</button>
  <button class="btn" data-act="tome" data-id="${id}" ${S.items.scroll ? '' : 'disabled'}>${ART.icon('scroll', 14)} Use Hero Tome (${S.items.scroll || 0})</button>
  <button class="btn" data-act="tutor" data-id="${id}">${ART.icon('gold', 14)} ${fmt(tutor)} Tutor (+${fmt(xpNeed * .5)} XP)</button>` : ''}</div>`);
}
const xpFor = l => Math.floor(120 * Math.pow(Math.max(1, l), 1.55));
// Full-screen moment for a hero growing stronger: their full-body art rises in a burst of light.
function heroMoment(id, word, sub) { setTimeout(() => heroMomentNow(id, word, sub), 0); }
function heroMomentNow(id, word, sub) {
  const h = HERO[id], fig = ART.asset('champions', id); if (!fig) { FX.banner(word, `${esc(h.name)} · ${sub}`, { art: ART.portrait(h, 110) }); return; }
  const reopen = sheet().open; closeSheet();
  const el = document.createElement('div'); el.className = 'spot hm r-' + h.rarity; el.style.setProperty('--rc', (REALMS[h.realm] || {}).color || '#7a4fb3');
  el.innerHTML = `<i class="sp-rays"></i><img src="${fig}" alt=""><div><small>${word}</small><b>${esc(h.name)}</b><span>${sub}</span></div>`;
  document.body.appendChild(el); FX.sound(word === 'LEVEL UP' ? 'done' : 'legend'); setTimeout(() => { const c = FX.centerOf(el.querySelector('img')); FX.burst(c.x, c.y, { n: 70, shape: 'star', size: 6, speed: 10, ring: '#ffd36b', life: 1.4 }); }, 350);
  let gone = false; const close = () => { if (gone) return; gone = true; el.classList.add('out'); setTimeout(() => { el.remove(); if (reopen && tab === 'heroes') openHero(id); }, 400); }; el.addEventListener('click', close); setTimeout(close, 2600);
}
function heroXP(id, xp) {
  const h = S.heroes[id]; if (!h || !h.stars) return;
  h.xp += xp; while (h.lvl < heroCap() && h.xp >= xpFor(h.lvl)) { h.xp -= xpFor(h.lvl); h.lvl++; }
  if (h.lvl >= heroCap()) h.xp = Math.min(h.xp, xpFor(h.lvl));
}

/* ======================= Story campaign battles ======================= */
function stageFoes(ch, n) {
  const C = CHAPTERS[ch - 1], idx = (ch - 1) * 6 + n - 1, k = 1.55 * (1 + idx * .164 + idx * idx * STAGE_K);
  const mk = (kind, mult = 1, name) => { const f = FOES[kind]; return { id: kind + Math.random(), name: name || f.name, kind, hp: Math.round(f.hp * k * mult), max: Math.round(f.hp * k * mult), atk: Math.round(f.atk * k * (name ? 1.1 : 1)), def: Math.round(f.def * k * .6), spd: f.spd, en: 0, foe: true }; };
  if (n === 6) return [mk(C.foes[0]), mk(C.boss.kind, C.boss.hp, C.boss.name), mk(C.foes[1])];
  return [0, 1, 2].map(i => mk(C.foes[(i + n) % 3]));
}
let fight = null;
let STAGE_K = .00764;
/* ---------- Daily Boss Trial: a boss of the day, 3 attempts, rewards by damage dealt ---------- */
const TRIAL_TURNS = 12, TRIAL_TIERS = [[.1, 'Bronze', '#c07a3a'], [.3, 'Silver', '#c9d6e3'], [.6, 'Gold', '#ffd36b'], [1, 'Legend', '#b48cff']];
const trialState = () => { if (!S.trial || S.trial.day !== today()) S.trial = { day: today(), left: 3, best: 0 }; return S.trial; };
const trialBossCh = () => { const d = new Date(); return (d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) % CHAPTERS.length + 1; };
const progressCh = () => { for (let c = 1; c <= CHAPTERS.length; c++) if (!S.stages[c + '-6']) return c; return CHAPTERS.length; };
function trialCard() {
  const t = trialState(), C = CHAPTERS[trialBossCh() - 1], u = ART.asset('fiends', C.boss.kind), tier = TRIAL_TIERS.filter(x => t.best >= x[0]).pop();
  return `<div class="trialcard" style="--rc:${(REALMS[C.realm] || { color: '#7a4fb3' }).color}">${u ? `<img src="${u}" alt="">` : ART.enemy(C.boss.kind, 110)}<div><small>Daily Boss Trial</small><h4>${esc(C.boss.name)}</h4><p class="muted">${TRIAL_TURNS} turns to deal as much damage as you can. Rewards grow with every tier you reach.</p>
    <div class="ttiers">${TRIAL_TIERS.map(([p, n, c]) => `<span class="${t.best >= p ? 'got' : ''}" style="--tc:${c}">${n}<i>${Math.round(p * 100)}%</i></span>`).join('')}</div>
    <p class="tbest">Best today: <b>${Math.round(t.best * 100)}%</b>${tier ? ` · ${tier[1]}` : ''}</p>${t.left ? `<button class="btn gold" data-act="trial">Fight · ${t.left} attempt${t.left > 1 ? 's' : ''} left</button>` : `<span class="muted">New boss in ${fmtT(midnight())}</span>`}</div></div>`;
}
function startTrial() {
  const t = trialState(); if (!t.left) return toast('No attempts left today: a new boss arrives at midnight', 'bad');
  const squad = S.squad.filter(id => S.heroes[id] && S.heroes[id].stars > 0); if (!squad.length) return toast('Pick heroes for your squad', 'bad');
  t.left--; const ch = trialBossCh(), C = CHAPTERS[ch - 1], base = stageFoes(progressCh(), 6).reduce((a, b) => b.max > a.max ? b : a);
  const hp = Math.round(base.max * 1.3), boss = { id: 'trialboss', name: C.boss.name, kind: C.boss.kind, hp, max: hp, atk: Math.round(base.atk * .9), def: base.def, spd: base.spd, en: 0, foe: true };
  fight = { mode: 'trial', key: 'Trial', ch, n: 6, heroes: LIVE.squadUnits(squad), foes: [boss], turn: 0, buff: 0, shield: 0, auto: !!S.autoSkill, speed: S.fightSpeed || 1, over: false, q: [], next: now() + 1500, pauseUntil: 0 };
  closeSheet(); $('#battle').hidden = false; buildFight(); FX.setMood('boss'); FX.sound('horn');
  { const bu = ART.asset('fiends', C.boss.kind); setTimeout(() => FX.banner(`<span class="bossword">TRIAL</span>${esc(C.boss.name)}`, `${TRIAL_TURNS} turns · deal all the damage you can`, { cls: 'boss', ms: 2000, sound: 'alarm', art: bu ? `<img class="bossfig" src="${bu}" alt="">` : '' }), 1900); }
  fight.timer = setInterval(fightLoop, 50); save();
}
function endTrial(f) {
  const t = trialState(), b = f.foes[0], pct = Math.min(1, (b.max - Math.max(0, b.hp)) / b.max), tier = TRIAL_TIERS.filter(x => pct >= x[0]).pop(), first = pct > t.best, L = Math.max(1, S.b.citadel);
  t.best = Math.max(t.best, pct); const ti = tier ? TRIAL_TIERS.indexOf(tier) : -1;
  const r = ti < 0 ? { gold: 150 * L } : { gold: [400, 900, 1600, 3000][ti] * L, gems: [5, 12, 25, 60][ti], essence: [3, 6, 12, 25][ti] }; if (ti >= 2) r.items = { [ti === 3 ? 'sp60' : 'sp5']: ti === 3 ? 1 : 2 };
  give(r); LIVE.on('stage', 1);
  const html = `<div class="res-rays"></div><h2 class="win" style="font-size:clamp(26px,7vw,40px)">${tier ? tier[1] + ' tier' : 'Trial over'}</h2><div class="tmeter"><i style="width:${pct * 100}%"></i>${TRIAL_TIERS.map(([p, n, c]) => `<b style="left:${p * 100}%;--tc:${c}" class="${pct >= p ? 'got' : ''}">${n}</b>`).join('')}</div><p class="tdmg"><b>${fmt(b.max - Math.max(0, b.hp))}</b> damage · ${Math.round(pct * 100)}% of the boss${first && pct > 0 ? ' · <em>new best today!</em>' : ''}</p>
    <div class="rloot">${META.rewardHTML(r)}</div><div class="rbtns"><button class="btn" data-act="closefight">Leave</button>${t.left ? `<button class="btn gold" data-act="retry">Try again (${t.left})</button>` : ''}</div>`;
  const box = document.createElement('div'); box.className = 'result won'; box.innerHTML = html; setTimeout(() => $('#battle .bfield')?.appendChild(box), 500);
  FX.sound(tier ? 'win' : 'loss'); if (tier) setTimeout(() => FX.confetti(), 300); save();
}
function openStages() {
  const html = CHAPTERS.map((C, ci) => {
    const unlocked = ci === 0 || S.stages[`${ci}-6`], R = REALMS[C.realm] || { color: '#7a4fb3', name: 'The Sunspire' }, done = [1, 2, 3, 4, 5, 6].filter(n => S.stages[`${ci + 1}-${n}`]).length;
    return `<div class="chapter ${unlocked ? '' : 'locked'}" style="--rc:${R.color}"><div class="chead"><div class="cboss">${ART.enemy(C.boss.kind, 64)}</div><div><small>Chapter ${ci + 1} · ${R.name}</small><h4>${C.name}</h4><span class="muted">${done}/6 stages${unlocked ? '' : ' · 🔒 finish the previous chapter'}</span></div>${unlocked ? `<button class="mini" data-act="story" data-ch="${ci + 1}">📜 Story</button>` : ''}</div><div class="stages">${[1, 2, 3, 4, 5, 6].map(n => {
      const key = `${ci + 1}-${n}`, prev = n === 1 ? unlocked : S.stages[`${ci + 1}-${n - 1}`], stars = S.stages[key] || 0, shard = STAGE_SHARD[key], join = STORY_JOIN[key];
      return `<button class="stage ${n === 6 ? 'boss' : ''} ${prev ? '' : 'locked'} ${prev && !stars ? 'next' : ''}" data-act="stage" data-key="${key}" ${prev ? '' : 'disabled'}><b>${key}</b><span>${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>${join && !stars ? `<small class="join">${shortName(join)} joins</small>` : shard ? `<small>${shortName(shard)}</small>` : ''}</button>`;
    }).join('')}</div></div>`;
  }).join('');
  openSheet(`${ART.icon('vigor', 18)} Story Campaign · Vigor ${S.vigor}`, trialCard() + html + (S.items.vigor ? `<button class="btn" data-act="usevigor">${ART.icon('vigor', 14)} Drink Elixir of Vigor (${S.items.vigor})</button>` : '') + LIVE.adButton('vigor', 'Watch an ad: +12 Vigor'), true);
}

const SHORT = { arthur: 'Arthur', elcid: 'El Cid', suntzu: 'Sun Tzu', peter: 'Peter', leonardo: 'Leonardo', bismarck: 'Bismarck', antarah: 'Antarah', zarqa: 'Zarqa' };
const shortName = id => SHORT[id] || HERO[id].name.split(' ').find(w => !['Sir', 'Emira'].includes(w));
/* ---------- story cutscenes ---------- */
function speakerInfo(sp) {
  if (sp === 'narrator') return { name: '', art: '' };
  if (HERO[sp]) return { name: HERO[sp].name, art: ART.portrait(HERO[sp], 220), side: 'l', color: (REALMS[HERO[sp].realm] || {}).color };
  if (FOES[sp]) return { name: FOES[sp].name, art: ART.enemy(sp, 220), side: 'r', color: '#ff5e3a' };
  return { name: S.name, art: ART.emblem(200), side: 'l' };
}
function playStory(lines, title, onDone, ch) {
  if (!lines || !lines.length) return onDone && onDone();
  closeSheet();
  const ov = document.createElement('div'); ov.className = 'story'; let i = 0, typing = null, full = '', lastSp = null; const slots = {};
  ov.innerHTML = `${ch ? `<div class="st-scene">${arenaSVG(ch)}</div>` : ART.keyUrl('epic') ? `<div class="st-scene"><img class="arena painted-bg" src="${ART.keyUrl('epic')}" alt=""></div>` : ''}<div class="st-bg ${ch || ART.keyUrl('epic') ? 'over' : ''}"></div><i class="lb top"></i><i class="lb bot"></i>${title ? `<div class="st-title">${title}</div>` : ''}<div class="st-art"></div><div class="st-box"><b class="st-name"></b><p class="st-text"></p><span class="st-next">▼</span></div><button class="st-skip">Skip ›</button>`;
  document.body.appendChild(ov); FX.setMood('cine');
  const show = () => {
    const [sp, raw] = lines[i], info = speakerInfo(sp); full = raw.replace(/\{name\}/g, S.name);
    // full-body figures face each other across the scene: the speaker lit and forward, the other side dimmed
    const fig = HERO[sp] ? ART.asset('champions', sp) : FOES[sp] ? ART.asset('fiends', sp) : null;
    if (fig) {
      const side = FOES[sp] ? 'r' : 'l'; slots[side] = { sp, fig, c: info.color || '#e8a33d' };
      ov.querySelector('.st-art').innerHTML = ['l', 'r'].map(k => slots[k] ? `<img class="st-fig ${k} ${k === side ? 'stact' : 'stdim'} ${k === side && slots[k].sp !== lastSp ? 'enter' : ''}" style="--c:${slots[k].c}" src="${slots[k].fig}" alt="">` : '').join('');
    } else ov.querySelector('.st-art').innerHTML = info.art ? `<div class="st-portrait ${info.side}" style="--c:${info.color || '#e8a33d'}">${info.art}</div>` : '';
    lastSp = sp;
    ov.querySelector('.st-name').textContent = info.name; ov.querySelector('.st-box').classList.toggle('narr', !info.name);
    const tx = ov.querySelector('.st-text'); tx.textContent = ''; let k = 0; clearInterval(typing);
    typing = setInterval(() => { tx.textContent = full.slice(0, ++k); if (k % 3 === 0) FX.sound('tick'); if (k >= full.length) { clearInterval(typing); typing = null; } }, 22);
  };
  const end = () => { clearInterval(typing); ov.classList.add('out'); setTimeout(() => ov.remove(), 400); FX.setMood(fight ? 'battle' : tab === 'world' ? 'world' : 'city'); onDone && onDone(); };
  ov.addEventListener('click', e => {
    if (e.target.classList.contains('st-skip')) return end();
    if (typing) { clearInterval(typing); typing = null; ov.querySelector('.st-text').textContent = full; return; }
    if (++i >= lines.length) return end(); show();
  });
  show();
}
function chapterStory(ch, part, cb) { const C = CHAPTERS[ch - 1]; playStory(STORY[ch][part], `Chapter ${ch} · ${C.name}`, cb, ch); }

const ARENA = {
  greenhold: { sky: ['#9fd0f0', '#f0c890'], far: '#5a8a6a', mid: '#4f7a3c', near: '#7aa64a', sun: '#fff6d8', deco: 'oak' },
  amber: { sky: ['#ffcf8a', '#e8743d'], far: '#c98a52', mid: '#b5783f', near: '#d9a868', sun: '#fff1c4', deco: 'palm' },
  frostmark: { sky: ['#123047', '#7fb0c8'], far: '#7f9fb8', mid: '#a9c0d4', near: '#e8eef5', sun: '#e6fbff', deco: 'pine' },
  jade: { sky: ['#f0b8a0', '#f8e0c0'], far: '#5a8a7a', mid: '#4f7a5a', near: '#7fa86a', sun: '#fff1e0', deco: 'bamboo' },
  coral: { sky: ['#5ac8e0', '#ffd8a8'], far: '#1fa5b8', mid: '#25c4d6', near: '#f5e2b4', sun: '#fffbe8', deco: 'palm' },
  sunspire: { sky: ['#1b0f26', '#7a4fb3'], far: '#3a2a4a', mid: '#4a3a3a', near: '#6a5a4a', sun: '#ffd36b', deco: 'spire' }
};
function arenaSVG(ch) {
  const painted = ART.keyUrl('chapter' + ch); if (painted) return `<img class="arena painted-bg" src="${painted}" alt="" decoding="async">`;
  const C = CHAPTERS[ch - 1], A = ARENA[C.realm] || ARENA.greenhold, u = 'ar' + ch;
  const deco = A.deco === 'spire' ? '<g fill="#2a1f33"><path d="M180 330l20-200 20 200z"/><path d="M140 330h120v-30H140z"/></g><path d="M200 130l6 60h-12z" fill="#ffd36b" opacity=".7"/>'
    : A.deco === 'pine' ? '<g fill="#3a5a6a">' + [30, 90, 330, 370].map((x, i) => `<path d="M${x} ${400 - i % 2 * 20}l-26 0 26-80 26 80z"/>`).join('') + '</g><g fill="#fff" opacity=".8"><path d="M20 260l50-90 50 90z" fill="#c9d6e3"/><path d="M280 270l60-110 60 110z" fill="#c9d6e3"/><path d="M50 205l20-35 20 35-10-6-10 8z"/><path d="M322 190l18-30 18 30-9-5-9 7z"/></g>'
    : A.deco === 'bamboo' ? '<g stroke="#3e6a4a" stroke-width="6">' + [20, 40, 60, 350, 370, 385].map(x => `<path d="M${x} 520V250"/>`).join('') + '</g><path d="M240 340l50-60 50 60-14-4-36 -40-36 40z" fill="#2a5a4a" opacity=".6"/>'
    : A.deco === 'oak' ? '<g>' + [[40, 400], [360, 390], [320, 410]].map(([x, y]) => `<circle cx="${x}" cy="${y - 60}" r="44" fill="#3e6a34"/><rect x="${x - 6}" y="${y - 30}" width="12" height="40" fill="#5a3a24"/>`).join('') + '</g>'
    : '<g fill="#3e6a3a">' + [[40, 420], [370, 410]].map(([x, y]) => `<path d="M${x} ${y}c4-40 8-70 2-110" stroke="#6a4a2a" stroke-width="7" fill="none"/><path d="M${x + 2} ${y - 110}c-30-10-50 0-60 16 20-8 40-10 60-16zM${x + 2} ${y - 110}c30-10 50 0 60 16-20-8-40-10-60-16zM${x + 2} ${y - 110}c-14-20-34-24-48-20 20 2 32 8 48 20z"/>`).join('') + '</g>';
  const ash = ch === 6 ? '<g fill="#ff7a2a" opacity=".6"><circle cx="80" cy="300" r="2"/><circle cx="250" cy="260" r="1.5"/><circle cx="330" cy="330" r="2"/><circle cx="140" cy="200" r="1.5"/></g>' : '';
  return `<svg class="arena" viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${A.sky[0]}"/><stop offset=".65" stop-color="${A.sky[1]}"/></linearGradient><radialGradient id="${u}g"><stop offset="0" stop-color="${A.sun}"/><stop offset="1" stop-color="${A.sun}" stop-opacity="0"/></radialGradient></defs>
  <rect width="400" height="700" fill="url(#${u}s)"/><circle cx="290" cy="170" r="110" fill="url(#${u}g)" opacity=".7"/><circle cx="290" cy="170" r="38" fill="${A.sun}"/>
  <path d="M0 330C80 280 160 300 240 270S360 280 400 260V700H0z" fill="${A.far}"/>${deco}${ash}
  <path d="M0 420C100 370 200 400 300 370S380 380 400 370V700H0z" fill="${A.mid}"/>
  <path d="M0 520C120 480 240 520 400 490V700H0z" fill="${A.near}"/><ellipse cx="200" cy="600" rx="190" ry="40" fill="#0002"/></svg>`;
}
function startStage(key, skipStory) {
  { const [c0, n0] = key.split('-').map(Number); if (!skipStory && n0 === 1 && !S.seenStory[c0 + 'i']) { S.seenStory[c0 + 'i'] = 1; return chapterStory(c0, 'intro', () => startStage(key, true)); } }
  if (S.vigor < 6) return toast('Not enough Vigor — rest a while or drink a Elixir of Vigor', 'bad');
  const squad = S.squad.filter(id => S.heroes[id] && S.heroes[id].stars > 0); if (!squad.length) return toast('Pick heroes for your squad', 'bad');
  S.vigor -= 6; const [ch, n] = key.split('-').map(Number);
  const heroes = LIVE.squadUnits(squad);
  fight = { key, ch, n, heroes, foes: stageFoes(ch, n), turn: 0, buff: 0, shield: 0, auto: !!S.autoSkill, speed: S.fightSpeed || 1, over: false, q: [], next: now() + 1500, pauseUntil: 0 };
  closeSheet(); const b = $('#battle'); b.hidden = false; buildFight(); FX.setMood(n === 6 ? 'boss' : 'battle'); FX.sound('horn');
  if (n === 6) { const bk = CHAPTERS[ch - 1].boss.kind, bu = ART.asset('fiends', bk); setTimeout(() => FX.banner(`<span class="bossword">BOSS</span>${esc(CHAPTERS[ch - 1].boss.name)}`, `Chapter ${ch} · ${CHAPTERS[ch - 1].name}`, { cls: 'boss', ms: 2100, sound: 'alarm', art: bu ? `<img class="bossfig" src="${bu}" alt="">` : ART.enemy(bk, 110) }), 1900); }
  fight.timer = setInterval(fightLoop, 50);
}
function buildFight() {
  const f = fight;
  const unit = (u, side) => `<div class="unit ${side === 'h' ? 'hero-u' : 'foe-u'} ${u.max > 2 * (f.foes[0]?.max || 0) && side === 'f' ? 'boss' : ''}" id="u-${side}-${u.id}" data-act="${side === 'h' ? 'cast' : 'target'}" data-id="${u.id}">
    <div class="pf">${side === 'h' || u.hero ? ART.portrait(u.hero, 88) : ART.enemy(u.kind, 88)}<span class="tapme">SKILL!</span></div><b>${esc(u.name)}</b>
    <div class="hpbar"><i class="trail"></i><i class="fill"></i></div>${side === 'h' ? '<div class="enbar"><i></i></div>' : ''}<div class="fx-st"></div></div>`;
  $('#battle').innerHTML = `${arenaSVG(f.ch)}<div class="dust"></div><div class="bfield army">
    <div class="btop"><button class="bt" data-act="retreat">✕</button><div class="stage-t">${f.mode === 'arena' ? `<small>Arena of Crowns</small><b>vs ${esc(f.opp.name)}</b>` : f.mode === 'trial' ? `<small>Daily Boss Trial · ${TRIAL_TURNS} turns</small><b>${esc(f.foes[0].name)}</b>` : `<small>Chapter ${f.ch} · ${CHAPTERS[f.ch - 1].name}</small><b>Stage ${f.key}</b>`}</div><span id="bstat"></span><button class="bt" data-act="bspeed" id="bspeed">${f.speed}×</button><label class="bt auto"><input type="checkbox" data-act="auto" ${f.auto ? 'checked' : ''}>Auto</label></div>
    <div class="row foes">${f.foes.map(u => unit(u, 'f')).join('')}</div>
    <div class="bfwrap"><canvas id="bfcv"></canvas><div class="vs"><span>Turn <b id="bturn">1</b></span></div></div>
    <div class="row mine">${f.heroes.map(u => unit(u, 'h')).join('')}</div>
    <p class="hint"></p></div><div class="stage-intro"><small>Hero Trials</small><b>Stage ${f.key}</b><span>Fight!</span></div>`;
  f.foes.forEach((u, i) => { u.cd = 2 + (i + f.n) % 3; u.wind = 0; }); f.perfects = 0; f.breaks = 0; f.bestChain = 0;
  updFight(); clashIntro(f);
  BF.onTap = (side, u) => { if (side === 'f') { f.target = u.id; sfx('click'); updFight(); } else if (u.en >= 100 && !f.over && !f.auto && !f.timing && now() >= f.pauseUntil) timedCast(u); };
  BF.start(f, $('#bfcv'));
}
const focusFoe = () => { const a = alive(fight.foes); return a.find(u => u.id === fight.target) || a[0]; };
function callout(txt, cls = '') { const b = $('#battle'); if (!b) return; const n = document.createElement('div'); n.className = 'callout ' + cls; n.textContent = txt; b.appendChild(n); setTimeout(() => n.remove(), 950); }
// Timed cast: a ring closes on the hero; tapping as it meets the gold circle powers up the skill.
function timedCast(u) {
  const f = fight; if (f.timing) return;
  const el = document.getElementById('u-h-' + u.id);
  if (!el || (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches)) { castSkill(u); updFight(); return; }
  const c = FX.centerOf(el), D = 950, t0 = performance.now(), ov = document.createElement('div'); ov.className = 'timing'; ov.style.setProperty('--x', c.x + 'px'); ov.style.setProperty('--y', c.y + 'px');
  ov.innerHTML = '<i class="tm-target"></i><i class="tm-ring"></i><b>TAP ON GOLD</b>'; $('#battle').appendChild(ov);
  f.timing = true; f.pauseUntil = Math.max(f.pauseUntil, now() + D + 150); FX.sound('tick'); let fin = false;
  const done = tap => {
    if (fin) return; fin = true; const sc = 2.6 - 2 * (performance.now() - t0) / D, err = tap ? Math.abs(sc - 1) : 9, g = err < .14 ? 'perfect' : err < .38 ? 'great' : 'ok';
    ov.classList.add('done'); setTimeout(() => ov.remove(), 280); f.timing = false; if (fight !== f || f.over || u.hp <= 0) return;
    if (g === 'perfect') { f.perfects++; callout('PERFECT!  ×1.5'); FX.sound('crit'); navigator.vibrate && navigator.vibrate(25); } else if (g === 'great') { callout('GREAT  ×1.25', 'great'); FX.sound('coin'); }
    castSkill(u, g === 'perfect' ? 1.5 : g === 'great' ? 1.25 : 1); updFight();
  };
  ov.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); done(true); }); setTimeout(() => done(false), D);
}
// Cinematic opener: both sides slide in over painted siege art, then collide.
function clashIntro(f) {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const bg = ART.keyUrl(f.n === 6 ? 'epic' : 'siege') || ART.keyUrl('epic'), b = $('#battle'), d = document.createElement('div'); d.className = 'clash' + (f.n === 6 ? ' boss' : '');
  if (bg) d.style.backgroundImage = `linear-gradient(#05030d99,#05030dd9),url(${bg})`;
  const P = (u, s) => `<span style="--i:${s}">${u.hero ? ART.portrait(u.hero, 84) : ART.enemy(u.kind, 84)}</span>`;
  d.innerHTML = `<i class="lb top"></i><i class="lb bot"></i><div class="cl-side l">${f.heroes.slice(0, 5).map(P).join('')}</div><b class="cl-vs">VS</b><div class="cl-side r">${f.foes.slice(0, 5).map(P).join('')}</div><i class="cl-flash"></i>`;
  b.appendChild(d); f.next = Math.max(f.next || 0, now() + 2500); const si = b.querySelector('.stage-intro'); if (si) si.style.animationDelay = '1.5s';
  setTimeout(() => { if (fight === f) { FX.sound('crit'); FX.shake(b, 12, 380); } }, 950);
  setTimeout(() => d.remove(), 1750);
}
/* ---- breathtaking moments: finishing blow, boss enrage, last stand ---- */
function finisher(target, delay) {
  const f = fight; f.pauseUntil = Math.max(f.pauseUntil, now() + delay + 1350); const boss = f.n === 6 && f.mode !== 'arena';
  setTimeout(() => {
    if (fight !== f) return; const b = $('#battle'), el = document.getElementById('u-f-' + target.id), bf = b.querySelector('.bfield'), c = el ? FX.centerOf(el) : { x: innerWidth / 2, y: innerHeight / 3 };
    if (bf) bf.style.transformOrigin = `${c.x}px ${c.y}px`; b.classList.add('finish');
    const w = document.createElement('div'); w.className = 'fin-word' + (boss ? ' boss' : ''); w.innerHTML = `<i></i><b>${boss ? 'BOSS SLAIN' : 'FINISHING BLOW'}</b>`; b.appendChild(w);
    FX.sound('crit'); FX.shake(b, 16, 520); FX.burst(c.x, c.y, { n: 80, shape: 'star', size: 6, speed: 11, colors: ['#fff', '#ffd36b', '#ff7a59'], ring: '#fff', life: 1.2 });
    setTimeout(() => { b.classList.remove('finish'); w.remove(); }, 1300);
  }, delay);
}
function enrage(boss, delay) {
  const f = fight; f.enraged = true; boss.atk = Math.round(boss.atk * 1.2); f.pauseUntil = Math.max(f.pauseUntil, now() + delay + 1500);
  setTimeout(() => { if (fight !== f) return; const b = $('#battle'); b.classList.add('enraged'); document.getElementById('u-f-' + boss.id)?.classList.add('enr'); FX.shake(b, 18, 600); FX.banner(`<span class="bossword">ENRAGED</span>${esc(boss.name)}`, 'The ash burns hotter: its attack rises', { cls: 'boss', ms: 1300, sound: 'alarm', art: ART.enemy(boss.kind, 110) }); }, delay + 150);
}
function lastStand(u, delay) {
  const f = fight; f.lastStand = true; u.en = 100; u.atk = Math.round(u.atk * 1.25); f.pauseUntil = Math.max(f.pauseUntil, now() + delay + 1500);
  setTimeout(() => { if (fight !== f) return; $('#battle').classList.add('laststand'); document.getElementById('u-h-' + u.id)?.classList.add('stand'); FX.banner('LAST STAND', `${esc(u.name)} fights on alone: skill ready, attack up`, { ms: 1300, sound: 'horn', art: ART.portrait(u.hero, 110) }); updFight(); }, delay + 150);
}
function updUnit(u, side) {
  const el = document.getElementById(`u-${side}-${u.id}`); if (!el) return;
  const p = clamp(u.hp / u.max, 0, 1) * 100;
  el.querySelector('.fill').style.width = p + '%'; el.querySelector('.trail').style.width = p + '%';
  el.classList.toggle('low', p < 30 && p > 0); el.classList.toggle('stun', !!u.stun);
  if (u.hp <= 0 && !el.classList.contains('dead')) { el.classList.add('dead'); const c = FX.centerOf(el); FX.burst(c.x, c.y, { n: 26, colors: side === 'f' ? ['#ff7a59', '#ffd36b', '#3a2414'] : ['#9fc3e6', '#fff'], speed: 5 }); }
  if (side === 'f') { el.classList.toggle('wind', !!u.wind && u.hp > 0); el.classList.toggle('tgt', u.hp > 0 && focusFoe() === u && alive(fight.foes).length > 1); }
  if (side === 'h') { el.querySelector('.enbar i').style.width = u.en + '%'; el.classList.toggle('ready', u.en >= 100 && u.hp > 0 && !fight.auto); }
}
function updFight() {
  const f = fight; if (!f) return;
  f.foes.forEach(u => updUnit(u, 'f')); f.heroes.forEach(u => updUnit(u, 'h'));
  const t = $('#bturn'); if (t) t.textContent = f.turn + 1;
  const hn = $('#battle .hint'); if (hn) { const w = alive(f.foes).some(u => u.wind), rd = alive(f.heroes).some(u => u.en >= 100); hn.className = 'hint' + (w && !f.auto ? ' warn' : ''); hn.textContent = f.auto ? 'Auto skills on: switch Auto off to time your skills and break enemy charges' : w && rd ? '⚠ A foe is charging a heavy blow: hit it with a skill to break it!' : w ? '⚠ A foe is charging a heavy blow' : rd ? 'Tap the glowing hero, then tap as the ring meets the gold circle' : 'Tap a foe to focus your attacks on it'; }
  const st = $('#bstat'); if (st) st.innerHTML = (f.shield ? '<i class="st sh">🛡 Bastion</i>' : '') + (f.buff ? '<i class="st bf">✦ Star Chart</i>' : '');
}
const alive = a => a.filter(u => u.hp > 0);
function hitFx(side, id, txt, cls = '', delay = 0) {
  setTimeout(() => {
    const el = document.getElementById(`u-${side}-${id}`); if (!el) return; BF.hit(side, id, txt, cls);
    const n = document.createElement('span'); n.className = 'dmg ' + cls; n.textContent = txt; n.style.left = (35 + Math.random() * 30) + '%'; el.appendChild(n); setTimeout(() => n.remove(), 1000);
    if (cls !== 'heal') { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); const c = FX.centerOf(el); FX.burst(c.x, c.y - 10, { n: cls === 'crit' ? 22 : 9, shape: 'spark', size: 4, speed: cls === 'crit' ? 9 : 6, colors: cls === 'crit' ? ['#ffd36b', '#fff', '#ff7a59'] : ['#fff3c4', '#ffd36b'], g: .05, life: .45 }); }
    else { const c = FX.centerOf(el); FX.burst(c.x, c.y, { n: 12, colors: ['#6fe39a', '#c8ffd9'], g: -.08, speed: 2.5, life: .9 }); }
    updUnit(fight ? [...fight.heroes, ...fight.foes].find(u => u.id === id) || { hp: 1, max: 1, en: 0 } : { hp: 1, max: 1, en: 0 }, side);
  }, delay);
}
function dealTo(target, raw, side, delay = 0, critChance = .1) {
  const crit = Math.random() < critChance;
  let d = Math.max(1, Math.round(raw * raw / (raw + target.def * 1.2) * (0.9 + Math.random() * .2) * (crit ? 1.6 : 1)));
  if (side === 'h' && fight.shield) d = Math.round(d * .5);
  if (side === 'f' && fight.cur) fight.cur.dmg = (fight.cur.dmg || 0) + Math.min(d, target.hp);
  target.hp = Math.max(0, target.hp - d); if (side === 'h') target.en = Math.min(100, target.en + 8);
  hitFx(side, target.id, (crit ? 'CRIT ' : '') + fmt(d), crit ? 'crit' : '', delay);
  if (side === 'f') {
    if (target.hp <= 0 && !alive(fight.foes).length) finisher(target, delay);
    else if (fight.n === 6 && fight.mode !== 'arena' && !fight.enraged && target.hp > 0 && target.hp < target.max * .5 && target.max === Math.max(...fight.foes.map(u => u.max))) enrage(target, delay);
  } else if (target.hp <= 0 && !fight.lastStand && fight.heroes.length > 1) { const a = alive(fight.heroes); if (a.length === 1) lastStand(a[0], delay); }
  if (delay < 400) setTimeout(() => FX.sound(crit ? 'crit' : 'hit'), delay);
  if (crit) setTimeout(() => FX.shake($('#battle .bfield'), 6, 200), delay);
  return d;
}
function lunge(side, u, target) {
  const el = document.getElementById(`u-${side}-${u.id}`), tg = target && document.getElementById(`u-${side === 'h' ? 'f' : 'h'}-${target.id}`); if (!el) return 0;
  const ranged = side === 'h' && ['Ranged', 'Mage', 'Engineer', 'Support'].includes(u.hero.role);
  const sp = fight.speed; if (target) BF.attack(side, u, target);
  if (BF.active) { el.animate([{ transform: 'none' }, { transform: 'scale(1.07)' }, { transform: 'none' }], { duration: 240 / sp }); if (ranged) FX.sound('arrow'); return (ranged ? 240 : 200) / sp; }
  if (ranged && tg) {
    const a = FX.centerOf(el), b = FX.centerOf(tg), p = document.createElement('div'); p.className = 'proj ' + u.hero.role.toLowerCase(); document.body.appendChild(p);
    const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    p.animate([{ transform: `translate(${a.x}px,${a.y}px) rotate(${ang}deg)` }, { transform: `translate(${b.x}px,${b.y}px) rotate(${ang}deg)` }], { duration: 220 / sp, easing: 'ease-in' }).onfinish = () => p.remove();
    el.animate([{ transform: 'none' }, { transform: 'translateY(-6px) scale(1.04)' }, { transform: 'none' }], { duration: 220 / sp });
    FX.sound('arrow'); return 220 / sp;
  }
  const dir = side === 'h' ? -1 : 1;
  el.animate([{ transform: 'none' }, { transform: `translateY(${dir * 46}px) scale(1.08)`, offset: .45 }, { transform: 'none' }], { duration: 300 / sp, easing: 'cubic-bezier(.3,0,.3,1)' });
  return 130 / sp;
}
const SKILL_FX = { aoe: 'fire', stun: 'rune', single: 'slash', crit: 'slash', heal: 'rays', shield: 'rune', buff: 'rays' };
function skillFx(kind) {
  const url = ART.asset('fx', SKILL_FX[kind]), b = $('#battle'); if (!url || !b) return;
  const side = kind === 'heal' || kind === 'shield' || kind === 'buff' ? 'mine' : 'foes', row = b.querySelector('#bfcv') || b.querySelector('.row.' + side); if (!row) return;
  let r = row.getBoundingClientRect(); if (row.id === 'bfcv') r = { left: r.left + (side === 'foes' ? r.width * .5 : 0), top: r.top + r.height * .25, width: r.width * .5, height: r.height * .5 };
  const im = document.createElement('img'); im.className = 'skfx ' + SKILL_FX[kind]; im.src = url; im.alt = '';
  const sz = row.id === 'bfcv' ? Math.min(r.width * 1.5, r.height * 2) : Math.max(r.height * 1.9, Math.min(r.width, 420)); im.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:${sz}px;height:${sz}px`;
  document.body.appendChild(im); setTimeout(() => im.remove(), 900);
}
function castSkill(u, bonus = 1) {
  fight.cur = u; if (QUIPS[u.hero.id]) setTimeout(() => BF.say(u, QUIPS[u.hero.id][2]), 1000 / (fight.speed || 1));
  const f = fight, sk = u.hero.skill; u.en = 0;
  if (f.chainTurn === f.turn) { f.chain = Math.min(3, (f.chain || 0) + 1); f.bestChain = Math.max(f.bestChain || 0, f.chain); setTimeout(() => callout(`CHAIN ×${f.chain + 1}  +${f.chain * 15}%`, 'chain'), 380); } else f.chain = 0;
  f.chainTurn = f.turn; const atk = u.atk * (f.buff ? 1.4 : 1) * bonus * (1 + .15 * f.chain);
  const winding = alive(f.foes).filter(t => t.wind);
  FX.cutIn(ART.portrait(u.hero, 150), u.hero.name, sk.name, u.hero.look.bg, ART.asset('champions', u.hero.id));
  const delay = 520 / f.speed; f.pauseUntil = now() + 1000 / f.speed;
  const foes = alive(f.foes);
  // effects apply now (so the outcome never depends on timers); the visuals land after the cut-in
  if (sk.kind === 'aoe' || sk.kind === 'stun') foes.forEach(t => { dealTo(t, atk * sk.mult, 'f', delay, .2); if (sk.kind === 'stun') t.stun = 1; });
  else if (sk.kind === 'single' && foes[0]) dealTo(focusFoe(), atk * sk.mult, 'f', delay, .3);
  else if (sk.kind === 'crit' && foes.length) dealTo(foes.reduce((a, b) => a.hp < b.hp ? a : b), atk * sk.mult, 'f', delay, .6);
  else if (sk.kind === 'heal') alive(f.heroes).forEach(h => { const v = Math.round(atk * sk.mult); h.hp = Math.min(h.max, h.hp + v); hitFx('h', h.id, '+' + fmt(v), 'heal', delay); });
  else if (sk.kind === 'shield') f.shield = bonus > 1.3 ? 4 : 3;
  else if (sk.kind === 'buff') f.buff = bonus > 1.3 ? 4 : 3;
  // a skill that lands on a charging foe breaks its heavy blow and rallies the squad
  const hitSet = sk.kind === 'aoe' || sk.kind === 'stun' ? winding : sk.kind === 'single' ? winding.filter(t => t === focusFoe() || t.hp <= 0) : sk.kind === 'crit' ? winding.filter(t => t.hp <= 0 || t === foes.reduce((a, b) => a.hp < b.hp ? a : b)) : [];
  hitSet.forEach(t => { t.wind = 0; t.cd = 3; f.breaks++; if (t.hp > 0) hitFx('f', t.id, 'BROKEN!', 'info', delay + 250); });
  if (hitSet.length) { alive(f.heroes).forEach(h => h.en = Math.min(100, h.en + 15)); setTimeout(() => { if (fight === f) { callout('CHARGE BROKEN!', 'brk'); FX.sound('coin'); } }, delay + 250); }
  setTimeout(() => {
    if (!fight) return;
    skillFx(sk.kind); BF.skill(u, sk.kind);
    const big = (els, colors) => els.forEach(el => { const c = FX.centerOf(el); FX.burst(c.x, c.y, { n: 40, shape: 'star', size: 5, speed: 8, colors, ring: colors[0], life: 1 }); });
    const foeEls = [...document.querySelectorAll('#battle .row.foes .unit')], mine = [...document.querySelectorAll('#battle .row.mine .unit:not(.dead)')];
    if (sk.kind === 'aoe' || sk.kind === 'stun') { big(foeEls, sk.kind === 'stun' ? ['#c9b8e8', '#e3c08a', '#fff'] : ['#ffd36b', '#ff7a59', '#fff']); FX.shake($('#battle'), 14, 420); }
    else if (sk.kind === 'single' || sk.kind === 'crit') FX.shake($('#battle'), 12, 360);
    else if (sk.kind === 'shield') big(mine, ['#3fd7c8', '#9ff4ea', '#fff']);
    else if (sk.kind === 'buff') big(mine, ['#ffd36b', '#9b7bff', '#fff']);
    updFight();
  }, delay);
}
function fightLoop() {
  const f = fight; if (!f || f.over) return;
  const t = now(); if (t < f.next || t < f.pauseUntil) return;
  if (!alive(f.foes).length || !alive(f.heroes).length || f.turn > 90 || (f.mode === 'trial' && f.turn >= TRIAL_TURNS)) return endFight(!alive(f.foes).length);
  if (!f.q.length) {
    if (f.started) { if (f.shield) f.shield--; if (f.buff) f.buff--; f.turn++; }
    f.started = true;
    f.q = [...alive(f.heroes).map(u => ['h', u]), ...alive(f.foes).map(u => ['f', u])].sort((a, b) => b[1].spd - a[1].spd + (Math.random() - .5));
    updFight();
  }
  const [side, u] = f.q.shift(); if (u.hp <= 0) return;
  let wait = 330 / f.speed;
  if (side === 'h') {
    if (u.en >= 100 && f.auto) { castSkill(u); wait = 1050 / f.speed; }
    else { fight.cur = u; const tg = focusFoe(); if (tg) { const d = lunge('h', u, tg); dealTo(tg, u.atk * (f.buff ? 1.4 : 1), 'f', d, .12); u.en = Math.min(100, u.en + 22); } }
  } else {
    if (u.stun) { u.stun = 0; hitFx('f', u.id, 'STUNNED', 'info'); }
    else if (!u.wind && --u.cd <= 0) { u.wind = 1; hitFx('f', u.id, 'CHARGING!', 'info'); FX.sound('tick'); wait = 520 / f.speed; }
    else if (u.wind) { u.wind = 0; u.cd = 3; const hs = alive(f.heroes); if (hs.length) { const tank = hs.find(h => h.hero.role === 'Tank'), tg = tank && Math.random() < .6 ? tank : pick(hs), d = lunge('f', u, tg); dealTo(tg, u.atk * 1.9, 'h', d, 0); hitFx('h', tg.id, 'HEAVY BLOW', 'info', d + 120); setTimeout(() => FX.shake($('#battle .bfield'), 12, 300), d); } }
    else { const hs = alive(f.heroes); if (hs.length) { const tank = hs.find(h => h.hero.role === 'Tank'); const tg = tank && Math.random() < .6 ? tank : pick(hs); const d = lunge('f', u, tg); dealTo(tg, u.atk, 'h', d, .08); if (u.max > 3 * f.heroes[0].max) setTimeout(() => FX.shake($('#battle .bfield'), 8, 220), d); } }
  }
  f.next = t + wait; setTimeout(updFight, wait * .8);
}
function endFight(win) {
  const f = fight; if (f.over) return; f.over = true; clearInterval(f.timer); BF.end(win);
  if (f.mode === 'arena') return LIVE.endArena(f, win);
  if (f.mode === 'trial') return endTrial(f);
  const ch = f.ch, n = f.n, idx = (ch - 1) * 6 + n;
  let html, r = {}, stars = 0;
  if (win) {
    const fallen = f.heroes.filter(h => h.hp <= 0).length, first = !S.stages[f.key]; stars = 3 - Math.min(2, fallen);
    S.stages[f.key] = Math.max(S.stages[f.key] || 0, stars); S.stats.stageWins++; S.bestiary ??= {}; f.foes.forEach(x => { S.bestiary[x.kind] = (S.bestiary[x.kind] || 0) + 1; }); META.xp(15); LIVE.on('stage', 1); S.essence += 2 + Math.floor(idx / 3);
    const xp = 100 + idx * 45; f.heroes.forEach(h => heroXP(h.id, xp));
    S.streak = (S.streak || 0) + 1; const sb = Math.min(5, S.streak - 1) * .1; f.streakTxt = S.streak > 1 ? `🔥 Win streak ×${S.streak}${sb ? ` · +${Math.round(sb * 100)}% gold` : ''}` : '';
    r = { gold: Math.round((200 + idx * 120 + (f.perfects || 0) * 40 + (f.breaks || 0) * 60) * (1 + sb)) }; if (first) r.gems = 10 + idx * 2;
    S.stats.perfects = (S.stats.perfects || 0) + (f.perfects || 0); S.stats.breaks = (S.stats.breaks || 0) + (f.breaks || 0);
    const sh = STAGE_SHARD[f.key]; if (sh && (first || Math.random() < .5)) r.shards = { [sh]: first ? 5 : 1 + Math.floor(Math.random() * 2) };
    else if (Math.random() < .3) r.shards = { [pick(HEROES).id]: 1 };
    if (n === 6 && first) r.items = { sp60: 1, vigor: 1 };
    const joiner = first && STORY_JOIN[f.key]; if (joiner) { const hj = S.heroes[joiner] || (S.heroes[joiner] = { lvl: 0, xp: 0, stars: 0, shards: 0 }); if (!hj.stars) { hj.stars = 1; hj.lvl = Math.max(hj.lvl, Math.min(heroCap(), 1 + idx * 2)); } f.joined = joiner; }
    if (n === 6 && first) f.outro = ch;
    give(r);
    const nextKey = n < 6 ? `${ch}-${n + 1}` : ch < CHAPTERS.length ? `${ch + 1}-1` : null;
    const mvp = f.heroes.reduce((a, b) => (b.dmg || 0) > (a.dmg || 0) ? b : a, f.heroes[0]), mvpArt = mvp && ART.asset('champions', mvp.hero.id);
    html = `<div class="res-rays"></div>${mvpArt ? `<div class="mvp"><img src="${mvpArt}" alt=""><span><b>MVP</b>${esc(mvp.name)} · ${fmt(mvp.dmg || 0)} damage</span></div>` : ''}<h2 class="win">Victory</h2>${f.joined ? `<div class="joined">${ART.asset('champions', f.joined) ? `<img class="jfig" src="${ART.asset('champions', f.joined)}" alt="">` : ART.portrait(HERO[f.joined], 64)}<div><small>New hero</small><b>${HERO[f.joined].name} joins your court!</b></div></div>` : ''}<div class="rstars">${[0, 1, 2].map(i => `<span class="${i < stars ? 'on' : ''}" style="--i:${i}">★</span>`).join('')}</div>
      <div class="rheroes">${f.heroes.map(h => `<div>${ART.portrait(h.hero, 54)}<small>Lv ${S.heroes[h.id].lvl}</small><em>+${xp} XP</em></div>`).join('')}</div>
      <div class="rskill"><span><b>${f.perfects || 0}</b>Perfect casts</span><span><b>${f.breaks || 0}</b>Charges broken</span><span><b>${f.bestChain ? '×' + (f.bestChain + 1) : '–'}</b>Best chain</span></div>
      ${f.streakTxt ? `<div class="streak">${f.streakTxt}</div>` : ''}<div class="rloot">${META.rewardHTML(r)}</div>
      <div class="rbtns"><button class="btn" data-act="closefight">Leave</button><button class="btn" data-act="retry">Retry</button>${nextKey ? `<button class="btn gold" data-act="nextstage" data-key="${nextKey}">Next stage ›</button>` : ''}</div>`;
    FX.sound('win'); setTimeout(() => FX.confetti(), 300);
    [0, 1, 2].forEach(i => i < stars && setTimeout(() => FX.sound('coin'), 700 + i * 300));
  } else {
    S.streak = 0; html = `<h2 class="loss">Defeat</h2><p>Your squad was overwhelmed.</p><div class="tips"><p>⬆ Level heroes with Tomes or Tutors in the Hall of Heroes</p><p>★ Raise stars with shards from Trials and the Crown Summon</p><p>⇄ Try a squad with a Tank, a healer and a damage dealer</p></div><div class="rbtns"><button class="btn" data-act="closefight">Leave</button><button class="btn gold" data-act="retry">Retry</button><button class="btn" data-act="sub" data-s="summon">Summon heroes</button></div>`;
    FX.sound('loss');
  }
  const box = document.createElement('div'); box.className = 'result ' + (win ? 'won' : 'lost'); box.innerHTML = html;
  { const kb = ART.keyUrl(win ? 'victory' : 'siege'); if (kb) { box.style.background = `linear-gradient(${win ? '#140f22b3,#05030aeb' : '#05030ad9,#05030af5'}),url(${kb}) center/cover`; box.classList.add('painted'); } }
  setTimeout(() => $('#battle .bfield')?.appendChild(box), win ? 600 : 300);
  if (win && f.joined && STORY.legend && STORY.legend[f.joined]) setTimeout(() => { if (fight === f) playStory(STORY.legend[f.joined], HERO[f.joined].origin || 'A Legend Answers', null); }, 1500);
  save();
}
function leaveFight() { BF.stop(); if (fight) { clearInterval(fight.timer); fight.over = true; } $('#battle').hidden = true; $('#battle').innerHTML = ''; fight = null; FX.setMood(tab === 'world' ? 'world' : 'city'); }

/* ======================= Research tab ======================= */
function renderResearch() {
  if (!S.b.academy) return '<h2>Research</h2><div class="card"><p>Build the <b>Royal Academy</b> (unlocks at Citadel 2) to start research.</p><button class="btn gold" data-act="bld" data-key="academy">Go to Royal Academy</button></div>';
  const tree = name => TECH.filter(t => t.tree === name).map(t => {
    const l = S.tech[t.id] || 0, to = l + 1, done = l >= t.max, c = done ? {} : techCost(t, to), need = techNeed(t, to), lock = S.b.academy < need || (t.req && !S.tech[t.req]);
    return `<div class="tech ${done ? 'done' : ''} ${lock ? 'locked' : ''}"><div><b>${t.name}</b> <span class="muted">${l}/${t.max}</span><p>${t.desc}</p>${done ? '<p class="good">Complete</p>' : `<div class="costs">${costHTML(c)}<span class="cost">${ART.icon('clock', 14)}${fmtT(techTime(t, to))}</span></div>${lock ? `<p class="why">${t.req && !S.tech[t.req] ? 'Requires ' + TECHM[t.req].name : 'Needs Royal Academy ' + need}</p>` : ''}`}</div>${!done && !lock ? `<button class="btn gold" data-act="research" data-id="${t.id}" ${S.rq ? 'disabled' : ''}>Study</button>` : ''}</div>`;
  }).join('');
  return `<h2>Research</h2>${S.rq ? `<div class="card"><b>Studying ${TECHM[S.rq.id].name} ${S.rq.to}</b>${bar(1 - (S.rq.end - now()) / S.rq.total, 'teal')}<button class="btn" data-act="speed" data-kind="r">Speed up · ${fmtT((S.rq.end - now()) / 1000)}</button></div>` : ''}
  <div class="cols"><div><h3>Economy</h3>${tree('Economy')}</div><div><h3>Military</h3>${tree('Military')}</div></div>`;
}

/* ======================= Quests tab ======================= */
function renderQuests() {
  const q = QUESTS[S.quest], ready = q && q.c(S), chest = now() >= S.chestAt;
  const rw = r => Object.entries(r).map(([k, v]) => k === 'items' ? Object.entries(v).map(([i, n]) => `${ART.icon(ITEMS[i].icon, 14)}${n}× ${ITEMS[i].name}`).join(' ') : `${ART.icon(k === 'gems' ? 'gem' : k, 14)}${fmt(v)}`).join(' ');
  return `<h2>Quests</h2>${LIVE.deedsHTML()}${LIVE.eventHTML()}${META.passHTML()}
  <div class="card chest ${chest ? 'ready' : ''}">${ART.icon('chest', 42)}<div><h4>Supply chest</h4><p class="muted">The royal quartermaster sends supplies every 6 hours.</p></div>${chest ? '<button class="btn gold" data-act="chest">Open</button>' : `<span class="muted">${fmtT((S.chestAt - now()) / 1000)}</span>`}</div>
  ${q ? `<div class="card quest ${ready ? 'ready' : ''}"><small>Story quest ${S.quest + 1} / ${QUESTS.length}</small><h4>${q.t}</h4><p>Reward: ${rw(q.r)}</p>${ready ? '<button class="btn gold" data-act="claim">Claim</button>' : '<span class="muted">In progress</span>'}</div>` : '<div class="card"><h4>Every story quest complete. You rule the sands!</h4></div>'}
  <div class="card"><h4>Upcoming</h4>${QUESTS.slice(S.quest + 1, S.quest + 4).map(x => `<p class="muted">· ${x.t}</p>`).join('') || '<p class="muted">—</p>'}</div>
  ${META.achHTML()}<div class="card"><h4>Rankings · Might</h4><ol class="rank">${ranking().map(r => `<li class="${r.me ? 'me' : ''}"><span style="color:${r.color}">■</span> ${esc(r.name)} <b>${fmt(r.m)}</b></li>`).join('')}</ol></div>`;
}
function ranking() {
  const list = S.world.filter(o => o.kind === 'city').map(o => ({ name: o.name, color: o.color, m: troopMight(o.troops) + o.lvl * o.lvl * 400 }));
  list.push({ name: S.name + ' (you)', color: S.color, m: might(), me: true });
  return list.sort((a, b) => b.m - a.m);
}
function claimQuest() { const q = QUESTS[S.quest]; if (!q || !q.c(S)) return; META.grant(q.r, 'Quest reward'); S.quest++; META.xp(40); FX.confetti(); sfx('win'); render(); }
function openChest() { if (now() < S.chestAt) return; S.chestAt = now() + 6 * 3600e3; const r = { gems: 25, items: { [pick(['sp5', 'sp5', 'crate', 'scroll', 'vigor', 'sp60'])]: 1 } }; r[pick(['grain', 'timber', 'stone', 'ore'])] = 2000 + S.b.citadel * 600; give(r, 'Supply chest'); burst(); render(); }

/* ======================= House tab ======================= */
function renderHouse() {
  return `<h2>Order of the Dawn</h2>
  <div class="card house">${ART.emblem(56)}<div><p>Your Alliance: 16 members · Honor <b>${fmt(S.house.honor)}</b> · Helps received <b>${fmt(S.house.helpsGot || 0)}</b></p><p class="muted">${S.b.embassy ? 'Members help your builds and research automatically.' : 'Build the Alliance Embassy (Citadel 4) so members can speed your timers.'}</p></div></div>
  <div class="card"><h4>Help requests (${S.house.requests.length})</h4>${S.house.requests.map(r => `<p>${esc(r.from)} · ${esc(r.what)}</p>`).join('') || '<p class="muted">Nobody needs help right now.</p>'}${S.house.requests.length ? '<button class="btn gold" data-act="helpall">Help all (+10 Honor each)</button>' : ''}</div>
  <div class="card"><h4>Honor shop</h4><div class="btns"><button class="btn" data-act="hshop" data-i="sp5" data-c="60">${ART.icon('clock', 14)} 5-min Hourglass · 60</button><button class="btn" data-act="hshop" data-i="crate" data-c="150">${ART.icon('crate', 14)} Supply Crate · 150</button><button class="btn" data-act="hshop" data-i="scroll" data-c="120">${ART.icon('scroll', 14)} Hero Tome · 120</button></div></div>
  <div class="card chat"><h4>Alliance chat</h4>${S.house.chat.slice(-12).reverse().map(c => `<p><b class="${c.from === 'Herald' ? 'good' : ''}">${esc(c.from)}:</b> ${esc(c.t)}</p>`).join('') || '<p class="muted">Quiet in the hall…</p>'}
  <form data-act="chat" class="chatform"><input name="m" maxlength="80" placeholder="Say something to your Alliance"><button class="btn">Send</button></form></div>`;
}

/* ======================= Bag & shop ======================= */
function renderBag() {
  const own = Object.entries(S.items).filter(([, n]) => n > 0);
  return `<h2>Bag</h2><div class="items">${own.map(([i, n]) => `<div class="item">${ART.icon(ITEMS[i].icon, 34)}<b>${ITEMS[i].name}</b><small>${ITEMS[i].desc}</small><span>×${n}</span>${['shield', 'crate', 'vigor', 'builder', 'gift'].includes(i) ? `<button class="mini" data-act="use" data-i="${i}">Use</button>` : ''}</div>`).join('') || '<p class="muted">Empty.</p>'}</div>
  <h2>Gem shop</h2><p class="muted">Gems are earned by playing: quests, trials, camps and defending your city. No real money.</p><div class="items">${Object.entries(ITEMS).filter(([, d]) => d.gems).map(([i, d]) => `<div class="item">${ART.icon(d.icon, 34)}<b>${d.name}</b><small>${d.desc}</small><button class="mini gold" data-act="buy" data-i="${i}">${ART.icon('gem', 12)} ${d.gems}</button></div>`).join('')}</div>`;
}
function useItem(i) {
  if (!S.items[i]) return;
  if (i === 'shield') { S.shieldUntil = Math.max(now(), S.shieldUntil) + 8 * 3600e3; toast('Aegis Ward raised for 8 hours', 'good'); }
  else if (i === 'crate') { const k = pick(['grain', 'timber', 'stone', 'ore']); S.res[k] += 5000; toast(`+5,000 ${RNAME[k]}`, 'good'); }
  else if (i === 'vigor') { S.vigor += 30; toast('+30 Vigor', 'good'); }
  else if (i === 'builder') { S.builderUntil = Math.max(now(), S.builderUntil) + 24 * 3600e3; toast('A second builder joined for 24h', 'good'); }
  else if (i === 'gift') { const r = pick([{ gems: 10 }, { items: { sp5: 1 } }, { gold: 2500 }, { items: { scroll: 1 } }, { shards: { [pick(HEROES).id]: 2 } }, { ore: 1500 }]); S.items[i]--; give(r, 'Alliance Gift'); render(); return; }
  S.items[i]--; sfx('done'); render();
}

/* ======================= World map (canvas) ======================= */
const cam = { x: 0, y: 0, z: 1 }; let mapSel = null, mapDirty = true;
const TS = 60;
function centerOn(x, y) { const c = $('#map'); cam.x = x * TS * cam.z - c.clientWidth / 2 + TS * cam.z / 2; cam.y = y * TS * cam.z - c.clientHeight / 2 + TS * cam.z / 2; }
// Painted map markers (art/manifest.json "map"): drawn as round medallions with a coloured rim.
const MAPIMG = {};
function medallion(ctx, id, x, y, r, rim) {
  const url = ART.asset('map', id); if (!url) return false;
  let im = MAPIMG[id]; if (!im) { im = MAPIMG[id] = new Image(); im.src = url; }
  if (!im.complete || !im.naturalWidth) return false;
  ctx.save(); ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(x, y + r * .95, r * .8, r * .22, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.closePath(); ctx.clip(); ctx.drawImage(im, x - r, y - r, r * 2, r * 2); ctx.restore();
  ctx.strokeStyle = rim; ctx.lineWidth = Math.max(2, r * .09); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  return true;
}
const NODE_ART = { grain: 'grain', timber: 'timber', stone: 'stonepit', ore: 'ore' }, NODE_RIM = { grain: '#ffd36b', timber: '#7fc46a', stone: '#c9d6e3', ore: '#6fb6ff' };
// Painted scenery (villages, groves, herbs, shrines) scattered deterministically on free land tiles.
function mapSprite(ctx, id, x, y, size) {
  const url = ART.asset('map', id); if (!url) return false;
  let im = MAPIMG[id]; if (!im) { im = MAPIMG[id] = new Image(); im.onload = () => { mapDirty = true; }; im.src = url; }
  if (!im.complete || !im.naturalWidth) return false;
  ctx.drawImage(im, x - size / 2, y - size / 2, size, size); return true;
}
function decorAt(x, y) { const h = ((x * 73856093) ^ (y * 19349663) ^ 0x5bd1e995) >>> 0; const r = h % 1000; return r < 6 ? 'shrine' : r < 28 ? 'village' : r < 75 ? 'herbs' : r < 150 ? 'trees' : null; }
// Painted world map: ground textures per region, then mountain and forest sprites, baked once into the terrain canvas.
let TEXD = 0;
function texturize() {
  if (TEXD || !TERR || !ART.asset('ground', 'grass')) return; TEXD = 1;
  const want = { grass: ['ground', 'grass'], sand: ['ground', 'sand'], snow: ['ground', 'snow'], stone: ['ground', 'stone'], trees: ['map', 'trees'], mount: ['map', 'mount'], snowmount: ['map', 'snowmount'] }, im = {}; let left = 0;
  const go = () => {
    const T = TERR, cv = T.canvas, ctx = cv.getContext('2d'), mask = document.createElement('canvas'), layer = document.createElement('canvas'); mask.width = W; mask.height = H; layer.width = cv.width; layer.height = cv.height;
    const mx = mask.getContext('2d'), lx = layer.getContext('2d'), TEX = { frostmark: 'snow', amber: 'sand', sunveldt: 'sand', ash: 'stone', sunspire: 'sand' };
    for (const k of ['grass', 'sand', 'snow', 'stone']) {
      if (!im[k]) continue; const d = mx.createImageData(W, H);
      for (let i = 0; i < W * H; i++) { const t = T.water[i] ? null : T.mount[i] && T.region[i] !== 'frostmark' ? 'stone' : (TEX[T.region[i]] || 'grass'); if (t === k) d.data[i * 4 + 3] = T.river[i] ? 120 : 255; }
      mx.putImageData(d, 0, 0); lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, layer.width, layer.height); lx.imageSmoothingEnabled = true; lx.drawImage(mask, -TB / 2, -TB / 2, (W + 1) * TB, (H + 1) * TB);
      lx.globalCompositeOperation = 'source-in'; const p = lx.createPattern(im[k], 'repeat'); p.setTransform(new DOMMatrix().scale(.42)); lx.fillStyle = p; lx.fillRect(0, 0, layer.width, layer.height);
      ctx.globalAlpha = k === 'grass' ? .6 : .68; ctx.drawImage(layer, 0, 0); ctx.globalAlpha = 1;
    }
    const r = rng(S.seed + 31);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = tIdx(x, y), jx = (r() - .5) * TB * .3, jy = (r() - .5) * TB * .3;
      if (Math.abs(x - CX) < 3 && Math.abs(y - CY) < 3) continue;
      if (T.mount[i]) { const m = (T.region[i] === 'frostmark' || T.h[i] > .82) && im.snowmount ? im.snowmount : im.mount; if (m) { const z = TB * (1.5 + r() * .5); ctx.drawImage(m, x * TB + TB / 2 - z / 2 + jx, y * TB + TB / 2 - z * .62 + jy, z, z); } }
      else if (T.forest[i] && im.trees && r() < .75) { const z = TB * (1.05 + r() * .4); ctx.drawImage(im.trees, x * TB + TB / 2 - z / 2 + jx, y * TB + TB / 2 - z * .6 + jy, z, z); }
    }
    mapDirty = true;
  };
  for (const [k, [kind, id]] of Object.entries(want)) { const u = ART.asset(kind, id); if (!u) continue; left++; const g = new Image(); g.onload = () => { im[k] = g; if (!--left) go(); }; g.onerror = () => { if (!--left) go(); }; g.src = u; }
}
function cityMark(ctx, x, y, s, color) {
  ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(x, y + s * .3, s * .46, s * .16, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, s * .07); ctx.beginPath(); ctx.ellipse(x, y + s * .28, s * .46, s * .17, 0, 0, 7); ctx.stroke();
  return mapSprite(ctx, 'city', x, y - s * .08, s * 1.05);
}
function drawMap() {
  texturize();
  const c = $('#map'); if (!c || c.offsetParent === null || !TERR) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
  if (c.width !== w * dpr || c.height !== h * dpr) { c.width = w * dpr; c.height = h * dpr; }
  const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const s = TS * cam.z, t = now();
  ctx.fillStyle = '#1f4a6a'; ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'low';
  { const k = TB / s, sx = Math.max(0, cam.x * k), sy = Math.max(0, cam.y * k), sw = Math.min(TERR.canvas.width - sx, (w + Math.min(0, cam.x)) * k), sh = Math.min(TERR.canvas.height - sy, (h + Math.min(0, cam.y)) * k); if (sw > 0 && sh > 0) ctx.drawImage(TERR.canvas, sx, sy, sw, sh, Math.max(0, -cam.x), Math.max(0, -cam.y), sw / k, sh / k); }
  // animated water shimmer
  ctx.globalAlpha = .12; ctx.fillStyle = '#fff';
  const x0 = Math.max(0, Math.floor(cam.x / s)), y0 = Math.max(0, Math.floor(cam.y / s)), x1 = Math.min(W, Math.ceil((cam.x + w) / s)), y1 = Math.min(H, Math.ceil((cam.y + h) / s));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (TERR.water[tIdx(x, y)] && ((x * 7 + y * 13 + Math.floor(t / 900)) % 11 === 0)) ctx.fillRect(x * s - cam.x + s * .2, y * s - cam.y + s * .5, s * .3, Math.max(1, s * .03));
  ctx.globalAlpha = 1;
  const label = (txt, x, y, col = '#140f22d9', size = 11) => { ctx.font = `800 ${Math.max(10, size * cam.z)}px Cairo,system-ui,sans-serif`; const tw = ctx.measureText(txt).width + 12; ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - tw / 2, y - 9 * cam.z - 1, tw, 17 * cam.z + 3, 8); ctx.fill(); ctx.fillStyle = '#f8eedb'; ctx.textAlign = 'center'; ctx.fillText(txt, x, y + 4 * cam.z); };
  // marches
  for (const m of S.marches) {
    const a = { x: (S.home.x + .5) * s - cam.x, y: (S.home.y + .5) * s - cam.y }, b = { x: (m.tx + .5) * s - cam.x, y: (m.ty + .5) * s - cam.y };
    ctx.strokeStyle = m.kind === 'attack' ? '#ff5e3a' : m.kind === 'gather' ? '#3fd7c8' : '#c9d6e3'; ctx.setLineDash([8, 7]); ctx.lineDashOffset = -t / 40; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
    let p = 1; if (m.state === 'out') p = (t - m.start) / (m.arrive - m.start); else if (m.state === 'back') p = 1 - (t - m.bstart) / (m.back - m.bstart);
    p = clamp(p, 0, 1); const mx = a.x + (b.x - a.x) * p, my = a.y + (b.y - a.y) * p;
    const rider = m.kind !== 'attack' || Object.keys(m.troops || {}).some(k => k.startsWith('cav')), im = mimg(ART.asset('army', rider ? 'cav' : 'foot'));
    if (im && m.state !== 'gather') {
      const hh = Math.max(30, s * .62), ww = hh * im.naturalWidth / im.naturalHeight, flip = (b.x < a.x) !== (m.state === 'back'), n = m.kind === 'attack' ? 3 : 1;
      for (let k = n - 1; k >= 0; k--) { const ox = (k - (n - 1) / 2) * hh * .5, oy = (k % 2) * hh * .16, bob = Math.abs(Math.sin(t / 110 + k * 1.7)) * hh * .08; ctx.fillStyle = '#0005'; ctx.beginPath(); ctx.ellipse(mx + ox, my + oy + hh * .42, hh * .32, hh * .08, 0, 0, 7); ctx.fill(); ctx.save(); ctx.translate(mx + ox, my + oy - bob); if (flip) ctx.scale(-1, 1); ctx.drawImage(im, -ww / 2, -hh * .58, ww, hh); ctx.restore(); }
      ctx.fillStyle = S.color; ctx.strokeStyle = '#140f22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, my - hh * .78, 5, 0, 7); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = '#140f22'; ctx.beginPath(); ctx.arc(mx, my, 9 * cam.z + 3, 0, 7); ctx.fill(); ctx.fillStyle = S.color; ctx.beginPath(); ctx.arc(mx, my, 7 * cam.z + 2, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.max(9, 10 * cam.z)}px Cairo,sans-serif`; ctx.textAlign = 'center'; ctx.fillText(m.kind === 'gather' ? '⛏' : m.kind === 'attack' ? '⚔' : '👁', mx, my + 4 * cam.z);
    }
  }
  if (S.incoming) { const o = S.world.find(q => q.id === S.incoming.from); if (o) { const p = clamp(1 - (S.incoming.arrive - t) / ((60 + S.b.tower * 15) * 1000), 0, 1); const a = { x: (o.x + .5) * s - cam.x, y: (o.y + .5) * s - cam.y }, b = { x: (S.home.x + .5) * s - cam.x, y: (S.home.y + .5) * s - cam.y }; ctx.strokeStyle = '#ff2b2b'; ctx.lineWidth = 3; ctx.setLineDash([10, 6]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#ff2b2b'; ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p, 9, 0, 7); ctx.fill(); } }
  if (cam.z > .45 && ART.asset('map', 'trees')) {
    const occ = new Set(); for (const o of S.world) if (!o.dead) occ.add(o.x + ',' + o.y); occ.add(S.home.x + ',' + S.home.y);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const d = decorAt(x, y); if (!d || !isLand(x, y) || !seen(x, y) || occ.has(x + ',' + y)) continue; mapSprite(ctx, d, (x + .5) * s - cam.x, (y + .5) * s - cam.y, s * (d === 'village' || d === 'shrine' ? .95 : .8)); }
  }
  // objects (only where explored)
  for (const o of S.world) {
    if (o.dead || o.x < x0 - 2 || o.x > x1 + 2 || o.y < y0 - 2 || o.y > y1 + 2 || !seen(o.x, o.y)) continue;
    const px = (o.x + .5) * s - cam.x, py = (o.y + .5) * s - cam.y;
    if (o.kind === 'node') { if (!medallion(ctx, NODE_ART[o.res], px, py, s * .36, NODE_RIM[o.res] || '#ffd36b')) ART.mapPaint.node(ctx, px, py, s, o.res); if (cam.z > .95) label('Lv ' + o.lvl, px, py + s * .42, '#140f22b8', 10); }
    else if (o.kind === 'camp') { if (!medallion(ctx, 'camp', px, py, s * .42, '#ff5e3a')) ART.mapPaint.camp(ctx, px, py, s, o.lvl); if (cam.z > .7) label('Outpost ' + o.lvl, px, py + s * .42, '#6a1f1fe0', 10); }
    else if (o.kind === 'city') { if (!cityMark(ctx, px, py, s * 1.15, o.color)) ART.mapPaint.city(ctx, px, py, s * 1.15, o.color, o.realm); if (cam.z > .4) label(o.name, px, py + s * .5, '#140f22e0'); }
    else if (o.kind === 'chest') { const im = mimg(ART.asset('icons', 'chest')), bob = Math.sin(t / 300 + o.id) * s * .04, pu = .5 + Math.sin(t / 250 + o.id) * .5; ctx.strokeStyle = `rgba(255,211,107,${.35 + pu * .5})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(px, py + s * .22, s * (.3 + pu * .06), s * (.12 + pu * .02), 0, 0, 7); ctx.stroke(); if (im) ctx.drawImage(im, px - s * .3, py - s * .36 + bob, s * .6, s * .6); else { ctx.fillStyle = '#e8a33d'; ctx.fillRect(px - s * .2, py - s * .15, s * .4, s * .3); } if (cam.z > .7) label('Treasure', px, py + s * .44, '#7a4a12e6', 10); }
    else if (o.kind === 'merchant') { const im = mimg(ART.asset('landmark', 'bazaar')); if (im) { const ww = s * 1.2, hh = ww * im.naturalHeight / im.naturalWidth; ctx.drawImage(im, px - ww / 2, py - hh * .62, ww, hh); } if (cam.z > .5) label('Merchant', px, py + s * .5, '#1c6f73e6', 10); }
    else if (o.kind === 'boss') { LIVE.drawBoss(ctx, px, py, s, o, t); label('World Boss · Lv ' + o.lvl, px, py + s * .7, '#7a1f1ae6', 11); }
    else if (o.kind === 'throne') { if (!medallion(ctx, 'throne', px, py - s * .2, s * 1.15, '#ffd36b')) ART.mapPaint.throne(ctx, px, py, s * 1.3, S.throne); label(S.throne ? 'Sunspire Throne · yours' : 'The Sunspire Throne', px, py + s * 1.15, '#5a3a8ae6', 12); }
  }
  const hx = (S.home.x + .5) * s - cam.x, hy = (S.home.y + .5) * s - cam.y;
  if (S.shieldUntil > t) { ctx.fillStyle = '#3fd7c826'; ctx.strokeStyle = '#3fd7c8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, s * .8 + Math.sin(t / 400) * 2, 0, 7); ctx.fill(); ctx.stroke(); }
  if (!cityMark(ctx, hx, hy, s * 1.45, S.color)) ART.mapPaint.city(ctx, hx, hy, s * 1.3, S.color, S.realm); label(S.name + ' (you)', hx, hy + s * .58, '#1c5a8ae6', 12);
  // battle flashes where a march just struck or a chest was opened
  for (let i = mapFx.length - 1; i >= 0; i--) { const f = mapFx[i], p = (t - f.t) / 1400; if (p >= 1) { mapFx.splice(i, 1); continue; } const px = (f.x + .5) * s - cam.x, py = (f.y + .5) * s - cam.y; ctx.strokeStyle = f.win ? `rgba(255,211,107,${1 - p})` : `rgba(255,94,58,${1 - p})`; ctx.lineWidth = 6 * (1 - p) + 1; ctx.beginPath(); ctx.arc(px, py, s * (.3 + p * 1.6), 0, 7); ctx.stroke(); for (let k = 0; k < 10; k++) { const a = k * .628 + f.t % 6, r = s * p * 1.5; ctx.fillStyle = f.win ? `rgba(255,240,180,${1 - p})` : `rgba(255,140,90,${1 - p})`; ctx.beginPath(); ctx.arc(px + Math.cos(a) * r, py + Math.sin(a) * r - Math.sin(p * 3.14) * s * .5, 3 * (1 - p) + 1, 0, 7); ctx.fill(); } }
  // drifting clouds give the map depth
  for (let i = 0; i < 7; i++) { const span = W * s + 600, cx = ((i * 977 + t * (.008 + i * .0015) * cam.z * 4) % span) - 300 - cam.x, cy = ((i * 613) % (H * s)) - cam.y, r = s * (2.2 + (i % 3)); if (cx < -r || cx > w + r || cy < -r || cy > h + r) continue; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,255,255,.2)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * .55, 0, 0, 7); ctx.fill(); }
  // fog of war
  { let hidden = x0 === 0 || y0 === 0 || x1 === W || y1 === H; for (let y = Math.max(0, y0 - 1); y < Math.min(H, y1 + 1) && !hidden; y++) for (let x = Math.max(0, x0 - 1); x < Math.min(W, x1 + 1); x++) if (!seen(x, y)) { hidden = true; break; }
    if (hidden) { ctx.save(); ctx.translate(-cam.x, -cam.y); ctx.drawImage(fogCanvas(), -s, -s, (W + 2) * s, (H + 2) * s); ctx.restore(); } }
  // realm names
  ctx.textAlign = 'center';
  for (const [k, [rx, ry]] of Object.entries(REGION_SEEDS)) { if (k === 'sunspire') continue; const px = (rx + .5) * s - cam.x, py = (ry - 1.2) * s - cam.y; if (px < -200 || px > w + 200 || py < -60 || py > h + 60) continue; ctx.font = `900 ${Math.max(13, 22 * cam.z)}px Cinzel,Georgia,serif`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,15,34,.6)'; ctx.strokeText(REGION_NAME[k].toUpperCase(), px, py); ctx.fillStyle = k === 'ash' ? 'rgba(255,140,90,.85)' : 'rgba(255,241,196,.88)'; ctx.fillText(REGION_NAME[k].toUpperCase(), px, py); }
  if (mapSel) { ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 3; ctx.strokeRect(mapSel.x * s - cam.x + 2, mapSel.y * s - cam.y + 2, s - 4, s - 4); }
  // minimap
  const mm = Math.min(120, w * .28), k2 = mm / W, ox = w - mm - 10, oy = 10;
  if (!mmCv || mmCv.width !== Math.round(mm * dpr) || t - mmAt > 2500) { mmCv = mmCv || document.createElement('canvas'); mmCv.width = mmCv.height = Math.round(mm * dpr); const mc = mmCv.getContext('2d'); mc.drawImage(TERR.canvas, 0, 0, mmCv.width, mmCv.height); const kk = mmCv.width / W; mc.drawImage(fogCanvas(), -kk, -kk, mmCv.width + 2 * kk, mmCv.height + 2 * kk); mmAt = t; }
  ctx.fillStyle = '#140f22d9'; ctx.fillRect(ox - 3, oy - 3, mm + 6, mm + 6); ctx.drawImage(mmCv, ox, oy, mm, mm);
  for (const o of S.world) { if (o.dead || !seen(o.x, o.y) || o.kind === 'node') continue; ctx.fillStyle = o.kind === 'city' ? o.color : o.kind === 'camp' ? '#ff5e3a' : '#ffd36b'; ctx.fillRect(ox + o.x * k2 - 1, oy + o.y * k2 - 1, 3, 3); }
  ctx.fillStyle = '#fff'; ctx.fillRect(ox + S.home.x * k2 - 2, oy + S.home.y * k2 - 2, 5, 5);
  ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 1.2; ctx.strokeRect(ox + cam.x / s * k2, oy + cam.y / s * k2, w / s * k2, h / s * k2);
}
let mapLast = 0, mapBusy = false, mmCv = null, mmAt = 0;
function mapLoop(ts) { if (tab === 'world') { if (mapBusy || !ts || ts - mapLast > 30) { mapLast = ts || 0; drawMap(); } requestAnimationFrame(mapLoop); } }
function initMapInput() {
  const c = $('#map'); let drag = null, moved = false, pinch = null;
  const pts = new Map();
  c.addEventListener('pointerdown', e => { mapBusy = true; c.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 1) { drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y }; moved = false; } else if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z }; } });
  c.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; zoomAt(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2); moved = true; return; }
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 6) moved = true; cam.x = drag.cx - dx; cam.y = drag.cy - dy; clampCam(); }
  });
  const up = e => { pts.delete(e.pointerId); if (!pts.size) mapBusy = false; if (pts.size < 2) pinch = null; if (!pts.size) { if (drag && !moved) mapClick(e); drag = null; } };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  c.addEventListener('wheel', e => { e.preventDefault(); zoomAt(cam.z * (e.deltaY < 0 ? 1.12 : .89), e.clientX, e.clientY); }, { passive: false });
}
function zoomAt(z, sx, sy) { const c = $('#map').getBoundingClientRect(); const px = sx - c.left, py = sy - c.top; const wx = (cam.x + px) / cam.z, wy = (cam.y + py) / cam.z; cam.z = clamp(z, .22, 1.8); cam.x = wx * cam.z - px; cam.y = wy * cam.z - py; clampCam(); }
function clampCam() { const c = $('#map'), s = TS * cam.z; cam.x = clamp(cam.x, -c.clientWidth / 2, W * s - c.clientWidth / 2); cam.y = clamp(cam.y, -c.clientHeight / 2, H * s - c.clientHeight / 2); }
function mapClick(e) {
  const r = $('#map').getBoundingClientRect(), s = TS * cam.z, x = Math.floor((e.clientX - r.left + cam.x) / s), y = Math.floor((e.clientY - r.top + cam.y) / s);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  mapSel = { x, y }; sfx('click');
  const mm = Math.min(120, r.width * .28); if (e.clientX - r.left > r.width - mm - 12 && e.clientY - r.top < mm + 14) { const k = mm / W; centerOn((e.clientX - r.left - (r.width - mm - 10)) / k, (e.clientY - r.top - 10) / k); clampCam(); mapSel = null; return; }
  if (x === S.home.x && y === S.home.y) return openTab('city');
  const reg = REGION_NAME[regionAt(x, y)];
  if (!seen(x, y)) return openSheet('Uncharted lands', `<p class="muted">${reg} · (${x}, ${y}) · ${dist(S.home, { x, y }).toFixed(1)} leagues away</p><p>The mists hide what lies here. Send scouts to chart the land and reveal outposts, resources and rival lords.</p><button class="btn gold" data-act="explore" data-x="${x}" data-y="${y}">Explore (${ART.icon('gold', 13)} ${fmt(exploreCost(x, y))})</button>`);
  const o = S.world.find(q => !q.dead && (q.kind === 'throne' ? Math.abs(q.x - x) <= 1 && Math.abs(q.y - y) <= 1 : q.x === x && q.y === y));
  if (!o) { const T = TERR.water[tIdx(x, y)] ? 'Open water' : TERR.mount[tIdx(x, y)] ? 'Mountains' : TERR.forest[tIdx(x, y)] ? 'Forest' : 'Open land'; return openSheet(`${T} · ${reg}`, `<p class="muted">(${x}, ${y}) · ${dist(S.home, { x, y }).toFixed(1)} leagues from your city</p><p>${REALMS[regionAt(x, y)] ? REALMS[regionAt(x, y)].desc : regionAt(x, y) === 'ash' ? 'Scorched earth where the Hollow King first rose. Ashen outposts gather here in force.' : 'The golden heart of Aeloria.'}</p>`); }
  openTile(o);
}
const exploreCost = (x, y) => Math.round(100 + dist(S.home, { x, y }) * 20);
function explore(x, y) {
  if (S.marches.length >= maxMarches()) return toast('All march slots are busy', 'bad');
  const c = { gold: exploreCost(x, y) }; if (!afford(c)) return toast('Not enough Gold', 'bad'); pay(c);
  sendMarch({ id: 0, x, y }, 'explore', {});
}
function openTile(o) {
  if (o.kind === 'boss') return openSheet('World Boss · Ashen Colossus', LIVE.bossHTML(o));
  if (o.kind === 'chest') return openSheet('Lost treasure', `<p class="muted">Coordinates (${o.x}, ${o.y}) · ${dist(S.home, o).toFixed(1)} leagues · ride ≈ ${fmtT(travelMs(o, {}) * .5 / 1000)}</p><div class="bhead">${ART.icon('chest', 60)}<div><p><b>An unopened chest</b></p><p class="muted">Send riders to bring it home: Gold, resources and sometimes gems, hourglasses or hero shards. Farther chests hold more. No troops needed.</p></div></div><button class="btn gold" data-act="collect" data-id="${o.id}">Send riders</button>`);
  if (o.kind === 'merchant') return openSheet('Wandering merchant', `<p class="muted">Coordinates (${o.x}, ${o.y})</p><div class="bhead"><img src="${ART.asset('landmark', 'bazaar')}" alt="" style="width:92px;height:auto"><div><p><b>A caravan of the Grand Bazaar</b></p><p class="muted">Trade Gold for grain, timber, stone, iron and supplies, and take your free daily spin of the Wheel of Fortune.</p></div></div><button class="btn gold" data-act="sub" data-s="market">Visit the Market</button>`);
  const d = dist(S.home, o), eta = fmtT(travelMs(o, {}) / 1000);
  let html = `<p class="muted">Coordinates (${o.x}, ${o.y}) · ${d.toFixed(1)} leagues · march ≈ ${eta}</p>`;
  if (o.kind === 'node') {
    html += `<div class="bhead">${ART.icon(o.res, 60)}<div><p><b>Level ${o.lvl} ${RNAME[o.res]} site</b></p><p>Remaining: ${fmt(o.amount)}</p><p class="muted">Send troops to gather. Cavalry carry the most.</p></div></div>
    <button class="btn gold" data-act="sendform" data-id="${o.id}" data-kind="gather">Gather</button>`;
  } else if (o.kind === 'camp') {
    html += `<div class="bhead">${ART.enemy('raider', 70)}<div><p><b>Ashen outpost · level ${o.lvl}</b></p><p>Guards: ${troopsHTML(o.troops)}</p><p class="muted">The Hollow King's soldiers hold this ground. Destroy the outpost for Gold, resources, Alliance gifts and hero shards.</p></div></div>
    <button class="btn gold" data-act="sendform" data-id="${o.id}" data-kind="attack">Attack</button>`;
  } else if (o.kind === 'city') {
    html += `<div class="bhead"><svg viewBox="0 0 100 100" width="64" height="64"><rect width="100" height="100" rx="16" fill="${o.color}"/><path d="M20 20h60v40c0 14-14 22-30 28-16-6-30-14-30-28z" fill="#140f22" opacity=".85"/><g transform="translate(20 22) scale(.6)">${ART.crownPath('#8a8590', '#2a2228')}</g></svg><div><p><b>${esc(o.name)}</b> · ${REALMS[o.realm].name} · Citadel ${o.lvl}</p><p>Might ≈ ${fmt(troopMight(o.troops) + o.lvl * o.lvl * 400)}</p><p class="muted">An Ash-sworn lord who bent the knee to the Hollow King. Scout first, then strike when their army is weaker than yours.</p></div></div>
    <div class="btns"><button class="btn" data-act="scout" data-id="${o.id}">Scout (${ART.icon('gold', 13)} ${fmt(200 * o.lvl)})</button><button class="btn gold" data-act="sendform" data-id="${o.id}" data-kind="attack">Attack</button></div>`;
  } else if (o.kind === 'throne') {
    html += `<div class="bhead"><div style="width:90px;height:90px;flex:none">${ART.emblem(90)}</div><div><p><b>The Sunspire Throne</b></p><p>${S.throne ? 'Held by you, Sovereign of Aeloria.' : `Garrison: ${troopsHTML(o.troops)}`}</p><p class="muted">Seat of the Sunspire Crown, held by the Hollow King's elite guard. Its garrison is vast; wear it down with many attacks.</p></div></div>
    ${S.throne ? '' : `<button class="btn gold" data-act="sendform" data-id="${o.id}" data-kind="attack">Attack</button>`}`;
  }
  openSheet(o.kind === 'city' ? esc(o.name) : o.kind === 'node' ? `${RNAME[o.res]} site` : o.kind === 'camp' ? 'Ashen outpost' : 'Sunspire Throne', html);
}
function scout(id) {
  const o = S.world.find(w => w.id === id), c = { gold: 200 * o.lvl }; if (!afford(c)) return toast('Not enough Gold', 'bad');
  if (S.marches.length >= maxMarches()) return toast('All march slots are busy', 'bad');
  pay(c); sendMarch(o, 'scout', {});
}
let sendSel = {}; const mapFind = {};
function openSend(id, kind) {
  const o = S.world.find(w => w.id === id); if (!o) return;
  const home = Object.entries(S.troops).filter(([, n]) => n > 0);
  if (!home.length) return openSheet('No troops', '<p>Your army is empty. Train troops in the Barracks.</p><button class="btn gold" data-act="bld" data-key="barracks">Barracks</button>');
  const capN = marchCap(); sendSel = {}; let left = capN;
  // sensible default: for gather prefer riders; for attack send a balanced share
  for (const [k, n] of home.sort((a, b) => kind === 'gather' ? TROOP[tparse(b[0])[0]].load - TROOP[tparse(a[0])[0]].load : b[1] - a[1])) { const t = Math.min(n, left); sendSel[k] = t; left -= t; }
  openSheet(`${kind === 'gather' ? 'Gather' : 'Attack'} · send troops`, `<p class="muted">Max march size ${fmt(capN)} (raise Barracks and Hall of Heroes). Travel ≈ ${fmtT(travelMs(o, sendSel) / 1000)}</p>
  ${home.map(([k, n]) => { const [t, ti] = tparse(k); return `<label class="slider">${ART.troop(t, ti, 32)} ${TROOP[t].name} ${'I'.repeat(ti)}<input type="range" min="0" max="${n}" value="${sendSel[k] || 0}" data-act="sendn" data-k="${k}"><b id="sn-${k}">${sendSel[k] || 0}</b></label>`; }).join('')}
  <p id="sendInfo"></p><button class="btn gold" data-act="go" data-id="${id}" data-kind="${kind}">March!</button>`);
  sendInfo(o, kind);
}
function sendInfo(o, kind) {
  const n = troopCount(sendSel), el = $('#sendInfo'); if (!el) return;
  el.innerHTML = kind === 'gather' ? `Troops ${fmt(n)} / ${fmt(marchCap())} · Load ${fmt(loadOf(sendSel))}` : `Troops ${fmt(n)} / ${fmt(marchCap())} · Might ${fmt(troopMight(sendSel))} vs ≈ ${fmt(troopMight(o.troops))}`;
  el.className = n > marchCap() ? 'why' : '';
}
function openMarch(id) {
  const m = S.marches.find(x => x.id === id); if (!m) return;
  openSheet('March', `<p>${{ gather: 'Gathering', attack: 'Attack', scout: 'Scout', explore: 'Exploring', collect: 'Treasure run' }[m.kind]} at (${m.tx}, ${m.ty}) · ${m.state}</p>${troopsHTML(m.troops)}${Object.keys(m.loot).length ? `<p>Carrying: ${Object.entries(m.loot).map(([k, v]) => ART.icon(k, 14) + fmt(v)).join(' ')}</p>` : ''}
  ${m.state !== 'back' ? `<button class="btn" data-act="recall" data-id="${m.id}">Recall</button>` : ''}<button class="btn" data-act="goto" data-x="${m.tx}" data-y="${m.ty}">Show on map</button>`);
}

/* ======================= Mail ======================= */
function openMail() {
  S.unread = 0; renderHud();
  openSheet('Reports', S.reports.length ? S.reports.map((r, i) => `<details class="rep ${r.kind}" ${i === 0 ? 'open' : ''}><summary><b>${r.title}</b><small>${new Date(r.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></summary>${r.body}</details>`).join('') : '<p class="muted">No reports yet.</p>', true);
}

/* ======================= tabs & render ======================= */
let tab = 'city';
function openTab(t) {
  tab = t; closeSheet(); document.querySelectorAll('.speech').forEach(x => x.remove());
  document.querySelectorAll('nav.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t || (b.id === 'navMore' && ['army', 'research', 'house', 'arena', 'bag'].includes(t))));
  FX.setMood(t === 'world' ? 'world' : 'city'); $('#cityUi').hidden = t !== 'city';
  $('#cityView').hidden = t !== 'city' || use3D(); $('#city3d').hidden = t !== 'city' || !use3D(); if (window.CITY3D && CITY3D.ok) CITY3D.setActive(t === 'city' && use3D()); $('#worldView').hidden = t !== 'world'; $('#panel').hidden = t === 'city' || t === 'world'; $('#main').classList.toggle('panel-open', t !== 'city' && t !== 'world');
  if (t === 'world') { ensureExtras(); if (!openTab.centered) { centerOn(S.home.x, S.home.y); openTab.centered = true; } requestAnimationFrame(mapLoop); }
  render();
}
function render(auto) {
  renderHud(); renderQueues();
  if (tab === 'city') renderCity();
  const P = { army: renderArmy, heroes: renderHeroes, research: renderResearch, quests: renderQuests, house: renderHouse, bag: renderBag, store: META.renderStore, arena: LIVE.renderArena }[tab];
  if (!P) return;
  // Only touch the panel when its content really changed, never under a finger, and keep every scroll position.
  const pn = $('#panel'), html = P(), same = pn._tab === tab; if (same && pn._html === html) return; if (auto && (pDown || META.busy())) return;
  const y = pn.scrollTop, sx = {}, cnt = {}, keyOf = e => { const c = e.className || e.tagName; cnt[c] = (cnt[c] || 0) + 1; return c + '#' + cnt[c]; };
  if (same) pn.querySelectorAll('*').forEach(e => { const k = keyOf(e); if (e.scrollLeft > 0) sx[k] = e.scrollLeft; });
  pn.innerHTML = html; pn._html = html; pn._tab = tab; pn.scrollTop = same ? y : 0;
  for (const k in cnt) delete cnt[k];
  if (same) pn.querySelectorAll('*').forEach(e => { const k = keyOf(e); if (sx[k]) e.scrollLeft = sx[k]; });
  else pn.querySelectorAll('.ptrack').forEach(tr => { const r = tr.querySelector('.ptier.ready') || tr.querySelector('.ptier:not(.got)'); if (r) tr.scrollLeft = r.offsetLeft - tr.offsetLeft - 24; });
}
let pDown = false; addEventListener('pointerdown', () => { pDown = true; }, true); for (const ev of ['pointerup', 'pointercancel']) addEventListener(ev, () => setTimeout(() => { pDown = false; }, 350), true);
let caravan = null;
function caravanSvg() { const u = caravan && ART.asset('landmark', 'caravan'); return u ? `<g class="caravan" data-act="caravan"><g class="cv-move"><circle r="74" cy="-52" fill="url(#lglow)"/><image href="${u}" x="-72" y="-124" width="144" height="148"/><g class="cv-tap" transform="translate(0 -142)"><rect x="-34" y="-13" width="68" height="24" rx="12" fill="#ffd36b" stroke="#7a4a12" stroke-width="2"/><text y="5" text-anchor="middle" style="fill:#2c1604;font-weight:900;font-size:14px">TAP!</text></g></g></g>` : ''; }
// Scenery scattered over the wider realm (deterministic per realm), keeping clear of the walls, plots and landmarks.
function cityScenery() {
  if (cityScenery.r === S.realm && cityScenery.h) return cityScenery.h; let seed = 7 + S.realm.length * 131; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const keep = [...FIELD_POS, ...Object.values(LANDMARKS)], out = [], snow = S.realm === 'frostmark';
  for (let i = 0; i < 400 && out.length < 54; i++) {
    const x = -400 + rnd() * 1800, y = -270 + rnd() * 1240, inCore = x > -150 && x < 1150 && y > -90 && y < 800; if (inCore || keep.some(([kx, ky]) => Math.hypot(kx - x, (ky - y) * 1.3) < 150) || out.some(o => Math.hypot(o.x - x, o.y - y) < 95)) continue;
    const r = rnd(), edge = y < -150 || x < -330 || x > 1330, k = edge && r < .5 ? (snow ? 'snowmount' : 'mount') : r < .12 ? 'village' : r < .2 ? 'shrine' : r < .42 ? 'herbs' : 'trees', z = { mount: 230, snowmount: 230, village: 130, shrine: 84, herbs: 70, trees: 120 }[k] * (.85 + rnd() * .3);
    const u = ART.asset('map', k); if (u) out.push({ x, y, h: `<image href="${u}" x="${(x - z / 2).toFixed(0)}" y="${(y - z * .8).toFixed(0)}" width="${z.toFixed(0)}" height="${z.toFixed(0)}"/>` });
  }
  cityScenery.r = S.realm; return cityScenery.h = `<g id="cityScene" pointer-events="none">${out.sort((a, b) => a.y - b.y).map(o => o.h).join('')}<rect x="-420" y="-300" width="1840" height="1288" fill="url(#cvig)"/></g>`;
}

/* ======================= events ======================= */
function onAct(e) {
  const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act, d = el.dataset;
  if (['tn', 'sendn', 'auto'].includes(a) && e.type === 'click') return;
  switch (a) {
    case 'tab': openTab(d.tab); break;
    case 'bld': openBuilding(d.key); break;
    case 'field': openField(+d.i); break;
    case 'lockedfield': toast(`Raise the Citadel to unlock more plots`); break;
    case 'buildfield': startUpgrade('f' + d.i, d.t); break;
    case 'upgrade': startUpgrade(d.key); break;
    case 'upnow': upgradeNow(d.key); break;
    case 'speed': openSpeed(d.kind, d.key); break;
    case 'usesp': speedUp(d.kind, d.key || undefined, d.i); break;
    case 'tsel': trainSel.t = d.t; openBuilding('barracks'); break;
    case 'tier': if (!tierOpen(+d.n)) { toast('Research this tier in the Royal Academy'); break; } trainSel.tier = +d.n; openBuilding('barracks'); break;
    case 'train': startTraining(trainSel.t, trainSel.tier, trainSel.n); break;
    case 'heal': healAll(); break;
    case 'trade': trade(d.a, d.b); break;
    case 'hero': openHero(d.id); break;
    case 'herotalk': { const old = document.querySelector(`.speech[data-id="${d.id}"]`); if (old) { old.remove(); openHero(d.id); break; } document.querySelectorAll('.speech').forEach(x => x.remove());
      const q = QUIPS[d.id], line = q ? q[Math.floor(Math.random() * 2)] : HERO[d.id].title, r = el.getBoundingClientRect(), b = document.createElement('div'); b.className = 'speech'; b.dataset.id = d.id;
      b.innerHTML = `<b>${esc(shortName(d.id))}</b>${esc(line)}<small>Tap again to open</small>`; b.style.left = (r.left + r.width / 2) + 'px'; b.style.top = r.top + 'px'; document.body.appendChild(b); sfx('tick'); setTimeout(() => b.remove(), 3200); break; }
    case 'colclaim': claimCollection(d.k); break;
    case 'star': { const h = S.heroes[d.id], need = STAR_SHARDS[h.stars + 1]; if (h.shards >= need) { h.shards -= need; h.stars++; if (!h.lvl) h.lvl = 1; sfx('win'); heroMoment(d.id, h.stars === 1 ? 'NEW HERO' : 'STAR UP', h.stars === 1 ? `${HERO[d.id].title} joins your court` : `${'★'.repeat(h.stars)} · stronger in every stat`); } render(); openHero(d.id); break; }
    case 'squad': { const i = S.squad.indexOf(d.id); if (i >= 0) S.squad.splice(i, 1); else { if (S.squad.length >= 3) S.squad.shift(); S.squad.push(d.id); } render(); openHero(d.id); break; }
    case 'tome': if (S.items.scroll) { S.items.scroll--; const l0 = S.heroes[d.id].lvl; heroXP(d.id, 600); sfx('done'); render(); openHero(d.id); if (S.heroes[d.id].lvl > l0) heroMoment(d.id, 'LEVEL UP', `Level ${l0} → ${S.heroes[d.id].lvl}`); } break;
    case 'tutor': { const h = S.heroes[d.id], c = Math.floor(150 * h.lvl * h.lvl); if (h.lvl >= heroCap()) { toast('Raise the Hall of Heroes to lift the level cap', 'bad'); break; } if (S.res.gold < c) { toast('Not enough Gold', 'bad'); break; } S.res.gold -= c; const l0 = h.lvl; heroXP(d.id, xpFor(h.lvl) * .5); sfx('done'); render(); openHero(d.id); if (h.lvl > l0) heroMoment(d.id, 'LEVEL UP', `Level ${l0} → ${h.lvl}`); break; }
    case 'stages': openStages(); break;
    case 'bestiary': openBestiary(); break;
    case 'beastclaim': { S.bestiaryClaimed ??= {}; const k = d.k; if ((S.bestiary || {})[k] && !S.bestiaryClaimed[k]) { S.bestiaryClaimed[k] = 1; give({ gems: 20, essence: 5 }, `${FOES[k].name} entered in the Bestiary`); FX.sound('coin'); } openBestiary(); break; }
    case 'more': { const tile = (act, extra, icon, name, note, dot) => `<button class="mtile" data-act="${act}" ${extra}>${icon}<b>${name}</b><small>${note}</small>${dot ? '<span class="dot">!</span>' : ''}</button>`, im = k => `<img src="art/nav/${k}.webp" alt="">`;
      openSheet('Realm', `<div class="mgrid">${tile('tab', 'data-tab="army"', im('army'), 'Army', fmt(troopCount(S.troops)) + ' troops')}${tile('tab', 'data-tab="research"', im('research'), 'Research', S.rq ? 'Studying…' : S.b.academy ? 'Idle' : 'Needs Academy', S.b.academy && !S.rq)}${tile('tab', 'data-tab="house"', im('house'), 'Alliance', S.house.requests.length + (S.house.requests.length === 1 ? ' help request' : ' help requests'), S.house.requests.length > 0)}${tile('arena', '', im('arena'), 'Arena', (S.arena ? S.arena.tickets : 0) + ' tickets', S.arena && S.arena.tickets > 0)}${tile('sub', 'data-s="bag"', ART.icon('crate', 54), 'Bag', 'Items and speed-ups')}${tile('mail', '', ART.icon('scroll', 54), 'Reports', S.unread ? S.unread + ' unread' : 'No new reports', S.unread > 0)}${tile('bestiary', '', ART.enemy('warlord', 54), 'Bestiary', Object.keys(S.bestiary || {}).length + ' / ' + Object.keys(FOES).length + ' found', bestiaryReady())}${tile('menu', '', im('more'), 'Settings', 'Sound, help, realm')}</div>`); break; }
    case 'stage': startStage(d.key); break;
    case 'cast': { const u = fight && fight.heroes.find(h => h.id === d.id); if (u && u.hp > 0 && u.en >= 100 && !fight.over && !fight.timing && now() >= fight.pauseUntil) timedCast(u); break; }
    case 'landmark': sfx('click'); if (d.id === 'arena') openTab('arena'); else if (d.id === 'bazaar') META.act('sub', { s: 'market' }); else if (d.id === 'altar') META.act('sub', { s: 'summon' }); else { openTab('heroes'); toast('Open a hero to forge their gear with Ember Essence'); } break;
    case 'caravan': if (caravan) { caravan = null; S.caravanN = (S.caravanN || 0) + 1; S.caravanAt = now() + (80 + Math.random() * 80) * 1000; const L = Math.max(1, S.b.citadel), r = Math.random(), rw = r < .4 ? { gold: 400 * L } : r < .75 ? { [pick(['grain', 'timber', 'stone', 'ore'])]: 2500 * L } : r < .9 ? { gems: 10 } : r < .98 ? { items: { sp5: 1 } } : { gems: 50 }; give(rw, 'Treasure caravan'); LIVE.on('caravan', 1); FX.confetti(); FX.sound('chest'); META.xp(3); render(); } break;
    case 'czoom': { const cv = $('#cityView'), fx = (cv.scrollLeft + cv.clientWidth / 2) / cv.scrollWidth, fy = (cv.scrollTop + cv.clientHeight / 2) / cv.scrollHeight; fitCity.zi = ((fitCity.zi || 0) + 1) % CITY_Z.length; fitCity.w = cv.clientWidth; fitCity.h = cv.clientHeight; fitCity(); requestAnimationFrame(() => { cv.scrollLeft = fx * cv.scrollWidth - cv.clientWidth / 2; cv.scrollTop = fy * cv.scrollHeight - cv.clientHeight / 2; }); sfx('click'); break; }
    case 'target': if (fight && !fight.over) { const u = fight.foes.find(h => h.id === d.id); if (u && u.hp > 0) { fight.target = u.id; sfx('click'); updFight(); } } break;
    case 'auto': break;
    case 'closefight': { const oc = fight && fight.outro; leaveFight(); render(); if (oc) chapterStory(oc, 'outro', () => { if (oc === CHAPTERS.length) FX.banner('Aeloria Restored', 'The Hollow King is defeated. Now claim the Sunspire Throne on the World map.', { art: ART.emblem(120) }); openStages(); }); else openStages(); break; }
    case 'story': closeSheet(); { const c = +d.ch; chapterStory(c, 'intro', () => { if (S.stages[c + '-6']) chapterStory(c, 'outro', openStages); else openStages(); }); } break;
    case 'retreat': if (fight && !fight.over && !el.dataset.sure) { el.dataset.sure = 1; el.textContent = 'Retreat?'; setTimeout(() => { if (el.isConnected) { delete el.dataset.sure; el.textContent = '✕'; } }, 2500); break; } leaveFight(); render(); break;
    case 'retry': { const k = fight.key, tr = fight.mode === 'trial'; leaveFight(); tr ? startTrial() : startStage(k); break; }
    case 'trial': startTrial(); break;
    case 'nextstage': { const oc = fight && fight.outro; leaveFight(); if (oc) chapterStory(oc, 'outro', () => startStage(d.key)); else startStage(d.key); break; }
    case 'bspeed': if (fight) { fight.speed = fight.speed === 1 ? 2 : 1; S.fightSpeed = fight.speed; el.textContent = fight.speed + '×'; } break;
    case 'usevigor': useItem('vigor'); openStages(); break;
    case 'research': startResearch(d.id); break;
    case 'claim': claimQuest(); break;
    case 'chest': openChest(); break;
    case 'helpall': S.house.honor += 10 * S.house.requests.length; toast(`Helped ${S.house.requests.length} members · +${10 * S.house.requests.length} Honor`, 'good'); S.house.requests = []; sfx('done'); render(); break;
    case 'hshop': if (S.house.honor < +d.c) { toast('Not enough Honor', 'bad'); break; } S.house.honor -= +d.c; S.items[d.i] = (S.items[d.i] || 0) + 1; toast(`Bought ${ITEMS[d.i].name}`, 'good'); render(); break;
    case 'use': useItem(d.i); break;
    case 'buy': { const it = ITEMS[d.i]; if (S.gems < it.gems) { toast('Not enough gems', 'bad'); break; } spendGems(it.gems); S.items[d.i] = (S.items[d.i] || 0) + 1; toast(`Bought ${it.name}`, 'good'); sfx('click'); render(); break; }
    case 'sendform': openSend(+d.id, d.kind); break;
    case 'go': { const o = S.world.find(w => w.id === +d.id); const tr = Object.fromEntries(Object.entries(sendSel).filter(([, n]) => n > 0)); if (troopCount(tr) > marchCap()) { toast('Too many troops for one march', 'bad'); break; } sendMarch(o, d.kind, tr); break; }
    case 'scout': scout(+d.id); break;
    case 'collect': { const o = S.world.find(w => w.id === +d.id); if (o && !o.dead) { if (S.marches.some(m => m.kind === 'collect' && m.target === o.id)) { toast('Riders are already on their way there'); break; } sendMarch(o, 'collect', {}); } break; }
    case 'mapzoom': { const c = $('#map').getBoundingClientRect(); zoomAt(cam.z * (+d.d > 0 ? 1.35 : .74), c.left + c.width / 2, c.top + c.height / 2); break; }
    case 'mapfind': { const k = d.k, cand = S.world.filter(o => !o.dead && seen(o.x, o.y) && (k === 'res' ? o.kind === 'node' : o.kind === k)).sort((a, b) => dist(S.home, a) - dist(S.home, b)); if (!cand.length) { toast('None charted yet: explore the mist to find more'); break; } mapFind[k] = ((mapFind[k] ?? -1) + 1) % Math.min(cand.length, 6); const o = cand[mapFind[k]]; if (cam.z < .8) cam.z = 1; centerOn(o.x, o.y); clampCam(); mapSel = { x: o.x, y: o.y }; sfx('click'); break; }
    case 'explore': explore(+d.x, +d.y); break;
    case 'march': openMarch(+d.id); break;
    case 'recall': recall(+d.id); closeSheet(); break;
    case 'goto': openTab('world'); centerOn(+d.x, +d.y); mapSel = { x: +d.x, y: +d.y }; break;
    case 'home': if (tab === 'world') centerOn(S.home.x, S.home.y); else openTab('world'); break;
    case 'mail': openMail(); break;
    case 'incoming': openSheet('Incoming attack!', `<p><b>${esc(S.incoming.name)}</b> marches with about ${fmt(troopCount(S.incoming.troops) * (S.b.tower >= 3 ? 1 : 1.1))} troops. Arrives in ${fmtT((S.incoming.arrive - now()) / 1000)}.</p><p>Your defenders: ${fmt(troopCount(S.troops))} troops, Ramparts ${S.b.wall}.</p>${S.items.shield ? '<button class="btn gold" data-act="use" data-i="shield">Raise Aegis Ward</button>' : `<button class="btn gold" data-act="buy" data-i="shield">${ART.icon('gem', 12)} ${ITEMS.shield.gems} Buy Aegis Ward</button>`}`); break;
    case 'mute': { const on = !(S.settings.music || S.settings.sfx); S.settings.music = on; S.settings.sfx = on; FX.music(on); FX.setSfx(on); el.textContent = on ? '🔊' : '🔇'; break; }
    case 'menu': openMenu(); break;
    case 'gfx3d': S.settings.gfx3d = S.settings.gfx3d !== true; $('#cityView').innerHTML = ''; if (!use3D() && window.CITY3D && CITY3D.ok) CITY3D.setActive(false); openTab('city'); break;
    case 'reset': if (!el.dataset.sure) { el.dataset.sure = 1; el.textContent = 'Tap again to erase this realm'; el.classList.add('gold'); break; } try { localStorage.removeItem(SAVE_KEY); } catch (x) { } location.reload(); break;
    case 'close': closeSheet(); break;
    case 'music': S.settings.music = !S.settings.music; FX.music(S.settings.music); openMenu(); break;
    case 'sfxt': S.settings.sfx = !S.settings.sfx; FX.setSfx(S.settings.sfx); openMenu(); break;
    case 'replay': $('#intro').hidden = false; $('#introForm').hidden = true; $('#introTitle').classList.remove('show'); $('#skipIntro').hidden = false; $('#introTap').hidden = true; { const stop = playIntro(() => { }); $('#introForm').onsubmit = e => { e.preventDefault(); stop(); $('#intro').hidden = true; }; $('#introForm button').textContent = 'Return to my realm'; $('#lordName').hidden = true; $('#colors').hidden = true; } closeSheet(); break;
    default: META.act(a, d, el) || LIVE.act(a, d, el);
  }
}
function onInput(e) {
  const el = e.target; const a = el.dataset.act;
  if (a === 'tn') { trainSel.n = +el.value; $('#tnv').textContent = el.value; const c = el.closest('.train'); c.querySelector('.costs').innerHTML = costHTML(trainCost(trainSel.t, trainSel.tier, trainSel.n)) + `<span class="cost">${ART.icon('clock', 15)}${fmtT(trainTime(trainSel.tier, trainSel.n))}</span>`; const b = c.querySelector('[data-act=train]'); if (b) b.textContent = `Train ${trainSel.n}`; }
  if (a === 'sendn') { sendSel[el.dataset.k] = +el.value; $('#sn-' + el.dataset.k).textContent = el.value; const go = $('[data-act=go]'); sendInfo(S.world.find(w => w.id === +go.dataset.id), go.dataset.kind); }
  if (a === 'auto') { fight.auto = el.checked; S.autoSkill = el.checked; updFight(); const h = $('#battle .hint'); }
}
function openMenu() {
  openSheet('Realm', `<div class="bhead">${ART.emblem(80)}<div><p><b>${esc(S.name)}</b></p><p>Might ${fmt(might())} · Citadel ${S.b.citadel}</p><p class="muted">${REALMS[S.realm].name} · ${REALMS[S.realm].bonusText} · Founded ${new Date(S.created).toLocaleDateString()}</p></div></div>
  <div class="card"><h4>How to play</h4><ul class="howto"><li>Upgrade fields to grow Grain, Timber, Stone and Iron. The Citadel caps everything else.</li><li>Train troops in the Barracks. Spearmen › Cavalry › Archers › Spearmen.</li><li>On the World map, explore the fog, gather resources, destroy Ashen outposts and scout Ash-sworn lords.</li><li>Lead heroes through the Story Campaign across six realms to earn XP, shards and new heroes. Your squad boosts every army.</li><li>From Citadel 4 rivals may raid you. Watch the warning, raise an Aegis Ward, or fight back.</li><li>Final goal: break the garrison of the Sunspire Throne at the heart of Aeloria.</li></ul></div>
  <div class="card"><h4>Settings</h4><div class="btns"><button class="btn" data-act="music">🎵 Music: ${S.settings.music ? 'On' : 'Off'}</button><button class="btn" data-act="sfxt">🔔 Sound effects: ${S.settings.sfx ? 'On' : 'Off'}</button><button class="btn" data-act="replay">🎬 Replay intro</button><button class="btn" data-act="notify">🔔 Enable notifications</button><button class="btn" data-act="gfx3d">🏰 3D city (experimental): ${S.settings.gfx3d === true ? 'On' : 'Off'}</button><button class="btn" data-act="logincal">📅 Royal Courier</button></div></div>
  <p class="muted">Progress is saved in this browser.</p><button class="btn" data-act="reset">Start a new realm</button>`);
}

/* ======================= start ======================= */
// A visible chest of everything the realm produced while you were away, plus a small courier's bonus.
const bestiaryReady = () => Object.keys(S.bestiary || {}).some(k => !(S.bestiaryClaimed || {})[k]);
function openBestiary() {
  const seen = S.bestiary || {}, cl = S.bestiaryClaimed || {}, n = Object.keys(seen).length, all = Object.keys(FOES);
  openSheet(`Bestiary · ${n} / ${all.length}`, `<p class="muted">Every enemy you defeat in the campaign is recorded here. Record a new one for 20 gems and 5 Ember Essence.</p><div class="beasts">${all.map(k => { const u = ART.asset('fiends', k), got = seen[k]; return `<div class="beast ${got ? '' : 'unknown'}">${u ? `<img src="${u}" alt="" loading="lazy">` : ART.enemy(k, 80)}<b>${got ? FOES[k].name : '???'}</b><small>${got ? `Defeated ${fmt(got)}×` : 'Not yet met'}</small>${got && !cl[k] ? `<button class="btn gold sm" data-act="beastclaim" data-k="${k}">Record</button>` : got ? '<em>✓ Recorded</em>' : ''}</div>`; }).join('')}</div>`, true);
}
function welcomeBack(away, before) {
  const got = {}; RES.forEach(k => { const v = Math.floor(S.res[k] - before[k]); if (v > 0) got[k] = v; }); if (!Object.keys(got).length) return;
  const bonus = { gold: Math.min(20000, Math.round((got.gold || 0) * .1 + 200 * Math.max(1, S.b.citadel))) }; give(bonus);
  openSheet('While you were away', `<div class="wb"><div class="wb-chest">${ART.icon('chest', 96)}</div><p>Your realm worked for <b>${fmtT(away)}</b>.</p><div class="rloot">${META.rewardHTML(got)}</div><p class="muted">The royal courier adds a purse for your return:</p><div class="rloot">${META.rewardHTML(bonus)}</div><button class="btn gold wide" data-act="close">Splendid</button></div>`);
  FX.sound('chest'); setTimeout(() => FX.confetti(), 250);
}
function start() {
  if (!TERR) TERR = buildTerrain(S.seed); ART.setRealm(S.realm || 'greenhold', LIVE.skinPal()); document.title = `${GAME.name} · ${S.name}`;
  document.addEventListener('click', onAct); document.addEventListener('input', onInput);
  document.addEventListener('submit', e => { if (e.target.dataset.act === 'chat') { e.preventDefault(); const v = e.target.m.value.trim(); if (v) { S.house.chat.push({ from: S.name, t: v, at: now() }); setTimeout(() => { S.house.chat.push({ from: pick(HOUSE_NAMES), t: pick(['Well said!', 'Agreed, my lord.', 'Ha! Good one.', 'On it.', 'For the Dawn Falcon!']), at: now() }); if (tab === 'house') render(); }, 1500); render(); } } });
  $('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });
  FX.setSfx(S.settings.sfx); $('#muteBtn').textContent = S.settings.music || S.settings.sfx ? '🔊' : '🔇';
  const wake = () => { FX.music(S.settings.music); document.removeEventListener('pointerdown', wake); }; document.addEventListener('pointerdown', wake); if (start.fromIntro) wake();
  $('#brand').innerHTML = ART.emblem(38);
  initMapInput();
  window.addEventListener('resize', () => { if (tab === 'world') clampCam(); });
  lastTick = Math.max(S.last || now(), now() - 12 * 3600e3);
  const away = (now() - lastTick) / 1000, before = { ...S.res };
  tick();
  if (away > 600) setTimeout(() => welcomeBack(away, before), start.fromIntro ? 4200 : 1100);
  LIVE.comeback(away);
  if (away > 120 && away <= 600) toast(`Welcome back! Your realm worked for ${fmtT(away)} while you were away.`, 'good');
  openTab('city');
  // the daily login popup waits until nothing else (welcome chest, story, banner) is on screen
  setTimeout(function tryLogin() { if (sheet().open || document.querySelector('.cine,.story,.reveal')) return setTimeout(tryLogin, 700); META.loginPopup(); }, start.fromIntro ? 2500 : (away > 600 ? 2600 : 900));
  setInterval(() => { tick(); renderHud(); renderQueues(); if (tab !== 'city' && tab !== 'world' && !$('#panel').contains(document.activeElement) && Math.floor(now() / 1000) % 2 === 0) render(true); }, 500);
  setInterval(() => { if (tab === 'city' && !document.querySelector('.reveal')) renderCity(); save(); }, 3000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
}
/* ======================= opening cinematic ======================= */
function playIntro(onDone) {
  const cv = $('#introCv'), ctx = cv.getContext('2d'); let t0 = 0, raf, ended = false, W = 0, H = 0;
  const size = () => { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  size(); addEventListener('resize', size);
  const stars = Array.from({ length: 160 }, () => [Math.random(), Math.random() * .6, Math.random() * 1.6 + .3, Math.random() * 6]);
  const lerp = (a, b, k) => a + (b - a) * k, mix = (c1, c2, k) => { const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const a = p(c1), b = p(c2); return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], k))).join(',')})`; };
  const dune = (y, amp, freq, off, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W + 10; x += 10) ctx.lineTo(x, y + Math.sin(x * freq + off) * amp + Math.sin(x * freq * 2.3 + off * 1.7) * amp * .35); ctx.lineTo(W, H); ctx.fill(); };
  function frame(ts) {
    if (!t0) t0 = ts; const t = (ts - t0) / 1000, k = clamp(t / 9, 0, 1), e = k * k * (3 - 2 * k);
    const hz = H * .62;
    const g = ctx.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, mix('#05030d', '#3a2a6b', e)); g.addColorStop(.6, mix('#140f22', '#e8743d', e)); g.addColorStop(1, mix('#1b1430', '#ffcf8a', e));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const [x, y, r, ph] of stars) { ctx.globalAlpha = (1 - e) * (.5 + .5 * Math.sin(t * 2 + ph)); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x * W, y * H, r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    const sy = lerp(hz + 80, hz - H * .2, e), sr = Math.min(W, H) * .09;
    const sg = ctx.createRadialGradient(W * .62, sy, 0, W * .62, sy, sr * 4); sg.addColorStop(0, `rgba(255,220,150,${.75 * e + .1})`); sg.addColorStop(1, 'rgba(255,180,100,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); ctx.fillStyle = mix('#ff9a5a', '#fff1c4', e); ctx.beginPath(); ctx.arc(W * .62, sy, sr, 0, 7); ctx.fill();
    dune(hz, 44, .0045, t * .03, mix('#1d1838', '#6a7aa0', e)); ctx.fillStyle = `rgba(255,255,255,${.25 + .6 * e})`; for (let x = 0; x < W; x += 9) { const yy = hz + Math.sin(x * .0045 + t * .03) * 44 + Math.sin(x * .0045 * 2.3 + t * .03 * 1.7) * 15; if (yy < hz - 24) ctx.fillRect(x, yy, 9, 5); }
    // the Sunspire on the horizon
    const cx = W * .5, cy = hz + 10; ctx.fillStyle = mix('#140f22', '#5a4a6a', e);
    ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx, cy - H * .22); ctx.lineTo(cx + 8, cy); ctx.fill(); ctx.fillRect(cx - 30, cy - 18, 60, 18); ctx.fillRect(cx - 40, cy - 34, 10, 34); ctx.fillRect(cx + 30, cy - 34, 10, 34);
    ctx.fillStyle = `rgba(255,211,107,${.4 + .6 * e})`; ctx.beginPath(); ctx.arc(cx, cy - H * .22, 3 + 2 * Math.sin(t * 3), 0, 7); ctx.fill();
    dune(hz + H * .1, 24, .004, 1 + t * .1, mix('#141a2a', '#5f8a4a', e));
    // caravan
    const cvx = ((t * 18) % (W + 200)) - 100, cvy = hz + H * .1 + 4;
    ctx.fillStyle = mix('#0a0d14', '#2a3a1a', e);
    for (let i = 0; i < 4; i++) { const x = cvx - i * 34, y = cvy + Math.sin((x) * .004 + 1 + t * .1) * 24 - 10; ctx.beginPath(); ctx.ellipse(x, y, 11, 5, 0, 0, 7); ctx.fill(); ctx.fillRect(x + 8, y - 12, 3, 10); ctx.fillRect(x - 8, y + 3, 2, 8); ctx.fillRect(x + 6, y + 3, 2, 8); ctx.beginPath(); ctx.arc(x - 2, y - 8, 3, 0, 7); ctx.fill(); }
    dune(hz + H * .24, 30, .003, 2 + t * .2, mix('#0d1018', '#3e6a34', e));
    // falcon
    if (t > 3.5 && t < 12) { const p = (t - 3.5) / 8.5, fx = lerp(-80, W + 80, p), fy = H * .3 + Math.sin(p * 6) * 30 - p * 40, fl = Math.sin(t * 11), s = Math.min(W, H) / 600 * (1.4 + p * .8);
      ctx.save(); ctx.translate(fx, fy); ctx.scale(s, s); ctx.fillStyle = '#140b20';
      ctx.beginPath(); ctx.moveTo(-22, 0); ctx.quadraticCurveTo(-10, -4 - fl * 16, -40, -10 - fl * 22); ctx.quadraticCurveTo(-14, -2, 0, 2); ctx.quadraticCurveTo(14, -2, 40, -10 - fl * 22); ctx.quadraticCurveTo(10, -4 - fl * 16, 22, 0); ctx.quadraticCurveTo(10, 8, 0, 6); ctx.quadraticCurveTo(-10, 8, -22, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(-6, 16); ctx.lineTo(6, 16); ctx.fill(); ctx.beginPath(); ctx.arc(14, -2, 4, 0, 7); ctx.fill(); ctx.restore(); }
    // drifting sand
    ctx.fillStyle = `rgba(255,240,200,${.35 * e})`; for (let i = 0; i < 40; i++) { const x = ((i * 97 + t * 60 * (1 + i % 3)) % (W + 40)) - 20, y = H * .7 + (i * 53 % (H * .3)); ctx.fillRect(x, y, 2, 1); }
    if (!ended) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  const lines = STORY.prologue.map(l => l[1]);
  const box = $('#introLines'); let timers = [];
  lines.forEach((l, i) => timers.push(setTimeout(() => { box.innerHTML = `<p>${l}</p>`; FX.sound('whoosh'); }, 800 + i * 2700)));
  const finish = () => { if (ended && !onDone) return; timers.forEach(clearTimeout); box.innerHTML = ''; $('#skipIntro').hidden = true; $('#introTitle').classList.add('show'); FX.sound('fanfare'); setTimeout(() => { $('#introForm').hidden = false; $('#lordName').focus({ preventScroll: true }); }, 900); const cb = onDone; onDone = null; cb && cb(); };
  timers.push(setTimeout(finish, 800 + lines.length * 2700));
  $('#skipIntro').onclick = () => { t0 -= 9000; finish(); };
  return () => { ended = true; cancelAnimationFrame(raf); };
}

function boot() {
  const REALM_ART = { greenhold: 'chapter1', amber: 'chapter2', frostmark: 'chapter3', jade: 'chapter4', coral: 'chapter5', sunveldt: 'sunveldt' };
const REALM_HERO = { greenhold: 'aldric', amber: 'saqr', frostmark: 'astrid', jade: 'lian', coral: 'kaimana', sunveldt: 'kofi' };
// The chosen realm's champion steps up beside the founding form.
function realmChampion(r) {
  const id = REALM_HERO[r], u = id && ART.asset('champions', id), host = $('#intro'); if (!u || !host) return;
  host.querySelectorAll('.rchamp').forEach(e => { e.classList.add('out'); setTimeout(() => e.remove(), 350); });
  const el = document.createElement('div'); el.className = 'rchamp'; el.style.setProperty('--rc', REALMS[r].color);
  el.innerHTML = `<img src="${u}" alt=""><span>${esc(HERO[id].name)}<small>${esc(HERO[id].title)}</small></span>`; host.appendChild(el);
}
function titleLineup() {
  const t = $('#introTap'); if (!t || t.querySelector('.tapline') || !ART.asset('champions', 'arthur')) return;
  const ids = ['astrid', 'antarah', 'arthur', 'saqr', 'lian'], boss = ART.asset('fiends', 'hollow');
  const d = document.createElement('div'); d.className = 'tapline'; d.setAttribute('aria-hidden', 'true');
  d.innerHTML = (boss ? `<img class="tl-boss" src="${boss}" alt="">` : '') + ids.map((id, i) => `<img class="tl-h" style="--i:${i};--o:${Math.abs(i - 2)}" src="${ART.asset('champions', id)}" alt="">`).join('');
  t.prepend(d);
}
function paintIntro(realm) {
  titleLineup();
  const k = ART.keyUrl(realm ? REALM_ART[realm] : 'title') || ART.keyUrl('title'), el = $('#intro'); if (!k || !el) return;
  el.style.background = `linear-gradient(#05030d55,#05030dbb),url(${k}) center/cover`; const c = $('#introCv'); if (c) c.style.opacity = 0;
  document.querySelectorAll('#realms .realm').forEach(b => { const u = ART.keyUrl(REALM_ART[b.dataset.r]); if (u) b.style.background = `linear-gradient(#0b081866,#0b0818e0),url(${u}) center/cover`; });
}
window.addEventListener('artready', () => { paintIntro(); { const cvw = $('#cityView'); if (cvw && $('#cityDyn')) cvw.innerHTML = ''; } document.body.classList.toggle('painted-ui', !!ART.asset('ui', 'button')); if (window.CITY3D && CITY3D.retex) CITY3D.retex(); const k = ART.keyUrl('title'); if (k) { $('#introTap').style.background = `linear-gradient(#05030d66,#05030dcc),url(${k}) center/cover`; } if (S && document.querySelector('#app')) render(); FX.music(); });
  S = load();
  if (S) { start(); return; }
  const colors = ['#e8a33d', '#3fd7c8', '#b3433a', '#9b7bff', '#3e8a4a', '#ff7a59'];
  $('#intro').hidden = false;
  $('#introEmblem').innerHTML = ART.emblem(110); $('#introEmblem2').innerHTML = ART.emblem(96);
  $('#colors').innerHTML = colors.map((c, i) => `<button type="button" class="sw ${i ? '' : 'on'}" style="background:${c}" data-c="${c}" aria-label="Banner colour ${i + 1}"></button>`).join('');
  let color = colors[0], stop = null, realm = 'greenhold';
  $('#realms').innerHTML = REALM_IDS.map(k => { const R = REALMS[k]; return `<button type="button" class="realm ${k === realm ? 'on' : ''}" data-r="${k}" style="--rc:${R.color}"><b>${R.name}</b><small>${R.bonusText}</small></button>`; }).join('');
  paintIntro(); realmChampion(realm);
  $('#realmDesc').textContent = REALMS[realm].desc;
  $('#realms').addEventListener('click', e => { const b = e.target.closest('.realm'); if (!b) return; realm = b.dataset.r; document.querySelectorAll('.realm').forEach(x => x.classList.toggle('on', x === b)); $('#realmDesc').textContent = REALMS[realm].desc; FX.sound('click'); paintIntro(realm); realmChampion(realm); });
  $('#colors').addEventListener('click', e => { const b = e.target.closest('.sw'); if (!b) return; color = b.dataset.c; document.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === b)); FX.sound('click'); });
  $('#introTap').addEventListener('click', () => { $('#introTap').hidden = true; $('#skipIntro').hidden = false; FX.setMood('cine'); FX.music(true); stop = playIntro(); }, { once: true });
  $('#introForm').onsubmit = e => { e.preventDefault(); const name = ($('#lordName').value.trim() || 'Lord of Aeloria').slice(0, 24); S = newState(name, color, realm); save(); if (stop) stop(); $('#intro').classList.add('leaving'); setTimeout(() => { $('#intro').hidden = true; }, 700); FX.sound('horn'); start.fromIntro = true; start(); FX.setMood('city'); setTimeout(() => FX.banner(`Welcome, ${esc(name)}`, `Your citadel rises in ${REALMS[realm].name}. The Hollow King's ash is spreading — gather heroes and begin the Story Campaign.`, { art: ART.emblem(110) }), 600); };
}
boot();
