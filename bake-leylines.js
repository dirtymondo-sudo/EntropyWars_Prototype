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
const OWNER = new Map(), feat = o => { F.push(o); if (curD) OWNER.set(o, curD); return o; };   // (OWNER: which district file laid a row: THE ONE WORLD MOVE re-anchors a ring by it)
const setRect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ch; };
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };

/* ── THE HEIGHTS (terrain.slope.cells: four corner heights a square, in cm): the plain rolls a little; the tell, the anthill, the barrows and
   the Sentinel's knoll are real hills you walk over; the line's row, Babel and Technoticlan are dead flat (their height is built: tiers).
   A district file may add its own bumps: exports.hills = [{ x, y (squares), r, h, flat }] (flat = the radius of a level top). ── */
const sm = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const HILLS = [{ x: A.mound.x, y: A.mound.y, r: A.mound.foot, flat: A.mound.flat, h: A.mound.h }, { x: A.anthill.x, y: A.anthill.y, r: A.anthill.r, flat: 1.2, h: A.anthill.h },
    { x: A.sentinel.x + 0.5, y: A.sentinel.y + 0.5, r: 4, flat: 1, h: 1.75 }].concat(A.barrows.map(b => ({ x: b[0] + 0.5, y: b[1] + 0.5, r: 3, flat: 0.8, h: 2.2 })));
