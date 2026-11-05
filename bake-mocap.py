#!/usr/bin/env python3
"""bake-mocap.py (2026-11-05) — THE MOCAP LIBRARY: CMU motion capture (BVH) -> one animation-only library GLB.

    python3 -I bake-mocap.py --cmu /tmp/cmu/repo/data --out /tmp/MOC1_CMU.glb [--clips mocap-clips.json] [--sheet /tmp/sheets]

The CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu), in Bruce Hahne's Motionbuilder-friendly BVH conversion
(git clone https://github.com/una-dinosauria/cmu-mocap). Free to use in a game; credit "mocap.cs.cmu.edu, created with funding
from NSF EIA-0196217".

The game does the retarget itself (three-renderer.js _libEnsureSrc / _libRetargetSetup / _libBakeClips): a library is a skeleton
whose bone NAMES it knows + clips, and every Meshy / MPFB rig bakes the clips onto its own bones at load. So this tool only turns
a stretch of a BVH take into an in-place, seamless, 30 Hz loop on a skeleton named like the Quaternius UAL rig (pelvis, spine_01,
thigh_l ...; _ANIMLIB_MAP column 0). The REST pose of the file is the take's frame-1 T-pose (the BVH zero pose has splayed legs),
facing +Z with the left side at +X, exactly like UAL1 / MAL1. Per clip (mocap-clips.json):
  1. sample the take at 30 Hz (every 4th 120 Hz frame) between `a` and `b` seconds (plus `fade` s before `a` for the loop);
  2. turn the whole take about Y so the stretch's mean facing is +Z;
  3. in place: the hips' XZ path minus its straight-line trend (walks keep their side sway, idles lose their drift);
  4. seamless: the last `fade` seconds slerp into the frames just before `a`, so the end lands on the first frame.
  `steady` (0-1) takes that much of the hips' turn round the mean facing off (an idle actor pivots on the spot); `head`
  (degrees, + = down) is the neutral head pitch after THE LEVEL HEAD.
Unmapped CMU joints (LHipJoint, Neck, the shoulders, fingers) ride along as cmu_* nodes so every world rotation stays true.
--sheet writes a stick-figure contact sheet per clip (front + side, after steps 2-4) to judge it.
"""
import argparse, json, os, struct, sys
import numpy as np

SCALE = 0.056444          # CMU BVH units -> metres (hips ~0.9 m)
HZ = 30
# CMU joint -> UAL name (the game's canonical source names). Shoulders are left out on purpose: the CMU shoulder sits ON the
# spine (zero offset), so its rest direction points up-and-out and the arm calibration would shrug every target.
NAME = {
    'Hips': 'pelvis', 'LowerBack': 'spine_01', 'Spine': 'spine_02', 'Spine1': 'spine_03', 'Neck1': 'neck_01', 'Head': 'Head',
    'LeftArm': 'upperarm_l', 'LeftForeArm': 'lowerarm_l', 'LeftHand': 'hand_l',
    'RightArm': 'upperarm_r', 'RightForeArm': 'lowerarm_r', 'RightHand': 'hand_r',
    'LeftUpLeg': 'thigh_l', 'LeftLeg': 'calf_l', 'LeftFoot': 'foot_l', 'LeftToeBase': 'ball_l',
    'RightUpLeg': 'thigh_r', 'RightLeg': 'calf_r', 'RightFoot': 'foot_r', 'RightToeBase': 'ball_r',
}

# THE CLIPS — name (the clip name the game's slots use), take, stretch [a, b] seconds, fade seconds, kind.
CLIPS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mocap-clips.json')   # MOC1_CMU.glb's clip list


# ── BVH ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
class Joint:
    def __init__(s, name, parent):
        s.name, s.parent, s.offset, s.channels, s.children = name, parent, np.zeros(3), [], []


