#!/usr/bin/env node
/* make-cavern.js — THE CAVERN, PLOT PLAN 2 (2026-11-16, the Cavern zone thread; mondo's order: the eight old zones redesigned on plots).
   Writes docs/areas/cavern/layout.json: 6 x 6 plots of 12 x 12 squares (252 x 252 m), three districts:
     K THE CAVERN (13 plots)   the dark cave under the crust: a loop over three tiers (levels 4 / 8 / 12), the hot side, the gaol
     H HOLLOW EARTH (11)       the country under the crust, open under the Inner Sun (levels 0 / 1 / 2)
     A AGARTHA (12)            the crystal city on terraces round the Spire (levels 0 / 2 / 4)
   `node docs/plans/world-zones/make-cavern.js` rewrites the layout (the same dice every run); draw-cavern.js draws it.
   THE SQUARE MAP: x rock · o cave floor · h hot rock (obsidian) · f cut floor (Level −6) · u gaol floor · c crystal floor · w water · l lava ·
   b plank / rope bridge / jetty · g grass · d dirt path · s sand · m marble · q crystal paving.
   After the first build a district thread changes its own squares in its district file's `plan()`, not here. */
'use strict';
const fs = require('fs'), path = require('path');
const N = 12, GX = 6, GY = 6, W = N * GX, H = N * GY;
let seed = 20261116; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const cell = []; for (let y = 0; y < H; y++) cell.push(new Array(W).fill('x'));
const id = (x, y) => 'P0' + x + '-0' + y;

