/* CAMELOT KINGDOM · THE FOREST (district W, 8 plots) — the south woods: the forest and the road from DOOR HQ.
   Repo tooling only: bake-camelot.js calls `build(ctx)` after the shared pieces stand (last of the districts).

   THE PLOTS: P00-07 The Dead Tree's Hole · P01-07 The Forest Road, west · P02-07 The Glade, west · P03-07 The Crown's Road ·
   P04-07 The Forest Road · P05-07 The Glade, east · P06-07 The Forest Road, east · P07-07 Deep forest, south-east (squares x 0..96,
   y 84..96). The forest runs on north to the moat's south bank, over the bottom of the village's south plots: dressed here too.

   WHAT STANDS HERE TODAY (pass 1, 2026-11-16, seen on screen): THE CROWN'S ROAD: stone kerbs, seven lantern posts, the royal banner on four
   poles (bay and bridge), a CAMELOT milestone, two stone lions on plinths at the bridge's foot, a well, a wayside cross with candles, a
   covered wagon with its horse, sacks and crates, a hitching rail, great oaks at the bay. THE GLADE, WEST: the woodcutter's glade (a great
   oak on the knoll, two stacks of cut logs, a saw, stumps) and THE WOODCUTTER'S HUT (pass 2: `cam:w_hut`, squares 19..21 x 89..90, door on
   the track; walked into: hearth, bed, table, workbench; the middle column stays clear). THE GLADE, EAST: a camp (two striped tents, the fire, a pot, a horse, spear and
   shield). THE STONE RING in the deep forest (P07-07). THE DEAD TREE'S HOLE: bare trees, dead bushes, crows, two great dead trunks by the
   hole. THE MOAT'S SOUTH BANK: two rowboats at mooring posts. THE UNDERGROWTH: about 250 ferns, stones, dead bushes and stumps under the
   first trees along every way. The forest floor is `grass_dark_fantasy` (exports `ground` + `groundAlso`). The trees are the tool's.

   NOT HERE (the tool's, shared): the way in from DOOR HQ on P03-07 (the portcullis bay at square 43, 93: the room's spawn, its two
   braziers and its signpost), the Crown's Road itself, the dead tree's hole on P00-07 (`deadtree`, a secret way to The Woods), the moat,
   the Drawbridge. Dress round them, do not move them: the arrival is the first thing a player sees of the kingdom.

   PASS 3 (dressing + life): five silent natives (robinhood at the camp, a knight at the bay, a wizard in the stone ring, a tree person and a
   rabbit in the woodcutter's glade), signposts at the track's far crossings, trodden earth, leaves under the oaks, stepping stones, flowers,
   bees, butterflies, hens, a wolf, crows, frogs, reeds (the Ocean pack's weed) along the moat's bank.
   PASS 4 (atmosphere): `airZones` (gold motes through the forest, fireflies over the glades, the bay and the bank, blue motes in the ring,
   ash at the dead tree's hole), six more lantern posts (the track's crossings, the hut, the camp, the bridge's foot), smoke over the camp's fire.
   PASS 5 (polish): lanterns on the two side paths, a lit pane under every lantern, a rug and a shelf in the hut, softer earth patches.
   FIVE PASSES + THE MODEL PASS DONE: the district is STOPPED until mondo has seen it (docs/plans/DISTRICT_THREAD_BRIEF.md).
   THE MODEL PASS (2026-11-16, mondo's wish-list models, docs/plans/WISHLIST_MODELS_ADDED.md): every model this file asked for is placed
   and the stand-ins are out. `lantern_post` x 17 for the posts drawn from boxes; `medieval_pavilion` x 2 for the drawn tents; `reeds`
   for the Ocean pack's weed; `milestone` x 2 for the drawn stone; `firewood_stack` x 5 for the drawn log stacks; `floor_runner` for the
   drawn rug; `axe_chopping_block`, `hand_cart`, `wooden_barrel` x 2, `deer` x 2, `fox`, `owl_perched`, `leafy_bush` x 5, `wild_flowers`.
   Also from the list: `kennel`, `wheelbarrow`, `water_trough`, `hay_rack`, `beehive`, `woven_baskets`, `kettle`, `antler_trophy`,
   `lit_candle`, `moss_clump`, `willow_tree` x 2, `cairn` x 2, `heron`, `duck` x 2, `dragonfly` x 2, `hedgehog`, `raven_perch`,
   `fishing_rod`, `oars`, `drying_fish`.
   NEEDS A MODEL: nothing left of the first list. Still drawn in code because no model exists: the hut's bed, its small table and
   stools, the mooring posts, the wayside cross's stone foot, the lions' plinths, the banner poles.
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
const { r2, gx, gc, feat, note, props, put, dec, tree, arch, flushArch, sq, cell, inside, native } = ctx;
const at = (key, x, z, o) => props.push(Object.assign({ key, x: r2(x), z: r2(z) }, o || {}));   // a piece by metres, no dice of the kingdom's
let seed = 7077; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };   // the district's own dice
const STONE = 'castle_wall', ST = 0xc4c0b8, SG = { gain: 1.35 }, WOOD = 'wood', WT = 0x6a4628, WG = { gain: 1.4 }, PLANK = 'wood_planks';
const S = ctx.sheet(), P = S.P;   // THE DRAWN PIECES: one row for the whole district, in the room's metres (few looks: a look is a mesh)
const ghost = (x, y) => feat({ k: 'wall', ghost: true, rail: false, x0: gx(x) + 0.3, z0: gc(y), x1: gx(x + 1) - 0.3, z1: gc(y), t: 2.9, h: 2.2 });   // what a drawn piece weighs: its whole square

note('THE FOREST: the Crown\'s Road, the glades, the stone ring, the dead tree\'s hole, the moat\'s south bank');
/* ── the glades' knolls (as they stood) ── */
feat({ k: 'hill', x: gc(22), z: gc(91), r: 4.6, h: 1.2 }); dec('fallen_log', 24, 90); dec('stump', 23, 91); feat({ k: 'hill', x: gc(66), z: gc(91), r: 4.6, h: 1.2 }); dec('fallen_log', 67, 90); put('campfire', 64, 90);
dec('rabbit', 45, 85); dec('stump', 40, 86); dec('fern', 45, 89); dec('fern', 90, 90); dec('stump', 87, 90);
tree('tree_5', 6.5, 9, 90, 0.9);

