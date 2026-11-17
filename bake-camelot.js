#!/usr/bin/env node
/* bake-camelot.js — CAMELOT KINGDOM ON PLOTS (2026-11-15): writes the room `site_prebuilt_camelot_kingdom` into data.js between
   CAMELOT-KINGDOM-BEGIN / END from docs/areas/camelot/layout.json. `--dry-run` prints the counts. Never hand-edit between the markers:
   edit this tool or the layout and rerun.
   THE CASTLE is redesign 2 (mondo's OK on docs/plans/camelot/camelot_castle_redesign_2.png): one symmetrical palace on a two-step hill in
   the middle of the village. Round it: the village, the town wall, the moat, the woods (plan 3).
   THE DISTRICT FILES (2026-11-16): this tool holds only what the districts share (the plan's reading, the kit, the hill, the moat, the town
   wall, the ways out, the open ground, the paint, the checks, the room). What stands in a district is in docs/areas/camelot/districts/<LETTER>.js
   (K T L F N W), loaded through the ONE hook below ("THE DISTRICT FILES"). A district thread edits its own file, never this tool.
   Collision and the walked parts are terrain rows (plateau, ramp, rail, hqCurtainWall, hqCastleTower, hqRoundBlock, hqCastleCrown); a
   building is a `texbuilding` row drawn by a `k: 'arch'` parts list.
   Notes: docs/notes/areas-complexes.md "CAMELOT, THE DISTRICT FILES", "CAMELOT CASTLE, REDESIGN 2" and the "CAMELOT KINGDOM" sections. Plan pictures: docs/plans/camelot/. */
'use strict';
const fs = require('fs'), path = require('path');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const C = 3.5;   // a square
const r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData(), vm = require('vm');
const OLD = JSON.parse(vm.runInContext('JSON.stringify({ n: DOOR_HQ.rooms.site_prebuilt_camelot_ward.npcSpots, l: DOOR_HQ.rooms.site_prebuilt_camelot_ward.lines })', D));
const say = race => (OLD.n.find(n => n.race === race) || {}).say || [];
const WALL = 'castle_wall';
/* THE ROYAL BANNER (2026-11-16, mondo on the first screenshots: "wtf is this random red rectangle and yellow square. if its a flag or a
   banner it needs way more detail and thought behind it"). One banner, the same everywhere in Camelot: an iron rod with gilt finials on two
   brackets, a crimson cloth with a gold border, cut to a swallowtail at the foot; on it Arthur's arms: the gold crown over the sword in
   the stone (the blade point down in a grey stone). → parts in a frame where the cloth hangs in the x plane and faces +z * nz.
   (cx, y0, cz) = the middle of its foot, w x h its size. */
function royalBanner(cx, y0, cz, w, h, nz) {
    const P = [], r = v => Math.round(v * 1000) / 1000, CR = 0xa01e2c, CR2 = 0x7c1420, GO = 0xd8b050, IRON = 0x2a2c30, ST = 0x8a8c90, BL = 0xd4d8e0;
    const L = (dx, dy, bw, bh, tint, layer, x) => P.push(Object.assign({ s: 'box', p: [r(cx + dx), r(y0 + dy), r(cz + nz * 0.02 * layer)], size: [r(bw), r(bh), 0.03], tint, ds: true }, x || {}));
    const tail = h * 0.16, top = h, body = h - tail;
    /* the rod, its finials, the two brackets back to the wall */
    P.push({ s: 'box', p: [cx, r(y0 + top), cz], size: [r(w + 0.5), 0.09, 0.09], tint: IRON }); for (const s of [-1, 1]) { P.push({ s: 'box', p: [r(cx + s * (w / 2 + 0.3)), r(y0 + top - 0.04), cz], size: [0.17, 0.17, 0.17], tint: GO }); P.push({ s: 'box', p: [r(cx + s * w * 0.3), r(y0 + top + 0.02), r(cz - nz * 0.14)], size: [0.06, 0.06, 0.3], tint: IRON }); }
    /* the cloth: the field, the darker inner panel, the gold border; the swallowtail = two tails stepping to a point each */
    L(0, tail, w, body, CR, 0); L(0, tail + body * 0.06, w * 0.8, body * 0.88, CR2, 1);
    for (const s of [-1, 1]) L(s * (w / 2 - w * 0.035), tail, w * 0.07, body, GO, 2);
    L(0, top - h * 0.035, w, h * 0.035, GO, 2); L(0, tail, w, h * 0.022, GO, 2);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const tw = w * 0.5 * (1 - k * 0.24); L(s * (w / 2 - tw / 2), tail - (k + 1) * tail / 4, tw, tail / 4 + 0.002, CR, 0); L(s * (w / 2 - w * 0.035), tail - (k + 1) * tail / 4, w * 0.07, tail / 4 + 0.002, GO, 2); }
    /* the crown: a band with three jewels, five points (the middle one tallest), a pearl on each */
    const cy = tail + body * 0.66, cw = w * 0.46;
    L(0, cy, cw, body * 0.045, GO, 3); for (const k of [-1, 0, 1]) L(k * cw * 0.3, cy + body * 0.012, cw * 0.09, body * 0.022, k ? 0x2c4a9a : CR, 4);
    for (const k of [-2, -1, 0, 1, 2]) { const ph = body * (k === 0 ? 0.09 : Math.abs(k) === 1 ? 0.06 : 0.075), px = k * cw * 0.22; L(px, cy + body * 0.045, cw * 0.12, ph * 0.5, GO, 3); L(px, cy + body * 0.045 + ph * 0.5, cw * 0.07, ph * 0.5, GO, 3); L(px, cy + body * 0.045 + ph, cw * 0.09, cw * 0.09, 0xf4ecd8, 4); }
    /* the sword in the stone: pommel, grip, guard, the blade into a stepped grey stone */
    const sy = tail + body * 0.2, bl = body * 0.3;
    L(0, sy, w * 0.42, body * 0.07, ST, 3); L(0, sy + body * 0.07, w * 0.28, body * 0.04, ST, 3); L(-w * 0.08, sy + body * 0.02, w * 0.1, body * 0.02, 0x6e7074, 4);
    L(0, sy + body * 0.09, w * 0.055, bl, BL, 4); L(0, sy + body * 0.09 + bl, w * 0.24, body * 0.022, GO, 4); L(0, sy + body * 0.112 + bl, w * 0.04, body * 0.06, 0x4a3626, 4); L(0, sy + body * 0.172 + bl, w * 0.075, w * 0.075, GO, 4);
    return P;
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

/* ── THE KIT (shared: every district file builds with it through the hook's ctx; change it only with a note on the board, docs/notes/claims.md) ──
   The rows of the room (F, features), its props, doors, natives, ground marks, and the drawn looks waiting to be written (arch).
   royalBanner() above is the kit's too (sheet().banner): one banner for the whole kingdom. */
const g = gx, X = s => g(s + CX0), Z = s => g(s + CY0);   // g: a square's west / north edge (the same as gx); X / Z: the old castle squares (building() below still places with them)
const F = [], props = [], doors = [], npc = [], arch = [], marks = [];
const feat = o => F.push({ o }), raw = s => F.push({ s }), note = s => F.push({ c: s });   // (2026-11-17, THE ONE WORLD MOVE: the rows are kept as objects so the mover can stand them; written out as text at the end, byte for byte as before)
const rowText = f => f.o ? J(f.o) + ',' : f.s != null ? f.s + ',' : '/* ' + f.c + ' */';
const Q = PLAN.castle, T1 = 3.5, T2 = 7, MX = g(48);
const mid = q => [r2((g(q[0]) + g(q[2])) / 2), r2((g(q[1]) + g(q[3])) / 2)];

let archDone = 0; const flushArch = () => { for (; archDone < arch.length; archDone++) feat(arch[archDone]); };   // writes the looks building() made since the last call (a look is drawn after the walls it stands on)
/* THE CASTLE, REDESIGN 2 (2026-11-15, mondo on the built plan 3: "this whole section i outlined needs to be the castle, like an epic fantasy
   dragon quest or final fantasy or medieval castle. Disney world cinderella's palace. Hogwarts ... the way it is now is stupid because it like
   a walled off region inside a walled off region. the castle should be in the center of the map and relatively symmetrical. higher elevation
   compared to the village"; his OK on docs/plans/camelot/camelot_castle_redesign_2.png, the east lower-court building = THE ARMOURY).
   No inner curtain wall. ONE palace on a two-step stone hill (`plateau` rows: the lower court +3.5 m, the upper court +7 m): THE KEEP with the
   Throne Hall in it, two mirrored wings (Kitchen west, Barracks east), eight round towers under blue cones, the Great Spire on the Keep's roof;
   THE GRAND STAIR up from the Market, a stair from the lower court to the upper, a back stair down to the north road; the Stables and the
   Armoury as a mirrored pair in the lower court. The squares of every piece are docs/areas/camelot/layout.json `castle` (kingdom squares);
   west and east are mirror images about the room's middle line (square 48). The hill is `plateau` + `ramp` rows, never `slope.cells`
   (a sloped room makes every hqCastleTower deck NaN).
   THE HILL is here (shared ground: the village's streets and the town wall are measured from it); what stands on it is districts/K.js. */
