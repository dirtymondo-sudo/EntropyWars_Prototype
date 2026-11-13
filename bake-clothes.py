#!/usr/bin/env python3
"""bake-clothes.py - THE BLENDER CLOTHES (2026-11-01, docs/notes/character-models-plan.md row 12, list 4d; repo-only tooling).

mondo (11-01): the soft clothes the MakeHuman packs don't have (capes, cloaks, long coats, robes, uniforms, costume pieces)
are built in cloud Blender as REAL garments fitted to the MPFB bodies, not the classic shell pushed out from the skin. The
pilot (bake-garment.py, the Blender trench coat) set the method; this tool reuses its helpers and builds the rest of the
list the same way:

  * PATTERN PIECES round a hanging axis, not a skin copy: each row's outline is the body's cross-section there (the arms
    left out, the shoulder caps kept), its CONVEX HULL + the garment's ease (cloth bridges the spine groove, the small of
    the back, the gap between the legs); below a hang height every column falls like a curtain from the widest row above
    it and flares to the hem (THE HANG), with soft folds growing toward the hem. Each column is resampled by arc length
    (rows run evenly over the shoulder slope). Hems and front edges are turned (a facing row inside: the cloth's
    thickness); collars, mantles, hoods, clasps, brooches and trims are their own pieces.
  * BUILT ON EVERY BODY (bake-garment.py warp / unwarp): each of the five MPFB bodies is warped into the male's
    proportions, the garment is built there with the SAME rows and columns, then warped back, so the GLB is the male
    build + the other four's offsets (the pack clothes' COMPACT LAYOUT, three-renderer.js buildWear). The two MPFB
    CLASSIC bodies wear the source body's fit moved by the reshape (_fit_d), like every pack garment.
  * THE WEIGHTS: the rows that lie on the body take the body's weights under them (the 6 nearest skin vertices of the
    torso + collarbones + neck); the hanging part rides SPRING CHAINS (THE SWAY, PR #724): ewWear.sway = the bone the
    chains hang on + each chain's joints as garment vertex indices; the hanging vertices are weighted onto the two
    nearest chains by angle and onto the segment by height, faded in from the body weights below the anchor row.
    three-renderer.js THE BLENDER CAPES makes the chain bones from those vertices on each body and the cape spring swings
    them (pushed out of the torso / thigh capsules).
  * THE LOOK: the main cloth is painted by its creator layer's own fabric / tint / print (UVs in metres, `uv: 'm'`, like
    the pilot); `own` pieces (the leaf cloak, the fur cloak) carry their own tile from the game's R2 terrain sheets (fur,
    leaves) tinted by the layer colour; ACCENTS (clasps, brooches, fur trims, gold) are fixed-colour triangle groups
    (ewWear.accents, an accent may carry a tile too). Shade = the pilot's ambient occlusion (_G). Nothing is generated or
    downloaded: every tile is a sheet already in the game.

Usage:
  pip install bpy==5.2.3 scipy ; git clone --depth 1 https://github.com/makehumancommunity/mpfb2 /tmp/mpfb2
  python3 -I bake-clothes.py --mpfb /tmp/mpfb2 [--only bcape_king,...] [--out charactercreation/wear] [--views DIR] [--tiles DIR]
  (--tiles: a folder holding the R2 terrain tiles fur.png / leaves.png ... ; default: fetched from cdn.entropywars.net)
Output: <out>/ewb_<name>.glb (R2 Assets/characters/creator/wear/). Notes: docs/notes/models-assets.md "THE BLENDER CLOTHES".
"""
import argparse, importlib.util, io, json, math, os, struct, sys, urllib.request

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_pg = os.environ.get('EW_BAKE_GARMENT') or os.path.join(HERE, 'bake-garment.py')
_spec = importlib.util.spec_from_file_location('bake_garment', _pg)
PG = importlib.util.module_from_spec(_spec)
_argv, sys.argv = sys.argv, [sys.argv[0]]
_spec.loader.exec_module(PG)            # (+ bake-mpfb.py as PG.bm)
sys.argv = _argv
bm = PG.bm
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402
from mathutils.kdtree import KDTree  # noqa: E402

smoothstep, dirv, hull2d, minkowski, ray_poly = PG.smoothstep, PG.dirv, PG.hull2d, PG.minkowski, PG.ray_poly
TORSO_B, LEG_B = PG.TORSO_B, PG.LEG_B
TAU = 2 * math.pi
R2_TILES = 'https://cdn.entropywars.net/Assets/world/terrain/'


# ═══════════════════════════════ THE FIELD: the body's eased hull round a hanging axis ═══════════════════════════════
def ray_polys(H, c, D):
    """distance from c along each unit row of D (K,2) to the convex polygon H (vectorised ray_poly)"""
    A = H; B = np.roll(H, -1, axis=0); E = B - A; Wv = A - c                      # (E,2)
    den = D[:, None, 0] * (-E[None, :, 1]) - D[:, None, 1] * (-E[None, :, 0])    # (K,E)
    with np.errstate(divide='ignore', invalid='ignore'):
        t = (Wv[None, :, 0] * (-E[None, :, 1]) - Wv[None, :, 1] * (-E[None, :, 0])) / den
        u = (D[:, None, 0] * Wv[None, :, 1] - D[:, None, 1] * Wv[None, :, 0]) / den
    ok = (np.abs(den) > 1e-12) & (t > 0) & (u >= -1e-9) & (u <= 1 + 1e-9)
    t = np.where(ok, t, np.inf)
    r = t.min(axis=1)
    r[~np.isfinite(r)] = 0.0
    return r


class Field:
    """r(z, phi) of the body's hull + ease round an axis that follows the body above `z_axis` and is held below it;
    below `z_hang` every angle hangs from the widest row above (+ `flare` metres per metre of drop)"""
    NA = 360

    def __init__(self, co, dom, inbody, z0, z1, ease, z_hang=None, flare=0.0, z_axis=1.36, dz=0.006, armx=0.24, legs=True, hang_lift=None, round_sh=0,
                 drape=None, side_in=0.0, sh_top=1.62, arm_z=1.40):
        torso = np.array([inbody[i] and dom[i] in TORSO_B for i in range(len(co))])
        leg = np.array([inbody[i] and dom[i] in LEG_B for i in range(len(co))])
        armtop = np.array([inbody[i] and dom[i] is not None and dom[i].startswith('upperarm') for i in range(len(co))]) & (np.abs(co[:, 0]) < armx)
        head = np.array([inbody[i] and dom[i] == 'head' for i in range(len(co))])
        zs = np.arange(z0, z1 + dz * 0.5, dz)
        self.zs = zs
        ang = np.linspace(-math.pi, math.pi, self.NA, endpoint=False)
        self.ang = ang
        D = np.stack([np.sin(ang), -np.cos(ang)], 1)
        cen = np.zeros((len(zs), 2)); hulls = []
        for r, z in enumerate(zs):
            band = 0.02 if z > 1.42 else 0.014
            sel = ((torso | leg) if (z < 1.3 and legs) else torso) & (np.abs(co[:, 2] - z) < band)
            if z > arm_z:
                sel |= armtop & (np.abs(co[:, 2] - z) < band)
            if z > 1.62:
                sel |= head & (np.abs(co[:, 2] - z) < band)
            P2 = co[sel][:, :2]
            if len(P2) < 4:
                P2 = np.array([[0.05 * math.cos(a), 0.05 * math.sin(a)] for a in np.linspace(0, TAU, 8, endpoint=False)])
            hulls.append(hull2d(P2))
            cen[r] = [0.0, 0.5 * (P2[:, 1].min() + P2[:, 1].max())]
        # THE DRAPE (2026-11-05, mondo: "the capes ... dont connect to the body properly, they are way too wide"): above `drape`
        # a row is not the hull of a 2-4 cm slab (at the neckline that slab already holds the shoulder tops, so the cape's top
        # sat out on the shoulder tips with a gap all round the neck) but the hull of EVERYTHING above it: cloth laid over the
        # body from above, so the top row hugs the neck and the rows under it lie on the shoulder slope down to the tips
        if drape is not None:
            cum = None
            for r in range(len(zs) - 1, -1, -1):
                z = zs[r]
                if z < drape:
                    break
                thin = (torso | (armtop if z > arm_z else False)) & (co[:, 2] >= z - 0.003) & (co[:, 2] < z + dz + 0.003)
                Pn = co[thin][:, :2]
                cum = Pn if cum is None else np.vstack([cum, Pn])
                if len(cum) >= 3:
                    cum = hull2d(cum)
                    hulls[r] = cum
        for _ in range(8):
            cen[1:-1, 1] = 0.25 * cen[:-2, 1] + 0.5 * cen[1:-1, 1] + 0.25 * cen[2:, 1]
        ia = int(np.argmin(np.abs(zs - z_axis)))
        cen[:ia, 1] = cen[ia, 1]
        self.cen = cen
        rad = np.zeros((len(zs), self.NA)); radh = np.zeros_like(rad)
        for r, z in enumerate(zs):
            e = ease(z) if callable(ease) else ease
            rad[r] = ray_polys(minkowski(hulls[r], e), cen[r], D)
            radh[r] = ray_polys(hulls[r], cen[r], D)
        for _ in range(4):
            sm = rad.copy(); sm[1:-1] = 0.25 * rad[:-2] + 0.5 * rad[1:-1] + 0.25 * rad[2:]
            rad = np.maximum(sm, radh + 0.01)
        for _ in range(2):                                         # round the angles a touch (no hull corners)
            rad = np.maximum(0.25 * np.roll(rad, 1, 1) + 0.5 * rad + 0.25 * np.roll(rad, -1, 1), radh + 0.008)
        # THE SHOULDER ROLL: cloth over the shoulder tip rounds it (no square corner where the shoulder line meets the hang)
        sh = (zs > 1.30) & (zs < sh_top)
        for _ in range(round_sh):
            sm = rad.copy(); sm[1:-1] = 0.25 * rad[:-2] + 0.5 * rad[1:-1] + 0.25 * rad[2:]
            rad[sh] = np.maximum(sm[sh], radh[sh] + 0.01)
        if z_hang is not None:
            ih = int(np.argmin(np.abs(zs - z_hang)))
            # (THE DRAPE: `side_in` metres per metre - the sides hang in toward the body as they fall, the back keeps its flare)
            fl = flare - side_in * np.sin(ang) ** 2
            for r in range(ih - 1, -1, -1):
                rad[r] = np.maximum(rad[r], rad[r + 1] + fl * (zs[r + 1] - zs[r]))
        self.rad = rad

    def r(self, z, phi):
        z = np.clip(z, self.zs[0], self.zs[-1])
        fz = (z - self.zs[0]) / (self.zs[1] - self.zs[0]); i0 = np.clip(np.floor(fz).astype(int), 0, len(self.zs) - 2); tz = fz - i0
        a = (np.asarray(phi) + math.pi) % TAU
        fa = a / TAU * self.NA; j0 = np.floor(fa).astype(int) % self.NA; ta = fa - np.floor(fa); j1 = (j0 + 1) % self.NA
        R = self.rad
        return ((R[i0, j0] * (1 - ta) + R[i0, j1] * ta) * (1 - tz) + (R[i0 + 1, j0] * (1 - ta) + R[i0 + 1, j1] * ta) * tz)

    def cy(self, z):
        return np.interp(z, self.zs, self.cen[:, 1])

    def at(self, z, phi, extra=0.0):
        z = np.asarray(z, float); phi = np.asarray(phi, float)
        rr = self.r(z, phi) + extra
        return np.stack([rr * np.sin(phi), self.cy(z) - rr * np.cos(phi), z], -1)


# ═══════════════════════════════ THE MESH: pieces + per-vertex tags ═══════════════════════════════
class Garment(PG.Mesh):
    """PG.Mesh (V, F, FUV, T=(part, phi, gain, group)) + an accent per vertex + the sway chains"""
    def __init__(self):
        super().__init__()
        self.A = []
        self.chains = []
        self.solids = []

    def grid(self, P, UV, part, group, accent=0, closed=False, gain=1.0, phi=None, flip=False, inside=None):
        off = self.add_grid(P, UV, part, group, closed=closed, gain=gain, phi=phi, flip=flip, inside=inside)
        self.A += [accent] * (len(self.V) - len(self.A))
        return off


def lerp(a, b, t):
    return a + (b - a) * t


def col_resample(pts, n, power=1.0):
    """n points along a polyline by arc length (power > 1 packs them toward the start)"""
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = (np.linspace(0, 1, n) ** power) * s[-1]
    return np.stack([np.interp(t, s, pts[:, k]) for k in range(3)], 1), t


def surface_normal(Pgrid, r, c):
    R, C = Pgrid.shape[:2]
    a = Pgrid[min(r + 1, R - 1), c] - Pgrid[max(r - 1, 0), c]
    b = Pgrid[r, min(c + 1, C - 1)] - Pgrid[r, max(c - 1, 0)]
    n = np.cross(b, a)
    return n / max(1e-9, np.linalg.norm(n))


def outward(n, p, axis_y):
    """flip n to point away from the vertical axis (x=0, y=axis_y)"""
    d = np.array([p[0], p[1] - axis_y, 0.0])
    return n if np.dot(n, d) >= 0 else -n


# ═══════════════════════════════ THE CAPE ═══════════════════════════════
CAPES = {}


def cape_sheet(G, co, dom, inbody, o):
    """the cape: columns across the back from the left front edge (phi = e) round to the right one (phi = 2pi - e),
    rows from the neckline over the shoulders down to the hem; returns the grid + the field"""
    z_top, hem = o['top'], o['hem']
    # THE DRAPE (2026-11-05): the whole shoulder cap counts (armx 0.30 above arm_z: held to 0.22 the cape cut through the deltoid
    # and the shirt's shoulder came out through it), the cloth stands a little further off over the shoulders (sh_ease: a
    # shirt's shoulder seam sits proud of the skin there), and below the shoulders the sides fall in toward the body
    # (side_in) instead of hanging straight down from the shoulder tips like a box
    e0, she = o.get('ease', 0.026), o.get('sh_ease', 0.003)
    ease = lambda z: e0 + she * float(smoothstep(1.38, 1.46, z) * (1 - smoothstep(1.56, 1.60, z)))
    F = Field(co, dom, inbody, max(0.02, hem - 0.15), z_top + 0.04, ease, z_hang=o.get('hang', 1.42),
              flare=o.get('flare', 0.07), z_axis=1.38, legs=True, round_sh=o.get('round_sh', 14), armx=o.get('armx', 0.30),
              drape=o.get('drape', o.get('hang', 1.42)), side_in=o.get('side_in', 0.25), sh_top=o.get('sh_top', 1.50), arm_z=o.get('arm_z', 1.44))
    C, R = o.get('cols', 48), o.get('rows', 44)
    e_top, e_bot = o.get('e_top', 0.55), o.get('e_bot', 1.25)
    z_arm = 1.36
    s = np.linspace(0, 1, C)
    P = np.zeros((R, C, 3)); UV = np.zeros((R, C, 2)); PH = np.zeros((R, C)); Z = np.zeros((R, C))
    for c in range(C):
        # the column, densely: z from its top down to its hem
        frac0 = abs(s[c] - 0.5) * 2                                        # 0 = the back centre, 1 = a front edge
        zt = z_top - o.get('top_drop', 0.05) * frac0 ** 2
        if o.get('neck', True):
            # THE NECKLINE (2026-11-05): the column starts where the cloth laid over the body first stands `neck_gap` off the
            # neck (the field's top row is the bare neck + ease), so the cape's top edge rings the base of the neck on every
            # body instead of a fixed height that, off the back centre, already lay out on the shoulder tops
            ph0 = e_top + (TAU - 2 * e_top) * s[c]
            zq = np.arange(F.zs[-1], z_top - 0.12, -0.002)
            rq = F.r(zq, np.full_like(zq, ph0))
            over = np.nonzero(rq > rq[0] + o.get('neck_gap', 0.02))[0]
            zn = float(zq[max(0, over[0] - 1)]) if len(over) else float(zq[-1])
            zt = min(max(zn, zt), z_top + o.get('neck_up', 0.03))   # (the back of the neck falls straight into the back: there the old height holds)
            if os.environ.get('EW_CAPE_DEBUG') and c % 6 == 0:
                print('  neck col %2d phi %.2f zt %.3f r %.3f' % (c, ph0, zt, float(F.r(np.array(zt), np.array(ph0)))))
        zh = hem + o.get('hem_rise', 0.10) * frac0 ** 2.2
        if o.get('ragged'):
            zh += o['ragged'] * (0.5 + 0.5 * math.cos(c * 2.0943951)) * (0.4 + 0.6 * ((c * 7919) % 13) / 12.0)
        zz = np.linspace(zt, zh, 240)
        e = e_bot + (e_top - e_bot) * smoothstep(z_arm, z_top, zz)
        ph = e + (TAU - 2 * e) * s[c]
        fold = o.get('folds', 0.012) * smoothstep(o.get('hang', 1.42), hem, zz) * np.cos(ph * o.get('fold_n', 9))
        pts = F.at(zz, ph, fold)
        Q, arc = col_resample(pts, R, o.get('row_pow', 1.0))
        P[:, c] = Q
        PH[:, c] = np.interp(arc, np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]), ph)
        Z[:, c] = Q[:, 2]
        UV[:, c, 1] = -arc
    for r in range(R):
        seg = np.linalg.norm(np.diff(P[r], axis=0), axis=1)
        u = np.concatenate([[0], np.cumsum(seg)])
        UV[r, :, 0] = u - u[C // 2]
    axis = lambda p: np.array([0.0, float(F.cy(p[2])), p[2]])
    G.grid(P, UV, 'cape', 'cape', accent=0, phi=PH, inside=axis)
    return P, PH, F, axis


def turned_edge(G, pts, inward, nrm, part, group, accent=0, width=0.022, depth=0.004, gain=0.8, phi=None, axis=None):
    """the cloth turned in at an edge: a facing strip from the edge `width` along `inward`, `depth` behind the cloth"""
    K = len(pts)
    Q = np.zeros((2, K, 3)); UV = np.zeros((2, K, 2))
    for k in range(K):
        Q[0, k] = pts[k] - nrm[k] * 0.0006
        Q[1, k] = pts[k] + inward[k] * width - nrm[k] * depth
    sarc = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Q[0], axis=0), axis=1))])
    UV[0, :, 0] = sarc; UV[1, :, 0] = sarc; UV[1, :, 1] = width
    G.grid(Q, UV, part, group, accent=accent, gain=gain, phi=None if phi is None else np.tile(phi, (2, 1)), inside=axis)


def cape_edges(G, P, PH, axis, o):
    R, C = P.shape[:2]
    N = np.array([[outward(surface_normal(P, r, c), P[r, c], axis(P[r, c])[1]) for c in range(C)] for r in range(R)])
    # the hem
    up = P[R - 2] - P[R - 1]; up /= np.linalg.norm(up, axis=1)[:, None]
    turned_edge(G, P[R - 1], up, N[R - 1], 'facing', 'cape', width=o.get('hem_w', 0.03), phi=PH[R - 1], axis=axis)
    # the two front edges, below the top
    for c, sg in ((0, 1), (C - 1, -1)):
        rows = list(range(2, R))
        inw = P[rows, c + sg] - P[rows, c]; inw /= np.linalg.norm(inw, axis=1)[:, None]
        turned_edge(G, P[rows, c], inw, N[rows, c], 'facing', 'cape', width=0.025, phi=PH[rows, c], axis=axis)
    return N


def tube(G, path, radius, part, group, accent=0, seg=10, gain=1.0, phi=None, closed_path=False, bump=0.0, axis=None, uvk=1.0):
    """a tube along a path (K,3): a rolled mantle, a fur trim, a chain"""
    K = len(path)
    T = np.gradient(path, axis=0)
    T /= np.maximum(1e-9, np.linalg.norm(T, axis=1))[:, None]
    up = np.array([0, 0, 1.0])
    Q = np.zeros((K, seg, 3)); UV = np.zeros((K, seg, 2))
    ring = np.linspace(0, TAU, seg, endpoint=False)
    sarc = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(path, axis=0), axis=1))])
    rng = np.random.default_rng(11)
    noise = rng.normal(size=(K, seg)) * bump
    for k in range(K):
        n = np.cross(T[k], up)
        if np.linalg.norm(n) < 1e-6:
            n = np.array([1.0, 0, 0])
        n /= np.linalg.norm(n); b = np.cross(T[k], n)
        rk = radius[k] if np.ndim(radius) else radius
        for j, a in enumerate(ring):
            Q[k, j] = path[k] + (n * math.cos(a) + b * math.sin(a)) * rk * (1 + noise[k, j])
            UV[k, j] = (sarc[k] * uvk, a * rk * uvk)
    G.grid(Q, UV, part, group, accent=accent, closed=True, gain=gain, phi=None if phi is None else np.tile(np.asarray(phi)[:, None], (1, seg)))
    return Q


def disc(G, p, n, r, part, group, accent, h=0.004, seg=14, gain=0.9, tx=None):
    if hasattr(G, 'solids'):
        G.solids.append((len(G.V), len(G.V) + 4 * seg, np.array(p, float)))   # (one piece: one set of weights)
    n = n / np.linalg.norm(n)
    tx = tx if tx is not None else np.cross(n, [0, 0, 1.0])
    if np.linalg.norm(tx) < 1e-6:
        tx = np.array([1.0, 0, 0])
    tx = tx / np.linalg.norm(tx); ty = np.cross(n, tx)
    ring = np.linspace(0, TAU, seg, endpoint=False)
    Q = np.zeros((4, seg, 3)); UV = np.zeros((4, seg, 2))
    for k, a in enumerate(ring):
        d = tx * math.cos(a) + ty * math.sin(a)
        Q[0, k] = p + d * r * 1.02 - n * 0.001
        Q[1, k] = p + d * r + n * h * 0.6
        Q[2, k] = p + d * r * 0.7 + n * h
        Q[3, k] = p + d * r * 0.08 + n * h * 1.2
        UV[:, k] = (a * r, 0); UV[1:, k, 1] = (0.004, 0.008, 0.012)
    G.grid(Q, UV, part, group, accent=accent, closed=True, gain=gain)


