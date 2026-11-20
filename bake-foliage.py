#!/usr/bin/env python3
"""bake-foliage.py — THE FLORA PACKS (2026-11-20, mondo: "Uploaded some Zips of assets packs to the inbox, use them throughout the game.
We need to do a foliage pass on every single zone ... accurate to that zone's climate").

Turns his two uploads into the game's files. Repo-only dev tooling, never loaded by the game. Notes: docs/notes/flora.md.

  THE RETRO KIT  = "Retro Foliage: Pixel Art Nature Kit" by AFGameAssets (bought; 62 FBX + the season leaf pictures):
      trees        rf_<birch|oak|fir|willow>_<n>[_<season>].glb   one file a tree a season (the SAME mesh, the season's leaf picture)
                   birch / oak: summer, autumn, winter · fir: summer, winter (snow), dead · willow: green, yellow, blue
      dead wood    rf_birch_dead_<n>, rf_oak_fallen_<n>, rf_oak_stump, rf_pine_fallen_<n>, rf_pine_stump, rf_willow_dead_<n>, rf_stump
      plants       rf_flower_<1-11>, rf_plant_<1-11>, rf_grass_<1-6>, rf_rock_<1-4>
  THE HAND-PAINTED FLOWERS = "Handpainted flower assets" (one .blend + one 4096 px sheet): hp_<name>.glb, eight whole plants.
  THE FLORA FIELD = ew_flora_field.glb: every small plant above in ONE file on ONE 1024 px sheet (three-renderer.js THE FLORA FIELD
      merges them into one mesh a cell, so a meadow is one draw).

  THE TREES follow THE PAINTED TREES' rules (bake-trees.py): the bark is the kit's own; the leaf cards keep the kit's shapes but
      THE NORMALS point out of the crown and a little up, the leaf material is `ewleaf_*` and ONE-SIDED with both windings in the
      file (an underside is never black), and THE CLEARANCE drops the leaf cards that hang below CLEAR of the height (a path under
      the tree stays a path; a willow keeps its curtain). A tree's box is made even round its trunk (two loose corner points), so
      the game plants the TRUNK on the spot, not the crown's middle.

  pip install bpy numpy pillow        (bpy = Blender as a Python module: it reads the FBX and the .blend; nothing is rendered)
  python3 -I bake-foliage.py --retro "<kit>/3D Models" --tex "<kit>/Textures" --blend <flowerset.blend> --flowertex "<textures>" --out <dir>
Then: node sync-zip.js --put <out>/<file> Assets/world/packs/afgameassets_retro_foliage/<file> ...   (hp_* -> .../handpainted_flowers/,
      ew_flora_field.glb -> Assets/world/nature/flora/). The game: data.js HQ_TREE_KINDS `rf_*`, the catalogue rows, ZONE_FLORA."""
import sys, os, io, json, math, struct
import numpy as np
from PIL import Image

def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
RETRO, TEX, BLEND, FTEX, OUT = arg('--retro'), arg('--tex'), arg('--blend'), arg('--flowertex'), arg('--out', 'out')
KIT = 0.4            # the kit's units -> metres (a kit birch 22 units = 8.8 m, a flower patch 0.7 = 0.28 m)
HP = 0.085           # the hand-painted set's units -> metres (a 10-unit plant = 0.85 m)
CLEAR = {'oak': 0.30, 'birch': 0.30, 'fir': 0.16, 'willow': 0.0}
FIELD_TRIS = 96      # a field plant's triangles (one face), see THE FIELD'S BUDGET

# ---------------------------------------------------------------- reading (Blender as a module)
def _meshes():
    import bpy
    out = []
    for o in bpy.data.objects:
        if o.type != 'MESH': continue
        me = o.data; me.calc_loop_triangles(); M = np.array(o.matrix_world)
        co = np.array([v.co[:] for v in me.vertices], np.float64); co = co @ M[:3, :3].T + M[:3, 3]
        uvl = me.uv_layers.active
        P, UV, I, seen = [], [], [], {}
        for t in me.loop_triangles:
            for li, vi in zip(t.loops, t.vertices):
                uv = uvl.data[li].uv if uvl else (0.0, 0.0); key = (vi, round(uv[0], 5), round(uv[1], 5))
                k = seen.get(key)
                if k is None:
                    k = seen[key] = len(P); p = co[vi]; P.append((p[0], p[2], -p[1])); UV.append((uv[0], 1.0 - uv[1]))   # Z up -> Y up; the picture's top = v 0
                I.append(k)
        mat = me.materials[0].name if me.materials and me.materials[0] else ''
        out.append(dict(name=o.name, mat=mat, P=np.array(P, np.float64), UV=np.array(UV, np.float64), I=np.array(I, np.int64).reshape(-1, 3)))
    return out
