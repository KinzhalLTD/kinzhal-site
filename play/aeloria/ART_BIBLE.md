# Aeloria: Age of Crowns — Art Bible and AI prompts

The game already ships with code-drawn art for every hero, enemy, building and the world map. Painted art replaces it **without code changes**:

1. Generate an image with the prompt below (Midjourney, DALL·E, Stable Diffusion, Leonardo, Firefly…).
2. Export it as a **square WebP, 512×512** (1024×1024 source is ideal), named exactly as listed.
3. Put it in `play/aeloria/art/heroes/`, `art/foes/` or `art/key/`.
4. Add it to `play/aeloria/art/manifest.json`, for example:
```json
{ "heroes": { "astrid": "heroes/astrid.webp" }, "foes": { "hollow": "foes/hollow.webp" }, "key": { "title": "key/title.webp" } }
```
Anything not listed keeps its code-drawn art, so you can replace images one at a time.

## Rights and store rules
- Use a generator whose terms let you use the output commercially, and keep the prompt and date for each file.
- Never prompt with the name of an existing game, studio, film or living artist. The prompts below describe the look in plain words on purpose.
- Review every image for hands, faces and accidental text before shipping. Apple and Google reject store screenshots with misleading art.

## Global style
- **Look:** painted high-fantasy character portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark.
- **Negative prompt (where supported):** text, letters, logo, watermark, signature, frame, border, extra fingers, deformed hands, blurry face, cropped head, multiple characters, modern clothing, photo, 3d render.
- **Framing:** head and shoulders, character centred, eyes on the upper third, weapon visible. Leave 6% padding on every side; the game rounds the corners.
- **Consistency:** generate one hero you like first, then reuse it as a style reference (`--sref`, image prompt or IP-Adapter) for all others. Keep the same light direction.
- **Diversity:** heroes come from six cultures. Keep skin tones, features and costumes respectful and specific, not stereotyped. Avoid sacred symbols.

## Realm palettes
| Realm | Mood | Key colours |
|---|---|---|
| Greenhold | Kingdom of Oak and Oath — Rolling meadows, ancient oaks and the knightly orders who swear by them. | #4f8a3c, #3d6fb3, #6f9a48 |
| Frostmark | Jarldoms of the Silent North — Fjords, longhouses and rune-carved stone beneath the aurora. | #5f8fbf, #8a3a2a, #d5e0ec |
| Amber Sultanate | Sultanates of Sun and Sand — Domed cities, caravans and oases strung across golden dunes. | #d9822b, #1c6f73, #dbb277 |
| Jade Dominion | Dominion of a Thousand Lanterns — Terraced mountains, bamboo forests and scholars of wind and silk. | #2f9c7a, #2a7a64, #7fa86a |
| Coral Isles | Free Isles of the Tidewalkers — Island chiefdoms of navigators, reef-singers and great outrigger fleets. | #1fb3c9, #b97a3e, #e6c98d |
| Sunveldt | Kingdoms of the Golden Savanna — Endless grasslands, lion riders and the forge-cities of the red earth. | #c9902b, #5a3418, #b99b4f |
| Ashen Court (enemies) | Corruption, embers and smoke | #2e2a33, #5a5560, #ff7a2a, #ffd36b |

## Heroes — `art/heroes/<id>.webp`
### Astrid Frostmane — Shieldmaiden of the North
- File: `heroes/astrid.webp` · Realm: Frostmark · rare Tank
- Story: Youngest jarl-daughter of Frostmark, who held the Hrim Pass for nine days with forty shields. She does not retreat; she advances in a different direction.
- **Prompt:** young Nordic shieldmaiden, fair skin, long golden braids, steel winged helm, blue-grey fur-trimmed armour, round painted shield and bearded axe, determined grin, snowy fjord behind, background tinted #5f8fbf, painted high-fantasy character portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark

### Sigrun Runeseer — Keeper of the Frozen Runes
- File: `heroes/sigrun.webp` · Realm: Frostmark · epic Mage
- Story: She has read the ice for seventy winters and remembers every name the Hollow King has stolen. The runes on her staff hum when ash is near.
- **Prompt:** elderly rune-seer woman, pale skin, flowing silver-white hair under a deep blue hood, glowing ice-blue eyes, staff carved with glowing frost runes, aurora sky behind, background tinted #5f8fbf, subtle magical glow, painted high-fantasy character portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark

### Sir Aldric Valebrand — Knight-Commander of the Oak
- File: `heroes/aldric.webp` · Realm: Greenhold · rare Warrior
- Story: Last knight of the burned Valewood order. He carries his grandmother's blade and a promise: no village will burn while he still stands.
- **Prompt:** Black knight-commander in his forties, dark brown skin, short black hair and neat beard, polished steel plate with blue and gold oak-leaf tabard, longsword, burning forest behind him, background tinted #4f8a3c, painted high-fantasy character portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark

### Elowen Thornwhisper — Druid of the Old Oaks
- File: `heroes/elowen.webp` · Realm: Greenhold · rare Support
- Story: Raised by the oldest oak in Greenhold, Elowen speaks to roots and rain. She is gentle with everyone except those who set forests on fire.
- **Prompt:** young druid woman, freckled fair skin, long wavy copper-red hair, wreath of oak leaves and tiny pink flowers, green robes, living branch staff with glowing seed, ancient oaks behind, background tinted #4f8a3c, painted high-fantasy character portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark

### Rania Sunarrow — Archer of the Amber Dunes
- File: `heroes/rania.webp` · Realm: Amber Sultanate · rare Ranged
- Story: A caravan guard who can split a date at three hundred paces. She joined you because the Ashen Court stole her caravan, and she wants every camel back.
- **Prompt:** young desert archer woman, warm brown skin, teal headscarf over dark hair, crimson and gold leather armour, recurve bow drawn, golden dunes and a caravan at sunset behind, background tinted #d9822b, painted high-fantasy character portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark

### Layla Nightveil — The Kinzhal Blade
- File: `heroes/layla.webp` · Realm: Amber Sultanate · epic Assassin
- Story: Nobody knows her real name. The Sultanate's enemies know only her twin daggers, and the silence they leave behind.
- **Prompt:** mysterious assassin woman, olive-brown skin, dark violet hood and face mask, only golden eyes visible, twin curved daggers, moonlit domed rooftops behind, background tinted #d9822b, subtle magical glow, painted high-fantasy character portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark

### Emira Saqr — The Falcon Queen
- File: `heroes/saqr.webp` · Realm: Amber Sultanate · legendary Mage
- Story: Sovereign of the Amber Sultanate, who rides the wind with a thousand falcons. She once wore a shard of the Sunspire Crown, and she wants it back.
- **Prompt:** regal queen of a desert sultanate, brown skin, long black hair, ornate golden crown with ruby, purple and gold royal robes, a golden falcon on her arm, swirling falcons and sunset behind, background tinted #d9822b, radiant golden aura, heroic low angle, painted high-fantasy character portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark

### Lian Jadewind — Sage of the Thousand Petals
- File: `heroes/lian.webp` · Realm: Jade Dominion · legendary Mage
- Story: The youngest Grand Sage in the Dominion's history. With one folded fan she can turn a typhoon, or an argument.
- **Prompt:** young East Asian grand sage woman, black hair in an elegant bun with jade hairpins, flowing jade-green and cream silk robes, folding fan raised, cherry blossom petals swirling in wind, misty terraced mountains behind, background tinted #2f9c7a, radiant golden aura, heroic low angle, painted high-fantasy character portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark

### Hiro Ironpetal — Blade of the Lantern Guard
- File: `heroes/hiro.webp` · Realm: Jade Dominion · epic Warrior
- Story: Captain of the Lantern Guard, sworn to protect the Jade Court. He paints a cherry blossom on his armour for every life he saves.
- **Prompt:** East Asian lantern guard captain, black hair in a topknot, crimson lamellar armour with painted cherry blossoms, long single-edged blade, glowing paper lanterns in mist behind, background tinted #2f9c7a, subtle magical glow, painted high-fantasy character portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark

### Kaimana Tidecaller — Navigator of the Coral Isles
- File: `heroes/kaimana.webp` · Realm: Coral Isles · rare Support
- Story: She steers by stars and swells and has never lost a ship. When she sings, the sea itself seems to listen.
- **Prompt:** Polynesian navigator woman, brown skin, big curly black hair with a red hibiscus flower, shell necklace, turquoise wrap, coral trident, ocean waves and stars behind, background tinted #1fb3c9, painted high-fantasy character portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark

### Tama Reefbreaker — Guardian of the Outer Reef
- File: `heroes/tama.webp` · Realm: Coral Isles · rare Tank
- Story: The strongest man on any island, and the gentlest. His tattoos tell the story of every storm he has stood against.
- **Prompt:** huge Polynesian guardian man, brown skin, black hair tied back, beard, traditional tattoo patterns on arms and chest, coral war club, gentle smile, crashing reef surf behind, background tinted #1fb3c9, painted high-fantasy character portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark

### Amara Sunforge — Artificer of the Red Earth
- File: `heroes/amara.webp` · Realm: Sunveldt · epic Engineer
- Story: Master of the great forges of Sunveldt. Her inventions are loud, brilliant and only occasionally on fire.
- **Prompt:** West African inventor woman, deep brown skin, voluminous natural afro with brass goggles, orange leather apron and gold-trim armour, brass hand cannon, red-earth forge city behind, background tinted #c9902b, subtle magical glow, painted high-fantasy character portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark

### Kofi Swiftmane — Lion Rider of Sunveldt
- File: `heroes/kofi.webp` · Realm: Sunveldt · rare Warrior
- Story: He raised his lion, Zuri, from a cub. Together they have outrun wildfire, warbands and, once, an entire Ashen legion.
- **Prompt:** East African lion rider man, deep brown skin, long locs, short beard, gold-trimmed savanna leather armour, spear, a great maned lion beside him, golden savanna and acacia trees behind, background tinted #c9902b, painted high-fantasy character portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark

## Enemies — `art/foes/<kind>.webp`
- **Ash Ghoul** (`foes/ghoul.webp`): ash ghoul, hunched grey humanoid made of ash and cinders, glowing orange ember eyes, cracked skin with lava glow, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark
- **Cinder Hound** (`foes/hound.webp`): cinder hound, wolf-like beast of charcoal with glowing ember cracks, smoking jaws, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark
- **Ashsworn Raider** (`foes/raider.webp`): ashsworn raider, bandit soldier with ash-grey mask and dark armour, red glowing eyes, notched sword, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark
- **Dune Stalker** (`foes/stalker.webp`): dune stalker, giant armoured desert scorpion corrupted by ash, ember-tipped stinger, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark
- **Ember Wraith** (`foes/wraith.webp`): ember wraith, floating flame spirit in tattered dark robes, crown of fire, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark
- **Frost Troll** (`foes/troll.webp`): frost troll, huge pale-blue troll with icicle tusks and ash-stained fur, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark
- **Lantern Phantom** (`foes/phantom.webp`): lantern phantom, haunted red paper lantern with a ghostly face, trailing smoke, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark
- **Tide Serpent** (`foes/serpent.webp`): tide serpent, teal sea serpent with golden fins and ember eyes rising from waves, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark
- **Slag Golem** (`foes/golem.webp`): slag golem, hulking construct of black rock and molten lava seams, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark
- **Cinder Warlord** (`foes/warlord.webp`): Grask the Cinder Warlord, massive armoured brute with horned helm, ember-cracked armour, huge cleaver, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark
- **Queen of Mirages** (`foes/queen.webp`): the Queen of Mirages, ethereal veiled sorceress shimmering with mirror shards, violet light, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark
- **Ashbound Wyrm** (`foes/wyrm.webp`): Hrimfang the Ashbound Wyrm, white frost dragon bound in ash-black chains, pained glowing eyes, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark
- **Lantern-Smoke Lord** (`foes/lantern.webp`): the Lantern-Smoke Lord, tall robed figure with a giant glowing lantern for a head, smoke swirling, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark
- **Cinder Leviathan** (`foes/kraken.webp`): the Cinder Leviathan, colossal kraken with a single burning eye, ember-lit tentacles from a dark sea, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark
- **The Hollow King** (`foes/hollow.webp`): the Hollow King, gaunt crowned figure in black robes, cracked dark crown, empty eye sockets with violet light, ash drifting, dark smoky background with drifting embers, menacing but readable at small size, painted high-fantasy creature portrait, semi-realistic stylised proportions, rich painterly brushwork, dramatic rim lighting, warm key light from upper left, cinematic depth of field, clean readable silhouette, premium mobile strategy game splash art quality, highly detailed costume, no text, no logo, no watermark

## Key art — `art/key/`
- **title.webp** (1920×1080, shown behind the title screen): the golden Sunspire tower at dawn in the centre of a vast fantasy continent; snowy northern mountains, green oak forests, golden dunes, jade terraced hills, turquoise islands and a savanna all visible around it; banners of six realms; dramatic sky; epic scale, painterly, no text.
- **Store icon** (1024×1024): a golden crown over a radiant sun on a navy shield, bold silhouette, readable at 64 px, no text.
- **Store screenshots:** take them from the game itself after the painted heroes are in.

## Chapters and bosses (for loading screens or trailers)
1. **Ash in the Valewood** — Greenhold; boss: Grask the Cinder Warlord.
2. **The Mirage Road** — Amber Sultanate; boss: The Queen of Mirages.
3. **The Silent Fjords** — Frostmark; boss: Hrimfang, the Ashbound Wyrm.
4. **Lanterns in the Mist** — Jade Dominion; boss: The Lantern-Smoke Lord.
5. **Tides of Cinder** — Coral Isles; boss: The Cinder Leviathan.
6. **The Hollow Throne** — the Sunspire; boss: The Hollow King.
