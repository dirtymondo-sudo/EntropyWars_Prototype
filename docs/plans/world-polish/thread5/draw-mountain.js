#!/usr/bin/env node
/* WORLD POLISH, THREAD 5: THE MOUNTAINS. THE MOUNTAIN ON PAPER (2026-11-20; repo-only tooling, docs/plans/world-polish/WORLD_POLISH_PLAN.md).
   mondo 11-20: "The ski trails should be all over the mountain. It should be designed like an actual mountain and ski resort, where there are
   some easy trails at the towards the base and double black diamonds towards the top. I should be able to ski all the way from the top of mt
   Olympus to the base of the mountain or wherever the ski resort starts at the bottom."
   THIS FILE IS THE PLAN: every plot of the one mountain (its place on the world grid, its level, its name), every ski run with its grade,
   every lift, the buildings, the walking ways laid on the 3.5 m squares, the ways out. It checks itself (a run's mark against the real fall
   of the ground; no walking leg over 8 squares; no walking way along a row or column of plots) and writes mountain-plan.svg + .png.
       node docs/plans/world-polish/thread5/draw-mountain.js [--no-png]
   Grid: c = world x + 22 (c 0 = x -22), r = world y + 22 (r 0 = y -22). One level = 1.75 m. A plot = 12 x 12 squares = 42 m.
   NOTHING IS BUILT FROM THIS YET: it waits mondo's word. */
'use strict';
const fs = require('fs'), path = require('path');
const X = null;
/* THE LEVELS (0 = the Lodge Yard). X = not a plot: crag, cliff or deep wood (scenery). */
const LV = [
/*        c0  c1  c2  c3  c4  c5  c6  c7  c8  c9 c10 c11 c12 */
/* r0 */ [ X,  X,  X,  X,  X,  X, 30, 34, 36,  X,  X,  X,  X],
/* r1 */ [ X,  X,  X,  X, 12, 17, 23, 30, 38,  X,  X,  X,  X],   // (c9 r1 is the Polar Trail's plot, route R5)
/* r2 */ [ X,  X,  6,  8, 12, 16, 21, 27, 37, 48,  X,  X,  X],
/* r3 */ [ X,  4,  6,  9, 14, 19, 25, 33, 42, 52, 62,  X,  X],
/* r4 */ [ 1,  4,  7, 10, 16, 21, 27, 35, 44, 54, 64, 64, 64],
/* r5 */ [ 0,  3,  6,  9, 14, 19, 25, 33, 42, 53, 64, 64, 64],
/* r6 */ [ 0,  1,  4,  7, 11, 15, 20, 27, 36, 47,  X, 56, 56],
/* r7 */ [ 0,  1,  3,  6, 10, 14, 19, 26, 34, 40, 44, 48, 48],
/* r8 */ [ X,  X,  X,  X,  X,  X, 14, 20, 27, 33, 40, 40,  X],
/* r9 */ [ X,  X,  X,  X,  X,  X,  X,  X,  X,  X,  X, 34,  X]];
/* THE LONG DESCENT: the east way down to the River Road (c 13..19), a serpent on two rows */
const TAIL = [[13, 7, 45], [13, 6, 43], [14, 6, 41], [14, 7, 39], [15, 7, 36], [15, 6, 34], [16, 6, 32], [16, 7, 30], [17, 7, 28], [17, 6, 26], [18, 6, 24], [18, 7, 22], [19, 7, 20]];
const lvl = {}; LV.forEach((row, r) => row.forEach((v, c) => { if (v != null) lvl[c + ',' + r] = v; })); TAIL.forEach(([c, r, v]) => { lvl[c + ',' + r] = v; });
const L = (c, r) => lvl[c + ',' + r];
/* cells of the box that belong to a route (the routes thread's; not edited) */
const ROUTE = { '9,0': 'R5', '9,1': 'R5', '5,8': 'L3', '12,9': 'R3', '-1,6': 'L6' };
/* THE NAMES (plain; a name with * is a plot that stands today and moves here; the rest are new plots) */
const NAME = {
  '6,0': 'The Ridge, west*', '7,0': 'The Ridge*', '8,0': 'The Ridge, east*',
  '4,1': 'The Mine Cart*', '5,1': 'The North Lift', '6,1': 'The Snowman*', '7,1': 'The Switchbacks*', '8,1': 'The High Pass*',
  '2,2': 'The Trapper’s Camp*', '3,2': 'The Camp*', '4,2': 'The Marker Stones*', '5,2': 'The North Valley', '6,2': 'The Frozen Tarn*', '7,2': 'The Pass Gate*', '8,2': 'The Cornice*', '9,2': 'The Glacier*',
  '1,3': 'The North Road', '2,3': 'The Home Run', '3,3': 'Bunny Flat*', '4,3': 'The Meadows*', '5,3': 'The Fork*', '6,3': 'The Rope Bridge*', '7,3': 'Avalanche Gulch*', '8,3': 'The Headwall', '9,3': 'The Bowl*', '10,3': 'THE TOP STATION*',
  '0,4': 'The Rental Hut*', '1,4': 'The Run-Out*', '2,4': 'The Run-Out, upper', '3,4': 'The Big Jump, foot', '4,4': 'The Big Jump*', '5,4': 'The Big Jump, top', '6,4': 'THE MID STATION', '7,4': 'The Black Run*', '8,4': 'The Black Run, top*', '9,4': 'The Spine', '10,4': 'The Twelve Thrones*', '11,4': 'THE TEMPLE*', '12,4': 'The Grand Stair*',
  '0,5': 'THE SKI LODGE*', '1,5': 'The Chairlift*', '2,5': 'The Bunny Slope*', '3,5': 'The Slalom, foot', '4,5': 'The Slalom*', '5,5': 'The Slalom, top', '6,5': 'The Frozen Lake*', '7,5': 'The Red Banks*', '8,5': 'The Scree*', '9,5': 'The Scree, top', '10,5': 'The Stadium*', '11,5': 'The Colonnade*', '12,5': 'The Cloud Line*',
  '0,6': 'The Lodge Yard*', '1,6': 'The Ski Patrol', '2,6': 'The Long Way Home', '3,6': 'The Park, foot', '4,6': 'The Half-Pipe*', '5,6': 'The Park, top', '6,6': 'The Sleigh Bend*', '7,6': 'The Last Trees*', '8,6': 'The Lookout*', '9,6': 'The Chutes', '11,6': 'The Sacred Way*', '12,6': 'The Terraces*',
  '0,7': 'The Village Street', '1,7': 'The Village Green', '2,7': 'The Sleigh Road', '3,7': 'The Low Woods', '4,7': 'The Spring*', '5,7': 'The Hot Springs*', '6,7': 'The Tree Line Run', '7,7': 'The Warming Hut*', '8,7': 'The South Lift, top', '9,7': 'The Boulder Field*', '10,7': 'The Goat Track*', '11,7': 'The Olive Grove*', '12,7': 'The Amphitheatre*',
  '6,8': 'The Tree Line, west*', '7,8': 'The Tree Line*', '8,8': 'The Saddle Path*', '9,8': 'The Saddle Path, east*', '10,8': 'The Switchback, lower*', '11,8': 'The Switchback, upper*',
  '11,9': 'The Pilgrim Stair*',
  '13,7': 'the camp*', '13,6': 'the trapper’s camp*', '14,6': 'the mine cart*', '14,7': 'the snowman*', '15,7': 'the boundary stone*', '15,6': 'The Old Lava*', '16,6': 'The Long Descent', '16,7': 'The Long Descent', '17,7': 'The Long Descent', '17,6': 'The Long Descent', '18,6': 'The Long Descent', '18,7': 'The Upper Shelf*', '19,7': 'The Trailhead*' };