/* ── THE HILL: two stone steps, the three stairs, the parapets on every edge ── */
note('THE HILL: the lower court (+3.5 m), the upper court (+7 m); THE GRAND STAIR, the court stair, the back stair; the parapets');
const tier = (q, h) => { const m = mid(q); feat({ k: 'plateau', x: m[0], z: m[1], w: (q[2] - q[0]) * C, d: (q[3] - q[1]) * C, h, edge: 0.2 }); };
tier(Q.hill, T1); tier(Q.upper, T2);
/* a flight runs north or south along the middle line; its head goes 0.4 m into the step it climbs so no seam is left at the top */
const flight = (q, up, h0, h1) => { const x = r2((g(q[0]) + g(q[2])) / 2), zf = up === 'N' ? g(q[3]) : g(q[1]), zh = up === 'N' ? g(q[1]) - 0.4 : g(q[3]) + 0.4;
    feat({ k: 'ramp', x0: x, z0: zf, x1: x, z1: r2(zh), w: (q[2] - q[0]) * C, h0, h1, stairs: true, model: 'stone', edge: 0.2, key: 'cobblestone', side: 'castle_wall', runner: { color: 0xa01e2c } }); };   // (its own sheets: a keyless flight wears the path under the shell's GREEN floor colour; the royal runner up the middle)
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
const G_TALL = 'urban:GlassWindowTall1a', SLATE = 'urban:MetalRoofTiles1a', WOODD = 'wood';
const STONE2 = 0xaeaaa6, STONE3 = 0xd8d2c6, BLUE = 0x4a5c8c, BANNER = 0xb02c36, GOLD = 0xd8b050;   // the kit's own palette (sheet().tower); a district file names its own colours
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
        banner(x, y, z, w, h) { royalBanner(x, y, z, w, h, 1).forEach(p => P.push(p)); },
        /* a round tower: the shaft from y0, lit slits round it, a corbelled gallery under the eaves, the blue cone, a gilt finial, the flag */
        tower(x, z, r, y0, h, ch, tint) { const top = y0 + h;
            add({ s: 'cyl', p: [x, y0, z], r, h, seg: 16 }, WALL, tint);
            add({ s: 'cyl', p: [x, top - 1.8, z], r: r + 0.5, h: 1.8, seg: 16 }, WALL, STONE3);
            add({ s: 'cyl', p: [x, top - 2.3, z], r: r + 0.25, h: 0.5, seg: 16 }, WALL, STONE2);
            for (let y = y0 + 6; y < top - 5; y += 7) add({ s: 'box', p: [x, y, z], size: [0.6, 2.4, 0.12], ring: { n: 4, r: r + 0.03, a0: 45 }, glow: 0.6 }, G_TALL, 0xf0d890);
            add({ s: 'cyl', p: [x, top - 0.3, z], r: r + 1.0, h: 0.3, seg: 16, roof: true }, WOODD, 0x4a3626);   // the eave's underside: the cone sits ON the tower (mondo: "roofs don't connect")
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
const inside = (B, key, lx, lz, o) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, o || {}); if (r.face != null) r.face = B.face(r.face); props.push(r); };   // furniture in a building: (lx, lz) in the building's frame; `face` is given in that frame too (180 = looking out of its front)
const kq = (id, q, side, h, o, parts) => building(id, q[0] - 24, q[1] - 30, q[2] - 24, q[3] - 30, side, h, o, parts);
/* what a drawn tower or drum weighs: a solid square inside its round (a texbuilding with no outside and no inside) */
const solid = (id, p, side, storeys) => feat({ k: 'texbuilding', id: 'cam:' + id, seed: 1, x: p[0], z: p[1], w: side, d: side, rot: 0, storeys, h: storeys * 3.5, skin: false, hollow: false });

/* ── THE DISTRICT FILES (2026-11-16, the one hook for the district threads; the pattern is the city's, bake-disaster-city.js): one file per
   district in docs/areas/camelot/districts/, so no district's content lands in this tool. A file may export either or both of:
     first(ctx)  right after the hill, before the moat and the town wall (the castle's rows lead the room). Only the kit is in ctx.
     build(ctx)  after every shared piece stands (moat, wall, ways, open ground, paint): the whole ctx.
   They run in ORDER (not by name: the order rows are written in is the order they are baked in, and `dec` draws from one stream of dice,
   so a changed order moves every scattered piece after it).
   ctx, the kit:  PLAN, Q (PLAN.castle), C, N, W, T1, T2, MX, WALL, r2, J, g / gx (a square's edge), gc (its middle), mid(q),
                  F, props, doors, npc, marks, arch, count, feat(row), raw(text), note(text), sheet(), building(id, q, side, h, o, parts),
                  solid(id, [x, z], side, storeys), inside(B, key, lx, lz, o), flushArch(), say(race), old.ward
   ctx, in build: cell, plot, open(x, y), WALKIN, HOUSES, taken, sq(x, y, on), put / dec(key, x, y, o, on), tree(kind, h, x, y, r),
                  native(race, x, y, face, say), many(n, f), rnd(), sayOf(room, race), old.garden, old.pole
   A file may also export (2026-11-16, the Fairy Forest thread; both are the Woods' ways, bake-woods.js):
     ground: '<sheet>'   the sheet under its own plots' grass and its trees' feet (plan letters g and t), in place of the kingdom's lawn.
     groundAlso(x, y)    with `ground`: true for a grass / tree square OUTSIDE its own plots that wears its ground too (W: the forest north of its plots).
     airZones(ctx)       its air: [{ x0, y0, x1, y1 (kingdom squares), kind, color?, n?, speed?, wind? }] (three-renderer.js _hqBuildAtmos
                         `shell.atmos.zones`: dust, motes, spores, fireflies, snow, ash, rain). With one zone from any file the shell
                         carries them all, then the kingdom's own embers over the whole room, as before.
     noTrees: [[x0, y0, x1, y1], ...]   (2026-11-16, the Snowy Pines thread) kingdom squares where the tree mass plants nothing: round a hut, a den, a pond.
   THE SNOW (2026-11-16, the Snowy Pines thread): the paint's first sheet was 'ice' (it read as pale paving tiles); it is 'calm_snow' now. Only the
   plan's `s` and `T` squares wear it, and those are all north of the moat (district N).
   A district writes its own rows with its own ids ('cam:' + ...), on its own plots. The checks at the end are everybody's: a piece on a
   square that is not free ground, a prop not in the catalogue, a plot not walked to, stops the tool. ── */
const ORDER = ['K', 'T', 'L', 'F', 'N', 'W'];
const DISTRICTS = ORDER.map(k => { const m = require(path.join(REPO, 'docs/areas/camelot/districts', k + '.js')); m._cmFile = k; return m; });
const count = {};
const ctx = { PLAN, Q, C, N, W, T1, T2, MX, WALL, r2, J, g, gx, gc, mid, F, props, doors, npc, marks, arch, count, feat, raw, note, sheet, building: kq, solid, inside, flushArch, say, old: { ward: OLD } };
const run = (stage, ids) => DISTRICTS.forEach(m => { if ((!ids || ids.indexOf(m._cmFile) >= 0) && typeof m[stage] === 'function') m[stage](ctx); });
run('first');
/* the two links that end on the castle's ground (DOOR_HQ.links rows; data.js carries them by hand, printed below) */
const ends = { haunted_camelot: { wall: 'free', x: r2(mid(Q.westWing)[0] - 7.3), z: r2(g(Q.westWing[3]) + 1.6), face: 180 }, well_camelot: { wall: 'free', x: g(53.5), z: g(56.6), face: 180 } };

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

let seed = 64; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const cell = PLAN.cells.map(r => r.split(''));
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); plot[p.id] = p; });
const inCastle = (x, y) => [Q.hill, Q.grandStair, Q.backStair].some(q => x >= q[0] && x < q[2] && y >= q[1] && y < q[3]);
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
const townArch = sheet();
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
/* the `oldgarden` gap in the west hedge is GONE (2026-11-16, mondo: "can we remove all of the old sites from the game, if we already rebuilt them with plots"):
   the old Looking-Glass Garden room is retired into district L (data.js DOOR_HQ.retired); the barbershop mirror lands in L now (MIRROR_BARBER below) */
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
/* the paint: snow under the pines (the calm snow sheet; it was the ice sheet until 2026-11-16), the trodden snow road, the forest's
   dirt, the village's cobbles, the garden's marble, the ground under the hedges */
/* the castle's ground: marble on the upper court, cobbles on the lower court and the stairs, grass under the orchard rows */
const castlePaint = (x, y) => { const u = Q.upper; if (x >= u[0] && x < u[2] && y >= u[1] && y < u[3]) return 5; return (y >= 34 && y < 52 && (x < 31 || x >= 65)) ? 0 : 4; };
const PAL = ['calm_snow', 'ice_1', 'dirt_2', 'cobblestone', 'marble', 'igloo', 'leaves_3'], paint = new Uint8Array(W * W);
for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x];
    paint[y * W + x] = ch === 'Q' ? castlePaint(x, y) : (ch === 's' || ch === 'T') ? 1 : ch === 'p' ? 3 : (ch === 'c' || ch === 'b') ? 4 : (ch === 'm' || ch === 'x' || ch === 'X') ? 5 : ch === 'i' ? 6 : ch === 'h' ? 7 : 0; }

