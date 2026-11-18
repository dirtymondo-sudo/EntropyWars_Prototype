/* HEAVEN + HELL + VATICAN, PLOT PLAN 2 (2026-11-16, the zone thread on mondo's order: "completely redesigned/reimagined with plots and
   districts ... like we did for disaster city or Camelot"; docs/plans/ZONE_THREAD_BRIEF.md). A REDESIGN, not a port: the nine old rooms give
   the names, the landmarks and who lives there; the layout is new.
   `node docs/plans/world-zones/draw-afterlife.js` writes:
     docs/plans/world-zones/heaven-hell-vatican-layout-2.json    the plan (every plot + the square maps)
     docs/plans/world-zones/heaven-hell-vatican_plot_plan_2.png  the picture (an SVG shot with playwright)
     docs/areas/afterlife/layout.json                            the SAME plan, the copy `bake-afterlife.js` builds the four rooms from
   So this file IS the zone's map: change a square here, run it, then run `node bake-afterlife.js`.
   FOUR ROOMS, stacked (never drawn together in the game): HELL under, THE CATACOMBS, THE VATICAN on the ground, HEAVEN over.
   THE HEIGHTS ARE THE MAP (the Beach's way): every square carries a kind (a letter) and a height in metres. A step taller than the walker
   climbs is a wall; Hell's lava is one pool under the land; Heaven's sky is the void under the clouds.
   Squares are (sx west to east, sy north to south), 3.5 m; a plot is 12 x 12 squares. Rect ends are exclusive. */
'use strict';
const fs = require('fs'), path = require('path');
const N = 12, LEVEL = 1.75;
function grid(cols, rows, ch, h) { const W = cols * N, H = rows * N, k = [], hh = [];
    for (let y = 0; y < H; y++) { k.push(new Array(W).fill(ch)); hh.push(new Array(W).fill(h)); }
    const G = { cols, rows, W, H, k, h: hh, stairs: [], slopes: [], bridges: [], climbs: [], ways: [], marks: [] };
    G.set = (x, y, c, v) => { if (x < 0 || y < 0 || x >= W || y >= H) return; if (c != null) k[y][x] = c; if (v != null) hh[y][x] = v; };
    G.rect = (x0, y0, x1, y1, c, v) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) G.set(x, y, c, v); };
    G.ell = (cx, cy, rx, ry, c, v, test) => { for (let y = Math.floor(cy - ry) - 1; y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx) - 1; x <= cx + rx + 1; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1 && (!test || test(x, y, dx, dy))) G.set(x, y, c, v); } };
    /* a flight of stairs / a sloped path over a rect: it RISES toward `dir`; the squares carry the slope, the tool adds the drawn stair */
    G.stair = (x0, y0, x1, y1, dir, h0, h1, c, o) => { G.rect(x0, y0, x1, y1, c || 's', h0); G.stairs.push(Object.assign({ x0, y0, x1, y1, dir, h0, h1 }, o || {})); };
    G.slope = (x0, y0, x1, y1, dir, h0, h1, c) => { G.rect(x0, y0, x1, y1, c, h0); G.slopes.push({ x0, y0, x1, y1, dir, h0, h1 }); };
    return G; }
const hash = (x, y) => { let v = (x * 73856093) ^ (y * 19349663); v = (v ^ (v >>> 13)) * 1274126177; return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };

/* ════════ THE VATICAN: the ultimate holy city. 6 x 4 plots (252 x 168 m). The real one's own order: the Basilica in the west, the Square
   east of it, the gate to the city (Disaster City's Civic Center) in the east wall, the gardens behind the apse, the palace north. ════════ */
const WALL_V = 8.75, BAS = 1.75;
const V = grid(6, 4, 'c', 0);
V.rect(0, 0, 72, 1, 'X', WALL_V); V.rect(0, 47, 72, 48, 'X', WALL_V); V.rect(0, 0, 1, 48, 'X', WALL_V); V.rect(71, 0, 72, 48, 'X', WALL_V);
[[1, 1], [70, 1], [1, 46], [70, 46], [35, 46], [1, 23]].forEach(q => V.rect(q[0] - (q[0] > 1 ? 1 : 0), q[1] - (q[1] > 1 ? 1 : 0), q[0] + (q[0] > 1 ? 1 : 2), q[1] + (q[1] > 1 ? 1 : 2), 'X', WALL_V + 3.5));   // the wall's towers
/* S · THE SQUARE (8 plots, sx 48..71): a tall oval of marble, a colonnade round its north and south ends, the obelisk, two fountains, the gate */
V.rect(48, 1, 71, 47, 'c', 0);
V.ell(60, 24, 13.2, 21.6, 'k', 0, (x, y) => Math.abs(y + 0.5 - 24) > 7);          // the colonnade's two arcs
V.ell(60, 24, 10.4, 18.8, 'm', 0);                                                  // the oval
V.rect(48, 21, 71, 27, 'm', 0);                                                     // the way from the Basilica's steps to the gate
V.rect(59, 23, 61, 25, 'o', 0.9);                                                   // the obelisk's plinth
V.rect(59, 12, 61, 14, 'w', -0.6); V.rect(59, 34, 61, 36, 'w', -0.6);               // the two fountains' basins
V.rect(71, 23, 72, 25, 'm', 0);                                                     // THE GATE (east wall): the city's Civic Center gate is on the other side
/* B · THE BASILICA (6 plots, sx 12..47, sy 12..35): a Latin cross, its floor seven steps up; the dome over the crossing */
V.ell(17, 24, 4.4, 5.2, 'B', BAS, x => x < 17);                                     // the apse
V.rect(16, 13, 24, 35, 'B', BAS);                                                   // the crossing + the transepts
V.rect(24, 17, 42, 31, 'B', BAS);                                                   // the nave + its two aisles
V.rect(42, 15, 45, 33, 'B', BAS);                                                   // the narthex behind the front
V.stair(45, 16, 48, 32, 'W', 0, BAS, 's', { model: 'stone', key: 'marble_light' }); // the steps down to the Square
/* G · THE GARDENS (4 plots, sx 1..11): the Hedge Maze, the lawns behind the apse, the Campanile's stump, the wall walk */
V.rect(1, 1, 12, 47, 'g', 0);
V.rect(11, 12, 12, 47, 'd', 0); V.rect(1, 12, 12, 13, 'd', 0);                      // the garden walks
V.rect(1, 1, 12, 12, 'h', 2.6);                                                     // THE HEDGE MAZE: hedge, then its walks cut in
{ const walk = (x0, y0, x1, y1) => V.rect(x0, y0, x1, y1, 'g', 0);
  walk(2, 2, 11, 3); walk(2, 2, 3, 11); walk(2, 10, 11, 11); walk(10, 4, 11, 11); walk(4, 4, 11, 5); walk(4, 4, 5, 9); walk(4, 8, 9, 9); walk(8, 6, 9, 9);
  walk(6, 6, 9, 7); walk(6, 6, 7, 7); walk(6, 11, 7, 12); walk(6, 10, 7, 11); }                                                    // one way in (south), the heart at 6,6
