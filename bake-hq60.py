#!/usr/bin/env python3
"""bake-hq60.py (2026-11-26, mondo: "not a fan of this red wall paper, we are going for the vintage 1960s office retro
campy scifi, like 2001 a space odyssey spaceship meets the headquarters in the TV show Danger 5").

Draws THE SIXTIES SHEETS for DOOR HQ in code (original designs, no photo, no AI): seamless 1024 px PNGs that the HQ
shell wears through data.js DOOR_HQ.textures (R2 Assets/world/hq/textures/<file>). Look book:
docs/plans/door-hq-2/LOOK_BOOK.md "THE SIXTIES REFIT".

    python3 -I bake-hq60.py <out dir>          # then: node sync-zip.js --put <file> Assets/world/hq/textures/<file> ...

Every sheet tiles both ways. A sheet's size in metres is set by the shell that wears it (a drum wall = 3.2 m square,
a dado = 2.2 m wide), so the panel counts below are drawn for those.
"""
import sys, os, math
import numpy as np
from PIL import Image, ImageFilter

N = 1024
rng = np.random.default_rng(1960)


def noise(scale, amp, seed):
    """seamless value noise: a small random grid, tiled and blown up"""
    r = np.random.default_rng(seed)
    g = r.random((scale, scale)).astype(np.float32)
    im = Image.fromarray((g * 255).astype(np.uint8)).resize((N, N), Image.BICUBIC)
    # wrap-safe: blur a 3x3 tiling and take the middle
    big = Image.new('L', (N * 3, N * 3))
    for i in range(3):
        for j in range(3):
            big.paste(im, (i * N, j * N))
    big = big.filter(ImageFilter.GaussianBlur(N / scale / 2))
    a = np.asarray(big, dtype=np.float32)[N:2 * N, N:2 * N] / 255.0
    return (a - a.mean()) * amp


def fine(amp, seed):
    r = np.random.default_rng(seed)
    return (r.random((N, N)).astype(np.float32) - 0.5) * amp


def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)


def save(arr, path):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGB').save(path, optimize=True)
    print(path, os.path.getsize(path))


def rrect_sdf(x, y, cx, cy, hw, hh, r):
    qx = np.abs(x - cx) - (hw - r)
    qy = np.abs(y - cy) - (hh - r)
    return np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r


yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)


def panel_wall():
    """2001 white: moulded off-white panels, two a sheet (1.6 m wide, 3.2 m tall), soft recessed seams and a bevel"""
    base = hexrgb('#ECE7DA')
    col = np.zeros((N, N, 3), np.float32) + base
    shade = np.zeros((N, N), np.float32)
    pw = N / 2
    for k in range(3):   # k=2 wraps the seam at the right edge
        cx = pw * k
        d = rrect_sdf(xx, yy, cx, N / 2, pw / 2 - 10, N / 2 - 10, 46)
        # the seam (outside the panel) is dark; a bevel band just inside it is lit from the top-left
        seam = np.clip(1 - np.abs(d + 2) / 7, 0, 1)
        shade -= seam * 0.42
        inner = (d < 0) & (d > -26)
        gx = np.sign(xx - cx) ; gy = np.sign(yy - N / 2)
        shade += np.where(inner, (-gx * 0.05 - gy * 0.07) * (1 + d / 26), 0)
    # the horizontal seam at the sheet's top / bottom (panels stack)
    for y0 in (0, N):
        shade -= np.clip(1 - np.abs(yy - y0) / 6, 0, 1) * 0.42
    gloss = 0.04 * np.cos((yy / N) * 2 * math.pi)   # a soft sheen down each panel
    n = noise(8, 0.035, 11) + fine(0.018, 12)
    f = 1 + shade + gloss + n
    return col * f[..., None]


def teak_slats():
    """Danger 5 teak: vertical slats (8 a 2.2 m sheet), warm grain, dark reveals between"""
    out = np.zeros((N, N, 3), np.float32)
    w = N / 8
    r = np.random.default_rng(7)
    grain_n = noise(64, 1.0, 21)
    for s in range(8):
        x0 = int(s * w); x1 = int((s + 1) * w)
        tone = hexrgb('#8E4F25') * (0.9 + r.random() * 0.2)
        xs = np.arange(x0, x1)
        # grain: fine straight lines running down the slat, a slow drift and a few darker streaks (no cartoon waves)
        ph = r.random() * 50
        xl = xx[:, x0:x1]; yl = yy[:, x0:x1]
        drift = 2.5 * np.sin(yl / N * 2 * math.pi + ph) + grain_n[:, x0:x1] * 3
        lines = np.sin((xl + drift) * (0.9 + 0.3 * r.random()) + ph)
        streak = np.clip(np.sin((xl + drift) * 0.13 + ph * 2), 0.6, 1) - 0.6
        g = 0.93 + 0.05 * lines - 0.35 * streak + noise(48, 0.06, 40 + s)[:, x0:x1] + fine(0.04, 30 + s)[:, x0:x1]
        out[:, x0:x1] = tone * g[..., None]
        # the reveal + a lit edge
        out[:, x0:x0 + 6] *= 0.32
        out[:, x0 + 6:x0 + 9] *= 1.18
        out[:, x1 - 4:x1] *= 0.7
    return out


