/* THE D.U.M.B., PLOT PLAN 2 (2026-11-16) — the REDESIGN on plots (mondo's order 11-16, docs/plans/ZONE_THREAD_BRIEF.md).
   `node docs/plans/world-zones/draw-dumb.js` writes:
     docs/plans/world-zones/dumb-layout-2.json   the plan (every plot: name, district, level, roof, what stands on it, the old room it comes from)
     docs/areas/dumb/layout.json                 the same plan, read by bake-dumb.js (the square map `cells`, the openings, the ways out)
     docs/plans/world-zones/dumb_plot_plan_2.png the picture (an SVG shot with playwright; without playwright the .svg stays)
   Plan 1 (dumb-layout.json / dumb_plot_plan.png, 6 x 6) was a first guess drawn before most of today's world existed; it stays as history.

   THE IDEA: the ULTIMATE secret base. All underground, no sky: light is the look. 7 x 7 plots of 12 x 12 squares (294 x 294 m), five districts:
     K  CERN, THE RING     the collider tunnel as an octagon round the whole base (the outer ring of plots), 14 m up on the entry level
     P  LEVEL P3           the tunnel every base is on, straight across the south from ring to ring: the tram, the platform, the bays
     S  SUB-LEVEL 7        the level that does not exist, 14 m under P3: the Hub with the Tower, four test chambers, every department off it
     R  RESEARCH           west of the hub, 3.5 m up: Dream Research, Clone Research, and the White Rooms (moved in from Area 51, mondo 11-16)
     C  COMMAND            east of the hub, 3.5 m up: the War Room and the billionaire's Bunker
   THE SQUARE MAP: x = rock (the wall), o = corridor, f = room floor, r = the ring's tunnel, j = the tram track, w = pool water.
   A plot's `level` is its floor (1 level = 1.75 m), `h` its roof over that floor (m). */
'use strict';
const fs = require('fs'), path = require('path');
const N = 12, G = 7, W = N * G;
const DIST = {
    K: { name: 'CERN, The Ring', col: '#3f7fb8' }, P: { name: 'Level P3', col: '#b8473f' }, S: { name: 'Sub-Level 7', col: '#8a8f98' },
    R: { name: 'Research', col: '#d9dde2' }, C: { name: 'Command', col: '#c9a24a' },
};
const cell = []; for (let y = 0; y < W; y++) cell.push(new Array(W).fill('x'));
const set = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (x >= 0 && y >= 0 && x < W && y < W) cell[y][x] = ch; };
const PLOTS = [];
/* a plot: r = [[x0, y0, x1, y1, ch]] in its own squares (the end exclusive), drawn in order */
const plot = (x, y, d, level, h, name, what, from, r) => { PLOTS.push({ id: 'P0' + x + '-0' + y, name, d, level, h, what, from }); (r || []).forEach(q => set(x * N + q[0], y * N + q[1], x * N + q[2], y * N + q[3], q[4])); };

