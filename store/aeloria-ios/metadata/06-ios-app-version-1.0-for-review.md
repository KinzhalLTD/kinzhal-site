# 6. iOS App Version 1.0: Submit for Review

App Store Connect → **iOS App → 1.0 Prepare for Submission**

## Build

- Upload the Xcode archive (Xcode Organizer or Transporter), then select it under **Build**.
- Version `1.0`, build `1`.

## App Review Information

| Field | Value |
|---|---|
| Sign-in required | **No.** Tap "Tap to begin", pick a realm and name your lord to play. |
| Contact | Kinzhal LTD Co. · it@kinbss.org · (add a phone number with country code +966) |
| Attachment | Optional: `app-preview/preview_886x1920.mp4` |

### Notes for the reviewer (paste as is)

```
Thank you for reviewing Aeloria: Age of Crowns.

- No account or login is needed. On first launch tap "Tap to begin", choose a home realm, enter any name and tap "Found my realm".
- All game content is bundled in the app and works offline. Progress is saved on the device only. We collect no personal data and show no ads.
- Gem packs are consumable In-App Purchases through StoreKit. Everything gems buy can also be earned by playing (quests, achievements, Season Road, daily gifts).
- Crown Summon is a random hero reward. Its odds are shown in the Store before purchase: Legendary 4%, Epic 21%, Rare 75%, with a guaranteed Legendary within 40 summons.
- Alliance chat and arena rivals are computer-controlled characters. There is no communication between real users.
- Quick tour: City tab (build and upgrade), Battle button (story campaign with hero skills), Heroes tab (21 heroes), World tab (map with treasure and outposts), Store tab (Royal Forge upgrades, gem packs).
```

## Version release

- **Manually release this version** is recommended for a coordinated launch, or Automatically.
- Phased release isn't used for 1.0.

## Pre-submission checklist

- [ ] `ITSAppUsesNonExemptEncryption = NO` in Info.plist
- [ ] `PrivacyInfo.xcprivacy` included
- [ ] Fonts bundled locally, so there are no Google Fonts requests
- [ ] StoreKit 2 bridge implements `window.AELORIA_PAYMENTS`, and the 5 IAP products are "Ready to Submit" and attached to this version
- [ ] "Restore Purchases" is not needed (consumables only)
- [ ] App icon 1024×1024 with no alpha channel (`icon/AppIcon-1024.png`)
- [ ] Screenshots uploaded for 6.1"/6.3", and App Store Connect scales them for the other iPhone sizes
- [ ] Age rating questionnaire completed
- [ ] Privacy policy URL live: https://kinzhal.space/privacy
