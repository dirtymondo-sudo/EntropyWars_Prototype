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
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData(), vm = require('vm');
const OLD = JSON.parse(vm.runInContext('JSON.stringify({ n: DOOR_HQ.rooms.site_prebuilt_camelot_ward.npcSpots, l: DOOR_HQ.rooms.site_prebuilt_camelot_ward.lines })', D));
const say = race => (OLD.n.find(n => n.race === race) || {}).say || [];
const WALL = 'castle_wall';
/* THE CASTLE, built once for its own room (DZ 0) and once inside the kingdom (DZ = how far south its middle stands there) */
function buildCastle(DZ) {
const X = s => r2(-HW + s * C), Z = s => r2(-HD + s * C + DZ);
const F = [], props = [], doors = [], npc = [], arch = [], marks = [];
const feat = o => F.push(J(o) + ','), raw = s => F.push(s + ','), note = s => F.push('/* ' + s + ' */');

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
        /* a roof is drawn from outside only, so it gets its underside (2026-11-15, mondo: "gaps in the village buildings roofs": from the street
           you looked up past the eaves, through the roof, at the sky): one timber sheet facing down, eave to eave */
        roof: (form, x, y, z, w, h, d, key, tint, o) => { add({ s: 'box', p: [x, y, z], size: [w, 0.02, d], sides: false, top: false, under: true, roof: true, ry: (o && o.ry) || 0 }, WOODD, 0x4a3626);
            return add({ s: 'roof', form, p: [x, y, z], size: [w, h, d], roof: true }, key, tint, o); },
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
npc.push({ x: X(21.6), z: Z(26.6), face: 180, race: 'knight', say: say('knight') });
npc.push({ x: X(16.5), z: Z(21.5), face: 300, race: 'swordfighter', say: say('swordfighter') });
npc.push({ x: X(34.5), z: Z(12.5), face: 240, race: 'robinhood', say: say('robinhood') });
{ const p = HALL.at(-16, 2.5); npc.push({ x: p[0], z: p[1], face: 90, race: 'king arthur', say: say('king arthur') }); }
{ const p = BARRACKS.at(2, 3); npc.push({ x: p[0], z: p[1], face: 270, race: 'knight' }); }

return { F, props, doors, npc, marks, arch, X, Z, feat, note, sheet, building, put, KEEP, HALL };
}

/* ── checks ── */
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D), TREES = vm.runInContext('HQ_TREE_KINDS', D);
function check(props, npc) {
    props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); Object.keys(p).forEach(k => { if (p[k] === undefined) delete p[k]; }); });
    npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
}
function splice(src, block, tag, anchor) {
    const END = '        /* ' + tag + '-END */\n', b0 = src.indexOf('        /* ' + tag + '-BEGIN'), b1 = src.indexOf(END);
    if (b0 >= 0 && b1 > b0) return src.slice(0, b0) + block + src.slice(b1 + END.length);
    const a = src.indexOf(anchor); if (a < 0) throw new Error('anchor not found in data.js: ' + anchor); return src.slice(0, a) + block + src.slice(a);
}

/* ══ THE CASTLE'S OWN ROOM (the first delivery; kept, the kingdom below is the room the ways in open on) ══ */
const CS = buildCastle(0); check(CS.props, CS.npc);
const L = [];
L.push("        /* CAMELOT-CASTLE-BEGIN — CAMELOT CASTLE, REDESIGNED (2026-11-15): written by `node bake-camelot.js`. Never hand-edit between the markers; edit the tool and rerun. */");
L.push("        site_prebuilt_camelot_castle: {");
L.push("            label: 'CAMELOT · THE CASTLE',");
L.push("            sub: 'THE MOAT · THE GATEHOUSE · TWO WARDS · THE KEEP · THE GREAT HALL · THE WALL-WALK',");
L.push("            kind: 'box', site: 'prebuilt_camelot', part: 'castle',");
L.push("            shell: hqCastleShell({ w: " + (2 * HW) + ", d: " + (2 * HD) + ", plate: { x: " + CS.X(19) + ", z: " + CS.Z(34) + ", y: 4.4 } }),");
L.push("            parti: 'A castle on an island in its own moat: one drawbridge, a twin-drum gatehouse, an outer ward for the lists and an inner ward for the hall and the keep, and a wall you can walk the whole round of.',");
L.push("            typology: 'hub',");
L.push("            terrain: {");
L.push("                floor: 'grass_2', cliff: 'castle_wall', path: 'cobblestone',");
L.push("                noise: { amp: 0, scale: 8 },");
L.push("                features: [");
CS.F.forEach(f => L.push("                    " + f));
L.push("                ],");
L.push("                marks: " + J(CS.marks) + ",");
L.push("            },");
L.push("            doors: [");
CS.doors.forEach(d => L.push("                " + J(d) + ","));
L.push("            ],");
L.push("            counters: [],");
L.push("            props: [");
for (let i = 0; i < CS.props.length; i += 4) L.push("                " + CS.props.slice(i, i + 4).map(J).join(", ") + ",");
L.push("            ],");
L.push("            agents: [],");
L.push("            npcSpots: " + J(CS.npc) + ",");
L.push("            onlineSpots: [],");
L.push("            lines: " + J(OLD.l) + ",");
L.push("            spawn: { x: " + CS.X(19) + ", z: " + CS.Z(34) + ", face: 0 },");
L.push("        },");
L.push("        /* CAMELOT-CASTLE-END */");
const castleBlock = L.join('\n') + '\n';
console.log('castle ' + JSON.stringify({ features: CS.F.length, props: CS.props.length, doors: CS.doors.length, natives: CS.npc.length }));

