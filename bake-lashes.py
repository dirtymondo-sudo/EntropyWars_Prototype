#!/usr/bin/env python3
"""bake-lashes.py - THE LID LASHES (repo-only tooling, 2026-11-03): MakeHuman's stock Lashes 1-4 drawn onto the MPFB eyelids.

mondo (11-03): "im not seeing lashes 1 -4 show up in the character creator ... i click them but i dont see any lashes".
Why: the stock eyelashes01-04 proxies (makehuman_system_assets, CC0) are fitted to hm08's EYELASH HELPER (the groups
helper-l/r-eyelashes-1/2: a fringe of their own with its own UV island at the top of the sheet). bake-mpfb.py cuts every
helper but the eyes / teeth / tongue from the MPFB bodies, and bake_looks drew each lash into the sheet through the
helper's UVs, so Lashes 1-4 (and every body's own lashes: the kits wear eyelashes01 / 02) landed on a patch of the sheet
(box 673,15) that no triangle of the body uses. The pack mesh lashes (mindfront_*) are fitted to the eyelid itself, so
they showed.

The fix: each proxy vertex's rest point (its .mhclo fit on hm08's base.obj) is dropped onto the NEAREST point of the
body's own skin (group `body`, round the eyes), and that point's UV is where the lash is drawn. The fringe lies down on
the lid along its rim, the way a lash line looks from the front, thicker toward the outer corner. Drawn the way
bake_looks draws a layer (the lash's own PNG, alpha 0.8, 4 x 4 supersampled, premultiplied "over", cropped to its box),
so the game's layer path (sprites.js getMhLookLayers, three-renderer.js setLook / tintLayer + the Lash colour) is the same.

  git clone --depth 1 https://github.com/makehumancommunity/mpfb2 /tmp/mpfb2
  unzip makehuman_system_assets_cc0.zip 'eyelashes/*' -d /tmp/sys
  python3 -I bake-lashes.py --mpfb /tmp/mpfb2 --sys /tmp/sys --out <dir> [--check <eyelashes01_cc0 dir>]

Writes <out>/eyelash_<name>.png (upload to R2 Assets/Models/charactercreation/mpfb/looks/) and prints the sprites.js
EW_MH_LOOKS.lashes rows (the new boxes). --check re-draws the pack's mindfront lashes (already body-fitted) and prints
their boxes, which must match the rows bake-mpfb.py wrote (proves this tool's UVs are the game sheet's).
A re-run of bake-mpfb.py --looks writes the helper-drawn lash PNGs again: run this after it.
Notes: docs/notes/character-creator.md "THE LID LASHES".
"""
import argparse, os

import numpy as np
from PIL import Image

PX = 1024
ALPHA = 0.8          # bake_looks' lash alpha
NEAR = 0.6           # body faces this close (hm08 units, dm) to the lash are the candidates


def read_obj(path):
    vs, vts, faces, groups, g = [], [], [], [], ''
    for line in open(path, encoding='utf-8', errors='replace'):
        p = line.split()
        if not p:
            continue
        if p[0] == 'v':
            vs.append([float(x) for x in p[1:4]])
        elif p[0] == 'vt':
            vts.append([float(x) for x in p[1:3]])
        elif p[0] == 'g':
            g = p[1] if len(p) > 1 else ''
        elif p[0] == 'f':
            f = []
            for a in p[1:]:
                q = a.split('/')
                f.append((int(q[0]) - 1, int(q[1]) - 1 if len(q) > 1 and q[1] else int(q[0]) - 1))
            faces.append(f)
            groups.append(g)
    return np.array(vs, np.float64), np.array(vts, np.float64), faces, groups


