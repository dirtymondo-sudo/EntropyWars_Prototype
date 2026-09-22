#!/usr/bin/env node
// check-field-windows.js — THE FIELD'S WINDOWS (PHASE9_QUALITY_PLAN §11.3 D, 2026-09-16).
// A headless dump of every WILD room's best window — the 8 × 8 an encounter
// fights from each door landing (data.js hqFieldWindow): a text grid per
// window plus THE EDGE — how much rock stands proud of each of the room's
// walls after the lattice's alignment (stage D), the doors on the frame's rim,
// the seats. This is stage D's acceptance for the user to read; the test
// (hq-field.test.js "STAGE D") proves the same rules on EVERY walkable cell.
//   node check-field-windows.js [--all] [--json] [room-substring]
//     --all   every door landing (default: the first door of each room)
//   Legend:  # rock · % rock PROUD of the wall (> edgeSnap) · . the floor ·
//            1 / 2 one / two levels up · ! a hazard · D a door's rim cell ·
//            W the walker · T the target · a / b the seats of P1 / P2
'use strict';
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const g = n => vm.runInContext(n, D);
const args = process.argv.slice(2), want = args.find(a => !a.startsWith('--')) || '';
const all = args.includes('--all'), asJson = args.includes('--json');
main();
function main() {
const R = g('HQ_FIELD_RULES'), C = R.box.cell;
const win = g('hqFieldWindow'), dump = g('hqFieldDump'), seatsOf = g('hqEncounterSeats'), roomInfo = g('hqFindRoomInfo'), caveInfo = g('hqCaveInfo'), doorCell = g('hqCaveDoorCell'), lattice = g('hqFieldLattice');
/* THE SEAMLESS FIELD, delivery 2 (2026-09-22): a TERRAIN room is a field room too, but its compile is seconds a room — the sweep takes them only with --terrain (or by name) */
const withTerrain = process.argv.includes('--terrain');
const rooms = g('hqComplexRooms()').filter(id => g('hqFieldRoomOk')(id) && (!want || id.indexOf(want) >= 0) && (withTerrain || want || !g('DOOR_HQ').rooms[id].terrain));
const out = [];
function targetNear(Lt, cell) {
    for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = cell.x + dx, y = cell.y + dy;
        if (x >= 0 && y >= 0 && x < Lt.w && y < Lt.h && Lt.walk(x, y)) return { x, y };
    }
    return null;
}
for (const id of rooms) {
    const room = HQ.rooms[id], Lt = lattice(id); if (!Lt) continue;
    const centre = (c) => ({ x: Lt.x0 + (c.x + 0.5) * C, z: Lt.z0 + (c.y + 0.5) * C });
    let starts = [];
    if (room.cave) {
        for (const d of room.doors || []) { const dc = doorCell(room, d); if (dc && dc.walk) starts.push({ id: d.id, cell: { x: dc.x, y: dc.y } }); }
    } else {
        const ri = roomInfo(id);
        (room.doors || []).forEach((d, i) => { const L = ri.landings[i]; if (!L || !isFinite(L.x)) return; let c = { x: Math.floor((L.x - Lt.x0) / C), y: Math.floor((L.z - Lt.z0) / C) }; if (!Lt.walk(c.x, c.y)) c = g('hqFieldNearestWalk')(Lt, c) || c; starts.push({ id: d.id, cell: c }); });
    }
    if (!all) starts = starts.slice(0, 1);
    for (const st of starts) {
        const t = targetNear(Lt, st.cell); if (!t) continue;
        const W = win(id, centre(st.cell), centre(t)); if (!W) { out.push({ room: id, door: st.id, error: 'no window' }); continue; }
        const Rr = W.raster;
        const free = (x, y) => { const c = Rr.cells[y] && Rr.cells[y][x]; return !!(c && c.in && !c.hazard && c.seat !== false); };
        const seats = seatsOf({ cells: W.cells }, { W: R.size, H: R.size, n1: R.teamSize, n2: R.teamSize, free });
        const grid = dump(Rr, { walker: W.cells.walker, target: W.cells.target, seats });
        const inN = Rr.cells.flat().filter(c => c.in).length;
        const proud = Rr.edges ? Object.keys(Rr.edges).map(k => k + ' ' + Rr.edges[k].proud.toFixed(2) + (Rr.edges[k].doors ? ' (' + Rr.edges[k].doors + ' door' + (Rr.edges[k].doors > 1 ? 's' : '') + ')' : '')).join(' · ') : 'a cave: no walls';
        const doors = (Rr.doors || []).map(d => d.id + '@' + d.wall + (d.rim ? ' rim ' + d.x + ',' + d.y : ' beyond the window') + (d.proud > R.box.edgeSnap ? ' PROUD ' + d.proud.toFixed(2) : ''));
        out.push({ room: id, label: room.label, door: st.id, id: W.id, kind: W.kind, origin: [W.ox, W.oz], reach: W.reach, inCells: inN, seats: !!seats, edges: proud, doors, grid });
    }
}
const bad = out.filter(r => r.error || !r.seats);
process.exitCode = bad.length ? 1 : 0;   // never process.exit(): a pipe still draining loses the tail
if (asJson) { process.stdout.write(JSON.stringify({ windows: out, bad: bad.map(r => r.room) }, null, 1) + '\n'); return; }
for (const r of out) {
    console.log('\n' + r.room + ' — ' + (r.label || '') + '  [from ' + r.door + ']');
    if (r.error) { console.log('  !! ' + r.error); continue; }
    console.log('  ' + r.id + '  ·  ' + r.kind + '  ·  reach ' + r.reach + ' / ' + r.inCells + ' IN  ·  seats ' + (r.seats ? 'ok' : 'NONE'));
    console.log('  walls: ' + r.edges);
    if (r.doors.length) console.log('  doors: ' + r.doors.join(' · '));
    r.grid.forEach(l => console.log('    ' + l.split('').join(' ')));
}
console.log('\n' + out.length + ' windows, ' + bad.length + ' without a legal field' + (bad.length ? ' — ' + bad.map(r => r.room).join(', ') : ''));
}
