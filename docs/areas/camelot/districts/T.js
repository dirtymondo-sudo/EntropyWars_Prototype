/* CAMELOT KINGDOM · THE VILLAGE (district T, 28 plots) — everything inside the town wall that is not the castle.
   Repo tooling only: bake-camelot.js calls `build(ctx)` after the shared pieces stand (the hill, the moat, the town wall, the open ground).
   TWO FILES: this one (the three buildings walked into, their insides, the village's ground) and T-houses.js (the 43 houses, five kinds).
   The houses are most of the village's code and a job of their own (looks, later insides), so a second thread can hold T-houses.js while
   this file's holder dresses the streets; the tool loads only T.js, which calls T-houses.js at the one place the houses are written.

   THE PLOTS: P01-01 The North-West Tower · P02-01 North Row, west · P03-01 The North Gate · P04-01 North Row · P05-01 North Row, east ·
   P06-01 The North-East Tower · P01-02 West Row, north · P02-02 North Street, west · P03-02 North Street · P04-02 North Street, east ·
   P05-02 The Postern Lane · P06-02 East Row, north · P01-03 The West Gate · P06-03 The East Gate · P01-04 West Row · P06-04 East Row ·
   P01-05 West Row, south · P02-05 The Chapel · P03-05 The Market · P04-05 The Inn · P05-05 The Smithy · P06-05 East Row, south ·
   P01-06 The South-West Tower · P02-06 South Row, west · P03-06 The Drawbridge · P04-06 South Row · P05-06 South Row, east ·
   P06-06 The South-East Tower (the ring x 12..84, y 12..84 round the castle's eight plots). The village's own ground is INSIDE the town
   wall (squares x 18.5..77.5, y 21.5..73.5); the wall, its towers and gates, the moat and the four bridges stand on these plots but are
   the tool's. Outside the moat the same plots are woods: north of it The Snowy Pines' (N.js), south The Forest's (W.js).

   WHAT STANDS HERE TODAY: the Chapel, the Smithy and the Inn (walked into, furnished: layout.json `walkins`); 43 houses, solid
   (T-houses.js); the Market either side of the Grand Stair (eight tents, the well, the stocks, bread racks, crates, a signpost); the
   graveyard by the Chapel (seven crosses); the green behind the castle hill (a cow, chickens, sheep); a horse and sacks by the Inn; the
   gate braziers and two knights at the Drawbridge gate; signposts at the gates; ten street trees; a bench and a planter on North Street.

   MISSING / WAITING: no house is walked into (mondo OK'd the five kinds as looks; insides are not asked yet). No anvil, market stall or
   lamp post model exists on R2 (tents, crates and sacks stand in). The streets have no lamps and no people but the two gate knights.
   HELD BY the Village pilot thread since 2026-11-16 (both files). Passes: 1 exteriors (in), 2 interiors (the three halls in: THE INSIDES below), 3 dressing, 4 atmosphere, 5 polish.
   NEEDS A MODEL (nothing on R2): a market stall, an anvil, a lamp post / street lantern, a hand cart, a trough, a fence run, a tavern table.

   THE HOOKS (bake-camelot.js "THE DISTRICT FILES" lists the whole ctx): squares are the kingdom's (kx, ky), 0..96, a plot = 12 x 12 of them,
   plot Pxx-yy = squares xx*12.. , yy*12.. . gx(k) = a square's west / north edge in metres, gc(k) = its middle. feat(row) writes a terrain row,
   note(text) a heading. put(key, x, y, o, on) stands a catalogue prop on a square's middle; dec(...) the same, scattered and turned by the
   dice; tree(kind, h, x, y, r); native(race, x, y, face, say). They take FREE ground only (grass, snow, marble; `on` names another plan
   letter) and never one square twice: the tool stops and names the square. sheet() = a parts list (box, cyl, roof, shell, crown, tower, banner);
   building(id, [x0, y0, x1, y1], side, h, o, parts) = a texbuilding + its drawn look, returns its frame; inside(B, key, lx, lz, o) = furniture
   in that frame; flushArch() writes the looks made so far.
   ctx.WALKIN = { chapel, smithy, inn } as [x0, y0, x1, y1, front]; ctx.HOUSES = every other run of the plan's `B` as { x0, y0, x1, y1 }.
   A building's squares come from the plan (layout.json `cells` / `walkins`), which is the tool's: ask on the board to move one.
   RULES (docs/notes/areas-complexes.md "CAMELOT, THE DISTRICT FILES"): one thread = this one file. Not yours: bake-camelot.js, layout.json,
   the other district files, the hill, the town wall, the moat, the roads, the doors out of the zone, the room's sky and shell (a note on
   the board first: docs/notes/claims.md). After any edit: `node bake-camelot.js`, `node --check data.js`, commit the file AND data.js.
   The same rules hold for T-houses.js. */
