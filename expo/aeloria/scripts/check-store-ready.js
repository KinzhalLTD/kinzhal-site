// `npm run check:store` — lists anything that would block or weaken the App Store submission.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), rd = p => fs.readFileSync(path.join(root, p), 'utf8');
const fails = [], warns = [], ok = [];
const check = (cond, good, bad, warnOnly) => cond ? ok.push(good) : (warnOnly ? warns : fails).push(bad);
const PUB = 'pub-5681105275743934', TEST_PUB = '3940256099942544';

const app = JSON.parse(rd('app.json')).expo;
check(app.ios && /^[a-z0-9.-]+$/i.test(app.ios.bundleIdentifier || '') && !/example|amjad/.test(app.ios.bundleIdentifier), `bundle ID ${app.ios.bundleIdentifier}`, 'ios.bundleIdentifier is missing or a placeholder');
const gma = (app.plugins || []).find(p => Array.isArray(p) && p[0] === 'react-native-google-mobile-ads');
check(gma && gma[1].iosAppId && gma[1].iosAppId.includes(PUB.slice(4)) && !gma[1].iosAppId.includes(TEST_PUB), 'real AdMob iOS app ID', 'AdMob iosAppId is missing or still Google\'s test ID');
check(gma && (gma[1].skAdNetworkItems || []).includes('cstr6suwn9.skadnetwork'), 'SKAdNetwork IDs present', 'skAdNetworkItems must include cstr6suwn9.skadnetwork');
check(app.ios.infoPlist && app.ios.infoPlist.ITSAppUsesNonExemptEncryption === false, 'export compliance set', 'ITSAppUsesNonExemptEncryption must be false');
check(app.ios.infoPlist && app.ios.infoPlist.NSUserTrackingUsageDescription, 'tracking prompt text set', 'NSUserTrackingUsageDescription missing');

const cfg = rd('src/adConfig.js');
check(!/USE_TEST_ADS\s*=\s*true/.test(cfg), 'USE_TEST_ADS is off in store builds', 'USE_TEST_ADS = true: store builds would show test ads');
const units = [...cfg.matchAll(/'(ca-app-pub-[^']+)'/g)].map(m => m[1]);
check(units.length >= 7 && units.every(u => u.includes(PUB.slice(4))), `${units.length} real AdMob IDs in adConfig`, 'adConfig has missing or test ad unit IDs');
const gameUnits = [...rd('www/ads.js').matchAll(/'(ca-app-pub-[^']+)'/g)].map(m => m[1]);
check(gameUnits.length && gameUnits.every(u => units.includes(u)), 'game and app use the same ad units', 'www/ads.js ad units differ from src/adConfig.js');

const png = fs.readFileSync(path.join(root, 'assets/icon.png'));
const w = png.readUInt32BE(16), h = png.readUInt32BE(20), colorType = png[25];
check(w === 1024 && h === 1024 && colorType === 2, 'icon 1024×1024 RGB, no alpha', `assets/icon.png must be 1024×1024 RGB without alpha (is ${w}×${h}, color type ${colorType})`);

const gh = path.join(root, 'src/gameHtml.js');
check(fs.existsSync(gh) && fs.statSync(gh).size > 1e6 && rd('src/gameHtml.js').includes('AELORIA_PACKED=true'), `game packed (${fs.existsSync(gh) ? (fs.statSync(gh).size / 1048576).toFixed(1) : 0} MB)`, 'src/gameHtml.js missing: run npm run build:game');

const ac = rd('src/appConfig.js');
check(!/\[YOUR_|example\.com/.test(ac) && /https:\/\//.test(ac), 'privacy/terms/support URLs set', 'src/appConfig.js still has placeholders');
check(rd('website/app-ads.txt').includes(`google.com, ${PUB}, DIRECT, f08c47fec0942fa0`), 'app-ads.txt line ready', 'website/app-ads.txt is missing the AdMob line');
for (const f of ['store/listing-en.txt', 'store/listing-ar.txt', 'store/listing-zh.txt', 'store/listing-de.txt', 'store/listing-ru.txt']) check(!/\[YOUR_|TODO|XXXX/.test(rd(f)), `${f} complete`, `${f} has placeholders`);

const pk = JSON.parse(rd('package.json'));
check(pk.dependencies['react-native-iap'], 'in-app purchases module listed', 'react-native-iap missing from package.json', true);
warns.push('Create the 13 in-app purchase products in App Store Connect (APP_STORE_SUBMISSION.md §4) before submitting.');
warns.push('Confirm https://kinzhal.space/app-ads.txt is live (it is published from the kinzhal-site main branch).');

console.log('\n✓ ' + ok.join('\n✓ '));
if (warns.length) console.log('\n! ' + warns.join('\n! '));
if (fails.length) { console.log('\n✗ ' + fails.join('\n✗ ') + '\n'); process.exit(1); }
console.log('\nStore check passed.\n');
