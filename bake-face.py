#!/usr/bin/env python3
"""bake-face.py - THE UNIT FACES (2026-11-12, docs/notes/meshy-remake-plan.md section 6; notes character-creator.md "THE UNIT FACES").

A race's own (old, fused) Meshy head measured onto the MPFB head, so the remade look wears the unit's face and still blinks / talks:
  1 both heads are drawn face-on (a small software rasteriser, flat colours) and MediaPipe's face landmarker finds 478 landmarks on each;
    each landmark's pixel is read back as a 3D point on its mesh
  2 the unit head is brought into MPFB space (scale + turn + move, Umeyama on the landmarks, 4 rounds, outliers dropped)
  3 SHAPE: the landmark moves become a smooth field (thin plate spline) over the MPFB face; each eye ring moves as one (its own opening
    stays), the inner lips keep one height (mouth shut), teeth + tongue move as one piece with the lips, eyeballs ride with their lids
    -> charactercreation/mpfb/custom_shapes/<key>.json (then `node bake-custom-shape.js`)
  4 SKIN: each face texel of the hm08 sheet reads the unit's colour at the nearest point of the unit's head; nothing above the brows
    (a hat), nothing in the eye openings, nothing outside the face outline; the stock sheet is toned toward the unit's skin and the
    unpainted skin beside the paint takes the paint's tone -> charactercreation/mpfb/looks/skin_<skin>.jpg

  pip install mediapipe ; apt-get install libegl1 libgl1 ; model file: face_landmarker.task (storage.googleapis.com/mediapipe-models/
  face_landmarker/face_landmarker/float16/1/face_landmarker.task), path in model=

  python3 bake-face.py unit=<old unit .glb> stock=charactercreation/mpfb/looks/skin_<stock>.jpg key=cowboyFace skin=ew_face_cowboy \
      model=<face_landmarker.task> [body=mpfb_male] [cy=1.5 pitch=15] [out=<dir>]
  cy = the unit head's height in its own file (metres), pitch = degrees to tip a bowed head up to face the camera.
  Writes <out>/<key>.json, skin_<skin>.jpg, fit_check.jpg (unit | fitted | stock, front + side): LOOK at it, then copy the two files in.
Repo-only tooling. The game side: sprites.js EW_MPFB_FACE_SLIDERS "Unit faces" + EW_MH_LOOKS.skins + the race's RACE_REMADE_LOOKS row.
"""
import sys, json, os, struct, io
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.interpolate import RBFInterpolator
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
A = dict(a.split('=', 1) for a in sys.argv[1:])

# ---- a minimal GLB reader ----
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
class Glb:
    def __init__(s, path):
        d = open(path, 'rb').read(); n = struct.unpack('<I', d[12:16])[0]; s.j = json.loads(d[20:20 + n]); s.bin = d[20 + n + 8:]
    def acc(s, i):
        a = s.j['accessors'][i]; bv = s.j['bufferViews'][a['bufferView']]; t = np.dtype(CT[a['componentType']]); nc = NC[a['type']]
        off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); st = bv.get('byteStride', 0) or t.itemsize * nc
        raw = np.frombuffer(s.bin, np.uint8, st * (a['count'] - 1) + t.itemsize * nc, off)
        if st == t.itemsize * nc: out = np.frombuffer(raw.tobytes(), t).reshape(a['count'], nc)
        else: out = np.stack([np.frombuffer(raw[k * st:k * st + t.itemsize * nc].tobytes(), t) for k in range(a['count'])])
        if a.get('normalized'): out = out.astype(np.float32) / np.iinfo(t).max
        return out
    def image(s, i):
        im = s.j['images'][i]; bv = s.j['bufferViews'][im['bufferView']]; o = bv.get('byteOffset', 0)
        return Image.open(io.BytesIO(s.bin[o:o + bv['byteLength']])).convert('RGB')
    def prim(s, mesh=None):
        best = None
        for mi, m in enumerate(s.j['meshes']):
            if mesh is not None and m['name'] != mesh: continue
            for p in m['primitives']:
                c = s.j['accessors'][p['attributes']['POSITION']]['count']
                if best is None or c > best[0]: best = (c, p, m)
        c, p, m = best; A = p['attributes']; out = {'pos': s.acc(A['POSITION']).astype(np.float64), 'uv': s.acc(A['TEXCOORD_0']).astype(np.float64), 'idx': s.acc(p['indices']).reshape(-1, 3).astype(np.int64), 'name': m['name']}
        for k in A:
            if k.startswith('_'): out[k] = s.acc(A[k]).reshape(-1)
        mat = s.j['materials'][p['material']]; ti = mat['pbrMetallicRoughness']['baseColorTexture']['index']; out['img'] = s.image(s.j['textures'][ti]['source'])
        out['prim'] = p
        return out

