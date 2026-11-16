#!/usr/bin/env node
/* bake-antarctica.js — ANTARCTICA ON PLOTS (2026-11-16, second side, the Antarctica zone thread; mondo 11-16: the eight zones still on old
   handmade rooms go on plots as a full REDESIGN, without waiting for his OK; docs/plans/ZONE_THREAD_BRIEF.md).
   6 x 6 plots of 12 x 12 squares (252 m a side), six districts, south to north one idea a row:
   THE SHELF ICE (F, the sea) · THE STATION (S) with THE POLAR OPENINGS (O) either side · THE CREVASSE (C) · THE ICE WALL (W) · THE HULL IN THE ICE (H).
   Reads docs/areas/antarctica/layout.json (written by docs/plans/world-zones/draw-antarctica.js: every plot's name, district, level, the 72 x 72
   square map) and writes the room `site_prebuilt_antarctica_plots` into data.js between ANTARCTICA36-BEGIN / ANTARCTICA36-END.
   `node bake-antarctica.js` writes; `--dry-run` prints the counts; `ANT_DUMP=1` prints the walked map. Never hand-edit between the markers.
   Notes: docs/notes/areas-complexes.md "ANTARCTICA ON PLOTS" + "ANTARCTICA, THE ZONE KIT".
   THE DISTRICT FILES: what stands in a district is written in docs/areas/antarctica/districts/<H W C S O F>.js, one thread a file. This tool keeps
   what is shared: the plan, the heights (the wall, the ridges, the crevasse, the sea), the paint, the open ground, the ways out, the sky, the checks.
   THE MASS: the plan's `x` (the Ice Wall), `r` (ice ridge), `k` (deep drift), `a` (the crevasse), `z` (the sea), `h` (the hull) are not walked;
   their shape is the HEIGHT sheet (terrain.slope.cells), the Mountains' way: no gen wall stands anywhere.
   Squares are (sx 0..72 west to east, sy 0..72 north to south); gx() = a square's west / north line in metres, gc() = its middle. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/antarctica/layout.json'), 'utf8')).rooms[0];
const C = 3.5, N = 12, G = 6, W = N * G, PL = N * C, HALF = W * C / 2, LEVEL = 1.75, ROOM = 'site_prebuilt_antarctica_plots', OLD = 'site_prebuilt_antarctica_station';
const WALL_H = 35, CRACK = 15, SEA_BED = -5;   // THE CRACK STAYS OVER THE SEA: the room's sea (terrain.sea, y 0) fills every hollow under 0, so the crevasse's lip (level 10 = 17.5 m) is higher than it is deep (seen 11-16: the first build's crack was full of sea)
const r2 = v => Math.round(v * 100) / 100, gx = c => r2(-HALF + c * C), gc = c => r2(-HALF + (c + 0.5) * C);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
/* the old Station's people keep their own lines: read from the old literal (so it must stay in data.js; it is a PvP board source too) */
const O_ST = JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [], d: r.doors || [] } : { n: [], l: [], d: [] })(DOOR_HQ.rooms.' + OLD + '))', D));
const sayOf = (race, i) => (O_ST.n.filter(n => n.race === race)[i || 0] || {}).say;
const cell = PLAN.cells.map(r => r.split(''));
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); if (!'HWCSOF'.includes(p.d)) throw new Error('district? ' + p.id); plot[p.id] = p; });
const Pxy = (x, y) => plot['P0' + Math.max(0, Math.min(G - 1, x)) + '-0' + Math.max(0, Math.min(G - 1, y))];
const distAt = (x, y) => Pxy(Math.floor(x / N), Math.floor(y / N)).d;
const MASS = { x: 1, r: 1, k: 1, a: 1, z: 1, h: 1 };
const F = [], props = [], doors = [], npc = [], ARCH = [], flats = [], count = {}, taken = new Set();
const feat = o => { F.push(o); return o; };
const setRect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ch; };
const inR = (x, y) => x >= 0 && y >= 0 && x < W && y < W, open = (x, y) => inR(x, y) && !MASS[cell[y][x]];

