#!/usr/bin/env python3
"""THE UNDERGROUND, a district SQUARE BY SQUARE, drawn from the layout (graph.json, written by gen-layout.py).
   python3 docs/plans/world-polish/underground/gen-district.py <S|C|A|T|L|W|K|H>   ->  plans/ug-<name>.js
   Every plot of the layout becomes 12 x 12 squares: a JUNCTION (4 x 4) or a CHAMBER (8 x 8, a board fits) at the plot's level, passages 2
   squares wide to its neighbours with a bend at each plot line, a LADDER where the layout has a climb, a bare CLIFF where it has a drop, and
   in most junctions a PIT two levels down with its own ladder. Repo tooling: it writes a data-only plan the plan tool checks."""
import json, os, sys, random
HERE = os.path.dirname(os.path.abspath(__file__)); G = json.load(open(os.path.join(HERE, 'graph.json')))
K = sys.argv[1]; D = G['districts'][K]; x0, y0, x1, y1 = D['rect']; random.seed(ord(K) * 97 + 5)
P = {(p['x'], p['y']): p for p in G['plots'] if p['d'] == K}; lvl = {c: p['level'] for c, p in P.items()}
ALL = {(p['x'], p['y']): p for p in G['plots']}
W, H = 12 * (x1 - x0 + 1), 12 * (y1 - y0 + 1)
org = lambda c: (12 * (c[0] - x0), 12 * (c[1] - y0))
chamber = {c for c in sorted(P) if P[c]['chamber'] or random.random() < 0.18}   # the joins and entrances, and about one plot in six
steps, stairs, branches, labels, found, flats, doors, used = [], [], [], [], [], [], [], {c: set() for c in P}
A = lambda a, b, c, d, t, l: steps.append("['area', %d, %d, %d, %d, '%s', %d]" % (min(a, c), min(b, d), max(a, c), max(b, d), t, l))
lab = lambda x, y, t, k='note': labels.append("['label', %s, %s, %s, '%s']" % (x, y, json.dumps(t), k))
def node(c):
    ox, oy = org(c); return (ox + 2, oy + 2, ox + 9, oy + 9) if c in chamber else (ox + 4, oy + 4, ox + 7, oy + 7)
def att(c): return random.choice([3, 5, 7] if c in chamber else [4, 6])
for c in sorted(P):
    n = node(c); A(n[0], n[1], n[2], n[3], 'c' if c in chamber else 'g', lvl[c])
def arm(c, side, a):   # a passage 2 wide from the node of c to its plot line on `side`, at attach offset a; returns the two squares at the plot line
    ox, oy = org(c); n = node(c); l = lvl[c]; used[c].add(side)
    if side == 'E': A(n[2] + 1, oy + a, ox + 11, oy + a + 1, 'g', l); return (ox + 11, oy + a)
    if side == 'W': A(ox, oy + a, n[0] - 1, oy + a + 1, 'g', l); return (ox, oy + a)
    if side == 'S': A(ox + a, n[3] + 1, ox + a + 1, oy + 11, 'g', l); return (ox + a, oy + 11)
    A(ox + a, oy, ox + a + 1, n[1] - 1, 'g', l); return (ox + a, oy)
ndrop = 0; tallest = 2
for e in G['edges']:
    a, b = tuple(e['a']), tuple(e['b'])
    if a not in P or b not in P: continue
    if (b[0], b[1]) < (a[0], a[1]): a, b = b, a
    horiz = a[1] == b[1]; ia, ib = att(a), att(b); ox, oy = org(a)
    if horiz:
        pa = arm(a, 'E', ia); pb = arm(b, 'W', ib)
        if ia != ib: A(ox + 10, oy + min(ia, ib), ox + 11, oy + max(ia, ib) + 1, 'g', lvl[a])
        sa, sb = (ox + 11, oy + ib), (ox + 12, oy + ib)
    else:
        pa = arm(a, 'S', ia); pb = arm(b, 'N', ib)
        if ia != ib: A(ox + min(ia, ib), oy + 10, ox + max(ia, ib) + 1, oy + 11, 'g', lvl[a])
        sa, sb = (ox + ib, oy + 11), (ox + ib, oy + 12)
    if e['kind'] == 'climb':
        stairs.append("[[%d, %d], [%d, %d]]" % (sa + sb)); d = abs(lvl[a] - lvl[b]); tallest = max(tallest, d)
        if d >= 2:
            lo_, hi_ = (sa, sb) if lvl[a] < lvl[b] else (sb, sa)
            found.append("{ name: 'a chimney beside the %d-level ladder', from: [%d, %d], to: [%d, %d], kind: 'climb' }" % (d, lo_[0], lo_[1], hi_[0], hi_[1]))
    elif e['kind'] == 'drop':
        hi_, lo_ = (sa, sb) if lvl[a] > lvl[b] else (sb, sa); d = abs(lvl[a] - lvl[b]); ndrop += 1
        wet = K in 'LWKHS' and ndrop % 2 == 1
        branches.append("{ at: [%d, %d], kind: 'drop', to: '%s, %d levels straight down (one way)' }" % (hi_[0], hi_[1], 'the passage below, over a WATERFALL' if wet else 'the passage below, off a CLIFF', d))
        found.append("{ name: 'a free climb up the %s', from: [%d, %d], to: [%d, %d], kind: 'climb' }" % ('wet rock beside the fall' if wet else 'cliff', lo_[0], lo_[1], hi_[0], hi_[1]))
        lab(hi_[0] + 0.5, hi_[1] - 0.4, 'FALL' if wet else 'CLIFF', 'mark')
