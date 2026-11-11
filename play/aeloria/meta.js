// Aeloria: Age of Crowns — meta game: the in-game Store (deals, Crown Summon, chests, gem packs, items, VIP),
// Season Road, daily login calendar, achievements, field harvests and the quest guide.
'use strict';

/* Real-money gem packs stay switched off until the app has a payment provider.
   To enable, set window.AELORIA_PAYMENTS = { buy: packId => Promise<boolean> } before game.js loads. */
const GEM_PACKS = [
  { id: 'pouch', name: 'Pouch of Gems', gems: 300, bonus: 0, price: 'SAR 4.99' },
  { id: 'satchel', name: 'Satchel of Gems', gems: 1000, bonus: 100, price: 'SAR 14.99' },
  { id: 'chest', name: 'Chest of Gems', gems: 2200, bonus: 400, price: 'SAR 29.99', tag: 'Popular' },
  { id: 'vault', name: 'Vault of Gems', gems: 4800, bonus: 1200, price: 'SAR 59.99' },
  { id: 'treasury', name: 'Sultan\'s Treasury', gems: 13000, bonus: 4000, price: 'SAR 149.99', tag: 'Best value' }
];
const VIP_PTS = [0, 300, 1000, 2500, 6000, 12000, 25000, 50000, 100000];
const ACH = [
  { id: 'build', name: 'Master Builder', desc: 'Finish upgrades', m: S => S.stats.builds || 0, t: [5, 25, 80, 200] },
  { id: 'train', name: 'Drillmaster', desc: 'Train troops', m: S => S.stats.trained, t: [100, 1000, 10000, 100000] },
  { id: 'camps', name: 'Ash Breaker', desc: 'Defeat Ashen outposts', m: S => S.stats.camps, t: [1, 10, 40, 150] },
  { id: 'stages', name: 'Trial Champion', desc: 'Win campaign stages', m: S => S.stats.stageWins, t: [3, 15, 40, 100] },
  { id: 'might', name: 'Rising Power', desc: 'Reach Might', m: () => might(), t: [2000, 20000, 150000, 1000000] },
  { id: 'heroes', name: 'Court of Legends', desc: 'Recruit heroes', m: S => Object.values(S.heroes).filter(h => h.stars > 0).length, t: [4, 6, 8, 9] },
  { id: 'gather', name: 'Master Gatherer', desc: 'Gather resources on the map', m: S => S.stats.gathered, t: [5000, 100000, 1e6, 1e7] },
  { id: 'def', name: 'Unbroken Walls', desc: 'Win city defences', m: S => S.stats.defWins || 0, t: [1, 5, 20, 50] },
  { id: 'harvest', name: 'Bountiful Fields', desc: 'Collect harvests in the city', m: S => S.stats.harvests || 0, t: [10, 100, 500, 2000] }
];
const ACH_GEMS = [20, 50, 120, 300];
const LOGIN = [{ gems: 30 }, { items: { sp5: 3 } }, { items: { crate: 2 } }, { gems: 60 }, { items: { scroll: 3 } }, { items: { sp60: 2 } }, { tokens: 1, gems: 100 }];
const PASS_XP = 120, PASS_TIERS = 30;
const passReward = t => t % 10 === 0 ? { tokens: 1, gems: 100 } : t % 5 === 0 ? { gems: 50, items: { sp60: 1 } } : [{ gems: 20 }, { items: { sp5: 2 } }, { items: { crate: 1 } }, { items: { scroll: 1 } }, { gold: 3000 }, { items: { vigor: 1 } }][t % 6];
const SUMMON = { legendary: HEROES.filter(h => h.rarity === 'legendary').map(h => h.id), epic: HEROES.filter(h => h.rarity === 'epic').map(h => h.id), rare: HEROES.map(h => h.id), odds: { legendary: 4, epic: 21, rare: 75 }, shards: { legendary: 10, epic: 5, rare: 2 }, pity: 40, cost1: 300, cost10: 2700 };
const CHESTS = {
  bronze: { name: 'Merchant Chest', desc: '3 rewards: resources, hourglasses and tomes', cost: { gold: 6000 }, rolls: 3, color: '#c07a3a' },
  silver: { name: 'Noble Chest', desc: '4 rewards with a chance of hero shards', cost: { gems: 150 }, rolls: 4, color: '#9fc3e6' },
  gold: { name: 'Royal Chest', desc: '6 rewards, always hero shards', cost: { gems: 500 }, rolls: 6, color: '#ffd36b' }
};
const GUIDE = [['bld', 'citadel'], ['field'], ['bld', 'barracks'], ['stages'], ['bld', 'academy'], ['tab', 'research'], ['tab', 'world'], ['tab', 'world'], ['bld', 'citadel'], ['bld', 'infirmary'], ['tab', 'world'], ['stages'], ['bld', 'citadel'], ['bld', 'barracks'], ['tab', 'world'], ['tab', 'research'], ['stages'], ['bld', 'citadel'], ['tab', 'world'], ['stages'], ['bld', 'citadel'], ['stages'], ['tab', 'research'], ['stages'], ['bld', 'citadel'], ['stages'], ['tab', 'world']];
const HARVEST_MS = 150e3;

