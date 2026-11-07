// Builds the static site for kinzhal.space from games.json and site.json.
//   node build.mjs        → writes everything into public/
// Add a game: add one entry to games.json (slug, name, nameAr, genre, genreAr, status, color, appStoreId), run the build.
import fs from 'node:fs';
import path from 'node:path';

const SITE = JSON.parse(fs.readFileSync('site.json', 'utf8'));
const GAMES = JSON.parse(fs.readFileSync('games.json', 'utf8'));
const OUT = 'public';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const D = SITE.domain.replace(/\/$/, '');
const write = (rel, html) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };

for (const g of GAMES) if (!/^[a-z0-9-]{2,40}$/.test(g.slug)) throw new Error('Bad slug: ' + g.slug);
if (new Set(GAMES.map(g => g.slug)).size !== GAMES.length) throw new Error('Duplicate slug in games.json');

const CSS = `:root{--bg:#07060c;--panel:#120e1f;--line:#272040;--ink:#f2eeff;--ink2:#b4acd4;--pink:#ff2bd6;--cyan:#27e2ff;--good:#3dffa9}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:radial-gradient(1100px 560px at 15% -10%,#ff2bd61f,transparent 60%),radial-gradient(900px 560px at 95% 0%,#27e2ff1a,transparent 60%),var(--bg);color:var(--ink);font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Arabic","IBM Plex Sans Arabic",sans-serif}
a{color:var(--cyan)}main{max-width:1000px;margin:0 auto;padding:22px 16px 56px}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:22px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:.12em;color:var(--ink);text-decoration:none}
.brand img{width:40px;height:40px;border-radius:10px;box-shadow:0 0 16px #ff2bd666}
nav a{color:var(--ink2);text-decoration:none;margin-inline-start:14px;font-size:14px}nav a:hover{color:var(--ink)}
h1{font-size:clamp(28px,5vw,44px);line-height:1.12;margin:0 0 10px;background:linear-gradient(90deg,var(--pink),var(--cyan));-webkit-background-clip:text;background-clip:text;color:transparent}
h2{font-size:19px;margin:28px 0 10px}h3{font-size:16px;margin:18px 0 6px;color:var(--cyan)}
p,li{color:var(--ink2)}.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px;margin-bottom:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.game{display:block;text-decoration:none;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;transition:border-color .2s,transform .2s}
.game:hover{border-color:var(--pink);transform:translateY(-2px)}
.ico{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;font-weight:800;font-size:20px;color:#07060c;margin-bottom:10px}
.muted{color:var(--ink2);font-size:14px}.pill{display:inline-block;font-size:11.5px;padding:2px 9px;border-radius:999px;border:1px solid var(--line);color:var(--ink2);margin-top:6px}
.pill.live{border-color:#3dffa955;color:var(--good)}
.btn{display:inline-block;padding:10px 18px;border-radius:999px;border:1px solid var(--pink);color:var(--ink);text-decoration:none;font-weight:700;box-shadow:0 0 14px #ff2bd655;margin:4px 6px 4px 0}
.ar{direction:rtl;text-align:right}
footer{margin-top:36px;padding-top:16px;border-top:1px solid var(--line);color:var(--ink2);font-size:14px;display:flex;gap:16px;flex-wrap:wrap}
footer a{color:var(--cyan)}`;

