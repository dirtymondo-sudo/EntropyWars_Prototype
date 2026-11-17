#!/usr/bin/env node
/* bake-route.js — THE ROUTE KIT (2026-11-17, One World foundation: docs/plans/one-world/BUILD_PLAN.md phase 1, step 4).
   mondo's approved map v13 builds only the plots you can walk: the districts, the ROADS between them and the WILD LINKS.
   This tool takes a list of plots and writes ONE walkable route room into data.js, dressing each plot from its GROUND KIND on the
   map (forest, scrub, snow, grass, desert, rock) with pack models that are already in the game (MODEL_LIST.md), in three LOOKS:
     highway  two carriageways of asphalt with lane paint, sand shoulders, guard rails, road signs      (R1, R4, R9, the Desert Highway)
     road     a dirt road three squares wide, a ranch fence along the green stretches, milestones       (R6, R7, R8, R10, R11)
     trail    a footpath two squares wide that wanders, cairns and a trail sign                         (R2, R3, R5, R12, every wild link)
   A wild link is a trail one plot wide.

   node bake-route.js <id> [--look trail|road|highway] [--from i --to j] [--dry-run]
       <id> = a route (R1 … R12), a wild link (L1 … L16) or a Desert Highway leg (DH1 … DH4) of docs/plans/one-world/plots.json
       --from / --to = bake only that stretch of the plot list (0-based, both ends in): a long route is several rooms (THE ROOM-SPLITTING RULE)
   node bake-route.js --list                       every id, its look, its plots, its ground letters
   ROUTE_DUMP=1                                    prints the walked map (one letter a square)

   WHAT IT READS
     docs/plans/one-world/plots.json               the plots (in walking order), the band's legs, the ground letter of every plot
     docs/areas/routes/<ID>.json   (optional)      { room, hub, site, label, sub, look, from, to, ends: { '<seam id>': { room, at, label, sub, desc } },
                                                     proof: true (a room baked to try the kit: kept off the map) }
     docs/areas/routes/<ID>.js     (optional)      the places on the way, made by hand: module.exports = { dress(ctx) { … } } (ctx = the helpers below)
   WHAT IT WRITES
     data.js, between `OWROUTE <ID>-BEGIN / -END` inside the block `ONE WORLD ROUTES-BEGIN / -END` of DOOR_HQ.rooms: the room
     `site_ow_<id>` (or the spec's `room`). Never hand-edit between the markers: edit this tool, the spec or the hook and rerun.

   THE ROOM (the zone bakes' own format, so the engine needs nothing new)
     · its box = the plot list's bounding box on the world grid; `world: { hub, layer, wx, wy }` = where it stands (data.js THE ONE WORLD);
       `plots.mask` = which cells of the box are plots (a bent route's box holds scenery cells: ground you see, never walk);
     · the path runs down the middle of the band (the plot's middle for a link, the seam of the two plot columns for a road) and
       wanders by the look; it crosses every plot side at that side's middle, so two rooms always meet path to path;
     · every square of a route plot is walked, except a one-square verge on each side that faces scenery (two in forest), which
       carries the line of natural stoppers (rocks, bushes, logs, snow heaps, cactus) — never a made-up wall;
     · ground paint by the plot's kind, ragged where two kinds meet; heights = low rolling noise, the path eased flat. A climb, a
       ford, a camp or a well is made by hand in the hook file;
     · `terrain.edges = { world: true }`: the land past its lines is the map's own ground, plot by plot (three-renderer.js
       _hqEdgeLandFn; `ways` = its ends: the land stays low and open where the path goes on); `sky.landmarks: 'world'`: the far
       places stand at their true bearings (data.js hqOwLandmarks);
     · THE ENDS: where the path leaves the plot list it meets another room. The seam's id is the same on both sides:
       `ow_v_<x>_<y>` = the north-south line x at row y, `ow_h_<x>_<y>` = the east-west line y at column x (m = minus). The kit
       writes a `way: 'trail'` door there when that room is known (the spec's `ends`, or a placed room found on the map);
       otherwise it prints the seam so the zone thread adds both doors when its room stands.
   Notes: docs/notes/areas-complexes.md "ONE WORLD, THE ROUTE KIT". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, ARGV = process.argv.slice(2), DRY = ARGV.includes('--dry-run');
const arg = (k, d) => { const i = ARGV.indexOf(k); return i >= 0 ? ARGV[i + 1] : d; };
const PJ = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/plans/one-world/plots.json'), 'utf8'));
const C = 3.5, N = 12, PL = N * C;
const r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const groundAt = (x, y) => { const row = PJ.ground.rows[y - PJ.ground.y0], c = (row && row[x - PJ.ground.x0]) || '#'; return Object.assign({ c }, PJ.ground.key[c]); };

/* ── every id the map knows ── */
const SOURCES = {};
PJ.routes.forEach(r => { SOURCES[r.id] = { id: r.id, name: r.name, look: r.look, wide: r.wide, plots: r.plots, legs: r.legs, from: r.from, to: r.to, text: r.onTheWay }; });
PJ.links.forEach(l => { SOURCES[l.id] = { id: l.id, name: null, look: 'trail', wide: 1, plots: l.plots, legs: l.legs, from: l.from, to: l.to, hub: l.hub }; });
PJ.highway.legs.forEach((l, i) => { SOURCES['DH' + (i + 1)] = { id: 'DH' + (i + 1), name: 'The Desert Highway, ' + l.name, look: 'highway', wide: 2, plots: l.plots, legs: l.legs, hub: 'desert' }; });
const DNAME = {}; PJ.districts.forEach(d => { DNAME[d.id] = d; });
if (ARGV.includes('--list')) {
    Object.keys(SOURCES).forEach(id => { const s = SOURCES[id]; console.log(id.padEnd(4), s.look.padEnd(8), String(s.plots.length).padStart(3) + ' plots', (s.name || ((DNAME[s.from] || {}).name + ' to ' + (DNAME[s.to] || {}).name)).padEnd(46), s.plots.map(p => groundAt(p[0], p[1]).c).join('')); });
    process.exit(0);
}
const ID = ARGV.find(a => !a.startsWith('--') && SOURCES[a.toUpperCase()]) && ARGV.find(a => !a.startsWith('--') && SOURCES[a.toUpperCase()]).toUpperCase();
if (!ID) { console.error('bake-route: which route? `node bake-route.js --list` prints every id. (An underground walk needs the tunnel look: BUILD_PLAN phase 4.4.)'); process.exit(1); }
const SRC = SOURCES[ID];
const specFile = path.join(REPO, 'docs/areas/routes', ID + '.json'), hookFile = path.join(REPO, 'docs/areas/routes', ID + '.js');
const SPEC = fs.existsSync(specFile) ? JSON.parse(fs.readFileSync(specFile, 'utf8')) : {};
const HOOK = fs.existsSync(hookFile) ? require(hookFile) : null;
const LOOK = arg('--look', SPEC.look || SRC.look);
if (!{ trail: 1, road: 1, highway: 1 }[LOOK]) { console.error('bake-route: look must be trail, road or highway'); process.exit(1); }
const I0 = +(arg('--from', SPEC.from != null ? SPEC.from : 0)), I1 = +(arg('--to', SPEC.to != null ? SPEC.to : SRC.plots.length - 1));
const PLOTS = SRC.plots.slice(I0, I1 + 1);
if (!PLOTS.length) { console.error('bake-route: ' + ID + ' has no plots of its own (its two districts touch: join them door to door)'); process.exit(1); }
const STRETCH = (I0 > 0 || I1 < SRC.plots.length - 1) ? '_' + I0 + '_' + I1 : '';
const ROOM = SPEC.room || ('site_ow_' + ID.toLowerCase() + STRETCH);