/* ── K: THE RING. An octagon band four squares wide, four squares in from the map's edge; a short 45° cut at each corner. ── */
{ const c = W / 2, T = 27; for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const dx = Math.abs(x + 0.5 - c), dy = Math.abs(y + 0.5 - c), n = Math.max(dx, dy, dx + dy - T); if (n >= 34 && n < 38) cell[y][x] = 'r'; } }
let ringNo = 0; const RING = (x, y, r) => plot(x, y, 'K', 6, 5.25, 'The Ring ' + (++ringNo), 'the collider tunnel: the beam pipe on the outer wall, a walk beside it', 'CERN: THE RING (the loop hall)', r);
const SVC = n => ['Service Room ' + n, 'a dead-end service room off the ring\'s corner', 'CERN: service room ' + n + ' (a dead end off a corner)'];
/* row 0 */
plot(0, 0, 'K', 6, 5.25, ...SVC(1), [[9, 9, 12, 12, 'f']]);
RING(1, 0); RING(2, 0);
plot(3, 0, 'K', 6, 5.25, 'The Control Room', 'the control room north of the ring, the servers; the Vent: a ladder shaft 14 m down to Level -6', 'CERN: THE CONTROL ROOM · the service bay; Sub-Level 7: THE VENT', [[2, 1, 10, 4, 'f'], [5, 8, 8, 12, 'o'], [8, 8, 11, 10, 'f']]);
RING(4, 0); RING(5, 0);
plot(6, 0, 'K', 6, 5.25, ...SVC(2), [[0, 9, 3, 12, 'f']]);
/* the ring's west and east sides, rows 1..4 */
RING(0, 1); RING(6, 1); RING(0, 2); RING(6, 2);
plot(0, 3, 'K', 6, 8.75, 'The Beam Dump', 'the pile the beam is dumped on, 7 m of it: do not stand there', 'CERN: THE BEAM DUMP', [[1, 2, 4, 10, 'f']]);
plot(6, 3, 'K', 6, 10.5, 'The Detector Hall', 'LANDMARK: the detector in its pit, 5.25 m under the ring\'s catwalks; CERN\'s battle marker on the rim', 'CERN: THE DETECTOR HALL · THE BEAM · THE GANTRY', [[1, 1, 4, 11, 'f'], [8, 1, 11, 11, 'f'], [4, 1, 8, 11, 'r']]);
RING(0, 4); RING(6, 4);
/* row 6 */
plot(0, 6, 'K', 6, 5.25, ...SVC(3), [[9, 0, 12, 3, 'f']]);
RING(1, 6); RING(2, 6);
plot(3, 6, 'K', 6, 5.25, 'The Blast Door', 'the collider blast door: Room 999\'s way in from the bay; hum audible', 'CERN: the bay door (the collider blast door)', [[5, 8, 8, 12, 'o']]);
RING(4, 6); RING(5, 6);
plot(6, 6, 'K', 6, 5.25, ...SVC(4), [[0, 0, 3, 3, 'f']]);

/* ── P: LEVEL P3. The tunnel: rows 2..5 of every plot of row 5 (2 = the north walk, 3 = the track, 4 and 5 = the platform side). ── */
const TUN = [[0, 2, 12, 6, 'o'], [0, 3, 12, 4, 'j']];
plot(0, 5, 'P', 6, 10.5, 'The West Gantry', 'the tunnel\'s west end: a bridge over the ring (world polish thread 8: the ring is a level under it), a stair down; the wired door to Hangar 18\'s floor lift', 'Level P3: THE WEST GANTRY · the tunnel west (links.area51_dumb)', TUN.concat([[4, 0, 8, 12, 'r']]));
plot(1, 5, 'P', 5, 12.25, 'The Hangar, West', 'THE HANGAR (world polish thread 8): its floor three levels under the tram deck; the black craft, the workshop; stairs down from the platform, a pier out over the floor', 'Level P3: THE RAMP\'s foot (links.garage_motorpool, cut 11-20) · world polish thread 8: the Hangar', TUN.concat([[1, 6, 12, 12, 'f']]));
plot(2, 5, 'P', 5, 12.25, 'The Hangar, East', 'THE HANGAR: the saucer, the triangle, the parts on the bench; the pier\'s end is a ledge to the floor', 'Level P3: THE MOTOR POOL · THE BAYS · world polish thread 8: the Hangar', TUN.concat([[0, 6, 11, 12, 'f']]));
plot(3, 5, 'P', 8, 7, 'The Platform', 'LANDMARK: the lit tram on its rails at the platform; the wired door with a 7 on it; the base\'s battle marker', 'Level P3: THE HALL · THE PLATFORM · THE TRAM', TUN.concat([[5, 0, 8, 2, 'o'], [1, 6, 11, 9, 'f']]));
plot(4, 5, 'P', 8, 7, 'The Booth', 'the guard booth on the middle passage', 'Level P3: THE BOOTH', TUN.concat([[3, 6, 9, 10, 'f']]));
plot(5, 5, 'P', 6, 10.5, 'The Motor Pool', 'the motor pool on its lower deck, a level under the tram, down the car ramp; the freight lift\'s landing: Room 555\'s way in from the bay', 'Level P3: the freight lift\'s landing (the bay door) · world polish thread 8: the cars moved here', TUN.concat([[1, 6, 11, 12, 'f']]));
plot(6, 5, 'P', 6, 10.5, 'The East Gantry', 'the tunnel\'s east end: a bridge over the ring, a stair down; on to the Sewers\' Gantry Tunnel', 'Level P3: THE EAST GANTRY · the tunnel east (the old link dumb_cern, now a walk)', [[0, 2, 8, 6, 'o'], [0, 3, 8, 4, 'j'], [4, 0, 8, 12, 'r']]);

