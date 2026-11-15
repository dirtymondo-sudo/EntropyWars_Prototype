#!/usr/bin/env python3
"""pull-meshy-anims.py (2026-11-11): THE MESHY ANIMATION PULL. Downloads animations from Meshy's library through the API
(docs.meshy.ai: POST /openapi/v1/rigging once, then POST /openapi/v1/animations {rig_task_id, action_ids: up to 10}), so
nobody downloads them 20 at a time by hand.

  python3 pull-meshy-anims.py <spec.json> <out dir> [set ...]        # spec = meshy-anim-pull.json
  python3 pull-meshy-anims.py --library                              # print Meshy's whole list: action_id | name | category

The spec names the rig (rig_task_id; when Meshy has expired it, the tool rigs rig_model again: 5 credits) and sets of
action_ids. Each batch of 10 lands as <out dir>/<set>_<n>.glb (one clip per action, named by Meshy's key); state is kept in
<out dir>/pull_state.json so a rerun only fetches what is missing. 3 credits a clip. Then: build-mal.py packs the batches.
AUTH: the cloud environment's Network secret adds the Meshy key to every request to api.meshy.ai (the header below is a
dummy the proxy replaces); the key is never in a file or in chat.
"""
import json, sys, time, os, subprocess

def api(method, path, body=None):
    cmd = ['curl', '-sS', '-m', '90', '-X', method, 'https://api.meshy.ai/openapi/v1' + path, '-H', 'Authorization: Bearer dummy', '-H', 'Content-Type: application/json']
    if body is not None: cmd += ['-d', json.dumps(body)]
    return json.loads(subprocess.check_output(cmd) or b'{}')

def wait(kind, tid):
    while True:
        t = api('GET', '/%s/%s' % (kind, tid))
        if t.get('status') in ('SUCCEEDED', 'FAILED', 'CANCELED'): return t
        time.sleep(10)

def main():
    if '--library' in sys.argv:
        for a in api('GET', '/animations/library'): print('%d | %s | %s' % (a['action_id'], a.get('key') or a.get('name'), a.get('category')))
        return
    spec_p, out = sys.argv[1], sys.argv[2]; only = sys.argv[3:]
    spec = json.load(open(spec_p)); os.makedirs(out, exist_ok=True)
    rig = spec.get('rig_task_id')
    if not rig or api('GET', '/rigging/' + rig).get('status') != 'SUCCEEDED':
        rig = api('POST', '/rigging', {'model_url': spec['rig_model'], 'height_meters': 1.8})['result']
        if wait('rigging', rig)['status'] != 'SUCCEEDED': sys.exit('rigging failed')
        spec['rig_task_id'] = rig; json.dump(spec, open(spec_p, 'w'), indent=1); print('new rig', rig)
    st_p = os.path.join(out, 'pull_state.json'); st = json.load(open(st_p)) if os.path.exists(st_p) else {}
    for cat, ids in spec['sets'].items():
        if only and cat not in only: continue
        for i in range(0, len(ids), 10):
            key = '%s_%d' % (cat, i // 10); b = ids[i:i + 10]; e = st.setdefault(key, {'ids': b})
            if e.get('ids') != b: e.clear(); e['ids'] = b
            if 'task' not in e:
                r = api('POST', '/animations', {'rig_task_id': rig, 'action_ids': b}); print(key, r, flush=True)
                if 'result' in r: e['task'] = r['result']; json.dump(st, open(st_p, 'w'))
    for key, e in st.items():
        if 'task' not in e or e.get('done'): continue
        t = wait('animations', e['task'])
        if t['status'] == 'SUCCEEDED':
            f = os.path.join(out, key + '.glb')
            subprocess.check_call(['curl', '-sS', '-m', '300', '-o', f, t['result']['animation_glb_url']])
            e['done'] = True; e['credits'] = t.get('consumed_credits'); print(key, 'ok', os.path.getsize(f), 'credits', e['credits'], flush=True)
        else: e['err'] = t.get('task_error'); print(key, t['status'], e['err'], flush=True)
        json.dump(st, open(st_p, 'w'))

if __name__ == '__main__':
    main()
