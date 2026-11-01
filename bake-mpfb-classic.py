"""bake-mpfb-classic.py - THE CLASSIC MPFB BODIES (2026-11-01, mondo: "i like the old bodies, but i like the skin texture of
the new bodies, but i also want the head of the new bodies on the old bodies since they have the mouths and blinking").

Builds charactercreation/mpfb/mpfb_classic_<male|female>.glb: the MPFB body of that gender (MakeHuman's hm08 mesh, its
UVs, stock skin, eyes, teeth, 52 ARKit + 15 viseme morphs, weights, _BASE_INDEX) RESHAPED below the neck onto the classic
creator base (charactercreation/Meshy_AI_human_body_base_mesh_<g>_rigged.glb). The head is the MPFB head untouched
(scaled to the classic head's size, morphs scaled with it); the hands and feet stay MakeHuman's (gloves and shoes fit).
Because the mesh is still hm08, every skin / eye / brow / lash pick, the body sliders and the pack clothes keep working.

How (numpy + Blender's mathutils BVH, no Blender scene, no MPFB checkout needed):
 1. coarse: each MPFB bone gets an affine onto the classic skeleton (torso = one scale about the hip centre, limbs =
    rotate + stretch each segment joint to joint, hands / feet = rigid + uniform scale, head = uniform scale with its
    crown on the classic crown); the skin follows by MPFB's own weights (linear blend).
 2. fine: every vertex (minus head, hands, feet, faded by their bone weights) is pulled onto the nearest classic surface
    point with the same facing, the pull smoothed over the welded mesh (coarse to fine), 8 rounds.
 3. the joints move with their bone's affine (rest rotations turned with the limb), inverse binds rebuilt, normals
    recomputed (welded by _BASE_INDEX), morph offsets x the head scale.
 4. _FIT_D (float32 VEC3) = this body minus the MPFB body it came from, per vertex, and mesh extras ewFit {from}, so
    three-renderer.js buildWear puts a pack garment's fit for that body on it and moves it by the nearest vertex's offset.

Usage: pip install bpy==5.2.3 numpy ; python3 -I bake-mpfb-classic.py [--repo <checkout>] [--genders male,female]
"""
import sys, os, json, struct, argparse
import numpy as np

CT = {5126: np.float32, 5123: np.uint16, 5121: np.uint8, 5125: np.uint32, 5122: np.int16, 5120: np.int8}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


class Glb:
    def __init__(self, path):
        b = open(path, 'rb').read()
        o = 12
        self.J = None
        self.B = None
        while o < len(b):
            L, T = struct.unpack('<II', b[o:o + 8])
            c = b[o + 8:o + 8 + L]
            if T == 0x4E4F534A:
                self.J = json.loads(c)
            else:
                self.B = bytearray(c)
            o += 8 + L

    def view(self, i):
        a = self.J['accessors'][i]
        bv = self.J['bufferViews'][a['bufferView']]
        dt = CT[a['componentType']]
        n = NC[a['type']]
        assert not bv.get('byteStride') or bv['byteStride'] == np.dtype(dt).itemsize * n
        off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        return np.frombuffer(self.B, dt, count=a['count'] * n, offset=off).reshape(a['count'], n), off

    def get(self, i):
        return self.view(i)[0].copy()

    def put(self, i, arr):
        cur, off = self.view(i)
        arr = np.ascontiguousarray(arr, dtype=cur.dtype).reshape(cur.shape)
        self.B[off:off + arr.nbytes] = arr.tobytes()
        a = self.J['accessors'][i]
        if 'min' in a:
            a['min'] = [float(v) for v in arr.min(0)]
            a['max'] = [float(v) for v in arr.max(0)]

    def add(self, arr, typ):
        arr = np.ascontiguousarray(arr, dtype=np.float32)
        while len(self.B) % 4:
            self.B.append(0)
        off = len(self.B)
        self.B += arr.tobytes()
        self.J['bufferViews'].append({'buffer': 0, 'byteOffset': off, 'byteLength': arr.nbytes})
        self.J['accessors'].append({'bufferView': len(self.J['bufferViews']) - 1, 'componentType': 5126,
                                    'count': int(arr.shape[0]), 'type': typ})
        return len(self.J['accessors']) - 1

    def world(self):
        N = self.J['nodes']
        par = {}
        for i, n in enumerate(N):
            for c in n.get('children', []):
                par[c] = i
        W = {}

        def w(i):
            if i in W:
                return W[i]
            M = local(N[i])
            if i in par:
                M = w(par[i]) @ M
            W[i] = M
            return M
        for i in range(len(N)):
            w(i)
        return W, par

    def save(self, path):
        while len(self.B) % 4:
            self.B.append(0)
        self.J['buffers'][0]['byteLength'] = len(self.B)
        js = json.dumps(self.J, separators=(',', ':')).encode()
        js += b' ' * ((4 - len(js) % 4) % 4)
        out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(self.B))
        out += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(self.B), 0x004E4942) + bytes(self.B)
        open(path, 'wb').write(out)


