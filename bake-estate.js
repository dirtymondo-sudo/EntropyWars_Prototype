#!/usr/bin/env node
/* bake-estate.js — THE ESTATE ON PLOTS (2026-11-15, mondo's OK on plot plan 2: "okay, those are all good" = the Estate is next, the plan as drawn,
   the plot names kept, the Barn and the Farmhouse walk-in, the Loch Ness Monster at the Lake). The fifth area of the world plan after the Woods,
   Camelot Kingdom, the Desert and the Mountains: 6 x 6 plots of 12 x 12 squares (252 m a side), four districts of nine:
   THE CORN FIELDS (north-west), THE LAKE (north-east), THE HAUNTED HOUSE + GRAVEYARD (south-west), THE RANCH (south-east).
   Reads docs/areas/estate/layout.json (the approved plan: every plot's name, district, level, and the 72 x 72 square map) and writes the room
   `site_prebuilt_skinwalker_estate` into data.js between ESTATE36-BEGIN / ESTATE36-END. `node bake-estate.js` writes; `--dry-run` prints the counts;
   `ESTATE_DUMP=1` prints the walked map. Never hand-edit between the markers: edit this tool or the layout and rerun.
   Notes: docs/notes/areas-complexes.md "THE ESTATE ON PLOTS" + "THE ESTATE, THE DISTRICT FILES".
   THE DISTRICT FILES (2026-11-16, mondo: "every single zone needs to be like that. now. so we can work in parallel"): what stands in a district is
   written in docs/areas/estate/districts/<LETTER>.js (C the Corn Fields, L the Lake, H the Haunted House + Graveyard, R the Ranch), one thread a file.
   This tool keeps what is shared: the plan, the corn wall and its pines, the levels, the paint, the open ground, the ways out, the sky, the checks.
   THE CORN IS THE WALL: the plan's `c` squares are the standing corn (terrain.gen plan / look rock: a 2.2 m bank, the old Corn Fields' own corn);
   everything else is walked. Squares are (sx 0..72 west to east, sy 0..72 north to south); gx() = a square's west / north line in metres, gc() = its middle. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/estate/layout.json'), 'utf8')).rooms[0];
const DIST = { 'The Corn Fields': 'C', 'The Ranch (NEW)': 'R', 'The Haunted House + Graveyard': 'H', 'The Lake (NEW)': 'L' };
const C = 3.5, N = 12, G = 6, W = N * G, PL = N * C, HALF = W * C / 2, LEVEL = 1.75, ROOM = 'site_prebuilt_skinwalker_estate';
const r2 = v => Math.round(v * 100) / 100, gx = c => r2(-HALF + c * C), gc = c => r2(-HALF + (c + 0.5) * C);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
/* the old rooms' people keep their own lines: read from the old literals (so the old Corn Fields and Grounds literals must stay in data.js) */
const OLDR = id => JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [], d: r.doors || [] } : { n: [], l: [], d: [] })(DOOR_HQ.rooms.' + id + '))', D));
const O_FIELDS = OLDR('site_prebuilt_skinwalker_fields'), O_GROUNDS = OLDR('site_prebuilt_haunted_grounds');
const sayOf = (R, race, i) => (R.n.filter(n => n.race === race)[i || 0] || {}).say;
const cell = PLAN.cells.map(r => r.split(''));
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); p.d = DIST[p.district]; if (!p.d) throw new Error('district? ' + p.district); plot[p.id] = p; });
const Pxy = (x, y) => plot['P0' + Math.max(0, Math.min(G - 1, x)) + '-0' + Math.max(0, Math.min(G - 1, y))];
const distAt = (x, y) => Pxy(Math.floor(x / N), Math.floor(y / N)).d;
const F = [], props = [], doors = [], npc = [], ARCH = [], flats = [], count = {}, taken = new Set();
const feat = o => { F.push(o); return o; };
const setRect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ch; };
const open = (x, y) => x >= 0 && y >= 0 && x < W && y < W && cell[y][x] !== 'c';

/* a way out through the room's wall: the plot's nearest open squares carried to the wall, two squares wide; returns the place along the wall (m) */
function spur(id, wall, lxWant) {
    const p = plot[id], x0 = p.x * N, y0 = p.y * N; let best = null;
    for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N - 1; lx++) { if (!open(x0 + lx, y0 + ly)) continue; if (lxWant != null && lx !== lxWant) continue;
        const d = wall === 'n' ? ly : N - 1 - ly; if (!best || d < best[0]) best = [d, lx, ly]; }
    const lx = best[1], ly = best[2];
    for (let y = (wall === 'n' ? 0 : ly); y <= (wall === 'n' ? ly : N - 1); y++) for (const dx of [0, 1]) if (cell[y0 + y][x0 + lx + dx] === 'c') cell[y0 + y][x0 + lx + dx] = 'p';
    return gx(x0 + lx + 1);
}

/* ── THE BUILDINGS (the city's way, the Desert's helper): a hollow `texbuilding` (the walls you bump, the doorway, the swinging leaf, the inside)
   with its own outside switched off + its look as an `arch` parts list. Parts frame: the building's middle, x along the front, +z out of the
   front, y up. Squares x0..x1 x y0..y1 (the end is exclusive), `side` = the wall its front is on. ── */
const U = n => 'urban:' + n, WD = U('WoodGeneric1b'), WD2 = U('WoodGeneric1a'), SHG = U('WoodGeneric2a'), FLR = U('WoodFlooring1d'), GLS = U('GlassWindowTall1a'),
    COR = U('MetalCorrugated1a'), BRK = U('BrickMasonry1a'), SHUT = U('GlassWindowResidentialShutter1');
const ROT = { S: 0, W: 90, N: 180, E: 270 };
function sheet() {
    const P = [];
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); if (/GlassWindow/.test(key || '') && o.glow == null) o.glow = 0.3; P.push(o); return o; };
    const A = { P,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, o),
        /* a roof is drawn from outside only: one timber sheet facing down under it */
        roof: (form, x, y, z, w, h, d, key, tint, o) => { add({ s: 'box', p: [x, y, z], size: [w, 0.02, d], sides: false, top: false, under: true, roof: true, ry: (o && o.ry) || 0 }, WD2, 0x4a3626);
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
const BUILT = {};   // every building's handle by its id (BUILT.house)
function building(id, q, h, o, parts) {
    const [sx0, sy0, sx1, sy1, side] = q, ew = side === 'E' || side === 'W', fw = (ew ? sy1 - sy0 : sx1 - sx0) * C, fd = (ew ? sx1 - sx0 : sy1 - sy0) * C, cx = gx((sx0 + sx1) / 2), cz = gx((sy0 + sy1) / 2), rot = ROT[side];
    const row = Object.assign({ k: 'texbuilding', id: 'est:' + id, seed: 1, x: cx, z: cz, w: fw, d: fd, rot, storeys: Math.max(1, Math.floor(h / 3.5 + 0.01)), h, skin: false, hollow: true, leaf: 'leaf_shabby_wood', leafDouble: false, keyIn: WD2, floorIn: FLR }, o || {});
    Object.keys(row).forEach(k => { if (row[k] === undefined) delete row[k]; });
    feat(row); setRect(sx0, sy0, sx1, sy1, 'B'); flats.push([sx0, sy0, sx1, sy1]);
    for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) taken.add(x + ':' + y);
    const a = sheet(), door = texbDoor(fw, row.door); parts(a, fw, fd, door);
    ARCH.push({ k: 'arch', id: 'est:' + id + ':look', x: cx, z: cz, rot, parts: a.P });
    const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    count.buildings = (count.buildings || 0) + 1;
    return (BUILT[id] = { at: (lx, lz) => [r2(cx + lx * c - lz * s), r2(cz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd, door, cx, cz, rot });
}
const put = (B, key, lx, lz, o) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, o || {}); if (r.face != null) r.face = B.face(r.face); props.push(r); };   // `face` in the building's frame
const SOLID = { hollow: false, leaf: undefined, leafDouble: undefined, keyIn: undefined, floorIn: undefined };
const windows = (a, w, d, y, hh, skipX, tint, glow) => { for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (skipX != null && Math.abs(x - skipX) < 1.7) continue;
    a.box(x, y, d / 2 + 0.06, 1.2, hh, 0.08, GLS, tint, { glow }); a.box(x, y - 0.14, d / 2 + 0.12, 1.6, 0.14, 0.16, WD2, 0x2a2622); a.box(x, y + hh, d / 2 + 0.12, 1.6, 0.14, 0.16, WD2, 0x2a2622); } };