/* ── S: SUB-LEVEL 7 (level 0). ── */
plot(3, 4, 'S', 0, 5.25, 'The Stair', 'the stair down from Level P3: six floors of it, 14 m; two dead-end side rooms', 'Sub-Level 7: room B (the stair up to the motor pool) · side rooms', [[3, 0, 9, 12, 'f'], [1, 2, 3, 6, 'f'], [9, 2, 11, 6, 'f']]);
plot(3, 3, 'S', 0, 12.25, 'The Hub', 'LANDMARK: THE TOWER, which has no stair; every department is off this hub', 'Sub-Level 7: THE HUB · THE TOWER', [[1, 1, 11, 11, 'f'], [5, 0, 8, 1, 'o'], [5, 11, 8, 12, 'o'], [0, 5, 1, 8, 'o'], [11, 5, 12, 8, 'o']]);
plot(2, 3, 'S', 0, 7, 'Chambers 01 + 03', 'the west spoke: 01 THE DROP (a tier up a stair, and the edge) north of it, 03 THE PIT south of it; the stair up to Research', 'Sub-Level 7: 01 THE DROP · 03 THE PIT · the west spoke', [[0, 5, 12, 8, 'o'], [1, 1, 11, 5, 'f'], [1, 8, 11, 11, 'f']]);
plot(4, 3, 'S', 0, 7, 'Chambers 02 + 04', 'the east spoke: 02 THE CATWALK (two towers and the plank) north of it, 04 OBSERVATION (the deck behind round windows) south of it; the Vault Gantry\'s stair', 'Sub-Level 7: 02 THE CATWALK · 04 OBSERVATION · the east spoke', [[0, 5, 12, 8, 'o'], [1, 1, 11, 5, 'f'], [1, 8, 11, 11, 'f']]);
plot(3, 2, 'S', 0, 5.25, 'Corridor Five', 'five was always the corridor: the north spoke, the Healing Zone, stairs up to the Range and the Comms Room', 'Sub-Level 7: the north spoke ("Five is the corridor") · the Healing Zone', [[3, 0, 9, 12, 'f'], [0, 5, 3, 8, 'o'], [9, 5, 12, 8, 'o']]);
plot(3, 1, 'S', 0, 5.25, 'Level −6', 'rock cut square and a blast door in it: the way to the Cavern; the Vent\'s ladder up to the ring', 'Sub-Level 7: room A (the blast door, links.cave_dumb) · THE VENT', [[2, 2, 10, 10, 'f'], [5, 10, 8, 12, 'o'], [5, 0, 8, 2, 'o']]);

