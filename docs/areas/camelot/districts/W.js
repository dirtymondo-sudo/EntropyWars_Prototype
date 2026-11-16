/* CAMELOT KINGDOM · THE FOREST (district W, 8 plots) — the south woods: the forest and the road from DOOR HQ.
   Repo tooling only: bake-camelot.js calls `build(ctx)` after the shared pieces stand (last of the districts).

   THE PLOTS: P00-07 The Dead Tree's Hole · P01-07 The Forest Road, west · P02-07 The Glade, west · P03-07 The Crown's Road ·
   P04-07 The Forest Road · P05-07 The Glade, east · P06-07 The Forest Road, east · P07-07 Deep forest, south-east (squares x 0..96,
   y 84..96). The forest runs on north to the moat's south bank, over the bottom of the village's south plots: dressed here too.

   WHAT STANDS HERE TODAY (pass 1, 2026-11-16, seen on screen): THE CROWN'S ROAD: stone kerbs, seven lantern posts, the royal banner on four
   poles (bay and bridge), a CAMELOT milestone, two stone lions on plinths at the bridge's foot, a well, a wayside cross with candles, a
   covered wagon with its horse, sacks and crates, a hitching rail, great oaks at the bay. THE GLADE, WEST: the woodcutter's glade (a great
   oak on the knoll, two stacks of cut logs, a saw, stumps). THE GLADE, EAST: a camp (two striped tents, the fire, a pot, a horse, spear and
   shield). THE STONE RING in the deep forest (P07-07). THE DEAD TREE'S HOLE: bare trees, dead bushes, crows, two great dead trunks by the
   hole. THE MOAT'S SOUTH BANK: two rowboats at mooring posts. THE UNDERGROWTH: about 250 ferns, stones, dead bushes and stumps under the
   first trees along every way. The forest floor is `grass_dark_fantasy` (exports `ground` + `groundAlso`). The trees are the tool's.

   NOT HERE (the tool's, shared): the way in from DOOR HQ on P03-07 (the portcullis bay at square 43, 93: the room's spawn, its two
   braziers and its signpost), the Crown's Road itself, the dead tree's hole on P00-07 (`deadtree`, a secret way to The Woods), the moat,
   the Drawbridge. Dress round them, do not move them: the arrival is the first thing a player sees of the kingdom.

   MISSING / WAITING: nothing is waiting on mondo. NEXT: a walk-in (the woodcutter's hut), people, the air, the night.
   NEEDS A MODEL (nothing on R2): an axe + chopping block, a hand cart, a wooden barrel, a medieval tent (the two here are drawn),
   reeds, a deer / fox / owl, a leafy bush, flowers.
   HOW (learned here): a prop within a ghost wall's square takes `floor: true` or it stands on the wall's top (2.2 m up). Pieces by
   metres use the district's own dice (`rnd` below), never the kingdom's.

   THE HOOKS (bake-camelot.js "THE DISTRICT FILES" lists the whole ctx): squares are the kingdom's (kx, ky), 0..96, a plot = 12 x 12 of them,
   plot Pxx-yy = squares xx*12.. , yy*12.. . gx(k) = a square's west / north edge in metres, gc(k) = its middle. feat(row) writes a terrain row,
   note(text) a heading. put(key, x, y, o, on) stands a catalogue prop on a square's middle; dec(...) the same, scattered and turned by the
   dice; tree(kind, h, x, y, r); native(race, x, y, face, say). They take FREE ground only (grass, snow, marble; `on` names another plan
   letter) and never one square twice: the tool stops and names the square. sheet() = a parts list (box, cyl, roof, shell, crown, tower, banner);
   building(id, [x0, y0, x1, y1], side, h, o, parts) = a texbuilding + its drawn look, returns its frame; inside(B, key, lx, lz, o) = furniture
   in that frame; flushArch() writes the looks made so far.
   The heading row for this district is written by N.js ('THE SNOWY PINES + THE FOREST', one heading for both in the baked room).
   RULES (docs/notes/areas-complexes.md "CAMELOT, THE DISTRICT FILES"): one thread = this one file. Not yours: bake-camelot.js, layout.json,
   the other district files, the hill, the town wall, the moat, the roads, the doors out of the zone, the room's sky and shell (a note on
   the board first: docs/notes/claims.md). After any edit: `node bake-camelot.js`, `node --check data.js`, commit the file AND data.js. */
