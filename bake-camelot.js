#!/usr/bin/env node
/* bake-camelot.js — CAMELOT KINGDOM ON PLOTS (2026-11-15): writes the room `site_prebuilt_camelot_kingdom` into data.js between
   CAMELOT-KINGDOM-BEGIN / END from docs/areas/camelot/layout.json. `--dry-run` prints the counts. Never hand-edit between the markers:
   edit this tool or the layout and rerun.
   THE CASTLE is redesign 2 (mondo's OK on docs/plans/camelot/camelot_castle_redesign_2.png): one symmetrical palace on a two-step hill in
   the middle of the village (buildCastle below). Round it: the village, the town wall, the moat, the woods (plan 3).
   Collision and the walked parts are terrain rows (plateau, ramp, rail, hqCurtainWall, hqCastleTower, hqRoundBlock, hqCastleCrown); a
   building is a `texbuilding` row drawn by a `k: 'arch'` parts list.
   Notes: docs/notes/areas-complexes.md "CAMELOT CASTLE, REDESIGN 2" and the "CAMELOT KINGDOM" sections. Plan pictures: docs/plans/camelot/. */
'use strict';
const fs = require('fs'), path = require('path');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const C = 3.5, KHALF = 168;   // a square, half the kingdom room (96 squares)
const r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData(), vm = require('vm');
const OLD = JSON.parse(vm.runInContext('JSON.stringify({ n: DOOR_HQ.rooms.site_prebuilt_camelot_ward.npcSpots, l: DOOR_HQ.rooms.site_prebuilt_camelot_ward.lines })', D));
const say = race => (OLD.n.find(n => n.race === race) || {}).say || [];
const WALL = 'castle_wall';
/* THE CASTLE, REDESIGN 2 (2026-11-15, mondo on the built plan 3: "this whole section i outlined needs to be the castle, like an epic fantasy
   dragon quest or final fantasy or medieval castle. Disney world cinderella's palace. Hogwarts ... the way it is now is stupid because it like
   a walled off region inside a walled off region. the castle should be in the center of the map and relatively symmetrical. higher elevation
   compared to the village"; his OK on docs/plans/camelot/camelot_castle_redesign_2.png, the east lower-court building = THE ARMOURY).
   No inner curtain wall. ONE palace on a two-step stone hill (`plateau` rows: the lower court +3.5 m, the upper court +7 m): THE KEEP with the
   Throne Hall in it, two mirrored wings (Kitchen west, Barracks east), eight round towers under blue cones, the Great Spire on the Keep's roof;
   THE GRAND STAIR up from the Market, a stair from the lower court to the upper, a back stair down to the north road; the Stables and the
   Armoury as a mirrored pair in the lower court. The squares of every piece are docs/areas/camelot/layout.json `castle` (kingdom squares);
   west and east are mirror images about the room's middle line (square 48). The hill is `plateau` + `ramp` rows, never `slope.cells`
   (a sloped room makes every hqCastleTower deck NaN). */
function buildCastle() {
const g = k => r2(-KHALF + k * C), X = s => g(s + 24), Z = s => g(s + 30);   // X / Z: the old castle squares (the village's buildings are still placed with them)
const F = [], props = [], doors = [], npc = [], arch = [], marks = [];
const feat = o => F.push(J(o) + ','), raw = s => F.push(s + ','), note = s => F.push('/* ' + s + ' */');
const Q = PLAN.castle, T1 = 3.5, T2 = 7, MX = g(48);
const mid = q => [r2((g(q[0]) + g(q[2])) / 2), r2((g(q[1]) + g(q[3])) / 2)];

/* ── THE HILL: two stone steps, the three stairs, the parapets on every edge ── */
note('THE HILL: the lower court (+3.5 m), the upper court (+7 m); THE GRAND STAIR, the court stair, the back stair; the parapets');
const tier = (q, h) => { const m = mid(q); feat({ k: 'plateau', x: m[0], z: m[1], w: (q[2] - q[0]) * C, d: (q[3] - q[1]) * C, h, edge: 0.2 }); };
tier(Q.hill, T1); tier(Q.upper, T2);
/* a flight runs north or south along the middle line; its head goes 0.4 m into the step it climbs so no seam is left at the top */
const flight = (q, up, h0, h1) => { const x = r2((g(q[0]) + g(q[2])) / 2), zf = up === 'N' ? g(q[3]) : g(q[1]), zh = up === 'N' ? g(q[1]) - 0.4 : g(q[3]) + 0.4;
    feat({ k: 'ramp', x0: x, z0: zf, x1: x, z1: r2(zh), w: (q[2] - q[0]) * C, h0, h1, stairs: true, model: 'stone', edge: 0.2 }); };
flight(Q.grandStair, 'N', 0, T1); flight(Q.upperStair, 'N', T1, T2); flight(Q.backStair, 'S', 0, T2);
const rail = (x0, z0, x1, z1, y) => feat({ k: 'rail', x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), y, model: 'parapet' });
/* a step's four edges, `gapN` / `gapS` = the squares a stair leaves open on its north / south edge */
function parapets(q, y, gapN, gapS) { const x0 = g(q[0]) + 0.35, x1 = g(q[2]) - 0.35, z0 = g(q[1]) + 0.35, z1 = g(q[3]) - 0.35;
    rail(x0, z0, x0, z1, y); rail(x1, z0, x1, z1, y);
    rail(x0, z0, g(gapN[0]) - 0.3, z0, y); rail(g(gapN[1]) + 0.3, z0, x1, z0, y); rail(x0, z1, g(gapS[0]) - 0.3, z1, y); rail(g(gapS[1]) + 0.3, z1, x1, z1, y); }
parapets(Q.hill, T1, [Q.backStair[0], Q.backStair[2]], [Q.grandStair[0], Q.grandStair[2]]);
parapets(Q.upper, T2, [Q.backStair[0], Q.backStair[2]], [Q.upperStair[0], Q.upperStair[2]]);

/* ── THE BUILDINGS: a hollow texbuilding each (the walls you bump, the doorway, the inside, the roof slab; its own outside switched off)
   and its look as an `arch` parts list. Frame of a parts list: the building's middle, x along the front, +z out of the front, y up from
   the ground under it (a texbuilding and an arch row with no `y` both stand on their own ground: the step of the hill they are on). ── */
