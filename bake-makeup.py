#!/usr/bin/env python3
"""bake-makeup.py - THE MAKE-UP (2026-11-12, mondo: "make a way in the creator to add makeup too"; notes character-creator.md "THE MAKE-UP").

Where eye liner, eye shadow and blush sit on MakeHuman's hm08 skin sheet (the same sheet on every MPFB body and skin), as ONE small
mask picture: red = eye liner (the lash line + a short wing), green = eye shadow (the upper lid up to under the brow), blue = blush
(the cheeks). three-renderer.js paintMakeup lays the creator's picked colours through it (sprites.js EW_MH_MAKEUP holds its box).
The places are measured on the MPFB head itself: MediaPipe's face landmarks on a face-on drawing of mpfb_female (bake-face.py's own
reader, rasteriser and landmark code, loaded from that file), then every face texel of the sheet is asked where on the face it is.

  python3 bake-makeup.py model=<face_landmarker.task> [body=mpfb_female] [out=charactercreation/mpfb/looks]
  (same installs as bake-face.py). Writes <out>/makeup_mask.png + prints the box for sprites.js EW_MH_MAKEUP. Repo-only tooling.
"""
import os, sys
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bake-face.py')).read()
exec(_src[:_src.index('unit, body, stock, key = ')])   # (imports, A, Glb, sample, front, landmarks, REPO)
body = A.get('body', 'mpfb_female'); out = A.get('out', REPO + 'looks')
LEYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]; REYE = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466]
BROW = [70, 63, 105, 66, 107, 336, 296, 334, 293, 300]
def sstep(x, a, b): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def inpoly(q, poly):
    x, y = q[:, 0], q[:, 1]; ins = np.zeros(len(q), bool); n = len(poly)
    for i in range(n):
        x0, y0 = poly[i]; x1, y1 = poly[(i + 1) % n]; ins ^= ((y0 > y) != (y1 > y)) & (x < (x1 - x0) * (y - y0) / (y1 - y0 + 1e-12) + x0)
    return ins
def sdist(q, a_, b_):
    ab = b_ - a_; t_ = np.clip(((q - a_) @ ab) / (ab @ ab + 1e-12), 0, 1); return np.linalg.norm(q - (a_ + t_[:, None] * ab), axis=1), t_
def pdist(q, poly):
    dm = np.full(len(q), 1e9)
    for i in range(len(poly)): dm = np.minimum(dm, sdist(q, poly[i], poly[(i + 1) % len(poly)])[0])
    return dm
M = Glb(REPO + body + '.glb').prim(body); mimg = np.asarray(M['img']).astype(float); mpos = M['pos']; BI = M['_BASE_INDEX'].astype(int)
mcy = mpos[:, 1].max() - 0.155; mrgb, mP, _ = front(mpos, M['uv'], M['idx'], mimg, 0.0, mcy, 0.16)
L = landmarks(mrgb); res = mrgb.shape[0]; Pm = np.array([mP[int(round(y)), int(round(x))] for x, y in L])
ybrow = np.nanmean(Pm[BROW][:, 1]); Ww = Hh = 1024; uvp = M['uv'] * [Ww, Hh]; skin = BI < 13380
eyes = []
for ring, outer, inner in ((LEYE, 33, 133), (REYE, 263, 362)):
    poly = np.array([Pm[i][:2] for i in ring]); po, pi = Pm[outer][:2], Pm[inner][:2]; sx = np.sign(po[0] - pi[0])
    eyes.append((poly, po, pi, po + np.array([sx * 0.0065, 0.0035]), Pm[ring][:, 2].mean()))
