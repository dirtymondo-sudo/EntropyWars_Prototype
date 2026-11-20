#!/usr/bin/env node
/* bake-dumb.js — THE D.U.M.B. ON PLOTS (2026-11-16, mondo's order: the eight zones still on old handmade rooms are redesigned on plots without
   waiting for his OK; docs/plans/ZONE_THREAD_BRIEF.md). The ULTIMATE secret base, all underground: 7 x 7 plots of 12 x 12 squares (294 x 294 m).
   Five districts: K CERN, THE RING (the collider tunnel, an octagon round the whole base) · P LEVEL P3 (the tunnel every base is on, the tram)
   · S SUB-LEVEL 7 (the hub, 14 m under P3) · R RESEARCH (Dream, Clone, the White Rooms) · C COMMAND (the War Room, the Bunker).
   Reads docs/areas/dumb/layout.json (written by docs/plans/world-zones/draw-dumb.js: every plot's name, district, level, roof, the 84 x 84
   square map, the openings) and writes the room `site_prebuilt_dumb_base` into data.js between DUMB49-BEGIN / DUMB49-END.
   `node bake-dumb.js` writes; `--dry-run` prints the counts + the walk check; `DUMB_DUMP=1` prints the walked map. Never hand-edit between the
   markers: edit this tool, the layout (through draw-dumb.js) or a district file and rerun. Notes: docs/notes/areas-complexes.md "THE D.U.M.B. ON PLOTS".

   THE DISTRICT FILES: what stands in a district is written in docs/areas/dumb/districts/<K P S R C>.js, one thread a file. This tool keeps
   what is shared: the plan, the levels, the openings (stairs, the Vent's ladder), the roofs, the wall lining, the ceiling lights, the rails,
   the pool, the ways out, the shell, the checks, and THE ROOM KIT (ctx.room: thin walls on square lines, doors, decks, stairs, signs).

   THE SQUARE MAP: x = rock (the wall), o = corridor, f = room floor, r = the ring's tunnel, j = the tram track, w = pool water.
   Squares are (sx 0..84 west to east, sy 0..84 north to south); gx() = a square's west / north line in metres, gcx() = its middle.
   THE LEVELS: one height a plot (layout `level`, 1 level = 1.75 m): 8 = the Ring + Level P3 (14 m), 2 = Research + Command (3.5 m),
   0 = Sub-Level 7. A plot's roof stands layout `h` over its floor; a plot a stair or a ladder comes down into is as tall as the plot above.
   Where two plots of different levels meet (layout `openings`): `stair` (a flight on the low side, `wide` squares) or `climb` (a ladder). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/dumb/layout.json'), 'utf8'));
const C = 3.5, N = 12, GX = PLAN.cols, GY = PLAN.rows, W = N * GX, Hh = N * GY, HX = W * C / 2, HZ = Hh * C / 2, LEVEL = 1.75, T = 0.3, DW = 1.75, DH = 2.2;
const ROOM = 'site_prebuilt_dumb_base', PART = 'base';
const OW = { wx: 0, wy: 11 };   // THE ONE WORLD: the room's north-west plot on the world grid (the East Gantry P06-05 -> 6,16)
const OLD = { motorpool: 'site_prebuilt_dumb_motorpool', sublevel7: 'site_prebuilt_dumb_sublevel7', dreamlab: 'site_prebuilt_dumb_dreamlab', clonevats: 'site_prebuilt_dumb_clonevats',
    warroom: 'site_prebuilt_dumb_warroom', bunker: 'site_prebuilt_dumb_bunker', ring: 'site_prebuilt_cern_ring', ward: 'site_prebuilt_area51_ward' };
const r2 = v => Math.round(v * 100) / 100, gx = c => r2(-HX + c * C), gz = c => r2(-HZ + c * C), gcx = c => r2(-HX + (c + 0.5) * C), gcz = c => r2(-HZ + (c + 0.5) * C);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
/* the old rooms' people, lines, door plates and counters keep their own words: read from the old literals (so the old literals stay in data.js) */
const OLDR = id => JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [], d: (r.doors || []).map(d => ({ id: d.id, label: d.label, sub: d.sub, desc: d.desc, leaf: d.leaf })), c: r.counters || [] } : { n: [], l: [], d: [], c: [] })(DOOR_HQ.rooms.' + id + '))', D));
const O = {}; Object.keys(OLD).forEach(k => { O[k] = OLDR(OLD[k]); });
const cell = PLAN.cells.map(r => r.split(''));
if (cell.length !== Hh || cell.some(r => r.length !== W)) throw new Error('layout.json cells: want ' + Hh + ' rows of ' + W);
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); if (!PLAN.districts[p.d]) throw new Error('district? ' + p.id); p.base = r2(p.level * LEVEL); p.sx = p.x * N; p.sy = p.y * N; plot[p.id] = p; });
const Pxy = (x, y) => plot['P0' + x + '-0' + y];
const plotAt = (sx, sy) => Pxy(Math.max(0, Math.min(GX - 1, Math.floor(sx / N))), Math.max(0, Math.min(GY - 1, Math.floor(sy / N))));
const distAt = (sx, sy) => plotAt(sx, sy).d, baseAt = (sx, sy) => plotAt(sx, sy).base;
const open = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] !== 'x';
const F = [], PARTS = [], INNER = [], props = [], doors = [], npc = [], counters = [], count = {}, taken = new Set(), errs = [], strays = [], DECALS = [], PAINT = {};
const feat = o => { F.push(o); return o; };
const setRect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ch; };

/* ── THE OPENINGS ── */
const OPEN = PLAN.openings.map(o => { const a = plot[o.a], b = plot[o.b]; if (!a || !b) throw new Error('opening? ' + o.a + ' ' + o.b);
    const ns = a.x === b.x, hi = a.level >= b.level ? a : b, lo = hi === a ? b : a;
    if ((ns ? Math.abs(a.y - b.y) : Math.abs(a.x - b.x)) !== 1 || (ns ? a.x !== b.x : a.y !== b.y)) throw new Error('opening between plots that do not touch: ' + o.a + ' ' + o.b);
    const line = ns ? Math.max(a.sy, b.sy) : Math.max(a.sx, b.sx), mid = (ns ? a.sx : a.sy) + 6, dx = ns ? 0 : Math.sign(lo.x - hi.x), dy = ns ? Math.sign(lo.y - hi.y) : 0;
    return Object.assign({}, o, { ns, hi, lo, line, mid, dx, dy, rise: r2(hi.base - lo.base) }); });