def read_fbx(path):
    import bpy
    bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.fbx(filepath=path); return _meshes()
def read_blend(path):
    import bpy
    bpy.ops.wm.open_mainfile(filepath=path); return _meshes()

# ---------------------------------------------------------------- pictures
def png_bytes(im):
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return b.getvalue()
def tex(name): return Image.open(os.path.join(TEX, name)).convert('RGBA')
def bleed(im, passes=6):
    """the colour under a cut-out's see-through pixels = its nearest painted neighbour (no dark fringe when the sheet is filtered)"""
    a = np.asarray(im).astype(np.float32); rgb, al = a[..., :3].copy(), a[..., 3]; known = al > 8
    for _ in range(passes):
        acc = np.zeros_like(rgb); cnt = np.zeros(al.shape, np.float32)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            k = np.roll(known, (dy, dx), (0, 1)); acc += np.roll(rgb, (dy, dx), (0, 1)) * k[..., None]; cnt += k
        new = (~known) & (cnt > 0); rgb[new] = acc[new] / cnt[new][:, None]; known = known | new
    return Image.fromarray(np.dstack([rgb, al]).astype(np.uint8), 'RGBA')
def tint(im, rgb, shade=0.0):
    """a white cut-out (the kit's grass) in one colour, a little darker toward the picture's foot"""
    a = np.asarray(im).astype(np.float32); h = a.shape[0]; out = a.copy()
    ramp = (1.0 - shade * np.linspace(0, 1, h))[:, None]
    for c in range(3): out[..., c] = np.clip(a[..., c] / 255.0 * rgb[c] * ramp, 0, 255)
    return Image.fromarray(out.astype(np.uint8), 'RGBA')
def handpainted(size):
    c = Image.open(os.path.join(FTEX, 'Material.001_BaseColor.1001.png')).convert('RGB'); m = Image.open(os.path.join(FTEX, 'Material.001_Alpha.1001.png')).convert('L')
    im = bleed(Image.merge('RGBA', (*c.split(), m)).resize((size, size), Image.LANCZOS), 8)
    a = np.asarray(im).copy(); a[..., 3] = np.where(a[..., 3] > 110, 255, 0); return Image.fromarray(a, 'RGBA')

# ---------------------------------------------------------------- the file
def write_glb(path, prims, mats, images, gen):
    """prims: [name, P, N, UV, I(flat), material index] · mats: [name, image index, leaf(bool), wrap(bool)] · images: [name, png bytes]"""
    bin_ = bytearray(); views = []; acc = []
    def view(data, target=None):
        while len(bin_) % 4: bin_.append(0)
        v = {'buffer': 0, 'byteOffset': len(bin_), 'byteLength': len(data)}
        if target: v['target'] = target
        bin_.extend(data); views.append(v); return len(views) - 1
    nodes, meshes = [], []
    for name, P, N, UV, I, mi in prims:
        p = np.asarray(P, np.float32); n = np.asarray(N, np.float32); uv = np.asarray(UV, np.float32); i = np.asarray(I, np.uint16 if len(p) < 65536 else np.uint32).ravel()
        a = {}
        for key, arr, typ in (('POSITION', p, 'VEC3'), ('NORMAL', n, 'VEC3'), ('TEXCOORD_0', uv, 'VEC2')):
            d = {'bufferView': view(arr.tobytes(), 34962), 'componentType': 5126, 'count': len(arr), 'type': typ}
            if key == 'POSITION': d['min'] = p.min(0).tolist(); d['max'] = p.max(0).tolist()
            acc.append(d); a[key] = len(acc) - 1
        acc.append({'bufferView': view(i.tobytes(), 34963), 'componentType': 5123 if i.dtype == np.uint16 else 5125, 'count': len(i), 'type': 'SCALAR'})
        meshes.append({'name': name, 'primitives': [{'attributes': a, 'indices': len(acc) - 1, 'material': mi}]}); nodes.append({'mesh': len(meshes) - 1, 'name': name})
    jm = []
    for name, ii, leaf, wrap in mats:
        m = {'name': name, 'doubleSided': not leaf, 'pbrMetallicRoughness': {'baseColorTexture': {'index': len(jm)}, 'metallicFactor': 0, 'roughnessFactor': 1}}
        if leaf: m['alphaMode'] = 'MASK'; m['alphaCutoff'] = 0.5      # ONE-SIDED on purpose: both windings are in the file with the same normals
        jm.append(m)
    j = {'asset': {'version': '2.0', 'generator': 'Entropy Wars bake-foliage.py (' + gen + ')'}, 'scene': 0, 'scenes': [{'nodes': list(range(len(nodes)))}],
         'nodes': nodes, 'meshes': meshes, 'materials': jm,
         'textures': [{'sampler': 0 if m[3] else 1, 'source': m[1]} for m in mats],
         'samplers': [{'magFilter': 9728, 'minFilter': 9984}, {'magFilter': 9728, 'minFilter': 9984, 'wrapS': 33071, 'wrapT': 33071}],
         'images': [{'bufferView': view(b), 'mimeType': 'image/png', 'name': n} for n, b in images], 'accessors': acc, 'bufferViews': views, 'buffers': [{'byteLength': 0}]}
    while len(bin_) % 4: bin_.append(0)
    j['buffers'][0]['byteLength'] = len(bin_); js = json.dumps(j, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(bin_), 0x004E4942) + bytes(bin_)
    open(path, 'wb').write(out); return len(out)