/* id, name, district, level, what, from */
const PLOTS = [
  [0, 0, 'The Fissure', 'K', 8, 'the hot gallery\'s end: lava through a crack; the way to Hell', 'The Cave: THE FISSURE (Room 666)'],
  [1, 0, 'The Hot Shelf', 'K', 8, 'the lava lake and the causeway across it', 'The Cavern: THE HOT SHELF'],
  [2, 0, 'The Spur', 'K', 8, 'a ledge over the lava chasm; THE ROPE BRIDGE', 'The Cavern: THE SPUR · THE ROPE BRIDGE'],
  [3, 0, 'Level −6', 'K', 12, 'rock cut square, a blast door in it: the way to the D.U.M.B.', 'The Cave: LEVEL −6 (Room 555)'],
  [4, 0, 'The High Tier', 'K', 12, 'the top of three tiers', 'The Cavern: THREE TIERS · THE HIGH TIER'],
  [5, 0, 'The Oubliette', 'K', 3, 'the dead end: the sunken cells, the old portcullis to the Sewers, the wall that moves', 'The Cave: THE OUBLIETTE'],
  [0, 1, 'The River Chamber', 'K', 4, 'the stream becomes a river and goes under the wall; the ford, the plank', 'The Cavern: THE RIVER CHAMBER'],
  [1, 1, 'The Long Ramp', 'K', 4, 'the long way down from the hot shelf', 'The Cavern: THE LONG RAMP'],
  [2, 1, 'The Crossroads', 'K', 4, 'LANDMARK: THE HALL and THE NEEDLE; the Healing Zone; the cellar well; you arrive here', 'The Cavern: THE CROSSROADS · THE HALL · THE NEEDLE'],
  [3, 1, 'The Terrace', 'K', 4, 'the pool and the fall', 'The Cavern: THE TERRACE (the pool, the fall)'],
  [4, 1, 'The Shelf', 'K', 8, 'the middle tier; the spring that feeds the fall', 'The Cavern: THE WEST SHELF'],
  [5, 1, 'The Crystal Adit', 'K', 4, 'a worked adit, squared and swept; THE CRYSTAL LEDGE; the warm light', 'The Cave: THE CRYSTAL ADIT (Room 88)'],
  [0, 2, 'The Crystal Forest', 'H', 2, 'crystals as tall as trees', 'Hollow Earth: THE CRYSTAL FOREST'],
  [1, 2, 'The Mushroom Shelf', 'H', 2, 'a shelf of mushrooms under THE OVERHANG', 'Hollow Earth: THE MUSHROOM SHELF · THE OVERHANG'],
  [2, 2, 'The Mouth', 'K', 4, 'where the cave opens on the country: THE LIP, THE CRUST LEDGE; the Estate\'s well', 'The Cave: THE MOUTH (Room 180) · Hollow Earth: THE CRUST LEDGE'],
  [3, 2, 'The Gallery', 'A', 4, 'the long gallery of the upper city', 'Agartha: THE GALLERY'],
  [4, 2, 'The Upper Terrace', 'A', 4, 'the high steps of the city; THE BALCONY', 'Agartha: THE UPPER TERRACE · THE BALCONY'],
  [5, 2, 'The Adit Terrace', 'A', 4, 'where the adit comes out', 'Agartha: THE ADIT TERRACE'],
  [0, 3, 'The Old Trees', 'H', 1, 'the oldest wood there is', 'Hollow Earth: THE OLD TREES'],
  [1, 3, 'The Giant\'s Steps', 'H', 1, 'steps cut for a longer leg; THE GIANT\'S SEAT', 'Hollow Earth: THE GIANT\'S STEPS · THE GIANT\'S SEAT'],
  [2, 3, 'The Country', 'H', 0, 'the foot of the long stair from the Mouth; open ground, big tracks', 'Hollow Earth: THE COUNTRY UNDER THE CRUST'],
  [3, 3, 'The Lower Terrace', 'A', 2, 'houses cut in crystal; the canal that pours into the lake', 'Agartha: THE LOWER TERRACE · THE TERRACES'],
  [4, 3, 'The Spire', 'A', 2, 'LANDMARK: the spire, lit from inside', 'Agartha: THE SPIRE'],
  [5, 3, 'The Lemuria Stair', 'A', 2, 'the stair up through the rock to Mount Shasta; the trail to the Woods', 'Agartha: the way to Mount Shasta'],
  [0, 4, 'The Hot Spring', 'H', 0, 'warm water under the old trees', 'Hollow Earth: THE HOT SPRING'],
  [1, 4, 'The Inner Sun', 'H', 0, 'LANDMARK: THE SUN on its spire over THE TERRACE; the altar faces it', 'Hollow Earth: THE SUN · THE TERRACE'],
  [2, 4, 'The Sunken Garden', 'H', 0, 'a garden a step down', 'Hollow Earth: THE SUNKEN GARDEN'],
  [3, 4, 'The Lake', 'A', 0, 'deep and very still', 'Agartha: THE LAKE'],
  [4, 4, 'The Plaza', 'A', 0, 'the open square under the Spire; the fountain', 'Agartha: THE PLAZA'],
  [5, 4, 'The East Gate', 'A', 0, 'the tunnel up to the ball court of Technoticlan', 'Agartha: the way to Technoticlan (label mine)'],
  [0, 5, 'The Nesting Ground', 'H', 0, 'eggs, bones, big tracks', 'new plot (label mine): where the dinosaurs live'],
  [1, 5, 'The Jetty', 'H', 0, 'THE LAKE of the country and THE JETTY out on it', 'Hollow Earth: THE LAKE · THE JETTY'],
  [2, 5, 'The Polar Opening', 'H', 0, 'the crack the admiral flew through; Bay 3\'s frame', 'Hollow Earth: the polar opening · the bay door'],
  [3, 5, 'The Pier', 'A', 0, 'the lake\'s south shore and THE PIER', 'Agartha: THE PIER'],
  [4, 5, 'The Inner Gate', 'A', 0, 'the gate polished by a very long queue: the bay door', 'Agartha: the inner gate (the bay door)'],
  [5, 5, 'The Admiral\'s Tunnel', 'A', 0, 'the tunnel up to the ice', 'Agartha: the way to Antarctica (label mine)'],
].map(r => ({ id: id(r[0], r[1]), x: r[0], y: r[1], name: r[2], d: r[3], level: r[4], what: r[5], from: r[6], sx: r[0] * N, sy: r[1] * N }));
const plot = {}; PLOTS.forEach(p => { plot[p.id] = p; });
const at = (x, y) => (x >= 0 && y >= 0 && x < GX && y < GY) ? plot[id(x, y)] : null;