def quat_mat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def mat_quat(R):
    t = np.trace(R)
    if t > 0:
        s = np.sqrt(t + 1) * 2
        q = [(R[2, 1] - R[1, 2]) / s, (R[0, 2] - R[2, 0]) / s, (R[1, 0] - R[0, 1]) / s, 0.25 * s]
    elif R[0, 0] > R[1, 1] and R[0, 0] > R[2, 2]:
        s = np.sqrt(1 + R[0, 0] - R[1, 1] - R[2, 2]) * 2
        q = [0.25 * s, (R[0, 1] + R[1, 0]) / s, (R[0, 2] + R[2, 0]) / s, (R[2, 1] - R[1, 2]) / s]
    elif R[1, 1] > R[2, 2]:
        s = np.sqrt(1 + R[1, 1] - R[0, 0] - R[2, 2]) * 2
        q = [(R[0, 1] + R[1, 0]) / s, 0.25 * s, (R[1, 2] + R[2, 1]) / s, (R[0, 2] - R[2, 0]) / s]
    else:
        s = np.sqrt(1 + R[2, 2] - R[0, 0] - R[1, 1]) * 2
        q = [(R[0, 2] + R[2, 0]) / s, (R[1, 2] + R[2, 1]) / s, 0.25 * s, (R[1, 0] - R[0, 1]) / s]
    q = np.array(q)
    return q / np.linalg.norm(q)


def local(n):
    if 'matrix' in n:
        return np.array(n['matrix']).reshape(4, 4).T
    M = np.eye(4)
    M[:3, :3] = quat_mat(n.get('rotation', [0, 0, 0, 1])) * np.array(n.get('scale', [1, 1, 1]))
    M[:3, 3] = n.get('translation', [0, 0, 0])
    return M


def T(v):
    M = np.eye(4)
    M[:3, 3] = v
    return M


def rot_between(a, b):
    a = a / np.linalg.norm(a)
    b = b / np.linalg.norm(b)
    v = np.cross(a, b)
    c = float(np.dot(a, b))
    if np.linalg.norm(v) < 1e-9:
        return np.eye(3)
    K = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + K + K @ K / (1 + c)


def segment(am, bm, ac, bc, perp, uniform=False):
    """affine taking the MPFB segment am->bm onto the classic segment ac->bc (rotate, stretch along it, `perp` across)"""
    um = (bm - am) / np.linalg.norm(bm - am)
    L = np.linalg.norm(bc - ac) / np.linalg.norm(bm - am)
    R = rot_between(bm - am, bc - ac)
    S = np.eye(3) * (L if uniform else perp) + (0 if uniform else (L - perp)) * np.outer(um, um)
    M = np.eye(4)
    M[:3, :3] = R @ S
    return T(ac) @ M @ T(-am), R


def smoothstep(e0, e1, x):
    u = np.clip((x - e0) / (e1 - e0), 0, 1)
    return u * u * (3 - 2 * u)


