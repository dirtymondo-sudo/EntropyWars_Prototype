import json, os, io, base64, hashlib
from PIL import Image, ImageDraw
exec(open('faces.py').read().split("res = {}; sheet = []")[0])   # u, OUT, ov, face()
U = json.load(open('urls2.json')); DL = json.load(open('dl2.json'))
def enc(im):
    b = io.BytesIO(); im.save(b, 'WEBP', lossless=True, quality=100, method=6); return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
def enc_lossy(im):
    b = io.BytesIO(); im.save(b, 'WEBP', quality=88, method=6); return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
def model(name):
    p = 'render/' + name + '.png'
    return Image.open(p).convert('RGBA').resize((96, 96), Image.LANCZOS) if os.path.exists(p) else None
out = {}; sheet = []
for r, x in U.items():
    for g in x['genders']:
        v = x['v'][g]; kind = None; im = None
        pk, sk = v['portrait'], v['sprite']
        o = ov.get(r + ':' + g, ov.get(r, {}))
        if isinstance(pk, str) and pk in DL and pk != sk and not o.get('useSprite'): im = Image.open(DL[pk]).convert('RGBA'); kind = 'portrait'
        elif isinstance(sk, str) and sk in DL:
            ov[r] = o; im = face(Image.open(DL[sk]), r); kind = 'face'
        elif r == 'streamer': im = model('streamer_' + g[0]); kind = 'model'
        if im is None: continue
        if kind != 'model': im = im.resize((OUT, OUT), Image.NEAREST if im.size[0] <= OUT * 2.2 and kind == 'face' else Image.BOX if im.size[0] % OUT == 0 else Image.LANCZOS)
        out[r + '|' + g] = {'k': kind, 'u': enc(im) if kind != 'model' else enc_lossy(im)}; sheet.append((r[:10] + ' ' + g[0], kind, im))
for c in 'locke belle glass knox ringer doorman dorian elle father janitor mother otto player rhonda kit cult1 cult2 cult3 cult4 cult5'.split():
    im = model(c)
    if im: out['cast|' + c] = {'k': 'model', 'u': enc_lossy(im)}; sheet.append((c, 'model', im))
cols = 20; cell = 80; rows = (len(sheet) + cols - 1) // cols
S = Image.new('RGB', (cols * cell, rows * (cell + 12)), (40, 44, 52)); d = ImageDraw.Draw(S)
for i, (r, k, im) in enumerate(sheet):
    x, y = (i % cols) * cell, (i // cols) * (cell + 12); t = im.resize((cell, cell), Image.NEAREST if k != 'model' else Image.LANCZOS)
    S.paste(t, (x, y), t); d.text((x + 1, y + cell), r, fill={'portrait': (255, 255, 120), 'model': (120, 255, 255)}.get(k, (220, 220, 220)))
S.save('sheet2.png'); json.dump(out, open('portraits2.json', 'w'))
from collections import Counter
print(len(out), Counter(v['k'] for v in out.values()), sum(len(v['u']) for v in out.values()))
