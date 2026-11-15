#!/usr/bin/env node
/* bake-estate.js — THE ESTATE ON PLOTS (2026-11-15, mondo's OK on plot plan 2: "okay, those are all good" = the Estate is next, the plan as drawn,
   the plot names kept, the Barn and the Farmhouse walk-in, the Loch Ness Monster at the Lake). The fifth area of the world plan after the Woods,
   Camelot Kingdom, the Desert and the Mountains: 6 x 6 plots of 12 x 12 squares (252 m a side), four districts of nine:
   THE CORN FIELDS (north-west), THE LAKE (north-east), THE HAUNTED HOUSE + GRAVEYARD (south-west), THE RANCH (south-east).
   Reads docs/areas/estate/layout.json (the approved plan: every plot's name, district, level, and the 72 x 72 square map) and writes the room
   `site_prebuilt_skinwalker_estate` into data.js between ESTATE36-BEGIN / ESTATE36-END. `node bake-estate.js` writes; `--dry-run` prints the counts;
   `ESTATE_DUMP=1` prints the walked map. Never hand-edit between the markers: edit this tool or the layout and rerun.
   Notes: docs/notes/areas-complexes.md "THE ESTATE ON PLOTS".
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
let seed = 512; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const setRect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ch; };
const open = (x, y) => x >= 0 && y >= 0 && x < W && y < W && cell[y][x] !== 'c';

/* ── what the tool adds to the plan's squares ── */
setRect(14, 28, 16, 31, 'g');                              // THE HUB: a pocket off the tracks for the well
setRect(8, 65, 10, 66, 'p');                               // THE CRYPT: the path reaches its door (the plan's path met its corner)
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
    return { at: (lx, lz) => [r2(cx + lx * c - lz * s), r2(cz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd, door, cx, cz, rot };
}
const put = (B, key, lx, lz, o) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, o || {}); if (r.face != null) r.face = B.face(r.face); props.push(r); };   // `face` in the building's frame
const SOLID = { hollow: false, leaf: undefined, leafDouble: undefined, keyIn: undefined, floorIn: undefined };
const windows = (a, w, d, y, hh, skipX, tint, glow) => { for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (skipX != null && Math.abs(x - skipX) < 1.7) continue;
    a.box(x, y, d / 2 + 0.06, 1.2, hh, 0.08, GLS, tint, { glow }); a.box(x, y - 0.14, d / 2 + 0.12, 1.6, 0.14, 0.16, WD2, 0x2a2622); a.box(x, y + hh, d / 2 + 0.12, 1.6, 0.14, 0.16, WD2, 0x2a2622); } };

/* THE HAUNTED HOUSE (the district's landmark, on its rise): its five floors are the rooms that exist (the Hall, Upstairs, the Nursery, the Attic, the
   Cellar), so out here it is a solid house and its front door leads into the Hall. Dark clapboard, a mansard, a tower over the door, two gabled bays,
   a porch across the front, brick chimneys; three windows lit, the rest dark. */
