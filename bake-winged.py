#!/usr/bin/env python3
"""bake-winged.py -- A WINGED BODY RIGGED IN CODE (2026-11-28, the Harpy + the Moth Queen; mondo: "redo them with more separate parts
animating ... the harpie needs the naturally flapping wings"). Repo-only tooling.

Takes a Meshy TEXTURE-stage GLB (boneless) whose wings are loose pieces of the mesh, and writes a rigged GLB the game plays like any
Meshy unit, with the wings on their own bones:
  1. THE CUT: the wings = every loose piece (not the body's biggest) that sits behind the body's middle depth and out to one side
     (big pieces past `side` of the height off the middle, small feather pieces past `small`; so leg + wrist feather cuffs stay body).
  2. THE RIG: Meshy's own 24 bone names and layout (`char1` mesh, `Armature` at 0.01, each bone's +Y to its child), so the animation
     library retargets onto it. Joints are fitted to the body's own shape: spine + head by slices on the middle line (a straight spine
     fitted through them), hips / knees / ankles by slices of each leg, the arm from its farthest point (the hand) back to the shoulder,
     the wrist + elbow re-centred on slices across the arm. Weights = distance to each bone's segment (a limb only on its own side),
     smoothed over the mesh. Used when Meshy rigging is not to hand (11-28: no credits).
  3. THE WINGS: put back, each wholly on a bone `ewwing_L` / `ewwing_R` hung on Spine at the wing's inner edge, the shoulder blades'
     height, its world turn none (as bake-wings.py), so three-renderer.js _wfSplitBaked shares them down three more bones and
     `sway: { wings: '<beat>' }` beats them.

    python3 -I bake-winged.py <in_texture.glb> <out.glb> [--height 1.7] [--side 0.06] [--small 0.14] [key=value ...] [--debug <dir>]
    python3 -I bake-winged.py <in_texture.glb> <out.glb> --rigged <meshy_rigged_body.glb>   (THE MESHY RIG, the better one: first
        write the body alone with `--body-out body.glb`, send it to Meshy rigging (API /openapi/v1/rigging), then this: the wings go
        back on Meshy's own rig. Used for the Harpy + the Moth Queen, 11-28. Without --rigged = step 2 below, the rig fitted in code.)

key=value overrides a joint's height (part of the height): hips 0.577, sp2 0.632, sp1 0.686, sp 0.743, neck 0.774, head 0.814,
upleg 0.528, knee 0.33, ankle 0.084, shx 0.074 / shy 0.756 (the shoulder), hand 0.28 (the hand's part of the arm), wdown 0.03 (the
wing root under the chest bone), smooth 4. Needs numpy (+ pillow for --debug). Check the cut with --debug before the game (back +
side pictures, wings red / blue), then a posed look. Upload under a NEW name and point sprites.js at it.
"""
import sys, os, json, tempfile, importlib.util
import numpy as np
_here = os.path.dirname(os.path.abspath(__file__))
def _load(nm, f):
    sp = importlib.util.spec_from_file_location(nm, os.path.join(_here, f)); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
bs = _load('bake_sway', 'bake-sway.py'); bw = _load('bake_wings', 'bake-wings.py')