/* ── THE CROWN'S ROAD (P03-07 and on north to the Drawbridge): the first thing seen of the kingdom. Stone kerbs, lantern posts on both
   sides, the royal banner on poles at the bay and at the bridge, a milestone, two stone lions at the bridge's foot. The road, the bay,
   its braziers and its signpost are the tool's: nothing here moves them. ── */
const RW = gx(42), RE = gx(44);
for (const x of [RW + 0.14, RE - 0.14]) for (const q of [[80, 87], [89, 96]]) S.box(x, 0, (gx(q[0]) + gx(q[1])) / 2, 0.28, 0.16, gx(q[1]) - gx(q[0]), STONE, ST, SG);
/* THE MODEL PASS: the wish-list `lantern_post` (2.2 m) in place of the post drawn from boxes with the Village's lantern hung on it. A post
   blocks, so every one stands just OFF its way, under the first trees (a tree square: nothing walks there). */
const LFACE = { n: 180, e: 270, s: 0, w: 90 };
const lantern = (x, z, side) => { at('lantern_post', x, z, { face: LFACE[side === 1 ? 'e' : side === -1 ? 'w' : side] }); S.box(x, 2.2, z, 0.2, 0.03, 0.2, null, 0xffc860, { glow: 1 }); };   // the model's glass does not glow: a lit cap on the post's head, so a post is found at night (which side the lantern hangs on did not follow `face` in the probe)
[81.2, 85.2, 90.6, 94.4].forEach(y => lantern(RW - 0.45, gx(y), 1)); [83.2, 86.6, 92.6].forEach(y => lantern(RE + 0.45, gx(y), -1));
const bannerPole = (x, z) => { S.cyl(x, 0, z - 0.2, 0.3, 0.5, STONE, ST, Object.assign({ seg: 8, r2: 0.22 }, SG)); S.box(x, 0.5, z - 0.2, 0.14, 5.0, 0.14, WOOD, WT, WG); S.cyl(x, 5.5, z - 0.2, 0.13, 0.34, null, 0xd8b050, { seg: 6, r2: 0 }); S.banner(x, 2.7, z, 1.15, 2.5); };
for (const y of [91.5, 80.4]) { bannerPole(RW + 0.95, gx(y)); bannerPole(RE - 0.95, gx(y)); }
/* the milestones (THE MODEL PASS: the wish-list `milestone` in place of the drawn stone), off the road's edge */
at('milestone', RE + 0.45, gx(84.5), { face: 270 }); at('milestone', RW - 0.45, gx(90.3), { face: 90 });
/* the bridge's foot: a stone lion on a plinth either side of the road, looking down it */
for (const x of [41, 44]) { put('lion_statue', x, 79, { face: 180, y: 1.0 }, 'p'); S.box(gc(x), 0, gc(79), 1.5, 0.22, 3.0, STONE, ST, SG); S.box(gc(x), 0.22, gc(79), 1.2, 0.78, 2.7, STONE, 0xd2ccc0, SG); }
/* the roadside: a well, a wayside cross on a stone foot with candles, a covered wagon with its horse, sacks and crates, a rail to tie up at */
put('ancient_well', 41, 85); at('wooden_bucket', gc(41) + 0.9, gc(85) + 1.0, { face: 40 });
{ const x = gc(41), z = gc(89); sq(41, 89); S.box(x, 0, z, 1.5, 0.22, 1.5, STONE, ST, SG); S.box(x, 0.22, z, 1.05, 0.5, 1.05, STONE, 0xd2ccc0, SG); at('cross', x, z, { y: 0.72, face: 90, floor: true }); ghost(41, 89);
  at('hw_candles', x + 0.5, z + 0.92, { face: 20, floor: true }); at('hw_candle', x - 0.35, z + 0.95, { floor: true }); at('woods_healflower', x - 1.05, z - 0.5, { face: 200, floor: true }); at('woods_healflower', x + 1.1, z - 0.9, { face: 80, floor: true }); }
sq(45, 86); sq(46, 86); at('covered_wagon', gx(46), gc(86), { face: 0 }); put('horse_brown', 44, 86, { face: 270 });
at('meshy_burlap_sack', gx(45) + 0.6, gc(85) + 1.0, { face: 30 }); at('meshy_burlap_sack', gx(45) + 1.3, gc(85) + 0.7, { face: 210 }); at('psx_wooden_crate_2', gx(44) + 0.6, gc(85) - 1.15, { face: 15 }); at('psx_wooden_crate_4', gx(44) + 3.0, gc(85) - 1.2, { face: 70 }); put('wooden_barrel', 44, 85); at('water_trough', gc(44) + 1.25, gc(89), { face: 90 });
put('hitching_rail', 44, 89, { face: 90 });
/* a great oak either side of the bay and in the notches of the forest track */
tree('tree_52', 12, 41, 92, 1.0); tree('tree_52', 11, 44, 93, 1.0); tree('tree_52', 12.5, 21, 86, 1.0); tree('tree_52', 11.5, 66, 86, 1.0);