const page = ({ title, desc, rel, body, noindex }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${D}/${rel}">
<link rel="icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${D}/og-image.jpg">
<meta name="theme-color" content="#07060c">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<style>${CSS}</style>
</head>
<body><main>
<header><a class="brand" href="/"><img src="/icon-512.png" alt="${esc(SITE.company)} logo" width="40" height="40">KINZHAL</a><nav><a href="/#games">Games</a><a href="/privacy/">Privacy</a><a href="/support/">Support</a></nav></header>
${body}
<footer><span>© ${new Date(SITE.updated).getFullYear()} ${esc(SITE.company)} · ${esc(SITE.country)}</span><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/support/">Support</a><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></footer>
</main></body></html>
`;

/* ---------- legal text (one source, used for the studio and every game) ---------- */
const privacy = (name, nameAr) => `
<div class="card"><h1>Privacy policy</h1><p class="muted">${esc(name)} · ${esc(SITE.company)} · Last updated ${esc(SITE.updated)}</p>
<p>This policy explains what ${esc(name)} (“the game”), published by ${esc(SITE.company)}, collects and why. The game has no accounts, and we do not ask for your name, email or phone number inside the game.</p>
<h3>What is collected</h3><ul>
<li><b>Advertising:</b> the game shows ads through Google AdMob and its mediation partners (AppLovin, Unity Ads, Liftoff, Mintegral, Pangle and Meta Audience Network). They may collect device and ad data, such as an advertising identifier, approximate location from IP address and ad interactions, to show, measure and limit ads. On iPhone, the advertising identifier is used only if you allow tracking in Apple's App Tracking Transparency prompt. Where required, a consent form (Google UMP) asks for your choice first.</li>
<li><b>Analytics and stability:</b> Google Firebase Analytics and Crashlytics receive anonymous usage events (for example levels reached and session length) and crash reports so we can improve the game.</li>
<li><b>Purchases:</b> in-app purchases are processed by Apple. We receive confirmation of the purchase, never your payment details.</li>
<li><b>Game progress</b> is stored on your device.</li></ul>
<h3>How we use it</h3><p>Only to run the game, show and measure ads, fix crashes and improve gameplay. We do not sell personal data.</p>
<h3>Your choices</h3><ul><li>Change tracking at any time in iPhone Settings → Privacy & Security → Tracking.</li><li>Change ad consent from the game's Privacy & Settings screen.</li><li>Buy “Remove ads” where offered to stop interstitial ads.</li><li>Ask us to delete any data we hold about you by email.</li></ul>
<h3>Children</h3><p>The game is not directed to children under 13, and we do not knowingly collect personal data from them. If you believe a child shared data with us, contact us and we will delete it.</p>
<h3>Third-party policies</h3><p><a href="https://policies.google.com/privacy">Google</a> · <a href="https://www.applovin.com/privacy/">AppLovin</a> · <a href="https://unity.com/legal/game-player-and-app-user-privacy-policy">Unity</a> · <a href="https://liftoff.io/privacy-policy/">Liftoff</a> · <a href="https://www.mintegral.com/en/privacy">Mintegral</a> · <a href="https://www.pangleglobal.com/privacy">Pangle</a> · <a href="https://www.facebook.com/privacy/policy/">Meta</a></p>
<h3>Contact</h3><p>${esc(SITE.company)}, ${esc(SITE.country)} · <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></p></div>
<div class="card ar" dir="rtl" lang="ar"><h2>سياسة الخصوصية</h2><p class="muted">${esc(nameAr || name)} · ${esc(SITE.companyAr)} · آخر تحديث ${esc(SITE.updated)}</p>
<p>توضح هذه السياسة ما تجمعه لعبة ${esc(nameAr || name)} التي تنشرها ${esc(SITE.companyAr)} ولماذا. لا تحتوي اللعبة على حسابات، ولا نطلب اسمك أو بريدك أو رقم جوالك داخل اللعبة.</p>
<h3>ما الذي يُجمع</h3><ul>
<li><b>الإعلانات:</b> تعرض اللعبة إعلانات عبر Google AdMob وشركاء الوساطة (AppLovin وUnity Ads وLiftoff وMintegral وPangle وMeta Audience Network). قد يجمعون بيانات الجهاز والإعلانات مثل معرّف الإعلانات والموقع التقريبي من عنوان IP والتفاعل مع الإعلانات لعرضها وقياسها. على الآيفون لا يُستخدم معرّف الإعلانات إلا إذا سمحت بالتتبع في نافذة Apple. وحيث يلزم، يطلب نموذج الموافقة (Google UMP) اختيارك أولاً.</li>
<li><b>التحليلات والاستقرار:</b> يتلقى Firebase Analytics وCrashlytics أحداث استخدام مجهولة (مثل المراحل ومدة الجلسة) وتقارير الأعطال لتحسين اللعبة.</li>
<li><b>المشتريات:</b> تعالجها Apple، ونتلقى تأكيد الشراء فقط دون بيانات الدفع.</li>
<li><b>تقدمك في اللعبة</b> محفوظ على جهازك.</li></ul>
<h3>كيف نستخدمها</h3><p>فقط لتشغيل اللعبة وعرض الإعلانات وقياسها وإصلاح الأعطال وتحسين اللعب. لا نبيع البيانات الشخصية.</p>
<h3>خياراتك</h3><ul><li>غيّر إذن التتبع في إعدادات الآيفون ← الخصوصية والأمان ← التتبع.</li><li>غيّر موافقة الإعلانات من شاشة الخصوصية والإعدادات في اللعبة.</li><li>اشترِ «إزالة الإعلانات» حيث يتوفر.</li><li>اطلب حذف أي بيانات لدينا عبر البريد.</li></ul>
<h3>الأطفال</h3><p>اللعبة غير موجهة للأطفال دون ١٣ عاماً، ولا نجمع عن قصد بيانات شخصية منهم.</p>
<h3>التواصل</h3><p>${esc(SITE.companyAr)}، ${esc(SITE.countryAr)} · <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></p></div>`;

const terms = (name, nameAr) => `
<div class="card"><h1>Terms of use</h1><p class="muted">${esc(name)} · ${esc(SITE.company)} · Last updated ${esc(SITE.updated)}</p>
<p>By downloading or playing ${esc(name)} you agree to these terms and to Apple's standard end-user licence (EULA).</p>
<h3>Licence</h3><p>We give you a personal, non-transferable licence to play the game on devices you own. The game, its art, music and code belong to ${esc(SITE.company)}.</p>
<h3>Purchases</h3><p>Purchases are handled by Apple under its terms. Virtual items have no cash value. Refund requests go to Apple at reportaproblem.apple.com.</p>
<h3>Fair play</h3><p>Do not cheat, reverse-engineer, or interfere with the game or its ads.</p>
<h3>Changes and availability</h3><p>We may update, change or stop the game or these terms. Continued play means you accept the update.</p>
<h3>Liability</h3><p>The game is provided “as is”. To the extent allowed by law, we are not liable for indirect losses. Nothing here limits rights you have under the laws of your country.</p>
<h3>Law</h3><p>These terms are governed by the laws of the Kingdom of Saudi Arabia.</p>
<h3>Contact</h3><p><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></p></div>
<div class="card ar" dir="rtl" lang="ar"><h2>شروط الاستخدام</h2><p class="muted">${esc(nameAr || name)} · ${esc(SITE.companyAr)}</p>
<p>بتنزيلك أو لعبك ${esc(nameAr || name)} فإنك توافق على هذه الشروط وعلى اتفاقية ترخيص المستخدم القياسية من Apple.</p>
<h3>الترخيص</h3><p>نمنحك ترخيصاً شخصياً غير قابل للنقل للعب على أجهزتك. اللعبة ورسومها وموسيقاها وشيفرتها مملوكة لـ${esc(SITE.companyAr)}.</p>
<h3>المشتريات</h3><p>تتولاها Apple وفق شروطها. العناصر الافتراضية ليس لها قيمة نقدية. طلبات الاسترداد عبر reportaproblem.apple.com.</p>
<h3>اللعب العادل</h3><p>يُمنع الغش أو الهندسة العكسية أو التلاعب باللعبة أو إعلاناتها.</p>
<h3>التغييرات</h3><p>قد نحدّث اللعبة أو هذه الشروط أو نوقفها. استمرارك في اللعب يعني قبول التحديث.</p>
<h3>القانون</h3><p>تخضع هذه الشروط لأنظمة المملكة العربية السعودية.</p></div>`;

const support = (name, nameAr) => `
<div class="card"><h1>Support</h1><p class="muted">${esc(name)}</p>
<p>Email <a href="mailto:${esc(SITE.email)}?subject=${encodeURIComponent(name + ' support')}">${esc(SITE.email)}</a> with your device model, iOS version and what happened. We reply within 2 working days (Sunday–Thursday, Riyadh time).</p>
<h3>Quick answers</h3><ul>
<li><b>Restore purchases:</b> open Settings in the game → Restore purchases, signed in with the same Apple ID.</li>
<li><b>Too many ads?</b> Interstitials only appear between levels. “Remove ads” turns them off.</li>
<li><b>Lost progress:</b> progress is saved on the device; deleting the app removes it.</li>
<li><b>Change ad or tracking choices:</b> the game's Privacy & Settings screen, or iPhone Settings → Privacy & Security → Tracking.</li>
<li><b>Refunds</b> are handled by Apple at <a href="https://reportaproblem.apple.com">reportaproblem.apple.com</a>.</li></ul></div>
<div class="card ar" dir="rtl" lang="ar"><h2>الدعم</h2><p class="muted">${esc(nameAr || name)}</p>
<p>راسلنا على <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a> مع نوع الجهاز وإصدار iOS ووصف المشكلة. نرد خلال يومي عمل (الأحد–الخميس بتوقيت الرياض).</p>
<h3>إجابات سريعة</h3><ul><li><b>استعادة المشتريات:</b> الإعدادات داخل اللعبة ← استعادة المشتريات بنفس حساب Apple.</li><li><b>إعلانات كثيرة؟</b> الإعلانات البينية تظهر بين المراحل فقط، و«إزالة الإعلانات» توقفها.</li><li><b>فقدان التقدم:</b> يُحفظ على الجهاز، وحذف التطبيق يحذفه.</li><li><b>الاسترداد</b> عبر Apple في reportaproblem.apple.com.</li></ul></div>`;

const statusPill = g => g.status === 'live' ? '<span class="pill live">On the App Store</span>' : '<span class="pill">Coming soon</span>';
const ico = g => `<div class="ico" style="background:radial-gradient(circle at 30% 20%,#fff8,${esc(g.color)} 60%);box-shadow:0 0 14px ${esc(g.color)}66">${esc(g.name.slice(0, 1))}</div>`;
const ordered = [...GAMES].sort((a, b) => (a.status === 'live' ? 0 : 1) - (b.status === 'live' ? 0 : 1));

// Start clean, then copy the images and icons from static/.
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync('static')) fs.copyFileSync(path.join('static', f), path.join(OUT, f));
write('index.html', page({ title: `${SITE.company} · Games`, desc: `Mobile and PC games by ${SITE.company}, made in Saudi Arabia.`, rel: '', body: `
<section style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:24px;align-items:center;margin:16px 0 28px" class="hero">
<div><h1>Games made in Saudi Arabia</h1><p>${esc(SITE.company)} builds arcade, puzzle and adventure games in Arabic and English for iPhone and PC.</p><a class="btn" href="#games">Our games</a><a class="btn" href="/support/" style="border-color:var(--cyan);box-shadow:0 0 14px #27e2ff55">Support</a></div>
<img src="/og-image.jpg" alt="${esc(SITE.company)} neon eagle logo" style="width:100%;border-radius:20px;border:1px solid var(--line)"></section>
<style>@media(max-width:700px){.hero{grid-template-columns:minmax(0,1fr)!important}}</style>
<h2 id="games">Games</h2><div class="grid">${ordered.map(g => `<a class="game" href="/${g.slug}/">${ico(g)}<b>${esc(g.name)}</b><div class="muted">${esc(g.genre)}</div>${statusPill(g)}</a>`).join('')}</div>
<div class="card ar" dir="rtl" lang="ar" style="margin-top:24px"><h2 style="margin-top:0">ألعاب صُنعت في السعودية</h2><p>تطوّر ${esc(SITE.companyAr)} ألعاب أركيد وألغاز ومغامرات بالعربية والإنجليزية للآيفون والحاسب.</p></div>` }));

for (const [k, fn, t, d] of [['privacy', privacy, 'Privacy policy', 'How Kinzhal games handle data.'], ['terms', terms, 'Terms of use', 'Terms for Kinzhal games.'], ['support', support, 'Support', 'Help for Kinzhal games.']]) {
  write(`${k}/index.html`, page({ title: `${t} · ${SITE.company}`, desc: d, rel: `${k}/`, body: fn('Kinzhal games', 'ألعاب كينجال') }));
  for (const g of GAMES) write(`${g.slug}/${k}/index.html`, page({ title: `${t} · ${g.name}`, desc: `${t} for ${g.name}.`, rel: `${g.slug}/${k}/`, body: fn(g.name, g.nameAr) }));
}
for (const g of GAMES) {
  const store = g.appStoreId ? `<a class="btn" href="https://apps.apple.com/app/id${esc(g.appStoreId)}">Download on the App Store</a>` : '';
  const steam = g.steamAppId ? `<a class="btn" href="https://store.steampowered.com/app/${esc(g.steamAppId)}/" style="border-color:#66c0f4;box-shadow:0 0 14px #66c0f455">Wishlist on Steam</a>` : '';
  write(`${g.slug}/index.html`, page({ title: `${g.name} · ${SITE.company}`, desc: `${g.name} — ${g.genre}. A game by ${SITE.company}.`, rel: `${g.slug}/`, body: `
<div class="card">${ico(g)}<h1>${esc(g.name)}</h1><p class="muted">${esc(g.genre)}</p>${statusPill(g)}<div style="margin-top:14px">${store}${steam}</div>
<p style="margin-top:14px"><a href="/${g.slug}/privacy/">Privacy policy</a> · <a href="/${g.slug}/terms/">Terms</a> · <a href="/${g.slug}/support/">Support</a></p></div>
<div class="card ar" dir="rtl" lang="ar"><h2 style="margin-top:0">${esc(g.nameAr || g.name)}</h2><p class="muted">${esc(g.genreAr || g.genre)}</p><p><a href="/${g.slug}/privacy/">سياسة الخصوصية</a> · <a href="/${g.slug}/terms/">الشروط</a> · <a href="/${g.slug}/support/">الدعم</a></p></div>` }));
}
write('404.html', page({ title: 'Page not found', desc: 'Page not found', rel: '', noindex: true, body: '<div class="card"><h1>Page not found</h1><p><a href="/">Back to all games</a></p></div>' }));
write('app-ads.txt', SITE.adsTxt.join('\n') + '\n');
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${D}/sitemap.xml\n`);
const urls = ['', 'privacy/', 'terms/', 'support/', ...GAMES.flatMap(g => [`${g.slug}/`, `${g.slug}/privacy/`, `${g.slug}/terms/`, `${g.slug}/support/`])];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${D}/${u}</loc></url>`).join('\n')}\n</urlset>\n`);
// One list of every game's store URLs, to paste into App Store Connect and each game project.
write('urls.txt', GAMES.map(g => `${g.name}\n  Marketing URL:      ${D}/${g.slug}/\n  Support URL:        ${D}/${g.slug}/support/\n  Privacy Policy URL: ${D}/${g.slug}/privacy/\n  Terms (EULA) URL:   ${D}/${g.slug}/terms/`).join('\n\n') + '\n');