/* ══ CAMELOT KINGDOM ON PLOTS (2026-11-15, mondo's OK on plan 2: "i want camelot castle in the middle and for it to be surrounded by the other
   districts ... the north pole to the north of the castle would be good as a rival kingdom, or put more woods in between them").
   8 x 8 plots of 12 x 12 squares (336 m): the castle above in the middle (plots 2-5 x 3-5), THE NORTH POLE north of it behind a belt of snowy
   pines, THE TOWN south, THE FAIRY FOREST east, THE LOOKING-GLASS GARDEN west. The squares are docs/areas/camelot/layout.json `cells`
   (the approved plan's own map); the method is the Woods' (bake-woods.js): open squares are `space` rows of a `gen.kind: 'plan'` room,
   everything else is solid (forest, snowy pines, or hedge by `gen.zones`). Squares below are the kingdom's (kx, ky), 0..96. ══ */
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/camelot/layout.json'), 'utf8'));
const N = 12, G = 8, W = N * G, PL = N * C, HALF = W * C / 2, CX0 = 24, CY0 = 36, RISE = 1.75;
const gx = c => r2(-HALF + c * C), gc = c => r2(-HALF + (c + 0.5) * C);
const K = buildCastle(gx(CY0) + HD);                                     // the castle's north-west square is (24, 36); its x is the kingdom's own
if (K.X(0) !== gx(CX0) || K.Z(0) !== gx(CY0)) throw new Error('the castle does not sit on its plots');
const F = K.F, props = K.props, doors = K.doors, npc = K.npc, feat = K.feat, note = K.note, count = {};
let seed = 64; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const cell = PLAN.cells.map(r => r.split(''));
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); plot[p.id] = p; });
const plotAt = (x, y) => plot['P0' + Math.floor(x / N) + '-0' + Math.floor(y / N)], distAt = (x, y) => plotAt(x, y).district;
const inCastle = (x, y) => x >= CX0 && x < CX0 + SW && y >= CY0 && y < CY0 + SD;
let POLE = null;
for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x];
    if (inCastle(x, y)) cell[y][x] = 'K';                                  // the castle's own ground (built above)
    else if (ch === 'r' || ch === 'M') cell[y][x] = 't';                   // a rock, a giant toadstool in the trees: forest (the toadstools are the zone's trees)
    else if (ch === 'O') { POLE = [x, y]; cell[y][x] = 's'; }
    else if (x >= 72 && y >= 60 && y <= 66 && ch === 'w') cell[y][x] = 'g';   // the plan's moat overflow: the built moat stops at the castle's own bank
    else if (x >= 72 && (ch === 'b')) cell[y][x] = 'p'; }
for (let y = 49; y <= 58; y++) for (let x = 1; x <= 10; x++) if (cell[y][x] === 'h') cell[y][x] = 'g';   // a square of lawn round the chessboard
for (let y = 91; y < W; y++) for (const x of [40, 41]) if (cell[y][x] === 'g') cell[y][x] = 'c';         // the road runs out under the portcullis
for (let y = 26; y <= 28; y++) for (let x = 27; x <= 30; x++) cell[y][x] = 's';                          // the wardrobe's nook in the snowy pines, off the west road
const SOLID = ch => ch === 't' || ch === 'T' || ch === 'h';
const open = (x, y) => x >= 0 && y >= 0 && x < W && y < W && !SOLID(cell[y][x]);
const PATHCH = { N: 'i', L: 'm', F: 'p', T: 'c', K: 'g' };

/* ── THE WAYS OUT on the room's wall: the path carried to it, two squares wide (the Woods' own spur) ── */
function spur(id, wall) {
    const p = plot[id], x0 = p.x * N, y0 = p.y * N, ch = PATHCH[p.district]; let best = null;
    for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { if (!open(x0 + lx, y0 + ly)) continue;
        const d = wall === 'w' ? lx : wall === 'e' ? N - 1 - lx : wall === 'n' ? ly : N - 1 - ly; if (!best || d < best[0]) best = [d, lx, ly]; }
    const lx = Math.min(best[1], N - 2), ly = Math.min(best[2], N - 2), cut = (x, y) => { if (SOLID(cell[y][x])) cell[y][x] = ch; };
    if (wall === 'w') for (let x = 0; x <= best[1]; x++) { cut(x0 + x, y0 + ly); cut(x0 + x, y0 + ly + 1); }
    if (wall === 'e') for (let x = best[1]; x < N; x++) { cut(x0 + x, y0 + ly); cut(x0 + x, y0 + ly + 1); }
    if (wall === 'n') for (let y = 0; y <= best[2]; y++) { cut(x0 + lx, y0 + y); cut(x0 + lx + 1, y0 + y); }
    if (wall === 's') for (let y = best[2]; y < N; y++) { cut(x0 + lx, y0 + y); cut(x0 + lx + 1, y0 + y); }
    return (wall === 'w' || wall === 'e') ? gx(y0 + ly + 1) : gx(x0 + lx + 1);
}
const OLDR = id => JSON.parse(vm.runInContext('JSON.stringify((r => ({ d: r.doors, n: r.npcSpots, l: r.lines, t: r.terrain.features.filter(f => f.k === "tree" && /chess/.test(f.kind)) }))(DOOR_HQ.rooms.' + id + '))', D));
const OG = OLDR('site_prebuilt_lookingglass_garden'), ONP = OLDR('site_prebuilt_northpole_village');
const sayOf = (R, race) => (R.n.find(n => n.race === race) || {}).say;
const WAYS = { trail: spur('P07-04', 'e'), sleigh: spur('P04-00', 'n') };   // the ends of the links `woods_camelot` and `northpole_camelot` (data.js DOOR_HQ.links)
doors.push({ id: 'oldgarden', wall: 'w', z: spur('P00-06', 'w'), way: 'trail', label: 'THE LOOKING-GLASS · THE GARDEN', sub: 'THE OLD GARDEN · AS IT WAS',
    action: { room: 'site_prebuilt_lookingglass_garden', at: 'bay' }, desc: 'A gap in the west hedge. The garden on the far side is the one that was here before this one was measured.' });
doors.push({ id: 'deadtree', wall: 's', x: spur('P01-07', 's'), way: 'trail', secret: true, label: 'THE WOODS', sub: 'THE DEAD TREE · BACK TO THE WOODS',
    action: { room: 'site_prebuilt_fairy_forest_plots', at: 'lookingglass' }, desc: 'The hedge stops at a dead tree with a hole in it the size of a door. Through it the ground is the right colour again.' });

/* a plot the plan drew as path only gets a small glade beside its path (the Woods' rule: somewhere for its pieces to stand, and for a fight to open out) */
PLAN.plots.forEach(p => { if (p.district === 'K') return; let g = 0, best = null;
    for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const ch = cell[p.y * N + ly][p.x * N + lx]; if (ch === 'g' || ch === 's' || ch === 'm') g++;
        if (ch === 'p' || ch === 'i' || ch === 'c') { const d = Math.hypot(lx - 5.5, ly - 5.5); if (!best || d < best[0]) best = [d, lx, ly]; } }
    if (g >= 16 || !best) return;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const lx = best[1] + dx, ly = best[2] + dy; if (lx < 1 || ly < 1 || lx > N - 2 || ly > N - 2 || dx * dx + dy * dy > 8) continue;
        if (SOLID(cell[p.y * N + ly][p.x * N + lx])) cell[p.y * N + ly][p.x * N + lx] = p.district === 'N' ? 's' : 'g'; }
    count.glades = (count.glades || 0) + 1; });

