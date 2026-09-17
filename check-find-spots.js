#!/usr/bin/env node
// check-find-spots.js — THE FINDS AUDIT (PHASE9_QUALITY_PLAN §6 D9, 2026-09-16).
// A headless dump of every generated find: room → spot → how the generator
// got there (the relax pass, the distance from the way in, on a board / a
// shelf / a wall cell) and what LESSON the spot teaches as it stands
// (observation · navigation · portal · fight · evidence). `--suggest` lists
// the rows worth a hand pin in DOOR_HQ.findSpots (a relaxed spot, a spot
// within arm's reach of the way in, a spot on the floor of a big room).
// The user owns WHICH tapes are pinned (§14 row E) — this prints the case.
//   node check-find-spots.js [--suggest] [--json] [room-substring]
'use strict';
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const args = process.argv.slice(2), want = args.find(a => !a.startsWith('--')) || '';
const suggest = args.includes('--suggest'), asJson = args.includes('--json');
function landing(room, d) {
    const S = room.shell || {}, in_ = 2.4;
    if (d.wall === 'free') return { x: d.x || 0, z: d.z || 0 };
    if (d.wall === 'n') return { x: d.x || 0, z: -S.d / 2 + in_ };
    if (d.wall === 's') return { x: d.x || 0, z: S.d / 2 - in_ };
    if (d.wall === 'e') return { x: S.w / 2 - in_, z: d.z || 0 };
    return { x: -S.w / 2 + in_, z: d.z || 0 };
}
const rows = [];
for (const f of HQ.finds) {
    const room = HQ.rooms[f.room]; if (!room) continue;
    if (want && f.room.indexOf(want) < 0) continue;
    const S = room.shell || {};
    const way = (room.doors && room.doors[0]) ? landing(room, room.doors[0]) : (room.spawn || { x: 0, z: 0 });
    const dist = Math.hypot(f.x - way.x, f.z - way.z);
    const pinned = !!(HQ.findSpots[f.room] && (f.kind === 'tape' ? (HQ.findSpots[f.room].tape || HQ.findSpots[f.room].tape2) : HQ.findSpots[f.room][f.kind]));
    const tape = f.tape ? D.hqTapeById(f.tape) : null;
    let lesson = 'observation';
    if (f.hard) lesson = 'portal';
    else if (f.cell || room.cave || room.terrain || f.y > 0.5) lesson = 'navigation';
    else if (f.guard) lesson = 'fight';
    else if (tape && tape.kind === 'evidence' && dist > 8) lesson = 'evidence';
    const flags = [];
    if (f.relax > 0) flags.push('relaxed×' + f.relax);
    if (!f.cell && dist < 4) flags.push('near the way in');
    if (!f.cell && !room.cave && !room.terrain && f.y == null && S.w * S.d > 200 && lesson === 'observation') flags.push('floor of a big room');
    rows.push({ id: f.id, room: f.room, kind: f.kind, x: f.x, z: f.z, y: f.y, cell: f.cell, hard: !!f.hard, guard: !!f.guard, quiet: !!room.quiet, relax: f.relax | 0, dist: Math.round(dist * 10) / 10, pinned, lesson, flags, num: tape ? tape.num : null });
}
if (asJson) { console.log(JSON.stringify(rows, null, 1)); process.exit(0); }
const pad = (s, n) => String(s == null ? '' : s).padEnd(n).slice(0, n);
console.log(pad('find', 46) + pad('kind', 5) + pad('spot (x, z, y)', 24) + pad('relax', 6) + pad('way-in m', 9) + pad('lesson', 12) + pad('pin', 4) + 'flags');
for (const r of rows) console.log(pad(r.id, 46) + pad(r.kind, 5) + pad(r.x + ', ' + r.z + (r.y != null ? ', ' + r.y : ''), 24) + pad(r.relax, 6) + pad(r.dist, 9) + pad(r.lesson, 12) + pad(r.pinned ? 'PIN' : '', 4) + r.flags.join(' · '));
const by = k => rows.reduce((m, r) => { m[r[k]] = (m[r[k]] || 0) + 1; return m; }, {});
console.log('\n' + rows.length + ' finds · lessons ' + JSON.stringify(by('lesson')) + ' · relaxed ' + rows.filter(r => r.relax > 0).length + ' · near the way in ' + rows.filter(r => r.flags.includes('near the way in')).length + ' · pinned ' + rows.filter(r => r.pinned).length + ' · quiet rooms without pay ' + Object.keys(HQ.rooms).filter(k => HQ.rooms[k].quiet).length);
if (suggest) {
    console.log('\nWORTH A HAND PIN (DOOR_HQ.findSpots):');
    for (const r of rows.filter(r => r.flags.length && !r.pinned)) console.log('  ' + r.id + '  ' + r.flags.join(' · ') + '  (now ' + r.x + ', ' + r.z + ')');
}
