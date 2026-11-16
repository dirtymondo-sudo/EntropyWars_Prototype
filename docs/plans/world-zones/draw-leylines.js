/* LEYLINES, PLOT PLAN 2 (2026-11-16, the Leylines zone thread, second side) — mondo's order: the zones still on old rooms go on plots as a full
   REDESIGN, without waiting for his OK (docs/plans/ZONE_THREAD_BRIEF.md).
   `node docs/plans/world-zones/draw-leylines.js` writes:
     docs/plans/world-zones/leylines-layout-2.json   every plot (name, district, what stands on it, the old place it comes from) + the square map
     docs/areas/leylines/layout.json                 the same file: the one bake-leylines.js reads
     docs/plans/world-zones/leylines_plot_plan_2.png the picture (an SVG shot with playwright; without playwright the .svg stays)
   Plan 1 (9 x 5, leylines-layout.json + leylines_plot_plan.png) stays beside it as history.
   WHAT CHANGED FROM PLAN 1: 9 x 7 plots (63; 378 x 294 m), so every landmark stands at about its real size; ONE dead-straight glowing line
   through the middle row with a fork to every landmark's heart; the dry sites (Babel, Gobekli Tepe) in the west by the Desert's Giza, the
   green ones east; Technoticlan is an island city in a lake (what the real one was), walked to over causeways; Babel's tower has a square
   84 m foot and four tiers 28 m up; Stonehenge's bank and ditch are a hundred metres across.
   Squares: x 0..108 west to east, y 0..84 north to south, 3.5 m each; a plot is 12 x 12 squares.
   The square map's letters (LEGEND) drive the ground paint, the water and this picture; what stands on the squares is the district files'. */
'use strict';
const fs = require('fs'), path = require('path');
const REPO = path.join(__dirname, '..', '..', '..');
const N = 12, GX = 9, GY = 7, W = GX * N, H = GY * N;
const DIST = {
    G: { name: 'Göbekli Tepe', col: '#b98a55', file: 'G.js' },
    B: { name: 'Bug Colony', col: '#d4b12c', file: 'B.js' },
    S: { name: 'Stonehenge', col: '#6f9a70', file: 'S.js' },
    Y: { name: 'The Ley Line', col: '#f0c040', file: 'Y.js' },
    T: { name: 'Babel', col: '#b5673c', file: 'T.js' },
    Z: { name: 'Technoticlan', col: '#3fa8a0', file: 'Z.js' },
};
const LEGEND = { g: 'grass', d: 'dry earth', s: 'sand', p: 'dirt path', c: 'chalk', o: 'stone paving', k: 'mud brick', w: 'water (waded)', G: 'the ley line (glows)', f: 'a fork of the line',
    m: 'the mound / a barrow / the anthill (earth)', h: 'wax + honey', F: 'flowers', T: 'tall grass', b: 'bridge / deck', t: 'a tier (built stone or brick)', r: 'reeds + garden islets' };