const U = n => 'urban:' + n, G_TALL = U('GlassWindowTall1a'), SLATE = U('MetalRoofTiles1a'), WOODK = 'wood_planks', WOODD = 'wood';
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
            add({ s: 'box', p: [s * (w / 2 - 0.25), y, -d / 2 + 0.55], size: [0.5, 1.0, 1.1], n: nz, step: [0, 0, d / nz] }, key, tint); } },
        /* a round tower: the shaft from y0, lit slits round it, a corbelled gallery under the eaves, the blue cone, a gilt finial, the flag */
        tower(x, z, r, y0, h, ch, tint) { const top = y0 + h;
            add({ s: 'cyl', p: [x, y0, z], r, h, seg: 16 }, WALL, tint);
            add({ s: 'cyl', p: [x, top - 1.8, z], r: r + 0.5, h: 1.8, seg: 16 }, WALL, STONE3);
            add({ s: 'cyl', p: [x, top - 2.3, z], r: r + 0.25, h: 0.5, seg: 16 }, WALL, STONE2);
            for (let y = y0 + 6; y < top - 5; y += 7) add({ s: 'box', p: [x, y, z], size: [0.6, 2.4, 0.12], ring: { n: 4, r: r + 0.03, a0: 45 }, glow: 0.6 }, G_TALL, 0xf0d890);
            add({ s: 'cyl', p: [x, top, z], r: r + 1.0, h: ch, seg: 16, r2: 0, roof: true }, SLATE, BLUE);
            add({ s: 'cyl', p: [x, top + ch - 0.5, z], r: 0.3, h: 1.3, seg: 8, r2: 0, roof: true }, null, GOLD);
            add({ s: 'cyl', p: [x, top + ch, z], r: 0.09, h: 4.2, seg: 6, roof: true }, null, 0x403830);
            add({ s: 'box', p: [x + 1.25, top + ch + 2.6, z], size: [2.5, 1.4, 0.06], ds: true, roof: true }, null, BANNER); } };
}
function texbDoor(w, door) { const L = Math.max(2, w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (door >= 1) col = Math.min(cols - 1, Math.round(door) - 1); return { lx: -L / 2 + (col + 0.5) * cw, cw }; }
/* a building on squares sx0..sx1 x sy0..sy1 (the OLD castle squares: kingdom squares less (24, 30)), its front on `side`; → its frame (to place furniture: at(lx, lz) = world [x, z]) */
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
const kq = (id, q, side, h, o, parts) => building(id, q[0] - 24, q[1] - 30, q[2] - 24, q[3] - 30, side, h, o, parts);
/* what a drawn tower or drum weighs: a solid square inside its round (a texbuilding with no outside and no inside) */
const solid = (id, p, side, storeys) => feat({ k: 'texbuilding', id: 'cam:' + id, seed: 1, x: p[0], z: p[1], w: side, d: side, rot: 0, storeys, h: storeys * 3.5, skin: false, hollow: false });
const STONE = 0xc4c0b8, STONE2 = 0xaeaaa6, STONE3 = 0xd8d2c6, PALE = 0xdcd6ca, BLUE = 0x4a5c8c, GLASS = 0xa8c4ec, WARM = 0xf0d890, BANNER = 0xb02c36, GOLD = 0xd8b050, TIMBER = 0x4a3626;
note('THE PALACE: the Keep (the Throne Hall), the two wings, the eight towers, the Great Spire');
/* THE KEEP — the tall middle block: the Throne Hall is its ground floor (14 m to its ceiling), 28 m of pale stone to the battlements, a
   blue hipped roof, a tower on each corner, the portal between two turrets under the great window, THE GREAT SPIRE out of the roof */
const KH = 28;
/* (ONE STACKED BUILDING, 2026-11-15: the palace is walked into in its OWN room, site_prebuilt_camelot_palace, bake-camelot-castle.js. Here the
   Keep and the wings are solid: their doors are this room's doors, and the wicket in each is shut by a drawn leaf behind the door's own.) */
const KEEP = kq('keep', Q.keep, 'S', 14, { hollow: false, leaf: undefined, leafDouble: undefined, keyIn: undefined, floorIn: undefined }, (a, w, d, door) => {
    a.box(door.lx, 0, d / 2 + 0.02, door.cw, 2.2, 0.06, WOODK, TIMBER);
    a.shell(w, 14, d, WALL, PALE, door); a.box(0, 14, 0, w + 0.1, KH - 14, d + 0.1, WALL, PALE, { top: false, under: true });
    a.box(0, 0, 0, w + 0.8, 1.2, d + 0.8, WALL, STONE2, { faces: 'blr' });
    for (const y of [13.6, 20.8]) a.box(0, y, 0, w + 0.6, 0.5, d + 0.6, WALL, STONE3, { under: true });
    a.box(0, KH - 0.7, 0, w + 1.1, 0.7, d + 1.1, WALL, STONE3, { under: true }); a.box(0, KH, 0, w + 0.6, 0.3, d + 0.6, WALL, 0x8c8a88, { roof: true }); a.crown(w + 0.6, d + 0.6, KH + 0.3, WALL, PALE);
    a.roof('hip', 0, KH + 0.3, 0, w - 3, 11, d - 3, SLATE, BLUE);
    /* the lights: three rows on the front and the back, the sides where the wings leave the wall free */
    const light = (x, y, z, h, side) => { if (side) { a.box(x, y, z, 0.12, h, 1.5, G_TALL, WARM, { glow: 0.55 }); a.box(x, y + h, z, 0.4, 0.4, 2.0, WALL, STONE3); } else { a.box(x, y, z, 1.5, h, 0.12, G_TALL, WARM, { glow: 0.55 }); a.box(x, y + h, z, 2.0, 0.4, 0.4, WALL, STONE3); } };
    for (const [y, h] of [[3, 6], [15.2, 5], [22.4, 3.6]]) { for (const x of [12, 18]) for (const s of [-1, 1]) light(s * x, y, d / 2 + 0.08, h);
        for (const x of [-18, -12, -6, 0, 6, 12, 18]) light(x, y, -d / 2 - 0.08, h);
        for (const s of [-1, 1]) for (const z of (y > 20 ? [-17.5, -10.5, -3.5, 3.5, 10.5, 17.5] : [-17.5, 17.5])) light(s * (w / 2 + 0.08), y, z, h, true); }
    for (const x of [-21.5, -15, 15, 21.5]) a.box(x, 0, d / 2 + 0.35, 1.3, KH - 1.2, 0.7, WALL, STONE3);                    // the front's buttresses
    for (const x of [-21, -15, -9, -3, 3, 9, 15, 21]) a.box(x, 0, -d / 2 - 0.35, 1.2, KH - 1.2, 0.7, WALL, STONE3);
    for (const s of [-1, 1]) { a.box(s * 15, 8.5, d / 2 + 0.74, 1.5, 6.5, 0.08, null, BANNER); a.box(s * 15, 12.4, d / 2 + 0.79, 0.7, 0.7, 0.05, null, GOLD); }
    /* the portal: two turrets, the gatehouse block over the way in, the great doors (the doorway itself is the wicket in them), the great window */
    for (const s of [-1, 1]) a.tower(s * 8, d / 2 + 1.5, 2.2, 0, 22, 8, STONE3);
    for (const s of [-1, 1]) a.box(s * 5.0, 0, d / 2 + 1.3, 1.6, 6.2, 2.6, WALL, STONE3);
    a.box(0, 6.2, d / 2 + 1.3, 11.6, 7.2, 2.6, WALL, STONE3, { under: true }); a.crown(11.6, 2.6, 13.4, WALL, STONE3);
    a.P.slice(-4).forEach(p => { p.p = [p.p[0], p.p[1], r2(p.p[2] + d / 2 + 1.3)]; });                                         // the block's own battlements stand on the block
    a.box(door.lx, 2.2, d / 2 + 0.07, door.cw + 0.1, 3.6, 0.1, WOODK, TIMBER); for (const s of [-1, 1]) a.box(door.lx + s * (door.cw / 2 + 0.95), 0, d / 2 + 0.07, 1.9, 5.8, 0.1, WOODK, TIMBER);
    for (const s of [-1, 1]) for (const y of [1.2, 3.0, 4.8]) a.box(door.lx + s * (door.cw / 2 + 0.95), y, d / 2 + 0.13, 1.9, 0.14, 0.04, null, 0x2a2c30);
    a.box(0, 15, d / 2 + 0.09, 5.4, 7, 0.12, G_TALL, 0xf4dc98, { glow: 0.75 }); a.box(0, 22, d / 2 + 0.09, 3.8, 1.3, 0.12, G_TALL, 0xf4dc98, { glow: 0.75 }); a.box(0, 23.3, d / 2 + 0.09, 2.0, 0.9, 0.12, G_TALL, 0xf4dc98, { glow: 0.75 });
    a.box(0, 14.4, d / 2 + 0.3, 6.6, 0.6, 0.6, WALL, STONE3); for (const s of [-1, 1]) a.box(s * 3.0, 15, d / 2 + 0.25, 0.5, 7.2, 0.5, WALL, STONE3); for (const x of [-0.9, 0.9]) a.box(x, 15, d / 2 + 0.2, 0.16, 7, 0.16, WALL, STONE2);
    /* the four corner towers */
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.tower(sx * w / 2, sz * d / 2, 3.4, 0, 34, 12, PALE);
    /* THE GREAT SPIRE: a round tower out of the roof's middle, four bartizans on it, the tallest cone in the kingdom */
    a.tower(0, 0, 5.5, KH + 2, 22, 20, PALE);
    a.cyl(0, KH + 14, 0, 1.3, 10, WALL, PALE, { seg: 10, ring: { n: 4, r: 5.7, a0: 45 }, roof: true }); a.cyl(0, KH + 24, 0, 1.75, 5.5, SLATE, BLUE, { seg: 10, r2: 0, roof: true, ring: { n: 4, r: 5.7, a0: 45 } });
    a.box(0, KH + 12, 0, 1.4, 3.4, 0.12, G_TALL, 0xf4dc98, { glow: 0.8, ring: { n: 4, r: 5.53, a0: 0 }, roof: true });
});
/* A WING — two tall storeys of hall under a steep blue roof, a tower on each outer corner (the rear one the taller, so all eight show from
   the Market); `out` = which side is its free end (-1 west, 1 east), so the two are mirror images */
const wing = (id, q, out, o) => kq(id, q, 'S', 7, o, (a, w, d, door) => {
    a.box(door.lx, 0, d / 2 + 0.02, door.cw, 2.2, 0.06, WOODK, TIMBER);
    a.shell(w, 7, d, WALL, STONE, door); a.box(0, 7, 0, w + 0.1, 7, d + 0.1, WALL, STONE, { top: false, under: true });
    a.box(0, 0, 0, w + 0.7, 1.1, d + 0.7, WALL, STONE2, { faces: 'blr' }); a.box(0, 6.7, 0, w + 0.5, 0.45, d + 0.5, WALL, STONE3, { under: true });
    a.box(0, 13.4, 0, w + 0.9, 0.6, d + 0.9, WALL, STONE3, { under: true }); a.box(0, 14, 0, w + 0.5, 0.3, d + 0.5, WALL, 0x8c8a88, { roof: true }); a.crown(w + 0.5, d + 0.5, 14.3, WALL, STONE);
    a.roof('hip', 0, 14.3, 0, w - 2.4, 9, d - 2.4, SLATE, BLUE);
    for (const [y, h] of [[2.4, 3.4], [8.6, 3.6]]) { for (const x of [-9.8, -4.9, 4.9, 9.8]) { a.box(x, y, d / 2 + 0.08, 1.4, h, 0.12, G_TALL, WARM, { glow: 0.5 }); a.box(x, y + h, d / 2 + 0.2, 1.9, 0.4, 0.4, WALL, STONE3); a.box(x, y, -d / 2 - 0.08, 1.4, h, 0.12, G_TALL, WARM, { glow: 0.5 }); }
        for (const z of [-7, 0, 7]) a.box(out * (w / 2 + 0.08), y, z, 0.12, h, 1.4, G_TALL, WARM, { glow: 0.5 }); }
    for (const x of [-12.2, -7.3, 7.3, 12.2]) a.box(x, 0, d / 2 + 0.3, 1.0, 13.2, 0.6, WALL, STONE2);
    a.box(door.lx, 2.3, d / 2 + 0.5, 4.6, 0.5, 1.2, WALL, STONE3, { under: true }); for (const s of [-1, 1]) a.box(door.lx + s * 2.0, 0, d / 2 + 0.6, 0.6, 2.3, 0.6, WALL, STONE3);
    for (const s of [-1, 1]) a.box(door.lx + s * 3.6, 3.2, d / 2 + 0.1, 1.2, 4.2, 0.08, null, BANNER);
    a.box(-out * (w / 2 - 3), 14.3, -d / 2 + 3, 2.2, 10.5, 2.2, WALL, STONE2, { roof: true }); a.box(-out * (w / 2 - 3), 24.8, -d / 2 + 3, 2.7, 0.5, 2.7, WALL, STONE3, { roof: true });
    a.tower(out * w / 2, d / 2, 4.2, 0, 24, 11, STONE); a.tower(out * w / 2, -d / 2, 3.6, 0, 30, 10, STONE);
});
const WEST = wing('west_wing', Q.westWing, -1, { hollow: false, leaf: undefined, leafDouble: undefined, keyIn: undefined, floorIn: undefined }), EAST = wing('east_wing', Q.eastWing, 1, { hollow: false, leaf: undefined, leafDouble: undefined, keyIn: undefined, floorIn: undefined });
/* what the towers weigh */
[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((c, i) => solid('keep_tower_' + i, KEEP.at(c[0] * KEEP.fw / 2, c[1] * KEEP.fd / 2), 4.4, 3));
[-1, 1].forEach((s, i) => solid('door_turret_' + i, KEEP.at(s * 8, KEEP.fd / 2 + 1.5), 2.8, 3));
[[WEST, -1], [EAST, 1]].forEach(([B, out], i) => { solid('wing_tower_f' + i, B.at(out * B.fw / 2, B.fd / 2), 5.4, 3); solid('wing_tower_r' + i, B.at(out * B.fw / 2, -B.fd / 2), 4.6, 3); });

note('THE LOWER COURT: the Stables (west) and the Armoury (east), a mirrored pair');
/* the pair: a stone block under a blue gable, the same on both sides; the Stables keep their stable door and their hay loft's hatch, the Armoury its shields */
const lodge = (id, q, side, o, extra) => kq(id, q, side, 5.25, o, (a, w, d, door) => {
    a.shell(w, 5.25, d, WALL, STONE, door); a.box(0, 0, 0, w + 0.5, 1.0, d + 0.5, WALL, STONE2, { faces: 'blr' });
    a.roof('gable', 0, 5.25, 0, d + 1.6, 4.2, w + 1.6, SLATE, BLUE, { ry: 90, keyEnd: WALL, tintEnd: STONE });
    a.box(0, 4.95, 0, w + 0.7, 0.35, d + 0.7, WALL, STONE3, { under: true, top: false });
    for (const s of [-1, 1]) { a.box(s * (w / 2 - 0.5), 0, d / 2 + 0.3, 1.0, 4.9, 0.6, WALL, STONE2); a.box(s * 4.2, 1.6, d / 2 + 0.08, 1.3, 2.0, 0.12, G_TALL, WARM, { glow: 0.45 }); }
    a.box(door.lx, 2.3, d / 2 + 0.45, 3.6, 0.45, 1.0, WALL, STONE3, { under: true });
    extra(a, w, d, door);
});
const STABLES = lodge('stables', Q.stables, 'E', { leaf: 'leaf_stable', leafDouble: false, keyIn: WOODK, floorIn: 'dirt_2' }, (a, w, d, door) => {
    a.box(door.lx, 5.6, d / 2 + 0.1, 1.6, 1.8, 0.1, WOODK, TIMBER); a.box(door.lx, 7.6, d / 2 + 0.7, 0.2, 0.2, 1.4, WOODD, TIMBER); });
const ARMOURY = lodge('armoury', Q.armoury, 'W', { leafDouble: false }, (a, w, d, door) => {
    [[-2.6, 0x2c4a9a], [2.6, BANNER]].forEach(([x, c]) => { a.box(door.lx + x, 2.9, d / 2 + 0.1, 1.0, 1.2, 0.1, null, c); a.box(door.lx + x, 3.3, d / 2 + 0.16, 0.34, 0.34, 0.05, null, GOLD); });
    a.box(door.lx, 5.7, d / 2 + 0.1, 0.16, 1.9, 0.06, null, 0xb8bcc4); a.box(door.lx, 6.2, d / 2 + 0.1, 0.9, 0.14, 0.06, null, 0xb8bcc4); });

/* ── THE HILL'S OWN LOOK (a row with its foot on the village's ground): the drums on its four corners and beside the Grand Stair, the
   stair's cheek walls, the tilt's rails, the gate piers of the three stairs ── */
{ const a = sheet(), cx = MX, cz = g(45.5), L = (x, z) => [r2(x - cx), r2(z - cz)];
  const drum = (id, x, z, r, h, side) => { const p = L(x, z); a.cyl(p[0], 0, p[1], r, h, WALL, STONE2, { seg: 18 }); a.cyl(p[0], h - 0.5, p[1], r + 0.3, 0.5, WALL, STONE3, { seg: 18 });
      a.box(p[0], h, p[1], 0.9, 0.9, 0.45, WALL, STONE2, { ring: { n: Math.round(r * 2.6), r: r - 0.1 } }); solid(id, [r2(x), r2(z)], side, 1); };
  [[Q.hill[0], Q.hill[1]], [Q.hill[2], Q.hill[1]], [Q.hill[0], Q.hill[3]], [Q.hill[2], Q.hill[3]]].forEach((c, i) => drum('hill_drum_' + i, g(c[0]), g(c[1]), 4.2, T1 + 0.1, 5.6));
  const sx0 = g(Q.grandStair[0]), sx1 = g(Q.grandStair[2]), sz = g(Q.hill[3]);
  [sx0 - 3.4, sx1 + 3.4].forEach((x, i) => { drum('stair_drum_' + i, x, sz, 3.2, T1 + 0.1, 4.2); const p = L(x, sz);
      a.cyl(p[0], T1 + 0.1, p[1], 0.1, 6, null, 0x403830, { seg: 6 }); a.box(p[0], T1 + 1.4, p[1] + 0.2, 1.3, 4.2, 0.06, null, BANNER, { ds: true }); });
  const NG = Q.grandStair[3] - Q.grandStair[1], NU = Q.upperStair[3] - Q.upperStair[1];
  for (const x of [sx0 - 0.1, sx1 + 0.1]) { const p = L(x, sz); for (let i = 0; i < NG; i++) a.box(p[0], 0, p[1] + 1.75 + i * 3.5, 0.9, r2(T1 * (NG - i - 0.5) / NG + 1.0), 3.5, WALL, STONE2); }   // the Grand Stair's cheek walls, stepping down with it
  { const ux0 = g(Q.upperStair[0]), ux1 = g(Q.upperStair[2]), uz = g(Q.upper[3]);
    for (const x of [ux0 - 0.1, ux1 + 0.1]) { const p = L(x, uz); for (let i = 0; i < NU; i++) a.box(p[0], T1, p[1] + 1.75 + i * 3.5, 0.8, r2((T2 - T1) * (NU - i - 0.5) / NU + 1.0), 3.5, WALL, STONE2);
        const q = L(x, uz + NU * 3.5 + 0.4); a.box(q[0], T1, q[1], 1.2, 2.6, 1.2, WALL, STONE3); a.cyl(q[0], T1 + 2.6, q[1], 0.5, 0.5, null, GOLD, { seg: 8, r2: 0.2 }); } }
  /* THE LISTS: a tilt rail either side of the middle line (red and white, the lances' side), on sand */
  for (const s of [-1, 1]) { const p = L(MX + s * 24.5, g(55)); 
      a.box(p[0] - 9.6, T1 + 0.35, p[1], 1.75, 0.5, 0.05, null, BANNER, { n: 6, step: [3.5, 0, 0], ds: true });
      feat({ k: 'rail', x0: r2(MX + s * 24.5 - 10.5), z0: g(55), x1: r2(MX + s * 24.5 + 10.5), z1: g(55), y: T1 });
      marks.push({ k: 'rect', x: r2(MX + s * 24.5), z: g(55), w: 24.5, d: 7, color: 0xc8b088, a: 0.85 }); }
  arch.push({ k: 'arch', id: 'cam:hill', x: cx, z: cz, y: 0, rot: 0, parts: a.P }); }
arch.forEach(feat);

/* ── THE INSIDES ── */
/* (the Throne Hall, the Kitchen and the Barracks are furnished in the palace's own room) */
/* the Stables */
for (const [k, x] of [['horse', -4.2], ['horse_brown', 0], ['horse_black', 4.2]]) put(STABLES, k, x, -8.5, { face: 180 }); put(STABLES, 'horse_brown', -4.2, -1, { face: 90 }); put(STABLES, 'meshy_burlap_sack', 5, 6, {}); put(STABLES, 'meshy_burlap_sack', 5.6, 8, { face: 70 }); put(STABLES, 'psx_wooden_crate_3', -5, 8, {});
/* the Armoury: harness on stands down both walls, the racks at the back, the quartermaster's table */
for (const z of [-9, -5, -1, 3]) for (const s of [-1, 1]) put(ARMOURY, 'armour_stand', s * 5.4, z, { face: s < 0 ? 90 : 270 });
put(ARMOURY, 'dojo_weapon_rack', -3, -11.4, { face: 180 }); put(ARMOURY, 'dojo_weapon_rack', 3, -11.4, { face: 180 }); put(ARMOURY, 'map_table', 0, -4, {}); put(ARMOURY, 'sea_chest', -5, 8.5, { face: 90 }); put(ARMOURY, 'psx_wooden_crate_2', 5, 8.5, {}); put(ARMOURY, 'brazier', 0, 4, {});

/* ── THE COURTS (every piece mirrored about the middle line) ── */
const P = (key, kx, ky, o) => props.push(Object.assign({ key, x: g(kx), z: g(ky) }, o || {}));
const both = (key, off, ky, o) => { P(key, 48 - off, ky, o); P(key, 48 + off, ky, o && o.face != null ? Object.assign({}, o, { face: (360 - o.face) % 360 }) : o); };
P('sword_stone', 48, 56.5, { face: 90, h: 2.8, floor: true });
both('brazier', 3.4, 57.4); both('brazier', 2.4, 55.4); both('brazier', 2.6, 49.7); both('lion_statue', 4.4, 50.2, { face: 180 }); both('lion_statue', 3.6, 61.4, { face: 180 });
both('fountain', 11, 50.5); both('iron_garden_bench', 13.2, 50.5, { face: 270 }); both('planter', 8.5, 51.4); both('planter', 14.5, 49.8); both('planter', 5.5, 51.4);
both('armour_stand', 4.6, 57.2, { face: 180 }); both('camping_tent', 9, 53.2, { face: 180 }); both('armour_stand', 6, 53.2, { face: 180 }); both('stocks', 10.5, 57.2, { face: 180 });
for (let i = 0; i < 6; i++) for (const s of [-1, 1]) feat({ k: 'tree', x: g(48 + s * 18.5), z: g(35.5 + i * 3.2), kind: i % 2 ? 'tree_4' : 'tree_2', h: r2(4.6 + (i % 3) * 0.3), r: 0.5 });   // THE ORCHARD, a row down each side of the upper court's foot
both('planter', 1.6, 33); both('brazier', 1.6, 35);

/* ── THE WAYS (the Great Stair and the sally port are doors of this room; the wardrobe and the well are DOOR_HQ.links rows that end here) ── */
{ const PAL = 'site_prebuilt_camelot_palace', way = (id, B, label, sub, desc) => { const p = B.at(B.door.lx, B.fd / 2 + 0.3); doors.push({ id, wall: 'free', x: p[0], z: p[1], face: 180, leaf: 'leaf_shabby_wood', label, sub, action: { room: PAL, at: id }, desc }); };
  way('portal', KEEP, 'CAMELOT CASTLE', 'THE PORTAL · THE THRONE HALL · THE GREAT STAIR', 'The great doors of the Keep, and the man-sized door in them. Everything the castle has is behind this one: the hall, the stair, the king.');
  way('kitchen', WEST, 'CAMELOT CASTLE', 'THE KITCHEN DOOR · THE WEST WING', 'The kitchen door in the West Wing. It smells of bread from here.');
  way('guard', EAST, 'CAMELOT CASTLE', 'THE GUARD DOOR · THE EAST WING', 'The guard room door in the East Wing. Somebody inside is sharpening something.');
  doors.push({ id: 'postern', wall: 'free', x: g(41.5), z: r2(g(Q.hill[3]) + 0.45), face: 180, leaf: 'leaf_shabby_wood', label: 'MERLIN’S UNDERCROFT', sub: 'THE SALLY PORT · UNDER THE HILL',
      action: { room: PAL, at: 'postern' }, desc: 'A low door in the foot of the castle hill, beside the Grand Stair. It goes down under the castle, which the besiegers should have found suspicious.' }); }
const ends = { haunted_camelot: { wall: 'free', x: r2(mid(Q.westWing)[0] - 7.3), z: r2(g(Q.westWing[3]) + 1.6), face: 180 }, well_camelot: { wall: 'free', x: g(53.5), z: g(56.6), face: 180 } };

/* ── who stands here: the old ward's four, with their own lines, in their new places; a knight in the barracks, two at the stair's head ── */
npc.push({ x: g(44.6), z: g(57.4), face: 180, race: 'knight', say: say('knight') }); npc.push({ x: g(51.4), z: g(57.4), face: 180, race: 'knight' });
npc.push({ x: g(49.6), z: g(56.9), face: 300, race: 'swordfighter', say: say('swordfighter') });
npc.push({ x: g(56.5), z: g(54.2), face: 240, race: 'robinhood', say: say('robinhood') });

return { F, props, doors, npc, marks, arch, X, Z, feat, raw, note, sheet, building, put, ends, Q, T1, T2 };
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

/* ══ CAMELOT KINGDOM, PLAN 3 (2026-11-15, mondo: "the village is supposed to be inside the castle walls too. so castle in the middle. village.
   walls surrounding all that. moat surrounding all that. then woods surrounding all that", and "okay that looks better" on plan 3).
   8 x 8 plots of 12 x 12 squares (336 m). From the middle out: THE CASTLE (the build above, no moat of its own), THE VILLAGE all the way
   round it, THE TOWN WALL (four gates), THE MOAT, THE WOODS (north the snowy pines and the sleigh road, east the Fairy Forest, west the
   Looking-Glass Garden, south the forest and the road from DOOR HQ). The North Pole is no longer a district of this room (the world layout
   puts it over the mountains): the sleigh road leaves by the north wall for the Pole's own room. The squares are
   docs/areas/camelot/layout.json `cells` (project files camelot-kingdom/plan3/draw-plan3.py writes it); the method is the Woods'
   (bake-woods.js): open squares are `space` rows of a `gen.kind: 'plan'` room, the rest is solid (forest, snowy pines, or hedge by
   `gen.zones`). Squares below are the kingdom's (kx, ky), 0..96. ══ */
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/camelot/layout.json'), 'utf8'));
const N = 12, G = 8, W = N * G, PL = N * C, HALF = W * C / 2, CX0 = 24, CY0 = 30, TOPT = 7;   // the town wall is the castle wall's height: the corner towers' spirals are the castle's own proven ones (at 5.25 the deck left no headroom over the stair)
const gx = c => r2(-HALF + c * C), gc = c => r2(-HALF + (c + 0.5) * C);
const K = buildCastle();
if (K.X(0) !== gx(CX0) || K.Z(0) !== gx(CY0)) throw new Error('the castle does not sit on its plots');
const F = K.F, props = K.props, doors = K.doors, npc = K.npc, feat = K.feat, raw = K.raw, note = K.note, count = {};
let seed = 64; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const cell = PLAN.cells.map(r => r.split(''));
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); plot[p.id] = p; });
const inCastle = (x, y) => [K.Q.hill, K.Q.grandStair, K.Q.backStair].some(q => x >= q[0] && x < q[2] && y >= q[1] && y < q[3]);
for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x];
    if (inCastle(x, y) !== (ch === 'Q')) throw new Error('layout.json: the castle hill is not where its `castle` rows say, at ' + x + ',' + y);   // Q = the castle's own ground (built above)
    if (ch === 'M') cell[y][x] = 't';                                 // a giant toadstool in the trees: forest (the toadstools are the zone's trees)
    else if (ch === 'k' || ch === 'K' || ch === 'G') cell[y][x] = 'g'; }   // the town wall's own squares: open ground, the wall's rows stand on it
