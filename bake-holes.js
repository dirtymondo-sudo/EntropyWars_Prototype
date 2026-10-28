#!/usr/bin/env node
// bake-holes.js — THE GAPS (2026-10-28, mondo: "see how there are these areas of completely enclosed walls? i would like those to be
// gaps in the map, since having a floor there is pointless ... Get rid of all of these pointless rooms/areas/enclosed spaces").
//
// For every terrain room the tool compiles the floor plan and finds the battle squares nobody can ever stand in
// (data.js hqTerrainSealedSquares: ground no walker reaches from the spawn or a door, past the walker's body from any ground it
// does reach, at the room's floor, with nothing standing on it), and writes them to data.js HQ_ROOM_HOLES (between the
// <ROOM HOLES> markers) — the room draws a pit there and the walker never stands there (data.js THE GAPS). A room whose own
// `terrain.holes` is set (the editor's GAP tool) is skipped: those are his. Then it checks every arena cut (the 12×12 picks, the
// 9 / 10 / 11 picks, the own boards, the Clash stage): a cell of an arena window that the gaps change is printed, so the
// arena can be re-baked (bake-arenas.js) — the gaps never touch a square a fight could stand on unless the walker never could.
//
//   node bake-holes.js              (every terrain room; several minutes)
//   node bake-holes.js --dry-run    (print, write nothing)
//   node bake-holes.js <roomId…>    (only those rooms; every other row stands)
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');

const DRY = process.argv.includes('--dry-run');
const ONLY = process.argv.slice(2).filter(a => !a.startsWith('--'));
const DATA = path.join(__dirname, 'data.js');

const sb = loadGameData({ quiet: true });
const ev = (s) => vm.runInContext(s, sb);
const ROOMS = ev('DOOR_HQ.rooms');
const TABLE = ev('HQ_ROOM_HOLES');

const ids = (ONLY.length ? ONLY : Object.keys(ROOMS)).filter(id => ROOMS[id] && ROOMS[id].terrain);
const rows = Object.assign({}, TABLE);
let total = 0;
const t0 = Date.now();
ids.forEach((id, n) => {
    const room = ROOMS[id];
    if (room.terrain.holes !== undefined) { console.log(`[${n + 1}/${ids.length}] ${id}: its own gaps (the editor's) — skipped`); return; }
    delete TABLE[id];   // the room compiles as it is, with no baked gaps
    room._terrainInfo = null; room._fieldTerrain = null;
    const t = Date.now();
    let runs = [];
    try { runs = sb.hqTerrainSealedSquares(room, id); } catch (e) { console.warn(`[${n + 1}/${ids.length}] ${id}: failed — ${e.message}`); return; }
    const sq = runs.reduce((a, r) => a + (r[2] - r[1] + 1), 0);
    if (sq) { rows[id] = runs; TABLE[id] = runs; total += sq; } else delete rows[id];
    room._terrainInfo = null; room._fieldTerrain = null;
    console.log(`[${n + 1}/${ids.length}] ${id}: ${sq} squares (${((Date.now() - t) / 1000).toFixed(1)} s)`);
});
console.log(`gaps: ${total} squares in ${Object.keys(rows).filter(k => ids.includes(k)).length} rooms, ${((Date.now() - t0) / 1000).toFixed(0)} s`);

/* THE ARENAS: each cut's window, rastered with and without the gaps */
const R = ev('HQ_ARENA_RULES'), CL = ev('typeof HQ_CLASH_STAGE !== "undefined" ? HQ_CLASH_STAGE : null');
const cuts = [];
[['picks', R.size], ['picks9', 9], ['picks10', 10], ['picks11', 11]].forEach(([k, S]) => Object.keys(R[k] || {}).forEach(site => { const p = R[k][site]; if (p && p.room) cuts.push({ name: `${site} ${S}×${S}`, p, S }); }));
Object.keys(R.own || {}).forEach(id => { const p = R.own[id]; if (p && p.room) cuts.push({ name: `own ${id}`, p, S: p.S || (p.cells ? Math.round(Math.sqrt(p.cells.length / 2)) : R.size) }); });
if (CL && CL.pick && CL.pick.room) cuts.push({ name: 'clash stage', p: CL.pick, S: CL.S });
const sig = (c) => c.in ? 'in' + c.tile + ':' + c.key + (c.deck ? '+d' : '') : c.hazard ? 'hz' + c.tile + ':' + c.fluid : 'rock';
let changed = 0;
cuts.filter(c => rows[c.p.room] && ids.includes(c.p.room)).forEach(c => {
    const room = ROOMS[c.p.room];
    const ras = () => { room._fieldTerrain = null; return sb.hqFieldRaster(c.p.room, c.p.ox, c.p.oz, c.S, c.S); };
    room._terrainInfo = null;
    const withG = ras();
    const keep = TABLE[c.p.room]; delete TABLE[c.p.room]; room._terrainInfo = null;
    const without = ras();
    TABLE[c.p.room] = keep; room._terrainInfo = null; room._fieldTerrain = null;
    const diff = [];
    for (let y = 0; y < c.S; y++) for (let x = 0; x < c.S; x++) { const a = sig(without.cells[y][x]), b = sig(withG.cells[y][x]); if (a !== b) diff.push(`${x},${y} ${a} → ${b}`); }
    if (diff.length) { changed++; console.log(`ARENA ${c.name} (${c.p.room}): ${diff.length} cells change — re-bake it: ${diff.slice(0, 8).join(' · ')}`); }
    else console.log(`arena ${c.name}: unchanged`);
});
if (!changed) console.log('every arena cut over a gapped room is unchanged');

if (DRY) { console.log('(dry run: nothing written)'); process.exit(0); }
const src = fs.readFileSync(DATA, 'utf8');
const A = '/* <ROOM HOLES> — bake-holes.js writes this table (node bake-holes.js); one row per room id */\n', B = '/* </ROOM HOLES> */';
const i0 = src.indexOf(A), i1 = src.indexOf(B);
if (i0 < 0 || i1 < i0) { console.error('the <ROOM HOLES> markers are missing from data.js'); process.exit(1); }
const keys = Object.keys(rows).sort();
const body = 'const HQ_ROOM_HOLES = {' + (keys.length ? '\n' + keys.map(k => '    ' + JSON.stringify(k) + ': ' + JSON.stringify(rows[k]) + ',').join('\n') + '\n' : '') + '};\n';
fs.writeFileSync(DATA, src.slice(0, i0 + A.length) + body + src.slice(i1));
console.log(`wrote ${keys.length} rows to data.js HQ_ROOM_HOLES`);
