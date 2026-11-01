#!/usr/bin/env python3
"""bake-mpfb.py - MPFB2 (MakeHuman for Blender) base bodies for the game (repo-only tooling, 2026-11-01).

mondo's call (11-01): base bodies + face expressions come from MPFB2, Claude runs Blender headless in the
cloud. This builds each base body with Blender's own Python module (pip install bpy==5.2.3, no Blender app,
no GPU) and the MPFB2 source (git clone https://github.com/makehumancommunity/mpfb2), and writes one GLB per
body that the game can load like any Meshy rig:

  * ONE continuous mesh: body + eyeballs + teeth + tongue (MakeHuman's own helper geometry, kept because
    the mouth opens). Every other helper (tights, skirt, hair, lashes, joint cubes, genitals) is cut.
  * The MPFB "game_engine" skeleton, its bones RENAMED to the Meshy names (Hips, Spine02, Spine01, Spine,
    neck, Head, LeftShoulder ... LeftToeBase) so three-renderer.js _ANIMLIB_MAP retargets the shared UAL/MAL
    animation library onto it exactly like a Meshy character. Fingers stay (30 bones the library does not
    drive; they hold MakeHuman's relaxed hand). The Root bone is dropped; its weights go to Hips.
  * Face shape keys (glTF morph targets): with --packs ARKit 52 face units + 15 visemes; without, MakeHuman's expression units: blinks, jaw open, smile, frown,
    pucker, press, wide, brows (EXPRESSIONS).
  * The skin: with --packs, MakeHuman's stock skin + its eyebrow / eyelash / eye-colour proxies drawn INTO the skin
    sheet, plus stock hair as a second alpha-cut skinned mesh (KITS); without, a texture painted procedurally from
    3D (skin, lips, brows, eyes, teeth, tongue). Plain painted underwear either way. 1024 px default.

Usage:
  pip install bpy==5.2.3                         (Python 3.13)
  git clone --depth 1 https://github.com/makehumancommunity/mpfb2 /tmp/mpfb2
  python3 -I bake-mpfb.py --mpfb /tmp/mpfb2 --out charactercreation/mpfb --packs /tmp/mhpacks [--bodies male,female]
  (--packs downloads the CC0 packs there when missing and writes <out>/CREDITS.json)

Output: <out>/mpfb_<body>.glb (upload to R2 Assets/Models/charactercreation/mpfb/). Notes:
docs/notes/models-assets.md "THE MPFB BODIES".
"""
import argparse, math, os, shutil, sys, importlib

import bpy
import addon_utils
import numpy as np

# body id -> MakeHuman macro sliders (0..1). race mix stays even; "proportions" 1 = idealised.
BODIES = {
    'male':   dict(gender=1.0, age=0.5, muscle=0.6, weight=0.5, proportions=0.6, height=0.6, cupsize=0.5, firmness=0.5),
    'female': dict(gender=0.0, age=0.5, muscle=0.5, weight=0.45, proportions=0.6, height=0.5, cupsize=0.5, firmness=0.6),
    'heavy':  dict(gender=1.0, age=0.55, muscle=1.0, weight=1.0, proportions=0.5, height=1.0, cupsize=0.5, firmness=0.5),
    'thin':   dict(gender=0.8, age=0.5, muscle=0.2, weight=0.0, proportions=1.0, height=1.0, cupsize=0.5, firmness=0.5),
    'short':  dict(gender=0.8, age=0.6, muscle=0.6, weight=0.75, proportions=0.0, height=0.0, cupsize=0.5, firmness=0.5),
}
# underwear per body: 'shorts' (boxer, upper thigh), 'briefs' + 'top' (a plain band over the chest)
UNDERWEAR = {'male': ('shorts',), 'female': ('briefs', 'top'), 'heavy': ('shorts',), 'thin': ('shorts',), 'short': ('shorts',)}
SKIN = {'male': (196, 148, 118), 'female': (206, 160, 132), 'heavy': (176, 128, 98), 'thin': (200, 170, 150), 'short': (190, 140, 108)}

