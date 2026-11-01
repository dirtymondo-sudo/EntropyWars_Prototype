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
Output: <out>/ewb_<name>.glb (R2 Assets/Models/charactercreation/wear/). Notes: docs/notes/models-assets.md "THE BLENDER CLOTHES".
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

smoothstep, dirv, hull2d, minkowski = PG.smoothstep, PG.dirv, PG.hull2d, PG.minkowski
TORSO_B, LEG_B = PG.TORSO_B, PG.LEG_B
TAU = 2 * math.pi
R2_TILES = 'https://cdn.entropywars.net/Assets/Sprites/terrain/'


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

    def __init__(self, co, dom, inbody, z0, z1, ease, z_hang=None, flare=0.0, z_axis=1.36, dz=0.006, armx=0.24, legs=True, hang_lift=None, round_sh=0):
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
            if z > 1.40:
                sel |= armtop & (np.abs(co[:, 2] - z) < band)
            if z > 1.62:
                sel |= head & (np.abs(co[:, 2] - z) < band)
            P2 = co[sel][:, :2]
            if len(P2) < 4:
                P2 = np.array([[0.05 * math.cos(a), 0.05 * math.sin(a)] for a in np.linspace(0, TAU, 8, endpoint=False)])
            hulls.append(hull2d(P2))
            cen[r] = [0.0, 0.5 * (P2[:, 1].min() + P2[:, 1].max())]
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
        sh = (zs > 1.30) & (zs < 1.62)
        for _ in range(round_sh):
            sm = rad.copy(); sm[1:-1] = 0.25 * rad[:-2] + 0.5 * rad[1:-1] + 0.25 * rad[2:]
            rad[sh] = np.maximum(sm[sh], radh[sh] + 0.01)
        if z_hang is not None:
            ih = int(np.argmin(np.abs(zs - z_hang)))
            for r in range(ih - 1, -1, -1):
                rad[r] = np.maximum(rad[r], rad[r + 1] + flare * (zs[r + 1] - zs[r]))
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
    F = Field(co, dom, inbody, max(0.02, hem - 0.15), z_top + 0.04, o.get('ease', 0.026), z_hang=o.get('hang', 1.42),
              flare=o.get('flare', 0.07), z_axis=1.38, legs=True, round_sh=o.get('round_sh', 14), armx=o.get('armx', 0.22))
    C, R = o.get('cols', 48), o.get('rows', 44)
    e_top, e_bot = o.get('e_top', 0.55), o.get('e_bot', 1.25)
    z_arm = 1.36
    s = np.linspace(0, 1, C)
    P = np.zeros((R, C, 3)); UV = np.zeros((R, C, 2)); PH = np.zeros((R, C)); Z = np.zeros((R, C))
    for c in range(C):
        # the column, densely: z from its top down to its hem
        frac0 = abs(s[c] - 0.5) * 2                                        # 0 = the back centre, 1 = a front edge
        zt = z_top - o.get('top_drop', 0.05) * frac0 ** 2
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
    hulls, cen = [], []
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
        e = o['ease'] if z >= zbelt + 0.03 else (o.get('waist_ease', 0.024) if z >= zbelt - 0.03 else o['skirt_ease'])
        rad[r] = ray_polys(minkowski(hulls[r], e), cen[r], D)
        radh[r] = ray_polys(hulls[r], cen[r], D)
    for _ in range(3):
        sm = rad.copy(); sm[1:-1] = 0.25 * rad[:-2] + 0.5 * rad[1:-1] + 0.25 * rad[2:]
        rad = np.maximum(sm, radh + 0.012)
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
                'closed': (-0.026, 0.024)}[front]

    def tneck(z):
        return 0.0 if zb >= zt else float(smoothstep(zb, zt, z)) ** 0.9

    def xo(z):
        return xo0 + (o.get('neck_x', 0.075) - xo0) * tneck(z)

    def xu(z):
        return xu0 + (-o.get('neck_x', 0.075) + 0.005 - xu0) * tneck(z)

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
        if front in ('double', 'single', 'closed') and not (cut and z < zbelt + cut[0]):
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
    info = dict(zs=zs, PH=PH, cen=cen, zbelt=zbelt, ihip=ihip, xo=xo, xu=xu, point=point, R_at=R_at, rad=rad, opts=o, phi_at_x=phi_at_x)
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
    ztop = o['zb'] + 0.01 if o.get('lapel') else o['top'] + 0.01
    for col, sgn in ((C - 1, 1), (0, -1)):
        rows = [r for r in range(R) if zs[r] <= ztop]
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
    'tall': [(-0.004, 0.001), (0.025, 0.002), (0.05, 0.004), (0.068, 0.008), (0.062, 0.012)],
    'popped': [(-0.004, 0.001), (0.022, 0.004), (0.045, 0.012), (0.07, 0.024), (0.068, 0.03), (0.05, 0.028)],
    'big': [(-0.004, 0.001), (0.02, 0.005), (0.034, 0.012), (0.026, 0.022), (-0.01, 0.028), (-0.06, 0.034), (-0.085, 0.036)],
}