# ---- a face-on software rasteriser ----
def sample(img, uv):
    """bilinear sample of a numpy HxWx3 float image at glTF uvs (v down)"""
    h, w = img.shape[:2]; x = np.clip(uv[:, 0] % 1.0 * w - 0.5, 0, w - 1.001); y = np.clip(uv[:, 1] % 1.0 * h - 0.5, 0, h - 1.001)
    x0 = x.astype(int); y0 = y.astype(int); fx = (x - x0)[:, None]; fy = (y - y0)[:, None]
    return (img[y0, x0] * (1 - fx) + img[y0, x0 + 1] * fx) * (1 - fy) + (img[y0 + 1, x0] * (1 - fx) + img[y0 + 1, x0 + 1] * fx) * fy
def front(pos, uv, idx, img, cx, cy, half, res=1024, bg=(255, 255, 255)):
    """ortho front view (camera on +z looking -z). returns rgb uint8, P (res,res,3) world pos (nan = empty), tri id"""
    s = res / (2 * half); px = (pos[:, 0] - (cx - half)) * s; py = ((cy + half) - pos[:, 1]) * s; pz = pos[:, 2]
    zb = np.full((res, res), -1e9); col = np.zeros((res, res, 3)); col[:] = bg; P = np.full((res, res, 3), np.nan); tid = np.full((res, res), -1, int)
    T = idx[(np.abs(pos[idx][:, :, 0] - cx).min(1) < half) & (np.abs(pos[idx][:, :, 1] - cy).min(1) < half)]
    tids = np.nonzero((np.abs(pos[idx][:, :, 0] - cx).min(1) < half) & (np.abs(pos[idx][:, :, 1] - cy).min(1) < half))[0]
    for t, ti in zip(T, tids):
        x, y, z = px[t], py[t], pz[t]
        x0, x1 = max(0, int(np.floor(x.min()))), min(res - 1, int(np.ceil(x.max()))); y0, y1 = max(0, int(np.floor(y.min()))), min(res - 1, int(np.ceil(y.max())))
        if x1 < x0 or y1 < y0: continue
        d = (y[1] - y[2]) * (x[0] - x[2]) + (x[2] - x[1]) * (y[0] - y[2])
        if abs(d) < 1e-12: continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        a = ((y[1] - y[2]) * (gx - x[2]) + (x[2] - x[1]) * (gy - y[2])) / d; b = ((y[2] - y[0]) * (gx - x[2]) + (x[0] - x[2]) * (gy - y[2])) / d; c = 1 - a - b
        zz = a * z[0] + b * z[1] + c * z[2]; m = (a >= -1e-6) & (b >= -1e-6) & (c >= -1e-6) & (zz > zb[y0:y1 + 1, x0:x1 + 1])
        if not m.any(): continue
        yy, xx = np.nonzero(m); A, B, C = a[m][:, None], b[m][:, None], c[m][:, None]
        zb[y0 + yy, x0 + xx] = zz[m]; P[y0 + yy, x0 + xx] = A * pos[t[0]] + B * pos[t[1]] + C * pos[t[2]]; tid[y0 + yy, x0 + xx] = ti
        col[y0 + yy, x0 + xx] = sample(img, A * uv[t[0]] + B * uv[t[1]] + C * uv[t[2]])
    return col.clip(0, 255).astype(np.uint8), P, tid

# ---- the landmarks ----
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
_d = None
def landmarks(rgb):
    global _d
    if _d is None: _d = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path=A['model']), num_faces=1, min_face_detection_confidence=0.2, min_face_presence_confidence=0.2))
    r = _d.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb)))
    if not r.face_landmarks: return None
    h, w = rgb.shape[:2]; return np.array([[p.x * w, p.y * h] for p in r.face_landmarks[0]])


REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'charactercreation', 'mpfb') + os.sep
unit, body, stock, key = A['unit'], A.get('body', 'mpfb_male'), A['stock'], A['key']
cy0 = float(A.get('cy', 1.5)) if not str(A.get('cy', '')).startswith('top') else 0.0; pitch0 = float(A.get('pitch', 15)); out = A.get('out', '.')
LEYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]; REYE = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466]
LIPS = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 191, 80, 81, 82, 13, 312, 311, 310, 415]
BROW = [70, 63, 105, 66, 107, 336, 296, 334, 293, 300]
def sstep(x, a, b): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def lm3(rgb, P):
    L = landmarks(rgb)
    if L is None: raise SystemExit('no face found')
    X = np.full((len(L), 3), np.nan); res = rgb.shape[0]
    for i, (x, y) in enumerate(L):
        xi, yi = int(round(x)), int(round(y))
        if 0 <= xi < res and 0 <= yi < res: X[i] = P[yi, xi]
    return L, X