/* ── THE GLADE, WEST (P02-07): the woodcutter's glade. A great oak on the knoll, a stack of cut logs, a sawn trunk ── */
tree('tree_52', 13, 22, 91, 1.1);
sq(25, 89); at('firewood_stack', gc(25), gc(89) - 0.4, { face: 0 }); at('firewood_stack', gc(25), gc(89) + 0.4, { face: 0 }); at('owl_perched', gc(25) + 0.3, gc(89) - 0.4, { y: 0.82, face: 200 }); sq(24, 91); at('firewood_stack', gc(24) + 0.4, gc(91) + 0.3, { face: 60 });   // THE MODEL PASS: `firewood_stack` in place of the drawn logs; an owl on the stack
at('psx_hand_saw_1', gc(24) + 0.9, gc(90) - 0.7, { face: 130 }); dec('stump', 21, 92); at('meshy_stump', gc(23) + 1.2, gc(92) - 0.3, { face: 70 });

/* ── THE WOODCUTTER'S HUT (pass 2; P02-07, squares 19..21 x 89..90, its door on the forest track): boards on a stone foot under a thatched
   hip roof, a stone chimney, two lit windows. Walked into: three squares by two. The door's column (the middle) stays clear; what blocks
   stands on the four corner squares: the bed, the table, the hearth, the workbench. Frame: x along the front, +z out of the door. ── */
{ const STUCCO = 'urban:PlasterWallStucco2a', GLASS = 'urban:GlassWindowTall1a', TIMBER = 0x4a3626, BOARD = 0xb89468, STRAW = 0xc8ac64, TOP = 2.95;
  const HUT = ctx.building('w_hut', [19, 89, 22, 91], 'N', 3.5, { leafDouble: false, leaf: 'leaf_shabby_wood', keyIn: PLANK, floorIn: 'wood_planks' }, (a, w, d, door) => {
      a.shell(w, 3.5, d, PLANK, BOARD, door); a.P.slice(-2).forEach(q => { q.gain = 1.5; });
      { const t = 0.25, a0 = door.lx - door.cw / 2 - 0.12, a1 = door.lx + door.cw / 2 + 0.12, x0 = -(w / 2 + t), x1 = w / 2 + t;   // the stone foot: four strips, the front one broken at the door
        a.box(0, 0, -(d / 2 + t / 2), w + 2 * t, 0.8, t, STONE, 0xaeaaa6); for (const q of [-1, 1]) a.box(q * (w / 2 + t / 2), 0, 0, t, 0.8, d, STONE, 0xaeaaa6);
        a.box((x0 + a0) / 2, 0, d / 2 + t / 2, a0 - x0, 0.8, t, STONE, 0xaeaaa6); a.box((a1 + x1) / 2, 0, d / 2 + t / 2, x1 - a1, 0.8, t, STONE, 0xaeaaa6); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * (w / 2 + 0.06), 0.8, sz * (d / 2 + 0.06), 0.28, 2.7, 0.28, WOOD, TIMBER, WG);   // corner posts
      for (const sz of [-1, 1]) a.box(0, 3.3, sz * (d / 2 + 0.08), w + 0.4, 0.22, 0.2, WOOD, TIMBER, WG);
      a.roof('hip', 0, 3.5, 0, w + 1.6, 3.4, d + 1.6, WOOD, STRAW, { gain: 1.9 });
      a.box(w / 2 - 1.75, 0, -d / 2 - 0.55, 1.7, 7.4, 1.1, STONE, ST, { roof: true, gain: 1.3 }); a.box(w / 2 - 1.75, 7.4, -d / 2 - 0.55, 2.0, 0.3, 1.4, STONE, 0xaeaaa6, { roof: true });   // the chimney up the back wall
      for (const x of [-3.5, 3.5]) { a.box(x, 1.35, d / 2 + 0.07, 1.0, 1.1, 0.1, GLASS, 0xf0d890, { glow: 0.55 }); a.box(x, 2.45, d / 2 + 0.1, 1.3, 0.14, 0.16, WOOD, TIMBER, WG); a.box(x, 1.21, d / 2 + 0.1, 1.3, 0.14, 0.2, WOOD, TIMBER, WG);
          for (const q of [-1, 1]) a.box(x + q * 0.78, 1.3, d / 2 + 0.09, 0.5, 1.2, 0.06, PLANK, 0x7a5636, { gain: 1.3 }); }   // shutters
      a.box(-w / 2 - 0.07, 1.35, 0, 0.1, 1.1, 1.0, GLASS, 0xf0d890, { glow: 0.55 });
      /* the board over the door: a plain trade word */
      a.box(door.lx, 2.5, d / 2 + 0.12, 2.6, 0.52, 0.08, PLANK, 0x6a4628, { gain: 1.4 }); a.P.push({ s: 'quad', p: [door.lx, 2.56, d / 2 + 0.17], size: [2.3, 0.4], ry: 0, key: 'txt:WOODCUTTER|#f0d890||5.75', tint: 0xffffff, uv: 'fit', kind: 'over' });
      /* a lean-to on the left gable end with cut logs under it */
      a.roof('shed', -w / 2 - 1.3, 2.2, 0, 4.4, 0.9, 2.4, WOOD, STRAW, { ry: 270, under: true, gain: 1.9 }); for (const z of [-2.0, 2.0]) a.box(-w / 2 - 2.35, 0, z, 0.2, 2.25, 0.2, WOOD, TIMBER, WG);
      /* (THE MODEL PASS: the cut logs under it are the wish-list `firewood_stack` now, placed below) */
  });
  flushArch();
  for (let y = 89; y < 91; y++) for (let x = 19; x < 22; x++) sq(x, y);
  /* the inside: one row. A lit board ceiling with beams, a board coat on the walls, the furniture */
  const a = ctx.sheet(), Q = a.P, c0 = HUT.at(0, 0), w = HUT.fw, d = HUT.fd, W2 = w / 2, D2 = d / 2, E = 0.33, lx = HUT.door.lx, dw = HUT.door.cw + 0.12;
  arch.push({ k: 'arch', id: 'cam:w_hut:in', x: c0[0], z: c0[1], rot: HUT.face(0), parts: Q });
  const quad = (x, y, z, qw, qh, ry, key, tint, o) => Q.push(Object.assign({ s: 'quad', p: [x, y, z], size: [qw, qh], ry, kind: 'wall', key, tint }, o || {}));
  const COAT = { gain: 1.6, glow: 0.32 };
  quad(0, 0, -D2 + E, w - 2 * E, TOP, 0, PLANK, 0xb08a5c, COAT); quad(0, 0, D2 - E, w - 2 * E, TOP, 180, PLANK, 0xb08a5c, Object.assign({ hole: [r2(-lx), dw, 2.25] }, COAT));
  quad(-W2 + E, 0, 0, d - 2 * E, TOP, 270, PLANK, 0xb08a5c, COAT); quad(W2 - E, 0, 0, d - 2 * E, TOP, 90, PLANK, 0xb08a5c, COAT);
  a.box(0, TOP, 0, w - 2 * E, 0.06, d - 2 * E, PLANK, 0x9a7650, { sides: false, top: false, under: true, glow: 0.6 });
  for (const x of [-1.75, 1.75]) a.box(x, TOP - 0.28, 0, 0.26, 0.28, d - 2 * E, WOOD, TIMBER, { glow: 0.3, gain: 1.4 });
  const pin = (key, x, z, face, o) => inside(HUT, key, x, z, Object.assign({ face: face || 0, floor: true }, o || {}));
  const on = (key, x, z, y, face, o) => inside(HUT, key, x, z, Object.assign({ face: face || 0, y, floor: true }, o || {}));
  const block = (x0, z0, x1, z1, t, h) => { const p = HUT.at(x0, z0), q = HUT.at(x1, z1); feat({ k: 'wall', x0: p[0], z0: p[1], x1: q[0], z1: q[1], t, h: h || 1.1, ghost: true, rail: false }); };
  /* the lit windows seen from inside (front wall, left wall) */
  for (const x of [-3.5, 3.5]) { a.box(x, 1.35, D2 - E - 0.03, 1.0, 1.1, 0.04, GLASS, 0xf0d890, { glow: 0.9 }); a.box(x, 2.45, D2 - E - 0.03, 1.3, 0.14, 0.12, WOOD, TIMBER, { gain: 1.4, glow: 0.2 }); a.box(x, 1.21, D2 - E - 0.05, 1.3, 0.14, 0.18, WOOD, TIMBER, { gain: 1.4, glow: 0.2 }); }
  a.box(-W2 + E + 0.03, 1.35, 0, 0.04, 1.1, 1.0, GLASS, 0xf0d890, { glow: 0.9 });
  /* THE HEARTH on the back right square: two stone piers, a lintel, the breast up to the ceiling, the fire, a pot beside it */
  { const hx = 3.5, hz = -D2 + E + 0.45; for (const q of [-1, 1]) a.box(hx + q * 0.95, 0, hz, 0.5, 1.4, 0.9, STONE, ST, { gain: 1.3, glow: 0.12 });
    a.box(hx, 1.4, hz, 2.4, 0.35, 0.95, STONE, 0xd2ccc0, { gain: 1.3, glow: 0.12, under: true }); a.box(hx, 1.75, hz - 0.1, 1.8, TOP - 1.75, 0.7, STONE, ST, { gain: 1.3, glow: 0.12 });
    a.box(hx, 0, hz - 0.3, 1.4, 1.4, 0.06, STONE, 0x2a2422); a.box(hx, 0.036, hz + 0.1, 1.4, 0.05, 0.9, STONE, 0x3a3432);
    pin('hearth_fire', hx, hz + 0.05, 180, { noLight: true, h: 0.9 }); pin('cauldron', hx - 0.2, hz + 1.25, 30, { h: 0.55 }); block(hx - 1.3, -1.75, hx + 1.3, -1.75, 2.9, 1.4); }
  /* THE BED on the back left square, a chest at its foot, a sack */
  { const bx = -3.6, bz = -D2 + E + 0.72; a.box(bx, 0.036, bz, 2.1, 0.42, 1.05, PLANK, 0x7a5636, { gain: 1.4, glow: 0.12 }); a.box(bx, 0.456, bz, 2.0, 0.14, 0.95, STUCCO, 0xd8c890, { gain: 1.5, glow: 0.15 }); a.box(bx + 0.3, 0.596, bz, 1.35, 0.05, 0.99, STUCCO, 0x8a3a2c, { gain: 1.5, glow: 0.15 });
    a.box(bx - 0.75, 0.596, bz, 0.42, 0.1, 0.6, STUCCO, 0xe8e0cc, { gain: 1.5, glow: 0.15 }); a.box(bx - 1.08, 0.036, bz, 0.08, 0.95, 1.05, PLANK, 0x6a4628, { gain: 1.4, glow: 0.12 }); } pin('sea_chest', -2.45, -D2 + E + 2.2, 270, { h: 0.55 }); pin('meshy_burlap_sack', -4.6, -D2 + E + 2.4, 40); block(-4.9, -1.75, -2.1, -1.75, 2.9, 0.9);
  /* THE TABLE on the front left square: boards on two trestles, two stools, a plate, a candle, the supper */
  { const tx = -3.5, tz = 1.6; a.box(tx, 0.74, tz, 2.0, 0.07, 0.95, PLANK, 0x9a7244, { gain: 1.4, glow: 0.12 }); for (const q of [-1, 1]) a.box(tx + q * 0.7, 0, tz, 0.12, 0.74, 0.8, WOOD, 0x5a4230, WG);
    for (const q of [-1, 1]) a.cyl(tx + q * 0.45, 0, tz + q * 0.85, 0.2, 0.45, PLANK, 0x7a5632, { seg: 8, gain: 1.4 });
    on('psx_plate_mp_1', tx - 0.4, tz + 0.1, 0.82, 0); on('psx_meat_1', tx - 0.4, tz + 0.1, 0.84, 30); on('lit_candle', tx + 0.5, tz - 0.15, 0.81, 0); on('psx_butcher_knife_mp_1', tx + 0.05, tz + 0.25, 0.82, 70); block(tx - 1.3, tz, tx + 1.3, tz, 2.6, 0.8); }
  /* THE WORKBENCH on the front right square, along the right wall: the saw and a mallet on it, cut logs under it, a coil of rope */
  { const bx = W2 - E - 0.6, bz = 1.6; a.box(bx, 0.85, bz, 1.0, 0.1, 2.6, PLANK, 0x8a6238, { gain: 1.4, glow: 0.12 }); for (const z of [-1.1, 1.1]) a.box(bx, 0, bz + z, 0.85, 0.85, 0.14, WOOD, 0x5a4230, WG);
    pin('firewood_stack', W2 - E - 0.45, -0.75, 90);
    on('psx_hand_saw_1', bx, bz - 0.5, 0.96, 80); on('xmas_hammer', bx, bz + 0.6, 0.96, 20, { h: 0.5 }); pin('meshy_rope', bx - 0.9, bz + 1.1, 0); pin('wooden_bucket', bx - 1.0, bz - 1.2, 0); block(bx, bz - 1.4, bx, bz + 1.4, 2.6, 0.95); }
  /* PASS 5: a striped rug down the door's column (drawn: the game has no floor carpet), a shelf of jars on the back wall */
  pin('floor_runner', -0.87, -0.2, 90); pin('kettle', 4.0, -D2 + E + 1.2, 40); on('antler_trophy', -3.6, -D2 + E + 0.12, 1.75, 180); pin('woven_baskets', -4.6, 0.2, 30);   // THE MODEL PASS: the runner in place of the drawn rug; a kettle, antlers over the bed, baskets
  a.box(-0.6, 1.5, -D2 + E + 0.16, 1.8, 0.06, 0.3, PLANK, 0x8a6238, { gain: 1.4, glow: 0.15 }); for (let i = 0; i < 4; i++) a.cyl(-1.25 + i * 0.44, 1.56, -D2 + E + 0.16, 0.09 + (i % 2) * 0.03, 0.2 + (i % 3) * 0.06, STUCCO, [0xb86a54, 0xd8c890, 0x6a8a5a, 0xb86a54][i], { seg: 8, gain: 1.5, glow: 0.15 });
  /* a torch on the back wall over the door's column */
  inside(HUT, 'wall_torch', 0, -D2 + 0.5, { face: 180, y: 2.0, floor: true, noLight: true });
  flushArch();
  /* smoke from the chimney; the woodcutter's dog in the yard; a chopping stump and the cut logs' stack east of the hut */
  inside(HUT, 'chimney_smoke', W2 - 1.75, -D2 - 0.55, { y: 7.8, rise: 5 });
  inside(HUT, 'firewood_stack', -W2 - 1.25, 0, { face: 90 });
  put('axe_chopping_block', 23, 90, { face: 40 }); put('hand_cart', 25, 90, { face: 20 }); put('kennel', 21, 91, { face: 90 }); at('dog', gc(21) + 1.5, gc(91) + 0.3, { face: 100 }); at('wheelbarrow', gc(24) + 0.9, gc(89) + 0.9, { face: 150 }); }

