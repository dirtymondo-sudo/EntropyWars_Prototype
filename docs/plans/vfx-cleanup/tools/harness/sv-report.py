#!/usr/bin/env python3
"""Spell VFX audit report: per-spell contact sheets + batch overview pages + report.md with automatic hints.
   python3 sv-report.py DIR [--title "B1 ..."]   (DIR = an sv-run.js --out folder; re-run any time)"""
import json, os, sys, subprocess, math
from PIL import Image, ImageStat, ImageDraw, ImageFont
D = sys.argv[1]; TITLE = sys.argv[sys.argv.index('--title') + 1] if '--title' in sys.argv else os.path.basename(D.rstrip('/'))
recs = {}
for l in open(os.path.join(D, 'records.jsonl')):
    try: r = json.loads(l)
    except Exception: continue
    if r.get('ok') or r['id'] not in recs: recs[r['id']] = r
os.makedirs(os.path.join(D, 'sheets'), exist_ok=True)
try: FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15); FB = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
except Exception: FONT = FB = ImageFont.load_default()
TW, TH, COLS = 480, 270, 4

def wrap(t, n):
    out, line = [], ''
    for w in (t or '').split():
        if len(line) + len(w) + 1 > n: out.append(line); line = w
        else: line = (line + ' ' + w).strip()
    if line: out.append(line)
    return out

def frame_stats(p):
    im = Image.open(p).convert('L').resize((160, 90)); st = ImageStat.Stat(im)
    return st.mean[0], st.stddev[0]