/* the openings: where two plots of different levels join (the tool builds the stair, the climb or the fall) */
const OPENINGS = [
  ['P01-00', 'P01-01', 'stair', 'THE LONG RAMP: down from the hot shelf'],
  ['P02-00', 'P03-00', 'stair', 'up from the Spur to the blast door'],
  ['P04-00', 'P04-01', 'stair', 'the Shelf up to the High Tier'],
  ['P04-01', 'P03-01', 'fall', 'THE FALL: the Shelf\'s spring pours into the Terrace\'s pool', 'stair'],
  ['P04-01', 'P05-01', 'stair', 'down from the Shelf into the Crystal Adit'],
  ['P05-01', 'P05-00', 'stair', 'a step down into the Oubliette ("no doors on the cells. A step.")'],
  ['P02-02', 'P02-03', 'stair', 'THE LONG STAIR: from the Lip down into the country'],
  ['P00-02', 'P00-03', 'stair', 'down from the Crystal Forest'],
  ['P01-02', 'P01-03', 'stair', 'THE GIANT\'S STEPS, the upper flight'],
  ['P01-03', 'P01-04', 'stair', 'THE GIANT\'S STEPS, the lower flight'],
  ['P01-03', 'P02-03', 'stair', 'the Steps\' east foot'],
  ['P00-03', 'P00-04', 'fall', 'the old trees\' brook pours into the Hot Spring', 'stair'],
  ['P02-03', 'P03-03', 'stair', 'the country\'s stair up into the city'],
  ['P03-02', 'P03-03', 'stair', 'the Gallery\'s stair'],
  ['P04-02', 'P04-03', 'stair', 'the Upper Terrace\'s stair down to the Spire'],
  ['P05-02', 'P05-03', 'stair', 'down from the Adit Terrace'],
  ['P03-03', 'P03-04', 'fall', 'the canal pours into the Lake', 'stair'],
  ['P04-03', 'P04-04', 'stair', 'the Spire\'s stair down to the Plaza'],
  ['P05-03', 'P05-04', 'stair', 'down to the East Gate'],
].map(o => Object.assign({ a: o[0], b: o[1], kind: o[2], name: o[3] }, o[4] ? { by: o[4] } : {}));
/* same-level ways through rock (a K plot is solid until carved; the open districts share their whole line) */
const JOINS = [['P00-00', 'P01-00'], ['P01-00', 'P02-00'], ['P03-00', 'P04-00'], ['P00-01', 'P01-01'], ['P01-01', 'P02-01'], ['P02-01', 'P03-01'],
  ['P02-01', 'P02-02'], ['P05-01', 'P05-02'], ['P02-05', 'P03-05']];

/* ── carving, in a plot's own squares (lx, ly 0..11) ── */
const set = (p, lx, ly, ch, only) => { if (lx < 0 || ly < 0 || lx >= N || ly >= N) return; const X = p.sx + lx, Y = p.sy + ly; if (only && !only.includes(cell[Y][X])) return; cell[Y][X] = ch; };
const rect = (p, x0, y0, x1, y1, ch, only) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(p, x, y, ch, only); };
const blob = (p, cx, cy, rx, ry, ch, only) => { for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy < 1 + (rnd() - 0.5) * 0.4) set(p, x, y, ch, only); } };
const line = (p, x0, y0, x1, y1, w, ch, only) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1; for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) set(p, x + a - (w >> 1), y + b - (w >> 1), ch, only); } };
const FLOOR = { K: 'o', H: 'g', A: 'm' };
/* a port: three squares wide (5, 6, 7) through the line between two plots, `deep` squares into each, then on to each plot's middle */
function port(a, b, deepA, deepB) {
  const ns = a.x === b.x, first = ns ? (a.y < b.y ? a : b) : (a.x < b.x ? a : b), second = first === a ? b : a;
  for (const [p, deep, far] of [[first, first === a ? deepA : deepB, true], [second, second === a ? deepA : deepB, false]]) {
    const fl = p.floorCh || FLOOR[p.d];
    for (let k = 0; k < deep; k++) for (let m = 5; m <= 7; m++) { const t = far ? N - 1 - k : k; if (ns) set(p, m, t, fl, 'x'); else set(p, t, m, fl, 'x'); }
    const t = far ? N - 1 - deep : deep; if (ns) line(p, 6, t, p.cx || 6, p.cy || 6, 3, fl, 'x'); else line(p, t, 6, p.cx || 6, p.cy || 6, 3, fl, 'x');
  }
}