cheeks = [Pm[50][:2] + [0, -0.004], Pm[280][:2] + [0, -0.004]]
out_ = np.zeros((Hh, Ww, 3))
for t in M['idx']:
    if not skin[t].all(): continue
    p = mpos[t]
    if p[:, 1].max() < mcy - 0.09 or p[:, 2].min() < Pm[1][2] - 0.09: continue   # (the face only)
    x, y = uvp[t, 0], uvp[t, 1]; x0, x1 = int(np.floor(x.min())), int(np.ceil(x.max())); y0, y1 = int(np.floor(y.min())), int(np.ceil(y.max()))
    dd = (y[1] - y[2]) * (x[0] - x[2]) + (x[2] - x[1]) * (y[0] - y[2])
    if abs(dd) < 1e-9 or x0 < 0 or y0 < 0 or x1 >= Ww or y1 >= Hh: continue
    if x0 < 600 or y0 > 640: continue   # (the head's own island of the sheet; the mouth's inside pieces sit near the cheeks in space but far off on the sheet)
    gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
    a_ = ((y[1] - y[2]) * (gx - x[2]) + (x[2] - x[1]) * (gy - y[2])) / dd; b_ = ((y[2] - y[0]) * (gx - x[2]) + (x[0] - x[2]) * (gy - y[2])) / dd; c_ = 1 - a_ - b_
    m = (a_ >= -0.02) & (b_ >= -0.02) & (c_ >= -0.02)
    if not m.any(): continue
    yy, xx = np.nonzero(m); q = a_[m][:, None] * p[0] + b_[m][:, None] * p[1] + c_[m][:, None] * p[2]; q2 = q[:, :2]
    lin = np.zeros(len(q)); sh = np.zeros(len(q)); bl = np.zeros(len(q))
    for poly, po, pi, wing, ez in eyes:
        front_ = q[:, 2] > ez - 0.03; ins = inpoly(q2, poly); de = pdist(q2, poly)
        tt = np.clip(((q2 - pi) @ (po - pi)) / ((po - pi) @ (po - pi)), -0.5, 1.5); yline = pi[1] + tt * (po[1] - pi[1]); up = sstep(q2[:, 1] - yline, -0.0008, 0.0008)   # (above the line through the eye's corners)
        l_ = (1 - sstep(de, 0.0009, 0.0022)) * (0.35 + 0.65 * up) * (0.45 + 0.55 * sstep(tt, 0.0, 0.5))   # (the lash line: full on the upper lid, thinner below and toward the nose)
        dw, tw = sdist(q2, po, wing); l_ = np.maximum(l_, (1 - sstep(dw, 0.0004 + 0.0011 * (1 - tw), 0.0012 + 0.0016 * (1 - tw))))   # (the wing, tapering)
        within = 1 - sstep(np.abs(tt - 0.5), 0.62, 0.85)
        s_ = up * (1 - sstep(de, 0.0045, 0.0105)) * within * (1 - sstep(q2[:, 1], ybrow - 0.0055, ybrow - 0.0015))   # (the upper lid, fading out under the brow)
        ok = front_ & ~ins; lin = np.maximum(lin, np.where(ok, l_, 0)); sh = np.maximum(sh, np.where(ok, s_, 0))
    for c in cheeks:
        bl = np.maximum(bl, np.exp(-(((q2[:, 0] - c[0]) / 0.017) ** 2 + ((q2[:, 1] - c[1]) / 0.012) ** 2)) * (q[:, 2] > Pm[1][2] - 0.07))
    out_[y0 + yy, x0 + xx] = np.maximum(out_[y0 + yy, x0 + xx], np.stack([lin, sh, bl], 1))
ys, xs = np.nonzero(out_.max(2) > 0.004); bx0, bx1, by0, by1 = xs.min() - 2, xs.max() + 3, ys.min() - 2, ys.max() + 3
im = Image.fromarray((np.clip(out_[by0:by1, bx0:bx1], 0, 1) * 255).astype(np.uint8)); im.save(os.path.join(out, 'makeup_mask.png'), optimize=True)
print('makeup_mask.png %dx%d, EW_MH_MAKEUP box: [%d, %d, %d, %d]' % (im.size[0], im.size[1], bx0, by0, bx1 - bx0, by1 - by0))
