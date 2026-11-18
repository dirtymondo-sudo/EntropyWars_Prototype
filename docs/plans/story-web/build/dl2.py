import json, subprocess, os, re, hashlib, concurrent.futures as cf
u = json.load(open('urls2.json')); os.makedirs('dl2', exist_ok=True)
jobs = {}
def fn(key): return 'dl2/' + hashlib.md5(key.encode()).hexdigest()[:12] + '.png'
for r, x in u.items():
    for g in x['genders']:
        for k in ('portrait', 'sprite'):
            key = x['v'][g][k]
            if isinstance(key, str): jobs[fn(key)] = key
def go(kv):
    out, key = kv
    if os.path.exists(out) and os.path.getsize(out) > 200: return out, '200'
    code = subprocess.run(['./fetch.sh', key, out], capture_output=True, text=True).stdout
    if code != '200' and os.path.exists(out): os.remove(out)
    return out, code
with cf.ThreadPoolExecutor(8) as ex: res = list(ex.map(go, jobs.items()))
bad = [(jobs[o], c) for o, c in res if c != '200']
print(len(res), 'bad', bad)
json.dump({v: k for k, v in jobs.items() if os.path.exists(k)}, open('dl2.json', 'w'))
