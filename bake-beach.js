#!/usr/bin/env node
/* bake-beach.js — THE BEACH ON PLOTS (2026-11-15, mondo's OK on plot plan 3 + his answers: the size "fine for now", the Triangle "fine", "add a
   remote island with a volcano and unconnected tribe (eventually will make models for)", the plain plot labels "fine for now", the Beach Huts
   "walk ins", the old PvP board kept "for now"). The sixth area of the world plan: 14 x 10 plots of 12 x 12 squares (588 x 420 m), four districts:
   THE SHORE (the west coast, off Disaster City's Bayside), THE HARBOUR (the Quay, the Long Pier, the Flying Dutchman), THE OCEAN (open water you
   sail by skiff and swim, the Volcano Island far out north) and THE BERMUDA TRIANGLE (a 3-4-5 right triangle of sea: the Lighthouse Rock, the Cay
   island and the Maelstrom at its corners).
   Reads docs/areas/beach/layout.json (the approved plan 4: every plot's name, district, level and the 168 x 120 square map) and writes the room
   `site_prebuilt_bermuda_beach` into data.js between BEACH140-BEGIN / BEACH140-END. `node bake-beach.js` writes; `--dry-run` prints the counts;
   `BEACH_DUMP=1` prints the height map. Never hand-edit between the markers: edit this tool or the layout and rerun.
   Notes: docs/notes/areas-complexes.md "THE BEACH ON PLOTS".
   HOW THE ROOM IS MADE: a SEA room (terrain.sea at 0, the old Bermuda sea room's way: no plan walls, the whole field is walked, waded, swum or
   sailed). THE HEIGHTS ARE THE MAP: terrain.slope.cells carries every square's four corners. Sand rises from the waterline by its distance to
   the water (a beach everywhere), the sea floor falls by its distance from the sand (a wade, then a swim), and the hard squares (the quay, the
   piers, rock, the ship, the volcano) stand flat with a step at their edge: a step taller than the walker climbs is the wall.
   Squares are (sx 0..168 west to east, sy 0..120 north to south); gx() / gz() = a square's west / north line in metres, mx() / mz() = its middle. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const LAYOUT = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/beach/layout.json'), 'utf8')), PLAN = LAYOUT.rooms[0];
const DIST = { 'The Shore': 'S', 'The Harbour': 'H', 'The Ocean (NEW)': 'O', 'The Bermuda Triangle': 'T' };
const C = 3.5, N = 12, GX = PLAN.cols, GZ = PLAN.rows, W = N * GX, H = N * GZ, PL = N * C, HW = W * C / 2, HD = H * C / 2, ROOM = 'site_prebuilt_bermuda_beach';
const r2 = v => Math.round(v * 100) / 100, gx = c => r2(-HW + c * C), gz = c => r2(-HD + c * C), mx = c => gx(c + 0.5), mz = c => gz(c + 0.5);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
/* the old rooms' people keep their own lines: read from the old literals (so the old Harbour and Bermuda sea literals must stay in data.js) */
const OLDR = id => JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [] } : { n: [], l: [] })(DOOR_HQ.rooms.' + id + '))', D));
const O_SEA = OLDR('site_prebuilt_bermuda_sea'), O_HARB = OLDR('site_prebuilt_downtown_harbour');
const sayOf = (R, race) => (R.n.find(n => n.race === race) || {}).say;
const cell = PLAN.cells.map(r => r.split(''));
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); p.d = DIST[p.district]; if (!p.d) throw new Error('district? ' + p.district); plot[p.x + ':' + p.y] = p; });
const Pxy = (x, y) => plot[Math.max(0, Math.min(GX - 1, Math.floor(x / N))) + ':' + Math.max(0, Math.min(GZ - 1, Math.floor(y / N)))];
const F = [], props = [], doors = [], npc = [], ARCH = [], count = {}, taken = new Set(), errs = [];
const feat = o => { F.push(o); return o; };
let seed = 345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const setRect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ch; };

/* ── what the tool does to the plan's squares ──
   THE FLYING DUTCHMAN (mondo 11-15: "we literally have a dutchman ship from the dutchman pvp map. why not just use that exact ship??"): she IS
   that ship, at her own size. Her main deck room (`site_prebuilt_revenge_deck`, 34 x 14 squares) is read here: the squares she stands on ('X')
   are a flat block hidden inside her hull (it keeps the walker, the swimmer and the skiff out), and `terrain.moored` has the renderer draw her own
   hull, decks, masts, sails and rigging there (three-renderer.js _hqBuildMoored: the Dutchman map's own galleon builder). Bow east, her stern at
   the Long Pier's end. The plan's 7 x 6 block was only her berth's mark. */
const SHIP_ROOM = 'site_prebuilt_revenge_deck', SHIP_W = 34, SHIP_D = 14, SHIP = [35, 56, 35 + SHIP_W, 56 + SHIP_D];
setRect(39, 51, 46, 57, 'w'); setRect(SHIP[0], SHIP[1], SHIP[2], SHIP[3], 'X');
/* ALONGSIDE (mondo 11-15: "berth her along the side of the pier"): she lies south of the Long Pier, her port side to it (one square of water
   between: her hull's swell), and the pier runs on east past the plan's end to her forecastle, so you walk her whole waist before you board */
const PIER_END = 57; setRect(39, 53, PIER_END, 55, 'j');
const SHIP_AT = { x: gx((SHIP[0] + SHIP[2]) / 2), z: gz((SHIP[1] + SHIP[3]) / 2) };
const SHIP_H = JSON.parse(vm.runInContext(`(() => { const r = DOOR_HQ.rooms.${SHIP_ROOM}, i = hqTerrainInfo('${SHIP_ROOM}'), o = [];
    if (!r || !i || !(r.terrain.float && r.terrain.float.hull && r.terrain.float.hull.kind === 'galleon') || Math.round(r.shell.w / ${C}) !== ${SHIP_W} || Math.round(r.shell.d / ${C}) !== ${SHIP_D}) return 'null';
    for (let y = 0; y < ${SHIP_D}; y++) for (let x = 0; x < ${SHIP_W}; x++) o.push(Math.round((hqTerrainHeight(i, (x + 0.5 - ${SHIP_W} / 2) * ${C}, (y + 0.5 - ${SHIP_D} / 2) * ${C}) - r.terrain.sea.y) * 100) / 100);
    return JSON.stringify(o); })()`, D));
