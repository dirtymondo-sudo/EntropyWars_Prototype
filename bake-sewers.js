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
     climb  a ladder or a rope on the face (the trap, the Adit, the well at the Junction)

   DISTRICT R, THE RADIOACTIVE DRAIN (2026-11-16, mondo: "one sewer district could be radioactive sludge if it connects to the power plant ...
   make it a new liquid that does corrosion"): a fifth row (layout `rows` 5). What it needed here, nothing else: a plot may be `solid`
   (not dug: no roof, not in the walk check); the square `s` = the liquid `sludge` (laid like water, its own rows, `key: 'sludge'`; a fall
   fed by it pours sludge); the way `sewers_power` (the bulkhead door up to the Power station's yard, a link). Two plots of one level
   need no opening row: they share open squares on their line (the Sludge Pit and the Outfall). */
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
const F = [], props = [], doors = [], npc = [], counters = [], count = {}, taken = new Set(), errs = [], strays = [], DECALS = [];
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
        for (let m = -1; m <= 1; m++) { const sx = o.ns ? o.mid + m : t, sy = o.ns ? t : o.mid + m; if (open(sx, sy) && 'wsj'.includes(cell[sy][sx])) cell[sy][sx] = 'o'; } } });

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
const native = (race, sx, sy, face, say) => { spot(sx, sy, race); if ('wsj'.includes(cell[sy][sx])) errs.push(race + ' stands in the water or on the track at ' + sx + ',' + sy); const n = { x: gcx(sx), z: gcz(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); };
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
        /* a floor decal: kind 'grime' | 'puddle' | 'oil' | 'blood' | 'scorch' (three-renderer.js _hqDecalTex) */
        grime: (kind, id, lx, ly, r) => { const s = sq(id, lx, ly); DECALS.push({ kind, x: gcx(s[0]), z: gcz(s[1]), y: plot[id].base, r: r || 1.4, rot: Math.round(rnd() * 360) }); },
        /* a brick pier on a square, floor to roof (a blocker: the walker goes round it) */
        pier: (id, lx, ly) => { const p = plot[id], s = sq(id, lx, ly); spot(s[0], s[1], 'pier'); feat({ k: 'plateau', x: gcx(s[0]), z: gcz(s[1]), w: 1.75, d: 1.75, h: r2(p.base + ceilOf(p) + 0.2), edge: 0.1 }); },
        free: (id, lx, ly) => { const s = sq(id, lx, ly); return open(s[0], s[1]) && !taken.has(s[0] + ':' + s[1]); },
        /* dry squares with wall on two sides or more (a bend's corner, a dead end's tip): where a light or a barrel stands without closing a walk */
        corners: id => { const p = plot[id], out = []; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { const x = p.sx + lx, y = p.sy + ly; if (!'of'.includes(cell[y][x]) || taken.has(x + ':' + y)) continue;
            let n = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!open(x + dx, y + dy)) n++; if (n >= 2) out.push([lx, ly]); } return out; },
        /* dry squares with no wall beside them and no water or track beside them: the middle of a room */
        inner: id => { const p = plot[id], out = []; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { const x = p.sx + lx, y = p.sy + ly; if (!'of'.includes(cell[y][x]) || taken.has(x + ':' + y)) continue;
            let ok = true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!open(x + dx, y + dy) || 'wsjb'.includes(cell[y + dy][x + dx])) ok = false; if (ok) out.push([lx, ly]); } return out; },
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
    sewers_power: { wall: 's', at: spur(plot['P04-04'].sx + 8, plot['P04-04'].sy + 9, 's') },   // district R: the bulkhead door up to the Power station's yard
};
{ const s = [plot['P01-03'].sx + 5, plot['P01-03'].sy + 9]; if (!open(s[0], s[1])) throw new Error('the garden well\'s square is not open'); taken.add(s[0] + ':' + s[1]); }
{ const o = O.sewers.d.find(d => d.id === 'pump') || {};
  doors.push({ id: 'pump', wall: 'n', x: WAY.pump.at, leaf: o.leaf || 'leaf_bulkhead', wide: true, label: o.label || 'DISASTER CITY', sub: o.sub || 'THE PUMPING STATION · UP TO THE STREET',
      action: { room: 'site_prebuilt_downtown_streets', at: 'sewer' }, desc: o.desc || '' }); }

run('build');     // rooms, galleries, platforms: what a district raises or lays on its plots
run('dress');     // props
run('people');    // the bystanders

if (strays.length) console.log('pieces a district stood on another district\'s squares (ask that district\'s thread):\n  ' + strays.join('\n  '));
if (strays.length) console.log('pieces a district stood on another district\'s squares (ask that district\'s thread):\n  ' + strays.join('\n  '));
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));

/* ══ THE DERIVED PIECES, written for a FRAME (2026-11-17, One World): the levels, the openings built, the water, the rails, the vaults, the tool's
   floor decals, the open ground, the paint and the walk check are read from a frame's squares and plots. The home frame (the 6 x 5 plan) is
   derived for its checks; every One World room is derived again from its own squares (the tool's own pieces are written again for the new
   layout: areas-complexes.md "ONE WORLD, HOW A ZONE MOVES" rule 5). A frame: { cell, W, Hh, plots: [{ id, d, level, base, sx, sy, solid }],
   at(col, row) -> a plot or null, OPEN (the openings between plots that touch in it), seed }. ── */
