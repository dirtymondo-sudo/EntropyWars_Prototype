# Builds The Beach plan 4 (beach-layout-4.json = docs/areas/beach/layout.json, the approved plan) from plan 2: a 14 x 10 ocean,
# the Bermuda Triangle as its own district, the Volcano Island. (Plan 3 = this without the Volcano Island.)
import json
P2 = json.load(open('beach-layout-2.json')); R2 = P2['rooms'][0]; old = R2['cells']; oldp = {p['id']: p for p in R2['plots']}
C, Rr, PC = 14, 10, 12; W, H = C*PC, Rr*PC
g = [['w']*W for _ in range(H)]
def paste(sx, sy, w, h, dx, dy, skip=''):
    for y in range(h):
        for x in range(w):
            ch = old[sy+y][sx+x]
            if ch not in skip: g[dy+y][dx+x] = ch
OY = 36                                   # the Shore + the Harbour keep plan 2's squares, three plots further south
paste(0, 0, 48, 48, 0, OY)
for y in range(0, OY):                    # the coast runs on north to a rock headland
    w = 19 - (OY - y) * 0.75
    for x in range(W):
        if x < w - 2: g[y][x] = 'd'
        elif x < w: g[y][x] = 'r'
for y in range(OY+48, H):                 # and on south past the dunes
    w = 17 - (y - (OY+47)) * 0.7
    for x in range(W):
        if x < w - 2: g[y][x] = 'D' if x < 12 else 'd'
        elif x < w: g[y][x] = 'r'
# THE BERMUDA TRIANGLE: a 3-4-5 right triangle, legs 8 and 6 plots, the long side 10 plots
TRI = [(60, 108), (156, 108), (156, 36)]  # west point, the right angle, north point (in squares)
def inside(x, y): return x <= 156 and y <= 108 and (y - 108) >= -(x - 60) * 0.75
paste(48, 12, 24, 24, 132, 84)            # the island at the right angle: Jetty, Cay, Lagoon, Island Beach
paste(60, 36, 12, 12, 144, 36, 'w')       # the Maelstrom at the north point
paste(48, 0, 12, 12, 60, 96, 'w')         # the Lighthouse Rock at the west point
paste(48, 36, 12, 12, 108, 84, 'w')       # the reef
for x in range(118, 131): g[72][x] = g[73][x] = 'd'          # the sandbar
for (x, y) in [(98,88),(99,88),(100,88),(98,89),(99,89),(100,89),(101,89),(99,90),(100,90)]: g[y][x] = 'd'   # the wreck islet
g[89][99] = 'B'
for (cx, cy) in [(160, 20), (40, 112)]:                      # two small unnamed islets out in the ocean
    for y in range(cy-2, cy+3):
        for x in range(cx-3, cx+4):
            if abs(x-cx) + abs(y-cy)*1.4 < 4: g[y][x] = 'd'
# THE VOLCANO ISLAND (plan 4, mondo 11-15: "add a remote island with a volcano and unconnected tribe"): far out in the north, 2 x 2 plots
import math
for y in range(1, 24):
    for x in range(96, 120):
        e = math.hypot((x + .5 - 108) / 10.5, (y + .5 - 12.5) / 10.0); v = math.hypot(x + .5 - 106, y + .5 - 10)
        if v < 1.7: g[y][x] = 'l'
        elif v < 6.2: g[y][x] = 'h'
        elif e < 1: g[y][x] = 'd'
for (x, y) in [(113, 15), (115, 17), (112, 18)]: g[y][x] = 'B'        # the tribe's three huts
cells = [''.join(r) for r in g]
S, HB, O, T = 'The Shore', 'The Harbour', 'The Ocean (NEW)', 'The Bermuda Triangle'
named = {}
def N(c, r, name, district, level, what, frm, exit=None):
    named[(c, r)] = dict(name=name, district=district, level=level, what=what, **{'from': frm}, exit=exit)
for p in R2['plots']:                     # plan 2's sixteen shore and harbour plots, moved three rows south
    c, r = int(p['id'][1:3]), int(p['id'][4:6])
    if c < 4: N(c, r+3, p['name'], S if c < 2 else HB, p['level'], p['what'], p['from'], p['exit'])
