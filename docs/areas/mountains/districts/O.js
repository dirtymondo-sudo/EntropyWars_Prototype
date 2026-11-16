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
   - THE TERRACES (P12-02): grape trellises, a fountain. Olive trees, two lions at the Pilgrim Stair
   - THE MODEL PASS (11-16): the wish-list models are in (olive_tree, grape_trellis, tripod_bowl for every brazier, god_statue, lyre, chariot, discus_rack, greek_couch,
     laurel_wreath, mountain_goat, cypress_tree ...). NEEDS A MODEL: nothing open

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
const col = (a, x, z, h, r, y0, inn) => { y0 = y0 || 0; const q = inn ? IN : GQ, g = inn ? ING : GG; a.box(x, y0, z, r * 2.7, 0.22, r * 2.7, MARB, W2, q); a.cyl(x, y0 + 0.22, z, r, h - 0.72, MARB, W1, A(q, { seg: 12, r2: r * 0.84 }));
    a.cyl(x, y0 + h - 0.5, z, r * 0.84, 0.26, MARB, W1, A(q, { seg: 12, r2: r * 1.3 })); a.box(x, y0 + h - 0.24, z, r * 2.8, 0.24, r * 2.8, GOLD, GT, g); };
/* a plinth for a statue or a bowl (the prop on it takes `y` = its top, under 1 m: a lift) */
const plinth = (a, x, z, w, h, inn) => { const q = inn ? IN : GQ, g = inn ? ING : GG; a.box(x, 0, z, w + 0.24, 0.14, w + 0.24, MARB, W2, q); a.box(x, 0.14, z, w, h - 0.26, w, MARB, W1, q); a.box(x, h - 0.12, z, w + 0.2, 0.12, w + 0.2, GOLD, GT, g); };
/* THE NIGHT (pass 4; the zone's rule of light: warm against the blue night). Parts that glow are drawn unlit, so they cost no light:
   flame = a gold bowl with a fire in it (on a column, a wall top, a pediment's end); lamp = a small oil lamp hung on a chain under a beam */
const flame = (a, x, y, z, k, q) => { k = k || 1; a.cyl(x, y, z, 0.16 * k, 0.16 * k, GOLD, GT, A({ seg: 8, r2: 0.34 * k, glow: 0.9 }, q)); a.cyl(x, y + 0.14 * k, z, 0.14 * k, 0.2 * k, null, 0xff5a08, A({ seg: 8, r2: 0.27 * k, glow: 1.0, cap: false }, q)); a.cyl(x, y + 0.34 * k, z, 0.27 * k, 0.5 * k, null, 0xff5a08, A({ seg: 8, r2: 0.02, glow: 1.0 }, q));   // a flame: a swell, then a tongue
    a.cyl(x + 0.05 * k, y + 0.2 * k, z, 0.13 * k, 0.42 * k, null, 0xffc030, A({ seg: 6, r2: 0.02, glow: 1.0 }, q)); a.cyl(x - 0.12 * k, y + 0.3 * k, z + 0.06 * k, 0.09 * k, 0.5 * k, null, 0xff7a10, A({ seg: 5, r2: 0.01, glow: 1.0 }, q)); };
