/* THE MOUNTAINS · MOUNT OLYMPUS (district O, 12 plots of room `site_prebuilt_shasta_mountains`)
   One of the six district files of bake-mountains.js (THE DISTRICT FILES there; rules: docs/notes/areas-complexes.md "THE MOUNTAINS, THE DISTRICT FILES").
   One thread = this one file. Never edit bake-mountains.js, layout.json or another district's file without a note on the board (docs/notes/claims.md).
   After an edit: `node bake-mountains.js` (writes data.js between MOUNTAINS-BEGIN / END; `--dry-run` prints the counts only), then RULE #1.

   THE PLOTS (id, name, level; a level is 1.75 m; the plan's squares are layout.json, the tool's file):
     P10-00 The Twelve Thrones (24)          P11-00 The Temple (24)                  P12-00 The Grand Stair (24)
     P10-01 The Stadium (20)                 P11-01 The Colonnade (20)               P12-01 The Cloud Line (21)
     P10-02 The Sacred Way (15)              P11-02 The Amphitheatre (16)            P12-02 The Terraces (16)
     P10-03 The Olive Grove (11)             P11-03 The Pilgrim Stair (10)           P12-03 The Goat Track (11)

   WHAT STANDS HERE TODAY (the district O thread, 2026-11-16; passes and decisions: docs/notes/areas-complexes.md "MOUNT OLYMPUS, THE DISTRICT THREAD")
   - THE TEMPLE (P11-00, walked into): a peripteral temple, 8 x 6 columns on whole squares (each a blocker), gold frieze and acroteria, a pediment; the cella
     is the walk-in (altar, braziers, statues). A painting spot on the back wall is the link `lodge_olympus` (ctx.anchor('painting'))
   - THE TWELVE THRONES (P10-00): eight in a ring on a round dais with a gold inlay and four on the north row, the hearth in the middle
   - THE STADIUM (P10-01): the track, lane lines (ctx.marks), stone seats on both long sides, the prize plinth, a cyclops and a minotaur
   - THE COLONNADE (P11-01): two rows of tall columns under beams (a pergola), a fountain. THE SACRED WAY (P10-02): the gate, statues on plinths
   - THE AMPHITHEATRE (P11-02): four curved tiers of seats, the round floor, the stage wall; DOOR HQ's Diplomatic bay door stands here (ctx.anchor('bayOlympus'))
   - THE TERRACES (P12-02): vine rows on posts, low walls, a fountain. Olive trees, two lions at the Pilgrim Stair

   KNOWN MISSING OR WRONG
   - The cloud is the deep-drift swell wearing another sheet (the tool's). No encounter table (the room is shared by four districts)
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

/* ── THE KIT (district O): white marble with `gain`, the better gold (the `gold` sheet), terracotta tiles ── */
const MARB = 'marble_light', W1 = 0xf6f2e6, W2 = 0xe2dccc, GOLD = 'gold', GT = 0xffe2a0, TERRA = 0xb86a4a, GQ = { gain: 1.7 }, GG = { gain: 1.6 };
const A = (o, x) => Object.assign({}, o, x || {});
/* a column built in the look: a square base, a tapered shaft, a spreading capital under a gold abacus (y0 = its foot, h = its whole height) */
const col = (a, x, z, h, r, y0) => { y0 = y0 || 0; a.box(x, y0, z, r * 2.7, 0.22, r * 2.7, MARB, W2, GQ); a.cyl(x, y0 + 0.22, z, r, h - 0.72, MARB, W1, A(GQ, { seg: 12, r2: r * 0.84 }));
    a.cyl(x, y0 + h - 0.5, z, r * 0.84, 0.26, MARB, W1, A(GQ, { seg: 12, r2: r * 1.3 })); a.box(x, y0 + h - 0.24, z, r * 2.8, 0.24, r * 2.8, GOLD, GT, GG); };