def parse_bvh(path):
    toks = open(path).read().split()
    i, joints, stack, cur = 0, [], [], None
    while True:
        t = toks[i]
        if t in ('ROOT', 'JOINT'):
            cur = Joint(toks[i + 1], stack[-1] if stack else None)
            if cur.parent: cur.parent.children.append(cur)
            joints.append(cur); i += 2
        elif t == 'End':
            i += 8                              # End Site { OFFSET x y z }
        elif t == '{': stack.append(cur); i += 1
        elif t == '}': stack.pop(); i += 1
        elif t == 'OFFSET': cur.offset = np.array([float(x) for x in toks[i + 1:i + 4]]); i += 4
        elif t == 'CHANNELS':
            n = int(toks[i + 1]); cur.channels = toks[i + 2:i + 2 + n]; i += 2 + n
        elif t == 'MOTION': break
        else: i += 1
    nf, ft = int(toks[i + 2]), float(toks[i + 5])
    return joints, np.array(toks[i + 6:], dtype=float).reshape(nf, -1), ft


def _rot(axis, deg):
    a = np.radians(deg); c, s = np.cos(a), np.sin(a)
    n = len(a); m = np.zeros((n, 3, 3)); k = 'XYZ'.index(axis); i1, i2 = [x for x in range(3) if x != k]
    m[:, k, k] = 1; m[:, i1, i1] = c; m[:, i2, i2] = c
    if axis == 'Y': m[:, 0, 2] = s; m[:, 2, 0] = -s
    else: m[:, i1, i2] = -s; m[:, i2, i1] = s
    return m


def local_mats(joints, data, frames):
    """per joint: (F,3,3) local rotation, (F,3) local translation (root: position channels)"""
    col, out = 0, {}
    for j in joints:
        F = len(frames); R = np.tile(np.eye(3), (F, 1, 1)); T = np.tile(j.offset, (F, 1))
        for ch in j.channels:
            v = data[frames, col]; col += 1
            if ch.endswith('position'): T[:, 'XYZ'.index(ch[0])] = v
            else: R = R @ _rot(ch[0], v)
        out[j.name] = (R, T)
    return out


def world(joints, loc):
    W = {}
    for j in joints:
        R, T = loc[j.name]
        if j.parent is None: W[j.name] = (R, T)
        else:
            PR, PT = W[j.parent.name]
            W[j.name] = (PR @ R, PT + np.einsum('fij,fj->fi', PR, T))
    return W


# ── quaternions (x, y, z, w) ─────────────────────────────────────────────────────────────────────────────────────────────
def m2q(m):
    q = np.zeros((len(m), 4))
    for k, r in enumerate(m):
        t = np.trace(r)
        if t > 0:
            s = np.sqrt(t + 1) * 2; q[k] = [(r[2, 1] - r[1, 2]) / s, (r[0, 2] - r[2, 0]) / s, (r[1, 0] - r[0, 1]) / s, s / 4]
        else:
            i = int(np.argmax([r[0, 0], r[1, 1], r[2, 2]])); j, l = (i + 1) % 3, (i + 2) % 3
            s = np.sqrt(1 + r[i, i] - r[j, j] - r[l, l]) * 2
            v = np.zeros(4); v[i] = s / 4; v[j] = (r[j, i] + r[i, j]) / s; v[l] = (r[l, i] + r[i, l]) / s; v[3] = (r[l, j] - r[j, l]) / s
            q[k] = v
    return q / np.linalg.norm(q, axis=1, keepdims=True)


def slerp(a, b, t):
    d = np.sum(a * b, 1); b = np.where(d[:, None] < 0, -b, b); d = np.abs(d)
    out = np.empty_like(a)
    near = d > 0.9995
    out[near] = a[near] + (b[near] - a[near]) * t[near, None]
    th = np.arccos(np.clip(d[~near], -1, 1)); st = np.sin(th)
    tt = t[~near]
    out[~near] = (np.sin((1 - tt) * th)[:, None] * a[~near] + np.sin(tt * th)[:, None] * b[~near]) / st[:, None]
    return out / np.linalg.norm(out, axis=1, keepdims=True)


def continuous(q):
    q = q.copy()
    for k in range(1, len(q)):
        if np.dot(q[k], q[k - 1]) < 0: q[k] = -q[k]
    return q