const lamp = (a, x, top, z, q) => { a.box(x, top - 0.6, z, 0.03, 0.6, 0.03, GOLD, GT, A({ glow: 0.8 }, q)); a.cyl(x, top - 0.78, z, 0.2, 0.18, GOLD, GT, A({ seg: 8, r2: 0.1, glow: 0.9 }, q)); a.cyl(x, top - 0.94, z, 0.15, 0.18, null, 0xff9a20, A({ seg: 8, glow: 1.0 }, q)); };
/* THE INSIDE (the zone kit: a walk-in's own walls take no light, so the room is lined a hand inside them with parts that glow). IN = lit marble, ING = lit gold */
const IN = { glow: 0.9, gain: 1.15 }, ING = { glow: 0.95, gain: 1.5 };
const cella = (a, w, h, d, dr) => { const top = h - 0.36, i = 0.3, t = 0.04, e = w / 2 - i, x0 = dr.lx - dr.cw / 2, x1 = dr.lx + dr.cw / 2;
    const wall = (y, hh, key, tint, q, o) => { const I = i + (o || 0);   // a band round the four walls, the doorway left open below 2.2 m
        a.box(0, y, -(d / 2 - I), w - 2 * I, hh, t, key, tint, q); for (const s of [-1, 1]) a.box(s * (w / 2 - I), y, 0, t, hh, d - 2 * I, key, tint, q);
        if (y >= 2.2) a.box(0, y, d / 2 - I, w - 2 * I, hh, t, key, tint, q); else { a.box((-e + x0) / 2, y, d / 2 - I, x0 + e, hh, t, key, tint, q); a.box((x1 + e) / 2, y, d / 2 - I, e - x1, hh, t, key, tint, q); } };
    wall(0, 1.1, MARB, 0xcfc8b6, IN, 0.02); wall(1.1, 0.14, GOLD, GT, ING, 0.04); wall(1.24, 0.96, MARB, W1, IN); wall(2.2, 2.4, MARB, W1, IN); wall(4.6, 0.3, GOLD, GT, ING, 0.03); wall(4.9, top - 4.9, MARB, W1, IN);
    a.box(0, 0.03, 0, w - 2 * i, 0.02, d - 2 * i, MARB, 0xdcd6c6, A(IN, { sides: false }));                                                              // the floor, lit
    for (const s of [-1, 1]) { a.box(0, 0.05, s * (d / 2 - 1.3), w - 2.6, 0.012, 0.28, GOLD, GT, A(ING, { sides: false })); a.box(s * (w / 2 - 1.3), 0.05, 0, 0.28, 0.012, d - 2.6, GOLD, GT, A(ING, { sides: false })); }   // …a gold line round it
    a.box(0, top - 0.1, 0, w - 2 * i, 0.02, d - 2 * i, MARB, 0xc8c0aa, { sides: false, top: false, under: true, glow: 0.75 });                           // the ceiling
    for (const z of [-3.5, 0, 3.5]) a.box(0, top - 0.34, z, w - 2 * i, 0.24, 0.3, GOLD, GT, A(ING, { under: true, top: false })); for (const x of [-7, -3.5, 0, 3.5, 7]) a.box(x, top - 0.3, 0, 0.3, 0.2, d - 2 * i, GOLD, GT, A(ING, { under: true, top: false }));   // …its coffers
    for (const sx of [-1, 1]) for (const z of [-1.75, 1.75]) col(a, sx * 5.25, z, top - 0.34, 0.5, 0, true);
    for (const x of [-8.75, -1.75, 1.75, 8.75]) for (const z of [-1.75, 1.75]) lamp(a, x, top - 0.34, z); for (const s of [-1, 1]) flame(a, s * 3.1, 1.05, -5.0, 0.9);   // hung lamps; two fires on the statue's base                                           // four columns carry it
    /* the statue's base across the two middle squares of the back row, a step for the altar before it, a gold disc on the wall behind */
    a.box(0, 0, -5.7, 6.8, 0.95, 2.4, MARB, 0xd6cfbd, IN); a.box(0, 0.95, -5.7, 7.0, 0.1, 2.6, GOLD, GT, ING); a.box(0, 0, -4.0, 4.4, 0.4, 1.0, MARB, 0xcfc8b6, IN);
    a.box(0, 1.5, -(d / 2 - i) + 0.05, 3.6, 3.6, 0.06, GOLD, GT, ING); a.box(0, 1.8, -(d / 2 - i) + 0.09, 3.0, 3.0, 0.04, MARB, 0x2c3c66, { glow: 0.9 });
    for (const s of [-1, 1]) { a.box(s * 2.4, 0, -(d / 2 - i) + 0.2, 0.5, 5.4, 0.3, MARB, W1, IN); a.box(s * 2.4, 5.4, -(d / 2 - i) + 0.2, 0.7, 0.2, 0.4, GOLD, GT, ING); }
    for (const s of [-1, 1]) for (const z of [-1.75, 1.75]) plinth(a, s * 8.75, z, 1.2, 0.95, true); };

/* the squares: the nub behind the theatre's seats goes back to rock (the seats are cut into it) */
exports.tailor = t => { for (const lx of [3, 4, 5]) t.set('P11-02', lx, 11, 'r'); };