V.rect(0, 24, 2, 26, 'd', 0);                                                       // THE WEST GATE (One World, route R4 the Old Road): a gap in the wall, the walk in
V.rect(4, 23, 7, 26, 'T', 5.25);                                                    // THE CAMPANILE: "the campanile is a stump"
V.rect(2, 16, 10, 17, 'd', 0); V.rect(5, 13, 6, 23, 'd', 0); V.rect(5, 26, 6, 46, 'd', 0); V.rect(2, 40, 11, 41, 'd', 0);
/* P · THE PALACE (3 plots, north of the Basilica): the Observatory on its mount, the Archive, the Courtyard with the Terrace + the Pilgrim Stair */
V.rect(13, 2, 21, 11, 't', 5.25); V.rect(14, 3, 20, 7, 't', 10.5);                  // THE OBSERVATORY: two tiers, the telescope on top
V.stair(21, 5, 24, 7, 'W', 0, 5.25, 's', { model: 'stone', key: 'marble_light' });  // the Dome Stair, first flight (from the Archive's yard)
V.stair(16, 7, 18, 10, 'N', 5.25, 10.5, 's', { model: 'stone', key: 'marble_light' });   // ... second flight
V.rect(25, 2, 36, 10, 'B', 0.35);                                                   // THE ARCHIVE (walk-in)
V.rect(37, 1, 47, 4, 't', 1.75);                                                    // THE TERRACE (the Courtyard's raised north side)
V.stair(41, 4, 43, 5, 'N', 0, 1.75, 's', { model: 'stone', key: 'marble_light' });
V.rect(41, 0, 43, 1, 't', 1.75);                                                    // THE PILGRIM STAIR's gate (north wall): up Mount Olympus
V.rect(37, 5, 47, 11, 'k', 0); V.rect(38, 6, 46, 10, 'c', 0);                       // the Courtyard: an arcade round the yard
/* C · THE CLOISTER (3 plots, south of the Basilica): the Cloister, the Cistern, the Fountain */
V.rect(13, 37, 24, 46, 'k', 0); V.rect(14, 38, 23, 45, 'g', 0); V.rect(18, 38, 19, 45, 'd', 0); V.rect(14, 41, 23, 42, 'd', 0);   // the Cloister: an arcade round a garth
V.rect(25, 37, 36, 46, 'c', 0); V.ell(30.5, 41.5, 2.6, 2.6, 'm', 0);                // THE CISTERN: drained, a rope down it (the Catacombs)
V.rect(37, 37, 47, 46, 'g', 0); V.rect(37, 41, 47, 42, 'd', 0); V.rect(42, 37, 43, 46, 'd', 0); V.ell(42.5, 41.5, 2.2, 2.2, 'w', -0.6);   // THE FOUNTAIN's court
V.ways = [
    { id: 'link_bureau_vatican', kind: 'link', wall: 'free', sx: 60, sy: 3, face: 180, name: 'DOOR HQ, the Bureau of Continuity (the painting)', note: 'the painting of "a colonnade and a square" hangs under the north colonnade' },
    /* (2026-11-17, One World phase 5) `link_vatican_olympus` (the Pilgrim Stair, a jump from the cortile's north wall to Mount Olympus) is gone: the Pilgrim Way (route R3) walks from the Colosseum's north hedge to Olympus. It was listed here AND on the Colosseum with `unless: 'site_ow_r3'`; this copy had no `unless`, so the jump never dropped */
    { id: 'bay', kind: 'bay', wall: 'free', sx: 30, sy: 11, face: 180, name: 'DOOR HQ: the Vatican\'s bay door ("the archive service door")' },
    { id: 'crypt', kind: 'door', wall: 'free', sx: 14, sy: 24, face: 90, name: 'down: the Catacombs (the white door behind the altar)' },
    { id: 'well', kind: 'door', wall: 'free', sx: 30, sy: 41, face: 180, name: 'down: the Catacombs (the Cistern, down the rope)' },
    { id: 'link_observatory_stair', kind: 'link', wall: 'free', sx: 17, sy: 4, face: 180, name: 'up: Heaven (the telescope, the Stair in the Sky)' },
    /* THE ONE WORLD SEAMS (2026-11-17, phase 4.1 the north routes, written here by the 4.4 thread): a door pair with one id at both ends, each
       written only when its route's room stands. The east gate is OPEN now (was the closed Civic Center gate): the River Road crosses the Tiber */
    { id: 'ow_v_m6_m4', kind: 'seam', wall: 'e', sy: 24, room: 'site_ow_r1', name: 'The River Road (route R1): the east gate, over the Tiber to the city', label: 'THE RIVER ROAD', sub: 'THE EAST GATE · OVER THE TIBER TO THE CITY' },
    { id: 'ow_v_m12_m4', kind: 'seam', wall: 'w', sy: 25, room: 'site_ow_r4', name: 'The Old Road (route R4): the west gate, to Camelot and the Woods', label: 'THE OLD ROAD', sub: 'THE WEST GATE · TO CAMELOT AND THE WOODS' },
];
V.plots = [
    [0, 0, 'G', 'The Hedge Maze', 'the hedges "planted as a maze"; where the gardener gets lost', 'Cortile: the hedges (the gardener\'s lines)'],
    [1, 0, 'P', 'The Observatory', 'LANDMARK: the mount, the Dome Stair, the telescope on top (up: the Stair in the Sky)', 'Observatory: THE TOP OF THE DOME · THE TELESCOPE; Archive: THE DOME STAIR'],
    [2, 0, 'P', 'The Archive', 'walk-in: the stacks, the gallery, the index desk; the Vatican\'s bay door', 'Archive: THE SECRET ARCHIVE · THE STACKS · THE GALLERY'],
    [3, 0, 'P', 'The Courtyard', 'the arcaded yard, the Terrace, the Pilgrim Stair up Mount Olympus', 'Cortile: THE COURTYARD · THE TERRACE'],
    [4, 0, 'S', 'The Colonnade, north-west', 'the north arc of columns', 'Bureau painting: "a colonnade and a square"'],
    [5, 0, 'S', 'The Colonnade, north-east', 'the north arc; the Bureau\'s painting hangs under it', 'Bureau painting: "a colonnade and a square"'],
    [0, 1, 'G', 'The Gardens', 'lawns, pines and statues behind the apse', 'plan 1: The Gardens'],
    [1, 1, 'B', 'The Apse', 'the chancel, the altar, the chair; the white door down to the crypt', 'Basilica: THE CHANCEL · THE CRYPT DOOR BEHIND THE ALTAR'],
    [2, 1, 'B', 'The Nave, north', 'LANDMARK: the dome over the crossing; the north aisle, the triforium', 'Basilica: THE NAVE · THE TRIFORIUM'],
    [3, 1, 'B', 'The Front, north', 'the narthex, the great doors, the steps', 'Cortile: "the façade is the front of the building"'],
    [4, 1, 'S', 'The Square, north-west', 'the oval\'s marble; the north fountain', 'plan 1: The Square'],
    [5, 1, 'S', 'The Square, north-east', 'LANDMARK: the obelisk (on the plot corner)', 'plan 1: The Square'],
    [0, 2, 'G', 'The Campanile', '"the campanile is a stump": the stump of the bell tower', 'Cortile: the campanile (a line)'],
    [1, 2, 'B', 'The South Transept', 'the transept\'s chapels, the confessionals', 'Basilica: the confessionals'],
    [2, 2, 'B', 'The Nave, south', 'the south aisle, the pews', 'Basilica: THE NAVE · MASS'],
    [3, 2, 'B', 'The Front, south', 'the narthex, the steps', 'Cortile: the façade'],
    [4, 2, 'S', 'The Square, south-west', 'the oval\'s marble; the south fountain', 'plan 1: The Square'],
    [5, 2, 'S', 'The Gate', 'the gate in the east wall: Disaster City\'s Civic Center is on the other side (closed)', 'plan 1: The Gate (world plan, layout 3)'],
    [0, 3, 'G', 'The Wall, west', 'the wall walk, a tower, pines', 'plan 1: The Wall, west'],
    [1, 3, 'C', 'The Cloister', 'an arcade round a garth', 'Basilica: the cloister door; plan 1: The Cloister'],
    [2, 3, 'C', 'The Cistern', '"consecrated once, then drained, then a rope": down to the Catacombs', 'Cortile: THE CISTERN DOWN'],
    [3, 3, 'C', 'The Fountain', 'the fountain that "runs on consecrated water"; the gardener', 'Cortile: THE FOUNTAIN'],
    [4, 3, 'S', 'The Colonnade, south-west', 'the south arc of columns', 'Bureau painting'],
    [5, 3, 'S', 'The Colonnade, south-east', 'the south arc of columns', 'Bureau painting'],
];

