#!/usr/bin/env node
/* bake-sewers.js — THE SEWERS ON PLOTS (2026-11-16, mondo's OK on plot plan 3, docs/plans/world-zones/sewers_plot_plan_3.png: "that's good",
   then "changes in elevation for these rooms too" and waterfalls). The dungeon under Disaster City, an underground hub in its own place:
   6 x 4 plots of 12 x 12 squares (252 x 168 m), a maze. Four districts:
   W THE SEWERS (15 plots), T THE RUNNING TUNNELS (5), H THE HOLDING CELLS (2), O THE OLD WORKINGS (2).
   Reads docs/areas/sewers/layout.json (every plot's name, district, level, openings, and the 72 x 48 square map) and writes the room
   `site_prebuilt_downtown_underworld` into data.js between SEWERS24-BEGIN / SEWERS24-END. `node bake-sewers.js` writes; `--dry-run` prints the
   counts; `SEWERS_DUMP=1` prints the walked map. Never hand-edit between the markers: edit this tool, the layout or a district file and rerun.
   Notes: docs/notes/areas-complexes.md "THE SEWERS ON PLOTS".

   THE DISTRICT FILES (from the first build, mondo 11-16: "every single zone needs to be like that. now. so we can work in parallel"): what
   stands in a district is written in docs/areas/sewers/districts/<W T H O>.js, one thread a file. This tool keeps what is shared: the plan,
   the levels, the openings between plots (stairs, climbs, waterfalls), the water, the rails, the ways out, the shell, the checks.

   THE SQUARE MAP: x = solid ground (the wall), o = walkway / mine floor, w = water, f = concrete room, j = rail track, b = plank over water.
   Squares are (sx 0..72 west to east, sy 0..48 north to south); gx() = a square's west / north line in metres, gc() = its middle.
   THE LEVELS: one height a plot (layout `level`, 1 level = 1.75 m), a whole-plot plateau. Level 0 = the old mine, the track and the Outfall's
   shaft, 4 = the lower sewers (the Junction's row, the Cistern), 8 = the upper sewers (the two north rows), 9 = the cells (a fall = 7 m). Where an opening joins two levels (layout `openings`):
     fall   an upper culvert's mouth pours a whole drop into a lower ROOM's water (a `fall` row, three-renderer.js THE WATERFALLS);
            the way up beside it is the opening's `by`: 'stair' (a flight along the room's wall) or 'ladder'
     stair  a dry stair (the cell door, the Maintenance Hatch)
     climb  a ladder or a rope on the face (the trap, the Adit, the well at the Junction) */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/sewers/layout.json'), 'utf8'));
const C = 3.5, N = 12, GX = PLAN.cols, GY = PLAN.rows, W = N * GX, Hh = N * GY, HX = W * C / 2, HZ = Hh * C / 2, LEVEL = 1.75, CEIL = 5.25;
const ROOM = 'site_prebuilt_downtown_underworld', PART = 'underworld';
const OLD = ['site_prebuilt_downtown_sewers', 'site_prebuilt_downtown_tunnels', 'site_prebuilt_downtown_cells', 'site_prebuilt_downtown_workings'];
const r2 = v => Math.round(v * 100) / 100, gx = c => r2(-HX + c * C), gz = c => r2(-HZ + c * C), gcx = c => r2(-HX + (c + 0.5) * C), gcz = c => r2(-HZ + (c + 0.5) * C);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
/* the old rooms' people, lines and door plates keep their own words: read from the old literals (so the four old literals stay in data.js) */
const OLDR = id => JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [], d: (r.doors || []).map(d => ({ id: d.id, label: d.label, sub: d.sub, desc: d.desc, leaf: d.leaf })), c: r.counters || [] } : { n: [], l: [], d: [], c: [] })(DOOR_HQ.rooms.' + id + '))', D));
const O = { sewers: OLDR(OLD[0]), tunnels: OLDR(OLD[1]), cells: OLDR(OLD[2]), workings: OLDR(OLD[3]) };
const cell = PLAN.cells.map(r => r.split(''));
if (cell.length !== Hh || cell.some(r => r.length !== W)) throw new Error('layout.json cells: want ' + Hh + ' rows of ' + W);
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); if (!PLAN.districts[p.d]) throw new Error('district? ' + p.id); p.base = r2(p.level * LEVEL); p.sx = p.x * N; p.sy = p.y * N; plot[p.id] = p; });
const Pxy = (x, y) => plot['P0' + x + '-0' + y];
const plotAt = (sx, sy) => Pxy(Math.max(0, Math.min(GX - 1, Math.floor(sx / N))), Math.max(0, Math.min(GY - 1, Math.floor(sy / N))));
const distAt = (sx, sy) => plotAt(sx, sy).d, baseAt = (sx, sy) => plotAt(sx, sy).base;
const open = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] !== 'x';
const F = [], props = [], doors = [], npc = [], counters = [], count = {}, taken = new Set(), errs = [], strays = [];
const feat = o => { F.push(o); return o; };
const setRect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ch; };

