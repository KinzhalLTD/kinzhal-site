// Capture raw game screens at an iPhone viewport (DPR 3) for the App Store kit.
const { chromium } = require('playwright');
const [W, H, tag, DPR, LANG] = [+process.argv[2], +process.argv[3], process.argv[4], +process.argv[5] || 3, process.argv[6] || 'en'];
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async () => { const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true }); await c.addInitScript(l => { try { localStorage.setItem('aeloria-lang', l); } catch (e) { } }, LANG); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); return [c, p]; };
  const save = (p) => p.evaluate(() => { S = newState('Aldric', '#e8a33d', 'greenhold'); Object.assign(S.b, { citadel: 9, barracks: 7, academy: 5, market: 4, mews: 5, embassy: 3, infirmary: 4, vault: 4, tower: 5, wall: 6 });
    for (let i = 0; i < 16; i++) S.fields[i] = { t: ['farm', 'lumber', 'quarry', 'mine'][i % 4], l: 5 + (i % 4) };
    for (const id of ['arthur', 'kofi', 'lian', 'astrid', 'elowen', 'rania', 'saqr', 'antarah', 'zarqa', 'aldric', 'hiro', 'sigrun', 'peter']) S.heroes[id] = { lvl: 24 + (id.length % 7), xp: 0, stars: 3 + (id.length % 3), shards: 0 };
    S.squad = ['arthur', 'kofi', 'lian']; S.res = { grain: 182400, timber: 164200, stone: 98300, ore: 61200, gold: 75800 }; S.gems = 2480; S.vip = 2600; S.troops = { inf2: 4200, rng2: 3100, cav2: 2600, sie1: 300 };
    for (let c = 1; c <= 2; c++) for (let n = 1; n <= 6; n++) S.stages[c + '-' + n] = 3; S.seenStory['1i'] = S.seenStory['3i'] = S.seenStory['2i'] = 1; S.login.last = today(); S.free = today(); S.quest = 12; S.forge = { harvest: 34, engineer: 28, legion: 22, spirit: 19, coffers: 15, roads: 12, pockets: 10, banners: 8 }; S.trial = { day: today(), left: 3, best: 0 }; save(); });
  let [c, p] = await mk();
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(4200); await p.screenshot({ path: `raw/${tag}-1-title.png` });
  await save(p); await p.reload(); await p.waitForTimeout(5000);
  const clean = () => p.evaluate(() => { closeSheet(); document.querySelectorAll('.toast,.cine,.speech').forEach(x => x.remove()); });
  await clean(); await p.waitForTimeout(800); await p.evaluate(() => { const v = $('#cityView'); v.scrollTop += 40; }); await p.waitForTimeout(500); await p.screenshot({ path: `raw/${tag}-3-city.png` });
  await p.evaluate(() => { S.autoSkill = false; startStage('3-2', true); }); await p.waitForTimeout(4300);
  await p.evaluate(() => { fight.pauseUntil = 0; const u = fight.heroes[0]; u.en = 100; castSkill(u, 1.5); }); await p.waitForTimeout(430); console.log('cutin', await p.evaluate(() => { const c = document.querySelector('.cutin.fig'); if (c) [c, ...c.querySelectorAll('*')].forEach(e => e.getAnimations().forEach(a => a.pause())); return !!c; })); await p.screenshot({ path: `raw/${tag}-2-battle.png` });
  await p.evaluate(() => { leaveFight(); closeSheet(); chapterCard(3, () => {}); }); await p.waitForTimeout(2900); await p.screenshot({ path: `raw/${tag}-7-chapter.png` }); await p.evaluate(() => document.querySelectorAll('.ccard').forEach(x => x.remove()));
  await p.evaluate(() => { openTab('heroes'); }); await p.waitForTimeout(1200); await p.evaluate(() => { const g = document.querySelector('.heroes.figs'); $('#panel').scrollTop = g.offsetTop - 12; }); await p.waitForTimeout(700); await p.screenshot({ path: `raw/${tag}-4-heroes.png` });
  await p.evaluate(() => { openTab('city'); closeSheet(); playStory([['hollow', 'Kings come and go, little crown. The ash remains.'], ['arthur', 'Then I will be the last king you ever face.']], 'The Sunspire', null, 6); }); await p.waitForTimeout(1500);
  await p.click('.story .st-box'); await p.waitForTimeout(80); await p.click('.story .st-box'); await p.waitForTimeout(1900); await p.screenshot({ path: `raw/${tag}-5-story.png` });
  await p.evaluate(() => { document.querySelector('.story .st-skip')?.click(); }); await p.waitForTimeout(600);
  await p.evaluate(() => { openTab('world'); }); await p.waitForTimeout(1500); await p.evaluate(() => { cam.z = .82; centerOn(S.home.x + 1, S.home.y - 1); clampCam(); document.querySelectorAll('.toast').forEach(x => x.remove()); }); await p.waitForTimeout(1500); await p.screenshot({ path: `raw/${tag}-6-world.png` });
  await p.evaluate(() => { META.act('sub', { s: 'forge' }); }); await p.waitForTimeout(900); await p.screenshot({ path: `raw/${tag}-8-forge.png` });
  console.log(tag, errs); await b.close();
})();
