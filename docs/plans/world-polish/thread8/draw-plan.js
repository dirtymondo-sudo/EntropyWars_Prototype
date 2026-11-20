/* WORLD POLISH thread 8, THE D.U.M.B.: THE PLAN ON THE SQUARES (2026-11-20). A PLAN ON PAPER: nothing here is read by the game.
   `node docs/plans/world-polish/thread8/draw-plan.js` writes plan-zone.png (the whole room, 84 x 84 squares, every square its level)
   and plan-research.png (district R square by square: rooms, walls' doors, windows, ramps, stairs, decks, ledges), and checks itself.
   One level = 1.75 m. Level 0 = Sub-Level 7's floor. A square is 3.5 m. Research (R) is designed in full; K, P and C are BLOCK plans
   (the right levels, halls and ways on whole squares; each is drawn like R before it is built). S is read from the layout as it stands. */
'use strict';
const fs = require('fs'), path = require('path');
const LAY = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../areas/dumb/layout.json'), 'utf8'));
const N = 12, G = 7, W = N * G;
const g = []; for (let y = 0; y < W; y++) g.push(new Array(W).fill(null));
const put = (x0, y0, x1, y1, l, t, extra) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (x < 0 || y < 0 || x >= W || y >= W) throw new Error('off the map ' + x + ',' + y); g[y][x] = Object.assign({ l, t: t || 'f' }, extra || {}); } };
const rock = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = null; };
const LABELS = [], LEDGES = [], DOORS = [], WINDOWS = [], ROOMS = [], WAYS = [], RUNS = [];
const label = (x, y, s, o) => LABELS.push(Object.assign({ x, y, s }, o || {}));
/* a stair / ramp: squares from the low end to the high end; dir = the way UP (n e s w) */
const stair = (x0, y0, x1, y1, lo, hi, dir, t) => { const cells = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cells.push([x, y]);
    const len = (dir === 'n' || dir === 's') ? y1 - y0 + 1 : x1 - x0 + 1;
    cells.forEach(c => { const i = dir === 'n' ? y1 - c[1] : dir === 's' ? c[1] - y0 : dir === 'e' ? c[0] - x0 : x1 - c[0]; g[c[1]][c[0]] = { l: lo + (hi - lo) * (i + 0.5) / len, t: t || 'st', dir, lo, hi }; }); };
const ramp = (x0, y0, x1, y1, lo, hi, dir) => stair(x0, y0, x1, y1, lo, hi, dir, 'rp');
/* a deck / bridge: a second floor over the square (the floor under it stays what it is) */
const deck = (x0, y0, x1, y1, l) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!g[y][x]) g[y][x] = { l, t: 'br' }; else g[y][x].deck = l; } };
/* a way's run: checked to be 8 squares or less in a straight line */
const run = (name, x0, y0, x1, y1) => RUNS.push({ name, len: Math.max(x1 - x0, y1 - y0) + 1, x0, y0, x1, y1 });

/* ───────────── S · SUB-LEVEL 7: as it stands (level 0), read from the layout ───────────── */
const PL = {}; LAY.plots.forEach(p => { PL[p.id] = p; });
const dOf = (x, y) => PL['P0' + Math.floor(x / N) + '-0' + Math.floor(y / N)].d;
for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (dOf(x, y) === 'S' && LAY.cells[y][x] !== 'x') g[y][x] = { l: 0, t: 'f' };
stair(41, 54, 43, 59, 0, 8, 's'); label(42, 51.5, 'THE STAIR\n14 m: rebuilt later as\nflights + landings + ledges', { s2: 1 });
stair(24, 41, 25, 43, 0, 2, 'w'); stair(58, 41, 59, 43, 0, 2, 'e'); stair(36, 30, 37, 30, 0, 2, 'w'); stair(46, 30, 47, 30, 0, 2, 'e');
label(42, 42, 'THE HUB\nthe Tower'); label(42, 30, 'CORRIDOR\nFIVE'); label(42, 18, 'LEVEL −6'); label(30, 38.5, '01 THE DROP'); label(30, 45.5, '03 THE PIT'); label(54, 38.5, '02 CATWALK'); label(54, 45.5, '04 OBSERV.');

