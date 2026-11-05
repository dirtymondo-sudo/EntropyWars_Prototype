#!/usr/bin/env python3
# bake-fbx-weights.py (2026-11-05) — caps every skinned vertex in a BINARY FBX at 4 bone influences.
#
#   python3 -I bake-fbx-weights.py <in.fbx> <out.fbx>
#
# three.js FBXLoader keeps only the 4 largest weights per vertex (and normalises them), logging
# "Vertex has more than 4 skinning weights assigned to vertex. Deleting additional weights." for every
# such mesh. This does the same cut AT THE SOURCE: per Skin deformer it keeps each vertex's 4 largest
# cluster weights, scales them back to the vertex's original total, and drops the rest from the cluster
# Indexes/Weights arrays. Vertices with <= 4 influences keep their exact values; every other node and
# property is written back byte-for-byte (a no-op file round-trips identical), so the mesh, UVs,
# normals, materials, bones and clips are untouched and the game draws exactly what it drew before.
# Zero dependencies. Repo-only tooling. Notes: docs/notes/models-assets.md "THE FOUR WEIGHTS".
import sys, struct, zlib
HDR = 27
class Node:
    __slots__ = ('name', 'props', 'children', 'raw_props', 'null')
    def __init__(s, name, props, children, raw_props): s.name, s.props, s.children, s.raw_props = name, props, children, raw_props
def _read_prop(d, o):
    t = d[o:o+1]; o += 1
    c = t.decode()
    if c in 'YCILFD':
        n = {'Y':2,'C':1,'I':4,'L':8,'F':4,'D':8}[c]
        return (c, d[o:o+n]), o + n
    if c in 'SR':
        (n,) = struct.unpack_from('<I', d, o); return (c, d[o+4:o+4+n]), o + 4 + n
    if c in 'fdlib':
        ln, enc, clen = struct.unpack_from('<III', d, o)
        return (c, (ln, enc, d[o+12:o+12+clen])), o + 12 + clen
    raise ValueError('prop type %r at %d' % (t, o))
def _read_node(d, o, w):
    if w == 8: end, nprops, plen, nlen = struct.unpack_from('<QQQB', d, o); o += 25
    else: end, nprops, plen, nlen = struct.unpack_from('<IIIB', d, o); o += 13
    if end == 0: return None, o
    name = d[o:o+nlen].decode('latin1'); o += nlen
    props = []
    for _ in range(nprops):
        p, o = _read_prop(d, o); props.append(p)
    kids = []; had_null = False
    while o < end:
        k, o = _read_node(d, o, w)
        if k is None: had_null = True; break
        kids.append(k)
    n = Node(name, props, kids, None); n.null = had_null
    return n, end
def read(path):
    d = open(path, 'rb').read()
    ver = struct.unpack_from('<I', d, 23)[0]; w = 8 if ver >= 7500 else 4
    o = HDR; top = []
    while True:
        n, o2 = _read_node(d, o, w)
        if n is None: o = o2; break
        top.append(n); o = o2
    return {'head': d[:HDR], 'ver': ver, 'w': w, 'top': top, 'footer': d[o:]}
def arr(p):
    c, (ln, enc, data) = p
    raw = zlib.decompress(data) if enc == 1 else data
    fmt = {'f':'f','d':'d','l':'q','i':'i','b':'?'}[c]
    return list(struct.unpack('<%d%s' % (ln, fmt), raw))
def mkarr(c, vals):
    fmt = {'f':'f','d':'d','l':'q','i':'i','b':'?'}[c]
    raw = struct.pack('<%d%s' % (len(vals), fmt), *vals)
    z = zlib.compress(raw, 9)
    return (c, (len(vals), 1, z)) if len(z) < len(raw) else (c, (len(vals), 0, raw))
def _enc_prop(p):
    c, v = p
    if c in 'YCILFD': return c.encode() + v
    if c in 'SR': return c.encode() + struct.pack('<I', len(v)) + v
    ln, enc, data = v
    return c.encode() + struct.pack('<III', ln, enc, len(data)) + data