/* ── THE OPENINGS: where two plots of different levels meet. The port is the plot's squares 5, 6, 7 on that side; the middle one carries
   the water. A `stair` / `climb` opening is dry (the water and the track stop three squares short of it on both sides). ── */
const OPEN = PLAN.openings.map(o => { const a = plot[o.a], b = plot[o.b]; if (!a || !b) throw new Error('opening? ' + o.a + ' ' + o.b);
    const ns = a.x === b.x, hi = a.level >= b.level ? a : b, lo = hi === a ? b : a;
    if ((ns ? Math.abs(a.y - b.y) : Math.abs(a.x - b.x)) !== 1 || (ns ? a.x !== b.x : a.y !== b.y)) throw new Error('opening between plots that do not touch: ' + o.a + ' ' + o.b);
    /* the border line (in squares), the port's middle square along it, and the way DOWN (dx, dy) */
    const line = ns ? Math.max(a.sy, b.sy) : Math.max(a.sx, b.sx), mid = (ns ? a.sx : a.sy) + 6, dx = ns ? 0 : Math.sign(lo.x - hi.x), dy = ns ? Math.sign(lo.y - hi.y) : 0;
    return Object.assign({}, o, { ns, hi, lo, line, mid, dx, dy, rise: r2(hi.base - lo.base) }); });
OPEN.forEach(o => { if (o.kind === 'fall') return;
    for (let k = 0; k < 3; k++) for (const side of [o.hi, o.lo]) { const t = side === o.lo ? o.line + (o.dx + o.dy > 0 ? k : -1 - k) : o.line + (o.dx + o.dy > 0 ? -1 - k : k);
        for (let m = -1; m <= 1; m++) { const sx = o.ns ? o.mid + m : t, sy = o.ns ? t : o.mid + m; if (open(sx, sy) && 'wj'.includes(cell[sy][sx])) cell[sy][sx] = 'o'; } } });

/* THE ROOF (build 4, mondo 11-16: "still just looks like a boring rectangular room"): a plot's roof stands CEIL over its floor; a plot
   that a fall, a stair or a climb comes down into is as tall as that drop + CEIL, so the upper mouth opens under one roof line. */
const ceilOf = p => r2(Math.max.apply(null, [CEIL].concat(OPEN.filter(o => o.lo === p).map(o => o.rise + CEIL))));
/* a way out through the room's wall: the squares from (sx, sy) straight to the wall are opened, three wide; returns the place along the wall (m) */
function spur(sx, sy, wall) {
    const step = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }[wall]; let x = sx, y = sy;
    while (x >= 0 && y >= 0 && x < W && y < Hh) { for (let m = -1; m <= 1; m++) { const X = step[0] ? x : x + m, Y = step[0] ? y + m : y; if (X >= 0 && Y >= 0 && X < W && Y < Hh && cell[Y][X] === 'x') cell[Y][X] = 'o'; } x += step[0]; y += step[1]; }
    return step[0] ? gcz(sy) : gcx(sx);
}

/* ── placing things: a blocker on a square's middle (P), decor off it (dec), people (native); never in the wall, never two on one square ── */
let curD = null;
function spot(sx, sy, what, shared) { if (sx < 0 || sy < 0 || sx >= W || sy >= Hh) { errs.push(what + ' off the map at ' + sx + ',' + sy); return; }
    if (curD && distAt(sx, sy) !== curD) strays.push(curD + ': ' + what + ' at ' + sx + ',' + sy + ' (' + distAt(sx, sy) + ')');
    if (cell[sy][sx] === 'x') { errs.push(what + ' stands in the wall at ' + sx + ',' + sy); return; }
    if (!shared) { if (taken.has(sx + ':' + sy)) errs.push(what + ': square ' + sx + ',' + sy + ' is taken'); taken.add(sx + ':' + sy); } }
