#!/usr/bin/env node
/* bake-leylines.js — LEYLINES ON PLOTS (2026-11-16, the Leylines zone thread, second side; mondo's order of that day: the zones still on old
   handmade rooms go on plots as a full REDESIGN, docs/plans/ZONE_THREAD_BRIEF.md). One room, 9 x 7 plots of 12 x 12 squares (378 x 294 m), six
   districts on ONE dead-straight glowing line: G GOBEKLI TEPE (9 plots), B BUG COLONY (9, new), S STONEHENGE (9), Y THE LEY LINE (9),
   T BABEL (12), Z TECHNOTICLAN (15, an island city in a lake).
   Reads docs/areas/leylines/layout.json (written by docs/plans/world-zones/draw-leylines.js: every plot's name + district, the 108 x 84 square
   map, the landmarks' ANCHORS) and writes the room `site_prebuilt_gobekli_ancient` into data.js between LEYLINES63-BEGIN / LEYLINES63-END.
   `node bake-leylines.js` writes; `--dry-run` prints the counts. Never hand-edit between the markers: edit this tool, the layout or a district
   file and rerun. Notes: docs/notes/areas-complexes.md "LEYLINES ON PLOTS" + "LEYLINES, THE ZONE KIT".
   THE DISTRICT FILES: what stands in a district is docs/areas/leylines/districts/<G|B|S|Y|T|Z>.js, one thread a file (THE DISTRICT FILES below).
   This tool keeps what is shared: the square map, the heights, the ground paint, the lake, the line's glow, the ways out, the sky, the checks.
   OPEN GROUND, NO `gen`: you walk anywhere; the only walls are what stands there (stones, tiers, buildings) and the room's line.
   Squares are (sx 0..108 west to east, sy 0..84 north to south); gx(sx) / gz(sy) = a square's west / north line in metres, cx / cz = its middle. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const LAY = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/leylines/layout.json'), 'utf8')), PLAN = LAY.rooms[0], A = LAY.anchors;
const C = 3.5, N = 12, GX = PLAN.cols, GY = PLAN.rows, W = GX * N, H = GY * N, HX = W * C / 2, HZ = H * C / 2, ROOM = 'site_prebuilt_gobekli_ancient';
const r2 = v => Math.round(v * 100) / 100, gx = c => r2(-HX + c * C), gz = c => r2(-HZ + c * C), cx = c => gx(c + 0.5), cz = c => gz(c + 0.5);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
/* the old rooms' people keep their own lines: read from the old literals, which therefore stay in data.js (they are the PvP boards' sources too) */
const OLDR = id => JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [], d: r.doors || [] } : { n: [], l: [], d: [] })(DOOR_HQ.rooms.' + id + '))', D));
const OLD = { ley: OLDR('site_prebuilt_gobekli_leylines'), henge: OLDR('site_prebuilt_stonehenge_henge'), tell: OLDR('site_prebuilt_gobekli_tell'), babel: OLDR('site_prebuilt_babel_tower'), temple: OLDR('site_prebuilt_technoticlan_templecity') };
const sayOf = (R, race, i) => (R.n.filter(n => n.race === race)[i || 0] || {}).say;
const cell = PLAN.cells.map(r => r.split(''));
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); plot[p.id] = p; });
const distAt = (x, y) => PLAN.plots[Math.max(0, Math.min(GY - 1, Math.floor(y / N))) * GX + Math.max(0, Math.min(GX - 1, Math.floor(x / N)))].d;
const F = [], ARCH = [], props = [], doors = [], npc = [], marks = [], count = {}, taken = new Set(), errs = [], strays = [];
const feat = o => { F.push(o); return o; };
const setRect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ch; };
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };

/* ── THE HEIGHTS (terrain.slope.cells: four corner heights a square, in cm): the plain rolls a little; the tell, the anthill, the barrows and
   the Sentinel's knoll are real hills you walk over; the line's row, Babel and Technoticlan are dead flat (their height is built: tiers).
   A district file may add its own bumps: exports.hills = [{ x, y (squares), r, h, flat }] (flat = the radius of a level top). ── */