def light_ceiling():
    """2001 ceiling: a grid of lit white panels in a light grey frame (4 x 4 a sheet)"""
    cell = N / 4
    lx = (xx % cell) / cell; ly = (yy % cell) / cell
    d = np.minimum(np.minimum(lx, 1 - lx), np.minimum(ly, 1 - ly)) * cell
    frame = d < 4
    glow = np.clip((d - 4) / 50, 0, 1)
    lit = hexrgb('#FBF8EE') * (0.9 + 0.1 * glow)[..., None]
    fr = hexrgb('#CBC8BE')
    out = np.where(frame[..., None], fr, lit)
    out *= (1 + fine(0.02, 41))[..., None]
    return out


def tangerine():
    """the accent: gloss tangerine plastic"""
    c = hexrgb('#DE5F1C')
    return c * (1 + noise(6, 0.06, 51) + fine(0.03, 52))[..., None]


def orbit_carpet():
    """60s geometric carpet: rows of circles-in-squares in tangerine, mustard and chocolate (4 x 4 a sheet)"""
    cell = N / 4
    cx = (np.floor(xx / cell) + 0.5) * cell; cy = (np.floor(yy / cell) + 0.5) * cell
    r = np.hypot(xx - cx, yy - cy) / (cell / 2)
    choc, mustard, tang, cream = hexrgb('#3E2517'), hexrgb('#D9A03A'), hexrgb('#D2601F'), hexrgb('#E8D7B4')
    alt = ((np.floor(xx / cell) + np.floor(yy / cell)) % 2).astype(bool)
    out = np.zeros((N, N, 3), np.float32) + choc
    ring = lambda a, b: (r >= a) & (r < b)
    for (a, b, cA, cB) in ((0.0, 0.28, cream, cream), (0.28, 0.52, tang, mustard), (0.52, 0.62, choc, choc),
                           (0.62, 0.86, mustard, tang)):
        m = ring(a, b)
        out = np.where((m & alt)[..., None], cA, out)
        out = np.where((m & ~alt)[..., None], cB, out)
    # the carpet's pile
    out *= (1 + noise(96, 0.10, 61) + fine(0.16, 62))[..., None]
    return np.asarray(Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1)), np.float32)


def groovy_wallpaper():
    """the Spirit Realm's wall: a campy op-art paper, plum ground, bubbles of magenta and amber (2 x 2 a sheet, half-drop)"""
    plum, mag, amber, pink = hexrgb('#3A1E3F'), hexrgb('#9A3C7C'), hexrgb('#E39A35'), hexrgb('#E8B7C6')
    out = np.zeros((N, N, 3), np.float32) + plum
    cell = N / 2
    centres = []
    for i in range(-1, 4):
        for j in range(-1, 4):
            centres.append(((i + 0.5) * cell, (j + 0.5) * cell + (cell / 2 if i % 2 else 0)))
    for (cx, cy) in centres:
        r = np.hypot(xx - cx, yy - cy) / (cell * 0.46)
        for (a, b, c) in ((0.0, 0.18, amber), (0.30, 0.46, mag), (0.58, 0.70, pink), (0.82, 1.0, mag)):
            out = np.where(((r >= a) & (r < b))[..., None], c, out)
    out *= (1 + noise(10, 0.05, 71) + fine(0.03, 72))[..., None]
    return out


SHEETS = {
    'hq60_panel_wall.png': panel_wall,
    'hq60_teak_slats.png': teak_slats,
    'hq60_light_ceiling.png': light_ceiling,
    'hq60_tangerine.png': tangerine,
    'hq60_orbit_carpet.png': orbit_carpet,
    'hq60_groovy_paper.png': groovy_wallpaper,
}

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'hq60'
    os.makedirs(out, exist_ok=True)
    only = sys.argv[2:]
    for name, fn in SHEETS.items():
        if only and name not in only:
            continue
        save(fn(), os.path.join(out, name))