/* a plinth for a statue or a bowl (the prop on it takes `y` = its top, under 1 m: a lift) */
const plinth = (a, x, z, w, h) => { a.box(x, 0, z, w + 0.24, 0.14, w + 0.24, MARB, W2, GQ); a.box(x, 0.14, z, w, h - 0.26, w, MARB, W1, GQ); a.box(x, h - 0.12, z, w + 0.2, 0.12, w + 0.2, GOLD, GT, GG); };

/* the squares: the nub behind the theatre's seats goes back to rock (the seats are cut into it) */
exports.tailor = t => { for (const lx of [3, 4, 5]) t.set('P11-02', lx, 11, 'r'); };

exports.apply = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, say, S, mx, mz, gx, gz, props, feat, N, C, r2, U } = ctx;
  /* THE TEMPLE on the peak (walked into): the cella is the building (6 x 4 squares); round it a ring of columns, 8 x 6, each on the middle of a whole
     square (rows 2..7, columns 2..9 of the plot) under one entablature and one tiled roof, its pediment over the door */
  const TEMPLE = building('temple', 'P11-00', [3, 3, 9, 7, 'S'], 7, { leaf: 'leaf_frame_only', leafDouble: true, keyIn: 'marble_light', floorIn: 'marble_light' }, (a, w, d, dr) => {
      a.shell(w, 7, d, MARB, W1, dr); a.P.slice(-2).forEach(p => { p.gain = 1.7; });
      const PW = 28, PD = 21;                                                                                                        // the ring's plan
      for (const s of [-1, 1]) { a.box(0, 0, s * (d / 2 + 1.9), PW + 0.8, 0.3, 3.8, MARB, W2, GQ); a.box(s * (w / 2 + 1.9), 0, 0, 3.8, 0.3, d, MARB, W2, GQ); }   // the stylobate, a step proud, round the cella
      for (let i = 0; i < 8; i++) for (const s of [-1, 1]) col(a, -12.25 + i * 3.5, s * 8.75, 6.7, 0.62, 0.3);
      for (const s of [-1, 1]) for (const z of [-5.25, -1.75, 1.75, 5.25]) col(a, s * 12.25, z, 6.7, 0.62, 0.3);
      a.box(0, 7, 0, PW + 1.4, 0.9, PD + 1.4, MARB, W1, A(GQ, { under: true }));                                                    // the entablature
      a.box(0, 7.3, 0, PW + 1.5, 0.3, PD + 1.5, GOLD, GT, A(GG, { top: false }));                                                   // …its gold frieze
      a.box(0, 7.9, 0, PW + 2.0, 0.16, PD + 2.0, MARB, W2, A(GQ, { under: true }));                                                 // …the cornice
      a.roof('gable', 0, 8.06, 0, PD + 2.0, 3.7, PW + 2.0, U('WoodGeneric2a'), TERRA, { ry: 90, keyEnd: MARB, tintEnd: W1 });
      for (const s of [-1, 1]) { a.box(0, 8.6, s * (PD / 2 + 1.04), 3.0, 1.3, 0.14, GOLD, GT, A(GG, { roof: true })); for (const t of [-1, 1]) a.box(t * 4.2, 8.45, s * (PD / 2 + 1.04), 1.5, 0.8, 0.12, GOLD, GT, A(GG, { roof: true }));   // the pediment's gold relief
          a.box(0, 11.76, s * (PD / 2 + 1.0), 0.6, 1.1, 0.3, GOLD, GT, { glow: 0.9, roof: true }); for (const t of [-1, 1]) a.box(t * (PW / 2 + 0.8), 8.06, s * (PD / 2 + 0.8), 0.5, 0.9, 0.5, GOLD, GT, { glow: 0.9, roof: true }); }   // the acroteria
      for (const s of [-1, 1]) a.box(dr.lx + s * (dr.cw / 2 + 0.22), 0, d / 2 + 0.09, 0.3, 2.5, 0.16, GOLD, GT, GG); a.box(dr.lx, 2.3, d / 2 + 0.09, dr.cw + 0.9, 0.3, 0.2, GOLD, GT, GG); });   // the door's gold frame
  flat('P11-00', 2, 2, 10, 8);
  { const sq = []; for (let lx = 2; lx <= 9; lx++) sq.push([lx, 2], [lx, 7]); for (let ly = 3; ly <= 6; ly++) sq.push([2, ly], [9, ly]);   // a column blocks its square's middle
    sq.forEach(([lx, ly]) => { const q = S('P11-00', lx, ly); R.taken.add(q[0] + ':' + q[1]); feat({ k: 'wall', x0: r2(mx(q[0]) - 0.55), z0: mz(q[1]), x1: r2(mx(q[0]) + 0.55), z1: mz(q[1]), t: 1.1, h: 3, ghost: true, rail: false }); }); }
  TEMPLE.put('stone_altar', 0, -3.6); TEMPLE.put('brazier', -4, -3.6); TEMPLE.put('brazier', 4, -3.6); TEMPLE.put('angel_statue', -8, -4.5, { face: 150 }); TEMPLE.put('angel_statue', 8, -4.5, { face: 210 });
  TEMPLE.put('instrument_harp', -7.5, 3.5, { face: 120 }); TEMPLE.put('greek_amphora', 7.6, 4.2); TEMPLE.put('greek_amphora', 8.6, 3.0, { face: 80 }); TEMPLE.put('lectern', 0, 0.5, { face: 180 });
  R.anchor('painting', { x: TEMPLE.at(-6, -TEMPLE.fd / 2 + 0.25)[0], z: TEMPLE.at(-6, -TEMPLE.fd / 2 + 0.25)[1], face: TEMPLE.face(180) });   // the link `lodge_olympus` (a painting on the cella's back wall)
  native('P11-00', 'seraphim', 7, 9, 180, say('olympus', 'seraphim'));
};