def split(src, out, side_min, back, small_min, dbg):
    j,b=bs.read(src);p=j['meshes'][0]['primitives'][0];A=p['attributes']
    P=bs.acc(j,b,A['POSITION']).astype(float);N=bs.acc(j,b,A['NORMAL']);UV=bs.acc(j,b,A['TEXCOORD_0']);I=bs.acc(j,b,p['indices']).reshape(-1,3).astype(int)
    H=np.ptp(P[:,1]);r=bw.pieces(P,I);u,c=np.unique(r,return_counts=True);body=u[np.argmax(c)]
    zb=np.median(P[r==body][:,2])
    side=np.zeros(len(P),int)  # 0 body, 1 L(+x), -1 R
    for k in u:
      if k==body: continue
      m=r==k;Q=P[m];cx=Q[:,0].mean()
      if Q[:,2].max()<zb+back*H and (abs(cx)>side_min*H if m.sum()>=300 else abs(cx)>small_min*H):
        side[m]=1 if cx>0 else -1
        if m.sum()>50: print('wing piece',m.sum(),'L' if cx>0 else 'R',Q.min(0).round(3),Q.max(0).round(3))
    print('zb',round(zb,3),'wing verts',(side!=0).sum(),'of',len(P))
    tw=(side[I]!=0).all(1)
    mix=(side[I]!=0).any(1)&~tw
    print('mixed tris',mix.sum())
    # body glb, compacted
    keep=np.unique(I[~tw]);remap=-np.ones(len(P),int);remap[keep]=np.arange(len(keep))
    j2=json.loads(json.dumps(j));b2=bytearray(b)
    p2=j2['meshes'][0]['primitives'][0]
    p2['attributes']={'POSITION':bs.append_acc(j2,b2,P[keep].astype(np.float32),5126,'VEC3',34962),'NORMAL':bs.append_acc(j2,b2,N[keep],5126,'VEC3',34962),'TEXCOORD_0':bs.append_acc(j2,b2,UV[keep],5126,'VEC2',34962)}
    a=j2['accessors'][p2['attributes']['POSITION']];a['min']=P[keep].min(0).tolist();a['max']=P[keep].max(0).tolist()
    p2['indices']=bs.append_acc(j2,b2,remap[I[~tw]].reshape(-1).astype(np.uint32),5125,'SCALAR',34963)
    bs.write(out+'_body.glb',j2,b2)
    wv=np.unique(I[tw]);wr=-np.ones(len(P),int);wr[wv]=np.arange(len(wv))
    np.savez(out+'_wings.npz',P=P[wv],N=N[wv],UV=UV[wv],S=side[wv],I=wr[I[tw]])
    if dbg:
        from PIL import Image
        Sz=700;im=Image.new('RGB',(Sz*2,Sz),(30,30,30));px=im.load();s=(Sz-20)/H;y0=P[:,1].min();xm=0
        for nm,o in (('back',0),('side',Sz)):
          order=np.argsort(-P[:,2]) if nm=='back' else np.argsort(P[:,0])
          for k in order:
            x,y,z=P[k];cl=(255,60,60) if side[k]==1 else ((60,200,255) if side[k]==-1 else (110,110,130))


