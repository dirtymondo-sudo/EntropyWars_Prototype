#!/usr/bin/env python3
"""bake-rig-fix.py (2026-11-19) — repair a Meshy auto-rig whose SHOULDERS came out wrong, no Blender.

Why: the E-Girl's Meshy rig (streamer/female/Meshy_AI_egirl_f_Running.glb) put both collarbone joints at the chin, in the
middle of the chest, and gave the WHOLE upper sleeve + deltoid to the collarbone (LeftShoulder / RightShoulder) instead of
the upper arm. When an animation drops the arms from the A-pose, that block stays out flat with the collarbone: wide square
"shoulder pads" (mondo 11-19: "her shoulders are wide and broad like she is a man"). A healthy Meshy rig (the V-Tuber) has
the collarbone at the top of the chest and the upper arm owning the deltoid.

What it does (per side): (1) moves the collarbone + upper-arm joints to the given places (metres, model space) and turns
each so its bone still points at its child; every other joint keeps its place; (2) re-splits the weight a vertex already
gives to collarbone + upper arm between the two by which side of the shoulder hinge it lies on (the hinge = the plane
through the new arm joint, halfway between level and the arm's own line), soft over a few cm; (3) rewrites the inverse
bind matrices and the embedded clip's keys for the moved joints, so the file's own Running clip still plays the same.
Weights to every other joint (spine, forearm, head, legs), the mesh and the textures are untouched.

  python3 -I bake-rig-fix.py <in.glb> <out.glb> --preset egirl
  python3 -I bake-rig-fix.py <in.glb> <out.glb> --set LeftShoulder=0.03,1.415,0.0 --set LeftArm=0.165,1.385,-0.024 ...
Notes: docs/notes/models-assets.md "THE RIG FIX".
"""
import json, struct, sys
import numpy as np

PRESETS = {
    # E-Girl (1.75 m): arm joints at the deltoid, collarbones at the top of the chest (the V-Tuber's proportions x 1.065)
    'egirl': {
        'LeftShoulder': (0.032, 1.410, 0.000), 'LeftArm': (0.163, 1.388, -0.026),
        'RightShoulder': (-0.032, 1.410, 0.000), 'RightArm': (-0.165, 1.388, -0.026),
    },
}
SIDES = [('LeftShoulder', 'LeftArm', 'LeftForeArm'), ('RightShoulder', 'RightArm', 'RightForeArm')]
BLEND = (-0.040, 0.025)   # metres either side of the hinge plane: collarbone -> upper arm

CT = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def read_glb(p):
    d = open(p, 'rb').read()
    assert d[:4] == b'glTF'
    l = struct.unpack('<I', d[12:16])[0]
    j = json.loads(d[20:20 + l])
    bo = 20 + l
    bl = struct.unpack('<I', d[bo:bo + 4])[0]
    return j, bytearray(d[bo + 8:bo + 8 + bl])


def write_glb(p, j, b):
    js = json.dumps(j, separators=(',', ':')).encode()
    js += b' ' * ((4 - len(js) % 4) % 4)
    b = bytes(b) + b'\0' * ((4 - len(b) % 4) % 4)
    j['buffers'][0]['byteLength'] = len(b)
    js = json.dumps(j, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(b))
    out += struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(b), b'BIN\0') + b
    open(p, 'wb').write(out)


def view(j, b, i):
    """numpy view onto accessor i (writable, in place). Only tightly packed views (Meshy's are)."""
    a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]
    n = NC[a['type']]; dt = CT[a['componentType']]
    st = v.get('byteStride', 0)
    assert not st or st == np.dtype(dt).itemsize * n, 'interleaved buffer views are not handled'
    off = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    return np.frombuffer(memoryview(b), dtype=dt, count=a['count'] * n, offset=off).reshape(a['count'], n)


