import json, subprocess, os, re, concurrent.futures as cf
u = json.load(open('urls.json'))
jobs = {}
for r, x in u.items():
    slug = re.sub(r'[^a-z0-9]+', '_', r)
    if x['portrait']: jobs[f'dl/{slug}__p.png'] = x['portrait']
    if isinstance(x['sprite'], str): jobs[f'dl/{slug}__s.png'] = x['sprite']
def go(kv):
    out, key = kv
    if os.path.exists(out) and os.path.getsize(out) > 200: return out, '200c'
    code = subprocess.run(['./fetch.sh', key, out], capture_output=True, text=True).stdout
    if code != '200' and os.path.exists(out): os.remove(out)
    return out, code
with cf.ThreadPoolExecutor(8) as ex:
    res = list(ex.map(go, jobs.items()))
bad = [(o, c, jobs[o]) for o, c in res if not c.startswith('200')]
print(len(res), 'bad', len(bad)); [print(b) for b in bad]
