# Google AdMob: Aeloria iOS integration

## IDs

| What | ID |
|---|---|
| **AdMob App ID** (Info.plist `GADApplicationIdentifier`) | `ca-app-pub-5681105275743934~9324813833` |
| App open | `ca-app-pub-5681105275743934/5339281458` |
| Banner | `ca-app-pub-5681105275743934/8011732161` |
| Interstitial | `ca-app-pub-5681105275743934/7165554358` |
| Native advanced | `ca-app-pub-5681105275743934/3337989981` |
| Rewarded | `ca-app-pub-5681105275743934/9278526460` |
| Rewarded interstitial | `ca-app-pub-5681105275743934/2904689809` |

The ad unit IDs live in one place, `play/aeloria/ads.js` (`ADMOB.units`). The game sends the right unit ID with every message, so the native code never hard-codes them.

`https://kinzhal.space/app-ads.txt` now serves:

```
google.com, pub-5681105275743934, DIRECT, f08c47fec0942fa0
```

In AdMob → Apps → Aeloria, link the app to its App Store listing once it is live, so AdMob can verify app-ads.txt.

## Where each format appears in the game

| Format | Placement | Rules |
|---|---|---|
| **Rewarded** (opt-in) | −15 min on a timer, +12 Vigor, +1 Arena ticket, 15 gems in the Store | Player taps "▶ Watch an ad". Up to 15 a day. |
| **Rewarded interstitial** (opt-in) | "Double gold" on the victory screen; "Double this harvest" on the welcome-back chest | Player taps the button first, so there is no surprise ad. |
| **Interstitial** | Every 3rd campaign battle, when the player leaves the result screen | Never in the first 2 minutes of a session, never below Citadel 4, at least 3 minutes after any full-screen ad, never during a battle. |
| **App open** | Returning to the app after 4+ minutes in the background | Same pacing rules; never over the title or intro. |
| **Banner** (320×50) | Quests tab, between the event card and achievements | Shown only while the slot is on screen. |
| **Native advanced** | Top of the Reports sheet; Store "Featured" tab | Labelled "Advertisement". Shown only while the slot is on screen. |

**Paying players are ad-free.** After any purchase (gems, a pack, Monthly Card, Royal track or **Remove Ads** at SAR 9.99), interstitial, app-open, banner and native ads stop. Rewarded videos stay available because they are optional.

The web version on kinzhal.space shows no ads; every ad button and slot is hidden there.

## JavaScript ↔ Swift protocol

The game posts messages to a `WKScriptMessageHandler` named **`aeloriaAds`**:

```js
{ id: 7, cmd: 'init'|'show'|'place'|'privacy', format: 'appOpen'|'banner'|'interstitial'|'native'|'rewarded'|'rewardedInterstitial',
  unit: 'ca-app-pub-…', placement?: 'victory'|'speed'|…, rect?: {x,y,w,h} | null, appId?, units? }
```

Native replies once per message with:

```swift
webView.evaluateJavaScript("AELORIA_ADS_CB(\(id), \(ok ? "true" : "false"))")
```

| cmd | Native does | Reply `ok` |
|---|---|---|
| `init` | Nothing extra (startup already ran UMP → ATT → `MobileAds.shared.start`). Preload app open, interstitial, rewarded and rewarded interstitial. | true |
| `show` | Present the preloaded full-screen ad of `format`, then preload the next one. | **Rewarded / rewarded interstitial:** true only if the reward was earned. **Others:** true if shown. |
| `place` | `rect` = CSS pixels from the top-left of the web view. Move the banner or native view there and show it. `rect: null` means hide it. | true |
| `privacy` | `ConsentForm.presentPrivacyOptionsForm(from:)` | true |

The game times out a `show` after 120 s and other commands after 10 s, so always reply.

The web view must fill the screen with `scrollView.contentInsetAdjustmentBehavior = .never`, so that CSS pixels equal points. Add `webView.frame.origin` when converting `rect`.

## Startup order (required by Google and Apple)

1. **UMP consent:**
   - `ConsentInformation.shared.requestConsentInfoUpdate(with: RequestParameters())`
   - then `ConsentForm.loadAndPresentIfRequired(from:)`.
2. **App Tracking Transparency:** `ATTrackingManager.requestTrackingAuthorization`. Do it after consent and after the app is active.
3. If `ConsentInformation.shared.canRequestAds`, call `MobileAds.shared.start()`, then preload.
4. Load the game URL (`index.html` bundled in the app).

## Swift starting point (Google Mobile Ads SDK 12 names, SPM `GoogleMobileAds` + `UserMessagingPlatform`)

Check it in Xcode against the SDK version you install. SDK 11 uses the `GAD…` prefixed names.