/* ── THE GLADE, EAST (P05-07): a camp on the road. Two striped tents, the fire, a pot, a spear and shield against a crate ── */
/* THE MODEL PASS: two wish-list `medieval_pavilion` in place of the two drawn ridge tents */
put('medieval_pavilion', 68, 89, { face: 180 }); put('medieval_pavilion', 63, 89, { face: 140 }); put('wooden_barrel', 67, 89); put('hay_rack', 67, 91, { face: 30 }); at('woven_baskets', gc(64) + 1.3, gc(89) + 0.9, { face: 70 });
put('cauldron', 65, 89); dec('fallen_log', 63, 90); at('psx_wooden_crate_2', gc(69) - 0.2, gc(89) + 2.2, { face: 20, floor: true }); at('spear', gc(69) + 0.5, gc(89) + 2.3, { face: 0, floor: true }); at('spell_shield', gc(69) - 0.9, gc(89) + 2.5, { face: 200, floor: true });
at('meshy_burlap_sack', gc(63) + 1.6, gc(89) + 1.3, { face: 100, floor: true }); put('horse_black', 68, 91, { face: 300 });

/* ── THE STONE RING (P07-07, the deep forest): five standing stones round an altar stone ── */
put('menhir', 87, 89, { face: 20 }); put('sarsen', 89, 89, { face: 90 }); put('menhir', 91, 89, { face: 200 }); put('menhir', 88, 91, { face: 130 }); put('menhir', 90, 91, { face: 290 }); put('stone_altar', 89, 90, { face: 0 });
at('fern', gc(91) + 0.9, gc(90) + 0.8, { face: 50 }); at('psxg_rock_2', gc(87) + 0.2, gc(90) + 1.3, { face: 10 });

