/* THE WOODS · THE RITUAL GROUND (district G, plots x 3..5 · y 0..2, the north-east, levels 3 to 5; with the old Bohemian Grove) — this district's own content, split out of bake-woods.js on
   2026-11-16 (mondo: "every single zone needs to be like that. now. so we can work in parallel"). One thread = this one file.
   Repo tooling only: nothing here ships; the room is baked into data.js (site_prebuilt_fairy_forest_plots, WOODS36-BEGIN / END).

   THE LOOK: the fairy forest gone wrong, "the cult". Dark spruce with bare trees, glowing toadstools, giant caps, crystals, moths; violet motes.
   THE PLOTS AND WHAT STANDS THERE TODAY
     P03-00 The Mound (L5)             a grass hill (r 9, h 2.6) with a wooden cross, three crosses, an open coffin and its lid, a giant cap.
     P04-00 The Lake, west shore (L4)  two lanterns, two giant caps, frogs. The lake is the tool's water.
     P05-00 The Lake, east shore (L4)  a candle line, two giant caps, frogs. The lodge door (the Lodge's halls) is east.
     P03-01 The Tents (L4)             three tents, a chest, a radio, three masks, a crystal; native: fortune teller.
     P04-01 The Stage (L4)             a timber stage one level up (14 x 7 m) with steps, lectern, two speakers, six folding chairs with a mask on each, a crystal.
     P05-01 The Owl (L4)               LANDMARK: the owl statue (Meshy owl_statue) on its mound with steps, the stone altar, two braziers, an effigy on a bier, a candle line, a crystal.
     P03-02 The Fire (L3)              campfire, two folding chairs, torch, meat, a hand saw, a cauldron, a crystal; native: cult leader.
     P04-02 The Stones (L3)            the ritual circle, six menhirs, candle rings, a cauldron, skulls, a torch, the 14-cap fae ring 10.5 m out; native: goatman.
     P05-02 The Dead Tree (L3)         the dead snag, a stain, a cobweb, two dolls, a crystal. The lookingglass door (Camelot Kingdom's garden) is east.
   KNOWN MISSING / WAITING FOR MONDO
     - The life pass and the horror pass are live but wait for his look (the board).
     - NO WAY TO ROOM 333: the plan gives the Stones a hidden way to Room 333. The link woods_ritual still ends on the retired Ritual Ground
       room, so coming through it lands at the Woods' spawn. The same for the link deadtree_lookingglass. A door or a link end is the tool's.
     - No ceiling or wall pieces (no meat hooks: nothing to hang them from). Every new glow carries noLight (the room's real lights are spoken for).
     - The trees are closed ("Good, keep them"): do not change tree kinds unasked.

   THE HOOKS (bake-woods.js "THE DISTRICT FILES" calls them; each one is optional):
     tailor(ctx)                          before the levels are read: change this district's squares in ctx.cell[cy][cx]
                                          (t trees, g grass, p path, s snow, r rock, w water, b bridge)
     dress(ctx), horror(ctx), life(ctx)   the three passes as they were built, run in this order; each starts on its own recorded dice,
                                          so an edit here never moves another district's pieces
     build(ctx)                           after all three: NEW work goes here first (its own dice; nothing that stands is thrown again)
                                          (a sow's seed is the count of feature rows before it: a feature row added in an old pass
                                          re-throws every later scatter of the room, one added in build moves nothing)
     wood, treeZones(ctx), airZones(ctx)  this district's forest mass and its air
   ctx: put / dec / tree / native (plot id, ..., dx, dy) stand a thing on the free square nearest the plot's clearing middle + (dx, dy) and claim
   the square (put = a blocker on the square's middle, dec = a small thing off it); hput / hdec = the same, skipped when the plot is full;
   life / fly = a small thing on a random open square (claims none); sow = a scatter row over a disc; centre(plot id) = the clearing's middle
   square; freeSquares(plot id); features / props (push your own rows), doors (read only), taken, cell; gx / gc = a square's line / middle in
   metres; ground(x, z) = the height there; rnd; h0 (horror only: props.length before the pass). A helper given another district's plot throws.
   NOT YOURS: the terrain, the levels, the trails and paths, the creek and the pools, the doors and link ends, the sky, the tree kinds
   (the trees row on the board), the particle engine. Those are the tool's: a note on the board first (docs/notes/claims.md).
   Rules for district threads: docs/notes/areas-complexes.md "THE WOODS, THE DISTRICT FILES". Bake: node bake-woods.js (--dry-run = counts only). */
