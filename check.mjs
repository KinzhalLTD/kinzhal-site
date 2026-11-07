// After publishing: node check.mjs  → confirms every game URL and app-ads.txt answer with 200 on the live domain.
import fs from 'node:fs';
const D = JSON.parse(fs.readFileSync('site.json', 'utf8')).domain.replace(/\/$/, '');
const G = JSON.parse(fs.readFileSync('games.json', 'utf8'));
const urls = ['/app-ads.txt', '/', ...G.flatMap(g => [`/${g.slug}/`, `/${g.slug}/privacy/`, `/${g.slug}/support/`, `/${g.slug}/terms/`])];
let bad = 0;
for (const u of urls) { const r = await fetch(D + u).catch(e => ({ status: e.message })); if (r.status !== 200) { bad++; console.log('✕', r.status, D + u); } }
const ads = await (await fetch(D + '/app-ads.txt')).text().catch(() => '');
if (!/^google\.com,\s*pub-\d+/m.test(ads)) { bad++; console.log('✕ app-ads.txt has no AdMob line yet'); }
console.log(bad ? `${bad} problem(s)` : `All ${urls.length} URLs OK ✓`);
process.exit(bad ? 1 : 0);