# glTF morph target name -> MakeHuman expression unit (targets/expression/units/caucasian/<unit>.target.gz)
EXPRESSIONS = [
    ('blinkLeft', 'eye-left-closure'), ('blinkRight', 'eye-right-closure'),
    ('jawOpen', 'mouth-open'), ('smile', 'mouth-corner-puller'), ('frown', 'mouth-depression'),
    ('pucker', 'mouth-pursing'), ('press', 'mouth-compression'), ('wide', 'mouth-retraction'),
    ('browDownLeft', 'eyebrows-left-down'), ('browDownRight', 'eyebrows-right-down'),
    ('browInnerUpLeft', 'eyebrows-left-inner-up'), ('browInnerUpRight', 'eyebrows-right-inner-up'),
]
LIP_MASK_UNIT = 'mouth-eversion'
# the stock MakeHuman look per body (makehuman_system_assets, CC0): skin, eyebrows, eyelashes, eye colour, hair
KITS = {
    'male':   dict(skin='young_caucasian_male', brows='eyebrow001', lashes='eyelashes01', eyes='brown', hair='short02'),
    'female': dict(skin='young_caucasian_female', brows='eyebrow006', lashes='eyelashes02', eyes='bluegreen', hair='ponytail01'),
    'heavy':  dict(skin='young_african_male', brows='eyebrow009', lashes='eyelashes01', eyes='brown', hair='short04'),
    'thin':   dict(skin='young_asian_male', brows='eyebrow004', lashes='eyelashes01', eyes='grey', hair='short03'),
    'short':  dict(skin='middleage_caucasian_male', brows='eyebrow008', lashes='eyelashes01', eyes='brownlight', hair='short01'),
}
HAIR_PX = 512
TMP = '/tmp/bake-mpfb'
KEEP_HELPERS = ('helper-l-eye', 'helper-r-eye', 'helper-upper-teeth', 'helper-lower-teeth', 'helper-tongue')

# MPFB game_engine bone -> Meshy bone (three-renderer.js _ANIMLIB_MAP column 1)
BONE_MAP = {
    'pelvis': 'Hips', 'spine_01': 'Spine02', 'spine_02': 'Spine01', 'spine_03': 'Spine', 'neck_01': 'neck', 'head': 'Head',
    'clavicle_l': 'LeftShoulder', 'upperarm_l': 'LeftArm', 'lowerarm_l': 'LeftForeArm', 'hand_l': 'LeftHand',
    'clavicle_r': 'RightShoulder', 'upperarm_r': 'RightArm', 'lowerarm_r': 'RightForeArm', 'hand_r': 'RightHand',
    'thigh_l': 'LeftUpLeg', 'calf_l': 'LeftLeg', 'foot_l': 'LeftFoot', 'ball_l': 'LeftToeBase',
    'thigh_r': 'RightUpLeg', 'calf_r': 'RightLeg', 'foot_r': 'RightFoot', 'ball_r': 'RightToeBase',
}


def install_mpfb(src_root):
    """Copy the MPFB2 source into Blender's user extension repo and enable it (headless works: no UI needed)."""
    pkg = os.path.join(src_root, 'src', 'mpfb')
    if not os.path.isdir(pkg):
        sys.exit('no MPFB2 package at ' + pkg)
    dest = os.path.join(bpy.utils.user_resource('EXTENSIONS'), 'user_default', 'mpfb')
    if not os.path.isdir(dest):
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copytree(pkg, dest)
    addon_utils.enable('bl_ext.user_default.mpfb', default_set=True)
    return lambda mod, name: getattr(importlib.import_module('bl_ext.user_default.mpfb.' + mod), name)


def vgroup_members(obj):
    names = {vg.index: vg.name for vg in obj.vertex_groups}
    out = {}
    for v in obj.data.vertices:
        for g in v.groups:
            if g.weight > 0:
                out.setdefault(names[g.group], []).append(v.index)
    return out


def group_center(obj, members, name):
    idx = members.get(name)
    if not idx:
        return None
    co = np.array([obj.data.vertices[i].co[:] for i in idx])
    return co.mean(axis=0)