const sm = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const HILLS = [{ x: A.mound.x, y: A.mound.y, r: A.mound.foot, flat: A.mound.flat, h: A.mound.h }, { x: A.anthill.x, y: A.anthill.y, r: A.anthill.r, flat: 1.2, h: A.anthill.h },
    { x: A.sentinel.x + 0.5, y: A.sentinel.y + 0.5, r: 4, flat: 1, h: 1.75 }].concat(A.barrows.map(b => ({ x: b[0] + 0.5, y: b[1] + 0.5, r: 3, flat: 0.8, h: 2.2 })));
const LONG = A.longbarrow;   // the long barrow: a ridge, highest along its middle
function heightAt(x, y) {   // (x, y) in squares, a corner
    let h = 0;
    const flatZone = y >= 38 && y <= 46 ? 0 : y > 46 ? 0 : Math.min(1, (38 - y) / 5);                    // the roll dies out toward the line
    const green = x > 34 ? Math.min(1, (x - 34) / 6) : 0.5;
    h += flatZone * green * (0.55 * Math.sin(x * 0.21 + 1.3) * Math.cos(y * 0.17) + 0.35 * Math.sin(x * 0.09 - y * 0.13));
    if (y < 38) { const hg = A.henge, d = Math.hypot(x - hg.x, y - hg.y); h *= sm((d - hg.stones - 1) / 5) * 0.6 + 0.0; }   // level inside the bank
    HILLS.forEach(q => { const d = Math.hypot(x - q.x, y - q.y); if (d < q.r) h = Math.max(h, 0) + q.h * sm((q.r - d) / (q.r - q.flat)); });
    { const mx = Math.max(LONG[0] - x, x - LONG[2], 0), my = Math.abs(y - (LONG[1] + LONG[3]) / 2), d = Math.hypot(mx, my); if (d < 2.6) h += 2.6 * sm((2.6 - d) / 2.2); }
    return Math.max(-0.2, h);
}
const Hc = new Float32Array((W + 1) * (H + 1));
const flats = [];   // [x0, y0, x1, y1]: squares levelled (a building's floor)

/* ── THE BUILDINGS (the city's way, the Desert's helper): a hollow `texbuilding` (the walls you bump, the doorway, the swinging leaf, the inside)
   with its own outside switched off + its look as an `arch` parts list. Parts frame: the building's middle, x along the front, +z out of the
   front, y up. Squares x0..x1 x y0..y1 (the end is exclusive), `side` = the wall its front is on. ── */