/* the districts on the in-game map: K The Ski Lodge, P The Snowy Pass, O Mount Olympus */
const DIST = (c, r) => c >= 13 ? 'O' : (r <= 2 || (r === 3 && (c === 6 || c === 7))) && c <= 9 ? (c >= 9 ? 'O' : 'P') : c >= 8 ? 'O' : 'K';
/* THE RUNS: [name, mark, [[c, r] …]] through plot middles (a fraction moves the line off the middle). g green, b blue, k black, kk double black */
const RUNS = [
  ['The Headwall', 'kk', [[10, 3.1], [9.3, 2.75], [8.6, 3.25], [8, 3]]],
  ['The Spine', 'kk', [[10, 4], [9.4, 4.3], [8.6, 3.75], [8, 4]]],
  ['The Scree', 'kk', [[10, 4.9], [9.3, 5.3], [8.6, 4.8], [8, 5]]],
  ['The Glacier', 'kk', [[10, 2.9], [9.3, 2.2], [9, 2], [8, 2]]],
  ['Avalanche Gulch', 'k', [[8, 3], [7.5, 3.3], [7, 3], [6.45, 3.7], [6.1, 4.1]]],   // (ends on the Mid Station: the Rope Bridge's crevasse lies north of it, off every run)
  ['The Black Run', 'k', [[8, 4], [7.5, 3.75], [7, 4], [6.5, 4.3], [6.1, 4.1]]],
  ['The Red Banks', 'k', [[8, 5], [7.5, 5.3], [7, 5], [6.5, 4.75], [6, 5]]],
  ['The Traverse', 'k', [[8, 4], [7, 5], [6, 6]]],
  ['The Chutes', 'k', [[9, 5.15], [9.1, 5.7], [8.7, 6.2], [8, 6], [7, 6.3], [6, 6]]],
  ['The North Bowl', 'k', [[9, 2], [8.6, 1.6], [8, 1], [7, 1.3], [6, 1]]],
  ['The Cornice', 'k', [[8, 2], [7.5, 1.75], [7, 2], [6.5, 2.3], [6, 2]]],
  ['The Lookout Run', 'k', [[9, 7], [8.5, 6.75], [8, 7], [7, 7.3], [6, 7]]],
  ['The Meadows', 'b', [[6, 3.9], [5.45, 3.5], [5, 3], [4.5, 2.75], [4, 3], [3, 3.3]]],
  ['The Big Jump', 'b', [[6, 4], [5.5, 4.3], [5, 4], [4, 3.75], [3, 4]]],
  ['The Crossover', 'b', [[6, 4], [5, 5], [4, 6], [3, 6]]],
  ['The Slalom', 'b', [[6, 5], [5.5, 4.7], [5, 5], [4.5, 5.3], [4, 5], [3.5, 4.75], [3, 5]]],
  ['The Half-Pipe', 'b', [[6, 6], [5, 6.3], [4, 6], [3, 6.25]]],
  ['The Tree Line Run', 'b', [[6, 7], [5.5, 6.7], [5, 7], [4.5, 7.3], [4, 7], [3, 6.75]]],
  ['The North Valley', 'b', [[6, 2], [5, 2.3], [4.6, 2], [4, 3]]],
  ['The North Run', 'b', [[6, 1], [5.5, 1.3], [5, 1], [4.3, 1.1], [4, 2], [3, 2.2]]],
  ['The North Road', 'g', [[3, 2], [2.3, 1.8], [2, 2.9], [1.3, 2.8], [1, 3.9], [0.3, 4.1]]],
  ['The Home Run', 'g', [[3, 3], [2.5, 3.3], [2, 3.1]]],
  ['The Run-Out', 'g', [[3, 4], [2.5, 4.3], [2, 4], [1.5, 3.8], [1, 4.2], [0.3, 4.3]]],
  ['The Cat Track', 'g', [[3, 5], [2, 4], [1, 4.3]]],
  ['The Bunny Slope', 'g', [[3, 5], [2.5, 5.3], [2, 5], [1.5, 4.8], [1, 5], [0.45, 5]]],
  ['The Long Way Home', 'g', [[3, 6], [2.5, 5.75], [2, 6], [1.5, 6.3], [1, 6], [0.45, 5.8]]],
  ['The Sleigh Road', 'g', [[3, 7], [2.5, 7.3], [2, 7], [1.5, 6.75], [1, 7], [0.45, 7]]],
  ['The Long Descent', 'g', [[12, 7]].concat(TAIL.map(t => [t[0], t[1]]))]];
