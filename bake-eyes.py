#!/usr/bin/env python3
"""bake-eyes.py - THE EYE PACK (repo-only tooling, 2026-11-03): MakeHuman's own eyeball mesh for the creator's pack eyes.

mondo (11-03) uploaded the MakeHuman Eye Texture Pack (36 PNGs: plain, bloodshot, cat eyes + their normal maps) to R2
Assets/characters/creator/mpfb/looks/eyes/eyetextures/. They use MakeHuman's own eye layout (the two eyeball discs of
the stock *_eye.png). Drawn INTO the body sheet like the stock eye colours (bake-mpfb.py bake_looks) an iris is ~6 texels
across and a cat eye's slit is gone, so the game draws them the way MakeHuman does: on the stock HIGH-POLY eye proxy
(makehuman_system_assets eyes/high-poly, CC0), which wears the pack PNG itself (1024 px, its normal map too).

The proxy is fitted to the body at run time (three-renderer.js THE EYE PACK): each proxy vertex = three body vertices x
weights + an offset scaled by the head (its .mhclo), so the face sliders (eye size / height / spacing ...) and the idle
face's glances move it like the eyeballs it covers. The body's vertices are found by their UVs: every MPFB GLB keeps
hm08's sheet with the eyeball islands blown up into the top-left corner (build_body), so a hm08 vertex's UV names it on
any of the bodies (the classic MPFB ones too). This tool writes that table:

  git clone --depth 1 https://github.com/makehumancommunity/mpfb2 /tmp/mpfb2
  unzip makehuman_system_assets_cc0.zip 'eyes/*' -d /tmp/sys
  python3 -I bake-eyes.py --mpfb /tmp/mpfb2 --sys /tmp/sys --tex <dir of the pack PNGs> --out charactercreation/mpfb/looks/eyes \
      [--check charactercreation/mpfb]

--check matches the table against every mpfb_*.glb there (each hm08 vertex must name a body vertex) and prints how far
the fitted proxy sits from the body's own eyeballs. Writes <out>/eye_proxy.json (upload to R2 next to eyetextures/).
Notes: docs/notes/character-creator.md "THE EYE PACK".
"""
import argparse, json, os, struct

import numpy as np
from PIL import Image


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
    """refs [(v0, v1, v2), (w0, w1, w2), (d0, d1, d2)] + the x / y / z scale lines (v_a, v_b, length)."""
    refs, scale, on = [], {}, False
    for line in open(path, encoding='utf-8', errors='replace'):
        s = line.strip()
        p = s.split()
        if not on and len(p) == 4 and p[0] in ('x_scale', 'y_scale', 'z_scale'):
            scale[p[0][0]] = [int(p[1]), int(p[2]), float(p[3])]
        if s.startswith('verts'):
            on = True
            continue
        if not on or not s or s.startswith('#'):
            continue
        try:
            if len(p) >= 9:
                refs.append(((int(p[0]), int(p[1]), int(p[2])), (float(p[3]), float(p[4]), float(p[5])), (float(p[6]), float(p[7]), float(p[8]))))
            elif len(p) == 1:
                refs.append(((int(p[0]),) * 3, (1.0, 0.0, 0.0), (0.0, 0.0, 0.0)))
            elif refs:
                break
        except ValueError:
            if refs:
                break
    return refs, scale


def body_loop_uvs(mpfb):
    """every hm08 vertex's UVs (one per loop), with build_body's eyeball-island blow-up, in glTF's convention (v down)."""
    objf = os.path.join(mpfb, 'src', 'mpfb', 'data', '3dobjs', 'base.obj')
    groups = json.load(open(os.path.join(mpfb, 'src', 'mpfb', 'data', 'mesh_metadata', 'basemesh_vertex_groups.json')))
    vs, vts, faces, _g = read_obj(objf)
    uv = [np.array([vts[vt] for _v, vt in f]) for f in faces]

    def members(g):
        out = set()
        for a, b in groups.get(g, []):
            out.update(range(a, b + 1))
        return out
    for side, (ox, oy) in (('helper-l-eye', (0.01, 0.89)), ('helper-r-eye', (0.095, 0.89))):
        m = members(side)
        fi = [i for i, f in enumerate(faces) if f[0][0] in m]
        a = np.concatenate([uv[i] for i in fi])
        lo, hi = a.min(axis=0), a.max(axis=0)
        s = 0.08 / max(hi - lo)
        for i in fi:
            uv[i] = np.stack([ox + (uv[i][:, 0] - lo[0]) * s, oy + (uv[i][:, 1] - lo[1]) * s], axis=1)
    loops = {}
    for i, f in enumerate(faces):
        for k, (v, _vt) in enumerate(f):
            loops.setdefault(v, set()).add((round(float(uv[i][k][0]), 6), round(1 - float(uv[i][k][1]), 6)))
    return vs, loops, members('helper-l-eye') | members('helper-r-eye')