/* ───────────── R · RESEARCH, square by square (box = global − 12) ───────────── */
const B = 12, R = (name, x0, y0, x1, y1, l, o) => { put(x0 + B, y0 + B, x1 + B, y1 + B, l); ROOMS.push(Object.assign({ name, x0: x0 + B, y0: y0 + B, x1: x1 + B, y1: y1 + B, l }, o || {})); };
const door = (x, y, side, o) => DOORS.push(Object.assign({ x: x + B, y: y + B, side }, o || {}));     // side: the square's edge the door is in (n e s w)
const win = (x0, y0, x1, y1, side) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) WINDOWS.push({ x: x + B, y: y + B, side }); };
const ledge = (x, y, side) => LEDGES.push({ x: x + B, y: y + B, side });
R('THE WHITE ROOMS\n(as built: two floors,\nfour doors to the Desert)', 2, 0, 17, 11, 2, { kept: 1 });
ramp(9 + B, 12 + B, 9 + B, 13 + B, 2, 3, 's');                                   // the hospital door's corridor: a ramp up to the Dream Wing
/* the Dream Wing (psychic research), level 3 */
R('LOBBY', 7, 14, 12, 15, 3, { way: 1 });
R('THE WARD\nsleep lab: beds,\nEEG racks', 1, 14, 6, 21, 3);
R('TRACES', 7, 16, 8, 18, 3); R('DOCTOR', 7, 19, 8, 21, 3);
R('THE TANKS\nsunk wet room', 9, 17, 12, 20, 2); stair(10 + B, 16 + B, 11 + B, 16 + B, 2, 3, 'n');
R('THE RANGE\npsychic training hall\n8 x 8: a fight fits\nTHE OBJECT on its table', 13, 14, 20, 21, 3);
deck(13 + B, 14 + B, 20 + B, 14 + B, 5); deck(13 + B, 15 + B, 13 + B, 18 + B, 5); deck(20 + B, 15 + B, 20 + B, 18 + B, 5);
stair(13 + B, 19 + B, 13 + B, 20 + B, 3, 5, 'n'); stair(20 + B, 19 + B, 20 + B, 20 + B, 3, 5, 'n');
R('CARDS A\nsender', 21, 14, 22, 15, 3); R('CARDS B\nreceiver', 21, 20, 22, 21, 3); R('BACK\nLOBBY', 21, 16, 22, 19, 3, { way: 1 });
ramp(22 + B, 18 + B, 23 + B, 18 + B, 2, 3, 'w');                                 // down to the port: the 1-wide stair to Corridor Five (as built)
R('SOUTH CORRIDOR', 5, 22, 12, 23, 3, { way: 1 }); R('PREP', 13, 22, 16, 23, 3); R('STORE', 17, 22, 19, 23, 3);
/* the Labs (mad science), level 2 */
ramp(8 + B, 24 + B, 10 + B, 25 + B, 2, 3, 'n');                                  // the gurney ramp up to the Dream Wing, 3 wide
R('', 8, 26, 10, 28, 2, { way: 1 });
R('ENTRY', 8, 29, 11, 31, 2, { way: 1 }); R('THE CROSSING', 4, 29, 7, 31, 2, { way: 1 });
R('BIO LAB\nhoods, glass,\nmicroscopes', 4, 24, 7, 28, 2); R('SPECIMENS\n+ animal\nroom', 1, 24, 3, 28, 2);
R('', 4, 32, 6, 35, 2, { way: 1 });
R('AUTOPSY THEATRE\nseen from the\nentry\'s window', 7, 32, 11, 35, 2); R('COLD\nSTORE', 1, 32, 3, 34, 2);
put(0 + B, 30 + B, 3 + B, 30 + B, 2); put(12, 43, 12, 43, 2); stair(7, 43, 11, 43, 2, 6, 'w');   // the thin way west: a service stair up to the Beam Dump (the Ring)
/* the Vat Hall + Disposal: floors at level 0, you arrive on the GANTRY at level 2 */
R('', 1, 35, 3, 37, 2, { way: 1 });
R('THE VAT HALL\nfloor 0: rows of vats\n10 x 9: a fight fits', 1, 38, 10, 46, 0);
deck(2 + B, 38 + B, 3 + B, 42 + B, 2); deck(2 + B, 41 + B, 9 + B, 42 + B, 2); deck(8 + B, 43 + B, 10 + B, 44 + B, 2);
put(11 + B, 43 + B, 12 + B, 44 + B, 0); deck(11 + B, 43 + B, 12 + B, 44 + B, 2);                       // the gantry goes through the wall, the floor way under it
R('DISPOSAL\nfloor 0: the furnace,\nthe conveyor, the chute', 13, 37, 22, 46, 0);
deck(13 + B, 43 + B, 14 + B, 44 + B, 2);
R('CONTROL', 15, 42, 18, 45, 2);
stair(2 + B, 43 + B, 2 + B, 44 + B, 0, 2, 'n');                                  // the gantry's stair down to the vats (it replaces the floor square)
stair(19 + B, 43 + B, 20 + B, 43 + B, 0, 2, 'w');                                // Control's stair down to the plant floor
put(23 + B, 39 + B, 24 + B, 39 + B, 0);                                          // the back door: through to the Stair's store room (Sub-Level 7), thin + mundane
/* doors (the square, the edge) */
door(9, 14, 'n'); door(6, 15, 'e', { dbl: 1 }); door(7, 16, 'n'); door(12, 14, 'e', { dbl: 1 }); door(12, 15, 'e', { dbl: 1 }); door(20, 18, 'e'); door(21, 15, 's'); door(21, 20, 'n');
door(5, 22, 'n'); door(8, 21, 's'); door(12, 22, 'e'); door(15, 22, 'n'); door(16, 22, 'e');
door(7, 27, 'e'); door(3, 26, 'e'); door(6, 33, 'e'); door(3, 33, 'e'); door(11, 30, 'e', { dbl: 1 }); door(0, 30, 'w');
door(10, 40, 'e'); door(22, 39, 'e'); door(15, 43, 'w'); door(18, 43, 'e');
win(7, 16, 7, 18, 'w'); win(8, 32, 11, 32, 'n'); win(15, 14, 18, 14, 's'); win(15, 42, 18, 42, 'n'); win(7, 25, 7, 26, 'e'); win(21, 14, 21, 15, 'w');
/* ledges: a rail gap on a deck, you drop and cannot climb back */
ledge(13, 18, 'e'); ledge(20, 18, 'w'); ledge(6, 42, 's'); ledge(7, 42, 's'); ledge(13, 44, 's');
/* the ways' straight runs in R */
run('hospital corridor', 21, 24, 21, 25); run('lobby', 19, 26, 24, 27); run('south corridor', 17, 34, 24, 35); run('gurney ramp + north leg', 20, 36, 22, 43);
run('entry + crossing', 16, 41, 23, 43); run('south leg', 16, 41, 18, 47); run('landing', 13, 47, 18, 49); run('gantry A', 14, 47, 15, 54); run('gantry B', 14, 53, 21, 54); run('gantry C', 20, 55, 26, 56); run('thin way west', 12, 42, 15, 42); run('service stair', 7, 43, 12, 43);