const DEEP = new Set(); Object.keys(DISTRICTS).forEach(k => (DISTRICTS[k].deep || []).forEach(id => DEEP.add(id)));
const STAIR = { W: 'concrete', T: 'metro', H: 'precast', O: 'wood' };
function derive(fr) {
    const W = fr.W, Hh = fr.Hh, HX = W * C / 2, HZ = Hh * C / 2, cell = fr.cell, GXn = W / N, GYn = Hh / N;
    const gx = c => r2(-HX + c * C), gz = c => r2(-HZ + c * C), gcx = c => r2(-HX + (c + 0.5) * C), gcz = c => r2(-HZ + (c + 0.5) * C);
    const open = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] !== 'x';
    const plotAt = (sx, sy) => fr.at(Math.max(0, Math.min(GXn - 1, Math.floor(sx / N))), Math.max(0, Math.min(GYn - 1, Math.floor(sy / N))));
    const baseAt = (sx, sy) => { const p = plotAt(sx, sy); return p ? p.base : 0; };
    const OPEN = fr.OPEN, ceilOf = p => r2(Math.max.apply(null, [CEIL].concat(OPEN.filter(o => o.lo === p).map(o => o.rise + CEIL))));
    const count = {};
    /* ── THE LEVELS: a plateau a plot. It runs a metre into every neighbour that stands as high or higher (two plateaus that only touch would
       leave a notch on the line), and stops on the line where the neighbour is lower: that line is the cliff the falls drop over. A side with
       no plot past it is rock: the plateau runs on into it. ── */
    const LVL = [];
    fr.plots.forEach(p => { if (!p.level) return; const nb = (dx, dy) => { const q = fr.at(p.col + dx, p.row + dy); return (!q || q.level >= p.level) ? 1 : 0; };
        const x0 = gx(p.sx) - nb(-1, 0), x1 = gx(p.sx + N) + nb(1, 0), z0 = gz(p.sy) - nb(0, -1), z1 = gz(p.sy + N) + nb(0, 1);
        LVL.push({ k: 'plateau', x: r2((x0 + x1) / 2), z: r2((z0 + z1) / 2), w: r2(x1 - x0), d: r2(z1 - z0), h: p.base, edge: 0.15 }); });
    /* ── THE OPENINGS, BUILT ── */
    const GO = [];
    OPEN.forEach(o => { const i = o.i;
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
            const fall = { k: 'fall', x: p.x, z: p.z, face: o.ns ? (sgn > 0 ? 180 : 0) : (sgn > 0 ? 90 : 270), w: C, y0: r2(o.hi.base - 0.3), y1: r2(o.lo.base - 0.3) };
            { const u = o.line + (sgn > 0 ? -1 : 0), ch = o.ns ? cell[u][o.mid] : cell[o.mid][u]; if (ch === 's') fall.key = 'sludge'; }   // district R: a fall fed by sludge pours sludge
            GO.push(fall); }
    });
    /* ── THE WATER: every run of `w` squares is a stream at its plot's level, a square wide; a block of water (a tank) is one wide stream.
       The sheet lies 0.3 m under the walkway, 0.6 m deep (waded); a tank named in a district's `deep` list is deep water. ── */
    const WATER = [];
    for (const LQ of ['w', 's']) {   // w = water, s = the radioactive sludge (district R): the same rows in the liquid `sludge`
      const used = new Uint8Array(W * Hh), isW = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] === LQ, P0 = (x, y) => plotAt(x, y);
      /* blocks first: any 2 x 2 of water grows to its greatest rectangle inside one plot */
      for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (!isW(x, y) || used[y * W + x] || !(isW(x + 1, y) && isW(x, y + 1) && isW(x + 1, y + 1))) continue;
          const p = P0(x, y); let w = 1; while (isW(x + w, y) && !used[y * W + x + w] && P0(x + w, y) === p) w++;
          let h = 1; rows: while (y + h < Hh && P0(x, y + h) === p) { for (let i = 0; i < w; i++) if (!isW(x + i, y + h) || used[(y + h) * W + x + i]) break rows; h++; }
          if (w < 2 || h < 2) continue;
          for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
          const dp = DEEP.has(p.id), row = { k: 'stream', pts: h >= w ? [[r2(gx(x) + w * C / 2), gz(y)], [r2(gx(x) + w * C / 2), gz(y + h)]] : [[gx(x), r2(gz(y) + h * C / 2)], [gx(x + w), r2(gz(y) + h * C / 2)]], w: (h >= w ? w : h) * C, y: r2(p.base - 0.3), depth: dp ? 1.8 : 0.6 };
          if (LQ === 's') row.key = 'sludge'; else if (dp) row.key = 'deep_water'; WATER.push(row); count.tanks = (count.tanks || 0) + 1; }
      /* then the runs, west-east and north-south, cut at every plot line */
      const runOf = (x, y, dx, dy) => { const p = P0(x, y); let n = 0; while (isW(x + n * dx, y + n * dy) && !used[(y + n * dy) * W + x + n * dx] && P0(x + n * dx, y + n * dy) === p) n++; return n; };
      for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (!isW(x, y) || used[y * W + x]) continue;
          const nh = runOf(x, y, 1, 0), nv = runOf(x, y, 0, 1), p = P0(x, y), horiz = nh >= nv, n = horiz ? nh : nv;
          for (let i = 0; i < n; i++) used[(y + (horiz ? 0 : i)) * W + x + (horiz ? i : 0)] = 1;
          WATER.push(Object.assign({ k: 'stream', pts: horiz ? [[gx(x), gcz(y)], [gx(x + n), gcz(y)]] : [[gcx(x), gz(y)], [gcx(x), gz(y + n)]], w: C, y: r2(p.base - 0.3), depth: 0.6 }, LQ === 's' ? { key: 'sludge' } : {})); count.streams = (count.streams || 0) + 1; } }
    /* the planks: a `b` run is a deck over the water */
    { const used = new Uint8Array(W * Hh);
      for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (cell[y][x] !== 'b' || used[y * W + x]) continue; let n = 0, m = 0; while (y + n < Hh && cell[y + n][x] === 'b') n++; while (x + m < W && cell[y][x + m] === 'b') m++;
          const v = n >= m, len = v ? n : m; for (let i = 0; i < len; i++) used[(y + (v ? i : 0)) * W + x + (v ? 0 : i)] = 1;
          WATER.push({ k: 'stream', pts: v ? [[gcx(x), gz(y)], [gcx(x), gz(y + n)]] : [[gx(x), gcz(y)], [gx(x + m), gcz(y)]], w: C, y: r2(baseAt(x, y) - 0.3), depth: 1.8, key: 'deep_water' });
          WATER.push(v ? { k: 'deck', x0: gcx(x), z0: r2(gz(y) - 0.5), x1: gcx(x), z1: r2(gz(y + n) + 0.5), w: 1.75, y: r2(baseAt(x, y) + 0.05) } : { k: 'deck', x0: r2(gx(x) - 0.5), z0: gcz(y), x1: r2(gx(x + m) + 0.5), z1: gcz(y), w: 1.75, y: r2(baseAt(x, y) + 0.05) }); } }
    /* ── THE RAILS: two steel rails along every run of track, 0.14 m high (stepped over, grindable: the old Running Tunnels' own) ── */
    const RAILS = [];
    { const isJ = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] === 'j';
      for (const horiz of [true, false]) for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (!isJ(x, y)) continue;
          if (horiz ? isJ(x - 1, y) : isJ(x, y - 1)) continue; let n = 0; while (isJ(x + (horiz ? n : 0), y + (horiz ? 0 : n))) n++; if (n < 2) continue;
          if (!horiz) { let lone = true; for (let i = 0; i < n; i++) if (!(isJ(x - 1, y + i) || isJ(x + 1, y + i))) lone = false; if (lone && n < 3) continue; }
          for (const off of [-0.72, 0.72]) RAILS.push(horiz ? { k: 'wall', x0: gx(x), z0: r2(gcz(y) + off), x1: gx(x + n), z1: r2(gcz(y) + off), h: 0.14, t: 0.12, key: 'metal' } : { k: 'wall', x0: r2(gcx(x) + off), z0: gz(y), x1: r2(gcx(x) + off), z1: gz(y + n), h: 0.14, t: 0.12, key: 'metal' }); } }
    /* ── THE VAULTS (build 4): every stretch of open floor wears a brick barrel vault, sprung from its walls, its crown at the plot's roof
       (`arch` rows, drawn only: three-renderer.js _hqArchGeometry roof form 'barrel', open-ended, seen from inside). A plot's open squares
       are cut into rectangles; each vault runs along its rectangle's long side and spans the short one. Over them one flat slab a plot closes
       what the vaults leave between them. ── */
    const VAULT = [], DAMP = [0x7c766a, 0x6a6a58, 0x5c6450, 0x74695a, 0x66604f], grnd = mkRnd(fr.seed), RUST = 'urban:MetalCorrugatedPainted2a';
    fr.plots.forEach(p => { if (p.solid) return; const used = new Uint8Array(N * N), parts = [], top = ceilOf(p), ox = gx(p.sx) + N * C / 2, oz = gz(p.sy) + N * C / 2, op = (lx, ly) => lx >= 0 && ly >= 0 && lx < N && ly < N && open(p.sx + lx, p.sy + ly);
        parts.push({ s: 'box', p: [0, r2(top + 0.05), 0], size: [N * C, 0.2, N * C], sides: false, top: false, under: true, key: 'bricks_2', tint: 0x4a463f });
        for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { if (!op(lx, ly) || used[ly * N + lx]) continue;
            let w = 1; while (op(lx + w, ly) && !used[ly * N + lx + w]) w++;
            let h = 1; rows: while (ly + h < N) { for (let i = 0; i < w; i++) if (!op(lx + i, ly + h) || used[(ly + h) * N + lx + i]) break rows; h++; }
            for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(ly + j) * N + lx + i] = 1;
            const alongX = w >= h, span = (alongX ? h : w) * C + 0.7, len = (alongX ? w : h) * C + 0.1, rise = r2(Math.min(3.5, span / 3));
            parts.push({ s: 'roof', form: 'barrel', p: [r2(gx(p.sx + lx) + w * C / 2 - ox), r2(top - rise), r2(gz(p.sy + ly) + h * C / 2 - oz)], size: [r2(len), rise, r2(span)], ry: alongX ? 0 : 90, key: 'bricks_2', tint: DAMP[Math.floor(grnd() * DAMP.length)], ds: true, ends: false, seg: 8 });
            /* THE GRIME ON THE WALLS (the grime pass, mondo 11-16): along every side of the rectangle that is wall, a dark slime line at the
               wall's foot; along the north / west wall of a run of three squares or more, a rusted main on brackets with a thin line under it,
               and a downpipe at its end (parts with no sheet wear a surface by their colour: three-renderer.js _hqArchSurface) */
            const side = (horiz, at, a0, n, out, pipes) => { let run = 0; for (let i = 0; i <= n; i++) { const wallHere = i < n && !open(p.sx + (horiz ? a0 + i : at + out), p.sy + (horiz ? at + out : a0 + i));   /* (the room's squares, not the plot's: a plot line is no wall) */
                if (wallHere) { run++; continue; } if (!run) continue;
                const s0 = a0 + i - run, L = run * C, mid = (horiz ? gx(p.sx + s0) - ox : gz(p.sy + s0) - oz) + L / 2, edge = (horiz ? gz(p.sy + at + (out > 0 ? 1 : 0)) - oz : gx(p.sx + at + (out > 0 ? 1 : 0)) - ox), inw = -out;
                const at3 = (off, y) => horiz ? [r2(mid), y, r2(edge + inw * off)] : [r2(edge + inw * off), y, r2(mid)], sz = (t, hh) => horiz ? [r2(L), hh, t] : [t, hh, r2(L)];
                parts.push({ s: 'box', p: at3(0.05, 0), size: sz(0.08, r2(0.45 + grnd() * 0.5)), key: 'bricks_2', tint: 0x1c2416, top: false });
                if (pipes && run >= 3) { const y = r2(2.3 + grnd() * 0.5);
                    parts.push({ s: 'box', p: at3(0.3, y), size: sz(0.3, 0.3), key: RUST, tint: 0x6a3f24, under: true }, { s: 'box', p: at3(0.24, r2(y - 0.42)), size: sz(0.12, 0.12), key: RUST, tint: 0x2e3a2e, under: true });
                    for (let b = 0.9; b < L; b += 3.5) { const q = horiz ? [r2(mid - L / 2 + b), r2(y - 0.1), r2(edge + inw * 0.2)] : [r2(edge + inw * 0.2), r2(y - 0.1), r2(mid - L / 2 + b)]; parts.push({ s: 'box', p: q, size: horiz ? [0.1, 0.5, 0.4] : [0.4, 0.5, 0.1], key: RUST, tint: 0x222222 }); }
                    const e = horiz ? [r2(mid + L / 2 - 0.4), 0, r2(edge + inw * 0.3)] : [r2(edge + inw * 0.3), 0, r2(mid + L / 2 - 0.4)]; parts.push({ s: 'cyl', p: e, r: 0.15, h: y, key: RUST, tint: 0x5a3622, seg: 8 }); count.pipes = (count.pipes || 0) + 1; }
                run = 0; } };
            side(true, ly, lx, w, -1, true); side(true, ly + h - 1, lx, w, 1, false); side(false, lx, ly, h, -1, true); side(false, lx + w - 1, ly, h, 1, false); }
        VAULT.push({ k: 'arch', id: 'sew:' + p.id + ':roof', x: r2(ox), z: r2(oz), rot: 0, base: p.base, parts }); count.vaults = (count.vaults || 0) + parts.length - 1; });
    /* ── THE GRIME ON THE FLOOR (the grime pass): floor decals (data.js DOOR_HQ.decals: the room's own row, written by this tool; the game
       draws 80 a room at most, the props' own stains included, so 60 here): grime on the walks, puddles beside the water, oil on the track.
       A district's own (ctx.grime) come first: `fr.decals`. ── */
    const DEC = (fr.decals || []).slice();
    { const want = [];
      fr.plots.forEach(p => { const dry = [], wet = []; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { const x = p.sx + lx, y = p.sy + ly; if (!'of'.includes(cell[y][x])) continue;
              let byW = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (open(x + dx, y + dy) && cell[y + dy][x + dx] === 'w') byW = true; (byW ? wet : dry).push([x, y]); }
          const pick = l => l.length ? l[Math.floor(grnd() * l.length)] : null, a = pick(dry.length ? dry : wet), b = pick(wet.length ? wet : dry);
          if (a) want.push({ kind: p.d === 'T' ? 'oil' : 'grime', x: r2(gcx(a[0]) + (grnd() - 0.5) * 1.4), z: r2(gcz(a[1]) + (grnd() - 0.5) * 1.4), y: p.base, r: r2(1.2 + grnd() * 1.1), rot: Math.round(grnd() * 360) });
          if (b) want.push({ kind: p.d === 'H' ? 'grime' : 'puddle', x: r2(gcx(b[0]) + (grnd() - 0.5)), z: r2(gcz(b[1]) + (grnd() - 0.5)), y: p.base, r: r2(1.1 + grnd() * 0.9), rot: Math.round(grnd() * 360) }); });
      want.forEach(d => { if (DEC.length < 60) DEC.push(d); }); }
    /* ── THE OPEN GROUND: every square that is not wall, as `space` rows (greedy rectangles) ── */
    const spaces = [];
    { const used = new Uint8Array(W * Hh);
      for (let cy = 0; cy < Hh; cy++) for (let cx = 0; cx < W; cx++) { if (!open(cx, cy) || used[cy * W + cx]) continue;
          let w = 1; while (cx + w < W && !used[cy * W + cx + w] && open(cx + w, cy)) w++;
          let h = 1; rows: while (cy + h < Hh) { for (let i = 0; i < w; i++) if (used[(cy + h) * W + cx + i] || !open(cx + i, cy + h)) break rows; h++; }
          for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(cy + j) * W + cx + i] = 1;
          spaces.push({ k: 'space', x: r2(gx(cx) + w * C / 2), z: r2(gz(cy) + h * C / 2), w: w * C, d: h * C }); } }
    /* ── THE PAINT: one sheet a square (0 = the room's own concrete) ── */
    const paint = new Uint8Array(W * Hh);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x], p = plotAt(x, y), d = p ? p.d : null;
        paint[y * W + x] = ch === 'x' ? 0 : d === 'O' ? 2 : d === 'H' ? 3 : d === 'T' ? (ch === 'f' ? 6 : 0) : ch === 'b' ? 5 : ch === 'o' ? 1 : 0; }
    /* ── the walk check: every plot is reached from the spawn through the frame's openings (a square-to-square walk on the plan; a level
       change is crossed only on an opening's own squares) ── */
    const SP = fr.spawn, seen = new Uint8Array(W * Hh), st = [SP];
    if (!open(SP[0], SP[1])) throw new Error(fr.name + ': the spawn is not open'); seen[SP[1] * W + SP[0]] = 1;
    const cross = (x, y, X, Y) => { const a = plotAt(x, y), b = plotAt(X, Y); if (a === b || (a && b && a.level === b.level)) return true; if (!a || !b) return false;
        return OPEN.some(o => ((o.hi === a && o.lo === b) || (o.hi === b && o.lo === a)) && Math.abs((o.ns ? x : y) - o.mid) <= 1); };
    while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!open(X, Y) || seen[Y * W + X] || !cross(x, y, X, Y)) continue; seen[Y * W + X] = 1; st.push([X, Y]); } }
    const cold = fr.plots.filter(p => { if (p.solid) return false; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.sy + ly) * W + p.sx + lx]) return false; return true; }).map(p => p.id + ' ' + p.name);
    if (process.env.SEWERS_DUMP) console.log(fr.name + '\n' + cell.map((r, y) => r.map((ch, x) => open(x, y) && !seen[y * W + x] ? '!' : ch === 'x' ? ' ' : ch).join('')).join('\n'));
    if (cold.length) throw new Error(fr.name + ': plots not reached on foot: ' + cold.join(', '));
    let op = 0, un = 0; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (open(x, y)) { op++; if (!seen[y * W + x]) un++; }
    Object.assign(count, { openSquares: op, unreachedSquares: un, plots: fr.plots.length, spaces: spaces.length, falls: GO.filter(g => g.k === 'fall').length, stairs: GO.filter(g => g.k === 'ramp').length, climbs: GO.filter(g => g.k === 'climb').length });
    return { LVL, GO, WATER, RAILS, VAULT, DEC, spaces, paint, count, open, gcx, gcz, gx, gz, HX, HZ, TOP: Math.max.apply(null, fr.plots.map(p => p.base)) };
}

