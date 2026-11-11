#!/usr/bin/env python3
"""build-mal.py (2026-11-11): THE MESHY ANIMATION PULL. Packs Meshy animation exports into one animation-only library GLB
(MAL<n>_Sniper.glb: the skeleton + every clip, meshes / skins / textures stripped), the same shape as MAL1-3.

  python3 -I build-mal.py <out.glb> <in1.glb> [in2.glb ...] [--report out.json] [--keep name1,name2]
                          [--inplace clip1,clip2] [--inplace-over <cm>] [--drop clip1,clip2]

Inputs are the GLBs Meshy's animation API returns (POST /openapi/v1/animations with rig_task_id + action_ids: one file, one
clip per action, already named by the library key). Every input must carry the same skeleton (node names are checked).
Clips keep their names. A clip named in --inplace (or any clip whose hips end more than --inplace-over cm from where they
started) has the straight-line travel taken out of the Hips translation track so it loops in place (the board / the creator
stage own the travel). Scale tracks and the constant bone-offset tracks are dropped (the rest pose carries them).
The report lists each clip: duration, hips drift removed, and the stride cycle (the feet trading the lead, by forward kinematics), which
sprites.js uses for a walk's board speed (ts = cycle / 0.52).
No Blender, no node modules: plain struct + json.
"""
import sys, json, struct, math

def read_glb(p):
    b = open(p, 'rb').read()
    assert b[:4] == b'glTF', p
    n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + n])
    off = 20 + n
    bn = struct.unpack('<I', b[off:off + 4])[0]
    return j, b[off + 8:off + 8 + bn]

NCOMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}

def acc_floats(j, bin_, ai):
    a = j['accessors'][ai]
    assert a['componentType'] == 5126, 'float accessors only'
    bv = j['bufferViews'][a['bufferView']]
    nc = NCOMP[a['type']]
    o = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    st = bv.get('byteStride') or nc * 4
    out = []
    for i in range(a['count']):
        out.append(struct.unpack_from('<%df' % nc, bin_, o + i * st))
    return out, a['type']

def qmul(a, b):
    ax, ay, az, aw = a; bx, by, bz, bw = b
    return (aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz)
def qrot(q, v):
    x, y, z, w = q; vx, vy, vz = v
    tx, ty, tz = 2 * (y * vz - z * vy), 2 * (z * vx - x * vz), 2 * (x * vy - y * vx)
    return (vx + w * tx + (y * tz - z * ty), vy + w * ty + (z * tx - x * tz), vz + w * tz + (x * ty - y * tx))

def stride_cycle(nodes, names, tracks, times):
    """one stride cycle (s): forward kinematics of both feet from the hips, the left-minus-right foot lead along the facing
    (+Z), its upward zero crossings (with hysteresis) counted. None when the legs never trade the lead twice."""
    parent = {}
    for i, n in enumerate(nodes):
        for c in n.get('children', []): parent[c] = i
    def chain(name):
        i = names.index(name); out = []
        while i in parent and names[i] != 'Hips': out.append(i); i = parent[i]
        return out[::-1]
    if 'LeftFoot' not in names or 'RightFoot' not in names: return None
    cl, cr = chain('LeftFoot'), chain('RightFoot')
    def footz(ch, k):
        q = (0, 0, 0, 1); p = (0, 0, 0)
        for i in ch:
            t = nodes[i].get('translation', [0, 0, 0]); r = tracks.get(i)
            r = r[min(k, len(r) - 1)] if r else tuple(nodes[i].get('rotation', [0, 0, 0, 1]))
            p = tuple(a + b for a, b in zip(p, qrot(q, t))); q = qmul(q, r)
        return p[2]
    d = [footz(cl, k) - footz(cr, k) for k in range(len(times))]
    amp = max(d) - min(d)
    if amp < 8: return None   # under 8 cm of scissor: not a walk
    h = amp * 0.2; ups = []; state = 0
    for k, x in enumerate(d):
        if x < -h: state = -1
        elif x > h:
            if state == -1: ups.append(times[k])
            state = 1
    if len(ups) >= 2: return (ups[-1] - ups[0]) / (len(ups) - 1)
    return times[-1] - times[0]   # the legs trade the lead once: the whole clip is one stride