def glb_body(path):
    """the biggest mesh primitive of a GLB: POSITION, TEXCOORD_0 (float32 arrays)."""
    b = open(path, 'rb').read()
    jl = struct.unpack_from('<I', b, 12)[0]
    js = json.loads(b[20:20 + jl])
    bin0 = 20 + jl + 8
    def acc(i):
        a = js['accessors'][i]
        bv = js['bufferViews'][a['bufferView']]
        n = {'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'SCALAR': 1}[a['type']]
        off = bin0 + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        stride = bv.get('byteStride', 0) or 4 * n
        assert a['componentType'] == 5126, 'float32 attributes only'
        rows = [np.frombuffer(b, np.float32, count=n, offset=off + i * stride) for i in range(a['count'])] if stride != 4 * n else None
        return np.array(rows if rows is not None else np.frombuffer(b, np.float32, count=n * a['count'], offset=off).reshape(-1, n), np.float64)
    best = None
    for m in js['meshes']:
        for pr in m['primitives']:
            at = pr['attributes']
            n = js['accessors'][at['POSITION']]['count']
            if 'TEXCOORD_0' in at and (best is None or n > best[0]):
                best = (n, at, m.get('name', ''))
    return acc(best[1]['POSITION']), acc(best[1]['TEXCOORD_0']), best[2]


def match(uvs, cand):
    """hm08 vertex -> GLB vertex index by UV (nearest candidate within 2e-5), -1 = not found."""
    key = {}
    q = np.floor(uvs * 2048).astype(int)
    for i, (a, b) in enumerate(q):
        key.setdefault((a, b), []).append(i)
    out = []
    for cs in cand:
        best, bd = -1, 2e-5
        for (u, v) in cs:
            a, b = int(np.floor(u * 2048)), int(np.floor(v * 2048))
            for da in (-1, 0, 1):
                for db in (-1, 0, 1):
                    for i in key.get((a + da, b + db), ()):
                        d = abs(uvs[i][0] - u) + abs(uvs[i][1] - v)
                        if d < bd:
                            best, bd = i, d
        out.append(best)
    return out


def iris_of(texf):
    """the two pupils' centres (the darkest blob each side) + the iris radius (where the disc turns to the white), in px."""
    im = np.asarray(Image.open(texf).convert('RGB'), np.float64)
    l = im.mean(axis=2)
    ys, xs = np.nonzero(l < 40)
    cs = []
    for half in (xs < im.shape[1] / 2, xs >= im.shape[1] / 2):
        cs.append([float(xs[half].mean()), float(ys[half].mean())])
    rs = []
    for cx, cy in cs:
        for r in range(20, 200):
            ang = np.linspace(0, 2 * np.pi, 72, endpoint=False)
            px = np.clip((cx + r * np.cos(ang)).astype(int), 0, im.shape[1] - 1)
            py = np.clip((cy + r * np.sin(ang)).astype(int), 0, im.shape[0] - 1)
            if l[py, px].mean() > 175:
                rs.append(r)
                break
    return [[round(c[0], 1), round(c[1], 1)] for c in cs], float(np.mean(rs)) if rs else 70.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mpfb', required=True)
    ap.add_argument('--sys', required=True, help='dir holding eyes/high-poly (makehuman_system_assets)')
    ap.add_argument('--tex', required=True, help='dir of the pack PNGs (for the iris centres)')
    ap.add_argument('--out', required=True)
    ap.add_argument('--check', default='', help='dir of mpfb_*.glb to match against')
    a = ap.parse_args()
    base_v, loops, eye_vs = body_loop_uvs(a.mpfb)
    d = os.path.join(a.sys, 'eyes', 'high-poly')
    refs, scale = read_mhclo(os.path.join(d, 'high-poly.mhclo'))
    pv, pvt, pf, _g = read_obj(os.path.join(d, 'high-poly.obj'))
    assert len(refs) == len(pv), (len(refs), len(pv))
    used = sorted({r for ref in refs for r in ref[0]} | {v for s in scale.values() for v in s[:2]})
    slot = {v: i for i, v in enumerate(used)}
    # GPU vertices: one per (vertex, uv) pair; triangles (the quads fanned)
    gv, gk, tris = [], {}, []
    for f in pf:
        ix = []
        for v, vt in f:
            if (v, vt) not in gk:
                gk[(v, vt)] = len(gv)
                gv.append((v, vt))
            ix.append(gk[(v, vt)])
        for k in range(1, len(ix) - 1):
            tris += [ix[0], ix[k], ix[k + 1]]
    centres, r = iris_of(os.path.join(a.tex, 'BrownEyes.png'))
    out = {
        'note': 'THE EYE PACK: MakeHuman high-poly eye proxy (makehuman_system_assets, CC0) fitted to the MPFB bodies; bake-eyes.py',
        'ref': [[round(u, 6), round(v, 6)] for vid in used for (u, v) in [sorted(loops[vid])[0]]],
        'refAlt': {str(i): [list(x) for x in sorted(loops[vid])[1:]] for i, vid in enumerate(used) if len(loops[vid]) > 1},
        'verts': [[slot[r0], slot[r1], slot[r2], round(w0, 5), round(w1, 5), round(w2, 5), round(d0, 5), round(d1, 5), round(d2, 5)]
                  for (r0, r1, r2), (w0, w1, w2), (d0, d1, d2) in refs],
        'scale': {k: [slot[s[0]], slot[s[1]], s[2]] for k, s in scale.items()},
        'gv': [[v, round(float(pvt[vt][0]), 5), round(1 - float(pvt[vt][1]), 5)] for v, vt in gv],   # (v down: glTF)
        'tris': tris,
        'iris': {'centres': centres, 'r': round(r, 1)},
        'eyeUv': [round(x, 6) for uv in sorted({u for v in eye_vs for u in loops[v]}) for x in uv],   # every eyeball-helper UV: the body triangles the mesh replaces
    }
    os.makedirs(a.out, exist_ok=True)
    fn = os.path.join(a.out, 'eye_proxy.json')
    json.dump(out, open(fn, 'w'), separators=(',', ':'))
    print('[bake-eyes] wrote', fn, os.path.getsize(fn), 'bytes;', len(out['eyeUv']) // 2, 'eyeball UVs;', len(pv), 'verts,', len(gv), 'gpu verts,', len(tris) // 3, 'tris; refs', len(used), '; iris', out['iris'])
    if a.check:
        cand = [sorted(loops[v]) for v in used]
        for f in sorted(os.listdir(a.check)):
            if not (f.startswith('mpfb_') and f.endswith('.glb')) or 'shapes' in f or '_fit_' in f or 'bust' in f:
                continue
            P, UV, name = glb_body(os.path.join(a.check, f))
            g = match(UV, cand)
            miss = [used[i] for i, x in enumerate(g) if x < 0]
            line = '[bake-eyes] %-28s %6d verts, refs found %d/%d' % (f, len(P), len(g) - len(miss), len(g))
            if not miss:
                G = np.array(g)
                sc = {k: abs(P[G[s[0]]][ 'xyz'.index(k)] - P[G[s[1]]]['xyz'.index(k)]) / s[2] for k, s in out['scale'].items()}
                fit = np.array([sum(w * P[G[slot[rv]]] for rv, w in zip(ref[0], ref[1])) / max(sum(ref[1]), 1e-9) +
                                np.array([ref[2][0] * sc['x'], ref[2][1] * sc['y'], ref[2][2] * sc['z']]) for ref in refs])
                ev = [x for x in match(UV, [sorted(loops[v]) for v in sorted(eye_vs)]) if x >= 0]
                E = P[ev]
                cen = [E[E[:, 0] > 0].mean(axis=0), E[E[:, 0] < 0].mean(axis=0)]
                rad = [np.linalg.norm(E[E[:, 0] > 0] - cen[0], axis=1).mean(), np.linalg.norm(E[E[:, 0] < 0] - cen[1], axis=1).mean()]
                pr = [np.linalg.norm(fit[fit[:, 0] > 0] - cen[0], axis=1), np.linalg.norm(fit[fit[:, 0] < 0] - cen[1], axis=1)]
                line += '; body eyeball r %.4f / %.4f, proxy r %.4f-%.4f / %.4f-%.4f' % (rad[0], rad[1], pr[0].min(), pr[0].max(), pr[1].min(), pr[1].max())
            else:
                line += ' MISSING ' + str(miss[:8])
            print(line)


if __name__ == '__main__':
    main()
