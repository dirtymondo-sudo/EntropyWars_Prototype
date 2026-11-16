#!/usr/bin/env python3
"""THE DEEP, PLOT PLAN 2 (2026-11-16, the Deep zone thread; mondo's order: redesign the zone on plots, all under water).
`python3 docs/plans/world-zones/make-deep.py` writes, beside itself:
    the-deep-layout-2.json      every plot (name, district, what stands there, what old place it comes from), the square map, the level map, the ways
    the-deep_plot_plan_2.png    the picture
and copies the json to docs/areas/deep/layout.json (what bake-deep.js reads). Nothing here is read by the game.

THE IDEA. Plan 1 (9 x 3) was the old Abyss laid flat in a strip. Plan 2 is 8 x 5 plots (336 x 210 m), four districts:
  C  ATLANTIS, THE CITADEL   the ULTIMATE drowned city is Plato's: rings of land and water round a temple. The middle island carries the Agora and
                             the Temple of the Deep (the dome, the dry inside); a canal ring; the inner ring of the city with the Palace.
  R  ATLANTIS, THE RINGS     the outer canal, the outer ring (houses, market, theatre, baths, gardens), the city wall and its four gates.
  S  THE SEA FLOOR           what lies round the city: the Upwelling under the Triangle's whirlpool, the Wreck (the Dutchman below), the Kelp
                             Forest, the Reef Wall, the Station and its bathyscaphe, the Spire, the Drowned Circle, the Dunes.
  T  THE TRENCH              east of the city the floor falls 14 m in two drops: the Shelf, the Vents (the smokers), the Bones, the Bottom.
Four straight roads (the Drowned Road) run from the gates over the canals to the Agora, so the dome is seen from every gate.
Squares: sx 0..95 west to east, sy 0..59 north to south, 3.5 m each; a plot is 12 x 12. A level is 1.75 m; the open sea floor is level 8.
"""
import json, math, os, random, shutil
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
COLS, ROWS, N = 8, 5, 12
W, H = COLS * N, ROWS * N
CX, CY = 42.0, 30.0          # the city's middle (a square corner: the Agora's middle)
DIST = {'C': 'Atlantis, the Citadel', 'R': 'Atlantis, the Rings', 'S': 'The Sea Floor', 'T': 'The Trench'}
LEGEND = {
    's': 'sea floor sand',
    'm': 'drowned paving (roads, the Agora, causeways over the canals)',
    't': 'city ground (the rings\' terraces)',
    'c': 'canal bed (3.5 to 5 m under the rings; swum, bridged by the causeways)',
    'w': 'the city wall (7 m of marble; swum over, never through)',
    'B': 'building (a walk-in or solid house; its file says which)',
    'k': 'kelp forest floor',
    'r': 'reef / coral rock',
    'x': 'rock (crags, spires, the trench\'s walls)',
    'd': 'the trench floor (dark silt)',
    'v': 'warm vent rock',
    'f': 'the Station\'s deck',
}
# plot table: (col, row): (district, name, what stands there, where it comes from)
P = {}
def plot(c, r, d, name, what, frm): P[(c, r)] = dict(id='P%02d-%02d' % (c, r), name=name, d=d, what=what, **{'from': frm})
LM = '(label mine)'
# column 0: the sea floor west of the city, under the Triangle
plot(0, 0, 'S', 'The Kelp Forest', 'kelp to the surface, the humpback over it', 'Abyss: the kelp forest')
plot(0, 1, 'S', 'The Wreck', 'LANDMARK: the Dutchman below, on her side; the hatch in her hull', 'Abyss: THE WRECK / THE DUTCHMAN BELOW')
plot(0, 2, 'S', 'The Sea Floor', 'open sand, the road from the West Gate, fish schools', 'Abyss: THE SEA FLOOR')
plot(0, 3, 'S', 'The Upwelling', 'where the whirlpool sets you down: a bowl ringed with rock, the jelly bloom', 'Abyss: THE UPWELLING')
plot(0, 4, 'S', 'The Reef Wall', 'a coral ridge 5 m high', 'Abyss: THE REEF WALL')
# the four corners of the city's square
plot(1, 0, 'S', 'The Station', 'the deck on its legs, the bathyscaphe moored off it', 'Abyss: THE STATION + the bathyscaphe')
plot(5, 0, 'S', 'The Spire', 'a rock needle 15 m high (the tape on top)', 'Abyss: THE SPIRE')
plot(1, 4, 'S', 'The Dunes', 'rippled sand, the south road\'s end', 'Abyss: the dunes of grey sand')
plot(5, 4, 'S', 'The Drowned Circle', 'standing stones on a low mound', 'Abyss: the drowned circle')
# the rings (the outer twelve)
plot(2, 0, 'R', 'The Drowned Houses', 'roofless houses along the wall', 'NEW ' + LM)
plot(3, 0, 'R', 'The North Gate', 'the gate, the road in over the outer canal', 'NEW ' + LM)
plot(4, 0, 'R', 'The Market', 'stalls and a stoa', 'NEW ' + LM)
plot(1, 1, 'R', 'The Theatre', 'a half ring of stone seats', 'NEW ' + LM)
plot(1, 2, 'R', 'The West Gate', 'the gate toward the Upwelling', 'NEW ' + LM)
plot(1, 3, 'R', 'The Gardens', 'coral where the gardens were', 'NEW ' + LM)
plot(5, 1, 'R', 'The Workshops', 'low halls, the crystal works', 'NEW ' + LM)
plot(5, 2, 'R', 'The East Gate', 'the gate toward the Trench', 'NEW ' + LM)
plot(5, 3, 'R', 'The Harbour', 'the old docks on the outer canal, the sea chests', 'NEW ' + LM)
plot(2, 4, 'R', 'The Baths', 'pools and a round hall', 'NEW ' + LM)
plot(3, 4, 'R', 'The South Gate', 'the great gate: the Drowned Road comes in here', 'Abyss: THE DROWNED ROAD')
plot(4, 4, 'R', 'The Graves', 'tombs along the wall, the sarcophagus', 'Abyss: the sarcophagus ' + LM)
# the citadel (the middle nine)
plot(2, 1, 'C', 'The Palace', 'the Palace on its podium, the front of nine metre columns', 'Abyss: THE PALACE (the Sunken Agora, 11-13)')
plot(3, 1, 'C', 'The Temple of the Deep', 'LANDMARK: the dome over the vault door; the dry inside', 'Abyss: THE TEMPLE STEPS + the dome; the Temple room')
plot(4, 1, 'C', 'The Columns', 'a colonnade on the inner ring, the fallen lintel', 'Abyss: the colonnades, the fallen lintel')
plot(2, 2, 'C', 'The West Bridge', 'the causeways over both canals', 'NEW ' + LM)
plot(3, 2, 'C', 'The Agora', 'LANDMARK: the sunken square, the four crystal pylons', 'Abyss: THE SUNKEN AGORA')
plot(4, 2, 'C', 'The East Bridge', 'the causeways over both canals', 'NEW ' + LM)
plot(2, 3, 'C', 'The Statues', 'a row of statues on the inner ring', 'Abyss: the statues ' + LM)
plot(3, 3, 'C', 'The Drowned Road', 'the road up to the Agora over the south causeway', 'Abyss: THE DROWNED ROAD')
plot(4, 3, 'C', 'The Obelisks', 'two obelisks and the tesla pylons', 'Abyss: the obelisks ' + LM)
# the trench
plot(6, 0, 'T', 'The Shelf', 'a ledge half way down', 'NEW ' + LM)
plot(6, 1, 'T', 'The Edge', 'the lip: the floor falls away', 'Abyss: THE TRENCH (its lip)')
plot(6, 2, 'T', 'The Trench', 'LANDMARK: the drop, where the East road ends', 'Abyss: THE TRENCH')
plot(6, 3, 'T', 'The Slope', 'a broken slope down, rock spires', 'Abyss: the spires round the trench')
plot(6, 4, 'T', 'The Bones', 'a whale\'s bones on the floor', 'NEW ' + LM)
plot(7, 0, 'T', 'The Dark', 'no light but what lives here', 'NEW ' + LM)
plot(7, 1, 'T', 'The Vents', 'the smokers, warm rock', 'Abyss: the smokers in the trench')
plot(7, 2, 'T', 'The Bottom', 'the lowest plot in the world', 'NEW ' + LM)
plot(7, 3, 'T', 'The Lights', 'the anglerfish and the jellies', 'Abyss: the anglerfish ' + LM)
plot(7, 4, 'T', 'The Far Wall', 'the trench\'s east wall', 'NEW ' + LM)