/* THE ROOF: a plot's roof top over the room's level 0. A plot a stair or a ladder comes down into is as tall as the plot above it. */
const topOf = p => r2(Math.max.apply(null, [p.base + p.h].concat(OPEN.filter(o => o.lo === p).map(o => o.hi.base + o.hi.h))));
/* a way out through the room's wall: the squares from (sx, sy) straight to the wall are opened, `half` squares each side; returns the place along the wall (m) */
function spur(sx, sy, wall, half) {
    const step = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }[wall]; let x = sx, y = sy; half = half == null ? 1 : half;
    while (x >= 0 && y >= 0 && x < W && y < Hh) { for (let m = -half; m <= half; m++) { const X = step[0] ? x : x + m, Y = step[0] ? y + m : y; if (X >= 0 && Y >= 0 && X < W && Y < Hh && cell[Y][X] === 'x') cell[Y][X] = 'o'; } x += step[0]; y += step[1]; }
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
const native = (race, sx, sy, face, say, x) => { spot(sx, sy, race, true); if ('wj'.includes(cell[sy][sx])) errs.push(race + ' stands in the water or on the track at ' + sx + ',' + sy); const n = Object.assign({ x: gcx(sx), z: gcz(sy), face: face || 0, race }, x || {}); if (say) n.say = say; npc.push(n); };
const sayOf = (R, race, i) => (R.n.filter(n => n.race === race)[i || 0] || {}).say;

/* ── THE ROOM KIT (the Desert's insides kit, bake-desert-insides.js `mk`, on a plot's own floor). A room is NU x NV squares whose north-west
   square is (u0, v0) on the map; everything is written in ITS squares (u west to east, v north to south) and heights over ITS floor.
     R.wall(axis, at, a, b, o)  a wall on a square LINE. axis 'u' = west-east on the line v = at, 'v' = north-south on the line u = at.
                                o: h (3.5), y0 (its foot: an upper floor's wall), key / tint / glow / gain, glass, doors [[middle, leaf, double]]
                                (leaf 'none' = the bare doorway), gaps [[from, to]], draw: false (walked only), walk: false (drawn only), frame
     R.pane(...)                the same, in glass
     R.ceil(u0, v0, u1, v1, y, key, tint)   a drawn slab (a low room's ceiling), its underside at y
     R.deck(u0, v0, u1, v1, y, key)         an upper floor the walker stands on (a bridge row)
     R.guard(axis, at, a, b, y, tint)       a rail on an upper floor's edge
     R.stair(u0, v0, u1, v1, w, h0, h1, model)   a flight, w squares wide
     R.B(key, u, v, face, x)    a blocker on the middle of square (u, v) (x.nu / x.nv = it fills more squares)
     R.dec(key, u, v, face, x)  decor at any spot (a catalogue WALL piece's `y` is its mount height; any other `y` of 1 m or more is over the room's floor)
     R.hung(key, u, v, face, y) a wall piece on a wall. face: 0 on a north wall, 180 on a south, 90 on a west, 270 on an east
     R.bulb(u, v, y)            a real light under a ceiling (ten real lights for the WHOLE base: say so on the board before adding one)
     R.lamp(u, v, y)            a drawn ceiling lamp (glows, lights nothing)
     R.sign(words, u, v, y, w, h, ry, fg, bg, font)   words on a wall (ry: 0 looks south, 180 north, 90 west, -90 east); R.label = a door plate
     R.box(u, v, y, w, h, d, key, tint, x)   a drawn box (its middle, its foot)
     R.who(race, u, v, face, say)
   Call R.done() last (a district's `build` does): it steps props out of the kit's walls. ── */
