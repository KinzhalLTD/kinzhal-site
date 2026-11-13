# Aeloria: Age of Crowns: App Store submission kit (iOS 1.0)

Everything you need to fill in App Store Connect for the first iPhone release.

```
store/aeloria-ios/
├── metadata/
│   ├── 01-app-information.md                 Name, bundle ID, SKU, category, content rights, App Privacy
│   ├── 02-subtitle.md                        Subtitle (≤30) plus alternatives
│   ├── 03-general-information.md             Price, availability, copyright, In-App Purchase products
│   ├── 04-age-ratings.md                     Answer for each question in the age-rating questionnaire
│   ├── 05-app-encryption-documentation.md    Export compliance (exempt) and the Info.plist key
│   ├── 06-ios-app-version-1.0-for-review.md  Review notes, contact, pre-submission checklist
│   └── 07-product-page-information.md        Promo text, description, keywords, URLs, media order
├── screenshots/
│   ├── iphone-6.1in_1179x2556/   8 captioned portrait screenshots
│   └── iphone-6.3in_1206x2622/   8 captioned portrait screenshots
├── ads/
│   └── ADMOB_INTEGRATION.md      AdMob IDs, placements, JS↔Swift bridge, Info.plist, consent/ATT order
├── app-preview/
│   ├── preview_886x1920.mp4      28.5 s gameplay, H.264 High 30 fps, AAC stereo, game soundtrack
│   └── poster-frame_886x1920.png
└── icon/
    └── AppIcon-1024.png          1024×1024, no alpha
```

All media is captured from the real game. App Review requires app previews to show only footage from the app.

The preview was recorded at 443×960 points and scaled 2× to 886×1920. Apple also accepts 1920×886 landscape previews, and 2556×1179 / 2622×1206 landscape screenshots. This kit uses portrait, which is the game's main orientation.

## Still needed before you can press "Submit"

1. **A native iOS binary.** The game is HTML/JS today. Wrap `play/aeloria/` in a WKWebView app, with Capacitor or a small SwiftUI shell, and bundle every file so the app runs offline. Bundle the Google Fonts locally too.
2. **StoreKit 2 payments.** Implement `window.AELORIA_PAYMENTS = { buy(id) → Promise<boolean>, restore() → Promise<string[]> }` in the wrapper, for the 13 products in `metadata/03-general-information.md`.
3. **AdMob in the wrapper.** Add the Google Mobile Ads and UMP SDKs and the `aeloriaAds` message handler, as described in `ads/ADMOB_INTEGRATION.md`. The game already contains every placement and the unit IDs.
4. **Apple Developer account** (Kinzhal LTD Co. as the organization, with a D-U-N-S number), the bundle ID `space.kinzhal.aeloria`, and a phone number for the review contact.
5. Complete **Paid Apps Agreement**, tax and banking in App Store Connect so the purchases can go live.
