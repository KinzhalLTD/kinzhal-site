// Rimal Realms — kingdom strategy. Game state, simulation and interface.
'use strict';
const $ = s => document.querySelector(s);
const now = () => Date.now();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = n => { n = Math.floor(n || 0); const a = Math.abs(n); return a >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : a >= 1e4 ? (n / 1e3).toFixed(1) + 'K' : n.toLocaleString('en'); };
const fmtT = s => { s = Math.max(0, Math.ceil(s)); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : m ? `${m}m ${x}s` : `${x}s`; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const SAVE_KEY = 'rimal-realms-save-v1';
const W = 40, H = 40;

let S; // the whole game state (saved to localStorage)

/* ======================= state ======================= */
function newState(name, color) {
  const s = {
    v: 1, name, color, created: now(), last: now(),
    res: { grain: 6000, timber: 6000, stone: 4000, ore: 1500, gold: 3000 }, gems: 300,
    b: { citadel: 1, barracks: 1, mews: 1, academy: 0, infirmary: 0, vault: 0, tower: 0, wall: 0, embassy: 0, market: 0 },
    fields: Array(16).fill(null),
    queue: [], builderUntil: 0,
    troops: { inf1: 60, rng1: 40, cav1: 20 }, wounded: {}, training: null,
    tech: {}, rq: null,
    heroes: { rania: { lvl: 1, xp: 0, stars: 1, shards: 0 }, tariq: { lvl: 1, xp: 0, stars: 1, shards: 0 }, noor: { lvl: 1, xp: 0, stars: 1, shards: 0 } },
    squad: ['tariq', 'rania', 'noor'], stages: {}, vigor: 60, vigorT: now(),
    items: { sp5: 3, sp60: 1, shield: 1, crate: 1, scroll: 2 }, shieldUntil: now() + 3600e3,
    marches: [], reports: [], unread: 0, quest: 0, chestAt: now(),
    stats: { trained: 0, gathered: 0, camps: 0, campMax: 0, scouts: 0, rivals: 0, stageWins: 0 },
    house: { honor: 0, chat: [], requests: [] }, helps: [],
    raidAt: now() + 15 * 60e3, incoming: null, throne: false, seed: Math.floor(Math.random() * 1e9), mid: 1
  };
  s.fields[0] = { t: 'farm', l: 1 }; s.fields[1] = { t: 'lumber', l: 1 }; s.fields[2] = { t: 'quarry', l: 1 }; s.fields[5] = { t: 'mine', l: 1 };
  genWorld(s);
  return s;
}

function genWorld(s) {
  const r = rng(s.seed), occ = new Set(), objs = [];
  const take = (x, y) => occ.add(x + ',' + y), free = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && !occ.has(x + ',' + y);
  for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) take(20 + dx, 20 + dy);
  objs.push({ id: 1, kind: 'throne', x: 20, y: 20, troops: { inf3: 9000, rng3: 9000, cav3: 7000, sie3: 3000 }, wall: 18 });
  s.home = { x: 20 + Math.floor(r() * 10 - 5), y: 31 + Math.floor(r() * 4) }; take(s.home.x, s.home.y);
  let id = 2;
  const spot = (minD = 0) => { for (let i = 0; i < 400; i++) { const x = 1 + Math.floor(r() * (W - 2)), y = 1 + Math.floor(r() * (H - 2)); if (free(x, y) && Math.hypot(x - s.home.x, y - s.home.y) >= minD) return [x, y]; } return null; };
  RIVALS.forEach(([name, color], i) => {
    const p = spot(6); if (!p) return; take(...p);
    const lvl = 3 + i; const k = 1 + i * .55;
    objs.push({ id: id++, kind: 'city', ai: true, x: p[0], y: p[1], name, color, lvl, wall: Math.floor(lvl / 2),
      troops: { inf1: Math.floor(220 * k), rng1: Math.floor(180 * k), cav1: Math.floor(150 * k), ...(i > 3 ? { inf2: Math.floor(90 * k), rng2: Math.floor(70 * k) } : {}), ...(i > 6 ? { cav3: Math.floor(40 * k) } : {}) },
      res: { grain: 8000 * k, timber: 8000 * k, stone: 5000 * k, ore: 2000 * k, gold: 3000 * k } });
  });
  for (let i = 0; i < 150; i++) { const p = spot(); if (!p) break; take(...p); objs.push(makeNode(id++, p, r)); }
  for (let i = 0; i < 70; i++) { const p = spot(2); if (!p) break; take(...p); objs.push(makeCamp(id++, p, r)); }
  s.world = objs; s.nextId = id;
}
const ringLevel = (x, y, r) => clamp(Math.round((1 - Math.hypot(x - 20, y - 20) / 22) * 5 + r() * 1.6), 1, 6);
function makeNode(id, [x, y], r = Math.random) { const kind = pick(RES); const lvl = ringLevel(x, y, r); return { id, kind: 'node', res: kind, x, y, lvl, amount: Math.floor((kind === 'gold' ? 6000 : 20000) * lvl * (1 + lvl * .2)) }; }
function makeCamp(id, [x, y], r = Math.random) {
  const lvl = clamp(ringLevel(x, y, r) + Math.floor(r() * 3) - 2, 1, 10);
  const n = Math.floor(30 * Math.pow(lvl, 1.6)), tier = lvl >= 8 ? 3 : lvl >= 5 ? 2 : 1;
  return { id, kind: 'camp', x, y, lvl, troops: { ['inf' + tier]: Math.floor(n * .4), ['rng' + tier]: Math.floor(n * .35), ['cav' + tier]: Math.floor(n * .25) } };
}
function freeSpot() { const occ = new Set(S.world.map(o => o.x + ',' + o.y)); occ.add(S.home.x + ',' + S.home.y); for (let i = 0; i < 500; i++) { const x = 1 + Math.floor(Math.random() * (W - 2)), y = 1 + Math.floor(Math.random() * (H - 2)); if (!occ.has(x + ',' + y) && Math.hypot(x - 20, y - 20) > 2.5) return [x, y]; } return [1, 1]; }

function save() { try { S.last = now(); localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage blocked: game still runs */ } }
function load() { try { const j = localStorage.getItem(SAVE_KEY); if (j) { const s = JSON.parse(j); if (s && s.v === 1) return s; } } catch (e) { } return null; }