/* ── THE DEAD TREE'S HOLE (P00-07): the wood dies round the secret way: bare trees, dead bushes, crows ── */
tree('tree_6', 9, 6, 89, 1.0); tree('tree_5', 7.5, 10, 89, 0.9); tree('tree_6', 8, 6, 90, 0.9); tree('tree_5', 6, 9, 91, 0.8);
dec('crow', 9, 89, { floor: true }); at('crow', gx(7) - 0.5, gc(92), { face: 120 }); at('psxg_dead_bush_1', gx(9) + 0.5, gc(92) + 0.8, { face: 60 }); at('psxg_dead_bush_2', gx(7) - 0.7, gc(93) + 0.6, { face: 210 }); at('psxg_dead_bush_1', gx(9) + 0.7, gc(94), { face: 300 });
at('meshy_dead_tree_with_a_dark_hole', gx(6) + 0.6, gc(95) - 0.4, { h: 8.5, face: 150 }); at('hollow_dead_tree', gx(10) + 0.4, gc(95) - 0.2, { h: 7.5, face: 20 });   // two great dead trunks either side of the hole itself

/* ── THE MOAT'S SOUTH BANK: two rowboats pulled up on the bank by their mooring posts (on the bank, not afloat: a prop's `y` under 1 m is
   a lift from the ground UNDER it, and under a boat on the moat that is the bed) ── */
