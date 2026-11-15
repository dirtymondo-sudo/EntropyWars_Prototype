#!/usr/bin/env python3
"""bake-trees.py — THE PAINTED TREES (2026-11-15, mondo: "the undersides of the trees are all black. the new trees mess up dirt paths
... the leaves start too low ... Not these paper machete trees ... leaves on branches. Anime Ghibli style. simple yet effective").

Replaces THE FULL TREES (slices of the pack's whole-crown picture). Each tree is now BUILT, nothing is cut from a picture of a tree:
  THE WOOD    : a trunk with real boughs and twigs (tapered tubes) in the pack tree's own bark picture.
  THE LEAVES  : a LEAFY tree carries round PUFFS at its bough ends. A puff is a ball of small sheets that face outward; every sheet
                wears a painted spray of leaves. A FIR carries tiers of drooping bough sheets wearing a painted needle spray.
  THE PAINT   : the sprays are drawn here (no picture of a tree), in the pack tree's own green, in THREE TONES: sunlit, mid, shade.
                A sheet on top of a puff wears the sunlit row, one underneath the shade row, so the crown reads round and painted in
                any light, and an underside is shade green, never black.
  THE NORMALS : a sheet's normals point out of its puff and a little up (not along the sheet), and the leaf material is ONE-SIDED with
                both windings in the file, so both faces of a sheet take the same light (three-renderer.js _foliageGlbMat reads the
                one-sided `ewleaf_` material and lifts its shade).
  THE CLEARANCE: no leaf lower than CLEAR of the tree's height (leafy 0.40, fir 0.30): a path under the tree stays a path.

  pip install numpy pillow          (no Blender)
  python3 bake-trees.py <folder with the pack's GLBs> <out folder> [--sheet]     # writes <name>_full.glb; --sheet also the leaf pictures
Then: node sync-zip.js --put <out>/<name>_full.glb Assets/world/nature/retrotreepack/GLB/<name>_full.glb ...  + ASSET_MANIFEST.json shas.
The game draws them as `rt:<name>_full` (data.js HQ_TREE_KINDS tree_52 ... tree_56)."""
import sys, os, io, json, math, random, struct, colorsys
import numpy as np
from PIL import Image, ImageDraw

TREES = {  # file stem -> form, seed, height (the pack tree's own), crown half-width
    'tree_rt_4':   dict(form='oak',   seed=11, H=5.55, R=2.35),
    'tree_rt_2_1': dict(form='birch', seed=3,  H=5.06, R=1.5),
    'tree_rt_2':   dict(form='birch', seed=8,  H=4.91, R=1.45),
    'tree_rt_3':   dict(form='fir',   seed=2,  H=3.93, R=1.6),
    'tree_rt_1':   dict(form='pine',  seed=4,  H=2.24, R=0.82),
}
CELL = 128; COLS = 4; ROWS = 3          # the leaf picture: 4 sprays across, 3 tones down (sunlit, mid, shade)

# ---------------------------------------------------------------- the pack file
def read_glb(path):
    b = open(path, 'rb').read(); jl = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + jl]); bin0 = 20 + jl + 8
    def img(i):
        bv = j['bufferViews'][j['images'][i]['bufferView']]; o = bin0 + bv.get('byteOffset', 0); return b[o:o + bv['byteLength']]
    bark = leaf = None
    for m in j['materials']:
        i = j['textures'][m['pbrMetallicRoughness']['baseColorTexture']['index']]['source']
        if 'bark' in m['name'].lower(): bark = (m['name'], img(i))
        else: leaf = img(i)
    return bark, leaf

def green_of(png):
    """the pack tree's own leaf colour (the mean of its picture), as hue / saturation / value"""
    a = np.asarray(Image.open(io.BytesIO(png)).convert('RGBA')).astype(np.float32) / 255; m = a[..., 3] > 0.5
    r, g, b = a[..., 0][m].mean(), a[..., 1][m].mean(), a[..., 2][m].mean(); return colorsys.rgb_to_hsv(r, g, b)

