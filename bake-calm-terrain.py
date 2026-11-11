#!/usr/bin/env python3
"""bake-calm-terrain.py — THE CALM GROUND test sheets (2026-11-11, the Fairy Forest Arena (Calm) test map).

mondo 11-11: "the terrain pixel sprites are a little busy and distract from the 3d models on the board ... make grass look like
actual grass from a AAA RPG game ... more realistic, but also less busy". Riot's VFX style guide (2017, section III, p.13-14):
the ENVIRONMENT value range sits lowest, the CHARACTER range above it; p.19: the environment's saturation range is the lowest
too. These sheets are made for that: low value, low saturation, low local contrast, no pixel-art edges.

Made here from code (numpy + PIL), nothing downloaded: periodic FFT noise (tiles by construction) + drawn grass blades /
pebbles / cracks. One sheet = one 3.5 m battle square (the game's ONE SPRITE PER SQUARE), 1024 px (~290 px per metre).

  python3 -I bake-calm-terrain.py <out dir> [calm_marble_1,calm_ice_1,...]   writes each sheet (+ calm_sheets.png preview)

Upload: node sync-zip.js --put <out>/calm_marble_1.png Assets/world/terrain/calm/calm_marble_1.png  (each new sheet).
THE ROLLOUT (2026-11-11, mondo: "make calm versions of all the maps"): data.js CALM_TERRAIN lists every sheet, the pixel keys
each one replaces and the ones without a repeat; three-renderer.js THE CALM LOOK draws them on every map (window.EW_NO_CALM_LOOK
or a room's ground look = Pixel shows his sheets). Shipped sheets are never rebaked in place: a new bake = a new _N file name.
"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

N = 1024


def fft_noise(n, lo, hi, seed, beta=1.0):
    """periodic band-limited noise in [-1, 1]: frequencies lo..hi cycles per sheet, amplitude ~ 1/f^beta (tiles seamlessly)"""
    rng = np.random.default_rng(seed)
    w = rng.standard_normal((n, n))
    F = np.fft.fft2(w)
    fx = np.fft.fftfreq(n) * n
    f = np.sqrt(fx[None, :] ** 2 + fx[:, None] ** 2)
    band = (f >= lo) & (f <= hi)
    amp = np.where(band, 1.0 / np.maximum(f, 1e-6) ** beta, 0.0)
    # soft band edges
    soft = np.clip((f - lo * 0.7) / (lo * 0.3 + 1e-6), 0, 1) * np.clip((hi * 1.3 - f) / (hi * 0.3 + 1e-6), 0, 1)
    amp = np.where(f > 0, (1.0 / np.maximum(f, 1e-6) ** beta) * soft, 0.0)
    out = np.real(np.fft.ifft2(F * amp))
    out -= out.mean()
    out /= (np.abs(out).max() + 1e-9)
    return out


def worley(n, g, seed, warp=None):
    """periodic cellular noise on a g x g lattice: (F1, F2, cell id of F1) per pixel; `warp` = (dx, dy) pixel offsets"""
    rng = np.random.default_rng(seed)
    pts = rng.random((g, g, 2))
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float64)
    if warp is not None:
        xx = xx + warp[0]; yy = yy + warp[1]
    u = (xx / n * g) % g; v = (yy / n * g) % g
    ci = np.floor(u).astype(int); cj = np.floor(v).astype(int)
    F1 = np.full((n, n), 9.0); F2 = np.full((n, n), 9.0); ID = np.zeros((n, n), dtype=np.int64)
    for di in (-1, 0, 1):
        for dj in (-1, 0, 1):
            ni = (ci + di) % g; nj = (cj + dj) % g
            px = ci + di + pts[nj, ni, 0]; py = cj + dj + pts[nj, ni, 1]
            d = np.sqrt((u - px) ** 2 + (v - py) ** 2)
            cid = nj * g + ni
            closer = d < F1
            F2 = np.where(closer, F1, np.minimum(F2, d))
            ID = np.where(closer, cid, ID)
            F1 = np.where(closer, d, F1)
    return F1, F2, ID


def srgb_to_lin(c):
    c = np.asarray(c, dtype=np.float64)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def lin_to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def hexc(h):
    return np.array([(h >> 16) & 255, (h >> 8) & 255, h & 255], dtype=np.float64) / 255.0


def lerp(a, b, t):
    t = np.asarray(t)[..., None]
    return a * (1 - t) + b * t


def wrap_strokes(draw_fn, x, y, reach):
    """call draw_fn at (x, y) and at every wrapped copy the stroke reaches (the sheet tiles)"""
    xs = [x] + ([x + N] if x < reach else []) + ([x - N] if x > N - reach else [])
    ys = [y] + ([y + N] if y < reach else []) + ([y - N] if y > N - reach else [])
    for xx in xs:
        for yy in ys:
            draw_fn(xx, yy)


def blades(rng, count, len_lo, len_hi, cols, alpha, width=1, bias=None):
    """a layer of short grass strokes (RGBA), random directions (top-down: blades lean every way, a little toward bias)"""
    layer = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    xs = rng.uniform(0, N, count)
    ys = rng.uniform(0, N, count)
    ls = rng.uniform(len_lo, len_hi, count)
    ang = rng.uniform(0, 2 * np.pi, count)
    if bias is not None:
        ang = np.where(rng.random(count) < bias[1], bias[0] + rng.normal(0, 0.5, count), ang)
    ci = rng.integers(0, len(cols), count)
    al = (alpha * rng.uniform(0.6, 1.0, count) * 255).astype(int)
    for i in range(count):
        x, y, L, a = xs[i], ys[i], ls[i], ang[i]
        x2, y2 = x + np.cos(a) * L, y + np.sin(a) * L
        c = cols[ci[i]]
        col = (int(c[0] * 255), int(c[1] * 255), int(c[2] * 255), int(al[i]))
        def dr(xx, yy, x2=x2 - x, y2=y2 - y, col=col):
            d.line([(xx, yy), (xx + x2, yy + y2)], fill=col, width=width)
        wrap_strokes(dr, x, y, len_hi + 2)
    return layer


def to_img(rgb):
    return Image.fromarray((np.clip(rgb, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGB')


def stats(name, rgb):
    L = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    print('%-12s mean sRGB %s  L %.3f  std %.3f  sat %.2f' % (name, (rgb.reshape(-1, 3).mean(0) * 255).round().astype(int), L.mean(), L.std(), sat.mean()))


# ── THE GRASS: a mown meadow seen from above — fine blades every way, clumps a hand wide, darker hollows between them, a slow
#    drift of greener / drier patches. Muted olive greens, a narrow value range. ───────────────────────────────────────────────
def bake_grass(seed=11):
    rng = np.random.default_rng(seed)
    macro = fft_noise(N, 1, 4, seed + 1, 0.6)          # 0.9-3.5 m patches: drier / greener
    clump = fft_noise(N, 18, 40, seed + 2, 0.4)        # ~9-19 cm clumps
    fine = fft_noise(N, 60, 220, seed + 3, 0.2)        # the grain between blades
    base_dark = hexc(0x2a3a1a)
    base_mid = hexc(0x46602a)
    dry = hexc(0x66663a)
    # under-layer (the soil + the shade between the blades)
    t = np.clip(0.5 + 0.38 * clump + 0.18 * fine, 0, 1)
    rgb = lerp(base_dark, base_mid, t)
    rgb = lerp(rgb, rgb * (dry / base_mid), np.clip(0.5 + 0.6 * macro, 0, 1) * 0.35)
    img = to_img(rgb).convert('RGBA')
    # three blade layers: shaded under-blades, mid blades, lit tips (few)
    pal_dark = [hexc(0x283a1a), hexc(0x30431f), hexc(0x354a24)]
    pal_mid = [hexc(0x4a6528), hexc(0x557032), hexc(0x4d682d), hexc(0x5b6e34)]
    pal_tip = [hexc(0x6c8740), hexc(0x778a46), hexc(0x688442)]
    img = Image.alpha_composite(img, blades(rng, 26000, 10, 26, pal_dark, 0.55, 2))
    img = Image.alpha_composite(img, blades(rng, 30000, 8, 22, pal_mid, 0.5, 1))
    img = Image.alpha_composite(img, blades(rng, 9000, 6, 16, pal_tip, 0.38, 1))
    img = img.convert('RGB').filter(ImageFilter.GaussianBlur(0.55))
    rgb = np.asarray(img).astype(np.float64) / 255.0
    # clump shading over the blades: the hollows between clumps sit in their own shade; the drift of drier patches
    shade = 1.0 + 0.10 * clump + 0.05 * fine
    rgb = rgb * shade[..., None]
    warm = np.clip(0.5 + 0.7 * macro, 0, 1)
    rgb = lerp(rgb, rgb * np.array([1.06, 1.0, 0.86]), warm * 0.45)
    rgb *= (1.0 + 0.05 * macro)[..., None]
    # pull saturation down a touch (environment range) and keep the value band narrow
    L = (0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2])[..., None]
    rgb = L + (rgb - L) * 0.95
    Lm = L.mean()
    rgb = Lm + (rgb - Lm) * 0.9
    return np.clip(rgb, 0, 1)


def stones(rng, count, r_lo, r_hi, base_cols, alpha=230):
    """a layer of small irregular stones (RGBA): a soft shadow under each, a lit face, a faint top light (light from the north-west)"""
    layer = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(count):
        x, y = rng.uniform(0, N), rng.uniform(0, N)
        r = rng.uniform(r_lo, r_hi)
        k = rng.integers(5, 9)
        a0 = rng.uniform(0, 2 * np.pi)
        rad = r * rng.uniform(0.65, 1.0, k)
        el = rng.uniform(0.55, 1.0)
        ang = a0 + np.arange(k) * 2 * np.pi / k + rng.uniform(-0.25, 0.25, k)
        pts = np.stack([np.cos(ang) * rad, np.sin(ang) * rad * el], 1)
        c = base_cols[rng.integers(0, len(base_cols))] * rng.uniform(0.88, 1.1)
        c = np.clip(c, 0, 1)
        lit = tuple(int(v * 255) for v in c) + (alpha,)
        hi = tuple(int(min(1, v * 1.1) * 255) for v in c) + (int(alpha * 0.45),)
        sh = (0x26, 0x20, 0x1a, int(alpha * 0.45))
        def dr(xx, yy, pts=pts, lit=lit, hi=hi, sh=sh):
            P = [(xx + p[0] + 0.8, yy + p[1] + 1.2) for p in pts]
            d.polygon(P, fill=sh)
            P = [(xx + p[0], yy + p[1]) for p in pts]
            d.polygon(P, fill=lit)
            P = [(xx + p[0] * 0.5 - r * 0.15, yy + p[1] * 0.5 - r * 0.18) for p in pts]
            d.polygon(P, fill=hi)
        wrap_strokes(dr, x, y, r_hi + 3)
    return layer


# ── THE PATH: trodden earth — a grey-brown, a fine grit, soft mottling, gravel half sunk, a few dead blades ─────────────────────
def bake_dirt(seed=21):
    rng = np.random.default_rng(seed)
    macro = fft_noise(N, 1, 5, seed + 1, 0.6)
    mott = fft_noise(N, 8, 30, seed + 2, 0.5)
    grit = fft_noise(N, 120, 400, seed + 3, 0.0)
    damp = fft_noise(N, 3, 10, seed + 4, 0.7)
    a, b = hexc(0x3c3024), hexc(0x4b3c2d)
    rgb = lerp(a, b, np.clip(0.5 + 0.55 * mott + 0.18 * macro, 0, 1))
    rgb = lerp(rgb, rgb * 0.82, np.clip(damp * 1.6 - 0.4, 0, 1) * 0.6)   # damper, darker patches
    rgb *= (1.0 + 0.07 * grit)[..., None]
    img = to_img(rgb).convert('RGBA')
    cols = [hexc(0x58493a), hexc(0x4d4236), hexc(0x605140), hexc(0x473e34), hexc(0x655848)]
    img = Image.alpha_composite(img, stones(rng, 5000, 1.2, 3.2, cols, 170).filter(ImageFilter.GaussianBlur(0.5)))   # the grit
    img = Image.alpha_composite(img, stones(rng, 480, 3.5, 7.5, cols, 220).filter(ImageFilter.GaussianBlur(0.6)))    # the gravel
    img = Image.alpha_composite(img, stones(rng, 40, 9, 15, cols, 235).filter(ImageFilter.GaussianBlur(0.7)))       # a few stones
    img = Image.alpha_composite(img, blades(rng, 1400, 6, 16, [hexc(0x6a5f45), hexc(0x5c5340)], 0.35, 1))
    img = Image.alpha_composite(img, blades(rng, 450, 5, 12, [hexc(0x46522f), hexc(0x4f5a34)], 0.3, 1))
    img = img.convert('RGB').filter(ImageFilter.GaussianBlur(0.4))
    rgb = np.asarray(img).astype(np.float64) / 255.0
    rgb *= (1.0 + 0.06 * macro)[..., None]
    L = (0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2])[..., None]
    rgb = L + (rgb - L) * 0.9
    Lm = L.mean(); rgb = Lm + (rgb - Lm) * 0.72
    return np.clip(rgb, 0, 1)


# ── THE ROCK: a weathered stone face — fractured plates (cellular), each its own tone and a soft bulge, dark seams that come and
#    go, moss in the seams and hollows, a little lichen. Low contrast. ───────────────────────────────────────────────────────────
def bake_rock(seed=31):
    rng = np.random.default_rng(seed)
    wx = fft_noise(N, 2, 6, seed + 1, 0.8) * 46; wy = fft_noise(N, 2, 6, seed + 2, 0.8) * 46
    F1, F2, ID = worley(N, 6, seed + 3, (wx, wy))
    f1b, f2b, idb = worley(N, 15, seed + 4, (wx * 0.6, wy * 0.6))
    fine = fft_noise(N, 80, 300, seed + 5, 0.1)
    mid = fft_noise(N, 10, 40, seed + 6, 0.6)
    tone = np.random.default_rng(seed + 7).uniform(-1, 1, 6 * 6)[ID]
    toneb = np.random.default_rng(seed + 8).uniform(-1, 1, 15 * 15)[idb]
    a, b = hexc(0x494a4a), hexc(0x6b6b66)
    rgb = lerp(a, b, np.clip(0.5 + 0.22 * tone + 0.1 * toneb + 0.22 * mid + 0.1 * fine, 0, 1))
    # each plate bulges a little (lit toward the north-west edge of the plate, shaded at its seam)
    edge = np.clip((F2 - F1) / 0.35, 0, 1)
    rgb *= (0.86 + 0.14 * edge ** 0.6)[..., None]
    # the seams: thin, broken (a mask lets them come and go), the big ones wider
    gate = np.clip(fft_noise(N, 3, 12, seed + 9, 0.5) * 2.2 + 0.5, 0, 1)
    seam = np.exp(-((F2 - F1) / 0.03) ** 2) * (0.55 + 0.45 * gate)
    seam_b = np.exp(-((f2b - f1b) / 0.035) ** 2) * np.clip(fft_noise(N, 4, 14, seed + 10, 0.5) * 2.5, 0, 1) * 0.6
    s = np.clip(seam + seam_b, 0, 1)
    rgb *= (1.0 - 0.55 * s)[..., None]
    # moss in the seams + the low hollows; lichen dots on the plates
    hol = np.clip(-mid * 1.6 - 0.2, 0, 1)
    moss = np.clip(s * 1.3 + hol * 0.8, 0, 1) * np.clip(0.4 + fft_noise(N, 20, 60, seed + 11, 0.4) * 1.5, 0, 1)
    rgb = lerp(rgb, hexc(0x3d4a2c), np.clip(moss, 0, 1) * 0.65)
    lich = np.clip(fft_noise(N, 30, 90, seed + 12, 0.3) * 3.2 - 1.9, 0, 1)
    rgb = lerp(rgb, hexc(0x7d7f6e), lich * 0.3)
    L = (0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2])[..., None]
    Lm = L.mean(); rgb = Lm + (rgb - Lm) * 0.85
    img = to_img(rgb).filter(ImageFilter.GaussianBlur(0.5))
    return np.asarray(img).astype(np.float64) / 255.0


# ── THE LAVA (v3, 2026-11-11, mondo on v2: "the dark parts are kind of distracting, can it just be the lava part, no rocks"): melt
#    only. Deep red where it cools, orange, and yellow where it runs hottest, in long flow lines (bands bent by a slow warp) with a
#    finer streak inside each. No crust, no rafts, no blobs. The game's shader slides
#    two copies of this sheet (THE CALM GROUND's lava); the melt glows from its own colour. ────────────────────────────────────────
def bake_lava(seed=41):
    # v4 (mondo 11-11: v3's flow lines were "too cartoony ... not what the lava looked like before when the dark rocky parts were
    # still there"): calm_lava_2's own melt, the pools between its rafts, over the whole sheet; the rafts are gone. Same seeds and
    # the same maths as v2's melt (streaked noise, the mottle, the thin cooling-skin veins), so it is that lava with the rocks lifted
    # off. Where v2 had a channel's dark-red rim, a slow heat field now lets the melt cool to deep red in places (never to crust).
    wx = fft_noise(N, 2, 7, seed + 1, 0.8) * 70; wy = fft_noise(N, 2, 7, seed + 2, 0.8) * 70
    fine = fft_noise(N, 60, 260, seed + 5, 0.2)
    hot = np.clip(fft_noise(N, 1, 4, seed + 7, 0.8) * 1.4 + 0.72, 0.45, 1.0)
    sx = np.asarray(Image.fromarray(((fft_noise(N, 10, 40, seed + 10, 0.5) * 0.5 + 0.5) * 255).astype(np.uint8)).resize((N, N // 4)).resize((N, N), Image.BICUBIC)).astype(np.float64) / 255.0 - 0.5
    heat = np.clip(0.16 + 0.6 * hot ** 0.8 + 0.55 * sx + 0.15 * fine, 0, 1)
    def ramp(t):
        c0, c1, c2, c3 = hexc(0x5a0c02), hexc(0xc22a05), hexc(0xff6a0e), hexc(0xffc04a)
        t = np.clip(t, 0, 1)[..., None]
        return np.where(t < 0.35, c0 + (c1 - c0) * (t / 0.35), np.where(t < 0.75, c1 + (c2 - c1) * ((t - 0.35) / 0.4), c2 + (c3 - c2) * ((t - 0.75) / 0.25)))
    melt = ramp(heat)
    g1, g2, _ = worley(N, 16, seed + 11, (wx * 0.4, wy * 0.4))
    skin = np.exp(-((g2 - g1) / 0.022) ** 2) * np.clip(1.0 - heat * 0.9, 0, 1)
    melt *= (1.0 - 0.45 * skin)[..., None]
    img = to_img(melt).filter(ImageFilter.GaussianBlur(0.7))
    return np.asarray(img).astype(np.float64) / 255.0

# ── THE SCORCHED GROUND (Hell, 2026-11-11): burnt ground — a dark ash bed, a crust of cracked plates (cellular, low relief), soot
#    patches, small cinders and a little grey ash drift in the cracks. No glow and no embers: the lava is the only bright thing. ──
def bake_scorched(seed=51):
    rng = np.random.default_rng(seed)
    wx = fft_noise(N, 2, 6, seed + 1, 0.8) * 40; wy = fft_noise(N, 2, 6, seed + 2, 0.8) * 40
    F1, F2, ID = worley(N, 9, seed + 3, (wx, wy))
    macro = fft_noise(N, 1, 4, seed + 4, 0.6)
    mid = fft_noise(N, 8, 30, seed + 5, 0.5)
    fine = fft_noise(N, 80, 300, seed + 6, 0.1)
    tone = np.random.default_rng(seed + 7).uniform(-1, 1, 9 * 9)[ID]
    rgb = lerp(hexc(0x2a2422), hexc(0x3f3631), np.clip(0.5 + 0.2 * tone + 0.25 * mid + 0.1 * fine, 0, 1))
    edge = np.clip((F2 - F1) / 0.3, 0, 1)
    rgb *= (0.9 + 0.1 * edge ** 0.6)[..., None]
    gate = np.clip(fft_noise(N, 3, 12, seed + 8, 0.5) * 2.0 + 0.55, 0, 1)
    crack = np.exp(-((F2 - F1) / 0.028) ** 2) * (0.5 + 0.5 * gate)
    rgb *= (1.0 - 0.45 * crack)[..., None]
    ash = np.clip(crack * 0.5 + np.clip(-mid * 1.4 - 0.3, 0, 1) * 0.6, 0, 1) * np.clip(0.5 + fft_noise(N, 20, 60, seed + 9, 0.4) * 1.4, 0, 1)
    rgb = lerp(rgb, hexc(0x5a5550), ash * 0.35)
    soot = np.clip(macro * 1.6 + 0.1, 0, 1)
    rgb = lerp(rgb, rgb * 0.72, soot * 0.6)
    img = to_img(rgb).convert('RGBA')
    cols = [hexc(0x1e1a18), hexc(0x2b2523), hexc(0x352d29), hexc(0x463d37)]
    img = Image.alpha_composite(img, stones(rng, 3800, 1.0, 2.8, cols, 170).filter(ImageFilter.GaussianBlur(0.5)))
    img = Image.alpha_composite(img, stones(rng, 300, 3.0, 6.5, cols, 210).filter(ImageFilter.GaussianBlur(0.6)))
    img = img.convert('RGB').filter(ImageFilter.GaussianBlur(0.45))
    rgb = np.asarray(img).astype(np.float64) / 255.0
    L = (0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2])[..., None]
    rgb = L + (rgb - L) * 0.85
    Lm = L.mean(); rgb = Lm + (rgb - Lm) * 0.8
    return np.clip(rgb, 0, 1)


# ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
#  THE CALM ROLLOUT (2026-11-11, mondo: "make 'calm' versions of all the maps, basically replacing the old sprite terrain textures
#  throughout the game ... make sure any new textures you add are available in the map editor, and keep the old ones there too").
#  One code-made sheet per family of his 128 px sheets, the same rules as the first five: one sheet = one 3.5 m square, 1024 px,
#  low value, low saturation, low local contrast, no pixel edges, tiles by construction. Nothing downloaded, no AI art.
# ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def aniso_noise(n, lo, hi, seed, ax=1.0, ay=1.0, beta=0.6):
    """periodic noise stretched by (ax, ay): a frequency counts as sqrt((fx/ax)^2 + (fy/ay)^2) (ax > ay = streaks along x)"""
    rng = np.random.default_rng(seed)
    F = np.fft.fft2(rng.standard_normal((n, n)))
    fx = np.fft.fftfreq(n) * n
    f = np.sqrt((fx[None, :] * ax) ** 2 + (fx[:, None] * ay) ** 2)
    soft = np.clip((f - lo * 0.7) / (lo * 0.3 + 1e-6), 0, 1) * np.clip((hi * 1.3 - f) / (hi * 0.3 + 1e-6), 0, 1)
    amp = np.where(f > 0, (1.0 / np.maximum(f, 1e-6) ** beta) * soft, 0.0)
    out = np.real(np.fft.ifft2(F * amp)); out -= out.mean(); out /= (np.abs(out).max() + 1e-9)
    return out


def relief(h, k=1.0):
    """light from the north-west on a height field (wraps): 1 + k * slope toward the light"""
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    return 1.0 + k * (-(gx + gy) * 0.7071)


def lum(rgb):
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


def settle(rgb, sat=1.0, contrast=1.0):
    """the environment range: saturation and local contrast pulled toward the sheet's own mean"""
    L = lum(rgb)[..., None]
    rgb = L + (rgb - L) * sat
    Lm = L.mean()
    return np.clip(Lm + (rgb - Lm) * contrast, 0, 1)