def flat_normals(P, I):
    """smooth per-corner normals for solid wood / rock (area-weighted)"""
    N = np.zeros_like(P); a, b, c = P[I[:, 0]], P[I[:, 1]], P[I[:, 2]]; fn = np.cross(b - a, c - a)
    for k in range(3): np.add.at(N, I[:, k], fn)
    l = np.linalg.norm(N, axis=1); l[l < 1e-12] = 1; return N / l[:, None]
def both(I): return np.concatenate([I, I[:, [0, 2, 1]]])          # both windings (the one-sided leaf material draws either face)
def components(P, I):
    """the leaf cards: triangles joined by a shared corner (corners welded by place)"""
    key = {}; vid = np.zeros(len(P), np.int64)
    for i, p in enumerate(np.round(P, 3)):
        vid[i] = key.setdefault((p[0], p[1], p[2]), len(key))
    par = list(range(len(key)))
    def f(x):
        while par[x] != x: par[x] = par[par[x]]; x = par[x]
        return x
    for t in vid[I]:
        r = f(t[0])
        for q in t[1:]: par[f(q)] = r
    return np.array([f(vid[t[0]]) for t in I])

# ---------------------------------------------------------------- the trees
SEASONS = {
    'birch':  [('', 'Tree_Birch_Summer.png'), ('_autumn', 'Tree_Birch_Autumn.png'), ('_winter', 'Tree_Birch_Winter.png')],
    'oak':    [('', 'Tree_Oak_Summer.png'), ('_autumn', 'Tree_Oak_Autumn.png'), ('_winter', 'Tree_Oak_Winter.png')],
    'fir':    [('', 'Tree_Fir_Summer.png'), ('_winter', 'Tree_Fir_Winter.png'), ('_dead', 'Tree_Fir_Dead.png')],
    'willow': [('', 'Tree_Willow_Type1.png'), ('_yellow', 'Tree_Willow_Type2.png'), ('_blue', 'Tree_Willow_Type3.png')],
}
TREES = [('birch', 'Birch_00%d.fbx', 4), ('oak', 'Oak_00%d.fbx', 4), ('fir', 'Pine_00%d.fbx', 4), ('willow', 'Willow_00%d.fbx', 3)]
def bake_tree(form, src, stem, report):
    ms = read_fbx(src)
    wood = [m for m in ms if 'Trunk' in m['mat']]; leaves = [m for m in ms if 'Leaves' in m['mat']]; ivy = [m for m in ms if 'Lierre' in m['mat']]
    W = wood[0]; P = W['P'] * KIT
    low = P[P[:, 1] < P[:, 1].min() + 0.06 * (P[:, 1].max() - P[:, 1].min())]; cx, cz = low[:, 0].mean(), low[:, 2].mean()   # the trunk's foot = the spot
    def place(m):
        q = m['P'] * KIT; q[:, 0] -= cx; q[:, 2] -= cz; return q
    WP = place(W); LP = np.concatenate([place(m) for m in leaves]); LUV = np.concatenate([m['UV'] for m in leaves]); o = 0; LI = []
    for m in leaves: LI.append(m['I'] + o); o += len(m['P'])
    LI = np.concatenate(LI)
    # THE GROUND: the kit's trees do not stand on their file's zero (a willow's foot is 6 units under it). The ground is the trunk's foot, a
    # root's depth up; the roots lie on it, never under it, and a hanging leaf stops a hand above it
    g0 = WP[:, 1].min() + 0.03 * (max(WP[:, 1].max(), LP[:, 1].max()) - WP[:, 1].min())
    WP[:, 1] = np.maximum(WP[:, 1] - g0, -0.02); LP[:, 1] = np.maximum(LP[:, 1] - g0, 0.12)
    H = max(WP[:, 1].max(), LP[:, 1].max())
    # THE CLEARANCE: a leaf card whose middle hangs under CLEAR of the height is dropped
    clear = CLEAR[form] * H; kept = len(LI)
    if clear > 0:
        comp = components(LP, LI); keep = np.ones(len(LI), bool)
        for c in np.unique(comp):
            sel = comp == c; ys = LP[LI[sel].ravel(), 1]
            if ys.mean() < clear or ys.min() < clear * 0.55: keep[sel] = False
        if keep.sum() > len(LI) * 0.5: LI = LI[keep]
    # THE NORMALS: out of the crown and a little up (a fir: out from its stem)
    used = np.unique(LI); cc = LP[used].mean(0); cc[1] = LP[used][:, 1].min() + 0.35 * (LP[used][:, 1].max() - LP[used][:, 1].min())
    d = LP - cc
    if form == 'fir': d[:, 1] = 0
    l = np.linalg.norm(d, axis=1); l[l < 1e-6] = 1; LN = d / l[:, None]; LN[:, 1] += 0.55 if form == 'fir' else 0.35
    LN /= np.linalg.norm(LN, axis=1)[:, None]
    # the box even round the trunk: two loose points no triangle uses
    allp = np.concatenate([WP, LP[used]]); r = max(np.abs(allp[:, 0]).max(), np.abs(allp[:, 2]).max())
    WP2 = np.concatenate([WP, [[-r, 0, -r], [r, 0, r]]]); WUV = np.concatenate([W['UV'], [[0, 0], [0, 0]]]); WN = np.concatenate([flat_normals(WP, W['I']), [[0, 1, 0], [0, 1, 0]]])
    bark = png_bytes(tex('TreeTextureAtlas_Tree.png').convert('RGB'))
    IP = IUV = II = None
    if ivy:
        IP = np.concatenate([place(m) for m in ivy]); IUV = np.concatenate([m['UV'] for m in ivy]); o = 0; II = []
        for m in ivy: II.append(m['I'] + o); o += len(m['P'])
        II = np.concatenate(II); IP[:, 1] = np.maximum(IP[:, 1] - g0, 0.02)
    for suf, pic in SEASONS[form]:
        name = stem + suf
        prims = [[name, WP2, WN, WUV, W['I'], 0], [name + '_leaves', LP, LN, LUV, both(LI), 1]]
        mats = [['rf_bark', 0, False, True], ['ewleaf_' + name, 1, True, False]]; images = [['rf_bark', bark], ['ewleaf_' + name, png_bytes(tex(pic))]]
        if ivy and suf in ('', '_yellow', '_blue', '_autumn'):       # the ivy on the trunk (not on a bare winter tree)
            dn = IP - np.array([0, IP[:, 1].mean(), 0]); dn[:, 1] = 0; ln = np.linalg.norm(dn, axis=1); ln[ln < 1e-6] = 1; IN = dn / ln[:, None]; IN[:, 1] += 0.4; IN /= np.linalg.norm(IN, axis=1)[:, None]
            prims.append([name + '_ivy', IP, IN, IUV, both(II), 2]); mats.append(['ewleaf_' + name + '_ivy', 2, True, False]); images.append(['ewleaf_ivy', png_bytes(tex('Plant_Ivy.png'))])
        size = write_glb(os.path.join(OUT, name + '.glb'), prims, mats, images, 'the retro kit')
        report.append((name, 'tree', round(H, 2), round(2 * r, 2), len(W['I']) + len(LI) * 2, size, '%d of %d leaf triangles kept, lowest leaf %.0f%% up' % (len(LI), kept, 100 * LP[np.unique(LI)][:, 1].min() / H)))