const COL = { g: '#5d9148', d: '#b89a68', s: '#dcc48c', p: '#9a7a52', c: '#e6e2d2', o: '#9a9a94', k: '#a8623a', w: '#3c78b8', G: '#ffd24a', f: '#f0b83a', m: '#8a6a44', h: '#e8b838', F: '#c8486a', T: '#2f6a3a', b: '#b89060', t: '#6e4a36', r: '#6aa05a' };
/* THE ANCHORS: the middle of every landmark, in squares (a district file reads these from the layout, never its own copy) */
const A = {
    line: { y0: 41, y1: 43 },                                         // the Great Line: squares y 41 and 42, wall to wall
    nexus: { x: 54, y: 42 },
    mound: { x: 17.5, y: 16.5, flat: 10, foot: 15.5, h: 5.25 },       // Gobekli Tepe: the tell (a flat-topped hill)
    enclosures: [[13, 12, 'A'], [21, 12, 'B'], [13, 20, 'C'], [21, 20, 'D']],   // each a 5 x 5 square ring round this square
    sentinel: { x: 31, y: 5 }, cistern: { x: 31, y: 20 }, doorway: { x: 5, y: 31 }, dig: [[2, 3, 9, 5], [2, 8, 9, 10]],
    anthill: { x: 54, y: 12, r: 8, h: 7 }, hive: { x: 42, y: 8 }, comb: { x: 42, y: 22 }, flowers: [62, 2, 71, 13], tallgrass: [61, 17, 71, 31], beeyard: [38, 29, 47, 34],
    henge: { x: 92, y: 18, stones: 5.5, bank: 11.5, ditch: 13.5 },    // the circle's middle is a corner where four squares meet
    longbarrow: [73, 2, 81, 5], barrows: [[74, 13], [75, 23], [77, 31]], camp: { x: 102, y: 31 }, heel: { x: 101, y: 8 },
    tower: { x: 24, y: 66, tiers: [24, 18, 12, 6], step: 7 },         // Babel: square tiers (squares a side), 7 m a tier
    kiln: { x: 5, y: 64 }, stacks: [2, 50, 9, 57], pits: [2, 73, 9, 80], town: [38, 58, 46, 80], crane: { x: 41, y: 52 },
    island: [62, 53, 105, 81], pyramid: { x: 95, y: 67, tiers: [16, 12, 8, 4], step: 4.5 }, court: [63, 55, 73, 62], canal: { x0: 74, x1: 76 }, plaza: [77, 60, 86, 74],
    observatory: { x: 67, y: 75 }, chinampas: [[50, 50], [55, 51], [51, 56], [56, 57], [52, 61]],
    forks: { gobekli: [17, 19], anthill: [53, 55], henge: [91, 93], babel: [23, 25], causeway: [80, 82] },   // x0..x1 (the end is exclusive)
};
const cell = []; for (let y = 0; y < H; y++) { const r = []; for (let x = 0; x < W; x++) r.push(y < 36 ? (x < 36 ? 'd' : 'g') : y < 48 ? (x < 30 ? 'd' : 'g') : (x < 48 ? 's' : 'g')); cell.push(r); }
const set = (x, y, ch) => { if (x >= 0 && y >= 0 && x < W && y < H) cell[y][x] = ch; };
const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, ch); };
const disc = (cx, cy, r, ch, keep) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r && (!keep || keep(x, y))) set(x, y, ch); };
const ring = (cx, cy, r0, r1, ch, skip) => { for (let y = Math.floor(cy - r1); y <= cy + r1; y++) for (let x = Math.floor(cx - r1); x <= cx + r1; x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d >= r0 && d <= r1 && !(skip && skip(x, y))) set(x, y, ch); } };
/* a dry west that turns green going east: ragged, not a ruler line */
for (let y = 0; y < 48; y++) for (let x = 28; x < 40; x++) { const edge = (y < 36 ? 36 : 30) + Math.round(2.2 * Math.sin(y * 0.9) + 1.4 * Math.sin(y * 0.37 + 1)); set(x, y, x < edge ? 'd' : 'g'); }
for (let y = 48; y < H; y++) for (let x = 44; x < 52; x++) { const edge = 48 + Math.round(1.6 * Math.sin(y * 0.7)); set(x, y, x < edge ? 's' : 'g'); }