const SIZES = (() => { try { return require('./docs/disaster-city/prop-sizes.json'); } catch (e) { return {}; } })();
function mkRoom(tag, u0, v0, NU, NV, B) {
    const X = u => r2(gx(u0) + u * C), Z = v => r2(gz(v0) + v * C), sqk = (u, v) => (u0 + Math.floor(u)) + ':' + (v0 + Math.floor(v));
    const R = { tag, NU, NV, B, X, Z, W: NU * C, D: NV * C, walls: [], props: [], must: [], bsq: {} };
    const part = p => { p.p[1] = r2(p.p[1] + B); PARTS.push(p); return p; };
    R.part = part;
    R.wall = (axis, at, a, b, o) => { o = o || {}; const h = o.h || 3.5, y0 = o.y0 || 0;
        const dress = p => { if (o.key) p.key = o.key; if (o.tint != null) p.tint = o.tint; if (o.glass) { p.kind = 'glass'; p.uv = 7; } if (o.glow) p.glow = o.glow; if (o.gain) p.gain = o.gain; return p; };
        const seg = (s0, s1) => { if (s1 - s0 < 0.02) return; const m = (s0 + s1) / 2, L = (s1 - s0) * C, px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m);
            if (o.draw !== false) part(dress({ s: 'box', p: [px, y0, pz], size: axis === 'u' ? [r2(L), h, T] : [T, h, r2(L)], uv: [3.5, 1.75] }));
            if (o.walk !== false) { const e = Math.min(0.15, L / 2 - 0.01), row = Object.assign({ k: 'wall' }, axis === 'u' ? { x0: r2(X(s0) + e), z0: pz, x1: r2(X(s1) - e), z1: pz } : { x0: px, z0: r2(Z(s0) + e), x1: px, z1: r2(Z(s1) - e) }, { t: T, ghost: true, rail: false });
                row.h = h; row.y = r2(B + y0 + h); if (y0 > 0) row.y0 = r2(B + y0); if (o.glassWalk) { row.ghost = false; row.glass = true; row.t = 0.08; } F.push(row); R.walls.push(row); } };
        const cuts = (o.doors || []).map(d => ({ a: d[0] - DW / 2 / C, b: d[0] + DW / 2 / C, d })).concat((o.gaps || []).map(g => ({ a: g[0], b: g[1] }))).sort((p, q) => p.a - q.a);
        let cur = a;
        cuts.forEach(c => { seg(cur, c.a); cur = c.b; if (!c.d) return;
            const m = c.d[0], px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m), fr = o.frame != null ? o.frame : 0x3a3d42;
            if (h > DH + 0.05 && o.draw !== false) part(dress({ s: 'box', p: [px, r2(y0 + DH), pz], size: axis === 'u' ? [DW, r2(h - DH), T] : [T, r2(h - DH), DW], uv: [3.5, 1.75], under: true }));
            [-1, 1].forEach(sd => part({ s: 'box', p: axis === 'u' ? [r2(px + sd * (DW / 2 + 0.06)), y0, pz] : [px, y0, r2(pz + sd * (DW / 2 + 0.06))], size: axis === 'u' ? [0.12, DH + 0.1, T + 0.08] : [T + 0.08, DH + 0.1, 0.12], tint: fr }));
            part({ s: 'box', p: [px, r2(y0 + DH), pz], size: axis === 'u' ? [DW + 0.24, 0.12, T + 0.08] : [T + 0.08, 0.12, DW + 0.24], tint: fr });
            if (c.d[1] && c.d[1] !== 'none') { const r = { x: px, z: pz, rot: axis === 'u' ? 0 : 90, w: DW - 0.2, leaf: c.d[1], y: r2(B + y0) }; if (c.d[2]) r.double = true; INNER.push(r); }
            if (axis === 'u') R.must.push(sqk(m, at - 0.5), sqk(m, at + 0.5)); else R.must.push(sqk(at - 0.5, m), sqk(at + 0.5, m)); });
        seg(cur, b); };
    R.pane = (axis, at, a, b, o) => R.wall(axis, at, a, b, Object.assign({ tint: 0xd8ecf2 }, o, { draw: false, glassWalk: true }));
    R.ceil = (ua, va, ub, vb, y, key, tint, x) => { const p = Object.assign({ s: 'box', p: [X((ua + ub) / 2), y, Z((va + vb) / 2)], size: [r2((ub - ua) * C), 0.14, r2((vb - va) * C)], under: true, uv: 3.5 }, x || {}); if (key) p.key = key; if (tint != null) p.tint = tint; return part(p); };
    R.deck = (ua, va, ub, vb, y, key) => { const ew = (ub - ua) >= (vb - va);
        F.push(ew ? { k: 'bridge', x0: X(ua), z0: Z((va + vb) / 2), x1: X(ub), z1: Z((va + vb) / 2), w: r2((vb - va) * C), y: r2(B + y), key, rails: false, plain: true }
                  : { k: 'bridge', x0: X((ua + ub) / 2), z0: Z(va), x1: X((ua + ub) / 2), z1: Z(vb), w: r2((ub - ua) * C), y: r2(B + y), key, rails: false, plain: true }); };
    R.guard = (axis, at, a, b, y, tint) => { const m = (a + b) / 2, L = (b - a) * C, px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m), tn = tint != null ? tint : 0x4a4f56;
        for (const yy of [0.55, 1.05]) part({ s: 'box', p: [px, r2(y + yy), pz], size: axis === 'u' ? [r2(L), 0.06, 0.06] : [0.06, 0.06, r2(L)], tint: tn });
        part({ s: 'box', p: axis === 'u' ? [X(a), y, pz] : [px, y, Z(a)], size: [0.07, 1.08, 0.07], tint: tn, n: Math.round((b - a) * 2) + 1, step: axis === 'u' ? [C / 2, 0, 0] : [0, 0, C / 2] });
        F.push(Object.assign({ k: 'wall' }, axis === 'u' ? { x0: r2(X(a) + 0.15), z0: pz, x1: r2(X(b) - 0.15), z1: pz } : { x0: px, z0: r2(Z(a) + 0.15), x1: px, z1: r2(Z(b) - 0.15) }, { t: T, ghost: true, rail: false, y: r2(B + y + 1.1), y0: r2(B + y) })); };
    R.stair = (ua, va, ub, vb, w, h0, h1, model) => { const dx = Math.sign(ub - ua), dz = Math.sign(vb - va);
        F.push({ k: 'ramp', x0: X(ua), z0: Z(va), x1: r2(X(ub) + dx * 0.4), z1: r2(Z(vb) + dz * 0.4), w: r2(w * C), h0: r2(B + h0), h1: r2(B + h1), stairs: true, model: model || 'steel', edge: 0.15 });
        const hw = w / 2; for (let u = Math.floor(Math.min(ua, ub) - (dz ? hw : 0)); u < Math.max(ua, ub) + (dz ? hw : 0); u++) for (let v = Math.floor(Math.min(va, vb) - (dx ? hw : 0)); v < Math.max(va, vb) + (dx ? hw : 0); v++) taken.add(sqk(u, v)); };
    R.B = (key, u, v, face, x) => { const nu = (x && x.nu) || 1, nv = (x && x.nv) || 1; for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { spot(u0 + u + i, v0 + v + j, key); R.bsq[sqk(u + i, v + j)] = key; }
        const o = Object.assign({ key, x: X(u + nu / 2), z: Z(v + nv / 2) }, face != null ? { face } : {}, x || {}); delete o.nu; delete o.nv; props.push(o); R.props.push(o); return o; };
    R.dec = (key, u, v, face, x) => { const o = Object.assign({ key, x: X(u), z: Z(v) }, face != null ? { face } : {}, x || {});
        if (CAT[key] && CAT[key].wall && o.y != null) { o.mount = o.y; delete o.y; } else if (o.y != null && o.y >= 1) o.y = r2(B + o.y);
        if (!open(u0 + Math.floor(u), v0 + Math.floor(v))) errs.push(tag + ': ' + key + ' stands in the rock at ' + u + ',' + v);
        props.push(o); R.props.push(o); return o; };
    R.hung = (key, u, v, face, y) => R.dec(key, u, v, face, { y });
    R.bulb = (u, v, y) => props.push({ key: 'bare_bulb', x: X(u), z: Z(v), ceil: true, y: r2(B + y) });
    R.who = (race, u, v, face, say) => native(race, u0 + Math.floor(u), v0 + Math.floor(v), face, say, { x: X(u), z: Z(v) });
    R.lamp = (u, v, y, tint) => { part({ s: 'box', p: [X(u), r2(y - 0.5), Z(v)], size: [0.04, 0.5, 0.04], tint: 0x2a2c30 }); part({ s: 'cyl', p: [X(u), r2(y - 0.72), Z(v)], r: 0.42, r2: 0.16, h: 0.22, seg: 10, tint: 0x2a2c30 }); part({ s: 'cyl', p: [X(u), r2(y - 0.78), Z(v)], r: 0.3, h: 0.06, seg: 10, tint: tint != null ? tint : 0xfff4d8, glow: 1 }); };
    R.sign = (words, u, v, y, w, h, ry, fg, bg, font, glow) => part(Object.assign({ s: 'quad', p: [X(u), y, Z(v)], size: [w, h], ry: ry || 0, key: 'txt:' + words + '|' + (fg || '#f0f0f0') + '|' + (bg || '') + '|' + r2(w / h) + '||' + (font || 'stencil'), uv: 'fit', kind: bg ? 'wall' : 'over' }, glow ? { glow } : {}));
    R.label = (words, u, v, ry, w) => R.sign(words, u, v, 2.42, w || Math.max(0.9, words.length * 0.13), 0.24, ry, '#f0f0f0', '#23262b');
    R.box = (u, v, y, w, h, d, key, tint, x) => { const p = Object.assign({ s: 'box', p: [X(u), y, Z(v)], size: [w, h, d] }, x || {}); if (key) p.key = key; if (tint != null) p.tint = tint; return part(p); };
    R.cyl = (u, v, y, r, h, key, tint, x) => { const p = Object.assign({ s: 'cyl', p: [X(u), y, Z(v)], r, h, seg: 12 }, x || {}); if (key) p.key = key; if (tint != null) p.tint = tint; return part(p); };
    R.keep = (u, v) => taken.add(sqk(u, v));
    /* every free-standing prop that stands in one of this room's walls steps out of it; a wall piece comes out to 2 cm proud of it */
    R.done = () => { let moved = 0;
        R.props.forEach(p => { if (p.ceil) return; const wallPiece = p.mount != null, sz = SIZES[p.key], r = wallPiece ? 0.17 : (sz ? Math.min(sz[0], sz[2]) / 2 : 0.25) + 0.17, lvl = B + (wallPiece ? p.mount : (p.y >= 1 ? p.y - B : 0));
            for (let n = 0; n < 3; n++) for (const w of R.walls) { const y0 = w.y0 != null ? w.y0 : B, y1 = w.y; if (lvl < y0 - 0.05 || lvl >= y1) continue;
                const ax = w.x1 - w.x0, az = w.z1 - w.z0, L2 = ax * ax + az * az, t = L2 ? Math.max(0, Math.min(1, ((p.x - w.x0) * ax + (p.z - w.z0) * az) / L2)) : 0, qx = w.x0 + ax * t, qz = w.z0 + az * t, d = Math.hypot(p.x - qx, p.z - qz);
                if (d >= r - 0.001) continue; let nx = p.x - qx, nz = p.z - qz; if (d < 1e-6) { nx = -az; nz = ax; } const l = Math.hypot(nx, nz) || 1; p.x = r2(qx + nx / l * r); p.z = r2(qz + nz / l * r); moved++; } });
        R.must.forEach(k => { if (R.bsq[k]) errs.push(tag + ': ' + R.bsq[k] + ' stands in a doorway square ' + k); taken.add(k); });
        count.moved = (count.moved || 0) + moved; return R; };
    return R;
}