cell = [['s'] * W for _ in range(H)]
lv = [[8] * W for _ in range(H)]
rnd = random.Random(1116)
def R(x, y): return math.hypot(x + 0.5 - CX, y + 0.5 - CY)
def on_ns(x): return 40 <= x <= 43
def on_ew(y): return 28 <= y <= 31

# ── ATLANTIS: the rings ──
for y in range(H):
    for x in range(12, 72):
        r = R(x, y)
        if r < 10.5: cell[y][x], lv[y][x] = 'm', 11
        elif r < 13.5: cell[y][x], lv[y][x] = 'c', 7
        elif r < 18: cell[y][x], lv[y][x] = 't', 10
        elif r < 21: cell[y][x], lv[y][x] = 'c', 7
        elif r < 27: cell[y][x], lv[y][x] = 't', 9
        elif r < 28.5: cell[y][x], lv[y][x] = 'w', 9
        if r < 28.5 and (on_ns(x) or on_ew(y)):          # the four roads: causeways over the canals, gates through the wall
            cell[y][x] = 'm'
            if 10.5 <= r < 13.5: lv[y][x] = 10
            elif 18 <= r < 21: lv[y][x] = 9
# the temple's podium at the Agora's north end (8 x 4 squares, a level up)
for y in range(20, 24):
    for x in range(38, 46): cell[y][x], lv[y][x] = 'B', 12