const P = (key, sx, sy, o) => { spot(sx, sy, key); props.push(Object.assign({ key, x: gcx(sx), z: gcz(sy) }, o || {})); };
const decWith = rnd => (key, sx, sy, o) => { spot(sx, sy, key, true); props.push(Object.assign({ key, x: r2(gcx(sx) + (rnd() - 0.5) * 1.6), z: r2(gcz(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); };
const native = (race, sx, sy, face, say) => { spot(sx, sy, race); if ('wj'.includes(cell[sy][sx])) errs.push(race + ' stands in the water or on the track at ' + sx + ',' + sy); const n = { x: gcx(sx), z: gcz(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); };
const sayOf = (R, race, i) => (R.n.filter(n => n.race === race)[i || 0] || {}).say;

/* ── THE DISTRICT FILES: docs/areas/sewers/districts/<LETTER>.js. A file may export any of the stages below; each is called with that
   district's own ctx (the helpers above, its own dice, its plots). A plot's squares are local: ctx.sq('P02-02', lx, ly) -> [sx, sy]. ── */
const STAGES = ['plan', 'build', 'dress', 'people'];
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const DISTRICTS = (() => { const dir = path.join(REPO, 'docs/areas/sewers/districts'), o = {}; fs.readdirSync(dir).filter(f => /^[A-Z]\.js$/.test(f)).sort().forEach(f => { o[f[0]] = require(path.join(dir, f)); }); return o; })();
Object.keys(PLAN.districts).forEach(k => { if (!DISTRICTS[k]) throw new Error('district file missing: docs/areas/sewers/districts/' + k + '.js'); });
const CTX = {};
Object.keys(DISTRICTS).forEach(k => { const rnd = mkRnd(7919 * k.charCodeAt(0));
    const sq = (id, lx, ly) => { const p = plot[id]; if (!p) throw new Error('plot? ' + id); return [p.sx + lx, p.sy + ly]; };
    CTX[k] = { d: k, C, N, W, H: Hh, LEVEL, gx, gz, gcx, gcz, r2, PLAN, plot, plots: PLAN.plots.filter(p => p.d === k), cell, setRect, open, distAt, baseAt, feat, props, npc, counters, taken, rnd, sq, O, sayOf,
        P: (key, id, lx, ly, o) => { const s = sq(id, lx, ly); P(key, s[0], s[1], o); }, dec: (key, id, lx, ly, o) => { const s = sq(id, lx, ly); decWith(rnd)(key, s[0], s[1], o); },
        native: (race, id, lx, ly, face, say) => { const s = sq(id, lx, ly); native(race, s[0], s[1], face, say); },
        /* every open square of a plot that is `chars` (default: walkway and room floor), in reading order */
        squares: (id, chars) => { const p = plot[id], out = []; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if ((chars || 'of').includes(cell[p.sy + ly][p.sx + lx])) out.push([lx, ly]); return out; },
        ceil: id => ceilOf(plot[id]),
        /* a brick pier on a square, floor to roof (a blocker: the walker goes round it) */
        pier: (id, lx, ly) => { const p = plot[id], s = sq(id, lx, ly); spot(s[0], s[1], 'pier'); feat({ k: 'plateau', x: gcx(s[0]), z: gcz(s[1]), w: 1.75, d: 1.75, h: r2(p.base + ceilOf(p) + 0.2), edge: 0.1 }); },
        free: (id, lx, ly) => { const s = sq(id, lx, ly); return open(s[0], s[1]) && !taken.has(s[0] + ':' + s[1]); },
        /* dry squares with wall on two sides or more (a bend's corner, a dead end's tip): where a light or a barrel stands without closing a walk */
        corners: id => { const p = plot[id], out = []; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { const x = p.sx + lx, y = p.sy + ly; if (!'of'.includes(cell[y][x]) || taken.has(x + ':' + y)) continue;
            let n = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!open(x + dx, y + dy)) n++; if (n >= 2) out.push([lx, ly]); } return out; },
        /* dry squares with no wall beside them and no water or track beside them: the middle of a room */
        inner: id => { const p = plot[id], out = []; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { const x = p.sx + lx, y = p.sy + ly; if (!'of'.includes(cell[y][x]) || taken.has(x + ':' + y)) continue;
            let ok = true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!open(x + dx, y + dy) || 'wjb'.includes(cell[y + dy][x + dx])) ok = false; if (ok) out.push([lx, ly]); } return out; },
        /* room squares along a wall (one wall beside them), not on a plot line */
        walled: id => { const p = plot[id], out = []; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { const x = p.sx + lx, y = p.sy + ly; if (cell[y][x] !== 'f' || taken.has(x + ':' + y)) continue;
            let n = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!open(x + dx, y + dy)) n++; if (n === 1) out.push([lx, ly]); } return out; } }; });
const run = stage => Object.keys(DISTRICTS).forEach(k => { const m = DISTRICTS[k]; if (m && typeof m[stage] === 'function') { curD = k; try { m[stage](CTX[k]); } finally { curD = null; } } });

run('plan');      // what a district changes on the plan's squares, before anything is derived from them

/* ── THE WAYS OUT (nine, all in the game before the rebuild). A door of the room: `pump`. The other eight are links (data.js DOOR_HQ.links:
   the link row holds the place; WANT below checks every row). ── */
const WAY = {
    pump: { wall: 'n', at: spur(plot['P03-00'].sx + 6, plot['P03-00'].sy + 2, 'n') },
    docks_sewer: { wall: 'e', at: spur(plot['P05-02'].sx + 7, plot['P05-02'].sy + 4, 'e') },
    stadium_sewers: { wall: 'e', at: spur(plot['P05-01'].sx + 9, plot['P05-01'].sy + 6, 'e') },
    tunnels_platform: { wall: 's', at: spur(plot['P03-03'].sx + 6, plot['P03-03'].sy + 9, 's') },
    tunnels_works: { wall: 'w', at: spur(plot['P00-03'].sx + 1, plot['P00-03'].sy + 6, 'w') },
    sewers_drain: { wall: 'w', at: spur(plot['P00-02'].sx + 1, plot['P00-02'].sy + 6, 'w') },
    workings_oubliette: { wall: 'w', at: spur(plot['P00-01'].sx + 3, plot['P00-01'].sy + 5, 'w') },
    cells_dungeon: { wall: 'w', at: spur(plot['P00-00'].sx + 2, plot['P00-00'].sy + 5, 'w') },
    well_garden: { wall: 'free', x: gcx(plot['P01-03'].sx + 5), z: gcz(plot['P01-03'].sy + 9), face: 0 },
};
{ const s = [plot['P01-03'].sx + 5, plot['P01-03'].sy + 9]; if (!open(s[0], s[1])) throw new Error('the garden well\'s square is not open'); taken.add(s[0] + ':' + s[1]); }
{ const o = O.sewers.d.find(d => d.id === 'pump') || {};
  doors.push({ id: 'pump', wall: 'n', x: WAY.pump.at, leaf: o.leaf || 'leaf_bulkhead', wide: true, label: o.label || 'DISASTER CITY', sub: o.sub || 'THE PUMPING STATION · UP TO THE STREET',
      action: { room: 'site_prebuilt_downtown_streets', at: 'sewer' }, desc: o.desc || '' }); }

run('build');     // rooms, galleries, platforms: what a district raises or lays on its plots
run('dress');     // props
run('people');    // the bystanders

if (strays.length) console.log('pieces a district stood on another district\'s squares (ask that district\'s thread):\n  ' + strays.join('\n  '));
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));