def _enc_node(n, base, w):
    pb = b''.join(_enc_prop(p) for p in n.props)
    nm = n.name.encode('latin1')
    hl = (25 if w == 8 else 13) + len(nm)
    body = b''; cur = base + hl + len(pb)
    for k in n.children:
        kb = _enc_node(k, cur, w); body += kb; cur += len(kb)
    nul = b'\0' * (25 if w == 8 else 13)
    if n.null: body += nul; cur += len(nul)
    end = cur
    head = struct.pack('<QQQB' if w == 8 else '<IIIB', end, len(n.props), len(pb), len(nm)) + nm
    return head + pb + body
def write(f, path):
    w = f['w']; out = bytearray(f['head']); cur = len(out)
    for n in f['top']:
        b = _enc_node(n, cur, w); out += b; cur += len(b)
    out += b'\0' * (25 if w == 8 else 13)
    # footer: id (16) + 4 zero + pad to 16 + version + 120 zero + magic (16); keep the original id + tail, recompute the pad
    ft = f['footer']; fid = ft[:16]; tail = ft[-(4 + 120 + 16):]
    out += fid + b'\0\0\0\0'
    o = len(out); pad = ((o + 15) & ~15) - o
    if pad == 0: pad = 16
    out += b'\0' * pad + tail
    open(path, 'wb').write(bytes(out))

# ---- the 4-weight cut ----
def i64(p): return struct.unpack('<q', p[1])[0]
def s(p): return p[1].split(b'\x00\x01')[0].decode('latin1')
def child(n, name):
    for k in n.children:
        if k.name == name: return k
def run(src, dst):
    f = read(src)
    objs = next(n for n in f['top'] if n.name == 'Objects')
    conns = next(n for n in f['top'] if n.name == 'Connections')
    defs = {i64(n.props[0]): n for n in objs.children if n.name == 'Deformer'}
    skins = {k: n for k, n in defs.items() if s(n.props[2]) == 'Skin'}
    clusters = {k: n for k, n in defs.items() if s(n.props[2]) == 'Cluster'}
    by_skin = {k: [] for k in skins}
    for c in conns.children:
        if c.name == 'C' and s(c.props[0]) == 'OO':
            a, b = i64(c.props[1]), i64(c.props[2])
            if a in clusters and b in by_skin: by_skin[b].append(a)
    stats = {'skins': len(skins), 'verts_over4': 0, 'max_infl': 0, 'max_dropped': 0.0, 'sum_dropped': 0.0}
    for sk, cl in by_skin.items():
        table = {}   # vertex -> [(weight, cluster id, pos)]
        data = {}
        for cid in cl:
            n = clusters[cid]; ix, wt = child(n, 'Indexes'), child(n, 'Weights')
            if ix is None or wt is None: continue
            I, W = arr(ix.props[0]), arr(wt.props[0])
            data[cid] = (ix, wt, I, W)
            for j, (v, w) in enumerate(zip(I, W)): table.setdefault(v, []).append((w, cid, j))
        drop = set(); scale = {}
        for v, lst in table.items():
            stats['max_infl'] = max(stats['max_infl'], len(lst))
            if len(lst) <= 4: continue
            stats['verts_over4'] += 1
            lst.sort(key=lambda t: -t[0])
            keep, gone = lst[:4], lst[4:]
            tot, kt = sum(t[0] for t in lst), sum(t[0] for t in keep)
            dsum = sum(t[0] for t in gone)
            stats['max_dropped'] = max(stats['max_dropped'], dsum / tot if tot else 0); stats['sum_dropped'] += dsum
            for t in gone: drop.add((t[1], t[2]))
            for t in keep: scale[(t[1], t[2])] = (tot / kt) if kt > 0 else 1.0
        for cid, (ix, wt, I, W) in data.items():
            NI, NW = [], []
            for j, (v, w) in enumerate(zip(I, W)):
                if (cid, j) in drop: continue
                NI.append(v); NW.append(w * scale.get((cid, j), 1.0))
            if len(NI) != len(I) or any((cid, j) in scale for j in range(len(I))):
                ix.props[0] = mkarr(ix.props[0][0], NI); wt.props[0] = mkarr(wt.props[0][0], NW)
    write(f, dst)
    return stats
if __name__ == '__main__':
    print(sys.argv[1].rsplit('/', 1)[-1], run(sys.argv[1], sys.argv[2]))