for (let x = 0; x < 4; x++) for (const y of [47, 48]) cell[y][x] = 'm';    // the old garden's gap in the west hedge
const SOLID = ch => ch === 't' || ch === 'T' || ch === 'h';
const open = (x, y) => x >= 0 && y >= 0 && x < W && y < W && !SOLID(cell[y][x]);
const OLDR = id => JSON.parse(vm.runInContext('JSON.stringify((r => ({ d: r.doors, n: r.npcSpots, l: r.lines, t: r.terrain.features.filter(f => f.k === "tree" && /chess/.test(f.kind)) }))(DOOR_HQ.rooms.' + id + '))', D));
const OG = OLDR('site_prebuilt_lookingglass_garden'), ONP = OLDR('site_prebuilt_northpole_village');
const sayOf = (R, race) => (R.n.find(n => n.race === race) || {}).say;

/* ── THE MOAT round the town wall, the four bridges ── */
note('THE MOAT: all the way round the town wall; THE DRAWBRIDGE south, a bridge at each of the other three gates');
feat({ k: 'stream', pts: [[gx(15.5), gx(18.5)], [gx(15.5), gx(76.5)], [gx(80.5), gx(76.5)], [gx(80.5), gx(18.5)]], w: 10.2, y: -0.3, depth: 2.0, key: 'deep_water', bank: 0.6 });
feat({ k: 'stream', pts: [[gx(15.5), gx(18.5)], [gx(80.5), gx(18.5)]], w: 10.2, y: -0.3, depth: 2.0, key: 'deep_water', bank: 0.6 });
feat({ k: 'bridge', x0: gx(43), z0: gx(78.4), x1: gx(43), z1: gx(74.6), w: 7, y: 0.3, thick: 0.3, key: 'wood', id: 'drawbridge' });
feat({ k: 'bridge', x0: gx(48), z0: gx(16.6), x1: gx(48), z1: gx(20.4), w: 7, y: 0.3, thick: 0.3, key: 'wood', id: 'north_bridge' });
feat({ k: 'bridge', x0: gx(82.4), z0: gx(48), x1: gx(78.6), z1: gx(48), w: 7, y: 0.3, thick: 0.3, key: 'wood', id: 'east_bridge' });
feat({ k: 'bridge', x0: gx(13.6), z0: gx(48), x1: gx(17.4), z1: gx(48), w: 7, y: 0.3, thick: 0.3, key: 'wood', id: 'west_bridge' });

