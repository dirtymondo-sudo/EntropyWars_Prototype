#!/usr/bin/env python3
"""bake-brain.py (2026-11-27, thread "Animate the floating brain's pieces"; mondo: "individually animated pieces for the
floating brain; it feels stiff compared to the other units that have tentacles hanging, it'd be nice if the eye could move
around too").

    python3 -I bake-brain.py <Meshy_AI_boltzmann_brain.glb> <out.glb> [--thick 4]

The Floating Brain's Meshy model is one still mesh. This cuts it into pieces that move, with numpy + pillow only (no
Blender, no Meshy credits):
  - ewBbBody   the brain itself (a node at its middle: the renderer's clips bob, tilt and throb it)
  - ewBbEye    a real eyeball in the socket (the Meshy eye's own picture wrapped on a ball; the old painted cap is cut out),
               gaze +Z, turned by the clips
  - ewBbLidU / ewBbLidD   two lids under the socket's rim (rest = open; rotation.x toward 0 shuts them: a blink, a squint)
  - the nerve tendrils (each was already its own loose piece of the mesh): skinned to chains of THE SWAY's spring bones
    `ewsway_c<k>_<j>` hung on ewBbBody, so they trail, swing and settle behind every move. --thick fattens them round
    their centre lines (they were hair thin on the board).
The file is turned to face +Z (the Meshy file faced -Z) and stood with its lowest tendril tip on y 0.
The moves themselves: three-renderer.js THE FLOATING BRAIN (procRig `brainBody`). Notes: champions-combat.md "THE FLOATING BRAIN'S PIECES".
"""
import sys, json, struct, io, heapq, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

args = [a for a in sys.argv[1:] if not a.startswith('--')]
THICK = 4.0
for i, a in enumerate(sys.argv):
    if a == '--thick': THICK = float(sys.argv[i + 1]); args = [x for x in args if x != sys.argv[i + 1]]
SRC, OUT = args[0], args[1]

# ---------- read ----------
raw = open(SRC, 'rb').read()
jl = struct.unpack('<I', raw[12:16])[0]
J = json.loads(raw[20:20 + jl]); BIN = raw[20 + jl + 8:]
def acc(i):
    a = J['accessors'][i]; bv = J['bufferViews'][a['bufferView']]
    n = {'VEC3': 3, 'VEC2': 2, 'SCALAR': 1}[a['type']]; dt = {5126: '<f4', 5125: '<u4', 5123: '<u2'}[a['componentType']]
    return np.frombuffer(BIN, dt, a['count'] * n, bv.get('byteOffset', 0) + a.get('byteOffset', 0)).reshape(-1, n).copy()
prim = J['meshes'][0]['primitives'][0]
P = acc(prim['attributes']['POSITION']).astype(np.float64); N = acc(prim['attributes']['NORMAL']).astype(np.float64)
UV = acc(prim['attributes']['TEXCOORD_0']).astype(np.float64); I = acc(prim['indices']).reshape(-1, 3).astype(np.int64)
ibv = J['bufferViews'][J['images'][0]['bufferView']]
JPEG = BIN[ibv.get('byteOffset', 0):ibv.get('byteOffset', 0) + ibv['byteLength']]
TEX = np.asarray(Image.open(io.BytesIO(JPEG)).convert('RGB')).astype(np.float64)
TH, TW = TEX.shape[:2]
def texel(uv):
    x = np.clip((uv[..., 0] % 1) * TW, 0, TW - 1).astype(int); y = np.clip((uv[..., 1] % 1) * TH, 0, TH - 1).astype(int)
    return TEX[y, x]

# face +Z (the Meshy file's eye looks down -Z): a half turn about y
P[:, 0] *= -1; P[:, 2] *= -1; N[:, 0] *= -1; N[:, 2] *= -1

# ---------- the loose pieces ----------
key = np.round(P * 1e5).astype(np.int64); _, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.reshape(-1)
par = np.arange(inv.max() + 1)
def find(x):
    while par[x] != x:
        par[x] = par[par[x]]; x = par[x]
    return x