/* ── G · GOBEKLI TEPE ── */
disc(A.mound.x, A.mound.y, A.mound.foot, 'm');
A.enclosures.forEach(e => disc(e[0] + 0.5, e[1] + 0.5, 2.9, 'o'));
rect(16, 9, 19, 24, 'p'); rect(10, 15, 25, 18, 'p');                         // the cross walk between the four rings
A.dig.forEach(q => rect(q[0], q[1], q[2], q[3], 'p'));
rect(3, 14, 9, 22, 'p');                                                      // the dig camp's yard
rect(4, 22, 6, 36, 'p'); rect(6, 16, 10, 18, 'p');                            // the First Doorway's track up to the camp and the mound
rect(26, 16, 31, 18, 'p'); rect(30, 6, 32, 20, 'p');                          // east to the cistern, north to the Sentinel
/* ── B · BUG COLONY ── */
disc(A.anthill.x, A.anthill.y, A.anthill.r, 'm');
rect(A.flowers[0], A.flowers[1], A.flowers[2], A.flowers[3], 'F'); rect(A.tallgrass[0], A.tallgrass[1], A.tallgrass[2], A.tallgrass[3], 'T');
rect(64, 17, 66, 31, 'p'); rect(61, 23, 71, 25, 'p');                         // the two tracks cut through the tall grass
disc(A.hive.x + 0.5, A.hive.y + 0.5, 3.4, 'h'); disc(A.comb.x + 0.5, A.comb.y + 0.5, 4.4, 'h');
rect(41, 11, 44, 18, 'p'); rect(44, 12, 47, 14, 'p');                         // hive > honeycomb, hive > anthill
rect(A.beeyard[0], A.beeyard[1], A.beeyard[2], A.beeyard[3], 'p');
rect(41, 26, 44, 29, 'p'); rect(47, 30, 53, 32, 'p');
rect(56, 20, 58, 26, 'p'); rect(56, 24, 62, 26, 'p'); rect(61, 6, 63, 8, 'p'); rect(58, 6, 62, 8, 'p');   // the ant roads
/* ── S · STONEHENGE ── */
{ const h = A.henge, gapNE = (x, y) => (x + 0.5 - h.x) > 6 && (y + 0.5 - h.y) < -6 && Math.abs((x + 0.5 - h.x) + (y + 0.5 - h.y)) < 2.6, gapS = (x, y) => x >= 90 && x < 94 && y > h.y;
  ring(h.x, h.y, h.ditch - 0.9, h.ditch + 0.6, 'p', (x, y) => gapNE(x, y) || gapS(x, y)); ring(h.x, h.y, h.bank - 0.9, h.bank + 0.6, 'c', (x, y) => gapNE(x, y) || gapS(x, y));
  for (let i = 0; i < 12; i++) { set(97 + i, 12 - i, 'c'); set(98 + i, 12 - i, 'c'); set(96 + i, 12 - i, 'c'); }      // THE AVENUE: north-east from the circle to the corner
  rect(105, 0, 108, 3, 'c');
  rect(A.longbarrow[0], A.longbarrow[1], A.longbarrow[2], A.longbarrow[3], 'm'); A.barrows.forEach(b => disc(b[0] + 0.5, b[1] + 0.5, 2.3, 'm'));
  rect(82, 3, 84, 5, 'p'); rect(74, 5, 76, 36, 'p'); rect(76, 34, 91, 36, 'p');                                   // the barrow track
  rect(99, 29, 105, 34, 'p'); rect(93, 33, 99, 35, 'p'); }
/* ── T · BABEL ── */
{ const t = A.tower, b = t.tiers[0] / 2; rect(t.x - b - 2, t.y - b - 2, t.x + b + 2, t.y + b + 2, 'k'); t.tiers.forEach(n => rect(t.x - n / 2, t.y - n / 2, t.x + n / 2, t.y + n / 2, 't'));
  for (let i = 1; i < t.tiers.length; i++) { const n = t.tiers[i - 1] / 2, m = t.tiers[i] / 2; rect(t.x - m, t.y - m, t.x + m, t.y + m, i % 2 ? 'k' : 't'); }
  rect(A.stacks[0], A.stacks[1], A.stacks[2], A.stacks[3], 'k'); disc(A.kiln.x + 0.5, A.kiln.y + 0.5, 2.9, 'k'); rect(A.pits[0], A.pits[1], A.pits[2], A.pits[3], 'p');
  rect(4, 57, 6, 73, 'p'); rect(6, 65, 10, 67, 'p');                                                              // stacks > kiln > pits, kiln > tower
  rect(41, 48, 43, 84, 'p'); rect(38, 65, 41, 67, 'k'); rect(43, 65, 48, 67, 'o');                                // the town's street, north to the line and south to the barn door
  rect(38, 50, 46, 55, 'k'); }
