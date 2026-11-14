# kinzhal.space — one website for every Kinzhal game (Netlify)

Each game gets `/slug/`, `/slug/privacy/`, `/slug/terms/`, `/slug/support/` (English + Arabic).
The root serves the studio home page and the one shared `app-ads.txt` that AdMob reads for all games.

- `games.json` — the list of games (add a game here; edit it right on GitHub).
- `site.json` — company, contact email and the **app-ads.txt lines**.
- `static/` — logo, icons and share image (copied into the site).
- `play/<slug>/` — a game that runs in the browser. The build copies it to `/<slug>/play/` and adds a **Play now** button. `play/aeloria/` is **Aeloria: Age of Crowns** — kingdom strategy across six realms: living city, 13 heroes, a 6-chapter story campaign with cutscenes, a procedural world map with fog of war, Royal Bazaar store, Season Road and VIP; saves in the browser. Painted art can replace any hero or enemy: see `play/aeloria/ART_BIBLE.md`. Live features (`live.js`): hero Forge and realm synergies, Arena of Crowns, weekly events with leaderboards, the Alliance World Boss, Founder's Pack, Royal Monthly Card, milestone packs, Royal Season track, city skins, comeback gifts and browser notifications.
  - **Payments:** real-money offers stay disabled until the app sets `window.AELORIA_PAYMENTS = { buy: productId => Promise<boolean> }` (StoreKit / Google Play Billing in the native wrapper). Product IDs: `founder`, `card`, `royal`, `pack5`, `pack10`, `pack15`, `legend` and the gem packs in `meta.js`.
  - **Rewarded ads:** buttons appear only when the app sets `window.AELORIA_ADS = { show: placement => Promise<boolean> }` (AdMob rewarded). Placements: `speed`, `vigor`, `arena`, `chest`; capped at 10 a day.
  - Progress is saved in the browser, so purchases must move to a server with receipt validation before real money is switched on.
- `icons/<slug>.png` — optional icon for a game's card and pages.
- `build.mjs` — builds `public/` (not stored on GitHub). Netlify runs it on every push (`netlify.toml`).
- `check.mjs` — `node check.mjs` checks every URL on the live domain.
- `GAME_PROMPTS.md` — one prompt per game project to switch its links to kinzhal.space.
- `public/urls.txt` — every game's four URLs for App Store Connect.

## Publish on Netlify
1. Put this folder in a GitHub repository (e.g. `KinzhalLTD/kinzhal-site`).
2. Netlify → Add new site → Import an existing project → GitHub → pick the repo. Build settings come from `netlify.toml`.
3. Domain management → Add a domain → `kinzhal.space` (Netlify adds `www` too).
4. DNS at your registrar: `@` → ALIAS/ANAME `apex-loadbalancer.netlify.com` (or A `75.2.60.5`), and `www` → CNAME `<your-site>.netlify.app`. Or switch the domain's nameservers to Netlify DNS.
5. HTTPS is issued automatically once DNS resolves.
