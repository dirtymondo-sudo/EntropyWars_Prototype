#!/usr/bin/env node
/* bake-camelot.js — CAMELOT CASTLE, REDESIGNED (2026-11-15, mondo: "camelot castle should be designed with the same level of architecture as
   the most complex buildings in disaster city ... exterior and interior"; his OK on the mock-up 16:44 UTC "that looks good for a start").
   The castle is the middle district of Camelot Kingdom on plots (4 x 3 plots of 12 x 12 squares of 3.5 m = 168 x 126 m): the moat all the
   way round, the curtain wall walked on top, four hollow corner towers, bastions, a twin-drum gatehouse, a cross wall making two wards,
   the Keep, the Great Hall, the Kitchen, the Barracks, the Stables. Collision and the walked parts are terrain rows (the ward's own helpers:
   hqCurtainWall, hqCastleTower, hqRoundBlock, hqCastleCrown); the buildings are hollow `texbuilding` rows drawn by `k: 'arch'` parts lists.
   Writes the room `site_prebuilt_camelot_castle` into data.js between CAMELOT-CASTLE-BEGIN / END. `--dry-run` prints the counts.
   Never hand-edit between the markers: edit this tool and rerun. Squares below are (sx, sy): sx 0..48 west to east, sy 0..36 north to south.
   Notes: docs/notes/areas-complexes.md "CAMELOT KINGDOM ON PLOTS, THE CASTLE". Plan pictures: project files camelot-kingdom/. */
'use strict';
const fs = require('fs'), path = require('path');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const C = 3.5, SW = 48, SD = 36, HW = SW * C / 2, HD = SD * C / 2, TOP = 7;
const r2 = v => Math.round(v * 100) / 100;
const X = s => r2(-HW + s * C), Z = s => r2(-HD + s * C);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const F = [], props = [], doors = [], npc = [], arch = [], marks = [];
const feat = o => F.push(J(o) + ','), raw = s => F.push(s + ','), note = s => F.push('/* ' + s + ' */');
const WALL = 'castle_wall';

/* ── THE MOAT, all the way round (deep water, never entered), and the two ways over ── */
note('THE MOAT: all the way round; THE DRAWBRIDGE is the one open way over, the postern\'s footbridge the hidden one');
feat({ k: 'stream', pts: [[X(1.5), Z(1.9)], [X(1.5), Z(28)], [X(46.5), Z(28)], [X(46.5), Z(1.9)]], w: 7.55, y: -0.3, depth: 2.0, key: 'deep_water', bank: 0.6 });
feat({ k: 'stream', pts: [[X(1.5), Z(1.9)], [X(46.5), Z(1.9)]], w: 6.3, y: -0.3, depth: 2.0, key: 'deep_water', bank: 0.6 });   // the north arm leaves a strip of bank at the room's edge (the sleigh road's door lands on it)
feat({ k: 'bridge', x0: X(19), z0: Z(29.6), x1: X(19), z1: Z(26.3), w: 7, y: 0.3, thick: 0.3, key: 'wood', id: 'drawbridge' });
feat({ k: 'bridge', x0: X(41.25), z0: Z(0.75), x1: X(41.25), z1: Z(3.2), w: 3.5, y: 0.3, thick: 0.3, key: 'wood', id: 'postern_bridge' });