# ---------------------------------------------------------------- the single pieces
def centre(P, by_foot=False):
    P = P.copy(); P[:, 0] -= (P[:, 0].min() + P[:, 0].max()) / 2; P[:, 2] -= (P[:, 2].min() + P[:, 2].max()) / 2; P[:, 1] -= P[:, 1].min(); return P
def solid(src, name, pic, report, kind):
    ms = read_fbx(src); m = ms[0]; P = centre(m['P'] * KIT)
    im = tex(pic).convert('RGB')
    size = write_glb(os.path.join(OUT, name + '.glb'), [[name, P, flat_normals(P, m['I']), m['UV'], m['I'], 0]], [[name.split('_')[0] + '_' + pic[:-4], 0, False, True]], [[pic[:-4], png_bytes(im)]], 'the retro kit')
    report.append((name, kind, round(P[:, 1].max(), 2), round(max(np.ptp(P[:, 0]), np.ptp(P[:, 2])), 2), len(m['I']), size, ''))
def card_normals(P):
    N = np.zeros_like(P); N[:, 1] = 1.0; return N                    # a small plant takes the ground's light on both faces
def plant(m, name, scale, im, report, kind, sink=0.0):
    P = m['P'] * scale; P = centre(P); P[:, 1] -= sink * P[:, 1].max()
    size = write_glb(os.path.join(OUT, name + '.glb'), [[name, P, card_normals(P), m['UV'], both(m['I']), 0]], [['ewleaf_' + name, 0, True, False]], [['ewleaf_' + name, png_bytes(im)]], kind)
    report.append((name, kind, round(P[:, 1].max(), 2), round(max(np.ptp(P[:, 0]), np.ptp(P[:, 2])), 2), len(m['I']) * 2, size, ''))
    return P