'use strict';
const HOUSES_FILE = require('./T-houses.js');
const U = n => 'urban:' + n, STUCCO = U('PlasterWallStucco2a'), G_TALL = U('GlassWindowTall1a'), SLATE = U('MetalRoofTiles1a'), WOODK = 'wood_planks', WOODD = 'wood';
const STONE = 0xc4c0b8, STONE2 = 0xaeaaa6, STONE3 = 0xd2ccc0, GLASS = 0xa8c4ec, TIMBER = 0x4a3626;
/* a walked-into building's stone foot: four strips round the walls, the front one broken at the doorway. (The first build drew the foot as ONE
   box with a top over the whole plan: a stone lid 1 m above the Chapel's and the Smithy's floors, across their doorways too. Seen in the
   probe as a floor at waist height that buried the furniture.) */
const foot = (a, w, d, door, h, out, key, tint) => { const t = out + 0.05;
    a.box(0, 0, -(d / 2 + t / 2), w + 2 * t, h, t, key, tint); for (const s of [-1, 1]) a.box(s * (w / 2 + t / 2), 0, 0, t, h, d, key, tint);
    const x0 = -(w / 2 + t), x1 = w / 2 + t, a0 = door.lx - door.cw / 2 - 0.12, a1 = door.lx + door.cw / 2 + 0.12;
    a.box((x0 + a0) / 2, 0, d / 2 + t / 2, a0 - x0, h, t, key, tint); a.box((a1 + x1) / 2, 0, d / 2 + t / 2, x1 - a1, h, t, key, tint); };
