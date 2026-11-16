/* THE DESERT · GIZA (district G, 16 plots) — the district file of `node bake-desert.js` (repo tooling, never uploaded).
   One thread = this one file. The tool, layout.json, the Highway and every shared piece belong to the tool's row on the board (docs/notes/claims.md).

   THE PLOTS (ids + names: docs/areas/desert/layout.json; a plot is 12 x 12 squares of 3.5 m):
     P08-08  The Causeway                   home squares x 48..60 · y 48..60
     P09-08  The Sphinx                     home squares x 60..72 · y 48..60
     P10-08  The Dig                        home squares x 72..84 · y 48..60
     P11-08  The Canyon Mouth               home squares x 84..96 · y 48..60
     P08-09  The Obelisks                   home squares x 48..60 · y 60..72
     P09-09  Menkaure                       home squares x 60..72 · y 60..72
     P10-09  Khafre                         home squares x 72..84 · y 60..72
     P11-09  The Robbers' Tunnel            home squares x 84..96 · y 60..72
     P08-10  The Oasis                      home squares x 48..60 · y 72..84
     P09-10  The Tomb Door                  home squares x 60..72 · y 72..84
     P10-10  The Great Pyramid, north-west  home squares x 72..84 · y 72..84
     P11-10  The Great Pyramid, north-east  home squares x 84..96 · y 72..84
     P08-11  The Sand Sea                   home squares x 48..60 · y 84..96
     P09-11  The Sand Sea, east             home squares x 60..72 · y 84..96
     P10-11  The Great Pyramid, south-west  home squares x 72..84 · y 84..96
     P11-11  The Great Pyramid, south-east  home squares x 84..96 · y 84..96

   WHAT STANDS HERE TODAY (PASS 1, the exteriors, 2026-11-16; mondo on the stepped first build: "way too short ... you didn't even get the shape right"):
   - THE GREAT PYRAMID (P10-10, P11-10, P10-11, P11-11): a TRUE pyramid, 77 m at the foot, 49 m to the tip of its gold capstone (the better gold),
     faces at the real 51.8 degrees, built course by course (`pyramid()`). Not climbed. Its doors stand in stone mouths at its foot (`mouth()`):
     `pyramid` (north face, under the leaning stones), `tombside` and the hidden `cut` (west face); Room 444's bay door (the Tomb Door, data.js
     siteRooms.entry.prebuilt_giza) is in the west face too.
   - KHAFRE (P10-09): 42 m at the foot, 26.7 m, its top third in smooth white casing. MENKAURE (P09-09): 24.5 m, 15.6 m, its lowest courses red granite.
     THE QUEENS' PYRAMIDS: three of 7 m south of Menkaure. None is climbed (a ring of unseen walls at each foot).
   - THE SPHINX (P09-08): the model `sphinx`, facing east on a stone floor, two pharaohs before it.
   - THE OBELISKS (P08-09). THE CAUSEWAY (P08-08): the way in from the Giza Road at the Highway's end (the road is the tool's).
   - THE DIG (P10-08): two trenches a metre down, a camp, a sarcophagus. THE OASIS (P08-10): a pool, six palms.
   - THE SAND SEA (P08-11, P09-11): a half-buried sarcophagus, skulls, stones. THE ROBBERS' TUNNEL (P11-09): link `gobekli_giza` on the east wall.
   - THE INSIDE is this file's too (rooms(kit) below): INSIDE THE GREAT PYRAMID (14 x 14 squares, three levels, the door to the Turning Tomb).
   - People (lines read from the old `site_prebuilt_giza_plateau` literal, which must stay): anubis, annunaki, skeleton, conspiracy theorist, mummy, djinn.

   THE MODEL PASS (11-16, after the five passes, on mondo's word): the wish-list models are placed and their stand-ins are out. `sphinx` (the model,
   20 m, in place of the parts-built one), `pharaoh_statue`, `jackal_statue`, `cat_statue`, `casing_block` (for the rubble stones), `canopic_jars`,
   `papyrus_column` (the causeway), `fallen_column`, `golden_idol`, `market_stall`, `woven_baskets`, `camel` (for the horses), `vulture`, `cobra`,
   `scorpion`, `reeds` (for the seaweed), `wheelbarrow`, `pickaxe`, `sieve_table`, `wooden_ladder`, `wooden_barrel`, `canvas_tent` (for the nylon
   tents), `oil_lamp`, also `tripod_bowl`, `hand_cart`, `hookah`, `kettle`, `cairn`, `rope_coils`, `backpack`, `cattle_skull`.
   STILL NEEDS A MODEL: a hieroglyph / carved-relief wall sheet (a texture, not a model), papyrus plants, a gold pile (neither was made).

   KNOWN MISSING OR WRONG:
   - PASS 3 (dressing, 11-16): the Dig has an earth ramp into each trench, rope posts, planks, a finds table, a wagon; the causeway has a stone
     kerb and a small pillared hall; the oasis has eleven palms, a well, reeds, a boat, flamingos, the cloth tent; braziers line the path to the
     Tomb Door; rubble lies at the pyramids' feet; the Sand Sea half covers a giant foot, a boat, bones; seven more natives.
   - PASS 4 (atmosphere, 11-16): `airZones()` (dust on the Sand Sea, round the pyramids and on the causeway; embers on the Tomb Door path; fireflies
     over the oasis), a lit torch core on every door jamb and hall post, the capstone glows; seen at dusk and at night.
   - PASS 5 (polish, 11-16): the Robbers' Tunnel's link door has a rock mouth round it (`des:giza:tunnel`); two name boards (THE DIG, THE OASIS).
     FIVE PASSES + THE MODEL PASS ARE LIVE: THIS FILE IS STOPPED UNTIL MONDO HAS LOOKED (docs/plans/DISTRICT_THREAD_BRIEF.md).
   - THE CANYON MOUTH (P11-08) opens on sand: the canyon to Western Town was cut by the move.
   - The pyramids are not climbed any more (the first build's walked tiers and stairs went with the true shape). No temple, no causeway paving beyond
     the layout's stone squares.
   - The room's scatter (the tool's: stones, snags) can land beside a pyramid's foot; the east and south edges show pine mountains (the tool's edges).
   - The pyramid's inside (PASS 2, 11-16): the Turning Tomb door is WALKED (in, and back out to the King's Chamber). The King's Chamber has its north
     wall, a granite lining under gold bands, treasure; torches in every passage. Still bare: the walls carry no carving (no hieroglyph sheet
     exists), the floor sheet is grey. The first views of a probe run in there come out black.
   - Rows outside this file that must agree with it: `links.gobekli_giza.b`, `siteRooms.entry.prebuilt_giza` (the tool prints their places as "ends").
   - Fights use the old plateau's table everywhere (data.js HQ_AREA_ENCOUNTERS). The doors' frames are the engine's grey frame with a green lamp.
   - STONE: `bricks_1` under an arch part needs `gain` 2.7 to read as pale limestone in the sun (1.9 and under draws mud brown).

   THE HOOKS (bake-desert.js "THE DISTRICT FILES" has the whole list of what ctx holds; each hook is optional):
     buildings(ctx)  the walk-in / shut buildings: building(id, [sx0, sy0, sx1, sy1, side], h, opts, parts) -> a handle (at, face, cx, cz)
     furnish(ctx)    what stands inside them: put(handle, key, lx, lz, opts), in the building's own frame
     ground(ctx)     everything on the open ground: P / Pm / dec (props), feat (terrain rows), pen, native (people), line (flat paint),
                     setPaint(sx, sy, sheet) (one of the room's seven ground sheets on a square of this block)
     pieces(ctx)     late pieces, after every district's ground
     doors(ctx)      the doors to other rooms (doors.push)
     dice            this file's own dice (ctx.rnd / ctx.dec): another district's change never re-throws them
     rooms(kit)      the rooms behind this district's doors, for bake-desert-insides.js (its kit: mk, the sheets)
   THE FRAME: this file is written in the FIRST BUILD's squares (sx 0..96 west to east, sy 0..96 north to south; gx = a square's west / north
   line in metres, gc = its middle). The tool moves every row this file makes to where the block stands in the 144-square room:
   room square = home square + (48, 48). Keep to your own block; the tool warns about a row outside it.
   REBAKE: node bake-desert.js && node bake-desert-insides.js   (--dry-run prints the counts). Rules: docs/notes/areas-complexes.md "THE DESERT, THE DISTRICT FILES". */
