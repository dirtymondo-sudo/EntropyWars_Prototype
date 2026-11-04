#!/usr/bin/env python3
"""bake-creator-icons.py (2026-11-04) - THE CREATOR ICONS: cuts the character creator's tab + body-part icons out of
SunGraphica's Minimal Game Icons Pack (mondo's own copy of the full pack, itch.io sungraphica/minimal-game-icons-pack).

  python3 -I bake-creator-icons.py <the pack: "Minimal icons.zip" or its unzipped "600 Minimal icons" folder> <out dir>
  then: node sync-zip.js --put <out>/<key>.png Assets/Icons/creator/<key>.png  (one pair per icon)

Each icon: the pack's white "PNG Light" silhouette (the largest size it ships), trimmed to its drawing, centred on a square
with a small margin, 128 x 128, white + its own alpha (the game draws it as a CSS mask in the button's text colour:
party-builder.js CC_ICONS / ccIcon, styles-base.css .pb-cc-icon). The pack's files never go in the repo (licence: no
redistribution of the original files); only these 15 cut icons go to R2. Credit: data.js EW_CREDITS (SunGraphica).
Notes: docs/notes/character-creator.md "THE CREATOR ICONS".
"""
import os
import sys
import zipfile
import tempfile
from PIL import Image, ImageOps, ImageChops

SIZE = 128
MARGIN = 0.06   # of the square, each side

# key (R2 Assets/Icons/creator/<key>.png) -> (the pack's folder under "PNG Light", the file's name without " 512 px" / ".png", mirror)
ICONS = {
    # THE TABS
    'tab_body':   ('Icon set 3', 'Human', False),          # a standing person
    'tab_face':   ('Emoji', 'relax', False),               # a face: brows, eyes, mouth
    'tab_skin':   ('Icon set 2', 'Drop', False),           # a colour drop (skin colour + skins)
    'tab_hair':   ('Icon set 3', 'Head full', False),      # a head's silhouette (the pack has no comb / hair icon)
    'tab_outfit': ('Icon set 2', 'T shirt', False),        # clothes
    # THE BODY SLOTS (OUTFIT)
    'slot_head':  ('Icon set 2', 'Hat', False),            # Hats + helmets, creature heads, horns, ears, headsets
    'slot_face':  ('Set 4 (New Update)', 'mask 2', False), # Glasses + goggles, masks + hoods
    'slot_neck':  ('Icon set 2', 'Necklece', False),       # Ties + neckwear, pendants
    'slot_torso': ('Icon set 2', 'Armor', False),          # Layers 1 2 3, dresses, suits, underwear, armour ...
    'slot_back':  ('Icon set 2', 'Bag', False),            # a backpack: capes, wings, back gear, tails
    'slot_larm':  ('Icon set 2', 'Glove', True),           # the right arm's glove, mirrored
    'slot_rarm':  ('Icon set 2', 'Glove', False),          # In the hand, weapons, bags, gloves, nails, sleeves, arm armour
    'slot_waist': ('Icon set 2', 'Bag2', False),           # a pouch: belts, on the hip
    'slot_legs':  ('Icon set 2', 'Pants', False),          # Bottoms, skirts, socks, holsters + greaves
    'slot_feet':  ('Icon set 2', 'Shoe_', False),          # a boot: shoes + boots, hooves, toenails
}


def pack_root(src):
    """the folder that holds "PNG Light" (unzips a zip into a temp folder first)"""
    if zipfile.is_zipfile(src):
        tmp = tempfile.mkdtemp(prefix='ew_icons_')
        with zipfile.ZipFile(src) as z:
            for n in z.namelist():   # only the light PNGs: nothing else is read
                if '/PNG Light/' in n and n.lower().endswith('.png') and '..' not in n:
                    z.extract(n, tmp)
        src = tmp
    for dp, dn, fn in os.walk(src):
        if os.path.basename(dp) == 'PNG Light':
            return dp
    sys.exit('no "PNG Light" folder in ' + src)


def find(light, folder, name):
    """the largest copy of <folder>/<size>/<name>[ 512 px].png"""
    best = None
    for dp, dn, fn in os.walk(os.path.join(light, folder)):
        for f in fn:
            stem = f[:-4] if f.lower().endswith('.png') else None
            if stem is None:
                continue
            stem = stem.replace(' 512 px', '').replace(' 256 px', '').replace(' 128 px', '').strip()
            if stem.lower() == name.lower():
                p = os.path.join(dp, f)
                w = Image.open(p).size[0]
                if not best or w > best[0]:
                    best = (w, p)
    if not best:
        sys.exit('not in the pack: ' + folder + ' / ' + name)
    return best[1]


def cut(path, mirror):
    im = Image.open(path).convert('RGBA')
    a = im.getchannel('A')
    im = im.crop(a.getbbox())
    w, h = im.size
    s = int(round(max(w, h) / (1 - 2 * MARGIN)))
    sq = Image.new('RGBA', (s, s), (255, 255, 255, 0))
    sq.paste(im, ((s - w) // 2, (s - h) // 2), im)
    sq = sq.resize((SIZE, SIZE), Image.LANCZOS)
    if mirror:
        sq = ImageOps.mirror(sq)
    # white + alpha = the drawing's alpha x its brightness: a light icon is white, but the pack's emoji are a white tile with
    # BLACK (opaque) eyes + mouth, which a mask would fill in; this way the dark marks become holes and the face reads
    a = ImageChops.multiply(sq.getchannel('A'), sq.convert('L'))
    out = Image.new('RGBA', (SIZE, SIZE), (255, 255, 255, 0))
    out.putalpha(a)
    return out


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    light = pack_root(sys.argv[1])
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    for key, (folder, name, mirror) in ICONS.items():
        p = find(light, folder, name)
        cut(p, mirror).save(os.path.join(out, key + '.png'), optimize=True)
        print('%-11s <- %s / %s%s' % (key, folder, os.path.basename(p), ' (mirrored)' if mirror else ''))
    print('%d icons -> %s' % (len(ICONS), out))


if __name__ == '__main__':
    main()
