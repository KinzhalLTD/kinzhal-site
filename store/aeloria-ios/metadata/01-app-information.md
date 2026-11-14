# 1. App Information

App Store Connect → your app → **General → App Information**

| Field | Value |
|---|---|
| Name (≤30) | `Aeloria: Age of Crowns` |
| Subtitle (≤30) | see `02-subtitle.md` |
| Bundle ID | `space.kinzhal.aeloria` (must match the Xcode project) |
| SKU | `AELORIA-IOS-001` |
| Primary language | English (U.S.) |
| Primary category | Games |
| Games subcategory 1 | Strategy |
| Games subcategory 2 | Role Playing |
| Content rights | **No**, it does not contain, show or access third-party content. All art, music, story and characters are original works of Kinzhal LTD Co. |
| Age rating | Set by the questionnaire in `04-age-ratings.md` |
| License agreement | Apple's standard EULA |

## Localizable information (optional second language: Arabic)

| Field | Arabic |
|---|---|
| Name | `إيلوريا: عصر التيجان` |
| Subtitle | `ابنِ مملكتك وقُد الأبطال` |

## App Privacy (General → App Privacy)

The game shows Google AdMob ads, so the answer is **"Yes, we collect data from this app"**. Game progress itself stays on the device. These answers follow Google's own App Store privacy guidance for the Google Mobile Ads SDK.

| Data type | Collected | Linked to user | Used for tracking | Purposes |
|---|---|---|---|---|
| Identifiers → **Device ID** (IDFA, only when the player allows tracking) | Yes | No | **Yes** | Third-party advertising |
| Usage data → **Product interaction** | Yes | No | Yes | Third-party advertising, Analytics |
| Usage data → **Advertising data** | Yes | No | Yes | Third-party advertising |
| Location → **Coarse location** (from IP address) | Yes | No | Yes | Third-party advertising |
| Diagnostics → **Crash data**, **Performance data**, **Other diagnostic data** | Yes | No | No | Third-party advertising (ad SDK health) |
| Purchases → **Purchase history** | Yes | No | No | App functionality (StoreKit) |

- Privacy Policy URL: `https://kinzhal.space/privacy`. It already covers AdMob, mediation, ATT and UMP consent.
- **Tracking:** yes, so the app must show the App Tracking Transparency prompt (see `ads/ADMOB_INTEGRATION.md`).
- **Privacy manifest:**
  - The Google Mobile Ads SDK ships its own `PrivacyInfo.xcprivacy`.
  - The app's manifest declares `NSPrivacyTracking = true` and lists `NSPrivacyAccessedAPICategoryUserDefaults` (reason `CA92.1`) if the wrapper uses UserDefaults.
- The Cinzel and Cairo fonts are bundled in the game (`play/aeloria/fonts/`), so it makes no Google Fonts requests.