# the roads outside the wall: west to the Upwelling, south to the room's edge, east to the Trench's lip, north to the Station's side
for x in range(0, 72 + 4):
    for y in (29, 30):
        if cell[y][x] == 's': cell[y][x] = 'm'
for y in range(0, H):
    for x in (41, 42):
        if cell[y][x] == 's': cell[y][x] = 'm'

# ── THE SEA FLOOR ──
def blob(cx, cy, rx, ry, ch, level=None, rough=0.0):
    for y in range(max(0, int(cy - ry - 1)), min(H, int(cy + ry + 2))):
        for x in range(max(0, int(cx - rx - 1)), min(W, int(cx + rx + 2))):
            q = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2
            if q <= 1 + (rnd.random() - 0.5) * rough and cell[y][x] in 'sdkr':
                if ch: cell[y][x] = ch
                if level is not None: lv[y][x] = level
blob(6, 6, 6.5, 6.5, 'k', None, 0.5)                                   # the Kelp Forest
blob(6, 18, 4.5, 3, None, 7)                                           # the Wreck's scour
for a in range(0, 360, 6):                                             # the Upwelling: a bowl ringed with rock
    x, y = 6 + 4.6 * math.cos(math.radians(a)), 42 + 4.6 * math.sin(math.radians(a))
    if not (28 <= y <= 31) and not (-25 < ((a + 180) % 360) - 180 < 25) and rnd.random() < 0.7:
        cell[int(y)][int(x)] = 'x'; lv[int(y)][int(x)] = 10 + rnd.randint(0, 2)
blob(6, 42, 3, 3, None, 7)
for i in range(40):                                                    # the Reef Wall: a curving ridge
    t = i / 39.0; x = 1 + t * 21; y = 54.5 + 3 * math.sin(t * 3.3) - 2 * t
    for dy in (0, 1):
        yy, xx = int(y) + dy, int(x)
        if 0 <= yy < H and cell[yy][xx] == 's': cell[yy][xx] = 'r'; lv[yy][xx] = 10 + (1 if dy == 0 and i % 3 else 0)
