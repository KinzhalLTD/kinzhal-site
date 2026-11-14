// Aeloria: Age of Crowns — native shell. The whole game ships inside the app as one offline HTML file
// (src/gameHtml.js, built from www/). This file adds what only native code can do: AdMob with Google
// consent and Apple tracking permission, App Store purchases, and the Privacy & Settings screen.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';

import GAME_HTML from './src/gameHtml';
import { bridgeScript } from './src/bridge';
import { AdManager, adsModule as GMA, privacyOptionsRequired, showPrivacyOptions, startAds } from './src/ads';
import { Store, iapAvailable } from './src/iap';
import { STRINGS } from './src/strings';
import { APP_NAME, COMPANY, PRIVACY_URL, SHOW_NATIVE_SETTINGS_BUTTON, SUPPORT_EMAIL, SUPPORT_URL, TERMS_URL } from './src/appConfig';

const BASE_URL = 'https://aeloria.app.local/';   // origin for the game's saved progress; nothing is fetched from it
const VERSION = Constants.expoConfig?.version || '1.0.0';
const BG = '#140F22';

export default function App() {
  const web = useRef(null);
  const pageReady = useRef(false);
  const [fullscreenAd, setFullscreenAd] = useState(false);
  const [bannerRect, setBannerRect] = useState(null);
  const [nativeRect, setNativeRect] = useState(null);
  const [nativeAd, setNativeAd] = useState(null);
  const nativeLoading = useRef(false);
  const nativeAt = useRef(0);
  const adsStarted = useRef(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [privacyRequired, setPrivacyRequired] = useState(false);
  const [lang, setLang] = useState('en');
  const L = STRINGS[lang] || STRINGS.en;

  const js = useCallback(code => { if (web.current) web.current.injectJavaScript(`${code}; true;`); }, []);
  const reply = useCallback((id, value) => js(`window.__rnReply && window.__rnReply(${id}, ${JSON.stringify(value === undefined ? null : value)})`), [js]);

  const ads = useMemo(() => new AdManager({ reply, onFullscreen: setFullscreenAd }), [reply]);
  const store = useMemo(() => new Store({
    // Purchases approved later (Ask to Buy) are granted through the game's own hook.
    grant: id => new Promise(resolve => {
      if (!pageReady.current || !web.current) return resolve(false);
      js(`window.AELORIA_GRANT && window.AELORIA_GRANT(${JSON.stringify(id)})`); resolve(true);
    }),
  }), [js]);

  // Start-up: consent → tracking → ads; and connect to the App Store.
  useEffect(() => {
    let alive = true;
    (async () => {
      adsStarted.current = await startAds(ads);
      if (alive) setPrivacyRequired(await privacyOptionsRequired());
    })();
    store.init().then(() => pushPrices());
    return () => { alive = false; store.end(); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const pushPrices = () => {
    if (!pageReady.current || !Object.keys(store.prices).length) return;
    js(`window.AELORIA_PRICES = ${JSON.stringify(store.prices)}; window.dispatchEvent(new Event('aeloriaprices'))`);
  };

  // Native ad: load when the game shows a native slot; refresh at most once a minute.
  useEffect(() => {
    if (!nativeRect || !GMA || !GMA.NativeAd || !adsStarted.current || nativeLoading.current) return;
    if (nativeAd && Date.now() - nativeAt.current < 60000) return;
    nativeLoading.current = true;
    GMA.NativeAd.createForAdRequest(ads.unit('native'))
      .then(ad => { setNativeAd(old => { try { old && old.destroy(); } catch (e) { } return ad; }); nativeAt.current = Date.now(); })
      .catch(() => { nativeAt.current = Date.now(); })
      .finally(() => { nativeLoading.current = false; });
  }, [nativeRect]);   // eslint-disable-line react-hooks/exhaustive-deps

  const onMessage = useCallback(async event => {
    let m; try { m = JSON.parse(event.nativeEvent.data); } catch (e) { return; }
    const { kind, id, payload = {} } = m;
    if (kind === 'ads') {
      const { cmd, format } = payload;
      if (cmd === 'init') { ads.setUnits(payload.units); return reply(id, true); }
      if (cmd === 'show') {
        if (!GMA) {   // Expo Go preview: simulate the ad so the reward flow can be tried
          return Alert.alert(L.adPreview, L.adPreviewBody, [{ text: L.close, onPress: () => reply(id, true) }]);
        }
        return ads.show(id, format);
      }
      if (cmd === 'place') {
        const r = payload.rect || null;
        if (format === 'banner') setBannerRect(r); else if (format === 'native') setNativeRect(r);
        return reply(id, !!GMA);
      }
      if (cmd === 'privacy') return reply(id, await showPrivacyOptions());
      return reply(id, false);
    }
    if (kind === 'buy') return reply(id, await store.buy(payload.product));
    if (kind === 'restore') return reply(id, await store.restore());
    if (kind === 'settings') { setSettingsOpen(true); return reply(id, true); }
    if (kind === 'lang') { if (STRINGS[payload.code]) setLang(payload.code); return reply(id, true); }
  }, [ads, store, reply]);

  // Only the bundled game runs in the web view; any other link opens in Safari or Mail.
  const onShouldStart = useCallback(req => {
    const u = req.url || '';
    if (u.startsWith(BASE_URL) || u.startsWith('about:') || u.startsWith('data:') || u.startsWith('blob:')) return true;
    Linking.openURL(u).catch(() => { });
    return false;
  }, []);

  const onLoadEnd = useCallback(() => { pageReady.current = true; pushPrices(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const mailSupport = () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${APP_NAME} support (v${VERSION})`)}`).catch(() => { });
  const restore = async () => {
    const r = await store.restore();
    if (!r.ok) return Alert.alert(L.restore, L.noStore);
    // Same effect as the game's own "Restore purchases" button: set the owned flags, no repeat rewards.
    if (r.owned.length) js(`(function (o) { if (typeof S === 'undefined' || !S || !S.shop) return; if (o.indexOf('noads') >= 0) S.shop.noAds = true; if (o.indexOf('royal') >= 0) S.shop.royalPass = true; save(); render(); })(${JSON.stringify(r.owned)})`);
    Alert.alert(L.restore, r.owned.length ? L.restored : L.none);
  };

  const NativeCard = nativeRect && nativeAd && GMA && GMA.NativeAdView && !fullscreenAd ? (
    <GMA.NativeAdView nativeAd={nativeAd} style={[styles.native, { top: nativeRect.y, left: nativeRect.x, width: nativeRect.w, height: nativeRect.h }]}>
      <GMA.NativeMediaView style={styles.nativeMedia} resizeMode="cover" />
      <View style={styles.nativeBody}>
        <View style={styles.nativeTop}>
          <Text style={styles.badge}>Ad</Text>
          <GMA.NativeAsset assetType={GMA.NativeAssetType.HEADLINE}><Text numberOfLines={2} style={styles.nativeHeadline}>{nativeAd.headline}</Text></GMA.NativeAsset>
        </View>
        {nativeAd.body ? <GMA.NativeAsset assetType={GMA.NativeAssetType.BODY}><Text numberOfLines={2} style={styles.nativeText}>{nativeAd.body}</Text></GMA.NativeAsset> : null}
        {nativeAd.callToAction ? <GMA.NativeAsset assetType={GMA.NativeAssetType.CALL_TO_ACTION}><Text style={styles.cta}>{nativeAd.callToAction}</Text></GMA.NativeAsset> : null}
      </View>
    </GMA.NativeAdView>
  ) : null;

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <WebView
        ref={web}
        source={{ html: GAME_HTML, baseUrl: BASE_URL }}
        originWhitelist={['*']}
        injectedJavaScriptBeforeContentLoaded={bridgeScript({ payments: iapAvailable })}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStart}
        onLoadEnd={onLoadEnd}
        onContentProcessDidTerminate={() => web.current && web.current.reload()}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsBackForwardNavigationGestures={false}
        allowsLinkPreview={false}
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        dataDetectorTypes="none"
        setSupportMultipleWindows={false}
        textZoom={100}
        style={styles.web}
      />

      {bannerRect && GMA && !fullscreenAd ? (
        <View pointerEvents="box-none" style={[styles.banner, { top: bannerRect.y, left: bannerRect.x + (bannerRect.w - 320) / 2 }]}>
          <GMA.BannerAd unitId={ads.unit('banner')} size={GMA.BannerAdSize.BANNER} onAdFailedToLoad={() => { }} />
        </View>
      ) : null}
      {NativeCard}

      {SHOW_NATIVE_SETTINGS_BUTTON ? (
        <Pressable accessibilityLabel="Privacy and settings" onPress={() => setSettingsOpen(true)} style={styles.info}><Text style={styles.infoText}>ⓘ</Text></Pressable>
      ) : null}

      <Modal visible={settingsOpen} animationType="slide" transparent onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{L.title}</Text>
            <ScrollView>
              <Row label={L.privacy} onPress={() => Linking.openURL(PRIVACY_URL)} />
              <Row label={L.terms} onPress={() => Linking.openURL(TERMS_URL)} />
              {privacyRequired ? <Row label={L.adChoices} onPress={() => showPrivacyOptions()} /> : null}
              <Row label={L.tracking} onPress={() => Linking.openSettings()} />
              {iapAvailable ? <Row label={L.restore} onPress={restore} /> : null}
              <Row label={L.contact} onPress={mailSupport} />
              <Row label={L.site} onPress={() => Linking.openURL(SUPPORT_URL)} />
              <Text style={[styles.note, lang === 'ar' && styles.rtl]}>{L.note}</Text>
              <Text style={styles.small}>{L.version} {VERSION} · © {new Date().getFullYear()} {COMPANY}</Text>
            </ScrollView>
            <Pressable onPress={() => setSettingsOpen(false)} style={styles.close}><Text style={styles.closeText}>{L.close}</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <Text style={styles.rowText}>{label}</Text><Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

const GOLD = '#E8A33D', CREAM = '#FFF1C4';
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  web: { flex: 1, backgroundColor: BG },
  banner: { position: 'absolute', width: 320, height: 50 },
  native: { position: 'absolute', flexDirection: 'row', backgroundColor: '#1C142E', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(232,163,61,0.55)', padding: 10, overflow: 'hidden' },
  nativeMedia: { width: 120, height: 120, borderRadius: 8, marginRight: 10 },
  nativeBody: { flex: 1, justifyContent: 'space-between' },
  nativeTop: { flexDirection: 'row', alignItems: 'flex-start' },
  badge: { backgroundColor: GOLD, color: '#2A1704', fontSize: 10, fontWeight: '800', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, marginRight: 6, marginTop: 2, overflow: 'hidden' },
  nativeHeadline: { flex: 1, color: CREAM, fontSize: 15, fontWeight: '700' },
  nativeText: { color: '#D9D9D9', fontSize: 12 },
  cta: { alignSelf: 'flex-end', backgroundColor: GOLD, color: '#2A1704', fontWeight: '800', fontSize: 13, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, overflow: 'hidden' },
  info: { position: 'absolute', right: 10, bottom: 90, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  infoText: { color: CREAM, fontSize: 18 },
  sheetWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1A1230', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, paddingBottom: 34, maxHeight: '80%', borderTopWidth: 1, borderColor: GOLD },
  sheetTitle: { color: CREAM, fontSize: 20, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)' },
  rowText: { color: '#FFFFFF', fontSize: 16 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  chev: { color: GOLD, fontSize: 20 },
  note: { color: '#CFC6E6', fontSize: 13, marginTop: 14, lineHeight: 19 },
  small: { color: '#8F86A8', fontSize: 12, marginTop: 10, textAlign: 'center' },
  close: { marginTop: 14, backgroundColor: GOLD, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  closeText: { color: '#2A1704', fontWeight: '800', fontSize: 16 },
});