/* ── THE BUILDINGS (the city's way, the Estate's helper): a hollow `texbuilding` (the walls you bump, the doorway, the swinging leaf, the inside)
   with its own outside switched off + its look as an `arch` parts list. Parts frame: the building's middle, x along the front, +z out of the
   front, y up. Squares x0..x1 x y0..y1 (the end is exclusive), `side` = the wall its front is on. ── */
const U = n => 'urban:' + n, WD = U('WoodGeneric1b'), WD2 = U('WoodGeneric1a'), FLR = U('WoodFlooring1d'), GLS = U('GlassWindowTall1a'), COR = U('MetalCorrugated1a');
const ROT = { S: 0, W: 90, N: 180, E: 270 };
function sheet() {
    const P = [];
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); P.push(o); return o; };
    const A = { P,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, o),
        quad: (x, y, z, w, h, ry, key, tint, o) => add({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h)], ry: ry || 0 }, key, tint, o),
        /* a roof is drawn from outside only: one sheet facing down under it */
        roof: (form, x, y, z, w, h, d, key, tint, o) => { add({ s: 'box', p: [x, y, z], size: [w, 0.02, d], sides: false, top: false, under: true, roof: true, ry: (o && o.ry) || 0 }, COR, 0x8a8f96);
            return add({ s: 'roof', form, p: [x, y, z], size: [w, h, d], roof: true }, key, tint, o); },
        shell(w, h, d, key, tint, door, uv, ex) { const e = 0.05, Wd = w + 2 * e, Dp = d + 2 * e, x = Object.assign(uv ? { uv } : {}, ex || {});
            add({ s: 'box', p: [0, 0, 0], size: [Wd, h, Dp], top: false, faces: 'blr' }, key, tint, x);
            add({ s: 'quad', p: [0, 0, r2(Dp / 2)], size: [Wd, h], ry: 0, hole: [r2(door.lx), r2(door.cw), 2.2] }, key, tint, x); },
        frame(door, d, key, tint) { A.box(door.lx - door.cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, key, tint); A.box(door.lx + door.cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, key, tint); A.box(door.lx, 2.25, d / 2 + 0.1, door.cw + 0.5, 0.2, 0.2, key, tint); },
        /* a painted sign board: the words in a typeface (three-renderer.js HQ_SIGN_FONTS) */
        sign(words, x, y, z, w, h, fg, bg, font, o) { P.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], key: 'txt:' + words + '|' + fg + '|' + bg + '|' + r2(w / h) + '||' + font, uv: 'fit', kind: 'wall' }, o || {})); } };
    return A;
}
function texbDoor(w, door) { const L = Math.max(2, w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (door >= 1) col = Math.min(cols - 1, Math.round(door) - 1); return { lx: -L / 2 + (col + 0.5) * cw, cw }; }
const BUILT = {};   // every building's handle by its id
function building(id, q, h, o, parts) {
    const [sx0, sy0, sx1, sy1, side] = q, ew = side === 'E' || side === 'W', fw = (ew ? sy1 - sy0 : sx1 - sx0) * C, fd = (ew ? sx1 - sx0 : sy1 - sy0) * C, cx = gx((sx0 + sx1) / 2), cz = gx((sy0 + sy1) / 2), rot = ROT[side];
    const row = Object.assign({ k: 'texbuilding', id: 'ant:' + id, seed: 1, x: cx, z: cz, w: fw, d: fd, rot, storeys: Math.max(1, Math.floor(h / 3.5 + 0.01)), h, skin: false, hollow: true, leaf: 'leaf_bulkhead', leafDouble: false, keyIn: COR, floorIn: FLR }, o || {});
    Object.keys(row).forEach(k => { if (row[k] === undefined) delete row[k]; });
    feat(row); setRect(sx0, sy0, sx1, sy1, 'B'); flats.push([sx0, sy0, sx1, sy1]);
    for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) taken.add(x + ':' + y);
    const a = sheet(), door = texbDoor(fw, row.door); parts(a, fw, fd, door);
    ARCH.push({ k: 'arch', id: 'ant:' + id + ':look', x: cx, z: cz, rot, parts: a.P });
    const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    count.buildings = (count.buildings || 0) + 1;
    return (BUILT[id] = { at: (lx, lz) => [r2(cx + lx * c - lz * s), r2(cz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd, door, cx, cz, rot });
}
const put = (B, key, lx, lz, o) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, o || {}); if (r.face != null) r.face = B.face(r.face); props.push(r); };   // `face` in the building's frame
/* ── THE DRAWN PIECES (arch rows on open ground: walked under or round) ── */
function look(id, x, z, rot, fn) { const a = sheet(); fn(a); ARCH.push({ k: 'arch', id: 'ant:' + id + ':look', x: r2(x), z: r2(z), rot: rot || 0, parts: a.P }); }