/* ── Z · TECHNOTICLAN ── */
{ rect(49, 49, 108, 84, 'w'); const I = A.island; rect(I[0], I[1], I[2], I[3], 'o');
  rect(48, 48, 50, 84, 'g'); for (let y = 48; y < 84; y++) if (Math.sin(y * 0.8) > 0.2) set(50, y, 'r');           // the west shore, reeds
  rect(50, 48, 108, 49, 'g'); rect(48, 66, I[0], 68, 'o');                                                         // THE CAUSEWAY (west), on the tower's own axis
  rect(A.forks.causeway[0], 48, A.forks.causeway[1], I[1], 'o'); rect(80, I[3], 82, 84, 'o');                      // the north causeway, the south causeway to the Portcullis
  rect(A.canal.x0, 49, A.canal.x1, 84, 'w'); rect(A.canal.x0, 66, A.canal.x1, 68, 'b'); rect(A.canal.x0, 58, A.canal.x1, 59, 'b'); rect(A.canal.x0, 76, A.canal.x1, 77, 'b');
  const p = A.pyramid; p.tiers.forEach((n, i) => rect(p.x - n / 2, p.y - n / 2, p.x + n / 2, p.y + n / 2, i % 2 ? 'o' : 't'));
  rect(A.court[0], A.court[1], A.court[2], A.court[3], 't'); rect(A.court[0] + 1, A.court[1] + 2, A.court[2] - 1, A.court[3] - 2, 'F');
  disc(A.observatory.x + 0.5, A.observatory.y + 0.5, 2.6, 't');
  A.chinampas.forEach(c => { rect(c[0], c[1], c[0] + 3, c[1] + 2, 'r'); }); rect(50, 53, 62, 54, 'b'); rect(53, 54, 54, 66, 'b');                 // the garden islets + the plank walks to them
  rect(104, 53, 105, 81, 'o'); }
/* ── Y · THE LEY LINE: laid last, over everything ── */
rect(0, 40, W, 44, 'o'); rect(0, A.line.y0, W, A.line.y1, 'G');
{ const f = A.forks; rect(f.gobekli[0], 24, f.gobekli[1], 40, 'f'); rect(f.anthill[0], 20, f.anthill[1], 40, 'f'); rect(f.henge[0], 24, f.henge[1], 40, 'f'); rect(f.henge[0], 18, f.henge[1], 24, 'c');
  rect(f.babel[0], 44, f.babel[1], 52, 'f'); rect(f.causeway[0], 44, f.causeway[1], 48, 'f'); disc(A.nexus.x, A.nexus.y, 4.2, 'o'); rect(A.nexus.x - 4, A.line.y0, A.nexus.x + 4, A.line.y1, 'G'); rect(f.anthill[0], 38, f.anthill[1], 46, 'G'); }

