#!/usr/bin/env python3
"""bake-sway.py -- THE SWAY (2026-11-01): bake spring-bone chains into a rigged Meshy GLB (repo-only tooling).

A Meshy character is ONE fused shell: a cape, a coat tail or a tail is painted on and weighted to the legs, so it
splits with every stride. This tool finds the loose part (by its colour in the baked texture + where it sits on the
body), cuts the few triangles that web it to the body below the shoulders, adds chains of extra bones named
`ewsway_c<col>_<joint>` (joint 0 hangs on a body bone, the last joint is the tail) and re-weights the part onto them,
fading from the body's own weights at the top. Everything else in the file is kept byte for byte (the rig's names,
rest pose and inverse binds the animation retarget relies on), so it edits the GLB directly rather than through a
Blender re-export. three-renderer.js THE SWAY swings the chains at run time (sprites.js: point the race at the new file).

    python3 bake-sway.py <preset> <in.glb> <out.glb> [--debug <dir>]
    presets: superhero-cape

Needs numpy + pillow (the cloud Blender venv has both: python3 -m venv v && v/bin/pip install bpy pillow).
Then compress it like any model: optimize-assets.js --ktx2 --flat, add the two files + the alt to ASSET_MANIFEST.json.
"""
import json, struct, sys, io, os
import numpy as np
from PIL import Image

# ── presets: which part, how many chains ───────────────────────────────────────────────────────────────────────────
# red: texture rule (R > g*G and R > b*B and R > lo); behind: max z (glTF +Z = the front); y: height band of the part;
# low: below this height the part must be behind the heel (z < lowZ) or far off the legs (legs > lowFar);
# legs / arms: keep clear of the limb capsules (m); levels: joint heights (top = the anchor row); width: column spread.
PRESETS = {
    'superhero-cape': {
        'red': (1.5, 1.2, 45), 'behind': 0.05, 'y': (0.15, 1.42), 'low': 0.5, 'lowZ': -0.1, 'lowLegs': 0.06, 'lowFar': 0.14,
        'legs': 0.085, 'arms': 0.07, 'parent': 'Spine', 'cols': 5, 'width': 0.8,
        'levels': [1.30, 1.08, 0.86, 0.64, 0.42, 0.20], 'blend': 0.14, 'webBelow': 1.2,
    },
}

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def read(path):
    b = open(path, 'rb').read()
    assert struct.unpack('<I', b[:4])[0] == 0x46546c67, 'not a GLB'
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl]); o = 20 + jl
    bl = struct.unpack('<I', b[o:o + 4])[0]
    return j, bytearray(b[o + 8:o + 8 + bl])


def acc(j, b, i):
    a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]; t = CT[a['componentType']]; n = NC[a['type']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); st = bv.get('byteStride', 0); es = np.dtype(t).itemsize
    if st and st != n * es:
        raw = np.frombuffer(bytes(b[off:off + st * a['count']]), dtype=np.uint8).reshape(a['count'], st)[:, :n * es]
        return np.frombuffer(raw.tobytes(), dtype=t).reshape(a['count'], n)
    return np.frombuffer(bytes(b[off:off + a['count'] * n * es]), dtype=t).reshape(a['count'], n).copy()


def view_bytes(j, b, i):
    bv = j['bufferViews'][i]; o = bv.get('byteOffset', 0)
    return bytes(b[o:o + bv['byteLength']])


def append_acc(j, b, arr, ctype, typ, target=None):
    while len(b) % 4: b.append(0)
    arr = np.ascontiguousarray(arr.astype(CT[ctype])); off = len(b); b.extend(arr.tobytes())
    bv = {'buffer': 0, 'byteOffset': off, 'byteLength': arr.nbytes}
    if target: bv['target'] = target
    j['bufferViews'].append(bv)
    j['accessors'].append({'bufferView': len(j['bufferViews']) - 1, 'componentType': ctype, 'count': int(arr.shape[0]), 'type': typ})
    return len(j['accessors']) - 1


