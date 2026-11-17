#!/usr/bin/env node
/* bake-cavern.js — THE CAVERN ON PLOTS (2026-11-16, the Cavern zone thread; mondo's order for the eight old zones: "completely
   redesigned/reimagined with plots and districts ... Then move the exits"). The ultimate underworld of rock, ONE room of 6 x 6 plots of
   12 x 12 squares (252 x 252 m), three districts, each with its own light:
   K THE CAVERN (13 plots, dark, torch amber and lava red) · H HOLLOW EARTH (11, open under the Inner Sun) · A AGARTHA (12, the crystal city).
   Reads docs/areas/cavern/layout.json (first written by docs/plans/world-zones/make-cavern.js) and writes the room
   `site_prebuilt_hollow_earth_cavern` into data.js between CAVERN36-BEGIN / CAVERN36-END. `node bake-cavern.js` writes; `--dry-run` prints the
   counts; `CAVERN_DUMP=1` prints the walked map. Never hand-edit between the markers: edit this tool, the layout or a district file and rerun.
   Notes: docs/notes/areas-complexes.md "THE CAVERN ON PLOTS". Copied from bake-sewers.js (the same ctx for the district files).

   THE DISTRICT FILES: what stands in a district is written in docs/areas/cavern/districts/<K H A>.js, one thread a file. This tool keeps what
   is shared: the plan, the levels, the openings between plots (stairs, climbs, waterfalls), the water and the lava, the rock roof over K, the
   ways out, the shell and its three big lights, the checks.

   THE SQUARE MAP: x rock · o cave floor · h hot rock · f cut floor · u gaol floor · c crystal floor · w water · l lava · b plank / rope
   bridge / jetty · g grass · d dirt path · s sand · m marble · q crystal paving. Squares are (sx 0..72 west to east, sy 0..72 north to south).
   THE LEVELS: one height a plot (layout `level`, 1 = 1.75 m). THE ROOF: only the districts in layout `roofed` (K) wear rock overhead; the
   country and the city are open up to the crust (the shell's roof, in the haze).
   THE BIG LIGHTS (shell `suns`, three-renderer.js _hqBoxRoomLamps): a district file may export `suns(ctx)` = [{ x, y, z, color, intensity,
   dist, decay }]; four at most in the room. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/cavern/layout.json'), 'utf8'));
const C = 3.5, N = 12, GX = PLAN.cols, GY = PLAN.rows, W = N * GX, Hh = N * GY, HX = W * C / 2, HZ = Hh * C / 2, LEVEL = 1.75, CEIL = 5.25;
const ROOM = 'site_prebuilt_hollow_earth_cavern', SITE = 'prebuilt_hollow_earth', PART = 'cavern';
const OLD = ['gallery', 'vent', 'blast', 'adit', 'mouth', 'oubliette', 'innersun'].map(k => 'site_prebuilt_hollow_earth_' + k).concat(['site_prebuilt_agartha_crystalcity']);
const r2 = v => Math.round(v * 100) / 100, gx = c => r2(-HX + c * C), gz = c => r2(-HZ + c * C), gcx = c => r2(-HX + (c + 0.5) * C), gcz = c => r2(-HZ + (c + 0.5) * C);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
/* the old rooms' people, lines and door plates keep their own words: read from the old literals (so the four old literals stay in data.js) */
const OLDR = id => JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [], d: (r.doors || []).map(d => ({ id: d.id, label: d.label, sub: d.sub, desc: d.desc, leaf: d.leaf })), c: r.counters || [] } : { n: [], l: [], d: [], c: [] })(DOOR_HQ.rooms.' + id + '))', D));
const O = { gallery: OLDR(OLD[0]), vent: OLDR(OLD[1]), blast: OLDR(OLD[2]), adit: OLDR(OLD[3]), mouth: OLDR(OLD[4]), oubliette: OLDR(OLD[5]), innersun: OLDR(OLD[6]), agartha: OLDR(OLD[7]) };
const cell = PLAN.cells.map(r => r.split(''));
if (cell.length !== Hh || cell.some(r => r.length !== W)) throw new Error('layout.json cells: want ' + Hh + ' rows of ' + W);
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); if (!PLAN.districts[p.d]) throw new Error('district? ' + p.id); p.base = r2(p.level * LEVEL); p.sx = p.x * N; p.sy = p.y * N; plot[p.id] = p; });
const Pxy = (x, y) => plot['P0' + x + '-0' + y];
const plotAt = (sx, sy) => Pxy(Math.max(0, Math.min(GX - 1, Math.floor(sx / N))), Math.max(0, Math.min(GY - 1, Math.floor(sy / N))));
const distAt = (sx, sy) => plotAt(sx, sy).d, baseAt = (sx, sy) => plotAt(sx, sy).base;
const open = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] !== 'x';
const F = [], props = [], doors = [], npc = [], counters = [], count = {}, taken = new Set(), errs = [], strays = [], DECALS = [];
const feat = o => { F.push(o); return o; };
const FLOORCH = { K: 'o', H: 'g', A: 'm' }, DRY_CH = 'ohfucgdsmq';
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
        for (let m = -1; m <= 1; m++) { const sx = o.ns ? o.mid + m : t, sy = o.ns ? t : o.mid + m; if (open(sx, sy) && 'wl'.includes(cell[sy][sx])) cell[sy][sx] = FLOORCH[o.hi.d]; } } });

/* THE ROOF (build 4, mondo 11-16: "still just looks like a boring rectangular room"): a plot's roof stands CEIL over its floor; a plot
   that a fall, a stair or a climb comes down into is as tall as that drop + CEIL, so the upper mouth opens under one roof line. */