def umeyama(S, D):
    ms, md = S.mean(0), D.mean(0); s_, d_ = S - ms, D - md; U, sg, Vt = np.linalg.svd(d_.T @ s_ / len(S)); E = np.eye(3)
    if np.linalg.det(U) * np.linalg.det(Vt) < 0: E[2, 2] = -1
    R = U @ E @ Vt; sc = (sg * np.diag(E)).sum() / (s_ ** 2).sum() * len(S); return sc, R, md - sc * R @ ms

# ---- the MPFB head ----
M = Glb(REPO + body + '.glb').prim(body); mimg = np.asarray(M['img']).astype(float); mpos = M['pos']; BI = M['_BASE_INDEX'].astype(int)
mcy = mpos[:, 1].max() - 0.155; mrgb, mP, _ = front(mpos, M['uv'], M['idx'], mimg, 0.0, mcy, 0.16); mL, Pm = lm3(mrgb, mP)
# ---- the unit head, brought into MPFB space ----
U = Glb(unit).prim(); uimg = np.asarray(U['img']).astype(float)
if str(A.get('cy', '')).startswith('top'):   # cy=top<d> (2026-11-13): the head's middle = the top of the figure on its middle line, less d metres (0.155 = a bare head; more under a hat or horns)
    _m = U['pos'][np.abs(U['pos'][:, 0]) < 0.05]; cy0 = float(_m[:, 1].max()) - float(A['cy'][3:] or 0.155); print('cy = %.3f' % cy0, flush=True)
a = np.radians(pitch0); c = np.array([0, cy0, 0.0]); R0 = np.array([[1, 0, 0], [0, np.cos(a), np.sin(a)], [0, -np.sin(a), np.cos(a)]])
upos = (U['pos'] - c) @ R0.T + c + np.array([0, mcy - cy0, 0])
ok = None
for it in range(4):
    urgb, uP, _ = front(upos, U['uv'], U['idx'], uimg, 0.0, mcy, 0.16); uL, Pu = lm3(urgb, uP)
    good = ~np.isnan(Pu).any(1) & ~np.isnan(Pm).any(1); good[468:] = False
    for rnd in range(3):
        sc, R, t = umeyama(Pu[good], Pm[good]); res_ = np.linalg.norm((sc * Pu @ R.T + t) - Pm, axis=1); good &= res_ < max(0.012, np.nanmedian(res_[good]) * 2.5)
    upos = sc * upos @ R.T + t; ok = good
    print('align %d: scale %.3f, %d landmarks, median %.1f mm' % (it, sc, good.sum(), np.median(res_[good]) * 1000), flush=True)
urgb, uP, _ = front(upos, U['uv'], U['idx'], uimg, 0.0, mcy, 0.16); uL, Pu = lm3(urgb, uP)
good = ~np.isnan(Pu).any(1) & ~np.isnan(Pm).any(1); good[468:] = False; good &= np.linalg.norm(Pu - Pm, axis=1) < float(A.get('maxd', 0.03))
Image.fromarray(urgb).save(out + '/unit_front.png'); Image.fromarray(mrgb).save(out + '/mpfb_front.png')
# ---- the shape: a smooth field through the landmark moves ----
# HAIR OVER THE FACE (2026-11-12, the knight's lock over one eye): a landmark that landed on hair (hairrgb=) is dropped and takes the
# move of the kept landmark nearest its mirror place, x flipped
if A.get('hairrgb'):
    res_h = urgb.shape[0]; hc = np.array([float(x) for x in A['hairrgb'].split(',')]); ht = float(A.get('hairtol', 70))
    lrgb = np.array([urgb[int(np.clip(round(y), 0, res_h - 1)), int(np.clip(round(x), 0, res_h - 1))] for x, y in uL]).astype(float)
    onh = (np.linalg.norm(lrgb - hc, axis=1) < ht) & good; keep_ = np.nonzero(good & ~onh)[0]
    if onh.any() and len(keep_):
        d = Pu - Pm; mt = cKDTree(Pm[keep_] * [-1, 1, 1])
        for i in np.nonzero(onh)[0]:
            j_ = keep_[mt.query(Pm[i])[1]]; Pu[i] = Pm[i] + d[j_] * [-1, 1, 1]
        print('hair: %d landmarks mirrored' % int(onh.sum()), flush=True)