/* the home frame: derived for its checks (every plot reached, every prop out of the wall) */
const OPENi = OPEN.map((o, i) => Object.assign(o, { i }));
const HOME = derive({ name: 'the home frame', cell, W, Hh, plots: PLAN.plots.map(p => Object.assign(p, { col: p.x, row: p.y })), at: (c, r) => (c >= 0 && r >= 0 && c < GX && r < GY) ? Pxy(c, r) : null, OPEN: OPENi, seed: 4242, decals: DECALS, spawn: [plot['P02-02'].sx + 3, plot['P02-02'].sy + 6] });
{ const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
  props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); });
  npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
  props.forEach(p => { const sx = Math.floor((p.x + HX) / C), sy = Math.floor((p.z + HZ) / C); if (!open(sx, sy)) throw new Error(p.key + ' stands in the wall at ' + sx + ',' + sy); }); }
if (process.env.SEWERS_HOME) {   // the home room as it was before One World (a check: `SEWERS_HOME=1 node bake-sewers.js --dry-run` prints its counts)
    console.log('home', JSON.stringify(Object.assign({}, HOME.count, { features: HOME.spaces.length + HOME.LVL.length + HOME.WATER.length + HOME.GO.length + HOME.RAILS.length + F.length + HOME.VAULT.length, props: props.length, natives: npc.length }))); }