# ── one clip ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
def _rx(deg):
    a = np.radians(deg); c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def _pitch(d):
    """pitch (deg, + = down) of world turns d (F,3,3) applied to forward +Z"""
    f = d[:, :, 2]
    return np.degrees(np.arctan2(-f[:, 1], f[:, 2]))


def load_take(take, cmu):
    subj = take.split('_')[0]
    return parse_bvh(os.path.join(cmu, '%03d' % int(subj), take + '.bvh'))


def bake_clip(spec, cmu, base):
    """base = the FILE's rest: (joints, rest world rotations by name, rest hips height in BVH units) — every clip is put on
    it: each take's own frame-1 T-pose becomes the file's T-pose (W'(t) = W(t) R0take^T R0file per joint), so takes from
    other subjects share one skeleton; the hips height is scaled to the file's."""
    joints, data, ft = load_take(spec['take'], cmu)
    bj, bR0, bHy = base
    assert [j.name for j in joints] == [j.name for j in bj], 'the takes must share the CMU joint tree'
    step = int(round(1 / (HZ * ft)))
    fade = float(spec.get('fade', 0.5)); a, b = float(spec['a']), float(spec['b'])
    f0 = max(1, int(round((a - fade) / ft))); fa = int(round(a / ft)); fb = int(round(b / ft))
    frames = np.arange(f0, fb + 1, step)
    loc = local_mats(joints, data, frames)
    W = world(joints, loc)
    W0 = world(joints, local_mats(joints, data, np.array([0])))     # this take's frame-1 T-pose
    hy = W0['Hips'][1][0][1]
    ia = int(np.searchsorted(frames, fa))
    # 2. facing: from the right hip to the left hip, turned to forward (T-pose: left = +X, forward = +Z)
    lr = W['LeftUpLeg'][1][ia:] - W['RightUpLeg'][1][ia:]
    yaw = np.arctan2(-lr[:, 2], lr[:, 0])
    y0 = np.arctan2(np.mean(np.sin(yaw)), np.mean(np.cos(yaw)))
    c, s = np.cos(-y0), np.sin(-y0); Ry = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
    # THE STEADY BODY: an idle actor pivots on the spot (20-30 deg); `steady` k takes k of the hips' turn off the mean
    # facing away (the whole body turns back, the feet twist a little), so a unit idles facing where the board says
    lr_all = W['LeftUpLeg'][1] - W['RightUpLeg'][1]
    dy = np.unwrap(np.arctan2(-lr_all[:, 2], lr_all[:, 0]) - y0)
    dy = (dy + np.pi) % (2 * np.pi) - np.pi
    k_st = float(spec.get('steady', 0))
    cs, ss = np.cos(-k_st * dy), np.sin(-k_st * dy)
    Rst = np.zeros((len(frames), 3, 3)); Rst[:, 0, 0] = cs; Rst[:, 0, 2] = ss; Rst[:, 1, 1] = 1; Rst[:, 2, 0] = -ss; Rst[:, 2, 2] = cs
    Wr = {}
    for j in joints:
        R = np.einsum('fij,fjk->fik', Rst, np.einsum('ij,fjk->fik', Ry, W[j.name][0]))
        corr = W0[j.name][0][0].T
        # THE LEVEL HEAD: a take's T-pose head (and upper neck) is often pitched (subject 137 looks up 20-30 deg in every
        # take); the neutral head of the stretch (its median pitch) becomes level, + spec 'head' degrees (+ = down)
        if j.name in ('Neck1', 'Head'):
            p = np.median(_pitch(np.einsum('fij,jk->fik', R[ia:], corr)))
            want = float(spec.get('head', 0)) * (0.5 if j.name == 'Neck1' else 1.0)
            corr = corr @ _rx(p - want).T
        Wr[j.name] = np.einsum('fij,jk->fik', R, corr @ bR0[j.name])
    T0 = (Ry @ W['Hips'][1].T).T * (bHy / hy)
    # 3. in place: hips XZ minus the straight line through the stretch
    t = np.arange(len(frames)) / HZ
    for ax in (0, 2):
        k, m = np.polyfit(t[ia:], T0[ia:, ax], 1); T0[:, ax] -= k * t + m
    # locals on the file's tree
    Q = {}
    for j in joints:
        Lr = Wr[j.name] if j.parent is None else np.einsum('fji,fjk->fik', Wr[j.parent.name], Wr[j.name])
        Q[j.name] = continuous(m2q(Lr))
    # 4. seamless: the last `fade` s slerp into the `fade` s before a
    n = len(frames) - ia
    nf = min(int(round(fade * HZ)), ia)
    if nf >= 2 and nf < n:
        w = np.zeros(n); w[n - nf:] = (np.arange(nf) + 1) / nf; w = 3 * w ** 2 - 2 * w ** 3
        for j in joints:
            q = Q[j.name]; body = q[ia:]; tgt = body.copy(); tgt[n - nf:] = q[ia - nf:ia]
            Q[j.name] = continuous(slerp(body, tgt, w))
        body = T0[ia:]; tgt = body.copy(); tgt[n - nf:] = T0[ia - nf:ia]
        T0 = body + (tgt - body) * w[:, None]
    else:
        Q = {k: v[ia:] for k, v in Q.items()}; T0 = T0[ia:]
    # the last frame IS the first now: drop it so the loop does not hold a frame twice
    Q = {k: v[:-1] for k, v in Q.items()}; T0 = T0[:-1]
    return dict(name=spec['name'], joints=joints, Q=Q, T=T0 * SCALE, dur=len(T0) / HZ, take=spec['take'], a=a, b=b)