const U = n => 'urban:' + n, WD = U('WoodGeneric1b'), WD2 = U('WoodGeneric1a'), FLR = U('WoodFlooring1d'), GLS = U('GlassWindowTall1a'), STONE = 'rock_wall_1', BRICK = 'bricks_1';
const ROT = { S: 0, W: 90, N: 180, E: 270 }, GAIN = 2.2;
function sheet() {
    const P = [];
    /* a terrain sheet on a drawn part is dark as it comes: `gain` lifts it (the Desert's pyramids' way); an urban sheet needs none */
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); if (key && !/^(urban:|txt:|hq:)/.test(key) && o.gain == null && o.glow == null) { o.gain = GAIN; if (!o.uv) o.uv = [3.5, 3.5]; } P.push(o); return o; };
    const S = { P,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, o),
        dome: (x, y, z, r, h, key, tint, o) => add({ s: 'dome', p: [r2(x), r2(y), r2(z)], r, h, seg: 16 }, key, tint, o),
        quad: (x, y, z, w, h, key, tint, o) => add({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h)] }, key, tint, o),
        roof: (form, x, y, z, w, h, d, key, tint, o) => { add({ s: 'box', p: [x, y, z], size: [w, 0.02, d], sides: false, top: false, under: true, roof: true, ry: (o && o.ry) || 0 }, WD2, 0x4a3626);
            return add({ s: 'roof', form, p: [x, y, z], size: [w, h, d], roof: true }, key, tint, o); },
        shell(w, h, d, key, tint, door, uv) { const e = 0.05, Wd = w + 2 * e, Dp = d + 2 * e, x = uv ? { uv } : null;
            add({ s: 'box', p: [0, 0, 0], size: [Wd, h, Dp], top: false, faces: 'blr' }, key, tint, x);
            add({ s: 'quad', p: [0, 0, r2(Dp / 2)], size: [Wd, h], ry: 0, hole: [r2(door.lx), r2(door.cw), 2.2] }, key, tint, x); },
        sign(words, x, y, z, w, h, fg, bg, font, o) { P.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], key: 'txt:' + words + '|' + fg + '|' + bg + '|' + r2(w / h) + '||' + font, uv: 'fit', kind: 'wall' }, o || {})); } };
    return S;
}
function texbDoor(w, door) { const L = Math.max(2, w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (door >= 1) col = Math.min(cols - 1, Math.round(door) - 1); return { lx: -L / 2 + (col + 0.5) * cw, cw }; }
const BUILT = {};
function building(id, q, h, o, parts) {
    const [sx0, sy0, sx1, sy1, side] = q, ew = side === 'E' || side === 'W', fw = (ew ? sy1 - sy0 : sx1 - sx0) * C, fd = (ew ? sx1 - sx0 : sy1 - sy0) * C, bx = gx((sx0 + sx1) / 2), bz = gz((sy0 + sy1) / 2), rot = ROT[side];
    const row = Object.assign({ k: 'texbuilding', id: 'ley:' + id, seed: 1, x: bx, z: bz, w: fw, d: fd, rot, storeys: Math.max(1, Math.floor(h / 3.5 + 0.01)), h, skin: false, hollow: true, leaf: 'leaf_shabby_wood', leafDouble: false, keyIn: STONE, floorIn: FLR }, o || {});
    Object.keys(row).forEach(k => { if (row[k] === undefined) delete row[k]; });
    feat(row); flats.push([sx0, sy0, sx1, sy1]);
    for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) taken.add(x + ':' + y);
    const a = sheet(), door = texbDoor(fw, row.door); parts(a, fw, fd, door);
    ARCH.push({ k: 'arch', id: 'ley:' + id + ':look', x: bx, z: bz, rot, parts: a.P });
    const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    count.buildings = (count.buildings || 0) + 1;
    return (BUILT[id] = { at: (lx, lz) => [r2(bx + lx * c - lz * s), r2(bz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd, door, cx: bx, cz: bz, rot });
}
const put = (B, key, lx, lz, o) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, o || {}); if (r.face != null) r.face = B.face(r.face); props.push(r); };
/* a drawn piece on open ground (walked under or round): fn(sheet) in a frame at square-metres (x, z), +x east, +z south, y up */
/* `y` = the row's foot in metres. NONE = the ground under the row's middle, which is the TOP of a plateau standing there (a tier's skin drew 28 m up
   in the first probe): a piece drawn round a plateau gives its y (0 on the flat districts, ctx.heightAt on the rolling ones). */
function look(id, x, z, rot, fn, y) { const a = sheet(); fn(a); const row = { k: 'arch', id: 'ley:' + id + ':look', x: r2(x), z: r2(z), rot: rot || 0, parts: a.P }; if (y != null) row.y = r2(y); ARCH.push(row); return a; }
/* A TIER (the Desert's way): a `plateau` you stand on + its skin (the room's cliff sheet is rock; a built tier wears its own brick or stone).
   Squares x0..x1 x y0..y1, y0m..y1m = the tier's foot and top in metres. */
function tier(id, x0, y0, x1, y1, y0m, y1m, key, tint, o) {
    const w = (x1 - x0) * C, d = (y1 - y0) * C, mx = gx((x0 + x1) / 2), mz = gz((y0 + y1) / 2);
    feat({ k: 'plateau', x: mx, z: mz, w, d, h: y1m, edge: 0.05 });
    look(id, mx, mz, 0, a => a.box(0, y0m, 0, w + 0.16, y1m - y0m + 0.03, d + 0.16, key, tint, o || {}), 0);   // sides + its own top (3 cm over the plateau: the ground sheet is never tinted)
}
const stair = (x0, y0, x1, y1, w, h0, h1, key) => feat({ k: 'ramp', x0: r2(x0), z0: r2(y0), x1: r2(x1), z1: r2(y1), w, h0, h1, stairs: true, built: true, edge: 0.05, key: key || STONE });