def read_mhclo(path):
    """[(refs (3), weights (3), offset (3))] + the x / y / z scale lines + the obj / material file names"""
    refs, scale, on, meta = [], {}, False, {}
    for line in open(path, encoding='utf-8', errors='replace'):
        s = line.strip()
        p = s.split()
        if not p or s.startswith('#'):
            continue
        if not on:
            if p[0] in ('x_scale', 'y_scale', 'z_scale') and len(p) == 4:
                scale[p[0][0]] = (int(p[1]), int(p[2]), float(p[3]))
            elif p[0] in ('obj_file', 'material') and len(p) > 1:
                meta[p[0]] = s.split(None, 1)[1]
            elif p[0] == 'verts':
                on = True
            continue
        try:
            if len(p) >= 9:
                refs.append(((int(p[0]), int(p[1]), int(p[2])), tuple(map(float, p[3:6])), tuple(map(float, p[6:9]))))
            elif len(p) >= 6:
                refs.append(((int(p[0]), int(p[1]), int(p[2])), tuple(map(float, p[3:6])), (0.0, 0.0, 0.0)))
            elif len(p) == 1:
                refs.append(((int(p[0]),) * 3, (1.0, 0.0, 0.0), (0.0, 0.0, 0.0)))
            elif refs:
                break
        except ValueError:
            if p[0] in ('material',) and len(p) > 1:
                meta['material'] = s.split(None, 1)[1]
            elif refs:
                break
    return refs, scale, meta


def mhmat_texture(path):
    for line in open(path, encoding='utf-8', errors='replace'):
        p = line.split(None, 1)
        if len(p) == 2 and p[0] == 'diffuseTexture':
            return os.path.join(os.path.dirname(path), os.path.basename(p[1].strip()))
    return None


class Body:
    """hm08 base.obj: rest points, the body's skin triangles + their UVs (the game sheet's: the lids are never moved)"""
    def __init__(self, mpfb):
        base = os.path.join(mpfb, 'src', 'mpfb', 'data', '3dobjs', 'base.obj')
        self.V, VT, faces, groups = read_obj(base)
        tri, tuv = [], []
        for f, g in zip(faces, groups):
            if g != 'body':
                continue
            for k in range(1, len(f) - 1):
                tri.append((f[0][0], f[k][0], f[k + 1][0]))
                tuv.append((VT[f[0][1]], VT[f[k][1]], VT[f[k + 1][1]]))
        self.tri = np.array(tri)
        self.tuv = np.array(tuv)                                   # (n, 3, 2)
        self.cen = self.V[self.tri].mean(axis=1)
        self.body = np.zeros(len(self.V), bool)
        self.body[self.tri.ravel()] = True

    def place(self, refs, scale):
        """each proxy vertex's rest point (MakeHuman's fit: three base vertices x weights + the offset x the scale)"""
        sc = np.array([abs(self.V[scale[a][0], i] - self.V[scale[a][1], i]) / scale[a][2] if a in scale else 1.0
                       for i, a in enumerate('xyz')])
        ri = np.array([r[0] for r in refs])
        rw = np.array([r[1] for r in refs])
        ro = np.array([r[2] for r in refs])
        return (self.V[ri] * rw[..., None]).sum(axis=1) + ro * sc, ri

    def uv_on_skin(self, P):
        """each point -> the UV of the nearest point of the body's skin"""
        lo, hi = P.min(axis=0) - NEAR, P.max(axis=0) + NEAR
        cand = np.nonzero(np.all((self.cen >= lo) & (self.cen <= hi), axis=1))[0]
        A, B, C = (self.V[self.tri[cand, k]] for k in range(3))
        out = np.zeros((len(P), 2))
        for i, p in enumerate(P):
            q, w = closest_on_tris(p, A, B, C)
            d = np.linalg.norm(q - p, axis=1)
            j = int(np.argmin(d))
            out[i] = (self.tuv[cand[j]] * w[j][:, None]).sum(axis=0)
        return out