def course_cells(n, rows, wlo, whi, seed, along_x=True, offset_rows=True):
    """running-bond courses (bricks, blocks, planks) that tile: `rows` courses across the sheet, each cut into pieces wlo..whi
    px long at random. Returns (id, edge distance in px to the piece's border, u 0..1 along the piece, row index)."""
    rng = np.random.default_rng(seed)
    rh = n / rows
    ID = np.zeros((n, n), dtype=np.int64); ED = np.zeros((n, n)); U = np.zeros((n, n)); RW = np.zeros((n, n), dtype=np.int64)
    a = np.arange(n, dtype=np.float64)
    nid = 0
    for r in range(rows):
        cuts = []; x = rng.uniform(0, whi)
        while x < n - wlo * 0.5:
            cuts.append(x); x += rng.uniform(wlo, whi)
        if not cuts:
            cuts = [0.0]
        cuts = np.array(cuts)
        # the run along the course (wrapping: the last piece runs on into the first)
        pos = a[:, None]
        k = np.searchsorted(cuts, a, side='right') - 1           # -1 = before the first cut = the last piece wrapped
        start = np.where(k >= 0, cuts[np.clip(k, 0, None)], cuts[-1] - n)
        end = np.where(k + 1 < len(cuts), cuts[np.clip(k + 1, 0, len(cuts) - 1)], cuts[0] + n)
        kk = np.where(k >= 0, k, len(cuts) - 1)
        d_run = np.minimum(a - start, end - a)
        u_run = (a - start) / (end - start)
        y0 = int(round(r * rh)); y1 = int(round((r + 1) * rh))
        ys = np.arange(y0, y1)
        d_cross = np.minimum(ys - y0 + 0.5, y1 - 0.5 - ys)
        if along_x:
            ID[y0:y1, :] = nid + kk[None, :]
            ED[y0:y1, :] = np.minimum(d_run[None, :], d_cross[:, None])
            U[y0:y1, :] = u_run[None, :]
            RW[y0:y1, :] = r
        else:
            ID[:, y0:y1] = (nid + kk[None, :]).T
            ED[:, y0:y1] = np.minimum(d_run[None, :], d_cross[:, None]).T
            U[:, y0:y1] = u_run[None, :].T
            RW[:, y0:y1] = r
        nid += len(cuts)
    return ID, ED, U, RW, nid


