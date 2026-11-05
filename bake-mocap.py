#!/usr/bin/env python3
"""bake-mocap.py (2026-11-05, rev 2 the same day) — THE MOCAP LIBRARY: CMU motion capture (BVH) -> one animation-only library GLB.

    python3 -I bake-mocap.py --cmu /tmp/cmu/repo/data --out /tmp/MOC1_CMU.glb [--clips mocap-clips.json] [--sheet /tmp/sheets]
    python3 -I bake-mocap.py --cmu /tmp/cmu/repo/data --scan 137_41 [--sheet /tmp/sheets]     # look at a whole take first

The CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu), in Bruce Hahne's Motionbuilder-friendly BVH conversion
(git clone https://github.com/una-dinosauria/cmu-mocap). Free to use in a game; credit "mocap.cs.cmu.edu, created with funding
from NSF EIA-0196217". NOTE: that conversion holds some files twice under two names (77_02 "standing" IS 139_02 "shifting weight",
byte for byte): judge a take by its motion, never by its label.

The game does the retarget itself (three-renderer.js _libEnsureSrc / _libRetargetSetup / _libBakeClips): a library is a skeleton
whose bone NAMES it knows + clips, and every Meshy / MPFB rig bakes the clips onto its own bones at load. The legs, spine and head
play as a world-rotation DELTA off the library's rest pose (the arms are first pulled onto the library's rest directions), so the
rest pose IS the neutral: whatever turn a bone has at rest reads as "no turn" on every body.

REV 2 (mondo 11-05: "the ankle is all twisted and distorted", "fidget doesn't loop"):
  THE CLEAN REST. Rev 1 used the take's frame-1 T-pose as the rest; an actor's T-pose stands with the toes turned out and the
  ankles rolled, so every clip played those turns BACKWARDS on our bodies (feet turned in, ankles twisted). The rest is now the
  BVH zero pose (every joint at its calibrated neutral, arms out level) with the legs straightened (the zero pose splays them
  20 deg) and each foot pointed straight ahead, flat (its zero-pose pitch kept, its toe-out taken off); per take, the same clean
  rest is built off that subject's own bone directions, so takes from other subjects share it.
  THE LOOP POINTS. Rev 1 cut a stretch where it was told and slerped the last 0.2-0.6 s into the start: a big move in that window
  read as a rewind. Now the stretch's END is searched (`a`, `len` [min, max] s): the frame whose pose AND motion are closest to
  `a`'s; the small leftover is spread over the whole clip (each bone turns by a share of it per frame), so the loop has no seam
  and no blend window. `b` pins the end instead of searching.
  NO PIVOT. Rev 1 turned the whole body back toward the mean facing every frame ("steady"), which turned the planted feet: they
  slid and twisted. Gone; an idle keeps the actor's own (small) turns and only its mean facing is set to +Z. An idle's hips keep
  their real path (centred on the spot, no detrend: that slid the feet); a walk's hips lose their straight-line travel only.

Per clip (mocap-clips.json): {name, take, a, len: [min, max] | b, kind: 'idle' | 'walk', head (deg, + = down, optional)}.
Unmapped CMU joints (LHipJoint, Neck, the shoulders, fingers) ride along as cmu_* nodes so every world rotation stays true.
--sheet writes a stick-figure contact sheet per clip (front + side) plus the loop seam (the last frames then the first).
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
# the loop search compares these bones (pose + motion); the legs and the hips count double (a foot that jumps is the worst seam)
LOOP_W = {'Hips': 2.0, 'LowerBack': 1, 'Spine': 1, 'Spine1': 1, 'Neck1': 0.5, 'Head': 0.5,
          'LeftArm': 1, 'LeftForeArm': 1, 'LeftHand': 0.3, 'RightArm': 1, 'RightForeArm': 1, 'RightHand': 0.3,
          'LeftUpLeg': 2, 'LeftLeg': 2, 'LeftFoot': 2, 'RightUpLeg': 2, 'RightLeg': 2, 'RightFoot': 2}

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


def q2m(q):
    x, y, z, w = q.T
    return np.stack([np.stack([1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], -1),
                     np.stack([2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], -1),
                     np.stack([2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)], -1)], -2)


def continuous(q):
    q = q.copy()
    for k in range(1, len(q)):
        if np.dot(q[k], q[k - 1]) < 0: q[k] = -q[k]
    return q


def min_rot(a, b):
    """the smallest turn taking unit vector a onto unit vector b (3x3)"""
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b)
    v = np.cross(a, b); c = float(np.dot(a, b)); s = np.linalg.norm(v)
    if s < 1e-9: return np.eye(3)
    k = v / s; K = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    ang = np.arctan2(s, c)
    return np.eye(3) + np.sin(ang) * K + (1 - np.cos(ang)) * K @ K


def axis_angle(m):
    """(F,3,3) rotations -> (F,3) rotation vectors"""
    q = m2q(m); q = np.where(q[:, 3:4] < 0, -q, q)
    s = np.linalg.norm(q[:, :3], axis=1); ang = 2 * np.arctan2(s, q[:, 3])
    k = np.where(s[:, None] > 1e-9, q[:, :3] / np.maximum(s[:, None], 1e-12), 0)
    return k * ang[:, None]


def rotvec_mat(v):
    ang = np.linalg.norm(v, axis=1); k = np.where(ang[:, None] > 1e-12, v / np.maximum(ang[:, None], 1e-12), 0)
    K = np.zeros((len(v), 3, 3)); K[:, 0, 1] = -k[:, 2]; K[:, 0, 2] = k[:, 1]; K[:, 1, 0] = k[:, 2]; K[:, 1, 2] = -k[:, 0]; K[:, 2, 0] = -k[:, 1]; K[:, 2, 1] = k[:, 0]
    s, c = np.sin(ang)[:, None, None], np.cos(ang)[:, None, None]
    return np.eye(3)[None] + s * K + (1 - c) * K @ K


# ── THE CLEAN REST ───────────────────────────────────────────────────────────────────────────────────────────────────────
def clean_rest(joints):
    """per joint: its world rotation at the clean rest, in this skeleton's own zero-pose frame. Identity (the calibrated zero pose)
    except the legs (straight down) and the feet (straight ahead, the zero-pose pitch kept, no toe-out)."""
    R = {j.name: np.eye(3) for j in joints}
    for j in joints:
        if not j.children: continue
        d = j.children[0].offset
        if np.linalg.norm(d) < 1e-9: continue
        if j.name in ('LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg'):
            R[j.name] = min_rot(d, np.array([0.0, -1.0, 0.0]))
        elif j.name in ('LeftFoot', 'RightFoot'):
            want = np.array([0.0, d[1], d[2]])
            R[j.name] = min_rot(d, want)
    return R


def stance_rest(joints, W, R):
    """THE FLAT FEET: a subject's calibrated zero-pose foot is not its flat foot (subject 54's toe markers point the foot 45 deg UP
    in every take; 137's left foot sits 10 deg flatter than its zero pose). Per take, the frames where a foot is planted (its
    slowest third) give that foot's (and its toes') true standing turn; the clean rest takes it, less its heading, so a planted
    foot plays flat on the floor on every body, turned where the actor's foot turned."""
    jd = {j.name: j for j in joints}
    for sd in ('Left', 'Right'):
        p = W[sd + 'Foot'][1]
        sp = np.linalg.norm(np.gradient(p, axis=0)[:, [0, 2]], axis=1) + 0.5 * np.abs(np.gradient(p[:, 1]))
        st = sp <= np.quantile(sp, 0.33)
        for nm in (sd + 'Foot', sd + 'ToeBase'):
            j = jd[nm]
            if not j.children: continue
            q = continuous(m2q(W[nm][0][st])); qm = q.mean(0); qm /= np.linalg.norm(qm)
            Ws = q2m(qm[None])[0]
            d = Ws @ (j.children[0].offset / np.linalg.norm(j.children[0].offset))
            h = np.arctan2(d[0], d[2])                       # its heading off +Z
            c, s_ = np.cos(-h), np.sin(-h)
            R[nm] = np.array([[c, 0, s_], [0, 1, 0], [-s_, 0, c]]) @ Ws