/* ── THE PLOTS: name, what stands there, the old place it comes from ("(label mine)" = a plain label, no old name) ── */
const M = ' (label mine)';
const PL = [
    /* row 0 */ ['G', 'The Dig', 'two trenches, tarps, tools', 'Göbekli Tepe: THE DIG'], ['G', 'The Mound', 'the north side of the tell', 'Göbekli Tepe: THE MOUND'], ['G', 'The Sentinel', 'one pillar apart from the rest, on its knoll', 'Göbekli Tepe: THE SENTINEL'],
    ['B', 'The Hive' + M, 'a hive the size of a house', 'NEW (mondo\'s zone list: Bug Colony)'], ['B', 'The Anthill' + M, 'LANDMARK: the hill, 7 m', 'NEW'], ['B', 'The Flower Field' + M, 'flowers taller than you', 'NEW'],
    ['S', 'The Long Barrow', 'the long mound and its stone doorway', 'Stonehenge: the long barrow (the old draught down the line)'], ['S', 'The Bank', 'the chalk bank\'s north side', 'Stonehenge: THE BANK'], ['S', 'The Avenue', 'the chalk avenue to the north-east, the Heel Stone', 'Stonehenge: THE AVENUE'],
    /* row 1 */ ['G', 'The Dig Camp' + M, 'tents, crates, the finds table', 'Göbekli Tepe: the dig\'s camp'], ['G', 'The Four Enclosures', 'LANDMARK: four rings of T-pillars on the tell', 'Göbekli Tepe: FOUR ENCLOSURES · THE T-PILLARS'], ['G', 'The Cistern', 'the oldest well there is', 'Göbekli Tepe: THE CISTERN'],
    ['B', 'The Honeycomb' + M, 'wax cells you walk between', 'NEW'], ['B', 'The Ant Tunnels' + M, 'the ways into the hill', 'NEW'], ['B', 'The Tall Grass' + M, 'grass over your head, two tracks through it', 'NEW'],
    ['S', 'The Barrows', 'round burial mounds', 'Stonehenge: THE BARROWS'], ['S', 'The Sarsen Circle', 'LANDMARK: the circle, the trilithons, the altar', 'Stonehenge: THE SARSEN CIRCLE · THE TRILITHONS'], ['S', 'The Ditch', 'the ditch\'s east side', 'Stonehenge: THE DITCH'],
    /* row 2 */ ['G', 'The First Doorway', 'a stone doorway with no wall (Room 9600\'s door)', 'Göbekli Tepe: THE FIRST DOORWAY'], ['G', 'The T-Pillars', 'the south rings, the fork down to the line', 'Göbekli Tepe: THE T-PILLARS'], ['G', 'The Dry Slope' + M, 'dry trees, loose stones', 'Göbekli Tepe: the tell\'s east flank'],
    ['B', 'The Bee Yard' + M, 'hive boxes in rows', 'NEW'], ['B', 'The Ant Road' + M, 'the fork from the line to the hill', 'NEW'], ['B', 'The Meadow' + M, 'open grass, butterflies', 'NEW'],
    ['S', 'The Plain', 'open grass, a barrow, sheep', 'Stonehenge: THE PLAIN'], ['S', 'The South Gate' + M, 'the fork up from the line, Room 56\'s frame', 'Stonehenge: the bay door'], ['S', 'The Solstice Camp' + M, 'a fire, drums, a guitar', 'Stonehenge: the camp by the stones'],
    /* row 3 */ ['Y', 'The West Mouth', 'the line comes in from the Desert: the robbers\' tunnel', 'Ley Lines: THE WEST MOUTH + THE SOUTH MOUTH'], ['Y', 'The Niches', 'stone niches either side of the line', 'Ley Lines: THE NICHES'], ['Y', 'The Forks', 'the forks to the tell and the tower', 'Ley Lines: THE FORKS · THE FIRST MOUTH'],
    ['Y', 'The Great Line', 'the line, dead straight', 'Ley Lines: THE GREAT LINE'], ['Y', 'The Nexus', 'LANDMARK: where the lines cross; the Healing Zone', 'Ley Lines: THE NEXUS'], ['Y', 'The Great Line, east', 'the line, dead straight', 'Ley Lines: THE GREAT LINE'],
    ['Y', 'The Forks, east', 'the fork to the temple city', 'Ley Lines: THE FORKS'], ['Y', 'The Niches, east', 'niches; the fork to the stones', 'Ley Lines: THE NICHES'], ['Y', 'The East Mouth', 'the line runs on into the sea', 'Ley Lines: THE EAST MOUTH'],
    /* row 4 */ ['T', 'The Brick Stacks', 'bricks stacked to dry', 'Babel: THE BRICK STACKS'], ['T', 'The Tower, north-west', 'the first tier\'s corner', 'Babel: THE FOUR TIERS'], ['T', 'The North Stair', 'the fork from the line, the first flight, the Foundation Shaft', 'Babel: THE SPIRAL · THE FOUNDATION SHAFT'], ['T', 'The Crane', 'the scaffold crane and its yard', 'Babel: THE CRANE'],
    ['Z', 'The Garden Islets' + M, 'floating gardens on plank walks', 'NEW (the real city\'s chinampas)'], ['Z', 'The Ball Court', 'the court, its two hoops; the tunnel under its west wall', 'Technoticlan: THE BALL COURT · XIBALBA'], ['Z', 'The North Causeway' + M, 'the fork from the line over the lake', 'Technoticlan: THE OTHER STAIR · the ley terrace'], ['Z', 'The Pyramid, north', 'the pyramid\'s north side', 'Technoticlan: THE PYRAMID'], ['Z', 'The Lake' + M, 'open water', 'NEW'],
    /* row 5 */ ['T', 'The Kiln', 'the kiln and its chimney', 'Babel: THE KILN'], ['T', 'The Tower', 'LANDMARK: four tiers, 28 m, the unfinished top', 'Babel: THE FOUR TIERS · THE UNFINISHED TOP'], ['T', 'The Tower, east', 'the east flight', 'Babel: THE SPIRAL'], ['T', 'The Workers\' Town' + M, 'the brick houses along the street', 'Babel: the brick houses'],
    ['Z', 'The Causeway', 'the stone causeway over the lake, on the tower\'s axis', 'Technoticlan: THE CAUSEWAY'], ['Z', 'The West Gate' + M, 'where the causeway lands', 'Technoticlan: THE CAUSEWAY'], ['Z', 'The Canal', 'the canal through the city, three bridges, the plaza', 'Technoticlan: THE CANAL'], ['Z', 'The Pyramid', 'LANDMARK: four tiers, 18 m, the great stair', 'Technoticlan: THE PYRAMID'], ['Z', 'The Pyramid, east', 'the back of the pyramid', 'Technoticlan: THE PYRAMID'],
    /* row 6 */ ['T', 'The Clay Pits', 'pits dug for the brick clay', 'Babel: the clay pits'], ['T', 'The Tower, south-west', 'the first tier\'s corner', 'Babel: THE FOUR TIERS'], ['T', 'The South Face' + M, 'the south flight', 'Babel: THE SPIRAL'], ['T', 'The Barn Door' + M, 'the street\'s end: Room 11\'s scaffold-plank door', 'Babel: the bay door'],
    ['Z', 'The Reeds' + M, 'the lake\'s west shore', 'NEW'], ['Z', 'The Round Tower' + M, 'the round tower Venus is watched from', 'Technoticlan: the round tower'], ['Z', 'The Portcullis', 'the south causeway to Room 2012\'s gate', 'Technoticlan: the bay door'], ['Z', 'The Pyramid, south', 'the pyramid\'s south side', 'Technoticlan: THE PYRAMID'], ['Z', 'The Lake, south' + M, 'open water', 'NEW'],
];
/* the rows are 9 wide; rows 4..6 are written 4 + 5 */
const plots = PL.map((p, i) => { const x = i % GX, y = Math.floor(i / GX); return { id: 'P' + String(x).padStart(2, '0') + '-' + String(y).padStart(2, '0'), name: p[1], district: DIST[p[0]].name, d: p[0], what: p[2], from: p[3] }; });
const WAYS = [
    { at: [0, 41.5], kind: 'hidden', label: 'The Desert: Giza (robbers\' tunnel)' }, { at: [5, 31], kind: 'bay', label: 'Room 9600' }, { at: [93, 33], kind: 'bay', label: 'Room 56' },
    { at: [42, 83.5], kind: 'bay', label: 'Room 11' }, { at: [81, 83.5], kind: 'bay', label: 'Room 2012' }, { at: [63, 58.5], kind: 'hidden', label: 'Agartha (the Cavern)' } ];
