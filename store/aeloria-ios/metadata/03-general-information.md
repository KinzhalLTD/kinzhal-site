# 3. General Information

App Store Connect → **Pricing and Availability**, and the version page.

| Field | Value |
|---|---|
| Price | Free (Tier 0) |
| In-app purchases | Yes, consumable gem packs (see below) |
| Availability | All countries and regions. Start with Saudi Arabia and the GCC if you prefer a soft launch. |
| Copyright | `2026 Kinzhal LTD Co.` |
| Developer / Seller | Kinzhal LTD Co., Saudi Arabia |
| Support email | it@kinbss.org |
| Supported devices | iPhone and iPad (iOS 16+). Portrait primary; the layout also adapts to landscape and iPad. |
| Game Center | Not used in 1.0 |
| Sign in | None. No account needed. |
| Offline | Yes. All content is bundled in the app. |

## In-app purchases (consumables) to create

| Product ID | Reference name | Gems | Bonus | Price |
|---|---|---|---|---|
| `space.kinzhal.aeloria.gems.pouch` | Pouch of Gems | 300 | 0 | SAR 4.99 (USD 0.99 tier) |
| `space.kinzhal.aeloria.gems.satchel` | Satchel of Gems | 1,000 | +100 | SAR 14.99 |
| `space.kinzhal.aeloria.gems.chest` | Chest of Gems | 2,200 | +400 | SAR 29.99 |
| `space.kinzhal.aeloria.gems.vault` | Vault of Gems | 4,800 | +1,200 | SAR 59.99 |
| `space.kinzhal.aeloria.gems.treasury` | Sultan's Treasury | 13,000 | +4,000 | SAR 149.99 |

Each product needs:

- a display name and description, for example "300 gems to spend in the Royal Bazaar"
- a review screenshot: use `screenshots/iphone-6.1in_1179x2556/08-forge.jpg`, or capture the Gems tab
- review notes

The game pack IDs (`pouch`, `satchel`, `chest`, `vault`, `treasury`) map 1:1 to these products through `window.AELORIA_PAYMENTS.buy(packId)`. That bridge is documented in `meta.js` and must be implemented with StoreKit 2 in the native wrapper. Until it exists, the buttons show "coming soon" and nothing can be bought.

Everything sold with gems can also be earned by playing (quests, achievements, Season Road, daily gifts, trials and battles).