/* ── placing things: a blocker on a square's middle (P), decor off it (dec), people (native); never in deep water, never two blockers on a square ── */
let curD = null;
function spot(sx, sy, what, shared) { if (sx < 0 || sy < 0 || sx >= W || sy >= H) { errs.push(what + ' is off the room at ' + sx + ',' + sy); return; }
    if (curD && distAt(sx, sy) !== curD) strays.push(curD + ': ' + what + ' at ' + sx + ',' + sy + ' (' + distAt(sx, sy) + ')');
    if (!shared) { if (taken.has(sx + ':' + sy)) errs.push(what + ': square ' + sx + ',' + sy + ' is taken'); taken.add(sx + ':' + sy); } }
const P = (key, sx, sy, o) => { spot(sx, sy, key); props.push(Object.assign({ key, x: cx(sx), z: cz(sy) }, o || {})); };
const Pm = (key, x, z, o) => { props.push(Object.assign({ key, x: r2(x), z: r2(z) }, o || {})); };                     // at a metre spot (decor)
const decWith = rnd => (key, sx, sy, o) => { spot(sx, sy, key, true); props.push(Object.assign({ key, x: r2(cx(sx) + (rnd() - 0.5) * 1.6), z: r2(cz(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); };
const tree = (sx, sy, kind, h, r) => { spot(sx, sy, 'tree'); if (!'gdsmTFr'.includes(PLAN.cells[sy][sx])) errs.push('a tree off the grass / earth / sand at ' + sx + ',' + sy); feat({ k: 'tree', x: cx(sx), z: cz(sy), kind, h, r: r || 0.8 }); };
const native = (race, sx, sy, face, say) => { spot(sx, sy, race); if (cell[sy][sx] === 'G') errs.push(race + ' stands on the line'); const n = { x: cx(sx), z: cz(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); };

/* ══ THE DISTRICT FILES ══ docs/areas/leylines/districts/<LETTER>.js: G Gobekli Tepe · B Bug Colony · S Stonehenge · Y The Ley Line · T Babel ·
   Z Technoticlan. A file may export any of these stages, each called with that district's own ctx (the helpers above + its own dice):
     plan(ctx)    change the square map (ctx.setRect: ground letters; the paint and the lake follow)
     build(ctx)   terrain rows: tiers, stairs, buildings, drawn pieces (ctx.feat / tier / stair / building / look)
     paint(ctx)   round or slanting ground paint (ctx.stamp, THE PAINT AT HALF SQUARES below)
     dress(ctx)   props, trees (ctx.P / dec / Pm / tree / put)
     people(ctx)  who stands there (ctx.native)
   and `hills` (bumps in the heights, above), `airZones(ctx)` (THE AIR BY DISTRICT, below).
   A stage runs for every district that has it, in the order G B S Y T Z. THE DICE: each file throws its own stream (ctx.rnd, ctx.dec), so a
   piece added in one district never moves a piece of another. A piece a file stands on another district's squares is printed (`strays`). ══ */
const ORDER = ['G', 'B', 'S', 'Y', 'T', 'Z'], DDIR = path.join(REPO, 'docs/areas/leylines/districts'), DISTRICTS = {};
ORDER.forEach(k => { const f = path.join(DDIR, k + '.js'); if (!fs.existsSync(f)) throw new Error('district file missing: docs/areas/leylines/districts/' + k + '.js'); DISTRICTS[k] = require(f); });
ORDER.forEach(k => (DISTRICTS[k].hills || []).forEach(q => HILLS.push(q)));
const CTX = {};
ORDER.forEach(k => { const rnd = mkRnd(7919 * k.charCodeAt(0) + 104729);
    CTX[k] = { d: k, C, N, W, H, HX, HZ, gx, gz, cx, cz, r2, A, PLAN, plot, cell, setRect, distAt, feat, props, npc, marks, taken, building, put, look, sheet, tier, stair, BUILT, flats,
        U, WD, WD2, FLR, GLS, STONE, BRICK, P, Pm, dec: decWith(rnd), tree, native, rnd, sayOf, OLD, heightAt: (x, y) => Hc[Math.round(y) * (W + 1) + Math.round(x)] }; });
const run = stage => ORDER.forEach(k => { const m = DISTRICTS[k]; if (typeof m[stage] === 'function') { curD = k; try { m[stage](CTX[k]); } finally { curD = null; } } });
run('plan');
for (let y = 0; y <= H; y++) for (let x = 0; x <= W; x++) Hc[y * (W + 1) + x] = heightAt(x, y);
run('build');

/* ── THE LINE'S GLOW (shared: it crosses every district's doorstep): the Great Line and each fork are painted in the better gold (the paint,
   below) and carry a lit strip down the middle; the Great Line's is one slab a plot. The forks' strips lie on the slope, a slab a square. ── */
{ const GOLD = 'gold', GL = { glow: 1.1, sides: false };
  for (let px = 0; px < GX; px++) look('line:' + px, gx(px * N + N / 2), gz(42), 0, a => { a.box(0, 0.02, 0, N * C, 0.05, 2.4, GOLD, 0xffe08a, GL); a.box(0, 0.02, -3.2, N * C, 0.04, 0.22, GOLD, 0xffc850, GL); a.box(0, 0.02, 3.2, N * C, 0.04, 0.22, GOLD, 0xffc850, GL); });
  const fork = (id, x0, y0, y1) => { for (let y = y0; y < y1; y += 4) { const n = Math.min(4, y1 - y), hA = Hc[y * (W + 1) + x0 + 1], hB = Hc[(y + n) * (W + 1) + x0 + 1];
      if (Math.abs(hA - hB) < 0.06) look('fork:' + id + ':' + y, gx(x0 + 1), gz(y + n / 2), 0, a => a.box(0, 0.02, 0, 1.0, 0.04, n * C, GOLD, 0xffd870, GL)); } };
  const f = A.forks; fork('g', f.gobekli[0], 24, 40); fork('a', f.anthill[0], 20, 40); fork('h', f.henge[0], 24, 40); fork('b', f.babel[0], 44, 52); fork('c', f.causeway[0], 44, 48);
  /* THE NEXUS: where the lines cross, a ring of the better gold in the paving */
  look('nexus', gx(A.nexus.x), gz(A.nexus.y), 0, a => { a.cyl(0, 0.02, 0, 3.2, 0.05, GOLD, 0xffe08a, { glow: 1.1, sides: false }); a.cyl(0, 0.03, 0, 2.5, 0.05, 'cobblestone', 0x8a8478, { sides: false }); a.cyl(0, 0.04, 0, 0.9, 0.05, GOLD, 0xfff0b0, { glow: 1.3, sides: false }); }); }

/* ── THE WAYS (shared; the district files never move them) ── */
const GIZA = { wall: 'w', z: gz(42) };                                             // link gobekli_giza a: the robbers' tunnel, where the line meets the west wall
const BAY9600 = { x: cx(A.doorway.x), z: cz(A.doorway.y), face: 180 };              // Room 9600: the First Doorway (siteRooms.entry.prebuilt_gobekli)
const BAY56 = { x: cx(94), z: cz(33), face: 180 };                                  // Room 56: the frame with nothing in it, by the South Gate
const BAY11 = { wall: 's', x: gx(42) };                                             // Room 11: the barn door at the street's end
const BAY2012 = { wall: 's', x: gx(81) };                                           // Room 2012: the Portcullis at the south causeway's end
const XIBALBA = { x: r2(gx(A.court[0]) - 1.75), z: cz(58), face: 270 };             // link technoticlan_agartha a: under the ball court's west wall
[[A.doorway.x, A.doorway.y], [94, 33], [A.court[0] - 1, 58]].forEach(q => taken.add(q[0] + ':' + q[1]));

run('dress');
run('people');
if (strays.length) console.log('pieces a district stood on another district\'s squares (ask that district\'s thread):\n  ' + strays.join('\n  '));
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));

/* ── THE HEIGHTS, written: under a building the ground is levelled, eased back over four squares ── */
flats.forEach(([x0, y0, x1, y1]) => { const ref = heightAt((x0 + x1) / 2, (y0 + y1) / 2);
    for (let y = Math.max(0, y0 - 5); y <= Math.min(H, y1 + 5); y++) for (let x = Math.max(0, x0 - 5); x <= Math.min(W, x1 + 5); x++) {
        const d = Math.max(x0 - 1 - x, x - x1 - 1, y0 - 1 - y, y - y1 - 1, 0), w = Math.max(0, 1 - d / 4), k = y * (W + 1) + x; Hc[k] = Hc[k] * (1 - w) + ref * w; } });
const slope = Buffer.alloc(W * H * 8);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 8; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((q, k) => slope.writeInt16LE(Math.round(Hc[(y + q[1]) * (W + 1) + x + q[0]] * 100), o + k * 2)); }

/* ── THE LAKE: every block of the map's `w` is one waded `stream` (0.3 m under the paving, 0.7 m deep: the real lake was shallow) ── */
{ const used = new Uint8Array(W * H), isW = (x, y) => cell[y][x] === 'w';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!isW(x, y) || used[y * W + x]) continue;
      let w = 1; while (x + w < W && !used[y * W + x + w] && isW(x + w, y)) w++;
      let h = 1; rows: while (y + h < H) { for (let i = 0; i < w; i++) if (used[(y + h) * W + x + i] || !isW(x + i, y + h)) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
      feat({ k: 'stream', pts: h >= w ? [[r2(gx(x) + w * C / 2), gz(y)], [r2(gx(x) + w * C / 2), gz(y + h)]] : [[gx(x), r2(gz(y) + h * C / 2)], [gx(x + w), r2(gz(y) + h * C / 2)]], w: (h >= w ? w : h) * C, y: -0.3, depth: 0.7, key: 'water' });
      count.water = (count.water || 0) + 1; } }
/* ── THE PAINT: one sheet a square (0 = the room's own grass) ── */
const PAL = ['wasteland', 'desert', 'dirt_2', 'marble_light', 'cobblestone', 'bricks_1', 'gold', 'grass_dark_fantasy'];   // EIGHT sheets is the game's limit: a ninth draws as the floor
const PAINT = { g: 0, d: 2, s: 2, p: 3, c: 4, o: 5, k: 2, G: 7, f: 7, m: 3, h: 7, F: 0, T: 8, b: 5, t: 5, r: 0, w: 3 };
/* THE PAINT AT HALF SQUARES (1.75 m, the ground mesh's own step): the map's letters twice over, then each district's STAMPS on top: a file's
   `paint(ctx)` calls ctx.stamp((xm, zm) => sheet | null) with a test in room metres ('grass' = the floor), so a ring or a slanting path is
   round, not a staircase of squares. */
const FW = 2 * W, FH = 2 * H, paint = new Uint8Array(FW * FH), STAMPS = [];
ORDER.forEach(k => { CTX[k].stamp = fn => STAMPS.push([k, fn]); });
run('paint');
for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const sx = x >> 1, sy = y >> 1, ch = cell[sy][sx]; let v = PAINT[ch] == null ? 0 : PAINT[ch];
    if (STAMPS.length) { const xm = -HX + (x + 0.5) * C / 2, zm = -HZ + (y + 0.5) * C / 2, d = distAt(sx, sy); for (const q of STAMPS) { if (q[0] !== d) continue; const key = q[1](xm, zm); if (key != null) { v = key === 'grass' ? 0 : PAL.indexOf(key) + 1; if (key !== 'grass' && !v) throw new Error(q[0] + '.js stamp: not a ground sheet: ' + key); } } }
    if (ch === 'm' && distAt(sx, sy) === 'G') v = 2;   // the tell: the same pale earth as the ground round it (its paths show on it)
    paint[y * FW + x] = v; }
