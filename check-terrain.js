#!/usr/bin/env node
// check-terrain.js — THE TERRAIN ROOMS (HQ plan 9.3 stage 4, 2026-09-17): dump every
// terrain room's field as ASCII (a digit per 0.875 m, ^ a cliff, ~ water waded, W deep,
// L lava, # a wall, T a tree, D a door pad) and prove every door reaches every other under
// the walker's own rule (data.js hqTerrainReach). Usage:
//   node check-terrain.js [roomId …] [--step 0.5] [--json]
'use strict';
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const args = process.argv.slice(2);
const json = args.includes('--json');
const stepArg = args.indexOf('--step'); const step = stepArg >= 0 ? parseFloat(args[stepArg + 1]) : 1.0;
const ids = args.filter(a => !a.startsWith('--') && a !== String(step)).length ? args.filter(a => !a.startsWith('--') && a !== String(step)) : D.hqTerrainRooms();
const out = [];
for (const id of ids) {
    const room = HQ.rooms[id]; if (!room || !room.terrain) { console.error('not a terrain room: ' + id); continue; }
    const info = D.hqTerrainInfo(id);
    const doors = room.doors || [];
    const landings = doors.map(d => Object.assign({ id: d.id }, D.hqTerrainDoorLanding(room, d)));
    const reach = landings.length ? D.hqTerrainReach(info, landings[0].x, landings[0].z) : new Map();
    const unreached = landings.filter(L => !reach.has(D.hqTerrainNodeKey(info, L.x, L.z))).map(L => L.id);
    let hi = -Infinity, lo = Infinity; for (let i = 0; i < info.H.length; i++) { if (info.H[i] > hi) hi = info.H[i]; if (info.H[i] < lo) lo = info.H[i]; }
    const rec = { id, w: info.S.w, d: info.S.d, res: info.res, grid: info.nx + '×' + info.nz, lo: +lo.toFixed(2), hi: +hi.toFixed(2), reach: reach.size, doors: landings.map(L => L.id + '@' + L.y), unreached, trees: info.trees.length, scatter: info.scatter.length, fluids: info.fluids.length, walls: info.walls.length };
    if (json) { out.push(rec); continue; }
    console.log('\n== ' + id + ' — ' + (room.label || '') + '  ' + rec.w + '×' + rec.d + ' m, res ' + rec.res + ' (' + rec.grid + '), heights ' + rec.lo + '…' + rec.hi);
    console.log('   doors: ' + rec.doors.join(' · ') + '   reach from ' + (landings[0] ? landings[0].id : '—') + ': ' + rec.reach + ' nodes' + (unreached.length ? '   UNREACHED: ' + unreached.join(', ') : '   (every door reached)'));
    console.log('   trees ' + rec.trees + ' · scatter ' + rec.scatter + ' · fluids ' + rec.fluids + ' · walls ' + rec.walls);
    D.hqTerrainDump(info, { step }).forEach(l => console.log('   ' + l));
}
if (json) console.log(JSON.stringify(out, null, 1));