/* a district's own ground (its file's `ground`): under its plots' grass and its trees */
{ const at = {}; PLAN.plots.forEach(p => { at[p.x + ':' + p.y] = p.district; });
  DISTRICTS.forEach(m => { if (!m.ground) return; let i = PAL.indexOf(m.ground); if (i < 0) { PAL.push(m.ground); i = PAL.length - 1; }
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x]; if ((ch === 'g' || ch === 't') && (at[Math.floor(x / N) + ':' + Math.floor(y / N)] === m._cmFile || (typeof m.groundAlso === 'function' && m.groundAlso(x, y)))) paint[y * W + x] = i + 1; } }); }   // groundAlso(x, y) (2026-11-16, the Forest thread): squares outside its own plots that wear its ground too (the forest runs north of plot row 7 to the moat's bank)

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

/* ── THE DISTRICTS BUILD (the village first, then the road home, then the woods west, east, north, south: the baked order) ── */
Object.assign(ctx, { cell, plot, open, WALKIN, HOUSES, taken, sq, put, dec, tree, native, many, rnd, sayOf, old: { ward: OLD, garden: OG, pole: ONP } });
sq(7, 51);   // THE BARBERSHOP MIRROR's square (2026-11-16, link `mirror_lookingglass` end b: DOOR HQ's barbershop mirror opens here, two squares north of the Astral mirror; was the old garden room)
sq(7, 53);   // THE MIRROR's square (its door is a way out of the zone: written below, after the districts), kept clear of the garden's dressing
run('build', ['K', 'T']);
/* the road in from DOOR HQ: the portcullis stands at the room's south wall, in the forest; the drawbridge is ahead */
props.push({ key: 'brazier', x: r2(BAYX - 5.25), z: gc(94) }, { key: 'brazier', x: r2(BAYX + 5.25), z: gc(94) }); put('signpost', 44, 91);
run('build', ['L', 'F', 'N', 'W']);
{ const m = OG.d.find(d => d.id === 'astral');   // THE MIRROR (in the Looking-Glass Garden, P00-04): the old garden's frame with nothing in it, with its own words
  /* THE ASTRAL REALM ON PLOTS (2026-11-16, mondo: "just add some sort of door from th looking garden to the astral sea of possibility"): the mirror opens on the Mirror's island in the Sea of Possibility (bake-astral.js door `mirror`, which leads back here) */
  doors.push({ id: 'mirror', wall: 'free', x: gc(7), z: gc(53), face: 180, leaf: m.leaf, label: 'THE ASTRAL REALM · THE SEA OF POSSIBILITY', sub: 'THE FRAME WITH NOTHING IN IT · THE OTHER SIDE OF THE GLASS', action: { room: 'site_prebuilt_lookingglass_realm', at: 'mirror' }, desc: 'A second mirror frame with no glass in it, at the back of the garden where the hedges stop pretending. Through it, a violet sky and an island with nothing under it.' }); }

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
const SNOW = ['xmas_snow_pine', 'xmas_snow_pine_2', 'xmas_snow_pine_3'], FAE = ['fae_cap', 'tree_3', 'fae_bloom_tree_pink', 'fae_cap_2', 'tree', 'tree_2', 'fae_cap', 'tree_3', 'fae_bloom_tree', 'fae_cap_2', 'tree', 'tree_2', 'tree_3', 'fae_bloom_tree_violet', 'tree', 'tree_2'];   // THE GIANT FLOWERS (2026-11-16, mondo "yes do that"): three of the sixteen draws of the east woods' mass are the heal flower grown to a tree (three of eight cost the pond view half its frame rate)
const zone = (x0, y0, x1, y1, o) => Object.assign({ x0: gx(x0), z0: gx(y0), x1: gx(x1), z1: gx(y1) }, o);
/* a district's own clearings in the tree mass (its file's `noTrees`: [[x0, y0, x1, y1] kingdom squares]): a walked-into building or a ghost wall is
   SOLID to the tree grower, which rings it with trunks (one stood in a hut's doorway). These zones come first: the first zone a trunk stands in wins. */
const NOTREE = [].concat(...DISTRICTS.filter(m => Array.isArray(m.noTrees)).map(m => m.noTrees.map(q => zone(q[0], q[1], q[2], q[3], { none: true }))));
const ZONES = NOTREE.concat([zone(0, 0, W, 17, { kinds: SNOW, treeH: [5.5, 8] }), zone(0, 17, 14, 79, { none: true }), zone(82, 17, W, 79, { kinds: FAE })]);
/* THE AIR BY DISTRICT (the district files' `airZones`); none = the shell as it was (the site's embers) */
const AIR = [].concat(...DISTRICTS.filter(m => typeof m.airZones === 'function').map(m => m.airZones(ctx).map(z => { const q = Object.assign({}, z, { x0: gx(z.x0), z0: gx(z.y0), x1: gx(z.x1), z1: gx(z.y1) }); delete q.y0; delete q.y1; return q; })));
const ATMOS = AIR.length ? ", atmos: " + J({ kind: 'embers', n: 160, tier: 'open', zones: AIR.concat([{ x0: -HALF, z0: -HALF, x1: HALF, z1: HALF, kind: 'embers', n: 160 }]) }) : "";
const LINES = OLD.l.concat(OG.l), M = [];
M.push("        /* CAMELOT-KINGDOM-BEGIN — CAMELOT KINGDOM ON PLOTS, PLAN 3 (2026-11-15): written by `node bake-camelot.js` from docs/areas/camelot/layout.json. Never hand-edit between the markers; edit the tool or the layout and rerun. */");
M.push("        site_prebuilt_camelot_kingdom: {");
M.push("            label: 'CAMELOT KINGDOM',");
M.push("            sub: 'THE CASTLE · THE VILLAGE · THE TOWN WALL · THE MOAT · THE WOODS',");
M.push("            kind: 'box', site: 'prebuilt_camelot', part: 'kingdom',");
M.push("            shell: hqCastleShell({ w: " + (2 * HALF) + ", d: " + (2 * HALF) + ", plate: { x: " + BAYX + ", z: " + gc(93) + ", y: 4.4 }" + ATMOS + " }),");
M.push("            parti: 'A castle in the middle of its village, one wall round them both, a moat round the wall and the woods round the moat: snowy pines to the north, a forest that glows to the east, a hedge garden to the west, and the road home to the south.',");
M.push("            typology: 'grid',");
M.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + G + ", names: " + J(PLAN.plots.map(p => [p.id, p.name, p.district, p.level])) + " },");
M.push("            terrain: {");
M.push("                res: 1.75, floor: 'grass_2', cliff: 'castle_wall', path: 'cobblestone',   // half a square a node: the room is 336 m, and the castle's rows are dear a node (0.875 took four times as long to stand up)");
M.push("                noise: { amp: 0, scale: 8 },");
M.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gc(0) + ", z0: " + gc(0) + ", nx: " + W + ", nz: " + W + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
M.push("                gen: { kind: 'plan', look: 'trees', seed: 64, rim: 0, forceGrow: 0, treeGap: 2.6, treeIn: 0.9, spacing: 3.5, depth: 5.25, maxTrees: 3200, treeH: [5.5, 8.5], kinds: ['tree', 'tree_2', 'tree_3', 'tree', 'tree_5', 'tree_2'], zones: " + J(ZONES) + " },");
M.push("                features: [");
F.forEach(f => M.push("                    " + rowText(f)));
M.push("                ],");
M.push("                marks: " + J(marks) + ",");
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
const ENDS = { mirror_lookingglass: { wall: 'free', x: gc(7), z: gc(51), face: 180 }, bay: { wall: 's', x: BAYX }, woods_camelot: { wall: 'e', z: WAYS.trail }, northpole_camelot: { wall: 'n', x: WAYS.sleigh }, haunted_camelot: ends.haunted_camelot, well_camelot: ends.well_camelot };
console.log('ends ' + JSON.stringify(ENDS));