/* ── R: RESEARCH (level 2). The White Rooms are one 16 x 12 block on the two north plots (squares 14..29 by 12..23). ── */
plot(1, 1, 'R', 2, 7, 'The White Rooms, West', 'the Cell Row, the Quiet Room, Intake; the observation floor over the halls', 'Area 51: THE WHITE ROOMS (site_prebuilt_area51_ward), moved in on mondo\'s word 11-16', []);
plot(2, 1, 'R', 2, 7, 'The White Rooms, East', 'Records, Treatment, the Nurses\' Station, Showers, the Doctor, the Dayroom', 'Area 51: THE WHITE ROOMS', []);
set(14, 12, 30, 24, 'f');
plot(1, 2, 'R', 2, 7, 'The Ward', 'Dream Research, the Dream Wing (a floor at 5.25 m): the sleep lab, Traces, the Doctor, THE TANKS sunk a level; the dream screen you can walk into', 'Dream Research: THE WARD · the dream screen (links.dumb_astral)', []);
plot(2, 2, 'R', 2, 8.75, 'The Range', 'Dream Research, the Dream Wing: the psychic training hall with THE OBJECT, its gallery a level up; the two card rooms, Prep, the Store', 'Dream Research: THE RANGE · THE BOOTH', []);
plot(1, 3, 'R', 2, 5.25, 'The Labs', 'the bio lab, Specimens, the autopsy theatre behind its window, the cold store; the gurney ramp up to the Dream Wing', 'D.U.M.B.: THE SERVICE CORRIDOR (two draughts today) · world polish thread 8: the Labs', []);
plot(1, 4, 'R', 0, 8.75, 'The Vat Hall', 'Clone Research: the vats on the floor of Sub-Level 7\'s depth, walked on THE GANTRY 3.5 m over them', 'Clone Research: THE VAT HALL · THE GANTRY', []);
plot(2, 4, 'R', 0, 8.75, 'Disposal', 'Clone Research: the furnace, the chute, BATCH 12, THE OTHER ONE; the Control room up its stair; a back door to the Stair', 'Clone Research: DISPOSAL · BATCH 12', []);
/* RESEARCH ON THE SQUARES (world polish thread 8, 2026-11-20, mondo's OK on the plan: docs/plans/world-polish/thread8/plan-research.png).
   Every square by hand (global squares, the end inclusive); the levels inside the plots are the district file's (R.js build). */
[[21, 24, 21, 25], [19, 26, 24, 27], [13, 26, 18, 33], [19, 28, 20, 33], [22, 28, 23, 28], [21, 29, 24, 32], [25, 26, 32, 33], [33, 26, 34, 33], [35, 29, 35, 31],
 [17, 34, 24, 35], [25, 34, 28, 35], [29, 34, 31, 35],
 [20, 36, 22, 40], [16, 36, 19, 40], [13, 36, 15, 40], [16, 41, 23, 43], [16, 44, 18, 47], [19, 44, 23, 47], [13, 44, 15, 47],
 [13, 48, 15, 49], [13, 50, 22, 58], [23, 55, 24, 56], [25, 49, 34, 58], [35, 51, 36, 51]].forEach(q => set(q[0], q[1], q[2] + 1, q[3] + 1, 'f'));

/* ── C: COMMAND (level 2). ── */
plot(5, 3, 'C', 2, 5.25, 'The Vault Gantry', 'the head of the stair from the hub: a cross of bridges over THE VAULT, a shaft 7 m down (world polish thread 8); the round vault door north, the hotel door south; the private stair behind the wall', 'Sub-Level 7: THE VAULT GANTRY (room E) · room F · War Room / Bunker: THE PRIVATE STAIR', [[1, 2, 9, 10, 'f'], [0, 5, 1, 8, 'o'], [5, 0, 8, 2, 'o'], [5, 10, 8, 12, 'o'], [10, 0, 11, 12, 'o'], [9, 5, 10, 8, 'f']]);
plot(5, 2, 'C', 2, 11, 'The Round Table', 'the War Room (one hall with the Big Board): the floor with the round table, the galleries on three sides; you walk in under the south one', 'War Room: THE ROUND TABLE · the south gallery', [[1, 0, 11, 11, 'f'], [5, 11, 8, 12, 'o'], [0, 5, 1, 8, 'o'], [10, 11, 11, 12, 'o']]);
plot(5, 1, 'C', 2, 11, 'The Big Board', 'LANDMARK: THE BIG BOARD on the north wall over its walk. It has always said DEFCON', 'War Room: THE BIG BOARD · the north gallery', [[1, 3, 11, 12, 'f'], [0, 5, 1, 8, 'o']]);
plot(4, 1, 'C', 6, 4, 'The Projection Booth', 'it projects the board, onto the board: 10.5 m up, its balcony over the War Room (a ledge down to the west gallery)', 'War Room: THE PROJECTION BOOTH', [[2, 3, 11, 10, 'f'], [11, 5, 12, 8, 'o'], [5, 10, 8, 12, 'o']]);
plot(4, 2, 'C', 2, 5.25, 'The Comms Room', 'two phones, four lines, one of them answers; the stair down to Corridor Five (label mine)', 'War Room: the phones, the monitors (a new plot)', [[1, 1, 11, 11, 'f'], [5, 0, 8, 1, 'o'], [11, 5, 12, 8, 'o'], [0, 5, 1, 8, 'o']]);
plot(5, 4, 'C', 1, 8, 'The Great Room', 'the Bunker: the great room with its false windows, the loft, the panic room, the private lift', 'Bunker: THE GREAT ROOM · the loft · THE PRIVATE LIFT', [[1, 1, 11, 10, 'f'], [5, 0, 8, 1, 'o'], [10, 0, 11, 1, 'o'], [0, 5, 1, 8, 'o']]);
plot(4, 4, 'C', 1, 5.25, 'The Pool', 'the Bunker: a heated pool eighty metres under; the cellar with THE SAFE', 'Bunker: THE POOL · THE CELLAR', [[1, 1, 11, 10, 'f'], [3, 4, 8, 8, 'w'], [11, 5, 12, 8, 'o']]);