def closest_on_tris(p, A, B, C):
    """the nearest point of each triangle to p + its barycentric weights (Ericson, Real-Time Collision Detection 5.1.5)"""
    n = len(A)
    ab, ac, ap = B - A, C - A, p - A
    d1, d2 = (ab * ap).sum(1), (ac * ap).sum(1)
    bp = p - B
    d3, d4 = (ab * bp).sum(1), (ac * bp).sum(1)
    cp = p - C
    d5, d6 = (ab * cp).sum(1), (ac * cp).sum(1)
    va = d3 * d6 - d5 * d4
    vb = d5 * d2 - d1 * d6
    vc = d1 * d4 - d3 * d2
    w = np.zeros((n, 3))
    den = va + vb + vc
    den[np.abs(den) < 1e-18] = 1e-18
    v_, w_ = vb / den, vc / den
    w[:] = np.stack([1 - v_ - w_, v_, w_], 1)                     # inside the face
    m = (vc <= 0) & (d1 >= 0) & (d3 <= 0)                          # edge AB
    t = d1 / np.where(np.abs(d1 - d3) < 1e-18, 1e-18, d1 - d3)
    w[m] = np.stack([1 - t, t, 0 * t], 1)[m]
    m = (vb <= 0) & (d2 >= 0) & (d6 <= 0)                          # edge AC
    t = d2 / np.where(np.abs(d2 - d6) < 1e-18, 1e-18, d2 - d6)
    w[m] = np.stack([1 - t, 0 * t, t], 1)[m]
    m = (va <= 0) & ((d4 - d3) >= 0) & ((d5 - d6) >= 0)            # edge BC
    t = (d4 - d3) / np.where(np.abs((d4 - d3) + (d5 - d6)) < 1e-18, 1e-18, (d4 - d3) + (d5 - d6))
    w[m] = np.stack([0 * t, 1 - t, t], 1)[m]
    w[(d1 <= 0) & (d2 <= 0)] = (1, 0, 0)                           # the corners
    w[(d3 >= 0) & (d4 <= d3)] = (0, 1, 0)
    w[(d6 >= 0) & (d5 <= d6)] = (0, 0, 1)
    q = A * w[:, :1] + B * w[:, 1:2] + C * w[:, 2:3]
    return q, w


def bilinear(tex, x, y):
    h, w = tex.shape[:2]
    x = np.clip(x, 0, w - 1.001)
    y = np.clip(y, 0, h - 1.001)
    xi, yi = x.astype(int), y.astype(int)
    fx, fy = (x - xi)[:, None], (y - yi)[:, None]
    return (tex[yi, xi] * (1 - fx) * (1 - fy) + tex[yi, xi + 1] * fx * (1 - fy) +
            tex[yi + 1, xi] * (1 - fx) * fy + tex[yi + 1, xi + 1] * fx * fy)