/* ── THE LEVELS: a plateau a plot. It runs a metre into every neighbour that stands as high or higher (two plateaus that only touch would
   leave a notch on the line), and stops on the line where the neighbour is lower: that line is the cliff the falls drop over. ── */
const LVL = [];
PLAN.plots.forEach(p => { if (!p.level) return; const nb = (dx, dy) => { const q = (p.x + dx >= 0 && p.x + dx < GX && p.y + dy >= 0 && p.y + dy < GY) ? Pxy(p.x + dx, p.y + dy) : null; return (!q || q.level >= p.level) ? 1 : 0; };
    const x0 = gx(p.sx) - nb(-1, 0), x1 = gx(p.sx + N) + nb(1, 0), z0 = gz(p.sy) - nb(0, -1), z1 = gz(p.sy + N) + nb(0, 1);
    LVL.push({ k: 'plateau', x: r2((x0 + x1) / 2), z: r2((z0 + z1) / 2), w: r2(x1 - x0), d: r2(z1 - z0), h: p.base, edge: 0.15 }); });

/* ── THE OPENINGS, BUILT ── */
const STAIR = { W: 'concrete', T: 'metro', H: 'precast', O: 'wood' }, GO = [];
OPEN.forEach((o, i) => {
    const along = v => o.ns ? gcx(v) : gcz(v), lineM = o.ns ? gz(o.line) : gx(o.line), sgn = o.dx + o.dy;   // sgn: +1 = down is east / south
    const pt = (a, t) => o.ns ? { x: a, z: t } : { x: t, z: a };
    if (o.kind === 'climb') { const p = pt(along(o.mid), r2(lineM + sgn * 0.3)); GO.push({ k: 'climb', x: p.x, z: p.z, face: o.ns ? (sgn > 0 ? 0 : 180) : (sgn > 0 ? 270 : 90), look: o.rope ? 'rope' : 'ladder' }); return; }
    /* the stair: on the low side, 1.75 m of rise over a square and a half; beside a fall it takes the walkway on one side (they alternate) */
    const lane = o.kind === 'fall' ? (i % 2 ? 1 : -1) : 0, run = r2(Math.max(5.25, o.rise * 1.5))   /* a flight rises 2 in 3 (the city's own stairs rise 1 in 1) */, a = along(o.mid + lane), foot = pt(a, r2(lineM + sgn * run)), head = pt(a, r2(lineM - sgn * 0.4));
    /* beside a fall the way up is the opening's `by`: a stair flight along the lower room's wall, or a ladder on the face */
    if (o.by === 'ladder') { const p = pt(a, r2(lineM + sgn * 0.3)); GO.push({ k: 'climb', x: p.x, z: p.z, face: o.ns ? (sgn > 0 ? 0 : 180) : (sgn > 0 ? 270 : 90), look: 'ladder' }); }
    else GO.push({ k: 'ramp', x0: foot.x, z0: foot.z, x1: head.x, z1: head.z, w: C, h0: o.lo.base, h1: o.hi.base, stairs: true, model: STAIR[o.lo.d] || 'concrete', edge: 0.15 });
    if (o.kind === 'fall') { const p = pt(along(o.mid), lineM);
        /* THE WATERFALL (three-renderer.js THE WATERFALLS): the lip's middle, the way the water falls (degrees, 0 = north, clockwise), the lip's width, the two water levels */
        GO.push({ k: 'fall', x: p.x, z: p.z, face: o.ns ? (sgn > 0 ? 180 : 0) : (sgn > 0 ? 90 : 270), w: C, y0: r2(o.hi.base - 0.3), y1: r2(o.lo.base - 0.3) }); }
});

