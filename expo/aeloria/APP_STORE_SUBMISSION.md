# Submitting Aeloria: Age of Crowns to the App Store

## 1. How this build meets App Review Guidelines

| Guideline | How the app meets it |
|---|---|
| 2.1 App completeness | Full game bundled, playable offline from the first launch; no login |
| 2.3 Accurate metadata | Screenshots and preview are real gameplay; the listing mentions ads and in-app purchases |
| 2.5.2 Self-contained code | All game code and art are inside the app (`src/gameHtml.js`); nothing is downloaded |
| 3.1.1 In-app purchase | Every paid item uses App Store purchases (`src/iap.js`). Crown Summon odds are shown in the game. Restore purchases is in Menu → Ads & privacy and in Privacy & Settings. |
| 4.2 Minimum functionality | A complete native-feeling game with city building, battles, a story, a world map and heroes, not a website wrapper |
| 5.1.1 Privacy | Privacy policy linked in the app and listing; no account; data on the device; deletion request by email |
| 5.1.2 Tracking | Apple's tracking prompt appears before any personalised ads; Google consent first where the law requires it |
| 2.3.10 | No mention of other platforms in the listing |

## 2. Before you submit (one time)

- [ ] **Apple Developer Program** membership as Kinzhal LTD Co. (organisation, D-U-N-S number).
- [ ] **App Store Connect → Business:** sign the **Paid Apps Agreement** and add tax and banking details. This is required because the app sells in-app purchases.
- [ ] **EU Digital Services Act:** declare trader status (a trader, with company address, email and phone).
- [ ] **AdMob:** follow `ADMOB_CONSOLE_SETUP.md` from the store kit, or set these up yourself:
  - the consent messages for Europe and the UK, US states, and the IDFA explainer
  - content rating G and sensitive categories blocked
- [ ] **app-ads.txt** live at https://kinzhal.space/app-ads.txt with `google.com, pub-5681105275743934, DIRECT, f08c47fec0942fa0`.

## 3. New app (Replit creates it on first publish; check these fields)

| Field | Value |
|---|---|
| Platform | iOS |
| Name | Aeloria: Age of Crowns |
| Primary language | English (U.S.) |
| Bundle ID | space.kinzhal.aeloria |
| SKU | AELORIA-IOS-001 |
| User access | Full access |

**App Information:**

| Field | Value |
|---|---|
| Subtitle | Build a Kingdom, Lead Heroes |
| Category | Games → Strategy; secondary Role Playing (**never Kids**) |
| Content rights | Does not use third-party content (all art, music and story are original) |
| Localizations | Add **Arabic**, **Chinese (Simplified)**, **German** and **Russian** next to English (U.S.), and paste `store/listing-ar.txt`, `listing-zh.txt`, `listing-de.txt`, `listing-ru.txt` into each one's name, subtitle, promo text, keywords and description |

## 4. In-app purchases (Monetization → In-App Purchases)

Create each with the exact Product ID, the price, a display name and description, and a review screenshot of the Store screen.

| Product ID | Type | Price |
|---|---|---|
| space.kinzhal.aeloria.pouch | Consumable | SAR 4.99 |
| space.kinzhal.aeloria.satchel | Consumable | SAR 14.99 |
| space.kinzhal.aeloria.chest | Consumable | SAR 29.99 |
| space.kinzhal.aeloria.vault | Consumable | SAR 59.99 |
| space.kinzhal.aeloria.treasury | Consumable | SAR 149.99 |
| space.kinzhal.aeloria.founder | Consumable | SAR 4.99 |
| space.kinzhal.aeloria.legend | Consumable | SAR 14.99 |
| space.kinzhal.aeloria.pack5 | Consumable | SAR 9.99 |
| space.kinzhal.aeloria.pack10 | Consumable | SAR 24.99 |
| space.kinzhal.aeloria.pack15 | Consumable | SAR 49.99 |
| space.kinzhal.aeloria.card | Consumable (30-day card, the game tracks the days) | SAR 19.99 |
| space.kinzhal.aeloria.royal | Non-Consumable | SAR 39.99 |
| space.kinzhal.aeloria.noads | Non-Consumable | SAR 9.99 |

The app shows the App Store's own price in each player's currency. Attach all 13 to version 1.0 before submitting.

## 5. Pricing and availability

- Price: **Free**.
- Availability: all countries. Untick **China mainland**, which needs a government game licence.

## 6. Age rating (answers)