/* ───────────── K · CERN, THE RING: a square ring 3 squares wide at level 6 (BLOCK PLAN) ───────────── */
const RL = 6, plain = { '1,0': 1, '2,0': 1, '4,0': 1, '5,0': 1, '0,1': 1, '0,2': 1, '0,4': 1, '6,1': 1, '6,2': 1, '6,4': 1, '1,6': 1, '2,6': 1, '4,6': 1, '5,6': 1 };
const band = (horiz, at, a0, a1, inner) => { for (let a = a0; a <= a1; a++) { const px = horiz ? Math.floor(a / N) : Math.floor(at / N), py = horiz ? Math.floor(at / N) : Math.floor(a / N), t = a % N, pl = plain[px + ',' + py];
    const cross = pl && (t === 2 || t === 8), onIn = !pl || t < 2 || t > 8, sq = o => horiz ? [a, at + o] : [at + o, a];
    const pi = sq(0), ii = sq(inner), oo = sq(-inner);
    g[pi[1]][pi[0]] = cross ? { l: RL, t: 'pipe', deck: RL + 1 } : { l: RL, t: 'pipe' };
    if (!pl) { g[ii[1]][ii[0]] = { l: RL, t: 'f' }; g[oo[1]][oo[0]] = { l: RL, t: 'f' }; continue; }
    if (cross) { g[ii[1]][ii[0]] = { l: RL + 0.5, t: 'st', dir: horiz ? (inner > 0 ? 'n' : 's') : (inner > 0 ? 'w' : 'e'), lo: RL, hi: RL + 1 }; g[oo[1]][oo[0]] = { l: RL + 0.5, t: 'st', dir: horiz ? (inner > 0 ? 's' : 'n') : (inner > 0 ? 'e' : 'w'), lo: RL, hi: RL + 1 }; continue; }
    const w = onIn ? ii : oo; g[w[1]][w[0]] = { l: RL, t: 'f' }; } };
band(true, 5, 8, 75, 1); band(true, 78, 8, 75, -1); band(false, 5, 8, 75, 1); band(false, 78, 8, 75, -1);
[[2, 2], [76, 2], [2, 76], [76, 76]].forEach((c, i) => { put(c[0], c[1], c[0] + 5, c[1] + 5, RL); label(c[0] + 3, c[1] + 3, ['COOLING\nPLANT', 'POWER\nHALL', 'PUMP\nROOM', 'THE OLD\nEXPERIMENT'][i]); });
put(38, 1, 45, 3, 7); label(42, 2.5, 'THE CONTROL ROOM (a step up, a window on the ring)'); put(41, 7, 43, 11, RL); put(44, 8, 46, 9, RL); label(45.5, 10.6, 'the Vent:\nladder down', { s2: 1 });
put(41, 80, 43, 83, RL); label(42, 82, 'THE BLAST DOOR'); WAYS.push({ x: 42, y: 83.6, s: 'DOOR HQ, Room 999' });
put(1, 38, 3, 45, 5); label(2.5, 41, 'THE\nBEAM\nDUMP\nsunk'); put(6, 43, 6, 43, RL);
/* the Detector Hall: the ring crosses a pit on two catwalks; the detector stands in the pit */
put(73, 37, 82, 38, RL); put(73, 45, 82, 46, RL); put(73, 39, 82, 44, 3); for (let y = 39; y <= 44; y++) { g[y][77] = { l: 3, t: 'f', deck: RL }; g[y][79] = { l: 3, t: 'f', deck: RL }; g[y][78] = { l: 3, t: 'pipe' }; }
stair(74, 44, 76, 44, 3, RL, 'w'); label(78, 41.5, 'THE DETECTOR HALL\npit at level 3, the detector in it'); ramp(71, 41, 72, 41, 2, 3, 'e');

