# Aeloria: Age of Crowns — Art Bible and AI prompts

The game already ships with code-drawn art for every hero, enemy, building and map. Painted or rendered art replaces it **without code changes**:

1. Generate an image with a prompt below (Midjourney, DALL·E, Stable Diffusion, Leonardo, Firefly…).
2. Export at the listed size as **WebP**, named exactly as listed.
3. Put it in `play/aeloria/art/heroes/`, `art/foes/` or `art/key/`.
4. List it in `play/aeloria/art/manifest.json`, for example:
```json
{
  "heroes": { "astrid": "heroes/astrid.webp" },
  "foes": { "hollow": "foes/hollow.webp" },
  "key": { "title": "key/title.webp", "chapter1": "key/chapter1.webp" }
}
```
Anything not listed keeps its code-drawn art, so you can replace images one at a time.

| Slot | Used for | Size |
|---|---|---|
| `heroes/<id>.webp` | hero portraits everywhere (cards, battle, story) | 1024×1024 → export 512×512 |
| `foes/<kind>.webp` | enemy portraits in battle and story | 1024×1024 → export 512×512 |
| `key/chapter1.webp` … `chapter6.webp` | battle and story backgrounds | 2560×1440, keep the centre clear |
| `key/title.webp` | title screen | 2560×1440 |

## Prompt structure
Every prompt below follows the same order, so results stay consistent:

```
[Subject + specific details], [Environment + atmosphere],
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
[precise lighting description],
[camera: lens + angle + DOF],
highly detailed PBR materials, subsurface scattering on skin, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

**Negative prompt** (where supported): blurry, over-smoothed, plastic skin, cartoon, anime, low detail, flat lighting, overexposed, text, watermark, logo, signature, frame, deformed hands, extra fingers, cropped head, multiple characters, modern clothing.

### Rules that keep the set consistent
- **Make one reference first.** Generate Astrid until she is right, then use her as the image/style reference (`--sref` in Midjourney, image prompt or IP-Adapter elsewhere) for every other hero, with the same technical tags.
- **Be precise about light.** Each prompt names the key, fill and rim source and their colours. Keep that wording; it matters more than any other part.
- **Same camera for every portrait:** 85mm portrait lens, eye level, head-and-shoulders framing centred with headroom, shallow depth of field f/2, background softly blurred. Portraits are cropped square and shown small, so the face must sit in the upper-middle third.
- **Don't name existing games, studios, films or living artists.** "Unreal Engine 5" and "Lumen" describe a rendering look and are fine.
- **Check every image** for hands, faces, extra limbs and accidental text before shipping. Keep each prompt, seed and date for your records, and use a generator whose terms allow commercial use.
- **Respect cultures.** Heroes come from six cultures; keep features, skin tones and costumes specific and respectful, never caricatured, and avoid sacred symbols.

### Matching the rest of the game
Photoreal portraits next to the code-drawn city and map will look mixed. For a fully consistent AAA look, also produce the six chapter backgrounds below, and plan a later pass on city buildings and the world map in the same style.

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
File `heroes/astrid.webp` · Frostmark · rare Tank

```
Young Nordic shieldmaiden, fair weathered skin with cold-flushed cheeks, long golden braids threaded with iron rings, steel winged helm with hammered rivets, blue-grey wool and wolf-fur mantle, round painted linden shield with iron boss, bearded axe on her shoulder, fierce confident grin,
snowy fjord cliff at dawn, drifting snowflakes, distant longhouses with chimney smoke,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
cold blue dawn key light from upper left, warm amber rim light from a distant bonfire, soft snow-scattered fill, breath vapour catching the light,
85mm portrait lens, eye level, head-and-shoulders framing centred with headroom, shallow depth of field f/2, background softly blurred,
highly detailed PBR materials, subsurface scattering on skin, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Sigrun Runeseer — Keeper of the Frozen Runes
File `heroes/sigrun.webp` · Frostmark · epic Mage