/* ── the open districts first: ground everywhere, rock on the room's edge and on a line to another district ── */
PLOTS.forEach(p => { if (p.d === 'K') return; rect(p, 0, 0, N - 1, N - 1, FLOOR[p.d]);
  [[0, -1, 'n'], [0, 1, 's'], [-1, 0, 'w'], [1, 0, 'e']].forEach(([dx, dy, side]) => { const q = at(p.x + dx, p.y + dy); if (q && q.d === p.d) return;
    for (let i = 0; i < N; i++) { const thick = 1 + (rnd() < 0.45 ? 1 : 0) + (p.d === 'H' && rnd() < 0.2 ? 1 : 0);
      for (let k = 0; k < thick; k++) { if (side === 'n') set(p, i, k, 'x'); if (side === 's') set(p, i, N - 1 - k, 'x'); if (side === 'w') set(p, k, i, 'x'); if (side === 'e') set(p, N - 1 - k, i, 'x'); } } }); });
/* a terrace line inside Hollow Earth is broken rock, not a ruled edge: outcrops on the high side (the ports are opened again below) */
PLOTS.forEach(p => { if (p.d !== 'H') return; [[0, 1, 's'], [1, 0, 'e'], [0, -1, 'n'], [-1, 0, 'w']].forEach(([dx, dy, side]) => { const q = at(p.x + dx, p.y + dy); if (!q || q.d !== 'H' || q.level >= p.level) return;
    for (let i = 0; i < N; i++) if (rnd() < 0.55) { if (side === 's') set(p, i, N - 1, 'x'); if (side === 'e') set(p, N - 1, i, 'x'); if (side === 'n') set(p, i, 0, 'x'); if (side === 'w') set(p, 0, i, 'x'); } }); });

/* ── K THE CAVERN: chambers in the rock ── */
const K = n => plot[n];
{ let p;
  p = K('P00-00'); p.floorCh = 'h'; blob(p, 6, 6, 4.6, 4.2, 'h'); [[3, 2], [3, 3], [4, 4], [4, 5], [3, 6], [3, 7], [4, 8], [4, 9]].forEach(q => set(p, q[0], q[1], 'l'));
  p = K('P01-00'); p.floorCh = 'h'; blob(p, 6, 5.5, 5, 4.6, 'h'); blob(p, 6, 4, 3.2, 2.1, 'l', 'h'); rect(p, 2, 4, 10, 4, 'h', 'l');   // the lake, and the causeway through it
  p = K('P02-00'); p.floorCh = 'h'; p.cx = 7; blob(p, 7, 6, 3.6, 3.4, 'h'); rect(p, 1, 1, 2, 10, 'l'); rect(p, 0, 5, 0, 7, 'h'); rect(p, 3, 5, 3, 7, 'h'); rect(p, 1, 6, 2, 6, 'b');   // the chasm, the rope bridge over it
  p = K('P03-00'); p.floorCh = 'f'; rect(p, 2, 2, 9, 9, 'f');
  p = K('P04-00'); blob(p, 6, 6, 4.6, 4.6, 'o');
  p = K('P05-00'); p.floorCh = 'u'; rect(p, 2, 2, 9, 9, 'u');
  p = K('P00-01'); blob(p, 6, 6, 5, 4.6, 'o');
  p = K('P01-01'); p.cy = 7; blob(p, 6, 7, 3.8, 3.2, 'o');
  p = K('P02-01'); blob(p, 6, 6, 5.6, 5.6, 'o');
  p = K('P03-01'); blob(p, 6, 6, 5, 5, 'o');
  p = K('P04-01'); blob(p, 6, 6, 4.6, 4.6, 'o');
  p = K('P05-01'); p.floorCh = 'c'; rect(p, 4, 1, 7, 10, 'c'); blob(p, 9, 7, 2.2, 2.6, 'c');
  p = K('P02-02'); blob(p, 6, 5, 4.6, 4, 'o'); rect(p, 2, 8, 9, 11, 'o');   // THE LIP: the whole south side open on the country
}
JOINS.forEach(j => port(plot[j[0]], plot[j[1]], 2, 2));
OPENINGS.forEach(o => { const a = plot[o.a], b = plot[o.b], lo = a.level < b.level ? a : b; port(a, b, a === lo ? 5 : 3, b === lo ? 5 : 3); });

