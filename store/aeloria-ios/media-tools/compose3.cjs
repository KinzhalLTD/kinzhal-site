// Captioned App Store screenshots at exact pixel sizes, in the screenshot's language.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const ORDER = ['2-battle', '4-heroes', '3-city', '5-story', '6-world', '7-chapter', '1-title', '8-forge'];
const BG = ['chapter3', 'title_w', 'chapter1', 'chapter6', 'title', 'chapter4', 'title_w', 'chapter2'];
const CAP = {
  en: [['UNLEASH LEGENDARY HEROES', 'Time each skill for a perfect strike'], ['COLLECT 21 HEROES', 'Legends from Arabia, China, Spain and beyond'], ['BUILD A PAINTED CITADEL', 'Grow farms, mines and mighty halls'], ['AN EPIC SIX-CHAPTER STORY', 'Rally the realms against the Hollow King'], ['EXPLORE A VAST WORLD', 'Hunt treasure and Elite Warbands'], ['SIX BREATHTAKING REALMS', 'From frozen fjords to golden dunes'], ['SIX REALMS. ONE CROWN.', 'Raise your kingdom in Aeloria'], ['GROW WITHOUT LIMITS', 'Endless upgrades in the Royal Forge']],
  ar: [['أطلق العنان للأبطال الأسطوريين', 'وقّت كل مهارة لضربة مثالية'], ['اجمع ٢١ بطلاً', 'أساطير من العرب والصين وإسبانيا وغيرها'], ['ابنِ قلعة مرسومة بإتقان', 'طوّر المزارع والمناجم والقاعات العظيمة'], ['قصة ملحمية من ستة فصول', 'وحّد الممالك ضد الملك الأجوف'], ['استكشف عالماً شاسعاً', 'طارد الكنوز وفرق النخبة'], ['ست ممالك خلّابة', 'من المضائق المتجمدة إلى الكثبان الذهبية'], ['ست ممالك. تاج واحد.', 'ابنِ مملكتك في إيلوريا'], ['نموّ بلا حدود', 'ترقيات لا تنتهي في الحدادة الملكية']],
  zh: [['释放传奇英雄', '把握时机，打出完美一击'], ['集齐21位英雄', '来自阿拉伯、中国、西班牙等地的传奇'], ['建设精美主城', '发展农田、矿山与宏伟殿堂'], ['六章史诗剧情', '联合诸国，对抗空洞之王'], ['探索广阔世界', '寻找宝藏，猎杀精英战团'], ['六大壮丽王国', '从冰封峡湾到金色沙丘'], ['六大王国，一顶王冠', '在艾洛利亚建立你的王国'], ['无限成长', '皇家熔炉无尽强化']],
  de: [['ENTFESSLE LEGENDÄRE HELDEN', 'Setze jede Fähigkeit im perfekten Moment ein'], ['SAMMLE 21 HELDEN', 'Legenden aus Arabien, China, Spanien und mehr'], ['BAUE EINE PRACHTVOLLE ZITADELLE', 'Felder, Minen und mächtige Hallen'], ['EINE EPISCHE SAGA IN SECHS KAPITELN', 'Vereine die Reiche gegen den Hohlen König'], ['ERKUNDE EINE WEITE WELT', 'Jage Schätze und Elitekriegsscharen'], ['SECHS ATEMBERAUBENDE REICHE', 'Von eisigen Fjorden bis zu goldenen Dünen'], ['SECHS REICHE. EINE KRONE.', 'Errichte dein Königreich in Aeloria'], ['WACHSE OHNE GRENZEN', 'Endlose Upgrades in der Königlichen Schmiede']],
  ru: [['ВЫПУСТИ ЛЕГЕНДАРНЫХ ГЕРОЕВ', 'Применяй умения в идеальный момент'], ['СОБЕРИ 21 ГЕРОЯ', 'Легенды Аравии, Китая, Испании и не только'], ['ОТСТРОЙ ЦИТАДЕЛЬ', 'Поля, шахты и великие залы'], ['ЭПИЧЕСКИЙ СЮЖЕТ ИЗ ШЕСТИ ГЛАВ', 'Объедини королевства против Пустого Короля'], ['ИССЛЕДУЙ ОГРОМНЫЙ МИР', 'Охоться за сокровищами и элитными отрядами'], ['ШЕСТЬ ЗАХВАТЫВАЮЩИХ КОРОЛЕВСТВ', 'От ледяных фьордов до золотых дюн'], ['ШЕСТЬ КОРОЛЕВСТВ. ОДНА КОРОНА.', 'Построй своё королевство в Эолории'], ['РАСТИ БЕЗ ПРЕДЕЛОВ', 'Бесконечные улучшения в Королевской кузне']],
};
// args: W H DPR tag lang outDir
const [W, H, DPR, tag, lang, out] = [+process.argv[2], +process.argv[3], +process.argv[4], process.argv[5], process.argv[6], process.argv[7]];
(async () => {
  const b = await chromium.launch(); fs.mkdirSync(out, { recursive: true });
  const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR }); const p = await c.newPage();
  for (let i = 0; i < ORDER.length; i++) {
    const [t, s] = CAP[lang][i];
    const u = 'file://' + path.resolve('compose3.html') + '?' + new URLSearchParams({ img: path.resolve(`raw/${tag}-${ORDER[i]}.png`), bg: `/home/user/kinzhal-site/play/aeloria/art/key/${BG[i]}.webp`, t, s, lang });
    await p.goto(u); await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready); await p.evaluate(() => window.fit()); await p.waitForTimeout(300);
    const f = `${out}/${String(i + 1).padStart(2, '0')}-${ORDER[i].slice(2)}.png`; await p.screenshot({ path: f });
  }
  await b.close(); console.log('composed', tag, lang);
})();