const HOUSE = building('house', [14, 50, 22, 56, 'S'], 10.5, SOLID, (a, w, d) => {
    const WALL = 0x8a8494, TRIM = 0x26222a, ROOF = 0x2c2830, LIT = 0xf0c868, DARK = 0x2a3040, f = d / 2;
    a.box(0, 0, 0, w + 0.1, 7, d + 0.1, WD, WALL, { top: false, uv: [3.5, 1.75] });
    a.roof('hip', 0, 7, 0, w + 1.4, 3.4, d + 1.4, SHG, ROOF);
    a.box(0, 0, f - 2.7, 5.6, 12.6, 5.6, WD, WALL, { top: false, uv: [3.5, 1.75] }); a.roof('pyramid', 0, 12.6, f - 2.7, 6.6, 5.2, 6.6, SHG, ROOF);   // the tower over the door (flush with the front: nothing drawn stands where you walk)
    a.box(0, 12.2, f - 2.7, 6.0, 0.3, 6.0, WD2, TRIM, { roof: true });
    for (const s of [-1, 1]) { a.box(s * 9.6, 0, f - 0.85, 5.2, 8.4, 1.9, WD, WALL, { top: false, uv: [3.5, 1.75] }); a.roof('gable', s * 9.6, 8.4, f - 0.85, 5.8, 2.4, 2.4, SHG, ROOF, { keyEnd: WD, tintEnd: WALL });   // the two gabled bays
        for (const y of [1.1, 4.4]) a.box(s * 9.6, y, f + 0.14, 1.4, 1.7, 0.08, GLS, (s < 0 && y > 4) ? LIT : DARK, { glow: (s < 0 && y > 4) ? 0.6 : 0.05 });
        a.box(s * 10.6, 7, -4.2, 1.3, 5.6, 1.3, BRK, 0x7a5a50, { roof: true }); a.box(s * 10.6, 12.6, -4.2, 1.6, 0.3, 1.6, BRK, 0x5a4640, { roof: true }); }
    for (const x of [-5.6, 5.6]) for (const y of [1.1, 4.4]) a.box(x, y, f + 0.1, 1.3, 1.7, 0.08, GLS, (x > 0 && y < 4) ? LIT : DARK, { glow: (x > 0 && y < 4) ? 0.6 : 0.05 });
    a.box(0, 8.6, f + 0.14, 1.4, 2.0, 0.08, GLS, LIT, { glow: 0.7 });                                                        // the tower's lit window
    a.box(0, 4.4, f + 0.14, 1.4, 1.7, 0.08, GLS, DARK, { glow: 0.05 });
    for (const s of [-1, 1]) for (let z = -f + 2.6; z < f - 1; z += 5.25) for (const y of [1.1, 4.4]) a.box(s * (w / 2 + 0.08), y, z, 0.08, 1.7, 1.3, GLS, DARK, { glow: 0.05 });
    /* the porch on the square row before the door: boards, posts, a lean-to roof */
    a.box(0, 0, f + 1.75, 13.6, 0.16, 3.4, FLR, 0x5a5048);
    for (const x of [-6.6, -3.4, 3.4, 6.6]) a.box(x, 0, f + 3.3, 0.22, 3.0, 0.22, WD2, TRIM);
    a.roof('shed', 0, 3.0, f + 1.85, 14.2, 0.8, 3.8, SHG, ROOF);
    a.box(-1.05, 0, f + 0.14, 0.2, 2.5, 0.2, WD2, TRIM); a.box(1.05, 0, f + 0.14, 0.2, 2.5, 0.2, WD2, TRIM); a.box(0, 2.4, f + 0.14, 2.5, 0.25, 0.2, WD2, TRIM);   // the front door's frame
});
/* THE BARN (walk-in): red boards, white corner boards, a tall roof with its ridge front to back, the hayloft door over the barn doors */
const BARN = building('barn', [51, 50, 58, 56, 'S'], 5.25, { leaf: 'leaf_barn', leafDouble: true, floorIn: 'dirt_2', storeys: 1 }, (a, w, d, door) => {
    const RED = 0x9a3a30, WHITE = 0xe8e2d4, ROOF = 0x5a5650;
    a.shell(w, 5.25, d, WD, RED, door, [3.5, 1.75]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.34, 5.25, 0.34, WD2, WHITE);
    a.box(0, 5.0, d / 2 + 0.08, w + 0.3, 0.25, 0.2, WD2, WHITE);
    a.roof('gable', 0, 5.25, 0, d + 0.8, 4.6, w + 0.8, COR, ROOF, { ry: 90, keyEnd: WD, tintEnd: RED });
    a.frame(door, d, WD2, WHITE);
    for (const sd of [-1, 1]) { a.box(door.lx + sd * 2.15, 0, d / 2 + 0.07, 2.3, 2.9, 0.08, WD2, 0x6a2a22); a.box(door.lx + sd * 2.15, 1.4, d / 2 + 0.12, 2.3, 0.14, 0.06, WD2, WHITE); a.box(door.lx + sd * 3.3, 0, d / 2 + 0.12, 0.14, 2.9, 0.06, WD2, WHITE); }   // the two big sliding doors, run back either side of the doorway
    a.box(door.lx, 2.9, d / 2 + 0.12, 7.0, 0.16, 0.1, WD2, WHITE);
    a.box(door.lx, 3.4, d / 2 + 0.07, 2.2, 1.4, 0.08, WD2, 0x4a2a22); a.box(door.lx, 3.3, d / 2 + 0.12, 2.6, 0.14, 0.14, WD2, WHITE); a.box(door.lx, 4.8, d / 2 + 0.12, 2.6, 0.14, 0.14, WD2, WHITE);   // the hayloft door
    for (const x of [-8.75, 8.75]) { a.box(x, 1.2, d / 2 + 0.06, 1.2, 1.2, 0.08, SHUT, 0xb0a898, { uv: 'fit', faces: 'f', top: false }); a.box(x, 1.06, d / 2 + 0.12, 1.6, 0.14, 0.16, WD2, WHITE); }
});
put(BARN, 'horse_brown', -8.6, -6.4, { face: 180 }); put(BARN, 'cow', 8.6, -6.4, { face: 180 }); put(BARN, 'cow', 8.6, -1.2, { face: 270 });
put(BARN, 'meshy_burlap_sack', -10.4, 4.4); put(BARN, 'meshy_burlap_sack', -9.2, 5.6); put(BARN, 'meshy_burlap_sack', -10.6, 6.6); put(BARN, 'wooden_bucket', -6.2, -8.6); put(BARN, 'wooden_bucket', 6.4, -3.6);
put(BARN, 'psx_wooden_crate_1', 9.8, 6.8); put(BARN, 'psx_wooden_crate_2', 8.4, 7.4); put(BARN, 'psx_metal_barrel_mp_1', 10.6, 4.6); put(BARN, 'tool_chest', -10.4, -1.2, { face: 90 });
put(BARN, 'railway_lantern', 2.4, 8.2); put(BARN, 'psx_cobweb_1', -11.4, -9.6, { y: 3.6 }); put(BARN, 'psx_cobweb_2', 11.4, 9.4, { y: 3.6 });
/* THE FARMHOUSE (walk-in): white boards, a green roof, a brick chimney, the porch on the plan's plank row */
const FARM = building('farmhouse', [63, 51, 69, 56, 'S'], 3.5, { leaf: 'leaf_white_wood' }, (a, w, d, door) => {
    const WHITE = 0xe6e0d0, GREEN = 0x4a6048, TRIM = 0x3a4a3a;
    a.shell(w, 3.5, d, WD, WHITE, door, [3.5, 1.75], { gain: 2.2 });
    a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.3, 3.5, 0.3, WD2, TRIM);
    a.roof('gable', 0, 3.5, 0, w + 1.0, 3.2, d + 1.0, SHG, GREEN, { keyEnd: WD, tintEnd: WHITE });
    a.frame(door, d, WD2, TRIM); windows(a, w, d, 1.0, 1.4, door.lx, 0xf0d898, 0.45);
    for (const s of [-1, 1]) for (let z = -d / 2 + 2.6; z < d / 2 - 1; z += 5.25) a.box(s * (w / 2 + 0.06), 1.0, z, 0.08, 1.4, 1.2, GLS, 0xc8d4e0);
    a.box(0, 0, d / 2 + 1.75, w, 0.16, 3.4, FLR, 0x8c7a62);                                                               // the porch
    for (let i = 0; i <= 6; i++) { const x = -w / 2 + 0.25 + i * (w - 0.5) / 6; if (Math.abs(x - door.lx) < 0.9) continue; a.box(x, 0, d / 2 + 3.25, 0.2, 2.8, 0.2, WD2, WHITE); }
    a.roof('shed', 0, 2.8, d / 2 + 1.85, w + 0.6, 0.7, 3.8, SHG, GREEN);
    a.box(6.6, 0, -d / 2 - 0.5, 1.6, 7.4, 1.1, BRK, 0x9a6a58, { roof: true }); a.box(6.6, 0, -d / 2 + 0.75, 2.2, 1.5, 0.9, BRK, 0x9a6a58);   // the chimney, its hearth inside
});
put(FARM, 'psx_dinner_table_1', -4.4, -1.2); put(FARM, 'psx_chair_mp_1', -4.4, -2.8, { face: 0 }); put(FARM, 'psx_chair_mp_1', -4.4, 0.4, { face: 180 }); put(FARM, 'psx_chair_mp_1', -6.2, -1.2, { face: 90 });
put(FARM, 'psx_bed_1', 6.6, 5.4, { face: 270 }); put(FARM, 'psx_bedside_table_1', 8.9, 6.9); put(FARM, 'rug_round', 1.2, 1.6, { y: 0.17 }); put(FARM, 'psx_armchair_1', 4.4, -5.6, { face: 0 });
put(FARM, 'psx_shelf_mp_2', -9.4, -6.6, { face: 90 }); put(FARM, 'retro_radio', -9.3, 3.2); put(FARM, 'cat', 2.6, -4.4, { face: 140 }); put(FARM, 'candle', 6.6, -7.0, { y: 1.5 });
put(FARM, 'rocking_chair', -7.6, 10.4, { face: 180 }); put(FARM, 'dog', 5.2, 10.6, { face: 200 }); put(FARM, 'railway_lantern', 9.4, 10.2);
/* THE BOATHOUSE (walk-in): grey weathered boards, a tin roof, the slip down to the water */
const BOAT = building('boathouse', [67, 5, 71, 9, 'S'], 3.5, { leaf: 'leaf_shabby_wood', floorIn: U('WoodFlooring1a') }, (a, w, d, door) => {
    const GREY = 0x8a8478, TRIM = 0x4a463e;
    a.shell(w, 3.5, d, WD, GREY, door, [3.5, 1.75]);
    a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, U('WoodFlooring1a'), 0x8a7c68, { uv: [1.75, 1.75] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.3, 3.5, 0.3, WD2, TRIM);
    a.roof('gable', 0, 3.5, 0, d + 0.8, 2.4, w + 0.8, COR, 0x6a7078, { ry: 90, keyEnd: WD, tintEnd: GREY });
    a.frame(door, d, WD2, TRIM); a.box(-w / 2 - 0.06, 1.1, 0, 0.08, 1.3, 2.4, SHUT, 0xa8a498, { uv: 'fit', faces: 'l', top: false });
});
put(BOAT, 'rowboat', -2.6, -2.4, { face: 90 }); put(BOAT, 'sea_chest', 4.6, -5.0, { face: 0 }); put(BOAT, 'ship_lantern', 5.2, 4.6); put(BOAT, 'wooden_bucket', 3.8, 1.2); put(BOAT, 'psx_wooden_crate_3', 5.0, -1.6);
/* THE CRYPT (walk-in): a stone mausoleum, two columns and a pediment, a barred gate; the old crypt's sarcophagus and demon inside */
const CRYPT = building('crypt', [4, 64, 8, 67, 'E'], 4.2, { leaf: 'leaf_cell', keyIn: 'castle_wall', floorIn: 'marble' }, (a, w, d, door) => {
    const STONE = 0xb4b0a8, DARK = 0x7a7670;
    a.shell(w, 4.2, d, 'castle_wall', STONE, door, [3.5, 1.75]);
    a.roof('gable', 0, 4.2, 0, d + 0.8, 1.9, w + 0.8, 'castle_wall', DARK, { ry: 90, keyEnd: 'castle_wall', tintEnd: STONE });
    a.box(0, 0, d / 2 + 0.9, w + 0.6, 0.2, 1.8, 'marble', 0xc8c4bc);
    for (const x of [-3.6, 3.6]) { a.cyl(x, 0.2, d / 2 + 1.2, 0.36, 3.8, 'marble', 0xd0ccc4); a.box(x, 4.0, d / 2 + 1.2, 0.9, 0.2, 0.9, 'marble', 0xc0bcb4); }
    a.box(0, 4.2, d / 2 + 0.9, w + 0.8, 0.5, 1.9, 'castle_wall', DARK, { roof: true });
    a.frame(door, d, 'castle_wall', DARK);
});
put(CRYPT, 'sarcophagus', 0, -3.0, { face: 90 }); put(CRYPT, 'demon_statue', 0, -6.0, { face: 180 }); put(CRYPT, 'candle', -2.2, -3.0); put(CRYPT, 'candle', 2.2, -3.0);
put(CRYPT, 'skull_pile', -3.9, -5.8); put(CRYPT, 'psx_cobweb_1', 4.2, -6.2, { y: 2.8 }); put(CRYPT, 'stone_urn', 3.9, 5.4);
/* THE COOP: the hen house in the Yard (a low shed, not walked into) */
building('coop', [56, 67, 59, 70, 'W'], 2.8, SOLID, (a, w, d) => {
    a.box(0, 0, 0, w + 0.1, 2.8, d + 0.1, WD, 0x8a5a3c, { top: false, uv: [3.5, 1.75] }); a.roof('shed', 0, 2.8, 0, w + 0.8, 1.2, d + 0.8, COR, 0x6a6660);
    a.box(0, 0.5, d / 2 + 0.07, 0.9, 0.9, 0.08, WD2, 0x2a1c14); a.box(0, 0, d / 2 + 0.9, 0.8, 0.5, 1.7, WD2, 0x6a5038);              // the hens' hatch and its ramp block
    for (const x of [-3.2, 3.2]) a.box(x, 1.4, d / 2 + 0.06, 1.1, 0.8, 0.08, SHUT, 0xa8a090, { uv: 'fit', faces: 'f', top: false });
});

