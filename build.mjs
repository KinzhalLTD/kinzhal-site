// Builds the static site for kinzhal.space from games.json and site.json.
//   node build.mjs        → writes everything into public/
// Add a game: add one entry to games.json (slug, name, nameAr, genre, genreAr, status, color, appStoreId), run the build.
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS } from './assets.mjs';

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
.ico{width:46px;height:46px;border-radius:12px;display:block;object-fit:cover;margin-bottom:10px;background:#120e1f}
.muted{color:var(--ink2);font-size:14px}.pill{display:inline-block;font-size:11.5px;padding:2px 9px;border-radius:999px;border:1px solid var(--line);color:var(--ink2);margin-top:6px}
.pill.live{border-color:#3dffa955;color:var(--good)}
.btn{display:inline-block;padding:10px 18px;border-radius:999px;border:1px solid var(--pink);color:var(--ink);text-decoration:none;font-weight:700;box-shadow:0 0 14px #ff2bd655;margin:4px 6px 4px 0}
.ar{direction:rtl;text-align:right}
footer{margin-top:36px;padding-top:16px;border-top:1px solid var(--line);color:var(--ink2);font-size:14px;display:flex;gap:16px;flex-wrap:wrap}
footer a{color:var(--cyan)}`;

const page = ({ title, desc, rel, body, noindex, icon }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${D}/${rel}">
${icon ? `<link rel="icon" href="${icon.href}"${icon.svg ? ' type="image/svg+xml"' : ''}>\n<link rel="apple-touch-icon" href="${icon.png || '/apple-touch-icon.png'}">` : '<link rel="icon" href="/favicon.ico">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">'}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${icon && icon.png ? D + icon.png : D + '/og-image.jpg'}">
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

// "On the App Store" / "On Steam" only when the game really has a store ID; everything else is "Coming soon".
const statusPill = g => g.appStoreId ? '<span class="pill live">On the App Store</span>' : g.steamAppId ? '<span class="pill live">On Steam</span>' : g.status === 'live' ? '<span class="pill" style="border-color:#ff2bd655;color:#ff9be9">Coming soon to iPhone</span>' : '<span class="pill">Coming soon</span>';
const ico = g => `<img class="ico" src="${ICON[g.slug].href}" alt="${esc(g.name)} icon" width="46" height="46" loading="lazy" style="box-shadow:0 0 14px ${esc(g.color)}66">`;
const ordered = [...GAMES].sort((a, b) => (a.status === 'live' ? 0 : 1) - (b.status === 'live' ? 0 : 1));

// Start clean, then copy the images and icons from static/.
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const [f, b64] of Object.entries(ASSETS)) fs.writeFileSync(path.join(OUT, f), Buffer.from(b64, 'base64'));
// Optional: a static/ folder can override or add images.
if (fs.existsSync('static')) for (const f of fs.readdirSync('static')) fs.copyFileSync(path.join('static', f), path.join(OUT, f));

/* ---------- game icons ----------
   1. icons/<slug>.png (or .jpg / .webp) in this repo, if you add one
   2. otherwise the real App Store icon, downloaded at build time when games.json has appStoreId
   3. otherwise a neon icon drawn from the game's genre */
const GLYPH = [
  [/brick/i, '<g fill="#07060c"><rect x="14" y="18" width="16" height="9" rx="2"/><rect x="34" y="18" width="16" height="9" rx="2"/><rect x="24" y="31" width="16" height="9" rx="2"/></g><circle cx="32" cy="50" r="5" fill="#07060c"/>'],
  [/bounce|ball|volley/i, '<circle cx="32" cy="30" r="13" fill="#07060c"/><ellipse cx="32" cy="52" rx="14" ry="3" fill="#07060c" opacity=".5"/>'],
  [/chess/i, '<path fill="#07060c" d="M24 50h18l-2-6h-2l1-10c4-3 5-8 2-13-3-4-9-5-13-3l-3 5 4 1-5 6 3 2 6-3-1 12h-4z"/>'],
  [/factory|educational|puzzle · levels|levels/i, '<g fill="#07060c"><circle cx="32" cy="32" r="8"/><path d="M29 12h6l1 6 5 2 5-4 4 4-4 5 2 5 6 1v6l-6 1-2 5 4 5-4 4-5-4-5 2-1 6h-6l-1-6-5-2-5 4-4-4 4-5-2-5-6-1v-6l6-1 2-5-4-5 4-4 5 4 5-2z" fill-opacity=".9"/></g><circle cx="32" cy="32" r="5" fill="#fff" opacity=".7"/>'],
  [/word|crossword/i, '<g fill="#07060c"><rect x="14" y="14" width="10" height="10" rx="2"/><rect x="27" y="14" width="10" height="10" rx="2"/><rect x="40" y="14" width="10" height="10" rx="2"/><rect x="27" y="27" width="10" height="10" rx="2"/><rect x="27" y="40" width="10" height="10" rx="2"/></g>'],
  [/race|racing/i, '<path fill="#07060c" d="M18 14v38h4V36h22l-4-7 4-7H22v-8z"/>'],
  [/cook|burger/i, '<g fill="#07060c"><path d="M14 30c0-9 8-14 18-14s18 5 18 14z"/><rect x="13" y="33" width="38" height="5" rx="2"/><path d="M14 41h36c0 6-4 9-10 9H24c-6 0-10-3-10-9z"/></g>'],
  [/desert|dune|sand|roguelite|mirage/i, '<g fill="#07060c"><circle cx="42" cy="20" r="6"/><path d="M8 50c8-10 16-12 24-6s14 4 24-4v14H8z"/></g>'],
  [/runner|run|vault/i, '<path fill="#07060c" d="M14 34h24l-8-10h8l12 14-12 14h-8l8-10H14z"/>'],
  [/space|orbit|nova|stellar|star|drift|drop|glide|launch|cyber|aether/i, '<g fill="#07060c"><path d="M32 10c8 6 11 16 9 26l-9 6-9-6c-2-10 1-20 9-26z"/><path d="M23 36l-6 10 9-3zM41 36l6 10-9-3z"/><path d="M28 46h8l-4 8z"/></g><circle cx="32" cy="25" r="4" fill="#fff" opacity=".75"/>'],
  [/aim|shot|long/i, '<g fill="none" stroke="#07060c" stroke-width="4"><circle cx="32" cy="32" r="16"/><circle cx="32" cy="32" r="7"/></g><circle cx="32" cy="32" r="3" fill="#07060c"/>']
];
const genIcon = g => {
  const hit = GLYPH.find(([re]) => re.test(g.genre + ' ' + g.name));
  const inner = hit ? hit[1] : `<text x="32" y="43" font-family="system-ui,sans-serif" font-size="30" font-weight="800" text-anchor="middle" fill="#07060c">${esc(g.name.slice(0, 1))}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="30%" cy="20%" r="90%"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset=".55" stop-color="${esc(g.color)}"/><stop offset="1" stop-color="${esc(g.color)}"/></radialGradient></defs><rect width="64" height="64" rx="15" fill="url(#g)"/>${inner}</svg>`;
};
const ICON = {};
for (const g of GAMES) {
  const own = ['png', 'jpg', 'jpeg', 'webp'].map(x => `icons/${g.slug}.${x}`).find(f => fs.existsSync(f));
  if (own) { const ext = path.extname(own); const dest = `${g.slug}/icon${ext}`; fs.mkdirSync(path.join(OUT, g.slug), { recursive: true }); fs.copyFileSync(own, path.join(OUT, dest)); ICON[g.slug] = { href: '/' + dest, png: '/' + dest, src: 'file' }; continue; }
  if (g.appStoreId) {
    try {
      const j = await (await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(g.appStoreId)}&country=sa`)).json();
      const art = j.results?.[0]?.artworkUrl512 || j.results?.[0]?.artworkUrl100;
      if (art) { const buf = Buffer.from(await (await fetch(art)).arrayBuffer()); const dest = `${g.slug}/icon.png`; fs.mkdirSync(path.join(OUT, g.slug), { recursive: true }); fs.writeFileSync(path.join(OUT, dest), buf); ICON[g.slug] = { href: '/' + dest, png: '/' + dest, src: 'appstore' }; continue; }
    } catch (e) { console.warn(`App Store icon for ${g.slug} failed: ${e.message}`); }
  }
  const dest = `${g.slug}/icon.svg`; fs.mkdirSync(path.join(OUT, g.slug), { recursive: true }); fs.writeFileSync(path.join(OUT, dest), genIcon(g)); ICON[g.slug] = { href: '/' + dest, svg: true, src: 'drawn' };
}
console.log('Icons:', Object.entries(ICON).reduce((a, [, v]) => (a[v.src] = (a[v.src] || 0) + 1, a), {}));
write('index.html', page({ title: `${SITE.company} · Games`, desc: `Mobile and PC games by ${SITE.company}, made in Saudi Arabia.`, rel: '', body: `
<section style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:24px;align-items:center;margin:16px 0 28px" class="hero">
<div><h1>Games made in Saudi Arabia</h1><p>${esc(SITE.company)} builds arcade, puzzle and adventure games in Arabic and English for iPhone and PC.</p><a class="btn" href="#games">Our games</a><a class="btn" href="/support/" style="border-color:var(--cyan);box-shadow:0 0 14px #27e2ff55">Support</a></div>
<img src="/og-image.jpg" alt="${esc(SITE.company)} neon eagle logo" style="width:100%;border-radius:20px;border:1px solid var(--line)"></section>
<style>@media(max-width:700px){.hero{grid-template-columns:minmax(0,1fr)!important}}</style>
<h2 id="games">Games</h2><div class="grid">${ordered.map(g => `<a class="game" href="/${g.slug}/">${ico(g)}<b>${esc(g.name)}</b><div class="muted">${esc(g.genre)}</div>${statusPill(g)}</a>`).join('')}</div>
<div class="card ar" dir="rtl" lang="ar" style="margin-top:24px"><h2 style="margin-top:0">ألعاب صُنعت في السعودية</h2><p>تطوّر ${esc(SITE.companyAr)} ألعاب أركيد وألغاز ومغامرات بالعربية والإنجليزية للآيفون والحاسب.</p></div>` }));

