// Aeloria: Age of Crowns — Google AdMob placements and pacing.
// The web build shows no ads. In the iOS app, the native wrapper injects a WKScriptMessageHandler named
// "aeloriaAds" (or sets window.AeloriaAdsNative = { call(msg) => Promise<boolean> }) and answers each message
// with window.AELORIA_ADS_CB(id, ok). Protocol and Swift notes: store/aeloria-ios/ads/ADMOB_INTEGRATION.md.
'use strict';

const ADMOB = {
  appId: 'ca-app-pub-5681105275743934~9324813833',
  units: {
    appOpen: 'ca-app-pub-5681105275743934/5339281458',
    banner: 'ca-app-pub-5681105275743934/8011732161',
    interstitial: 'ca-app-pub-5681105275743934/7165554358',
    native: 'ca-app-pub-5681105275743934/3337989981',
    rewarded: 'ca-app-pub-5681105275743934/9278526460',
    rewardedInterstitial: 'ca-app-pub-5681105275743934/2904689809'
  },
  // Pacing: players are never interrupted in their first minutes, in battle, or after any purchase.
  pace: { minCitadel: 4, graceMs: 120e3, gapMs: 180e3, battlesPerInterstitial: 3, appOpenAfterMs: 240e3, rewardedPerDay: 15 }
};

const ADS = (() => {
  const handler = () => window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.aeloriaAds;
  const custom = () => window.AeloriaAdsNative;
  const available = () => !!(custom() || handler());
  let seq = 0; const wait = {};
  window.AELORIA_ADS_CB = (id, ok) => { const f = wait[id]; if (f) { delete wait[id]; f(!!ok); } };

  function call(cmd, format, extra = {}) {
    const msg = { cmd, format, unit: ADMOB.units[format], ...extra };
    if (custom()) return Promise.resolve().then(() => custom().call(msg)).then(Boolean).catch(() => false);
    const h = handler(); if (!h) return Promise.resolve(false);
    const id = ++seq;
    return new Promise(res => { wait[id] = res; try { h.postMessage({ id, ...msg }); } catch (e) { delete wait[id]; return res(false); }
      setTimeout(() => { if (wait[id]) { delete wait[id]; res(false); } }, cmd === 'show' ? 120e3 : 10e3); });
  }

  // Anyone who has bought anything never sees interruptive or display ads again. Rewarded ads stay optional.
  const adFree = () => { const s = typeof S !== 'undefined' && S && S.shop; return !!(s && (s.noAds || s.royalPass || s.card || s.founder || Object.keys(s.first || {}).length)); };
  const T = { start: Date.now(), lastFull: 0, battles: 0, hiddenAt: 0 };
  const P = ADMOB.pace;
  const fullOK = () => available() && !adFree() && S.b && S.b.citadel >= P.minCitadel && Date.now() - T.start > P.graceMs && Date.now() - T.lastFull > P.gapMs && !(typeof fight !== 'undefined' && fight && !fight.over);

  // Game audio pauses while a full-screen ad plays.
  async function fullscreen(format, extra) {
    FX.music(false); FX.setSfx(false);
    try { return await call('show', format, extra); }
    finally { FX.setSfx(S.settings.sfx); FX.music(S.settings.music); T.lastFull = Date.now(); placeSlots(true); }
  }

  // Rewarded (opt-in). Victory and welcome-back doubles use the rewarded-interstitial unit; everything else uses rewarded.
  const RI = new Set(['victory', 'welcome']);
  function rewarded(placement) { return fullscreen(RI.has(placement) ? 'rewardedInterstitial' : 'rewarded', { placement }); }

  // Interstitial: every few campaign battles, as the player leaves the result screen.
  function afterBattle() { T.battles++; if (T.battles % P.battlesPerInterstitial || !fullOK()) return; fullscreen('interstitial', { placement: 'battle_end' }); }

  // App open: when returning to the game after a few minutes away.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { T.hiddenAt = Date.now(); return; }
    if (T.hiddenAt && Date.now() - T.hiddenAt > P.appOpenAfterMs && fullOK() && !document.querySelector('#intro:not([hidden])')) fullscreen('appOpen', { placement: 'resume' });
  });

  // Banner and native slots: the page reserves the space, the native layer draws the ad on top of it.
  function slot(format) {
    if (!available() || adFree()) return '';
    return format === 'native' ? '<div class="adslot native" data-fmt="native"><small>Advertisement</small></div>' : '<div class="adslot banner" data-fmt="banner"></div>';
  }
  const last = {};
  function placeSlots(force) {
    if (!available()) return;
    for (const fmt of ['banner', 'native']) {
      let rect = null;
      for (const el of document.querySelectorAll(`.adslot[data-fmt="${fmt}"]`)) {
        const r = el.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight || !el.offsetParent && !el.closest('dialog[open]')) continue;
        const top = Math.max(r.top, 0), bottom = Math.min(r.bottom, innerHeight); if (bottom - top < r.height * .6) continue;
        rect = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; break;
      }
      const k = JSON.stringify(rect); if (!force && last[fmt] === k) continue; last[fmt] = k;
      call('place', fmt, { rect });
    }
  }
  let raf = 0; const soon = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; placeSlots(); }); };
  if (available()) {
    document.addEventListener('scroll', soon, { capture: true, passive: true }); addEventListener('resize', soon);
    setInterval(placeSlots, 600);
    // The existing rewarded hook in live.js reads this.
    window.AELORIA_ADS = { show: rewarded };
    window.addEventListener('load', () => call('init', 'appOpen', { appId: ADMOB.appId, units: ADMOB.units }));
  }

  // Google UMP privacy options (GDPR / US states). The native side shows the form when it is required.
  const privacy = () => call('privacy', 'banner');

  return { available, adFree, afterBattle, slot, privacy, units: ADMOB.units, appId: ADMOB.appId, dailyCap: P.rewardedPerDay };
})();