/* ════════ THE COLOSSEUM (2026-11-17, One World phase 4.4; the map's district `col`, 3 x 3 plots at world -11..-9 x -9..-7, straight
   north of the Vatican under Mount Olympus): the arena of the ultimate holy city, drawn as the real one stands: an oval, an arcade round it on
   the ground, the stands rising in six tiers, a podium wall round the sand, a gate at each end of the long axis (north and south). The Vatican's
   own wall is its south side; the Pilgrim Stair's gate (the Courtyard's terrace, 1.75 m) is reached by a flight up from the plaza.
   Its own small grid (36 x 36 squares): `bake-afterlife.js` THE ONE WORLD MOVE stands the Vatican three plots south and lays this grid on the
   room's columns 1-3, rows 0-2. Names of the plots are mine (marked). ════════ */
/* THE REDESIGN (2026-11-18, mondo: "improve the coliseum to be more realistic and epic ... plan and design and build it like an actual architect would"):
   the plan is a FOUR-CENTRE OVAL, as the Roman surveyors set one out (two small arcs at the ends of the long axis, two big arcs along the sides, the
   four meeting on one tangent), so every ring of the building is the same distance from the arena all round (a scaled ellipse squeezes the seats on
   the short axis: the first build's). The arena's edge is the base line (half axes 26.25 x 15.75 m); the outer wall's face is 28 m out from it
   (54.25 x 43.75 m: the first build's footprint, to the square). THE GROUND IS FLAT under the whole building: the seats, the podium, the gallery and
   the tunnels' walls are the district's own rows (O.js: tier walls, bridges, drawn sections), never the map's heights.
   `a` the arena (d < 0.35 m), `e` under the seats (to 23.5 m), `k` the ring corridor behind the arches (to 28 m), `m` the four gates' tunnels
   (7 m wide on the two axes). */
const COL_OVAL = { a: 26.25, b: 15.75, r1: 9, out: 28, ring: 23.5 }, O = grid(3, 3, 'c', 0);
{ const cx = 18, cy = 16, V = COL_OVAL, r2 = (V.a * V.a - 2 * V.a * V.r1 + V.b * V.b) / (2 * (V.b - V.r1)), c1 = V.a - V.r1, c2 = r2 - V.b, phi = Math.atan2(c2, c1);
  const off = (X, Z) => { X = Math.abs(X); Z = Math.abs(Z); return Math.atan2(Z, X - c1) < phi ? Math.hypot(X - c1, Z) - V.r1 : Math.hypot(X, Z + c2) - r2; };   // metres out from the arena's edge (under 0 = on the sand)
  for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) { const X = (x + 0.5 - cx) * 3.5, Z = (y + 0.5 - cy) * 3.5, d = off(X, Z);
      if (d > V.out) continue;
      if (d < 0.35) O.set(x, y, 'a', 0);                                                            // THE ARENA: sand
      else if (Math.abs(X) < 3.5 || Math.abs(Z) < 3.5) O.set(x, y, 'm', 0);                         // THE FOUR GATES: a tunnel on each axis, the plaza to the sand
      else if (d < V.ring) O.set(x, y, 'e', 0);                                                     // UNDER THE SEATS
      else O.set(x, y, 'k', 0); }                                                                  // THE RING CORRIDOR behind the facade's arches
  O.rect(0, 0, 36, 1, 'h', 2.6); O.rect(0, 0, 1, 36, 'h', 2.6); O.rect(35, 0, 36, 36, 'h', 2.6);   // the plaza's hedges (the land past them is the map's own)
  O.rect(17, 0, 19, 1, 'c', 0);                                                                     // the north opening (the Pilgrim Way comes in here)
  O.stair(29, 31, 31, 36, 'S', 0, 1.75, 's', { model: 'stone', key: 'marble_light' }); }           // THE PILGRIM STAIR, the foot: up to the gate in the Vatican's wall
O.ways = [{ id: 'link_vatican_olympus', kind: 'link', wall: 'n', sx: 18, name: 'The Mountains: Mount Olympus (the Pilgrim Way, north; the stand-in until route R3 stands)', unless: 'site_ow_r3' },
    { id: 'ow_h_m10_m9', kind: 'seam', wall: 'n', sx: 18, room: 'site_ow_r3', name: 'The Pilgrim Way (route R3): north up to Mount Olympus', label: 'THE PILGRIM WAY', sub: 'THE COLOSSEUM · NORTH UP TO MOUNT OLYMPUS', desc: 'A worn path leaves the plaza and goes north into the trees, past little shrines.' }];
O.plots = [
    [0, 0, 'O', 'The Plaza, north-west (label mine)', 'the plaza and the arcade\'s north-west curve', 'plots.json district col'],
    [1, 0, 'O', 'The Gate of Life (label mine)', 'the north gate; the Pilgrim Way to Olympus comes in at the plaza\'s north opening', 'plots.json district col'],
    [2, 0, 'O', 'The Plaza, north-east (label mine)', 'the plaza and the arcade\'s north-east curve', 'plots.json district col'],
    [0, 1, 'O', 'The Stands, west (label mine)', 'the west stands: six tiers', 'plots.json district col'],
    [1, 1, 'O', 'The Arena (label mine)', 'LANDMARK: the sand inside the podium wall', 'plots.json district col'],
    [2, 1, 'O', 'The Stands, east (label mine)', 'the east stands: six tiers', 'plots.json district col'],
    [0, 2, 'O', 'The Plaza, south-west (label mine)', 'the plaza by the Vatican\'s wall', 'plots.json district col'],
    [1, 2, 'O', 'The Gate of Death (label mine)', 'the south gate', 'plots.json district col'],
    [2, 2, 'O', 'The Pilgrim Stair (label mine)', 'the flight up to the gate in the Vatican\'s wall (the Courtyard\'s terrace)', 'plots.json district col'],
];