const SHIP_BLOCK = SHIP_H ? r2(Math.min.apply(null, SHIP_H) - 0.8) : 0;   // a flat block hidden inside her hull (her decks are drawn by the renderer): it keeps the walker, the swimmer and the skiff out
if (!SHIP_H || SHIP_BLOCK < 2) throw new Error('the Dutchman\'s main deck room is not the 34 x 14 galleon this tool berths');
setRect(29, 65, 31, 68, 'w');                               // THE SKIFF: the plan's block is the boat herself (a prop afloat at the jetty's end)
/* every plan `B` that stands on sand / quay / rock is named here; the squares become its ground again and the building is built by a row below */
const B_HUTS = [[2, 50], [5, 50], [8, 50]], B_GUARD = [15, 65], B_SHED = [26, 39], B_LIGHT = [65, 101], B_WRECK = [99, 89], B_TRIBE = [[113, 15], [115, 17], [112, 18]];
B_HUTS.forEach(q => setRect(q[0], q[1], q[0] + 2, q[1] + 2, 'd')); setRect(B_GUARD[0], B_GUARD[1], B_GUARD[0] + 2, B_GUARD[1] + 2, 'd'); setRect(B_SHED[0], B_SHED[1], B_SHED[0] + 3, B_SHED[1] + 3, 'o');
setRect(B_LIGHT[0], B_LIGHT[1], B_LIGHT[0] + 2, B_LIGHT[1] + 2, 'r'); cell[B_WRECK[1]][B_WRECK[0]] = 'd'; B_TRIBE.forEach(q => { cell[q[1]][q[0]] = 'd'; });
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (cell[y][x] === 'B') throw new Error('a plan building nobody builds at ' + x + ',' + y); if (cell[y][x] === 'T') cell[y][x] = 't'; }   // t = sand under a palm grove
/* planks: over water they are a PIER ('J', a hard deck); on sand they are boards laid on the beach ('j', the Boardwalk) */
{ const seen = new Set(), key = (x, y) => x + ':' + y;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (cell[y][x] !== 'j' || seen.has(key(x, y))) continue;
      const comp = [], st = [[x, y]]; seen.add(key(x, y)); let wet = false;
      while (st.length) { const [a, b] = st.pop(); comp.push([a, b]); for (const [dx, dy] of N8.slice(0, 4)) { const X = a + dx, Y = b + dy; if (!inb(X, Y)) continue; if (cell[Y][X] === 'w') wet = true; if (cell[Y][X] === 'j' && !seen.has(key(X, Y))) { seen.add(key(X, Y)); st.push([X, Y]); } } }
      if (wet) comp.forEach(q => { cell[q[1]][q[0]] = 'J'; }); } }

/* ── THE HEIGHTS ── */
const SOFT = 'dDtjwua', WET = 'wuaJX', BEACH = 'dDtj';
const isSoft = ch => SOFT.includes(ch);
function distTo(match) {   // every square's distance (in squares, corner steps count) to the nearest square that matches
    const d = new Int16Array(W * H).fill(999), q = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (match(cell[y][x], x, y)) { d[y * W + x] = 0; q.push(x, y); }
    for (let i = 0; i < q.length; i += 2) { const x = q[i], y = q[i + 1], v = d[y * W + x] + 1; for (const [dx, dy] of N8) { const X = x + dx, Y = y + dy; if (inb(X, Y) && d[Y * W + X] > v) { d[Y * W + X] = v; q.push(X, Y); } } }
    return d;
}
const dWet = distTo(ch => WET.includes(ch)), dBeach = distTo(ch => BEACH.includes(ch)), dNotDune = distTo(ch => ch !== 'D'), dNotCone = distTo(ch => ch !== 'h' && ch !== 'l'), dLava = distTo(ch => ch === 'l');
const SEA_BED = -3.5, PIER = 0.6, QUAY = 0.9, CAP = [0.6, 1.2, 2.0, 2.0, 2.0];
const hc = new Float32Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x], k = y * W + x, p = Pxy(x, y); let h;
    if (ch === 'w') h = dBeach[k] > 900 ? SEA_BED : Math.max(SEA_BED, -(0.45 + 0.7 * (dBeach[k] - 1)));
    else if (ch === 'u') h = -0.8;                                                                              // the reef: waded
    else if (ch === 'a') h = -9;                                                                                // the drop under the Maelstrom
    else if (ch === 'D') h = Math.min(0.3 + 0.6 * (dWet[k] - 1), 1.2 + 0.45 * (dNotDune[k] - 1) + 0.35 * Math.sin(x * 0.9) * Math.cos(y * 0.7), 3.6);
    else if (BEACH.includes(ch)) h = Math.min(CAP[p.level] || 0.6, 0.3 + 0.3 * (dWet[k] - 1));
    else if (ch === 'J') h = PIER;
    else if (ch === 'o') h = QUAY;
    else if (ch === 'X') h = SHIP_BLOCK;                                                                         // the block inside her hull, under her lowest deck
    else if (ch === 'r') h = p.d === 'T' ? 3.4 : p.d === 'H' ? 1.6 : 2.4 + 0.5 * Math.sin(x * 1.3 + y * 0.8);  // the Lighthouse Rock, the Breakwater, the headlands
    else if (ch === 'h') h = 2.5 + 4.2 * (dNotCone[k] - 1) + 0.6 * Math.sin(x * 1.7) * Math.cos(y * 1.1);        // the cone: too steep to climb
    else if (ch === 'l') h = 2.5 + 4.2 * 3.2;                                                                   // the crater's lava, under the rim
    else throw new Error('a square nobody knows: ' + ch + ' at ' + x + ',' + y);
    hc[k] = h; }
/* a building's sand is level (its own squares and one round them) */
const flat = (x0, y0, x1, y1) => { const p = Pxy((x0 + x1) / 2, (y0 + y1) / 2), ref = CAP[p.level] || 0.6;
    for (let y = y0 - 1; y <= y1; y++) for (let x = x0 - 1; x <= x1; x++) if (inb(x, y) && BEACH.includes(cell[y][x])) { const own = x >= x0 && x < x1 && y >= y0 && y < y1; if (own && dWet[y * W + x] < 2) errs.push('a building stands in the wash at ' + x + ',' + y); if (own || dWet[y * W + x] >= 3) hc[y * W + x] = ref; } return ref; };
/* corners: a soft square (sand, sea floor) shares its corners with the soft squares round it (one surface); a hard square keeps its own
   height at all four (flat), and the cone and the rock share theirs with their own kind (a crag, not a staircase) */
const group = ch => isSoft(ch) ? 's' : (ch === 'h' || ch === 'l') ? 'h' : ch === 'r' ? 'r' : null;
const slope = Buffer.alloc(W * H * 8);
function corner(cx, cy, g) { let s = 0, n = 0; for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const X = cx + dx, Y = cy + dy; if (inb(X, Y) && group(cell[Y][X]) === g) { s += hc[Y * W + X]; n++; } } return s / n; }
const cornerH = (x, y, qx, qy) => { const g = group(cell[y][x]); return g ? corner(x + qx, y + qy, g) : hc[y * W + x]; };
function writeSlope() { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 8; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((q, k) => slope.writeInt16LE(Math.round(cornerH(x, y, q[0], q[1]) * 100), o + k * 2)); } }

/* ── THE BUILDINGS (the Estate's helper): a hollow `texbuilding` (the walls you bump, the doorway, the swinging leaf, the inside) with its own
   outside switched off + its look as an `arch` parts list. Parts frame: the building's middle, x along the front, +z out of the front, y up. ── */
