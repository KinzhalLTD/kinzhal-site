# Aeloria: Age of Crowns: App Store compliance report (version 1.0)

The build this covers is the Expo app in `expo/aeloria`, published from Replit. The native Xcode project in `ios/aeloria` follows the same rules.

**Legend:** ✅ met in the build · 🟡 needs an action from you in App Store Connect or AdMob.

## 1. Safety

| Guideline | Status | How |
|---|---|---|
| 1.1 Objectionable content | ✅ | Stylised fantasy combat, no blood or gore. No religious symbols in the icon or branding. Suitable for players worldwide. |
| 1.2 User-generated content | ✅ | No content is shared between players. The alliance chat and arena rivals are computer-controlled and anything typed stays on the device. This is explained in the review notes. |
| 1.3 Kids category | ✅ | Not in the Kids category. The AdMob child-directed setting is off and the ad content rating is set to G. |

## 2. Performance

| Guideline | Status | How |
|---|---|---|
| 2.1 App completeness | ✅ | The full game plays offline from the first launch. Automated audits tap every button on every screen. "Coming soon" buttons only appear outside the App Store build. The notifications button, which depends on a web feature, is hidden in the app. |
| 2.3 Accurate metadata | ✅ | Screenshots and the preview are real gameplay. The listing mentions ads, in-app purchases and the five languages. |
| 2.3.7 Keywords | ✅ | No competitor or brand names in any language. |
| 2.3.10 Other platforms | ✅ | No mention of Android or other stores. |
| 2.5.2 Self-contained code | ✅ | All game code and art ship inside the app as one offline file. Nothing is downloaded or run from the internet. |
| 2.5.1 / 4.0 iPad | ✅ | `supportsTablet: true` with all four iPad orientations and full screen. Layouts were tested at 13" and 11" in portrait and landscape, and all controls are reachable. |
| Localization | ✅ | The game and native screens are in English, Arabic, Simplified Chinese, German and Russian, and the app declares `CFBundleLocalizations`. The tracking prompt and the home-screen name are localized too. |

## 3. Business

| Guideline | Status | How |
|---|---|---|
| 3.1.1 In-app purchase | ✅ | All 13 paid items use Apple in-app purchase. There are no external payment links. |
| 3.1.1 Random items | ✅ | Crown Summon odds are shown (Legendary 4%, Epic 21%, Rare 75%, with a guaranteed Legendary within 40 summons). Chest odds are shown per reward for all three chests. |
| 3.1.1 Restore | ✅ | Restore purchases is in Menu → Ads & privacy and in Privacy & Settings. Remove Ads and the Royal Season Track are non-consumable. |
| 3.1.2 Subscriptions | ✅ | None. The Monthly Card is a consumable 30-day item tracked by the game. |
| 3.2.2 Ads | ✅ | Interstitial and app-open ads are paced: none in the first 2 minutes, none below Citadel 4, none during battles, and at least 3 minutes apart. Reward videos are optional, and the reward is given only when the video is completed. Anyone who has bought anything sees no interruptive ads. |
| Paid Apps Agreement | 🟡 | Sign it in App Store Connect → Business, with tax and banking details. |
| IAP products | 🟡 | Create all 13 products with the exact IDs in `expo/aeloria/APP_STORE_SUBMISSION.md` §4, and attach them to version 1.0. |

## 4. Design

| Guideline | Status | How |
|---|---|---|
| 4.2 Minimum functionality | ✅ | A complete game with a city, battles, a six-chapter story, a world map, 21 heroes, research and an army. It is not a website wrapper: it uses native ads, purchases, settings and localization. |
| 4.3 Spam / copycat | ✅ | Original name, story, characters, art (Canva, made for this game) and music (composed for this game). |
| 4.5.4 Notifications | ✅ | Not used in the iOS app. |
| 4.8 Sign in with Apple | ✅ | Not required, because there are no accounts. |

## 5. Legal and privacy

| Guideline | Status | How |
|---|---|---|
| 5.1.1 Privacy policy | ✅ | https://kinzhal.space/aeloria/privacy/ is linked in the app (Privacy & Settings) and in the listing. |
| 5.1.1(v) Account deletion | ✅ | There are no accounts. "Start a new realm" erases the save on the device. Data requests go to it@kinbss.org. |
| 5.1.2 Tracking | ✅ | The Google consent form appears first where required, then Apple's tracking prompt, before any ad request. Tracking is declared in the privacy manifest and in the App Privacy answers. |
| Privacy manifest | ✅ | Required-reason APIs are declared in `app.json`. The Google SDK ships its own manifest. |
| App Privacy label | 🟡 | Enter the answers from `APP_STORE_SUBMISSION.md` §7 (data used for tracking, not linked to the user). |
| 5.2 Intellectual property | ✅ | All art, music and characters are original. Historical figures (King Arthur, Sun Tzu, El Cid, Leonardo da Vinci, Peter the Great, Bismarck, Antarah, Zarqa al-Yamama) are public-domain history and legend. |
| Export compliance | ✅ | `ITSAppUsesNonExemptEncryption = false` (HTTPS only). |
| Age rating | 🟡 | Answer the questionnaire as in §6 of the guide. Expect a rating of 9+ to 13+ (loot boxes: yes). |
| EU DSA trader status | 🟡 | Declare it in App Store Connect. |

## 6. Store assets (all in `store/aeloria-ios/`)

| Asset | Size | Status |
|---|---|---|
| iPhone 6.9" screenshots | 1320 × 2868 | ✅ 8 |
| iPhone 6.3" / 6.1" screenshots | 1206 × 2622 / 1179 × 2556 | ✅ 8 each |
| iPad 13" screenshots | 2048 × 2732 | ✅ 8 |
| App preview (iPhone) | 886 × 1920, 28.5 s | ✅ |
| App icon | 1024 × 1024 RGB, no alpha | ✅ |
| Listings | EN, AR, ZH-Hans, DE, RU | ✅ `expo/aeloria/store/` |