function heightAt(x, y) {   // (x, y) in squares, a corner
    let h = 0;
    const flatZone = y >= 38 && y <= 46 ? 0 : y > 46 ? 0 : Math.min(1, (38 - y) / 5);                    // the roll dies out toward the line
    const green = x > 34 ? Math.min(1, (x - 34) / 6) : 0.5;
    h += flatZone * green * (0.55 * Math.sin(x * 0.21 + 1.3) * Math.cos(y * 0.17) + 0.35 * Math.sin(x * 0.09 - y * 0.13));
    if (y < 38) { const hg = A.henge, d = Math.hypot(x - hg.x, y - hg.y); h *= sm((d - hg.stones - 1) / 5) * 0.6 + 0.0; }   // level inside the bank
    HILLS.forEach(q => { const d = Math.hypot(x - q.x, y - q.y); if (d < q.r) h = Math.max(h, 0) + q.h * sm((q.r - d) / (q.r - q.flat)); });
    /* (the long barrow is a walk-in building since Stonehenge's pass 2: its mound is drawn over it, the ground under it is level) */
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
    if (ch === 'm' && distAt(sx, sy) === 'S') v = 0;   // Stonehenge's barrows are turf
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

/* ══ THE ONE WORLD MOVE (2026-11-17, mondo's approved map v13; docs/plans/one-world/BUILD_PLAN.md phase 3, the Leylines row: "districts round the
   plateau, the ley line from Giza through all of them (moved, not reshaped)") ═══════════════════════════════════════════════════════════════════
   Everything above builds Leylines in THE HOME FRAME, the 9 x 7 room the six district files were written for (no district file changed). Here the
   result is stood where the One World map puts it (docs/plans/one-world/plots.json; the mover = ow-move.js), as FOUR rooms by the room-splitting rule
   (areas-complexes.md "ONE WORLD, THE ROOM-SPLITTING RULE": join what touches until a number stops it; the box 12 x 12, 30 plots, 12 in a straight row):
     THE LINE   (G + Y) -> site_prebuilt_gobekli_ow_line, world 19..30 x 29..31, 18 plots: Göbekli Tepe and the Ley Line west of it, twelve plots west
                           to east (the straight-row limit). The robbers' tunnel to Giza (link gobekli_giza) is on its west wall where the line's row meets it.
     BABEL      (T + Z) -> site_prebuilt_gobekli_ow_babel, world 28..34 x 29..36, 29 plots: Babel east of the line's East Mouth, the wild link L16 (two plots:
                           rule 4, this tool lays them, THE TRAIL BELOW BABEL) down to Technoticlan on its lake.
     BUG COLONY (B)     -> site_prebuilt_gobekli_ow_bugs, written by THE ROUTE KIT (`node bake-route.js L14`, docs/areas/routes/L14.json): the wild links L14
                           (from Göbekli's Dry Slope) and L15 (on to Technoticlan) with the district between them. This tool stands its nine plots and hands
                           them over (`--export ow_bugs <file>`), at half squares of paint (the kit reads `paintHalf`).
     STONEHENGE (S)     -> site_prebuilt_gobekli_ow_henge, world -31..-29 x -9..-7, alone on the plain north-west (its way on is route R12, the Stone Path,
                           BUILD_PLAN phase 4.1; until then Room 56's frame is the way in).
   A plot keeps its name, its squares, its heights, its paint and every piece on it. What is laid again is the tool's own: the lake's rows, the open ground
   (`space` rows over every plot square: the box's scenery cells are ground nobody walks, `gen` plan), the seams, the room-wide scatter by each room's
   share, the stoppers on the scenery side of a plot line, the heights eased where two plots meet that did not before. A cell of a room's box that is a
   plot of ANOTHER Leylines room (Babel's box holds three plots of the line) is drawn as that plot's own ground, heights and paint, never walked.
   NOT RESHAPED (the brief): the gold forks still run from each district toward where the line was in the home frame, so some end at a plot side with
   scenery past it (the notes list them). Rules: areas-complexes.md "LEYLINES, THE ONE WORLD MOVE". ── */
const PJ = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/plans/one-world/plots.json'), 'utf8')), OWP = require('./ow-places.js');
const AIR_HOME = {}; ORDER.filter(k => typeof DISTRICTS[k].airZones === 'function').forEach(k => { AIR_HOME[k] = (DISTRICTS[k].airZones(CTX[k]) || []).map(z => { const q = Object.assign({}, z, { x0: gx(z.sx0), z0: gz(z.sy0), x1: gx(z.sx1), z1: gz(z.sy1) });
    delete q.sx0; delete q.sy0; delete q.sx1; delete q.sy1; return q; }); });
const HOMEP = PLAN.plots.map(p => ({ id: p.id, x: p.x, y: p.y, name: p.name, district: p.d, level: 0 }));
/* the hand-written rows of data.js that name a place in the home room, handed to the mover as doors: each lands where its plot stands now */
const HOMEDOORS = [Object.assign({ id: 'bay', wall: 'free' }, BAY9600), Object.assign({ id: 'bay56', wall: 'free' }, BAY56), Object.assign({ id: 'bay11' }, BAY11), Object.assign({ id: 'bay2012' }, BAY2012), Object.assign({ id: 'xibalba', wall: 'free' }, XIBALBA)];
/* A RING OR A LINE IS ITS DISTRICT'S (2026-11-17): the mover moves a row of points with the plot its MIDDLE point stands on. A barrow's ring ditch
   (districts/S.js) starts due east, so its middle point is due west, over the line into Bug Colony's squares at home: it went with Bug Colony. Such a
   row gets, for the move only, an anchor on its own district's squares (its middle when that is the district's, else its first point that is). */
F.forEach(f => { const own = OWNER.get(f); if (!own || f.x != null || !Array.isArray(f.pts) || !f.pts.length) return; const sqd = q => distAt(Math.floor((q[0] + HX) / C), Math.floor((q[1] + HZ) / C));
    const mid = f.pts[Math.floor(f.pts.length / 2)]; if (sqd(mid) === own) return;
    const cen = [f.pts.reduce((a, q) => a + q[0], 0) / f.pts.length, f.pts.reduce((a, q) => a + q[1], 0) / f.pts.length], at = sqd(cen) === own ? cen : f.pts.find(q => sqd(q) === own);
    if (at) { f.x = r2(at[0]); f.z = r2(at[1]); f._anchor = 1; } });
/* A DISTRICT'S OWN WAYS IN (2026-11-17, Bug Colony's hive + nest doors): `exports.ways(ctx)` = free doors in home metres; they move with their plot and are
   written on the room the district stands in (the route kit's room too: the export carries them, bake-route.js keeps a door with no side where it stands) */
ORDER.forEach(k => { if (typeof DISTRICTS[k].ways === 'function') DISTRICTS[k].ways(CTX[k]).forEach(d => HOMEDOORS.push(Object.assign({ own: k }, d))); });
const MOVER = require('./ow-move.js')({ cols: GX, rows: GY, cell, fill: ' ', plots: HOMEP, features: F, props, npc, doors: HOMEDOORS });
const v13 = letter => { const d = PJ.districts.find(q => q.today && q.today.room === ROOM && q.today.districts.indexOf(letter) >= 0); if (!d) throw new Error('plots.json has no Leylines district ' + letter);
    return d.plots.map(q => { const p = plot[q.was]; if (!p || p.d !== letter || (p.name !== q.n && letter !== 'B')) throw new Error('plots.json and the layout disagree on ' + q.was + ' ' + q.n); /* (Bug Colony's names changed with its redesign, 11-17: the layout's win; plots.json keeps the old ones, gen.js reads the retired room) */ return { id: q.was, wx: q.x, wy: q.y }; }); };
const R_LINE = 'site_prebuilt_gobekli_ow_line', R_BABEL = 'site_prebuilt_gobekli_ow_babel', R_BUGS = 'site_prebuilt_gobekli_ow_bugs', R_HENGE = 'site_prebuilt_gobekli_ow_henge';
const L16 = PJ.links.find(l => l.id === 'L16'); if (!L16 || L16.plots.length !== 2) throw new Error('plots.json: L16 is not two plots any more (rule 4: a link of three or more is the route kit\'s)');
/* every home plot's world place (to draw a cell of a room's box that is another Leylines room's plot) */
const WORLD_OF = {}; ORDER.forEach(k => v13(k).forEach(q => { WORLD_OF[q.wx + ',' + q.wy] = plot[q.id]; }));
const STAND = [
    { id: R_LINE, part: 'ow_line', label: 'LEYLINES · THE LINE', sub: 'GÖBEKLI TEPE · THE LEY LINE · 18 PLOTS', letters: ['G', 'Y'], list: v13('G').concat(v13('Y')), lines: OLD.ley.l.concat(OLD.tell.l),
      parti: 'The oldest temple there is on its tell, and one line of light running dead straight east from it across the plain, with a niche for each of the old places along it.',
      spawn: { home: [3, 42], face: 90 }, giza: { plot: 'P00-01', along: 6 },
      seams: [
          { plot: 'P08-03', side: 'E', along: 6, id: 'ow_v_31_30', room: R_BABEL, open: 11, label: 'BABEL', sub: 'THE EAST MOUTH · THE LINE RUNS ON EAST', desc: 'The line runs on east, straight at the tower.' },
          { plot: 'P02-02', side: 'S', along: 6, id: 'ow_h_21_32', room: R_BUGS, open: 5, label: 'THE TRAIL · BUG COLONY', sub: 'THE DRY SLOPE · THE FOOTPATH SOUTH', desc: 'A footpath goes off the slope south into the dry scrub.' },
      ] },
    { id: R_BABEL, part: 'ow_babel', label: 'LEYLINES · BABEL + TECHNOTICLAN', sub: 'THE TOWER · THE TRAIL · THE CITY ON THE LAKE · 29 PLOTS', letters: ['T', 'Z'], lines: OLD.babel.l.concat(OLD.temple.l),
      list: v13('T').concat(v13('Z')).concat(L16.plots.map((p, i) => ({ wx: p[0], wy: p[1], name: 'The trail', district: 'R', level: 0, link: 'L16', li: i }))),
      parti: 'A tower that stopped going up, with its kilns and its workers\' town, and a footpath south from its foot to a city on a lake: causeways, a canal, a pyramid.',
      spawn: { seam: 'ow_v_31_30', face: 90 },
      seams: [
          { plot: 'P00-05', side: 'W', along: 6, id: 'ow_v_31_30', room: R_LINE, open: 11, label: 'THE LEY LINE', sub: 'THE KILN · THE LINE WEST', desc: 'The line runs west, straight back across the plain.' },
          { plot: 'P04-04', side: 'W', along: 6, id: 'ow_v_28_34', room: R_BUGS, open: 5, label: 'THE TRAIL · BUG COLONY', sub: 'THE GARDEN ISLETS · THE FOOTPATH WEST', desc: 'A footpath leaves the lake shore west through the long grass.' },
      ] },
    /* THE JOINING RULE: the route kit writes this room and takes the district in (docs/areas/routes/L14.json `join`) */
    { id: R_BUGS, part: 'ow_bugs', label: 'BUG COLONY', letters: ['B'], list: v13('B'), kit: true, lines: [], seams: [], spawn: { home: [48, 18], face: 90 } },
    { id: R_HENGE, part: 'ow_henge', label: 'STONEHENGE', sub: 'LEYLINES · THE STONES ON THE PLAIN · 9 PLOTS', letters: ['S'], list: v13('S'), lines: OLD.henge.l,
      parti: 'The stones in their ring on the open plain, the barrows round them and the avenue to the river, alone a long way from the line.',
      spawn: { door: 'bay56', back: 2, face: 0 }, seams: [] },
];
const SIDE4 = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] }, FACE = { N: 180, E: 270, S: 0, W: 90 };   // a free door's opening faces INTO the plot (ow-move.js)
const FW_N = 2 * N;   // paint cells a plot (half squares)
const SCEN = { scrub: 2, rock: 1, desert: 2, snow: 0, grass: 0, forest: 0 };   // a scenery cell's paint: the desert sheet (dry scrub reads as the sand the edge land wears past the line), wasteland (bare rock) or the floor
const STOP = { grass: ['leafy_bush', 'psxg_rock_1', 'wild_flowers', 'leafy_bush'], forest: ['leafy_bush', 'psxg_rock_1', 'leafy_bush'], scrub: ['psxg_dead_bush_1', 'psxg_rock_1', 'cave_stone', 'psxg_dead_bush_1'],
    rock: ['psxg_rock_1', 'cave_stone', 'psxg_rock_2'], desert: ['cave_stone', 'psxg_rock_2', 'psxg_dead_bush_1'], snow: ['psxg_rock_1', 'psxg_rock_2'] };
