#!/usr/bin/env python3
"""Art pipeline for Aeloria (run from play/aeloria: python3 tools/optimize_art.py).

1. Re-encodes every JPG/PNG named in art/manifest.json as WebP (smaller download, same look)
   and rewrites the manifest. UI frames referenced from CSS (art/ui) are left alone.
2. Once only, crispens the cut-out sprites (buildings, landmarks, soldiers, bar icons):
   light unsharp mask, a touch of saturation and a thin rim light along the silhouette,
   so they read clearly at small sizes without any runtime filter.
"""
import json, os, sys
from PIL import Image, ImageFilter, ImageEnhance, ImageChops

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'art')
MAN = os.path.join(ROOT, 'manifest.json')
SKIP_KINDS = {'music', 'sfx', 'loops', 'ui'}
SPRITES = {'buildings', 'landmark', 'army', 'nav'}
MARK = os.path.join(ROOT, '.enhanced')


def to_webp(path, alpha):
    im = Image.open(path)
    im = im.convert('RGBA' if alpha else 'RGB')
    out = os.path.splitext(path)[0] + '.webp'
    im.save(out, 'WEBP', quality=90 if alpha else 82, method=6)
    return out


def enhance(path):
    im = Image.open(path).convert('RGBA')
    r, g, b, a = im.split()
    rgb = Image.merge('RGB', (r, g, b))
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))
    rgb = ImageEnhance.Color(rgb).enhance(1.07)
    # rim light: the 2px band just inside the silhouette, strongest on the upper-left (the key light side)
    inner = a.filter(ImageFilter.MinFilter(5))
    band = ImageChops.subtract(a, inner)
    lit = ImageChops.subtract(a, ImageChops.offset(a, 2, 2))
    rim = ImageChops.multiply(band, lit).filter(ImageFilter.GaussianBlur(.6)).point(lambda v: int(v * .5))
    rgb = Image.composite(Image.new('RGB', im.size, (255, 244, 214)), rgb, rim)
    out = Image.merge('RGBA', (*rgb.split(), a))
    out.save(path, 'WEBP', quality=92, method=6)


def main():
    man = json.load(open(MAN))
    before = after = 0
    for kind, items in man.items():
        if kind in SKIP_KINDS or not isinstance(items, dict):
            continue
        for key, rel in list(items.items()):
            src = os.path.join(ROOT, rel)
            if not isinstance(rel, str) or not os.path.exists(src):
                continue
            ext = os.path.splitext(rel)[1].lower()
            if ext in ('.jpg', '.jpeg', '.png'):
                b0 = os.path.getsize(src)
                out = to_webp(src, ext == '.png')
                b1 = os.path.getsize(out)
                if b1 < b0:
                    os.remove(src)
                    items[key] = os.path.splitext(rel)[0] + '.webp'
                    before += b0; after += b1
                else:
                    os.remove(out)
    if not os.path.exists(MARK):
        n = 0
        for kind in SPRITES:
            for rel in man.get(kind, {}).values():
                p = os.path.join(ROOT, rel)
                if os.path.exists(p) and p.endswith('.webp'):
                    enhance(p); n += 1
        open(MARK, 'w').write('sprites crispened once by tools/optimize_art.py\n')
        print(f'crispened {n} sprites')
    json.dump(man, open(MAN, 'w'), indent=2)
    print(f're-encoded: {before / 1e6:.2f} MB -> {after / 1e6:.2f} MB')


if __name__ == '__main__':
    sys.exit(main())