/* THE LIFTS: [name, bottom, top] */
const LIFTS = [
  ['THE LODGE CHAIR', [1, 5.25], [6, 4.2]],
  ['THE SUMMIT CHAIR', [6, 3.85], [10, 3.3]],
  ['THE NORTH CHAIR', [4.3, 1.3], [8, 1.3]],
  ['THE SOUTH CHAIR', [3.3, 7.3], [8, 7.3]],
  ['THE BUNNY TOW', [0.75, 5.6], [2.2, 5.3]]];
/* THE WALKING WAYS: [name, wide (squares), [[c, r] …]] plot to plot; laid on the squares by lay() below */
const WAYS = [
  ['THE PASS ROAD (main, 3 squares)', 3, [[6, 8], [7, 8], [7, 7], [8, 7], [8, 6], [7, 6], [7, 5], [6, 5], [6, 4], [7, 4], [7, 3], [6, 3], [6, 2], [7, 2], [7, 1], [8, 1], [8, 0]]],
  ['THE PILGRIM WAY (main, 3 squares)', 3, [[11, 9], [11, 8], [10, 8], [10, 7], [11, 7], [11, 6], [12, 6], [12, 5]]],
  ['the Summit Trail', 1, [[7, 4], [8, 4], [8, 3], [9, 3], [9, 4], [10, 4]]],
  ['the Terrace Steps', 2, [[11, 5], [11, 6]]],
  ['the Theatre Path', 2, [[12, 6], [12, 7]]],
  ['the Saddle Path', 1, [[8, 7], [8, 8], [9, 8], [9, 7], [10, 7]]],
  ['the Low Road', 2, [[1, 7], [2, 7], [2, 6], [3, 6], [3, 7], [4, 7], [4, 6], [5, 6], [5, 7], [6, 7], [6, 8]]],
  ['the Trapper’s Trail', 1, [[1, 4], [1, 3], [2, 3], [2, 2], [3, 2], [3, 3], [4, 3], [4, 2], [5, 2], [5, 1], [6, 1], [6, 2]]],
  ['THE LONG DESCENT (main, 3 squares)', 3, [[12, 7]].concat(TAIL.map(t => [t[0], t[1]]))]];
/* buildings you walk into (B) and landmarks (M): [c, r, dx, dy, label] */
const SPOTS = [
  ['B', 0.5, 5.33, ''], ['B', 0.5, 4.3, ''], ['B', 1.5, 6.3, 'SKI PATROL'], ['B', 0.33, 7.3, 'INN'], ['B', 0.7, 7.62, 'SHOP'],
  ['B', 6.7, 4.6, ''], ['B', 10.62, 3.62, ''], ['B', 7.5, 7.68, 'WARMING HUT'], ['B', 5.5, 7.68, 'BATH HOUSE'],
  ['B', 11.5, 4.3, ''],
  ['M', 8.5, 6.3, 'lookout'], ['M', 7.3, 3.3, 'rope bridge'], ['M', 8.6, 1.7, 'cairn'], ['M', 6.5, 5.6, 'frozen lake'], ['M', 5.3, 7.3, 'old mine: down to Agartha'],
  ['M', 12.6, 4.7, 'stair to Heaven'], ['M', 4.5, 4.3, 'kicker'], ['M', 4.5, 6.3, 'half-pipe'], ['M', 4.5, 5.3, 'gates'], ['M', 6.5, 2.3, 'tarn']];
/* the ways out: [c, r, side, label, sub] */
const OUTS = [
  [0, 6, 'W', 'CAME A LOT', 'The Snowy Pines'], [6, 8, 'W', 'THE WOODS', 'The Redwood Trail'], [8, 0, 'E', 'THE POLAR TRAIL', 'to The North Pole'],
  [11, 9, 'E', 'THE PILGRIM WAY', 'the Colosseum, the Vatican'], [19, 7, 'S', 'THE RIVER ROAD', 'the Vatican, Disaster City']];

/* ── the checks ── */
const problems = [], say = s => problems.push(s);
const BAND = { g: [0, 3.2], b: [3.2, 6.5], k: [6.5, 9.9], kk: [9.9, 99] }, MARKNAME = { g: 'green', b: 'blue', k: 'black', kk: 'double black' };
const at = ([c, r]) => L(Math.round(c), Math.round(r));
const runRows = RUNS.map(([name, mark, pts]) => {
  let drop = 0, len = 0, steep = 0; const falls = [];
  for (let i = 1; i < pts.length; i++) { const a = at(pts[i - 1]), b = at(pts[i]); if (a == null || b == null) { say(name + ': a point is off the plots'); continue; }
    const pa = [Math.round(pts[i - 1][0]), Math.round(pts[i - 1][1])], pb = [Math.round(pts[i][0]), Math.round(pts[i][1])], d = Math.abs(pa[0] - pb[0]) + Math.abs(pa[1] - pb[1]);
    if (!d) continue; if (b > a) say(name + ': goes UP from ' + pa + ' (' + a + ') to ' + pb + ' (' + b + ')'); falls.push((a - b) / d); drop += a - b; len += d; steep = Math.max(steep, (a - b) / d); }
  const avg = drop / len, [lo, hi] = BAND[mark];
  if (mark !== 'g' && !(steep >= lo)) say(name + ': marked ' + MARKNAME[mark] + ' but its steepest plot falls ' + steep + ' levels');
  if (steep > hi + 1.2) say(name + ': marked ' + MARKNAME[mark] + ' but one plot falls ' + steep + ' levels');
  return { name, mark, plots: len, dropM: drop * 1.75, avgPct: Math.round(drop * 1.75 / (len * 42) * 100), steepPct: Math.round(steep * 1.75 / 42 * 100) }; });