function build(ctx) {
const { WALL, r2, gc, note, props, inside, flushArch, put, dec, tree, native } = ctx, WALKIN = ctx.WALKIN;
const kb = (id, q, h, o, parts) => ctx.building(id, q, q[4], h, o, parts);
note('THE VILLAGE: the Chapel, the Smithy, the Inn (walked into), the houses');
/* THE CHAPEL — stone, buttressed, lancets, a steep slate roof, a bell tower over the door */
const CHAPEL = kb('chapel', WALKIN.chapel, 7, { floorIn: 'marble' }, (a, w, d, door) => {
    a.shell(w, 7, d, WALL, STONE3, door); foot(a, w, d, door, 1.0, 0.25, WALL, STONE2);
    a.roof('gable', 0, 7, 0, d + 1.4, 6, w + 1.4, SLATE, 0x5a6c96, { ry: 90, keyEnd: WALL, tintEnd: STONE });
    a.box(0, 9.5, d / 2 - 1.4, 2.8, 5.5, 2.8, WALL, STONE, { roof: true }); a.roof('pyramid', 0, 15, d / 2 - 1.4, 3.4, 3.6, 3.4, SLATE, 0x5a6c96);
    for (const s of [-1, 1]) { a.box(s * (w / 2 + 0.45), 0, -d / 2 + 2.2, 0.9, 5.6, 1.2, WALL, STONE2, { n: 4, step: [0, 0, (d - 4.4) / 3] }); a.box(s * (w / 2 + 0.07), 2.2, -d / 2 + 4.1, 0.1, 3.4, 1.1, G_TALL, 0xd8a8e0, { n: 3, step: [0, 0, (d - 4.4) / 3], glow: 0.5 }); }
    a.box(0, 3.6, d / 2 + 0.07, 1.6, 2.4, 0.1, G_TALL, 0xd8a8e0, { glow: 0.5 });
    a.box(0, 2.5, -d / 2 - 0.07, 2.4, 3.5, 0.1, G_TALL, 0xd8a8e0, { glow: 0.5 });   // the east window behind the altar
});
/* THE SMITHY — timber on a stone foot, an open-fronted forge under a lean-to, the chimney */
const SMITHY = kb('smithy', WALKIN.smithy, 5.25, { leafDouble: false, keyIn: WOODK, floorIn: 'dirt_2' }, (a, w, d, door) => {
    a.shell(w, 5.25, d, WOODK, 0xb89468, door); foot(a, w, d, door, 1.2, 0.2, WALL, STONE2);
    a.roof('gable', 0, 5.25, 0, w + 1.6, 3.4, d + 1.6, WOODD, 0x6a4a34, { keyEnd: WOODK, tintEnd: 0xa88458 });
    a.box(-w / 2 + 1.2, 0, -d / 2 - 0.6, 1.8, 9.5, 1.8, WALL, STONE, {}); a.box(-w / 2 + 1.2, 9.5, -d / 2 - 0.6, 2.2, 0.5, 2.2, WALL, STONE2, { roof: true });
    a.roof('shed', 3, 3.2, d / 2 + 1.6, 6, 1.2, 3.2, WOODD, 0x6a4a34, { ry: 180, under: true }); for (const x of [0.3, 5.7]) a.box(x, 0, d / 2 + 2.9, 0.3, 3.2, 0.3, WOODD, TIMBER);
});
/* THE INN — two storeys, plaster over a stone ground floor, a jettied upper floor on timber, the sign */
const INN = kb('inn', WALKIN.inn, 7, { keyIn: STUCCO, floorIn: 'wood_planks' }, (a, w, d, door) => {
    a.shell(w, 3.5, d, WALL, STONE3, door); a.box(0, 3.5, 0, w + 0.9, 3.5, d + 0.9, STUCCO, 0xe6dcc4, { top: false, under: true, gain: 1.6 });
    /* the timber frame: posts every bay and two plates on all four sides (each side wall was ONE timber sheet: a black slab on screen) */
    for (const s of [-1, 1]) { for (const y of [3.5, 6.7]) { a.box(0, y, s * (d / 2 + 0.4), w + 1.0, 0.3, 0.25, WOODD, TIMBER); a.box(s * (w / 2 + 0.4), y, 0, 0.25, 0.3, d + 1.0, WOODD, TIMBER); }
        for (let x = -w / 2 - 0.38; x <= w / 2 + 0.39; x += (w + 0.76) / Math.round(w / 3.5)) a.box(x, 3.5, s * (d / 2 + 0.4), 0.25, 3.5, 0.25, WOODD, TIMBER);
        for (let z = -d / 2 - 0.38; z <= d / 2 + 0.39; z += (d + 0.76) / Math.round(d / 3.5)) a.box(s * (w / 2 + 0.4), 3.5, z, 0.25, 3.5, 0.25, WOODD, TIMBER);
        a.box(s * (w / 2 + 0.47), 4.6, 0, 0.1, 1.3, 1.0, G_TALL, 0xf0d890, { glow: 0.5 }); }
    a.box(-w / 2 + 1.5, 4.6, d / 2 + 0.47, 1.0, 1.3, 0.1, G_TALL, 0xf0d890, { n: Math.max(2, Math.floor(w / 3.5)), step: [(w - 3) / Math.max(1, Math.floor(w / 3.5) - 1), 0, 0], glow: 0.5 });
    for (const x of [-8.75, -5.25, 5.25, 8.75]) { a.box(x, 1.4, d / 2 + 0.07, 1.0, 1.2, 0.1, G_TALL, 0xf0d890, { glow: 0.5 }); a.box(x, 2.6, d / 2 + 0.09, 1.3, 0.14, 0.16, WOODD, TIMBER); a.box(x, 1.26, d / 2 + 0.09, 1.3, 0.14, 0.2, WOODD, TIMBER); }   // the taproom's windows (the insides' lit ones)
    a.roof('gable', 0, 7, 0, w + 1.8, 4.4, d + 1.8, SLATE, 0x692e26, { keyEnd: STUCCO, tintEnd: 0xe6dcc4, gain: 1.6 });   // the roof's tint is 0xa84a3c divided by the gain (T-houses.js dimBy)
    a.box(door.lx + 2.4, 3.0, d / 2 + 1.0, 0.12, 0.12, 1.4, null, 0x2a2c30); a.box(door.lx + 2.4, 2.0, d / 2 + 1.5, 0.08, 0.9, 1.0, WOODK, 0x8a5a34, { ds: true });
    a.box(w / 2 - 1.4, 5.25, -d / 4, 1.1, 5, 1.1, 'bricks_2', 0xb86a54, { roof: true });
});
const HOUSE_LIST = HOUSES_FILE.houses(ctx, kb);
flushArch();
/* ── THE INSIDES (PASS 2, 2026-11-16, the Village pilot thread). The first build's halls had a black ceiling, bare walls, no light, garden
   benches for inn seats and the Chapel's carpet standing upright. Each hall now has ONE arch row `cam:<id>:in` (a lit timber ceiling, a wall
   coat, the drawn furniture) + catalogue props with `floor: true` (a prop by a wall otherwise stands on the wall's top) + real lights (wall
   torches, hearth fires, candle rings).
   THE SQUARES (mondo's rule, the city's F-inside.js): a hall is whole 3.5 m squares; sq(i, j) = the middle of square i along the front (from
   the left, seen from inside looking at the door: x), j from the back wall. What BLOCKS (counter, table, forge, pew, bench) stands on
   squares' middles with a ghost wall (`block`); decor stands off the middles; the door's column stays clear to the back.
   Frame: x along the front, +z out of the front (the door is at z = +d/2), y up. `put` faces: 0 = to the back wall, 180 = to the door. ── */
const r3 = v => Math.round(v * 1000) / 1000, GILT = 'gold', WARM = 0xffe2a8, PEWTER = 0x9a9ca0;
const hall = (B, id, o) => {
    const a = ctx.sheet(), P = a.P, c = B.at(0, 0), w = B.fw, d = B.fd, E = 0.33, W2 = w / 2, D2 = d / 2, lx = B.door.lx, dw = B.door.cw + 0.12;
    if (!o.noRow) ctx.arch.push({ k: 'arch', id: 'cam:' + id + ':in', x: c[0], z: c[1], rot: B.face(0), parts: P });   // `noRow`: the caller gathers the parts itself (T-houses.js: one row for all the houses)
    const quad = (x, y, z, qw, qh, ry, key, tint, x2) => P.push(Object.assign({ s: 'quad', p: [r3(x), r3(y), r3(z)], size: [r3(qw), r3(qh)], ry, kind: 'wall' }, key ? { key } : {}, { tint }, x2 || {}));
    const H = {
        a, w, d, W2, D2, E, top: o.top,
        sq: (i, j) => [r3(-W2 + (i + 0.5) * 3.5), r3(-D2 + (j + 0.5) * 3.5)],
        put: (key, x, z, face, x2) => inside(B, key, r3(x), r3(z), Object.assign({ face: face || 0, floor: true }, x2 || {})),
        /* a thing set ON something (a candle on a table, a fire on the forge): `y` of 1 m or more is a height from the floor, under 1 m a lift */
        on: (key, x, z, y, face, x2) => inside(B, key, r3(x), r3(z), Object.assign({ face: face || 0, y: r3(y) }, x2 || {})),
        /* a torch on wall 'b' back | 'f' front | 'l' left | 'r' right, `along` that wall, its foot `y` up */
        torch: (wall, along, y) => { const q = wall === 'b' ? [along, -D2 + 0.5, 180] : wall === 'f' ? [along, D2 - 0.5, 0] : wall === 'l' ? [-W2 + 0.5, along, 90] : [W2 - 0.5, along, 270];
            inside(B, 'wall_torch', r3(q[0]), r3(q[1]), { face: q[2], y: y || 2.2 }); },
        /* what the walker and a fight cannot cross: a ghost wall from (x0, z0) to (x1, z1), `t` thick, `h` high */
        block: (x0, z0, x1, z1, t, h) => { const p = B.at(x0, z0), q = B.at(x1, z1); ctx.feat({ k: 'wall', x0: p[0], z0: p[1], x1: q[0], z1: q[1], t: t || 0.9, h: h || 1.1, ghost: true, rail: false }); },
        /* the lining: a coat on the four walls to the ceiling (the front one cut at the doorway), a dado to `dh`, the lit ceiling deck, beams */
        coat: (key, tint, h, x2, e) => { e = e || E; quad(0, 0, -D2 + e, w - 2 * e, h, 0, key, tint, x2); quad(0, 0, D2 - e, w - 2 * e, h, 180, key, tint, Object.assign({ hole: [r3(-lx), r3(dw), Math.min(2.25, h)] }, x2 || {}));
            quad(-W2 + e, 0, 0, d - 2 * e, h, 270, key, tint, x2); quad(W2 - e, 0, 0, d - 2 * e, h, 90, key, tint, x2); },
        ceiling: (key, tint, glow, beamTint, girders) => { const y = o.top;
            a.box(0, y, 0, w - 2 * E, 0.06, d - 2 * E, key, tint, { sides: false, top: false, under: true, glow });
            for (let x = -W2 + 3.5; x < W2 - 0.1; x += 3.5) a.box(x, y - 0.3, 0, 0.3, 0.3, d - 2 * E, WOODD, beamTint, { glow: 0.3, gain: 1.4 });
            for (const z of girders || []) a.box(0, y - 0.55, z, w - 2 * E, 0.28, 0.34, WOODD, beamTint, { glow: 0.3, gain: 1.4 }); },
        /* a lit window seen from inside: flat on wall 'b' | 'f' | 'l' | 'r', its foot `y` up, in a frame of `fk` */
        light: (wall, along, y, ww, hh, tint, glow, fk, ft) => { const e = E + 0.03, al = wall === 'l' || wall === 'r', s = (wall === 'b' || wall === 'l') ? -1 : 1, x = al ? s * (W2 - e) : along, z = al ? along : s * (D2 - e);
            a.box(x, y, z, al ? 0.04 : ww, hh, al ? ww : 0.04, G_TALL, tint, { glow: glow == null ? 0.9 : glow });
            a.box(x, y + hh, z, al ? 0.12 : ww + 0.3, 0.16, al ? ww + 0.3 : 0.12, fk, ft); a.box(x, y - 0.16, z, al ? 0.16 : ww + 0.3, 0.16, al ? ww + 0.3 : 0.16, fk, ft); },
        /* a trestle table `len` long along x on (x, z) with a bench either side: the whole of its squares is shut */
        trestle: (x, z, len) => { a.box(x, 0.74, z, len, 0.07, 0.95, WOODK, 0x9a7244, { gain: 1.4, glow: 0.12 }); for (const s of [-1, 1]) { a.box(x + s * (len / 2 - 0.55), 0, z, 0.12, 0.74, 0.8, WOODD, 0x5a4230); a.box(x, 0.42, z + s * 0.9, len - 0.3, 0.06, 0.34, WOODK, 0x7a5632);
                for (const t of [-1, 1]) a.box(x + t * (len / 2 - 0.5), 0, z + s * 0.9, 0.1, 0.42, 0.3, WOODD, 0x5a4230); }
            a.box(x, 0.28, z, len - 1.2, 0.08, 0.1, WOODD, 0x5a4230); H.block(x - len / 2, z, x + len / 2, z, 2.2, 0.8); },
        barrel: (x, z, rr, hh) => { rr = rr || 0.4; hh = hh || 1.0; a.cyl(x, 0, z, rr, hh, WOODK, 0x8a5a34, { seg: 10 }); for (const y of [0.18, hh - 0.24]) a.cyl(x, y, z, rr + 0.02, 0.06, null, 0x3a3230, { seg: 10 }); a.cyl(x, hh, z, rr - 0.04, 0.02, WOODK, 0x6a4628, { seg: 10 }); },
        /* a wagon-wheel light hung on a chain: the wheel is drawn, the candles are the catalogue's ring (its light is real) */
        wheel: (x, z, y) => { a.cyl(x, y, z, 1.0, 0.08, WOODD, 0x7a5a3c, { seg: 14, glow: 0.3, gain: 1.4 }); a.box(x, y + 0.08, z, 0.05, o.top - y - 0.08, 0.05, null, 0x2a2c30);
            inside(B, 'candle_ring', r3(x), r3(z), { face: 0, y: r3(y + 0.1) }); },
        tankards: (x, z, n, step) => a.cyl(x, 0.81, z, 0.05, 0.14, null, PEWTER, { seg: 8, n, step: [step, 0, 0] }),
    };
    return H;
};

/* THE INN: the bar across the back (the kegs and the bottle shelves behind it), the hearth on the right wall under the chimney, two long
   trestle tables, two wagon-wheel lights. Six squares by five; the door's column (i = 2) and the row before the bar are the walkways. */
{ const H = hall(INN, 'inn', { top: 4.4 }), a = H.a, W2 = H.W2, D2 = H.D2;
    H.coat(STUCCO, 0xe6dcc4, 4.4, { gain: 1.5, glow: 0.12 }); H.coat(WOODK, 0x8a6a48, 1.2, { glow: 0.16, gain: 1.4 }, 0.336); H.ceiling(WOODK, 0xb89468, 0.65, 0x5a4230, [-5.25, 1.75]);
    for (const x of [-8.75, -5.25, 5.25, 8.75]) H.light('f', x, 1.4, 1.0, 1.2, 0xf0d890, 0.9, WOODD, TIMBER);
    /* the bar on squares (1..3, 1) */
    a.box(-1.75, 0, -3.5, 10.5, 1.05, 0.8, WOODK, 0x8a5e3a, { gain: 1.4, glow: 0.12 }); a.box(-1.75, 1.05, -3.5, 10.7, 0.08, 1.0, WOODK, 0xb88c58, { gain: 1.5, glow: 0.15 }); a.box(-1.75, 0.18, -3.05, 10.5, 0.06, 0.08, null, 0x8a6a30); H.block(-7, -3.5, 3.5, -3.5, 0.9, 1.1);
    H.tankards(-5.6, -3.4, 5, 0.22); H.tankards(0.8, -3.6, 4, 0.2); a.cyl(-0.6, 1.13, -3.5, 0.3, 0.55, WOODK, 0x8a5a34, { seg: 10 }); a.box(2.6, 1.13, -3.5, 0.7, 0.04, 0.42, WOODK, 0x9a6a3c); for (const q of [-0.2, 0.02, 0.24]) a.box(2.6 + q, 1.17, -3.5, 0.18, 0.12, 0.3, null, 0xc89a58);
    /* behind it: four kegs on the floor, three shelves of bottles on the back wall */
    for (const x of [-6.6, -5.6, 1.6, 2.6]) H.barrel(x, -7.85, 0.45, 1.1);
    for (const y of [1.5, 2.1, 2.7]) { a.box(-1.75, y, -D2 + 0.55, 6.4, 0.05, 0.36, WOODK, 0x7a5632); a.cyl(-4.6, y + 0.05, -D2 + 0.55, 0.05, 0.28, null, [0x3a6a3a, 0x7a4a24, 0xb08a30][Math.round(y * 10) % 3], { seg: 6, n: 20, step: [0.3, 0, 0], glow: 0.08 }); }
    a.box(-4.95, 1.2, -D2 + 0.55, 0.08, 1.9, 0.36, WOODD, 0x5a4230, { n: 2, step: [6.4, 0, 0] });
    /* the kitchen corner (the back right squares) */
    H.put('cauldron', 8.75, -7, 0); H.put('stock_pots', 6.5, -8.0, 180); H.put('bread_rack', 4.9, -8.05, 180);
    /* the hearth on the right wall, under the chimney */
    for (const s of [-1, 1]) a.box(W2 - 0.85, 0, -3.5 + s * 1.25, 1.05, 2.0, 0.5, WALL, STONE2);
    a.box(W2 - 0.85, 2.0, -3.5, 1.2, 0.5, 3.1, WALL, STONE3); a.box(W2 - 0.75, 2.5, -3.5, 0.85, 1.9, 2.4, WALL, STONE); a.box(W2 - 0.4, 0, -3.5, 0.12, 2.0, 2.0, null, 0x1c1614); a.box(W2 - 0.85, 0, -3.5, 1.3, 0.1, 3.0, WALL, STONE2);
    H.put('hearth_fire', W2 - 0.95, -3.5, 270, { y: 0.1 }); H.block(W2 - 0.85, -5.0, W2 - 0.85, -2.0, 1.1, 2.0); H.put('dog', 6.3, -1.5, 300); H.put('meshy_burlap_sack', 9.2, -0.9, 0); H.put('psx_wooden_crate_2', 9.3, 0.4, 0);
    /* the tables on squares (0..1, 3) and (4..5, 3) */
    for (const s of [-1, 1]) { H.trestle(s * 7, 3.5, 5.6); H.tankards(s * 7 - 1.6, 3.3, 3, 0.9); H.on('candle', s * 7, 3.5, 0.82, 0); a.cyl(s * 7 + 1.2, 0.81, 3.7, 0.16, 0.02, null, PEWTER, { seg: 10 }); a.box(s * 7 + 1.2, 0.83, 3.7, 0.2, 0.08, 0.14, null, 0xc89a58); H.wheel(s * 5.25, 1.75, 3.2); }
    H.torch('l', -3.5, 2.2); H.torch('r', 3.5, 2.2); H.torch('f', 5.25 + 1.75, 2.9); H.barrel(-9.5, 7.9); H.barrel(-8.6, 8.0, 0.36, 0.9); H.put('meshy_burlap_sack', 9.3, 7.8, 40);
}
/* THE CHAPEL: the nave (twelve pews either side of the aisle), the chancel on a marble step (the altar, the gilt cross, the east window, two
   angels), the pulpit, the lancets seen from inside. Five squares by six; the aisle is the door's column (i = 2). */
{ const H = hall(CHAPEL, 'chapel', { top: 6.45 }), a = H.a, W2 = H.W2, D2 = H.D2, d = H.d, ROSE = 0xd8a8e0, CRIM = 0x8a1a26;
    H.coat(WALL, STONE3, 6.45, { gain: 1.45, glow: 0.1 }); H.ceiling(WOODK, 0xa88458, 0.6, 0x4a3626, [-7, 0, 7]);
    a.box(0, 3.3, -D2 + 0.4, 2 * W2 - 0.7, 0.18, 0.16, WALL, STONE2); for (const s of [-1, 1]) a.box(s * (W2 - 0.4), 5.7, 0, 0.16, 0.18, d - 0.7, WALL, STONE2);
    for (let k = 0; k < 3; k++) for (const wl of ['l', 'r']) H.light(wl, -D2 + 4.1 + k * (d - 4.4) / 3, 2.2, 1.1, 3.4, ROSE, 1.0, WALL, STONE2);
    H.light('b', 0, 2.5, 2.4, 3.5, ROSE, 1.0, WALL, STONE2); a.box(0, 2.5, -D2 + 0.38, 0.1, 3.5, 0.06, WALL, STONE2); a.box(0, 4.6, -D2 + 0.38, 2.4, 0.1, 0.06, WALL, STONE2);
    /* the chancel: a marble step across the back row, the altar on it */
    a.box(0, 0.036, -D2 + 2.2, 2 * W2 - 0.8, 0.06, 3.7, 'marble', 0xf0e8d8, { faces: 'f', gain: 1.3 }); H.put('stone_altar', 0, -8.75, 180);
    a.box(0, 1.0, -8.75, 0.08, 0.9, 0.08, GILT, 0xffffff, { gain: 1.5 }); a.box(0, 1.55, -8.75, 0.5, 0.08, 0.08, GILT, 0xffffff, { gain: 1.5 }); a.box(0, 0.96, -8.75, 0.3, 0.05, 0.2, GILT, 0xffffff, { gain: 1.5 });
    for (const s of [-1, 1]) { H.on('candle', s * 0.75, -8.75, 1.0, 0); H.put('angel_statue', s * 7, -8.75, 180); H.put('cave_torch', s * 3.5, -8.75, 0); }
    H.put('church_podium', -3.5, -5.25, 180);
    /* the aisle's runner: crimson, a gold edge */
    a.box(0, 0.036, 1.5, 1.7, 0.012, 16.4, STUCCO, CRIM, { sides: false, gain: 1.6, glow: 0.12 }); for (const s of [-1, 1]) a.box(s * 0.92, 0.036, 1.5, 0.14, 0.018, 16.4, GILT, 0xffffff, { sides: false, gain: 1.3 });
    for (const j of [2, 3, 4]) for (const i of [0, 1, 3, 4]) { const q = H.sq(i, j); H.put('catholic_pew', q[0], q[1], 0); }
    for (const z of [-3.6, 1.9]) { H.torch('l', z, 2.4); H.torch('r', z, 2.4); }
    H.put('stone_urn', 3.3, 9.0, 0); H.put('hw_candles', -3.2, 9.4, 0); H.put('hw_candles', -1.2, -7.4, 0); H.put('hw_candles', 1.2, -7.4, 0);
    H.light('f', 0, 3.6, 1.6, 2.4, ROSE, 1.0, WALL, STONE2);
}
/* THE SMITHY: the forge in the back left corner under the chimney (stone hearth, a bed of coals, the hood), the quench trough, the bench
   along the right wall, the block that waits for its anvil (NEEDS A MODEL: no anvil on R2), armour and weapon racks. Five squares by five. */
{ const H = hall(SMITHY, 'smithy', { top: 4.7 }), a = H.a, W2 = H.W2, D2 = H.D2;
    H.coat(WOODK, 0xb08a5c, 4.7, { gain: 1.5, glow: 0.2 }); H.ceiling(WOODK, 0x9a7650, 0.55, 0x4a3626, [0]);
    /* the forge on square (0, 0) */
    a.box(-7, 0, -7, 2.9, 0.95, 2.9, 'bricks_2', 0xb86a54, { gain: 1.3, glow: 0.1 }); a.box(-7, 0.95, -7, 2.1, 0.08, 2.1, WALL, 0x2a2422); a.box(-7, 1.03, -7, 1.3, 0.04, 1.3, null, 0xff7a20, { glow: 1 });
    a.box(-7.2, 2.7, -7.5, 2.9, 2.0, 1.9, 'bricks_2', 0xb86a54, { under: true, gain: 1.3, glow: 0.1 }); a.box(-7.2, 2.45, -7.5, 3.1, 0.25, 2.1, WALL, STONE2, { under: true, gain: 1.3 }); a.box(-7.2, 0, -8.15, 2.9, 2.45, 0.6, 'bricks_2', 0xb86a54, { gain: 1.3, glow: 0.1 }); H.on('hearth_fire', -7, -7, 1.05, 0);   // the hood stands on its back wall H.block(-8.45, -7, -5.55, -7, 2.9, 0.95);
    /* the quench trough and the water butt beside it (decor, by the wall) */
    a.box(-3.6, 0, -7.95, 1.7, 0.7, 0.7, WOODK, 0x6a4a30); a.box(-3.6, 0.62, -7.95, 1.5, 0.06, 0.5, null, 0x3a5a7a, { glow: 0.12, sides: false }); H.barrel(-1.9, -8.0);
    /* the anvil's block on square (1, 1): an oak stump, iron-bound */
    a.cyl(-3.5, 0, -3.5, 0.42, 0.6, WOODD, 0x7a5a3c, { seg: 10 }); a.cyl(-3.5, 0.4, -3.5, 0.44, 0.07, null, 0x3a3230, { seg: 10 }); H.block(-3.5, -3.9, -3.5, -3.1, 0.8, 0.6);
    /* the bench along the right wall on squares (4, 1..2) */
    a.box(7.7, 0.85, -1.75, 1.1, 0.1, 6.4, WOODK, 0x8a6238); for (const z of [-4.6, -1.75, 1.1]) a.box(7.7, 0, z, 0.9, 0.85, 0.14, WOODD, 0x5a4230); a.box(7.7, 0.3, -1.75, 0.9, 0.06, 6.0, WOODK, 0x6a4a30); H.block(7.7, -4.95, 7.7, 1.45, 1.1, 0.95);
    H.on('psx_sword_mp_1', 7.7, -3.6, 0.96, 20); H.on('psx_sword_mp_1', 7.6, -0.4, 0.96, 160); a.box(7.9, 0.95, -2.2, 0.5, 0.3, 0.4, WOODK, 0x6a4a30);
    for (const y of [1.7, 2.3]) a.box(W2 - 0.5, y, -1.75, 0.3, 0.05, 5.2, WOODK, 0x7a5632);
    a.box(W2 - 0.5, 1.75, -3.4, 0.2, 0.34, 0.2, null, 0x3a3230, { n: 4, step: [0, 0, 0.9] }); a.box(W2 - 0.5, 2.35, -3.0, 0.16, 0.2, 0.5, null, 0x6a6c70, { n: 3, step: [0, 0, 1.2] });
    H.put('armour_stand', 3.5, -7, 180); H.put('armour_stand', 7, -7, 180); H.put('dojo_weapon_rack', 7.75, 5.25, 270); H.put('sea_chest', -7, 3.5, 90);
    H.put('psx_wooden_crate_2', -7.7, 7.6, 0); H.put('psx_wooden_crate_1', -6.4, 7.9, 30); H.put('meshy_burlap_sack', -7.9, 0.4, 0); H.put('meshy_burlap_sack', -7.3, -0.5, 60); H.put('wooden_bucket', -4.9, -7.7, 0);
    /* the tool wall (back wall, right of the forge): two rails, hammers and tongs hung on them; the coal heap; a horse in for shoeing */
    for (const y of [1.6, 2.2]) a.box(1.75, y, -D2 + 0.42, 6.0, 0.08, 0.08, WOODD, 0x5a4230, { gain: 1.4 });
    for (let k = 0; k < 6; k++) { const x = -0.9 + k * 1.05; a.box(x, 1.2 + (k % 2) * 0.6, -D2 + 0.48, 0.05, 0.46, 0.05, WOODK, 0x8a6238); a.box(x, 1.56 + (k % 2) * 0.6, -D2 + 0.48, k % 3 ? 0.26 : 0.16, 0.1, 0.1, null, 0x4a4c50); }
    a.box(-7.75, 0, -3.0, 1.3, 0.75, 2.2, WOODK, 0x6a4a30, { gain: 1.3, top: false }); a.box(-7.75, 0.62, -3.0, 1.15, 0.06, 2.05, WALL, 0x1e1c1c, { sides: false });   // the coal bin by the forge (a plain dome read as grey plastic)
    H.put('horse_black', 3.5, 3.5, 100); H.put('hw_straw', 0.6, 6.9, 20); H.put('hw_straw', 6.9, 7.6, 80); H.put('wooden_bucket', 2.2, 4.6, 0);
    H.torch('r', 3.4, 2.2); H.torch('l', 4.5, 2.2); H.torch('l', -3.4, 2.2); H.torch('f', 5.25, 2.6);
}
HOUSES_FILE.insides(ctx, hall, HOUSE_LIST);   // the 43 houses, furnished by kind (T-houses.js)
flushArch();

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
}
module.exports = { build };
