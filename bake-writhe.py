#!/usr/bin/env python3
"""bake-writhe.py -- THE WRITHING TENTACLES (2026-11-28, mondo: "the octopus girl with her tentacles separately moving, also
want to redo the kraken with separate moving tentacles too").

A Meshy rig has no bones in a tentacle: the Kraken's ten arms ride its biped's legs, arms and hips, and the Octopus Girl's
hair of tentacles rides her head and shoulders, so they stand stiff. This tool lays ONE chain of spring bones down each
tentacle, `ewsway_c<col>_0..N` (three-renderer.js THE SWAY swings them after every clip; with the race's `sway.wave` a slow
wave runs down each one, a phase a chain, so they writhe on their own while the body plays its library clips), and blends
each tentacle's skin from its old weights at the root onto its chain. Nothing is cut; the rig's own bones, rest pose and
inverse binds are kept as they are (like bake-tail.py, bake-sway.py, bake-wings.py).

    python3 -I bake-writhe.py --arms <in.glb> <out.glb> [--min 0.15] [--mirror 1] [--parent Hips] [--free LeftArm,RightArm] [--smooth 4] [--joints 6] [--band 0.05] [--col 0] [--debug <dir>]
    python3 -I bake-writhe.py --hair <in.glb> <out.glb> [--cols 10] [--joints 5] [--root 0.04] [--debug <dir>]

--arms (a squid, an octopus, a jellyfish's arms): the tentacles are the long branches of the body, found by the shortest way
  over the skin from the top of the head (a watershed with persistence: a branch shorter than --min of the height is a bump,
  not an arm; --mirror 1 adds the twin of a found tip when a fused arm hides it). Each arm's chain hangs on the rig bone that carries most of its root (a leg's arm still strides, an arm's arm
  still swings with the cast, the rest of it trails and writhes; --parent Hips hangs every arm on one bone instead, for a body whose
  clips turn those bones far: the Kraken's idle swung its leg-arms out and webbed them to their neighbours; --free names more
  bones whose skin goes to the nearest arm); --band = how far (of the height) it blends in.
--hair (tentacle hair): the hair is found by its colour (darker and more purple than the skin, smoothed over the skin) and
  hangs from the Head bone in --cols columns round the head, each column a chain from --root (m) above the Head joint down to
  the lowest hair in it; a vertex rides the two nearest columns (by its angle round the head) so the locks part cleanly.

Give the race `sway: { stiffness, gravity, drag, maxRoot, maxBend, wave, waveHz, caps: [] }` (sprites.js; the Kraken's and the
Octopus Girl's rows are the pattern). Needs numpy + pillow. Upload under a NEW name.
"""
import heapq, importlib.util, os, sys, math
import numpy as np

_here = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('bake_sway', os.path.join(_here, 'bake-sway.py'))
bs = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(bs)


def ss(t):
    t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)


