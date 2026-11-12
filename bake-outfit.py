#!/usr/bin/env python3
"""bake-outfit.py - THE MESHY OUTFITS (2026-11-12, docs/notes/character-models-plan.md row 21d; repo-only tooling).

mondo 11-12: "i like route 2 better" (a Meshy T2 remake of a unit, its clothes as separate shells, dressed onto the MPFB body so
the head is the MPFB head: 67 face shapes, eyes, teeth, tongue) + "Go" on putting three of them in the game as saved looks.

IN:  a Meshy Image to 3D GLB of the unit (`model_type smart-topology`, `ai_model meshy-t2`, `pose_mode a-pose`, texture
     `meshy-n1`): one object made of loose shells (hat, coat, trousers, boots, belt, hands, eyeballs ...), and the five MPFB
     bodies as the game loads them (cdn.entropywars.net/Assets/characters/creator/mpfb/mpfb_<body>.glb).
OUT: charactercreation/wear/ewm_t2<unit>_outfit.glb (+ ewm_t2<unit>_hat.glb when the unit wears a hat) in the compact wear
     layout (bake-clothes.py write_glb: POSITION = the male fit, _D_<BODY> the other four), `solid` (three-renderer.js THE
     MESHY PIECES: worn as made, the skin its `del` list names always hidden), Meshy's own texture + normals.

THE FIT (on the unit's own body: male or female):
  1 scale   the Meshy eyeball shells (two tiny mirrored spheres) onto the MPFB eyes
  2 skin    the shell that holds the face: its skin-coloured faces (a flood fill from the eyes, colour within SKIN_T of the
            face's median) + the face box are cut away; what is left above the eyes is the unit's hair (NOT exported: the
            look picks pack hair), below = the collar, which stays whole. Skin-coloured shells at the arm tips = bare hands
            (dropped: the MPFB hands show)
  2b spurs  a horn at the back of a boot (Meshy's spur) is laid flat on the heel
  3 head    hats are sized to the MPFB head about the eyes, lifted so the brim clears the brow, pushed 8 mm off the scalp
  4 limbs   the body's arms + legs are aimed down the Meshy sleeves + trouser legs; the clothes take the posed body's
            weights (nearest face, interpolated; LOOSE CLOTH hanging off the legs - a skirt, a cape - shares its leg weight
            between both legs + the hips) and are un-skinned back to the body's rest pose
  5 hide    a body vertex is hidden when a line along its normal (7 cm out, 45 cm for a leg: a robe / 5 cm in) meets cloth; the head + neck never;
            a hand or foot is hidden whole or not at all (35 %)
  6 bodies  the other four bodies wear the same fit moved by the offsets of the 12 nearest skin vertices

Usage: pip install bpy==5.2.3 scipy pillow
       python3 -I bake-outfit.py --name cowboy --label Cowboy --gender male --src cowboy_t2a.glb --bodies <dir of mpfb_*.glb>
              [--out charactercreation/wear] [--metal 0.0] [--rough 0.8] [--px 2048]
Notes: docs/notes/models-assets.md "THE MESHY OUTFITS".
"""
import argparse, importlib.util, io, math, os, re, sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_sp = importlib.util.spec_from_file_location('bake_clothes', os.path.join(HERE, 'bake-clothes.py'))
BC = importlib.util.module_from_spec(_sp)
_argv, sys.argv = sys.argv, [sys.argv[0]]
_sp.loader.exec_module(BC)            # (+ bake-garment.py as BC.PG, bake-mpfb.py as BC.bm)
sys.argv = _argv
PG, bm, bpy = BC.PG, BC.bm, BC.bpy
import bmesh  # noqa: E402
from mathutils import Vector, Matrix  # noqa: E402
from mathutils.bvhtree import BVHTree  # noqa: E402

E = lambda k, d: float(os.environ.get(k, d))
SKIN_T = E('SKIN_T', 0.20)


def load(p):
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=p)
    for o in [o for o in bpy.data.objects if o not in before]:
        if o.name.startswith('Icosphere'): bpy.data.objects.remove(o)
    new = [o for o in bpy.data.objects if o not in before]
    return [o for o in new if o.type == 'ARMATURE'], [o for o in new if o.type == 'MESH']