/* THE RING'S ALCOVES (world polish thread 8, 2026-11-20): one off each plain plot, inner side or across the pipe (a steel crossover) */
[[15, 0, 20, 3], [27, 8, 32, 10], [51, 8, 56, 10], [63, 0, 68, 3], [0, 15, 3, 20], [8, 27, 10, 32], [8, 51, 10, 56], [73, 15, 75, 20], [80, 27, 83, 32], [80, 51, 83, 56],
 [15, 73, 20, 75], [27, 80, 32, 83], [51, 80, 56, 83], [63, 73, 68, 75]].forEach(q => set(q[0], q[1], q[2] + 1, q[3] + 1, 'f'));
/* the tunnel's west end runs on to the room's west wall (the Hangar 18 door stands there) */
set(0, 5 * N + 2, 4, 5 * N + 6, 'o'); set(0, 5 * N + 3, 4, 5 * N + 4, 'j');

/* ── the openings: where two plots of different levels meet (the port = the three middle squares on that side) ── */
const OPENINGS = [
    { a: 'P03-05', b: 'P03-04', kind: 'stair', wide: 3, name: 'the stair down: six floors' },
    { a: 'P02-03', b: 'P01-03', kind: 'stair', wide: 3, name: 'the stair up to Research' },
    { a: 'P04-03', b: 'P05-03', kind: 'stair', wide: 3, name: 'the Vault Gantry\'s stair' },
    { a: 'P03-02', b: 'P02-02', kind: 'stair', wide: 1, name: 'the stair up to the Range' },
    { a: 'P03-02', b: 'P04-02', kind: 'stair', wide: 1, name: 'the stair up to the Comms Room' },
    { a: 'P03-00', b: 'P03-01', kind: 'climb', name: 'the Vent: a ladder shaft' },
    { a: 'P04-02', b: 'P04-01', kind: 'stair', wide: 3, name: 'the stair up to the Projection Booth (world polish thread 8)' },
];
/* ── the ways out (all in the game before the rebuild). sq = the square the way stands on; wall = the room's wall it is reached through, or 'free' + face ── */
const WAYS = [
    { id: 'bay', kind: 'entry', site: 'prebuilt_dumb', plot: 'P05-05', to: 'DOOR HQ · Bay 1 (Room 555)', what: 'the freight lift' },
    { id: 'bay_cern', kind: 'entry', site: 'prebuilt_cern', plot: 'P03-06', to: 'DOOR HQ · Bay 1 (Room 999)', what: 'the collider blast door' },
    { id: 'area51_dumb', kind: 'link', plot: 'P00-05', to: 'The Desert · Hangar 18 (the floor lift)', what: 'the tunnel west' },
    { id: 'cave_dumb', kind: 'link', plot: 'P03-01', to: 'The Cavern · Level −6', what: 'the blast door' },
    { id: 'dumb_astral', kind: 'link', plot: 'P01-02', to: 'The Astral Realm · the Library', what: 'the dream screen' },
    { id: 'yard', kind: 'door', plot: 'P01-01', to: 'The Desert · Area 51 (the yard gate)', what: 'the White Rooms\' gate' },
    { id: 'stormdrain', kind: 'door', plot: 'P02-01', to: 'The Desert · Area 51 (the storm drain, secret)', what: 'the grate' },
    { id: 'hangar', kind: 'door', plot: 'P02-01', to: 'The Desert · Hangar 18 (the white door)', what: 'the hospital door' },
    { id: 'vent', kind: 'door', plot: 'P02-01', to: 'The Desert · Hangar 18 (the duct, secret)', what: 'the vent' },
];

