# Aeloria: Age of Crowns: Expo app for Replit → App Store

Upload this folder (as a zip) to a **Replit Mobile app (Expo)** project and publish it with **Publish → Start publishing to the App Store**. No Mac is needed: the iPhone build runs on Expo's servers.

## What's inside

| Path | What it is |
|---|---|
| `www/` | The complete game (HTML, scripts, 193 painted images, music, fonts) |
| `scripts/build-game.js` | Packs `www/` into one offline file, `src/gameHtml.js`. Runs automatically after `npm install`. |
| `App.js` | Native shell: game web view, AdMob, Google consent, Apple tracking prompt, App Store purchases, Privacy & Settings |
| `src/adConfig.js` | AdMob app ID and the 6 ad unit IDs. Test ads in development, real ads in store builds. |
| `src/appConfig.js` | Privacy, terms and support links, support email, purchase product IDs |
| `src/ads.js`, `src/iap.js`, `src/bridge.js` | Ads, purchases, and the bridge the game talks to |
| `plugins/withAdMobMediation.js` | Optional mediation adapters (off until you enable them) |
| `app.json`, `eas.json` | App settings: bundle ID `space.kinzhal.aeloria`, privacy manifest, SKAdNetwork IDs, auto build numbers |
| `assets/icon.png` | 1024×1024 app icon (RGB, no transparency) |
| `store/listing-en.txt`, `store/listing-ar.txt` | App Store text in English and Arabic, within Apple's limits |
| `website/` | app-ads.txt line and the live page URLs |
| `APP_STORE_SUBMISSION.md` | Every App Store Connect screen, step by step |

## Steps in Replit

1. Replit → **Create App** → **Mobile app (Expo)**. In the file panel, delete the template files and **upload this zip's contents** to the project root, so `App.js` sits at the top level.
2. Open the **Shell** and run:
   ```bash
   npm install
   npm run setup
   npm run check:store
   ```
   - `npm install` also packs the game.
   - `setup` aligns every library with the project's Expo version.
   - `check:store` must end with **"Store check passed."**
3. **Preview** with Expo Go (scan the QR code). The game runs; ads and purchases are simulated there, because they need the real build.
4. **Publish → Start publishing to the App Store.**
   - Sign in with your Apple Developer account.
   - Replit and Expo create the App Store Connect app and build and upload it.
   - Bundle ID: `space.kinzhal.aeloria`.
5. Finish the listing in App Store Connect: see **APP_STORE_SUBMISSION.md**.

Keep the hidden file **.easignore**: it makes the cloud build include `www/` (the game). Without it the build has no game to pack.

You don't need a Replit Agent prompt when you use this zip; everything is already wired.

## Updating the game later

The game lives in `www/`. After changing it, run `npm run build:game`, raise `version` in `app.json` (for example 1.0.1), and publish again. Build numbers increase automatically.

Inside the kinzhal-site repository, `npm run sync:game` refreshes `www/` from `play/aeloria`.