/* ───────────── P · LEVEL P3: the tram deck at level 8, the lower deck under it (BLOCK PLAN) ───────────── */
put(0, 63, 83, 63, 8, 'trk');                                                   // the track: straight and level ON PURPOSE (a tram line)
put(0, 62, 11, 65, 8); g[63].fill(null, 0, 0); put(0, 63, 83, 63, 8, 'trk');
[[4, 6], [77, 79]].forEach(b => { for (let y = 62; y <= 65; y++) for (let x = b[0]; x <= b[1]; x++) g[y][x] = { l: RL, t: y === 63 ? 'f' : 'f', deck: 8, pipe: x === b[0] + 1 }; });   // the Gantries: the tunnel bridges the ring
stair(7, 60, 7, 61, RL, 8, 's'); put(7, 59, 7, 59, RL); stair(76, 60, 76, 61, RL, 8, 's'); put(76, 59, 76, 59, RL);
put(72, 62, 83, 65, 8); put(72, 63, 83, 63, 8, 'trk'); [[77, 79]].forEach(b => { for (let y = 62; y <= 65; y++) for (let x = b[0]; x <= b[1]; x++) g[y][x] = { l: RL, t: 'f', deck: 8 }; });
label(5.5, 61, 'WEST\nGANTRY', { s2: 1 }); label(78, 61, 'EAST\nGANTRY', { s2: 1 }); WAYS.push({ x: -0.4, y: 64.5, s: 'Hangar 18\'s lift' }); WAYS.push({ x: 84.2, y: 64.5, s: 'the underground walk' });
/* THE HANGAR (skunkworks): floor at level 5, the gallery at level 8 snakes over it */
put(13, 66, 34, 74, 5); put(12, 64, 19, 65, 8); deck(18, 66, 19, 68, 8); deck(18, 67, 25, 68, 8); deck(24, 66, 25, 66, 8); put(24, 64, 35, 65, 8);
stair(13, 66, 13, 68, 5, 8, 'n'); ramp(9, 72, 12, 73, 5, RL, 'w'); put(8, 72, 8, 73, RL);
label(24, 71.5, 'THE HANGAR  floor at level 5, 22 x 9 squares\nblack aircraft, the saucer, the workshop; the gallery snakes over it'); LEDGES.push({ x: 21, y: 68, side: 's' }, { x: 22, y: 68, side: 's' });
/* the Platform, the Checkpoint (a blast baffle), the Motor Pool on two decks, the Freight Lift */
put(36, 64, 47, 66, 8); put(41, 60, 43, 62, 8); label(42, 65.3, 'THE PLATFORM');
put(48, 64, 50, 65, 8); put(49, 66, 50, 68, 8); put(51, 67, 56, 69, 8); put(56, 64, 57, 66, 8); put(58, 64, 59, 65, 8); label(53.5, 68.3, 'CHECKPOINT');
put(60, 64, 71, 67, 8); put(60, 68, 71, 74, 6); ramp(62, 68, 63, 71, 6, 8, 'n'); ramp(68, 68, 69, 71, 6, 8, 'n'); label(66, 65.8, 'MOTOR POOL  upper deck'); label(66, 73, 'lower deck: the bays, the freight lift');
WAYS.push({ x: 66, y: 70.5, s: 'DOOR HQ, Room 555' }); WAYS.push({ x: 70.5, y: 73.5, s: 'HQ garage (secret)' });