/* ── THE DRAWN PIECES (arch rows on open ground: walked under or round) ── */
function look(id, x, z, rot, fn) { const a = sheet(); fn(a); ARCH.push({ k: 'arch', id: 'est:' + id + ':look', x: r2(x), z: r2(z), rot: rot || 0, parts: a.P }); }

/* ── placing things: a blocker on a square's middle (P), decor off it (dec), people (native); never on corn, never two on one square ── */
const errs = [], strays = [];   // every misplaced piece is listed in one go; `strays` = a district's piece on another district's square (printed, not refused)
let curD = null;                  // the district whose hook is running
function spot(sx, sy, what, shared) { if (sx < 0 || sy < 0 || sx >= W || sy >= W) return; if (curD && distAt(sx, sy) !== curD) strays.push(curD + ': ' + what + ' at ' + sx + ',' + sy + ' (' + distAt(sx, sy) + ')'); if (cell[sy][sx] === 'c') { errs.push(what + ' stands in the corn at ' + sx + ',' + sy); return; }
    if (!shared) { if (taken.has(sx + ':' + sy)) errs.push(what + ': square ' + sx + ',' + sy + ' is taken'); taken.add(sx + ':' + sy); } }
const P = (key, sx, sy, o) => { spot(sx, sy, key); props.push(Object.assign({ key, x: gc(sx), z: gc(sy) }, o || {})); };
const decWith = rnd => (key, sx, sy, o) => { spot(sx, sy, key, true); props.push(Object.assign({ key, x: r2(gc(sx) + (rnd() - 0.5) * 1.6), z: r2(gc(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); };
const tree = (sx, sy, kind, h, r) => { spot(sx, sy, 'tree'); if (!'gD'.includes(PLAN.cells[sy][sx]) || 'pojm'.includes(cell[sy][sx])) errs.push('a tree off the grass at ' + sx + ',' + sy); feat({ k: 'tree', x: gc(sx), z: gc(sy), kind, h, r: r || 0.8 }); };
const native = (race, sx, sy, face, say) => { spot(sx, sy, race); if ('po'.includes(cell[sy][sx]) && distAt(sx, sy) !== 'H' && distAt(sx, sy) !== 'R') errs.push(race + ' stands on a track'); const n = { x: gc(sx), z: gc(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); };
const rail = (x0, y0, x1, y1) => feat({ k: 'rail', x0: gx(x0), z0: gx(y0), x1: gx(x1), z1: gx(y1), model: 'ranch' });

/* ── THE DISTRICT FILES (2026-11-16, the one hook for the four district threads; the city's way: bake-disaster-city.js THE DISTRICT FILES):
   docs/areas/estate/districts/<LETTER>.js, one per district, so no district's code lands in this tool. A file may export any of the stages
   below (and `airZones(ctx)`, THE AIR BY DISTRICT further down); each is called with that district's own ctx (the helpers above + its own dice). A stage runs for every district that has it, in the
   order written in STAGES (THE ORDER AS IT FELL: the order the pieces were written in before the split, kept so the split changed no byte of
   the room; it only decides the order of the rows in data.js), then for any other district file by letter.
   THE DICE: each district throws its own stream (ctx.rnd, ctx.dec), started where the one shared stream stood when that district's dressing
   began before the split (SEEDS), so a piece added in one district never moves a piece of another. The pines on the corn bank throw the tool's. ── */
const STAGES = [['plan', 'CH'], ['houses', 'HRL'], ['sheds', 'HR'], ['pieces', 'H'], ['water', 'L'], ['dress', 'CLHR']];
const SEEDS = { C: 512, L: 2780962294, H: 2576504678, R: 2714093126, pines: 3643939580 };
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const DISTRICTS = (() => { const dir = path.join(REPO, 'docs/areas/estate/districts'), o = {}; if (fs.existsSync(dir)) fs.readdirSync(dir).filter(f => /^[A-Z]\.js$/.test(f)).sort().forEach(f => { o[f[0]] = require(path.join(dir, f)); }); return o; })();
['C', 'L', 'H', 'R'].forEach(k => { if (!DISTRICTS[k]) throw new Error('district file missing: docs/areas/estate/districts/' + k + '.js'); });
const CTX = {};
Object.keys(DISTRICTS).forEach(k => { const rnd = mkRnd(SEEDS[k] != null ? SEEDS[k] : 7919 * k.charCodeAt(0));
    CTX[k] = { d: k, C, N, G, W, HALF, gx, gc, r2, PLAN, plot, cell, setRect, open, distAt, feat, props, npc, taken, building, put, look, sheet, windows, SOLID,
        U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, P, dec: decWith(rnd), tree, native, rail, rnd, flat: (x0, y0, x1, y1) => { flats.push([x0, y0, x1, y1]); }, sayOf, O_FIELDS, O_GROUNDS, BUILT }; });
const run = stage => { const first = STAGES.find(s => s[0] === stage)[1].split(''), order = first.concat(Object.keys(DISTRICTS).filter(k => first.indexOf(k) < 0));
    order.forEach(k => { const m = DISTRICTS[k]; if (m && typeof m[stage] === 'function') { curD = k; try { m[stage](CTX[k]); } finally { curD = null; } } }); };

run('plan');      // what a district adds to the plan's squares (the Hub's pocket for the well, the path to the Crypt's door)
run('houses');    // THE BUILDINGS: the Haunted House, the Barn, the Farmhouse, the Boathouse
run('sheds');     // the Crypt, the hen house
run('pieces');    // THE DRAWN PIECES: the gazebo, the iron gate, the treehouse

/* ── THE WAYS ── */
/* THE TWO GATES ON ONE LINE (2026-11-17, mondo after the test slice): the Fence Line's gate (the Woods) and this one stood 3.5 m apart along the seam,
   each on its plot's own nearest square. The Woods Gate's way in is cut one square west, on the Fence Line's line (world x -13.5). */
const WOODS_X = spur('P01-00', 'n', 5);                    // the fence gate from the Woods (bake-woods.js's seam door leads here)
doors.push({ id: 'woods', wall: 'n', x: WOODS_X, way: 'trail', label: 'THE WOODS · THE CLEARING', sub: 'THE FENCE LINE · THE GATE', action: { room: 'site_prebuilt_fairy_forest_plots', at: 'estate' },
    desc: 'A fence, and a gate in it. The trees start on the other side.' });
rail((WOODS_X + HALF) / C - 2.5, 2, (WOODS_X + HALF) / C - 0.5, 2); rail((WOODS_X + HALF) / C + 0.5, 2, (WOODS_X + HALF) / C + 2.5, 2);
{ const o = O_GROUNDS.d.find(d => d.id === 'house') || {};   // the front door: the old Grounds' own door, on the tower's foot
  doors.push({ id: 'house', wall: 'free', x: BUILT.house.cx, z: r2(gx(56) + 0.45), face: 180, leaf: o.leaf || 'leaf_wooden', label: o.label || 'THE HAUNTED HOUSE · THE HALL', sub: o.sub || 'THE FRONT DOOR · GO IN',
      action: { room: 'site_prebuilt_haunted_hall', at: 'front' }, desc: o.desc || '' }); taken.add('17:56'); taken.add('18:56'); }
const BAY_X = spur('P04-05', 's', 5);                      // Room 512's stable door: the Yard's south wall (data.js siteRooms.entry.prebuilt_skinwalker)
const BAY13 = { x: gc(17), z: gc(43), face: 0 };           // Room 13's door: on the Iron Gate's round (siteRooms.entry.prebuilt_haunted)
const WELL = { x: gc(14), z: gc(29), face: 90 };           // the well down to the Cavern (link `well_skinwalker`)
const LODGE = { x: gc(70), z: gc(57), face: 180 };         // the saloon door into the Lodge, by the farmhouse porch (link `ranch_lodge`)
[[17, 43], [14, 29], [70, 57], [15, 29], [70, 58], [17, 42]].forEach(q => taken.add(q[0] + ':' + q[1]));

run('water');     // THE WATER: the Lake, the docks, the Marsh's pools
run('dress');     // every district's dressing, people and animals

if (strays.length) console.log('pieces a district stood on another district\'s squares (ask that district\'s thread):\n  ' + strays.join('\n  '));
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));
/* the pines of the house's grounds stand on the corn bank round it (the old Grounds' pine hedge); the corn itself carries no trees */
{ const rnd = mkRnd(SEEDS.pines);
for (let cy = 37; cy < W - 1; cy++) for (let cx = 1; cx < 36; cx++) { if (cell[cy][cx] !== 'c') continue;
    let deep = true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (cell[cy + dy][cx + dx] !== 'c') deep = false;
    if (!deep || rnd() > 0.1) continue; feat({ k: 'tree', x: r2(gc(cx) + (rnd() - 0.5) * 1.4), z: r2(gc(cy) + (rnd() - 0.5) * 1.4), kind: rnd() < 0.8 ? 'pine' : 'tree_5', h: r2(5.5 + rnd() * 2), r: 0.7 }); count.pines = (count.pines || 0) + 1; } }

/* ── THE LEVELS: one height a plot (layout `level`, 1 level = 1.75 m), flat over the plot's middle four squares, a straight grade over the eight
   squares to the next plot's middle (the Woods' own rule). Under and round each building the ground is levelled, eased back over four squares. ── */
const LV = (x, y) => Pxy(x, y).level * LEVEL;
function ground(xm, zm) {
    const px = (xm + HALF) / PL - 0.5, pz = (zm + HALF) / PL - 0.5, i = Math.max(0, Math.min(G - 2, Math.floor(px))), j = Math.max(0, Math.min(G - 2, Math.floor(pz)));
    const t = v => Math.min(1, Math.max(0, (v - 1 / 6) / (2 / 3))), u = t(px - i), v = t(pz - j);
    return (LV(i, j) * (1 - u) + LV(i + 1, j) * u) * (1 - v) + (LV(i, j + 1) * (1 - u) + LV(i + 1, j + 1) * u) * v;
}
const Hc = new Float32Array((W + 1) * (W + 1));
for (let y = 0; y <= W; y++) for (let x = 0; x <= W; x++) Hc[y * (W + 1) + x] = ground(gx(x), gx(y));
flats.forEach(([x0, y0, x1, y1]) => { const ref = ground(gx((x0 + x1) / 2), gx((y0 + y1) / 2));
    for (let y = Math.max(0, y0 - 5); y <= Math.min(W, y1 + 5); y++) for (let x = Math.max(0, x0 - 5); x <= Math.min(W, x1 + 5); x++) {
        const d = Math.max(x0 - 1 - x, x - x1 - 1, y0 - 1 - y, y - y1 - 1, 0), w = Math.max(0, 1 - d / 4), k = y * (W + 1) + x; Hc[k] = Hc[k] * (1 - w) + ref * w; } });
const slope = Buffer.alloc(W * W * 8);
for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) { const o = (cy * W + cx) * 8;
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((q, k) => slope.writeInt16LE(Math.round(Hc[(cy + q[1]) * (W + 1) + cx + q[0]] * 100), o + k * 2)); }

/* ── THE OPEN GROUND: every square that is not corn, as `space` rows (greedy rectangles) ── */
const spaces = [];
{ const used = new Uint8Array(W * W);
  for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) { if (!open(cx, cy) || used[cy * W + cx]) continue;
      let w = 1; while (cx + w < W && !used[cy * W + cx + w] && open(cx + w, cy)) w++;
      let h = 1; rows: while (cy + h < W) { for (let i = 0; i < w; i++) if (used[(cy + h) * W + cx + i] || !open(cx + i, cy + h)) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(cy + j) * W + cx + i] = 1;
      spaces.push({ k: 'space', x: r2(gx(cx) + w * C / 2), z: r2(gx(cy) + h * C / 2), w: w * C, d: h * C }); } }
/* ── THE PAINT: one sheet a square (0 = the room's own lawn) ── */
const PAL = ['dirt_2', 'cobblestone', 'urban:WoodFlooring1a', 'marble', 'dirt_4', 'grass_rocky', 'grass_dark_fantasy', 'rocks_5'], paint = new Uint8Array(W * W);
for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x], d = distAt(x, y);
    paint[y * W + x] = ch === 'p' ? 1 : ch === 'o' ? 2 : ch === 'j' ? ((d === 'R' && y !== 56) ? 0 : 3) : ch === 'm' ? 4 : ch === 'D' ? (d === 'C' ? 5 : 6) : ch === 'r' ? 8 : ch === 's' ? 5 : (ch === 'B' && d === 'R') ? 1 : (d === 'H' && ch !== 'c') ? 7 : 0; }