const D = require('./load-data.js').loadGameData();
const HQ = D.DOOR_HQ, CAT = HQ.catalogue, TREES = vm.runInContext('HQ_TREE_KINDS', D);
const HUB = SPEC.hub || SRC.hub || (DNAME[SRC.from] || {}).hub || 'woods';
if (!HQ.hubs[HUB]) { console.error('bake-route: no hub ' + HUB); process.exit(1); }
const SITE = SPEC.site || (HQ.hubs[HUB].sites || [])[0];
const FROMN = (DNAME[SRC.from] || {}).name, TON = (DNAME[SRC.to] || {}).name;
const LABEL = SPEC.label || (SRC.name ? SRC.name.toUpperCase() : ('THE TRAIL · ' + String(FROMN).toUpperCase() + ' TO ' + String(TON).toUpperCase()));

/* ── the box ── */
const BX0 = Math.min(...PLOTS.map(p => p[0])), BY0 = Math.min(...PLOTS.map(p => p[1])), COLS = Math.max(...PLOTS.map(p => p[0])) - BX0 + 1, ROWS = Math.max(...PLOTS.map(p => p[1])) - BY0 + 1;
const W = COLS * N, Dq = ROWS * N, HX = W * C / 2, HZ = Dq * C / 2;
const gx = c => r2(-HX + c * C), gz = c => r2(-HZ + c * C), gcx = c => r2(-HX + (c + 0.5) * C), gcz = c => r2(-HZ + (c + 0.5) * C);
const inPlot = {}; PLOTS.forEach((p, i) => { inPlot[(p[0] - BX0) + ',' + (p[1] - BY0)] = i; });
const plotOf = (sx, sy) => (sx < 0 || sy < 0 || sx >= W || sy >= Dq) ? -1 : (inPlot[Math.floor(sx / N) + ',' + Math.floor(sy / N)] != null ? inPlot[Math.floor(sx / N) + ',' + Math.floor(sy / N)] : -1);
const kindOfCell = (cx, cy) => groundAt(BX0 + cx, BY0 + cy);
const kindAt = (sx, sy) => kindOfCell(Math.floor(sx / N), Math.floor(sy / N));

/* ── THE GROUND KINDS: the sheet, the path's sheet, the trees that stand in the walked ground, the scatter, the line of stoppers.
   Every key is in the game already (data.js DOOR_HQ.catalogue / HQ_TREE_KINDS; MODEL_LIST.md §6: the Retro Tree Pack's painted trees,
   the PSX graveyard pack's rocks and dead bushes, the Meshy wish-list plants, camp and snow pieces, the Roads pack's signs). `p` = how
   many a plot, about. The map's 18 kinds fold into these six through plots.json `ground.key[letter].kit`; a few wear their own tone. ── */