def make_base(take, cmu):
    joints, data, ft = load_take(take, cmu)
    W0 = world(joints, local_mats(joints, data, np.array([0])))
    R0 = {j.name: W0[j.name][0][0] for j in joints}
    restq = {}
    for j in joints:
        Lr = R0[j.name] if j.parent is None else R0[j.parent.name].T @ R0[j.name]
        restq[j.name] = m2q(Lr[None])[0]
    return (joints, R0, W0['Hips'][1][0][1]), restq


# ── the GLB ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
def write_glb(clips, path, base, restq):
    joints = base[0]
    names = [NAME.get(j.name, 'cmu_' + j.name) for j in joints]
    idx = {j.name: i for i, j in enumerate(joints)}
    nodes = []
    for i, j in enumerate(joints):
        nd = {'name': names[i], 'rotation': [float(x) for x in restq[j.name]]}
        tr = j.offset * SCALE if j.parent else np.array([0, base[2] * SCALE, 0])
        nd['translation'] = [float(x) for x in tr]
        if j.children: nd['children'] = [idx[c.name] for c in j.children]
        nodes.append(nd)
    blob = bytearray(); views = []; accs = []

    def add(arr, typ, minmax=False):
        arr = np.ascontiguousarray(arr, dtype=np.float32)
        while len(blob) % 4: blob.append(0)
        views.append({'buffer': 0, 'byteOffset': len(blob), 'byteLength': arr.nbytes}); blob.extend(arr.tobytes())
        a = {'bufferView': len(views) - 1, 'componentType': 5126, 'count': len(arr), 'type': typ}
        if minmax: a['min'] = [float(arr.min())]; a['max'] = [float(arr.max())]
        accs.append(a); return len(accs) - 1
    anims = []
    for c in clips:
        nfr = len(c['T']); tacc = add(np.arange(nfr) / HZ, 'SCALAR', True)
        samplers, channels = [], []
        for j in joints:
            samplers.append({'input': tacc, 'output': add(c['Q'][j.name], 'VEC4'), 'interpolation': 'LINEAR'})
            channels.append({'sampler': len(samplers) - 1, 'target': {'node': idx[j.name], 'path': 'rotation'}})
        samplers.append({'input': tacc, 'output': add(c['T'], 'VEC3'), 'interpolation': 'LINEAR'})
        channels.append({'sampler': len(samplers) - 1, 'target': {'node': idx['Hips'], 'path': 'translation'}})
        anims.append({'name': c['name'], 'samplers': samplers, 'channels': channels,
                      'extras': {'cmuTake': c['take'], 'from': c['a'], 'to': c['b']}})
    js = {'asset': {'version': '2.0', 'generator': 'Entropy Wars bake-mocap.py',
                    'copyright': 'Motion: CMU Graphics Lab Motion Capture Database, mocap.cs.cmu.edu (NSF EIA-0196217); BVH conversion by B. Hahne'},
          'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': nodes, 'animations': anims,
          'buffers': [{'byteLength': len(blob)}], 'bufferViews': views, 'accessors': accs}
    jb = json.dumps(js, separators=(',', ':')).encode()
    while len(jb) % 4: jb += b' '
    while len(blob) % 4: blob.append(0)
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(jb) + 8 + len(blob))
    out += struct.pack('<II', len(jb), 0x4E4F534A) + jb + struct.pack('<II', len(blob), 0x004E4942) + bytes(blob)
    open(path, 'wb').write(out)
    return len(out)