/* ── THE CURTAIN WALL (the wall-walk at 7 m, one square thick) ── */
const TW = { sw: [4.5, 24.5], se: [43.5, 24.5], nw: [4.5, 3.5], ne: [43.5, 3.5] };                       // the four hollow corner towers
const BAS = { w: [4.5, 13.5], e: [43.5, 13.5], s1: [12.5, 24.5], s2: [31.5, 24.5], gw: [17, 24.5], ge: [21, 24.5] };   // the solid drums
const tw = k => ({ x: X(TW[k][0]), z: Z(TW[k][1]), r: 5.25 }), bs = k => ({ x: X(BAS[k][0]), z: Z(BAS[k][1]), r: 3.5 });
function curtain(id, x0, z0, x1, z1, out, o) {
    raw('...hqCurtainWall(' + J(Object.assign({ id, x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), t: 3.5, top: TOP, out, key: WALL }, o || {})) + ')');
}
const zs = Z(24.5), zn = Z(3.5), xw = X(4.5), xe = X(43.5), zc = Z(13.5);
note('THE CURTAIN WALL: south (four runs between the towers, the bastions and the gatehouse), west, east, north');
curtain('south_1', xw + 4.85, zs, bs('s1').x - 2.5, zs, 1, { pull0: 1.2, towers: [tw('sw'), bs('s1')] });
curtain('south_2', bs('s1').x + 2.5, zs, bs('gw').x - 2.5, zs, 1, { towers: [bs('s1'), bs('gw')] });
curtain('south_3', bs('ge').x + 2.5, zs, bs('s2').x - 2.5, zs, 1, { towers: [bs('ge'), bs('s2')] });
curtain('south_4', bs('s2').x + 2.5, zs, xe - 4.85, zs, 1, { pull1: 1.2, towers: [bs('s2'), tw('se')] });
curtain('west_s', xw, zs - 4.85, xw, bs('w').z + 2.5, -1, { pull0: 1.2, towers: [tw('sw'), bs('w')] });
curtain('west_n', xw, bs('w').z - 2.5, xw, zn + 4.85, -1, { pull1: 1.2, towers: [bs('w'), tw('nw')] });
curtain('east_s', xe, zs - 4.85, xe, bs('e').z + 2.5, 1, { pull0: 1.2, towers: [tw('se'), bs('e')] });
curtain('east_n', xe, bs('e').z - 2.5, xe, zn + 4.85, 1, { pull1: 1.2, towers: [bs('e'), tw('ne')] });
curtain('north', xw + 4.85, zn, X(40.5), zn, -1, { pull0: 1.2, towers: [tw('nw')] });
note('THE CROSS WALL between the two wards: two gates, the rampart stairs land on its ends');
curtain('cross_w0', bs('w').x + 2.5, zc, X(6.5), zc, 1, { battlement: false });
curtain('cross_w1', X(6.5), zc, X(12), zc, 1, {});
curtain('cross_m', X(14), zc, X(18), zc, 1, {});
curtain('cross_e1', X(20), zc, X(41.5), zc, 1, {});
curtain('cross_e0', X(41.5), zc, bs('e').x - 2.5, zc, 1, { battlement: false });
/* the decks that carry the walk over the gates and the postern, the parapets on their fronts */
function gateDeck(id, sx0, sx1, z, front) {
    feat({ k: 'bridge', x0: X(sx0 - 0.5), z0: z, x1: X(sx1 + 0.5), z1: z, w: 3.5, y: TOP, thick: 2.2, plain: true, rails: false, key: WALL, id });
    if (front) feat({ k: 'bridge', x0: X(sx0) + 0.9, z0: r2(z + front * 1.55), x1: X(sx1) - 0.9, z1: r2(z + front * 1.55), w: 0.5, y: TOP + 1.8, thick: 4.0, plain: true, rails: false, key: WALL, id: id + '_front' });
}
gateDeck('gatehouse', 18, 20, zs, 1); gateDeck('inner_gate', 18, 20, zc, 1); gateDeck('keep_gate', 12, 14, zc, 1);
feat({ k: 'bridge', x0: X(40), z0: zn, x1: X(42.3), z1: zn, w: 3.5, y: TOP, thick: 2.4, plain: true, rails: false, key: WALL, id: 'postern_walk' });
feat({ k: 'bridge', x0: X(40.4), z0: r2(zn - 1.5), x1: X(42.1), z1: r2(zn - 1.5), w: 0.5, y: TOP + 1.8, thick: 4.2, plain: true, rails: false, key: WALL, id: 'postern_front' });

/* ── THE TOWERS: four hollow corner drums (a spiral inside, the deck on the walk), the bastions and the gatehouse's two solid drums ── */
note('THE TOWERS');
const TWR = { sw: { door: [30, 66], joins: [[69, 111], [339, 381]], a0: 75 }, se: { door: [300, 334], joins: [[249, 291], [339, 381]], a0: 346 },
              ne: { door: [210, 244], joins: [[159, 201], [249, 291]], a0: 256 }, nw: { door: [120, 154], joins: [[69, 111], [159, 201]], a0: 166 } };
Object.keys(TW).forEach(k => raw('...hqCastleTower(' + J(Object.assign({ id: 'tower_' + k, x: tw(k).x, z: tw(k).z, r: 5.25, top: TOP, span: 250, key: WALL, floor: 'wood_planks' }, TWR[k])) + ')'));
const SKIP = { n: [328, 392], e: [58, 122], s: [148, 212], w: [238, 302] };
const BJ = { w: 'nse', e: 'nsw', s1: 'we', s2: 'we', gw: 'we', ge: 'we' };
Object.keys(BAS).forEach(k => { const b = bs(k);
    raw('...hqRoundBlock(' + J({ id: 'drum_' + k, x: b.x, z: b.z, r: 3.5, y: TOP, key: WALL }) + ')');
    raw('...hqCastleCrown(' + J({ id: 'drum_' + k + '_crown', x: b.x, z: b.z, r: 3.5, top: TOP, skip: BJ[k].split('').map(c => SKIP[c]), key: WALL }) + ')'); });