/* ======================= economy ======================= */
const tech = id => (S.tech[id] || 0) * (TECHM[id]?.eff || 0);
const prodBoost = { grain: 'agri', timber: 'forest', stone: 'mason', ore: 'metal' };
const fieldRate = L => L ? 800 * L * Math.pow(1.13, L - 1) : 0; // per hour
function rates() {
  const r = { grain: 0, timber: 0, stone: 0, ore: 0, gold: 0 };
  S.fields.forEach(f => { if (f && f.l) r[BLD[f.t].field] += fieldRate(f.l); });
  for (const k of ['grain', 'timber', 'stone', 'ore']) r[k] = r[k] * (1 + tech(prodBoost[k])) + 120;
  r.gold = 200 + 160 * S.b.citadel + 260 * S.b.market;
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
  return { hp: Math.round(d.hp * m), atk: Math.round(d.atk * m), def: Math.round(d.def * m), spd: d.spd };
}
const heroMight = () => Object.entries(S.heroes).reduce((a, [id, h]) => a + h.lvl * 40 * h.stars, 0);
function might() {
  let m = 0; for (const [k, l] of Object.entries(S.b)) m += l * l * (k === 'citadel' ? 40 : 14);
  S.fields.forEach(f => { if (f) m += f.l * f.l * 6; });
  m += troopMight(S.troops) + S.marches.reduce((a, x) => a + troopMight(x.troops), 0);
  m += heroMight() + Object.values(S.tech).reduce((a, l) => a + l * 60, 0);
  return Math.floor(m);
}
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
const pay = c => { for (const [k, v] of Object.entries(c)) { if (k === 'gems') S.gems -= v; else S.res[k] -= v; } };
function give(r, label) {
  const parts = [];
  for (const [k, v] of Object.entries(r || {})) {
    if (k === 'items') for (const [i, n] of Object.entries(v)) { S.items[i] = (S.items[i] || 0) + n; parts.push(`${n}× ${ITEMS[i].name}`); }
    else if (k === 'gems') { S.gems += v; parts.push(`${v} gems`); }
    else if (k === 'shards') for (const [h, n] of Object.entries(v)) { addShards(h, n); parts.push(`${n} ${HERO[h].name.split(' ')[0]} shards`); }
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
const openPlots = () => Math.min(16, 4 + S.b.citadel * 2);
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
  toast(`${BLD[q.id].name} reached level ${q.to}`, 'good'); sfx('done');
  if (q.id === 'citadel') { burst(); log(`Your Citadel rose to level ${q.to}.`); }
}

/* ======================= training & healing ======================= */
const tierOpen = tier => tier === 1 || (tier === 2 && S.tech.tier2) || (tier === 3 && S.tech.tier3);
const trainCost = (type, tier, n) => { const c = {}; for (const [k, v] of Object.entries(TROOP[type].cost)) c[k] = Math.ceil(v * TIER_MULT[tier - 1] * .8 * n); return c; };
const trainTime = (tier, n) => TIER_TIME[tier - 1] * n / (1 + tech('drill') + S.b.barracks * .04);
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
const techTime = (t, to) => 30 * Math.pow(1.75, to - 1) * (t.max === 1 ? 8 : 1) / (1 + S.b.academy * .03);
const techNeed = (t, to) => Math.max(t.need || 1, to * 2 - 1);
function startResearch(id) {
  const t = TECHM[id], to = (S.tech[id] || 0) + 1;
  if (S.rq) return toast('Already researching', 'bad');
  if (!S.b.academy) return toast('Build the House of Wisdom first', 'bad');
  if (to > t.max) return toast('Fully researched');
  if (S.b.academy < techNeed(t, to)) return toast(`Needs House of Wisdom level ${techNeed(t, to)}`, 'bad');
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
const freeLimit = 5 * 60e3;
function speedUp(kind, key, how) {
  const t = timerRef(kind, key); if (!t) return;
  const left = t.end - now();
  if (how === 'free') { if (left > freeLimit || kind !== 'b') return; t.end = now(); }
  else if (how === 'gems') { const g = gemCost(left); if (S.gems < g) return toast('Not enough gems', 'bad'); S.gems -= g; t.end = now(); }
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
const playerAtk = () => ({ atkB: tech('blade') + squadBonus(), defB: tech('armor') });
function troopsHTML(t, cls = '') { const e = Object.entries(t || {}).filter(([, n]) => n > 0); return e.length ? `<div class="tlist ${cls}">${e.map(([k, n]) => { const [ty, ti] = tparse(k); return `<span class="tchip">${ART.troop(ty, ti, 26)}${fmt(n)}</span>`; }).join('')}</div>` : '<span class="muted">none</span>'; }

/* ======================= world marches ======================= */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const marchSpeed = () => 1 + tech('march');
const travelMs = (o, troops) => { const slow = troops.sie1 || troops.sie2 || troops.sie3 ? 1.3 : 1; return dist(S.home, o) * 2200 * slow / marchSpeed(); };
const loadOf = t => Object.entries(t).reduce((a, [k, n]) => { const [ty, ti] = tparse(k); return a + n * TROOP[ty].load * (1 + (ti - 1) * .5); }, 0) * (1 + tech('gather'));
function sendMarch(o, kind, troops) {
  if (S.marches.length >= maxMarches()) return toast('All march slots are busy', 'bad');
  if (kind !== 'scout' && troopCount(troops) <= 0) return toast('Choose some troops', 'bad');
  for (const [k, n] of Object.entries(troops)) { if ((S.troops[k] || 0) < n) return toast('Not enough troops at home', 'bad'); }
  for (const [k, n] of Object.entries(troops)) S.troops[k] -= n;
  if (kind === 'attack' && S.shieldUntil > now()) { S.shieldUntil = 0; toast('Attacking lifted your Mirage Veil'); }
  const ms = kind === 'scout' ? travelMs(o, {}) * .5 : travelMs(o, troops);
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
  if (!o || o.x !== m.tx || o.y !== m.ty) { report('March returned', 'The target had moved on before your troops arrived.'); return goBack(); }
  if (m.kind === 'scout') {
    S.stats.scouts++;
    const lvl = S.b.tower; const show = t => lvl >= 3 ? troopsHTML(t) : `about ${fmt(troopCount(t) * (0.8 + Math.random() * .4))} troops`;
    report(`Scout report · ${o.name || 'Bandit camp L' + o.lvl}`, `<p>Army: ${show(o.troops)}</p>${o.res ? `<p>Resources: ${RES.map(k => ART.icon(k, 14) + fmt(o.res[k])).join(' ')}</p>` : ''}${o.wall ? `<p>Ramparts level ${o.wall}</p>` : ''}${lvl < 3 ? '<p class="muted">Raise the Watchtower to level 3 for exact numbers.</p>' : ''}`, 'scout');
    return goBack();
  }
  if (m.kind === 'gather') {
    if (o.kind !== 'node') return goBack();
    m.res = o.res; m.load = loadOf(m.troops); m.rate = (6 + o.lvl * 4) * (1 + tech('gather')) * (o.res === 'gold' ? .4 : 1);
    m.state = 'gather'; m.gstart = now(); m.gend = now() + Math.min(m.load, o.amount) / m.rate * 1000; return;
  }
  // attack
  const p = playerAtk(); const isCity = o.kind === 'city' || o.kind === 'throne';
  const res = battle({ troops: m.troops, ...p }, { troops: o.troops, defB: o.kind === 'throne' ? .5 : o.kind === 'city' ? o.lvl * .02 : 0, wall: o.wall || 0 });
  m.troops = res.leftA;
  const deadMine = troopCount(res.lossA), healed = addWounded(Object.fromEntries(Object.entries(res.lossA).map(([k, n]) => [k, Math.floor(n * .6)])));
  o.troops = res.leftD;
  let body = `<p><b>${res.win ? 'Victory!' : 'Defeat.'}</b> ${res.rounds} rounds.</p><p>Your losses: ${troopsHTML(res.lossA)} <span class="muted">(${fmt(healed)} sent to the Infirmary)</span></p><p>Enemy losses: ${troopsHTML(res.lossD)}</p>`;
  if (res.win) {
    if (o.kind === 'camp') {
      S.stats.camps++; S.stats.campMax = Math.max(S.stats.campMax, o.lvl);
      const L = o.lvl; m.loot = { gold: 300 * L * L, grain: 800 * L, timber: 600 * L, stone: 400 * L, ore: 150 * L };
      const extra = { items: { gift: 1 + (L >= 5 ? 1 : 0) } }; if (Math.random() < .35) extra.items.sp5 = 1 + Math.floor(L / 3); if (Math.random() < .25) extra.gems = 5 * L;
      if (L >= 4 && Math.random() < .3) extra.shards = { [pick(HEROES).id]: 1 + Math.floor(L / 4) };
      body += `<p>Spoils: ${give(extra)} and resources carried home.</p>`;
      o.respawnAt = now() + 4 * 60e3; o.dead = true;
    } else if (o.kind === 'city') {
      S.stats.rivals++; const take = {}; for (const k of RES) { take[k] = Math.floor(Math.min(o.res[k] * .4, loadOf(m.troops) / 5)); o.res[k] -= take[k]; }
      m.loot = take; body += `<p>You plundered ${RES.map(k => ART.icon(k, 14) + fmt(take[k])).join(' ')}</p>`; o.lvl = Math.max(1, o.lvl); o.angry = (o.angry || 0) + 1;
    } else if (o.kind === 'throne') {
      if (troopCount(o.troops) === 0) { S.throne = true; body += '<p><b>The Oasis Throne is yours. All the sands bow to you, Sovereign.</b></p>'; burst(); burst(); log('You captured the Oasis Throne!'); }
      else body += `<p>The Throne garrison still holds ${fmt(troopCount(o.troops))} troops. Keep attacking!</p>`;
    }
  }
  report(`${res.win ? 'Victory' : 'Defeat'} · ${o.name || (o.kind === 'camp' ? 'Bandit camp L' + o.lvl : 'Oasis Throne')}`, body, res.win ? 'win' : 'loss');
  sfx(res.win ? 'win' : 'loss'); void deadMine; void isCity;
  if (troopCount(m.troops) === 0) { S.marches = S.marches.filter(x => x !== m); give(m.loot); return; }
  goBack();
}
function marchHome(m) {
  for (const [k, n] of Object.entries(m.troops)) S.troops[k] = (S.troops[k] || 0) + n;
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
  if (S.shieldUntil > now()) { report('Raid turned away', `${esc(inc.name)}'s army found only a shimmering mirage. Your Veil protected the city.`, 'scout'); return; }
  const res = battle({ troops: inc.troops, atkB: .05 }, { troops: S.troops, ...playerAtk(), defB: tech('armor') + squadBonus() / 2, wall: S.b.wall });
  const healed = addWounded(res.lossD); S.troops = res.leftD; for (const k in S.troops) if (!S.troops[k]) delete S.troops[k];
  let body = `<p>${esc(inc.name)} attacked with ${fmt(troopCount(inc.troops))} troops.</p><p>Your losses: ${troopsHTML(res.lossD)} <span class="muted">(${fmt(healed)} saved by the Infirmary)</span></p><p>Their losses: ${troopsHTML(res.lossA)}</p>`;
  if (res.win) {
    const safe = vaultSafe(), lost = {};
    for (const k of RES) { lost[k] = Math.floor(Math.max(0, S.res[k] - safe) * .25); S.res[k] -= lost[k]; }
    body += `<p><b>Your city was plundered:</b> ${RES.map(k => ART.icon(k, 14) + fmt(lost[k])).join(' ')}</p><p class="muted">Upgrade the Vault and Ramparts, train more troops, or use a Mirage Veil.</p>`;
    S.shieldUntil = now() + 20 * 60e3; body += '<p>A short 20-minute veil now protects you.</p>';
  } else { const g = 10 + Math.floor(Math.random() * 20); S.gems += g; body += `<p><b>Your defenders held!</b> +${g} gems</p>`; const o = S.world.find(w => w.id === inc.from); if (o) for (const k in o.troops) o.troops[k] = Math.floor(o.troops[k] * .9); }
  report(`${res.win ? 'City raided' : 'Defence won'} · ${inc.name}`, body, res.win ? 'loss' : 'win'); sfx(res.win ? 'loss' : 'win');
}

/* ======================= reports & log ======================= */
function report(title, body, kind = 'info') { S.reports.unshift({ t: now(), title, body, kind }); S.reports = S.reports.slice(0, 40); S.unread++; }
function log(t) { S.house.chat.push({ from: 'Herald', t, at: now() }); S.house.chat = S.house.chat.slice(-30); }

/* ======================= tick ======================= */
let lastTick = now();
function tick() {
  const t = now(); let dt = (t - lastTick) / 1000; lastTick = t; if (dt < 0) dt = 0;
  produce(dt);
  for (const q of [...S.queue]) if (q.end <= t) finishBuild(q);
  if (S.training && S.training.end <= t) { const { k, n } = S.training; S.troops[k] = (S.troops[k] || 0) + n; S.stats.trained += n; S.training = null; const [ty, ti] = tparse(k); toast(`${fmt(n)} ${TROOP[ty].name} ${'I'.repeat(ti)} ready`, 'good'); sfx('done'); }
  if (S.rq && S.rq.end <= t) { S.tech[S.rq.id] = S.rq.to; toast(`${TECHM[S.rq.id].name} level ${S.rq.to} complete`, 'good'); sfx('done'); S.rq = null; }
  for (const h of [...S.helps]) if (h.at <= t) { applyHelp(h); S.helps.splice(S.helps.indexOf(h), 1); }
  for (const m of [...S.marches]) {
    if (m.state === 'out' && t >= m.arrive) arrive(m);
    else if (m.state === 'gather' && t >= m.gend) { collectGather(m, S.world.find(w => w.id === m.target)); m.state = 'back'; m.bstart = t; m.back = t + m.out; }
    else if (m.state === 'back' && t >= m.back) marchHome(m);
  }
  for (const o of S.world) {
    if (o.dead && o.respawnAt <= t) { const p = freeSpot(); Object.assign(o, makeCamp(o.id, p)); delete o.dead; delete o.respawnAt; }
    if (o.kind === 'city' && Math.random() < dt / 60) { for (const k in o.troops) o.troops[k] += Math.ceil(o.troops[k] * .01); for (const k of RES) o.res[k] = Math.min(o.res[k] + 400 * o.lvl, 60000 * o.lvl); }
  }
  // vigor regen 1 per 40s, max 60 (+mews)
  const vmax = 60 + S.b.mews * 2;
  if (S.vigor < vmax) { const gain = Math.floor((t - S.vigorT) / 40000); if (gain > 0) { S.vigor = Math.min(vmax, S.vigor + gain); S.vigorT += gain * 40000; } } else S.vigorT = t;
  // raids
  if (!S.incoming && S.b.citadel >= 4 && t >= S.raidAt) { if (S.shieldUntil > t) scheduleRaid(); else startRaid(); }
  if (S.incoming && t >= S.incoming.arrive) resolveRaid();
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

/* ======================= audio (tiny synth) ======================= */
let AC = null, muted = false;
function sfx(kind) {
  if (muted) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const seq = { click: [[660, .04]], build: [[392, .07], [523, .09]], done: [[523, .08], [659, .08], [784, .14]], horn: [[220, .18], [277, .22]], win: [[523, .1], [659, .1], [784, .1], [1046, .25]], loss: [[330, .15], [262, .25]], alarm: [[880, .12], [660, .12], [880, .12]], hit: [[180, .05]], skill: [[784, .06], [988, .12]] }[kind] || [[440, .05]];
    let t = AC.currentTime;
    for (const [f, d] of seq) { const o = AC.createOscillator(), g = AC.createGain(); o.type = kind === 'horn' ? 'sawtooth' : 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.08, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .02); t += d * .9; }
  } catch (e) { }
}

/* ======================= UI helpers ======================= */
function toast(msg, kind = '') { const el = document.createElement('div'); el.className = 'toast ' + kind; el.innerHTML = msg; $('#toasts').appendChild(el); setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3100); }
function floatNote(msg) { const el = document.createElement('div'); el.className = 'float-note'; el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 1800); }
function burst() { const c = document.createElement('div'); c.className = 'burst'; for (let i = 0; i < 28; i++) { const s = document.createElement('i'); s.style.setProperty('--a', (i * 360 / 28) + 'deg'); s.style.setProperty('--d', (90 + Math.random() * 120) + 'px'); s.style.background = pick(['#ffd36b', '#3fd7c8', '#ff7a59', '#f2e6cf']); c.appendChild(s); } document.body.appendChild(c); setTimeout(() => c.remove(), 1200); }
const sheet = () => $('#sheet');
function openSheet(title, html, wide) { const d = sheet(); d.classList.toggle('wide', !!wide); $('#sheetTitle').innerHTML = title; $('#sheetBody').innerHTML = html; if (!d.open) d.showModal(); }
function closeSheet() { if (sheet().open) sheet().close(); }
const bar = (p, cls = '') => `<div class="bar ${cls}"><i style="width:${clamp(p * 100, 0, 100)}%"></i></div>`;

