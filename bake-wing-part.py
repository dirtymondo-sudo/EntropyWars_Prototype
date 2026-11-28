#!/usr/bin/env python3
"""bake-wing-part.py -- THE WING PART (2026-11-28, the Succubus remake; mondo: "a new meshy model for the succubus ... separate
animated wings of course").

A Meshy body made WITHOUT wings + ONE wing modelled on its own (a Meshy image-to-3d part, the left wing, spread flat facing the
camera: root at -x, tip at +x, membrane in the x-y plane). This tool trims the wing's root stump, scales and turns it, hangs a copy
on each side of the back on two new bones `ewwing_L` / `ewwing_R` (children of the chest bone, every wing vertex wholly on its
bone) and writes it as a second primitive of the body's mesh with its own material. three-renderer.js THE LOOSE WINGS EVERYWHERE
(_wfSplitBaked + `sway: { wings: '<beat>' }`) then bends and beats them like any baked wing. The body's bytes, names, rest pose
and inverse binds are kept (the animation retarget relies on them); the skin only gains the two joints at its end.

    python3 -I bake-wing-part.py <body rigged.glb> <wing.glb> <out.glb> [--parent Spine] [--span 0.86] [--trim 0.17]
        [--up 20] [--back 25] [--at x,y,z] [--tex 1024]

--span  the wing's length root to tip in metres after the trim     --trim  part of the wing's length cut off at the root (the stump)
--up    degrees the tip is raised                                  --back  degrees the tip sweeps behind the body
--at    the left wing's root, x,y,z in the body's frame (default: 0.07 out, 0.06 under the parent bone, 0.08 behind it)
--tex   longest side of the wing's pictures in the output (needs pillow; 0 = keep them as they are)
Upload the result under a NEW name (assets are long-cached) and point sprites.js at it.
"""
import importlib.util, io, os, sys
import numpy as np

_here = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('bake_sway', os.path.join(_here, 'bake-sway.py'))
bs = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(bs)