/* ── THE WATER: every run of `w` squares is a stream at its plot's level, a square wide; a block of water (a tank) is one wide stream.
   The sheet lies 0.3 m under the walkway, 0.6 m deep (waded); a tank named in a district's `deep` list is deep water. ── */
const WATER = [];
{ const used = new Uint8Array(W * Hh), isW = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] === 'w', P0 = (x, y) => plotAt(x, y);
  const deep = new Set(); Object.keys(DISTRICTS).forEach(k => (DISTRICTS[k].deep || []).forEach(id => deep.add(id)));
  /* blocks first: any 2 x 2 of water grows to its greatest rectangle inside one plot */
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (!isW(x, y) || used[y * W + x] || !(isW(x + 1, y) && isW(x, y + 1) && isW(x + 1, y + 1))) continue;
      const p = P0(x, y); let w = 1; while (isW(x + w, y) && !used[y * W + x + w] && P0(x + w, y) === p) w++;
      let h = 1; rows: while (y + h < Hh && P0(x, y + h) === p) { for (let i = 0; i < w; i++) if (!isW(x + i, y + h) || used[(y + h) * W + x + i]) break rows; h++; }
      if (w < 2 || h < 2) continue;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
      const dp = deep.has(p.id), row = { k: 'stream', pts: h >= w ? [[r2(gx(x) + w * C / 2), gz(y)], [r2(gx(x) + w * C / 2), gz(y + h)]] : [[gx(x), r2(gz(y) + h * C / 2)], [gx(x + w), r2(gz(y) + h * C / 2)]], w: (h >= w ? w : h) * C, y: r2(p.base - 0.3), depth: dp ? 1.8 : 0.6 };
      if (dp) row.key = 'deep_water'; WATER.push(row); count.tanks = (count.tanks || 0) + 1; }
  /* then the runs, west-east and north-south, cut at every plot line */
  const runOf = (x, y, dx, dy) => { const p = P0(x, y); let n = 0; while (isW(x + n * dx, y + n * dy) && !used[(y + n * dy) * W + x + n * dx] && P0(x + n * dx, y + n * dy) === p) n++; return n; };
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (!isW(x, y) || used[y * W + x]) continue;
      const nh = runOf(x, y, 1, 0), nv = runOf(x, y, 0, 1), p = P0(x, y), horiz = nh >= nv, n = horiz ? nh : nv;
      for (let i = 0; i < n; i++) used[(y + (horiz ? 0 : i)) * W + x + (horiz ? i : 0)] = 1;
      WATER.push({ k: 'stream', pts: horiz ? [[gx(x), gcz(y)], [gx(x + n), gcz(y)]] : [[gcx(x), gz(y)], [gcx(x), gz(y + n)]], w: C, y: r2(p.base - 0.3), depth: 0.6 }); count.streams = (count.streams || 0) + 1; } }