/* ══ THE ONE WORLD MOVE (2026-11-17, mondo's approved map v13; docs/plans/one-world/BUILD_PLAN.md phase 3, wave A, the Camelot row:
   "castle + village stay; the Snowy Pines north, the Looking-Glass Garden west to the coast, the Fairy Forest east to the Spring, the Forest south").
   Everything above builds the kingdom in THE HOME FRAME, the 8 x 8 room the six district files were written for. Nothing above changed (the
   kingdom room above is still made, byte for byte, and `--home` writes it as it was). Here the result is stood where the One World map puts it
   (docs/plans/one-world/plots.json; the mover = ow-move.js), FIVE rooms by the room-splitting rule (docs/notes/areas-complexes.md "ONE WORLD,
   THE ROOM-SPLITTING RULE": a district is never cut; two zones never join; 30 plots a room):
     THE CASTLE + THE VILLAGE (K, T: 36 plots, one district on the map) keep the room id site_prebuilt_camelot_kingdom, 6 x 6 at -29,-3. Its
       plots stand as they stood to each other, so every piece keeps its place (the box is the home's middle 6 x 6: dx = dz = 0). Over 30 plots:
       the rule's first line wins (it is one district). Its four ways out are seams into the four woods' rooms.
     THE SNOWY PINES (N, 8)         -> site_prebuilt_camelot_ow_pines, a path north from the north gate, 2 x 7 at -26,-10; the trail L6 north to the
                                       Mountains is the route kit's room site_ow_l6 (bake-route.js L6, after this tool)
     THE LOOKING-GLASS GARDEN (L, 6) -> site_prebuilt_camelot_ow_garden, a path west from the west gate, 4 x 3 at -33,-1
     THE FAIRY FOREST (F, 6)        -> site_prebuilt_camelot_ow_fairy, a path east from the east gate to the Spring, 4 x 3 at -23,-1; the trail L4 on to
                                       the Woods' Clearing is the Woods zone's room site_ow_l4 (the link woods_camelot is that seam)
     THE FOREST (W, 8) + L7 (1)     -> site_prebuilt_camelot_ow_forest, a path south from the drawbridge, 4 x 5 at -26,3; L7 (one plot, rule 4: it joins
                                       the district it touches) is built here and leads on to the Woods' Ritual Ground
   A plot keeps its name, its squares and every piece on it; its id is its place in its new room's grid. What is laid again is the tool's own:
   the joints between plots that touch now and did not (a trail three squares wide from each plot's own open ground), the open ground, the
   paint, the tree mass's kinds and the air (each box cut to the plots it covered and moved with them), the doors on the seams, the link ends.
   Rules: docs/notes/areas-complexes.md "ONE WORLD, HOW A ZONE MOVES" + "CAMELOT KINGDOM, THE ONE WORLD MOVE". ══ */
const OW_HOME = process.argv.includes('--home');
const PJ = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/plans/one-world/plots.json'), 'utf8'));
const OWP = require('./ow-places.js');
const KROOM = 'site_prebuilt_camelot_kingdom', R_PINES = 'site_prebuilt_camelot_ow_pines', R_GARDEN = 'site_prebuilt_camelot_ow_garden', R_FAIRY = 'site_prebuilt_camelot_ow_fairy', R_FOREST = 'site_prebuilt_camelot_ow_forest';
const R_RITUAL = 'site_prebuilt_fairy_forest_ow_ritual', R_L6 = 'site_ow_l6';
const RITUAL_STANDS = /\bsite_prebuilt_fairy_forest_ow_ritual: \{/.test(fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8'));   // the Woods zone thread writes that room; rerun this tool after it lands
const v13 = id => { const d = PJ.districts.find(q => q.id === id); if (!d || !d.today || d.today.room !== KROOM) throw new Error('plots.json has no Camelot district ' + id);
    return d.plots.map(q => { const p = plot[q.was]; if (!p || p.name !== q.n) throw new Error('plots.json and the layout disagree on ' + q.was + ' ' + q.n); return { id: q.was, wx: q.x, wy: q.y }; }); };
/* THE DRAWN ROWS WIDE AS A DISTRICT: a drawn row (`k: 'arch'`) whose parts stand on several plots (a district's whole dressing in one row,
   `cam:w:forest`, `cam:l:garden`, `cam:n:dress`) is cut into one row a plot (`<id>@<plot>`), each part where it stood, so each moves with its plot.
   THE RIDGE (`cam:n:ridge`, the crags along the room's north edge, the rank past it and the Pass round the sleigh road): a part of the edge ranks
   stays only where the side it backs still faces the open map (no plot past it); THE PASS (the two gate crags, the cleft, the snow, the far
   peak) stands as one piece on the path's north end, round the trail L6 leaves by. */
const HHALF = HALF;
const homeOf = (x, z) => plot['P' + String(Math.max(0, Math.min(G - 1, Math.floor((x + HHALF) / PL)))).padStart(2, '0') + '-' + String(Math.max(0, Math.min(G - 1, Math.floor((z + HHALF) / PL)))).padStart(2, '0')];
const partXZ = (a, p) => { const q = (a.rot || 0) * Math.PI / 180, c = Math.cos(q), s = Math.sin(q), lx = p.p ? p.p[0] : 0, lz = p.p ? p.p[2] : 0; return [a.x + lx * c - lz * s, a.z + lx * s + lz * c]; };
const SOLIDC = ch => ch === 't' || ch === 'T' || ch === 'h', ROADS = 'picbm';
const SIDE4 = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] }, OPP = { N: 'S', S: 'N', W: 'E', E: 'W' }, FACE = { N: 180, E: 270, S: 0, W: 90 };
const LETTER = { K: 'c', T: 'c', N: 'i', L: 'm', F: 'p', W: 'p', R: 'p' };   // the ground a new joint is laid in: the snow road, the garden's marble walk, the woods' dirt
/* THE STAND LIST: the rooms, what stands in each, its seams to the others. A seam: '<home plot>:<side>' on both sides, `k` = the squares of the
   side the way crosses on (left out: where both are open already, else the plot's middle). `way`: 'trail' (an arch in the trees) or 'open'. */
const L7 = (() => { const l = PJ.links.find(q => q.id === 'L7'); if (!l || l.plots.length !== 1) throw new Error('plots.json: L7 is not one plot'); return { wx: l.plots[0][0], wy: l.plots[0][1] }; })();
/* a spawn's face: 0 north (-z), 90 east, 180 south, 270 west (data.js HQ_HEAL_ZONE: ahead = sin, -cos); each wood room's spawn stands by its seam to the block and faces away from it, into the wood */
const STAND = [
    { id: KROOM, part: 'kingdom', label: 'CAMELOT KINGDOM', sub: 'THE CASTLE · THE VILLAGE · THE TOWN WALL · THE MOAT · 36 PLOTS', list: v13('cam'), letters: ['K', 'T'], block: true,
      parti: 'A castle in the middle of its village, one wall round them both and a moat round the wall; four roads leave by the four gates into four woods: snowy pines to the north, a forest that glows to the east, a hedge garden to the west, the forest and the road home to the south.',
      spawn: [43, 81], face: 0 },
    { id: R_PINES, part: 'ow_pines', label: 'THE SNOWY PINES', sub: 'CAMELOT · THE SLEIGH ROAD NORTH · 8 PLOTS', list: v13('camN'), letters: ['N'], spawn: 'P04-00', face: 0,
      parti: 'The snowy pines north of the moat as one walk: the sleigh road climbs north from the castle’s north gate through eight plots of snow and pines, past the huts, the frozen pond and the cave, to the Pass where the trail goes on into the mountains.' },
    { id: R_GARDEN, part: 'ow_garden', label: 'THE LOOKING-GLASS GARDEN', sub: 'CAMELOT · THE HEDGES WEST OF THE MOAT · 6 PLOTS', list: v13('camL'), letters: ['L'], spawn: 'P00-02', face: 270,
      parti: 'The hedge garden west of the moat as one walk: in from the west gate across the lawn, the chessboard with a hedge to either side, the mirror, and at the far end the tea party.' },
    { id: R_FAIRY, part: 'ow_fairy', label: 'THE FAIRY FOREST', sub: 'CAMELOT · THE GLOWING WOODS EAST OF THE MOAT · 6 PLOTS', list: v13('camF'), letters: ['F'], spawn: 'P07-02', face: 90,
      parti: 'The forest that glows, east of the moat, as one walk: out of the east gate past the knoll to the pond, the fairy ring between its two knolls, the woods trail and the spring, where the trail goes on east to the Woods.' },
    { id: R_FOREST, part: 'ow_forest', label: 'THE FOREST', sub: 'CAMELOT · THE CROWN’S ROAD SOUTH · 9 PLOTS', list: v13('camW').concat([{ wx: L7.wx, wy: L7.wy, name: 'The Forest Trail', district: 'W', level: 0, isNew: true, link: 'L7' }]), letters: ['W'], spawn: 'P03-07', face: 180,
      parti: 'The forest south of the moat as one walk: the Crown’s Road down from the drawbridge, the glades, the woodcutter’s hut and the dead tree, and east a trail on through the trees to the Woods’ Ritual Ground.' },
];
/* which plots move the same way (one room, one shift): a drawn row is cut only between plots that do not */
const MOVE_OF = {}, CLASS_HEAD = {};
STAND.forEach(S => S.list.forEach(p => { if (!p.id || p.isNew) return; const h = plot[p.id], c = S.id + ':' + (p.wx - h.x) + ',' + (p.wy - h.y); MOVE_OF[p.id] = c; if (!CLASS_HEAD[c]) CLASS_HEAD[c] = p.id; }));
PLAN.plots.forEach(p => { if (!MOVE_OF[p.id]) throw new Error('the One World move leaves out ' + p.id + ' ' + p.name); });
const SPLIT = [], RIDGE = { parts: [], pass: [] };
F.forEach(f => { const a = f.o; if (!a || a.k !== 'arch' || !Array.isArray(a.parts) || !a.parts.length) return;
    if (a.id === 'cam:n:ridge') { a.parts.forEach(p => { const [x, z] = partXZ(a, p); (Math.abs(x) < 16 && z < -HHALF + 14 ? RIDGE.pass : RIDGE.parts).push(p); }); f.ridge = a; return; }
    const by = {}; a.parts.forEach(p => { const [x, z] = partXZ(a, p), h = homeOf(x, z), c = MOVE_OF[h.id]; (by[c] || (by[c] = [])).push(p); });
    const ids = Object.keys(by).map(c => CLASS_HEAD[c]); if (ids.length < 2) return;   // every part on plots that move the same way: the row moves whole
    if (a.rot) { SPLIT.push(a.id + ' (turned ' + a.rot + ', ' + ids.length + ' plots: left whole on ' + homeOf(a.x, a.z).name + ')'); return; }
    f.split = Object.keys(by).map(c => { const id = CLASS_HEAD[c], h = plot[id], cx = r2(-HHALF + (h.x + 0.5) * PL), cz = r2(-HHALF + (h.y + 0.5) * PL);
        return Object.assign({}, a, { id: a.id + '@' + id, x: cx, z: cz, parts: by[c].map(p => Object.assign({}, p, { p: [r2(p.p[0] + a.x - cx), p.p[1], r2(p.p[2] + a.z - cz)] })) }); }); });