for y in range(3, 6):                                                  # the Station's deck (3 x 3 squares, 3.5 m up)
    for x in range(15, 18): cell[y][x], lv[y][x] = 'f', 10
for y in range(3, 5):                                                  # the Spire
    for x in range(67, 69): cell[y][x], lv[y][x] = 'x', 17
cell[2][67] = cell[5][68] = 'x'; lv[2][67] = 12; lv[5][68] = 11
for y in range(48, 60):                                                # the Dunes: rippled sand
    for x in range(12, 24):
        if cell[y][x] == 's' and (x + y // 2) % 4 == 0: lv[y][x] = 9
blob(66, 55, 3.6, 3.2, None, 9)                                        # the Drowned Circle's mound

# ── THE TRENCH ──
for y in range(H):
    e1 = 76 + 2.5 * math.sin(y / 6.0) + 1.5 * math.sin(y / 2.3)        # the lip
    e2 = 86 + 2.0 * math.sin(y / 5.0 + 1)                              # the second drop
    for x in range(72, W):
        if x >= W - 2: cell[y][x], lv[y][x] = 'x', 14 + (x + y) % 3; continue       # the far wall
        if x < e1 - 1: continue
        if x < e1: cell[y][x], lv[y][x] = 'x', 8
        elif x < e1 + 1: cell[y][x], lv[y][x] = 'x', 6
        elif x < e1 + 2: cell[y][x], lv[y][x] = 'x', 4
        elif x < e2: cell[y][x], lv[y][x] = 'd', 2
        elif x < e2 + 1: cell[y][x], lv[y][x] = 'x', 1
        else: cell[y][x], lv[y][x] = 'd', 0
for y in range(2, 9):                                                  # the Shelf: a ledge half way down
    for x in range(77, 84):
        if cell[y][x] in 'dx': cell[y][x], lv[y][x] = 'x', 5
for (x, y, h) in [(80, 40, 9), (82, 44, 7), (79, 46, 8), (83, 38, 6), (81, 15, 8), (84, 20, 7), (90, 6, 6), (91, 30, 5), (89, 50, 6), (92, 56, 7), (88, 10, 4), (80, 33, 7)]:
    cell[y][x] = 'x'; lv[y][x] = h                                     # rock spires
blob(90, 18, 3.2, 2.6, 'v', 1)                                         # the Vents' mound
for y in (29, 30):                                                     # the East road ends at the lip
    for x in range(72, 76):
        if cell[y][x] != 'x': cell[y][x] = 'm'

WAYS = [
    dict(id='upwelling', sx=6, sy=42, kind='open', label='The Beach (up the Upwelling to the Maelstrom)', link='bermuda_abyss'),
    dict(id='wreck', sx=8, sy=18, kind='hidden', label="the Flying Dutchman's Hold (the wreck's hatch)", link='revenge_atlantis'),
    dict(id='temple', sx=42, sy=24, kind='inside', label='inside: the Temple of the Deep (the vault door)'),
    dict(id='drownedstair', sx=47, sy=18, kind='hidden', label='the drowned stair (up into the temple)'),
    dict(id='spawn', sx=42, sy=27, kind='spawn', label='you arrive here (the Agora)'),
]
plots = []
for r in range(ROWS):
    for c in range(COLS):
        p = dict(P[(c, r)]); sq = [lv[y][x] for y in range(r * N + 3, r * N + 9) for x in range(c * N + 3, c * N + 9)]
        p['level'] = sorted(sq)[len(sq) // 2]; plots.append(p)
B36 = '0123456789abcdefghijklmnopqrstuvwxyz'
layout = dict(area='The Deep', version='plan-2', note='the Deep zone thread, 2026-11-16, built without waiting for an OK (mondo\'s order of that day); his word wins',
              squareMeters=3.5, plotCells=N, cols=COLS, rows=ROWS, levelMeters=1.75, seaFloorLevel=8, districts=DIST, legend=LEGEND, plots=plots, ways=WAYS,
              cells=[''.join(r) for r in cell], levels=[''.join(B36[v] for v in r) for r in lv])
out = os.path.join(HERE, 'the-deep-layout-2.json')
with open(out, 'w') as f:
    s = json.dumps(layout, indent=1, ensure_ascii=False)
    f.write(s + '\n')
os.makedirs(os.path.join(REPO, 'docs/areas/deep'), exist_ok=True)
shutil.copy(out, os.path.join(REPO, 'docs/areas/deep/layout.json'))

# ── the picture ──
S = 14; OX, OY = 40, 96; PW = W * S + 420 + OX; PH = H * S + OY + 250
COL = {'s': (58, 120, 128), 'm': (214, 212, 198), 't': (150, 160, 150), 'c': (28, 70, 104), 'w': (236, 236, 228), 'B': (150, 96, 70), 'k': (26, 92, 58), 'r': (196, 110, 120),
       'x': (84, 84, 92), 'd': (20, 28, 54), 'v': (110, 52, 44), 'f': (120, 126, 140)}
DCOL = {'C': (255, 208, 96), 'R': (120, 220, 200), 'S': (110, 170, 255), 'T': (190, 130, 255)}
img = Image.new('RGB', (PW, PH), (22, 24, 22)); d = ImageDraw.Draw(img)
def font(sz, bold=False):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if bold else ''), '/usr/share/fonts/dejavu/DejaVuSans%s.ttf' % ('-Bold' if bold else '')]:
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()
F1, F2, F3, FS = font(20, True), font(12, True), font(11), font(10)
d.text((OX, 18), 'THE DEEP  ·  plot plan 2  ·  8 x 5 plots, 40 in all, 336 x 210 m  ·  all under water', font=F1, fill=(255, 255, 255))
d.text((OX, 48), 'North is up. Atlantis is the ring city of the old story: an island with the Agora and the Temple of the Deep, two canal rings, a wall with four gates.', font=F3, fill=(200, 200, 200))
d.text((OX, 64), 'West: the sea floor under the Bermuda Triangle. East: the Trench, 14 m down in two drops. The number in a plot is its level (1 level = 1.75 m; the open floor is 8).', font=F3, fill=(200, 200, 200))
for y in range(H):
    for x in range(W):
        c = COL[cell[y][x]]; k = 0.82 + 0.03 * (lv[y][x] - 8) + (0.03 if (x + y) % 2 else 0); k = max(0.45, min(1.25, k))
        d.rectangle([OX + x * S, OY + y * S, OX + x * S + S - 1, OY + y * S + S - 1], fill=tuple(min(255, int(v * k)) for v in c))