def bake(repo, g):
    import bpy  # noqa: F401  (brings in mathutils)
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    src = os.path.join(repo, 'charactercreation', 'mpfb', 'mpfb_%s.glb' % g)
    cls = os.path.join(repo, 'charactercreation', 'Meshy_AI_human_body_base_mesh_%s_rigged.glb' % g)
    out = os.path.join(repo, 'charactercreation', 'mpfb', 'mpfb_classic_%s.glb' % g)
    M = Glb(src)
    C = Glb(cls)
    J = M.J
    Wm, par = M.world()
    skin = J['skins'][0]
    jn = [J['nodes'][j]['name'] for j in skin['joints']]
    jpos_m = {jn[k]: Wm[j][:3, 3] for k, j in enumerate(skin['joints'])}
    Wc, _ = C.world()
    jpos_c = {C.J['nodes'][j]['name']: Wc[j][:3, 3] for j in C.J['skins'][0]['joints']}
    cprim = C.J['meshes'][0]['primitives'][0]
    Pc = C.get(cprim['attributes']['POSITION']).astype(np.float64)
    Fc = C.get(cprim['indices']).reshape(-1, 3)
    bvh = BVHTree.FromPolygons([tuple(v) for v in Pc], [tuple(int(i) for i in f) for f in Fc])

    prim = J['meshes'][0]['primitives'][0]
    A = prim['attributes']
    P0 = M.get(A['POSITION']).astype(np.float64)
    JT = M.get(A['JOINTS_0']).astype(np.int64)
    WT = M.get(A['WEIGHTS_0']).astype(np.float64)
    BI = np.round(M.get(A['_BASE_INDEX'])[:, 0]).astype(np.int64)
    F = M.get(prim['indices']).reshape(-1, 3).astype(np.int64)
    n = len(P0)

    def wsum(names):
        idx = [jn.index(x) for x in names if x in jn]
        return sum(((JT == k) * WT).sum(1) for k in idx)

    # ---- 1. the coarse affine per bone
    hipm = (jpos_m['LeftUpLeg'] + jpos_m['RightUpLeg']) / 2
    hipc = (jpos_c['LeftUpLeg'] + jpos_c['RightUpLeg']) / 2
    shm = (jpos_m['LeftArm'] + jpos_m['RightArm']) / 2
    shc = (jpos_c['LeftArm'] + jpos_c['RightArm']) / 2
    rx_sh = abs(jpos_c['LeftArm'][0] - jpos_c['RightArm'][0]) / abs(jpos_m['LeftArm'][0] - jpos_m['RightArm'][0])
    rx_hp = abs(jpos_c['LeftUpLeg'][0] - jpos_c['RightUpLeg'][0]) / abs(jpos_m['LeftUpLeg'][0] - jpos_m['RightUpLeg'][0])
    sx = (rx_sh + rx_hp) / 2
    sy = (shc[1] - hipc[1]) / (shm[1] - hipm[1])
    TOR = T(hipc) @ np.diag([sx, sy, sx, 1.0]) @ T(-hipm)
    Hc = Pc[:, 1].max() - Pc[:, 1].min()
    Hm = P0[:, 1].max() - P0[:, 1].min()
    k_all = Hc / Hm
    aff = {}
    rot = {}
    for b in ('Hips', 'Spine02', 'Spine01', 'Spine', 'LeftShoulder', 'RightShoulder'):
        aff[b] = TOR
        rot[b] = np.eye(3)
    for s in ('Left', 'Right'):
        for a_, b_ in (('UpLeg', 'Leg'), ('Leg', 'Foot'), ('Arm', 'ForeArm'), ('ForeArm', 'Hand')):
            aff[s + a_], rot[s + a_] = segment(jpos_m[s + a_], jpos_m[s + b_], jpos_c[s + a_], jpos_c[s + b_], sx)
        # the foot: rigid + uniform scale (ankle -> toe), the toe rides with it
        aff[s + 'Foot'], rot[s + 'Foot'] = segment(jpos_m[s + 'Foot'], jpos_m[s + 'ToeBase'], jpos_c[s + 'Foot'], jpos_c[s + 'ToeBase'], 1, True)
        aff[s + 'ToeBase'], rot[s + 'ToeBase'] = aff[s + 'Foot'], rot[s + 'Foot']
        # the hand + fingers: turned with the forearm, uniform scale, wrist on the classic wrist
        R = rot[s + 'ForeArm']
        Mh = np.eye(4)
        Mh[:3, :3] = R * k_all
        aff[s + 'Hand'] = T(jpos_c[s + 'Hand']) @ Mh @ T(-jpos_m[s + 'Hand'])
        rot[s + 'Hand'] = R
    sfx = {'Left': '_l', 'Right': '_r'}
    for name in jn:
        for s, x in sfx.items():
            if name.endswith(x):
                aff[name], rot[name] = aff[s + 'Hand'], rot[s + 'Hand']
    # the head: its crown on the classic crown, uniform scale (width x height ratio)
    hw_m = wsum(['Head'])
    Hd = P0[hw_m > 0.9]
    Cj = C.J['skins'][0]['joints']
    cjn = [C.J['nodes'][j]['name'] for j in Cj]
    cJT = C.get(cprim['attributes']['JOINTS_0']).astype(np.int64)
    cWT = C.get(cprim['attributes']['WEIGHTS_0']).astype(np.float64)
    hw_c = ((cJT == cjn.index('Head')) * cWT).sum(1)
    Hdc = Pc[hw_c > 0.9]
    s_head = float(np.sqrt(((Hdc[:, 0].max() - Hdc[:, 0].min()) / (Hd[:, 0].max() - Hd[:, 0].min())) * k_all))

    def crown(Q):
        top = Q[:, 1].max()
        cap = Q[Q[:, 1] > top - 0.08]
        return np.array([(cap[:, 0].min() + cap[:, 0].max()) / 2, top, (cap[:, 2].min() + cap[:, 2].max()) / 2])
    HEAD = T(crown(Hdc)) @ np.diag([s_head] * 3 + [1.0]) @ T(-crown(Hd))
    aff['Head'] = aff['neck'] = HEAD
    rot['Head'] = rot['neck'] = np.eye(3)
    for name in jn:
        assert name in aff, name
    Aff = np.stack([aff[x] for x in jn])

    def lbs(P, JTx, WTx):
        Ph = np.concatenate([P, np.ones((len(P), 1))], 1)
        out = np.zeros_like(P)
        for k in range(4):
            out += WTx[:, k:k + 1] * np.einsum('nij,nj->ni', Aff[JTx[:, k]], Ph)[:, :3]
        tot = WTx.sum(1, keepdims=True)
        return out / np.maximum(tot, 1e-9)
    P = lbs(P0, JT, WT)

    # ---- 2. the fine fit onto the classic surface (welded by _BASE_INDEX)
    nb = BI.max() + 1
    cnt = np.bincount(BI, minlength=nb).astype(np.float64)
    E = np.concatenate([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]])
    E = BI[E]
    E = E[E[:, 0] != E[:, 1]]
    E = np.unique(np.sort(E, 1), axis=0)
    deg = np.bincount(E.ravel(), minlength=nb).astype(np.float64)

    def weld(X):
        S = np.zeros((nb, X.shape[1]))
        np.add.at(S, BI, X)
        return S / np.maximum(cnt, 1)[:, None]

    def smooth(D, passes):
        for _ in range(passes):
            S = np.zeros_like(D)
            np.add.at(S, E[:, 0], D[E[:, 1]])
            np.add.at(S, E[:, 1], D[E[:, 0]])
            D = 0.5 * D + 0.5 * S / np.maximum(deg, 1)[:, None]
        return D

    def normals(P):
        fn = np.cross(P[F[:, 1]] - P[F[:, 0]], P[F[:, 2]] - P[F[:, 0]])
        N = np.zeros_like(P)
        for k in range(3):
            np.add.at(N, F[:, k], fn)
        Nb = weld(N)
        Nb /= np.maximum(np.linalg.norm(Nb, axis=1, keepdims=True), 1e-12)
        return Nb

    hand = wsum([x for x in jn if x.endswith('Hand') or x.endswith('_l') or x.endswith('_r')])
    foot = wsum(['LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase'])
    head = wsum(['Head'])
    pw = (1 - np.clip(head, 0, 1)) ** 2 * (1 - np.clip(hand, 0, 1)) ** 2 * (1 - np.clip(foot, 0, 1)) ** 2
    pwb = weld(pw[:, None])[:, 0]
    # a helper (eyeball / teeth / tongue) island never moves on its own: it is all Head anyway
    Pb = weld(P)
    for passes in (40, 24, 14, 8, 5, 3, 1, 0):
        Nb = normals(Pb[BI])
        D = np.zeros_like(Pb)
        Wc_ = np.zeros(nb)
        for i in np.nonzero(pwb > 1e-3)[0]:
            loc, nrm, fi, dist = bvh.find_nearest(Vector(Pb[i]), 0.12)
            if loc is None:
                continue
            if np.dot(np.array(nrm), Nb[i]) < 0.3:
                continue
            D[i] = np.array(loc) - Pb[i]
            Wc_[i] = 1
        # unmatched vertices take their neighbours' pull (the smoothing spreads it)
        Ds = smooth(D * Wc_[:, None], passes)
        Ws = smooth(Wc_[:, None], passes)[:, 0]
        Ds = np.where(Ws[:, None] > 1e-6, Ds / np.maximum(Ws, 1e-6)[:, None] * np.minimum(1, Ws * 4)[:, None], 0)
        Pb = Pb + pwb[:, None] * Ds
        print('[bake-mpfb-classic] %s pass %d: matched %d / %d, mean pull %.4f m' % (g, passes, int(Wc_.sum()), int((pwb > 1e-3).sum()), float(np.linalg.norm(D[Wc_ > 0], axis=1).mean())))
    # the welded moves back onto every split vertex (the helpers keep their own LBS result)
    moved = Pb[BI] - weld(P)[BI]
    P = P + moved
    # THE SHADING: the classic base's own normals at the nearest point (barycentric), so the muscles it was sculpted with
    # shade the same on the coarser hm08 mesh; faded back to the mesh's own normals where the fit fades (head, hands, feet)
    Ncl = C.get(cprim['attributes']['NORMAL']).astype(np.float64)
    Nb = normals(Pb[BI])
    for i in np.nonzero(pwb > 1e-3)[0]:
        loc, nrm, fi, dist = bvh.find_nearest(Vector(Pb[i]), 0.05)
        if loc is None:
            continue
        a, b, c = (Pc[k] for k in Fc[fi])
        p = np.array(loc)
        v0, v1, v2 = b - a, c - a, p - a
        d00, d01, d11, d20, d21 = v0 @ v0, v0 @ v1, v1 @ v1, v2 @ v0, v2 @ v1
        den = d00 * d11 - d01 * d01
        if abs(den) < 1e-14:
            continue
        w1 = (d11 * d20 - d01 * d21) / den
        w2 = (d00 * d21 - d01 * d20) / den
        nc = (1 - w1 - w2) * Ncl[Fc[fi][0]] + w1 * Ncl[Fc[fi][1]] + w2 * Ncl[Fc[fi][2]]
        if np.dot(nc, Nb[i]) < 0.2:
            continue
        nn = pwb[i] * nc / np.linalg.norm(nc) + (1 - pwb[i]) * Nb[i]
        Nb[i] = nn / np.linalg.norm(nn)
    Nf = Nb[BI]

    # ---- 3. joints, inverse binds, normals, morphs
    newW = {}
    for k, j in enumerate(skin['joints']):
        Wj = Wm[j].copy()
        o = aff[jn[k]] @ np.append(Wj[:3, 3], 1)
        R = rot[jn[k]] @ Wj[:3, :3]
        U, _, Vt = np.linalg.svd(R)
        Wn = np.eye(4)
        Wn[:3, :3] = U @ Vt
        Wn[:3, 3] = o[:3]
        newW[j] = Wn
    for j in skin['joints']:
        Wp = newW[par[j]] if par.get(j) in newW else Wm[par[j]] if j in par else np.eye(4)
        L = np.linalg.inv(Wp) @ newW[j]
        node = J['nodes'][j]
        node.pop('matrix', None)
        node['translation'] = [float(v) for v in L[:3, 3]]
        node['rotation'] = [float(v) for v in mat_quat(L[:3, :3])]
        node['scale'] = [1.0, 1.0, 1.0]
    IBM = np.stack([np.linalg.inv(newW[j]).T.reshape(16) for j in skin['joints']])
    M.put(skin['inverseBindMatrices'], IBM)
    M.put(A['POSITION'], P)
    M.put(A['NORMAL'], Nf)
    for t in prim.get('targets', []):
        ac = J['accessors'][t['POSITION']]
        bvv = J['bufferViews'][ac['sparse']['values']['bufferView']]
        off = bvv.get('byteOffset', 0) + ac['sparse']['values'].get('byteOffset', 0)
        v = np.frombuffer(M.B, np.float32, count=ac['sparse']['count'] * 3, offset=off) * s_head
        M.B[off:off + v.nbytes] = v.astype(np.float32).tobytes()
        ac['min'] = [float(x) * s_head for x in ac['min']]
        ac['max'] = [float(x) * s_head for x in ac['max']]
    # the stock hair mesh (hidden by the creator rig; kept for anything that shows the bare body)
    for mi, mesh in enumerate(J['meshes'][1:], 1):
        pa = mesh['primitives'][0]['attributes']
        M.put(pa['POSITION'], lbs(M.get(pa['POSITION']).astype(np.float64), M.get(pa['JOINTS_0']).astype(np.int64), M.get(pa['WEIGHTS_0']).astype(np.float64)))
    # ---- 4. the fit offset for the pack clothes + names
    A['_FIT_D'] = M.add(P - P0, 'VEC3')
    nm = 'mpfb_classic_%s' % g
    for mesh in J['meshes']:
        mesh['name'] = mesh['name'].replace('mpfb_%s' % g, nm)
    for node in J['nodes']:
        if 'name' in node and node['name'].startswith('mpfb_%s' % g):
            node['name'] = node['name'].replace('mpfb_%s' % g, nm)
    ex = J['meshes'][0].setdefault('extras', {})
    ex['ewFit'] = {'from': g, 'headScale': round(s_head, 4)}
    J['asset']['extras'] = {'ew': 'bake-mpfb-classic.py: the MPFB %s body reshaped onto the classic creator base below the neck' % g}
    M.save(out)
    print('[bake-mpfb-classic] wrote', out, os.path.getsize(out), 'bytes; head scale %.3f, torso sx %.3f sy %.3f' % (s_head, sx, sy))


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--repo', default=os.path.dirname(os.path.abspath(__file__)))
    ap.add_argument('--genders', default='male,female')
    a = ap.parse_args()
    for g in a.genders.split(','):
        bake(a.repo, g)