const FO = [].concat(...F.filter(f => f.o && !f.ridge).map(f => f.split || [f.o]));
const MOVER = require('./ow-move.js')({ cols: G, rows: G, cell, fill: 't', plots: PLAN.plots, features: FO, props, npc, doors });
/* the seams between the rooms (both sides are this tool's) */
const SEAMS = [
    { a: [KROOM, 'P04-01', 'N'], b: [R_PINES, 'P04-00', 'S'], k: [1, 2, 3], ch: 'i', way: 'trail', la: ['THE SNOWY PINES', 'THE NORTH GATE · THE SLEIGH ROAD NORTH', 'The road out of the north gate turns to snow under the pines.'], lb: ['CAMELOT KINGDOM', 'THE SLEIGH ROAD · SOUTH TO THE NORTH GATE', 'The road comes down out of the pines to the moat and the north gate.'] },
    { a: [KROOM, 'P01-04', 'W'], b: [R_GARDEN, 'P00-02', 'E'], ch: 'p', way: 'trail', la: ['THE LOOKING-GLASS GARDEN', 'THE WEST GATE · THE HEDGES', 'Past the ring road the hedges start, cut very square.'], lb: ['CAMELOT KINGDOM', 'THE LAWN · BACK TO THE WEST GATE', 'Through the hedge, the ring road round the moat and the west gate.'] },
    { a: [KROOM, 'P06-04', 'E'], b: [R_FAIRY, 'P07-02', 'W'], ch: 'p', way: 'trail', la: ['THE FAIRY FOREST', 'THE EAST GATE · THE GLOWING WOODS', 'The trees past the ring road are lit from inside.'], lb: ['CAMELOT KINGDOM', 'THE POND · BACK TO THE EAST GATE', 'Out of the glowing trees, the ring road and the east gate.'] },
    { a: [KROOM, 'P04-06', 'S'], b: [R_FOREST, 'P03-07', 'N'], k: [6, 7], ch: 'p', way: 'trail', la: ['THE FOREST', 'THE CROWN’S ROAD · SOUTH INTO THE FOREST', 'The ring road meets the Crown’s Road going south into the forest.'], lb: ['CAMELOT KINGDOM', 'THE CROWN’S ROAD · NORTH TO THE MOAT', 'The road runs north out of the trees to the moat.'] },
];
/* the ways out of the zone, and the link ends (data.js DOOR_HQ.links: this tool writes their Camelot ends) */
const OUT = {
    [R_PINES]: [ { plot: 'P07-00', side: 'N', k: [5, 6], id: 'ow_h_m25_m10', way: 'trail', room: R_L6, label: 'THE TRAIL · THE MOUNTAINS', sub: 'THE PASS · UP TO THE SKI LODGE', desc: 'The trail goes on north through the Pass, up out of the pines towards the mountains.' },
                 { plot: 'P07-00', side: 'E', link: 'northpole_camelot', end: 'b' } ],
    [R_FAIRY]: [ { plot: 'P07-05', side: 'E', link: 'woods_camelot', end: 'b' } ],
    [R_FOREST]: [ { plot: 'L7', side: 'E', id: 'ow_v_m22_6', way: 'trail', room: R_RITUAL, label: 'THE WOODS · THE RITUAL GROUND', sub: 'THE TRAIL EAST · THE MOUND', desc: 'A trail east through the trees, worn by feet going one way.' } ],
};
const ROOMS_OUT = [], STRAYS = SPLIT.map(s => 'a drawn row over several plots, turned: ' + s), LINKS_OUT = {}, CNT = {};
const roomOf = id => ROOMS_OUT.find(o => o.S.id === id);
STAND.forEach(S => {
    const R = MOVER.room(S.list.map(p => p.isNew ? { wx: p.wx, wy: p.wy, name: p.name, district: p.district, level: 0 } : p));
    R.strays.forEach(t => STRAYS.push(S.label + ': ' + t));
    S.list.forEach(p => { if (p.isNew) { const e = R.at[(p.wx - R.wx) + ',' + (p.wy - R.wy)]; e.id = p.link; e.link = p.link; R.ofHome[p.link] = e; } });
    const Wn = R.W, Dn = R.D, c2 = R.cell, inR = (x, y) => x >= 0 && y >= 0 && x < Wn && y < Dn;
    const openR = (x, y) => inR(x, y) && !!R.plotOfSq(x, y) && !SOLIDC(c2[y][x]);
    /* the paint: each plot's own block, as the home painted it */
    const pnt = new Uint8Array(Wn * Dn);
    R.order.forEach(e => { if (!e.home) return; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) pnt[(e.row * N + ly) * Wn + e.col * N + lx] = paint[(e.home.y * N + ly) * W + e.home.x * N + lx]; });
    /* a new plot (L7): the woods' forest, a clearing in its middle for the place */
    R.order.forEach(e => { if (e.home) return; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) c2[e.row * N + ly][e.col * N + lx] = (lx >= 3 && lx <= 8 && ly >= 3 && ly <= 8 && (lx - 5.5) * (lx - 5.5) + (ly - 5.5) * (ly - 5.5) < 9) ? 'g' : 't'; });
    const sqOf = (x, z) => [Math.floor((x + R.HX) / C + 1e-9), Math.floor((z + R.HZ) / C + 1e-9)];
    const stood = new Set(); R.props.forEach(p => stood.add(sqOf(p.x, p.z).join(':'))); R.npc.forEach(n => stood.add(sqOf(n.x, n.z).join(':')));
    R.features.forEach(f => { if (f.x != null && f.k !== 'tree' && f.k !== 'scatter' && f.k !== 'space' && f.k !== 'arch') stood.add(sqOf(f.x, f.z).join(':')); });
    ROOMS_OUT.push({ S, R, c2, pnt, openR, inR, sqOf, stood, extraF: [], extraP: [], doorsOut: [], ways: [], laid: 0, joints: 0 });
});
/* ── the joints and legs (every room): a border square of a plot side, a plot's own open ground (its hub), a leg = a dog-leg trail from the hub to the side, 3 wide ── */
const border = (e, sd, k) => sd === 'N' ? [e.col * N + k, e.row * N] : sd === 'S' ? [e.col * N + k, e.row * N + N - 1] : sd === 'W' ? [e.col * N, e.row * N + k] : [e.col * N + N - 1, e.row * N + k];
function hubOf(o, e) { let best = null; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { const x = e.col * N + lx, y = e.row * N + ly; if (!o.openR(x, y) || o.c2[y][x] === 'w' || (o.apronSq && o.apronSq.has(x + ':' + y))) continue;
        const d = Math.hypot(lx - 5.5, ly - 5.5) - (ROADS.indexOf(o.c2[y][x]) < 0 ? 0.6 : 0); if (!best || d < best[0]) best = [d, x, y]; }
    if (!best) throw new Error(o.S.id + ': no open ground on ' + e.name); return [best[1], best[2]]; }
function lay(o, e, x, y, ch) { if (!o.inR(x, y) || o.R.plotOfSq(x, y) !== e) return; if (SOLIDC(o.c2[y][x])) { o.c2[y][x] = ch; o.laid++; o.pnt[y * o.R.W + x] = ch === 'i' ? 6 : ch === 'm' ? 5 : ch === 'c' ? 4 : 3; } }
const letterOf = e => LETTER[e.district] || 'p';
/* is the border square (bx, by) reached from the plot's hub inside the plot? */
function reachIn(o, e, bx, by) { const h = hubOf(o, e), seen = new Set([h.join(':')]), st = [h];
    while (st.length) { const [x, y] = st.pop(); if (x === bx && y === by) return true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy, k = X + ':' + Y; if (!seen.has(k) && o.openR(X, Y) && o.R.plotOfSq(X, Y) === e && o.c2[Y][X] !== 'w') { seen.add(k); st.push([X, Y]); } } }
    return false; }
function leg(o, e, sd, k, ch0) { const [tx, ty] = border(e, sd, k); if (reachIn(o, e, tx, ty)) return;
    const [hx, hy] = hubOf(o, e), ch = ch0 || letterOf(e), run = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const x = n ? Math.round(x0 + (x1 - x0) * i / n) : x0, y = n ? Math.round(y0 + (y1 - y0) * i / n) : y0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) lay(o, e, x + a, y + b, ch); } };
    if (sd === 'N' || sd === 'S') { run(hx, hy, tx, hy); run(tx, hy, tx, ty); } else { run(hx, hy, hx, ty); run(hx, ty, tx, ty); } }