exports.apply = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, say, S, mx, mz, gx, gz, props, feat, N, C, r2, U } = ctx;
  /* THE TEMPLE on the peak (walked into): the cella is the building (6 x 4 squares); round it a ring of columns, 8 x 6, each on the middle of a whole
     square (rows 2..7, columns 2..9 of the plot) under one entablature and one tiled roof, its pediment over the door */
  const TEMPLE = building('temple', 'P11-00', [3, 3, 9, 7, 'S'], 7, { leaf: 'leaf_wooden', leafDouble: true, keyIn: 'marble_light', floorIn: 'marble_light' }, (a, w, d, dr) => {
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
      for (const s of [-1, 1]) a.box(dr.lx + s * (dr.cw / 2 + 0.22), 0, d / 2 + 0.09, 0.3, 2.5, 0.16, GOLD, GT, GG); a.box(dr.lx, 2.3, d / 2 + 0.09, dr.cw + 0.9, 0.3, 0.2, GOLD, GT, GG);
      for (const s of [-1, 1]) for (let i = 0; i < 7; i++) lamp(a, -10.5 + i * 3.5, 7.0, s * 8.75); for (const s of [-1, 1]) for (const z of [-3.5, 0, 3.5]) lamp(a, s * 12.25, 7.0, z);   // lamps under the ring's beam
      for (const s of [-1, 1]) for (const t of [-1, 1]) flame(a, t * (PW / 2 + 0.8), 8.96, s * (PD / 2 + 0.8), 1.5, { roof: true });
      cella(a, w, 7, d, dr); });   // the door's gold frame
  flat('P11-00', 2, 2, 10, 8);
  { const sq = []; for (let lx = 2; lx <= 9; lx++) sq.push([lx, 2], [lx, 7]); for (let ly = 3; ly <= 6; ly++) sq.push([2, ly], [9, ly]);   // a column blocks its square's middle
    sq.forEach(([lx, ly]) => { const q = S('P11-00', lx, ly); R.taken.add(q[0] + ':' + q[1]); feat({ k: 'wall', x0: r2(mx(q[0]) - 0.55), z0: mz(q[1]), x1: r2(mx(q[0]) + 0.55), z1: mz(q[1]), t: 1.1, h: 3, ghost: true, rail: false }); }); }
  /* THE CELLA (pass 2). Every prop of a walk-in is `floor: true`; a blocker stands on a square's middle (the squares' middles here: x -8.75 .. 8.75, z -5.25 .. 5.25) */
  { const T = (key, lx, lz, q) => TEMPLE.put(key, lx, lz, Object.assign({ floor: true }, q || {}));
    const ghost = (lx, lz, wd) => { const a0 = TEMPLE.at(lx - wd / 2, lz), a1 = TEMPLE.at(lx + wd / 2, lz); feat({ k: 'wall', x0: a0[0], z0: a0[1], x1: a1[0], z1: a1[1], t: Math.min(wd, 3.2), h: 2, ghost: true, rail: false }); };
    T('god_statue', 0, -5.7, { y: 0.98, face: 180 }); ghost(0, -5.25, 6.8); T('stone_altar', 0, -4.0, { y: 0.4, face: 180 });                // the statue on its base, the altar on the step
    for (const s of [-1, 1]) { T('tripod_bowl', s * 1.75, -1.75); { const q = TEMPLE.at(s * 1.75, -1.75); look('oly:fire:cella:' + s, q[0], q[1], a => flame(a, 0, 1.3, 0, 1.0)); } T('angel_statue', s * 8.75, -5.25, { face: s < 0 ? 150 : 210 }); for (const z of [-1.75, 1.75]) { ghost(s * 5.25, z, 1.1); T('marble_bust', s * 8.75, z, { y: 0.95, face: s < 0 ? 90 : 270 }); } }
    T('greek_couch', -8.75, 5.25, { face: 90 }); T('lyre', -7.3, 4.2, { face: 140 }); T('laurel_wreath', 0.5, -3.6, { y: 0.42 }); T('oil_lamp', -0.5, -3.6, { y: 0.42 }); T('lectern', 5.25, 5.25, { face: 180 }); T('votive_stand', -5.25, 5.25, { face: 180 }); T('giant_hourglass', 8.75, 5.25);
    T('greek_amphora', 7.4, 6.0); T('greek_amphora', 9.7, 4.0, { face: 80 }); T('stone_urn', -7.4, 6.1); T('candelabra', -3.9, -4.3); T('candelabra', 3.9, -4.3); }
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
  /* a plinth is its own small look on its own square (a plinth inside a plot-wide `hug` look sank into the ground and stood a metre off its statue) */
  const plinthAt = (id, lx, ly, w, h) => { const q = S(id, lx, ly); look('oly:pl:' + id + ':' + lx + ':' + ly, mx(q[0]), mz(q[1]), a => plinth(a, 0, 0, w, h)); };
  /* THE MODEL PASS: a bronze tripod bowl (the wish list's `tripod_bowl`, in place of the brazier) with a fire in it (a part that glows; `lift` = the plinth under it) */
  const bowl = (id, lx, ly, lift) => { const q = S(id, lx, ly); put(id, 'tripod_bowl', lx, ly, lift ? { y: lift } : {}); look('oly:fire:' + id + ':' + lx + ':' + ly, mx(q[0]), mz(q[1]), a => flame(a, 0, (lift || 0) + 1.3, 0, 1.0)); };
  const onPlinth = (id, a, key, lx, ly, h, q) => { plinthAt(id, lx, ly, 1.3, h); put(id, key, lx, ly, Object.assign({ y: h }, q || {})); };

  /* ── THE TWELVE THRONES (P10-00): eight seats in a ring on a round dais, four on the north row, the hearth in the middle ── */
  { const c = S('P10-00', 5, 4), P0 = R.byId['P10-00'], ring = [[0, -3], [2, -2], [3, 0], [2, 2], [0, 3], [-2, 2], [-3, 0], [-2, -2]];
    ring.forEach(d => { const sx = c[0] + d[0], sy = c[1] + d[1]; put('P10-00', 'royal_throne', sx - P0.lx * N, sy - P0.ly * N, { h: 2.5, face: Math.round(Math.atan2(-d[0], d[1]) * 180 / Math.PI + 360) % 360 }); });
    for (const lx of [3, 4, 6, 7]) put('P10-00', 'royal_throne', lx, 0 + (lx === 3 || lx === 7 ? 3 : 2), { h: 2.5, face: 180 });
    plotLook('P10-00', 'thrones', 5, 4, false, a => { const x = 0, z = 0;
        a.cyl(x, 0, z, 13.6, 0.12, MARB, W2, A(GQ, { seg: 40 })); a.cyl(x, 0.12, z, 8.1, 0.03, GOLD, GT, A(GG, { seg: 40, ri: 7.7 })); a.cyl(x, 0.12, z, 12.9, 0.03, GOLD, GT, A(GG, { seg: 40, ri: 12.6 }));   // the dais and its two gold rings
        a.cyl(x, 0, z, 1.5, 0.5, MARB, W1, A(GQ, { seg: 16 })); a.cyl(x, 0.5, z, 1.62, 0.1, GOLD, GT, A(GG, { seg: 16, ri: 1.2 }));                                  // the hearth's kerb
    });
    bowl('P10-00', 5, 4, 0.5); }
  /* ── THE SACRED WAY (P10-02): the gate at its west end, statues on plinths along its north side ── */
  plotLook('P10-02', 'way', 3, 4, true, a => {
      for (const ly of [3, 6]) { col(a, X(1), Z(ly) + (ly === 6 ? -0.9 : 0), 6.2, 0.6); }                                               // the gate: two columns, a beam, a small pediment
      a.box(X(1), 6.2, Z(4.5) - 0.45, 1.5, 0.8, 12.6, MARB, W1, A(GQ, { under: true })); a.box(X(1), 6.45, Z(4.5) - 0.45, 1.58, 0.28, 12.7, GOLD, GT, A(GG, { top: false }));
      a.roof('gable', X(1), 7.0, Z(4.5) - 0.45, 2.0, 1.5, 13.2, U('WoodGeneric2a'), TERRA, { keyEnd: MARB, tintEnd: W1 });
      for (const s of [-1, 1]) flame(a, X(1), 7.0, Z(4.5) - 0.45 + s * 6.0, 1.3); for (const z of [Z(4), Z(5)]) lamp(a, X(1), 6.2, z);
      onPlinth('P10-02', a, 'angel_statue', 3, 3, 0.9, { face: 180 }); onPlinth('P10-02', a, 'marble_bust', 6, 3, 0.95, { face: 180 }); onPlinth('P10-02', a, 'stone_urn', 5, 6, 0.9); });
  { const q = S('P10-02', 1, 3); R.taken.add(q[0] + ':' + q[1]); feat({ k: 'wall', x0: r2(mx(q[0]) - 0.55), z0: mz(q[1]), x1: r2(mx(q[0]) + 0.55), z1: mz(q[1]), t: 1.1, h: 3, ghost: true, rail: false }); }
  native('P10-02', 'angel', 8, 5, 270, say('olympus', 'angel')); bowl('P10-02', 2, 3);
  /* ── THE STADIUM (P10-01): the track, its lanes, stone seats on both long sides, the prize at the west end ── */
  { const p = R.byId['P10-01']; for (let i = 1; i < 5; i++) R.marks.push({ k: 'line', x0: gx(p.lx * N + 2), z0: r2(gz(p.ly * N) + i * 7), x1: gx(p.lx * N + 11), z1: r2(gz(p.ly * N) + i * 7), w: 0.14, color: 0xf4f0e4 }); }
  plotLook('P10-01', 'stadium', 6, 5, true, a => {
      const seats = (lx0, lx1, ly, out) => { const x = (X(lx0) + X(lx1)) / 2, L = (lx1 - lx0 + 1) * C - 0.2, z = Z(ly);   // three tiers, the highest at the back (`out` = -1 north side, +1 south side)
          for (let i = 0; i < 3; i++) a.box(x, 0, z + out * (0.55 + i * 0.55), L, 0.5 * (i + 1), 3.3 - i * 1.1 - 0.0, MARB, i % 2 ? W2 : W1, GQ);
          a.box(x, 1.5, z + out * 1.55, L, 0.5, 0.2, MARB, W2, GQ); for (const s of [-1, 1]) a.box(x + s * (L / 2 + 0.1), 0, z, 0.3, 1.9, 3.4, MARB, W2, GQ); };
      seats(2, 6, 0, -1); seats(6, 10, 9, 1); for (const [lx, ly] of [[1, 0], [11, 0], [1, 9], [11, 9]]) flame(a, X(lx), 4.6, Z(ly), 1.6); for (const lx of [2, 6]) flame(a, X(lx) + (lx === 2 ? -1.75 : 1.75), 1.9, Z(0), 1.0); for (const lx of [6, 10]) flame(a, X(lx) + (lx === 6 ? -1.75 : 1.75), 1.9, Z(9), 1.0);
      for (const lx of [2, 11]) { for (let ly = 0; ly < 10; ly++) a.box(X(lx) - 1.6, 0, Z(ly), 0.25, 0.05, 3.5, GOLD, GT, GG); } });   // the start and the finish, gold in the track
  for (let lx = 2; lx <= 6; lx++) block('P10-01', lx, 0); for (let lx = 6; lx <= 10; lx++) block('P10-01', lx, 9);
  plinthAt('P10-01', 1, 5, 1.5, 1.0); for (const ly of [3, 7]) plinthAt('P10-01', 1, ly, 1.1, 0.7);
  put('P10-01', 'decor_trophy_cup', 1, 5, { y: 1.0 }); bowl('P10-01', 1, 3, 0.7); bowl('P10-01', 1, 7, 0.7); props.push({ key: 'laurel_wreath', x: r2(mx(S('P10-01', 1, 5)[0]) + 0.45), z: r2(mz(S('P10-01', 1, 5)[1]) + 0.4), y: 0.99 });
  for (const [lx, ly] of [[1, 0], [11, 0], [1, 9], [11, 9]]) put('P10-01', 'greek_column', lx, ly, { h: 4.6 });
  native('P10-01', 'cyclops', 3, 2, 120, say('olympus', 'cyclops')); native('P10-01', 'minotaur', 9, 7, 300);
  /* ── THE COLONNADE (P11-01): two rows of tall columns under beams, rafters across: a pergola over the walk; the fountain in its middle ── */
  for (const ly of [3, 4, 7, 8, 9]) for (const lx of [3, 9]) put('P11-01', 'greek_column', lx, ly, { h: 6 });
  plotLook('P11-01', 'colonnade', 6, 6, true, a => { for (const lx of [3, 9]) for (let ly = 3; ly <= 9; ly++) { a.box(X(lx), 6, Z(ly), 1.3, 0.7, C + 0.02, MARB, W1, A(GQ, { under: true })); a.box(X(lx), 6.22, Z(ly), 1.38, 0.26, C + 0.04, GOLD, GT, A(GG, { top: false })); }
      for (const ly of [3, 4, 5, 6, 7, 8, 9]) for (let lx = 3; lx < 9; lx++) a.box(X(lx + 0.5), 6.7, Z(ly), C + 0.02, 0.3, 0.45, MARB, W2, A(GQ, { under: true }));
      for (const ly of [3, 4, 7, 8, 9]) for (const lx of [5, 7]) lamp(a, X(lx), 6.7, Z(ly)); for (const lx of [3, 9]) for (const ly of [3, 9]) flame(a, X(lx), 6.7, Z(ly), 1.3); });
  put('P11-01', 'fountain', 6, 6);
  { const q = S('P11-02', 2, 6); R.flats.push([q[0], q[1], q[0] + 6, q[1] + 5, 'N']); }   // the theatre stands level (the level of its north edge): a terrace on the slope
  /* ── THE AMPHITHEATRE (P11-02): the round floor, four curved tiers cut into the slope south of it, the stage wall north of it ── */
  plotLook('P11-02', 'theatre', 4, 7, false, a => { const x = X(4.5), z = Z(7.5);
      a.cyl(x, 0, z, 4.45, 0.05, MARB, W2, A(GQ, { seg: 32 })); a.cyl(x, 0.05, z, 4.45, 0.03, GOLD, GT, A(GG, { seg: 32, ri: 4.15 }));                   // the orchestra
      for (let i = 0; i < 4; i++) a.cyl(x, 0, z, 4.5 + 1.05 * (i + 1), 0.45 * (i + 1), MARB, i % 2 ? W2 : W1, A(GQ, { seg: 40, arc: 180, a0: 0, ri: 4.5 + 1.05 * i }));   // the cavea
      a.cyl(x, 0, z, 9.0, 2.4, MARB, W2, A(GQ, { seg: 40, arc: 180, a0: 0, ri: 8.7 }));                                                                  // …its back wall
      a.box(x, 0, Z(6), 4 * C - 0.2, 0.5, 2.6, MARB, W2, GQ); a.box(x, 0.5, Z(6) - 0.9, 4 * C - 0.4, 3.4, 0.6, MARB, W1, GQ);                              // the stage and the wall behind it
      for (let i = 0; i < 5; i++) col(a, x - 6.2 + i * 3.1, Z(6) - 0.2, 3.4, 0.32, 0.5);
      a.box(x, 3.9, Z(6) - 0.55, 4 * C, 0.5, 1.5, MARB, W1, A(GQ, { under: true })); a.box(x, 4.05, Z(6) - 0.55, 4 * C + 0.08, 0.2, 1.58, GOLD, GT, A(GG, { top: false }));
      for (const s of [-1, 1]) flame(a, x + s * 6.6, 4.4, Z(6) - 0.55, 1.3); for (let i = 0; i < 5; i++) { const t = (20 + i * 35) * Math.PI / 180; flame(a, x + Math.cos(t) * 8.85, 2.4, z + Math.sin(t) * 8.85, 1.1); } });
  for (let lx = 3; lx <= 6; lx++) { block('P11-02', lx, 6); block('P11-02', lx, 9); block('P11-02', lx, 10); } for (const [lx, ly] of [[2, 8], [7, 8], [2, 9], [7, 9]]) block('P11-02', lx, ly);
  put('P11-02', 'lectern', 4, 7, { face: 0 }); dec('P11-02', 'lyre', 3, 7); dec('P11-02', 'instrument_drum', 6, 7); native('P11-02', 'chosen one', 5, 8, 180);
  /* ── THE TERRACES (P12-02): vine rows on posts between low stone walls, a fountain ── */
  for (const ly of [6, 8]) for (const lx of [1, 2, 3, 5, 6, 7]) put('P12-02', 'grape_trellis', lx, ly, {});   // the wish list's trellis, one a square (the model pass: the leaf sheet on posts is gone)
  put('P12-02', 'fountain', 4, 5); dec('P12-02', 'greek_amphora', 2, 5); dec('P12-02', 'stone_urn', 6, 5); native('P12-02', 'orb of light', 3, 7, 200);
  /* ── THE OLIVE GROVE, THE PILGRIM STAIR, THE GOAT TRACK ── */
  [[3, 4, 0], [6, 5, 70], [4, 6, 200], [7, 7, 120], [3, 8, 300], [5, 8, 40], [7, 5, 250]].forEach(d => put('P10-03', 'olive_tree', d[0], d[1], { face: d[2] }));   // the wish list's olive tree (was the stand-in `tree_2`) dec('P10-03', 'stone_urn', 5, 5);
  put('P11-03', 'lion_statue', 3, 6, { face: 180 }); put('P11-03', 'lion_statue', 6, 6, { face: 180 }); bowl('P11-03', 2, 8); dec('P12-03', 'cave_stone', 6, 5);
  /* ══ PASS 3, THE DRESSING (the model list's pieces: owl, busts, amphorae, arms, instruments, sheep, eagle, butterflies, clouds; more of the gods' own units) ══ */
  /* the thrones: each god's things beside a seat, clouds drifting over the dais's rim */
  put('P10-00', 'owl_statue', 4, 6, { h: 1.4, face: 20 }); dec('P10-00', 'spear', 7, 5, { y: 0.02 }); dec('P10-00', 'spell_shield', 8, 5); dec('P10-00', 'lyre', 3, 5); dec('P10-00', 'laurel_wreath', 5, 5, { y: 0.02 }); put('P10-00', 'peacock', 6, 6, { face: 300 }); put('P10-00', 'greek_couch', 9, 6, { face: 315 }); dec('P10-00', 'greek_amphora', 4, 3); dec('P10-00', 'greek_amphora', 6, 5);
  dec('P10-00', 'brass_orrery', 6, 3); dec('P10-00', 'item_drinking_cup', 5, 5); dec('P10-00', 'giant_hourglass', 4, 1); dec('P10-00', 'eagle', 5, 6);
  for (const [lx, ly, sp] of [[10, 3, 6], [3, 4, 5], [9, 7, 7], [5, 0, 5]]) dec('P10-00', 'white_cloud', lx, ly, { span: sp, y: 0.4 });
  native('P10-00', 'valkraye', 9, 4, 270);
  /* the Temple's court: lions by the steps, braziers on plinths, urns */
  for (const lx of [3, 8]) plinthAt('P11-00', lx, 9, 1.3, 0.8);
  bowl('P11-00', 3, 9, 0.8); bowl('P11-00', 8, 9, 0.8); put('P11-00', 'lion_statue', 4, 8, { face: 180 }); put('P11-00', 'lion_statue', 7, 8, { face: 180 });
  dec('P11-00', 'stone_urn', 2, 10); dec('P11-00', 'stone_urn', 9, 10); dec('P11-00', 'greek_amphora', 1, 9); dec('P11-00', 'white_cloud', 1, 5, { span: 6, y: 0.5 });
  /* the Stadium: prize amphorae, arms, a shield and spears by the seats */
  dec('P10-01', 'greek_amphora', 2, 4); dec('P10-01', 'greek_amphora', 2, 6); dec('P10-01', 'arms_trophy', 7, 1, { y: 0.9 }); dec('P10-01', 'spear', 1, 1); dec('P10-01', 'spear', 11, 8); dec('P10-01', 'spell_shield', 11, 1); dec('P10-01', 'spell_shield', 5, 8);
  dec('P10-01', 'instrument_drum', 1, 8); dec('P10-01', 'meshy_trumpet', 2, 8, { y: 0.3 }); native('P10-01', 'giant', 10, 4, 270); put('P10-01', 'chariot', 3, 8, { face: 90 }); put('P10-01', 'discus_rack', 11, 3, { face: 270 }); put('P10-01', 'discus_rack', 2, 2, { face: 90 });
  /* the Colonnade: busts on plinths, benches, pots, an orrery */
  for (const [lx, ly] of [[4, 4], [8, 4], [4, 8], [8, 8]]) plinthAt('P11-01', lx, ly, 1.2, 0.95); plinthAt('P11-01', 5, 8, 1.0, 0.8);
  for (const [lx, ly, f] of [[4, 4, 90], [8, 4, 270], [4, 8, 90], [8, 8, 270]]) put('P11-01', 'marble_bust', lx, ly, { y: 0.95, face: f }); put('P11-01', 'brass_orrery', 5, 8, { y: 0.8 });
  put('P11-01', 'greek_couch', 5, 4, { face: 0 }); put('P11-01', 'greek_couch', 7, 8, { face: 180 }); dec('P11-01', 'lyre', 6, 4); dec('P11-01', 'potted_plant', 5, 3); dec('P11-01', 'potted_plant', 8, 7); dec('P11-01', 'potted_plant', 4, 7); dec('P11-01', 'stone_urn', 7, 3);
  dec('P11-01', 'butterfly', 5, 7, { y: 0.9 }); dec('P11-01', 'monarch', 7, 4);
  /* the Sacred Way */
  dec('P10-02', 'greek_amphora', 4, 6); dec('P10-02', 'stone_urn', 2, 5); native('P10-02', 'nephilim', 10, 4, 270);
  /* the Amphitheatre: fire at the stage's ends, the players' things on the floor */
  bowl('P11-02', 2, 6); bowl('P11-02', 7, 6); dec('P11-02', 'instrument_tambourine_up', 5, 7, { y: 0.1 }); dec('P11-02', 'meshy_trumpet', 3, 8, { y: 0.1 }); dec('P11-02', 'instrument_whistle', 6, 8); dec('P11-02', 'greek_amphora', 1, 7); dec('P11-02', 'greek_amphora', 0, 8);
  /* the Terraces: the harvest (amphorae, crates, a well), butterflies and bees on the vines */
  put('P12-02', 'ancient_well', 4, 9); for (const [lx, ly] of [[2, 7], [6, 7], [5, 9]]) dec('P12-02', 'greek_amphora', lx, ly); dec('P12-02', 'psx_wooden_crate_2', 3, 9); dec('P12-02', 'psx_wooden_crate_1', 7, 7); put('P12-02', 'greek_couch', 3, 5, { face: 90 }); put('P12-02', 'wooden_barrel', 2, 9); put('P12-02', 'wooden_barrel', 6, 9); dec('P12-02', 'woven_baskets', 6, 7); put('P12-02', 'sundial', 4, 4); put('P12-02', 'cypress_tree', 3, 10); put('P12-02', 'cypress_tree', 5, 10); dec('P12-02', 'wild_flowers', 2, 5); dec('P12-02', 'wild_flowers', 6, 5);
  for (const [k, lx, ly] of [['butterfly', 2, 7], ['monarch', 5, 7], ['bee', 5, 9], ['bee', 4, 7], ['butterfly', 5, 4]]) dec('P12-02', k, lx, ly, { y: 0.9 }); dec('P12-02', 'psx_planter_pot_mp_1_full', 5, 5, { h: 0.6 }); dec('P12-02', 'psx_planter_pot_mp_1_full', 3, 4, { h: 0.6 });
  /* the Olive Grove: a flock, oil jars, a bench, a unicorn (a `forest` + `divine` unit) */
  for (const [lx, ly] of [[5, 4], [6, 6], [4, 7], [7, 6]]) dec('P10-03', 'decor_sheep', lx, ly); dec('P10-03', 'rabbit', 5, 7); dec('P10-03', 'greek_amphora', 4, 5); dec('P10-03', 'greek_amphora', 6, 8); dec('P10-03', 'psx_wooden_crate_3', 6, 4); put('P10-03', 'greek_couch', 5, 6, { face: 20 }); put('P10-03', 'beehive', 3, 5); put('P10-03', 'goat', 8, 5, { face: 200 }); dec('P10-03', 'wild_flowers', 4, 4); dec('P10-03', 'wild_flowers', 6, 7); dec('P10-03', 'wild_flowers', 5, 9);
  dec('P10-03', 'butterfly', 4, 4, { y: 0.8 }); dec('P10-03', 'bee', 6, 7, { y: 0.8 }); native('P10-03', 'unicorn', 4, 8, 40);
  /* the Pilgrim Stair: a shrine for those who come up from the Vatican (an altar, candles, a censer, a bench) */
  put('P11-03', 'stone_altar', 2, 7, { face: 90 }); put('P11-03', 'votive_stand', 6, 8, { face: 270 }); for (const [lx, ly] of [[2, 6], [5, 8], [1, 7], [6, 7]]) dec('P11-03', 'lit_candle', lx, ly); dec('P11-03', 'oil_lamp', 3, 8); dec('P11-03', 'item_censer', 3, 7); dec('P11-03', 'iron_garden_bench', 5, 5); dec('P11-03', 'stone_urn', 4, 5);
  /* the Goat Track: a spyglass over the cliff, a boundary stone, a small flock, an eagle on the wind */
  put('P12-03', 'brass_telescope', 8, 5, { face: 90 }); put('P12-03', 'menhir', 6, 2); [[7, 3, 100], [6, 4, 220], [8, 4, 30]].forEach(d => put('P12-03', 'mountain_goat', d[0], d[1], { face: d[2] })); put('P12-03', 'cypress_tree', 9, 3); dec('P12-03', 'psxg_rock_2', 7, 6, { h: 0.9 }); dec('P12-03', 'psxg_rock_3', 5, 3, { h: 0.7 }); dec('P12-03', 'eagle', 7, 4); native('P12-03', 'occulus', 6, 5, 200);
  /* the Cloud Line and the Grand Stair's foot: cloud on the walk (nothing that blocks: the ways are the tool's) */
  for (const [id, lx, ly, sp] of [['P12-01', 7, 2, 6], ['P12-01', 7, 8, 7], ['P12-01', 3, 5, 6], ['P12-01', 5, 6, 5], ['P12-01', 7, 5, 8], ['P12-00', 7, 9, 6], ['P12-00', 8, 5, 7], ['P12-00', 2, 6, 5]]) dec(id, 'white_cloud', lx, ly, { span: sp, y: 0.5 });
  native('P12-01', 'watcher', 1, 5, 90);
  { const q = S('P11-02', 8, 4); R.anchor('bayOlympus', { x: mx(q[0]), z: mz(q[1]), face: 270 }); R.taken.add(q[0] + ':' + q[1]); }   // the Diplomatic bay's door stands at the Amphitheatre
};