/* ── THE RAMPART STAIRS (the towers' spirals are the other ways up), the parapet along the walk's inner edge ── */
note('THE RAMPART STAIRS + THE PARAPETS');
feat({ k: 'ramp', x0: X(5.5), z0: Z(20), x1: X(5.5), z1: Z(14), w: 3.5, h0: 0, h1: TOP, stairs: true, model: 'stone', edge: 0.2 });
feat({ k: 'ramp', x0: X(42.5), z0: Z(20), x1: X(42.5), z1: Z(14), w: 3.5, h0: 0, h1: TOP, stairs: true, model: 'stone', edge: 0.2 });
const rail = (x0, z0, x1, z1) => feat({ k: 'rail', x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), y: TOP, model: 'parapet' });
rail(xw + 5.35, zs - 1.6, bs('s1').x - 3.6, zs - 1.6); rail(bs('s1').x + 3.6, zs - 1.6, bs('gw').x - 3.6, zs - 1.6);
rail(bs('ge').x + 3.6, zs - 1.6, bs('s2').x - 3.6, zs - 1.6); rail(bs('s2').x + 3.6, zs - 1.6, xe - 5.35, zs - 1.6);
rail(xw + 1.6, zs - 5.35, xw + 1.6, Z(20.2)); rail(xw + 1.6, bs('w').z - 3.6, xw + 1.6, zn + 5.35);
rail(xe - 1.6, zs - 5.35, xe - 1.6, Z(20.2)); rail(xe - 1.6, bs('e').z - 3.6, xe - 1.6, zn + 5.35);
rail(X(6.6), zc - 1.6, X(11.4), zc - 1.6); rail(X(14.6), zc - 1.6, X(17.4), zc - 1.6); rail(X(20.6), zc - 1.6, X(41.4), zc - 1.6);

/* ── THE GROUND: the road, the lanes, the lists, the sword's knoll ── */
note('THE GROUND: the Crown\'s Road in through both gates, the lanes, the tilt, the knoll');
const pathRow = (pts, w) => feat({ k: 'path', pts: pts.map(p => [X(p[0]), Z(p[1])]), w });
pathRow([[19, 36], [19, 29.6]], 7); pathRow([[19, 26.3], [19, 11]], 7);
pathRow([[7, 16], [42, 16]], 3.5); pathRow([[13, 13], [13, 11.2]], 3.5); pathRow([[19, 11], [27.5, 11], [27.5, 10.2]], 3.5);
pathRow([[19, 11], [13, 11.5]], 3.5); pathRow([[27.5, 11], [41.25, 11], [41.25, 3.4]], 2.6); pathRow([[41.25, 0.6], [41.25, 0]], 2.6);
pathRow([[2, 32.5], [46, 32.5]], 3.5); pathRow([[6.5, 32.5], [6.5, 34]], 2.6);
feat({ k: 'hill', x: X(14.5), z: Z(19.5), r: 4.2, h: 0.8 });
feat({ k: 'wall', x0: X(24.5), z0: Z(20.5), x1: X(33.5), z1: Z(20.5), h: 1.2, t: 0.25, key: 'wood' });               // THE TILT
marks.push({ k: 'rect', x: X(29), z: Z(20.5), w: 38.5, d: 10.5, color: 0xc8b088, a: 0.85 });
[[17, 4.6], [18.5, 4.6], [20, 4.6], [17, 6.4], [18.5, 6.4], [20, 6.4], [17.7, 8.2], [19.3, 8.2]].forEach((q, i) => feat({ k: 'tree', x: X(q[0] + 0.5), z: Z(q[1] + 0.5), kind: i % 2 ? 'tree_4' : 'tree_2', h: r2(4.6 + (i % 3) * 0.3), r: 0.5 }));   // THE ORCHARD

/* ── THE BUILDINGS: a hollow texbuilding each (the walls you bump, the doorway, the inside, the roof slab; its own outside switched off)
   and its look as an `arch` parts list. Frame of a parts list: the building's middle, x along the front, +z out of the front, y up. ── */
