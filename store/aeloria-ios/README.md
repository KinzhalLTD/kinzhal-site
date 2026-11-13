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
│   ├── ADMOB_INTEGRATION.md      AdMob IDs, placements, JS↔Swift bridge, Info.plist, consent/ATT order
│   └── ADMOB_CONSOLE_SETUP.md    Consent, US-states and IDFA-explainer messages; blocking; linking the store listing
├── app-preview/
│   ├── preview_886x1920.mp4      28.5 s gameplay, H.264 High 30 fps, AAC stereo, game soundtrack
│   └── poster-frame_886x1920.png
└── icon/
    └── AppIcon-1024.png          1024×1024, no alpha
```

All media is captured from the real game. App Review requires app previews to show only footage from the app.

The preview was recorded at 443×960 points and scaled 2× to 886×1920. Apple also accepts 1920×886 landscape previews, and 2556×1179 / 2622×1206 landscape screenshots. This kit uses portrait, which is the game's main orientation.

## Still needed before you can press "Submit"

1. **The iOS app** lives in `ios/aeloria/`, with AdMob, the consent SDK and StoreKit 2 included. Open it on a Mac with XcodeGen, set your Team ID, then Archive and upload. See `ios/aeloria/README.md`.
2. **Create the 13 in-app purchase products** in App Store Connect (`metadata/03-general-information.md`). The app's StoreKit code is already wired to them.
3. **AdMob console setup:** follow `ads/ADMOB_CONSOLE_SETUP.md` for the consent messages and blocking. Link the store listing on launch day.
4. **Apple Developer account** (Kinzhal LTD Co. as the organization, with a D-U-N-S number), the bundle ID `space.kinzhal.aeloria`, and a phone number for the review contact.
5. Complete **Paid Apps Agreement**, tax and banking in App Store Connect so the purchases can go live.