/* ── THE LEVELS: the North Pole stands one level (1.75 m) over the rest; the grade is the four squares under the snowline (12.5 %) ── */
const ground = (xm, zm) => RISE * Math.min(1, Math.max(0, (24 - (zm + HALF) / C) / 4));
const slope = Buffer.alloc(W * W * 8);
for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) { const o = (cy * W + cx) * 8;
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((q, k) => slope.writeInt16LE(Math.round(ground(gx(cx + q[0]), gx(cy + q[1])) * 100), o + k * 2)); }

/* ── THE BUILDINGS' SQUARES: the four walked into are named here; every other run of the plan's `B` is a cottage (the Pole) or a house (the Town) ── */
const WALKIN = { chapel: [31, 72, 36, 78, 'S'], smithy: [61, 75, 65, 79, 'E'], inn: [51, 91, 56, 95, 'N'], workshop: [40, 2, 43, 5, 'S'] };
Object.keys(WALKIN).forEach(k => { const q = WALKIN[k]; for (let y = q[1]; y < q[3]; y++) for (let x = q[0]; x < q[2]; x++) cell[y][x] = 'V'; });
const HOUSES = [];
{ const used = new Uint8Array(W * W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { if (cell[y][x] !== 'B' || used[y * W + x]) continue;
      let w = 1; while (x + w < W && cell[y][x + w] === 'B' && !used[y * W + x + w] && distAt(x + w, y) === distAt(x, y)) w++;
      let h = 1; rows: while (y + h < W) { for (let i = 0; i < w; i++) if (cell[y + h][x + i] !== 'B' || used[(y + h) * W + x + i]) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
      HOUSES.push({ x0: x, y0: y, x1: x + w, y1: y + h, d: distAt(x, y) }); } }

/* ── THE OPEN GROUND: greedy rectangles of open squares ── */
{ const used = new Uint8Array(W * W);
  for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) { if (!open(cx, cy) || used[cy * W + cx]) continue;
      let w = 1; while (cx + w < W && !used[cy * W + cx + w] && open(cx + w, cy)) w++;
      let h = 1; rows: while (cy + h < W) { for (let i = 0; i < w; i++) if (used[(cy + h) * W + cx + i] || !open(cx + i, cy + h)) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(cy + j) * W + cx + i] = 1;
      feat({ k: 'space', x: r2(gx(cx) + w * C / 2), z: r2(gx(cy) + h * C / 2), w: w * C, d: h * C }); count.spaces = (count.spaces || 0) + 1; } }
/* the paint: snow under the Pole and its pines (no snow sheet exists: the Woods' Snowline wears the ice sheet too), the lake's ice, the trodden
   snow road, the forest's dirt, the town's cobbles, the garden's marble, the ground under the hedges */
const PAL = ['ice', 'ice_1', 'dirt_2', 'cobblestone', 'marble', 'igloo', 'leaves_3'], paint = new Uint8Array(W * W);
for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x], n = distAt(x, y) === 'N';
    paint[y * W + x] = (ch === 's' || ch === 'T' || (n && (ch === 'B' || ch === 'V'))) ? 1 : ch === 'I' ? 2 : ch === 'p' ? 3 : ch === 'c' ? 4 : (ch === 'm' || ch === 'x' || ch === 'X') ? 5 : ch === 'i' ? 6 : ch === 'h' ? 7 : 0; }

/* ── THE DRESSING HELPERS (the Woods'): a plot's free squares, the one nearest its clearing's middle + (dx, dy) ── */
const FREE = ch => ch === 'g' || ch === 's' || ch === 'm';
function freeSquares(id) { const p = plot[id], out = []; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) if (FREE(cell[p.y * N + ly][p.x * N + lx])) out.push([p.x * N + lx, p.y * N + ly]); return out; }
const taken = new Set();
function centre(id) { const f = freeSquares(id); if (!f.length) throw new Error('no clearing on ' + id); const mx = f.reduce((s, q) => s + q[0], 0) / f.length, my = f.reduce((s, q) => s + q[1], 0) / f.length;
    return f.slice().sort((a, b) => Math.hypot(a[0] - mx, a[1] - my) - Math.hypot(b[0] - mx, b[1] - my))[0]; }
function near(id, dx, dy) { const c = centre(id), f = freeSquares(id).filter(q => !taken.has(q[0] + ':' + q[1])); if (!f.length) throw new Error('no free square left on ' + id);
    const q = f.sort((a, b) => Math.hypot(a[0] - c[0] - dx, a[1] - c[1] - dy) - Math.hypot(b[0] - c[0] - dx, b[1] - c[1] - dy))[0]; taken.add(q[0] + ':' + q[1]); return q; }