```
Elderly rune-seer woman, pale lined skin, long silver-white hair under a deep indigo wool hood, eyes glowing faint ice-blue, carved birch staff with runes glowing cyan, bone and silver amulets,
frozen standing stones under a green aurora, light snowfall, mist hugging the ground,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
cool aurora light from above, cyan glow from the rune staff lighting her face from below, deep blue shadows, faint god rays through mist,
85mm portrait lens, eye level, head-and-shoulders framing centred with headroom, shallow depth of field f/2, background softly blurred,
highly detailed PBR materials, subsurface scattering on skin, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Sir Aldric Valebrand — Knight-Commander of the Oak
File `heroes/aldric.webp` · Greenhold · rare Warrior

```
Black knight-commander in his forties, dark brown skin, short black hair, neatly trimmed beard with grey at the chin, polished steel plate armour with dents and scratches, blue tabard embroidered with a golden oak leaf, longsword held upright,
edge of a burning oak forest, embers and ash drifting, smoke columns behind,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
warm orange firelight key from the right, cool overcast daylight fill from the left, glinting ray-traced specular highlights on steel, embers backlighting the silhouette,
85mm portrait lens, eye level, head-and-shoulders framing centred with headroom, shallow depth of field f/2, background softly blurred,
highly detailed PBR materials, subsurface scattering on skin, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Elowen Thornwhisper — Druid of the Old Oaks
File `heroes/elowen.webp` · Greenhold · rare Support

```
Young druid woman, freckled fair skin, long wavy copper-red hair, wreath of oak leaves and tiny pink blossoms, moss-green linen robes with gold embroidery, living branch staff sprouting leaves with a glowing seed,
ancient oak grove with moss-covered roots, floating pollen and fireflies,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
soft late-afternoon sunlight filtering through leaves as volumetric god rays, warm green bounce light, golden glow from the seed on her face,
85mm portrait lens, eye level, head-and-shoulders framing centred with headroom, shallow depth of field f/2, background softly blurred,
highly detailed PBR materials, subsurface scattering on skin, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Rania Sunarrow — Archer of the Amber Dunes
File `heroes/rania.webp` · Amber Sultanate · rare Ranged

```
Young desert archer woman, warm brown skin, teal headscarf over dark hair, crimson and gold tooled leather armour, recurve bow drawn with a fletched arrow, kohl-lined focused eyes,
golden dunes at sunset with a camel caravan silhouetted on the ridge, blowing sand,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
low golden-hour sun as warm key from the left, hot orange rim light, sand particles glowing in the backlight, gentle sky-blue fill,
85mm portrait lens, eye level, head-and-shoulders framing centred with headroom, shallow depth of field f/2, background softly blurred,
highly detailed PBR materials, subsurface scattering on skin, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Layla Nightveil — The Kinzhal Blade
File `heroes/layla.webp` · Amber Sultanate · epic Assassin

```
Mysterious assassin woman, olive-brown skin, dark violet hood and fine silk face mask, only golden eyes visible, twin curved daggers with engraved blades, layered dark leather with silver clasps,
moonlit domed rooftops of a desert city, lanterns far below, thin haze,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
cold silver moonlight key from above, warm lantern bounce from below, eyes catching a small specular highlight, deep velvet shadows,
85mm portrait lens, eye level, head-and-shoulders framing centred with headroom, shallow depth of field f/2, background softly blurred,
highly detailed PBR materials, subsurface scattering on skin, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Emira Saqr — The Falcon Queen
File `heroes/saqr.webp` · Amber Sultanate · legendary Mage

```
Regal queen of a desert sultanate, brown skin, long black hair, ornate gold crown set with rubies and turquoise, purple and gold brocade robes, a golden falcon perched on her gloved arm, calm commanding gaze, radiant heroic presence,
palace balcony above a sunset desert city, a flock of falcons circling, warm dust in the air,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
rich golden sunset key light from behind-left, warm bounce from gold fabric, luminous rim light on the falcon feathers, subtle volumetric haze,
85mm portrait lens, eye level, head-and-shoulders framing centred with headroom, shallow depth of field f/2, background softly blurred,
highly detailed PBR materials, subsurface scattering on skin, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Lian Jadewind — Sage of the Thousand Petals
File `heroes/lian.webp` · Jade Dominion · legendary Mage