def collar_profile(G, P, PH, N, axis, prof, part, accent=0, group='cape', taper=6.0, rows=0, scale_fn=None, gain=0.95):
    """a piece standing / folding from the top row: prof = [(up, out)...] in metres, each column scaled at the ends"""
    C = P.shape[1]
    top = P[rows]
    Q = np.zeros((len(prof), C, 3)); UV = np.zeros((len(prof), C, 2))
    for c in range(C):
        n = N[rows, c].copy(); n[2] = 0; n /= max(1e-9, np.linalg.norm(n))
        endk = min(c, C - 1 - c) / taper
        sc = (0.35 + 0.65 * min(1.0, endk)) * (scale_fn(c / (C - 1)) if scale_fn else 1.0)
        for i, (up, out) in enumerate(prof):
            Q[i, c] = top[c] + np.array([0, 0, up * sc]) + n * out * (0.6 + 0.4 * sc)
            UV[i, c, 1] = i * 0.02
    sarc = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Q[len(prof) // 2], axis=0), axis=1))])
    UV[:, :, 0] = sarc[None]
    G.grid(Q, UV, part, group, accent=accent, gain=gain, phi=np.tile(PH[rows], (len(prof), 1)), inside=axis)


def cape_chains(G, P, PH, o, off):
    """THE SWAY: chain columns across the back, joints from the anchor row down to the hem (garment vertex indices)"""
    R, C = P.shape[:2]
    nc = o.get('chains', 7)
    cols = np.round(np.linspace(C * 0.12, C * 0.88, nc)).astype(int)
    za = o.get('anchor', 1.40)
    chains = []
    for c in cols:
        r0 = int(np.argmin(np.abs(P[:, c, 2] - za)))
        js = np.round(np.linspace(r0, R - 1, o.get('joints', 5))).astype(int)
        chains.append([int(off + r * C + c) for r in js])
    G.chains = chains
    G.chain_parent = o.get('parent', 'spine_03')
    G.anchor_z = za


def build_cape(name, co, dom, inbody, pts, o):
    G = Garment()
    P, PH, F, axis = cape_sheet(G, co, dom, inbody, o)
    off = 0
    N = cape_edges(G, P, PH, axis, o)
    cape_chains(G, P, PH, o, off)
    for extra in o.get('extras', []):
        extra(G, P, PH, N, F, axis, pts, o)
    return G


# ── the cape extras ──
def x_clasp(accent=1, r=0.022, chain=True):
    def f(G, P, PH, N, F, axis, pts, o):
        C = P.shape[1]
        ends = []
        for c in (1, C - 2):
            rr = 2
            p, n = P[rr, c], N[rr, c]
            disc(G, p + n * 0.004, n, r, 'clasp', 'cape_top', accent, h=0.006)
            ends.append((p + n * 0.008, PH[rr, c]))
        if chain:
            z = 0.5 * (ends[0][0][2] + ends[1][0][2]) - 0.02
            phis = np.linspace(ends[0][1], -(TAU - ends[1][1]), 24)
            path = F.at(np.full(24, z) - 0.035 * np.sin(np.linspace(0, math.pi, 24)), phis, 0.006)
            path[0] = ends[0][0]; path[-1] = ends[1][0]
            tube(G, path, 0.0035, 'chain', 'cape_top', accent, seg=6, gain=0.85)
    return f


def x_fur_mantle(accent=1, radius=0.045, bump=0.12, rows=3):
    def f(G, P, PH, N, F, axis, pts, o):
        C = P.shape[1]
        path = np.array([P[rows, c] + N[rows, c] * radius * 0.7 for c in range(C)])
        rad = radius * (0.55 + 0.45 * np.sin(np.linspace(0, math.pi, C)) ** 0.5)
        tube(G, path, rad, 'fur', 'cape_top', accent, seg=12, bump=bump, phi=PH[rows], uvk=1.0)
    return f


def x_fur_hem(accent=1, radius=0.03, bump=0.15):
    def f(G, P, PH, N, F, axis, pts, o):
        R, C = P.shape[:2]
        path = np.concatenate([P[R - 1][::-1] + N[R - 1][::-1] * radius * 0.5])
        tube(G, path, radius, 'fur', 'cape', accent, seg=10, bump=bump, phi=PH[R - 1][::-1])
    return f


def x_stand_collar(height=0.20, flare=0.08, accent=0):
    def f(G, P, PH, N, F, axis, pts, o):
        prof = [(-0.004, 0.0), (height * 0.3, flare * 0.15), (height * 0.65, flare * 0.5), (height, flare), (height * 1.02, flare * 1.08)]
        collar_profile(G, P, PH, N, axis, prof, 'collar', accent=accent, group='cape_top', taper=9.0,
                       scale_fn=lambda u: 0.25 + 0.75 * math.sin(math.pi * u) ** 0.6)
    return f


def x_hood_down(accent=0, depth=0.30, half=1.05):
    """a hood lying back on the shoulders: from the neckline it rises behind the neck, rolls back and lies on the cape
    down to a point at the back centre (columns across the back, rows from the neckline to the hood's lower edge)"""
    def f(G, P, PH, N, F, axis, pts, o):
        C = 30; Rr = 12
        cols = np.linspace(math.pi - half, math.pi + half, C)
        z0 = o['top']
        Q = np.zeros((Rr, C, 3)); UV = np.zeros((Rr, C, 2)); PHh = np.zeros((Rr, C))
        for c, ph in enumerate(cols):
            u = (ph - (math.pi - half)) / (2 * half)                  # 0..1 across
            w = math.sin(math.pi * u)                                  # 0 at the ends, 1 at the back centre
            L = depth * (0.25 + 0.75 * w ** 0.8)                       # its lower edge: a point at the back
            for r in range(Rr):
                t = r / (Rr - 1)
                if t < 0.25:                                           # rising behind the neck, then rolling back
                    k = t / 0.25
                    z = z0 + 0.025 * w * math.sin(math.pi * k * 0.9)
                    out = 0.006 + 0.035 * w * k
                else:                                                  # lying on the cape down to the edge
                    k = (t - 0.25) / 0.75
                    z = z0 + 0.025 * w * math.sin(math.pi * 0.9) * (1 - k) - L * k
                    out = 0.006 + 0.035 * w * (1 - 0.6 * k) + 0.012
                Q[r, c] = F.at(np.array(z), np.array(ph), out)
                PHh[r, c] = ph
                UV[r, c] = (0, -t * (0.12 + L))
        for r in range(Rr):
            sarc = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Q[r], axis=0), axis=1))])
            UV[r, :, 0] = sarc - sarc[C // 2]
        G.grid(Q, UV, 'hood', 'cape_top', accent=accent, gain=0.9, phi=PHh, inside=axis)
        # the hood's turned edge (its opening rim, a touch proud)
        up = Q[Rr - 2] - Q[Rr - 1]; up /= np.maximum(1e-9, np.linalg.norm(up, axis=1))[:, None]
        nrm = np.array([outward(surface_normal(Q, Rr - 1, c), Q[Rr - 1, c], axis(Q[Rr - 1, c])[1]) for c in range(C)])
        turned_edge(G, Q[Rr - 1], up, nrm, 'facing', 'cape_top', accent=accent, width=0.025, phi=PHh[Rr - 1], axis=axis)
    return f


def x_brooches(accent=1, r=0.03):
    def f(G, P, PH, N, F, axis, pts, o):
        C = P.shape[1]
        for c in (2, C - 3):
            rr = 3
            disc(G, P[rr, c] + N[rr, c] * 0.004, N[rr, c], r, 'brooch', 'cape_top', accent, h=0.009, seg=16, gain=0.95)
    return f


def x_edge_trim(accent=1, w=0.035):
    """a border band of another colour down both front edges and along the hem (the knight's cloak)"""
    def f(G, P, PH, N, F, axis, pts, o):
        R, C = P.shape[:2]
        for c, sg in ((0, 1), (C - 1, -1)):
            rows = list(range(1, R))
            inw = P[rows, c + sg] - P[rows, c]; inw /= np.linalg.norm(inw, axis=1)[:, None]
            Q = np.zeros((2, len(rows), 3)); UV = np.zeros((2, len(rows), 2))
            for k, r in enumerate(rows):
                Q[0, k] = P[r, c] + N[r, c] * 0.003; Q[1, k] = P[r, c] + inw[k] * w + N[r, c] * 0.003
                UV[0, k] = (0, -r * 0.03); UV[1, k] = (w, -r * 0.03)
            G.grid(Q, UV, 'trim', 'cape', accent=accent, gain=0.95, phi=np.tile(PH[rows, c], (2, 1)), flip=sg < 0)
        up = P[R - 2] - P[R - 1]; up /= np.linalg.norm(up, axis=1)[:, None]
        Q = np.stack([P[R - 1] + N[R - 1] * 0.003, P[R - 1] + up * w + N[R - 1] * 0.003])
        UV = np.zeros((2, C, 2)); UV[0, :, 0] = UV[1, :, 0] = np.linspace(0, 1.5, C); UV[1, :, 1] = w
        G.grid(Q, UV, 'trim', 'cape', accent=accent, gain=0.95, phi=np.tile(PH[R - 1], (2, 1)))
    return f


def x_leaves(accent=0, n=70, seed=3):
    """loose leaf tabs over the cloak (the shaman's leaf / moss cloak): small bent quads on the sheet, more toward the hem"""
    def f(G, P, PH, N, F, axis, pts, o):
        R, C = P.shape[:2]
        rng = np.random.default_rng(seed)
        for _ in range(n):
            r = int(np.clip(R * (1 - rng.random() ** 1.6), 4, R - 1)); c = int(rng.integers(1, C - 1))
            p, nn = P[r, c], N[r, c]
            down = P[min(R - 1, r + 1), c] - P[max(0, r - 1), c]; down /= np.linalg.norm(down)
            side = np.cross(nn, down); side /= np.linalg.norm(side)
            L = 0.07 + 0.05 * rng.random(); W = 0.035 + 0.02 * rng.random()
            tw = (rng.random() - 0.5) * 0.8
            dd = down * math.cos(tw) + side * math.sin(tw)
            ss = np.cross(nn, dd)
            Q = np.zeros((3, 3, 3)); UV = np.zeros((3, 3, 2))
            for i, t in enumerate((0.0, 0.5, 1.0)):
                wv = W * math.sin(math.pi * max(0.15, min(0.85, t))) if 0 < t < 1 else W * 0.15
                lift = 0.003 + 0.007 * t * t
                for j, sgn in enumerate((-1, 0, 1)):
                    Q[i, j] = p + dd * L * t + ss * wv * sgn + nn * (lift + (0.003 if sgn == 0 else 0))
                    UV[i, j] = (0.5 + 0.5 * sgn, t)
            G.grid(Q, UV * 0.25, 'leaf', 'cape', accent=accent, gain=0.9, phi=np.full((3, 3), PH[r, c]))
    return f


# The cape catalogue (heights in the MALE frame, MPFB world z: neck joint 1.60, shoulder 1.49, armpit ~1.37,
# waist ~1.10, hip 1.00, knee 0.53, ankle 0.08). Accent colours are linear-ish sRGB 0..1.
GOLD = {'color': [0.83, 0.64, 0.22], 'rough': 0.35, 'metal': 0.85}
SILVER = {'color': [0.78, 0.78, 0.80], 'rough': 0.3, 'metal': 0.9}
WHITE_FUR = {'color': [0.95, 0.94, 0.90], 'rough': 0.95, 'metal': 0.0, 'tile': 'fur_2', 'tile_m': 0.12, 'grey': True}
BROWN_FUR = {'color': [0.55, 0.40, 0.28], 'rough': 0.95, 'metal': 0.0, 'tile': 'fur', 'tile_m': 0.12, 'grey': True}

CAPES = {
    # King Arthur: a full royal cape to the ankles, white fur mantle, gold clasps + chain
    'king': dict(label='Royal cape', top=1.585, hem=0.09, e_top=0.42, e_bot=1.05, flare=0.10, folds=0.014, fold_n=9,
                 hem_rise=0.06, accents=[WHITE_FUR, GOLD], extras=[x_fur_mantle(1, 0.05), x_clasp(2)], color='#7a1f1f', fabric='velvet'),
    # the overlord: floor-length, a tall flared villain collar
    'overlord': dict(label='Overlord cape', top=1.585, hem=0.04, e_top=0.5, e_bot=1.15, flare=0.12, folds=0.016, fold_n=8,
                     hem_rise=0.04, accents=[SILVER], extras=[x_stand_collar(0.17, 0.08), x_clasp(1, 0.02, chain=False)], color='#141518', fabric='silk'),
    # superhero / antihero: calf length, clean, no clasp (it sits on the suit's shoulders)
    'hero': dict(label='Hero cape', top=1.58, hem=0.30, e_top=0.95, flare=0.09, folds=0.012, fold_n=8,
                 hem_rise=0.02, e_bot=1.42, accents=[], extras=[], color='#c0392b', fabric='nylon'),
    # the atlantean: a long sheer sea cape from two shoulder brooches
    'sea': dict(label='Sea cape', top=1.575, hem=0.06, e_top=0.7, e_bot=1.2, flare=0.11, folds=0.018, fold_n=11,
                hem_rise=0.08, accents=[GOLD], extras=[x_brooches(1, 0.03)], color='#1f5f8b', fabric='silk'),
    # the knight: a travelling cloak to mid-calf, a contrasting border, one clasp
    'knight': dict(label='Knight cloak', top=1.585, hem=0.26, e_top=0.48, e_bot=1.12, flare=0.08, folds=0.013, fold_n=8,
                   hem_rise=0.08, accents=[GOLD, {'color': [0.79, 0.64, 0.15], 'rough': 0.8, 'metal': 0.0}],
                   extras=[x_clasp(1, 0.02, chain=False), x_edge_trim(2, 0.035)], color='#344a50', fabric='wool'),
    # Kit: a short hooded cape (hood down), to the hips
    'hooded': dict(label='Hooded cape', top=1.585, hem=0.88, e_top=0.5, e_bot=1.10, flare=0.06, folds=0.010, fold_n=7,
                   hem_rise=0.10, joints=4, accents=[], extras=[x_hood_down(0, 0.26, 1.0)], color='#5b3a8a', fabric='cotton'),
    # the shaman: a ragged knee-length leaf / moss cloak (its own leaf tile, tinted by the cape colour)
    'leaf': dict(label='Leaf cloak', top=1.58, hem=0.46, e_top=0.55, e_bot=1.15, flare=0.08, folds=0.016, fold_n=10,
                 hem_rise=0.08, ragged=0.07, own={'tile': 'leaves_3', 'tile_m': 0.22}, accents=[], extras=[x_leaves(0, 55)],
                 color='#9fbf6a', fabric='canvas'),
    # the giant: a heavy fur cloak to the knee, a thick fur mantle (fur tile, tinted)
    'fur': dict(label='Fur cloak', top=1.585, hem=0.50, e_top=0.5, e_bot=1.15, flare=0.09, folds=0.018, fold_n=7, ease=0.032,
                hem_rise=0.06, ragged=0.03, own={'tile': 'fur_3', 'tile_m': 0.18}, accents=[dict(BROWN_FUR, color=[0.42, 0.30, 0.20])],
                extras=[x_fur_mantle(1, 0.07, 0.18), x_fur_hem(1, 0.035, 0.2)], color='#b08060', fabric='suede'),
}


# ═══════════════════════════════ THE LONG COATS (batch 2) ═══════════════════════════════
# The pilot's coat (bake-garment.py build: the wrap-around body sheet on the eased hull, THE HANG below the hips, the
# sleeves as tubes round the arm) with the cut as options: how the fronts close (double / single-breasted, open, closed to
# the neck), the break, the lapels (notched / peaked / none), the collar (fold / stand / tall / popped / none), the hem,
# the flare, a cut-away front (the tailcoat's tails), turned-back cuffs, buttons, gold edge trim, pockets (flaps / patch),
# a belt, epaulettes. Worn as an OUTER LAYER pick (sprites.js EW_OUTER_STYLES `b<key>`, EW_MESH_OUTERS), like the trench.
COATS = {}


def coat_sheet(co, dom, inbody, o):
    """the body + skirt sheet: rows x cols from the under (right) panel's front edge round the back to the outer (left)
    panel's front edge (the pilot's build, the edges and the cut-away from the options)"""
    zs = [o['hem']]
    zbelt = o['belt']
    while zs[-1] < o['top'] - 1e-6:
        z = zs[-1]
        dz = 0.024 if z < zbelt - 0.05 else 0.018 if z < 1.40 else 0.011
        zs.append(min(o['top'], z + dz))
    zs = np.array(zs); R = len(zs)
    torso = np.array([inbody[i] and dom[i] in TORSO_B for i in range(len(co))])
    leg = np.array([inbody[i] and dom[i] in LEG_B for i in range(len(co))])
    armtop = np.array([inbody[i] and dom[i] is not None and dom[i].startswith('upperarm') for i in range(len(co))]) & (np.abs(co[:, 0]) < o.get('armx', 0.19))
    hulls, cen, rings = [], [], []
    for z in zs:
        band = 0.022 if z > 1.45 else 0.016
        sel = ((torso | leg) if z < 1.3 else torso) & (np.abs(co[:, 2] - z) < band)
        if z > 1.40:
            sel |= armtop & (np.abs(co[:, 2] - z) < band)
        while sel.sum() < 6 and band < 0.3:      # (a hem below the calves: the nearest leg skin; THE HANG overrides it anyway)
            band *= 1.6
            sel = (torso | leg) & (np.abs(co[:, 2] - z) < band)
        P2 = co[sel][:, :2]
        hulls.append(hull2d(P2))
        rings.append(P2)
        cen.append([0.0, 0.5 * (P2[:, 1].min() + P2[:, 1].max())])
    cen = np.array(cen)
    for _ in range(6):
        cen[1:-1, 1] = 0.25 * cen[:-2, 1] + 0.5 * cen[1:-1, 1] + 0.25 * cen[2:, 1]
    ihip = int(np.argmin(np.abs(zs - (zbelt - 0.12))))
    cen[:ihip, 1] = cen[ihip, 1]
    NA = 720
    ang = np.linspace(-math.pi, math.pi, NA, endpoint=False)
    D = np.stack([np.sin(ang), -np.cos(ang)], 1)
    rad = np.zeros((R, NA)); radh = np.zeros((R, NA))
    for r, z in enumerate(zs):
        e = o['ease'] if z >= zbelt + o.get('ease_from', 0.03) else (o.get('waist_ease', 0.024) if z >= zbelt - 0.03 else o['skirt_ease'])
        rad[r] = ray_polys(minkowski(hulls[r], e), cen[r], D)
        radh[r] = ray_polys(hulls[r], cen[r], D)
    floor = radh + 0.012

    def star_of(r, nb=6):                   # the skin's own outline round the centre at row r (not its convex hull)
        P2 = rings[r] - cen[r]
        a2 = np.arctan2(P2[:, 0], -P2[:, 1]); r2 = np.hypot(P2[:, 0], P2[:, 1])     # (dirv: x = sin phi, y = -cos phi)
        bins = ((a2 + math.pi) / TAU * NA).astype(int) % NA
        star = np.zeros(NA)
        np.maximum.at(star, bins, r2)
        for _ in range(nb):                 # (empty bins + the skin's own bumps: a little rounding)
            star = np.maximum(star, 0.5 * (np.roll(star, 1) + np.roll(star, -1)) * (star == 0) + star * (star > 0))
            star = np.maximum(star, 0.25 * np.roll(star, 1) + 0.5 * star + 0.25 * np.roll(star, -1) - 0.002)
        return star
    if o.get('hug'):                        # THE BLENDER SHIRTS: from the waist to the armpits a shirt follows the skin + its ease, not the hull
        h0, h1 = o['hug']                   # (the hull bridged the back of the armpit 6-8 cm off the body and came out through a coded jacket)
        for r, z in enumerate(zs):
            k = float(smoothstep(h0 - 0.03, h0, z)) * float(smoothstep(h1 + 0.04, h1, z))
            if k <= 0:
                continue
            sk = star_of(r, 10) + o['ease']
            rad[r] = rad[r] * (1 - k) + np.minimum(rad[r], sk) * k
    if o.get('tuck'):                       # THE BLENDER SHIRTS, tucked: below the blousing the shirt follows the SKIN (not its convex hull,
        zt_ = zbelt + o.get('ease_from', 0.03)              # which bridges the small of the back 2-3 cm off it) so the coded trousers + belt close over it
        for r, z in enumerate(zs):
            if z >= zt_:
                continue
            star = star_of(r)
            k = float(smoothstep(zt_, zt_ - 0.03, z))       # (blends from the hull at the blousing's foot to the skin below)
            sk = star + o.get('waist_ease', 0.005)
            rad[r] = rad[r] * (1 - k) + sk * k
            floor[r] = floor[r] * (1 - k) + (star + 0.003) * k
    for _ in range(3):
        sm = rad.copy(); sm[1:-1] = 0.25 * rad[:-2] + 0.5 * rad[1:-1] + 0.25 * rad[2:]
        rad = np.maximum(sm, floor)
    if o.get('pads'):                       # shoulder pads (the football jersey, the riot suit): the shoulder rows pushed out
        side = np.abs(np.sin(ang)) ** 2
        for r, z in enumerate(zs):
            rad[r] += o['pads'] * float(smoothstep(o['top'] - 0.16, o['top'] - 0.05, z)) * side
    zw = zs[ihip]
    for r in range(ihip - 1, -1, -1):    # THE HANG
        rad[r] = np.maximum(rad[r], rad[r + 1] + o['flare'] * (zs[r + 1] - zs[r]) / max(1e-6, zw - o['hem']))
    if o.get('back_flare'):              # a fuller back skirt (the frock / the duster ride wider behind)
        bk = np.clip(-np.cos(ang), 0, 1) ** 2
        for r in range(ihip):
            rad[r] += o['back_flare'] * float(smoothstep(zw, o['hem'], zs[r])) * bk

    def R_at(r, phi):
        a = (phi + math.pi) % TAU - math.pi
        x = (a + math.pi) / TAU * NA
        i0 = int(math.floor(x)) % NA; t = x - math.floor(x)
        return rad[r, i0] * (1 - t) + rad[r, (i0 + 1) % NA] * t

    def point(r, phi):
        d = dirv(phi); rr = R_at(r, phi)
        return np.array([cen[r, 0] + rr * d[0], cen[r, 1] + rr * d[1], zs[r]])

    zt, zb = o['top'], o['zb']
    front = o['front']
    xo0, xu0 = {'double': (-0.10, 0.085), 'single': (-0.032, 0.030), 'open': (o.get('gap', 0.05), -o.get('gap', 0.05)),
                'closed': (-0.026, 0.024), 'seam': (0.0, 0.0)}[front]   # (seam: a pullover - the two edges meet at the front centre)

    def tneck(z):
        return 0.0 if zb >= zt else float(smoothstep(zb, zt, z)) ** 0.9

    def splay(z):                           # THE OPEN FRONTS: an open coat's edges part wider toward the hem (gap_hem)
        if front != 'open' or o.get('gap_hem') is None:
            return 0.0
        return (o['gap_hem'] - o.get('gap', 0.05)) * float(smoothstep(zbelt + 0.06, o['hem'], z))

    plk = o.get('placket')                  # THE POLO: below the placket's foot the front is one piece (no opening, no overlap)

    def xo(z):
        if plk is not None and z < plk:
            return 0.0
        return xo0 + splay(z) + (o.get('neck_x', 0.075) - xo0) * tneck(z)

    def xu(z):
        if plk is not None and z < plk:
            return 0.0
        return xu0 - splay(z) + (-o.get('neck_x', 0.075) + 0.005 - xu0) * tneck(z)

    def phi_at_x(r, x):
        lo, hi = -1.45, 1.45
        for _ in range(40):
            m = 0.5 * (lo + hi)
            if point(r, m)[0] < x:
                lo = m
            else:
                hi = m
        return 0.5 * (lo + hi)

    C = o.get('cols', 84)
    P = np.zeros((R, C, 3)); PH = np.zeros((R, C))
    cut = o.get('cut')                      # the tailcoat: (height above the waist the fronts start to cut away, the tails' half-angle, the curve's drop)
    for r, z in enumerate(zs):
        ps = phi_at_x(r, xu(z))
        pe = phi_at_x(r, xo(z)) - TAU
        if cut:
            k = float(smoothstep(zbelt + cut[0], zbelt + cut[0] - cut[2], z))
            a = cut[1] + (cut[3] - cut[1]) * float(smoothstep(zbelt, o['hem'], z))       # the tails narrow to the hem
            ps = ps + (-a - ps) * k
            pe = pe + ((a - TAU) - pe) * k
        ph = np.linspace(ps, pe, C)
        vent = o.get('vent')
        if vent and z < zbelt + vent[0]:      # the back vent: the two halves part at the back centre (no cloth across it)
            g = vent[1] * float(smoothstep(zbelt + vent[0], o['hem'], z)) + 0.004
            mid, h2 = 0.5 * (ps + pe), C // 2
            ph = np.concatenate([np.linspace(ps, mid + g, h2), np.linspace(mid - g, pe, C - h2)])
        PH[r] = ph
        for c in range(C):
            P[r, c] = point(r, ph[c])
        if front in ('double', 'single', 'closed') and not (cut and z < zbelt + cut[0]) and not (plk is not None and z < plk):
            for c in range(C):          # the outer panel over the under one (+6 mm), the under one sinks 3 mm under it
                over = (ps - TAU) - ph[c]
                k = float(smoothstep(-0.26, 0.0, over))
                ku = float(smoothstep(pe + TAU - 0.26, pe + TAU, ph[c]))
                if k > 0 or ku > 0:
                    d = dirv(ph[c])
                    P[r, c, 0] += (0.006 * k - 0.003 * ku) * d[0]
                    P[r, c, 1] += (0.006 * k - 0.003 * ku) * d[1]
    for r in range(R if zw - o['hem'] > 1e-6 else 0):     # the skirt's soft folds (none on a top that ends above the hips)
        a = float(smoothstep(zw, o['hem'], zs[r])) * o.get('folds', 0.009)
        if a <= 0:
            continue
        for c in range(C):
            d = dirv(PH[r, c]); f = a * math.cos(PH[r, c] * o.get('fold_n', 11.0))
            P[r, c, 0] += f * d[0]; P[r, c, 1] += f * d[1]
    if o.get('ragged'):                     # a torn hem: each column's bottom rows gathered up to its own tear height
        for c in range(C):
            amp = o['ragged'] * (0.5 + 0.5 * math.cos(c * 2.0943951)) * (0.35 + 0.65 * ((c * 7919) % 13) / 12.0)
            zc = o['hem'] + amp
            for r in range(R):
                if P[r, c, 2] < zc:
                    t = (zc - P[r, c, 2]) / max(1e-6, zc - o['hem'])
                    P[r, c, 2] = zc - 0.004 * (1 - t)
    UV = np.zeros((R, C, 2))
    for r in range(R):
        seg = np.linalg.norm(np.diff(P[r], axis=0), axis=1)
        s = np.concatenate([[0], np.cumsum(seg)])
        cb = int(np.argmin(np.abs(PH[r] + math.pi)))
        UV[r, :, 0] = s - s[cb]; UV[r, :, 1] = zs[r]
    info = dict(zs=zs, PH=PH, cen=cen, zbelt=zbelt, ihip=ihip, xo=xo, xu=xu, point=point, R_at=R_at, rad=rad, opts=o, phi_at_x=phi_at_x, splay=splay)
    return P, UV, info


class CoatKit:
    """the sheet as a sampler + the helpers every coat detail uses"""
    def __init__(self, G, P, info, inside):
        self.G, self.P, self.info, self.inside = G, P, info, inside
        self.S = PG.Surf(P, info)
        self.zs, self.PH = info['zs'], info['PH']
        self.R, self.C = P.shape[:2]

    def ps_at(self, z):
        return float(np.interp(z, self.zs, self.PH[:, 0]))

    def pe_at(self, z):
        return float(np.interp(z, self.zs, self.PH[:, -1]))

    def frame(self, z, x, extra=0.0, panel='top'):
        """a point on the visible panel at height z, front x: (p, n, tx, ty, phi)"""
        S, info = self.S, self.info
        r = int(np.argmin(np.abs(self.zs - z)))
        ph = info['phi_at_x'](r, x)
        lo, hi = self.PH[r, -1], self.PH[r, 0]
        cands = [q for q in (ph - TAU, ph) if lo + 0.02 <= q <= hi - 0.0]
        q = cands[0] if cands else (ph - TAU if ph - TAU >= lo else ph)
        p = S.at(z, q); n = S.normal(z, q)
        tx = S.at(z, q + 0.01) - S.at(z, q - 0.01); tx /= np.linalg.norm(tx)
        ty = np.cross(n, tx)
        if ty[2] < 0:
            ty = -ty
        return p + n * extra, n, tx, ty, q

    def frame_phi(self, z, q, extra=0.0):
        S = self.S
        p = S.at(z, q); n = S.normal(z, q)
        tx = S.at(z, q + 0.01) - S.at(z, q - 0.01); tx /= np.linalg.norm(tx)
        ty = np.cross(n, tx)
        if ty[2] < 0:
            ty = -ty
        return p + n * extra, n, tx, ty


def coat_facings(K, o):
    """the hem and both front edges turned in (the cloth's thickness at every edge)"""
    G, P, S, zs, PH, R, C = K.G, K.P, K.S, K.zs, K.PH, K.R, K.C
    hn = np.array([S.normal(zs[0], PH[0, c]) for c in range(C)])
    up = np.tile(np.array([0, 0, 1.0]), (C, 1))
    turned_edge(G, P[0], up, hn, 'facing', 'coat_tl', width=0.022, gain=0.8, phi=PH[0], axis=K.inside)
    if o['front'] == 'seam':                # a pullover (THE BLENDER BASICS): no front edges to turn (the neck band covers its edge)
        return
    ztop = o['zb'] + 0.01 if o.get('lapel') else o['top'] + 0.01
    for col, sgn in ((C - 1, 1), (0, -1)):
        rows = [r for r in range(R) if zs[r] <= ztop and (o.get('placket') is None or zs[r] >= o['placket'] - 1e-6)]
        inw = []
        for r in rows:
            d = S.at(zs[r], S.arc_phi(zs[r], PH[r, col], 0.02 * sgn)) - P[r, col]
            inw.append(d / max(1e-9, np.linalg.norm(d)))
        nr = np.array([S.normal(zs[r], PH[r, col]) for r in rows])
        turned_edge(G, P[rows, col], np.array(inw), nr, 'facing', 'coat_tl', width=0.02, gain=0.8, phi=PH[rows, col], axis=K.inside)


def coat_lapels(K, o):
    """each front edge folds back over its own panel above the break: notched (narrows at the notch) or peaked (widens)"""
    G, S, info = K.G, K.S, K.info
    zb, zt = o['zb'], o['top']
    zm = None
    for z in np.linspace(zb, zt, 200):
        if info['xo'](z) >= info['xu'](z):
            zm = z; break
    zm = zm or zb
    wmax = o.get('lapel_w', 0.08)
    peak = o.get('lapel') == 'peak'

    def lapel(edge_phi, z0, sgn):
        zz = np.linspace(z0, zt - 0.004, 16)
        W = 5
        Q = np.zeros((len(zz), W, 3)); UV = np.zeros((len(zz), W, 2)); Gn = np.ones((len(zz), W))
        for i, z in enumerate(zz):
            f = (z - z0) / max(1e-6, zt - z0)
            w = wmax * smoothstep(0.0, 0.55, f) * ((1 + 0.3 * smoothstep(0.72, 0.9, f) - 0.45 * smoothstep(0.92, 1.0, f)) if peak else (1 - 0.55 * smoothstep(0.82, 1.0, f))) + 0.006
            e = edge_phi(z)
            for j in range(W):
                d = w * j / (W - 1)
                q = S.arc_phi(z, e, sgn * d) if d > 0 else e
                n = S.normal(z, q)
                Q[i, j] = S.at(z, q) + n * (0.0045 + 0.003 * (1 - j / (W - 1)))
                UV[i, j] = (d, z)
                Gn[i, j] = 0.92 if j else 0.85
            Q[i, 0] += (S.at(z, e) - S.at(z, S.arc_phi(z, e, sgn * 0.01))) * 0.35
        G.grid(Q, UV, 'lapel', 'coat_tl', accent=o.get('lapel_accent', 0), gain=Gn, inside=K.inside)
    lapel(K.pe_at, zb, +1)
    lapel(K.ps_at, max(zb, zm - 0.01), -1)
    return zm


COLLARS = {
    'fold': [(-0.004, 0.001), (0.018, 0.004), (0.03, 0.009), (0.024, 0.015), (0.0, 0.018), (-0.026, 0.02)],
    'stand': [(-0.004, 0.001), (0.016, 0.002), (0.034, 0.003), (0.042, 0.006), (0.036, 0.009)],
    'crew': [(-0.004, 0.0005), (0.006, 0.002), (0.012, 0.003), (0.013, 0.0015)],      # THE BLENDER BASICS: a pullover's ribbed neck band
    'tall': [(-0.004, 0.001), (0.025, 0.002), (0.05, 0.004), (0.068, 0.008), (0.062, 0.012)],
    'popped': [(-0.004, 0.001), (0.022, 0.004), (0.045, 0.012), (0.07, 0.024), (0.068, 0.03), (0.05, 0.028)],
    'big': [(-0.004, 0.001), (0.02, 0.005), (0.034, 0.012), (0.026, 0.022), (-0.01, 0.028), (-0.06, 0.034), (-0.085, 0.036)],
    # THE BLENDER SHIRTS (2026-11-02): a shirt collar = a band standing 3 cm round the neck, then the fold turned down over it
    'shirt': [(-0.003, 0.0005), (0.012, 0.0015), (0.026, 0.0025), (0.032, 0.006), (0.027, 0.010), (0.009, 0.0125), (-0.012, 0.0145)],
    # a polo's knit collar: a lower band, a shorter fold
    'polo': [(-0.003, 0.0005), (0.010, 0.0015), (0.021, 0.0025), (0.026, 0.0055), (0.021, 0.009), (0.006, 0.011), (-0.008, 0.0125)],
}


def coat_collar(K, o):
    prof = COLLARS[o['collar']]
    G, P, S, zs, PH, C = K.G, K.P, K.S, K.zs, K.PH, K.C
    top = K.R - 1
    taper = o.get('collar_taper', 6.0)
    ipk = int(np.argmax([u for u, _ in prof]))
    pts_k = o.get('collar_points', 0.0)          # THE BLENDER SHIRTS: the fold runs further down at the two front ends (the collar's points)
    cols = list(range(C))
    cache = o.get('_cache', {})
    if o.get('collar_meet') and 'collar_cols' in cache:     # (chosen on the first body built, the male: one topology on every body)
        cols = cache['collar_cols']
    elif o.get('collar_meet'):                     # a closed shirt: each half of the collar stops at the front centre (the points meet, not cross)
        sgn0, sgn1 = np.sign(P[top, C // 6, 0]), np.sign(P[top, C - 1 - C // 6, 0])
        c0, c1 = 0, C - 1
        while c0 < C // 6 and not (np.sign(P[top, c0, 0]) == sgn0 and abs(P[top, c0, 0]) >= o['collar_meet']):
            c0 += 1
        while c1 > C - 1 - C // 6 and not (np.sign(P[top, c1, 0]) == sgn1 and abs(P[top, c1, 0]) >= o['collar_meet']):
            c1 -= 1
        cols = list(range(c0, c1 + 1))
        cache['collar_cols'] = cols
    Q = np.zeros((len(prof), len(cols), 3)); UV = np.zeros((len(prof), len(cols), 2)); Gn = np.ones((len(prof), len(cols)))
    n_ = len(cols)
    for j, c in enumerate(cols):
        p = P[top, c]
        n = S.normal(zs[top] - 0.01, PH[top, c]); n[2] = 0
        if not np.isfinite(n).all() or np.linalg.norm(n) < 0.3:     # (an edge column on a closed front: out from the axis)
            n = p - K.inside(p); n[2] = 0
        n /= np.linalg.norm(n)
        endk = min(j, n_ - 1 - j) / taper
        sc = 0.55 + 0.45 * min(1.0, endk)
        pk = pts_k * (1.0 - min(1.0, min(j, n_ - 1 - j) / 5.0)) ** 1.5
        for i, (up, out) in enumerate(prof):
            if pts_k and i > ipk:
                up = up * (1.0 + pk) - 0.004 * pk * (i - ipk)
            elif pts_k:
                up = up * max(sc, 0.85)
            else:
                up = up * sc
            Q[i, j] = p + np.array([0, 0, up]) + n * (out * (1.0 + 0.4 * pk if i > ipk else 1.0))
            Gn[i, j] = 0.75 if i < 2 else 0.95
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Q[2], axis=0), axis=1))])
    UV[:, :, 0] = s[None, :]; UV[:, :, 1] = np.arange(len(prof))[:, None] * 0.015
    G.grid(Q, UV, 'collar', 'coat_tl', accent=o.get('collar_accent', 0), gain=Gn, phi=np.tile(PH[top, cols], (len(prof), 1)), inside=K.inside)


def shirt_collar(K, o):
    """THE BLENDER SHIRTS (2026-11-02): a shirt collar that hugs the neck - the BAND rises from the neckline (the sheet's top row) up
    the neck, 4 mm off its skin, taller at the back than at the front (the neck slopes); it ROLLS over and the FOLD comes down outside
    it and past the neckline onto the shirt's shoulders, its two POINTS longer at the front. The coat collar (a fixed profile out
    from a level row) stood as a tall block round a shirt's narrow neck and reached the chin at the front."""
    G, P, S, zs, PH, C = K.G, K.P, K.S, K.zs, K.PH, K.C
    co, dom, inbody = K.body
    top = K.R - 1
    z0 = zs[top]
    polo = o.get('collar') == 'polo'
    Hb = 0.026 if polo else 0.033                 # the band's height at the back
    nk = np.array([inbody[i] and dom[i] in ('neck_01', 'head', 'spine_03', 'clavicle_l', 'clavicle_r') and z0 - 0.04 < co[i, 2] < z0 + 0.09 for i in range(len(co))])
    NP = co[nk]
    kd = KDTree(len(NP))
    for i, q in enumerate(NP):
        kd.insert(Vector(q), i)
    kd.balance()
    nkc = np.array([inbody[i] and dom[i] == 'neck_01' for i in range(len(co))])
    ncy = float(co[nkc, 1].mean()) if nkc.any() else float(K.info['cen'][-1, 1])

    def skin_out(q, out):
        """the neck skin nearest q + `out` along its outward (horizontal, from the neck's axis)"""
        sp = np.array(kd.find(Vector(q))[0])
        rd = np.array([sp[0], sp[1] - ncy, 0.0]); L = np.linalg.norm(rd)
        rd = rd / L if L > 1e-6 else np.array([0, -1.0, 0])
        return sp + rd * out, rd
    cache = o.get('_cache', {})
    cols = list(range(C))
    if o.get('collar_meet') and 'collar_cols' in cache:
        cols = cache['collar_cols']
    elif o.get('collar_meet'):                     # a closed shirt: each half stops at the front centre (the points meet, not cross)
        sgn0, sgn1 = np.sign(P[top, C // 6, 0]), np.sign(P[top, C - 1 - C // 6, 0])
        c0, c1 = 0, C - 1
        while c0 < C // 6 and not (np.sign(P[top, c0, 0]) == sgn0 and abs(P[top, c0, 0]) >= o['collar_meet']):
            c0 += 1
        while c1 > C - 1 - C // 6 and not (np.sign(P[top, c1, 0]) == sgn1 and abs(P[top, c1, 0]) >= o['collar_meet']):
            c1 -= 1
        cols = list(range(c0, c1 + 1))
        cache['collar_cols'] = cols
    # (height as a fraction of the band, out from the neck skin); h < 0 = down onto the shirt (out from the sheet)
    # (the band stands 11 mm off the neck: the game hides the skin within 1 cm under a garment, and the neck above a closer band went too)
    prof = [('base', 0.0, 0.0), ('neck', 0.35, 0.011), ('neck', 0.72, 0.011), ('neck', 1.0, 0.0115), ('neck', 1.07, 0.0145),
            ('neck', 1.0, 0.0185), ('neck', 0.62, 0.021), ('neck', 0.22, 0.0225), ('sheet', -0.18, 0.0042), ('sheet', -0.42, 0.0040)]
    if polo:
        prof = prof[:-1]
    nR, nC = len(prof), len(cols)
    pts_k = o.get('collar_points', 0.0)
    Q = np.zeros((nR, nC, 3)); UV = np.zeros((nR, nC, 2)); Gn = np.ones((nR, nC))
    for j, c in enumerate(cols):
        p0 = P[top, c]; ph = PH[top, c]
        back = 0.5 * (1.0 - math.cos(ph))          # 0 at the front centre, 1 at the back
        hb = Hb * (0.62 + 0.38 * back)
        endk = min(j, nC - 1 - j)
        pk = pts_k * max(0.0, 1.0 - endk / 6.0) ** 1.4      # the collar's points: the fold reaches further down at each front end
        for i, (kind, hf, out) in enumerate(prof):
            if kind == 'base':
                Q[i, j] = p0
            elif kind == 'neck':
                h = hf * hb
                q, rd = skin_out(p0 + np.array([0, 0, h]), out)
                if i >= 5:                          # the fold lies OUTSIDE the neckline it covers (the sheet's top stands off the neck)
                    rb = math.hypot(p0[0], p0[1] - ncy)
                    rq = math.hypot(q[0], q[1] - ncy)
                    want = rb + 0.003 + 0.0015 * (i - 5)
                    if rq < want:
                        q = q + rd * (want - rq)
                if i >= 6 and pk > 0:               # the fold's lower rows: down past the band at a point
                    q = q - np.array([0, 0, 0.012 * pk * (i - 5)]) + rd * 0.003 * pk
                Q[i, j] = q
            else:
                h = hf * hb * (1.0 + 1.6 * pk)
                z = z0 + h
                q = S.at(z, ph) + S.normal(z, ph) * out
                Q[i, j] = q
            Gn[i, j] = 0.9 if i < 4 else (0.8 if i == len(prof) - 1 else 0.98)
    for _ in range(3):                             # (the nearest-skin samples wobble: smooth each row along the collar)
        Q[1:, 1:-1] = 0.25 * Q[1:, :-2] + 0.5 * Q[1:, 1:-1] + 0.25 * Q[1:, 2:]
    s_ = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Q[4], axis=0), axis=1))])
    UV[:, :, 0] = s_[None, :]; UV[:, :, 1] = np.arange(nR)[:, None] * 0.012
    G.grid(Q, UV, 'collar', 'coat_tl', accent=o.get('collar_accent', 0), gain=Gn, phi=np.tile(PH[top, cols], (nR, 1)), inside=K.inside)


def coat_buttons(K, o):
    """o['buttons'] = [(height above the waist, front x), ...] on the visible panel; o['button'] = (radius, accent)"""
    r_, acc = o.get('button', (0.0105, 1))
    for (dz, x) in o.get('buttons', []):
        if o.get('buttons_edge'):          # (an opened coat's buttons ride its front edge as it parts toward the hem)
            x += math.copysign(K.info['splay'](K.info['zbelt'] + dz), x)
        p, n, tx, ty, q = K.frame(K.info['zbelt'] + dz, x)
        if not (np.isfinite(p).all() and np.isfinite(n).all() and np.linalg.norm(n) > 1e-6):
            continue
        disc(K.G, p, n, r_, 'button', 'coat_tl', acc, h=0.0045, seg=12, gain=0.9, tx=tx)


def coat_trim(K, o):
    """a band of another colour (gold braid) down both front edges and round the hem, over the cloth"""
    acc, w = o['trim']
    G, P, S, zs, PH, R, C = K.G, K.P, K.S, K.zs, K.PH, K.R, K.C
    ztop = o['zb'] + 0.01 if o.get('lapel') else o['top']
    edges = ((C - 1, 1), (0, -1))
    if o['front'] in ('closed', 'single', 'double') and not o.get('cut'):
        edges = ((C - 1, 1),)              # (a crossed-over front: the under panel's edge never shows, and it shows wrongly in a stride)
    for col, sgn in (() if o.get('trim_hem') else edges):     # (trim_hem: the hem only, the tabard)
        rows = [r for r in range(R) if zs[r] <= ztop]
        Q = np.zeros((2, len(rows), 3)); UV = np.zeros((2, len(rows), 2))
        for k, r in enumerate(rows):
            n = S.normal(zs[r], PH[r, col])
            q = S.arc_phi(zs[r], PH[r, col], w * sgn)
            Q[0, k] = P[r, col] + n * 0.003
            Q[1, k] = S.at(zs[r], q) + S.normal(zs[r], q) * 0.003
            UV[0, k] = (0, zs[r]); UV[1, k] = (w, zs[r])
        G.grid(Q, UV, 'trim', 'coat_tl', accent=acc, gain=0.95, phi=np.stack([PH[rows, col], PH[rows, col]]), inside=K.inside)
    Q = np.zeros((2, C, 3)); UV = np.zeros((2, C, 2))
    for c in range(C):
        n = S.normal(zs[0], PH[0, c])
        Q[0, c] = P[0, c] + n * 0.003
        Q[1, c] = S.at(zs[0] + w, PH[0, c]) + S.normal(zs[0] + w, PH[0, c]) * 0.003
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Q[0], axis=0), axis=1))])
    UV[0, :, 0] = UV[1, :, 0] = s; UV[1, :, 1] = w
    G.grid(Q, UV, 'trim', 'coat_tl', accent=acc, gain=0.95, phi=np.tile(PH[0], (2, 1)), inside=K.inside)


def coat_band(K, z, bw, bt, acc, part='band'):
    """a band round the body at height z over the outermost cloth (a reflective stripe, a sash, the belt)"""
    G, S, PH, info = K.G, K.S, K.PH, K.info
    NB = 120
    phis = np.linspace(-math.pi * 0.98, math.pi * 0.98, NB)
    bz = [z - bw, z - bw, z + bw, z + bw]
    bo = [0.002, bt, bt, 0.002]
    Q = np.zeros((4, NB, 3)); UV = np.zeros((4, NB, 2))
    for k, ph in enumerate(phis):
        for i in range(4):
            best = None
            for q in (ph, ph - TAU, ph + TAU):
                if PH[:, -1].min() - 0.01 <= q <= PH[:, 0].max() + 0.01:
                    p = S.at(bz[i], q); d = dirv(ph)
                    rr = p[0] * d[0] + (p[1] - info['cen'][0, 1]) * d[1]
                    if best is None or rr > best[0]:
                        best = (rr, p, q)
            if best is None:               # (an open front: past the sheet's edge the band stops at the edge)
                lo, hi = PH[:, -1].min(), PH[:, 0].max()
                q = min((min(max(c, lo), hi) for c in (ph, ph - TAU, ph + TAU)), key=lambda c, ph=ph: min(abs(c - ph), abs(c - ph + TAU), abs(c - ph - TAU)))
                best = (0, S.at(bz[i], q), q)
            Q[i, k] = best[1] + S.normal(bz[i], best[2]) * bo[i]
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Q[1], axis=0), axis=1))])
    UV[:, :, 0] = s[None, :]; UV[:, :, 1] = np.array([0, 0.006, 2 * bw, 2 * bw + 0.006])[:, None]
    G.grid(Q, UV, part, 'coat_tl', accent=acc, closed=info['opts'].get('front') != 'open', gain=0.92, phi=np.tile(phis, (4, 1)), inside=K.inside)