def q2m(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def m2q(m):
    t = np.trace(m)
    if t > 0:
        s = np.sqrt(t + 1) * 2; w = 0.25 * s; x = (m[2, 1] - m[1, 2]) / s; y = (m[0, 2] - m[2, 0]) / s; z = (m[1, 0] - m[0, 1]) / s
    elif m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]:
        s = np.sqrt(1 + m[0, 0] - m[1, 1] - m[2, 2]) * 2; w = (m[2, 1] - m[1, 2]) / s; x = 0.25 * s; y = (m[0, 1] + m[1, 0]) / s; z = (m[0, 2] + m[2, 0]) / s
    elif m[1, 1] > m[2, 2]:
        s = np.sqrt(1 + m[1, 1] - m[0, 0] - m[2, 2]) * 2; w = (m[0, 2] - m[2, 0]) / s; x = (m[0, 1] + m[1, 0]) / s; y = 0.25 * s; z = (m[1, 2] + m[2, 1]) / s
    else:
        s = np.sqrt(1 + m[2, 2] - m[0, 0] - m[1, 1]) * 2; w = (m[1, 0] - m[0, 1]) / s; x = (m[0, 2] + m[2, 0]) / s; y = (m[1, 2] + m[2, 1]) / s; z = 0.25 * s
    q = np.array([x, y, z, w]); return q / np.linalg.norm(q)


def qmul(a, b):
    ax, ay, az, aw = a; bx, by, bz, bw = b
    return np.array([aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
                     aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz])


def qconj(q): return np.array([-q[0], -q[1], -q[2], q[3]])


def local_m(n):
    M = np.eye(4)
    M[:3, :3] = q2m(n.get('rotation', [0, 0, 0, 1])) @ np.diag(n.get('scale', [1, 1, 1]))
    M[:3, 3] = n.get('translation', [0, 0, 0]); return M


def rot_between(a, b):
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b)
    v = np.cross(a, b); c = float(np.dot(a, b))
    if np.linalg.norm(v) < 1e-9: return np.eye(3)
    vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + vx + vx @ vx * (1 / (1 + c))


