/* THE MOUNTAINS · MOUNT OLYMPUS (district O, 12 plots of room `site_prebuilt_shasta_mountains`)
   One of the six district files of bake-mountains.js (THE DISTRICT FILES there; rules: docs/notes/areas-complexes.md "THE MOUNTAINS, THE DISTRICT FILES").
   One thread = this one file. Never edit bake-mountains.js, layout.json or another district's file without a note on the board (docs/notes/claims.md).
   After an edit: `node bake-mountains.js` (writes data.js between MOUNTAINS-BEGIN / END; `--dry-run` prints the counts only), then RULE #1.

   THE PLOTS (id, name, level; a level is 1.75 m; the plan's squares are layout.json, the tool's file):
     P10-00 The Twelve Thrones (24)          P11-00 The Temple (24)                  P12-00 The Grand Stair (24)
     P10-01 The Stadium (20)                 P11-01 The Colonnade (20)               P12-01 The Cloud Line (21)
     P10-02 The Sacred Way (15)              P11-02 The Amphitheatre (16)            P12-02 The Terraces (16)
     P10-03 The Olive Grove (11)             P11-03 The Pilgrim Stair (10)           P12-03 The Goat Track (11)

   WHAT STANDS HERE TODAY
   - THE TEMPLE (P11-00, walked into): marble, six columns, a pediment; altar, braziers, statues; a seraphim at its door. A painting spot on the back wall is the link `lodge_olympus` (ctx.anchor('painting'))
   - THE TWELVE THRONES (P10-00): eight in a ring and four on the north row, a brazier
   - THE STADIUM (P10-01): four turning posts, lane lines (ctx.marks), a cyclops and a minotaur. THE COLONNADE (P11-01): two rows of columns, a fountain
   - The Sacred Way's angel, the Amphitheatre (lectern, harp, drum, a chosen one; DOOR HQ's Diplomatic bay door stands here: ctx.anchor('bayOlympus')), the Terraces' fountain, five olive trees, two lions at the Pilgrim Stair

   KNOWN MISSING OR WRONG
   - NEVER SEEN ON SCREEN: the first delivery was compiled headless only (no NaN, every door resolves); mondo has not looked at it. Your first job is a probe run and pictures (RULE #1c)
   - The Amphitheatre has no seats, the Stadium no stands, the Terraces no terraces: they are names on flat marble
   - The cloud is the deep-drift swell wearing another sheet. No encounter table
   - The Vatican (below the Pilgrim Stair) is not built: its stair's link stands, the far room is the old one

   THE TOOL'S, NOT YOURS (shared pieces that stand in this district)
   - THE GRAND STAIR up to Heaven (P12-00, north wall; link `heaven_olympus`) and THE PILGRIM STAIR down to the Vatican (P11-03, south wall; link `vatican_olympus`)
   - The Cloud Line's cut stair and the Colonnade's walk through the cloud (makeRoom `carves`), the Goat Track's join east to Bunny Flat (`extraPorts`)
   - The heights, the marble / cloud paint, the sky, the edges

   THE HOOKS (export any of them; ctx is described in bake-mountains.js "THE DISTRICT FILES")
   - tailor(t)   before the trails are cut: t.set(plotId, lx, ly, ch) / t.get(plotId, lx, ly) change a square of YOUR plots (the letters: layout.json `legend`)
   - apply(ctx)  the standing things: buildings you walk into (ctx.building), anything that takes squares before the dressing
   - build(ctx)  the dressing: put (a blocker on a square's middle), dec (decor, jittered), tree, native, look (an `arch` parts list), feat (any terrain row)
   Squares are S(plotId, lx, ly), 0..11 in a plot, x east, y south. S() throws on a plot that is not this district's. Your own random stream: ctx.rnd.
   A blocker stands centred on a whole 3.5 m square (owner-rules.md); the tool throws on a piece in the rock or on a taken square. */
'use strict';