def coat_extras(K, sleeves, o):
    """the uniform bits: torso bands, sleeve bands, a badge, ribbon bars, a sash's hanging ends"""
    zbelt = K.info['zbelt']
    for dz, bw, bt, acc in o.get('bands', []):
        coat_band(K, zbelt + dz, bw, bt, acc)
    for k_end, acc in o.get('sleeve_bands', []):
        for side, (SP, SUV, si) in sleeves.items():
            ii = len(si['ss']) - 1 - k_end
            Ks = SP.shape[1]
            Q = np.zeros((2, Ks, 3)); UV = np.zeros((2, Ks, 2))
            for j, i2 in enumerate((ii, ii + 1)):
                ring = SP[i2]; c = ring.mean(axis=0)
                for q in range(Ks):
                    radial = ring[q] - c; radial /= np.linalg.norm(radial)
                    Q[j, q] = ring[q] + radial * 0.004; UV[j, q] = SUV[i2, q]
            K.G.grid(Q, UV, 'band', 'coat_arm_' + side, accent=acc, closed=True, gain=0.95, inside=lambda p, c=SP[ii].mean(axis=0): c)
    if o.get('badge'):
        dz, x, r_, acc = o['badge']
        p, n, tx, ty, q = K.frame(zbelt + dz, x)
        disc(K.G, p + n * 0.003, n, r_, 'button', 'coat_tl', acc, h=0.004, seg=10, tx=tx)
    for dz, x, w, h, acc in o.get('ribbons', []):
        p0, n0, tx0, ty0, q0 = K.frame(zbelt + dz, x)
        nr, nc = max(2, int(h / 0.025) + 1), max(3, int(w / 0.02) + 1)    # (a tall cross / a big patch: enough rows to follow the body)
        Q = np.zeros((nr, nc, 3)); UV = np.zeros((nr, nc, 2))
        for j in range(nr):
            for i in range(nc):
                a = (i / (nc - 1) - 0.5) * w; b = j / (nr - 1) * h
                qq = K.S.arc_phi(zbelt + dz + b, q0, a) if abs(a) > 1e-6 else q0
                Q[j, i] = K.S.at(zbelt + dz + b, qq) + K.S.normal(zbelt + dz + b, qq) * 0.0035
                UV[j, i] = (a, b)
        K.G.grid(Q, UV, 'pocket', 'coat_tl', accent=acc, gain=0.95, inside=K.inside)
    for dz, x, w, h, acc in o.get('emblem', []):   # a heraldic charge (the tabard's cross): each point on whichever panel shows at its front x
        nr, nc = max(2, int(h / 0.025) + 1), max(3, int(w / 0.012) + 1)
        Q = np.zeros((nr, nc, 3)); UV = np.zeros((nr, nc, 2))
        for j in range(nr):
            for i in range(nc):
                a = (i / (nc - 1) - 0.5) * w; b = j / (nr - 1) * h
                Q[j, i] = K.frame(zbelt + dz + b, x + a, 0.0035)[0]
                UV[j, i] = (a, b)
        K.G.grid(Q, UV, 'pocket', 'coat_tl', accent=acc, gain=0.95, inside=K.inside)
    if o.get('coins'):                         # THE COINS (the belly-dancer's top + belt): gold discs hanging along the hem, two staggered rows
        acc, r_, gap = o['coins']
        P, PH, zs, S = K.P, K.PH, K.zs, K.S
        C = P.shape[1]
        seg = np.linalg.norm(np.diff(P[0], axis=0), axis=1); arc = np.concatenate([[0], np.cumsum(seg)])
        nco = o.get('_cache', {}).setdefault('coins', int(arc[-1] / gap))      # (the male's count on every body: one topology)
        for row, (drop, off) in enumerate(((r_ + 0.002, 0.0), (2.6 * r_ + 0.002, 0.5))):
            for a in (np.arange(nco - row) + 0.5 + off) * arc[-1] / nco:
                c = int(np.clip(np.searchsorted(arc, a), 1, C - 2))
                n = S.normal(zs[0], PH[0, c]); n[2] = 0; n /= max(1e-9, np.linalg.norm(n))
                p = P[0, c] + np.array([0, 0, -drop]) + n * (0.003 + 0.0015 * row)
                tx = P[0, c + 1] - P[0, c - 1]; tx /= max(1e-9, np.linalg.norm(tx))
                disc(K.G, p, n, r_, 'coin', 'coat_tl', acc, h=0.0018, seg=10, gain=0.95, tx=tx)
    if o.get('leaves'):                        # loose leaf tabs over the dress (the fairy's): x_leaves on the coat sheet
        acc, n_, seed = o['leaves']
        P, PH, zs, S = K.P, K.PH, K.zs, K.S
        R, C = P.shape[:2]
        rng = np.random.default_rng(seed)
        for _ in range(n_):
            r = int(np.clip(R * (rng.random() ** 1.3), 1, R - 3)); c = int(rng.integers(2, C - 2))
            p, nn = P[r, c], S.normal(zs[r], PH[r, c])
            down = P[max(0, r - 1), c] - P[min(R - 1, r + 1), c]; down /= np.linalg.norm(down)
            side = np.cross(nn, down); side /= np.linalg.norm(side)
            L = 0.06 + 0.04 * rng.random(); W = 0.03 + 0.016 * rng.random()
            tw = (rng.random() - 0.5) * 0.8
            dd = down * math.cos(tw) + side * math.sin(tw)
            ss = np.cross(nn, dd)
            Q = np.zeros((3, 3, 3)); UV = np.zeros((3, 3, 2))
            for i, t in enumerate((0.0, 0.5, 1.0)):
                wv = W * math.sin(math.pi * max(0.15, min(0.85, t))) if 0 < t < 1 else W * 0.15
                lift = 0.004 + 0.007 * t * t
                for j, sgn in enumerate((-1, 0, 1)):
                    Q[i, j] = p + dd * L * t + ss * wv * sgn + nn * (lift + (0.003 if sgn == 0 else 0))
                    UV[i, j] = (0.5 + 0.5 * sgn, t)
            K.G.grid(Q, UV * 0.25, 'leaf', 'coat_tl', accent=acc, gain=0.9, phi=np.full((3, 3), PH[r, c]), inside=K.inside)
    if o.get('sash_tails'):                    # the knot's two ends hanging down the front, a touch to the wearer's left
        acc, L = o['sash_tails']
        for k, (x0, ang) in enumerate(((0.05, 0.10), (0.075, -0.06))):
            p, n, tx, ty, q = K.frame(zbelt - 0.01, x0, 0.012 + 0.003 * k)
            down = np.array([0, 0, -1.0]) + tx * ang
            down /= np.linalg.norm(down)
            Q = np.zeros((6, 2, 3)); UV = np.zeros((6, 2, 2))
            for i in range(6):
                t = i / 5 * L
                c = p + down * t + n * (0.004 * i)
                Q[i, 0] = c - tx * 0.022; Q[i, 1] = c + tx * 0.022
                UV[i] = [(0, t), (0.044, t)]
            K.G.grid(Q, UV, 'belt', 'coat_tl', accent=acc, gain=0.9, inside=K.inside)

    if o.get('harness'):                       # THE HARNESS (Krampus): two straps crossing the chest, over the shoulders, crossing the back
        acc, w = o['harness']
        zl, zt = zbelt + 0.03, o['top'] - 0.006
        for sgn in (1, -1):
            way = [(zl, 0.42 * sgn), (zt - 0.02, -0.80 * sgn), (zt, -1.10 * sgn), (zt, -2.04 * sgn), (zt - 0.02, -2.34 * sgn), (zl, (-math.pi - 0.42) * sgn)]
            pts = []
            for (z0, a0), (z1, a1) in zip(way[:-1], way[1:]):
                n_ = max(3, int(abs(a1 - a0) * 6 + abs(z1 - z0) * 40))
                for t in np.linspace(0, 1, n_, endpoint=False):
                    pts.append((z0 + (z1 - z0) * t, a0 + (a1 - a0) * t))
            pts.append(way[-1])
            Q = np.zeros((len(pts), 2, 3)); UV = np.zeros((len(pts), 2, 2))
            frames = []
            for z, a in pts:
                q = a if a <= K.ps_at(z) - 0.01 else a - TAU       # (this row's own front edge: past it = the outer panel)
                frames.append(K.frame_phi(z, q, 0.006 + 0.002 * (sgn > 0)))
            for i, (pp, n, tx, ty) in enumerate(frames):
                tang = frames[min(i + 1, len(frames) - 1)][0] - frames[max(i - 1, 0)][0]
                side = np.cross(n, tang); side /= max(1e-9, np.linalg.norm(side))
                Q[i, 0] = pp - side * w * 0.5; Q[i, 1] = pp + side * w * 0.5
                UV[i] = [(0, i * 0.02), (w, i * 0.02)]
            K.G.grid(Q, UV, 'belt', 'coat_tl', accent=acc, gain=0.9, inside=K.inside)
    for dz, x0, x1, L, acc in o.get('fringe', []):   # THE FRINGE (the hippie jacket): strands hanging from a line across the front / back
        n_ = max(4, int(abs(x1 - x0) / 0.011))
        for x in np.linspace(x0, x1, n_):
            p, n, tx, ty, q = K.frame(zbelt + dz, x, 0.004)
            Q = np.zeros((4, 2, 3)); UV = np.zeros((4, 2, 2))
            for i in range(4):
                t = i / 3 * L
                c = p + np.array([0, 0, -t]) + n * (0.004 * i)
                Q[i, 0] = c - tx * 0.0035; Q[i, 1] = c + tx * 0.0035
                UV[i] = [(0, t), (0.007, t)]
            K.G.grid(Q, UV, 'trim', 'coat_tl', accent=acc, gain=0.9, inside=K.inside)

def coat_buckle(K, o, z, acc):
    """THE BLENDER BELT: a buckle frame + its prong on the sheet's front at height z"""
    G = K.G
    p, n, tx, ty, _ = K.frame(z, 0.0, 0.004)
    hw, hh, t = o.get('buckle_w', 0.026), o.get('buckle_h', 0.022), o.get('buckle_t', 0.007)
    outer = [(-hw, -hh), (hw, -hh), (hw, hh), (-hw, hh)]
    inner = [(-hw + t, -hh + t), (hw - t, -hh + t), (hw - t, hh - t), (-hw + t, hh - t)]
    Q = np.zeros((3, 4, 3)); UV = np.zeros((3, 4, 2))
    for i, (ring, lift) in enumerate(((outer, 0.0), (outer, 0.004), (inner, 0.004))):
        for k, (a, b) in enumerate(ring):
            Q[i, k] = p + tx * a + ty * b + n * lift; UV[i, k] = (a, b)
    G.grid(Q, UV, 'buckle', 'coat_tl', accent=acc, closed=True, gain=0.9, inside=K.inside)
    Q = np.zeros((2, 2, 3)); UV = np.zeros((2, 2, 2))       # the prong across the frame's opening
    for i, a in enumerate((-hw + t, hw - t * 0.5)):
        for j, b in enumerate((-0.002, 0.002)):
            Q[i, j] = p + tx * a + ty * b + n * 0.005; UV[i, j] = (a, b)
    G.grid(Q, UV, 'buckle', 'coat_tl', accent=acc, gain=0.9, inside=K.inside)


def coat_belt(K, o):
    """a band round the waist over the cloth (the pilot's), a buckle frame at the front"""
    acc = o.get('belt_accent', 0)
    G, S, PH, info = K.G, K.S, K.PH, K.info
    zbelt = info['zbelt']
    NB = 120
    phis = np.linspace(-math.pi * 0.98, math.pi * 0.98, NB)
    bw, bt = o.get('belt_w', 0.022), o.get('belt_t', 0.008)
    bz = [zbelt - bw, zbelt - bw, zbelt + bw, zbelt + bw]
    bo = [0.002, bt, bt, 0.002]
    Q = np.zeros((4, NB, 3)); UV = np.zeros((4, NB, 2))
    for k, ph in enumerate(phis):
        for i in range(4):
            best = None
            for q in (ph, ph - TAU, ph + TAU):
                if PH[:, -1].min() - 0.01 <= q <= PH[:, 0].max() + 0.01:
                    p = S.at(bz[i], q); d = dirv(ph)
                    rr = p[0] * d[0] + (p[1] - info['cen'][0, 1]) * d[1]
                    if best is None or rr > best[0]:
                        best = (rr, p, q)
            if best is None:               # (an open front: past the sheet's edge the band stops at the edge)
                lo, hi = PH[:, -1].min(), PH[:, 0].max()
                q = min((min(max(c, lo), hi) for c in (ph, ph - TAU, ph + TAU)), key=lambda c, ph=ph: min(abs(c - ph), abs(c - ph + TAU), abs(c - ph - TAU)))
                best = (0, S.at(bz[i], q), q)
            Q[i, k] = best[1] + S.normal(bz[i], best[2]) * bo[i]
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Q[1], axis=0), axis=1))])
    UV[:, :, 0] = s[None, :]; UV[:, :, 1] = np.array([0, 0.006, 0.05, 0.056])[:, None]
    G.grid(Q, UV, 'belt', 'coat_tl', accent=acc, closed=True, gain=0.9, phi=np.tile(phis, (4, 1)), inside=K.inside)
    if o.get('buckle') is False:          # a sash / a cord: no buckle
        return
    p, n, tx, ty, _ = K.frame(zbelt, 0.012, 0.012)
    outer, inner = [(-0.028, -0.032), (0.028, -0.032), (0.028, 0.032), (-0.028, 0.032)], [(-0.019, -0.023), (0.019, -0.023), (0.019, 0.023), (-0.019, 0.023)]
    Q = np.zeros((2, 4, 3)); UV = np.zeros((2, 4, 2))
    for i, ring in enumerate((outer, inner)):
        for k, (a, b) in enumerate(ring):
            Q[i, k] = p + tx * a + ty * b + n * (0.002 if i else 0.0); UV[i, k] = (a, b)
    G.grid(Q, UV, 'buckle', 'coat_tl', accent=o.get('buckle_accent', 1), closed=True, gain=0.9, inside=K.inside)


def coat_pockets(K, o):
    G, S = K.G, K.S
    zbelt = K.info['zbelt']
    for kind, dz, x, w, hgt in o.get('pockets', []):
        if kind == 'flap':          # a slanted flap on the hip (the pilot's)
            for side in (1, -1):
                Q = np.zeros((3, 6, 3)); UV = np.zeros((3, 6, 2))
                for k in range(6):
                    u = k / 5.0
                    ph0 = side * (x + w * u)
                    q = ph0 - TAU if side > 0 else ph0
                    for i, d2 in enumerate((0.0, hgt * 0.5, hgt)):
                        z = zbelt + dz + 0.03 * u + d2
                        n = S.normal(z, q)
                        Q[i, k] = S.at(z, q) + n * (0.0045 if i < 2 else 0.003)
                        UV[i, k] = (u * 0.15, d2)
                G.grid(Q, UV, 'pocket', 'coat_tl', gain=np.array([[0.55] * 6, [0.95] * 6, [0.9] * 6]), inside=K.inside)
        else:                       # 'patch' (both hips) / 'chest' (the wearer's left breast): a sewn-on square, its mouth darker
            sides = (1,) if kind == 'chest' else (1, -1)          # ('chest2' = a pocket on each breast; 'chestflap' = + a buttoned flap: the work shirt)
            for side in sides:
                nu, nv = 6, 6
                Q = np.zeros((nv, nu, 3)); UV = np.zeros((nv, nu, 2)); Gn = np.ones((nv, nu))
                p0, n0, tx0, ty0, q0 = K.frame(zbelt + dz, side * x)
                for j in range(nv):
                    for i in range(nu):
                        a = (i / (nu - 1) - 0.5) * w; b = (j / (nv - 1)) * hgt
                        qq = K.S.arc_phi(zbelt + dz + b, q0, a) if abs(a) > 1e-6 else q0
                        pz = zbelt + dz + b
                        n = S.normal(pz, qq)
                        edge = (i in (0, nu - 1)) or j == 0
                        Q[j, i] = S.at(pz, qq) + n * (0.0025 if edge else 0.004)
                        UV[j, i] = (a, b)
                        Gn[j, i] = 0.6 if j == nv - 1 else (0.85 if edge else 0.97)
                G.grid(Q, UV, 'pocket', 'coat_tl', gain=Gn, inside=K.inside)
                if kind == 'chestflap':        # the flap over the pocket's mouth: a little wider, standing off it, its lower edge in shadow
                    fh = 0.032
                    Q = np.zeros((3, nu, 3)); UV = np.zeros((3, nu, 2)); Gn = np.ones((3, nu))
                    for j, b in enumerate((hgt + 0.006, hgt - fh * 0.5, hgt - fh)):
                        for i in range(nu):
                            a = (i / (nu - 1) - 0.5) * (w + 0.008)
                            pz = zbelt + dz + b
                            qq = K.S.arc_phi(pz, q0, a) if abs(a) > 1e-6 else q0
                            Q[j, i] = S.at(pz, qq) + S.normal(pz, qq) * (0.0045 if j == 0 else 0.0062)
                            UV[j, i] = (a, b)
                            Gn[j, i] = 0.7 if j == 0 else (0.98 if j == 1 else 0.62)
                    G.grid(Q, UV, 'pocket', 'coat_tl', gain=Gn, inside=K.inside)
                    if o.get('flap_buttons'):
                        pz = zbelt + dz + hgt - fh * 0.62
                        p_ = S.at(pz, q0); n_ = S.normal(pz, q0)
                        disc(G, p_ + n_ * 0.0062, n_, 0.0055, 'button', 'coat_tl', o['flap_buttons'], h=0.0025, seg=10)


def coat_epaulettes(K, o):
    G, S, zs, R = K.G, K.S, K.zs, K.R
    zt = o['top']
    for side in (1, -1):
        rows = [r for r in range(R) if zt - 0.065 <= zs[r] <= zt - 0.012]
        Q = np.zeros((len(rows), 3, 3)); UV = np.zeros((len(rows), 3, 2))
        q0 = (math.pi / 2) * side
        q0 = q0 - TAU if side > 0 else q0
        for i, r in enumerate(rows[::-1]):
            for j, dw in enumerate((-0.022, 0.0, 0.022)):
                qq = S.arc_phi(zs[r], q0, dw)
                Q[i, j] = S.at(zs[r], qq) + S.normal(zs[r], qq) * (0.0055 if j == 1 else 0.0038)
                UV[i, j] = (dw, zs[r])
        G.grid(Q, UV, 'epaulette', 'coat_tl', accent=o.get('epaulette_accent', 0), gain=0.9, inside=K.inside)