const groundAt = (x, y) => { const row = PJ.ground.rows[y - PJ.ground.y0], c = (row && row[x - PJ.ground.x0]) || 'g'; return Object.assign({ c }, PJ.ground.key[c] || { kind: 'grass', kit: 'grass' }); };
const hsh = (x, y, k) => { let n = (x * 374761393 + y * 668265263 + k * 2147483647) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const ROOMS_OUT = [], STRAYS = [], PLACES = {};
STAND.forEach(S => {
    const R = MOVER.room(S.list), Wn = R.W, Dn = R.D, c2 = R.cell;
    R.features.forEach(f => { if (f._anchor) { delete f.x; delete f.z; delete f._anchor; } });
    R.strays.forEach(t => STRAYS.push(S.label + ': ' + t));
    const inR = (x, y) => x >= 0 && y >= 0 && x < Wn && y < Dn, isPlot = (x, y) => inR(x, y) && !!R.plotOfSq(x, y);
    /* the cells of the box: an own plot (its home), a plot of another Leylines room (drawn, never walked), or scenery */
    const CELLS = []; for (let r = 0; r < R.rows; r++) for (let c = 0; c < R.cols; c++) { const e = R.at[c + ',' + r], wx = R.wx + c, wy = R.wy + r;
        CELLS.push({ c, r, wx, wy, e, home: e ? e.home : WORLD_OF[wx + ',' + wy] || null, ghost: !e && !!WORLD_OF[wx + ',' + wy], g: groundAt(wx, wy) }); }
    const cellAt = (c, r) => CELLS[r * R.cols + c];
    /* ── the squares of a ghost cell (another room's plot seen past the line) ── */
    CELLS.forEach(q => { if (!q.ghost) return; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) c2[q.r * N + ly][q.c * N + lx] = cell[q.home.y * N + ly][q.home.x * N + lx]; });
    const propsOut = R.props.slice(), featsOut = R.features.slice(), names = R.names.slice();
    /* ── THE TRAIL BELOW BABEL (the wild link L16, two plots of farmland: rule 4, the district's tool lays them): a footpath two squares wide that
       wanders a little down the plot's middle from Babel's south foot to Technoticlan's north shore, a place beside it on each plot (ow-places.js:
       the names are ideas of Claude's, plain, no role), a cairn, a trail sign at each end ── */
    const newPlots = R.order.filter(e => e.isNew);
    newPlots.forEach((e, i) => { const x0 = e.col * N, y0 = e.row * N, sg = i % 2 ? 1 : -1;
        for (let ly = 0; ly < N; ly++) { const off = sg * Math.round(1.2 * Math.sin(Math.PI * ly / (N - 1))); for (let lx = 0; lx < N; lx++) c2[y0 + ly][x0 + lx] = (lx === 5 + off || lx === 6 + off) ? 'p' : 'g'; }
        const g = groundAt(e.wx, e.wy), list = OWP.forKind(g), pl = OWP.PLACES[list[(i * 3) % list.length]];
        const at = sg < 0 ? [x0 + 9, y0 + 5] : [x0 + 2, y0 + 6];
        OWP.lay(pl, at[0], at[1], { P: (key, sx, sy, o) => propsOut.push(Object.assign({ key, x: R.gcx(sx), z: R.gcz(sy) }, o || {})), at: (key, fx, fy, o) => propsOut.push(Object.assign({ key, x: R.gx(fx), z: R.gz(fy) }, o || {})) });
        e.name = 'The trail, ' + pl.name; names.forEach(n => { if (n[0] === R.pid(e)) n[1] = e.name; });
        propsOut.push({ key: 'cairn', x: R.gcx(x0 + (sg < 0 ? 3 : 9)), z: R.gcz(y0 + (sg < 0 ? 9 : 2)) });
        for (let k = 0; k < 4; k++) propsOut.push({ key: 'wild_flowers', x: r2(R.gcx(x0 + 1 + Math.floor(hsh(e.wx, e.wy, k) * 10)) + 0.4), z: r2(R.gcz(y0 + 1 + Math.floor(hsh(e.wx, e.wy, k + 9) * 10)) - 0.3), face: Math.round(hsh(e.wx, e.wy, k + 20) * 360) });
        if (i === 0) propsOut.push({ key: 'trail_sign', x: R.gcx(x0 + 8), z: R.gcz(y0 + 1), face: 180 });
        if (i === newPlots.length - 1) propsOut.push({ key: 'trail_sign', x: R.gcx(x0 + 3), z: R.gcz(y0 + 10), face: 0 }); });
    /* ── THE HEIGHTS: each cell's corners as they stood at home, the corner two cells share = their mean, the difference eased over four squares
       into each plot; scenery corners take the mean of the set ones round them ── */
    const HW = Wn + 1, Hn = new Float32Array(HW * (Dn + 1)), set = new Uint8Array(HW * (Dn + 1)), sum = new Float32Array(HW * (Dn + 1)), cnt = new Uint8Array(HW * (Dn + 1));
    const homeH = (q, lx, ly) => Hc[(q.home.y * N + ly) * (W + 1) + q.home.x * N + lx];
    CELLS.forEach(q => { if (!q.home) return; for (let ly = 0; ly <= N; ly++) for (let lx = 0; lx <= N; lx++) { const k = (q.r * N + ly) * HW + q.c * N + lx; sum[k] += homeH(q, lx, ly); cnt[k]++; } });
    CELLS.forEach(q => { if (!q.home) return; for (let ly = 0; ly <= N; ly++) for (let lx = 0; lx <= N; lx++) { const k = (q.r * N + ly) * HW + q.c * N + lx; let v = homeH(q, lx, ly);
        /* ease toward each side's shared mean (a side that has a drawn cell past it) */
        [['W', lx, ly], ['E', N - lx, ly], ['N', ly, lx], ['S', N - ly, lx]].forEach(([sd, dep, along]) => { if (dep >= 4) return; const o = cellAt(q.c + SIDE4[sd][0], q.r + SIDE4[sd][1]); if (!o || !o.home && !(o.e && o.e.isNew)) return;
            const ex = sd === 'W' ? 0 : sd === 'E' ? N : along, ey = sd === 'N' ? 0 : sd === 'S' ? N : along, k2 = (q.r * N + ey) * HW + q.c * N + ex;
            if (o.home) v += (sum[k2] / cnt[k2] - homeH(q, ex, ey)) * (1 - dep / 4); });
        if (lx > 0 && lx < N && ly > 0 && ly < N) { Hn[k] = v; set[k] = 1; } else if (!set[k]) { Hn[k] = sum[k] / cnt[k]; set[k] = 1; } } });
    for (let pass = 0; pass < 200; pass++) { let left = 0; const nxt = [];
        for (let y = 0; y <= Dn; y++) for (let x = 0; x <= Wn; x++) { const k = y * HW + x; if (set[k]) continue; let s = 0, n = 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X > Wn || Y > Dn) return; const k2 = Y * HW + X; if (set[k2]) { s += Hn[k2]; n++; } });
            if (n) nxt.push([k, s / n]); else left++; }
        nxt.forEach(([k, v]) => { Hn[k] = v; set[k] = 1; }); if (!left) break; }
    const hAt = (x, y) => Hn[Math.max(0, Math.min(Dn, y)) * HW + Math.max(0, Math.min(Wn, x))];
    const slope2 = Buffer.alloc(Wn * Dn * 8);
    for (let y = 0; y < Dn; y++) for (let x = 0; x < Wn; x++) { const o = (y * Wn + x) * 8; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((qq, k) => slope2.writeInt16LE(Math.round(hAt(x + qq[0], y + qq[1]) * 100), o + k * 2)); }
    /* ── THE PAINT (half squares): a drawn cell's own, a new plot's grass and path, a scenery cell's ground kind ── */
    const PW = 2 * Wn, paint2 = new Uint8Array(PW * 2 * Dn);
    CELLS.forEach(q => { for (let j = 0; j < FW_N; j++) for (let i = 0; i < FW_N; i++) { const o = (q.r * FW_N + j) * PW + q.c * FW_N + i;
        paint2[o] = q.home ? paint[(q.home.y * FW_N + j) * FW + q.home.x * FW_N + i] : (q.e && q.e.isNew) ? (c2[q.r * N + (j >> 1)][q.c * N + (i >> 1)] === 'p' ? PAINT.p : 0) : (SCEN[q.g.kit] || 0); } });
    /* ── THE LAKE: Technoticlan's water rows are the mover's (each stays with its plot); nothing to lay again ── */
    /* ── the open ground: every square of the room's own plots (the scenery cells and the drawn cells are ground nobody walks) ── */
    const spaces2 = R.spaces((x, y) => isPlot(x, y));
    /* ── the stoppers: on the scenery side of a plot line, about every second square (pieces of the map's ground kind there), never in front of a seam ── */
    const seamSq = []; S.seams.forEach(sm => { const e = R.ofHome[sm.plot]; if (!e) throw new Error(S.id + ': no plot ' + sm.plot); const ns = sm.side === 'N' || sm.side === 'S', k = sm.along;
        seamSq.push(ns ? [e.col * N + k, e.row * N + (sm.side === 'N' ? -1 : N)] : [e.col * N + (sm.side === 'W' ? -1 : N), e.row * N + k]); });
    let stops = 0;
    for (let y = 0; y < Dn; y++) for (let x = 0; x < Wn; x++) { if (isPlot(x, y)) continue; const q = cellAt(Math.floor(x / N), Math.floor(y / N)); if (q.ghost) continue;
        if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isPlot(x + dx, y + dy))) continue; if (seamSq.some(s => Math.abs(s[0] - x) <= 4 && Math.abs(s[1] - y) <= 4)) continue;
        if (hsh(R.wx * N + x, R.wy * N + y, 7) > 0.5) continue; const list = STOP[q.g.kit] || STOP.grass, key = list[Math.floor(hsh(x, y, 8) * list.length)];
        propsOut.push({ key, x: r2(R.gcx(x) + (hsh(x, y, 9) - 0.5) * 1.4), z: r2(R.gcz(y) + (hsh(x, y, 10) - 0.5) * 1.4), face: Math.round(hsh(x, y, 12) * 360) }); stops++; }
    /* the room-wide scatter (the home room's 70 cave stones), by this room's share of the 63 plots */
    featsOut.push({ k: 'scatter', key: 'cave_stone', n: Math.max(1, Math.round(70 * S.list.length / 63)), seed: 5 });
    /* ── the doors: the seams (room-splitting rule 6; open country = `way: 'open'`, no portal) ── */
    const doorsOut = [], ways = [], seamDoor = {};
    S.seams.forEach(sm => { const e = R.ofHome[sm.plot], sd = sm.side, ns = sd === 'N' || sd === 'S', along = sm.along;
        const onWall = (sd === 'N' && e.row === 0) || (sd === 'S' && e.row === R.rows - 1) || (sd === 'W' && e.col === 0) || (sd === 'E' && e.col === R.cols - 1);
        const bq = sd === 'N' ? [e.col * N + along, e.row * N] : sd === 'S' ? [e.col * N + along, e.row * N + N - 1] : sd === 'W' ? [e.col * N, e.row * N + along] : [e.col * N + N - 1, e.row * N + along];
        if (c2[bq[1]][bq[0]] === 'w') throw new Error(S.id + ': the seam ' + sm.id + ' stands in the water at ' + bq.join(','));
        const d = { id: sm.id, wall: onWall ? sd.toLowerCase() : 'free' };
        if (onWall) { if (ns) d.x = R.gx(e.col * N + along); else d.z = R.gz(e.row * N + along); ways.push({ side: d.wall, at: ns ? d.x : d.z }); }
        else { d.x = ns ? R.gx(e.col * N + along) : R.gcx(bq[0]); d.z = ns ? R.gcz(bq[1]) : R.gz(e.row * N + along); d.face = FACE[sd]; d.passage = Object.assign({}, MOVER.FREE_PASS); }
        if (sm.open) d.passage = Object.assign(d.passage || {}, { w: sm.open });
        Object.assign(d, { way: sm.open ? 'open' : 'trail', label: sm.label, sub: sm.sub, action: { room: sm.room, at: sm.id }, desc: sm.desc });
        d.plotCol = e.col; d.plotRow = e.row; d.side = sd; d.along = along;   // (for the route kit: stripped by the writer)
        doorsOut.push(d); seamDoor[sm.id] = { d, bq }; });
    /* the hand rows (bay doors, links) where their plots stand now */
    R.doors.forEach(d => { if (d.own) { const o = Object.assign({}, d); delete o.own; delete o.plot; delete o.side; doorsOut.push(o); return; }
        const o = { room: S.id, part: S.part, wall: d.wall }; if (d.wall === 'free') Object.assign(o, { x: d.x, z: d.z, face: d.face }); else if (d.wall === 'n' || d.wall === 's') o.x = d.x; else o.z = d.z;
        if (d.wall !== 'free' || d.side === 'free' || d.passage == null) delete o.passage; PLACES[d.id] = o; });
    if (S.giza) { const e = R.ofHome[S.giza.plot]; if (e.col !== 0) throw new Error('the Giza tunnel\'s plot is not on the west wall'); PLACES.giza = { room: S.id, part: S.part, wall: 'w', z: R.gz(e.row * N + S.giza.along) }; ways.push({ side: 'w', at: PLACES.giza.z }); }
    /* ── what stands where (to keep the spawn and the walk off it) ── */
    const sqOf = (x, z) => [Math.floor((x + R.HX) / C + 1e-9), Math.floor((z + R.HZ) / C + 1e-9)], stood = new Set();
    propsOut.forEach(p => { const c = CAT[p.key]; if (c && c.block) stood.add(sqOf(p.x, p.z).join(':')); });
    featsOut.forEach(f => { if (f.k === 'tree' || f.k === 'texbuilding') stood.add(sqOf(f.x, f.z).join(':')); }); R.npc.forEach(n => stood.add(sqOf(n.x, n.z).join(':')));
    const openSq = (x, y) => isPlot(x, y) && c2[y][x] !== 'w' && !stood.has(x + ':' + y);
    const near = (x, y) => { for (let r = 0; r < 6; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (openSq(x + i, y + j)) return [x + i, y + j]; throw new Error(S.id + ': no open square near ' + x + ',' + y); };
    let sp;
    if (S.spawn.home) { const p = R.toRoom(cx(S.spawn.home[0]), cz(S.spawn.home[1])); sp = near(...sqOf(p[0], p[1])); }
    else if (S.spawn.seam) { const { d, bq } = seamDoor[S.spawn.seam], v = SIDE4[d.side]; sp = near(bq[0] - v[0] * 2, bq[1] - v[1] * 2); }
    else { const dd = R.doors.find(q => q.id === S.spawn.door); sp = near(...sqOf(dd.x, dd.z + S.spawn.back * C)); }
    /* ── every plot is reached on foot from the spawn (the home rule: no step steeper than the walker climbs; plateaus are their own) ── */
    { const hC = (x, y) => (hAt(x, y) + hAt(x + 1, y) + hAt(x, y + 1) + hAt(x + 1, y + 1)) / 4, seen = new Uint8Array(Wn * Dn), st = [sp]; seen[sp[1] * Wn + sp[0]] = 1; let steep = 0;
      while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!isPlot(X, Y) || seen[Y * Wn + X]) continue;
          if (Math.abs(hC(X, Y) - hC(x, y)) / C > 0.3) { steep++; continue; } seen[Y * Wn + X] = 1; st.push([X, Y]); } }
      const cold = R.order.filter(e => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(e.row * N + ly) * Wn + e.col * N + lx]) return false; return true; }).map(e => e.name);
      if (cold.length) throw new Error(S.id + ': plots not reached on foot: ' + cold.join(', '));
      Object.keys(seamDoor).forEach(id => { const b = seamDoor[id].bq; if (!seen[b[1] * Wn + b[0]]) throw new Error(S.id + ': the seam ' + id + ' is not reached on foot'); });
      S.steep = steep; }
    /* the air: a district's box moves with its plots (they moved together) */
    const air = [].concat(...S.letters.map(k => AIR_HOME[k] || [])).map(z => { const p = MOVER.homePlot((z.x0 + z.x1) / 2, (z.z0 + z.z1) / 2), e = p && R.ofHome[p.id]; if (!e) return null;
        return Object.assign({}, z, { x0: r2(z.x0 + e.dx), x1: r2(z.x1 + e.dx), z0: r2(z.z0 + e.dz), z1: r2(z.z1 + e.dz) }); }).filter(Boolean);
    ROOMS_OUT.push({ S, R, c2, hAt, names, feats: spaces2.concat(featsOut), own: featsOut, props: propsOut, doors: doorsOut, ways, slope: slope2, paint: paint2, air, lines: S.lines, sp: { x: R.gcx(sp[0]), z: R.gcz(sp[1]), face: S.spawn.face },
        count: { plots: S.list.length, box: R.cols + 'x' + R.rows, world: [R.wx, R.wy], spaces: spaces2.length, props: propsOut.length, features: featsOut.length, doors: doorsOut.length, natives: R.npc.length, stoppers: stops, steepSteps: S.steep, strays: R.strays.length } });
});
if (STRAYS.length) console.log('STRAYS (a piece across two plots that no longer stand the same way):\n  ' + STRAYS.join('\n  '));
ROOMS_OUT.forEach(o => console.log(o.S.id + (o.S.kit ? ' (the route kit writes it)' : '') + ' ' + JSON.stringify(o.count)));