/* ── THE DRAWN PIECES (arch rows on open ground: walked under or round) ── */
function look(id, x, z, rot, fn) { const a = sheet(); fn(a); ARCH.push({ k: 'arch', id: 'est:' + id + ':look', x: r2(x), z: r2(z), rot: rot || 0, parts: a.P }); }
/* THE GAZEBO on the plan's paving: a thin stone floor, eight white posts, a pointed roof */
look('gazebo', gx(6.5), gx(54.5), 0, a => { a.cyl(0, 0, 0, 5.2, 0.12, 'marble', 0xd0ccc4); a.box(4.6, 0.12, 0, 0.24, 3.0, 0.24, WD2, 0xe2ded2, { ring: { n: 8, r: 4.6 } });
    a.cyl(0, 3.12, 0, 5.4, 0.22, WD2, 0xe2ded2, { roof: true }); a.cyl(0, 3.34, 0, 5.6, 2.6, SHG, 0x4a5a50, { r2: 0, seg: 8, roof: true }); a.cyl(0, 5.94, 0, 0.12, 0.9, WD2, 0x2a2622, { roof: true }); });
for (let y = 53; y < 56; y++) for (let x = 5; x < 8; x++) taken.add(x + ':' + y);
/* THE IRON GATE: two brick piers and the iron arch over the track where the corn ends */
look('irongate', gx(19), gx(38), 0, a => { for (const s of [-1, 1]) { a.box(s * 3.0, 0, 0, 0.9, 3.4, 0.9, BRK, 0x6a5650); a.box(s * 3.0, 3.4, 0, 1.1, 0.25, 1.1, 'marble', 0xb0aca4); a.box(s * 3.0, 3.65, 0, 0.4, 0.5, 0.4, 'marble', 0xb0aca4); }
    a.box(0, 3.5, 0, 5.4, 0.12, 0.12, null, 0x1c1c20); a.box(0, 3.9, 0, 4.0, 0.1, 0.1, null, 0x1c1c20); a.box(-2.0, 3.5, 0, 0.08, 0.45, 0.08, null, 0x1c1c20, { n: 9, step: [0.5, 0, 0] }); });
