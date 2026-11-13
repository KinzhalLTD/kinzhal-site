// Loads and shows AdMob ads for the game. The game decides when (www/ads.js); this file decides how.
import { AD_UNITS, USE_TEST_ADS } from './adConfig';

let GMA = null;
try { GMA = require('react-native-google-mobile-ads'); } catch (e) { GMA = null; }   // missing in Expo Go
export const adsModule = GMA;

const REWARDED = new Set(['rewarded', 'rewardedInterstitial']);
const TEST = () => GMA ? {
  appOpen: GMA.TestIds.APP_OPEN, banner: GMA.TestIds.BANNER, interstitial: GMA.TestIds.INTERSTITIAL,
  rewarded: GMA.TestIds.REWARDED, rewardedInterstitial: GMA.TestIds.REWARDED_INTERSTITIAL,
  native: GMA.TestIds.NATIVE || 'ca-app-pub-3940256099942544/3986624511',
} : {};

export class AdManager {
  constructor({ reply, onFullscreen }) {
    this.reply = reply; this.onFullscreen = onFullscreen;
    this.units = { ...AD_UNITS }; this.ready = false; this.ads = {}; this.fails = {}; this.pending = null;
  }

  unit(format) { return USE_TEST_ADS ? TEST()[format] : (this.units[format] || AD_UNITS[format]); }

  setUnits(units) { if (units) Object.assign(this.units, units); }

  // Called once consent allows ads and the SDK has started.
  start() { this.ready = true; ['appOpen', 'interstitial', 'rewarded', 'rewardedInterstitial'].forEach(f => this.load(f)); }

  load(format) {
    if (!GMA || !this.ready) return;
    const cur = this.ads[format]; if (cur && (cur.loading || cur.loaded)) return;
    const Kind = { appOpen: GMA.AppOpenAd, interstitial: GMA.InterstitialAd, rewarded: GMA.RewardedAd, rewardedInterstitial: GMA.RewardedInterstitialAd }[format];
    if (!Kind) return;
    let ad; try { ad = Kind.createForAdRequest(this.unit(format)); } catch (e) { return; }
    const st = { ad, loading: true, loaded: false, earned: false, at: 0, subs: [] }; this.ads[format] = st;
    const isRw = REWARDED.has(format), E = GMA.AdEventType, R = GMA.RewardedAdEventType;
    st.subs.push(ad.addAdEventListener(isRw ? R.LOADED : E.LOADED, () => { st.loading = false; st.loaded = true; st.at = Date.now(); this.fails[format] = 0; }));
    if (isRw) st.subs.push(ad.addAdEventListener(R.EARNED_REWARD, () => { st.earned = true; }));
    st.subs.push(ad.addAdEventListener(E.CLOSED, () => this.finish(format, true)));
    st.subs.push(ad.addAdEventListener(E.ERROR, () => {
      if (this.pending && this.pending.format === format) return this.finish(format, false);
      this.drop(format); this.retry(format);
    }));
    try { ad.load(); } catch (e) { this.drop(format); this.retry(format); }
  }

  drop(format) { const st = this.ads[format]; if (st) { st.subs.forEach(u => { try { u(); } catch (e) { } }); delete this.ads[format]; } }

  // No fill or offline: try again after 15 s, 30 s, 60 s … up to 5 minutes. Never crashes the game.
  retry(format) { const n = (this.fails[format] || 0) + 1; this.fails[format] = n; setTimeout(() => this.load(format), Math.min(300000, 15000 * 2 ** (n - 1))); }

  show(id, format) {
    const st = this.ads[format];
    if (format === 'appOpen' && st && st.loaded && Date.now() - st.at > 4 * 3600e3) { this.drop(format); }   // app open ads expire
    const ok = this.ads[format];
    if (!GMA || this.pending || !ok || !ok.loaded) { this.reply(id, false); this.load(format); return; }
    this.pending = { id, format }; this.onFullscreen(true);
    Promise.resolve().then(() => ok.ad.show()).catch(() => this.finish(format, false));
  }

  finish(format, shown) {
    const st = this.ads[format], p = this.pending;
    this.drop(format); this.pending = null; this.onFullscreen(false);
    if (p) this.reply(p.id, !!shown && (REWARDED.has(format) ? !!(st && st.earned) : true));
    this.load(format);
  }
}

// Consent → App Tracking Transparency → SDK start, in the order Google and Apple require.
export async function startAds(manager) {
  if (!GMA) return false;
  const mobileAds = GMA.default;
  try { await GMA.AdsConsent.gatherConsent(); } catch (e) { }
  try {
    const TT = require('expo-tracking-transparency');
    const { status } = await TT.getTrackingPermissionsAsync();
    if (status === 'undetermined') await TT.requestTrackingPermissionsAsync();
  } catch (e) { }
  let info = null; try { info = await GMA.AdsConsent.getConsentInfo(); } catch (e) { }
  if (info && info.canRequestAds === false) return false;
  try {
    await mobileAds().setRequestConfiguration({ maxAdContentRating: GMA.MaxAdContentRating.G, tagForChildDirectedTreatment: false, tagForUnderAgeOfConsent: false });
    await mobileAds().initialize();
  } catch (e) { return false; }
  manager.start();
  return true;
}

export async function privacyOptionsRequired() {
  if (!GMA) return false;
  try { const info = await GMA.AdsConsent.getConsentInfo(); return info.privacyOptionsRequirementStatus === GMA.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED; } catch (e) { return false; }
}

export async function showPrivacyOptions() {
  if (!GMA) return false;
  try { await GMA.AdsConsent.showPrivacyOptionsForm(); return true; } catch (e) { return false; }
}