exports.build = ctx => {
    const R = ctx, { put, dec, tree, native, look, flat, say, S, mx, mz, gx, gz, props, feat, N, C, r2, U, WD2 } = ctx;
  /* a plot's own look: parts in metres from the plot's north-west corner; M(l) = the middle of square l */
  /* a look stands on the ground under its ORIGIN square (ox, oy) unless `hug` (then every corner lies on the ground under it: for a sloping plot) */
  let OX = 0, OY = 0; const X = l => (l - OX) * C, Z = l => (l - OY) * C;
  const plotLook = (id, tag, ox, oy, hug, fn) => { const q = S(id, ox, oy); OX = ox; OY = oy; look('oly:' + tag, mx(q[0]), mz(q[1]), fn); if (hug) R.ARCH[R.ARCH.length - 1].hug = true; };
  /* a square taken by a built shape (no prop on it): a ghost wall on its middle, so it blocks like a prop would */
  const block = (id, lx, ly, w, h) => { const q = S(id, lx, ly), k = q[0] + ':' + q[1]; if (!R.open(q[0], q[1]) || R.cell[q[1]][q[0]] === 'B' || R.taken.has(k)) throw new Error('district O: a shape on a square that is not free: ' + id + ' ' + lx + ',' + ly);
      R.taken.add(k); feat({ k: 'wall', x0: r2(mx(q[0]) - (w || 3.2) / 2), z0: mz(q[1]), x1: r2(mx(q[0]) + (w || 3.2) / 2), z1: mz(q[1]), t: w || 3.2, h: h || 1.2, ghost: true, rail: false }); };
  const onPlinth = (id, a, key, lx, ly, h, q) => { plinth(a, X(lx), Z(ly), 1.3, h); put(id, key, lx, ly, Object.assign({ y: h }, q || {})); };

  /* ── THE TWELVE THRONES (P10-00): eight seats in a ring on a round dais, four on the north row, the hearth in the middle ── */
  { const c = S('P10-00', 5, 4), P0 = R.byId['P10-00'], ring = [[0, -3], [2, -2], [3, 0], [2, 2], [0, 3], [-2, 2], [-3, 0], [-2, -2]];
    ring.forEach(d => { const sx = c[0] + d[0], sy = c[1] + d[1]; put('P10-00', 'royal_throne', sx - P0.lx * N, sy - P0.ly * N, { h: 2.5, face: Math.round(Math.atan2(-d[0], d[1]) * 180 / Math.PI + 360) % 360 }); });
    for (const lx of [3, 4, 6, 7]) put('P10-00', 'royal_throne', lx, 0 + (lx === 3 || lx === 7 ? 3 : 2), { h: 2.5, face: 180 });
    plotLook('P10-00', 'thrones', 5, 4, false, a => { const x = 0, z = 0;
        a.cyl(x, 0, z, 13.6, 0.12, MARB, W2, A(GQ, { seg: 40 })); a.cyl(x, 0.12, z, 8.1, 0.03, GOLD, GT, A(GG, { seg: 40, ri: 7.7 })); a.cyl(x, 0.12, z, 12.9, 0.03, GOLD, GT, A(GG, { seg: 40, ri: 12.6 }));   // the dais and its two gold rings
        a.cyl(x, 0, z, 1.5, 0.5, MARB, W1, A(GQ, { seg: 16 })); a.cyl(x, 0.5, z, 1.62, 0.1, GOLD, GT, A(GG, { seg: 16, ri: 1.2 }));                                  // the hearth's kerb
    });
    put('P10-00', 'brazier', 5, 4, { y: 0.5 }); }
  /* ── THE SACRED WAY (P10-02): the gate at its west end, statues on plinths along its north side ── */
  plotLook('P10-02', 'way', 3, 4, true, a => {
      for (const ly of [3, 6]) { col(a, X(1), Z(ly) + (ly === 6 ? -0.9 : 0), 6.2, 0.6); }                                               // the gate: two columns, a beam, a small pediment
      a.box(X(1), 6.2, Z(4.5) - 0.45, 1.5, 0.8, 12.6, MARB, W1, A(GQ, { under: true })); a.box(X(1), 6.45, Z(4.5) - 0.45, 1.58, 0.28, 12.7, GOLD, GT, A(GG, { top: false }));
      a.roof('gable', X(1), 7.0, Z(4.5) - 0.45, 2.0, 1.5, 13.2, U('WoodGeneric2a'), TERRA, { keyEnd: MARB, tintEnd: W1 });
      onPlinth('P10-02', a, 'angel_statue', 3, 3, 0.9, { face: 180 }); onPlinth('P10-02', a, 'marble_bust', 6, 3, 0.95, { face: 180 }); onPlinth('P10-02', a, 'stone_urn', 5, 6, 0.9); });
  { const q = S('P10-02', 1, 3); R.taken.add(q[0] + ':' + q[1]); feat({ k: 'wall', x0: r2(mx(q[0]) - 0.55), z0: mz(q[1]), x1: r2(mx(q[0]) + 0.55), z1: mz(q[1]), t: 1.1, h: 3, ghost: true, rail: false }); }
  native('P10-02', 'angel', 8, 5, 270, say('olympus', 'angel')); put('P10-02', 'brazier', 2, 3);
  /* ── THE STADIUM (P10-01): the track, its lanes, stone seats on both long sides, the prize at the west end ── */
  { const p = R.byId['P10-01']; for (let i = 1; i < 5; i++) R.marks.push({ k: 'line', x0: gx(p.lx * N + 2), z0: r2(gz(p.ly * N) + i * 7), x1: gx(p.lx * N + 11), z1: r2(gz(p.ly * N) + i * 7), w: 0.14, color: 0xf4f0e4 }); }
  plotLook('P10-01', 'stadium', 6, 5, true, a => {
      const seats = (lx0, lx1, ly, out) => { const x = (X(lx0) + X(lx1)) / 2, L = (lx1 - lx0 + 1) * C - 0.2, z = Z(ly);   // three tiers, the highest at the back (`out` = -1 north side, +1 south side)
          for (let i = 0; i < 3; i++) a.box(x, 0, z + out * (0.55 + i * 0.55), L, 0.5 * (i + 1), 3.3 - i * 1.1 - 0.0, MARB, i % 2 ? W2 : W1, GQ);
          a.box(x, 1.5, z + out * 1.55, L, 0.5, 0.2, MARB, W2, GQ); for (const s of [-1, 1]) a.box(x + s * (L / 2 + 0.1), 0, z, 0.3, 1.9, 3.4, MARB, W2, GQ); };
      seats(2, 6, 0, -1); seats(6, 10, 9, 1);
      plinth(a, X(1), Z(5), 1.5, 1.0); for (const ly of [3, 7]) plinth(a, X(1), Z(ly), 1.1, 0.7);
      for (const lx of [2, 11]) { for (let ly = 0; ly < 10; ly++) a.box(X(lx) - 1.6, 0, Z(ly), 0.25, 0.05, 3.5, GOLD, GT, GG); } });   // the start and the finish, gold in the track
  for (let lx = 2; lx <= 6; lx++) block('P10-01', lx, 0); for (let lx = 6; lx <= 10; lx++) block('P10-01', lx, 9);
  put('P10-01', 'decor_trophy_cup', 1, 5, { y: 1.0 }); put('P10-01', 'brazier', 1, 3, { y: 0.7 }); put('P10-01', 'brazier', 1, 7, { y: 0.7 });
  for (const [lx, ly] of [[1, 0], [11, 0], [1, 9], [11, 9]]) put('P10-01', 'greek_column', lx, ly, { h: 4.6 });
  native('P10-01', 'cyclops', 3, 2, 120, say('olympus', 'cyclops')); native('P10-01', 'minotaur', 9, 7, 300);
  /* ── THE COLONNADE (P11-01): two rows of tall columns under beams, rafters across: a pergola over the walk; the fountain in its middle ── */
  for (const ly of [3, 4, 7, 8, 9]) for (const lx of [3, 9]) put('P11-01', 'greek_column', lx, ly, { h: 6 });
  plotLook('P11-01', 'colonnade', 6, 6, true, a => { for (const lx of [3, 9]) for (let ly = 3; ly <= 9; ly++) { a.box(X(lx), 6, Z(ly), 1.3, 0.7, C + 0.02, MARB, W1, A(GQ, { under: true })); a.box(X(lx), 6.22, Z(ly), 1.38, 0.26, C + 0.04, GOLD, GT, A(GG, { top: false })); }
      for (const ly of [3, 4, 5, 6, 7, 8, 9]) for (let lx = 3; lx < 9; lx++) a.box(X(lx + 0.5), 6.7, Z(ly), C + 0.02, 0.3, 0.45, MARB, W2, A(GQ, { under: true })); });
  put('P11-01', 'fountain', 6, 6);
  { const q = S('P11-02', 2, 6); R.flats.push([q[0], q[1], q[0] + 6, q[1] + 5, 'N']); }   // the theatre stands level (the level of its north edge): a terrace on the slope
  /* ── THE AMPHITHEATRE (P11-02): the round floor, four curved tiers cut into the slope south of it, the stage wall north of it ── */
  plotLook('P11-02', 'theatre', 4, 7, false, a => { const x = X(4.5), z = Z(7.5);
      a.cyl(x, 0, z, 4.45, 0.05, MARB, W2, A(GQ, { seg: 32 })); a.cyl(x, 0.05, z, 4.45, 0.03, GOLD, GT, A(GG, { seg: 32, ri: 4.15 }));                   // the orchestra
      for (let i = 0; i < 4; i++) a.cyl(x, 0, z, 4.5 + 1.05 * (i + 1), 0.45 * (i + 1), MARB, i % 2 ? W2 : W1, A(GQ, { seg: 40, arc: 180, a0: 0, ri: 4.5 + 1.05 * i }));   // the cavea
      a.cyl(x, 0, z, 9.0, 2.4, MARB, W2, A(GQ, { seg: 40, arc: 180, a0: 0, ri: 8.7 }));                                                                  // …its back wall
      a.box(x, 0, Z(6), 4 * C - 0.2, 0.5, 2.6, MARB, W2, GQ); a.box(x, 0.5, Z(6) - 0.9, 4 * C - 0.4, 3.4, 0.6, MARB, W1, GQ);                              // the stage and the wall behind it
      for (let i = 0; i < 5; i++) col(a, x - 6.2 + i * 3.1, Z(6) - 0.2, 3.4, 0.32, 0.5);
      a.box(x, 3.9, Z(6) - 0.55, 4 * C, 0.5, 1.5, MARB, W1, A(GQ, { under: true })); a.box(x, 4.05, Z(6) - 0.55, 4 * C + 0.08, 0.2, 1.58, GOLD, GT, A(GG, { top: false })); });
  for (let lx = 3; lx <= 6; lx++) { block('P11-02', lx, 6); block('P11-02', lx, 9); block('P11-02', lx, 10); } for (const [lx, ly] of [[2, 8], [7, 8], [2, 9], [7, 9]]) block('P11-02', lx, ly);
  put('P11-02', 'lectern', 4, 7, { face: 0 }); dec('P11-02', 'instrument_harp', 3, 7); dec('P11-02', 'instrument_drum', 6, 7); native('P11-02', 'chosen one', 5, 8, 180);
  /* ── THE TERRACES (P12-02): vine rows on posts between low stone walls, a fountain ── */
  plotLook('P12-02', 'terraces', 4, 7, false, a => {
      const vine = (lx, ly) => { const x = X(lx), z = Z(ly); for (const s of [-1, 1]) a.box(x + s * 1.5, 0, z, 0.14, 1.9, 0.14, WD2, 0x6a4a30, { gain: 1.4 }); a.box(x, 1.84, z, 3.5, 0.1, 0.12, WD2, 0x6a4a30, { gain: 1.4 });
          a.box(x, 0.5, z, 3.3, 1.5, 0.55, 'leaves', 0x5a8a3a, { gain: 1.2 }); a.box(x, 0, z, 3.5, 0.5, 1.1, 'rocks_5', 0xb8b4a8); };
      for (const ly of [6, 8]) for (const lx of [1, 2, 3, 5, 6, 7]) vine(lx, ly); });
  for (const ly of [6, 8]) for (const lx of [1, 2, 3, 5, 6, 7]) block('P12-02', lx, ly, 3.4, 1.6);
  put('P12-02', 'fountain', 4, 5); dec('P12-02', 'greek_amphora', 2, 5); dec('P12-02', 'stone_urn', 6, 5); native('P12-02', 'orb of light', 3, 7, 200);
  /* ── THE OLIVE GROVE, THE PILGRIM STAIR, THE GOAT TRACK ── */
  for (const d of [[3, 4], [6, 5], [4, 6], [7, 7], [3, 8], [5, 8], [7, 5]]) tree('P10-03', 'tree_2', 4.2, d[0], d[1], 0.6); dec('P10-03', 'stone_urn', 5, 5);
  put('P11-03', 'lion_statue', 3, 6, { face: 180 }); put('P11-03', 'lion_statue', 6, 6, { face: 180 }); put('P11-03', 'brazier', 2, 8); dec('P12-03', 'cave_stone', 6, 5);
  { const q = S('P11-02', 8, 4); R.anchor('bayOlympus', { x: mx(q[0]), z: mz(q[1]), face: 270 }); R.taken.add(q[0] + ':' + q[1]); }   // the Diplomatic bay's door stands at the Amphitheatre
};