/* ======================= HUD ======================= */
function renderHud() {
  const r = rates(), c = cap();
  $('#hudName').textContent = S.name; $('#hudMight').innerHTML = `${ART.icon('might', 14)} ${fmt(might())}`;
  $('#hudRes').innerHTML = RES.map(k => `<div class="res ${S.res[k] >= c ? 'full' : ''}" title="${RNAME[k]}: ${fmt(r[k])}/h, storage ${fmt(c)}">${ART.icon(k, 18)}<b>${fmt(S.res[k])}</b><small class="${r[k] < 0 ? 'neg' : ''}">${r[k] >= 0 ? '+' : ''}${fmt(r[k])}/h</small></div>`).join('') +
    `<div class="res gem">${ART.icon('gem', 18)}<b>${fmt(S.gems)}</b></div>`;
  $('#mailDot').hidden = !S.unread; $('#mailDot').textContent = S.unread;
  const qd = S.quest < QUESTS.length && QUESTS[S.quest].c(S); $('#questDot').hidden = !(qd || now() >= S.chestAt);
  const shield = S.shieldUntil > now();
  $('#status').innerHTML = (S.incoming ? `<button class="alert" data-act="incoming">⚠ ${esc(S.incoming.name)} attacks in ${fmtT((S.incoming.arrive - now()) / 1000)}</button>` : '') +
    (shield ? `<span class="veil">${ART.icon('shield', 14)} Veil ${fmtT((S.shieldUntil - now()) / 1000)}</span>` : '');
}
function renderQueues() {
  const t = now(), rows = [];
  for (let i = 0; i < builders(); i++) {
    const q = S.queue[i];
    if (q) { const left = (q.end - t) / 1000; rows.push(`<div class="q" data-act="speed" data-kind="b" data-key="${q.key}">${ART.icon('help', 16)}<div><b>${BLD[q.id].name} → ${q.to}</b>${bar(1 - (q.end - t) / q.total)}<small>${fmtT(left)}</small></div>${left * 1000 <= freeLimit ? '<span class="free">FREE</span>' : ''}</div>`); }
    else rows.push(`<div class="q idle" data-act="tab" data-tab="city">${ART.icon('help', 16)}<div><b>Builder idle</b><small>Tap a building</small></div></div>`);
  }
  if (S.training) { const tr = S.training, [ty, ti] = tparse(tr.k); rows.push(`<div class="q" data-act="speed" data-kind="t">${ART.troop(ty, ti, 18)}<div><b>${fmt(tr.n)} ${TROOP[ty].name}</b>${bar(1 - (tr.end - t) / tr.total)}<small>${fmtT((tr.end - t) / 1000)}</small></div></div>`); }
  else rows.push(`<div class="q idle" data-act="bld" data-key="barracks">${ART.troop('inf', 1, 18)}<div><b>Barracks idle</b><small>Train troops</small></div></div>`);
  if (S.rq) rows.push(`<div class="q" data-act="speed" data-kind="r">${ART.icon('scroll', 16)}<div><b>${TECHM[S.rq.id].name}</b>${bar(1 - (S.rq.end - t) / S.rq.total)}<small>${fmtT((S.rq.end - t) / 1000)}</small></div></div>`);
  else if (S.b.academy) rows.push(`<div class="q idle" data-act="tab" data-tab="research">${ART.icon('scroll', 16)}<div><b>Research idle</b><small>Study a science</small></div></div>`);
  for (const m of S.marches) {
    const end = m.state === 'out' ? m.arrive : m.state === 'gather' ? m.gend : m.back, st = m.state === 'out' ? m.start : m.state === 'gather' ? m.gstart : m.bstart;
    rows.push(`<div class="q march" data-act="march" data-id="${m.id}">${ART.icon(m.kind === 'gather' ? (m.res || 'crate') : m.kind === 'scout' ? 'scroll' : 'might', 16)}<div><b>${{ gather: 'Gathering', attack: 'Attack', scout: 'Scout' }[m.kind]} · ${m.state === 'back' ? 'returning' : m.state === 'gather' ? 'gathering' : 'marching'}</b>${bar((t - st) / Math.max(1, end - st), 'teal')}<small>${fmtT((end - t) / 1000)}</small></div></div>`);
  }
  $('#queues').innerHTML = rows.join('');
}

