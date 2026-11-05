#!/usr/bin/env python3
"""bake-garment.py - creator clothes BUILT IN BLENDER (repo-only tooling, 2026-11-01; docs/notes/character-models-plan.md row 12).

mondo (11-01): the creator's classic clothes are generated in code at runtime as a shell pushed out from the skin (why they
tore); he wants clothes the MakeHuman packs don't have made properly in Blender, starting with ONE piece to judge. This is that
piece: THE TRENCH COAT (knee length, double-breasted, belted), built with Blender's own Python module (pip install bpy==5.2.3)
around the MPFB bodies (git clone https://github.com/makehumancommunity/mpfb2), NOT from the skin:

  * PATTERN PIECES, not a skin copy: the body + skirt is one wrap-around sheet (rows x 84 columns) cut like a coat - the
    under (right) panel and the outer (left) panel overlap down the front, the two front edges run up into a V and fold back
    as LAPELS; the rows follow the body's convex hull + ease (cloth bridges the hollows: between the shoulder blades, under
    the chest, the small of the back) and below the hips THE HANG: each column falls straight from the widest hip row and
    flares to the hem, soft folds growing toward it - the skirt hangs over both legs, it never wraps each one. The sleeves
    are tubes round the arm (rings perpendicular to a rounded shoulder -> elbow -> wrist path, parallel-transport frames,
    hull of the arm's own cross-section + an ease tapering to the cuff). Then the pieces sewn on: turned hems + front
    facings (the cloth's thickness at every edge), lapels with a notch, a stand-and-fold collar, the belt (over the outermost
    layer) with its buckle frame and tail, six buttons, epaulettes, cuff straps, slanted pocket flaps.
  * BUILT ON EVERY BODY: the five MPFB bodies are warped into the male's proportions (knee / waist / neck heights, shoulder
    width), the coat is built there with the SAME topology on each, then warped back - each body's coat is its own build, not
    a proxy fit (MPFB's MakeClothes matching was tried first: its offsets crumpled the hanging skirt on the female / heavy).
  * THE WEIGHTS: each vertex takes the bone weights of the body skin under it (inverse-distance over the 6 nearest body
    vertices of its own part: the sleeves only from their arm, the body pieces only from torso + legs); below the belt THE
    HANGING SKIRT replaces them: the hips + the thigh of the side the cloth is on, the thigh's share growing to 0.78 at the
    hem, the back blending the two thighs across the centre (the front is open) - so a stride swings each half with its leg
    and the cloth between stretches; it can never tear.
  * THE SHADE: ambient occlusion from the body + the coat itself (24 rays, 12 cm) x each piece's own shade (buttons, buckle,
    pocket slits, facings) -> _G (uint8), the game multiplies the outer layer's tint by it.
  * THE SKIN UNDER IT: body vertices the coat covers (along the normal and four tilts within 7 cm) above the belt and on the
    arms -> ewWear.del (hm08 indices, as pack clothes' delete_verts): the game hides them (and any coded top under them).

Output: <out>/ewb_trench.glb in the pack clothes' COMPACT LAYOUT (bake-mpfb.py write_wear_glb: POSITION = the male build,
_D_<BODY> the other four, _N, _J/_W into extras.ewWear.bones, uint16 indices) + _G; UVs in metres (the game scales them to
the outer layer's fabric). No texture: the creator's outer layer fabric / tint / print paints it (three-renderer.js THE
BLENDER COAT). R2: Assets/characters/creator/wear/ewb_trench.glb.

Usage: pip install bpy==5.2.3 ; git clone --depth 1 https://github.com/makehumancommunity/mpfb2 /tmp/mpfb2
       python3 -I bake-garment.py --mpfb /tmp/mpfb2 [--out charactercreation/wear] [--views <dir>]   (~2 min)
--views writes body + coat GLBs per body to look at. Notes: docs/notes/models-assets.md "THE BLENDER COAT".
"""
import argparse, importlib.util, json, math, os, struct, sys

import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('bake_mpfb', os.path.join(HERE, 'bake-mpfb.py'))
bm = importlib.util.module_from_spec(_spec)
_argv, sys.argv = sys.argv, [sys.argv[0]]
_spec.loader.exec_module(bm)          # (install_mpfb, BODIES, WEAR_BODIES, BONE_MAP, WEAR_DQ)
sys.argv = _argv

# ═══════════════════════════════ THE PATTERN: the body sheet + the sleeves ═══════════════════════════════

TORSO_B = ('pelvis', 'spine_01', 'spine_02', 'spine_03', 'clavicle_l', 'clavicle_r', 'neck_01')
LEG_B = ('thigh_l', 'calf_l', 'foot_l', 'ball_l', 'thigh_r', 'calf_r', 'foot_r', 'ball_r')
FING = ('index', 'middle', 'pinky', 'ring', 'thumb')


def arm_bones(s):
    return ('upperarm_' + s, 'lowerarm_' + s)


def classify(h):
    """per body vertex: dominant bone name (body group only), co (N,3)"""
    me = h.data
    names = {g.index: g.name for g in h.vertex_groups}
    body_gi = h.vertex_groups['body'].index
    co = np.array([v.co[:] for v in me.vertices])
    dom = np.empty(len(co), dtype=object)
    inbody = np.zeros(len(co), bool)
    for v in me.vertices:
        best, bw = None, 0
        for g in v.groups:
            if g.group == body_gi and g.weight > 0:
                inbody[v.index] = True
            n = names[g.group]
            if g.weight > bw and (n in TORSO_B or n in LEG_B or n.startswith(('upperarm', 'lowerarm', 'hand', 'head')) or n.startswith(FING)):
                best, bw = n, g.weight
        dom[v.index] = best
    return co, dom, inbody


def hull2d(P):
    P = np.unique(np.round(P, 6), axis=0)
    if len(P) < 3:
        return P
    P = P[np.lexsort((P[:, 1], P[:, 0]))]
    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, up = [], []
    for p in P:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0:
            lo.pop()
        lo.append(p)
    for p in P[::-1]:
        while len(up) >= 2 and cross(up[-2], up[-1], p) <= 0:
            up.pop()
        up.append(p)
    return np.array(lo[:-1] + up[:-1])


def minkowski(H, e, k=24):
    a = np.linspace(0, 2 * math.pi, k, endpoint=False)
    ring = np.stack([np.cos(a), np.sin(a)], 1) * e
    return hull2d((H[:, None, :] + ring[None]).reshape(-1, 2))


def ray_poly(H, c, d):
    """distance from c along unit d to the convex polygon H (c inside)"""
    best = None
    n = len(H)
    for i in range(n):
        a, b = H[i], H[(i + 1) % n]
        e = b - a
        den = d[0] * (-e[1]) - d[1] * (-e[0])
        if abs(den) < 1e-12:
            continue
        w = a - c
        t = (w[0] * (-e[1]) - w[1] * (-e[0])) / den
        u = (d[0] * w[1] - d[1] * w[0]) / den
        if t > 0 and -1e-9 <= u <= 1 + 1e-9:
            best = t if best is None else min(best, t)
    return best if best is not None else 0.0


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def dirv(phi):
    return np.array([math.sin(phi), -math.cos(phi)])     # phi 0 = front (-y), +90 = left (+x)