def wts(m, n):
    if n not in m.vertex_groups: return np.zeros(len(m.data.vertices))
    gi = m.vertex_groups[n].index
    return np.array([sum(g.weight for g in v.groups if g.group == gi) for v in m.data.vertices])

def apply_xform(o):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

def unparent_keep(o):
    mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    for md in list(o.modifiers):
        if md.type == 'ARMATURE': o.modifiers.remove(md)

def bind(o, arm):
    o.parent = arm; o.matrix_parent_inverse = arm.matrix_world.inverted()
    md = o.modifiers.new('arm', 'ARMATURE'); md.object = arm

def aim(arm, bone, frm, to):
    pb = arm.pose.bones[bone]; bpy.context.view_layer.update(); piv = arm.matrix_world @ pb.head
    q = (frm - piv).rotation_difference(to - piv)
    R = Matrix.Translation(piv) @ q.to_matrix().to_4x4() @ Matrix.Translation(-piv)
    pb.matrix = arm.matrix_world.inverted() @ R @ arm.matrix_world @ pb.matrix; bpy.context.view_layer.update(); return math.degrees(q.angle)

def split_loose(objs):
    before = set(bpy.data.objects)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.separate(type='LOOSE'); bpy.ops.object.mode_set(mode='OBJECT')
    return list(objs) + [o for o in bpy.data.objects if o not in before and o.type == 'MESH']

def face_cols(o, px, w, h):
    me = o.data; uv = me.uv_layers[0].data; out = np.zeros((len(me.polygons), 3))
    for p in me.polygons:
        u = np.mean([uv[l].uv[0] for l in p.loop_indices]); v = np.mean([uv[l].uv[1] for l in p.loop_indices])
        out[p.index] = px[int((v % 1) * (h - 1)), int((u % 1) * (w - 1)), :3]
    return out

def co(o): return np.array([v.co for v in o.data.vertices])

def body_co(path):
    """a body GLB's skin vertices, in the file's order (the five share it: _BASE_INDEX is the same list)"""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _, mm = load(path); b = [m for m in mm if 'hair' not in m.name][0]
    unparent_keep(b); apply_xform(b)
    return co(b)


