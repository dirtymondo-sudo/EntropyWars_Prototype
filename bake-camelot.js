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
const feat = o => F.push(J(o) + ','), raw = s => F.push(s + ','), note = s => F.push('/* ' + s + ' */');
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
const castlePaint = (x, y) => { const u = Q.upper; if (x >= u[0] && x < u[2] && y >= u[1] && y < u[3]) return 5; return (y >= 34 && y < 52 && (x < 31 || x >= 65)) ? 0 : 4; };
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

/* ── THE DISTRICTS BUILD (the village first, then the road home, then the woods west, east, north, south: the baked order) ── */
Object.assign(ctx, { cell, plot, open, WALKIN, HOUSES, taken, sq, put, dec, tree, native, many, rnd, sayOf, old: { ward: OLD, garden: OG, pole: ONP } });
sq(7, 53);   // THE MIRROR's square (its door is a way out of the zone: written below, after the districts), kept clear of the garden's dressing
run('build', ['K', 'T']);
/* the road in from DOOR HQ: the portcullis stands at the room's south wall, in the forest; the drawbridge is ahead */
props.push({ key: 'brazier', x: r2(BAYX - 5.25), z: gc(94) }, { key: 'brazier', x: r2(BAYX + 5.25), z: gc(94) }); put('signpost', 44, 91);
run('build', ['L', 'F', 'N', 'W']);
{ const m = OG.d.find(d => d.id === 'astral');   // THE MIRROR (in the Looking-Glass Garden, P00-04): the old garden's frame with nothing in it, with its own words
  doors.push({ id: 'mirror', wall: 'free', x: gc(7), z: gc(53), face: 180, leaf: m.leaf, label: m.label, sub: m.sub, action: { room: 'site_prebuilt_lookingglass_waiting', at: 'garden' }, desc: m.desc }); }

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
const ENDS = { bay: { wall: 's', x: BAYX }, woods_camelot: { wall: 'e', z: WAYS.trail }, northpole_camelot: { wall: 'n', x: WAYS.sleigh }, haunted_camelot: ends.haunted_camelot, well_camelot: ends.well_camelot };
console.log('ends ' + JSON.stringify(ENDS));
if (DRY) process.exit(0);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
src = splice(src, kingdomBlock, 'CAMELOT-KINGDOM', '        site_prebuilt_camelot_ward: {');
fs.writeFileSync(file, src);
console.log('data.js: site_prebuilt_camelot_kingdom (' + kingdomBlock.length + ' bytes) written');
