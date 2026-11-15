#!/usr/bin/env python3
"""bake-trees.py (2026-11-15, mondo: "im not liking how these trees have the 2d cutouts for the leaves ... use the trunks and branches
from the current trees ... make better leaves ... texture them with the current tree leaves ... make them natural looking").

THE FULL TREES: a Retro Tree Pack tree (two crossed cards wearing one picture of the whole crown) is baked again as a tree with a real
crown. The trunk and the bark are the file's own, untouched. The two cards go; in their place stand many small leaf sheets that wear
pieces of THE SAME PICTURE (the file's own leaf material and texture, nothing new is drawn):
  a LEAFY tree  : round each bough a small crossed core (a dense piece of the picture) and eighteen ragged sprays, each turned so
                  the picture's solid side is inward and its own leaf edge is the outside: the outline is leaves, not a ball.
  a FIR / PINE  : sixteen tiers of bough sheets; each bough is a slice of the picture at its own height, from the stem out to the
                  picture's real outline, so the tree keeps the fir's own silhouette from every side.
Each sheet keeps its own normal (they lie every way, so the crown shades like leaves). 500-600 triangles a tree.

  pip install bpy numpy
  python3 bake-trees.py <folder with the pack's GLBs> <out folder>      # writes <name>_full.glb for each tree below
Then: node sync-zip.js --put <out>/<name>_full.glb Assets/world/nature/retrotreepack/GLB/<name>_full.glb ...
The game draws them as `rt:<name>_full` (data.js HQ_TREE_KINDS tree_52 ... tree_56)."""
import bpy, bmesh, sys, os, math, random
import numpy as np
from mathutils import Vector

TREES = {  # file stem -> (form, seed, crown width for a bare pole)
    'tree_rt_4': ('leafy', 1, 1.0), 'tree_rt_2_1': ('leafy', 3, 0.8), 'tree_rt_2': ('leafy', 5, 0.8), 'tree_rt_3': ('fir', 2, 1.0), 'tree_rt_1': ('fir', 4, 1.0),
}

def picture(mat):
    """the leaf material's picture: its alpha as a top-down mask + the pieces the sheets wear"""
    img = next(n.image for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image)
    Wd, Ht = img.size; px = np.array(img.pixels[:], dtype=np.float32).reshape(Ht, Wd, 4)[::-1]; a = px[..., 3] > 0.5
    ii = np.pad(a.astype(np.int64).cumsum(0).cumsum(1), ((1, 0), (1, 0))); box = lambda x0, y0, x1, y1: ii[y1, x1] - ii[y0, x1] - ii[y1, x0] + ii[y0, x0]
    rows = np.where(a.any(1))[0]; y0, y1 = int(rows[0]), int(rows[-1]); low = a[int(y1 - (y1 - y0) * 0.06):y1]; cx = int(np.where(low.any(0))[0].mean())
    P = {'W': Wd, 'H': Ht, 'y0': y0, 'y1': y1, 'cx': cx, 'xl': [int(np.where(r)[0][0]) if r.any() else cx for r in a], 'xr': [int(np.where(r)[0][-1]) if r.any() else cx for r in a]}
    s = int(min(Wd, Ht) * 0.26); P['s'] = s
    def best(size, lo, hi, want, n, mid=None, grad=False):
        cand = []
        for y in range(0, Ht - size, 6):
            for x in range(0, Wd - size, 6):
                c = box(x, y, x + size, y + size) / size / size
                if not (lo < c < hi): continue
                if mid is not None:
                    q = size // 4
                    if box(x + q, y + q, x + size - q, y + size - q) / (size - 2 * q) ** 2 < mid: continue
                if grad:
                    yy, xx = np.nonzero(a[y:y + size, x:x + size]); gx, gy = xx.mean() - size / 2, yy.mean() - size / 2; g = math.hypot(gx, gy)
                    if g < size * 0.1: continue
                    cand.append((-g, x, y, gx / g, gy / g))
                else: cand.append((abs(c - want), x, y, 0, 0))
        cand.sort(); pick = []
        for _, x, y, gx, gy in cand:
            if all(abs(x - p[0]) > size * 0.5 or abs(y - p[1]) > size * 0.5 for p in pick): pick.append((x, y, gx, gy))
            if len(pick) == n: break
        return pick
    P['wins'] = best(s, 0.45, 0.72, 0.58, 6, mid=0.9) or best(s, 0.4, 0.9, 0.6, 6)
    P['fs'] = int(s * 0.8); P['fringe'] = best(P['fs'], 0.38, 0.55, 0, 8, grad=True)
    ds = int(s * 0.6); P['ds'] = ds; P['dense'] = best(ds, 0.9, 1.01, 1.0, 4) or P['wins']
    return P