def draw(puv, vts, faces, tex, px=PX, alpha=ALPHA, ss=4):
    """bake-mpfb.py project_proxy's rasteriser: the proxy's triangles at puv (the sheet's UV, v up), sampling its texture"""
    th, tw = tex.shape[:2]
    S = px * ss
    dst = puv * S
    dst[:, 1] = S - dst[:, 1]
    x0, y0 = np.floor(dst.min(axis=0)).astype(int) - 2
    x1, y1 = np.ceil(dst.max(axis=0)).astype(int) + 2
    x0 -= x0 % ss; y0 -= y0 % ss
    x1 += (-x1) % ss; y1 += (-y1) % ss
    x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, S), min(y1, S)
    acc = np.zeros((y1 - y0, x1 - x0, 4), np.float32)
    for f in faces:
        for k in range(1, len(f) - 1):
            tri = (f[0], f[k], f[k + 1])
            a, b, c = (dst[t[0]] - (x0, y0) for t in tri)
            ta, tb, tc = ((vts[t[1]] if len(vts) else (0.5, 0.5)) for t in tri)
            bx0, by0 = np.floor(np.minimum(np.minimum(a, b), c)).astype(int)
            bx1, by1 = np.ceil(np.maximum(np.maximum(a, b), c)).astype(int)
            bx0, by0 = max(bx0, 0), max(by0, 0)
            bx1, by1 = min(bx1, acc.shape[1] - 1), min(by1, acc.shape[0] - 1)
            if bx1 < bx0 or by1 < by0:
                continue
            d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
            if abs(d) < 1e-9:
                continue
            gx, gy = np.meshgrid(np.arange(bx0, bx1 + 1) + 0.5, np.arange(by0, by1 + 1) + 0.5)
            w0 = ((b[1] - c[1]) * (gx - c[0]) + (c[0] - b[0]) * (gy - c[1])) / d
            w1 = ((c[1] - a[1]) * (gx - c[0]) + (a[0] - c[0]) * (gy - c[1])) / d
            w2 = 1 - w0 - w1
            m = (w0 >= 0) & (w1 >= 0) & (w2 >= 0)
            if not m.any():
                continue
            ys, xs = np.nonzero(m)
            su = w0[ys, xs] * ta[0] + w1[ys, xs] * tb[0] + w2[ys, xs] * tc[0]
            sv = w0[ys, xs] * ta[1] + w1[ys, xs] * tb[1] + w2[ys, xs] * tc[1]
            col = bilinear(tex, su * tw - 0.5, (1 - sv) * th - 0.5)
            col[:, 3] *= alpha
            col[:, :3] *= col[:, 3:4]
            cur = acc[ys + by0, xs + bx0]
            acc[ys + by0, xs + bx0] = col + cur * (1 - col[:, 3:4])      # "over", premultiplied
    h_, w_ = acc.shape[:2]
    small = acc.reshape(h_ // ss, ss, w_ // ss, ss, 4).mean(axis=(1, 3))
    layer = np.zeros((px, px, 4), np.float32)
    layer[y0 // ss:y1 // ss, x0 // ss:x1 // ss] = small
    return layer


def save_layer(lay, path, px=PX):
    """bake_looks' save_layer: premultiplied RGBA -> a straight-alpha PNG cropped to its box; returns [x, y, w, h]"""
    a = lay[..., 3]
    ys, xs = np.nonzero(a > 1.0 / 255)
    if not len(ys):
        return None
    y0, y1, x0, x1 = max(ys.min() - 1, 0), min(ys.max() + 2, px), max(xs.min() - 1, 0), min(xs.max() + 2, px)
    c = lay[y0:y1, x0:x1]
    rgb = c[..., :3] / np.maximum(c[..., 3:4], 1e-6)
    out = np.concatenate([np.clip(rgb, 0, 1), c[..., 3:4]], axis=2)
    if path:
        Image.fromarray((out * 255 + 0.5).astype(np.uint8), 'RGBA').save(path, optimize=True)
    return [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]


def lash(body, d, name, out, label, solid=None):
    clo = os.path.join(d, [f for f in os.listdir(d) if f.endswith('.mhclo')][0])
    refs, scale, meta = read_mhclo(clo)
    objf = os.path.join(d, meta.get('obj_file') or [f for f in os.listdir(d) if f.endswith('.obj')][0])
    _vs, vts, faces, _g = read_obj(objf)
    P, ri = body.place(refs, scale)
    on_body = body.body[ri].all()
    puv = None if on_body else body.uv_on_skin(P)
    if on_body:                                   # already fitted to the skin: its refs' own UVs (bake_looks' way)
        full = np.zeros((len(body.V), 2))
        for t, tu in zip(body.tri, body.tuv):
            full[t] = tu
        rw = np.array([r[1] for r in refs])
        puv = (full[ri] * rw[..., None]).sum(axis=1) / np.maximum(rw.sum(axis=1, keepdims=True), 1e-6)
    matf = os.path.join(d, meta['material']) if meta.get('material') else os.path.join(d, [f for f in os.listdir(d) if f.endswith('.mhmat')][0])
    texf = mhmat_texture(matf)
    if texf and os.path.exists(texf):
        tex = np.asarray(Image.open(texf).convert('RGBA'), np.float32) / 255.0
    else:
        tex = np.ones((2, 2, 4), np.float32); tex[..., :3] = solid or (0.16, 0.12, 0.10)
    lay = draw(puv, vts, faces, tex)
    box = save_layer(lay, os.path.join(out, 'eyelash_%s.png' % name) if out else None)
    print('    ["%s", "%s", %s],' % (name, label, ', '.join(str(v) for v in box)) if box else '    %s: nothing drawn' % name,
          '' if out else '  (check, fitted to the %s)' % ('skin' if on_body else 'helper'))
    return box


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--mpfb', required=True, help='an mpfb2 clone (src/mpfb/data/3dobjs/base.obj)')
    ap.add_argument('--sys', required=True, help='makehuman_system_assets unzipped (eyelashes/eyelashes01..04)')
    ap.add_argument('--out', required=True, help='where the eyelash_<name>.png layers go')
    ap.add_argument('--check', default='', help='eyelashes01_cc0 unzipped: re-draw its body-fitted lashes, print their boxes')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    body = Body(a.mpfb)
    print('lashes: [')
    for n in ('01', '02', '03', '04'):
        lash(body, os.path.join(a.sys, 'eyelashes', 'eyelashes' + n), 'eyelashes' + n, a.out, 'Lashes %d' % int(n))
    print(']')
    if a.check:
        d = os.path.join(a.check, 'eyelashes')
        for n in sorted(os.listdir(d)):
            lash(body, os.path.join(d, n), n, '', n)


if __name__ == '__main__':
    main()