'use strict';
/* the forest floor: under every tree and glade of the district, and (groundAlso) under the forest that runs on north of plot row 7 to the
   moat's south bank (rows 79..83: the bottom of the village's south plots and of the two corner plots) */
const ground = 'grass_dark_fantasy';
const groundAlso = (x, y) => y >= 79 && y < 84 && x >= 9 && x < 88;
function build(ctx) {
const { r2, gx, gc, feat, note, props, put, dec, tree, arch, flushArch, sq, cell } = ctx;
const at = (key, x, z, o) => props.push(Object.assign({ key, x: r2(x), z: r2(z) }, o || {}));   // a piece by metres, no dice of the kingdom's
let seed = 7077; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };   // the district's own dice
const STONE = 'castle_wall', ST = 0xc4c0b8, SG = { gain: 1.35 }, WOOD = 'wood', WT = 0x6a4628, WG = { gain: 1.4 }, PLANK = 'wood_planks';
const S = ctx.sheet(), P = S.P;   // THE DRAWN PIECES: one row for the whole district, in the room's metres (few looks: a look is a mesh)
const ghost = (x, y) => feat({ k: 'wall', ghost: true, rail: false, x0: gx(x) + 0.3, z0: gc(y), x1: gx(x + 1) - 0.3, z1: gc(y), t: 2.9, h: 2.2 });   // what a drawn piece weighs: its whole square

note('THE FOREST: the Crown\'s Road, the glades, the stone ring, the dead tree\'s hole, the moat\'s south bank');
/* ── the glades' knolls (as they stood) ── */
feat({ k: 'hill', x: gc(22), z: gc(91), r: 4.6, h: 1.2 }); dec('fallen_log', 23, 89); dec('stump', 24, 90); feat({ k: 'hill', x: gc(66), z: gc(91), r: 4.6, h: 1.2 }); dec('fallen_log', 67, 90); put('campfire', 64, 90);
dec('rabbit', 45, 85); dec('stump', 40, 86); dec('fern', 45, 89); dec('fern', 90, 90); dec('stump', 87, 90);
tree('tree_5', 6.5, 9, 90, 0.9);

/* ── THE CROWN'S ROAD (P03-07 and on north to the Drawbridge): the first thing seen of the kingdom. Stone kerbs, lantern posts on both
   sides, the royal banner on poles at the bay and at the bridge, a milestone, two stone lions at the bridge's foot. The road, the bay,
   its braziers and its signpost are the tool's: nothing here moves them. ── */
const RW = gx(42), RE = gx(44);
for (const x of [RW + 0.14, RE - 0.14]) for (const q of [[80, 87], [89, 96]]) S.box(x, 0, (gx(q[0]) + gx(q[1])) / 2, 0.28, 0.16, gx(q[1]) - gx(q[0]), STONE, ST, SG);
const lantern = (x, z, side) => { S.cyl(x, 0, z, 0.26, 0.4, STONE, ST, Object.assign({ seg: 8, r2: 0.2 }, SG)); S.box(x, 0.4, z, 0.16, 2.75, 0.16, WOOD, WT, WG); S.box(x + side * 0.36, 2.95, z, 0.9, 0.1, 0.1, WOOD, WT, WG);
    S.box(x + side * 0.2, 2.6, z, 0.08, 0.36, 0.08, WOOD, WT, WG); at('meshy_hanging_lantern', x + side * 0.68, z, { y: 2.38 }); S.box(x + side * 0.68, 2.52, z, 0.12, 0.2, 0.12, null, 0xffd890, { glow: 1 }); };