/* ── THE TOWN WALL: the castle's own pieces (hqCurtainWall runs split at every drum, four hollow corner towers with a spiral up to the
   walk, solid drums, a deck over each gate), a storey lower than the castle's wall so the castle stands over its town ── */
note('THE TOWN WALL: four corner towers, the drums, the four gates');
const WX0 = 18.5, WX1 = 77.5, WY0 = 21.5, WY1 = 73.5;
const TCORN = { sw: [WX0, WY1], se: [WX1, WY1], nw: [WX0, WY0], ne: [WX1, WY0] };
const TWRT = { sw: { door: [30, 66], joins: [[69, 111], [339, 381]], a0: 75 }, se: { door: [300, 334], joins: [[249, 291], [339, 381]], a0: 346 },
               ne: { door: [210, 244], joins: [[159, 201], [249, 291]], a0: 256 }, nw: { door: [120, 154], joins: [[69, 111], [159, 201]], a0: 166 } };
Object.keys(TCORN).forEach(k => raw('...hqCastleTower(' + J(Object.assign({ id: 'town_tower_' + k, x: gx(TCORN[k][0]), z: gx(TCORN[k][1]), r: 5.25, top: TOPT, span: 250, key: WALL, floor: 'wood_planks' }, TWRT[k])) + ')'));
const SKIPT = { n: [328, 392], e: [58, 122], s: [148, 212], w: [238, 302] };
const townArch = K.sheet();
/* a side: `fix` its line, `along` the drums' places on it (squares), the gate between drums gi and gi + 1; horizontal sides run west → east, vertical ones south → north (the castle's own way round) */
function townSide(id, horiz, fix, c0, c1, along, gi, out, front) {
    const pt = a => horiz ? [gx(a), gx(fix)] : [gx(fix), gx(a)], nodes = [{ a: c0, corner: 1 }].concat(along.map(a => ({ a })), [{ a: c1, corner: 1 }]), dir = c1 > c0 ? 1 : -1;
    along.forEach((a, i) => { const p = pt(a), did = 'town_drum_' + id + i;
        raw('...hqRoundBlock(' + J({ id: did, x: p[0], z: p[1], r: 3.5, y: TOPT, key: WALL }) + ')');
        raw('...hqCastleCrown(' + J({ id: did + '_crown', x: p[0], z: p[1], r: 3.5, top: TOPT, skip: (horiz ? 'we' : 'ns').split('').map(c => SKIPT[c]), key: WALL }) + ')'); });
    for (let i = 0; i < nodes.length - 1; i++) { const A = nodes[i], B = nodes[i + 1];
        if (i === gi + 1) {   // THE GATE: the deck that carries the walk over it, its front, a ridge roof, the two drums' cones
            const s0 = A.a + dir, s1 = B.a - dir, m = (s0 + s1) / 2, p0 = pt(s0 - dir * 0.5), p1 = pt(s1 + dir * 0.5), mid = pt(m);
            feat({ k: 'bridge', x0: p0[0], z0: p0[1], x1: p1[0], z1: p1[1], w: 3.5, y: TOPT, thick: 2.2, plain: true, rails: false, key: WALL, id: 'town_gate_' + id });
            const q0 = pt(s0), q1 = pt(s1), fx = horiz ? 0 : front * 1.55, fz = horiz ? front * 1.55 : 0, e = dir * 0.9;
            feat({ k: 'bridge', x0: r2(q0[0] + (horiz ? e : 0) + fx), z0: r2(q0[1] + (horiz ? 0 : e) + fz), x1: r2(q1[0] - (horiz ? e : 0) + fx), z1: r2(q1[1] - (horiz ? 0 : e) + fz), w: 0.5, y: TOPT + 1.8, thick: 4.0, plain: true, rails: false, key: WALL, id: 'town_gate_' + id + '_front' });
            townArch.roof('gable', mid[0], TOPT + 4.4, mid[1], 7.4, 2.8, 4.6, SLATE_T, 0xa84a3c, { keyEnd: 'wood_planks', tintEnd: 0xb89468, ry: horiz ? 0 : 90 });
            for (const s of [-1, 1]) townArch.box(mid[0] + (horiz ? s * 3.3 : 0), TOPT + 2.4, mid[1] + (horiz ? 0 : s * 3.3), horiz ? 0.3 : 4.4, 2.0, horiz ? 4.4 : 0.3, 'wood', 0x6a4a30);
            for (const n of [A, B]) { const p = pt(n.a); townArch.cyl(p[0], TOPT + 1.1, p[1], 0.22, 3.0, 'wood', 0x6a4a30, { seg: 8, cap: false, ring: { n: 6, r: 3.0 } }); townArch.cyl(p[0], TOPT + 4.1, p[1], 4.2, 5.4, SLATE_T, 0x5a6c96, { seg: 14, r2: 0, roof: true }); }
            continue; }
        const a0 = A.a + dir * (A.corner ? 4.85 : 2.5) / C, a1 = B.a - dir * (B.corner ? 4.85 : 2.5) / C, p0 = pt(a0), p1 = pt(a1), tw = n => { const p = pt(n.a); return { x: p[0], z: p[1], r: n.corner ? 5.25 : 3.5 }; };
        const o = { id: 'town_' + id + '_' + i, x0: p0[0], z0: p0[1], x1: p1[0], z1: p1[1], t: 3.5, top: TOPT, out, key: WALL, towers: [tw(A), tw(B)] }; if (A.corner) o.pull0 = 1.2; if (B.corner) o.pull1 = 1.2;
        raw('...hqCurtainWall(' + J(o) + ')');
        const r0 = A.a + dir * (A.corner ? 5.35 : 3.6) / C, r1 = B.a - dir * (B.corner ? 5.35 : 3.6) / C, ins = -front * 1.6, e0 = pt(r0), e1 = pt(r1);   // the parapet on the walk's inner edge
        feat({ k: 'rail', x0: r2(e0[0] + (horiz ? 0 : ins)), z0: r2(e0[1] + (horiz ? ins : 0)), x1: r2(e1[0] + (horiz ? 0 : ins)), z1: r2(e1[1] + (horiz ? ins : 0)), y: TOPT, model: 'parapet' }); }
}
const SLATE_T = 'urban:MetalRoofTiles1a';
townSide('s', true, WY1, WX0, WX1, [30, 41, 45, 57, 67], 1, 1, 1);
townSide('n', true, WY0, WX0, WX1, [30, 46, 50, 59, 68], 1, -1, -1);
townSide('w', false, WX0, WY1, WY0, [60, 50, 46, 34], 1, -1, -1);
townSide('e', false, WX1, WY1, WY0, [60, 50, 46, 34], 1, 1, 1);
Object.keys(TCORN).forEach(k => { const x = gx(TCORN[k][0]), z = gx(TCORN[k][1]);   // the corner towers' cones on posts, a banner
    townArch.cyl(x, TOPT + 1.2, z, 0.24, 3.4, 'wood', 0x6a4a30, { seg: 8, cap: false, ring: { n: 8, r: 4.85, a0: 22.5 } });
    townArch.cyl(x, TOPT + 4.6, z, 6.1, 0.4, 'wood', 0x6a4a30, { seg: 16, roof: true }); townArch.cyl(x, TOPT + 5, z, 6.3, 6.4, SLATE_T, 0xa84a3c, { seg: 16, r2: 0, roof: true });
    townArch.cyl(x, TOPT + 11.4, z, 0.1, 3.0, null, 0x403830, { seg: 6, roof: true }); townArch.box(x + 1.1, TOPT + 13, z, 2.2, 1.3, 0.06, null, 0xb02c36, { ds: true, roof: true }); });