/* a walking way on the squares: from each plot's middle to the next (12 squares) as 3 on, a side step, 6 on, the step back, 3 on */
function lay(plots) { const pts = []; let s = 1; const P = ([c, r]) => [c * 12 + 6, r * 12 + 6]; pts.push(P(plots[0]));
  for (let i = 1; i < plots.length; i++) { const [ax, ay] = P(plots[i - 1]), dx = Math.sign(plots[i][0] - plots[i - 1][0]), dy = Math.sign(plots[i][1] - plots[i - 1][1]), k = (3 + (i % 2)) * s; s = -s;
    const px = -dy, py = dx; let x = ax, y = ay; const go = (fx, fy) => { x += fx; y += fy; pts.push([x, y]); };
    go(dx * 3, dy * 3); go(px * k, py * k); go(dx * 6, dy * 6); go(-px * k, -py * k); go(dx * 3, dy * 3); }
  const out = [pts[0]]; for (let i = 1; i < pts.length; i++) { const a = out[out.length - 2], b = out[out.length - 1], c = pts[i]; if (a && ((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1]))) out[out.length - 1] = c; else out.push(c); }
  return out; }
const wayRows = WAYS.map(([name, wide, plots]) => { const pts = lay(plots); let longest = 0;
  for (let i = 1; i < pts.length; i++) longest = Math.max(longest, Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]));
  if (longest > 8) say(name + ': a straight leg of ' + longest + ' squares');
  let run = 1; for (let i = 2; i < plots.length; i++) { const a = plots[i - 2], b = plots[i - 1], c = plots[i]; run = ((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1])) ? run + 1 : 1; if (run > 1) say(name + ': three plots in one line at ' + c); }
  plots.forEach(p => { if (L(p[0], p[1]) == null) say(name + ': ' + p + ' is not a plot'); });
  let up = 0; for (let i = 1; i < plots.length; i++) up += Math.max(0, L(plots[i][0], plots[i][1]) - L(plots[i - 1][0], plots[i - 1][1]));
  return { name, wide, plots: plots.length, legs: pts.length - 1, longest, climbM: up * 1.75, pts }; });
const cells = Object.keys(lvl).map(k => k.split(',').map(Number)), nPlots = cells.length;
cells.forEach(([c, r]) => { if (ROUTE[c + ',' + r]) say('plot on a route cell ' + c + ',' + r); if (!NAME[c + ',' + r]) say('no name ' + c + ',' + r); });
const ROOMS = { BASE: ([c]) => c <= 4, MID: ([c, r]) => c >= 5 && (c <= 7 || (c === 8 && r <= 2)), SUMMIT: ([c, r]) => c >= 8 && c <= 12 && !(c === 8 && r <= 2), 'LONG DESCENT': ([c]) => c >= 13 };
const roomCount = {}; Object.keys(ROOMS).forEach(k => { roomCount[k] = cells.filter(ROOMS[k]).length; if (roomCount[k] > 30) say('room ' + k + ' holds ' + roomCount[k] + ' plots'); });

module.exports = { LV, TAIL, NAME, DIST, RUNS, WAYS, LIFTS, L, cells, lay, WX0: -22, WY0: -22 };
if (require.main !== module) return;   // bake-mountains.js reads the plan from here
/* ── print ── */
console.log('THE LEVELS (1 level = 1.75 m; . = crag or deep wood; R = a route\'s plot)\n      ' + Array.from({ length: 20 }, (_, c) => ('c' + c).padStart(4)).join(''));
for (let r = 0; r < 10; r++) console.log(('r' + r).padStart(4) + '  ' + Array.from({ length: 20 }, (_, c) => (ROUTE[c + ',' + r] ? 'R' : L(c, r) == null ? '.' : '' + L(c, r)).padStart(4)).join(''));
console.log('\nplots ' + nPlots + ' · rooms ' + JSON.stringify(roomCount) + ' · top ' + 64 * 1.75 + ' m over the Lodge Yard');
console.log('\nTHE RUNS'); runRows.forEach(q => console.log('  ' + MARKNAME[q.mark].padEnd(13) + q.name.padEnd(20) + (q.plots * 42 + ' m').padStart(6) + (' falls ' + q.dropM + ' m').padStart(16) + ('  avg ' + q.avgPct + '%').padEnd(10) + ' steepest plot ' + q.steepPct + '%'));
console.log('\nTHE WALKING WAYS'); wayRows.forEach(q => console.log('  ' + q.name.padEnd(36) + q.plots + ' plots, ' + q.legs + ' legs, longest ' + q.longest + ' squares, climbs ' + q.climbM + ' m'));
console.log(problems.length ? '\nPROBLEMS\n  ' + problems.join('\n  ') : '\nchecks: every run falls all the way and wears the right mark; no walking leg over 8 squares; no walking way along a row or column of plots; no room over 30 plots');