def main():
    a = sys.argv[1:]
    if len(a) < 2: print(__doc__); sys.exit(1)
    src, dst = a[0], a[1]
    targets = {}
    i = 2
    while i < len(a):
        if a[i] == '--preset': targets.update(PRESETS[a[i + 1]]); i += 2
        elif a[i] == '--set':
            k, v = a[i + 1].split('='); targets[k] = tuple(float(x) for x in v.split(',')); i += 2
        else: raise SystemExit('unknown arg ' + a[i])
    j, b = read_glb(src)
    nodes = j['nodes']; name = {n.get('name'): k for k, n in enumerate(nodes)}
    par = {}
    for k, n in enumerate(nodes):
        for c in n.get('children', []): par[c] = k

    def world(k, loc):
        M = loc[k]
        while k in par: k = par[k]; M = loc[k] @ M
        return M
    old_loc = [local_m(n) for n in nodes]
    old_w = [world(k, old_loc) for k in range(len(nodes))]
    new_w = [m.copy() for m in old_w]
    moved = []
    for sh, arm, fore in SIDES:
        if sh not in targets and arm not in targets: continue
        ks, ka, kf = name[sh], name[arm], name[fore]
        for k, nm in ((ks, sh), (ka, arm)):
            if nm in targets: new_w[k][:3, 3] = targets[nm]
        # turn each so its bone (+Y) still points at its child
        for k, child in ((ks, ka), (ka, kf)):
            ow = old_w[k]; rs = ow[:3, :3]
            old_dir = rs @ np.array([0, 1, 0]); new_dir = new_w[child][:3, 3] - new_w[k][:3, 3]
            new_w[k][:3, :3] = rot_between(old_dir, new_dir) @ rs
        moved += [ks, ka]
        print('%-14s %s -> %s' % (sh, np.round(old_w[ks][:3, 3], 3), np.round(new_w[ks][:3, 3], 3)))
        print('%-14s %s -> %s' % (arm, np.round(old_w[ka][:3, 3], 3), np.round(new_w[ka][:3, 3], 3)))
    if not moved: raise SystemExit('nothing to move')
    # new locals for every node whose world or parent's world changed
    changed = set(moved) | {c for k in moved for c in nodes[k].get('children', [])}
    new_loc = list(old_loc)
    dq = {}   # rotation delta in each node's own frame: newWorldRot = oldWorldRot * d
    for k in changed:
        pw = new_w[par[k]] if k in par else np.eye(4)
        L = np.linalg.inv(pw) @ new_w[k]
        new_loc[k] = L
    for k in changed:
        L = new_loc[k]; s = np.linalg.norm(L[:3, :3], axis=0); R = L[:3, :3] / s
        n = nodes[k]; n['translation'] = [float(x) for x in L[:3, 3]]; n['rotation'] = [float(x) for x in m2q(R)]
        n['scale'] = [float(x) for x in s]
        orr = old_w[k][:3, :3] / np.linalg.norm(old_w[k][:3, :3], axis=0)
        nr = new_w[k][:3, :3] / np.linalg.norm(new_w[k][:3, :3], axis=0)
        dq[k] = m2q(orr.T @ nr)
    ident = np.array([0, 0, 0, 1.0])
    # inverse bind matrices: newIBM = inv(newWorld) @ oldWorld @ oldIBM
    for sk in j['skins']:
        ib = view(j, b, sk['inverseBindMatrices'])
        for slot, k in enumerate(sk['joints']):
            if k not in moved: continue
            M = ib[slot].reshape(4, 4).T
            M2 = np.linalg.inv(new_w[k]) @ old_w[k] @ M
            ib[slot] = M2.T.reshape(16).astype(np.float32)
    # the file's own clip: q_new = conj(d_parent) * q_old * d_self ; translations = the new rest place
    for an in j.get('animations', []):
        for c in an['channels']:
            k = c['target']['node']
            if k not in changed: continue
            out = view(j, b, an['samplers'][c['sampler']]['output'])
            if c['target']['path'] == 'rotation':
                dp = dq.get(par.get(k), ident); ds = dq.get(k, ident)
                for r in range(len(out)):
                    q = qmul(qmul(qconj(dp), out[r].astype(float)), ds); out[r] = (q / np.linalg.norm(q)).astype(np.float32)
            elif c['target']['path'] == 'translation':
                out[:] = np.array(nodes[k]['translation'], dtype=np.float32)
    # weights: re-split collarbone + upper arm by the shoulder hinge
    for mesh in j['meshes']:
        for prim in mesh['primitives']:
            at = prim['attributes']
            if 'JOINTS_0' not in at: continue
            skin = next(n['skin'] for n in nodes if n.get('mesh') == j['meshes'].index(mesh))
            jl = j['skins'][skin]['joints']
            P = view(j, b, at['POSITION']).astype(float)
            J = view(j, b, at['JOINTS_0']); W = view(j, b, at['WEIGHTS_0'])
            assert W.dtype == np.float32, 'only float weights handled'
            for sh, arm, fore in SIDES:
                if name[arm] not in moved: continue
                ss, sa = jl.index(name[sh]), jl.index(name[arm])
                pa = new_w[name[arm]][:3, 3]; pe = new_w[name[fore]][:3, 3]
                d = (pe - pa) / np.linalg.norm(pe - pa)
                out_x = np.array([np.sign(pa[0]), 0, 0])
                nrm = (out_x + d); nrm /= np.linalg.norm(nrm)
                n_hit = 0
                for v in range(len(P)):
                    wsh = W[v][J[v] == ss].sum(); warm = W[v][J[v] == sa].sum()
                    g = wsh + warm
                    if g <= 1e-4: continue
                    t = float(np.dot(P[v] - pa, nrm))
                    f = np.clip((t - BLEND[0]) / (BLEND[1] - BLEND[0]), 0, 1); f = f * f * (3 - 2 * f)
                    want = {ss: g * (1 - f), sa: g * f}
                    # rebuild the 4 slots: keep the other joints, put the two shares in
                    others = [(int(J[v][s]), float(W[v][s])) for s in range(4) if J[v][s] not in (ss, sa) and W[v][s] > 0]
                    rows = others + [(k2, w2) for k2, w2 in want.items() if w2 > 1e-4]
                    rows.sort(key=lambda r: -r[1]); rows = rows[:4]
                    tot = sum(r[1] for r in rows)
                    while len(rows) < 4: rows.append((0, 0.0))
                    J[v] = [r[0] for r in rows]; W[v] = [r[1] / tot for r in rows]
                    n_hit += 1
                print('%s: re-split %d vertices' % (arm, n_hit))
    write_glb(dst, j, b)
    print('wrote', dst)


if __name__ == '__main__':
    main()