[81.2, 85.2, 90.6, 94.4].forEach(y => lantern(RW + 0.5, gx(y), 1)); [83.2, 86.6, 92.6].forEach(y => lantern(RE - 0.5, gx(y), -1));
const bannerPole = (x, z) => { S.cyl(x, 0, z - 0.2, 0.3, 0.5, STONE, ST, Object.assign({ seg: 8, r2: 0.22 }, SG)); S.box(x, 0.5, z - 0.2, 0.14, 5.0, 0.14, WOOD, WT, WG); S.cyl(x, 5.5, z - 0.2, 0.13, 0.34, null, 0xd8b050, { seg: 6, r2: 0 }); S.banner(x, 2.7, z, 1.15, 2.5); };
for (const y of [91.5, 80.4]) { bannerPole(RW + 0.95, gx(y)); bannerPole(RE - 0.95, gx(y)); }
/* the milestone: a rounded stone with the kingdom's name cut in it */
{ const x = RE - 0.5, z = gx(84.5); S.box(x, 0, z, 0.56, 0.78, 0.3, STONE, 0xd2ccc0, SG); P.push({ s: 'roof', form: 'barrel', p: [x, 0.78, z], size: [0.3, 0.28, 0.56], ry: 90, key: STONE, tint: 0xd2ccc0, gain: 1.35, seg: 6 });
  P.push({ s: 'quad', p: [x, 0.42, z + 0.156], size: [0.5, 0.17], ry: 0, key: 'txt:CAMELOT|#3a342c||2.94', tint: 0xffffff, uv: 'fit', kind: 'over' }); }
/* the bridge's foot: a stone lion on a plinth either side of the road, looking down it */
for (const x of [41, 44]) { put('lion_statue', x, 79, { face: 180, y: 1.0 }, 'p'); S.box(gc(x), 0, gc(79), 1.5, 0.22, 3.0, STONE, ST, SG); S.box(gc(x), 0.22, gc(79), 1.2, 0.78, 2.7, STONE, 0xd2ccc0, SG); }
/* the roadside: a well, a wayside cross on a stone foot with candles, a covered wagon with its horse, sacks and crates, a rail to tie up at */
put('ancient_well', 41, 85); at('wooden_bucket', gc(41) + 0.9, gc(85) + 1.0, { face: 40 });
{ const x = gc(41), z = gc(89); sq(41, 89); S.box(x, 0, z, 1.5, 0.22, 1.5, STONE, ST, SG); S.box(x, 0.22, z, 1.05, 0.5, 1.05, STONE, 0xd2ccc0, SG); at('cross', x, z, { y: 0.72, face: 90, floor: true }); ghost(41, 89);
  at('hw_candles', x + 0.5, z + 0.92, { face: 20, floor: true }); at('hw_candle', x - 0.35, z + 0.95, { floor: true }); at('woods_healflower', x - 1.05, z - 0.5, { face: 200, floor: true }); at('woods_healflower', x + 1.1, z - 0.9, { face: 80, floor: true }); }
sq(45, 86); sq(46, 86); at('covered_wagon', gx(46), gc(86), { face: 0 }); put('horse_brown', 44, 86, { face: 270 });
at('meshy_burlap_sack', gx(45) + 0.6, gc(85) + 1.0, { face: 30 }); at('meshy_burlap_sack', gx(45) + 1.3, gc(85) + 0.7, { face: 210 }); at('psx_wooden_crate_2', gx(44) + 1.0, gc(85) - 0.6, { face: 15 }); at('psx_wooden_crate_4', gx(44) + 2.1, gc(85) - 0.9, { face: 70 });
put('hitching_rail', 44, 89, { face: 90 });
/* a great oak either side of the bay and in the notches of the forest track */
tree('tree_52', 12, 41, 92, 1.0); tree('tree_52', 11, 44, 93, 1.0); tree('tree_52', 12.5, 21, 86, 1.0); tree('tree_52', 11.5, 66, 86, 1.0);

