/* CAME A LOT · THE SNOWY PINES, THE ROOM DESIGN (2026-11-20, the world polish plan, thread 3: docs/plans/world-polish/WORLD_POLISH_PLAN.md).
   Repo tooling only: bake-camelot.js calls `room(kit)` on `site_prebuilt_camelot_ow_pines` as it stands on the One World, before it joins anything.

   WHY THIS FILE AND NOT N.js: N.js is written in the kingdom's HOME frame (a strip 8 plots long). The One World stands each of those plots on its
   own, so a trail, a ridge or a gully drawn there across a plot line is cut apart (the plan's 5b, lesson 1). This file is written in THE ROOM'S OWN
   FRAME: squares x 0..47 (west to east), y 0..83 (north to south), a plot = 12 x 12 of them, exactly as the room is baked. N.js still stands
   everything that was on the eight old plots (the huts, the pond, the stops' dressing); it is not edited by this file.

   THE ROOM (4 x 7 plots, 22 of them; O = one of the eight old plots, the name = a new one, . = no plot):
        x 0..11            12..23             24..35               36..47
     y  0   .              The High Pines     O the Pass + pond    The Hermit's Hollow
       12   .              The Drift Field    O the cabin          The Tarn Shore
       24   .              The Drift Bank     O                    The Frozen Tarn
       36   The Wolf Run   O                  O                    The East Branch
       48   The Ridge Foot O                  The Gully Head       .
       60   The Pine Ridge O the sleigh       The Log Bridge       .
       72   The Lookout    O the Wayside Hut  The Gully Mouth      .
   The north gate's seam is on the south side of the Wayside Hut's plot (squares 13..15); the Pass is on the north side of the pond's plot (29..30).

   THE WAYS (mondo 11-20: "no long straight boring ways ... always branches and different routes"; ways 4 squares wide):
     THE SLEIGH ROAD: in at the south seam, north past the hut, east at the sleigh, north again, east at the old crossing, north past the cabin's
       door and the pond to the Pass. It bends five times; nobody sees more than three plots of it.
     WEST, THE PINE RIDGE (height that gives something to do): a ridge 4.5 m high along the three south-west plots, a trail on its crest, THE
       LOOKOUT on its south head (the castle over the pines, a sea chest), a steep short way up its flank from the road's bend, down its north
       end to THE WOLF RUN (a clearing a battle board fits on) and back east to the road.
     EAST, THE FROZEN GULLY: a gully 3 m deep with a frozen stream on its floor, walked from its mouth north to its head, UNDER THE LOG BRIDGE
       that carries a second way over it from the road to the east bank; both come out on THE GULLY HEAD (the second board clearing).
     NORTH-WEST: a trail that weaves between the drift banks to THE DRIFT FIELD (the third board clearing), on to THE HIGH PINES and its beacon
       knoll (3 m, the Pass seen from above), and back to the road at the pond; a link to the cabin on the way.
     NORTH-EAST: the east branch to THE FROZEN TARN (ice you walk on, in a shallow bowl), the camp on its shore, and a narrow way on to THE
       HERMIT'S HOLLOW (a sunk hollow in the far corner: the place that is hard to reach).
   RULES kept: nothing is cut or raised within 10 m of the room's own line (the land past it carries the edge's height on); the steepest
   ground is under 0.7 (the walker stops at 1); the three board clearings and the road are level. A prop rides the ground under it. */