def build(co, dom, inbody, bones, opts=None):
    o = dict(hem=0.52, top=1.60, zb=1.30, belt=None, ease=0.024, skirt_ease=0.026, flare=0.05, cols=84)
    if opts:
        o.update(opts)
    torso = np.array([inbody[i] and dom[i] in TORSO_B for i in range(len(co))])
    leg = np.array([inbody[i] and dom[i] in LEG_B for i in range(len(co))])
    tl = torso | leg
    armtop = np.array([inbody[i] and dom[i] is not None and dom[i].startswith('upperarm') for i in range(len(co))]) & (np.abs(co[:, 0]) < o.get('armx', 0.19))
    # the natural waist: narrowest torso hull width between 1.0 and 1.2
    if o['belt'] is None:
        best = None
        for z in np.arange(1.0, 1.2, 0.005):
            m = torso & (np.abs(co[:, 2] - z) < 0.008)
            if m.sum() < 10:
                continue
            w = co[m, 0].max() - co[m, 0].min()
            if best is None or w < best[0]:
                best = (w, z)
        o['belt'] = best[1]
    zbelt = o['belt']
    # rows: dense near the shoulders
    zs = [o['hem']]
    while zs[-1] < o['top'] - 1e-6:
        z = zs[-1]
        dz = 0.024 if z < zbelt - 0.05 else 0.018 if z < 1.40 else 0.011
        zs.append(min(o['top'], z + dz))
    zs = np.array(zs)
    R = len(zs)
    # per-row hull (torso above the crotch, torso + legs below), centre
    hulls, cen = [], []
    for z in zs:
        band = 0.022 if z > 1.45 else 0.016
        sel = (tl if z < 1.3 else torso) & (np.abs(co[:, 2] - z) < band)
        if z > 1.40:     # the shoulder top: the arm's own skin inside the shoulder joint (the deltoid's top) is the yoke's too
            sel |= armtop & (np.abs(co[:, 2] - z) < band)
        P2 = co[sel][:, :2]
        H = hull2d(P2)
        hulls.append(H)
        cen.append([0.0, 0.5 * (P2[:, 1].min() + P2[:, 1].max())])
    cen = np.array(cen)
    # smooth the centre's y over the rows; below the hips hold it (the skirt hangs from the hips)
    for _ in range(6):
        cen[1:-1, 1] = 0.25 * cen[:-2, 1] + 0.5 * cen[1:-1, 1] + 0.25 * cen[2:, 1]
    ihip = int(np.argmin(np.abs(zs - (zbelt - 0.12))))
    cen[:ihip, 1] = cen[ihip, 1]
    # dense radius profile per row (720 angles) of the eased hull
    NA = 720
    ang = np.linspace(-math.pi, math.pi, NA, endpoint=False)
    rad = np.zeros((R, NA))
    radh = np.zeros((R, NA))
    for r, z in enumerate(zs):
        H = hulls[r]
        e = o['ease'] if z >= zbelt + 0.03 else (0.02 if z >= zbelt - 0.03 else o['skirt_ease'])
        He = minkowski(H, e)
        for k, a in enumerate(ang):
            d = dirv(a)
            rad[r, k] = ray_poly(He, cen[r], d)
            radh[r, k] = ray_poly(H, cen[r], d)
    # vertical smoothing above the hips (no lumps between rows), never inside the hull + 1.2 cm
    for _ in range(3):
        sm = rad.copy()
        sm[1:-1] = 0.25 * rad[:-2] + 0.5 * rad[1:-1] + 0.25 * rad[2:]
        rad = np.maximum(sm, radh + 0.012)
    # THE HANG: below the widest hip row the skirt falls straight and flares to the hem
    iw = ihip
    zw = zs[ihip]
    for r in range(ihip - 1, -1, -1):
        f = (zw - zs[r]) / max(1e-6, zw - o['hem'])
        rad[r] = np.maximum(rad[r], rad[r + 1] + o['flare'] * (zs[r + 1] - zs[r]) / max(1e-6, zw - o['hem']))
    # radius lookup for any angle (wrapped), row r
    def R_at(r, phi):
        a = (phi + math.pi) % (2 * math.pi) - math.pi
        x = (a + math.pi) / (2 * math.pi) * NA
        i0 = int(math.floor(x)) % NA
        t = x - math.floor(x)
        return rad[r, i0] * (1 - t) + rad[r, (i0 + 1) % NA] * t
    def point(r, phi):
        d = dirv(phi)
        rr = R_at(r, phi)
        return np.array([cen[r, 0] + rr * d[0], cen[r, 1] + rr * d[1], zs[r]])
    # the front edges: x of the under panel's edge and the outer panel's edge per row
    zt = o['top']
    zb = o['zb']
    def xo(z):     # outer (left) panel: wraps to the wearer's right, rises to the left neck point above the break
        return -0.10 + (0.075 + 0.10) * smoothstep(zb, zt, z) ** 0.9
    def xu(z):     # under (right) panel
        return 0.085 - (0.085 + 0.07) * smoothstep(zb, zt, z) ** 0.9
    def phi_at_x(r, x):
        # front half: phi in (-pi/2, pi/2), x increases with phi
        lo, hi = -1.45, 1.45
        for _ in range(40):
            m = 0.5 * (lo + hi)
            if point(r, m)[0] < x:
                lo = m
            else:
                hi = m
        return 0.5 * (lo + hi)
    C = o['cols']
    P = np.zeros((R, C, 3))
    PH = np.zeros((R, C))
    for r, z in enumerate(zs):
        ps = phi_at_x(r, xu(z))                    # start: the under panel's edge, going round to the right (phi falling)
        pe = phi_at_x(r, xo(z)) - 2 * math.pi       # end: the outer panel's edge, one turn later
        ph = np.linspace(ps, pe, C)
        PH[r] = ph
        for c in range(C):
            P[r, c] = point(r, ph[c])
        # the outer panel lies over the under one: +6 mm where it overlaps the start (eased in over 15 degrees)
        for c in range(C):
            over = (ps - 2 * math.pi) - ph[c]          # > 0 = past the start, one turn round
            k = float(smoothstep(-0.26, 0.0, over))
            # ... and the under panel sinks 3 mm where the outer one covers it (9 mm apart: 6 mm let it through on the heavy body)
            ku = float(smoothstep(pe + 2 * math.pi - 0.26, pe + 2 * math.pi, ph[c]))
            if k > 0 or ku > 0:
                d = dirv(ph[c])
                P[r, c, 0] += (0.006 * k - 0.003 * ku) * d[0]
                P[r, c, 1] += (0.006 * k - 0.003 * ku) * d[1]
    # skirt drape: soft folds growing to the hem (columns), only below the hips
    for r in range(R):
        a = float(smoothstep(zw, o['hem'], zs[r])) * 0.009
        if a <= 0:
            continue
        for c in range(C):
            d = dirv(PH[r, c])
            f = a * math.cos(PH[r, c] * 11.0)
            P[r, c, 0] += f * d[0]
            P[r, c, 1] += f * d[1]
    # UV in metres: u = arc length along the row from the back centre column, v = height
    UV = np.zeros((R, C, 2))
    for r in range(R):
        seg = np.linalg.norm(np.diff(P[r], axis=0), axis=1)
        s = np.concatenate([[0], np.cumsum(seg)])
        cb = int(np.argmin(np.abs(((PH[r] + math.pi) % (2 * math.pi)) - math.pi)))    # nearest the back (phi = -pi)
        cb = int(np.argmin(np.abs(PH[r] + math.pi)))
        UV[r, :, 0] = s - s[cb]
        UV[r, :, 1] = zs[r]
    info = dict(zs=zs, PH=PH, cen=cen, zbelt=zbelt, ihip=ihip, xo=xo, xu=xu, point=point, R_at=R_at, rad=rad, opts=o, phi_at_x=phi_at_x)
    return P, UV, info


