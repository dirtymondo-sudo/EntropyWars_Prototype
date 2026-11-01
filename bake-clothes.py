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
    print(json.dumps(rows, indent=1))


if __name__ == '__main__':
    main()