for (const x of [30, 58]) { at(x === 30 ? 'rowboat' : 'meshy_rowboat', gc(x), gx(78) + 0.95, { face: x === 30 ? 8 : 172 }); S.cyl(gc(x) + 2.1, -0.6, gx(77.9), 0.11, 1.7, WOOD, WT, Object.assign({ seg: 7 }, WG)); at('meshy_rope', gc(x) + 1.9, gx(78) + 0.25, { face: 40 }); }

/* ── THE UNDERGROWTH: ferns, stones, dead bushes and old stumps under the first trees along the road, the forest track and the bank's
   track (by the district's own dice; only on tree squares, so nothing stands in a way) ── */
const UNDER = ['fern', 'fern', 'fern', 'fern', 'psxg_rock_1', 'psxg_rock_2', 'psxg_rock_3', 'fern', 'moss_clump', 'meshy_stump', 'hw_stone', 'fern', 'psxg_rock_4', 'fern', 'fern', 'wild_flowers'];   // THE MODEL PASS: moss and wild flowers joined the mix, one in sixteen each (a wish-list model is 1,300 to 8,200 triangles: a fern is the cheap filler), the dead bush left it
const under = (x, z) => { const kx = Math.floor((x + 168) / 3.5), ky = Math.floor((z + 168) / 3.5); if (kx < 0 || ky < 0 || kx > 95 || ky > 95 || cell[ky][kx] !== 't') return; at(UNDER[Math.floor(rnd() * UNDER.length)], x, z, { face: Math.round(rnd() * 360) }); };
for (let y = 80; y < 96; y += 0.55 + rnd() * 0.5) { under(RW - 0.5 - rnd() * 1.5, gx(y)); under(RE + 0.5 + rnd() * 1.5, gx(y + 0.3)); }
for (let x = 9; x < 88; x += 0.7 + rnd() * 0.9) { under(gx(x), gx(87) - 0.5 - rnd() * 1.6); under(gx(x + 0.4), gx(89) + 0.5 + rnd() * 1.6); }
for (let x = 13; x < 83; x += 1.2 + rnd() * 1.4) under(gx(x), gx(80) + 0.5 + rnd() * 1.4);
for (let y = 80; y < 96; y += 0.9 + rnd() * 0.9) { under(gx(7) - 0.5 - rnd() * 1.3, gx(y)); under(gx(9) + 0.5 + rnd() * 1.3, gx(y)); under(gx(88) - 0.5 - rnd() * 1.3, gx(y)); under(gx(90) + 0.5 + rnd() * 1.3, gx(y)); }

/* ── PASS 3, THE DRESSING AND THE LIFE (2026-11-16). People (silent: nobody's lines are invented), animals, signposts at the track's two
   far crossings, reeds along the moat's bank, flowers under the oaks, trodden earth where feet go, stepping stones into the glades ── */
