#!/usr/bin/env python3
"""bake-jelly.py (2026-11-28, thread "Redesign the jellyfish race"; mondo: "a real jellyfish is already alien looking
enough. Just need to stylize it a little bit").

    python3 -I bake-jelly.py <preset> <bell.glb> <arm.glb> <out.glb>

A real jellyfish in moving pieces, from two Meshy parts (numpy + pillow, no Blender):
  - ewJfBody   a node at the bell's middle (the renderer's clips lift, tip and turn it)
  - ewJfBell   the bell's mesh (its scale is the pulse)
  - ewJfCore   the ring the ORAL ARMS hang from: the one Meshy arm drawn N times, each copy skinned to its own chain
  - ewJfRim    the ring the thin TENTACLES hang from: tapered tubes made here, each on its own chain
Every chain is THE SWAY's spring bones (`ewsway_c<k>_<j>`), so arms and tentacles trail and whip behind every move.
Metres, the longest tip on y 0. The moves: three-renderer.js THE JELLYFISH, A REAL ONE (procRig `jellyBody`).
Presets (PRESETS below) = one a species: sizes, counts, the tentacles' colour. Both part GLBs stand up their Y axis
(the arm's thick end on top). Notes: champions-combat.md "THE JELLYFISH, A REAL ONE".
"""
import sys, json, struct, io, math
import numpy as np
from PIL import Image

PRESETS = {
    # bell = its width (m); arms: n, len, ring (of the bell's radius), wide (x the arm's own width after the length fit), joints;
    # lights (optional) = a ring of little glowing beads round the rim (part of the bell: they pulse with it)
    # tent: n, len [min, max], r (root radius, m), ring (of the bell's radius), lean (m out at the tip), colour, glow
    'mane':   dict(bell=1.0, arms=dict(n=6, len=0.95, ring=0.22, wide=1.25, joints=6, up=0.10),
                   tent=dict(n=28, len=[0.75, 1.25], r=0.02, ring=0.80, lean=0.10, col=[0.85, 0.25, 0.5], glow=[0.3, 0.05, 0.15], joints=8, up=0.06)),
    'crown':  dict(bell=0.95, arms=dict(n=4, len=1.25, ring=0.16, wide=1.0, joints=7, up=0.10),
                   tent=dict(n=20, len=[0.55, 0.85], r=0.02, ring=0.90, lean=0.28, col=[0.8, 0.12, 0.12], glow=[0.3, 0.02, 0.02], joints=7, up=0.05),
                   lights=dict(n=30, r=0.022, col=[0.25, 0.55, 1.0], glow=[0.5, 1.1, 2.0], out=0.985, up=0.0)),
    'nettle': dict(bell=0.9, arms=dict(n=4, len=1.15, ring=0.14, wide=1.0, joints=7, up=0.10),
                   tent=dict(n=24, len=[0.9, 1.35], r=0.02, ring=0.88, lean=0.06, col=[0.3, 0.3, 0.9], glow=[0.08, 0.08, 0.3], joints=8, up=0.05)),
}
preset, BELL, ARM, OUT = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
C = PRESETS[preset]