class Rig:
    def __init__(self, path):
        self.j, self.b = bs.read(path); j, b = self.j, self.b
        self.G = bs.globals_(j); self.sk = j['skins'][0]; self.J = list(self.sk['joints'])
        self.names = [j['nodes'][k]['name'] for k in self.J]
        self.IBM = bs.acc(j, b, self.sk['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
        self.S = self.G[self.J[0]] @ self.IBM[0]          # mesh space -> the rig's world (bind)
        self.p = j['meshes'][0]['primitives'][0]
        P = bs.acc(j, b, self.p['attributes']['POSITION']).astype(float)
        self.P = (np.c_[P, np.ones(len(P))] @ self.S.T)[:, :3]
        self.I = bs.acc(j, b, self.p['indices']).reshape(-1, 3).astype(int)
        self.Ji = bs.acc(j, b, self.p['attributes']['JOINTS_0']).astype(int)
        self.Wt = bs.acc(j, b, self.p['attributes']['WEIGHTS_0']).astype(float)
        self.H = self.P[:, 1].max() - self.P[:, 1].min()
        key = np.round(self.P * 1e5).astype(np.int64)
        _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
        self.inv = inv.ravel(); self.nU = len(first); self.PU = self.P[first]
        F = self.inv[self.I]; E = np.concatenate([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]])
        E = E[E[:, 0] != E[:, 1]]; E = np.unique(np.sort(E, 1), axis=0); self.E = E
        self.adj = [[] for _ in range(self.nU)]
        L = np.linalg.norm(self.PU[E[:, 0]] - self.PU[E[:, 1]], axis=1)
        for (a, c), w in zip(E, L): self.adj[a].append((c, w)); self.adj[c].append((a, w))
        self.chains = []   # (parent node, [points])

    def node(self, name): return next(k for k, n in enumerate(self.j['nodes']) if n.get('name') == name)

    def geodesic(self, seeds, parents=False):
        d = np.full(self.nU, np.inf); hq = []; up = np.full(self.nU, -1)
        for s in seeds: d[s] = 0.0; heapq.heappush(hq, (0.0, int(s)))
        while hq:
            g0, a = heapq.heappop(hq)
            if g0 > d[a]: continue
            for c, w in self.adj[a]:
                if g0 + w < d[c]: d[c] = g0 + w; up[c] = a; heapq.heappush(hq, (d[c], c))
        return (d, up) if parents else d

    def add_chain(self, parent, pts):
        col = len(self.chains); self.chains.append((parent, np.array(pts))); return col

    def write(self, dst, W, blend, col0, extras):
        """W: per mesh vertex a dict {(chain, bone): weight} summing to 1 (or empty); blend: 0..1 how much of it replaces the
        vertex's own weights."""
        j, b = self.j, self.b; nJ = len(self.J); newJ = []; newIBM = []; base = {}
        for c, (parent, pts) in enumerate(self.chains):
            pr = self.node(parent); Gp = self.G[pr]; sc = np.linalg.norm(Gp[:3, 0]); prev = None; base[c] = nJ + len(newJ)
            for k, q in enumerate(pts):
                ni = len(j['nodes']); nm = 'ewsway_c%d_%d' % (col0 + c, k)
                if k == 0:
                    T = np.eye(4); T[:3, 3] = q; Lm = np.linalg.inv(Gp) @ T; R = Lm[:3, :3] * sc
                    j['nodes'].append({'name': nm, 'translation': Lm[:3, 3].tolist(), 'rotation': [float(v) for v in bs.m_quat(R)]})
                    j['nodes'][pr].setdefault('children', []).append(ni)
                else:
                    j['nodes'].append({'name': nm, 'translation': ((q - pts[k - 1]) / sc).tolist()})
                    j['nodes'][prev].setdefault('children', []).append(ni)
                Wm = np.eye(4) * sc; Wm[3, 3] = 1; Wm[:3, 3] = q
                newIBM.append((np.linalg.inv(Wm) @ self.S).T.reshape(16)); newJ.append(ni); prev = ni
        Ji, Wt = self.Ji, self.Wt; moved = 0
        for v in range(len(self.P)):
            t = blend[v]
            if t <= 0.001 or not W[v]: continue
            acc = {}
            for q in range(4):
                if Wt[v, q] > 0: acc[int(Ji[v, q])] = acc.get(int(Ji[v, q]), 0) + Wt[v, q] * (1 - t)
            for (c, k), w in W[v].items(): acc[base[c] + k] = acc.get(base[c] + k, 0) + w * t
            top = sorted(acc.items(), key=lambda kv: -kv[1])[:4]; s = sum(w for _, w in top)
            Ji[v] = [k for k, _ in top] + [0] * (4 - len(top)); Wt[v] = [w / s for _, w in top] + [0] * (4 - len(top)); moved += 1
        self.sk['joints'] = self.J + newJ
        self.sk['inverseBindMatrices'] = bs.append_acc(j, b, np.vstack([self.IBM.transpose(0, 2, 1).reshape(-1, 16), np.array(newIBM)]), 5126, 'MAT4')
        self.p['attributes']['JOINTS_0'] = bs.append_acc(j, b, Ji, 5121 if len(self.sk['joints']) < 256 else 5123, 'VEC4', 34962)
        self.p['attributes']['WEIGHTS_0'] = bs.append_acc(j, b, Wt, 5126, 'VEC4', 34962)
        j['asset'].setdefault('extras', {})['ewWrithe'] = extras
        bs.write(dst, j, b)
        return moved


def chain_weights(u, NJ):
    """a vertex u (0 root .. 1 tip) down a chain of NJ joints -> {bone: w} over its NJ-1 bones"""
    s = float(np.clip(u * (NJ - 1) - 0.5, 0, NJ - 2 - 1e-6)); k = int(s); fr = s - k; fr = fr * fr * (3 - 2 * fr)
    if k + 1 > NJ - 2: return {k: 1.0}
    return {k: 1 - fr, k + 1: fr}


def arms(R, opt):
    H = R.H; PU = R.PU; nU = R.nU
    top = int(np.argmax(PU[:, 1])); d, up = R.geodesic([top], parents=True)
    d[~np.isfinite(d)] = 0
    # 1. where the arms start: a persistence watershed, highest d first (a branch shorter than --min is a bump)
    order = np.argsort(-d); lab = np.full(nU, -1); par = {}; peak = {}; basev = {}
    def f(x):
        while par[x] != x: par[x] = par[par[x]]; x = par[x]
        return x
    minL = opt['min'] * H
    for v in order:
        roots = {f(lab[c]) for c, _ in R.adj[v] if lab[c] >= 0}
        if not roots: lab[v] = v; par[v] = v; peak[v] = d[v]; continue
        rs = sorted(roots, key=lambda r: -peak[r]); main = rs[0]
        for r in rs[1:]:
            if r in basev: continue
            if peak[r] - d[v] < minL: par[r] = main
            else: basev[r] = d[v]
        lab[v] = main
    if not basev: return [None] * len(R.P), np.zeros(len(R.P)), np.full(nU, -1)
    base0 = float(np.median(list(basev.values())))
    if opt['persist']: print('  arm base at %.2f of the height down the skin, %d branches' % (base0 / H, len(basev)))
    # 2. the tips: the far ends of the skin (two arms that touch along their length still keep two tips)
    if opt['persist']:   # --persist 1: one tip per branch the watershed kept (the new kraken's suckers and curls made many false tips)
        tips = [r for r in basev] + [f(int(order[0]))]
        tips = [v for v in tips if d[v] - base0 > minL]
    else: tips = [v for v in range(nU) if d[v] - base0 > minL and all(d[v] >= d[c] for c, _ in R.adj[v])]
    tips.sort(key=lambda v: -d[v]); keep = []
    for v in tips:
        if all(np.linalg.norm(PU[v] - PU[k]) > 0.06 * H for k in keep): keep.append(v)
    # 3. each tip's way back to the head over the skin = its arm's line; a vertex goes with the nearest line
    lines = []
    for tv in keep:
        path = [tv]
        while up[path[-1]] >= 0 and d[path[-1]] > base0: path.append(up[path[-1]])
        path = np.array(path[::-1]); lines.append((PU[path], d[path]))
    if opt['mirror']:   # a Meshy body is near mirror-even: an arm fused to a neighbour at the tip takes its twin's line, mirrored
        for i, v in enumerate(list(keep)):
            q = PU[v] * [-1, 1, 1]
            if all(np.linalg.norm(q - PU[o]) > 0.06 * H for o in keep):
                k = int(np.argmin(np.linalg.norm(PU - q, axis=1)))
                if np.linalg.norm(PU[k] - q) < 0.03 * H: keep.append(k); lines.append((lines[i][0] * [-1, 1, 1], lines[i][1]))
    allpos = np.concatenate([l[0] for l in lines]); alld = np.concatenate([l[1] for l in lines])
    owner = np.concatenate([np.full(len(l[0]), i) for i, l in enumerate(lines)]); allp = np.arange(len(allpos))
    cand = np.nonzero(d >= base0 - opt['band'] * H)[0]
    best = np.full(nU, np.inf); who = np.full(nU, -1); near = np.full(nU, -1)
    for s0 in range(0, len(allp), 256):
        Q = allpos[s0:s0 + 256]; D = np.linalg.norm(PU[cand][:, None, :] - Q[None], axis=2)
        k = D.argmin(1); dm = D[np.arange(len(cand)), k]; bt = dm < best[cand]
        best[cand[bt]] = dm[bt]; who[cand[bt]] = owner[s0 + k[bt]]; near[cand[bt]] = allp[s0 + k[bt]]
    NJ = opt['joints']; band = opt['band'] * H
    W = [None] * len(R.P); blend = np.zeros(len(R.P)); label = np.full(nU, -1); made = {}
    for i, tv in enumerate(keep):
        ln = lines[i][1][-1] - base0
        m = (who == i) & (best < opt['reach'] * H); idx = np.nonzero(m)[0]
        if len(idx) < 30: continue
        u = np.clip((alld[near[idx]] - base0) / ln, 0, 1)
        pts = [PU[idx[np.argsort(np.abs(u - k / (NJ - 1)))[:12]]].mean(0) for k in range(NJ)]
        ring = np.isin(R.inv, idx[u < 0.1]); ws = np.zeros(len(R.J))
        for q in range(4): np.add.at(ws, R.Ji[ring, q], R.Wt[ring, q])
        parent = opt['parent'] or R.names[int(np.argmax(ws))]
        c = R.add_chain(parent, pts); label[idx] = c; made[c] = (i, ln, parent)
        uu = np.zeros(nU); uu[idx] = u; tb = np.zeros(nU); tb[idx] = ss(u * ln / band)
        for v in np.nonzero(np.isin(R.inv, idx))[0]:
            W[v] = {(c, k): w for k, w in chain_weights(uu[R.inv[v]], NJ).items()}; blend[v] = tb[R.inv[v]]
        print('  arm %d: on %s, %d vertices, length %.2f of the height, tip %s' % (c, parent, int(np.isin(R.inv, idx).sum()), ln / H, PU[tv].round(2).tolist()))
    # the bones the arms took over (a biped's forearm, hand, shin, foot in a squid's arm): what is still on them would stay behind and
    # tear, so it goes to its nearest arm too, as much of it as rode those bones
    nJ = len(R.J); mass = np.zeros(nJ); moved = np.zeros(nJ); big = blend > 0.5
    for q in range(4): np.add.at(mass, R.Ji[:, q], R.Wt[:, q]); np.add.at(moved, R.Ji[big, q], R.Wt[big, q])
    parents = {R.names.index(pp) for _, _, pp in made.values()}
    axial = lambda n: n in ('Hips', 'Spine02', 'Spine01', 'Spine', 'neck', 'Head')   # the body's own column is never freed (the new kraken's mantle went with its arms)
    freed = [k for k in range(nJ) if (mass[k] > 0 and moved[k] / mass[k] > 0.5 and k not in parents and not axial(R.names[k])) or R.names[k] in opt['free'].split(',')]
    left = 0; byc = {ii: cc for cc, (ii, _, _) in made.items()}
    for v in range(len(R.P)):
        fw = sum(R.Wt[v, q] for q in range(4) if R.Ji[v, q] in freed)
        if fw < 0.02: continue
        if W[v]: blend[v] = max(blend[v], min(1.0, fw)); continue
        uv = R.inv[v]; D = np.linalg.norm(allpos - PU[uv], axis=1); k = int(np.argmin(D)); i = int(owner[k])
        if i not in byc: continue
        c = byc[i]; _, ln, _ = made[c]; u = float(np.clip((alld[k] - base0) / ln, 0, 1))
        W[v] = {(c, kk): w for kk, w in chain_weights(u, NJ).items()}; blend[v] = max(blend[v], min(1.0, fw)); label[uv] = c; left += 1
    print('  the bones the arms took over: %s; %d vertices left on them moved to their arm' % ([R.names[k] for k in freed], left))
    return W, blend, label


def hair(R, opt):
    j, b = R.j, R.b; PU = R.PU; nU = R.nU; H = R.H
    from PIL import Image
    import io
    mat = j['materials'][R.p.get('material', 0)]; ti = mat['pbrMetallicRoughness']['baseColorTexture']['index']
    im = j['images'][j['textures'][ti]['source']]; bv = j['bufferViews'][im['bufferView']]
    T = np.asarray(Image.open(io.BytesIO(bytes(b[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]))).convert('RGB'), float) / 255
    UV = bs.acc(j, b, R.p['attributes']['TEXCOORD_0']); h_, w_ = T.shape[:2]
    C = T[(UV[:, 1] % 1 * (h_ - 1)).astype(int), (UV[:, 0] % 1 * (w_ - 1)).astype(int)]
    cnt = np.bincount(R.inv, minlength=nU); CU = np.stack([np.bincount(R.inv, C[:, k], nU) / cnt for k in range(3)], 1)
    mx = CU.max(1); sat = (mx - CU.min(1)) / np.maximum(mx, 1e-3)
    f = np.clip((sat - opt['sat']) / 0.08, 0, 1) * np.clip((opt['val'] - mx) / 0.08, 0, 1)
    E = np.concatenate([R.E, R.E[:, ::-1]]); deg = np.bincount(E[:, 0], minlength=nU)
    for _ in range(8): f = 0.5 * f + 0.5 * np.bincount(E[:, 0], f[E[:, 1]], nU) / np.maximum(deg, 1)
    head = R.G[R.node('Head')][:3, 3]; y0 = head[1] + opt['root']
    hv = f > 0.5; reach = hv & (PU[:, 1] >= y0); st = list(np.nonzero(reach)[0])   # only the hair that hangs from the scalp
    while st:
        a = st.pop()
        for c, _ in R.adj[a]:
            if hv[c] and not reach[c]: reach[c] = True; st.append(c)
    hairv = reach & (PU[:, 1] < y0)
    if opt['cut']:   # --cut <part of the height> (the remade Octopus Girl, 11-28: her hair's colour is her skin's): below that line the hair
        # hangs free of the body, so the hair = every piece of the skin under the line that is not the biggest (the body)
        y0 = opt['cut'] * H; below = PU[:, 1] < y0; pr = np.arange(nU)
        def fr(x):
            while pr[x] != x: pr[x] = pr[pr[x]]; x = pr[x]
            return x
        for a, c in R.E:
            if below[a] and below[c]:
                ra, rc = fr(a), fr(c)
                if ra != rc: pr[ra] = rc
        rt = np.array([fr(v) for v in range(nU)]); u_, cn = np.unique(rt[below], return_counts=True); body = u_[np.argmax(cn)]
        hairv = below & (rt != body); reach = hairv | ~below
        print('  the cut at %.2f m: %d hair vertices in %d pieces' % (y0, int(hairv.sum()), len(u_) - 1))
    if opt['locks']: return locks(R, opt, reach, hairv, head, y0)
    th = np.arctan2(PU[:, 0] - head[0], PU[:, 2] - head[2])          # 0 = the face, +-pi = the back
    NC = opt['cols']; NJ = opt['joints']
    # the columns spread over the angles the hanging hair takes (the face is open)
    hang = hairv & (PU[:, 1] < y0 - 0.12)
    lo, hi = np.percentile(np.mod(th[hang], 2 * np.pi), [2, 98])
    cols = np.linspace(lo, hi, NC); sig = (hi - lo) / (NC - 1)
    W = [None] * len(R.P); blend = np.zeros(len(R.P)); label = np.full(nU, -1); made = []
    for ci, a in enumerate(cols):
        dth = np.abs((np.mod(th, 2 * np.pi) - a + np.pi) % (2 * np.pi) - np.pi)
        m = hairv & (dth < sig * 0.75)
        if m.sum() < 20: made.append(None); continue
        ylow = np.percentile(PU[m, 1], 1)
        if y0 - ylow < 0.1: made.append(None); continue
        pts = []
        for k in range(NJ):
            yk = y0 - (y0 - ylow) * k / (NJ - 1); mm = m & (np.abs(PU[:, 1] - yk) < (y0 - ylow) / (NJ - 1) * 0.6)
            pts.append(PU[mm].mean(0) if mm.sum() >= 3 else pts[-1] + (pts[-1] - pts[-2] if len(pts) > 1 else [0, -0.05, 0]))
        pts[0] = np.array([head[0] + (pts[1][0] - head[0]) * 0.5, y0, head[2] + (pts[1][2] - head[2]) * 0.5])
        made.append((R.add_chain('Head', pts), ylow))
    live = [(ci, a, m_) for ci, (a, m_) in enumerate(zip(cols, made)) if m_]
    for v in range(len(R.P)):
        uv = R.inv[v]
        if not hairv[uv]: continue
        dd = [(abs(((th[uv] % (2 * np.pi)) - a + np.pi) % (2 * np.pi) - np.pi), c, ylow) for _, a, (c, ylow) in live]
        dd.sort(); two = dd[:2]; g = np.array([math.exp(-(x[0] / (sig * 0.55)) ** 2) for x in two]) + 1e-6; g /= g.sum()
        if g[0] > 0.8: two, g = two[:1], np.array([1.0])
        w = {}
        for (x, c, ylow), gg in zip(two, g):
            u = (y0 - PU[uv, 1]) / max(1e-6, y0 - ylow)
            for k, ww in chain_weights(u, NJ).items(): w[(c, k)] = w.get((c, k), 0) + ww * gg
        W[v] = w; label[uv] = two[0][1]
        blend[v] = ss((y0 - PU[uv, 1]) / opt['fade']) * ss((f[uv] - 0.5) / 0.3)
    return W, blend, label


def locks(R, opt, reach, hairv, head, y0):
    """--locks: one chain down each hanging lock of the hair. The way over the hair from the scalp (above y0) to every
    vertex; a lock's tip is a far end of it; the tip's way back to the scalp is the lock's line; every hanging hair vertex goes with the
    nearest line."""
    PU = R.PU; nU = R.nU; H = R.H; NJ = opt['joints']
    d = np.full(nU, np.inf); up = np.full(nU, -1); hq = []
    for v in np.nonzero(reach & (PU[:, 1] >= y0))[0]: d[v] = 0.0; heapq.heappush(hq, (0.0, int(v)))
    while hq:
        g0, a = heapq.heappop(hq)
        if g0 > d[a]: continue
        for c, w in R.adj[a]:
            if reach[c] and g0 + w < d[c]: d[c] = g0 + w; up[c] = a; heapq.heappush(hq, (d[c], c))
    minL = opt['min'] * H
    tips = [v for v in np.nonzero(hairv)[0] if np.isfinite(d[v]) and d[v] > minL and all(d[v] >= d[c] for c, _ in R.adj[v] if reach[c])]
    tips.sort(key=lambda v: -d[v]); keep = []
    for v in tips:
        if all(np.linalg.norm(PU[v] - PU[k]) > opt['apart'] * H for k in keep): keep.append(v)
    keep = keep[:opt['cols']]
    lines = []
    for tv in keep:
        path = [tv]
        while up[path[-1]] >= 0: path.append(up[path[-1]])
        path = np.array(path[::-1]); lines.append((PU[path], d[path]))
    allpos = np.concatenate([l[0] for l in lines]); alld = np.concatenate([l[1] for l in lines])
    owner = np.concatenate([np.full(len(l[0]), i) for i, l in enumerate(lines)])
    hv = np.nonzero(hairv)[0]; best = np.full(nU, np.inf); who = np.full(nU, -1); near = np.full(nU, -1)
    for s0 in range(0, len(allpos), 256):
        D = np.linalg.norm(PU[hv][:, None, :] - allpos[None, s0:s0 + 256], axis=2); k = D.argmin(1); dm = D[np.arange(len(hv)), k]
        bt = dm < best[hv]; best[hv[bt]] = dm[bt]; who[hv[bt]] = owner[s0 + k[bt]]; near[hv[bt]] = s0 + k[bt]
    W = [None] * len(R.P); blend = np.zeros(len(R.P)); label = np.full(nU, -1); ch = {}
    for i, (pos, dd) in enumerate(lines):
        ln = dd[-1]; idx = np.nonzero(who == i)[0]
        if len(idx) < 20: continue
        u = np.clip(alld[near[idx]] / ln, 0, 1)
        pts = [pos[0]] + [PU[idx[np.argsort(np.abs(u - k / (NJ - 1)))[:10]]].mean(0) for k in range(1, NJ)]
        ch[i] = (R.add_chain('Head', pts), ln, u, idx)
    f = None
    for i, (c, ln, u, idx) in ch.items():
        label[idx] = c; uu = np.zeros(nU); uu[idx] = u
        for v in np.nonzero(np.isin(R.inv, idx))[0]:
            uv = R.inv[v]; W[v] = {(c, k): w for k, w in chain_weights(uu[uv], NJ).items()}
            blend[v] = ss((y0 - PU[uv, 1]) / opt['fade'])
        print('  lock %d: %d vertices, length %.2f m, tip %s' % (c, len(idx), ln, PU[keep[i]].round(2).tolist()))
    return W, blend, label


def smooth(R, W, blend, iters):
    """--smooth N: spread the chain weights over the skin N times (each vertex takes half its own, half its neighbours' mean), so two
    locks or arms fused along their length part with a soft seam instead of a tear."""
    keys = sorted({k for w in W if w for k in w}); ki = {k: i for i, k in enumerate(keys)}; nU = R.nU
    M = np.zeros((nU, len(keys))); B = np.zeros(nU); cnt = np.zeros(nU)
    for v, w in enumerate(W):
        uv = R.inv[v]; cnt[uv] += 1; B[uv] += blend[v]
        if w:
            for k, x in w.items(): M[uv, ki[k]] += x
    M /= np.maximum(cnt, 1)[:, None]; B /= np.maximum(cnt, 1)
    E = np.concatenate([R.E, R.E[:, ::-1]]); deg = np.bincount(E[:, 0], minlength=nU)
    touched = (M.sum(1) > 0) | (B > 0)
    for _ in range(iters):
        nb = np.zeros_like(M); np.add.at(nb, E[:, 0], M[E[:, 1]]); nb /= np.maximum(deg, 1)[:, None]
        nbB = np.bincount(E[:, 0], B[E[:, 1]], nU) / np.maximum(deg, 1)
        M = np.where(touched[:, None], 0.5 * M + 0.5 * nb, M); B = np.where(touched, 0.5 * B + 0.5 * nbB, B)
    W2 = [None] * len(W); b2 = np.zeros(len(W))
    for v in range(len(W)):
        uv = R.inv[v]; row = M[uv]
        if row.sum() <= 1e-6: continue
        o = np.argsort(-row)[:3]; o = o[row[o] > 0.02]; t = row[o].sum()
        W2[v] = {keys[i]: row[i] / t for i in o}; b2[v] = B[uv] if W[v] else B[uv] * min(1.0, row.sum())
    return W2, b2


def debug(R, label, dst, path):
    from PIL import Image
    os.makedirs(path, exist_ok=True); Sz = 500; H = R.H; P = R.PU; y0 = P[:, 1].min(); xm = np.median(P[:, 0]); zb = np.median(P[:, 2])
    pal = [(230, 80, 80), (80, 200, 80), (80, 120, 240), (240, 200, 60), (200, 80, 220), (60, 220, 220), (250, 140, 40),
           (160, 160, 255), (255, 160, 200), (140, 255, 140), (200, 200, 200), (255, 255, 0)]
    im = Image.new('RGB', (Sz * 3, Sz), (30, 30, 30)); px = im.load(); s2 = (Sz - 20) / (H * 1.3)
    for view in range(3):
        key = [-P[:, 2], -np.abs(P[:, 0] - xm), P[:, 2]][view]
        for k in np.argsort(key):
            x, y, z = P[k]; a = [x - xm, z - zb, -(x - xm)][view]
            cl = pal[label[k] % len(pal)] if label[k] >= 0 else (90, 90, 110)
            A = int(Sz / 2 + a * s2); Cc = int(Sz - 10 - (y - y0) * s2)
            if 0 <= A < Sz and 0 <= Cc < Sz: px[view * Sz + A, Cc] = cl
        for _, pts in R.chains:
            for q in pts:
                a = [q[0] - xm, q[2] - zb, -(q[0] - xm)][view]; A = int(Sz / 2 + a * s2); Cc = int(Sz - 10 - (q[1] - y0) * s2)
                for da in range(-2, 3):
                    for dc in range(-2, 3):
                        if 0 <= A + da < Sz and 0 <= Cc + dc < Sz: px[view * Sz + A + da, Cc + dc] = (255, 255, 255)
    im.save(os.path.join(path, os.path.splitext(os.path.basename(dst))[0] + '_writhe.png'))


def main():
    args = sys.argv[1:]
    if not args or args[0] not in ('--arms', '--hair'): print(__doc__); sys.exit(1)
    mode = args.pop(0)[2:]
    opt = {'min': 0.15, 'joints': 6 if mode == 'arms' else 5, 'band': 0.05, 'col': 0, 'cols': 10, 'root': 0.04, 'fade': 0.08,
           'sat': 0.15, 'val': 0.72, 'debug': None, 'reach': 0.08, 'mirror': 0, 'locks': 0, 'apart': 0.04, 'smooth': 0, 'parent': '', 'free': '', 'persist': 0, 'cut': 0}
    for k0 in list(opt):
        if '--' + k0 in args:
            k = args.index('--' + k0); v = args[k + 1]; del args[k:k + 2]
            opt[k0] = v if k0 in ('debug', 'parent', 'free') else (int(v) if k0 in ('joints', 'col', 'cols', 'mirror', 'locks', 'smooth', 'persist') else float(v))
    if len(args) != 2: print(__doc__); sys.exit(1)
    src, dst = args
    R = Rig(src)
    W, blend, label = (arms if mode == 'arms' else hair)(R, opt)
    if not R.chains: sys.exit('bake-writhe: no %s found' % mode)
    if opt['smooth']: W, blend = smooth(R, W, blend, opt['smooth'])
    moved = R.write(dst, W, blend, opt['col'], {'mode': mode, 'chains': len(R.chains), 'joints': opt['joints']})
    print('bake-writhe %s: %s · %d chains of %d joints · %d vertices moved' % (mode, os.path.basename(dst), len(R.chains), opt['joints'], moved))
    if opt['debug']: debug(R, label, dst, opt['debug'])


if __name__ == '__main__':
    main()