def per_id(ID, count, seed, lo=-1.0, hi=1.0):
    return np.random.default_rng(seed).uniform(lo, hi, count + 1)[ID]


# ── THE SAND: a dune field seen from above — wind ripples a hand apart running across the sheet, bent by a slow warp, steep on the
#    lee side, a fine grain, a slow drift of paler / deeper sand. Two colours: the desert's muted gold, the beach's pale cream. ─────
def bake_sand(seed=61, beach=False):
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    warp = fft_noise(N, 1, 4, seed + 1, 0.8) * 1.4 + fft_noise(N, 3, 9, seed + 2, 0.8) * 0.35
    k = 15 if not beach else 11
    ph = (xx * 2 / N + yy * k / N) + warp          # ripples ~23 cm apart (integer cycles: tiles)
    f = ph - np.floor(ph)
    prof = np.where(f < 0.72, f / 0.72, (1 - f) / 0.28)         # long windward climb, short lee drop
    prof = prof * prof * (3 - 2 * prof)
    gate = np.clip(0.65 + 0.6 * fft_noise(N, 2, 7, seed + 3, 0.7), 0.25, 1)
    h = prof * gate * 1.4 + fft_noise(N, 20, 80, seed + 4, 0.4) * 0.25
    grain = fft_noise(N, 150, 450, seed + 5, 0.0)
    macro = fft_noise(N, 1, 4, seed + 6, 0.6)
    if beach:
        a, b = hexc(0x968a6f), hexc(0xa99d81)   # (the rollout, 11-11: a step under the first bake, which read white on Bermuda in daylight)
    else:
        a, b = hexc(0xa47c3e), hexc(0xc29755)
    rgb = lerp(a, b, np.clip(0.5 + 0.45 * macro + 0.12 * grain, 0, 1))
    rgb *= relief(h * 6.0, 0.55)[..., None]
    rgb *= (1.0 + 0.035 * grain)[..., None]
    if beach:   # damp darker patches + a few shell bits
        damp = np.clip(fft_noise(N, 2, 6, seed + 7, 0.7) * 1.8 - 0.5, 0, 1)
        rgb = lerp(rgb, rgb * np.array([0.86, 0.86, 0.88]), damp * 0.5)
    img = to_img(rgb).filter(ImageFilter.GaussianBlur(0.6))
    rgb = np.asarray(img).astype(np.float64) / 255.0
    return settle(rgb, 1.12 if not beach else 0.95, 0.8)