def fit(name, gender, src, bodies_dir):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    ma, mm = load(os.path.join(bodies_dir, 'mpfb_%s.glb' % gender)); marm = ma[0]
    body = [m for m in mm if 'hair' not in m.name][0]
    for m in mm:
        if m is not body: bpy.data.objects.remove(m)
    unparent_keep(body); apply_xform(body)
    bc = co(body); kbs = body.data.shape_keys.key_blocks
    def moved(k):
        d = np.array([x.co for x in kbs[k].data]) - np.array([x.co for x in kbs[0].data]); return np.linalg.norm(d, axis=1) > 0.002
    eyeM = bc[moved('eyeBlinkLeft') | moved('eyeBlinkRight')].mean(0)
    hwB = wts(body, 'Head') > 0.5; band = hwB & (bc[:, 2] > eyeM[2] - 0.01) & (bc[:, 2] < eyeM[2] + 0.03); headwB = bc[band, 0].max() - bc[band, 0].min()
    base = np.array([d.value for d in body.data.attributes['_BASE_INDEX'].data]).round().astype(int)

    # ---- the Meshy shells ----
    _, ms = load(src)
    for o in ms: unparent_keep(o); apply_xform(o)
    bpy.ops.object.select_all(action='DESELECT'); ms[0].select_set(True); bpy.context.view_layer.objects.active = ms[0]
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.remove_doubles(threshold=1e-5); bpy.ops.object.mode_set(mode='OBJECT')
    img = [n for n in ms[0].material_slots[0].material.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image][0].image
    IW, IH = img.size; PX = np.array(img.pixels[:]).reshape(IH, IW, -1)
    sh = split_loose(ms)
    for o in sh:
        for v in o.data.vertices: v.co.z += 0.5
    cand = []   # the eyes: two tiny shells high up, mirrored
    for o in sh:
        c = co(o); d = c.max(0) - c.min(0)
        if len(o.data.polygons) < 400 and d.max() < 0.03 and c[:, 2].mean() > 0.75: cand.append((c[:, 2].mean(), o, c.mean(0)))
    cand.sort(key=lambda t: -t[0]); best = None
    for i in range(len(cand)):
        for j in range(i + 1, len(cand)):
            a, b = cand[i][2], cand[j][2]
            if abs(a[2] - b[2]) < 0.01 and 0.02 < abs(a[0] - b[0]) < 0.08 and abs(a[0] + b[0]) < 0.03:
                if best is None or min(a[2], b[2]) > best[0]: best = (min(a[2], b[2]), cand[i][1], cand[j][1], (a + b) / 2)
    assert best, 'no eyes found'
    eyeN = best[3]; S = E('S', eyeM[2] / eyeN[2])
    for o in sh:
        for v in o.data.vertices: v.co *= S
    eye = Vector(eyeN * S); eyes = {best[1], best[2]}
    allc = np.vstack([co(o) for o in sh]); xmax = np.abs(allc[:, 0]).max()
    tgt = {'L': Vector(allc[allc[:, 0] > 0.85 * xmax].mean(0)), 'R': Vector(allc[allc[:, 0] < -0.85 * xmax].mean(0))}
    ft = {'L': Vector(allc[(allc[:, 2] < 0.05 * S) & (allc[:, 0] > 0)].mean(0)), 'R': Vector(allc[(allc[:, 2] < 0.05 * S) & (allc[:, 0] < 0)].mean(0))}
    def near_eye(o, r): c = co(o); return int((np.linalg.norm(c - np.array(eye), axis=1) < r).sum())
    headsh = max([o for o in sh if o not in eyes], key=lambda o: near_eye(o, 0.07 * S / 1.9))
    fc = face_cols(headsh, PX, IW, IH); me = headsh.data
    cen = np.array([p.center for p in me.polygons])
    zone = np.linalg.norm(cen - np.array(eye) - np.array([0, 0, -0.03]), axis=1) < 0.05
    skin = np.median(fc[zone], axis=0)
    like = np.linalg.norm(fc - skin, axis=1) < SKIN_T
    bmx = bmesh.new(); bmx.from_mesh(me); bmx.faces.ensure_lookup_table()
    seen = set(int(i) for i in np.nonzero(zone & like)[0]); stack = list(seen)
    while stack:
        f = bmx.faces[stack.pop()]
        for e in f.edges:
            for g in e.link_faces:
                if g.index not in seen and like[g.index]: seen.add(g.index); stack.append(g.index)
    b2 = (cen[:, 2] > eye.z - 0.01) & (cen[:, 2] < eye.z + 0.03) & (np.abs(cen[:, 0] - eye.x) < 0.14) & (np.abs(cen[:, 1] - eye.y - 0.08) < 0.16); headwM = cen[b2, 0].max() - cen[b2, 0].min()
    facez = set(i for i in range(len(cen)) if abs(cen[i, 0] - eye.x) < 0.5 * headwM and eye.z - 0.14 < cen[i, 2] < eye.z + 0.035 and cen[i, 1] < eye.y + 0.05 and E('FACEZ', 1))
    bmesh.ops.delete(bmx, geom=[bmx.faces[i] for i in seen | facez], context='FACES')
    bmesh.ops.delete(bmx, geom=[v for v in bmx.verts if not v.link_faces], context='VERTS'); bmx.to_mesh(me); bmx.free()
    hr = (np.abs(cen[:, 0] - eye.x) < 0.14) & (np.abs(cen[:, 1] - eye.y - 0.08) < 0.17) & (cen[:, 2] > eye.z - 0.02)
    crownM = cen[hr, 2].max(); backM = cen[hr, 1].max()
    rem = split_loose([headsh]) if len(me.polygons) else []
    if not len(me.polygons): bpy.data.objects.remove(headsh)
    hs = E('HS', headwB / headwM); chin = eye.z - 0.115
    hb = bc[hwB]; sz = E('SZ', min(1.5, max(hs, (hb[:, 2].max() - eyeM[2]) / (crownM - eye.z)))); sy = E('SY', min(1.5, max(hs, (hb[:, 1].max() - eyeM[1]) / (backM - eye.y))))
    keep, headp, dropped = [], [], []
    for o in list(sh) + [r for r in rem if r not in sh]:
        if o.name not in bpy.data.objects or o in eyes: continue
        if len(o.data.polygons) == 0: bpy.data.objects.remove(o); continue
        c = co(o); cz = c[:, 2].mean(); cx = c[:, 0].mean(); n = len(o.data.polygons)
        col = np.median(face_cols(o, PX, IW, IH), axis=0)
        isrem = o in rem
        if abs(cx) > 0.8 * xmax and np.linalg.norm(col - skin) < SKIN_T and n < 1600: dropped.append(('hand', n)); bpy.data.objects.remove(o); continue
        hd = math.hypot(cx - eye.x, c[:, 1].mean() - eye.y - 0.08)
        inhead = cz > chin - 0.02 and hd < 0.16
        if isrem and c[:, 2].min() > chin - 0.25 and not (cz > eye.z and n >= 60): dropped.append(('face bit', n)); bpy.data.objects.remove(o); continue
        if inhead and n < 25: dropped.append(('bit', n)); bpy.data.objects.remove(o); continue
        if inhead or (isrem and cz > eye.z): headp.append(o)
        keep.append(o)
    for o in eyes: bpy.data.objects.remove(o)
    # SPURS (2026-11-12, mondo: "the boots have these weird pointy things sticking out the back of them"): Meshy models a spur as
    # a horn fused to the boot. On footwear (a one-sided shell that ends at the floor) nothing below 45 % of its height may
    # stand further back than the heel does at the sole: the horn is laid flat on the heel
    for o in keep:
        c = co(o)
        if not ((c[:, 0] > 0).mean() > 0.97 or (c[:, 0] < 0).mean() > 0.97) or c[:, 2].min() > 0.12 or c[:, 2].max() > 0.62 or not E('SPURS', 1): continue
        z0, hgt = c[:, 2].min(), c[:, 2].max() - c[:, 2].min()
        ylim = c[c[:, 2] < z0 + 0.12 * hgt, 1].max() + 0.004; n_ = 0
        for v in o.data.vertices:
            if v.co.z < z0 + 0.45 * hgt and v.co.y > ylim: v.co.y = ylim; n_ += 1
        if n_: print('[bake-outfit] %s: spur laid flat on a boot heel (%d vertices)' % (name, n_), flush=True)
    for o in headp:   # sized to the MPFB head, eyes on eyes
        for v in o.data.vertices:
            d = v.co - eye
            if v.co.z < chin: f = max(0.0, 1 - (chin - v.co.z) / 0.25); k = 1 + (hs - 1) * f; v.co = Vector(eyeM) + Vector((d.x * k, d.y * k, d.z)) - (Vector(eyeM) - eye) * (1 - f)
            else: kk = E('WIGK', 1.04); v.co = Vector(eyeM) + Vector((d.x * hs * kk, d.y * (sy if d.y > 0 else hs) * kk, d.z * (sz if d.z > 0 else hs) * kk))
    wig = [o for o in headp if min(v.co.z for v in o.data.vertices) < eyeM[2] - 0.03 or o in rem]
    hats = [o for o in headp if o not in wig]
    for o in hats:   # a brim low over the eyes comes up so the face reads
        zb = min(v.co.z for v in o.data.vertices); up = min(max(zb, eyeM[2] + E('BRIM', 0.035)), eyeM[2] + E('BRIMHI', 0.07)) - zb
        for v in o.data.vertices: v.co.z += up
    hf = [p for p in body.data.polygons if all(hwB[i] for i in p.vertices)]
    hbvh = BVHTree.FromPolygons([v.co.copy() for v in body.data.vertices], [list(p.vertices) for p in hf])
    for o in headp:
        for v in o.data.vertices:
            if v.co.z < eyeM[2] - 0.02: continue
            loc, nor, idx, dist = hbvh.find_nearest(v.co)
            if loc is None: continue
            if (v.co - loc).dot(nor) < 0 or dist < E('SCALP', 0.008): v.co = loc + nor * E('SCALP', 0.008)
    print('[bake-outfit] %s: scale %.3f, head x%.2f, %d shells kept, hats %d, hair shells %d (not exported), dropped %s' % (name, S, hs, len(keep), len(hats), len(wig), dropped), flush=True)

    # ---- pose the body into the clothes, hide, weights, un-skin ----
    bind(body, marm); bpy.context.view_layer.update()
    def cent(mask): return Vector(bc[mask].mean(0))
    for sd, arm_, hand, leg, foot, toe in (('L', 'LeftArm', 'LeftHand', 'LeftUpLeg', 'LeftFoot', 'LeftToeBase'), ('R', 'RightArm', 'RightHand', 'RightUpLeg', 'RightFoot', 'RightToeBase')):
        aim(marm, arm_, cent(wts(body, hand) > 0.8), tgt[sd])
        fm = (wts(body, foot) + wts(body, toe)) > 0.8; aim(marm, leg, cent(fm), Vector((ft[sd].x, ft[sd].y, cent(fm).z)))
    dg = bpy.context.evaluated_depsgraph_get(); ev = body.evaluated_get(dg)
    pm = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg); posed = bpy.data.objects.new('posed', pm); bpy.context.scene.collection.objects.link(posed)
    cloth = [o for o in keep if o not in wig]
    vs, fs, off = [], [], 0
    for o in cloth:
        vs += [v.co.copy() for v in o.data.vertices]; fs += [[off + i for i in p.vertices] for p in o.data.polygons]; off += len(o.data.vertices)
    bvh = BVHTree.FromPolygons(vs, fs)
    hw = wts(body, 'Head'); nw = wts(body, 'neck'); ks = set()
    legw = sum(wts(body, n) for n in ('LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg'))
    for v in pm.vertices:
        if hw[v.index] + nw[v.index] > 0.5: ks.add(v.index); continue
        h1 = bvh.ray_cast(v.co + v.normal * 0.001, v.normal, E('RAY_LEG', 0.45) if legw[v.index] > 0.5 else E('RAY_OUT', 0.07)); h2 = bvh.ray_cast(v.co, -v.normal, E('RAY_IN', 0.05))
        if h1[0] is None and h2[0] is None: ks.add(v.index)
    gw = {g.name: wts(body, g.name) for g in body.vertex_groups}
    for names in (('LeftFoot', 'LeftToeBase'), ('RightFoot', 'RightToeBase'), [n for n in gw if n == 'LeftHand' or re.search(r'_l$', n)], [n for n in gw if n == 'RightHand' or re.search(r'_r$', n)]):
        tot = sum(gw[n] for n in names); idx = np.nonzero(tot > 0.5)[0]
        hid = sum(1 for i in idx if i not in ks) / max(1, len(idx))
        if hid > E('ALLHIDE', 0.35): ks -= set(int(i) for i in idx)
        else: ks |= set(int(i) for i in idx)
    # A LEG SEGMENT (thigh, calf) that is mostly under cloth is hidden whole (2026-11-12, mondo: "Knight has slivers of skin
    # outside of her boots where her calves are": her calf is fuller than the greave Meshy made, so strips of it stood outside)
    for n in ('LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg'):
        idx = np.nonzero(gw[n] > 0.5)[0]
        hid = sum(1 for i in idx if i not in ks) / max(1, len(idx))
        if hid > E('LEGHIDE', 0.7): ks -= set(int(i) for i in idx)
    hidden = [i for i in range(len(pm.vertices)) if i not in ks]
    # a hm08 index is hidden only when every file vertex that carries it is
    shown_base = set(int(base[i]) for i in ks)
    hid_base = sorted(set(int(base[i]) for i in hidden) - shown_base)
    amw = marm.matrix_world; amwi = amw.inverted()
    SK = {pb.name: (pb.matrix @ marm.data.bones[pb.name].matrix_local.inverted()) for pb in marm.pose.bones}
    out = {}
    LEG_PAIRS = [('LeftUpLeg', 'RightUpLeg'), ('LeftLeg', 'RightLeg'), ('LeftFoot', 'RightFoot'), ('LeftToeBase', 'RightToeBase')]
    LEGS = [n for p in LEG_PAIRS for n in p]
    # THE SLEEVE TEST (2026-11-12, mondo: "The wizard's robes have two pointy parts near his butt"): in the A pose the hands hang
    # beside the hips, so the robe's skirt there took the hand's + forearm's weights and was pulled out into a point when the
    # arm moved. Cloth keeps arm weights only when it is SLEEVE: joined by the mesh's own edges to the cloth round the upper
    # arm (the skirt joins it only through the torso). The rest takes the weights of the nearest skin that is not arm.
    ARMW = {sd: sum(gw[n] for n in gw if n in (pre + 'Arm', pre + 'ForeArm', pre + 'Hand') or re.search(suf, n)) for sd, pre, suf in (('L', 'Left', r'_l$'), ('R', 'Right', r'_r$'))}
    armw = ARMW['L'] + ARMW['R']
    ARMN = {sd: set(n for n in gw if n in (pre + 'Arm', pre + 'ForeArm', pre + 'Hand') or re.search(suf, n)) for sd, pre, suf in (('L', 'Left', r'_l$'), ('R', 'Right', r'_r$'))}
    pbn = marm.pose.bones
    LINE = {sd: [amw @ pbn[pre + 'Arm'].head, amw @ pbn[pre + 'ForeArm'].head, amw @ pbn[pre + 'Hand'].head, amw @ pbn[pre + 'Hand'].tail] for sd, pre in (('L', 'Left'), ('R', 'Right'))}
    def on_line(sd, q):   # -> (distance to the arm's bone line, how far along it 0 shoulder .. 1 fingertips)
        best = None; run = 0.0; tot = sum((b_ - a_).length for a_, b_ in zip(LINE[sd][:-1], LINE[sd][1:]))
        for a_, b_ in zip(LINE[sd][:-1], LINE[sd][1:]):
            ab = b_ - a_; t_ = max(0.0, min(1.0, (q - a_).dot(ab) / max(1e-9, ab.length_squared))); c_ = a_ + ab * t_
            if best is None or (q - c_).length < best[0]: best = ((q - c_).length, (run + ab.length * t_) / tot)
            run += ab.length
        return best
    from mathutils.kdtree import KDTree
    noarm = [i for i in range(len(pm.vertices)) if armw[i] < 0.2]
    kdb = KDTree(len(noarm))
    for k_, i in enumerate(noarm): kdb.insert(pm.vertices[i].co, k_)
    kdb.balance()
    bwt = [{body.vertex_groups[g.group].name: g.weight for g in v.groups if g.weight > 1e-4} for v in body.data.vertices]
    pbvh = BVHTree.FromPolygons([v.co.copy() for v in pm.vertices], [list(p.vertices) for p in pm.polygons if all(armw[i] < 0.5 for i in p.vertices)])
    unsleeved = 0
    for o in cloth:
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        dt = o.modifiers.new('dt', 'DATA_TRANSFER'); dt.object = posed; dt.use_vert_data = True; dt.data_types_verts = {'VGROUP_WEIGHTS'}; dt.vert_mapping = 'POLYINTERP_NEAREST'
        dt.layers_vgroup_select_src = 'ALL'; dt.layers_vgroup_select_dst = 'NAME'
        bpy.ops.object.datalayout_transfer(modifier='dt'); bpy.ops.object.modifier_apply(modifier='dt')
        if o in headp:
            hg = o.vertex_groups['Head']
            for v in o.data.vertices:
                if v.co.z > eyeM[2] - 0.115:
                    for g in o.vertex_groups: g.remove([v.index])
                    hg.add([v.index], 1.0, 'REPLACE')
        names = {g.index: g.name for g in o.vertex_groups}
        W = []
        # a shell on ONE side of the body (a boot, a greave, a gauntlet, a thigh holster) is on that limb: never loose cloth
        # (2026-11-12, mondo: "the cowboys boots are all messed up when he walks and getting distorted": a boot's sole and
        # heel stand far off the foot's skin, so LOOSE CLOTH gave them to the hips and the other leg). FOOTWEAR (such a shell
        # that ends at the floor) is stiff: its toe weight goes to the foot, so the sole does not fold at the toes.
        xs = np.array([v.co.x for v in o.data.vertices]); zs = np.array([v.co.z for v in o.data.vertices])
        one_side = (xs > 0).mean() > 0.97 or (xs < 0).mean() > 0.97
        footwear = one_side and zs.min() < 0.12 and zs.max() < 0.62
        # the sleeves of this shell: from cloth that is surely sleeve (close round the upper arm, mostly arm weight) along the
        # mesh's edges, never past the armpit (t < 0.1) nor further than 16 cm off the bone line
        sleeve = {'L': set(), 'R': set()}
        if not one_side:
            adj = [[] for _ in o.data.vertices]
            for e in o.data.edges: adj[e.vertices[0]].append(e.vertices[1]); adj[e.vertices[1]].append(e.vertices[0])
            for sd in ('L', 'R'):
                dl = [on_line(sd, v.co) for v in o.data.vertices]
                gi = [g.index for g in o.vertex_groups if g.name in ARMN[sd]]
                seeds = [v.index for v in o.data.vertices if dl[v.index][0] < 0.07 and 0.15 < dl[v.index][1] < 0.5 and sum(g.weight for g in v.groups if g.group in gi) > 0.6]
                seen_ = set(seeds); st_ = list(seeds)
                while st_:
                    for k_ in adj[st_.pop()]:
                        if k_ not in seen_ and dl[k_][0] < 0.16 and dl[k_][1] > 0.1: seen_.add(k_); st_.append(k_)
                sleeve[sd] = seen_
        for v in o.data.vertices:
            M = Matrix(((0,) * 4,) * 4); tw = 0; w = {}
            for g in v.groups:
                n = names[g.group]
                if n in SK and g.weight > 1e-4: w[n] = w.get(n, 0) + g.weight
            # LOOSE CLOTH (a robe's skirt, a cape, a coat's tail): hanging off the legs it must not follow one leg like a trouser
            # leg does (the hem tore into a tent between the knees): the further off the skin, the more of its leg weight goes to
            # the hips and the more the rest is shared between the two legs
            for sd in ('L', 'R'):
                aw = sum(x for n, x in w.items() if n in ARMN[sd])
                if aw < 0.15 or one_side or v.index in sleeve[sd] or not E('SLEEVES', 1): continue   # (a glove, a gauntlet: on its arm)
                rest_ = {}
                for (co_, k_, dist_) in kdb.find_n(v.co, 4):
                    for n, x in bwt[noarm[k_]].items():
                        if n not in ARMN['L'] and n not in ARMN['R'] and n in SK: rest_[n] = rest_.get(n, 0) + x
                tot_ = sum(rest_.values())
                if tot_ <= 0: continue
                w = {n: x for n, x in w.items() if n not in ARMN[sd]}
                for n, x in rest_.items(): w[n] = w.get(n, 0) + x / tot_ * aw
                unsleeved += 1
            lw = sum(w.get(n, 0) for n in LEGS)
            if footwear:
                for t_, f_ in (('LeftToeBase', 'LeftFoot'), ('RightToeBase', 'RightFoot')):
                    if t_ in w: w[f_] = w.get(f_, 0) + w.pop(t_)
            if lw > 0.05 and not one_side:
                loc, nor, idx, dist = pbvh.find_nearest(v.co)
                f = 0.0 if loc is None else min(1.0, max(0.0, (dist - E('LOOSE0', 0.04)) / E('LOOSE1', 0.15)))
                # THE CLOTH OVER A LEG (2026-11-12, mondo: "fix the wizards tall boots showing through his robe"): shared evenly, the
                # skirt stayed behind when a leg stepped forward and the boot came out through its front. Only the cloth BETWEEN the
                # legs is shared now; the cloth in front of, behind and outside a leg keeps most of that leg's weight and goes with it
                sx_ = min(1.0, max(0.0, (abs(v.co.x) - E('LOOSEX0', 0.03)) / E('LOOSEX1', 0.06))); f *= 1 - E('LOOSESIDE', 0.7) * sx_ * sx_ * (3 - 2 * sx_)
                if f > 0:
                    for a_, b_ in LEG_PAIRS:
                        x, y = w.get(a_, 0), w.get(b_, 0); m_ = (x + y) / 2
                        x, y = x + (m_ - x) * f, y + (m_ - y) * f
                        w['Hips'] = w.get('Hips', 0) + (x + y) * f * E('LOOSEHIP', 0.5)
                        w[a_], w[b_] = x * (1 - f * E('LOOSEHIP', 0.5)), y * (1 - f * E('LOOSEHIP', 0.5))
                    w = {k: x for k, x in w.items() if x > 1e-4}
            for n, x in w.items(): M = M + SK[n] * x; tw += x
            if tw > 0: M = M * (1 / tw); v.co = amw @ (M.inverted() @ (amwi @ v.co))
            W.append(w or {'Hips': 1.0})
        me = o.data; me.calc_loop_triangles(); uv = me.uv_layers[0].data
        P = co(o); N = np.array([v.normal for v in me.vertices])
        F = [tuple(t.vertices) for t in me.loop_triangles]
        FUV = [[(uv[l].uv[0], 1.0 - uv[l].uv[1]) for l in t.loops] for t in me.loop_triangles]   # (glTF's v runs down)
        g = out.setdefault('hat' if o in hats else 'outfit', {'P': [], 'N': [], 'F': [], 'FUV': [], 'W': []})
        base_i = sum(len(p) for p in g['P'])
        g['P'].append(P); g['N'].append(N); g['F'] += [tuple(i + base_i for i in f) for f in F]; g['FUV'] += FUV; g['W'] += W
    print('[bake-outfit] %s: %d cloth vertices beside an arm (not round it) taken off the arm' % (name, unsleeved), flush=True)
    for g in out.values():
        g['P'] = np.vstack(g['P']); g['N'] = np.vstack(g['N']); g['F'] = np.array(g['F'])
    from PIL import Image
    im = Image.fromarray((np.clip(PX[::-1, :, :3], 0, 1) * 255).astype(np.uint8), 'RGB')
    return out, hid_base, im


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--name', required=True); ap.add_argument('--label', required=True); ap.add_argument('--gender', default='male')
    ap.add_argument('--src', required=True); ap.add_argument('--bodies', required=True)
    ap.add_argument('--out', default=os.path.join(HERE, 'charactercreation', 'wear'))
    ap.add_argument('--metal', type=float, default=0.0); ap.add_argument('--rough', type=float, default=0.8); ap.add_argument('--px', type=int, default=2048)
    a = ap.parse_args()
    from PIL import Image
    from scipy.spatial import cKDTree
    pieces, hid_base, im = fit(a.name, a.gender, a.src, a.bodies)
    B = {b: body_co(os.path.join(a.bodies, 'mpfb_%s.glb' % b)) for b in bm.WEAR_BODIES}
    tree = cKDTree(B[a.gender])
    rows = []
    for kind, g in pieces.items():
        P0 = g['P']; n = len(P0)
        d, ix = tree.query(P0, k=12); w = 1.0 / (d + 0.01) ** 2; w /= w.sum(1, keepdims=True)
        Ps = {b: (P0 + ((B[b] - B[a.gender])[ix] * w[:, :, None]).sum(1)) for b in bm.WEAR_BODIES}
        px = a.px if kind == 'outfit' else 1024
        buf = io.BytesIO(); im.resize((px, px), Image.LANCZOS).save(buf, 'JPEG', quality=86)
        key = 't2%s_%s' % (a.name, kind); name = 'ewm_' + key
        wear = {'name': name, 'pack': 'entropywars', 'cat': 'hats' if kind == 'hat' else 'equipment', 'z': 56 if kind == 'hat' else 40, 'del': [], 'solid': True,
                'meshy': os.path.basename(a.src), 'accents': [dict(color=[1, 1, 1], rough=a.rough, metal=a.metal)]}
        if kind == 'outfit': wear['del'] = [list(r) for r in _ranges(hid_base)]
        mats = [{'color': [1, 1, 1], 'rough': a.rough, 'metal': a.metal, 'tile': key}]
        keep_vn = PG.vertex_normals
        PG.vertex_normals = lambda V, Fx, _N=g['N']: _N          # (Meshy's own normals: no hard seams)
        try:
            path = os.path.join(a.out, name + '.glb')
            ntri, bones = BC.write_glb(path, Ps, g['F'], g['FUV'], g['W'], np.ones(n), [0] * n, wear, [(key, buf.getvalue())], mats, None)
        finally:
            PG.vertex_normals = keep_vn
        print('[bake-outfit] %-24s %6d tris %5d KB  bones %d  hides %d skin indices' % (name, ntri, os.path.getsize(path) // 1024, len(bones), len(hid_base) if kind == 'outfit' else 0), flush=True)
        rows.append("['%s', '%s %s', '%s', %d]" % (name, a.label, 'hat' if kind == 'hat' else 'outfit', wear['cat'], wear['z']))
    print('EW_MH_WEAR rows: ' + ', '.join(rows))


def _ranges(idx):
    rng = []
    for i in sorted(set(int(x) for x in idx)):
        if rng and rng[-1][1] == i - 1: rng[-1][1] = i
        else: rng.append([i, i])
    return rng


if __name__ == '__main__':
    main()
