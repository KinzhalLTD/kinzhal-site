# Aeloria: Age of Crowns — Soundtrack and Sound Brief

The game currently plays music and sound effects synthesised in code. Recorded files replace them **without code changes**:

1. Produce a track or effect from the brief below.
2. Export as described under *Delivery*, named exactly as listed.
3. Put music in `play/aeloria/art/music/` and effects in `play/aeloria/art/sfx/`.
4. List each file in `play/aeloria/art/manifest.json`:
```json
{
  "music": { "city": "music/city.mp3", "battle": "music/battle.mp3" },
  "sfx": { "win": "sfx/win.mp3", "coin": "sfx/coin.mp3" }
}
```
Music crossfades in automatically when the player changes screen. Anything not listed keeps the built-in sound.

## Musical identity
Aeloria is six realms united against one enemy, so the score is **one cinematic orchestra plus a featured soloist from each realm**:

| Realm | Featured colour |
|---|---|
| Greenhold | tin whistle, harp, warm horn section |
| Frostmark | hardanger fiddle, low male choir, frame drum |
| Amber Sultanate | oud, ney flute, darbuka and riq |
| Jade Dominion | guzheng, erhu, temple bells |
| Coral Isles | log drums, slide guitar, ocean-wave pads |
| Sunveldt | kora, djembe, call-and-response voices |
| Ashen Court (enemy) | distorted low brass, prepared piano, metallic hits |

**The main theme** is a five-note rising motif (think "a crown being lifted"). Every track quotes it at least once, so the game sounds like one world.

## Tracks
| Slot (`music/…`) | When it plays | Length | Tempo | Mood |
|---|---|---|---|---|
| `cine` | title screen, intro, story cutscenes | 2–3 min loop | 70 BPM | awe, longing, hope |
| `city` | city view | 3–4 min loop | 84 BPM | warm, busy, safe |
| `world` | world map | 3–4 min loop | 76 BPM | wide, curious, adventurous |
| `battle` | campaign and arena battles | 2 min loop | 120 BPM | driving, heroic |
| `boss` | boss stages (x-6) | 2 min loop | 128 BPM | menacing, epic |

Victory and defeat are short stingers delivered as sound effects (`sfx/win`, `sfx/loss`).

### Prompts for AI music tools
Use a tool whose plan allows commercial use, and keep the receipt. Instrumental only.

**cine (main theme)**
```
Epic cinematic fantasy orchestral theme, 70 BPM, D major with a minor-key bridge, soaring strings and French horns carrying a five-note rising heroic motif, solo oud and guzheng trading phrases in the middle, soft choir pads, slow build to a full orchestral swell then back to a gentle harp ending, seamless loop, instrumental, no vocals, film-score quality mixing
```
**city**
```
Warm medieval fantasy town music, 84 BPM, light orchestra with plucked strings, hand percussion and tin whistle, short oud and kora solos, cheerful and busy but calm enough to listen to for hours, a quiet quote of a heroic five-note motif, seamless loop, instrumental, no vocals
```
**world**
```
Adventurous fantasy exploration music, 76 BPM, wide string pads, low horns, hardanger fiddle melody, log drums and frame drum pulse, sense of a vast continent and open sky, builds gently and resolves, seamless loop, instrumental, no vocals
```
**battle**
```
Heroic fantasy battle music, 120 BPM, driving staccato strings, taiko and darbuka rhythm, brass stabs, choir hits on downbeats, the five-note heroic motif played by trumpets, energetic but not chaotic, seamless loop, instrumental, no vocals
```
**boss**
```
Dark epic boss battle music, 128 BPM, minor key, distorted low brass, pounding taiko and metallic percussion, dissonant choir, prepared piano ostinato, the heroic five-note motif fighting through in the final section, seamless loop, instrumental, no vocals
```

## Sound effects (`sfx/…`)
| Slot | Moment | Direction |
|---|---|---|
| `click` | any button | soft wooden tap, very short |
| `build` | start building or training | hammer on wood and stone, two hits |
| `done` | building, training or research finished | bright three-note harp and bell chime |
| `coin` | resources and gems collected | coins landing in a pouch, sparkle tail |
| `chest` | chest or reward opened | heavy wooden lid creak, then a magical shimmer |
| `horn` | army marches or battle starts | war horn, mid-length, slight hall reverb |
| `fanfare` | level up, big moments | short brass fanfare, 2 seconds |
| `win` | victory stinger | 4-second triumphant orchestral hit with choir |
| `loss` | defeat stinger | 3-second low strings falling, muted drum |
| `hit` | normal attack | sword impact on armour, punchy |
| `crit` | critical hit | heavier impact plus whoosh and metal ring |
| `arrow` | ranged attack | arrow whoosh and thud |
| `skill` | hero skill cut-in | magical swell and impact, 1 second |
| `legend` | legendary hero revealed | rising choir and bell burst, 2 seconds |
| `alarm` | enemy attack incoming | castle bell ringing three times |
| `whoosh` | screen transitions, cards | soft air swish |
| `tick` | story text typing | tiny quill scratch, very quiet |

## Delivery
- **Music:** MP3 at 192 kbps (or OGG at quality 6), 44.1 kHz stereo, around −16 LUFS integrated, peaks below −1 dBTP. Loops must be seamless: cut on a bar line and check the join.
- **Effects:** MP3 at 128 kbps, mono is fine, trimmed tight with no leading silence, around −14 LUFS short-term. Keep each under 3 seconds except stingers.
- Keep the whole set under 20 MB so the game loads fast on phones.
- Keep a licence record (tool or library, plan, date) for every file.