# the hand-painted set: the whole plants (the loose petals / leaves / stems in the .blend are their parts)
HP_PLANTS = {'blueflower': 'hp_bluebell', 'daisy bunch': 'hp_daisy_bunch', 'daisy flower': 'hp_daisy', 'flameflower': 'hp_flameflower', 'orange flower.001': 'hp_orange_flower',
             'purple flower.001': 'hp_purple_flower', 'purplflower': 'hp_violet', 'sunflower.001': 'hp_sunflower'}
GRASS_TINTS = {'': (104, 148, 56), '_dry': (196, 170, 92), '_frost': (206, 222, 226), '_dark': (58, 96, 52)}     # summer, dry, frost, forest shade

def main():
    os.makedirs(OUT, exist_ok=True); rep = []; field = []          # field: [name, P, UV, I, sheet key]
    for form, pat, n in TREES:
        for i in range(1, n + 1): bake_tree(form, os.path.join(RETRO, pat % i), 'rf_%s_%d' % (form, i), rep)
    for i in range(1, 4): solid(os.path.join(RETRO, 'Birch_Dead_00%d.fbx' % i), 'rf_birch_dead_%d' % i, 'TreeTextureAtlas_Tree.png', rep, 'dead wood')
    for i in range(1, 3): solid(os.path.join(RETRO, 'Oak_Fallen_00%d.fbx' % i), 'rf_oak_fallen_%d' % i, 'TreeTextureAtlas_Tree.png', rep, 'dead wood')
    solid(os.path.join(RETRO, 'Oak_Trunk.fbx'), 'rf_oak_stump', 'TreeTextureAtlas_Tree.png', rep, 'dead wood')
    for i in range(1, 6): solid(os.path.join(RETRO, 'Pine_Fallen_Broken_00%d.fbx' % i), 'rf_pine_fallen_%d' % i, 'TreeTextureAtlas_Tree.png', rep, 'dead wood')
    solid(os.path.join(RETRO, 'Pine_Trunk_Broken.fbx'), 'rf_pine_stump', 'TreeTextureAtlas_Tree.png', rep, 'dead wood')
    for i in range(1, 3): solid(os.path.join(RETRO, 'Willow_Dead_00%d.fbx' % i), 'rf_willow_dead_%d' % i, 'TreeTextureAtlas_Tree.png', rep, 'dead wood')
    solid(os.path.join(RETRO, 'Generic_Tree_Trunk_001.fbx'), 'rf_stump', 'TreeTextureAtlas_Tree.png', rep, 'dead wood')
    for i in range(1, 5): solid(os.path.join(RETRO, 'Rock_00%d.fbx' % i), 'rf_rock_%d' % i, 'Rock_Generic.png', rep, 'rock')
    A1, A2, GR = tex('FlowerTextureAtlas.png'), tex('FlowerTextureAtlas2.png'), tex('GrassTextureAtlas2.png')
    for i in range(1, 12):
        m = read_fbx(os.path.join(RETRO, 'Flower_%03d.fbx' % i))[0]; P = plant(m, 'rf_flower_%d' % i, KIT * 1.6, A1, rep, 'flower'); field.append(['rf_flower_%d' % i, P, m['UV'], m['I'], 'a1'])
    for i in range(1, 12):
        m = read_fbx(os.path.join(RETRO, 'Planter_%03d.fbx' % i))[0]; two = 'Bushes' in m['mat']
        P = plant(m, 'rf_plant_%d' % i, KIT, A2 if two else A1, rep, 'plant'); field.append(['rf_plant_%d' % i, P, m['UV'], m['I'], 'a2' if two else 'a1'])
    for i in range(1, 7):
        m = read_fbx(os.path.join(RETRO, 'Grass_Patch_%03d.fbx' % i))[0]
        for suf, rgb in GRASS_TINTS.items():
            P = plant(m, 'rf_grass_%d%s' % (i, suf), KIT, tint(GR, rgb, 0.25), rep, 'grass'); field.append(['rf_grass_%d%s' % (i, suf), P, m['UV'], m['I'], 'g' + suf])
    hp = handpainted(512)
    for m in read_blend(BLEND):
        if m['name'] not in HP_PLANTS: continue
        name = HP_PLANTS[m['name']]; P = plant(m, name, HP, hp, rep, 'hand-painted flower'); field.append([name, P, m['UV'], m['I'], 'hp'])
    # THE FLORA FIELD: every small plant in one file on one sheet
    S = 1024; sheet = Image.new('RGBA', (S, S), (0, 0, 0, 0)); slots = {'hp': (0, 0, 512), 'a1': (512, 0, 256), 'a2': (768, 0, 256), 'g': (512, 256, 256), 'g_dry': (768, 256, 256), 'g_frost': (512, 512, 256), 'g_dark': (768, 512, 256)}
    pics = {'hp': hp, 'a1': A1, 'a2': A2}
    for suf, rgb in GRASS_TINTS.items(): pics['g' + suf] = tint(GR, rgb, 0.25)
    for k, (x, y, w) in slots.items(): sheet.paste(pics[k].resize((w, w), Image.NEAREST) if pics[k].size[0] != w else pics[k], (x, y))
    prims = []
    for name, P, UV, I, k in field:
        # THE FIELD'S BUDGET: a plant of many cards keeps every other one (a meadow is hundreds of plants in view; the prop file keeps them all)
        if len(I) > FIELD_TRIS:
            comp = components(P, I); ids = np.unique(comp)
            if len(ids) > 3:
                order = sorted(ids, key=lambda c: -int((comp == c).sum())); keepc = set(); tot = 0
                for c in order[::2] + order[1::2]:
                    if tot >= FIELD_TRIS: break
                    keepc.add(c); tot += int((comp == c).sum())
                I = I[np.array([c in keepc for c in comp])]
        x, y, w = slots[k]; uv = UV.copy()
        if uv.min() < -0.001 or uv.max() > 1.001: uv = uv - np.floor(uv.min(0))       # a tiled picture's corners brought back onto the picture
        uv = np.clip(uv, 0.002, 0.998); uv = (uv * w + [x, y]) / S
        prims.append([name, P, card_normals(P), uv, both(I), 0])
    size = write_glb(os.path.join(OUT, 'ew_flora_field.glb'), prims, [['ewleaf_flora', 0, True, False]], [['ewleaf_flora', png_bytes(sheet)]], 'the flora field')
    sheet.save(os.path.join(OUT, 'ew_flora_field_sheet.png'))
    rep.append(('ew_flora_field', 'field', 0, 0, sum(len(p[4]) for p in prims), size, '%d plants on one %d px sheet' % (len(prims), S)))
    json.dump([dict(name=r[0], kind=r[1], h=r[2], span=r[3], tris=r[4], bytes=r[5], note=r[6]) for r in rep], open(os.path.join(OUT, 'report.json'), 'w'), indent=0)
    for r in rep: print('%-24s %-20s h %5.2f  span %5.2f  %5d tris  %7d bytes  %s' % r)
    print(len(rep), 'files,', sum(r[5] for r in rep), 'bytes')

if __name__ == '__main__': main()