/* ── placing things: a blocker on a square's middle (P), decor off it (dec), people (native); never in the mass, never two on one square ── */
const errs = [], strays = [];
let curD = null;
function spot(sx, sy, what, shared) { if (!inR(sx, sy)) { errs.push(what + ' is off the map at ' + sx + ',' + sy); return; } if (curD && distAt(sx, sy) !== curD) strays.push(curD + ': ' + what + ' at ' + sx + ',' + sy + ' (' + distAt(sx, sy) + ')');
    if (MASS[cell[sy][sx]] && !shared) { errs.push(what + ' stands in the mass (' + cell[sy][sx] + ') at ' + sx + ',' + sy); return; }
    if (!shared) { if (taken.has(sx + ':' + sy)) errs.push(what + ': square ' + sx + ',' + sy + ' is taken'); taken.add(sx + ':' + sy); } }
const P = (key, sx, sy, o) => { spot(sx, sy, key); props.push(Object.assign({ key, x: gc(sx), z: gc(sy) }, o || {})); };
const decWith = rnd => (key, sx, sy, o) => { spot(sx, sy, key, true); props.push(Object.assign({ key, x: r2(gc(sx) + (rnd() - 0.5) * 1.6), z: r2(gc(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); };
const native = (race, sx, sy, face, say) => { spot(sx, sy, race); if (cell[sy][sx] === 'p') errs.push(race + ' stands on a track at ' + sx + ',' + sy); const n = { x: gc(sx), z: gc(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); };

/* ── THE DISTRICT FILES: docs/areas/antarctica/districts/<LETTER>.js. A file may export any of the stages below (each called with that
   district's own ctx: the helpers above + its own dice) and `airZones(ctx)`. A stage runs for every district that has it, by letter. ── */
const STAGES = ['plan', 'houses', 'pieces', 'dress'];
const LETTERS = ['C', 'F', 'H', 'O', 'S', 'W'];
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const DISTRICTS = (() => { const dir = path.join(REPO, 'docs/areas/antarctica/districts'), o = {}; fs.readdirSync(dir).filter(f => /^[A-Z]\.js$/.test(f)).sort().forEach(f => { o[f[0]] = require(path.join(dir, f)); }); return o; })();
LETTERS.forEach(k => { if (!DISTRICTS[k]) throw new Error('district file missing: docs/areas/antarctica/districts/' + k + '.js'); });
/* the height of the walked ground at a square's middle, in metres over the sea (a district's props that hang or stand high add it: UP) */
const LV = (x, y) => Pxy(x, y).level * LEVEL;
function ground(xm, zm) {
    const px = (xm + HALF) / PL - 0.5, pz = (zm + HALF) / PL - 0.5, i = Math.max(0, Math.min(G - 2, Math.floor(px))), j = Math.max(0, Math.min(G - 2, Math.floor(pz)));
    const t = v => Math.min(1, Math.max(0, (v - 1 / 6) / (2 / 3))), u = t(px - i), v = t(pz - j);
    return (LV(i, j) * (1 - u) + LV(i + 1, j) * u) * (1 - v) + (LV(i, j + 1) * (1 - u) + LV(i + 1, j + 1) * u) * v;
}
const CTX = {};
Object.keys(DISTRICTS).forEach(k => { const rnd = mkRnd(7919 * k.charCodeAt(0));
    CTX[k] = { d: k, C, N, G, W, HALF, LEVEL, WALL_H, gx, gc, r2, PLAN, plot, cell, setRect, open, inR, distAt, feat, props, npc, taken, building, put, look, sheet,
        U, WD, WD2, FLR, GLS, COR, P, dec: decWith(rnd), native, rnd, flat: (x0, y0, x1, y1) => { flats.push([x0, y0, x1, y1]); }, sayOf, O_ST, BUILT,
        groundAt: (sx, sy) => r2(ground(gc(sx), gc(sy))) }; });
const run = stage => Object.keys(DISTRICTS).forEach(k => { const m = DISTRICTS[k]; if (m && typeof m[stage] === 'function') { curD = k; try { m[stage](CTX[k]); } finally { curD = null; } } });

run('plan');      // what a district adds to the plan's squares

/* ── THE WAYS (all four were in the game before; the far ends are the links' own) ── */
/* THE COLLAR: the Spaceship's airlock, on the room's north wall at the end of the slot in the hull (link `antarctica_derelict`, end a) */
const COLLAR_X = gx(37);
/* THE ADMIRAL'S TUNNEL (west wall, link `antarctica_polar` end a) and THE POLAR OPENING (east wall, link `hollow_byrd` end b): a cut through the rim ridge */
for (const y of [40, 41]) for (const x of [0, 1, 2]) cell[y][x] = 'p';
for (const y of [39, 40]) for (const x of [68, 69, 70, 71]) cell[y][x] = 'i';
const TUNNEL_Z = gx(41), OPENING_Z = gx(40);
/* DOOR HQ's bay door (door 90S): a door standing in the snow on the Station Yard (data.js siteRooms.entry.prebuilt_antarctica) */
const BAY = { x: gx(33), z: gc(52), face: 0 };
[[32, 52], [33, 52], [32, 53], [33, 53], [36, 5], [37, 5], [36, 4], [37, 4], [2, 40], [2, 41], [68, 39], [68, 40]].forEach(q => taken.add(q[0] + ':' + q[1]));

run('houses');    // THE BUILDINGS
run('pieces');    // THE DRAWN PIECES
run('dress');     // every district's dressing, people and animals

if (strays.length) console.log('pieces a district stood on another district\'s squares (ask that district\'s thread):\n  ' + strays.join('\n  '));
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));

/* ── THE HEIGHTS: one height a plot (layout `level`, 1 = 1.75 m over the sea), flat over the plot's middle four squares, a straight grade over the
   eight squares to the next plot's middle. Then the mass: a corner whose four squares are all one kind of mass takes that kind's shape.
   · x THE ICE WALL: sheer, 35 m over its foot in two squares, a broken crest · r ICE RIDGE: 4 to 11 m, jagged · k DEEP DRIFT: a soft swell
   · a THE CREVASSE: a slot 15 m down · z THE SEA: its bed (the shelf's edge stays up: an ice foot 1.75 m over the water) · h THE HULL: level (the hull is drawn).
   Under and round each building the ground is levelled. ── */
const vnoise = (x, y, s) => { const h = (a, b) => { const t = Math.sin(a * 127.1 + b * 311.7 + s * 74.7) * 43758.5453; return t - Math.floor(t); };
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v; };
const distOf = ch => { const d = new Int16Array(W * W).fill(-1), q = [];
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (cell[y][x] !== ch) { d[y * W + x] = 0; q.push(x, y); }
    for (let i = 0; i < q.length; i += 2) { const x = q[i], y = q[i + 1], v = d[y * W + x]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (inR(X, Y) && d[Y * W + X] < 0) { d[Y * W + X] = v + 1; q.push(X, Y); } } }
    return d; };
const dX = distOf('x'), dRr = distOf('r'), dK = distOf('k');
const Hc = new Float32Array((W + 1) * (W + 1));
for (let cy = 0; cy <= W; cy++) for (let cx = 0; cx <= W; cx++) {
    let h = ground(gx(cx), gx(cy)); const n = {}; let cnt = 0, dmin = { x: 99, r: 99, k: 99 }, massAll = true;
    for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const x = Math.max(0, Math.min(W - 1, cx + dx)), y = Math.max(0, Math.min(W - 1, cy + dy)), ch = cell[y][x]; n[ch] = (n[ch] || 0) + 1; cnt++;
        if (!MASS[ch]) massAll = false; if (ch === 'x') dmin.x = Math.min(dmin.x, dX[y * W + x]); if (ch === 'r') dmin.r = Math.min(dmin.r, dRr[y * W + x]); if (ch === 'k') dmin.k = Math.min(dmin.k, dK[y * W + x]); }
    const nz = vnoise(cx / 4.2, cy / 4.2, 3) * 0.6 + vnoise(cx / 1.6, cy / 1.6, 9) * 0.4;
    if (n.x === cnt) h += Math.min(WALL_H, 20 * dmin.x - 2) * (0.9 + 0.2 * nz);
    else if (n.a === cnt) h -= CRACK * (0.85 + 0.3 * nz);
    else if (n.z === cnt) h = SEA_BED;
    else if (n.k === cnt) h += Math.min(2.6, 1.3 * dmin.k) * (0.7 + 0.6 * nz);
    else if (n.h === cnt) h += 0;
    else if (massAll && (n.r || n.x)) h += n.x ? 9 * (0.7 + 0.6 * nz) : Math.min(11, 4.5 * Math.min(dmin.r, 3)) * (0.55 + 0.9 * nz);   // a ridge; where a ridge meets the wall, the wall's foot
    Hc[cy * (W + 1) + cx] = h;
}
flats.forEach(([x0, y0, x1, y1]) => { const ref = ground(gx((x0 + x1) / 2), gx((y0 + y1) / 2));
    for (let y = Math.max(0, y0 - 3); y <= Math.min(W, y1 + 3); y++) for (let x = Math.max(0, x0 - 3); x <= Math.min(W, x1 + 3); x++) {
        const d = Math.max(x0 - 1 - x, x - x1 - 1, y0 - 1 - y, y - y1 - 1, 0), w = Math.max(0, 1 - d / 2), k = y * (W + 1) + x; Hc[k] = Hc[k] * (1 - w) + ref * w; } });
const slope = Buffer.alloc(W * W * 8);
for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) { const o = (cy * W + cx) * 8;
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((q, k) => slope.writeInt16LE(Math.round(Hc[(cy + q[1]) * (W + 1) + cx + q[0]] * 100), o + k * 2)); }