```
Young East Asian grand sage woman, black hair in an elegant bun with jade hairpins, flowing jade-green and cream silk robes with embroidered cranes, folding paper fan raised, serene smile, radiant heroic presence,
misty terraced mountains with a pagoda, cherry blossom petals swirling in the wind,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
soft diffused morning light through mist, pale pink bounce from blossoms, jade glow on silk, gentle volumetric light shafts,
85mm portrait lens, eye level, head-and-shoulders framing centred with headroom, shallow depth of field f/2, background softly blurred,
highly detailed PBR materials, subsurface scattering on skin, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Hiro Ironpetal — Blade of the Lantern Guard
File `heroes/hiro.webp` · Jade Dominion · epic Warrior

```
East Asian lantern guard captain, black hair in a topknot, strong jaw, crimson lamellar armour laced with silk cords and painted with cherry blossoms, long single-edged blade half drawn,
night street of paper lanterns in drifting fog, wet stone underfoot,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
warm red-orange lantern light from several sides, cool blue moon rim light, ray-traced reflections in wet stone, glow on the blade edge,
85mm portrait lens, eye level, head-and-shoulders framing centred with headroom, shallow depth of field f/2, background softly blurred,
highly detailed PBR materials, subsurface scattering on skin, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Kaimana Tidecaller — Navigator of the Coral Isles
File `heroes/kaimana.webp` · Coral Isles · rare Support

```
Polynesian navigator woman, warm brown skin, big curly black hair with a red hibiscus flower, shell and bone necklace, turquoise tapa-patterned wrap, coral trident, warm determined smile,
deck of a double-hulled voyaging canoe at twilight, ocean swells, the first stars appearing,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
warm twilight sky key light, teal ocean bounce from below, soft starlight rim, sea spray catching light,
85mm portrait lens, eye level, head-and-shoulders framing centred with headroom, shallow depth of field f/2, background softly blurred,
highly detailed PBR materials, subsurface scattering on skin, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Tama Reefbreaker — Guardian of the Outer Reef
File `heroes/tama.webp` · Coral Isles · rare Tank

```
Huge Polynesian guardian man, brown skin, black hair tied back, thick beard, traditional tattoo patterns across shoulders and chest, coral-studded war club, gentle steady smile,
reef shoreline with crashing surf and wet black volcanic rock,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
bright tropical midday sun as hard key, turquoise water bounce, glistening wet skin with subsurface scattering, spray backlit as volumetric mist,
85mm portrait lens, eye level, head-and-shoulders framing centred with headroom, shallow depth of field f/2, background softly blurred,
highly detailed PBR materials, subsurface scattering on skin, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Amara Sunforge — Artificer of the Red Earth
File `heroes/amara.webp` · Sunveldt · epic Engineer

```
West African inventor woman, deep brown skin, voluminous natural afro held by brass goggles, orange leather apron over gold-trimmed armour, brass hand cannon with glowing vents, confident grin,
red-earth forge city with smoking chimneys, sparks raining from a foundry,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange forge glow key from below-right, cool daylight fill from above, sparks as bokeh, brass with ray-traced specular highlights,
85mm portrait lens, eye level, head-and-shoulders framing centred with headroom, shallow depth of field f/2, background softly blurred,
highly detailed PBR materials, subsurface scattering on skin, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Kofi Swiftmane — Lion Rider of Sunveldt
File `heroes/kofi.webp` · Sunveldt · rare Warrior

```
East African lion rider man, deep brown skin, long locs tied back, short beard, gold-trimmed savanna leather armour, long spear, a great maned lion beside him,
golden savanna with acacia trees and a dust storm on the horizon,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
low warm sunset key from the side, long shadows, golden rim light through the lion's mane, dust particles glowing in volumetric light,
85mm portrait lens, eye level, head-and-shoulders framing centred with headroom, shallow depth of field f/2, background softly blurred,
highly detailed PBR materials, subsurface scattering on skin, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