const KIT = {
    forest: { floor: 'grass_2', path: 'dirt_2', grass: true, verge: 1, treeKinds: ['tree_53', 'tree_55', 'tree_52', 'tree_53', 'tree_56', 'tree_55'], treeH: [6, 9], trees: 10,
        scatter: [['fern', 9], ['moss_clump', 4], ['fallen_log', 2], ['stump', 2], ['wild_flowers', 3], ['psxg_rock_2', 2], ['leafy_bush', 3]], stop: ['leafy_bush', 'fallen_log', 'psxg_rock_1', 'fern', 'stump'], mass: true },
    grass: { floor: 'grass_4', path: 'dirt_2', grass: true, verge: 1, treeKinds: ['tree', 'tree_4', 'tree_3'], treeH: [5, 8], trees: 3,
        scatter: [['wild_flowers', 8], ['leafy_bush', 3], ['psxg_rock_2', 2], ['psxg_rock_4', 3], ['fallen_log', 1]], stop: ['leafy_bush', 'psxg_rock_1', 'leafy_bush', 'wild_flowers', 'lake_rock'] },
    scrub: { floor: 'grass_rocky', path: 'dirt_4', verge: 1, treeKinds: ['tree_5', 'tree_6', 'tree_5'], treeH: [3.2, 6], trees: 3,
        scatter: [['psxg_dead_bush_1', 6], ['psxg_dead_bush_2', 4], ['tumbleweed', 3], ['psxg_rock_4', 4], ['cave_stone', 2], ['cattle_skull', 1]], stop: ['psxg_dead_bush_1', 'psxg_rock_1', 'psxg_dead_bush_2', 'cave_stone', 'tumbleweed'] },
    desert: { floor: 'desert', path: 'dirt_4', verge: 1, treeKinds: ['saguaro'], treeH: [3.8, 6.4], trees: 3,
        scatter: [['tumbleweed', 3], ['psxg_rock_4', 4], ['skull', 1], ['cattle_skull', 1], ['psxg_dead_bush_1', 3], ['cave_stone', 2]], stop: ['cave_stone', 'psxg_rock_1', 'psxg_dead_bush_1', 'psxg_rock_2', 'tumbleweed'] },
    snow: { floor: 'ice', path: 'ice_1', verge: 1, treeKinds: ['xmas_snow_pine', 'xmas_snow_pine_2', 'xmas_snow_pine_3'], treeH: [5.5, 8], trees: 4,
        scatter: [['snow_heap', 5], ['psxg_rock_3', 3], ['psxg_rock_2', 2], ['fallen_log', 1]], stop: ['snow_heap', 'psxg_rock_1', 'snow_heap', 'psxg_rock_3', 'psxg_rock_2'] },
    rock: { floor: 'rocks_5', path: 'dirt_4', verge: 1, treeKinds: ['pine', 'pine_2', 'tree_5'], treeH: [4.5, 7], trees: 2,
        scatter: [['psxg_rock_1', 5], ['psxg_rock_2', 5], ['psxg_rock_3', 4], ['cave_stone', 3], ['psxg_dead_bush_1', 2], ['dead_snag', 1]], stop: ['psxg_rock_1', 'cave_stone', 'psxg_rock_2', 'psxg_rock_3', 'lake_rock'] },
};
/* a map kind that wears its own tone of its kit kind */
const TONE = {
    wood: { treeKinds: ['tree', 'tree_4', 'tree_3', 'tree_53'], trees: 9, mass: true, scatter: [['fern', 5], ['wild_flowers', 5], ['fallen_log', 2], ['stump', 1], ['leafy_bush', 3], ['psxg_rock_2', 2]] },   // open woodland: lighter trees, fewer
    farm: { scatter: [['sunflowers', 4], ['wild_flowers', 6], ['leafy_bush', 2], ['psxg_rock_4', 2]], trees: 1 },
    meadow: { scatter: [['reeds', 4], ['wild_flowers', 9], ['leafy_bush', 3], ['lake_rock', 1]], trees: 2 },
    marsh: { scatter: [['reeds', 9], ['lake_rock', 2], ['moss_clump', 4]], trees: 1 },
    foot: { floor: 'grass_rocky', scatter: [['psxg_rock_1', 3], ['psxg_rock_2', 3], ['wild_flowers', 4], ['leafy_bush', 2], ['cave_stone', 1]], treeKinds: ['pine', 'tree_3', 'pine_2'], trees: 3 },
    alpine: { treeKinds: ['pine', 'pine', 'pine_2'], trees: 4 },
    bad: { floor: 'wasteland', treeKinds: ['tree_5'], trees: 1 },
    dunes: { trees: 1, scatter: [['psxg_rock_4', 2], ['skull', 1], ['tumbleweed', 2]] },
    saltflat: { floor: 'wasteland', trees: 0, scatter: [['psxg_rock_4', 3], ['cattle_skull', 1]] },
    sand: { treeKinds: ['palm'], treeH: [4.2, 5.4], trees: 2 },
    tundra: { trees: 1 }, peak: { trees: 0 }, ice: { trees: 0 },
};
const kitOf = g => { const base = KIT[g.kit] || KIT.grass; return Object.assign({}, base, TONE[g.kind] || {}); };
const SHOULDER = 'dirt_4', ASPH = 'urban:RoadGeneric1a';
const LOOKS = { trail: { hw: 1.0, wander: 2.4 }, road: { hw: 1.55, wander: 1.1 }, highway: { hw: 3.5, wander: 0 } };