class Leaves:
    def __init__(self, P): self.P = P; self.v = []; self.f = []; self.uv = []; self.n = []
    def sheet(self, loc, ax, ay, u0, v0, u1, v1, mid, nx=1):
        """centre loc, half-axes ax (picture x) / ay (picture DOWN), the picture's pixel box on it; normals out of the crown from `mid`"""
        P = self.P; b = len(self.v)
        for j in range(2):
            for i in range(nx + 1):
                p = Vector(loc) + Vector(ax) * (i / nx * 2 - 1) + Vector(ay) * (j * 2 - 1); self.v.append(p)
                self.uv.append(((u0 + (u1 - u0) * i / nx) / P['W'], 1 - (v0 + (v1 - v0) * j) / P['H']))
                n = (p - Vector(mid)); n.z = n.z * 0.6 + n.length * 0.5; self.n.append(n.normalized() if n.length > 1e-6 else Vector((0, 0, 1)))
        for i in range(nx): self.f.append((b + i, b + i + 1, b + nx + 1 + i + 1, b + nx + 1 + i))
def perp(d, rnd):
    r = Vector((rnd.gauss(0, 1), rnd.gauss(0, 1), rnd.gauss(0, 1))); r = r - d * r.dot(d); return r.normalized()
def kmeans(pts, k, seed):
    rnd = random.Random(seed); cs = rnd.sample(pts, min(k, len(pts)))
    for _ in range(12):
        g = [[] for _ in cs]
        for p in pts: g[min(range(len(cs)), key=lambda i: (p - cs[i]).length_squared)].append(p)
        cs = [sum(q, Vector()) / len(q) if q else cs[i] for i, q in enumerate(g)]
    return cs

def leafy(L, vs, H, seed, wide):
    P = L.P; rnd = random.Random(seed); s = P['s']; up = [v for v in vs if v.z > H * 0.38]; tv = max(vs, key=lambda v: v.z)
    cs = kmeans(up, 8, seed) + [tv]; mid = sum(cs, Vector()) / len(cs); x, y = sum(v.x for v in vs if v.z < H * 0.1) / max(1, sum(1 for v in vs if v.z < H * 0.1)), sum(v.y for v in vs if v.z < H * 0.1) / max(1, sum(1 for v in vs if v.z < H * 0.1))
    if max((c - mid).length for c in cs) < H * 0.16:      # a bare pole: boughs of its own, an uneven crown round the upper stem
        cs = [mid + Vector((math.cos(a) * rr, math.sin(a) * rr, zz)) for a, rr, zz in [(i * 2.4 + rnd.random(), H * (0.1 + 0.14 * rnd.random()) * wide, H * rnd.uniform(-0.16, 0.2)) for i in range(8)]] + [tv]
        mid = sum(cs, Vector()) / len(cs)
    for c in cs:
        out = Vector((c.x - x, c.y - y, 0)); c2 = c + out * 0.25 + Vector((0, 0, H * 0.02)); R = H * (0.13 + 0.05 * rnd.random())
        for j in range(3):            # the core: three crossed dense sheets, so the crown is never see-through
            dx, dy, _, _ = P['dense'][rnd.randrange(len(P['dense']))]; a = j * math.pi / 3 + rnd.random() * 0.5; t = Vector((math.cos(a), math.sin(a), 0))
            L.sheet(c2, t * R * 0.7, Vector((0, 0, -1)) * R * 0.55, dx, dy, dx + P['ds'], dy + P['ds'], mid)
        for j in range(18):           # the leaves: ragged sprays, each turned so the picture's solid side is inward and its own leaf edge
            far = j >= 10             # is the outside; ten fill the bough's body, eight reach out past it and make the outline
            d = Vector((rnd.gauss(0, 1), rnd.gauss(0, 1), rnd.gauss(0, 0.55) + (0.0 if far else 0.2))).normalized(); d = (d + (c2 - mid).normalized() * (0.7 if far else 0.4)).normalized()
            fx, fy, gx, gy = P['fringe'][rnd.randrange(len(P['fringe']))]; fs = P['fs']; e1 = -d; e2 = perp(e1, rnd); sz = R * ((1.0 if far else 0.8) + 0.5 * rnd.random())
            L.sheet(c2 + Vector((d.x * 1.25, d.y * 1.25, d.z * 0.75)) * R * (0.95 if far else 0.45 + 0.3 * rnd.random()), (e1 * gx - e2 * gy) * sz / 2, (e1 * gy + e2 * gx) * sz / 2, fx, fy, fx + fs, fy + fs, mid)