ARCH.forEach(feat);
feat({ k: 'scatter', key: 'cave_stone', n: 70, seed: 5 });

/* ── checks: every prop key and unit exists; no step on the open ground steeper than the walker climbs; every plot is reached from the West Mouth ── */
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D), TREES = vm.runInContext('HQ_TREE_KINDS', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); });
npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
F.forEach(f => { if (f.k === 'tree' && !TREES[f.kind]) throw new Error('not a tree kind: ' + f.kind); });
{ const hC = (x, y) => (Hc[y * (W + 1) + x] + Hc[y * (W + 1) + x + 1] + Hc[(y + 1) * (W + 1) + x] + Hc[(y + 1) * (W + 1) + x + 1]) / 4;
  const seen = new Uint8Array(W * H), st = [[1, 41]]; seen[41 * W + 1] = 1; let steep = 0;
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H || seen[Y * W + X]) continue;
      if (Math.abs(hC(X, Y) - hC(x, y)) / C > 0.3) { steep++; continue; } seen[Y * W + X] = 1; st.push([X, Y]); } }
  const cold = PLAN.plots.filter(p => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.y * N + ly) * W + p.x * N + lx]) return false; return true; }).map(p => p.id);
  if (cold.length) throw new Error('plots not reached on foot: ' + cold.join(' '));
  let un = 0; for (let i = 0; i < W * H; i++) if (!seen[i]) un++; Object.assign(count, { unreachedSquares: un, steepSteps: steep }); }