/* ── draw ── */
const S = 86, X0 = 250, Y0 = 118, COLS = 20, ROWS = 10, W = X0 + COLS * S + 30, H = Y0 + ROWS * S + 330;
const px = c => X0 + c * S, py = r => Y0 + r * S, mx = c => px(c + 0.5), my = r => py(r + 0.5);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const tint = v => { const t = Math.min(1, v / 64), a = [196, 214, 205], b = [255, 255, 255], m = t < 0.5 ? t * 2 : 1, c = a.map((q, i) => Math.round(q + (b[i] - q) * m)); if (t > 0.5) { const u = (t - 0.5) * 2; c[0] -= Math.round(22 * u); c[1] -= Math.round(18 * u); } return 'rgb(' + c + ')'; };
const DCOL = { K: '#1d6fb8', P: '#7a4bb0', O: '#b8860b' }, RC = { g: '#1f9d4d', b: '#1c5fd6', k: '#111', kk: '#111' };
const o = [];
o.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="DejaVu Sans, Arial, sans-serif">`);
o.push(`<defs><pattern id="rock" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="10" height="10" fill="#7d8088"/><line x1="0" y1="0" x2="0" y2="10" stroke="#6a6d75" stroke-width="5"/></pattern>
<marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker><marker id="ra" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="2.7" markerHeight="2.7" orient="auto"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>`);
o.push(`<rect width="${W}" height="${H}" fill="#f3f1ea"/>`);
o.push(`<text x="${X0}" y="40" font-size="27" font-weight="700" fill="#16202a">THE MOUNTAINS: ONE SKI MOUNTAIN, FROM MOUNT OLYMPUS DOWN TO THE SKI LODGE</text>`);
o.push(`<text x="${X0}" y="66" font-size="15" fill="#3a4652">The plan on paper. Nothing is built yet. North is up. One box = one plot (42 m, 12 x 12 squares). The big number = the plot's height in metres over the Lodge Yard.</text>`);
o.push(`<text x="${X0}" y="88" font-size="15" fill="#3a4652">${nPlots} plots (68 stand today, the rest are new). The summit stands ${64 * 1.75} m over the base. * = a plot that stands today and moves here. Mount Shasta is gone as a name: its plots are the middle of the mountain.</text>`);
o.push(`<rect x="${px(0) - 4}" y="${py(0) - 4}" width="${COLS * S + 8}" height="${ROWS * S + 8}" fill="url(#rock)"/>`);
/* plots */
cells.forEach(([c, r]) => { const v = L(c, r), top = c >= 10 && c <= 12 && (r === 4 || r === 5), flat = (c === 0 && r >= 4) || (c === 1 && r >= 6 && r <= 7) || (c === 6 && (r === 4 || r === 5));
  o.push(`<rect x="${px(c) + 1}" y="${py(r) + 1}" width="${S - 2}" height="${S - 2}" fill="${top ? '#f6e7b4' : flat ? '#e9e2cf' : tint(v)}" stroke="#9aa7b0" stroke-width="1"/>`); });
ROUTE['9,0'] && Object.keys(ROUTE).forEach(k => { const [c, r] = k.split(',').map(Number); o.push(`<rect x="${px(c) + 1}" y="${py(r) + 1}" width="${S - 2}" height="${S - 2}" fill="#d9cdb4" stroke="#8a7a5a" stroke-dasharray="5 4"/><text x="${mx(c)}" y="${py(r) + 14}" font-size="10" text-anchor="middle" fill="#5a4a2a">route ${ROUTE[k]}</text><text x="${mx(c)}" y="${py(r) + S - 6}" font-size="9" text-anchor="middle" fill="#5a4a2a">stays as it is</text>`); });
/* district outlines */
const edge = (c, r, side, col) => { const x0 = px(c), y0 = py(r); const d = side === 'N' ? [x0, y0, x0 + S, y0] : side === 'S' ? [x0, y0 + S, x0 + S, y0 + S] : side === 'W' ? [x0, y0, x0, y0 + S] : [x0 + S, y0, x0 + S, y0 + S]; o.push(`<line x1="${d[0]}" y1="${d[1]}" x2="${d[2]}" y2="${d[3]}" stroke="${col}" stroke-width="4" stroke-linecap="round" opacity="0.85"/>`); };
cells.forEach(([c, r]) => { const d = DIST(c, r); [['N', 0, -1], ['S', 0, 1], ['W', -1, 0], ['E', 1, 0]].forEach(([s, dx, dy]) => { const n = L(c + dx, r + dy) == null ? null : DIST(c + dx, r + dy); if (n !== d) edge(c, r, s, DCOL[d]); }); });
/* the walking ways, on the squares */
const sq = v => X0 + v * S / 12, sqy = v => Y0 + v * S / 12;
wayRows.forEach(q => { const d = q.pts.map((p, i) => (i ? 'L' : 'M') + sq(p[0]).toFixed(1) + ' ' + sqy(p[1]).toFixed(1)).join('');
  o.push(`<path d="${d}" fill="none" stroke="#fff" stroke-width="${q.wide >= 3 ? 7.5 : q.wide === 2 ? 5.5 : 4.5}" stroke-linejoin="miter" opacity="0.9"/><path d="${d}" fill="none" stroke="${q.wide >= 3 ? '#7a4a1e' : '#a8712f'}" stroke-width="${q.wide >= 3 ? 4.6 : q.wide === 2 ? 3 : 2}" stroke-linejoin="miter" ${q.wide >= 3 ? '' : 'stroke-dasharray="6 3"'}/>`); });