/* ══ THE ONE WORLD MOVE (2026-11-17, mondo's approved map v13; docs/plans/one-world/BUILD_PLAN.md phase 3 wave A, the Sewers row: "districts
   spread under the city districts they belong to"). mondo 11-17, asked whether the maze should stay one room: "so they're connected by tunnels,
   but aren't sewers literally tunnels? ... It basically is still all connected". So the five districts stand at their v13 places
   (docs/plans/one-world/plots.json `under.districts` sewW sewT sewH sewO sewR), plots moved with everything on them (ow-move.js), no district
   file edited. FOUR rooms (the room-splitting rule: what touches is one room):
     the Sewers + the Running Tunnels  `site_prebuilt_downtown_underworld` (the old id, part `underworld`): W in its 6 x 3 at 3,4 as it lay in the
        plan (the plots H and O stood on are its three solid plots and one empty cell), the Outfall under the Docks' Outfall at 8,7 (its fall
        kept: the one plot outside the sheet's rect, inside the room's box); T down the column at 9,6..11, its line of five TURNED A QUARTER
        (270, the Depot at the top) so the track runs north-south, the Loop Line's south spur (P03-04) at its foot as it was, not turned. The
        Depot's hatch stair now climbs into the Docks' Outfall beside it (the one opening cut by this move).
     the Holding Cells `…_ow_cells` at 1,1 · the Old Workings `…_ow_workings` at 1,10 · the Radioactive Drain `…_ow_drain` at 10,1.
   WHERE PLOTS PARTED, A DOOR: every opening of the plan whose two plots stand apart now is a door pair on the two plots' own lines (the cell
   door, the trap, the Adit, the Power Station Drain's stair, the Outfall's doorway): the walks of phase 4.4 (U1 … U4, U12) replace them later.
   The well at the Junction lost the Crossing under it (the Running Tunnels stand east now): its rope hangs over a dead end. ══ */
const MOVE = require('./ow-move.js')({ cols: GX, rows: GY, cell, fill: 'x', plots: PLAN.plots.map(p => ({ id: p.id, x: p.x, y: p.y, name: p.name, district: p.d, level: p.level })),
    features: F, props, npc, doors });
const T_LINE = { 'P04-03': [9, 6], 'P03-03': [9, 7], 'P02-03': [9, 8], 'P01-03': [9, 9], 'P00-03': [9, 10] };
/* THE UNDERGROUND WALKS (2026-11-17, BUILD_PLAN phase 4.4; plots.json `under.walks` U1 U2 U3 U4 U5 U14): the culverts between the five districts
   are built, so the Sewers are ONE room again (mondo 11-17: "Connected/bigger rooms is better. If the room is smaller than disaster city than dont
   even ask, just make it one room"; the box is 17 x 16 plots, mostly rock). The five parted door pairs of phase 3 are gone: the walks replace them.
   A walk plot is a brick culvert: a passage three squares wide from each port to a chamber in the plot's middle, under the same vaults and
   grime as the districts (derive() reads it like any plot). Plain names, mine. One walk plot more than the map: THE WELL FOOT (5,7), where the
   Junction's rope comes down again (the Crossing it hung over stands east since phase 3) and goes on east into U1.
   Ends past the room: U5 west into the D.U.M.B.'s East Gantry (seam ow_v_7_16), U14 east into the Sea Floor (ow_v_18_5), the Cells' west side
   into U12 (ow_v_1_1, the Cavern tool's tunnel). */
const WALK = [
    { id: 'U1', name: 'The Loop Culvert', plots: [[6, 7, 0], [6, 8, 0], [6, 9, 0], [7, 9, 0], [8, 9, 0]] },
    { id: 'WF', name: 'The Well Foot', plots: [[5, 7, 0]] },
    { id: 'U2', name: 'The Cells Culvert', plots: [[6, 3, 8], [6, 2, 8], [6, 1, 8], [5, 1, 8], [4, 1, 8], [3, 1, 8]] },
    { id: 'U3', name: 'The Workings Culvert', plots: [[6, 10, 0], [5, 10, 0], [4, 10, 0], [3, 10, 0]] },
    { id: 'U4', name: 'The Drain Culvert', plots: [[9, 5, 8], [10, 5, 8], [11, 5, 8], [11, 4, 4], [11, 3, 4], [11, 2, 0]] },
    { id: 'U14', name: 'The Outfall Pipe', plots: [[12, 5, 8], [13, 5, 8], [14, 5, 4], [15, 5, 4], [16, 5, 0], [17, 5, 0]] },
    { id: 'U5', name: 'The Gantry Tunnel', plots: [[9, 12, 0], [9, 13, 0], [9, 14, 0], [9, 15, 0], [9, 16, 0], [8, 16, 0], [7, 16, 0]] },
];
/* every join that is not two walk plots of one walk side by side: [world a, world b, kind, port] (a district plot is named by its home id;
   kind 'open' = same level, 'stair' / 'climb' = an opening of the plan's kinds; port = the window's middle square along the side, 6 = the middle) */