## Enemies — `art/foes/<kind>.webp`
Shared environment, lighting and camera for all enemies: *dark scorched battlefield, drifting embers and smoke, ash falling like snow*; *hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette*; *50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field*.

### Ash Ghoul
File `foes/ghoul.webp`

```
Ash ghoul, hunched gaunt humanoid made of compacted ash and cinders, cracked grey skin with glowing orange lava veins, ember eyes, ragged burnt cloth,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Cinder Hound
File `foes/hound.webp`

```
Cinder hound, wolf-sized beast of charcoal with glowing ember cracks along the spine, smoking jaws and sparks dripping from its teeth,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Ashsworn Raider
File `foes/raider.webp`

```
Ashsworn raider, bandit soldier in scorched leather and ash-grey cloth mask, red glowing eyes, notched sword, burnt banner on his back,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Dune Stalker
File `foes/stalker.webp`

```
Dune stalker, giant armoured desert scorpion corrupted by ash, cracked carapace with molten seams, ember-tipped stinger raised,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Ember Wraith
File `foes/wraith.webp`

```
Ember wraith, floating spirit in tattered black robes with a crown of living fire, face hidden in shadow except for burning eyes,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Frost Troll
File `foes/troll.webp`

```
Frost troll, huge pale-blue troll with icicle tusks, matted ash-stained white fur, frost crystals on the skin,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Lantern Phantom
File `foes/phantom.webp`

```
Lantern phantom, a haunted red paper lantern with a ghostly face inside, trailing coils of grey smoke,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Tide Serpent
File `foes/serpent.webp`

```
Tide serpent, teal sea serpent with golden fins and ember eyes, rising from black waves with water streaming off its scales,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Slag Golem
File `foes/golem.webp`

```
Slag golem, hulking construct of black volcanic rock held together by molten lava seams, glowing core in its chest,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Cinder Warlord
File `foes/warlord.webp`

```
Grask the Cinder Warlord, massive armoured brute with a horned helm, ember-cracked black plate, a huge cleaver glowing red at the edge,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Queen of Mirages
File `foes/queen.webp`

```
The Queen of Mirages, ethereal veiled sorceress shimmering with floating mirror shards, half-transparent violet silks,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Ashbound Wyrm
File `foes/wyrm.webp`

```
Hrimfang the Ashbound Wyrm, white frost dragon bound in ash-black chains, pained glowing eyes, frost breath leaking between its teeth,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Lantern-Smoke Lord
File `foes/lantern.webp`

```
The Lantern-Smoke Lord, tall robed figure with a giant glowing paper lantern for a head, smoke swirling around his sleeves,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Cinder Leviathan
File `foes/kraken.webp`

```
The Cinder Leviathan, colossal kraken with a single burning eye, ember-lit tentacles rising from a dark stormy sea,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### The Hollow King
File `foes/hollow.webp`

```
The Hollow King, gaunt crowned figure in tattered black robes, cracked dark-gold crown, empty eye sockets glowing violet, ash drifting from his fingers,
dark scorched battlefield, drifting embers and smoke, ash falling like snow,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
hot orange ember light from below as key, cold blue-grey moonlight rim from behind, volumetric smoke catching the light, high-contrast menacing silhouette,
50mm lens, slight low angle, subject centred and filling most of the frame, shallow depth of field,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

## Chapter backgrounds — `art/key/chapter<N>.webp`
Battles and story cutscenes draw characters over the centre, so keep the middle third calm and put detail at the edges and horizon.

### Chapter 1 · Ash in the Valewood
File `key/chapter1.webp` (2560×1440)

```
Ancient oak forest of Greenhold half-consumed by spreading grey ash, a ruined knightly chapel among the trees, embers floating, no characters,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
late afternoon sun through smoke as volumetric god rays, warm firelight on the right, cool green shadow on the left,
24mm wide lens, eye level, deep focus with strong depth layering, empty open ground in the centre of the frame,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Chapter 2 · The Mirage Road
File `key/chapter2.webp` (2560×1440)