/* ════════ THE CATACOMBS: the dungeon under the Basilica. 3 x 2 plots (126 x 84 m), roofed. ════════ */
const WALL_K = 7, K = grid(3, 2, 'X', WALL_K);
K.rect(14, 2, 23, 9, 'f', 3.5);                                                     // THE CRYPT under the altar (the stair up is in its north wall)
K.rect(18, 0, 20, 2, 'f', 3.5);
K.stair(17, 9, 19, 12, 'N', 1.75, 3.5, 's', { model: 'stone' });                    // THE DESCENT, first flight
K.rect(15, 12, 21, 15, 'f', 1.75);
K.stair(12, 13, 15, 15, 'E', 0, 1.75, 's', { model: 'stone' });                     // ... second flight: "two flights down and you are level with the dead"
K.rect(2, 2, 12, 11, 'f', 0);                                                       // THE LOCULI: a grid of galleries round blocks of graves
[[4, 4], [8, 4], [4, 8], [8, 8]].forEach(q => K.rect(q[0], q[1], q[0] + 2, q[1] + 2, 'X', WALL_K));
K.rect(10, 11, 12, 19, 'f', 0); K.rect(10, 17, 25, 19, 'f', 0);                     // the low passage
K.ell(6, 18, 4.2, 4.2, 'f', 0); K.ell(6, 18, 1.6, 1.6, 'w', -0.5);                  // THE CISTERN's foot: the rope comes down here
K.rect(26, 2, 34, 9, 'f', 0); K.ell(30, 5.5, 1.3, 1.3, 'w', -0.5);                  // THE FONT: "consecrated and cold"
K.stair(23, 4, 26, 6, 'W', 0, 3.5, 's', { model: 'stone' });                        // from the Crypt down to the Font
K.rect(29, 9, 31, 14, 'f', 0);
K.rect(25, 14, 34, 22, 'f', 0); K.rect(34, 17, 36, 19, 'f', 0);                     // THE WARM WALL: its east wall is Hell's
K.ways = [
    { id: 'stair', kind: 'door', wall: 'n', sx: 19, name: 'up: the Basilica (the crypt stair, behind the altar)' },
    { id: 'well', kind: 'door', wall: 'free', sx: 6, sy: 16, face: 0, name: 'up: the Cistern (the rope)' },
    { id: 'link_vatican_hell', kind: 'link', wall: 'e', sy: 18, name: 'down: Hell (the Warm Wall; a door that is not on a plate)' },
];
K.plots = [
    [0, 0, 'K', 'The Loculi', '"little places": galleries of graves', 'Catacombs: the ghoul\'s line'],
    [1, 0, 'K', 'The Crypt', 'the crypt under the altar; the stair up', 'Catacombs: THE CRYPT UNDER THE BASILICA'],
    [2, 0, 'K', 'The Font', 'the font, "consecrated and cold"', 'Catacombs: the priest\'s line'],
    [0, 1, 'K', 'The Cistern', 'the bottom of the rope', 'Catacombs: THE CISTERN'],
    [1, 1, 'K', 'The Descent', 'two flights down', 'Catacombs: THE DESCENT'],
    [2, 1, 'K', 'The Warm Wall', '"the wall is warm. It is not the boiler": the way down to Hell', 'Catacombs: THE WARM WALL'],
];

/* ════════ HELL: the ultimate pit. 4 x 4 plots (168 m a side). A funnel of terraces round a lake of lava, the Plinth on its island;
   the east side has fallen in: platforms on pillars of rock over a sea of lava, walkways between them. ════════ */
const WALL_L = 26.25, RIM = 14, T2 = 8.75, FLOOR = 3.5, LAVA = -2;
const L = grid(4, 4, 'R', WALL_L);
for (let y = 2; y < 46; y++) for (let x = 2; x < 46; x++) { const e = Math.min(x, y, 47 - x, 47 - y); if (e === 2 && hash(x, y) < 0.3) continue; L.set(x, y, 'r', RIM); }
L.rect(2, 36, 12, 46, 'a', RIM);                                                    // THE ASH FLATS
L.ell(25, 25.5, 17.5, 16, 'p', T2);                                                 // the second terrace
L.ell(25, 25.5, 11.5, 10.5, 'r', FLOOR);                                            // the Bowl's floor
L.rect(36, 2, 46, 46, 'L', LAVA);                                                   // the sea of lava (the east side)
L.ell(29, 28, 6.5, 6, 'L', LAVA);                                                   // the lake
L.rect(28, 27, 31, 30, 'o', FLOOR);                                                 // THE PLINTH's island
L.bridges.push({ x0: 23, y0: 28, x1: 28, y1: 29, y: FLOOR, key: 'rocks_3', name: 'the causeway to the Plinth' });
L.rect(0, 26, 4, 35, 'R', WALL_L); L.rect(2, 28, 4, 32, 'r', RIM);                  // THE ALCOVE: a hollow in the rim's wall
L.rect(2, 9, 9, 11, 'R', WALL_L);                                                   // the spur that makes the Fissure's End a gorge
L.rect(0, 5, 2, 7, 'r', RIM);                                                       // the Fissure (west wall): the Cavern
L.rect(29, 0, 31, 2, 'r', RIM);                                                     // the Warm Wall (north wall): up to the Catacombs
L.rect(16, 44, 20, 46, 'o', RIM + 3.5); L.stair(17, 42, 19, 44, 'S', RIM, RIM + 3.5, 's', { model: 'stone', key: 'rocks_3' });   // THE MOUTH: the door's own ledge, the first of "three flights down"
L.rect(16, 40, 20, 42, 'r', RIM); L.stair(17, 37, 19, 40, 'S', T2, RIM, 's', { model: 'stone', key: 'rocks_3' });     // rim > second terrace, south
L.stair(23, 7, 25, 10, 'N', T2, RIM, 's', { model: 'stone', key: 'rocks_3' });      // ... north
L.stair(5, 25, 8, 27, 'W', T2, RIM, 's', { model: 'stone', key: 'rocks_3' });       // ... west
L.stair(11, 29, 14, 31, 'W', FLOOR, T2, 's', { model: 'stone', key: 'rocks_3' });   // second terrace > the Bowl, west
L.stair(28, 13, 30, 16, 'N', FLOOR, T2, 's', { model: 'stone', key: 'rocks_3' });   // ... north
L.stair(21, 36, 23, 39, 'S', FLOOR, T2, 's', { model: 'stone', key: 'rocks_3' });   // ... south
/* THE WALKWAYS: four platforms at the rim's height + the bridges */
[[38, 4, 44, 10], [39, 15, 44, 20], [39, 26, 44, 31], [38, 38, 44, 44]].forEach(q => L.rect(q[0], q[1], q[2], q[3], 'r', RIM));
L.rect(37, 24, 46, 33, 'r', 1.75); L.rect(39, 26, 44, 31, 'r', RIM);                // THE LAVA BELOW: a ledge just over the lava, under the third platform
[[36, 6, 38, 8], [40, 10, 42, 15], [40, 20, 42, 26], [40, 31, 42, 38], [36, 40, 38, 42]].forEach((q, i) => L.bridges.push({ x0: q[0], y0: q[1], x1: q[2], y1: q[3], y: RIM, key: 'rocks_3', rails: true, name: 'walkway ' + (i + 1) }));
L.climbs.push({ sx: 44, sy: 28, face: 90, look: 'rope', name: 'the chains down to the ledge' });
L.ways = [
    { id: 'link_cave_hell', kind: 'link', wall: 'w', sy: 6, name: 'The Cavern (the Fissure, the hot gallery)' },
    { id: 'link_vatican_hell', kind: 'link', wall: 'n', sx: 30, name: 'up: the Catacombs (the Warm Wall, the other side)' },
    { id: 'bay', kind: 'bay', wall: 'free', sx: 18, sy: 45, face: 0, name: 'DOOR HQ: Hell\'s bay door (the mouth)' },
];
L.plots = [
    [0, 0, 'R', 'The Fissure\'s End', 'where the tunnel from the Cavern comes out: a gorge in the rim', 'Pit: THE FISSURE · THE HOT GALLERY'],
    [1, 0, 'R', 'The Rim, north', 'the lip of the pit', 'Pit: THE RIM'],
    [2, 0, 'R', 'The Warm Wall', 'the other side of the Catacombs\' warm wall', 'Pit: THE WARM WALL, THE OTHER SIDE'],
    [3, 0, 'W', 'The High Platforms', 'LANDMARK: the first platform on its pillar over the lava', 'Walkways: HIGH PLATFORMS'],
    [0, 1, 'R', 'The Rim, west', 'the lip of the pit, the stair down', 'Pit: THE RIM'],
    [1, 1, 'D', 'The Descent', 'the second terrace and its flights', 'Pit: THE DESCENT'],
    [2, 1, 'B', 'The Lava Lake', 'the lake\'s north shore', 'plan 1: The Lava Lake'],
    [3, 1, 'W', 'The Walkways', 'walkways from platform to platform', 'Walkways: WALKWAYS'],
    [0, 2, 'D', 'The Alcove', 'a hollow in the rim; the terrace under it', 'Pit: the alcove (a door plate)'],
    [1, 2, 'B', 'The Bowl', 'the floor of the pit: the stocks, the altar, the chains; "take a number"', 'Pit: THE BOWL'],
    [2, 2, 'B', 'The Plinth', 'LANDMARK: the Plinth on its island, the causeway', 'Pit: THE PLINTH'],
    [3, 2, 'W', 'The Lava Below', 'a ledge just over the lava, under the third platform', 'Walkways: THE LAVA BELOW'],
    [0, 3, 'D', 'The Ash Flats', 'a flat of ash on the rim', 'plan 1: The Ash Flats'],
    [1, 3, 'R', 'The Rim, south', 'THE MOUTH: the bay door on its ledge, "three flights down"', 'Pit: the mouth (the bay door, the lines)'],
    [2, 3, 'B', 'The Far Shore', 'the lake\'s south shore', 'plan 1: The Far Shore'],
    [3, 3, 'W', 'The Walkways, east', 'the last platform, the walkway back to the rim', 'Walkways: WALKWAYS'],
];

