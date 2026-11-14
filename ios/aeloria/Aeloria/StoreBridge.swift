import StoreKit
import WebKit

/// StoreKit 2 behind the game's `window.AELORIA_PAYMENTS = { buy(id), restore() }`.
/// Game IDs map to App Store product IDs as `space.kinzhal.aeloria.<id>`.
final class StoreBridge: NSObject, WKScriptMessageHandler {
    static let prefix = "space.kinzhal.aeloria."
    static let gameIDs = ["pouch", "satchel", "chest", "vault", "treasury",
                          "founder", "legend", "pack5", "pack10", "pack15",
                          "card", "royal", "noads"]

    /// Injected at document start, before the game scripts run.
    static let javaScript = """
    (function () {
      var seq = 0, wait = {};
      window.AELORIA_STORE_CB = function (id, ok, value) { var f = wait[id]; if (f) { delete wait[id]; f(ok, value); } };
      function call(cmd, product) {
        return new Promise(function (resolve, reject) {
          var id = ++seq;
          wait[id] = function (ok, value) { ok ? resolve(value) : reject(new Error(value || 'failed')); };
          window.webkit.messageHandlers.aeloriaStore.postMessage({ id: id, cmd: cmd, product: product || '' });
        });
      }
      window.AELORIA_PAYMENTS = {
        buy: function (product) { return call('buy', product).then(function () { return true; }); },
        restore: function () { return call('restore'); }
      };
    })();
    """

    private weak var webView: WKWebView?
    private var products: [String: Product] = [:]
    private var pageLoaded = false
    private var queuedGrants: [(gameID: String, transaction: Transaction)] = []
    private var updatesTask: Task<Void, Never>?

    func attach(webView: WKWebView) {
        self.webView = webView
        // Purchases completed outside the purchase sheet (Ask to Buy, interrupted purchases) arrive here.
        updatesTask = Task { [weak self] in
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                await self?.deliver(transaction)
            }
        }
        Task { await loadProducts() }
    }

    deinit { updatesTask?.cancel() }

    func pageDidLoad() {
        pageLoaded = true
        pushPrices()
        let grants = queuedGrants
        queuedGrants.removeAll()
        Task { for g in grants { await grant(g.gameID, g.transaction) } }
    }

    // MARK: Messages from the game

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let id = (body["id"] as? NSNumber)?.intValue,
              let cmd = body["cmd"] as? String else { return }
        let gameID = body["product"] as? String ?? ""
        Task { @MainActor in
            switch cmd {
            case "buy":
                let (ok, info) = await self.buy(gameID)
                self.reply(id, ok, ok ? "null" : Self.json(info))
            case "restore":
                if let owned = await self.restore() { self.reply(id, true, Self.json(owned)) }
                else { self.reply(id, false, Self.json("restore failed")) }
            default:
                self.reply(id, false, Self.json("unknown command"))
            }
        }
    }

    // MARK: StoreKit

    private func loadProducts() async {
        do {
            let list = try await Product.products(for: Self.gameIDs.map { Self.prefix + $0 })
            await MainActor.run {
                for product in list { self.products[String(product.id.dropFirst(Self.prefix.count))] = product }
                self.pushPrices()
            }
        } catch {
            print("StoreKit products failed:", error.localizedDescription)
        }
    }

    private func buy(_ gameID: String) async -> (Bool, String) {
        if products[gameID] == nil { await loadProducts() }
        guard let product = products[gameID] else { return (false, "This item is not available right now") }
        do {
            switch try await product.purchase() {
            case .success(let verification):
                guard case .verified(let transaction) = verification else { return (false, "Purchase could not be verified") }
                await transaction.finish()   // the game grants the items as soon as buy() resolves
                return (true, "")
            case .userCancelled:
                return (false, "cancelled")
            case .pending:
                return (false, "Purchase pending approval")
            @unknown default:
                return (false, "Purchase failed")
            }
        } catch {
            return (false, error.localizedDescription)
        }
    }

    /// Returns the game IDs of non-consumables the player owns (Remove Ads, Royal Season Track).
    private func restore() async -> [String]? {
        do { try await AppStore.sync() } catch { print("AppStore.sync:", error.localizedDescription) }
        var owned: [String] = []
        for await result in Transaction.currentEntitlements {
            guard case .verified(let t) = result, t.revocationDate == nil, t.productID.hasPrefix(Self.prefix) else { continue }
            owned.append(String(t.productID.dropFirst(Self.prefix.count)))
        }
        return owned
    }

    @MainActor
    private func deliver(_ transaction: Transaction) async {
        guard transaction.revocationDate == nil, transaction.productID.hasPrefix(Self.prefix) else {
            await transaction.finish(); return
        }
        let gameID = String(transaction.productID.dropFirst(Self.prefix.count))
        if pageLoaded { await grant(gameID, transaction) } else { queuedGrants.append((gameID, transaction)) }
    }

    @MainActor
    private func grant(_ gameID: String, _ transaction: Transaction) async {
        guard let webView else { return }
        do {
            _ = try await webView.evaluateJavaScript("window.AELORIA_GRANT ? (AELORIA_GRANT(\(Self.json(gameID))), true) : false")
            await transaction.finish()
        } catch {
            print("Grant failed, will retry on next launch:", error.localizedDescription)
        }
    }

    // MARK: JavaScript

    private func pushPrices() {
        guard pageLoaded, !products.isEmpty else { return }
        let prices = products.mapValues { $0.displayPrice }
        let js = "window.AELORIA_PRICES = \(Self.json(prices)); window.dispatchEvent(new Event('aeloriaprices'));"
        webView?.evaluateJavaScript(js)
    }

    private func reply(_ id: Int, _ ok: Bool, _ valueJSON: String) {
        webView?.evaluateJavaScript("window.AELORIA_STORE_CB && AELORIA_STORE_CB(\(id), \(ok ? "true" : "false"), \(valueJSON))")
    }

    private static func json<T: Encodable>(_ value: T) -> String {
        guard let data = try? JSONEncoder().encode(value), let s = String(data: data, encoding: .utf8) else { return "null" }
        return s
    }
}