/* ── dice: one stream a route, so a rebake never moves a piece ── */
const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const mkRnd = s => { let v = s >>> 0; return () => { v = (v + 0x6D2B79F5) >>> 0; let t = v; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const rnd = mkRnd(hashStr('route:' + ID + STRETCH));
const h2 = (x, y, k) => { let n = (x * 374761393 + y * 668265263 + (k || 0) * 2147483647 + hashStr(ID)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, y, k) => { const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, s = t => t * t * (3 - 2 * t), a = h2(x0, y0, k), b = h2(x0 + 1, y0, k), c = h2(x0, y0 + 1, k), d = h2(x0 + 1, y0 + 1, k); return a + (b - a) * s(fx) + (c - a) * s(fy) + (a - b - c + d) * s(fx) * s(fy); };

/* ── THE PATH: the band's middle line, in squares of this room ── */
const WIDE = SRC.wide;
/* THE LINE BY HAND (2026-11-17, the test slice): the spec's `line` = the path's own middle line in world plot coordinates ([x, y] corners, fractions allowed), for a
   stretch whose band's middle is not where the path can run (County Lane's bend: the corn's room holds the plots north of it). It must start and end OUTSIDE the
   plot list, so each end is found. Left out: the band's middle, from the map's legs. */
const LINE = SPEC.line ? SPEC.line.map(p => [(p[0] - BX0) * N, (p[1] - BY0) * N]) : SRC.legs.map(p => [(p[0] - BX0 + WIDE / 2) * N, (p[1] - BY0 + WIDE / 2) * N]);
const cell = []; for (let y = 0; y < Dq; y++) { cell.push(new Array(W).fill(' ')); }   // ' ' scenery, 'v' verge, 'g' walked ground, 'p' the path, 's' shoulder, 'm' median
for (let y = 0; y < Dq; y++) for (let x = 0; x < W; x++) if (plotOf(x, y) >= 0) cell[y][x] = 'g';
const pathPts = [];   // the path's own line, every quarter square: [x, y, dirx, diry, inside]
{ const LK = LOOKS[LOOK]; let s = 0;
  for (let i = 1; i < LINE.length; i++) {
      const [ax, ay] = LINE[i - 1], [bx, by] = LINE[i], len = Math.hypot(bx - ax, by - ay); if (!len) continue;
      const dx = (bx - ax) / len, dy = (by - ay) / len;
      for (let t = 0; t <= len; t += 0.25) {
          const x = ax + dx * t, y = ay + dy * t, inside = plotOf(Math.floor(x), Math.floor(y)) >= 0;
          /* the wander fades to nothing at a bend, at a plot side the path leaves the list by, and at each plot line it crosses in the middle of its run */
          const toEnd = Math.min(t, len - t), across = dx !== 0 ? Math.min((x % N + N) % N, N - ((x % N + N) % N)) : Math.min((y % N + N) % N, N - ((y % N + N) % N));
          const fade = Math.min(1, toEnd / 6) * Math.min(1, across / 4);
          const off = LK.wander * fade * (vnoise((s + t) / 7, 3.3, 11) - 0.5) * 2;
          pathPts.push([x - dy * off, y + dx * off, dx, dy, inside]);
      }
      s += len;
  } }
{ const LK = LOOKS[LOOK];
  pathPts.forEach(([px, py]) => { for (let y = Math.floor(py - LK.hw - 1); y <= Math.ceil(py + LK.hw + 1); y++) for (let x = Math.floor(px - LK.hw - 1); x <= Math.ceil(px + LK.hw + 1); x++) {
      if (plotOf(x, y) < 0) continue; const d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
      if (LOOK === 'highway') { if (d <= 0.5) cell[y][x] = 'm'; else if (d <= LK.hw && cell[y][x] !== 'm') cell[y][x] = 'p'; else if (d <= LK.hw + 1 && cell[y][x] === 'g') cell[y][x] = 's'; }
      else if (d <= LK.hw) cell[y][x] = 'p'; } }); }
/* THE PLAN BY HAND (2026-11-17): the hook file's plan(ctx) may lay more path squares before the verge, the heights and the paint are read (a footpath off the road
   to a side door): ctx.path(sx, sy) makes a square of a route plot path */
if (HOOK && typeof HOOK.plan === 'function') HOOK.plan({ ID, ROOM, LOOK, N, W, D: Dq, BX0, BY0, COLS, ROWS, PLOTS, cell, plotOf, path: (x, y) => { if (plotOf(x, y) >= 0) cell[y][x] = 'p'; } });
/* the verge: the outer squares of a route plot on every side that faces scenery (a square of the path stays the path: an end) */
for (let y = 0; y < Dq; y++) for (let x = 0; x < W; x++) {
    if (cell[y][x] !== 'g') continue;
    const v = kitOf(kindAt(x, y)).verge; let edge = false;
    for (let k = 1; k <= v && !edge; k++) if (plotOf(x - k, y) < 0 || plotOf(x + k, y) < 0 || plotOf(x, y - k) < 0 || plotOf(x, y + k) < 0) edge = true;
    if (edge) cell[y][x] = 'v';
}
const walked = (x, y) => x >= 0 && y >= 0 && x < W && y < Dq && 'gpsm'.includes(cell[y][x]);
const nearPath = (x, y, r) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const c = (cell[y + j] || [])[x + i]; if (c === 'p' || c === 'm' || c === 's') return true; } return false; };

/* ── THE ENDS: where the path's line leaves the plot list ── */
const ENDS = [];
{ const mm = v => (v < 0 ? 'm' + (-v) : '' + v);
  for (let i = 1; i < pathPts.length; i++) { const a = pathPts[i - 1], b = pathPts[i]; if (a[4] === b[4]) continue;
      const inP = a[4] ? a : b, outP = a[4] ? b : a, dx = Math.round(outP[2]) * (a[4] ? 1 : -1), dy = Math.round(outP[3]) * (a[4] ? 1 : -1);
      /* the line crossed, on the plot grid, and the plot past it */
      const sx = Math.floor(inP[0]), sy = Math.floor(inP[1]), cx = Math.floor(sx / N), cy = Math.floor(sy / N), wxp = BX0 + cx + dx, wyp = BY0 + cy + dy;
      const side = dx > 0 ? 'e' : dx < 0 ? 'w' : dy > 0 ? 's' : 'n';
      const id = dx ? 'ow_v_' + mm(BX0 + cx + (dx > 0 ? 1 : 0)) + '_' + mm(BY0 + cy) : 'ow_h_' + mm(BX0 + cx) + '_' + mm(BY0 + cy + (dy > 0 ? 1 : 0));
      if (ENDS.some(e => e.id === id)) continue;
      const onWall = (side === 'e' && cx === COLS - 1) || (side === 'w' && cx === 0) || (side === 's' && cy === ROWS - 1) || (side === 'n' && cy === 0);
      ENDS.push({ id, side, onWall, past: [wxp, wyp], sq: [sx, sy], along: dx ? gz(Math.round(inP[1])) : gx(Math.round(inP[0])) }); } }

/* ── THE HEIGHTS: low rolling ground, the path eased flat ── */
const AMP = { forest: 0.5, grass: 0.6, scrub: 0.8, desert: 0.55, snow: 0.7, rock: 1.1 };
const Hc = new Float32Array((W + 1) * (Dq + 1));
for (let y = 0; y <= Dq; y++) for (let x = 0; x <= W; x++) {
    const g = kindAt(Math.min(W - 1, x), Math.min(Dq - 1, y)), wx = (BX0 * N + x), wy = (BY0 * N + y);   // world squares: two rooms' grounds roll on the same noise
    let near = 9; for (let j = -2; j <= 1; j++) for (let i = -2; i <= 1; i++) { const c = (cell[y + j] || [])[x + i]; if (c === 'p' || c === 'm' || c === 's') near = Math.min(near, Math.max(Math.abs(i + 0.5), Math.abs(j + 0.5))); }
    const ease = LOOK === 'trail' ? Math.min(1, 0.45 + near / 4) : Math.min(1, near / 3);
    Hc[y * (W + 1) + x] = (AMP[g.kit] || 0.6) * ease * ((vnoise(wx / 9, wy / 9, 1) - 0.5) * 2 + (vnoise(wx / 3.1, wy / 3.1, 2) - 0.5) * 0.35);
}
const slope = Buffer.alloc(W * Dq * 8);
for (let cy = 0; cy < Dq; cy++) for (let cx = 0; cx < W; cx++) { const o = (cy * W + cx) * 8; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((q, k) => slope.writeInt16LE(Math.round(Hc[(cy + q[1]) * (W + 1) + cx + q[0]] * 100), o + k * 2)); }
const hAt = (sx, sy) => { const x = Math.max(0, Math.min(W - 1, Math.floor(sx))), y = Math.max(0, Math.min(Dq - 1, Math.floor(sy))); return (Hc[y * (W + 1) + x] + Hc[y * (W + 1) + x + 1] + Hc[(y + 1) * (W + 1) + x] + Hc[(y + 1) * (W + 1) + x + 1]) / 4; };

/* ── THE PAINT: the plot's ground sheet, ragged where two kinds meet; the path's sheet over it ── */
const counts = {}; for (let cy = 0; cy < ROWS; cy++) for (let cx = 0; cx < COLS; cx++) { const f = kitOf(kindOfCell(cx, cy)).floor; counts[f] = (counts[f] || 0) + (inPlot[cx + ',' + cy] != null ? 3 : 1); }
const FLOOR = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
const PAL = [], pal = key => { if (key === FLOOR) return 0; let i = PAL.indexOf(key); if (i < 0) { PAL.push(key); i = PAL.length - 1; } return i + 1; };
const paint = new Uint8Array(W * Dq);
for (let y = 0; y < Dq; y++) for (let x = 0; x < W; x++) {
    /* the ground of the plot, or of the next plot over when the square lies in the ragged band along their line */
    const lx = x % N, ly = y % N; let cx = Math.floor(x / N), cy = Math.floor(y / N);
    const n = vnoise((BX0 * N + x) / 2.3, (BY0 * N + y) / 2.3, 5) * 5;
    if (lx < n - 1.5 && cx > 0) cx--; else if (N - 1 - lx < n - 2.5 && cx < COLS - 1) cx++;
    if (ly < n - 1.5 && cy > 0) cy--; else if (N - 1 - ly < n - 2.5 && cy < ROWS - 1) cy++;
    const k = kitOf(kindOfCell(cx, cy)), ch = cell[y][x];
    paint[y * W + x] = pal(ch === 'p' ? (LOOK === 'highway' ? ASPH : kitOf(kindAt(x, y)).path) : (ch === 's' || ch === 'm') ? SHOULDER : k.floor);
}

/* ── placing things ── */
const F = [], props = [], doors = [], marks = [], npc = [], taken = new Set(), errs = [];
const feat = o => { F.push(o); return o; };
const free = (sx, sy) => walked(sx, sy) && !taken.has(sx + ':' + sy) && !nearPath(sx, sy, 1);
const P = (key, sx, sy, o) => { if (!CAT[key]) { errs.push('not in the catalogue: ' + key); return; } taken.add(sx + ':' + sy); props.push(Object.assign({ key, x: gcx(sx), z: gcz(sy) }, o || {})); };
const dec = (key, sx, sy, o) => { if (!CAT[key]) { errs.push('not in the catalogue: ' + key); return; } props.push(Object.assign({ key, x: r2(gcx(sx) + (rnd() - 0.5) * 1.6), z: r2(gcz(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); };
const tree = (sx, sy, kind, h) => { if (!TREES[kind]) { errs.push('not a tree kind: ' + kind); return; } taken.add(sx + ':' + sy); feat({ k: 'tree', x: gcx(sx), z: gcz(sy), kind, h: r2(h), r: 0.8 }); };
const pick = a => a[Math.floor(rnd() * a.length)];

/* plot by plot: the trees in the walked ground, the scatter, the stoppers on the verge */
PLOTS.forEach((p, pi) => {
    const cx = p[0] - BX0, cy = p[1] - BY0, K = kitOf(groundAt(p[0], p[1]));
    const spots = []; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) spots.push([cx * N + lx, cy * N + ly]);
    for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = spots[i]; spots[i] = spots[j]; spots[j] = t; }
    let it = 0; const next = (ok) => { for (; it < spots.length; it++) { const s = spots[it]; if (ok(s[0], s[1])) { it++; return s; } } return null; };
    for (let n = 0; n < (K.trees || 0); n++) { const s = next((x, y) => free(x, y) && !nearPath(x, y, 2)); if (!s) break; tree(s[0], s[1], pick(K.treeKinds), K.treeH[0] + rnd() * (K.treeH[1] - K.treeH[0])); }
    (K.scatter || []).forEach(([key, n]) => { for (let q = 0; q < n; q++) { const s = next(free); if (!s) return; if (CAT[key] && CAT[key].block) P(key, s[0], s[1], { face: Math.round(rnd() * 360) }); else dec(key, s[0], s[1]); } });
    /* the line of stoppers: about every second verge square of this plot (not in a forest's mass: its trees are the line) */
    if (!K.mass) for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const x = cx * N + lx, y = cy * N + ly; if (cell[y][x] !== 'v' || h2(x, y, 7) > 0.42) continue;
        const key = K.stop[Math.floor(h2(x, y, 8) * K.stop.length)]; if (!CAT[key]) { errs.push('not in the catalogue: ' + key); continue; }
        props.push({ key, x: r2(gcx(x) + (h2(x, y, 9) - 0.5) * 1.8), z: r2(gcz(y) + (h2(x, y, 10) - 0.5) * 1.8), face: Math.round(h2(x, y, 12) * 360) }); }
});

/* ── THE LOOK'S OWN PIECES ── */
const straight = [];   // the straight runs of the middle line inside the plot list: [x0, y0, x1, y1] in squares
for (let i = 1; i < LINE.length; i++) { const [ax, ay] = LINE[i - 1], [bx, by] = LINE[i], len = Math.hypot(bx - ax, by - ay); if (!len) continue; const dx = (bx - ax) / len, dy = (by - ay) / len; let t0 = null;
    for (let t = 0; t <= len + 0.01; t += 0.5) { const x = ax + dx * t, y = ay + dy * t, ins = plotOf(Math.floor(x - dx * 0.01), Math.floor(y - dy * 0.01)) >= 0 || plotOf(Math.floor(x), Math.floor(y)) >= 0;
        if (ins && t0 == null) t0 = t; if ((!ins || t + 0.5 > len + 0.01) && t0 != null) { const t1 = ins ? t : t - 0.5; if (t1 - t0 >= 2) straight.push([ax + dx * t0, ay + dy * t0, ax + dx * t1, ay + dy * t1]); t0 = null; } } }
const M = (x, y) => [r2(-HX + x * C), r2(-HZ + y * C)];
if (LOOK === 'highway') {
    const WHITE = 0xf0f0f0, YEL = 0xe8b830, line = (a, b, w, color) => marks.push({ k: 'line', x0: a[0], z0: a[1], x1: b[0], z1: b[1], w, color });
    straight.forEach(([x0, y0, x1, y1]) => { const len = Math.hypot(x1 - x0, y1 - y0), dx = (x1 - x0) / len, dy = (y1 - y0) / len, nx = -dy, ny = dx, at = (t, o) => M(x0 + dx * t + nx * o, y0 + dy * t + ny * o);
        [-1, 1].forEach(sd => { line(at(0, sd * 0.6), at(len, sd * 0.6), 0.16, YEL); line(at(0, sd * 3.4), at(len, sd * 3.4), 0.14, WHITE);
            [1.5, 2.5].forEach(o => { for (let t = 1; t + 2 <= len; t += 4) line(at(t, sd * o), at(t + 2, sd * o), 0.14, WHITE); });
            /* a guard rail along the shoulder, in runs with gaps (you can step off the road) */
            for (let t = 3; t + 9 <= len; t += 16) { const a = at(t, sd * 4.6), b = at(t + 9, sd * 4.6); feat({ k: 'rail', x0: a[0], z0: a[1], x1: b[0], z1: b[1], model: 'guard' }); } });
        const sx = Math.round(x0 + dx * Math.min(6, len / 2) + nx * 5.5), sy = Math.round(y0 + dy * Math.min(6, len / 2) + ny * 5.5); if (walked(sx, sy)) P(pick(['roads_g_sign_003', 'roads_g_sign_000', 'roads_g_sign_005']), sx, sy, { face: Math.round(Math.atan2(dx, -dy) * 180 / Math.PI + 180) }); });
} else if (LOOK === 'road') {
    straight.forEach(([x0, y0, x1, y1]) => { const len = Math.hypot(x1 - x0, y1 - y0), dx = (x1 - x0) / len, dy = (y1 - y0) / len, nx = -dy, ny = dx;
        /* a ranch fence along one side where the ground is green, in runs; a milestone a plot */
        for (let t = 2; t + 7 <= len; t += 12) { const mx = x0 + dx * (t + 3.5), my = y0 + dy * (t + 3.5), g = kindAt(Math.floor(mx), Math.floor(my)); if (g.kit !== 'grass' && g.kit !== 'forest') continue;
            const sd = h2(Math.round(mx), Math.round(my), 21) < 0.5 ? -1 : 1, a = M(x0 + dx * t + nx * sd * 3.2, y0 + dy * t + ny * sd * 3.2), b = M(x0 + dx * (t + 7) + nx * sd * 3.2, y0 + dy * (t + 7) + ny * sd * 3.2);
            feat({ k: 'rail', x0: a[0], z0: a[1], x1: b[0], z1: b[1], model: 'ranch' }); }
        for (let t = 6; t < len; t += N) { const sx = Math.round(x0 + dx * t - nx * 2.6), sy = Math.round(y0 + dy * t - ny * 2.6); if (walked(sx, sy) && cell[sy][sx] !== 'p') P('milestone', sx, sy, { face: Math.round(Math.atan2(nx, -ny) * 180 / Math.PI) }); } });
} else {
    /* a cairn where the trail turns, and one every third plot beside it */
    for (let i = 1; i + 1 < LINE.length; i++) { const sx = Math.round(LINE[i][0]) + 2, sy = Math.round(LINE[i][1]) + 2; if (walked(sx, sy) && cell[sy][sx] !== 'p') P('cairn', sx, sy); }
    PLOTS.forEach((p, pi) => { if (pi % 3 !== 1) return; const x0 = (p[0] - BX0) * N, y0 = (p[1] - BY0) * N; for (let k = 0; k < 40; k++) { const sx = x0 + 2 + Math.floor(rnd() * 8), sy = y0 + 2 + Math.floor(rnd() * 8); if (walked(sx, sy) && cell[sy][sx] === 'g' && nearPath(sx, sy, 2) && !taken.has(sx + ':' + sy)) { P('cairn', sx, sy); break; } } });
}
/* a sign at each end, beside the path, facing the walker who comes in */
ENDS.forEach(e => { const [sx, sy] = e.sq, dx = e.side === 'e' ? -1 : e.side === 'w' ? 1 : 0, dy = e.side === 's' ? -1 : e.side === 'n' ? 1 : 0;
    const key = LOOK === 'highway' ? 'roads_g_sign_003' : LOOK === 'road' ? 'signpost' : 'trail_sign', off = LOOKS[LOOK].hw + 1.6;
    for (const sd of [1, -1]) { const x = Math.round(sx + dx * 3 + (dy ? sd * off : 0)), y = Math.round(sy + dy * 3 + (dx ? sd * off : 0)); if (walked(x, y) && cell[y][x] !== 'p' && !taken.has(x + ':' + y)) { P(key, x, y, { face: e.side === 'n' ? 0 : e.side === 'e' ? 90 : e.side === 's' ? 180 : 270 }); break; } } });

/* ── the places made by hand (docs/areas/routes/<ID>.js) ── */
const CTX = { ID, ROOM, LOOK, C, N, W, D: Dq, BX0, BY0, COLS, ROWS, PLOTS, cell, gx, gz, gcx, gcz, r2, walked, free, nearPath, plotOf, kindAt, groundAt, hAt, feat, props, npc, doors, marks, P, dec, tree, rnd, pick, taken, ENDS, CAT };
if (HOOK && typeof HOOK.dress === 'function') HOOK.dress(CTX);

/* ── THE DOORS at the ends: the spec's word, or the placed room the map finds past the line ── */
const OW = { at: (x, y) => { try { return D.hqOwAt(x, y, 'surface'); } catch (e) { return null; } } };
const open = [];
ENDS.forEach(e => {
    const s = (SPEC.ends || {})[e.id], found = OW.at(e.past[0], e.past[1]), to = (s && s.room) || (found && found.room !== ROOM && found.room) || null;
    const g = groundAt(e.past[0], e.past[1]);
    if (!to) { open.push(e.id + '  ' + e.side + ' side, world plot ' + e.past.join(',') + ' (' + g.kind + '): no room stands there yet'); return; }
    const far = HQ.rooms[to] || {}, d = { id: e.id, way: 'trail', label: (s && s.label) || String(far.label || to).toUpperCase(), sub: (s && s.sub) || LABEL, action: { room: to, at: (s && s.at) || e.id }, desc: (s && s.desc) || 'The path goes on.' };
    if (e.onWall) { d.wall = e.side; if (e.side === 'n' || e.side === 's') d.x = e.along; else d.z = e.along; }
    else { d.wall = 'free'; d.x = gcx(e.sq[0]); d.z = gcz(e.sq[1]); d.face = e.side === 'n' ? 0 : e.side === 'e' ? 90 : e.side === 's' ? 180 : 270; }
    doors.push(d);
});

/* ── THE OPEN GROUND: every walked square, as `space` rows (greedy rectangles) ── */
const spaces = [];
{ const used = new Uint8Array(W * Dq);
  for (let cy = 0; cy < Dq; cy++) for (let cx = 0; cx < W; cx++) { if (!walked(cx, cy) || used[cy * W + cx]) continue;
      let w = 1; while (cx + w < W && !used[cy * W + cx + w] && walked(cx + w, cy)) w++;
      let h = 1; rows: while (cy + h < Dq) { for (let i = 0; i < w; i++) if (used[(cy + h) * W + cx + i] || !walked(cx + i, cy + h)) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(cy + j) * W + cx + i] = 1;
      spaces.push({ k: 'space', x: r2(gx(cx) + w * C / 2), z: r2(gz(cy) + h * C / 2), w: w * C, d: h * C }); } }

/* ── THE MASS: what the squares nobody walks grow (terrain.gen plan / look trees): a forest plot's trees; open ground grows nothing ── */
const zones = [];
for (let cy = 0; cy < ROWS; cy++) for (let cx = 0; cx < COLS; cx++) { const K = kitOf(kindOfCell(cx, cy)), z = { x0: gx(cx * N), z0: gz(cy * N), x1: gx((cx + 1) * N), z1: gz((cy + 1) * N) };
    if (K.mass) { z.kinds = K.treeKinds; z.treeH = K.treeH; } else z.none = true; zones.push(z); }
const anyMass = zones.some(z => !z.none);

/* ── checks: the path is one piece from end to end; every plot is walked to; nothing stands on the path ── */
const pathSq = []; for (let y = 0; y < Dq; y++) for (let x = 0; x < W; x++) if ('pm'.includes(cell[y][x])) pathSq.push([x, y]);
if (!pathSq.length) errs.push('no path was drawn');
const SPQ = (ENDS[0] && ENDS[0].sq) || pathSq[0] || [0, 0];
{ const seen = new Uint8Array(W * Dq), st = [SPQ], blocked = new Set(); props.forEach(p => { if (CAT[p.key] && CAT[p.key].block) blocked.add(Math.floor((p.x + HX) / C) + ':' + Math.floor((p.z + HZ) / C)); }); F.forEach(f => { if (f.k === 'tree') blocked.add(Math.floor((f.x + HX) / C) + ':' + Math.floor((f.z + HZ) / C)); });
  pathSq.forEach(([x, y]) => { if (blocked.has(x + ':' + y)) errs.push('something stands on the path at ' + x + ',' + y); });
  seen[SPQ[1] * W + SPQ[0]] = 1; let steep = 0;
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!walked(X, Y) || seen[Y * W + X] || blocked.has(X + ':' + Y)) continue;
      if (Math.abs(hAt(X, Y) - hAt(x, y)) / C > 0.3) { steep++; continue; } seen[Y * W + X] = 1; st.push([X, Y]); } }
  const cold = PLOTS.filter(p => { const x0 = (p[0] - BX0) * N, y0 = (p[1] - BY0) * N; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(y0 + ly) * W + x0 + lx]) return false; return true; });
  if (cold.length) errs.push('plots not reached on foot: ' + cold.map(p => p.join(',')).join(' '));
  pathSq.forEach(([x, y]) => { if (!seen[y * W + x]) errs.push('the path is cut at ' + x + ',' + y); });
  if (process.env.ROUTE_DUMP) console.log(cell.map((r, y) => r.map((ch, x) => blocked.has(x + ':' + y) ? 'o' : walked(x, y) && !seen[y * W + x] ? '!' : ch).join('')).join('\n'));
  if (steep) console.log('steep steps not crossed: ' + steep); }