/* ── THE OPEN GROUND: every square that is not mass, as `space` rows (greedy rectangles) ── */
const spaces = [];
{ const used = new Uint8Array(W * W);
  for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) { if (!open(cx, cy) || used[cy * W + cx]) continue;
      let w = 1; while (cx + w < W && !used[cy * W + cx + w] && open(cx + w, cy)) w++;
      let h = 1; rows: while (cy + h < W) { for (let i = 0; i < w; i++) if (used[(cy + h) * W + cx + i] || !open(cx + i, cy + h)) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(cy + j) * W + cx + i] = 1;
      spaces.push({ k: 'space', x: r2(gx(cx) + w * C / 2), z: r2(gx(cy) + h * C / 2), w: w * C, d: h * C }); } }
/* ── THE PAINT: one sheet a square (0 = the room's own snow) ── */
const PAL = ['ice_1', 'igloo', 'wood_planks', 'obsidian', 'urban:MetalCorrugated1a'], paint = new Uint8Array(W * W);
for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x];
    paint[y * W + x] = (ch === 'i' || ch === 'x' || ch === 'r' || ch === 'a' || ch === 'z' || ch === 'p') ? 1 :   /* a track is ice the sledges polished (`igloo`, the pal's second sheet, read as brick paving on screen: not used) */
         (ch === 'b' || ch === 'B') ? 3 : ch === 'f' ? (distAt(x, y) === 'H' ? 5 : 3) : ch === 'h' ? 4 : 0; }

