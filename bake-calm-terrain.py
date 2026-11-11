#!/usr/bin/env python3
"""bake-calm-terrain.py — THE CALM GROUND test sheets (2026-11-11, the Fairy Forest Arena (Calm) test map).

mondo 11-11: "the terrain pixel sprites are a little busy and distract from the 3d models on the board ... make grass look like
actual grass from a AAA RPG game ... more realistic, but also less busy". Riot's VFX style guide (2017, section III, p.13-14):
the ENVIRONMENT value range sits lowest, the CHARACTER range above it; p.19: the environment's saturation range is the lowest
too. These sheets are made for that: low value, low saturation, low local contrast, no pixel-art edges.

Made here from code (numpy + PIL), nothing downloaded: periodic FFT noise (tiles by construction) + drawn grass blades /
pebbles / cracks. One sheet = one 3.5 m battle square (the game's ONE SPRITE PER SQUARE), 1024 px (~290 px per metre).

  python3 -I bake-calm-terrain.py <out dir>          writes calm_grass.png, calm_dirt.png, calm_rock.png (+ calm_sheets.png preview)

Upload: node sync-zip.js --put <out>/calm_grass.png Assets/world/terrain/calm/calm_grass.png  (and the other two).
The game reads them from three-renderer.js THE CALM GROUND (_CALM_SHEETS), only on a map whose entry wears look: 'calm'.
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


# ── THE LAVA (v2, 2026-11-11, mondo on v1: "doesnt really look lava-y ... all brown instead of orange/red/fiery"): molten rock
#    with rafts of cooling crust floating on it. The rafts are cellular plates pulled back from their seams by a width that changes
#    across the sheet (wide molten rivers in places, tight cracks in others), some cells are open pools, each raft has a red-hot rim
#    and a dark basalt top; the melt runs red -> orange -> yellow, hottest in the middle of a channel, streaked along the flow.
#    The game's shader slides two copies of this sheet (THE CALM GROUND's lava); the melt glows from the sheet's own colour. ──────
def bake_lava(seed=41):
    rng = np.random.default_rng(seed)
    wx = fft_noise(N, 2, 7, seed + 1, 0.8) * 70; wy = fft_noise(N, 2, 7, seed + 2, 0.8) * 70
    F1, F2, ID = worley(N, 6, seed + 3, (wx, wy))
    fine = fft_noise(N, 60, 260, seed + 5, 0.2)
    mid = fft_noise(N, 8, 30, seed + 6, 0.6)
    gap = F2 - F1
    # the river width: 0.03 (a crack) to 0.17 (a river), and a fifth of the cells open pools
    w0 = 0.03 + 0.14 * np.clip(fft_noise(N, 1, 4, seed + 7, 0.8) * 1.6 + 0.45, 0, 1) ** 1.5
    pool = (np.random.default_rng(seed + 8).uniform(0, 1, 6 * 6) < 0.2)[ID]
    raft = np.clip((gap - w0) / 0.025, 0, 1) * (~pool)
    d_in = np.clip((gap - w0) / 0.06, 0, 1)                       # 0 at a raft's rim -> 1 inside it
    d_out = np.clip((w0 - gap) / np.maximum(w0, 0.03), 0, 1)       # 0 at a raft's rim -> 1 in the middle of a channel
    d_out = np.where(pool, 1.0, d_out)
    tone = np.random.default_rng(seed + 9).uniform(-1, 1, 6 * 6)[ID]
    crust = lerp(hexc(0x17120f), hexc(0x2e2520), np.clip(0.5 + 0.3 * tone + 0.25 * mid + 0.2 * fine, 0, 1))
    crust = lerp(hexc(0x7a1a06), crust, np.clip(d_in ** 0.6, 0, 1))  # the red-hot rim
    # the melt: streaked along the flow (stretched noise), hotter toward a channel's middle
    sx = np.asarray(Image.fromarray(((fft_noise(N, 10, 40, seed + 10, 0.5) * 0.5 + 0.5) * 255).astype(np.uint8)).resize((N, N // 4)).resize((N, N), Image.BICUBIC)).astype(np.float64) / 255.0 - 0.5
    heat = np.clip(0.16 + 0.6 * d_out ** 0.8 + 0.55 * sx + 0.15 * fine, 0, 1)
    def ramp(t):
        c0, c1, c2, c3 = hexc(0x5a0c02), hexc(0xc22a05), hexc(0xff6a0e), hexc(0xffc04a)
        t = np.clip(t, 0, 1)[..., None]
        return np.where(t < 0.35, c0 + (c1 - c0) * (t / 0.35), np.where(t < 0.75, c1 + (c2 - c1) * ((t - 0.35) / 0.4), c2 + (c3 - c2) * ((t - 0.75) / 0.25)))
    melt = ramp(heat)
    # a cooling skin on the melt: thin darker veins (a finer cell net) that fade in the hottest middles
    g1, g2, _ = worley(N, 16, seed + 11, (wx * 0.4, wy * 0.4))
    skin = np.exp(-((g2 - g1) / 0.022) ** 2) * np.clip(1.0 - heat * 0.9, 0, 1)
    melt *= (1.0 - 0.45 * skin)[..., None]
    rgb = lerp(melt, crust, raft)
    img = to_img(rgb).filter(ImageFilter.GaussianBlur(0.7))
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


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
    makers = [('calm_grass', bake_grass), ('calm_dirt', bake_dirt), ('calm_rock', bake_rock), ('calm_lava', bake_lava), ('calm_scorched', bake_scorched)]
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