const ceilOf = p => r2(Math.max.apply(null, [CEIL].concat(OPEN.filter(o => o.lo === p).map(o => o.rise + CEIL))));
/* a way out through the room's wall: the squares from (sx, sy) straight to the wall are opened, three wide; returns the place along the wall (m) */
function spur(sx, sy, wall) {
    const step = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }[wall]; let x = sx, y = sy; const fl = (open(sx, sy) && !'wlb'.includes(cell[sy][sx])) ? cell[sy][sx] : FLOORCH[distAt(sx, sy)];
    while (x >= 0 && y >= 0 && x < W && y < Hh) { for (let m = -1; m <= 1; m++) { const X = step[0] ? x : x + m, Y = step[0] ? y + m : y; if (X >= 0 && Y >= 0 && X < W && Y < Hh && cell[Y][X] === 'x') cell[Y][X] = fl; } x += step[0]; y += step[1]; }
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
const native = (race, sx, sy, face, say) => { spot(sx, sy, race); if ('wl'.includes(cell[sy][sx])) errs.push(race + ' stands in the water or the lava at ' + sx + ',' + sy); const n = { x: gcx(sx), z: gcz(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); };
const sayOf = (R, race, i) => (R.n.filter(n => n.race === race)[i || 0] || {}).say;

/* ── THE DISTRICT FILES: docs/areas/cavern/districts/<LETTER>.js. A file may export any of the stages below; each is called with that
   district's own ctx (the helpers above, its own dice, its plots). A plot's squares are local: ctx.sq('P02-02', lx, ly) -> [sx, sy]. ── */
const STAGES = ['plan', 'build', 'dress', 'people'];
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const DISTRICTS = (() => { const dir = path.join(REPO, 'docs/areas/cavern/districts'), o = {}; fs.readdirSync(dir).filter(f => /^[A-Z]\.js$/.test(f)).sort().forEach(f => { o[f[0]] = require(path.join(dir, f)); }); return o; })();
Object.keys(PLAN.districts).forEach(k => { if (!DISTRICTS[k]) throw new Error('district file missing: docs/areas/cavern/districts/' + k + '.js'); });
const CTX = {};
Object.keys(DISTRICTS).forEach(k => { const rnd = mkRnd(7919 * k.charCodeAt(0));
    const sq = (id, lx, ly) => { const p = plot[id]; if (!p) throw new Error('plot? ' + id); return [p.sx + lx, p.sy + ly]; };
    CTX[k] = { d: k, C, N, W, H: Hh, LEVEL, gx, gz, gcx, gcz, r2, PLAN, plot, plots: PLAN.plots.filter(p => p.d === k), cell, setRect, open, distAt, baseAt, feat, props, npc, counters, taken, rnd, sq, O, sayOf,
        P: (key, id, lx, ly, o) => { const s = sq(id, lx, ly); P(key, s[0], s[1], o); }, dec: (key, id, lx, ly, o) => { const s = sq(id, lx, ly); decWith(rnd)(key, s[0], s[1], o); },
        native: (race, id, lx, ly, face, say) => { const s = sq(id, lx, ly); native(race, s[0], s[1], face, say); },
        /* every open square of a plot that is `chars` (default: walkway and room floor), in reading order */
        squares: (id, chars) => { const p = plot[id], out = []; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if ((chars || DRY_CH).includes(cell[p.sy + ly][p.sx + lx])) out.push([lx, ly]); return out; },
        ceil: id => ceilOf(plot[id]),
        /* a floor decal: kind 'grime' | 'puddle' | 'oil' | 'blood' | 'scorch' (three-renderer.js _hqDecalTex) */
        grime: (kind, id, lx, ly, r) => { const s = sq(id, lx, ly); DECALS.push({ kind, x: gcx(s[0]), z: gcz(s[1]), y: plot[id].base, r: r || 1.4, rot: Math.round(rnd() * 360) }); },
        /* a brick pier on a square, floor to roof (a blocker: the walker goes round it) */
        pier: (id, lx, ly) => { const p = plot[id], s = sq(id, lx, ly); spot(s[0], s[1], 'pier'); feat({ k: 'plateau', x: gcx(s[0]), z: gcz(s[1]), w: 1.75, d: 1.75, h: r2(p.base + ceilOf(p) + 0.2), edge: 0.1 }); },
        free: (id, lx, ly) => { const s = sq(id, lx, ly); return open(s[0], s[1]) && !taken.has(s[0] + ':' + s[1]); },
        /* dry squares with wall on two sides or more (a bend's corner, a dead end's tip): where a light or a barrel stands without closing a walk */
        corners: id => { const p = plot[id], out = []; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { const x = p.sx + lx, y = p.sy + ly; if (!DRY_CH.includes(cell[y][x]) || taken.has(x + ':' + y)) continue;
            let n = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!open(x + dx, y + dy)) n++; if (n >= 2) out.push([lx, ly]); } return out; },
        /* dry squares with no wall beside them and no water or track beside them: the middle of a room */
        inner: id => { const p = plot[id], out = []; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { const x = p.sx + lx, y = p.sy + ly; if (!DRY_CH.includes(cell[y][x]) || taken.has(x + ':' + y)) continue;
            let ok = true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!open(x + dx, y + dy) || 'wlb'.includes(cell[y + dy][x + dx])) ok = false; if (ok) out.push([lx, ly]); } return out; },
        /* room squares along a wall (one wall beside them), not on a plot line */
        walled: id => { const p = plot[id], out = []; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { const x = p.sx + lx, y = p.sy + ly; if (!DRY_CH.includes(cell[y][x]) || taken.has(x + ':' + y)) continue;
            let n = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!open(x + dx, y + dy)) n++; if (n === 1) out.push([lx, ly]); } return out; } }; });
const run = stage => Object.keys(DISTRICTS).forEach(k => { const m = DISTRICTS[k]; if (m && typeof m[stage] === 'function') { curD = k; try { m[stage](CTX[k]); } finally { curD = null; } } });

run('plan');      // what a district changes on the plan's squares, before anything is derived from them

/* ── THE WAYS OUT. Links (data.js DOOR_HQ.links holds the place; WANT below checks every row), the two bays (DOOR_HQ.siteRooms, checked the
   same way) and two doors of the room: `dungeon` (the wall that moves, DOOR HQ's cell: the HQ door names the old Oubliette and `at:
   'dungeon'`, and map.js keeps a door id the replacing room still has) and `woods` (the return door of the Woods' `lemuria` trail). ── */
const sqr = (id, lx, ly) => [plot[id].sx + lx, plot[id].sy + ly];
const wayAt = (id, lx, ly, wall) => { const s = sqr(id, lx, ly); return { wall, at: spur(s[0], s[1], wall) }; };
const wayFree = (id, lx, ly, face) => { const s = sqr(id, lx, ly); if (!open(s[0], s[1])) throw new Error('a well\'s square is not open: ' + id); taken.add(s[0] + ':' + s[1]); return { wall: 'free', x: gcx(s[0]), z: gcz(s[1]), face }; };
const WAY = {
    cave_hell: wayAt('P00-00', 7, 3, 'n'),                 // the Fissure > Hell's Pit
    cave_dumb: wayAt('P03-00', 6, 2, 'n'),                 // Level −6 > the D.U.M.B.'s Sub-Level 7
    workings_oubliette: wayAt('P05-00', 9, 6, 'e'),        // the Oubliette > the Sewers' Old Workings (their end is on their west wall)
    shasta_lemuria: wayAt('P05-03', 9, 4, 'e'),            // the Lemuria Stair > Mount Shasta
    technoticlan_agartha: wayAt('P05-04', 9, 6, 'e'),      // the East Gate > Technoticlan's ball court
    antarctica_polar: wayAt('P05-05', 7, 9, 's'),          // the Admiral's Tunnel > Antarctica
    hollow_byrd: wayAt('P02-05', 8, 9, 's'),               // the Polar Opening > Antarctica
    well_cellar: wayFree('P02-01', 3, 4, 90),              // the Haunted House's cellar well comes down in the Crossroads
    well_skinwalker: wayFree('P02-02', 4, 4, 180),         // the Estate's well comes down in the Mouth
};
const BAY = { prebuilt_hollow_earth: Object.assign({ id: 'bay' }, wayAt('P02-05', 3, 9, 's')), prebuilt_agartha: Object.assign({ id: 'bay_agartha' }, wayAt('P04-05', 6, 9, 's')) };
{ const od = O.oubliette.d.find(d => d.id === 'dungeon') || {}, w = wayAt('P05-00', 7, 2, 'n');
  doors.push({ id: 'dungeon', wall: 'n', x: w.at, leaf: null, secret: true, label: od.label || 'A DRAUGHT', sub: od.sub || 'THE WALL MOVES', action: { room: 'dungeon', at: 'oubliette' }, desc: od.desc || '' });
  const t = wayAt('P05-03', 9, 9, 'e');
  doors.push({ id: 'woods', wall: 'e', z: t.at, way: 'trail', leaf: null, label: 'THE WOODS', sub: 'THE TRAIL UP · OUT UNDER THE REDWOODS', action: { room: 'site_prebuilt_fairy_forest_ow_redwood', at: 'lemuria' }, desc: '' }); }

run('build');     // rooms, terraces, landmarks: what a district raises or lays on its plots
run('dress');     // props
['dress2', 'dress3', 'dress4', 'dress5'].forEach(run);   // a pilot's later passes may keep their own stage each (the same ctx)
run('people');    // the bystanders

if (strays.length) console.log('pieces a district stood on another district\'s squares (ask that district\'s thread):\n  ' + strays.join('\n  '));
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));

/* ── THE LEVELS: a plateau a plot (see bake-sewers.js: it runs a metre into a neighbour as high or higher, stops on the line of a lower one) ── */
const LVL = [];
PLAN.plots.forEach(p => { if (!p.level) return; const nb = (dx, dy) => { const q = (p.x + dx >= 0 && p.x + dx < GX && p.y + dy >= 0 && p.y + dy < GY) ? Pxy(p.x + dx, p.y + dy) : null; return (!q || q.level >= p.level) ? 1 : 0; };
    const x0 = gx(p.sx) - nb(-1, 0), x1 = gx(p.sx + N) + nb(1, 0), z0 = gz(p.sy) - nb(0, -1), z1 = gz(p.sy + N) + nb(0, 1);
    LVL.push({ k: 'plateau', x: r2((x0 + x1) / 2), z: r2((z0 + z1) / 2), w: r2(x1 - x0), d: r2(z1 - z0), h: p.base, edge: 0.15 }); });