# ── the sheet ────────────────────────────────────────────────────────────────────────────────────────────────────────────
def q2m(q):
    x, y, z, w = q.T
    return np.stack([np.stack([1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], -1),
                     np.stack([2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], -1),
                     np.stack([2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)], -1)], -2)


def clip_world(c):
    P = {}; Rw = {}
    for j in c['joints']:
        R = q2m(c['Q'][j.name])
        if j.parent is None: Rw[j.name] = R; P[j.name] = c['T'] / SCALE
        else:
            Rw[j.name] = Rw[j.parent.name] @ R
            P[j.name] = P[j.parent.name] + np.einsum('fij,j->fi', Rw[j.parent.name], j.offset)
    return P


def sheet(c, out, n=10):
    from PIL import Image, ImageDraw
    P = clip_world(c); F = len(c['T']); fr = np.linspace(0, F - 1, n).astype(int)
    Wd, H = 150, 170; img = Image.new('RGB', (Wd * n, H * 2 + 18), 'white'); d = ImageDraw.Draw(img)
    for k, f in enumerate(fr):
        for row, (ax, sgn) in enumerate(((0, -1), (2, 1))):     # front: camera on +Z looking back (left on the right); side
            for j in c['joints']:
                if j.parent is None: continue
                a, b = P[j.parent.name][f], P[j.name][f]
                col = (200, 0, 0) if 'Left' in j.name or j.name.startswith('L') and j.name[1].isupper() else \
                      (0, 0, 200) if 'Right' in j.name or j.name.startswith('R') and j.name[1].isupper() else (0, 0, 0)
                X = lambda p: k * Wd + Wd / 2 + sgn * p[ax] * 4.2
                Y = lambda p: row * H + 160 - p[1] * 4.2
                d.line([(X(a), Y(a)), (X(b), Y(b))], fill=col, width=2)
            d.text((k * Wd + 3, row * H + 3), '%.2fs' % (f / HZ), fill=(0, 0, 0))
    d.text((4, H * 2 + 3), '%s  %s %.2f-%.2fs  %.2fs loop   (red = left, top = front, bottom = side, +Z right)' %
           (c['name'], c['take'], c['a'], c['b'], c['dur']), fill=(0, 0, 0))
    img.save(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cmu', required=True); ap.add_argument('--out', required=True)
    ap.add_argument('--sheet'); ap.add_argument('--base', default='137_28', help='the take whose skeleton + T-pose is the file rest'); ap.add_argument('--clips', help='a JSON file with the clip list (default mocap-clips.json)')
    o = ap.parse_args()
    specs = json.load(open(o.clips or CLIPS_FILE))
    base, restq = make_base(o.base, o.cmu)
    clips = [bake_clip(s, o.cmu, base) for s in specs]
    for c in clips: print('%-26s %-7s %.2f-%.2fs -> %.2fs loop, %d frames' % (c['name'], c['take'], c['a'], c['b'], c['dur'], len(c['T'])))
    print('wrote', o.out, write_glb(clips, o.out, base, restq), 'bytes')
    if o.sheet:
        os.makedirs(o.sheet, exist_ok=True)
        for c in clips: sheet(c, os.path.join(o.sheet, c['name'] + '.png'))


if __name__ == '__main__':
    main()
