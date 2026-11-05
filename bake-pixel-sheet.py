#!/usr/bin/env python3
"""bake-pixel-sheet.py (2026-11-05): turn a soft 128 px sheet into a crisp pixel-art terrain tile.

mondo: "All pixel sprite 128x128 terrain tiles are supposed to have the same pixel density". The game's pixel
terrain tiles (moon, grass, rocks_5, ice ...) are 128x128 with a 24-colour palette, so every texel is a hard
edge. The liquid sheets are 128x128 too, but they are smooth paintings (3,000-6,000 colours), so the same 128 px
per square reads as a blur next to them. This keeps the sheet's own picture and pixel grid and makes it read like
the others: a light sharpen done on a 3x3 wrap (the tile stays seamless), then a 24-colour palette, no dither.

    python3 -I bake-pixel-sheet.py <in.png> <out.png> [--colors 24] [--sharpen 150]

Used for: terrain/crystal_blue.png (the Crystal Formation, from liquids/Liquid_Blue_05). Notes:
docs/notes/maps-terrain-battle.md "THE CRISP CRYSTAL SHEET".
"""
import argparse
from PIL import Image, ImageFilter


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('out')
    ap.add_argument('--colors', type=int, default=24)
    ap.add_argument('--sharpen', type=int, default=150, help='unsharp percent (0 = none)')
    a = ap.parse_args()
    im = Image.open(a.src).convert('RGB')
    w, h = im.size
    big = Image.new('RGB', (w * 3, h * 3))
    for i in range(3):
        for j in range(3):
            big.paste(im, (i * w, j * h))
    if a.sharpen:
        big = big.filter(ImageFilter.UnsharpMask(radius=1.2, percent=a.sharpen, threshold=0))
    tile = big.crop((w, h, 2 * w, 2 * h))
    q = tile.quantize(colors=a.colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    q.save(a.out, optimize=True)
    print(a.out, q.size, len(q.getcolors(1 << 16)), 'colours')


if __name__ == '__main__':
    main()