def old_(pid): return oldp[pid]
N(12, 3, 'The Maelstrom', T, 0, 'the whirlpool at the north point: the way down', 'Bermuda: THE MAELSTROM', ['The Deep (the whirlpool)', 'open'])
N(5, 8, 'The Lighthouse Rock', T, 3, 'the lighthouse on its rock, at the west point', 'Bermuda: the lighthouse rock')
N(11, 7, 'The Jetty', T, 1, "the island's jetty; the skiff lands here", 'Bermuda: THE JETTY')
N(12, 7, 'The Cay', T, 2, 'LANDMARK: the cay, its dune and the lookout, at the right angle', 'Bermuda: THE CAY + THE LOOKOUT')
N(11, 8, 'The Lagoon', T, 0, 'still green water inside the reef', 'Bermuda Island: THE LAGOON', ['DOOR HQ pool', 'secret'])
N(12, 8, 'The Island Beach', T, 1, 'white sand, wreckage', 'Bermuda Island: THE BEACH')
N(9, 7, 'The Reef', T, 0, 'shallows, coral', 'Bermuda: the reef')
N(8, 7, 'The Wreck Islet', T, 0, 'a scrap of sand and a wreck', 'Bermuda: the wreck islet')
N(10, 6, 'The Sandbar', T, 0, 'the sandbar, the way over', 'Bermuda: the sandbar')
N(10, 5, 'No Fixed Position', T, 0, 'open water; the Flight 19 tape', 'Bermuda: NO FIXED POSITION')
N(8, 0, 'The Volcano', O, 4, 'LANDMARK: a volcano, lava in its crater (never climbed)', 'NEW (mondo 11-15; label mine)')
N(9, 0, 'The Volcano Island', O, 1, 'a remote island, black sand under the cone', 'NEW (mondo 11-15; label mine)')
N(8, 1, 'The Landing', O, 0, 'the beach the skiff lands on', 'NEW (label mine)')
N(9, 1, 'The Village', O, 1, "the uncontacted tribe's huts and fire (their models come later)", 'NEW (mondo 11-15; label mine)')
N(13, 1, 'islet (no name)', O, 0, 'a small islet to land on', 'NEW (label mine)')
N(3, 9, 'islet (no name)', O, 0, 'a small islet to land on', 'NEW (label mine)')
N(0, 1, 'The North Headland', S, 1, 'the sand runs out at a rock headland', 'NEW (label mine)')
N(0, 8, 'The South Dunes', S, 2, 'the dunes run on south', 'NEW (label mine)')
N(6, 2, 'the whale', O, 0, 'scenery: the whale', "the game's `whale` landmark")
N(11, 1, 'the waterspout', O, 0, 'scenery: the waterspout', "the game's `waterspout` landmark")
plots = []
for r in range(Rr):
    for c in range(C):
        n = named.get((c, r))
        if not n:
            k = sum(inside(c*PC+x+.5, r*PC+y+.5) for x in range(PC) for y in range(PC))
            shore = c < 2 and any(ch in 'dD' for row in cells[r*PC:(r+1)*PC] for ch in row[c*PC:(c+1)*PC])
            n = dict(name='', district=T if k >= 72 else (S if shore else O), level=0,
                     what='open water inside the Triangle' if k >= 72 else ('sand' if shore else 'open ocean: sail, swim, the ocean pack animals'), **{'from': 'NEW'}, exit=None)
        plots.append(dict(id='P%02d-%02d' % (c, r), **n))
L = dict(area='The Beach', version='plan-4', squareMeters=3.5, plotCells=PC,
         note="North is up; Disaster City's coast is over the west edge. Plan 4 (mondo 11-15, approved): a big ocean to sail, the Bermuda Triangle its own district, the Volcano Island.",
         districts={'S': S, 'H': HB, 'O': O, 'T': T}, triangle=TRI,
         changes=['NEW in plan 4: the Volcano Island, far out', '  north: a volcano, a landing beach and the', "  uncontacted tribe's village.", 'The room is 14 x 10 plots.', 'NEW district: The Ocean, open water you sail', '  by skiff and swim, like an overworld sea.',
                  'The Bermuda Triangle is its own district:', "  a right triangle (the game's own rule),", '  sides 6, 8 and 10 plots (3-4-5).',
                  '  Its corners: the Lighthouse Rock, the', '  Cay island, the Maelstrom.', 'The Shore and the Harbour are as in plan 2,', '  three plots further south.'],
         rooms=[dict(room='The Beach', cols=C, rows=Rr, plots=plots, cells=cells)], legend=P2['legend'])
import os; os.makedirs('../../areas/beach', exist_ok=True)
for f in ('beach-layout-4.json', '../../areas/beach/layout.json'): json.dump(L, open(f, 'w'), indent=0)
from collections import Counter; print(Counter(p['district'] for p in plots))
