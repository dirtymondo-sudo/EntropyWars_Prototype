#!/usr/bin/env python3
"""bake-fur.py - THE FUR (2026-11-03, character-models-plan.md row 18, the werewolf pilot; repo-only tooling).

mondo (11-03): "go ahead and get it [the MakeHuman hair editor] and try on the werewolf". The hair editor is part of MPFB 2.0.18
(src/mpfb/ui/haireditorpanel, by Tomas Klecer); its asset pack (files.makehumancommunity.org/functional/haireditor.zip, kept in
project files mhpacks/) is two template blends, hair.blend + fur.blend, with 15 fur grooms for the MakeHuman base mesh (full body,
mane, face, head, neck, chest, back, belly, arms, forearms, inner arms, hands, thighs, lower legs, feet). Its fur is Blender
geometry-nodes CURVES, which a browser cannot draw, so this tool uses the editor's own BAKE to turn it into meshes the game can:

  * THE FUR (ewf_fur): the editor's "Body shell" bake target = a copy of the body faces the groom grows from, hovering just over
    the skin, carrying the strands baked into an RGBA texture (fur colour + coverage). The alpha is raised a little (FUR_ALPHA)
    so the 0.5 cut (glTF MASK) keeps most of the strands.
  * (THE TUFTS, cluster-ribbon cards on long grooms, were tried and dropped: see PIECES.)
  * WORN LIKE A PACK GARMENT (bake-mpfb.py write_wear_glb, three-renderer.js buildWear): the fur is grown + baked once on the
    MPFB male; every vertex is anchored to an hm08 body vertex (the shell: the vertex it was copied from; a card: the body
    vertex nearest the card's root, so the whole card moves as one) and takes that vertex's bone weights; each other MPFB body's
    copy = the male copy + that anchor's offset between the two bodies (_D_<BODY>, the compact layout). Category 'underwear', so
    the creator's layers fold it under every garment worn over it; it hides no skin (del = []). The creator's wear tint
    recolours it (grey mask x colour).

Usage:
  pip install bpy==5.2.3 ; git clone --depth 1 https://github.com/makehumancommunity/mpfb2 /tmp/mpfb2   (MPFB >= 2.0.18)
  python3 -I bake-fur.py --mpfb /tmp/mpfb2 [--haireditor <dir with fur.blend | haireditor.zip>] [--only ewf_fur] [--out charactercreation/wear]
  (--haireditor: default = downloaded from files.makehumancommunity.org into /tmp/bake-fur)
Output: <out>/ewf_<name>.glb (R2 Assets/Models/charactercreation/wear/). Notes: docs/notes/character-creator.md "THE FUR".
"""
import argparse, importlib.util, io, json, os, shutil, sys, time, zipfile, urllib.request

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('bake_mpfb', os.path.join(HERE, 'bake-mpfb.py'))
bm = importlib.util.module_from_spec(_spec)
_argv, sys.argv = sys.argv, [sys.argv[0]]
_spec.loader.exec_module(bm)
sys.argv = _argv
import bpy  # noqa: E402
from mathutils.kdtree import KDTree  # noqa: E402

TMP = '/tmp/bake-fur'
HAIREDITOR_URL = 'https://files.makehumancommunity.org/functional/haireditor.zip'
FAST = int(os.environ.get('EW_FUR_FAST', '0'))   # a quick look: this texture size + 2 samples (EW_FUR_FAST=256)
FUR_ALPHA = 1.5            # the shell's baked coverage x this before the 0.5 cut
TUFT_PX = 512              # each tuft groom's cell in the atlas
BROWN = (0.15, 0.12, 0.09, 1.0)
DARK = (0.045, 0.035, 0.025, 1.0)

# id -> label, the bake target, the grooms {fur.blend object: {editor fur setting: value}}, cards settings, texture px
PIECES = {
    'ewf_fur': dict(label='Fur (whole body)', target='BODY_SHELL', px=1024,
                    grooms={'fur_full': dict(length=9.0, thickness=0.0004, clump=0.6, color1=BROWN, color2=DARK)},
                    cards={'cards_body_edge_fade': True}),
    # THE TUFTS were tried (2026-11-03): the editor's "Cluster ribbons" cards on long mane / neck / forearm / shin / cheek
    # grooms (cards_mode CLUSTER_RIBBON, 40 cards a groom, a 3 x 2 atlas). In the game they lay flat on the skin as dark
    # flakes and squares, so they are not shipped; a CARDS piece here still bakes (see bake_piece) if one is wanted again.
}