def rig(src, wnpz, HT, out, OPT):
    j, b = bs.read(src); p = j['meshes'][0]['primitives'][0]; A = p['attributes']
    PB = bs.acc(j, b, A['POSITION']).astype(float); NB = bs.acc(j, b, A['NORMAL']).astype(float); UB = bs.acc(j, b, A['TEXCOORD_0']).astype(float)
    IB = bs.acc(j, b, p['indices']).reshape(-1, 3).astype(int)
    W = np.load(wnpz)
    P = np.vstack([PB, W['P']]); NN = np.vstack([NB, W['N']]); UV = np.vstack([UB, W['UV']]); I = np.vstack([IB, W['I'] + len(PB)])
    nb = len(PB); WS = np.r_[np.zeros(nb, int), W['S']]
    y0 = PB[:, 1].min(); s = HT / (PB[:, 1].max() - y0)
    P = (P - [0, y0, 0]) * s; H = HT
    B = P[:nb]
    
    def slab(y, side, band=0.012, xmax=0.2):
        m = (np.abs(B[:, 1] - y) < band * H) & (B[:, 0] * side > 0.004 * H) & (np.abs(B[:, 0]) < xmax * H)
        return B[m].mean(0) if m.sum() > 5 else None
    
    def torso(y, band=0.015):
        m = (np.abs(B[:, 1] - y) < band * H) & (np.abs(B[:, 0]) < OPT.get('tw', 0.05) * H)
        z = B[m][:, 2]; return np.array([0, y, 0.5 * (np.percentile(z, 3) + np.percentile(z, 97)) + OPT.get('tz', 0) * H])
    
    J = {}
    R = lambda k, d: OPT.get(k, d)
    J['Hips'] = torso(R('hips', 0.577) * H)
    J['Spine02'] = torso(R('sp2', 0.632) * H); J['Spine01'] = torso(R('sp1', 0.686) * H); J['Spine'] = torso(R('sp', 0.743) * H)
    J['neck'] = torso(R('neck', 0.774) * H, 0.01); J['Head'] = torso(R('head', 0.814) * H, 0.01)
    ys = np.array([J[k][1] for k in ('Hips', 'Spine02', 'Spine01', 'Spine')]); zs = np.array([J[k][2] for k in ('Hips', 'Spine02', 'Spine01', 'Spine')])
    cf = np.polyfit(ys, zs, 1)
    for k in ('Hips', 'Spine02', 'Spine01', 'Spine'): J[k][2] = np.polyval(cf, J[k][1])
    J['head_end'] = np.array([0, H, J['Head'][2]]); J['headfront'] = J['Head'] + [0, 0, 0.04 * H]
    for side, O in ((1, 'Left'), (-1, 'Right')):
        up = slab(R('upleg', 0.528) * H, side, xmax=0.12); kn = slab(R('knee', 0.33) * H, side); an = slab(R('ankle', 0.084) * H, side)
        up[1] = R('upleg', 0.528) * H
        J[O + 'UpLeg'] = up; J[O + 'Leg'] = kn; J[O + 'Foot'] = an
        fm = (B[:, 1] < 0.06 * H) & (B[:, 0] * side > 0)
        J[O + 'ToeBase'] = np.array([an[0], 0.021 * H, an[2] + 0.6 * (B[fm][:, 2].max() - an[2])])
        # the arm: tip = farthest point out; shoulder by the template; wrist + elbow refined by slices across the arm line
        sm = B[:, 0] * side > 0
        tip = B[sm][np.argmax(B[sm][:, 0] * side)]
        sh = np.array([side * R('shx', 0.074) * H, R('shy', 0.756) * H, J['Spine'][2]])
        def across(pt, d, rad):
            rel = B - pt; t = rel @ d; perp = np.linalg.norm(rel - np.outer(t, d), axis=1)
            m = (np.abs(t) < 0.012 * H) & (perp < rad * H) & sm
            return B[m].mean(0) if m.sum() > 5 else pt
        d = (tip - sh); L = np.linalg.norm(d); d /= L
        wr = across(sh + d * L * (1 - R('hand', 0.28)), d, 0.06)
        d2 = wr - sh; L2 = np.linalg.norm(d2); d2 /= L2
        el = across(sh + d2 * L2 * 0.5, d2, 0.07)
        J[O + 'Shoulder'] = np.array([side * 0.014 * H, sh[1], J['Spine'][2]])
        J[O + 'Arm'] = sh; J[O + 'ForeArm'] = el; J[O + 'Hand'] = wr; J[O + 'HandTip'] = tip
    TREE = [('Hips', None), ('Spine02', 'Hips'), ('Spine01', 'Spine02'), ('Spine', 'Spine01'), ('neck', 'Spine'), ('Head', 'neck'),
            ('head_end', 'Head'), ('headfront', 'Head')]
    for O in ('Left', 'Right'):
        TREE += [(O + 'Shoulder', 'Spine'), (O + 'Arm', O + 'Shoulder'), (O + 'ForeArm', O + 'Arm'), (O + 'Hand', O + 'ForeArm')]
    for O in ('Left', 'Right'):
        TREE += [(O + 'UpLeg', 'Hips'), (O + 'Leg', O + 'UpLeg'), (O + 'Foot', O + 'Leg'), (O + 'ToeBase', O + 'Foot')]
    names = [t[0] for t in TREE]; par = dict(TREE)
    kids = {n: [c for c, pp in TREE if pp == n] for n in names}
    for n in names: print('%-14s %s' % (n, np.round(J[n], 3)))
    
    # ── weights: distance to each bone's segment (a bone = joint -> its main child), limbs only on their own side
    def seg_end(n):
        if n in ('Head',): return J['head_end']
        if n.endswith('Hand'): return J[n + 'Tip']
        if n == 'Hips': return J['Spine02']
        if n == 'Spine': return J['neck']
        k = [c for c in kids[n] if c != 'headfront']
        return J[k[0]] if k else None
    SKIN = [n for n in names if seg_end(n) is not None and n not in ('LeftShoulder', 'RightShoulder')]
    D = np.zeros((nb, len(SKIN)))
    for i, n in enumerate(SKIN):
        a, e = J[n], seg_end(n)
        D[:, i] = bs.segd(B, a, e)
        if n.startswith('Left') or n.startswith('Right'):
            sd = 1 if n.startswith('Left') else -1
            D[B[:, 0] * sd < -0.002 * H, i] = 1e3
    # hips + legs: the hip bone takes the pelvis, a thigh only below the crotch line
    Wt = 1.0 / (D + 0.004 * H) ** 4
    # smooth over the mesh (shared positions joined)
    key = {}; rep = np.arange(nb)
    for i, v in enumerate(map(tuple, np.round(B, 6))):
        if v in key: rep[i] = key[v]
        else: key[v] = i
    E = np.vstack([IB[:, [0, 1]], IB[:, [1, 2]], IB[:, [2, 0]]]); E = rep[E]
    Wt = Wt / Wt.sum(1, keepdims=True)
    for it in range(int(R('smooth', 4))):
        acc = Wt.copy(); cnt = np.ones(nb)
        np.add.at(acc, E[:, 0], Wt[E[:, 1]]); np.add.at(acc, E[:, 1], Wt[E[:, 0]])
        np.add.at(cnt, E[:, 0], 1); np.add.at(cnt, E[:, 1], 1)
        Wt = acc / cnt[:, None]
        Wt[np.arange(nb)] = Wt[rep]
    top = np.argsort(-Wt, 1)[:, :4]; tw = np.take_along_axis(Wt, top, 1); tw[tw < 0.02] = 0; tw /= tw.sum(1, keepdims=True)
    
    # ── nodes: Meshy layout (char1 mesh + Armature scale 0.01, each bone's +Y toward its child)
    def q_from_to(u, v):
        u = u / np.linalg.norm(u); v = v / np.linalg.norm(v); c = np.cross(u, v); d = float(u @ v)
        if d < -0.99999: return np.array([1.0, 0, 0, 0])
        q = np.array([c[0], c[1], c[2], 1 + d]); return q / np.linalg.norm(q)
    def qm(q):
        x, y, z, w = q
        return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    WR = {}
    for n in names:
        e = seg_end(n) if n not in ('LeftShoulder', 'RightShoulder') else J[kids[n][0]]
        WR[n] = qm(q_from_to(np.array([0, 1.0, 0]), e - J[n])) if e is not None else WR[par[n]]
    nodes = []; idx = {}
    for n in names: idx[n] = len(nodes); nodes.append({'name': n})
    for n in names:
        pr = par[n]
        if pr is None: Rl = WR[n]; t = J[n] * 100
        else: Rl = WR[pr].T @ WR[n]; t = WR[pr].T @ (J[n] - J[pr]) * 100
        nodes[idx[n]]['rotation'] = [float(v) for v in bs.m_quat(Rl)]; nodes[idx[n]]['translation'] = [float(v) for v in t]
        if kids[n]: nodes[idx[n]]['children'] = [idx[c] for c in kids[n]]
    # the wing bones on Spine (world turn = none, like bake-wings.py)
    for side, nm in ((1, 'ewwing_L'), (-1, 'ewwing_R')):
        Q = P[WS == side]; ax = np.abs(Q[:, 0]); yy = J['Spine'][1] - OPT.get('wdown', 0.03) * H; band = Q[np.abs(Q[:, 1] - yy) < 0.04 * H]
        if len(band) < 10: band = Q
        ab = np.abs(band[:, 0]); near = band[ab < ab.min() + 0.02 * H]; pos = np.array([near[:, 0].mean(), yy, near[:, 2].mean()])
        idx[nm] = len(nodes); names.append(nm)
        nodes.append({'name': nm, 'rotation': [float(v) for v in bs.m_quat(WR['Spine'].T)], 'translation': [float(v) for v in WR['Spine'].T @ (pos - J['Spine']) * 100]})
        nodes[idx['Spine']]['children'].append(idx[nm]); WR[nm] = np.eye(3); J[nm] = pos
        print(nm, int((WS == side).sum()), 'verts, root', np.round(pos, 3))
    JN = names
    mesh_i = len(nodes); nodes.append({'name': 'char1', 'mesh': 0, 'skin': 0})
    arm_i = len(nodes); nodes.append({'name': 'Armature', 'scale': [0.01, 0.01, 0.01], 'children': [idx['Hips']]})
    IBM = []
    for n in JN:
        M = np.eye(4); M[:3, :3] = WR[n] * 0.01; M[:3, 3] = J[n]
        IBM.append(np.linalg.inv(M).T.reshape(16))   # world = Armature(0.01) x local(cm) = the same metres
    Ji = np.zeros((len(P), 4), int); Wv = np.zeros((len(P), 4))
    Ji[:nb] = np.array([[JN.index(SKIN[k]) for k in row] for row in top]); Wv[:nb] = tw
    Ji[WS == 1, 0] = JN.index('ewwing_L'); Ji[WS == -1, 0] = JN.index('ewwing_R'); Wv[nb:, 0] = 1
    # ── write: keep the images + material, new buffers for everything else
    nj = {'asset': {'version': '2.0', 'generator': 'EW rigme.py (Meshy-named rig fitted in code)', 'extras': {'ewWings': {'parent': 'Spine', 'bones': ['ewwing_L', 'ewwing_R']}}},
          'scene': 0, 'scenes': [{'name': 'Scene', 'nodes': [mesh_i, arm_i]}], 'nodes': nodes,
          'materials': j['materials'], 'textures': j['textures'], 'samplers': j.get('samplers', []), 'images': [], 'bufferViews': [], 'accessors': [], 'buffers': []}
    nb2 = bytearray()
    for im in j['images']:
        data = bs.view_bytes(j, b, im['bufferView'])
        while len(nb2) % 4: nb2.append(0)
        nj['bufferViews'].append({'buffer': 0, 'byteOffset': len(nb2), 'byteLength': len(data)}); nb2.extend(data)
        nj['images'].append({'bufferView': len(nj['bufferViews']) - 1, 'mimeType': im['mimeType']})
    pa = bs.append_acc(nj, nb2, P.astype(np.float32), 5126, 'VEC3', 34962); nj['accessors'][pa]['min'] = P.min(0).tolist(); nj['accessors'][pa]['max'] = P.max(0).tolist()
    Nn = NN / np.maximum(1e-9, np.linalg.norm(NN, axis=1, keepdims=True))
    attrs = {'POSITION': pa, 'NORMAL': bs.append_acc(nj, nb2, Nn.astype(np.float32), 5126, 'VEC3', 34962), 'TEXCOORD_0': bs.append_acc(nj, nb2, UV.astype(np.float32), 5126, 'VEC2', 34962),
             'JOINTS_0': bs.append_acc(nj, nb2, Ji.astype(np.uint8), 5121, 'VEC4', 34962), 'WEIGHTS_0': bs.append_acc(nj, nb2, Wv.astype(np.float32), 5126, 'VEC4', 34962)}
    ii = bs.append_acc(nj, nb2, I.reshape(-1).astype(np.uint32), 5125, 'SCALAR', 34963)
    nj['meshes'] = [{'name': 'char1', 'primitives': [{'attributes': attrs, 'indices': ii, 'material': 0}]}]
    nj['skins'] = [{'name': 'Armature', 'joints': [idx[n] for n in JN], 'inverseBindMatrices': bs.append_acc(nj, nb2, np.array(IBM), 5126, 'MAT4')}]
    bs.write(out, nj, nb2)
    print('wrote', out, len(P), 'verts', len(JN), 'joints')