/* (the room-wide scatter rows, stumps, fallen logs and dead snags, are written per room in THE ONE WORLD MOVE below) */

/* ── checks: every prop key and unit exists; nothing in the room stands in the corn; every plot is walked to from the Woods gate with no step
   steeper than the walker climbs ── */
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key);
    const sx = Math.floor((p.x + HALF) / C), sy = Math.floor((p.z + HALF) / C); if (sx >= 0 && sy >= 0 && sx < W && sy < W && cell[sy][sx] === 'c') throw new Error(p.key + ' stands in the corn at ' + sx + ',' + sy); });
npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
const SP = [Math.round((WOODS_X + HALF) / C), 3];
{ const hC = (x, y) => (Hc[y * (W + 1) + x] + Hc[y * (W + 1) + x + 1] + Hc[(y + 1) * (W + 1) + x] + Hc[(y + 1) * (W + 1) + x + 1]) / 4, walk = (x, y) => open(x, y) && cell[y][x] !== 'B';
  const seen = new Uint8Array(W * W), st = [SP]; if (!walk(SP[0], SP[1])) throw new Error('the spawn is not open'); seen[SP[1] * W + SP[0]] = 1; let steep = 0;
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!walk(X, Y) || seen[Y * W + X]) continue;
      if (Math.abs(hC(X, Y) - hC(x, y)) / C > 0.3) { steep++; continue; } seen[Y * W + X] = 1; st.push([X, Y]); } }
  const cold = PLAN.plots.filter(p => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.y * N + ly) * W + p.x * N + lx]) return false; return true; }).map(p => p.id);
  if (process.env.ESTATE_DUMP) console.log(cell.map((r, y) => r.map((ch, x) => walk(x, y) && !seen[y * W + x] ? '!' : ch === 'c' ? ' ' : ch).join('')).join('\n'));
  if (cold.length) throw new Error('plots not reached on foot: ' + cold.join(' '));
  let op = 0, un = 0; for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (walk(x, y)) { op++; if (!seen[y * W + x]) un++; }
  Object.assign(count, { openSquares: op, unreachedSquares: un, steepSteps: steep }); }
Object.assign(count, { spaces: spaces.length, features: F.length + ARCH.length, props: props.length, doors: doors.length, natives: npc.length });

/* THE AIR BY DISTRICT (2026-11-16, the pilot district H; the Woods' and the Desert's way, three-renderer.js _hqBuildAtmos `shell.atmos.zones`): a district
   file may export `airZones(ctx)` = [{ sx0, sy0, sx1, sy1 (its own squares, the end exclusive), kind, color, n, speed, wind }]. With no zone from any
   file the shell line is what it was (the site's own air: data.js HQ_ATMOS_SITES.prebuilt_skinwalker, fireflies 160). With one, that air is kept as a
   last zone over the whole room, because a room with zones draws only its zones. */
const AIR_HOME = {}; Object.keys(DISTRICTS).filter(k => typeof DISTRICTS[k].airZones === 'function').forEach(k => { AIR_HOME[k] = (DISTRICTS[k].airZones(CTX[k]) || []).map(z => { const q = Object.assign({}, z, { x0: gx(z.sx0), z0: gx(z.sy0), x1: gx(z.sx1), z1: gx(z.sy1) });
    delete q.sx0; delete q.sy0; delete q.sx1; delete q.sy1; return q; }); });

