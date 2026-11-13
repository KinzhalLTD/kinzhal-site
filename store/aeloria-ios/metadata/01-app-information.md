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

- Privacy Policy URL: `https://kinzhal.space/privacy`
- Data collection: **No, we do not collect data from this app.** Progress is saved only on the device (local storage). There are no accounts, analytics, ads or tracking.
- Before you submit, make sure the native build bundles the Cinzel and Cairo fonts. The web version loads them from Google Fonts, which would send requests to a third party.
- Privacy manifest (`PrivacyInfo.xcprivacy`):
  - `NSPrivacyTracking` = false
  - `NSPrivacyCollectedDataTypes` = empty
  - Declare `NSPrivacyAccessedAPICategoryUserDefaults` with reason `CA92.1` if the wrapper stores the save in UserDefaults.