# ---------------------------------------------------------------- the paint
def tones(hsv):
    """three painted tones off the pack's green: sunlit goes warm and bright, shade goes cool and deep. Each = (leaf, vein/edge light, under-leaf)"""
    h, s, v = hsv; s = min(0.78, s * 1.25 + 0.12); h = h + 0.035 * max(0.0, min(1.0, (0.30 - h) / 0.1))      # a yellow-olive pack green leans a little to leaf green
    def c(dh, ss, vv): r, g, b = colorsys.hsv_to_rgb((h + dh) % 1, max(0, min(1, ss)), max(0, min(1, vv))); return (int(r * 255), int(g * 255), int(b * 255), 255)
    return [  # row 0 sunlit, 1 mid, 2 shade
        (c(-0.012, s * 0.95, 0.56), c(-0.03, s * 0.8, 0.70), c(0.0, s, 0.43)),
        (c(0.0, s, 0.41), c(-0.02, s * 0.92, 0.52), c(0.02, s, 0.31)),
        (c(0.04, s * 0.95, 0.27), c(0.02, s, 0.34), c(0.055, s * 0.9, 0.20)),
    ]

def leaf_poly(cx, cy, ang, ln, wd):
    """a pointed leaf: stem end at (cx, cy), tip `ln` along `ang`"""
    ca, sa = math.cos(ang), math.sin(ang); pts = []
    for t, w in ((0, 0), (0.25, 0.42), (0.5, 0.5), (0.75, 0.34), (1, 0), (0.75, -0.34), (0.5, -0.5), (0.25, -0.42)):
        x, y = t * ln, w * wd; pts.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    return pts