props.push({ key: 'hw_gate_leaf', x: r2(gx(19) - 2.75), z: r2(gx(38) + 2.1), face: 90 }, { key: 'hw_gate_leaf_2', x: r2(gx(19) + 2.75), z: r2(gx(38) + 2.1), face: 90 });   // the two iron leaves (the Halloween pack's), standing open along the track
/* THE TREEHOUSE: the old room's block you climb (a ladder up its south face), boarded round, a hut on top, the old oak beside it */
feat({ k: 'plateau', x: gx(6), z: gx(42), w: 7, d: 7, h: 5.25, edge: 0.3 }); feat({ k: 'climb', x: gx(6), z: r2(gx(43) - 0.3), face: 0, look: 'ladder' });
look('treehouse', gx(6), gx(42), 0, a => { a.box(0, 0, 0, 7.1, 5.25, 7.1, WD, 0x6a5a48, { top: false, uv: [3.5, 1.75] }); a.box(0, 5.25, 0, 7.4, 0.14, 7.4, FLR, 0x7a6a55);
    a.box(0, 5.39, -1.9, 4.6, 2.3, 0.14, WD, 0x7a6248); for (const s of [-1, 1]) a.box(s * 2.3, 5.39, -0.5, 0.14, 2.3, 2.9, WD, 0x7a6248);
    a.roof('gable', 0, 7.69, -0.5, 5.4, 1.5, 3.6, SHG, 0x4a4238, { keyEnd: WD, tintEnd: 0x7a6248 });
    for (const s of [-1, 1]) a.box(s * 3.55, 5.39, 0, 0.1, 0.9, 7.0, WD2, 0x4a3a2c); a.box(0, 5.39, -3.55, 7.0, 0.9, 0.1, WD2, 0x4a3a2c); });
for (let y = 41; y < 43; y++) for (let x = 5; x < 7; x++) taken.add(x + ':' + y);

/* ── placing things: a blocker on a square's middle (P), decor off it (dec), people (native); never on corn, never two on one square ── */
const errs = [];   // every misplaced piece is listed in one go
function spot(sx, sy, what, shared) { if (sx < 0 || sy < 0 || sx >= W || sy >= W) return; if (cell[sy][sx] === 'c') { errs.push(what + ' stands in the corn at ' + sx + ',' + sy); return; }
    if (!shared) { if (taken.has(sx + ':' + sy)) errs.push(what + ': square ' + sx + ',' + sy + ' is taken'); taken.add(sx + ':' + sy); } }