'use strict';
let C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, put, SOLID, P, Pm, dec, native, rnd, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS;
const bind = ctx => ({ C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, put, SOLID, P, Pm, dec, native, rnd, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS } = ctx);
exports.dice = 623573185;
const SPHINX_FACE = 90;   // the model lies along its own z; this turn points its head east (seen in the probe)

exports.ground = ctx => { bind(ctx);
    /* PASS 1, THE EXTERIORS (2026-11-16; mondo the same day on the stepped first build: "way too short ... you didn't even get the shape right").
       Every pyramid is a TRUE pyramid: four straight faces at the real slope (51.8 degrees, rise 1.272 to 1), built course by course, each
       course a `bricks_1` box 1.225 m high set 0.96 m in from the one under it. Nobody climbs one: a ring of unseen walls stands at its foot.
       One `arch` row a monument (des:giza:<name>), so each is culled by itself. */
    const LIME = 0xfff0cc, LIME2 = 0xf6e2b6, GRAN = 0xc88466, DARK = 0x4a3c2c, GAIN = 2.7, SLOPE = 1.272, CH = 1.225, PYR = [];
    /* a ring of thin unseen walls round a drawn mass (a thick `wall` row has round ends: it blocks past its own corners) */
    const ring = (x0, z0, x1, z1, h) => [[x0, z0, x1, z0], [x1, z0, x1, z1], [x1, z1, x0, z1], [x0, z1, x0, z0]].forEach(q => feat({ k: 'wall', x0: r2(q[0]), z0: r2(q[1]), x1: r2(q[2]), z1: r2(q[3]), h, t: 0.3, key: 'bricks_1', ghost: true, rail: false }));
    /* pyramid(name, cx, cz, foot, o): o.top = the height the courses stop at (what stands on them is the caller's), o.tint(i, y) = a course's
       stone. Returns { parts, y, w } = the row's parts list, the height and the width the courses stopped at. */
    function pyramid(name, cx, cz, foot, o) { o = o || {}; const parts = [], apex = foot / 2 * SLOPE, top = o.top != null ? o.top : apex - 1.5; let y = 0, w = foot, i = 0;
        for (; y + CH <= top + 0.01; i++, y = r2(i * CH)) { w = r2(foot - 2 * y / SLOPE); parts.push({ s: 'box', p: [0, y, 0], size: [w, CH + 0.02, w], key: 'bricks_1', tint: o.tint ? o.tint(i, y) : (i % 2 ? LIME2 : LIME), gain: GAIN, uv: [4.9, 4.9] }); }
        feat({ k: 'arch', id: 'des:giza:' + name, x: cx, z: cz, y: 0, parts });
        ring(cx - foot / 2 + 0.2, cz - foot / 2 + 0.2, cx + foot / 2 - 0.2, cz + foot / 2 - 0.2, 4);
        const q = Math.round(foot / C / 2); setRect(Math.round((cx + 168) / C) - q, Math.round((cz + 168) / C) - q, Math.round((cx + 168) / C) + q, Math.round((cz + 168) / C) + q, 'B');
        return { parts, y, w: r2(foot - 2 * y / SLOPE) }; }
    /* a way in at a pyramid's foot (the face leans back, so a door needs its own upright stones): two jambs, a lintel, the dark behind them.
       (lx, lz) = the mouth's middle on the foot line in the row's frame, dir = 'n' (it looks north) or 'w' (west) */
    function mouth(parts, lx, lz, dir, w, h, chevron) { const n = dir === 'n', B = (ax, y, dp, sw, sh, sd, tint, x) => parts.push(Object.assign({ s: 'box', p: n ? [r2(lx + ax), y, r2(lz + dp)] : [r2(lx + dp), y, r2(lz + ax)], size: n ? [sw, sh, sd] : [sd, sh, sw], key: 'bricks_1', tint, gain: GAIN, uv: [1.75, 1.75] }, x || {}));
        const deep = r2(h / SLOPE + 1.2);
        B(0, 0, r2(deep / 2 - 0.1), w, h, deep, undefined, { key: undefined, uv: undefined, gain: 1, tint: 0x0a0806 });                             // the dark
        B(-(w / 2 + 0.45), 0, r2(deep / 2 - 0.3), 0.9, h, deep, GRAN); B(w / 2 + 0.45, 0, r2(deep / 2 - 0.3), 0.9, h, deep, GRAN);                 // the jambs
        B(0, h, r2(deep / 2 - 0.3), w + 1.8, 0.55, deep, LIME);                                                                                     // the lintel
        /* PASS 4: a torch on each jamb (a bracket + a lit core; no lamp: the room's ten lights are spent) */
        for (const sd of [-1, 1]) { B(sd * (w / 2 + 0.45), 1.75, -0.2, 0.12, 0.5, 0.12, DARK, { key: undefined, uv: undefined, gain: 1 }); B(sd * (w / 2 + 0.45), 2.25, -0.2, 0.2, 0.32, 0.2, 0xffb040, { key: undefined, uv: undefined, gain: 1, glow: 1 }); }
        if (chevron) { const G = (sw, sh, dp, tint) => parts.push({ s: 'roof', form: 'gable', ry: n ? 90 : 0, p: n ? [lx, h + 0.55, r2(lz + dp)] : [r2(lx + dp), h + 0.55, lz], size: [1.4, sh, sw], key: 'bricks_1', tint, gain: GAIN, uv: [1.75, 1.75] });
            G(w + 1.8, 1.7, 0.42, LIME2); G(w - 0.2, 1.05, 0.3, GRAN); } }
    /* THE GREAT PYRAMID on four plots: 77 m at the foot (22 squares), 49 m to the tip of its gold capstone. Its three doors and Room 444's
       bay door stand in stone mouths at its foot. */
    { const cx = gx(84), cz = gx(84), G = pyramid('great', cx, cz, 77, { top: 44.2 });
      G.parts.push({ s: 'roof', form: 'pyramid', p: [0, G.y, 0], size: [G.w, r2(G.w / 2 * SLOPE), G.w], key: 'gold', uv: 3.5, roof: true, glow: 0.45 });                // the capstone, in the better gold
      mouth(G.parts, gc(87) - cx, -38.5, 'n', 2.6, 2.6, true);                                                                                    // the door `pyramid`
      mouth(G.parts, -38.5, gx(79) - cz, 'w', 3.4, 3.0, true);                                                                                    // Room 444's bay door (the Tomb Door)
      mouth(G.parts, -38.5, gc(81) - cz, 'w', 1.5, 2.3, false);                                                                                   // the door `tombside`, the turning stone
      G.parts.push({ s: 'box', p: [-38.2, 0, gc(75) - cz], size: [1.6, 1.5, 1.7], tint: 0x0a0806 });                                              // the Robbers' Cut: a rough hole (the door `cut`)
      P('brazier', 85, 70, {}); P('brazier', 89, 70, {}); P('obelisk', 84, 72, { h: 5 }); P('obelisk', 90, 72, { h: 5 }); }
    /* KHAFRE: 42 m at the foot (12 squares), 26.7 m, the top third still in its smooth white casing */
    { const cx = gx(78), cz = gx(65), K = pyramid('khafre', cx, cz, 42, { top: 17.2 });
      K.parts.push({ s: 'box', p: [0, K.y, 0], size: [r2(K.w + 0.5), 0.5, r2(K.w + 0.5)], key: 'bricks_1', tint: LIME2, gain: GAIN, uv: [4.9, 4.9] },
                   { s: 'roof', form: 'pyramid', p: [0, r2(K.y + 0.5), 0], size: [r2(K.w + 0.3), r2((K.w + 0.3) / 2 * SLOPE), r2(K.w + 0.3)], key: PLAS, tint: 0xfffaf0, gain: 2.2, uv: 3.5, roof: true }); }
    /* MENKAURE: 24.5 m at the foot (7 squares), 15.6 m, its lowest courses in red granite */
    { const cx = gx(65.5), cz = gx(64.5); pyramid('menkaure', cx, cz, 24.5, { top: 15.6, tint: (i, y) => y < 4.5 ? GRAN : (i % 2 ? LIME2 : LIME) });
      for (let j = 61; j < 68; j++) for (let i = 62; i < 69; i++) ctx.setPaint(i, j, 'bricks_1'); }
    /* THE QUEENS' PYRAMIDS: three small ones in a row south of Menkaure, 7 m at the foot */
    for (const qx of [62, 65, 68]) { pyramid('queen' + qx, gx(qx), gx(70), 7, { top: 4.45, tint: i => i % 2 ? LIME : LIME2 });
        for (let j = 69; j <= 70; j++) for (let i = qx - 1; i <= qx; i++) ctx.setPaint(i, j, 'bricks_1'); }
    /* THE SPHINX, facing east (THE MODEL PASS, 11-16: the model `sphinx`, 20 m long and 10 m high, in place of the one built from parts, which
       was a placeholder). It lies on a stone floor of six squares by three (x 63..69, y 50..53), two pharaohs before it. */
    { const ox = gx(66), oz = gc(51);
      PYR.push({ s: 'box', p: [ox, 0, oz], size: [24.5, 0.12, 10.5], key: 'bricks_1', tint: LIME2, gain: GAIN, uv: [3.5, 3.5] });
      Pm('sphinx', ox, oz, { face: SPHINX_FACE });
      ring(gx(63) + 0.2, gx(50) + 0.2, gx(69) - 0.2, gx(53) - 0.2, 5);
      setRect(62, 50, 70, 53, 'B'); for (let j = 50; j < 53; j++) for (let i = 62; i < 70; i++) ctx.setPaint(i, j, 'bricks_1');
      P('pharaoh_statue', 71, 49, { face: 90 }); P('pharaoh_statue', 71, 53, { face: 90 }); P('brazier', 72, 49, {}); P('brazier', 72, 53, {}); }
    feat({ k: 'arch', id: 'des:giza:look', x: 0, z: 0, parts: PYR });
    [[50, 62], [57, 62], [50, 69], [57, 69]].forEach(q => P('obelisk', q[0], q[1], {})); P('brazier', 52, 65, {}); P('brazier', 55, 65, {}); P('signpost', 54, 55, { face: 90 });
    /* THE DIG: two trenches a level down, the camp */
    feat({ k: 'plateau', x: gx(76.5), z: gc(50), w: 17.5, d: 3.5, h: -1, sink: true, edge: 0.3 }); feat({ k: 'plateau', x: gx(78.5), z: gc(56), w: 17.5, d: 3.5, h: -1, sink: true, edge: 0.3 });
    P('campfire', 80, 53, {}); Pm('canvas_tent', gc(82), gc(52), { face: 240 }); Pm('canvas_tent', gc(82), gc(55), { face: 280 }); dec('cardboard_boxes', 78, 53); dec('cardboard_boxes', 77, 58); P('sarcophagus', 80, 58, { face: 60 }); dec('paper_sheet', 79, 54, { y: 0.01 });
    dec('psx_wooden_crate_2', 75, 52); P('trap_sarcophagus_box', 78, 56, { y: -1, face: 90 });
    /* THE OASIS */
    feat({ k: 'pool', x: gx(53.5), z: gx(78.5), r: 8.5, rz: 7.5, y: -0.25, depth: 1.0, key: 'water', bank: 1.6 });
    [[50, 76, 4.6], [56, 77, 5.0], [51, 81, 4.4], [55, 81, 4.8], [53, 75, 5.2], [58, 80, 4.2]].forEach(q => feat({ k: 'tree', x: gc(q[0]), z: gc(q[1]), kind: 'palm', h: q[2], r: 1.3 }));
    dec('sea_chest', 57, 82);
    /* THE SAND SEA, the Robbers' Tunnel, the Tomb Door */
    P('sarcophagus', 54, 89, { face: 20, y: -0.3 }); dec('skull_pile', 62, 90); dec('skull', 50, 91); P('cave_stone', 66, 88, {}); P('cave_stone', 58, 92, {});
    dec('skull_pile', 92, 66); dec('paper_sheet', 91, 68, { y: 0.01 }); P('brazier', 71, 77, {}); P('brazier', 71, 80, {}); P('signpost', 70, 82, { face: 270 });
    /* ════ PASS 3, THE DRESSING (2026-11-16): every plot gets a reason to be there. New lights are all `noLight` (the room has ten). ════ */
    const NL = { noLight: true };
    /* THE DIG: an earth ramp into each trench (they were a 1 m step down), rope posts round them, planks across, the finds table */
    feat({ k: 'ramp', x0: gx(75), z0: gc(50), x1: gx(73), z1: gc(50), w: 3.5, h0: -1, h1: 0, edge: 0.3, key: 'dirt_2' });
    feat({ k: 'ramp', x0: gx(80), z0: gc(56), x1: gx(82), z1: gc(56), w: 3.5, h0: -1, h1: 0, edge: 0.3, key: 'dirt_2' });
    for (let i = 74; i <= 79; i += 1.25) { Pm('rope_stanchion', gx(i), gx(50) - 0.5, {}); Pm('rope_stanchion', gx(i), gx(51) + 0.5, {}); Pm('rope_stanchion', gx(i + 2), gx(56) - 0.5, {}); Pm('rope_stanchion', gx(i + 2), gx(57) + 0.5, {}); }
    Pm('footbridge', gx(77), gc(50), { face: 90, y: 0.05 }); Pm('footbridge', gx(78), gc(56), { face: 90, y: 0.05 });
    P('map_table', 79, 53, { face: 30 }); dec('folding_chair', 78, 54); dec('folding_chair', 80, 54); P('film_camera', 75, 54, { face: 60 });
    dec('greek_amphora', 79, 52); dec('greek_amphora', 76, 53); dec('psx_wooden_crate_1', 77, 54); dec('psx_wooden_crate_3', 82, 57); dec('psx_wooden_crate_6', 74, 57); dec('hw_shovel', 76, 51); dec('hw_shovel', 79, 57);
    dec('wooden_bucket', 77, 51); dec('wooden_bucket', 81, 55); dec('meshy_rope', 80, 51); dec('meshy_burlap_sack', 83, 53); dec('meshy_burlap_sack', 83, 54); dec('railway_lantern', 78, 55, NL); dec('skull', 77, 50, { y: -1 }); dec('femur', 79, 56, { y: -1 });
    dec('greek_amphora', 75, 50, { y: -1 }); P('covered_wagon', 74, 59, { face: 90 }); P('camel', 77, 59, { face: 270 }); dec('cot', 83, 51); dec('field_radio', 82, 54);
    /* THE CANYON MOUTH + THE ROBBERS' TUNNEL: rock fall at the canyon's foot, the robbers' leavings by the tunnel */
    [[88, 56, 'hw_stone_2'], [92, 57, 'hw_stone_4'], [89, 58, 'psxg_rock_3'], [93, 55, 'hw_stone'], [86, 57, 'psxg_rock_1'], [91, 59, 'hw_stone_5'], [87, 59, 'psxg_dead_bush_1'], [94, 58, 'psxg_dead_bush_2'], [85, 55, 'psxg_dead_bush_2']].forEach(q => dec(q[2], q[0], q[1]));
    dec('crow', 88, 57, { y: 0.9 }); dec('crow', 92, 58); P('signpost', 89, 59, { face: 0 });
    dec('psx_wooden_crate_2', 93, 67); dec('psx_wooden_crate_3', 93, 68); dec('meshy_rope', 92, 69); dec('hw_shovel', 90, 68); dec('money_sacks', 94, 67); dec('meshy_burlap_sack', 94, 70); dec('railway_lantern', 92, 67, NL); dec('wooden_bucket', 90, 70);
    dec('psx_gold_bar_pcs_1', 93, 70); dec('greek_amphora', 89, 66); dec('hw_stone_3', 88, 64); dec('psxg_rock_2', 86, 62); dec('psxg_dead_bush_1', 87, 68);
    /* THE CAUSEWAY: a low stone kerb either side of the paving, and a small pillared hall beside it in sight of the Sphinx (granite posts and
       lintels, the valley temple's way of building: six posts on whole squares, beams over them, a paved floor) */
    { const K = []; for (const x of [gx(53) - 0.3, gx(55) + 0.3]) for (const q of [[48, 53], [55, 76]]) K.push({ s: 'box', p: [r2(x), 0, gx((q[0] + q[1]) / 2)], size: [0.55, 0.38, r2((q[1] - q[0]) * C)], key: 'bricks_1', tint: LIME2, gain: GAIN, uv: [1.75, 1.75] });
      feat({ k: 'arch', id: 'des:giza:kerb', x: 0, z: 0, y: 0, parts: K }); }
    { const T = [], B = (x, y, z, w, h, d, tint) => T.push({ s: 'box', p: [r2(x), y, r2(z)], size: [w, h, d], key: 'bricks_1', tint, gain: GAIN, uv: [1.75, 1.75] });
      for (const i of [56, 58]) for (const j of [49, 51]) { B(gc(i), 0, gc(j), 1.5, 4.4, 1.5, 0xb87a5c); ring(gc(i) - 0.8, gc(j) - 0.8, gc(i) + 0.8, gc(j) + 0.8, 4); setRect(i, j, i + 1, j + 1, 'B'); }
      for (const j of [49, 51]) B(gx(57.5), 4.4, gc(j), 10.2, 0.9, 1.7, 0xb87a5c); for (const i of [56, 58]) B(gc(i), 5.3, gx(50.5), 1.7, 0.6, 10.2, LIME);
      B(gx(57.5), 5.9, gx(50.5), 10.6, 0.35, 10.6, LIME2); B(gx(57.5), -0.02, gx(50.5), 11.2, 0.14, 11.2, LIME2);
      for (const i of [56, 58]) for (const j of [49, 51]) { T.push({ s: 'box', p: [gc(i), 3.2, r2(gc(j) + (j === 49 ? 0.82 : -0.82))], size: [0.14, 0.45, 0.14], tint: DARK }, { s: 'box', p: [gc(i), 3.65, r2(gc(j) + (j === 49 ? 0.82 : -0.82))], size: [0.2, 0.3, 0.2], tint: 0xffb040, glow: 1 }); }   // PASS 4: a torch on each post
      feat({ k: 'arch', id: 'des:giza:hall', x: 0, z: 0, y: 0, parts: T });
      for (let j = 49; j <= 51; j++) for (let i = 56; i <= 58; i++) ctx.setPaint(i, j, 'bricks_1');
      P('stone_altar', 57, 50, { face: 90 }); dec('item_censer', 57, 50, { y: 0.96 }); dec('greek_amphora', 57, 49); dec('greek_amphora', 57, 51); dec('cat', 58, 50); }
    /* THE SPHINX's forecourt and THE OBELISKS */
    dec('cat', 73, 51); dec('tomb_plaque', 73, 50); dec('hw_stone_2', 61, 49); dec('hw_stone_4', 68, 54, {}); dec('psxg_rock_4', 64, 48);
    dec('tomb_plaque', 51, 64); dec('tomb_plaque', 56, 67); dec('hw_stone', 49, 66); dec('hw_stone_3', 58, 64); dec('greek_amphora', 53, 63); dec('greek_amphora', 54, 68); P('stone_altar', 53, 66, { face: 0 }); dec('crow', 50, 62, { y: 7 });
    /* THE OASIS: more palms, the well, reeds at the bank, a boat pulled up, birds, a carpet camp and the old cloth tent */
    [[48, 78, 4.9], [59, 75, 4.5], [52, 83, 5.1], [57, 73, 4.3], [49, 74, 4.7]].forEach(q => feat({ k: 'tree', x: gc(q[0]), z: gc(q[1]), kind: 'palm', h: q[2], r: 1.3 }));
    P('ancient_well', 58, 77, {}); Pm('rowboat', gx(51), gx(82.3), { face: 30 }); for (const q of [[50.2, 77.2], [51.4, 80.6], [56.6, 80.4], [56.9, 76.6], [52.4, 75.3], [55.3, 82]]) Pm('reeds', gx(q[0]), gx(q[1]), { face: Math.round(rnd() * 360) });
    Pm('flamingo', gx(52.2), gx(76.4), { face: 120 }); Pm('flamingo', gx(55.6), gx(81), { face: 300 }); Pm('flamingo', gx(51.2), gx(79.6), { face: 60 }); Pm('meshy_frog', gx(56.4), gx(77.4), {});
    P('fortune_teller_tent', 58, 82, { face: 315 }); Pm('psx_carpet_mp_1', gx(56.5), gx(84.3), { face: 20, y: 0.02 }); Pm('rug_round', gx(59), gx(80.2), { y: 0.02 }); dec('greek_amphora', 59, 83); dec('wooden_bucket', 57, 78); dec('cauldron', 56, 83); Pm('meshy_campfire_ring', gx(57.2), gx(83.2), NL);
    P('camel', 49, 82, { face: 80 }); P('camel', 50, 84, { face: 140 }); P('hitching_rail', 49, 83, { face: 0 });
    /* THE TOMB DOOR: the path to it between braziers and plaques */
    for (const i of [62, 65, 68]) { P('brazier', i, 76, NL); P('brazier', i, 79, NL); } dec('tomb_plaque', 63, 76); dec('tomb_plaque', 67, 79); dec('cat', 66, 78); dec('greek_amphora', 70, 76); dec('hw_stone_2', 64, 81); dec('skull', 66, 82);
    /* rubble at the pyramids' feet (blocks that came down the faces) */
    [[72, 75], [71.6, 86], [72, 90], [78, 72], [92, 72], [95.4, 80], [95.4, 88], [71.5, 68], [71.5, 62], [80, 59], [84.4, 63], [84.4, 69], [61.5, 63], [69, 63], [64, 68], [60.5, 70], [66.6, 71.6], [75, 96.3], [88, 96.3]].forEach((q, i) => Pm(i % 4 === 3 ? 'hw_stone_' + (2 + i % 3) : 'casing_block', gx(q[0]), gx(q[1]), { face: Math.round(rnd() * 360) }));   // (THE MODEL PASS: `casing_block` in place of the stones that stood in for it)
    /* THE SAND SEA: what the dunes half cover */
    P('meshy_giant_foot', 60, 90, { face: 40 }); Pm('rowboat', gx(52), gx(93), { face: 70, y: -0.25 }); P('dinosaur_skeleton', 66, 92, { face: 200, y: -0.35 }); P('obelisk', 56, 87, { h: 3.2, face: 30 }); Pm('sea_chest', gx(63.4), gx(87.5), { face: 140, y: -0.3 });
    P('trap_coffin_wood', 50, 87, { face: 120, y: -0.15 }); dec('skull', 53, 90); dec('femur', 55, 90); dec('ulna', 61, 93); dec('skull_pile', 69, 94); dec('greek_amphora', 58, 89, { y: -0.3 }); dec('hw_stone_4', 64, 94); dec('psxg_dead_bush_1', 49, 94); dec('psxg_dead_bush_2', 67, 86); dec('psxg_dead_bush_1', 57, 95);
    dec('crow', 60, 91, { y: 2.3 }); dec('anatomy_skeleton', 62, 88, { y: -0.6 });
    /* more of the people who already live here (no new race, no new lines) */
    native('skeleton', 64, 90, 300); native('mummy', 67, 73, 180); native('anubis', 74, 50, 90); native('skeleton', 91, 63, 200); native('mummy', 52, 68, 0); native('anubis', 60, 78, 270); native('djinn', 54, 73, 180);
    /* ════ PASS 5, THE POLISH (2026-11-16) ════ */
    /* THE ROBBERS' TUNNEL: the link door stood as a bare slab on open sand at the east wall. A rock mouth round it: two piers and a cap of
       `rocks_5`, pit props and a beam inside them (the door itself is the link's and has not moved) */
    { const T = [], ex = gx(96), mz = gx(69), RK = (x, y, z, w, h, d, tint, o) => T.push(Object.assign({ s: 'box', p: [r2(x), y, r2(z)], size: [w, h, d], key: 'rocks_5', tint: tint == null ? 0xe8d0a8 : tint, gain: 1.7, uv: [3.5, 3.5] }, o || {}));
      for (const sd of [-1, 1]) { RK(ex - 2.0, 0, mz + sd * 3.3, 4.0, 4.3, 3.0); RK(ex - 2.6, 0, mz + sd * 5.6, 2.8, 2.6, 2.2, 0xdcc49c); RK(ex - 3.6, 0, mz + sd * 4.6, 1.6, 1.5, 1.8, 0xd4bc94);
          T.push({ s: 'box', p: [r2(ex - 3.7), 0, r2(mz + sd * 1.65)], size: [0.3, 3.0, 0.3], key: WD2, tint: 0xc8a070 }); ring(ex - 4.0, mz + sd * 3.3 - 1.5, ex - 0.1, mz + sd * 3.3 + 1.5, 4); }
      RK(ex - 2.0, 3.2, mz, 4.0, 2.2, 9.6, 0xe0c8a0); T.push({ s: 'dome', p: [r2(ex - 2.0), 5.4, mz], r: 2.0, h: 1.3, rz: 4.6, seg: 10, rings: 4, key: 'rocks_5', tint: 0xdcc49c, gain: 1.7, uv: 3.5 });
      T.push({ s: 'box', p: [r2(ex - 3.7), 3.0, mz], size: [0.34, 0.3, 3.9], key: WD2, tint: 0xc8a070 }, { s: 'box', p: [r2(ex - 3.55), 2.35, r2(mz + 1.5)], size: [0.16, 0.3, 0.16], tint: 0xffb040, glow: 1 });
      feat({ k: 'arch', id: 'des:giza:tunnel', x: 0, z: 0, y: 0, parts: T }); }
    /* two painted boards on posts, each written on both faces (the plots' own plain names) */
    { const A = ctx.sheet(), board = (words, x, z, ry) => { for (const sd of [-1, 1]) A.box(x + (ry % 180 ? 0 : sd * 1.1), 0, z + (ry % 180 ? sd * 1.1 : 0), 0.14, 2.4, 0.14, WD2, 0xb89060);
          A.sign(words, x, 1.55, z, 2.4, 0.75, '#3a2a18', '#e8d4a8', 'cinzel', { ry }); A.sign(words, x, 1.55, z, 2.4, 0.75, '#3a2a18', '#e8d4a8', 'cinzel', { ry: (ry + 180) % 360 }); };
      board('THE DIG', gx(73) - 0.6, gx(55) + 0.9, 90); board('THE OASIS', gx(56) + 0.4, gx(74) + 0.6, 0);
      feat({ k: 'arch', id: 'des:giza:boards', x: 0, z: 0, y: 0, parts: A.P }); }
    /* ════ THE MODEL PASS (2026-11-16, mondo: "these are models that were added ... use these ones"): the wish-list models, where this file's
       NEEDS A MODEL list said they were missing. Stand-ins went out as the real model came in (the Sphinx, the nylon tents, the horses, the
       seaweed, the rubble stones: above). ════ */
    /* the causeway: papyrus columns either side, outside the kerb (decor, off the squares' middles) */
    for (let j = 57; j <= 73; j += 4) { Pm('papyrus_column', gx(53) - 1.5, gc(j), {}); Pm('papyrus_column', gx(55) + 1.5, gc(j), {}); }
    /* guardians: jackals at the Great Pyramid's north mouth and at the Tomb Door, pharaohs on the path to it, cats here and there */
    P('jackal_statue', 86, 71, { face: 0 }); P('jackal_statue', 89, 71, { face: 0 }); P('jackal_statue', 71, 78, { face: 270 }); P('jackal_statue', 71, 79, { face: 270 });
    P('pharaoh_statue', 61, 76, { face: 270 }); P('pharaoh_statue', 61, 79, { face: 270 }); Pm('cat_statue', gx(57.5) + 1.1, gx(50.5) + 1.2, { face: 270 }); Pm('cat_statue', gx(69.6), gx(82.4), { face: 300 }); Pm('cat_statue', gx(52.3), gx(63.4), { face: 120 });
    Pm('golden_idol', gc(57), gc(50) - 0.5, { y: 0.96 }); P('tripod_bowl', 56, 50, NL); P('tripod_bowl', 58, 50, NL); dec('oil_lamp', 57, 51); dec('canopic_jars', 58, 51);
    /* the Dig: the tools the list asked for */
    Pm('sieve_table', gx(78.4), gx(52.4), { face: 20 }); Pm('wheelbarrow', gx(76.4), gx(52), { face: 250 }); Pm('wheelbarrow', gx(81.3), gx(57.6), { face: 100 }); Pm('pickaxe', gx(75.6), gx(51.3), { face: 40 }); Pm('pickaxe', gx(80.4), gx(55.7), { face: 200 });
    Pm('wooden_ladder', gx(77.5), gx(51) - 0.25, { y: -1, face: 0 }); Pm('wooden_ladder', gx(79.5), gx(56) + 0.25, { y: -1, face: 180 }); P('wooden_barrel', 83, 56, {}); Pm('wooden_barrel', gx(83.3), gx(57.4), {}); Pm('canopic_jars', gx(79.8), gx(52.7), {}); Pm('kettle', gx(80.9), gx(53.2), {});
    P('hand_cart', 75, 57, { face: 30 }); Pm('rope_coils', gx(79.4), gx(58.8), {}); Pm('backpack', gx(81.2), gx(51.7), { face: 90 }); Pm('oil_lamp', gx(78.9), gx(53.9), { y: 0.8 });
    /* the Canyon Mouth and the Robbers' Tunnel */
    P('vulture', 90, 56, { face: 200 }); P('cairn', 87, 58, {}); Pm('scorpion', gx(91.5), gx(58.4), {}); P('wooden_barrel', 94, 68, {}); Pm('pickaxe', gx(91.3), gx(69.6), { face: 80 }); Pm('rope_coils', gx(92.6), gx(70.4), {}); Pm('oil_lamp', gx(93.4), gx(69.2), {}); Pm('golden_idol', gx(93.6), gx(70.6), {});
    /* the Oasis: a market by the camp, reeds, a hookah at the tent */
    P('market_stall', 55, 85, { face: 0 }); P('market_stall', 59, 85, { face: 0 }); Pm('woven_baskets', gx(57.3), gx(85.6), {}); Pm('woven_baskets', gx(60.6), gx(83.4), { face: 70 }); Pm('hookah', gx(58.6), gx(84.2), {}); Pm('oil_lamp', gx(56.8), gx(84.6), {}); Pm('wooden_barrel', gx(54.3), gx(84.5), {});
    Pm('reeds', gx(54.2), gx(74.9), {}); Pm('reeds', gx(49.8), gx(79.3), {}); Pm('reeds', gx(57.6), gx(79), {});
    /* the Sand Sea: fallen columns, a camel's bones are not made: a vulture on the giant foot's toe, scorpions, a cobra by the coffin */
    P('fallen_column', 55, 92, { face: 30 }); P('fallen_column', 65, 88, { face: 100 }); Pm('fallen_column', gx(50.5), gx(89.5), { face: 160, y: -0.3 }); Pm('papyrus_column', gc(68), gc(90), { y: -2.2 }); P('vulture', 61, 91, { face: 300 });
    Pm('scorpion', gx(57.4), gx(93.3), {}); Pm('scorpion', gx(63.7), gx(91.2), {}); P('cobra', 51, 88, { face: 140 }); Pm('cattle_skull', gx(59.2), gx(87.3), {}); Pm('casing_block', gx(53.4), gx(94.6), { y: -0.35, face: 20 }); Pm('canopic_jars', gx(62.6), gx(87.2), {});
    P('camel', 70, 93, { face: 250 });
    native('anubis', 76, 54, 200, sayOf(O_GIZA, 'anubis')); native('annunaki', 86, 70, 270, sayOf(O_GIZA, 'annunaki')); native('skeleton', 79, 55, 300, sayOf(O_GIZA, 'skeleton'));
    native('conspiracy theorist', 91, 70, 40, sayOf(O_GIZA, 'conspiracy theorist')); native('mummy', 69, 80, 270); native('djinn', 55, 84, 0);
};