/* ── THE DISTRICT FILES: docs/areas/dumb/districts/<LETTER>.js. A file may export any of the stages below; each is called with that
   district's own ctx. A plot's squares are local: ctx.sq('P03-03', lx, ly) -> [sx, sy]. A file may also export `look` (its walls, roof and
   light: see LOOK below; `looks: { plotId: {...} }` for one plot) and `airZones(ctx)`. ── */
const STAGES = ['plan', 'build', 'dress', 'people'];
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const DDIR = path.join(REPO, 'docs/areas/dumb/districts');
const DISTRICTS = (() => { const o = {}; fs.readdirSync(DDIR).filter(f => /^[A-Z]\.js$/.test(f)).sort().forEach(f => { o[f[0]] = require(path.join(DDIR, f)); }); return o; })();
Object.keys(PLAN.districts).forEach(k => { if (!DISTRICTS[k]) throw new Error('district file missing: docs/areas/dumb/districts/' + k + '.js'); });
const WAYSPOT = {};   // filled below, before `build`: ctx.way(id) = { sx, sy, x, z }
const CTX = {};
Object.keys(DISTRICTS).forEach(k => { const rnd = mkRnd(7919 * k.charCodeAt(0));
    const sq = (id, lx, ly) => { const p = plot[id]; if (!p) throw new Error('plot? ' + id); return [p.sx + lx, p.sy + ly]; };
    CTX[k] = { d: k, C, N, W, H: Hh, LEVEL, gx, gz, gcx, gcz, r2, PLAN, plot, plots: PLAN.plots.filter(p => p.d === k), cell, setRect, open, distAt, baseAt, feat, props, npc, counters, doors, taken, rnd, sq, O, sayOf, CAT,
        P: (key, id, lx, ly, o) => { const s = sq(id, lx, ly); P(key, s[0], s[1], o); }, dec: (key, id, lx, ly, o) => { const s = sq(id, lx, ly); decWith(rnd)(key, s[0], s[1], o); },
        native: (race, id, lx, ly, face, say) => { const s = sq(id, lx, ly); native(race, s[0], s[1], face, say); },
        /* a room of the kit: its north-west square is the plot's (lx, ly); it may run over the plot's line */
        room: (id, lx, ly, NU, NV, tag) => { const s = sq(id, lx, ly); return mkRoom(tag || (k + ':' + id), s[0], s[1], NU, NV, plot[id].base); },
        squares: (id, chars) => { const p = plot[id], out = []; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if ((chars || 'of').includes(cell[p.sy + ly][p.sx + lx])) out.push([lx, ly]); return out; },
        top: id => topOf(plot[id]), free: (id, lx, ly) => { const s = sq(id, lx, ly); return open(s[0], s[1]) && !taken.has(s[0] + ':' + s[1]); },
        /* a catalogue WALL piece on the wall of a plot's square: side 'n' | 's' | 'w' | 'e' = which wall of that square, y = its height on it */
        hang: (key, id, lx, ly, side, y, o) => { const q = sq(id, lx, ly), d = { n: [0, -1.69, 0], s: [0, 1.69, 180], w: [-1.69, 0, 90], e: [1.69, 0, 270] }[side]; if (!open(q[0], q[1])) errs.push(key + ' hangs in the rock at ' + q); props.push(Object.assign({ key, x: r2(gcx(q[0]) + d[0]), z: r2(gcz(q[1]) + d[1]), face: d[2], mount: y == null ? 1.6 : y }, o || {})); },
        keep: (id, lx, ly) => { const s = sq(id, lx, ly); taken.add(s[0] + ':' + s[1]); },
        /* a floor sheet on a plot's squares (the end exclusive) */
        paint: (id, lx0, ly0, lx1, ly1, sheet) => { const p = plot[id]; for (let y = ly0; y < ly1; y++) for (let x = lx0; x < lx1; x++) PAINT[(p.sx + x) + ':' + (p.sy + y)] = sheet; },
        /* a drawn part at a spot on the map: metres, its y over the ROOM's level 0 (ctx.plot[id].base + height) */
        part: p => { PARTS.push(p); return p; },
        grime: (kind, id, lx, ly, r) => { const s = sq(id, lx, ly); DECALS.push({ kind, x: gcx(s[0]), z: gcz(s[1]), y: plot[id].base, r: r || 1.4, rot: Math.round(rnd() * 360) }); },
        way: id => WAYSPOT[id],
        corners: id => { const p = plot[id], out = []; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { const x = p.sx + lx, y = p.sy + ly; if (!open(x, y) || 'wj'.includes(cell[y][x]) || taken.has(x + ':' + y)) continue;
            let n = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!open(x + dx, y + dy)) n++; if (n >= 2) out.push([lx, ly]); } return out; },
        walled: id => { const p = plot[id], out = []; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const x = p.sx + lx, y = p.sy + ly; if (!open(x, y) || 'wj'.includes(cell[y][x]) || taken.has(x + ':' + y)) continue;
            let n = 0, side = null; for (const [dx, dy, s] of [[1, 0, 'e'], [-1, 0, 'w'], [0, 1, 's'], [0, -1, 'n']]) if (!open(x + dx, y + dy)) { n++; side = s; } if (n === 1) out.push([lx, ly, side]); } return out; } }; });
const run = stage => Object.keys(DISTRICTS).forEach(k => { const m = DISTRICTS[k]; if (m && typeof m[stage] === 'function') { curD = k; try { m[stage](CTX[k]); } finally { curD = null; } } });

run('plan');      // what a district changes on the plan's squares, before anything is derived from them

OPEN.forEach(o => { for (let m = -1; m <= 1; m++) for (const t of [o.line - 1, o.line]) { const sx = o.ns ? o.mid + m : t, sy = o.ns ? t : o.mid + m; if (!open(sx, sy)) throw new Error('opening ' + o.a + ' / ' + o.b + ': square ' + sx + ',' + sy + ' is rock'); } });