/* ── THE OPENINGS, BUILT: K and H climb timber flights, Agartha marble ── */
const GO = [];
OPEN.forEach((o, i) => {
    const along = v => o.ns ? gcx(v) : gcz(v), lineM = o.ns ? gz(o.line) : gx(o.line), sgn = o.dx + o.dy;
    const pt = (a, t) => o.ns ? { x: a, z: t } : { x: t, z: a };
    if (o.kind === 'climb') { const p = pt(along(o.mid), r2(lineM + sgn * 0.3)); GO.push({ k: 'climb', x: p.x, z: p.z, face: o.ns ? (sgn > 0 ? 0 : 180) : (sgn > 0 ? 270 : 90), look: o.rope ? 'rope' : 'ladder' }); return; }
    const lane = o.kind === 'fall' ? (i % 2 ? 1 : -1) : 0, run = r2(Math.max(5.25, o.rise * 1.5)), a = along(o.mid + lane), foot = pt(a, r2(lineM + sgn * run)), head = pt(a, r2(lineM - sgn * 0.4));
    if (o.by === 'ladder') { const p = pt(a, r2(lineM + sgn * 0.3)); GO.push({ k: 'climb', x: p.x, z: p.z, face: o.ns ? (sgn > 0 ? 0 : 180) : (sgn > 0 ? 270 : 90), look: 'ladder' }); }
    else GO.push(Object.assign({ k: 'ramp', x0: foot.x, z0: foot.z, x1: head.x, z1: head.z, w: o.kind === 'fall' ? C : 2 * C, h0: o.lo.base, h1: o.hi.base, stairs: true, edge: 0.15 }, o.lo.d === 'A' ? { built: true, key: 'marble_light', railing: 'glass' } : { model: 'wood' }));
    if (o.kind === 'fall') { const p = pt(along(o.mid), lineM); GO.push({ k: 'fall', x: p.x, z: p.z, face: o.ns ? (sgn > 0 ? 180 : 0) : (sgn > 0 ? 90 : 270), w: C, y0: r2(o.hi.base - 0.3), y1: r2(o.lo.base - 0.3) }); }
});

/* ── THE WATER AND THE LAVA: every run of `w` / `l` squares is a stream at its plot's level; a block is one wide stream. Water lies 0.3 m
   under the walk, 0.6 m deep (waded); a plot in a district's `deep` list is deep water. Lava is never waded. ── */
const WATER = [];
for (const LQ of ['w', 'l']) {
  const used = new Uint8Array(W * Hh), isW = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] === LQ, P0 = (x, y) => plotAt(x, y);
  const deep = new Set(); Object.keys(DISTRICTS).forEach(k => (DISTRICTS[k].deep || []).forEach(id => deep.add(id)));
  const liq = (p, row) => { if (LQ === 'l') { row.key = 'lava'; row.depth = 0.8; } else if (deep.has(p.id)) { row.key = 'deep_water'; row.depth = 1.8; } return row; };
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (!isW(x, y) || used[y * W + x] || !(isW(x + 1, y) && isW(x, y + 1) && isW(x + 1, y + 1))) continue;
      const p = P0(x, y); let w = 1; while (isW(x + w, y) && !used[y * W + x + w] && P0(x + w, y) === p) w++;
      let h = 1; rows: while (y + h < Hh && P0(x, y + h) === p) { for (let i = 0; i < w; i++) if (!isW(x + i, y + h) || used[(y + h) * W + x + i]) break rows; h++; }
      if (w < 2 || h < 2) continue;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
      WATER.push(liq(p, { k: 'stream', pts: h >= w ? [[r2(gx(x) + w * C / 2), gz(y)], [r2(gx(x) + w * C / 2), gz(y + h)]] : [[gx(x), r2(gz(y) + h * C / 2)], [gx(x + w), r2(gz(y) + h * C / 2)]], w: (h >= w ? w : h) * C, y: r2(p.base - 0.3), depth: 0.6 })); count.tanks = (count.tanks || 0) + 1; }
  const runOf = (x, y, dx, dy) => { const p = P0(x, y); let n = 0; while (isW(x + n * dx, y + n * dy) && !used[(y + n * dy) * W + x + n * dx] && P0(x + n * dx, y + n * dy) === p) n++; return n; };
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (!isW(x, y) || used[y * W + x]) continue;
      const nh = runOf(x, y, 1, 0), nv = runOf(x, y, 0, 1), p = P0(x, y), horiz = nh >= nv, n = horiz ? nh : nv;
      for (let i = 0; i < n; i++) used[(y + (horiz ? 0 : i)) * W + x + (horiz ? i : 0)] = 1;
      WATER.push(liq(p, { k: 'stream', pts: horiz ? [[gx(x), gcz(y)], [gx(x + n), gcz(y)]] : [[gcx(x), gz(y)], [gcx(x), gz(y + n)]], w: C, y: r2(p.base - 0.3), depth: 0.6 })); count.streams = (count.streams || 0) + 1; } }
/* the planks: a `b` run is a deck over what lies beside it (lava under the rope bridge, deep water under a jetty or a plank) */
{ const used = new Uint8Array(W * Hh);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (cell[y][x] !== 'b' || used[y * W + x]) continue; let n = 0, m = 0; while (y + n < Hh && cell[y + n][x] === 'b') n++; while (x + m < W && cell[y][x + m] === 'b') m++;
      const v = n >= m, len = v ? n : m; for (let i = 0; i < len; i++) used[(y + (v ? i : 0)) * W + x + (v ? 0 : i)] = 1;
      let lava = false; for (let i = 0; i < len; i++) { const X = x + (v ? 0 : i), Y = y + (v ? i : 0); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (open(X + dx, Y + dy) && cell[Y + dy][X + dx] === 'l') lava = true; }
      WATER.push(Object.assign({ k: 'stream', pts: v ? [[gcx(x), gz(y)], [gcx(x), gz(y + n)]] : [[gx(x), gcz(y)], [gx(x + m), gcz(y)]], w: C, y: r2(baseAt(x, y) - 0.3) }, lava ? { key: 'lava', depth: 0.8 } : { key: 'deep_water', depth: 1.8 }));
      WATER.push(v ? { k: 'deck', x0: gcx(x), z0: r2(gz(y) - 0.5), x1: gcx(x), z1: r2(gz(y + n) + 0.5), w: 1.75, y: r2(baseAt(x, y) + 0.05) } : { k: 'deck', x0: r2(gx(x) - 0.5), z0: gcz(y), x1: r2(gx(x + m) + 0.5), z1: gcz(y), w: 1.75, y: r2(baseAt(x, y) + 0.05) }); } }

/* ── THE ROCK OVERHEAD: a roofed district's plot wears one block of rock from its roof line up to the crust (so the cave reads solid from
   the open country, over the Mouth), and stalactites over its open floor (tapered `cyl` parts, hung point down). ── */
const TOP = Math.max.apply(null, PLAN.plots.map(p => p.base)), SH = PLAN.crust || r2(TOP + CEIL + 22), ROOF = [], grnd = mkRnd(4242), ROCK = [0x6e675e, 0x625c54, 0x756c60, 0x5a544c];
PLAN.plots.forEach(p => { if (!(PLAN.roofed || []).includes(p.d)) return; const top = ceilOf(p), parts = [], ox = gx(p.sx) + N * C / 2, oz = gz(p.sy) + N * C / 2;
    parts.push({ s: 'box', p: [0, top, 0], size: [N * C, r2(SH - p.base - top), N * C], top: false, under: true, key: 'cave_wall', tint: 0x4a443e, uv: 7 });
    const sq = []; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (open(p.sx + lx, p.sy + ly)) sq.push([lx, ly]);
    for (let i = 0; i < Math.min(16, sq.length / 4); i++) { const q = sq[Math.floor(grnd() * sq.length)], len = r2(0.8 + grnd() * Math.min(3.2, top - 3.4)), r = r2(0.22 + grnd() * 0.4);
        parts.push({ s: 'cyl', p: [r2(gcx(p.sx + q[0]) - ox + (grnd() - 0.5) * 2.4), r2(top - len), r2(gcz(p.sy + q[1]) - oz + (grnd() - 0.5) * 2.4)], r: 0.03, r2: r, h: len, seg: 6, key: 'cave_wall', tint: ROCK[Math.floor(grnd() * ROCK.length)], uv: 3.5 }); }
    ROOF.push({ k: 'arch', id: 'cav:' + p.id + ':roof', x: r2(ox), z: r2(oz), rot: 0, base: p.base, parts }); count.roofs = (count.roofs || 0) + 1; });

/* ── THE OPEN GROUND: every square that is not rock, as `space` rows (greedy rectangles) ── */
const spaces = [];
{ const used = new Uint8Array(W * Hh);
  for (let cy = 0; cy < Hh; cy++) for (let cx = 0; cx < W; cx++) { if (!open(cx, cy) || used[cy * W + cx]) continue;
      let w = 1; while (cx + w < W && !used[cy * W + cx + w] && open(cx + w, cy)) w++;
      let h = 1; rows: while (cy + h < Hh) { for (let i = 0; i < w; i++) if (used[(cy + h) * W + cx + i] || !open(cx + i, cy + h)) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(cy + j) * W + cx + i] = 1;
      spaces.push({ k: 'space', x: r2(gx(cx) + w * C / 2), z: r2(gz(cy) + h * C / 2), w: w * C, d: h * C }); } }