/* ══ THE ONE WORLD MOVE (2026-11-17, mondo's approved map v13; docs/plans/one-world/BUILD_PLAN.md phase 2, the test slice) ══════════════════════
   Everything above builds the Estate in THE HOME FRAME, the 6 x 6 room the four district files were written for. Here the result is stood where
   the One World map puts it (docs/plans/one-world/plots.json; the mover = ow-move.js):
     THE CORN FIELDS (district C)  -> its own room at world plots -14..-13 x 5..10: two columns of six, the walk south from the Woods Gate to the Hub.
                                      COUNTY LANE (route R7) runs down the line between the two columns, and R7's three plots that stand in the
                                      district's gaps (-13,5 · -13,8 · -13,10) are this room's: open fields beside the lane
     THE LAKE (district L)         -> its own room at -12..-10 x 15..17, its nine plots as they stood
     THE HAUNTED HOUSE + THE RANCH (H, R) stay as they stood (one room, 6 x 3 plots) until the Estate's own thread moves them
   A plot keeps its name, its squares and every piece on it. What is laid again is the tool's own: the lane, the tracks between plots that touch
   now, the tracks that led to a plot that is no longer there (back to corn), the corn rows at the foot of a bank that moved, the levels, the open
   ground, the paint, the room-wide scatter, the doors on the seams. Rules: docs/notes/areas-complexes.md "ONE WORLD, THE TEST SLICE". ── */
const PJ = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/plans/one-world/plots.json'), 'utf8'));
const HOMEP = PLAN.plots.map(p => ({ id: p.id, x: p.x, y: p.y, name: p.name, district: p.d, level: p.level }));
const MOVER = require('./ow-move.js')({ cols: G, rows: G, cell, fill: 'c', plots: HOMEP, features: F.concat(ARCH), props, npc, doors });
const v13 = letter => { const d = PJ.districts.find(q => q.today && q.today.room === ROOM && q.today.districts.indexOf(letter) >= 0); if (!d) throw new Error('plots.json has no Estate district ' + letter);
    return d.plots.map(q => { const p = plot[q.was]; if (!p || p.name !== q.n || p.d !== letter) throw new Error('plots.json and the layout disagree on ' + q.was + ' ' + q.n); return { id: q.was, wx: q.x, wy: q.y }; }); };