for (const [k, fn, t, d] of [['privacy', privacy, 'Privacy policy', 'How Kinzhal games handle data.'], ['terms', terms, 'Terms of use', 'Terms for Kinzhal games.'], ['support', support, 'Support', 'Help for Kinzhal games.']]) {
  write(`${k}/index.html`, page({ title: `${t} · ${SITE.company}`, desc: d, rel: `${k}/`, body: fn('Kinzhal games', 'ألعاب كينجال') }));
  for (const g of GAMES) write(`${g.slug}/${k}/index.html`, page({ title: `${t} · ${g.name}`, desc: `${t} for ${g.name}.`, rel: `${g.slug}/${k}/`, icon: ICON[g.slug], body: fn(g.name, g.nameAr) }));
}
for (const g of GAMES) {
  const store = g.appStoreId ? `<a class="btn" href="https://apps.apple.com/app/id${esc(g.appStoreId)}">Download on the App Store</a>` : '';
  const steam = g.steamAppId ? `<a class="btn" href="https://store.steampowered.com/app/${esc(g.steamAppId)}/" style="border-color:#66c0f4;box-shadow:0 0 14px #66c0f455">Wishlist on Steam</a>` : '';
  write(`${g.slug}/index.html`, page({ title: `${g.name} · ${SITE.company}`, desc: `${g.name} — ${g.genre}. A game by ${SITE.company}.`, rel: `${g.slug}/`, icon: ICON[g.slug], body: `
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
