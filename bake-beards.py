#!/usr/bin/env python3
"""bake-beards.py - THE JOINED BEARDS (repo-only tooling, 2026-11-02, character-models-plan.md row 12h).

mondo (11-02): "Can we add more facial hair options in the character creator, i cant find a full beard that has a mustache too.
the one that says full beard doesnt have a mustache connected. Use blender to edit some of the existing ones into new ones?"

Each pick here is TWO of the MakeHuman pack pieces the creator already lists under Facial hair (a beard + a moustache),
edited in cloud Blender into ONE piece:
  * one mesh: the beard's vertices, then the moustache's; their two textures side by side on one sheet (each in its own
    padded cell, so the creator's facial hair colour, three-renderer.js paintFacial, tints the whole piece at once);
  * THE JOIN: on the male fit, each end of the moustache is turned down along the mouth corner and laid ON the beard (a ray
    from the front finds the beard's surface; the end sits 1.5 mm in front of it), `into` past the first beard surface
    below it, so the moustache runs into the beard's dense hair instead of stopping above its wispy top edge. The move is
    written back into the moustache's .mhclo offsets (MakeHuman's own fitting: each vertex = 3 body vertices + an offset
    scaled by the body's size), so every body wears the same joined piece;
  * then baked exactly like the pack clothes (bake-mpfb.py bake_one_wear: fitted + weighted by MPFB on all five MPFB bodies,
    the compact layout) to charactercreation/wear/ewb_beard_<key>.glb. The texture sheet is 1024 x 512 (each cell 512 px:
    the pack pieces' own WEAR_PX).
Nothing new is drawn: the strands are the pack's own (authors kept: sprites.js rows + the creator credits list them already).

Usage:
  pip install bpy==5.2.3 meshoptimizer pillow           (Python 3.13)
  git clone --depth 1 https://github.com/makehumancommunity/mpfb2 /tmp/mpfb2
  python3 -I bake-beards.py --mpfb /tmp/mpfb2 --packs /tmp/mhpacks [--only full,viking] [--out charactercreation/wear] [--shots DIR]
  (--packs: <packs>/<pack>/clothes/<name>/ - the zips are extracted / downloaded there like bake-mpfb.py --wear;
   --shots renders each joined piece on all five bodies, front / three-quarter / low, to DIR/<key>_<body>.png)
Upload: the GLBs to R2 Assets/Models/charactercreation/wear/ (+ ASSET_MANIFEST.json rows). Notes: character-creator.md
"THE JOINED BEARDS".
"""
import argparse, importlib.util, io, json, math, os, struct, sys, uuid, zipfile, urllib.request

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('bake_mpfb', os.path.join(HERE, 'bake-mpfb.py'))
bm = importlib.util.module_from_spec(_spec)
_argv, sys.argv = sys.argv, [sys.argv[0]]
_spec.loader.exec_module(bm)
sys.argv = _argv
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402
from mathutils.bvhtree import BVHTree  # noqa: E402

FULL = ('bodyparts06_cc-by', 'grinsegold_full_beard')
TACHE = ('bodyparts06_cc-by', 'grinsegold_moustache')
VIKING = ('bodyparts05_cc0', 'rehmanpolanski_beard_viking')
VIKING_TACHE = ('bodyparts05_cc0', 'rehmanpolanski_moustache_viking')
SCRUFFY = ('bodyparts05_cc0', 'wdg_scruffy_beard')
# key -> the creator label, the beard, the moustache, the join: `span` = how far in from the moustache's end the turn starts
# (m, along x), `into` = how far past the beard's first surface below the end the end goes down (m), `max_drop` caps the turn,
# `pull` = how far the end is drawn in toward the chin as it goes down (m; for a goatee narrower than the mouth)
COMBOS = {
    'full':      dict(label='Full beard with moustache', beard=FULL, tache=TACHE, span=0.016, into=0.012, max_drop=0.03),
    'fullbushy': dict(label='Full beard with bushy moustache', beard=FULL, tache=VIKING_TACHE, span=0.016, into=0.012, max_drop=0.03),
    'viking':    dict(label='Viking beard with moustache', beard=VIKING, tache=VIKING_TACHE, span=0.016, into=0.010, max_drop=0.03),
    'scruffy':   dict(label='Scruffy beard with moustache', beard=SCRUFFY, tache=TACHE, span=0.016, into=0.012, max_drop=0.03),
}
CELL, PAD = 1024, 24            # the sheet: two 1024 cells (-> 512 each at WEAR_PX 1024), a 24 px margin round each
LIFT = 0.0015                   # a joined end sits this far in front of the beard
TMP = '/tmp/bake-beards'