feat({ k: 'arch', id: 'cam:town_roofs', x: 0, z: 0, rot: 0, parts: townArch.P });

/* ── THE WAYS on the room's wall and the room's own doors ── */
const BAYX = gx(43), WAYS = { trail: gx(48), sleigh: gx(48) };
doors.push({ id: 'oldgarden', wall: 'w', z: gx(48), way: 'trail', label: 'THE LOOKING-GLASS · THE GARDEN', sub: 'THE OLD GARDEN · AS IT WAS',
    action: { room: 'site_prebuilt_lookingglass_garden', at: 'bay' }, desc: 'A gap in the west hedge. The garden on the far side is the one that was here before this one was measured.' });
doors.push({ id: 'deadtree', wall: 's', x: gx(8), way: 'trail', secret: true, label: 'THE WOODS', sub: 'THE DEAD TREE · BACK TO THE WOODS',
    action: { room: 'site_prebuilt_fairy_forest_plots', at: 'lookingglass' }, desc: 'The hedge stops at a dead tree with a hole in it the size of a door. Through it the ground is the right colour again.' });

/* ── THE BUILDINGS' SQUARES: the three walked into are named here; every other run of the plan's `B` is a house ── */
const WALKIN = { chapel: PLAN.walkins.Chapel.concat('N'), smithy: PLAN.walkins.Smithy.concat('N'), inn: PLAN.walkins.Inn.concat('N') };
Object.keys(WALKIN).forEach(k => { const q = WALKIN[k]; for (let y = q[1]; y < q[3]; y++) for (let x = q[0]; x < q[2]; x++) cell[y][x] = 'V'; });
const HOUSES = [];
{ const used = new Uint8Array(W * W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { if (cell[y][x] !== 'B' || used[y * W + x]) continue;
      let w = 1; while (x + w < W && cell[y][x + w] === 'B' && !used[y * W + x + w]) w++;
      let h = 1; rows: while (y + h < W) { for (let i = 0; i < w; i++) if (cell[y + h][x + i] !== 'B' || used[(y + h) * W + x + i]) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
      HOUSES.push({ x0: x, y0: y, x1: x + w, y1: y + h }); } }

/* ── THE OPEN GROUND: greedy rectangles of open squares ── */
{ const used = new Uint8Array(W * W);
  for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) { if (!open(cx, cy) || used[cy * W + cx]) continue;
      let w = 1; while (cx + w < W && !used[cy * W + cx + w] && open(cx + w, cy)) w++;
      let h = 1; rows: while (cy + h < W) { for (let i = 0; i < w; i++) if (used[(cy + h) * W + cx + i] || !open(cx + i, cy + h)) break rows; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(cy + j) * W + cx + i] = 1;
      feat({ k: 'space', x: r2(gx(cx) + w * C / 2), z: r2(gx(cy) + h * C / 2), w: w * C, d: h * C }); count.spaces = (count.spaces || 0) + 1; } }
/* the paint: snow under the pines (no snow sheet exists: the Woods' Snowline wears the ice sheet too), the trodden snow road, the forest's
   dirt, the village's cobbles, the garden's marble, the ground under the hedges */
/* the castle's ground: marble on the upper court, cobbles on the lower court and the stairs, grass under the orchard rows */
const castlePaint = (x, y) => { const u = K.Q.upper; if (x >= u[0] && x < u[2] && y >= u[1] && y < u[3]) return 5; return (y >= 34 && y < 52 && (x < 31 || x >= 65)) ? 0 : 4; };
const PAL = ['ice', 'ice_1', 'dirt_2', 'cobblestone', 'marble', 'igloo', 'leaves_3'], paint = new Uint8Array(W * W);
for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x];
    paint[y * W + x] = ch === 'Q' ? castlePaint(x, y) : (ch === 's' || ch === 'T') ? 1 : ch === 'p' ? 3 : (ch === 'c' || ch === 'b') ? 4 : (ch === 'm' || ch === 'x' || ch === 'X') ? 5 : ch === 'i' ? 6 : ch === 'h' ? 7 : 0; }