def write(path, j, b):
    while len(b) % 4: b.append(0)
    j['buffers'] = [{'byteLength': len(b)}]
    js = json.dumps(j, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
    open(path, 'wb').write(struct.pack('<III', 0x46546c67, 2, 12 + 8 + len(js) + 8 + len(b)) +
                           struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(b), 0x004E4942) + bytes(b))


def quat_m(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def m_quat(m):
    tr = m[0, 0] + m[1, 1] + m[2, 2]
    if tr > 0:
        s = np.sqrt(tr + 1) * 2; return [(m[2, 1] - m[1, 2]) / s, (m[0, 2] - m[2, 0]) / s, (m[1, 0] - m[0, 1]) / s, 0.25 * s]
    i = int(np.argmax([m[0, 0], m[1, 1], m[2, 2]]))
    if i == 0:
        s = np.sqrt(1 + m[0, 0] - m[1, 1] - m[2, 2]) * 2; return [0.25 * s, (m[0, 1] + m[1, 0]) / s, (m[0, 2] + m[2, 0]) / s, (m[2, 1] - m[1, 2]) / s]
    if i == 1:
        s = np.sqrt(1 + m[1, 1] - m[0, 0] - m[2, 2]) * 2; return [(m[0, 1] + m[1, 0]) / s, 0.25 * s, (m[1, 2] + m[2, 1]) / s, (m[0, 2] - m[2, 0]) / s]
    s = np.sqrt(1 + m[2, 2] - m[0, 0] - m[1, 1]) * 2; return [(m[0, 2] + m[2, 0]) / s, (m[1, 2] + m[2, 1]) / s, 0.25 * s, (m[1, 0] - m[0, 1]) / s]


def local(n):
    if 'matrix' in n: return np.array(n['matrix']).reshape(4, 4).T
    M = np.eye(4); M[:3, :3] = quat_m(n.get('rotation', [0, 0, 0, 1])) @ np.diag(n.get('scale', [1, 1, 1])); M[:3, 3] = n.get('translation', [0, 0, 0])
    return M


def globals_(j):
    par = {c: i for i, n in enumerate(j['nodes']) for c in n.get('children', [])}
    G = [None] * len(j['nodes'])
    def g(i):
        if G[i] is None: G[i] = (g(par[i]) if i in par else np.eye(4)) @ local(j['nodes'][i])
        return G[i]
    for i in range(len(G)): g(i)
    return G


def segd(P, a, b):
    ab = b - a; t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)


