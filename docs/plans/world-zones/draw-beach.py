# Draws The Beach plot plan from a layout json: python3 draw-beach.py beach-layout-2.json beach_plot_plan_2.png
import json, sys, random
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
L = json.load(open(src)); R = L['rooms'][0]; cells = R['cells']
S = 12; PC = L['plotCells']; W = len(cells[0]); H = len(cells); ox, oy = 60, 96
COL = {'w': (62,120,184), 'r': (104,104,108), 'd': (222,190,134), 'u': (70,134,134), 'a': (16,40,70), 'B': (124,66,50),
       'o': (136,132,126), 'h': (66,58,56), 'l': (240,110,30), 'j': (170,134,96), 'D': (196,164,104), 'T': (30,92,60)}
NAME = {'w': 'water', 'r': 'rock (cannot walk)', 'd': 'sand', 'u': 'sea floor', 'a': 'the drop into the dark', 'B': 'building',
        'o': 'cobbles / worn stone', 'h': 'scorched rock (cannot walk)', 'l': 'lava (cannot walk)', 'j': 'plank pier / deck', 'D': 'dunes', 'T': 'hedge / kelp (cannot walk)'}
def font(n, b=False):
    try: return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), n)
    except Exception: return ImageFont.load_default()
im = Image.new('RGB', (ox + W*S + 560, oy + H*S + 60), (24,26,22)); d = ImageDraw.Draw(im); random.seed(7)
for y, row in enumerate(cells):
    for x, c in enumerate(row):
        b = COL.get(c, (255,0,255)); k = random.randint(-5,5) if c in 'dDru' else 0
        d.rectangle([ox+x*S, oy+y*S, ox+x*S+S-1, oy+y*S+S-1], fill=tuple(max(0,min(255,v+k)) for v in b))
def txt(x, y, s, f, fill=(255,255,255)):
    d.text((x+1, y+1), s, font=f, fill=(0,0,0)); d.text((x, y), s, font=f, fill=fill)
WAY = {'open': (60,230,100), 'secret': (255,110,200), 'inside': (255,190,60), 'new': (90,200,255)}
for p in R['plots']:
    px, py = int(p['id'][1:3]), int(p['id'][4:6]); x0, y0 = ox+px*PC*S, oy+py*PC*S
    d.rectangle([x0, y0, x0+PC*S, y0+PC*S], outline=(0,0,0))
    if p['name']: txt(x0+5, y0+4, p['name'], font(12, True)); txt(x0+5, y0+20, '%s  L%d' % (p['id'], p['level']), font(9), (230,220,160))
    else: d.text((x0+5, y0+4), p['id'], font=font(9), fill=(150,185,225))
    ex = p.get('exit')
    if ex:
        ex = ex if isinstance(ex[0], list) else [ex]
        for i, (label, kind) in enumerate(ex):
            cx, cy = x0+PC*S//2, y0+PC*S//2+10+i*34
            f = font(9); w = d.textlength(label, font=f)
            d.ellipse([cx-8, cy-8, cx+8, cy+8], fill=WAY[kind], outline=(0,0,0))
            d.rectangle([cx-w/2-4, cy+10, cx+w/2+4, cy+25], fill=(0,0,0)); d.text((cx-w/2, cy+11), label, font=f, fill=WAY[kind])
DC = [(236,180,70), (150,140,200), (120,200,255), (255,80,80)]; DN = list(L['districts'].values())
PD = {(int(p['id'][1:3]), int(p['id'][4:6])): p['district'] for p in R['plots']}
for (c, r), dn in PD.items():                      # a district's outline = every plot side that meets another district
    x0, y0, x1, y1 = ox+c*PC*S, oy+r*PC*S, ox+(c+1)*PC*S, oy+(r+1)*PC*S; col = DC[DN.index(dn) % 4]
    for (dc, dr, seg) in ((0,-1,[x0,y0+2,x1,y0+2]), (0,1,[x0,y1-2,x1,y1-2]), (-1,0,[x0+2,y0,x0+2,y1]), (1,0,[x1-2,y0,x1-2,y1])):
        if PD.get((c+dc, r+dr), dn) != dn: d.line(seg, fill=col, width=3)
if L.get('triangle'):
    t = [(ox+x*S, oy+y*S) for x, y in L['triangle']]; d.line(t + [t[0]], fill=(255,230,60), width=4)
    q = t[1]; d.line([q[0]-22, q[1], q[0]-22, q[1]-22, q[0], q[1]-22], fill=(255,230,60), width=2)
d.rectangle([ox, oy, ox+W*S, oy+H*S], outline=(255,255,255), width=3)
txt(ox, 22, 'THE BEACH  ·  plot %s for your OK  ·  %d x %d plots, %d x %d m  ·  one plot = 12 x 12 squares of 3.5 m' %
    (L['version'].replace('-', ' '), R['cols'], R['rows'], W*3.5, H*3.5), font(19, True))
txt(ox, 54, L.get('note', ''), font(12), (200,200,200))
x, y = ox+W*S+30, oy+10
def head(s):
    global y; y += 10; txt(x, y, s, font(14, True)); y += 24
def line(s, c=None, f=(215,215,215)):
    global y
    if c: d.rectangle([x, y, x+15, y+15], fill=c, outline=(200,200,200))
    d.text((x+(24 if c else 0), y), s, font=font(12), fill=f); y += 21
head('DISTRICTS')
import collections; CNT = collections.Counter(p['district'] for p in R['plots'])
for i, v in enumerate(L['districts'].values()): line('%s  (%d plots)' % (v, CNT[v]), (236,180,70) if i == 0 else [(150,140,200), (120,200,255), (255,80,80)][i-1] if i < 4 else None)
if L.get('triangle'): line('the Triangle itself (a right triangle)', (255,230,60))
head('GROUND')
for k in 'wrduaBojDThl': line(NAME[k], COL[k])
head('WAYS')
for k, s in (('open','way in or out, open'), ('secret','hidden, found later (exists today)'), ('inside','door to an inside that exists'), ('new','new: not in the game today')):
    d.ellipse([x, y, x+14, y+14], fill=WAY[k]); d.text((x+24, y), s, font=font(12), fill=(215,215,215)); y += 21
head('CHANGED IN THIS PLAN')
for s in L.get('changes', []): line(s)
im.save(out); print(out, im.size)
