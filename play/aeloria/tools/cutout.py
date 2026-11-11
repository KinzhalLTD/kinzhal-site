#!/usr/bin/env python3
"""Cut painted figures out of Canva export sheets (flat navy background) with a soft matte.

Background = pixels connected to the sheet edge that are close to the navy backdrop colour.
Inside that region alpha ramps with colour distance, so glows, smoke and petals fade out
instead of being clipped; the navy is then removed from semi-transparent edge pixels
(colour decontamination) so no blue fringe shows over bright battlefields.
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

def cutout(im, lo=10, hi=46, core=20, band_px=5, height=None):
    a = np.asarray(im.convert('RGB')).astype(np.float32); h, w, _ = a.shape
    edge = np.concatenate([a[:3].reshape(-1, 3), a[-3:].reshape(-1, 3), a[:, :3].reshape(-1, 3), a[:, -3:].reshape(-1, 3)])
    bg = np.median(edge, 0); d = np.sqrt(((a - bg) ** 2).sum(2))
    # only colours very close to the backdrop and connected to the sheet edge count as background,
    # so dark costumes are never eaten; the soft fade is confined to a thin band around it
    near = d < core
    lab, n = ndimage.label(near); border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); border = border[border > 0]
    bgcore = np.isin(lab, border)
    # enclosed gaps (between an arm and the body) are backdrop too once they are big enough to be holes, not dark detail
    idx = range(1, n + 1); sizes = ndimage.sum(near, lab, idx); flat = ndimage.mean(d, lab, idx); spread = ndimage.standard_deviation(d, lab, idx)
    holes = np.nonzero((sizes > h * w * .0012) & (flat < 7) & (spread < 4.5))[0] + 1
    tight = d < core * .7; bgcore |= np.isin(lab, holes) & tight
    band = ndimage.binary_dilation(bgcore, iterations=band_px) & ~bgcore
    alpha = np.ones((h, w), np.float32); alpha[bgcore] = 0
    alpha[band] = np.clip((d[band] - lo) / (hi - lo), 0, 1) ** 1.2
    alpha = ndimage.grey_erosion(alpha, size=2)                 # pull the matte in by a pixel
    alpha = ndimage.gaussian_filter(alpha, .6)
    small = (alpha > .02) & (alpha < .98)                       # remove navy spill from soft pixels
    aa = np.maximum(alpha[..., None], .08)
    rgb = np.where(small[..., None], (a - bg * (1 - aa)) / aa, a); rgb = np.clip(rgb, 0, 255)
    # drop specks: keep only components that touch the main figure's footprint
    solid = alpha > .5; lab2, n2 = ndimage.label(solid)
    if n2 > 1:
        sizes = ndimage.sum(solid, lab2, range(1, n2 + 1)); keep = np.isin(lab2, np.nonzero(sizes > sizes.max() * .004)[0] + 1)
        near_keep = ndimage.binary_dilation(keep, iterations=12); alpha *= near_keep
    out = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), 'RGBA')
    bb = Image.fromarray((alpha > .04).astype(np.uint8) * 255).getbbox(); out = out.crop(bb)
    if height and out.height > height: out = out.resize((round(out.width * height / out.height), height), Image.LANCZOS)
    # final crispness for small on-screen sizes
    r, g, b, al = out.split(); rgb2 = Image.merge('RGB', (r, g, b)).filter(ImageFilter.UnsharpMask(1.2, 45, 2))
    return Image.merge('RGBA', (*rgb2.split(), al))
