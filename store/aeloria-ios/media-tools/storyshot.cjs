// Re-captures only the story screen, using real (translated) story lines.
const { chromium } = require('playwright');
const [W, H, tag, DPR, LANG] = [+process.argv[2], +process.argv[3], process.argv[4], +process.argv[5] || 3, process.argv[6] || 'en'];
(async () => {
  const b = await chromium.launch(); const errs = [];
  const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
  await c.addInitScript(l => { try { localStorage.setItem('aeloria-lang', l); } catch (e) { } }, LANG);
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
  const save = (p) => p.evaluate(() => { S = newState('Aldric', '#e8a33d', 'greenhold'); Object.assign(S.b, { citadel: 9, barracks: 7, academy: 5, market: 4, mews: 5, embassy: 3, infirmary: 4, vault: 4, tower: 5, wall: 6 });
    for (let i = 0; i < 16; i++) S.fields[i] = { t: ['farm', 'lumber', 'quarry', 'mine'][i % 4], l: 5 + (i % 4) };
    for (const id of ['arthur', 'kofi', 'lian', 'astrid', 'elowen', 'rania', 'saqr', 'antarah', 'zarqa', 'aldric', 'hiro', 'sigrun', 'peter']) S.heroes[id] = { lvl: 24 + (id.length % 7), xp: 0, stars: 3 + (id.length % 3), shards: 0 };
    S.squad = ['arthur', 'kofi', 'lian']; S.res = { grain: 182400, timber: 164200, stone: 98300, ore: 61200, gold: 75800 }; S.gems = 2480; S.vip = 2600; S.troops = { inf2: 4200, rng2: 3100, cav2: 2600, sie1: 300 };
    for (let c = 1; c <= 2; c++) for (let n = 1; n <= 6; n++) S.stages[c + '-' + n] = 3; S.seenStory['1i'] = S.seenStory['3i'] = S.seenStory['2i'] = 1; S.login.last = today(); S.free = today(); S.quest = 12; S.forge = { harvest: 34, engineer: 28, legion: 22, spirit: 19, coffers: 15, roads: 12, pockets: 10, banners: 8 }; S.trial = { day: today(), left: 3, best: 0 }; save(); });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500);
  await save(p); await p.reload(); await p.waitForTimeout(4000);
  await p.evaluate(() => { closeSheet(); document.querySelectorAll('.toast,.cine,.speech').forEach(x => x.remove()); playStory([['hollow', 'You bring me the last shards yourself? How… generous.'], ['arthur', 'And every age has sent its legends. Let them stand together. For Aeloria!']], 'The Sunspire', null, 6); });
  await p.waitForTimeout(1500); await p.click('.story .st-box'); await p.waitForTimeout(80); await p.click('.story .st-box'); await p.waitForTimeout(2200);
  await p.screenshot({ path: `raw/${tag}-5-story.png` });
  console.log(tag, 'story', await p.evaluate(() => document.querySelector('.story .st-box') && document.querySelector('.story .st-box').textContent.slice(0, 60)), errs.length ? errs : '');
  await b.close();
})();
