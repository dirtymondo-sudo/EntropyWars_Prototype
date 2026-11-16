# make-layout-4.py — writes docs/areas/desert/layout.json (THE DESERT, PLAN 4: 12 x 12 plots, the highway with exits; mondo's OK 11-16)
# from the first build's layout (layout-8x8.json): the four district blocks are moved WHOLE, the highway and its roads are drawn here.
# Run: python3 docs/plans/desert/make-layout-4.py   (then node bake-desert.js)
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(HERE, '../../areas/desert')
O = json.load(open(os.path.join(A, 'layout-8x8.json'))); C = O['cells']; N = 144
G = [['.'] * N for _ in range(N)]
# name, old squares x0 y0 w h, new plot column / row, district
BLOCKS = [('C', 12, 0, 36, 36, 1, 1), ('W', 48, 0, 48, 48, 8, 1), ('A', 0, 48, 48, 48, 0, 8), ('G', 48, 48, 48, 48, 8, 8)]
for d, x0, y0, w, h, px, py in BLOCKS:
    for j in range(h):
        for i in range(w):
            ch = C[y0 + j][x0 + i]
            if d == 'W' and ch == 'p': ch = 'd'          # the old causeway stub under the town is a dirt trail now (it runs down to the county road)
            G[py * 12 + j][px * 12 + i] = ch
def rect(x0, y0, x1, y1, ch, only=None):
    for y in range(y0, y1):
        for x in range(x0, x1):
            if only is None or G[y][x] in only: G[y][x] = ch
R = 'r'
# THE HIGHWAY: westbound y 2..5, eastbound y 7..10 (from the west wall, all inside plot row 0), southbound x 68..71, northbound x 73..76; a sand median between
rect(0, 2, 76, 5, R); rect(0, 7, 71, 10, R); rect(68, 7, 71, 93, R); rect(73, 2, 76, 93, R)
# EXIT 1 · DISASTER CITY: the road north to the city (the north wall at x -105 m, straight under the city's own South Street) + the gap in the median
rect(41, 0, 43, 2, R); rect(41, 5, 43, 7, R)
# THE REST STOP (the Gas Station), on the northbound side
rect(78, 22, 90, 32, 'c'); rect(76, 20, 78, 22, R); rect(76, 32, 78, 34, R); rect(76, 20, 78, 34, R)
# EXIT 2 · THE CIRCUS: a slip lane, the road west to the circus's own track
rect(67, 35, 68, 45, R); rect(52, 43, 68, 45, R); rect(43, 43, 52, 45, 'd')
# EXIT 3 · WESTERN TOWN: the county road (y 52..55) goes OVER the highway on a bridge; side roads + four stubs make the diamond
rect(40, 52, 96, 55, R); rect(54, 47, 56, 60, R); rect(88, 47, 90, 60, R)
rect(56, 47, 68, 49, R); rect(56, 58, 68, 60, R); rect(76, 47, 88, 49, R); rect(76, 58, 88, 60, R)
rect(101, 55, 103, 60, 'd')
# EXIT 4 (no sign): the base road west, then south to the Gate
rect(67, 72, 68, 82, R); rect(1, 80, 68, 82, R); rect(1, 82, 3, 96, R)
# THE END OF THE ROAD: both carriageways meet a road east that turns down onto Giza's causeway
rect(68, 90, 103, 93, R); rect(101, 93, 103, 96, R)
NAMES = {(3, 0): ('Exit 1 · Disaster City', 'the road north to the city'), (5, 0): ('The Bend', 'the highway turns south'), (6, 0): ('The Bend, east', ''),
         (6, 2): ('The Rest Stop', 'the gas station, LAST GAS'), (5, 3): ('Exit 2 · The Circus', 'the slip lane, the road west'), (4, 3): ('The Circus Road', ''),
         (5, 4): ('The Overpass', 'the county road over the highway'), (6, 4): ('The Overpass, east', ''), (4, 4): ('The Frontage Road', ''), (3, 4): ('The Door', 'one road, one door'),
         (7, 4): ('Exit 3 · Western Town', 'the county road east'), (5, 6): ('The Turn-off', 'no sign'), (4, 6): ('The Trailers', 'they watch the base road'), (3, 6): ('The Bus Stop', ''),
         (0, 6): ('The Base Road', ''), (1, 6): ('The Base Road', ''), (2, 6): ('The Base Road', ''), (0, 7): ('The Long Straight', 'down to the Gate'),
         (5, 7): ('The End of the Road', 'the highway stops; Giza is east'), (6, 7): ('The End of the Road, east', ''), (7, 7): ('The Giza Road', '')}
old = {p['id']: p for p in O['plots']}; plots = []
for y in range(12):
    for x in range(12):
        src = None
        for d, x0, y0, w, h, px, py in BLOCKS:
            if px <= x < px + w // 12 and py <= y < py + h // 12: src = old['P%02d-%02d' % (x0 // 12 + x - px, y0 // 12 + y - py)]
        pid = 'P%02d-%02d' % (x, y)
        if src: p = dict(src); p['was'] = src['id']; p['id'] = pid
        elif (x, y) in NAMES: p = {'id': pid, 'name': NAMES[(x, y)][0], 'district': 'R', 'level': 0, 'what': NAMES[(x, y)][1]}
        else: p = {'id': pid, 'name': 'The Highway' if any(G[y * 12 + j][x * 12 + i] == 'r' for j in range(12) for i in range(12)) else 'Open Desert', 'district': 'R', 'level': 0, 'what': ''}
        plots.append(p)
out = dict(O); out.update({'version': 'plan-4 (the highway, as built)', 'areaPlots': 12, 'areaMeters': 504.0, 'plots': plots, 'cells': [''.join(r) for r in G],
    'blocks': [{'district': d, 'old': [x0, y0, w, h], 'new': [px * 12, py * 12]} for d, x0, y0, w, h, px, py in BLOCKS]})
out['districts'] = dict(O['districts']); out['districts']['R'] = 'The Highway'
json.dump(out, open(os.path.join(A, 'layout.json'), 'w'), indent=1); print(len(plots), 'plots', N, 'x', N)
