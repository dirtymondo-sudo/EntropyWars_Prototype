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
const WOODS_X = spur('P01-00', 'n');                       // the fence gate from the Woods (bake-woods.js door `estate` leads here)
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
    paint[y * W + x] = ch === 'p' ? 1 : ch === 'o' ? 2 : ch === 'j' ? ((d === 'R' && y !== 56) ? 0 : 3) : ch === 'm' ? 4 : ch === 'D' ? (d === 'C' ? 5 : 6) : ch === 'r' ? 8 : (ch === 'B' && d === 'R') ? 1 : (d === 'H' && ch !== 'c') ? 7 : 0; }
feat({ k: 'scatter', key: 'stump', n: 8, seed: 6 }); feat({ k: 'scatter', key: 'fallen_log', n: 6, seed: 7, r0: 1.9 }); feat({ k: 'scatter', key: 'dead_snag', n: 5, seed: 8 });

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
const AIR = [].concat(...Object.keys(DISTRICTS).filter(k => typeof DISTRICTS[k].airZones === 'function').map(k => (DISTRICTS[k].airZones(CTX[k]) || []).map(z => { const q = Object.assign({}, z, { x0: gx(z.sx0), z0: gx(z.sy0), x1: gx(z.sx1), z1: gx(z.sy1) });
    delete q.sx0; delete q.sy0; delete q.sx1; delete q.sy1; return q; })));
const ATMOS = AIR.length ? " atmos: " + J({ kind: 'fireflies', n: 160, zones: AIR.concat([{ x0: -HALF, z0: -HALF, x1: HALF, z1: HALF, kind: 'fireflies', n: 160 }]) }) + "," : "";
/* ── the room ── */
const SPM = { x: gx(SP[0]), z: gc(SP[1]) }, LINES = O_FIELDS.l.concat(O_GROUNDS.l), L = [];
L.push("        /* ESTATE36-BEGIN — THE ESTATE ON PLOTS (2026-11-15): written by `node bake-estate.js` from docs/areas/estate/layout.json. Never hand-edit between the markers; edit the tool or the layout and rerun. */");
L.push("        " + ROOM + ": {");
L.push("            label: 'THE ESTATE',");
L.push("            sub: 'FOUR DISTRICTS · 36 PLOTS',");
L.push("            kind: 'box', site: 'prebuilt_skinwalker', part: 'estate',");
L.push("            shell: hqRanchShell({ w: " + (2 * HALF) + ", d: " + (2 * HALF) + ", plate: { x: " + SPM.x + ", z: " + SPM.z + ", y: 4.4 }, wall: 'leaves_3'," + ATMOS + "\n" +
    "                                    /* THE CLEAN SKY (mondo 11-15: \"the sky is glitching/flickering in the estate\"): the ranch shell's night scenery ('eyes': a spinning ringed body, a door frame, an orb)\n" +
    "                                       drew as black outlines turning in the daytime sky. The Estate keeps the ranch's colours and fog and carries no bodies. */\n" +
    "                                    sky: { night: 1, tint: 0x2a1638, tintAmt: 0.5, stars: 0.6, nebula: 0.5, fog: { color: 0x2c2040, amount: 0.86, top: 0.1, band: 0.6, density: 0.024 }, scenery: 'none', density: 0.5, landmarks: [] } }),");
L.push("            parti: 'Four districts of nine plots, every plot a twelve by twelve board: tracks cut through corn you cannot see over, a lake, a ranch, and a house on its rise with the graveyard below it.',");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + G + ", names: " + J(PLAN.plots.map(p => [p.id, p.name, p.d, p.level])) + " },");
L.push("            terrain: {");
L.push("                res: 0.875, floor: 'grass_2', cliff: 'leaves_3', path: 'dirt_2',");
L.push("                noise: { amp: 0.1, scale: 8 },");
L.push("                grassField: true,   // THE GRASS FIELD IN A WALKED ROOM (three-renderer.js _hqGrassTick): the battle maps' grass on every grass sheet here");
L.push("                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gx(0) + ", nx: " + W + ", nz: " + W + ", d: '" + slope.toString('base64') + "' } },");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gc(0) + ", z0: " + gc(0) + ", nx: " + W + ", nz: " + W + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                /* THE CORN IS THE WALL: every square that is not a `space` is the standing corn, a bank over the walker's head (the old Corn Fields' own) */");
L.push("                gen: { kind: 'plan', look: 'rock', wallH: 2.4, edge: 0.3, jitter: 0, topNoise: 0.25, rim: 0, forceGrow: 0 },");
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
L.push("            lines: " + J(LINES) + ",");
L.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: 180 },");
L.push("        },");
L.push("        /* ESTATE36-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
/* the rows in data.js that name a place in this room (written by hand there): the tool refuses to bake when one has drifted */
const WANT = [
    ["prebuilt_skinwalker: { room: '" + ROOM + "', door: { id: 'bay', wall: 's', x: " + BAY_X + " } }", 'siteRooms.entry.prebuilt_skinwalker'],
    ["prebuilt_haunted: { room: '" + ROOM + "', door: { id: 'bay13', wall: 'free', x: " + BAY13.x + ", z: " + BAY13.z + ", face: " + BAY13.face + " } }", 'siteRooms.entry.prebuilt_haunted'],
    ["a: { site: 'prebuilt_skinwalker', part: 'estate', wall: 'free', x: " + WELL.x + ", z: " + WELL.z + ", face: " + WELL.face + ",", 'link well_skinwalker'],
    ["b: { site: 'prebuilt_skinwalker', part: 'estate', wall: 'free', x: " + LODGE.x + ", z: " + LODGE.z + ", face: " + LODGE.face + ",", 'link ranch_lodge'],
];
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at this room yet (see the rows above)'); }
if (DRY) process.exit(0);
const END = '        /* ESTATE36-END */\n', b0 = src.indexOf('        /* ESTATE36-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        site_prebuilt_skinwalker_fields: {'; const a = src.lastIndexOf('        /*', src.indexOf(anchor)); if (src.indexOf(anchor) < 0 || a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOM + ' written (' + block.length + ' bytes)');