def haireditor_dir(src):
    """A folder holding fur.blend (+ hair.blend), from --haireditor (a folder or the zip) or the download."""
    if src and os.path.isdir(src):
        for root, _, files in os.walk(src):
            if 'fur.blend' in files:
                return root
    z = src if src and src.endswith('.zip') else os.path.join(TMP, 'haireditor.zip')
    if not os.path.exists(z):
        os.makedirs(TMP, exist_ok=True)
        print('[bake-fur] downloading', HAIREDITOR_URL)
        urllib.request.urlretrieve(HAIREDITOR_URL, z)
    d = os.path.join(TMP, 'haireditor')
    zipfile.ZipFile(z).extractall(d)
    return os.path.join(d, 'hair', 'haireditor')


def install_haireditor(M, src_dir):
    """The editor looks for <MPFB data>/hair/haireditor/{hair,fur}.blend (HairEditorService)."""
    LocationService = M('services.locationservice', 'LocationService')
    dest = os.path.join(LocationService.get_mpfb_data('hair'), 'haireditor')
    os.makedirs(dest, exist_ok=True)
    for f in ('fur.blend', 'hair.blend'):
        if os.path.exists(os.path.join(src_dir, f)) and not os.path.exists(os.path.join(dest, f)):
            shutil.copy(os.path.join(src_dir, f), os.path.join(dest, f))
    return dest


def wear_bodies(M):
    """The five MPFB wear bodies (bake-mpfb.py BODIES, targets baked, game_engine rig): hm08 positions in the GLB frame +
    the male's weights."""
    HS = M('services.humanservice', 'HumanService')
    TS = M('services.targetservice', 'TargetService')
    pos, male = {}, None
    for b in bm.WEAR_BODIES:
        macro = dict(bm.BODIES[b])
        macro['race'] = {'asian': 0.33, 'caucasian': 0.33, 'african': 0.33}
        h = HS.create_human(macro_detail_dict=macro)
        TS.bake_targets(h)
        HS.add_builtin_rig(h, 'game_engine')
        W = np.array(h.matrix_world)
        pos[b] = np.array([v.co[:] for v in h.data.vertices]) @ W[:3, :3].T + W[:3, 3]
        if b == 'male':
            male = h
    return pos, male


def grow(M, piece):
    """A fresh MPFB male (shape keys NOT baked: the grooms were made on the base mesh and bind to it), its rig, the grooms
    applied + set, then the editor's generate + bake. Returns [(groom, card object, baked image path)]."""
    HS = M('services.humanservice', 'HumanService')
    MS = M('services.modifierservice', 'ModifierService')
    hp = importlib.import_module('bl_ext.user_default.mpfb.ui.haireditorpanel.hairproperties')
    macro = dict(bm.BODIES['male'])
    macro['race'] = {'asian': 0.33, 'caucasian': 0.33, 'african': 0.33}
    h = HS.create_human(macro_detail_dict=macro)
    HS.add_builtin_rig(h, 'game_engine')
    out_dir = os.path.join(TMP, 'tex')
    os.makedirs(out_dir, exist_ok=True)
    made = []
    for g, opts in piece['grooms'].items():
        bpy.ops.object.select_all(action='DESELECT')
        bpy.context.view_layer.objects.active = h
        h.select_set(True)
        if bpy.ops.mpfb.apply_fur_operator(hair_asset=g) != {'FINISHED'}:
            raise RuntimeError('apply fur ' + g)
        f = [o for o in bpy.data.objects if o.get(hp.PACK_NAME_PROPERTY) == g][-1]
        for k, v in opts.items():
            if k in hp.DYNAMIC_FUR_PROPS_DEFINITIONS:
                mod, attr, _ = hp.DYNAMIC_FUR_PROPS_DEFINITIONS[k]
                MS.set_node_group_input(f.modifiers[mod], attr, v)
        for n in f.active_material.node_tree.nodes:
            for inp in n.inputs:
                if inp.name == 'Color 1' and 'color1' in opts:
                    inp.default_value = opts['color1']
                if inp.name == 'Color 2' and 'color2' in opts:
                    inp.default_value = opts['color2']
        for k, v in dict(piece['cards'], cards_bake_target=piece['target'], cards_texture_dst=out_dir,
                         cards_resolution=FAST or piece['px'], cards_samples=2 if FAST else 16).items():
            hp.FUR_PROPERTIES.set_value('%s_%s' % (f.name, k), v, entity_reference=h)
        for op in ('generate_hair_cards_operator', 'bake_hair_operator'):
            bpy.ops.object.select_all(action='DESELECT')
            bpy.context.view_layer.objects.active = h
            h.select_set(True)
            t = time.time()
            r = getattr(bpy.ops.mpfb, op)(hair_asset=f.name, is_fur=True)
            print('[bake-fur] %s %s %s %ds' % (g, op, r, time.time() - t))
            if r != {'FINISHED'}:
                raise RuntimeError(op + ' ' + g)
        card = bpy.data.objects[f.name + hp.CARDS_OBJECT_SUFFIX]
        made.append((g, card, os.path.join(out_dir, f.name + '_texture.png')))
    return h, made


