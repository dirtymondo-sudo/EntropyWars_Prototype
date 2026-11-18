import json, re, os, io, base64, sys
from PIL import Image
u = json.load(open('urls.json'))
OUT = 64
ov = json.load(open('face_overrides.json')) if os.path.exists('face_overrides.json') else {}
def face(im, r):
    im = im.convert('RGBA'); a = im.getchannel('A'); bb = a.point(lambda v: 255 if v > 24 else 0).getbbox()
    if not bb: return im
    l, t, rr, b = bb; h = b - t; w = rr - l
    o = ov.get(r, {})
    if o.get('whole'):
        m = max(w, h); c = Image.new('RGBA', (m, m), (0, 0, 0, 0)); c.paste(im.crop(bb), ((m - w) // 2, (m - h) // 2)); return c
    side = max(16, int(h * o.get('s', 0.46)))
    # centre x on the alpha mass of the top third
    px = a.load(); sx = n = 0
    for y in range(t, t + max(4, int(h * 0.3))):
        for x in range(l, rr):
            if px[x, y] > 24: sx += x; n += 1
    cx = (sx / n) if n else (l + rr) / 2
    cx += o.get('dx', 0) * h; top = t - side * 0.06 + o.get('dy', 0) * h
    x0 = int(round(cx - side / 2))
    box = (x0, int(round(top)), x0 + side, int(round(top)) + side)
    return im.crop(box)
res = {}; sheet = []
for r, x in u.items():
    slug = re.sub(r'[^a-z0-9]+', '_', r)
    p, s = f'dl/{slug}__p.png', f'dl/{slug}__s.png'
    kind = None
    if x['portrait'] and os.path.exists(p) and x['portrait']!=x['sprite'] and not ov.get(r, {}).get('useSprite'): im = Image.open(p).convert('RGBA'); kind = 'portrait'
    elif os.path.exists(s): im = face(Image.open(s), r); kind = 'face'
    else: res[r] = None; continue
    im = im.resize((OUT, OUT), Image.NEAREST if im.size[0] <= OUT * 2.2 and kind == 'face' else Image.BOX if im.size[0] % OUT == 0 else Image.LANCZOS)
    res[r] = (kind, im); sheet.append((r, kind, im))
# contact sheet
cols = 16; cell = 96; rows = (len(sheet) + cols - 1) // cols
from PIL import ImageDraw
S = Image.new('RGB', (cols * cell, rows * (cell + 14)), (40, 44, 52)); d = ImageDraw.Draw(S)
for i, (r, k, im) in enumerate(sheet):
    x, y = (i % cols) * cell, (i // cols) * (cell + 14)
    S.paste(im.resize((cell, cell), Image.NEAREST), (x, y), im.resize((cell, cell), Image.NEAREST))
    d.text((x + 2, y + cell), r[:15], fill=(255, 255, 120) if k == 'portrait' else (220, 220, 220))
S.save('sheet.png')
data = {}; tot = 0
for r, v in res.items():
    if not v: continue
    b = io.BytesIO(); v[1].save(b, 'WEBP', lossless=True, quality=100, method=6)
    data[r] = {'k': v[0], 'u': 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()}; tot += len(data[r]['u'])
json.dump(data, open('portraits.json', 'w'))
print(len(data), 'bytes', tot, 'portrait', sum(1 for v in data.values() if v['k'] == 'portrait'), 'face', sum(1 for v in data.values() if v['k'] == 'face'), 'none', [r for r, v in res.items() if not v])