const layout = { area: 'Leylines', version: 'plan-2', squareMeters: 3.5, plotCells: N, cols: GX, rows: GY, districts: Object.fromEntries(Object.keys(DIST).map(k => [k, DIST[k].name])), anchors: A, ways: WAYS, legend: LEGEND,
    rooms: [{ room: 'Leylines', cols: GX, rows: GY, plots, cells: cell.map(r => r.join('')) }] };
const json = JSON.stringify(layout, null, 1).replace(/\n {3,}/g, ' ').replace(/\n {2}\]/g, ' ]').replace(/\n {2}\}/g, ' }');
fs.writeFileSync(path.join(__dirname, 'leylines-layout-2.json'), json); fs.mkdirSync(path.join(REPO, 'docs/areas/leylines/districts'), { recursive: true }); fs.writeFileSync(path.join(REPO, 'docs/areas/leylines/layout.json'), json);

/* ── the picture ── */
const S = 15, OX = 40, OY = 96, PW = N * S, esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
let svg = '';
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) svg += `<rect x="${OX + x * S}" y="${OY + y * S}" width="${S + 0.5}" height="${S + 0.5}" fill="${COL[cell[y][x]]}"/>`;
/* the landmarks' outlines */
const circ = (cx, cy, r, c, w, f) => { svg += `<circle cx="${OX + cx * S}" cy="${OY + cy * S}" r="${r * S}" fill="${f || 'none'}" stroke="${c}" stroke-width="${w}"/>`; };
circ(A.henge.x, A.henge.y, A.henge.stones, '#30343a', 5); circ(A.henge.x, A.henge.y, 2.6, '#30343a', 4);
A.enclosures.forEach(e => circ(e[0] + 0.5, e[1] + 0.5, 2.2, '#3a2c20', 3)); circ(A.sentinel.x + 0.5, A.sentinel.y + 0.5, 0.5, '#3a2c20', 3, '#e8e0d0');
circ(A.anthill.x, A.anthill.y, 1.5, '#2a1c10', 2, '#2a1c10'); circ(A.hive.x + 0.5, A.hive.y + 0.5, 2, '#7a5a10', 3, '#f0c848');
for (let gx = 0; gx <= GX; gx++) svg += `<line x1="${OX + gx * PW}" y1="${OY}" x2="${OX + gx * PW}" y2="${OY + H * S}" stroke="#101010" stroke-width="1" opacity="0.55"/>`;
for (let gy = 0; gy <= GY; gy++) svg += `<line x1="${OX}" y1="${OY + gy * PW}" x2="${OX + W * S}" y2="${OY + gy * PW}" stroke="#101010" stroke-width="1" opacity="0.55"/>`;
/* the districts' borders */
const dAt = (x, y) => (x < 0 || y < 0 || x >= GX || y >= GY) ? null : plots[y * GX + x].d;
for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) { const d = dAt(x, y), X = OX + x * PW, Y = OY + y * PW, L = (a, b, c, e) => { svg += `<line x1="${a}" y1="${b}" x2="${c}" y2="${e}" stroke="#ffffff" stroke-width="4"/>`; };
    if (dAt(x - 1, y) !== d) L(X, Y, X, Y + PW); if (dAt(x + 1, y) !== d) L(X + PW, Y, X + PW, Y + PW); if (dAt(x, y - 1) !== d) L(X, Y, X + PW, Y); if (dAt(x, y + 1) !== d) L(X, Y + PW, X + PW, Y + PW); }