function put(id, key, dx, dy, o) { const q = near(id, dx || 0, dy || 0); props.push(Object.assign({ key, x: gc(q[0]), z: gc(q[1]) }, o || {})); return q; }                 // a blocker: on its square's middle
function dec(id, key, dx, dy, o) { const q = near(id, dx || 0, dy || 0); props.push(Object.assign({ key, x: r2(gc(q[0]) + (rnd() - 0.5) * 1.6), z: r2(gc(q[1]) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); return q; }   // decor: off it
function tree(id, kind, h, dx, dy, r) { if (!TREES[kind]) throw new Error('not a tree: ' + kind); const q = near(id, dx || 0, dy || 0); feat({ k: 'tree', x: gc(q[0]), z: gc(q[1]), kind, h, r: r || 0.8 }); return q; }
function native(id, race, dx, dy, face, say) { const q = near(id, dx || 0, dy || 0), n = { x: gc(q[0]), z: gc(q[1]), face: face || 0, race }; if (say) n.say = say; npc.push(n); }
const many = (n, f) => { for (let i = 0; i < n; i++) f(i); };

/* ── THE BUILDINGS ── */
const U = n => 'urban:' + n, STUCCO = U('PlasterWallStucco2a'), G_TALL = U('GlassWindowTall1a'), SLATE = U('MetalRoofTiles1a'), WOODK = 'wood_planks', WOODD = 'wood';
const STONE = 0xc4c0b8, STONE2 = 0xaeaaa6, STONE3 = 0xd2ccc0, GLASS = 0xa8c4ec, TIMBER = 0x4a3626;
const nArch = K.arch.length, kb = (id, q, h, o, parts) => K.building(id, q[0] - CX0, q[1] - CY0, q[2] - CX0, q[3] - CY0, q[4], h, o, parts);
note('THE TOWN + THE POLE: the four buildings walked into');
/* THE CHAPEL — stone, a steep slate roof, a bell turret over the door, buttresses, tall lights */
const CHAPEL = kb('chapel', WALKIN.chapel, 7, { floorIn: 'marble' }, (a, w, d, door) => {
    a.shell(w, 7, d, WALL, STONE, door); a.box(0, 0, 0, w + 0.5, 1.0, d + 0.5, WALL, STONE2, { faces: 'blr' });
    a.roof('gable', 0, 7, 0, d + 1.4, 6, w + 1.4, SLATE, 0x5a6c96, { ry: 90, keyEnd: WALL, tintEnd: STONE });
    a.box(0, 9.5, d / 2 - 1.4, 2.8, 5.5, 2.8, WALL, STONE, { roof: true }); a.roof('pyramid', 0, 15, d / 2 - 1.4, 3.4, 3.6, 3.4, SLATE, 0x5a6c96);
    a.box(0, 18.6, d / 2 - 1.4, 0.16, 1.6, 0.16, null, 0x2c2c30, { roof: true }); a.box(0, 19.5, d / 2 - 1.4, 0.9, 0.16, 0.16, null, 0x2c2c30, { roof: true });
    for (const z of [-7, -2.33, 2.33, 7]) for (const s of [-1, 1]) { a.box(s * (w / 2 + 0.45), 0, z, 0.9, 5.6, 0.9, WALL, STONE2); }
    for (const z of [-4.66, 0, 4.66]) for (const s of [-1, 1]) a.box(s * (w / 2 + 0.08), 2.2, z, 0.12, 3.6, 1.3, G_TALL, 0xd8a8c8, { glow: 0.5 });
    a.box(door.lx, 2.4, d / 2 + 0.5, 3.6, 0.5, 1.2, WALL, STONE3, { under: true });
});
/* THE SMITHY — timber on a stone foot, a great forge chimney */
const SMITHY = kb('smithy', WALKIN.smithy, 5.25, { leafDouble: false, keyIn: WOODK, floorIn: 'dirt_2' }, (a, w, d, door) => {
    a.shell(w, 5.25, d, WOODK, 0xa88458, door); a.box(0, 0, 0, w + 0.4, 1.4, d + 0.4, WALL, STONE2, { faces: 'blr' });
    a.roof('gable', 0, 5.25, 0, w + 1.6, 3.4, d + 1.6, WOODD, 0x6a4a34, { keyEnd: WOODK, tintEnd: 0xa88458 });
    a.box(-w / 2 + 2, 0, -d / 2 - 0.9, 3, 11, 2.2, WALL, STONE2); a.box(-w / 2 + 2, 11, -d / 2 - 0.9, 3.5, 0.5, 2.7, WALL, STONE3, { roof: true });
    a.box(door.lx + 3.6, 1.6, d / 2 + 0.08, 2.4, 1.6, 0.12, null, 0x2a2018);
});
/* THE INN — two storeys of plaster and timber, a long roof, lit windows */
const INN = kb('inn', WALKIN.inn, 7, { keyIn: STUCCO, floorIn: 'wood_planks' }, (a, w, d, door) => {
    a.shell(w, 7, d, STUCCO, 0xe6dcc4, door); a.box(0, 0, 0, w + 0.4, 1.0, d + 0.4, WALL, STONE2, { faces: 'blr' });
    for (const s of [-1, 1]) for (const t of [-1, 1]) a.box(s * w / 2, 1.0, t * d / 2, 0.4, 6, 0.4, WOODD, TIMBER);
    a.box(0, 3.4, 0, w + 0.16, 0.35, d + 0.16, WOODD, TIMBER, { top: false, under: true }); a.box(0, 6.7, 0, w + 0.3, 0.35, d + 0.3, WOODD, TIMBER, { top: false, under: true });
    a.roof('gable', 0, 7, 0, w + 1.8, 4.4, d + 1.8, SLATE, 0xa84a3c, { keyEnd: STUCCO, tintEnd: 0xe6dcc4 });
    for (const x of [-6, -3, 3, 6]) { a.box(x, 4.3, d / 2 + 0.08, 1.2, 1.5, 0.12, G_TALL, 0xf0d890, { glow: 0.6 }); if (Math.abs(x - door.lx) > 2) a.box(x, 1.5, d / 2 + 0.08, 1.2, 1.5, 0.12, G_TALL, 0xf0d890, { glow: 0.6 }); }
    a.box(w / 2 - 1.6, 7, -d / 4, 1.3, 6, 1.3, WALL, STONE2, { roof: true });
    a.box(door.lx + 2.4, 3.0, d / 2 + 0.9, 0.12, 0.12, 1.6, WOODD, TIMBER); a.box(door.lx + 2.4, 2.1, d / 2 + 1.5, 1.2, 0.9, 0.08, WOODK, 0xb89468, { ds: true });   // the sign
});
/* THE WORKSHOP — red boards, a snow-white roof, lit windows */
const SHOP = kb('workshop', WALKIN.workshop, 5.25, { leafDouble: false, keyIn: WOODK, floorIn: 'wood_planks' }, (a, w, d, door) => {
    a.shell(w, 5.25, d, WOODK, 0xb84438, door); a.box(0, 0, 0, w + 0.4, 0.9, d + 0.4, WALL, STONE3, { faces: 'blr' });
    a.roof('gable', 0, 5.25, 0, w + 1.8, 3.8, d + 1.8, 'ice', 0xf4f8ff, { keyEnd: WOODK, tintEnd: 0xb84438 });
    for (const x of [-3.4, 3.4]) a.box(x, 1.6, d / 2 + 0.08, 1.3, 1.5, 0.12, G_TALL, 0xf0d890, { glow: 0.7 });
    a.box(w / 2 - 1.4, 5.25, -d / 4, 1.1, 5, 1.1, 'bricks_2', 0xb86a54, { roof: true });
});
/* the houses: plaster on a stone foot, a dark timber frame, a gable; the cottages of the Pole are the pack's own house */
const HTINT = [0xe8dcc0, 0xd8c8a8, 0xf0e8d8, 0xc8b89c], RTINT = [0xa84a3c, 0x7a5a3c, 0x5a6c96, 0x8a4a34], RKEY = [SLATE, WOODD, SLATE, SLATE];
function frontOf(h) { const n = { N: 0, S: 0, W: 0, E: 0 }, road = (x, y) => (x >= 0 && y >= 0 && x < W && y < W && (cell[y][x] === 'c' || cell[y][x] === 'i')) ? 1 : 0;
    for (let x = h.x0; x < h.x1; x++) { n.N += road(x, h.y0 - 1); n.S += road(x, h.y1); } for (let y = h.y0; y < h.y1; y++) { n.W += road(h.x0 - 1, y); n.E += road(h.x1, y); }
    return ['S', 'N', 'E', 'W'].sort((a, b) => n[b] - n[a])[0]; }
note('THE TOWN: the houses');
HOUSES.forEach((h, i) => {
    const side = frontOf(h);
    if (h.d === 'N') { const face = { S: 180, N: 0, E: 90, W: 270 }[side]; props.push({ key: 'xmas_house', x: r2((gx(h.x0) + gx(h.x1)) / 2), z: r2((gx(h.y0) + gx(h.y1)) / 2), face, h: Math.min(h.x1 - h.x0, h.y1 - h.y0) >= 3 ? 7 : 5.6, floor: true }); count.cottages = (count.cottages || 0) + 1; return; }
    const two = (i % 3) !== 1 && Math.min(h.x1 - h.x0, h.y1 - h.y0) >= 2, hh = two ? 7 : 4.2, tint = HTINT[i % 4], rt = RTINT[(i * 3 + 1) % 4], rk = RKEY[(i * 3 + 1) % 4];
    kb('house_' + i, [h.x0, h.y0, h.x1, h.y1, side], hh, { hollow: false, leaf: undefined, leafDouble: undefined, keyIn: undefined, floorIn: undefined }, (a, w, d) => {
        a.box(0, 0, 0, w - 0.3, hh, d - 0.3, STUCCO, tint, { top: false }); a.box(0, 0, 0, w, 0.9, d, WALL, STONE2, { top: true });
        for (const s of [-1, 1]) for (const t of [-1, 1]) a.box(s * (w / 2 - 0.2), 0.9, t * (d / 2 - 0.2), 0.34, hh - 0.9, 0.34, WOODD, TIMBER);
        if (two) a.box(0, 3.4, 0, w - 0.1, 0.3, d - 0.1, WOODD, TIMBER, { top: false, under: true });
        a.box(0, hh - 0.3, 0, w, 0.3, d, WOODD, TIMBER, { top: false, under: true });
        const rh = 2.4 + (i % 3) * 0.6; if (d > w) a.roof('gable', 0, hh, 0, d + 0.9, rh, w + 0.9, rk, rt, { ry: 90, keyEnd: STUCCO, tintEnd: tint }); else a.roof('gable', 0, hh, 0, w + 0.9, rh, d + 0.9, rk, rt, { keyEnd: STUCCO, tintEnd: tint });
        const dx = ((i % 2) ? 1 : -1) * Math.min(1.6, w / 2 - 1.4);
        a.box(dx, 0.9, d / 2 - 0.1, 1.2, 2.1, 0.12, WOODK, 0x5a3c26); a.box(dx, 3.0, d / 2 - 0.08, 1.5, 0.2, 0.2, WOODD, TIMBER);
        const wx = -dx || 1.6; if (w > 5) a.box(wx, 1.7, d / 2 - 0.1, 1.0, 1.2, 0.12, G_TALL, 0xf0d890, { glow: 0.5 });
        if (two) for (const x of (w > 8 ? [-w / 4, w / 4] : [0])) a.box(x, 4.6, d / 2 - 0.1, 1.0, 1.2, 0.12, G_TALL, GLASS);
        for (const s of [-1, 1]) if (d > 5) a.box(s * (w / 2 - 0.1), two ? 4.6 : 1.9, 0, 0.12, 1.2, 1.0, G_TALL, GLASS);
        a.box(-dx * 0.8, hh, -d / 4, 0.8, rh + 1.0, 0.8, WALL, STONE2, { roof: true });
    });
    count.houses = (count.houses || 0) + 1;
});
K.arch.slice(nArch).forEach(feat);
/* the insides */
for (const z of [-5.5, -2.5, 0.5, 3.5]) for (const x of [-4.2, 4.2]) K.put(CHAPEL, 'church_pew', x, z, { face: 0 });
K.put(CHAPEL, 'stone_altar', 0, -8, {}); K.put(CHAPEL, 'holy_carpet', 0, -1, { face: 0 }); K.put(CHAPEL, 'candle_ring', -2.6, -8.6, {}); K.put(CHAPEL, 'candle_ring', 2.6, -8.6, {}); K.put(CHAPEL, 'brazier', -6.5, 8, {}); K.put(CHAPEL, 'brazier', 6.5, 8, {});
K.put(SMITHY, 'brazier', -4.5, -4.5, {}); K.put(SMITHY, 'cauldron', -1.5, -5, {}); K.put(SMITHY, 'armour_stand', 4.5, -4.5, { face: 0 }); K.put(SMITHY, 'armour_stand', 4.5, -1, { face: 270 }); K.put(SMITHY, 'dojo_weapon_rack', 5.4, 3, { face: 270 });
K.put(SMITHY, 'sea_chest', -5, 3.5, { face: 90 }); K.put(SMITHY, 'psx_table_large_3', 0, 1.5, {}); K.put(SMITHY, 'psx_wooden_crate_2', -5, 0, {});
for (const x of [-5, 0, 5]) { K.put(INN, 'psx_table_large_2', x, 1.5, {}); K.put(INN, 'church_pew', x, 3.1, { face: 180 }); K.put(INN, 'church_pew', x, -0.1, { face: 0 }); }
K.put(INN, 'cauldron', -6.5, -5, {}); K.put(INN, 'stock_pots', -3.5, -5.6, { face: 0 }); K.put(INN, 'bread_rack', 7.2, -4, { face: 270 }); K.put(INN, 'brazier', 3, -5, {}); K.put(INN, 'psx_wooden_crate_2', 7, 5, {}); K.put(INN, 'meshy_burlap_sack', 5.6, 5.4, {});
K.put(SHOP, 'psx_table_large_3', 0, -1.5, {}); K.put(SHOP, 'xmas_gift', -3.4, -3.6, {}); K.put(SHOP, 'xmas_gift_2', -2.4, -3.8, { face: 30 }); K.put(SHOP, 'xmas_gift_3', 3.4, -3.6, {}); K.put(SHOP, 'xmas_gift_4', 3.2, 2.6, { face: 60 }); K.put(SHOP, 'cardboard_boxes', -3.4, 2.4, {});

/* ── THE NORTH POLE ── */
note('THE NORTH POLE: the pole, the village, the sleigh road');
{ const a = K.sheet(); many(6, i => a.cyl(0, i, 0, 0.3, 1.0, 'marble_light', i % 2 ? 0xf4f4f4 : 0xc83030, { seg: 10 })); a.cyl(0, 6, 0, 0.55, 0.7, 'marble_light', 0xc83030, { seg: 12 });
  feat({ k: 'arch', id: 'cam:pole', x: gc(POLE[0]), z: gc(POLE[1]), rot: 0, parts: a.P }); taken.add(POLE[0] + ':' + POLE[1]);
  for (const q of [[-1, 0], [1, 1], [0, -1]]) { props.push({ key: 'ocean_rock', x: r2(gc(POLE[0]) + q[0] * 1.5), z: r2(gc(POLE[1]) + q[1] * 1.5), face: Math.round(rnd() * 360) }); } }
put('P03-01', 'xmas_tree', 0, 0, { h: 4.6, floor: true }); dec('P03-01', 'xmas_gift', 1, 1); dec('P03-01', 'xmas_gift_2', -1, 1); dec('P03-01', 'xmas_gift_3', 1, -1); put('P03-01', 'park_bench', -2, -1, { face: 90 }); put('P03-01', 'campfire', 2, 2);
native('P03-01', 'santa clause', -1, 2, 180, sayOf(ONP, 'santa clause')); native('P03-00', 'gnome', 0, 1, 180, sayOf(ONP, 'gnome')); native('P01-00', 'yeti', 0, 0, 120, sayOf(ONP, 'yeti'));
put('P02-01', 'xmas_snowman', 0, 0); put('P02-01', 'xmas_tree_plain', 2, 1, { h: 4.2, floor: true }); put('P04-01', 'xmas_snowman_2', 0, 0); put('P04-01', 'xmas_tree_plain', -2, 1, { h: 4.2, floor: true });
put('P04-00', 'xmas_snowman_3', 0, 1); dec('P04-00', 'xmas_gift_4', 1, 0); put('P01-00', 'xmas_snowman', 2, 1); put('P01-01', 'campfire', 0, 0);
put('P03-02', 'sleigh', 0, 0, { face: 0 }); put('P05-02', 'signpost', 0, 0); put('P03-00', 'xmas_tree', 2, 2, { h: 3.6, floor: true });

/* ── THE LOOKING-GLASS GARDEN ── */
note('THE LOOKING-GLASS GARDEN: the hedges (drawn here: the solid is the plan\'s), the chessboard, the statues');
{ const used = new Uint8Array(W * W);   // the hedges: a box a run, a parts list a plot
  PLAN.plots.filter(p => p.district === 'L').forEach(p => { const a = K.sheet(), px = gx(p.x * N + N / 2), pz = gx(p.y * N + N / 2);
      for (let y = p.y * N; y < p.y * N + N; y++) for (let x = p.x * N; x < p.x * N + N; x++) { if (cell[y][x] !== 'h' || used[y * W + x]) continue;
          let w = 1; while (x + w < p.x * N + N && cell[y][x + w] === 'h' && !used[y * W + x + w]) w++;
          let h = 1; rows: while (y + h < p.y * N + N) { for (let i = 0; i < w; i++) if (cell[y + h][x + i] !== 'h' || used[(y + h) * W + x + i]) break rows; h++; }
          for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
          a.box(r2(gx(x) + w * C / 2 - px), 0, r2(gx(y) + h * C / 2 - pz), w * C, 2.6 + ((x + y) % 3) * 0.15, h * C, 'leaves_3', 0x6c9a58); count.hedges = (count.hedges || 0) + 1; }
      if (a.P.length) feat({ k: 'arch', id: 'cam:hedge:' + p.id, x: px, z: pz, rot: 0, parts: a.P }); }); }
{ const bx = gx(6), bz = gx(54);   // THE CHESSBOARD: the old garden's own board and its position, moved here
  feat({ k: 'board', x: bx, z: bz, n: 8, cell: 3.5, keys: ['marble_light', 'marble'], colors: [15920870, 2894392], clear: 0 });
  OG.t.forEach(t => { if (t.h) return; const o = Object.assign({}, t, { x: r2(t.x + bx), z: r2(t.z - 17.5 + bz) }); delete o.chessPos; feat(o); });
  for (let y = 50; y < 58; y++) for (let x = 2; x < 10; x++) taken.add(x + ':' + y); }
tree('P00-05', 'chess_king_dark', 3.4, -2, -2); tree('P00-05', 'chess_queen_dark', 3.1, 2, -2); tree('P00-05', 'chess_king', 3.4, -2, 2); tree('P00-05', 'chess_queen', 3.1, 2, 2);
put('P00-05', 'royal_throne', 0, -1, { face: 180 }); native('P00-05', 'ice queen', 0, 0, 180, sayOf(OG, 'ice queen')); put('P00-05', 'fountain', 0, 3);
many(6, i => dec('P01-02', 'flamingo', (i % 3) * 2 - 2, i < 3 ? -1 : 1)); many(3, i => dec('P01-02', 'garden_ring', i * 2 - 2, 0)); native('P01-02', 'gnome', 1, 2, 270, sayOf(OG, 'gnome'));
{ const q = put('P00-03', 'mushroom', 0, 0); props.push({ key: 'caterpillar', x: gc(q[0]), z: gc(q[1]), floor: true, y: 3.3, face: 180 }); } dec('P00-03', 'fae_toadstool', 2, 1); dec('P00-03', 'fae_toadstool', -2, 1);
dec('P01-03', 'pocket_watch', 0, 0); dec('P01-03', 'rabbit', 1, 0); put('P01-03', 'park_bench', -1, 1, { face: 90 });
{ const q = put('P01-04', 'tulip_table', 0, 0), x = gc(q[0]), z = gc(q[1]); for (const d of [[1.1, 0, 270], [-1.1, 0, 90], [0, 1.1, 0], [0, -1.1, 180]]) props.push({ key: 'teal_chair', x: r2(x + d[0]), z: r2(z + d[1]), face: d[2] });
  props.push({ key: 'teapot', x, z, floor: true, y: 0.74 }); props.push({ key: 'teacups', x: r2(x + 0.3), z: r2(z + 0.25), floor: true, y: 0.74 }); }
native('P01-04', 'fairy', 1, 1, 300, sayOf(OG, 'fairy')); native('P01-04', 'catgirl', -1, 1, 60, sayOf(OG, 'catgirl'));
put('P01-06', 'signpost', 0, 0); put('P00-02', 'iron_garden_bench', 0, 0, { face: 180 }); put('P00-06', 'angel_statue', 0, 0, { face: 90 }); put('P00-07', 'iron_garden_bench', 0, 0, { face: 0 });
tree('P01-07', 'tree_5', 6.5, 0, 3, 0.9);
{ const m = OG.d.find(d => d.id === 'astral'), q = near('P01-05', 0, -1);   // THE MIRROR: the old garden's frame with nothing in it, with its own words
  doors.push({ id: 'mirror', wall: 'free', x: gc(q[0]), z: gc(q[1]), face: 180, leaf: m.leaf, label: m.label, sub: m.sub, action: { room: 'site_prebuilt_lookingglass_waiting', at: 'garden' }, desc: m.desc }); }

/* ── THE FAIRY FOREST ── */
note('THE FAIRY FOREST: the pond, the spring, the knolls, the ring');
feat({ k: 'pool', x: gx(92.5), z: gx(41.5), r: 7.5, rz: 7, y: -0.3, depth: 0.9, key: 'water', bank: 1.4 });
feat({ k: 'deck', x0: gx(89) - 1.75, z0: gx(41.5), x1: gx(93), z1: gx(41.5), w: 10.5, y: 0.3 });
{ const q = near('P06-05', 0, 0); feat({ k: 'pool', x: gc(q[0]), z: gc(q[1]), r: 3.2, y: -0.25, depth: 0.7, key: 'water', bank: 0.8 }); dec('P06-05', 'fern', 2, 0); dec('P06-05', 'fern', -2, 1); }
const knoll = (id, dx, dy, r, h) => { const q = near(id, dx, dy); feat({ k: 'hill', x: gc(q[0]), z: gc(q[1]), r, h }); };
knoll('P06-02', 0, 0, 5, 1.4); knoll('P06-02', 3, 2, 3.6, 0.9); dec('P06-02', 'stump', -2, 1); knoll('P06-07', 0, 0, 5, 1.3); knoll('P06-07', -3, 1, 3.6, 0.9); dec('P06-07', 'fallen_log', 2, -1);
many(3, i => put('P06-03', 'fae_mushroom', i * 2 - 2, i % 2)); many(5, i => dec('P06-03', 'fae_toadstool', i - 2, 2 - (i % 3)));
dec('P07-03', 'butterfly', 0, 0, { floor: true, y: 1.2 }); dec('P07-03', 'blue_morpho', 1, 1, { floor: true, y: 1.5 }); dec('P07-03', 'swallowtail', -1, 1, { floor: true, y: 1.1 }); dec('P07-03', 'monarch', 1, -1, { floor: true, y: 1.4 });
{ const c = centre('P06-04'), x = gc(c[0]), z = gc(c[1]); many(12, i => { const q = i * Math.PI / 6; props.push({ key: 'fae_toadstool', x: r2(x + Math.cos(q) * 5.6), z: r2(z + Math.sin(q) * 5.6), face: i * 30 }); });
  taken.add(c[0] + ':' + c[1]); props.push({ key: 'instrument_harp', x: r2(x + 0.6), z: r2(z - 0.5), face: 200 }); native('P06-04', 'fairy', 1, 1, 220); }
put('P07-05', 'signpost', 0, 0); put('P07-04', 'signpost', 0, 0);
put('P06-06', 'mushroom', 0, 0); put('P06-06', 'mushroom2', 2, 1); many(4, i => dec('P06-06', 'fern', i - 1, -1)); many(3, i => dec('P06-06', 'luna_moth', i - 1, 1, { floor: true, y: 1.3 }));
dec('P07-06', 'rabbit', 0, 0); dec('P07-06', 'rabbit', 1, 1); dec('P07-06', 'stump', -1, 0); dec('P07-06', 'fallen_log', 0, -1); dec('P07-06', 'ladybug', 1, -1); dec('P07-06', 'grasshopper', -1, 1); dec('P07-06', 'instrument_whistle', 0, 1);

/* ── THE TOWN ── */
put('P04-06', 'ancient_well', 0, 0); put('P04-06', 'camping_tent', -2, -2, { face: 180 }); put('P04-06', 'camping_tent', 2, -2, { face: 180 }); put('P04-06', 'camping_tent', -2, 2, { face: 0 }); put('P04-06', 'camping_tent', 2, 2, { face: 0 });
put('P04-06', 'stocks', 0, 3, { face: 0 }); dec('P04-06', 'meshy_burlap_sack', -3, 0); dec('P04-06', 'meshy_burlap_sack', 3, 0); put('P04-06', 'psx_wooden_crate_2', 3, -3); put('P04-06', 'bread_rack', -3, -3, { face: 180 });
many(5, i => dec('P02-06', 'cross', i - 2, -2 + (i % 2))); put('P05-06', 'armour_stand', 0, 0, { face: 90 }); put('P05-06', 'brazier', 1, 1);
put('P05-07', 'cow', 0, 0, { face: 60 }); many(3, i => dec('P05-07', 'chicken', i - 1, 1)); dec('P05-07', 'decor_sheep', 2, -1); dec('P05-07', 'decor_sheep', -2, -1);
dec('P02-07', 'chicken', 0, 0); put('P02-07', 'psx_wooden_crate_3', 1, 1); put('P04-07', 'horse_brown', 0, 0, { face: 90 }); dec('P04-07', 'meshy_burlap_sack', 1, 1);
props.push({ key: 'brazier', x: gx(41) - 5.25, z: gc(94) }, { key: 'brazier', x: gx(41) + 5.25, z: gc(94) }, { key: 'signpost', x: gx(41) + 5.25, z: gc(91) });
npc.push({ x: gx(41) - 5.25, z: gc(92), face: 90, race: 'knight' }, { x: gx(41) + 5.25, z: gc(92), face: 270, race: 'knight' });

/* ── checks: the catalogue, the units, every plot walked to from the portcullis ── */
check(props, npc);
{ const seen = new Uint8Array(W * W), st = [[41, 93]]; if (!open(41, 93)) throw new Error('the portcullis square is not open'); seen[93 * W + 41] = 1;
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (open(X, Y) && !seen[Y * W + X]) { seen[Y * W + X] = 1; st.push([X, Y]); } } }
  const cold = PLAN.plots.filter(p => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.y * N + ly) * W + p.x * N + lx]) return false; return true; }).map(p => p.id);
  if (cold.length) throw new Error('plots not reached: ' + cold.join(' '));
  let op = 0, un = 0; for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (open(x, y)) { op++; if (!seen[y * W + x]) un++; } count.openSquares = op; count.unreachedSquares = un; }