const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const vipLvl = () => { let l = 0; VIP_PTS.forEach((p, i) => { if ((S.vip || 0) >= p) l = i; }); return l; };
function spendGems(n) { S.gems -= n; S.vip = (S.vip || 0) + n; }

const META = (() => {
  function migrate(s) {
    s.vip ??= 0; s.login ??= { i: 0, last: '' }; s.pass ??= { xp: 0, claimed: {} }; s.ach ??= {}; s.pity ??= 0; s.tokens ??= 0;
    s.harvest ??= {}; s.deals ??= { day: '', bought: [] }; s.free ??= ''; s.vipDay ??= ''; s.settings ??= { music: true, sfx: true };
    for (const k of RES) if (!Number.isFinite(s.res[k])) s.res[k] = 0; if (!Number.isFinite(s.gems)) s.gems = 0;
    if (typeof LIVE !== 'undefined') LIVE.migrate(s);
    s.stats.builds ??= 0; while (s.fields.length < 24) s.fields.push(null); s.stats.defWins ??= 0; s.stats.harvests ??= 0;
    return s;
  }
  const hud = k => document.querySelector(`[data-res="${k}"]`);
  function xp(n) {
    const before = Math.floor(S.pass.xp / PASS_XP); S.pass.xp += n;
    const el = hud('pass'); if (el) { const c = FX.centerOf(el); FX.text(c.x, c.y + 18, `+${n} ✦`, 'pass'); }
    if (Math.floor(S.pass.xp / PASS_XP) > before && before < PASS_TIERS) toast(`Season Road tier ${Math.min(PASS_TIERS, before + 1)} reached — claim it in Quests`, 'good');
  }
  function grant(r, label) { // like give() but also handles summon tokens
    if (r.tokens) { S.tokens += r.tokens; const t = { ...r }; delete t.tokens; const s = give(t); const txt = [s, `${r.tokens} Crown Sigil${r.tokens > 1 ? 's' : ''}`].filter(Boolean).join(', '); if (label) toast(`${label}: ${txt}`, 'good'); return txt; }
    return give(r, label);
  }
  const rewardHTML = r => Object.entries(r).map(([k, v]) => k === 'items' ? Object.entries(v).map(([i, n]) => `<span class="rw">${ART.icon(ITEMS[i].icon, 22)}<b>${n}</b></span>`).join('') : k === 'tokens' ? `<span class="rw">${feather(22)}<b>${v}</b></span>` : k === 'shards' ? Object.entries(v).map(([h, n]) => `<span class="rw">${ART.portrait(HERO[h], 22)}<b>${n}</b></span>`).join('') : `<span class="rw">${ART.icon(k === 'gems' ? 'gem' : k, 22)}<b>${fmt(v)}</b></span>`).join('');
  const feather = s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" class="ic"><path d="M20 3C11 4 6 10 5 19l-2 2 1 1 2-2c9-1 15-6 16-15z" fill="#3fd7c8"/><path d="M6 18L18 6" stroke="#0b1b22" stroke-width="1.4"/><path d="M9 15l4 0M11 12l4 0M13 9l3 0" stroke="#0b1b22" stroke-width="1"/></svg>`;

  /* ---------- harvest bubbles ---------- */
  const harvestVal = i => { const f = S.fields[i]; return f && f.l ? Math.floor(fieldRate(f.l) / 3600 * 300 * (1 + vipLvl() * .03)) : 0; };
  const ready = i => { const f = S.fields[i]; if (!f || !f.l || inQueue('f' + i)) return false; if (S.harvest[i] == null) S.harvest[i] = now() - HARVEST_MS; return now() - S.harvest[i] >= HARVEST_MS; };
  const taxReady = () => { if (S.harvest.tax == null) S.harvest.tax = now() - HARVEST_MS; return now() - S.harvest.tax >= HARVEST_MS; };
  function bubbles() {
    let h = '';
    FIELD_POS.forEach(([x, y], i) => { if (ready(i)) { const k = BLD[S.fields[i].t].field; h += `<g class="bubble" data-act="harvest" data-i="${i}" transform="translate(${x} ${y - 46})"><circle r="30" fill="#0000"/><circle r="17" fill="#fff8e6" stroke="#e8a33d" stroke-width="3"/><g transform="translate(-11 -11)">${ART.iconSvg(k, 22)}</g><path d="M-5 16l5 7 5-7z" fill="#e8a33d"/></g>`; } });
    if (taxReady()) { const [x, y] = INNER.citadel; h += `<g class="bubble" data-act="harvest" data-i="tax" transform="translate(${x + 72} ${y - 120})"><circle r="30" fill="#0000"/><circle r="19" fill="#fff8e6" stroke="#e8a33d" stroke-width="3"/><g transform="translate(-12 -12)">${ART.iconSvg('gold', 24)}</g><path d="M-5 18l5 7 5-7z" fill="#e8a33d"/></g>`; }
    return h;
  }
  const readyCount = () => FIELD_POS.filter((_, i) => ready(i)).length + (taxReady() ? 1 : 0);
  function harvest(i, el, quiet) {
    let k, v;
    if (i === 'tax') { if (!taxReady()) return; k = 'gold'; v = Math.floor(rates().gold / 12 * (1 + vipLvl() * .03)); S.harvest.tax = now(); }
    else { i = +i; if (!ready(i)) return; k = BLD[S.fields[i].t].field; v = harvestVal(i); S.harvest[i] = now(); }
    S.res[k] += v; S.stats.harvests++; LIVE.on('harvest', 1);
    const from = el ? FX.centerOf(el) : { x: innerWidth / 2, y: innerHeight / 2 };
    FX.fly(from, hud(k), ART.icon(k, 20), quiet ? 2 : 5); FX.text(from.x, from.y - 20, `+${fmt(v)}`, 'res');
    if (Math.random() < .04) { S.gems += 2; FX.fly(from, hud('gems'), ART.icon('gem', 20), 2); }
    if (!quiet) { FX.sound('coin'); renderCity(); }
  }
  function harvestAll() {
    const els = [...document.querySelectorAll('.bubble')]; if (!els.length) return;
    els.forEach((el, n) => setTimeout(() => harvest(el.dataset.i, el, true), n * 60));
    setTimeout(() => { FX.sound('coin'); renderCity(); }, els.length * 60 + 50); xp(5);
  }

  /* ---------- quest guide ---------- */
  function guide() {
    const q = QUESTS[S.quest]; if (!q) return '';
    const done = q.c(S);
    return `<div class="guide ${done ? 'ready' : ''}">${ART.icon('scroll', 26)}<div><small>Quest ${S.quest + 1}</small><b>${q.t}</b></div>${done ? '<button class="btn gold sm" data-act="claim">Claim</button>' : '<button class="btn sm" data-act="guide">Go</button>'}</div>`;
  }
  function goGuide() {
    const g = GUIDE[S.quest]; if (!g) return;
    if (g[0] === 'bld') { openTab('city'); openBuilding(g[1]); }
    else if (g[0] === 'tab') { openTab(g[1]); if (g[1] === 'world') toast('Tap a resource site or an Ashen outpost near your city — tap the fog to explore'); }
    else if (g[0] === 'stages') { openTab('heroes'); openStages(); }
    else if (g[0] === 'field') { openTab('city'); const i = S.fields.findIndex((f, n) => !f && n < openPlots()); if (i >= 0) openField(i); }
  }

  /* ---------- daily login ---------- */
  function loginPopup(force) {
    const claimable = S.login.last !== today();
    if (!claimable && !force) return;
    openSheet('Royal Courier · 7-day rewards', `<p class="muted">Log in each day to receive the Royal Courier's gifts. Day 7 brings a Crown Sigil for the Crown Summon.</p>
      <div class="login">${LOGIN.map((r, i) => `<div class="lday ${i < S.login.i ? 'got' : ''} ${i === S.login.i && claimable ? 'now' : ''} ${i === 6 ? 'big' : ''}"><small>Day ${i + 1}</small><div>${rewardHTML(r)}</div>${i < S.login.i ? '<i>✓</i>' : ''}</div>`).join('')}</div>
      ${claimable ? '<button class="btn gold wide" data-act="login">Claim today\'s gift</button>' : '<p class="muted center">Come back tomorrow for the next gift.</p>'}`);
  }
  function claimLogin() {
    if (S.login.last === today()) return;
    const r = LOGIN[S.login.i]; grant(r, `Day ${S.login.i + 1} gift`); S.login.last = today(); S.login.i = (S.login.i + 1) % 7; S.vip += 60;
    FX.confetti(); FX.sound('chest'); closeSheet(); render();
  }

  /* ---------- achievements & season road (rendered in the Quests tab) ---------- */
  function achHTML() {
    return `<div class="card"><h4>Achievements</h4><div class="achs">${ACH.map(a => {
      const tier = S.ach[a.id] || 0, target = a.t[tier], val = a.m(S), done = tier >= a.t.length, can = !done && val >= target;
      return `<div class="ach ${can ? 'ready' : ''}"><div class="medal t${tier}">${'★'.repeat(tier) || '☆'}</div><div><b>${a.name}</b><small>${a.desc}: ${fmt(val)}${done ? '' : ' / ' + fmt(target)}</small>${done ? '' : bar(val / target, 'teal')}</div>${can ? `<button class="btn gold sm" data-act="ach" data-id="${a.id}">${ART.icon('gem', 12)} ${ACH_GEMS[tier]}</button>` : done ? '<span class="good">Mastered</span>' : ''}</div>`;
    }).join('')}</div></div>`;
  }
  function claimAch(id) { const a = ACH.find(x => x.id === id), t = S.ach[id] || 0; if (!a || t >= a.t.length || a.m(S) < a.t[t]) return; S.ach[id] = t + 1; give({ gems: ACH_GEMS[t] }, a.name); xp(20); FX.confetti(); FX.sound('win'); render(); }
  function passHTML() {
    const tier = Math.min(PASS_TIERS, Math.floor(S.pass.xp / PASS_XP)), into = S.pass.xp % PASS_XP;
    const cells = Array.from({ length: PASS_TIERS }, (_, n) => { const t = n + 1, got = S.pass.claimed[t], can = t <= tier && !got; return `<div class="ptier ${got ? 'got' : ''} ${can ? 'ready' : ''} ${t % 10 === 0 ? 'big' : ''}" ${can ? `data-act="pass" data-t="${t}"` : ''}><small>${t}</small><div>${rewardHTML(passReward(t))}</div>${got ? '<i>✓</i>' : can ? '<em>Claim</em>' : ''}</div>`; }).join('');
    return `<div class="card pass"><div class="phead"><div><h4>✦ Season Road · Dawn of Crowns</h4><p class="muted">Earn Season XP from everything you do: building, training, battles, harvests and quests.</p></div><div class="ptier-now">Tier <b>${tier}</b>/${PASS_TIERS}</div></div>${tier < PASS_TIERS ? bar(into / PASS_XP) + `<small class="muted">${into} / ${PASS_XP} XP to tier ${tier + 1}</small>` : ''}<div class="ptrack">${cells}</div>${LIVE.royalRow(tier)}</div>`;
  }
  function claimPass(t) { t = +t; const tier = Math.floor(S.pass.xp / PASS_XP); if (t > tier || S.pass.claimed[t]) return; S.pass.claimed[t] = 1; grant(passReward(t), `Season Road tier ${t}`); FX.sound('chest'); FX.burst(innerWidth / 2, innerHeight / 2, { n: 30, shape: 'star' }); render(); }

  /* ---------- Crown Summon ---------- */
  function rollOne() {
    S.pity++; let r = Math.random() * 100, rar = r < SUMMON.odds.legendary ? 'legendary' : r < SUMMON.odds.legendary + SUMMON.odds.epic ? 'epic' : 'rare';
    if (S.pity >= SUMMON.pity) rar = 'legendary'; if (rar === 'legendary') S.pity = 0;
    const id = pick(SUMMON[rar]); return { id, rar, n: SUMMON.shards[rar] };
  }
  function summon(n) {
    if (n === 1) { if (S.tokens > 0) S.tokens--; else if (S.gems >= SUMMON.cost1) spendGems(SUMMON.cost1); else return toast('Not enough gems', 'bad'); }
    else { if (S.tokens >= 10) S.tokens -= 10; else if (S.gems >= SUMMON.cost10) spendGems(SUMMON.cost10); else return toast('Not enough gems', 'bad'); }
    const res = Array.from({ length: n }, rollOne);
    if (n === 10 && !res.some(r => r.rar !== 'rare')) { const j = Math.floor(Math.random() * 10); res[j] = { id: pick(SUMMON.epic), rar: 'epic', n: SUMMON.shards.epic }; }
    res.forEach(r => addShards(r.id, r.n)); xp(10 * n); LIVE.on('summon', n); save();
    reveal(res);
  }
  function reveal(res) {
    const ov = document.createElement('div'); ov.className = 'reveal';
    ov.innerHTML = `<div class="rv-sky"></div><h2>Crown Summon</h2><div class="cards n${res.length}">${res.map((r, i) => `<div class="scard ${r.rar}" style="--d:${i}"><div class="back">${ART.emblem(54)}</div><div class="front">${ART.portrait(HERO[r.id], 86)}<b>${HERO[r.id].name}</b><small>${r.rar} · ${r.n} shards</small>${S.heroes[r.id].stars === 0 && S.heroes[r.id].shards >= STAR_SHARDS[1] ? '<em>Ready to recruit!</em>' : ''}</div></div>`).join('')}</div><button class="btn gold" data-act="closeov" hidden>Continue</button>`;
    document.body.appendChild(ov); FX.sound('whoosh'); FX.setMood('cine');
    const cards = [...ov.querySelectorAll('.scard')];
    cards.forEach((c, i) => setTimeout(() => {
      c.classList.add('flip'); const p = FX.centerOf(c), r = res[i];
      if (r.rar === 'legendary') { FX.sound('legend'); FX.shake(ov, 14, 500); FX.burst(p.x, p.y, { n: 80, shape: 'star', size: 7, speed: 10, ring: '#ffd36b', life: 1.6 });
        const fig = ART.asset('champions', r.id); if (fig) { const sp = document.createElement('div'); sp.className = 'spot'; sp.innerHTML = `<i class="sp-rays"></i><img src="${fig}" alt=""><div><small>Legendary hero</small><b>${HERO[r.id].name}</b><span>${HERO[r.id].title}</span></div>`; ov.appendChild(sp); sp.addEventListener('click', () => sp.remove()); setTimeout(() => sp.classList.add('out'), 2300); setTimeout(() => sp.remove(), 2700); } }
      else if (r.rar === 'epic') { FX.sound('done'); FX.burst(p.x, p.y, { n: 36, colors: ['#c9b8e8', '#9b7bff', '#fff'], ring: '#9b7bff' }); }
      else { FX.sound('click'); FX.burst(p.x, p.y, { n: 14, colors: ['#9fc3e6', '#fff'] }); }
      if (i === cards.length - 1) setTimeout(() => { ov.querySelector('[data-act=closeov]').hidden = false; }, 500);
    }, 600 + i * (res.length > 1 ? 280 : 0)));
  }

  /* ---------- chests ---------- */
  function rollChest(kind) {
    const out = {}; const add = (k, v) => { if (k === 'items') { out.items ??= {}; for (const [i, n] of Object.entries(v)) out.items[i] = (out.items[i] || 0) + n; } else if (k === 'shards') { out.shards ??= {}; for (const [h, n] of Object.entries(v)) out.shards[h] = (out.shards[h] || 0) + n; } else out[k] = (out[k] || 0) + v; };
    const C = CHESTS[kind], m = { bronze: 1, silver: 2.5, gold: 6 }[kind];
    for (let i = 0; i < C.rolls; i++) {
      const r = Math.random();
      if (kind === 'gold' && i === 0) add('shards', { [pick([...SUMMON.epic, ...SUMMON.legendary])]: 4 });
      else if (r < .35) add(pick(['grain', 'timber', 'stone', 'ore']), Math.floor(3000 * m * (1 + S.b.citadel * .3)));
      else if (r < .6) add('items', { [pick(['sp5', 'sp5', 'sp60'])]: Math.ceil(m) });
      else if (r < .75) add('items', { scroll: Math.ceil(m / 2) });
      else if (r < .85) add('items', { [pick(['vigor', 'crate', 'gift'])]: 1 });
      else if (r < .95 || kind === 'bronze') add('gold', Math.floor(2500 * m));
      else add('shards', { [pick(SUMMON.rare)]: Math.ceil(m) });
    }
    return out;
  }
  const chestSVG = (c, s = 120) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100" class="chestsvg"><ellipse cx="50" cy="88" rx="38" ry="7" fill="#0005"/><g class="body"><rect x="14" y="44" width="72" height="40" rx="6" fill="#7e4a22"/><rect x="14" y="44" width="72" height="40" rx="6" fill="none" stroke="${c}" stroke-width="4"/><path d="M14 58h72" stroke="${c}" stroke-width="3"/><rect x="44" y="52" width="12" height="14" rx="2" fill="${c}"/></g><g class="lid"><path d="M14 46c0-20 16-28 36-28s36 8 36 28z" fill="#9c5f2e"/><path d="M14 46c0-20 16-28 36-28s36 8 36 28" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 18v28" stroke="${c}" stroke-width="3"/></g></svg>`;
  function openChestKind(kind) {
    const C = CHESTS[kind];
    if (C.cost.gems) { if (S.gems < C.cost.gems) return toast('Not enough gems', 'bad'); spendGems(C.cost.gems); }
    else { if (S.res.gold < C.cost.gold) return toast('Not enough Gold', 'bad'); S.res.gold -= C.cost.gold; }
    const r = rollChest(kind); grant(r); xp(15); save(); closeSheet();
    const ov = document.createElement('div'); ov.className = 'reveal chest-open'; ov.style.setProperty('--c', C.color);
    ov.innerHTML = `<div class="rv-sky"></div><h2>${C.name}</h2><div class="chestwrap">${chestSVG(C.color, 170)}</div><div class="loot">${rewardHTML(r)}</div><button class="btn gold" data-act="closeov" hidden>Collect</button>`;
    document.body.appendChild(ov); const cw = ov.querySelector('.chestwrap');
    [0, 1, 2].forEach(i => setTimeout(() => { FX.sound('hit'); FX.shake(cw, 10 + i * 4, 260); }, 300 + i * 380));
    setTimeout(() => { ov.classList.add('popped'); FX.sound('chest'); const p = FX.centerOf(cw); FX.burst(p.x, p.y, { n: 90, shape: 'star', size: 6, speed: 11, ring: C.color, life: 1.5, colors: [C.color, '#fff3c4', '#ffd36b'] }); }, 1500);
    setTimeout(() => { ov.querySelector('[data-act=closeov]').hidden = false; render(); }, 2300);
  }

  /* ---------- daily deals ---------- */
  function deals() {
    if (S.deals.day !== today()) S.deals = { day: today(), bought: [] };
    const seed = today().split('-').reduce((a, b) => a * 37 + +b, 7), r = rng(seed);
    const keys = ['sp5', 'sp60', 'crate', 'scroll', 'vigor', 'shield'];
    return [0, 1, 2].map(i => {
      const items = {}; const n = 2 + Math.floor(r() * 2); for (let j = 0; j < n; j++) { const k = keys[Math.floor(r() * keys.length)]; items[k] = (items[k] || 0) + 1 + Math.floor(r() * (k === 'sp5' ? 5 : 2)); }
      const value = Object.entries(items).reduce((a, [k, v]) => a + ITEMS[k].gems * v, 0), off = [40, 50, 60][i];
      return i === 2 ? { i, items, off: 100, gold: Math.max(5000, Math.floor(value * 60)), name: 'Bazaar Bargain' } : { i, items, off, gems: Math.max(10, Math.round(value * (100 - off) / 100)), name: ['Traveller\'s Pack', 'Warlord\'s Bundle'][i] };
    });
  }
  function buyDeal(i) {
    const d = deals()[i]; if (S.deals.bought.includes(i)) return;
    if (d.gems) { if (S.gems < d.gems) return toast('Not enough gems', 'bad'); spendGems(d.gems); } else { if (S.res.gold < d.gold) return toast('Not enough Gold', 'bad'); S.res.gold -= d.gold; }
    S.deals.bought.push(i); grant({ items: d.items }, d.name); FX.sound('chest'); FX.confetti(); render();
  }

  const featuredId = () => SUMMON.legendary[Math.floor(Date.now() / 864e5) % SUMMON.legendary.length];
  /* ---------- Store UI ---------- */
  let sub = 'featured';
  const midnight = () => { const d = new Date(); d.setHours(24, 0, 0, 0); return (d - new Date()) / 1000; };
  function renderStore() {
    const tabs = [['featured', 'Featured'], ['market', 'Market'], ['offers', 'Offers'], ['summon', 'Crown Summon'], ['chests', 'Chests'], ['gems', 'Gems'], ['skins', 'City Skins'], ['items', 'Items'], ['bag', 'Bag'], ['vip', 'VIP ' + vipLvl()]];
    const head = `<div class="store-head"><h2>Royal Bazaar</h2><div class="wallet"><span data-res="gems2">${ART.icon('gem', 18)}<b>${fmt(S.gems)}</b></span><span>${feather(18)}<b>${S.tokens}</b></span><span>${ART.icon('gold', 18)}<b>${fmt(S.res.gold)}</b></span></div></div>
      <div class="subtabs">${tabs.map(([k, n]) => `<button class="${sub === k ? 'on' : ''}" data-act="sub" data-s="${k}">${n}</button>`).join('')}</div>`;
    return head + ({ featured, market: marketTab, summonTab, chests: chestsTab, gems: gemsTab, items: itemsTab, bag: renderBag, vip: vipTab, offers: LIVE.offersTab, skins: LIVE.skinsTab }[sub === 'summon' ? 'summonTab' : sub === 'chests' ? 'chests' : sub])();
  }
  /* ---------- Market: stalls paid in Gold, and one free spin of the wheel a day ---------- */
  const MARKET = [['grain', 'Grain wagon'], ['timber', 'Timber cart'], ['stone', 'Stone sledge'], ['ore', 'Iron ingots']].map(([k, n]) => ({ id: k, name: n, max: 5, gold: L => 500 * L, r: L => ({ [k]: 4000 * L }) })).concat([
    { id: 'sp5', name: 'Hourglass bundle', max: 3, gold: () => 2500, r: () => ({ items: { sp5: 3 } }) }, { id: 'scroll', name: "Scholar's tome", max: 2, gold: () => 3000, r: () => ({ items: { scroll: 1 } }) }, { id: 'vigor', name: 'Elixir of Vigor', max: 2, gold: () => 4000, r: () => ({ items: { vigor: 1 } }) }]);
  const WHEEL = [{ gems: 20 }, { gold: 3000 }, { items: { sp5: 2 } }, { gems: 50 }, { items: { crate: 1 } }, { items: { vigor: 1 } }, { items: { sp60: 1 } }, { gems: 120 }];
  const mk = () => { S.market ??= { day: '', bought: {}, spin: '' }; if (S.market.day !== today()) { S.market.day = today(); S.market.bought = {}; } return S.market; };
  let spinning = false, wheelRot = 0;
  function marketTab() {
    const m = mk(), L = Math.max(1, S.b.citadel), free = m.spin !== today(), hrs = Math.max(1, Math.ceil(midnight() / 3600));
    return `<div class="card wheelcard"><h4>✦ Wheel of Fortune</h4><p class="muted">One free spin every day. All eight prizes are equally likely.</p><div class="wheelwrap"><i class="wptr"></i><div class="wheel" id="wheel" style="transform:rotate(${wheelRot}deg)">${WHEEL.map((w, i) => `<span style="--a:${i * 45 + 22.5}deg">${rewardHTML(w)}</span>`).join('')}</div><b class="whub">★</b></div>${free ? '<button class="btn gold wide" data-act="spin">Spin free</button>' : `<p class="muted center">Next free spin in about ${hrs}h</p>`}</div>
    <h3>Market stalls <small class="muted">paid in Gold · restock in about ${hrs}h</small></h3><div class="deals">${MARKET.map(it => { const left = it.max - (m.bought[it.id] || 0), price = it.gold(L); return `<div class="deal ${left ? '' : 'sold'}"><span class="off teal">Gold</span><h4>${it.name}</h4><div class="rws">${rewardHTML(it.r(L))}</div>${left ? `<button class="btn gold" data-act="mbuy" data-id="${it.id}">${ART.icon('gold', 14)} ${fmt(price)}</button><small class="muted">${left} left today</small>` : '<span class="muted">Sold out today</span>'}</div>`; }).join('')}</div>`;
  }
  function spin() {
    const m = mk(), el = document.getElementById('wheel'); if (spinning || m.spin === today() || !el) return; spinning = true; m.spin = today(); LIVE.on('spin', 1);
    const i = Math.floor(Math.random() * WHEEL.length), txt = give(WHEEL[i]); wheelRot = wheelRot - (wheelRot % 360) + 360 * 6 + (360 - (i * 45 + 22.5));
    el.style.transition = 'transform 4.2s cubic-bezier(.12,.75,.1,1)'; el.style.transform = `rotate(${wheelRot}deg)`; let n = 0; const tk = setInterval(() => { FX.sound('tick'); if (++n > 26) clearInterval(tk); }, 150);
    setTimeout(() => { spinning = false; toast(`Wheel of Fortune: ${txt}`, 'good'); FX.confetti(); FX.sound('chest'); render(); }, 4400);
  }
  function buyMarket(id) { const m = mk(), it = MARKET.find(x => x.id === id), L = Math.max(1, S.b.citadel); if (!it || (m.bought[id] || 0) >= it.max) return; const price = it.gold(L); if (S.res.gold < price) return toast('Not enough Gold', 'bad'); S.res.gold -= price; m.bought[id] = (m.bought[id] || 0) + 1; give(it.r(L), it.name); FX.sound('coin'); render(); }
  function featured() {
    const freeOk = S.free !== today(), vipOk = vipLvl() > 0 && S.vipDay !== today();
    return `<div class="hero-banner" data-act="sub" data-s="summon"><div class="hb-art">${ART.portrait(HERO[featuredId()], 130)}</div><div class="hb-txt"><small>Featured legend</small><h3>${HERO[featuredId()].name}, ${HERO[featuredId()].title}</h3><p>Summon now · 4% legendary · guaranteed within ${SUMMON.pity} summons</p><span class="btn gold">Summon</span></div></div>
    <div class="grid2">
      <div class="card offer ${freeOk ? 'ready' : ''}"><h4>${ART.icon('chest', 22)} Daily free gift</h4><p class="muted">Gems and a surprise item, every day.</p>${freeOk ? '<button class="btn gold" data-act="freegift">Claim free</button>' : `<span class="muted">Next in ${fmtT(midnight())}</span>`}</div>
      <div class="card offer ${vipOk ? 'ready' : ''}"><h4>👑 VIP ${vipLvl()} daily chest</h4><p class="muted">${vipLvl() ? `${20 * vipLvl()} gems + hourglasses` : 'Reach VIP 1 by spending gems or logging in daily.'}</p>${vipOk ? '<button class="btn gold" data-act="vipchest">Open</button>' : vipLvl() ? `<span class="muted">Next in ${fmtT(midnight())}</span>` : '<button class="btn" data-act="sub" data-s="vip">See VIP</button>'}</div>
    </div>
    <h3>Daily deals <small class="muted">refresh in ${fmtT(midnight())}</small></h3>
    <div class="deals">${deals().map(d => { const got = S.deals.bought.includes(d.i); return `<div class="deal ${got ? 'sold' : ''}">${d.off < 100 ? `<span class="off">-${d.off}%</span>` : '<span class="off teal">Gold</span>'}<h4>${d.name}</h4><div class="rws">${rewardHTML({ items: d.items })}</div>${got ? '<span class="muted">Sold out today</span>' : `<button class="btn gold" data-act="deal" data-i="${d.i}">${d.gems ? ART.icon('gem', 14) + ' ' + d.gems : ART.icon('gold', 14) + ' ' + fmt(d.gold)}</button>`}</div>`; }).join('')}</div>
    ${LIVE.adButton('chest', 'Watch an ad: 15 gems')}<div class="grid2"><div class="card offer" data-act="sub" data-s="offers">${ART.icon('chest', 44)}<div><h4>Offers & Monthly Card</h4><p class="muted">Founder's Pack, Monthly Card, Royal Season track</p></div></div><div class="card offer" data-act="sub" data-s="chests">${chestSVG('#ffd36b', 56)}<div><h4>Royal Chest</h4><p class="muted">Guaranteed hero shards</p></div></div><div class="card offer" data-act="logincal">${ART.icon('chest', 40)}<div><h4>Royal Courier</h4><p class="muted">Day ${S.login.i + 1} of 7</p></div></div></div>`;
  }
  function summonTab() {
    const pityLeft = SUMMON.pity - S.pity;
    return `<div class="summon-stage"><div class="sm-heroes">${SUMMON.legendary.map(id => ART.portrait(HERO[id], 120)).join('')}</div><h3>Crown Summon</h3><p class="muted">Call heroes to your court. Every summon gives hero shards — collect enough to recruit a hero or raise their stars.</p>
      <div class="sm-btns"><button class="btn gold big" data-act="summon" data-n="1">${S.tokens ? feather(18) + ' 1 Sigil' : ART.icon('gem', 18) + ' ' + SUMMON.cost1}<small>Summon ×1</small></button><button class="btn gold big" data-act="summon" data-n="10">${S.tokens >= 10 ? feather(18) + ' 10 Sigils' : ART.icon('gem', 18) + ' ' + fmt(SUMMON.cost10)}<small>Summon ×10 · 1 epic+ guaranteed</small></button></div>
      <p class="pity">Legendary guaranteed in <b>${pityLeft}</b> summon${pityLeft === 1 ? '' : 's'}</p></div>
      <div class="card"><h4>Odds</h4><p><span class="rar legendary">Legendary ${SUMMON.odds.legendary}%</span> ${SUMMON.legendary.map(id => HERO[id].name).join(', ')} · 10 shards</p><p><span class="rar epic">Epic ${SUMMON.odds.epic}%</span> ${SUMMON.epic.map(id => shortName(id)).join(', ')} · 5 shards</p><p><span class="rar rare">Rare ${SUMMON.odds.rare}%</span> any hero · 2 shards</p></div>`;
  }
  function chestsTab() {
    return `<div class="chests">${Object.entries(CHESTS).map(([k, c]) => `<div class="chestcard" style="--c:${c.color}">${chestSVG(c.color, 110)}<h4>${c.name}</h4><p class="muted">${c.desc}</p><button class="btn gold" data-act="openchest" data-k="${k}">${c.cost.gems ? ART.icon('gem', 14) + ' ' + c.cost.gems : ART.icon('gold', 14) + ' ' + fmt(c.cost.gold)}</button></div>`).join('')}</div>`;
  }
  function gemsTab() {
    const pay = window.AELORIA_PAYMENTS;
    return `<p class="muted">Gems are earned in play: quests, achievements, the Season Road, daily gifts, trials and battles.</p><div class="packs">${GEM_PACKS.map((p, i) => `<div class="pack">${p.tag ? `<span class="tag">${p.tag}</span>` : ''}<div class="gempile">${Array.from({ length: Math.min(6, i + 1) }, (_, j) => `<span style="--j:${j}">${ART.icon('gem', 30 + i * 3)}</span>`).join('')}</div><h4>${p.name}</h4><b class="amt">${fmt(p.gems)}${p.bonus ? ` <small>+${fmt(p.bonus)} bonus</small>` : ''}</b>${pay ? `<button class="btn gold" data-act="pack" data-id="${p.id}">${p.price}</button>` : `<button class="btn soon" data-act="soon">${p.price}</button>`}</div>`).join('')}</div>
      ${pay ? '' : '<p class="muted center">Gem purchases open with the mobile release. Everything in the Souq can already be earned by playing.</p>'}`;
  }
  async function buyPack(id) {
    const p = GEM_PACKS.find(x => x.id === id), pay = window.AELORIA_PAYMENTS; if (!p || !pay) return;
    try { if (await pay.buy(id)) { S.gems += p.gems + p.bonus; S.vip += p.gems; FX.confetti(); FX.sound('chest'); toast(`+${fmt(p.gems + p.bonus)} gems`, 'good'); save(); render(); } } catch (e) { toast('Purchase cancelled', 'bad'); }
  }
  function itemsTab() {
    return `<div class="items">${Object.entries(ITEMS).filter(([, d]) => d.gems).map(([i, d]) => `<div class="item">${ART.icon(d.icon, 38)}<b>${d.name}</b><small>${d.desc}</small><span class="own">Owned ${S.items[i] || 0}</span><button class="mini gold" data-act="buy" data-i="${i}">${ART.icon('gem', 12)} ${d.gems}</button></div>`).join('')}</div>`;
  }
  function vipTab() {
    const l = vipLvl(), next = VIP_PTS[l + 1];
    return `<div class="vip-card"><div class="vip-badge">VIP<b>${l}</b></div><div>${next ? `${bar((S.vip - VIP_PTS[l]) / (next - VIP_PTS[l]))}<small>${fmt(S.vip)} / ${fmt(next)} VIP points</small>` : '<b>Maximum VIP</b>'}<p class="muted">Earn VIP points from every gem you spend and +60 for each daily login.</p></div></div>
    <table class="viptable"><tr><th>VIP</th><th>Free finish</th><th>Production</th><th>Daily chest</th><th>Vigor cap</th></tr>${VIP_PTS.map((p, i) => `<tr class="${i === l ? 'me' : ''}"><td>${i}</td><td>${5 + i * 2} min</td><td>+${i * 3}%</td><td>${i ? 20 * i + ' gems' : '—'}</td><td>+${i * 5}</td></tr>`).join('')}</table>`;
  }
  function freeGift() { if (S.free === today()) return; S.free = today(); grant({ gems: 20, items: { [pick(['sp5', 'crate', 'scroll', 'vigor'])]: 1 } }, 'Daily gift'); FX.sound('chest'); FX.confetti(); render(); }
  function vipChest() { if (!vipLvl() || S.vipDay === today()) return; S.vipDay = today(); grant({ gems: 20 * vipLvl(), items: Object.assign({ sp5: vipLvl() }, vipLvl() >= 3 ? { sp60: Math.floor(vipLvl() / 3) } : {}) }, `VIP ${vipLvl()} chest`); FX.sound('chest'); FX.confetti(); render(); }

  function act(a, d, el) {
    switch (a) {
      case 'sub': sub = d.s; if (tab !== 'store') openTab('store'); else render(); return true;
      case 'summon': summon(+d.n); return true;
      case 'openchest': openChestKind(d.k); return true;
      case 'deal': buyDeal(+d.i); return true;
      case 'spin': spin(); return true;
      case 'mbuy': buyMarket(d.id); return true;
      case 'pack': buyPack(d.id); return true;
      case 'freegift': freeGift(); return true;
      case 'vipchest': vipChest(); return true;
      case 'logincal': loginPopup(true); return true;
      case 'login': claimLogin(); return true;
      case 'harvest': harvest(d.i, el); xp(1); return true;
      case 'harvestall': harvestAll(); return true;
      case 'guide': goGuide(); return true;
      case 'ach': claimAch(d.id); return true;
      case 'pass': claimPass(d.t); return true;
      case 'closeov': el.closest('.reveal').remove(); FX.setMood(tab === 'world' ? 'world' : 'city'); render(); return true;
    }
    return false;
  }
  return { busy: () => spinning, migrate, xp, grant, bubbles, readyCount, guide, loginPopup, achHTML, passHTML, renderStore, act, feather, rewardHTML, vipLvl };
})();