def build_body(M, body, out_dir, tex_px, data_root, packs, credits):
    HumanService = M('services.humanservice', 'HumanService')
    TargetService = M('services.targetservice', 'TargetService')
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    kit = KITS[body] if packs else None
    macro = dict(BODIES[body])
    macro['race'] = {'asian': 0.33, 'caucasian': 0.33, 'african': 0.33}
    h = HumanService.create_human(macro_detail_dict=macro)
    TargetService.bake_targets(h)                       # the body shape becomes the basis

    rig = HumanService.add_builtin_rig(h, 'game_engine')

    # landmarks (object space, Blender Z up, the body faces -Y) BEFORE the helpers go
    members = vgroup_members(h)
    marks = {k: group_center(h, members, k) for k in (
        'helper-l-eye', 'helper-r-eye', 'joint-mouth', 'joint-pelvis', 'joint-l-upper-leg', 'joint-r-upper-leg',
        'joint-neck', 'joint-spine-1', 'joint-spine-2', 'joint-spine-3', 'joint-l-clavicle', 'joint-r-clavicle',
        'joint-l-shoulder', 'joint-r-shoulder', 'joint-l-knee', 'joint-head')}

    # hair: MakeHuman's stock hair (.mhclo), fitted + weighted to this body by MPFB, BEFORE any face key exists
    hair = None
    if kit and kit.get('hair'):
        hdir = os.path.join(packs, 'sys', 'hair', kit['hair'])
        hair = HumanService.add_mhclo_asset(os.path.join(hdir, kit['hair'] + '.mhclo'), h, asset_type='Hair',
                                            subdiv_levels=0, material_type='MAKESKIN')
        for m in list(hair.modifiers):
            if m.type != 'ARMATURE':
                hair.modifiers.remove(m)
        if hair.data.shape_keys:
            hair.shape_key_clear()
        credits.append(credit('hair', kit['hair'], packs))

    # face shape keys (relative to the baked basis). With the packs: ARKit's 52 face units (faceunits01) + the 15
    # Oculus visemes (visemes02), loaded on the FULL mesh so the eyeLook* units turn the eyeballs too.
    keys = []
    if packs:
        for d, sub in (('fu', 'faceunits'), ('v2', 'visemes')):
            tdir = os.path.join(packs, d, 'targets', sub)
            for f in sorted(os.listdir(tdir)):
                if f.endswith('.target'):
                    TargetService.load_target(h, os.path.join(tdir, f), weight=0.0, name=f[:-7])
                    keys.append(f[:-7])
        credits.append({'part': 'face units', 'asset': 'faceunits01 (52 ARKit face units)', 'author': 'Mika Suominen', 'license': 'CC0',
                        'source': 'https://static.makehumancommunity.org/assets/assetpacks/faceunits01.html'})
        credits.append({'part': 'visemes', 'asset': 'visemes02 (15 visemes)', 'author': 'Mika Suominen', 'license': 'CC0',
                        'source': 'https://static.makehumancommunity.org/assets/assetpacks/visemes02.html'})
    else:
        units = os.path.join(data_root, 'targets', 'expression', 'units', 'caucasian')
        for key, unit in EXPRESSIONS:
            TargetService.load_target(h, os.path.join(units, unit + '.target.gz'), weight=0.0, name=key)
            keys.append(key)
        # a paint-only key: the lips are what MakeHuman's lip-eversion unit moves (removed again before export)
        TargetService.load_target(h, os.path.join(units, LIP_MASK_UNIT + '.target.gz'), weight=0.0, name='_lipmask')

    # eye UVs: the eyeball islands are ~1.5% of the sheet; blow them up into the empty top-left corner
    uv = h.data.uv_layers[0].data
    for side, (ox, oy) in (('helper-l-eye', (0.01, 0.89)), ('helper-r-eye', (0.095, 0.89))):
        vs = set(members.get(side, []))
        loops = [li for p in h.data.polygons if p.vertices[0] in vs for li in p.loop_indices]
        if not loops:
            continue
        a = np.array([uv[li].uv[:] for li in loops])
        lo, hi = a.min(axis=0), a.max(axis=0)
        s = 0.08 / max(hi - lo)
        for li in loops:
            u, v = uv[li].uv
            uv[li].uv = (ox + (u - lo[0]) * s, oy + (v - lo[1]) * s)

    # the stock brows / lashes / eye colour are drawn INTO the skin texture: each proxy vertex is tied to three base
    # mesh vertices (its .mhclo), so it lands on the body's own UV sheet. Needs the FULL mesh's per-vertex UVs.
    layers = []
    if kit:
        full_uv = np.zeros((len(h.data.vertices), 2), np.float32)
        for p in h.data.polygons:
            for vi, li in zip(p.vertices, p.loop_indices):
                full_uv[vi] = uv[li].uv
        for part, sub, name, alpha in (('eyes', 'eyes', 'low-poly', 1.0), ('eyebrows', 'eyebrows', kit['brows'], 0.95),
                                       ('eyelashes', 'eyelashes', kit['lashes'], 0.8)):
            pdir = os.path.join(packs, 'sys', sub, name)
            texf = (os.path.join(packs, 'sys', 'eyes', 'materials', kit['eyes'] + '_eye.png') if part == 'eyes'
                    else mhmat_texture(os.path.join(pdir, name + '.mhmat')))
            layers.append((part, project_proxy(os.path.join(pdir, name + '.mhclo'), os.path.join(pdir, name + '.obj'),
                                               texf, full_uv, tex_px, alpha)))
            credits.append(credit(part, kit['eyes'] if part == 'eyes' else name, packs))

    # cut every helper except eyes / teeth / tongue
    keep = set(members.get('body', []))
    for g in KEEP_HELPERS:
        keep.update(members.get(g, []))
    for m in list(h.modifiers):
        if m.type == 'MASK':
            h.modifiers.remove(m)
    bpy.context.view_layer.objects.active = h
    h.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='DESELECT')
    bpy.ops.object.mode_set(mode='OBJECT')
    for v in h.data.vertices:
        v.select = v.index not in keep
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.delete(type='VERT')
    bpy.ops.object.mode_set(mode='OBJECT')
    members = vgroup_members(h)

    # Root bone out (its weights -> pelvis), rename to Meshy names
    meshes = [h] + ([hair] if hair else [])
    for ob in meshes:
        vgs = ob.vertex_groups
        if 'Root' in vgs:
            root_vg = vgs['Root']
            pel = vgs.get('pelvis') or vgs.new(name='pelvis')
            for v in ob.data.vertices:
                for g in v.groups:
                    if g.group == root_vg.index and g.weight > 0:
                        pel.add([v.index], g.weight, 'ADD')
            vgs.remove(root_vg)
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = rig.data.edit_bones
    if 'Root' in eb:
        for b in eb:
            if b.parent and b.parent.name == 'Root':
                b.parent = None
        eb.remove(eb['Root'])
    bpy.ops.object.mode_set(mode='OBJECT')
    for old, new in BONE_MAP.items():
        if old in rig.data.bones:
            rig.data.bones[old].name = new          # Blender renames the matching vertex group too
        for ob in meshes:
            if old in ob.vertex_groups:
                ob.vertex_groups[old].name = new
    bone_names = set(b.name for b in rig.data.bones)
    for ob in meshes:
        for vg in list(ob.vertex_groups):
            if vg.name not in bone_names:
                ob.vertex_groups.remove(vg)

    skin = None
    if kit:
        skin_png = mhmat_texture(os.path.join(packs, 'sys', 'skins', kit['skin'], kit['skin'] + '.mhmat'))
        skin = load_rgba(skin_png, tex_px)[..., :3]
        credits.append(credit('skin', kit['skin'], packs))
    rgb = paint_texture(h, members, marks, body, tex_px, skin, layers)
    if not kit:
        h.shape_key_remove(h.data.shape_keys.key_blocks['_lipmask'])
    img = save_image(rgb, os.path.join(TMP, 'mpfb_%s_skin.jpg' % body))
    mat = simple_material('mpfb_' + body, img)
    h.data.materials.clear()
    h.data.materials.append(mat)
    for p in h.data.polygons:
        p.material_index = 0
        p.use_smooth = True

    if hair:
        hpng = mhmat_texture(os.path.join(packs, 'sys', 'hair', kit['hair'], kit['hair'] + '.mhmat'))
        hrgba = load_rgba(hpng, HAIR_PX)
        himg = save_image(hrgba, os.path.join(TMP, 'mpfb_%s_hair.png' % body))
        hmat = simple_material('mpfb_' + body + '_hair', himg, alpha=True)
        hair.data.materials.clear()
        hair.data.materials.append(hmat)
        for p in hair.data.polygons:
            p.material_index = 0
            p.use_smooth = True
        hair.name = hair.data.name = 'mpfb_' + body + '_hair'

    h.name = h.data.name = 'mpfb_' + body
    rig.name = rig.data.name = 'Armature'
    out = os.path.join(out_dir, 'mpfb_' + body + '.glb')
    bpy.ops.object.select_all(action='DESELECT')
    for ob in meshes + [rig]:
        ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=out, export_format='GLB', use_selection=True, export_yup=True, export_apply=False,
        export_skins=True, export_morph=True, export_morph_normal=False, export_animations=False,
        export_texcoords=True, export_normals=True, export_materials='EXPORT', export_image_format='AUTO',
        export_jpeg_quality=88, export_def_bones=False, export_influence_nb=4, export_extras=False)
    if hair:
        fix_hair_material(out, hair.name)
    tris = sum(len(p.vertices) - 2 for ob in meshes for p in ob.data.polygons)
    zmax = max(v.co.z for v in h.data.vertices)
    print('[bake-mpfb] %s: %d verts, %d tris, %.2f m tall, %d bones, %d face keys%s -> %s (%d KB)' % (
        body, sum(len(ob.data.vertices) for ob in meshes), tris, zmax, len(rig.data.bones), len(keys),
        (' + hair ' + kit['hair']) if hair else '', out, os.path.getsize(out) // 1024))


def mhmat_texture(path):
    for line in open(path, encoding='utf-8', errors='replace'):
        p = line.split(None, 1)
        if len(p) == 2 and p[0] == 'diffuseTexture':
            return os.path.join(os.path.dirname(path), p[1].strip())
    raise SystemExit('no diffuseTexture in ' + path)


def load_rgba(path, px):
    from PIL import Image
    im = Image.open(path).convert('RGBA')
    if im.size != (px, px):
        im = im.resize((px, px), Image.LANCZOS)
    return np.asarray(im, np.float32)


def save_image(arr, path):
    """numpy (rows top-down, 0..255) -> a JPEG (RGB) or PNG (RGBA) file -> a packed Blender image (the glTF exporter
    keeps the file's own format: the skin ships as JPEG, the hair as PNG for its alpha)."""
    from PIL import Image
    a = np.clip(arr, 0, 255).astype(np.uint8)
    if a.shape[2] == 3:
        Image.fromarray(a, 'RGB').save(path, quality=88)
    else:
        Image.fromarray(a, 'RGBA').save(path)
    img = bpy.data.images.load(path)
    img.pack()
    return img


def simple_material(name, img, alpha=False):
    mat = bpy.data.materials.new(name)
    if hasattr(mat, 'use_nodes') and not mat.node_tree:
        mat.use_nodes = True
    mat.use_backface_culling = not alpha        # skin: glTF doubleSided false (half the fill); hair cards: both sides
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Roughness'].default_value = 1.0
    bsdf.inputs['Metallic'].default_value = 0.0
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = img
    tex.interpolation = 'Linear'
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    if alpha:
        nt.links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha'])
    return mat


def fix_hair_material(path, hair_name):
    """Hair cards are alpha-CUT (glTF MASK 0.5, double-sided), never blended: no sorting, one cheap pass. The hair mesh
    also carries extras.ew_noTwin so the game skips its x-ray / team-outline twins (a hull of a card is a slab)."""
    import json, struct
    b = open(path, 'rb').read()
    jl = struct.unpack_from('<I', b, 12)[0]
    j = json.loads(b[20:20 + jl])
    rest = b[20 + jl:]
    for m in j.get('meshes', []):
        if m.get('name') == hair_name:
            m.setdefault('extras', {})['ew_noTwin'] = True
            for p in m['primitives']:
                mat = j['materials'][p['material']]
                mat['alphaMode'] = 'MASK'
                mat['alphaCutoff'] = 0.5
                mat['doubleSided'] = True
    s = json.dumps(j, separators=(',', ':')).encode()
    s += b' ' * ((4 - len(s) % 4) % 4)
    total = 12 + 8 + len(s) + len(rest)
    open(path, 'wb').write(struct.pack('<4sII', b'glTF', 2, total) + struct.pack('<I4s', len(s), b'JSON') + s + rest)


def credit(part, name, packs):
    import json
    meta = {}
    try:
        meta = json.load(open(os.path.join(packs, 'sys', 'packs', 'makehuman_system_assets.json'))).get(name, {})
    except Exception:
        pass
    return {'part': part, 'asset': name, 'author': meta.get('author', 'makehuman_system'),
            'license': meta.get('license', 'CC0'),
            'source': 'https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html'}


def read_obj(path):
    vs, vts, faces = [], [], []
    for line in open(path, encoding='utf-8', errors='replace'):
        p = line.split()
        if not p:
            continue
        if p[0] == 'v':
            vs.append([float(x) for x in p[1:4]])
        elif p[0] == 'vt':
            vts.append([float(x) for x in p[1:3]])
        elif p[0] == 'f':
            f = []
            for a in p[1:]:
                q = a.split('/')
                f.append((int(q[0]) - 1, int(q[1]) - 1 if len(q) > 1 and q[1] else int(q[0]) - 1))
            faces.append(f)
    return np.array(vs, np.float32), np.array(vts, np.float32), faces


def read_mhclo_refs(path):
    refs, on = [], False
    for line in open(path, encoding='utf-8', errors='replace'):
        s = line.strip()
        if s.startswith('verts'):
            on = True
            continue
        if not on or not s or s.startswith('#'):
            continue
        p = s.split()
        try:
            if len(p) >= 6:
                refs.append(((int(p[0]), int(p[1]), int(p[2])), (float(p[3]), float(p[4]), float(p[5]))))
            elif len(p) == 1:
                refs.append(((int(p[0]),) * 3, (1.0, 0.0, 0.0)))
            else:
                break
        except ValueError:
            break
    return refs


def project_proxy(mhclo, obj, texf, full_uv, px, alpha, ss=4):
    """Rasterise a proxy (brows / lashes / eyes) into the BODY's UV sheet, sampling its own texture: returns a
    premultiplied RGBA layer (px x px, 0..1). Drawn at ss x ss supersampling, then box-filtered (no jaggies)."""
    from PIL import Image
    refs = read_mhclo_refs(mhclo)
    _vs, vts, faces = read_obj(obj)
    ri = np.array([r[0] for r in refs])
    rw = np.array([r[1] for r in refs], np.float32)
    puv = (full_uv[ri] * rw[..., None]).sum(axis=1) / np.maximum(rw.sum(axis=1, keepdims=True), 1e-6)
    tex = np.asarray(Image.open(texf).convert('RGBA'), np.float32) / 255.0
    th, tw = tex.shape[:2]
    S = px * ss
    dst = puv * S
    dst[:, 1] = S - dst[:, 1]
    x0, y0 = np.floor(dst.min(axis=0)).astype(int) - 2
    x1, y1 = np.ceil(dst.max(axis=0)).astype(int) + 2
    x0 -= x0 % ss; y0 -= y0 % ss
    x1 += (-x1) % ss; y1 += (-y1) % ss
    x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, S), min(y1, S)
    acc = np.zeros((y1 - y0, x1 - x0, 4), np.float32)
    for f in faces:
        for k in range(1, len(f) - 1):
            tri = (f[0], f[k], f[k + 1])
            a, b, c = (dst[t[0]] - (x0, y0) for t in tri)
            ta, tb, tc = (vts[t[1]] for t in tri)
            bx0, by0 = np.floor(np.minimum(np.minimum(a, b), c)).astype(int)
            bx1, by1 = np.ceil(np.maximum(np.maximum(a, b), c)).astype(int)
            bx0, by0 = max(bx0, 0), max(by0, 0)
            bx1, by1 = min(bx1, acc.shape[1] - 1), min(by1, acc.shape[0] - 1)
            if bx1 < bx0 or by1 < by0:
                continue
            d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
            if abs(d) < 1e-9:
                continue
            gx, gy = np.meshgrid(np.arange(bx0, bx1 + 1) + 0.5, np.arange(by0, by1 + 1) + 0.5)
            w0 = ((b[1] - c[1]) * (gx - c[0]) + (c[0] - b[0]) * (gy - c[1])) / d
            w1 = ((c[1] - a[1]) * (gx - c[0]) + (a[0] - c[0]) * (gy - c[1])) / d
            w2 = 1 - w0 - w1
            m = (w0 >= 0) & (w1 >= 0) & (w2 >= 0)
            if not m.any():
                continue
            ys, xs = np.nonzero(m)
            su = w0[ys, xs] * ta[0] + w1[ys, xs] * tb[0] + w2[ys, xs] * tc[0]
            sv = w0[ys, xs] * ta[1] + w1[ys, xs] * tb[1] + w2[ys, xs] * tc[1]
            col = bilinear(tex, su * tw - 0.5, (1 - sv) * th - 0.5)
            col[:, 3] *= alpha
            col[:, :3] *= col[:, 3:4]
            cur = acc[ys + by0, xs + bx0]
            acc[ys + by0, xs + bx0] = col + cur * (1 - col[:, 3:4])      # "over", premultiplied
    h_, w_ = acc.shape[:2]
    small = acc.reshape(h_ // ss, ss, w_ // ss, ss, 4).mean(axis=(1, 3))
    layer = np.zeros((px, px, 4), np.float32)
    layer[y0 // ss:y1 // ss, x0 // ss:x1 // ss] = small
    return layer


def bilinear(tex, x, y):
    h, w = tex.shape[:2]
    x = np.clip(x, 0, w - 1.001)
    y = np.clip(y, 0, h - 1.001)
    xi, yi = x.astype(int), y.astype(int)
    fx, fy = (x - xi)[:, None], (y - yi)[:, None]
    return (tex[yi, xi] * (1 - fx) * (1 - fy) + tex[yi, xi + 1] * fx * (1 - fy) +
            tex[yi + 1, xi] * (1 - fx) * fy + tex[yi + 1, xi + 1] * fx * fy)


def paint_texture(h, members, marks, body, px, stock=None, layers=()):
    """Rasterise every triangle into UV space, keep each texel's 3D rest point + part, colour it from 3D. With `stock`
    (a MakeHuman skin, px x px RGB) that skin is the base and its own lips stay; `layers` (project_proxy) lay the
    stock eyes over the eyeballs and the brows + lashes over the face. Returns RGB rows top-down, 0..255."""
    me = h.data
    me.calc_loop_triangles()
    uv = me.uv_layers[0].data
    co = np.array([v.co[:] for v in me.vertices])
    part = np.zeros(len(me.vertices), np.int8)             # 0 skin, 1 eye L, 2 eye R, 3 teeth, 4 tongue
    for pid, g in ((1, 'helper-l-eye'), (2, 'helper-r-eye'), (3, 'helper-upper-teeth'), (3, 'helper-lower-teeth'), (4, 'helper-tongue')):
        part[members.get(g, [])] = pid
    # dominant bone per vertex (where on the body a texel is)
    gname = {vg.index: vg.name for vg in h.vertex_groups}
    dom = np.empty(len(me.vertices), object)
    for v in me.vertices:
        best = max(v.groups, key=lambda g: g.weight, default=None)
        dom[v.index] = gname.get(best.group, '') if best else ''
    torso = {'Hips', 'Spine02', 'Spine01', 'Spine'}
    legs = {'LeftUpLeg', 'RightUpLeg'}
    region = np.array([1 if d in torso else 2 if d in legs else 0 for d in dom], np.int8)

    lipw = None
    keys = me.shape_keys.key_blocks if me.shape_keys else None
    if keys and '_lipmask' in keys:
        d = np.array([k.co[:] for k in keys['_lipmask'].data]) - co
        mag = np.linalg.norm(d, axis=1)
        mag[part != 0] = 0
        lipw = (mag / (mag.max() or 1)).astype(np.float32)
    P = np.zeros((px, px, 3), np.float32)
    L = np.zeros((px, px), np.float32)
    T = np.full((px, px), -1, np.int8)                      # part, -1 = empty
    R = np.zeros((px, px), np.int8)
    for t in me.loop_triangles:
        vi = t.vertices
        uvs = np.array([uv[li].uv[:] for li in t.loops]) * px
        uvs[:, 1] = px - uvs[:, 1]
        x0, y0 = np.floor(uvs.min(axis=0)).astype(int)
        x1, y1 = np.ceil(uvs.max(axis=0)).astype(int)
        x0, y0 = max(x0, 0), max(y0, 0)
        x1, y1 = min(x1, px - 1), min(y1, px - 1)
        if x1 < x0 or y1 < y0:
            continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        a, b, c = uvs
        d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        if abs(d) < 1e-12:
            continue
        w0 = ((b[1] - c[1]) * (gx - c[0]) + (c[0] - b[0]) * (gy - c[1])) / d
        w1 = ((c[1] - a[1]) * (gx - c[0]) + (a[0] - c[0]) * (gy - c[1])) / d
        w2 = 1 - w0 - w1
        m = (w0 >= -0.02) & (w1 >= -0.02) & (w2 >= -0.02)
        if not m.any():
            continue
        p3 = w0[..., None] * co[vi[0]] + w1[..., None] * co[vi[1]] + w2[..., None] * co[vi[2]]
        ys, xs = np.nonzero(m)
        P[ys + y0, xs + x0] = p3[ys, xs]
        T[ys + y0, xs + x0] = part[vi[0]]
        wv = np.stack([w0, w1, w2])[:, ys, xs]
        R[ys + y0, xs + x0] = region[np.array(vi)][wv.argmax(axis=0)]
        if lipw is not None:
            L[ys + y0, xs + x0] = (wv * lipw[np.array(vi)][:, None]).sum(axis=0)

    x, y, z = P[..., 0], P[..., 1], P[..., 2]
    img = np.zeros((px, px, 3), np.float32)
    skin = np.array(SKIN[body], np.float32)
    img[:] = skin if stock is None else stock
    # a little warmth on cheeks / knees / knuckles is too fine for 512 px; keep the skin flat (PS1)
    eyeL, eyeR, mouth = marks['helper-l-eye'], marks['helper-r-eye'], marks['joint-mouth']
    s = T == 0
    # lips: where MakeHuman's pucker target moves the face most (its own data), a soft rosy tint (no lipstick):
    # a narrow band of the mask, faded in over its edge and blended at 55 %
    if lipw is not None and stock is None:
        lw = (np.clip((L - 0.66) / 0.16, 0, 1) ** 1.5) * 0.65 * s
        lip = skin * np.array([0.9, 0.74, 0.72])
        img[:] = img * (1 - lw[..., None]) + lip * lw[..., None]
    # brows: an arched, tapered stroke above each eye, edges anti-aliased (coverage from the distance to the stroke
    # in metres; at 1024 px a texel on the face is ~0.6 mm) and laid over the skin at 80 %, never a solid block
    if eyeL is not None and eyeR is not None and stock is None:
        aa = 0.0009
        for e in (eyeL, eyeR):
            dx = x - e[0]
            sgn = 1 if e[0] > 0 else -1
            t = np.clip((dx * sgn + 0.013) / 0.038, 0, 1)            # 0 inner end .. 1 outer tail
            zc = e[2] + 0.017 + 0.0045 * np.sin(np.pi * np.clip(t * 1.15, 0, 1)) - 0.004 * t
            half = 0.0034 * (1 - 0.65 * t)                             # thick at the head, thin tail
            cov = np.clip((half - np.abs(z - zc)) / aa + 0.5, 0, 1)
            ends = np.clip((dx * sgn + 0.013) / 0.004, 0, 1) * np.clip((0.025 - dx * sgn) / 0.004, 0, 1)
            a_ = cov * ends * 0.8 * s * (y < e[1])
            img[:] = img * (1 - a_[..., None]) + np.array((58, 42, 32), np.float32) * a_[..., None]
    # eyes: sclera / iris / pupil by angle from the eye's forward (-Y) axis
    for pid, e in ((1, eyeL), (2, eyeR)):
        if e is None:
            continue
        m = T == pid
        dv = P[m] - e
        cosang = -dv[:, 1] / (np.linalg.norm(dv, axis=1) + 1e-9)
        col = np.tile(np.array([232, 228, 220], np.float32), (len(cosang), 1))
        col[cosang > math.cos(math.radians(34))] = (92, 64, 40)
        col[cosang > math.cos(math.radians(14))] = (14, 10, 8)
        img[m] = col
    for part_name, lay in layers:
        a_ = lay[..., 3:4]
        if part_name == 'eyes':
            a_ = a_ * ((T == 1) | (T == 2))[..., None]
            img[:] = img * (1 - a_) + (lay[..., :3] / np.maximum(lay[..., 3:4], 1e-6)) * 255.0 * a_
        else:
            img[:] = img * (1 - a_) + lay[..., :3] * 255.0
    img[T == 3] = (226, 220, 200)
    img[T == 4] = (168, 72, 80)
    # underwear
    pel = marks['joint-pelvis']
    legL, legR = marks['joint-l-upper-leg'], marks['joint-r-upper-leg']
    knee = marks['joint-l-knee']
    under = np.array((58, 60, 70), np.float32)
    if pel is not None and legL is not None:
        top = pel[2] + 0.035
        crotch = min(legL[2], legR[2]) - 0.075
        kind = UNDERWEAR[body]
        if 'shorts' in kind:
            low = crotch - 0.07
            band = s & (R > 0) & (z < top) & (z > low)
            img[band] = under
        if 'briefs' in kind:
            ax = np.abs(x)
            low = crotch + np.clip(ax - 0.03, 0, None) * 0.9
            band = s & (R > 0) & (z < top) & (z > low)
            img[band] = under
        if 'top' in kind:
            # centred on the bust: the most forward torso point between the waist and the neck
            neck = marks['joint-neck']
            vz = co[:, 2]
            cand = (region == 1) & (part == 0) & (vz > pel[2] + 0.15) & (vz < (neck[2] if neck is not None else vz.max()) - 0.08)
            bust_z = co[cand][co[cand][:, 1].argmin(), 2] if cand.any() else pel[2] + 0.3
            band = s & (R == 1) & (z > bust_z - 0.07) & (z < bust_z + 0.055)
            img[band] = under
    if stock is not None:
        return img                  # the stock sheet is already padded round its islands
    img[T < 0] = 0
    # dilate 4 px so filtering / mips never pull black across UV seams
    filled = T >= 0
    for _ in range(4):
        acc = np.zeros_like(img)
        n = np.zeros((px, px), np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            sh = np.roll(np.roll(filled, dy, 0), dx, 1)
            acc += np.roll(np.roll(img, dy, 0), dx, 1) * sh[..., None]
            n += sh
        grow = (~filled) & (n > 0)
        img[grow] = acc[grow] / n[grow][:, None]
        filled = filled | grow
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mpfb', required=True, help='MPFB2 git checkout')
    ap.add_argument('--out', default='charactercreation/mpfb')
    ap.add_argument('--bodies', default=','.join(BODIES))
    ap.add_argument('--tex', type=int, default=1024)
    ap.add_argument('--packs', default='', help='MakeHuman pack dir (stock skins/brows/lashes/eyes/hair + ARKit/visemes); '
                    'downloaded there when missing. Empty = the old procedural paint + 12 expression units')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)
    packs = os.path.abspath(a.packs) if a.packs else ''
    if packs:
        fetch_packs(packs)
    M = install_mpfb(a.mpfb)
    data_root = os.path.join(a.mpfb, 'src', 'mpfb', 'data')
    credits = {}
    for body in a.bodies.split(','):
        credits[body.strip()] = []
        build_body(M, body.strip(), os.path.abspath(a.out), a.tex, data_root, packs, credits[body.strip()])
    if packs:
        import json
        cf = os.path.join(a.out, 'CREDITS.json')
        old = json.load(open(cf)) if os.path.exists(cf) else {}
        old.update(credits)
        json.dump(old, open(cf, 'w'), indent=1)


def fetch_packs(packs):
    """The CC0 MakeHuman packs this bake uses, unzipped as sys/ (system assets), fu/ (faceunits01), v2/ (visemes02)."""
    import urllib.request, zipfile
    for sub, url in (('sys', 'https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip'),
                     ('fu', 'https://files.makehumancommunity.org/functional/faceunits01.zip'),
                     ('v2', 'https://files.makehumancommunity.org/functional/visemes02.zip')):
        d = os.path.join(packs, sub)
        if os.path.isdir(d):
            continue
        z = os.path.join(packs, os.path.basename(url))
        if not os.path.exists(z):
            print('[bake-mpfb] downloading', url)
            urllib.request.urlretrieve(url, z)
        zipfile.ZipFile(z).extractall(d)


if __name__ == '__main__':
    main()