| Question | Answer |
|---|---|
| Parental controls, age assurance, unrestricted web, user-generated content, messaging | No |
| Advertising | **Yes** |
| Cartoon or fantasy violence | Frequent / Intense: battles are the core of the game (stylised, no blood) |
| Horror / fear themes | Infrequent / Mild (a shadowy villain, ghouls) |
| Guns or other weapons | Infrequent / Mild (swords and bows) |
| Gambling (real money) | No |
| Simulated gambling, contests | None (the daily wheel is a free spin with no wagering) |
| Loot boxes | **Yes**: Crown Summon gives random heroes for gems; odds are shown |
| Everything else (profanity, alcohol, sexual content, medical) | None |

Expected rating: **9+**, or 13+ if Apple counts the loot box answer that way.

## 7. App Privacy (nutrition label)

**Data collected: Yes. Tracking: Yes.** None of it is linked to the player's identity.

| Data type | Used for | Tracking |
|---|---|---|
| Location → Coarse location | Third-party advertising, Analytics | Yes |
| Identifiers → Device ID | Third-party advertising, Analytics | Yes |
| Usage data → Product interaction | Third-party advertising, Analytics | Yes |
| Usage data → Advertising data | Third-party advertising, Analytics | Yes |
| Diagnostics → Crash data, Performance data | App functionality | No |
| Purchases → Purchase history | App functionality | No |

Privacy Policy URL: https://kinzhal.space/aeloria/privacy/

## 8. Version 1.0 page

| Field | Value |
|---|---|
| Screenshots, iPhone 6.9" (1320×2868) | `screenshots/iphone-6.9in_1320x2868/` from the store kit, 8 images in order |
| Screenshots, 6.3" (1206×2622) and 6.1" (1179×2556) | Optional; the store kit has both sets |
| **Screenshots, iPad 13" (2048×2732), required because the app supports iPad** | `screenshots/ipad-13in_2048x2732/` from the store kit, 8 images |
| App preview | `app-preview/preview_886x1920.mp4` (optional; poster frame at 00:11) |
| Promotional text, description, keywords | `store/listing-en.txt` |
| Support URL | https://kinzhal.space/aeloria/support/ |
| Marketing URL | https://kinzhal.space/aeloria/ |
| Copyright | 2026 Kinzhal LTD Co. |
| Build | The one Replit uploaded (wait for "Processing" to finish) |
| Sign-in required | **No** |
| Contact | Kinzhal LTD Co. · it@kinbss.org · your phone with +966 |

**Notes for the reviewer (paste):**

```
Thank you for reviewing Aeloria: Age of Crowns.
- No account needed: tap "Tap to begin", choose a realm, enter any name and tap "Found my realm".
- The full game is bundled in the app. Progress is saved on the device only.
- Ads are served by Google AdMob. Google's consent form (where required) and Apple's tracking prompt appear before ads are requested. Interstitial and app-open ads are paced: never in the first minutes, never during a battle, at most one every 3 minutes. Reward videos are always optional.
- In-app purchases: gem packs and offers in the Store tab. "Remove Ads" and "Royal Season Track" are non-consumable; "Restore purchases" is under Menu → Ads & privacy, and in Menu → Ads & privacy → Privacy & Settings.
- Crown Summon is a random hero reward; its odds are shown in the Store before purchase (Legendary 4%, Epic 21%, Rare 75%).
- Alliance chat and arena rivals are computer-controlled; there is no communication between real users.
```

Release: **Manually release this version**. Then **Add for Review → Submit**.

## 9. AdMob policy reminders

- Never tap your own live ads. Register your iPhone as a test device in AdMob.
- Don't place ads where they could be tapped by accident. The game's banner and native slots are inside menus, never over buttons.
- Interstitials only appear at natural breaks (leaving a battle result), as the game already enforces.

## 10. Common rejections and what to do

| Rejection | Fix |
|---|---|
| 2.1: the reviewer couldn't find purchases, or a purchase failed | Make sure all 13 IAPs are attached to the version and "Ready to Submit", and the Paid Apps Agreement is active |
| 3.1.1: no restore | Point the reviewer to Menu → Ads & privacy → Restore purchases |
| 5.1.2: tracking prompt text | The text explains the purpose; keep it, or make it more specific |
| 4.2: "web view app" | Reply that the whole game is bundled and works offline, with native ads, purchases and settings |
| 2.3.7: keywords | Don't add competitor names to the keywords |

## 11. After approval

1. Release the version.
2. **AdMob → Apps → Aeloria → App settings → Add app store details:** link the live listing. AdMob then verifies app-ads.txt within about 24 hours.
3. Watch Xcode Organizer / App Store Connect → TestFlight crashes, and AdMob fill rates, in the first week.
4. For updates: change `www/`, run `npm run build:game`, raise `version` in app.json, and publish again from Replit.