```
Vast golden desert with a shimmering false oasis and a broken caravan road, distant domed city on the horizon, no characters,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
harsh setting sun low on the horizon, heat-haze mirage, long violet shadows across the dunes,
24mm wide lens, eye level, deep focus with strong depth layering, empty open ground in the centre of the frame,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Chapter 3 · The Silent Fjords
File `key/chapter3.webp` (2560×1440)

```
Frozen fjord with silent longhouses and a colossal chained dragon skeleton in the ice, grey ash mixed with snowfall, no characters,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
cold blue overcast light, green aurora breaking through clouds, lantern glow from one longhouse window,
24mm wide lens, eye level, deep focus with strong depth layering, empty open ground in the centre of the frame,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Chapter 4 · Lanterns in the Mist
File `key/chapter4.webp` (2560×1440)

```
Misty mountain city of the Jade Dominion with terraced rooftops and thousands of floating paper lanterns, smoke creeping through the streets, no characters,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
soft dusk light, warm red lantern glow everywhere, pale cyan mist with volumetric light shafts,
24mm wide lens, eye level, deep focus with strong depth layering, empty open ground in the centre of the frame,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Chapter 5 · Tides of Cinder
File `key/chapter5.webp` (2560×1440)

```
Tropical island archipelago with a coral reef and outrigger canoes, a dark storm with ember-lit clouds rolling over the sea, no characters,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
stormy twilight, orange glow under the clouds, lightning rim light, turquoise water lit from below,
24mm wide lens, eye level, deep focus with strong depth layering, empty open ground in the centre of the frame,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

### Chapter 6 · The Hollow Throne
File `key/chapter6.webp` (2560×1440)

```
The Sunspire, a colossal golden tower at the heart of the continent, its plaza covered in ash, a throne of cracked gold at the top of vast stairs, no characters,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
dramatic dusk with violet and crimson sky, a single beam of golden light breaking through onto the throne, heavy volumetric dust,
24mm wide lens, eye level, deep focus with strong depth layering, empty open ground in the centre of the frame,
highly detailed PBR materials, realistic wear and micro-details, 8K, ultra sharp, cinematic color grading
```

## Title screen — `art/key/title.webp`
```
The golden Sunspire tower rising from the centre of a vast fantasy continent, snowy northern mountains, green oak forests, golden dunes, jade terraced hills, turquoise islands and a savanna all visible around it, six realm banners on the plaza below, no text,
photorealistic AAA game graphics, Unreal Engine 5 cinematic render, Lumen global illumination, Nanite geometry, ray-traced reflections and shadows, volumetric lighting,
sunrise breaking behind the tower as the key light, golden god rays fanning across the land, cool blue shadows in the valleys, atmospheric haze for depth,
24mm wide lens, slight low angle, deep focus, epic scale,
highly detailed PBR materials, 8K, ultra sharp, cinematic color grading
```

## Store icon (1024×1024)
```
A golden crown above a radiant sun on a navy-blue heraldic shield, polished gold with fine engraving and small rubies, centred bold silhouette readable at 64 px, no text,
photorealistic AAA game asset, Unreal Engine 5, ray-traced specular highlights,
studio three-point lighting with soft warm key and cool rim, dark purple gradient background,
85mm lens, straight-on, everything in focus,
highly detailed PBR materials, 8K, ultra sharp
```

## Extra art slots (manifest keys)
Beyond `heroes`, `foes`, `key` and `buildings`, the manifest also accepts:

| Key | Ids | Used for |
|---|---|---|
| `map` | `camp`, `throne`, `grain`, `timber`, `stonepit`, `ore` (round markers); `village`, `trees`, `herbs`, `shrine` (transparent scenery sprites) | world map |
| `ground` | `grass`, `sand`, `snow`, `stone` (seamless tiles) | 3D city terrain and courtyard |
| `ui` | `button`, `frame`, `tab`, `plaque` (transparent, cropped tight) | gold buttons, building frame, tab bar, resource counters |
| `fx` | `fire`, `rune`, `slash`, `rays` (on black, blended additively) | hero skill effects in battle |
| `troops` | `inf`, `rng`, `cav`, `sie` | troop icons everywhere |
| `key` | `title`, `epic` | title screen, story cutscene backdrop |