def sheet(r):
    sd = os.path.join(D, 'shots', r['id'])
    files = sorted(f for f in os.listdir(sd) if f.endswith('.jpg')) if os.path.isdir(sd) else []
    hints = []
    fr = {f['label']: f for f in r.get('frames', [])}
    stats = {}
    for f in files: stats[f] = frame_stats(os.path.join(sd, f))
    rows = math.ceil(max(1, len(files)) / COLS)
    head = wrap(r.get('desc', ''), 150)
    HH = 34 + 20 * len(head) + 6
    S = Image.new('RGB', (COLS * TW, HH + rows * (TH + 22)), (16, 14, 20)); dr = ImageDraw.Draw(S)
    dr.text((8, 6), '%s  `%s`  · %s · %s · el %s%s · T%s r%s · path %s' % (r.get('name'), r['id'], r.get('race'), r.get('kind'), r.get('element'), ('/vfx ' + r['vfxElement']) if r.get('vfxElement') else '', r.get('tier'), r.get('range'), r.get('path')), font=FB, fill=(240, 220, 160))
    for i, l in enumerate(head): dr.text((8, 34 + 20 * i), l, font=FONT, fill=(200, 200, 210))
    frames = r.get('frames', [])
    for i, f in enumerate(files):
        im = Image.open(os.path.join(sd, f)).resize((TW, TH)); x, y = (i % COLS) * TW, HH + (i // COLS) * (TH + 22)
        S.paste(im, (x, y + 22))
        meta = frames[i] if i < len(frames) else {}
        cam = meta.get('cam') or {}
        dr.text((x + 4, y + 3), '%s  %sms  yaw %s tilt %s zoom %s' % (f[:-4], meta.get('ms', ''), cam.get('yaw', '?'), cam.get('tilt', '?'), cam.get('zoom', '?')), font=FONT, fill=(170, 200, 255))
    out = os.path.join(D, 'sheets', r['id'] + '.jpg'); S.save(out, quality=78)
    # --- hints (leads, not verdicts) ---
    if not r.get('ok'): hints.append('capture failed: ' + str(r.get('err')))
    if r.get('rejected'): hints.append('the engine refused every aim (nothing cast)')
    if r.get('path') == 'direct': hints.append('cast through GAME.doSpell, not the HUD (' + str(r.get('note', '')) + ')')
    if r.get('ok') and r.get('hitAt') is None and r.get('kind') not in ('buff', 'shield', 'summonUnit', 'teleport', 'escape', 'weather', 'terrainCreate', 'deployObject', 'deployTurret', 'placeTrap', 'placeMirror'):
        hints.append('no HP change / log line seen while shooting')
    for e in (r.get('errs') or [])[:4]: hints.append('error: ' + e[:160])
    for b in (r.get('badReq') or [])[:4]: hints.append('asset failed: ' + b[:160])
    prev = None; prev_lbl = None
    for f, m in zip(files, frames):
        mean, sd_ = stats[f]
        if mean < 12: hints.append('%s: near-black frame (mean %.0f) - a cut or a full-screen layer?' % (f[:-4], mean))
        elif sd_ < 9: hints.append('%s: flat frame (contrast %.0f) - full-screen layer?' % (f[:-4], sd_))
        if m.get('label') == 'chg' or (prev_lbl == 'chg'):
            if not m.get('target') and r.get('kind') not in ('heal', 'buff', 'selfHeal'): hints.append('%s: target not on screen' % f[:-4])
        cam = m.get('cam') or {}
        if prev and cam.get('yaw') is not None and prev.get('yaw') is not None:
            dy = abs((cam['yaw'] - prev['yaw'] + 180) % 360 - 180)
            if dy > 100: hints.append('%s: camera yaw jumped %d deg since the last frame' % (f[:-4], dy))
        if cam: prev = cam
        prev_lbl = m.get('label')
    if r.get('note') and r.get('path') != 'direct': hints.append(r['note'])
    return out, hints, files

rows = []
for id_, r in sorted(recs.items(), key=lambda kv: (kv[1].get('race', ''), kv[0])):
    out, hints, files = sheet(r)
    rows.append((r, out, hints, files))
# overview pages: the hit frame (else the middle one) of each spell, 4x4 per page
pages = []
tiles = []
for r, out, hints, files in rows:
    sd = os.path.join(D, 'shots', r['id'])
    # the most colourful mid-cast frame (VFX are saturated; the board and HUD are not)
    def sat(f):
        im = Image.open(os.path.join(sd, f)).convert('HSV').resize((160, 90)); return ImageStat.Stat(im).mean[1]
    mids = [f for f in files if not f.startswith('00_') and '_end' not in f]
    pick = max(mids, key=sat) if mids else (files[0] if files else None)
    tiles.append((r, os.path.join(sd, pick) if pick else None))
for p in range(0, len(tiles), 16):
    S = Image.new('RGB', (4 * TW, 4 * (TH + 24)), (16, 14, 20)); dr = ImageDraw.Draw(S)
    for i, (r, f) in enumerate(tiles[p:p + 16]):
        x, y = (i % 4) * TW, (i // 4) * (TH + 24)
        if f: S.paste(Image.open(f).resize((TW, TH)), (x, y + 24))
        dr.text((x + 4, y + 3), '%s (%s, %s)' % (r.get('name'), r.get('race'), r.get('element')), font=FONT, fill=(240, 220, 160))
    fn = os.path.join(D, 'sheets', '_overview_%02d.jpg' % (p // 16 + 1)); S.save(fn, quality=75); pages.append(fn)
md = ['# %s - spell VFX capture report' % TITLE, '', '%d spells. Sheets: sheets/<id>.jpg (all frames), overview pages sheets/_overview_NN.jpg (the hit frame of each spell).' % len(rows),
      'Hints are automatic leads, not verdicts. Judge every sheet by eye.', '']
for r, out, hints, files in rows:
    md.append('## %s `%s` (%s, %s, el %s%s) - %d frames, path %s' % (r.get('name'), r['id'], r.get('race'), r.get('kind'), r.get('element'), ('/vfx ' + r['vfxElement']) if r.get('vfxElement') else '', len(files), r.get('path')))
    md.append('> ' + (r.get('desc') or '').replace('\n', ' '))
    md.append('sheet: sheets/%s.jpg · log: %s' % (r['id'], ' / '.join((r.get('log') or [])[:3])[:300]))
    for h in hints: md.append('- ⚑ ' + h)
    md.append('')
open(os.path.join(D, 'report.md'), 'w').write('\n'.join(md))
print('report', os.path.join(D, 'report.md'), len(rows), 'spells,', len(pages), 'overview pages')