/* ───────────── C · COMMAND (BLOCK PLAN): you come in at level 2, the War Room climbs to 6 ───────────── */
put(60, 41, 62, 43, 2); put(63, 38, 68, 45, -2); deck(63, 41, 68, 43, 2); put(69, 37, 70, 46, 2); put(63, 36, 68, 37, 2); put(63, 46, 68, 47, 2); put(60, 37, 62, 40, 2); put(60, 44, 62, 46, 2);
label(65.5, 39.2, 'THE VAULT GANTRY', { s2: 1 }); label(65.5, 44.6, 'a bridge over\nthe shaft (−2)', { s2: 1 }); LEDGES.push({ x: 65, y: 41, side: 'n' });
put(64, 31, 67, 35, 2);                                                         // the way in under the seats
put(62, 19, 69, 30, 2); put(61, 15, 70, 18, 3); label(65.5, 16.5, 'THE BIG BOARD (its walk at level 3)'); label(65.5, 24.5, 'THE WAR ROOM\nfloor at level 2\nTHE ROUND TABLE');
put(61, 19, 61, 34, 4); put(70, 19, 70, 34, 4); put(62, 31, 63, 34, 4); put(68, 31, 69, 34, 4); put(60, 19, 60, 34, 6); put(71, 19, 71, 34, 6);
stair(62, 30, 62, 30, 2, 4, 'w'); stair(69, 30, 69, 30, 2, 4, 'e'); stair(60, 35, 61, 35, 4, 6, 'w'); stair(70, 35, 71, 35, 4, 6, 'e'); label(60.5, 26, 'tiers\n4, 6', { s2: 1 });
put(48, 29, 59, 31, 2); put(50, 25, 57, 28, 2); put(50, 32, 57, 34, 2); label(53.5, 26.5, 'THE COMMS ROOM'); label(53.5, 33, 'crypto · radio', { s2: 1 }); g[30][60] = { l: 4, t: 'f' };
stair(53, 22, 55, 24, 2, 6, 'n'); put(50, 15, 59, 21, 6); label(54.5, 18, 'THE PROJECTION BOOTH\nlevel 6: it looks down on the board');
put(61, 49, 70, 58, 2); put(63, 51, 68, 55, 1); put(61, 49, 70, 50, 4); stair(70, 51, 70, 52, 2, 4, 'n'); put(65, 48, 67, 48, 2);
label(65.5, 53, 'THE GREAT ROOM\na sunk lounge (1)\nthe loft (4)');
put(49, 49, 58, 58, 1); put(52, 52, 56, 55, 1, 'w'); put(59, 53, 60, 54, 1); stair(59, 53, 60, 54, 1, 2, 'e'); put(49, 57, 51, 58, 0); stair(49, 55, 49, 56, 0, 1, 'n');
label(54, 50.5, 'THE POOL (1)'); label(50.5, 58.6, 'cellar 0', { s2: 1 });
put(36, 55, 36, 55, 0); put(47, 55, 48, 55, 0);                                  // the two mundane back doors off the Stair's side rooms

/* ───────────── THE CHECKS ───────────── */
const errs = [];
RUNS.forEach(r => { if (r.len > 8) errs.push('a straight run over 8 squares: ' + r.name + ' (' + r.len + ')'); });
/* Research: every open square is reached from the spoke stair's door; a step between two squares is level, or a stair / ramp square, or a deck with its stair */
{ const key = (x, y, d) => x + ',' + y + (d ? ',d' : ''), seen = new Set(), q = [[23, 42, false]]; seen.add(key(23, 42, false));
  const lv = (c, d) => d ? c.deck : c.l;
  while (q.length) { const [x, y, d] = q.shift(), c = g[y][x];
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(s => { const X = x + s[0], Y = y + s[1]; if (X < 0 || Y < 0 || X >= W || Y >= W) return; const n = g[Y][X]; if (!n) return;
      [false, true].forEach(D => { if (D && n.deck == null) return; if (seen.has(key(X, Y, D))) return;
        const a = c.t === 'st' || c.t === 'rp' ? null : lv(c, d), b = n.t === 'st' || n.t === 'rp' ? null : lv(n, D);
        const ok = (a != null && b != null) ? Math.abs(a - b) < 0.01 : (a == null && b == null) ? true : a == null ? (!D || true) && (Math.abs(b - c.lo) < 0.01 || Math.abs(b - c.hi) < 0.01) : (Math.abs(a - n.lo) < 0.01 || Math.abs(a - n.hi) < 0.01);
        if (ok) { seen.add(key(X, Y, D)); q.push([X, Y, D]); } }); }); }
  let miss = 0; for (let y = 12; y < 60; y++) for (let x = 12; x < 36; x++) { if (dOf(x, y) !== 'R' || !g[y][x]) continue; if (!seen.has(key(x, y, false))) { miss++; if (miss < 6) errs.push('Research: square ' + x + ',' + y + ' is not reached'); } if (g[y][x].deck != null && !seen.has(key(x, y, true))) errs.push('Research: the deck at ' + x + ',' + y + ' is not reached'); }
  console.log('Research: reached ' + [...seen].filter(k => { const p = k.split(','); return +p[0] >= 12 && +p[0] < 36 && +p[1] >= 12 && +p[1] < 60; }).length + ' squares + decks from the spoke stair'); }
const lvR = new Set(); for (let y = 12; y < 60; y++) for (let x = 12; x < 36; x++) if (dOf(x, y) === 'R' && g[y][x] && g[y][x].t === 'f') { lvR.add(g[y][x].l); if (g[y][x].deck != null) lvR.add(g[y][x].deck); }
console.log('Research levels: ' + [...lvR].sort((a, b) => a - b).join(', '));
if (errs.length) { console.log('PLAN ERRORS:\n  ' + errs.join('\n  ')); process.exitCode = 1; } else console.log('checks pass: runs of 8 or less (' + RUNS.length + '), Research all reached');