/* the runs */
const pt = ([c, r]) => [mx(c), my(r)];
const smoothPath = pts => { const P = pts.map(pt); if (P.length < 3) return 'M' + P.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L'); let d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
  for (let i = 1; i < P.length - 1; i++) { const a = P[i], b = P[i + 1], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; d += 'Q' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' ' + m[0].toFixed(1) + ' ' + m[1].toFixed(1); }
  const e = P[P.length - 1]; return d + 'L' + e[0].toFixed(1) + ' ' + e[1].toFixed(1); };
RUNS.forEach(([name, mark, pts]) => { const d = smoothPath(pts);
  o.push(`<path d="${d}" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/><path d="${d}" fill="none" stroke="${RC[mark]}" stroke-width="${mark === 'kk' ? 9 : 8}" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#ra)"/>`);
  if (mark === 'kk') o.push(`<path d="${d}" fill="none" stroke="#f5c400" stroke-width="2.2" stroke-dasharray="3 9" stroke-linecap="round"/>`); });
const LIFTLAB = [];
/* the lifts */
LIFTS.forEach(([name, a, b]) => { const A = [px(a[0]) + S / 2, py(a[1]) + S / 2], B = [px(b[0]) + S / 2, py(b[1]) + S / 2];
  o.push(`<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="#fff" stroke-width="6"/><line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="#d1202f" stroke-width="3" stroke-dasharray="2 7"/><line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="#d1202f" stroke-width="1.2"/>`);
  [A, B].forEach(p => o.push(`<rect x="${p[0] - 6}" y="${p[1] - 6}" width="12" height="12" fill="#d1202f" stroke="#fff" stroke-width="2"/>`));
  LIFTLAB.push([name, A, B]); });
/* numbers + names */
cells.forEach(([c, r]) => { const v = L(c, r), n = NAME[c + ',' + r] || '', big = /^[A-Z ’*,]+$/.test(n);
  o.push(`<text x="${px(c) + 5}" y="${py(r) + 15}" font-size="13" font-weight="700" fill="#16202a" stroke="#fff" stroke-width="2.5" paint-order="stroke">${Math.round(v * 1.75)} m</text>`);
  const words = n.split(' '), lines = ['']; words.forEach(w => { if ((lines[lines.length - 1] + ' ' + w).trim().length > 15) lines.push(w); else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim(); });
  lines.forEach((t, i) => o.push(`<text x="${px(c) + S - 4}" y="${py(r) + S - 5 - (lines.length - 1 - i) * 10.5}" font-size="${big ? 9.4 : 9}" font-weight="${big ? 700 : 400}" text-anchor="end" fill="#22303c" stroke="#fff" stroke-width="2.4" paint-order="stroke">${esc(t)}</text>`)); });
/* run names at their tops */
const SYM = { g: '●', b: '■', k: '◆', kk: '◆◆' };
RUNS.forEach(([name, mark, pts]) => { const [x, y] = pt(pts[0]), [x2, y2] = pt(pts[1]); const lx = x + (x2 - x) * 0.42, ly = y + (y2 - y) * 0.42 - 8;
  o.push(`<text x="${lx}" y="${ly}" font-size="10.5" font-weight="700" text-anchor="middle" fill="${RC[mark]}" stroke="#fff" stroke-width="3" paint-order="stroke">${SYM[mark]} ${esc(name)}</text>`); });
/* buildings + landmarks */
SPOTS.forEach(([k, c, r, label]) => { const x = px(c), y = py(r);
  if (k === 'B') o.push(`<path d="M${x - 8} ${y + 6}V${y - 2}L${x} ${y - 9}L${x + 8} ${y - 2}V${y + 6}z" fill="#5b3716" stroke="#fff" stroke-width="1.6"/><text x="${x}" y="${y + 17}" font-size="9" font-weight="700" text-anchor="middle" fill="#5b3716" stroke="#fff" stroke-width="2.6" paint-order="stroke">${esc(label)}</text>`);
  else o.push(`<circle cx="${x}" cy="${y}" r="3.4" fill="#0b7a75" stroke="#fff" stroke-width="1.4"/><text x="${x + 6}" y="${y + 3.5}" font-size="9" font-style="italic" fill="#0b5a56" stroke="#fff" stroke-width="2.6" paint-order="stroke">${esc(label)}</text>`); });
/* the ways out */
OUTS.forEach(([c, r, side, label, sub]) => { const x = side === 'W' ? px(c) : side === 'E' ? px(c + 1) : mx(c), y = side === 'S' ? py(r + 1) : my(r), dx = side === 'W' ? -1 : side === 'E' ? 1 : 0, dy = side === 'S' ? 1 : 0;
  o.push(`<line x1="${x}" y1="${y}" x2="${x + dx * (ROUTE[(c + dx) + ',' + r] ? S - 6 : 34)}" y2="${y + dy * 30}" stroke="#c2410c" stroke-width="6" marker-end="url(#ar)"/>`);
  const tx = x + dx * (ROUTE[(c + dx) + ',' + r] ? S + 8 : 44), anchor = dx < 0 ? 'end' : dx > 0 ? 'start' : 'middle', ty = y + dy * 52;
  o.push(`<text x="${tx}" y="${ty - 2}" font-size="12" font-weight="700" text-anchor="${anchor}" fill="#9a3412">${esc(label)}</text><text x="${tx}" y="${ty + 12}" font-size="10.5" text-anchor="${anchor}" fill="#9a3412">${esc(sub)}</text>`); });
LIFTLAB.forEach(([name, A, B]) => {
  const ang = Math.atan2(B[1] - A[1], B[0] - A[0]) * 180 / Math.PI, m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  o.push(`<text transform="translate(${m[0]} ${m[1] - 6}) rotate(${ang})" font-size="11" font-weight="700" text-anchor="middle" fill="#b0101f" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(name)} ▲</text>`); });