/* ════════ HEAVEN: the ultimate cloud city behind its gate. 4 x 5 plots (168 x 210 m). One climb from the south: the foot of the Stair in
   the Sky, four floating flights, the Gate in a wall of cloud, the Cloud Fields behind it, the city on the highest cloud. ════════ */
const F0 = 3.5, F1 = 8.75, F2 = 14, F3 = 19.25, GATE = 24.5, CITY = 28, BANK = GATE + 7;
const H = grid(4, 5, '.', 0);
/* T · THE STAIRWAY (8 plots, sy 36..59) */
H.ell(6.5, 53, 4.6, 4.6, 'c', F0); H.rect(4, 51, 9, 56, 'm', F0);                   // the foot
H.rect(6, 56, 8, 60, 'c', F0);                                                      // ... the frame the telescope lands you in (south wall)
H.rect(0, 52, 3, 54, 'c', F0);                                                      // THE SKY BRIDGE (west wall): Camelot's castle in the sky
H.stair(11, 52, 15, 55, 'E', F0, F1, 's', { float: true });                         // THE FIRST FLIGHT
H.ell(20.5, 53, 5.6, 4.6, 'c', F1); H.rect(19, 48, 22, 50, 'c', F1); H.rect(17, 51, 24, 56, 'm', F1);
H.rect(21, 53, 23, 55, 'w', F1 - 0.45);                                             // the pool that "heals the stairs"
H.rect(25, 53, 42, 55, 'c', F1);                                                    // THE LONG WAY: "the long way is on the left. It is also up"
H.stair(40, 42, 42, 53, 'N', F1, F2, 's', { float: true });
H.rect(28, 40, 42, 42, 'c', F2);
H.stair(19, 44, 22, 48, 'N', F1, F2, 's', { float: true });                         // THE SECOND FLIGHT
H.ell(22, 40.5, 6.2, 3.9, 'c', F2); H.rect(15, 39, 17, 42, 'c', F2); H.rect(18, 38, 27, 43, 'm', F2);
H.ell(34, 48, 2.2, 1.8, 'c', F0 + 1.75); H.ell(31, 34, 2.4, 1.6, 'c', F2 + 1.75); H.ell(44, 36, 2, 1.6, 'c', F1 + 3.5);   // THE FALL: loose clouds over nothing
H.stair(11, 39, 15, 42, 'W', F2, F3, 's', { float: true });                         // THE THIRD FLIGHT
H.ell(6.5, 40.5, 4.6, 4.6, 'c', F3); H.rect(4, 38, 10, 43, 'm', F3); H.rect(5, 35, 8, 37, 'c', F3);
H.stair(5, 31, 8, 35, 'N', F3, GATE, 's', { float: true });                         // THE FOURTH FLIGHT
/* A · THE GATE (4 plots, sy 24..35): the landing, the wall of cloud, the pearly gate, the book */
H.rect(2, 26, 46, 31, 'c', GATE); H.rect(3, 27, 45, 30, 'm', GATE);
H.rect(0, 24, 48, 26, 'K', GATE); H.rect(23, 24, 25, 26, 'm', GATE);                // the wall of cloud; THE GATE in its middle
/* F · THE CLOUD FIELDS (4 plots, sy 12..23) */
for (let y = 12; y < 24; y++) for (let x = 1; x < 47; x++) { const e = Math.min(x - 1, 46 - x); if (e === 0 && hash(x, y) < 0.4) continue; H.set(x, y, 'c', GATE); }
H.ell(24, 18, 3.6, 3.6, 'm', GATE);                                                 // THE SUN: the dial on the floor
H.rect(23, 12, 25, 24, 'm', GATE);                                                  // the way from the Gate past the Sun to the city
H.rect(2, 13, 12, 23, 'c', GATE + 1.75); H.rect(2, 13, 9, 20, 'c', GATE + 3.5);     // THE TERRACES: two steps of cloud up to the city's level
H.stair(12, 21, 13, 23, 'W', GATE, GATE + 1.75, 's', { model: 'stone', key: 'marble_light' });
H.stair(9, 14, 10, 16, 'W', GATE + 1.75, GATE + 3.5, 's', { model: 'stone', key: 'marble_light' });
for (let y = 12; y < 24; y++) for (let x = 36; x < 47; x++) H.set(x, y, '.', 0);    // THE CLOUD PATHS: islands and narrow paths over the sky
H.rect(36, 17, 48, 19, 'c', GATE); H.ell(41, 14.5, 3.2, 2.2, 'c', GATE); H.ell(41.5, 21.5, 3.4, 2, 'c', GATE); H.rect(40, 13, 42, 23, 'c', GATE); H.rect(36, 14, 39, 15, 'c', GATE); H.rect(36, 21, 39, 22, 'c', GATE);
/* Y · THE CITY (4 plots, sy 0..11) */
H.rect(1, 1, 47, 12, 'c', CITY); H.rect(2, 9, 46, 11, 'm', CITY);                   // the high cloud; its marble street
H.stair(23, 12, 25, 14, 'N', GATE, CITY, 's', { model: 'stone', key: 'marble_light' });
H.rect(2, 13, 9, 14, 'c', CITY); H.rect(2, 12, 9, 13, 'c', CITY);                   // the Terraces' top step meets the city's cloud
H.rect(19, 2, 29, 8, 'B', CITY);                                                    // ROOM 777 (walk-in): "no door on the inside"
H.ways = [
    { id: 'link_observatory_stair', kind: 'link', wall: 's', sx: 7, name: 'down: the Vatican (the Observatory\'s telescope)' },
    { id: 'link_skycastle_stair', kind: 'link', wall: 'w', sy: 53, name: 'Camelot: the Castle in the Sky (the Sky Bridge)' },
    { id: 'link_heaven_olympus', kind: 'link', wall: 'e', sy: 18, name: 'The Mountains: Mount Olympus (the Grand Stair, a gate of cloud)' },
    { id: 'bay', kind: 'bay', wall: 'free', sx: 24, sy: 8, face: 180, name: 'DOOR HQ: Heaven\'s bay door (Room 777, "a hotel room door")' },
];
H.plots = [
    [0, 0, 'Y', 'The Towers, west (label mine)', 'the white towers of the city', 'Cloud Fields: 16 castle towers, walls and gates'],
    [1, 0, 'Y', 'Room 777, west', 'LANDMARK: the hotel where "checkout is never" (walk-in)', 'Cloud Fields: Room 777 (the bay door, the lines)'],
    [2, 0, 'Y', 'Room 777, east', 'the hotel\'s east wing; the harps', 'Cloud Fields: Room 777; the harps'],
    [3, 0, 'Y', 'The Towers, east (label mine)', 'the white towers of the city', 'Cloud Fields: the castle towers'],
    [0, 1, 'F', 'The Terraces', 'two steps of cloud up to the city', 'Cloud Fields: THE TERRACES'],
    [1, 1, 'F', 'The Sun', 'LANDMARK: the Sun, a dial on the floor', 'Cloud Fields: THE SUN'],
    [2, 1, 'F', 'The Cloud Fields', '"Is this the queue?" "This is the field."', 'Cloud Fields'],
    [3, 1, 'F', 'The Cloud Paths', 'narrow paths over the sky; the Grand Stair\'s gate of cloud (Mount Olympus)', 'Cloud Fields: THE CLOUD PATHS · THE GRAND STAIR'],
    [0, 2, 'A', 'The Top of the Stair', 'where the fourth flight lands', 'Stairway: THE GATE AT THE TOP'],
    [1, 2, 'A', 'The Gate, west', 'LANDMARK: the Gate in the wall of cloud', 'Cloud Fields: THE GATE'],
    [2, 2, 'A', 'The Gate, east', 'the Gate; the queue', 'Cloud Fields: THE GATE'],
    [3, 2, 'A', 'The Book (label mine)', 'the lectern: "Name?" "It is in the book."', 'Cloud Fields: the seraphim\'s lines, the lectern'],
    [0, 3, 'T', 'The Third Flight', 'the third landing; the fourth flight up to the Gate', 'Stairway: FOUR FLOATING FLIGHTS'],
    [1, 3, 'T', 'The Second Flight', 'the second landing', 'Stairway: FOUR FLOATING FLIGHTS'],
    [2, 3, 'T', 'The Long Way, north', 'the long way round comes in here', 'Stairway: "the long way is on the left"'],
    [3, 3, 'T', 'The Fall, north', 'loose clouds over nothing', 'Stairway: THE FALL'],
    [0, 4, 'T', 'The Stair in the Sky', 'the foot of the stair (from the telescope); the Sky Bridge to Camelot', 'Stairway: THE STAIR THAT ONLY GOES UP'],
    [1, 4, 'T', 'The First Flight', 'the first landing, the pool that "heals the stairs"', 'Stairway: the pool, the Healing Zone'],
    [2, 4, 'T', 'The Long Way', 'a path of cloud out over the Fall', 'Stairway: the long way'],
    [3, 4, 'T', 'The Fall', '"I fell." "Everyone falls."', 'Stairway: THE FALL'],
];