npc.forEach(n => { if (vm.runInContext('AVAILABLE_RACES', D).indexOf(n.race) < 0) errs.push('not a unit: ' + n.race); });
const uniqErr = [...new Set(errs)]; if (uniqErr.length) { console.error(uniqErr.slice(0, 30).join('\n')); process.exit(1); }

/* ── the sky + the room ── */
const major = (() => { const c = {}; PLOTS.forEach(p => { const k = groundAt(p[0], p[1]).kit; c[k] = (c[k] || 0) + 1; }); return Object.keys(c).sort((a, b) => c[b] - c[a])[0]; })();
const SKY = { forest: { tint: 0xa9c4dc, fog: 0xb4c6b6, density: 0.009, clouds: 0.3, light: 0xfff2dc, ambient: 0.52 }, grass: { tint: 0xa9c8e8, fog: 0xc2d2c4, density: 0.007, clouds: 0.3, light: 0xfff4e0, ambient: 0.56 },
    scrub: { tint: 0xd8c08a, fog: 0xd6c298, density: 0.009, clouds: 0.1, light: 0xfff0d0, ambient: 0.6 }, desert: { tint: 0xd9b46a, fog: 0xd8b370, density: 0.012, clouds: 0.05, light: 0xfff0d0, ambient: 0.62 },
    snow: { tint: 0x9fc4e8, fog: 0xbfd8ea, density: 0.006, clouds: 0.35, light: 0xf0f6ff, ambient: 0.6 }, rock: { tint: 0xa8bcd4, fog: 0xc0c8d0, density: 0.007, clouds: 0.35, light: 0xfff4e6, ambient: 0.56 } }[major];