for t in inv[I]:
    a = find(t[0]); par[find(t[1])] = a; par[find(t[2])] = a
comp = np.array([find(x) for x in range(len(par))])[inv]
ids, cnt = np.unique(comp, return_counts=True)
main = ids[np.argmax(cnt)]
tri_comp = comp[I[:, 0]]

# ---------- the eye ----------
C = texel(UV)
warm = (C[:, 0] > C[:, 2] + 10) & (P[:, 2] > 0.2) & (comp == main)
Q = P[warm]
A = np.c_[2 * Q, np.ones(len(Q))]; s = np.linalg.lstsq(A, (Q ** 2).sum(1), rcond=None)[0]
EC = s[:3]; ER = float(np.sqrt(s[3] + EC @ EC))
EC[0] = 0.0
dall = np.linalg.norm(P - EC, axis=1)
ang = np.degrees(np.arccos(np.clip((P - EC)[:, 2] / np.maximum(dall, 1e-9), -1, 1)))
OPEN = 50.0                                  # the socket's opening, degrees off the gaze
cap = (comp == main) & (ang < OPEN) & (dall < ER * 1.08) & (P[:, 2] > EC[2])
tri_cap = cap[I].all(axis=1)
print('eye: centre %s  r %.4f  cap tris cut %d' % (np.round(EC, 4), ER, tri_cap.sum()))

# its picture, seen from the front (orthographic), from the cap's own triangles
ES = 512; span = ER * 1.02
front = np.zeros((ES, ES, 3)); fz = np.full((ES, ES), -1e9); fm = np.zeros((ES, ES), bool)
for t in I[tri_cap]:
    p = P[t]; uv = UV[t]
    sx = (p[:, 0] - EC[0] + span) / (2 * span) * ES; sy = (span - (p[:, 1] - EC[1])) / (2 * span) * ES
    x0, x1 = int(max(0, math.floor(sx.min()))), int(min(ES - 1, math.ceil(sx.max())))
    y0, y1 = int(max(0, math.floor(sy.min()))), int(min(ES - 1, math.ceil(sy.max())))
    if x1 < x0 or y1 < y0: continue
    gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
    d = (sy[1] - sy[2]) * (sx[0] - sx[2]) + (sx[2] - sx[1]) * (sy[0] - sy[2])
    if abs(d) < 1e-12: continue
    w0 = ((sy[1] - sy[2]) * (gx - sx[2]) + (sx[2] - sx[1]) * (gy - sy[2])) / d
    w1 = ((sy[2] - sy[0]) * (gx - sx[2]) + (sx[0] - sx[2]) * (gy - sy[2])) / d
    w2 = 1 - w0 - w1
    ins = (w0 >= -0.02) & (w1 >= -0.02) & (w2 >= -0.02)
    z = w0 * p[0, 2] + w1 * p[1, 2] + w2 * p[2, 2]
    uvp = w0[..., None] * uv[0] + w1[..., None] * uv[1] + w2[..., None] * uv[2]
    col = texel(uvp)
    sub_z = fz[y0:y1 + 1, x0:x1 + 1]; upd = ins & (z > sub_z)
    front[y0:y1 + 1, x0:x1 + 1][upd] = col[upd]; sub_z[upd] = z[upd]; fm[y0:y1 + 1, x0:x1 + 1][upd] = True