/* ══ THE INSIDES (2026-11-17, Bug Colony's Hive + Ant Nest): a district's `exports.insides(ctx)` = rooms of their own on whole squares (h[y][x] =
   the floor in metres, null = solid up to the roof). Written here as box rooms with a height field: a solid square stands to the roof with sheer
   sides, a floor square's corners are the mean of the floor squares round them (so a run of squares climbing 3.5 m over four is a slope you walk).
   Every floor square must be reached from the door by the walker's step (0.3 of a square). ══ */
const INSIDES = []; ORDER.forEach(k => { if (typeof DISTRICTS[k].insides === 'function') DISTRICTS[k].insides(CTX[k]).forEach(q => INSIDES.push(q)); });
INSIDES.forEach(q => { const { W, D, h } = q, fl = (x, y) => x >= 0 && y >= 0 && x < W && y < D && h[y][x] !== null;
    const corner = (x, y) => { let s = 0, n = 0; [[x - 1, y - 1], [x, y - 1], [x - 1, y], [x, y]].forEach(t => { if (fl(t[0], t[1])) { s += h[t[1]][t[0]]; n++; } }); return n ? s / n : (q.blocks ? 0 : q.wallH); };
    /* `blocks: true` (the Hive): the solid squares are sheer `plateau` blocks (a run of a row each) standing on a floor-high field, so their sides are
       walls, never the field's slope (a field cliff leans half a square into the floor and buries a drawn wall) */
    q.slope = Buffer.alloc(W * D * 8); q.blockRows = [];
    for (let y = 0; y < D; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 8; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((t, k) => q.slope.writeInt16LE(Math.round((fl(x, y) || q.blocks ? corner(x + t[0], y + t[1]) : q.wallH) * 100), o + k * 2)); }
    if (q.blocks) for (let y = 0; y < D; y++) { let x = 0; while (x < W) { if (fl(x, y)) { x++; continue; } let e = x; while (e < W && !fl(e, y)) e++;
        q.blockRows.push({ k: 'plateau', x: r2((x + (e - x) / 2 - W / 2) * C), z: r2((y + 0.5 - D / 2) * C), w: r2((e - x) * C), d: C, h: q.wallH, edge: 0.05 }); x = e; } }
    const avg = (x, y) => (corner(x, y) + corner(x + 1, y) + corner(x, y + 1) + corner(x + 1, y + 1)) / 4, at = (sx, sy) => [r2((sx + 0.5 - W / 2) * C), r2((sy + 0.5 - D / 2) * C)];
    const ds = q.door.sq; if (!fl(ds[0], ds[1])) throw new Error(q.id + ': the door square is solid');
    const seen = new Uint8Array(W * D), st = [ds]; seen[ds[1] * W + ds[0]] = 1; let floors = 0;
    for (let y = 0; y < D; y++) for (let x = 0; x < W; x++) if (fl(x, y)) floors++;
    let got = 1; while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!fl(X, Y) || seen[Y * W + X]) continue;
        if (Math.abs(avg(X, Y) - avg(x, y)) > 0.3 * C) continue; seen[Y * W + X] = 1; got++; st.push([X, Y]); } }
    if (got !== floors) { const miss = []; for (let y = 0; y < D; y++) for (let x = 0; x < W; x++) if (fl(x, y) && !seen[y * W + x]) miss.push(x + ',' + y); throw new Error(q.id + ': ' + miss.length + ' floor squares not reached from the door: ' + miss.slice(0, 12).join(' ')); }
    const dp = at(ds[0], ds[1]), door = Object.assign({ id: q.door.id, wall: q.door.wall }, q.door.wall === 'n' || q.door.wall === 's' ? { x: dp[0] } : { z: dp[1] }, q.door.way ? { way: q.door.way, passage: q.door.passage } : {}, { leaf: q.door.leaf, label: q.door.label, sub: q.door.sub, action: q.door.action, desc: q.door.desc });
    const inw = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[q.door.wall], sp = at(ds[0] + inw[0] * 2, ds[1] + inw[1] * 2);
    Object.assign(q, { floors, doorRow: door, sp: { x: sp[0], z: sp[1], face: { n: 0, s: 180, e: 270, w: 90 }[q.door.wall] }, npcOut: q.npc.map(n => { const p = at(n.sq[0], n.sq[1]); return { x: p[0], z: p[1], face: n.face, race: n.race }; }),
        dp });
    q.npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); }); q.props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); });
    console.log(q.id + ': ' + W + ' x ' + D + ' squares, ' + floors + ' floor squares, all reached from the door; ' + q.looks.length + ' drawn rows, ' + q.props.length + ' props, ' + q.npc.length + ' people'); });