const openK = (o, e, sd) => { const r = []; for (let k = 0; k < N; k++) { const q = border(e, sd, k); if (o.openR(q[0], q[1])) r.push(k); } return r; };
function pickK(oa, ob) { const both = oa.filter(k => ob.indexOf(k) >= 0), src = both.length >= 2 ? both : (oa.length ? oa : ob);
    if (!src.length) return [5, 6, 7];
    let best = [src[0], src[0]], a = src[0]; for (let i = 1; i <= src.length; i++) { if (i === src.length || src[i] !== src[i - 1] + 1) { if (src[i - 1] - a > best[1] - best[0]) best = [a, src[i - 1]]; a = src[i]; } }
    const m = Math.round((best[0] + best[1]) / 2); return [Math.max(1, m - 1), m, Math.min(N - 2, m + 1)].filter((v, i, s) => s.indexOf(v) === i); }
/* THE APRON: a door is walked into head-on, so its squares are open three deep straight in from the side (a leg alone may reach the border square
   sideways along the wall: the first walk of the north gate hit the pines one square in) */
const INW = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
function apron(o, e, sd, ks, ch) { const A = o.apronSq || (o.apronSq = new Set()); ks.forEach(k => { const q = border(e, sd, k); for (let d = 0; d < 3; d++) { const x = q[0] + INW[sd][0] * d, y = q[1] + INW[sd][1] * d; if (o.inR(x, y) && SOLIDC(o.c2[y][x])) A.add(x + ':' + y); lay(o, e, x, y, ch || letterOf(e)); } }); }   // (a hub is never an apron square: the leg still runs from the plot's own ground)
function crossK(oA, A, sd, oB, B, ks, chA, chB) { const o2 = OPP[sd]; apron(oA, A, sd, ks, chA); apron(oB, B, o2, ks, chB);
    const m = ks[Math.floor((ks.length - 1) / 2)]; leg(oA, A, sd, m, chA); leg(oB, B, o2, m, chB); }
/* 1. inside each room: two plots that touch now and did not touch that way at home get one crossing */
ROOMS_OUT.forEach(o => { if (o.S.block) return; const R = o.R;
    R.order.forEach(A => ['E', 'S'].forEach(sd => { const B = R.at[(A.col + SIDE4[sd][0]) + ',' + (A.row + SIDE4[sd][1])]; if (!B) return;
        if (A.home && B.home && B.home.x - A.home.x === SIDE4[sd][0] && B.home.y - A.home.y === SIDE4[sd][1]) return;   // they touched that way at home: the joint is as it was
        crossK(o, A, sd, o, B, pickK(openK(o, A, sd), openK(o, B, OPP[sd]))); o.joints++; })); });
/* 2. the seams between the rooms: the crossing on both sides, a `trail` door pair with the seam's id on its middle */
function doorAt(o, e, sd, ks) { (o.usedSides || (o.usedSides = new Set())).add(e.col + ',' + e.row + ':' + sd); const R = o.R, along = (ks[0] + ks[ks.length - 1] + 1) / 2, ns = sd === 'N' || sd === 'S';
    const onWall = (sd === 'N' && e.row === 0) || (sd === 'S' && e.row === R.rows - 1) || (sd === 'W' && e.col === 0) || (sd === 'E' && e.col === R.cols - 1);
    const q = border(e, sd, Math.floor(along - 0.01)), d = { wall: onWall ? sd.toLowerCase() : 'free' };
    if (onWall) { if (ns) d.x = R.gx(e.col * N + along); else d.z = R.gz(e.row * N + along); if (onWall) o.ways.push({ side: d.wall, at: ns ? d.x : d.z }); }
    else { d.x = ns ? R.gx(e.col * N + along) : R.gcx(q[0]); d.z = ns ? R.gcz(q[1]) : R.gz(e.row * N + along); d.face = FACE[sd]; d.passage = Object.assign({}, MOVER.FREE_PASS); }
    return d; }
SEAMS.forEach(s => { const oA = roomOf(s.a[0]), oB = roomOf(s.b[0]), A = oA.R.ofHome[s.a[1]], B = oB.R.ofHome[s.b[1]];
    if (!A || !B) throw new Error('seam on a plot not in its room: ' + s.a.join(':') + ' | ' + s.b.join(':'));
    if (A.wx + SIDE4[s.a[2]][0] !== B.wx || A.wy + SIDE4[s.a[2]][1] !== B.wy) throw new Error('the seam ' + s.a.join(':') + ' | ' + s.b.join(':') + ' does not touch on the map');
    const ks = s.k || pickK(openK(oA, A, s.a[2]), openK(oB, B, s.b[2])); crossK(oA, A, s.a[2], oB, B, ks, s.ch);
    const id = oA.R.seamId(A, s.a[2]);
    oA.doorsOut.push(Object.assign({ id }, doorAt(oA, A, s.a[2], ks), { way: s.way, label: s.la[0], sub: s.la[1], action: { room: s.b[0], at: id }, desc: s.la[2] }));
    oB.doorsOut.push(Object.assign({ id }, doorAt(oB, B, s.b[2], ks), { way: s.way, label: s.lb[0], sub: s.lb[1], action: { room: s.a[0], at: id }, desc: s.lb[2] })); });
/* 3. the ways out of the zone + the link ends */
Object.keys(OUT).forEach(rid => { const o = roomOf(rid); OUT[rid].forEach(w => { const e = o.R.ofHome[w.plot]; if (!e) throw new Error('no plot ' + w.plot + ' in ' + rid);
    const ks = w.k || pickK(openK(o, e, w.side), []); apron(o, e, w.side, ks); leg(o, e, w.side, ks[Math.floor((ks.length - 1) / 2)]);
    const d = doorAt(o, e, w.side, ks);
    if (w.link) { LINKS_OUT[w.link] = [w.end, Object.assign({ part: o.S.part }, d)]; return; }
    if (w.id !== o.R.seamId(e, w.side)) throw new Error('the seam id of ' + w.plot + ' ' + w.side + ' is ' + o.R.seamId(e, w.side) + ', not ' + w.id);
    o.doorsOut.push(Object.assign({ id: w.id }, d, { way: w.way, label: w.label, sub: w.sub, action: { room: w.room, at: w.id }, desc: w.desc })); }); });
/* the link ends that moved with their plots (the tool's own list, `ENDS` below the home room) */
{ const HOME_LINKS = { mirror_lookingglass: ['b', { wall: 'free', x: gc(7), z: gc(51), face: 180 }], haunted_camelot: ['b', ends.haunted_camelot], well_camelot: ['a', ends.well_camelot] };
  Object.keys(HOME_LINKS).forEach(id => { const [side, h] = HOME_LINKS[id], hp = MOVER.homePlot(h.x, h.z), o = ROOMS_OUT.find(q => q.R.ofHome[hp.id]), e = o.R.ofHome[hp.id];
      LINKS_OUT[id] = [side, Object.assign({ part: o.S.part }, h, { x: r2(h.x + e.dx), z: r2(h.z + e.dz) })]; }); }
/* 4. the doors the rooms carry from home (the mover stood them): the palace's four, the mirror, the dead tree */
ROOMS_OUT.forEach(o => { o.R.doors.forEach(d => { const q = Object.assign({}, d); delete q.side; delete q.plot;
    if (q.id === 'deadtree') q.action = RITUAL_STANDS ? { room: R_RITUAL, at: 'lookingglass' } : q.action;   // (until the Woods' move lands, the door keeps the Woods room it had)   // THE DEAD TREE: the Woods' Ritual Ground stands in its own room now (the Woods zone thread, 2026-11-17)
    o.doorsOut.unshift(q); }); });
/* 5. THE RIDGE + THE PASS (district N's `cam:n:ridge`, stood as said above) */
{ const o = roomOf(R_PINES), R = o.R, rows = [], keep = [], drop = [];
  const a0 = F.find(f => f.ridge).ridge;
  RIDGE.parts.forEach(p => { const [x, z] = partXZ(a0, p), h = homeOf(x, z), e = R.ofHome[h.id]; if (!e) { drop.push(p); return; }
      const out = z < -HHALF + 14 ? 'N' : x < -HHALF + 14 ? 'W' : x > HHALF - 14 ? 'E' : null;   // the edge ranks: the 14 m along the home room's north, west and east edges (and past them)
      const past = out && R.at[(e.col + SIDE4[out][0]) + ',' + (e.row + SIDE4[out][1])];
      if (out && past) { drop.push(p); return; }
      (keep[h.id] || (keep[h.id] = [])).push(p); });
  Object.keys(keep).forEach(id => { const h = plot[id], e = R.ofHome[id], cx = r2(-HHALF + (h.x + 0.5) * PL), cz = r2(-HHALF + (h.y + 0.5) * PL);
      rows.push(Object.assign({}, a0, { id: 'cam:n:ridge@' + id, x: r2(cx + e.dx), z: r2(cz + e.dz), parts: keep[id].map(p => Object.assign({}, p, { p: [r2(p.p[0] + a0.x - cx), p.p[1], r2(p.p[2] + a0.z - cz)] })) })); });
  /* the Pass: home x 0 (the sleigh road's middle) on the north wall -> the north end's north side, on the line the trail L6 leaves by */
  const e = R.ofHome['P07-00'], px = R.gx(e.col * N + 6), pz = R.gz(e.row * N);
  rows.push(Object.assign({}, a0, { id: 'cam:n:pass', x: px, z: pz, parts: RIDGE.pass.map(p => Object.assign({}, p, { p: [r2(p.p[0] + a0.x - 0), p.p[1], r2(p.p[2] + a0.z + HHALF)] })) }));
  o.extraF.push(...rows); CNT.ridge = { kept: RIDGE.parts.length - drop.length, left: drop.length, pass: RIDGE.pass.length };
  if (drop.length) STRAYS.push('THE SNOWY PINES: ' + drop.length + ' of the ridge’s ' + RIDGE.parts.length + ' edge-rank parts left out: they backed a side that has a plot of the path past it now (they would stand in the path)'); }