def onto(rigged, body, wnpz, out, OPT):
    """THE MESHY RIG (`--rigged <file>`): the body sent alone to Meshy rigging (bake-winged.py writes it with --body-out), its wings
    put back on that rig: the same frame fit Meshy made (it scales the body to the asked height, feet on 0, centred), the wing
    vertices appended to its one primitive, each wholly on a new bone `ewwing_L` / `ewwing_R` on Spine (as bake-wings.py)."""
    j, b = bs.read(rigged); G = bs.globals_(j); sk = j['skins'][0]; J = list(sk['joints'])
    IBM = bs.acc(j, b, sk['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
    p = j['meshes'][0]['primitives'][0]; A = p['attributes']
    P = bs.acc(j, b, A['POSITION']).astype(float)
    j0, b0 = bs.read(body); P0 = bs.acc(j0, b0, j0['meshes'][0]['primitives'][0]['attributes']['POSITION']).astype(float)
    s = np.ptp(P[:, 1]) / np.ptp(P0[:, 1])
    t = 0.5 * (P.min(0) + P.max(0)) - s * 0.5 * (P0.min(0) + P0.max(0)); t[1] = P[:, 1].min() - s * P0[:, 1].min()
    print('frame fit: scale %.4f, move %s' % (s, np.round(t, 4).tolist()))
    W = np.load(wnpz); WP = W['P'] * s + t; H = np.ptp(P[:, 1])
    name = {n.get('name'): i for i, n in enumerate(j['nodes'])}
    par = name['Spine']; Gp = G[par]; sc = np.linalg.norm(Gp[:3, 0]); sp = Gp[:3, 3]
    newJ = []; newIBM = []
    for side, nm in ((1, 'ewwing_L'), (-1, 'ewwing_R')):
        Q = WP[W['S'] == side]; yy = sp[1] - OPT.get('wdown', 0.03) * H; band = Q[np.abs(Q[:, 1] - yy) < 0.04 * H]
        if len(band) < 10: band = Q
        ab = np.abs(band[:, 0]); near = band[ab < ab.min() + 0.02 * H]; pos = np.array([near[:, 0].mean(), yy, near[:, 2].mean()])
        T = np.eye(4); T[:3, 3] = pos; L = np.linalg.inv(Gp) @ T; R = L[:3, :3] * sc
        ni = len(j['nodes']); j['nodes'].append({'name': nm, 'translation': L[:3, 3].tolist(), 'rotation': [float(v) for v in bs.m_quat(R)]})
        j['nodes'][par].setdefault('children', []).append(ni); newJ.append(ni)
        Lb = np.eye(4); Lb[:3, :3] = R; Lb[:3, 3] = L[:3, 3]; newIBM.append(np.linalg.inv(Gp @ Lb).T.reshape(16))
        print('%s: %d vertices, root %s' % (nm, int((W['S'] == side).sum()), np.round(pos, 3).tolist()))
    j0n = len(J); sk['joints'] = J + newJ
    sk['inverseBindMatrices'] = bs.append_acc(j, b, np.vstack([IBM.transpose(0, 2, 1).reshape(-1, 16), np.array(newIBM)]), 5126, 'MAT4')
    Ji = bs.acc(j, b, A['JOINTS_0']).astype(int); Wt = bs.acc(j, b, A['WEIGHTS_0']).astype(float)
    nw = len(WP); WJ = np.zeros((nw, 4), int); WJ[:, 0] = np.where(W['S'] == 1, j0n, j0n + 1); WW = np.zeros((nw, 4)); WW[:, 0] = 1
    N = np.vstack([bs.acc(j, b, A['NORMAL']).astype(float), W['N']]); UV = np.vstack([bs.acc(j, b, A['TEXCOORD_0']).astype(float), W['UV']])
    PA = np.vstack([P, WP]); I = np.r_[bs.acc(j, b, p['indices']).reshape(-1).astype(np.int64), W['I'].reshape(-1) + len(P)]
    pa = bs.append_acc(j, b, PA.astype(np.float32), 5126, 'VEC3', 34962); j['accessors'][pa]['min'] = PA.min(0).tolist(); j['accessors'][pa]['max'] = PA.max(0).tolist()
    p['attributes'] = {'POSITION': pa, 'NORMAL': bs.append_acc(j, b, N.astype(np.float32), 5126, 'VEC3', 34962),
                       'TEXCOORD_0': bs.append_acc(j, b, UV.astype(np.float32), 5126, 'VEC2', 34962),
                       'JOINTS_0': bs.append_acc(j, b, np.vstack([Ji, WJ]), 5121 if len(sk['joints']) < 256 else 5123, 'VEC4', 34962),
                       'WEIGHTS_0': bs.append_acc(j, b, np.vstack([Wt, WW]), 5126, 'VEC4', 34962)}   # (TANGENT dropped: the wings have none; three derives them)
    p['indices'] = bs.append_acc(j, b, I.astype(np.uint32), 5125, 'SCALAR', 34963)
    j['asset'].setdefault('extras', {})['ewWings'] = {'parent': 'Spine', 'bones': ['ewwing_L', 'ewwing_R'], 'winged': True}
    bs.write(out, j, b)
    print('wrote', out)


def main():
    a = sys.argv[1:]; dbg = None; ht = 1.7; side = 0.06; small = 0.14; opt = {}; rigged = None; body_out = None
    if '--rigged' in a: k = a.index('--rigged'); rigged = a[k + 1]; del a[k:k + 2]
    if '--body-out' in a: k = a.index('--body-out'); body_out = a[k + 1]; del a[k:k + 2]
    if '--debug' in a: k = a.index('--debug'); dbg = a[k + 1]; del a[k:k + 2]; os.makedirs(dbg, exist_ok=True)
    for nm in ('--height', '--side', '--small'):
        if nm in a:
            k = a.index(nm); v = float(a[k + 1]); del a[k:k + 2]
            if nm == '--height': ht = v
            elif nm == '--side': side = v
            else: small = v
    for x in list(a):
        if '=' in x: k, v = x.split('='); opt[k] = float(v); a.remove(x)
    if len(a) != 2: print(__doc__); sys.exit(1)
    src, dst = a
    tmp = tempfile.mkdtemp(prefix='ewwinged_'); base = os.path.join(tmp, 'w')
    split(src, base, side, 0.0, small, dbg)
    if body_out: import shutil; shutil.copy(base + '_body.glb', body_out); print('the body alone (for Meshy rigging):', body_out)
    if rigged: onto(rigged, base + '_body.glb', base + '_wings.npz', dst, opt)
    else: rig(base + '_body.glb', base + '_wings.npz', ht, dst, opt)


if __name__ == '__main__':
    main()