/* THE DESERT'S INSIDES (2026-11-15): the three ways into the Great Pyramid's inside. The entrance in the north face beside the North Stair, the
   slab beside the Tomb Door in the west face (Room 444's own door stays where it is), the Robbers' Cut (hidden) further north. */
/* PASS 4, THE AIR (the tool's air hook; home squares): wind-blown dust over the Sand Sea and round the pyramids, a little on the causeway,
   embers along the braziers to the Tomb Door, fireflies over the oasis */
exports.airZones = () => [
    { sx0: 48, sy0: 84, sx1: 72, sy1: 96, kind: 'dust', color: 0xf0d8a0, n: 220, speed: 1.0, wind: 1.9 },
    { sx0: 72, sy0: 60, sx1: 96, sy1: 96, kind: 'dust', color: 0xe8d0a0, n: 130, speed: 0.8, wind: 1.3 },
    { sx0: 48, sy0: 48, sx1: 72, sy1: 60, kind: 'dust', color: 0xe8d0a0, n: 80, wind: 1.1 },
    { sx0: 60, sy0: 74, sx1: 72, sy1: 82, kind: 'embers', color: 0xffa040, n: 50 },
    { sx0: 48, sy0: 72, sx1: 60, sy1: 84, kind: 'fireflies', color: 0xd8ff90, n: 45 },
];