/* ── checks: every prop key and unit exists; every plot is walked to from the spawn with no step steeper than the walker climbs ── */
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); });
npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
const SP = [31, 54];
{ const hC = (x, y) => (Hc[y * (W + 1) + x] + Hc[y * (W + 1) + x + 1] + Hc[(y + 1) * (W + 1) + x] + Hc[(y + 1) * (W + 1) + x + 1]) / 4;
  const seen = new Uint8Array(W * W), st = [SP]; if (!open(SP[0], SP[1])) throw new Error('the spawn is not open'); seen[SP[1] * W + SP[0]] = 1; let steep = 0;
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!open(X, Y) || seen[Y * W + X]) continue;
      if (Math.abs(hC(X, Y) - hC(x, y)) / C > 0.85) { steep++; continue; } seen[Y * W + X] = 1; st.push([X, Y]); } }
  const cold = PLAN.plots.filter(p => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.y * N + ly) * W + p.x * N + lx]) return false; return true; }).map(p => p.id);
  if (process.env.ANT_DUMP) console.log(cell.map((r, y) => r.map((ch, x) => open(x, y) && !seen[y * W + x] ? '!' : MASS[ch] ? (ch === 's' ? ' ' : ch.toUpperCase()) : ch === 's' ? ' ' : ch).join('')).join('\n'));
  if (cold.length) throw new Error('plots not reached on foot: ' + cold.join(' '));
  for (const q of [[36, 0], [0, 40], [71, 39], [32, 52]]) if (!seen[q[1] * W + q[0]]) throw new Error('a way out is not reached on foot: square ' + q);
  let op = 0, un = 0; for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (open(x, y)) { op++; if (!seen[y * W + x]) un++; }
  Object.assign(count, { openSquares: op, unreachedSquares: un, steepSteps: steep }); }