/* ── THE DRESSING HELPERS: by square. A blocker stands on its square's middle; decor stands off it. A piece may only stand on free ground
   (grass, snow, marble; `on` names another), never twice on one square: the tool stops if a square is wrong ── */
const taken = new Set();
function sq(x, y, on) { const ch = cell[y][x], k = x + ':' + y; if (!(ch === 'g' || ch === 's' || ch === 'm' || (on && on.indexOf(ch) >= 0))) { (global.BAD = global.BAD || []).push(k + '=' + ch); return [x, y]; }
    if (taken.has(k)) (global.BAD = global.BAD || []).push(k + '=twice'); taken.add(k); return [x, y]; }
function put(key, x, y, o, on) { sq(x, y, on); props.push(Object.assign({ key, x: gc(x), z: gc(y) }, o || {})); }
function dec(key, x, y, o, on) { sq(x, y, on); props.push(Object.assign({ key, x: r2(gc(x) + (rnd() - 0.5) * 1.6), z: r2(gc(y) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); }
function tree(kind, h, x, y, r) { if (!TREES[kind]) throw new Error('not a tree: ' + kind); sq(x, y); feat({ k: 'tree', x: gc(x), z: gc(y), kind, h, r: r || 0.8 }); }
function native(race, x, y, face, say) { sq(x, y); const n = { x: gc(x), z: gc(y), face: face || 0, race }; if (say) n.say = say; npc.push(n); }
const many = (n, f) => { for (let i = 0; i < n; i++) f(i); };

/* ── THE BUILDINGS ── */
const U = n => 'urban:' + n, STUCCO = U('PlasterWallStucco2a'), G_TALL = U('GlassWindowTall1a'), SLATE = U('MetalRoofTiles1a'), WOODK = 'wood_planks', WOODD = 'wood';
const STONE = 0xc4c0b8, STONE2 = 0xaeaaa6, STONE3 = 0xd2ccc0, GLASS = 0xa8c4ec, TIMBER = 0x4a3626;
const nArch = K.arch.length, kb = (id, q, h, o, parts) => K.building(id, q[0] - CX0, q[1] - CY0, q[2] - CX0, q[3] - CY0, q[4], h, o, parts);
note('THE VILLAGE: the Chapel, the Smithy, the Inn (walked into), the houses');
/* THE CHAPEL — stone, buttressed, lancets, a steep slate roof, a bell tower over the door */
const CHAPEL = kb('chapel', WALKIN.chapel, 7, { floorIn: 'marble' }, (a, w, d, door) => {
    a.shell(w, 7, d, WALL, STONE3, door); a.box(0, 0, 0, w + 0.5, 1.0, d + 0.5, WALL, STONE2, { top: true });
    a.roof('gable', 0, 7, 0, d + 1.4, 6, w + 1.4, SLATE, 0x5a6c96, { ry: 90, keyEnd: WALL, tintEnd: STONE });
    a.box(0, 9.5, d / 2 - 1.4, 2.8, 5.5, 2.8, WALL, STONE, { roof: true }); a.roof('pyramid', 0, 15, d / 2 - 1.4, 3.4, 3.6, 3.4, SLATE, 0x5a6c96);
    for (const s of [-1, 1]) { a.box(s * (w / 2 + 0.45), 0, -d / 2 + 2.2, 0.9, 5.6, 1.2, WALL, STONE2, { n: 4, step: [0, 0, (d - 4.4) / 3] }); a.box(s * (w / 2 + 0.07), 2.2, -d / 2 + 4.1, 0.1, 3.4, 1.1, G_TALL, 0xd8a8e0, { n: 3, step: [0, 0, (d - 4.4) / 3], glow: 0.5 }); }
    a.box(0, 3.6, d / 2 + 0.07, 1.6, 2.4, 0.1, G_TALL, 0xd8a8e0, { glow: 0.5 });
});
/* THE SMITHY — timber on a stone foot, an open-fronted forge under a lean-to, the chimney */
const SMITHY = kb('smithy', WALKIN.smithy, 5.25, { leafDouble: false, keyIn: WOODK, floorIn: 'dirt_2' }, (a, w, d, door) => {
    a.shell(w, 5.25, d, WOODK, 0xb89468, door); a.box(0, 0, 0, w + 0.4, 1.2, d + 0.4, WALL, STONE2, { top: true });
    a.roof('gable', 0, 5.25, 0, w + 1.6, 3.4, d + 1.6, WOODD, 0x6a4a34, { keyEnd: WOODK, tintEnd: 0xa88458 });
    a.box(-w / 2 + 1.2, 0, -d / 2 - 0.6, 1.8, 9.5, 1.8, WALL, STONE, {}); a.box(-w / 2 + 1.2, 9.5, -d / 2 - 0.6, 2.2, 0.5, 2.2, WALL, STONE2, { roof: true });
    a.roof('shed', 3, 3.2, d / 2 + 1.6, 6, 1.2, 3.2, WOODD, 0x6a4a34, { ry: 180, under: true }); for (const x of [0.3, 5.7]) a.box(x, 0, d / 2 + 2.9, 0.3, 3.2, 0.3, WOODD, TIMBER);
});
/* THE INN — two storeys, plaster over a stone ground floor, a jettied upper floor on timber, the sign */
const INN = kb('inn', WALKIN.inn, 7, { keyIn: STUCCO, floorIn: 'wood_planks' }, (a, w, d, door) => {
    a.shell(w, 3.5, d, WALL, STONE3, door); a.box(0, 3.5, 0, w + 0.9, 3.5, d + 0.9, STUCCO, 0xe6dcc4, { top: false, under: true });
    for (const s of [-1, 1]) { a.box(s * (w / 2 + 0.4), 3.5, 0, 0.25, 3.5, d + 1.0, WOODD, TIMBER); a.box(0, 3.5, s * (d / 2 + 0.4), w + 1.0, 0.3, 0.25, WOODD, TIMBER); a.box(0, 6.7, s * (d / 2 + 0.4), w + 1.0, 0.3, 0.25, WOODD, TIMBER); }
    a.box(-w / 2 + 1.5, 4.6, d / 2 + 0.47, 1.0, 1.3, 0.1, G_TALL, 0xf0d890, { n: Math.max(2, Math.floor(w / 3.5)), step: [(w - 3) / Math.max(1, Math.floor(w / 3.5) - 1), 0, 0], glow: 0.5 });
    a.roof('gable', 0, 7, 0, w + 1.8, 4.4, d + 1.8, SLATE, 0xa84a3c, { keyEnd: STUCCO, tintEnd: 0xe6dcc4 });
    a.box(door.lx + 2.4, 3.0, d / 2 + 1.0, 0.12, 0.12, 1.4, null, 0x2a2c30); a.box(door.lx + 2.4, 2.0, d / 2 + 1.5, 0.08, 0.9, 1.0, WOODK, 0x8a5a34, { ds: true });
    a.box(w / 2 - 1.4, 5.25, -d / 4, 1.1, 5, 1.1, 'bricks_2', 0xb86a54, { roof: true });
});
/* the houses: plaster on a stone foot, a dark timber frame, a gable; the door faces the nearest street */
const HTINT = [0xe8dcc0, 0xd8c8a8, 0xf0e8d8, 0xc8b89c], RTINT = [0xa84a3c, 0x7a5a3c, 0x5a6c96, 0x8a4a34], RKEY = [SLATE, WOODD, SLATE, SLATE];
function frontOf(h) { const n = { N: 0, S: 0, W: 0, E: 0 }, road = (x, y) => (x >= 0 && y >= 0 && x < W && y < W && cell[y][x] === 'c') ? 1 : 0;
    for (const k of [1, 2, 3]) { const wt = 4 - k; for (let x = h.x0; x < h.x1; x++) { n.N += wt * road(x, h.y0 - k); n.S += wt * road(x, h.y1 - 1 + k); } for (let y = h.y0; y < h.y1; y++) { n.W += wt * road(h.x0 - k, y); n.E += wt * road(h.x1 - 1 + k, y); } }
    return ['S', 'N', 'E', 'W'].sort((a, b) => n[b] - n[a])[0]; }
HOUSES.forEach((h, i) => {
    const side = frontOf(h);
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

/* ── THE VILLAGE'S GROUND ── */
note('THE VILLAGE: the market, the graveyard, the green, the gates');
const MK = 'c';   // the market's pieces stand on its cobbles (rows 58-61, either side of the Grand Stair), clear of the street (62-63)
[32, 34, 36, 38, 58, 60, 62, 64].forEach(x => put('camping_tent', x, 60, { face: 180 }, MK)); put('ancient_well', 40, 60, {}, MK); put('stocks', 56, 60, { face: 0 }, MK);
put('bread_rack', 33, 59, { face: 180 }, MK); put('bread_rack', 63, 59, { face: 180 }, MK); put('psx_wooden_crate_2', 37, 59, {}, MK); put('psx_wooden_crate_2', 59, 59, {}, MK); dec('meshy_burlap_sack', 35, 59, {}, MK); dec('meshy_burlap_sack', 61, 59, {}, MK);
[[24, 66], [24, 68], [24, 70], [30, 66], [31, 68], [30, 70], [31, 71]].forEach(q => dec('cross', q[0], q[1]));
put('armour_stand', 65, 66, { face: 270 }); put('brazier', 65, 68);
put('cow', 63, 31, { face: 60 }); dec('chicken', 62, 30); dec('chicken', 64, 30); dec('chicken', 65, 31); dec('decor_sheep', 61, 31); dec('decor_sheep', 66, 30);   // the green, behind the castle hill now
put('horse_brown', 45, 66, { face: 90 }); dec('meshy_burlap_sack', 45, 68);
put('brazier', 41, 70); put('brazier', 44, 70); put('signpost', 46, 24); put('signpost', 75, 46); put('signpost', 20, 46); put('signpost', 44, 61, {}, MK);
native('knight', 41, 71, 90); native('knight', 44, 71, 270);
[[45, 30], [50, 30], [37, 31], [59, 31], [29, 30], [67, 30], [27, 46], [69, 46], [27, 61], [69, 61]].forEach((q, i) => tree(i % 2 ? 'tree_4' : 'tree_2', r2(5 + (i % 3) * 0.5), q[0], q[1], 0.6));
put('park_bench', 46, 29, { face: 180 }); put('planter', 50, 29);
/* the road in from DOOR HQ: the portcullis stands at the room's south wall, in the forest; the drawbridge is ahead */
props.push({ key: 'brazier', x: r2(BAYX - 5.25), z: gc(94) }, { key: 'brazier', x: r2(BAYX + 5.25), z: gc(94) }); put('signpost', 44, 91);

/* ── THE LOOKING-GLASS GARDEN (the west woods) ── */
note('THE LOOKING-GLASS GARDEN: the hedges (drawn here: the solid is the plan\'s), the chessboard, the marble court, the mirror, the tea party');
{ const used = new Uint8Array(W * W);   // the hedges: a box a run, a parts list a plot
  PLAN.plots.forEach(p => { const a = K.sheet(), px = gx(p.x * N + N / 2), pz = gx(p.y * N + N / 2);
      for (let y = p.y * N; y < p.y * N + N; y++) for (let x = p.x * N; x < p.x * N + N; x++) { if (cell[y][x] !== 'h' || used[y * W + x]) continue;
          let w = 1; while (x + w < p.x * N + N && cell[y][x + w] === 'h' && !used[y * W + x + w]) w++;
          let h = 1; rows: while (y + h < p.y * N + N) { for (let i = 0; i < w; i++) if (cell[y + h][x + i] !== 'h' || used[(y + h) * W + x + i]) break rows; h++; }
          for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
          a.box(r2(gx(x) + w * C / 2 - px), 0, r2(gx(y) + h * C / 2 - pz), w * C, 2.6 + ((x + y) % 3) * 0.15, h * C, 'leaves_3', 0x6c9a58); count.hedges = (count.hedges || 0) + 1; }
      if (a.P.length) feat({ k: 'arch', id: 'cam:hedge:' + p.id, x: px, z: pz, rot: 0, parts: a.P }); }); }
{ const bx = gx(7), bz = gx(34);   // THE CHESSBOARD: the old garden's own board and its position
  feat({ k: 'board', x: bx, z: bz, n: 8, cell: 3.5, keys: ['marble_light', 'marble'], colors: [15920870, 2894392], clear: 0 });
  OG.t.forEach(t => { if (t.h) return; const o = Object.assign({}, t, { x: r2(t.x + bx), z: r2(t.z - 17.5 + bz) }); delete o.chessPos; feat(o); }); }
[[5, 23], [8, 23], [9, 23], [8, 25], [9, 25]].forEach(q => dec('flamingo', q[0], q[1])); dec('garden_ring', 9, 24); native('gnome', 5, 24, 90, sayOf(OG, 'gnome'));
dec('pocket_watch', 2, 29); dec('rabbit', 11, 29); put('park_bench', 11, 33, { face: 270 }); put('iron_garden_bench', 1, 35, { face: 90 });
tree('chess_king_dark', 3.4, 9, 42); tree('chess_queen_dark', 3.1, 9, 43); tree('chess_king', 3.4, 5, 43); tree('chess_queen', 3.1, 5, 44);
put('royal_throne', 8, 43, { face: 270 }); native('ice queen', 8, 42, 270, sayOf(OG, 'ice queen'));
{ put('mushroom', 9, 57); props.push({ key: 'caterpillar', x: gc(9), z: gc(57), floor: true, y: 3.3, face: 270 }); dec('fae_toadstool', 5, 57); dec('fae_toadstool', 9, 53); put('fountain', 5, 53); put('angel_statue', 9, 55, { face: 270 }); }
{ sq(7, 68); const x = gc(7), z = gc(68); props.push({ key: 'tulip_table', x, z }); for (const d of [[1.1, 0, 270], [-1.1, 0, 90], [0, 1.1, 0], [0, -1.1, 180]]) props.push({ key: 'teal_chair', x: r2(x + d[0]), z: r2(z + d[1]), face: d[2] });
  props.push({ key: 'teapot', x, z, floor: true, y: 0.74 }); props.push({ key: 'teacups', x: r2(x + 0.3), z: r2(z + 0.25), floor: true, y: 0.74 }); }
native('fairy', 9, 69, 300, sayOf(OG, 'fairy')); native('catgirl', 5, 69, 60, sayOf(OG, 'catgirl')); put('signpost', 8, 45);
{ const m = OG.d.find(d => d.id === 'astral'); sq(7, 53);   // THE MIRROR: the old garden's frame with nothing in it, with its own words
  doors.push({ id: 'mirror', wall: 'free', x: gc(7), z: gc(53), face: 180, leaf: m.leaf, label: m.label, sub: m.sub, action: { room: 'site_prebuilt_lookingglass_waiting', at: 'garden' }, desc: m.desc }); }

/* ── THE FAIRY FOREST (the east woods) ── */
note('THE FAIRY FOREST: the pond, the ring, the spring, the knolls');
feat({ k: 'pool', x: gx(92), z: gx(30.5), r: 5.6, rz: 6.4, y: -0.3, depth: 0.9, key: 'water', bank: 1.2 });
feat({ k: 'deck', x0: gx(90), z0: gx(30.5), x1: gx(92), z1: gx(30.5), w: 7, y: 0.3 });
for (let y = 28; y < 33; y++) for (let x = 90; x < 94; x++) taken.add(x + ':' + y);
dec('butterfly', 87, 27, { floor: true, y: 1.2 }); dec('blue_morpho', 93, 26, { floor: true, y: 1.5 }); dec('swallowtail', 87, 34, { floor: true, y: 1.1 }); dec('monarch', 93, 34, { floor: true, y: 1.4 });
{ const x = gx(92), z = gx(43); many(12, i => { const q = i * Math.PI / 6; props.push({ key: 'fae_toadstool', x: r2(x + Math.cos(q) * 5.6), z: r2(z + Math.sin(q) * 5.6), face: i * 30 }); });   // THE RING
  for (let y = 40; y < 46; y++) for (let x2 = 89; x2 < 95; x2++) taken.add(x2 + ':' + y); props.push({ key: 'instrument_harp', x: r2(x + 0.6), z: r2(z - 0.5), face: 200 }); npc.push({ x: r2(x + 1.75), z: r2(z + 1.75), face: 220, race: 'fairy' }); }
feat({ k: 'pool', x: gc(91), z: gc(62), r: 3.2, y: -0.25, depth: 0.7, key: 'water', bank: 0.8 }); taken.add('91:62'); dec('fern', 92, 60); dec('fern', 90, 64); dec('fern', 92, 64);
many(3, i => put('fae_mushroom', 91 + (i % 2), 54 + i)); dec('fae_toadstool', 90, 54); dec('fae_toadstool', 90, 56); dec('luna_moth', 93, 55, { floor: true, y: 1.3 });
feat({ k: 'hill', x: gc(91), z: gc(22), r: 4.6, h: 1.3 }); dec('stump', 90, 21); feat({ k: 'hill', x: gc(91), z: gc(72), r: 4.6, h: 1.3 }); dec('fallen_log', 90, 73); dec('rabbit', 91, 71);
put('signpost', 87, 46); put('signpost', 91, 50);

/* ── THE SNOWY PINES (the north woods) and THE FOREST (the south woods) ── */
note('THE SNOWY PINES + THE FOREST');
put('sleigh', 50, 6, { face: 0 }); put('xmas_snowman', 45, 5); put('signpost', 46, 8); put('campfire', 30, 12); native('yeti', 31, 13, 120, sayOf(ONP, 'yeti')); put('xmas_snowman_2', 68, 12);
put('campfire', 6, 7); dec('stump', 5, 6); dec('stump', 89, 6); put('xmas_snowman_3', 90, 7);
feat({ k: 'hill', x: gc(22), z: gc(91), r: 4.6, h: 1.2 }); dec('fallen_log', 21, 90); dec('stump', 24, 90); feat({ k: 'hill', x: gc(66), z: gc(91), r: 4.6, h: 1.2 }); dec('fallen_log', 67, 90); put('campfire', 64, 90);
dec('rabbit', 45, 85); dec('stump', 40, 86); dec('fern', 45, 89); dec('fern', 90, 90); dec('stump', 88, 90);
tree('tree_5', 6.5, 9, 90, 0.9);

/* ── checks: the catalogue, the units, every plot walked to from the portcullis ── */
if (global.BAD) throw new Error('squares that are not free ground: ' + global.BAD.join(' '));
check(props, npc);
{ const seen = new Uint8Array(W * W), st = [[43, 93]]; if (!open(43, 93)) throw new Error('the portcullis square is not open'); seen[93 * W + 43] = 1;
  const wet = (x, y) => cell[y][x] === 'w';
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (open(X, Y) && !wet(X, Y) && !seen[Y * W + X]) { seen[Y * W + X] = 1; st.push([X, Y]); } } }
  const cold = PLAN.plots.filter(p => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.y * N + ly) * W + p.x * N + lx]) return false; return true; }).map(p => p.id);
  if (cold.length) throw new Error('plots not reached: ' + cold.join(' '));
  let op = 0, un = 0; for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (open(x, y) && !wet(x, y)) { op++; if (!seen[y * W + x]) un++; } count.openSquares = op; count.unreachedSquares = un; }