def spray_leafy(d, ox, oy, S, T, rnd, small):
    """a round spray of leaves in one cell: under-leaves first, then leaves, the outer ones last so the edge is whole leaves"""
    c = S / 2; n = 170 if small else 140; ln0 = S * (0.10 if small else 0.118)
    for i in range(n // 2):                                             # the bed: under-leaves every way, so the spray's middle is full
        a = rnd.uniform(0, 2 * math.pi); r = S * 0.33 * math.sqrt(rnd.random()); ln = ln0 * rnd.uniform(0.9, 1.2)
        d.polygon(leaf_poly(ox + c + r * math.cos(a), oy + c + r * math.sin(a), rnd.uniform(0, 6.28), ln, ln * 0.55), fill=T[2])
    leaves = []
    for i in range(n):
        a = rnd.uniform(0, 2 * math.pi); r = S * 0.375 * math.sqrt(rnd.random())
        out = a + rnd.uniform(-1.1, 1.1); ln = ln0 * rnd.uniform(0.8, 1.2)
        leaves.append((r, c + r * math.cos(a), c + r * math.sin(a), out, ln))
    leaves.sort()
    for k, (r, x, y, out, ln) in enumerate(leaves):
        col = T[2] if k % 3 == 0 else T[0]
        d.polygon(leaf_poly(ox + x, oy + y, out, ln, ln * 0.52), fill=col)
        if k % 3: d.line([(ox + x, oy + y), (ox + x + ln * 0.8 * math.cos(out), oy + y + ln * 0.8 * math.sin(out))], fill=T[1], width=max(1, S // 64))

def spray_needles(d, ox, oy, S, T, rnd, soft):
    """a conifer bough seen from above: the stem end at the cell's bottom middle, twigs fanning to the top, needles along each twig"""
    bx, by = ox + S / 2, oy + S * 0.98
    twigs = [(0.0, 0.94)] + [(sgn * a, l) for a, l in ((0.34, 0.80), (0.66, 0.62), (0.98, 0.40)) for sgn in (-1, 1)]
    for ti, (ang, l) in enumerate(twigs):
        ang += rnd.uniform(-0.06, 0.06); L = S * l * rnd.uniform(0.93, 1.0); dx, dy = math.sin(ang), -math.cos(ang)
        st = 0.10 if ti == 0 else rnd.uniform(0.16, 0.3)
        n = int(L / (S / 40.0))
        for k in range(n):
            t = st + (1 - st) * k / max(1, n - 1); px, py = bx + dx * L * t, by + dy * L * t
            nl = S * (0.13 if soft else 0.095) * (1.0 - 0.55 * t) * rnd.uniform(0.8, 1.15)
            for sgn in (-1, 1):
                na = ang + sgn * (1.0 if soft else 0.85) + rnd.uniform(-0.15, 0.15)
                col = T[2] if (k + (sgn > 0)) % 3 == 0 else (T[1] if (k % 4 == 1 and sgn < 0) else T[0])
                d.line([(px, py), (px + math.sin(na) * nl, py - math.cos(na) * nl)], fill=col, width=max(2, S // 40))
        d.line([(bx + dx * L * st, by + dy * L * st), (bx + dx * L, by + dy * L)], fill=T[2], width=max(2, S // 50))

def paint(hsv, form, seed):
    SS = 4; S = CELL * SS; im = Image.new('RGBA', (COLS * S, ROWS * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im); T = tones(hsv)
    for col in range(COLS):
        for row in range(ROWS):
            rnd = random.Random(seed * 100 + col)                       # the same spray in all three tones
            if form in ('fir', 'pine'): spray_needles(d, col * S, row * S, S, T[row], rnd, form == 'pine')
            else: spray_leafy(d, col * S, row * S, S, T[row], rnd, form == 'birch')
    a = np.asarray(im).astype(np.float32); a = a.reshape(ROWS * CELL, SS, COLS * CELL, SS, 4)
    al = a[..., 3].mean((1, 3)); w = a[..., 3:4] / 255.0; rgb = (a[..., :3] * w).sum((1, 3)) / np.maximum(w.sum((1, 3)), 1e-6)
    cut = al > 96                                                       # a hard cut-out edge (the game cuts at 0.5)
    # bleed the leaf colour into the clear pixels so a mip never pulls black into an edge
    mean = rgb[cut].mean(0) if cut.any() else np.zeros(3); rgb[~cut] = mean
    out = np.dstack([rgb, np.where(cut, 255, 0)]).astype(np.uint8); return Image.fromarray(out, 'RGBA')

# ---------------------------------------------------------------- the mesh
class Mesh:
    def __init__(self): self.p = []; self.n = []; self.uv = []; self.i = []
    def add(self, p, n, uv, tris, both=False):
        b = len(self.p); self.p += p; self.n += n; self.uv += uv
        for a, c, e in tris:
            self.i += [b + a, b + c, b + e]
            if both: self.i += [b + a, b + e, b + c]
    def lowest(self): return min(q[1] for q in self.p)

def V(*a): return np.array(a, dtype=np.float64)
def unit(v): l = np.linalg.norm(v); return v / l if l > 1e-9 else V(0, 1, 0)
def perp(t):
    a = V(1, 0, 0) if abs(t[0]) < 0.8 else V(0, 0, 1); u = unit(np.cross(t, a)); return u, np.cross(t, u)

def tube(M, pts, rad, sides, vscale=0.9):
    """a tapered limb along pts"""
    ring = []; dist = 0.0
    for k, p in enumerate(pts):
        t = unit(pts[min(k + 1, len(pts) - 1)] - pts[max(k - 1, 0)]); u, w = perp(t)
        if k: dist += np.linalg.norm(p - pts[k - 1])
        ring.append((p, u, w, dist))
    P, N, U, T = [], [], [], []
    for k, (p, u, w, dist) in enumerate(ring):
        for s in range(sides + 1):
            a = 2 * math.pi * s / sides; d = u * math.cos(a) + w * math.sin(a)
            P.append(tuple(p + d * rad[k])); N.append(tuple(d)); U.append((s / sides * (2 if rad[0] > 0.12 else 1), dist * vscale))
    for k in range(len(ring) - 1):
        for s in range(sides):
            a = k * (sides + 1) + s; b = a + sides + 1; T += [(a, a + 1, b), (a + 1, b + 1, b)]
    M.add(P, N, U, T)

def limb(M, a, b, r0, r1, rnd, sides=5, sag=0.0, lift=0.0, segs=4, wob=0.05):
    """a bough from a to b that bends (lift > 0 curls its end up); returns its points"""
    L = np.linalg.norm(b - a); pts = []; rad = []
    for k in range(segs + 1):
        t = k / segs; p = a + (b - a) * t; p = p + V(0, 1, 0) * (lift * L * (t * t - t) * -1.0 * 0 + lift * L * t * t - sag * L * math.sin(t * math.pi))
        if 0 < k < segs: p = p + V(rnd.uniform(-1, 1), rnd.uniform(-0.4, 0.4), rnd.uniform(-1, 1)) * wob * L
        pts.append(p); rad.append(r0 + (r1 - r0) * t)
    tube(M, pts, rad, sides); return pts

def uv_cell(col, row):
    u0, v0 = col / COLS, row / ROWS; e = 0.5 / (CELL * COLS)
    return u0 + e, v0 + e, u0 + 1 / COLS - e, v0 + 1 / ROWS - e          # glTF: v runs down the picture

SUN = unit(V(0.35, 1.0, 0.25))

def puff(L, c, r, rnd, n, crown_c, floor_y, squash=0.78):
    """a ball of leaf sheets round c: each faces out (tilted), wears a spray in the tone of where it sits, shades as part of the ball"""
    ga = math.pi * (3 - math.sqrt(5)); off = rnd.uniform(0, 6.28)
    for k in range(n):
        y = 1 - 2 * (k + 0.5) / n; y = y * 0.86 + 0.14                 # fewer sheets on the very bottom: the wood shows from below
        rr = math.sqrt(max(0, 1 - y * y)); a = k * ga + off
        d = unit(V(rr * math.cos(a), y, rr * math.sin(a)) + V(rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1)) * 0.22)
        pos = c + d * V(1, squash, 1) * r * rnd.uniform(0.5, 0.82)
        ax = unit(d + V(rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1)) * 0.5)
        u, w = perp(ax); ro = rnd.uniform(0, 6.28); u, w = u * math.cos(ro) + w * math.sin(ro), w * math.cos(ro) - u * math.sin(ro)
        s = r * rnd.uniform(0.62, 0.8)
        lit = float(np.dot(unit(d * 0.75 + unit(pos - crown_c) * 0.45), SUN)) + rnd.uniform(-0.12, 0.12)
        row = 0 if lit > 0.52 else (2 if lit < 0.0 else 1)
        u0, v0, u1, v1 = uv_cell(rnd.randrange(COLS), row)
        P = [pos - u * s - w * s, pos + u * s - w * s, pos + u * s + w * s, pos - u * s + w * s]
        low = min(q[1] for q in P)
        if low < floor_y: P = [q + V(0, floor_y - low, 0) for q in P]
        N = [tuple(unit(unit(q - c) * 0.6 + unit(q - crown_c) * 0.4 + V(0, 0.45, 0))) for q in P]
        L.add([tuple(q) for q in P], N, [(u0, v1), (u1, v1), (u1, v0), (u0, v0)], [(0, 1, 2), (0, 2, 3)], both=True)

def bough_sheet(L, a, out, length, width, droop, row, rnd, floor_y):
    """a fir bough: a sheet from the stem outward in two pieces, the outer one drooping; the spray's stem end at the stem"""
    side = unit(np.cross(V(0, 1, 0), out)); mid = a + out * length * 0.5 + V(0, -droop * length * 0.12, 0); tip = a + out * length + V(0, -droop * length * 0.5, 0)
    u0, v0, u1, v1 = uv_cell(rnd.randrange(COLS), row); vm = (v0 + v1) / 2
    P = [a - side * width * 0.5, a + side * width * 0.5, mid - side * width * 0.5, mid + side * width * 0.5, tip - side * width * 0.5, tip + side * width * 0.5]
    low = min(q[1] for q in P)
    if low < floor_y: P = [q + V(0, (floor_y - low) * (0.3 + 0.7 * (k // 2) / 2), 0) for k, q in enumerate(P)]
    N = [tuple(unit(V(0, 1.0, 0) + out * (0.25 + 0.3 * (k // 2)) + side * (0.35 if k % 2 else -0.35))) for k in range(6)]
    L.add([tuple(q) for q in P], N, [(u0, v1), (u1, v1), (u0, vm), (u1, vm), (u0, v0), (u1, v0)], [(0, 1, 3), (0, 3, 2), (2, 3, 5), (2, 5, 4)], both=True)

# ---------------------------------------------------------------- the trees
def oak(W, L, H, R, rnd, floor_y):
    fork = H * 0.36; r0 = H * 0.034
    trunk = [V(0, 0, 0), V(rnd.uniform(-.03, .03), fork * 0.5, rnd.uniform(-.03, .03)), V(rnd.uniform(-.05, .05), fork, rnd.uniform(-.05, .05))]
    tube(W, [V(0, -0.02, 0)] + trunk[1:], [r0 * 1.45, r0 * 0.95, r0 * 0.85], 7)
    base = trunk[-1]; crown_c = V(0, H * 0.66, 0); ends = []
    nb = 5; a0 = rnd.uniform(0, 6.28)
    for k in range(nb):
        a = a0 + k * 2 * math.pi / nb + rnd.uniform(-0.25, 0.25); reach = R * rnd.uniform(0.60, 0.74); up = H * rnd.uniform(0.50, 0.64)
        end = V(math.cos(a) * reach, up, math.sin(a) * reach)
        pts = limb(W, base - V(0, r0 * 0.4, 0), end, r0 * 0.6, r0 * 0.18, rnd, sides=5, sag=-0.1, segs=4)
        ends.append((end, R * rnd.uniform(0.40, 0.47)))
        for j in (2, 3):                                                # a twig off the bough, to its own puff
            b = a + (1 if (j + k) % 2 else -1) * rnd.uniform(0.6, 1.0); tw = pts[j] + V(math.cos(b) * R * 0.42, H * rnd.uniform(0.12, 0.2), math.sin(b) * R * 0.42)
            limb(W, pts[j], tw, r0 * 0.28, r0 * 0.1, rnd, sides=4, segs=2); ends.append((tw, R * rnd.uniform(0.3, 0.38)))
    for k in range(3):                                                  # the leader and the top of the crown
        a = a0 + 1.0 + k * 2.1; end = V(math.cos(a) * R * 0.22, H * rnd.uniform(0.80, 0.86), math.sin(a) * R * 0.22)
        limb(W, base, end, r0 * 0.5, r0 * 0.14, rnd, sides=4, segs=3); ends.append((end, R * rnd.uniform(0.38, 0.44)))
    for c, r in ends: puff(L, c, r, rnd, 11 if r > R * 0.39 else 8, crown_c, floor_y)
    return ends

def birch(W, L, H, R, rnd, floor_y):
    r0 = H * 0.017; top = V(rnd.uniform(-.08, .08), H * 0.9, rnd.uniform(-.08, .08))
    stem = [V(0, -0.02, 0)] + [V(top[0] * t + rnd.uniform(-.03, .03), top[1] * t, top[2] * t + rnd.uniform(-.03, .03)) for t in (0.25, 0.5, 0.75)] + [top]
    tube(W, stem, [r0 * 1.4, r0, r0 * 0.8, r0 * 0.55, r0 * 0.2], 6)
    crown_c = V(0, H * 0.68, 0); ends = [(top + V(0, H * 0.01, 0), R * 0.46)]; a = rnd.uniform(0, 6.28)
    lv = [0.46, 0.53, 0.60, 0.67, 0.74, 0.81]
    for k, t in enumerate(lv):
        a += 2.4 + rnd.uniform(-0.3, 0.3); a_ = top * t; w = 1.0 - 0.55 * (k / (len(lv) - 1)); reach = R * rnd.uniform(0.62, 0.74) * w
        end = a_ + V(math.cos(a) * reach, H * 0.1, math.sin(a) * reach)
        limb(W, a_, end, r0 * 0.5, r0 * 0.16, rnd, sides=4, segs=3, sag=0.06); ends.append((end, R * rnd.uniform(0.44, 0.52) * (0.72 + 0.28 * w)))
        if k < 4:
            b = a + math.pi + rnd.uniform(-0.5, 0.5); end2 = a_ + V(math.cos(b) * reach * 0.8, H * 0.13, math.sin(b) * reach * 0.8)
            limb(W, a_ + V(0, H * 0.02, 0), end2, r0 * 0.45, r0 * 0.14, rnd, sides=4, segs=3, sag=0.06); ends.append((end2, R * rnd.uniform(0.4, 0.48) * (0.72 + 0.28 * w)))
    for c, r in ends: puff(L, c, r, rnd, 9, crown_c, floor_y, squash=0.95)
    return ends

def fir(W, L, H, R, rnd, floor_y, pine=False):
    r0 = H * (0.021 if not pine else 0.024); top = V(0, H * 0.93, 0)
    tube(W, [V(0, -0.02, 0), V(0, H * 0.3, 0), V(0, H * 0.65, 0), top], [r0 * 1.35, r0 * 0.9, r0 * 0.5, r0 * 0.12], 6)
    tiers = 10 if not pine else 7; y0 = floor_y / H + (0.16 if not pine else 0.06); a = rnd.uniform(0, 6.28)
    for k in range(tiers):
        t = k / (tiers - 1); y = H * (y0 + (0.9 - y0) * t); ln = R * (1.0 - 0.76 * t ** 1.1) * (1.0 if not pine else 0.95); n = 6 if t < 0.5 else (5 if t < 0.8 else 4)
        a += 0.55
        for j in range(n):
            b = a + j * 2 * math.pi / n + rnd.uniform(-0.18, 0.18); out = V(math.cos(b), -0.55 if not pine else 0.05, math.sin(b)); l = ln * rnd.uniform(0.86, 1.06)
            at = V(0, y + rnd.uniform(-0.02, 0.02) * H, 0)
            bough_sheet(L, at, unit(out), l, l * (1.15 if not pine else 1.2), 0.5 if not pine else 0.5, 0 if (t > 0.45 and j % 2 == 0) or t > 0.85 else 1, rnd, floor_y)
            # the shade layer under it: shorter, hanging lower, so a tier has depth and its underside is painted shade green
            bough_sheet(L, at - V(0, H * 0.035, 0), unit(V(math.cos(b + 0.5), -0.75 if not pine else -0.2, math.sin(b + 0.5))), l * 0.8, l * 0.95, 0.5, 2, rnd, floor_y)
    for j in range(3):                                                  # the tip: three small upright sprays
        b = a + j * 2.09; bough_sheet(L, V(0, H * 0.84, 0), unit(V(math.cos(b) * 0.35, 1, math.sin(b) * 0.35)), H * 0.16, H * 0.1, 0.0, 0, rnd, floor_y)
    return []

# ---------------------------------------------------------------- the file
def write_glb(path, name, W, L, bark, leaf_png):
    bin_ = bytearray(); views = []; acc = []
    def view(data, target=None):
        while len(bin_) % 4: bin_.append(0)
        v = {'buffer': 0, 'byteOffset': len(bin_), 'byteLength': len(data)}
        if target: v['target'] = target
        bin_.extend(data); views.append(v); return len(views) - 1
    def prim(M, mat):
        p = np.array(M.p, np.float32); n = np.array(M.n, np.float32); uv = np.array(M.uv, np.float32); i = np.array(M.i, np.uint16 if len(M.p) < 65536 else np.uint32)
        a = {}
        for key, arr, typ in (('POSITION', p, 'VEC3'), ('NORMAL', n, 'VEC3'), ('TEXCOORD_0', uv, 'VEC2')):
            d = {'bufferView': view(arr.tobytes(), 34962), 'componentType': 5126, 'count': len(arr), 'type': typ}
            if key == 'POSITION': d['min'] = p.min(0).tolist(); d['max'] = p.max(0).tolist()
            acc.append(d); a[key] = len(acc) - 1
        acc.append({'bufferView': view(i.tobytes(), 34963), 'componentType': 5123 if i.dtype == np.uint16 else 5125, 'count': len(i), 'type': 'SCALAR'})
        return {'attributes': a, 'indices': len(acc) - 1, 'material': mat}
    prims = [prim(W, 0), prim(L, 1)]
    imgs = [{'bufferView': view(bark[1]), 'mimeType': 'image/png', 'name': bark[0]}, {'bufferView': view(leaf_png), 'mimeType': 'image/png', 'name': 'ewleaf_' + name}]
    j = {'asset': {'version': '2.0', 'generator': 'Entropy Wars bake-trees.py (the painted trees)'}, 'scene': 0, 'scenes': [{'nodes': [0, 1]}],
         'nodes': [{'mesh': 0, 'name': name}, {'mesh': 1, 'name': name + '_leaves'}],
         'meshes': [{'name': name, 'primitives': [prims[0]]}, {'name': name + '_leaves', 'primitives': [prims[1]]}],
         'materials': [{'name': bark[0], 'doubleSided': True, 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': 0}},
                       # ONE-SIDED on purpose (both windings are in the file with the same normals): see THE NORMALS above
                       {'name': 'ewleaf_' + name, 'alphaMode': 'MASK', 'alphaCutoff': 0.5, 'doubleSided': False, 'pbrMetallicRoughness': {'baseColorTexture': {'index': 1}, 'metallicFactor': 0}}],
         'textures': [{'sampler': 0, 'source': 0}, {'sampler': 1, 'source': 1}],
         'samplers': [{'magFilter': 9728, 'minFilter': 9984}, {'magFilter': 9728, 'minFilter': 9984, 'wrapS': 33071, 'wrapT': 33071}],
         'images': imgs, 'accessors': acc, 'bufferViews': views, 'buffers': [{'byteLength': 0}]}
    while len(bin_) % 4: bin_.append(0)
    j['buffers'][0]['byteLength'] = len(bin_); js = json.dumps(j, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(bin_), 0x004E4942) + bytes(bin_)
    open(path, 'wb').write(out); return len(out)

def bake(src, dst, name, o, sheet=None):
    bark, leafpic = read_glb(src); rnd = random.Random(o['seed']); H, R, form = o['H'], o['R'], o['form']
    W, L = Mesh(), Mesh(); clear = 0.30 if form in ('fir', 'pine') else 0.40; floor_y = H * clear
    if form == 'oak': oak(W, L, H, R, rnd, floor_y)
    elif form == 'birch': birch(W, L, H, R, rnd, floor_y)
    else: fir(W, L, H, R, rnd, floor_y, pine=(form == 'pine'))
    im = paint(green_of(leafpic), form, o['seed']); buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
    if sheet: im.save(os.path.join(sheet, name + '_leaves.png'))
    size = write_glb(dst, name, W, L, bark, buf.getvalue())
    return H, len(W.i) // 3, len(L.i) // 3, L.lowest() / H, size

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]; src, out = args[0], args[1]; os.makedirs(out, exist_ok=True)
    for name, o in TREES.items():
        H, tw, tl, low, size = bake(os.path.join(src, name + '.glb'), os.path.join(out, name + '_full.glb'), name, o, out if '--sheet' in sys.argv else None)
        print('%-12s %-5s height %.2f  wood triangles %d  leaf triangles %d (both faces)  lowest leaf %.0f%% up  %d bytes' % (name, o['form'], H, tw, tl, low * 100, size))