def card_mesh(card):
    """The baked card object as triangles in the GLB frame: positions, normals, uvs (the UV map the baked material samples),
    indices, connected parts (one id per vertex)."""
    dg = bpy.context.evaluated_depsgraph_get()
    ev = card.evaluated_get(dg)
    me = ev.to_mesh()
    me.calc_loop_triangles()
    mat = card.active_material
    uvname = None
    if mat and mat.node_tree:
        for n in mat.node_tree.nodes:
            if n.type == 'UVMAP' and n.uv_map:
                uvname = n.uv_map
    uvl = (me.uv_layers.get(uvname) if uvname else None) or me.uv_layers.active or me.uv_layers[0]
    W = np.array(card.matrix_world)
    co = np.array([v.co[:] for v in me.vertices]) @ W[:3, :3].T + W[:3, 3]
    verts, key_of, idx = [], {}, []
    for tri in me.loop_triangles:
        for vi, li, ln in zip(tri.vertices, tri.loops, tri.split_normals):
            u = tuple(uvl.data[li].uv)
            k = (vi, round(u[0], 5), round(u[1], 5))
            j = key_of.get(k)
            if j is None:
                j = key_of[k] = len(verts)
                verts.append((vi, u, ln))
            idx.append(j)
    vsel = np.array([v[0] for v in verts])
    # connected parts over the mesh's own vertices (the cards: one per bundle)
    parent = list(range(len(me.vertices)))
    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a
    for e in me.edges:
        a, b = find(e.vertices[0]), find(e.vertices[1])
        if a != b:
            parent[a] = b
    comp = np.array([find(i) for i in range(len(me.vertices))])[vsel]
    N = np.array([v[2] for v in verts]) @ W[:3, :3].T
    N /= np.maximum(1e-9, np.linalg.norm(N, axis=1))[:, None]
    UV = np.array([(v[1][0], 1.0 - v[1][1]) for v in verts])
    ev.to_mesh_clear()
    return co[vsel], N, UV, np.array(idx), comp


def gl(c):
    return np.stack([c[:, 0], c[:, 2], -c[:, 1]], axis=1)