const U = n => 'urban:' + n, WD = U('WoodGeneric1b'), WD2 = U('WoodGeneric1a'), SHG = U('WoodGeneric2a'), FLR = U('WoodFlooring1d'), GLS = U('GlassWindowTall1a'), COR = U('MetalCorrugated1a'), BRK = U('BrickMasonry1a'), SHUT = U('GlassWindowResidentialShutter1');
const ROT = { S: 0, W: 90, N: 180, E: 270 };
function sheet() {
    const P = [];
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); if (/GlassWindow/.test(key || '') && o.glow == null) o.glow = 0.3; P.push(o); return o; };
    const A = { P,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, o),
        roof: (form, x, y, z, w, h, d, key, tint, o) => { add({ s: 'box', p: [x, y, z], size: [w, 0.02, d], sides: false, top: false, under: true, roof: true, ry: (o && o.ry) || 0 }, WD2, 0x4a3626);
            return add({ s: 'roof', form, p: [x, y, z], size: [w, h, d], roof: true }, key, tint, o); },
        shell(w, h, d, key, tint, door, uv, gain) { const e = 0.05, Wd = w + 2 * e, Dp = d + 2 * e, x = uv ? (gain ? { uv, gain } : { uv }) : null;
            add({ s: 'box', p: [0, 0, 0], size: [Wd, h, Dp], top: false, faces: 'blr' }, key, tint, x);
            add({ s: 'quad', p: [0, 0, r2(Dp / 2)], size: [Wd, h], ry: 0, hole: [r2(door.lx), r2(door.cw), 2.2] }, key, tint, x); },
        frame(door, d, key, tint) { A.box(door.lx - door.cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, key, tint); A.box(door.lx + door.cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, key, tint); A.box(door.lx, 2.25, d / 2 + 0.1, door.cw + 0.5, 0.2, 0.2, key, tint); },
        sign(words, x, y, z, w, h, fg, bg, font, o) { P.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], key: 'txt:' + words + '|' + fg + '|' + bg + '|' + r2(w / h) + '||' + font, uv: 'fit', kind: 'wall' }, o || {})); } };
    return A;
}
function texbDoor(w, door) { const L = Math.max(2, w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (door >= 1) col = Math.min(cols - 1, Math.round(door) - 1); return { lx: -L / 2 + (col + 0.5) * cw, cw }; }
function building(id, q, h, o, parts) {
    const [sx0, sy0, sx1, sy1, side] = q, ew = side === 'E' || side === 'W', fw = (ew ? sy1 - sy0 : sx1 - sx0) * C, fd = (ew ? sx1 - sx0 : sy1 - sy0) * C, cx = gx((sx0 + sx1) / 2), cz = gz((sy0 + sy1) / 2), rot = ROT[side];
    const row = Object.assign({ k: 'texbuilding', id: 'bch:' + id, seed: 1, x: cx, z: cz, w: fw, d: fd, rot, storeys: 1, h, skin: false, hollow: true, leaf: 'leaf_shabby_wood', leafDouble: false, keyIn: WD2, floorIn: FLR }, o || {});
    Object.keys(row).forEach(k => { if (row[k] === undefined) delete row[k]; });
    feat(row); if (BEACH.includes(cell[sy0][sx0])) flat(sx0, sy0, sx1, sy1);
    for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) taken.add(x + ':' + y);
    const a = sheet(), door = texbDoor(fw, row.door); parts(a, fw, fd, door);
    ARCH.push({ k: 'arch', id: 'bch:' + id + ':look', x: cx, z: cz, rot, parts: a.P });
    const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    count.buildings = (count.buildings || 0) + 1;
    return { at: (lx, lz) => [r2(cx + lx * c - lz * s), r2(cz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd, door, cx, cz, rot };
}
const put = (B, key, lx, lz, o) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, o || {}); if (r.face != null) r.face = B.face(r.face); props.push(r); };   // `face` in the building's frame
function look(id, x, z, rot, fn) { const a = sheet(); fn(a); ARCH.push({ k: 'arch', id: 'bch:' + id + ':look', x: r2(x), z: r2(z), rot: rot || 0, parts: a.P }); }

/* THE BEACH HUTS (walk-in, mondo: "walk ins"): three painted plank huts in a row, each its own colour, a striped gable, a step, a porch post pair */
/* THE PAINT (seen on screen 11-15: a colour over the brown board sheet read as mud; mondo "brighten the huts"): Bayside's way (districts/B.js) —
   a painted wall takes `gain` (the tint times it, past white), the roof is the painted corrugated sheet, the trim is plain paint (no sheet) */
