# kinzhal.space — one website for every Kinzhal game (Netlify)

Each game gets `/slug/`, `/slug/privacy/`, `/slug/terms/`, `/slug/support/` (English + Arabic).
The root serves the studio home page and the one shared `app-ads.txt` that AdMob reads for all games.

- `games.json` — the list of games (add a game here; edit it right on GitHub).
- `site.json` — company, contact email and the **app-ads.txt lines**.
- `static/` — logo, icons and share image (copied into the site).
- `play/<slug>/` — a game that runs in the browser. The build copies it to `/<slug>/play/` and adds a **Play now** button. `play/rimal-realms/` is Rimal Realms (desert kingdom strategy: living city, troops, heroes with cinematic battles, world map, Grand Souq store, Season Road, VIP; saves in the browser). Real-money gem packs stay off until `window.RIMAL_PAYMENTS` is wired to a payment provider (see `meta.js`).
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