d = Pu - Pm
# THE BEARD'S BULK (2026-11-12): below the nose a bearded unit's surface is hair, not jaw: those landmarks (dark in the unit's own
# drawing) move the face only part of the way, or the chin grows by the beard's thickness
res_u = urgb.shape[0]; lcol = np.array([urgb[int(np.clip(round(y), 0, res_u - 1)), int(np.clip(round(x), 0, res_u - 1))] for x, y in uL]).astype(float) @ [0.3, 0.59, 0.11]
skinl = np.nanpercentile(lcol[:468][good[:468]], 75); ynose = Pm[2][1] if not np.isnan(Pm[2]).any() else np.nanmean(Pm[LEYE + REYE][:, 1]) - 0.045
beard = (lcol < skinl * float(A.get('beardlum', 0.62))) & (Pm[:, 1] < ynose) & good
d[beard] *= float(A.get('beard', 0.55)); print('beard landmarks: %d held back' % int(beard.sum()), flush=True)
# THE BROW'S DEPTH (2026-11-12, mondo: "the shadow/darkness above his eyes is too much"): under a brim the landmarks above the eyes are
# poor in depth; fitted as read they set the brows back under the forehead and the game's light shaded the hollow. From the eyes up
# the face keeps MPFB's own relief: every landmark there takes the eyes' own depth move (height and width still fitted)
ge = [i for i in LEYE + REYE if good[i]]
if ge:
    dze = d[ge][:, 2].mean(); ye = np.nanmean(Pm[LEYE + REYE][:, 1]); up_ = good & (Pm[:, 1] > ye + 0.004); d[up_, 2] = dze
# THE FOREHEAD (2026-11-12): a hat hides the unit's forehead, so its landmarks are dropped and the field fell from the brows' move
# to nothing just above them: a ledge over the eyes that the game's light turned into a dark band. Each dropped landmark above the
# brows takes the move of the nearest kept landmark at brow height, so the forehead comes along with the brows
ybr = np.nanmean(Pm[BROW][:, 1]); okP = ~np.isnan(Pm).any(1); okP[468:] = False
src = np.nonzero(good & (np.abs(Pm[:, 1] - ybr) < 0.012))[0]
if len(src):
    for i in np.nonzero(okP & ~good & (Pm[:, 1] > ybr))[0]:
        d[i] = d[src[np.argmin(np.abs(Pm[src][:, 0] - Pm[i][0]))]]; good[i] = True
# THE SOFT FACE (2026-11-12, mondo on the knight: "like an ogre ... not a wide face or jawline"): a painted stylised unit's prettiness
# is in its drawing, not its low-poly relief: fitted in full, the game's light shows a flat nose, pushed-out lips and a cheek as wide
# as the hair made it look. depth= scales every landmark's depth move (0 = MPFB's own profile), wide= scales the part of a sideways
# move that goes OUTWARD (0 = the face may narrow, never widen), low= scales downward moves below the nose (a long / heavy chin)
if 'browfit' in A and ge:   # (browfit= : how much of the unit's own brow / forehead move is kept over the eyes' move; 0 = a frowning unit's brows do not press the lids down)
    up2 = good & (Pm[:, 1] > np.nanmean(Pm[LEYE + REYE][:, 1]) + 0.004); de_ = d[ge].mean(0); d[up2] = de_ + (d[up2] - de_) * float(A['browfit'])
if 'depth' in A: d[:, 2] *= float(A['depth'])
if 'wide' in A:
    outw = np.sign(np.nan_to_num(Pm[:, 0])) * d[:, 0] > 0; d[outw, 0] *= float(A['wide'])
if 'low' in A:
    dn = (np.nan_to_num(Pm[:, 1]) < ynose) & (d[:, 1] < 0); d[dn, 1] *= float(A['low'])
for ring in (LEYE, REYE):   # (an eye keeps its own opening: the whole ring moves as one)
    g = [i for i in ring if good[i]]
    if g: d[ring] = d[g].mean(0); good[ring] = True
g = [i for i in LIPS if good[i]]   # (the lips stay shut: the inner ring moves up / down as one)
if g: d[LIPS, 1] = d[g, 1].mean(); good[LIPS] = True
if A.get('lipsrigid'):   # (lipsrigid=1 : the whole mouth, outer lip line too, moves as one piece: the unit's fuller painted lips do not puff the MPFB lips out)
    LO = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185]; g2 = [i for i in LO + list(LIPS) if good[i]]
    if g2: d[LO + list(LIPS)] = d[g2].mean(0); good[LO + list(LIPS)] = True
gi = np.nonzero(good)[0]; Pk, dk = Pm[gi], d[gi]
# ... and on up under the hat: points up the MPFB forehead above each brow-height landmark carry its move, easing off, so the brow's
# move ends in a long slope over the scalp and not in a dent just above the brows
if len(src):
    resm = mrgb.shape[0]; sc_m = resm / 0.32; ex_p, ex_d = [], []
    for i in src:
        for k, up in enumerate((0.02, 0.035, 0.05, 0.065, 0.08)):
            px_, py_ = int(round(mL[i][0])), int(round(mL[i][1] - up * sc_m))
            if 0 <= px_ < resm and 0 <= py_ < resm and not np.isnan(mP[py_, px_]).any(): ex_p.append(mP[py_, px_]); ex_d.append(d[i] * (1 - 0.12 * k))
    if ex_p: Pk = np.vstack([Pk, ex_p]); dk = np.vstack([dk, ex_d])
