# Aeloria: Age of Crowns: iOS app

A native iPhone/iPad shell around the web game in `play/aeloria/`. It includes:

| Part | File |
|---|---|
| Full-screen game web view, served from the app bundle at `aeloria://localhost/` (offline, with range requests for music) | `GameViewController.swift`, `GameSchemeHandler.swift` |
| Google consent (UMP) → App Tracking Transparency → Mobile Ads start | `ConsentManager.swift` |
| AdMob: app open, banner, interstitial, native advanced, rewarded, rewarded interstitial | `AdsBridge.swift`, `NativeAdCard.swift` |
| StoreKit 2 purchases, restore, localized prices, Ask to Buy | `StoreBridge.swift` |
| AdMob app ID, ATT text, SKAdNetwork IDs, export compliance | `Info.plist` |
| Privacy manifest | `PrivacyInfo.xcprivacy` |

The game's own code (`play/aeloria/ads.js`) decides when ads appear. The Swift side only loads and shows them. See `store/aeloria-ios/ads/ADMOB_INTEGRATION.md` for the message protocol.

## Build on a Mac

```bash
brew install xcodegen
cd ios/aeloria
xcodegen                    # creates Aeloria.xcodeproj (and resolves Google's Swift packages)
open Aeloria.xcodeproj
```

1. In Xcode → target **Aeloria** → **Signing & Capabilities**, choose your team.
   - The bundle ID is `space.kinzhal.aeloria`.
   - Add the **In-App Purchase** capability.
2. Run on a simulator or device. Each build copies the current `play/aeloria/` into the app automatically, so there's nothing to sync by hand.
3. Before uploading, run **Product → Archive**, then Distribute App → App Store Connect.

You don't need a Mac to check that it compiles: every push that touches `ios/aeloria/` or `play/aeloria/` runs **`.github/workflows/aeloria-ios.yml`**. That workflow:
- builds the app for the simulator
- launches it and checks that the game, ad bridge and payment bridge load
- uploads a screenshot and the launch log as the `aeloria-ios-smoke` artifact

## Testing ads safely

- **Never tap live ads on your own devices.** Add your iPhone under AdMob → Settings → **Test devices**, then live units serve test ads to it.
- To see the EEA consent form, uncomment the `DebugSettings` lines in `ConsentManager.swift` (Debug builds only).

## Testing purchases

Create the 13 products in App Store Connect (`store/aeloria-ios/metadata/03-general-information.md`), then test them with a Sandbox account (Settings → App Store → Sandbox Account on the device).