const U = n => 'urban:' + n, STUCCO = U('PlasterWallStucco2a'), G_TALL = U('GlassWindowTall1a'), SLATE = U('MetalRoofTiles1a'), WOODK = 'wood_planks', WOODD = 'wood';
const ROT = { S: 0, W: 90, N: 180, E: 270 };
function sheet() {
    const P = [];
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); if (/GlassWindow/.test(key || '') && o.glow == null) o.glow = 0.35; P.push(o); return o; };
    return { P,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [x, y, z], size: [w, h, d] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [x, y, z], r, h }, key, tint, o),
        roof: (form, x, y, z, w, h, d, key, tint, o) => add({ s: 'roof', form, p: [x, y, z], size: [w, h, d], roof: true }, key, tint, o),
        /* the four walls w x d, h high, 5 cm proud, the doorway cut in the front (+z) at the texbuilding's own door place */
        shell(w, h, d, key, tint, door) { const e = 0.05, W = w + 2 * e, D = d + 2 * e;
            add({ s: 'box', p: [0, 0, 0], size: [W, h, D], top: false, faces: 'blr' }, key, tint);
            add({ s: 'quad', p: [0, 0, D / 2], size: [W, h], ry: 0, hole: [door.lx, door.cw, 2.2] }, key, tint); },
        /* battlements round a flat top: merlons 1.1 long every 2 m on the four edges */
        crown(w, d, y, key, tint) { for (const s of [-1, 1]) { const nx = Math.floor(w / 2), nz = Math.floor(d / 2);
            add({ s: 'box', p: [-w / 2 + 0.55, y, s * (d / 2 - 0.25)], size: [1.1, 1.0, 0.5], n: nx, step: [w / nx, 0, 0] }, key, tint);
            add({ s: 'box', p: [s * (w / 2 - 0.25), y, -d / 2 + 0.55], size: [0.5, 1.0, 1.1], n: nz, step: [0, 0, d / nz] }, key, tint); } } };
}
function texbDoor(w, door) { const L = Math.max(2, w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (door >= 1) col = Math.min(cols - 1, Math.round(door) - 1); return { lx: -L / 2 + (col + 0.5) * cw, cw }; }
/* a building on squares sx0..sx1 x sy0..sy1, its front on `side`; → its frame (to place furniture: at(lx, lz) = world [x, z]) */
function building(id, sx0, sy0, sx1, sy1, side, h, o, parts) {
    const ew = side === 'E' || side === 'W', fw = (ew ? sy1 - sy0 : sx1 - sx0) * C, fd = (ew ? sx1 - sx0 : sy1 - sy0) * C, cx = X((sx0 + sx1) / 2), cz = Z((sy0 + sy1) / 2), rot = ROT[side];
    const row = Object.assign({ k: 'texbuilding', id: 'cam:' + id, seed: 1, x: cx, z: cz, w: fw, d: fd, rot, storeys: Math.max(1, Math.floor(h / 3.5 + 0.01)), h, skin: false, hollow: true, leaf: 'leaf_shabby_wood', leafDouble: true, keyIn: WALL, floorIn: 'cobblestone' }, o || {});
    feat(row);
    const a = sheet(), door = texbDoor(fw, row.door); parts(a, fw, fd, door);
    arch.push({ k: 'arch', id: 'cam:' + id + ':look', x: cx, z: cz, rot, parts: a.P });
    const q = rot * Math.PI / 180, c = Math.cos(q), s = Math.sin(q);
    return { at: (lx, lz) => [r2(cx + lx * c - lz * s), r2(cz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd, door };
}
const put = (B, key, lx, lz, o) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, o || {}); if (r.face != null) r.face = B.face(r.face); props.push(r); };   // `face` is given in the building's frame (180 = looking out of its front)
const STONE = 0xc4c0b8, STONE2 = 0xaeaaa6, STONE3 = 0xd2ccc0, BLUE = 0x5a6c96, RED = 0xa84a3c, GLASS = 0xa8c4ec, BANNER = 0xb02c36;
note('THE BUILDINGS');
/* THE KEEP — a square donjon: the ground floor walked into (THE GUARDROOM), four storeys of blind stone and arrow loops over it, a turret on
   each corner under a cone, a stair turret and the flag on the roof. Its upper floors are the room behind THE GREAT STAIR's door. */
const KEEP = building('keep', 7, 4, 16, 11, 'S', 7, { leaf: 'leaf_shabby_wood' }, (a, w, d, door) => {
    a.shell(w, 7, d, WALL, STONE2, door); a.box(0, 7, 0, w + 0.1, 17, d + 0.1, WALL, STONE2, { top: false, under: true });
    a.box(0, 6.6, 0, w + 0.7, 0.5, d + 0.7, WALL, STONE3, { under: true }); a.box(0, 23.4, 0, w + 0.9, 0.6, d + 0.9, WALL, STONE3, { under: true });
    a.box(0, 24, 0, w + 0.5, 0.3, d + 0.5, WALL, 0x8c8a88, { roof: true }); a.crown(w + 0.5, d + 0.5, 24, WALL, STONE2);
    for (const c of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const x = c[0] * (w / 2 - 0.4), z = c[1] * (d / 2 - 0.4);
        a.cyl(x, 0, z, 2.5, 28, WALL, STONE, { seg: 14 }); a.cyl(x, 27.2, z, 2.85, 0.8, WALL, STONE3, { seg: 14 }); a.cyl(x, 28, z, 3.1, 5.5, SLATE, BLUE, { seg: 14, r2: 0, roof: true }); }
    a.box(4, 24.3, -3, 5, 5, 5, WALL, STONE, { roof: true }); a.crown(5, 5, 29.3, WALL, STONE);
    a.cyl(4, 29.3, -3, 0.12, 6, null, 0x403830, { seg: 6, roof: true }); a.box(5.2, 33.3, -3, 2.4, 1.6, 0.06, null, BANNER, { ds: true, roof: true });
    for (const y of [9.5, 14.5, 19.5]) for (const i of [-2, -1, 0, 1, 2]) { a.box(i * 5.2, y, d / 2 + 0.08, 1.3, 2.6, 0.12, G_TALL, GLASS); if (Math.abs(i) < 2) for (const s of [-1, 1]) a.box(s * (w / 2 + 0.08), y, i * 5.2, 0.12, 2.6, 1.3, G_TALL, GLASS); }
    a.box(door.lx, 2.6, d / 2 + 0.5, 4.4, 0.5, 1.2, WALL, STONE3, { under: true }); for (const s of [-1, 1]) a.box(door.lx + s * 2.6, 0, d / 2 + 0.3, 0.8, 5.4, 0.7, WALL, STONE3);
    for (const s of [-1, 1]) a.box(door.lx + s * 4.6, 2.4, d / 2 + 0.1, 1.5, 4.0, 0.08, null, BANNER);
});
/* THE GREAT HALL — a long gabled hall: buttresses between tall arched lights, a slate roof, a bell turret on the ridge, two chimneys */
const HALL = building('hall', 21, 4, 34, 10, 'S', 10.5, {}, (a, w, d, door) => {
    a.shell(w, 10.5, d, WALL, STONE, door); a.box(0, 0, 0, w + 0.5, 1.0, d + 0.5, WALL, STONE2, { top: true, faces: 'blr' });
    a.roof('gable', 0, 10.5, 0, w + 1.6, 6.5, d + 1.6, SLATE, RED, { keyEnd: WALL, tintEnd: STONE });
    a.box(0, 10.2, 0, w + 0.8, 0.45, d + 0.8, WALL, STONE3, { under: true, top: false });
    for (let i = -6; i <= 6; i++) { const x = i * 3.5; if (i % 2 === 0) { if (Math.abs(x - door.lx) > 2.2) a.box(x, 0, d / 2 + 0.55, 1.1, 8.6, 1.1, WALL, STONE2); a.box(x, 0, -d / 2 - 0.0, 1.1, 8.6, 0.6, WALL, STONE2); }
        else if (Math.abs(x - door.lx) > 2.6) { a.box(x, 2.6, d / 2 + 0.08, 1.9, 6.2, 0.12, G_TALL, GLASS, { glow: 0.5 }); a.box(x, 8.8, d / 2 + 0.2, 2.3, 0.4, 0.4, WALL, STONE3); } }
    a.box(door.lx, 2.4, d / 2 + 0.7, 5.2, 0.5, 1.6, WALL, STONE3, { under: true }); for (const s of [-1, 1]) a.box(door.lx + s * 2.3, 0, d / 2 + 0.9, 0.6, 2.4, 0.6, WALL, STONE3);
    a.box(-w / 2 - 0.08, 3.6, 0, 0.12, 5.2, 4.2, G_TALL, 0xd8a8c8, { glow: 0.6 }); a.box(-w / 2 - 0.2, 8.8, 0, 0.4, 0.4, 4.8, WALL, STONE3);                                  // THE ROSE WINDOW over the dais (a round light in the west gable)
    a.box(0, 16.4, 0, 2.2, 2.6, 2.2, WALL, STONE, { roof: true }); a.roof('pyramid', 0, 19, 0, 2.8, 3.2, 2.8, SLATE, BLUE);
    for (const x of [-12.25, 8.75]) a.box(x, 10.5, -d / 2 + 1.2, 1.6, 8.5, 1.6, WALL, STONE2, { roof: true });
    for (const s of [-1, 1]) a.box(door.lx + s * 4.4, 3.0, d / 2 + 0.1, 1.4, 4.6, 0.08, null, BANNER);
});
/* THE KITCHEN — lower, against the hall's east end: a stone lean-to under its own gable with one great chimney */
const KITCHEN = building('kitchen', 34, 4, 40, 10, 'S', 7, { leafDouble: false }, (a, w, d, door) => {
    a.shell(w, 7, d, WALL, STONE3, door); a.roof('gable', 0, 7, 0, d + 1.2, 4, w + 1.2, SLATE, RED, { ry: 90, keyEnd: WALL, tintEnd: STONE3 });
    a.box(w / 2 - 2, 7, -d / 2 + 2, 2.6, 9, 2.6, WALL, STONE2, { roof: true }); a.box(w / 2 - 2, 16, -d / 2 + 2, 3.1, 0.5, 3.1, WALL, STONE3, { roof: true });
    for (const x of [-6.5, 6.5]) a.box(x, 2.2, d / 2 + 0.08, 1.6, 2.4, 0.12, G_TALL, GLASS);
});
/* THE BARRACKS — a stout two-storey block with a hipped roof and a row of small lights; the Knights' */
const BARRACKS = building('barracks', 36, 18, 41, 23, 'W', 7, { leafDouble: false }, (a, w, d, door) => {
    a.shell(w, 7, d, WALL, STONE, door); a.roof('hip', 0, 7, 0, w + 1.4, 4.2, d + 1.4, SLATE, BLUE); a.box(0, 6.7, 0, w + 0.6, 0.4, d + 0.6, WALL, STONE3, { under: true, top: false });
    for (const i of [-2, -1, 1, 2]) for (const y of [1.6, 4.6]) if (y > 3 || Math.abs(i * 3.5 - door.lx) > 2) a.box(i * 3.5, y, d / 2 + 0.08, 1.1, 1.5, 0.12, G_TALL, GLASS);
    for (const s of [-1, 1]) a.box(door.lx + s * 2.2, 2.6, d / 2 + 0.1, 1.2, 3.4, 0.08, null, BANNER);
});
/* THE STABLES — timber on a stone foot, a long shingled roof, the stable door */
const STABLES = building('stables', 7, 18, 12, 23, 'E', 5.25, { leaf: 'leaf_stable', leafDouble: false, keyIn: WOODK, floorIn: 'dirt_2' }, (a, w, d, door) => {
    a.shell(w, 5.25, d, WOODK, 0xb89468, door); a.box(0, 0, 0, w + 0.4, 1.1, d + 0.4, WALL, STONE2, { faces: 'blr' });
    a.roof('gable', 0, 5.25, 0, w + 1.6, 3.6, d + 1.6, WOODD, 0x7a5a3c, { keyEnd: WOODK, tintEnd: 0xb89468 });
    for (const i of [-2, 2]) a.box(i * 3.5, 2.0, d / 2 + 0.08, 1.6, 1.4, 0.12, null, 0x30241c);
});
/* the roofs over the corner towers and the gatehouse (drawn only: posts on the parapet, a cone or a ridge over the deck), the portcullis, the banners */
{ const a = sheet();
  Object.keys(TW).forEach(k => { const t = tw(k); a.cyl(t.x, TOP + 1.2, t.z, 0.24, 3.4, WOODD, 0x6a4a30, { seg: 8, cap: false, ring: { n: 8, r: 4.85, a0: 22.5 } });
      a.cyl(t.x, TOP + 4.6, t.z, 6.1, 0.4, WOODD, 0x6a4a30, { seg: 16, roof: true }); a.cyl(t.x, TOP + 5, t.z, 6.3, 7, SLATE, BLUE, { seg: 16, r2: 0, roof: true });
      a.cyl(t.x, TOP + 12, t.z, 0.1, 3.4, null, 0x403830, { seg: 6, roof: true }); a.box(t.x + 1.1, TOP + 14, t.z, 2.2, 1.3, 0.06, null, BANNER, { ds: true, roof: true }); });
  for (const k of ['gw', 'ge']) { const b = bs(k); a.cyl(b.x, TOP + 1.1, b.z, 0.22, 3.0, WOODD, 0x6a4a30, { seg: 8, cap: false, ring: { n: 6, r: 3.0 } }); a.cyl(b.x, TOP + 4.1, b.z, 4.2, 6, SLATE, BLUE, { seg: 14, r2: 0, roof: true }); }
  a.roof('gable', X(19), TOP + 4.6, zs, 7.4, 3, 4.6, SLATE, RED, { keyEnd: WOODK, tintEnd: 0xb89468 });
  for (const s of [-1, 1]) a.box(X(19) + s * 3.3, TOP + 2.6, zs, 0.3, 2.0, 4.4, WOODD, 0x6a4a30);
  a.box(X(19) - 3.3, 4.2, zs + 1.2, 0.14, 2.8, 0.14, null, 0x2a2c30, { n: 12, step: [0.6, 0, 0] }); a.box(X(19), 4.2, zs + 1.2, 6.9, 0.2, 0.18, null, 0x2a2c30);   // THE PORTCULLIS, raised
  for (const s of [-1, 1]) { a.box(X(19) + s * 5.3, 2.4, zs + 3.56, 1.3, 3.8, 0.08, null, BANNER); a.box(X(19) + s * 5.3, 4.4, zs + 3.6, 0.5, 0.5, 0.06, null, 0xd8b050); }
  arch.push({ k: 'arch', id: 'cam:roofs', x: 0, z: 0, rot: 0, parts: a.P }); }
arch.forEach(feat);

/* ── THE INSIDES ── */
/* the Keep's guardroom: the armoury on the walls, the watch's table, THE GREAT STAIR's door at the back */
put(KEEP, 'armour_stand', -12, -9, { face: 0 }); put(KEEP, 'armour_stand', -8, -9, { face: 0 }); put(KEEP, 'armour_stand', 12, -9, { face: 0 }); put(KEEP, 'dojo_weapon_rack', -13.5, 0, { face: 90 }); put(KEEP, 'dojo_weapon_rack', 13.5, 0, { face: 270 });
put(KEEP, 'map_table', 6, 3, {}); put(KEEP, 'brazier', -5, 8, {}); put(KEEP, 'brazier', 5, 8, {}); put(KEEP, 'sea_chest', -11, 6, { face: 90 }); put(KEEP, 'banner', -4, -11.8, { face: 0, mount: 3.6 }); put(KEEP, 'banner', 4, -11.8, { face: 0, mount: 3.6 });
/* the Great Hall: THE DAIS and the throne at the west end, THE ROUND TABLE in the middle, the minstrels' gallery's end at the east */
put(HALL, 'round_table', 0, 0, {}); put(HALL, 'royal_throne', -19.5, 0, { face: 90 }); put(HALL, 'holy_carpet', -15, 0, { face: 90 });
for (const z of [-7.5, 7.5]) { put(HALL, 'brazier', -17, z, {}); put(HALL, 'armour_stand', -11, z * 1.15, { face: z < 0 ? 0 : 180 }); put(HALL, 'armour_stand', 11, z * 1.15, { face: z < 0 ? 0 : 180 }); }
for (const x of [-14, -7, 7, 14]) put(HALL, 'banner', x, -10.1, { face: 0, mount: 5.0 });
put(HALL, 'crystal_chandelier', 0, 0, { floor: true, y: 8.6 }); put(HALL, 'crystal_chandelier', -12, 0, { floor: true, y: 8.6 }); put(HALL, 'crystal_chandelier', 12, 0, { floor: true, y: 8.6 });
for (const z of [-5, 5]) { put(HALL, 'psx_table_large_2', 14, z, { face: 90 }); put(HALL, 'church_pew', 14, z + 1.6, { face: 180 }); put(HALL, 'church_pew', 14, z - 1.6, { face: 0 }); }
/* the Kitchen */
put(KITCHEN, 'cauldron', 6, -7, {}); put(KITCHEN, 'stock_pots', 2, -9, { face: 0 }); put(KITCHEN, 'psx_table_large_3', -3, 0, {}); put(KITCHEN, 'bread_rack', -8.5, -6, { face: 90 });
put(KITCHEN, 'meshy_burlap_sack', 7, 4, {}); put(KITCHEN, 'meshy_burlap_sack', 8, 2.6, { face: 40 }); put(KITCHEN, 'psx_wooden_crate_2', 7.5, 7, {}); put(KITCHEN, 'brazier', 0, -8.5, {});
/* the Barracks */
for (const z of [-5.5, -1.5, 2.5]) { put(BARRACKS, 'dorm_bed', -6, z, { face: 90 }); put(BARRACKS, 'dorm_bed', 6, z, { face: 270 }); }
put(BARRACKS, 'armour_stand', -3, -7.5, { face: 0 }); put(BARRACKS, 'armour_stand', 3, -7.5, { face: 0 }); put(BARRACKS, 'dojo_weapon_rack', 0, -7.6, { face: 0 }); put(BARRACKS, 'sea_chest', -6.5, 6.5, { face: 90 }); put(BARRACKS, 'brazier', 0, 0, {});
/* the Stables */
put(STABLES, 'horse', -5, -4.5, { face: 180 }); put(STABLES, 'horse_brown', 0, -4.5, { face: 180 }); put(STABLES, 'horse_black', 5, -4.5, { face: 180 }); put(STABLES, 'meshy_burlap_sack', -6.5, 4, {}); put(STABLES, 'psx_wooden_crate_3', 6.5, 5, {});

/* ── THE WARDS: the sword in the stone, the well's head stands where the well link puts it, the lists, the gate ── */
const P = (key, sx, sy, o) => props.push(Object.assign({ key, x: X(sx), z: Z(sy) }, o || {}));
P('sword_stone', 14.5, 19.5, { face: 90, h: 2.8, floor: true });
P('brazier', 17.5, 23.2); P('brazier', 20.5, 23.2); P('brazier', 17.5, 14.6); P('brazier', 20.5, 14.6); P('brazier', 17.5, 30.5); P('brazier', 20.5, 30.5);
P('stocks', 22.5, 22.5, { face: 270 }); P('camping_tent', 23.5, 18.5, { face: 180 }); P('camping_tent', 34.5, 22.5, { face: 0 }); P('armour_stand', 25.5, 18.5, { face: 180 }); P('armour_stand', 32.5, 22.5, { face: 0 });
P('fountain', 29.5, 11.9); P('iron_garden_bench', 31.5, 12.4, { face: 270 }); P('planter', 26.5, 12.5); P('planter', 32.5, 10.6); P('planter', 22.5, 12.5); P('lion_statue', 17.2, 10.6, { face: 180 }); P('lion_statue', 20.8, 10.6, { face: 180 });
P('signpost', 21.5, 33.5); P('cave_torch', 4.5, 32.5); P('campfire', 8.5, 33.5); P('signpost', 43.5, 31.5);

/* ── THE WAYS (the Great Stair and the sally port are doors of this room; the trail, the wardrobe, the well, the sleigh road and the HQ
   portcullis are DOOR_HQ.links / siteRooms.entry rows that end here) ── */
{ const p = KEEP.at(9, -10.9);
  doors.push({ id: 'keep', wall: 'free', x: p[0], z: p[1], face: 180, leaf: 'leaf_shabby_wood', label: 'THE KEEP', sub: 'THE GREAT STAIR · THE SOLAR · THE BATTLEMENTS',
      action: { room: 'site_prebuilt_camelot_keep', at: 'ward' }, desc: 'The stair door at the back of the guardroom. The stair behind it goes up to the battlements and does not stop there.' });
  doors.push({ id: 'postern', wall: 'free', x: X(6.5), z: Z(34.4), face: 0, leaf: 'leaf_shabby_wood', label: 'MERLIN’S UNDERCROFT', sub: 'THE SALLY PORT · UNDER THE MOAT',
      action: { room: 'site_prebuilt_camelot_dungeon', at: 'postern' }, desc: 'A low door in the bank outside the moat. It goes under the water, which the besiegers should have found suspicious.' }); }

/* ── who stands here: the old ward's four, with their own lines, moved to their new places; a knight at the barracks ── */
const D = require('./load-data.js').loadGameData(), vm = require('vm');
const OLD = JSON.parse(vm.runInContext('JSON.stringify({ n: DOOR_HQ.rooms.site_prebuilt_camelot_ward.npcSpots, l: DOOR_HQ.rooms.site_prebuilt_camelot_ward.lines })', D));
const say = race => (OLD.n.find(n => n.race === race) || {}).say || [];
npc.push({ x: X(21.6), z: Z(26.6), face: 180, race: 'knight', say: say('knight') });
npc.push({ x: X(16.5), z: Z(21.5), face: 300, race: 'swordfighter', say: say('swordfighter') });
npc.push({ x: X(34.5), z: Z(12.5), face: 240, race: 'robinhood', say: say('robinhood') });
{ const p = HALL.at(-16, 2.5); npc.push({ x: p[0], z: p[1], face: 90, race: 'king arthur', say: say('king arthur') }); }
{ const p = BARRACKS.at(2, 3); npc.push({ x: p[0], z: p[1], face: 270, race: 'knight' }); }

/* ── checks ── */
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); Object.keys(p).forEach(k => { if (p[k] === undefined) delete p[k]; }); });
npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
const count = { features: F.length, props: props.length, doors: doors.length, natives: npc.length, archRows: arch.length, archParts: arch.reduce((s, a) => s + a.parts.length, 0) };