# the joins to the other districts: a passage to the plot line and a way out there
for l in G['links']:
    for me, other, dk in ((tuple(l['a']), tuple(l['b']), l['db']), (tuple(l['b']), tuple(l['a']), l['da'])):
        if me not in P: continue
        side = 'E' if other[0] > me[0] else 'W' if other[0] < me[0] else 'S' if other[1] > me[1] else 'N'; p = arm(me, side, att(me))
        nm = 'the D.U.M.B.' if dk == 'D' else G['districts'][dk]['name']; ol = G['dumbLevel'] if dk == 'D' else ALL[other]['level']
        doors.append("[%d, %d, '%s', %s, %d]" % (p[0], p[1], side, json.dumps(nm + (' (%d levels %s)' % (abs(ol - lvl[me]), 'down' if ol < lvl[me] else 'up') if ol != lvl[me] else '')), lvl[me]))
for d in G['doors']:
    c = tuple(d['plot'])
    if c in P: n = node(c); doors.append("[%d, %d, 'N', %s, %d]" % (n[0], n[1], json.dumps(d['to']), lvl[c]))
# pits (a junction with a free side), dead ends, chambers
npit = 0
for c in sorted(P):
    ox, oy = org(c); n = node(c); l = lvl[c]; deg = len(used[c])
    if c in chamber:
        nm = 'THE INNER SUN' if list(c) == G['sun'] else 'chamber'; flats.append("{ name: %s, rect: [%d, %d, %d, %d], why: 'a chamber: level, a board fits', board: true }" % (json.dumps(('The Inner Sun' if list(c) == G['sun'] else 'Chamber %d,%d' % (c[0] - x0, c[1] - y0))), n[0], n[1], n[2], n[3]))
        lab(ox + 6, oy + 5.6, nm, 'mark' if nm != 'chamber' else 'note')
        fr = [s_ for s_ in 'NSEW' if s_ not in used[c]]
        if fr:   # a pool in a side hollow, a level under the floor
            s_ = fr[0]; q = {'N': (ox + 5, oy, ox + 6, oy + 1), 'S': (ox + 5, oy + 10, ox + 6, oy + 11), 'W': (ox, oy + 5, ox + 1, oy + 6), 'E': (ox + 10, oy + 5, ox + 11, oy + 6)}[s_]; A(q[0], q[1], q[2], q[3], 'w', l - 1)
        continue
    free = [s for s in 'NSEW' if s not in used[c]]
    if free and random.random() < 0.8:
        s = random.choice(free); npit += 1
        if s == 'N': A(ox + 5, oy + 2, ox + 6, oy + 3, 'g', l - 2); stairs.append("[[%d, %d], [%d, %d]]" % (ox + 5, oy + 3, ox + 5, oy + 4)); at = (ox + 5, oy + 3)
        if s == 'S': A(ox + 5, oy + 8, ox + 6, oy + 9, 'g', l - 2); stairs.append("[[%d, %d], [%d, %d]]" % (ox + 5, oy + 8, ox + 5, oy + 7)); at = (ox + 5, oy + 8)
        if s == 'W': A(ox + 2, oy + 5, ox + 3, oy + 6, 'g', l - 2); stairs.append("[[%d, %d], [%d, %d]]" % (ox + 3, oy + 5, ox + 4, oy + 5)); at = (ox + 3, oy + 5)
        if s == 'E': A(ox + 8, oy + 5, ox + 9, oy + 6, 'g', l - 2); stairs.append("[[%d, %d], [%d, %d]]" % (ox + 8, oy + 5, ox + 7, oy + 5)); at = (ox + 8, oy + 5)
        what = ['a sump of black water', 'a bone pit', 'a nest', 'a crystal pocket', 'an old camp', 'a squeeze that goes nowhere'][npit % 6]
        branches.append("{ at: [%d, %d], kind: 'dead end', to: 'a pit two levels down with a ladder out: %s' }" % (at[0], at[1], what))
    if deg == 1: branches.append("{ at: [%d, %d], kind: 'dead end', to: 'a dead end: something is kept here (a secret)' }" % (n[0], n[1]))