native('robinhood', 66, 89, 200); native('knight', 41, 93, 90); native('wizard', 89, 91, 0); native('tree person', 20, 91, 60); native('rabbit', 23, 92, 300);
put('signpost', 6, 88, { face: 90 }); put('signpost', 90, 87, { face: 270 });
/* trodden earth: before the hut's door, round the camp's fire, inside the stone ring, at the well and the wagon; fallen leaves under the oaks */
const patch = (x, z, r, key, tint, o) => { if (key === 'dirt_2') P.push({ s: 'cyl', p: [r2(x), 0, r2(z)], r: r2(r * 1.22), h: 0.018, seg: 22, key: 'grass_dark_fantasy', tint: 0xb8a878, gain: 1.2 }); P.push(Object.assign({ s: 'cyl', p: [r2(x), 0, r2(z)], r, h: 0.03, seg: 22, key, tint, gain: 1.45 }, o || {})); };
patch(gc(64), gc(90), 3.1, 'dirt_2', 0xc8b8a0); patch(gc(89), gc(90), 4.4, 'dirt_2', 0xb8b0a0); patch(gc(41), gc(85), 2.0, 'dirt_2', 0xc8b8a0); patch(gx(46), gc(86), 3.0, 'dirt_2', 0xc8b8a0); patch(gc(22) + 1.2, gc(89) + 0.8, 2.4, 'dirt_2', 0xc8b8a0);
for (const q of [[41, 92, 2.6], [44, 93, 2.4], [21, 86, 2.6], [66, 86, 2.5]]) patch(gc(q[0]), gc(q[1]), q[2], 'leaves_3', 0xd8c890, { gain: 1.3 });
/* stepping stones: from the track into the camp, and into the stone ring */
[[65.2, 88.9, 10], [65.0, 89.25, 200], [64.7, 89.6, 80], [89.9, 88.6, 40], [89.6, 89.0, 150], [89.3, 89.35, 260]].forEach((q, i) => at(i % 2 ? 'psxg_stepping_stone_2' : 'psxg_stepping_stone_1', gx(q[0]), gx(q[1]), { face: q[2], h: 0.024 }));
/* flowers under the great oaks and at the glades' edges (the Rejuvenation flower: the only flower in the game), bees and butterflies over them */
[[41, 91, 0.9, 0.6], [41, 91, -0.8, -0.9], [44, 92, 0.7, -0.8], [41, 95, 0.2, 0.5], [44, 95, -0.5, 0.2], [22, 86, 0.6, 0.4], [22, 86, -0.9, -0.3], [25, 90, 0.8, 0.9], [20, 91, -1.0, 0.9], [22, 92, 0.3, 1.0],
 [64, 91, 0.4, -0.6], [69, 89, 1.0, -1.1], [66, 92, 0.2, 1.0], [88, 91, -1.0, 0.9], [90, 91, 1.0, 0.9], [91, 90, 1.1, -0.4]].forEach((q, i) => { const key = i % 5 === 3 ? 'woods_thornvine' : 'wild_flowers';
    if (cell[q[1]][q[0]] !== 'g') throw new Error('W: a flower off the grass at ' + q[0] + ',' + q[1]); at(key, gc(q[0]) + q[2], gc(q[1]) + q[3], { face: (i * 67) % 360, h: key === 'woods_thornvine' ? 0.9 : 0.4 + (i % 3) * 0.08 }); });
at('bee', gc(41) + 0.9, gc(91) + 0.6, { y: 0.8 }); at('bumblebee', gc(22) + 0.6, gc(86) + 0.4, { y: 0.7 }); at('monarch', gc(23), gc(91), { y: 1.3 }); at('swallowtail', gc(65), gc(91), { y: 1.5 }); at('butterfly', gc(89) + 1, gc(90) + 1, { y: 1.2 }); at('butterfly', gc(44) + 0.4, gc(89) - 1.0, { y: 1.1 });
at('ladybug', gc(40) + 0.2, gc(86) + 0.1, { y: 0.62 }); at('anthill', gc(22) + 0.9, gc(86) - 0.9, { face: 30 }); at('ant', gc(22) + 0.4, gc(86) - 0.5, { face: 200 }); at('ant', gc(22) + 0.1, gc(86) - 0.2, { face: 210 });
/* the hut's yard: straw, hens, a pumpkin patch by the lean-to; the camp: a drum and a fiddle by the fire log, hay for the horse */
at('hw_straw', gc(22) - 0.2, gc(91) - 1.0, { face: 80 }); at('hw_straw_2', gc(21) + 0.9, gc(92) - 0.6, { face: 95 }); at('chicken', gc(23) + 0.3, gc(90) + 0.9, { face: 140 }); at('chicken', gc(24) - 0.5, gc(91) - 1.1, { face: 300 }); at('chicken', gc(22) + 1.0, gc(91) - 1.4, { face: 30 });
at('hw_pumpkin', gc(24) + 1.1, gc(90) + 1.2, { face: 10 }); at('hw_pumpkin_2', gc(25) - 0.4, gc(90) + 0.6, { face: 100 });
at('instrument_drum', gc(63) + 0.9, gc(90) - 1.2, { face: 20 }); at('instrument_violin_lying', gc(63) - 0.2, gc(90) + 1.25, { face: 110 }); at('wooden_bucket', gc(68) - 1.2, gc(91) + 0.9);
/* the stone ring: candles on the altar, a staff leant on a stone; a wolf at the forest's edge beyond it; crows on the stones */
at('hw_candles', gc(89) - 0.5, gc(90), { y: 0.95, floor: true }); at('hw_candle', gc(89) + 0.4, gc(90) + 0.1, { y: 0.95, floor: true }); at('item_wizard_staff', gc(88) + 0.7, gc(91) - 0.5, { face: 40, floor: true });
at('wolf', gc(91) + 0.2, gc(91) + 1.0, { face: 300 }); at('crow', gc(87), gc(89), { y: 2.62, floor: true, face: 100 }); at('crow', gc(89), gc(89), { y: 3.42, floor: true, face: 200 });
/* the road: a crow on the milestone, rabbits on the verge, a frog at each boat, hay and a sack at the rest by the stump */
at('crow', RE + 0.45, gx(84.5), { y: 1.0, face: 250 }); at('rabbit', gc(44) - 0.4, gc(95) - 0.8, { face: 310 }); at('rabbit', gc(41) + 0.3, gc(86) + 0.9, { face: 50 });
at('hw_straw_2', gc(41) - 0.3, gc(86) - 0.7, { face: 10 }); at('meshy_burlap_sack', gc(41) + 1.0, gc(86) - 0.2, { face: 120 });
for (const x of [30, 58]) at('meshy_frog', gc(x) - 1.9, gx(78) + 0.5, { face: x * 3 });
/* reeds (THE MODEL PASS: the wish-list `reeds` in place of the Ocean pack's weed): clumps standing in the moat's edge along the south bank, lifted
   off the bed so their feet are under the water and their heads over it */