exports.doors = ctx => { bind(ctx);
    const fx = r2(gx(73) - 0.45), nz = r2(gx(73) - 0.45);
    doors.push({ id: 'pyramid', wall: 'free', x: gc(87), z: nz, face: 0, leaf: 'leaf_frame_only', label: 'THE GREAT PYRAMID', sub: 'THE NORTH FACE · THE WAY IN', action: { room: 'site_prebuilt_giza_pyramid', at: 'north' },
        desc: 'A square mouth in the north face, under two pairs of leaning stones. The air that comes out of it is older than they are.' });
    doors.push({ id: 'tombside', wall: 'free', x: fx, z: gc(81), face: 270, leaf: 'leaf_frame_only', label: 'THE GREAT PYRAMID', sub: 'THE WEST FACE · BEHIND THE TOMB DOOR', action: { room: 'site_prebuilt_giza_pyramid', at: 'tomb' },
        desc: 'A casing stone that turns on its middle, a few steps south of the Tomb Door.' });
    doors.push({ id: 'cut', wall: 'free', x: fx, z: gc(75), face: 270, secret: true, leaf: 'leaf_frame_only', label: 'A DRAUGHT', sub: 'THE ROBBERS’ CUT · A ROUGH WAY IN', action: { room: 'site_prebuilt_giza_pyramid', at: 'cut' },
        desc: 'A hole hacked through the casing stones at the height of a crouch. The chisel marks all point inward.', draft: true });
};