/* ════════ write the plan ════════ */
const DISTRICTS = {
    B: ['The Basilica', 'vatican'], S: ['The Square', 'vatican'], P: ['The Palace', 'vatican'], C: ['The Cloister', 'vatican'], G: ['The Gardens', 'vatican'],
    K: ['The Catacombs', 'catacombs'],
    R: ['The Rim', 'hell'], D: ['The Descent', 'hell'], L: ['The Bowl', 'hell'], W: ['The Walkways', 'hell'],
    T: ['The Stairway', 'heaven'], A: ['The Gate', 'heaven'], F: ['The Cloud Fields', 'heaven'], Y: ['The City', 'heaven'],
    O: ['The Colosseum', 'vatican'] };   // (O builds AFTER the Vatican's One World move, on the moved room: bake-afterlife.js)
const LEGEND = {
    vatican: { X: 'the wall (8.75 m; its towers 12.25 m)', c: 'cobbles', m: 'marble', k: 'colonnade / arcade (walked between the columns)', o: 'the obelisk\'s plinth', w: 'a fountain\'s basin', B: 'a building\'s floor (walk-in)', s: 'steps', g: 'lawn', d: 'garden walk', h: 'hedge (2.6 m)', T: 'the Campanile\'s stump', t: 'terrace', q: 'the Cistern\'s shaft' },
    catacombs: { X: 'solid (brick to the roof)', f: 'floor', s: 'steps', w: 'water' },
    hell: { R: 'rock wall', r: 'scorched rock', p: 'the second terrace', a: 'ash', L: 'lava (never walked)', o: 'obsidian', s: 'steps' },
    heaven: { '.': 'open sky (a fall)', c: 'cloud you walk on', m: 'marble', s: 'steps (the four flights float)', w: 'the pool', K: 'the wall of cloud', B: 'a building\'s floor (walk-in)' } };
const ROOMS = [
    { key: 'hell', room: 'site_prebuilt_hell_plots', label: 'HELL', title: 'HELL  (below)', G: L, fix: { B: 'L' } },
    { key: 'catacombs', room: 'site_prebuilt_vatican_under', label: 'THE CATACOMBS', title: 'THE CATACOMBS (under)', G: K },
    { key: 'vatican', room: 'site_prebuilt_vatican_plots', label: 'THE VATICAN', title: 'THE VATICAN  (the ground)', G: V },
    { key: 'heaven', room: 'site_prebuilt_heaven_plots', label: 'HEAVEN', title: 'HEAVEN  (above)', G: H },
];
const pid = (x, y) => 'P' + String(x).padStart(2, '0') + '-' + String(y).padStart(2, '0');
const out = { area: 'Heaven + Hell + Vatican', version: 'plan-2', by: 'the zone thread, 2026-11-16 (mondo\'s order: a redesign on plots, no OK needed; his word overrules any of it)',
    squareMeters: 3.5, plotCells: N, levelMeters: LEVEL, districts: {}, rooms: [] };