rbf = RBFInterpolator(Pk * 100, dk * 100, kernel='thin_plate_spline', smoothing=float(A.get('smooth', 2.0)))
# (depth counts for less: the teeth, tongue and eyeballs sit behind the face and must move with it, or they come out through it)
ZS = np.array([1, 1, float(A.get('zs', 0.3))]); tree = cKDTree(Pk * ZS); dist, near = tree.query(mpos * ZS); wv = 1 - sstep(dist, float(A.get('f0', 0.02)), float(A.get('f1', 0.07)))
head = wv > 0; qp = mpos.copy(); qp[:, 2] = np.maximum(qp[:, 2], Pk[near][:, 2] - 0.01)   # (read the field at the face's own depth, not behind it)
off = np.zeros_like(mpos); off[head] = rbf(qp[head] * 100) / 100 * wv[head, None] * float(A.get('amount', 1.0))
hp = np.nonzero((BI >= 13380) & head)[0]; sk = np.nonzero((BI < 13380) & head)[0]   # (teeth, tongue, eyeballs ride with the skin next to them)
if len(hp):
    _, nn = cKDTree(mpos[sk]).query(mpos[hp], k=6); off[hp] = off[sk][nn].mean(1)
    lipc = np.nanmean(Pm[LIPS], 0); inm = np.linalg.norm(mpos[hp] - lipc, axis=1) < 0.05   # (teeth + tongue move as ONE piece with the lips: a beard's bulk on the chin pulled the tongue's tip out)
    lsk = sk[np.linalg.norm(mpos[sk] - lipc, axis=1) < 0.015]
    if len(lsk): off[hp[inm]] = off[lsk].mean(0) - np.array([0, 0, float(A.get('teeth', 0.003))])
    tg = (BI >= 13380) & (BI <= 13605) & head   # (the tongue a little further in and down again: with the jaw open its tip stood out over the lower lip)
    off[tg] += np.array([0, -float(A.get('tonguedown', 0.002)), -float(A.get('tongue', 0.008))])
n_ = np.linalg.norm(off, axis=1); cap = float(A.get('cap', 0.03)); off[n_ > cap] *= (cap / n_[n_ > cap])[:, None]
# one offset per base index (split vertices share it)
acc = {}; 
for v in np.nonzero(n_ > 1e-5)[0]: acc.setdefault(int(BI[v]), []).append(off[v])
idx = sorted(acc); offs = np.array([np.mean(acc[i], 0) for i in idx])
bmap = np.zeros((BI.max() + 1, 3)); bmap[idx] = offs; off = bmap[BI]; fpos = mpos + off
json.dump({'key': key, 'sign': '+', 'note': '%s: the unit\'s Meshy head measured onto %s by face landmarks (bake-face.py); offsets in metres, glTF axes, per hm08 base index' % (key, body),
           'idx': idx, 'off': [round(float(x), 5) for x in offs.reshape(-1)]}, open(out + '/' + key + '.json', 'w'), separators=(',', ':'))
print('shape: %d base indices, max %.1f mm, mean %.1f mm' % (len(idx), n_.max() * 1000, np.linalg.norm(offs, axis=1).mean() * 1000), flush=True)
# ---- the skin: the unit's colours read at each texel of the head ----
base = np.asarray(Image.open(stock).convert('RGB')).astype(float); Hh, Ww = base.shape[:2]
bvh = BVHTree.FromPolygons([Vector(p) for p in upos], [list(map(int, t)) for t in U['idx']])
uvp = M['uv'] * [Ww, Hh]; skin = BI < 13380
W = np.zeros((Hh, Ww)); C = np.zeros((Hh, Ww, 3)); cover = np.zeros((Hh, Ww), bool); Ymap = np.zeros((Hh, Ww)); Lm = np.ones((Hh, Ww)); HZ = np.zeros((Hh, Ww), bool); EP = np.zeros((Hh, Ww), bool); Xmap = np.zeros((Hh, Ww))
eyeP = [np.array([Pm[i][:2] for i in ring]) for ring in (LEYE, REYE)]; ybrow = np.nanmean(Pm[BROW][:, 1])
OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
ovalP = np.array([Pm[i][:2] for i in OVAL if not np.isnan(Pm[i]).any()]); yeye = np.nanmean(Pm[LEYE + REYE][:, 1]); zoval = np.nanpercentile(Pm[OVAL][:, 2], 20)
def inpoly(q, poly):
    x, y = q[:, 0], q[:, 1]; ins = np.zeros(len(q), bool); n = len(poly)
    for i in range(n):
        x0, y0 = poly[i]; x1, y1 = poly[(i + 1) % n]; cnd = ((y0 > y) != (y1 > y)) & (x < (x1 - x0) * (y - y0) / (y1 - y0 + 1e-12) + x0); ins ^= cnd
    return ins
