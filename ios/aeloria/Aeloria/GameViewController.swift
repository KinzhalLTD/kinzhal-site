import UIKit
import WebKit

/// Hosts the game in a full-screen web view and connects the ads, consent and purchase bridges.
final class GameViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private(set) var webView: WKWebView!
    let ads = AdsBridge()
    let store = StoreBridge()
    private var consentStarted = false

    override func loadView() {
        let container = UIView()
        container.backgroundColor = UIColor(named: "LaunchBackground")

        let config = WKWebViewConfiguration()
        let gameRoot = Bundle.main.resourceURL!.appendingPathComponent("Game", isDirectory: true)
        config.setURLSchemeHandler(GameSchemeHandler(root: gameRoot), forURLScheme: GameSchemeHandler.scheme)
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.websiteDataStore = .default()

        let content = config.userContentController
        content.add(WeakScriptHandler(ads), name: "aeloriaAds")
        content.add(WeakScriptHandler(store), name: "aeloriaStore")
        content.addUserScript(WKUserScript(source: StoreBridge.javaScript, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        #if DEBUG
        content.addUserScript(WKUserScript(source: "window.__errs=[];addEventListener('error',function(e){__errs.push(String(e.message))});",
                                           injectionTime: .atDocumentStart, forMainFrameOnly: true))
        #endif

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.isOpaque = false
        webView.backgroundColor = container.backgroundColor
        webView.navigationDelegate = self
        webView.uiDelegate = self
        #if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true }
        #endif

        container.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: container.topAnchor),
            webView.bottomAnchor.constraint(equalTo: container.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: container.trailingAnchor),
        ])
        self.webView = webView
        view = container

        ads.attach(webView: webView, host: self)
        store.attach(webView: webView)
        webView.load(URLRequest(url: GameSchemeHandler.startURL))
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        guard !consentStarted else { return }
        consentStarted = true
        // Google consent (UMP) → App Tracking Transparency → start the Mobile Ads SDK.
        ConsentManager.shared.gatherConsent(from: self) { [weak self] in
            self?.ads.sdkReady()
        }
    }

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }

    // MARK: WKNavigationDelegate

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        // Links to the website, privacy policy or mail open outside the game.
        if let url = navigationAction.request.url, url.scheme != GameSchemeHandler.scheme, url.scheme != "about", url.scheme != "blob", url.scheme != "data" {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        store.pageDidLoad()
        #if DEBUG
        DispatchQueue.main.asyncAfter(deadline: .now() + 8) { [weak webView] in
            let probe = "JSON.stringify({art: typeof ART !== 'undefined' && ART.ready, fonts: document.fonts.status, " +
                "cinzel: document.fonts.check('900 20px Cinzel'), ads: !!window.AELORIA_ADS, pay: !!window.AELORIA_PAYMENTS, " +
                "intro: !!document.querySelector('#intro:not([hidden])'), errors: window.__errs})"
            webView?.evaluateJavaScript(probe) { result, error in
                print("AELORIA_SMOKE \(result ?? "nil") \(error.map { String(describing: $0) } ?? "")")
            }
        }
        #endif
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }

    // MARK: WKUIDelegate

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url { UIApplication.shared.open(url) }
        return nil
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        present(alert, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }
}

/// WKUserContentController retains its handlers strongly; this breaks the cycle.
final class WeakScriptHandler: NSObject, WKScriptMessageHandler {
    private weak var target: WKScriptMessageHandler?
    init(_ target: WKScriptMessageHandler) { self.target = target }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(controller, didReceive: message)
    }
}
