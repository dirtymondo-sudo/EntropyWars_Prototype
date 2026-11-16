# draw-highway-plan.py — THE DESERT, PLAN 4 (for mondo's OK, NOT built): the same four places spread out on 12 x 12 plots (504 m,
# Disaster City's size) along a desert highway with numbered exits. Every district block is the built one, moved whole (its own
# squares are read from docs/areas/desert/layout.json), so nothing inside a district changes. Run: python3 docs/plans/desert/draw-highway-plan.py
import json, os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); L = json.load(open(os.path.join(HERE, '../../areas/desert/layout.json')))
C = L['cells']; S = 9; N = 144; PAD = 60; SIDE = 520
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
f10 = ImageFont.truetype(F, 12); f12 = ImageFont.truetype(FB, 13); f14 = ImageFont.truetype(F, 15); f20 = ImageFont.truetype(FB, 24); f16 = ImageFont.truetype(FB, 17)
COL = {'.': (222, 184, 135), 'u': (232, 198, 150), 'o': (205, 168, 122), 'a': (196, 160, 118), 'm': (150, 84, 62), 'r': (58, 58, 64), 'd': (176, 132, 88), 'x': (128, 92, 60),
       'B': (84, 56, 40), 'f': (40, 40, 40), 'c': (170, 170, 166), 'R': (44, 44, 50), 'k': (232, 224, 204), 'p': (200, 180, 140), '1': (224, 196, 124), '2': (208, 180, 108), '3': (192, 164, 96), '4': (176, 148, 84),
       's': (120, 100, 70), 'i': (120, 100, 70), 'w': (70, 150, 210), 't': (60, 140, 70), 'h': (190, 160, 120), 'T': (200, 50, 50), 'W': (100, 60, 150), 'K': (230, 190, 60)}
SAND = COL['.']; ROAD = (58, 58, 64); DIRT = COL['d']
G = [[None] * N for _ in range(N)]
# the built blocks (squares x0, y0, w, h in the built room) -> where they stand now (plots)
BLOCKS = [('THE CIRCUS', 12, 0, 36, 36, 1, 1, (214, 60, 90)), ('WESTERN TOWN', 48, 0, 48, 48, 8, 1, (190, 110, 60)), ('AREA 51', 0, 48, 48, 48, 0, 8, (110, 130, 150)), ('GIZA', 48, 48, 48, 48, 8, 8, (232, 200, 96))]
for name, x0, y0, w, h, px, py, _ in BLOCKS:
    for j in range(h):
        for i in range(w):
            ch = C[y0 + j][x0 + i]
            if name == 'AREA 51' and ch == 'r' and j < 30: ch = '.'      # the old highway down the base's west side goes: the base road comes in at the Gate
            if name == 'THE CIRCUS' and ch == 'r': ch = '.'
            G[py * 12 + j][px * 12 + i] = ch
def rect(x0, y0, x1, y1, ch):
    for y in range(y0, y1):
        for x in range(x0, x1): G[y][x] = ch
# THE HIGHWAY: two carriageways of 3 squares + a 2-square sand median, down the middle (squares 68..76), from the city to the end at Giza
HW0, HW1 = 68, 76
rect(HW0, 0, HW0 + 3, 100, 'r'); rect(HW1 - 3, 0, HW1, 100, 'r')
# the end: the two carriageways swing east into one road that becomes the Causeway (Giza's own way in)
rect(HW0, 97, 100, 100, 'r'); rect(96, 100, 100, 104, 'r')
# EXIT 1 (the Circus): slip roads off the southbound side, a dirt road west to the Ticket Booth
rect(48, 44, 68, 46, 'd'); rect(60, 38, 62, 46, 'r'); rect(60, 46, 62, 52, 'r')
# EXIT 2 (Western Town): the county road crosses OVER the highway on a bridge, ramps on all four sides (a diamond), east to the Trail In
rect(54, 58, 96, 61, 'r'); rect(62, 50, 64, 58, 'r'); rect(62, 61, 64, 69, 'r'); rect(80, 50, 82, 58, 'r'); rect(80, 61, 82, 69, 'r'); rect(96, 58, 104, 61, 'd')
# the frontage road west of the highway: the Door, the Trailers, the Bus Stop
rect(40, 58, 54, 61, 'r')
# EXIT 3 (no sign): one slip road, then the long straight road west and south to the Gate of Area 51
rect(8, 82, 68, 84, 'r'); rect(8, 84, 10, 100, 'r'); rect(60, 76, 62, 82, 'r')
# THE REST STOP (the Gas Station) on the northbound side
rect(78, 18, 90, 28, 'c'); rect(82, 20, 88, 26, 'B'); rect(76, 16, 78, 30, 'r')
# small pieces of the Road district
rect(44, 62, 46, 64, 'B')                     # the Door
rect(46, 86, 54, 88, 'B'); rect(48, 90, 56, 92, 'B')   # the Trailers
rect(36, 79, 39, 81, 'B')                     # the Bus Stop
W = PAD * 2 + N * S + SIDE; H = PAD + 70 + N * S + 40
im = Image.new('RGB', (W, H), (24, 24, 24)); d = ImageDraw.Draw(im); ox, oy = PAD, PAD + 60
d.text((PAD, 14), 'THE DESERT  ·  plan 4 for your OK (not built)  ·  a highway with exits, the four places spread out', font=f20, fill=(255, 255, 255))
d.text((PAD, 46), '12 x 12 plots = 504 m a side (Disaster City\'s size; it is 8 x 8 = 336 m today). North is up. Every district is the built one, moved whole.', font=f14, fill=(190, 190, 190))
for y in range(N):
    for x in range(N):
        ch = G[y][x]; c = COL.get(ch, SAND) if ch else SAND
        if not ch and (x * 7 + y * 13) % 53 == 0: c = (205, 168, 122)
        d.rectangle([ox + x * S, oy + y * S, ox + (x + 1) * S - 1, oy + (y + 1) * S - 1], fill=c)
