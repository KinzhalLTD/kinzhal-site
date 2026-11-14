// Record app-preview footage via CDP screencast (886x1920 frames, timestamped).
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [W, H, LANG, OUT] = [+process.argv[2], +process.argv[3], process.argv[4], process.argv[5]];
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await c.addInitScript(l => { try { localStorage.setItem('aeloria-lang', l); } catch (e) { } }, LANG);
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(800);
  await p.evaluate(() => { S = newState('Aldric', '#e8a33d', 'greenhold'); Object.assign(S.b, { citadel: 9, barracks: 7, academy: 5, market: 4, mews: 5, embassy: 3, infirmary: 4, vault: 4, tower: 5, wall: 6 });
    for (let i = 0; i < 16; i++) S.fields[i] = { t: ['farm', 'lumber', 'quarry', 'mine'][i % 4], l: 5 + (i % 4) };
    for (const id of ['arthur', 'kofi', 'lian', 'astrid', 'elowen', 'rania', 'saqr', 'antarah', 'zarqa', 'aldric', 'hiro', 'sigrun', 'peter']) S.heroes[id] = { lvl: 24 + (id.length % 7), xp: 0, stars: 3 + (id.length % 3), shards: 0 };
    S.squad = ['arthur', 'kofi', 'lian']; S.res = { grain: 182400, timber: 164200, stone: 98300, ore: 61200, gold: 75800 }; S.gems = 2480; S.vip = 2600; S.troops = { inf2: 4200, rng2: 3100, cav2: 2600, sie1: 300 };
    for (let c = 1; c <= 2; c++) for (let n = 1; n <= 6; n++) S.stages[c + '-' + n] = 3; S.seenStory['1i'] = S.seenStory['3i'] = S.seenStory['2i'] = 1; S.login.last = today(); S.free = today(); S.quest = 12; S.forge = { harvest: 34, engineer: 28, legion: 22, spirit: 19, coffers: 15, roads: 12, pockets: 10, banners: 8 }; S.trial = { day: today(), left: 3, best: 0 }; save(); });
  await p.reload(); await p.waitForTimeout(4500);
  const cdp = await c.newCDPSession(p); const frames = []; let n = 0; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  cdp.on('Page.screencastFrame', async f => { const fn = `${OUT}/${String(n++).padStart(5, '0')}.jpg`; fs.writeFileSync(fn, Buffer.from(f.data, 'base64')); frames.push([fn, f.metadata.timestamp]); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  const clean = () => p.evaluate(() => { closeSheet(); document.querySelectorAll('.toast,.speech').forEach(x => x.remove()); });
  // Scene 1: chapter card intro
  await clean(); await p.evaluate(() => chapterCard(3, () => {}));
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W * 2, maxHeight: H * 2, everyNthFrame: 1 });
  await p.waitForTimeout(3200); await p.evaluate(() => document.querySelectorAll('.ccard').forEach(x => x.remove()));
  // Scene 2: city, gentle scroll
  await clean(); for (let i = 0; i < 30; i++) { await p.evaluate(() => { $('#cityView').scrollTop += 3; }); await p.waitForTimeout(100); }
  // Scene 3: battle with skills
  await p.evaluate(() => { S.autoSkill = true; startStage('3-2', true); }); await p.waitForTimeout(3800);
  await p.evaluate(() => { fight.pauseUntil = 0; const u = fight.heroes[0]; u.en = 100; castSkill(u, 1.5); }); await p.waitForTimeout(5200);
  // Scene 4: story
  await p.evaluate(() => { leaveFight(); closeSheet(); playStory([['hollow', 'You bring me the last shards yourself? How… generous.'], ['arthur', 'And every age has sent its legends. Let them stand together. For Aeloria!']], 'The Sunspire', null, 6); }); await p.waitForTimeout(2200);
  await p.evaluate(() => document.querySelector('.story .st-box') && document.querySelector('.story .st-box').click()); await p.waitForTimeout(80); await p.evaluate(() => document.querySelector('.story .st-box') && document.querySelector('.story .st-box').click()); await p.waitForTimeout(2200); await p.evaluate(() => document.querySelector('.story .st-skip')?.click());
  // Scene 5: heroes roster scroll
  await p.evaluate(() => openTab('heroes')); await p.waitForTimeout(500); await p.evaluate(() => { const g = document.querySelector('.heroes.figs'); $('#panel').scrollTo({ top: g.offsetTop - 12, behavior: 'smooth' }); }); await p.waitForTimeout(2600);
  // Scene 6: world pan
  await p.evaluate(() => openTab('world')); await p.waitForTimeout(400); await p.evaluate(() => { cam.z = .82; centerOn(S.home.x + 1, S.home.y - 1); clampCam(); document.querySelectorAll('.toast').forEach(x => x.remove()); });
  for (let i = 0; i < 35; i++) { await p.evaluate(() => { cam.x += 2.2; clampCam(); }); await p.waitForTimeout(100); }
  // Scene 7: forge
  await p.evaluate(() => META.act('sub', { s: 'forge' })); await p.waitForTimeout(2600);
  await cdp.send('Page.stopScreencast'); await p.waitForTimeout(300);
  fs.writeFileSync(`${OUT}/list.json`, JSON.stringify(frames)); console.log('frames', frames.length, 'secs', (frames.at(-1)[1] - frames[0][1]).toFixed(1), errs);
  await b.close();
})();