const WJOIN = [
    ['P03-02', [6, 7], 'stair', 6],      // the Culverts (level 4) down to U1
    [[8, 9], 'P01-03', 'open', 6],       // U1 into the Loop Line's west side (turned: its old north side)
    ['P02-02', [5, 7], 'climb', 6],      // the Junction's well: the rope down to the Well Foot (the plan's own opening, its foot moved)
    [[5, 7], [6, 7], 'open', 6],
    ['P03-00', [6, 3], 'open', 9],       // the Pumping Station's north side (its middle is the `pump` door's spur)
    [[3, 1], 'P01-00', 'stair', 6],      // up the cell door's stair into the Drunk Tank (the plan's own port)
    [[6, 9], [6, 10], 'open', 6],        // U3 leaves U1's bend
    [[3, 10], 'P01-01', 'open', 6],      // into the Old Workings' east side
    ['P05-01', [9, 5], 'open', 3],       // the East Return's east side (its middle is the stadium's spur)
    [[11, 2], 'P05-04', 'open', 6],      // into the Sludge Pit's south side
    [[11, 5], [12, 5], 'open', 6],       // the Outfall Pipe leaves U4
    ['P03-04', [9, 12], 'open', 9],      // the Loop Line's spur, south side (its middle is the platform's spur)
];
/* the seams to the rooms past this one: [walk or district plot, side, port, seam id, door] */
const WSEAM = [
    [[7, 16], 'W', 6, 'ow_v_7_16', { leaf: 'leaf_bulkhead', label: 'THE D.U.M.B.', sub: 'THE GANTRY TUNNEL · INTO THE EAST GANTRY', room: 'site_prebuilt_dumb_base' }],
    [[17, 5], 'E', 6, 'ow_v_18_5', { leaf: 'leaf_bulkhead', label: 'THE DEEP · THE SEA FLOOR', sub: 'THE OUTFALL · THE PIPE RUNS OUT UNDER THE SEA', room: 'site_prebuilt_atlantis_ow_floor' }],
    /* THE FREIGHT LINE (plots.json `under.rides`, a ride, no plots, late game): the Power Station Drain's north side, to the D.U.M.B.'s Level −6, clearance L6 */
    ['P04-04', 'N', 6, 'freight_line', { leaf: 'leaf_vault', label: 'THE FREIGHT LINE', sub: 'THE FREIGHT LINE · TO THE D.U.M.B.\'S SUB-LEVEL 7 · CLEARANCE L6', room: 'site_prebuilt_dumb_base', gate: 6 }],
    ['P00-00', 'W', 8, 'ow_v_1_1', { leaf: 'leaf_cell', label: 'THE CELLS TUNNEL', sub: 'THE GUARDROOM · A TUNNEL WEST UNDER THE CITY', room: 'site_prebuilt_hollow_earth_ow_tunnelway' }],
];
const ROOMS = [
    { room: ROOM, part: PART, name: 'THE SEWERS', label: 'DISASTER CITY · THE SEWERS', sub: 'THE CULVERTS · THE RUNNING TUNNELS · THE CELLS · THE OLD WORKINGS · THE RADIOACTIVE DRAIN', spawnAt: ['P02-02', 3, 6], lines: O.sewers.l.concat(O.tunnels.l, O.cells.l, O.workings.l), seed: 4242,
      parti: 'A maze under the city: brick culverts that bend, fork and stop, the upper culverts pouring into the lower rooms over three falls; the Running Tunnels down its east side, the old line turned to run south; long culverts out to the cells, the old mine, the radioactive drain, the sea and the D.U.M.B.',
      place: id => { const p = plot[id]; if (T_LINE[id]) return { wx: T_LINE[id][0], wy: T_LINE[id][1], turn: 270 }; if (id === 'P03-04') return { wx: 9, wy: 11 }; if (id === 'P05-03') return { wx: 8, wy: 7 };
          if (p.d === 'H') return { wx: 1 + p.x, wy: 1 }; if (p.d === 'O') return { wx: 1 + p.x, wy: 10 }; if (p.d === 'R') return { wx: 10 + (p.x - 4), wy: 1 };
          if (p.d !== 'W') return null; if (p.solid) return { wx: [3, 4, 3][p.x], wy: [4, 4, 5][p.x] }; return { wx: 3 + p.x, wy: 4 + p.y }; } },
];
const PARTED = [];
/* the one opening this move cuts: the Depot's hatch stair (P04-03's north side, now its west) climbs into the Docks' Outfall (P05-02's east side) */
const JOINED = [{ hi: 'P05-02', lo: 'P04-03', kind: 'stair', name: 'the Maintenance Hatch, into the Docks\' Outfall' }];
const WORLD = {}, OUT = [], SIDE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
ROOMS.forEach(R => {
    const list = []; PLAN.plots.forEach(p => { const q = R.place(p.id); if (q) list.push(Object.assign({ id: p.id }, q)); });
    WALK.forEach(w => w.plots.forEach(q => list.push({ wx: q[0], wy: q[1], name: w.name, district: 'U', level: q[2], isNew: true, walk: w.id })));
    const M = MOVE.room(list); R.M = M; R.wx = M.wx; R.wy = M.wy;
    list.forEach(q => { if (q.id) WORLD[q.id] = { room: R.room, wx: q.wx, wy: q.wy, turn: q.turn || 0 }; });
    /* the frame's plots: a plot's squares stand at (col, row) of the room; its sides are the turned ones. A walk plot's id is `U<x>_<y>` */
    const fp = {}; M.order.forEach(e => { if (!e.id) { e.id = 'U' + e.wx + '_' + e.wy; fp[e.id] = { id: e.id, name: e.name, d: 'U', level: e.level, base: r2(e.level * LEVEL), solid: false, col: e.col, row: e.row, sx: e.col * N, sy: e.row * N, turn: 0, walk: true }; return; }
        const h = plot[e.id]; fp[e.id] = { id: e.id, name: h.name, d: h.d, level: h.level, base: h.base, solid: h.solid, col: e.col, row: e.row, sx: e.col * N, sy: e.row * N, turn: e.turn || 0 }; });
    const at = (c, r) => { const e = M.at[c + ',' + r]; return e ? fp[e.id] : null; };
    const cellR = M.cell;
    /* the openings of the plan still between two plots that touch the same way, and the joins this move cuts */
    const OPENr = [];
    const mkOpen = (A, B, o) => { const ns = A.col === B.col, hi = A.level >= B.level ? A : B, lo = hi === A ? B : A;
        const line = ns ? Math.max(A.sy, B.sy) : Math.max(A.sx, B.sx), mid = (ns ? A.sx : A.sy) + (o.port != null ? o.port : 6), dx = ns ? 0 : Math.sign(lo.col - hi.col), dy = ns ? Math.sign(lo.row - hi.row) : 0;
        return Object.assign({}, o, { ns, hi, lo, line, mid, dx, dy, rise: r2(hi.base - lo.base) }); };
    OPENi.forEach(o => { const A = fp[o.a], B = fp[o.b]; if (!A || !B || A.turn || B.turn) return;
        const ha = plot[o.a], hb = plot[o.b]; if (A.col - B.col !== ha.x - hb.x || A.row - B.row !== ha.y - hb.y) return;
        OPENr.push(mkOpen(A, B, o)); });
    JOINED.forEach(j => { const A = fp[j.hi], B = fp[j.lo]; if (!A || !B) return; if (Math.abs(A.col - B.col) + Math.abs(A.row - B.row) !== 1) throw new Error('JOINED ' + j.name + ': the plots do not touch');
        const o = mkOpen(A, B, Object.assign({ i: OPENi.length + 1 }, j));
        /* the hi side's port: the three squares each side of the middle, dug from the line in until open ground (the Docks' Outfall's east edge) */
        for (let m = -1; m <= 1; m++) for (let k = 0; k < N; k++) { const t = o.line + (o.dx + o.dy > 0 ? -1 - k : k), sx = o.ns ? o.mid + m : t, sy = o.ns ? t : o.mid + m; if (fp[j.hi] !== at(Math.floor(sx / N), Math.floor(sy / N))) break;
            const ch = cellR[sy][sx]; if (ch === 'x' || 'wsj'.includes(ch)) cellR[sy][sx] = 'o'; else if (k >= 3) break; }
        /* the lo side: water and track stop three squares short of it (as every stair opening of the plan) */
        for (let m = -1; m <= 1; m++) for (let k = 0; k < 3; k++) { const t = o.line + (o.dx + o.dy > 0 ? k : -1 - k), sx = o.ns ? o.mid + m : t, sy = o.ns ? t : o.mid + m; if ('wsj'.includes(cellR[sy][sx])) cellR[sy][sx] = 'o'; }
        OPENr.push(o); });
    /* ── THE WALKS, DUG ── */
    const W = M.W, Hh = M.D, ofXY = (x, y) => at(x - M.wx, y - M.wy), ofRef = r => typeof r === 'string' ? fp[r] : ofXY(r[0], r[1]);
    const dig = (x, y) => { if (x >= 0 && y >= 0 && x < W && y < Hh && cellR[y][x] === 'x') cellR[y][x] = 'o'; };
    const sideBetween = (A, B) => B.col > A.col ? 'E' : B.col < A.col ? 'W' : B.row > A.row ? 'S' : 'N';
    /* a plot's ports, by side: { side: port middle square } */
    const PORTS = {}; const port = (e, s, o) => { (PORTS[e.id] = PORTS[e.id] || {})[s] = o; };
    WALK.forEach(w => w.plots.forEach((q, i) => { if (!i) return; const A = ofXY(w.plots[i - 1][0], w.plots[i - 1][1]), B = ofXY(q[0], q[1]);
        port(A, sideBetween(A, B), 6); port(B, sideBetween(B, A), 6);
        if (A.level !== B.level) OPENr.push(mkOpen(A, B, { kind: 'stair', name: w.name + ', the steps', i: 100 + OPENr.length })); }));
    WJOIN.forEach(j => { const A = ofRef(j[0]), B = ofRef(j[1]); if (!A || !B) throw new Error('WJOIN: no plot ' + JSON.stringify(j));
        if (Math.abs(A.col - B.col) + Math.abs(A.row - B.row) !== 1) throw new Error('WJOIN: ' + A.name + ' and ' + B.name + ' do not touch');
        port(A, sideBetween(A, B), j[3]); port(B, sideBetween(B, A), j[3]);
        if (j[2] === 'open') { if (A.level !== B.level) throw new Error('WJOIN: ' + A.name + ' and ' + B.name + ' stand at two levels'); return; }
        OPENr.push(mkOpen(A, B, { kind: j[2], rope: j[2] === 'climb', name: A.name + ' / ' + B.name, port: j[3], i: 200 + OPENr.length })); });
    WSEAM.forEach(s => { const e = ofRef(s[0]); port(e, s[1], s[2]); });
    /* a walk plot: a chamber in the middle, a passage three wide from each port to it. A district plot: the window dug from its side in
       until the first open square of that lane (its own floor) */
    const rnd = mkRnd(5150);
    if (process.env.SEW_PLOTS) process.env.SEW_PLOTS.split(',').forEach(id => { const e = fp[id]; console.log(id + ' ' + e.name + ' L' + e.level); for (let y = 0; y < N; y++) console.log('  ' + cellR[e.sy + y].slice(e.sx, e.sx + N).join('')); });
    Object.keys(PORTS).forEach(id => { const e = fp[id], sx0 = e.sx, sy0 = e.sy, P2 = PORTS[id];
        if (e.walk) { const sides = Object.keys(P2), straight = sides.length === 2 && SIDE[sides[0]][0] === -SIDE[sides[1]][0] && SIDE[sides[0]][1] === -SIDE[sides[1]][1] && P2[sides[0]] === P2[sides[1]];
            let x0 = 4, x1 = 8, y0 = 4, y1 = 8; if (straight) { if (sides[0] === 'N' || sides[0] === 'S') { x0 = P2[sides[0]] - 1; x1 = P2[sides[0]] + 1; } else { y0 = P2[sides[0]] - 1; y1 = P2[sides[0]] + 1; } }
            else { const g = Math.floor(rnd() * 2); x0 -= g; y0 += g - 1; x1 += 1 - g; y1 += Math.floor(rnd() * 2); }
            sides.forEach(s => { const o = P2[s]; if (s === 'N' || s === 'S') { x0 = Math.min(x0, o - 1); x1 = Math.max(x1, o + 1); } else { y0 = Math.min(y0, o - 1); y1 = Math.max(y1, o + 1); } });
            for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) dig(sx0 + x, sy0 + y);
            sides.forEach(s => { const o = P2[s]; for (let k = 0; k < N; k++) for (let m = -1; m <= 1; m++) {
                if (s === 'N' && k <= y0) dig(sx0 + o + m, sy0 + k); if (s === 'S' && 11 - k >= y1) dig(sx0 + o + m, sy0 + 11 - k);
                if (s === 'W' && k <= x0) dig(sx0 + k, sy0 + o + m); if (s === 'E' && 11 - k >= x1) dig(sx0 + 11 - k, sy0 + o + m); } });
            e.chamber = [x0, y0, x1, y1]; return; }
        Object.keys(P2).forEach(s => { const o = P2[s], into = [-SIDE[s][0], -SIDE[s][1]];
            for (let m = -1; m <= 1; m++) { let x = s === 'E' ? sx0 + 11 : s === 'W' ? sx0 : sx0 + o + m, y = s === 'S' ? sy0 + 11 : s === 'N' ? sy0 : sy0 + o + m, k = 0;
                while (k < N && cellR[y][x] === 'x') { cellR[y][x] = 'o'; x += into[0]; y += into[1]; k++; }
                if (k >= N) throw new Error(R.room + ': no open floor behind the ' + s + ' side of ' + e.name + ' (lane ' + (o + m) + ')'); } }); });
    R.WSEAM = WSEAM.map(s => ({ e: ofRef(s[0]), side: s[1], port: s[2], id: s[3], door: s[4] }));
    const decals = DECALS.map(d => { const q = M.toRoom(d.x, d.z); return q ? Object.assign({}, d, { x: q[0], z: q[1] }) : null; }).filter(Boolean);
    const sp = M.sq(R.spawnAt[0], R.spawnAt[1], R.spawnAt[2]);
    R.fr = { name: R.name, cell: cellR, W: M.W, Hh: M.D, plots: Object.values(fp), fp, at, OPEN: OPENr, seed: R.seed, decals, spawn: sp };
    /* THE WALKS, DRESSED: a lamp in every other chamber (one in three lit), the sewers' own clutter off the middle, a grate or a culvert mouth */
    const nProps0 = M.props.length, wp = Object.values(fp).filter(p => p.walk), CLUTTER = ['traffic_barrel', 'tire_stack', 'drain_grate', 'culvert_mouth', 'wet_floor_sign', 'mushroom2'];
    const used = new Set(), free = (x, y) => cellR[y][x] === 'o' && !used.has(x + ':' + y);
    wp.forEach((p, i) => { const c = p.chamber; if (!c) return;
        const corners = [[c[0], c[1]], [c[2], c[1]], [c[0], c[3]], [c[2], c[3]]].map(q => [p.sx + q[0], p.sy + q[1]]).filter(q => free(q[0], q[1]));
        if (i % 2 === 0 && corners.length) { const q = corners[0]; used.add(q[0] + ':' + q[1]); M.props.push({ key: 'cave_torch', x: M.gcx(q[0]), z: M.gcz(q[1]), noLight: i % 3 !== 0 }); }
        const q2 = corners[corners.length - 1]; if (q2 && free(q2[0], q2[1])) { used.add(q2[0] + ':' + q2[1]); const k = CLUTTER[Math.floor(rnd() * CLUTTER.length)];
            M.props.push({ key: k, x: r2(M.gcx(q2[0]) + (rnd() - 0.5)), z: r2(M.gcz(q2[1]) + (rnd() - 0.5)), face: Math.round(rnd() * 360) }); }
        R.fr.decals.push({ kind: rnd() < 0.5 ? 'puddle' : 'grime', x: M.gcx(p.sx + 6), z: M.gcz(p.sy + 6), y: p.base, r: r2(1.2 + rnd()), rot: Math.round(rnd() * 360) }); });
    R.walkProps = M.props.length - nProps0;
});
/* the doors where plots parted: on each plot's own side, on the room's wall when the side lies on it, else free half a square in */
const sideOf = (A, B) => { const ha = plot[A], hb = plot[B]; return hb.x > ha.x ? 'E' : hb.x < ha.x ? 'W' : hb.y > ha.y ? 'S' : 'N'; };
const turnSide = (s, t) => { const o = ['N', 'E', 'S', 'W']; return o[(o.indexOf(s) + t / 90) % 4]; };
/* a door on a frame plot's side at a port square: on the room's wall when the side lies on it, else free on the plot's last square, facing in */
function sideDoor(R, e, s, portSq, o) {
    const wallOn = { N: e.row === 0, S: e.row === R.M.rows - 1, W: e.col === 0, E: e.col === R.M.cols - 1 }[s], d = Object.assign({}, o);
    if (e.level) d.y = r2(e.level * LEVEL);   // (a door on a raised plot stands on its floor: a wall door with no y stands on the room's ground, under it)
    const along = (s === 'N' || s === 'S') ? R.M.gcx(e.sx + portSq) : R.M.gcz(e.sy + portSq);
    if (wallOn) { d.wall = s.toLowerCase(); if (s === 'N' || s === 'S') d.x = along; else d.z = along; return d; }
    d.wall = 'free'; d.passage = Object.assign({}, MOVE.FREE_PASS);
    if (s === 'N') { d.x = along; d.z = R.M.gcz(e.sy); d.face = 180; } else if (s === 'S') { d.x = along; d.z = R.M.gcz(e.sy + N - 1); d.face = 0; }
    else if (s === 'W') { d.x = R.M.gcx(e.sx); d.z = along; d.face = 90; } else { d.x = R.M.gcx(e.sx + N - 1); d.z = along; d.face = 270; }
    return d;
}
function edgeDoor(R, id, side, o) { const e = R.M.ofHome[id]; return sideDoor(R, R.fr.fp[id], turnSide(side, e.turn || 0), 6, o); }
const roomOf = id => ROOMS.find(R => R.M.ofHome[id]);
const EXTRA = {}; ROOMS.forEach(R => { EXTRA[R.room] = []; });
PARTED.forEach(P => { const RA = roomOf(P.a), RB = roomOf(P.b); if (RA === RB) throw new Error(P.id + ': both plots in one room');
    EXTRA[RA.room].push(edgeDoor(RA, P.a, sideOf(P.a, P.b), { id: P.id, leaf: P.leaf, wide: P.leaf === 'leaf_bulkhead', label: RB.name, sub: P.subA, action: { room: RB.room, at: P.id } }));
    EXTRA[RB.room].push(edgeDoor(RB, P.b, sideOf(P.b, P.a), { id: P.id, leaf: P.leaf, wide: P.leaf === 'leaf_bulkhead', label: RA.name, sub: P.subB, action: { room: RA.room, at: P.id } })); });