const out = { area: 'The D.U.M.B.', version: 'plan-2', approved: 'mondo 11-16: redesign without waiting for an OK (ZONE_THREAD_BRIEF.md)', squareMeters: 3.5, plotCells: N, cols: G, rows: G, levelMeters: 1.75,
    districts: Object.keys(DIST).reduce((o, k) => { o[k] = DIST[k].name; return o; }, {}),
    legend: { x: 'rock (the wall)', o: 'corridor', f: 'room floor', r: 'the ring\'s tunnel', j: 'the tram track', w: 'pool water' },
    plots: PLOTS.sort((a, b) => a.id.slice(4) + a.id.slice(1, 3) < b.id.slice(4) + b.id.slice(1, 3) ? -1 : 1), openings: OPENINGS, ways: WAYS, cells: cell.map(r => r.join('')) };
if (PLOTS.length !== G * G) throw new Error('plots: ' + PLOTS.length);
const txt = '{\n' + Object.keys(out).map(k => k === 'plots' || k === 'cells' || k === 'openings' || k === 'ways' ? JSON.stringify(k) + ': [\n' + out[k].map(v => JSON.stringify(v)).join(',\n') + '\n]' : JSON.stringify(k) + ': ' + JSON.stringify(out[k])).join(',\n') + '\n}\n';
fs.writeFileSync(path.join(__dirname, 'dumb-layout-2.json'), txt);
fs.mkdirSync(path.join(__dirname, '../../areas/dumb/districts'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../../areas/dumb/layout.json'), txt);

/* ── the picture ── */
const Q = 14, M = 60, SZ = W * Q, esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const FILL = { o: 0.55, f: 0.85, r: 0.7, j: 0.3, w: 1 };
const S = [];
S.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${SZ + 2 * M + 330}" height="${SZ + 2 * M + 40}" font-family="Arial, Helvetica, sans-serif">`);
S.push(`<rect width="100%" height="100%" fill="#0d0f12"/>`);
S.push(`<text x="${M}" y="34" fill="#e8eaee" font-size="24" font-weight="bold">THE D.U.M.B. · PLOT PLAN 2 · 7 x 7 plots (294 x 294 m), all underground</text>`);
S.push(`<g transform="translate(${M},${M})"><rect width="${SZ}" height="${SZ}" fill="#1b1d21"/>`);
const dOf = (x, y) => PLOTS.find(p => +p.id.slice(1, 3) === Math.floor(x / N) && +p.id.slice(4, 6) === Math.floor(y / N));
for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x]; if (ch === 'x') continue; const p = dOf(x, y), col = ch === 'w' ? '#49b6d9' : ch === 'j' ? '#22252a' : ch === 'r' ? DIST.K.col : DIST[p.d].col;
    S.push(`<rect x="${x * Q}" y="${y * Q}" width="${Q}" height="${Q}" fill="${col}" fill-opacity="${FILL[ch]}"/>`); }
