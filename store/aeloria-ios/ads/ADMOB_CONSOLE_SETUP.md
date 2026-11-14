# AdMob console: one-time setup for Aeloria

These steps happen in the AdMob website (apps.admob.com), signed in with the account that owns `pub-5681105275743934`. The app code is already prepared for all of them.

## 1. Consent message (GDPR: EEA, UK, Switzerland)

1. AdMob → **Privacy & messaging** → **European regulations** → **Create message**.
2. Apps: select **Aeloria: Age of Crowns** (app ID `ca-app-pub-5681105275743934~9324813833`).
3. Language: English. Add Arabic as a second language if you like.
4. **User consent options:** tick **Consent**, **Do not consent** and **Manage options**. Including "Do not consent" improves trust and is expected in the UK.
5. **Close (do not consent):** leave it off.
6. **Targeting:** Countries subject to GDPR (EEA and UK).
7. Privacy policy URL: `https://kinzhal.space/privacy`.
8. Styling: use dark background `#140F22`, button colour `#E8A33D` and text `#FFF1C4` to match the game. This is optional.
9. **Ad partners:** keep Google's recommended list. Add AppLovin, Unity Ads and the others only if you turn on mediation.
10. **Publish.**

## 2. US state regulations message

1. Privacy & messaging → **US state regulations** → **Create message**.
2. Select the Aeloria app, keep the defaults, and **Publish**.
3. The game's **Menu → Ads & privacy → Ad privacy choices** button opens this form so players can opt out later.

## 3. IDFA explainer (shown just before Apple's tracking prompt)

1. Privacy & messaging → **IDFA explainer** (under "Other messages" / iOS) → **Create message**.
2. Select the Aeloria app. Suggested text:
   - Headline: **Keep Aeloria free**
   - Body: **Aeloria is free thanks to ads. On the next screen, you can allow tracking so the ads you see are more relevant to you. You'll see the same number of ads either way.**
   - Button: **Continue**
3. **Publish.** The app's `NSUserTrackingUsageDescription` already reads: *"Allow tracking to see ads that are more relevant to you. Aeloria stays free thanks to ads."*

The app asks for consent first, then shows the explainer and Apple's prompt, then starts ads (see `ios/aeloria/Aeloria/ConsentManager.swift`). Messages can take up to an hour to start serving after you publish.

## 4. App settings (AdMob → Apps → Aeloria → App settings)

- **Blocking controls → Content:**
  - Max ad content rating: **G** (or PG if fill is low).
  - Block **Gambling & betting**, **Dating**, **Alcohol**, **Sexual & suggestive**, **Politics** and **Weight loss**.
- **Child-directed setting:** not child-directed. The game is for a general audience (9+), not the Kids category.
- **Ad units:**
  - Banner, native, rewarded and rewarded interstitial: leave **Frequency capping** off; the game paces them.
  - Interstitial and app open: set a cap of 1 per 3 minutes as a safety net.
  - Banner refresh: Google optimized.
  - Rewarded: set the reward to "1 Bonus". The game decides the actual prize.

## 5. Test devices

Settings → **Test devices** → **Add test device**. Enter the device's advertising ID. It is printed in the Xcode console on first run as `<Google> To get test ads on this device…`. Always test this way, and never tap live ads yourself.

## 6. Link the app to its App Store listing (after it is live)

When Aeloria is approved and live on the App Store:

1. AdMob → **Apps** → Aeloria → **App settings** → **App store details** → **Add**.
2. Search "Aeloria: Age of Crowns" (or Kinzhal LTD Co.), select it and save.
3. AdMob then crawls `https://kinzhal.space/app-ads.txt`. The app must list **`https://kinzhal.space`** as its Marketing or Support URL in App Store Connect (it does). Within about 24 hours, **Apps → app-ads.txt** should show *Verified*.
4. If verification fails, check that `https://kinzhal.space/app-ads.txt` contains:

   ```
   google.com, pub-5681105275743934, DIRECT, f08c47fec0942fa0
   ```

   The site build already publishes it.

Until linking, ads still serve, but fill and pay are lower, so link the same day the app goes live.