Object.assign(count, { features: F.length, props: props.length, doors: doors.length, natives: npc.length });

/* THE AIR BY DISTRICT (the Woods' and the Desert's way, three-renderer.js _hqBuildAtmos `shell.atmos.zones`): a district file may export
   `airZones(ctx)` = [{ sx0, sy0, sx1, sy1 (squares, the end exclusive), kind, color, n, speed, wind }]. A room with zones draws only its zones. */
const AIR = [].concat(...ORDER.filter(k => typeof DISTRICTS[k].airZones === 'function').map(k => (DISTRICTS[k].airZones(CTX[k]) || []).map(z => { const q = Object.assign({}, z, { x0: gx(z.sx0), z0: gz(z.sy0), x1: gx(z.sx1), z1: gz(z.sy1) });
    delete q.sx0; delete q.sy0; delete q.sx1; delete q.sy1; return q; })));
const ATMOS = AIR.length ? " atmos: " + J({ kind: 'dust', color: 0xe8d8b8, n: 60, zones: AIR }) + "," : "";
/* ── the room ── */
const SP = { x: gx(3), z: gz(42) }, LINES = OLD.ley.l.concat(OLD.henge.l, OLD.tell.l, OLD.babel.l, OLD.temple.l), L = [];
L.push("        /* LEYLINES63-BEGIN — LEYLINES ON PLOTS (2026-11-16): written by `node bake-leylines.js` from docs/areas/leylines/layout.json + districts/*.js. Never hand-edit between the markers; edit the tool, the layout or a district file and rerun. */");
L.push("        " + ROOM + ": {");
L.push("            label: 'LEYLINES',");
L.push("            sub: 'ONE LINE · SIX DISTRICTS · 63 PLOTS',");
L.push("            kind: 'box', site: 'prebuilt_gobekli', part: 'ancient',");
L.push("            shell: hqAncientShell({ w: " + (2 * HX) + ", d: " + (2 * HZ) + ", h: 32, wallH: 32, floor: 'grass_2', apron: 'grass_2', skirt: 'dirt_2', apronColor: 0xffffff, floorColor: 0xffffff, plate: { x: " + SP.x + ", z: " + SP.z + ", y: 5.0 },");
L.push("                                    mood: { lamp: 0xffb060, glow: 0xff9a40, strip: 0xffd8a0, light: 0xfff0d8, ambient: 0.58 }," + ATMOS);
L.push("                                    sky: { night: 0, tint: 0xbfd0c0, tintAmt: 0.3, stars: 0.6, nebula: 0.5, day: 1, clouds: 0.3, fog: { color: 0xc4ccb8, amount: 0.5, top: 0.05, band: 0.45, density: 0.01 }, scenery: 'none' },");
L.push("                                    look: HQ_ROOM_LOOKS.henge }),");
L.push("            parti: 'One line of light, dead straight from the desert to the sea, and on a fork of it each of the oldest places there is: the tell and its pillars, a hill of ants, the stones in their ring, a tower that stopped, a city on a lake.',");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", n: " + GX + ", names: " + J(PLAN.plots.map(p => [p.id, p.name, p.d, 0])) + " },");
L.push("            terrain: {");
L.push("                res: 1.75, floor: 'grass_2', cliff: 'rocks_5', path: 'dirt_2',");
L.push("                noise: { amp: 0.06, scale: 9 },");
L.push("                /* THE EDGES THAT FIT THE MAP (docs/plans/world-zones/world_layout.png): west = the Desert's sand by Giza; north, east and south = the sea */");
L.push("                backdrop: false, edges: { reach: 300, w: { kind: 'desert', cap: { kind: 'coast', at: 'n', off: 0, len: 60 } }, n: { kind: 'coast' }, e: { kind: 'coast' }, s: { kind: 'coast' } },");
L.push("                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gz(0) + ", nx: " + W + ", nz: " + H + ", d: '" + slope.toString('base64') + "' } },");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + (C / 2) + ", x0: " + r2(-HX + C / 4) + ", z0: " + r2(-HZ + C / 4) + ", nx: " + FW + ", nz: " + FH + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                marks: " + J(marks) + ",");
L.push("                features: [");
F.forEach(f => L.push("                    " + J(f) + ","));
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
L.push("            lines: " + J(LINES) + ",");
L.push("            spawn: { x: " + SP.x + ", z: " + SP.z + ", face: 90 },");
L.push("        },");
L.push("        /* LEYLINES63-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
/* the rows in data.js that name a place in this room (written by hand there): the tool refuses to bake when one has drifted */
const WANT = [
    ["prebuilt_gobekli: { room: '" + ROOM + "', door: { id: 'bay', wall: 'free', x: " + BAY9600.x + ", z: " + BAY9600.z + ", face: " + BAY9600.face + " } }", 'siteRooms.entry.prebuilt_gobekli'],
    ["prebuilt_stonehenge: { room: '" + ROOM + "', door: { id: 'bay56', wall: 'free', x: " + BAY56.x + ", z: " + BAY56.z + ", face: " + BAY56.face + " } }", 'siteRooms.entry.prebuilt_stonehenge'],
    ["prebuilt_babel: { room: '" + ROOM + "', door: { id: 'bay11', wall: 's', x: " + BAY11.x + " } }", 'siteRooms.entry.prebuilt_babel'],
    ["prebuilt_technoticlan: { room: '" + ROOM + "', door: { id: 'bay2012', wall: 's', x: " + BAY2012.x + " } }", 'siteRooms.entry.prebuilt_technoticlan'],
    ["a: { site: 'prebuilt_gobekli', part: 'ancient', wall: 'w', z: " + GIZA.z + ",", 'link gobekli_giza (a)'],
    ["a: { site: 'prebuilt_gobekli', part: 'ancient', wall: 'free', x: " + XIBALBA.x + ", z: " + XIBALBA.z + ", face: " + XIBALBA.face + ",", 'link technoticlan_agartha (a)'],
];
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at this room yet (see the rows above)'); }
if (DRY) process.exit(0);
const END = '        /* LEYLINES63-END */\n', b0 = src.indexOf('        /* LEYLINES63-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        site_prebuilt_gobekli_leylines: {'; const a = src.lastIndexOf('        /*', src.indexOf(anchor)); if (src.indexOf(anchor) < 0 || a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOM + ' written (' + block.length + ' bytes)');