plots.forEach((p, i) => { const x = i % GX, y = Math.floor(i / GX), X = OX + x * PW + 5, Y = OY + y * PW + 16, nm = p.name.replace(M, '*');
    svg += `<text x="${X}" y="${Y}" font-size="13" font-weight="700" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">${esc(nm)}</text><text x="${X}" y="${Y + 13}" font-size="9.5" fill="#f4e7a0" stroke="#000" stroke-width="2.5" paint-order="stroke">${p.id} · ${p.d}</text>`; });
const WC = { hidden: '#ff78d0', bay: '#ffc848' };
WAYS.forEach(w => { const X = OX + w.at[0] * S, Y = OY + w.at[1] * S; svg += `<circle cx="${X}" cy="${Y}" r="8" fill="${WC[w.kind]}" stroke="#000" stroke-width="2"/><text x="${Math.min(X + 12, OX + W * S - 200)}" y="${Y - 10}" font-size="12" font-weight="700" fill="${WC[w.kind]}" stroke="#000" stroke-width="3" paint-order="stroke">${esc(w.label)}</text>`; });
const RX = OX + W * S + 30; let ry = OY + 10; const T = (s, sz, c, b) => { svg += `<text x="${RX}" y="${ry}" font-size="${sz}" fill="${c || '#ddd'}" font-weight="${b ? 700 : 400}">${esc(s)}</text>`; ry += sz + 7; };
T('DISTRICTS (one file each)', 15, '#fff', 1); Object.keys(DIST).forEach(k => { svg += `<rect x="${RX}" y="${ry - 11}" width="14" height="14" fill="${DIST[k].col}" stroke="#fff"/>`; svg += `<text x="${RX + 22}" y="${ry}" font-size="13" fill="#ddd">${k} · ${esc(DIST[k].name)} (${plots.filter(p => p.d === k).length} plots)</text>`; ry += 20; });
ry += 10; T('GROUND', 15, '#fff', 1); Object.keys(LEGEND).forEach(k => { svg += `<rect x="${RX}" y="${ry - 11}" width="14" height="14" fill="${COL[k]}" stroke="#fff"/>`; svg += `<text x="${RX + 22}" y="${ry}" font-size="12.5" fill="#ddd">${esc(LEGEND[k])}</text>`; ry += 19; });
ry += 10; T('WAYS', 15, '#fff', 1); [['bay', 'a DOOR HQ room\'s door (exists today, moved)'], ['hidden', 'hidden way to another zone (exists today)']].forEach(q => { svg += `<circle cx="${RX + 7}" cy="${ry - 4}" r="7" fill="${WC[q[0]]}" stroke="#000"/>`; svg += `<text x="${RX + 22}" y="${ry}" font-size="12.5" fill="#ddd">${esc(q[1])}</text>`; ry += 19; });
ry += 10; T('LANDMARKS (one a district)', 15, '#fff', 1);
['the four rings of T-pillars on the tell', 'the Anthill, 7 m', 'the Sarsen Circle in its bank and ditch', 'the Nexus on the line', 'the Tower: 84 m foot, four tiers, 28 m', 'the Pyramid on its island: 56 m foot, 18 m'].forEach(s => T('· ' + s, 12.5));
ry += 10; T('* = a plain label of mine (no old name)', 12, '#bbb'); T('The line does not bend. Every landmark', 12, '#bbb'); T('stands on a fork of it.', 12, '#bbb');
const WPX = RX + 330, HPX = OY + H * S + 40;
svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WPX}" height="${HPX}" font-family="DejaVu Sans, Arial, sans-serif"><rect width="100%" height="100%" fill="#181a18"/>` +
    `<text x="${OX}" y="38" font-size="24" font-weight="700" fill="#fff">LEYLINES · plot plan 2 (the redesign) · 9 x 7 plots, 63 in all, 378 x 294 m · one plot = 12 x 12 squares of 3.5 m</text>` +
    `<text x="${OX}" y="64" font-size="14" fill="#bbb">North is up; the Desert's Giza is over the west edge, the sea on the other three sides. The world's oldest sites on one glowing line that does not bend.</text>` + svg + '</svg>';
const svgFile = path.join(__dirname, 'leylines_plot_plan_2.svg'); fs.writeFileSync(svgFile, svg);
(async () => { let pw; try { pw = require('playwright'); } catch (e) { console.log('no playwright: the .svg stays'); return; }
    const b = await pw.chromium.launch(), pg = await b.newPage({ viewport: { width: WPX, height: HPX } }); await pg.setContent(svg); await pg.screenshot({ path: path.join(__dirname, 'leylines_plot_plan_2.png') }); await b.close(); fs.unlinkSync(svgFile); console.log('leylines_plot_plan_2.png written'); })();