/* the rooms' seams */
[[5, 1, 9], [8, 3, 9]].forEach(([c, r0, r1]) => o.push(`<line x1="${px(c)}" y1="${py(r0)}" x2="${px(c)}" y2="${py(r1)}" stroke="#e11d8f" stroke-width="2" stroke-dasharray="10 6"/>`));
o.push(`<line x1="${px(8)}" y1="${py(0)}" x2="${px(9)}" y2="${py(0)}" stroke="none"/><path d="M${px(9)} ${py(1)}V${py(3)}H${px(8)}" fill="none" stroke="#e11d8f" stroke-width="2" stroke-dasharray="10 6"/><line x1="${px(13)}" y1="${py(6)}" x2="${px(13)}" y2="${py(8)}" stroke="#e11d8f" stroke-width="2" stroke-dasharray="10 6"/>`);
[['BASE', 2.5, 8.6], ['MID', 6.5, 9.25], ['SUMMIT', 9.5, 9.25], ['THE LONG DESCENT', 16, 8.6]].forEach(([t, c, r]) => o.push(`<text x="${px(c)}" y="${py(r)}" font-size="12" font-weight="700" text-anchor="middle" fill="#e11d8f" stroke="#f3f1ea" stroke-width="3" paint-order="stroke">room: ${t} (${roomCount[t === 'THE LONG DESCENT' ? 'LONG DESCENT' : t]} plots)</text>`));
/* district names */
[['THE SKI LODGE', 2.2, 3.55, 'K'], ['THE SNOWY PASS', 5.5, 0.6, 'P'], ['MOUNT OLYMPUS', 11.3, 3.6, 'O']].forEach(([t, c, r, d]) => o.push(`<text x="${px(c)}" y="${py(r)}" font-size="17" font-weight="700" text-anchor="middle" fill="${DCOL[d]}" stroke="#f3f1ea" stroke-width="4" paint-order="stroke" opacity="0.95">${t}</text>`));
/* THE NORTH POLE inset (its own room; the Polar Trail leads there) */
(() => { const ix = px(14.2), iy = py(0.15), s = 56, NP = [[8, 6, 7, 4], [5, 3, 2, 3], [0, 0, 1, 2], [0, 1, 2, 3]], NN = [['sled hill', 'The Pole', 'Workshop', 'houses'], ['sled run', 'houses', 'THE SQUARE', 'houses'], ['frozen lake', 'frozen lake', 'sleigh road', 'sleigh road'], ['frozen lake', 'snowline', 'snowline', 'snowline']];
  o.push(`<rect x="${ix - 10}" y="${iy - 6}" width="${s * 4 + 250}" height="${s * 4 + 40}" fill="#f3f1ea" stroke="#16202a" stroke-width="1.5"/>`);
  o.push(`<text x="${ix}" y="${iy + 14}" font-size="14" font-weight="700" fill="#16202a">THE NORTH POLE (its own room, at the end of the Polar Trail)</text>`);
  NP.forEach((row, r) => row.forEach((v, c) => { o.push(`<rect x="${ix + c * s}" y="${iy + 24 + r * s}" width="${s - 1}" height="${s - 1}" fill="${v === 0 ? '#cfe6f2' : tint(v * 6)}" stroke="#9aa7b0"/><text x="${ix + c * s + 4}" y="${iy + 38 + r * s}" font-size="11" font-weight="700" fill="#16202a">${(v * 1.75).toFixed(v % 4 ? 1 : 0)} m</text><text x="${ix + c * s + s / 2}" y="${iy + 24 + r * s + s - 7}" font-size="8.2" text-anchor="middle" fill="#22303c">${NN[r][c]}</text>`); }));
  o.push(`<line x1="${ix - 2}" y1="${iy + 24 + s * 1.5}" x2="${ix - 2}" y2="${iy + 24 + s * 1.5}" stroke="#c2410c"/>`);
  const tx = ix + s * 4 + 12; ['Today it is level (two heights).', 'Plan: the Workshop up on a hill,', 'the square down in the middle,', 'a sled hill you ride down to the', 'frozen lake, lanes between the', 'houses, its closed half opened.', 'Same 16 plots. A later step.'].forEach((t, i) => o.push(`<text x="${tx}" y="${iy + 44 + i * 16}" font-size="11.5" fill="#22303c">${t}</text>`)); })();
/* the legend */
(() => { const lx = px(14.2), ly = py(3.95); let y = ly; const row = (draw, text) => { o.push(draw(lx, y)); o.push(`<text x="${lx + 62}" y="${y + 4}" font-size="12" fill="#16202a">${esc(text)}</text>`); y += 19; };
  o.push(`<rect x="${lx - 12}" y="${ly - 20}" width="${px(20) - lx + 16}" height="${7 * 19 + 26}" fill="#f3f1ea" stroke="#16202a" stroke-width="1.5"/>`);
  const ln = (col, w, dash) => (x, yy) => `<line x1="${x}" y1="${yy}" x2="${x + 50}" y2="${yy}" stroke="${col}" stroke-width="${w}" ${dash ? 'stroke-dasharray="' + dash + '"' : ''} stroke-linecap="round"/>`;
  row(ln('#1f9d4d', 8), '● green: easy, wide, near the base (up to 13 %)');
  row(ln('#1c5fd6', 8), '■ blue: the middle of the mountain (13 to 27 %)');
  row(ln('#111', 8), '◆ black: steep, narrower, trees and bumps (27 to 41 %)');
  row((x, yy) => ln('#111', 9)(x, yy) + ln('#f5c400', 2.2, '3 9')(x, yy), '◆◆ double black: off the summit, chutes and cliffs (over 41 %)');
  row((x, yy) => ln('#d1202f', 3, '2 7')(x, yy) + `<rect x="${x - 5}" y="${yy - 5}" width="10" height="10" fill="#d1202f"/>`, 'a lift: it carries you up, station to station');
  row(ln('#7a4a1e', 4.6), 'a main walking way, 3 squares, laid on the squares');
  row(ln('#a8712f', 2.4, '6 3'), 'a thin trail, 1 or 2 squares'); })();