# the ball's sheet: an azimuthal map (the middle = the pupil; the radius = the angle off the gaze, 0 … TMAX)
TMAX = 130.0; BS = 512
yy, xx = np.meshgrid(np.arange(BS) + 0.5, np.arange(BS) + 0.5, indexing='ij')
du = (xx / BS - 0.5) * 2; dv = (0.5 - yy / BS) * 2
rho = np.sqrt(du * du + dv * dv); th = np.radians(rho * TMAX); phi = np.arctan2(dv, du)
KEEP = OPEN - 6.0                             # the painted eye is trusted to here; past it the white carries on
thc = np.minimum(th, np.radians(KEEP))
fx = ((ER * np.sin(thc) * np.cos(phi) + span) / (2 * span) * ES).astype(int).clip(0, ES - 1)
fy = ((span - ER * np.sin(thc) * np.sin(phi)) / (2 * span) * ES).astype(int).clip(0, ES - 1)
ball = front[fy, fx]
ok = fm[fy, fx]
ringm = (np.degrees(th) > KEEP - 8) & (np.degrees(th) < KEEP) & ok
white = ball[ringm].mean(0) if ringm.any() else np.array([215, 205, 200.0])
ball[~ok] = white
back = np.clip((np.degrees(th) - KEEP) / 30.0, 0, 1)[..., None]      # round the back: the white, a little pinker
ball = ball * (1 - back) + (white * np.array([1.0, 0.9, 0.9])) * back
ball_img = Image.fromarray(ball.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
# a few thin veins round the back, so a far look shows more than plain white
dr = ImageDraw.Draw(ball_img, 'RGBA'); rng = np.random.RandomState(7)
for k in range(22):
    a = rng.uniform(0, 2 * math.pi); r0 = (KEEP - 4) / TMAX * BS / 2; r1 = rng.uniform(70, 110) / TMAX * BS / 2
    pts = []; aa = a
    for q in np.linspace(r1, r0, 9):
        aa += rng.uniform(-0.05, 0.05); pts.append((BS / 2 + q * math.cos(aa), BS / 2 - q * math.sin(aa)))
    dr.line(pts, fill=(150, 40, 50, 110), width=2)
# the lids' sheet: the socket rim's own colour
rim = (comp == main) & (ang > OPEN + 4) & (ang < OPEN + 16) & (dall < ER * 1.35) & (P[:, 2] > EC[2])
lidc = C[rim].mean(0) if rim.any() else np.array([140, 140, 185.0])
ATW, ATH = 1024, 512
atlas = Image.new('RGB', (ATW, ATH), tuple(int(v) for v in lidc))
atlas.paste(ball_img, (0, 0))
ad = ImageDraw.Draw(atlas)
for x in range(512, 1024):                    # the lid: darker toward its lash edge (u 0.5 … 1 = back … edge)
    f = (x - 512) / 511.0; k = 1.0 - 0.45 * max(0.0, (f - 0.8) / 0.2)
    ad.line([(x, 0), (x, ATH)], fill=tuple(int(v * k) for v in lidc))
pb = io.BytesIO(); atlas.save(pb, 'PNG', optimize=True); EYEPNG = pb.getvalue()
print('eye sheet %d bytes, white %s, lid %s' % (len(EYEPNG), np.round(white), np.round(lidc)))

def ball_mesh(r, seg=28, rings=18):
    """a ball, gaze +Z; uv = the azimuthal sheet (left half of the atlas)"""
    vp, vn, vu, idx = [], [], [], []
    for i in range(rings + 1):
        t = math.pi * i / rings
        for k in range(seg + 1):
            f = 2 * math.pi * k / seg
            d = np.array([math.sin(t) * math.cos(f), math.sin(t) * math.sin(f), math.cos(t)])
            vp.append(d * r); vn.append(d)
            rr = min(1.0, math.degrees(t) / TMAX) * 0.5
            vu.append([(0.5 + rr * math.cos(f)) * 0.5, 0.5 - rr * math.sin(f)])
    for i in range(rings):
        for k in range(seg):
            a = i * (seg + 1) + k; b = a + seg + 1
            if i > 0: idx.append([a, b, a + 1])
            if i < rings - 1: idx.append([a + 1, b, b + 1])
    return np.array(vp), np.array(vn), np.array(vu), np.array(idx)

LID_SPAN, LID_SIDE = 64.0, 88.0
def lid_mesh(r, up, na=10, nb=16):
    """a lid in its SHUT pose: the ball's upper (up=+1) or lower front, from the level line to LID_SPAN degrees round x"""
    vp, vn, vu, idx = [], [], [], []
    for i in range(na + 1):
        al = math.radians(LID_SPAN * i / na) * up
        for k in range(nb + 1):
            be = math.radians(-LID_SIDE + 2 * LID_SIDE * k / nb)
            d = np.array([math.sin(be), math.cos(be) * math.sin(al), math.cos(be) * math.cos(al)])
            vp.append(d * r); vn.append(d); vu.append([0.5 + 0.5 * (1 - i / na) * 0.98 + 0.005, 0.5])
    for i in range(na):
        for k in range(nb):
            a = i * (nb + 1) + k; b = a + nb + 1
            idx += ([[a, a + 1, b], [a + 1, b + 1, b]] if up > 0 else [[a, b, a + 1], [a + 1, b, b + 1]])
    return np.array(vp), np.array(vn), np.array(vu), np.array(idx)

# ---------- the tendrils ----------
tend = []          # per piece: verts (global ids), joints (world), weights
tv_all = []
for cid in ids:
    if cid == main: continue
    vid = np.where(comp == cid)[0]
    loc = {v: i for i, v in enumerate(vid)}
    w_of = inv[vid]; wl = {}
    for i, w in enumerate(w_of): wl.setdefault(w, []).append(i)
    tris = I[tri_comp == cid]
    adj = {}
    for t in tris:
        for a, b in ((t[0], t[1]), (t[1], t[2]), (t[2], t[0])):
            wa, wb = inv[a], inv[b]
            if wa == wb: continue
            d = float(np.linalg.norm(P[a] - P[b]))
            adj.setdefault(wa, {})[wb] = d; adj.setdefault(wb, {})[wa] = d
    top = vid[np.argmax(P[vid, 1])]
    dist = {inv[top]: 0.0}; hq = [(0.0, int(inv[top]))]
    while hq:
        d, u = heapq.heappop(hq)
        if d > dist.get(u, 1e9): continue
        for v, w in adj.get(u, {}).items():
            nd = d + w
            if nd < dist.get(v, 1e9): dist[v] = nd; heapq.heappush(hq, (nd, int(v)))
    g = np.array([dist.get(int(w), 0.0) for w in w_of]); L = float(g.max())
    if L < 0.09:                               # a stub: it stays part of the brain
        tend.append({'vid': vid, 'stub': True}); continue
    # the centre line: 24 slices by distance along the piece
    NB = 24; cl = []
    for b in range(NB + 1):
        t = L * b / NB; m = np.abs(g - t) < L / NB * 0.75
        if not m.any(): m = np.abs(g - t) <= np.abs(g - t).min() + 1e-9
        cl.append(P[vid][m].mean(0))
    cl = np.array(cl)
    for _ in range(2): cl[1:-1] = (cl[:-2] + 2 * cl[1:-1] + cl[2:]) / 4
    tpar = np.clip(g / L, 0, 1) * NB; k0 = np.minimum(tpar.astype(int), NB - 1); f = (tpar - k0)[:, None]
    cpt = cl[k0] * (1 - f) + cl[k0 + 1] * f
    grow = THICK * (0.4 + 0.6 * (1 - np.clip(g / L, 0, 1)))[:, None]       # fat at the root, down to a point at the tip
    newP = cpt + (P[vid] - cpt) * grow
    nj = int(max(4, min(9, round(L / 0.055) + 1)))
    jt = np.array([cl[int(round(NB * k / (nj - 1)))] for k in range(nj)])
    nbone = nj - 1
    sp = np.clip(g / L, 0, 1) * nbone - 0.5; b0 = np.floor(sp).astype(int); fr = sp - b0
    ja = np.clip(b0, 0, nbone - 1); jb = np.clip(b0 + 1, 0, nbone - 1)
    tend.append({'vid': vid, 'stub': False, 'P': newP, 'joints': jt, 'ja': ja, 'jb': jb, 'fr': fr, 'L': L})
    tv_all.append(vid)
print('tendrils: %d swing, %d stubs; joints %s' % (sum(1 for t in tend if not t['stub']), sum(1 for t in tend if t['stub']),
      [len(t['joints']) for t in tend if not t['stub']]))

# ---------- the brain's own mesh: everything but the cut cap and the swinging tendrils ----------
swing_v = np.zeros(len(P), bool)
for t in tend:
    if not t['stub']: swing_v[t['vid']] = True
tri_body = ~tri_cap & ~swing_v[I[:, 0]]
def submesh(tri_mask, pos=None):
    tr = I[tri_mask]; used = np.unique(tr); remap = -np.ones(len(P), np.int64); remap[used] = np.arange(len(used))
    return used, remap[tr]
bu, bi = submesh(tri_body)
tu, ti = submesh(swing_v[I[:, 0]])
TP = P.copy()
for t in tend:
    if not t['stub']: TP[t['vid']] = t['P']

# stand it: the lowest tendril tip on y 0
floor = min(TP[tu, 1].min(), P[bu, 1].min())
P[:, 1] -= floor; TP[:, 1] -= floor; EC = EC.copy(); EC[1] -= floor
for t in tend:
    if not t['stub']: t['joints'] = t['joints'] - np.array([0, floor, 0])
bodyP = P[bu]
PIV = np.array([0.0, float((bodyP[:, 1].min() + bodyP[:, 1].max()) / 2), float((bodyP[:, 2].min() + bodyP[:, 2].max()) / 2)])
print('floor moved %.3f; pivot %s; eye %s; height %.3f' % (-floor, np.round(PIV, 3), np.round(EC, 3), P[bu, 1].max()))

# ---------- write ----------
blob = bytearray(); views = []; accs = []
def view(data, target=None):
    while len(blob) % 4: blob.append(0)
    v = {'buffer': 0, 'byteOffset': len(blob), 'byteLength': len(data)}
    if target: v['target'] = target
    blob.extend(data); views.append(v); return len(views) - 1
def accessor(arr, typ, ctype, target=None, minmax=False):
    dt = {5126: '<f4', 5125: '<u4', 5123: '<u2'}[ctype]
    a = np.ascontiguousarray(arr.astype(dt)); bv = view(a.tobytes(), target)
    d = {'bufferView': bv, 'componentType': ctype, 'count': int(a.shape[0]), 'type': typ}
    if minmax: d['min'] = [float(x) for x in a.reshape(a.shape[0], -1).min(0)]; d['max'] = [float(x) for x in a.reshape(a.shape[0], -1).max(0)]
    accs.append(d); return len(accs) - 1
def prim_of(pos, nrm, uv, idx, mat, extra=None):
    at = {'POSITION': accessor(pos, 'VEC3', 5126, 34962, True), 'NORMAL': accessor(nrm, 'VEC3', 5126, 34962), 'TEXCOORD_0': accessor(uv, 'VEC2', 5126, 34962)}
    if extra: at.update(extra)
    return {'attributes': at, 'indices': accessor(idx.reshape(-1), 'SCALAR', 5125, 34963), 'material': mat}

nodes = []; meshes = []
def node(d): nodes.append(d); return len(nodes) - 1
def mesh(name, p): meshes.append({'name': name, 'primitives': [p]}); return len(meshes) - 1

root = node({'name': 'ewBbRoot', 'children': []})
body = node({'name': 'ewBbBody', 'translation': [float(x) for x in PIV], 'children': []})
nodes[root]['children'].append(body)
nodes[body]['children'].append(node({'name': 'ewBbBrain', 'mesh': mesh('ewBbBrain', prim_of(bodyP - PIV, N[bu], UV[bu], bi, 0))}))
EYE_R = ER * 0.985
bp, bn, bu2, bix = ball_mesh(EYE_R)
nodes[body]['children'].append(node({'name': 'ewBbEye', 'translation': [float(x) for x in (EC - PIV)], 'mesh': mesh('ewBbEye', prim_of(bp, bn, bu2, bix, 1))}))
LID_OPEN = 54.0
for nm, up in (('ewBbLidU', 1), ('ewBbLidD', -1)):
    lp, ln, lu, li = lid_mesh(ER * 1.03, up)
    h = math.radians(-up * LID_OPEN) / 2                # rest = open: swung back under the rim
    nodes[body]['children'].append(node({'name': nm, 'translation': [float(x) for x in (EC - PIV)], 'rotation': [math.sin(h), 0, 0, math.cos(h)],
                                          'mesh': mesh(nm, prim_of(lp, ln, lu, li, 2))}))
# the chains
joint_nodes = []; ibm = []; JN = np.zeros((len(P), 4), np.int64); JW = np.zeros((len(P), 4))
col = 0
for t in tend:
    if t['stub']: continue
    base = len(joint_nodes); prev = None; prevpos = PIV
    for k, jp in enumerate(t['joints']):
        n = node({'name': 'ewsway_c%d_%d' % (col, k), 'translation': [float(x) for x in (jp - prevpos)]})
        if prev is None: nodes[body]['children'].append(n)
        else: nodes[prev].setdefault('children', []).append(n)
        m = np.eye(4); m[:3, 3] = -jp; ibm.append(m.T.reshape(-1))      # column-major
        joint_nodes.append(n); prev = n; prevpos = jp
    v = t['vid']
    JN[v, 0] = base + t['ja']; JN[v, 1] = base + t['jb']
    JW[v, 0] = np.where(t['ja'] == t['jb'], 1.0, 1 - np.clip(t['fr'], 0, 1)); JW[v, 1] = 1 - JW[v, 0]
    col += 1
# their normals: the old ones are close enough after a fattening about the centre line
tprim = prim_of(TP[tu], N[tu], UV[tu], ti, 0, None)
tprim['attributes']['JOINTS_0'] = accessor(JN[tu], 'VEC4', 5123, 34962)
tprim['attributes']['WEIGHTS_0'] = accessor(JW[tu], 'VEC4', 5126, 34962)
skin = {'joints': joint_nodes, 'inverseBindMatrices': accessor(np.array(ibm), 'MAT4', 5126), 'skeleton': body}
nodes[root]['children'].append(node({'name': 'ewBbTendrils', 'mesh': mesh('ewBbTendrils', tprim), 'skin': 0}))

img0 = view(JPEG); img1 = view(EYEPNG)
mat0 = dict(J['materials'][0]); mat0['name'] = 'ewBbBrainMat'
gl = {
    'asset': {'version': '2.0', 'generator': 'bake-brain.py'}, 'scene': 0, 'scenes': [{'nodes': [root]}],
    'nodes': nodes, 'meshes': meshes, 'skins': [skin], 'accessors': accs, 'bufferViews': views,
    'materials': [mat0,
                  {'name': 'ewBbEyeMat', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 1}, 'metallicFactor': 0, 'roughnessFactor': 0.25}},
                  {'name': 'ewBbLidMat', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 1}, 'metallicFactor': 0, 'roughnessFactor': 0.8}, 'doubleSided': True}],
    'textures': [{'sampler': 0, 'source': 0}, {'sampler': 0, 'source': 1}],
    'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}],
    'images': [{'mimeType': 'image/jpeg', 'bufferView': img0}, {'mimeType': 'image/png', 'bufferView': img1}],
}
while len(blob) % 4: blob.append(0)
gl['buffers'] = [{'byteLength': len(blob)}]
js = json.dumps(gl, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
with open(OUT, 'wb') as f:
    f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)))
    f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack('<II', len(blob), 0x004E4942)); f.write(bytes(blob))
print('wrote %s  %d bytes, %d nodes, %d joints' % (OUT, 12 + 8 + len(js) + 8 + len(blob), len(nodes), len(joint_nodes)))