/* THE EXPORT (the joining rule): `--export <part> <file>` hands one stood district to the route kit as JSON and writes nothing else */
{ const xi = process.argv.indexOf('--export'); if (xi >= 0) { const o = ROOMS_OUT.find(q => q.S.part === process.argv[xi + 1]); if (!o) throw new Error('no room with part ' + process.argv[xi + 1]);
    const { S, R } = o, hs = []; for (let y = 0; y <= R.D; y++) for (let x = 0; x <= R.W; x++) hs.push(Math.round(o.hAt(x, y) * 100) / 100);
    fs.writeFileSync(process.argv[xi + 2], JSON.stringify({ id: S.id, part: S.part, label: S.label, wx: R.wx, wy: R.wy, cols: R.cols, rows: R.rows, W: R.W, D: R.D, fill: '\u0001',
        plots: R.order.map(e => ({ col: e.col, row: e.row, name: e.name, district: e.district, level: e.level })), cell: o.c2.map(r => r.join('')), h: hs,
        floor: 'grass_2', pal: PAL, paint: Array.from(o.paint), paintHalf: true, features: o.own, props: o.props, npc: R.npc, doors: o.doors, lines: o.lines, air: o.air, sp: o.sp }));
    process.exit(0); } }
const stripDoor = d => { const o = Object.assign({}, d); delete o.plotCol; delete o.plotRow; delete o.side; delete o.along; return o; };
/* ── the rooms ── */
const L = [];
L.push("        /* LEYLINES63-BEGIN — LEYLINES ON PLOTS (2026-11-16) + THE ONE WORLD MOVE (2026-11-17: the six districts stand at their One World places, three rooms here + Bug Colony in the route kit's L14 room): written by `node bake-leylines.js` from docs/areas/leylines/layout.json + districts/*.js + docs/plans/one-world/plots.json. Never hand-edit between the markers; edit the tool, the layout or a district file and rerun. */");
ROOMS_OUT.forEach(o => { const { S, R } = o; if (S.kit) return;
    const w = 2 * R.HX, d = 2 * R.HZ, atmos = o.air.length ? " atmos: " + J({ kind: 'dust', color: 0xe8d8b8, n: Math.max(20, Math.round(60 * S.list.length / 63)), zones: o.air }) + "," : "";
    const zones = []; for (let r = 0; r < R.rows; r++) for (let c = 0; c < R.cols; c++) zones.push({ x0: R.gx(c * N), z0: R.gz(r * N), x1: R.gx((c + 1) * N), z1: R.gz((r + 1) * N), none: true });
    L.push("        " + S.id + ": {");
    L.push("            label: " + J(S.label) + ",");
    L.push("            sub: " + J(S.sub) + ",");
    L.push("            kind: 'box', site: 'prebuilt_gobekli', part: " + J(S.part) + ",");
    L.push("            /* THE ONE WORLD: where this room stands on the world's plot grid (data.js hqOwIndex) */");
    L.push("            world: { hub: 'ley', layer: 'surface', wx: " + R.wx + ", wy: " + R.wy + " },");
    L.push("            shell: hqAncientShell({ w: " + w + ", d: " + d + ", h: 32, wallH: 32, floor: 'grass_2', apron: 'grass_2', skirt: 'dirt_2', apronColor: 0xffffff, floorColor: 0xffffff, plate: { x: " + o.sp.x + ", z: " + o.sp.z + ", y: 5.0 },");
    L.push("                                    mood: { lamp: 0xffb060, glow: 0xff9a40, strip: 0xffd8a0, light: 0xfff0d8, ambient: 0.58 }," + atmos);
    L.push("                                    sky: { night: 0, tint: 0xbfd0c0, tintAmt: 0.3, stars: 0.6, nebula: 0.5, day: 1, clouds: 0.3, fog: { color: 0xc4ccb8, amount: 0.5, top: 0.05, band: 0.45, density: 0.01 }, scenery: 'none', landmarks: 'world' },");
    L.push("                                    look: HQ_ROOM_LOOKS.henge }),");
    L.push("            parti: " + J(S.parti) + ",");
    L.push("            typology: 'grid',");
    L.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", n: " + R.cols + ", nx: " + R.cols + ", nz: " + R.rows + ", mask: " + J(R.mask) + ", names: " + J(o.names) + " },");
    L.push("            terrain: {");
    L.push("                res: 1.75, floor: 'grass_2', cliff: 'rocks_5', path: 'dirt_2',");
    L.push("                noise: { amp: 0.06, scale: 9 },");
    L.push("                /* THE HORIZON READS THE MAP: the land past every line is the world's own ground there, plot by plot (three-renderer.js _hqEdgeLandFn `world`) */");
    L.push("                backdrop: false, edges: { world: true, reach: 440, ways: " + J(o.ways) + " },");
    L.push("                slope: { cells: { res: " + C + ", x0: " + R.gx(0) + ", z0: " + R.gz(0) + ", nx: " + R.W + ", nz: " + R.D + ", d: '" + o.slope.toString('base64') + "' } },");
    L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + (C / 2) + ", x0: " + r2(-R.HX + C / 4) + ", z0: " + r2(-R.HZ + C / 4) + ", nx: " + (2 * R.W) + ", nz: " + (2 * R.D) + ", d: '" + Buffer.from(o.paint).toString('base64') + "' },");
    L.push("                marks: [],");
    L.push("                /* OPEN GROUND ON THE PLOTS: every square of a plot is a `space`; a cell of the box that is no plot of this room is ground nobody walks (no trees grow) */");
    L.push("                gen: { kind: 'plan', look: 'trees', seed: 7, rim: 0, forceGrow: 0, treeGap: 2.6, treeIn: 0.9, spacing: 3.5, depth: 5.25, maxTrees: 0, treeH: [5.5, 8.5], kinds: ['tree_53'], zones: " + J(zones) + " },");
    L.push("                features: [");
    o.feats.forEach(f => L.push("                    " + J(f) + ","));
    L.push("                ],");
    L.push("            },");
    L.push("            doors: [");
    o.doors.forEach(dr => L.push("                " + J(stripDoor(dr)) + ","));
    L.push("            ],");
    L.push("            counters: [],");
    L.push("            props: [");
    for (let i = 0; i < o.props.length; i += 4) L.push("                " + o.props.slice(i, i + 4).map(J).join(", ") + ",");
    L.push("            ],");
    L.push("            agents: [],");
    L.push("            npcSpots: " + J(R.npc) + ",");
    L.push("            onlineSpots: [],");
    L.push("            lines: " + J(o.lines) + ",");
    L.push("            spawn: { x: " + o.sp.x + ", z: " + o.sp.z + ", face: " + o.sp.face + " },");
    L.push("        },"); });