exports.apply = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* THE TEMPLE on the peak (walked into): marble, a portico of six columns, a pediment */
  const MARB = 0xf2efe6, TERRA = 0xb86a4a;
  const TEMPLE = building('temple', 'P11-00', [3, 3, 9, 7, 'S'], 7, { leaf: 'leaf_frame_only', leafDouble: true, keyIn: 'marble_light', floorIn: 'marble_light' }, (a, w, d, dr) => {
      a.shell(w, 7, d, 'marble_light', MARB, dr); a.box(0, 0, 1.75, w + 3.2, 0.3, d + 6.4, 'marble_light', 0xdcd8cc, { top: true });                       // the stylobate, a step proud
      for (let i = 0; i < 6; i++) { const x = -w / 2 - 0.6 + i * (w + 1.2) / 5; a.cyl(x, 0.3, d / 2 + 3.2, 0.55, 6.7, 'marble_light', MARB, { seg: 12 }); a.box(x, 6.7, d / 2 + 3.2, 1.5, 0.3, 1.5, 'marble_light', MARB); }
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) a.cyl(s * (w / 2 + 1.0), 0.3, -d / 2 + 0.6 + i * (d + 1.4) / 3.6, 0.5, 6.7, 'marble_light', MARB, { seg: 12 });
      a.box(0, 7, 1.6, w + 3.2, 0.9, d + 6.6, 'marble_light', 0xe6e2d6, { under: true });                                                                 // the entablature
      a.roof('gable', 0, 7.9, 1.6, d + 7.0, 3.0, w + 3.6, U('WoodGeneric2a'), TERRA, { ry: 90, keyEnd: 'marble_light', tintEnd: MARB }); });
  TEMPLE.put('stone_altar', 0, -3.6); TEMPLE.put('brazier', -4, -3.6); TEMPLE.put('brazier', 4, -3.6); TEMPLE.put('angel_statue', -8, -4.5, { face: 150 }); TEMPLE.put('angel_statue', 8, -4.5, { face: 210 });
  TEMPLE.put('instrument_harp', -7.5, 3.5, { face: 120 }); TEMPLE.put('greek_amphora', 7.6, 4.2); TEMPLE.put('greek_amphora', 8.6, 3.0, { face: 80 }); TEMPLE.put('lectern', 0, 0.5, { face: 180 });
  R.anchor('painting', { x: TEMPLE.at(-6, -TEMPLE.fd / 2 + 0.25)[0], z: TEMPLE.at(-6, -TEMPLE.fd / 2 + 0.25)[1], face: TEMPLE.face(180) });   // the link `lodge_olympus` (a painting on the cella's back wall)
  native('P11-00', 'seraphim', 5, 8, 180, say('olympus', 'seraphim'));
};

exports.build = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* ── MOUNT OLYMPUS ── */
  { const c = S('P10-00', 5, 4), ring = [[0, -3], [2, -2], [3, 0], [2, 2], [0, 3], [-2, 2], [-3, 0], [-2, -2]];   // THE TWELVE THRONES (eight seats fit the court's ring; four more on its north row)
    ring.forEach(d => { const sx = c[0] + d[0], sy = c[1] + d[1]; put('P10-00', 'royal_throne', sx - R.byId['P10-00'].lx * N, sy - R.byId['P10-00'].ly * N, { face: Math.round(Math.atan2(-d[0], d[1]) * 180 / Math.PI + 360) % 360 }); });
    for (const lx of [3, 4, 6, 7]) put('P10-00', 'royal_throne', lx, 0 + (lx === 3 || lx === 7 ? 3 : 2), { face: 180 }); put('P10-00', 'brazier', 5, 4); }
  native('P10-02', 'angel', 5, 4, 90, say('olympus', 'angel'));
  for (const lx of [1, 11]) for (const ly of [0, 9]) put('P10-01', 'greek_column', lx, ly, {});   // THE STADIUM: the track, its four turning posts, the lanes
  { const p = R.byId['P10-01']; for (let i = 1; i < 5; i++) R.marks.push({ k: 'line', x0: gx(p.lx * N + 2), z0: r2(gz(p.ly * N) + i * 7), x1: gx(p.lx * N + 11), z1: r2(gz(p.ly * N) + i * 7), w: 0.14, color: 0xf4f0e4 }); }
  native('P10-01', 'cyclops', 3, 2, 120, say('olympus', 'cyclops')); native('P10-01', 'minotaur', 9, 7, 300);
  for (const ly of [3, 4, 7, 8, 9]) for (const lx of [3, 9]) put('P11-01', 'greek_column', lx, ly, {});   // THE COLONNADE: two rows of columns
  put('P11-01', 'fountain', 6, 6); put('P10-02', 'angel_statue', 3, 3, { face: 180 }); put('P10-02', 'brazier', 6, 5);
  put('P11-02', 'lectern', 5, 6, { face: 0 }); dec('P11-02', 'instrument_harp', 3, 5); dec('P11-02', 'instrument_drum', 7, 5); native('P11-02', 'chosen one', 6, 8, 0);
  put('P12-02', 'fountain', 4, 5); dec('P12-02', 'greek_amphora', 2, 4); dec('P12-02', 'stone_urn', 6, 4); native('P12-02', 'orb of light', 3, 7, 200);
  for (const d of [[3, 3], [6, 4], [4, 6], [7, 7], [3, 8]]) tree('P10-03', 'tree_2', 4.2, d[0], d[1], 0.6); dec('P10-03', 'stone_urn', 5, 5);   // THE OLIVE GROVE
  put('P11-03', 'lion_statue', 3, 6, { face: 180 }); put('P11-03', 'lion_statue', 6, 6, { face: 180 }); put('P11-03', 'brazier', 2, 8); dec('P12-03', 'cave_stone', 6, 5);
  { const q = S('P11-02', 8, 4); R.anchor('bayOlympus', { x: mx(q[0]), z: mz(q[1]), face: 270 }); R.taken.add(q[0] + ':' + q[1]); }   // the Diplomatic bay's door stands at the Amphitheatre
};