def main():
    args = sys.argv[1:]
    rep_p = None; keep = None; inplace = set(); inplace_min = 0.0
    drop = set()
    if '--drop' in args: i = args.index('--drop'); drop = set(args[i + 1].split(',')); del args[i:i + 2]
    if '--inplace' in args: i = args.index('--inplace'); inplace = set(args[i + 1].split(',')); del args[i:i + 2]
    if '--inplace-over' in args: i = args.index('--inplace-over'); inplace_min = float(args[i + 1]); del args[i:i + 2]
    if '--report' in args: i = args.index('--report'); rep_p = args[i + 1]; del args[i:i + 2]
    if '--keep' in args: i = args.index('--keep'); keep = set(args[i + 1].split(',')); del args[i:i + 2]
    out_p, ins = args[0], args[1:]
    base_nodes = None; names = None
    out_bin = bytearray(); views = []; accs = []; anims = []; report = []
    def add_acc(floats, typ, minmax=False):
        nc = NCOMP[typ]
        while len(out_bin) % 4: out_bin.append(0)
        o = len(out_bin)
        for f in floats: out_bin.extend(struct.pack('<%df' % nc, *f))
        views.append({'buffer': 0, 'byteOffset': o, 'byteLength': len(floats) * nc * 4})
        a = {'bufferView': len(views) - 1, 'componentType': 5126, 'count': len(floats), 'type': typ}
        if minmax: a['min'] = [min(f[0] for f in floats)]; a['max'] = [max(f[0] for f in floats)]
        accs.append(a)
        return len(accs) - 1
    seen = set()
    for p in ins:
        j, bin_ = read_glb(p)
        nn = [n.get('name') for n in j['nodes']]
        # the skeleton = every node that is not the mesh node; keep order, drop mesh/skin refs
        if base_nodes is None:
            names = nn
            base_nodes = []
            for n in j['nodes']:
                m = {k: v for k, v in n.items() if k not in ('mesh', 'skin')}
                base_nodes.append(m)
            base_scene = j['scenes'][j.get('scene', 0)]
        else:
            assert nn == names, 'skeleton differs in ' + p
        hips = nn.index('Hips'); thigh = nn.index('LeftUpLeg') if 'LeftUpLeg' in nn else None
        for an in j.get('animations', []):
            name = an.get('name') or 'clip'
            name = name.split('|')[1] if '|' in name else name
            if keep is not None and name not in keep: continue
            if name in seen or name in drop: continue
            seen.add(name)
            samplers = []; chans = []; dur = 0.0; drift = 0.0; removed = 0.0; cycle = None; cache = {}; rot_tracks = {}; rot_times = []
            for ch in an['channels']:
                s = an['samplers'][ch['sampler']]
                node = ch['target']['node']; path = ch['target']['path']
                if path == 'scale': continue   # rigs never scale; saves a third of the file
                t, _ = acc_floats(j, bin_, s['input']); v, typ = acc_floats(j, bin_, s['output'])
                dur = max(dur, t[-1][0])
                if path == 'translation' and node != hips:   # only the hips travel: a bone's own offset is constant, the rest pose has it
                    if max(abs(p_[k] - v[0][k]) for p_ in v for k in range(3)) < 1e-3: continue
                if node == hips and path == 'translation' and len(v) > 2:
                    dx, dz = v[-1][0] - v[0][0], v[-1][2] - v[0][2]
                    drift = math.hypot(dx, dz)   # rig units (cm: the Armature node is scaled 0.01)
                    if name in inplace or (inplace_min and drift > inplace_min):   # a travelling loop: take the straight-line travel out
                        t0, t1 = t[0][0], t[-1][0]
                        v = [(p_[0] - dx * (tt[0] - t0) / (t1 - t0), p_[1], p_[2] - dz * (tt[0] - t0) / (t1 - t0)) for p_, tt in zip(v, t)]
                        removed = drift
                if path == 'rotation': rot_tracks[node] = v; rot_times = [x[0] for x in t]
                tk = s['input']
                if tk not in cache: cache[tk] = add_acc(t, 'SCALAR', True)
                samplers.append({'input': cache[tk], 'output': add_acc(v, typ), 'interpolation': s.get('interpolation', 'LINEAR')})
                chans.append({'sampler': len(samplers) - 1, 'target': {'node': node, 'path': path}})
            cycle = stride_cycle(j['nodes'], nn, rot_tracks, rot_times)
            anims.append({'name': name, 'samplers': samplers, 'channels': chans})
            report.append({'clip': name, 'dur': round(dur, 3), 'drift': round(drift, 2), 'driftRemoved': round(removed, 2), 'cycle': round(cycle, 3) if cycle else None, 'src': p.split('/')[-1]})
    while len(out_bin) % 4: out_bin.append(0)
    g = {'asset': {'version': '2.0', 'generator': 'build-mal.py (Entropy Wars)'}, 'scene': 0, 'scenes': [base_scene], 'nodes': base_nodes,
         'animations': anims, 'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(out_bin)}]}
    js = json.dumps(g, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    total = 12 + 8 + len(js) + 8 + len(out_bin)
    with open(out_p, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, total))
        f.write(struct.pack('<I4s', len(js), b'JSON')); f.write(js)
        f.write(struct.pack('<I4s', len(out_bin), b'BIN\0')); f.write(out_bin)
    print('%s: %d clips, %d bytes' % (out_p, len(anims), total))
    for r in report: print('  %-36s %6.2fs drift %7.2f removed %7.2f cycle %s' % (r['clip'], r['dur'], r['drift'], r['driftRemoved'], r['cycle']))
    if rep_p: json.dump(report, open(rep_p, 'w'), indent=1)

if __name__ == '__main__':
    main()