def rot(axis, deg):
    a = np.radians(deg); c, s = np.cos(a), np.sin(a)
    if axis == 'y': return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def picture(jw, bw, i, size):
    raw = bs.view_bytes(jw, bw, jw['images'][i]['bufferView']); mime = jw['images'][i].get('mimeType', 'image/png')
    if not size: return raw, mime
    from PIL import Image
    im = Image.open(io.BytesIO(raw))
    if max(im.size) > size: im = im.resize((size, size * im.size[1] // im.size[0]), Image.LANCZOS)
    out = io.BytesIO()
    if mime == 'image/jpeg': im.convert('RGB').save(out, 'JPEG', quality=90)
    else: im.save(out, 'PNG', optimize=True)
    return out.getvalue(), mime


def main():
    args = sys.argv[1:]
    opt = {'parent': 'Spine', 'span': 0.86, 'trim': 0.17, 'up': 20.0, 'back': 25.0, 'at': None, 'tex': 1024}
    for k0 in list(opt):
        if '--' + k0 in args:
            k = args.index('--' + k0); v = args[k + 1]; del args[k:k + 2]
            opt[k0] = v if k0 == 'parent' else [float(t) for t in v.split(',')] if k0 == 'at' else int(v) if k0 == 'tex' else float(v)
    if len(args) != 3: print(__doc__); sys.exit(1)
    src, wsrc, dst = args
    j, b = bs.read(src); jw, bw = bs.read(wsrc); G = bs.globals_(j)
    sk = j['skins'][0]; J = list(sk['joints'])
    pn = next(k for k in J if j['nodes'][k]['name'] == opt['parent'])
    Gp = G[pn]
    # ---- the wing, trimmed and placed (left wing; the right is its mirror) ----
    wp = jw['meshes'][0]['primitives'][0]
    P = bs.acc(jw, bw, wp['attributes']['POSITION']).astype(float); N = bs.acc(jw, bw, wp['attributes']['NORMAL']).astype(float)
    UV = bs.acc(jw, bw, wp['attributes']['TEXCOORD_0']).astype(float); I = bs.acc(jw, bw, wp['indices']).reshape(-1, 3).astype(int)
    x0, x1 = P[:, 0].min(), P[:, 0].max(); cut = x0 + opt['trim'] * (x1 - x0)
    keep = (P[I][:, :, 0] >= cut).all(1); I = I[keep]
    used = np.unique(I); remap = np.full(len(P), -1); remap[used] = np.arange(len(used))
    P, N, UV, I = P[used], N[used], UV[used], remap[I]
    near = P[:, 0] < cut + 0.04 * (x1 - x0)   # the root: where the arm bone leaves the cut
    root = np.array([cut, np.median(P[near, 1]), np.median(P[near, 2])])
    s = opt['span'] / (x1 - cut)
    R = rot('y', opt['back']) @ rot('z', opt['up'])
    PL = ((P - root) * s) @ R.T; NL = N @ R.T
    at = np.array(opt['at']) if opt['at'] else Gp[:3, 3] + np.array([0.07, -0.06, -0.08])
    # ---- the two bones on the chest ----
    names = {'ewwing_L': 1.0, 'ewwing_R': -1.0}
    if any(n.get('name') in names for n in j['nodes']): sys.exit('already has ewwing bones: start from the plain rigged body')
    IBM = bs.acc(j, b, sk['inverseBindMatrices']).reshape(-1, 4, 4)
    newJ, newIBM, prims = [], [], []
    for nm, sx in names.items():
        a = at * np.array([sx, 1, 1]); a[0] = Gp[0, 3] + sx * abs(at[0] - Gp[0, 3])
        Gb = Gp.copy(); Gb[:3, 3] = a
        loc = np.linalg.inv(Gp) @ Gb
        j['nodes'].append({'name': nm, 'translation': [float(v) for v in loc[:3, 3]]})
        ni = len(j['nodes']) - 1; j['nodes'][pn].setdefault('children', []).append(ni)
        newJ.append(ni); newIBM.append(np.linalg.inv(Gb).T)   # column-major
        M = np.diag([sx, 1, 1])
        PP = PL @ M.T + a; NN = NL @ M.T
        II = I if sx > 0 else I[:, [0, 2, 1]]
        prims.append((PP, NN, II, len(J) + len(newJ) - 1))
    sk['joints'] = J + newJ
    allIBM = np.concatenate([IBM, np.array(newIBM)], 0).reshape(-1, 16)
    sk['inverseBindMatrices'] = bs.append_acc(j, b, allIBM.astype(np.float32), 5126, 'MAT4')
    # ---- the wing's material + pictures ----
    tmap = {}
    def tex(ti):
        if ti in tmap: return tmap[ti]
        src_i = jw['textures'][ti]['source']; raw, mime = picture(jw, bw, src_i, opt['tex'])
        while len(b) % 4: b.append(0)
        off = len(b); b.extend(raw)
        j['bufferViews'].append({'buffer': 0, 'byteOffset': off, 'byteLength': len(raw)})
        j['images'].append({'bufferView': len(j['bufferViews']) - 1, 'mimeType': mime, 'name': 'ewwing_tex%d' % ti})
        j['textures'].append({'sampler': j['textures'][0].get('sampler', 0), 'source': len(j['images']) - 1})
        tmap[ti] = len(j['textures']) - 1; return tmap[ti]
    wm = jw['materials'][wp.get('material', 0)]
    mat = {'name': 'ewwing_membrane', 'doubleSided': True, 'pbrMetallicRoughness': {}}
    pbr = wm.get('pbrMetallicRoughness', {})
    for k in ('baseColorTexture', 'metallicRoughnessTexture'):
        if k in pbr: mat['pbrMetallicRoughness'][k] = {'index': tex(pbr[k]['index'])}
    if 'normalTexture' in wm: mat['normalTexture'] = {'index': tex(wm['normalTexture']['index'])}
    j['materials'].append(mat); mi = len(j['materials']) - 1
    # ---- one primitive: both wings ----
    PP = np.concatenate([q[0] for q in prims]); NN = np.concatenate([q[1] for q in prims]); n0 = len(prims[0][0])
    II = np.concatenate([prims[0][2], prims[1][2] + n0]); UU = np.concatenate([UV, UV])
    JJ = np.zeros((len(PP), 4), np.uint16); JJ[:n0, 0] = prims[0][3]; JJ[n0:, 0] = prims[1][3]
    WW = np.zeros((len(PP), 4), np.float32); WW[:, 0] = 1
    pa = bs.append_acc(j, b, PP.astype(np.float32), 5126, 'VEC3', 34962)
    j['accessors'][pa]['min'] = [float(v) for v in PP.min(0)]; j['accessors'][pa]['max'] = [float(v) for v in PP.max(0)]
    NN = NN / np.maximum(np.linalg.norm(NN, axis=1, keepdims=True), 1e-9)
    prim = {'attributes': {'POSITION': pa, 'NORMAL': bs.append_acc(j, b, NN.astype(np.float32), 5126, 'VEC3', 34962),
                           'TEXCOORD_0': bs.append_acc(j, b, UU.astype(np.float32), 5126, 'VEC2', 34962),
                           'JOINTS_0': bs.append_acc(j, b, JJ, 5123, 'VEC4', 34962),
                           'WEIGHTS_0': bs.append_acc(j, b, WW, 5126, 'VEC4', 34962)},
            'indices': bs.append_acc(j, b, II.reshape(-1).astype(np.uint32), 5125, 'SCALAR', 34963), 'material': mi}
    mesh_i = next(n['mesh'] for n in j['nodes'] if 'mesh' in n and 'skin' in n)
    j['meshes'][mesh_i]['primitives'].append(prim)
    bs.write(dst, j, b)
    print('wings on', opt['parent'], 'root L', np.round(at, 3).tolist(), 'verts', len(PP), 'tris', len(II), '->', dst)


if __name__ == '__main__':
    main()