for p in plots:
    c, r = int(p['id'][1:3]), int(p['id'][4:6]); x0, y0 = OX + c * N * S, OY + r * N * S
    d.rectangle([x0, y0, x0 + N * S, y0 + N * S], outline=(0, 0, 0))
    d.rectangle([x0 + 1, y0 + 1, x0 + N * S - 1, y0 + N * S - 1], outline=DCOL[p['d']])
    nm = p['name']; words = nm.split(' '); lines = ['']
    for w_ in words:
        if d.textlength(lines[-1] + ' ' + w_, font=F2) > N * S - 10 and lines[-1]: lines.append(w_)
        else: lines[-1] = (lines[-1] + ' ' + w_).strip()
    for i, ln in enumerate(lines):
        for dx, dy in ((1, 1), (-1, -1), (1, -1), (-1, 1)): d.text((x0 + 5 + dx, y0 + 4 + i * 14 + dy), ln, font=F2, fill=(0, 0, 0))
        d.text((x0 + 5, y0 + 4 + i * 14), ln, font=F2, fill=(255, 255, 255))
    t = '%s  L%d' % (p['id'], p['level'])
    d.text((x0 + 6, y0 + N * S - 15), t, font=FS, fill=(0, 0, 0)); d.text((x0 + 5, y0 + N * S - 16), t, font=FS, fill=(255, 226, 120))