/* the planks: a `b` run is a deck over the water */
{ const used = new Uint8Array(W * Hh);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (cell[y][x] !== 'b' || used[y * W + x]) continue; let n = 0, m = 0; while (y + n < Hh && cell[y + n][x] === 'b') n++; while (x + m < W && cell[y][x + m] === 'b') m++;
      const v = n >= m, len = v ? n : m; for (let i = 0; i < len; i++) used[(y + (v ? i : 0)) * W + x + (v ? 0 : i)] = 1;
      WATER.push({ k: 'stream', pts: v ? [[gcx(x), gz(y)], [gcx(x), gz(y + n)]] : [[gx(x), gcz(y)], [gx(x + m), gcz(y)]], w: C, y: r2(baseAt(x, y) - 0.3), depth: 1.8, key: 'deep_water' });
      WATER.push(v ? { k: 'deck', x0: gcx(x), z0: r2(gz(y) - 0.5), x1: gcx(x), z1: r2(gz(y + n) + 0.5), w: 1.75, y: r2(baseAt(x, y) + 0.05) } : { k: 'deck', x0: r2(gx(x) - 0.5), z0: gcz(y), x1: r2(gx(x + m) + 0.5), z1: gcz(y), w: 1.75, y: r2(baseAt(x, y) + 0.05) }); } }

/* ── THE RAILS: two steel rails along every run of track, 0.14 m high (stepped over, grindable: the old Running Tunnels' own) ── */
const RAILS = [];
{ const used = new Uint8Array(W * Hh), isJ = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] === 'j';
  for (const horiz of [true, false]) for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (!isJ(x, y)) continue;
      if (horiz ? isJ(x - 1, y) : isJ(x, y - 1)) continue; let n = 0; while (isJ(x + (horiz ? n : 0), y + (horiz ? 0 : n))) n++; if (n < 2) continue;
      if (!horiz) { let lone = true; for (let i = 0; i < n; i++) if (!(isJ(x - 1, y + i) || isJ(x + 1, y + i))) lone = false; if (lone && n < 3) continue; }
      for (const off of [-0.72, 0.72]) RAILS.push(horiz ? { k: 'wall', x0: gx(x), z0: r2(gcz(y) + off), x1: gx(x + n), z1: r2(gcz(y) + off), h: 0.14, t: 0.12, key: 'metal' } : { k: 'wall', x0: r2(gcx(x) + off), z0: gz(y), x1: r2(gcx(x) + off), z1: gz(y + n), h: 0.14, t: 0.12, key: 'metal' }); } }

/* ── THE VAULTS (build 4): every stretch of open floor wears a brick barrel vault, sprung from its walls, its crown at the plot's roof
   (`arch` rows, drawn only: three-renderer.js _hqArchGeometry roof form 'barrel', open-ended, seen from inside). A plot's open squares
   are cut into rectangles; each vault runs along its rectangle's long side and spans the short one. Over them one flat slab a plot closes
   what the vaults leave between them. ── */
const VAULT = [];
PLAN.plots.forEach(p => { const used = new Uint8Array(N * N), parts = [], top = ceilOf(p), ox = gx(p.sx) + N * C / 2, oz = gz(p.sy) + N * C / 2, op = (lx, ly) => lx >= 0 && ly >= 0 && lx < N && ly < N && open(p.sx + lx, p.sy + ly);
    parts.push({ s: 'box', p: [0, r2(top + 0.05), 0], size: [N * C, 0.2, N * C], sides: false, top: false, under: true, key: 'bricks_2', tint: 0x4a463f });
    for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { if (!op(lx, ly) || used[ly * N + lx]) continue;
        let w = 1; while (op(lx + w, ly) && !used[ly * N + lx + w]) w++;
        let h = 1; rows: while (ly + h < N) { for (let i = 0; i < w; i++) if (!op(lx + i, ly + h) || used[(ly + h) * N + lx + i]) break rows; h++; }
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(ly + j) * N + lx + i] = 1;
        const alongX = w >= h, span = (alongX ? h : w) * C + 0.7, len = (alongX ? w : h) * C + 0.1, rise = r2(Math.min(3.5, span / 3));
        parts.push({ s: 'roof', form: 'barrel', p: [r2(gx(p.sx + lx) + w * C / 2 - ox), r2(top - rise), r2(gz(p.sy + ly) + h * C / 2 - oz)], size: [r2(len), rise, r2(span)], ry: alongX ? 0 : 90, key: 'bricks_2', tint: 0x7c766a, ds: true, ends: false, seg: 8 }); }
    VAULT.push({ k: 'arch', id: 'sew:' + p.id + ':roof', x: r2(ox), z: r2(oz), rot: 0, base: p.base, parts }); count.vaults = (count.vaults || 0) + parts.length - 1; });