/* THE LIP looks out: the country's north rock is open under the Mouth (the cliff is the edge) */
rect(plot['P02-03'], 2, 0, 9, 2, 'g', 'x');
/* ── the water (after the ports, so a stream keeps to its bed) ── */
{ let p;
  /* THE SPRING on the Shelf, its bed to the Terrace's line; THE POOL under the fall; the stream west through the Crossroads and the Long
     Ramp's foot; the river under the west wall */
  p = K('P04-01'); blob(p, 8, 4, 1.7, 1.5, 'w', 'ox'); line(p, 8, 5, 8, 6, 1, 'w'); rect(p, 0, 6, 8, 6, 'w');
  p = K('P03-01'); blob(p, 9, 6, 2.3, 2.3, 'w', 'ox'); rect(p, 9, 6, 11, 6, 'w'); line(p, 8, 7, 8, 9, 1, 'w'); rect(p, 0, 9, 8, 9, 'w'); rect(p, 0, 8, 0, 10, 'o', 'x'); set(p, 0, 9, 'w');
  p = K('P02-01'); rect(p, 0, 9, 11, 9, 'w'); rect(p, 0, 8, 0, 10, 'o', 'x'); rect(p, 11, 8, 11, 10, 'o', 'x'); set(p, 0, 9, 'w'); set(p, 11, 9, 'w');
  p = K('P01-01'); rect(p, 0, 9, 11, 9, 'w'); rect(p, 0, 8, 11, 10, 'o', 'x'); rect(p, 0, 9, 11, 9, 'w');
  p = K('P00-01'); rect(p, 0, 9, 11, 9, 'w'); rect(p, 1, 8, 11, 10, 'o', 'x'); rect(p, 0, 9, 11, 9, 'w'); rect(p, 2, 9, 5, 10, 'w'); set(p, 7, 9, 'b');   // the river widens; THE PLANK
  p = K('P05-01'); set(p, 9, 8, 'w'); set(p, 10, 8, 'w');   // the pool under THE CRYSTAL LEDGE
  /* Hollow Earth: the brook of the old trees and the Hot Spring it pours into; the lake and the jetty */
  p = K('P00-03'); line(p, 3, 3, 6, 6, 1, 'w'); rect(p, 6, 6, 6, 11, 'w');
  p = K('P00-04'); blob(p, 6, 4, 3.4, 3, 'w', 'gx'); rect(p, 6, 0, 6, 3, 'w'); rect(p, 5, 0, 7, 0, 'g', 'x'); set(p, 6, 0, 'w');
  p = K('P01-05'); blob(p, 6, 7, 4.4, 3.2, 'w', 'gx'); rect(p, 6, 2, 6, 6, 'b');
  /* Agartha: the canal down the Lower Terrace, the Lake and its south shore, the pier */
  p = K('P03-03'); rect(p, 6, 3, 6, 11, 'w'); blob(p, 6, 3, 1.5, 1.5, 'w', 'mx');
  p = K('P03-04'); blob(p, 6, 6, 4.8, 4.8, 'w', 'mx'); rect(p, 6, 0, 6, 2, 'w'); rect(p, 3, 9, 9, 11, 'w');
  p = K('P03-05'); rect(p, 3, 0, 9, 4, 'w'); rect(p, 6, 1, 6, 4, 'b');
}
/* ── the paths: dirt in the country, crystal paving in the city ── */
{ const way = (ch, only, pts) => { for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) * 2; for (let k = 0; k <= n; k++) { const x = Math.round(a[0] + (b[0] - a[0]) * k / n), y = Math.round(a[1] + (b[1] - a[1]) * k / n); for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const X = x + ox, Y = y + oy; if (X >= 0 && Y >= 0 && X < W && Y < H && only.includes(cell[Y][X])) cell[Y][X] = ch; } } } };
  way('d', 'g', [[30, 36], [30, 52], [30, 66], [30, 70]]); way('d', 'g', [[30, 52], [20, 53], [8, 50]]); way('d', 'g', [[18, 30], [18, 44], [18, 52]]); way('d', 'g', [[6, 30], [6, 44], [8, 50], [6, 64]]); way('d', 'g', [[6, 64], [18, 60], [30, 64]]); way('d', 'g', [[30, 42], [35, 42]]);
  way('q', 'm', [[36, 42], [54, 42], [66, 42]]); way('q', 'm', [[54, 30], [54, 54], [54, 70]]); way('q', 'm', [[42, 30], [54, 30], [66, 30], [66, 24]]); way('q', 'm', [[42, 30], [42, 40]]); way('q', 'm', [[66, 30], [66, 54], [70, 54]]); way('q', 'm', [[30, 66], [44, 66], [54, 66], [66, 66], [66, 70]]); way('q', 'm', [[54, 54], [46, 56]]); }