/* ── THE GANTRY TUNNEL (2026-11-17, One World phase 4.4, the walk U5 from the Sewers' Running Tunnels): the tunnel's east end is dug through the
   East Gantry's last four squares (rows 62..65, the track on 63) to the room's east wall, where the door pair `ow_v_7_16` joins the Sewers'
   Gantry Tunnel (bake-sewers.js WSEAM). ── */
{ const p = plot['P06-05']; for (let y = 62; y <= 65; y++) for (let x = p.sx + 8; x < p.sx + N; x++) if (cell[y][x] === 'x') cell[y][x] = y === 63 ? 'j' : 'o';
  doors.push({ id: 'ow_v_7_16', way: 'trail', wall: 'e', z: gcz(64), leaf: 'leaf_bulkhead', wide: true, label: 'DISASTER CITY · THE SEWERS', sub: 'THE GANTRY TUNNEL · WEST UNDER THE CITY TO THE RUNNING TUNNELS', action: { room: 'site_prebuilt_downtown_underworld', at: 'ow_v_7_16' }, desc: '' }); }

/* ── THE WAYS OUT (ten, all in the game before the rebuild; plan: layout `ways`). Two bay doors (data.js DOOR_HQ.siteRooms.entry wears them),
   four links (DOOR_HQ.links holds the place; WANT below checks every row), four doors of the White Rooms (their far ends are the Desert's).
   A `free` way stands on a square against the rock: `face` 0 looks south, 90 west, 180 north, 270 east. ── */
const fw = (id, lx, ly, face) => { const p = plot[id], sx = p.sx + lx, sy = p.sy + ly; if (!open(sx, sy)) throw new Error('a way\'s square is rock: ' + id + ' ' + lx + ',' + ly); taken.add(sx + ':' + sy);
    const off = { 0: [0, -1.45], 180: [0, 1.45], 90: [1.45, 0], 270: [-1.45, 0] }[face]; return { wall: 'free', sx, sy, x: r2(gcx(sx) + off[0]), z: r2(gcz(sy) + off[1]), face }; };
const WAY = {
    bay: fw('P05-05', 6, 10, 180),                                                                             // Room 555: the freight lift, at the landing's south end
    bay_cern: { wall: 's', at: spur(plot['P03-06'].sx + 6, plot['P03-06'].sy + 9, 's') },                      // Room 999: the collider blast door
    area51_dumb: { wall: 'w', at: gcz(plot['P00-05'].sy + 4) },                                                // the tunnel west: Hangar 18's floor lift
    cave_dumb: fw('P03-01', 2, 6, 270),                                                                        // LEVEL -6: the blast door in the rock
    dumb_astral: fw('P01-02', 3, 2, 0),                                                                        // the dream screen
    dumb_internet: fw('P03-00', 6, 1, 180),                                                                      // THE INTERNET (One World 4.4, 2026-11-17): the screen between the Control Room's servers
    yard: fw('P01-01', 2 + 11, 0, 0), stormdrain: fw('P02-01', 5, 7, 90), hangar: fw('P02-01', 5, 10, 90), vent: fw('P02-01', 4, 11, 180),   // the White Rooms' four (the block's squares 11,0 · 15,7 · 15,10 · 14,11)
};
/* THE FREIGHT LINE (2026-11-17, One World phase 4.4; plots.json `under.rides`: "a ride, no plots; opens after the D.U.M.B."): a door pair from the
   Sewers' Power Station Drain to Level −6 (Sub-Level 7), clearance L6 (the game's highest door gate), `freight_line` at both ends. */
{ const w = fw('P03-01', 2, 3, 270); doors.push({ id: 'freight_line', wall: 'free', x: w.x, z: w.z, face: w.face, leaf: 'leaf_vault', wide: true, minClearance: 6, label: 'THE FREIGHT LINE', sub: 'THE FREIGHT LINE · TO THE SEWERS\' RADIOACTIVE DRAIN · CLEARANCE L6', action: { room: 'site_prebuilt_downtown_underworld', at: 'freight_line' }, desc: '' }); }
Object.keys(WAY).forEach(k => { const w = WAY[k]; WAYSPOT[k] = w.wall === 'free' ? { sx: w.sx, sy: w.sy, x: w.x, z: w.z, face: w.face } : { wall: w.wall, at: w.at }; });

run('build');     // rooms, galleries, platforms: what a district raises or lays on its plots
run('dress');     // props
run('people');    // the bystanders

if (strays.length) console.log('pieces a district stood on another district\'s squares (ask that district\'s thread):\n  ' + strays.join('\n  '));
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));

/* ── THE LEVELS: a plateau a plot (it runs a metre into every neighbour that stands as high or higher, and stops on the line of a lower one) ── */
const LVL = [];
PLAN.plots.forEach(p => { if (!p.level) return; const nb = (dx, dy) => { const q = (p.x + dx >= 0 && p.x + dx < GX && p.y + dy >= 0 && p.y + dy < GY) ? Pxy(p.x + dx, p.y + dy) : null; return (!q || q.level >= p.level) ? 1 : 0; };
    const x0 = gx(p.sx) - nb(-1, 0), x1 = gx(p.sx + N) + nb(1, 0), z0 = gz(p.sy) - nb(0, -1), z1 = gz(p.sy + N) + nb(0, 1);
    LVL.push({ k: 'plateau', x: r2((x0 + x1) / 2), z: r2((z0 + z1) / 2), w: r2(x1 - x0), d: r2(z1 - z0), h: p.base, edge: 0.15 }); });

/* ── THE OPENINGS, BUILT: a flight on the low side (it rises 2 in 3), `wide` squares; a climb = a ladder on the face ── */
const STAIRM = { K: 'steel', P: 'concrete', S: 'concrete', R: 'precast', C: 'precast' }, GO = [];
OPEN.forEach(o => {
    const along = v => o.ns ? gcx(v) : gcz(v), lineM = o.ns ? gz(o.line) : gx(o.line), sgn = o.dx + o.dy;   // sgn: +1 = down is east / south
    const pt = (a, t) => o.ns ? { x: a, z: t } : { x: t, z: a };
    if (o.kind === 'climb') { const p = pt(along(o.mid), r2(lineM + sgn * 0.3)); GO.push({ k: 'climb', x: p.x, z: p.z, face: o.ns ? (sgn > 0 ? 0 : 180) : (sgn > 0 ? 270 : 90), look: 'ladder' }); return; }
    const run = r2(Math.max(5.25, o.rise * 1.5)), a = along(o.mid), foot = pt(a, r2(lineM + sgn * run)), head = pt(a, r2(lineM - sgn * 0.4));
    GO.push({ k: 'ramp', x0: foot.x, z0: foot.z, x1: head.x, z1: head.z, w: r2((o.wide || 1) * C), h0: o.lo.base, h1: o.hi.base, stairs: true, model: STAIRM[o.hi.d] || 'concrete', edge: 0.15 });
    o.run = run; });