def pdist(q, poly):
    dm = np.full(len(q), 1e9); n = len(poly)
    for i in range(n):
        a_, b_ = poly[i], poly[(i + 1) % n]; ab = b_ - a_; t_ = np.clip(((q - a_) @ ab) / (ab @ ab + 1e-12), 0, 1); dm = np.minimum(dm, np.linalg.norm(q - (a_ + t_[:, None] * ab), axis=1))
    return dm
HAIR = np.array([float(x) for x in A['hairrgb'].split(',')]) if A.get('hairrgb') else None; HAIRTOL = float(A.get('hairtol', 70))
def usample(Q):
    col = np.zeros((len(Q), 3)); dq = np.full(len(Q), 1.0)
    for k in range(len(Q)):
        loc, nor, fi, ds = bvh.find_nearest(Vector(Q[k]))
        if loc is None: continue
        tr = U['idx'][fi]; p0, p1, p2 = upos[tr]; v0, v1, v2 = p1 - p0, p2 - p0, np.array(loc) - p0
        d00, d01, d11, d20, d21 = v0 @ v0, v0 @ v1, v1 @ v1, v2 @ v0, v2 @ v1; den = d00 * d11 - d01 * d01 + 1e-18; bv = (d11 * d20 - d01 * d21) / den; bw = (d00 * d21 - d01 * d20) / den
        col[k] = sample(uimg, ((1 - bv - bw) * U['uv'][tr[0]] + bv * U['uv'][tr[1]] + bw * U['uv'][tr[2]])[None])[0]; dq[k] = ds
    return col, dq
for t in M['idx']:
    if not skin[t].all() or wv[t].max() <= 0: continue
    x, y = uvp[t, 0], uvp[t, 1]; x0, x1 = int(np.floor(x.min())), int(np.ceil(x.max())); y0, y1 = int(np.floor(y.min())), int(np.ceil(y.max()))
    dd = (y[1] - y[2]) * (x[0] - x[2]) + (x[2] - x[1]) * (y[0] - y[2])
    if abs(dd) < 1e-9 or x0 < 0 or y0 < 0 or x1 >= Ww or y1 >= Hh: continue
    gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
    a_ = ((y[1] - y[2]) * (gx - x[2]) + (x[2] - x[1]) * (gy - y[2])) / dd; b_ = ((y[2] - y[0]) * (gx - x[2]) + (x[0] - x[2]) * (gy - y[2])) / dd; c_ = 1 - a_ - b_
    m = (a_ >= -0.02) & (b_ >= -0.02) & (c_ >= -0.02)
    if not m.any(): continue
    yy, xx = np.nonzero(m); Aa, Bb, Cc = a_[m][:, None], b_[m][:, None], c_[m][:, None]
    q = Aa * fpos[t[0]] + Bb * fpos[t[1]] + Cc * fpos[t[2]]; q0 = Aa * mpos[t[0]] + Bb * mpos[t[1]] + Cc * mpos[t[2]]; wq = (Aa * wv[t[0]] + Bb * wv[t[1]] + Cc * wv[t[2]])[:, 0]
    col, dq = usample(q)
    if HAIR is not None:   # (a lock of hair over the face: that side reads the other side of the face, mirrored; hair on both = no paint)
        hz = np.linalg.norm(col - HAIR, axis=1) < HAIRTOL
        HZ[y0 + yy, x0 + xx] |= hz
        if hz.any():
            c2, d2 = usample(q[hz] * [-1, 1, 1]); h2 = np.linalg.norm(c2 - HAIR, axis=1) < HAIRTOL
            col[hz] = c2; dq[hz] = np.where(h2, 1.0, d2)
        if A.get('hairside'):   # (hairside=-|+ : on that side of the face ANY texel that disagrees with its mirror takes the mirror: the hair's soft edge and its shadow on the skin are not the hair's colour)
            sd_ = np.nonzero(q[:, 0] * (1 if A['hairside'] == '+' else -1) > 0.002)[0]
            if len(sd_):
                c2, d2 = usample(q[sd_] * [-1, 1, 1]); df = (np.linalg.norm(col[sd_] - c2, axis=1) > float(A.get('hairdiff', 40))) & (np.linalg.norm(c2 - HAIR, axis=1) >= HAIRTOL)
                col[sd_[df]] = c2[df]; dq[sd_[df]] = d2[df]
    w = sstep(wq, float(A.get('w0', 0.6)), float(A.get('w1', 0.97))) * (1 - sstep(dq, 0.006, 0.018)) * (1 - sstep(q0[:, 1], ybrow + float(A.get('brow0', -0.004)), ybrow + float(A.get('brow1', 0.002))))
    insO = inpoly(q0[:, :2], ovalP); dO = pdist(q0[:, :2], ovalP); w *= np.where(insO, 1.0, 1 - sstep(dO, 0.0, float(A.get('oval', 0.012))))   # (the face only: no ears, no under-jaw smear)
    w *= sstep(q0[:, 2], zoval - 0.012, zoval)   # (nothing behind the face's own edge: the ears, the nape)
    lm_ = col @ [0.3, 0.59, 0.11]; chroma = (col[:, 0] - col[:, 2]) / (lm_ + 1e-6)   # (a hat brim / band above the eyes is grey-green, skin and hair are warm)
    if 'lips' in A:   # (lips=<k> : THE SOFT FACE's paint, only the unit's mouth is painted (an oval k times the lips' own size, fading out); the rest is the stock sheet toned to the unit's skin, so hair edges, rough brows and smeared eye make-up stay off the face)
        lc_ = (Pm[61] + Pm[291]) / 2; ax_ = abs(Pm[291][0] - Pm[61][0]) / 2; ay_ = max(abs(Pm[0][1] - Pm[17][1]) / 2, 0.004); lcy = (Pm[0][1] + Pm[17][1]) / 2
        rr = np.sqrt(((q0[:, 0] - lc_[0]) / ax_) ** 2 + ((q0[:, 1] - lcy) / ay_) ** 2); kk = max(float(A['lips']), 1e-3); Lm[y0 + yy, x0 + xx] = 1 - sstep(rr, kk, kk * 1.5)   # (applied last: the tone and the edge still read the whole face)
    w *= np.where(q0[:, 1] > yeye, sstep(chroma, float(A.get('ch0', 0.08)), float(A.get('ch1', 0.18))), 1.0)
    epz = np.zeros(len(q0), bool)
    for poly in eyeP:   # (the eye opening stays MPFB's: its own lids and eyeball)
        ins = inpoly(q0[:, :2], poly); de = pdist(q0[:, :2], poly); front_ = q0[:, 2] > Pm[LEYE][:, 2].mean() - 0.03
        w *= np.where(front_, np.where(ins, 0.0, sstep(de, float(A.get('eye0', 0.0015)), float(A.get('eye1', 0.006)))), 1.0)
        epz |= front_ & (ins | (de < float(A.get('eyekeep', 0.008))))
    EP[y0 + yy, x0 + xx] = epz
    Xmap[y0 + yy, x0 + xx] = q0[:, 0]
    W[y0 + yy, x0 + xx] = w; C[y0 + yy, x0 + xx] = col; cover[y0 + yy, x0 + xx] = True; Ymap[y0 + yy, x0 + xx] = q0[:, 1]