def pack_dir(packs, pack, name):
    d = os.path.join(packs, pack)
    if not os.path.isdir(d):
        z = os.path.join(packs, pack + '.zip')
        if not os.path.exists(z):
            url = 'https://files.makehumancommunity.org/asset_packs/%s/%s.zip' % (pack.rsplit('_', 1)[0], pack)
            print('[bake-beards] downloading', url)
            urllib.request.urlretrieve(url, z)
        zipfile.ZipFile(z).extractall(d)
    return os.path.join(d, 'clothes', name)


def read_mhclo(path):
    """(header lines before 'verts 0' as (key, rest), [vertex lines as (refs, weights, offsets)], delete_verts lines)"""
    head, verts, tail, mode = [], [], [], 'head'
    for line in open(path, encoding='utf-8', errors='replace'):
        s = line.strip()
        if mode == 'head':
            if s.startswith('verts'):
                mode = 'verts'
            elif s and not s.startswith('#'):
                k, _, rest = s.partition(' ')
                head.append((k, rest.strip()))
            continue
        if mode == 'verts':
            p = s.split()
            if not p:
                continue
            if len(p) == 1 and p[0].lstrip('-').isdigit():
                verts.append(([int(p[0])] * 3, [1.0, 0.0, 0.0], [0.0, 0.0, 0.0]))
                continue
            if len(p) == 9:
                verts.append(([int(x) for x in p[:3]], [float(x) for x in p[3:6]], [float(x) for x in p[6:9]]))
                continue
            mode = 'tail'
        tail.append(s)
    return head, verts, tail


def read_obj(path):
    V, T, F = [], [], []
    for line in open(path, encoding='utf-8', errors='replace'):
        p = line.split()
        if not p:
            continue
        if p[0] == 'v':
            V.append(p[1:4])
        elif p[0] == 'vt':
            T.append([float(p[1]), float(p[2])])
        elif p[0] == 'f':
            F.append([(int(c.split('/')[0]), int(c.split('/')[1]) if '/' in c and c.split('/')[1] else 0) for c in p[1:]])
    return V, T, F


def texture_of(d, head):
    mat = dict(head).get('material')
    mm = os.path.join(d, mat) if mat else None
    if not mm or not os.path.exists(mm):
        mm = next(os.path.join(d, f) for f in os.listdir(d) if f.endswith('.mhmat'))
    for line in open(mm, encoding='utf-8', errors='replace'):
        p = line.split(None, 1)
        if len(p) == 2 and p[0] == 'diffuseTexture':
            t = os.path.join(d, os.path.basename(p[1].strip()))
            if os.path.exists(t):
                return t
    raise IOError('no diffuse texture in ' + mm)