big = sorted(chamber, key=lambda c: (list(c) != G['sun'], not P[c]['chamber'], c))[0]; bn = node(big)
lm = "{ name: %s, at: [%d, %d], tall: 2 }" % (json.dumps('The Inner Sun' if list(big) == G['sun'] else 'The great chamber\'s stalagmite'), bn[0] + 4, bn[1] + 4)
steps.append("['set', %d, %d, 'k', %d]" % (bn[0] + 4, bn[1] + 4, lvl[big]))
ent = tuple(D['entry']); en = node(ent)
plots = ["[%d, %d, '%s %d,%d', '%s', null, %d%s]" % (c[0] - x0, c[1] - y0, D['name'].replace("'", "\\'"), c[0] - x0, c[1] - y0, K, lvl[c], ", { flat: 'a chamber' }" if c in chamber else '') for c in sorted(P)]
slug = D['name'].lower().replace('the ', '').replace(' ', '-').replace("'", '')
out = '''/* THE UNDERGROUND, %s, SQUARE BY SQUARE: drawn from the whole-underground layout (plans/underground.js, mondo's OK of its shape 11-20).
   A PROPOSAL: nothing is built from it until mondo says so. WRITTEN BY docs/plans/world-polish/underground/gen-district.py %s: change the
   layout or the script, not this file.
       node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/ug-%s.js
   A LABYRINTH (mondo 11-20: "we need victory road. labyrinth, height diffs, cliffs, drops waterfalls, underground horror like the descent movie").
   Every plot is a JUNCTION (4 x 4) or a CHAMBER (8 x 8, a board fits) at its own level. Passages are 2 squares wide and bend at every plot line.
   An ORANGE BAR is a ladder (both ways); the tallest here is %d levels. A WHITE BAR with a tooth is a CLIFF or a WATERFALL (down only). Most
   junctions have a PIT two levels down with its own ladder, and something in it. Levels are above the Inner Sun (1.75 m each); this district
   runs from %d down to %d. It is ROOFED and DARK: the closed squares are rock. */
'use strict';
module.exports = {
    zone: 'The Underground', thread: '7 + 9 + 10', maze: true,
    title: 'THE UNDERGROUND, %s: the labyrinth square by square, levels %d to %d (a proposal)',
    noBuildings: 'a cave: its chambers are the architecture', newRoom: 'a new compact room for this district (the layout replaces the long corridors)',
    build: { frame: 'room', file: 'a new room design for this district, in the room\\'s own frame' },
    mass: 'rock', massHeight: 6,
    tiles: { g: ['cave passage (the number is its level)', true, %s, %s], c: ['a chamber floor', true, [96, 100, 110], [206, 210, 220]] },
    grid: { w: %d, h: %d, n: 12 }, start: [%d, %d],
    districts: { %s: { name: %s, color: '%s' } },
    plots: [
        %s],
    steps: [
        %s],
    stairs: [%s],
    branches: [
        %s],
    doors: [%s],
    landmarks: [%s],
    lookouts: [{ name: 'the great chamber\\'s edge', at: [%d, %d], sees: %s }],
    found: [
        %s],
    flats: [
        %s],
    buildings: [],
    picture: { S: %d },
};
''' % (D['name'].upper(), K, slug, tallest, max(lvl.values()), min(lvl.values()), D['name'].upper().replace("'", "\\'"), max(lvl.values()), min(lvl.values()), D['lo'], D['hi'], W, H, en[0] + 1, en[1] + 1, K, json.dumps(D['name']), D['color'],
       ',\n        '.join(plots), ',\n        '.join(steps + labels), ', '.join(stairs), ',\n        '.join(branches), ', '.join(doors), lm, bn[0], bn[1], json.dumps('The Inner Sun' if list(big) == G['sun'] else "The great chamber's stalagmite"),
       ',\n        '.join(found), ',\n        '.join(flats), max(12, min(26, 1880 // W)))
open(os.path.join(HERE, '..', 'plans', 'ug-%s.js' % slug), 'w').write(out); print('ug-%s.js' % slug, len(P), 'plots', len(chamber), 'chambers', npit, 'pits', ndrop, 'drops', len(stairs), 'ladders')
