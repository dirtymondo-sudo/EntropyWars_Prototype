#!/usr/bin/env python3
"""bake-hair-tex.py — THE HAIR TEXTURES (2026-11-05, mondo: "why do so many of the hairstyles look like shit? They look like
shiny rubber gloves. Are they missing textures or something?").

bake-mpfb.py --hair-styles wrote the 70 MakeHuman pack styles (charactercreation/hair/mh/mh_<name>.glb) with each style's
diffuse SHRUNK to 512 px (the packs ship 1024 - 3600 px) and WITHOUT the normal map 30 of them ship. This tool puts the
pack's own textures back into the same GLBs, nothing else changes (mesh, UVs, skull box, extras are copied byte for byte):
  - the diffuse (PNG, alpha kept) at the pack's own size, capped at --px (1024);
  - the pack's normal map (normalmapTexture in the .mhmat) as the material's normalTexture (JPEG, --px), when it has one.
No Blender, no MPFB. Needs Pillow + numpy.

    python3 -I bake-hair-tex.py --packs <folder with the unzipped packs> [--only mh_a,mh_b] [--px 1024] [--dry-run]

<packs> holds makehuman_system_assets_cc0/, hair01_cc0/, hair02_ccby/, hair03_ccby/ (the zips in project files mhpacks/,
unzipped). The licences / credits do not change (same assets: charactercreation/hair/mh/hair_styles.json).
"""
import argparse, io, json, os, struct, sys

HERE = os.path.dirname(os.path.abspath(__file__))
HAIR = os.path.join(HERE, 'charactercreation', 'hair', 'mh')
PACKS = [('makehuman_system_assets_cc0', 'hair'), ('hair01_cc0', 'hair'), ('hair02_ccby', 'hair'), ('hair03_ccby', 'hair')]


def mhmat(path):
    r = {}
    for line in open(path, encoding='utf-8', errors='replace'):
        p = line.split(None, 1)
        if len(p) == 2:
            r[p[0]] = p[1].strip()
    return r


def sources(packs):
    """{glb id: (diffuse path, normal path | None)} - the same diffuse bake-mpfb.py bake_one_hair picked."""
    out = {}
    for pk, sub in PACKS:
        root = os.path.join(packs, pk, sub)
        if not os.path.isdir(root):
            raise SystemExit('missing ' + root + ' (unzip project files mhpacks/' + pk + '.zip into --packs)')
        for n in sorted(os.listdir(root)):
            d = os.path.join(root, n)
            if not os.path.exists(os.path.join(d, n + '.mhclo')):
                continue
            mm = [f for f in os.listdir(d) if f.endswith('.mhmat')]
            m = mhmat(os.path.join(d, mm[0])) if mm else {}
            dif = os.path.join(d, m['diffuseTexture']) if 'diffuseTexture' in m else None
            if not dif or not os.path.exists(dif):
                alt = [f for f in os.listdir(d) if f.lower().endswith(('.png', '.tga', '.jpg')) and 'normal' not in f.lower() and 'thumb' not in f.lower()]
                dif = os.path.join(d, alt[0]) if alt else None
            nrm = os.path.join(d, m['normalmapTexture']) if 'normalmapTexture' in m else None
            out['mh_' + n] = (dif, nrm if nrm and os.path.exists(nrm) else None)
    return out


def read_glb(path):
    b = open(path, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    o = 20 + jl
    bl = struct.unpack('<I', b[o:o + 4])[0]
    return j, b[o + 8:o + 8 + bl]


def write_glb(path, j, chunks):
    """chunks: [bytes] per bufferView, in order (each view rewritten with fresh offsets)."""
    binb, views = b'', []
    for c, v in zip(chunks, j['bufferViews']):
        v = dict(v)
        v['byteOffset'] = len(binb)
        v['byteLength'] = len(c)
        binb += c + b'\0' * ((-len(c)) % 4)
        views.append(v)
    j['bufferViews'] = views
    j['buffers'] = [{'byteLength': len(binb)}]
    js = json.dumps(j, separators=(',', ':')).encode()
    js += b' ' * ((-len(js)) % 4)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binb)))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(binb), 0x004E4942)); f.write(binb)


def fit(im, px):
    from PIL import Image
    w, h = im.size
    if max(w, h) > px:
        k = px / max(w, h)
        im = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    return im


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--packs', required=True)
    ap.add_argument('--only', default='')
    ap.add_argument('--px', type=int, default=1024)
    ap.add_argument('--out', default=HAIR, help='write the GLBs here (default: in place)')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    from PIL import Image, ImageFile, PngImagePlugin
    ImageFile.LOAD_TRUNCATED_IMAGES = True
    PngImagePlugin.MAX_TEXT_CHUNK = 64 << 20
    src = sources(a.packs)
    only = set(x for x in a.only.split(',') if x)
    os.makedirs(a.out, exist_ok=True)
    tot0 = tot1 = 0
    for f in sorted(os.listdir(HAIR)):
        hid = f[:-4]
        if not f.endswith('.glb') or (only and hid not in only):
            continue
        if hid not in src or not src[hid][0]:
            print('[bake-hair-tex] %s: no pack source, kept' % hid)
            continue
        dif, nrm = src[hid]
        path = os.path.join(HAIR, f)
        j, binb = read_glb(path)
        chunks = [binb[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']] for v in j['bufferViews']]
        # the diffuse: the pack's own file, at its size (capped), alpha kept
        im = fit(Image.open(dif).convert('RGBA'), a.px)
        buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
        img0 = j['images'][0]
        chunks[img0['bufferView']] = buf.getvalue()
        img0['mimeType'] = 'image/png'
        mat = j['materials'][0]
        note = ''
        if nrm:
            nm = fit(Image.open(nrm).convert('RGB'), a.px)
            nb = io.BytesIO(); nm.save(nb, 'JPEG', quality=90)
            if len(j['images']) < 2:
                j['bufferViews'].append({'buffer': 0, 'byteOffset': 0, 'byteLength': 0})
                chunks.append(b'')
                j['images'].append({'bufferView': len(j['bufferViews']) - 1, 'mimeType': 'image/jpeg'})
                j['textures'].append({'source': len(j['images']) - 1, 'sampler': 0})
            chunks[j['images'][1]['bufferView']] = nb.getvalue()
            j['images'][1]['mimeType'] = 'image/jpeg'
            mat['normalTexture'] = {'index': len(j['textures']) - 1}
            note = ' + normal %dx%d' % nm.size
        j['asset']['generator'] = 'bake-mpfb.py hair styles + bake-hair-tex.py'
        s0 = os.path.getsize(path)
        out = os.path.join(a.out, f)
        if not a.dry_run:
            write_glb(out, j, chunks)
        s1 = os.path.getsize(out) if not a.dry_run else 0
        tot0 += s0; tot1 += s1
        print('[bake-hair-tex] %-42s diffuse %dx%d%s  %5d -> %5d KB' % (hid, im.size[0], im.size[1], note, s0 // 1024, s1 // 1024))
    print('[bake-hair-tex] total %d -> %d MB' % (tot0 >> 20, tot1 >> 20))


if __name__ == '__main__':
    main()