def write_combo(key, spec, packs, tache_offsets=None):
    """The combined source asset (obj + mhclo + mhmat + the two-cell sheet) in TMP/<name>/; returns (dir, name, n_beard)."""
    from PIL import Image
    name = 'beard_' + key
    out = os.path.join(TMP, name)
    os.makedirs(out, exist_ok=True)
    parts = []
    for which in ('beard', 'tache'):
        d = pack_dir(packs, *spec[which])
        mh = os.path.join(d, spec[which][1] + '.mhclo')
        head, verts, tail = read_mhclo(mh)
        V, T, F = read_obj(os.path.join(d, dict(head)['obj_file']))
        if len(V) != len(verts):
            raise ValueError('%s: %d obj vertices, %d mhclo lines' % (mh, len(V), len(verts)))
        parts.append(dict(d=d, head=head, verts=verts, tail=tail, V=V, T=T, F=F, tex=texture_of(d, head)))
    b, t = parts
    for k in ('x_scale', 'y_scale', 'z_scale'):
        if dict(b['head']).get(k) != dict(t['head']).get(k):
            raise ValueError('the two pieces measure the body differently (%s); not supported' % k)
    if tache_offsets is not None:
        t['verts'] = [(r, w, list(o)) for (r, w, _), o in zip(t['verts'], tache_offsets)]
    # the sheet: beard in the left cell, moustache in the right
    sheet = Image.new('RGBA', (CELL * 2, CELL), (0, 0, 0, 0))
    inner = CELL - 2 * PAD
    for i, p in enumerate(parts):
        im = Image.open(p['tex']).convert('RGBA').resize((inner, inner), Image.LANCZOS)
        sheet.paste(im, (i * CELL + PAD, PAD))
    sheet.save(os.path.join(out, name + '.png'))
    uvmap = lambda i, u, v: ((i * CELL + PAD + u * inner) / (2 * CELL), (PAD + v * inner) / CELL)   # (obj v is from the bottom)
    nb = len(b['V'])
    with open(os.path.join(out, name + '.obj'), 'w') as f:
        f.write('# bake-beards.py: %s + %s joined (Entropy Wars)\n' % (spec['beard'][1], spec['tache'][1]))
        for p in parts:
            for v in p['V']:
                f.write('v %s %s %s\n' % tuple(v))
        for i, p in enumerate(parts):
            for u, v in p['T']:
                f.write('vt %.6f %.6f\n' % uvmap(i, u, v))
        vo, to = 0, 0
        for p in parts:
            for face in p['F']:
                f.write('f ' + ' '.join('%d/%d' % (vi + vo, ti + to) for vi, ti in face) + '\n')
            vo += len(p['V']); to += len(p['T'])
    hb = dict(b['head'])
    with open(os.path.join(out, name + '.mhclo'), 'w') as f:
        f.write('# bake-beards.py: %s + %s joined (Entropy Wars)\n' % (spec['beard'][1], spec['tache'][1]))
        f.write('uuid %s\nbasemesh hm08\ntag Beard\ntag Moustache\n\nname %s\nobj_file %s.obj\n' % (uuid.uuid4(), name, name))
        for k in ('x_scale', 'z_scale', 'y_scale'):
            f.write('%s %s\n' % (k, hb[k]))
        f.write('z_depth %s\nmaterial %s.mhmat\nverts 0\n' % (hb.get('z_depth', '50'), name))
        for p in parts:
            for r, w, o in p['verts']:
                f.write(' %5d %5d %5d %.5f %.5f %.5f %.5f %.5f %.5f\n' % (r[0], r[1], r[2], w[0], w[1], w[2], o[0], o[1], o[2]))
    with open(os.path.join(out, name + '.mhmat'), 'w') as f:
        f.write('# MakeHuman Material definition\n\nname %sMaterial\n\ndiffuseColor 0.8 0.8 0.8\nspecularColor 0.001 0.001 0.001\n'
                'shininess 0.004\nopacity 0\n\ndiffuseTexture %s.png\n' % (name, name))
    return out, name, nb, parts


def scale_sizes(h, head):
    """MPFB's own size per axis for a .mhclo (services/clothesservice.py fit_clothes_to_human), from the body's local mesh"""
    H = h.data.vertices
    hd = dict(head)
    xs, zs, ys = (hd[k].split() for k in ('x_scale', 'z_scale', 'y_scale'))
    x = abs(H[int(xs[0])].co[0] - H[int(xs[1])].co[0]) / float(xs[2])
    y = abs(H[int(ys[0])].co[2] - H[int(ys[1])].co[2]) / float(ys[2])
    z = abs(H[int(zs[0])].co[1] - H[int(zs[1])].co[1]) / float(zs[2])
    return x, y, z