/* the seams of the walks: a door pair with one id at both ends (the other end is written by the D.U.M.B.'s, the Deep's and the Cavern's tools) */
ROOMS.forEach(R => R.WSEAM.forEach(s => EXTRA[R.room].push(sideDoor(R, s.e, s.side, s.port, Object.assign(s.door.gate ? { minClearance: s.door.gate } : { way: 'trail' }, { id: s.id, leaf: s.door.leaf, wide: s.door.leaf === 'leaf_bulkhead', label: s.door.label, sub: s.door.sub, action: { room: s.door.room, at: s.id }, desc: '' })))));
/* every square a door stands on is dry walkway */
ROOMS.forEach(R => EXTRA[R.room].forEach(d => { if (d.wall !== 'free') return; const sx = Math.floor((d.x + R.M.HX) / C), sy = Math.floor((d.z + R.M.HZ) / C); if (R.fr.cell[sy][sx] === 'x') throw new Error(d.id + ' stands in the wall in ' + R.room); }));

/* THE WAYS OUT, moved: a link's sewer end goes with its plot (on the new room's wall when its side lies on it, else free on the plot's line).
   One is written again because its side is a seam inside the room now: tunnels_works (the Ghost Station's west end is the Loop Line spur's
   north end now) goes to the Loop Line's old south spur (P03-03, turned: its east side); the track runs on there. */