def fir(L, vs, H, seed):
    P = L.P; rnd = random.Random(seed); y0, y1, cxp = P['y0'], P['y1'], P['cx']; ph = y1 - y0; ppm = ph / (H * 0.97); foot = 0.1; n = 16
    low = [v for v in vs if v.z < H * 0.1]; x = sum(v.x for v in low) / len(low); y = sum(v.y for v in low) / len(low)
    hw = int(ph * 0.07)                 # the heart: the picture's own middle strip, crossed three ways up the stem (the pack's stem stops low)
    for j in range(3):
        a = j * math.pi / 3 + 0.3; t = Vector((math.cos(a), math.sin(a), 0)); zt = H * 0.985; zb = H * foot * 0.6
        L.sheet(Vector((x, y, (zt + zb) / 2)), t * (hw / ppm), Vector((0, 0, -1)) * ((zt - zb) / 2), cxp - hw, y0, cxp + hw, int(y1 - ph * foot * 0.6), Vector((x, y, (zt + zb) / 2)))
    for i in range(n):
        f = i / (n - 1); band = ph * (0.085 - 0.03 * f); yc = y1 - ph * (foot + (0.985 - foot) * f); v0 = int(max(y0, yc - band)); v1 = int(min(y1, yc + band))
        if v1 - v0 < 4: continue
        nb = 9 if f < 0.5 else 7 if f < 0.8 else 5; a0 = rnd.random() * 6; zc = (y1 - (v0 + v1) / 2) / ppm + H * 0.02; mid = Vector((x, y, zc - H * 0.05))
        for j in range(nb):
            right = rnd.random() < 0.5; xe = (max(P['xr'][r] for r in range(v0, v1)) + 4) if right else (min(P['xl'][r] for r in range(v0, v1)) - 4)
            Ln = abs(xe - cxp) / ppm * (0.92 + 0.16 * rnd.random())
            if Ln < H * 0.01: continue
            a = a0 + j * 2 * math.pi / nb + rnd.uniform(-0.15, 0.15); r = Vector((math.cos(a), math.sin(a), 0)); tg = Vector((-math.sin(a), math.cos(a), 0)); tl = rnd.choice((-1, 1)) * rnd.uniform(0.5, 0.95)
            upv = Vector((0, 0, 1)) * math.cos(tl) + tg * math.sin(tl); hh = (v1 - v0) / ppm / 2 * 1.15
            L.sheet(Vector((x, y, zc)) + r * Ln / 2, r * Ln / 2, -upv * hh, cxp, v0, xe, v1, mid, nx=2)

def bake(src, dst, form, seed, wide):
    bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
    o = next(q for q in bpy.data.objects if q.type == 'MESH'); bpy.context.view_layer.update()
    allv = [o.matrix_world @ v.co for v in o.data.vertices]; z0 = min(v.z for v in allv); H = max(v.z for v in allv) - z0      # the whole tree's height, its cards included
    li = [i for i, sl in enumerate(o.material_slots) if 'bark' not in sl.material.name.lower()]; leafmat = o.material_slots[li[0]].material
    P = picture(leafmat)
    bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index in li], context='FACES')
    loose = [v for v in bm.verts if not v.link_faces]; bmesh.ops.delete(bm, geom=loose, context='VERTS'); bm.to_mesh(o.data); bm.free()
    vs = [o.matrix_world @ v.co for v in o.data.vertices]
    L = Leaves(P)
    if form == 'fir': fir(L, vs, H, seed)
    else: leafy(L, vs, H, seed, wide)
    me = bpy.data.meshes.new('leaves'); me.from_pydata([tuple(v) for v in L.v], [], L.f); uv = me.uv_layers.new(name='UVMap')
    for p in me.polygons:
        for l in p.loop_indices: uv.data[l].uv = L.uv[me.loops[l].vertex_index]
    me.materials.append(leafmat)      # each sheet keeps its own flat normal: the sheets lie every way, so the crown shades like a mass of leaves
    lo = bpy.data.objects.new(o.name + '_leaves', me); bpy.context.collection.objects.link(lo)
    bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_yup=True, export_apply=False, export_normals=True, export_animations=False, export_image_format='AUTO')
    return H, len(o.data.polygons), len(L.f) * 2

if __name__ == '__main__':
    src, out = sys.argv[-2], sys.argv[-1]; os.makedirs(out, exist_ok=True)
    for name, (form, seed, wide) in TREES.items():
        H, tb, tl = bake(os.path.join(src, name + '.glb'), os.path.join(out, name + '_full.glb'), form, seed, wide)
        print('%-14s %-5s height %.2f  trunk faces %d  leaf triangles %d  %d bytes' % (name, form, H, tb, tl, os.path.getsize(os.path.join(out, name + '_full.glb'))))