def coat_cuffs(K, sleeves, o):
    """the sleeve ends: a turned-in facing; 'turn' = a deep turned-back cuff over the sleeve end (+ its buttons), 'strap'"""
    G = K.G
    kind = o.get('cuff', 'facing')
    for side, (SP, SUV, si) in sleeves.items():
        Ks = SP.shape[1]
        last = SP[-1]; ctr = last.mean(axis=0)
        t = si['frames'][-1][1]
        grp = 'coat_arm_' + side
        Q = np.zeros((2, Ks, 3)); UV = np.zeros((2, Ks, 2))
        for k in range(Ks):
            radial = last[k] - ctr; radial /= np.linalg.norm(radial)
            Q[0, k] = last[k] - radial * 0.0005
            Q[1, k] = last[k] - t * 0.02 - radial * 0.004
            UV[0, k] = SUV[-1, k]; UV[1, k] = SUV[-1, k] + np.array([0, 0.02])
        G.grid(Q, UV, 'facing', grp, closed=True, gain=0.8, inside=lambda p, c=ctr: c)
        ss = si['ss']
        if kind == 'turn':
            depth = o.get('cuff_h', 0.10)
            i0 = len(ss) - max(2, int(round(depth / 0.026)))    # a fixed ring count (the same topology on every body)
            rings = list(range(i0, len(ss)))
            Q = np.zeros((len(rings) + 1, Ks, 3)); UV = np.zeros((len(rings) + 1, Ks, 2))
            for j, ii in enumerate(rings):
                ring = SP[ii]; c = ring.mean(axis=0)
                fl = (j / max(1, len(rings) - 1))
                for k in range(Ks):
                    radial = ring[k] - c; radial /= np.linalg.norm(radial)
                    Q[j + 1, k] = ring[k] + radial * (0.007 + o.get('cuff_flare', 0.012) * fl)
                    UV[j + 1, k] = SUV[ii, k]
            ring = SP[rings[0]]; c = ring.mean(axis=0)
            for k in range(Ks):
                radial = ring[k] - c; radial /= np.linalg.norm(radial)
                Q[0, k] = ring[k] + radial * 0.001; UV[0, k] = SUV[rings[0], k] - np.array([0, 0.01])
            G.grid(Q, UV, 'cuff', grp, accent=o.get('cuff_accent', 0), closed=True, gain=np.vstack([np.full((1, Ks), 0.6), np.full((len(rings), Ks), 0.95)]),
                   inside=lambda p, c=SP[rings[-1]].mean(axis=0): c)
            if o.get('cuff_buttons'):
                p_, t_, n_, b_ = si['frames'][rings[len(rings) // 2]]
                for kk in (0.25, 0.75):
                    ii = rings[int(kk * (len(rings) - 1))]
                    ring = SP[ii]; c = ring.mean(axis=0)
                    k = int(np.argmax([(ring[q] - c) @ np.array([0, -1.0, 0]) for q in range(Ks)]))   # the front of the cuff
                    nrm = ring[k] - c; nrm /= np.linalg.norm(nrm)
                    disc(G, ring[k] + nrm * (0.007 + o.get('cuff_flare', 0.012) * kk + 0.001), nrm, 0.008, 'button', grp, o['cuff_buttons'], h=0.004, seg=10, tx=si['frames'][ii][1])
        elif kind == 'strap':
            i0 = len(ss) - 4
            Q = np.zeros((2, Ks, 3)); UV = np.zeros((2, Ks, 2))
            for j, ii in enumerate((i0, i0 + 1)):
                ring = SP[ii]; c = ring.mean(axis=0)
                for k in range(Ks):
                    radial = ring[k] - c; radial /= np.linalg.norm(radial)
                    Q[j, k] = ring[k] + radial * 0.0045; UV[j, k] = SUV[ii, k]
            G.grid(Q, UV, 'strap', grp, closed=True, gain=0.88, inside=lambda p, c=SP[i0].mean(axis=0): c)


def coat_chains(K, o):
    """THE SWAY for coat tails: chains down the back skirt from the waist (the tailcoat's tails)"""
    sw = o.get('sway')
    if not sw:
        return
    P, PH, zs, C = K.P, K.PH, K.zs, K.C
    zb = K.info['zbelt'] - sw.get('below', 0.05)
    r0 = int(np.argmin(np.abs(zs - zb)))
    chains = []
    for frac in sw['cols']:                      # frac of the way across the bottom row (0.5 = the back centre)
        c = int(round(frac * (C - 1)))
        js = np.round(np.linspace(r0, 0, sw.get('joints', 4))).astype(int)
        chains.append([int(r * C + c) for r in js])
    K.G.chains = chains
    K.G.split_phi = 0.5 * (PH[0, C // 2 - 1] + PH[0, C // 2]) if o.get('vent') else None   # each tail swings on its own chains
    K.G.chain_parent = sw.get('parent', 'pelvis')
    if sw.get('legs'):                           # a skirt: a chain over a thigh hangs from that thigh (the leg carries it, then it swings)
        K.G.chain_parents = []
        for frac in sw['cols']:
            x = math.sin(PH[0, int(round(frac * (C - 1)))])     # (dirv: x = sin phi; + = the wearer's left)
            K.G.chain_parents.append('thigh_l' if x > 0.3 else 'thigh_r' if x < -0.3 else K.G.chain_parent)
    K.G.anchor_z = zb


def build_coat(co, dom, inbody, pts, o):
    G = Garment()
    P, UV, info = coat_sheet(co, dom, inbody, o)
    cen, zs = info['cen'], info['zs']
    if o.get('neck_dip'):                   # THE BLENDER SHIRTS: the neckline dips at the front (the level top row sat 5 cm up the throat)
        R_, C_ = P.shape[:2]
        zt_, dip = zs[-1], o['neck_dip']
        P0 = P.copy()
        for c in range(C_):
            w = max(0.0, math.cos(info['PH'][-1, c])) ** 2
            if w <= 0:
                continue
            for r in range(R_):
                z = zs[r]
                if z < zt_ - 0.09:
                    continue
                z2 = z - dip * w * float(smoothstep(zt_ - 0.09, zt_, z))
                r1 = int(np.clip(np.searchsorted(zs, z2), 1, R_ - 1)); r0 = r1 - 1
                t = (z2 - zs[r0]) / max(1e-9, zs[r1] - zs[r0])
                P[r, c] = P0[r0, c] * (1 - t) + P0[r1, c] * t
    inside = lambda p: np.array([0.0, float(np.interp(p[2], zs, cen[:, 1])), p[2]])
    f0 = len(G.F)
    G.grid(P, UV, 'sheet', 'coat_tl', phi=info['PH'], inside=inside)
    if o.get('vent'):                       # cut the vent: the faces across the back centre below its top
        R, C = P.shape[:2]
        zv = info['zbelt'] + o['vent'][0]
        cut_f = set(f0 + r * (C - 1) + (C // 2 - 1) for r in range(R - 1) if zs[r + 1] <= zv + 1e-6)
        keep = [i for i in range(len(G.F)) if i not in cut_f]
        G.F = [G.F[i] for i in keep]; G.FUV = [G.FUV[i] for i in keep]
    sleeves = {}
    for s in (() if (o.get('skirt') and not o.get('sleeve_from')) or o.get('sleeveless') else ('l', 'r')):     # (a skirt / a waistcoat: no sleeves)
        SP, SUV, si = PG.sleeve(co, dom, inbody, pts, s, ease0=o.get('sleeve_ease', 0.019), ease1=o.get('cuff_ease', 0.012))
        if o.get('sleeve_rings'):           # a short / 3-4 sleeve: the first n rings (a fixed count: one topology)
            n0, n = o.get('sleeve_from', 0), o['sleeve_rings']     # (sleeve_from: the off-shoulder band starts down the arm)
            SP, SUV = SP[n0:n], SUV[n0:n]
            si = dict(si, ss=si['ss'][n0:n], frames=si['frames'][n0:n])
        sleeves[s] = (SP, SUV, si)
        ctr = SP.mean(axis=1)
        G.grid(SP, SUV, 'sleeve', 'coat_arm_' + s, closed=True,
               inside=lambda p, SP=SP, ctr=ctr: ctr[int(np.argmin(np.linalg.norm(SP.reshape(-1, 3) - p, axis=1))) // SP.shape[1]])
    K = CoatKit(G, P, info, inside)
    K.body = (co, dom, inbody)
    coat_facings(K, o)
    if o.get('lapel'):
        coat_lapels(K, o)
    if o.get('collar') in ('shirt', 'polo'):
        shirt_collar(K, o)
    elif o.get('collar'):
        coat_collar(K, o)
    if o.get('trim'):
        coat_trim(K, o)
    if o.get('belt_on'):
        coat_belt(K, o)
    coat_buttons(K, o)
    coat_pockets(K, o)
    if o.get('epaulettes'):
        coat_epaulettes(K, o)
    coat_cuffs(K, sleeves, o)
    coat_extras(K, sleeves, o)
    coat_chains(K, o)
    if o.get('buckle_at') is not None:      # THE BLENDER BELT: the buckle on the band itself
        coat_buckle(K, o, o['top'] + o['buckle_at'], o.get('buckle_accent', 1))
    if o.get('armholes'):                   # THE WAISTCOAT: the sheet's sides above the armpits cut away (the shirt's shoulders show)
        cache = o.get('_cache', {})
        zarm, xa = o['armholes']
        if 'armholes' not in cache:         # (chosen on the first body built, the male: every body drops the same faces)
            cache['armholes'] = set(k for k, fc in enumerate(G.F) if G.T[fc[0]][0] == 'sheet'
                                    and float(np.mean([G.V[v][2] for v in fc])) > zarm and abs(float(np.mean([G.V[v][0] for v in fc]))) > xa)
        keep = [i for i in range(len(G.F)) if i not in cache['armholes']]
        G.F = [G.F[i] for i in keep]; G.FUV = [G.FUV[i] for i in keep]
    if o.get('flaps'):                      # THE LOINCLOTH: below the cut only the front / back flaps stay (phi windows round 0 and pi)
        zc = info['zbelt'] + o['flaps'][0]
        hf, hb = o['flaps'][1], o['flaps'][2]

        def keep_phi(ph):
            a = (ph + math.pi) % TAU - math.pi
            return abs(a) <= hf or abs(abs(a) - math.pi) <= hb
        cache = o.get('_cache', {})
        if 'flaps' not in cache:            # (chosen on the first body built, the male: every body drops the same faces)
            dr = []
            for k, fc in enumerate(G.F):
                if G.T[fc[0]][3] != 'coat_tl':
                    continue
                ph = [G.T[v][1] for v in fc]
                if any(math.isnan(x) for x in ph):
                    continue
                if max(G.V[v][2] for v in fc) < zc and not keep_phi(float(np.mean(ph))):
                    dr.append(k)
            cache['flaps'] = set(dr)
        keep = [i for i in range(len(G.F)) if i not in cache['flaps']]
        G.F = [G.F[i] for i in keep]; G.FUV = [G.FUV[i] for i in keep]
    return G


BUTTON_HORN = {'color': [0.16, 0.12, 0.09], 'rough': 0.45, 'metal': 0.0}
BUTTON_WHITE = {'color': [0.92, 0.92, 0.90], 'rough': 0.4, 'metal': 0.0}
BUTTON_BLACK = {'color': [0.05, 0.05, 0.06], 'rough': 0.35, 'metal': 0.2}
BRASS = {'color': [0.70, 0.55, 0.25], 'rough': 0.4, 'metal': 0.8}


def dbl(zs, x=0.068):
    return [(z, s * x) for z in zs for s in (-1, 1)]


SKIRT_SWAY = dict(cols=(0.04, 0.17, 0.30, 0.43, 0.57, 0.70, 0.83, 0.96), joints=3, below=0.10, parent='pelvis', legs=True)   # THE SWAY round a skirt


# label, the coded twin a classic Meshy base wears (CC_OUTER), the look the pick starts at (the race it was made for)
COATS = {
    'duster': dict(label='Duster', twin='trench', color='#8a6a45', fabric='canvas', hem=0.20, zb=1.36, front='single', flare=0.10, back_flare=0.03,
                   ease=0.026, skirt_ease=0.03, folds=0.011, fold_n=9, lapel='notch', lapel_w=0.06, collar='fold',
                   buttons=[(0.05, 0.03), (0.13, 0.03), (0.21, 0.03), (-0.06, 0.03)], button=(0.010, 1), accents=[BUTTON_HORN],
                   pockets=[('flap', -0.13, 0.62, 0.42, 0.055)], cuff='strap', vent=(-0.30, 0.025)),
    'pirate': dict(label='Pirate coat', twin='coat', color='#6e1c1c', fabric='wool', hem=0.40, zb=1.62, front='open', gap=0.055, neck_x=0.07, flare=0.16,
                   back_flare=0.03, ease=0.024, skirt_ease=0.034, folds=0.014, fold_n=9, collar='stand',
                   trim=(1, 0.022), buttons=[(dz, s * 0.088) for dz in (0.02, 0.09, 0.16, 0.23, 0.30) for s in (-1, 1)], button=(0.009, 1),
                   accents=[GOLD], cuff='turn', cuff_h=0.12, cuff_flare=0.016, cuff_buttons=1, pockets=[('flap', -0.10, 0.70, 0.40, 0.06)]),
    'leather': dict(label='Leather coat', twin='trench', color='#151517', fabric='leather', hem=0.10, zb=1.61, front='closed', flare=0.07,
                    ease=0.026, skirt_ease=0.03, waist_ease=0.026, folds=0.008, fold_n=8, collar='tall',
                    buttons=[(dz, -0.018) for dz in (0.03, 0.12, 0.21, 0.30, 0.39)], button=(0.008, 1), accents=[BUTTON_BLACK], cuff='facing'),
    'longcoat': dict(label='Long coat', twin='coat', color='#3d4148', fabric='wool', hem=0.46, zb=1.30, front='single', flare=0.06,
                     ease=0.024, skirt_ease=0.028, lapel='notch', lapel_w=0.075, collar='fold',
                     buttons=[(0.03, 0.03), (0.12, 0.03), (0.21, 0.03)], button=(0.011, 1), accents=[BUTTON_HORN],
                     pockets=[('flap', -0.12, 0.62, 0.42, 0.05)], cuff='facing'),
    'greatcoat': dict(label='Greatcoat', twin='trench', color='#4c5236', fabric='wool', hem=0.22, zb=1.40, front='double', flare=0.09, back_flare=0.02,
                      ease=0.028, skirt_ease=0.032, folds=0.010, lapel='notch', lapel_w=0.095, collar='big',
                      buttons=dbl((0.04, 0.13, 0.22, 0.31), 0.075), button=(0.011, 1), accents=[BRASS], belt_on=True, belt_accent=0, buckle_accent=1,
                      epaulettes=True, pockets=[('flap', -0.14, 0.62, 0.42, 0.06)], cuff='turn', cuff_h=0.09, cuff_flare=0.006),
    'overcoat': dict(label='Overcoat', twin='coat', color='#5a5048', fabric='wool', hem=0.38, zb=1.24, front='single', flare=0.06,
                     ease=0.026, skirt_ease=0.03, lapel='notch', lapel_w=0.085, collar='popped',
                     buttons=[(0.02, 0.03), (0.11, 0.03)], button=(0.012, 1), accents=[BUTTON_HORN],
                     pockets=[('flap', -0.12, 0.62, 0.42, 0.05)], cuff='facing'),
    'frock': dict(label='Frock coat', twin='coat', color='#1d1a24', fabric='velvet', hem=0.42, zb=1.42, front='single', flare=0.13, back_flare=0.04,
                  ease=0.026, skirt_ease=0.03, waist_ease=0.026, folds=0.012, fold_n=10, lapel='notch', lapel_w=0.06, collar='fold',
                  buttons=[(dz, 0.03) for dz in (0.02, 0.08, 0.14, 0.20, 0.26)], button=(0.009, 1), accents=[BUTTON_BLACK], cuff='turn', cuff_h=0.07, cuff_flare=0.004),
    'tailcoat': dict(label='Tailcoat', twin='blazer', color='#a3161c', fabric='wool', hem=0.48, zb=1.31, front='double', flare=0.05,
                     ease=0.026, skirt_ease=0.028, waist_ease=0.026, folds=0.006, lapel='peak', lapel_w=0.08, lapel_accent=0, collar='fold',
                     cut=(0.0, 1.95, 0.10, 2.55), vent=(-0.05, 0.05), trim=(1, 0.012),
                     buttons=dbl((0.03, 0.10, 0.17), 0.072), button=(0.010, 1), accents=[GOLD], cuff='turn', cuff_h=0.08, cuff_flare=0.004, cuff_buttons=1,
                     sway=dict(cols=(0.30, 0.44, 0.56, 0.70), joints=4, below=0.06, parent='pelvis')),
    'labcoat': dict(label='Lab coat', twin='coat', color='#eef0ee', fabric='cotton', hem=0.48, zb=1.26, front='single', flare=0.05,
                    ease=0.028, skirt_ease=0.03, folds=0.007, lapel='notch', lapel_w=0.07, collar='fold',
                    buttons=[(0.0, 0.03), (0.10, 0.03), (0.20, 0.03), (-0.10, 0.03)], button=(0.009, 1), accents=[BUTTON_WHITE],
                    pockets=[('patch', -0.20, 0.10, 0.15, 0.16), ('chest', 0.25, 0.095, 0.10, 0.11)], cuff='facing'),
    # ── 4d batch 3: THE ROBES (to the ankle; wide sleeves = a big cuff ease) ──
    'cassock': dict(label='Cassock', twin='coat', color='#121214', fabric='wool', hem=0.05, zb=1.70, front='closed', flare=0.07,
                    ease=0.026, skirt_ease=0.03, waist_ease=0.026, folds=0.008, collar='stand',
                    buttons=[(round(-0.62 + 0.045 * i, 3), -0.016) for i in range(25)], button=(0.0065, 1), accents=[BUTTON_BLACK],
                    cuff='facing', collar_accent=2, extra_accents=[{'color': [0.95, 0.95, 0.93], 'rough': 0.6, 'metal': 0.0}]),
    'habit': dict(label="Nun's habit", twin='coat', color='#141416', fabric='wool', hem=0.03, zb=1.70, front='closed', flare=0.12, back_flare=0.02,
                  ease=0.03, skirt_ease=0.034, waist_ease=0.03, folds=0.014, fold_n=10, collar='big', collar_accent=1,
                  accents=[{'color': [0.95, 0.95, 0.93], 'rough': 0.7, 'metal': 0.0}, {'color': [0.05, 0.05, 0.05], 'rough': 0.8, 'metal': 0.0}],
                  belt_on=True, belt_w=0.008, belt_t=0.006, buckle=False, belt_accent=2, cuff='facing', sleeve_ease=0.026, cuff_ease=0.06),
    'cultrobe': dict(label='White robe', twin='coat', color='#f2f0ea', fabric='cotton', hem=0.04, zb=1.30, front='single', flare=0.10,
                     ease=0.03, skirt_ease=0.034, waist_ease=0.03, folds=0.012, fold_n=9, collar='fold',
                     accents=[GOLD], belt_on=True, belt_w=0.009, belt_t=0.007, buckle=False, belt_accent=1,
                     cuff='facing', sleeve_ease=0.022, cuff_ease=0.075),
    'anunnaki': dict(label='Annunaki robe', twin='coat', color='#d9c7a0', fabric='silk', hem=0.04, zb=1.36, front='single', flare=0.09,
                     ease=0.028, skirt_ease=0.032, waist_ease=0.028, folds=0.010, collar='stand', collar_accent=1, trim=(1, 0.03),
                     accents=[GOLD], belt_on=True, belt_w=0.03, belt_t=0.008, buckle=False, belt_accent=1,
                     cuff='turn', cuff_h=0.07, cuff_flare=0.02, cuff_accent=1, sleeve_ease=0.028, cuff_ease=0.05),
    'succubus': dict(label='Silk robe', twin='coat', color='#5a0f1e', fabric='silk', hem=0.06, zb=1.08, front='single', flare=0.11, back_flare=0.02,
                     ease=0.026, skirt_ease=0.03, waist_ease=0.026, folds=0.014, fold_n=10, lapel='notch', lapel_w=0.05, collar=None,
                     belt_on=True, belt_w=0.018, belt_t=0.007, buckle=False, belt_accent=0,
                     cuff='facing', sleeve_ease=0.022, cuff_ease=0.075),
    'raggedrobe': dict(label='Ragged robe', twin='coat', color='#6b5a44', fabric='canvas', hem=0.12, zb=1.34, front='single', flare=0.10,
                       ease=0.032, skirt_ease=0.036, waist_ease=0.032, folds=0.016, fold_n=7, ragged=0.13, collar=None,
                       accents=[{'color': [0.45, 0.36, 0.24], 'rough': 0.95, 'metal': 0.0}], belt_on=True, belt_w=0.008, belt_t=0.01, buckle=False, belt_accent=1,
                       cuff='facing', sleeve_ease=0.034, cuff_ease=0.05),
    # ── 4d batch 4: UNIFORMS + FIGHTERS (hip / thigh length tops) ──
    'police': dict(label='Police uniform', twin='jacket', color='#1c2740', fabric='cotton', hem=0.93, zb=1.50, front='single', flare=0.02,
                   ease=0.024, skirt_ease=0.026, folds=0.003, collar='fold', neck_x=0.06,
                   buttons=[(dz, 0.03) for dz in (0.05, 0.14, 0.23, 0.32, 0.41)], button=(0.0075, 1), accents=[SILVER, GOLD, BUTTON_BLACK],
                   pockets=[('chest2', 0.27, 0.09, 0.10, 0.11)], epaulettes=True, belt_on=True, belt_accent=3, buckle_accent=1,
                   badge=(0.40, 0.095, 0.022, 2), cuff='facing'),
    'general': dict(label='General uniform', twin='blazer', color='#3f4a30', fabric='wool', hem=0.91, zb=1.28, front='single', flare=0.03,
                    ease=0.022, skirt_ease=0.026, folds=0.003, lapel='notch', lapel_w=0.07, collar='fold',
                    buttons=[(dz, 0.03) for dz in (0.0, 0.09, 0.18)], button=(0.0105, 1), accents=[GOLD, {'color': [0.62, 0.08, 0.1], 'rough': 0.6}, {'color': [0.12, 0.22, 0.55], 'rough': 0.6}],
                    epaulettes=True, epaulette_accent=1, pockets=[('flap', -0.08, 0.66, 0.40, 0.05), ('chest2', 0.25, 0.10, 0.10, 0.10)],
                    ribbons=[(0.36, 0.105, 0.035, 0.012, 2), (0.36, 0.07, 0.035, 0.012, 3), (0.375, 0.088, 0.035, 0.012, 1)],
                    cuff='strap', belt_on=True, belt_w=0.02, belt_accent=0, buckle_accent=1),
    'turnout': dict(label='Turnout coat', twin='parka', color='#b59a62', fabric='canvas', hem=0.70, zb=1.62, front='closed', flare=0.05,
                    ease=0.04, skirt_ease=0.04, waist_ease=0.04, folds=0.006, collar='tall', sleeve_ease=0.028, cuff_ease=0.022,
                    accents=[{'color': [0.85, 0.9, 0.22], 'rough': 0.5, 'metal': 0.0}, {'color': [0.75, 0.77, 0.8], 'rough': 0.25, 'metal': 0.6}],
                    bands=[(0.30, 0.018, 0.006, 1), (-0.22, 0.018, 0.006, 1)], sleeve_bands=[(3, 1), (11, 1)],
                    buttons=[(dz, -0.02) for dz in (-0.12, 0.0, 0.12, 0.24, 0.36)], button=(0.012, 2), pockets=[('patch', -0.24, 0.12, 0.16, 0.17)], cuff='facing'),
    'riot': dict(label='Riot suit', twin='jacket', color='#17181b', fabric='nylon', hem=0.93, zb=1.62, front='closed', flare=0.02, pads=0.035,
                 ease=0.032, skirt_ease=0.03, waist_ease=0.03, folds=0.002, collar='tall', sleeve_ease=0.03, cuff_ease=0.018,
                 accents=[{'color': [0.2, 0.21, 0.23], 'rough': 0.4, 'metal': 0.25}], bands=[(0.27, 0.085, 0.014, 1)],
                 sleeve_bands=[(5, 1), (13, 1)], belt_on=True, belt_w=0.028, belt_t=0.012, belt_accent=1, buckle_accent=1, cuff='facing'),
    'chef': dict(label='Chef jacket', twin='jacket', color='#f4f4f0', fabric='cotton', hem=0.91, zb=1.62, front='double', flare=0.03,
                 ease=0.026, skirt_ease=0.028, waist_ease=0.026, folds=0.003, collar='stand',
                 buttons=dbl((0.06, 0.16, 0.26, 0.36), 0.07), button=(0.010, 1), accents=[{'color': [0.93, 0.93, 0.9], 'rough': 0.5}],
                 cuff='turn', cuff_h=0.07, cuff_flare=0.004),
    'gi': dict(label='Gi', twin='jacket', color='#f1efe8', fabric='canvas', hem=0.84, zb=1.02, front='double', neck_x=0.06, flare=0.05,
               ease=0.03, skirt_ease=0.032, waist_ease=0.026, folds=0.006, trim=(0, 0.05), sleeve_rings=22, sleeve_ease=0.026, cuff_ease=0.04,
               accents=[{'color': [0.07, 0.07, 0.08], 'rough': 0.85}], belt_on=True, belt_w=0.022, belt_t=0.01, buckle=False, belt_accent=1,
               sash_tails=(1, 0.26), cuff='facing'),
    'jersey': dict(label='Football jersey', twin='hoodie', color='#7a1b1b', fabric='mesh', hem=0.93, zb=1.48, front='open', gap=0.0, neck_x=0.045, flare=0.03,
                   ease=0.04, skirt_ease=0.034, waist_ease=0.036, folds=0.004, pads=0.05, sleeve_rings=15, sleeve_ease=0.05, cuff_ease=0.035,
                   accents=[{'color': [0.95, 0.95, 0.93], 'rough': 0.7}], sleeve_bands=[(2, 1), (4, 1)], trim=(1, 0.012), cuff='facing'),
    # ── 4d batch 5a: THE COSTUMES (coat-built tops; fur trims / harness / fringe / patches are accents) ──
    'santa': dict(label='Santa coat', twin='coat', color='#b3141c', fabric='velvet', hem=0.70, zb=1.62, front='closed', flare=0.10,
                  ease=0.032, skirt_ease=0.036, waist_ease=0.034, folds=0.010, fold_n=9, collar='stand', collar_accent=1, trim=(1, 0.05),
                  accents=[{'color': [0.97, 0.96, 0.93], 'rough': 1.0, 'metal': 0.0}, {'color': [0.05, 0.05, 0.05], 'rough': 0.45, 'metal': 0.1}, GOLD],
                  belt_on=True, belt_w=0.034, belt_t=0.010, belt_accent=2, buckle_accent=3,
                  cuff='turn', cuff_h=0.09, cuff_flare=0.014, cuff_accent=1, sleeve_ease=0.024, cuff_ease=0.02),
    'robinhood': dict(label='Robin Hood tunic', twin='jacket', color='#3f6b2a', fabric='wool', hem=0.76, zb=1.52, front='closed', flare=0.08,
                      ease=0.028, skirt_ease=0.032, waist_ease=0.028, folds=0.010, fold_n=8, ragged=0.06, collar=None,
                      accents=[{'color': [0.36, 0.22, 0.12], 'rough': 0.7, 'metal': 0.0}, BRASS],
                      belt_on=True, belt_w=0.016, belt_t=0.008, belt_accent=1, buckle_accent=2, cuff='facing'),
    'tabard': dict(label='Knight tabard', twin='coat', color='#eae6da', fabric='cotton', hem=0.52, zb=1.62, front='closed', flare=0.05,
                   ease=0.036, skirt_ease=0.034, waist_ease=0.034, folds=0.007, fold_n=6, collar=None, vent=(-0.12, 0.03), trim=(2, 0.018),
                   sleeve_rings=4, sleeve_ease=0.03, cuff_ease=0.03,
                   accents=[{'color': [0.66, 0.06, 0.08], 'rough': 0.7, 'metal': 0.0}, GOLD, {'color': [0.30, 0.20, 0.12], 'rough': 0.6, 'metal': 0.0}],
                   trim_hem=True, emblem=[(0.03, 0.012, 0.07, 0.42, 1), (0.27, 0.012, 0.25, 0.07, 1)],   # (the cross on the chest: below the hips a stride stretches the skirt front)
                   belt_on=True, belt_w=0.014, belt_t=0.007, belt_accent=3, buckle_accent=2, cuff='facing'),
    'krampus': dict(label='Krampus fur coat', twin='coat', color='#5a4636', fabric='suede', own={'tile': 'fur', 'tile_m': 0.12},
                    hem=0.42, zb=1.62, front='closed', flare=0.12, back_flare=0.03,
                    ease=0.036, skirt_ease=0.04, waist_ease=0.036, folds=0.014, fold_n=7, ragged=0.09, collar='big',
                    accents=[{'color': [0.08, 0.06, 0.05], 'rough': 0.5, 'metal': 0.1}, {'color': [0.55, 0.55, 0.57], 'rough': 0.35, 'metal': 0.85}],
                    harness=(1, 0.045), belt_on=True, belt_w=0.026, belt_t=0.012, belt_accent=1, buckle_accent=2,
                    cuff='facing', sleeve_ease=0.03, cuff_ease=0.035),
    'fringe': dict(label='Fringe jacket', twin='jacket', color='#a0703f', fabric='suede', hem=0.93, zb=1.34, front='open', gap=0.035, flare=0.02,
                   ease=0.026, skirt_ease=0.028, waist_ease=0.026, folds=0.003, collar='fold',
                   accents=[{'color': [0.62, 0.43, 0.24], 'rough': 0.9, 'metal': 0.0}],
                   fringe=[(0.30, -0.16, -0.06, 0.085, 1), (0.30, 0.06, 0.16, 0.085, 1), (-0.045, -0.15, -0.05, 0.07, 1), (-0.045, 0.05, 0.15, 0.07, 1)],
                   cuff='facing'),
    'scarecrow': dict(label='Scarecrow tunic', twin='jacket', color='#9c7f4e', fabric='canvas', hem=0.80, zb=1.62, front='closed', flare=0.08,
                      ease=0.034, skirt_ease=0.038, waist_ease=0.034, folds=0.014, fold_n=7, ragged=0.10, collar=None,
                      accents=[{'color': [0.42, 0.30, 0.42], 'rough': 0.9}, {'color': [0.32, 0.45, 0.30], 'rough': 0.9},
                               {'color': [0.72, 0.62, 0.38], 'rough': 0.95}, {'color': [0.80, 0.68, 0.30], 'rough': 0.95}],
                      ribbons=[(0.22, 0.085, 0.075, 0.075, 1), (-0.12, -0.075, 0.09, 0.07, 2), (0.06, -0.11, 0.06, 0.06, 1)],
                      buttons=[(dz, -0.016) for dz in (0.08, 0.20, 0.32)], button=(0.011, 4),
                      belt_on=True, belt_w=0.008, belt_t=0.011, buckle=False, belt_accent=3,
                      cuff='facing', sleeve_ease=0.03, cuff_ease=0.04),
    'zombie': dict(label='Tattered shirt', twin='jacket', color='#7d7a68', fabric='cotton', hem=0.90, zb=1.40, front='open', gap=0.02, flare=0.04,
                   ease=0.03, skirt_ease=0.032, waist_ease=0.03, folds=0.006, ragged=0.11, collar='fold',
                   sleeve_rings=11, sleeve_ease=0.03, cuff_ease=0.04, accents=[BUTTON_HORN], buttons=[(0.18, 0.03), (0.30, 0.03)], button=(0.008, 1),
                   cuff='facing'),
    'clown': dict(label='Clown suit', twin='jacket', color='#e0c43a', fabric='cotton', hem=0.84, zb=1.62, front='closed', flare=0.10,
                  ease=0.05, skirt_ease=0.05, waist_ease=0.05, folds=0.012, fold_n=8, ragged=0.05, collar='big', collar_accent=1,
                  accents=[{'color': [0.95, 0.95, 0.93], 'rough': 0.7}, {'color': [0.85, 0.08, 0.10], 'rough': 0.6}],
                  buttons=[(dz, -0.016) for dz in (-0.04, 0.10, 0.24)], button=(0.022, 2),
                  cuff='turn', cuff_h=0.06, cuff_flare=0.03, cuff_accent=1, sleeve_ease=0.04, cuff_ease=0.05),
    # ── 4d batch 5b: THE SKIRTS (skirt=True: the sheet from the hem up to a waistband, no sleeves; Bottoms picks painted by the
    #    Bottoms layer, `cat` / `z` / `layer` = a MakeHuman-clothes pick, no coded twin) + the leaf dress (an Outer pick) ──
    'raggedskirt': dict(label='Ragged skirt', skirt=True, cat='bottoms', z=48, layer='bottom', color='#3a0d10', fabric='cotton',
                        hem=0.70, front='closed', flare=0.13, ease=0.02, skirt_ease=0.03, waist_ease=0.018, folds=0.014, fold_n=9, ragged=0.11,
                        belt_on=True, belt_w=0.014, belt_t=0.006, buckle=False, belt_accent=0, sway=SKIRT_SWAY),
    'valkyrie': dict(label='Valkyrie skirt', skirt=True, cat='bottoms', z=48, layer='bottom', color='#5c6a7a', fabric='leather',
                     hem=0.64, front='closed', flare=0.12, ease=0.02, skirt_ease=0.03, waist_ease=0.018, folds=0.012, fold_n=26,
                     trim=(2, 0.022), trim_hem=True, accents=[GOLD, {'color': [0.30, 0.20, 0.12], 'rough': 0.55, 'metal': 0.0}],
                     belt_on=True, belt_w=0.03, belt_t=0.01, belt_accent=2, buckle_accent=1, sway=SKIRT_SWAY),
    'kilt': dict(label='Linen kilt', skirt=True, cat='bottoms', z=48, layer='bottom', color='#eee8d6', fabric='cotton',
                 hem=0.60, front='single', flare=0.08, ease=0.02, skirt_ease=0.028, waist_ease=0.018, folds=0.006, fold_n=34,
                 accents=[GOLD], belt_on=True, belt_w=0.026, belt_t=0.008, buckle=False, belt_accent=1, sway=SKIRT_SWAY),
    'loincloth': dict(label='Loincloth', skirt=True, cat='bottoms', z=48, layer='bottom', color='#5b4532', fabric='suede',
                      hem=0.60, front='closed', flare=0.05, ease=0.02, skirt_ease=0.026, waist_ease=0.018, folds=0.008, fold_n=7, ragged=0.06,
                      flaps=(-0.09, 0.55, 0.6), accents=[{'color': [0.22, 0.15, 0.10], 'rough': 0.6, 'metal': 0.0}],
                      belt_on=True, belt_w=0.016, belt_t=0.009, buckle=False, belt_accent=1,
                      sway=dict(cols=(0.0, 0.03, 0.47, 0.53, 0.97, 1.0), joints=3, below=0.10, parent='pelvis')),
    # ── 4d batch 5c: the belly-dancer's top + coin belt, the off-shoulder top (coat sheets above / round the hips) ──
    'bellytop': dict(label='Belly-dancer top', skirt=True, rise=0.333, cat='tops', z=52, layer='top', color='#6a1a5c', fabric='silk',
                     hem=1.28, front='closed', flare=0.0, ease=0.008, skirt_ease=0.008, waist_ease=0.008, folds=0.0,
                     accents=[GOLD], bands=[(0.222, 0.007, 0.004, 1), (0.322, 0.006, 0.004, 1)], coins=(1, 0.0085, 0.022)),
    'coinbelt': dict(label='Coin belt', skirt=True, rise=-0.045, cat='equipment', z=49, color='#6a1a5c', fabric='silk',
                     main={'color': [0.40, 0.07, 0.33], 'rough': 0.45, 'metal': 0.0},
                     hem=0.90, front='closed', flare=0.03, ease=0.016, skirt_ease=0.02, waist_ease=0.016, folds=0.006, fold_n=12,
                     accents=[GOLD], bands=[(-0.047, 0.006, 0.004, 1)], coins=(1, 0.009, 0.023)),
    'offshoulder': dict(label='Off-shoulder top', skirt=True, rise=0.333, cat='tops', z=52, layer='top', color='#14121a', fabric='cotton',
                        hem=0.93, front='closed', flare=0.02, ease=0.018, skirt_ease=0.02, waist_ease=0.018, folds=0.004,
                        collar='fold', collar_taper=1.0, sleeve_from=5, sleeve_rings=11, sleeve_ease=0.016, cuff_ease=0.02, cuff='facing'),
    # ── THE BLENDER BASICS (2026-11-02, mondo: "get rid of any classic clothes ... make sure we have a replacement"): the coded
    #    creator's Top / Outer / Belt picks the packs had no match for, rebuilt as coat sheets. Tops + the belt are MakeHuman-
    #    clothes picks painted by their layer (top / belt); the jackets are Outer picks with their coded twin (classic Meshy bodies) ──
    'longsleeve': dict(label='Long-sleeve top', cat='tops', z=52, layer='top', color='#e8e4dc', fabric='cotton', hem=0.965, zb=9.0, top_dz=-0.005,
                       front='seam', neck_x=0.072, flare=0.02, ease=0.012, skirt_ease=0.018, waist_ease=0.014, folds=0.003,
                       collar='crew', collar_taper=1.0, sleeve_ease=0.008, cuff_ease=0.006, cuff='facing'),
    'henley': dict(label='Henley', cat='tops', z=52, layer='top', color='#d9d2c4', fabric='cotton', hem=0.965, zb=9.0, top_dz=-0.005,
                   front='seam', neck_x=0.072, flare=0.02, ease=0.013, skirt_ease=0.018, waist_ease=0.015, folds=0.003,
                   collar='crew', collar_taper=1.0, sleeve_ease=0.008, cuff_ease=0.006, cuff='facing',
                   emblem=[(0.35, 0.0, 0.028, 0.115, 0)], buttons=[(0.37, 0.0), (0.41, 0.0), (0.45, 0.0)], button=(0.0055, 1), accents=[BUTTON_HORN]),
    'jacket': dict(label='Jacket', twin='jacket', color='#2f3c52', fabric='denim', hem=0.95, zb=1.62, front='closed', flare=0.02,
                   ease=0.024, skirt_ease=0.026, waist_ease=0.024, folds=0.003, collar='fold',
                   buttons=[(dz, -0.018) for dz in (0.02, 0.12, 0.22, 0.32, 0.42)], button=(0.0085, 1), accents=[SILVER],
                   pockets=[('chest2', 0.27, 0.09, 0.10, 0.11)], cuff='facing'),
    'blazer': dict(label='Blazer', twin='blazer', color='#2a2d36', fabric='wool', hem=0.86, zb=1.28, front='single', flare=0.03,
                   ease=0.022, skirt_ease=0.026, waist_ease=0.022, folds=0.003, lapel='notch', lapel_w=0.07, collar='fold',
                   buttons=[(0.0, 0.03), (0.09, 0.03)], button=(0.0105, 1), accents=[BUTTON_BLACK],
                   pockets=[('flap', -0.08, 0.66, 0.40, 0.05), ('chest', 0.25, 0.095, 0.09, 0.02)], cuff='facing'),
    'vest': dict(label='Waistcoat', twin='vest', color='#3a3a40', fabric='wool', hem=0.97, zb=1.30, front='single', sleeveless=True, armx=0.12, armholes=(1.36, 0.118),
                 neck_x=0.06, flare=0.0, ease=0.017, skirt_ease=0.02, waist_ease=0.017, folds=0.0,
                 buttons=[(dz, 0.026) for dz in (0.0, 0.06, 0.12, 0.18)], button=(0.0075, 1), accents=[BUTTON_BLACK],
                 pockets=[('patch', 0.02, 0.10, 0.075, 0.014)]),
    'cardigan': dict(label='Cardigan', twin='cardigan', color='#8a7a62', fabric='knit', hem=0.88, zb=1.30, front='single', flare=0.02,
                     ease=0.022, skirt_ease=0.024, waist_ease=0.022, folds=0.004, collar=None, trim=(0, 0.022),
                     buttons=[(dz, 0.026) for dz in (-0.03, 0.04, 0.11, 0.18, 0.25)], button=(0.008, 1), accents=[BUTTON_HORN],
                     pockets=[('patch', -0.16, 0.10, 0.13, 0.13)], cuff='turn', cuff_h=0.05, cuff_flare=0.0),
    'belt': dict(label='Belt', skirt=True, rise=-0.035, cat='equipment', z=56, layer='belt', color='#2a1a10', fabric='leather',
                 hem=1.002, front='seam', flare=0.0, ease=0.024, skirt_ease=0.024, waist_ease=0.024, folds=0.0, keep_above=1.0,
                 buckle_at=-0.016, buckle_accent=1, accents=[{'color': [0.72, 0.72, 0.74], 'rough': 0.3, 'metal': 0.9}]),
    'leafdress': dict(label='Leaf dress', twin='coat', color='#7fa85a', fabric='canvas', own={'tile': 'leaves_3', 'tile_m': 0.22},
                      hem=0.66, zb=1.62, front='closed', flare=0.12, ease=0.022, skirt_ease=0.03, waist_ease=0.02, folds=0.014, fold_n=9,
                      ragged=0.12, collar=None, sleeve_rings=3, sleeve_ease=0.024, cuff_ease=0.024, leaves=(0, 70, 5), cuff='facing',
                      sway=SKIRT_SWAY),
}


def coat_weights(f, G, V):
    """the pilot's (the body's skin under the coat; the hang below the hips) + the tails' chains where a coat has them"""
    W = PG.skin_weights(f, V, G.T)
    # a button / pocket / trim below the hips rides the hanging skirt under it (the pilot's buttons sit above the belt):
    # it takes the weights of the nearest sheet vertex, so it never drifts off the cloth in a stride
    rig = f['h'].parent
    zhip = float(np.mean([(rig.matrix_world @ rig.data.bones[b].head_local)[2] for b in ('thigh_l', 'thigh_r')]))
    sheet = [i for i in range(len(V)) if G.T[i][0] == 'sheet']
    kd = KDTree(len(sheet))
    for i in sheet:
        kd.insert(Vector(V[i]), i)
    kd.balance()
    for a, b, _c in G.solids:
        if G.T[a][3] != 'coat_tl':
            continue
        c = V[a:b].mean(axis=0)
        if c[2] < zhip:
            w = dict(W[kd.find(Vector(c))[1]])
            for i in range(a, b):
                W[i] = dict(w)

    if not G.chains:
        return W
    sc = (f['K'][3] - f['K'][1]) / (1.6 - 0.52)
    za = G.anchor_z
    cph = [G.T[ch[0]][1] for ch in G.chains]
    cz = [[V[j][2] for j in ch] for ch in G.chains]
    lo, hi = min(cph) - 0.35, max(cph) + 0.35
    for i in range(len(V)):
        part, phi, gain, grp = G.T[i]
        z = V[i][2]
        if grp != 'coat_tl' or math.isnan(phi) or z >= za or not (lo <= phi <= hi):
            continue
        fade = float(smoothstep(za, za - 0.10 * sc, z)) * float(smoothstep(lo, lo + 0.25, phi)) * float(smoothstep(hi, hi - 0.25, phi))
        sp = getattr(G, 'split_phi', None)
        d = [abs(phi - a) + (9.0 if sp is not None and (phi > sp) != (a > sp) else 0.0) for a in cph]
        order = np.argsort(d)
        a0 = int(order[0]); a1 = int(order[1]) if len(order) > 1 else a0
        if d[a1] < 9.0 and min(cph[a0], cph[a1]) <= phi <= max(cph[a0], cph[a1]) and d[a0] + d[a1] > 1e-6:
            wa = d[a1] / (d[a0] + d[a1]); picks = [(a0, wa), (a1, 1 - wa)]
        else:
            picks = [(a0, 1.0)]
        out = {b: w * (1 - fade) for b, w in W[i].items()}
        for ci, wc in picks:
            zj = cz[ci]; seg = 0
            while seg < len(zj) - 2 and z < zj[seg + 1]:
                seg += 1
            key = 'sw%d_%d' % (ci, seg)
            out[key] = out.get(key, 0) + wc * fade
        W[i] = out
    return W


def bake_coat(key, spec, frames, m, out, tiles, views=None):
    name = 'ewb_' + key
    builds = {}
    cache = {}
    for b, f in frames.items():
        co = PG.warp(f['co'], f, m)
        pts = {k: PG.warp(v[None], f, m)[0] for k, v in f['pts'].items()}
        o = dict(spec, belt=m['K'][2], top=m['K'][3] + spec.get('top_dz', 0.0), _cache=cache)
        if 'hem_rel' in spec:                  # THE BLENDER SHIRTS: heights from the male's belt line / neck top
            o['hem'] = m['K'][2] + spec['hem_rel']
        if 'zb_rel' in spec:
            o['zb'] = m['K'][3] + spec['zb_rel']
        if 'placket_rel' in spec:
            o['placket'] = m['K'][3] + spec['placket_rel']
        if 'buttons_top' in spec:              # (buttons placed down from the neck top: the polo's placket)
            o['buttons'] = [(m['K'][3] + d - m['K'][2], x) for d, x in spec['buttons_top']]
        if spec.get('skirt'):                  # THE SKIRTS: the sheet from the hem up to a waistband just over the belt line
            o['top'] = m['K'][2] + spec.get('rise', 0.05)
            o['zb'] = o['top'] + 1.0
        G = build_coat(co, f['dom'], f['inbody'], pts, o)
        builds[b] = (PG.unwarp(np.array(G.V), f, m), G)
    V, G = builds['male']
    for b, (Vb, Gb) in builds.items():
        assert len(Vb) == len(V) and len(Gb.F) == len(G.F), 'topology differs on ' + b
        assert np.isfinite(Vb).all(), 'NaN vertices on ' + b
    W = coat_weights(m, G, V)
    dl = PG.hidden_skin(m, V, G.F, zlo=(m['K'][2] + spec['hem_rel'] + 0.004) if spec.get('tuck') else None)   # (a tucked shirt hides the skin down to its hem)
    if spec.get('skirt'):                      # (a top's turned-down collar flares out: the skin above its edge stays, else a gap
        zt = m['K'][2] + spec.get('rise', 0.05) - spec.get('keep_above', 0.012)   #  shows between the fold and the skin)
        keep = [i for a, b in dl for i in range(a, b + 1) if not (m['dom'][i] in TORSO_B and m['co'][i, 2] > zt)]
        dl = []
        for i in keep:
            if dl and dl[-1][1] == i - 1:
                dl[-1][1] = i
            else:
                dl.append([i, i])
    S = PG.shade(m, V, G.F, G.T)
    own = spec.get('own')
    main = spec.get('main', {'color': [1, 1, 1], 'rough': 0.9})     # (a pick with no layer keeps its own colour: the coin belt)
    images = []
    if own:                                    # (the Krampus coat: its own R2 fur tile, tinted by the layer colour)
        main = {'color': [1, 1, 1], 'rough': 0.95, 'tile': own['tile'], 'tile_m': own['tile_m']}
        images.append((own['tile'], tile_bytes(own['tile'], tiles, grey=True)))
    accent_mats = [main] + list(spec.get('accents', [])) + list(spec.get('extra_accents', []))
    for am in accent_mats[1:]:
        if am.get('tile') and am['tile'] not in [n for n, _ in images]:
            images.append((am['tile'], tile_bytes(am['tile'], tiles, grey=am.get('grey', False))))
    wear = {'name': name, 'pack': 'entropywars', 'cat': 'outer', 'z': 70, 'del': dl, 'outer': spec.get('twin'), 'uv': 'm', 'fitSpatial': 8, 'own': bool(own),
            'accents': [dict(color=a.get('color'), rough=a.get('rough', 0.9), metal=a.get('metal', 0)) for a in accent_mats]}
    if spec.get('cat'):                        # a MakeHuman-clothes pick (the skirts: Bottoms), painted by its layer, no coded twin
        del wear['outer']
        wear.update(cat=spec['cat'], z=spec['z'])
        if spec.get('layer'):
            wear['layer'] = spec['layer']
        if spec.get('tuck'):                   # (a tucked shirt: the coded trousers + belt stay over it, three-renderer.js wearCovers)
            wear['tuck'] = True
    path = os.path.join(out, name + '.glb')
    ntri, bones = write_glb(path, {b: builds[b][0] for b in builds}, G.F, G.FUV, W, S, G.A, wear, images, accent_mats,
                            {'parent': G.chain_parent, 'joints': G.chains, 'parents': getattr(G, 'chain_parents', None)} if G.chains else None)
    print('[bake-clothes] %-28s %6d tris %5d KB  hides %d skin verts  chains %d  bones %s' % (
        name, ntri, os.path.getsize(path) // 1024, sum(r[1] - r[0] + 1 for r in dl), len(G.chains), ','.join(bones)))
    if views:
        os.makedirs(views, exist_ok=True)
        for b, f in frames.items():
            Vb, Gb = builds[b]
            np.savez(os.path.join(views, '%s_%s.npz' % (name, b)), V=Vb, F=np.array(PG.tris(Gb.F)), A=np.array(Gb.A), S=S,
                     body=f['co'], bodyF=np.array([tuple(p.vertices) for p in f['h'].data.polygons if all(f['inbody'][v] for v in p.vertices) and len(p.vertices) == 4]))
    return {'id': 'b' + key, 'file': name, 'label': spec['label'], 'tris': ntri, 'kb': os.path.getsize(path) // 1024}


# ═══════════════════════════════ THE OPEN + CLOSED FRONTS (2026-11-02) ═══════════════════════════════
# mondo (11-02): "any coat or jacket etc option needs to have an open and closed option. there are some great long coats that i want
# to use for the cowboy but they are closed when his original model his coat is open". Every coat above with a front opening gets its
# OTHER front baked beside it: ewb_<key>_open.glb (a closed coat worn open: the two fronts hang apart, wider toward the hem, the
# lapels / collar as made, the buttons on the left front, no belt across the gap) or ewb_<key>_closed.glb (an open coat buttoned /
# zipped: the pirate double-breasted, the fringe jacket zipped, the tattered shirt buttoned). sprites.js EW_OUTER_FRONT_ALT lists them.
# Pullovers have no front: the habit, the jersey, the Robin Hood + scarecrow-free tunics, the tabard, the clown suit, the leaf dress, skirts.
FRONT_SKIP = {'habit', 'jersey', 'robinhood', 'tabard', 'clown', 'leafdress'}


def front_alt(key, spec):
    """(suffix, spec) of a coat's other front, or None"""
    if key in FRONT_SKIP or spec.get('skirt') or spec.get('cat'):
        return None
    if spec['front'] == 'open':
        o = dict(spec)
        if key == 'pirate':
            o.update(front='double', buttons=dbl((0.02, 0.09, 0.16, 0.23), 0.075))
        elif key == 'fringe':
            o.update(front='closed', buttons=[])
        else:
            o.update(front='single', buttons=[(dz, 0.03) for dz in (0.06, 0.18, 0.30)])
        o['label'] = spec['label'] + ' (closed)'
        return 'closed', o
    long_ = spec['hem'] < 0.8                    # (a long coat hangs open wider than a jacket, more at the hem)
    gap = 0.065 if long_ else 0.05
    o = dict(spec, front='open', gap=gap, gap_hem=gap + (0.07 if long_ else 0.012), neck_x=max(spec.get('neck_x', 0.075), gap + 0.012))
    rows = sorted(set(round(dz, 3) for dz, _x in spec.get('buttons', [])))
    if spec['front'] == 'double':                # both fronts keep a row of buttons near their edge
        o['buttons'] = [(dz, sg * (gap + 0.03)) for dz in rows for sg in (-1, 1)]
    else:                                        # the left front's buttons, near its edge (the right front has the holes)
        o['buttons'] = [(dz, gap + 0.022) for dz in rows]
    for k in ('belt_on', 'sash_tails', 'harness'):     # (nothing tied across the opening)
        o.pop(k, None)
    o['buttons_edge'] = True
    o['label'] = spec['label'] + ' (open)'
    return 'open', o


FRONTS = {}
for _k, _s in COATS.items():
    _alt = front_alt(_k, _s)
    if _alt:
        FRONTS[_k + '_' + _alt[0]] = _alt[1]


# ═══════════════════════════════ THE BLENDER SHIRTS (2026-11-02) ═══════════════════════════════
# mondo (11-02): "a lot of collars are missing when some of these shirt types should definitely have them ... i deally i want there to
# be a longsleeve collared shirt that is tucked in but with no tie. i only found one with a tie that was baked into the shirt".
# Top picks (sprites.js EW_BLENDER_TOPS), built on the coat sheet like the 4d tops: a real shirt collar (a band + the fold turned down,
# its points at the front), a button placket down the overlapped front, cuffs with a button, sleeves to the wrist (or short); painted
# by the Top layer (layer 'top'); `tuck` = the hem pulled in under the trousers' waistband (the coded trousers + belt go over it,
# three-renderer.js wearCovers) and a little blousing over it. Heights are from the male's belt line (hem_rel) / neck top (zb_rel).
_SHIRT = dict(cat='tops', layer='top', color='#e8e4da', fabric='cotton', flare=0.0, folds=0.0, collar='shirt', collar_points=0.9, neck_dip=0.04,
              collar_taper=2.0, accents=[BUTTON_WHITE], button=(0.0055, 1), cuff='turn', cuff_h=0.06, cuff_flare=0.002, cuff_buttons=1,
              sleeve_ease=0.015, cuff_ease=0.009)
_TUCK = dict(z=46, tuck=True, hem_rel=-0.012, ease=0.013, waist_ease=0.0045, skirt_ease=0.0035, ease_from=0.07)   # (the hem 3 cm under the waist: inside the coded trousers' waistband + belt)
_LOOSE = dict(z=52, hem_rel=-0.20, ease=0.014, waist_ease=0.016, skirt_ease=0.019, flare=0.01)
_BTN = lambda lo, hi, n, x: [(round(lo + (hi - lo) * i / (n - 1), 3), x) for i in range(n)]
SHIRTS = {
    # the long-sleeve collared shirt, tucked in, buttoned to the collar, no tie (the one mondo asked for)
    'shirt': dict(_SHIRT, **_TUCK, label='Collared shirt', front='closed', zb_rel=0.5, collar_meet=0.005, buttons=_BTN(0.02, 0.43, 6, -0.015)),
    # the same with the top buttons undone: the collar lies open in a V
    'shirtopen': dict(_SHIRT, **_TUCK, label='Open-collar shirt', front='closed', zb_rel=-0.10, neck_x=0.05, buttons=_BTN(0.02, 0.30, 4, -0.015)),
    # the cowboy's: open collar, a flap pocket on each breast, tucked in
    'workshirt': dict(_SHIRT, **_TUCK, label='Work shirt', front='closed', zb_rel=-0.11, neck_x=0.052, buttons=_BTN(0.02, 0.29, 4, -0.015),
                      pockets=[('chestflap', 0.25, 0.085, 0.10, 0.11)], flap_buttons=1, accents=[BUTTON_HORN]),
    # worn out over the trousers
    'shirtloose': dict(_SHIRT, **_LOOSE, label='Untucked shirt', front='closed', zb_rel=-0.08, neck_x=0.045, buttons=_BTN(-0.12, 0.33, 6, -0.015)),
    # short sleeves, collar, untucked
    'shortshirt': dict(_SHIRT, **_LOOSE, label='Short-sleeve shirt', front='closed', zb_rel=-0.08, neck_x=0.045, buttons=_BTN(-0.12, 0.33, 6, -0.015),
                       sleeve_rings=9, cuff='facing', cuff_buttons=0, sleeve_ease=0.02, cuff_ease=0.02),
    # the polo: a knit collar, a three-button placket at the neck only, short sleeves with a band
    'polo': dict(_SHIRT, **_LOOSE, label='Polo', front='closed', zb_rel=0.5, placket_rel=-0.15, collar='polo', collar_meet=0.005, collar_points=0.5,
                 buttons_top=[(-0.045, -0.015), (-0.085, -0.015), (-0.125, -0.015)], sleeve_rings=9, cuff='facing', cuff_buttons=0, sleeve_ease=0.02,
                 cuff_ease=0.016, sleeve_bands=[(1, 0)]),
}


# ═══════════════════════════════ WEIGHTS ═══════════════════════════════
def body_bone_weights(f):
    h, co = f['h'], f['co']
    names = {g.index: g.name for g in h.vertex_groups}
    bones = set(b.name for b in h.parent.data.bones) - {'Root'}
    bw = [dict() for _ in range(len(co))]
    for v in h.data.vertices:
        for g in v.groups:
            n = names[g.group]
            if g.weight > 0 and n in bones:
                bw[v.index][n] = bw[v.index].get(n, 0) + g.weight
    return bw


def cape_weights(f, G, V):
    """the rows on the body: the body's weights under them (torso + collarbones + neck); the hanging part: the chains"""
    co, dom, inbody = f['co'], f['dom'], f['inbody']
    bw = body_bone_weights(f)
    pool = [i for i in range(len(co)) if inbody[i] and dom[i] in ('spine_02', 'spine_03', 'clavicle_l', 'clavicle_r', 'neck_01')]
    kd = KDTree(len(pool))
    for i in pool:
        kd.insert(Vector(co[i]), i)
    kd.balance()
    # THE SHOULDER CAP (2026-11-05): the cloth lying on the top of the shoulder takes the skin's own weights there, the upper
    # arm's share too (the shirt under it follows the arm: held on the collarbone alone, the cape stayed put while the arm
    # came down from the bind pose and the shirt's shoulder came out through it), fading back to the torso pool under it
    pool2 = [i for i in range(len(co)) if inbody[i] and dom[i] in ('spine_03', 'clavicle_l', 'clavicle_r', 'neck_01', 'upperarm_l', 'upperarm_r')]
    kd2 = KDTree(len(pool2))
    for i in pool2:
        kd2.insert(Vector(co[i]), i)
    kd2.balance()
    sh_lo, sh_hi = G.__dict__.get('cap_lo', 1.42), G.__dict__.get('cap_hi', 1.48)
    sc = (f['K'][3] - f['K'][1]) / (1.6 - 0.52)
    za = G.anchor_z
    # chain geometry: each chain's phi + its joints' z (on this body, from the vertices)
    cph = [G.T[ch[0]][1] for ch in G.chains]
    cz = [[V[j][2] for j in ch] for ch in G.chains]
    W, slot = [], []
    for i in range(len(V)):
        acc = {}
        for (p, j, d) in kd.find_n(Vector(V[i]), 6):
            k = 1.0 / max(1e-4, d) ** 2
            for b, w in bw[j].items():
                acc[b] = acc.get(b, 0) + w * k
        tot = sum(acc.values()) or 1
        acc = {b: w / tot for b, w in acc.items()}
        tc = float(smoothstep(sh_lo, sh_hi, V[i][2]))
        if tc > 0:
            a2 = {}
            for (p, j, d) in kd2.find_n(Vector(V[i]), 6):
                k = 1.0 / max(1e-4, d) ** 2
                for b, w in bw[j].items():
                    a2[b] = a2.get(b, 0) + w * k
            t2 = sum(a2.values()) or 1
            acc = {b: acc.get(b, 0) * (1 - tc) + a2.get(b, 0) / t2 * tc for b in set(acc) | set(a2)}
        part, phi, gain, grp = G.T[i]
        z = V[i][2]
        if grp == 'cape' and not math.isnan(phi) and z < za:
            fade = float(smoothstep(za, za - 0.10 * sc, z))
            d = [abs(((phi - a) + math.pi) % TAU - math.pi) for a in cph]
            order = np.argsort(d)
            a0 = int(order[0]); a1 = int(order[1]) if len(order) > 1 else a0
            between = (min(cph[a0], cph[a1]) <= phi <= max(cph[a0], cph[a1]))
            if between and d[a0] + d[a1] > 1e-6:
                wa = d[a1] / (d[a0] + d[a1]); picks = [(a0, wa), (a1, 1 - wa)]
            else:
                picks = [(a0, 1.0)]
            out = {b: w * (1 - fade) for b, w in acc.items()}
            for ci, wc in picks:
                zj = cz[ci]
                seg = 0
                while seg < len(zj) - 2 and z < zj[seg + 1]:
                    seg += 1
                key = 'sw%d_%d' % (ci, seg)
                out[key] = out.get(key, 0) + wc * fade
            acc = out
        W.append(acc)
    return W


# ═══════════════════════════════ THE TIGHT CLOTHES (batch 4b): built from the body itself ═══════════════════════════════
# Plan 4d: "luchador mask + singlet (tight, built from the body)"; the football pants with them. A tight garment is still a
# pattern of rows and columns (the same counts on every body, so the GLB keeps the compact layout), but each row is the
# body's own cross-section there + a few millimetres: the legs and hips = each slab's convex hull (stretch cloth bridges the
# small hollows: the gluteal cleft, the gap at the crotch), cut at the middle into a left and a right half that meet at the
# front / back seams; below the crotch each leg is its own tube (the gusset joins them). The mask = rays from a capsule
# through the head (the neck a cylinder, the crown a dome) onto the skin, the hollows pulled tight (TIGHTEN: a radius never
# sits more than a slack below its neighbours' mean), with holes for the eyes and the mouth.


def clip_half(Pl, eps=0.0):
    """the convex polygon Pl (k,2) cut to x >= eps (Sutherland-Hodgman)"""
    out = []
    n = len(Pl)
    for i in range(n):
        a, b = Pl[i], Pl[(i + 1) % n]
        ia, ib = a[0] >= eps, b[0] >= eps
        if ia:
            out.append(a)
        if ia != ib:
            t = (eps - a[0]) / (b[0] - a[0])
            out.append(a + (b - a) * t)
    return np.array(out)


def poly_centroid(Pl):
    x, y = Pl[:, 0], Pl[:, 1]
    x1, y1 = np.roll(x, -1), np.roll(y, -1)
    cr = x * y1 - x1 * y
    A = cr.sum() / 2
    if abs(A) < 1e-9:
        return Pl.mean(axis=0)
    return np.array([((x + x1) * cr).sum() / (6 * A), ((y + y1) * cr).sum() / (6 * A)])


class Legs:
    """the cross-sections of a tight garment's hips + legs on one body (in the male's frame): pelvis rings above the
    crotch (left + right outer arcs between the front / back seams) and a tube per leg below it"""
    def __init__(self, co, dom, inbody, o, n_out=22, n_in=8):
        self.co, self.o, self.n_out, self.n_in = co, o, n_out, n_in
        self.foot = {k: np.array([inbody[i] and dom[i] in ('foot_' + s, 'ball_' + s) for i in range(len(co))]) for k, s in ((1.0, 'l'), (-1.0, 'r'))}
        torso = np.array([inbody[i] and dom[i] in TORSO_B for i in range(len(co))])
        fz = o.get('foot_z', 9.0)                   # (ankle-length: MPFB's foot bone owns the lower shin; its skin above fz counts)
        leg = {s: np.array([inbody[i] and (dom[i] in ('thigh_' + s, 'calf_' + s) or (dom[i] == 'foot_' + s and co[i, 2] > fz)) for i in range(len(co))]) for s in 'lr'}
        self.blob = torso | leg['l'] | leg['r']
        self.leg = leg
        mid = torso & (np.abs(co[:, 0]) < 0.012)
        self.z_c = float(co[mid, 2].min()) - o.get('crotch_drop', 0.008)        # the crotch: the lowest torso skin at the middle
        self.ease = o['ease']

    def slab(self, mask, z, band=0.02):
        P2 = self.co[mask & (np.abs(self.co[:, 2] - z) < band)][:, :2]
        if (len(P2) < 8 or self.o.get('xsec')) and self.o.get('_edges') is not None:   # (the lower shin's skin rings are 6-8 cm apart: the skin's own
            E = self.o['_edges']                                  #  cross-section, where its edges cross z)
            ok = mask | self.foot.get(1.0 if self.co[mask, 0].mean() > 0 else -1.0, mask)   # (this leg's skin + its foot's)
            E = E[(mask[E[:, 0]] | mask[E[:, 1]]) & ok[E[:, 0]] & ok[E[:, 1]]]
            E = E[np.linalg.norm(self.co[E[:, 0]] - self.co[E[:, 1]], axis=1) < 0.09]
            za, zb = self.co[E[:, 0], 2], self.co[E[:, 1], 2]
            x = (za - z) * (zb - z) <= 0
            E, za, zb = E[x], za[x], zb[x]
            t = ((z - za) / np.where(np.abs(zb - za) < 1e-9, 1e-9, zb - za))[:, None]
            P2 = (self.co[E[:, 0]] * (1 - t) + self.co[E[:, 1]] * t)[:, :2]
            if self.o.get('xsec') and len(P2) < 4:
                P2 = self.co[mask & (np.abs(self.co[:, 2] - z) < band)][:, :2]
        if len(P2) < 4:
            raise ValueError('no skin at z=%.3f' % z)
        return hull2d(P2)

    def _arc(self, Pl, c, a0, a1, n, extra=0.0):
        A = np.linspace(a0, a1, n + 2)[1:-1]
        D = np.stack([np.cos(A), np.sin(A)], 1)
        r = ray_polys(Pl, c, D) + extra
        return c + D * r[:, None]

    def pelvis(self, z, extra=0.0):
        """ring at z (above the crotch): [F, left outer arc (front -> back), B, right outer arc (back -> front)] + the halves' centres"""
        He = minkowski(self.slab(self.blob, z), self.ease + extra)
        out, cen = {}, {}
        for s, k in (('l', 1.0), ('r', -1.0)):
            Hs = He.copy(); Hs[:, 0] *= k
            if k < 0:
                Hs = Hs[::-1]
            half = clip_half(Hs)
            on = half[np.abs(half[:, 0]) < 1e-7]
            F, B = on[np.argmin(on[:, 1])], on[np.argmax(on[:, 1])]
            c = poly_centroid(half)
            aF, aB = math.atan2(F[1] - c[1], F[0] - c[0]), math.atan2(B[1] - c[1], B[0] - c[0])
            arc = self._arc(half, c, aF, aB, self.n_out)
            arc[:, 0] *= k; c = c * [k, 1]
            out[s] = arc; cen[s] = (c, aF, aB)
            if s == 'l':
                self.F2, self.B2 = np.array([0.0, F[1]]), np.array([0.0, B[1]])
        ring = np.concatenate([[self.F2], out['l'], [self.B2], out['r'][::-1]])
        return np.concatenate([ring, np.full((len(ring), 1), z)], 1), cen

    def leg_ring(self, z, s, aF, aB, extra=0.0):
        """ring at z (below the crotch) of leg s: [F, outer arc, B, inner arc (back -> front)]"""
        k = 1.0 if s == 'l' else -1.0
        H = self.slab(self.leg[s], z); H = H.copy(); H[:, 0] *= k
        if k < 0:
            H = H[::-1]
        He = clip_half(minkowski(H, self.ease + extra), 0.0015)
        c = poly_centroid(He)
        D = lambda a: np.array([math.cos(a), math.sin(a)])
        F = c + D(aF) * ray_polys(He, c, D(aF)[None])[0]
        B = c + D(aB) * ray_polys(He, c, D(aB)[None])[0]
        ring = np.concatenate([[F], self._arc(He, c, aF, aB, self.n_out), [B], self._arc(He, c, aB, aF + TAU, self.n_in)])
        ring[:, 0] *= k
        return np.concatenate([ring, np.full((len(ring), 1), z)], 1), c * [k, 1]

    def side_at(self, z, s, ang, extra=0.0, cen=None):
        """one point on the garment at height z on side s, `ang` radians round its centre (0 = straight out to the side,
        -pi/2 = the front): the pelvis half above the crotch, the leg below"""
        k = 1.0 if s == 'l' else -1.0
        if z >= self.z_c:
            He = minkowski(self.slab(self.blob, z), self.ease + extra); He = He.copy(); He[:, 0] *= k
            if k < 0:
                He = He[::-1]
            Pl = clip_half(He)
        else:
            H = self.slab(self.leg[s], z).copy(); H[:, 0] *= k
            if k < 0:
                H = H[::-1]
            Pl = clip_half(minkowski(H, self.ease + extra), 0.0015)
        c = poly_centroid(Pl)
        d = np.array([math.cos(ang), math.sin(ang)])
        p = c + d * ray_polys(Pl, c, d[None])[0]
        return np.array([p[0] * k, p[1], z])


def ring_uv(R):
    """u = arc length round each row (from column 0), v = the height"""
    UV = np.zeros(R.shape[:2] + (2,))
    for r in range(R.shape[0]):
        seg = np.linalg.norm(np.diff(R[r], axis=0), axis=1)
        UV[r, :, 0] = np.concatenate([[0], np.cumsum(seg)])
        UV[r, :, 1] = R[r, :, 2]
    return UV


def shrink(ring, cxy, d, dz):
    """a facing row: `ring` pulled d metres toward its centre and moved dz in height"""
    out = ring.copy()
    v = out[:, :2] - np.asarray(cxy)[None]
    n = np.linalg.norm(v, axis=1, keepdims=True)
    out[:, :2] -= v / np.maximum(1e-6, n) * d
    out[:, 2] += dz
    return out


def build_legs(co, dom, inbody, pts, o):
    """the hips + legs of a tight garment: pelvis rows from o['top'] to the crotch, a tube per leg down to o['hem'];
    returns (Garment, Legs)"""
    L = Legs(co, dom, inbody, o)
    G = Garment()
    z_top, z_c = o['top'], L.z_c
    z_hem = o['hem']
    lift = 0.0
    if o.get('neckline'):
        # THE BUST: the front rises over a bust (how far the chest stands out past the breastbone, on this body), so the
        # same singlet covers the female bodies' chest; a flat chest keeps the neckline as cut
        cz = co[L.blob & (co[:, 2] > o['neck'] - 0.32) & (co[:, 2] < o['neck'] - 0.12)]
        side_y = cz[(np.abs(cz[:, 0]) > 0.04) & (np.abs(cz[:, 0]) < 0.13), 1].min()
        mid_y = cz[np.abs(cz[:, 0]) < 0.012, 1].min()
        lift = float(np.clip((mid_y - side_y - 0.010) * 7.0, 0.0, 0.085))
        z_top += lift
    zu = np.linspace(z_top, z_c, o['rows_up'])
    rings, cens = [], []
    for z in zu:
        R, cen = L.pelvis(z); rings.append(R); cens.append(cen)
    P = np.array(rings)
    if o.get('neckline'):
        # THE NECKLINE (the singlet): each column's top drops to its own height (a scoop at the front + back, the armholes
        # cut deep at the sides), the rows below spread evenly down that column to the crotch
        kn = np.array(o['neckline'])
        for j in range(P.shape[1]):
            x, y = P[0, j, 0], P[0, j, 1] - float(np.mean(P[0, :, 1]))
            ph = abs(math.atan2(x, -y))
            ztop = o['neck'] + float(np.interp(ph, kn[:, 0], kn[:, 1])) + lift * float(np.interp(ph, [0.0, 0.6, 0.95, 1.25, 1.6, 2.0], [1.0, 1.0, 1.6, 1.6, 0.6, 0.0]))   # (the most at the bust's side: the armhole)
            col = P[:, j]
            zn = np.linspace(ztop, z_c, len(zu))
            P[:, j] = np.stack([np.interp(zn, col[::-1, 2], col[::-1, 0]), np.interp(zn, col[::-1, 2], col[::-1, 1]), zn], 1)
    cy = lambda p: np.array([0.0, float(np.mean([c['l'][0][1] for c in cens])), p[2]])
    G.grid(P, ring_uv(P), 'body', 'tight_c', closed=True, inside=cy)
    G.rows = [(P[r], {s: cens[r][s][0] for s in 'lr'}, 'c') for r in range(len(P))]
    # the waist's facing (the cloth turned in)
    top = np.array([P[0], shrink(P[0], (0, P[0][:, 1].mean()), 0.004, -0.012)])
    G.grid(top, ring_uv(top), 'facing', 'tight_c', closed=True, gain=0.8, inside=cy)
    n_out, n_in = L.n_out, L.n_in
    crow = P[-1]
    zd = np.linspace(z_c, z_hem, o['rows_dn'] + 1)[1:]
    legs = {}
    for s in 'lr':
        c0, aF, aB = cens[-1][s]
        arc = crow[1:1 + n_out] if s == 'l' else crow[2 + n_out:][::-1]
        Fp, Bp = crow[0], crow[1 + n_out]
        inner = np.array([lerp(Bp, Fp, t) for t in np.linspace(0, 1, n_in + 2)[1:-1]])
        row0 = np.concatenate([[Fp], arc, [Bp], inner])
        rows, cs = [row0], [c0]
        for z in zd:
            R, c = L.leg_ring(z, s, aF, aB); rows.append(R); cs.append(c)
        T = np.array(rows)
        czs = np.array([r[0, 2] for r in rows]); cxy = np.array(cs)
        inside = (lambda czs, cxy: (lambda p: np.array([np.interp(p[2], czs[::-1], cxy[::-1, 0]), np.interp(p[2], czs[::-1], cxy[::-1, 1]), p[2]])))(czs, cxy)
        G.grid(T, ring_uv(T), 'leg', 'tight_' + s, closed=True, inside=inside)
        G.rows += [(T[r], cs[r], s) for r in range(1, len(T))]
        hem = np.array([T[-1], shrink(T[-1], cs[-1], 0.004, 0.012)])
        G.grid(hem, ring_uv(hem), 'facing', 'tight_' + s, closed=True, gain=0.8, inside=inside)
        legs[s] = (T, cs, aF, aB)
    G.legs = legs
    return G, L


def ring_at(ring, s):
    """the point s metres round the closed polyline `ring` (from its vertex 0)"""
    P = np.concatenate([ring, ring[:1]])
    seg = np.linalg.norm(np.diff(P, axis=0), axis=1); acc = np.concatenate([[0], np.cumsum(seg)])
    s = s % acc[-1]
    k = min(len(seg) - 1, int(np.searchsorted(acc, s, side='right') - 1))
    t = (s - acc[k]) / max(1e-9, seg[k])
    return P[k] * (1 - t) + P[k + 1] * t, acc


def side_stripes(G, rows, offs, acc, nb, skip=1, extra=0.0016):
    """stripes down each side seam, taken off the garment's own rows (rows = [(ring, centre xy, side)] top to bottom):
    offs = [(a, b)] metres round the row from the point furthest out to that side; the strip sits `extra` out from the cloth"""
    for s in 'lr':
        k = 1.0 if s == 'l' else -1.0
        for a, b in offs:
            pts = []
            for ri, (ring, cxy, side) in enumerate(rows):
                if side not in (s, 'c') or ri < skip:
                    continue
                cxy = cxy[s] if isinstance(cxy, dict) else cxy
                _, accs = ring_at(ring, 0.0)
                # the side seam: halfway round the outer arc between the front + back seams (columns 0 and nb)
                if side == 'c' and s == 'r':
                    mid = 0.5 * (accs[nb] + accs[-1])
                else:
                    mid = 0.5 * (accs[0] + accs[nb])
                row = []
                for d in (a, 0.5 * (a + b), b):
                    p, _ = ring_at(ring, mid + d)
                    v = np.array([p[0] - cxy[0], p[1] - cxy[1], 0.0]); v /= max(1e-9, np.linalg.norm(v))
                    q = p + v * extra
                    row.append(q)
                pts.append(row)
            P = np.array(pts)
            G.grid(P, ring_uv(P), 'stripe', 'tight_' + s, accent=acc, gain=0.95,
                   inside=(lambda k: (lambda p: np.array([0.09 * k, 0.0, p[2]])))(k))


def knee_pads(G, L, z_knee, h, acc=0, bump=0.007):
    """the pads in football pants: a raised oval of the same cloth over each knee"""
    nz, na = 9, 11
    zs = np.linspace(z_knee + h, z_knee - h, nz)
    for s in 'lr':
        P = np.zeros((nz, na, 3))
        for r, z in enumerate(zs):
            for j, a in enumerate(np.linspace(-0.8, 0.8, na)):
                w = math.cos(0.5 * math.pi * (2 * r / (nz - 1) - 1)) * math.cos(0.5 * math.pi * a / 0.8)
                ang = (-math.pi / 2 + a) if s == 'l' else (-math.pi / 2 - a)
                P[r, j] = L.side_at(z, s, ang, 0.0012 + bump * max(0.0, w) ** 0.6)
        G.grid(P, ring_uv(P), 'pad', 'tight_' + s, accent=acc, gain=0.97,
               inside=(lambda s: (lambda p: np.array([0.09 if s == 'l' else -0.09, -0.02, p[2]])))(s))


def straps(G, co, bodyF, z_top, o, acc=0, grp=None):
    """a singlet's straps: ray-cast over the shoulder in the planes x = +-xs (front at z_top -> over the top -> back)"""
    from mathutils.bvhtree import BVHTree
    bvh = BVHTree.FromPolygons([tuple(v) for v in co], [tuple(f) for f in bodyF])
    xs, w, n = o.get('strap_x', 0.088), o.get('strap_w', 0.036), 26
    for k in (1.0, -1.0):
        P = np.zeros((n, 3, 3))
        for j, dx in enumerate((-w / 2, 0.0, w / 2)):
            x = k * (xs + dx)
            for r, al in enumerate(np.linspace(-0.10, math.pi + 0.10, n)):
                d = Vector((0.0, -math.cos(al), math.sin(al)))
                org = Vector((x, o['strap_y'], z_top))
                hit = bvh.ray_cast(org + d * 0.4, -d, 0.5)
                t = 0.4 - (hit[3] if hit[0] is not None else 0.25)
                P[r, j] = np.array(org + d * (t + o['ease'] + 0.0025))
        G.grid(P, ring_uv(P), 'strap', grp[k] if grp else 'tight_c', accent=acc,
               inside=lambda p: np.array([p[0] * 0.6, o['strap_y'], z_top]))


# ═══════════════════════════════ THE MASK: a capsule of rays through the head ═══════════════════════════════
class Head:
    def __init__(self, co, bodyF, pts, o, NU=80, NV=40, dense=2):
        from mathutils.bvhtree import BVHTree
        self.bvh = BVHTree.FromPolygons([tuple(v) for v in co], [tuple(f) for f in bodyF])
        self.zb, self.zo, self.Rref = o['bottom'], o['dome'], 0.09
        self.cy0 = float(pts['head_mid'][1])
        self.Lc = self.zo - self.zb; self.Ls = 0.5 * math.pi * self.Rref
        self.S = self.Lc + self.Ls
        self.NU, self.NV = NU, NV
        nu, nv = NU * dense, NV * dense + 1
        us = np.linspace(-math.pi, math.pi, nu, endpoint=False)
        ss = np.linspace(0, self.S, nv)
        R = np.zeros((nv, nu))
        for i, s in enumerate(ss):
            for j, u in enumerate(us):
                org, d = self.ray(u, s)
                hit = self.bvh.ray_cast(Vector(org + d * 0.35), Vector(-d), 0.4)
                R[i, j] = 0.35 - hit[3] if hit[0] is not None else np.nan
        bad = np.isnan(R)
        if bad.any():
            R[bad] = np.nanmean(R)
        for _ in range(o.get('dilate', 2)):                  # (an ear's thin rim between two rays: a cell's neighbours' max)
            R = np.maximum.reduce([R, np.roll(R, 1, 1), np.roll(R, -1, 1), np.vstack([R[:1], R[:-1]]), np.vstack([R[1:], R[-1:]])])
        R0 = R.copy()
        for _ in range(o.get('tighten', 60)):               # TIGHTEN: the stretch fabric bridges the hollows
            avg = 0.25 * (np.roll(R, 1, 1) + np.roll(R, -1, 1) + np.vstack([R[:1], R[:-1]]) + np.vstack([R[1:], R[-1:]]))
            R = np.maximum(R, avg - o.get('slack', 0.0012))
        R[-1] = R[-1].mean()                                     # (the pole: one point)
        self.us, self.ss, self.R = us, ss, R + o['ease']
        self.R0 = R0

    def ray(self, u, s):
        if s <= self.Lc:
            return np.array([0.0, self.cy0, self.zb + s]), np.array([math.sin(u), -math.cos(u), 0.0])
        e = min(0.5 * math.pi, (s - self.Lc) / self.Rref)
        return np.array([0.0, self.cy0, self.zo]), np.array([math.cos(e) * math.sin(u), -math.cos(e) * math.cos(u), math.sin(e)])

    def r(self, u, s):
        nu = len(self.us)
        fu = ((u + math.pi) % TAU) / TAU * nu; j0 = int(math.floor(fu)) % nu; tu = fu - math.floor(fu); j1 = (j0 + 1) % nu
        fs = np.clip(s / self.S * (len(self.ss) - 1), 0, len(self.ss) - 1 - 1e-9); i0 = int(fs); ts = fs - i0
        R = self.R
        return (R[i0, j0] * (1 - tu) + R[i0, j1] * tu) * (1 - ts) + (R[i0 + 1, j0] * (1 - tu) + R[i0 + 1, j1] * tu) * ts

    def at(self, u, s, extra=0.0):
        org, d = self.ray(u, s)
        return org + d * (self.r(u, s) + extra)

    def param(self, p):
        x, y, z = p
        u = math.atan2(x, -(y - self.cy0))
        if z <= self.zo:
            return u, z - self.zb
        h = math.hypot(x, y - self.cy0)
        return u, self.Lc + math.atan2(z - self.zo, h) * self.Rref


def build_mask(co, bodyF, pts, o, holes=None):
    """the luchador mask: the head + neck under the capsule's rays, eye + mouth holes (their edges snapped onto ovals),
    trim bands round the holes, a stripe over the crown; `holes` = the faces cut (from the male build: one topology)"""
    Hd = Head(co, bodyF, pts, o)
    NU, NV = Hd.NU, Hd.NV
    us = np.linspace(-math.pi, math.pi, NU, endpoint=False)
    ss = np.array([k / NV * Hd.S for k in range(NV)])
    PU = np.zeros((NV, NU, 2))
    PU[:, :, 0] = us[None]; PU[:, :, 1] = ss[:, None]
    ovals = []
    for key, w, hh in (('eye_l', o['eye_w'], o['eye_h']), ('eye_r', o['eye_w'], o['eye_h']), ('mouth', o['mouth_w'], o['mouth_h'])):
        u0, s0 = Hd.param(pts[key])
        rr = Hd.r(u0, s0)
        ovals.append((u0, s0, w / rr, hh, o.get(key + '_tilt', 0.0)))
    def onorm(ov, u, s):
        u0, s0, au, as_, tl = ov
        du = ((u - u0 + math.pi) % TAU) - math.pi; ds = s - s0
        if tl:
            ds = ds - tl * du * au * (1 if u0 > 0 else -1) / max(1e-6, au)
        return math.hypot(du / au, ds / as_)
    # the faces (quads r, c) whose centres fall in an oval
    if holes is None:
        holes = set()
        for r in range(NV - 1):
            for c in range(NU):
                uc = us[c] + math.pi / NU; sc_ = 0.5 * (ss[r] + ss[r + 1])
                if any(onorm(ov, uc, sc_) < 1.0 for ov in ovals):
                    holes.add((r, c))
    # the edge vertices of a hole: onto its oval (in the rays' parameters)
    edge = {}
    for (r, c) in holes:
        for (rr_, cc) in ((r, c), (r, (c + 1) % NU), (r + 1, c), (r + 1, (c + 1) % NU)):
            edge[(rr_, cc)] = True
    for (r, c) in list(edge):
        kept = any((r2, c2) not in holes for r2 in (r - 1, r) for c2 in ((c - 1) % NU, c) if 0 <= r2 < NV - 1)
        if not kept:
            continue
        u, s = PU[r, c]
        ov = min(ovals, key=lambda ov: onorm(ov, u, s))
        u0, s0, au, as_, tl = ov
        du = ((u - u0 + math.pi) % TAU) - math.pi; ds = s - s0
        k = onorm(ov, u, s)
        if k > 1e-6:
            PU[r, c] = [u0 + du / k, s0 + ds / k]
    P = np.array([[Hd.at(PU[r, c, 0], PU[r, c, 1]) for c in range(NU)] for r in range(NV)])
    G = Garment()
    UV = np.zeros((NV, NU, 2)); UV[:, :, 0] = PU[:, :, 0] * 0.1; UV[:, :, 1] = PU[:, :, 1]
    off = G.grid(P, UV, 'mask', 'mask', closed=True, inside=lambda p: np.array([0.0, Hd.cy0, min(p[2], Hd.zo)]))
    # cut the holes (the same quads on every body)
    cut = set(off + r * NU + c for (r, c) in holes)
    nf0 = len(G.F) - (NV - 1) * NU
    keep = [i for i in range(len(G.F)) if not (i >= nf0 and _quad_rc(i - nf0, NU) in holes)]
    G.F = [G.F[i] for i in keep]; G.FUV = [G.FUV[i] for i in keep]
    # the crown: a fan to the pole
    pole = Hd.at(0.0, Hd.S); pi_ = len(G.V)
    G.V.append(pole); G.T.append(('mask', float('nan'), 1.0, 'mask')); G.A.append(0)
    top = off + (NV - 1) * NU
    flip = np.dot(np.cross(P[-1, 1] - P[-1, 0], pole - P[-1, 0]), pole - np.array([0, Hd.cy0, Hd.zo])) < 0
    for c in range(NU):
        a, b = top + c, top + (c + 1) % NU
        f = [a, b, pi_] if not flip else [b, a, pi_]
        G.F.append(f); G.FUV.append([UV[-1, c], UV[-1, (c + 1) % NU], np.array([UV[-1, c, 0], Hd.S])])
    # the neck's facing
    org0 = np.array([0.0, Hd.cy0])
    fac = np.array([P[0], shrink(P[0], org0, 0.004, 0.012)])
    G.grid(fac, ring_uv(fac), 'facing', 'mask', closed=True, gain=0.8, inside=lambda p: np.array([0.0, Hd.cy0, p[2]]))
    # the trims round the holes
    for ov in ovals:
        u0, s0, au, as_, tl = ov
        n = 36
        B = np.zeros((3, n, 3))
        for j, kk in enumerate((0.96, 1.22, 1.5)):
            for i, t in enumerate(np.linspace(0, TAU, n, endpoint=False)):
                B[j, i] = Hd.at(u0 + kk * au * math.cos(t), s0 + kk * as_ * math.sin(t), 0.0026)
        G.grid(B, ring_uv(B), 'trim', 'mask', accent=1, closed=True, gain=0.95, inside=lambda p: np.array([0.0, Hd.cy0, min(p[2], Hd.zo)]))
    # the stripe: up the brow, over the crown, down the back (o['stripe_w'] wide)
    if o.get('stripe_w'):
        w = o['stripe_w']
        s_brow = max(ov[1] for ov in ovals[:2]) + ovals[0][3] * 1.6
        path = [Hd.at(0.0, s) for s in np.linspace(s_brow, Hd.S * 0.995, 14)] + [Hd.at(math.pi, s) for s in np.linspace(Hd.S * 0.995, o.get('stripe_end', 0.05), 20)]
        path = np.array(path)
        B = np.zeros((len(path), 5, 3))
        for i, p in enumerate(path):
            t = path[min(i + 1, len(path) - 1)] - path[max(i - 1, 0)]
            nrm = p - np.array([0.0, Hd.cy0, min(p[2], Hd.zo)])
            sd = np.cross(t, nrm); sd /= max(1e-9, np.linalg.norm(sd))
            for j, k in enumerate((-1, -0.5, 0, 0.5, 1)):
                q = p + sd * w * 0.5 * k
                u, s = Hd.param(q)
                B[i, j] = Hd.at(u, s, 0.0018)
        G.grid(B, ring_uv(B), 'stripe', 'mask', accent=2, gain=0.95, inside=lambda p: np.array([0.0, Hd.cy0, min(p[2], Hd.zo)]))
    return G, holes



def build_dorag(co, bodyF, pts, o):
    """the do-rag: the capsule's rays over the crown, its lower edge at the brow in front, over the ears, down to the nape at
    the back; two tails from a knot at the back of the head"""
    Hd = Head(co, bodyF, pts, o)
    NU, NV = Hd.NU, o.get('rows', 24)
    us = np.linspace(-math.pi, math.pi, NU, endpoint=False)
    s_eye = 0.5 * (Hd.param(pts['eye_l'])[1] + Hd.param(pts['eye_r'])[1])
    edge = np.array(o['edge'])                       # (|u|, height of the lower edge above the eyes' line)
    s0 = np.array([s_eye + float(np.interp(abs(u), edge[:, 0], edge[:, 1])) for u in us])
    P = np.zeros((NV, NU, 3)); UV = np.zeros((NV, NU, 2))
    for r in range(NV):
        t = (r / (NV - 1)) ** 0.85
        for c in range(NU):
            s = s0[c] + (Hd.S * 0.995 - s0[c]) * t
            P[r, c] = Hd.at(us[c], s); UV[r, c] = (us[c] * 0.1, s)
    G = Garment()
    ins = lambda p: np.array([0.0, Hd.cy0, min(p[2], Hd.zo)])
    off = G.grid(P, UV, 'cap', 'mask', closed=True, inside=ins)
    pole = Hd.at(0.0, Hd.S); pi_ = len(G.V)
    G.V.append(pole); G.T.append(('cap', float('nan'), 1.0, 'mask')); G.A.append(0)
    top = off + (NV - 1) * NU
    flip = np.dot(np.cross(P[-1, 1] - P[-1, 0], pole - P[-1, 0]), pole - np.array([0, Hd.cy0, Hd.zo])) < 0
    for c in range(NU):
        a, b = top + c, top + (c + 1) % NU
        G.F.append([a, b, pi_] if not flip else [b, a, pi_]); G.FUV.append([UV[-1, c], UV[-1, (c + 1) % NU], np.array([UV[-1, c, 0], Hd.S])])
    # the hem turned in (the cloth's edge)
    fac = np.zeros((2, NU, 3))
    for c in range(NU):
        fac[0, c] = P[0, c]; fac[1, c] = Hd.at(us[c], s0[c] + 0.012, -0.003)
    G.grid(fac, ring_uv(fac), 'facing', 'mask', closed=True, gain=0.8, inside=ins)
    # the knot + the tails: from the back of the head (u = pi) a little over the nape edge, hanging down the neck
    sk = float(s0[0]) + 0.035
    kp = Hd.at(math.pi, sk, 0.004)
    nrm = kp - ins(kp); nrm /= np.linalg.norm(nrm)
    disc(G, kp, nrm, 0.017, 'knot', 'mask', 0, h=0.012, seg=10, gain=0.85)
    for k, (dx, L, tw) in enumerate(((-0.012, o['tail'], -0.25), (0.012, o['tail'] * 0.85, 0.3))):
        Q = np.zeros((6, 2, 3)); TU = np.zeros((6, 2, 2))
        for i in range(6):
            t = i / 5
            c_ = kp + np.array([dx + tw * 0.05 * t, 0.0, 0.0]) + nrm * (0.012 + 0.03 * t * t) + np.array([0, 0, -L * t])
            w = 0.03 * (1 - 0.45 * t)
            Q[i, 0] = c_ - np.array([w * 0.5, 0, 0]); Q[i, 1] = c_ + np.array([w * 0.5, 0, 0])
            TU[i] = [(0, t * L), (w, t * L)]
        G.grid(Q, TU, 'tail', 'mask', gain=0.85, inside=lambda p, kp=kp: kp - nrm * 0.05 + np.array([0, 0, p[2] - kp[2]]))
    return G


def build_suspenders(co, bodyF, z_lo, z_hi, o):
    """two straps in the planes x = +-strap_x: up the front from the trousers, over the shoulder, down the back; a clip at
    each end"""
    from mathutils.bvhtree import BVHTree
    bvh = BVHTree.FromPolygons([tuple(v) for v in co], [tuple(f) for f in bodyF])
    G = Garment()
    w, y0 = o['strap_w'], o.get('strap_y', -0.005)
    nz = 22
    path = [(z, 0.0) for z in np.linspace(z_lo, z_hi, nz)] + [(z_hi, a) for a in np.linspace(0.12, math.pi - 0.12, 14)] + [(z, math.pi) for z in np.linspace(z_hi, z_lo, nz)]
    for k in (1.0, -1.0):
        P = np.zeros((len(path), 3, 3))
        for j, dx in enumerate((-w / 2, 0.0, w / 2)):
            x = k * (o['strap_x'] + dx)
            for r, (z, al) in enumerate(path):
                d = Vector((0.0, -math.cos(al), math.sin(al) if 0 < al < math.pi else 0.0)).normalized()
                org = Vector((x, y0, z))
                hit = bvh.ray_cast(org + d * 0.4, -d, 0.5)
                t = 0.4 - (hit[3] if hit[0] is not None else 0.25)
                P[r, j] = np.array(org + d * (t + o['ease']))
        for _ in range(2):                                   # (a strap bridges the hollows: a light smoothing along it)
            P[1:-1] = 0.25 * P[:-2] + 0.5 * P[1:-1] + 0.25 * P[2:]
        G.grid(P, ring_uv(P), 'strap', 'tight_c', inside=lambda p: np.array([p[0] * 0.6, y0, min(max(p[2], z_lo), z_hi)]))
        for r in (0, len(path) - 1):                         # the clips
            p0 = P[r, 1]; n = p0 - np.array([p0[0] * 0.6, y0, p0[2]]); n[2] = 0; n /= np.linalg.norm(n)
            disc(G, p0 + n * 0.002, n, w * 0.62, 'clip', 'tight_c', 1, h=0.004, seg=4, gain=0.9)
    return G


def _front_y(bvh, x, z, y0=-0.6):
    """the body's front surface (y; front is -y) at (x, z): a ray from in front, straight back"""
    hit = bvh.ray_cast(Vector((x, y0, z)), Vector((0.0, 1.0, 0.0)), 1.0)
    return hit[0][1] if hit[0] is not None else None


def build_tie(co, bodyF, z_knot, z_tip, o):
    """THE TIE: a knot under the collar + a blade that widens down the shirt front to a pointed tip; the blade lies on the
    front, hanging straight where the body falls away under the chest (it leaves the body at most `hang` per metre down)"""
    from mathutils.bvhtree import BVHTree
    bvh = BVHTree.FromPolygons([tuple(v) for v in co], [tuple(f) for f in bodyF])
    G = Garment()
    e = o['ease']
    zk0, zk1 = z_knot + 0.012, z_knot - 0.034                 # the knot: a trapezoid under the collar
    zs = np.linspace(zk1 + 0.004, z_tip, 34)
    NJ = 9
    xn = np.linspace(-1.0, 1.0, NJ)
    wid = lambda z: 0.030 + (0.084 - 0.030) * float(smoothstep(zk1, z_tip + 0.06, z)) ** 0.8
    P = np.zeros((len(zs), NJ, 3)); UV = np.zeros((len(zs), NJ, 2))
    ys = []
    for r, z in enumerate(zs):
        yr = min(_front_y(bvh, x, z) or 0.0 for x in np.linspace(-0.08, 0.08, 9)) - e      # (the shirt bridges the breastbone: the front's hull)
        if ys:
            yr = min(yr, ys[-1] + 0.25 * (zs[r - 1] - z))          # (it can only fall back onto the body slowly: a cloth hangs)
        ys.append(yr)
    for r, z in enumerate(zs):
        for j, t in enumerate(xn):
            zz = z
            if r == len(zs) - 1:                                   # the pointed tip: the edges end higher than the middle
                zz = z + 0.04 * abs(t)
            elif r == len(zs) - 2:
                zz = z + 0.04 * abs(t) * 0.5 + 0.0
            w = wid(zz)
            P[r, j] = (t * w / 2, ys[r] - 0.003 * (1 - t * t), zz)
            UV[r, j] = (t * w / 2, zz)
    # the tip rows: spread so the V reads (the last row's ends meet the row above's edges)
    G.grid(P, UV, 'blade', 'tie', inside=lambda p: np.array([0.0, p[1] + 0.05, p[2]]))
    back = P.copy(); back[:, :, 1] += 0.003                  # its back face (seen past the open jacket / a turned body)
    G.grid(back[:, ::-1], UV[:, ::-1], 'blade', 'tie', gain=0.8, inside=lambda p: np.array([0.0, p[1] + 0.05, p[2]]))
    # THE KNOT: a closed ring per row (a rounded trapezoid), narrowing down to the blade's top
    yk = min(_front_y(bvh, x, z) or 0.0 for x in (-0.02, 0.0, 0.02) for z in (zk0, zk1)) - e
    K = []
    for i, z in enumerate(np.linspace(zk0, zk1, 8)):
        f = i / 7.0
        hw = 0.022 - 0.008 * f; d = 0.009 - 0.002 * f
        ring = []
        for a in np.linspace(0, TAU, 16, endpoint=False):
            ring.append((hw * math.cos(a), yk - d - d * math.sin(a) * 0.9, z))
        K.append(ring)
    K = np.array(K)
    G.grid(K, ring_uv(K), 'knot', 'tie', closed=True, inside=lambda p: np.array([0.0, yk - 0.009, p[2]]))
    return G


def build_bowtie(co, bodyF, z0, o):
    """THE BOW TIE: two loops pinched at a knot, at the collar's front"""
    from mathutils.bvhtree import BVHTree
    bvh = BVHTree.FromPolygons([tuple(v) for v in co], [tuple(f) for f in bodyF])
    G = Garment()
    y0 = min(_front_y(bvh, x, z0) or 0.0 for x in (-0.03, 0.0, 0.03)) - o['ease']
    half = 0.054
    xs = np.concatenate([np.linspace(-half, half, 23)])
    NA = 18
    rings = []
    for x in xs:
        u = abs(x) / half
        h = 0.0085 + 0.0175 * min(1.0, u * 1.25) ** 0.7 * (1.0 if u < 0.9 else 1.0 - 0.6 * (u - 0.9) / 0.1)   # pinched at the knot, the loop ends squared off
        d = 0.0055 + 0.0045 * math.sin(math.pi * min(1.0, u * 1.1))
        ring = [(x, y0 - d - d * math.sin(a), z0 + h * math.cos(a) * (1.0 - 0.12 * u * math.sin(a))) for a in np.linspace(0, TAU, NA, endpoint=False)]
        rings.append(ring)
    R = np.array(rings)
    G.grid(R, ring_uv(R), 'bow', 'tie', closed=True, inside=lambda p: np.array([p[0], y0 - 0.006, z0]))
    for s in (-1, 1):                                          # the ends closed
        c = R[0 if s < 0 else -1].mean(axis=0)
        cap = np.array([R[0 if s < 0 else -1], np.tile(c, (NA, 1))])
        G.grid(cap if s > 0 else cap[:, ::-1], ring_uv(cap), 'bow', 'tie', closed=True, inside=lambda p: np.array([0.0, y0 - 0.006, z0]))
    K = []
    for i, x in enumerate(np.linspace(-0.009, 0.009, 4)):     # the knot band round the middle
        K.append([(x, y0 - 0.0062 - 0.0068 * math.sin(a), z0 + 0.0115 * math.cos(a)) for a in np.linspace(0, TAU, NA, endpoint=False)])
    K = np.array(K)
    G.grid(K, ring_uv(K), 'knot', 'tie', closed=True, inside=lambda p: np.array([0.0, y0 - 0.006, z0]))
    return G


def leg_scales(G, o, acc=0):
    """THE SCALES (the Atlantean's leggings): rows of small overlapping tabs over the hips and legs, each hanging from a grid
    point and lifting out at its tip, every other column on alternate rows and twice a column wide (a shingled pattern)"""
    pel = np.array([r[0] for r in G.rows if r[2] == 'c'])
    groups = [(pel[1:], [(float(R_[:, 0].mean()), float(R_[:, 1].mean())) for R_ in pel[1:]], 'tight_c')]
    for s in 'lr':
        T, cs = G.legs[s][0], G.legs[s][1]
        groups.append((T[1:len(T) - o.get('scale_stop', 4)], cs[1:], 'tight_' + s))
    for T, cs, grp in groups:
        R, C = T.shape[:2]
        for r in range(0, R - 2):
            for c in range(r % 2, C, 2):
                p = T[r, c]; q = T[r + 2, c]
                ctr = np.array([cs[r][0], cs[r][1], p[2]])
                out = p - ctr; out[2] = 0; out /= max(1e-9, np.linalg.norm(out))
                side = T[r, (c + 1) % C] - T[r, (c - 1) % C]; wd = 1.15 * np.linalg.norm(side)
                side -= out * (side @ out); side /= max(1e-9, np.linalg.norm(side))
                Q = np.zeros((3, 3, 3)); UV = np.zeros((3, 3, 2))
                for i, t in enumerate((0.0, 0.6, 1.0)):
                    base = p + (q - p) * t * 0.95 + out * (0.0012 + 0.0035 * t + 0.0004 * (r % 2))
                    ww = wd * (0.55 if i == 0 else 1.0 if i == 1 else 0.4)
                    for j, k in enumerate((-1, 0, 1)):
                        Q[i, j] = base + side * ww * 0.5 * k + out * (0.0006 if k == 0 else 0)
                        UV[i, j] = (k * ww * 0.5, t * 0.03)
                G.grid(Q, UV, 'scale', grp, accent=acc, gain=np.array([[0.72] * 3, [0.95] * 3, [1.0] * 3]),
                       inside=lambda pp, ctr=ctr: np.array([ctr[0], ctr[1], pp[2]]))


def build_ghost(co, inbody, headF, pts, o):
    """THE GHOST SHEET: one sheet over the head and the whole body, arms and all, to below the knees. Each column (round a
    vertical axis through the head) hangs like cloth: from the crown it runs straight over the hollows (the neck, under the
    arms: the profile's concave majorant) out to the widest thing under it (the hands), then falls from there to the hem with
    a little flare; folds grow toward the hem; two dark eye patches; sway chains round the hem"""
    from mathutils.bvhtree import BVHTree
    Hd = Head(co, headF, pts, dict(o, ease=o.get('head_ease', o['ease'])))
    NU = o.get('cols', 56)
    us = np.linspace(-math.pi, math.pi, NU, endpoint=False)
    D = np.stack([np.sin(us), -np.cos(us)], 1)
    c0 = np.array([0.0, Hd.cy0])
    nd, nb = o.get('dome_rows', 9), o.get('rows', 52)
    sd = np.linspace(Hd.S * 0.97, Hd.Lc, nd)                     # the dome: the head's capsule, the crown down to its base
    dome = np.array([[Hd.at(u, s_) for u in us] for s_ in sd])
    zs = np.linspace(Hd.zo, o['hem'], nb + 1)[1:]
    skin = co[inbody]
    RAD = np.zeros((nb, NU))
    for r, z in enumerate(zs):
        P2 = skin[np.abs(skin[:, 2] - z) < 0.012][:, :2]
        RAD[r] = ray_polys(minkowski(hull2d(P2), o['ease']), c0, D) if len(P2) >= 3 else 0.0
    # the drape, per column: the junction with the dome + the body rows as (z, r) points; above the widest point the
    # smallest concave majorant (the cloth straight across every hollow), below it the fall
    rj = np.linalg.norm(dome[-1][:, :2] - c0, axis=1)
    hang = zs > o['hem'] + 0.05
    for c in range(NU):
        z_all = np.concatenate([[Hd.zo], zs]); r_all = np.concatenate([[rj[c]], RAD[:, c]])
        im = int(np.argmax(np.where(np.concatenate([[True], hang]), r_all, -1)))
        hull = []
        for i in range(im + 1):                                 # (monotone chain, z falling: keep the r-concave side)
            q = (z_all[i], r_all[i])
            while len(hull) >= 2:
                (z1, r1), (z2, r2) = hull[-2], hull[-1]
                if (r2 - r1) * (z1 - q[0]) <= (q[1] - r1) * (z1 - z2):
                    hull.pop()
                else:
                    break
            hull.append(q)
        hz = np.array([h[0] for h in hull]); hr = np.array([h[1] for h in hull])
        out = np.empty(len(z_all))
        for i, z in enumerate(z_all):
            if i <= im:
                out[i] = np.interp(-z, -hz, hr)
                k = max(0, min(len(hz) - 2, int(np.searchsorted(-hz, -z, side='right')) - 1))   # (the cloth sags a little between
                span = math.hypot(hz[k] - hz[k + 1], hr[k] - hr[k + 1])                       #  two things it rests on)
                t = (hz[k] - z) / max(1e-9, hz[k] - hz[k + 1])
                out[i] = max(r_all[i] + 0.004, out[i] - o.get('sag', 0.10) * span * 4 * t * (1 - t))
            else:
                out[i] = max(r_all[i], r_all[im] + o.get('flare', 0.12) * (z_all[im] - z))
        RAD[:, c] = out[1:]
    RAW = RAD.copy()
    for _ in range(o.get('smooth_u', 3)):                       # (the silhouette round: a light blur across the columns)
        RAD = 0.25 * np.roll(RAD, 1, 1) + 0.5 * RAD + 0.25 * np.roll(RAD, -1, 1)
    RAD = np.maximum(RAD, RAW - 0.004)                          # (never inside a fingertip)
    fold = o.get('folds', 0.02) * smoothstep(o.get('fold_from', 1.15), o['hem'], zs)[:, None] * np.cos(us * o.get('fold_n', 9))[None]
    RAD = RAD + fold
    body = np.zeros((nb, NU, 3))
    body[:, :, 0] = c0[0] + D[None, :, 0] * RAD; body[:, :, 1] = c0[1] + D[None, :, 1] * RAD; body[:, :, 2] = zs[:, None]
    P = np.concatenate([dome, body])
    PH = np.repeat(us[None], len(P), 0)
    UV = ring_uv(P)
    G = Garment()
    ins = lambda p: np.array([0.0, Hd.cy0, min(p[2], Hd.zo)])
    G.grid(P, UV, 'sheet', 'ghost', closed=True, phi=PH, inside=ins)
    pole = Hd.at(0.0, Hd.S); pi_ = len(G.V)
    G.V.append(pole); G.T.append(('sheet', float('nan'), 1.0, 'ghost')); G.A.append(0)
    flip = np.dot(np.cross(P[0, 1] - P[0, 0], pole - P[0, 0]), pole - np.array([0, Hd.cy0, Hd.zo])) < 0
    for c in range(NU):
        a, b = c, (c + 1) % NU
        G.F.append([a, b, pi_] if not flip else [b, a, pi_]); G.FUV.append([UV[0, c], UV[0, (c + 1) % NU], np.array([UV[0, c, 0], UV[0, c, 1] + 0.02])])
    # the hem turned in
    last = P[-1]; ctr = np.array([c0[0], c0[1], last[0, 2]])
    fac = np.array([last, last + 0.012 * np.array([0, 0, 1.0]) - 0.004 * (last - ctr) / np.linalg.norm(last - ctr, axis=1)[:, None]])
    G.grid(fac, ring_uv(fac), 'facing', 'ghost', closed=True, gain=0.8, phi=np.repeat(us[None], 2, 0), inside=lambda p: np.array([0.0, Hd.cy0, p[2]]))
    # the eyes: dark patches where a ray from the head's axis through each eye meets the sheet
    bvh = BVHTree.FromPolygons([tuple(v) for v in G.V], [tuple(f) for f in G.F])
    for k in ('eye_l', 'eye_r'):
        e = np.array(pts[k]) + np.array([0, 0, o.get('eye_up', 0.006)])
        d = e - np.array([0.0, Hd.cy0, e[2]]); d[2] = 0; d /= np.linalg.norm(d)
        d = d + np.array([math.copysign(o.get('eye_out', 0.15), e[0]), 0, 0]); d /= np.linalg.norm(d)
        hit = bvh.ray_cast(Vector(e), Vector(d), 0.4)
        hp, hn = np.array(hit[0]), np.array(hit[1])
        if hn @ d < 0:
            hn = -hn
        ew, eh = o.get('eye_w', 0.016), o.get('eye_h', 0.024)
        seg = 14
        tx = np.cross(np.array([0, 0, 1.0]), hn); tx /= np.linalg.norm(tx); ty = np.cross(hn, tx)
        Q = np.zeros((3, seg, 3)); EU = np.zeros((3, seg, 2))
        for j, a in enumerate(np.linspace(0, TAU, seg, endpoint=False)):
            for i, (f_, h_) in enumerate(((1.0, 0.0006), (0.6, 0.0014), (0.05, 0.0016))):
                Q[i, j] = hp + (tx * math.cos(a) * ew + ty * math.sin(a) * eh) * f_ + hn * h_
                EU[i, j] = (a * ew, i * 0.004)
        G.grid(Q, EU, 'eye', 'ghost', accent=1, closed=True, gain=0.9, inside=lambda p, hp=hp, hn=hn: hp - hn * 0.05)
    # THE SWAY: chains round the hem, from the hips down
    za = o['anchor']
    r0 = len(dome) + int(np.argmin(np.abs(zs - za)))
    nc = o.get('chains', 12)
    G.chains, G.chain_parents = [], []
    for k in range(nc):
        c = int(round(k * NU / nc)) % NU
        js = np.round(np.linspace(r0, len(P) - 1, o.get('joints', 4))).astype(int)
        G.chains.append([int(r * NU + c) for r in js])
        x = math.sin(us[c])
        G.chain_parents.append('thigh_l' if x > 0.3 and o.get('leg_chains') else 'thigh_r' if x < -0.3 and o.get('leg_chains') else 'pelvis')
    G.chain_parent = 'pelvis'
    G.anchor_z = za
    return G


def chain_overlay(W, G, V, f, group):
    """the hanging part rides the sway chains (a cape's / a skirt's way): below the anchor each vertex of `group` fades from
    the body's weights to its two nearest chains (round the wrap), by its height down the chain"""
    sc = (f['K'][3] - f['K'][1]) / (1.6 - 0.52)
    za = G.anchor_z
    cph = [G.T[ch[0]][1] for ch in G.chains]
    cz = [[V[j][2] for j in ch] for ch in G.chains]
    for i in range(len(V)):
        part, phi, gain, grp = G.T[i]
        z = V[i][2]
        if grp != group or math.isnan(phi) or z >= za:
            continue
        fade = float(smoothstep(za, za - 0.10 * sc, z))
        d = np.array([abs(((phi - a) + math.pi) % TAU - math.pi) for a in cph])
        order = np.argsort(d); a0, a1 = int(order[0]), int(order[1])
        wa = d[a1] / max(1e-9, d[a0] + d[a1])
        out = {b: w * (1 - fade) for b, w in W[i].items()}
        for ci, wc in ((a0, wa), (a1, 1 - wa)):
            zj = cz[ci]; seg = 0
            while seg < len(zj) - 2 and z < zj[seg + 1]:
                seg += 1
            key = 'sw%d_%d' % (ci, seg)
            out[key] = out.get(key, 0) + wc * fade
        W[i] = out
    return W


def mummy_wraps(G, o, acc=0):
    """THE BANDAGES (the mummy): a helix of overlapping strips round each tube of the garment (the body, each leg, each
    arm), taken off its own rings: each strip's lower edge stands out over the next turn below (a shingle)"""
    pel = np.array([r[0] for r in G.rows if r[2] == 'c'])
    secs = [(pel, 'tight_c', 1)] + [(G.legs[s][0], 'tight_' + s, -1 if s == 'l' else 1) for s in 'lr']
    secs += [(G.arms[s], 'arm_' + s, 1 if s == 'l' else -1) for s in getattr(G, 'arms', {})]
    cache = o['_cache'].setdefault('wraps', {})           # (the turns per tube: counted on the male, the same on every body)
    rng = np.random.RandomState(o.get('wrap_seed', 7))
    for si_, (P, grp, dirn) in enumerate(secs):
        R, C = P.shape[:2]
        ctr = P.mean(axis=1)
        ls = np.concatenate([[0.0], np.cumsum(np.linalg.norm(np.diff(ctr, axis=0), axis=1))])
        Lt = ls[-1]
        def at(sm, c):
            rf = float(np.interp(sm, ls, np.arange(R)))
            i0 = min(R - 2, int(rf)); t = rf - i0
            p = P[i0, c] * (1 - t) + P[i0 + 1, c] * t
            q = ctr[i0] * (1 - t) + ctr[i0 + 1] * t
            ax = ctr[min(R - 1, i0 + 1)] - ctr[i0]; ax /= max(1e-9, np.linalg.norm(ax))
            d = p - q; d -= ax * (d @ ax); d /= max(1e-9, np.linalg.norm(d))
            return p, d
        nb = cache.setdefault(si_, max(2, int(round(Lt / o.get('wrap_pitch', 0.045)))))
        pitch = Lt / nb; hh = 1.3 * pitch
        for k in range(-1, nb):
            jit, ph = 0.18 * pitch * rng.uniform(-1, 1), rng.uniform(0, TAU)
            top = lambda c: k * pitch + pitch * c / C + jit * math.sin(math.pi * c / C) * math.sin(ph + 2.0 * math.pi * c / C)
            cols = list(range(C + 1)) if dirn > 0 else list(range(C, -1, -1))
            Q = np.zeros((3, C + 1, 3)); UV = np.zeros((3, C + 1, 2))
            for j, c in enumerate(cols):
                for i, (fr, lift) in enumerate(((0.0, 0.0011), (0.55, 0.0022), (1.0, 0.0040))):
                    sm = min(Lt, max(0.0, top(j) + fr * hh))
                    p, d = at(sm, c % C)
                    Q[i, j] = p + d * lift
            for i in range(3):
                seg = np.linalg.norm(np.diff(Q[i], axis=0), axis=1)
                UV[i, :, 0] = np.concatenate([[0], np.cumsum(seg)]); UV[i, :, 1] = i * hh * 0.5
            G.grid(Q, UV, 'wrap', grp, accent=acc, gain=np.array([[0.86] * (C + 1), [1.0] * (C + 1), [0.78] * (C + 1)]),
                   inside=lambda pp, ctr=ctr: ctr[int(np.argmin(np.linalg.norm(ctr - pp, axis=1)))])


def _quad_rc(i, NU):
    return (i // NU, i % NU)


# ═══════════════════════════════ THE TIGHT WEIGHTS + THE SKIN UNDER ═══════════════════════════════
def tight_weights(f, G, V, pools):
    """each vertex: the 6 nearest skin vertices of its group's pool (the skin's own weights, so it moves like the skin)"""
    co = f['co']
    bw = body_bone_weights(f)
    trees = {}
    for g, idx in pools.items():
        kd = KDTree(len(idx))
        for i in idx:
            kd.insert(Vector(co[i]), i)
        kd.balance(); trees[g] = kd
    W = []
    for i in range(len(V)):
        acc = {}
        for (p, j, d) in trees[G.T[i][3]].find_n(Vector(V[i]), 6):
            k = 1.0 / max(1e-4, d) ** 2
            for b, w in bw[j].items():
                acc[b] = acc.get(b, 0) + w * k
        tot = sum(acc.values()) or 1
        W.append({b: w / tot for b, w in acc.items()})
    return W


def tight_hidden(f, V, F, doms, zr=(-1, 9), maxd=0.03, erode=1):
    """hm08 indices of the skin a tight garment covers: straight out along the normal + 2 of 4 tilts hit it within maxd"""
    from mathutils.bvhtree import BVHTree
    h, co, dom, inbody = f['h'], f['co'], f['dom'], f['inbody']
    bvh = BVHTree.FromPolygons([tuple(v) for v in V], [tuple(x) for x in F])
    out = []
    for v in h.data.vertices:
        i = v.index
        if not inbody[i] or dom[i] not in doms or not (zr[0] < co[i, 2] < zr[1]):
            continue
        n = Vector(v.normal); p = Vector(co[i])
        t1 = n.orthogonal().normalized(); t2 = n.cross(t1)
        hits = [bvh.ray_cast(p + d * 0.001, d, maxd * (1.0 if k == 0 else 1.4))[0] is not None
                for k, d in enumerate((n, (n + t1 * 0.6).normalized(), (n - t1 * 0.6).normalized(), (n + t2 * 0.6).normalized(), (n - t2 * 0.6).normalized()))]
        if hits[0] and sum(hits[1:]) >= 2:
            out.append(i)
    # the game drops a skin triangle when ANY of its corners is listed, so a tight garment (no overlap to spare) lists only
    # the vertices whose every neighbour is covered too: no hole opens past its edge
    cov = set(out)
    nb = {}
    for e in h.data.edges:
        a, b = e.vertices
        nb.setdefault(a, []).append(b); nb.setdefault(b, []).append(a)
    for _ in range(erode):
        cov = set(i for i in cov if all(j in cov for j in nb.get(i, [])))
    out = sorted(cov)
    rng = []
    for i in sorted(out):
        if rng and rng[-1][1] == i - 1:
            rng[-1][1] = i
        else:
            rng.append([i, i])
    return rng


RED_LAME = {'color': [0.72, 0.06, 0.08], 'rough': 0.45, 'metal': 0.15}
GOLD_LAME = {'color': [0.96, 0.78, 0.28], 'rough': 0.4, 'metal': 0.3}
WHITE_LYCRA = {'color': [0.93, 0.93, 0.92], 'rough': 0.5, 'metal': 0.0}
GOLD_STRIPE = {'color': [0.85, 0.66, 0.20], 'rough': 0.6, 'metal': 0.0}

TIGHT = {
    'footballpants': {'label': 'Football pants', 'maxd': 0.05, 'kind': 'legs', 'cat': 'bottoms', 'z': 47, 'layer': 'bottom', 'ease': 0.009,
                      'rows_up': 13, 'rows_dn': 26, 'hem_below_knee': 0.08, 'stripes': [(-0.016, -0.006), (0.006, 0.016)], 'pads': True,
                      'accents': [GOLD_STRIPE], 'doms': ('pelvis', 'spine_01', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r')},
    'singlet': {'label': 'Wrestling singlet', 'maxd': 0.05, 'kind': 'legs', 'cat': 'suits', 'z': 50, 'layer': 'top', 'ease': 0.009,
                'rows_up': 32, 'rows_dn': 10, 'erode': 2, 'hem_mid': 0.0, 'straps': True, 'strap_y': -0.005, 'strap_x': 0.098, 'strap_w': 0.046, 'strap_z': -0.20,
                'neckline': [(0.0, -0.215), (0.3, -0.21), (0.5, -0.2), (0.62, -0.19), (0.85, -0.25), (1.15, -0.37), (1.57, -0.41), (2.0, -0.37), (2.3, -0.25), (2.5, -0.19), (2.65, -0.215), (2.85, -0.245), (3.0, -0.26), (3.15, -0.265)],
                'stripes': [(-0.012, 0.012)], 'accents': [WHITE_LYCRA],
                'doms': ('pelvis', 'spine_01', 'spine_02', 'spine_03', 'clavicle_l', 'clavicle_r', 'thigh_l', 'thigh_r')},
    'luchador': {'label': 'Luchador mask', 'kind': 'mask', 'cat': 'masks', 'z': 50, 'ease': 0.004,
                 'eye_w': 0.025, 'eye_h': 0.016, 'mouth_w': 0.028, 'mouth_h': 0.015, 'stripe_w': 0.03,
                 'main': RED_LAME, 'accents': [GOLD_LAME, WHITE_LYCRA], 'doms': ('head', 'neck_01')},
    # ── 4d batch 5c ──
    'ghost': {'label': 'Ghost sheet', 'kind': 'ghost', 'cat': 'suits', 'z': 70, 'ease': 0.022, 'head_ease': 0.03, 'sag': 0.10, 'leg_chains': False, 'anchor_dz': -0.45, 'joints': 3, 'smooth_w': 12, 'maxd': 0.40, 'hem': 0.36,
              'flare': 0.08, 'folds': 0.02, 'fold_n': 9, 'erode': 2,
              'main': {'color': [0.93, 0.93, 0.95], 'rough': 0.85, 'metal': 0.0}, 'accents': [{'color': [0.03, 0.03, 0.04], 'rough': 0.9, 'metal': 0.0}],
              'doms': ('pelvis', 'spine_01', 'spine_02', 'spine_03', 'clavicle_l', 'clavicle_r', 'neck_01', 'head', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r',
                       'upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r', 'hand_l', 'hand_r')},
    'mummy': {'label': 'Mummy wraps', '_cache': {}, 'maxd': 0.05, 'kind': 'legs', 'cat': 'suits', 'z': 50, 'ease': 0.008,
              'top_dz': 0.05, 'rows_up': 40, 'rows_dn': 38, 'hem_below_knee': 0.36, 'foot_z': 0.12, 'xsec': True, 'arms': True, 'wraps': True,
              'shoulder_turns': [(0.72, 0.06), (0.92, 0.06)], 'arm_s0': -0.065,
              'main': {'color': [0.74, 0.68, 0.55], 'rough': 0.95, 'metal': 0.0},
              'doms': ('pelvis', 'spine_01', 'spine_02', 'spine_03', 'clavicle_l', 'clavicle_r', 'neck_01', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r',
                       'upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r')},
    'scaleleggings': {'label': 'Scale leggings', 'maxd': 0.05, 'kind': 'legs', 'cat': 'bottoms', 'z': 47, 'layer': 'bottom', 'ease': 0.007,
                      'rows_up': 13, 'rows_dn': 38, 'hem_below_knee': 0.36, 'foot_z': 0.12, 'xsec': True, 'scales': True,
                      'doms': ('pelvis', 'spine_01', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r')},
    'dorag': {'label': 'Do-rag', 'kind': 'dorag', 'cat': 'hats', 'z': 52, 'ease': 0.006, 'maxd': 0.025, 'tail': 0.15,
              'edge': [(0.0, 0.021), (0.7, 0.025), (1.35, 0.042), (1.85, 0.044), (2.4, -0.015), (math.pi, -0.05)],
              'main': {'color': [0.07, 0.07, 0.08], 'rough': 0.4, 'metal': 0.0}, 'doms': ('head',)},
    # ── THE BLENDER BASICS (2026-11-02): the coded Neckwear picks rebuilt (their own colour, tintable) + the sweatpants ──
    'sweatpants': {'label': 'Sweatpants', 'maxd': 0.05, 'kind': 'legs', 'cat': 'bottoms', 'z': 47, 'layer': 'bottom', 'ease': 0.011,
                   'rows_up': 13, 'rows_dn': 38, 'hem_below_knee': 0.37, 'foot_z': 0.12, 'xsec': True,
                   'doms': ('pelvis', 'spine_01', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r')},
    'tie': {'label': 'Tie', 'kind': 'tie', 'cat': 'equipment', 'z': 57, 'ease': 0.032, 'knot_dz': -0.045, 'tip_dz': 0.035,
            'main': {'color': [0.42, 0.05, 0.07], 'rough': 0.55, 'metal': 0.0}, 'doms': ()},
    'bowtie': {'label': 'Bow tie', 'kind': 'bowtie', 'cat': 'equipment', 'z': 57, 'ease': 0.017, 'at_dz': -0.05,
               'main': {'color': [0.05, 0.05, 0.06], 'rough': 0.5, 'metal': 0.0}, 'doms': ()},
    'suspenders': {'label': 'Suspenders', 'kind': 'suspenders', 'cat': 'equipment', 'z': 60, 'ease': 0.014, 'maxd': 0.03,
                   'strap_x': 0.085, 'strap_w': 0.034, 'strap_z': -0.20, 'strap_lo': 0.05,
                   'main': {'color': [0.06, 0.06, 0.06], 'rough': 0.6, 'metal': 0.0}, 'accents': [{'color': [0.75, 0.75, 0.77], 'rough': 0.3, 'metal': 0.9}],
                   'doms': ('spine_01', 'spine_02', 'spine_03', 'clavicle_l', 'clavicle_r')},
}


def face_points(f, m):
    """the eyes' and the mouth's centres (MakeHuman helper groups) + the head's middle, in the male's frame"""
    h, co = f['h'], f['co']
    names = {g.index: g.name for g in h.vertex_groups}
    want = {'helper-l-eye': 'eye_l', 'helper-r-eye': 'eye_r', 'lips': 'mouth'}
    acc = {k: [] for k in want.values()}
    for v in h.data.vertices:
        for g in v.groups:
            n = names[g.group]
            if n in want and g.weight > 0.5:
                acc[want[n]].append(v.index)
    out = {k: PG.warp(co[idx].mean(axis=0)[None], f, m)[0] for k, idx in acc.items()}
    out['head_mid'] = PG.warp(f['pts']['head'][None], f, m)[0]
    return out


def body_faces(f, doms):
    dom, inbody = f['dom'], f['inbody']
    return [tuple(p.vertices) for p in f['h'].data.polygons if all(inbody[v] and dom[v] in doms for v in p.vertices)]


def build_tight(spec, f, m, holes=None):
    co = PG.warp(f['co'], f, m)
    pts = {k: PG.warp(v[None], f, m)[0] for k, v in f['pts'].items()}
    o = dict(spec)
    if spec['kind'] == 'mask':
        pts.update(face_points(f, m))
        o['bottom'] = m['K'][3] + spec.get('bottom', 0.0); o['dome'] = m['K'][3] + 0.175
        bf = body_faces(f, ('head', 'neck_01'))
        G, holes = build_mask(co, bf, pts, o, holes)
        return G, holes
    if spec['kind'] == 'dorag':
        pts.update(face_points(f, m))
        o['bottom'] = m['K'][3] + spec.get('bottom', 0.0); o['dome'] = m['K'][3] + 0.175
        return build_dorag(co, body_faces(f, ('head', 'neck_01')), pts, o), None
    if spec['kind'] == 'ghost':
        pts.update(face_points(f, m))
        o['bottom'] = m['K'][3]; o['dome'] = m['K'][3] + 0.175
        o['anchor'] = m['K'][2] + spec.get('anchor_dz', -0.10)
        return build_ghost(co, f['inbody'], body_faces(f, ('head', 'neck_01')), pts, o), None
    if spec['kind'] == 'tie':
        return build_tie(co, body_faces(f, TORSO_B), m['K'][3] + spec['knot_dz'], m['K'][2] + spec['tip_dz'], o), None
    if spec['kind'] == 'bowtie':
        return build_bowtie(co, body_faces(f, TORSO_B), m['K'][3] + spec['at_dz'], o), None
    if spec['kind'] == 'suspenders':
        return build_suspenders(co, body_faces(f, TORSO_B), m['K'][2] + spec.get('strap_lo', 0.0), m['K'][3] + spec['strap_z'], o), None
    mp = m['pts']
    o['neck'] = m['K'][3]
    o['top'] = m['K'][3] + max(d for _, d in spec['neckline']) + 0.004 if spec.get('neckline') else m['K'][3] + spec['top_dz'] if 'top_dz' in spec else m['K'][2]
    if 'hem_below_knee' in spec:
        o['hem'] = mp['calf_l'][2] - spec['hem_below_knee']
    else:
        o['hem'] = 0.5 * (mp['thigh_l'][2] + mp['calf_l'][2]) + spec['hem_mid']
    o['_edges'] = np.array([tuple(e.vertices) for e in f['h'].data.edges])
    G, L = build_legs(co, f['dom'], f['inbody'], pts, o)
    if spec.get('stripes'):
        side_stripes(G, G.rows, spec['stripes'], 1, 1 + L.n_out)
    if spec.get('pads'):
        knee_pads(G, L, mp['calf_l'][2] + 0.01, 0.055)
    if spec.get('scales'):
        leg_scales(G, o)
    if spec.get('arms'):                                   # tight tubes down the arms (the coat sleeve's rings, no ease to spare)
        G.arms = {}
        for s in 'lr':
            SP, SUV, _ = PG.sleeve(co, f['dom'], f['inbody'], pts, s, n_around=spec.get('arm_k', 24), ease0=o['ease'], ease1=o['ease'], s0=spec.get('arm_s0', -0.035))
            ctr = SP.mean(axis=1)
            G.grid(SP, SUV, 'arm', 'arm_' + s, closed=True,
                   inside=lambda p, SP=SP, ctr=ctr: ctr[int(np.argmin(np.linalg.norm(SP.reshape(-1, 3) - p, axis=1))) // SP.shape[1]])
            G.arms[s] = SP
        # the shoulders: turns over the top of each shoulder (front -> back) between the body's wraps and the arm's
        sh = pts['upperarm_l']
        bf = body_faces(f, TORSO_B + PG.arm_bones('l') + PG.arm_bones('r'))
        for xs, w in spec.get('shoulder_turns', ()):
            straps(G, co, bf, sh[2] - 0.01, dict(o, strap_x=xs * abs(sh[0]), strap_w=w, strap_y=sh[1]), grp={1.0: 'arm_l', -1.0: 'arm_r'})
    if spec.get('wraps'):
        mummy_wraps(G, o)
    if spec.get('straps'):
        straps(G, co, body_faces(f, TORSO_B), o['neck'] + spec['strap_z'], o)
    G.L = L
    return G, None


def bake_tight(key, spec, frames, m, out, tiles, views=None):
    name = 'ewb_' + key
    Gm, holes = build_tight(spec, m, m)
    builds = {'male': (PG.unwarp(np.array(Gm.V), m, m), Gm)}
    for b, f in frames.items():
        if b != 'male':
            G, _ = build_tight(spec, f, m, holes)
            builds[b] = (PG.unwarp(np.array(G.V), f, m), G)
    V, G = builds['male']
    for b, (Vb, Gb) in builds.items():
        assert len(Vb) == len(V) and len(Gb.F) == len(G.F), 'topology differs on ' + b
        assert np.isfinite(Vb).all(), 'NaN vertices on ' + b
    # THE WELD: where two pieces share a row (the hips' last row = the legs' first), one vertex (one normal: no crease)
    first, remap = {}, np.arange(len(V))
    for i, p in enumerate(np.round(V, 7)):
        j = first.setdefault(tuple(p), i)
        if j != i and all(np.allclose(Vb[i], Vb[j], atol=1e-7) for Vb, _ in builds.values()):
            remap[i] = j
    G.F = [[int(remap[i]) for i in f] for f in G.F]
    # THE WEIGHTS: each body's own skin under the garment, averaged over the five (one set of weights for all of them: a
    # female body's chest rides the collarbones more than the male's, and a tight top must follow it there too)
    W = [dict() for _ in range(len(V))]
    for b, f in frames.items():
        co, dom, inbody = f['co'], f['dom'], f['inbody']
        if spec['kind'] in ('mask', 'dorag'):
            pools = {'mask': [i for i in range(len(co)) if inbody[i] and dom[i] in ('head', 'neck_01')]}
        elif spec['kind'] in ('tie', 'bowtie'):
            pools = {'tie': [i for i in range(len(co)) if inbody[i] and dom[i] in ('spine_03', 'neck_01', 'clavicle_l', 'clavicle_r')]}
        elif spec['kind'] == 'ghost':
            pools = {'ghost': [i for i in range(len(co)) if inbody[i] and not dom[i].startswith(('foot_', 'ball_', 'thigh_', 'calf_'))]}
        else:
            torso = [i for i in range(len(co)) if inbody[i] and dom[i] in TORSO_B]
            legs = {s: [i for i in range(len(co)) if inbody[i] and dom[i] in ('thigh_' + s, 'calf_' + s)] for s in 'lr'}
            pools = {'tight_c': torso + legs['l'] + legs['r'], 'tight_l': torso + legs['l'], 'tight_r': torso + legs['r']}
            for s in 'lr':
                pools['arm_' + s] = [i for i in range(len(co)) if inbody[i] and dom[i] in PG.arm_bones(s) + ('clavicle_' + s,)]
        Wb = tight_weights(f, G, builds[b][0], pools)
        if spec['kind'] == 'ghost':
            # a sheet held off the body (bridging under the arms, hanging from the hands) rides the torso, not the limb it is
            # nearest: the farther from any skin, the more the torso's weights take over
            core = [i for i in range(len(co)) if inbody[i] and dom[i] in TORSO_B + ('head',)]
            Wc = tight_weights(f, G, builds[b][0], {'ghost': core})
            kd = KDTree(len(pools['ghost']))
            for i in pools['ghost']:
                kd.insert(Vector(co[i]), i)
            kd.balance()
            for i, p_ in enumerate(builds[b][0]):
                t = float(smoothstep(spec.get('near', 0.05), spec.get('far', 0.16), kd.find(Vector(p_))[2]))
                if t > 0:
                    w2 = {k: x * (1 - t) for k, x in Wb[i].items()}
                    for k, x in Wc[i].items():
                        w2[k] = w2.get(k, 0.0) + x * t
                    Wb[i] = w2
        for i, w in enumerate(Wb):
            for k, x in w.items():
                W[i][k] = W[i].get(k, 0.0) + x / len(frames)
    chains = None
    if spec['kind'] == 'ghost':                          # (a sheet over a hand rides the hand, never a curling finger)
        fing = ('thumb_', 'index_', 'middle_', 'ring_', 'pinky_')
        for i, w in enumerate(W):
            if any(k.startswith(fing) for k in w):
                w2 = {}
                for k, x in w.items():
                    kk = ('hand_' + k[-1]) if k.startswith(fing) else k
                    w2[kk] = w2.get(kk, 0.0) + x
                W[i] = w2
    if spec.get('smooth_w'):
        # a loose sheet: no seam where the nearest skin changes bone (the neck, under the arms) - the weights averaged over
        # the sheet's own neighbours, a few times
        nb = {}
        for fc in G.F:
            for a in fc:
                for b in fc:
                    if a != b and G.T[a][0] == 'sheet' and G.T[b][0] == 'sheet':
                        nb.setdefault(a, set()).add(b)
        for _ in range(spec['smooth_w']):
            W2 = list(W)
            for i, js in nb.items():
                acc = {k: 0.5 * x for k, x in W[i].items()}
                for j in js:
                    for k, x in W[j].items():
                        acc[k] = acc.get(k, 0.0) + 0.5 * x / len(js)
                W2[i] = acc
            W = W2
    if getattr(G, 'chains', None):
        W = chain_overlay(W, G, V, m, 'ghost')
        chains = {'parent': G.chain_parent, 'joints': G.chains, 'parents': getattr(G, 'chain_parents', None)}
    # the skin each body hides under it (ewWear.delBy: the garment sits a little differently on each body, and a tight one
    # has no overlap to spare: one list for all five either opens holes past an edge or lets the skin poke through)
    delBy = {b: tight_hidden(f, builds[b][0], G.F, spec['doms'], maxd=spec.get('maxd', 0.03), erode=spec.get('erode', 1)) for b, f in frames.items()}
    dl = delBy['male']
    S = PG.shade(m, V, G.F, G.T)
    main = spec.get('main', {'color': [1, 1, 1], 'rough': 0.8})
    accent_mats = [main] + list(spec.get('accents', []))
    wear = {'name': name, 'pack': 'entropywars', 'cat': spec['cat'], 'z': spec['z'], 'del': dl, 'uv': 'm',
            'accents': [dict(color=a.get('color'), rough=a.get('rough', 0.9), metal=a.get('metal', 0)) for a in accent_mats]}
    if spec.get('layer'):
        wear['layer'] = spec['layer']
    wear['delBy'] = delBy
    path = os.path.join(out, name + '.glb')
    ntri, bones = write_glb(path, {b: builds[b][0] for b in builds}, G.F, G.FUV, W, S, G.A, wear, [], accent_mats, chains)
    print('[bake-clothes] %-28s %6d tris %5d KB  hides %d skin verts  chains %d  bones %s' % (
        name, ntri, os.path.getsize(path) // 1024, sum(r[1] - r[0] + 1 for r in dl), len(chains['joints']) if chains else 0, ','.join(bones)))
    if views:
        os.makedirs(views, exist_ok=True)
        for b, f in frames.items():
            Vb, Gb = builds[b]
            np.savez(os.path.join(views, '%s_%s.npz' % (name, b)), V=Vb, F=np.array(PG.tris(Gb.F)), A=np.array(Gb.A), S=S,
                     body=f['co'], bodyF=np.array([tuple(p.vertices) for p in f['h'].data.polygons if all(f['inbody'][v] for v in p.vertices) and len(p.vertices) == 4]))
    return {'id': name, 'file': name, 'label': spec['label'], 'cat': spec['cat'], 'tris': ntri, 'kb': os.path.getsize(path) // 1024}


# ═══════════════════════════════ THE BLENDER SHOES (row 12c: the Feet layer built as real shoes) ═══════════════════════════════
# 2026-11-01, mondo: "can you redo the shoes in blender like you did the capes and stuff". The creator's Feet picks (sneakers,
# boots, high boots, sandals) were the classic shell pushed out from the foot's skin; these are built like a shoe is: a LAST
# (the foot's own convex hull + ease, so the toe box bridges the toes and the side wall bridges the arch, with a few points
# added where a style shapes it: a roomy toe box, a cowboy boot's pointed toe), an UPPER laid over it as MERIDIANS (from the
# welt round the whole sole outline, each rising in its own vertical plane through the foot's middle line up to the collar
# or over the top), a SOLE that is its own piece (a welt lip, a side wall, a heel stack with its breast, a raised shank, toe
# spring), and the parts sewn on: a padded collar, a tongue, eyelets + criss-cross laces, a shaft of rings round the leg (the
# leg's own cross-section + ease, a turned top edge, a scalloped top + pull tabs on the cowboy boot), sandal straps + a buckle.
# Built on each MPFB body's own feet (both sides, the same rows and columns on every body), weighted to the foot / toes /
# shin skin under it, the skin inside hidden (ewWear.delBy). The upper is painted by the Feet layer's fabric / colour / print
# (ewWear.layer = 'feet'); soles, laces, eyelets, stitching are accents with their own colour.

SOLE_WHITE = {'color': [0.92, 0.91, 0.88], 'rough': 0.7, 'metal': 0.0}
SOLE_DARK = {'color': [0.07, 0.065, 0.06], 'rough': 0.8, 'metal': 0.0}
SOLE_LEATHER = {'color': [0.28, 0.17, 0.09], 'rough': 0.6, 'metal': 0.0}
SOLE_CORK = {'color': [0.66, 0.50, 0.33], 'rough': 0.9, 'metal': 0.0}
LACE_WHITE = {'color': [0.95, 0.95, 0.93], 'rough': 0.8, 'metal': 0.0}
LACE_DARK = {'color': [0.10, 0.08, 0.07], 'rough': 0.8, 'metal': 0.0}
EYELET = {'color': [0.72, 0.72, 0.74], 'rough': 0.3, 'metal': 0.9}
STITCH = {'color': [0.86, 0.74, 0.52], 'rough': 0.8, 'metal': 0.0}

# u = along the foot (0 heel -> 1 toe); heights in metres for a 0.265 m foot (scaled per body). Keys:
#   welt (heel, fore, toe)   the upper's bottom edge (= the sole's top) at the heel / forefoot / toe tip
#   bottom (heel, arch, fore, toe) the sole's underside (a little under the floor where it stands, raised under the arch / toe spring)
#   heel_u, inset_heel       the heel stack ends at heel_u (its breast); its foot pulled in by inset_heel (a tapered heel)
#   collar (back, dip)       low shoes: the opening, a plane from the heel back down to the throat, dipping under the ankle bones
#   throat                   u of the opening's front tip (the vamp closes in front of it)
#   join, shaft              boots: the foot part ends at `join`; the shaft rises to `shaft` (or shaft_k x the knee's height)
SHOES = {
    'sneakers': {'label': 'Sneakers (Blender)', 'ease': 0.0055, 'margin': 0.0045, 'sole_acc': SOLE_WHITE,
                 'welt': (0.030, 0.021, 0.026), 'bottom': (-0.002, -0.002, -0.002, 0.006), 'heel_u': None,
                 'collar': (0.066, 0.010), 'throat': 0.47, 'toebox': 0.011, 'pad': 0.0055, 'tongue': 0.022,
                 'laces': dict(u0=0.48, u1=0.70, n=6, w=0.0145, acc=LACE_WHITE), 'toe_cap': True},
    'boots': {'label': 'Boots (Blender)', 'ease': 0.0065, 'margin': 0.0055, 'sole_acc': SOLE_DARK,
              'welt': (0.033, 0.020, 0.020), 'bottom': (-0.003, 0.005, -0.003, 0.003), 'heel_u': 0.27, 'inset_heel': 0.002,
              'join': 0.105, 'shaft': 0.165, 'shaft_ease': 0.0085, 'toebox': 0.005, 'pad': 0.0065,
              'laces': dict(u0=0.50, u1=0.66, n=8, w=0.0135, acc=LACE_DARK), 'top_band': 0.014},
    'highboots': {'label': 'High boots (Blender)', 'ease': 0.006, 'margin': 0.0045, 'sole_acc': SOLE_LEATHER,
                  'welt': (0.034, 0.016, 0.016), 'bottom': (-0.003, 0.006, -0.003, 0.003), 'heel_u': 0.26, 'inset_heel': 0.003,
                  'join': 0.105, 'shaft_k': 0.86, 'shaft_ease': 0.0065, 'toebox': 0.002, 'top_band': 0.03, 'pull_strap': True},
    'sandals': {'label': 'Sandals (Blender)', 'ease': 0.003, 'margin': 0.006, 'sole_acc': SOLE_CORK, 'upper': False,
                'welt': (0.020, 0.016, 0.016), 'bottom': (-0.002, -0.002, -0.002, 0.003), 'heel_u': None,
                'straps': [(0.58, 0.016), (0.76, 0.020)], 'ankle': 0.078, 'side_u': 0.30, 'strap_w': 0.013},
    'cowboy': {'label': 'Cowboy boots', 'ease': 0.006, 'margin': 0.004, 'sole_acc': SOLE_LEATHER,
               'welt': (0.047, 0.016, 0.017), 'bottom': (-0.003, 0.012, -0.003, 0.005), 'heel_u': 0.25, 'inset_heel': 0.008,
               'join': 0.11, 'shaft': 0.30, 'shaft_ease': 0.0075, 'scallop': 0.032, 'point': 0.028, 'toebox': 0.0,
               'pull_tabs': True, 'stitch': STITCH, 'top_band': 0.0},
}
SHOE_J = 26          # meridians per side (+ heel + toe): 2 * SHOE_J around
SHOE_M = 15          # rows up each meridian
SHAFT_K = 36         # columns round a shaft


def _isin(dom, names):
    return np.array([d in names for d in dom])


def _exit(eq, o, D, ease):
    """distance from o (inside) along unit D to the convex hull (scipy equations: n.x + d <= 0 inside) pushed out by ease"""
    nd = eq[:, :3] @ D
    num = -(eq[:, :3] @ o + eq[:, 3] - ease)
    ok = nd > 1e-9
    return float(np.min(num[ok] / nd[ok])) if ok.any() else 0.0


def _poly_section(H, a):
    """(c_min, c_max) where the line A = a crosses the convex polygon H (A, C)"""
    cs = []
    n = len(H)
    for i in range(n):
        p, q = H[i], H[(i + 1) % n]
        if (p[0] - a) * (q[0] - a) <= 0 and abs(q[0] - p[0]) > 1e-12:
            t = (a - p[0]) / (q[0] - p[0]); cs.append(p[1] + t * (q[1] - p[1]))
    if not cs:
        j = int(np.argmin(np.abs(H[:, 0] - a))); return float(H[j, 1]), float(H[j, 1])
    return float(min(cs)), float(max(cs))


def _resample(Pl, n):
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Pl, axis=0), axis=1))])
    if s[-1] < 1e-9:
        return np.repeat(Pl[:1], n, axis=0)
    t = np.linspace(0, s[-1], n)
    return np.stack([np.interp(t, s, Pl[:, k]) for k in range(Pl.shape[1])], 1)


def _smooth_rows(R, passes=2):
    for _ in range(passes):
        R2 = R.copy(); R2[1:-1] = 0.25 * R[:-2] + 0.5 * R[1:-1] + 0.25 * R[2:]; R = R2
    return R


class FootLast:
    """one foot of one body in its own frame: A along the foot (0 = heel back), C across (+ = the outer side), Z up from the
    floor; the last = the convex hull of the foot + ankle skin below z_cut (+ a style's added points), pushed out by `ease`"""
    def __init__(self, f, s, spec):
        co, dom, inbody, pts = f['co'], f['dom'], f['inbody'], f['pts']
        self.s, self.spec = s, spec
        foot = inbody & _isin(dom, ('foot_' + s, 'ball_' + s))
        self.legm = inbody & _isin(dom, ('foot_' + s, 'ball_' + s, 'calf_' + s))
        self.ringm = inbody & _isin(dom, ('foot_' + s, 'ball_' + s, 'calf_' + s, 'thigh_' + s))   # (a shaft's top near the knee)
        self.z0 = float(co[foot, 2].min())
        low = foot & (co[:, 2] < self.z0 + 0.035)
        a = (pts['ball_' + s] - pts['foot_' + s])[:2]; a = a / np.linalg.norm(a)
        P2 = co[low, :2] - co[low, :2].mean(axis=0)
        w, v = np.linalg.eigh(P2.T @ P2)
        ax = v[:, np.argmax(w)]; ax = ax if ax @ a > 0 else -ax
        a = 0.5 * (a + ax); a /= np.linalg.norm(a)                  # (the bones' line and the footprint's long axis, halved)
        c = np.array([a[1], -a[0]])
        if (c[0] > 0) != (s == 'l'):
            c = -c
        self.a3 = np.array([a[0], a[1], 0.0]); self.c3 = np.array([c[0], c[1], 0.0])
        A = co[:, :2] @ a; C = co[:, :2] @ c
        self.O = np.array([0.0, 0.0, self.z0])
        A0 = float(A[foot & (co[:, 2] < self.z0 + 0.10)].min())
        Cm = float(C[low].mean())
        self.O[:2] = a * A0 + c * Cm
        self.L3 = np.stack([A - A0, C - Cm, co[:, 2] - self.z0], 1)          # every skin vertex in this foot's frame
        fl = self.L3[foot & (self.L3[:, 2] < 0.10)]
        self.L = float(fl[:, 0].max())
        self.k = self.L / 0.265                                              # (sizes are given for a 0.265 m foot)
        self.knee = float(pts['calf_' + s][2] - self.z0)
        self.ease = spec['ease']

    def wdir(self, D):
        D = np.asarray(D, float)
        return D[..., :1] * self.a3 + D[..., 1:2] * self.c3 + D[..., 2:3] * np.array([0, 0, 1.0])

    def world(self, P):
        P = np.asarray(P, float)
        return self.O + P[..., :1] * self.a3 + P[..., 1:2] * self.c3 + P[..., 2:3] * np.array([0, 0, 1.0])

    def build_hull(self, z_cut, extra=()):
        from scipy.spatial import ConvexHull
        Pk = self.L3[self.legm & (self.L3[:, 2] < z_cut)]
        if len(extra):
            Pk = np.concatenate([Pk, np.asarray(extra, float)])
        self.hull_pts = Pk
        self.eq = ConvexHull(Pk).equations
        # the sole's outline: the foot's footprint (everything below 6 cm, seen from below) + ease + margin
        Hs = hull2d(Pk[Pk[:, 2] < 0.06 * self.k][:, :2])
        self.outline = minkowski(Hs, self.ease + self.spec['margin'], 32)
        self.amin, self.amax = float(self.outline[:, 0].min()), float(self.outline[:, 0].max())

    def exit(self, o, D, extra=0.0):
        D = np.asarray(D, float); D = D / np.linalg.norm(D)
        return np.asarray(o, float) + D * _exit(self.eq, np.asarray(o, float), D, self.ease + extra)

    def A_of(self, u):
        return self.amin + 1e-5 + (self.amax - self.amin - 2e-5) * (1 - math.cos(math.pi * u)) / 2

    def spine(self, A):
        """the meridians' origin for a station at A: on the foot's middle line, inside, clamped short of the heel / toe ends"""
        lo, hi = self.amin + 0.045 * self.k, self.amax - 0.05 * self.k
        Ac = min(max(A, lo), hi)
        c0, c1 = _poly_section(self.outline, Ac)
        Cc = 0.5 * (c0 + c1)
        top = self.exit((Ac, Cc, 0.004), (0, 0, 1.0))[2]
        return np.array([Ac, Cc, max(0.008, min(0.42 * top, 0.035 * self.k))])

    def meridian(self, o, d2, zw, clip, n):
        """the upper's column in the vertical plane through o along d2 (2D): from the welt (Z = zw) up to clip(A, C) or over
        the top; resampled to n points; + whether the top was clipped"""
        th = np.linspace(-1.25, math.pi / 2, 160)
        H = np.array([self.exit(o, (math.cos(t) * d2[0], math.cos(t) * d2[1], math.sin(t))) for t in th])
        i0 = int(np.argmax(H[:, 2] >= zw))
        if i0 > 0:
            t = (zw - H[i0 - 1, 2]) / max(1e-9, H[i0, 2] - H[i0 - 1, 2]); start = H[i0 - 1] + (H[i0] - H[i0 - 1]) * t
        else:
            start = H[0]
        Pl = [start]
        clipped = False
        for j in range(i0, len(H)):
            p = H[j]; cz = clip(p[0], p[1])
            if p[2] > cz:
                q = Pl[-1]; cq = clip(q[0], q[1])
                t = (cq - q[2]) / max(1e-9, (p[2] - q[2]) - (cz - cq))
                Pl.append(q + (p - q) * min(1.0, max(0.0, t))); clipped = True
                break
            Pl.append(p)
        Pl = np.array(Pl)
        return _resample(Pl, n), clipped

    def cross(self, u, zw, clip, n):
        """the outer and the inner meridian at station u (a strap / a lace row): outer welt -> top -> inner welt"""
        A = self.A_of(u); c0, c1 = _poly_section(self.outline, A)
        o = self.spine(A)
        mo, _ = self.meridian(o, np.array([A - o[0], c1 - o[1]]) / max(1e-9, np.hypot(A - o[0], c1 - o[1])), zw, clip, n)
        mi, _ = self.meridian(o, np.array([A - o[0], c0 - o[1]]) / max(1e-9, np.hypot(A - o[0], c0 - o[1])), zw, clip, n)
        return np.concatenate([mo, mi[::-1][1:]])

    def ring(self, z, extra=0.0):
        """the leg's own cross-section at height z (where the skin's edges cross it; the shin's rings are far apart) + ease"""
        if not hasattr(self, 'legE'):
            E = self.edges
            E = E[self.ringm[E[:, 0]] & self.ringm[E[:, 1]]]
            self.legE = E[np.linalg.norm(self.L3[E[:, 0]] - self.L3[E[:, 1]], axis=1) < 0.09]
        E = self.legE
        za, zb = self.L3[E[:, 0], 2], self.L3[E[:, 1], 2]
        x = (za - z) * (zb - z) <= 0
        E2, za, zb = E[x], za[x], zb[x]
        t = ((z - za) / np.where(np.abs(zb - za) < 1e-9, 1e-9, zb - za))[:, None]
        P2 = (self.L3[E2[:, 0]] * (1 - t) + self.L3[E2[:, 1]] * t)[:, :2]
        if len(P2) < 4:
            P2 = self.L3[self.legm & (np.abs(self.L3[:, 2] - z) < 0.015)][:, :2]
        return minkowski(hull2d(P2), self.ease + extra, 24)


def shaft_table(FL, z_lo, z_hi, extra, phis, dz=0.004):
    """r(z, phi) + the centre per height for a shaft between z_lo and z_hi, smoothed in height (no step where a skin ring sits)"""
    zs = np.arange(z_lo - 0.01, z_hi + 0.012, dz)
    cen, R = [], []
    for z in zs:
        H = FL.ring(z, extra)
        c = poly_centroid(H)
        cen.append(c)
        R.append(H)
    cen = _smooth_rows(np.array(cen), 6)
    rad = np.array([[ray_poly(R[i], cen[i], np.array([math.cos(p), math.sin(p)])) for p in phis] for i in range(len(zs))])
    rad = _smooth_rows(rad, 5)
    return zs, cen, rad


def shaft_point(tab, z, phi_i, phis, extra=0.0):
    zs, cen, rad = tab
    c = np.array([np.interp(z, zs, cen[:, 0]), np.interp(z, zs, cen[:, 1])])
    r = np.interp(z, zs, rad[:, phi_i]) + extra
    p = phis[phi_i]
    return np.array([c[0] + math.cos(p) * r, c[1] + math.sin(p) * r, z])


def shaft_at(tab, z, ang, phis, extra=0.0):
    """the shaft's surface at height z, angle ang (radians, 0 = toward the toes), radii interpolated between the columns"""
    zs, cen, rad = tab
    K = len(phis)
    x = (ang % TAU) / TAU * K
    j0 = int(math.floor(x)) % K; j1 = (j0 + 1) % K; t = x - math.floor(x)
    c = np.array([np.interp(z, zs, cen[:, 0]), np.interp(z, zs, cen[:, 1])])
    r = np.interp(z, zs, rad[:, j0]) * (1 - t) + np.interp(z, zs, rad[:, j1]) * t + extra
    return np.array([c[0] + math.cos(ang) * r, c[1] + math.sin(ang) * r, z])


def _band(G, Pl, Nl, wdir, w, t, part, group, accent):
    """a flat strap along the polyline Pl (on the surface, normals Nl): width w across wdir, thickness t (a closed box section)"""
    K = len(Pl)
    Q = np.zeros((K, 4, 3)); UV = np.zeros((K, 4, 2))
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Pl, axis=0), axis=1))])
    for k in range(K):
        n = Nl[k] / max(1e-9, np.linalg.norm(Nl[k])); wd = wdir[k] - n * (wdir[k] @ n); wd /= max(1e-9, np.linalg.norm(wd))
        Q[k] = [Pl[k] - wd * w / 2, Pl[k] - wd * w / 2 + n * t, Pl[k] + wd * w / 2 + n * t, Pl[k] + wd * w / 2]
        UV[k] = [(s[k], 0), (s[k], t), (s[k], t + w), (s[k], 2 * t + w)]
    G.grid(Q, UV, part, group, accent=accent, closed=True, gain=0.95)


def _lace(G, a, b, mid_lift, project, world, part, group, accent, r=0.0021):
    P = np.array([a + (b - a) * t for t in np.linspace(0, 1, 7)])
    P[1:-1] = np.array([project(p, mid_lift) for p in P[1:-1]])
    tube(G, world(P), r, part, group, accent=accent, seg=6, gain=0.9)


def build_shoe_side(f, s, spec, G, accents):
    """one shoe on one foot (local frame -> the body's own coordinates); appends to G; returns the FootLast"""
    FL = FootLast(f, s, spec)
    FL.edges = f['_edges']
    k = FL.k
    grp = 'shoe_' + s
    A_SOLE = accents['sole']
    upper = spec.get('upper', True)
    boot = 'join' in spec
    join = spec.get('join', 0.0) * k
    # ── the last ──
    extra = []
    tb = spec.get('toebox', 0.0) * k
    toes = FL.L3[FL.legm & (FL.L3[:, 0] > 0.78 * FL.L) & (FL.L3[:, 2] < 0.06)]
    if tb > 0 and len(toes):                       # a roomy toe box: the toes' top lifted, the tip carried forward a little
        extra += list(toes + np.array([tb * 0.5, 0, tb]))
    if spec.get('point'):                          # the cowboy toe: the tip drawn forward to a point, narrowing
        pt = spec['point'] * k
        tipA = float(toes[:, 0].max()) if len(toes) else FL.L
        cm = float(np.mean(toes[:, 1])) if len(toes) else 0.0
        for zz in (0.006, 0.014, 0.022):
            extra += [(tipA + pt, cm, zz * k), (tipA + pt * 0.55, cm + 0.016 * k, zz * k), (tipA + pt * 0.55, cm - 0.016 * k, zz * k)]
    z_cut = (join + 0.03 * k) if boot else ((spec.get('collar', (0.07,))[0] + 0.04) * k if upper else 0.10 * k)
    FL.build_hull(z_cut, extra)
    # ── the stations round the sole outline: the outer side heel -> toe, the inner side toe -> heel (u shared by both) ──
    J = SHOE_J
    us = list(0.5 - 0.5 * np.cos(np.linspace(0, math.pi, J + 1)))
    if spec.get('heel_u'):                         # the heel's breast: two stations a hair apart (the count stays)
        hu_ = spec['heel_u']
        j = max(i for i in range(len(us) - 1) if us[i] < hu_)
        us[j], us[j + 1] = hu_ - 0.004, hu_ + 0.004
    us = np.array(us)
    loop = [(u, 1) for u in us] + [(u, 0) for u in us[::-1][1:-1]]      # (u, outer?)
    NK = len(loop)
    wl = spec['welt']; bt = spec['bottom']
    hu = spec.get('heel_u') or 0.22
    def z_welt(u):
        h = wl[0] + (wl[1] - wl[0]) * float(smoothstep(hu - 0.03, hu + 0.10, u))
        return (h + (wl[2] - wl[1]) * float(smoothstep(0.80, 0.97, u))) * k
    def z_bot(u):
        if spec.get('heel_u'):
            if u < hu:
                return bt[0] * k
            z = bt[1] + (bt[2] - bt[1]) * float(smoothstep(0.42, 0.62, u))
        else:
            z = bt[0] + (bt[2] - bt[0]) * float(smoothstep(0.3, 0.5, u))
        return (z + (bt[3] - bt[2]) * float(smoothstep(0.84, 1.0, u))) * k
    def inset(u):
        return (spec.get('inset_heel', 0.0) * k) if (spec.get('heel_u') and u < hu) else 0.0
    # ── the clip: where the upper ends ──
    if boot:                                       # (in front of the ankle the upper rises 2.5 cm more: it goes on under the shaft)
        clip = lambda A, C: join + 0.025 * k * float(smoothstep(0.22 * FL.L, 0.36 * FL.L, A))
    elif upper:
        thA = FL.A_of(spec['throat'])
        o_t = FL.spine(thA)
        zt = FL.exit((thA, o_t[1], 0.004), (0, 0, 1.0))[2] - 0.003
        back, dip = spec['collar'][0] * k, spec['collar'][1] * k
        ankA = 0.20 * FL.L
        def clip(A, C):
            if A >= thA:
                return 9.0
            z = back + (zt - back) * max(0.0, A) / thA
            side = min(1.0, abs(C) / (0.035 * k))
            return z - dip * math.exp(-((A - ankA) / (0.05 * k)) ** 2) * side
    else:
        clip = lambda A, C: 0.0
    # ── the outline points + the meridians ──
    Q = []; Wk = []; MER = np.zeros((SHOE_M, NK, 3)); clipped = []
    for i, (u, outer) in enumerate(loop):
        A = FL.A_of(u); c0, c1 = _poly_section(FL.outline, A)
        if u <= 1e-9 or u >= 1 - 1e-9:
            q = np.array([A, 0.5 * (c0 + c1)])
        else:
            q = np.array([A, c1 if outer else c0])
        Q.append(q)
        o = FL.spine(A)
        d2 = q - o[:2]; d2 /= max(1e-9, np.linalg.norm(d2))
        if upper:
            m, cl = FL.meridian(o, d2, z_welt(u), clip, SHOE_M)
            MER[:, i] = m; clipped.append(cl)
            Wk.append(m[0])
        else:
            p = FL.exit(o, (d2[0], d2[1], 0.0), -FL.ease + 0.0008); p[2] = z_welt(u); Wk.append(p)
    Q = np.array(Q); Wk = np.array(Wk)
    W_ = lambda P: FL.world(P)
    inside = lambda p: FL.world(FL.spine(float(np.clip((p - FL.O) @ FL.a3, 0, FL.L))))
    if upper:
        for _ in range(6):
            M2 = MER.copy()
            M2[1:-1] = 0.5 * MER[1:-1] + 0.125 * (MER[:-2] + MER[2:] + np.roll(MER[1:-1], 1, axis=1) + np.roll(MER[1:-1], -1, axis=1))
            MER = M2
        for i in range(NK):                          # (smoothing pulls a convex surface inward: back out onto the last)
            for r in range(1, SHOE_M - 1):
                o = FL.spine(MER[r, i, 0])
                q = FL.exit(o, MER[r, i] - o, -0.0022)
                if np.linalg.norm(q - o) > np.linalg.norm(MER[r, i] - o):
                    MER[r, i] = q
        UVm = np.zeros((SHOE_M, NK, 2))
        for r in range(SHOE_M):
            seg = np.linalg.norm(np.diff(np.concatenate([MER[r], MER[r][:1]]), axis=0), axis=1)
            UVm[r, :, 0] = np.concatenate([[0], np.cumsum(seg)[:-1]])
        for i in range(NK):
            UVm[:, i, 1] = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(MER[:, i], axis=0), axis=1))])
        G.grid(W_(MER), UVm, 'upper', grp, accent=0, closed=True, inside=inside)
    # ── the sole: the welt lip, the side wall, the underside (strips across, outer -> inner at the same station) ──
    rows = []
    for i, (u, outer) in enumerate(loop):
        q = Q[i]; zw = z_welt(u); zb = z_bot(u)
        cdir = q - FL.spine(q[0])[:2]; cdir /= max(1e-9, np.linalg.norm(cdir))
        ins = inset(u)
        rows.append([Wk[i] - np.array([0, 0, 0.0005]), np.array([q[0], q[1], zw + 0.0015 * k]),
                     np.array([q[0] + cdir[0] * 0.0006, q[1] + cdir[1] * 0.0006, zw - 0.002 * k]),
                     np.array([q[0] - cdir[0] * (0.001 + ins * 0.6), q[1] - cdir[1] * (0.001 + ins * 0.6), zb + 0.003 * k]),
                     np.array([q[0] - cdir[0] * (0.0025 + ins), q[1] - cdir[1] * (0.0025 + ins), zb])])
    SR = np.transpose(np.array(rows), (1, 0, 2))
    G.grid(W_(SR), ring_uv(SR), 'sole', grp, accent=A_SOLE, closed=True, gain=0.9, inside=inside)
    bottom = SR[-1]
    NB = 6
    BR = np.zeros((len(us), NB, 3))
    for j, u in enumerate(us):
        io = j; ii = (NK - j) % NK if 0 < j < len(us) - 1 else j
        for t in range(NB):
            BR[j, t] = bottom[io] + (bottom[ii] - bottom[io]) * t / (NB - 1)
    G.grid(W_(BR), BR[..., :2].copy(), 'sole', grp, accent=A_SOLE, gain=0.75,
           inside=lambda p: p + np.array([0, 0, 0.03]))
    if spec.get('toe_cap'):                        # the rubber toe bumper: the sole's wall carried up round the toe tip
        cap = [i for i, (u, o_) in enumerate(loop) if u > 0.84]
        cap.sort(key=lambda i: (loop[i][0] if loop[i][1] else 2 - loop[i][0]))
        CR = np.zeros((3, len(cap), 3))
        for jj, i in enumerate(cap):
            u = loop[i][0]
            h = (0.012 * k) * float(smoothstep(0.84, 0.95, u))
            m = MER[:, i]
            zz = m[0, 2] + h
            jt = int(np.argmax(m[:, 2] >= zz)) if (m[:, 2] >= zz).any() else 1
            p_top = m[max(1, jt)]
            nrm = p_top - FL.spine(p_top[0]); nrm /= max(1e-9, np.linalg.norm(nrm))
            CR[0, jj] = m[0] + nrm * 0.0024; CR[1, jj] = p_top + nrm * 0.0024; CR[2, jj] = p_top + nrm * 0.0006 + np.array([0, 0, 0.0015])
        G.grid(W_(CR), ring_uv(CR), 'sole', grp, accent=A_SOLE, gain=0.95, inside=inside)
    def surf_project(p, lift):
        """a local point onto the upper / the shaft (+ lift): out from the middle line"""
        if boot and p[2] > join - 0.004 * k:
            zs, cen, rad = FL.tab
            c = np.array([np.interp(p[2], zs, cen[:, 0]), np.interp(p[2], zs, cen[:, 1])])
            ang = math.atan2(p[1] - c[1], p[0] - c[0])
            return shaft_at(FL.tab, p[2], ang, FL.phis, FL.shaft_extra + lift)
        o = FL.spine(p[0])
        return FL.exit(o, p - o, lift)
    # ── the shaft (boots): rings round the leg from just under the join to the top ──
    if boot:
        FL.phis = np.linspace(0, TAU, SHAFT_K, endpoint=False)
        FL.shaft_extra = spec.get('shaft_ease', 0.0022)   # (room for the trousers tucked in under it)
        top = spec['shaft'] * k if 'shaft' in spec else spec['shaft_k'] * FL.knee
        FL.tab = shaft_table(FL, join - 0.05 * k, top + 0.01, FL.shaft_extra, FL.phis)
        z0b = join - 0.013 * k
        z0s_of = lambda phi: z0b
        sc = spec.get('scallop', 0.0) * k
        def z_top(phi):                            # a scalloped top: dips at the front and the back
            return top - sc * (math.cos(phi) ** 8)
        RS = 18
        SH = np.zeros((RS, SHAFT_K, 3))
        for jj, phi in enumerate(FL.phis):
            zt = z_top(phi); z0s = z0s_of(phi)
            for r in range(RS):
                SH[r, jj] = shaft_point(FL.tab, z0s + (zt - z0s) * (r / (RS - 1)) ** 1.15, jj, FL.phis)
        def shaft_in(p):
            z = float(p[2] - FL.O[2])
            return FL.world(np.array([np.interp(z, FL.tab[0], FL.tab[1][:, 0]), np.interp(z, FL.tab[0], FL.tab[1][:, 1]), z]))
        G.grid(W_(SH), ring_uv(SH), 'shaft', grp, accent=0, closed=True, inside=shaft_in)
        # the turned top edge: a facing inside, a hand down
        fac = np.zeros((3, SHAFT_K, 3))
        for jj, phi in enumerate(FL.phis):
            zt = z_top(phi)
            fac[0, jj] = SH[-1, jj]
            fac[1, jj] = shaft_point(FL.tab, zt + 0.0015, jj, FL.phis, -0.0005)
            fac[2, jj] = shaft_point(FL.tab, zt - 0.018 * k, jj, FL.phis, -0.0035)
        G.grid(W_(fac), ring_uv(fac), 'shaft', grp, accent=0, closed=True, gain=0.7)
        if spec.get('top_band'):                   # a band round the top (a cuff on the high boot, a padded rim on the work boot)
            bw = spec['top_band'] * k
            BD = np.zeros((4, SHAFT_K, 3))
            for jj, phi in enumerate(FL.phis):
                zt = z_top(phi)
                BD[0, jj] = shaft_point(FL.tab, zt - bw, jj, FL.phis, 0.0002)
                BD[1, jj] = shaft_point(FL.tab, zt - bw + 0.002, jj, FL.phis, 0.0022)
                BD[2, jj] = shaft_point(FL.tab, zt - 0.0015, jj, FL.phis, 0.0022)
                BD[3, jj] = shaft_point(FL.tab, zt + 0.0012, jj, FL.phis, 0.0004)
            G.grid(W_(BD), ring_uv(BD), 'shaft', grp, accent=0, closed=True, gain=0.92, inside=shaft_in)
        if spec.get('pull_tabs'):                  # cowboy pull tabs: two leather loops standing up at the sides
            for side_phi in (math.pi / 2, -math.pi / 2):
                jj = int(np.argmin(np.abs(np.angle(np.exp(1j * (FL.phis - side_phi))))))
                zt = z_top(FL.phis[jj])
                base = shaft_point(FL.tab, zt - 0.012 * k, jj, FL.phis, -0.001)
                cn = np.array([np.interp(zt, FL.tab[0], FL.tab[1][:, 0]), np.interp(zt, FL.tab[0], FL.tab[1][:, 1]), zt])
                nrm = base - cn; nrm[2] = 0; nrm /= max(1e-9, np.linalg.norm(nrm))
                tg = np.array([-nrm[1], nrm[0], 0.0])
                P = []
                for t in np.linspace(0, math.pi, 9):
                    P.append(base + tg * (0.011 * k * math.cos(t)) + np.array([0, 0, 0.012 * k + 0.02 * k * math.sin(t)]) - nrm * 0.002)
                _band(G, W_(np.array(P)), FL.wdir(np.tile(nrm, (9, 1))), FL.wdir(np.tile(tg, (9, 1))), 0.009 * k, 0.0025, 'tab', grp, 0)
        if spec.get('pull_strap'):                 # the high boot's back pull strap
            jj = int(np.argmin(np.abs(np.angle(np.exp(1j * (FL.phis - math.pi))))))
            zt = z_top(FL.phis[jj])
            P = np.array([shaft_point(FL.tab, zt - 0.05 * k + 0.07 * k * t, jj, FL.phis, 0.0026 if t < 0.72 else 0.0026 + (t - 0.72) * 0.01) for t in np.linspace(0, 1, 8)])
            cn = np.array([np.interp(zt, FL.tab[0], FL.tab[1][:, 0]), np.interp(zt, FL.tab[0], FL.tab[1][:, 1]), 0])
            nr = P - cn; nr[:, 2] = 0
            _band(G, W_(P), FL.wdir(nr), FL.wdir(np.tile(np.cross(nr[0] / np.linalg.norm(nr[0]), [0, 0, 1.0]), (8, 1))), 0.016 * k, 0.0022, 'tab', grp, 0)
        if spec.get('stitch') is not None:         # the cowboy shaft's stitching: rows echoing the scalloped top + a heel-counter row
            for d in (0.022, 0.034, 0.058):
                P = [shaft_at(FL.tab, z_top(phi) - d * k + (0.012 * k if d > 0.05 else 0.0) * math.cos(phi) ** 8, phi, FL.phis, 0.0009)
                     for phi in np.linspace(0, TAU, 97)]
                tube(G, W_(np.array(P)), 0.0009, 'stitch', grp, accent=accents['stitch'], seg=5, gain=1.0)
    # ── the padded collar + the tongue (low shoes) ──
    if upper and not boot:
        col = [i for i, (u, o_) in enumerate(loop) if u <= spec['throat'] + 1e-9]
        col.sort(key=lambda i: loop[i][0] * (1 if loop[i][1] else -1))      # the inner side throat -> heel, then the outer heel -> throat
        P = np.array([MER[-1, i] for i in col])
        P = _resample(P, 40)
        cen = np.array([FL.spine(p[0]) for p in P])
        nrm = P - cen; nrm[:, 2] *= 0.3; nrm /= np.linalg.norm(nrm, axis=1)[:, None]
        pad = spec.get('pad', 0.005) * k
        tube(G, W_(P - nrm * pad * 0.35), pad, 'collar', grp, accent=0, seg=8, gain=0.92)
        if spec.get('tongue'):
            thA = FL.A_of(spec['throat'])
            o_t = np.array([0.30 * FL.L, FL.spine(0.30 * FL.L)[1], 0.03 * k])
            ang = np.linspace(0.0, math.pi / 2, 120)
            mid = np.array([FL.exit(o_t, (math.cos(t), 0.0, math.sin(t)), -0.0012) for t in ang])
            j0 = int(np.argmin(np.abs(mid[:, 0] - thA) + 10 * (mid[:, 2] < 0.02)))
            seg = [mid[j0]]
            for jj in range(j0 + 1, len(mid)):
                seg.append(mid[jj])
                if np.sum(np.linalg.norm(np.diff(np.array(seg), axis=0), axis=1)) > (spec['collar'][0] * k - mid[j0][2] + spec['tongue'] * k) * 1.25:
                    break
            seg = _resample(np.array(seg), 9)
            TW = np.zeros((9, 7, 3))
            for r, p in enumerate(seg):
                n = p - o_t; n /= np.linalg.norm(n)
                half = 0.021 * k * (1.0 - 0.15 * r / 8)
                for jj, sx in enumerate(np.linspace(-1, 1, 7)):
                    q = p + np.array([0, sx * half, 0]) - n * 0.03
                    TW[r, jj] = FL.exit(q, n, -0.0012 + 0.001 * (1 - sx * sx))
            G.grid(W_(TW), TW[..., 1:].copy(), 'tongue', grp, accent=0, gain=0.9, inside=inside)
    # ── laces (eyelets + criss-cross) ──
    if spec.get('laces'):
        Ls = spec['laces']
        spine_pts = []
        for u in np.linspace(Ls['u1'], spec.get('throat', Ls['u0']) if not boot else Ls['u0'], 12):
            A = FL.A_of(u); o = FL.spine(A)
            p = FL.exit(o, (0, 0, 1.0))
            if boot and p[2] > join:
                break
            spine_pts.append(p)
        if boot:                                    # up the front of the shaft to its top
            jj = 0
            topz = spec['shaft'] * k if 'shaft' in spec else spec['shaft_k'] * FL.knee
            for z in np.linspace(spine_pts[-1][2] + 0.01 * k, topz - 0.015 * k, 10):
                spine_pts.append(shaft_at(FL.tab, z, 0.0, FL.phis))
        sp = _resample(np.array(spine_pts), 60)
        sarc = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(sp, axis=0), axis=1))])
        n_e = Ls['n']; w = Ls['w'] * k
        E = {1: [], -1: []}
        for t in np.linspace(0.04, 0.97, n_e):
            idx = int(np.argmin(np.abs(sarc - t * sarc[-1])))
            p = sp[idx]; tg = sp[min(idx + 1, len(sp) - 1)] - sp[max(idx - 1, 0)]; tg /= np.linalg.norm(tg)
            o = FL.spine(min(p[0], FL.L)) if not (boot and p[2] > join) else np.array([np.interp(p[2], FL.tab[0], FL.tab[1][:, 0]), np.interp(p[2], FL.tab[0], FL.tab[1][:, 1]), p[2]])
            nrm = p - o; nrm /= np.linalg.norm(nrm)
            lat = np.cross(tg, nrm); lat /= np.linalg.norm(lat)
            for sg in (1, -1):
                e = surf_project(p + lat * w * sg, 0.0012)
                E[sg].append((e, nrm))
                disc(G, W_(e), (W_(e + nrm) - W_(e)), 0.0032 * k, 'eyelet', grp, accents['eyelet'], h=0.0012, seg=8)
        la = accents['lace']
        for i in range(n_e - 1):
            _lace(G, E[1][i][0], E[-1][i + 1][0], 0.003, surf_project, W_, 'lace', grp, la)
            _lace(G, E[-1][i][0], E[1][i + 1][0], 0.0036, surf_project, W_, 'lace', grp, la)
        _lace(G, E[1][0][0], E[-1][0][0], 0.0026, surf_project, W_, 'lace', grp, la)
    # ── sandal straps ──
    if not upper:
        zw = z_welt(0.6)
        bw = spec['strap_w'] * k
        def strap_section(u, w_):
            P = FL.cross(u, z_welt(u) - 0.002 * k, lambda A, C: 9.0, 15)
            o = FL.spine(FL.A_of(u))
            N = P - o; N /= np.linalg.norm(N, axis=1)[:, None]
            _band(G, W_(P), FL.wdir(N), FL.wdir(np.tile(np.array([1.0, 0, 0]), (len(P), 1))), w_ * k, 0.003, 'strap', grp, 0)
        for (u, w_) in spec['straps']:
            strap_section(u, w_)
        za = spec['ankle'] * k
        H = FL.ring(za, 0.0015)
        cnt = poly_centroid(H)
        phis = np.linspace(0, TAU, 29)
        RP = np.array([[cnt[0] + math.cos(p) * ray_poly(H, cnt, np.array([math.cos(p), math.sin(p)])),
                        cnt[1] + math.sin(p) * ray_poly(H, cnt, np.array([math.cos(p), math.sin(p)])), za] for p in phis])
        RN = RP - np.array([cnt[0], cnt[1], za]); RN[:, 2] = 0
        _band(G, W_(RP), FL.wdir(RN), FL.wdir(np.tile([0, 0, 1.0], (len(RP), 1))), bw, 0.003, 'strap', grp, 0)
        # the side straps: from the welt up to the ankle strap, both sides, and the heel strap up the back
        for u, side in ((spec['side_u'], 1), (spec['side_u'], 0), (0.0, 1)):
            A = FL.A_of(u); c0, c1 = _poly_section(FL.outline, A)
            o = FL.spine(A)
            q = np.array([A, (c1 if side else c0) if u > 0 else 0.5 * (c0 + c1)])
            d2 = q - o[:2]; d2 /= np.linalg.norm(d2)
            m, _ = FL.meridian(o, d2, z_welt(u) - 0.002 * k, lambda A_, C_: za, 10)
            N = m - o; N /= np.linalg.norm(N, axis=1)[:, None]
            wd = np.tile(np.array([d2[1], -d2[0], 0.0]), (len(m), 1))
            _band(G, W_(m), FL.wdir(N), FL.wdir(wd), bw, 0.003, 'strap', grp, 0)
        jb = int(np.argmin(np.abs(np.angle(np.exp(1j * (phis - math.pi / 2))))))   # the buckle on the outer side
        bp = RP[jb]; bn = RN[jb] / np.linalg.norm(RN[jb])
        disc(G, W_(bp + bn * 0.003), (W_(bp + bn) - W_(bp)), 0.007 * k, 'buckle', grp, accents['eyelet'], h=0.002, seg=10)
    return FL


def build_shoes(spec, f):
    G = Garment()
    accents = {'sole': 1}
    nxt = 2
    if spec.get('laces'):
        accents['lace'] = nxt; accents['eyelet'] = nxt + 1; nxt += 2
    elif not spec.get('upper', True):
        accents['eyelet'] = nxt; nxt += 1
    if spec.get('stitch') is not None:
        accents['stitch'] = nxt; nxt += 1
    FLs = {s: build_shoe_side(f, s, spec, G, accents) for s in 'lr'}
    return G, FLs, accents


def bake_shoes(key, spec, frames, out, views=None):
    name = 'ewb_shoe_' + key
    builds = {}
    for b, f in frames.items():
        f['_edges'] = np.array([tuple(e.vertices) for e in f['h'].data.edges])
        G, FLs, accents = build_shoes(spec, f)
        builds[b] = (np.array(G.V), G)
    V, G = builds['male']
    for b, (Vb, Gb) in builds.items():
        assert len(Vb) == len(V) and len(Gb.F) == len(G.F), 'topology differs on ' + b
        assert np.isfinite(Vb).all(), 'NaN vertices on ' + b
    first, remap = {}, np.arange(len(V))                 # THE WELD (the vamp's top line, the toe's pole)
    for i, p in enumerate(np.round(V, 6)):
        j = first.setdefault((tuple(p), G.A[i]), i)
        if j != i and all(np.allclose(Vb[i], Vb[j], atol=1e-6) for Vb, _ in builds.values()):
            remap[i] = j
    pairs = [([int(remap[i]) for i in fc], fu) for fc, fu in zip(G.F, G.FUV)]
    pairs = [(fc, fu) for fc, fu in pairs if len(set(fc)) >= 3]
    G.F = [fc for fc, _ in pairs]; G.FUV = [fu for _, fu in pairs]
    W = [dict() for _ in range(len(V))]
    for b, f in frames.items():
        co, dom, inbody = f['co'], f['dom'], f['inbody']
        pools = {'shoe_' + s: [i for i in range(len(co)) if inbody[i] and dom[i] in ('foot_' + s, 'ball_' + s, 'calf_' + s)] for s in 'lr'}
        Wb = tight_weights(f, G, builds[b][0], pools)
        for i, w in enumerate(Wb):
            for kk, x in w.items():
                W[i][kk] = W[i].get(kk, 0.0) + x / len(frames)
    doms = ('foot_l', 'ball_l', 'calf_l', 'foot_r', 'ball_r', 'calf_r')
    if spec.get('upper', True):
        delBy = {b: tight_hidden(f, builds[b][0], G.F, doms, maxd=0.045, erode=1) for b, f in frames.items()}
    else:
        delBy = {b: [] for b in frames}
    S = PG.shade(frames['male'], V, G.F, G.T)
    main = {'color': [1, 1, 1], 'rough': 0.6}
    accent_mats = [main, spec['sole_acc']]
    if spec.get('laces'):
        accent_mats += [spec['laces']['acc'], EYELET]
    elif not spec.get('upper', True):
        accent_mats += [EYELET]
    if spec.get('stitch') is not None:
        accent_mats += [spec['stitch']]
    # (outer + fitSpatial: on the classic MPFB bodies and under the sliders the foot part and the shaft move by the same averaged
    #  offsets, three-renderer.js nearSet / spaceSmooth, so the shaft's foot never parts from the upper)
    wear = {'name': name, 'pack': 'entropywars', 'cat': 'shoes', 'z': 48, 'del': delBy['male'], 'uv': 'm', 'layer': 'feet', 'outer': True, 'fitSpatial': 8,
            'accents': [dict(color=a.get('color'), rough=a.get('rough', 0.9), metal=a.get('metal', 0)) for a in accent_mats], 'delBy': delBy}
    path = os.path.join(out, name + '.glb')
    ntri, bones = write_glb(path, {b: builds[b][0] for b in builds}, G.F, G.FUV, W, S, G.A, wear, [], accent_mats, None)
    print('[bake-clothes] %-28s %6d tris %5d KB  hides %d skin verts  bones %s' % (
        name, ntri, os.path.getsize(path) // 1024, sum(r[1] - r[0] + 1 for r in delBy['male']), ','.join(bones)))
    if views:
        os.makedirs(views, exist_ok=True)
        for b, f in frames.items():
            Vb, Gb = builds[b]
            np.savez(os.path.join(views, '%s_%s.npz' % (name, b)), V=Vb, F=np.array(PG.tris(G.F)), A=np.array(G.A), S=S,
                     body=f['co'], bodyF=np.array([tuple(p.vertices) for p in f['h'].data.polygons if all(f['inbody'][v] for v in p.vertices) and len(p.vertices) == 4]))
    return {'id': name, 'file': name, 'label': spec['label'], 'cat': 'feet', 'tris': ntri, 'kb': os.path.getsize(path) // 1024}


# ═══════════════════════════════ THE TILES + THE GLB ═══════════════════════════════
def load_tile(name, tiles_dir):
    from PIL import Image
    p = os.path.join(tiles_dir, name + '.png') if tiles_dir else None
    if p and os.path.exists(p):
        return Image.open(p).convert('RGB')
    data = urllib.request.urlopen(urllib.request.Request(R2_TILES + name + '.png?bake=1', headers={'User-Agent': 'Mozilla/5.0'})).read()
    if tiles_dir:
        os.makedirs(tiles_dir, exist_ok=True)
        open(os.path.join(tiles_dir, name + '.png'), 'wb').write(data)
    return Image.open(io.BytesIO(data)).convert('RGB')


def tile_bytes(name, tiles_dir, grey=False):
    """the R2 tile as embedded JPEG; grey = its luminance lifted to a mean of ~0.8 (so the accent's own colour shows)"""
    from PIL import Image
    im = load_tile(name, tiles_dir)
    if grey:
        a = np.asarray(im).astype(np.float32).mean(axis=2)
        a = np.clip(a * (205.0 / max(1.0, a.mean())), 0, 255).astype(np.uint8)
        im = Image.fromarray(np.stack([a] * 3, 2))
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=88)
    return buf.getvalue()


def write_glb(path, Ps, F, FUV, W, G, A, wear, images, accent_mats, chains, FA=None):
    """the pilot's compact layout (POSITION = male, _D_<BODY>, _N, _J/_W, _G) + triangles grouped by accent (one
    primitive each: primitive 0 = the layer's cloth, then each accent with its own material) + the sway chains as output
    vertex indices (ewWear.sway). FA = an accent per FACE (a solid's band), in place of the face's first vertex's A"""
    gl = lambda c: np.stack([c[:, 0], c[:, 2], -c[:, 1]], axis=1)
    N = PG.vertex_normals(Ps['male'], F)
    verts, key_of, first = [], {}, {}
    tri_by_acc = {}
    for fi, (f, fu) in enumerate(zip(F, FUV)):
        corner = []
        for vi, u in zip(f, fu):
            k = (vi, round(float(u[0]), 5), round(float(u[1]), 5))
            j = key_of.get(k)
            if j is None:
                j = key_of[k] = len(verts); verts.append((vi, (float(u[0]), float(u[1]))))
                first.setdefault(vi, j)
            corner.append(j)
        acc_i = A[f[0]] if FA is None else FA[fi]
        for k in range(1, len(corner) - 1):
            tri_by_acc.setdefault(acc_i, []).extend([corner[0], corner[k], corner[k + 1]])
    vsel = np.array([v[0] for v in verts])
    P = {b: gl(Ps[b])[vsel] for b in Ps}
    Nn = gl(N[vsel])
    UV = np.array([v[1] for v in verts])
    # an accent with a tile: its UVs in tile units (the cloth keeps metres; the game scales those to the layer's fabric)
    for ai, m in enumerate(accent_mats):
        if m.get('tile_m'):
            sel = np.array([A[vi] == ai for vi in vsel])
            UV[sel] = UV[sel] / m['tile_m']
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
    small = len(vsel) < 65536
    prims, mats = [], []
    tex_of = {}
    gtex, gimg = [], []
    for name, data in images:
        iv = add(data); gimg.append({'bufferView': iv, 'mimeType': 'image/jpeg'}); gtex.append({'source': len(gimg) - 1, 'sampler': 0}); tex_of[name] = len(gtex) - 1
    ntri = 0
    for ai in sorted(tri_by_acc):
        idx = np.array(tri_by_acc[ai]); ntri += len(idx) // 3
        m = accent_mats[ai]
        mat = {'name': wear['name'] + '_' + str(ai), 'doubleSided': True,
               'pbrMetallicRoughness': {'metallicFactor': m.get('metal', 0.0), 'roughnessFactor': m.get('rough', 0.9),
                                        'baseColorFactor': list(m.get('color', [1, 1, 1])) + [1.0]}}
        if m.get('tile') in tex_of:
            mat['pbrMetallicRoughness']['baseColorTexture'] = {'index': tex_of[m['tile']]}
        mats.append(mat)
        prims.append({'attributes': attrs, 'indices': acc(idx.astype(np.uint16 if small else np.uint32), 5123 if small else 5125, 'SCALAR'), 'material': len(mats) - 1,
                      'extras': {'accent': int(ai)}})
    sway = None
    if chains:
        sway = {'parent': bm.BONE_MAP.get(chains['parent'], chains['parent']), 'chains': [[int(first[j]) for j in ch] for ch in chains['joints']]}
        if chains.get('parents'):                # THE SKIRTS: each chain's own body bone
            sway['parents'] = [bm.BONE_MAP.get(b, b) for b in chains['parents']]
    g = {'asset': {'version': '2.0', 'generator': 'bake-clothes.py (Entropy Wars, cloud Blender)'}, 'scene': 0, 'scenes': [{'nodes': [0]}],
         'nodes': [{'name': wear['name'], 'mesh': 0, 'extras': {'ewWear': dict(wear, bones=bones, dq=bm.WEAR_DQ, sway=sway)}}],
         'meshes': [{'name': wear['name'], 'primitives': prims}], 'materials': mats, 'accessors': accs, 'bufferViews': views}
    if gimg:
        g['images'] = gimg; g['textures'] = gtex; g['samplers'] = [{'magFilter': 9728, 'minFilter': 9986}]
    binb = b''.join(chunks); g['buffers'] = [{'byteLength': len(binb)}]
    js = json.dumps(g, separators=(',', ':')).encode(); js += b' ' * ((-len(js)) % 4)
    with open(path, 'wb') as fh:
        fh.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binb)))
        fh.write(struct.pack('<II', len(js), 0x4E4F534A)); fh.write(js)
        fh.write(struct.pack('<II', len(binb), 0x004E4942)); fh.write(binb)
    return ntri, bones


def write_view(path, f, V, F, G, A, accent_mats):
    """body + garment, accent colours x shade, as a plain GLB (to render / look at)"""
    cols = np.array([accent_mats[a].get('view', accent_mats[a].get('color', [0.7, 0.55, 0.36])) for a in A]) * G[:, None]
    PG.write_view(path, f, V, F, G)    # (the pilot's: body + one colour)
    return cols


# ═══════════════════════════════ THE SOLID PIECES (mondo's own models, fitted to every head) ═══════════════════════════════
# 2026-11-01 (character-models-plan row 16/17; mondo: "added a cowboy hat in /wear"): a SOLID piece mondo made himself (a hat,
# later horns, helmets, crowns from the Meshy list 4a) is NOT rebuilt: his mesh, his UVs and his textures go in as they are.
# Each body wears it rigidly (one uniform scale + a move, no bending), sized so its band ring clears that body's head at the
# hat line by `ease` (room for the hair), and rides the Head bone. The file is fetched from R2 (or --solids DIR), the object
# appended (the MPFB scene stays), its pose read from the object's own transform.
#   blend / obj        the .blend on R2 + the object in it
#   tex / occ          his base colour + ambient occlusion maps (occ multiplied into the colour: the game draws no AO map)
#   band_mat           the material index of the hat band: its ring = the crown's opening (levelled to horizontal)
#   line_k             the hat line between the eyes (0) and the crown of the head (1)
#   ease, thick        the room inside the crown past the head; the crown wall's thickness
#   tilt               degrees the front is lifted (worn pushed back: level, the front brim sat at the eyes and hid the face)
#   band_tint          the band_mat faces go in their own primitive (accent 1, the same texture; ewWear.band = 1) so the creator
#                      colours the band apart from the hat (2026-11-03, mondo: "change the color of the band and the hat separately")
#   occ None           no ambient-occlusion map (a texture with its shading painted in)
R2_BASE = 'https://cdn.entropywars.net/'
SOLIDS = {
    'cowboyhat': {'label': 'Cowboy hat', 'cat': 'hats', 'z': 56, 'px': 1024, 'rough': 0.85,
                  'blend': 'Assets/characters/creator/wear/cowboyhat/Cowboy-Hat.blend', 'obj': 'Cowboy-Hat',
                  'tex': 'Assets/characters/creator/wear/cowboyhat/textures/Cowboy-Hat_base.png',
                  'occ': 'Assets/characters/creator/wear/cowboyhat/textures/Cowboy-Hat_occ.png',
                  'band_mat': 1, 'line_k': 0.42, 'ease': 0.014, 'thick': 0.004, 'tilt': 8, 'band_tint': True},
}
# THE WORN HATS (2026-11-03, mondo: "make it look more realistic/weathered/worn/textured. Like look at the cowboy meshy model and his
# hat"): his same hat (mesh, UVs, fit) wearing a Meshy Retexture base colour painted on HIS UVs (enable_original_uv; Meshy's own
# re-exported mesh is never used). F = text prompt "realistic weathered dark charcoal felt ... frayed brown leather band" on meshy-7,
# H = "realistic weathered sand tan felt ... cracked brown leather band" on meshy-6 (remove_lighting). Shading is painted in: no occ.
_HAT_TEX = 'Assets/characters/creator/wear/cowboyhat/textures/'
SOLIDS['cowboyhat_worn'] = dict(SOLIDS['cowboyhat'], label='Cowboy hat (worn dark)', tex=_HAT_TEX + 'Cowboy-Hat_meshy_worn_dark.png', occ=None)
SOLIDS['cowboyhat_worntan'] = dict(SOLIDS['cowboyhat'], label='Cowboy hat (worn tan)', tex=_HAT_TEX + 'Cowboy-Hat_meshy_worn_tan.png', occ=None)


def r2_file(key, cache):
    """an R2 file, kept in the cache folder (fetched once, with a User-Agent: the CDN refuses a bare urllib)"""
    p = os.path.join(cache, key.replace('/', '__'))
    if not os.path.exists(p):
        os.makedirs(cache, exist_ok=True)
        data = urllib.request.urlopen(urllib.request.Request(R2_BASE + key + '?bake=' + str(os.getpid()), headers={'User-Agent': 'Mozilla/5.0'})).read()
        open(p, 'wb').write(data)
    return p


def _rot_to(a, b):
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b); v = np.cross(a, b); c = float(a @ b); s = np.linalg.norm(v)
    if s < 1e-9:
        return np.eye(3)
    K = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + K + K @ K * ((1 - c) / s ** 2)


def _sector_r(P, c, fn, n=36):
    """per angle round c (n sectors): fn (min / max) of the points' distance; empty sectors take their neighbours'"""
    d = P[:, :2] - c; k = np.floor((np.arctan2(d[:, 1], d[:, 0]) + math.pi) / TAU * n).astype(int) % n; r = np.hypot(d[:, 0], d[:, 1])
    out = np.array([fn(r[k == i]) if (k == i).any() else np.nan for i in range(n)])
    for i in np.where(np.isnan(out))[0]:
        j = 1
        while np.isnan(out[(i + j) % n]) and np.isnan(out[(i - j) % n]):
            j += 1
        out[i] = np.nanmean([out[(i + j) % n], out[(i - j) % n]])
    return out


def load_solid(spec, cache):
    """his mesh in its own pose (the object's transform), levelled: band ring horizontal, centred on the crown, the band's
    bottom at z = 0, the brim end that dips lower to the front (-Y, where the MPFB bodies face)"""
    path = r2_file(spec['blend'], cache)
    with bpy.data.libraries.load(path, link=False) as (_src, dst):
        dst.objects = [spec['obj']]
    o = dst.objects[0]; me = o.data
    M = np.array(o.matrix_basis)
    co = np.array([v.co[:] for v in me.vertices]) @ M[:3, :3].T + M[:3, 3]
    uvl = me.uv_layers[0].data
    F = [list(p.vertices) for p in me.polygons]
    FUV = [[(float(uvl[li].uv[0]), 1.0 - float(uvl[li].uv[1])) for li in p.loop_indices] for p in me.polygons]   # (glTF v runs down)
    mat = [p.material_index for p in me.polygons]
    spec['_face_mat'] = mat                             # (bake_solid's band_tint reads it)
    bpy.data.objects.remove(o)
    band = sorted({v for f, m_ in zip(F, mat) if m_ == spec['band_mat'] for v in f})
    B = co[band] - co[band].mean(0); n = np.linalg.eigh(B.T @ B)[1][:, 0]
    P = co @ _rot_to(n if n[2] > 0 else -n, np.array([0.0, 0.0, 1.0])).T
    c = P[band, :2].mean(0)
    ang = (np.arange(36) + 0.5) / 36 * TAU - math.pi
    for _ in range(5):                                  # the crown's centre: the middle of the band ring (not the knot)
        r = _sector_r(P[band], c, np.min)
        c = (c + np.stack([np.cos(ang), np.sin(ang)], 1) * r[:, None]).mean(0)
    P[:, :2] -= c
    P[:, 2] -= P[band, 2].min()
    if P[P[:, 1] > P[:, 1].max() - 0.03, 2].mean() < P[P[:, 1] < P[:, 1].min() + 0.03, 2].mean():
        P[:, :2] *= -1                                  # (a half turn about Z)
    return P, F, FUV, band


def fit_solid(P, band, f, spec):
    """the piece on body f: the head's cross-section at the hat line, the scale that clears it by `ease` at every angle"""
    co, inb, dom, h = f['co'], f['inbody'], f['dom'], f['h']
    H = co[np.array([inb[i] and dom[i] == 'head' for i in range(len(co))])]
    names = {g.index: g.name for g in h.vertex_groups}
    eye = [v.index for v in h.data.vertices if any(names[g.group] in ('helper-l-eye', 'helper-r-eye') and g.weight > 0.5 for g in v.groups)]
    ez = float(co[eye, 2].mean()); top = float(H[:, 2].max())
    zl = ez + spec['line_k'] * (top - ez)
    S = H[np.abs(H[:, 2] - zl) < 0.006]
    hc = np.array([0.0, 0.5 * (S[:, 1].min() + S[:, 1].max())])
    t = math.radians(spec.get('tilt', 0.0))            # the front (-Y) up about the band's bottom
    P = P @ np.array([[1, 0, 0], [0, math.cos(t), -math.sin(t)], [0, math.sin(t), math.cos(t)]])   # (row vectors: z' = z cos t - y sin t)
    s = float(np.max((_sector_r(S, hc, np.max) + spec['ease']) / (_sector_r(P[band], np.zeros(2), np.min) - spec['thick'])))
    Q = P * s
    Q[:, :2] += hc; Q[:, 2] += zl
    return Q, s


def bake_solid(key, spec, frames, m, out, cache):
    from PIL import Image
    name = 'ewb_' + key
    P, F, FUV, band = load_solid(spec, cache)
    Ps, scales = {}, {}
    for b, f in frames.items():
        Ps[b], scales[b] = fit_solid(P, band, f, spec)
    n = len(P)
    # his colour x his ambient occlusion (soft: 0.45 + 0.55 occ), at spec px
    base = Image.open(r2_file(spec['tex'], cache)).convert('RGB')
    if spec.get('occ'):
        occ = Image.open(r2_file(spec['occ'], cache)).convert('L').resize(base.size)
        a = np.asarray(base).astype(np.float32) * (0.45 + 0.55 * np.asarray(occ).astype(np.float32)[:, :, None] / 255.0)
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    else:
        im = base
    if max(im.size) > spec['px']:
        im = im.resize((spec['px'], spec['px']), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=88)
    mats = [{'color': [1, 1, 1], 'rough': spec['rough'], 'metal': 0.0, 'tile': key}]
    wear = {'name': name, 'pack': 'entropywars', 'cat': spec['cat'], 'z': spec['z'], 'del': [], 'solid': True,
            'accents': [dict(color=[1, 1, 1], rough=spec['rough'], metal=0)]}
    FA = None
    if spec.get('band_tint'):                           # the band: its own primitive on the same texture (ewWear.band)
        FA = [1 if mi == spec['band_mat'] else 0 for mi in spec['_face_mat']]
        mats.append(dict(mats[0])); wear['accents'].append(dict(wear['accents'][0])); wear['band'] = 1
    path = os.path.join(out, name + '.glb')
    ntri, bones = write_glb(path, Ps, F, FUV, [{'head': 1.0}] * n, np.ones(n), [0] * n, wear, [(key, buf.getvalue())], mats, None, FA)
    print('[bake-clothes] %-28s %6d tris %5d KB  solid, scale %s  bones %s' % (
        name, ntri, os.path.getsize(path) // 1024, ' '.join('%s %.3f' % kv for kv in scales.items()), ','.join(bones)))
    return {'id': name, 'file': name, 'label': spec['label'], 'cat': spec['cat'], 'tris': ntri, 'kb': os.path.getsize(path) // 1024}


# ═══════════════════════════════ BUILD ALL ═══════════════════════════════
def bake_cape(key, spec, frames, m, out, tiles, views=None):
    name = 'ewb_cape_' + key
    builds = {}
    for b, f in frames.items():
        co = PG.warp(f['co'], f, m)
        pts = {k: PG.warp(v[None], f, m)[0] for k, v in f['pts'].items()}
        G = build_cape(name, co, f['dom'], f['inbody'], pts, spec)
        V = PG.unwarp(np.array(G.V), f, m)
        builds[b] = (V, G)
    V, G = builds['male']
    for b, (Vb, Gb) in builds.items():
        assert len(Vb) == len(V) and len(Gb.F) == len(G.F), 'topology differs on ' + b
    W = cape_weights(m, G, V)
    S = PG.shade(m, V, G.F, G.T)
    own = spec.get('own')
    main = {'color': [1, 1, 1], 'rough': 0.9}
    images = []
    if own:
        main = {'color': [1, 1, 1], 'rough': 0.95, 'tile': own['tile'], 'tile_m': own['tile_m']}
        images.append((own['tile'], tile_bytes(own['tile'], tiles, grey=True)))
    accent_mats = [main] + list(spec.get('accents', []))
    for am in accent_mats[1:]:
        if am.get('tile') and am['tile'] not in [n for n, _ in images]:
            images.append((am['tile'], tile_bytes(am['tile'], tiles, grey=am.get('grey', False))))
    wear = {'name': name, 'pack': 'entropywars', 'cat': 'cape', 'z': 80, 'del': [], 'layer': 'cape', 'uv': 'm', 'fitSmooth': 24,
            'own': bool(own), 'accents': [dict(color=a.get('color'), rough=a.get('rough', 0.9), metal=a.get('metal', 0)) for a in accent_mats]}
    path = os.path.join(out, name + '.glb')
    ntri, bones = write_glb(path, {b: builds[b][0] for b in builds}, G.F, G.FUV, W, S, G.A, wear, images, accent_mats,
                            {'parent': G.chain_parent, 'joints': G.chains})
    print('[bake-clothes] %-28s %6d tris %5d KB  chains %d  bones %s' % (name, ntri, os.path.getsize(path) // 1024, len(G.chains), ','.join(bones)))
    if views:
        os.makedirs(views, exist_ok=True)
        for b, f in frames.items():
            Vb, Gb = builds[b]
            np.savez(os.path.join(views, '%s_%s.npz' % (name, b)), V=Vb, F=np.array(PG.tris(Gb.F)), A=np.array(Gb.A), S=S,
                     body=f['co'], bodyF=np.array([tuple(p.vertices) for p in f['h'].data.polygons if all(f['inbody'][v] for v in p.vertices) and len(p.vertices) == 4]))
    return {'id': 'b' + 'cape_' + key, 'file': name, 'label': spec['label'], 'tris': ntri, 'kb': os.path.getsize(path) // 1024}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mpfb', required=True)
    ap.add_argument('--out', default=os.path.join(HERE, 'charactercreation', 'wear'))
    ap.add_argument('--only', default='')
    ap.add_argument('--views', default='')
    ap.add_argument('--tiles', default='/tmp/bake-clothes-tiles')
    ap.add_argument('--solids', default='/tmp/bake-clothes-solids')   # THE SOLID PIECES: his R2 files, fetched once
    a = ap.parse_args()
    PG.M_ = bm.install_mpfb(a.mpfb)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = {b: PG.body_frame(PG.make_human(b)) for b in bm.WEAR_BODIES}
    m = frames['male']
    os.makedirs(a.out, exist_ok=True)
    only = set(x for x in a.only.split(',') if x)
    rows = []
    for key, spec in CAPES.items():
        if only and key not in only and ('cape_' + key) not in only:
            continue
        rows.append(bake_cape(key, spec, frames, m, a.out, a.tiles, a.views or None))
    for key, spec in COATS.items():
        if only and key not in only:
            continue
        rows.append(bake_coat(key, spec, frames, m, a.out, a.tiles, a.views or None))
    for key, spec in FRONTS.items():                 # THE OPEN + CLOSED FRONTS (--only duster_open,...)
        if only and key not in only and 'fronts' not in only:
            continue
        rows.append(bake_coat(key, spec, frames, m, a.out, a.tiles, a.views or None))
    for key, spec in SHIRTS.items():                 # THE BLENDER SHIRTS (--only top_shirt,...)
        if only and ('top_' + key) not in only and 'tops' not in only:
            continue
        rows.append(bake_coat('top_' + key, spec, frames, m, a.out, a.tiles, a.views or None))
    for key, spec in TIGHT.items():
        if only and key not in only:
            continue
        rows.append(bake_tight(key, spec, frames, m, a.out, a.tiles, a.views or None))
    for key, spec in SOLIDS.items():
        if only and key not in only:
            continue
        rows.append(bake_solid(key, spec, frames, m, a.out, a.solids))
    for key, spec in SHOES.items():                  # THE BLENDER SHOES (--only shoe_sneakers,...)
        if only and ('shoe_' + key) not in only:
            continue
        rows.append(bake_shoes(key, spec, frames, a.out, a.views or None))
    print(json.dumps(rows, indent=1))


if __name__ == '__main__':
    main()
