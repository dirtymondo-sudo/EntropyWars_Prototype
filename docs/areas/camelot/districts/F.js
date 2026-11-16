/* CAMELOT KINGDOM · THE FAIRY FOREST (district F, 6 plots) — the east woods: the forest that glows.
   Repo tooling only: bake-camelot.js calls `build(ctx)` after the shared pieces stand.

   THE PLOTS: P07-01 The Knoll, north · P07-02 The Pond · P07-03 The Fairy Ring · P07-04 The Woods Trail · P07-05 The Spring ·
   P07-06 The Knoll, south (squares x 84..96, y 12..84; the forest's zone runs from the moat's east bank, x 82..96).

   WHAT STANDS HERE TODAY (pass 1, the landmarks, 2026-11-16; each drawn row is `cam:f:<name>`):
   THE POND: the pool and its deck (a jetty from the west bank); a mossy islet off the jetty's end with one giant glowing mushroom on it;
   lily pads (drawn discs, three in flower); mossy stones on the banks; four butterflies.
   THE RING: twelve toadstools, a harp, a fairy; purple grass inside the ring, a pale moonstone at its heart, a small glowing cap between
   every two toadstools.
   THE SPRING: the pool lies against a rock outcrop (three crags, the tallest 4.4 m, on squares 93:61-62, a ghost wall), ringed with stones;
   crystal spikes growing out of the rock, heal flowers (the Rejuvenation plant), ferns, a frog.
   THE KNOLL, NORTH: a higher knoll with one great oak on its crown, stones and glowing caps at its roots, the stump.
   THE KNOLL, SOUTH: the crystal knoll: three rock teeth on the crown with glowing crystal spikes growing out of them,
   the fallen log, the rabbit.
   THE WOODS TRAIL plot: a row of fae mushrooms, toadstools, a luna moth; two signposts.
   The trees are the tool's (the plan's solid squares, grown as fae caps and trees by `gen.zones`).

   NOT HERE (the tool's, shared): the trail east to The Woods (link `woods_camelot`, on the east wall at square 48, plot P07-04) and
   the east bridge. Dress round them, do not move them.

   PASS 3, THE DRESSING (2026-11-16): the forest floor (`ground`, the dark grass), stepping stones into the ring, the mushroom glade and the
   spring, six painted birches, seven drawn boulders, Meshy crystal shards, glowing caps down the path's east side, ferns, a log, a stump, an
   anthill, ladybugs, grasshoppers, caterpillars, a chrysalis, bees, moths, butterflies, two more rabbits, a frog.
   PASS 4, THE ATMOSPHERE (2026-11-16): `airZones` (violet motes through the forest; fireflies over the north knoll, the pond and the ring;
   spores in the mushroom glade; blue motes at the spring and the crystal knoll); the ring's purple ground now runs under the toadstools,
   with a lit disc under each (the light it throws), one under the islet's mushroom; seen by day and at night (`hqClockSet(23)`).
   PASS 5, POLISH (2026-11-16): a walk of twelve views by day and night; two standing stones (`menhir`) flank the Woods trail east of the
   crossing. FIVE PRs ARE IN (four district passes + the tool's hooks): THIS THREAD HAS STOPPED and waits mondo's look.
   MISSING / WAITING: WAITS MONDO: who lives here (the kingdom's AREA UNITS table has no fairy, unicorn, gnome or mushroom girl; a person off
   the table stands as a random race on it, so the ring's own "fairy" is not a fairy on screen either). STILL TO DO (passes 4, 5): its own
   light, air and particles, the night look, polish. No walk-in here: none is named.
   NEEDS A MODEL (nothing on R2; not in the game as stand-ins): reeds / cattails (the ocean pack's weed draws black here), a willow, a
   dragonfly, a firefly (particles may do), a swan or duck, a small waterside flower, bushes, natural small rocks (the graveyard pack's are
   cut blocks). The lily pads are drawn in code.
   NEW ROWS: keep new pieces out of `dec()` (it draws from the kingdom's one stream of dice and moves N's and W's scatter): use `at()`.

   THE HOOKS (bake-camelot.js "THE DISTRICT FILES" lists the whole ctx): squares are the kingdom's (kx, ky), 0..96, a plot = 12 x 12 of them,
   plot Pxx-yy = squares xx*12.. , yy*12.. . gx(k) = a square's west / north edge in metres, gc(k) = its middle. feat(row) writes a terrain row,
   note(text) a heading. put(key, x, y, o, on) stands a catalogue prop on a square's middle; dec(...) the same, scattered and turned by the
   dice; tree(kind, h, x, y, r); native(race, x, y, face, say). They take FREE ground only (grass, snow, marble; `on` names another plan
   letter) and never one square twice: the tool stops and names the square. sheet() = a parts list (box, cyl, roof, shell, crown, tower, banner);
   building(id, [x0, y0, x1, y1], side, h, o, parts) = a texbuilding + its drawn look, returns its frame; inside(B, key, lx, lz, o) = furniture
   in that frame; flushArch() writes the looks made so far.
   A pool or a ring that covers squares the plan leaves open must take them by hand (taken.add('x:y'), as below), or the dressing of a
   later pass may stand in it.
   RULES (docs/notes/areas-complexes.md "CAMELOT, THE DISTRICT FILES"): one thread = this one file. Not yours: bake-camelot.js, layout.json,
   the other district files, the hill, the town wall, the moat, the roads, the doors out of the zone, the room's sky and shell (a note on
   the board first: docs/notes/claims.md). After any edit: `node bake-camelot.js`, `node --check data.js`, commit the file AND data.js. */