INSIDES.forEach(q => { const w = q.W * C, d = q.D * C, sh = q.shell;
    L.push("        " + q.id + ": {");
    L.push("            label: " + J(q.label) + ",");
    L.push("            sub: " + J(q.sub) + ",");
    L.push("            kind: 'box', site: 'prebuilt_gobekli', part: " + J(q.part) + ",");
    L.push("            shell: { w: " + w + ", d: " + d + ", h: " + q.wallH + ", wallH: " + q.wallH + ", dadoH: 1.2, open: false,");
    L.push("                     floor: " + J(sh.floor) + ", wall: " + J(sh.wall) + ", dado: " + J(sh.wall) + ", trim: " + J(sh.wall) + ", ceiling: " + J(sh.ceiling) + ", ceilTile: 1.75,");
    L.push("                     floorColor: " + sh.floorColor + ", wallColor: " + sh.wallColor + ", dadoColor: " + sh.wallColor + ", ceilColor: " + sh.ceilColor + ",");
    L.push("                     pipes: false, strips: false, lights: [],");
    L.push("                     mood: " + J(q.mood) + ",");
    L.push("                     fog: " + J(q.fog) + ",");
    L.push("                     plate: { x: " + q.sp.x + ", z: " + q.sp.z + ", y: " + r2(q.wallH - 2) + " } },");
    L.push("            terrain: {");
    L.push("                floor: " + J(q.floor) + ", cliff: " + J(q.cliff) + ", path: " + J(q.floor) + ", noise: { amp: 0 }, crag: false, levelM: 3.5, res: 1.75, backdrop: false,");
    L.push("                slope: { cells: { res: " + C + ", x0: " + r2(-w / 2) + ", z0: " + r2(-d / 2) + ", nx: " + q.W + ", nz: " + q.D + ", d: '" + q.slope.toString('base64') + "' } },");
    /* one paint sheet (the floor): a room with slope cells + paint draws its cliffs sheer (three-renderer.js steepCliff) */
    L.push("                paint: { pal: " + J([q.floor]) + ", t: 'u8', res: " + (C / 2) + ", x0: " + r2(-w / 2 + C / 4) + ", z0: " + r2(-d / 2 + C / 4) + ", nx: " + (2 * q.W) + ", nz: " + (2 * q.D) + ", d: '" + Buffer.alloc(4 * q.W * q.D).toString('base64') + "' },");
    L.push("                features: [");
    q.blockRows.forEach(f => L.push("                    " + J(f) + ","));
    q.looks.forEach(a => L.push("                    " + J({ k: 'arch', id: 'ley:' + a.id + ':look', x: a.x, z: a.z, y: a.y == null ? 0 : a.y, rot: 0, parts: a.parts }) + ","));   // (y: a drawn row stands on the room's floor, never on a solid square's top)
    L.push("                ],");
    L.push("            },");
    L.push("            doors: [");
    L.push("                " + J(q.doorRow) + ",");
    L.push("            ],");
    L.push("            counters: [],");
    L.push("            props: [");
    for (let i = 0; i < q.props.length; i += 4) L.push("                " + q.props.slice(i, i + 4).map(J).join(", ") + ",");
    L.push("            ],");
    L.push("            agents: [],");
    L.push("            npcSpots: " + J(q.npcOut) + ",");
    L.push("            onlineSpots: [],");
    L.push("            lines: " + J(q.lines) + ",");
    L.push("            spawn: " + J(q.sp) + ",");
    L.push("        },"); });