const WAYS = {};
{ const homeSide = { n: 'N', s: 'S', w: 'W', e: 'E' };
  const plotOfWay = k => { const w = WAY[k]; const x = w.wall === 'free' ? w.x : w.wall === 'w' ? -HX + 1 : w.wall === 'e' ? HX - 1 : w.at, z = w.wall === 'free' ? w.z : w.wall === 'n' ? -HZ + 1 : w.wall === 's' ? HZ - 1 : w.at; return MOVE.homePlot(x, z); };
  Object.keys(WAY).forEach(k => { const w = WAY[k], hp = plotOfWay(k), R = roomOf(hp.id);
      if (k === 'tunnels_works') { const e = R.M.ofHome['P03-03']; WAYS[k] = Object.assign({ R }, e.col === R.M.cols - 1 ? { wall: 'e', at: R.M.gcz(e.row * N + 6) } : { wall: 'free', x: R.M.gcx(e.col * N + N - 1), z: R.M.gcz(e.row * N + 6), face: 270 }); return; }
      if (w.wall === 'free') { const q = R.M.toRoom(w.x, w.z), e = R.M.ofHome[hp.id]; WAYS[k] = { R, wall: 'free', x: q[0], z: q[1], face: (((w.face || 0) + (e.turn || 0)) % 360) }; return; }
      /* the spur's place along its wall, through the plot's map, then the side as it stands now */
      const hx = (w.wall === 'n' || w.wall === 's') ? w.at : (w.wall === 'w' ? -HX + C / 2 : HX - C / 2), hz = (w.wall === 'w' || w.wall === 'e') ? w.at : (w.wall === 'n' ? -HZ + C / 2 : HZ - C / 2), q = R.M.toRoom(hx, hz), e = R.M.ofHome[hp.id];
      const s = turnSide(homeSide[w.wall], e.turn || 0), wallOn = { N: e.row === 0, S: e.row === R.M.rows - 1, W: e.col === 0, E: e.col === R.M.cols - 1 }[s];
      if (wallOn) WAYS[k] = { R, wall: s.toLowerCase(), at: (s === 'N' || s === 'S') ? q[0] : q[1] };
      else WAYS[k] = { R, wall: 'free', x: q[0], z: q[1], face: { N: 180, S: 0, W: 90, E: 270 }[s] }; });
  /* the docks' manhole: the spur's middle row is the hatch stair's arrival now, so its grate stands one square north of it on the line */
  if (WAYS.docks_sewer.wall === 'free') WAYS.docks_sewer.z = r2(WAYS.docks_sewer.z - C); }
/* the room door `pump` (the city's sewer door lands on it): on the Pumping Station's north side, free on its line since the Cells Culvert
   stands north of it (the culvert's port is beside it, squares 8..10) */
{ const R = ROOMS[0], w = WAYS.pump; if (w.R !== R) throw new Error('pump: not in the Sewers');
  const d = doors.find(x => x.id === 'pump'); if (w.wall === 'n') d.x = w.at; else { d.wall = 'free'; d.x = w.x; d.z = w.z; d.face = w.face; d.passage = Object.assign({}, MOVE.FREE_PASS); } }