/* ── THE OPEN GROUND: every square that is not wall, as `space` rows (greedy rectangles) ── */
const spaces = [];
{ const used = new Uint8Array(W * Hh);
  for (let cy = 0; cy < Hh; cy++) for (let cx = 0; cx < W; cx++) { if (!open(cx, cy) || used[cy * W + cx]) continue;
      let w = 1; while (cx + w < W && !used[cy * W + cx + w] && open(cx + w, cy)) w++;
      let h = 1; rows: while (cy + h < Hh) { for (let i = 0; i < w; i++) if (used[(cy + h) * W + cx + i] || !open(cx + i, cy + h)) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(cy + j) * W + cx + i] = 1;
      spaces.push({ k: 'space', x: r2(gx(cx) + w * C / 2), z: r2(gz(cy) + h * C / 2), w: w * C, d: h * C }); } }
/* ── THE PAINT: one sheet a square (0 = the room's own concrete) ── */
const PAL = ['urban:RubberNonSlip3a', 'bricks_2', 'urban:TileGeneric4b', 'urban:ConcreteStriped1e', 'wood_planks', 'urban:TileSubway4a'], paint = new Uint8Array(W * Hh);
for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x], d = distAt(x, y);
    paint[y * W + x] = ch === 'x' ? 0 : d === 'O' ? 2 : d === 'H' ? 3 : d === 'T' ? (ch === 'f' ? 6 : 0) : ch === 'b' ? 5 : ch === 'o' ? 1 : 0; }

/* ── checks: every prop key and unit exists; nothing stands in the wall; every plot is reached from the Junction through the plan's
   openings (a square-to-square walk on the plan; a level change is crossed only on an opening's own squares) ── */
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); });
npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
const SP = [plot['P02-02'].sx + 3, plot['P02-02'].sy + 6];
{ const seen = new Uint8Array(W * Hh), st = [SP]; if (!open(SP[0], SP[1])) throw new Error('the spawn is not open'); seen[SP[1] * W + SP[0]] = 1;
  const cross = (x, y, X, Y) => { const a = plotAt(x, y), b = plotAt(X, Y); if (a === b || a.level === b.level) return true;
      return OPEN.some(o => ((o.hi === a && o.lo === b) || (o.hi === b && o.lo === a)) && Math.abs((o.ns ? x : y) - o.mid) <= 1); };
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!open(X, Y) || seen[Y * W + X] || !cross(x, y, X, Y)) continue; seen[Y * W + X] = 1; st.push([X, Y]); } }
  const cold = PLAN.plots.filter(p => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.sy + ly) * W + p.sx + lx]) return false; return true; }).map(p => p.id);
  if (process.env.SEWERS_DUMP) console.log(cell.map((r, y) => r.map((ch, x) => open(x, y) && !seen[y * W + x] ? '!' : ch === 'x' ? ' ' : ch).join('')).join('\n'));
  if (cold.length) throw new Error('plots not reached on foot: ' + cold.join(' '));
  let op = 0, un = 0; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (open(x, y)) { op++; if (!seen[y * W + x]) un++; }
  props.forEach(p => { const sx = Math.floor((p.x + HX) / C), sy = Math.floor((p.z + HZ) / C); if (!open(sx, sy)) throw new Error(p.key + ' stands in the wall at ' + sx + ',' + sy); });
  Object.assign(count, { openSquares: op, unreachedSquares: un }); }
const features = spaces.concat(LVL, WATER, GO, RAILS, F, VAULT);
Object.assign(count, { plots: PLAN.plots.length, spaces: spaces.length, falls: GO.filter(g => g.k === 'fall').length, stairs: GO.filter(g => g.k === 'ramp').length, climbs: GO.filter(g => g.k === 'climb').length,
    features: features.length, props: props.length, doors: doors.length, natives: npc.length });