/* ======================= City view ======================= */
function renderCity() {
  const items = [];
  for (const [id, [x, y]] of Object.entries(INNER)) {
    const L = S.b[id] || 0, d = BLD[id], locked = d.unlock > S.b.citadel, q = inQueue(id);
    items.push({ y, html: `<g class="bld ${locked ? 'locked' : ''} ${L ? '' : 'unbuilt'}" data-act="bld" data-key="${id}" transform="translate(${x} ${y})">${L ? ART.building(id, L) : ART.building('empty')}${q ? `<g class="hammer"><circle cx="0" cy="-60" r="13" fill="#1b1430"/><path d="M-6-62l8-8 4 4-8 8zM0-64l6 6" stroke="#ffd36b" stroke-width="2.5"/></g>` : ''}<g transform="translate(0 22)"><rect x="-44" y="-9" width="88" height="17" rx="8.5" fill="#1b1430cc"/><text y="3.5" text-anchor="middle">${locked ? '🔒 ' : ''}${d.name.replace('House of Wisdom', 'Wisdom').replace('Sandstone ', '').replace('Treasury ', '').replace('House ', '')}${L ? ' ' + L : ''}</text></g></g>` });
  }
  const open = openPlots();
  FIELD_POS.forEach(([x, y], i) => {
    const f = S.fields[i], key = 'f' + i, q = inQueue(key);
    if (i >= open) { items.push({ y, html: `<g class="bld locked" transform="translate(${x} ${y})" data-act="lockedfield" data-n="${Math.ceil((i - 3) / 2)}">${ART.building('empty')}<text y="28" text-anchor="middle" class="lbl">🔒</text></g>` }); return; }
    items.push({ y, html: `<g class="bld" data-act="field" data-i="${i}" transform="translate(${x} ${y})">${f ? ART.building(f.t, f.l) : ART.building('empty')}${q ? `<g class="hammer"><circle cx="0" cy="-38" r="11" fill="#1b1430"/><path d="M-5-40l7-7 3 3-7 7z" stroke="#ffd36b" stroke-width="2"/></g>` : ''}${f && f.l ? `<g transform="translate(0 20)"><circle r="10" fill="#1b1430cc"/><text y="4" text-anchor="middle">${f.l}</text></g>` : ''}</g>` });
  });
  items.sort((a, b) => a.y - b.y);
  const banner = `<g transform="translate(500 92)"><path d="M0 0v-40" stroke="#5a3418" stroke-width="3"/><path d="M0-40h40l-8 9 8 9H0z" fill="${S.color}"/></g>`;
  const smoke = S.queue.length ? '<circle class="dust" cx="500" cy="300" r="40"/>' : '';
  const troopsN = troopCount(S.troops);
  const camp = troopsN ? `<g transform="translate(560 540)" class="bld" data-act="tab" data-tab="army">${Array.from({ length: Math.min(6, Math.ceil(troopsN / 150)) }, (_, i) => `<g transform="translate(${(i % 3) * 30} ${Math.floor(i / 3) * 22})"><path d="M-10 10l10-18 10 18z" fill="#f2ede4"/><path d="M0-8v-6" stroke="#5a3418"/><path d="M0-14l6 2-6 2z" fill="${S.color}"/></g>`).join('')}<text x="30" y="56" text-anchor="middle" class="lbl">${fmt(troopsN)} troops</text></g>` : '';
  const cv = $('#cityView'), first = !cv.firstChild;
  cv.innerHTML = `<svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet" id="citySvg">${ART.cityBg()}${banner}${smoke}${items.map(i => i.html).join('')}${camp}</svg>`;
  if (first) cv.scrollLeft = (cv.scrollWidth - cv.clientWidth) / 2;
}
function openField(i) {
  const f = S.fields[i], key = 'f' + i;
  if (!f) {
    openSheet('Empty field', `<p class="muted">Choose what to build on this plot.</p><div class="pick">${FIELD_TYPES.map(t => { const c = costOf(t, 1); return `<button class="card-btn" data-act="buildfield" data-i="${i}" data-t="${t}"><svg viewBox="-60 -50 120 80" width="96" height="64">${ART.building(t, 1)}</svg><b>${BLD[t].name}</b><small>${ART.icon(BLD[t].field, 14)} +${fmt(fieldRate(1))}/h</small><span class="costs">${costHTML(c)}</span></button>`; }).join('')}</div>`);
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
  if (id === 'embassy' && L) extra = `<p>Each building or research gets <b>${2 + L}</b> helps from your House, each cutting 3% (at least 30s).</p>`;
  if (id === 'market' && L) extra = marketHTML();
  if (id === 'mews' && L) extra = `<p>Hero level cap: <b>${heroCap()}</b> · March size: <b>${fmt(marchCap())}</b> troops.</p><button class="btn" data-act="tab" data-tab="heroes">Open Heroes</button>`;
  if (id === 'academy' && L) extra = `<button class="btn" data-act="tab" data-tab="research">Open research</button>`;
  const head = `<div class="bhead"><svg viewBox="-80 -130 160 160" width="120" height="120">${L ? ART.building(id, L) : ART.building('empty')}</svg><div><p>${d.desc}</p><p class="lvl">Level <b>${L}</b> / ${d.max}</p></div></div>`;
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
  S.gems -= g; for (const k in c) S.res[k] = Math.max(0, S.res[k] - c[k]);
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
    ${kind === 'b' && left <= freeLimit ? `<button class="btn gold" data-act="usesp" data-kind="b" data-key="${key}" data-i="free">Finish free</button>` : ''}
    <div class="btns">${its || '<span class="muted">No hourglasses in your bag.</span>'}</div>
    <button class="btn gold" data-act="usesp" data-kind="${kind}" data-key="${key || ''}" data-i="gems">${ART.icon('gem', 14)} ${gemCost(left)} Finish now</button>`);
}

/* ======================= Army tab ======================= */
function renderArmy() {
  const all = {}; for (const m of S.marches) for (const [k, n] of Object.entries(m.troops)) all[k] = (all[k] || 0) + n;
  return `<h2>Army</h2><div class="cards">${TYPES.map(t => `<div class="card"><h4>${TROOP[t].name}</h4><p class="muted">${TROOP[t].role}</p>${TIERS.map(n => `<div class="trow">${ART.troop(t, n, 40)}<div><b>${fmt(S.troops[tkey(t, n)] || 0)}</b> at home${all[tkey(t, n)] ? ` · ${fmt(all[tkey(t, n)])} marching` : ''}${S.wounded[tkey(t, n)] ? ` · <span class="neg">${fmt(S.wounded[tkey(t, n)])} wounded</span>` : ''}</div></div>`).join('')}</div>`).join('')}</div>
  <div class="card"><h4>Counters</h4><p>Spearmen beat Camel Riders · Camel Riders beat Dune Archers · Dune Archers beat Spearmen. Ballistae shine against Ramparts.</p><p>Total might from troops: ${ART.icon('might', 14)} ${fmt(troopMight(S.troops))} · Grain upkeep ${fmt(rates().upkeep)}/h</p>
  <button class="btn gold" data-act="bld" data-key="barracks">Train troops</button> ${S.b.infirmary ? '<button class="btn" data-act="bld" data-key="infirmary">Infirmary</button>' : ''}</div>`;
}

/* ======================= Heroes tab ======================= */
function renderHeroes() {
  const owned = HEROES.filter(h => S.heroes[h.id] && S.heroes[h.id].stars > 0), rest = HEROES.filter(h => !owned.includes(h));
  const card = h => { const st = S.heroes[h.id] || { lvl: 0, stars: 0, shards: 0 }; const own = st.stars > 0; return `<button class="hero ${own ? '' : 'dim'} ${S.squad.includes(h.id) ? 'insq' : ''}" data-act="hero" data-id="${h.id}">${ART.portrait(h, 76)}<b>${h.name}</b><small>${h.role}${own ? ` · Lv ${st.lvl}` : ''}</small><span class="stars">${own ? '★'.repeat(st.stars) : `${st.shards}/${STAR_SHARDS[1]} shards`}</span></button>`; };
  return `<h2>Heroes</h2><div class="squad"><span>Squad</span>${[0, 1, 2].map(i => S.squad[i] ? `<span class="slot">${ART.portrait(HERO[S.squad[i]], 44)}</span>` : '<span class="slot empty">+</span>').join('')}<span class="muted">Squad leads your armies: +${(squadBonus() * 100).toFixed(1)}% troop ATK</span></div>
  <div class="heroes">${owned.map(card).join('')}${rest.map(card).join('')}</div>
  <div class="card stagecard"><div><h3>${ART.icon('vigor', 18)} Hero Trials</h3><p class="muted">Lead your squad through the sands. Each stage costs 6 Vigor. Vigor: <b>${S.vigor}</b> / ${60 + S.b.mews * 2}</p></div><button class="btn gold" data-act="stages">Open campaign</button></div>`;
}
function openHero(id) {
  const h = HERO[id], st = S.heroes[id] || { lvl: 0, stars: 0, shards: 0, xp: 0 }, own = st.stars > 0;
  const s = own ? heroStats(id) : { hp: h.hp, atk: h.atk, def: h.def, spd: h.spd };
  const need = STAR_SHARDS[st.stars + 1], xpNeed = xpFor(st.lvl);
  const tutor = Math.floor(150 * st.lvl * st.lvl);
  openSheet(`${h.name}`, `<div class="bhead">${ART.portrait(h, 110)}<div><p><b>${h.title}</b> · ${h.role}</p><p class="stars big">${own ? '★'.repeat(st.stars) + '☆'.repeat(5 - st.stars) : 'Not recruited'}</p>${own ? `<p>Level ${st.lvl} / ${heroCap()}</p>${bar(st.xp / xpNeed, 'teal')}<small>${fmt(st.xp)} / ${fmt(xpNeed)} XP</small>` : ''}</div></div>
  <div class="stats"><span>HP ${fmt(s.hp)}</span><span>ATK ${fmt(s.atk)}</span><span>DEF ${fmt(s.def)}</span><span>SPD ${s.spd}</span></div>
  <div class="card"><h4>${ART.icon('vigor', 14)} ${h.skill.name}</h4><p>${h.skill.desc}</p></div>
  <p>Shards: <b>${st.shards}</b>${need ? ` / ${need} for ${own ? 'next star' : 'recruit'}` : ''}. <span class="muted">Win Hero Trials and bandit camps to find shards.</span></p>
  <div class="btns">
  ${need && st.shards >= need ? `<button class="btn gold" data-act="star" data-id="${id}">${own ? 'Raise star' : 'Recruit'}</button>` : ''}
  ${own ? `<button class="btn" data-act="squad" data-id="${id}">${S.squad.includes(id) ? 'Remove from squad' : 'Add to squad'}</button>
  <button class="btn" data-act="tome" data-id="${id}" ${S.items.scroll ? '' : 'disabled'}>${ART.icon('scroll', 14)} Use Hero Tome (${S.items.scroll || 0})</button>
  <button class="btn" data-act="tutor" data-id="${id}">${ART.icon('gold', 14)} ${fmt(tutor)} Tutor (+${fmt(xpNeed * .5)} XP)</button>` : ''}</div>`);
}
const xpFor = l => Math.floor(120 * Math.pow(Math.max(1, l), 1.55));
function heroXP(id, xp) {
  const h = S.heroes[id]; if (!h || !h.stars) return;
  h.xp += xp; while (h.lvl < heroCap() && h.xp >= xpFor(h.lvl)) { h.xp -= xpFor(h.lvl); h.lvl++; }
  if (h.lvl >= heroCap()) h.xp = Math.min(h.xp, xpFor(h.lvl));
}

/* ======================= Hero Trials (campaign battle) ======================= */
function stageFoes(ch, n) {
  const C = CHAPTERS[ch - 1], idx = (ch - 1) * 6 + n - 1, k = 2 * (1 + idx * .25 + idx * idx * STAGE_K);
  const mk = (kind, mult = 1, name) => { const f = FOES[kind]; return { id: kind + Math.random(), name: name || f.name, kind, hp: Math.round(f.hp * k * mult), max: Math.round(f.hp * k * mult), atk: Math.round(f.atk * k * (mult > 1 ? 1.15 : 1)), def: Math.round(f.def * k * .6), spd: f.spd, en: 0, foe: true }; };
  if (n === 6) return [mk(C.foes[0]), mk(C.boss.kind, C.boss.hp, C.boss.name), mk(C.foes[1])];
  return [0, 1, 2].map(i => mk(C.foes[(i + n) % 3]));
}
function openStages() {
  const html = CHAPTERS.map((C, ci) => {
    const unlocked = ci === 0 || S.stages[`${ci}-6`];
    return `<div class="chapter ${unlocked ? '' : 'locked'}"><h4>Chapter ${ci + 1} · ${C.name}</h4><div class="stages">${[1, 2, 3, 4, 5, 6].map(n => {
      const key = `${ci + 1}-${n}`, prev = n === 1 ? unlocked : S.stages[`${ci + 1}-${n - 1}`], stars = S.stages[key] || 0, shard = STAGE_SHARD[key];
      return `<button class="stage ${n === 6 ? 'boss' : ''} ${prev ? '' : 'locked'}" data-act="stage" data-key="${key}" ${prev ? '' : 'disabled'}><b>${key}</b><span>${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>${shard ? `<small>${HERO[shard].name.split(' ')[0]}</small>` : ''}</button>`;
    }).join('')}</div></div>`;
  }).join('');
  openSheet(`${ART.icon('vigor', 18)} Hero Trials · Vigor ${S.vigor}`, html + (S.items.vigor ? `<button class="btn" data-act="usevigor">${ART.icon('vigor', 14)} Drink Qahwa Flask (${S.items.vigor})</button>` : ''), true);
}
let fight = null;
let STAGE_K = .004;
function startStage(key) {
  if (S.vigor < 6) return toast('Not enough Vigor — rest a while or drink a Qahwa Flask', 'bad');
  const squad = S.squad.filter(id => S.heroes[id] && S.heroes[id].stars > 0); if (!squad.length) return toast('Pick heroes for your squad', 'bad');
  S.vigor -= 6; const [ch, n] = key.split('-').map(Number);
  const heroes = squad.map(id => { const s = heroStats(id); return { id, name: HERO[id].name.split(' ')[0], hero: HERO[id], hp: s.hp, max: s.hp, atk: s.atk, def: s.def, spd: s.spd, en: 20 }; });
  fight = { key, heroes, foes: stageFoes(ch, n), turn: 0, buff: 0, shield: 0, auto: !!S.autoSkill, over: false, log: [] };
  closeSheet(); $('#battle').hidden = false; drawFight(); fight.timer = setInterval(fightStep, 520);
}
function drawFight() {
  const f = fight, unit = (u, side) => `<div class="unit ${u.hp <= 0 ? 'dead' : ''} ${u.stun ? 'stun' : ''}" id="u-${side}-${u.id}" ${side === 'h' && u.hp > 0 ? `data-act="cast" data-id="${u.id}"` : ''}>${side === 'h' ? ART.portrait(u.hero, 84) : ART.enemy(u.kind, 84)}<b>${esc(u.name)}</b>${bar(u.hp / u.max, 'hp')}${side === 'h' ? bar(u.en / 100, 'en' + (u.en >= 100 ? ' full' : '')) : ''}</div>`;
  $('#battle').innerHTML = `<div class="bfield"><div class="btop"><b>Stage ${f.key}</b><span>${f.shield ? '🛡 Bastion ' : ''}${f.buff ? '✦ Star Chart' : ''}</span><label><input type="checkbox" data-act="auto" ${f.auto ? 'checked' : ''}> Auto skills</label></div>
    <div class="row foes">${f.foes.map(u => unit(u, 'f')).join('')}</div><div class="vs">VS</div><div class="row mine">${f.heroes.map(u => unit(u, 'h')).join('')}</div>
    <p class="hint">Tap a hero when the gold bar is full to unleash their skill.</p></div>`;
}
const alive = a => a.filter(u => u.hp > 0);
function hitFx(side, id, txt, cls = '') { const el = document.getElementById(`u-${side}-${id}`); if (!el) return; const n = document.createElement('span'); n.className = 'dmg ' + cls; n.textContent = txt; el.appendChild(n); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); setTimeout(() => n.remove(), 900); }
function dealTo(target, raw, side) {
  let d = Math.max(1, Math.round(raw * raw / (raw + target.def * 1.2) * (0.9 + Math.random() * .2)));
  if (side === 'h' && fight.shield) d = Math.round(d * .5);
  target.hp = Math.max(0, target.hp - d); if (side === 'h') target.en = Math.min(100, target.en + 8);
  hitFx(side, target.id, '-' + fmt(d)); return d;
}
function castSkill(u) {
  const f = fight, sk = u.hero.skill, atk = u.atk * (f.buff ? 1.4 : 1); u.en = 0; sfx('skill');
  const foes = alive(f.foes);
  if (sk.kind === 'aoe' || sk.kind === 'stun') foes.forEach(t => { dealTo(t, atk * sk.mult, 'f'); if (sk.kind === 'stun') t.stun = 1; });
  else if (sk.kind === 'single' && foes[0]) dealTo(foes[0], atk * sk.mult, 'f');
  else if (sk.kind === 'crit' && foes.length) dealTo(foes.reduce((a, b) => a.hp < b.hp ? a : b), atk * sk.mult, 'f');
  else if (sk.kind === 'heal') alive(f.heroes).forEach(h => { const v = Math.round(atk * sk.mult); h.hp = Math.min(h.max, h.hp + v); hitFx('h', h.id, '+' + fmt(v), 'heal'); });
  else if (sk.kind === 'shield') { f.shield = 3; }
  else if (sk.kind === 'buff') { f.buff = 3; }
  const el = document.getElementById('u-h-' + u.id); if (el) { const b = document.createElement('div'); b.className = 'skillname'; b.textContent = sk.name; el.appendChild(b); setTimeout(() => b.remove(), 1100); }
}
function fightStep() {
  const f = fight; if (!f || f.over) return;
  const order = [...alive(f.heroes).map(u => ['h', u]), ...alive(f.foes).map(u => ['f', u])].sort((a, b) => b[1].spd - a[1].spd);
  for (const [side, u] of order) {
    if (u.hp <= 0) continue;
    if (side === 'h') {
      if (u.en >= 100 && f.auto) { castSkill(u); continue; }
      const t = alive(f.foes)[0]; if (!t) break; dealTo(t, u.atk * (f.buff ? 1.4 : 1), 'f'); u.en = Math.min(100, u.en + 22);
    } else {
      if (u.stun) { u.stun = 0; continue; }
      const hs = alive(f.heroes); if (!hs.length) break;
      const tank = hs.find(h => h.hero.role === 'Tank'); const t = tank && Math.random() < .6 ? tank : pick(hs);
      dealTo(t, u.atk, 'h');
    }
  }
  if (f.shield) f.shield--; if (f.buff) f.buff--;
  f.turn++; sfx('hit');
  drawFight();
  const win = !alive(f.foes).length, lose = !alive(f.heroes).length || f.turn > 90;
  if (win || lose) endFight(win);
}
function endFight(win) {
  const f = fight; f.over = true; clearInterval(f.timer);
  const [ch, n] = f.key.split('-').map(Number), idx = (ch - 1) * 6 + n;
  let html;
  if (win) {
    const fallen = f.heroes.filter(h => h.hp <= 0).length, stars = 3 - Math.min(2, fallen), first = !S.stages[f.key];
    S.stages[f.key] = Math.max(S.stages[f.key] || 0, stars); S.stats.stageWins++;
    const xp = 60 + idx * 30; f.heroes.forEach(h => heroXP(h.id, xp));
    const r = { gold: 200 + idx * 120 }; if (first) r.gems = 10 + idx * 2;
    const sh = STAGE_SHARD[f.key]; if (sh && (first || Math.random() < .5)) r.shards = { [sh]: first ? 5 : 1 + Math.floor(Math.random() * 2) };
    else if (Math.random() < .3) r.shards = { [pick(HEROES).id]: 1 };
    if (n === 6 && first) r.items = { sp60: 1, vigor: 1 };
    html = `<h2 class="win">Victory</h2><p class="stars big">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</p><p>Each hero +${xp} XP</p><p>${give(r)}</p>`; sfx('win');
  } else { html = '<h2 class="loss">Defeat</h2><p>Level up your heroes, raise their stars or change your squad.</p>'; sfx('loss'); }
  const box = document.createElement('div'); box.className = 'result'; box.innerHTML = html + '<button class="btn gold" data-act="closefight">Continue</button>'; $('#battle .bfield').appendChild(box);
}

/* ======================= Research tab ======================= */
function renderResearch() {
  if (!S.b.academy) return '<h2>Research</h2><div class="card"><p>Build the <b>House of Wisdom</b> (unlocks at Citadel 2) to start research.</p><button class="btn gold" data-act="bld" data-key="academy">Go to House of Wisdom</button></div>';
  const tree = name => TECH.filter(t => t.tree === name).map(t => {
    const l = S.tech[t.id] || 0, to = l + 1, done = l >= t.max, c = done ? {} : techCost(t, to), need = techNeed(t, to), lock = S.b.academy < need || (t.req && !S.tech[t.req]);
    return `<div class="tech ${done ? 'done' : ''} ${lock ? 'locked' : ''}"><div><b>${t.name}</b> <span class="muted">${l}/${t.max}</span><p>${t.desc}</p>${done ? '<p class="good">Complete</p>' : `<div class="costs">${costHTML(c)}<span class="cost">${ART.icon('clock', 14)}${fmtT(techTime(t, to))}</span></div>${lock ? `<p class="why">${t.req && !S.tech[t.req] ? 'Requires ' + TECHM[t.req].name : 'Needs House of Wisdom ' + need}</p>` : ''}`}</div>${!done && !lock ? `<button class="btn gold" data-act="research" data-id="${t.id}" ${S.rq ? 'disabled' : ''}>Study</button>` : ''}</div>`;
  }).join('');
  return `<h2>Research</h2>${S.rq ? `<div class="card"><b>Studying ${TECHM[S.rq.id].name} ${S.rq.to}</b>${bar(1 - (S.rq.end - now()) / S.rq.total, 'teal')}<button class="btn" data-act="speed" data-kind="r">Speed up · ${fmtT((S.rq.end - now()) / 1000)}</button></div>` : ''}
  <div class="cols"><div><h3>Economy</h3>${tree('Economy')}</div><div><h3>Military</h3>${tree('Military')}</div></div>`;
}

/* ======================= Quests tab ======================= */
function renderQuests() {
  const q = QUESTS[S.quest], ready = q && q.c(S), chest = now() >= S.chestAt;
  const rw = r => Object.entries(r).map(([k, v]) => k === 'items' ? Object.entries(v).map(([i, n]) => `${ART.icon(ITEMS[i].icon, 14)}${n}× ${ITEMS[i].name}`).join(' ') : `${ART.icon(k === 'gems' ? 'gem' : k, 14)}${fmt(v)}`).join(' ');
  return `<h2>Quests</h2>
  <div class="card chest ${chest ? 'ready' : ''}">${ART.icon('chest', 42)}<div><h4>Caravan chest</h4><p class="muted">A merchant caravan brings supplies every 6 hours.</p></div>${chest ? '<button class="btn gold" data-act="chest">Open</button>' : `<span class="muted">${fmtT((S.chestAt - now()) / 1000)}</span>`}</div>
  ${q ? `<div class="card quest ${ready ? 'ready' : ''}"><small>Story quest ${S.quest + 1} / ${QUESTS.length}</small><h4>${q.t}</h4><p>Reward: ${rw(q.r)}</p>${ready ? '<button class="btn gold" data-act="claim">Claim</button>' : '<span class="muted">In progress</span>'}</div>` : '<div class="card"><h4>Every story quest complete. You rule the sands!</h4></div>'}
  <div class="card"><h4>Upcoming</h4>${QUESTS.slice(S.quest + 1, S.quest + 4).map(x => `<p class="muted">· ${x.t}</p>`).join('') || '<p class="muted">—</p>'}</div>
  <div class="card"><h4>Rankings · Might</h4><ol class="rank">${ranking().map(r => `<li class="${r.me ? 'me' : ''}"><span style="color:${r.color}">■</span> ${esc(r.name)} <b>${fmt(r.m)}</b></li>`).join('')}</ol></div>`;
}
function ranking() {
  const list = S.world.filter(o => o.kind === 'city').map(o => ({ name: o.name, color: o.color, m: troopMight(o.troops) + o.lvl * o.lvl * 400 }));
  list.push({ name: S.name + ' (you)', color: S.color, m: might(), me: true });
  return list.sort((a, b) => b.m - a.m);
}
function claimQuest() { const q = QUESTS[S.quest]; if (!q || !q.c(S)) return; give(q.r, 'Quest reward'); S.quest++; burst(); sfx('win'); render(); }
function openChest() { if (now() < S.chestAt) return; S.chestAt = now() + 6 * 3600e3; const r = { gems: 25, items: { [pick(['sp5', 'sp5', 'crate', 'scroll', 'vigor', 'sp60'])]: 1 } }; r[pick(['grain', 'timber', 'stone', 'ore'])] = 2000 + S.b.citadel * 600; give(r, 'Caravan chest'); burst(); render(); }

/* ======================= House tab ======================= */
function renderHouse() {
  return `<h2>House of the Dawn Falcon</h2>
  <div class="card house">${ART.emblem(56)}<div><p>Your House: 12 members · Honor <b>${fmt(S.house.honor)}</b> · Helps received <b>${fmt(S.house.helpsGot || 0)}</b></p><p class="muted">${S.b.embassy ? 'Members help your builds and research automatically.' : 'Build the House Embassy (Citadel 4) so members can speed your timers.'}</p></div></div>
  <div class="card"><h4>Help requests (${S.house.requests.length})</h4>${S.house.requests.map(r => `<p>${esc(r.from)} · ${esc(r.what)}</p>`).join('') || '<p class="muted">Nobody needs help right now.</p>'}${S.house.requests.length ? '<button class="btn gold" data-act="helpall">Help all (+10 Honor each)</button>' : ''}</div>
  <div class="card"><h4>Honor shop</h4><div class="btns"><button class="btn" data-act="hshop" data-i="sp5" data-c="60">${ART.icon('clock', 14)} 5-min Hourglass · 60</button><button class="btn" data-act="hshop" data-i="crate" data-c="150">${ART.icon('crate', 14)} Caravan Crate · 150</button><button class="btn" data-act="hshop" data-i="scroll" data-c="120">${ART.icon('scroll', 14)} Hero Tome · 120</button></div></div>
  <div class="card chat"><h4>House chat</h4>${S.house.chat.slice(-12).reverse().map(c => `<p><b class="${c.from === 'Herald' ? 'good' : ''}">${esc(c.from)}:</b> ${esc(c.t)}</p>`).join('') || '<p class="muted">Quiet in the hall…</p>'}
  <form data-act="chat" class="chatform"><input name="m" maxlength="80" placeholder="Say something to your House"><button class="btn">Send</button></form></div>`;
}

/* ======================= Bag & shop ======================= */
function renderBag() {
  const own = Object.entries(S.items).filter(([, n]) => n > 0);
  return `<h2>Bag</h2><div class="items">${own.map(([i, n]) => `<div class="item">${ART.icon(ITEMS[i].icon, 34)}<b>${ITEMS[i].name}</b><small>${ITEMS[i].desc}</small><span>×${n}</span>${['shield', 'crate', 'vigor', 'builder', 'gift'].includes(i) ? `<button class="mini" data-act="use" data-i="${i}">Use</button>` : ''}</div>`).join('') || '<p class="muted">Empty.</p>'}</div>
  <h2>Gem shop</h2><p class="muted">Gems are earned by playing: quests, trials, camps and defending your city. No real money.</p><div class="items">${Object.entries(ITEMS).filter(([, d]) => d.gems).map(([i, d]) => `<div class="item">${ART.icon(d.icon, 34)}<b>${d.name}</b><small>${d.desc}</small><button class="mini gold" data-act="buy" data-i="${i}">${ART.icon('gem', 12)} ${d.gems}</button></div>`).join('')}</div>`;
}
function useItem(i) {
  if (!S.items[i]) return;
  if (i === 'shield') { S.shieldUntil = Math.max(now(), S.shieldUntil) + 8 * 3600e3; toast('Mirage Veil raised for 8 hours', 'good'); }
  else if (i === 'crate') { const k = pick(['grain', 'timber', 'stone', 'ore']); S.res[k] += 5000; toast(`+5,000 ${RNAME[k]}`, 'good'); }
  else if (i === 'vigor') { S.vigor += 30; toast('+30 Vigor', 'good'); }
  else if (i === 'builder') { S.builderUntil = Math.max(now(), S.builderUntil) + 24 * 3600e3; toast('A second builder joined for 24h', 'good'); }
  else if (i === 'gift') { const r = pick([{ gems: 10 }, { items: { sp5: 1 } }, { gold: 2500 }, { items: { scroll: 1 } }, { shards: { [pick(HEROES).id]: 2 } }, { ore: 1500 }]); S.items[i]--; give(r, 'House Gift'); render(); return; }
  S.items[i]--; sfx('done'); render();
}

/* ======================= World map (canvas) ======================= */
const cam = { x: 0, y: 0, z: 1 }; let mapSel = null, mapDirty = true;
const TS = 64;
function centerOn(x, y) { const c = $('#map'); cam.x = x * TS * cam.z - c.clientWidth / 2 + TS * cam.z / 2; cam.y = y * TS * cam.z - c.clientHeight / 2 + TS * cam.z / 2; }
function drawMap() {
  const c = $('#map'); if (!c || c.offsetParent === null) return;
  const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
  if (c.width !== w * dpr || c.height !== h * dpr) { c.width = w * dpr; c.height = h * dpr; }
  const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const s = TS * cam.z; ctx.fillStyle = '#b98a52'; ctx.fillRect(0, 0, w, h);
  const x0 = Math.max(0, Math.floor(cam.x / s)), y0 = Math.max(0, Math.floor(cam.y / s)), x1 = Math.min(W, Math.ceil((cam.x + w) / s)), y1 = Math.min(H, Math.ceil((cam.y + h) / s));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const px = x * s - cam.x, py = y * s - cam.y, n = rng(S.seed + x * 131 + y * 7919)();
    const dc = Math.hypot(x - 20, y - 20);
    ctx.fillStyle = dc < 3.2 ? '#3fae9f' : dc < 4.2 ? '#cfe0a0' : `hsl(${34 + n * 6},${52 + n * 10}%,${62 + n * 8}%)`;
    ctx.fillRect(px, py, s + 1, s + 1);
    if (dc >= 4.2 && n > .55) { ctx.strokeStyle = '#c99e6380'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + s * .1, py + s * .7); ctx.quadraticCurveTo(px + s * .5, py + s * (.4 + n * .2), px + s * .9, py + s * .7); ctx.stroke(); }
    if (dc >= 3.2 && dc < 5 && n > .4) ART.mapPaint.palm(ctx, px + s * .5, py + s * .6, s * .9);
    else if (n > .965) ART.mapPaint.palm(ctx, px + s * .5, py + s * .6, s * .8);
  }
  ctx.strokeStyle = '#00000014'; ctx.lineWidth = 1;
  for (let x = x0; x <= x1; x++) { ctx.beginPath(); ctx.moveTo(x * s - cam.x, 0); ctx.lineTo(x * s - cam.x, h); ctx.stroke(); }
  for (let y = y0; y <= y1; y++) { ctx.beginPath(); ctx.moveTo(0, y * s - cam.y); ctx.lineTo(w, y * s - cam.y); ctx.stroke(); }
  // marches
  for (const m of S.marches) {
    const a = { x: (S.home.x + .5) * s - cam.x, y: (S.home.y + .5) * s - cam.y }, b = { x: (m.tx + .5) * s - cam.x, y: (m.ty + .5) * s - cam.y };
    ctx.strokeStyle = m.kind === 'attack' ? '#ff5e3acc' : m.kind === 'scout' ? '#9fc3e6cc' : '#3fd7c8cc'; ctx.setLineDash([6, 6]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
    let p = 1; const t = now(); if (m.state === 'out') p = (t - m.start) / (m.arrive - m.start); else if (m.state === 'back') p = 1 - (t - m.bstart) / (m.back - m.bstart);
    p = clamp(p, 0, 1); const mx = a.x + (b.x - a.x) * p, my = a.y + (b.y - a.y) * p;
    ctx.fillStyle = S.color; ctx.beginPath(); ctx.arc(mx, my, 7 * cam.z + 2, 0, 7); ctx.fill(); ctx.strokeStyle = '#1b1430'; ctx.lineWidth = 2; ctx.stroke();
  }
  if (S.incoming) { const o = S.world.find(w => w.id === S.incoming.from); if (o) { const p = clamp(1 - (S.incoming.arrive - now()) / ((60 + S.b.tower * 15) * 1000), 0, 1); const a = { x: (o.x + .5) * s - cam.x, y: (o.y + .5) * s - cam.y }, b = { x: (S.home.x + .5) * s - cam.x, y: (S.home.y + .5) * s - cam.y }; ctx.strokeStyle = '#ff2b2b'; ctx.lineWidth = 3; ctx.setLineDash([10, 6]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#ff2b2b'; ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p, 8, 0, 7); ctx.fill(); } }
  // objects
  const label = (txt, x, y, col = '#1b1430cc') => { ctx.font = `700 ${Math.max(10, 11 * cam.z)}px system-ui,sans-serif`; const tw = ctx.measureText(txt).width + 10; ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - tw / 2, y - 9 * cam.z, tw, 16 * cam.z + 2, 8); ctx.fill(); ctx.fillStyle = '#f2e6cf'; ctx.textAlign = 'center'; ctx.fillText(txt, x, y + 3 * cam.z); };
  for (const o of S.world) {
    if (o.dead || o.x < x0 - 2 || o.x > x1 + 2 || o.y < y0 - 2 || o.y > y1 + 2) continue;
    const px = (o.x + .5) * s - cam.x, py = (o.y + .5) * s - cam.y;
    if (o.kind === 'node') { ART.mapPaint.node(ctx, px, py, s, o.res); if (cam.z > .6) label('L' + o.lvl, px, py + s * .38); }
    else if (o.kind === 'camp') { ART.mapPaint.camp(ctx, px, py, s); if (cam.z > .5) label('Bandits ' + o.lvl, px, py + s * .38, '#7e2f2fdd'); }
    else if (o.kind === 'city') { ART.mapPaint.city(ctx, px, py, s * 1.1, o.color, o.lvl); if (cam.z > .45) label(o.name, px, py + s * .45); }
    else if (o.kind === 'throne') { ART.mapPaint.throne(ctx, px, py, s * 1.4); label(S.throne ? 'Oasis Throne · yours' : 'Oasis Throne', px, py + s * 1.2, '#7a4fb3dd'); }
  }
  const hx = (S.home.x + .5) * s - cam.x, hy = (S.home.y + .5) * s - cam.y;
  if (S.shieldUntil > now()) { ctx.fillStyle = '#3fd7c833'; ctx.strokeStyle = '#3fd7c8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, s * .7, 0, 7); ctx.fill(); ctx.stroke(); }
  ART.mapPaint.city(ctx, hx, hy, s * 1.2, S.color, S.b.citadel); label(S.name + ' (you)', hx, hy + s * .5, '#1c6f73ee');
  if (mapSel) { ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 3; ctx.strokeRect(mapSel.x * s - cam.x + 2, mapSel.y * s - cam.y + 2, s - 4, s - 4); }
  // minimap
  const mm = 90, k = mm / W; ctx.fillStyle = '#1b1430cc'; ctx.fillRect(w - mm - 10, 10, mm, mm);
  for (const o of S.world) { if (o.dead) continue; ctx.fillStyle = o.kind === 'city' ? o.color : o.kind === 'camp' ? '#ff5e3a' : o.kind === 'throne' ? '#ffd36b' : '#c9b48a88'; ctx.fillRect(w - mm - 10 + o.x * k, 10 + o.y * k, o.kind === 'node' ? 1.5 : 3, o.kind === 'node' ? 1.5 : 3); }
  ctx.fillStyle = '#3fd7c8'; ctx.fillRect(w - mm - 10 + S.home.x * k - 1, 10 + S.home.y * k - 1, 4, 4);
  ctx.strokeStyle = '#f2e6cf'; ctx.lineWidth = 1; ctx.strokeRect(w - mm - 10 + cam.x / s * k, 10 + cam.y / s * k, w / s * k, h / s * k);
}
function mapLoop() { if (tab === 'world') { drawMap(); requestAnimationFrame(mapLoop); } }
function initMapInput() {
  const c = $('#map'); let drag = null, moved = false, pinch = null;
  const pts = new Map();
  c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 1) { drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y }; moved = false; } else if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z }; } });
  c.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; zoomAt(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2); moved = true; return; }
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 6) moved = true; cam.x = drag.cx - dx; cam.y = drag.cy - dy; clampCam(); }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) { if (drag && !moved) mapClick(e); drag = null; } };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  c.addEventListener('wheel', e => { e.preventDefault(); zoomAt(cam.z * (e.deltaY < 0 ? 1.12 : .89), e.clientX, e.clientY); }, { passive: false });
}
function zoomAt(z, sx, sy) { const c = $('#map').getBoundingClientRect(); const px = sx - c.left, py = sy - c.top; const wx = (cam.x + px) / cam.z, wy = (cam.y + py) / cam.z; cam.z = clamp(z, .35, 1.8); cam.x = wx * cam.z - px; cam.y = wy * cam.z - py; clampCam(); }
function clampCam() { const c = $('#map'), s = TS * cam.z; cam.x = clamp(cam.x, -c.clientWidth / 2, W * s - c.clientWidth / 2); cam.y = clamp(cam.y, -c.clientHeight / 2, H * s - c.clientHeight / 2); }
function mapClick(e) {
  const r = $('#map').getBoundingClientRect(), s = TS * cam.z, x = Math.floor((e.clientX - r.left + cam.x) / s), y = Math.floor((e.clientY - r.top + cam.y) / s);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  mapSel = { x, y }; sfx('click');
  if (x === S.home.x && y === S.home.y) return openTab('city');
  const o = S.world.find(w => !w.dead && (w.kind === 'throne' ? Math.abs(w.x - x) <= 1 && Math.abs(w.y - y) <= 1 : w.x === x && w.y === y));
  if (!o) return openSheet(`Desert (${x}, ${y})`, `<p class="muted">Open sand, warm wind. Nothing here — yet.</p><p>Distance from your city: ${dist(S.home, { x, y }).toFixed(1)} leagues.</p>`);
  openTile(o);
}
function openTile(o) {
  const d = dist(S.home, o), eta = fmtT(travelMs(o, {}) / 1000);
  let html = `<p class="muted">Coordinates (${o.x}, ${o.y}) · ${d.toFixed(1)} leagues · march ≈ ${eta}</p>`;
  if (o.kind === 'node') {
    html += `<div class="bhead">${ART.icon(o.res, 60)}<div><p><b>Level ${o.lvl} ${RNAME[o.res]} site</b></p><p>Remaining: ${fmt(o.amount)}</p><p class="muted">Send troops to gather. Load depends on troop type (camel riders carry the most).</p></div></div>
    <button class="btn gold" data-act="sendform" data-id="${o.id}" data-kind="gather">Gather</button>`;
  } else if (o.kind === 'camp') {
    html += `<div class="bhead">${ART.enemy('raider', 70)}<div><p><b>Bandit camp · level ${o.lvl}</b></p><p>Guards: ${troopsHTML(o.troops)}</p><p class="muted">Defeat them for Dinars, resources, House gifts and hero shards.</p></div></div>
    <button class="btn gold" data-act="sendform" data-id="${o.id}" data-kind="attack">Attack</button>`;
  } else if (o.kind === 'city') {
    html += `<div class="bhead"><svg viewBox="0 0 24 24" width="60" height="60"><rect width="24" height="24" rx="5" fill="${o.color}"/><g transform="translate(-2 -1) scale(.28)">${ART.falcon('#1b1430')}</g></svg><div><p><b>${esc(o.name)}</b> · Citadel ${o.lvl}</p><p>Might ≈ ${fmt(troopMight(o.troops) + o.lvl * o.lvl * 400)}</p><p class="muted">A rival lord. Scout first, then strike when their army is weaker than yours.</p></div></div>
    <div class="btns"><button class="btn" data-act="scout" data-id="${o.id}">Scout (${ART.icon('gold', 13)} ${fmt(200 * o.lvl)})</button><button class="btn gold" data-act="sendform" data-id="${o.id}" data-kind="attack">Attack</button></div>`;
  } else if (o.kind === 'throne') {
    html += `<div class="bhead"><svg viewBox="-60 -60 120 100" width="90" height="80">${ART.building('citadel', 12)}</svg><div><p><b>The Oasis Throne</b></p><p>${S.throne ? 'Held by you, Sovereign of the Sands.' : `Garrison: ${troopsHTML(o.troops)}`}</p><p class="muted">Whoever holds the Throne rules every dune. Its garrison is vast; wear it down with several attacks.</p></div></div>
    ${S.throne ? '' : `<button class="btn gold" data-act="sendform" data-id="${o.id}" data-kind="attack">Attack</button>`}`;
  }
  openSheet(o.kind === 'city' ? esc(o.name) : o.kind === 'node' ? `${RNAME[o.res]} site` : o.kind === 'camp' ? 'Bandit camp' : 'Oasis Throne', html);
}
function scout(id) {
  const o = S.world.find(w => w.id === id), c = { gold: 200 * o.lvl }; if (!afford(c)) return toast('Not enough Dinars', 'bad');
  if (S.marches.length >= maxMarches()) return toast('All march slots are busy', 'bad');
  pay(c); sendMarch(o, 'scout', {});
}
let sendSel = {};
function openSend(id, kind) {
  const o = S.world.find(w => w.id === id); if (!o) return;
  const home = Object.entries(S.troops).filter(([, n]) => n > 0);
  if (!home.length) return openSheet('No troops', '<p>Your army is empty. Train troops in the Barracks.</p><button class="btn gold" data-act="bld" data-key="barracks">Barracks</button>');
  const capN = marchCap(); sendSel = {}; let left = capN;
  // sensible default: for gather prefer riders; for attack send a balanced share
  for (const [k, n] of home.sort((a, b) => kind === 'gather' ? TROOP[tparse(b[0])[0]].load - TROOP[tparse(a[0])[0]].load : b[1] - a[1])) { const t = Math.min(n, left); sendSel[k] = t; left -= t; }
  openSheet(`${kind === 'gather' ? 'Gather' : 'Attack'} · send troops`, `<p class="muted">Max march size ${fmt(capN)} (raise Barracks and Falcon Mews). Travel ≈ ${fmtT(travelMs(o, sendSel) / 1000)}</p>
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
  openSheet('March', `<p>${{ gather: 'Gathering', attack: 'Attack', scout: 'Scout' }[m.kind]} at (${m.tx}, ${m.ty}) · ${m.state}</p>${troopsHTML(m.troops)}${Object.keys(m.loot).length ? `<p>Carrying: ${Object.entries(m.loot).map(([k, v]) => ART.icon(k, 14) + fmt(v)).join(' ')}</p>` : ''}
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
  tab = t; closeSheet();
  document.querySelectorAll('nav.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  $('#cityView').hidden = t !== 'city'; $('#worldView').hidden = t !== 'world'; $('#panel').hidden = t === 'city' || t === 'world'; $('#main').classList.toggle('panel-open', t !== 'city' && t !== 'world');
  if (t === 'world') { if (!openTab.centered) { centerOn(S.home.x, S.home.y); openTab.centered = true; } requestAnimationFrame(mapLoop); }
  render();
}
function render() {
  renderHud(); renderQueues();
  if (tab === 'city') renderCity();
  const P = { army: renderArmy, heroes: renderHeroes, research: renderResearch, quests: renderQuests, house: renderHouse, bag: renderBag }[tab];
  if (P) { const y = $('#panel').scrollTop; $('#panel').innerHTML = P(); $('#panel').scrollTop = y; }
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
    case 'tier': if (!tierOpen(+d.n)) { toast('Research this tier in the House of Wisdom'); break; } trainSel.tier = +d.n; openBuilding('barracks'); break;
    case 'train': startTraining(trainSel.t, trainSel.tier, trainSel.n); break;
    case 'heal': healAll(); break;
    case 'trade': trade(d.a, d.b); break;
    case 'hero': openHero(d.id); break;
    case 'star': { const h = S.heroes[d.id], need = STAR_SHARDS[h.stars + 1]; if (h.shards >= need) { h.shards -= need; h.stars++; if (!h.lvl) h.lvl = 1; burst(); sfx('win'); toast(`${HERO[d.id].name} ${h.stars === 1 ? 'joined your court!' : 'reached ' + h.stars + ' stars'}`, 'good'); } render(); openHero(d.id); break; }
    case 'squad': { const i = S.squad.indexOf(d.id); if (i >= 0) S.squad.splice(i, 1); else { if (S.squad.length >= 3) S.squad.shift(); S.squad.push(d.id); } render(); openHero(d.id); break; }
    case 'tome': if (S.items.scroll) { S.items.scroll--; heroXP(d.id, 600); sfx('done'); render(); openHero(d.id); } break;
    case 'tutor': { const h = S.heroes[d.id], c = Math.floor(150 * h.lvl * h.lvl); if (h.lvl >= heroCap()) { toast('Raise the Falcon Mews to lift the level cap', 'bad'); break; } if (S.res.gold < c) { toast('Not enough Dinars', 'bad'); break; } S.res.gold -= c; heroXP(d.id, xpFor(h.lvl) * .5); sfx('done'); render(); openHero(d.id); break; }
    case 'stages': openStages(); break;
    case 'stage': startStage(d.key); break;
    case 'cast': { const u = fight && fight.heroes.find(h => h.id === d.id); if (u && u.en >= 100 && !fight.over) { castSkill(u); drawFight(); } break; }
    case 'auto': break;
    case 'closefight': $('#battle').hidden = true; fight = null; render(); openStages(); break;
    case 'usevigor': useItem('vigor'); openStages(); break;
    case 'research': startResearch(d.id); break;
    case 'claim': claimQuest(); break;
    case 'chest': openChest(); break;
    case 'helpall': S.house.honor += 10 * S.house.requests.length; toast(`Helped ${S.house.requests.length} members · +${10 * S.house.requests.length} Honor`, 'good'); S.house.requests = []; sfx('done'); render(); break;
    case 'hshop': if (S.house.honor < +d.c) { toast('Not enough Honor', 'bad'); break; } S.house.honor -= +d.c; S.items[d.i] = (S.items[d.i] || 0) + 1; toast(`Bought ${ITEMS[d.i].name}`, 'good'); render(); break;
    case 'use': useItem(d.i); break;
    case 'buy': { const it = ITEMS[d.i]; if (S.gems < it.gems) { toast('Not enough gems', 'bad'); break; } S.gems -= it.gems; S.items[d.i] = (S.items[d.i] || 0) + 1; toast(`Bought ${it.name}`, 'good'); sfx('click'); render(); break; }
    case 'sendform': openSend(+d.id, d.kind); break;
    case 'go': { const o = S.world.find(w => w.id === +d.id); const tr = Object.fromEntries(Object.entries(sendSel).filter(([, n]) => n > 0)); if (troopCount(tr) > marchCap()) { toast('Too many troops for one march', 'bad'); break; } sendMarch(o, d.kind, tr); break; }
    case 'scout': scout(+d.id); break;
    case 'march': openMarch(+d.id); break;
    case 'recall': recall(+d.id); closeSheet(); break;
    case 'goto': openTab('world'); centerOn(+d.x, +d.y); mapSel = { x: +d.x, y: +d.y }; break;
    case 'home': if (tab === 'world') centerOn(S.home.x, S.home.y); else openTab('world'); break;
    case 'mail': openMail(); break;
    case 'incoming': openSheet('Incoming attack!', `<p><b>${esc(S.incoming.name)}</b> marches with about ${fmt(troopCount(S.incoming.troops) * (S.b.tower >= 3 ? 1 : 1.1))} troops. Arrives in ${fmtT((S.incoming.arrive - now()) / 1000)}.</p><p>Your defenders: ${fmt(troopCount(S.troops))} troops, Ramparts ${S.b.wall}.</p>${S.items.shield ? '<button class="btn gold" data-act="use" data-i="shield">Raise Mirage Veil</button>' : `<button class="btn gold" data-act="buy" data-i="shield">${ART.icon('gem', 12)} ${ITEMS.shield.gems} Buy Mirage Veil</button>`}`); break;
    case 'mute': muted = !muted; el.textContent = muted ? '🔇' : '🔊'; try { localStorage.setItem('rimal-muted', muted ? '1' : ''); } catch (x) { } break;
    case 'menu': openMenu(); break;
    case 'reset': if (confirm('Erase this realm and start over?')) { try { localStorage.removeItem(SAVE_KEY); } catch (x) { } location.reload(); } break;
    case 'close': closeSheet(); break;
  }
}
function onInput(e) {
  const el = e.target; const a = el.dataset.act;
  if (a === 'tn') { trainSel.n = +el.value; $('#tnv').textContent = el.value; const c = el.closest('.train'); c.querySelector('.costs').innerHTML = costHTML(trainCost(trainSel.t, trainSel.tier, trainSel.n)) + `<span class="cost">${ART.icon('clock', 15)}${fmtT(trainTime(trainSel.tier, trainSel.n))}</span>`; const b = c.querySelector('[data-act=train]'); if (b) b.textContent = `Train ${trainSel.n}`; }
  if (a === 'sendn') { sendSel[el.dataset.k] = +el.value; $('#sn-' + el.dataset.k).textContent = el.value; const go = $('[data-act=go]'); sendInfo(S.world.find(w => w.id === +go.dataset.id), go.dataset.kind); }
  if (a === 'auto') { fight.auto = el.checked; S.autoSkill = el.checked; }
}
function openMenu() {
  openSheet('Realm', `<div class="bhead">${ART.emblem(80)}<div><p><b>${esc(S.name)}</b></p><p>Might ${fmt(might())} · Citadel ${S.b.citadel}</p><p class="muted">Founded ${new Date(S.created).toLocaleDateString()}</p></div></div>
  <div class="card"><h4>How to play</h4><ul class="howto"><li>Upgrade fields to grow Grain, Timber, Stone and Ore. The Citadel caps everything else.</li><li>Train troops in the Barracks. Spearmen › Riders › Archers › Spearmen.</li><li>On the World map, gather from resource sites, crush bandit camps and scout rivals.</li><li>Lead heroes through Hero Trials to earn XP and shards. Your squad boosts every army.</li><li>From Citadel 4 rivals may raid you. Watch the warning, raise a Mirage Veil, or fight back.</li><li>Final goal: break the garrison of the Oasis Throne at the heart of the desert.</li></ul></div>
  <p class="muted">Progress is saved in this browser.</p><button class="btn" data-act="reset">Start a new realm</button>`);
}

/* ======================= start ======================= */
function start() {
  document.addEventListener('click', onAct); document.addEventListener('input', onInput);
  document.addEventListener('submit', e => { if (e.target.dataset.act === 'chat') { e.preventDefault(); const v = e.target.m.value.trim(); if (v) { S.house.chat.push({ from: S.name, t: v, at: now() }); setTimeout(() => { S.house.chat.push({ from: pick(HOUSE_NAMES), t: pick(['Well said!', 'Agreed, my lord.', 'Ha! Good one.', 'On it.', 'For the Dawn Falcon!']), at: now() }); if (tab === 'house') render(); }, 1500); render(); } } });
  $('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });
  try { muted = !!localStorage.getItem('rimal-muted'); } catch (e) { }
  $('#muteBtn').textContent = muted ? '🔇' : '🔊';
  $('#brand').innerHTML = ART.emblem(38);
  initMapInput();
  window.addEventListener('resize', () => { if (tab === 'world') clampCam(); });
  lastTick = Math.max(S.last || now(), now() - 12 * 3600e3);
  const away = (now() - lastTick) / 1000;
  tick();
  if (away > 120) toast(`Welcome back! Your realm worked for ${fmtT(away)} while you were away.`, 'good');
  openTab('city');
  setInterval(() => { tick(); renderHud(); renderQueues(); if (tab !== 'city' && tab !== 'world' && !$('#panel').contains(document.activeElement) && Math.floor(now() / 1000) % 2 === 0) render(); }, 500);
  setInterval(() => { if (tab === 'city') renderCity(); save(); }, 3000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
}
function boot() {
  S = load();
  if (S) { start(); return; }
  const colors = ['#e8a33d', '#3fd7c8', '#b3433a', '#9b7bff', '#3e8a4a', '#ff7a59'];
  $('#intro').hidden = false;
  $('#introEmblem').innerHTML = ART.emblem(120);
  $('#colors').innerHTML = colors.map((c, i) => `<button type="button" class="sw ${i ? '' : 'on'}" style="background:${c}" data-c="${c}" aria-label="Banner colour ${i + 1}"></button>`).join('');
  let color = colors[0];
  $('#colors').addEventListener('click', e => { const b = e.target.closest('.sw'); if (!b) return; color = b.dataset.c; document.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === b)); });
  $('#introForm').addEventListener('submit', e => { e.preventDefault(); const name = ($('#lordName').value.trim() || 'Lord of the Sands').slice(0, 24); S = newState(name, color); save(); $('#intro').hidden = true; sfx('horn'); start(); toast('Welcome, ' + esc(name) + '! Follow the quests to grow your realm.', 'good'); });
}
boot();
