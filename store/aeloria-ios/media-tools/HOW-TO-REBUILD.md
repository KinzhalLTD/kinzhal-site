# Rebuilding the App Store screenshots and previews

These are the scripts that made `Aeloria-AppStore-Media.zip`. They need Node, Playwright (Chromium), Python 3 with Pillow, and ffmpeg.

1. Serve the game: `cd play/aeloria && python3 -m http.server 8765`
2. Raw screens for every size and language (8 each): `cat runs.txt | xargs -P3 -L1 sh -c 'node shots3.cjs "$0" "$1" "$2" "$3" "$4"'`
   Then refresh the story screen with real, translated story lines: `cat runs.txt | xargs -P3 -L1 sh -c 'node storyshot.cjs "$0" "$1" "$2" "$3" "$4"'`
3. Captioned screenshots at exact sizes: `cat comp.txt | xargs -P3 -L1 sh -c 'node compose3.cjs "$0" "$1" "$2" "$3" "$4" "$5"'`
4. App previews, for example the Arabic iPhone one: `node rec3.cjs 443 960 ar frames && python3 encode.py frames out.mp4 886 1920`
   Use viewport 414×736 for the 1080×1920 preview and 900×1200 for 1200×1600.

The captions in five languages are in `compose3.cjs` (`CAP`). The upload guide is `README.txt`.