/* ── derive every room, write it ── */
const L = [], DEC_ROWS = [], TOTAL = { props: 0, natives: 0 };
L.push("        /* SEWERS24-BEGIN — THE SEWERS ON PLOTS (2026-11-16) + THE ONE WORLD MOVE (2026-11-17: four rooms at their One World places, under the city): written by `node bake-sewers.js` from docs/areas/sewers/layout.json + districts/<W T H O R>.js + docs/plans/one-world/plots.json. Never hand-edit between the markers; edit the tool, the layout or a district file and rerun. */");
ROOMS.forEach((R, ri) => {
    const fr = R.fr, M = R.M, X = derive(fr), feats = X.spaces.concat(X.LVL, X.WATER, X.GO, X.RAILS, M.features, X.VAULT);
    const SH = r2(X.TOP + CEIL), sp = fr.spawn, SPM = { x: X.gcx(sp[0]), z: X.gcz(sp[1]) }, spPlot = fr.at(Math.floor(sp[0] / N), Math.floor(sp[1] / N));
    /* the props stand on open squares of their own room */
    M.props.forEach(p => { const sx = Math.floor((p.x + M.HX) / C), sy = Math.floor((p.z + M.HZ) / C); if (!X.open(sx, sy)) throw new Error(R.room + ': ' + p.key + ' stands in the wall at ' + sx + ',' + sy); });
    const counters2 = counters.map(c => { const q = M.toRoom(c.x, c.z); return q ? Object.assign({}, c, { x: q[0], z: q[1] }) : null; }).filter(Boolean);
    const roomDoors = (ri === 0 ? doors.map(d => d.id === 'pump' ? d : null).filter(Boolean) : []).concat(EXTRA[R.room]);
    TOTAL.props += M.props.length - (R.walkProps || 0); TOTAL.natives += M.npc.length;
    console.log(R.room + ' ' + JSON.stringify(Object.assign({ world: [M.wx, M.wy], box: [M.cols, M.rows], mask: M.mask.join('/') }, X.count, { features: feats.length, props: M.props.length, natives: M.npc.length, doors: roomDoors.length })));
    if (M.strays.length) console.log('  STRAYS (a piece across two plots that no longer stand the same way):\n    ' + M.strays.join('\n    '));
    const PAL = ['urban:RubberNonSlip3a', 'bricks_2', 'urban:TileGeneric4b', 'urban:ConcreteStriped1e', 'wood_planks', 'urban:TileSubway4a'];
    L.push("        " + R.room + ": {");
    L.push("            label: '" + R.label + "',");
    L.push("            sub: '" + R.sub.replace(/'/g, "\\'") + "',");
    L.push("            kind: 'box', site: 'prebuilt_downtown', part: '" + R.part + "',");
    L.push("            /* THE ONE WORLD: where this room stands on the world's plot grid (data.js hqOwIndex): under Disaster City */");
    L.push("            world: { hub: 'underworld', layer: 'under', wx: " + M.wx + ", wy: " + M.wy + " },");
    L.push("            shell: hqSewerShell({ w: " + (2 * M.HX) + ", d: " + (2 * M.HZ) + ", h: " + SH + ", wallH: " + SH + ", plate: { x: " + SPM.x + ", z: " + SPM.z + ", y: " + r2(spPlot.base + 3.2) + " },");
    L.push("                                  mood: { lamp: 0xbfe8b0, glow: 0x9fd0a0, strip: 0xd8f0c8, light: 0xcfe8c0, ambient: 0.13 }, fog: { color: 0x050806, density: 0.042 }, wallColor: 0x4e4a44, floorColor: 0x6c6e6a }),   // darker than the old rooms (mondo 11-16: \"dark and grimy and scary\")");
    L.push("            parti: '" + R.parti.replace(/'/g, "\\'") + "',");
    L.push("            typology: 'grid',");
    L.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", nx: " + M.cols + ", nz: " + M.rows + ", mask: " + J(M.mask) + ", names: " + J(M.order.map(e => [M.pid(e), fr.fp[e.id].name, fr.fp[e.id].d, fr.fp[e.id].level])) + " },");
    L.push("            terrain: {");
    L.push("                res: 0.875, floor: 'urban:ConcreteStriped2c', cliff: 'bricks_2', path: 'urban:RubberNonSlip3a',");
    L.push("                noise: { amp: 0, scale: 5 }, crag: false,");
    L.push("                waterLook: { water: 'sewer_water', deep_water: 'sewer_deep' },   // murky green-brown sewer water: LOOK ONLY, it is still water (three-renderer.js _hqWaterLook; mondo 11-16)");
    L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + X.gcx(0) + ", z0: " + X.gcz(0) + ", nx: " + fr.W + ", nz: " + fr.Hh + ", d: '" + Buffer.from(X.paint).toString('base64') + "' },");
    L.push("                /* every square that is not a `space` is the wall, brick to the roof */");
    L.push("                gen: { kind: 'plan', look: 'walls', wallKey: 'bricks_2', rim: 0, forceGrow: -0.3 },");
    L.push("                features: [");
    feats.forEach(f => L.push("                    " + J(f) + ","));
    L.push("                ],");
    L.push("            },");
    L.push("            doors: [");
    roomDoors.forEach(d => L.push("                " + J(d) + ","));
    L.push("            ],");
    L.push("            counters: " + J(counters2) + ",");
    L.push("            props: [");
    for (let i = 0; i < M.props.length; i += 4) L.push("                " + M.props.slice(i, i + 4).map(J).join(", ") + ",");
    L.push("            ],");
    L.push("            agents: [],");
    L.push("            npcSpots: " + J(M.npc) + ",");
    L.push("            onlineSpots: [],");
    L.push("            lines: " + J(R.lines) + ",");
    L.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: 90 },");
    L.push("        },");
    DEC_ROWS.push("    " + R.room + ": " + J(X.DEC) + ",   // SEWERS24-DECALS: written by bake-sewers.js");
});
L.push("        /* SEWERS24-END */");
const block = L.join('\n') + '\n';
if (TOTAL.props !== props.length || TOTAL.natives !== npc.length) throw new Error('the move lost pieces: props ' + props.length + ' -> ' + TOTAL.props + ', natives ' + npc.length + ' -> ' + TOTAL.natives);
/* the link rows in data.js that hold a place in these rooms (written by hand there): the tool refuses to bake when one has drifted */
const end = k => { const w = WAYS[k]; return "site: 'prebuilt_downtown', part: '" + w.R.part + "', wall: '" + w.wall + "', " + (w.wall === 'free' ? 'x: ' + w.x + ', z: ' + w.z + ', face: ' + w.face : (w.wall === 'n' || w.wall === 's' ? 'x: ' : 'z: ') + w.at) + ','; };
const WANT = Object.keys(WAYS).filter(k => k !== 'pump').map(k => [end(k), 'link ' + k]);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at these rooms yet (see the rows above)'); }
if (DRY) process.exit(0);
const ENDM = '        /* SEWERS24-END */\n', b0 = src.indexOf('        /* SEWERS24-BEGIN'), b1 = src.indexOf(ENDM);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + ENDM.length);
else { const anchor = '        site_prebuilt_downtown_sewers: {'; const a = src.indexOf(anchor); if (a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
/* the rooms' floor decals: one row a room in DOOR_HQ.decals */
{ src = src.split('\n').filter(l => l.indexOf('SEWERS24-DECALS') < 0).join('\n');
  const anchor = "    site_prebuilt_downtown_sewers: [ { kind: 'puddle'", a = src.indexOf(anchor); if (a < 0) throw new Error('DOOR_HQ.decals anchor not found');
  src = src.slice(0, a) + DEC_ROWS.join('\n') + '\n' + src.slice(a); }
fs.writeFileSync(file, src);
