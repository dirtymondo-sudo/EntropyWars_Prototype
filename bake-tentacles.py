#!/usr/bin/env python3
"""bake-tentacles.py -- THE HANGING TENTACLES (2026-11-24, the Jellyfish remake): hang N copies of one tentacle mesh round a
rigged Meshy body's waist, each skinned to its own chain of THE SWAY's spring bones (`ewsway_c<col>_<j>`, hung on Hips), so
three-renderer.js THE SWAY swings them behind every clip (walk, cast, hit). The body, its rig, its weights and its clips are
kept byte for byte; the tentacles are a second primitive of the body's mesh on the same skin (their own material + texture).

    python3 bake-tentacles.py <rigged body.glb> <tentacle.glb> <out.glb> [--n 10] [--y 0.88] [--len 0.62,0.74] [--width 0.5]
                              [--slant 0.25] [--joints 6] [--inset 0.9]

The tentacle GLB is any one-mesh model standing up its Y axis (thick end on top); decimate it first (a Meshy tentacle is 30K tris).
--y = the waist height (m) where the tops sit, --len = the lengths it alternates, --width = scale across, --slant = how far the
chains lean out (a cone, so the baked pose sits clear of the thigh capsules THE SWAY pushes them out of), --inset = how deep the
tops sit inside the waist. Needs numpy + pillow.
"""
import json, struct, sys, math
import numpy as np

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}

def read(path):
    b = open(path, 'rb').read(); jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl]); o = 20 + jl; bl = struct.unpack('<I', b[o:o + 4])[0]
    return j, bytearray(b[o + 8:o + 8 + bl])

def acc(j, b, i):
    a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]; t = np.dtype(CT[a['componentType']]); n = NC[a['type']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); st = bv.get('byteStride', 0)
    if st and st != n * t.itemsize:
        raw = np.frombuffer(bytes(b[off:off + st * a['count']]), np.uint8).reshape(a['count'], st)[:, :n * t.itemsize]
        return np.frombuffer(raw.tobytes(), t).reshape(a['count'], n).copy()
    return np.frombuffer(bytes(b[off:off + a['count'] * n * t.itemsize]), t).reshape(a['count'], n).copy()

def put(j, b, arr, ctype, typ, target=None, mm=False):
    while len(b) % 4: b.append(0)
    arr = np.ascontiguousarray(arr.astype(CT[ctype])); off = len(b); b.extend(arr.tobytes())
    bv = {'buffer': 0, 'byteOffset': off, 'byteLength': arr.nbytes}
    if target: bv['target'] = target
    j['bufferViews'].append(bv)
    a = {'bufferView': len(j['bufferViews']) - 1, 'componentType': ctype, 'count': int(arr.shape[0]), 'type': typ}
    if mm: a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
    j['accessors'].append(a); return len(j['accessors']) - 1

def write(path, j, b):
    while len(b) % 4: b.append(0)
    j['buffers'] = [{'byteLength': len(b)}]
    js = json.dumps(j, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
    open(path, 'wb').write(struct.pack('<III', 0x46546c67, 2, 12 + 8 + len(js) + 8 + len(b)) +
                           struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(b), 0x004E4942) + bytes(b))

def q2m(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])

def m2q(R):
    t = np.trace(R)
    if t > 0:
        s = math.sqrt(t + 1) * 2; return [(R[2, 1] - R[1, 2]) / s, (R[0, 2] - R[2, 0]) / s, (R[1, 0] - R[0, 1]) / s, s / 4]
    i = int(np.argmax(np.diag(R))); k = [(1, 2), (2, 0), (0, 1)][i]
    s = math.sqrt(1 + R[i, i] - R[k[0], k[0]] - R[k[1], k[1]]) * 2
    q = [0, 0, 0, 0]; q[i] = s / 4; q[k[0]] = (R[k[0], i] + R[i, k[0]]) / s; q[k[1]] = (R[k[1], i] + R[i, k[1]]) / s
    q[3] = (R[k[1], k[0]] - R[k[0], k[1]]) / s; return q

def opt(name, d):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else d