/* ── the room ── */
const TOP = Math.max.apply(null, PLAN.plots.map(p => p.base)), SH = r2(TOP + CEIL), SPM = { x: gcx(SP[0]), z: gcz(SP[1]) };
const LINES = O.sewers.l.concat(O.tunnels.l, O.cells.l, O.workings.l), L = [];
L.push("        /* SEWERS24-BEGIN — THE SEWERS ON PLOTS (2026-11-16): written by `node bake-sewers.js` from docs/areas/sewers/layout.json + districts/<W T H O>.js. Never hand-edit between the markers; edit the tool, the layout or a district file and rerun. */");
L.push("        " + ROOM + ": {");
L.push("            label: 'DISASTER CITY · THE SEWERS',");
L.push("            sub: 'THE CULVERTS · THE RUNNING TUNNELS · THE HOLDING CELLS · THE OLD WORKINGS · EVERY GUTTER DRAINS HERE',");
L.push("            kind: 'box', site: 'prebuilt_downtown', part: '" + PART + "',");
L.push("            shell: hqSewerShell({ w: " + (2 * HX) + ", d: " + (2 * HZ) + ", h: " + SH + ", wallH: " + SH + ", plate: { x: " + SPM.x + ", z: " + SPM.z + ", y: " + r2(plot['P02-02'].base + 3.2) + " },");
L.push("                                  mood: { lamp: 0xbfe8b0, glow: 0x9fd0a0, strip: 0xd8f0c8, light: 0xcfe8c0, ambient: 0.13 }, fog: { color: 0x050806, density: 0.042 }, wallColor: 0x4e4a44, floorColor: 0x6c6e6a }),   // darker than the old rooms (mondo 11-16: \"dark and grimy and scary\")");
L.push("            parti: 'A maze under the city: brick culverts that bend, fork and stop, the upper culverts pouring into the lower rooms over three falls; the subway line under them, the old mine under that.',");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", nx: " + GX + ", nz: " + GY + ", names: " + J(PLAN.plots.map(p => [p.id, p.name, p.d, p.level])) + " },");
L.push("            terrain: {");
L.push("                res: 0.875, floor: 'urban:ConcreteStriped2c', cliff: 'bricks_2', path: 'urban:RubberNonSlip3a',");
L.push("                noise: { amp: 0, scale: 5 }, crag: false,");
L.push("                waterLook: { water: 'sewer_water', deep_water: 'sewer_deep' },   // murky green-brown sewer water: LOOK ONLY, it is still water (three-renderer.js _hqWaterLook; mondo 11-16)");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gcx(0) + ", z0: " + gcz(0) + ", nx: " + W + ", nz: " + Hh + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                /* every square that is not a `space` is the wall, brick to the roof */");
L.push("                gen: { kind: 'plan', look: 'walls', wallKey: 'bricks_2', rim: 0, forceGrow: -0.3 },");
L.push("                features: [");
features.forEach(f => L.push("                    " + J(f) + ","));
L.push("                ],");
L.push("            },");
L.push("            doors: [");
doors.forEach(d => L.push("                " + J(d) + ","));
L.push("            ],");
L.push("            counters: " + J(counters) + ",");
L.push("            props: [");
for (let i = 0; i < props.length; i += 4) L.push("                " + props.slice(i, i + 4).map(J).join(", ") + ",");
L.push("            ],");
L.push("            agents: [],");
L.push("            npcSpots: " + J(npc) + ",");
L.push("            onlineSpots: [],");
L.push("            lines: " + J(LINES) + ",");
L.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: 90 },");
L.push("        },");
L.push("        /* SEWERS24-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
/* the link rows in data.js that hold a place in this room (written by hand there): the tool refuses to bake when one has drifted */
const end = (id) => { const w = WAY[id]; return "site: 'prebuilt_downtown', part: '" + PART + "', wall: '" + w.wall + "', " + (w.wall === 'free' ? 'x: ' + w.x + ', z: ' + w.z + ', face: ' + w.face : (w.wall === 'n' || w.wall === 's' ? 'x: ' : 'z: ') + w.at) + ','; };
const WANT = Object.keys(WAY).filter(k => k !== 'pump').map(k => [end(k), 'link ' + k]);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at this room yet (see the rows above)'); }
if (DRY) process.exit(0);
const END = '        /* SEWERS24-END */\n', b0 = src.indexOf('        /* SEWERS24-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        site_prebuilt_downtown_sewers: {'; const a = src.indexOf(anchor); if (a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
fs.writeFileSync(file, src);