const PAINT = 2.3, CORR = U('MetalCorrugatedPainted1a');
const HUT_COL = [[0x7fdcec, 0xffffff, 0xff5a7a], [0xffe27a, 0xffffff, 0x38b0aa], [0xffa590, 0xffffff, 0x44669c]];   // aqua / lemon / coral walls, white trim, a hot roof each
const HUTS = B_HUTS.map((q, i) => building('hut' + (i + 1), [q[0], q[1], q[0] + 2, q[1] + 2, 'S'], 3.0, { leaf: 'leaf_white_wood' }, (a, w, d, door) => {
    const [COL, TRIM, ROOF] = HUT_COL[i];
    a.shell(w, 3.0, d, WD, COL, door, [3.5, 1.75], PAINT);
    a.box(0, 0, 0, w - 0.1, 0.14, d - 0.1, FLR, 0xc8b490, { uv: [1.75, 1.75] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.24, 3.0, 0.24, null, TRIM);
    a.roof('gable', 0, 3.0, 0, w + 0.7, 2.0, d + 0.9, CORR, ROOF, { keyEnd: WD, tintEnd: COL, gain: 2.0 });
    for (let k = -2; k <= 2; k++) a.box(k * 1.3, 3.0, d / 2 + 0.47, 0.5, 0.06, 0.04, null, k % 2 ? ROOF : TRIM);                              // the striped fascia
    a.frame(door, d, null, TRIM);
    a.box(0, 0, d / 2 + 0.6, w, 0.14, 1.2, FLR, 0xc8b490);                                                             // the step
    for (const s of [-1, 1]) a.box(s * (w / 2 + 0.06), 1.1, 0, 0.08, 1.1, 1.3, SHUT, 0xe8e4d8, { uv: 'fit', faces: s < 0 ? 'l' : 'r', top: false });
}));
put(HUTS[0], 'surfboard_rack', -2.2, -2.2, { face: 90 }); put(HUTS[0], 'surfboard_long', 2.6, -2.4, { face: 20 }); put(HUTS[0], 'beach_life_ring', 2.9, 0.6, { y: 1.5 }); put(HUTS[0], 'beach_cooler', 2.2, 2.0);
put(HUTS[1], 'cot', -2.0, -1.6, { face: 0 }); put(HUTS[1], 'sea_chest', 2.4, -2.4, { face: 270 }); put(HUTS[1], 'retro_radio', 2.5, 0.4); put(HUTS[1], 'rug_round', 0, 0.2, { y: 0.15 }); put(HUTS[1], 'ship_lantern', -2.6, 2.2);
put(HUTS[2], 'beach_air_mattress_blue', -2.0, -2.0, { face: 0 }); put(HUTS[2], 'beach_air_mattress_pink', -2.0, -0.4, { face: 0 }); put(HUTS[2], 'beach_swim_ring', 2.4, -2.4); put(HUTS[2], 'beach_ball', 2.2, 0.2); put(HUTS[2], 'folding_chair', 2.0, 2.2, { face: 200 });
/* THE LIFEGUARD HUT (the Shore's landmark, walk-in): a white plank hut, a red roof, the red cross board, its front to the sea */
const GUARD = building('lifeguard', [B_GUARD[0], B_GUARD[1], B_GUARD[0] + 2, B_GUARD[1] + 2, 'E'], 3.2, { leaf: 'leaf_white_wood' }, (a, w, d, door) => {
    const WHITE = 0xffffff, RED = 0xe8483c;
    a.shell(w, 3.2, d, WD, WHITE, door, [3.5, 1.75], PAINT);
    a.box(0, 0, 0, w - 0.1, 0.14, d - 0.1, FLR, 0xc8b490, { uv: [1.75, 1.75] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.26, 3.2, 0.26, WD2, RED);
    a.roof('pyramid', 0, 3.2, 0, w + 1.2, 1.9, d + 1.2, CORR, RED, { gain: 2.0 });
    a.frame(door, d, WD2, RED);
    a.box(0, 0, d / 2 + 0.9, w + 0.4, 0.14, 1.8, FLR, 0xc8b490);                                                        // the deck before the door
    a.box(2.2, 1.9, d / 2 + 0.07, 0.9, 0.3, 0.06, WD2, RED); a.box(2.2, 1.6, d / 2 + 0.07, 0.3, 0.9, 0.06, WD2, RED);     // the red cross
    a.cyl(-w / 2 - 0.3, 0, d / 2 + 0.3, 0.05, 5.4, WD2, WHITE); a.box(-w / 2 - 0.3 + 0.45, 4.7, d / 2 + 0.3, 0.9, 0.6, 0.03, null, RED);   // the flag
});
put(GUARD, 'cot', -2.0, -2.0, { face: 0 }); put(GUARD, 'beach_life_ring', -2.9, 1.0, { y: 1.5 }); put(GUARD, 'beach_life_ring', 2.9, -1.0, { y: 1.5 }); put(GUARD, 'tool_chest', 2.3, -2.4, { face: 270 }); put(GUARD, 'retro_radio', 2.4, 0.6);
/* THE QUAY SHED (walk-in): tarred boards, a tin roof, wide doors onto the quay; crates, nets and pots inside */
const SHED = building('shed', [B_SHED[0], B_SHED[1], B_SHED[0] + 3, B_SHED[1] + 3, 'S'], 4.2, { leaf: 'leaf_barn', leafDouble: true, floorIn: U('WoodFlooring1a') }, (a, w, d, door) => {
    const TAR = 0x4a4038, TRIM = 0xd8d0bc;
    a.shell(w, 4.2, d, WD, TAR, door, [3.5, 1.75]);
    a.box(0, 0, 0, w - 0.1, 0.14, d - 0.1, U('WoodFlooring1a'), 0x8a7c68, { uv: [1.75, 1.75] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.3, 4.2, 0.3, WD2, TRIM);
    a.roof('gable', 0, 4.2, 0, w + 0.8, 2.4, d + 0.8, COR, 0x6a7078, { keyEnd: WD, tintEnd: TAR });
    a.frame(door, d, WD2, TRIM);
    a.sign('HARBOUR', door.lx, 2.9, d / 2 + 0.08, 3.4, 0.7, '#e8e0c8', '#2a2622', 'stencil');
});
put(SHED, 'lobster_traps', -3.6, -3.4, { face: 0 }); put(SHED, 'fishing_net_wall', 0, -5.0, { y: 1.4, face: 0 }); put(SHED, 'psx_wooden_crate_1', 3.6, -3.6); put(SHED, 'psx_wooden_crate_2', 3.8, -1.8); put(SHED, 'psx_metal_barrel_mp_1', -3.8, -0.6);
put(SHED, 'ship_anchor', 3.4, 2.6, { face: 110 }); put(SHED, 'ship_lantern', -3.8, 3.4); put(SHED, 'meshy_rope', -1.6, -3.8); put(SHED, 'sea_chest', -3.6, 1.6, { face: 90 });

/* the tribe's three open shelters on the Volcano Island (their people come later: mondo "eventually will make models for"): four posts and a
   cone of thatch each, walked under */
B_TRIBE.forEach((q, i) => look('shelter' + (i + 1), mx(q[0]), mz(q[1]), 0, a => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.cyl(sx * 1.5, 0, sz * 1.5, 0.11, 2.3, WD2, 0x6a5038);
    a.cyl(0, 2.3, 0, 2.7, 1.9, SHG, 0xb89a52, { r2: 0, seg: 8, roof: true }); a.box(0, 0, 0, 2.6, 0.1, 2.6, FLR, 0x9a8460); }));

/* ── placing things: a blocker on a square's middle (P), decor off it (dec), people (native); never two on one square ── */
const DRY_LAND = 'dDtjoJXr';
function spot(sx, sy, what, where, shared) { if (!inb(sx, sy)) { errs.push(what + ' is off the map'); return; } const ch = cell[sy][sx];
    if (where === 'land' && !'dDtjoJ'.includes(ch)) errs.push(what + ' is not on dry ground at ' + sx + ',' + sy + ' (' + ch + ')');
    if (where === 'sea' && !'wua'.includes(ch)) errs.push(what + ' is not in the water at ' + sx + ',' + sy + ' (' + ch + ')');
    if (!shared) { if (taken.has(sx + ':' + sy)) errs.push(what + ': square ' + sx + ',' + sy + ' is taken'); taken.add(sx + ':' + sy); } }
const P = (key, sx, sy, o) => { spot(sx, sy, key, 'land'); props.push(Object.assign({ key, x: mx(sx), z: mz(sy) }, o || {})); };
const dec = (key, sx, sy, o) => { spot(sx, sy, key, 'land', true); props.push(Object.assign({ key, x: r2(mx(sx) + (rnd() - 0.5) * 1.6), z: r2(mz(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); };
const afloat = (key, sx, sy, o) => { spot(sx, sy, key, 'sea', true); props.push(Object.assign({ key, x: mx(sx), z: mz(sy), y: 0.32 }, o || {})); };          // rides the surface (a `float` prop)
const swimmer = (key, sx, sy, o) => { spot(sx, sy, key, 'sea', true); props.push(Object.assign({ key, x: mx(sx), z: mz(sy), y: -0.7, hover: 0.4 }, o || {})); };   // its back through the surface (the ocean pack's way)
const palm = (sx, sy, h) => { spot(sx, sy, 'palm', 'land'); if (!'dDt'.includes(cell[sy][sx])) errs.push('a palm off the sand at ' + sx + ',' + sy); feat({ k: 'tree', x: r2(mx(sx) + (rnd() - 0.5)), z: r2(mz(sy) + (rnd() - 0.5)), kind: 'palm', h: h || r2(3.6 + rnd() * 1.4), r: 0.6 }); count.palms = (count.palms || 0) + 1; };
const native = (race, sx, sy, face, say) => { spot(sx, sy, race, null); const n = { x: mx(sx), z: mz(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); };

/* ── THE WAYS ── */
const OY = 36;   // the Shore and the Harbour keep plan 2's squares, three plots further south
doors.push({ id: 'quay', wall: 'w', z: gz(OY + 5.5), leaf: null, label: 'DISASTER CITY · BAYSIDE', sub: 'THE BOARDWALK · BACK INTO THE CITY', action: { room: 'site_prebuilt_downtown_streets', at: 'harbour' },
    desc: 'The boards run back to the sea wall and the sea wall runs back to the city.' });   // the city's door `harbour` (and the old streets') leads to door `quay`: the old Harbour's id, kept
const GANG = { x: gx(52), z: gz(55), face: 0 };                                                  // the gangway on the pier's south edge, at her waist (link `beach_dutchman`)
const MAEL = { x: gx(150), z: gz(42), face: 180 };                                           // the Maelstrom's mouth (link `bermuda_abyss`)
const POOL = { x: mx(134), z: mz(97), face: 0 };                                             // the tide pool by the Lagoon: Room 8's weir (link `weir_bermuda`)
const BAY = { x: mx(146), z: mz(102), face: 0 };                                             // Room 345's cabin door on the Island Beach (siteRooms.entry.prebuilt_bermuda)
[[134, 97], [134, 96], [146, 102], [146, 101], [51, 53], [52, 53], [51, 54], [52, 54]].forEach(q => taken.add(q[0] + ':' + q[1]));
const SP = [3, OY + 5];

/* ── THE SHORE ── */
[[10, OY + 2], [12, OY + 9], [14, OY + 20], [3, OY + 20], [9, OY + 21], [6, OY + 44], [10, OY + 40], [4, 30], [8, 26], [3, 22], [1, 18], [2, 90], [7, 94], [3, 100]].forEach(q => palm(q[0], q[1]));
for (let y = 0; y < H; y++) for (let x = 0; x < 24; x++) if (cell[y][x] === 't' && (x + y) % 2 === 0) palm(x, y);                // THE PALMS: the three groves
P('park_bench', 2, OY + 3, { face: 180 }); P('park_bench', 5, OY + 3, { face: 180 }); P('signpost', 8, OY + 5, { face: 90 }); P('city_bench', 2, OY + 7, { face: 0 }); dec('beach_ball', 9, OY + 8);
P('surfboard_rack', 11, OY + 15, { face: 0 }); dec('surfboard_short', 12, OY + 17); dec('surfboard_fish', 13, OY + 16); P('campfire', 6, OY + 18); dec('folding_chair', 5, OY + 19); dec('folding_chair', 7, OY + 19); dec('beach_cooler', 7, OY + 17);
P('pool_umbrella', 13, OY + 22); dec('pool_lounger', 14, OY + 22, { face: 90 }); P('pool_umbrella', 13, OY + 26); dec('pool_lounger', 14, OY + 26, { face: 90 }); dec('beach_ball', 12, OY + 24);
P('lifeguard_chair', 18, OY + 27, { face: 90 }); dec('beach_life_ring', 17, OY + 31); dec('beach_swim_ring', 13, OY + 33); dec('beach_air_mattress_pink', 12, OY + 34);
[[16, OY + 3], [18, OY + 7], [14, OY + 9], [20, OY + 10]].forEach((q, i) => dec(['ocean_starfish', 'ocean_crab', 'ocean_conch', 'ocean_sand_dollar'][i], q[0], q[1]));   // THE TIDE POOLS
dec('ocean_rock_4', 15, OY + 6); dec('ocean_rock_7', 23, OY + 8); dec('ocean_starfish', 15, OY + 8); dec('ocean_crab', 17, OY + 10);
[[15, OY + 40], [17, OY + 41], [20, OY + 42], [22, OY + 41]].forEach((q, i) => dec(['ocean_sand_dollar_2', 'ocean_conch', 'ocean_seal_resting', 'ocean_crab'][i], q[0], q[1]));   // THE SANDBAR
dec('fallen_log', 4, OY + 40); dec('ocean_conch', 2, 20); dec('fallen_log', 4, 24); dec('ocean_crab', 8, 32); dec('ocean_sand_dollar_3', 3, 96);
native('mermaid', 19, OY + 9, 250, sayOf(O_SEA, 'mermaid')); native('starfish', 19, OY + 41, 270); native('siren', 16, OY + 18, 90);

/* ── THE HARBOUR ── */
P('psx_wooden_crate_3', 24, OY + 2); P('psx_wooden_crate_1', 25, OY + 2); P('psx_metal_barrel_mp_2', 31, OY + 3); P('ship_anchor', 30, OY + 5, { face: 110 }); dec('dockring', 32, OY + 6); dec('dockring', 24, OY + 6); P('ship_lantern', 30, OY + 6);
dec('cardboard_boxes', 28, OY + 10); dec('sea_chest', 33, OY + 17); dec('folding_chair', 26, OY + 18, { face: 200 }); P('ship_lantern', 24, OY + 17); P('ship_lantern', 36, OY + 18); dec('dockring', 29, OY + 23); dec('dockring', 29, OY + 27);
props.push({ key: 'skiff', x: mx(31), z: mz(OY + 28), y: 0.32, face: 0 });                                                       // THE SKIFF, afloat at her jetty's end
props.push({ key: 'lighthouse', x: mx(46), z: mz(OY + 10), face: 0 });                                                           // THE HARBOUR LIGHT on the breakwater's head (the old Harbour's)
[[30, OY + 38], [24, OY + 38], [30, OY + 47], [24, OY + 47]].forEach(q => afloat('sea_buoy', q[0], q[1]));                        // THE CHANNEL: two pairs of red buoys
swimmer('ocean_dolphin', 26, OY + 40, { swim: { r: 6, v: 2.2, bob: 0.35 } }); swimmer('ocean_turtle', 42, OY + 44, { swim: { r: 4, v: 0.7, bob: 0.1 } }); swimmer('ocean_tuna', 30, OY + 42, { swim: { r: 6, v: 1.6, bob: 0.2 } });
native('pirate', 29, OY + 6, 180, sayOf(O_HARB, 'pirate')); native('homosapien', 34, OY + 18, 150, sayOf(O_HARB, 'homosapien'));

/* ── THE OCEAN ── */
[[60, 20, 'ocean_whale'], [70, 30, 'ocean_humpback'], [60, 80, 'ocean_dolphin'], [62, 82, 'ocean_dolphin'], [84, 50, 'ocean_manta'], [100, 40, 'ocean_turtle'], [120, 60, 'ocean_dolphin'], [76, 100, 'ocean_manta'],
 [50, 100, 'ocean_turtle'], [140, 12, 'ocean_shark'], [30, 112, 'ocean_stingray'], [162, 60, 'ocean_humpback'], [90, 70, 'ocean_tuna'], [130, 28, 'ocean_dolphin']].forEach(q => swimmer(q[2], q[0], q[1], /whale|humpback/.test(q[2]) ? { y: -1.6, hover: 0.5 } : { swim: { r: 5 + (q[0] % 4), v: 1.2 + (q[1] % 5) * 0.25, bob: 0.25 } }));
for (const q of [[52, 30], [80, 20], [70, 70], [110, 50], [60, 110], [150, 70]]) feat({ k: 'scatter', key: 'fish_school', n: 3, x: mx(q[0]), z: mz(q[1]), r: 40, seed: q[0], sea: true });
P('palm_tree', 160, 20, { h: 4.2 }); dec('ocean_conch', 161, 21); dec('sea_chest', 159, 20); P('palm_tree', 40, 112, { h: 3.8 }); dec('ocean_starfish', 41, 112); dec('fallen_log', 39, 113);    // the two unnamed islets
/* THE VOLCANO ISLAND: the landing, the village round its fire, palms along the shore, the cone's glow */
props.push({ key: 'campfire', x: mx(114), z: mz(17), glow: 0.8 }); taken.add('114:17');
dec('taiko_drum', 113, 17); dec('spear', 115, 16); dec('spear', 112, 19); dec('skull_pile', 115, 18); dec('item_ward_totem', 111, 16); dec('wooden_bucket', 114, 19); dec('fallen_log', 113, 19);
P('cave_torch', 110, 20); P('cave_torch', 116, 14); P('cave_torch', 106, 20); dec('meshy_rowboat', 108, 21, { face: 80 });
[[99, 9], [99, 13], [101, 17], [104, 20], [111, 21], [113, 20], [117, 10], [114, 5], [108, 3]].forEach(q => palm(q[0], q[1]));
feat({ k: 'scatter', key: 'cave_stone', n: 14, x: mx(106), z: mz(10), r: 30, seed: 41 });

/* ── THE BERMUDA TRIANGLE ── */
props.push({ key: 'lighthouse', x: gx(B_LIGHT[0] + 1), z: gz(B_LIGHT[1] + 1), face: 0 });                                         // on its rock at the west point (the beam turns; the tape)
props.push({ key: 'ship_wreck', x: mx(B_WRECK[0]), z: mz(B_WRECK[1]), face: 30 }); dec('sea_chest', 98, 88); dec('skull_pile', 100, 90); native('siren', 100, 88, 250, sayOf(O_SEA, 'siren'));
[[146, 37], [154, 37], [146, 47], [154, 47]].forEach(q => afloat('sea_buoy', q[0], q[1]));                                         // the Maelstrom's ring of four red buoys
props.push({ key: 'ocean_shark', x: MAEL.x, z: MAEL.z, y: -4.2, hover: 0, swim: { r: 9, v: 1.3, bob: 0.2 } }, { key: 'ocean_hammerhead', x: MAEL.x, z: MAEL.z, y: -5.4, hover: 0, swim: { r: 6, v: 1.1, bob: 0.2, dir: -1 } });
swimmer('ocean_shark', 104, 92, { y: -0.85, hover: 0.25, swim: { r: 14, v: 1.4, bob: 0.1 } }); dec('ocean_seal_resting', 122, 72); dec('ocean_seal_resting', 126, 73); dec('ocean_rock_7', 119, 72);
swimmer('ocean_moon_jelly', 124, 62, { y: -1.2, hover: 0 }); swimmer('ocean_box_jelly', 128, 66, { y: -1.4, hover: 0 }); swimmer('ocean_bioluminescent_jelly', 120, 80, { y: -1.2, hover: 0 }); swimmer('ocean_moon_jelly_pulsing', 136, 58, { y: -1.0, hover: 0 });
for (const k of ['ocean_coral', 'ocean_coral_3', 'ocean_coral_6', 'coral_fan', 'coral_brain']) feat({ k: 'scatter', key: k, n: 8, x: mx(113), z: mz(90), r: 16, seed: k.length * 7, sea: true });   // THE REEF
feat({ k: 'scatter', key: 'ocean_coral_2', n: 5, x: MAEL.x, z: MAEL.z, r: 17, seed: 85, sea: true }); feat({ k: 'scatter', key: 'ocean_seaweed', n: 6, x: MAEL.x, z: MAEL.z, r: 15, seed: 88, sea: true });
/* the island at the right angle: the Jetty, the Cay and its dune, the Lagoon, the Island Beach */
for (let y = 84; y < 108; y++) for (let x = 132; x < 156; x++) if (cell[y][x] === 't') palm(x, y);
[[142, 86], [150, 86], [153, 92], [141, 95], [152, 104], [143, 106]].forEach(q => palm(q[0], q[1]));
P('campfire', 148, 99); dec('folding_chair', 149, 100); dec('cardboard_box', 147, 101); dec('paper_sheet', 148, 101, { y: 0.01 }); P('signpost', 141, 92, { face: 270 }); dec('wet_floor_sign', 140, 90);
dec('ocean_crab', 150, 96); dec('ocean_starfish', 143, 98); dec('ocean_conch', 152, 100); dec('ocean_sand_dollar', 145, 104); dec('dockring', 133, 90); P('ship_lantern', 132, 89);
props.push({ key: 'skiff', x: gx(131), z: gz(90), y: 0.32, face: 90 });                                                           // the island's own skiff, at the Jetty
native('pirate', 144, 93, 220, sayOf(O_SEA, 'pirate')); native('jellyfish', 139, 104, 20); native('sharkman', 151, 102, 300); native('deep sea fish', 113, 91, 90);

/* ── THE DRESSING (mondo 11-15: "see what other aquatic or oceanic or beach related models you can add to dress the area"): only models the game
   already has (the catalogue; nothing generated). `under` = a thing that stands on the sea floor or hangs in the water at its own depth. ── */
const under = (key, sx, sy, y, o) => { spot(sx, sy, key, 'sea', true); props.push(Object.assign({ key, x: r2(mx(sx) + (rnd() - 0.5) * 2), z: r2(mz(sy) + (rnd() - 0.5) * 2), y, hover: 0, face: Math.round(rnd() * 360) }, o || {})); };
/* the Shore: flamingos in the tide pools and the shallows, a sandbox and a ball by the huts, the snack cart and a telescope on the Boardwalk, boats pulled up */
[[18, OY + 4], [20, OY + 5], [19, OY + 7], [21, OY + 8], [17, OY + 43], [20, OY + 40], [16, OY + 34]].forEach(q => { spot(q[0], q[1], 'flamingo', null, true); props.push({ key: 'flamingo', x: mx(q[0]), z: mz(q[1]), face: Math.round(rnd() * 360) }); });
P('play_sandbox', 12, OY + 18); dec('football', 9, OY + 19); dec('skateboard', 6, OY + 5); P('popcorn_cart', 5, OY + 6, { face: 180 }); P('brass_telescope', 7, OY + 4, { face: 90 });
P('rowboat', 15, OY + 13, { face: 70 }); P('meshy_rowboat', 14, OY + 37, { face: 110 }); dec('surfboard_long', 15, OY + 25); dec('surfboard_fish', 12, OY + 29); dec('beach_cooler', 14, OY + 30);
P('pool_umbrella', 10, OY + 33); dec('pool_lounger', 11, OY + 33, { face: 90 }); P('pool_umbrella', 6, 28); dec('pool_lounger', 7, 28, { face: 90 }); dec('beach_ball', 5, 27); dec('beach_swim_ring', 8, 30);
[[1, OY + 44, 'psxg_rock_1'], [2, 21, 'psxg_rock_2'], [3, 94, 'psxg_rock_3'], [16, OY + 2, 'psxg_rock_4'], [23, OY + 9, 'ocean_rock_3'], [13, OY + 44, 'ocean_rock_5']].forEach(q => dec(q[2], q[0], q[1]));
swimmer('ocean_seal', 23, OY + 46, {}); swimmer('ocean_seal', 26, OY + 44, {}); swimmer('ocean_turtle', 22, OY + 16, { swim: { r: 3, v: 0.6, bob: 0.1 } });
feat({ k: 'scatter', key: 'anemone', n: 10, x: mx(19), z: mz(OY + 6), r: 9, seed: 61, sea: true }); feat({ k: 'scatter', key: 'ocean_seaweed_2', n: 8, x: mx(21), z: mz(OY + 30), r: 10, seed: 62, sea: true });
/* the Harbour: freight on the quay (a container, a pallet, the forklift, a cable drum, sandbags: the quay floods), a gun on the quay's corner,
   the shed's outboard and wheel, lamps and rings down the pier's new length, a lobster on the boards, rocks at the mole's foot */
props.push({ key: 'ind_container', x: mx(32), z: gz(OY + 4), face: 0 }); taken.add('32:' + (OY + 3)); taken.add('32:' + (OY + 4));
P('wrapped_pallet', 30, OY + 3); P('forklift', 29, OY + 2, { face: 90 }); dec('cable_drum', 25, OY + 4); dec('meshy_sandbags', 24, OY + 5); dec('meshy_sandbags', 25, OY + 5); dec('meshy_sandbags', 24, OY + 3);
P('ship_cannon', 26, OY + 2, { face: 90 }); put(SHED, 'outboard_motor', -3.6, 3.6, { face: 0 }); put(SHED, 'ship_wheel', 4.9, 0, { y: 1.7, face: 270 }); put(SHED, 'ships_bell', -4.9, -2.0, { y: 1.9, face: 90 });
[42, 47, 55].forEach(x => P('ship_lantern', x, 53)); [40, 45, 50, 54].forEach(x => dec('dockring', x, 54)); dec('ocean_lobster', 44, 53, { anim: false }); dec('psx_wooden_crate_2', 49, 53); dec('sea_chest', 56, 54); dec('lobster_traps', 41, 53);
feat({ k: 'scatter', key: 'ocean_rock_8', n: 10, x: mx(42), z: mz(OY + 4), r: 22, seed: 63, sea: true }); feat({ k: 'scatter', key: 'kelp', n: 16, x: mx(40), z: mz(OY + 12), r: 14, seed: 64, sea: true });
/* the Ocean: three more tiny palm islands (the game's own `palmisle` model, standing in the sea), kelp beds and black smokers off the volcano,
   a second pod of dolphins, rays and tuna on the long crossings */
[[78, 44], [128, 100 + 12], [150, 84 - 12 + 0]].forEach(q => { spot(q[0], q[1], 'palmisle', 'sea', true); props.push({ key: 'palmisle', x: mx(q[0]), z: mz(q[1]), y: -0.6, face: Math.round(rnd() * 360) }); });
[[124, 10], [126, 14], [122, 18], [127, 8]].forEach(q => under('sea_vent', q[0], q[1], -3.5)); feat({ k: 'scatter', key: 'kelp', n: 20, x: mx(92), z: mz(14), r: 16, seed: 65, sea: true });
[[72, 16, 'ocean_dolphin'], [74, 18, 'ocean_dolphin'], [76, 15, 'ocean_dolphin'], [110, 30, 'ocean_stingray'], [88, 96, 'ocean_tuna'], [140, 24, 'ocean_manta'], [46, 96, 'ocean_seal'], [164, 96, 'ocean_turtle'], [20, 108, 'ocean_stingray']]
    .forEach(q => swimmer(q[2], q[0], q[1], { swim: { r: 5 + (q[0] % 4), v: 1.2 + (q[1] % 5) * 0.25, bob: 0.25 } }));
/* the Bermuda Triangle: the kraken's arms out of the water round the Maelstrom (the game's two tentacle models), an eel and a squid down its
   hole, an octopus under the wreck, clams and tube coral and reef fish on the Reef, a gun and a telescope and a boat on the island */
[[141, 44, 'tentacle'], [158, 46, 'tentacle2'], [144, 52, 'tentacle2'], [156, 34, 'tentacle'], [140, 36, 'tentacle2']].forEach(q => { spot(q[0], q[1], q[2], 'sea', true); props.push({ key: q[2], x: mx(q[0]), z: mz(q[1]), y: -1.4, face: Math.round(rnd() * 360) }); });
props.push({ key: 'ocean_eel', x: r2(MAEL.x + 3), z: r2(MAEL.z - 3), y: -5.8, hover: 0 }, { key: 'ocean_squid', x: r2(MAEL.x - 3), z: r2(MAEL.z + 3), y: -4.8, hover: 0 });
under('ocean_octopus', 97, 91, -1.6); [[110, 86], [114, 92], [117, 94]].forEach(q => under('giant_clam', q[0], q[1], -0.8)); [[111, 89], [116, 91], [113, 94], [109, 87]].forEach(q => under('coral_tube', q[0], q[1], -0.8));
[[112, 88, 'ocean_clownfish'], [115, 92, 'ocean_dory'], [110, 90, 'ocean_fish'], [117, 90, 'ocean_fish_2'], [113, 92, 'ocean_fish_3'], [114, 87, 'ocean_brown_fish']].forEach(q => under(q[2], q[0], q[1], -0.5));
P('ship_cannon', 150, 105, { face: 180 }); P('brass_telescope', 151, 88, { face: 90 }); P('rowboat', 152, 98, { face: 60 }); dec('ocean_seal_resting', 142, 100); dec('psxg_rock_2', 153, 94);
P('pool_umbrella', 145, 98); dec('pool_lounger', 146, 98, { face: 90 });
/* ── finish the heights (the buildings' flats are in) and check ── */
writeSlope();
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));
/* ── THE PAINT: one sheet a square (0 = the room's own sand) ── */
const PAL = ['wood_planks', 'cobblestone', 'rocks_5', 'obsidian', 'lava', 'urban:WoodFlooring1a'], paint = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x]; paint[y * W + x] = (ch === 'j' || ch === 'J') ? 1 : ch === 'o' ? 2 : ch === 'r' ? 3 : ch === 'h' ? 4 : ch === 'l' ? 5 : ch === 'X' ? 1 : 0; }

/* ── checks: every prop key and unit exists; the game's own compile gives the heights back; the walker reaches every dry plot of the mainland
   from the city door, and every island has a shore the skiff reaches ── */
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D), TREES = vm.runInContext('HQ_TREE_KINDS', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); });
{ const OLD = O_SEA.n.concat(O_HARB.n).map(n => n.race);   // a race the old rooms already stood here (the Harbour's homosapien) is fine
  npc.forEach(n => { if (RACES.indexOf(n.race) < 0 && OLD.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); }); }