def load_take(take, cmu):
    subj = take.split('_')[0]
    return parse_bvh(os.path.join(cmu, '%03d' % int(subj), take + '.bvh'))


def take_world(take, cmu, frames=None):
    joints, data, ft = load_take(take, cmu)
    step = int(round(1 / (HZ * ft)))
    if frames is None: frames = np.arange(1, len(data), step)
    W = world(joints, local_mats(joints, data, frames))
    W0 = world(joints, local_mats(joints, data, np.array([0])))   # frame 1: the T-pose the take opens on (its standing hips height)
    return joints, W, W0, frames, ft


def facing(W, idx=slice(None)):
    lr = W['LeftUpLeg'][1][idx] - W['RightUpLeg'][1][idx]
    return np.arctan2(-lr[:, 2], lr[:, 0])


# ── one clip ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
def _features(joints, Q):
    """per frame: rotation vectors of the compared bones (their local turns) -> (F, D), and the weights per column"""
    cols, w = [], []
    for j in joints:
        if j.name not in LOOP_W or j.name == 'Hips': continue
        cols.append(axis_angle(q2m(Q[j.name]))); w += [LOOP_W[j.name]] * 3
    return np.concatenate(cols, 1), np.array(w)


def _rx(deg):
    a = np.radians(deg); c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def _pitch(d):
    """pitch (deg, + = down) of world turns d (F,3,3) applied to forward +Z"""
    f = d[:, :, 2]
    return np.degrees(np.arctan2(-f[:, 1], f[:, 2]))