/* ════ THE INSIDE (bake-desert-insides.js calls rooms(kit); notes: areas-complexes.md "THE DESERT'S INSIDES") ════ */
exports.rooms = kit => { const { mk, r2, C, T, DW, DH, U, GLS, CHAIN, GRILL, STEEL, RIB, PLAS, TILE, FIB, CONC, STONE, CAT } = kit;
    /* ════ INSIDE THE GREAT PYRAMID (14 x 14): the room is carved out of one mass. `#` = stone to the roof; the levels are
       p = the Pit (0 m), 1 = level 1 (3.5 m: the entrance, the passages, the Queen's Chamber), 2 = level 2 (10.5 m: the Antechamber, the King's
       Chamber), 3 = the Relieving Chambers (14 m, the hidden climb over the King); D = the Descent's slope, G = the Grand Gallery's ════ */
    const PY = mk(14, 14);
    { const R = PY, L1 = 3.5, L2 = 10.5, L3 = 14, TOP = 18;
      const MAP = [
          '######11######',
          '######11######',
          '11111111##11##',
          '######111111##',
          '#1111#111111##',
          '#1111111##GG##',
          '#1111#DD##GG##',
          '##1###DD##GG##',
          '111###DD##GG##',
          '####ppppppGG##',
          '####ppppppGG##',
          '#####2222222##',
          '#33332222222##',
          '#33332222222##',
      ].map(s => s.split(''));
      if (MAP.some(r => r.length !== 14) || MAP.length !== 14) throw new Error('the pyramid map is not 14 x 14');
      /* the Descent leaves level 1 at v 6 and reaches the Pit's floor at v 9; the Gallery climbs from v 5 to v 11 */
      const lvl = ch => ch === 'p' ? 0 : ch === '1' ? L1 : ch === '2' ? L2 : ch === '3' ? L3 : null;
      const rects = (test, cb) => { const used = MAP.map(r => r.map(() => 0));
          for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) { if (!test(MAP[y][x]) || used[y][x]) continue; let w = 1; while (x + w < 14 && !used[y][x + w] && test(MAP[y][x + w])) w++;
              let h = 1; rows: while (y + h < 14) { for (let i = 0; i < w; i++) if (used[y + h][x + i] || !test(MAP[y + h][x + i])) break rows; h++; }
              for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[y + j][x + i] = 1; cb(x, y, w, h); } };
      const slab = (x, y, w, h, hh) => R.F.push({ k: 'plateau', x: R.X(x + w / 2), z: R.Z(y + h / 2), w: w * C, d: h * C, h: hh, edge: 0.05 });
      rects(ch => ch === '#', (x, y, w, h) => slab(x, y, w, h, TOP));
      for (const ch of ['1', '2', '3']) rects(c => c === ch, (x, y, w, h) => slab(x, y, w, h, lvl(ch)));
      /* THE DESCENT: level 1 down to the Pit, one slope two squares wide (the mass under it is the slope itself) */
      R.F.push({ k: 'ramp', x0: R.X(7), z0: R.Z(9), x1: R.X(7), z1: R.Z(6), w: 7.6, h0: 0, h1: L1, stairs: true, built: true, edge: 0.05, key: STONE });
      /* THE GRAND GALLERY: level 1 up to level 2, a ramp two squares wide and six long under a corbelled roof 8 m over it */
      R.F.push({ k: 'ramp', x0: R.X(11), z0: R.Z(5), x1: R.X(11), z1: R.Z(11), w: 7.6, h0: L1, h1: L2, stairs: true, built: true, edge: 0.05, key: STONE });
      /* the roofs: every passage and chamber under its own stone ceiling */
      const roof = (u0, v0, u1, v1, y, tint) => { R.ceil(u0, v0, u1, v1, y, STONE, tint != null ? tint : 0xb8a680); R.P[R.P.length - 1].glow = 0.25; };   // (a roof's underside gets no light from the room's lamps: lit a little by itself)
      roof(6, 0, 8, 6, L1 + 3.5); roof(0, 2, 6, 3, L1 + 3.2, 0x8a7a60); roof(8, 2, 12, 5, L1 + 3.5); roof(5, 5, 6, 6, L1 + 3.2); roof(0, 8, 3, 9, L1 + 3.5); roof(2, 7, 3, 8, L1 + 3.2);
      roof(6, 6, 8, 9, L1 + 3.5); roof(4, 9, 10, 11, 5.25, 0x8a7a60);
      /* the Queen's Chamber: a gabled roof */
      R.P.push({ s: 'roof', form: 'gable', p: [R.X(3), L1 + 4.2, R.Z(5.5)], size: [14.2, 2.4, 10.7], key: STONE, tint: 0xc8b890, ds: true });
      /* the Gallery's corbelled roof: three steps closing in, 8 m over the slope */
      for (let i = 0; i < 6; i++) { const y = L1 + (L2 - L1) * (i + 0.5) / 6 + 8; R.box(11, 5.5 + i, y, 7.2, 0.3, 3.6, STONE, 0xd8c080); for (const s of [-1, 1]) { R.box(11 + s * 0.8, 5.5 + i, y - 1.2, 1.4, 1.2, 3.6, STONE, 0xc8b070); R.box(11 + s * 0.92, 5.5 + i, y - 2.4, 0.56, 1.2, 3.6, STONE, 0xb8a060); } }
      roof(10, 11, 12, 14, L2 + 3.5, 0xd8c080); roof(5, 11, 10, 14, L2 + 5.6, 0xd8c080); roof(1, 12, 5, 14, L3 + 2.4, 0x8a7a60);
      /* THE ANTECHAMBER's three stone gates (each a wall across it with one doorway), and the way into the King's Chamber */
      const st = { key: STONE, tint: 0xc8b070, frame: 0x6a5a40, base: L2 };
      R.wall('u', 11, 10, 12, Object.assign({ doors: [[10.5, 'leaf_portcullis']] }, st)); R.wall('u', 12, 10, 12, Object.assign({ doors: [[11.5, 'leaf_portcullis']] }, st)); R.wall('u', 13, 10, 12, Object.assign({ doors: [[10.5, 'leaf_portcullis']] }, st));
      R.wall('v', 10, 11, 14, Object.assign({ doors: [[13.5, 'leaf_vault']] }, st, { h: 5.6 }));
      /* the Queen's niche: a low doorway in her south wall, the passage behind it runs to the back of the Tomb Door */
      R.wall('u', 7, 1, 5, { key: STONE, tint: 0xc8b890, frame: 0x6a5a40, base: L1, doors: [[2.5, 'none']] });
      /* the hidden climb: a ladder up the King's west wall into the Relieving Chambers */
      R.F.push({ k: 'climb', x: r2(R.X(5) + 0.35), z: R.Z(13.5), face: 270, look: 'ladder' });
      /* THE PIT: unfinished, a well in its floor */
      R.props.push({ key: 'ancient_well', x: R.X(8.5), z: R.Z(10.5) }); R.block['8,10'] = 'well';
      R.dec('cave_stone', 4.6, 9.5, 20); R.dec('cave_stone', 9.4, 10.4, 200); R.dec('skull_pile', 5.4, 10.5, 0); R.dec('meshy_rope', 8.9, 10.1, 30); R.dec('psx_cobweb_1', 4.2, 9.2, 0, { y: 2.2 });
      /* the entrance, the passages */
      R.B('brazier', 6, 1, 0); R.dec('cave_torch', 7.75, 3.3, 0); R.dec('cave_torch', 9.5, 4.75, 0); R.dec('skull', 3.4, 2.6, 40); R.dec('cave_stone', 1.5, 2.3, 0); R.dec('psx_cobweb_2', 4.5, 2.2, 0, { y: L1 + 2.2 });
      R.dec('cave_torch', 0.4, 8.25, 0); R.dec('trap_sarcophagus_lid', 2.4, 8.7, 70);
      /* the Queen's Chamber */
      R.B('stone_altar', 1, 5, 90); R.B('greek_amphora', 1, 4, 0); R.B('greek_amphora', 4, 4, 0); R.dec('brazier', 4.5, 6.5, 0); R.dec('item_heart_scales', 1.5, 5.5, 90, { y: L1 + 1.0 }); R.dec('psx_cobweb_4', 1.2, 4.2, 0, { y: L1 + 2.6 });
      /* the Gallery's foot and head */
      R.dec('cave_torch', 10.25, 4.8, 0); R.dec('cave_torch', 4.4, 10.6, 0);                                                      // (nine lights in all: the Pit has one of them)
      /* the King's Chamber: the sarcophagus, the gold */
      R.B('sarcophagus', 7, 12, 90); R.B('brazier', 5, 11, 0); R.B('brazier', 9, 11, 0); R.B('greek_amphora', 5, 13, 0); R.dec('sea_chest', 9.4, 13.5, 200); R.dec('psx_gold_bar_pcs_1', 8.8, 13.6, 30); R.dec('skull', 6.4, 13.6, 100);
      /* the Relieving Chambers */
      R.dec('skull_pile', 2, 13.4, 0); R.dec('paper_sheet', 3.4, 12.6, 30, { y: L3 + 0.01 }); R.dec('psx_cobweb_5', 1.3, 12.3, 0, { y: L3 + 1.6 });
      /* PASS 2, THE INTERIORS (2026-11-16): what the first build left bare. The King's Chamber was open on its north side (a drop onto the
         Pit's roof): it has its north wall now. Its walls are lined in red granite under a band of the better gold; two jackals flank the door
         to the Turning Tomb; the gold lies about. Torches stand in every passage (`noLight`: the room's ten lights are spent; a torch's own
         glow still draws). The urns with ferns in them are amphorae. */
      R.wall('u', 11, 5, 10, { key: STONE, tint: 0xd8a888, base: L2, h: 5.6 });
      { const GR = 0xe0aa8a, band = (u, v, w, d) => { R.box(u, v, L2, w, 5.6, d, STONE, GR, { uv: [3.5, 1.75], glow: 0.18 }); R.box(u, v, L2 + 3.3, w + (d < 0.2 ? 0 : 0.06), 0.32, d + (d < 0.2 ? 0.06 : 0), 'gold', null, { glow: 0.35 }); R.box(u, v, L2 + 0.9, w + (d < 0.2 ? 0 : 0.04), 0.1, d + (d < 0.2 ? 0.04 : 0), 'gold', null, { glow: 0.35 }); };
        band(7.5, 13.95, 17.4, 0.08); band(7.5, 11.1, 17.4, 0.08); }
      R.B('jackal_statue', 6, 13, 0); R.B('jackal_statue', 8, 13, 0);   // (THE MODEL PASS: the jackals, in place of the small obelisks that stood in)
      R.dec('canopic_jars', 6.4, 12.7, 0); R.dec('golden_idol', 8.6, 11.7, 0); R.dec('golden_idol', 9.3, 13.4, 60); R.dec('oil_lamp', 5.4, 13.6, 0); R.dec('cat_statue', 4.4, 6.4, 315); R.dec('canopic_jars', 1.6, 6.5, 0); R.B('pharaoh_statue', 8, 1, 180);
      for (const q of [[6.3, 2.4], [0.5, 2.7], [8.6, 4.6], [1.5, 8.6], [10.4, 11.5]]) R.dec('oil_lamp', q[0], q[1], 0);
      R.box(7.5, 11.2, L2, 17.4, 0.45, 0.8, STONE, 0xe0aa8a, { uv: [3.5, 1.75], glow: 0.18 });                                          // a granite bench along the north wall (it hides the floor's dark edge)
      R.dec('money_sacks', 9.5, 12.5, 40); R.dec('psx_gold_bar_pcs_1', 9.1, 13.2, 80); R.dec('psx_gold_bar_pcs_1', 5.6, 12.4, 10); R.dec('psx_gold_bar_pcs_1', 6.5, 11.4, 140); R.dec('greek_amphora', 9.6, 11.5, 0); R.dec('item_censer', 8.4, 11.4, 0);
      R.dec('trap_sarcophagus_lid', 8.3, 12.9, 100);
      /* the Queen's Chamber: the feather beside the scales, a second sarcophagus, the cat */
      R.dec('item_maat_feather', 1.5, 5.2, 30, { y: L1 + 1.0 }); R.B('sarcophagus', 3, 6, 0); R.dec('cat', 3.4, 4.5, 200); R.dec('greek_amphora', 2.5, 4.3, 0); R.dec('candleRing', 2.6, 5.4, 0, { noLight: true });
      /* the entrance: two pillars and a plaque; the passages: torches, bones */
      R.dec('psx_pillar_1', 6.25, 1.6, 0); R.dec('psx_pillar_1', 7.75, 1.6, 0); R.dec('tomb_plaque', 7.7, 0.5, 200);
      for (const q of [[6.3, 3.6], [8.6, 2.4], [11.6, 3.4], [5.5, 5.5], [2.6, 7.5], [1.4, 2.6], [6.3, 6.6], [7.7, 8.2], [4.4, 9.4], [9.6, 10.6], [10.3, 12.6], [5.4, 11.4], [9.6, 13.6], [1.4, 13.5]]) R.dec('cave_torch', q[0], q[1], 0, { noLight: true });
      R.dec('femur', 2.4, 2.6, 70); R.dec('skull', 5.2, 2.4, 10); R.dec('femur', 6.6, 9.6, 30); R.dec('ulna', 7.4, 10.5, 120); R.dec('psx_cobweb_1', 0.3, 2.2, 0, { y: L1 + 2.4 }); R.dec('psx_cobweb_2', 11.7, 2.3, 0, { y: L1 + 2.6 });
      R.dec('bat_black', 6.2, 9.8, 0, { y: 3.6 }); R.dec('bat_brown', 8.2, 10.3, 90, { y: 3.9 }); R.dec('bat_grey', 4.8, 10.4, 200, { y: 3.3 });
      R.dec('wall_chains', 9.9, 9.5, 270, { y: 2.0 }); R.dec('meshy_burlap_sack', 2.3, 13.5, 0); R.dec('femur', 3.6, 13.3, 50);
      R.who('mummy', 8.6, 12.4, 270); R.who('anubis', 6.4, 11.5, 135);
      R.doors.push(
          { id: 'north', wall: 'n', x: R.X(7), leaf: 'leaf_frame_only', label: 'GIZA', sub: 'THE NORTH FACE · THE WAY OUT', action: { room: 'site_prebuilt_area51_desert', at: 'pyramid' },
            desc: 'The way out through the north face. The light at the end of it is the colour of the sand.' },
          { id: 'tomb', wall: 'w', z: R.Z(8.5), leaf: 'leaf_frame_only', label: 'GIZA', sub: 'THE WEST FACE · OUT BESIDE THE TOMB DOOR', action: { room: 'site_prebuilt_area51_desert', at: 'tombside' },
            desc: 'A slab that turns on its middle. It lets out on the west face, a few steps from the Tomb Door.' },
          { id: 'cut', wall: 'w', z: R.Z(2.5), secret: true, leaf: 'leaf_frame_only', label: 'A DRAUGHT', sub: 'THE ROBBERS’ CUT · OUT THROUGH THE WEST FACE', action: { room: 'site_prebuilt_area51_desert', at: 'cut' },
            desc: 'A rough hole hacked through the casing stones. Whoever cut it did not come for the view.', draft: true });
      /* THE TURNING TOMB (mondo 11-15: yes): the King's Chamber holds the door to the puzzle dungeon (data.js PD_DUNGEONS.tomb, level `tomb1`); leaving or solving it comes back here (map.js _pdDoor) */
      R.doors.push({ id: 'turning', wall: 's', x: R.X(7.5), leaf: 'leaf_portcullis', label: 'THE TURNING TOMB', sub: 'THE KING’S CHAMBER · THE DOOR BEHIND THE SARCOPHAGUS', action: { pd: 'tomb1', back: { room: 'site_prebuilt_giza_pyramid', at: 'turning' } },
          desc: 'A door in the south wall of the King’s Chamber, behind the sarcophagus.' });
      R.must.push('6,0', '7,0', '0,8', '0,2', '7,13');
      R.spawn = { x: R.X(7), z: R.Z(1.2), face: 180 };
      R.lines = [];
      R.stops = [[7, 1, L1], [3, 2.5, L1], [3, 5.5, L1], [1.5, 8.5, L1], [7, 10, 0], [11, 12.5, L2], [7.5, 13.4, L2]];
      R.hidden = [[3, 13, L3]];
    }
    return [
        { id: 'site_prebuilt_giza_pyramid', key: 'pyramid', name: 'the pyramid', R: PY, head: [
            "label: 'GIZA · INSIDE THE GREAT PYRAMID',", "sub: 'THE DESCENT · THE PIT · THE QUEEN’S CHAMBER · THE GRAND GALLERY · THE KING’S CHAMBER',", "kind: 'box', site: 'prebuilt_giza', part: 'pyramid',",
            "shell: hqBunkerShell({ w: " + PY.W + ", d: " + PY.D + ", h: 18, wallH: 18, plate: { x: " + PY.spawn.x + ", z: " + r2(-PY.D / 2 + 1.2) + ", y: 6.2 },",
            "                       floor: 'bricks_1', wall: 'bricks_1', dado: 'bricks_1', ceiling: 'bricks_1',",
            "                       floorColor: 0xf0d8a8, wallColor: 0xf0d8a8, dadoColor: 0xdcc090, ceilColor: 0xa89068,",
            "                       mood: { lamp: 0xffb060, glow: 0xff9a40, strip: 0xffd8a0, light: 0xffe0b0, ambient: 0.95 }, fog: { color: 0x2a2014, density: 0.008 }, look: HQ_ROOM_LOOKS.plateau }),",
            "parti: 'Passages two squares wide cut through one mass of stone on three levels: down to the Pit, level to the Queen, up the Grand Gallery to the King.',",
        ], terrain: ["res: 0.4375, floor: 'bricks_1', cliff: 'bricks_1', path: 'bricks_1',", "noise: { amp: 0, scale: 5 }, crag: false,"] },
    ];
};