Object.assign(count, { features: F.length, props: props.length, doors: doors.length, natives: npc.length });

/* ── the room ── */
const SNOW = ['xmas_snow_pine', 'xmas_snow_pine_2', 'xmas_snow_pine_3'], FAE = ['fae_cap', 'tree_3', 'fae_cap_2', 'tree', 'tree_2'];
const zone = (x0, y0, x1, y1, o) => Object.assign({ x0: gx(x0), z0: gx(y0), x1: gx(x1), z1: gx(y1) }, o);
const ZONES = [zone(0, 0, W, 17, { kinds: SNOW, treeH: [5.5, 8] }), zone(0, 17, 14, 79, { none: true }), zone(82, 17, W, 79, { kinds: FAE })];
const LINES = OLD.l.concat(OG.l), M = [];
M.push("        /* CAMELOT-KINGDOM-BEGIN — CAMELOT KINGDOM ON PLOTS, PLAN 3 (2026-11-15): written by `node bake-camelot.js` from docs/areas/camelot/layout.json. Never hand-edit between the markers; edit the tool or the layout and rerun. */");
M.push("        site_prebuilt_camelot_kingdom: {");
M.push("            label: 'CAMELOT KINGDOM',");
M.push("            sub: 'THE CASTLE · THE VILLAGE · THE TOWN WALL · THE MOAT · THE WOODS',");
M.push("            kind: 'box', site: 'prebuilt_camelot', part: 'kingdom',");
M.push("            shell: hqCastleShell({ w: " + (2 * HALF) + ", d: " + (2 * HALF) + ", plate: { x: " + BAYX + ", z: " + gc(93) + ", y: 4.4 } }),");
M.push("            parti: 'A castle in the middle of its village, one wall round them both, a moat round the wall and the woods round the moat: snowy pines to the north, a forest that glows to the east, a hedge garden to the west, and the road home to the south.',");
M.push("            typology: 'grid',");
M.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + G + ", names: " + J(PLAN.plots.map(p => [p.id, p.name, p.district, p.level])) + " },");
M.push("            terrain: {");
M.push("                res: 1.75, floor: 'grass_2', cliff: 'castle_wall', path: 'cobblestone',   // half a square a node: the room is 336 m, and the castle's rows are dear a node (0.875 took four times as long to stand up)");
M.push("                noise: { amp: 0, scale: 8 },");
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
const ENDS = { bay: { wall: 's', x: BAYX }, woods_camelot: { wall: 'e', z: WAYS.trail }, northpole_camelot: { wall: 'n', x: WAYS.sleigh }, haunted_camelot: K.ends.haunted_camelot, well_camelot: K.ends.well_camelot };
console.log('ends ' + JSON.stringify(ENDS));
if (DRY) process.exit(0);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
src = splice(src, kingdomBlock, 'CAMELOT-KINGDOM', '        site_prebuilt_camelot_ward: {');
fs.writeFileSync(file, src);
console.log('data.js: site_prebuilt_camelot_kingdom (' + kingdomBlock.length + ' bytes) written');