Object.assign(count, { spaces: spaces.length, features: F.length + ARCH.length, props: props.length, natives: npc.length });

/* THE AIR BY DISTRICT (the Estate's way, three-renderer.js _hqBuildAtmos `shell.atmos.zones`): a district file may export `airZones(ctx)` =
   [{ sx0, sy0, sx1, sy1 (its own squares, the end exclusive), kind, color, n, speed, wind }]. With no zone from any file the room's air is the
   site's own (data.js HQ_ATMOS_SITES.prebuilt_antarctica: snow on the wind). With one, that snow is kept as a last zone over the whole room. */
const AIR = [].concat(...Object.keys(DISTRICTS).filter(k => typeof DISTRICTS[k].airZones === 'function').map(k => (DISTRICTS[k].airZones(CTX[k]) || []).map(z => { const q = Object.assign({}, z, { x0: gx(z.sx0), z0: gx(z.sy0), x1: gx(z.sx1), z1: gx(z.sy1) });
    delete q.sx0; delete q.sy0; delete q.sx1; delete q.sy1; return q; })));
const ATMOS = AIR.length ? " atmos: " + J({ kind: 'snow', wind: 1.6, zones: AIR.concat([{ x0: -HALF, z0: -HALF, x1: HALF, z1: HALF, kind: 'snow', wind: 1.6 }]) }) + "," : "";
/* a district file may export `encounters` (a table row for the room: the Mountains' way); none does in the first build (the tables are mondo's) */

/* ── the room ── */
const SPM = { x: gx(SP[0]), z: gc(SP[1]) }, L = [];
L.push("        /* ANTARCTICA36-BEGIN — ANTARCTICA ON PLOTS (2026-11-16): written by `node bake-antarctica.js` from docs/areas/antarctica/layout.json + districts/*.js. Never hand-edit between the markers; edit the tool, the layout or a district file and rerun. */");
L.push("        " + ROOM + ": {");
L.push("            label: 'ANTARCTICA',");
L.push("            sub: 'THE SHELF ICE · THE STATION · THE CREVASSE · THE ICE WALL · THE HULL IN THE ICE',");
L.push("            kind: 'box', site: 'prebuilt_antarctica', part: 'plots',");
L.push("            shell: hqAncientShell({ w: " + (2 * HALF) + ", d: " + (2 * HALF) + ", h: 20, wallH: 20, floor: 'ice', apron: 'ice', skirt: 'ice_1', apronColor: 0xeef4ff, floorColor: 0xeef4ff, plate: { x: " + SPM.x + ", z: " + SPM.z + ", y: 5.0 }," + ATMOS + "\n" +
    "                                    mood: { lamp: 0xffb060, glow: 0xff9a40, strip: 0xffd8a0, light: 0xf0f6ff, ambient: 0.62 },\n" +
    "                                    sky: { night: 0, world: { kind: 'plain', ground: 'ice', groundColor: 0xe8f0ff }, tint: 0xa8c8ea, tintAmt: 0.35, stars: 0.5, nebula: 0.7, day: 1, clouds: 0.45, fog: { color: 0xd4e4f2, amount: 0.5, top: 0.05, band: 0.5, density: 0.006 }, scenery: 'none' },\n" +
    "                                    look: HQ_ROOM_LOOKS.white }),");