/* ── THE GLADE, WEST (P02-07): the woodcutter's glade. A great oak on the knoll, a stack of cut logs, a sawn trunk ── */
const logpile = (x, z, len, ry, rows) => { let y = 0; for (let k = rows; k > 0; k--) { for (let i = 0; i < k; i++) { const o = (i - (k - 1) / 2) * 0.46, c = Math.cos(ry * Math.PI / 180), s = Math.sin(ry * Math.PI / 180);
      const p = [r2(x + o * s), y, r2(z + o * c)]; P.push({ s: 'box', p, size: [len, 0.22, 0.44], ry, key: WOOD, tint: 0x7a5636, gain: 1.4, keyTop: WOOD }); P.push({ s: 'roof', form: 'barrel', p: [p[0], y + 0.22, p[2]], size: [len, 0.22, 0.44], ry, key: WOOD, tint: 0x7a5636, gain: 1.4, keyEnd: PLANK, tintEnd: 0xd8b888, seg: 6 }); } y = r2(y + 0.4); } };
tree('tree_52', 13, 22, 91, 1.1);
sq(25, 89); logpile(gc(25), gc(89), 2.6, 0, 4); ghost(25, 89); logpile(gc(20) + 0.6, gc(91) - 0.4, 1.8, 60, 2); sq(20, 91);
at('psx_hand_saw_1', gc(24) + 0.9, gc(90) - 0.7, { face: 130 }); dec('stump', 19, 90); at('meshy_stump', gc(23) + 1.2, gc(92) - 0.3, { face: 70 });

/* ── THE GLADE, EAST (P05-07): a camp on the road. Two striped tents, the fire, a pot, a spear and shield against a crate ── */
const TENT = [[0xa01e2c, 0xe8dcc0], [0x2c4a7a, 0xe8dcc0]];
const tent = (kx, ky, ry, col) => { const x = gc(kx), z = gc(ky), c = Math.cos(ry * Math.PI / 180), s = Math.sin(ry * Math.PI / 180); sq(kx, ky); ghost(kx, ky);
    for (let i = 0; i < 6; i++) { const o = -1.25 + i * 0.5; P.push({ s: 'roof', form: 'gable', p: [r2(x + o * c), 0, r2(z - o * s)], size: [0.5, 1.9, 2.7], ry, key: 'urban:PlasterWallStucco2a', tint: TENT[col][i % 2], gain: 1.5, keyEnd: 'urban:PlasterWallStucco2a', tintEnd: i === 0 || i === 5 ? 0x3a2c24 : TENT[col][i % 2], ds: true }); }
    P.push({ s: 'box', p: [x, 0, z], size: [3.1, 1.95, 0.08], ry, key: WOOD, tint: WT, gain: 1.4, sides: false, top: false });   // (nothing drawn: the ridge pole below carries the look)
    P.push({ s: 'box', p: [x, 1.86, z], size: [3.3, 0.08, 0.08], ry, key: WOOD, tint: WT, gain: 1.4 }); };
tent(68, 89, 90, 0); tent(63, 89, 60, 1);
put('cauldron', 65, 89); dec('fallen_log', 63, 90); at('psx_wooden_crate_2', gc(69) - 0.2, gc(89) + 2.2, { face: 20, floor: true }); at('spear', gc(69) + 0.5, gc(89) + 2.3, { face: 0, floor: true }); at('spell_shield', gc(69) - 0.9, gc(89) + 2.5, { face: 200, floor: true });
at('meshy_burlap_sack', gc(63) + 1.6, gc(89) + 1.3, { face: 100, floor: true }); put('horse_black', 68, 91, { face: 300 });

/* ── THE STONE RING (P07-07, the deep forest): five standing stones round an altar stone ── */
put('menhir', 87, 89, { face: 20 }); put('sarsen', 89, 89, { face: 90 }); put('menhir', 91, 89, { face: 200 }); put('menhir', 88, 91, { face: 130 }); put('menhir', 90, 91, { face: 290 }); put('stone_altar', 89, 90, { face: 0 });
at('fern', gc(91) + 0.9, gc(90) + 0.8, { face: 50 }); at('psxg_rock_2', gc(87) + 0.2, gc(90) + 1.3, { face: 10 });