// A ready coding-agent prompt for every game project (outside public/, not published).
const prompt = g => `Move this game's public links to the studio domain kinzhal.space. Game slug: ${g.slug}

1. Create (or update) ONE config for links and use it everywhere:
   MARKETING_URL = ${D}/${g.slug}/
   SUPPORT_URL   = ${D}/${g.slug}/support/
   PRIVACY_URL   = ${D}/${g.slug}/privacy/
   TERMS_URL     = ${D}/${g.slug}/terms/
   DEVELOPER_WEBSITE = ${D}/
2. Replace every old link (*.replit.app, *.repl.co, *.netlify.app, github.io or any other domain used for privacy, terms, support or website) in: the in-app Privacy & Settings screen, the game bridge / WebView links, app.json or app.config, the store listing files (English and Arabic), APP_STORE_SUBMISSION.md and README. Do not change the bundle ID, ad unit IDs, AdMob app ID, consent/ATT flow or game code.
3. The website/ folder stays as source, but add website/README.md saying the live pages are served from ${D}/${g.slug}/ and that the shared app-ads.txt lives at ${D}/app-ads.txt. Do not publish a separate app-ads.txt for this game.
4. Update the npm run check:store script so it fails unless: all four URLs above answer HTTP 200, and ${D}/app-ads.txt contains this game's AdMob publisher ID (the pub-… part of the AdMob app ID in app config).
5. Bump the build number (not the version name) only if a link inside the app changed.
6. Run npm run check:store and show me the result and the four URLs.`;
fs.writeFileSync('GAME_PROMPTS.md', '# Game prompts — one per game\n\nOpen each game project (Replit, Claude or any coding agent) and paste its block.\n\n' + GAMES.map(g => `## ${g.name}\n\n\`\`\`\n${prompt(g)}\n\`\`\`\n`).join('\n'));

const real = SITE.adsTxt.filter(l => l.trim() && !l.trim().startsWith('#'));
console.log(`Built ${GAMES.length} games, ${urls.length} pages into ${OUT}/`);
if (!real.length) console.warn('⚠  app-ads.txt has no real lines yet: paste your AdMob and mediation lines into site.json → adsTxt, then run the build again.');