Object.assign(count, { features: F.length, props: props.length, doors: doors.length, natives: npc.length });

/* ── the room ── */
const SNOW = ['xmas_snow_pine', 'xmas_snow_pine_2', 'xmas_snow_pine_3'], FAE = ['fae_cap', 'tree_3', 'fae_cap_2', 'tree', 'tree_2'];
const zone = (x0, y0, x1, y1, o) => Object.assign({ x0: gx(x0), z0: gx(y0), x1: gx(x1), z1: gx(y1) }, o);
const ZONES = [zone(72, 36, 84, 48, { kinds: FAE }), zone(72, 72, 84, 84, { kinds: FAE }), zone(0, 0, W, 24, { kinds: SNOW, treeH: [5.5, 8] }), zone(24, 24, 72, 36, { kinds: SNOW, treeH: [5.5, 8] }), zone(0, 24, 24, W, { none: true })];
const LINES = OLD.l.concat(ONP.l, OG.l), BAYX = gx(41), M = [];
M.push("        /* CAMELOT-KINGDOM-BEGIN — CAMELOT KINGDOM ON PLOTS (2026-11-15): written by `node bake-camelot.js` from docs/areas/camelot/layout.json. Never hand-edit between the markers; edit the tool or the layout and rerun. */");
M.push("        site_prebuilt_camelot_kingdom: {");
M.push("            label: 'CAMELOT KINGDOM',");
M.push("            sub: 'THE CASTLE · THE TOWN · THE FAIRY FOREST · THE LOOKING-GLASS GARDEN · THE NORTH POLE',");
M.push("            kind: 'box', site: 'prebuilt_camelot', part: 'kingdom',");
M.push("            shell: hqCastleShell({ w: " + (2 * HALF) + ", d: " + (2 * HALF) + ", plate: { x: " + BAYX + ", z: " + gc(93) + ", y: 4.4 } }),");
M.push("            parti: 'A castle on an island in its own moat in the middle of its kingdom: the town at its gate, a forest on one hand and a hedge garden on the other, and past a belt of snowy pines the other kingdom, the one at the Pole.',");
M.push("            typology: 'grid',");
M.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + G + ", names: " + J(PLAN.plots.map(p => [p.id, p.name, p.district, p.level])) + " },");
M.push("            terrain: {");
M.push("                res: 1.75, floor: 'grass_2', cliff: 'castle_wall', path: 'cobblestone',   // half a square a node: the room is 336 m, and the castle's rows are dear a node (0.875 took four times as long to stand up)");
M.push("                noise: { amp: 0, scale: 8 },");
M.push("                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gx(0) + ", nx: " + W + ", nz: " + W + ", d: '" + slope.toString('base64') + "' } },");
M.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gc(0) + ", z0: " + gc(0) + ", nx: " + W + ", nz: " + W + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
M.push("                gen: { kind: 'plan', look: 'trees', seed: 64, rim: 0, forceGrow: 0, treeGap: 2.6, treeIn: 0.9, spacing: 3.5, depth: 5.25, maxTrees: 3200, treeH: [5.5, 8.5], kinds: ['tree', 'tree_2', 'tree_3', 'tree', 'tree_5', 'tree_2'], zones: " + J(ZONES) + " },");
M.push("                features: [");
F.forEach(f => M.push("                    " + f));
M.push("                ],");
M.push("                marks: " + J(K.marks) + ",");
M.push("            },");
M.push("            doors: [");
doors.forEach(d => M.push("                " + J(d) + ","));
M.push("            ],");
M.push("            counters: [],");
M.push("            props: [");
for (let i = 0; i < props.length; i += 4) M.push("                " + props.slice(i, i + 4).map(J).join(", ") + ",");
M.push("            ],");
M.push("            agents: [],");
M.push("            npcSpots: " + J(npc) + ",");
M.push("            onlineSpots: [],");
M.push("            lines: " + J(LINES) + ",");
M.push("            spawn: { x: " + BAYX + ", z: " + gc(93) + ", face: 0 },");
M.push("        },");
M.push("        /* CAMELOT-KINGDOM-END */");
const kingdomBlock = M.join('\n') + '\n';
console.log('kingdom ' + JSON.stringify(count));
/* the ends data.js carries by hand (DOOR_HQ.links, siteRooms.entry): printed so a moved path is seen */
const ENDS = { bay: { wall: 's', x: BAYX }, woods_camelot: { wall: 'e', z: WAYS.trail }, northpole_camelot: { wall: 'n', x: WAYS.sleigh }, haunted_camelot: { wall: 'free', x: gc(27), z: gc(27), face: 90 }, well_camelot: { wall: 'free', x: -5.25, z: r2(1.75 + gx(CY0) + HD), face: 180 } };
console.log('ends ' + JSON.stringify(ENDS));
if (DRY) process.exit(0);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
/* the castle's own first room is DELETED (2026-11-15, mondo: "just delete the old fucking camelot"): only the kingdom is written */
src = splice(src, kingdomBlock, 'CAMELOT-KINGDOM', '        site_prebuilt_camelot_ward: {');
fs.writeFileSync(file, src);
console.log('data.js: site_prebuilt_camelot_kingdom (' + kingdomBlock.length + ' bytes) written');