/* ── THE DEAD TREE'S HOLE (P00-07): the wood dies round the secret way: bare trees, dead bushes, crows ── */
tree('tree_6', 9, 6, 89, 1.0); tree('tree_5', 7.5, 10, 89, 0.9); tree('tree_6', 8, 6, 90, 0.9); tree('tree_5', 6, 9, 91, 0.8);
dec('crow', 9, 89, { floor: true }); at('crow', gx(7) - 0.5, gc(92), { face: 120 }); at('psxg_dead_bush_1', gx(9) + 0.5, gc(92) + 0.8, { face: 60 }); at('psxg_dead_bush_2', gx(7) - 0.7, gc(93) + 0.6, { face: 210 }); at('psxg_dead_bush_1', gx(9) + 0.7, gc(94), { face: 300 });
at('meshy_dead_tree_with_a_dark_hole', gx(6) + 0.6, gc(95) - 0.4, { h: 8.5, face: 150 }); at('hollow_dead_tree', gx(10) + 0.4, gc(95) - 0.2, { h: 7.5, face: 20 });   // two great dead trunks either side of the hole itself

/* ── THE MOAT'S SOUTH BANK: two rowboats tied up at posts ── */
for (const x of [30, 58]) { at(x === 30 ? 'rowboat' : 'meshy_rowboat', gc(x), gx(77.5), x === 30 ? { y: 2.05, face: 8 } : { y: -0.2, floor: true, face: 172 }); S.cyl(gc(x) + 2.1, -0.6, gx(77.9), 0.11, 1.7, WOOD, WT, Object.assign({ seg: 7 }, WG)); at('meshy_rope', gc(x) + 1.9, gx(78) + 0.25, { face: 40 }); }

/* ── THE UNDERGROWTH: ferns, stones, dead bushes and old stumps under the first trees along the road, the forest track and the bank's
   track (by the district's own dice; only on tree squares, so nothing stands in a way) ── */
const UNDER = ['fern', 'fern', 'fern', 'fern', 'psxg_rock_1', 'psxg_rock_2', 'psxg_rock_3', 'fern', 'psxg_dead_bush_2', 'meshy_stump', 'hw_stone', 'fern', 'psxg_rock_4', 'fern'];
const under = (x, z) => { const kx = Math.floor((x + 168) / 3.5), ky = Math.floor((z + 168) / 3.5); if (kx < 0 || ky < 0 || kx > 95 || ky > 95 || cell[ky][kx] !== 't') return; at(UNDER[Math.floor(rnd() * UNDER.length)], x, z, { face: Math.round(rnd() * 360) }); };
for (let y = 80; y < 96; y += 0.55 + rnd() * 0.5) { under(RW - 0.5 - rnd() * 1.5, gx(y)); under(RE + 0.5 + rnd() * 1.5, gx(y + 0.3)); }
for (let x = 9; x < 88; x += 0.7 + rnd() * 0.9) { under(gx(x), gx(87) - 0.5 - rnd() * 1.6); under(gx(x + 0.4), gx(89) + 0.5 + rnd() * 1.6); }
for (let x = 13; x < 83; x += 1.2 + rnd() * 1.4) under(gx(x), gx(80) + 0.5 + rnd() * 1.4);
for (let y = 80; y < 96; y += 0.9 + rnd() * 0.9) { under(gx(7) - 0.5 - rnd() * 1.3, gx(y)); under(gx(9) + 0.5 + rnd() * 1.3, gx(y)); under(gx(88) - 0.5 - rnd() * 1.3, gx(y)); under(gx(90) + 0.5 + rnd() * 1.3, gx(y)); }

arch.push({ k: 'arch', id: 'cam:w:forest', x: 0, z: 0, rot: 0, y: 0, parts: P }); flushArch();
}
module.exports = { build, ground, groundAlso };