Object.keys(DISTRICTS).forEach(k => { out.districts[k] = { name: DISTRICTS[k][0], room: DISTRICTS[k][1], file: 'docs/areas/afterlife/districts/' + k + '.js' }; });
ROOMS.forEach(R => { const G = R.G;
    const plots = G.plots.map(p => { const d = (R.fix && R.fix[p[2]]) || p[2]; let s = 0, n = 0, walk = 'XRKLh.'.split('');
        for (let y = p[1] * N; y < p[1] * N + N; y++) for (let x = p[0] * N; x < p[0] * N + N; x++) if (walk.indexOf(G.k[y][x]) < 0) { s += G.h[y][x]; n++; }
        return { id: pid(p[0], p[1]), name: p[3], d, level: n ? Math.round(s / n / LEVEL) : 0, what: p[4], from: p[5] }; });
    out.rooms.push({ key: R.key, room: R.room, label: R.label, cols: G.cols, rows: G.rows, legend: LEGEND[R.key], plots, cells: G.k.map(r => r.join('')),
        heights: G.h.map(r => r.map(v => Math.round(v * 100)).join(',')), heightsUnit: 'centimetres, one a square, rows north to south',
        stairs: G.stairs, slopes: G.slopes, bridges: G.bridges, climbs: G.climbs, ways: G.ways }); });
{ const plots = O.plots.map(p => { let s = 0, n = 0; for (let y = p[1] * N; y < p[1] * N + N; y++) for (let x = p[0] * N; x < p[0] * N + N; x++) if ('hp'.indexOf(O.k[y][x]) < 0) { s += O.h[y][x]; n++; }
      return { id: pid(p[0], p[1]), name: p[3], d: p[2], level: n ? Math.round(s / n / LEVEL) : 0, what: p[4], from: p[5] }; });
  out.colosseum = { note: 'laid on the Vatican room\'s columns 1-3, rows 0-2 by bake-afterlife.js THE ONE WORLD MOVE', cols: 3, rows: 3, at: [1, 0],
      legend: { c: 'cobbles (the plaza)', h: 'hedge (2.6 m)', k: 'the ring corridor behind the arches', e: 'under the seats (flat ground: the tiers are the district\'s rows)', a: 'the arena\'s sand', m: 'a gate\'s tunnel', s: 'steps' }, oval: COL_OVAL,
      plots, cells: O.k.map(r => r.join('')), heights: O.h.map(r => r.map(v => Math.round(v * 100)).join(',')), stairs: O.stairs, slopes: O.slopes, ways: O.ways }; }
const json = JSON.stringify(out, null, 1).replace(/\[\n\s+("[^"]*"|-?[\d.]+)(,\n\s+("[^"]*"|-?[\d.]+)){0,3}\n\s+\]/g, m => m.replace(/\n\s+/g, ' '));
fs.writeFileSync(path.join(__dirname, 'heaven-hell-vatican-layout-2.json'), json + '\n');
const areaDir = path.join(__dirname, '../../areas/afterlife'); fs.mkdirSync(areaDir, { recursive: true }); fs.writeFileSync(path.join(areaDir, 'layout.json'), json + '\n');

/* ════════ draw the picture ════════ */
const COL = { X: '#8d7b62', c: '#b9b2a2', m: '#ebe6da', k: '#d9cfb6', o: '#c9a74a', w: '#3f7fc4', B: '#7a5236', s: '#f4e9c4', g: '#5f9a4f', d: '#b59a6c', h: '#27603a', T: '#8a6f52', t: '#cfc6b0', q: '#2c2f33',
    f: '#6f6658', R: '#33211d', r: '#7a4030', p: '#8f5236', a: '#8a8580', L: '#f0621e', '.': '#7fb0e6', K: '#f8fbff' };
const HCOL = { X: '#141012', c: '#d8d2c6', m: '#e9e3d6', s: '#f1e2b0', w: '#3f7fc4', f: '#857a68' };   // the Catacombs / Heaven read differently
const DCOL = { B: '#e8c66a', S: '#e9e3d6', P: '#c79a5e', C: '#8fb37a', G: '#5f9a4f', K: '#9a8f7c', R: '#a34a34', D: '#c0683e', L: '#f0621e', W: '#d99a3a', T: '#9cc4f0', A: '#f4e9c4', F: '#eaf2ff', Y: '#e8c66a', O: '#d8b48a' };
const S = 11, PAD = 30, TOP = 96, o = [], esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const T = (x, y, s, size, fill, w, anchor) => o.push(`<text x="${x}" y="${y}" font-size="${size}" fill="${fill || '#e8e4da'}"${w ? ` font-weight="${w}"` : ''}${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(s)}</text>`);
let X = PAD; const frames = [];
ROOMS.forEach(R => { const G = R.G, wpx = G.W * S, hpx = G.H * S; frames.push({ R, x: X, y: TOP, wpx, hpx }); X += wpx + PAD; });
const LEGW = 400, Wd = X + LEGW, Ht = TOP + Math.max.apply(null, frames.map(f => f.hpx)) + 150;
o.push(`<rect width="${Wd}" height="${Ht}" fill="#161815"/>`);
T(PAD, 34, 'HEAVEN + HELL + VATICAN  ·  plot plan 2  ·  a redesign: four rooms, 66 plots, 14 districts  ·  stacked one above the other', 22, '#fff', 700);
T(PAD, 58, 'North is up in each. Hell under, the Catacombs, the Vatican on the ground (its gate faces Disaster City, east), Heaven over. Mount Olympus is in the Mountains now: its two stairs come in from there.', 13, '#bdb8aa');
T(PAD, 76, 'Every square is 3.5 m, every plot 12 x 12. A darker square is lower. One file a district: docs/areas/afterlife/districts/<letter>.js.', 13, '#bdb8aa');
frames.forEach(f => { const G = f.R.G, sky = f.R.key === 'heaven', cat = f.R.key === 'catacombs';
    T(f.x, f.y - 8, f.R.title + ' · ' + G.cols + ' x ' + G.rows, 14, '#fff', 700);
    let lo = Infinity, hi = -Infinity; G.h.forEach(r => r.forEach(v => { lo = Math.min(lo, v); hi = Math.max(hi, v); }));
    for (let y = 0; y < G.H; y++) for (let x = 0; x < G.W; x++) { const ch = G.k[y][x]; let c = (cat && HCOL[ch]) || COL[ch] || '#f0f';
        const t = (ch === '.' || ch === 'L' || ch === 'X' || ch === 'R' || ch === 'K') ? 0 : (G.h[y][x] - lo) / Math.max(1, hi - lo);
        o.push(`<rect x="${f.x + x * S}" y="${f.y + y * S}" width="${S}" height="${S}" fill="${c}"/>`);
        if (t > 0 && !sky) o.push(`<rect x="${f.x + x * S}" y="${f.y + y * S}" width="${S}" height="${S}" fill="#fff" opacity="${(t * 0.28).toFixed(2)}"/>`);
        if (sky && ch !== '.') o.push(`<rect x="${f.x + x * S}" y="${f.y + y * S}" width="${S}" height="${S}" fill="#fff" opacity="${(0.1 + t * 0.5).toFixed(2)}"/>`); }
    G.bridges.forEach(b => o.push(`<rect x="${f.x + b.x0 * S}" y="${f.y + b.y0 * S}" width="${(b.x1 - b.x0) * S}" height="${(b.y1 - b.y0) * S}" fill="#5a3a2c" stroke="#e8c66a" stroke-width="1"/>`));
    G.stairs.forEach(s => { const ns = s.dir === 'N' || s.dir === 'S', n = (ns ? s.y1 - s.y0 : s.x1 - s.x0) * 3;
        for (let i = 1; i < n; i++) o.push(ns ? `<line x1="${f.x + s.x0 * S}" x2="${f.x + s.x1 * S}" y1="${f.y + s.y0 * S + i * S / 3}" y2="${f.y + s.y0 * S + i * S / 3}" stroke="#7a6a40" stroke-width="0.8"/>` : `<line y1="${f.y + s.y0 * S}" y2="${f.y + s.y1 * S}" x1="${f.x + s.x0 * S + i * S / 3}" x2="${f.x + s.x0 * S + i * S / 3}" stroke="#7a6a40" stroke-width="0.8"/>`); });
    G.plots.forEach(p => { const d = (f.R.fix && f.R.fix[p[2]]) || p[2], px = f.x + p[0] * N * S, py = f.y + p[1] * N * S;
        o.push(`<rect x="${px}" y="${py}" width="${N * S}" height="${N * S}" fill="none" stroke="#0c0d0c" stroke-width="1.2"/>`);
        o.push(`<rect x="${px + 2}" y="${py + 2}" width="13" height="13" fill="${DCOL[d]}" stroke="#000"/>`); T(px + 8.5, py + 12.5, d, 10, '#000', 700, 'middle');
        const nm = p[3].replace(' (label mine)', '*'); o.push(`<text x="${px + 19}" y="${py + 12.5}" font-size="10" font-weight="700" fill="#fff" stroke="#000" stroke-width="2.6" paint-order="stroke">${esc(nm)}</text>`); });
    o.push(`<rect x="${f.x}" y="${f.y}" width="${f.wpx}" height="${f.hpx}" fill="none" stroke="#fff" stroke-width="2"/>`);
    G.ways.forEach((w, i) => { const sx = w.wall === 'w' ? 0 : w.wall === 'e' ? G.W : w.sx, sy = w.wall === 'n' ? 0 : w.wall === 's' ? G.H : w.sy, cx = f.x + (sx + (w.wall === 'free' || w.wall === 'n' || w.wall === 's' ? 0.5 : 0)) * S, cy = f.y + (sy + (w.wall === 'free' || w.wall === 'w' || w.wall === 'e' ? 0.5 : 0)) * S;
        const c = w.kind === 'link' ? '#3ee66f' : w.kind === 'bay' ? '#ff78d2' : w.kind === 'gate' ? '#55c8ff' : '#ffc23e';
        o.push(`<circle cx="${cx}" cy="${cy}" r="7" fill="${c}" stroke="#000" stroke-width="1.5"/>`); T(cx, cy + 3.5, String(i + 1), 9.5, '#000', 700, 'middle');
        T(f.x, f.y + f.hpx + 16 + i * 14, (i + 1) + '  ' + w.name, 10.5, c); }); });