for (let i = 0; i <= G; i++) { S.push(`<line x1="${i * N * Q}" y1="0" x2="${i * N * Q}" y2="${SZ}" stroke="#555a63" stroke-width="1" stroke-dasharray="4 4"/>`); S.push(`<line y1="${i * N * Q}" x1="0" y2="${i * N * Q}" x2="${SZ}" stroke="#555a63" stroke-width="1" stroke-dasharray="4 4"/>`); }
PLOTS.forEach(p => { const x = +p.id.slice(1, 3), y = +p.id.slice(4, 6), cx = (x + 0.5) * N * Q, ty = y * N * Q + 13; const words = p.name.split(' '), lines = []; let cur = '';
    words.forEach(w => { if ((cur + ' ' + w).length > 16 && cur) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }); lines.push(cur);
    lines.forEach((l, i) => S.push(`<text x="${cx}" y="${ty + i * 13}" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle" stroke="#0d0f12" stroke-width="3" paint-order="stroke">${esc(l)}</text>`));
    S.push(`<text x="${x * N * Q + 4}" y="${(y + 1) * N * Q - 5}" fill="#ffe08a" font-size="10" stroke="#0d0f12" stroke-width="2.5" paint-order="stroke">${p.id} · ${(p.level * 1.75).toFixed(p.level % 4 ? 2 : 0)} m</text>`); });
OPENINGS.forEach(o => { const a = PLOTS.find(p => p.id === o.a), b = PLOTS.find(p => p.id === o.b), ax = +a.id.slice(1, 3), ay = +a.id.slice(4, 6), bx = +b.id.slice(1, 3), by = +b.id.slice(4, 6), x = ((ax + bx) / 2 + 0.5) * N * Q, y = ((ay + by) / 2 + 0.5) * N * Q;
    S.push(`<circle cx="${x}" cy="${y}" r="9" fill="${o.kind === 'climb' ? '#ff7ad9' : '#7dff9a'}" stroke="#0d0f12" stroke-width="2"/><text x="${x}" y="${y + 4}" font-size="11" font-weight="bold" text-anchor="middle" fill="#0d0f12">${o.kind === 'climb' ? 'L' : 'S'}</text>`); });
S.push(`</g>`);
let ly = M + 10; const lx = SZ + M + 24, T = (t, c, b) => { S.push(`<text x="${lx}" y="${ly}" fill="${c || '#e8eaee'}" font-size="${b ? 15 : 12.5}" ${b ? 'font-weight="bold"' : ''}>${esc(t)}</text>`); ly += b ? 22 : 17; };
T('DISTRICTS', null, true); Object.keys(DIST).forEach(k => { S.push(`<rect x="${lx}" y="${ly - 11}" width="14" height="14" fill="${DIST[k].col}"/>`); S.push(`<text x="${lx + 20}" y="${ly}" fill="#e8eaee" font-size="12.5">${k} · ${esc(DIST[k].name)} (${PLOTS.filter(p => p.d === k).length} plots)</text>`); ly += 18; });
ly += 8; T('LEVELS', null, true); T('14 m   the Ring + Level P3 (the entry level)'); T('3.5 m  Research + Command'); T('0 m    Sub-Level 7 (the hub)');
ly += 8; T('SIGNS', null, true); T('S  a stair between two levels', '#7dff9a'); T('L  the Vent: a 14 m ladder shaft', '#ff7ad9'); T('dark squares = the tram track'); T('blue squares in Command = the pool');
ly += 8; T('WAYS OUT (all were in the game)', null, true); WAYS.forEach(w => { T(w.plot + '  ' + w.what, '#ffe08a'); T('    to ' + w.to, '#aab0ba'); });
S.push('</svg>');
const svg = path.join(__dirname, 'dumb_plot_plan_2.svg'), png = path.join(__dirname, 'dumb_plot_plan_2.png'); fs.writeFileSync(svg, S.join('\n'));
(async () => { try { const { chromium } = require('playwright'); const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: SZ + 2 * M + 330, height: SZ + 2 * M + 40 } }); await pg.goto('file://' + svg); await pg.screenshot({ path: png }); await b.close(); fs.unlinkSync(svg); console.log('wrote', png); } catch (e) { console.log('no playwright: the .svg stays (' + e.message.split('\n')[0] + ')'); } })();
