# THE PORTRAIT REFRESH, step 2 (see refresh.js): every race + gender's picture in roster.json from the game's art today.
# Run from this folder: python3 -I refresh-faces.py. A unit added after the bake (a live link, `ip`) is left live.
import json, os, io, base64, hashlib, subprocess, concurrent.futures as cf
from PIL import Image, ImageDraw
src = open('faces.py').read().split("res = {}; sheet = []")[0].replace("u = json.load(open('urls.json'))", "u = {}")
exec(src)   # OUT, ov, face()
U = json.load(open('cur-urls.json')); D = json.load(open('roster.json')); os.makedirs('dl3', exist_ok=True)
fn = lambda x: 'dl3/' + hashlib.md5(x.encode()).hexdigest()[:12] + '.png'
def get(x):
    f = fn(x)
    if os.path.exists(f) and os.path.getsize(f) > 200: return x, '200'
    c = subprocess.run(['curl', '-sS', '--compressed', '-o', f, '-w', '%{http_code}', x + '?r=' + hashlib.md5(os.urandom(8)).hexdigest()[:8]], capture_output=True, text=True).stdout
    if c != '200' and os.path.exists(f): os.remove(f)
    return x, c
with cf.ThreadPoolExecutor(12) as ex: res = list(ex.map(get, {v[k] for v in U.values() for k in 'ps' if v[k]}))
bad = [r for r in res if r[1] != '200']
if bad: print('not fetched:', bad)
n = 0; sheet = []
for r in D['races']:
    for v in r['v']:
        x = U.get(r['k'] + '|' + v['g']); o = ov.get(r['k'] + ':' + v['g'], ov.get(r['k'], {}))
        if not x or not v['img'].startswith('data:'): continue
        if x['p'] and x['p'] != x['s'] and os.path.exists(fn(x['p'])) and not o.get('useSprite'): im = Image.open(fn(x['p'])).convert('RGBA'); kind = 'portrait'
        elif x['s'] and os.path.exists(fn(x['s'])): ov[r['k']] = o; im = face(Image.open(fn(x['s'])), r['k']); kind = 'face'
        else: continue
        im = im.resize((OUT, OUT), Image.NEAREST if im.size[0] <= OUT * 2.2 and kind == 'face' else Image.BOX if im.size[0] % OUT == 0 else Image.LANCZOS)
        b = io.BytesIO(); im.save(b, 'WEBP', lossless=True, quality=100, method=6)
        v['img'] = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode(); v['ik'] = kind; n += 1; sheet.append((r['k'][:12] + ' ' + v['g'][0], im))
json.dump(D, open('roster.json', 'w'), separators=(',', ':'))
cols, cell = 20, 80; S = Image.new('RGB', (cols * cell, ((len(sheet) + cols - 1) // cols) * (cell + 12)), (40, 44, 52)); dr = ImageDraw.Draw(S)
for i, (k, im) in enumerate(sheet):
    t = im.resize((cell, cell), Image.NEAREST); x, y = (i % cols) * cell, (i // cols) * (cell + 12); S.paste(t, (x, y), t); dr.text((x + 1, y + cell), k, fill=(230, 230, 230))
S.save('sheet3.png'); print('refreshed', n, 'pictures; contact sheet sheet3.png')