const OWP = require('./ow-places.js');
const R7 = PJ.routes.find(r => r.id === 'R7'), R7_HERE = [[-13, 5, 'County Lane, the north field'], [-13, 8, 'County Lane, the middle field'], [-13, 10, 'County Lane, the south field']];   // (each field is renamed for the place that stands on it, below)
R7_HERE.forEach(q => { if (!R7.plots.some(p => p[0] === q[0] && p[1] === q[1])) throw new Error('plots.json: R7 has no plot ' + q[0] + ',' + q[1]); });
const R_CORN = 'site_prebuilt_skinwalker_ow_corn', R_LAKE = 'site_prebuilt_skinwalker_ow_lake', R_CLEAR = 'site_prebuilt_fairy_forest_ow_clearing';
const R_HOUSE = 'site_prebuilt_skinwalker_ow_house', R_RANCH = 'site_prebuilt_skinwalker_ow_ranch', R_RITUAL = 'site_prebuilt_fairy_forest_ow_ritual';   // (R_RITUAL: the Woods' room that holds the Ritual Ground + L2 + L5, written by bake-woods.js)
const R8 = PJ.routes.find(r => r.id === 'R8'), R8_HERE = [[-10, 18, 'Ranch Road, the lake field']];   // R8's one plot in the Ranch's box, alone between the Lake, the gate and the Barn (rule 4: the district's room's)
R8_HERE.forEach(q => { if (!R8.plots.some(p => p[0] === q[0] && p[1] === q[1])) throw new Error('plots.json: R8 has no plot ' + q[0] + ',' + q[1]); });
/* the seams: the plot, its side, how many squares along that side from the plot's corner the path crosses (left out: where the plot is open), the room past it */
const STAND = [
    { id: R_CORN, part: 'ow_corn', label: 'THE CORN FIELDS', sub: 'THE ESTATE · COUNTY LANE · 12 PLOTS', letters: ['C'], world: true, lane: true,
      list: v13('C').concat(R7_HERE.map(q => ({ wx: q[0], wy: q[1], name: q[2], district: 'C', level: 1 }))),
      parti: 'Corn you cannot see over, two plots wide and six long, the walk south from the Woods Gate to the Hub: tracks cut through it, and County Lane straight down the middle.',
      seams: [
          { plot: 'P01-00', side: 'N', takes: 'woods', id: 'ow_h_m14_5', room: R_CLEAR, label: 'THE WOODS · THE CLEARING', sub: 'THE FENCE LINE · THE GATE', desc: 'A fence, and a gate in it. The trees start on the other side.' },
          { plot: 'P01-02', side: 'S', along: 12, id: 'ow_h_m14_11', room: R_LAKE, open: 11, label: 'COUNTY LANE', sub: 'THE LANE SOUTH · TO THE LAKE', desc: 'The lane leaves the corn and runs on between open fields.' },
          /* THE FOOTPATH (the map's wild link L8: from The Rows, east down through County Lane's south field): it leaves the corn by its own gap, 21 m east of the lane's */
          { cell: [-13, 10], side: 'S', along: 6, id: 'ow_h_m13_11', room: R_LAKE, footpath: true, label: 'THE TRAIL · THE LONG GRASS', sub: 'THE FOOTPATH SOUTH · TO THE LAKE', desc: 'A footpath leaves the field through a gap in the corn, off into grass nobody cuts.' },
      ] },
    /* THE JOINING RULE (2026-11-17, mondo after the test slice): County Lane, the wild link L8 and the Lake are ONE room. The route kit writes it
       (`node bake-route.js R7`, docs/areas/routes/R7.json `join`) and asks this tool for the Lake's plots with `--export ow_lake <file>`: this tool
       stands the district as before and hands it over; it does not write a room for it (`kit: true`). */
    { id: R_LAKE, part: 'ow_lake', label: 'THE LAKE', sub: 'THE ESTATE · 9 PLOTS', letters: ['L'], world: true, kit: true, list: v13('L'),
      parti: 'A lake between its shores, nine plots: the reeds and the north shore where the lane comes in, the boathouse, the dock, the marsh, and open water in the middle.',
      seams: [
          /* the Ranch: its gate stands right south of the lake's south shore (phase 3 moved it there) */
          { plot: 'P04-02', side: 'S', along: 6, id: 'ow_h_m11_18', room: R_RANCH, spawn: true, open: 6, label: 'THE RANCH', sub: 'THE SOUTH SHORE · THE RANCH GATE', desc: 'A track leaves the shore between fence posts.' },
      ] },
    /* PHASE 3 (2026-11-17, BUILD_PLAN wave A, the Estate thread): THE HAUNTED HOUSE and THE RANCH stand at their v13 places too, one room each (the
       room-splitting rule: the Ranch touches the Lake, but the Lake's room holds 25 plots and 25 + 10 is over 30; the house stands alone in the forest,
       up its own drive from the wild link L5, which is the Woods' and joins the Ritual Ground's room by rule 4). The old room id is retired. */
    { id: R_HOUSE, part: 'ow_house', label: 'THE HAUNTED HOUSE', sub: 'THE ESTATE · THE DRIVE, THE HOUSE AND THE GRAVEYARD · 9 PLOTS', letters: ['H'], world: true, ewJoin: true, list: v13('H'),
      parti: 'A house on its rise at the top of a long drive through the corn: the iron gate, the drive, the lawn, the house between its gazebo and its treehouse, the graveyard below it and the crypt at the end.',
      seams: [
          /* THE DRIVE IN: the Iron Gate's north side, where the Woods' wild link L5 comes down from the Ritual Ground (the Woods thread writes the other side) */
          { plot: 'P01-03', side: 'N', id: 'ow_h_m21_11', room: R_RITUAL, spawn: true, label: 'THE WOODS · THE RITUAL GROUND', sub: 'THE TRAIL NORTH · OUT OF THE IRON GATE', desc: 'Past the gate a trail goes off north into the trees.' },
      ] },
    { id: R_RANCH, part: 'ow_ranch', label: 'THE RANCH', sub: 'THE ESTATE · THE RANCH · 10 PLOTS', letters: ['R'], world: true, fields: true, fieldPlaces: ['bees'],
      /* THE STABLE DOOR (Room 512's bay, siteRooms.entry.prebuilt_skinwalker): it stood on the Yard's south wall; the Yard is inside the room now (the Paddock
         stands south of it), so the door goes on the room's own south wall, at the Cow Field's foot, with a track cut up to the field's open ground */
      bay: { plot: 'P05-05', k: 5 },
      list: v13('R').concat(R8_HERE.map(q => ({ wx: q[0], wy: q[1], name: q[2], district: 'R', level: 1 }))),
      parti: 'A working ranch in the corn, nine plots and the Ranch Road\'s field at its north-east corner: the gate on the lake side, the yard between the barn and the farmhouse, the paddock, the windmill, the pastures and the cow field at the south end.',
      seams: [ { plot: 'P03-05', side: 'N', id: 'ow_h_m11_18', room: R_LAKE, spawn: true, open: 6, label: 'THE LAKE', sub: 'THE RANCH GATE · THE SOUTH SHORE', desc: 'The track runs down to water.' } ] },
];
const SIDE4 = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] }, FACE = { N: 180, E: 270, S: 0, W: 90 };   // a free door on that side of a plot: the way its opening faces, INTO the plot (ow-move.js)
const ROOMS_OUT = [], STRAYS = [], PLACES = {};
STAND.forEach(S => {
    const R = MOVER.room(S.list), Wn = R.W, Dn = R.D, c2 = R.cell, chg = new Set();
    R.strays.forEach(t => STRAYS.push(S.label + ': ' + t));
    /* THE HOUSES PAST THE CORN (pieces the district files set OUTSIDE the home room, e.g. H.js's two rim houses): they move with the plot they lie
       past. One that now lands inside the new room's box, or on its wall, is a STRAY: it is set past the room's wall on the nearest side of its own plot
       that has no plot beside it, as far out as it lay before (printed below; nothing is dropped) */
    props.forEach(hp => { const ox = Math.max(0, Math.abs(hp.x) - HALF), oz = Math.max(0, Math.abs(hp.z) - HALF); if (!ox && !oz) return;
        const to = R.toRoom(hp.x, hp.z); if (!to) return; const q = R.props.find(p => p.key === hp.key && p.x === to[0] && p.z === to[1]); if (!q) return;
        if (Math.abs(q.x) > R.HX + 1 || Math.abs(q.z) > R.HZ + 1) return;
        const e = R.at[Math.min(R.cols - 1, Math.max(0, Math.floor((q.x + R.HX) / PL))) + ',' + Math.min(R.rows - 1, Math.max(0, Math.floor((q.z + R.HZ) / PL)))];
        const out = Math.max(ox, oz), cx = -R.HX + (e.col + 0.5) * PL, cz = -R.HZ + (e.row + 0.5) * PL;
        const sides = [['W', e.col === 0, [-R.HX - out, cz]], ['E', e.col === R.cols - 1, [R.HX + out, cz]], ['N', e.row === 0, [cx, -R.HZ - out]], ['S', e.row === R.rows - 1, [cx, R.HZ + out]]].filter(t => t[1]);
        if (!sides.length) throw new Error(S.id + ': ' + hp.key + ' past the corn has no outside side on ' + e.name);
        const w = sides.sort((a, b) => Math.hypot(a[2][0] - q.x, a[2][1] - q.z) - Math.hypot(b[2][0] - q.x, b[2][1] - q.z))[0];
        STRAYS.push(S.label + ': ' + hp.key + ' (past the corn) fell on the room at ' + q.x + ',' + q.z + ': set past the ' + w[0] + ' wall of ' + e.name + ' at ' + r2(w[2][0]) + ',' + r2(w[2][1]));
        q.x = r2(w[2][0]); q.z = r2(w[2][1]); });
    const inR = (x, y) => x >= 0 && y >= 0 && x < Wn && y < Dn, openR = (x, y) => inR(x, y) && c2[y][x] !== 'c';
    const set = (x, y, ch) => { if (inR(x, y) && c2[y][x] !== ch) { c2[y][x] = ch; chg.add(x + ':' + y); } };
    const sqOf = (x, z) => [Math.floor((x + R.HX) / C + 1e-9), Math.floor((z + R.HZ) / C + 1e-9)];
    const stood = new Set(); R.props.forEach(p => { if (p.key !== 'corn_row') stood.add(sqOf(p.x, p.z).join(':')); }); R.features.forEach(f => { if (f.x != null && f.k !== 'scatter' && f.k !== 'dip') stood.add(sqOf(f.x, f.z).join(':')); }); R.npc.forEach(n => stood.add(sqOf(n.x, n.z).join(':')));
    const border = (e, sd, k) => sd === 'N' ? [e.col * N + k, e.row * N] : sd === 'S' ? [e.col * N + k, e.row * N + N - 1] : sd === 'W' ? [e.col * N, e.row * N + k] : [e.col * N + N - 1, e.row * N + k];
    const openK = (e, sd) => { const o = []; for (let k = 0; k < N; k++) { const q = border(e, sd, k); if (openR(q[0], q[1])) o.push(k); } return o; };
    const runs = o => { const out = []; let a = o[0]; for (let i = 1; i <= o.length; i++) if (i === o.length || o[i] !== o[i - 1] + 1) { out.push([a, o[i - 1]]); a = o[i]; } return o.length ? out : []; };
    const nbr = (e, sd) => R.at[(e.col + SIDE4[sd][0]) + ',' + (e.row + SIDE4[sd][1])] || null;
    const seamPlot = sm => sm.cell ? R.at[(sm.cell[0] - R.wx) + ',' + (sm.cell[1] - R.wy)] : R.ofHome[sm.plot];
    const seamOn = (e, sd) => S.seams.some(q => seamPlot(q) === e && q.side === sd);
    const doorOn = (e, sd) => R.doors.some(d => d.plot === e && d.side === sd.toLowerCase());
    const cnt = { lane: 0, cut: 0, back: 0, rowsOut: 0, rowsIn: 0 };
    if (S.lane || S.fields) {
        /* THE FIELDS on a route's own plots (County Lane's in the corn, the Ranch Road's by the Ranch): open grass inside a rim of corn */
        R.order.filter(e => e.isNew).forEach(e => { for (let ly = 1; ly <= 10; ly++) for (let lx = 2; lx <= 10; lx++) set(e.col * N + lx, e.row * N + ly, 'g'); });
    }
    if (S.lane) {
        /* THE LANE: four squares of dirt down the line between the two columns, from the north field to the south wall */
        for (let y = 1; y < Dn; y++) for (let x = Wn / 2 - 2; x < Wn / 2 + 2; x++) if (c2[y][x] === 'c') { set(x, y, 'p'); cnt.lane++; }
    }
    if (!S.home) {
        /* a track cut inward from a side's square until it meets the plot's open ground */
        const inward = (e, sd, k) => { const [bx, by] = border(e, sd, k), dx = -SIDE4[sd][0], dy = -SIDE4[sd][1]; for (let i = 0; i < N; i++) { const x = bx + dx * i, y = by + dy * i; if (R.plotOfSq(x, y) !== e) return; if (openR(x, y)) { if (i) return; continue; } set(x, y, 'p'); cnt.cut++; } };
        /* two plots, one over the other: where either is open on the line the other opens too, joined along the line where the two openings stand apart */
        [['S', 'N'], ['E', 'W']].forEach(([SA, SB]) => R.order.forEach(A => { if (SA === 'E' && !S.fields && !S.ewJoin) return; const B = nbr(A, SA); if (!B) return; const oa = openK(A, SA), ob = openK(B, SB); if (!oa.length && !ob.length) return;
            let ks = [...new Set(oa.concat(ob))].sort((a, b) => a - b); if (oa.length && ob.length) { const lo = ks[0], hi = ks[ks.length - 1]; ks = []; for (let k = lo; k <= hi; k++) ks.push(k); }
            ks.forEach(k => { for (const [e, sd] of [[A, SA], [B, SB]]) { const q = border(e, sd, k); if (!openR(q[0], q[1])) { set(q[0], q[1], 'p'); cnt.cut++; } } });
            if (!oa.length) ob.forEach(k => inward(A, SA, k)); if (!ob.length) oa.forEach(k => inward(B, SB, k)); }));
        if (S.bay) { const e = R.ofHome[S.bay.plot]; if (!e || e.row !== R.rows - 1) throw new Error(S.id + ': the stable door\'s plot is not on the south wall'); [S.bay.k, S.bay.k + 1].forEach(k => inward(e, 'S', k)); }
    }
    {   /* (every room, the plots that did not move too: their tracks north led to the corn and the lake) */
        /* a track that led to a plot which is no longer there: back to corn, from the line inward, while it is a plain corridor nothing stands on */
        R.order.forEach(e => { if (e.isNew) return; ['N', 'S', 'W', 'E'].forEach(sd => { const laneSide = S.lane && ((sd === 'E' && e.col === 0) || (sd === 'W' && e.col === 1));
            if (nbr(e, sd) || laneSide || seamOn(e, sd) || doorOn(e, sd)) return;
            runs(openK(e, sd)).forEach(([k0, k1]) => { const dx = -SIDE4[sd][0], dy = -SIDE4[sd][1], lx = sd === 'N' || sd === 'S' ? 1 : 0, ly = lx ? 0 : 1; if (k1 - k0 > 2) return;
                for (let i = 0; i < N; i++) { const sq = []; for (let k = k0; k <= k1; k++) { const b = border(e, sd, k); sq.push([b[0] + dx * i, b[1] + dy * i]); }
                    const a = sq[0], b = sq[sq.length - 1];
                    if (!sq.every(q => R.plotOfSq(q[0], q[1]) === e && 'po'.includes(c2[q[1]][q[0]]) && !stood.has(q[0] + ':' + q[1])) || openR(a[0] - lx, a[1] - ly) || openR(b[0] + lx, b[1] + ly)) break;
                    sq.forEach(q => { set(q[0], q[1], 'c'); cnt.back++; }); } }); }); });
    }
    if (!S.home) {
        /* every plot is walked to: one the lane and the joints miss gets its nearest open square carried straight to the lane (two squares wide) */
        const flood = from => { const seen = new Uint8Array(Wn * Dn), st = [from]; seen[from[1] * Wn + from[0]] = 1; while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (openR(X, Y) && c2[Y][X] !== 'B' && !seen[Y * Wn + X]) { seen[Y * Wn + X] = 1; st.push([X, Y]); } } } return seen; };
        if (S.lane) for (let pass = 0; pass < 20; pass++) { const seen = flood([Wn / 2, 2]); const cold = R.order.find(e => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(e.row * N + ly) * Wn + e.col * N + lx]) return false; return true; }); if (!cold) break;
            let best = null; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const x = cold.col * N + lx, y = cold.row * N + ly; if (!openR(x, y) || c2[y][x] === 'B') continue; const d = Math.abs(x - Wn / 2); if (!best || d < best[0]) best = [d, x, y]; }
            if (!best) throw new Error(S.id + ': ' + cold.name + ' has no open ground'); const step = best[1] < Wn / 2 ? 1 : -1;
            for (let x = best[1]; x !== Wn / 2 - (step > 0 ? 0 : 1); x += step) for (const dy of [0, 1]) if (inR(x, best[2] + dy) && c2[best[2] + dy][x] === 'c') { set(x, best[2] + dy, 'p'); cnt.cut++; } }
    }
    /* THE CORN ROWS (districts/C.js THE CORN AT LAST: a `corn_row` at the foot of the bank on an open square's side that touches the corn, two in three):
       a row whose bank is gone, or whose own square went back to corn, leaves; a side that touches corn now and did not before gets one, by the same rule */
    let propsOut = R.props;
    if (S.letters.indexOf('C') >= 0) { const rr = mkRnd(51317);
        propsOut = R.props.filter(p => { if (p.key !== 'corn_row') return true; const [x, y] = sqOf(p.x, p.z), ox = p.x - R.gcx(x), oz = p.z - R.gcz(y), dx = Math.abs(ox) > Math.abs(oz) ? Math.sign(ox) : 0, dy = dx ? 0 : Math.sign(oz);
            if (!openR(x, y) || openR(x + dx, y + dy)) { cnt.rowsOut++; return false; } return true; });
        for (let y = 1; y < Dn - 1; y++) for (let x = 0; x < Wn; x++) { if (!openR(x, y) || c2[y][x] === 'B') continue;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inR(x + dx, y + dy) || openR(x + dx, y + dy) || (x + y) % 3 === 0) continue; if (!chg.has(x + ':' + y) && !chg.has((x + dx) + ':' + (y + dy))) continue;
                propsOut.push({ key: 'corn_row', x: r2(R.gcx(x) + dx * 1.42 + (dx ? 0 : (rr() - 0.5) * 0.3)), z: r2(R.gcz(y) + dy * 1.42 + (dy ? 0 : (rr() - 0.5) * 0.3)), face: (dx ? 90 : 0) + (rr() < 0.5 ? 180 : 0), noBlock: true }); cnt.rowsIn++; } } }
    const featsOut = R.features.slice();
    if (S.lane || S.fields) R.order.filter(e => e.isNew).forEach((e, i) => { const x0 = e.col * N, y0 = e.row * N;
        /* the fields' own dressing (the route kit's farmland: sunflowers, wild flowers, a milestone on the lane, a ranch fence with its gap): the tool's, not a district's */
        featsOut.push({ k: 'scatter', key: 'sunflowers', n: 5, seed: 700 + i, x: R.gx(x0 + 6.5), z: R.gz(y0 + 6), r: 13, r0: 0.6 }, { k: 'scatter', key: 'wild_flowers', n: 9, seed: 710 + i, x: R.gx(x0 + 6.5), z: R.gz(y0 + 6), r: 14 });
        featsOut.push({ k: 'rail', x0: R.gx(x0 + 2), z0: R.gz(y0 + 1), x1: R.gx(x0 + 2), z1: R.gz(y0 + 4.5), model: 'ranch' }, { k: 'rail', x0: R.gx(x0 + 2), z0: R.gz(y0 + 7.5), x1: R.gx(x0 + 2), z1: R.gz(y0 + 11), model: 'ranch' });
        propsOut.push({ key: 'milestone', x: R.gcx(x0 + 2), z: R.gcz(y0 + 5), face: 270 });
        /* THE PLACE ON THE WAY (ow-places.js: one a route plot; the names are ideas): the hay stack, the bee yard, the rest, off the lane on the field's east side */
        const pl = OWP.PLACES[(S.fieldPlaces || ['haystack', 'bees', 'rest'])[i % 3]]; e.name = (S.lane ? 'County Lane, ' : 'Ranch Road, ') + pl.name;
        OWP.lay(pl, x0 + 8, y0 + 4, { P: (key, sx, sy, o) => propsOut.push(Object.assign({ key, x: R.gcx(sx), z: R.gcz(sy) }, o || {})), at: (key, fx, fy, o) => propsOut.push(Object.assign({ key, x: R.gx(fx), z: R.gz(fy) }, o || {})) }); });
    /* the seams: a door on each crossing */
    const takes = S.seams.map(q => q.takes).filter(Boolean), doorsOut = R.doors.filter(d => takes.indexOf(d.id) < 0).map(d => { const o = Object.assign({}, d); delete o.side; delete o.plot; return o; }), ways = []; let spSq = null, spFace = 180;
    S.seams.forEach(sm => { const e = seamPlot(sm), sd = sm.side; if (!e) throw new Error(S.id + ': no plot ' + (sm.plot || sm.cell));
        /* a footpath's seam: its squares are cut through the field's rim and a path is painted up the field to the plot's north side */
        if (sm.footpath) { const x0 = e.col * N + sm.along - 1; for (let ly = 0; ly < N; ly++) for (const x of [x0, x0 + 1]) set(x, e.row * N + ly, 'p'); }
        let along = sm.along; const old = sm.takes && R.doors.find(d => d.id === sm.takes);
        if (old) along = ((old.x != null && (sd === 'N' || sd === 'S') ? old.x + R.HX : old.z + R.HZ) / C) - (sd === 'N' || sd === 'S' ? e.col : e.row) * N;
        if (along == null) { const rn = runs(openK(e, sd)).sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0]; if (!rn) throw new Error(S.id + ': ' + e.name + ' is not open on its ' + sd + ' side'); along = (rn[0] + rn[1] + 1) / 2; }
        const ns = sd === 'N' || sd === 'S', onWall = (sd === 'N' && e.row === 0) || (sd === 'S' && e.row === R.rows - 1) || (sd === 'W' && e.col === 0) || (sd === 'E' && e.col === R.cols - 1), q = border(e, sd, Math.max(0, Math.min(N - 1, Math.floor(along - 0.01))));
        if (!openR(q[0], q[1])) throw new Error(S.id + ': the seam ' + sm.id + ' stands in the corn at ' + q.join(','));
        const d = { id: sm.id, wall: onWall ? sd.toLowerCase() : 'free' };
        if (onWall) { if (ns) d.x = R.gx(e.col * N + along); else d.z = R.gz(e.row * N + along); ways.push({ side: d.wall, at: ns ? d.x : d.z }); }
        else { d.x = ns ? R.gx(e.col * N + along) : R.gcx(q[0]); d.z = ns ? R.gcz(q[1]) : R.gz(e.row * N + along); d.face = FACE[sd]; d.passage = Object.assign({}, MOVER.FREE_PASS); }   // (ow-move.js A FREE SEAM IS CROSSED ON THE PLOT'S OWN SQUARES)
        d.plotCol = e.col; d.plotRow = e.row; d.side = sd; d.along = along;   // (for the route kit, when it takes this room in: stripped by the writer)
        /* THE OPEN SEAM (data.js DOOR_HQ.ways.open): `open: <metres wide>` on a seam = open country, or a road that runs on: nothing stands in it */
        if (sm.open) d.passage = Object.assign(d.passage || {}, { w: sm.open });
        doorsOut.push(Object.assign(d, { way: sm.open ? 'open' : 'trail', label: sm.label, sub: sm.sub, action: { room: sm.room, at: sm.id }, desc: sm.desc }));
        if (sm.spawn || (old && !spSq)) { spSq = [q[0] - SIDE4[sd][0] * 2, q[1] - SIDE4[sd][1] * 2]; spFace = FACE[sd]; } });
    if (!spSq || !openR(spSq[0], spSq[1])) throw new Error(S.id + ': no open spawn square');
    /* the hand-written rows of data.js that name a place in the home room: where each stands now */
    [['bay', { wall: 's', x: BAY_X }], ['bay13', Object.assign({ wall: 'free' }, BAY13)], ['well', Object.assign({ wall: 'free' }, WELL)], ['lodge', Object.assign({ wall: 'free' }, LODGE)]].forEach(([k, h]) => {
        const hx = h.x, hz = h.wall === 's' ? HALF - 0.5 : h.z, hp = MOVER.homePlot(hx, hz), e = R.ofHome[hp.id]; if (!e) return;
        if (k === 'bay' && S.bay) { const eb = R.ofHome[S.bay.plot]; PLACES.bay = { room: S.id, part: S.part, wall: 's', x: r2(R.gx(eb.col * N + S.bay.k + 1)) }; return; }
        PLACES[k] = h.wall === 's' ? { room: S.id, part: S.part, wall: 's', x: r2(h.x + e.dx) } : { room: S.id, part: S.part, wall: 'free', x: r2(h.x + e.dx), z: r2(h.z + e.dz), face: h.face }; });
    /* every plot is reached on foot from the spawn */
    { const seen = new Uint8Array(Wn * Dn), st = [spSq]; seen[spSq[1] * Wn + spSq[0]] = 1; while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (openR(X, Y) && c2[Y][X] !== 'B' && !seen[Y * Wn + X]) { seen[Y * Wn + X] = 1; st.push([X, Y]); } } }
      const cold = R.order.filter(e => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(e.row * N + ly) * Wn + e.col * N + lx]) return false; return true; }).map(e => e.name);
      if (process.env.ESTATE_DUMP) console.log('\n' + S.id + '\n' + c2.map((r, y) => r.map((ch, x) => stood.has(x + ':' + y) && ch !== 'c' ? 'o' : openR(x, y) && ch !== 'B' && !seen[y * Wn + x] ? '!' : ch === 'c' ? ' ' : ch).join('')).join('\n'));
      if (cold.length) throw new Error(S.id + ': plots not reached on foot: ' + cold.join(', ')); }
    /* the levels (the plots that did not move keep the home ground, buildings' flats and all), the open ground, the paint */
    const dz0 = S.home ? R.order[0].dz : 0, lv = R.levels(LEVEL), hAt = S.home ? (sx, sy) => Hc[(sy - Math.round(dz0 / C)) * (W + 1) + sx] : (sx, sy) => lv(R.gx(sx), R.gz(sy));
    const slope2 = Buffer.alloc(Wn * Dn * 8);
    for (let cy = 0; cy < Dn; cy++) for (let cx = 0; cx < Wn; cx++) { const o = (cy * Wn + cx) * 8; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((q, k) => slope2.writeInt16LE(Math.round(hAt(cx + q[0], cy + q[1]) * 100), o + k * 2)); }
    const spaces2 = R.spaces(openR), paint2 = new Uint8Array(Wn * Dn);
    for (let y = 0; y < Dn; y++) for (let x = 0; x < Wn; x++) { const ch = c2[y][x], e = R.plotOfSq(x, y), d = e ? e.district : S.letters[0], hy = e && e.home ? y - e.row * N + e.home.y * N : -1;
        paint2[y * Wn + x] = ch === 'p' ? 1 : ch === 'o' ? 2 : ch === 'j' ? ((d === 'R' && hy !== 56) ? 0 : 3) : ch === 'm' ? 4 : ch === 'D' ? (d === 'C' ? 5 : 6) : ch === 'r' ? 8 : ch === 's' ? 5 : (ch === 'B' && d === 'R') ? 1 : (d === 'H' && ch !== 'c') ? 7 : 0; }
    const share = S.list.length / 36;
    featsOut.push({ k: 'scatter', key: 'stump', n: Math.max(1, Math.round(8 * share)), seed: 6 }, { k: 'scatter', key: 'fallen_log', n: Math.max(1, Math.round(6 * share)), seed: 7, r0: 1.9 }, { k: 'scatter', key: 'dead_snag', n: Math.max(1, Math.round(5 * share)), seed: 8 });
    /* the air: a district's box moves with its plots when they all moved the same way, else it covers the whole new room */
    const boxOf = z => { const pts = [[z.x0 + 1, z.z0 + 1], [z.x1 - 1, z.z0 + 1], [z.x0 + 1, z.z1 - 1], [z.x1 - 1, z.z1 - 1], [(z.x0 + z.x1) / 2, (z.z0 + z.z1) / 2]].map(q => { const hp = MOVER.homePlot(q[0], q[1]); return hp && R.ofHome[hp.id]; });
        if (pts.every(e => !e)) return null; const e0 = pts.find(Boolean), same = pts.every(e => e && e.dx === e0.dx && e.dz === e0.dz), o = Object.assign({}, z);
        if (same) { o.x0 = r2(z.x0 + e0.dx); o.x1 = r2(z.x1 + e0.dx); o.z0 = r2(z.z0 + e0.dz); o.z1 = r2(z.z1 + e0.dz); } else { o.x0 = -R.HX; o.x1 = R.HX; o.z0 = -R.HZ; o.z1 = R.HZ; } return o; };
    const air = [].concat(...S.letters.map(k => AIR_HOME[k] || [])).map(boxOf).filter(Boolean);
    const lines = (S.letters.indexOf('C') >= 0 ? O_FIELDS.l : []).concat(S.letters.indexOf('H') >= 0 ? O_GROUNDS.l : []);
    ROOMS_OUT.push({ S, R, c2, hAt, own: featsOut, feats: spaces2.concat(featsOut), props: propsOut, doors: doorsOut, ways, slope: slope2, paint: paint2, air, lines, sp: { x: R.gcx(spSq[0]), z: R.gcz(spSq[1]), face: spFace },
        count: Object.assign({ plots: S.list.length, box: R.cols + 'x' + R.rows, spaces: spaces2.length, props: propsOut.length, features: featsOut.length, doors: doorsOut.length, natives: R.npc.length }, cnt) });
});
if (STRAYS.length) console.log('STRAYS (a piece across two plots that no longer stand the same way; each is answered in the notes, "ONE WORLD, THE TEST SLICE"):\n  ' + STRAYS.join('\n  '));
ROOMS_OUT.forEach(o => console.log(o.S.id + ' ' + JSON.stringify(o.count)));

