#!/usr/bin/env python3
"""bake-pixel-sheet.py (2026-11-05): turn a soft 128 px sheet into a crisp pixel-art terrain tile.

mondo: "All pixel sprite 128x128 terrain tiles are supposed to have the same pixel density". The game's pixel
terrain tiles (moon, grass, rocks_5, ice ...) are 128x128 with a 24-colour palette, so every texel is a hard
edge. The liquid sheets are 128x128 too, but they are smooth paintings (3,000-6,000 colours), so the same 128 px
per square reads as a blur next to them. This keeps the sheet's own picture and pixel grid and makes it read like
the others: a light sharpen done on a 3x3 wrap (the tile stays seamless), then a 24-colour palette, no dither.

    python3 -I bake-pixel-sheet.py <in.png> <out.png> [--colors 24] [--sharpen 150] [--size 128]

--size N first box-averages a bigger sheet down to N x N (each output texel = the mean of its own block of the source),
so a 1024 px "pixel-look" painting (soft cells of mixed sizes) lands on the same one-texel grid as every 128 px tile.

Used for: terrain/crystal_blue.png (the Crystal Formation, from liquids/Liquid_Blue_05). Notes:
docs/notes/maps-terrain-battle.md "THE CRISP CRYSTAL SHEET".
THE ONE PIXEL GRID (2026-11-07): terrain/px/<name>.png = the 1024 px terrain sheets (grass_2, dirt, cave_floor, deep_water,
obsidian, forest_2, cloud_2, lava) baked with --size 128. Notes: maps-terrain-battle.md "THE ONE PIXEL GRID".
"""
import argparse
from PIL import Image, ImageFilter


def keep_details(tile, q, keep):
    """Median cut spends its colours on the big areas, so a few rare texels (a blue gem on a cave floor, a sprig on dirt)
    snap to the nearest brown. Add `keep` colours, one at a time, each the mean of the worst-fitting texels' colour group,
    then map every texel to its nearest palette colour."""
    import numpy as np
    src = np.asarray(tile, dtype=np.float32).reshape(-1, 3)
    pal = np.unique(np.asarray(q, dtype=np.float32).reshape(-1, 3), axis=0)
    for _ in range(keep):
        d = ((src[:, None, :] - pal[None, :, :]) ** 2).sum(-1)
        err = d.min(1)
        worst = src[err.argmax()]
        near = ((src - worst) ** 2).sum(1) < max(err.max() * 0.25, 1.0)
        pal = np.vstack([pal, src[near].mean(0)])
    for _ in range(4):   # a few k-means steps: every palette colour moves to the mean of the texels it holds (no hue drift)
        lab = ((src[:, None, :] - pal[None, :, :]) ** 2).sum(-1).argmin(1)
        for i in range(len(pal)):
            if (lab == i).any():
                pal[i] = src[lab == i].mean(0)
    d = ((src[:, None, :] - pal[None, :, :]) ** 2).sum(-1)
    out = pal[d.argmin(1)].round().clip(0, 255).astype(np.uint8).reshape(tile.size[1], tile.size[0], 3)
    return Image.fromarray(out, 'RGB')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('out')
    ap.add_argument('--colors', type=int, default=24)
    ap.add_argument('--sharpen', type=int, default=150, help='unsharp percent (0 = none)')
    ap.add_argument('--size', type=int, default=0, help='box-average down to N x N first (0 = keep the size)')
    ap.add_argument('--keep', type=int, default=0,
                    help='of the --colors, this many go to the texels the palette fits worst (a rare blue gem, a green sprig)')
    a = ap.parse_args()
    im = Image.open(a.src).convert('RGB')
    if a.size and im.size != (a.size, a.size):
        im = im.resize((a.size, a.size), Image.Resampling.BOX)
    w, h = im.size
    big = Image.new('RGB', (w * 3, h * 3))
    for i in range(3):
        for j in range(3):
            big.paste(im, (i * w, j * h))
    if a.sharpen:
        big = big.filter(ImageFilter.UnsharpMask(radius=1.2, percent=a.sharpen, threshold=0))
    tile = big.crop((w, h, 2 * w, 2 * h))
    q = tile.quantize(colors=a.colors - a.keep, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    if a.keep:
        q = keep_details(tile, q, a.keep)
    q.save(a.out, optimize=True)
    print(a.out, q.size, len(q.getcolors(1 << 16)), 'colours')


if __name__ == '__main__':
    main()