const P = (key, sx, sy, o) => { spot(sx, sy, key); props.push(Object.assign({ key, x: gc(sx), z: gc(sy) }, o || {})); };
const dec = (key, sx, sy, o) => { spot(sx, sy, key, true); props.push(Object.assign({ key, x: r2(gc(sx) + (rnd() - 0.5) * 1.6), z: r2(gc(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); };
const tree = (sx, sy, kind, h, r) => { spot(sx, sy, 'tree'); if (!'gD'.includes(PLAN.cells[sy][sx]) || 'pojm'.includes(cell[sy][sx])) errs.push('a tree off the grass at ' + sx + ',' + sy); feat({ k: 'tree', x: gc(sx), z: gc(sy), kind, h, r: r || 0.8 }); };
const native = (race, sx, sy, face, say) => { spot(sx, sy, race); if ('po'.includes(cell[sy][sx]) && distAt(sx, sy) !== 'H' && distAt(sx, sy) !== 'R') errs.push(race + ' stands on a track'); const n = { x: gc(sx), z: gc(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); };
const rail = (x0, y0, x1, y1) => feat({ k: 'rail', x0: gx(x0), z0: gx(y0), x1: gx(x1), z1: gx(y1), model: 'ranch' });

/* ── THE WAYS ── */
const WOODS_X = spur('P01-00', 'n');                       // the fence gate from the Woods (bake-woods.js door `estate` leads here)
doors.push({ id: 'woods', wall: 'n', x: WOODS_X, way: 'trail', label: 'THE WOODS · THE CLEARING', sub: 'THE FENCE LINE · THE GATE', action: { room: 'site_prebuilt_fairy_forest_plots', at: 'estate' },
    desc: 'A fence, and a gate in it. The trees start on the other side.' });
rail((WOODS_X + HALF) / C - 2.5, 2, (WOODS_X + HALF) / C - 0.5, 2); rail((WOODS_X + HALF) / C + 0.5, 2, (WOODS_X + HALF) / C + 2.5, 2);
{ const o = O_GROUNDS.d.find(d => d.id === 'house') || {};   // the front door: the old Grounds' own door, on the tower's foot
  doors.push({ id: 'house', wall: 'free', x: HOUSE.cx, z: r2(gx(56) + 0.45), face: 180, leaf: o.leaf || 'leaf_wooden', label: o.label || 'THE HAUNTED HOUSE · THE HALL', sub: o.sub || 'THE FRONT DOOR · GO IN',
      action: { room: 'site_prebuilt_haunted_hall', at: 'front' }, desc: o.desc || '' }); taken.add('17:56'); taken.add('18:56'); }
const BAY_X = spur('P04-05', 's', 5);                      // Room 512's stable door: the Yard's south wall (data.js siteRooms.entry.prebuilt_skinwalker)
const BAY13 = { x: gc(17), z: gc(43), face: 0 };           // Room 13's door: on the Iron Gate's round (siteRooms.entry.prebuilt_haunted)
const WELL = { x: gc(14), z: gc(29), face: 90 };           // the well down to the Cavern (link `well_skinwalker`)
const LODGE = { x: gc(70), z: gc(57), face: 180 };         // the saloon door into the Lodge, by the farmhouse porch (link `ranch_lodge`)
[[17, 43], [14, 29], [70, 57], [15, 29], [70, 58], [17, 42]].forEach(q => taken.add(q[0] + ':' + q[1]));

/* ── THE WATER: the Lake (one pool, waded and swum; a rock in its middle), the long dock, the boathouse slip, the Marsh's two pools ── */
feat({ k: 'pool', x: gx(54), z: gx(17.5), r: 49, rz: 41, y: -0.3, depth: 1.0, key: 'water', bank: 2.4 });
feat({ k: 'plateau', x: gc(54), z: gc(18), r: 5.25, h: 1.4, edge: 0.5 });
feat({ k: 'deck', x0: gx(36), z0: gx(18), x1: gx(49), z1: gx(18), w: 7, y: 0.3 });
feat({ k: 'deck', x0: gx(67), z0: gc(7), x1: gx(60), z1: gc(7), w: 3.5, y: 0.3 });
feat({ k: 'pool', x: gx(63.5), z: gx(27), r: 9, rz: 7.5, y: -0.25, depth: 0.6, key: 'water', bank: 1.6 }); feat({ k: 'pool', x: gx(68.5), z: gx(32.5), r: 7.5, y: -0.25, depth: 0.6, key: 'water', bank: 1.4 });
const inLake = (x, y) => Math.pow((x + 0.5 - 54) / 14.6, 2) + Math.pow((y + 0.5 - 17.5) / 12.3, 2) < 1 || Math.hypot(x + 0.5 - 63.5, y + 0.5 - 27) < 3 || Math.hypot(x + 0.5 - 68.5, y + 0.5 - 32.5) < 2.6;
for (let y = 0; y < 36; y++) for (let x = 36; x < W; x++) if (inLake(x, y)) taken.add(x + ':' + y);

/* ── THE CORN FIELDS ── */
props.push({ key: 'ritual_circle', x: gx(18.5), z: gx(18.5), y: 0.01 });                                                   // THE CIRCLES' heart (the old room's)
feat({ k: 'dip', x: gx(18.5), z: gx(18.5), r: 17, h: 0.12 }); feat({ k: 'dip', x: gx(5.5), z: gx(16.5), r: 10, h: 0.1 });
dec('floor_stain', 5, 16, { y: 0.01 }); dec('crow', 3, 14); dec('crow', 7, 18); dec('crow', 20, 14); dec('grasshopper', 16, 20); dec('grasshopper_brown', 21, 22);
P('cave_torch', 13, 17); P('cave_torch', 4, 13); P('signpost', 14, 30, { face: 200 }); P('cave_torch', 15, 28); dec('wooden_bucket', 15, 30); dec('cardboard_boxes', 14, 28);
dec('crow', 28, 6); dec('meshy_burlap_sack', 30, 9); dec('fallen_log', 18, 6); dec('butterfly', 20, 4); dec('ladybug', 17, 7); dec('caterpillar', 21, 6);
P('hw_scarecrow', 30, 6, { face: 180 }); dec('hw_pumpkin', 28, 8); dec('hw_pumpkin_4', 31, 8); dec('hw_pumpkin_3', 30, 9); dec('hw_pumpkin_2', 28, 9);   // THE SCARECROW on its pole, its pumpkin patch
native('scarecrow', 29, 7, 180, sayOf(O_FIELDS, 'scarecrow', 0)); native('scarecrow', 2, 15, 60, sayOf(O_FIELDS, 'scarecrow', 2)); native('scarecrow', 22, 15, 200);
native('skinwalker', 16, 21, 180); native('mothman', 19, 5, 200);
/* ── THE LAKE ── */
P('rowboat', 50, 3, { face: 80 }); dec('fallen_log', 46, 2); dec('fallen_log', 58, 3); dec('meshy_frog', 38, 3); dec('meshy_frog', 39, 8); dec('luna_moth', 37, 5); dec('fallen_log', 37, 10);
P('cave_torch', 36, 16); P('cave_torch', 36, 19); P('meshy_rowboat', 66, 10, { face: 300 }); dec('dockring', 66, 9); dec('wooden_bucket', 69, 10);
P('park_bench', 40, 31, { face: 0 }); P('park_bench', 44, 32, { face: 0 }); P('campfire', 42, 33); dec('folding_chair', 41, 34); dec('folding_chair', 43, 34); dec('butterfly', 46, 31);
dec('meshy_frog', 61, 30); dec('meshy_frog', 66, 29); dec('meshy_frog', 70, 35); dec('meshy_frog', 64, 33); P('dead_snag', 62, 33); P('dead_snag', 70, 28); dec('hawk_moth', 67, 26);
tree(38, 1, 'tree', 7.5); tree(70, 2, 'tree_2', 8); tree(37, 33, 'tree', 7); tree(47, 34, 'tree_2', 7.5); tree(58, 33, 'tree', 8); tree(70, 14, 'tree_2', 7); tree(70, 21, 'tree', 7.5);
npc.push({ x: gc(54), z: gc(23), face: 0, race: 'loch ness monster' });                                                    // in the water, south of the rock (mondo's OK 11-15)
/* ── THE HAUNTED HOUSE + GRAVEYARD ── */
tree(4, 41, 'tree_4', 12, 1.2); tree(8, 42, 'pine', 6.5); tree(5, 44, 'pine', 6); dec('fallen_log', 7, 43); P('cave_torch', 5, 40);
P('cave_torch', 15, 41); P('cave_torch', 19, 43); P('stone_urn', 13, 58); P('stone_urn', 22, 58); P('cave_torch', 15, 57); P('cave_torch', 20, 57); P('planter', 14, 57); P('planter', 21, 57);
P('hw_tree', 12, 49, { face: 40 }); P('hw_tree_2', 23, 49, { face: 200 }); tree(13, 53, 'tree_5', 6.5); tree(23, 59, 'tree_6', 6); P('hollow_dead_tree', 12, 59, { face: 120 });
P('fountain', 30, 52); P('iron_garden_bench', 28, 50, { face: 180 }); P('iron_garden_bench', 32, 54, { face: 0 }); P('hw_tree_3', 34, 51, { face: 120 }); tree(28, 54, 'tree_6', 6.5); P('brazier', 29, 55); dec('crow', 31, 50);
P('park_bench', 2, 54, { face: 90 }); tree(1, 56, 'tree_5', 6.5); tree(3, 52, 'tree_6', 6); P('cave_torch', 4, 57);
P('skull_pile', 1, 64); P('cave_torch', 3, 63); P('hw_tree_4', 2, 66, { face: 300 }); dec('candle', 3, 65); P('angel_statue', 2, 62, { face: 90 });
/* the family graves and the graveyard's rows: the Halloween pack's headstones and graves (mondo's pack; data.js HQ_CATALOGUE_HALLOWEEN) */
{ const ST = ['hw_stone', 'psxg_tombstone_1', 'hw_stone_2', 'hw_stone_3', 'psxg_tombstone_2', 'hw_stone_1', 'hw_grave', 'psxg_tombstone_3', 'hw_stone_4', 'hw_stone_5', 'hw_grave_low'];
  const row = (xs, y) => xs.forEach((x, i) => { const k = ST[(x * 3 + y + i) % ST.length]; P(k, x, y, { face: 180 });
      if (/tombstone|hw_stone/.test(k) && (x + y) % 2 === 0) props.push({ key: 'psxg_dirt_grave', x: gc(x), z: r2(gc(y) + 1.5), y: 0.02, face: 0 }); });   // a fresh mound before every other stone (the PSX graveyard pack's)
  row([14, 16, 18, 20], 67); row([15, 17, 19], 68); row([15, 19], 62); P('angel_statue', 17, 69, { face: 0 }); P('hollow_dead_tree', 13, 65, { face: 40 }); dec('candle', 17, 68); dec('crow', 16, 61);
  row([25, 27, 29, 31], 67); row([25, 27, 29, 31], 69); row([27, 29, 31], 62); row([26, 28, 30], 71);
  P('trap_coffin_open', 33, 68, { y: -0.3, face: 20 }); dec('trap_coffin_lid', 32, 68); P('trap_coffin_wood', 24, 70, { y: -0.3, face: 300 }); P('skull_pile', 28, 62); P('stocks', 25, 70, { face: 180 });
  P('cave_torch', 24, 67); P('cave_torch', 33, 67); dec('crow', 28, 68); dec('crow', 32, 70); dec('skull', 30, 70); dec('hw_shovel', 32, 68, { y: 0.02 }); dec('hw_pumpkin', 26, 66); dec('hw_pumpkin_2', 31, 68); dec('hw_pumpkin_3', 29, 70); dec('hw_candles', 28, 66); dec('hw_candles_2', 16, 68);
  /* the PSX graveyard pack: stone pillars and small iron leaves where each walk enters, dead trees and bushes, rocks, carved jack-o'-lanterns */
  for (const q of [[17, 61], [30, 62]]) { const X = gx(q[0] + 1), Z = gx(q[1]); props.push({ key: 'psxg_wall_pillar', x: r2(X - 3.1), z: Z }, { key: 'psxg_wall_pillar', x: r2(X + 3.1), z: Z }, { key: 'psxg_iron_gate_1', x: r2(X - 2.9), z: r2(Z + 0.7), face: 90 }, { key: 'psxg_iron_gate_2', x: r2(X + 2.9), z: r2(Z + 0.7), face: 270 }); }
  P('psxg_dead_tree_1', 14, 65, { face: 60 }); P('psxg_dead_tree_2', 32, 65, { face: 200 }); P('psxg_dead_tree_1', 25, 71, { face: 310 }); dec('psxg_dead_bush_1', 20, 66); dec('psxg_dead_bush_2', 24, 66); dec('psxg_dead_bush_1', 33, 66); dec('psxg_dead_bush_2', 18, 65);
  dec('psxg_rock_1', 13, 66); dec('psxg_rock_3', 19, 66); dec('psxg_rock_2', 24, 69); dec('psxg_rock_4', 30, 66); dec('psxg_jack_o_lantern_1', 29, 68, { face: 180 }); dec('psxg_jack_o_lantern_2', 31, 67, { face: 200 }); dec('psxg_jack_o_lantern_1', 18, 66, { face: 160 });
  P('wooden_cross', 24, 68, { h: 1.7, face: 180 }); P('wooden_cross', 21, 65, { h: 1.5, face: 180 }); }
for (const x of [12, 13, 14, 15, 16, 19, 20, 21, 22, 23]) props.push({ key: 'hw_fence_iron', x: gc(x), z: r2(gx(60) - 0.25), face: 0 });   // the iron fence along the foot of the house's lawn, the walk's gap in its middle
dec('psxg_jack_o_lantern_1', 16, 56, { face: 180 }); dec('psxg_jack_o_lantern_2', 19, 56, { face: 180 }); dec('psxg_dead_bush_1', 14, 58); dec('psxg_dead_bush_2', 21, 58); dec('hw_pumpkin_2', 15, 58); dec('hw_web', 20, 56, { y: 1.6, face: 0 });
native('ghost', 28, 52, 30, sayOf(O_GROUNDS, 'ghost')); native('ghoul', 14, 66, 160, sayOf(O_GROUNDS, 'ghoul')); native('vampire', 13, 57, 180); native('werewolf', 7, 44, 90); native('eagleman', 3, 55, 90);
native('undead', 26, 68, 200); native('jack o lantern', 30, 68, 180); native('zombie', 32, 70, 300); native('necromancer', 2, 63, 90);
props.push({ key: 'abandoned_house', x: -168, z: 60, face: 0 }, { key: 'abandoned_house', x: -60, z: 168, face: 90 });       // the houses past the corn (the old Grounds' rim houses), outside the room
/* ── THE RANCH ── */
props.push({ key: 'decor_windpump_tower', x: gx(54), z: gx(41), h: 11 }, { key: 'decor_windpump_wheel', x: gx(54), z: r2(gx(41) + 0.9), y: 10.2, span: 4.2 });   // THE WINDMILL (the landmark)
[[53, 40], [54, 40], [53, 41], [54, 41]].forEach(q => taken.add(q[0] + ':' + q[1])); dec('wooden_bucket', 55, 41); P('cave_torch', 51, 44);
[[38, 40, 60], [41, 44, 200], [45, 38, 300], [39, 46, 120], [46, 45, 20]].forEach(q => P('cow', q[0], q[1], { face: q[2] })); dec('grasshopper', 42, 41); dec('grasshopper_jump', 44, 46); dec('butterfly', 40, 43);
tree(37, 37, 'tree_2', 8); tree(47, 47, 'tree', 7.5); props.push({ key: 'trailer_home_2', x: r2(gx(38) + 8.75), z: gx(39), face: 0 }); for (let y = 38; y < 40; y++) for (let x = 38; x < 43; x++) taken.add(x + ':' + y);
P('car_truck', 64, 41, { face: 180, span: 6.8 }); dec('meshy_burlap_sack', 66, 43); dec('meshy_burlap_sack', 62, 44); dec('crow', 68, 38); dec('crow', 61, 46); dec('grasshopper_brown', 69, 45);
{ const O = [[40, 50], [44, 50], [46, 52], [46, 56], [44, 58], [40, 58], [38, 56], [38, 52]];   // THE PADDOCK: the ring's rail on the plan's line, its gate in the south side
  O.forEach((a, i) => { const b = O[(i + 1) % O.length]; if (i === 4) { feat({ k: 'rail', x0: gc(44), z0: gc(58), x1: gc(43) + 1.75, z1: gc(58), model: 'ranch' }); feat({ k: 'rail', x0: gc(41) - 1.75, z0: gc(58), x1: gc(40), z1: gc(58), model: 'ranch' }); }
      else feat({ k: 'rail', x0: gc(a[0]), z0: gc(a[1]), x1: gc(b[0]), z1: gc(b[1]), model: 'ranch' }); }); }
P('horse_brown', 41, 53, { face: 75 }); P('horse_black', 43, 55, { face: 250 }); P('horse', 42, 51, { face: 15 }); dec('wooden_bucket', 40, 56);
P('cave_torch', 50, 57); P('cave_torch', 59, 57); dec('psx_wooden_crate_1', 59, 55); P('psx_metal_barrel_mp_1', 50, 55);
P('signpost', 37, 64, { face: 90 }); P('cave_torch', 37, 67); rail(36, 60, 36, 65); rail(36, 67, 36, 72);                         // THE RANCH GATE: the rail on the district's line, the gap on the track
props.push({ key: 'trailer_home_4', x: r2(gx(39) + 8.75), z: gx(62), face: 0 }, { key: 'trailer_home_6', x: r2(gx(39) + 8.75), z: gx(70), face: 180 });   // the old Corn Fields' three trailers stand on the ranch now
for (const y0 of [61, 69]) for (let y = y0; y < y0 + 2; y++) for (let x = 39; x < 44; x++) taken.add(x + ':' + y);
[[52, 62, 200], [50, 68, 120], [54, 70, 300], [49, 64, 40], [53, 66, 250]].forEach(q => dec('chicken', q[0], q[1], { face: q[2] })); P('campfire', 50, 61); dec('cardboard_boxes', 51, 62); dec('anthill', 49, 70); dec('ant', 50, 70);
P('psx_metal_barrel_mp_2', 55, 70); dec('wooden_bucket', 55, 67); P('cave_torch', 48, 66);
rail(60, 60, 64, 60); rail(67, 60, 72, 60); rail(60, 60, 60, 65); rail(60, 67, 60, 72);                                            // THE COW FIELD's fence, a gap on each side
[[63, 63, 270], [66, 66, 300], [69, 62, 0], [64, 69, 90]].forEach(q => P('cow', q[0], q[1], { face: q[2] })); dec('grasshopper', 67, 64); tree(70, 70, 'tree_2', 8); tree(61, 70, 'tree', 7);
{ /* THE HAY FIELD: straw bales in rows (the Halloween pack's), a stack by the truck, a scarecrow over them */
  for (let y = 37; y <= 46; y += 3) for (let x = 61; x <= 70; x += 3) { if (taken.has(x + ':' + y) || (x === 64 && y === 40)) continue; P(rnd() < 0.5 ? 'hw_straw' : 'hw_straw_2', x, y, { face: rnd() < 0.7 ? 0 : 90 }); }
  props.push({ key: 'hw_straw', x: gc(67), z: gc(41), face: 0 }, { key: 'hw_straw', x: r2(gc(67) + 1.5), z: gc(41), face: 0 }, { key: 'hw_straw_2', x: r2(gc(67) + 0.7), z: gc(41), y: 0.86, face: 0 }); taken.add('67:41');
  P('hw_scarecrow_2', 66, 38, { face: 180 });
  P('hw_straw', 58, 57, { face: 90 }); P('hw_straw_2', 58, 58, { face: 0 }); props.push({ key: 'hw_straw', x: gc(58), z: gc(57), y: 0.86, face: 90 });
  put(BARN, 'hw_straw', 9.6, -3.4, { face: 0 }); put(BARN, 'hw_straw', 9.6, -4.6, { face: 0 }); put(BARN, 'hw_straw_2', 9.6, -4.0, { face: 0, y: 0.86 }); put(BARN, 'hw_straw', -4.6, -8.6, { face: 90 });
  /* THE KITCHEN GARDEN east of the farmhouse: two tilled beds, their crops, pumpkins */
  for (const x of [70, 71]) { props.push({ key: 'hw_farmland', x: gc(x), z: gx(53), face: 0, y: 0.02 }); for (let i = 0; i < 4; i++) props.push({ key: ['hw_crop', 'hw_crop_2', 'hw_crop_3'][(x + i) % 3], x: r2(gc(x) + (i % 2 ? 0.4 : -0.4)), z: r2(gx(53) - 1.4 + i * 0.95), y: 0.2 }); }
  for (let y = 51; y < 55; y++) for (const x of [70, 71]) taken.add(x + ':' + y); dec('hw_pumpkin_4', 70, 55); dec('hw_pumpkin', 71, 50); dec('hw_pumpkin_2', 69, 56);
  /* the picket fence before the farmhouse porch, a gap at the door */
  const dx = FARM.at(FARM.door.lx, 0)[0]; for (let x = gx(62) + 0.83; x < gx(69); x += 1.66) { if (Math.abs(x - dx) < 1.8) continue; props.push({ key: 'hw_fence', x: r2(x), z: gx(58), face: 0 }); } }
native('cowboy', 40, 64, 340); native('goatman', 44, 42, 200);

if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));
/* the pines of the house's grounds stand on the corn bank round it (the old Grounds' pine hedge); the corn itself carries no trees */
for (let cy = 37; cy < W - 1; cy++) for (let cx = 1; cx < 36; cx++) { if (cell[cy][cx] !== 'c') continue;
    let deep = true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (cell[cy + dy][cx + dx] !== 'c') deep = false;
    if (!deep || rnd() > 0.1) continue; feat({ k: 'tree', x: r2(gc(cx) + (rnd() - 0.5) * 1.4), z: r2(gc(cy) + (rnd() - 0.5) * 1.4), kind: rnd() < 0.8 ? 'pine' : 'tree_5', h: r2(5.5 + rnd() * 2), r: 0.7 }); count.pines = (count.pines || 0) + 1; }

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
flats.push([5, 41, 7, 43], [5, 53, 8, 56], [53, 40, 55, 42]);   // the treehouse, the gazebo, the windmill
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

/* ── the room ── */
const SPM = { x: gx(SP[0]), z: gc(SP[1]) }, LINES = O_FIELDS.l.concat(O_GROUNDS.l), L = [];
L.push("        /* ESTATE36-BEGIN — THE ESTATE ON PLOTS (2026-11-15): written by `node bake-estate.js` from docs/areas/estate/layout.json. Never hand-edit between the markers; edit the tool or the layout and rerun. */");
L.push("        " + ROOM + ": {");
L.push("            label: 'THE ESTATE',");
L.push("            sub: 'FOUR DISTRICTS · 36 PLOTS',");
L.push("            kind: 'box', site: 'prebuilt_skinwalker', part: 'estate',");
L.push("            shell: hqRanchShell({ w: " + (2 * HALF) + ", d: " + (2 * HALF) + ", plate: { x: " + SPM.x + ", z: " + SPM.z + ", y: 4.4 }, wall: 'leaves_3', wallColor: 0xd8c878 }),");
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