L.push("        /* LEYLINES63-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
/* the rows in data.js that name a place in these rooms (written by hand there): the tool refuses to bake when one has drifted */
const fx = o => o.wall === 'free' ? "wall: 'free', x: " + o.x + ", z: " + o.z + ", face: " + o.face : o.wall === 'n' || o.wall === 's' ? "wall: '" + o.wall + "', x: " + o.x : "wall: '" + o.wall + "', z: " + o.z;
const WANT = [
    ["prebuilt_gobekli: { room: '" + PLACES.bay.room + "', door: { id: 'bay', " + fx(PLACES.bay) + " } }", 'siteRooms.entry.prebuilt_gobekli'],
    ["prebuilt_stonehenge: { room: '" + PLACES.bay56.room + "', door: { id: 'bay56', " + fx(PLACES.bay56) + " } }", 'siteRooms.entry.prebuilt_stonehenge'],
    ["prebuilt_babel: { room: '" + PLACES.bay11.room + "', door: { id: 'bay11', " + fx(PLACES.bay11) + " } }", 'siteRooms.entry.prebuilt_babel'],
    ["prebuilt_technoticlan: { room: '" + PLACES.bay2012.room + "', door: { id: 'bay2012', " + fx(PLACES.bay2012) + " } }", 'siteRooms.entry.prebuilt_technoticlan'],
    ["a: { site: 'prebuilt_gobekli', part: '" + PLACES.giza.part + "', " + fx(PLACES.giza) + ",", 'link gobekli_giza (a)'],
    ["a: { site: 'prebuilt_gobekli', part: '" + PLACES.xibalba.part + "', " + fx(PLACES.xibalba) + ",", 'link technoticlan_agartha (a)'],
];
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at these rooms yet (see the rows above)'); }
if (DRY) { ROOMS_OUT.forEach(o => console.log(o.S.id + ' doors ' + JSON.stringify(o.doors.map(d => [d.id, d.wall, d.x, d.z, d.face])) + ' spawn ' + JSON.stringify(o.sp))); process.exit(0); }
const END = '        /* LEYLINES63-END */\n', b0 = src.indexOf('        /* LEYLINES63-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else throw new Error('the LEYLINES63 markers are not in data.js');
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOMS_OUT.filter(o => !o.S.kit).map(o => o.S.id).join(', ') + ' written (' + block.length + ' bytes). Then: node bake-route.js L14 (Bug Colony\'s room, with L15).');