'use strict';
function room(k) {
    const { N, C, r2, gx, gz, gcx, gcz } = k;
    if (process.env.NROOM_DUMP === 'before') dump(k);
    /* a way: stamps of w x w squares along the line through the points (each point = the stamp's north-west square) */
    const way = (pts, w, ch, sheet) => { for (let i = 0; i + 1 < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let s = 0; s <= n; s++) { const x = Math.round(x0 + (x1 - x0) * s / n), y = Math.round(y0 + (y1 - y0) * s / n); k.carve(x, y, x + w, y + w, ch || 'i', sheet); } } };
    const SOFT = 'calm_snow';                        // a side trail is soft snow between the pines; only the Sleigh Road is the packed road
    const trail = (pts, w) => way(pts, w, 'i', SOFT);
    const glade = (x0, y0, x1, y1) => k.carve(x0, y0, x1 + 1, y1 + 1, 's');   // both corners included
    const round = (cx, cy, rx, ry, ch) => { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) if (Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry) <= 1) k.carve(x, y, x + 1, y + 1, ch || 's'); };
    const mx = v => gx(v), mz = v => gz(v);   // a square's edge in metres (fractions allowed)
    const P = (key, sx, sy, o) => k.at(key, gcx(sx), gcz(sy), o);                                  // a prop on a square's middle
    const A = (key, fx, fy, o) => k.at(key, r2(mx(fx)), r2(mz(fy)), o);                             // a prop by fractions of a square

    /* THE YETI'S CAVE stayed with the village's north plots (the kingdom's room): what the move left of it here is one crag and the ghost wall of its
       back squares, on the south verge of the crossing. They leave: the wall nobody could see stood in the widened track. */
    k.drop(f => f.id === 'cam:n:cave@P02-00' || (f.k === 'wall' && f.ghost && f.t === 7 && Math.abs(f.z0 - gz(48)) < 0.01));
    /* ── THE SLEIGH ROAD ── */
    /* the road is 4 squares of walking: its two middle ones the packed sheet, a soft shoulder each side (4 packed squares read as a paved square) */
    const ROAD = [[9, 80], [9, 68], [23, 68], [23, 44], [28, 44], [28, 30], [32, 26], [34, 22], [34, 12], [33, 8], [33, 4], [28, 0]];
    const road = () => { way(ROAD, 4, 'i', SOFT); way(ROAD.map(q => [q[0] + 1, q[1] + 1]), 2); k.carve(13, 81, 16, 84, 'i', SOFT); k.carve(29, 0, 31, 2, 'i'); };
    road();                    // the apron of the north gate's seam
    /* the old tracks widened to 4 and tied in */
    trail([[13, 79], [20, 79]], 4); trail([[12, 44], [20, 44]], 4); trail([[12, 56], [20, 56]], 3); k.carve(30, 9, 34, 12, 'i', SOFT);
    k.close(24, 33, 28, 35);                         // the old track's stub west of the road in the plot north of the crossing: back to the pines

    /* ── WEST: THE LOOKOUT, THE PINE RIDGE, THE RIDGE FOOT, THE WOLF RUN ── */
    trail([[9, 79], [3, 79]], 4); trail([[3, 79], [3, 73], [3, 63], [4, 54], [4, 44], [9, 44]], 3); k.carve(4, 47, 12, 48, 'i', SOFT);
    glade(2, 73, 7, 77);                             // the lookout's top
    trail([[6, 68], [8, 68]], 3);                    // the steep way up the flank from the road's bend
    trail([[7, 56], [9, 56]], 3); glade(7, 51, 9, 54);   // the ridge foot: the woodcutters' landing, the track east to the road
    glade(2, 37, 9, 44);                             // THE WOLF RUN: 8 x 8, a battle board fits (a square of pines between it and the room's lines)
    k.feat({ k: 'ridge', id: 'cam:n:pineridge', pts: [[mx(4.5), mz(77)], [mx(4.5), mz(65)], [mx(5.5), mz(55)]], h: 4.5, w: 28 });
    k.feat({ k: 'hill', id: 'cam:n:lookout', x: mx(4.5), z: mz(75.5), r: 10, h: 1.5 });
    k.feat({ k: 'hill', id: 'cam:n:ridgehead', x: mx(5.5), z: mz(57), r: 9, h: 1.0 });
    k.noTrees(mx(0), mz(78.4), mx(8), mz(84));       // the lookout's south face: bare snow, the castle over it
    k.vista('s', mx(4.5));                           // and the forest past the room's south line stays low there: the view to the castle

    /* ── EAST: THE GULLY MOUTH, THE LOG BRIDGE, THE GULLY HEAD ── */
    trail([[20, 79], [27, 79]], 4);
    way([[29, 77], [28, 70], [29, 62], [29, 56]], 3, 's');
    k.feat({ k: 'ridge', id: 'cam:n:gully', pts: [[mx(30.5), mz(78)], [mx(29.5), mz(71)], [mx(30.5), mz(63)], [mx(30.5), mz(58.5)]], h: -3.2, w: 16 });
    k.carve(27, 65, 33, 67, 's');                    // under the bridge, bank to bank
    k.feat({ k: 'bridge', id: 'cam:n:logbridge', absY: true, x0: mx(26.6), z0: mz(66), x1: mx(33.2), z1: mz(66), w: 6.4, y: 0.08, thick: 0.4, rails: false, key: 'wood' });
    /* the bridge's own look: round logs under the deck, a log rail on posts each side, snow on the rails (the tool's rails are modern steel); the frozen stream */
    { const P2 = [], LOGC = 0x7a5a3c, x0 = mx(26.6), x1 = mx(33.2), L = x1 - x0, zc = mz(66);
      for (const s of [-1, 1]) { P2.push({ s: 'box', p: [r2((x0 + x1) / 2), 0.95, r2(zc + s * 3.05)], size: [r2(L + 0.6), 0.2, 0.2], key: 'wood', tint: LOGC, gain: 1.5 }, { s: 'box', p: [r2((x0 + x1) / 2), 0.5, r2(zc + s * 3.05)], size: [r2(L + 0.6), 0.14, 0.14], key: 'wood', tint: LOGC, gain: 1.5 },
              { s: 'box', p: [r2((x0 + x1) / 2), 1.15, r2(zc + s * 3.05)], size: [r2(L + 0.2), 0.07, 0.26], key: 'calm_snow', tint: 0xffffff, gain: 1.35 });
          for (let i = 0; i <= 6; i++) P2.push({ s: 'cyl', p: [r2(x0 + L * i / 6), -0.1, r2(zc + s * 3.05)], r: 0.13, r2: 0.11, h: 1.3, seg: 7, key: 'wood', tint: 0x5a4230, gain: 1.5 });
          for (const e of [0.12, 0.5, 0.88]) P2.push({ s: 'cyl', p: [r2(x0 + L * e), -3.3, r2(zc + s * 2.2)], r: 0.24, r2: 0.2, h: 3.2, seg: 7, key: 'wood', tint: 0x5a4230, gain: 1.4 }); }   // the trestle's legs down to the gully floor
      for (let i = 0; i < 5; i++) P2.push({ s: 'box', p: [r2(x0 + L * (i + 0.5) / 5), -0.42, r2(zc)], size: [0.3, 0.3, 6.6], key: 'wood', tint: 0x5a4230, gain: 1.4 });   // the bearers under the deck
      k.feat({ k: 'arch', id: 'cam:n:logbridge:look', x: 0, z: 0, rot: 0, y: 0, parts: P2 }); }
    { const P2 = [], q = [[78, 30.5], [71, 29.5], [63, 30.5], [58.5, 30.5]];
      for (let i = 0; i + 1 < q.length; i++) { const n = Math.ceil((q[i][0] - q[i + 1][0]) * 3.5 / 4); for (let j = 0; j <= n; j++) { const y = q[i][0] + (q[i + 1][0] - q[i][0]) * j / n, x = q[i][1] + (q[i + 1][1] - q[i][1]) * j / n;
          P2.push({ s: 'dome', p: [r2(mx(x)), -2.93, r2(mz(y))], r: 2.0, h: 0.07, rz: 3.2, seg: 12, rings: 2, key: 'calm_ice', tint: 0x86c8f2, glow: 0.4 }); } }
      k.feat({ k: 'arch', id: 'cam:n:gully:ice', x: 0, z: 0, rot: 0, y: 0, parts: P2 }); }
    trail([[31, 64], [32, 64], [32, 56]], 3);          // the east bank, north to the head
    glade(27, 49, 34, 56);                           // THE GULLY HEAD: 8 x 8, a battle board fits; its west side opens onto the road

    /* ── NORTH-WEST: THE DRIFT BANK, THE DRIFT FIELD, THE HIGH PINES ── */
    trail([[16, 44], [16, 38], [13, 31], [17, 25], [17, 22]], 3);
    glade(14, 14, 21, 21);                           // THE DRIFT FIELD: 8 x 8, a battle board fits
    trail([[22, 17], [25, 17]], 3);                    // the link to the woodcutter's cabin
    trail([[17, 13], [17, 8]], 3); trail([[17, 8], [24, 8]], 4);
    glade(15, 4, 18, 6); k.carve(16, 7, 18, 8, 's'); // the beacon knoll's top
    [[20.5, 34, 7, 1.5], [11.5, 28.5, 7, 1.7], [22, 26.5, 6.5, 1.4], [12, 37, 6, 1.2], [22.5, 12.5, 6, 1.3], [12.5, 18, 5, 1.1]].forEach((q, i) => k.feat({ k: 'hill', id: 'cam:n:drift' + i, x: mx(q[0]), z: mz(q[1]), r: q[2], rz: r2(q[2] * 0.7), rot: 25 + i * 37, h: q[3] }));
    k.feat({ k: 'hill', id: 'cam:n:beacon', x: mx(16.6), z: mz(5.4), r: 13, h: 3.2 });

    /* ── NORTH-EAST: THE EAST BRANCH, THE FROZEN TARN, THE TARN SHORE, THE HERMIT'S HOLLOW ── */
    trail([[32, 44], [38, 44]], 4); trail([[39, 44], [40, 36], [40, 33]], 3);
    round(41.5, 27.5, 4.2, 5.4, 's');
    { const P2 = [{ s: 'dome', p: [0, 0, 0], r: 14.2, h: 0.08, rz: 18.4, seg: 28, rings: 2, key: 'calm_ice', tint: 0x86c8f2, glow: 0.4 }];   // the ice: drawn, walked on (the pond's way)
      for (let i = 0; i < 17; i++) { const a = (i * 21 + 6) * Math.PI / 180; if (i === 4 || i === 12 || i === 13 || i === 8) continue;   // the bank, open where the ways come in (south, north, west)
          P2.push({ s: 'dome', p: [r2(Math.cos(a) * 15.6), -0.25, r2(Math.sin(a) * 19.8)], r: r2(2.2 + (i % 3) * 0.5), h: r2(0.7 + (i % 4) * 0.2), rz: 1.5, seg: 9, rings: 3, ry: Math.round(a * 180 / Math.PI + 90), key: 'calm_snow', tint: 0xffffff, gain: 1.35 }); }
      k.feat({ k: 'arch', id: 'cam:n:tarn', x: mx(41.5), z: mz(27.5), rot: 0, y: 0, parts: P2 }); }
    [[36.6, 23, 6, 1.6], [46.8, 31.5, 5, 1.3], [37, 36, 5, 1.2]].forEach((q, i) => k.feat({ k: 'hill', id: 'cam:n:tarnbank' + i, x: mx(q[0]), z: mz(q[1]), r: q[2], h: q[3] }));
    trail([[34, 32], [36, 32]], 3);                    // the old track east to the tarn
    glade(39, 18, 44, 21);                           // the camp on the shore
    k.carve(38, 19, 39, 22, 'i', SOFT);                    // the cabin's track east to the camp
    trail([[41, 15], [43, 11], [42, 8]], 3);           // the narrow way north
    glade(40, 3, 45, 7);                             // THE HERMIT'S HOLLOW
    k.feat({ k: 'dip', id: 'cam:n:hollow', x: mx(43), z: mz(5.6), r: 13, h: 1.8 });

    /* ── THE DRESSING (models from the list; a prop stands on the ground under it) ── */
    /* the road: lantern posts on alternate verges, a milestone and a signpost at every branch */
    [[8.6, 75], [13.4, 67.6], [18, 72.4], [27.4, 61], [22.6, 53], [27.6, 48.4], [27.6, 39], [32.4, 35.6], [33.6, 25], [38.4, 15], [32.6, 6]].forEach(q => A('lantern_post', q[0], q[1], { face: 90 }));
    A('signpost', 8.5, 78.5); A('signpost', 8.5, 71.5); A('signpost', 27.5, 67.6); A('signpost', 22.5, 43.5); A('signpost', 32.5, 43.5); A('signpost', 38.5, 23.5); A('milestone', 26.6, 78.5); A('milestone', 20.5, 43.6);
    /* the lookout: a cairn, the chest, a fire ring; the ridge trail's cairns */
    P('sea_chest', 3, 74, { face: 180 }); P('cairn', 6, 73); A('campfire', 5, 76.3); A('fallen_log', 6.2, 76.8, { face: 70 }); A('snowshoes', 3.6, 76.4);
    [[2.6, 68], [7.4, 61], [3.4, 55]].forEach(q => A('cairn', q[0], q[1])); A('raven_perch', 7.5, 66); A('owl_perched', 2.6, 60, { y: 0 }); A('eagle', 5, 71, { y: 9 });
    /* the ridge foot: the woodcutters' landing */
    P('firewood_stack', 7, 51); P('firewood_stack', 9, 51, { face: 90 }); P('axe_chopping_block', 8, 53); A('meshy_stump', 9.5, 54.5); A('hand_cart', 7.6, 54.6, { face: 40 }); A('fallen_log', 9.5, 55.6, { face: 10 });
    /* the wolf run: the pack, bones, a dead tree */
    A('wolf', 4, 39, { face: 120 }); A('wolf', 7.5, 38.4, { face: 200 }); A('wolf', 5.6, 42, { face: 30 }); A('wolf', 8.4, 41.4, { face: 300 }); P('skull_pile', 2, 37); A('femur', 3.4, 43.5); A('skull', 8.6, 37.6); A('psxg_dead_tree_1', 2.5, 43.6); A('meshy_fallen_log', 6.4, 40.2, { face: 35 }); A('psxg_rock_1', 3.6, 40.6);
    /* the gully: ice blocks and an ice axe on the floor, drift heaps on the banks, the bridge's two posts with lanterns */
    A('ice_axe', 31.4, 61.5); A('snow_heap', 26.4, 64.4); A('snow_heap', 33.5, 67.6); A('fallen_log', 31.6, 59.4, { face: 100 });
    A('lantern_post', 26.5, 64.7, { face: 0 }); A('lantern_post', 33.3, 67.3, { face: 180 });
    /* the gully head: the yeti's ground (bones, a fire), log seats at the edge */
    P('skull_pile', 34, 49); A('femur', 32.6, 50.4); A('campfire', 33.2, 55.4); A('fallen_log', 28.6, 49.6, { face: 0 }); A('meshy_stump', 34.4, 53.5); A('psxg_rock_1', 30.4, 52.6); A('psxg_dead_tree_2', 28.5, 54.5); A('hw_stone_2', 32.5, 51.4);
    /* the drift bank + the drift field: deer and a fox in the open, sleds on the bank, snowmen */
    A('deer', 16, 16, { face: 140 }); A('deer', 19.4, 19.6, { face: 250 }); A('fox', 20.5, 15, { face: 20 }); A('rabbit', 15, 20.5); A('xmas_snowman', 21.4, 21.4, { face: 200 }); A('snow_sled', 20.4, 31, { face: 60 }); A('snow_sled', 12.6, 30.2, { face: 300 });
    [[14.5, 26], [19.6, 28.5], [13.4, 35.5], [20.4, 38.4], [14.4, 14.4], [21.6, 14.5]].forEach(q => A('snow_heap', q[0], q[1]));
    /* the high pines: the beacon on the knoll, firewood for it */
    P('brazier', 16, 5); P('firewood_stack', 18, 4, { face: 90 }); A('cairn', 15.4, 6.6); A('mountain_goat', 17.5, 6.5, { face: 160 }); A('crow', 19.5, 9.4);
    /* the tarn: the fishing camp on the north shore, a hole in the ice */
    P('canvas_tent', 40, 18, { face: 180 }); A('campfire', 41.5, 20.4); A('kettle', 42.2, 20.6); P('wooden_barrel', 44, 18); A('snow_sled', 43.4, 21.2, { face: 20 }); A('ice_fishing_hole', 41.5, 24.4); A('fishing_rod', 42, 24.2); A('snowshoes', 40.2, 19.5);
    A('ice_block', 38.4, 30.5); A('xmas_snowman_2', 45, 32.6, { face: 250 });
    /* the hermit's hollow: an altar with candles, a chest behind it, a fur by the fire */
    P('stone_altar', 43, 3, { face: 180 }); A('hw_candles', 43.5, 3.5, { y: 0.9 }); P('votive_stand', 45, 3); P('sea_chest', 40, 3, { face: 180 }); A('campfire', 41.5, 6.6); A('fur_rug', 43.6, 6.7, { face: 20 }); A('owl_perched', 45.6, 7.4);
    /* the east branch: a cairn at the bend, a hitch of firewood */
    A('cairn', 42.4, 44.4); A('firewood_stack', 38.5, 47.6); A('psxg_dead_tree_2', 43, 46.5);

    /* the three board clearings read as snowfields, not floors: two low swells each (under 0.5 m: a board still stands on them), heaps, stumps and dead brush on the rims */
    [[6, 41, 0], [18, 18, 1], [31, 53, 2]].forEach(([cx, cy, i]) => { k.feat({ k: 'hill', id: 'cam:n:swell' + i + 'a', x: mx(cx - 1.6), z: mz(cy - 1.2), r: 7, rz: 4.5, rot: 30 + i * 50, h: 0.45 }); k.feat({ k: 'hill', id: 'cam:n:swell' + i + 'b', x: mx(cx + 2.2), z: mz(cy + 2), r: 6, rz: 3.6, rot: 120 + i * 40, h: 0.4 }); });
    [[2.3, 40.5], [9.7, 39.4], [4.4, 37.3], [14.3, 17.5], [21.7, 18.6], [17.5, 21.7], [27.3, 52.5], [34.7, 51.4], [30.4, 49.3], [31.5, 56.7]].forEach((q, i) => A(i % 3 === 0 ? 'meshy_stump' : i % 3 === 1 ? 'snow_heap' : 'psxg_dead_bush_1', q[0], q[1], { face: i * 67 % 360 }));
    /* the drift field: dark brush and rock in the white (cover on a board), frozen puddles on all three */
    A('psxg_dead_bush_2', 16.4, 15.6); A('psxg_dead_bush_1', 19.6, 17.4); A('psxg_rock_1', 15.5, 19.4); A('meshy_fallen_log', 19.3, 20.4, { face: 110 }); A('hw_stone_3', 20.5, 16.4); A('psxg_dead_tree_1', 14.6, 21.4);
    k.feat({ k: 'arch', id: 'cam:n:puddles', x: 0, z: 0, rot: 0, y: 0, parts: [[17.6, 17.2, 3.4, 2.2, 20], [20.2, 19.4, 2.2, 1.5, 100], [6.4, 39.2, 2.6, 1.8, 60], [30.2, 54.4, 2.8, 1.9, 140]].map(q => ({ s: 'dome', p: [r2(mx(q[0])), 0.42, r2(mz(q[1]))], r: q[2], h: 0.06, rz: q[3], seg: 14, rings: 2, ry: q[4], key: 'calm_ice', tint: 0x86c8f2, glow: 0.35 })) });
    road();                                          // the packed road over every trail it crosses

    /* ── WHO LIVES HERE (races; no invented lines) ── */
    k.native('wendigo', gcx(6), gcz(40), 90);
    k.native('yeti', gcx(32), gcz(53), 270);
    k.native('monk', gcx(42), gcz(5), 180);

    /* the air: pale ice dust over the tarn and in the gully */
    k.air({ x0: mx(37), z0: mz(22), x1: mx(46), z1: mz(33), kind: 'motes', color: 0xcfeaff, n: 40 });
    k.air({ x0: mx(28), z0: mz(58), x1: mx(33), z1: mz(79), kind: 'motes', color: 0xcfeaff, n: 30 });
    if (process.env.NROOM_DUMP) dump(k);
}
function dump(k) { let open = 0, all = 0;
    for (let y = 0; y < k.rows * 12; y++) { let s = ''; for (let x = 0; x < k.cols * 12; x++) { const c = k.ch(x, y), on = !!k.plot(x, y); if (on) { all++; if (k.open(x, y)) open++; } s += !on ? '.' : k.stood(x, y) && c !== 'T' ? 'o' : c === 'T' ? ' ' : c; if (x % 12 === 11) s += '|'; } console.log(String(y).padStart(2) + ' ' + s); if (y % 12 === 11) console.log('   ' + '-'.repeat(52)); }
    console.log('open ' + open + ' of ' + all + ' squares = ' + Math.round(100 * open / all) + ' %'); }
module.exports = { room };