WC = {'open': (80, 255, 120), 'hidden': (255, 120, 220), 'inside': (255, 190, 70), 'spawn': (255, 255, 255)}
for w_ in WAYS:
    x, y = OX + int((w_['sx'] + 0.5) * S), OY + int((w_['sy'] + 0.5) * S)
    d.ellipse([x - 7, y - 7, x + 7, y + 7], fill=WC[w_['kind']], outline=(0, 0, 0), width=2)
    tw = d.textlength(w_['label'], font=FS); tx = min(max(OX + 2, x - tw / 2), OX + W * S - tw - 4)
    d.rectangle([tx - 3, y + 9, tx + tw + 3, y + 23], fill=(0, 0, 0)); d.text((tx, y + 10), w_['label'], font=FS, fill=WC[w_['kind']])
d.rectangle([OX - 1, OY - 1, OX + W * S, OY + H * S], outline=(255, 255, 255), width=2)
lx, ly = OX + W * S + 28, OY
def head(t):
    global ly
    d.text((lx, ly), t, font=F2, fill=(255, 255, 255)); ly += 20
def row(col, t, round_=False):
    global ly
    (d.ellipse if round_ else d.rectangle)([lx, ly + 1, lx + 13, ly + 14], fill=col, outline=(230, 230, 230)); d.text((lx + 22, ly), t, font=F3, fill=(225, 225, 225)); ly += 19
head('DISTRICTS (the plot\'s outline)')
for k in 'CRST': row(DCOL[k], '%s  %s  (%d plots)' % (k, DIST[k], sum(1 for p in plots if p['d'] == k)))
ly += 8; head('GROUND')
for k in 'smtcwBkrxdvf': row(COL[k], LEGEND[k].split(' (')[0])
ly += 8; head('WAYS')
row(WC['open'], 'way in or out, open', True); row(WC['hidden'], 'hidden, found later (exists today)', True); row(WC['inside'], 'door to an inside', True); row(WC['spawn'], 'where you arrive', True)
ly += 8; head('WHO LIVES HERE')
for t in ['Atlantis: Atlantean, Mermaid, Siren, Starfish', 'Sea floor (from the Triangle above): Jellyfish,', '   Sharkman, Deep Sea Fish as visitors', 'Trench: Kraken, Deep Sea Fish; Kaiju as a visitor', 'Animals: whales, sharks, dolphins, mantas, turtles,', '   fish schools, jellies, anglerfish, squid']:
    d.text((lx, ly), t, font=F3, fill=(225, 225, 225)); ly += 16
ty = OY + H * S + 20
for t in ['WHAT CHANGED FROM PLAN 1, AND WHY',
          '1. A ring city, not a strip: Atlantis is the island, two canals and two rings of Plato\'s story, so it reads as a city from any spot and the dome stands at the end of every road.',
          '2. Four districts in place of two: the Citadel (the heart, the pilot), the Rings (the lived-in city), the Sea Floor (what the old Abyss scattered: wreck, kelp, reef, station, spire), the Trench.',
          '3. Heights: the city climbs 5 m to the Agora, the canals lie 5 m under it, the Trench falls 14 m in two drops. Plan 1 was flat but for the trench.',
          '4. The Temple of the Deep stands on the Agora (it was a door in the room\'s wall); its dry inside is a second room behind the vault door. Room H-20\'s bay door still lands inside it.',
          '5. Every old place is kept and named on a plot; the plots with no old name carry plain labels of mine. No way to Area 51 (struck). The Upwelling lies at the west end, under the Triangle.',
          'This is a plan drawing, not the game.']:
    d.text((OX, ty), t, font=F2 if t.isupper() else F3, fill=(255, 255, 255) if t.isupper() else (215, 215, 215)); ty += 18
img.save(os.path.join(HERE, 'the-deep_plot_plan_2.png'))
print('wrote', out, 'and the picture;', len(plots), 'plots')