for (let x = 14; x < 82; x += 3.6 + rnd() * 4.5) { if (Math.abs(x - 43) < 4) continue; const n = 1 + Math.floor(rnd() * 3); for (let i = 0; i < n; i++) at('reeds', gx(x) + i * 1.1 + rnd() * 0.4, gx(77.55) - rnd() * 0.4, { y: 0.9, h: 1.8 + rnd() * 0.6, face: Math.round(rnd() * 360) }); }
/* THE MODEL PASS, THE REST: what the district's NEEDS A MODEL list asked for, and what else on the wish list fits a storybook wood.
   Animals stand still and stand OFF every way (on tree squares or the water's edge). */
at('deer', RW - 3.0, gx(82.5), { face: 100 }); at('deer', gc(86) - 0.4, gc(90) + 0.4, { face: 80 }); at('fox', gc(62) + 0.9, gc(90) + 0.6, { face: 70 }); at('raven_perch', gx(9) + 0.7, gc(93), { face: 250 }); at('hedgehog', gc(41) - 1.2, gc(89) + 1.2, { face: 40 });
at('heron', gc(34), gx(78) - 0.25, { y: 0.9, face: 0 }); at('duck', gc(58) + 1.6, gx(78) + 0.45, { face: 20 }); at('duck', gc(58) + 2.2, gx(78) + 0.25, { face: 300 }); at('dragonfly', gc(31), gx(77.5), { y: 1.0 }); at('dragonfly', gc(55), gx(77.4), { y: 1.2 });
put('fishing_rod', 27, 78, { face: 0 }, 'p'); at('oars', gc(30) + 0.3, gx(78) + 2.1, { face: 80 }); put('drying_fish', 61, 78, { face: 0 }, 'p'); put('beehive', 22, 86, { face: 180 });
at('leafy_bush', RW - 1.6, gx(81.9), { face: 40 }); at('leafy_bush', RE + 1.7, gx(82.4), { face: 200 }); at('leafy_bush', gx(19) - 0.2, gx(87) - 1.4, { face: 90 }); at('leafy_bush', gx(70) + 1.0, gx(89) + 1.5, { face: 300 }); at('leafy_bush', gx(86) + 0.6, gx(89) + 1.3, { face: 10 });
at('cairn', gc(9), gc(89), { face: 0 }); at('cairn', gc(90), gc(86), { face: 120 }); at('willow_tree', gc(24), gc(80) + 0.9, { face: 30 }); at('willow_tree', gc(64), gc(80) + 0.9, { face: 200 });

/* ── PASS 4, THE ATMOSPHERE (2026-11-16): four more lantern posts where the forest track meets a way (so the track is found at night), a
   lantern under the hut's eave, smoke over the camp's fire. The air itself is the airZones export below. ── */
lantern(gx(9) + 0.45, gx(87) - 0.45, 's'); lantern(gx(88) - 0.45, gx(87) - 0.45, 's'); lantern(gx(23) + 0.5, gx(87) - 0.45, 's'); lantern(gx(65), gx(87) - 0.45, 's');
lantern(gx(42) - 0.5, gx(79) + 0.5, 1); lantern(gx(44) + 0.5, gx(79) + 0.5, -1);
at('chimney_smoke', gc(64), gc(90), { y: 1.0, rise: 4 });
/* PASS 5, POLISH: a lantern half way up each side path; a lit pane under every lantern; smaller stepping stones; a softer edge on the trodden earth */
lantern(gx(7) - 0.45, gx(83), 1); lantern(gx(90) + 0.45, gx(83), -1);

arch.push({ k: 'arch', id: 'cam:w:forest', x: 0, z: 0, rot: 0, y: 0, parts: P }); flushArch();
}
/* THE AIR (pass 4): pale gold motes through the whole forest; fireflies over the two glades, the bay and the moat's bank; cold blue motes
   in the stone ring; ash falling round the dead tree's hole. The kingdom's embers stay over the whole room (the tool's). */
const airZones = () => [
    { x0: 0, y0: 79, x1: 96, y1: 96, kind: 'motes', color: 0xfff0b0, n: 300 },
    { x0: 18, y0: 88, x1: 26, y1: 93, kind: 'fireflies', color: 0xffe890, n: 50 },
    { x0: 62, y0: 88, x1: 70, y1: 93, kind: 'fireflies', color: 0xffe890, n: 50 },
    { x0: 39, y0: 84, x1: 47, y1: 96, kind: 'fireflies', color: 0xd8ff90, n: 44 },
    { x0: 14, y0: 77, x1: 82, y1: 80, kind: 'fireflies', color: 0xd8ff90, n: 90 },
    { x0: 86, y0: 88, x1: 92, y1: 92, kind: 'motes', color: 0x9fd8ff, n: 60 },
    { x0: 4, y0: 87, x1: 12, y1: 96, kind: 'ash', n: 70 },
];
module.exports = { build, ground, groundAlso, airZones };