/* a sand rim round the country's water */
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (cell[y][x] === 'g' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => cell[y + dy][x + dx] === 'w')) cell[y][x] = 's';

const out = {
  area: 'The Cavern', version: 'build-1',
  approved: 'not yet seen by mondo: built on his order of 2026-11-16 ("most of them I want completely redesigned/reimagined with plots and districts ... Then move the exits"); plot plan 2 = docs/plans/world-zones/cavern_plot_plan_2.png',
  squareMeters: 3.5, plotCells: N, cols: GX, rows: GY, levelMeters: 1.75,
  districts: { K: 'The Cavern', H: 'Hollow Earth', A: 'Agartha' },
  roofed: ['K'],
  legend: { x: 'rock (cannot walk)', o: 'cave floor', h: 'hot rock (obsidian)', f: 'cut floor (Level −6)', u: 'gaol floor', c: 'crystal floor', w: 'water', l: 'lava', b: 'plank / rope bridge / jetty', g: 'grass', d: 'dirt path', s: 'sand', m: 'marble', q: 'crystal paving' },
  plots: PLOTS.map(p => ({ id: p.id, name: p.name, d: p.d, level: p.level, what: p.what, from: p.from })),
  openings: OPENINGS,
  cells: cell.map(r => r.join('')),
  levelsNote: 'K: 4 = the lower tier (the Crossroads, the river, the Terrace, the Adit, the Mouth), 8 = the Shelf and the hot side, 12 = the High Tier and Level −6, 3 = the Oubliette (a step down). H: 2 = the north shelf (the Crystal Forest, the Mushroom Shelf), 1 = the Old Trees and the Giant\'s Steps, 0 = the country. A: 4 = the upper city, 2 = the Spire\'s terrace, 0 = the Plaza, the Lake, the gates. 1 level = 1.75 m.',
};
const dir = path.join(__dirname, '../../areas/cavern'); fs.mkdirSync(path.join(dir, 'districts'), { recursive: true });
const body = JSON.stringify(out, null, 1).replace(/\{\n\s+"id": ("[^"]+"),\n\s+"name": ("(?:[^"\\]|\\.)*"),\n\s+"d": ("."),\n\s+"level": (\d+),\n\s+"what": ("(?:[^"\\]|\\.)*"),\n\s+"from": ("(?:[^"\\]|\\.)*")\n\s+\}/g, '{ "id": $1, "name": $2, "d": $3, "level": $4, "what": $5, "from": $6 }')
  .replace(/\{\n\s+"a": ("[^"]+"),\n\s+"b": ("[^"]+"),\n\s+"kind": ("[^"]+"),\n\s+"name": ("(?:[^"\\]|\\.)*")(?:,\n\s+"by": ("[^"]+"))?\n\s+\}/g, (m, a, b, k, n, by) => '{ "a": ' + a + ', "b": ' + b + ', "kind": ' + k + (by ? ', "by": ' + by : '') + ', "name": ' + n + ' }');
fs.writeFileSync(path.join(dir, 'layout.json'), body + '\n');
console.log(cell.map(r => r.join('')).join('\n'));