/* ── THE POOL: a block of `w` squares is one sheet of water at its plot's level, waded ── */
const WATER = [];
{ const used = new Uint8Array(W * Hh), isW = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] === 'w';
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (!isW(x, y) || used[y * W + x]) continue; const p = plotAt(x, y);
      let w = 1; while (isW(x + w, y) && !used[y * W + x + w]) w++;
      let h = 1; rows: while (y + h < Hh) { for (let i = 0; i < w; i++) if (!isW(x + i, y + h) || used[(y + h) * W + x + i]) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
      WATER.push({ k: 'stream', pts: h >= w ? [[r2(gx(x) + w * C / 2), gz(y)], [r2(gx(x) + w * C / 2), gz(y + h)]] : [[gx(x), r2(gz(y) + h * C / 2)], [gx(x + w), r2(gz(y) + h * C / 2)]], w: (h >= w ? w : h) * C, y: r2(p.base - 0.3), depth: 0.6 }); count.pools = (count.pools || 0) + 1; } }

/* ── THE RAILS: two steel rails along every run of track, 0.14 m high (stepped over) ── */
const RAILS = [];
{ const isJ = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] === 'j';
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { if (!isJ(x, y) || isJ(x - 1, y)) continue; let n = 0; while (isJ(x + n, y)) n++; if (n < 2) continue;
      for (const off of [-0.72, 0.72]) RAILS.push({ k: 'wall', x0: gx(x), z0: r2(gcz(y) + off), x1: gx(x + n), z1: r2(gcz(y) + off), h: 0.14, t: 0.12, key: 'metal' }); } }

/* ── THE LOOK: every district's walls, roof and light (a district file's `look`, one plot's in its `looks`).
     wall / tint / gain   the sheet lining every rock face of the plot's open squares, floor to roof
     band                 a painted band along every wall at 1.05 m (the district's colour: how you know where you are)
     ceil / ceilTint / ceilGain   the roof slab's sheet (a sheet under a tint reads dark down here: gain lifts it)
     light                the colour of the drawn strip lights under the roof (they glow; the room's own ambient light does the lighting)
     every                a strip light every N open squares (3) ── */
const U = n => 'urban:' + n;
const LOOK0 = { wall: U('ConcreteStriped1c'), tint: 0xb8bcc0, gain: 1.9, band: 0x8a8f98, ceil: U('ConcreteStriped2e'), ceilTint: 0x8a9096, ceilGain: 1.6, light: 0xdfe8ff, every: 3 };
const lookOf = p => Object.assign({}, LOOK0, (DISTRICTS[p.d] && DISTRICTS[p.d].look) || {}, ((DISTRICTS[p.d] && DISTRICTS[p.d].looks) || {})[p.id] || {});
const TOPS = {}; PLAN.plots.forEach(p => { TOPS[p.id] = topOf(p); });
PLAN.plots.forEach(p => { const L = lookOf(p), top = TOPS[p.id], H = r2(top - p.base), mine = [], add = q => { mine.push(q); PARTS.push(q); };
    /* the roof: one slab a plot, seen from under only (the camera looks down through it) */
    add({ s: 'box', p: [r2(gx(p.sx) + N * C / 2), r2(top + 0.02), r2(gz(p.sy) + N * C / 2)], size: [N * C, 0.2, N * C], sides: false, top: false, under: true, key: L.ceil, tint: L.ceilTint, uv: 3.5, gain: L.ceilGain });
    /* the lining + the band: along every run of rock beside the plot's open squares */
    const face = (horiz, at, a0, out) => { let run = 0; for (let i = 0; i <= N; i++) { const lx = horiz ? a0 + i : at, ly = horiz ? at : a0 + i, here = i < N && open(p.sx + lx, p.sy + ly) && !open(p.sx + lx + (horiz ? 0 : out), p.sy + ly + (horiz ? out : 0));
            if (here) { run++; continue; } if (!run) continue;
            const s0 = i - run, Lm = run * C, mid = (horiz ? gx(p.sx + s0) : gz(p.sy + s0)) + Lm / 2, edge = horiz ? gz(p.sy + at + (out > 0 ? 1 : 0)) : gx(p.sx + at + (out > 0 ? 1 : 0)), inw = -out;
            const at3 = (off, y) => horiz ? [r2(mid), y, r2(edge + inw * off)] : [r2(edge + inw * off), y, r2(mid)], sz = (t, hh) => horiz ? [r2(Lm), hh, t] : [t, hh, r2(Lm)];
            const lin = { s: 'box', p: at3(0.04, p.base), size: sz(0.06, H), key: L.wall, tint: L.tint, uv: [3.5, 1.75], top: false }; if (L.gain && L.gain !== 1) lin.gain = L.gain; add(lin);
            if (L.band != null) add({ s: 'box', p: at3(0.08, r2(p.base + 1.05)), size: sz(0.03, 0.16), tint: L.band, top: false });
            count.lining = (count.lining || 0) + 1; run = 0; } };
    for (let ly = 0; ly < N; ly++) { face(true, ly, 0, -1); face(true, ly, 0, 1); }
    for (let lx = 0; lx < N; lx++) { face(false, lx, 0, -1); face(false, lx, 0, 1); }
    /* the strip lights: one under the roof over every `every`-th open square, along the plot's longer open run there */
    if (L.light != null) for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { if (!open(p.sx + lx, p.sy + ly) || (lx + 2 * ly + p.x + p.y) % (L.every || 3)) continue;
        const ew = open(p.sx + lx - 1, p.sy + ly) && open(p.sx + lx + 1, p.sy + ly);
        add({ s: 'box', p: [gcx(p.sx + lx), r2(top - 0.1), gcz(p.sy + ly)], size: ew ? [1.5, 0.08, 0.28] : [0.28, 0.08, 1.5], tint: L.light, glow: 1 }); count.strips = (count.strips || 0) + 1; }
    /* the curtain: where the plot's roof stands over an open neighbour's, a wall from that roof up to this one, over the open squares of the line */
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const qx = p.x + dx, qy = p.y + dy; if (qx < 0 || qy < 0 || qx >= GX || qy >= GY) continue; const q = Pxy(qx, qy), qt = TOPS[q.id]; if (qt >= top - 0.05) continue;
        let run = 0; for (let i = 0; i <= N; i++) { const lx = dx ? (dx > 0 ? N - 1 : 0) : i, ly = dy ? (dy > 0 ? N - 1 : 0) : i, here = i < N && open(p.sx + lx, p.sy + ly) && open(p.sx + lx + dx, p.sy + ly + dy);
            if (here) { run++; continue; } if (!run) continue; const s0 = i - run, Lm = run * C, lineM = dx ? gx(p.sx + (dx > 0 ? N : 0)) : gz(p.sy + (dy > 0 ? N : 0)), mid = (dx ? gz(p.sy + s0) : gx(p.sx + s0)) + Lm / 2;
            add({ s: 'box', p: dx ? [r2(lineM - dx * 0.1), qt, r2(mid)] : [r2(mid), qt, r2(lineM - dy * 0.1)], size: dx ? [0.2, r2(top - qt), r2(Lm)] : [r2(Lm), r2(top - qt), 0.2], key: L.wall, tint: L.tint, uv: [3.5, 1.75], top: false, under: true, gain: L.gain }); run = 0; } }
});

