#!/usr/bin/env python3
"""bake-tail.py -- THE LOOSE TAILS (2026-11-27, THE LOOSE WINGS EVERYWHERE: mondo "any other units ... would benefit from one
of their parts getting a separate animation?").

A Meshy biped rig has no tail bones: a tail is weighted to the hips and the legs, so it stands stiff and splits with every
stride. This tool finds the tail (the skin behind and below the hips that is far from every bone of the rig, in one piece,
narrow), lays ONE chain of spring bones down it, `ewsway_c<col>_0..N` (three-renderer.js THE SWAY swings them at run time:
it lags, whips and settles back to its modelled curl), and blends every tail vertex from its old weights at the root to
the chain. Nothing is cut and everything else in the file is kept byte for byte, like bake-sway.py / bake-wings.py (run it
after bake-wings.py on a body that has both).

    python3 -I bake-tail.py <in.glb> <out.glb> [--parent Hips] [--joints 6] [--col 0] [--far 0.05] [--band 0.05]
                            [--back 0.0] [--high 0.62] [--wide 0.5] [--debug <dir>]

--far / --band: how far from the bones the tail starts and over what distance it blends in (parts of the height);
--back: how far behind the middle of the body a tail vertex must sit; --high: the top of the height band; --wide: the
widest a tail may be (a gown's hem is not a tail). Needs numpy (+ pillow for --debug). Upload under a NEW name and give
the race `sway: { stiffness: 2.2, gravity: 0.1, drag: 0.3, maxRoot: 35, maxBend: 22, wave: 0.5, waveHz: 0.4, caps: [] }`.
"""
import heapq, importlib.util, os, sys
import numpy as np

_here = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('bake_sway', os.path.join(_here, 'bake-sway.py'))
bs = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(bs)