if (!TREES.palm) throw new Error('no palm tree kind');
{ const cH = (x, y) => hc[y * W + x], walk = (x, y) => inb(x, y) && cH(x, y) > -1.15, seen = new Uint8Array(W * H), st = [SP]; seen[SP[1] * W + SP[0]] = 1;
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of N8.slice(0, 4)) { const X = x + dx, Y = y + dy; if (!walk(X, Y) || seen[Y * W + X]) continue;
      const hardStep = !(isSoft(cell[y][x]) && isSoft(cell[Y][X])); if (hardStep ? Math.abs(cH(X, Y) - cH(x, y)) > 0.62 : Math.abs(cH(X, Y) - cH(x, y)) / C > 1.0) continue; seen[Y * W + X] = 1; st.push([X, Y]); } }
  const need = [[3, OY + 5, 'the Boardwalk'], [3, 51 + 2, 'the Beach Huts'], [17, 67, 'the Lifeguard Hut'], [28, OY + 6, 'the Quay'], [36, 53, 'the Long Pier'], [PIER_END - 2, 53, 'the pier alongside the Dutchman'], [29, 62, 'the skiff jetty'], [6, OY + 44, 'the Dunes'], [4, 30, 'the North Headland sand']];
  need.forEach(q => { if (!seen[q[1] * W + q[0]]) throw new Error('not reached on foot from the city door: ' + q[2]); });
  for (let y = SHIP[1]; y < SHIP[3]; y++) for (let x = SHIP[0]; x < SHIP[2]; x++) if (seen[y * W + x]) throw new Error('the Dutchman is climbed from the pier');
  let dry = 0, wade = 0, swim = 0; for (let k = 0; k < W * H; k++) { if (hc[k] >= 0) dry++; else if (hc[k] > -1.15) wade++; else swim++; }
  Object.assign(count, { drySquares: dry, wadedSquares: wade, swumSquares: swim, walkedFromTheDoor: seen.reduce((a, b) => a + b, 0) });
  if (process.env.BEACH_DUMP) console.log(cell.map((r, y) => r.map((ch, x) => seen[y * W + x] ? '.' : hc[y * W + x] < -1.15 ? ' ' : ch).join('')).join('\n')); }
