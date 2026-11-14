// Aeloria: Age of Crowns — live features: hero gear and realm synergy, the Arena, weekly events,
// the alliance world boss, store offers (Monthly Card, Founder's Pack, milestone packs, Royal Season track),
// city skins, rewarded-ad hooks, comeback gifts and browser notifications.
//
// Real money stays off until the app provides window.AELORIA_PAYMENTS = { buy: productId => Promise<boolean> }.
// Rewarded ads stay hidden until the app provides window.AELORIA_ADS = { show: placement => Promise<boolean> }.
'use strict';
const LIVE = (() => {
  const DAY = 864e5, WEEK = 7 * DAY;
  const pay = () => window.AELORIA_PAYMENTS, ads = () => window.AELORIA_ADS;

  function migrate(s) {
    s.gear ??= {}; s.essence ??= 0; s.arena ??= { rating: 1000, tickets: 5, day: '', glory: 0, claimed: '', opps: null, refreshes: 3, wins: 0 };
    s.event ??= { week: -1, pts: 0, claimed: [], last: null }; s.boss ??= { kills: 0, dmg: 0 };
    s.shop ??= { founder: false, card: 0, cardDay: '', royalPass: false, packs: [], seen: {} }; s.skins ??= []; s.skin ??= '';
    s.pass.royal ??= {};
    return s;
  }

  /* ======================= hero gear ======================= */
  const SLOTS = { w: { name: 'Weapon', stat: 'atk', per: .06, icon: '⚔' }, a: { name: 'Armour', stat: 'def', per: .06, icon: '🛡' }, h: { name: 'Helm', stat: 'hp', per: .06, icon: '⛑' }, c: { name: 'Charm', stat: 'all', per: .025, icon: '✦' } };
  const gearMax = () => 5 + (S.b.mews || 0);
  const gearOf = id => S.gear[id] || (S.gear[id] = { w: 0, a: 0, h: 0, c: 0 });
  const gearCost = l => ({ essence: Math.round(10 * Math.pow(l + 1, 1.5)), gold: Math.round(500 * Math.pow(l + 1, 2)) });
  function gearMult(id) {
    const g = S.gear && S.gear[id]; if (!g) return { hp: 1, atk: 1, def: 1 };
    const all = 1 + g.c * SLOTS.c.per;
    return { hp: (1 + g.h * SLOTS.h.per) * all, atk: (1 + g.w * SLOTS.w.per) * all, def: (1 + g.a * SLOTS.a.per) * all };
  }
  const gearMight = () => Object.values(S.gear || {}).reduce((a, g) => a + (g.w + g.a + g.h + g.c) * 35, 0);
  function gearHTML(id) {
    const g = gearOf(id);
    return `<div class="card forge"><h4>⚒ Forge · Ember Essence ${fmt(S.essence)}</h4><div class="gear">${Object.entries(SLOTS).map(([k, sl]) => {
      const l = g[k], c = gearCost(l), max = l >= gearMax();
      return `<div class="gslot q${Math.min(4, Math.floor(l / 4))}"><span class="gi">${sl.icon}</span><b>${sl.name} +${l}</b><small>${sl.stat === 'all' ? 'All stats' : sl.stat.toUpperCase()} +${Math.round(l * sl.per * 100)}%</small>${max ? '<em>Max (raise Hall of Heroes)</em>' : `<button class="mini gold" data-act="gearforge" data-id="${id}" data-s="${k}">Forge <i class="ess">✦</i>${c.essence} · ${ART.icon('gold', 11)}${fmt(c.gold)}</button>`}</div>`;
    }).join('')}</div><p class="muted">Ember Essence drops from Ashen outposts, campaign stages, the World Boss and chests.</p></div>`;
  }
  function forge(id, k) {
    const g = gearOf(id); if (g[k] >= gearMax()) return toast('Raise the Hall of Heroes to forge higher', 'bad');
    const c = gearCost(g[k]); if (S.essence < c.essence || S.res.gold < c.gold) return toast('Not enough Essence or Gold', 'bad');
    S.essence -= c.essence; S.res.gold -= c.gold; g[k]++; FX.sound('build'); FX.burst(innerWidth / 2, innerHeight / 2, { n: 24, shape: 'spark', colors: ['#ff7a2a', '#ffd36b', '#fff'] });
    on('gear', 1); render(); openHero(id);
  }

  /* ======================= realm synergy ======================= */
  function synergy(ids) {
    const realms = ids.map(id => HERO[id] && HERO[id].realm), counts = {}; realms.forEach(r => counts[r] = (counts[r] || 0) + 1);
    const top = Math.max(0, ...Object.values(counts)), realm = Object.keys(counts).find(r => counts[r] === top);
    if (ids.length >= 3 && top === 3) return { atk: 1.25, hp: 1.1, label: `${REALMS[realm].name} Oath: +25% ATK, +10% HP` };
    if (top === 2) return { atk: 1.1, hp: 1, label: `${REALMS[realm].name} Bond: +10% ATK` };
    if (ids.length >= 3 && top === 1) return { atk: 1, hp: 1.08, label: 'Unity of Realms: +8% HP' };
    return { atk: 1, hp: 1, label: '' };
  }
  function squadUnits(ids) {
    const sy = synergy(ids);
    return ids.map(id => { const s = heroStats(id); const hp = Math.round(s.hp * sy.hp); return { id, name: shortName(id), hero: HERO[id], hp, max: hp, atk: Math.round(s.atk * sy.atk), def: s.def, spd: s.spd, en: 20 }; });
  }

  /* ======================= Arena ======================= */
  const TIERS = [[0, 'Bronze', '#c07a3a', 20], [1100, 'Silver', '#c9d6e3', 40], [1300, 'Gold', '#ffd36b', 70], [1500, 'Platinum', '#7fe0ff', 110], [1800, 'Champion', '#b48cff', 160]];
  const tierOf = r => [...TIERS].reverse().find(t => r >= t[0]);
  const TITLES = ['Lord', 'Lady', 'Jarl', 'Duchess', 'Emir', 'Chieftain', 'Baron', 'Countess', 'Captain', 'Sage', 'Warden', 'Admiral'];
  function arenaDay() { const A = S.arena; if (A.day !== today()) { A.day = today(); A.tickets = Math.max(A.tickets, 5); A.refreshes = 3; } }
  function avgPower() { const ids = S.squad.filter(id => S.heroes[id] && S.heroes[id].stars); if (!ids.length) return 1; return ids.reduce((a, id) => { const h = S.heroes[id]; return a + h.lvl * (1 + .2 * (h.stars - 1)); }, 0) / ids.length; }
  function genOpps() {
    const lv = Math.max(1, Math.round(avgPower())), base = S.arena.rating;
    S.arena.opps = [.85, 1, 1.15].map((k, i) => {
      const realm = pick(REALM_IDS), pool = HEROES.filter(h => Math.random() < .5 || h.realm === realm), squad = [...pool].sort(() => Math.random() - .5).slice(0, 3).map(h => ({ id: h.id, lvl: Math.max(1, Math.round(lv * k * (.9 + Math.random() * .2))), stars: Math.max(1, Math.min(5, Math.round((S.heroes[S.squad[0]]?.stars || 1) + (i - 1) * .6))) }));
      return { name: `${pick(TITLES)} ${pick(HOUSE_NAMES)}`, realm, rating: Math.round(base + (i - 1) * 60 + (Math.random() - .5) * 40), squad };
    });
  }
  const oppPower = o => o.squad.reduce((a, h) => a + h.lvl * 40 * h.stars, 0);
  function renderArena() {
    arenaDay(); if (!S.arena.opps) genOpps();
    const A = S.arena, t = tierOf(A.rating), claim = A.claimed !== today();
    const my = S.squad.filter(id => S.heroes[id] && S.heroes[id].stars), sy = synergy(my);
    return `<h2>Arena of Crowns</h2>
    <div class="card arena-top"><div class="tierb" style="--tc:${t[2]}">${t[1]}</div><div><p><b>Rating ${A.rating}</b> · Glory ${fmt(A.glory)} · Wins ${A.wins}</p><p class="muted">Tickets ${A.tickets} · Free refreshes ${A.refreshes}</p></div>
    <button class="btn ${claim ? 'gold' : ''}" data-act="arenaclaim" ${claim ? '' : 'disabled'}>${claim ? `Daily ${t[1]} reward: ${ART.icon('gem', 13)} ${t[3]}` : 'Daily reward claimed'}</button></div>
    <div class="card"><h4>Your squad</h4><div class="squadrow">${my.map(id => ART.portrait(HERO[id], 50)).join('')}<span class="muted">${sy.label || 'Field heroes from the same realm for a bonus'}</span></div></div>
    <div class="opps">${A.opps.map((o, i) => `<div class="opp"><div class="ohead"><b>${esc(o.name)}</b><small style="color:${REALMS[o.realm].color}">${REALMS[o.realm].name} · ${o.rating}</small></div><div class="squadrow">${o.squad.map(h => `<span class="oh">${ART.portrait(HERO[h.id], 46)}<i>${h.lvl}</i></span>`).join('')}</div><p class="muted">Power ≈ ${fmt(oppPower(o))}</p><button class="btn gold" data-act="arenafight" data-i="${i}">Challenge</button></div>`).join('')}</div>
    <div class="btns"><button class="btn" data-act="arenarefresh">${A.refreshes ? `Refresh (${A.refreshes} free)` : `Refresh · ${ART.icon('gem', 12)} 20`}</button><button class="btn" data-act="arenaticket">+1 Ticket · ${ART.icon('gem', 12)} 50</button>${adButton('arena', '+1 Ticket')}</div>
    <div class="card"><h4>Glory Shop</h4><div class="items">${GLORY.map((g, i) => `<div class="item">${g.art()}<b>${g.name}</b><small>${g.desc}</small><button class="mini gold" data-act="glorybuy" data-i="${i}">${fmt(g.cost)} Glory</button></div>`).join('')}</div></div>`;
  }
  const GLORY = [
    { name: 'Epic shards ×5', desc: 'A random epic hero', cost: 300, art: () => ART.icon('might', 34), give: () => ({ shards: { [pick(HEROES.filter(h => h.rarity === 'epic')).id]: 5 } }) },
    { name: 'Legendary shards ×3', desc: 'A random legendary hero', cost: 450, art: () => ART.icon('gem', 34), give: () => ({ shards: { [pick(HEROES.filter(h => h.rarity === 'legendary')).id]: 3 } }) },
    { name: 'Ember Essence ×60', desc: 'For the Forge', cost: 120, art: () => '<span style="font-size:30px">✦</span>', give: () => ({ essence: 60 }) },
    { name: 'Hero Tomes ×2', desc: '1,200 hero XP', cost: 100, art: () => ART.icon('scroll', 34), give: () => ({ items: { scroll: 2 } }) }
  ];
  function arenaFight(i) {
    arenaDay(); const A = S.arena, o = A.opps && A.opps[i]; if (!o) return;
    if (A.tickets <= 0) return toast('No Arena tickets left today', 'bad');
    const ids = S.squad.filter(id => S.heroes[id] && S.heroes[id].stars); if (!ids.length) return toast('Pick heroes for your squad', 'bad');
    A.tickets--;
    const foes = o.squad.map(h => { const d = HERO[h.id], m = (1 + .13 * (h.lvl - 1)) * (1 + .2 * (h.stars - 1)), gm = 1 + Math.min(.5, h.lvl * .006); return { id: 'o' + h.id + Math.random(), name: shortName(h.id), hero: d, kind: 'raider', hp: Math.round(d.hp * m * gm), max: Math.round(d.hp * m * gm), atk: Math.round(d.atk * m * gm), def: Math.round(d.def * m), spd: d.spd, en: 0, foe: true }; });
    const ch = Math.max(1, CHAPTERS.findIndex(c => c.realm === o.realm) + 1);
    fight = { mode: 'arena', opp: o, oi: i, key: 'Arena', ch, n: 0, heroes: squadUnits(ids), foes, turn: 0, buff: 0, shield: 0, auto: !!S.autoSkill, speed: S.fightSpeed || 1, over: false, q: [], next: now() + 1500, pauseUntil: 0 };
    closeSheet(); $('#battle').hidden = false; buildFight(); FX.setMood('battle'); FX.sound('horn');
    fight.timer = setInterval(fightLoop, 50);
  }
  function endArena(f, win) {
    const A = S.arena, o = f.opp, diff = (o.rating - A.rating) / 400, exp = 1 / (1 + Math.pow(10, diff));
    const delta = Math.round(32 * ((win ? 1 : 0) - exp)); A.rating = Math.max(800, A.rating + delta);
    const glory = win ? 25 + Math.max(0, delta) : 5; A.glory += glory; if (win) { A.wins++; on('arena', 1); }
    const r = win ? { gold: 800 + A.rating } : {}; give(r); if (win) { f.heroes.forEach(h => heroXP(h.id, 150)); META.xp(10); }
    genOpps();
    const html = `${win ? '<div class="res-rays"></div><h2 class="win">Victory</h2>' : '<h2 class="loss">Defeat</h2>'}<p>vs ${esc(o.name)}</p><p class="big-delta ${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${delta} rating → ${A.rating}</p><p>+${glory} Glory ${win ? '· +' + fmt(r.gold) + ' Gold' : ''}</p><div class="rbtns"><button class="btn gold" data-act="arenaleave">Back to Arena</button></div>`;
    FX.sound(win ? 'win' : 'loss'); if (win) setTimeout(() => FX.confetti(), 300);
    const box = document.createElement('div'); box.className = 'result ' + (win ? 'won' : 'lost'); box.innerHTML = html; setTimeout(() => $('#battle .bfield')?.appendChild(box), 500); save();
  }

  /* ======================= weekly events ======================= */
  const EVENTS = [
    { id: 'might', name: 'Rise of Crowns', desc: 'Build, research and train to grow your realm.', pts: { build: 40, research: 50, train: .1, gear: 15 }, color: '#e8a33d' },
    { id: 'hunt', name: 'The Ash Hunt', desc: 'Destroy Ashen outposts, win stages and strike the World Boss.', pts: { camp: 60, stage: 25, boss: 40, rival: 120 }, color: '#ff5e3a' },
    { id: 'harvest', name: 'Festival of Harvests', desc: 'Collect harvests and gather across the map.', pts: { harvest: 6, gather: .002, camp: 15 }, color: '#6fe39a' },
    { id: 'heroes', name: 'Trial of Champions', desc: 'Win stages, Arena battles, summon and forge.', pts: { stage: 30, arena: 45, summon: 12, gear: 25 }, color: '#b48cff' }
  ];
  const EV_TIERS = [[150, { gems: 30 }], [500, { items: { sp60: 1 }, essence: 30 }], [1200, { gems: 80, items: { scroll: 2 } }], [2500, { tokens: 1, essence: 80 }], [5000, { gems: 200, items: { sp480: 1 } }]];
  const MON = Date.UTC(2024, 0, 1); // a Monday
  const weekNo = () => Math.floor((Date.now() - MON) / WEEK);
  const curEvent = () => EVENTS[weekNo() % EVENTS.length];
  const weekLeft = () => (MON + (weekNo() + 1) * WEEK - Date.now()) / 1000;
  function eventBoard(pts) {
    const into = (Date.now() - MON) % WEEK / WEEK, r = rng(weekNo() * 31 + 7);
    const list = HOUSE_NAMES.slice(0, 9).map((n, i) => ({ name: `${pick(TITLES)} ${n}`, pts: Math.round((1500 + r() * 6000) * Math.min(1, into * 1.15) * (1 - i * .04)) }));
    list.push({ name: S.name + ' (you)', pts, me: true }); return list.sort((a, b) => b.pts - a.pts);
  }
  function eventWeek() {
    const E = S.event, w = weekNo();
    if (E.week !== w) {
      if (E.week >= 0 && E.pts > 0) { const rank = eventBoard(E.pts).findIndex(x => x.me) + 1; const g = rank === 1 ? 300 : rank <= 3 ? 180 : rank <= 6 ? 100 : 50; give({ gems: g }); report(`Event ended · rank #${rank}`, `<p>You finished <b>#${rank}</b> with ${fmt(E.pts)} points and earned ${g} gems.</p>`, 'win'); }
      S.event = { week: w, pts: 0, claimed: [], last: E.week };
    }
  }
  function on(kind, n = 1) {
    if (!S) return; deedTrack(kind, n); if (!S.event) return; eventWeek();
    const p = curEvent().pts[kind]; if (!p) return;
    const add = Math.max(1, Math.round(p * n)); S.event.pts += add;
    const el = document.querySelector('[data-res="event"]'); if (el) { const c = FX.centerOf(el); FX.text(c.x, c.y + 16, `+${add} pts`, 'pass'); }
  }
  /* ---------- Daily Deeds: seven small goals a day, five chests along the bar ---------- */
  const DEEDS = [{ k: 'stage', n: 3, t: 'Win 3 campaign battles', p: 20 }, { k: 'harvest', n: 10, t: 'Collect 10 harvests', p: 15 }, { k: 'train', n: 100, t: 'Train 100 troops', p: 15 }, { k: 'treasure', n: 2, t: 'Recover 2 treasures on the World map', p: 15 }, { k: 'build', n: 2, t: 'Finish 2 buildings or upgrades', p: 15 }, { k: 'caravan', n: 1, t: 'Catch a treasure caravan', p: 10 }, { k: 'spin', n: 1, t: 'Spin the Wheel of Fortune', p: 10 }];
  const DEED_CHESTS = [[20, { gems: 10 }], [40, { items: { sp5: 2 } }], [60, { gems: 20, gold: 2000 }], [80, { items: { vigor: 1, crate: 1 } }], [100, { gems: 60, items: { sp60: 1 } }]];
  const dd = () => { if (!S.deeds || S.deeds.day !== today()) S.deeds = { day: today(), n: {}, claimed: {} }; return S.deeds; };
  const deedPts = () => { const d = dd(); return DEEDS.reduce((a, x) => a + ((d.n[x.k] || 0) >= x.n ? x.p : 0), 0); };
  const deedReady = () => { const p = deedPts(), d = dd(); return DEED_CHESTS.some(([t]) => p >= t && !d.claimed[t]); };
  function deedTrack(kind, n) { const x = DEEDS.find(q => q.k === kind); if (!x) return; const d = dd(), before = d.n[kind] || 0; if (before >= x.n) return; d.n[kind] = Math.min(x.n, before + n); if (d.n[kind] >= x.n) { toast(`✔ Daily deed done: ${x.t} · +${x.p} points`, 'good'); FX.sound('coin'); } }
  function deedsHTML() {
    const d = dd(), p = deedPts();
    return `<div class="card deeds"><div class="phead"><div><h4>☀ Daily Deeds</h4><p class="muted">Seven small goals, new every day. Fill the bar to open all five chests.</p></div><div class="ptier-now"><b>${p}</b>/100</div></div><div class="dbar"><i style="width:${p}%"></i>${DEED_CHESTS.map(([t]) => { const got = d.claimed[t], can = p >= t && !got; return `<button class="dchest ${got ? 'got' : ''} ${can ? 'ready' : ''}" style="left:${t}%" data-act="${can ? 'deed' : 'deedinfo'}" data-t="${t}">${ART.icon('chest', 26)}<small>${got ? '✓' : t}</small></button>`; }).join('')}</div><div class="dlist">${DEEDS.map(x => { const v = Math.min(x.n, d.n[x.k] || 0), done = v >= x.n; return `<div class="drow ${done ? 'done' : ''}"><span><i class="dmark">${done ? '✓' : ''}</i>${x.t}</span><b>${fmt(v)}/${fmt(x.n)}</b><em>+${x.p}</em></div>`; }).join('')}</div></div>`;
  }
  function deedClaim(t) { t = +t; const d = dd(); if (deedPts() < t || d.claimed[t]) return; d.claimed[t] = 1; give(DEED_CHESTS.find(c => c[0] === t)[1], 'Daily Deeds chest'); FX.confetti(); FX.sound('chest'); render(); }
  function eventHTML() {
    eventWeek(); const E = curEvent(), pts = S.event.pts, board = eventBoard(pts).slice(0, 10);
    return `<div class="card event" style="--ec:${E.color}"><div class="phead"><div><small class="evk">Weekly event · ends in ${fmtT(weekLeft())}</small><h4>${E.name}</h4><p class="muted">${E.desc} Points: ${Object.entries(E.pts).map(([k, v]) => `${k} ${v < 1 ? '' : '+' + v}`).join(' · ')}</p></div><div class="ptier-now"><b>${fmt(pts)}</b> pts</div></div>
      <div class="evtiers">${EV_TIERS.map(([need, r], i) => { const got = S.event.claimed.includes(i), can = pts >= need && !got; return `<div class="ptier ${got ? 'got' : ''} ${can ? 'ready' : ''}" ${can ? `data-act="evclaim" data-i="${i}"` : ''}><small>${fmt(need)}</small><div>${META.rewardHTML(r)}</div>${got ? '<i>✓</i>' : can ? '<em>Claim</em>' : ''}</div>`; }).join('')}</div>
      <details><summary>Leaderboard</summary><ol class="rank">${board.map(b => `<li class="${b.me ? 'me' : ''}">${esc(b.name)} <b>${fmt(b.pts)}</b></li>`).join('')}</ol><p class="muted">Final rank pays 50–300 gems when the week ends.</p></details></div>`;
  }
  function evClaim(i) { const [need, r] = EV_TIERS[i]; if (S.event.pts < need || S.event.claimed.includes(i)) return; S.event.claimed.push(i); META.grant(r, 'Event reward'); FX.confetti(); FX.sound('chest'); render(); }

  /* ======================= alliance world boss ======================= */
  const BOSS_HP = 3e6;
  function ensureBoss() {
    let b = S.world.find(o => o.kind === 'boss');
    if (b && b.dead && now() >= b.respawnAt) { S.world = S.world.filter(o => o !== b); b = null; }
    if (b) return b;
    const r = Math.random; let p = null;
    for (let i = 0; i < 400 && !p; i++) { const a = r() * 6.283, d = 5 + r() * 5, x = Math.round(CX + Math.cos(a) * d), y = Math.round(CY + Math.sin(a) * d); if (isLand(x, y) && !S.world.some(o => o.x === x && o.y === y)) p = [x, y]; }
    if (!p) return null;
    const lvl = 1 + (S.boss.kills || 0), hp = Math.round(BOSS_HP * Math.pow(1.25, lvl - 1));
    b = { id: S.nextId++, kind: 'boss', x: p[0], y: p[1], lvl, hp, max: hp, dmg: {}, ai: 0, name: 'Ashen Colossus' }; S.world.push(b); reveal(S, p[0], p[1], 2);
    return b;
  }
  function bossTick(dt) {
    const b = S.world.find(o => o.kind === 'boss' && !o.dead); if (!b) return;
    const hit = Math.round(b.max * .00004 * dt * (0.6 + Math.random() * .8)); b.hp -= hit;
    const who = pick(HOUSE_NAMES); b.dmg[who] = (b.dmg[who] || 0) + hit;
    if (b.hp <= 0) killBoss(b, false);
  }
  function killBoss(b, byMe) {
    b.dead = true; b.hp = 0; b.respawnAt = now() + 3600e3; S.boss.kills++;
    const r = { gems: 60, essence: 120, tokens: 1, gold: 20000 }; META.grant(r);
    report('Alliance victory · Ashen Colossus', `<p>The Order of the Dawn brought down the Colossus${byMe ? ' — <b>you landed the final blow!</b>' : '.'}</p><p>Alliance chest: ${META.rewardHTML(r)}</p>`, 'win');
    if (byMe) { FX.banner('Colossus Slain', 'You landed the final blow for your Alliance!', { art: ART.enemy('golem', 110) }); }
  }
  function hitBoss(m, b) {
    const atk = Object.entries(m.troops).reduce((a, [k, n]) => a + n * tstat(k, playerAtk()).atk, 0);
    const dmg = Math.round(atk * 6 * (1 + squadBonus()));
    b.hp -= dmg; b.dmg.you = (b.dmg.you || 0) + dmg; S.boss.dmg += dmg; on('boss', 1);
    const lost = {}; for (const [k, n] of Object.entries(m.troops)) { const l = Math.floor(n * .05); lost[k] = l; m.troops[k] -= l; } const healed = addWounded(lost);
    const r = { gold: Math.round(dmg / 8), essence: Math.min(60, 5 + Math.round(dmg / 15000)) }; m.loot.gold = (m.loot.gold || 0) + r.gold; S.essence += r.essence;
    report(`World Boss · ${fmt(dmg)} damage`, `<p>Your army struck the Ashen Colossus for <b>${fmt(dmg)}</b> damage.</p><p>+${r.essence} Ember Essence, ${fmt(r.gold)} Gold (carried home). ${fmt(troopCount(lost))} troops wounded (${fmt(healed)} to the Infirmary).</p>`, 'win');
    META.xp(20); if (b.hp <= 0) killBoss(b, true);
  }
  function bossHTML(b) {
    const top = Object.entries(b.dmg).sort((a, c) => c[1] - a[1]).slice(0, 8);
    return `<div class="bhead">${ART.enemy('golem', 90)}<div><p><b>Ashen Colossus · level ${b.lvl}</b></p>${bar(b.hp / b.max)}<p>${fmt(Math.max(0, b.hp))} / ${fmt(b.max)} HP</p><p class="muted">A world boss for the whole Alliance. Every attack earns Ember Essence and Gold; when it falls, everyone gets the Alliance chest.</p></div></div>
      <button class="btn gold" data-act="sendform" data-id="${b.id}" data-kind="attack">Attack</button>
      <div class="card"><h4>Damage ranking</h4><ol class="rank">${top.map(([n, d]) => `<li class="${n === 'you' ? 'me' : ''}">${n === 'you' ? esc(S.name) : esc(n)} <b>${fmt(d)}</b></li>`).join('') || '<li>No attacks yet</li>'}</ol></div>`;
  }
  function drawBoss(ctx, px, py, s, b, t) {
    const sc = s * 1.6; const g = ctx.createRadialGradient(px, py, 0, px, py, sc); g.addColorStop(0, 'rgba(255,90,40,.45)'); g.addColorStop(1, 'rgba(255,90,40,0)'); ctx.fillStyle = g; ctx.fillRect(px - sc, py - sc, sc * 2, sc * 2);
    ctx.fillStyle = '#00000055'; ctx.beginPath(); ctx.ellipse(px, py + s * .4, s * .6, s * .18, 0, 0, 7); ctx.fill();
    const bob = Math.sin(t / 500) * s * .03; ctx.fillStyle = '#3a3238'; ctx.beginPath(); ctx.moveTo(px - s * .45, py + s * .4); ctx.lineTo(px - s * .3, py - s * .3 + bob); ctx.lineTo(px + s * .3, py - s * .3 + bob); ctx.lineTo(px + s * .45, py + s * .4); ctx.fill();
    ctx.fillStyle = '#4a4248'; ctx.fillRect(px - s * .2, py - s * .62 + bob, s * .4, s * .34);
    ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(px - s * .08, py - s * .46 + bob, s * .04, 0, 7); ctx.arc(px + s * .08, py - s * .46 + bob, s * .04, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ff7a2a'; ctx.lineWidth = Math.max(1, s * .03); ctx.beginPath(); ctx.moveTo(px - s * .2, py); ctx.lineTo(px, py + s * .12); ctx.lineTo(px + s * .18, py - s * .04); ctx.stroke();
    const w = s * 1.1; ctx.fillStyle = '#000a'; ctx.fillRect(px - w / 2, py - s * .9, w, s * .1); ctx.fillStyle = '#ff5e3a'; ctx.fillRect(px - w / 2, py - s * .9, w * Math.max(0, b.hp / b.max), s * .1);
  }

  /* ======================= store: offers, Royal track, skins ======================= */
  const PRODUCTS = {
    founder: { name: "Founder's Pack", price: 'SAR 4.99', once: true, value: '10× value', items: { gems: 1500, shards: { saqr: 10 }, items: { sp60: 5, scroll: 5 } }, skin: 'founder' },
    card: { name: 'Royal Monthly Card', price: 'SAR 19.99', value: '3,300 gems over 30 days' },
    royal: { name: 'Royal Season Track', price: 'SAR 39.99', gems: 1500, value: 'Doubles every Season Road reward tier' },
    pack5: { name: 'Citadel 5 Pack', price: 'SAR 9.99', value: '6× value', items: { gems: 1200, items: { builder: 1, sp60: 6 }, essence: 100 } },
    pack10: { name: 'Citadel 10 Pack', price: 'SAR 24.99', value: '6× value', items: { gems: 3000, items: { sp480: 2 }, tokens: 3, essence: 300 } },
    pack15: { name: 'Citadel 15 Pack', price: 'SAR 49.99', value: '6× value', items: { gems: 6500, tokens: 8, essence: 800 } },
    noads: { name: 'Remove Ads', price: 'SAR 9.99', once: true, value: 'Forever' },
    legend: { name: 'Legend Pack', price: 'SAR 14.99', value: '5× value', items: { gems: 1000, tokens: 5, items: { scroll: 6 } } }
  };
  // The iOS app replaces the SAR labels with the App Store's localized prices (window.AELORIA_PRICES = { id: '$4.99' }).
  function applyPrices() { const P = window.AELORIA_PRICES || {}; for (const [k, v] of Object.entries(P)) { if (PRODUCTS[k]) PRODUCTS[k].price = v; const g = GEM_PACKS.find(x => x.id === k); if (g) g.price = v; } if (typeof S !== 'undefined' && S && S.b) render(); }
  window.addEventListener('aeloriaprices', applyPrices); window.AELORIA_GRANT = id => grantProduct(id); if (window.AELORIA_PRICES) setTimeout(applyPrices);
  const SKINS = {
    golden: { name: 'Golden Jubilee', gems: 800, pal: { wall: '#ecd08a', wall2: '#c9a24a', wall3: '#9c7a2a', roof: '#8a1f2a' } },
    moonlit: { name: 'Moonlit Citadel', gems: 800, pal: { wall: '#c9d6f0', wall2: '#9aa6c8', wall3: '#6a7698', roof: '#5a3a9a' } },
    sakura: { name: 'Sakura Spring', gems: 1000, pal: { roof: '#e87aa0', tree: 'cherry' } },
    ember: { name: 'Emberforge', gems: 1200, pal: { wall: '#5a5058', wall2: '#3a3238', wall3: '#2a2228', roof: '#ff7a2a' } },
    founder: { name: "Founder's Crown", gems: 0, pal: { wall: '#f2ede4', wall2: '#d8cfbf', wall3: '#b0a58f', roof: '#2b4a8a' } }
  };
  const skinPal = () => (SKINS[S.skin] || {}).pal || {};
  function applySkin() { ART.setRealm(S.realm, skinPal()); $('#cityView').innerHTML = ''; if (window.CITY3D) CITY3D.rebuild(); if (tab === 'city') renderCity(); }
  function checkMilestones() {
    const want = [[5, 'pack5'], [10, 'pack10'], [15, 'pack15']].filter(([c]) => S.b.citadel >= c).map(([, p]) => p);
    if (Object.values(S.heroes).some(h => h.stars && HERO[Object.keys(S.heroes).find(k => S.heroes[k] === h)]?.rarity === 'legendary')) want.push('legend');
    for (const p of want) if (!S.shop.seen[p]) { S.shop.seen[p] = 1; S.shop.packs.push({ id: p, until: now() + 2 * DAY }); }
    S.shop.packs = S.shop.packs.filter(p => p.until > now() && !p.bought);
  }
  const priceBtn = (id, label) => pay() ? `<button class="btn gold" data-act="buyprod" data-id="${id}">${label || PRODUCTS[id].price}</button>` : `<button class="btn soon" data-act="soon">${PRODUCTS[id].price}</button>`;
  function offersTab() {
    checkMilestones();
    const sh = S.shop, cardLeft = sh.card > now() ? Math.ceil((sh.card - now()) / DAY) : 0, cardClaim = cardLeft && sh.cardDay !== today();
    return `${pay() ? '' : '<p class="muted center">Real-money offers open with the mobile release. Prices are shown for reference.</p>'}
    ${sh.founder ? '' : `<div class="offer-big founder"><div class="ob-art">${ART.portrait(HERO.saqr, 110)}</div><div><span class="tag2">${PRODUCTS.founder.value} · one time</span><h3>Founder's Pack</h3><p>1,500 gems · 10 Saqr shards (recruit her!) · 5 one-hour hourglasses · 5 Hero Tomes · the Founder's Crown city skin</p>${priceBtn('founder')}</div></div>`}
    <div class="offer-big card-o"><div class="ob-art">${ART.icon('chest', 96)}</div><div><span class="tag2">Best value</span><h3>Royal Monthly Card</h3><p>300 gems now, then <b>100 gems every day for 30 days</b>, +300 VIP points.</p>${cardLeft ? `<p><b>${cardLeft} days left</b></p>${cardClaim ? '<button class="btn gold" data-act="cardclaim">Claim today: 100 gems</button>' : '<span class="muted">Claimed today</span>'}` : priceBtn('card')}</div></div>
    ${sh.packs.map(p => `<div class="offer-big milestone"><div><span class="tag2">${PRODUCTS[p.id].value} · ends in ${fmtT((p.until - now()) / 1000)}</span><h3>${PRODUCTS[p.id].name}</h3><div class="rws">${META.rewardHTML(PRODUCTS[p.id].items)}</div>${priceBtn(p.id)}</div></div>`).join('')}
    <div class="offer-big royal"><div><span class="tag2">Season Road</span><h3>Royal Season Track</h3><p>${PRODUCTS.royal.value}: a second reward row on all 30 tiers, claimable right away for tiers already reached.</p>${S.shop.royalPass ? '<b class="good">Unlocked</b>' : `${priceBtn('royal')} <button class="btn gold" data-act="royalgems">${ART.icon('gem', 14)} ${fmt(PRODUCTS.royal.gems)}</button>`}</div></div>
    ${ADS.available() && !S.shop.noAds ? `<div class="offer-big noads"><div class="ob-art">${ART.emblem(90)}</div><div><span class="tag2">One time · forever</span><h3>Remove Ads</h3><p>No more interstitial, banner or app-open ads. Optional reward videos stay available for bonuses.</p>${priceBtn('noads')}</div></div>` : ''}`;
  }
  function skinsTab() {
    return `<p class="muted">City skins change your citadel's colours and trees. They are cosmetic only.</p><div class="chests">${Object.entries(SKINS).map(([k, sk]) => {
      const own = S.skins.includes(k), on2 = S.skin === k, R = { ...REALMS[S.realm], ...sk.pal };
      return `<div class="chestcard skin" style="--c:${R.roof}"><svg viewBox="-80 -130 160 150" width="130" height="120">${(() => { ART.setRealm(S.realm, sk.pal); const g = ART.building('citadel', 5); ART.setRealm(S.realm, skinPal()); return g; })()}</svg><h4>${sk.name}</h4><div class="swatches"><i style="background:${R.wall}"></i><i style="background:${R.wall2}"></i><i style="background:${R.roof}"></i></div>${on2 ? '<b class="good">Active</b>' : own ? `<button class="btn gold" data-act="skin" data-k="${k}">Use</button>` : k === 'founder' ? '<span class="muted">Founder\'s Pack</span>' : `<button class="btn gold" data-act="buyskin" data-k="${k}">${ART.icon('gem', 14)} ${fmt(sk.gems)}</button>`}</div>`;
    }).join('')}</div>${S.skin ? '<button class="btn" data-act="skin" data-k="">Use realm default</button>' : ''}`;
  }
  async function buyProduct(id) {
    const P = PRODUCTS[id], p = pay(); if (!P || !p) return;
    try { if (!(await p.buy(id))) return; } catch (e) { return toast(e && e.message && e.message !== 'cancelled' ? e.message : 'Purchase cancelled', 'bad'); }
    grantProduct(id);
  }
  // Grants a paid product. Also called by the iOS app (window.AELORIA_GRANT) for purchases approved later.
  function grantProduct(id) {
    if (!PRODUCTS[id]) return META.grantPack(id);
    const P = PRODUCTS[id];
    if (id === 'card') { S.shop.card = Math.max(now(), S.shop.card) + 30 * DAY; S.shop.cardDay = ''; S.gems += 300; S.vip += 300; }
    else if (id === 'royal') S.shop.royalPass = true;
    else if (id === 'noads') S.shop.noAds = true;
    else { META.grant(P.items, P.name); if (P.skin && !S.skins.includes(P.skin)) S.skins.push(P.skin); if (id === 'founder') S.shop.founder = true; const pk = S.shop.packs.find(x => x.id === id); if (pk) pk.bought = true; }
    S.vip += 200; FX.confetti(); FX.sound('chest'); save(); render();
  }
  // Royal Season track: a second reward row
  const royalReward = t => t % 10 === 0 ? { tokens: 2, gems: 200, essence: 100 } : t % 5 === 0 ? { gems: 100, essence: 40 } : [{ gems: 40 }, { essence: 25 }, { items: { sp60: 1 } }, { items: { scroll: 2 } }, { gold: 8000 }, { items: { crate: 2 } }][t % 6];
  function royalRow(tier) {
    return `<div class="royalrow ${S.shop.royalPass ? '' : 'locked'}"><span class="rlabel">👑 Royal</span>${Array.from({ length: 30 }, (_, n) => { const t = n + 1, got = S.pass.royal[t], can = S.shop.royalPass && t <= tier && !got; return `<div class="ptier royal ${got ? 'got' : ''} ${can ? 'ready' : ''}" ${can ? `data-act="royalclaim" data-t="${t}"` : ''}><small>${t}</small><div>${META.rewardHTML(royalReward(t))}</div>${got ? '<i>✓</i>' : can ? '<em>Claim</em>' : S.shop.royalPass ? '' : '<i class="lk">🔒</i>'}</div>`; }).join('')}</div>${S.shop.royalPass ? '' : '<button class="btn sm gold" data-act="sub" data-s="offers">Unlock the Royal track</button>'}`;
  }
  function royalClaim(t) { t = +t; const tier = Math.floor(S.pass.xp / 120); if (!S.shop.royalPass || t > tier || S.pass.royal[t]) return; S.pass.royal[t] = 1; META.grant(royalReward(t), `Royal track ${t}`); FX.sound('chest'); render(); }

  /* ======================= rewarded ads (hook only) ======================= */
  function adButton(placement, label, extra = '') { return ads() ? `<button class="btn adbtn" data-act="ad" data-p="${placement}" ${extra}>▶ ${label}</button>` : ''; }
  async function watchAd(placement, d) {
    const a = ads(); if (!a) return; S.adsDay = S.adsDay === today() ? S.adsDay : today(); S.adsCount = S.adsDay === today() ? (S.adsCount || 0) : 0;
    if ((S.adsCount || 0) >= ADS.dailyCap) return toast('Daily ad rewards used up — come back tomorrow');
    let ok = false; try { ok = await a.show(placement); } catch (e) { } if (!ok) return;
    S.adsCount = (S.adsCount || 0) + 1;
    if (placement === 'speed') { const t = timerRef(d.kind, d.key || undefined); if (t) t.end -= 15 * 60e3; toast('15 minutes skipped', 'good'); }
    else if (placement === 'arena') { S.arena.tickets++; toast('+1 Arena ticket', 'good'); }
    else if (placement === 'vigor') { S.vigor += 12; toast('+12 Vigor', 'good'); }
    else if (placement === 'chest') { give({ gems: 15 }, 'Ad reward'); }
    else if (placement === 'victory') { const g = +d.g || 0; if (g) give({ gold: g }, 'Victory doubled'); document.querySelectorAll('.adbtn[data-p="victory"]').forEach(b => b.remove()); FX.confetti(); return save(); }
    else if (placement === 'welcome') { const w = window.__wbGot; window.__wbGot = null; if (w) give(w, 'Harvest doubled'); FX.confetti(); }
    tick(); render();
  }

  /* ======================= comeback + notifications ======================= */
  function comeback(awaySec) {
    if (awaySec < DAY / 1000) return;
    const d = Math.min(3, Math.floor(awaySec / (DAY / 1000))), r = { gems: 50 * d, essence: 30 * d, items: { sp60: d } };
    setTimeout(() => { META.grant(r); FX.banner('Welcome Back!', `Your realm missed you. Comeback gift: ${50 * d} gems, ${30 * d} Ember Essence and ${d} one-hour hourglass${d > 1 ? 'es' : ''}.`, { art: ART.emblem(110) }); }, 1500);
  }
  const canNotify = () => 'Notification' in window && Notification.permission === 'granted';
  async function askNotify() { if (!('Notification' in window)) return toast('This browser has no notifications', 'bad'); const p = await Notification.requestPermission(); toast(p === 'granted' ? 'Notifications on' : 'Notifications blocked', p === 'granted' ? 'good' : 'bad'); openMenu(); }
  function notify(title, body) { if (document.hidden && canNotify()) try { new Notification(title, { body, icon: 'icon-512.png', tag: title }); } catch (e) { } }
  let prev = { q: 0, t: false, r: false, inc: false };
  function watch() {
    const q = S.queue.length, t = !!S.training, r = !!S.rq, inc = !!S.incoming;
    if (q < prev.q) notify('Construction complete', 'A builder is free in your citadel.');
    if (prev.t && !t) notify('Troops ready', 'Your Barracks finished training.');
    if (prev.r && !r) notify('Research complete', 'Your Royal Academy is ready for the next study.');
    if (inc && !prev.inc) notify('⚠ Attack incoming!', `${S.incoming.name} is marching on your city.`);
    prev = { q, t, r, inc };
  }

  /* ======================= tick + actions ======================= */
  let lastBoss = 0;
  function tickLive(dt) {
    if (!S || !S.world) return;
    if (now() - lastBoss > 5000) { lastBoss = now(); ensureBoss(); }
    bossTick(dt); eventWeek(); watch();
  }
  function act(a, d, el) {
    switch (a) {
      case 'gearforge': forge(d.id, d.s); return true;   // hero gear (the Royal Forge store uses 'forge' in meta.js)
      case 'arena': openTab('arena'); return true;
      case 'arenafight': arenaFight(+d.i); return true;
      case 'arenaleave': leaveFight(); openTab('arena'); return true;
      case 'arenaclaim': { const t = tierOf(S.arena.rating); if (S.arena.claimed === today()) return true; S.arena.claimed = today(); give({ gems: t[3] }, `${t[1]} daily reward`); S.arena.glory += t[3]; FX.sound('chest'); render(); return true; }
      case 'arenarefresh': if (S.arena.refreshes > 0) S.arena.refreshes--; else { if (S.gems < 20) { toast('Not enough gems', 'bad'); return true; } spendGems(20); } genOpps(); render(); return true;
      case 'arenaticket': if (S.gems < 50) { toast('Not enough gems', 'bad'); return true; } spendGems(50); S.arena.tickets++; render(); return true;
      case 'glorybuy': { const g = GLORY[+d.i]; if (S.arena.glory < g.cost) { toast('Not enough Glory', 'bad'); return true; } S.arena.glory -= g.cost; META.grant(g.give(), g.name); render(); return true; }
      case 'evclaim': evClaim(+d.i); return true;
      case 'deed': deedClaim(d.t); return true;
      case 'deedinfo': toast(dd().claimed[d.t] ? 'You already opened this chest today' : `Reach ${d.t} points today to open this chest (you have ${deedPts()})`); return true;
      case 'soon': toast('Purchases open with the mobile release. Everything here can also be earned by playing.'); return true;
      case 'buyprod': buyProduct(d.id); return true;
      case 'cardclaim': if (S.shop.card > now() && S.shop.cardDay !== today()) { S.shop.cardDay = today(); give({ gems: 100 }, 'Monthly Card'); FX.sound('coin'); render(); } return true;
      case 'royalgems': if (S.gems < PRODUCTS.royal.gems) { toast('Not enough gems', 'bad'); return true; } spendGems(PRODUCTS.royal.gems); S.shop.royalPass = true; FX.confetti(); FX.sound('chest'); render(); return true;
      case 'royalclaim': royalClaim(d.t); return true;
      case 'buyskin': { const sk = SKINS[d.k]; if (S.gems < sk.gems) { toast('Not enough gems', 'bad'); return true; } spendGems(sk.gems); S.skins.push(d.k); S.skin = d.k; applySkin(); FX.confetti(); render(); return true; }
      case 'skin': S.skin = d.k; applySkin(); render(); toast(d.k ? `${SKINS[d.k].name} applied` : 'Realm default applied', 'good'); return true;
      case 'ad': watchAd(d.p, d); return true;
      case 'adprivacy': ADS.privacy(); return true;
      case 'appsettings': if (window.AeloriaNative && window.AeloriaNative.openSettings) window.AeloriaNative.openSettings(); return true;
      case 'restore': { const p = pay(); if (!p || !p.restore) return true; Promise.resolve(p.restore()).then(ids => { ids = ids || []; if (ids.includes('noads')) S.shop.noAds = true; if (ids.includes('royal')) S.shop.royalPass = true; save(); toast(ids.length ? 'Purchases restored' : 'Nothing to restore', ids.length ? 'good' : ''); render(); openMenu(); }).catch(() => toast('Restore failed — try again', 'bad')); return true; }
      case 'notify': askNotify(); return true;
    }
    return false;
  }
  return { deedsHTML, deedReady, migrate, gearMult, gearMight, gearHTML, synergy, squadUnits, renderArena, endArena, on, eventHTML, ensureBoss, hitBoss, bossHTML, drawBoss, offersTab, skinsTab, skinPal, royalRow, adButton, comeback, tick: tickLive, act, curEvent };
})();