def sleeve(co, dom, inbody, rig_pts, side, n_around=26, ease0=0.019, ease1=0.012, s0=-0.035):
    """a tube along the arm: rings perpendicular to the (rounded) shoulder -> elbow -> wrist path"""
    S, E, W = [np.array(rig_pts[k]) for k in ('upperarm_' + side, 'lowerarm_' + side, 'hand_' + side)]
    d1 = (E - S) / np.linalg.norm(E - S)
    d2 = (W - E) / np.linalg.norm(W - E)
    L1, L2 = np.linalg.norm(E - S), np.linalg.norm(W - E)
    arm = np.array([inbody[i] and (dom[i] in arm_bones(side)) for i in range(len(co))])
    A = co[arm]
    # the path: a quadratic Bezier round the elbow
    b = 0.07
    def path(s):
        if s <= L1 - b:
            return S + d1 * s, d1
        if s >= L1 + b:
            return E + d2 * (s - L1), d2
        t = (s - (L1 - b)) / (2 * b)
        p0, p1, p2 = E - d1 * b, E, E + d2 * b
        p = (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t * t * p2
        tg = 2 * (1 - t) * (p1 - p0) + 2 * t * (p2 - p1)
        return p, tg / np.linalg.norm(tg)
    s1 = L1 + L2 + 0.006
    # fixed ring counts (every body gets the same topology): 12 up the upper arm, 7 round the elbow, 9 down the forearm
    ss = np.concatenate([np.linspace(s0, L1 - b, 12, endpoint=False), np.linspace(L1 - b, L1 + b, 7), np.linspace(L1 + b, s1, 10)[1:]])
    # frames by parallel transport
    rings, frames = [], []
    p, t = path(ss[0])
    n = np.cross(t, np.array([0.0, -1.0, 0.0]))
    n /= np.linalg.norm(n)
    for s in ss:
        p, t2 = path(s)
        n = n - t2 * np.dot(n, t2)
        n /= np.linalg.norm(n)
        bvec = np.cross(t2, n)
        frames.append((p, t2, n, bvec))
    K = n_around
    angs = np.linspace(0, 2 * math.pi, K, endpoint=False)
    RAD = np.zeros((len(ss), K))
    CEN = np.zeros((len(ss), 2))
    for i, (p, t2, n, bvec) in enumerate(frames):
        rel = A - p
        sl = np.abs(rel @ t2) < 0.013
        sl &= np.linalg.norm(rel, axis=1) < 0.14
        Q = np.stack([rel[sl] @ n, rel[sl] @ bvec], 1)
        if len(Q) < 6:
            Q = np.array([[0.04 * math.cos(a), 0.04 * math.sin(a)] for a in angs])
        H = hull2d(Q)
        fr = (ss[i] - s0) / (s1 - s0)
        e = ease0 + (ease1 - ease0) * fr
        He = minkowski(H, e)
        c = He.mean(axis=0)
        CEN[i] = c
        for k, a in enumerate(angs):
            RAD[i, k] = ray_poly(He, c, np.array([math.cos(a), math.sin(a)]))
    for _ in range(3):
        CEN[1:-1] = 0.25 * CEN[:-2] + 0.5 * CEN[1:-1] + 0.25 * CEN[2:]
        RAD[1:-1] = np.maximum(0.25 * RAD[:-2] + 0.5 * RAD[1:-1] + 0.25 * RAD[2:], RAD[1:-1] * 0.97)
    # the cuff end: a touch wider (the sleeve hangs open over the wrist)
    P = np.zeros((len(ss), K, 3))
    UV = np.zeros((len(ss), K, 2))
    for i, (p, t2, n, bvec) in enumerate(frames):
        for k, a in enumerate(angs):
            rr = RAD[i, k]
            P[i, k] = p + n * (CEN[i, 0] + rr * math.cos(a)) + bvec * (CEN[i, 1] + rr * math.sin(a))
        UV[i, :, 1] = ss[i]
    for i in range(len(ss)):
        seg = np.linalg.norm(P[i] - np.roll(P[i], -1, axis=0), axis=1)
        UV[i, :, 0] = np.concatenate([[0], np.cumsum(seg)[:-1]])
    return P, UV, dict(ss=ss, frames=frames, RAD=RAD, CEN=CEN, K=K)


# ═══════════════════════════════ THE PIECES SEWN ON ═══════════════════════════════


class Mesh:
    def __init__(self):
        self.V, self.F, self.FUV, self.T = [], [], [], []   # T: (part, phi, gain, group)

    def add_grid(self, P, UV, part, group, closed=False, gain=1.0, phi=None, flip=False, inside=None):
        R, C = P.shape[:2]
        off = len(self.V)
        for r in range(R):
            for c in range(C):
                g = gain if np.isscalar(gain) else gain[r, c]
                self.V.append(np.array(P[r, c], float))
                self.T.append((part, float(phi[r, c]) if phi is not None else float('nan'), float(g), group))
        cc = C if closed else C - 1
        F, FU = [], []
        for r in range(R - 1):
            for c in range(cc):
                c2 = (c + 1) % C
                u2 = UV[r, c2] if c2 else np.array([UV[r, c][0] + np.linalg.norm(P[r, c] - P[r, 0]), UV[r, 0][1]])
                u3 = UV[r + 1, c2] if c2 else np.array([UV[r + 1, c][0] + np.linalg.norm(P[r + 1, c] - P[r + 1, 0]), UV[r + 1, 0][1]])
                f = [off + r * C + c, off + r * C + c2, off + (r + 1) * C + c2, off + (r + 1) * C + c]
                fu = [UV[r, c], u2, u3, UV[r + 1, c]]
                F.append(f); FU.append(fu)
        # orient outward: `inside(p)` = a point inside the body near p
        if inside is not None:
            V = np.array(self.V)
            vote = 0.0
            for f in F[::7]:
                a, b, c_ = V[f[0]], V[f[1]], V[f[2]]
                n = np.cross(b - a, c_ - a)
                ctr = (a + b + c_) / 3
                vote += np.sign(np.dot(n, ctr - inside(ctr)))
            if vote < 0:
                flip = not flip
        if flip:
            F = [f[::-1] for f in F]; FU = [fu[::-1] for fu in FU]
        self.F += F; self.FUV += FU
        return off


class Surf:
    """the body sheet as a sampler: point / normal at (z, phi unwrapped)"""
    def __init__(self, P, info):
        self.P, self.zs, self.PH = P, info['zs'], info['PH']

    def _row(self, r, phi):
        ph = self.PH[r]
        # ph is decreasing
        if phi >= ph[0]:
            return self.P[r, 0]
        if phi <= ph[-1]:
            return self.P[r, -1]
        j = np.searchsorted(-ph, -phi) - 1
        j = max(0, min(len(ph) - 2, j))
        t = (phi - ph[j]) / (ph[j + 1] - ph[j])
        return self.P[r, j] * (1 - t) + self.P[r, j + 1] * t

    def at(self, z, phi):
        zs = self.zs
        if z <= zs[0]:
            return self._row(0, phi)
        if z >= zs[-1]:
            return self._row(len(zs) - 1, phi)
        r = np.searchsorted(zs, z) - 1
        t = (z - zs[r]) / (zs[r + 1] - zs[r])
        return self._row(r, phi) * (1 - t) + self._row(r + 1, phi) * t

    def normal(self, z, phi):
        e = 0.004
        a = self.at(z, phi + e) - self.at(z, phi - e)
        b = self.at(z + 0.01, phi) - self.at(z - 0.01, phi)
        n = np.cross(b, a)
        n /= max(1e-9, np.linalg.norm(n))
        p = self.at(z, phi)
        d = dirv(phi)
        if n[0] * d[0] + n[1] * d[1] < 0:
            n = -n
        return n

    def arc_phi(self, z, phi, dist):
        """phi moved `dist` metres along the row (dist > 0 = phi grows)"""
        p0 = self.at(z, phi)
        step = 0.002 * (1 if dist > 0 else -1)
        q, s = phi, 0.0
        for _ in range(2000):
            q2 = q + step
            p1 = self.at(z, q2)
            s += np.linalg.norm(p1 - p0)
            p0, q = p1, q2
            if s >= abs(dist):
                break
        return q


def build_details(M, P, info, sleeves, inside):
    S = Surf(P, info)
    zs, PH = info['zs'], info['PH']
    o = info['opts']
    zb, zt, zbelt = o['zb'], o['top'], info['zbelt']
    R, C = P.shape[:2]
    pe = lambda z: S.PH[0][-1]
    # phi of the edges at any z (interpolated from the rows' first / last column)
    def ps_at(z):
        return np.interp(z, zs, PH[:, 0])
    def pe_at(z):
        return np.interp(z, zs, PH[:, -1])

    # ── facings: the hem and the two front edges turn in (the cloth's thickness at every edge) ──
    def facing(path_pts, path_phi, inward, width=0.016, depth=0.004, part='facing'):
        # path: (K,3) along an edge; inward (K,3) unit = along the cloth away from the edge; normals from the sheet
        K = len(path_pts)
        Q = np.zeros((2, K, 3)); UV = np.zeros((2, K, 2))
        for k in range(K):
            n = path_phi[k][1]
            Q[0, k] = path_pts[k] - n * 0.0005
            Q[1, k] = path_pts[k] + inward[k] * width - n * depth
        s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Q[0], axis=0), axis=1))])
        UV[0, :, 0] = s; UV[1, :, 0] = s; UV[1, :, 1] = width
        return Q, UV
    # hem
    K = C
    hp = P[0]
    hn = np.array([S.normal(zs[0], PH[0, c]) for c in range(C)])
    hin = np.tile(np.array([0, 0, 1.0]), (C, 1))
    Q, UV = facing(hp, [(None, hn[c]) for c in range(C)], hin, width=0.02)
    M.add_grid(Q, UV, 'facing', 'coat_tl', gain=0.8, phi=np.tile(PH[0], (2, 1)), inside=inside)
    # front edges (the outer panel's end column, the under panel's start column), below the lapels
    for col, sgn in ((C - 1, 1), (0, -1)):
        rows = [r for r in range(R) if zs[r] <= zb + 0.01]
        pts = P[rows, col]
        nr = np.array([S.normal(zs[r], PH[r, col]) for r in rows])
        inw = []
        for r in rows:
            q = S.arc_phi(zs[r], PH[r, col], 0.02 * sgn)
            d = S.at(zs[r], q) - P[r, col]
            inw.append(d / max(1e-9, np.linalg.norm(d)))
        Q, UV = facing(pts, [(None, n) for n in nr], np.array(inw), width=0.02)
        M.add_grid(Q, UV, 'facing', 'coat_tl', gain=0.8, phi=np.tile(PH[rows, col], (2, 1)), inside=inside)

    # ── the lapels: each front edge folds back over its own panel above the break, widening to the notch ──
    zm = None
    for z in np.linspace(zb, zt, 200):
        if info['xo'](z) >= info['xu'](z):
            zm = z; break
    zm = zm or (zb + zt) / 2
    def lapel(edge_phi, z0, sgn, wmax=0.082):
        zz = np.linspace(z0, zt - 0.004, 16)
        W = 5
        Q = np.zeros((len(zz), W, 3)); UV = np.zeros((len(zz), W, 2)); G = np.ones((len(zz), W))
        for i, z in enumerate(zz):
            f = (z - z0) / (zt - z0)
            w = wmax * smoothstep(0.0, 0.55, f) * (1 - 0.55 * smoothstep(0.82, 1.0, f)) + 0.006
            e = edge_phi(z)
            for j in range(W):
                d = w * j / (W - 1)
                q = S.arc_phi(z, e, sgn * d) if d > 0 else e
                n = S.normal(z, q)
                lift = 0.0045 + 0.003 * (1 - j / (W - 1))           # the roll: higher at the fold
                Q[i, j] = S.at(z, q) + n * lift
                UV[i, j] = (d, z)
                G[i, j] = 0.92 if j else 0.85
            # the fold itself rolls just past the edge
            Q[i, 0] += (S.at(z, e) - S.at(z, S.arc_phi(z, e, sgn * 0.01))) * 0.35
        return Q, UV, G
    Q, UV, G = lapel(pe_at, zb, +1)
    M.add_grid(Q, UV, 'lapel', 'coat_tl', gain=G, inside=inside)
    Q, UV, G = lapel(ps_at, zm - 0.01, -1)
    M.add_grid(Q, UV, 'lapel', 'coat_tl', gain=G, inside=inside)

    # ── the collar: stands up round the neck from lapel to lapel and folds down over the top rows ──
    top = R - 1
    cols = list(range(0, C))
    K = len(cols)
    prof = [(-0.004, 0.001), (0.018, 0.004), (0.03, 0.009), (0.024, 0.015), (0.0, 0.018), (-0.026, 0.02)]   # (up, out) cross-section
    Q = np.zeros((len(prof), K, 3)); UV = np.zeros((len(prof), K, 2)); G = np.ones((len(prof), K))
    for k, c in enumerate(cols):
        p = P[top, c]
        n = S.normal(zs[top] - 0.01, PH[top, c])
        n[2] = 0; n /= np.linalg.norm(n)
        endk = min(k, K - 1 - k) / 6.0                       # the ends taper into the lapels' notch
        sc = 0.55 + 0.45 * min(1.0, endk)
        for i, (up, out) in enumerate(prof):
            Q[i, k] = p + np.array([0, 0, up * sc]) + n * out
            UV[i, k] = (0, i * 0.015)
            G[i, k] = 0.75 if i < 2 else 0.95
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Q[2], axis=0), axis=1))])
    UV[:, :, 0] = s[None, :]
    M.add_grid(Q, UV, 'collar', 'coat_tl', gain=G, phi=np.tile(PH[top], (len(prof), 1)), flip=False, inside=inside)

    # ── the belt: a band round the waist over the outermost layer, a buckle at the front and its tail ──
    NB = 120
    phis = np.linspace(-math.pi * 0.98, math.pi * 0.98, NB)        # from the back round to the back
    bz = [zbelt - 0.022, zbelt - 0.022, zbelt + 0.022, zbelt + 0.022]
    bo = [0.002, 0.008, 0.008, 0.002]
    Q = np.zeros((4, NB, 3)); UV = np.zeros((4, NB, 2))
    for k, ph in enumerate(phis):
        for i in range(4):
            cand = [ph, ph - 2 * math.pi, ph + 2 * math.pi]
            best = None
            for q in cand:
                if PH[:, -1].min() - 0.01 <= q <= PH[:, 0].max() + 0.01:
                    p = S.at(bz[i], q)
                    d = dirv(ph)
                    rr = p[0] * d[0] + (p[1] - info['cen'][0, 1]) * d[1]
                    if best is None or rr > best[0]:
                        best = (rr, p, q)
            p, q = best[1], best[2]
            n = S.normal(bz[i], q)
            Q[i, k] = p + n * bo[i]
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Q[1], axis=0), axis=1))])
    UV[:, :, 0] = s[None, :]; UV[:, :, 1] = np.array([0, 0.006, 0.05, 0.056])[:, None]
    M.add_grid(Q, UV, 'belt', 'coat_tl', closed=True, gain=0.9, phi=np.tile(phis, (4, 1)), inside=inside)
    # the buckle: a frame on the belt at the front, a touch to the wearer's left
    def on_surface_frame(z, phi_front_x, extra):
        r = int(np.argmin(np.abs(zs - z)))
        ph = info['phi_at_x'](r, phi_front_x)
        cands = [ph - 2 * math.pi, ph]
        q = cands[0] if cands[0] >= PH[r, -1] + 0.02 else cands[1]
        p = S.at(z, q); n = S.normal(z, q)
        tx = S.at(z, q + 0.01) - S.at(z, q - 0.01); tx /= np.linalg.norm(tx)
        ty = np.cross(n, tx)
        if ty[2] < 0:
            ty = -ty
        return p + n * extra, n, tx, ty, q
    bx = 0.012
    p, n, tx, ty, _ = on_surface_frame(zbelt, bx, 0.012)
    rect = lambda w, h: [(-w, -h), (w, -h), (w, h), (-w, h)]
    outer, inner = rect(0.028, 0.032), rect(0.019, 0.023)
    Q = np.zeros((2, 4, 3)); UV = np.zeros((2, 4, 2))
    for i, ring in enumerate((outer, inner)):
        for k, (a, b) in enumerate(ring):
            Q[i, k] = p + tx * a + ty * b + n * (0.002 if i else 0.0)
            UV[i, k] = (a, b)
    M.add_grid(Q, UV, 'buckle', 'coat_tl', closed=True, gain=0.32, inside=inside)
    # the belt's tail: on past the buckle toward the wearer's right, a little proud
    Kt = 8
    Q = np.zeros((2, Kt, 3)); UV = np.zeros((2, Kt, 2))
    for k in range(Kt):
        pp, nn, _, _, _ = on_surface_frame(zbelt, bx - 0.02 - 0.11 * k / (Kt - 1), 0.014)
        Q[0, k] = pp - np.array([0, 0, 0.019]); Q[1, k] = pp + np.array([0, 0, 0.019])
        UV[0, k] = (k * 0.016, 0); UV[1, k] = (k * 0.016, 0.038)
    M.add_grid(Q, UV, 'belt', 'coat_tl', gain=0.88, inside=inside)

    # ── buttons: double-breasted, two columns of three above the belt ──
    def disc(z, x, r=0.0105, h=0.0035, seg=12):
        p, n, tx, ty, q = on_surface_frame(z, x, 0.0)
        ring = np.linspace(0, 2 * math.pi, seg, endpoint=False)
        Q = np.zeros((3, seg, 3)); UV = np.zeros((3, seg, 2))
        for k, a in enumerate(ring):
            d = tx * math.cos(a) + ty * math.sin(a)
            Q[0, k] = p + d * r + n * 0.0015
            Q[1, k] = p + d * r + n * h
            Q[2, k] = p + d * r * 0.25 + n * (h + 0.0008)
            UV[:, k] = (a * r, 0)
        M.add_grid(Q, UV, 'button', 'coat_tl', closed=True, gain=0.3, inside=inside)
    for z in (zbelt + 0.05, zbelt + 0.12, zbelt + 0.19):
        for x in (-0.068, 0.068):
            if x < info['xo'](z) + 0.02:
                continue
            disc(z, x)

    # ── epaulettes: a strap on each shoulder from the collar out to the sleeve head ──
    for side in (1, -1):
        phc = (math.pi / 2) * side
        rows = [r for r in range(R) if 1.535 <= zs[r] <= zt - 0.012]
        Q = np.zeros((len(rows), 3, 3)); UV = np.zeros((len(rows), 3, 2))
        for i, r in enumerate(rows[::-1]):
            z = zs[r]
            # the column nearest this side on this row (the sheet's own phi there)
            ph = phc if side > 0 else phc
            q = ph - 2 * math.pi if side > 0 else ph
            for j, dw in enumerate((-0.02, 0.0, 0.02)):
                qq = S.arc_phi(z, q, dw)
                n = S.normal(z, qq)
                Q[i, j] = S.at(z, qq) + n * (0.005 if j == 1 else 0.0035)
                UV[i, j] = (dw, z)
        M.add_grid(Q, UV, 'epaulette', 'coat_tl', gain=0.9, inside=inside)

    # ── pocket flaps: slanted, on each hip ──
    for side in (1, -1):
        Q = np.zeros((3, 6, 3)); UV = np.zeros((3, 6, 2))
        for k in range(6):
            u = k / 5.0
            ph0 = side * (0.62 + 0.42 * u)
            q = ph0 - 2 * math.pi if side > 0 else ph0
            for i, dz in enumerate((0.0, 0.026, 0.05)):
                z = 0.905 + 0.035 * u * 1.0 + dz
                n = S.normal(z, q)
                Q[i, k] = S.at(z, q) + n * (0.0045 if i < 2 else 0.003)
                UV[i, k] = (u * 0.15, dz)
        M.add_grid(Q, UV, 'pocket', 'coat_tl', gain=np.array([[0.55] * 6, [0.95] * 6, [0.9] * 6]), phi=None, inside=inside)

    # ── sleeves: the cuff facing and a strap ──
    for side, (SP, SUV, si) in sleeves.items():
        Ks = SP.shape[1]
        last = SP[-1]
        ctr = last.mean(axis=0)
        frames = si['frames']
        t = frames[-1][1]
        Q = np.zeros((2, Ks, 3)); UV = np.zeros((2, Ks, 2))
        for k in range(Ks):
            radial = last[k] - ctr; radial /= np.linalg.norm(radial)
            Q[0, k] = last[k] - radial * 0.0005
            Q[1, k] = last[k] - t * 0.02 - radial * 0.004
            UV[0, k] = SUV[-1, k]; UV[1, k] = SUV[-1, k] + np.array([0, 0.02])
        M.add_grid(Q, UV, 'facing', 'coat_arm_' + side, closed=True, gain=0.8, inside=lambda p, c=ctr: c)
        ss = si['ss']
        for s_at in (ss[-1] - 0.075,):
            i0 = int(np.argmin(np.abs(ss - s_at)))
            Q = np.zeros((2, Ks, 3)); UV = np.zeros((2, Ks, 2))
            for j, ii in enumerate((i0, i0 + 1)):
                ring = SP[ii]; c = ring.mean(axis=0)
                for k in range(Ks):
                    radial = ring[k] - c; radial /= np.linalg.norm(radial)
                    Q[j, k] = ring[k] + radial * 0.0045
                    UV[j, k] = SUV[ii, k]
            M.add_grid(Q, UV, 'strap', 'coat_arm_' + side, closed=True, gain=0.88, inside=lambda p, c=SP[i0].mean(axis=0): c)
    return dict(zm=zm)