L.push("            parti: 'The frozen end of the world on thirty-six plots, walked south to north: the sea and the shelf ice, a station on its pads, a crevasse right across the traverse, a wall of ice with one cut through it, and behind the wall a hull nobody drilled for.',");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + G + ", names: " + J(PLAN.plots.map(p => [p.id, p.name.replace(' (label mine)', ''), p.d, p.level])) + " },");
L.push("            terrain: {");
L.push("                res: 1.75, floor: 'ice', cliff: 'ice_1', path: 'ice_1',   // half a square a node (the Mountains' grain)");
L.push("                noise: { amp: 0.08, scale: 8 },");
L.push("                sea: { y: 0, key: 'water' },");
L.push("                backdrop: false, edges: { reach: 440, n: { kind: 'mountain' }, w: { kind: 'mountain' }, e: { kind: 'mountain' }, s: { kind: 'coast' } },");
L.push("                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gx(0) + ", nx: " + W + ", nz: " + W + ", d: '" + slope.toString('base64') + "' } },");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gc(0) + ", z0: " + gc(0) + ", nx: " + W + ", nz: " + W + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                /* THE MASS IS THE HEIGHT SHEET: every square that is not a `space` is wall, ridge, drift, crevasse, sea or hull; no tree stands anywhere */");
L.push("                gen: { kind: 'plan', look: 'trees', seed: 90, rim: 0, forceGrow: 0, treeGap: 2.6, treeIn: 0.9, spacing: 3.5, depth: 5.25, maxTrees: 0, treeH: [5.5, 8.5], kinds: ['pine'], zones: " + J([{ x0: gx(0) - 50, z0: gx(0) - 50, x1: gx(W) + 50, z1: gx(W) + 50, none: true }]) + " },");
L.push("                features: [");
spaces.concat(F, ARCH).forEach(f => L.push("                    " + J(f) + ","));
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
L.push("            lines: " + J(O_ST.l) + ",");
L.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: 0 },");
L.push("        },");
L.push("        /* ANTARCTICA36-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
/* the rows in data.js that name a place in this room (written by hand there): the tool refuses to bake when one has drifted */
const WANT = [
    ["prebuilt_antarctica: { room: '" + ROOM + "', door: { id: 'bay', wall: 'free', x: " + BAY.x + ", z: " + BAY.z + ", face: " + BAY.face + " } }", 'siteRooms.entry.prebuilt_antarctica'],
    ["a: { site: 'prebuilt_antarctica', part: 'plots', wall: 'n', x: " + COLLAR_X + ",", 'link antarctica_derelict'],
    ["a: { site: 'prebuilt_antarctica', part: 'plots', wall: 'w', z: " + TUNNEL_Z + ",", 'link antarctica_polar'],
    ["b: { site: 'prebuilt_antarctica', part: 'plots', wall: 'e', z: " + OPENING_Z + ",", 'link hollow_byrd'],
    [OLD + ": '" + ROOM + "'", 'DOOR_HQ.retired'],
];
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at this room yet (see the rows above)'); }
if (DRY) process.exit(0);
const END = '        /* ANTARCTICA36-END */\n', b0 = src.indexOf('        /* ANTARCTICA36-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        /* MOUNTAINS-BEGIN'; const a = src.indexOf(anchor); if (a < 0) throw new Error('anchor not found in data.js: ' + anchor); src = src.slice(0, a) + block + src.slice(a); }   // the first bake: before the Mountains' block (the old Station has no literal: its room is made from its site row)
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOM + ' written (' + block.length + ' bytes)');