let ly = TOP + 4; const lx = X + 4;
T(lx, ly, 'DISTRICTS (one thread a file)', 14, '#fff', 700); ly += 18;
ROOMS.forEach(R => { T(lx, ly, R.label, 11.5, '#bdb8aa', 700); ly += 15;
    Object.keys(DISTRICTS).filter(k => DISTRICTS[k][1] === R.key).forEach(k => { const n = R.G.plots.filter(p => ((R.fix && R.fix[p[2]]) || p[2]) === k).length;
        o.push(`<rect x="${lx}" y="${ly - 10}" width="12" height="12" fill="${DCOL[k]}" stroke="#000"/>`); T(lx + 18, ly, k + '  ' + DISTRICTS[k][0] + '  (' + n + ' plots)', 11.5); ly += 15; }); ly += 4; });
ly += 8; T(lx, ly, 'WAYS', 14, '#fff', 700); ly += 17;
[['#3ee66f', 'a way to another zone or room (a link that exists today)'], ['#ff78d2', 'a DOOR HQ bay door (exists today)'], ['#ffc23e', 'a door between the Vatican and its Catacombs'], ['#55c8ff', 'the closed gate to Disaster City (their side is the owner\'s)']].forEach(q => { o.push(`<circle cx="${lx + 6}" cy="${ly - 4}" r="6" fill="${q[0]}" stroke="#000"/>`); T(lx + 18, ly, q[1], 11); ly += 15; });
ly += 10; T(lx, ly, 'WHO LIVES HERE (the units\' own homes)', 14, '#fff', 700); ly += 17;
['Hell: Demon, Demon Prince, Demon Princess, Succubus,', '   Fallen Angel, Halfdemon, Skeleton; visitors Ghoul,', '   Undead, Overlord', 'Catacombs: Vampire, Ghoul, Priest', 'Vatican: Priest (and the Nun), Gargoyle', 'Heaven: Angel, Seraphim, Valkraye; The Watcher at the', '   telescope; the Chosen One on the stair'].forEach(s => { T(lx, ly, s, 11, '#d8d2c6'); ly += 14; });
ly += 10; T(lx, ly, 'WHAT CHANGED FROM PLAN 1', 14, '#fff', 700); ly += 17;
['· Olympus is gone from Heaven (it is built in the', '   Mountains): Heaven keeps every plot, 20 of them', '· the Vatican is a real city plan: Basilica west,', '   Square east, the gate facing Disaster City', '· the Catacombs are their own room under it', '· Hell is one funnel: rim, terrace, bowl, lake;', '   its east side fell into a sea of lava', '· Heaven is one climb: stair, gate, fields, city', '· 14 districts, a landmark each; * = a label of mine'].forEach(s => { T(lx, ly, s, 11, '#d8d2c6'); ly += 14; });
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Ht}" viewBox="0 0 ${Wd} ${Ht}" font-family="DejaVu Sans, Arial, sans-serif">${o.join('')}</svg>`;
const svgPath = path.join(__dirname, 'heaven-hell-vatican_plot_plan_2.svg'); fs.writeFileSync(svgPath, svg);
(async () => {
    let pw; try { pw = require('playwright'); } catch (e) { try { pw = require('/opt/node-tools/node_modules/playwright'); } catch (e2) { console.log('no playwright: open the .svg in a browser and save a PNG'); return; } }
    let exe; try { exe = require('../../../probe-fast.js').EXE; } catch (e) {}   // the cloud's own Chromium (a fresh `npm i playwright` in the repo looks for a newer one)
    const b = await pw.chromium.launch(exe && fs.existsSync(exe) ? { executablePath: exe } : {}); const pg = await b.newPage({ viewport: { width: Wd, height: Ht } });
    await pg.setContent(`<body style="margin:0;background:#161815">${svg}</body>`); await pg.screenshot({ path: path.join(__dirname, 'heaven-hell-vatican_plot_plan_2.png') }); await b.close(); fs.unlinkSync(svgPath);
    console.log('written: the layout (2 copies) + heaven-hell-vatican_plot_plan_2.png  ' + Wd + ' x ' + Ht);
})();
