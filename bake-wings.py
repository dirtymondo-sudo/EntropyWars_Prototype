#!/usr/bin/env python3
"""bake-wings.py -- THE WING BONES (2026-11-23, the Butterfly Girl; mondo OK'd "add wing bones so she flaps").

A Meshy rig weights a pair of insect wings to the chest, so they never move. When each wing is its own loose piece of the
mesh (no triangle joins it to the body: the Butterfly Girl's two wings are), this tool finds the two pieces (the two
biggest loose pieces standing out to each side behind the back), adds one bone a wing, `ewwing_L` and `ewwing_R`, hung on
the chest bone at the wing's root, and weights every vertex of the wing to it. Everything else in the file is kept byte for
byte (names, rest pose, inverse binds: the animation retarget relies on them), like bake-sway.py, so it edits the GLB
directly. three-renderer.js THE UNIT GEAR (_gearTick) beats the two bones at run time (fold back behind her and open).

    python3 -I bake-wings.py <in.glb> <out.glb> [--parent Spine] [--debug <dir>]

--soft (2026-11-27, THE LOOSE WINGS EVERYWHERE: mondo "any other units need separate wings"): for wings that are ONE skin with
the body (most Meshy units: no loose piece to find). A wing is then what stands behind the back, out to one side, far from
every bone of the rig (`--far`, part of the height, default 0.07); nothing is cut: each wing vertex is blended from its old
weights to the wing's bone over a band (`--band`, default 0.06 of the height), so the root bends like a shoulder.
`--back` (default 0.02) = how far behind the middle of the body a wing vertex must sit, `--low` / `--high` = the height band
(parts of the height, default 0.3 .. 1.6: tails and capes' hems stay out), `--side` (default 0.03) = how far off the middle.

Needs numpy (+ pillow for --debug). Upload the new file under a NEW name (assets are long-cached) and point sprites.js at it.
"""
import importlib.util, os, sys
import numpy as np

_here = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('bake_sway', os.path.join(_here, 'bake-sway.py'))
bs = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(bs)   # the GLB read / write helpers


def pieces(P, I):
    """loose pieces of the mesh: vertices joined by a triangle or sharing a position (UV seams) are one piece"""
    n = len(P); par = np.arange(n)
    def f(x):
        r = x
        while par[r] != r: r = par[r]
        while par[x] != r: par[x], x = r, par[x]
        return r
    seen = {}
    for i, v in enumerate(map(tuple, np.round(P, 5))):
        if v in seen: par[f(i)] = f(seen[v])
        else: seen[v] = i
    for a, b, c in I:
        ra = f(a); par[f(b)] = ra; par[f(c)] = ra
    return np.array([f(i) for i in range(n)])