Object.assign(count, { features: F.length + ARCH.length, props: props.length, doors: doors.length, natives: npc.length });

/* ── the room ── */
const SPM = { x: mx(SP[0]), z: mz(SP[1]) }, LINES = O_HARB.l.concat(O_SEA.l), L = [];
L.push("        /* BEACH140-BEGIN — THE BEACH ON PLOTS (2026-11-15): written by `node bake-beach.js` from docs/areas/beach/layout.json. Never hand-edit between the markers; edit the tool or the layout and rerun. */");
L.push("        " + ROOM + ": {");
L.push("            label: 'THE BEACH',");
L.push("            sub: 'THE SHORE · THE HARBOUR · THE OCEAN · THE BERMUDA TRIANGLE',");
L.push("            kind: 'box', site: 'prebuilt_bermuda', part: 'beach',");
L.push("            shell: hqSeaShell({ w: " + (2 * HW) + ", d: " + (2 * HD) + ", plate: { x: " + SPM.x + ", z: " + SPM.z + ", y: 4.4 } }),");
L.push("            parti: 'Four districts on 140 plots, most of them water: a shore of sand off the city, a harbour with the Dutchman at the pier head, an ocean you sail, and a right triangle of sea with a lighthouse, an island and a hole at its corners.',");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + GX + ", nz: " + GZ + ", triangle: " + J(LAYOUT.triangle.map(q => [gx(q[0]), gz(q[1])])) + ", names: " + J(PLAN.plots.filter(p => p.name).map(p => [p.id, p.name, p.d, p.level])) + " },");
L.push("            terrain: {");
L.push("                res: 1.75, floor: 'desert', cliff: 'rocks_5', path: 'wood_planks',   // half a square a node (the Desert's and the Mountains' grain)");
L.push("                base: 0, noise: { amp: 0.06, scale: 9 }, crag: false,");
L.push("                sea: { y: 0, key: 'water' },");
L.push("                outer: { m: 60 },");
L.push("                /* THE FLYING DUTCHMAN: the Dutchman map's own ship, drawn at her berth (three-renderer.js _hqBuildMoored) */");
L.push("                moored: [" + J({ kind: 'galleon', room: SHIP_ROOM, x: SHIP_AT.x, z: SHIP_AT.z }) + "],");
L.push("                /* THE HEIGHTS ARE THE MAP: sand, sea floor, the quay, the piers, rock, the ship's deck and the volcano are all this grid */");
L.push("                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gz(0) + ", nx: " + W + ", nz: " + H + ", d: '" + slope.toString('base64') + "' } },");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + mx(0) + ", z0: " + mz(0) + ", nx: " + W + ", nz: " + H + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                features: [");
F.concat(ARCH).forEach(f => L.push("                    " + J(f) + ","));
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
L.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: 90 },");
L.push("        },");
L.push("        /* BEACH140-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
/* the rows in data.js that name a place in this room (written by hand there): the tool refuses to bake when one has drifted */
const at = o => "site: 'prebuilt_bermuda', part: 'beach', wall: 'free', x: " + o.x + ", z: " + o.z + ", face: " + o.face + ",";
const WANT = [
    ["prebuilt_bermuda: { room: '" + ROOM + "', door: { id: 'bay', wall: 'free', x: " + BAY.x + ", z: " + BAY.z + ", face: " + BAY.face + " } }", 'siteRooms.entry.prebuilt_bermuda'],
    ["a: { " + at(MAEL) + " way: 'whirlpool',", 'link bermuda_abyss'],
    ["b: { " + at(POOL), 'link weir_bermuda'],
    ["a: { " + at(GANG), 'link beach_dutchman'],
    [ROOM + ": { tape: { x: " + gx(B_LIGHT[0] + 1) + ", z: " + r2(gz(B_LIGHT[1] + 1) + 1.2) + " } }", 'the tape on the Lighthouse Rock'],
];
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flatSrc = src.replace(/ +/g, ' '), missing = WANT.filter(w => flatSrc.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at this room yet (see the rows above)'); }
if (process.env.BEACH_OUT) fs.writeFileSync(process.env.BEACH_OUT, block);
if (DRY) process.exit(0);
const END = '        /* BEACH140-END */\n', b0 = src.indexOf('        /* BEACH140-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        site_prebuilt_bermuda_sea: {'; const a = src.lastIndexOf('        /*', src.indexOf(anchor)); if (src.indexOf(anchor) < 0 || a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOM + ' written (' + block.length + ' bytes)');