'use strict';
function build(ctx) {
const { r2, gx, gc, feat, note, props, npc, taken, put, dec, many, tree, arch, flushArch } = ctx;
/* THE DRAWN PIECES (pass 1): rock is the cliff sheet under a pale tint, moss the dark grass; every row is written at the room's level 0
   (`y: 0`), its parts in metres from the row's own middle. Few looks on purpose: every sheet + tint + glow is one mesh a row. */
const ROCK = 'rocks_5', STONE = 0xffffff, RG = 1.7, MOSS = 'grass_dark_fantasy', MOSSC = 0xc8e8a0, CRYSTAL = 0x5fd8ff;
const row = (id, x, z) => { const P = []; arch.push({ k: 'arch', id: 'cam:f:' + id, x: r2(x), z: r2(z), rot: 0, y: 0, parts: P });
    return { P,
        /* a boulder: a low faceted dome, a moss cap through its top */
        rock(x, y, z, r, h, ry, moss) { P.push({ s: 'dome', p: [r2(x), r2(y), r2(z)], r, h, rz: r2(r * 0.78), seg: 7, rings: 3, ry: ry || 0, key: ROCK, tint: STONE, gain: RG });
            if (moss !== false) P.push({ s: 'dome', p: [r2(x), r2(y), r2(z)], r: r2(r * 0.7), h: r2(h * 1.06), rz: r2(r * 0.55), seg: 7, rings: 3, ry: ry || 0, key: MOSS, tint: MOSSC }); },
        /* a crag: a tapered five- or six-sided shaft */
        /* a crag: three tapered shafts stacked, each turned and stepped a little off the one under it, so no side is one flat face */
        crag(x, y, z, r, rTop, h, seg, ry) { const a = (ry || 0) * Math.PI / 180, ox = Math.cos(a) * r * 0.14, oz = Math.sin(a) * r * 0.14, h1 = r2(h * 0.46), h2 = r2(h * 0.32), h3 = r2(h - h1 - h2);
            const part = (px, py, pz, ra, rb, hh, sg, t) => P.push({ s: 'cyl', p: [r2(px), r2(py), r2(pz)], r: r2(ra), r2: r2(rb), h: hh, seg: sg, ry: t, key: ROCK, tint: STONE, gain: RG });
            part(x, y, z, r, r * 0.78, h1, seg || 6, ry || 0); part(x + ox, y + h1 - 0.05, z + oz, r * 0.84, r * 0.56, h2 + 0.05, 5, (ry || 0) + 31); part(x + ox * 2.2, y + h1 + h2 - 0.05, z + oz * 2.2, r * 0.6, rTop, h3 + 0.05, 5, (ry || 0) + 67); },
        /* a crystal spike: the ice sheet, lit */
        spike(x, y, z, r, h, ry) { P.push({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, r2: 0, h, seg: 5, ry: ry || 0, key: 'ice', tint: CRYSTAL, glow: 0.75 }); },
        flat(x, y, z, r, h, key, tint, o) { P.push(Object.assign({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h, seg: 20, key, tint }, o || {})); } }; };
const at = (key, x, z, o) => props.push(Object.assign({ key, x: r2(x), z: r2(z) }, o || {}));   // a piece by metres, no dice
const hillY = (h, r, dx, dz) => { const t = Math.max(0, 1 - Math.hypot(dx, dz) / r); return h * t * t * (3 - 2 * t); };

note('THE FAIRY FOREST: the pond, the ring, the spring, the knolls');
/* ── THE POND (P07-02): the jetty looks at an islet with one giant glowing mushroom; lily pads; stones on the banks ── */
const PX = gx(92), PZ = gx(30.5);
feat({ k: 'pool', x: PX, z: PZ, r: 5.6, rz: 6.4, y: -0.3, depth: 0.9, key: 'water', bank: 1.2 });
feat({ k: 'deck', x0: gx(90), z0: PZ, x1: gx(92), z1: PZ, w: 7, y: 0.3 });
for (let y = 28; y < 33; y++) for (let x = 90; x < 94; x++) taken.add(x + ':' + y);
dec('butterfly', 87, 27, { floor: true, y: 1.2 }); dec('blue_morpho', 93, 26, { floor: true, y: 1.5 }); dec('swallowtail', 87, 34, { floor: true, y: 1.1 }); dec('monarch', 93, 34, { floor: true, y: 1.4 });
{ const S = row('pond', PX, PZ);
  S.rock(3.2, -1.2, 0, 2.1, 1.75, 20); S.rock(4.5, -1.2, 1.3, 1.1, 1.45, 70, false); S.rock(2.2, -1.2, -1.5, 0.9, 1.3, 130, false);   // the islet: its top stands 0.55 m over the ground, 0.85 over the water
  at('fae_mushroom', PX + 3.2, PZ, { y: 0.45, face: 40, noLight: true });
  S.P.push({ s: 'cyl', p: [3.2, 0.52, 0], r: 1.5, h: 0.012, seg: 10, key: MOSS, tint: 0xc8ffd8, glow: 0.55 });   // PASS 4: its light on the islet's moss
  [[-2.0, -4.8, 0.5, 1], [-0.4, -5.2, 0.42, 0], [1.6, -4.4, 0.55, 0], [-2.8, -4.0, 0.36, 0], [-1.6, 4.6, 0.52, 0], [0.4, 5.2, 0.4, 1], [2.0, 4.0, 0.46, 0], [3.6, -3.0, 0.4, 0], [3.9, 2.9, 0.5, 1], [0.9, -3.9, 0.3, 0], [0.2, 4.0, 0.3, 0]].forEach((q, i) => {
      S.P.push({ s: 'cyl', p: [q[0], -0.29, q[1]], r: q[2], h: 0.02, seg: 9, arc: 320, a0: i * 67, key: 'leaves_3', tint: 0xc8f090, gain: 1.6, glow: 0.2 });   // a lily pad: a notched disc on the water
      if (q[3]) S.P.push({ s: 'dome', p: [r2(q[0] + 0.1), -0.27, r2(q[1] - 0.06)], r: 0.13, h: 0.14, seg: 6, rings: 2, key: 'marble', tint: 0xffb8e0, glow: 0.55 }); });
  [[-150, 0.7, 0.5], [-115, 0.95, 0.7], [-72, 0.6, 0.45], [-40, 0.8, 0.6], [38, 0.9, 0.65], [75, 0.6, 0.4], [112, 1.0, 0.7], [148, 0.7, 0.5]].forEach((q, i) => { const a = q[0] * Math.PI / 180;
      S.rock(Math.cos(a) * 6.1, -0.15, Math.sin(a) * 6.9, q[1], q[2] + 0.15, i * 50, i % 2 === 0); });
  at('meshy_frog', PX - 2.0, PZ - 4.8, { y: -0.27, face: 120 }); }
/* ── THE RING (P07-03): purple grass inside the toadstools, a moonstone at the heart, a small glowing cap between every two toadstools ── */
{ const x = gx(92), z = gx(43); many(12, i => { const q = i * Math.PI / 6; props.push({ key: 'fae_toadstool', x: r2(x + Math.cos(q) * 5.6), z: r2(z + Math.sin(q) * 5.6), face: i * 30 }); });   // THE RING
  for (let y = 40; y < 46; y++) for (let x2 = 89; x2 < 95; x2++) taken.add(x2 + ':' + y); props.push({ key: 'instrument_harp', x: r2(x + 0.6), z: r2(z - 0.5), face: 200 }); npc.push({ x: r2(x + 1.75), z: r2(z + 1.75), face: 220, race: 'fairy' });
  const S = row('ring', x, z);
  S.flat(0, 0, 0, 6.7, 0.03, 'purple_grass', 0xffffff, { gain: 1.2, glow: 0.12 });
  many(12, i => { const q = i * Math.PI / 6; S.flat(Math.cos(q) * 5.6, 0.035, Math.sin(q) * 5.6, 0.95, 0.012, 'purple_grass', 0xf0c8ff, { glow: 0.42, seg: 12 }); });   // PASS 4: the light each toadstool throws on the ground (a lit disc: the room has no real light to spare)
  S.flat(0, 0.03, 0, 1.7, 0.06, 'ice', 0xd8e8ff, { glow: 0.5, seg: 12 });   // the moonstone: the ice sheet, lit
  S.P.push({ s: 'cyl', p: [0, 0.03, 0], r: 1.95, ri: 1.7, h: 0.1, seg: 12, key: ROCK, tint: STONE, gain: RG });   // its kerb
  many(12, i => { const q = (i + 0.5) * Math.PI / 6; at('woods_glowcap', x + Math.cos(q) * 5.5, z + Math.sin(q) * 5.5, { face: i * 47, noLight: true }); }); }
/* ── THE SPRING (P07-05): the pool lies against a rock outcrop, ringed with stones; crystals at the rock's foot, heal flowers on the bank ── */
{ const x = gx(92), z = gx(62), RX = gc(93), RZ = gx(62);
  feat({ k: 'pool', x, z, r: 4.2, rz: 3.5, y: -0.25, depth: 0.7, key: 'water', bank: 0.5 });
  for (let y = 61; y < 63; y++) for (let x2 = 90; x2 < 94; x2++) taken.add(x2 + ':' + y);
  feat({ k: 'wall', x0: RX, z0: gx(61), x1: RX, z1: gx(63), t: 3.5, h: 2, ghost: true, rail: false });   // the outcrop's weight: its two whole squares
  const S = row('spring', x, z), ox = RX - x, oz = RZ - z;
  S.crag(ox, -0.9, oz + 0.2, 1.95, 0.8, 5.3, 6, 12); S.crag(ox + 0.3, -0.9, oz + 2.3, 1.5, 0.6, 3.9, 5, 40); S.crag(ox + 0.2, -0.9, oz - 2.1, 1.35, 0.55, 3.3, 5, 75);
  S.rock(ox - 1.2, -0.7, oz + 1.4, 1.2, 1.5, 30); S.rock(ox - 1.0, -0.7, oz - 1.5, 1.0, 1.3, 100); S.rock(ox + 0.2, 4.2, oz + 0.2, 0.75, 0.3, 0);
  [[95, 0.55], [128, 0.75], [160, 0.5], [196, 0.6], [228, 0.8], [262, 0.5], [-52, 0.6]].forEach((q, i) => { const a = q[0] * Math.PI / 180;
      S.rock(Math.cos(a) * 4.4, -0.15, Math.sin(a) * 3.7, q[1], q[1] * 0.75 + 0.15, i * 40, i % 2 === 1); });   // the ring of stones: open to the west, where you come from
  [[-1.7, 0.1, 2.6, 0.2, 1.0], [-1.9, 0.0, -2.5, 0.17, 0.85], [-1.5, 1.2, 0.9, 0.15, 0.7], [0.9, 3.3, 1.9, 0.14, 0.7], [-0.6, 2.6, -1.9, 0.14, 0.65], [-2.2, -0.1, 0.3, 0.13, 0.55]].forEach((q, i) => S.spike(ox + q[0], q[1], oz + q[2], q[3], q[4], i * 41));   // crystals out of the rock
  [[-5.2, -2.8], [-3.2, -4.6], [-0.6, -4.9], [-5.0, 3.0], [-2.4, 4.8], [0.6, 5.0]].forEach((q, i) => at('woods_healflower', x + q[0], z + q[1], { face: i * 61 }));
  at('meshy_frog', x - 4.6, z + 1.2, { face: 70 });
  dec('fern', 92, 60); dec('fern', 90, 64); dec('fern', 92, 64); }
many(3, i => put('fae_mushroom', 91 + (i % 2), 54 + i)); dec('fae_toadstool', 90, 54); dec('fae_toadstool', 90, 56); dec('luna_moth', 93, 55, { floor: true, y: 1.3 });
/* ── THE KNOLL, NORTH (P07-01): one great oak on the crown, stones and glowing caps at its roots ── */
{ const x = gc(91), z = gc(22), H = 2.1, R = 5.4;
  feat({ k: 'hill', x, z, r: R, h: H }); dec('stump', 90, 21);
  tree('tree_52', 12, 91, 22, 1.1);
  const S = row('knolln', x, z);
  [[20, 1.9, 0.7], [95, 2.3, 0.55], [160, 1.8, 0.8], [230, 2.2, 0.6], [300, 2.0, 0.7]].forEach((q, i) => { const a = q[0] * Math.PI / 180, dx = Math.cos(a) * q[1], dz = Math.sin(a) * q[1];
      S.rock(dx, hillY(H, R, dx, dz) - 0.25, dz, q[2], q[2] * 0.8 + 0.25, i * 55); });
  [[55, 1.5], [128, 1.7], [196, 1.4], [265, 1.6], [338, 1.5]].forEach((q, i) => { const a = q[0] * Math.PI / 180; at('woods_glowcap', x + Math.cos(a) * q[1], z + Math.sin(a) * q[1], { face: i * 70, noLight: true }); }); }
/* ── THE KNOLL, SOUTH (P07-06): the crystal knoll: three rock teeth on the crown, crystal spikes growing out of them ── */
{ const x = gc(91), z = gc(72), H = 1.7, R = 4.8;
  feat({ k: 'hill', x, z, r: R, h: H }); dec('fallen_log', 90, 73); dec('rabbit', 91, 71);
  taken.add('91:72'); feat({ k: 'wall', x0: r2(x - 1.2), z0: z, x1: r2(x + 1.2), z1: z, t: 2.4, h: 2, ghost: true, rail: false });
  const S = row('knolls', x, z), y0 = H - 0.6;
  S.crag(0.1, y0, 0, 0.95, 0.3, 3.5, 5, 10); S.crag(-0.9, y0, 0.7, 0.7, 0.22, 2.5, 5, 50); S.crag(0.8, y0, -0.8, 0.6, 0.2, 2.0, 5, 80);
  S.rock(-0.3, y0 + 0.1, -1.0, 0.8, 0.9, 30); S.rock(0.9, y0 + 0.1, 0.9, 0.7, 0.8, 110);
  [[0.75, 1.5, 0.5, 0.2, 1.0], [-0.55, 2.0, -0.45, 0.16, 0.8], [-1.35, 1.0, 1.1, 0.18, 0.9], [1.25, 0.9, -1.25, 0.15, 0.75], [0.2, 3.0, 0.2, 0.14, 0.7], [-1.3, 0.7, -0.5, 0.13, 0.6], [1.5, 0.6, 0.5, 0.14, 0.65]].forEach((q, i) => S.spike(q[0], y0 + q[1], q[2], q[3], q[4], i * 37));
 }
put('signpost', 87, 46); put('signpost', 91, 50);

/* ── PASS 3, THE DRESSING (2026-11-16; the model list first: every piece below is a pack or model file already on R2) ──
   Blockers (birches, pack rocks) stand on whole squares through tree() / put(); everything else is decor by metres through at(). */
note('THE FAIRY FOREST, the dressing: stepping stones, pack rocks, birches, crystals, small life');
const E = gx(90);   // the glades' west edge: the path's east side
/* stepping stones (the graveyard pack's two) from the path into each glade */
const steps = (pts) => pts.forEach((q, i) => at('psxg_stepping_stone_' + (1 + i % 2), q[0], q[1], { face: (i * 73) % 360 }));
steps([[E + 0.5, gx(43) + 0.2], [E + 1.5, gx(43) - 0.25]]);                                                                               // into the ring
steps([[E + 0.6, 25.9], [E + 1.8, 26.2], [E + 3.0, 26.5], [E + 4.2, 27.0], [E + 5.4, 27.6], [E + 6.6, 28.2], [E + 7.8, 28.6], [E + 9.0, 28.8], [E + 10.2, 28.6]]);   // through the mushroom glade
steps([[E + 0.6, gx(62) + 0.2], [E + 1.6, gx(62) - 0.2], [E + 2.5, gx(62) + 0.15]]);                                                      // to the spring
/* painted birches at the glades' far sides. NOT the packs' stones: `hw_stone*` are gravestones (a headstone, a Celtic cross) and `psxg_rock_*` are cut blocks */
[[93, 27, 6.2], [93, 33, 5.6], [94, 39, 6.4], [93, 56, 5.8], [92, 63, 6.0], [92, 71, 5.4]].forEach(q => tree('tree_53', q[2], q[0], q[1], 0.5));
{ const S = row('stones', E, 0);   // mossy boulders at the glades' corners, off the squares' middles (drawn: they weigh nothing)
  [[5.9, gx(26) + 0.7, 0.8, 0.6], [9.6, gx(35) - 0.9, 0.95, 0.7], [12.4, gx(40) - 0.7, 0.75, 0.55], [5.8, gx(58) - 0.8, 0.9, 0.65], [6.2, gx(66) - 1.1, 0.8, 0.6], [1.3, gx(50) + 1.2, 0.6, 0.45], [12.7, gx(57) - 0.9, 0.7, 0.5]]
      .forEach((q, i) => S.rock(q[0], -0.12, q[1], q[2], q[3], i * 47, i % 3 !== 1)); }
/* crystals (mondo's Meshy shards) at the rocks' feet. NOT the ocean pack's weed as water plants: it draws black in this room. */
at('meshy_crystal_shards', gc(93) - 2.3, gx(62) + 3.1, { face: 20 }); at('meshy_crystal_shard', gc(93) - 2.5, gx(62) - 3.0, { face: 140 });
at('meshy_crystal_shards', gc(91) + 2.4, gc(72) + 1.6, { face: 200 }); at('meshy_crystal_shard', gc(91) - 2.2, gc(72) - 1.5, { face: 300 }); at('meshy_crystal_shard', gc(91) + 1.2, gc(72) + 2.6, { face: 80 });
/* glowing caps down the path's east side (every 7 m, in twos and threes): the way through the forest at night */
for (let z = gx(19), i = 0; z < gx(76); z += 7, i++) { if (Math.abs(z) < 5) continue;   // not on the trail's crossing
    at('woods_glowcap', E + 0.35 + (i % 3) * 0.12, z + 0.4, { face: i * 97, noLight: true }); at('woods_glowcap', E + 0.75, z + 1.0 + (i % 2) * 0.3, { face: i * 31, noLight: true });
    if (i % 2) at('woods_glowcap', E + 0.3, z + 1.5, { face: i * 59, noLight: true }); }
/* ferns in the corners, a second log, small life (the insects pack, the rabbit) */
[[E + 12.6, gx(27) - 0.4], [E + 13.0, gx(34) + 1.2], [E + 15.8, gx(40) + 0.8], [E + 15.6, gx(45) + 1.0], [E + 5.6, gx(50) + 1.0], [E + 12.8, gx(55) - 0.5], [E + 5.4, gx(60) + 0.8], [E + 9.4, gx(65) - 0.4], [E + 8.8, gx(71) + 0.6], [E + 5.8, gx(74) + 1.6], [E + 8.6, gx(21) + 1.0], [E + 1.0, gx(49) + 0.9]]
    .forEach((q, i) => at('fern', q[0], q[1], { face: i * 67 }));
at('fallen_log', E + 4.4, gx(51) - 0.6, { face: 25, noBlock: true }); at('stump', E + 9.2, gx(64) + 1.2, { face: 10, noBlock: true });
at('anthill', E + 1.4, gx(24) + 0.6, { face: 0 }); at('ant', E + 1.9, gx(24) + 0.9, { face: 40 }); at('ant_leaf', E + 2.2, gx(24) + 0.4, { face: 300 });
[['ladybug', 3.1, gx(26) + 1.2], ['ladybug', 6.6, gx(60) + 1.0], ['ladybug', 2.2, gx(71) + 0.4], ['grasshopper', 4.0, gx(34) - 0.6], ['grasshopper_brown', 3.3, gx(57) + 1.1], ['grasshopper', 6.2, gx(74) + 0.6], ['caterpillar_bug', 5.3, gx(55) + 0.7], ['caterpillar_bug', 2.4, gx(40) + 0.4], ['chrysalis', 12.9, gx(54) + 0.5]]
    .forEach((q, i) => at(q[0], E + q[1], q[2], { face: i * 71 }));
[['bumblebee', 2.0, gx(62) - 4.4, 0.5], ['bumblebee', 4.6, gx(62) + 4.9, 0.6], ['bee', 1.6, gx(62) + 3.3, 0.7], ['bee', 7.4, gx(62) - 4.8, 0.5], ['hawk_moth', 4.2, gx(43) - 3.0, 1.2], ['hawk_moth', 9.6, gx(43) + 3.4, 1.4], ['luna_moth', 5.2, gc(22) + 2.0, 1.6], ['blue_morpho', 7.8, gx(55) + 0.2, 1.3], ['monarch', 5.0, gc(72) - 2.6, 1.2], ['swallowtail', 10.6, gx(30.5) + 4.6, 0.9]]
    .forEach((q, i) => at(q[0], E + q[1], q[2], { floor: true, y: q[3], face: i * 43 }));
at('rabbit', E + 8.9, gx(23) + 0.8, { face: 200 }); at('rabbit', E + 3.8, gx(53) + 0.8, { face: 60 }); at('meshy_frog', PX + 4.9, PZ + 5.6, { face: 250 });
/* PASS 5: two standing stones (mondo's Meshy menhir) flank the Woods trail east of the crossing, glowing caps at their feet */
put('menhir', 90, 46, { face: 20 }); put('menhir', 90, 49, { face: 200 });
[[0.9, gx(46) + 0.5], [2.7, gx(46) + 2.9], [0.8, gx(50) - 0.3], [2.8, gx(49) + 0.5]].forEach((q, i) => at('woods_glowcap', E + q[0], q[1], { face: i * 77, noLight: true }));
/* NO NEW RESIDENTS: the kingdom's AREA UNITS table (mondo's, data.js HQ_AREA_ENCOUNTERS) has no fairy, unicorn, gnome or mushroom girl, and a
   placed person off that table stands as a random race ON it (a unicorn here came up as an Undead). Who lives in this forest is his to say. */
flushArch();
}
/* PASS 4, THE AIR (2026-11-16; the Woods' way, per glade): violet motes through the whole forest, and each glade its own: fireflies over the
   north knoll, the pond (sea green) and the ring (gold), pale spores in the mushroom glade, blue motes at the spring and on the crystal knoll.
   Squares x0, y0, x1, y1. The first zone listed is drawn first; counts are small (a weak PC halves them). */
const airZones = () => [
    { x0: 84, y0: 17, x1: 96, y1: 79, kind: 'motes', color: 0xd8b4ff, n: 320 },
    { x0: 89, y0: 19, x1: 94, y1: 25, kind: 'fireflies', n: 36 },
    { x0: 89, y0: 26, x1: 95, y1: 35, kind: 'fireflies', color: 0x9fffd8, n: 60 },
    { x0: 89, y0: 39, x1: 95, y1: 46, kind: 'fireflies', color: 0xffe890, n: 70 },
    { x0: 89, y0: 49, x1: 95, y1: 58, kind: 'spores', color: 0xe8ffc8, n: 70 },
    { x0: 89, y0: 59, x1: 95, y1: 66, kind: 'motes', color: 0x8fe8ff, n: 60 },
    { x0: 89, y0: 69, x1: 94, y1: 75, kind: 'motes', color: 0x8fe8ff, n: 44 },
];
/* the forest floor (mondo's rule: `grass_dark_fantasy` / `dirt_2`) under this district's grass and trees, in place of the kingdom's lawn */
module.exports = { build, ground: 'grass_dark_fantasy', airZones };
