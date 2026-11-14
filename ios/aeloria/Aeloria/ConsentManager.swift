import AppTrackingTransparency
import GoogleMobileAds
import UIKit
import UserMessagingPlatform

/// Startup order required by Google and Apple:
/// 1. Google UMP consent (GDPR / US state messages set up in AdMob → Privacy & messaging)
/// 2. App Tracking Transparency (UMP shows the IDFA explainer first when that message is published)
/// 3. Start the Google Mobile Ads SDK, but only when consent allows ads to be requested.
final class ConsentManager {
    static let shared = ConsentManager()
    private var adsStarted = false

    var canRequestAds: Bool { ConsentInformation.shared.canRequestAds }
    var privacyOptionsRequired: Bool { ConsentInformation.shared.privacyOptionsRequirementStatus == .required }

    func gatherConsent(from viewController: UIViewController, onAdsReady: @escaping () -> Void) {
        let parameters = RequestParameters()
        #if DEBUG
        // To test the EEA consent form on a device, uncomment and add the hashed ID printed in the Xcode console:
        // let debug = DebugSettings(); debug.geography = .EEA; debug.testDeviceIdentifiers = ["YOUR-HASHED-ID"]
        // parameters.debugSettings = debug
        #endif

        ConsentInformation.shared.requestConsentInfoUpdate(with: parameters) { [weak self, weak viewController] updateError in
            if let updateError { print("UMP consent info error:", updateError.localizedDescription) }
            guard let viewController else { return }
            ConsentForm.loadAndPresentIfRequired(from: viewController) { formError in
                if let formError { print("UMP consent form error:", formError.localizedDescription) }
                self?.requestTrackingIfNeeded {
                    self?.startAdsIfAllowed(onAdsReady)
                }
            }
        }

        // A returning player who already answered can see ads straight away, while the update runs.
        startAdsIfAllowed(onAdsReady)
    }

    private func requestTrackingIfNeeded(_ done: @escaping () -> Void) {
        guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined else { return done() }
        ATTrackingManager.requestTrackingAuthorization { _ in
            DispatchQueue.main.async(execute: done)
        }
    }

    private func startAdsIfAllowed(_ onAdsReady: @escaping () -> Void) {
        guard canRequestAds, !adsStarted else { return }
        adsStarted = true
        MobileAds.shared.start { _ in
            DispatchQueue.main.async(execute: onAdsReady)
        }
    }

    /// "Ad privacy choices" in the game menu.
    func presentPrivacyOptions(from viewController: UIViewController, done: @escaping (Bool) -> Void) {
        ConsentForm.presentPrivacyOptionsForm(from: viewController) { error in
            if let error { print("UMP privacy options error:", error.localizedDescription) }
            done(error == nil)
        }
    }
}