# ── THE SNOW: a wind-packed snowfield — soft drifts, faint sastrugi streaks, a cool grey-blue so the units still stand above it ───
def bake_snow(seed=71):
    drift = fft_noise(N, 1, 5, seed + 1, 0.7)
    mid = fft_noise(N, 6, 24, seed + 2, 0.6)
    streak = aniso_noise(N, 6, 60, seed + 3, 0.25, 1.6, 0.5)
    fine = fft_noise(N, 120, 400, seed + 4, 0.0)
    h = drift * 1.2 + mid * 0.35 + streak * 0.25
    rgb = lerp(hexc(0xa9b1ba), hexc(0xc2c8cd), np.clip(0.55 + 0.35 * drift + 0.1 * mid, 0, 1))
    rgb *= relief(h * 9.0, 0.5)[..., None]
    rgb *= (1.0 + 0.02 * fine)[..., None]
    rng = np.random.default_rng(seed + 5)   # a few glints
    g = np.zeros((N, N)); idx = rng.integers(0, N, (900, 2)); g[idx[:, 0], idx[:, 1]] = 1
    g = np.asarray(Image.fromarray((g * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float64) / 255.0
    rgb = rgb + g[..., None] * 0.25
    img = to_img(rgb).filter(ImageFilter.GaussianBlur(0.5))
    return settle(np.asarray(img).astype(np.float64) / 255.0, 0.9, 0.85)


# ── THE MARBLE: a pale veined stone, no slab joints (a joint every square would draw the board's grid twice) ─────────────────────
def bake_marble(seed=81, a=0x7e7a73, b=0x96918a, vein_col=0x5d5a54):   # (the rollout, 11-11: a value step under his own path marble, never the brightest thing on a board)
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    turb = sum(np.abs(fft_noise(N, 2 ** i, 2 ** (i + 1) * 1.5, seed + 1 + i, 0.5)) / (1.6 ** i) for i in range(6))
    t = (xx * 1 / N + yy * 2 / N) * 2 * np.pi + 5.0 * turb
    v = np.abs(np.sin(t))
    gate = np.clip(0.45 + fft_noise(N, 1, 5, seed + 11, 0.6) * 1.3, 0.1, 1)
    vein = (np.exp(-(v / 0.07) ** 2) * 0.8 + np.exp(-(v / 0.3) ** 2) * 0.22) * gate
    turb2 = sum(np.abs(fft_noise(N, 2 ** i, 2 ** (i + 1) * 1.5, seed + 20 + i, 0.5)) / (1.5 ** i) for i in range(1, 6))
    t2 = (xx * 2 / N - yy * 1 / N) * 2 * np.pi + 4.0 * turb2
    vein2 = np.exp(-(np.abs(np.sin(t2)) / 0.03) ** 2) * np.clip(fft_noise(N, 2, 9, seed + 5, 0.6) * 2.2 - 0.4, 0, 1) * 0.5
    cloud = fft_noise(N, 1, 24, seed + 6, 1.0)
    fine = fft_noise(N, 100, 400, seed + 7, 0.1)
    rgb = lerp(hexc(a), hexc(b), np.clip(0.55 + 0.5 * cloud + 0.05 * fine, 0, 1))
    rgb = lerp(rgb, hexc(vein_col), np.clip(vein + vein2, 0, 1) * 0.85)
    img = to_img(rgb).filter(ImageFilter.GaussianBlur(1.0))
    return settle(np.asarray(img).astype(np.float64) / 255.0, 0.85, 1.0)


# ── THE COBBLES: rounded setts laid close, a hand wide, each its own tone and a soft dome, dark earth and grit in the joints ─────
def bake_cobble(seed=91, tone=(0x5a554e, 0x726c63), joint=0x3d3731, g=9, spread=0.24):
    wx = fft_noise(N, 2, 7, seed + 1, 0.8) * 10; wy = fft_noise(N, 2, 7, seed + 2, 0.8) * 10
    F1, F2, ID = worley(N, g, seed + 3, (wx, wy))
    e = (F2 - F1) + fft_noise(N, 20, 70, seed + 9, 0.4) * 0.05     # a ragged stone edge
    r = np.clip(F1 / 0.62, 0, 1)
    dome = (1 - r * r) * np.clip(e / 0.2, 0, 1) ** 0.5
    tn = np.random.default_rng(seed + 4).uniform(-1, 1, g * g)[ID]
    mid = fft_noise(N, 10, 40, seed + 5, 0.5); fine = fft_noise(N, 90, 320, seed + 6, 0.1)
    st = lerp(hexc(tone[0]), hexc(tone[1]), np.clip(0.5 + spread * tn + 0.14 * mid + 0.12 * fine, 0, 1))
    st *= relief(dome * 6.0 + fine * 0.5, 0.5)[..., None]
    st *= (0.88 + 0.12 * dome)[..., None]
    gap = np.clip((0.06 - e) / 0.035, 0, 1)   # (the rollout, 11-11: setts twice the size, joints thinner and nearer the stone's value: the busy cell net went quiet)
    soil = hexc(joint) * (1 + 0.25 * fine + 0.15 * mid)[..., None]
    rgb = lerp(st, soil, gap)
    moss = np.clip(gap * np.clip(fft_noise(N, 4, 16, seed + 7, 0.6) * 2.4 - 0.6, 0, 1), 0, 1)
    rgb = lerp(rgb, hexc(0x39402a), moss * 0.55)
    img = to_img(rgb).convert('RGBA')
    rng = np.random.default_rng(seed + 8)
    img = Image.alpha_composite(img, stones(rng, 1600, 1.0, 2.4, [hexc(0x4a443d), hexc(0x5c564e)], 140).filter(ImageFilter.GaussianBlur(0.5)))
    img = img.convert('RGB').filter(ImageFilter.GaussianBlur(0.55))
    return settle(np.asarray(img).astype(np.float64) / 255.0, 0.85, 0.8)


def wood_grain(seed, ID, n, U, along=0.06, lines=34):
    """board grain: fine lines running along x, each board its own offset and wobble"""
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    off = per_id(ID, n, seed, 0, 40)
    wob = aniso_noise(N, 1, 12, seed + 1, 0.1, 1.0, 0.8) * 1.6
    g = np.sin((yy / N * lines + off + wob) * 2 * np.pi)
    streak = aniso_noise(N, 4, 200, seed + 2, along, 1.0, 0.3)
    return 0.55 * g * np.clip(0.6 + streak, 0, 1.4) + 0.45 * streak


# ── THE PLANKS: a deck of boards a hand and a half wide, their ends staggered, each its own tone, a long grain, dark seams, nails ──
def bake_planks(seed=101, rows=16, a=0x553f2c, b=0x7a5c3f):
    ID, ED, U, RW, n = course_cells(N, rows, N * 0.38, N * 0.85, seed + 1)
    tn = per_id(ID, n, seed + 2)
    gr = wood_grain(seed + 3, ID, n, U, 0.05, 90)
    knots = np.clip(fft_noise(N, 10, 30, seed + 5, 0.5) * 3 - 2.3, 0, 1)
    wear = fft_noise(N, 2, 8, seed + 6, 0.6)
    rgb = lerp(hexc(a), hexc(b), np.clip(0.5 + 0.42 * tn + 0.12 * wear, 0, 1))
    rgb *= (1.0 + 0.11 * gr)[..., None]
    rgb = lerp(rgb, rgb * 0.8, np.clip(-gr * 1.6 - 0.6, 0, 1))   # the darker late-wood lines
    rgb = lerp(rgb, hexc(0x3b2b1f), knots * 0.55)
    seam = np.clip(2.2 - ED, 0, 1)
    bevel = np.clip(ED / 5.0, 0, 1)
    rgb *= (0.85 + 0.15 * bevel)[..., None]
    rgb = lerp(rgb, hexc(0x241a12), seam * 0.8)
    # a pair of nail heads at each board end (dots, not lines)
    rh = N / rows
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    row_c = (RW + 0.5) * rh
    L = np.maximum(ED, 1)
    endu = np.minimum(U, 1 - U)
    nail = np.zeros((N, N))
    for off in (-0.27, 0.27):
        d = np.sqrt(((yy - (row_c + off * rh)) / 1.0) ** 2 + ((endu * 600 - 9) / 1.0) ** 2)
        nail = np.maximum(nail, np.clip(2.6 - d, 0, 1))
    rgb = lerp(rgb, hexc(0x2e2a27), nail * 0.75)
    img = to_img(rgb).filter(ImageFilter.GaussianBlur(0.6))
    return settle(np.asarray(img).astype(np.float64) / 255.0, 0.85, 0.85)


# ── THE MOON: grey regolith — fine dust, pebbles, a few worn craters (ragged rims, shallow bowls), never bubbles ───────────────────
def bake_moon(seed=111, a=0x5c5c5d, b=0x767677, craters=26, grit=(0x6a6a6b, 0x7a7a7b, 0x545456), rocks=(0x616163, 0x6f6f70), sat=0.6):
    rng = np.random.default_rng(seed)
    macro = fft_noise(N, 1, 5, seed + 1, 0.6); mid = fft_noise(N, 8, 40, seed + 2, 0.5); fine = fft_noise(N, 120, 420, seed + 3, 0.0)
    rag = fft_noise(N, 12, 40, seed + 4, 0.5)
    h = macro * 0.8 + mid * 0.35 + fft_noise(N, 40, 140, seed + 5, 0.3) * 0.12
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    for i in range(craters):
        cx, cy = rng.uniform(0, N, 2); r = rng.uniform(14, 48) if i > 2 else rng.uniform(70, 110)
        dx = (xx - cx + N / 2) % N - N / 2; dy = (yy - cy + N / 2) % N - N / 2
        d = np.sqrt(dx * dx + dy * dy) / r + rag * 0.12
        age = rng.uniform(0.35, 1.0)
        bowl = np.where(d < 1, -(1 - d * d) * 1.0, 0) + np.exp(-((d - 1.05) / 0.22) ** 2) * 0.3
        h = h + bowl * (r / 30.0) * age
    rgb = lerp(hexc(a), hexc(b), np.clip(0.5 + 0.38 * macro + 0.15 * mid + 0.1 * fine, 0, 1))
    rgb *= relief(h * 7.0, 0.5)[..., None]
    img = to_img(rgb).convert('RGBA')
    img = Image.alpha_composite(img, stones(rng, 3200, 0.8, 2.6, [hexc(c) for c in grit], 140).filter(ImageFilter.GaussianBlur(0.5)))
    img = Image.alpha_composite(img, stones(rng, 120, 3.0, 7.0, [hexc(c) for c in rocks], 200).filter(ImageFilter.GaussianBlur(0.6)))
    img = img.convert('RGB').filter(ImageFilter.GaussianBlur(0.5))
    return settle(np.asarray(img).astype(np.float64) / 255.0, sat, 0.9)


# ── THE CASTLE STONE: dressed blocks in courses, chipped edges, each block its own tone and pitting, lime joints with moss ─────────
def bake_blocks(seed=121, rows=8, wlo=0.22, whi=0.42, a=0x57534c, b=0x7d776d, joint=0x34302a, moss=0.8):
    ID, ED, U, RW, n = course_cells(N, rows, N * wlo, N * whi, seed + 1)
    chip = fft_noise(N, 10, 50, seed + 7, 0.5) * 4.0 + fft_noise(N, 50, 200, seed + 8, 0.2) * 1.2
    E = ED + chip                                                   # a ragged, chipped arris
    tn = per_id(ID, n, seed + 2)
    warm = per_id(ID, n, seed + 9)
    mid = fft_noise(N, 6, 30, seed + 3, 0.5); fine = fft_noise(N, 90, 320, seed + 4, 0.1)
    face = fft_noise(N, 16, 70, seed + 10, 0.4)
    pit = np.clip(fft_noise(N, 30, 90, seed + 5, 0.3) * 3 - 1.8, 0, 1)
    rgb = lerp(hexc(a), hexc(b), np.clip(0.5 + 0.4 * tn + 0.3 * mid + 0.18 * face + 0.12 * fine, 0, 1))
    rgb *= (1.0 + 0.05 * warm[..., None] * np.array([1.0, 0.2, -0.8]))
    rgb *= (1.0 - 0.25 * pit)[..., None]
    rgb *= relief(face * 2.5 + fine * 0.6, 0.5)[..., None]
    ao = np.clip(E / 10.0, 0, 1) ** 0.7
    rgb *= (0.7 + 0.3 * ao)[..., None]
    jt = np.clip((3.0 - E) / 2.0, 0, 1)
    rgb = lerp(rgb, hexc(joint) * (1 + 0.2 * fine + 0.1 * mid)[..., None], jt)
    if moss > 0:
        m = np.clip(jt * 0.9 + np.clip(-mid * 1.5 - 0.2, 0, 1) * 0.7, 0, 1) * np.clip(fft_noise(N, 3, 14, seed + 6, 0.6) * 2.4 + 0.2, 0, 1)
        rgb = lerp(rgb, hexc(0x46542e), m * moss)
    img = to_img(rgb).filter(ImageFilter.GaussianBlur(0.6))
    return settle(np.asarray(img).astype(np.float64) / 255.0, 0.9, 0.85)


# ── THE HEDGE (leaves): a clipped hedge / a canopy seen close — overlapping leaves in a few greens, deep shade between the clumps ───
def leaves_layer(rng, count, r_lo, r_hi, cols, alpha, shade=True):
    layer = Image.new('RGBA', (N, N), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    for i in range(count):
        x, y = rng.uniform(0, N), rng.uniform(0, N); r = rng.uniform(r_lo, r_hi); a = rng.uniform(0, np.pi)
        el = rng.uniform(0.38, 0.55)
        c = cols[rng.integers(0, len(cols))] * rng.uniform(0.85, 1.12)
        col = tuple(int(min(1, v) * 255) for v in c) + (alpha,)
        hi = tuple(int(min(1, v * 1.12) * 255) for v in c) + (int(alpha * 0.5),)
        ca, sa = np.cos(a), np.sin(a)
        k = np.linspace(0, 2 * np.pi, 14, endpoint=False)
        px = np.cos(k) * r; py = np.sin(k) * r * el
        pts = np.stack([px * ca - py * sa, px * sa + py * ca], 1)
        def dr(xx, yy, pts=pts, col=col, hi=hi):
            if shade:
                d.polygon([(xx + p[0] + 1.5, yy + p[1] + 2.0) for p in pts], fill=(10, 16, 8, int(col[3] * 0.5)))
            d.polygon([(xx + p[0], yy + p[1]) for p in pts], fill=col)
            d.line([(xx - pts[0][0] * 0.8, yy - pts[0][1] * 0.8), (xx + pts[0][0] * 0.8, yy + pts[0][1] * 0.8)], fill=hi, width=1)
        wrap_strokes(dr, x, y, r_hi + 4)
    return layer


def bake_hedge(seed=131):
    rng = np.random.default_rng(seed)
    clump = fft_noise(N, 4, 14, seed + 1, 0.6)
    base = lerp(hexc(0x141c10), hexc(0x24321a), np.clip(0.5 + 0.6 * clump, 0, 1))
    img = to_img(base).convert('RGBA')
    dark = [hexc(0x22301a), hexc(0x2a3a1f), hexc(0x263420)]
    mid = [hexc(0x34482a), hexc(0x3b5030), hexc(0x405432), hexc(0x36472b)]
    lit = [hexc(0x4c6338), hexc(0x56693c), hexc(0x4a5f3a)]
    img = Image.alpha_composite(img, leaves_layer(rng, 5200, 10, 18, dark, 230))
    img = Image.alpha_composite(img, leaves_layer(rng, 4200, 9, 16, mid, 235))
    img = Image.alpha_composite(img, leaves_layer(rng, 1500, 8, 14, lit, 220))
    rgb = np.asarray(img.convert('RGB').filter(ImageFilter.GaussianBlur(0.6))).astype(np.float64) / 255.0
    rgb *= (0.78 + 0.32 * np.clip(0.5 + 0.7 * clump, 0, 1))[..., None]   # the clumps stand out of their own shade
    return settle(rgb, 0.85, 0.9)


# ── THE ICE: blue-grey sea ice — a frosted skin, pressure cracks, clearer darker patches where it is thick and glassy ─────────────
def bake_ice(seed=141, val=0.8):   # val (the rollout, 11-11): Flash Freeze's ice on a sunlit board read white, so the sheet sits a step lower
    wx = fft_noise(N, 2, 6, seed + 1, 0.8) * 30; wy = fft_noise(N, 2, 6, seed + 2, 0.8) * 30
    F1, F2, ID = worley(N, 5, seed + 3, (wx, wy)); f1b, f2b, _ = worley(N, 13, seed + 4, (wx * 0.5, wy * 0.5))
    macro = fft_noise(N, 1, 5, seed + 5, 0.7); mid = fft_noise(N, 6, 30, seed + 6, 0.5); fine = fft_noise(N, 100, 400, seed + 7, 0.0)
    clear = np.clip(-fft_noise(N, 2, 8, seed + 10, 0.6) * 1.4 + 0.1, 0, 1)
    rgb = lerp(hexc(0x9eaebb), hexc(0xb6c3cc), np.clip(0.5 + 0.35 * mid + 0.3 * macro, 0, 1))
    rgb = lerp(rgb, hexc(0x7d93a1), clear * 0.32)
    crack = np.exp(-((F2 - F1) / 0.02) ** 2) * np.clip(0.5 + fft_noise(N, 3, 12, seed + 8, 0.5) * 1.6, 0, 1)
    crack2 = np.exp(-((f2b - f1b) / 0.02) ** 2) * np.clip(fft_noise(N, 4, 14, seed + 9, 0.5) * 2.2 - 0.3, 0, 1) * 0.6
    c = np.clip(crack + crack2, 0, 1)
    rgb = lerp(rgb, hexc(0x5d7180), c * 0.45)
    rgb = lerp(rgb, hexc(0xc9d3da), np.clip(np.roll(np.roll(c, 2, 0), 2, 1) - c, 0, 1) * 0.35)   # the lit lip beside a crack
    rgb *= (1.0 + 0.025 * fine)[..., None]
    img = to_img(rgb * val).filter(ImageFilter.GaussianBlur(0.7))
    return settle(np.asarray(img).astype(np.float64) / 255.0, 0.9, 0.9)


# ── THE SHIP WOOD: the hull and the bulwarks — wide old boards, dark and weathered, a long grain, tar in the seams ────────────────
def bake_shipwood(seed=151):
    return bake_planks(seed, rows=9, a=0x3a2b20, b=0x54402f)


# ── THE OBSIDIAN: black volcanic glass — conchoidal flakes (cells with a curved sheen), faint grey edges, no glow ────────────────
def bake_obsidian(seed=161):
    wx = fft_noise(N, 2, 6, seed + 1, 0.8) * 50; wy = fft_noise(N, 2, 6, seed + 2, 0.8) * 50
    F1, F2, ID = worley(N, 7, seed + 3, (wx, wy))
    tn = np.random.default_rng(seed + 4).uniform(-1, 1, 49)[ID]
    mid = fft_noise(N, 6, 30, seed + 5, 0.5); fine = fft_noise(N, 100, 400, seed + 6, 0.1)
    swirl = np.sin(F1 * 9.0 * 2 * np.pi + tn * 3) * 0.5 + 0.5                 # the ripple rings of a fracture face
    rgb = lerp(hexc(0x16141a), hexc(0x2a2730), np.clip(0.45 + 0.25 * tn + 0.2 * mid + 0.12 * swirl, 0, 1))
    edge = np.exp(-((F2 - F1) / 0.03) ** 2)
    rgb = lerp(rgb, hexc(0x4a4650), edge * 0.45)
    rgb = lerp(rgb, hexc(0x2e1b18), np.clip(fft_noise(N, 2, 8, seed + 7, 0.6) * 1.5 - 0.4, 0, 1) * 0.35)   # a faint warm cast (Hell)
    rgb *= (1.0 + 0.03 * fine)[..., None]
    img = to_img(rgb).filter(ImageFilter.GaussianBlur(0.6))
    return settle(np.asarray(img).astype(np.float64) / 255.0, 0.9, 0.95)


# ── THE DARK STONE (bricks_3): a temple's dark dressed stone in courses, no moss ─────────────────────────────────────────────────
def bake_darkstone(seed=171):
    return bake_blocks(seed, rows=9, wlo=0.18, whi=0.36, a=0x3f3d3a, b=0x58554f, joint=0x26231f, moss=0.25)


# ── THE METALS (mondo 11-11: "what about like a metal for the spaceship") ─────────────────────────────────────────────────────────
def panel_grid(cols, rows, seed, jitter=0.0):
    """a grid of panels (cols x rows per sheet, optionally split at random): id, edge distance (px), u, v"""
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    cw, rh = N / cols, N / rows
    ci = np.floor(xx / cw).astype(int); ri = np.floor(yy / rh).astype(int)
    u = xx / cw - ci; v = yy / rh - ri
    ID = ri * cols + ci
    ED = np.minimum(np.minimum(u, 1 - u) * cw, np.minimum(v, 1 - v) * rh)
    return ID, ED, u, v, cols * rows


def brushed(seed, along_x=True, k=0.03):
    return aniso_noise(N, 2, 300, seed, k if along_x else 1.0, 1.0 if along_x else k, 0.25)


def bake_deckplate(seed=181, a=0x63666a, b=0x797c80):   # (the rollout, 11-11: a step under his aluminium in value)
    """the spaceship deck: brushed plates two to a square each way, bolted at the corners, scuffed along the walk"""
    ID, ED, u, v, n = panel_grid(2, 2, seed)
    tn = per_id(ID, n, seed + 1)
    dirx = (per_id(ID, n, seed + 2, 0, 1) > 0.5)
    br = np.where(dirx, brushed(seed + 3, True), brushed(seed + 4, False))
    mid = fft_noise(N, 3, 20, seed + 5, 0.6); fine = fft_noise(N, 100, 400, seed + 6, 0.0)
    rgb = lerp(hexc(a), hexc(b), np.clip(0.5 + 0.25 * tn + 0.3 * br + 0.15 * mid, 0, 1))
    scuff = np.clip(fft_noise(N, 6, 40, seed + 7, 0.4) * 2.6 - 1.4, 0, 1)
    rgb = lerp(rgb, rgb * 0.82, scuff * 0.5)
    rgb *= (1.0 + 0.02 * fine)[..., None]
    seam = np.clip(2.4 - ED, 0, 1); lip = np.clip((ED - 2.4) / 3.0, 0, 1) * np.clip((7.0 - ED) / 3.0, 0, 1)
    rgb *= (1.0 + 0.06 * lip)[..., None]
    rgb = lerp(rgb, hexc(0x2a2c2f), seam * 0.85)
    cw = N / 2
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    bolt = np.zeros((N, N))
    for cu in (0.06, 0.94):
        for cv in (0.06, 0.94):
            d = np.sqrt(((u - cu) * cw) ** 2 + ((v - cv) * cw) ** 2)
            bolt = np.maximum(bolt, np.clip(4.5 - d, 0, 1))
    rgb = lerp(rgb, hexc(0x55585c), bolt * 0.8)
    img = to_img(rgb).filter(ImageFilter.GaussianBlur(0.6))
    return settle(np.asarray(img).astype(np.float64) / 255.0, 0.7, 0.85)


def bake_gunmetal(seed=191, a=0x3c4147, b=0x51575e):
    """gunmetal hull panels: big plates in staggered courses, dark seams, a little grime and wear on the edges"""
    ID, ED, U, RW, n = course_cells(N, 4, N * 0.3, N * 0.55, seed + 1)
    tn = per_id(ID, n, seed + 2)
    br = brushed(seed + 3, True, 0.05)
    mid = fft_noise(N, 3, 20, seed + 4, 0.6); fine = fft_noise(N, 100, 400, seed + 5, 0.0)
    rgb = lerp(hexc(a), hexc(b), np.clip(0.5 + 0.3 * tn + 0.18 * br + 0.2 * mid, 0, 1))
    grime = np.clip(np.clip((10 - ED) / 10, 0, 1) * (0.5 + fft_noise(N, 8, 40, seed + 6, 0.5)), 0, 1)
    rgb = lerp(rgb, rgb * 0.75, grime * 0.5)
    wear = np.clip(fft_noise(N, 30, 120, seed + 7, 0.3) * 3 - 2.0, 0, 1) * np.clip((14 - ED) / 14, 0, 1)
    rgb = lerp(rgb, hexc(0x7a7f85), wear * 0.4)
    seam = np.clip(2.6 - ED, 0, 1)
    rgb = lerp(rgb, hexc(0x1c1e21), seam * 0.85)
    rgb *= (1.0 + 0.02 * fine)[..., None]
    img = to_img(rgb).filter(ImageFilter.GaussianBlur(0.6))
    return settle(np.asarray(img).astype(np.float64) / 255.0, 0.8, 0.85)


def bake_rivets(seed=201, a=0x5f6266, b=0x777a7e):
    """riveted plate: four plates a square, a row of rivets along every seam"""
    ID, ED, u, v, n = panel_grid(2, 2, seed)
    tn = per_id(ID, n, seed + 1)
    br = brushed(seed + 2, False, 0.04)
    mid = fft_noise(N, 3, 20, seed + 3, 0.6); fine = fft_noise(N, 100, 400, seed + 4, 0.0)
    rgb = lerp(hexc(a), hexc(b), np.clip(0.5 + 0.3 * tn + 0.2 * br + 0.2 * mid, 0, 1))
    seam = np.clip(2.4 - ED, 0, 1)
    rgb = lerp(rgb, hexc(0x26282b), seam * 0.85)
    cw = N / 2
    # rivets 10 px in from each edge, every 1/12 of the plate
    t = 1.0 / 12
    du = np.minimum(u, 1 - u) * cw; dv = np.minimum(v, 1 - v) * cw
    ru = np.abs(((u / t) % 1) - 0.5) * t * cw; rv = np.abs(((v / t) % 1) - 0.5) * t * cw
    d1 = np.sqrt((du - 11) ** 2 + rv ** 2); d2 = np.sqrt((dv - 11) ** 2 + ru ** 2)
    riv = np.clip(4.2 - np.minimum(d1, d2), 0, 1)
    hl = np.clip(4.2 - np.minimum(np.sqrt((du - 12) ** 2 + (rv + 1) ** 2), np.sqrt((dv - 12) ** 2 + (ru + 1) ** 2)), 0, 1)
    rgb = lerp(rgb, hexc(0x404346), riv * 0.7)
    rgb = lerp(rgb, hexc(0x8c8f93), hl * riv * 0.5)
    rgb *= (1.0 + 0.02 * fine)[..., None]
    img = to_img(rgb).filter(ImageFilter.GaussianBlur(0.6))
    return settle(np.asarray(img).astype(np.float64) / 255.0, 0.75, 0.85)

# ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
#  THE ROLLOUT, BATCH 2 (2026-11-11): the other 27 arenas + the spell ground (plague flesh, crystal, castle walls). Ooze and poison
#  are liquids: three-renderer.js _calmFluidMat draws them the way it draws the calm water, in their own colours.
# ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def _blur(rgb, r):
    return np.asarray(to_img(rgb).filter(ImageFilter.GaussianBlur(r))).astype(np.float64) / 255.0


# ── MARS (mars_2, mars): rust regolith — the moon's dust, pebbles and worn craters in iron oxide, fewer craters ─────────────────
def bake_mars(seed=211):
    return bake_moon(seed, a=0x7a3f24, b=0x95522f, craters=12, grit=(0x8a4c30, 0x9a5838, 0x6c3a24), rocks=(0x6e4433, 0x80503a), sat=0.95)


# ── THE MARS DUST (Mars's floor: his moon_2 under the room's tan): the browner dust the rust rocks stand in ───────────────────
def bake_marsdust(seed=391):
    return bake_moon(seed, a=0x76492e, b=0x8a5a3c, craters=16, grit=(0x82573b, 0x8e6044, 0x6a452f), rocks=(0x6c4a37, 0x7a5541), sat=0.95)


# ── THE VIOLET MOON (the Singularity's floor: his moon_3 under the room's violet 0x5a4a78): the same crater ground, dark blue-violet ─
def bake_moonviolet(seed=419):
    return bake_moon(seed, a=0x231f38, b=0x2e2946, craters=22, grit=(0x2b2642, 0x34304e, 0x1d1a2e), rocks=(0x29243e, 0x312c4a), sat=1.0)


# ── THE CLOUDS (cloud, cloud_2, cloud_thick): a cloud deck seen from above — cumulus heads built of puffs on puffs (big domes, smaller
#    ones riding on them, small curls on top), lit from the north-west, a blue-grey shade down between the heads. A step under white
#    so a unit standing on it still reads. ──────────────────────────────────────────────────────────────────────────────────────
def puffs(rng, h, count, r_lo, r_hi, lift=1.0, gate=None):
    """raise round puffs on the height field h (px): each a dome of radius r sitting at lift x the height under its centre (wraps)"""
    for i in range(count):
        x, y = rng.uniform(0, N, 2)
        if gate is not None and rng.random() > gate[int(y) % N, int(x) % N]:
            continue
        r = rng.uniform(r_lo, r_hi); R = int(np.ceil(r))
        cx, cy = int(x), int(y)
        xs = np.arange(cx - R, cx + R + 1) % N; ys = np.arange(cy - R, cy + R + 1) % N
        dx = np.arange(-R, R + 1) + (cx - x); dy = np.arange(-R, R + 1) + (cy - y)
        d2 = (dy[:, None] ** 2 + dx[None, :] ** 2) / (r * r)
        z = h[cy % N, cx % N] * lift + np.sqrt(np.clip(1 - d2, 0, 1)) * r * 0.8
        sub = h[np.ix_(ys, xs)]
        h[np.ix_(ys, xs)] = np.where(d2 < 1, np.maximum(sub, z), sub)
    return h


def bake_cloud(seed=221, lit=0xeef2f8, mid=0xd6dde8, shade=0xa9b6c9, flat=1.0):   # (Heaven read as dust twice: sampled beside his cloud_2 x the room's 0xeef0ff, 187-199 on screen; this sits there, cool)
    rng = np.random.default_rng(seed)
    gate = np.clip(0.55 + fft_noise(N, 1, 4, seed + 1, 0.6) * 0.9, 0.15, 1)
    h = np.zeros((N, N))
    h = puffs(rng, h, 160, 55, 110, 0.0, gate)
    h = puffs(rng, h, 1300, 24, 50, 0.85, gate)
    h = puffs(rng, h, 1400, 9, 18, 0.95)
    fx = np.fft.fftfreq(N); k = np.exp(-2 * (np.pi * 2.5) ** 2 * (fx[None, :] ** 2 + fx[:, None] ** 2))   # a periodic blur (the sheet still tiles)
    h = np.real(np.fft.ifft2(np.fft.fft2(h) * k)) * flat
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5; gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    nz = 1.0 / np.sqrt(gx * gx + gy * gy + 1.0)
    L = np.array([-0.55, -0.55, 0.63]); L = L / np.linalg.norm(L)
    lam = np.clip((-gx * L[0] - gy * L[1] + L[2]) * nz, 0, 1)
    hn = (h - h.min()) / (h.max() - h.min() + 1e-9)
    ao = np.clip(hn * 1.6, 0, 1) ** 0.6
    rgb = lerp(hexc(shade), hexc(mid), np.clip(ao, 0, 1))
    rgb = lerp(rgb, hexc(lit), np.clip((lam - 0.55) * 2.2, 0, 1) * ao)
    rgb *= (0.9 + 0.1 * lam)[..., None]
    return settle(_blur(rgb, 1.0), 0.9, 0.9)


# ── THE STORM (storm): Saturn's storm deck — the same puffs, low and dark, cold grey ─────────────────────────────────────────────
def bake_storm(seed=231):
    return bake_cloud(seed, lit=0x6a727b, mid=0x535a63, shade=0x363c45, flat=0.6)


# ── THE GRAVEL (dirt_4): brown pebbles packed in earth — every size from grit to fist, a slow drift of darker damp ───────────────
def bake_gravel(seed=241):
    rng = np.random.default_rng(seed)
    macro = fft_noise(N, 1, 5, seed + 1, 0.6); mott = fft_noise(N, 8, 30, seed + 2, 0.5)
    rgb = lerp(hexc(0x3a2c1f), hexc(0x4a3828), np.clip(0.5 + 0.5 * mott + 0.2 * macro, 0, 1))
    img = to_img(rgb).convert('RGBA')
    cols = [hexc(0x7a5f45), hexc(0x6b523b), hexc(0x876c50), hexc(0x786a5c), hexc(0x614f3d), hexc(0x92785c)]
    img = Image.alpha_composite(img, stones(rng, 7000, 1.5, 3.5, cols, 190).filter(ImageFilter.GaussianBlur(0.5)))
    img = Image.alpha_composite(img, stones(rng, 2400, 4.0, 9.0, cols, 235).filter(ImageFilter.GaussianBlur(0.6)))
    img = Image.alpha_composite(img, stones(rng, 700, 9.0, 16.0, cols, 240).filter(ImageFilter.GaussianBlur(0.7)))
    img = Image.alpha_composite(img, stones(rng, 90, 16.0, 26.0, cols, 240).filter(ImageFilter.GaussianBlur(0.8)))
    rgb = np.asarray(img.convert('RGB').filter(ImageFilter.GaussianBlur(0.45))).astype(np.float64) / 255.0
    damp = np.clip(fft_noise(N, 3, 10, seed + 3, 0.7) * 1.6 - 0.4, 0, 1)
    rgb = lerp(rgb, rgb * 0.84, damp * 0.45)
    rgb *= (1.0 + 0.06 * macro)[..., None]
    return settle(rgb, 0.85, 0.85)


# ── THE ROOTS (wasteland): dead dark earth with old roots running through it, leaf litter in the hollows ─────────────────────────
def roots_layer(rng, count, cols, alpha, w_hi=7.0, steps=60):
    layer = Image.new('RGBA', (N, N), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    def grow(x, y, a, w, n, depth):
        for i in range(n):
            a += rng.normal(0, 0.18); L = rng.uniform(5, 10)
            x2, y2 = x + np.cos(a) * L, y + np.sin(a) * L
            c = cols[min(depth, len(cols) - 1)]
            col = tuple(int(v * 255) for v in c) + (alpha,)
            sh = (14, 10, 7, int(alpha * 0.55))
            ww = max(1, int(round(w)))
            def dr(xx, yy, dx=x2 - x, dy=y2 - y, col=col, sh=sh, ww=ww):
                d.line([(xx + 1.5, yy + 2.0), (xx + dx + 1.5, yy + dy + 2.0)], fill=sh, width=ww + 1)
                d.line([(xx, yy), (xx + dx, yy + dy)], fill=col, width=ww)
            wrap_strokes(dr, x % N, y % N, 40)
            x, y = x2, y2; w *= 0.985
            if depth < 3 and rng.random() < 0.06:
                grow(x, y, a + rng.choice([-1, 1]) * rng.uniform(0.5, 1.1), w * 0.6, int(n * 0.45), depth + 1)
            if w < 1.0:
                break
    for i in range(count):
        grow(rng.uniform(0, N), rng.uniform(0, N), rng.uniform(0, 2 * np.pi), rng.uniform(w_hi * 0.5, w_hi), steps, 0)
    return layer


def bake_roots(seed=251):
    rng = np.random.default_rng(seed)
    macro = fft_noise(N, 1, 5, seed + 1, 0.6); mott = fft_noise(N, 8, 30, seed + 2, 0.5); grit = fft_noise(N, 120, 400, seed + 3, 0.0)
    rgb = lerp(hexc(0x2a211b), hexc(0x3a2e25), np.clip(0.5 + 0.5 * mott + 0.2 * macro, 0, 1))
    rgb *= (1.0 + 0.06 * grit)[..., None]
    litter = np.clip(fft_noise(N, 6, 24, seed + 4, 0.5) * 2.0 - 0.6, 0, 1)
    rgb = lerp(rgb, hexc(0x4a2c20), litter * 0.4)
    img = to_img(rgb).convert('RGBA')
    img = Image.alpha_composite(img, stones(rng, 2600, 1.0, 2.6, [hexc(0x3a2f27), hexc(0x30261f), hexc(0x47372b)], 160).filter(ImageFilter.GaussianBlur(0.5)))
    img = Image.alpha_composite(img, roots_layer(rng, 14, [hexc(0x5e4a38), hexc(0x56442f), hexc(0x4c3c2c), hexc(0x433527)], 240, 15.0, 80).filter(ImageFilter.GaussianBlur(1.0)))
    img = Image.alpha_composite(img, stones(rng, 160, 4.0, 10.0, [hexc(0x55473b), hexc(0x4a3e33)], 225).filter(ImageFilter.GaussianBlur(0.6)))
    rgb = np.asarray(img.convert('RGB').filter(ImageFilter.GaussianBlur(0.45))).astype(np.float64) / 255.0
    return settle(rgb, 0.85, 0.95)


# ── THE ROCKY GRASS (grass_rocky): the meadow with grey stones breaking through it, grass growing over their edges ──────────────
def bake_rockygrass(seed=261):
    rng = np.random.default_rng(seed)
    img = to_img(bake_grass(seed)).convert('RGBA')
    cols = [hexc(0x5f605a), hexc(0x6b6b64), hexc(0x56574f), hexc(0x737168)]
    img = Image.alpha_composite(img, stones(rng, 16, 40, 75, cols, 245).filter(ImageFilter.GaussianBlur(1.2)))
    img = Image.alpha_composite(img, stones(rng, 70, 16, 34, cols, 240).filter(ImageFilter.GaussianBlur(0.9)))
    img = Image.alpha_composite(img, stones(rng, 260, 5, 12, cols, 230).filter(ImageFilter.GaussianBlur(0.6)))
    img = Image.alpha_composite(img, blades(rng, 7000, 4, 11, [hexc(0x3a4d24), hexc(0x46592c), hexc(0x52622f), hexc(0x33421f)], 0.45, 1))
    rgb = np.asarray(img.convert('RGB').filter(ImageFilter.GaussianBlur(0.4))).astype(np.float64) / 255.0
    return settle(rgb, 0.95, 0.9)


# ── THE DARK GRASS (grass_dark_fantasy): a haunted moor — dark moss-green turf going to mud in patches ───────────────────────────
def bake_darkgrass(seed=271):
    rgb = bake_grass(seed)
    L = lum(rgb)[..., None]
    rgb = L + (rgb - L) * 0.7
    rgb = rgb * np.array([0.78, 0.8, 0.72])
    mud = np.clip(fft_noise(N, 2, 8, seed + 1, 0.6) * 2.4 - 0.2, 0, 1) * np.clip(0.7 + fft_noise(N, 20, 70, seed + 2, 0.4), 0, 1)
    mudc = lerp(hexc(0x3a3226), hexc(0x4a4031), np.clip(0.5 + fft_noise(N, 30, 120, seed + 3, 0.3), 0, 1))
    rgb = lerp(rgb, mudc, np.clip(mud, 0, 1) * 0.85)
    return settle(_blur(rgb, 0.4), 0.9, 0.9)


# ── THE CAVE FLOOR (cave_floor): a dark cave bed, plum-brown plates of rock, grit, a rare blue crystal chip catching the light ────
def bake_cavefloor(seed=281):
    rng = np.random.default_rng(seed)
    wx = fft_noise(N, 2, 6, seed + 1, 0.8) * 40; wy = fft_noise(N, 2, 6, seed + 2, 0.8) * 40
    F1, F2, ID = worley(N, 7, seed + 3, (wx, wy))
    tone = np.random.default_rng(seed + 4).uniform(-1, 1, 49)[ID]
    mid = fft_noise(N, 8, 30, seed + 5, 0.5); fine = fft_noise(N, 80, 300, seed + 6, 0.1)
    rgb = lerp(hexc(0x271f24), hexc(0x3a2f33), np.clip(0.5 + 0.22 * tone + 0.25 * mid + 0.1 * fine, 0, 1))
    rgb *= (0.88 + 0.12 * np.clip((F2 - F1) / 0.3, 0, 1) ** 0.6)[..., None]
    crack = np.exp(-((F2 - F1) / 0.025) ** 2) * np.clip(0.5 + fft_noise(N, 3, 12, seed + 7, 0.5) * 1.8, 0, 1)
    rgb *= (1.0 - 0.45 * crack)[..., None]
    img = to_img(rgb).convert('RGBA')
    img = Image.alpha_composite(img, stones(rng, 3200, 1.0, 2.8, [hexc(0x2e2529), hexc(0x3a3034), hexc(0x433a3c)], 170).filter(ImageFilter.GaussianBlur(0.5)))
    img = Image.alpha_composite(img, stones(rng, 160, 3.0, 7.0, [hexc(0x3b3236), hexc(0x463c3f)], 215).filter(ImageFilter.GaussianBlur(0.6)))
    img = Image.alpha_composite(img, stones(rng, 26, 1.4, 3.0, [hexc(0x5d7f9a), hexc(0x6f93ad)], 230).filter(ImageFilter.GaussianBlur(0.4)))
    rgb = np.asarray(img.convert('RGB').filter(ImageFilter.GaussianBlur(0.45))).astype(np.float64) / 255.0
    return settle(rgb, 0.85, 0.85)


# ── THE DARK ROCK (cave_wall, rock_wall_2, rocks_1, rocks_dark_fantasy): the rock face in the dark — the same fractured plates, deeper ─
def bake_darkrock(seed=291):
    wx = fft_noise(N, 2, 6, seed + 1, 0.8) * 46; wy = fft_noise(N, 2, 6, seed + 2, 0.8) * 46
    _, _, ID = worley(N, 6, seed + 3, (wx, wy))                      # bake_rock's own plates
    warm = np.random.default_rng(seed + 40).uniform(-1, 1, 36)[ID]
    rgb = bake_rock(seed) * np.array([0.7, 0.69, 0.68])
    rgb *= (1.0 + 0.12 * warm[..., None] * np.array([1.0, 0.45, -0.5]))
    return settle(_blur(rgb, 0.4), 1.0, 1.0)


# ── THE CRYSTAL (crystal): a bed of blue crystal — flat facets, each its own tilt to the light, bright only along a few edges ─────
def bake_crystal(seed=301):
    wx = fft_noise(N, 2, 6, seed + 1, 0.8) * 26; wy = fft_noise(N, 2, 6, seed + 2, 0.8) * 26
    g = 8
    F1, F2, ID = worley(N, g, seed + 3, (wx, wy))
    f1b, f2b, idb = worley(N, 19, seed + 4, (wx * 0.5, wy * 0.5))
    r = np.random.default_rng(seed + 5)
    nx = r.uniform(-1, 1, g * g)[ID]; ny = r.uniform(-1, 1, g * g)[ID]
    r2 = np.random.default_rng(seed + 6)
    nxb = r2.uniform(-1, 1, 19 * 19)[idb]; nyb = r2.uniform(-1, 1, 19 * 19)[idb]
    shade = np.clip(0.5 + 0.3 * (-(nx + ny) * 0.7071) + 0.15 * (-(nxb + nyb) * 0.7071), 0, 1)   # each facet's tilt toward the light
    mid = fft_noise(N, 4, 20, seed + 7, 0.6); fine = fft_noise(N, 80, 300, seed + 8, 0.1)
    rgb = lerp(hexc(0x2b3e55), hexc(0x5a7896), np.clip(shade + 0.15 * mid, 0, 1))
    deep = np.clip(-fft_noise(N, 2, 7, seed + 9, 0.6) * 1.4, 0, 1)
    rgb = lerp(rgb, hexc(0x1f2c40), deep * 0.4)
    edge = np.exp(-((F2 - F1) / 0.018) ** 2) * np.clip(0.3 + fft_noise(N, 3, 12, seed + 10, 0.5) * 1.6, 0, 1)
    edgeb = np.exp(-((f2b - f1b) / 0.02) ** 2) * 0.4
    rgb = lerp(rgb, hexc(0x8fb0c9), np.clip(edge * 0.55 + edgeb * 0.25, 0, 1))
    rgb *= (1.0 + 0.03 * fine)[..., None]
    return settle(_blur(rgb, 0.7), 0.85, 0.9)


# ── THE FLESH (flesh, flesh_2 = plague_flesh, flesh_3): a wet growth of muscle — dark red lobes, purple veins between them, a few
#    pale cysts, a dull wet sheen on the rises. Grim, not loud. ──────────────────────────────────────────────────────────────────
def bake_flesh(seed=311):
    rng = np.random.default_rng(seed)
    wx = fft_noise(N, 2, 6, seed + 1, 0.8) * 50; wy = fft_noise(N, 2, 6, seed + 2, 0.8) * 50
    F1, F2, ID = worley(N, 9, seed + 3, (wx, wy))
    f1b, f2b, _ = worley(N, 22, seed + 4, (wx * 0.6, wy * 0.6))
    tone = np.random.default_rng(seed + 5).uniform(-1, 1, 81)[ID]
    lobe = np.sqrt(np.clip(1 - (F1 / 0.9) ** 2, 0, 1))
    h = lobe + np.sqrt(np.clip(1 - (f1b / 0.8) ** 2, 0, 1)) * 0.35 + fft_noise(N, 20, 90, seed + 6, 0.3) * 0.12
    striate = aniso_noise(N, 20, 200, seed + 7, 0.2, 1.5, 0.3)
    rgb = lerp(hexc(0x4a1a1a), hexc(0x6e2a26), np.clip(0.5 + 0.25 * tone + 0.35 * (h - 0.6) + 0.08 * striate, 0, 1))
    vein = np.exp(-((F2 - F1) / 0.05) ** 2) + np.exp(-((f2b - f1b) / 0.04) ** 2) * 0.5
    rgb = lerp(rgb, hexc(0x2e1220), np.clip(vein, 0, 1) * 0.7)
    rgb *= relief(h * 18.0, 0.45)[..., None]
    sheen = np.clip(relief(h * 18.0, 1.0) - 1.08, 0, 1) * 2.0
    rgb = lerp(rgb, hexc(0x9a5a52), np.clip(sheen, 0, 1) * 0.35)
    img = to_img(rgb).convert('RGBA')
    img = Image.alpha_composite(img, stones(rng, 40, 4.0, 9.0, [hexc(0x8a6b4c), hexc(0x7d5d42), hexc(0x957454)], 215).filter(ImageFilter.GaussianBlur(1.2)))
    rgb = np.asarray(img.convert('RGB').filter(ImageFilter.GaussianBlur(0.6))).astype(np.float64) / 255.0
    return settle(rgb, 0.85, 0.9)


# ── THE CONCRETE (concrete_floor, urban_street): poured concrete — fine pores, trowel clouds, stains, a few hairline cracks ──────
def bake_concrete(seed=321):
    wx = fft_noise(N, 2, 6, seed + 1, 0.8) * 30; wy = fft_noise(N, 2, 6, seed + 2, 0.8) * 30
    F1, F2, _ = worley(N, 4, seed + 3, (wx, wy))
    macro = fft_noise(N, 1, 5, seed + 4, 0.6); trowel = fft_noise(N, 4, 20, seed + 5, 0.6); fine = fft_noise(N, 100, 400, seed + 6, 0.0)
    rgb = lerp(hexc(0x55534f), hexc(0x67645f), np.clip(0.5 + 0.35 * trowel + 0.3 * macro, 0, 1))
    stain = np.clip(fft_noise(N, 3, 16, seed + 7, 0.6) * 2.2 - 0.9, 0, 1)
    rgb = lerp(rgb, rgb * np.array([0.82, 0.8, 0.78]), stain * 0.6)
    pore = np.clip(fft_noise(N, 150, 450, seed + 8, 0.0) * 3.5 - 2.4, 0, 1)
    rgb *= (1.0 - 0.25 * pore)[..., None]
    rgb *= (1.0 + 0.04 * fine)[..., None]
    crack = np.exp(-((F2 - F1) / 0.012) ** 2) * np.clip(fft_noise(N, 3, 10, seed + 9, 0.5) * 2.6 - 0.6, 0, 1)
    rgb = lerp(rgb, hexc(0x34322f), crack * 0.55)
    return settle(_blur(rgb, 0.5), 0.8, 0.85)


# ── THE GILT (gold, gold_2, gold_3): Olympus's gold — hammered leaf on stone, a soft tarnish, never a mirror ─────────────────────
def bake_gilt(seed=331):
    wx = fft_noise(N, 2, 6, seed + 1, 0.8) * 20; wy = fft_noise(N, 2, 6, seed + 2, 0.8) * 20
    F1, _, _ = worley(N, 26, seed + 3, (wx, wy))
    dent = np.sqrt(np.clip(1 - (F1 / 0.9) ** 2, 0, 1))
    macro = fft_noise(N, 1, 5, seed + 4, 0.6); mid = fft_noise(N, 6, 30, seed + 5, 0.5); fine = fft_noise(N, 100, 400, seed + 6, 0.0)
    rgb = lerp(hexc(0x86621e), hexc(0xb38a35), np.clip(0.5 + 0.45 * macro + 0.25 * mid, 0, 1))
    rgb *= relief(dent * 10.0, 0.25)[..., None]
    sheen = np.clip(fft_noise(N, 2, 8, seed + 8, 0.7) * 1.8 - 0.3, 0, 1)
    rgb = lerp(rgb, hexc(0xc7a24c), sheen * 0.35)
    tarn = np.clip(fft_noise(N, 3, 14, seed + 7, 0.6) * 2.0 - 0.8, 0, 1)
    rgb = lerp(rgb, hexc(0x6a5226), tarn * 0.3)
    rgb *= (1.0 + 0.025 * fine)[..., None]
    return settle(_blur(rgb, 0.6), 0.95, 0.9)


# ── THE FLAGSTONES (bricks_1): square grey slabs four to a square each way, chipped arrises, moss in the joints ──────────────────
def bake_flagstone(seed=341, a=0x56534c, b=0x6f6b62, joint=0x302d27, moss=0.7):
    ID, ED, u, v, n = panel_grid(4, 4, seed)
    chip = fft_noise(N, 10, 50, seed + 1, 0.5) * 3.0 + fft_noise(N, 50, 200, seed + 2, 0.2) * 1.0
    E = ED + chip
    tn = per_id(ID, n, seed + 3); warm = per_id(ID, n, seed + 4)
    mid = fft_noise(N, 6, 30, seed + 5, 0.5); face = fft_noise(N, 16, 70, seed + 6, 0.4); fine = fft_noise(N, 90, 320, seed + 7, 0.1)
    rgb = lerp(hexc(a), hexc(b), np.clip(0.5 + 0.35 * tn + 0.25 * mid + 0.15 * face + 0.1 * fine, 0, 1))
    rgb *= (1.0 + 0.05 * warm[..., None] * np.array([1.0, 0.2, -0.8]))
    rgb *= relief(face * 2.0 + fine * 0.5, 0.5)[..., None]
    rgb *= (0.78 + 0.22 * np.clip(E / 10.0, 0, 1) ** 0.7)[..., None]
    jt = np.clip((4.0 - E) / 2.5, 0, 1)
    rgb = lerp(rgb, hexc(joint), jt)
    m = np.clip(jt * 0.9 + np.clip(-mid * 1.5 - 0.3, 0, 1) * 0.5, 0, 1) * np.clip(fft_noise(N, 3, 14, seed + 8, 0.6) * 2.4 + 0.3, 0, 1)
    rgb = lerp(rgb, hexc(0x46542e), m * moss)
    return settle(_blur(rgb, 0.6), 0.85, 0.85)


# ── THE SANDSTONE FLAGS (Babel's floor: his bricks_1 under the room's tan): the flagstones in a warm sandstone ─────────────────
def bake_sandstone(seed=401):
    return bake_flagstone(seed, a=0x70502e, b=0x865e38, joint=0x3a2816, moss=0.25)   # his bricks_1 x the room's 0xd8a878 = 93/69/43


# ── THE CASTLE BRICK (bricks_2, castle_wall): small weathered bricks in courses, brown-grey, moss in the joints ──────────────────
def bake_castle(seed=351):
    return bake_blocks(seed, rows=11, wlo=0.11, whi=0.2, a=0x5c5444, b=0x7a6f5b, joint=0x332d24, moss=1.0)   # his value (L ~0.36): a wall face is in shade more often than not


# ── THE CHECKER (checkerboard): polished marble checks, six to a square each way (his count), cream and black, faint veins ───────
def bake_checker(seed=361):
    ID, ED, u, v, n = panel_grid(6, 6, seed)
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    par = ((np.floor(xx / (N / 6)) + np.floor(yy / (N / 6))) % 2).astype(bool)
    light = bake_marble(seed + 1, a=0x8e887d, b=0x9d978b, vein_col=0x6e695f)
    dark = bake_marble(seed + 2, a=0x232120, b=0x2e2b29, vein_col=0x47423d)
    rgb = np.where(par[..., None], dark, light)
    tn = per_id(ID, n, seed + 3)
    rgb *= (1.0 + 0.04 * tn)[..., None]
    seam = np.clip(1.6 - ED, 0, 1)
    rgb = lerp(rgb, hexc(0x1a1918), seam * 0.6)
    return settle(_blur(rgb, 0.5), 0.9, 1.0)


# ── THE DAMASK (damask): the lodge's wallpaper — a mirrored flower in a half-drop repeat, tone on tone in a deep red, a faint sheen ─
def bake_damask(seed=371, cols=3, rows=2):
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    cw, rh = N / cols, N / rows
    def motif(ox, oy):
        U = ((xx - ox) / cw) % 1.0; V = ((yy - oy) / rh) % 1.0
        x = np.abs(U - 0.5) * 2.0; y = V * 2.0 - 1.0                              # x 0..1 from the axis (the mirror), y -1..1
        M = 256
        tex = fft_noise(M, 3, 9, seed + 1, 0.6) + fft_noise(M, 9, 22, seed + 2, 0.4) * 0.45
        tx = (x * 0.5 * (M - 1)).astype(int); ty = ((y * 0.5 + 0.5) * (M - 1)).astype(int)
        f = tex[ty, tx]
        env = np.clip(1.0 - (x * 1.15 + np.abs(y) * 1.0), 0, 1)                   # a diamond the flower lives in
        return np.clip((f * 0.9 + env * 1.6 - 0.4) * 5.0, 0, 1) * np.clip(env * 6.0, 0, 1)
    a = motif(0.0, 0.0); b = motif(cw * 0.5, rh * 0.5)
    m = np.clip(a + b, 0, 1)
    m = _blur(np.repeat(m[..., None], 3, -1), 1.2)[..., 0]
    fine = fft_noise(N, 100, 400, seed + 3, 0.0); macro = fft_noise(N, 1, 5, seed + 4, 0.6)
    rgb = lerp(hexc(0x5a2325), hexc(0x86433d), m * 0.95)   # (a lodge wall stands in shade: a step over the first bake)
    rgb = lerp(rgb, hexc(0x6d4a2c), np.clip(m - 0.85, 0, 1) * 0.6)                 # the flower's raised heart, a little gold
    rgb *= (1.0 + 0.04 * macro + 0.02 * fine)[..., None]
    return settle(_blur(rgb, 0.5), 0.95, 0.95)


# ── THE CARPET (carpet_4): the Vatican nave's runner — deep red wool pile, a faint lattice woven into it ──────────────────────────
def bake_carpet(seed=381):
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    pile = fft_noise(N, 150, 480, seed + 1, 0.0); tuft = fft_noise(N, 40, 140, seed + 2, 0.3); macro = fft_noise(N, 1, 6, seed + 3, 0.6)
    k = 4
    d1 = np.abs(((xx + yy) / N * k) % 1.0 - 0.5); d2 = np.abs(((xx - yy) / N * k) % 1.0 - 0.5)
    lat = np.exp(-((0.5 - np.maximum(d1, d2)) / 0.02) ** 2) * 0 + np.exp(-(d1 / 0.025) ** 2) + np.exp(-(d2 / 0.025) ** 2)
    rgb = lerp(hexc(0x4a1517), hexc(0x5e1d1e), np.clip(0.5 + 0.3 * macro + 0.2 * tuft, 0, 1))
    rgb = lerp(rgb, hexc(0x6b4a2a), np.clip(lat, 0, 1) * 0.35)
    rgb *= (1.0 + 0.07 * pile)[..., None]
    wear = np.clip(fft_noise(N, 2, 8, seed + 4, 0.6) * 2.0 - 0.8, 0, 1)
    rgb = lerp(rgb, rgb * np.array([0.9, 0.85, 0.85]) + 0.02, wear * 0.4)
    return settle(_blur(rgb, 0.45), 0.9, 0.95)


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
    # the file each sheet ships as (data.js CALM_TERRAIN.sheets); a new bake of a shipped sheet = a new _N name, never the same file
    makers = [('calm_grass_1', bake_grass), ('calm_dirt_1', bake_dirt), ('calm_rock_1', bake_rock), ('calm_lava_1', bake_lava), ('calm_scorched_1', bake_scorched),
              # THE ROLLOUT batch 1 (2026-11-11): the demo arenas' sheets + the spaceship metal
              ('calm_marble_1', bake_marble), ('calm_snow_1', bake_snow), ('calm_ice_1', bake_ice), ('calm_hedge_1', bake_hedge),
              ('calm_cobble_1', bake_cobble), ('calm_darkstone_1', bake_darkstone), ('calm_planks_1', bake_planks), ('calm_shipwood_1', bake_shipwood),
              ('calm_obsidian_1', bake_obsidian), ('calm_deckplate_1', bake_deckplate), ('calm_gunmetal_1', bake_gunmetal), ('calm_rivets_1', bake_rivets),
              # THE ROLLOUT batch 2 (2026-11-11): the other 27 arenas + the spell ground
              ('calm_sand_1', bake_sand), ('calm_sand_beach_1', lambda: bake_sand(beach=True)), ('calm_moon_1', bake_moon), ('calm_mars_1', bake_mars),
              ('calm_cloud_1', bake_cloud), ('calm_storm_1', bake_storm), ('calm_gravel_1', bake_gravel), ('calm_roots_1', bake_roots),
              ('calm_rockygrass_1', bake_rockygrass), ('calm_darkgrass_1', bake_darkgrass), ('calm_cavefloor_1', bake_cavefloor), ('calm_darkrock_1', bake_darkrock),
              ('calm_crystal_1', bake_crystal), ('calm_flesh_1', bake_flesh), ('calm_concrete_1', bake_concrete), ('calm_gilt_1', bake_gilt),
              ('calm_flagstone_1', bake_flagstone), ('calm_castle_1', bake_castle), ('calm_checker_1', bake_checker), ('calm_damask_1', bake_damask),
              ('calm_carpet_1', bake_carpet), ('calm_marsdust_1', bake_marsdust), ('calm_sandstone_1', bake_sandstone),
              ('calm_moonviolet_1', bake_moonviolet)]
    os.makedirs(out, exist_ok=True)
    sheets = []
    for name, fn in makers:
        if only and name not in only:
            continue
        rgb = fn()
        stats(name, rgb)
        to_img(rgb).save(os.path.join(out, name + '.png'), optimize=True)
        sheets.append((name, rgb))
    # preview: each sheet 2x2 at half size (a seam shows if a sheet does not tile) + a 1:1 corner
    prev = Image.new('RGB', (len(sheets) * 1024, 1536))
    for i, (name, rgb) in enumerate(sheets):
        im = to_img(rgb)
        sm = im.resize((512, 512), Image.LANCZOS)
        for ox in (0, 512):
            for oy in (0, 512):
                prev.paste(sm, (i * 1024 + ox, oy))
        prev.paste(im.crop((0, 0, 1024, 512)), (i * 1024, 1024))
    prev.save(os.path.join(out, 'calm_sheets.png'))


if __name__ == '__main__':
    main()