/* ── THE DRAWN PARTS: one `arch` row a plot (a row is drawn with the plot chunk it stands in), its parts measured from the plot's middle and floor ── */
const ARCH = [];
{ const by = {}; PARTS.forEach(q => { const sx = Math.floor((q.p[0] + HX) / C), sy = Math.floor((q.p[2] + HZ) / C), p = plotAt(sx, sy); (by[p.id] = by[p.id] || []).push(q); });
  PLAN.plots.forEach(p => { const l = by[p.id]; if (!l) return; const ox = r2(gx(p.sx) + N * C / 2), oz = r2(gz(p.sy) + N * C / 2);
      ARCH.push({ k: 'arch', id: 'dumb:' + p.id + ':in', x: ox, z: oz, rot: 0, y: p.base /* `y`, never `base`: without it the row stands on the ground under its ORIGIN (the Hub's is the Tower's top) */, parts: l.map(q => Object.assign({}, q, { p: [r2(q.p[0] - ox), r2(q.p[1] - p.base), r2(q.p[2] - oz)] })) }); });
  count.parts = PARTS.length; }
const DOORROW = INNER.length ? [{ k: 'texbuilding', id: 'dumb:doors', x: 0, z: 0, y: 0, w: 2, d: 2, rot: 0, storeys: 1, skin: false, doorsOnly: true, leaf: 'leaf_office', inner: INNER }] : [];

/* ── THE OPEN GROUND: every square that is not rock, as `space` rows (greedy rectangles) ── */
const spaces = [];
{ const used = new Uint8Array(W * Hh);
  for (let cy = 0; cy < Hh; cy++) for (let cx = 0; cx < W; cx++) { if (!open(cx, cy) || used[cy * W + cx]) continue;
      let w = 1; while (cx + w < W && !used[cy * W + cx + w] && open(cx + w, cy)) w++;
      let h = 1; rows: while (cy + h < Hh) { for (let i = 0; i < w; i++) if (used[(cy + h) * W + cx + i] || !open(cx + i, cy + h)) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(cy + j) * W + cx + i] = 1;
      spaces.push({ k: 'space', x: r2(gx(cx) + w * C / 2), z: r2(gz(cy) + h * C / 2), w: w * C, d: h * C }); } }
/* ── THE PAINT: one sheet a square (0 = the room's own concrete); a district's ctx.paint() wins ── */
const FLOORS = { K: { r: U('ConcreteStriped2d'), o: U('ConcreteStriped2d'), f: U('RubberNonSlip5a') }, P: { o: U('ConcreteStriped2d'), j: U('RubberNonSlip5a'), r: U('ConcreteStriped2d'), f: U('TileLinoleum1a') },
    S: { o: U('TileGeneric1a') }, R: { o: U('RubberNonSlip3a'), f: U('TileGeneric2b') }, C: { o: U('TileGeneric4a'), f: U('TileGeneric4a'), w: U('TileMarble1a') } };
/* (the game reads eight sheets a room: these seven + the bunker's marble are the eight; a district's ctx.paint() picks one of them) */
const PAL = [], palOf = s => { let i = PAL.indexOf(s); if (i < 0) { PAL.push(s); i = PAL.length - 1; } return i + 1; }, paint = new Uint8Array(W * Hh);
for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x]; if (ch === 'x') continue; const s = PAINT[x + ':' + y] || (FLOORS[distAt(x, y)] || {})[ch]; paint[y * W + x] = s ? palOf(s) : 0; }
if (PAL.length > 8) throw new Error('the floor paint has ' + PAL.length + ' sheets: the game reads eight (' + PAL.join(', ') + ')');