# ═══════════════════════════════ ON EVERY BODY ═══════════════════════════════
def make_human(body):
    HS = M_('services.humanservice', 'HumanService'); TS = M_('services.targetservice', 'TargetService')
    macro = dict(bm.BODIES[body]); macro['race'] = {'asian': 0.33, 'caucasian': 0.33, 'african': 0.33}
    h = HS.create_human(macro_detail_dict=macro); TS.bake_targets(h); HS.add_builtin_rig(h, 'game_engine')
    return h


def body_frame(h):
    """the body's skin (classified), its joints and its knots: [floor, hem, waist, neck, crown] heights + shoulder width"""
    rig = h.parent
    pts = {b.name: np.array(rig.matrix_world @ b.head_local) for b in rig.data.bones}
    co, dom, inbody = classify(h)
    knee, neck, pel = pts['calf_l'][2], pts['neck_01'][2], pts['pelvis'][2]
    sc = (neck - knee) / (1.599 - 0.535)
    torso = np.array([inbody[i] and dom[i] in TORSO_B for i in range(len(co))])
    best = None
    for z in np.arange(pel, pel + 0.2 * sc, 0.004 * sc):          # the waist: the narrowest torso just above the hip joint
        m = torso & (np.abs(co[:, 2] - z) < 0.008 * sc)
        if m.sum() < 10:
            continue
        w = co[m, 0].max() - co[m, 0].min()
        if best is None or w < best[0]:
            best = (w, z)
    K = np.array([0.0, knee - 0.015 * sc, best[1], neck + 0.001 * sc, co[inbody, 2].max()])
    return dict(h=h, pts=pts, co=co, dom=dom, inbody=inbody, K=K, sx=pts['upperarm_l'][0], y0=pts['pelvis'][1])