'use strict';
module.exports = {
    id: 'G', name: 'The Ritual Ground',
    /* the forest mass: the feature trees planted deep in this district's tree squares [kind, height m, chance a deep square] (plots of level 6 up get pines, the tool's rule) */
    wood: ['tree_2', 8, 0.03],
    /* THE TREE ZONES (terrain.gen.zones, the thicket by district) and THE AIR BY DISTRICT (shell.atmos.zones): boxes in plots, zoneOf(x0, y0, x1, y1) */
    treeZones: ctx => [Object.assign(ctx.zoneOf(3, 0, 6, 3), { kinds: ['tree_55', 'tree_55', 'tree_56', 'tree_6', 'tree_55'], treeH: [6.5, 9.5] })],           // dark spruce, a bare one among them
    airZones: ctx => [Object.assign(ctx.zoneOf(3, 0, 6, 3), { kind: 'motes', color: 0xc8a8ff, n: 320 })],
    /* THE DRESSING: the landmark, the set pieces and the natives (ported from the old rooms) */
    dress(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        { const q = centre('P04-02'), R = 2; put('P04-02', 'ritual_circle', 0, 0, { y: 0.01 });   // THE STONES: six round the circle
          [[-R, -1], [-R, 1], [R, -1], [R, 1], [0, -R], [0, R]].forEach(d => put('P04-02', 'menhir', d[0], d[1])); dec('P04-02', 'candle_ring', 1, 0); put('P04-02', 'cave_torch', -3, 3); }
        put('P03-02', 'campfire', 0, 0); dec('P03-02', 'folding_chair', 1, 1); dec('P03-02', 'folding_chair', -1, 1); put('P03-02', 'cave_torch', 2, -2);
        put('P05-02', 'dead_snag', 0, 0); dec('P05-02', 'floor_stain', 1, 0);                                                                               // THE DEAD TREE
        put('P03-01', 'camping_tent', 0, 0, { face: 180 }); put('P03-01', 'camping_tent', 2, 1, { face: 200 }); put('P03-01', 'camping_tent', -2, 1, { face: 160 }); dec('P03-01', 'sea_chest', 0, 2); dec('P03-01', 'retro_radio', 1, 2);
        { const q = centre('P04-01');   // THE STAGE: a low timber stage (one level up), steps at its south side
          features.push({ k: 'plateau', x: gx(q[0]), z: gx(q[1] - 1), w: 14, d: 7, h: 1.75, edge: 0.3 }, { k: 'ramp', x0: gx(q[0]), z0: gx(q[1] + 2), x1: gx(q[0]), z1: gx(q[1]), w: 3.5, h0: 0, h1: 1.75, stairs: true, model: 'wood', edge: 0.2 });
          for (let dy = -2; dy <= 1; dy++) for (let dx = -2; dx <= 1; dx++) taken.add((q[0] + dx) + ':' + (q[1] + dy));
          props.push({ key: 'lectern', x: gx(q[0]), z: gc(q[1] - 2), y: 1.75, face: 180 }, { key: 'retro_speakers', x: gc(q[0] - 2), z: gc(q[1] - 2), y: 1.75, face: 180 }, { key: 'retro_speakers', x: gc(q[0] + 1), z: gc(q[1] - 2), y: 1.75, face: 180 });
          [[-2, 3], [-1, 3], [0, 3], [1, 3], [-1, 4], [0, 4]].forEach(d => dec('P04-01', 'folding_chair', d[0], d[1], { face: 0 })); }
        { const q = centre('P05-01');   // THE OWL's mound and altar (the owl statue is a Meshy piece, 2026-11-15)
          features.push({ k: 'plateau', x: gx(q[0]), z: gx(q[1]), w: 7, d: 7, h: 1.75, edge: 0.4 }, { k: 'ramp', x0: gx(q[0]), z0: gx(q[1] + 3), x1: gx(q[0]), z1: gx(q[1] + 1), w: 3.5, h0: 0, h1: 1.75, stairs: true, model: 'forest', edge: 0.2 });
          for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 0; dx++) taken.add((q[0] + dx) + ':' + (q[1] + dy));
          props.push({ key: 'owl_statue', x: gx(q[0]), z: r2(gx(q[1]) - 1.0), y: 1.75, face: 180 }, { key: 'stone_altar', x: gx(q[0]), z: r2(gx(q[1]) + 2.6), y: 1.75, face: 180 },   // THE HORROR PASS: the owl itself (Meshy), the altar at its feet
              { key: 'brazier', x: r2(gx(q[0]) - 2.8), z: r2(gx(q[1]) + 2.6), y: 1.75 }, { key: 'brazier', x: r2(gx(q[0]) + 2.8), z: r2(gx(q[1]) + 2.6), y: 1.75 }); }
        { const q = centre('P03-00'); features.push({ k: 'hill', x: gc(q[0]), z: gc(q[1]), r: 9, h: 2.6 }); props.push({ key: 'wooden_cross', x: gc(q[0]), z: gc(q[1]) }); taken.add(q[0] + ':' + q[1]); }   // THE MOUND
        native('P03-02', 'cult leader', -1, -1, 90); native('P03-01', 'fortune teller', 1, -1, 180); native('P04-02', 'goatman', 3, -2, 240);
    },
    /* THE HORROR PASS (mondo 11-15): it gets worse the farther you walk from the Stair */
    horror(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        hdec('P03-02', 'psx_meat_1', 1, -1, { y: 0.02 }); hdec('P03-02', 'psx_meat_1', -2, 0, { y: 0.02 }); hdec('P03-02', 'psx_hand_saw_1', 2, 1, { y: 0.02 }); hput('P03-02', 'cauldron', -1, 2);
        hdec('P04-02', 'candleRing', -1, 0); hdec('P04-02', 'candleRing', 0, 1); hput('P04-02', 'cauldron', 0, -1); hdec('P04-02', 'skull', 1, 1); hdec('P04-02', 'skull', -1, -1);
        hdec('P05-02', 'psx_cobweb_2', 1, -1, { y: 1.2 }); hdec('P05-02', 'meshy_voodoo_doll', -1, 0); hdec('P05-02', 'meshy_voodoo_doll', 0, 1);
        hdec('P03-01', 'psx_incognito_mask_mp_1', 1, 1, { y: 0.02 }); hdec('P03-01', 'psx_incognito_mask_mp_1', -1, 2, { y: 0.02 }); hdec('P03-01', 'psx_incognito_mask_mp_1', 3, 2, { y: 0.02 });
        { const pl = plot['P04-01'], x0 = gx(pl.x * N), z0 = gx(pl.y * N);   // a mask on every seat facing the stage
          props.slice(0, h0).filter(q => q.key === 'folding_chair' && q.x >= x0 && q.x < x0 + PL && q.z >= z0 && q.z < z0 + PL).forEach(q => props.push({ key: 'psx_incognito_mask_mp_1', x: q.x, z: q.z, y: 0.46, face: q.face || 0 })); }
        { const q = hdec('P05-01', 'decor_effigy_bier', -3, 3, { face: 0 }); if (q) { const b = props[props.length - 1]; props.push({ key: 'decor_effigy_figure', x: b.x, z: b.z, y: 0.55, face: 0 }); } hdec('P05-01', 'candleLine', 2, 3); }
        [[2, 2], [-2, 2], [3, -1]].forEach(d => hdec('P03-00', 'cross', d[0], d[1], { face: 180 })); hput('P03-00', 'trap_coffin_open', -3, -1, { face: 20 }); hdec('P03-00', 'trap_coffin_lid', -2, -2);
        hdec('P04-00', 'railway_lantern', 0, 0); hdec('P04-00', 'railway_lantern', 1, 2); hdec('P05-00', 'candleLine', 0, 0);
    },
    /* THE LIFE PASS (mondo 11-15): this district's own wood, its plants and its small animals */
    life(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        { const q = centre('P04-02'), cx0 = gc(q[0]), cz0 = gc(q[1]);   // THE FAE RING round the Stones (the Fae Ring spell's ring, the Camelot fairy forest's toadstools): violet caps, 10.5 m out, none on a path
          for (let i = 0; i < 14; i++) { const a = i / 14 * 6.2832, x = cx0 + Math.cos(a) * 10.5, z = cz0 + Math.sin(a) * 10.5; if (softAt(Math.floor((x + HALF) / C), Math.floor((z + HALF) / C))) props.push({ key: 'fae_toadstool', x: r2(x), z: r2(z), face: Math.round(90 - a * 57.3), noLight: true }); } }
        [['P04-00', -3, 3], ['P04-00', 2, 4], ['P05-00', -2, 3], ['P05-00', 3, 2], ['P03-00', 3, 3]].forEach(d => hput(d[0], 'fae_mushroom', d[1], d[2], { noLight: true, face: Math.round(rnd() * 360) }));   // the giant caps on the lake shore
        [['P03-01', 3, -2], ['P04-01', 4, 3], ['P05-02', 2, 2], ['P05-01', 3, 3], ['P03-02', -3, -2]].forEach(d => hput(d[0], 'crystal_cluster', d[1], d[2], { noLight: true }));
        DIST('G').forEach((id, i) => { life(id, 'woods_glowcap'); life(id, 'woods_glowcap', { h: 0.5 }); life(id, 'woods_glowcap', { h: 0.9 }); fly(id, i % 2 ? 'luna_moth' : 'hawk_moth', 1.4); });
        ['P04-00', 'P04-00', 'P05-00', 'P05-00', 'P05-00', 'P04-00'].forEach(id => life(id, 'meshy_frog'));
        sow('mushroom2', 14, [54, 18], 58, { h: 0.4, r0: 0.25 }); sow('fern', 20, [54, 18], 58);
    },
};