def main():
    args = sys.argv[1:]
    dbg = None
    if '--debug' in args: k = args.index('--debug'); dbg = args[k + 1]; del args[k:k + 2]
    if len(args) != 3 or args[0] not in PRESETS: print(__doc__); sys.exit(1)
    C = PRESETS[args[0]]; src, dst = args[1], args[2]
    j, b = read(src); G = globals_(j)
    sk = j['skins'][0]; J = list(sk['joints']); names = [j['nodes'][k]['name'] for k in J]
    IBM = acc(j, b, sk['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
    S = G[J[0]] @ IBM[0]   # the bind shape (identity on a Meshy export): vertex rest position = S · POSITION
    JW = {names[k]: (G[J[k]])[:3, 3] for k in range(len(J))}
    p = j['meshes'][0]['primitives'][0]
    P = acc(j, b, p['attributes']['POSITION']).astype(float); P = (np.c_[P, np.ones(len(P))] @ S.T)[:, :3]
    UV = acc(j, b, p['attributes']['TEXCOORD_0']).astype(float)
    img = j['images'][j['textures'][j['materials'][p.get('material', 0)]['pbrMetallicRoughness']['baseColorTexture']['index']]['source']]
    A = np.asarray(Image.open(io.BytesIO(view_bytes(j, b, img['bufferView']))).convert('RGB')).astype(float)
    H, W = A.shape[:2]
    col = A[np.clip((UV[:, 1] % 1) * H, 0, H - 1).astype(int), np.clip((UV[:, 0] % 1) * W, 0, W - 1).astype(int)]
    # ── the part ──
    legs = np.minimum.reduce([segd(P, JW[s + 'UpLeg'], JW[s + 'Leg']) for s in ('Left', 'Right')] +
                             [segd(P, JW[s + 'Leg'], JW[s + 'Foot']) for s in ('Left', 'Right')])
    hand = lambda s: JW.get(s + 'Hand_End', JW[s + 'Hand'])
    arms = np.minimum.reduce([segd(P, JW[s + 'Arm'], JW[s + 'ForeArm']) for s in ('Left', 'Right')] +
                             [segd(P, JW[s + 'ForeArm'], hand(s)) for s in ('Left', 'Right')])
    g, bb, lo = C['red']
    red = (col[:, 0] > lo) & (col[:, 0] > g * col[:, 1]) & (col[:, 0] > bb * col[:, 2])
    low = P[:, 1] < C['low']
    part = red & (P[:, 2] < C['behind']) & (arms > C['arms']) & (P[:, 1] > C['y'][0]) & (P[:, 1] < C['y'][1]) & \
        np.where(low, ((P[:, 2] < C['lowZ']) & (legs > C['lowLegs'])) | (legs > C['lowFar']), legs > C['legs'])
    cp = P[part]
    if len(cp) < 50: sys.exit('bake-sway: only %d part vertices found -- wrong preset for this file?' % len(cp))
    LEV = C['levels']; NCOL = C['cols']; ucol = np.linspace(-C['width'], C['width'], NCOL)
    def hw(y):
        m = np.abs(cp[:, 1] - y) < 0.04
        return max(0.12, np.percentile(np.abs(cp[m, 0]), 95)) if m.sum() > 5 else 0.25
    def surf(x, y):
        m = (np.abs(cp[:, 1] - y) < 0.06) & (np.abs(cp[:, 0] - x) < 0.08)
        return np.percentile(cp[m, 2], 25) if m.sum() > 3 else np.percentile(cp[np.abs(cp[:, 1] - y) < 0.08, 2], 25)
    chains = []
    for c in range(NCOL):
        ch = np.array([[ucol[c] * hw(y), y, surf(ucol[c] * hw(y), y) + 0.01] for y in LEV]); zz = ch[:, 2].copy()
        for l in range(1, len(LEV) - 1): ch[l, 2] = 0.25 * zz[l - 1] + 0.5 * zz[l] + 0.25 * zz[l + 1]
        chains.append(ch)
    # ── the bones ──
    par = next(k for k, n in enumerate(j['nodes']) if n['name'] == C['parent'])
    newJ = []; newIBM = []
    for c in range(NCOL):
        prev = None
        for l in range(len(LEV)):
            ni = len(j['nodes']); pos = chains[c][l]
            if l == 0:
                T = np.eye(4); T[:3, 3] = pos; L = np.linalg.inv(G[par]) @ T
                node = {'name': 'ewsway_c%d_%d' % (c, l), 'translation': L[:3, 3].tolist(), 'rotation': [float(v) for v in m_quat(L[:3, :3])]}
                j['nodes'][par].setdefault('children', []).append(ni)
            else:
                node = {'name': 'ewsway_c%d_%d' % (c, l), 'translation': (pos - chains[c][l - 1]).tolist()}
                j['nodes'][prev].setdefault('children', []).append(ni)
            j['nodes'].append(node); prev = ni; newJ.append(ni)
            M = np.eye(4); M[:3, 3] = -pos; newIBM.append((M @ S).T.reshape(16))
    j0 = len(J); sk['joints'] = J + newJ
    sk['inverseBindMatrices'] = append_acc(j, b, np.vstack([IBM.transpose(0, 2, 1).reshape(-1, 16), np.array(newIBM)]), 5126, 'MAT4')
    slot = lambda c, l: j0 + c * len(LEV) + l
    # ── the weights ──
    Ji = acc(j, b, p['attributes']['JOINTS_0']).astype(int); Wt = acc(j, b, p['attributes']['WEIGHTS_0']).astype(float)
    nl = len(LEV)
    for i in np.where(part)[0]:
        x, y, z = P[i]; yy = min(max(y, LEV[-1]), LEV[0]); u = x / hw(yy)
        cf = np.interp(u, ucol, np.arange(NCOL)); c0 = min(max(int(np.floor(cf)), 0), NCOL - 2); fc = np.clip(cf - c0, 0, 1)
        lf = np.interp(-yy, [-v for v in LEV], np.arange(nl)); l0 = min(max(int(np.floor(lf)), 0), nl - 2); fl = lf - l0
        if fl < 0.3 and l0 > 0: la, lb, fb = l0 - 1, l0, 0.5 + fl / 0.6
        elif fl > 0.7 and l0 < nl - 2: la, lb, fb = l0, l0 + 1, (fl - 0.7) / 0.6
        else: la, lb, fb = l0, l0, 1.0
        s = np.clip((LEV[0] - y) / C['blend'], 0, 1); s = s * s * (3 - 2 * s)
        tot = {}
        for k in range(4):
            if Wt[i, k] > 0: tot[int(Ji[i, k])] = tot.get(int(Ji[i, k]), 0) + Wt[i, k] * (1 - s)
        for cc, wc in ((c0, 1 - fc), (c0 + 1, fc)):
            for ll, wl in ((la, 1 - fb), (lb, fb)):
                if wc * wl > 1e-4: tot[slot(cc, ll)] = tot.get(slot(cc, ll), 0) + wc * wl * s
        top = sorted(tot.items(), key=lambda kv: -kv[1])[:4]; sm = sum(v for _, v in top)
        Ji[i] = [k for k, _ in top] + [0] * (4 - len(top)); Wt[i] = [v / sm for _, v in top] + [0] * (4 - len(top))
    # ── the webs: triangles joining the part to the body below the shoulders (they would stretch into sheets) ──
    I = acc(j, b, p['indices']).reshape(-1, 3); cc = part[I].sum(1)
    web = (cc > 0) & (cc < 3) & (P[I][:, :, 1].max(1) < C['webBelow'])
    ia = j['accessors'][p['indices']]
    p['indices'] = append_acc(j, b, I[~web].reshape(-1), ia['componentType'], 'SCALAR', 34963)
    p['attributes']['JOINTS_0'] = append_acc(j, b, Ji, 5121 if len(sk['joints']) < 256 else 5123, 'VEC4', 34962)
    p['attributes']['WEIGHTS_0'] = append_acc(j, b, Wt, 5126, 'VEC4', 34962)
    j['asset'].setdefault('extras', {})['ewSway'] = {'preset': args[0], 'chains': NCOL, 'joints': nl, 'parent': C['parent']}
    write(dst, j, b)
    print('bake-sway: %s -> %s · %d part vertices · %d chains x %d joints on %s · %d web triangles cut'
          % (src, dst, int(part.sum()), NCOL, nl, C['parent'], int(web.sum())))
    if dbg:   # side + back scatter: the part red, the rest grey
        os.makedirs(dbg, exist_ok=True); Sz = 600; im = Image.new('RGB', (Sz * 2, Sz), (30, 30, 30)); px = im.load(); sc = (Sz - 20) / max(1e-6, P[:, 1].max())
        for k in np.argsort(P[:, 2]):
            x, y, z = P[k]; cl = (255, 60, 60) if part[k] else (90, 90, 110); v = int(Sz - 10 - y * sc)
            for u in (int(Sz / 2 - z * sc), int(Sz + Sz / 2 - x * sc) if z < C['behind'] else -1):
                if 0 <= u < 2 * Sz and 0 <= v < Sz: px[u, v] = cl
        im.save(os.path.join(dbg, 'sway_part.png'))


if __name__ == '__main__':
    main()