/* ───────────── THE PICTURES ───────────── */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const STOPS = [[-2, [38, 22, 70]], [0, [60, 52, 140]], [2, [40, 120, 170]], [3, [50, 160, 140]], [5, [120, 185, 90]], [6, [200, 190, 80]], [8, [240, 150, 70]]];
const col = l => { let a = STOPS[0], b = STOPS[STOPS.length - 1]; for (let i = 0; i < STOPS.length - 1; i++) if (l >= STOPS[i][0] && l <= STOPS[i + 1][0]) { a = STOPS[i]; b = STOPS[i + 1]; } const t = b[0] === a[0] ? 0 : Math.max(0, Math.min(1, (l - a[0]) / (b[0] - a[0]))); return 'rgb(' + a[1].map((v, i) => Math.round(v + (b[1][i] - v) * t)).join(',') + ')'; };
const DCOL = { K: '#5fa8e8', P: '#e8695f', S: '#b8bcc4', R: '#ffffff', C: '#e8c05f' };
const ARW = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
function draw(file, x0, y0, x1, y1, Q, title, sub, big) {
    const M = 46, TW = (x1 - x0 + 1) * Q, TH = (y1 - y0 + 1) * Q, LW = big ? 330 : 300, S = [], X = x => (x - x0) * Q, Y = y => (y - y0) * Q, fs0 = big ? 13 : 7.5;
    S.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${TW + 2 * M + LW}" height="${TH + 2 * M + 20}" font-family="Arial, Helvetica, sans-serif">`);
    S.push(`<rect width="100%" height="100%" fill="#0d0f12"/><text x="${M}" y="24" fill="#e8eaee" font-size="18" font-weight="bold">${esc(title)}</text><text x="${M}" y="40" fill="#aab0ba" font-size="11.5">${esc(sub)}</text>`);
    S.push(`<g transform="translate(${M},${M + 8})"><rect width="${TW}" height="${TH}" fill="#191b1f"/>`);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const c = g[y][x]; if (!c) continue; const px = X(x), py = Y(y);
        const fill = c.t === 'w' ? '#49b6d9' : c.t === 'trk' ? '#3a2a2a' : c.t === 'pipe' ? '#22364a' : col(c.l);
        S.push(`<rect x="${px}" y="${py}" width="${Q}" height="${Q}" fill="${fill}" stroke="#0d0f12" stroke-width="${big ? 1 : 0.5}"/>`);
        if (c.t === 'pipe') S.push(`<circle cx="${px + Q / 2}" cy="${py + Q / 2}" r="${Q * 0.2}" fill="#7fd0ff"/>`);
        if (c.t === 'trk') S.push(`<line x1="${px}" y1="${py + Q / 2}" x2="${px + Q}" y2="${py + Q / 2}" stroke="#c9a" stroke-width="${Q * 0.14}" stroke-dasharray="${Q * 0.2} ${Q * 0.13}"/>`);
        if (c.t === 'st' || c.t === 'rp') { const d = ARW[c.dir], horiz = d[0] !== 0; for (let i = 1; i <= (c.t === 'st' ? 3 : 0); i++) { const t = i / 4; S.push(horiz ? `<line x1="${px + Q * t}" y1="${py + 1}" x2="${px + Q * t}" y2="${py + Q - 1}" stroke="#0d0f12" stroke-width="${big ? 1.6 : 0.8}"/>` : `<line x1="${px + 1}" y1="${py + Q * t}" x2="${px + Q - 1}" y2="${py + Q * t}" stroke="#0d0f12" stroke-width="${big ? 1.6 : 0.8}"/>`); }
            const cx = px + Q / 2, cy = py + Q / 2, a = Q * 0.3; S.push(`<path d="M ${cx - d[0] * a} ${cy - d[1] * a} L ${cx + d[0] * a} ${cy + d[1] * a} M ${cx + d[0] * a} ${cy + d[1] * a} L ${cx + d[0] * a * 0.2 - d[1] * a * 0.6} ${cy + d[1] * a * 0.2 - d[0] * a * 0.6} M ${cx + d[0] * a} ${cy + d[1] * a} L ${cx + d[0] * a * 0.2 + d[1] * a * 0.6} ${cy + d[1] * a * 0.2 + d[0] * a * 0.6}" stroke="${c.t === 'rp' ? '#fff' : '#fff'}" stroke-width="${big ? 2.2 : 1.1}" fill="none"/>`); }
        else if (c.t === 'f' || c.t === 'br') S.push(`<text x="${px + (big ? 4 : Q / 2)}" y="${py + (big ? 12 : Q * 0.72)}" font-size="${big ? 10 : fs0}" ${big ? '' : 'text-anchor="middle"'} fill="${c.l >= 5 ? '#111' : '#e8eaee'}" fill-opacity="${big ? 0.8 : 0.75}">${c.l}</text>`);
        if (c.deck != null) { S.push(`<rect x="${px + Q * 0.14}" y="${py + Q * 0.14}" width="${Q * 0.72}" height="${Q * 0.72}" fill="${col(c.deck)}" stroke="#fff" stroke-width="${big ? 1.4 : 0.7}" stroke-dasharray="${big ? '4 2' : '2 1'}"/>`); S.push(`<text x="${px + Q / 2}" y="${py + Q * (big ? 0.62 : 0.7)}" font-size="${big ? 11 : fs0 - 0.5}" font-weight="bold" text-anchor="middle" fill="${c.deck >= 5 ? '#111' : '#fff'}">${c.deck}</text>`); }
        if (c.t === 'br') S.push(`<rect x="${px + 1}" y="${py + 1}" width="${Q - 2}" height="${Q - 2}" fill="none" stroke="#fff" stroke-width="0.8" stroke-dasharray="2 1"/>`); }
    /* plot lines + district edges */
    for (let i = Math.ceil(x0 / N) * N; i <= x1 + 1; i += N) S.push(`<line x1="${X(i)}" y1="0" x2="${X(i)}" y2="${TH}" stroke="#8a90a0" stroke-width="${big ? 1.4 : 0.9}" stroke-dasharray="5 4" stroke-opacity="0.75"/>`);
    for (let i = Math.ceil(y0 / N) * N; i <= y1 + 1; i += N) S.push(`<line y1="${Y(i)}" x1="0" y2="${Y(i)}" x2="${TW}" stroke="#8a90a0" stroke-width="${big ? 1.4 : 0.9}" stroke-dasharray="5 4" stroke-opacity="0.75"/>`);
    const edge = (c, w, colr, dash) => { const px = X(c.x), py = Y(c.y), e = { n: [px, py, px + Q, py], s: [px, py + Q, px + Q, py + Q], w: [px, py, px, py + Q], e: [px + Q, py, px + Q, py + Q] }[c.side]; return `<line x1="${e[0]}" y1="${e[1]}" x2="${e[2]}" y2="${e[3]}" stroke="${colr}" stroke-width="${w}" ${dash ? 'stroke-dasharray="' + dash + '"' : ''} stroke-linecap="round"/>`; };
    const inV = c => c.x >= x0 && c.x <= x1 && c.y >= y0 && c.y <= y1;
    if (big) { ROOMS.forEach(r => { if (!r.way) S.push(`<rect x="${X(r.x0)}" y="${Y(r.y0)}" width="${(r.x1 - r.x0 + 1) * Q}" height="${(r.y1 - r.y0 + 1) * Q}" fill="none" stroke="#f4f6fa" stroke-width="3"/>`); });
        WINDOWS.filter(inV).forEach(c => S.push(edge(c, 5, '#58d6ff')));
        DOORS.filter(inV).forEach(c => { const px = X(c.x), py = Y(c.y), h = c.side === 'n' || c.side === 's', cx = c.side === 'w' ? px : c.side === 'e' ? px + Q : px + Q / 2, cy = c.side === 'n' ? py : c.side === 's' ? py + Q : py + Q / 2, a = Q * (c.dbl ? 0.42 : 0.3); S.push(`<rect x="${cx - (h ? a : 3.5)}" y="${cy - (h ? 3.5 : a)}" width="${h ? 2 * a : 7}" height="${h ? 7 : 2 * a}" fill="#ffd95a" stroke="#0d0f12" stroke-width="1"/>`); }); }
    LEDGES.filter(inV).forEach(c => S.push(edge(c, big ? 5 : 2.6, '#ff3b5c', big ? '7 4' : '3 2')));
    if (!big) LAY.plots.forEach(p => { const px = +p.id.slice(1, 3), py = +p.id.slice(4, 6); S.push(`<rect x="${X(px * N) + 1.5}" y="${Y(py * N) + 1.5}" width="5" height="5" fill="${DCOL[p.d]}"/>`); });
    LABELS.concat(big ? ROOMS.filter(r => r.name).map(r => ({ x: (r.x0 + r.x1 + 1) / 2, y: (r.y0 + r.y1 + 1) / 2 - (r.name.split('\n').length - 1) * 0.22 + 0.1, s: r.name, room: 1 })) : []).filter(l => (big ? l.room || (l.x >= x0 && l.x <= x1 + 1 && l.y >= y0 && l.y <= y1 + 1 && !ROOMS.length) : !l.room) && l.x >= x0 - 1 && l.x <= x1 + 2 && l.y >= y0 - 1 && l.y <= y1 + 2).forEach(l => { const f = big ? 11.5 : (l.s2 ? 8 : 9.5); l.s.split('\n').forEach((t, i) => S.push(`<text x="${X(l.x)}" y="${Y(l.y) + i * (f + 2)}" font-size="${f}" font-weight="bold" text-anchor="middle" fill="#fff" stroke="#0d0f12" stroke-width="${big ? 3.2 : 2.6}" paint-order="stroke">${esc(t)}</text>`)); });
    if (!big) { ROOMS.filter(r => r.name && !r.way && (r.x1 - r.x0) >= 5).forEach(r => { const t = r.name.split('\n')[0]; S.push(`<text x="${X((r.x0 + r.x1 + 1) / 2)}" y="${Y((r.y0 + r.y1 + 1) / 2)}" font-size="9" font-weight="bold" text-anchor="middle" fill="#fff" stroke="#0d0f12" stroke-width="2.6" paint-order="stroke">${esc(t)}</text>`); });
        WAYS.forEach(w => { S.push(`<circle cx="${X(w.x)}" cy="${Y(w.y)}" r="5" fill="#ffd95a" stroke="#0d0f12" stroke-width="1.5"/><text x="${X(w.x) + (w.x > 80 ? -8 : 8)}" y="${Y(w.y) + 3.5}" font-size="9" text-anchor="${w.x > 80 ? 'end' : 'start'}" fill="#ffd95a" stroke="#0d0f12" stroke-width="2.6" paint-order="stroke">${esc(w.s)}</text>`); });
        [[21, 12, 'the Desert (4 doors)'], [15, 15.2, 'the Astral Realm'], [38, 18.5, 'the Cavern + the Sewers']].forEach(w => S.push(`<circle cx="${X(w[0])}" cy="${Y(w[1])}" r="5" fill="#ffd95a" stroke="#0d0f12" stroke-width="1.5"/><text x="${X(w[0]) + 8}" y="${Y(w[1]) + 3.5}" font-size="9" fill="#ffd95a" stroke="#0d0f12" stroke-width="2.6" paint-order="stroke">${esc(w[2])}</text>`)); }
    S.push('</g>');
    let ly = M + 20; const lx = TW + M + 22, T = (t, c, b) => { S.push(`<text x="${lx}" y="${ly}" fill="${c || '#e8eaee'}" font-size="${b ? 14 : 11.5}" ${b ? 'font-weight="bold"' : ''}>${esc(t)}</text>`); ly += b ? 21 : 16; };
    T('DEPTH (1 level = 1.75 m)', null, true);
    [[8, 'Level P3: the tram deck (14 m)'], [6, 'the Ring; the motor pool\'s lower deck'], [5, 'the Hangar\'s floor; the Range\'s gallery'], [3, 'the Dream Wing; the detector pit'], [2, 'the Labs, the White Rooms, Command\'s door'], [0, 'Sub-Level 7; the vats, Disposal'], [-2, 'the shaft under the Vault Gantry']].forEach(r => { S.push(`<rect x="${lx}" y="${ly - 11}" width="22" height="14" fill="${col(r[0])}"/><text x="${lx + 11}" y="${ly}" font-size="10" text-anchor="middle" fill="${r[0] >= 5 ? '#111' : '#fff'}">${r[0]}</text><text x="${lx + 30}" y="${ly}" fill="#e8eaee" font-size="11">${esc(r[1])}</text>`); ly += 18; });
    ly += 8; T('SIGNS', null, true);
    T('a number in a square = its level'); T('stripes + arrow = a stair (the arrow points UP)'); T('arrow, no stripes = a ramp (2 squares a level)'); T('dashed inner square = a deck or bridge over the floor'); T('red dashes = a LEDGE: drop down, no way back up', '#ff6b82');
    if (big) { T('white outline = a room\'s walls (on the square lines)'); T('yellow bar = a door', '#ffd95a'); T('blue bar = an observation window', '#58d6ff'); }
    else { T('blue dots = the beam pipe (not walked)', '#7fd0ff'); T('dashes on dark = the tram track', '#c9a'); T('yellow dot = a way out of the zone', '#ffd95a'); ly += 8; T('DISTRICTS (the corner mark of each plot)', null, true); [['K', 'CERN, The Ring'], ['P', 'Level P3'], ['S', 'Sub-Level 7 (stays as built)'], ['R', 'Research (the sample)'], ['C', 'Command']].forEach(d => { S.push(`<rect x="${lx}" y="${ly - 10}" width="11" height="11" fill="${DCOL[d[0]]}"/><text x="${lx + 18}" y="${ly}" fill="#e8eaee" font-size="11.5">${esc(d[1])}</text>`); ly += 17; }); }
    S.push('</svg>');
    fs.writeFileSync(path.join(__dirname, file + '.svg'), S.join('\n'));
    return { file, w: TW + 2 * M + LW, h: TH + 2 * M + 20 };
}
const pics = [
    draw('plan-zone', 0, 0, 83, 83, 13, 'THE D.U.M.B. · THE PLAN ON THE SQUARES · 84 x 84 squares of 3.5 m', 'Every coloured square is floor, the colour and the number are its depth. Research is designed in full; the Ring, Level P3 and Command are block plans.', false),
    draw('plan-research', 12, 12, 35, 59, 30, 'THE D.U.M.B. · RESEARCH, SQUARE BY SQUARE (the sample)', '24 x 48 squares. The hole on the right is Sub-Level 7\'s chambers 01 + 03 (not Research).', true),
];
(async () => { try { const { chromium } = require('playwright'); const b = await chromium.launch(); for (const p of pics) { const pg = await b.newPage({ viewport: { width: p.w, height: p.h } }); await pg.goto('file://' + path.join(__dirname, p.file + '.svg')); await pg.screenshot({ path: path.join(__dirname, p.file + '.png') }); await pg.close(); console.log('wrote', p.file + '.png'); } await b.close(); } catch (e) { console.log('no playwright: the .svg files stay (' + e.message.split('\n')[0] + ')'); } })();