# tone: the stock sheet's skin moved toward the unit's cheeks / nose colour so the neck and body match the face
# THE BRIM SHADOW (2026-11-12, mondo: "the shadow/darkness above his eyes is too much"): a hat's shadow is baked into the unit's face.
# From the eyes up, the paint's own broad brightness (a wide blur, so brows and creases keep their contrast) is lifted to the lit skin
# of the cheeks and nose. The edge tone and the body tone below then read the lit face, so the forehead matches too.
W = np.nan_to_num(W)
# THE HAIR'S EDGE (2026-11-12, the catgirl: a fringe and side locks left dark lines round her face): hairgrow=<px at 1024> grows the
# texels that read as hair (hairrgb=) by that much and leaves them unpainted, so the hair's soft grey edge and its shadow go too;
# the make-up round the eyes (eyekeep= metres from the eye opening) is never taken
if HAIR is not None and float(A.get('hairgrow', 0)) > 0:
    from scipy.ndimage import binary_dilation
    gr_ = binary_dilation(HZ & ~EP, iterations=max(1, int(round(float(A['hairgrow']) * Ww / 1024)))) & ~EP
    W = np.minimum(W, 1 - np.clip(gaussian_filter(gr_.astype(float), 1.5 * Ww / 1024) * 2.0, 0, 1))
    print('hair edge: %d texels left unpainted' % int(gr_.sum()), flush=True)
    # + THE STRANDS: thin dark lines on the cheeks and along the jaw (a strand in front of the face, the hair's shadow line, and their
    # mirrored copies) are not the hair's colour. Out at the sides of the face (darkx= metres from the middle, so the nostrils and
    # the lips are never touched) a texel much darker than the skin round it (darkk=) is left unpainted too
    if float(A.get('darkk', 0)) > 0:
        Lq = C @ [0.3, 0.59, 0.11]; sgd = 10 * Ww / 1024
        Lw = gaussian_filter(Lq * (W > 0.5), sgd) / np.maximum(gaussian_filter((W > 0.5).astype(float), sgd), 1e-6)
        dk_ = (W > 0) & ~EP & (np.abs(Xmap) > float(A.get('darkx', 0.03))) & (Lq < float(A['darkk']) * Lw)
        dk_ = binary_dilation(dk_, iterations=max(1, int(round(3 * Ww / 1024)))) & ~EP
        W = np.minimum(W, 1 - np.clip(gaussian_filter(dk_.astype(float), 1.5 * Ww / 1024) * 2.0, 0, 1))
        print('strands: %d texels left unpainted' % int(dk_.sum()), flush=True)
