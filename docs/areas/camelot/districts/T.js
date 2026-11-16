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
   The village has been seen on screen only in part (one shop, the Market from the hill).

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
function build(ctx) {
const { WALL, r2, gc, note, props, inside, flushArch, put, dec, tree, native } = ctx, WALKIN = ctx.WALKIN;
const kb = (id, q, h, o, parts) => ctx.building(id, q, q[4], h, o, parts);
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
HOUSES_FILE.houses(ctx, kb);
flushArch();
/* the insides */
for (const z of [-5.5, -2.5, 0.5, 3.5]) for (const x of [-4.2, 4.2]) inside(CHAPEL, 'church_pew', x, z, { face: 0 });
inside(CHAPEL, 'stone_altar', 0, -8, {}); inside(CHAPEL, 'holy_carpet', 0, -1, { face: 0 }); inside(CHAPEL, 'brazier', -6.5, 8, {}); inside(CHAPEL, 'brazier', 6.5, 8, {});
inside(SMITHY, 'brazier', -4.5, -4.5, {}); inside(SMITHY, 'cauldron', -1.5, -5, {}); inside(SMITHY, 'armour_stand', 4.5, -4.5, { face: 0 }); inside(SMITHY, 'armour_stand', 4.5, -1, { face: 270 }); inside(SMITHY, 'dojo_weapon_rack', 5.4, 3, { face: 270 });
inside(SMITHY, 'sea_chest', -5, 3.5, { face: 90 }); inside(SMITHY, 'psx_table_large_3', 0, 1.5, {}); inside(SMITHY, 'psx_wooden_crate_2', -5, 0, {});
for (const x of [-5, 0, 5]) { inside(INN, 'psx_table_large_2', x, 1.5, {}); inside(INN, 'church_pew', x, 3.1, { face: 180 }); inside(INN, 'church_pew', x, -0.1, { face: 0 }); }
inside(INN, 'cauldron', -6.5, -5, {}); inside(INN, 'stock_pots', -3.5, -5.6, { face: 0 }); inside(INN, 'bread_rack', 7.2, -4, { face: 270 }); inside(INN, 'brazier', 3, -5, {}); inside(INN, 'psx_wooden_crate_2', 7, 5, {}); inside(INN, 'meshy_burlap_sack', 5.6, 5.4, {});

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