def load(path, tex):
    raw = open(path, 'rb').read(); jl = struct.unpack('<I', raw[12:16])[0]
    J = json.loads(raw[20:20 + jl]); B = raw[20 + jl + 8:]
    def acc(i):
        a = J['accessors'][i]; bv = J['bufferViews'][a['bufferView']]
        n = {'VEC3': 3, 'VEC2': 2, 'SCALAR': 1}[a['type']]; dt = {5126: '<f4', 5125: '<u4', 5123: '<u2'}[a['componentType']]
        return np.frombuffer(B, dt, a['count'] * n, bv.get('byteOffset', 0) + a.get('byteOffset', 0)).reshape(-1, n).copy()
    pr = J['meshes'][0]['primitives'][0]
    P = acc(pr['attributes']['POSITION']).astype(np.float64); N = acc(pr['attributes']['NORMAL']).astype(np.float64)
    UV = acc(pr['attributes']['TEXCOORD_0']).astype(np.float64); I = acc(pr['indices']).reshape(-1, 3).astype(np.int64)
    mat = J['materials'][pr.get('material', 0)]
    src = J['textures'][mat['pbrMetallicRoughness']['baseColorTexture']['index']]['source']
    bv = J['bufferViews'][J['images'][src]['bufferView']]
    im = Image.open(io.BytesIO(B[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']])).convert('RGB')
    if im.width > tex: im = im.resize((tex, tex), Image.LANCZOS)
    o = io.BytesIO(); im.save(o, 'JPEG', quality=88)
    return P, N, UV, I, o.getvalue()

bP, bN, bUV, bI, bJPG = load(BELL, 1024)
aP, aN, aUV, aI, aJPG = load(ARM, 512)

# ---------- the bell: centred, its width = the preset's ----------
c = (bP.min(0) + bP.max(0)) / 2; bP -= c
k = C['bell'] / max(np.ptp(bP[:, 0]), np.ptp(bP[:, 2])); bP *= k
bh = np.ptp(bP[:, 1]); R = C['bell'] / 2
# the rim = where the bell is widest, in its lower half
rad = np.hypot(bP[:, 0], bP[:, 2]); low = bP[:, 1] < 0
rim_y = float(np.median(bP[low & (rad > 0.9 * rad[low].max()), 1])) if low.any() else float(bP[:, 1].min())
print('bell %.2f wide, %.2f tall, rim at %.3f under its middle, %d tris' % (C['bell'], bh, rim_y, len(bI)))

# ---------- chains ----------
verts = []   # (P, N, UV, I, material, JN, JW) per piece, world space, the bell's middle = origin for now
chains = []  # [parent ('core' | 'rim'), [joint positions]]
def add_chain(parent, top, tip, joints):
    js = [top + (tip - top) * (i / joints) for i in range(joints + 1)]
    chains.append([parent, js]); return len(chains) - 1
def skin_along(P, top, tip, joints, cid):
    d = tip - top; L = np.linalg.norm(d); t = np.clip(((P - top) @ d) / (L * L), 0, 1) * joints
    a = np.minimum(np.floor(t).astype(np.int64), joints - 1); fr = t - a
    # a chain's bones are its first `joints` joints (the last joint is only the tail's end)
    b = np.minimum(a + 1, joints - 1)
    JN = np.zeros((len(P), 4), np.int64); JW = np.zeros((len(P), 4))
    JN[:, 0] = a; JN[:, 1] = b; JW[:, 0] = np.where(a == b, 1.0, 1 - fr); JW[:, 1] = 1 - JW[:, 0]
    return cid, JN, JW

# the oral arms: the Meshy arm, its length fitted, drawn round the core ring
A = C['arms']
aP -= np.array([(aP[:, 0].min() + aP[:, 0].max()) / 2, aP[:, 1].max(), (aP[:, 2].min() + aP[:, 2].max()) / 2])   # its top middle = origin
ka = A['len'] / np.ptp(aP[:, 1]); aP *= ka; aP[:, [0, 2]] *= A['wide']
core_y = rim_y + A['up']
rng = np.random.RandomState(7)
for i in range(A['n']):
    th = 2 * math.pi * (i + 0.5) / A['n']; cs, sn = math.cos(th), math.sin(th)
    ln = 1.0 - 0.12 * (i % 2)                                      # every second arm a little shorter
    M = np.array([[cs, 0, sn], [0, 1, 0], [-sn, 0, cs]])
    P = aP * np.array([1, ln, 1]) @ M.T; Nn = aN @ M.T
    top = np.array([sn * R * A['ring'], core_y, cs * R * A['ring']])
    P = P + top; tip = top + np.array([sn * 0.04, -A['len'] * ln, cs * 0.04])
    cid = add_chain('core', top, tip, A['joints'])
    verts.append((P, Nn, aUV, aI, 1) + skin_along(P, top, tip, A['joints'], cid))

# the thin tentacles: tapered tubes round the rim
T = C['tent']; SIDES = 5; SEG = 14
for i in range(T['n']):
    th = 2 * math.pi * i / T['n'] + rng.uniform(-0.05, 0.05); cs, sn = math.cos(th), math.sin(th)
    L = T['len'][0] + (T['len'][1] - T['len'][0]) * rng.rand()
    top = np.array([sn * R * T['ring'], rim_y + T['up'], cs * R * T['ring']])
    tip = top + np.array([sn * T['lean'], -L, cs * T['lean']])
    d = (tip - top) / np.linalg.norm(tip - top)
    u1 = np.cross(d, [1, 0, 0]); u1 /= np.linalg.norm(u1); u2 = np.cross(d, u1)
    P = []; Nn = []; UV = []; I = []
    for s in range(SEG + 1):
        f = s / SEG; r = T['r'] * (1 - 0.8 * f) * (1 + 0.35 * math.sin(f * 40 + i))   # tapered, a little beaded
        for q in range(SIDES):
            a = 2 * math.pi * q / SIDES; n = u1 * math.cos(a) + u2 * math.sin(a)
            P.append(top + (tip - top) * f + n * r); Nn.append(n); UV.append([q / SIDES, f])
    for s in range(SEG):
        for q in range(SIDES):
            a = s * SIDES + q; b = s * SIDES + (q + 1) % SIDES; c2 = a + SIDES; d2 = b + SIDES
            I += [[a, c2, b], [b, c2, d2]]
    P = np.array(P); cid = add_chain('rim', top, tip, T['joints'])
    verts.append((P, np.array(Nn), np.array(UV), np.array(I), 2) + skin_along(P, top, tip, T['joints'], cid))

# ---------- stand it: the longest tip on y 0 ----------
floor = min(min(p[0][:, 1].min() for p in verts), bP[:, 1].min())
PIV = np.array([0.0, -floor, 0.0])
print('height %.2f, %d chains' % (bP[:, 1].max() - floor, len(chains)))

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
def mesh(name, prims): meshes.append({'name': name, 'primitives': prims}); return len(meshes) - 1

root = node({'name': 'ewJfRoot', 'children': []})
body = node({'name': 'ewJfBody', 'translation': [float(x) for x in PIV], 'children': []})
nodes[root]['children'].append(body)
bell_prims = [prim_of(bP, bN, bUV, bI, 0)]
if C.get('lights'):
    G = C['lights']; rmax = float(rad[low].max() * k) if False else float(np.hypot(bP[:, 0], bP[:, 2])[np.abs(bP[:, 1] - rim_y) < 0.03].max())
    LP = []; LN = []; LI = []
    oct_v = np.array([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], float)
    oct_i = np.array([[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [4, 3, 0], [1, 3, 4], [5, 3, 1], [0, 3, 5]])
    for i in range(G['n']):
        th = 2 * math.pi * i / G['n']; cen = np.array([math.sin(th) * rmax * G['out'], rim_y + G['up'], math.cos(th) * rmax * G['out']])
        LI.append(oct_i + len(LP) * 6); LP.append(oct_v * G['r'] + cen); LN.append(oct_v)
    LP = np.vstack(LP); bell_prims.append(prim_of(LP, np.vstack(LN), np.zeros((len(LP), 2)), np.vstack(LI), 3))
nodes[body]['children'].append(node({'name': 'ewJfBell', 'mesh': mesh('ewJfBell', bell_prims)}))
ring = {'core': node({'name': 'ewJfCore', 'translation': [0, core_y, 0], 'children': []}),
        'rim': node({'name': 'ewJfRim', 'translation': [0, rim_y + T['up'], 0], 'children': []})}
ring_y = {'core': core_y, 'rim': rim_y + T['up']}
nodes[body]['children'] += [ring['core'], ring['rim']]
joint_nodes = []; ibm = []; base = []
for k2, (par, js) in enumerate(chains):
    base.append(len(joint_nodes)); prev = None; prevpos = np.array([0, ring_y[par], 0])
    for j, jp in enumerate(js):
        n = node({'name': 'ewsway_c%d_%d' % (k2, j), 'translation': [float(x) for x in (jp - prevpos)]})
        if prev is None: nodes[ring[par]]['children'].append(n)
        else: nodes[prev].setdefault('children', []).append(n)
        m = np.eye(4); m[:3, 3] = -(jp + PIV); ibm.append(m.T.reshape(-1))
        joint_nodes.append(n); prev = n; prevpos = jp
prims = []
for mat in (1, 2):
    ps = [v for v in verts if v[4] == mat]; off = 0; PP = []; NN = []; UU = []; II = []; JJ = []; WW = []
    for (P, Nn, UV, I, _m, cid, JN, JW) in ps:
        PP.append(P + PIV); NN.append(Nn); UU.append(UV); II.append(I + off); JJ.append(JN + base[cid]); WW.append(JW); off += len(P)
    pr = prim_of(np.vstack(PP), np.vstack(NN), np.vstack(UU), np.vstack(II), mat)
    pr['attributes']['JOINTS_0'] = accessor(np.vstack(JJ), 'VEC4', 5123, 34962)
    pr['attributes']['WEIGHTS_0'] = accessor(np.vstack(WW), 'VEC4', 5126, 34962)
    prims.append(pr)
skin = {'joints': joint_nodes, 'inverseBindMatrices': accessor(np.array(ibm), 'MAT4', 5126), 'skeleton': body}
nodes[root]['children'].append(node({'name': 'ewJfHang', 'mesh': mesh('ewJfHang', prims), 'skin': 0}))
i0 = view(bJPG); i1 = view(aJPG)
gl = {
    'asset': {'version': '2.0', 'generator': 'bake-jelly.py'}, 'scene': 0, 'scenes': [{'nodes': [root]}],
    'nodes': nodes, 'meshes': meshes, 'skins': [skin], 'accessors': accs, 'bufferViews': views,
    'materials': [{'name': 'ewJfBellMat', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': 0, 'roughnessFactor': 0.35}, 'doubleSided': True},
                  {'name': 'ewJfArmMat', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 1}, 'metallicFactor': 0, 'roughnessFactor': 0.45}, 'doubleSided': True},
                  {'name': 'ewJfTentMat', 'pbrMetallicRoughness': {'baseColorFactor': T['col'] + [1], 'metallicFactor': 0, 'roughnessFactor': 0.4}, 'emissiveFactor': T['glow']}] +
                 ([{'name': 'ewJfLightMat', 'pbrMetallicRoughness': {'baseColorFactor': C['lights']['col'] + [1], 'metallicFactor': 0, 'roughnessFactor': 0.3},
                    'emissiveFactor': [min(1.0, x) for x in C['lights']['glow']]}] if C.get('lights') else []),
    'textures': [{'sampler': 0, 'source': 0}, {'sampler': 0, 'source': 1}],
    'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}],
    'images': [{'mimeType': 'image/jpeg', 'bufferView': i0}, {'mimeType': 'image/jpeg', 'bufferView': i1}],
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