def coat_collar(K, o):
    prof = COLLARS[o['collar']]
    G, P, S, zs, PH, C = K.G, K.P, K.S, K.zs, K.PH, K.C
    top = K.R - 1
    Q = np.zeros((len(prof), C, 3)); UV = np.zeros((len(prof), C, 2)); Gn = np.ones((len(prof), C))
    taper = o.get('collar_taper', 6.0)
    for c in range(C):
        p = P[top, c]
        n = S.normal(zs[top] - 0.01, PH[top, c]); n[2] = 0
        if not np.isfinite(n).all() or np.linalg.norm(n) < 0.3:     # (an edge column on a closed front: out from the axis)
            n = p - K.inside(p); n[2] = 0
        n /= np.linalg.norm(n)
        endk = min(c, C - 1 - c) / taper
        sc = 0.55 + 0.45 * min(1.0, endk)
        for i, (up, out) in enumerate(prof):
            Q[i, c] = p + np.array([0, 0, up * sc]) + n * out
            Gn[i, c] = 0.75 if i < 2 else 0.95
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Q[2], axis=0), axis=1))])
    UV[:, :, 0] = s[None, :]; UV[:, :, 1] = np.arange(len(prof))[:, None] * 0.015
    G.grid(Q, UV, 'collar', 'coat_tl', accent=o.get('collar_accent', 0), gain=Gn, phi=np.tile(PH[top], (len(prof), 1)), inside=K.inside)


def coat_buttons(K, o):
    """o['buttons'] = [(height above the waist, front x), ...] on the visible panel; o['button'] = (radius, accent)"""
    r_, acc = o.get('button', (0.0105, 1))
    for (dz, x) in o.get('buttons', []):
        p, n, tx, ty, q = K.frame(K.info['zbelt'] + dz, x)
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
            Q[i, k] = best[1] + S.normal(bz[i], best[2]) * bo[i]
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Q[1], axis=0), axis=1))])
    UV[:, :, 0] = s[None, :]; UV[:, :, 1] = np.array([0, 0.006, 2 * bw, 2 * bw + 0.006])[:, None]
    G.grid(Q, UV, part, 'coat_tl', accent=acc, closed=True, gain=0.92, phi=np.tile(phis, (4, 1)), inside=K.inside)


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
            sides = (1,) if kind == 'chest' else (1, -1)          # ('chest2' = a pocket on each breast)
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
    for s in (() if o.get('skirt') and not o.get('sleeve_from') else ('l', 'r')):     # (a skirt: no sleeves)
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
    coat_facings(K, o)
    if o.get('lapel'):
        coat_lapels(K, o)
    if o.get('collar'):
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
        o = dict(spec, belt=m['K'][2], top=m['K'][3], _cache=cache)
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
    dl = PG.hidden_skin(m, V, G.F)
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


def write_glb(path, Ps, F, FUV, W, G, A, wear, images, accent_mats, chains):
    """the pilot's compact layout (POSITION = male, _D_<BODY>, _N, _J/_W, _G) + triangles grouped by accent (one
    primitive each: primitive 0 = the layer's cloth, then each accent with its own material) + the sway chains as output
    vertex indices (ewWear.sway)"""
    gl = lambda c: np.stack([c[:, 0], c[:, 2], -c[:, 1]], axis=1)
    N = PG.vertex_normals(Ps['male'], F)
    verts, key_of, first = [], {}, {}
    tri_by_acc = {}
    for f, fu in zip(F, FUV):
        corner = []
        for vi, u in zip(f, fu):
            k = (vi, round(float(u[0]), 5), round(float(u[1]), 5))
            j = key_of.get(k)
            if j is None:
                j = key_of[k] = len(verts); verts.append((vi, (float(u[0]), float(u[1]))))
                first.setdefault(vi, j)
            corner.append(j)
        acc_i = A[f[0]]
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
    for key, spec in TIGHT.items():
        if only and key not in only:
            continue
        rows.append(bake_tight(key, spec, frames, m, a.out, a.tiles, a.views or None))
    print(json.dumps(rows, indent=1))


if __name__ == '__main__':
    main()