def bake_piece(M, wid, piece, pos, male, out):
    from PIL import Image
    h, made = grow(M, piece)
    # anchors are skin vertices only (the base mesh's helpers - tights, skirt, joint cubes - sit right over the skin)
    skin = sorted(bm.vgroup_members(male).get('body', []))
    kd = KDTree(len(skin))
    for i in skin:
        kd.insert(pos['male'][i], i)
    kd.balance()
    # the grown body is the baked male (the shape keys at the same macros): check, so an anchor is the right vertex
    mix = h.shape_key_add(name='_mix', from_mix=True)
    hp_ = np.array([d.co[:] for d in mix.data]) @ np.array(h.matrix_world)[:3, :3].T
    h.shape_key_remove(mix)
    print('[bake-fur] grown body vs baked male: max %.5f m' % float(np.abs(hp_[skin] - pos['male'][skin]).max()))
    parts, imgs = [], []
    for g, card, png in made:
        co, N, UV, idx, comp = card_mesh(card)
        # anchors: the shell = the body vertex each vertex was copied from; a card = the body vertex nearest its root
        near = np.array([kd.find(p)[1] for p in co])
        dist = np.array([kd.find(p)[2] for p in co])
        if piece['target'] != 'BODY_SHELL':
            for c in np.unique(comp):
                m = np.where(comp == c)[0]
                near[m] = near[m[np.argmin(dist[m])]]
        parts.append((co, N, UV, idx, near))
        imgs.append(Image.open(png).convert('RGBA'))
    # one texture: the shell's own; the tufts' grooms side by side in an atlas (each cell TUFT_PX)
    if len(imgs) == 1:
        atlas = imgs[0]
        cells = [(0, 0, 1, 1)]
    else:
        cols = int(np.ceil(np.sqrt(len(imgs))))
        rows = int(np.ceil(len(imgs) / cols))
        atlas = Image.new('RGBA', (cols * TUFT_PX, rows * TUFT_PX), (0, 0, 0, 0))
        cells = []
        for k, im in enumerate(imgs):
            c, r = k % cols, k // cols
            atlas.paste(im.resize((TUFT_PX, TUFT_PX), Image.LANCZOS), (c * TUFT_PX, r * TUFT_PX))
            cells.append((c / cols, r / rows, 1 / cols, 1 / rows))
    a = np.array(atlas).astype(np.float32)
    a[..., 3] = np.clip(a[..., 3] * FUR_ALPHA, 0, 255)
    # bleed the colour into the empty texels (mip-mapped edges stay fur-coloured, not black)
    rgb, al = a[..., :3], a[..., 3] > 8
    if al.any():
        rgb[~al] = rgb[al].mean(axis=0)
    atlas = Image.fromarray(a.astype(np.uint8), 'RGBA')
    buf = io.BytesIO()
    atlas.save(buf, 'PNG', optimize=True)
    P, Nn, U, I, A = [], [], [], [], []
    base = 0
    for (co, N, UV, idx, near), (x0, y0, w, hh) in zip(parts, cells):
        P.append(co); Nn.append(N); U.append(np.stack([x0 + UV[:, 0] * w, y0 + UV[:, 1] * hh], axis=1))
        I.append(idx + base); A.append(near); base += len(co)
    co, N, UV, idx, near = np.concatenate(P), np.concatenate(Nn), np.concatenate(U), np.concatenate(I), np.concatenate(A)
    # each body: the male copy + its anchor's offset
    Pm = gl(co)
    morphs = [(b, gl(pos[b][near] - pos['male'][near])) for b in bm.WEAR_BODIES if b != 'male']
    # weights: the anchor's (MPFB names -> Meshy names, Root -> Hips), top 4
    valid = set(bm.BONE_MAP) | {'Root', 'root'}
    gname = {g.index: bm.BONE_MAP.get(g.name, 'Hips' if g.name in ('Root', 'root') else g.name) for g in male.vertex_groups}
    rig = next((o for o in male.children if o.type == 'ARMATURE'), None) or male.parent
    bone_ok = set(b.name for b in rig.data.bones) if rig is not None and rig.type == 'ARMATURE' else valid
    bones, bix = [], {}
    J = np.zeros((len(co), 4), np.float32)
    Wt = np.zeros((len(co), 4), np.float32)
    cache = {}
    for k, vi in enumerate(near):
        if vi not in cache:
            acc = {}
            for g in male.data.vertices[vi].groups:
                nm = male.vertex_groups[g.group].name
                if g.weight > 0 and (nm in bone_ok or nm in ('Root', 'root')) and g.group in gname:
                    acc[gname[g.group]] = acc.get(gname[g.group], 0) + g.weight
            cache[vi] = sorted(acc.items(), key=lambda x: -x[1])[:4] or [('Hips', 1.0)]
        top = cache[vi]
        tot = sum(w for _, w in top) or 1
        for s, (bn, w) in enumerate(top):
            if bn not in bix:
                bix[bn] = len(bones); bones.append(bn)
            J[k, s] = bix[bn]; Wt[k, s] = w / tot
    wear = {'name': wid, 'pack': 'haireditor', 'cat': 'underwear', 'z': 1, 'bones': bones, 'del': [], 'fur': True}
    path = os.path.join(out, wid + '.glb')
    bm.write_wear_glb(path, Pm, gl(N), UV, idx, J, Wt, morphs, buf.getvalue(), 'image/png', True, (1.0, 1.0, 1.0), wear, wid)
    print('[bake-fur] %s: %d verts, %d tris, %d bones, texture %dx%d -> %s (%d KB)' % (
        wid, len(co), len(idx) // 3, len(bones), atlas.size[0], atlas.size[1], path, os.path.getsize(path) // 1024))
    # the scene for the next piece: only the wear bodies stay
    keep = set(o for o in bpy.data.objects if o.get('_ew_wear_body'))
    for o in list(bpy.data.objects):
        if o not in keep:
            bpy.data.objects.remove(o)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mpfb', required=True, help='MPFB2 git checkout (>= 2.0.18, the hair editor)')
    ap.add_argument('--haireditor', default='', help='folder holding fur.blend, or haireditor.zip (default: download)')
    ap.add_argument('--only', default='', help='comma list of piece ids (default: all of PIECES)')
    ap.add_argument('--out', default='charactercreation/wear')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    M = bm.install_mpfb(a.mpfb)
    install_haireditor(M, haireditor_dir(a.haireditor))
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    pos, male = wear_bodies(M)
    for o in bpy.data.objects:
        o['_ew_wear_body'] = True
    only = set(a.only.split(',')) if a.only else set(PIECES)
    for wid, piece in PIECES.items():
        if wid in only:
            bake_piece(M, wid, piece, pos, male, os.path.abspath(a.out))


if __name__ == '__main__':
    main()