def find_loop(joints, Q, Wroot, ia_range, lmin, lmax):
    """the pair (ia, ib), ia in ia_range, ib - ia in [lmin, lmax] frames, whose poses AND motions match best"""
    X, w = _features(joints, Q)
    X = np.concatenate([X, Wroot * 2.0], 1); w = np.concatenate([w, [LOOP_W['Hips']] * Wroot.shape[1]])
    V = np.gradient(X, axis=0) * HZ
    best, bi = 1e9, None
    for ia in ia_range:
        for ib in range(ia + lmin, min(ia + lmax, len(X) - 2) + 1):
            s = np.sum(w * (X[ib] - X[ia]) ** 2) + np.sum(w * (V[ib] - V[ia]) ** 2) * 0.05
            if s < best: best, bi = s, (ia, ib)
    return bi[0], bi[1], best


def bake_clip(spec, cmu, base):
    """base = (joints, clean rest world rotations by name, hips height) of the FILE's skeleton"""
    bj, bR, bHy = base
    joints, data, ft = load_take(spec['take'], cmu)
    assert [j.name for j in joints] == [j.name for j in bj], 'the takes must share the CMU joint tree'
    step = int(round(1 / (HZ * ft)))
    A = spec['a'] if isinstance(spec['a'], list) else [spec['a'], spec['a']]   # where the loop may start: [from, to] s
    a = float(A[0])
    kind = spec.get('kind', 'idle')
    lmin, lmax = spec.get('len', [2.0, 4.0]) if 'b' not in spec else (None, None)
    hi = (float(A[1]) + (float(spec['b']) - a if 'b' in spec else float(lmax)) + 0.5)
    frames = np.arange(max(1, int(round(a / ft))), min(len(data) - 1, int(round(hi / ft))) + 1, step)
    W = world(joints, local_mats(joints, data, frames))
    W0 = world(joints, local_mats(joints, data, np.array([0])))
    Rr = clean_rest(joints)
    stance_rest(joints, W, Rr)
    # facing. An idle: the stretch's mean hip line turned to +Z forward (left = +X). A walk (THE STRAIGHT PATH): every frame is
    # turned by its own heading of travel (the hips' velocity over one second), so a take walked on a curve (the CMU stage is
    # small: most walks bend) plays straight ahead, facing +Z, and never swings round on the spot
    Fn = len(frames)
    hp = W['Hips'][1]
    if kind == 'walk':
        v = np.gradient(hp, axis=0)
        k = np.ones(HZ) / HZ
        vx = np.convolve(np.pad(v[:, 0], (HZ // 2, HZ - 1 - HZ // 2), mode='edge'), k, 'valid')
        vz = np.convolve(np.pad(v[:, 2], (HZ // 2, HZ - 1 - HZ // 2), mode='edge'), k, 'valid')
        yt = np.unwrap(np.arctan2(vx, vz))                      # heading off +Z
        if spec.get('back'): yt = yt + np.pi                     # a take walked backwards
    else:
        yaw = facing(W)
        yt = np.full(Fn, np.arctan2(np.mean(np.sin(yaw)), np.mean(np.cos(yaw))))
    c, s_ = np.cos(-yt), np.sin(-yt)
    RyF = np.zeros((Fn, 3, 3)); RyF[:, 0, 0] = c; RyF[:, 0, 2] = s_; RyF[:, 1, 1] = 1; RyF[:, 2, 0] = -s_; RyF[:, 2, 2] = c
    if kind == 'walk':
        dv = np.einsum('fij,fj->fi', RyF, np.gradient(hp, axis=0))   # the travel, straightened, summed back into a path
        T0 = np.cumsum(dv, 0); T0[:, 1] = hp[:, 1]
    else:
        T0 = np.einsum('fij,fj->fi', RyF, hp)
    # world rotations on the file's clean rest: delta off this subject's clean rest, put on the file's
    Wr = {}
    for j in joints:
        R = np.einsum('fij,fjk->fik', RyF, W[j.name][0])
        corr = Rr[j.name].T @ bR[j.name]
        # THE LEVEL HEAD: a CMU subject's calibrated neutral head is often pitched (subject 137 looks up 20-30 deg in every take):
        # the stretch's median head pitch becomes level, + spec 'head' degrees (+ = down); the upper neck takes half
        if j.name in ('Neck1', 'Head') and spec.get('level', True):
            p = np.median(_pitch(np.einsum('fij,jk->fik', R, corr)))
            want = float(spec.get('head', 0)) * (0.5 if j.name == 'Neck1' else 1.0)
            corr = corr @ _rx((p - want) * (0.5 if j.name == 'Neck1' else 1.0)).T
        Wr[j.name] = np.einsum('fij,jk->fik', R, corr)
    T = T0 * (leg_len(bj) / leg_len(joints))   # the hips' path in the FILE's leg lengths
    Q = {}
    hk = float(spec.get('wrist', 0.35))
    for j in joints:
        Lr = Wr[j.name] if j.parent is None else np.einsum('fji,fjk->fik', Wr[j.parent.name], Wr[j.name])
        if j.name in ('LeftHand', 'RightHand') and hk < 1:
            # THE QUIET WRISTS: the CMU hand markers are few and noisy, the wrists flap 30-60 deg (hands bent back, flared out);
            # only `wrist` (default 0.35) of each hand's turn off the clean rest plays
            r0 = bR[j.name] if j.parent is None else bR[j.parent.name].T @ bR[j.name]
            Lr = np.einsum('ij,fjk->fik', r0, rotvec_mat(axis_angle(np.einsum('ji,fjk->fik', r0, Lr)) * hk))
        Q[j.name] = continuous(m2q(Lr))
    # THE POSTURE LAYER: spec 'pose' {CMU joint: [x, y, z] deg} turns that joint by a constant amount in its own frame on every frame
    # (the zero pose's axes: x = pitch, + = forward/down; z = roll / an arm out from the body) — a chest held up, the arms off the
    # sides — over the actor's own motion
    for jn, xyz in (spec.get('pose') or {}).items():
        L = np.array([[1.0, 0, 0], [0, 1, 0], [0, 0, 1]])
        for ax, deg in zip('XYZ', xyz):
            if deg: L = L @ _rot(ax, np.array([float(deg)]))[0]
        Q[jn] = continuous(m2q(np.einsum('fij,jk->fik', q2m(Q[jn]), L)))
    # THE LOOP POINTS
    if 'b' in spec:
        ia, ib = 0, int(round((float(spec['b']) - a) * HZ)); score = -1
    else:
        hips_turn = axis_angle(Wr['Hips'])          # the hips' world turn (yaw included: an idle must come back to its facing)
        ia, ib, score = find_loop(joints, Q, hips_turn, range(0, int(round((float(A[1]) - a) * HZ)) + 1),
                                  int(round(lmin * HZ)), int(round(lmax * HZ)))
    Q = {k: v[ia:] for k, v in Q.items()}; T = T[ia:]; ib -= ia; a += ia / HZ
    n = ib                                           # frames 0..ib-1 play; frame ib == frame 0
    tt = np.arange(n + 1) / n
    seam = 0.0; seamj = ""
    for j in joints:
        q = Q[j.name][:n + 1]
        err = axis_angle(q2m(q[0:1]) @ np.transpose(q2m(q[n:n + 1]), (0, 2, 1)))[0]    # q0 * qn^-1, a world-side fix
        if j.name in LOOP_W and float(np.degrees(np.linalg.norm(err))) > seam: seam = float(np.degrees(np.linalg.norm(err))); seamj = j.name
        fix = rotvec_mat(np.outer(tt, err))
        Q[j.name] = continuous(m2q(np.einsum('fij,fjk->fik', fix, q2m(q))))[:n]
    P = T[:n + 1].copy()
    t = np.arange(n + 1)
    if kind == 'walk':
        for ax in (0, 2):                            # in place: the straight line from the first frame to the loop frame comes off
            P[:, ax] -= (P[n, ax] - P[0, ax]) * t / n
        P[:, 1] += (P[0, 1] - P[n, 1]) * t / n
        for ax in (0, 2): P[:, ax] -= P[:n, ax].mean()
    else:
        P += np.outer(t / n, P[0] - P[n])            # the small leftover drift, spread
        for ax in (0, 2): P[:, ax] -= P[:n, ax].mean()   # stands on the spot
    P = P[:n]
    # THE SEAM EASE: the spread fixes the pose at the wrap; what is left is a small jump in SPEED there (an arm swinging one way
    # meets itself swinging a little slower). The frames round the wrap (+-K, K = 4) take a circular gaussian average of their
    # neighbours, faded in toward the wrap, so the motion runs through it
    K = 4
    gw = np.exp(-0.5 * (np.arange(-K, K + 1) / 2.0) ** 2)
    for jn in list(Q.keys()):
        q = Q[jn]; out = q.copy()
        for i in range(-K, K + 1):
            acc = np.zeros(4); ref = q[i % n]
            for jj, wv in zip(range(-K, K + 1), gw):
                qq = q[(i + jj) % n]; acc += wv * (qq if np.dot(qq, ref) >= 0 else -qq)
            acc /= np.linalg.norm(acc)
            f = 1 - abs(i) / (K + 1)
            m = ref * (1 - f) + acc * f
            out[i % n] = m / np.linalg.norm(m)
        Q[jn] = continuous(out) if False else out
    Pc = P.copy()
    for i in range(-K, K + 1):
        f = 1 - abs(i) / (K + 1)
        avg = sum(wv * P[(i + jj) % n] for jj, wv in zip(range(-K, K + 1), gw)) / gw.sum()
        Pc[i % n] = P[i % n] * (1 - f) + avg * f
    P = Pc
    # THE FLOOR: the take's own floor height and the subject's height differ from the file's; the clip is lifted / lowered so its
    # planted feet (the lowest tenth of each frame's lowest foot point) stand where the rest pose's feet stand
    fk = ('LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase')
    Pw = fk_world(bj, Q, P)
    low = np.min(np.stack([Pw[k][:, 1] for k in fk], 1), 1)
    Pr = fk_world(bj, {j.name: m2q(((bR[j.name] if j.parent is None else bR[j.parent.name].T @ bR[j.name]))[None]) for j in bj}, np.array([[0, bHy, 0]]))
    rest_low = min(Pr[k][0, 1] for k in fk)
    P[:, 1] += rest_low - np.quantile(low, 0.1)
    return dict(name=spec['name'], joints=joints, Q=Q, T=P * SCALE, dur=n / HZ, take=spec['take'], a=a, b=a + n / HZ,
                score=score, kind=kind, seam=seam, seamj=seamj)


def leg_len(joints):
    jd = {j.name: j for j in joints}
    return sum(np.linalg.norm(jd[n].offset) for n in ('LeftLeg', 'LeftFoot', 'RightLeg', 'RightFoot')) / 2


def fk_world(joints, Q, T):
    """world positions per joint (F,3) on `joints`' own offsets"""
    P, Rw = {}, {}
    for j in joints:
        R = q2m(Q[j.name])
        if j.parent is None: Rw[j.name] = R; P[j.name] = np.asarray(T, dtype=float)
        else:
            Rw[j.name] = Rw[j.parent.name] @ R
            P[j.name] = P[j.parent.name] + np.einsum('fij,j->fi', Rw[j.parent.name], j.offset)
    return P


def make_base(take, cmu):
    """the FILE's skeleton: the base take's bones on the clean rest, the hips at the height that stands its feet on y = 0"""
    joints, data, ft = load_take(take, cmu)
    R0 = clean_rest(joints)
    restq = {}
    for j in joints:
        Lr = R0[j.name] if j.parent is None else R0[j.parent.name].T @ R0[j.name]
        restq[j.name] = m2q(Lr[None])[0]
    Pr = fk_world(joints, {k: v[None] for k, v in restq.items()}, np.zeros((1, 3)))
    hy = -min(Pr[k][0, 1] for k in ('LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase'))
    return (joints, R0, hy), restq


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
        # the loop's first frame is written again at the end (time = dur) so the sampler wraps through it: three.js LoopRepeat
        # plays 0..dur, and the last key IS the first pose
        nfr = len(c['T']); tacc = add(np.arange(nfr + 1) / HZ, 'SCALAR', True)
        samplers, channels = [], []
        for j in joints:
            q = c['Q'][j.name]; q = np.concatenate([q, q[:1] * (1 if np.dot(q[-1], q[0]) >= 0 else -1)])
            samplers.append({'input': tacc, 'output': add(q, 'VEC4'), 'interpolation': 'LINEAR'})
            channels.append({'sampler': len(samplers) - 1, 'target': {'node': idx[j.name], 'path': 'rotation'}})
        samplers.append({'input': tacc, 'output': add(np.concatenate([c['T'], c['T'][:1]]), 'VEC3'), 'interpolation': 'LINEAR'})
        channels.append({'sampler': len(samplers) - 1, 'target': {'node': idx['Hips'], 'path': 'translation'}})
        anims.append({'name': c['name'], 'samplers': samplers, 'channels': channels,
                      'extras': {'cmuTake': c['take'], 'from': round(c['a'], 3), 'to': round(c['b'], 3)}})
    js = {'asset': {'version': '2.0', 'generator': 'Entropy Wars bake-mocap.py rev 2',
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
def clip_world(c):
    P = {}; Rw = {}
    for j in c['joints']:
        R = q2m(c['Q'][j.name])
        if j.parent is None: Rw[j.name] = R; P[j.name] = c['T'] / SCALE
        else:
            Rw[j.name] = Rw[j.parent.name] @ R
            P[j.name] = P[j.parent.name] + np.einsum('fij,j->fi', Rw[j.parent.name], j.offset)
    return P


def draw_sheet(P, joints, fr, out, title, labels):
    from PIL import Image, ImageDraw
    n = len(fr); Wd, H = 130, 170; img = Image.new('RGB', (Wd * n, H * 2 + 18), 'white'); d = ImageDraw.Draw(img)
    for k, f in enumerate(fr):
        for row, (ax, sgn) in enumerate(((0, -1), (2, 1))):     # front: camera on +Z looking back (left on the right); side
            for j in joints:
                if j.parent is None: continue
                a, b = P[j.parent.name][f], P[j.name][f]
                col = (200, 0, 0) if j.name.startswith('L') else (0, 0, 200) if j.name.startswith('R') else (0, 0, 0)
                X = lambda p: k * Wd + Wd / 2 + sgn * p[ax] * 4.2
                Y = lambda p: row * H + 160 - p[1] * 4.2
                d.line([(X(a), Y(a)), (X(b), Y(b))], fill=col, width=2)
            d.text((k * Wd + 3, row * H + 3), labels[k], fill=(0, 0, 0))
    d.text((4, H * 2 + 3), title, fill=(0, 0, 0))
    img.save(out)


def sheet(c, out, n=12):
    P = clip_world(c); F = len(c['T'])
    fr = list(np.linspace(0, F - 1, n - 3).astype(int)) + [F - 2, F - 1, 0]      # ... then the seam: the last two frames, the first
    labels = ['%.2fs' % (f / HZ) for f in fr[:-3]] + ['end-1', 'end', 'START']
    draw_sheet(P, c['joints'], fr, out, '%s  %s %.2f-%.2fs  %.2fs loop  match %.3f  seam fix max %.1f deg  (red = left)' %
               (c['name'], c['take'], c['a'], c['b'], c['dur'], c['score'], c['seam']), labels)


def scan(take, cmu, outdir, n=24):
    """a whole take at a glance: n frames + the hips' speed per second (find the standing / walking stretches)"""
    joints, W, W0, frames, ft = take_world(take, cmu)
    hp = W['Hips'][1]; sp = np.linalg.norm(np.diff(hp[:, [0, 2]], axis=0), axis=1) * HZ * SCALE
    secs = len(frames) / HZ
    print('%s: %.1f s' % (take, secs))
    print('  hips speed m/s per second:', ' '.join('%d:%.2f' % (k, sp[k * HZ:(k + 1) * HZ].mean()) for k in range(int(secs))))
    if outdir:
        P = {k: v[1] - np.array([hp[:, 0], np.zeros(len(hp)), hp[:, 2]]).T for k, v in W.items()}
        fr = np.linspace(0, len(frames) - 1, n).astype(int)
        draw_sheet(P, joints, fr, os.path.join(outdir, 'scan_' + take + '.png'), take + ' (whole take, raw facing)', ['%.1fs' % (f / HZ) for f in fr])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cmu', required=True); ap.add_argument('--out')
    ap.add_argument('--sheet'); ap.add_argument('--base', default='137_28', help='the take whose skeleton is the file rest')
    ap.add_argument('--clips', help='a JSON file with the clip list (default mocap-clips.json)')
    ap.add_argument('--scan', nargs='*', help='takes to look at whole (no GLB)')
    o = ap.parse_args()
    if o.sheet: os.makedirs(o.sheet, exist_ok=True)
    if o.scan:
        for t in o.scan: scan(t, o.cmu, o.sheet)
        return
    specs = json.load(open(o.clips or CLIPS_FILE))
    base, restq = make_base(o.base, o.cmu)
    clips = [bake_clip(s, o.cmu, base) for s in specs]
    for c in clips:
        print('%-24s %-7s %6.2f-%6.2fs -> %.2fs loop, %3d frames, match %.3f, seam fix %.1f deg (%s)' %
              (c['name'], c['take'], c['a'], c['b'], c['dur'], len(c['T']), c['score'], c['seam'], c['seamj']))
    if o.out: print('wrote', o.out, write_glb(clips, o.out, base, restq), 'bytes')
    if o.sheet:
        for c in clips: sheet(c, os.path.join(o.sheet, c['name'] + '.png'))


if __name__ == '__main__':
    main()