/* ── the room ── */
const L = [];
L.push("        /* CAMELOT-CASTLE-BEGIN — CAMELOT CASTLE, REDESIGNED (2026-11-15): written by `node bake-camelot.js`. Never hand-edit between the markers; edit the tool and rerun. */");
L.push("        site_prebuilt_camelot_castle: {");
L.push("            label: 'CAMELOT · THE CASTLE',");
L.push("            sub: 'THE MOAT · THE GATEHOUSE · TWO WARDS · THE KEEP · THE GREAT HALL · THE WALL-WALK',");
L.push("            kind: 'box', site: 'prebuilt_camelot', part: 'castle',");
L.push("            shell: hqCastleShell({ w: " + (2 * HW) + ", d: " + (2 * HD) + ", plate: { x: " + X(19) + ", z: " + Z(34) + ", y: 4.4 } }),");
L.push("            parti: 'A castle on an island in its own moat: one drawbridge, a twin-drum gatehouse, an outer ward for the lists and an inner ward for the hall and the keep, and a wall you can walk the whole round of.',");
L.push("            typology: 'hub',");
L.push("            terrain: {");
L.push("                floor: 'grass_2', cliff: 'castle_wall', path: 'cobblestone',");
L.push("                noise: { amp: 0, scale: 8 },");
L.push("                features: [");
F.forEach(f => L.push("                    " + f));
L.push("                ],");
L.push("                marks: " + J(marks) + ",");
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
L.push("            lines: " + J(OLD.l) + ",");
L.push("            spawn: { x: " + X(19) + ", z: " + Z(34) + ", face: 0 },");
L.push("        },");
L.push("        /* CAMELOT-CASTLE-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
if (DRY) process.exit(0);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const END = '        /* CAMELOT-CASTLE-END */\n', b0 = src.indexOf('        /* CAMELOT-CASTLE-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        site_prebuilt_camelot_ward: {'; const a = src.indexOf(anchor); if (a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
fs.writeFileSync(file, src);
console.log('data.js: site_prebuilt_camelot_castle written (' + block.length + ' bytes)');