def join(HS, h, d, name, nb, parts, spec):
    """THE JOIN on the male fit: the moustache's ends turned down onto the beard. Returns the moustache's new .mhclo offsets."""
    ob = HS.add_mhclo_asset(os.path.join(d, name + '.mhclo'), h, asset_type='Clothes', subdiv_levels=0, material_type='MAKESKIN')
    C = np.array([v.co[:] for v in ob.data.vertices])          # the basemesh's local frame (Blender: x right, -y front, z up)
    beard_polys = [p.vertices[:] for p in ob.data.polygons if all(i < nb for i in p.vertices)]
    bvh = BVHTree.FromPolygons([Vector(c) for c in C[:nb]], beard_polys)
    T = C[nb:].copy()
    new = T.copy()
    sides, drops = [], []
    for side in (-1.0, 1.0):
        sel = np.where(T[:, 0] * side > 0)[0]
        if not len(sel):
            continue
        tipx = np.abs(T[sel, 0]).max()
        end = sel[np.abs(T[sel, 0]) > tipx - 0.004]
        z_end = T[end, 2].min()
        x_end = float(np.mean(T[end, 0]))
        # the beard's first surface below the end, seen from the front (rays along +y, down in 1 mm steps)
        z_hit = None
        for k in range(1, int(spec['max_drop'] / 0.001) + 1):
            z = z_end - k * 0.001
            hit = bvh.ray_cast(Vector((x_end, -1.0, z)), Vector((0, 1, 0)))
            if hit[0] is not None:
                z_hit = z
                break
        drop = spec['max_drop'] if z_hit is None else min(spec['max_drop'], (z_end - z_hit) + spec['into'])
        print('[bake-beards] %s side %+d: end z %.4f, beard below at %s, drop %.1f mm' % (name, side, z_end, 'none' if z_hit is None else '%.4f' % z_hit, drop * 1000))
        sides.append((sel, tipx)); drops.append(drop)
    drop = min(drops)                     # both ends turn down alike (a sparse beard's strands can let one side's ray through)
    for sel, tipx in sides:
        for i in sel:
            s = (abs(T[i, 0]) - (tipx - spec['span'])) / spec['span']
            s = max(0.0, min(1.0, s))
            s = s * s * (3 - 2 * s)
            if s <= 0:
                continue
            p = T[i].copy()
            p[2] -= drop * s
            p[0] -= np.sign(p[0]) * spec.get('pull', 0.0) * s
            hit = bvh.ray_cast(Vector((p[0], -1.0, p[2])), Vector((0, 1, 0)))
            if hit[0] is not None and p[1] > hit[0][1] - LIFT:
                p[1] = p[1] + (hit[0][1] - LIFT - p[1]) * min(1.0, 2 * s)
            new[i] = p
    xs, ys, zs = scale_sizes(h, parts[1]['head'])
    D = new - T
    offs = []
    for (r, w, o), dd in zip(parts[1]['verts'], D):
        # MPFB: blender offset = (d0 * x_size, -d2 * z_size, d1 * y_size) for the file's (d0, d1, d2)
        offs.append([o[0] + dd[0] / xs, o[1] + dd[2] / ys, o[2] - dd[1] / zs])
    bpy.data.objects.remove(ob)
    return offs


def rename_glb(src, dst, wid):
    """bake_one_wear names its GLB mhw_<name>; the joined pieces are ewb_beard_<key> (Blender-built)"""
    b = open(src, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    js = json.loads(b[20:20 + jl])
    for k in ('nodes', 'meshes', 'materials'):
        for e in js.get(k, []):
            e['name'] = wid
    js['asset']['generator'] = 'bake-beards.py (Entropy Wars, cloud Blender)'
    rest = b[20 + jl:]
    nj = json.dumps(js, separators=(',', ':')).encode()
    nj += b' ' * ((-len(nj)) % 4)
    with open(dst, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(nj) + len(rest)))
        f.write(struct.pack('<II', len(nj), 0x4E4F534A)); f.write(nj); f.write(rest)
    os.remove(src)


