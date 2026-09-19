#!/usr/bin/env node
// check-area-content.js — THE CONTENT AUDIT (AREA_CONTENT_PLAN.md, 2026-09-19): how much of a
// box / terrain room is CLIMB, how exposed its doors are, and what it hides. Read-only; prints a
// table per room and the family averages the plan's rules are set against. Usage:
//   node check-area-content.js [--json] [--all] [roomId …]     (default: the explorable parts — rooms with a site)
'use strict';
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const args = process.argv.slice(2), json = args.includes('--json'), all = args.includes('--all');
const pick = args.filter(a => !a.startsWith('--'));
const CLIMB = ['ramp', 'plateau', 'deck', 'wall', 'climb'];
const rows = [];
for (const [id, r] of Object.entries(HQ.rooms)) {
    if (r.kind !== 'box') continue;
    if (pick.length ? !pick.includes(id) : (!all && !r.site)) continue;
    const sh = r.shell || {}; const w = sh.w || r.w || 0, d = sh.d || r.d || 0, h = sh.h || r.h || 0;
    const doors = r.doors || [];
    const byWall = {};
    for (const dr of doors) (byWall[dr.wall || '?'] ||= []).push(dr);
    let minGap = Infinity, close = 0;
    for (const [wall, ds] of Object.entries(byWall)) {
        if (wall === 'free' || wall === '?') continue;
        const pos = ds.map(x => (wall === 'n' || wall === 's') ? x.x : x.z).filter(v => typeof v === 'number').sort((a, b) => a - b);
        for (let i = 1; i < pos.length; i++) { const g = pos[i] - pos[i - 1]; if (g < minGap) minGap = g; if (g < 12) close++; }
    }
    const maxOnWall = Math.max(0, ...Object.values(byWall).map(a => a.length));
    const hidden = doors.filter(x => x.secret || x.way).length;
    const rec = { id, label: r.label || '', site: r.site || '', part: r.part || '', family: r.terrain ? ((r.terrain.gen || {}).kind || 'field') : 'box',
                  w, d, h, area: Math.round(w * d), doors: doors.length, maxOnWall, minGap: minGap === Infinity ? null : +minGap.toFixed(1), close, hidden,
                  props: (r.props || []).length, counters: (r.counters || []).length, npcs: (r.npcSpots || []).length,
                  range: null, climb: 0, kinds: 0, per100: null, floats: 0 };
    if (r.terrain) {
        try {
            const info = D.hqTerrainInfo(id);
            let hi = -1e9, lo = 1e9; for (const v of info.H) { if (v > hi) hi = v; if (v < lo) lo = v; }
            const feats = r.terrain.features || [];
            const cl = feats.filter(f => CLIMB.includes(f.k));
            rec.range = +(hi - lo).toFixed(1); rec.climb = cl.length; rec.kinds = new Set(cl.map(f => f.k === 'ramp' && f.stairs ? 'stairs' : f.k)).size;
            rec.floats = feats.filter(f => f.float).length; rec.per100 = +(cl.length / Math.max(1, w * d / 100)).toFixed(2);
        } catch (e) { rec.err = e.message.slice(0, 60); }
    }
    rows.push(rec);
}
rows.sort((a, b) => b.area - a.area);
if (json) { console.log(JSON.stringify(rows, null, 1)); process.exitCode = 0; }
else {
    const pad = (s, n) => String(s ?? '-').padEnd(n);
    console.log(pad('room', 42) + pad('family', 7) + pad('size', 13) + pad('doors', 6) + pad('mxW', 4) + pad('gap', 6) + pad('<12', 4) + pad('hid', 4) + pad('rng', 6) + pad('clmb', 5) + pad('knd', 4) + pad('/100', 6) + pad('prp', 4) + 'npc');
    for (const r of rows) console.log(pad(r.id, 42) + pad(r.family, 7) + pad(`${r.w}x${r.d}x${r.h}`, 13) + pad(r.doors, 6) + pad(r.maxOnWall, 4) + pad(r.minGap, 6) + pad(r.close, 4) + pad(r.hidden, 4) + pad(r.range, 6) + pad(r.climb, 5) + pad(r.kinds, 4) + pad(r.per100, 6) + pad(r.props, 4) + r.npcs);
    const fam = {};
    for (const r of rows) { const f = fam[r.family] ||= { n: 0, area: 0, per100: 0, range: 0, hidden: 0, t: 0 }; f.n++; f.area += r.area; f.hidden += r.hidden ? 1 : 0; if (r.per100 != null) { f.t++; f.per100 += r.per100; f.range += r.range; } }
    console.log('\nFAMILY        rooms  avg m²   climb/100m²  avg height range  rooms with a hidden exit');
    for (const [k, f] of Object.entries(fam)) console.log(pad(k, 14) + pad(f.n, 7) + pad(Math.round(f.area / f.n), 9) + pad(f.t ? (f.per100 / f.t).toFixed(2) : '-', 13) + pad(f.t ? (f.range / f.t).toFixed(1) + ' m' : '-', 18) + f.hidden + ' / ' + f.n);
    console.log('\nrooms with no hidden exit (no secret door, no way): ' + rows.filter(r => !r.hidden).length + ' / ' + rows.length);
    console.log('terrain rooms under 0.4 climb features / 100 m²: ' + rows.filter(r => r.per100 != null && r.per100 < 0.4).length + ' / ' + rows.filter(r => r.per100 != null).length);
    console.log('rooms with ≥ 3 doors on one wall: ' + rows.filter(r => r.maxOnWall >= 3).map(r => r.id + ' (' + r.maxOnWall + ')').join(', '));
    console.log('rooms with two doors < 12 m apart on one wall: ' + rows.filter(r => r.close > 0).map(r => r.id + ' (' + r.minGap + ' m)').join(', '));
}