def _pl(z, a, b):
    """piecewise-linear map of heights from knots a to knots b (linear past the ends)"""
    z = np.asarray(z, float)
    out = np.interp(z, a, b)
    lo, hi = z < a[0], z > a[-1]
    out[lo] = b[0] + (z[lo] - a[0]) * (b[1] - b[0]) / (a[1] - a[0])
    out[hi] = b[-1] + (z[hi] - a[-1]) * (b[-1] - b[-2]) / (a[-1] - a[-2])
    return out


def warp(P, f, m):
    """body f's frame -> the male's (m) frame"""
    k = m['sx'] / f['sx']
    Q = np.array(P, float).copy()
    Q[..., 0] = Q[..., 0] * k
    Q[..., 1] = (Q[..., 1] - f['y0']) * k + m['y0']
    Q[..., 2] = _pl(Q[..., 2], f['K'], m['K'])
    return Q


def unwarp(P, f, m):
    k = f['sx'] / m['sx']
    Q = np.array(P, float).copy()
    Q[..., 0] = Q[..., 0] * k
    Q[..., 1] = (Q[..., 1] - m['y0']) * k + f['y0']
    Q[..., 2] = _pl(Q[..., 2], m['K'], f['K'])
    return Q


def build_coat(f, m):
    """the whole coat on body f, built in the male's frame (same topology on every body) -> (V, F, FUV, T, info, zm)"""
    co = warp(f['co'], f, m)
    pts = {k: warp(v[None], f, m)[0] for k, v in f['pts'].items()}
    P, UV, info = build(co, f['dom'], f['inbody'], pts, dict(belt=m['K'][2], hem=m['K'][1], top=m['K'][3]))
    Msh = Mesh()
    cen, zs = info['cen'], info['zs']
    inside = lambda p: np.array([0.0, float(np.interp(p[2], zs, cen[:, 1])), p[2]])
    Msh.add_grid(P, UV, 'sheet', 'coat_tl', phi=info['PH'], inside=inside)
    sleeves = {}
    for s in ('l', 'r'):
        SP, SUV, si = sleeve(co, f['dom'], f['inbody'], pts, s)
        sleeves[s] = (SP, SUV, si)
        ctr = SP.mean(axis=1)
        Msh.add_grid(SP, SUV, 'sleeve', 'coat_arm_' + s, closed=True,
                     inside=lambda p, SP=SP, ctr=ctr: ctr[int(np.argmin(np.linalg.norm(SP.reshape(-1, 3) - p, axis=1))) // SP.shape[1]])
    dinfo = build_details(Msh, P, info, sleeves, inside)
    V = unwarp(np.array(Msh.V), f, m)
    return V, Msh.F, Msh.FUV, Msh.T, info, dinfo['zm']


def tris(F):
    return np.array([(f[0], f[k], f[k + 1]) for f in F for k in range(1, len(f) - 1)])


def vertex_normals(V, F):
    N = np.zeros_like(V)
    for f in F:
        for k in range(1, len(f) - 1):
            a, b, c = V[f[0]], V[f[k]], V[f[k + 1]]
            n = np.cross(b - a, c - a)
            for j in (f[0], f[k], f[k + 1]):
                N[j] += n
    return N / np.maximum(1e-12, np.linalg.norm(N, axis=1))[:, None]


def skin_weights(f, V, T):
    """per coat vertex {MPFB bone: weight}: the body skin under it (6 nearest of its own part), then THE HANGING SKIRT"""
    h, co, dom, inbody = f['h'], f['co'], f['dom'], f['inbody']
    names = {g.index: g.name for g in h.vertex_groups}
    bones = set(b.name for b in h.parent.data.bones) - {'Root'}
    bw = [dict() for _ in range(len(co))]
    for v in h.data.vertices:
        for g in v.groups:
            n = names[g.group]
            if g.weight > 0 and n in bones:
                bw[v.index][n] = bw[v.index].get(n, 0) + g.weight
    armb = lambda s: ('upperarm_' + s, 'lowerarm_' + s)
    # the body pieces read the torso + legs, and the shoulder caps too (above the armpit), so the shoulders lift with the arms
    zarm = f['K'][3] - 0.16 * ((f['K'][3] - f['K'][1]) / (1.6 - 0.52))
    pools = {'coat_tl': [i for i in range(len(co)) if inbody[i] and (dom[i] in TORSO_B + LEG_B or (dom[i] in armb('l') + armb('r') and co[i, 2] > zarm and abs(co[i, 0]) < 0.24))]}
    for s in ('l', 'r'):
        pools['coat_arm_' + s] = [i for i in range(len(co)) if inbody[i] and dom[i] in armb(s)]
    trees = {}
    for g, idx in pools.items():
        kd = KDTree(len(idx))
        for j, i in enumerate(idx):
            kd.insert(Vector(co[i]), i)
        kd.balance(); trees[g] = kd
    zbelt = f['K'][2]
    sc = (f['K'][3] - f['K'][1]) / (1.6 - 0.52)
    rig = h.parent
    zhip = float(np.mean([(rig.matrix_world @ rig.data.bones[b].head_local)[2] for b in ('thigh_l', 'thigh_r')]))
    W = []
    for i, (part, phi, gain, grp) in enumerate(T):
        acc = {}
        near = trees[grp].find_n(Vector(V[i]), 6)
        for (p, j, d) in near:
            k = 1.0 / max(1e-4, d) ** 2
            for b, w in bw[j].items():
                acc[b] = acc.get(b, 0) + w * k
        tot = sum(acc.values()) or 1
        acc = {b: w / tot for b, w in acc.items()}
        if grp == 'coat_tl' and part not in ('belt', 'buckle', 'button', 'lapel', 'collar', 'epaulette'):
            z = V[i, 2]
            k = float(smoothstep(zhip + 0.02 * sc, zhip - 0.10 * sc, z))       # the skin's own weights down to the hip joints -> the hang below them
            if k > 0:
                s = float(smoothstep(-0.08 * sc, 0.08 * sc, V[i, 0]))     # by where it hangs (left = +x), so the crossed-over fronts move with the leg under them
                r = 0.9
                want = {'pelvis': 1 - r, 'thigh_l': r * s, 'thigh_r': r * (1 - s)}
                out = {b: w * (1 - k) for b, w in acc.items()}
                for b, w in want.items():
                    if w > 0:
                        out[b] = out.get(b, 0) + w * k
                acc = out
        W.append(acc)
    return W


def hidden_skin(f, V, F, zlo=None):
    """hm08 indices of the skin the coat covers: above the belt (or `zlo`: a tucked shirt's hem) and on the arms, covered along
    the normal + 4 tilts in 7 cm"""
    h, co, dom, inbody = f['h'], f['co'], f['dom'], f['inbody']
    bvh = BVHTree.FromPolygons([tuple(v) for v in V], [tuple(x) for x in F])
    arms = ('upperarm_l', 'lowerarm_l', 'upperarm_r', 'lowerarm_r')
    zbelt = f['K'][2]
    sc = (f['K'][3] - f['K'][1]) / (1.6 - 0.52)
    out = []
    for v in h.data.vertices:
        i = v.index
        if not inbody[i] or dom[i] is None:
            continue
        if not (dom[i] in arms or (dom[i] in TORSO_B and (zbelt + 0.03 if zlo is None else zlo) < co[i, 2] < f['K'][3] - 0.015)):
            continue
        n = Vector(v.normal); p = Vector(co[i])
        t1 = n.orthogonal().normalized(); t2 = n.cross(t1)
        hits = [bvh.ray_cast(p + d * 0.001, d, 0.07)[0] is not None
                for d in (n, (n + t1 * 0.6).normalized(), (n - t1 * 0.6).normalized(), (n + t2 * 0.6).normalized(), (n - t2 * 0.6).normalized())]
        # a tilt escapes past the collar's edge on the shoulder tops, under the bust where the coat bridges the hollow
        # and round the armholes, so straight out + any two tilts will do (else the shirt on those same triangles
        # pokes through when the arms lift)
        if zlo is not None and dom[i] in TORSO_B and co[i, 2] < zlo + 0.10:
            out.append(i)   # (a tucked shirt's hem hugs the waist inside the skin's own hollows: the whole band is under it)
            continue
        need = 2
        if hits[0] and sum(hits[1:]) >= need:
            out.append(i)
    rng = []
    for i in sorted(out):
        if rng and rng[-1][1] == i - 1:
            rng[-1][1] = i
        else:
            rng.append([i, i])
    return rng


def shade(f, V, F, T):
    """ambient occlusion (body + coat, 24 rays, 12 cm) x each piece's own shade"""
    h, co, inbody = f['h'], f['co'], f['inbody']
    bi = set(np.nonzero(inbody)[0].tolist())
    BF = [tuple(p.vertices) for p in h.data.polygons if all(v in bi for v in p.vertices)]
    nb = len(co)
    bvh = BVHTree.FromPolygons([tuple(x) for x in co] + [tuple(x) for x in V], BF + [tuple(j + nb for j in x) for x in F])
    N = vertex_normals(V, F)
    dirs = np.random.default_rng(7).normal(size=(24, 3))
    dirs /= np.linalg.norm(dirs, axis=1)[:, None]
    G = np.empty(len(V))
    for i in range(len(V)):
        occ = tot = 0.0
        for d in dirs:
            c = float(np.dot(d, N[i]))
            if abs(c) < 0.05:
                continue
            dd = d if c > 0 else -d
            occ += abs(c) * (bvh.ray_cast(Vector(V[i] + dd * 0.003), Vector(dd), 0.12)[0] is not None)
            tot += abs(c)
        G[i] = (1.0 - 0.5 * occ / max(1e-9, tot)) * T[i][2]
    return G


def write_glb(path, Ps, F, FUV, W, G, wear):
    """the pack clothes' compact layout (bake-mpfb.py write_wear_glb) + _G; vertices split at UV seams"""
    gl = lambda c: np.stack([c[:, 0], c[:, 2], -c[:, 1]], axis=1)
    N = vertex_normals(Ps['male'], F)
    verts, key_of, idx = [], {}, []
    for f, fu in zip(F, FUV):
        corner = []
        for vi, u in zip(f, fu):
            k = (vi, round(float(u[0]), 5), round(float(u[1]), 5))
            j = key_of.get(k)
            if j is None:
                j = key_of[k] = len(verts); verts.append((vi, (float(u[0]), float(u[1]))))
            corner.append(j)
        for k in range(1, len(corner) - 1):
            idx += [corner[0], corner[k], corner[k + 1]]
    vsel = np.array([v[0] for v in verts])
    P = {b: gl(Ps[b])[vsel] for b in Ps}
    Nn = gl(N[vsel])
    UV = np.array([v[1] for v in verts])
    bones, bix = [], {}
    J = np.zeros((len(verts), 4), np.uint8); Wt = np.zeros((len(verts), 4), np.float32)
    for k, vi in enumerate(vsel):
        top = sorted(((bm.BONE_MAP.get(a, a), w) for a, w in W[vi].items()), key=lambda x: -x[1])[:4] or [('Hips', 1.0)]
        tot = sum(w for _, w in top) or 1
        for s_, (bn, w) in enumerate(top):
            if bn not in bix:
                bix[bn] = len(bones); bones.append(bn)
            J[k, s_] = bix[bn]; Wt[k, s_] = w / tot
    chunks, views, accs = [], [], []
    def add(data):
        off = sum(len(c) for c in chunks); chunks.append(data + b'\0' * ((-len(data)) % 4))
        views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}); return len(views) - 1
    def acc(arr, comp, typ, minmax=False):
        a = {'bufferView': add(np.ascontiguousarray(arr).tobytes()), 'componentType': comp, 'count': int(arr.shape[0]), 'type': typ}
        if minmax:
            a['min'] = [float(x) for x in arr.min(axis=0)]; a['max'] = [float(x) for x in arr.max(axis=0)]
        accs.append(a); return len(accs) - 1
    wq = np.round(Wt * 255).astype(np.int32); wq[:, 0] += 255 - wq.sum(axis=1)
    attrs = {'POSITION': acc(P['male'].astype(np.float32), 5126, 'VEC3', True),
             'TEXCOORD_0': acc(UV.astype(np.float32), 5126, 'VEC2'),
             '_N': acc(np.clip(np.round(Nn * 127), -127, 127).astype(np.int8), 5120, 'VEC3'),
             '_J': acc(J, 5121, 'VEC4'),
             '_W': acc(np.clip(wq, 0, 255).astype(np.uint8), 5121, 'VEC4'),
             '_G': acc(np.clip(np.round(G[vsel] * 255), 0, 255).astype(np.uint8).reshape(-1, 1), 5121, 'SCALAR')}
    for b in bm.WEAR_BODIES:
        if b != 'male':
            attrs['_D_' + b.upper()] = acc(np.clip(np.round((P[b] - P['male']) / bm.WEAR_DQ), -32767, 32767).astype(np.int16), 5122, 'VEC3')
    idx = np.array(idx)
    small = len(vsel) < 65536
    ai = acc(idx.astype(np.uint16 if small else np.uint32), 5123 if small else 5125, 'SCALAR')
    name = wear['name']
    g = {'asset': {'version': '2.0', 'generator': 'bake-garment.py (Entropy Wars, cloud Blender)'}, 'scene': 0, 'scenes': [{'nodes': [0]}],
         'nodes': [{'name': name, 'mesh': 0, 'extras': {'ewWear': dict(wear, bones=bones, dq=bm.WEAR_DQ)}}],
         'meshes': [{'name': name, 'primitives': [{'attributes': attrs, 'indices': ai, 'material': 0}]}],
         'materials': [{'name': name, 'doubleSided': True, 'pbrMetallicRoughness': {'metallicFactor': 0, 'roughnessFactor': 0.9,
                                                                                    'baseColorFactor': [0.69, 0.55, 0.36, 1.0]}}],
         'accessors': accs, 'bufferViews': views}
    binb = b''.join(chunks); g['buffers'] = [{'byteLength': len(binb)}]
    js = json.dumps(g, separators=(',', ':')).encode(); js += b' ' * ((-len(js)) % 4)
    with open(path, 'wb') as fh:
        fh.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binb)))
        fh.write(struct.pack('<II', len(js), 0x4E4F534A)); fh.write(js)
        fh.write(struct.pack('<II', len(binb), 0x004E4942)); fh.write(binb)
    return len(idx) // 3, bones


