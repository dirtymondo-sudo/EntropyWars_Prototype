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
  * Face shape keys (glTF morph targets) from MakeHuman's expression units: blinks, jaw open, smile, frown,
    pucker, press, wide, brows. Names below in EXPRESSIONS. The visemes / ARKit packs are a separate
    download (files.makehumancommunity.org), not used yet.
  * A small PS1-style skin texture (TEX px, default 512) painted procedurally from 3D: skin, lips, brows,
    eyes (sclera / iris / pupil), teeth, tongue, plain underwear. No outside art: MakeHuman's stock skins
    are a separate download too.

Usage:
  pip install bpy==5.2.3                         (Python 3.13)
  git clone --depth 1 https://github.com/makehumancommunity/mpfb2 /tmp/mpfb2
  python3 -I bake-mpfb.py --mpfb /tmp/mpfb2 --out charactercreation/mpfb [--bodies male,female] [--tex 512]

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


def build_body(M, body, out_dir, tex_px, data_root):
    HumanService = M('services.humanservice', 'HumanService')
    TargetService = M('services.targetservice', 'TargetService')
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
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

    # face shape keys (relative to the baked basis)
    units = os.path.join(data_root, 'targets', 'expression', 'units', 'caucasian')
    for key, unit in EXPRESSIONS:
        TargetService.load_target(h, os.path.join(units, unit + '.target.gz'), weight=0.0, name=key)

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
    vgs = h.vertex_groups
    if 'Root' in vgs:
        root_vg = vgs['Root']
        pel = vgs.get('pelvis') or vgs.new(name='pelvis')
        for v in h.data.vertices:
            for g in v.groups:
                if g.group == root_vg.index and g.weight > 0:
                    pel.add([v.index], g.weight, 'ADD')
        vgs.remove(root_vg)
    bpy.context.view_layer.objects.active = rig
    h.select_set(False)
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
    bone_names = set(b.name for b in rig.data.bones)
    for vg in list(h.vertex_groups):
        if vg.name not in bone_names:
            h.vertex_groups.remove(vg)

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

    img = paint_texture(h, members, marks, body, tex_px)
    mat = bpy.data.materials.new('mpfb_' + body)
    if hasattr(mat, 'use_nodes') and not mat.node_tree:
        mat.use_nodes = True
    mat.use_backface_culling = True             # glTF doubleSided false: half the fill cost
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Roughness'].default_value = 1.0
    bsdf.inputs['Metallic'].default_value = 0.0
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = img
    tex.interpolation = 'Closest'
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    h.data.materials.clear()
    h.data.materials.append(mat)
    for p in h.data.polygons:
        p.material_index = 0
        p.use_smooth = True

    h.name = h.data.name = 'mpfb_' + body
    rig.name = rig.data.name = 'Armature'
    out = os.path.join(out_dir, 'mpfb_' + body + '.glb')
    bpy.ops.object.select_all(action='DESELECT')
    h.select_set(True)
    rig.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=out, export_format='GLB', use_selection=True, export_yup=True, export_apply=False,
        export_skins=True, export_morph=True, export_morph_normal=False, export_animations=False,
        export_texcoords=True, export_normals=True, export_materials='EXPORT', export_image_format='AUTO',
        export_def_bones=False, export_influence_nb=4, export_extras=False)
    tris = sum(len(p.vertices) - 2 for p in h.data.polygons)
    zmax = max(v.co.z for v in h.data.vertices)
    print('[bake-mpfb] %s: %d verts, %d tris, %.2f m tall, %d bones, %d face keys -> %s (%d KB)' % (
        body, len(h.data.vertices), tris, zmax, len(rig.data.bones), len(EXPRESSIONS), out, os.path.getsize(out) // 1024))


def paint_texture(h, members, marks, body, px):
    """Rasterise every triangle into UV space, keep each texel's 3D rest point + part, colour it from 3D."""
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
    if keys and 'pucker' in keys:
        d = np.array([k.co[:] for k in keys['pucker'].data]) - co
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
    img[:] = skin
    # a little warmth on cheeks / knees / knuckles is too fine for 512 px; keep the skin flat (PS1)
    eyeL, eyeR, mouth = marks['helper-l-eye'], marks['helper-r-eye'], marks['joint-mouth']
    s = T == 0
    # lips: where MakeHuman's pucker target moves the face most (a mask from its own data, smooth per texel)
    if lipw is not None:
        lw = np.clip((L - 0.58) / 0.14, 0, 1) * s
        img[:] = img * (1 - lw[..., None]) + (skin * np.array([0.86, 0.66, 0.66])) * lw[..., None]
    # brows: a band above each eye, a touch lower at the outer end
    if eyeL is not None and eyeR is not None:
        for e in (eyeL, eyeR):
            dx = x - e[0]
            sgn = 1 if e[0] > 0 else -1
            outer = np.clip(dx * sgn, 0, None)
            zc = e[2] + 0.021 - outer * 0.15
            brow = s & (np.abs(dx) < 0.025) & (dx * sgn > -0.014) & (np.abs(z - zc) < 0.0042 - outer * 0.08) & (y < e[1])
            img[brow] = (52, 36, 28)
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
    rgba = np.concatenate([img / 255.0, np.ones((px, px, 1), np.float32)], axis=2)[::-1]   # Blender rows go bottom-up
    bimg = bpy.data.images.new('mpfb_skin', px, px, alpha=False)
    bimg.pixels.foreach_set(rgba.astype(np.float32).ravel())
    bimg.file_format = 'PNG'
    bimg.pack()
    return bimg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mpfb', required=True, help='MPFB2 git checkout')
    ap.add_argument('--out', default='charactercreation/mpfb')
    ap.add_argument('--bodies', default=','.join(BODIES))
    ap.add_argument('--tex', type=int, default=512)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    M = install_mpfb(a.mpfb)
    data_root = os.path.join(a.mpfb, 'src', 'mpfb', 'data')
    for body in a.bodies.split(','):
        build_body(M, body.strip(), os.path.abspath(a.out), a.tex, data_root)


if __name__ == '__main__':
    main()