Lp = C @ [0.3, 0.59, 0.11]; sgs = float(A.get('shade', 12)) * Ww / 1024
Lb = gaussian_filter(Lp * W, sgs) / np.maximum(gaussian_filter(W, sgs), 1e-6)
low = (W > 0.95) & (Ymap < yeye - 0.012) & (Ymap > np.nanmean(Pm[LIPS][:, 1]) + 0.012)   # (cheeks + nose: between the eyes and the mouth)
if low.any() and float(A.get('deshade', 1.0)) > 0:
    ref = np.percentile(Lp[low], 65); gn = np.clip(ref / np.maximum(Lb, 1.0), 1.0, float(A.get('shademax', 2.4))) ** float(A.get('deshade', 1.0))
    hw = sstep(Ymap, yeye - float(A.get('shade0', 0.018)), yeye + 0.004) * (W > 0)
    C = np.clip(C * (1 + (gn - 1) * hw)[..., None], 0, 255)
    print('brim shadow: lit skin %.0f, lift up to x%.2f above the eyes' % (ref, float((gn * hw).max())), flush=True)
strong = (W > 0.95)
lum = lambda im: im @ [0.3, 0.59, 0.11]
skinpx = strong & (lum(C) > np.percentile(lum(C)[strong], float(A.get('tonepct', 60))))   # (the lighter half: skin, not beard / brow)
gain = np.median(C[skinpx], 0) / np.median(base[skinpx], 0); g = 1 + (gain - 1) * float(A.get('tone', 1.0))
body_ = np.zeros((Hh, Ww), bool)
for t in M['idx']:
    if skin[t].all():
        x, y = uvp[t, 0], uvp[t, 1]; body_[max(0, int(y.min())):int(np.ceil(y.max())) + 1, max(0, int(x.min())):int(np.ceil(x.max())) + 1] = True
toned = base.copy(); toned[body_] = np.clip(base[body_] * g, 0, 255)
# the edge: unpainted skin next to the paint takes the paint's own skin tone there (a brim's shadow baked in the unit's face left
# a pale band of stock forehead above it), fading out over a few centimetres
W = np.nan_to_num(W); Ws = W * (lum(C) > np.percentile(lum(C)[strong], float(A.get('edgepct', 75)))); sg = float(A.get('edge', 30)) * Ww / 1024
num = gaussian_filter(C * Ws[..., None], (sg, sg, 0)); den = gaussian_filter(Ws, sg); numT = gaussian_filter(toned * Ws[..., None], (sg, sg, 0))
lg = np.clip(num / np.maximum(numT, 1e-6), 0.5, 1.6); al = np.clip(den * float(A.get('edgek', 6.0)), 0, 1)[..., None] * cover[..., None]
toned = np.clip(toned * (1 + (lg - 1) * al), 0, 255)
Wb = np.asarray(Image.fromarray((W * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))).astype(float) / 255; Wb = np.minimum(Wb, W + 0.0) if A.get('hard') else Wb
Wb = Wb * Lm
res = toned * (1 - Wb[..., None]) + C * Wb[..., None]
Image.fromarray(res.clip(0, 255).astype(np.uint8)).save(out + '/skin_' + A['skin'] + '.jpg', quality=92)
Image.fromarray((Wb * 255).astype(np.uint8)).save(out + '/mask.png')
print('skin: gain %s, %d texels painted' % (np.round(g, 3), int((Wb > 0.5).sum())), flush=True)
# ---- check renders: unit | fitted | stock, front and side ----
fimg = res; sheet = Image.new('RGB', (512 * 3, 512 * 2))
def side(p): return np.stack([-p[:, 2], p[:, 1], p[:, 0]], 1)
for r, (fn, zc) in enumerate([(lambda p: p, 0.0), (side, None)]):
    for k, (pp, uv, ix, im) in enumerate([(upos, U['uv'], U['idx'], uimg), (fpos, M['uv'], M['idx'], fimg), (mpos, M['uv'], M['idx'], mimg)]):
        q = fn(pp); cx = 0.0 if r == 0 else -float(np.nanmean(Pm[:, 2])) + 0.07
        rgb, _, _ = front(q, uv, ix, im, cx, mcy, 0.16, res=512); sheet.paste(Image.fromarray(rgb), (k * 512, r * 512))
        if r == 0 and k < 2: Image.fromarray(front(q, uv, ix, im, 0.0, mcy - 0.02, 0.11, res=900)[0]).save(out + '/big%d.png' % k)
sheet.save(out + '/fit_check.jpg', quality=88)
