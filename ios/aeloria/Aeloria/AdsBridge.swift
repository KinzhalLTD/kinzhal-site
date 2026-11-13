import GoogleMobileAds
import UIKit
import UserMessagingPlatform
import WebKit

/// Native side of play/aeloria/ads.js. The game decides when and where ads appear;
/// this class loads, presents and positions them, and answers each message with AELORIA_ADS_CB(id, ok).
final class AdsBridge: NSObject, WKScriptMessageHandler, FullScreenContentDelegate, NativeAdLoaderDelegate {
    private weak var webView: WKWebView?
    private weak var host: UIViewController?

    private var units: [String: String] = [:]
    private var sdkStarted = false

    // Full-screen formats: appOpen, interstitial, rewarded, rewardedInterstitial
    private static let fullScreenFormats = ["appOpen", "interstitial", "rewarded", "rewardedInterstitial"]
    private var readyAds: [String: FullScreenPresentingAd] = [:]
    private var loadedAt: [String: Date] = [:]
    private var loading: Set<String> = []
    private var failures: [String: Int] = [:]
    private var pending: (id: Int, format: String, earned: Bool)?

    // In-page formats: banner and native, drawn over the slot the game reserves.
    private var banner: BannerView?
    private var nativeCard: NativeAdCard?
    private var nativeLoader: AdLoader?
    private var nativeLoadedAt: Date?
    private var slots: [String: CGRect] = [:]

    func attach(webView: WKWebView, host: UIViewController) {
        self.webView = webView
        self.host = host
    }

    /// Called once the Mobile Ads SDK has started (after consent).
    func sdkReady() {
        sdkStarted = true
        Self.fullScreenFormats.forEach(preload)
        for (format, rect) in slots { place(format, frame: rect) }
    }

    // MARK: Messages from the game

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let id = (body["id"] as? NSNumber)?.intValue,
              let cmd = body["cmd"] as? String,
              let format = body["format"] as? String else { return }
        if let unit = body["unit"] as? String { units[format] = unit }