(() => { const lx = px(16.9), ly = py(8.35) + 0; let y = ly + 5 * 19 + 38; })();
/* THE RIDE: the profile from the Top Station to the Lodge */
(() => { const line = [[10, 3], [9, 3], [8, 3], [7, 3], [6, 4], [5, 3], [4, 3], [3, 3], [2, 3], [1, 3], [1, 4], [0, 4]], names = ['The Headwall ◆◆', '', 'Avalanche Gulch ◆', '', 'The Meadows ■', '', '', 'The Home Run ●', '', '', '', ''];
  const bx = X0, by = Y0 + ROWS * S + 62, bw = 1030, bh = 215, n = line.length - 1, xx = i => bx + 44 + i * (bw - 70) / n, yy = v => by + bh - 30 - v / 64 * (bh - 62);
  o.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#fff" stroke="#16202a" stroke-width="1.5"/>`);
  o.push(`<text x="${bx}" y="${by - 12}" font-size="16" font-weight="700" fill="#16202a">ONE RIDE, TOP TO BOTTOM: the Top Station beside the temples to the Ski Lodge. ${n * 42} m long, ${64 * 1.75 - 0} m down, never uphill. About 35 seconds on the board.</text>`);
  [0, 16, 32, 48, 64].forEach(v => o.push(`<line x1="${bx + 40}" y1="${yy(v)}" x2="${bx + bw - 12}" y2="${yy(v)}" stroke="#d5dbe0"/><text x="${bx + 36}" y="${yy(v) + 4}" font-size="10.5" text-anchor="end" fill="#3a4652">${v * 1.75} m</text>`));
  let poly = `M${xx(0)} ${yy(0)}`; line.forEach((p, i) => { poly += `L${xx(i)} ${yy(L(p[0], p[1]))}`; }); poly += `L${xx(n)} ${yy(0)}z`; o.push(`<path d="${poly}" fill="#e8eef2"/>`);
  for (let i = 1; i <= n; i++) { const a = L(line[i - 1][0], line[i - 1][1]), b = L(line[i][0], line[i][1]), f = a - b, m = f >= 9.9 ? 'kk' : f >= 6.5 ? 'k' : f > 3.2 ? 'b' : 'g';
    o.push(`<line x1="${xx(i - 1)}" y1="${yy(a)}" x2="${xx(i)}" y2="${yy(b)}" stroke="${RC[m]}" stroke-width="7" stroke-linecap="round"/>`); if (m === 'kk') o.push(`<line x1="${xx(i - 1)}" y1="${yy(a)}" x2="${xx(i)}" y2="${yy(b)}" stroke="#f5c400" stroke-width="2" stroke-dasharray="3 9"/>`);
    o.push(`<text x="${(xx(i - 1) + xx(i)) / 2}" y="${by + bh - 10}" font-size="10.5" text-anchor="middle" fill="#3a4652">${Math.round(f * 1.75 / 42 * 100)} %</text>`);
    if (names[i - 1]) o.push(`<text x="${xx(i - 1) + 6}" y="${yy(a) - 12}" font-size="11.5" font-weight="700" fill="${RC[m]}">${names[i - 1]}</text>`); }
  o.push(`<text x="${xx(0)}" y="${yy(62) - 28}" font-size="11" font-weight="700" text-anchor="middle" fill="#b8860b">MOUNT OLYMPUS</text><text x="${xx(n) - 4}" y="${yy(0) - 12}" font-size="11" font-weight="700" text-anchor="end" fill="#5b3716">THE SKI LODGE</text><text x="${xx(4)}" y="${yy(25) + 26}" font-size="10.5" text-anchor="middle" fill="#b0101f">mid station</text>`);
  /* the words beside it */
  const tx = bx + bw + 26; let y = by + 4; const T = (t, b) => { o.push(`<text x="${tx}" y="${y}" font-size="${b ? 14 : 12.6}" font-weight="${b ? 700 : 400}" fill="#16202a">${esc(t)}</text>`); y += b ? 21 : 17.5; };
  T('HOW IT WORKS', 1); T('The summit is Mount Olympus. Its temples stay on top; the Top Station stands'); T('beside them. Four double blacks drop off the summit. Under them eight blacks,');
  T('then eight blues, then seven greens that end at the Lodge or a lift.'); T('Runs fork and merge; every run ends at a lift or the base.'); y += 4;
  T('OPEN AND FLAT ON PURPOSE', 1); T('The pistes (wide open snow), the base village, the mid station and its lake,'); T('the temple top.'); y += 4;
  T('WALKED INTO', 1); T('The Ski Lodge, Rentals, the Ski Patrol, an inn and a shop on the Village Street,'); T('the Mid Station, the Top Station, the Warming Hut, the bath house, the Temple.'); })();
o.push('</svg>');
const dir = __dirname; fs.writeFileSync(path.join(dir, 'mountain-plan.svg'), o.join('\n'));
if (!process.argv.includes('--no-png')) (async () => { const { chromium } = require('playwright'); const b = await chromium.launch(require('fs').existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless'] } : {}); const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1.5 });
  await p.setContent('<body style="margin:0">' + o.join('\n') + '</body>'); await p.screenshot({ path: path.join(dir, 'mountain-plan.png') }); await b.close(); console.log('\nwrote mountain-plan.svg + mountain-plan.png (' + W + ' x ' + H + ')'); })();