const hex = n => '0x' + n.toString(16).padStart(6, '0');
const SP = { x: gcx(SPQ[0]), z: gcz(SPQ[1]) }, face = ENDS[0] ? ({ n: 180, s: 0, w: 90, e: 270 })[ENDS[0].side] : 180;
const names = PLOTS.map((p, i) => ['P' + String(p[0] - BX0).padStart(2, '0') + '-' + String(p[1] - BY0).padStart(2, '0'), (SRC.name || 'The trail') + ', ' + PJ.ground.key[groundAt(p[0], p[1]).c].label.toLowerCase(), 'R', 0]);
const mask = []; for (let cy = 0; cy < ROWS; cy++) { let s = ''; for (let cx = 0; cx < COLS; cx++) s += inPlot[cx + ',' + cy] != null ? '#' : '.'; mask.push(s); }
const grounds = [...new Set(PLOTS.map(p => groundAt(p[0], p[1]).kind))];
const L = [];
L.push("        /* OWROUTE " + ID + STRETCH + "-BEGIN — written by `node bake-route.js " + ID + (STRETCH ? ' --from ' + I0 + ' --to ' + I1 : '') + "` from docs/plans/one-world/plots.json (THE ROUTE KIT). Never hand-edit between the markers. */");
L.push("        " + ROOM + ": {");
L.push("            label: " + J(LABEL) + ",");
L.push("            sub: " + J(SPEC.sub || (LOOK.toUpperCase() + ' · ' + PLOTS.length + ' PLOT' + (PLOTS.length === 1 ? '' : 'S'))) + ",");
L.push("            kind: 'box', site: " + J(SITE) + ", part: " + J('ow_' + ID.toLowerCase() + STRETCH) + ",");
L.push("            /* THE ONE WORLD: where this room stands on the world's plot grid (data.js hqOwIndex) */");
L.push("            world: { hub: " + J(HUB) + ", layer: 'surface', wx: " + BX0 + ", wy: " + BY0 + ", route: " + J(ID) + ", look: " + J(LOOK) + (SPEC.proof ? ", proof: true" : "") + " }," + (SPEC.proof ? "   // proof: a room baked to prove the kit: it stands on the world grid, but no door leads to it and bake-map.js keeps it off the map" : ""));
L.push("            shell: hqAncientShell({ w: " + (2 * HX) + ", d: " + (2 * HZ) + ", h: 20, wallH: 20, floor: " + J(FLOOR) + ", apron: " + J(FLOOR) + ", skirt: 'dirt_2', apronColor: 0xffffff, floorColor: 0xffffff, plate: { x: " + SP.x + ", z: " + SP.z + ", y: 5.0 },");
L.push("                                    mood: { lamp: 0xffb060, glow: 0xff9a40, strip: 0xffd8a0, light: " + hex(SKY.light) + ", ambient: " + SKY.ambient + " },");
L.push("                                    sky: { night: 0, tint: " + hex(SKY.tint) + ", tintAmt: 0.32, stars: 0.5, nebula: 0.4, day: 1, clouds: " + SKY.clouds + ", fog: { color: " + hex(SKY.fog) + ", amount: 0.5, top: 0.05, band: 0.45, density: " + SKY.density + " }, scenery: 'none', landmarks: 'world' },");
L.push("                                    look: HQ_ROOM_LOOKS.plateau }),");
L.push("            parti: " + J('A ' + LOOK + ' across ' + PLOTS.length + ' plot' + (PLOTS.length === 1 ? '' : 's') + ' of open country (' + grounds.join(', ') + '): the way between two places, with the land it crosses on either side.') + ",");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + COLS + ", nx: " + COLS + ", nz: " + ROWS + ", mask: " + J(mask) + ", names: " + J(names) + " },");
L.push("            terrain: {");
L.push("                res: 1.75, floor: " + J(FLOOR) + ", cliff: 'rocks_5', path: 'dirt_2',");
L.push("                noise: { amp: 0.08, scale: 9 },");
if (grounds.some(k => KIT[PJ.ground.key[Object.keys(PJ.ground.key).find(c => PJ.ground.key[c].kind === k)].kit].grass)) L.push("                grassField: true,");
L.push("                /* THE HORIZON READS THE MAP: the land past every line is the world's own ground there, plot by plot (three-renderer.js _hqEdgeLandFn `world`) */");
L.push("                backdrop: false, edges: { world: true, reach: 440, ways: " + J(ENDS.filter(e => e.onWall).map(e => ({ side: e.side, at: e.along }))) + " },");
L.push("                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gz(0) + ", nx: " + W + ", nz: " + Dq + ", d: '" + slope.toString('base64') + "' } },");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gcx(0) + ", z0: " + gcz(0) + ", nx: " + W + ", nz: " + Dq + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                /* every square that is not a `space` is ground nobody walks: a forest plot grows its trees there, open ground grows nothing */");
L.push("                gen: { kind: 'plan', look: 'trees', seed: " + (hashStr(ID) % 97) + ", rim: 0, forceGrow: 0, treeGap: 2.6, treeIn: 0.9, spacing: 3.5, depth: 5.25, maxTrees: " + (anyMass ? Math.min(2400, 220 * PLOTS.length) : 0) + ", treeH: [5.5, 8.5], kinds: " + J(KIT.forest.treeKinds) + ", zones: " + J(zones) + " },");
if (marks.length) L.push("                marks: " + J(marks) + ",");
L.push("                features: [");
spaces.concat(F).forEach(f => L.push("                    " + J(f) + ","));
L.push("                ],");
L.push("            },");
L.push("            doors: [");
doors.forEach(d => L.push("                " + J(d) + ","));
L.push("            ],");
L.push("            counters: [],");
L.push("            props: [");
for (let i = 0; i < props.length; i += 4) L.push("                " + props.slice(i, i + 4).map(J).join(", ") + ",");
L.push("            ],");
L.push("            agents: [],");
L.push("            npcSpots: " + J(npc) + ",");
L.push("            onlineSpots: [],");
L.push("            lines: [],");
L.push("            spawn: { x: " + SP.x + ", z: " + SP.z + ", face: " + face + " },");
L.push("        },");
L.push("        /* OWROUTE " + ID + STRETCH + "-END */");
const block = L.join('\n') + '\n';
const count = { room: ROOM, look: LOOK, plots: PLOTS.length, box: COLS + ' x ' + ROWS, world: [BX0, BY0], ground: PLOTS.map(p => groundAt(p[0], p[1]).c).join(''), squares: W * Dq, walked: spaces.reduce((n, s) => n + (s.w / C) * (s.d / C), 0), spaces: spaces.length, trees: F.filter(f => f.k === 'tree').length, props: props.length, rails: F.filter(f => f.k === 'rail').length, marks: marks.length, doors: doors.length, ends: ENDS.map(e => e.id) };
console.log(JSON.stringify(count));
if (open.length) { console.log('ENDS WITH NO ROOM YET (the zone thread adds the door pair when its room stands; the seam id is the door id on both sides):'); open.forEach(o => console.log('  ' + o)); }
if (DRY) process.exit(0);

/* ── into data.js ── */
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const BOX0 = '        /* ONE WORLD ROUTES-BEGIN', BOX1 = '        /* ONE WORLD ROUTES-END */\n';
if (src.indexOf(BOX0) < 0) {
    const anchor = '        /* ESTATE36-BEGIN', a = src.indexOf(anchor); if (a < 0) throw new Error('anchor not found in data.js (ESTATE36-BEGIN)');
    src = src.slice(0, a) + BOX0 + " — THE ROUTE KIT's rooms (2026-11-17, One World): one block a route, each written by `node bake-route.js <id>` between its own OWROUTE markers. Never hand-edit. */\n" + BOX1 + src.slice(a);
}
const END = '        /* OWROUTE ' + ID + STRETCH + '-END */\n', b0 = src.indexOf('        /* OWROUTE ' + ID + STRETCH + '-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const at = src.indexOf(BOX1); src = src.slice(0, at) + block + src.slice(at); }
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOM + ' written (' + block.length + ' bytes). Then: node --check data.js' + (SPEC.proof ? ' (a proof room: not on the map).' : '; node bake-map.js ' + ROOM + ' (its map picture + its row in HQ_ZONE_MAP).'));