def main():
    args = sys.argv[1:]
    opt = {'parent': 'Hips', 'joints': 6, 'col': 0, 'far': 0.05, 'band': 0.05, 'back': 0.0, 'high': 0.62, 'wide': 0.5, 'debug': None, 'low': -1.0, 'reach': 0.1}
    for k0 in list(opt):
        if '--' + k0 in args:
            k = args.index('--' + k0); v = args[k + 1]; del args[k:k + 2]
            opt[k0] = v if k0 in ('parent', 'debug') else (int(v) if k0 in ('joints', 'col') else float(v))
    if len(args) != 2: print(__doc__); sys.exit(1)
    src, dst = args
    j, b = bs.read(src); G = bs.globals_(j)
    sk = j['skins'][0]; J = list(sk['joints']); names = [j['nodes'][k]['name'] for k in J]
    IBM = bs.acc(j, b, sk['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
    S = G[J[0]] @ IBM[0]
    p = j['meshes'][0]['primitives'][0]
    P = bs.acc(j, b, p['attributes']['POSITION']).astype(float); P = (np.c_[P, np.ones(len(P))] @ S.T)[:, :3]
    I = bs.acc(j, b, p['indices']).reshape(-1, 3).astype(int)
    Ji = bs.acc(j, b, p['attributes']['JOINTS_0']).astype(int); Wt = bs.acc(j, b, p['attributes']['WEIGHTS_0']).astype(float)
    H = P[:, 1].max() - P[:, 1].min(); y0 = P[:, 1].min()
    par_of = {c: i for i, n in enumerate(j['nodes']) for c in n.get('children', [])}
    Jset = set(J); d = np.full(len(P), 1e9)
    extra = np.array([nm.startswith('ewwing_') or nm.startswith('ewsway_') for nm in names])
    for qi, n in enumerate(J):
        if extra[qi]: continue
        a = G[n][:3, 3]
        d = np.minimum(d, np.linalg.norm(P - a, axis=1))
        if n in par_of and par_of[n] in Jset:
            q = G[par_of[n]][:3, 3]
            if np.linalg.norm(a - q) > 1e-6: d = np.minimum(d, bs.segd(P, q, a))
    taken = np.zeros(len(P), bool)   # a wing's or a cape's vertices are not a tail
    for qi in np.nonzero(extra)[0]: taken |= ((Ji == qi) & (Wt > 0.01)).any(1)
    zb = np.median(P[:, 2]); xm = np.median(P[:, 0]); yy = (P[:, 1] - y0) / H
    hips = G[next(k for k, n in enumerate(j['nodes']) if n['name'] == opt['parent'])][:3, 3]
    cand = (d > opt['far'] * H) & (P[:, 2] < zb - opt['back'] * H) & (yy < opt['high']) & (yy > opt['low']) & ~taken
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
    for a, bb, c in I:
        for u, v in ((a, bb), (bb, c), (a, c)):
            if cand[u] and cand[v]: par[f(u)] = f(v)
    rt = np.array([f(i) if cand[i] else -1 for i in range(len(P))])
    u, cnt = np.unique(rt[cand], return_counts=True)
    tail = None
    for k in np.argsort(-cnt):
        m = rt == u[k]; Q = P[m]
        if cnt[k] < 80: break
        wide = (Q[:, 0].max() - Q[:, 0].min()) / H
        root = Q[np.argsort(d[m])[:max(6, len(Q) // 25)]].mean(0)
        reach = np.linalg.norm(Q - root, axis=1).max() / H
        off = abs(root[0] - xm) / H
        if wide > opt['wide'] or reach < opt['reach'] or off > 0.12: continue
        tail = m; break
    if tail is None: sys.exit('bake-tail: no tail found (pieces: %s)' % [int(c) for c in sorted(cnt, reverse=True)[:5]])
    idx = np.nonzero(tail)[0]; Q = P[idx]; loc = {v: i for i, v in enumerate(idx)}
    # how far down the tail each vertex is: the shortest way over the skin from the root
    adj = [[] for _ in idx]
    def link(a, c):
        w = float(np.linalg.norm(P[a] - P[c])); adj[loc[a]].append((loc[c], w)); adj[loc[c]].append((loc[a], w))
    for a, bb, c in I:
        if tail[a] and tail[bb]: link(a, bb)
        if tail[bb] and tail[c]: link(bb, c)
        if tail[a] and tail[c]: link(a, c)
    seenp = {}
    for i, v in enumerate(map(tuple, np.round(Q, 5))):
        if v in seenp: adj[i].append((seenp[v], 0.0)); adj[seenp[v]].append((i, 0.0))
        else: seenp[v] = i
    dd = d[idx]; seeds = np.argsort(dd)[:max(6, len(idx) // 25)]
    root = Q[seeds].mean(0)
    geo = np.full(len(idx), np.inf); hq = []
    for s0 in seeds: geo[s0] = float(np.linalg.norm(Q[s0] - root)); heapq.heappush(hq, (geo[s0], int(s0)))
    while hq:
        g0, a = heapq.heappop(hq)
        if g0 > geo[a]: continue
        for c, w in adj[a]:
            if g0 + w < geo[c]: geo[c] = g0 + w; heapq.heappush(hq, (geo[c], c))
    geo[~np.isfinite(geo)] = np.linalg.norm(Q[~np.isfinite(geo)] - root, axis=1)
    L = np.percentile(geo, 99.5); uu = np.clip(geo / L, 0, 1)
    NJ = opt['joints']; pts = [root]
    for k in range(1, NJ):
        t = k / (NJ - 1); m = np.abs(uu - t) < (0.5 / (NJ - 1) if k < NJ - 1 else 0.06)
        if k == NJ - 1: m = uu > 0.94
        pts.append(Q[m].mean(0) if m.sum() >= 3 else pts[-1] + (pts[-1] - pts[-2] if len(pts) > 1 else np.array([0, 0, -0.05])))
    pts = np.array(pts)
    pr = next(k for k, n in enumerate(j['nodes']) if n['name'] == opt['parent'])
    Gp = G[pr]; sc = np.linalg.norm(Gp[:3, 0])
    j0 = len(J); newJ = []; newIBM = []; prev = None
    for k in range(NJ):
        ni = len(j['nodes']); nm = 'ewsway_c%d_%d' % (opt['col'], k)
        if k == 0:
            T = np.eye(4); T[:3, 3] = pts[0]; Lm = np.linalg.inv(Gp) @ T; R = Lm[:3, :3] * sc
            j['nodes'].append({'name': nm, 'translation': Lm[:3, 3].tolist(), 'rotation': [float(v) for v in bs.m_quat(R)]})
            j['nodes'][pr].setdefault('children', []).append(ni)
        else:
            j['nodes'].append({'name': nm, 'translation': ((pts[k] - pts[k - 1]) / sc).tolist()})
            j['nodes'][prev].setdefault('children', []).append(ni)
        Wm = np.eye(4) * sc; Wm[3, 3] = 1; Wm[:3, 3] = pts[k]   # the bone in the world: the armature's scale, no turn
        newIBM.append((np.linalg.inv(Wm) @ S).T.reshape(16))
        newJ.append(ni); prev = ni
    far, band = opt['far'] * H, opt['band'] * H
    tb = np.clip((dd - far) / band, 0, 1); tb = tb * tb * (3 - 2 * tb)
    full = 0
    for q, vi in enumerate(idx):
        t = tb[q]
        if t <= 0.001: continue
        s = np.clip(uu[q] * (NJ - 1) - 0.5, 0, NJ - 2 - 1e-6); k = int(s); fr = s - k; fr = fr * fr * (3 - 2 * fr)
        if k + 1 > NJ - 2: k, fr = NJ - 2, 0.0
        if t >= 0.999:
            Ji[vi] = [j0 + k, j0 + min(k + 1, NJ - 2), 0, 0]; Wt[vi] = [1 - fr, fr, 0, 0]; full += 1; continue
        w = Wt[vi].copy(); jj = Ji[vi].copy(); o = np.argsort(-w)[:2]; w2 = w[o] / max(1e-9, w[o].sum()) * (1 - t)
        Ji[vi] = [jj[o[0]], jj[o[1]], j0 + k, j0 + min(k + 1, NJ - 2)]; Wt[vi] = [w2[0], w2[1], t * (1 - fr), t * fr]
    sk['joints'] = J + newJ
    sk['inverseBindMatrices'] = bs.append_acc(j, b, np.vstack([IBM.transpose(0, 2, 1).reshape(-1, 16), np.array(newIBM)]), 5126, 'MAT4')
    p['attributes']['JOINTS_0'] = bs.append_acc(j, b, Ji, 5121 if len(sk['joints']) < 256 else 5123, 'VEC4', 34962)
    p['attributes']['WEIGHTS_0'] = bs.append_acc(j, b, Wt, 5126, 'VEC4', 34962)
    j['asset'].setdefault('extras', {})['ewTail'] = {'parent': opt['parent'], 'joints': NJ, 'col': opt['col']}
    bs.write(dst, j, b)
    print('bake-tail: %s · %d vertices (%d wholly on the chain) · %d joints · length %.2f of the height · root %s' % (os.path.basename(dst), len(idx), full, NJ, L / H, np.round(root, 3).tolist()))
    if opt['debug']:
        from PIL import Image
        os.makedirs(opt['debug'], exist_ok=True); Sz = 500; tag = os.path.splitext(os.path.basename(dst))[0]
        im = Image.new('RGB', (Sz * 2, Sz), (30, 30, 30)); px = im.load(); s2 = (Sz - 20) / (H * 1.3)
        ucol = np.zeros(len(P)); ucol[idx] = 0.15 + 0.85 * uu
        for view in (0, 1):
            order = np.argsort(-P[:, 2]) if view == 0 else np.argsort(-np.abs(P[:, 0] - xm))
            for k in order:
                x, y, z = P[k]; t = ucol[k]
                cl = (int(255 * t), int(60 + 180 * (1 - t)), 60) if tail[k] else (90, 90, 110)
                a = int(Sz / 2 - (x - xm) * s2) if view == 0 else int(Sz / 2 + (z - zb) * s2); c = int(Sz - 10 - (y - y0) * s2)
                if 0 <= a < Sz and 0 <= c < Sz: px[view * Sz + a, c] = cl
            for q in pts:
                a = int(Sz / 2 - (q[0] - xm) * s2) if view == 0 else int(Sz / 2 + (q[2] - zb) * s2); c = int(Sz - 10 - (q[1] - y0) * s2)
                for da in range(-3, 4):
                    for dc in range(-3, 4):
                        if 0 <= a + da < Sz and 0 <= c + dc < Sz: px[view * Sz + a + da, c + dc] = (80, 200, 255)
        im.save(os.path.join(opt['debug'], tag + '_tail.png'))


if __name__ == '__main__':
    main()
