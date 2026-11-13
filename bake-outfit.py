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
              [--headgear]   (a helmet / cowl that reaches below the eyes is kept as the hat: quarterback)
              [--neckline]   (the bare skin + painted necklace in a low neckline go, the body's skin shows: catgirl)
       env (all off by default, batch 3 of 11-13): EYEAT=x,y,z (no eyeball shells behind goggles: the eyes' middle by hand, the sidekick),
              SLEEVESEED / SLEEVER (how far off the arm a sleeve may start / run: Santa's fur sleeves 0.15 / 0.24, a cape fused to a
              tight sleeve 0.07), RAY_IN=0.12 RAY_OUT=0.12 TORN=9 (a suit jacket narrower than the body's shoulders: politician,
              priest, professor, sheriff), LOCKS=0 (a dark coat or gown read as a hair lock: the witch),
              ARMALLX=0.3 (with --barearms: a bracelet painted on the bare arm goes with the arm, the spy),
              TOPCUT=0.3 (a torn top edge cut level, metres under the eyes: the spy),
              DROPCOL="r,g,b,tol" (a piece fused into the body shell goes by its colour: superhero F's cape),
              CUFF=1 (with HANDCUT: the sleeve end sawn straight across the arm, superhero F),
              SNUG=0.004 (a suit's shoulders laid close on the skin so a creator cape covers them, superhero F),
              HANDCUT=1 (a bare hand fused to its sleeve goes, the body's own hand shows: politician, priest, shaman, telepath, vampire),
              DROP="x,y,z,r;..." (a stray shell left out by hand, its middle r from a point measured from the eyes; SHELLS=1 lists them)
       batch 1 review of 11-13: NOHANDS=1 (the body's own hands show, Meshy's go), WINGKEEP=1 (a collar fused to the wings), NOHELD=1 (nothing in the
              hands), LOCKREM=0, SHELLS=1 (print the shells)
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
from mathutils.kdtree import KDTree  # noqa: E402

E = lambda k, d: float(os.environ.get(k, d))
DROPAT = [[float(v) for v in q.split(',')] for q in os.environ.get('DROPAT', '').split(';') if q.strip()]
SKIN_T = E('SKIN_T', 0.20)
HEADGEAR = False
NECKLINE = False
LONGHAIR = False
BODYSUIT = False
NOWINGS = False
BAREARMS = False
REPAINT = False


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
    _eyes_extra = set()
    if os.environ.get('EYE'):
        # THE EYES GIVEN (2026-11-13, batch 1 of 3: EYE=x,y,z = the middle between the eyes in the T2 file's own coordinates, found by a
        # face landmarker on a front drawing of the T2 model; EYEW = half the eye spacing): Meshy's eyeball shells are not always there,
        # and jewels or buttons can pass for them (the atlantean's whole body was scaled to her earrings). Tiny shells at the eyes go
        ex_, ey_, ez_ = [float(v) for v in os.environ['EYE'].split(',')]; ez_ += 0.5; ew_ = E('EYEW', 0.032)
        for z_, o_, c_ in cand:
            if min(np.linalg.norm(c_ - np.array([ex_ + sg * ew_, ey_, ez_])) for sg in (-1, 1)) < 0.03: _eyes_extra.add(o_)
        for o_ in sh:   # (the figure onto the middle line: a trident or a cape on one side moves Meshy's centre off the body)
            for v_ in o_.data.vertices: v_.co.x -= ex_
        ex_ = 0.0
        best = (ez_, None, None, np.array([ex_, ey_, ez_]))
        print('[bake-outfit] %s: eyes given at %.3f %.3f %.3f, %d eye shells' % (name, ex_, ey_, ez_, len(_eyes_extra)), flush=True)
    if not best and os.environ.get('EYEAT'):   # (EYEAT=x,y,z, off: a unit whose eyes are behind goggles has no eyeball shells; the eyes' middle is given by hand, in the remake's own metres from its feet)
        best = (0, None, None, np.array([float(x) for x in os.environ['EYEAT'].split(',')]) + np.array([0, 0, min(co(o)[:, 2].min() for o in sh)]))
    if not best and os.environ.get('EYEH'):   # NO EYE SHELLS (Meshy fused them into the face: a hat's shadow, a squint): env EYEH = the eyes' height as a part of the figure's (off by default)
        allv = np.vstack([co(o) for o in sh]); ez = allv[:, 2].min() + E('EYEH', 0.93) * (allv[:, 2].max() - allv[:, 2].min())
        fr = allv[(np.abs(allv[:, 0]) < 0.04) & (np.abs(allv[:, 2] - ez) < 0.015)]
        best = (ez, None, None, np.array([0.0, float(fr[:, 1].min()) + 0.012, ez]))
    if not best:
        # NO EYEBALL SHELLS (2026-11-13, antihero / astronaut: a cowl or a visor, or a T2 run that fused the eyes into the head): the
        # eyes are placed from the crown of the head instead: the MPFB body's own eye height / crown height, on the middle line, at the
        # front of the head. EYEHAT = how far (Meshy units, before the scale) the crown found is above the real skull (a hat, horns)
        allv = np.vstack([co(o) for o in sh]); mid = allv[np.abs(allv[:, 0]) < 0.03]
        crown = mid[:, 2].max() - E('EYEHAT', 0.0); ez = crown * (eyeM[2] / bc[hwB][:, 2].max()) * E('EYEK', 1.0)
        fr = allv[(np.abs(allv[:, 0]) < 0.05) & (np.abs(allv[:, 2] - ez) < 0.015)]
        ey = fr[:, 1].min() + E('EYEIN', 0.012)
        class _NoEye: pass
        best = (ez, None, None, np.array([0.0, ey, ez]))
        print('[bake-outfit] %s: no eyeball shells, eyes placed from the crown at z %.3f y %.3f' % (name, ez, ey), flush=True)
    eyeN = best[3]; S = E('S', eyeM[2] / eyeN[2])
    for o in sh:
        for v in o.data.vertices: v.co *= S
    eye = Vector(eyeN * S); eyes = ({best[1], best[2]} - {None}) | _eyes_extra
    if NOWINGS:   # Meshy centres the whole model, wings and all, so the figure stands off the middle: back onto the body's eyes and the floor
        dy_ = eyeM[1] - eye.y; body_ = [o for o in sh if co(o)[:, 1].mean() + dy_ <= eyeM[1] + E('WINGY', 0.22)]
        dz_ = -min(co(o)[:, 2].min() for o in body_)
        for o in sh:
            for v in o.data.vertices: v.co.y += dy_; v.co.z += dz_
        eye = eye + Vector((0, dy_, dz_))
    # THE PAINTED-ON PIECE (env DROPCOL="r,g,b,tol"; 2026-11-13, superhero F, mondo: "super jagged sleeves and cape": her cape is one
    # shell with the suit and hangs over the arms, so no shell can be dropped): every face of a big shell (1000 faces) whose colour
    # lies within tol of r,g,b goes (DROPCOS: + its shaded folds, the same hue darker; off), and the look wears the creator's piece
    # in its place. Done before the limbs are measured: with the cape left in, its hem was read as her hands + feet, the body's arms
    # and legs were aimed at it and stood outside the sleeves and boots. SHELLS=1 prints each big shell's back colour
    if os.environ.get('DROPCOL'):
        dc_ = [float(x) for x in os.environ['DROPCOL'].split(',')]
        for o in sh:
            me_ = o.data
            if len(me_.polygons) < 1000: continue
            fc_ = face_cols(o, PX, IW, IH)
            if E('SHELLS', 0):
                cb_ = np.array([p.center for p in me_.polygons]); print('[bake-outfit] %s: shell %d faces, back colour %s' % (name, len(fc_), np.round(np.median(fc_[cb_[:, 1] > eye.y + 0.2], axis=0), 3)), flush=True)
            nr_ = np.linalg.norm(fc_, axis=1); cut_ = (np.linalg.norm(fc_ - np.array(dc_[:3]), axis=1) < dc_[3]) | ((nr_ > E('DROPDARK', 0.05)) & ((fc_ @ np.array(dc_[:3])) / (nr_ * np.linalg.norm(dc_[:3]) + 1e-9) > E('DROPCOS', 2)))
            if cut_.any() and not cut_.all():
                bmh = bmesh.new(); bmh.from_mesh(me_); bmh.faces.ensure_lookup_table()
                bmesh.ops.delete(bmh, geom=[bmh.faces[i] for i in np.nonzero(cut_)[0]], context='FACES')
                bmesh.ops.delete(bmh, geom=[v for v in bmh.verts if not v.link_faces], context='VERTS'); bmh.to_mesh(me_); bmh.free()
                print('[bake-outfit] %s: %d faces of a painted-on piece cut by colour' % (name, int(cut_.sum())), flush=True)
    allc = np.vstack([co(o) for o in sh if not (NOWINGS and co(o)[:, 1].mean() > eye.y + E('WINGY', 0.22))]); xmax = np.abs(allc[:, 0]).max()   # (never the wings: the hands are the widest point)
    tgt = {'L': Vector(allc[allc[:, 0] > 0.85 * xmax].mean(0)), 'R': Vector(allc[allc[:, 0] < -0.85 * xmax].mean(0))}
    ft = {'L': Vector(allc[(allc[:, 2] < 0.05 * S) & (allc[:, 0] > 0)].mean(0)), 'R': Vector(allc[(allc[:, 2] < 0.05 * S) & (allc[:, 0] < 0)].mean(0))}
    def near_eye(o, r): c = co(o); return int((np.linalg.norm(c - np.array(eye), axis=1) < r).sum())
    headsh = max([o for o in sh if o not in eyes], key=lambda o: near_eye(o, 0.07 * S / 1.9))
    fc = face_cols(headsh, PX, IW, IH); me = headsh.data
    cen = np.array([p.center for p in me.polygons])
    zone = np.linalg.norm(cen - np.array(eye) - np.array([0, 0, -0.03]), axis=1) < 0.05
    skin = np.median(fc[zone], axis=0)
    like = np.linalg.norm(fc - skin, axis=1) < SKIN_T
    # THE BODY SUIT (--bodysuit; 2026-11-12, mummy: bandages the colour of her skin, with skin showing between them: the colour
    # flood from the face either took her chest wraps with it or took nothing): no colour test. The head goes by place (from
    # BSNECK under the chin up) and so do the hands (past BSHAND of the arm span); everything else, painted skin included, is
    # the outfit and hides the body under it
    if BODYSUIT: like = (cen[:, 2] > eye.z - 0.115 - E('BSNECK', 0.04)) & (np.abs(cen[:, 0] - eye.x) < 0.2)
    bmx = bmesh.new(); bmx.from_mesh(me); bmx.faces.ensure_lookup_table()
    seen = set(int(i) for i in np.nonzero(zone & like)[0]); stack = list(seen)
    while stack:
        f = bmx.faces[stack.pop()]
        for e in f.edges:
            for g in e.link_faces:
                if g.index not in seen and like[g.index]: seen.add(g.index); stack.append(g.index)
    b2 = (cen[:, 2] > eye.z - 0.01) & (cen[:, 2] < eye.z + 0.03) & (np.abs(cen[:, 0] - eye.x) < 0.14) & (np.abs(cen[:, 1] - eye.y - 0.08) < 0.16); headwM = cen[b2, 0].max() - cen[b2, 0].min()
    facez = set(i for i in range(len(cen)) if abs(cen[i, 0] - eye.x) < 0.5 * headwM and eye.z - 0.14 < cen[i, 2] < eye.z + 0.035 and cen[i, 1] < eye.y + 0.05 and E('FACEZ', 1))
    if BODYSUIT: seen |= set(int(i) for i in np.nonzero(np.abs(cen[:, 0]) > E('BSHAND', 0.82) * xmax)[0])
    # THE BARE ARMS (--barearms; 2026-11-12, angel: a sleeveless dress; the arms are one shell with the dress but the flood from
    # the face never reaches them, the dress lies between): the skin-coloured faces ARMX out from the middle, down to ARMZ under the
    # eyes (not the feet), go too, so the body's own arms show
    if BAREARMS: seen |= set(int(i) for i in np.nonzero(like & (np.abs(cen[:, 0] - eye.x) > E('ARMX', 0.05)) & (cen[:, 2] > eye.z - E('ARMZ', 0.85)))[0])
    # (env ARMALLX; 2026-11-13, spy, mondo: "hand looks disconnected from rest of body": a bracelet painted on the bare arm stayed as
    # a pale ring round the wrist) every face of the shell further than ARMALLX from the middle goes, whatever its colour
    if BAREARMS and E('ARMALLX', 0): seen |= set(int(i) for i in np.nonzero((np.abs(cen[:, 0] - eye.x) > E('ARMALLX', 0)) & (cen[:, 2] > eye.z - E('ARMZ', 0.85)))[0])
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
        try: o.name
        except ReferenceError: continue   # (the face's shell, emptied by the cut and removed above)
        if o.name not in bpy.data.objects or o in eyes: continue
        if len(o.data.polygons) == 0: bpy.data.objects.remove(o); continue
        c = co(o); cz = c[:, 2].mean(); cx = c[:, 0].mean(); n = len(o.data.polygons)
        col = np.median(face_cols(o, PX, IW, IH), axis=0)
        isrem = o in rem
        if os.environ.get('SHELLS'): print('[shell] n=%d dz=%.2f..%.2f (mid %.2f) x=%.2f y=%.2f rem=%d col=%s dskin=%.2f' % (n, c[:, 2].min() - eye.z, c[:, 2].max() - eye.z, cz - eye.z, cx, c[:, 1].mean() - eye.y, isrem, np.round(col, 2), np.linalg.norm(col - skin)), flush=True)   # (SHELLS=1: every shell as the sorter sees it)
        # NO WEAPONS IN AN OUTFIT (2026-11-13, mondo: "dont give her a sword ... characters will hold those weapons, dont make them
        # part of the outfit"): env DROPAT='x,y,z,r;...' leaves out every loose shell whose middle is within r of a point (the
        # remake's own space, as env SHELLS=1 prints them). Off by default
        if os.environ.get('SHELLS'): print('SHELL', n, c.mean(0).round(2), (c.max(0) - c.min(0)).round(2), col.round(2))
        if any(np.linalg.norm(c.mean(0) - np.array(q[:3])) < q[3] for q in DROPAT): dropped.append(('named (DROPAT)', n)); bpy.data.objects.remove(o); continue
        if abs(cx) > 0.8 * xmax and np.linalg.norm(col - skin) < SKIN_T and n < 1600:
            # THE GLOVE ON A BARE HAND (2026-11-12, robinhood: fingerless gloves; Meshy fuses the glove to the hand): only the
            # skin-coloured faces go; what is left (the glove's cuff + back) stays when it is a real piece (env GLOVE, faces)
            fc_ = face_cols(o, PX, IW, IH); sk_ = np.linalg.norm(fc_ - skin, axis=1) < SKIN_T
            if (~sk_).sum() >= E('GLOVE', 150):
                bmg = bmesh.new(); bmg.from_mesh(o.data); bmg.faces.ensure_lookup_table()
                bmesh.ops.delete(bmg, geom=[bmg.faces[i] for i in np.nonzero(sk_)[0]], context='FACES')
                bmesh.ops.delete(bmg, geom=[v for v in bmg.verts if not v.link_faces], context='VERTS'); bmg.to_mesh(o.data); bmg.free()
                dropped.append(('hand skin, glove kept', int(sk_.sum()))); keep.append(o); continue
            dropped.append(('hand', n)); bpy.data.objects.remove(o); continue
        # IN THE HAND (NOHELD=1, off; 2026-11-13, mondo: "dont give her a sword ... characters will hold those weapons, dont make them part of
        # the outfit"; the cowgirl came with a revolver in each hand): every face out at the hands (past NOHELDX of the arm span) goes
        if E('NOHELD', 0):   # (face by face: Meshy fuses the gun to the hand's shell)
            cen_ = np.array([p_.center for p_ in o.data.polygons]); go_ = np.abs(cen_[:, 0]) > E('NOHELDX', 0.8) * xmax
            if go_.all(): dropped.append(('in the hand', n)); bpy.data.objects.remove(o); continue
            if go_.any():
                bmn = bmesh.new(); bmn.from_mesh(o.data); bmn.faces.ensure_lookup_table()
                bmesh.ops.delete(bmn, geom=[bmn.faces[i] for i in np.nonzero(go_)[0]], context='FACES')
                bmesh.ops.delete(bmn, geom=[v for v in bmn.verts if not v.link_faces], context='VERTS'); bmn.to_mesh(o.data); bmn.free()
                dropped.append(('in the hand', int(go_.sum()))); c = co(o); cz = c[:, 2].mean(); cx = c[:, 0].mean(); n = len(o.data.polygons)
        # THE WINGS (--nowings; 2026-11-12, angel: Meshy gives her wings as flat sheets on red arms): a shell that sits wholly
        # behind her back (its middle WINGY behind the eyes) is left out; the look wears the creator's own Wings instead
        if NOWINGS and not isrem and c[:, 1].mean() > eye.y + E('WINGY', 0.22):
            # THE COLLAR ON THE WINGS (WINGKEEP=1, off; 2026-11-13, annunaki, mondo: "needs the gold bling plate/necklace thing"): Meshy made
            # his gold collar plate one shell with the wings, so --nowings took it too. The faces of a wing shell round the neck (WINGKX
            # to the side, WINGKY behind the eyes, WINGKZ under them) stay as a piece of the outfit; small islands of them go
            if E('WINGKEEP', 0) and n > 1000:
                cen_ = np.array([p_.center for p_ in o.data.polygons])
                k_ = (np.abs(cen_[:, 0] - eye.x) < E('WINGKX', 0.3)) & (cen_[:, 1] < eye.y + E('WINGKY', 0.24)) & (cen_[:, 2] > eye.z - E('WINGKZ', 0.5))
                if k_.sum() > 150:
                    bmw = bmesh.new(); bmw.from_mesh(o.data); bmw.faces.ensure_lookup_table()
                    bmesh.ops.delete(bmw, geom=[bmw.faces[i] for i in np.nonzero(~k_)[0]], context='FACES')
                    bmesh.ops.delete(bmw, geom=[v for v in bmw.verts if not v.link_faces], context='VERTS'); bmw.to_mesh(o.data); bmw.free()
                    parts_ = split_loose([o]); big_ = max(parts_, key=lambda q: len(q.data.polygons))
                    for q in parts_:
                        if q is not big_ and len(q.data.polygons) < E('WINGKISLE', 60): bpy.data.objects.remove(q)
                        else: keep.append(q)
                    dropped.append(('wing, its collar kept', int(k_.sum()))); continue
            dropped.append(('wing', n)); bpy.data.objects.remove(o); continue
        # A FLAKE (2026-11-12, catgirl: a skin-coloured chip floating beside a boot): a shell of a few faces, a few cm across
        if n < E('FLAKE', 30) and (c.max(0) - c.min(0)).max() < 0.04 * S / 1.9 and not (cz > chin - 0.02): dropped.append(('flake', n)); bpy.data.objects.remove(o); continue
        hd = math.hypot(cx - eye.x, c[:, 1].mean() - eye.y - 0.08)
        inhead = (cz > chin - 0.02 and hd < 0.16) or ((c[:, 2].min() > eye.z + E('EARZ', 0.08) or cz > eye.z + E('HORNZ', 0.03)) and hd < E('EARR', 0.3))   # (+ a shell wholly above the brow, out to the side: the bunny girl's second ear went as 'long hair', a demon's curled horn stayed in her outfit, 11-13)
        if isrem and c[:, 2].min() > chin - 0.25 and not (cz > eye.z and n >= 60): dropped.append(('face bit', n)); bpy.data.objects.remove(o); continue
        if inhead and n < 25: dropped.append(('bit', n)); bpy.data.objects.remove(o); continue
        # THE BARE HAND ON A SLEEVE (env HANDCUT=1; 2026-11-13, mondo across the remake batches: "fingers look messed up": where Meshy
        # fuses a bare hand to its sleeve the hand is not a shell of its own, so it stayed, hid the body's hand and the unit kept Meshy's
        # mitten fingers): past the wrist (HANDLEN in from the arm's tip) a side whose faces are mostly skin-coloured (HANDSKIN) loses
        # all of them, nails and shading too, so the body's own hand shows. A glove is not skin-coloured and stays
        if E('HANDCUT', 0) and not inhead and np.abs(c[:, 0]).max() > xmax - E('HANDLEN', 0.12):
            me_ = o.data; cen_ = np.array([p.center for p in me_.polygons]); fc_ = face_cols(o, PX, IW, IH); cut_ = np.zeros(len(cen_), bool)
            cuffs_ = []
            for sg_ in (-1, 1):
                sel_ = cen_[:, 0] * sg_ > xmax - E('HANDLEN', 0.12)
                if sel_.sum() >= 40 and (np.linalg.norm(fc_[sel_] - skin, axis=1) < SKIN_T).mean() > E('HANDSKIN', 0.6):
                    cut_ |= sel_
                    # THE LEVEL CUFF (env CUFF=1; superhero F, mondo: "super jagged sleeves"): the cut above follows the painted wrist line
                    # and leaves saw teeth. The sleeve is sawn straight across the arm where the skin colour starts instead
                    if E('CUFF', 0):
                        zl_ = cen_[sel_, 2].min() - 0.01; arm_ = (cen_[:, 0] * sg_ > xmax - E('CUFFARM', 0.22)) & (cen_[:, 2] > zl_); ax_ = np.linalg.svd(cen_[arm_] - cen_[arm_].mean(0))[2][0]; ax_ = ax_ * (1 if ax_[0] * sg_ > 0 else -1)
                        sk_ = arm_ & (np.linalg.norm(fc_ - skin, axis=1) < SKIN_T); t_ = cen_ @ ax_
                        if E('SHELLS', 0): print('[bake-outfit] cuff', sg_, np.round(ax_, 2), 'xmax %.2f' % xmax, 'arm faces', int(arm_.sum()), 'skin', int(sk_.sum()), 'skin t', np.round(np.percentile(t_[sk_], [0, 3, 50, 100]), 3), 'arm t', np.round(np.percentile(t_[arm_], [0, 50, 100]), 3), flush=True)
                        cuffs_.append((sg_, ax_, np.percentile(t_[sel_], 1) - E('CUFFIN', 0.004), zl_))
            if cut_.all(): dropped.append(('hand', n)); bpy.data.objects.remove(o); continue
            if cut_.any():
                bmh = bmesh.new(); bmh.from_mesh(me_); bmh.faces.ensure_lookup_table()
                bmesh.ops.delete(bmh, geom=[bmh.faces[i] for i in np.nonzero(cut_)[0]], context='FACES')
                for sg_, ax_, t0_, zl_ in cuffs_:
                    fs_ = [f for f in bmh.faces if f.calc_center_median().x * sg_ > xmax - E('CUFFARM', 0.22) and f.calc_center_median().z > zl_]
                    gm_ = list(set(v for f in fs_ for v in f.verts)) + list(set(e for f in fs_ for e in f.edges)) + fs_
                    bmesh.ops.bisect_plane(bmh, geom=gm_, plane_co=tuple(float(x) for x in ax_ * t0_), plane_no=tuple(float(x) for x in ax_), clear_outer=True)
                bmesh.ops.delete(bmh, geom=[v for v in bmh.verts if not v.link_faces], context='VERTS'); bmh.to_mesh(me_); bmh.free()
                dropped.append(('bare hand cut off a sleeve', int(cut_.sum())))
        if inhead or (isrem and cz > eye.z): headp.append(o)
        keep.append(o)
    for o in eyes: bpy.data.objects.remove(o)
    # (env DROP = "x,y,z,r;..." from the eyes, in metres; 2026-11-13, spy: Meshy left a grey lump on her shoulder and, with ARMALLX, a
    # bracelet shell hanging in the air by the bare wrist) a shell whose middle lies within r of the point is left out. SHELLS=1 lists them
    for o in list(keep):
        c_ = co(o).mean(0) - np.array(eye)
        if E('SHELLS', 0): print('[bake-outfit] %s: shell %5d faces at %+.3f %+.3f %+.3f from the eyes%s' % (name, len(o.data.polygons), c_[0], c_[1], c_[2], ' (head)' if o in headp else ''), flush=True)
        for sp_ in [x for x in os.environ.get('DROP', '').split(';') if x]:
            q_ = [float(x) for x in sp_.split(',')]
            if np.linalg.norm(c_ - np.array(q_[:3])) < q_[3] and o in keep:
                dropped.append(('by hand', len(o.data.polygons))); keep.remove(o); headp[:] = [h for h in headp if h is not o]; bpy.data.objects.remove(o)
    # (env TOPCUT = metres under the eyes; 2026-11-13, spy, mondo: "dress straps are messed up": her halter straps are painted on the
    # skin, so they went with it and the dress's top edge was left torn) every big shell (TOPCUTN faces) that is not on the head is
    # cut level there: a straight strapless top; the look wears a creator halter under it for the straps
    if E('TOPCUT', 0):
        for o in keep:
            if o in headp or len(o.data.polygons) < E('TOPCUTN', 1000): continue
            bmt = bmesh.new(); bmt.from_mesh(o.data)
            bmesh.ops.bisect_plane(bmt, geom=bmt.verts[:] + bmt.edges[:] + bmt.faces[:], plane_co=(0, 0, eye.z - E('TOPCUT', 0)), plane_no=(0, 0, 1), clear_outer=True)
            bmesh.ops.triangulate(bmt, faces=bmt.faces[:]); bmt.to_mesh(o.data); bmt.free()
    # THE BARE NECKLINE (--neckline; 2026-11-12, catgirl, mondo: "the necklace looks messed up or painted on"): Meshy gives the bare
    # skin in a low neckline as part of the top's shell, with the necklace smeared into its texture and the choker as a few spiky
    # shards. With --neckline the skin-coloured faces from the chin down to the top of the bust go (a flood fill from the throat),
    # with whatever they enclose (the painted pendant) and the small shells round the neck (the choker): the body's own skin shows
    # there and the look wears a real pendant piece
    if NECKLINE:
        z1, z0 = chin + 0.02, chin - E('NECKZ', 0.26)
        for o in list(keep):
            c = co(o); n = len(o.data.polygons)
            if n < E('CHOKER', 200) and c[:, 2].min() > chin - 0.14 and c[:, 2].max() < chin + 0.04 and np.abs(c[:, 0]).max() < 0.08 and o not in headp:
                dropped.append(('choker', n)); keep.remove(o); bpy.data.objects.remove(o); continue
            if o in headp: continue
            # the throat itself (round 2, mondo: "what are all those jagged black spots around her neck"): the neck in the chin's
            # shadow is painted dark, the harness straps and the cross are painted or are thin shells: not skin-coloured, so they
            # stayed as black shards. Everything in front of the neck, NECKX to each side, from the chin NECKCUT down, goes
            me_ = o.data; cen_ = np.array([p.center for p in me_.polygons])
            col_ = (cen_[:, 2] < chin + 0.03) & (cen_[:, 2] > chin - E('NECKCUT', 0.12)) & (np.abs(cen_[:, 0] - eye.x) < E('NECKX', 0.075)) & (cen_[:, 1] < eye.y + 0.09)
            if col_.all(): dropped.append(('at the throat', n)); keep.remove(o); bpy.data.objects.remove(o); continue
            if col_.any():
                bmc = bmesh.new(); bmc.from_mesh(me_); bmc.faces.ensure_lookup_table()
                bmesh.ops.delete(bmc, geom=[bmc.faces[i] for i in np.nonzero(col_)[0]], context='FACES')
                bmesh.ops.delete(bmc, geom=[v for v in bmc.verts if not v.link_faces], context='VERTS'); bmc.to_mesh(me_); bmc.free()
                dropped.append(('throat faces', int(col_.sum())))
            me_ = o.data; cen_ = np.array([p.center for p in me_.polygons]); fc_ = face_cols(o, PX, IW, IH)
            zone_ = (cen_[:, 2] < z1) & (cen_[:, 2] > z0) & (np.abs(cen_[:, 0]) < 0.13) & (cen_[:, 1] < eye.y + 0.08)
            sk_ = (np.linalg.norm(fc_ - skin, axis=1) < SKIN_T) & zone_
            if sk_.sum() < 20: continue
            bmn = bmesh.new(); bmn.from_mesh(me_); bmn.faces.ensure_lookup_table()
            def nb(i): return [g.index for e in bmn.faces[i].edges for g in e.link_faces if g.index != i]
            reg = set(int(i) for i in np.nonzero(sk_)[0]); todo = set(int(i) for i in np.nonzero(zone_ & ~sk_)[0]); isl = set()
            while todo:   # islands of other colours inside the skin: small, in the zone, touching nothing but the skin
                st = [todo.pop()]; comp = set(st); ok = True
                while st:
                    for k_ in nb(st.pop()):
                        if k_ in reg or k_ in comp: continue
                        if not zone_[k_]: ok = False; continue
                        comp.add(k_); todo.discard(k_); st.append(k_)
                if ok and len(comp) < E('NECKISL', 400): isl |= comp
            bmesh.ops.delete(bmn, geom=[bmn.faces[i] for i in reg | isl], context='FACES')
            bmesh.ops.delete(bmn, geom=[v for v in bmn.verts if not v.link_faces], context='VERTS'); bmn.to_mesh(me_); bmn.free()
            dropped.append(('neckline skin', len(reg))); dropped.append(('painted in it', len(isl)))
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
    # A HAIR LOCK (2026-11-12, mondo: "some sort of strip hanging off the back of the [zombie]'s head and back"): a small shell in
    # the unit's hair colour that starts at the head and hangs below it (a lock down the back) is hair too: not exported; what is left
    # of the face's own shell (long hair fused to the head, the catgirl) at any size
    if wig and not HEADGEAR and E('LOCKS', 1):
        hcol = np.median(np.vstack([face_cols(o, PX, IW, IH) for o in wig]), axis=0)
        for o in [o for o in keep if o not in headp]:
            c = co(o)
            if (len(o.data.polygons) < E('LOCKN', 600) or (o in rem and E('LOCKREM', 1))) and c[:, 2].max() > eyeM[2] - 0.16 and np.linalg.norm(np.median(face_cols(o, PX, IW, IH), axis=0) - hcol) < E('LOCKT', 0.15):
                dropped.append(('hair lock', len(o.data.polygons))); keep.remove(o); bpy.data.objects.remove(o)
        # + HAIR FUSED TO THE CLOTHES (the catgirl: the locks over her shoulders are one shell with the jacket and stood up beside her
        # jaw as black shards): in the other shells the hair-coloured faces above the chin (LOCKZ under it) go
        for o in [o for o in keep if o not in headp]:
            me_ = o.data; cen_ = np.array([p.center for p in me_.polygons])
            if not len(cen_) or cen_[:, 2].max() < chin - E('LOCKZ', 0.05): continue
            up_ = (cen_[:, 2] > chin - E('LOCKZ', 0.05)) & (np.linalg.norm(face_cols(o, PX, IW, IH) - hcol, axis=1) < E('LOCKT', 0.15))
            if up_.sum() and up_.sum() < len(cen_):
                bml = bmesh.new(); bml.from_mesh(me_); bml.faces.ensure_lookup_table()
                bmesh.ops.delete(bml, geom=[bml.faces[i] for i in np.nonzero(up_)[0]], context='FACES')
                bmesh.ops.delete(bml, geom=[v for v in bml.verts if not v.link_faces], context='VERTS'); bml.to_mesh(me_); bml.free()
                dropped.append(('hair on the clothes', int(up_.sum())))
    # THE LONG HAIR (--neckline, round 3, mondo: "what are all those jagged black spots around her neck"): the catgirl's waist-long
    # hair is one big shell from the crown to the waist (not a head piece: its middle is far below the head) and the top of it is
    # fused to what is left of the face's shell; both stood round her neck as jagged black. A shell that reaches above the eyes
    # with a fifth of it above the chin is hair: not exported; on any other shell everything above the chin goes
    if NECKLINE or LONGHAIR:   # (--longhair, mummy: the whole shell goes, the look wears a creator hair)
        for o in [o for o in keep if o not in headp]:
            c = co(o); n = len(o.data.polygons)
            if c[:, 2].max() < chin: continue
            if o not in rem and c[:, 2].max() > eyeM[2] and (c[:, 2] > chin).mean() > E('LOCKSHARE', 0.2):
                # the part of it down her back stays (HAIRBACK behind the eyes, HAIRTOP under the chin): Meshy modelled no
                # jacket under it, so without it her back is bare patches; her own hair hangs over its top edge
                me_ = o.data; cen_ = np.array([p.center for p in me_.polygons]); go_ = ~((cen_[:, 1] > eye.y + E('HAIRBACK', 0.13)) & (cen_[:, 2] < chin - E('HAIRTOP', 0.08))) | (not NECKLINE)
                if go_.all(): dropped.append(('long hair', n)); keep.remove(o); bpy.data.objects.remove(o); continue
                bml = bmesh.new(); bml.from_mesh(me_); bml.faces.ensure_lookup_table()
                bmesh.ops.delete(bml, geom=[bml.faces[i] for i in np.nonzero(go_)[0]], context='FACES')
                bmesh.ops.delete(bml, geom=[v for v in bml.verts if not v.link_faces], context='VERTS'); bml.to_mesh(me_); bml.free()
                dropped.append(('long hair in front', int(go_.sum()))); continue
            if not NECKLINE: continue
            me_ = o.data; up_ = np.array([p.center.z for p in me_.polygons]) > chin - E('HAIRCUT', 0.02)
            if up_.sum() and not up_.all():
                bml = bmesh.new(); bml.from_mesh(me_); bml.faces.ensure_lookup_table()
                bmesh.ops.delete(bml, geom=[bml.faces[i] for i in np.nonzero(up_)[0]], context='FACES')
                bmesh.ops.delete(bml, geom=[v for v in bml.verts if not v.link_faces], context='VERTS'); bml.to_mesh(me_); bml.free()
                dropped.append(('above the chin', int(up_.sum())))
        # + THE CLEAN NECK OPENING: what is left beside the neck is the inner edge of the jacket's shoulders, where Meshy painted
        # hair and shadow on her skin (black, like the jacket, so no colour test tells them apart): the cuts above leave it as
        # saw teeth (whole triangles went). The opening is re-cut straight: in front of the nape everything SCX to each side of
        # the middle goes, down to SCZ above the top's own edge at the middle of the chest: a square neck with straight edges
        for o in ([o for o in keep if o not in headp] if NECKLINE else []):
            me_ = o.data; cen_ = np.array([p.center for p in me_.polygons])
            if not len(cen_) or cen_[:, 2].max() < chin - 0.2: continue
            y1 = eye.y + E('SCY', 0.09); sx = E('SCX', 0.105)
            mid_ = (np.abs(cen_[:, 0] - eye.x) < 0.03) & (cen_[:, 1] < eye.y + 0.05) & (cen_[:, 2] < chin - 0.03) & (cen_[:, 2] > chin - 0.45)
            if not mid_.any(): continue
            pc = Vector((eye.x, 0, float(cen_[mid_, 2].max()) + E('SCZ', 0.02))); pn = Vector((0, 0, 1))
            def ins(c_): return c_.y < y1 and abs(c_.x - eye.x) < sx and (c_ - pc).dot(pn) > 0
            bmv = bmesh.new(); bmv.from_mesh(me_)
            for co_, no_ in ((pc, pn), (Vector((eye.x + sx, 0, 0)), Vector((1, 0, 0))), (Vector((eye.x - sx, 0, 0)), Vector((1, 0, 0))), (Vector((0, y1, 0)), Vector((0, 1, 0)))):
                g_ = [f for f in bmv.faces if f.calc_center_median().z > chin - 0.5 and f.calc_center_median().y < y1 + 0.05 and abs(f.calc_center_median().x - eye.x) < sx + 0.05]
                g_ = list(set(g_) | set(e for f in g_ for e in f.edges) | set(v for f in g_ for v in f.verts))
                bmesh.ops.bisect_plane(bmv, geom=g_, plane_co=co_, plane_no=no_, dist=1e-5)
            k_ = [f for f in bmv.faces if ins(f.calc_center_median())]
            if k_:
                bmesh.ops.delete(bmv, geom=k_, context='FACES'); bmesh.ops.delete(bmv, geom=[v for v in bmv.verts if not v.link_faces], context='VERTS')
                bmesh.ops.triangulate(bmv, faces=bmv.faces[:]); bmv.to_mesh(me_); dropped.append(('neck opening', len(k_)))
            bmv.free()
    # THE ARM OPENINGS + THE NAPE (--barearms with --neckline; angel, a sleeveless dress): the skin cut of the arms left saw
    # teeth and stubs of arm round each arm opening, and the back of the neck stood up in spikes. Both are re-cut straight:
    # everything AHX out from the middle goes above AHZ under the eyes, and behind the square neck everything between the
    # straps goes above NAPE under the chin
    for o in ([o for o in keep if o not in headp] if (NECKLINE and BAREARMS) else []):
        me_ = o.data; cen_ = np.array([p.center for p in me_.polygons])
        if not len(cen_) or cen_[:, 2].max() < chin - 0.2: continue
        ax = E('AHX', 0.145); za = eye.z - E('AHZ', 0.38); sx = E('SCX', 0.105); y1 = eye.y + E('SCY', 0.09); zb = chin - E('NAPE', 0.06)
        def out_(c_): return c_.z > za and (abs(c_.x - eye.x) > ax or (abs(c_.x - eye.x) < sx and c_.y > y1 and c_.z > zb))
        bmv = bmesh.new(); bmv.from_mesh(me_)
        for co_, no_ in ((Vector((eye.x + ax, 0, 0)), Vector((1, 0, 0))), (Vector((eye.x - ax, 0, 0)), Vector((1, 0, 0))), (Vector((0, 0, za)), Vector((0, 0, 1))),
                         (Vector((0, 0, zb)), Vector((0, 0, 1))), (Vector((eye.x + sx, 0, 0)), Vector((1, 0, 0))), (Vector((eye.x - sx, 0, 0)), Vector((1, 0, 0))), (Vector((0, y1, 0)), Vector((0, 1, 0)))):
            g_ = [f for f in bmv.faces if f.calc_center_median().z > za - 0.06]
            g_ = list(set(g_) | set(e for f in g_ for e in f.edges) | set(v for f in g_ for v in f.verts))
            bmesh.ops.bisect_plane(bmv, geom=g_, plane_co=co_, plane_no=no_, dist=1e-5)
        k_ = [f for f in bmv.faces if out_(f.calc_center_median())]
        if k_ and len(k_) < len(bmv.faces):
            bmesh.ops.delete(bmv, geom=k_, context='FACES'); bmesh.ops.delete(bmv, geom=[v for v in bmv.verts if not v.link_faces], context='VERTS')
            bmesh.ops.triangulate(bmv, faces=bmv.faces[:])
            # (+ ONE SIDE LIKE THE OTHER, mondo "keep improving them": the skin cut bit deeper into one arm opening than the other, spikes of
            # several faces stood behind her right arm. Out past the neck a face stays only when every corner of it, mirrored across the
            # middle, lies within MIRD 1.2 cm of the cloth on the other side: both openings take the smaller, smoother shape)
            if E('MIRD', 0.012):
                bmv.faces.ensure_lookup_table(); bv_ = BVHTree.FromBMesh(bmv)
                t_ = [f for f in bmv.faces if f.calc_center_median().z > za and abs(f.calc_center_median().x - eye.x) > sx
                      and any((lambda h_: h_[0] is None or h_[3] > E('MIRD', 0.012))(bv_.find_nearest(Vector((2 * eye.x - v.co.x, v.co.y, v.co.z)))) for v in f.verts)]
                if t_ and len(t_) < 0.5 * len(bmv.faces):
                    bmesh.ops.delete(bmv, geom=t_, context='FACES'); bmesh.ops.delete(bmv, geom=[v for v in bmv.verts if not v.link_faces], context='VERTS'); dropped.append(('not on both sides', len(t_)))
            # (+ the teeth the skin cut left on the other edges, behind her arm: a triangle with two free edges is a tooth, it goes; EARS 4 rounds)
            for _ in range(int(E('EARS', 4))):
                t_ = [f for f in bmv.faces if f.calc_center_median().z > za and sum(1 for e in f.edges if len(e.link_faces) == 1) >= 2]
                if not t_: break
                bmesh.ops.delete(bmv, geom=t_, context='FACES'); bmesh.ops.delete(bmv, geom=[v for v in bmv.verts if not v.link_faces], context='VERTS')
            # (the straight cuts leave long flat faces, a strap of two triangles dips under the round of her chest: edges over STRAPSEG 2.5 cm are cut up, so THE STRAPS ON THE SKIN can lift it)
            for _ in range(2):
                e_ = [e for e in bmv.edges if e.calc_length() > E('STRAPSEG', 0.025) and min(e.verts[0].co.z, e.verts[1].co.z) > za]
                if not e_: break
                bmesh.ops.subdivide_edges(bmv, edges=e_, cuts=1); bmesh.ops.triangulate(bmv, faces=bmv.faces[:])
            bmv.to_mesh(me_); dropped.append(('arm openings + nape', len(k_)))
        bmv.free()
    # THE BARE ARMS IN ANOTHER SHELL (--barearms; mondo: "Robinhood has his shoulders ... skin sticking out"): his bare arms are a
    # shell of their own with the arm bands (the face's shell never reaches them), exported as pink cloth with the body's shoulders
    # standing through it. In every other shell too the skin-coloured faces out from the middle go; the bands and bracers stay
    if BAREARMS:
        for o in [o for o in list(keep) if o not in headp and o is not headsh]:
            me_ = o.data
            if len(me_.polygons) < 20: continue
            cen_ = np.array([p.center for p in me_.polygons])
            bad_ = (np.linalg.norm(face_cols(o, PX, IW, IH) - skin, axis=1) < E('ARMSKIN', SKIN_T)) & (np.abs(cen_[:, 0] - eye.x) > E('ARMX', 0.05)) & (cen_[:, 2] > eye.z - E('ARMZ', 0.85))
            if not bad_.any() or np.abs(cen_[bad_, 0] - eye.x).mean() < E('ARMMEAN', 0.2): continue   # (an arm is far out from the middle: not the quiver's leather on his back)
            if bad_.mean() > E('ARMSHARE', 0.4):   # (the arm's own shell: its skin in shadow under the tunic's shoulder goes too, any face out there in the skin's hue however dark)
                fc_ = face_cols(o, PX, IW, IH); cs_ = (fc_ @ skin) / (np.linalg.norm(fc_, axis=1) * np.linalg.norm(skin) + 1e-9)
                bad_ |= (cs_ > E('ARMHUE', 0.985)) & (np.abs(cen_[:, 0] - eye.x) > E('ARMX', 0.05)) & (cen_[:, 2] > eye.z - E('ARMZ', 0.85))
            if bad_.mean() > 0.95: dropped.append(('bare arm', len(bad_))); keep.remove(o); bpy.data.objects.remove(o); continue
            bml = bmesh.new(); bml.from_mesh(me_); bml.faces.ensure_lookup_table()
            bmesh.ops.delete(bml, geom=[bml.faces[i] for i in np.nonzero(bad_)[0]], context='FACES')
            bmesh.ops.delete(bml, geom=[v for v in bml.verts if not v.link_faces], context='VERTS'); bml.to_mesh(me_); bml.free()
            dropped.append(('bare arm skin', int(bad_.sum())))
            bmi = bmesh.new(); bmi.from_mesh(me_); bmi.faces.ensure_lookup_table(); isl_ = {}; lab_ = [-1] * len(bmi.faces)   # (+ the tatters the cut leaves: islands under ARMISLE 40 faces)
            for f in bmi.faces:
                if lab_[f.index] >= 0: continue
                st_ = [f]; lab_[f.index] = f.index; isl_[f.index] = 0
                while st_:
                    h_ = st_.pop(); isl_[f.index] += 1
                    for e in h_.edges:
                        for g_ in e.link_faces:
                            if lab_[g_.index] < 0: lab_[g_.index] = f.index; st_.append(g_)
            go_ = [bmi.faces[i] for i in range(len(lab_)) if isl_[lab_[i]] < E('ARMISLE', 40)]
            if go_ and len(go_) < len(lab_):
                dropped.append(('arm tatters', len(go_))); bmesh.ops.delete(bmi, geom=go_, context='FACES')
                bmesh.ops.delete(bmi, geom=[v for v in bmi.verts if not v.link_faces], context='VERTS'); bmi.to_mesh(me_)
            bmi.free()
    # PAINTED OVER (--repaint; 2026-11-12, mondo: "the angel neckline definitely need[s] work"): Meshy painted her hair locks on
    # the chest of the dress and her hand on the back of the skirt. Cutting those faces out (LOCKZ 0.25) left bites in the
    # neckline, a hole in the bodice and a skin patch on the skirt. They stay and take the colour of the nearest plain cloth
    # (their UVs go to that face's middle: no texture is repainted)
    if REPAINT:
        hc_ = locals().get('hcol'); nr_ = 0
        for o in [o for o in list(keep) if o not in headp]:
            me_ = o.data
            if len(me_.polygons) < 50:   # (a small shell all in her skin's colour is a bit of a hand left in the skirt: it goes)
                m_ = np.median(face_cols(o, PX, IW, IH), axis=0)
                if np.linalg.norm(m_ - skin) < E('REPSKIN', SKIN_T) or (E('REPWARM', 0) and m_[0] - m_[2] > E('REPWARM', 0)):
                    dropped.append(('skin bit', len(me_.polygons))); keep.remove(o); bpy.data.objects.remove(o)
                continue
            # (+ an island of a few faces in a big shell: what the skin cuts left of a hand, lying on the skirt as a skin patch)
            bmi = bmesh.new(); bmi.from_mesh(me_); bmi.faces.ensure_lookup_table(); isl_ = {}; lab_ = [-1] * len(bmi.faces)
            for f in bmi.faces:
                if lab_[f.index] >= 0: continue
                st_ = [f]; lab_[f.index] = f.index; isl_[f.index] = 0
                while st_:
                    h_ = st_.pop(); isl_[f.index] += 1
                    for e in h_.edges:
                        for g_ in e.link_faces:
                            if lab_[g_.index] < 0: lab_[g_.index] = f.index; st_.append(g_)
            go_ = [bmi.faces[i] for i in range(len(lab_)) if isl_[lab_[i]] < E('REPISLE', 40)]
            if go_ and len(go_) < len(lab_):
                dropped.append(('island', len(go_))); bmesh.ops.delete(bmi, geom=go_, context='FACES')
                bmesh.ops.delete(bmi, geom=[v for v in bmi.verts if not v.link_faces], context='VERTS'); bmi.to_mesh(me_)
            bmi.free()
            fc_ = face_cols(o, PX, IW, IH); bad_ = np.linalg.norm(fc_ - skin, axis=1) < E('REPSKIN', SKIN_T)
            if hc_ is not None: bad_ |= np.linalg.norm(fc_ - hc_, axis=1) < E('REPHAIR', E('LOCKT', 0.15))
            if E('REPWARM', 0):   # (REPWARM, off: on a white dress anything this much redder than blue is paint, a hand's shadow too; read at
                uvl_ = me_.uv_layers[0].data   # the face's middle and towards each corner: the patch is smaller than the skirt's big faces)
                for p_ in me_.polygons:
                    us_ = np.array([uvl_[l].uv[:] for l in p_.loop_indices]); m_ = us_.mean(0)
                    for q_ in [m_] + [m_ + 0.7 * (u_ - m_) for u_ in us_] + [m_ + 0.35 * (u_ - m_) for u_ in us_]:
                        c_ = PX[int((q_[1] % 1) * (IH - 1)), int((q_[0] % 1) * (IW - 1)), :3]
                        if c_[0] - c_[2] > E('REPWARM', 0): bad_[p_.index] = True; break
            for _ in range(int(E('REPGROW', 1))):   # (+ the faces round them: the paint's soft edge)
                vb_ = set(i for p_ in me_.polygons if bad_[p_.index] for i in p_.vertices)
                bad_ = np.array([bad_[p_.index] or any(i in vb_ for i in p_.vertices) for p_ in me_.polygons])
            if bad_.mean() > E('REPMAX', 0.4):   # (a whole shell in her skin's colour is bare skin Meshy modelled by itself, the angel's legs
                if np.linalg.norm(np.median(fc_, axis=0) - skin) < E('REPSKIN', SKIN_T):   # under her skirt: they stood through its back. The body's own show)
                    dropped.append(('bare skin', len(me_.polygons))); keep.remove(o); bpy.data.objects.remove(o)
                continue
            if not bad_.any(): continue
            good_ = np.nonzero(~bad_)[0]; kd_ = KDTree(len(good_))
            for k_, i in enumerate(good_): kd_.insert(me_.polygons[i].center, k_)
            kd_.balance(); uv_ = me_.uv_layers[0].data
            for i in np.nonzero(bad_)[0]:
                g_ = me_.polygons[good_[kd_.find(me_.polygons[i].center)[1]]]
                u_ = sum((uv_[l].uv.copy() for l in g_.loop_indices), Vector((0, 0))) / len(g_.loop_indices)
                for l in me_.polygons[i].loop_indices: uv_[l].uv = u_
            nr_ += int(bad_.sum())
        if nr_: print('[bake-outfit] %s: %d faces painted with hair or skin took the plain cloth colour' % (name, nr_), flush=True)
    if BODYSUIT:   # nothing of the suit stands above its collar (a bandage end Meshy stood up to her chin)
        for o in list(keep):
            me_ = o.data; up_ = np.array([p.center.z for p in me_.polygons]) > chin - E('BSNECK', 0.04)
            if up_.all():
                dropped.append(('above the collar', len(up_))); keep.remove(o)
                if o in headp: headp.remove(o)
                bpy.data.objects.remove(o); continue
            if up_.any():
                bml = bmesh.new(); bml.from_mesh(me_); bml.faces.ensure_lookup_table()
                bmesh.ops.delete(bml, geom=[bml.faces[i] for i in np.nonzero(up_)[0]], context='FACES')
                bmesh.ops.delete(bml, geom=[v for v in bml.verts if not v.link_faces], context='VERTS'); bml.to_mesh(me_); bml.free()
                dropped.append(('above the collar', int(up_.sum())))
    # HEADGEAR (2026-11-12, quarterback: his helmet reaches below the eyes, so it was read as hair and left out): --headgear
    # keeps every head piece as the hat (a helmet, a cowl, a mask); the look then picks no hair under it
    if HEADGEAR: wig = []
    hats = [o for o in headp if o not in wig]
    for o in ([] if HEADGEAR else hats):   # a brim low over the eyes comes up so the face reads (never a helmet: it sits where Meshy put it)
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
    # SNUG SHOULDERS (env SNUG = metres; 2026-11-13, superhero F, mondo: "her shoulders poke out of the cape"): the creator's capes
    # are cut to the bare body, a Meshy suit stands a centimetre or two off it and came through the cape on the shoulders. Cloth
    # above SNUGZ under the eyes and SNUGX out from the middle (the shoulders + upper arms) is laid SNUG off the posed skin
    if E('SNUG', 0):
        pb_ = BVHTree.FromPolygons([v.co.copy() for v in pm.vertices], [list(p.vertices) for p in pm.polygons]); ns_ = 0
        for o in [o for o in cloth if o not in headp]:
            for v in o.data.vertices:
                if v.co.z < eyeM[2] - E('SNUGZ', 0.45) or abs(v.co.x - eyeM[0]) < E('SNUGX', 0.08): continue
                loc, nor, idx, dist = pb_.find_nearest(v.co)
                if loc is not None and dist > E('SNUG', 0) and (v.co - loc).dot(nor) > 0: v.co = loc + (v.co - loc).normalized() * E('SNUG', 0); ns_ += 1
        print('[bake-outfit] %s: %d cloth vertices laid snug on the shoulders' % (name, ns_), flush=True)
    vs, fs, off = [], [], 0
    for o in cloth:
        vs += [v.co.copy() for v in o.data.vertices]; fs += [[off + i for i in p.vertices] for p in o.data.polygons]; off += len(o.data.vertices)
    bvh = BVHTree.FromPolygons(vs, fs)
    hw = wts(body, 'Head'); nw = wts(body, 'neck'); ks = set()
    vs_, fs_, off_ = [], [], 0
    for o in cloth:
        if o in hats: continue
        vs_ += [v.co.copy() for v in o.data.vertices]; fs_ += [[off_ + i for i in p.vertices] for p in o.data.polygons]; off_ += len(o.data.vertices)
    hoodbvh = BVHTree.FromPolygons(vs_, fs_) if fs_ else None; upper_, hood_ = [], []
    legw = sum(wts(body, n) for n in ('LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg'))
    for v in pm.vertices:
        if hw[v.index] + nw[v.index] > 0.5:
            # THE SCALP UNDER A HOOD (2026-11-12, robinhood: his bald crown came through the hood between its vertices): the head
            # above the brow is hidden where the OUTFIT's own cloth (a hood, a cowl: never a hat, hats come off) lies over it
            if hw[v.index] > 0.5 and v.co.z > eyeM[2] + E('HOODZ', 0.045):
                upper_.append(v.index)
                if hoodbvh is not None and (hoodbvh.ray_cast(v.co + v.normal * 0.001, v.normal, E('RAY_OUT', 0.07))[0] is not None or hoodbvh.ray_cast(v.co, -v.normal, E('RAY_IN', 0.05))[0] is not None) and hoodbvh.ray_cast(Vector((v.co.x, v.co.y, eyeM[2] + 0.02)), Vector((0, 0, 1)), 0.4)[0] is not None: hood_.append(v.index)
            ks.add(v.index)
            continue
        h1 = bvh.ray_cast(v.co + v.normal * 0.001, v.normal, E('RAY_LEG', 0.45) if legw[v.index] > 0.5 else E('RAY_OUT', 0.07)); h2 = bvh.ray_cast(v.co, -v.normal, E('RAY_IN', 0.05))
        if h1[0] is None and h2[0] is None: ks.add(v.index)
    if len(hood_) > E('HOODMIN', 0.6) * max(1, len(upper_)): ks -= set(hood_) | set(i for i in upper_ if pm.vertices[i].normal.y > E('HOODFRONT', -0.3))   # + the rest of the crown that does not face forward (flecks between the hood's vertices)   # (a real hood covers most of the crown; a high collar does not)
    # + THE EARS UNDER A HOOD (mondo: "Robinhood has his ... ear skin sticking out"): the ears are below the brow, so they stayed and
    # their tips stood through the sides of the hood. Under a real hood the head from HOODEAR out to each side, behind the face, is hidden
    if len(hood_) > E('HOODMIN', 0.6) * max(1, len(upper_)):
        ks -= set(v.index for v in pm.vertices if hw[v.index] > 0.5 and abs(v.co.x - eyeM[0]) > E('HOODEAR', 0.07) and v.co.y > eyeM[1] + E('HOODEARY', 0.03))
    gw = {g.name: wts(body, g.name) for g in body.vertex_groups}
    for names in (('LeftFoot', 'LeftToeBase'), ('RightFoot', 'RightToeBase'), [n for n in gw if n == 'LeftHand' or re.search(r'_l$', n)], [n for n in gw if n == 'RightHand' or re.search(r'_r$', n)]):
        tot = sum(gw[n] for n in names); idx = np.nonzero(tot > 0.5)[0]
        hid = sum(1 for i in idx if i not in ks) / max(1, len(idx))
        print('[bake-outfit] %s: %s %.0f %% under cloth' % (name, names[0], hid * 100), flush=True)
        if E('NOHANDS', 0) and 'Foot' not in names[0]: ks |= set(int(i) for i in idx); continue   # (NOHANDS: Meshy's own hands go below, the body's show)
        if hid > E('ALLHIDE', 0.35): ks -= set(int(i) for i in idx)
        else: ks |= set(int(i) for i in idx)
    # A LEG SEGMENT (thigh, calf) that is mostly under cloth is hidden whole (2026-11-12, mondo: "Knight has slivers of skin
    # outside of her boots where her calves are": her calf is fuller than the greave Meshy made, so strips of it stood outside)
    # + A PAIR (2026-11-12, mondo on the catgirl: "she has her heel sticking out of the back of her boot": her right calf was 71 %
    # under the stocking and hidden, her left 68 % and shown, so the back of the left ankle stood outside the boot): when one leg
    # of a pair is hidden whole, the other is too from LEGPAIR on
    lh_ = {}
    for n in ('LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg'):
        idx = np.nonzero(gw[n] > 0.5)[0]; lh_[n] = (idx, sum(1 for i in idx if i not in ks) / max(1, len(idx)))
    for a_, b_ in (('LeftUpLeg', 'RightUpLeg'), ('LeftLeg', 'RightLeg')):
        top_ = max(lh_[a_][1], lh_[b_][1])
        for n in (a_, b_):
            idx, hid = lh_[n]
            if hid > E('LEGHIDE', 0.7) or (top_ > E('LEGHIDE', 0.7) and hid > E('LEGPAIR', 0.5)):
                ks -= set(int(i) for i in idx)
                if hid <= E('LEGHIDE', 0.7): print('[bake-outfit] %s: %s %.0f %% under cloth, hidden with its pair' % (name, n, hid * 100), flush=True)
    # + THE SKIN AT THE OPENING'S EDGE (--neckline; most of what was left of the "jagged black spots"): a body triangle with one
    # hidden corner is not drawn, so the skin hidden under the jacket's edge bit saw teeth one triangle deep into the open chest
    # and the jacket's black inside showed through them. Round the chest (OPENX to each side of the middle, OPENZ under the eyes)
    # the shown skin grows OPENRING rings under the cloth's edge: only skin that has cloth straight in front of it (it stays
    # behind the jacket) or has no face of the cloth that looks the same way within OPENBACK under it (it is not standing through the jacket)
    if BODYSUIT:   # the skin above the suit's collar is in the open (it was hidden for lying near the collar), and two rings under it
        zc_ = eyeM[2] - 0.115 - E('BSNECK', 0.04) - E('BSSKIN', 0.01)
        ks |= set(v.index for v in pm.vertices if v.co.z > zc_ and abs(v.co.x - eyeM[0]) < 0.2)
        for _ in range(int(E('BSRING', 2))):
            ks |= set(i_ for e_ in pm.edges for i_, j_ in (tuple(e_.vertices), tuple(e_.vertices)[::-1]) if j_ in ks and i_ not in ks and pm.vertices[i_].co.z > zc_ - 0.08 and abs(pm.vertices[i_].co.x - eyeM[0]) < 0.2)
    # THE SKIN IN AN OPEN COLLAR (OPENFRONT, off; mondo on Agent Locke: "fix the dark teeth in the v of the blouse collar"): her blouse
    # stands open in a V and the skin inside it lay within the hide rays of the collar's edge, so triangles of it were not drawn and
    # the blouse's dark inside showed through as teeth. Skin on the front of the chest that has NO cloth straight in front of it is in
    # the open and is shown, + OPENFRONTRING rings round it under the collar's edge (they lie behind the cloth)
    if E('OPENFRONT', 0):
        zone_ = lambda v_: eyeM[2] - E('OPENFRONTZ', 0.32) < v_.co.z < eyeM[2] - 0.1 and abs(v_.co.x - eyeM[0]) < E('OPENFRONTX', 0.07) and v_.normal.y < -0.2
        open_ = set(v_.index for v_ in pm.vertices if zone_(v_) and bvh.ray_cast(v_.co + v_.normal * 0.004, Vector((0, -1, 0)), 1.0)[0] is None and bvh.ray_cast(v_.co, Vector((0, 1, 0)), E('OPENFRONTBACK', 0.08))[0] is None)   # (+ no cloth close behind it: her bust stands through the blouse, that skin stays hidden)
        add_ = set(open_)
        for _ in range(int(E('OPENFRONTRING', 1))):
            add_ |= set(i_ for e_ in pm.edges for i_, j_ in (tuple(e_.vertices), tuple(e_.vertices)[::-1]) if j_ in add_ and i_ not in add_ and zone_(pm.vertices[i_]))
        print('[bake-outfit] %s: %d skin vertices in the open collar shown (%d were hidden)' % (name, len(add_), len(add_ - ks)), flush=True)
        ks |= add_
    if NECKLINE or E('OPENSKIN', 0):   # (OPENSKIN: this rule alone, a blouse's open collar, Agent Locke)
        for _ in range(int(E('OPENRING', 3))):
            add_ = set()
            for e_ in pm.edges:
                a_, b_ = e_.vertices
                for i_, j_ in ((a_, b_), (b_, a_)):
                    v_ = pm.vertices[i_]
                    if j_ in ks and i_ not in ks and eyeM[2] - E('OPENZ', 0.42) < v_.co.z < eyeM[2] - 0.1 and abs(v_.co.x - eyeM[0]) < E('OPENX', 0.17) and (bvh.ray_cast(v_.co + v_.normal * 0.004, Vector((0, -1, 0)), 1.0)[0] is not None or abs(v_.co.x - eyeM[0]) < E('OPENX2', 0.125) and not (lambda h_: h_[0] is not None and h_[1].dot(v_.normal) > 0.2)(bvh.ray_cast(v_.co, -v_.normal, E('OPENBACK', 0.06)))): add_.add(i_)
            ks |= add_
    if BAREARMS and NECKLINE:   # (the same saw teeth round a sleeveless dress's arm openings and straps: the shown skin grows BARING ring there, from BAX out)
        for _ in range(int(E('BARING', 1))):
            ks |= set(i_ for e_ in pm.edges for i_, j_ in (tuple(e_.vertices), tuple(e_.vertices)[::-1]) if j_ in ks and i_ not in ks
                      and pm.vertices[i_].co.z > eyeM[2] - E('BAZ', 0.45) and abs(pm.vertices[i_].co.x - eyeM[0]) > E('BAX', 0.09))
    if BAREARMS and not NECKLINE:   # (robinhood: the top of his bare shoulder lies under the tunic's shoulder and the cape, the hidden skin bit a jagged hole
        ua_ = wts(body, 'LeftArm') + wts(body, 'RightArm') + wts(body, 'LeftShoulder') + wts(body, 'RightShoulder')   # into the shown arm and the cape's dark inside showed as brown tatters. The upper arm's skin is shown whole,
        for v in pm.vertices:   # hidden only within SHNEAR 1.2 cm of cloth (an arm band, which sinks into the body's thicker arm))
            if ua_[v.index] > E('SHARM', 0.3):
                h_ = bvh.find_nearest(v.co)
                if h_[0] is None or h_[3] > E('SHNEAR', 0.012): ks.add(v.index)
                else: ks.discard(v.index)
    # A FLOATING PIECE OF SKIN (SKINISLE, off; mondo: "Catgirl has a weird piece of floating skin under her crotch"): the skin between her legs
    # is on the hips, not a leg, and no cloth lies under it, so it stayed shown with both thighs hidden round it. A patch of shown
    # skin of fewer than SKINISLE vertices, cut off from the rest by hidden skin, is hidden too
    if E('SKINISLE', 0):
        adj_ = {}
        for e_ in pm.edges:
            a_, b_ = e_.vertices
            if a_ in ks and b_ in ks: adj_.setdefault(a_, []).append(b_); adj_.setdefault(b_, []).append(a_)
        seen_ = set(); ni_ = 0
        for i_ in list(ks):
            if i_ in seen_: continue
            comp_ = [i_]; seen_.add(i_); st_ = [i_]
            while st_:
                for j_ in adj_.get(st_.pop(), ()):
                    if j_ not in seen_: seen_.add(j_); comp_.append(j_); st_.append(j_)
            if len(comp_) < E('SKINISLE', 0) and not (max(pm.vertices[k_].co.z for k_ in comp_) > eyeM[2] - E('ISLENECK', 9) and E('ISLENECK', 0) and np.mean([abs(pm.vertices[k_].co.x - eyeM[0]) for k_ in comp_]) < E('ISLENECKX', 0.07)): ks -= set(comp_); ni_ += len(comp_)   # (never her neck: under a blouse collar the neck is cut off from the head's own skin and went black, Agent Locke)
        if ni_: print('[bake-outfit] %s: %d vertices of floating skin hidden' % (name, ni_), flush=True)
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
    noarm = [i for i in range(len(pm.vertices)) if armw[i] < 0.2]
    kdb = KDTree(len(noarm))
    for k_, i in enumerate(noarm): kdb.insert(pm.vertices[i].co, k_)
    kdb.balance()
    bwt = [{body.vertex_groups[g.group].name: g.weight for g in v.groups if g.weight > 1e-4} for v in body.data.vertices]
    pbvh = BVHTree.FromPolygons([v.co.copy() for v in pm.vertices], [list(p.vertices) for p in pm.polygons if all(armw[i] < 0.5 for i in p.vertices)])
    unsleeved = 0; torn = 0
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
        # THE HAND BITS (NOHANDS=1, off; 2026-11-13, conspiracy theorist, mondo: "fingers look messed up"): Meshy left finger tips, nails
        # and palm scraps as part of a sleeve's shell; they hung beside the body's own fingers. Faces whose every vertex rides the
        # hand + its fingers (NOHANDW of its weight) go. Not for a unit in gloves (they ARE its hands)
        if E('NOHANDS', 0):
            hn_ = set(i for i, n in names.items() if n in ('LeftHand', 'RightHand') or re.search(r'_[lr]$', n))
            hw_ = [sum(g.weight for g in v.groups if g.group in hn_) for v in o.data.vertices]
            go_ = [p_.index for p_ in o.data.polygons if all(hw_[i] > E('NOHANDW', 0.85) for i in p_.vertices)]
            if go_:
                bmh = bmesh.new(); bmh.from_mesh(o.data); bmh.faces.ensure_lookup_table()
                bmesh.ops.delete(bmh, geom=[bmh.faces[i] for i in go_], context='FACES')
                bmesh.ops.delete(bmh, geom=[v for v in bmh.verts if not v.link_faces], context='VERTS'); bmh.to_mesh(o.data); bmh.free()
                print('[bake-outfit] %s: %d hand faces left out (the body\'s own hands show)' % (name, len(go_)), flush=True)
            if not len(o.data.polygons): continue
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
                seeds = [v.index for v in o.data.vertices if dl[v.index][0] < E('SLEEVESEED', 0.07) and 0.15 < dl[v.index][1] < 0.5 and sum(g.weight for g in v.groups if g.group in gi) > 0.6]
                seen_ = set(seeds); st_ = list(seeds)
                while st_:
                    for k_ in adj[st_.pop()]:
                        if k_ not in seen_ and dl[k_][0] < E('SLEEVER', 0.16) and dl[k_][1] > 0.1: seen_.add(k_); st_.append(k_)   # (SLEEVESEED / SLEEVER: Santa's fur sleeves stand 10 cm off the arm; a cape fused to a tight sleeve is within 16 cm of it)
                # THE HAND IN A BIG SHELL (2026-11-12, robinhood: Meshy fused his gloved hand to the tunic's skirt, the test above
                # sent the glove to the hips and it hung in the air beside the hand): cloth tight round the wrist + hand (3.5 cm off
                # the bone line, mostly arm weight) is on the arm too, with what joins it within 6 cm of the line
                seeds = [v.index for v in o.data.vertices if dl[v.index][0] < E('WRIST', 0.035) and dl[v.index][1] > 0.55 and sum(g.weight for g in v.groups if g.group in gi) > 0.6]
                st_ = [k_ for k_ in seeds if k_ not in seen_]; seen_ |= set(st_)
                while st_:
                    for k_ in adj[st_.pop()]:
                        if k_ not in seen_ and dl[k_][0] < E('WRISTR', 0.06) and dl[k_][1] > 0.5: seen_.add(k_); st_.append(k_)
                sleeve[sd] = seen_
        # THE STRAPS ON THE SKIN (--barearms; angel: the dress's straps lay in her shoulders, the skin cut them into teeth): from BAZ
        # under the eyes up, cloth lies at least STRAPOFF 10 mm outside the body (along the nearest skin's normal)
        strapw = {}
        if BAREARMS and NECKLINE and not footwear:   # (with --neckline: the sleeveless dress. --barearms alone, robinhood, only bares the arms)
            if 'kda_' not in locals():
                kda_ = KDTree(len(pm.vertices))
                for v in pm.vertices: kda_.insert(v.co, v.index)
                kda_.balance()
            ns_ = 0
            for v in o.data.vertices:
                if v.co.z > eyeM[2] - E('BAZ', 0.45):   # (+ it moves with that skin: with the arm's weight taken off, her shoulder rose through the strap when the arm came down)
                    c_, k_, d_ = kda_.find(v.co); n_ = pm.vertices[k_].normal; h_ = (v.co - c_).dot(n_)
                    if h_ < E('STRAPOFF', 0.01) and d_ < E('STRAPIN', 0.1): v.co = v.co + n_ * (E('STRAPOFF', 0.01) - h_); ns_ += 1
                    if d_ < E('STRAPNEAR', 0.08): strapw[v.index] = noarm[kdb.find(v.co)[1]]   # (the nearest skin that is not arm: the back of the dress beside her arm took the arm's weight and stood out in spikes)
            if ns_: print('[bake-outfit] %s: %d cloth vertices lifted onto the skin' % (name, ns_), flush=True)
        # + THE COLLAR ON THE SKIN (OPENFRONT): the ring of skin shown under the collar's edge stood THROUGH the blouse (the body's
        # chest is fuller than the one Meshy dressed), a skin patch on the white. The cloth round the open collar lies at least
        # OPENFRONTOFF 6 mm outside the skin
        if E('OPENFRONT', 0) and not footwear:
            nc_ = 0
            for v in o.data.vertices:
                if eyeM[2] - E('OPENFRONTLIFTZ', 0.27) < v.co.z < eyeM[2] - 0.1 and abs(v.co.x - eyeM[0]) < E('OPENFRONTX', 0.07) and v.co.y < eyeM[1] + 0.06:   # (the collar only: lower down the lifted blouse came through the jacket at her bust)
                    c_, k_, d_ = kdb.find(v.co); n_ = pm.vertices[noarm[k_]].normal; h_ = (v.co - c_).dot(n_)
                    if h_ < E('OPENFRONTOFF', 0.006) and d_ < 0.03: v.co = v.co + n_ * (E('OPENFRONTOFF', 0.006) - h_); nc_ += 1
            if nc_: print('[bake-outfit] %s: %d collar vertices lifted onto the skin' % (name, nc_), flush=True)
        # THE BACK UNDER LONG HAIR (--bodysuit --longhair; mummy: tan flecks on her hair at the back): Meshy modelled the suit
        # round her own hair, its lumps stand through the creator hair that lies on her back. The suit's upper back lies
        # no more than BSBACK 6 mm off the body
        if BODYSUIT and LONGHAIR and len(o.data.polygons) >= E('BSSTRIP', 500):
            nb_ = 0
            for v in o.data.vertices:
                if v.co.y > eyeM[1] + 0.02 and eyeM[2] - E('BSBACKZ', 0.75) < v.co.z < eyeM[2] - E('BSBACKT', 0.18) and abs(v.co.x - eyeM[0]) < E('BSBACKX', 0.15):   # (between the shoulder blades: the shoulders' nearest body point is not the arm)
                    c_, k_, d_ = kdb.find(v.co)
                    if d_ > E('BSBACK', 0.006): v.co = c_ + (v.co - c_) * (E('BSBACK', 0.006) / d_); nb_ += 1
            if nb_: print('[bake-outfit] %s: %d back vertices laid on the body under her hair' % (name, nb_), flush=True)
        el0 = {e.key: (o.data.vertices[e.vertices[0]].co - o.data.vertices[e.vertices[1]].co).length for e in o.data.edges}
        # A HANGING END (--bodysuit; 2026-11-12, mondo: "the mummy bandages ... definitely need work"): a loose bandage end is its own
        # small shell hanging from an arm or the waist. Weighted vertex by vertex it tore (its top on the arm, its tip on the hips:
        # the torn faces went and the tip floated by itself beside her hand). It hangs stiff from the ONE bone its top is on
        rig = None
        if BODYSUIT and len(o.data.polygons) < E('BSSTRIP', 500) and not footwear:
            top_ = [v for v in o.data.vertices if v.co.z > zs.max() - 0.1 * (zs.max() - zs.min())]; acc_ = {}
            for v in top_:
                for g in v.groups:
                    if names[g.group] in SK: acc_[names[g.group]] = acc_.get(names[g.group], 0) + g.weight
            if acc_: rig = {max(acc_, key=acc_.get): 1.0}
        for v in o.data.vertices:
            M = Matrix(((0,) * 4,) * 4); tw = 0; w = {}
            for g in v.groups:
                n = names[g.group]
                if n in SK and g.weight > 1e-4: w[n] = w.get(n, 0) + g.weight
            if rig is not None: w = dict(rig)
            if v.index in strapw: w = {n: x for n, x in bwt[strapw[v.index]].items() if n in SK} or w
            fix_ = rig is not None or v.index in strapw
            # LOOSE CLOTH (a robe's skirt, a cape, a coat's tail): hanging off the legs it must not follow one leg like a trouser
            # leg does (the hem tore into a tent between the knees): the further off the skin, the more of its leg weight goes to
            # the hips and the more the rest is shared between the two legs
            for sd in (() if fix_ else ('L', 'R')):
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
            if lw > 0.05 and not one_side and not fix_:
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
        # A TORN FACE (2026-11-12, quarterback: a thin stick through each hand): a face one of whose edges grew more than 3x
        # and past 6 cm when the cloth was un-skinned (its ends went to different bones) is left out
        torn_ = set()
        for p_ in me.polygons:
            for k_ in p_.edge_keys:
                l_ = (me.vertices[k_[0]].co - me.vertices[k_[1]].co).length
                if l_ > E('TORN', 0.06) and l_ > 3 * el0.get(k_, l_): torn_.add(p_.index); break
            if BODYSUIT and max(me.vertices[i_].co.z for i_ in p_.vertices) > eyeM[2] - 0.115 - E('BSNECK', 0.04) + E('BSSPIKE', 0.02): torn_.add(p_.index)   # (a bandage end un-skinned up past the collar: a spike to her chin)
        # (--barearms: what stands out past the arm opening after the cloth is un-posed is a stub of the arm the cuts missed, a flap in her armpit)
        if BAREARMS and NECKLINE: torn_ |= set(p_.index for p_ in me.polygons if p_.center.z > eyeM[2] - E('AHZ', 0.38) and abs(p_.center.x - eyeM[0]) > E('AHX', 0.145) + E('AHPAD', 0.022))
        torn += len(torn_)
        F = [tuple(t.vertices) for t in me.loop_triangles if t.polygon_index not in torn_]
        FUV = [[(uv[l].uv[0], 1.0 - uv[l].uv[1]) for l in t.loops] for t in me.loop_triangles if t.polygon_index not in torn_]   # (glTF's v runs down)
        # A CUT-OFF BIT (--bodysuit): what a torn face cut off its shell (under BSCHIP 40 triangles, not the shell's biggest part)
        # floated by itself beside her hand. It goes with the torn face
        if BODYSUIT and torn_ and F:
            par_ = list(range(len(P)))
            def fd_(i):
                while par_[i] != i: par_[i] = par_[par_[i]]; i = par_[i]
                return i
            for f in F:
                par_[fd_(f[0])] = fd_(f[1]); par_[fd_(f[2])] = fd_(f[1])
            cnt_ = {}
            for f in F: cnt_[fd_(f[0])] = cnt_.get(fd_(f[0]), 0) + 1
            big_ = max(cnt_.values()); ok_ = [cnt_[fd_(f[0])] >= min(E('BSCHIP', 40), big_) for f in F]
            if not all(ok_): print('[bake-outfit] %s: %d triangles cut off by a torn face left out' % (name, len(ok_) - sum(ok_)), flush=True)
            F = [f for f, k in zip(F, ok_) if k]; FUV = [u for u, k in zip(FUV, ok_) if k]
        g = out.setdefault('hat' if o in hats else 'outfit', {'P': [], 'N': [], 'F': [], 'FUV': [], 'W': []})
        base_i = sum(len(p) for p in g['P'])
        g['P'].append(P); g['N'].append(N); g['F'] += [tuple(i + base_i for i in f) for f in F]; g['FUV'] += FUV; g['W'] += W
    print('[bake-outfit] %s: %d cloth vertices beside an arm (not round it) taken off the arm' % (name, unsleeved), flush=True)
    if torn: print('[bake-outfit] %s: %d torn faces left out' % (name, torn), flush=True)
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
    ap.add_argument('--headgear', action='store_true'); ap.add_argument('--repaint', action='store_true'); ap.add_argument('--neckline', action='store_true'); ap.add_argument('--longhair', action='store_true'); ap.add_argument('--bodysuit', action='store_true'); ap.add_argument('--nowings', action='store_true'); ap.add_argument('--barearms', action='store_true')
    ap.add_argument('--metal', type=float, default=0.0); ap.add_argument('--rough', type=float, default=0.8); ap.add_argument('--px', type=int, default=2048)
    a = ap.parse_args()
    global HEADGEAR, NECKLINE, LONGHAIR, BODYSUIT, NOWINGS, BAREARMS, REPAINT; REPAINT = a.repaint; HEADGEAR = a.headgear; NECKLINE = a.neckline; LONGHAIR = a.longhair; BODYSUIT = a.bodysuit; NOWINGS = a.nowings; BAREARMS = a.barearms
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