/* ── checks: every prop key and unit exists; nothing stands in the rock ── */
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); });
npc.forEach(n => { if (!n.clone && RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
props.forEach(p => { const sx = Math.floor((p.x + HX) / C), sy = Math.floor((p.z + HZ) / C); if (!open(sx, sy)) throw new Error(p.key + ' stands in the rock at ' + sx + ',' + sy); });
const SP = [plot['P03-05'].sx + 6, plot['P03-05'].sy + 5];
if (!open(SP[0], SP[1])) throw new Error('the spawn is not open');
const features = spaces.concat(LVL, WATER, GO, RAILS, F, ARCH, DOORROW);
{ let op = 0; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (open(x, y)) op++;
  Object.assign(count, { plots: PLAN.plots.length, openSquares: op, spaces: spaces.length, stairs: GO.filter(g => g.k === 'ramp').length, climbs: GO.filter(g => g.k === 'climb').length, leaves: INNER.length,
      features: features.length, props: props.length, doors: doors.length, natives: npc.length }); }

/* ── the room ── */
const SH = r2(Math.max.apply(null, PLAN.plots.map(p => TOPS[p.id])) + 0.4), SPM = { x: gcx(SP[0]), z: gcz(SP[1]) };
const LINES = [].concat(O.motorpool.l, O.sublevel7.l, O.dreamlab.l, O.clonevats.l, O.warroom.l, O.bunker.l, O.ring.l, O.ward.l), L = [];
L.push("        /* DUMB49-BEGIN — THE D.U.M.B. ON PLOTS (2026-11-16): written by `node bake-dumb.js` from docs/areas/dumb/layout.json + districts/<K P S R C>.js. Never hand-edit between the markers; edit the tool, the layout (docs/plans/world-zones/draw-dumb.js) or a district file and rerun. */");
L.push("        " + ROOM + ": {");
L.push("            label: 'THE D.U.M.B.',");
L.push("            sub: 'LEVEL P3 · SUB-LEVEL 7 · RESEARCH · COMMAND · CERN, THE RING · THE BASE EVERY BASE IS UNDER',");
L.push("            kind: 'box', site: 'prebuilt_dumb', part: '" + PART + "',");
/* THE ONE WORLD (2026-11-17, BUILD_PLAN phase 3 wave B; mondo 11-17: "Connected/bigger rooms is better. If the room is smaller than disaster city
   than dont even ask, just make it one room"): the base stays ONE room, under the city's south-west, its Level P3 on v13's row (dP 5,14): the East
   Gantry stands on world plot 6,16, where the underground walk U5 from the Running Tunnels arrives on its east side (phase 4.4 opens it). */
L.push("            world: { hub: 'dumb', layer: 'under', wx: " + OW.wx + ", wy: " + OW.wy + " },");
L.push("            shell: hqBunkerShell({ w: " + (2 * HX) + ", d: " + (2 * HZ) + ", h: " + SH + ", wallH: " + SH + ", plate: { x: " + SPM.x + ", z: " + SPM.z + ", y: " + r2(plot['P03-05'].base + 3.4) + " },");
L.push("                                   mood: { lamp: 0xff3838, glow: 0xff5040, strip: 0xdfe8ff, light: 0xdfe8ff, ambient: 0.55 }, fog: { color: 0x0c0e12, density: 0.006 } }),");
L.push("            parti: 'A base in a ring: the collider tunnel runs round all of it, the tunnel every base is on runs straight across its south, and one long stair goes down from the tram platform to the hub every department is off.',");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", nx: " + GX + ", nz: " + GY + ", names: " + J(PLAN.plots.map(p => [p.id, p.name, p.d, p.level])) + " },");
L.push("            terrain: {");
L.push("                res: 0.875, floor: 'urban:ConcreteStriped1b', cliff: 'urban:ConcreteStriped1c', path: 'urban:TileGeneric1a',");
L.push("                noise: { amp: 0, scale: 5 }, crag: false,");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gcx(0) + ", z0: " + gcz(0) + ", nx: " + W + ", nz: " + Hh + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                /* every square that is not a `space` is the rock, concrete to the roof */");
L.push("                gen: { kind: 'plan', look: 'walls', wallKey: 'urban:ConcreteStriped1c', rim: 0, forceGrow: -0.3 },");
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
L.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: 0 },");
L.push("        },");
L.push("        /* DUMB49-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));

/* the rows in data.js that hold a place in this room (written by hand there): the tool refuses to bake when one has drifted */
const end = id => { const w = WAY[id]; return "site: 'prebuilt_dumb', part: '" + PART + "', wall: '" + w.wall + "', " + (w.wall === 'free' ? 'x: ' + w.x + ', z: ' + w.z + ', face: ' + w.face : (w.wall === 'n' || w.wall === 's' ? 'x: ' : 'z: ') + w.at) + ','; };
const ent = id => { const w = WAY[id]; return "room: '" + ROOM + "', door: { id: '" + id + "', wall: '" + w.wall + "', " + (w.wall === 'free' ? 'x: ' + w.x + ', z: ' + w.z + ', face: ' + w.face : (w.wall === 'n' || w.wall === 's' ? 'x: ' : 'z: ') + w.at) + ' }'; };
const WANT = ['area51_dumb', 'cave_dumb', 'dumb_astral', 'dumb_internet'].map(k => [end(k), 'link ' + k]).concat([[ent('bay'), 'siteRooms.entry.prebuilt_dumb'], [ent('bay_cern'), 'siteRooms.entry.prebuilt_cern']]);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY && !process.env.DUMB_FIRST) throw new Error('data.js does not point at this room yet (see the rows above)'); }
const END = '        /* DUMB49-END */\n', b0 = src.indexOf('        /* DUMB49-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        site_prebuilt_dumb_motorpool: {'; const a = src.indexOf(anchor); if (a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
/* the room's floor decals: one row in DOOR_HQ.decals */
{ const row = "    " + ROOM + ": " + J(DECALS.slice(0, 60)) + ",   // DUMB49-DECALS: written by bake-dumb.js\n", i0 = src.indexOf("    " + ROOM + ": ["), anchor = "    site_prebuilt_downtown_sewers: [ { kind: 'puddle'";
  if (i0 >= 0 && src.slice(i0, src.indexOf('\n', i0)).indexOf('DUMB49-DECALS') >= 0) src = src.slice(0, i0) + row + src.slice(src.indexOf('\n', i0) + 1);
  else { const a = src.indexOf(anchor); if (a < 0) throw new Error('DOOR_HQ.decals anchor not found'); src = src.slice(0, a) + row + src.slice(a); } }

/* ── THE WALK CHECK: compile the room from the text about to be written and walk it from the spawn on the walker's own rule (hqTerrainFeet).
   Every plot must be reached, and every way out's landing. ── */
if (process.env.DUMB_NOWALK) { if (!DRY) { fs.writeFileSync(file, src); console.log('data.js: the D.U.M.B. written, NOT walked (DUMB_NOWALK: a merge in a hurry; bake once more without it)'); } process.exit(0); }
const tmp = path.join(require('os').tmpdir(), 'ew-dumb-' + process.pid + '.js'); fs.writeFileSync(tmp, src);
let bad = 0;
try {
    const D2 = require('./load-data.js').loadGameData({ quiet: true, file: tmp });
    const res = JSON.parse(vm.runInContext(`(function () { var info = hqTerrainInfo('${ROOM}'), R = info.rules, S = ${JSON.stringify(SPM)}, st = 0.875, seen = {}, q = [], out = { n: 0, plots: {}, map: {} };
        var y0 = hqTerrainFeet(info, S.x, S.z, null); if (y0 == null) return JSON.stringify({ err: 'the spawn is not walked' });
        var key = function (x, z, y) { return Math.round(x / st) + ',' + Math.round(z / st) + ',' + Math.round(y / 1.75); };
        var climbs = (info.climbs || []);
        q.push([S.x, S.z, y0]); seen[key(S.x, S.z, y0)] = 1;
        while (q.length) { var c = q.pop(); out.n++; var px = Math.floor((c[0] + ${HX}) / ${N * C}), pz = Math.floor((c[1] + ${HZ}) / ${N * C}); out.plots[px + ',' + pz] = 1; out.map[Math.floor((c[0] + ${HX}) / ${C}) + ',' + Math.floor((c[1] + ${HZ}) / ${C})] = 1;
            [[st, 0], [-st, 0], [0, st], [0, -st]].forEach(function (d) { var x = c[0] + d[0], z = c[1] + d[1], y = hqTerrainFeet(info, x, z, c[2]);
                if (y == null || y - c[2] > R.climb + 0.01) return; var k = key(x, z, y); if (seen[k]) return; seen[k] = 1; q.push([x, z, y]); }); }
        var near = function (p) { for (var i = -3; i <= 3; i++) for (var j = -3; j <= 3; j++) if (seen[key(p[0] + i * st, p[1] + j * st, p[2])]) return true; return false; };
        out.pads = (info.pads || []).map(function (p) { return [p.door && (p.door.id || p.door.link), near([p.x, p.z, p.h]), Math.round(p.h * 100) / 100]; });
        out.climbKeys = Object.keys(info).filter(function (k) { return /climb|ladder/i.test(k); });
        return JSON.stringify(out); })()`, D2));
    if (res.err) { console.log(res.err); bad++; }
    else { const cold = PLAN.plots.filter(p => !res.plots[p.x + ',' + p.y]).map(p => p.id + ' ' + p.name), padMiss = res.pads.filter(p => !p[1]).map(p => p[0]);
        /* the Vent is a ladder: the walk here does not climb, so Level -6 and the ring are both reached on foot or the check fails */
        console.log('walked ' + res.n + ' spots · plots reached ' + (PLAN.plots.length - cold.length) + '/' + PLAN.plots.length + (cold.length ? ' · NOT REACHED: ' + cold.join(' · ') : '') + ' · ways ' + JSON.stringify(res.pads));
        if (process.env.DUMB_DUMP) console.log(cell.map((r, y) => r.map((ch, x) => ch === 'x' ? ' ' : res.map[x + ',' + y] ? ch : '!').join('')).join('\n'));
        bad += cold.length + padMiss.length; }
} finally { fs.unlinkSync(tmp); }
if (bad) { console.error('the walk check failed (' + bad + ')'); if (!process.env.DUMB_FORCE) process.exit(1); }
if (DRY) process.exit(0);
fs.writeFileSync(file, src);
console.log('data.js: the D.U.M.B. written (' + block.length + ' bytes)');