for i in range(13):
    d.line([ox + i * 12 * S, oy, ox + i * 12 * S, oy + N * S], fill=(0, 0, 0), width=1); d.line([ox, oy + i * 12 * S, ox + N * S, oy + i * 12 * S], fill=(0, 0, 0), width=1)
for y in range(0, 100, 3):   # lane dashes
    for x in (HW0 + 1, HW1 - 2): d.line([ox + x * S + S // 2, oy + y * S, ox + x * S + S // 2, oy + (y + 1) * S], fill=(232, 184, 48), width=1)
# the overpass
d.rectangle([ox + 66 * S, oy + 58 * S - 2, ox + 78 * S, oy + 61 * S + 2], outline=(255, 255, 255), width=2)
for name, x0, y0, w, h, px, py, col in BLOCKS:
    d.rectangle([ox + px * 12 * S, oy + py * 12 * S, ox + (px * 12 + w) * S, oy + (py * 12 + h) * S], outline=(255, 255, 255), width=3)
    d.rectangle([ox + px * 12 * S + 4, oy + py * 12 * S + 4, ox + px * 12 * S + 12 + d.textlength(name, font=f16), oy + py * 12 * S + 28], fill=(0, 0, 0)); d.text((ox + px * 12 * S + 8, oy + py * 12 * S + 6), name, font=f16, fill=col)
def tag(x, y, text, fg=(90, 255, 120), anchor='l'):
    w = d.textlength(text, font=f12); px = ox + x * S; py = oy + y * S
    if anchor == 'r': px -= w + 8
    d.rectangle([px, py, px + w + 8, py + 18], fill=(0, 0, 0), outline=fg); d.text((px + 4, py + 2), text, font=f12, fill=fg)
tag(78, 1, 'DISASTER CITY · the city\'s South Street runs straight onto the highway')
tag(78, 31, 'REST STOP · the Gas Station', (255, 255, 255)); tag(59, 35, 'EXIT 1 · THE CIRCUS', anchor='r'); tag(84, 52, 'EXIT 2 · WESTERN TOWN (the overpass)')
tag(39, 54, 'frontage road: the Door, the Bus Stop', (255, 255, 255), 'r'); tag(59, 73, 'EXIT 3 · no sign · the base road', (255, 120, 120), 'r'); tag(78, 93, 'THE END OF THE ROAD · Giza, the Causeway', (255, 220, 120))
tag(47, 93, 'the Trailers', (255, 255, 255), 'r'); tag(12, 78, 'the long straight to the Gate', (255, 255, 255))
sx = ox + N * S + 30; y = oy
def line(t, f=f14, fill=(220, 220, 220), gap=22):
    global y; d.text((sx, y), t, font=f, fill=fill); y += gap
line('WHAT CHANGES', f16, (255, 255, 255), 28)
for t in ['The room grows from 8 x 8 to 12 x 12 plots.', 'The Circus, Western Town, Area 51 and Giza are', 'the built ones, each moved whole. Their insides,', 'doors and people stay as they are.', '', 'Between them: one to four plots of open desert', '(sand, buttes, cacti, billboards, bones).']: line(t)
y += 10; line('THE HIGHWAY', f16, (255, 255, 255), 28)
for t in ['Two carriageways, three squares each, a sand', 'median between. About 350 m long.', 'It starts at Disaster City\'s highway way out', '(the same link as today) and ends at Giza.', '', 'REST STOP: the Gas Station moves here.', 'EXIT 1: slip roads, a dirt road to the Circus.', 'EXIT 2: a real interchange. The county road', '  crosses over the highway on a bridge, four', '  ramps. East: Western Town. West: the', '  frontage road with the Door and the Bus Stop.', 'EXIT 3: one unsigned slip road. The base', '  road runs 200 m west, then south to the Gate.', '  The Trailers sit beside it, watching.', 'THE END: the road swings east and becomes', '  the Causeway into Giza.']: line(t)
y += 10; line('SIGNS', f16, (255, 255, 255), 28)
for t in ['Green overhead exit signs with the place names,', 'mile markers, a "LAST GAS" board, billboards.', 'No sign at Exit 3.']: line(t)
y += 10; line('FOR YOU TO DECIDE', f16, (255, 220, 120), 28)
for t in ['1. Size: 12 x 12 (as drawn) or longer still?', '2. Cars on the highway (the city\'s traffic', '   system runs only in the city today)?', '3. The city side: South Street is the owner', '   side\'s. Fine if I only move the Desert end?', '4. The order of the exits as drawn?']: line(t)
im.save(os.path.join(HERE, 'desert_highway_plan.png')); print(im.size)