        switch cmd {
        case "init":
            if let all = body["units"] as? [String: String] { units.merge(all) { _, new in new } }
            Self.fullScreenFormats.forEach(preload)
            reply(id, true)
        case "show":
            show(id: id, format: format)
        case "place":
            let rect = (body["rect"] as? [String: Any]).flatMap(Self.cgRect)
            if let rect { slots[format] = rect } else { slots.removeValue(forKey: format) }
            place(format, frame: rect)
            reply(id, true)
        case "privacy":
            guard let host else { return reply(id, false) }
            ConsentManager.shared.presentPrivacyOptions(from: host) { [weak self] ok in self?.reply(id, ok) }
        default:
            reply(id, false)
        }
    }

    // MARK: Full-screen ads

    private func preload(_ format: String) {
        guard sdkStarted, ConsentInformation.shared.canRequestAds, let unit = units[format],
              readyAds[format] == nil, !loading.contains(format) else { return }
        loading.insert(format)
        let finished: (FullScreenPresentingAd?, Error?) -> Void = { [weak self] ad, error in
            DispatchQueue.main.async {
                guard let self else { return }
                self.loading.remove(format)
                if let ad {
                    ad.fullScreenContentDelegate = self
                    self.readyAds[format] = ad
                    self.loadedAt[format] = Date()
                    self.failures[format] = 0
                } else {
                    // Back off on no-fill: 15 s, 30 s, 60 s … up to 5 minutes.
                    let n = (self.failures[format] ?? 0) + 1
                    self.failures[format] = n
                    let delay = min(300.0, 15.0 * pow(2.0, Double(n - 1)))
                    if let error { print("AdMob \(format) load failed:", error.localizedDescription) }
                    DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in self?.preload(format) }
                }
            }
        }
        let request = Request()
        switch format {
        case "appOpen": AppOpenAd.load(with: unit, request: request) { ad, error in finished(ad, error) }
        case "interstitial": InterstitialAd.load(with: unit, request: request) { ad, error in finished(ad, error) }
        case "rewarded": RewardedAd.load(with: unit, request: request) { ad, error in finished(ad, error) }
        default: RewardedInterstitialAd.load(with: unit, request: request) { ad, error in finished(ad, error) }
        }
    }

    private func show(id: Int, format: String) {
        // App open ads expire after four hours.
        if format == "appOpen", let t = loadedAt[format], Date().timeIntervalSince(t) > 4 * 3600 { readyAds[format] = nil }
        guard pending == nil, let host, host.presentedViewController == nil, let ad = readyAds.removeValue(forKey: format) else {
            reply(id, false)
            preload(format)
            return
        }
        pending = (id, format, false)
        setInPageAdsHidden(true)
        switch ad {
        case let rewarded as RewardedAd:
            rewarded.present(from: host) { [weak self] in self?.pending?.earned = true }
        case let rewarded as RewardedInterstitialAd:
            rewarded.present(from: host) { [weak self] in self?.pending?.earned = true }
        case let interstitial as InterstitialAd:
            interstitial.present(from: host)
        case let appOpen as AppOpenAd:
            appOpen.present(from: host)
        default:
            pending = nil
            setInPageAdsHidden(false)
            reply(id, false)
        }
    }

    func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        finishFullScreen(presented: true)
    }

    func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        print("AdMob present failed:", error.localizedDescription)
        finishFullScreen(presented: false)
    }

    private func finishFullScreen(presented: Bool) {
        guard let p = pending else { return }
        pending = nil
        setInPageAdsHidden(false)
        let isRewarded = p.format == "rewarded" || p.format == "rewardedInterstitial"
        reply(p.id, presented && (isRewarded ? p.earned : true))
        preload(p.format)
    }

    // MARK: Banner and native

    private func place(_ format: String, frame: CGRect?) {
        guard let host else { return }
        if format == "banner" {
            if let frame, banner == nil, sdkStarted, ConsentInformation.shared.canRequestAds, let unit = units["banner"] {
                let view = BannerView(adSize: AdSizeBanner)
                view.adUnitID = unit
                view.rootViewController = host
                host.view.addSubview(view)
                view.load(Request())
                banner = view
            }
            guard let banner else { return }
            if let frame {
                banner.frame = CGRect(x: frame.midX - 160, y: frame.minY, width: 320, height: 50)
                banner.isHidden = pending != nil
                host.view.bringSubviewToFront(banner)
            } else {
                banner.isHidden = true
            }
        } else if format == "native" {
            if let frame {
                loadNativeIfNeeded()
                guard let card = nativeCard else { return }
                card.frame = frame
                card.isHidden = pending != nil
                host.view.bringSubviewToFront(card)
            } else {
                nativeCard?.isHidden = true
            }
        }
    }

    private func loadNativeIfNeeded() {
        guard sdkStarted, ConsentInformation.shared.canRequestAds, let unit = units["native"], let host, nativeLoader == nil else { return }
        // Refresh a shown native ad at most once a minute.
        if let t = nativeLoadedAt, Date().timeIntervalSince(t) < 60, nativeCard != nil { return }
        let loader = AdLoader(adUnitID: unit, rootViewController: host, adTypes: [.native], options: nil)
        loader.delegate = self
        nativeLoader = loader
        loader.load(Request())
    }

    func adLoader(_ adLoader: AdLoader, didReceive nativeAd: NativeAd) {
        nativeLoader = nil
        nativeLoadedAt = Date()
        guard let host else { return }
        let card = nativeCard ?? NativeAdCard()
        if nativeCard == nil {
            card.isHidden = true
            host.view.addSubview(card)
            nativeCard = card
        }
        card.show(nativeAd)
        if let rect = slots["native"] {
            card.frame = rect
            card.isHidden = pending != nil
            host.view.bringSubviewToFront(card)
        }
    }

    func adLoader(_ adLoader: AdLoader, didFailToReceiveAdWithError error: Error) {
        print("AdMob native load failed:", error.localizedDescription)
        nativeLoader = nil
        nativeLoadedAt = Date()  // wait a minute before trying again
    }

    private func setInPageAdsHidden(_ hidden: Bool) {
        banner?.isHidden = hidden || slots["banner"] == nil
        nativeCard?.isHidden = hidden || slots["native"] == nil || nativeCard?.hasAd != true
    }

    // MARK: Helpers

    private static func cgRect(_ r: [String: Any]) -> CGRect? {
        func n(_ k: String) -> CGFloat? { (r[k] as? NSNumber).map { CGFloat($0.doubleValue) } }
        guard let x = n("x"), let y = n("y"), let w = n("w"), let h = n("h"), w > 0, h > 0 else { return nil }
        return CGRect(x: x, y: y, width: w, height: h)
    }

    private func reply(_ id: Int, _ ok: Bool) {
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript("window.AELORIA_ADS_CB && AELORIA_ADS_CB(\(id), \(ok ? "true" : "false"))")
        }
    }
}