/* ── THE PAINT: one sheet a square (eight sheets, the game's cap) ── */
const PAL = ['obsidian', 'concrete_floor', 'dungeon_2', 'crystal', 'grass_dark_fantasy', 'dirt_2', 'marble_light', 'desert'], PCH = { o: 0, x: 0, w: 0, b: 0, h: 1, l: 1, f: 2, u: 3, c: 4, q: 4, g: 5, d: 6, m: 7, s: 8 }   /* 0 = the room's own cave floor; v = PAL[v - 1] */, paint = new Uint8Array(W * Hh);
for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x], d = distAt(x, y); paint[y * W + x] = ('wb'.includes(ch) && d === 'H') ? 8 : ('wb'.includes(ch) && d === 'A') ? 7 : (PCH[ch] || 0); }

/* ── checks: every prop key and unit exists; nothing stands in the rock; every plot is reached from the Crossroads through the plan's
   openings (a level change is crossed only on an opening's own squares; lava is never walked) ── */
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); });
npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
const SP = sqr('P02-01', 5, 4);
{ const seen = new Uint8Array(W * Hh), st = [SP], walk = (x, y) => open(x, y) && cell[y][x] !== 'l'; if (!walk(SP[0], SP[1])) throw new Error('the spawn is not open'); seen[SP[1] * W + SP[0]] = 1;
  const cross = (x, y, X, Y) => { const a = plotAt(x, y), b = plotAt(X, Y); if (a === b || a.level === b.level) return true;
      return OPEN.some(o => ((o.hi === a && o.lo === b) || (o.hi === b && o.lo === a)) && Math.abs((o.ns ? x : y) - o.mid) <= 1); };
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!walk(X, Y) || seen[Y * W + X] || !cross(x, y, X, Y)) continue; seen[Y * W + X] = 1; st.push([X, Y]); } }
  const cold = PLAN.plots.filter(p => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.sy + ly) * W + p.sx + lx]) return false; return true; }).map(p => p.id);
  if (process.env.CAVERN_DUMP) console.log(cell.map((r, y) => r.map((ch, x) => walk(x, y) && !seen[y * W + x] ? '!' : ch === 'x' ? ' ' : ch).join('')).join('\n'));
  if (cold.length) throw new Error('plots not reached on foot: ' + cold.join(' '));
  let op = 0, un = 0; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (walk(x, y)) { op++; if (!seen[y * W + x]) un++; }
  props.forEach(p => { const sx = Math.floor((p.x + HX) / C), sy = Math.floor((p.z + HZ) / C); if (!open(sx, sy)) throw new Error(p.key + ' stands in the rock at ' + sx + ',' + sy); });
  Object.keys(WAY).concat(doors.map(d => d.id)).forEach(k => { /* every way out stands on walked ground: its spur's first square was walked */ });
  Object.assign(count, { openSquares: op, unreachedSquares: un }); }
const features = spaces.concat(LVL, WATER, GO, F, ROOF);
Object.assign(count, { plots: PLAN.plots.length, spaces: spaces.length, falls: GO.filter(g => g.k === 'fall').length, stairs: GO.filter(g => g.k === 'ramp').length,
    features: features.length, props: props.length, doors: doors.length, natives: npc.length });

