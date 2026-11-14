# 3. General Information

App Store Connect → **Pricing and Availability**, and the version page.

| Field | Value |
|---|---|
| Price | Free (Tier 0) |
| In-app purchases | Yes (see below) |
| Ads | Yes, Google AdMob (see `ads/ADMOB_INTEGRATION.md`) |
| Availability | All countries and regions. Start with Saudi Arabia and the GCC if you prefer a soft launch. |
| Copyright | `2026 Kinzhal LTD Co.` |
| Developer / Seller | Kinzhal LTD Co., Saudi Arabia |
| Support email | it@kinbss.org |
| Supported devices | iPhone and iPad (iOS 16+). iPhone in portrait; iPad in all orientations. |
| Languages | English, Arabic, Simplified Chinese, German, Russian |
| Game Center | Not used in 1.0 |
| Sign in | None. No account needed. |
| Offline | Yes, playable offline. All content is bundled; ads need a connection. |

## In-app purchases to create

Every ID below matches the game's internal ID. The wrapper's `window.AELORIA_PAYMENTS.buy(id)` receives `pouch`, `founder`, `noads` and so on, and maps them to `space.kinzhal.aeloria.<id>`.

| Product ID | Type | Name | Contents | Price |
|---|---|---|---|---|
| `space.kinzhal.aeloria.pouch` | Consumable | Pouch of Gems | 300 gems | SAR 4.99 |
| `space.kinzhal.aeloria.satchel` | Consumable | Satchel of Gems | 1,000 + 100 gems | SAR 14.99 |
| `space.kinzhal.aeloria.chest` | Consumable | Chest of Gems | 2,200 + 400 gems | SAR 29.99 |
| `space.kinzhal.aeloria.vault` | Consumable | Vault of Gems | 4,800 + 1,200 gems | SAR 59.99 |
| `space.kinzhal.aeloria.treasury` | Consumable | Sultan's Treasury | 13,000 + 4,000 gems | SAR 149.99 |
| `space.kinzhal.aeloria.founder` | Consumable (the game limits it to once) | Founder's Pack | 1,500 gems, 10 Saqr shards, 5 hourglasses, 5 Hero Tomes, city skin | SAR 4.99 |
| `space.kinzhal.aeloria.legend` | Consumable | Legend Pack | 1,000 gems, 5 tokens, 6 Hero Tomes | SAR 14.99 |
| `space.kinzhal.aeloria.pack5` | Consumable | Citadel 5 Pack | 1,200 gems, builder, 6 hourglasses, 100 essence | SAR 9.99 |
| `space.kinzhal.aeloria.pack10` | Consumable | Citadel 10 Pack | 3,000 gems, 2 eight-hour hourglasses, 3 tokens, 300 essence | SAR 24.99 |
| `space.kinzhal.aeloria.pack15` | Consumable | Citadel 15 Pack | 6,500 gems, 8 tokens, 800 essence | SAR 49.99 |
| `space.kinzhal.aeloria.card` | Consumable (the game tracks the 30 days) | Royal Monthly Card | 300 gems now + 100 gems a day for 30 days | SAR 19.99 |
| `space.kinzhal.aeloria.royal` | **Non-consumable** | Royal Season Track | Second reward row on the Season Road | SAR 39.99 |
| `space.kinzhal.aeloria.noads` | **Non-consumable** | Remove Ads | Removes interstitial, app-open, banner and native ads forever (optional reward videos stay) | SAR 9.99 |

Because Remove Ads and Royal Season Track are non-consumable, the app must offer **Restore Purchases**. The game shows that button under Menu → Ads & privacy when the wrapper provides `AELORIA_PAYMENTS.restore() → Promise<string[]>` (the list of owned product IDs).

Each product needs:

- a display name and description, for example "300 gems to spend in the Royal Bazaar"
- a review screenshot: use `screenshots/iphone-6.1in_1179x2556/08-forge.jpg`, or capture the Gems tab
- review notes

The `window.AELORIA_PAYMENTS = { buy(id) → Promise<boolean>, restore() → Promise<string[]> }` bridge must be implemented with StoreKit 2 in the native wrapper. Until it exists, the buttons show "coming soon" and nothing can be bought.

Everything sold with gems can also be earned by playing (quests, achievements, Season Road, daily gifts, trials and battles).