def soft_main(j, b, G, sk, J, IBM, S, p, P, I, parent, opt, dst, src, dbg):
    """wings that are one skin with the body: far from every bone, behind the back, out to a side; blended, not cut"""
    H = P[:, 1].max() - P[:, 1].min(); y0 = P[:, 1].min()
    par_of = {c: i for i, n in enumerate(j['nodes']) for c in n.get('children', [])}
    Jset = set(J); d = np.full(len(P), 1e9)
    for n in J:
        a = G[n][:3, 3]
        d = np.minimum(d, np.linalg.norm(P - a, axis=1))
        if n in par_of and par_of[n] in Jset:
            q = G[par_of[n]][:3, 3]
            if np.linalg.norm(a - q) > 1e-6: d = np.minimum(d, bs.segd(P, q, a))
    Ji = bs.acc(j, b, p['attributes']['JOINTS_0']).astype(int); Wt = bs.acc(j, b, p['attributes']['WEIGHTS_0']).astype(float)
    zb = np.median(P[:, 2]); xm = np.median(P[:, 0])
    yy = (P[:, 1] - y0) / H
    cand = (d > (opt['far'] - 0.0) * H) & (P[:, 2] < zb - opt['back'] * H) & (yy > opt['low']) & (yy < opt['high']) & (np.abs(P[:, 0] - xm) > opt['side'] * H)
    # the pieces of the candidate skin (joined by a triangle or a shared position), a side at a time
    par = np.arange(len(P))
    def f(x):
        r = x
        while par[r] != r: r = par[r]
        while par[x] != r: par[x], x = r, par[x]
        return r
    seen = {}
    for i in np.nonzero(cand)[0]:
        v = tuple(np.round(P[i], 5))
        if v in seen: par[f(i)] = f(seen[v])
        else: seen[v] = i
    sidev = P[:, 0] > xm
    for a, bb, c in I:
        for u, v in ((a, bb), (bb, c), (a, c)):
            if cand[u] and cand[v] and sidev[u] == sidev[v]: par[f(u)] = f(v)
    rt = np.array([f(i) if cand[i] else -1 for i in range(len(P))])
    wings = {}
    for side, sm in (('L', sidev), ('R', ~sidev)):
        m = cand & sm
        if not m.any(): continue
        u, cnt = np.unique(rt[m], return_counts=True)
        best = None
        for k in np.argsort(-cnt):
            mk = rt == u[k]
            reach = np.abs(P[mk][:, 0] - xm).max()
            if cnt[k] >= 150 and reach > 0.14 * H: best = mk; break
        if best is not None: wings[side] = best
    if len(wings) != 2: sys.exit('bake-wings --soft: found %d wings (need 2): %s' % (len(wings), {k: int(v.sum()) for k, v in wings.items()}))
    pr = next(k for k, n in enumerate(j['nodes']) if n['name'] == parent)
    Gp = G[pr]; sc = np.linalg.norm(Gp[:3, 0])
    newJ = []; newIBM = []; j0 = len(J)
    far, band = opt['far'] * H, opt['band'] * H
    for k, side in enumerate(('L', 'R')):
        m = wings[side]; Q = P[m]; dq = d[m]
        near = Q[dq < far + band * 0.6]
        if len(near) < 6: near = Q[np.argsort(dq)[:max(6, len(Q) // 20)]]
        pos = near.mean(0)   # the root: where the wing leaves the back
        T = np.eye(4); T[:3, 3] = pos; L = np.linalg.inv(Gp) @ T
        R = L[:3, :3] * sc
        ni = len(j['nodes'])
        j['nodes'].append({'name': 'ewwing_' + side, 'translation': L[:3, 3].tolist(), 'rotation': [float(v) for v in bs.m_quat(R)]})
        j['nodes'][pr].setdefault('children', []).append(ni)
        newJ.append(ni)
        Lb = np.eye(4); Lb[:3, :3] = R; Lb[:3, 3] = L[:3, 3]
        newIBM.append((np.linalg.inv(Gp @ Lb) @ S).T.reshape(16))
        # the blend: from the old weights at the edge of the wing to the wing's bone a band further out
        t = np.clip((dq - far) / band, 0, 1); t = t * t * (3 - 2 * t)
        idx = np.nonzero(m)[0]; full = 0
        for q, vi in enumerate(idx):
            tt = t[q]
            if tt <= 0.001: continue
            if tt >= 0.999: Ji[vi] = [j0 + k, 0, 0, 0]; Wt[vi] = [1.0, 0, 0, 0]; full += 1; continue
            w = Wt[vi].copy(); jj = Ji[vi].copy()
            o = np.argsort(-w)[:3]; w3 = w[o]; w3 = w3 / max(1e-9, w3.sum()) * (1 - tt)
            Ji[vi] = [jj[o[0]], jj[o[1]], jj[o[2]], j0 + k]; Wt[vi] = [w3[0], w3[1], w3[2], tt]
        print('bake-wings: soft wing %s · %d vertices (%d wholly on the bone) · root %s · reach %.2f of the height' % (side, int(m.sum()), full, np.round(pos, 3).tolist(), np.abs(Q[:, 0] - xm).max() / H))
    sk['joints'] = J + newJ
    sk['inverseBindMatrices'] = bs.append_acc(j, b, np.vstack([IBM.transpose(0, 2, 1).reshape(-1, 16), np.array(newIBM)]), 5126, 'MAT4')
    p['attributes']['JOINTS_0'] = bs.append_acc(j, b, Ji, 5121 if len(sk['joints']) < 256 else 5123, 'VEC4', 34962)
    p['attributes']['WEIGHTS_0'] = bs.append_acc(j, b, Wt, 5126, 'VEC4', 34962)
    j['asset'].setdefault('extras', {})['ewWings'] = {'parent': parent, 'bones': ['ewwing_L', 'ewwing_R'], 'soft': opt}
    bs.write(dst, j, b)
    print('bake-wings: %s -> %s · two soft wing bones on %s' % (src, dst, parent))
    if dbg:
        from PIL import Image
        os.makedirs(dbg, exist_ok=True); Sz = 600
        tag = os.path.splitext(os.path.basename(dst))[0]
        wm = wings['L'] | wings['R']
        for nm, ax, sg in (('back', 0, 1), ('side', 2, 1), ('top', 0, 1)):
            im = Image.new('RGB', (Sz, Sz), (30, 30, 30)); px = im.load(); s2 = (Sz - 20) / max(1e-6, H * 1.25)
            order = np.argsort(-P[:, 2]) if nm == 'back' else (np.argsort(P[:, 0]) if nm == 'side' else np.argsort(P[:, 1]))
            for k in order:
                x, y, z = P[k]; cl = (255, 60, 60) if wm[k] and d[k] > far + band else ((255, 200, 60) if wm[k] else (90, 90, 110))
                if nm == 'back': uu, vv = int(Sz / 2 - (x - xm) * s2), int(Sz - 10 - (y - y0) * s2)
                elif nm == 'side': uu, vv = int(Sz / 2 + (z - zb) * s2), int(Sz - 10 - (y - y0) * s2)
                else: uu, vv = int(Sz / 2 - (x - xm) * s2), int(Sz / 2 + (z - zb) * s2)
                if 0 <= uu < Sz and 0 <= vv < Sz: px[uu, vv] = cl
            im.save(os.path.join(dbg, tag + '_' + nm + '.png'))


def main():
    args = sys.argv[1:]
    dbg = None; parent = 'Spine'
    if '--debug' in args: k = args.index('--debug'); dbg = args[k + 1]; del args[k:k + 2]
    if '--parent' in args: k = args.index('--parent'); parent = args[k + 1]; del args[k:k + 2]
    soft = '--soft' in args
    if soft: args.remove('--soft')
    opt = {'far': 0.07, 'band': 0.06, 'back': 0.02, 'low': 0.3, 'high': 1.6, 'side': 0.03}
    for k0 in list(opt):
        if '--' + k0 in args: k = args.index('--' + k0); opt[k0] = float(args[k + 1]); del args[k:k + 2]
    if len(args) != 2: print(__doc__); sys.exit(1)
    src, dst = args
    j, b = bs.read(src); G = bs.globals_(j)
    sk = j['skins'][0]; J = list(sk['joints'])
    IBM = bs.acc(j, b, sk['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
    S = G[J[0]] @ IBM[0]   # the bind shape (identity on a Meshy export)
    p = j['meshes'][0]['primitives'][0]
    P = bs.acc(j, b, p['attributes']['POSITION']).astype(float); P = (np.c_[P, np.ones(len(P))] @ S.T)[:, :3]
    I = bs.acc(j, b, p['indices']).reshape(-1, 3).astype(int)
    if soft: return soft_main(j, b, G, sk, J, IBM, S, p, P, I, parent, opt, dst, src, dbg)
    roots = pieces(P, I)
    u, cnt = np.unique(roots, return_counts=True)
    body = u[np.argmax(cnt)]
    zb = np.percentile(P[roots == body][:, 2], 50)
    wings = {}
    for k in np.argsort(-cnt):
        if u[k] == body or cnt[k] < 300: continue
        m = roots == u[k]; Q = P[m]
        cx = Q[:, 0].mean()
        if abs(cx) < 0.12 or Q[:, 2].mean() > zb: continue   # a wing stands out to one side, behind the back
        side = 'L' if cx > 0 else 'R'
        if side not in wings: wings[side] = m
        if len(wings) == 2: break
    if len(wings) != 2: sys.exit('bake-wings: found %d wing pieces (need 2) -- are the wings loose pieces in this file?' % len(wings))
    par = next(k for k, n in enumerate(j['nodes']) if n['name'] == parent)
    Gp = G[par]; sc = np.linalg.norm(Gp[:3, 0])
    newJ = []; newIBM = []; j0 = len(J)
    for side in ('L', 'R'):
        Q = P[wings[side]]
        ax = np.abs(Q[:, 0]); near = Q[ax < ax.min() + 0.03]
        pos = near.mean(0)   # the root: the wing's inner edge, on the back
        T = np.eye(4); T[:3, 3] = pos; L = np.linalg.inv(Gp) @ T
        R = L[:3, :3] * sc   # the parent's scale out: a unit rotation
        ni = len(j['nodes'])
        j['nodes'].append({'name': 'ewwing_' + side, 'translation': L[:3, 3].tolist(), 'rotation': [float(v) for v in bs.m_quat(R)]})
        j['nodes'][par].setdefault('children', []).append(ni)
        newJ.append(ni)
        # the inverse bind = the inverse of the bone's REAL world matrix (it inherits the parent's scale: a Meshy armature is
        # 0.01, so a plain -pos inverse shrank each wing 100x to its root and the wings vanished; fixed 11-23 the same day)
        Lb = np.eye(4); Lb[:3, :3] = R; Lb[:3, 3] = L[:3, 3]
        newIBM.append((np.linalg.inv(Gp @ Lb) @ S).T.reshape(16))
        print('bake-wings: wing %s · %d vertices · root %s' % (side, int(wings[side].sum()), np.round(pos, 3).tolist()))
    sk['joints'] = J + newJ
    sk['inverseBindMatrices'] = bs.append_acc(j, b, np.vstack([IBM.transpose(0, 2, 1).reshape(-1, 16), np.array(newIBM)]), 5126, 'MAT4')
    Ji = bs.acc(j, b, p['attributes']['JOINTS_0']).astype(int); Wt = bs.acc(j, b, p['attributes']['WEIGHTS_0']).astype(float)
    for k, side in enumerate(('L', 'R')):
        m = wings[side]
        Ji[m] = [j0 + k, 0, 0, 0]; Wt[m] = [1.0, 0, 0, 0]
    p['attributes']['JOINTS_0'] = bs.append_acc(j, b, Ji, 5121 if len(sk['joints']) < 256 else 5123, 'VEC4', 34962)
    p['attributes']['WEIGHTS_0'] = bs.append_acc(j, b, Wt, 5126, 'VEC4', 34962)
    j['asset'].setdefault('extras', {})['ewWings'] = {'parent': parent, 'bones': ['ewwing_L', 'ewwing_R']}
    bs.write(dst, j, b)
    print('bake-wings: %s -> %s · two wing bones on %s' % (src, dst, parent))
    if dbg:
        from PIL import Image
        os.makedirs(dbg, exist_ok=True); Sz = 600; im = Image.new('RGB', (Sz, Sz), (30, 30, 30)); px = im.load(); s2 = (Sz - 20) / max(1e-6, P[:, 1].max())
        wm = wings['L'] | wings['R']
        for k in np.argsort(-P[:, 2]):
            x, y, z = P[k]; cl = (255, 60, 60) if wm[k] else (90, 90, 110)
            uu, vv = int(Sz / 2 - x * s2), int(Sz - 10 - y * s2)
            if 0 <= uu < Sz and 0 <= vv < Sz: px[uu, vv] = cl
        im.save(os.path.join(dbg, 'wings_back.png'))


if __name__ == '__main__':
    main()