def write_view(path, f, V, F, G):
    """a plain GLB (body + coat, the shade as vertex colour) to look at"""
    co, inbody = f['co'], f['inbody']
    bi = set(np.nonzero(inbody)[0].tolist())
    BF = [tuple(p.vertices) for p in f['h'].data.polygons if all(v in bi for v in p.vertices)]
    chunks, views, accs, meshes, mats = [], [], [], [], []
    def add(data):
        off = sum(len(c) for c in chunks); chunks.append(data + b'\0' * ((-len(data)) % 4))
        views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}); return len(views) - 1
    def acc(arr, comp, typ, mm=False):
        a = {'bufferView': add(np.ascontiguousarray(arr).tobytes()), 'componentType': comp, 'count': int(arr.shape[0]), 'type': typ}
        if mm:
            a['min'] = [float(x) for x in arr.min(0)]; a['max'] = [float(x) for x in arr.max(0)]
        accs.append(a); return len(accs) - 1
    for i, (name, P, Fs, col) in enumerate((('body', co, BF, None), ('coat', V, F, np.stack([G] * 3, 1) * np.array([0.69, 0.55, 0.36])))):
        at = {'POSITION': acc(np.stack([P[:, 0], P[:, 2], -P[:, 1]], 1).astype(np.float32), 5126, 'VEC3', True)}
        if col is not None:
            at['COLOR_0'] = acc(col.astype(np.float32), 5126, 'VEC3')
        mats.append({'pbrMetallicRoughness': {'baseColorFactor': [0.8, 0.62, 0.5, 1] if i == 0 else [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': 0.85}, 'doubleSided': True})
        meshes.append({'name': name, 'primitives': [{'attributes': at, 'indices': acc(tris(Fs).astype(np.uint32).reshape(-1), 5125, 'SCALAR'), 'material': i}]})
    g = {'asset': {'version': '2.0'}, 'scene': 0, 'scenes': [{'nodes': [0, 1]}], 'nodes': [{'name': 'body', 'mesh': 0}, {'name': 'coat', 'mesh': 1}],
         'meshes': meshes, 'materials': mats, 'accessors': accs, 'bufferViews': views}
    binb = b''.join(chunks); g['buffers'] = [{'byteLength': len(binb)}]
    js = json.dumps(g).encode(); js += b' ' * ((-len(js)) % 4)
    with open(path, 'wb') as fh:
        fh.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binb)))
        fh.write(struct.pack('<II', len(js), 0x4E4F534A)); fh.write(js)
        fh.write(struct.pack('<II', len(binb), 0x004E4942)); fh.write(binb)


M_ = None


def main():
    global M_
    ap = argparse.ArgumentParser()
    ap.add_argument('--mpfb', required=True, help='MPFB2 git checkout')
    ap.add_argument('--out', default=os.path.join(HERE, 'charactercreation', 'wear'))
    ap.add_argument('--views', default='', help='also write <body>.glb (body + coat) here to look at')
    a = ap.parse_args()
    M_ = bm.install_mpfb(a.mpfb)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = {b: body_frame(make_human(b)) for b in bm.WEAR_BODIES}
    m = frames['male']
    builds = {b: build_coat(frames[b], m) for b in bm.WEAR_BODIES}
    V, F, FUV, T, info, zm = builds['male']
    for b, (Vb, Fb, *_r) in builds.items():
        assert len(Vb) == len(V) and len(Fb) == len(F), 'topology differs on ' + b
    W = skin_weights(m, V, T)
    dl = hidden_skin(m, V, F)
    G = shade(m, V, F, T)
    os.makedirs(a.out, exist_ok=True)
    wear = {'name': 'ewb_trench', 'pack': 'entropywars', 'cat': 'outer', 'z': 70, 'del': dl, 'outer': 'trench', 'uv': 'm'}
    path = os.path.join(a.out, 'ewb_trench.glb')
    ntri, bones = write_glb(path, {b: builds[b][0] for b in builds}, F, FUV, W, G, wear)
    print('[bake-garment] %s  %d tris  %d KB  hides %d skin verts  bones %s' % (path, ntri, os.path.getsize(path) // 1024,
                                                                         sum(r[1] - r[0] + 1 for r in dl), ','.join(bones)))
    if a.views:
        os.makedirs(a.views, exist_ok=True)
        for b in builds:
            write_view(os.path.join(a.views, 'coat_%s.glb' % b), frames[b], builds[b][0], F, G)


if __name__ == '__main__':
    main()