/* THE EXPORT (the joining rule): `--export <part> <file>` hands one stood district to the route kit as JSON and writes nothing else */
{ const xi = process.argv.indexOf('--export'); if (xi >= 0) { const o = ROOMS_OUT.find(q => q.S.part === process.argv[xi + 1]); if (!o) throw new Error('no room with part ' + process.argv[xi + 1]);
    const { S, R } = o, hs = []; for (let y = 0; y <= R.D; y++) for (let x = 0; x <= R.W; x++) hs.push(Math.round(o.hAt(x, y) * 100) / 100);
    fs.writeFileSync(process.argv[xi + 2], JSON.stringify({ id: S.id, part: S.part, label: S.label, wx: R.wx, wy: R.wy, cols: R.cols, rows: R.rows, W: R.W, D: R.D, fill: 'c',
        plots: R.order.map(e => ({ col: e.col, row: e.row, name: e.name, district: e.district, level: e.level })), cell: o.c2.map(r => r.join('')), h: hs,
        floor: 'grass_2', pal: PAL, paint: Array.from(o.paint), features: o.own, props: o.props, npc: R.npc, doors: o.doors, lines: o.lines, air: o.air, grassField: true, sp: o.sp }));
    process.exit(0); } }
const stripDoor = d => { const o = Object.assign({}, d); delete o.plotCol; delete o.plotRow; delete o.side; delete o.along; return o; };
/* ── the rooms ── */
const L = [];
L.push("        /* ESTATE36-BEGIN — THE ESTATE ON PLOTS (2026-11-15) + THE ONE WORLD MOVE (2026-11-17: the Corn Fields and the Lake stand at their One World places as rooms of their own): written by `node bake-estate.js` from docs/areas/estate/layout.json + docs/plans/one-world/plots.json. Never hand-edit between the markers; edit the tool, a district file or the layout and rerun. */");
ROOMS_OUT.forEach(o => { const { S, R } = o, w = 2 * R.HX, d = 2 * R.HZ; if (S.kit) return;   // (the route kit writes this room: THE JOINING RULE)
    const atmos = o.air.length ? " atmos: " + J({ kind: 'fireflies', n: Math.round(160 * Math.max(0.4, S.list.length / 36)), zones: o.air.concat([{ x0: -R.HX, z0: -R.HZ, x1: R.HX, z1: R.HZ, kind: 'fireflies', n: Math.round(160 * Math.max(0.4, S.list.length / 36)) }]) }) + "," : "";
    L.push("        " + S.id + ": {");
    L.push("            label: " + J(S.label) + ",");
    L.push("            sub: " + J(S.sub) + ",");
    L.push("            kind: 'box', site: 'prebuilt_skinwalker', part: " + J(S.part) + ",");
    if (S.world) { L.push("            /* THE ONE WORLD: where this room stands on the world's plot grid (data.js hqOwIndex) */");
        L.push("            world: { hub: 'ranch', layer: 'surface', wx: " + R.wx + ", wy: " + R.wy + " },"); }
    L.push("            shell: hqRanchShell({ w: " + w + ", d: " + d + ", plate: { x: " + o.sp.x + ", z: " + o.sp.z + ", y: 4.4 }, wall: 'leaves_3'," + (S.world ? " forest: null," : "") + atmos + "\n" +
        "                                    /* THE CLEAN SKY (mondo 11-15: \"the sky is glitching/flickering in the estate\"): the ranch shell's night scenery ('eyes': a spinning ringed body, a door frame, an orb)\n" +
        "                                       drew as black outlines turning in the daytime sky. The Estate keeps the ranch's colours and fog and carries no bodies. */\n" +
        "                                    sky: { night: 1, tint: 0x2a1638, tintAmt: 0.5, stars: 0.6, nebula: 0.5, fog: { color: 0x2c2040, amount: 0.86, top: 0.1, band: 0.6, density: 0.024 }, scenery: 'none', density: 0.5, landmarks: " + (S.world ? "'world'" : "[]") + " } }),");
    L.push("            parti: " + J(S.parti) + ",");
    L.push("            typology: 'grid',");
    L.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + R.cols + ", nx: " + R.cols + ", nz: " + R.rows + ", mask: " + J(R.mask) + ", names: " + J(R.names) + " },");
    L.push("            terrain: {");
    L.push("                res: 0.875, floor: 'grass_2', cliff: 'leaves_3', path: 'dirt_2',");
    L.push("                noise: { amp: 0.1, scale: 8 },");
    L.push("                grassField: true,   // THE GRASS FIELD IN A WALKED ROOM (three-renderer.js _hqGrassTick): the battle maps' grass on every grass sheet here");
    if (S.world) L.push("                /* THE HORIZON READS THE MAP: the land past every line is the world's own ground there, plot by plot (three-renderer.js _hqEdgeLandFn `world`) */\n                backdrop: false, edges: { world: true, reach: 440, ways: " + J(o.ways) + " },");
    L.push("                slope: { cells: { res: " + C + ", x0: " + R.gx(0) + ", z0: " + R.gz(0) + ", nx: " + R.W + ", nz: " + R.D + ", d: '" + o.slope.toString('base64') + "' } },");
    L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + R.gcx(0) + ", z0: " + R.gcz(0) + ", nx: " + R.W + ", nz: " + R.D + ", d: '" + Buffer.from(o.paint).toString('base64') + "' },");
    L.push("                /* THE CORN IS THE WALL: every square that is not a `space` is the standing corn, a bank over the walker's head (the old Corn Fields' own) */");
    L.push("                gen: { kind: 'plan', look: 'rock', wallH: 2.4, edge: 0.3, jitter: 0, topNoise: 0.25, rim: 0, forceGrow: 0 },");
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
L.push("        /* ESTATE36-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
/* the rows in data.js that name a place in one of these rooms (written by hand there): the tool refuses to bake when one has drifted */
const WANT = [
    ["prebuilt_skinwalker: { room: '" + PLACES.bay.room + "', door: { id: 'bay', wall: 's', x: " + PLACES.bay.x + " } }", 'siteRooms.entry.prebuilt_skinwalker'],
    ["prebuilt_haunted: { room: '" + PLACES.bay13.room + "', door: { id: 'bay13', wall: 'free', x: " + PLACES.bay13.x + ", z: " + PLACES.bay13.z + ", face: " + PLACES.bay13.face + " } }", 'siteRooms.entry.prebuilt_haunted'],
    ["a: { site: 'prebuilt_skinwalker', part: '" + PLACES.well.part + "', wall: 'free', x: " + PLACES.well.x + ", z: " + PLACES.well.z + ", face: " + PLACES.well.face + ",", 'link well_skinwalker'],
    ["b: { site: 'prebuilt_skinwalker', part: '" + PLACES.lodge.part + "', wall: 'free', x: " + PLACES.lodge.x + ", z: " + PLACES.lodge.z + ", face: " + PLACES.lodge.face + ",", 'link ranch_lodge'],
];
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at these rooms yet (see the rows above)'); }
if (DRY) { ROOMS_OUT.forEach(o => console.log(o.S.id + (o.S.kit ? ' (handed to the route kit)' : '') + ' doors ' + JSON.stringify(o.doors.map(d => [d.id, d.wall, d.x, d.z, d.face])) + ' spawn ' + JSON.stringify(o.sp))); process.exit(0); }
const END = '        /* ESTATE36-END */\n', b0 = src.indexOf('        /* ESTATE36-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        site_prebuilt_skinwalker_fields: {'; const a = src.lastIndexOf('        /*', src.indexOf(anchor)); if (src.indexOf(anchor) < 0 || a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOMS_OUT.filter(o => !o.S.kit).map(o => o.S.id).join(', ') + ' written (' + block.length + ' bytes). Then: node bake-route.js R7 (County Lane\'s room takes the Lake in).');