/* ── the room ── */
const SPM = { x: gcx(SP[0]), z: gcz(SP[1]) }, CR = plot['P02-01'];
const SUNS = [].concat(...Object.keys(DISTRICTS).map(k => typeof DISTRICTS[k].suns === 'function' ? (DISTRICTS[k].suns(CTX[k]) || []) : [])).slice(0, 4);
/* THE AIR BY DISTRICT (shell.atmos.zones): a file's `airZones(ctx)` = [{ sx0, sy0, sx1, sy1 (squares, the end exclusive), kind, color, n, speed }] */
const AIR = [].concat(...Object.keys(DISTRICTS).map(k => typeof DISTRICTS[k].airZones === 'function' ? (DISTRICTS[k].airZones(CTX[k]) || []).map(z => { const q = Object.assign({}, z, { x0: gx(z.sx0), z0: gz(z.sy0), x1: gx(z.sx1), z1: gz(z.sy1) }); delete q.sx0; delete q.sy0; delete q.sx1; delete q.sy1; return q; }) : []));
const LINES = [].concat(...Object.keys(O).map(k => O[k].l));
/* ── THE ROOM WRITER: one room literal (the home room, or a One World room) ── */
function writeRoom(R) {
    const L = [];
    L.push("        " + R.room + ": {");
    L.push("            label: '" + R.label + "',");
    L.push("            sub: '" + R.sub.replace(/'/g, "\\'") + "',");
    L.push("            kind: 'box', site: '" + SITE + "', part: '" + R.part + "',");
    if (R.world) { L.push("            /* THE ONE WORLD: where this room stands on the world's plot grid (data.js hqOwIndex; bake-cavern.js THE ONE WORLD MOVE) */");
        L.push("            world: { hub: 'cavern', layer: 'under', wx: " + R.world.wx + ", wy: " + R.world.wy + " },"); }
    L.push("            shell: { w: " + R.w + ", d: " + R.d + ", h: " + R.SH + ", wallH: " + R.SH + ", dadoH: 1.1, open: false,");
    L.push("                     floor: 'cave_floor', wall: 'cave_wall', dado: 'rocks_dark_fantasy', trim: 'rock_wall_2', ceiling: 'cave_wall', floorColor: 0x8a8278, wallColor: 0x6e675e, dadoColor: 0x585048, ceilColor: 0x2a2622,");
    L.push("                     pipes: false, strips: false, lights: [], mood: { light: 0xffc078, ambient: " + (PLAN.ambient != null ? PLAN.ambient : 0.24) + ", hero: false }, plate: { x: " + R.plate.x + ", z: " + R.plate.z + ", y: " + R.plate.y + " },");
    L.push("                     fog: { color: 0x0e0b09, density: " + (PLAN.fog != null ? PLAN.fog : 0.007) + " }, look: HQ_ROOM_LOOKS.cave,");
    L.push("                     /* THE BIG LIGHTS (three-renderer.js _hqBoxRoomLamps): " + R.sunsNote + " */");
    L.push("                     suns: " + J(R.suns) + (R.air.length ? ", atmos: " + J({ kind: 'none', zones: R.air }) : "") + " },");
    L.push("            parti: '" + R.parti.replace(/'/g, "\\'") + "',");
    L.push("            typology: 'grid',");
    L.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", nx: " + R.nx + ", nz: " + R.nz + (R.mask ? ", mask: " + J(R.mask) : "") + ", names: " + J(R.names) + " },");
    L.push("            terrain: {");
    L.push("                res: 0.875, floor: 'cave_floor', cliff: 'rocks_5', path: 'dirt_2', stairs: 'wood',");
    L.push("                noise: { amp: 0, scale: 5 }, crag: false, stalactites: false,");
    L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + R.px0 + ", z0: " + R.pz0 + ", nx: " + R.W + ", nz: " + R.Hh + ", d: '" + Buffer.from(R.paint).toString('base64') + "' },");
    L.push("                /* every square that is not a `space` is the rock, up to the crust */");
    L.push("                gen: { kind: 'plan', look: 'walls', wallKey: 'cave_wall', rim: 0, forceGrow: -0.3 },");
    L.push("                features: [");
    R.features.forEach(f => L.push("                    " + J(f) + ","));
    L.push("                ],");
    L.push("            },");
    L.push("            doors: [");
    R.doors.forEach(d => L.push("                " + J(d) + ","));
    L.push("            ],");
    L.push("            counters: " + J(R.counters) + ",");
    L.push("            props: [");
    for (let i = 0; i < R.props.length; i += 4) L.push("                " + R.props.slice(i, i + 4).map(J).join(", ") + ",");
    L.push("            ],");
    L.push("            agents: [],");
    L.push("            npcSpots: " + J(R.npc) + ",");
    L.push("            onlineSpots: [],");
    L.push("            lines: " + J(R.lines) + ",");
    L.push("            spawn: { x: " + R.spawn.x + ", z: " + R.spawn.z + ", face: " + R.spawn.face + " },");
    L.push("        },");
    return L;
}
const place = w => "wall: '" + w.wall + "', " + (w.wall === 'free' ? 'x: ' + w.x + ', z: ' + w.z + ', face: ' + w.face + (w.passage ? ', passage: { len: 3, deep: 1.2 }' : '') : (w.wall === 'n' || w.wall === 's' ? 'x: ' : 'z: ') + w.at);
const OW = !process.env.CAVERN_HOME;
const HEAD = "        /* CAVERN36-BEGIN — THE CAVERN ON PLOTS (2026-11-16)" + (OW ? " + THE ONE WORLD MOVE (2026-11-17: the Cavern + Hollow Earth, Agartha and the cave tunnels at their One World places)" : "") + ": written by `node bake-cavern.js` from docs/areas/cavern/layout.json + districts/<K H A>.js" + (OW ? " + docs/plans/one-world/plots.json" : "") + ". Never hand-edit between the markers; edit the tool, the layout or a district file and rerun. */";
let BLOCK, WANT;
if (!OW) {
    const L = [HEAD].concat(writeRoom({ room: ROOM, part: PART, label: 'THE CAVERN', sub: 'THE CROSSROADS · HOLLOW EARTH · AGARTHA · EVERYTHING BELOW MEETS HERE', world: null, w: 2 * HX, d: 2 * HZ, SH,
        plate: { x: SPM.x, z: SPM.z, y: r2(CR.base + 4.2) }, sunsNote: 'the Inner Sun, the Spire, the lava lake', suns: SUNS, air: AIR,
        parti: 'The cave under the crust is a loop over three tiers; its mouth is a ledge over a whole country lit by a sun that never sets; east of the country a city of white terraces steps down to a lake round a spire lit from inside.',
        nx: GX, nz: GY, mask: null, names: PLAN.plots.map(p => [p.id, p.name, p.d, p.level]), px0: gcx(0), pz0: gcz(0), W, Hh, paint, features, doors, counters, props, npc, lines: LINES, spawn: { x: SPM.x, z: SPM.z, face: 90 } }));
    L.push("        /* CAVERN36-END */");
    BLOCK = L.join('\n') + '\n';
    console.log(JSON.stringify(count));
    WANT = Object.keys(WAY).map(k => ["site: '" + SITE + "', part: '" + PART + "', " + place(WAY[k]) + ",", 'link ' + k])
        .concat(Object.keys(BAY).map(k => [k + ": { room: '" + ROOM + "', door: { id: '" + BAY[k].id + "', " + place(BAY[k]) + " } },", 'DOOR_HQ.siteRooms ' + k]));
} else {
/* ══ THE ONE WORLD MOVE (2026-11-17, mondo's approved map v13; docs/plans/one-world/BUILD_PLAN.md phase 3 wave B, the Cavern row: "the
   Cavern under the Woods + the wells, Hollow Earth under its sun, Agartha under the Lemuria adit; cave walks join them").
   mondo 11-17: "Connected/bigger rooms is better" and, on this zone, "well i still want the paths". So:
   - THE CAVERN + HOLLOW EARTH stay one room, every plot where it lay against its neighbours, the block TURNED A QUARTER (270 clockwise seen
     from above): Hollow Earth + the Mouth fill the sheet's Hollow Earth block exactly (-6..-3 x 10..12), the Cavern is the strip west of it
     (-8..-7 x 7..12, its loop whole). The old id `site_prebuilt_hollow_earth_cavern`.
   - AGARTHA stands under the Lemuria adit (-19..-16 x -12..-10), its twelve plots as they lay, TURNED A QUARTER the other way (90) so the
     Lemuria Stair faces south to the adit; the last three plots of the tunnel north (U9) end in its Upper Terrace. `…_ow_agartha`.
   - THE CAVE TUNNELS (plots.json `under.walks`; the tunnel look is this tool's, cave rock like the Cavern's): THE WEST TUNNEL (U8 + U10 + the
     south half of U9, and three plots of mine, -11..-9 x 11, because the Cavern's strip stands three plots east of the sheet's block) with
     the Estate's well coming down at -14,10; THE LONG TUNNEL (U9's middle, ten plots north); THE TUNNEL-WAY TUNNEL (U11, from Level −6 north
     to the plot under Dead Man's Cave's Tunnel Way, which a new way up joins). U7 is inside the Cavern + Hollow Earth room now (the Mouth).
   Every district plot keeps everything on it (ow-move.js); the parted openings: the Country's stair up into Agartha's Lower Terrace (the
   tunnels are the way now). `CAVERN_HOME=1 node bake-cavern.js` writes the old single room. Notes: areas-complexes.md "THE CAVERN, ONE WORLD". */
const MVF = require('./ow-move.js'), FREE = MVF({ cols: 1, rows: 1, cell: [[]], fill: 'x', plots: [] }).FREE_PASS;
const MOVE = MVF({ cols: GX, rows: GY, cell, fill: 'x', plots: PLAN.plots.map(p => ({ id: p.id, x: p.x, y: p.y, name: p.name, district: p.d, level: p.level })), features, props, npc, doors: [] });
const ROCKSH = SH;
const TT = { KH: 270, A: 90 };
const placeKH = p => ({ wx: -8 + p.y, wy: 7 + (GX - 1 - p.x), turn: 270 }), placeA = p => ({ wx: -19 + 3 - (p.y - 2), wy: -12 + (p.x - 3), turn: 90 });
const T_NAME = { west: 'The West Tunnel', wells: 'The Wells Tunnel', long: 'The Long Tunnel', north: 'The Lemuria Tunnel', way: 'The Tunnel-Way Tunnel' };
const seq = (a, b, fx) => { const o = []; if (a <= b) for (let i = a; i <= b; i++) o.push(fx(i)); else for (let i = a; i >= b; i--) o.push(fx(i)); return o; };
/* each room: its district plots (home ids, placed), its tunnel plots (world x, y, name), what joins */
const ROOMS = [
    { key: 'KH', room: ROOM, part: PART, label: 'THE CAVERN', sub: 'THE CROSSROADS · THE MOUTH · HOLLOW EARTH UNDER ITS SUN', group: ['K', 'H'], place: placeKH, turn: 270, lines: LINES.filter(l => O.agartha.l.indexOf(l) < 0), spawnAt: ['P02-01', 5, 4],
      parti: 'The cave under the crust is a loop over three tiers; its mouth is a ledge over a whole country lit by a sun that never sets.', sunsNote: 'the Inner Sun, the lava lake', tunnels: [] },
    { key: 'A', room: 'site_prebuilt_hollow_earth_ow_agartha', part: 'ow_agartha', label: 'AGARTHA', sub: 'THE CRYSTAL CITY · UNDER THE LEMURIA ADIT · THE TERRACES · THE SPIRE', group: ['A'], place: placeA, turn: 90, lines: O.agartha.l, spawnAt: ['P04-04', 6, 4],
      parti: 'A city of white terraces under the Lemuria adit steps down round a spire lit from inside to a lake and a plaza; the long tunnel from the Cavern comes in at its upper terrace.', sunsNote: 'the Spire',
      tunnels: seq(-9, -11, y => [-15, y, T_NAME.north]), tunLevel: 4 },
    { key: 'W', room: 'site_prebuilt_hollow_earth_ow_west', part: 'ow_west', label: 'THE WEST TUNNEL', sub: 'THE CAVERN · WEST UNDER THE ESTATE · THE WELLS · NORTH TO AGARTHA', group: [], lines: [],
      parti: 'A cave tunnel west from the Cavern under the Estate: the Estate\'s well comes down into it, and at its west end it turns north for Agartha.', sunsNote: 'none',
      tunnels: seq(-9, -15, x => [x, 11, T_NAME.west]).concat([[-15, 12, T_NAME.west], [-14, 10, T_NAME.wells]], seq(10, 2, y => [-15, y, T_NAME.west])) },
    { key: 'L', room: 'site_prebuilt_hollow_earth_ow_long', part: 'ow_long', label: 'THE LONG TUNNEL', sub: 'THE CAVE ROAD NORTH · UNDER THE WOODS · TO AGARTHA', group: [], lines: [],
      parti: 'The long cave road north under the Woods, from the West Tunnel to Agartha.', sunsNote: 'none', tunnels: seq(1, -8, y => [-15, y, T_NAME.long]) },
    { key: 'T', room: 'site_prebuilt_hollow_earth_ow_tunnelway', part: 'ow_tunnelway', label: 'THE TUNNEL-WAY TUNNEL', sub: 'FROM LEVEL −6 NORTH · UP INTO DEAD MAN’S CAVE', group: [], lines: [],
      parti: 'A cave tunnel north from the Cavern\'s Level −6 to the shaft under Dead Man\'s Cave\'s Tunnel Way.', sunsNote: 'none', tunnels: seq(9, 2, y => [-9, y, T_NAME.way]).concat([[-8, 2, T_NAME.way], [-7, 2, T_NAME.way]]) },
];
/* where one room meets another: [room key, world plot, side, room key, world plot, side]; the district plot's side is DUG to its open floor */
const SEAMS = [['KH', [-8, 11], 'W', 'W', [-9, 11], 'E'], ['KH', [-8, 9], 'W', 'T', [-9, 9], 'E'], ['W', [-15, 2], 'N', 'L', [-15, 1], 'S'], ['L', [-15, -8], 'N', 'A', [-15, -9], 'S']];
/* a district plot joined to a tunnel plot inside one room: [room key, district plot (world), its side, the tunnel plot] */
const INNER = [['A', [-16, -11], 'E', [-15, -11]]];
const ROT = { 270: ['W', 'N', 'E', 'S'], 90: ['E', 'S', 'W', 'N'] };   // the home N, E, S, W sides after the turn
const turnSide = (s, t) => t ? ROT[t]['NESW'.indexOf(s)] : s;
const mm = v => (v < 0 ? 'm' + (-v) : '' + v), seamId = (x, y, s) => s === 'E' ? 'ow_v_' + mm(x + 1) + '_' + mm(y) : s === 'W' ? 'ow_v_' + mm(x) + '_' + mm(y) : s === 'S' ? 'ow_h_' + mm(x) + '_' + mm(y + 1) : 'ow_h_' + mm(x) + '_' + mm(y);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const DRYW = 'ohfucgdsmqb';
ROOMS.forEach(R => {
    const list = [];
    PLAN.plots.forEach(p => { if (R.group.includes(p.d)) list.push(Object.assign({ id: p.id }, R.place(p))); });
    R.tunnels.forEach(t => list.push({ wx: t[0], wy: t[1], name: t[2], district: 'T', level: R.tunLevel || 0, isNew: true }));
    const M = MOVE.room(list); R.M = M;
    const W = M.W, Hh = M.D, cellR = M.cell, at = (wx, wy) => M.at[(wx - M.wx) + ',' + (wy - M.wy)];
    R.at = at; R.open = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cellR[y][x] !== 'x';
    /* THE TUNNELS: a passage three squares wide from each port to the plot's middle, the middle a chamber (its size by the plot's dice) */
    const rnd = mkRnd(9001 + R.key.charCodeAt(0));
    const tun = R.tunnels.map(t => at(t[0], t[1]));
    const ports = e => { const o = []; for (const s of 'NESW') { const q = at(e.wx + DIRS[s][0], e.wy + DIRS[s][1]); if (q && q.district === 'T') o.push(s); }
        SEAMS.forEach(S => { if (S[0] === R.key && S[1][0] === e.wx && S[1][1] === e.wy) o.push(S[2]); if (S[3] === R.key && S[4][0] === e.wx && S[4][1] === e.wy) o.push(S[5]); });
        INNER.forEach(I => { if (I[0] === R.key && I[3][0] === e.wx && I[3][1] === e.wy) o.push({ N: 'S', S: 'N', E: 'W', W: 'E' }[I[2]]); });
        return o; };
    const dig = (x, y) => { if (x >= 0 && y >= 0 && x < W && y < Hh && cellR[y][x] === 'x') cellR[y][x] = 'o'; };
    tun.forEach(e => { const sx0 = e.col * N, sy0 = e.row * N, cx = 4 + Math.floor(rnd() * 2), cy = 4 + Math.floor(rnd() * 2), cw = 3 + Math.floor(rnd() * 3), ch = 3 + Math.floor(rnd() * 3);
        for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) dig(sx0 + Math.min(10, cx - 1 + i), sy0 + Math.min(10, cy - 1 + j));
        ports(e).forEach(s => { for (let k = 0; k < 7; k++) for (let m = -1; m <= 1; m++) {
            if (s === 'N') dig(sx0 + 6 + m, sy0 + k); if (s === 'S') dig(sx0 + 6 + m, sy0 + 11 - k); if (s === 'W') dig(sx0 + k, sy0 + 6 + m); if (s === 'E') dig(sx0 + 11 - k, sy0 + 6 + m); } }); });
    /* a district plot's side dug to its open floor: the row of the side (from 3 to 9) whose first open square is nearest and dry */
    R.digIn = (wx, wy, side) => { const e = at(wx, wy), sx0 = e.col * N, sy0 = e.row * N, d = DIRS[side], into = [-d[0], -d[1]];
        let best = null;
        for (let o = 3; o <= 8; o++) { let x = side === 'E' ? sx0 + 11 : side === 'W' ? sx0 : sx0 + o, y = side === 'S' ? sy0 + 11 : side === 'N' ? sy0 : sy0 + o, k = 0;
            while (k < N && cellR[y][x] === 'x') { x += into[0]; y += into[1]; k++; }
            if (k >= N || !DRYW.includes(cellR[y][x])) continue; if (!best || k < best.k || (k === best.k && Math.abs(o - 6) < Math.abs(best.o - 6))) best = { o, k }; }
        if (!best) throw new Error(R.room + ': no open floor behind the ' + side + ' side of ' + e.name);
        const o = best.o; for (let k = 0; k <= best.k; k++) for (let m = -1; m <= 1; m++) {
            if (side === 'E') dig(sx0 + 11 - k, sy0 + o + m); if (side === 'W') dig(sx0 + k, sy0 + o + m); if (side === 'N') dig(sx0 + o + m, sy0 + k); if (side === 'S') dig(sx0 + o + m, sy0 + 11 - k); }
        return o; };
});
const RK = {}; ROOMS.forEach(R => { RK[R.key] = R; });
/* the inner joins (dug both ways: the tunnel's port was cut above) */
INNER.forEach(I => { const R = RK[I[0]]; R.digIn(I[1][0], I[1][1], I[2]);
    const e = R.at(I[1][0], I[1][1]), t = R.at(I[3][0], I[3][1]); if (t.level !== e.level) throw new Error('INNER: the tunnel plot and ' + e.name + ' stand at two levels'); });
/* THE SEAM DOORS: a pair, one id (the seam id), `way: 'trail'`, on the room's wall where the side lies on it, else free on the plot's last square */
const EXTRA = {}; ROOMS.forEach(R => { EXTRA[R.key] = []; });
function seamDoor(R, wp, side, o, id, other) {
    const e = R.at(wp[0], wp[1]), M = R.M, sx0 = e.col * N, sy0 = e.row * N, onWall = { N: e.row === 0, S: e.row === M.rows - 1, W: e.col === 0, E: e.col === M.cols - 1 }[side];
    const d = { id, way: 'trail', leaf: null, label: other.label, sub: other.label + ' · ' + (other.key === 'KH' || other.key === 'A' ? 'THE TUNNEL IN' : 'THE TUNNEL ON'), action: { room: other.room, at: id }, desc: '' };
    const ax = M.gcx(sx0 + o), az = M.gcz(sy0 + o);
    if (onWall) { d.wall = side.toLowerCase(); if (side === 'N' || side === 'S') d.x = ax; else d.z = az; }
    else { d.wall = 'free'; d.passage = Object.assign({}, FREE);
        if (side === 'N') { d.x = ax; d.z = M.gcz(sy0); d.face = 180; } else if (side === 'S') { d.x = ax; d.z = M.gcz(sy0 + N - 1); d.face = 0; }
        else if (side === 'W') { d.x = M.gcx(sx0); d.z = az; d.face = 90; } else { d.x = M.gcx(sx0 + N - 1); d.z = az; d.face = 270; } }
    return d;
}
const SEAMLIST = [];
SEAMS.forEach(S => { const A = RK[S[0]], B = RK[S[3]], ea = A.at(S[1][0], S[1][1]), eb = B.at(S[4][0], S[4][1]), id = seamId(S[1][0], S[1][1], S[2]);
    if (id !== seamId(S[4][0], S[4][1], S[5])) throw new Error('seam ' + id + ' is not one line');
    const oa = ea.district === 'T' ? 6 : A.digIn(S[1][0], S[1][1], S[2]), ob = eb.district === 'T' ? 6 : B.digIn(S[4][0], S[4][1], S[5]);
    EXTRA[A.key].push(seamDoor(A, S[1], S[2], oa, id, B)); EXTRA[B.key].push(seamDoor(B, S[4], S[5], ob, id, A)); SEAMLIST.push(id + ' ' + A.room + ' <-> ' + B.room); });

/* THE WAYS OUT, moved with their plots: a wall way stays a wall door where its side still lies on the new room's wall, else it is free on the
   plot's line; a free way moves with its plot. The Estate's well is the one re-pointed: it comes down in the West Tunnel at -14,10 (v13). */
const roomOfHome = id => ROOMS.find(R => R.M.ofHome[id]);
const homeWallPt = w => [w.wall === 'free' ? w.x : w.wall === 'w' ? -HX + C / 2 : w.wall === 'e' ? HX - C / 2 : w.at, w.wall === 'free' ? w.z : w.wall === 'n' ? -HZ + C / 2 : w.wall === 's' ? HZ - C / 2 : w.at];
function moveWay(w) {
    const p0 = homeWallPt(w), hp = MOVE.homePlot(p0[0], p0[1]), R = roomOfHome(hp.id), e = R.M.ofHome[hp.id], q = R.M.toRoom(p0[0], p0[1]);
    if (w.wall === 'free') return { R, wall: 'free', x: q[0], z: q[1], face: ((w.face || 0) + R.turn) % 360 };
    const s = turnSide({ n: 'N', s: 'S', w: 'W', e: 'E' }[w.wall], R.turn), on = { N: e.row === 0, S: e.row === R.M.rows - 1, W: e.col === 0, E: e.col === R.M.cols - 1 }[s];
    if (on) return { R, wall: s.toLowerCase(), at: (s === 'N' || s === 'S') ? q[0] : q[1] };
    return { R, wall: 'free', x: q[0], z: q[1], face: { N: 180, S: 0, W: 90, E: 270 }[s], passage: true };   // its side is inside the box now (a tunnel plot widened it): free on the plot's line
}
const WAYS = {}; Object.keys(WAY).forEach(k => { WAYS[k] = moveWay(WAY[k]); });
{ const R = RK.W, e = R.at(-14, 10), sx = e.col * N + 6, sy = e.row * N + 5; if (!R.open(sx, sy)) throw new Error('the wells\' square is not open');
  WAYS.well_skinwalker = { R, wall: 'free', x: R.M.gcx(sx), z: R.M.gcz(sy), face: 180 }; }
const BAYS = {}; Object.keys(BAY).forEach(k => { BAYS[k] = Object.assign({ id: BAY[k].id }, moveWay(BAY[k])); });
/* the room doors: `dungeon` (the Oubliette) and `woods` (the Lemuria Stair) move with their plots */
const RDOORS = {}; ROOMS.forEach(R => { RDOORS[R.key] = []; });
doors.forEach(d => { const w = d.wall === 'free' ? d : { wall: d.wall, at: (d.wall === 'n' || d.wall === 's') ? d.x : d.z }, m = moveWay(w), o = Object.assign({}, d);
    delete o.x; delete o.z; o.wall = m.wall; if (m.wall === 'free') { o.x = m.x; o.z = m.z; o.face = m.face; if (m.passage) o.passage = Object.assign({}, FREE); } else if (m.wall === 'n' || m.wall === 's') o.x = m.at; else o.z = m.at;
    const keep = ['id', 'wall', 'x', 'z', 'face'], out = {}; keep.forEach(k => { if (o[k] != null) out[k] = o[k]; }); Object.keys(o).forEach(k => { if (!(k in out)) out[k] = o[k]; });
    RDOORS[m.R.key].push(out); });
/* THE WAY UP AT THE TUNNEL WAY (new, v13 "tunnel way ↑ Dead Man's Cave"): a ladder at the north end of the Tunnel-Way Tunnel up into the creek's Tunnel Way */
{ const R = RK.T, e = R.at(-7, 2), sx = e.col * N + 5, sy = e.row * N + 4; if (!R.open(sx, sy)) throw new Error('the Tunnel Way\'s square is not open');
  WAYS.tunnelway_cavern = { R, wall: 'free', x: R.M.gcx(sx), z: R.M.gcz(sy), face: 180, side: 'b' }; }

/* ── derive every room, write it ── */
const DSUNS = [].concat(...Object.keys(DISTRICTS).map(k => typeof DISTRICTS[k].suns === 'function' ? (DISTRICTS[k].suns(CTX[k]) || []).map(s => Object.assign({ d: k }, s)) : []));
const DAIR = [].concat(...Object.keys(DISTRICTS).map(k => typeof DISTRICTS[k].airZones === 'function' ? (DISTRICTS[k].airZones(CTX[k]) || []).map(z => { const q = Object.assign({}, z, { x0: gx(z.sx0), z0: gz(z.sy0), x1: gx(z.sx1), z1: gz(z.sy1) }); delete q.sx0; delete q.sy0; delete q.sx1; delete q.sy1; return q; }) : []));
const L = [HEAD], TOTAL = { props: 0, natives: 0, features: 0 }, strayDrop = [];
const PARTED_RAMP = (f, R) => f.k === 'ramp' && R.M.strays.length >= 0;
ROOMS.forEach(R => {
    const M = R.M, W = M.W, Hh = M.D, cellR = M.cell, open = R.open;
    const tunPlots = M.order.filter(e => e.district === 'T');
    /* the pieces that came with the plots; a ramp whose two ends left each other (the Country's stair up into Agartha) is dropped (the census lists it) */
    const isStray = f => { if (f.k !== 'ramp' && f.k !== 'fall') return false; const a = M.plotOfSq(Math.floor((f.x0 != null ? f.x0 : f.x) / C + W / 2), Math.floor((f.z0 != null ? f.z0 : f.z) / C + Hh / 2)), b = M.plotOfSq(Math.floor((f.x1 != null ? f.x1 : f.x) / C + W / 2), Math.floor((f.z1 != null ? f.z1 : f.z) / C + Hh / 2)); return !a || !b || (a.district === 'T') !== (b.district === 'T') || (a.home && b.home && R.group.indexOf(a.district) < 0); };
    const feats0 = M.features.filter(f => { if (isStray(f)) { strayDrop.push(R.room + ': ' + f.k + ' at ' + (f.x0 != null ? f.x0 + ',' + f.z0 : f.x + ',' + f.z)); return false; } return true; });
    /* the tunnel plots: a plateau at their level (Agartha's: its Upper Terrace's), the rock roof and stalactites as over the Cavern */
    const TUNF = [], grnd = mkRnd(77 + R.key.charCodeAt(0)), ROCKS = ['psxg_rock_1', 'psxg_rock_2', 'psxg_rock_3', 'psxg_rock_4', 'ocean_rock_5', 'cave_stone'], tProps = [];
    const base = e => r2((e.level || 0) * LEVEL), tunTop = e => r2(base(e) + CEIL);
    tunPlots.forEach((e, i) => { const sx0 = e.col * N, sy0 = e.row * N, ox = M.gx(sx0) + N * C / 2, oz = M.gz(sy0) + N * C / 2;
        if (base(e)) TUNF.push({ k: 'plateau', x: r2(ox), z: r2(oz), w: N * C, d: N * C, h: base(e), edge: 0.15 });
        const parts = [{ s: 'box', p: [0, CEIL, 0], size: [N * C, r2(Math.max(4, (R.group.length ? ROCKSH : r2(CEIL + 6)) - base(e) - CEIL)), N * C], top: false, under: true, key: 'cave_wall', tint: 0x4a443e, uv: 7 }];
        const sq = []; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (open(sx0 + lx, sy0 + ly)) sq.push([lx, ly]);
        for (let k = 0; k < Math.min(8, sq.length / 5); k++) { const q = sq[Math.floor(grnd() * sq.length)], len = r2(0.8 + grnd() * 1.6), r = r2(0.2 + grnd() * 0.3);
            parts.push({ s: 'cyl', p: [r2(M.gcx(sx0 + q[0]) - ox), r2(CEIL - len), r2(M.gcz(sy0 + q[1]) - oz)], r: 0.03, r2: r, h: len, seg: 6, key: 'cave_wall', tint: ROCK[Math.floor(grnd() * ROCK.length)], uv: 3.5 }); }
        TUNF.push({ k: 'arch', id: 'cav:ow:' + e.wx + '_' + e.wy + ':roof', x: r2(ox), z: r2(oz), rot: 0, base: base(e), parts });
        /* a torch at a bend of the passage (one in three lit: the room's ten lights), rocks along the walls */
        const wallSq = sq.filter(q => { let n = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!open(sx0 + q[0] + dx, sy0 + q[1] + dy)) n++; return n >= 2; });
        if (wallSq.length) { const q = wallSq[Math.floor(grnd() * wallSq.length)]; tProps.push({ key: 'cave_torch', x: M.gcx(sx0 + q[0]), z: M.gcz(sy0 + q[1]), y: base(e), noLight: i % 3 !== 0, _sq: q, _e: e }); }
        for (let k = 0; k < 2 && wallSq.length > 2; k++) { const q = wallSq[Math.floor(grnd() * wallSq.length)]; if (tProps.some(p => p._e === e && p._sq === q)) continue;
            tProps.push({ key: ROCKS[Math.floor(grnd() * ROCKS.length)], x: r2(M.gcx(sx0 + q[0]) + (grnd() - 0.5) * 1.2), z: r2(M.gcz(sy0 + q[1]) + (grnd() - 0.5) * 1.2), face: Math.round(grnd() * 360), h: r2(0.8 + grnd() * 0.9), noBlock: true, _sq: q, _e: e }); } });
    tProps.forEach(p => { delete p._sq; delete p._e; if (!p.y) delete p.y; });
    const spaces = M.spaces(open), feats = spaces.concat(feats0, TUNF);
    /* the paint, as the home room's (a tunnel square: the cave floor) */
    const paintR = new Uint8Array(W * Hh); for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const ch = cellR[y][x], e = M.plotOfSq(x, y), d = e ? e.district : 'T'; paintR[y * W + x] = ('wb'.includes(ch) && d === 'H') ? 8 : ('wb'.includes(ch) && d === 'A') ? 7 : (PCH[ch] || 0); }
    /* the walk check: every plot of the room is reached on foot from the spawn's square (open squares; the home check proved the levels) */
    const sp = R.spawnAt ? M.sq(R.spawnAt[0], R.spawnAt[1], R.spawnAt[2]) : (() => { const e = tunPlots[0]; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (open(e.col * N + lx, e.row * N + ly)) return [e.col * N + lx, e.row * N + ly]; })();
    if (!open(sp[0], sp[1])) throw new Error(R.room + ': the spawn is not open');
    { const seen = new Uint8Array(W * Hh), st = [sp], walk = (x, y) => open(x, y) && cellR[y][x] !== 'l'; seen[sp[1] * W + sp[0]] = 1;
      while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!walk(X, Y) || seen[Y * W + X]) continue; seen[Y * W + X] = 1; st.push([X, Y]); } }
      const cold = M.order.filter(e => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(e.row * N + ly) * W + e.col * N + lx]) return false; return true; }).map(e => e.name);
      if (cold.length) throw new Error(R.room + ': plots not reached on foot: ' + cold.join(', ')); }
    const allProps = M.props.concat(tProps);
    allProps.forEach(p => { const sx = Math.floor((p.x + M.HX) / C), sy = Math.floor((p.z + M.HZ) / C); if (!open(sx, sy)) throw new Error(R.room + ': ' + p.key + ' stands in the rock at ' + sx + ',' + sy); });
    const inRoom = (x, z) => R.group.length && M.toRoom(x, z) && M.mapOf(x, z) && R.group.includes(M.mapOf(x, z).district);
    const suns = DSUNS.filter(s => R.group.includes(s.d)).map(s => { const q = M.toRoom(s.x, s.z), o = Object.assign({}, s, { x: q[0], z: q[1] }); delete o.d; return o; }).slice(0, 4);
    const air = DAIR.map(z => { const a = M.toRoom(z.x0 + 0.01, z.z0 + 0.01), b = M.toRoom(z.x1 - 0.01, z.z1 - 0.01); if (!a || !b || !inRoom(z.x0 + 0.01, z.z0 + 0.01)) return null; return Object.assign({}, z, { x0: r2(Math.min(a[0], b[0])), z0: r2(Math.min(a[1], b[1])), x1: r2(Math.max(a[0], b[0])), z1: r2(Math.max(a[1], b[1])) }); }).filter(Boolean)
        .map(z => { const o = Object.assign({}, z); ['x0', 'z0', 'x1', 'z1'].forEach(k => { o[k] = Math.round(o[k] / C * 2) * C / 2; }); return o; });
    const counters2 = counters.map(c => inRoom(c.x, c.z) ? MOVE.turned ? null : null : null).filter(Boolean);
    const cnt = counters.filter(c => inRoom(c.x, c.z)).map(c => { const q = M.toRoom(c.x, c.z); return Object.assign({}, c, { x: q[0], z: q[1] }, c.face != null ? { face: (c.face + R.turn) % 360 } : {}); });
    const spPlot = M.plotOfSq(sp[0], sp[1]), SPMr = { x: M.gcx(sp[0]), z: M.gcz(sp[1]) };
    const roomDoors = RDOORS[R.key].concat(EXTRA[R.key]);
    TOTAL.props += M.props.length; TOTAL.natives += M.npc.length;
    console.log(R.room + ' ' + JSON.stringify({ world: [M.wx, M.wy], box: [M.cols, M.rows], mask: M.mask.join('/'), plots: M.order.length, features: feats.length, props: allProps.length, natives: M.npc.length, doors: roomDoors.length }));
    L.push.apply(L, writeRoom({ room: R.room, part: R.part, label: R.label, sub: R.sub, world: { wx: M.wx, wy: M.wy }, w: 2 * M.HX, d: 2 * M.HZ, SH: R.group.length ? SH : r2(Math.max.apply(null, tunPlots.map(tunTop)) + 6),
        plate: { x: SPMr.x, z: SPMr.z, y: r2(base(spPlot) + 4.2) }, sunsNote: R.sunsNote, suns, air, parti: R.parti, nx: M.cols, nz: M.rows, mask: M.mask.indexOf('.') >= 0 || M.mask.some(r => r.indexOf('.') >= 0) ? M.mask : null,
        names: M.order.map(e => [M.pid(e), e.name, e.district, e.level]), px0: M.gcx(0), pz0: M.gcz(0), W, Hh, paint: paintR, features: feats, doors: roomDoors, counters: cnt, props: allProps, npc: M.npc, lines: R.lines,
        spawn: { x: SPMr.x, z: SPMr.z, face: R.key === 'KH' ? (90 + 270) % 360 : 0 } }));
});
L.push("        /* CAVERN36-END */");
BLOCK = L.join('\n') + '\n';
if (TOTAL.props !== props.length || TOTAL.natives !== npc.length) throw new Error('the move lost pieces: props ' + props.length + ' -> ' + TOTAL.props + ', natives ' + npc.length + ' -> ' + TOTAL.natives);
const strays = [].concat(...ROOMS.map(R => R.M.strays.map(s => R.room + ': ' + s)));
if (strays.length) console.log('STRAYS (a piece across two plots that no longer stand the same way; moved with its anchor):\n  ' + strays.join('\n  '));
if (strayDrop.length) console.log('DROPPED (an opening between plots that parted):\n  ' + strayDrop.join('\n  '));
console.log('SEAMS:\n  ' + SEAMLIST.join('\n  ') + '\n  for phase 4.4: the Tunnel-Way Tunnel\'s north side ' + seamId(-7, 2, 'N') + ' (U12 from the Holding Cells)');
const placeOf = w => "site: '" + SITE + "', part: '" + w.R.part + "', " + place(w) + (w.wall === 'free' && w.R.key !== 'KH' && w.R.key !== 'A' ? '' : '') + ",";
WANT = Object.keys(WAYS).map(k => [placeOf(WAYS[k]), 'link ' + k, k])
    .concat(Object.keys(BAYS).map(k => [k + ": { room: '" + BAYS[k].R.room + "', door: { id: '" + BAYS[k].id + "', " + place(BAYS[k]) + " } },", 'DOOR_HQ.siteRooms ' + k, null]));

}
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at these rooms yet (see the rows above)'); }
if (DRY) process.exit(0);
const END = '        /* CAVERN36-END */\n', b0 = src.indexOf('        /* CAVERN36-BEGIN'), b1 = src.indexOf(END);
if (b0 < 0 || b1 < b0) throw new Error('CAVERN36 markers not found in data.js');
src = src.slice(0, b0) + BLOCK + src.slice(b1 + END.length);
fs.writeFileSync(file, src);