def shots(HS, humans, key, glb_dir, out_dir):
    """the joined piece on each body (its baked source asset re-fitted), front / three-quarter / low, side by side"""
    from PIL import Image
    d = os.path.join(TMP, 'beard_' + key)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.device = 'CPU'
    sc.render.resolution_x = sc.render.resolution_y = 360
    if not sc.world:
        sc.world = bpy.data.worlds.new('w')
    sc.world.use_nodes = True
    sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.6, 0.62, 0.66, 1)
    cam = bpy.data.objects.get('bb_cam') or bpy.data.objects.new('bb_cam', bpy.data.cameras.new('bb_cam'))
    if cam.name not in sc.collection.objects:
        sc.collection.objects.link(cam)
    cam.data.lens = 85; sc.camera = cam
    if not bpy.data.objects.get('bb_sun'):
        L = bpy.data.objects.new('bb_sun', bpy.data.lights.new('bb_sun', 'SUN')); L.data.energy = 3
        L.rotation_euler = (math.radians(50), 0, math.radians(-30)); sc.collection.objects.link(L)
    skin = bpy.data.materials.get('bb_skin') or bpy.data.materials.new('bb_skin')
    skin.use_nodes = True
    skin.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.75, 0.52, 0.40, 1)
    for hn in humans.values():
        hn.hide_render = True
    os.makedirs(out_dir, exist_ok=True)
    row = []
    for b, h in humans.items():
        h.hide_render = False
        mats = list(h.data.materials)
        h.data.materials.clear(); h.data.materials.append(skin)
        ob = HS.add_mhclo_asset(os.path.join(d, 'beard_%s.mhclo' % key), h, asset_type='Clothes', subdiv_levels=0, material_type='MAKESKIN')
        W = np.array(h.matrix_world)
        P = np.array([v.co[:] for v in h.data.vertices]) @ W[:3, :3].T + W[:3, 3]
        top = P[:, 2].max()
        head = Vector((0, 0, top - 0.17 * (top / 1.75)))
        ims = []
        for az, el in ((0, 4), (38, 4), (20, -22)):
            a, e = math.radians(az), math.radians(el)
            cam.location = head + Vector((0.55 * math.sin(a) * math.cos(e), -0.55 * math.cos(a) * math.cos(e), 0.55 * math.sin(e)))
            cam.rotation_euler = (head - cam.location).to_track_quat('-Z', 'Y').to_euler()
            sc.render.filepath = os.path.join(TMP, 'shot.png')
            bpy.ops.render.render(write_still=True)
            ims.append(Image.open(sc.render.filepath).convert('RGB'))
        bpy.data.objects.remove(ob)
        h.data.materials.clear()
        for m in mats:
            h.data.materials.append(m)
        h.hide_render = True
        strip = Image.new('RGB', (sum(i.width for i in ims), ims[0].height))
        x = 0
        for i in ims:
            strip.paste(i, (x, 0)); x += i.width
        row.append(strip)
    sheet = Image.new('RGB', (row[0].width, sum(r.height for r in row)))
    y = 0
    for r in row:
        sheet.paste(r, (0, y)); y += r.height
    sheet.save(os.path.join(out_dir, 'beard_%s_bodies.png' % key))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mpfb', required=True)
    ap.add_argument('--packs', required=True)
    ap.add_argument('--out', default=os.path.join(HERE, 'charactercreation', 'wear'))
    ap.add_argument('--only', default='')
    ap.add_argument('--shots', default='')
    a = ap.parse_args()
    from PIL import Image
    packs = os.path.abspath(a.packs)
    M = bm.install_mpfb(a.mpfb)
    HS = M('services.humanservice', 'HumanService')
    TS = M('services.targetservice', 'TargetService')
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    humans = {}
    for b in bm.WEAR_BODIES:
        macro = dict(bm.BODIES[b])
        macro['race'] = {'asian': 0.33, 'caucasian': 0.33, 'african': 0.33}
        h = HS.create_human(macro_detail_dict=macro)
        TS.bake_targets(h)
        HS.add_builtin_rig(h, 'game_engine')
        humans[b] = h
    cat = json.load(open(os.path.join(HERE, 'charactercreation', 'mpfb', 'ASSET_PACKS_CATALOGUE.json')))
    bm.WEAR_PX = CELL                     # the two-cell sheet -> 1024 x 512: each cell keeps the pack pieces' 512 px
    only = set(a.only.split(',')) if a.only else None
    os.makedirs(a.out, exist_ok=True)
    for key, spec in COMBOS.items():
        if only and key not in only:
            continue
        d, name, nb, parts = write_combo(key, spec, packs)
        offs = join(HS, humans['male'], d, name, nb, parts, spec)
        d, name, nb, parts = write_combo(key, spec, packs, offs)
        bm.bake_one_wear(HS, humans, name, d, spec['beard'][0], 'bodyparts', cat, a.out, Image, io)
        wid = 'ewb_' + name
        rename_glb(os.path.join(a.out, 'mhw_' + name + '.glb'), os.path.join(a.out, wid + '.glb'), wid)
        print('[bake-beards] %s -> %s.glb (%d KB)' % (spec['label'], wid, os.path.getsize(os.path.join(a.out, wid + '.glb')) // 1024))
        if a.shots:
            shots(HS, humans, key, a.out, a.shots)


if __name__ == '__main__':
    main()