/* 6. L7's place (the route kit's rule, ow-places.js: every route plot carries one) */
{ const o = roomOf(R_FOREST), e = o.R.ofHome.L7, pl = OWP.PLACES.camp, x0 = e.col * N, y0 = e.row * N; e.name = 'The Forest Trail, ' + pl.name;
  OWP.lay(pl, x0 + 5, y0 + 5, { P: (key, sx, sy, q) => o.extraP.push(Object.assign({ key, x: o.R.gcx(sx), z: o.R.gcz(sy) }, q || {})), at: (key, fx, fy, q) => o.extraP.push(Object.assign({ key, x: o.R.gx(fx), z: o.R.gz(fy) }, q || {})) });
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = x0 + 5 + dx, y = y0 + 5 + dy; if (SOLIDC(o.c2[y][x])) o.c2[y][x] = 'g'; }
  o.extraP.forEach(p => o.stood.add(o.sqOf(p.x, p.z).join(':'))); }
/* 6b. THE DEAD ENDS GO BACK TO THE TREES: a plot side with nobody past it now (no plot, no door) closes. A lane of road squares that ran to it
   through the trees (a corridor: solid on both hands) goes back to the plot's own forest, square by square from the side inward, until it
   meets open ground (a clearing, a court) or the way between the plot's own open ground and a side that is used. A square a piece stands on
   stays. (The Woods' rule, THE ONE WORLD MOVE in bake-woods.js; here read off the squares, the Camelot plan records no legs.) */
const FILL = { N: 'T', L: 'h' }, GROUNDI = {}; DISTRICTS.forEach(m => { if (m.ground) GROUNDI[m._cmFile] = PAL.indexOf(m.ground) + 1; });
ROOMS_OUT.forEach(o => { if (o.S.block) return; const R = o.R; let back = 0;
    const used = (e, sd) => !!R.at[(e.col + SIDE4[sd][0]) + ',' + (e.row + SIDE4[sd][1])] || o.doorsOut.some(d => d.wall !== 'free' ? false : false) || (o.usedSides && o.usedSides.has(e.col + ',' + e.row + ':' + sd));
    R.order.forEach(e => { const dead = ['N', 'S', 'W', 'E'].filter(sd => !used(e, sd)); if (!dead.length) return;
        /* the needed squares: the shortest walk inside the plot from its open ground to every open square of a used side */
        const hub = hubOf(o, e), key = (x, y) => x + ':' + y, par = new Map([[key(hub[0], hub[1]), null]]), st = [hub];
        for (let i = 0; i < st.length; i++) { const [x, y] = st[i]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy, k = key(X, Y); if (!par.has(k) && o.openR(X, Y) && R.plotOfSq(X, Y) === e) { par.set(k, key(x, y)); st.push([X, Y]); } } }
        const need = new Set(); ['N', 'S', 'W', 'E'].filter(sd => dead.indexOf(sd) < 0).forEach(sd => { for (let k = 0; k < N; k++) { const q = border(e, sd, k); let c = key(q[0], q[1]); if (!par.has(c)) continue; while (c && !need.has(c)) { need.add(c); c = par.get(c); } } });
        const fill = FILL[e.district] || 't', solid = (x, y) => !o.inR(x, y) || R.plotOfSq(x, y) !== e || SOLIDC(o.c2[y][x]);
        dead.forEach(sd => { const ns = sd === 'N' || sd === 'S', inward = SIDE4[OPP[sd]];
            /* the runs of open road squares along the side */
            let runs = [], a = null; for (let k = 0; k <= N; k++) { const q = k < N ? border(e, sd, k) : null, rd = q && o.openR(q[0], q[1]) && ROADS.indexOf(o.c2[q[1]][q[0]]) >= 0 && o.c2[q[1]][q[0]] !== 'b';
                if (rd && a == null) a = k; if (!rd && a != null) { runs.push([a, k - 1]); a = null; } }
            runs.filter(r => r[1] - r[0] <= 3).forEach(r => { for (let d = 0; d < N; d++) {
                const sqs = []; for (let k = r[0]; k <= r[1]; k++) { const q = border(e, sd, k); sqs.push([q[0] + inward[0] * d, q[1] + inward[1] * d]); }
                if (sqs.some(q => !o.openR(q[0], q[1]) || ROADS.indexOf(o.c2[q[1]][q[0]]) < 0 || o.c2[q[1]][q[0]] === 'b' || need.has(key(q[0], q[1])) || o.stood.has(key(q[0], q[1])))) break;
                const s0 = sqs[0], s1 = sqs[sqs.length - 1], l0 = ns ? [s0[0] - 1, s0[1]] : [s0[0], s0[1] - 1], l1 = ns ? [s1[0] + 1, s1[1]] : [s1[0], s1[1] + 1];
                if (!solid(l0[0], l0[1]) || !solid(l1[0], l1[1])) break;   // the lane meets open ground: it stops here
                sqs.forEach(q => { o.c2[q[1]][q[0]] = fill; o.pnt[q[1] * R.W + q[0]] = fill === 'T' ? 1 : fill === 'h' ? 7 : (GROUNDI[e.district] || 0); back++; }); } }); }); });
    o.back = back; });
/* 7. nobody is cut off: a pocket of open ground the joints miss gets a one-square path to the nearest reached square of its own plot; then every plot is reached from the spawn */
ROOMS_OUT.forEach(o => { const R = o.R, Wn = R.W, Dn = R.D, wet = (x, y) => o.c2[y][x] === 'w';
    const sp = Array.isArray(o.S.spawn) ? [o.S.spawn[0] - 12, o.S.spawn[1] - 12] : hubOf(o, R.ofHome[o.S.spawn]); o.spSq = sp;
    let seen = null, tied = 0;
    for (let pass = 0; pass < 120; pass++) { seen = new Uint8Array(Wn * Dn); const q = [sp]; if (!o.openR(sp[0], sp[1])) throw new Error(o.S.id + ': the spawn square is not open'); seen[sp[1] * Wn + sp[0]] = 1;
        for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (o.openR(X, Y) && !wet(X, Y) && !seen[Y * Wn + X]) { seen[Y * Wn + X] = 1; q.push([X, Y]); } } }
        let lost = null; for (let cy = 0; cy < Dn && !lost; cy++) for (let cx = 0; cx < Wn; cx++) if (o.openR(cx, cy) && !wet(cx, cy) && !seen[cy * Wn + cx] && /[gsmp]/.test(o.c2[cy][cx])) { lost = [cx, cy]; break; }
        if (!lost || o.S.block) break;
        const lp = R.plotOfSq(lost[0], lost[1]); let best = null, bd = 1e9; q.forEach(c => { if (R.plotOfSq(c[0], c[1]) !== lp) return; const dd = Math.abs(c[0] - lost[0]) + Math.abs(c[1] - lost[1]); if (dd < bd) { bd = dd; best = c; } });
        if (!best) q.forEach(c => { const dd = Math.abs(c[0] - lost[0]) + Math.abs(c[1] - lost[1]); if (dd < bd) { bd = dd; best = c; } });
        const ch = letterOf(lp), step = (x, y) => { const e = R.plotOfSq(x, y); if (e && SOLIDC(o.c2[y][x])) { o.c2[y][x] = ch; o.pnt[y * Wn + x] = ch === 'i' ? 6 : ch === 'm' ? 5 : 3; } };
        for (let x = Math.min(lost[0], best[0]); x <= Math.max(lost[0], best[0]); x++) step(x, lost[1]); for (let y = Math.min(lost[1], best[1]); y <= Math.max(lost[1], best[1]); y++) step(best[0], y);
        tied++; if (pass === 119 && !process.env.CAM_NOTHROW) throw new Error(o.S.id + ': could not tie every pocket (' + lost.join(',') + ' to ' + best.join(',') + ', ' + o.c2[lost[1]][lost[0]] + ')'); }
    const cold = R.order.filter(e => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(e.row * N + ly) * Wn + e.col * N + lx]) return false; return true; }).map(e => e.name);
    if (cold.length && !process.env.CAM_NOTHROW) throw new Error(o.S.id + ': plots not reached: ' + cold.join(', '));
    o.tied = tied;
    if (process.env.CAM_DUMP) console.log('\n' + o.S.id + '\n' + o.c2.map((r, cy) => r.map((ch, cx) => !R.plotOfSq(cx, cy) ? '.' : o.stood.has(cx + ':' + cy) && !SOLIDC(ch) ? 'o' : o.openR(cx, cy) && !wet(cx, cy) && !seen[cy * Wn + cx] ? '!' : SOLIDC(ch) ? ' ' : ch).join('')).join('\n')); });