```swift
import WebKit, GoogleMobileAds, UserMessagingPlatform, AppTrackingTransparency

final class AdsBridge: NSObject, WKScriptMessageHandler, FullScreenContentDelegate {
  weak var webView: WKWebView?; weak var vc: UIViewController?
  private var full: [String: FullScreenPresentingAd] = [:]          // format → ready ad
  private var pending: (id: Int, format: String, earned: Bool)?
  private var banner: BannerView?, nativeView: NativeAdView?, adLoader: AdLoader?
  private var units: [String: String] = [:]

  func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
    guard let d = m.body as? [String: Any], let id = d["id"] as? Int, let cmd = d["cmd"] as? String,
          let format = d["format"] as? String, let unit = d["unit"] as? String else { return }
    units[format] = unit
    switch cmd {
    case "init":
      if let u = d["units"] as? [String: String] { units = u }
      ["appOpen", "interstitial", "rewarded", "rewardedInterstitial"].forEach(preload); reply(id, true)
    case "show": show(id: id, format: format)
    case "place": place(format: format, unit: unit, rect: d["rect"] as? [String: Double]); reply(id, true)
    case "privacy": if let vc { ConsentForm.presentPrivacyOptionsForm(from: vc) { _ in self.reply(id, true) } } else { reply(id, false) }
    default: reply(id, false)
    }
  }

  private func preload(_ f: String) {
    guard let u = units[f], ConsentInformation.shared.canRequestAds else { return }
    Task { @MainActor in
      let ad: FullScreenPresentingAd? = switch f {
        case "appOpen": try? await AppOpenAd.load(with: u, request: Request())
        case "interstitial": try? await InterstitialAd.load(with: u, request: Request())
        case "rewarded": try? await RewardedAd.load(with: u, request: Request())
        default: try? await RewardedInterstitialAd.load(with: u, request: Request())
      }
      ad?.fullScreenContentDelegate = self; full[f] = ad
    }
  }

  private func show(id: Int, format f: String) {
    guard let vc, let ad = full.removeValue(forKey: f) else { reply(id, false); preload(f); return }
    pending = (id, f, false)
    switch ad {
    case let a as RewardedAd: a.present(from: vc) { self.pending?.earned = true }
    case let a as RewardedInterstitialAd: a.present(from: vc) { self.pending?.earned = true }
    case let a as InterstitialAd: a.present(from: vc)
    case let a as AppOpenAd: a.present(from: vc)
    default: reply(id, false)
    }
  }
  func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) { finish() }
  func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError e: Error) { pending.map { pending = ($0.id, $0.format, false) }; finish() }
  private func finish() {
    guard let p = pending else { return }; pending = nil
    let rewardedFormat = p.format == "rewarded" || p.format == "rewardedInterstitial"
    reply(p.id, rewardedFormat ? p.earned : true); preload(p.format)
  }

  private func place(format: String, unit: String, rect: [String: Double]?) {
    guard let webView, let vc else { return }
    let frame = rect.map { CGRect(x: $0["x"]! + webView.frame.minX, y: $0["y"]! + webView.frame.minY, width: $0["w"]!, height: $0["h"]!) }
    if format == "banner" {
      if banner == nil, frame != nil, ConsentInformation.shared.canRequestAds {
        let b = BannerView(adSize: AdSizeBanner); b.adUnitID = unit; b.rootViewController = vc
        vc.view.addSubview(b); b.load(Request()); banner = b
      }
      banner?.isHidden = frame == nil; if let frame { banner?.frame = frame }
    } else {
      // Native advanced: render into a NativeAdView laid out to fit the slot (for example Google's
      // "small template" from googleads-mobile-ios-native-templates). Load with
      // AdLoader(adUnitID: unit, rootViewController: vc, adTypes: [.native], options: nil).
      nativeView?.isHidden = frame == nil; if let frame { nativeView?.frame = frame }
    }
  }

  private func reply(_ id: Int, _ ok: Bool) { DispatchQueue.main.async { self.webView?.evaluateJavaScript("AELORIA_ADS_CB(\(id), \(ok))") } }
}
// Register: config.userContentController.add(adsBridge, name: "aeloriaAds")
```

## Info.plist

```xml
<key>GADApplicationIdentifier</key><string>ca-app-pub-5681105275743934~9324813833</string>
<key>NSUserTrackingUsageDescription</key>
<string>Allow tracking to see ads that are more relevant to you. Aeloria stays free thanks to ads.</string>
<key>SKAdNetworkItems</key>
<array>
  <dict><key>SKAdNetworkIdentifier</key><string>cstr6suwn9.skadnetwork</string></dict>
  <!-- Paste the full current list from Google's "Enable SKAdNetwork" page, plus one entry per mediation network you enable. -->
</array>
<key>ITSAppUsesNonExemptEncryption</key><false/>
```

## In AdMob (one-time)

- **Privacy & messaging:**
  - Create a **GDPR** message (EEA/UK) and a **US state regulations** message for app Aeloria.
  - Create an **IDFA explainer** message, which is shown before the ATT prompt.
- **Blocking controls:** tick the sensitive categories you don't want in a 9+ game: Gambling, Dating, Alcohol, Politics, References to Sex, and Weight Loss.
- **App settings:** set the content rating to **"G" or "PG"** (max ad content rating), and mark the app as **not child-directed**. Aeloria is a general audience game, not a kids-category app.
- **Test:** use test devices (AdMob → Settings → Test devices) or Google's test unit IDs during development. Never tap your own live ads.