def main():
    src, tsrc, out = sys.argv[1:4]
    N = int(opt('--n', 10)); Y = float(opt('--y', 0.88)); LENS = [float(x) for x in opt('--len', '0.62,0.74').split(',')]
    WID = float(opt('--width', 0.5)); SL = float(opt('--slant', 0.25)); NJ = int(opt('--joints', 6)); INS = float(opt('--inset', 0.9))
    j, b = read(src); tj, tb = read(tsrc)
    sk = j['skins'][0]; joints = sk['joints']
    IBM = acc(j, b, sk['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
    hips = next(i for i, n in enumerate(j['nodes']) if n.get('name') == 'Hips')
    Hw = np.linalg.inv(IBM[joints.index(hips)])            # Hips' bind matrix (mesh space = the rig's bind world)
    prim = j['meshes'][0]['primitives'][0]
    P = acc(j, b, prim['attributes']['POSITION'])
    # the waist: the body's own section at Y (arms kept out by |x| < 0.2 of the height)
    H = float(P[:, 1].max()); band = P[(abs(P[:, 1] - Y) < 0.015) & (abs(P[:, 0]) < 0.2 * H / 1.75 * 1.25)]
    cx, cz = float(np.median(band[:, 0])), float(np.median(band[:, 2]))
    ang = np.arctan2(band[:, 2] - cz, band[:, 0] - cx); rad = np.hypot(band[:, 0] - cx, band[:, 2] - cz)
    def radius(a):
        d = np.abs((ang - a + np.pi) % (2 * np.pi) - np.pi); s = d < 0.35
        return float(rad[s].max()) if s.any() else float(rad.max())
    # the tentacle, its axis down -Y, the top at 0
    tp = tj['meshes'][0]['primitives'][0]; TA = tp['attributes']
    TP = acc(tj, tb, TA['POSITION']).astype(np.float64); TN = acc(tj, tb, TA['NORMAL']).astype(np.float64)
    TU = acc(tj, tb, TA['TEXCOORD_0']); TI = acc(tj, tb, tp['indices']).reshape(-1).astype(np.uint32)
    th = TP[:, 1].max() - TP[:, 1].min(); TP[:, 1] -= TP[:, 1].max(); TP[:, 0] -= TP[:, 0].mean(); TP[:, 2] -= TP[:, 2].mean()
    timg = tj['images'][tj['materials'][tp.get('material', 0)]['pbrMetallicRoughness']['baseColorTexture']['index'] if 'textures' not in tj else tj['textures'][tj['materials'][tp.get('material', 0)]['pbrMetallicRoughness']['baseColorTexture']['index']]['source']]
    tv = tj['bufferViews'][timg['bufferView']]; tbytes = bytes(tb[tv.get('byteOffset', 0):tv.get('byteOffset', 0) + tv['byteLength']])
    base = len(joints); newIBM = []; allP, allN, allU, allJ, allW, allI = [], [], [], [], [], []
    hipsWorldInv = np.linalg.inv(Hw)
    used = {int(m) for n in j['nodes'] for m in [__import__('re').match(r'ewsway_c(\d+)_', n.get('name', '')) ] if m for m in [m.group(1)]}
    col0 = max([200] + [c + 1 for c in used])
    for i in range(N):
        a = 2 * math.pi * (i + 0.5) / N; L = LENS[i % len(LENS)]
        r = radius(a) * INS; out_ = np.array([math.cos(a), 0, math.sin(a)])
        root = np.array([cx, Y, cz]) + out_ * r
        d = np.array([0, -1.0, 0]) + out_ * SL; d /= np.linalg.norm(d)
        seg = L / (NJ - 1)
        pts = [root + d * seg * k for k in range(NJ)]
        # the chain: joint 0 on Hips (its world turn undone so the chain is world-aligned at bind), the rest straight on
        col = col0 + i; prev = hips
        for k, p in enumerate(pts):
            if k == 0:
                M = hipsWorldInv @ np.block([[np.eye(3), p.reshape(3, 1)], [np.zeros((1, 3)), np.ones((1, 1))]])
                Rs = M[:3, :3]; sc = np.linalg.norm(Rs, axis=0); R = Rs / sc
                node = {'name': f'ewsway_c{col}_{k}', 'translation': M[:3, 3].tolist(), 'rotation': m2q(R), 'scale': sc.tolist()}
            else:
                node = {'name': f'ewsway_c{col}_{k}', 'translation': (d * seg).tolist()}
            j['nodes'].append(node); ni = len(j['nodes']) - 1
            j['nodes'][prev].setdefault('children', []).append(ni); prev = ni
            joints.append(ni)
            ib = np.eye(4); ib[:3, 3] = -p; newIBM.append(ib)
        # the mesh along the chain: Y axis -> d, scaled to L, across by WID
        up = np.array([0, -1.0, 0]); v = np.cross(up, d); s = np.linalg.norm(v); c = float(np.dot(up, d))
        if s < 1e-8: Rot = np.eye(3)
        else:
            vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]]); Rot = np.eye(3) + vx + vx @ vx * ((1 - c) / s ** 2)
        spin = a * 1.7
        Rz = np.array([[math.cos(spin), 0, math.sin(spin)], [0, 1, 0], [-math.sin(spin), 0, math.cos(spin)]])   # each copy turned: no two alike
        S = np.diag([WID, L / th, WID])
        loc = (Rz @ S @ TP.T).T; t = -loc[:, 1] / L * (NJ - 1)
        q = (Rot @ (loc * [1, -1, 1] * [1, -1, 1]).T).T + root
        nrm = (Rot @ Rz @ (np.linalg.inv(S).T @ TN.T)).T; nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-9
        j0 = np.clip(np.floor(t), 0, NJ - 2).astype(int); fr = np.clip(t - j0, 0, 1)
        J = np.zeros((len(q), 4), np.uint16); W = np.zeros((len(q), 4), np.float32)
        J[:, 0] = base + (len(newIBM) - NJ) + j0; J[:, 1] = J[:, 0] + 1; W[:, 0] = 1 - fr; W[:, 1] = fr
        allI.append(TI + sum(len(x) for x in allP)); allP.append(q); allN.append(nrm); allU.append(TU); allJ.append(J); allW.append(W)
    # the skin: the old binds + the chains'
    ibm = np.concatenate([IBM, np.array(newIBM)]).transpose(0, 2, 1).reshape(-1, 16)
    sk['inverseBindMatrices'] = put(j, b, ibm, 5126, 'MAT4')
    A = {'POSITION': put(j, b, np.concatenate(allP), 5126, 'VEC3', 34962, mm=True), 'NORMAL': put(j, b, np.concatenate(allN), 5126, 'VEC3', 34962),
         'TEXCOORD_0': put(j, b, np.concatenate(allU), 5126, 'VEC2', 34962), 'JOINTS_0': put(j, b, np.concatenate(allJ), 5123, 'VEC4', 34962),
         'WEIGHTS_0': put(j, b, np.concatenate(allW), 5126, 'VEC4', 34962)}
    ii = put(j, b, np.concatenate(allI), 5125, 'SCALAR', 34963)
    while len(b) % 4: b.append(0)
    j['bufferViews'].append({'buffer': 0, 'byteOffset': len(b), 'byteLength': len(tbytes)}); b.extend(tbytes)
    j['images'].append({'bufferView': len(j['bufferViews']) - 1, 'mimeType': 'image/jpeg', 'name': 'tentacle'})
    j['textures'].append({'source': len(j['images']) - 1, **({'sampler': j['textures'][0]['sampler']} if 'sampler' in j['textures'][0] else {})})
    j['materials'].append({'name': 'tentacle', 'pbrMetallicRoughness': {'baseColorTexture': {'index': len(j['textures']) - 1}, 'metallicFactor': 0, 'roughnessFactor': 0.6}, 'doubleSided': True})
    j['meshes'][0]['primitives'].append({'attributes': A, 'indices': ii, 'material': len(j['materials']) - 1})
    write(out, j, b)
    print('wrote', out, 'tentacles', N, 'joints', len(joints), 'verts', sum(len(x) for x in allP))

if __name__ == '__main__':
    main()