if (STRAYS.length) console.log('STRAYS (each is answered in the notes, "CAMELOT KINGDOM, THE ONE WORLD MOVE"):\n  ' + STRAYS.join('\n  '));

/* 8. the rooms, written: each plot's pieces where the mover stood them, the tree mass and the air cut to the plots, the land past the lines read off the map */
const clip = (z, o) => { const out = []; o.R.order.forEach(e => { if (!e.home) return; const hx0 = -HHALF + e.home.x * PL, hz0 = -HHALF + e.home.y * PL, x0 = Math.max(z.x0, hx0), x1 = Math.min(z.x1, hx0 + PL), z0 = Math.max(z.z0, hz0), z1 = Math.min(z.z1, hz0 + PL);
    if (x1 - x0 < 0.01 || z1 - z0 < 0.01) return; const q = Object.assign({}, z, { x0: r2(x0 + e.dx), x1: r2(x1 + e.dx), z0: r2(z0 + e.dz), z1: r2(z1 + e.dz) });
    if (z.n != null) q.n = Math.max(1, Math.round(z.n * (x1 - x0) * (z1 - z0) / ((z.x1 - z.x0) * (z.z1 - z.z0)))); out.push(q); }); return out; };
const inBlock = (x, z) => { const h = MOVER.homePlot(x, z); return !!roomOf(KROOM).R.ofHome[h.id]; };
const OUTB = [];
ROOMS_OUT.forEach(o => { const { S, R } = o, w = 2 * R.HX, d = 2 * R.HZ;
    const spaces = R.spaces(o.openR), sp = { x: R.gcx(o.spSq[0]), z: R.gcz(o.spSq[1]) };
    let rows;
    if (S.block) { rows = []; F.forEach(f => { if (f.s != null || f.c != null) { rows.push(f); return; } if (f.ridge) return;
            (f.split || [f.o]).forEach(a => { const q = MOVER.anchor(a); if (!q || inBlock(q[0], q[1])) rows.push({ o: a }); }); });
        rows = spaces.map(o2 => ({ o: o2 })).concat(rows.filter(f => !(f.o && f.o.k === 'space'))); }
    else rows = spaces.concat(R.features, o.extraF).map(a => ({ o: a }));
    const zones = [].concat(...ZONES.map(z => clip(z, o))), air = [].concat(...AIR.map(z => clip(z, o)));
    const atmos = air.length ? ", atmos: " + J({ kind: 'embers', n: Math.max(40, Math.round(160 * S.list.length / 64)), tier: 'open', zones: air.concat([{ x0: -R.HX, z0: -R.HZ, x1: R.HX, z1: R.HZ, kind: 'embers', n: Math.max(40, Math.round(160 * S.list.length / 64)) }]) }) : "";
    const mk = S.block ? marks : [], lines = S.block ? OLD.l : S.id === R_GARDEN ? OG.l : [], P2 = R.props.concat(o.extraP);
    check(P2, R.npc);
    const M2 = [];
    M2.push("        " + S.id + ": {");
    M2.push("            label: " + J(S.label) + ",");
    M2.push("            sub: " + J(S.sub) + ",");
    M2.push("            kind: 'box', site: 'prebuilt_camelot', part: " + J(S.part) + ",");
    M2.push("            /* THE ONE WORLD: where this room stands on the world's plot grid (data.js hqOwIndex) */");
    M2.push("            world: { hub: 'kingdom', layer: 'surface', wx: " + R.wx + ", wy: " + R.wy + " },");
    M2.push("            shell: (s => { s.sky.sights = 'world'; return s; })(hqCastleShell({ w: " + w + ", d: " + d + ", plate: { x: " + sp.x + ", z: " + sp.z + ", y: 4.4 }, forest: null" + atmos + " })),   // the far places at their true bearings beside the sky castle; no treeline ring (the land past the lines is the map's)");
    M2.push("            parti: " + J(S.parti) + ",");
    M2.push("            typology: 'grid',");
    M2.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + R.cols + ", nx: " + R.cols + ", nz: " + R.rows + ", mask: " + J(R.mask) + ", names: " + J(R.order.map(e => [R.pid(e), e.name, e.district, e.level])) + " },");
    M2.push("            terrain: {");
    M2.push("                res: 1.75, floor: 'grass_2', cliff: 'castle_wall', path: 'cobblestone',");
    M2.push("                noise: { amp: 0, scale: 8 },");
    M2.push("                /* THE HORIZON READS THE MAP: the land past every line is the world's own ground there, plot by plot (three-renderer.js _hqEdgeLandFn `world`) */");
    M2.push("                backdrop: false, edges: { world: true, reach: 440, ways: " + J(o.ways) + " },");
    M2.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + R.gcx(0) + ", z0: " + R.gcz(0) + ", nx: " + R.W + ", nz: " + R.D + ", d: '" + Buffer.from(o.pnt).toString('base64') + "' },");
    M2.push("                gen: { kind: 'plan', look: 'trees', seed: 64, rim: 0, forceGrow: 0, treeGap: 2.6, treeIn: 0.9, spacing: 3.5, depth: 5.25, maxTrees: " + Math.max(300, Math.round(3200 * S.list.length / 64)) + ", treeH: [5.5, 8.5], kinds: ['tree', 'tree_2', 'tree_3', 'tree', 'tree_5', 'tree_2'], zones: " + J(zones) + " },");
    M2.push("                features: [");
    rows.forEach(f => M2.push("                    " + rowText(f)));
    M2.push("                ],");
    M2.push("                marks: " + J(mk) + ",");
    M2.push("            },");
    M2.push("            doors: [");
    o.doorsOut.forEach(dr => M2.push("                " + J(dr) + ","));
    M2.push("            ],");
    M2.push("            counters: [],");
    M2.push("            props: [");
    for (let i = 0; i < P2.length; i += 4) M2.push("                " + P2.slice(i, i + 4).map(J).join(", ") + ",");
    M2.push("            ],");
    M2.push("            agents: [],");
    M2.push("            npcSpots: " + J(R.npc) + ",");
    M2.push("            onlineSpots: [],");
    M2.push("            lines: " + J(lines) + ",");
    M2.push("            spawn: { x: " + sp.x + ", z: " + sp.z + ", face: " + (S.face || 0) + " },");
    M2.push("        },");
    OUTB.push(M2.join('\n'));
    console.log(S.id + ' ' + JSON.stringify({ plots: S.list.length, box: R.cols + 'x' + R.rows, world: [R.wx, R.wy], joints: o.joints, laid: o.laid, deadEndsBack: o.back, tied: o.tied, spaces: spaces.length, features: rows.length, props: P2.length, doors: o.doorsOut.length, natives: R.npc.length, zones: zones.length, air: air.length })); });
if (CNT.ridge) console.log('the ridge ' + JSON.stringify(CNT.ridge));
console.log('links ' + JSON.stringify(LINKS_OUT));
const owBlock = "        /* CAMELOT-KINGDOM-BEGIN — CAMELOT KINGDOM ON PLOTS, PLAN 3 (2026-11-15) + THE ONE WORLD MOVE (2026-11-17: the castle + the village and the four woods stand at their One World places, five rooms): written by `node bake-camelot.js` from docs/areas/camelot/layout.json + docs/plans/one-world/plots.json. Never hand-edit between the markers; edit the tool, a district file or the layout and rerun. */\n" + OUTB.join('\n') + "\n        /* CAMELOT-KINGDOM-END */\n";
if (DRY) process.exit(0);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
src = splice(src, OW_HOME ? kingdomBlock : owBlock, 'CAMELOT-KINGDOM', '        site_prebuilt_camelot_ward: {');
/* THE LINKS' CAMELOT ENDS (data.js DOOR_HQ.links): each link's `a:` / `b:` line gets its room (part) and its place rewritten; the rest of the line (its sub, its passage) is kept */
if (!OW_HOME) Object.keys(LINKS_OUT).forEach(id => { const [side, e] = LINKS_OUT[id], i = src.indexOf("{ id: '" + id + "'"); if (i < 0) throw new Error('link not found: ' + id);
    const re = new RegExp('(\\n +' + side + ": \\{ site: 'prebuilt_camelot', part: )'[a-z0-9_]+', wall: '[a-z]+'(?:, (?:x|z|face): -?[\\d.]+)+(?:, passage: \\{ len: 3, deep: 1\\.2 \\})?"), m = re.exec(src.slice(i, i + 2500)); if (!m) throw new Error('no Camelot end on link ' + id);
    const head = m[1] + "'" + e.part + "', wall: '" + e.wall + "'" + (e.x != null ? ', x: ' + e.x : '') + (e.z != null ? ', z: ' + e.z : '') + (e.face != null ? ', face: ' + e.face : '') + (e.passage ? ', passage: { len: 3, deep: 1.2 }' : '');
    src = src.slice(0, i + m.index) + head + src.slice(i + m.index + m[0].length); });
fs.writeFileSync(file, src);
console.log('data.js: ' + (OW_HOME ? 'site_prebuilt_camelot_kingdom, THE HOME FRAME (' + kingdomBlock.length : ROOMS_OUT.map(o => o.S.id).join(', ') + ' (' + owBlock.length) + ' bytes) written');
