/* CAME A LOT · THE FOREST, THE ROOM DESIGN (2026-11-20, the world polish plan, thread 3: docs/plans/world-polish/WORLD_POLISH_PLAN.md).
   Repo tooling only: bake-camelot.js calls `room(kit)` on `site_prebuilt_camelot_ow_forest` as it stands on the One World, before it joins anything.
   The pattern is the Snowy Pines' (`N-room.js`; notes: docs/notes/areas-complexes.md "THE SNOWY PINES, THREE PLOTS WIDE" + "THE FOREST, THREE PLOTS WIDE").
   W.js (the home frame) still stands everything that was on the eight old plots; it is not edited by this file.

   THE ROOM (5 x 5 plots, 21 of them; O = an old plot, a name = a new one, . = no plot). Squares x 0..59 (west to east), y 0..59 (north to south):
        x 0..11            12..23               24..35              36..47                 48..59
     y  0  Poachers' Path  O the Crown's Road   The Bluff Path      .                      .
       12  Hollow's Rim    O the Forest Road    The Bluff's Foot    The Bluff              The Hunters' Stand
       24  The Hollow      O the Glade, west    O the Glade, east   O the Forest Road, e.  O Deep forest, south-east
       36  The Fern Bank   O the Forest Road,w  The Ford            The Charcoal Burners   L7 the Forest Trail (the camp)
       48  The Badger Wood O the Dead Tree      The Old Oak         .                      .
   In: the drawbridge's seam on the north side of the Crown's Road (squares 18..19). Out: the trail east from L7 to the Woods' Ritual Ground; the
   Dead Tree's door on the south side of its plot.

   THE WAYS (mondo 11-20: "no long straight boring ways ... always branches and different routes"):
     THE CROWN'S ROAD (5 squares: three of dirt, a grass shoulder each side): the cobbled avenue from the drawbridge, south to THE GLADE, east
       under the Bluff, south through THE CHARCOAL BURNERS, east into the camp and out to the Ritual Ground. Three bends.
     WEST, THE HOLLOW (height: a bowl 3 m deep): the poachers' path off the avenue, south along the rim, down into the Hollow (a clearing a board
       fits on), out south over the brook to the Badger Wood and round to the Dead Tree. Two cross links back to the road.
     EAST, THE BLUFF (height: a ridge 5 m): up its west end from the Forest Road or by the Bluff Path, along its crest over the Crown's Road
       (its south face is bare: the road is seen from above), THE HUNTERS' STAND on its east head, down to the deep forest's glade.
     SOUTH, THE BROOK: it rises in a pool at THE FORD and runs west to the sea; three ways wade it (the Ford, the hut path, the hollow's way).
       THE OLD OAK stands on its knoll south of the Ford.
   Three clearings a battle board fits on: the Glade, the Hollow, the Charcoal Burners.
   RULES kept: nothing cut or raised within 10 m of the room's line; steepest ground under 0.7; a glade stays a square off a plot side with no plot past it. */
'use strict';
function room(k) {
    const { r2, gx, gz, gcx, gcz } = k;
    if (process.env.WROOM_DUMP === 'before') dump(k);
    const GRASS = 'grass_dark_fantasy';
    const way = (pts, w, ch, sheet) => { for (let i = 0; i + 1 < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let s = 0; s <= n; s++) { const x = Math.round(x0 + (x1 - x0) * s / n), y = Math.round(y0 + (y1 - y0) * s / n); k.carve(x, y, x + w, y + w, ch || 'p', sheet); } } };
    const trail = (pts, w) => { way(pts, w, 'p', GRASS); if (w >= 3) way(pts.map(q => [q[0] + 1, q[1] + 1]), w - 2, 'p'); };   // a grass shoulder each side of the trodden middle
    const glade = (x0, y0, x1, y1) => k.carve(x0, y0, x1 + 1, y1 + 1, 'g');
    const mx = v => gx(v), mz = v => gz(v);
    const P = (key, sx, sy, o) => k.at(key, gcx(sx), gcz(sy), o);
    const A = (key, fx, fy, o) => k.at(key, r2(mx(fx)), r2(mz(fy)), o);

    /* ── THE CROWN'S ROAD ── */
    const ROAD = [[17, 12], [17, 24], [42, 24], [42, 39], [47, 39]];
    const road = () => trail(ROAD, 5);
    road(); k.carve(48, 40, 52, 43, 'p');            // into the camp's clearing

    /* ── WEST: THE POACHERS' PATH, THE HOLLOW'S RIM, THE HOLLOW, THE FERN BANK, THE BADGER WOOD ── */
    trail([[8, 2], [4, 2]], 4); trail([[4, 2], [5, 12], [4, 22]], 4);
    trail([[8, 14], [9, 14]], 3);                    // the Forest Road's track west to the rim
    glade(2, 26, 9, 33);                             // THE HOLLOW: 8 x 8, a battle board fits
    trail([[10, 26], [9, 26]], 3);                   // the Glade's track west, down into it
    trail([[4, 34], [4, 47], [5, 50], [16, 50]], 4);
    trail([[8, 38], [9, 38]], 3);                    // the hut's track west to the fern bank
    k.feat({ k: 'dip', id: 'cam:w:hollow', x: mx(6), z: mz(30), r: 18, h: 3 });
    [[3.5, 54.5, 4.5, 0.9], [8.5, 55.5, 4, 0.7], [9.6, 47.6, 3.6, 0.8]].forEach((q, i) => k.feat({ k: 'hill', id: 'cam:w:sett' + i, x: mx(q[0]), z: mz(q[1]), r: q[2], h: q[3] }));   // the badgers' setts

    /* ── EAST: THE BLUFF PATH, THE BLUFF'S FOOT, THE BLUFF, THE HUNTERS' STAND ── */
    trail([[24, 2], [27, 2], [27, 13]], 4);
    trail([[24, 14], [31, 14]], 4);
    trail([[32, 15], [50, 15]], 3);                  // the crest
    glade(50, 14, 55, 19);                           // the stand's ground on the east head
    trail([[52, 20], [52, 23]], 3);                  // down to the deep forest's glade
    k.feat({ k: 'ridge', id: 'cam:w:bluff', pts: [[mx(36), mz(16.5)], [mx(45), mz(16)], [mx(54.5), mz(16.5)]], h: 5, w: 26 });
    k.noTrees(mx(37), mz(18.4), mx(51), mz(24));     // the south face: bare, the Crown's Road below it

    /* ── SOUTH: THE FORD, THE OLD OAK, THE CHARCOAL BURNERS ── */
    trail([[34, 29], [34, 34], [30, 38], [30, 49]], 4);
    trail([[24, 38], [35, 38]], 3);                  // the hut's track east, to the Ford's trail and the charcoal burners
    trail([[14, 41], [14, 46], [18, 46]], 4); k.carve(19, 47, 21, 48, 'p');   // the hut's path south to the Dead Tree
    glade(27, 50, 33, 56); trail([[24, 51], [26, 51]], 3);   // THE OLD OAK's ground, the Dead Tree's track east to it
    glade(36, 36, 41, 44);                           // THE CHARCOAL BURNERS: with the road beside it, a battle board fits
    glade(13, 29, 20, 35);                           // THE GLADE: south of the road's corner, a battle board fits
    k.feat({ k: 'hill', id: 'cam:w:oakknoll', x: mx(30.5), z: mz(53.5), r: 9, h: 1.3 });
    /* THE BROOK: a bed 0.8 m deep from the pool at the Ford west towards the sea; the water is drawn 0.3 m under the banks (wade it anywhere a way crosses) */
    { const q = [[33, 44], [26, 46], [20, 46.5], [12, 45], [6, 43.5], [3.4, 43]], P2 = [];
      k.feat({ k: 'ridge', id: 'cam:w:brook', pts: q.map(p => [mx(p[0]), mz(p[1])]), h: -0.8, w: 9 });
      for (let i = 0; i + 1 < q.length; i++) { const n = Math.ceil(Math.hypot(q[i + 1][0] - q[i][0], q[i + 1][1] - q[i][1]) * 3.5 / 3); for (let j = 0; j <= n; j++) { const x = q[i][0] + (q[i + 1][0] - q[i][0]) * j / n, y = q[i][1] + (q[i + 1][1] - q[i][1]) * j / n;
          P2.push({ s: 'dome', p: [r2(mx(x)), -0.34, r2(mz(y))], r: 2.6, h: 0.05, rz: 2.6, seg: 12, rings: 2, key: 'water', tint: 0x9cc4cc }); } }
      P2.push({ s: 'dome', p: [r2(mx(33.4)), -0.34, r2(mz(43.6))], r: 4.2, h: 0.05, rz: 3.4, seg: 16, rings: 2, key: 'water', tint: 0x9cc4cc });   // the pool it rises in
      k.feat({ k: 'hill', id: 'cam:w:pool', x: mx(33.6), z: mz(43.6), r: 5.5, h: -0.5 });
      k.feat({ k: 'arch', id: 'cam:w:brook:water', x: 0, z: 0, rot: 0, y: 0, parts: P2 }); }
    road();                                          // the road over every trail it crosses

    /* ── THE DRESSING ── */
    /* the road: signposts where a way leaves it, a milestone at each bend, lantern posts on the verges */
    A('signpost', 16.6, 14.5); A('signpost', 22.4, 23.5); A('signpost', 33.5, 29.4); A('signpost', 47.4, 38.6); A('milestone', 16.6, 29.4); A('milestone', 47.4, 24.4); A('milestone', 41.6, 44.4);
    [[22.4, 18], [26, 23.6], [38, 29.4], [41.6, 33], [47.4, 42]].forEach(q => A('lantern_post', q[0], q[1], { face: 90 }));
    /* the glade: a fallen log to sit on, stumps, brush */
    A('meshy_fallen_log', 14.4, 31.5, { face: 80 }); A('meshy_stump', 19.5, 34.5); A('psxg_dead_bush_1', 13.5, 35.4); A('fern', 16.4, 33.6); A('fern', 18.6, 30.6); A('psxg_rock_1', 17.4, 34.6); A('deer', 15.5, 33, { face: 60 });
    /* the hollow: ferns and rocks round its floor, a ring of standing stones, the chest */
    [[3, 27], [8.6, 27.4], [2.6, 32.5], [9, 32.6], [5.5, 26.4]].forEach((q, i) => A(i % 2 ? 'fern' : 'psxg_dead_bush_2', q[0], q[1]));
    A('menhir', 4.4, 29); A('menhir', 7.6, 29.4, { face: 40 }); A('sarsen', 6, 32, { face: 110 }); A('sea_chest', 6, 29.8, { face: 180 }); A('psxg_rock_1', 2.6, 30.4); A('owl_perched', 9.4, 30);
    /* the poachers' path and the rim: snares, a hide */
    A('trap_bear_open', 6.5, 4.5); A('meshy_fallen_log', 4.6, 9.4, { face: 20 }); A('canvas_tent', 9, 2.6, { face: 180 }); A('campfire', 7.5, 5.4); A('rabbit', 6.4, 16.5); A('fern', 4.5, 18.5); A('meshy_stump', 7.6, 21.4);
    /* the fern bank and the badger wood */
    [[4.4, 37.5], [7.6, 40.6], [4.5, 45.5], [7.5, 46.6], [5.4, 49.4]].forEach(q => A('fern', q[0], q[1])); A('reeds', 8.4, 43.4); A('reeds', 3.6, 44.6); A('psxg_stepping_stone_1', 5.4, 43.4); A('psxg_stepping_stone_2', 6.6, 43.8);
    A('fox', 10.5, 51.5, { face: 300 }); A('meshy_fallen_log', 12.5, 53.6, { face: 95 }); A('fern', 8.5, 53.5); A('psxg_rock_1', 14.5, 50.4);
    /* the bluff: cairns on the crest, THE HUNTERS' STAND (drawn: a deck on four legs, a rail, a ladder, a brush roof), the chest under it */
    A('cairn', 34.5, 15.5); A('cairn', 43.5, 18.4); A('crow', 40, 15.6); A('meshy_stump', 47.5, 15.4);
    { const P2 = [], T = 0x6a4a30, x = mx(53.5), z = mz(14.6), Y = 4.0;   // on the head's north shoulder, beside the crest trail (the ground is 4 m there)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) P2.push({ s: 'cyl', p: [sx * 1.3, Y - 0.3, sz * 1.3], r: 0.16, r2: 0.13, h: 3.1, seg: 7, key: 'wood', tint: T, gain: 1.4 });
      P2.push({ s: 'box', p: [0, Y + 2.6, 0], size: [3.3, 0.16, 3.3], key: 'wood_planks', tint: 0x8a6a48, gain: 1.3 });
      for (const s of [-1, 1]) { P2.push({ s: 'box', p: [s * 1.55, Y + 3.5, 0], size: [0.1, 0.1, 3.3], key: 'wood', tint: T, gain: 1.4 }, { s: 'box', p: [0, Y + 3.5, s * 1.55], size: [3.3, 0.1, 0.1], key: 'wood', tint: T, gain: 1.4 }); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) P2.push({ s: 'cyl', p: [sx * 1.55, Y + 2.7, sz * 1.55], r: 0.07, r2: 0.07, h: 2.0, seg: 6, key: 'wood', tint: T, gain: 1.4 });
      P2.push({ s: 'roof', form: 'shed', p: [0, Y + 4.7, 0], size: [4.0, 0.6, 4.0], roof: true, key: 'leaves_3', tint: 0x5a6a3a, keyEnd: 'wood_planks', tintEnd: 0x8a6a48 });
      for (let i = 0; i < 7; i++) P2.push({ s: 'box', p: [-1.0, Y + 0.3 + i * 0.36, 1.8], size: [0.7, 0.07, 0.07], key: 'wood', tint: T, gain: 1.4 });   // the ladder's rungs
      for (const s of [-1, 1]) P2.push({ s: 'box', p: [-1.0 + s * 0.38, Y - 0.1, 1.8], size: [0.08, 2.9, 0.08], key: 'wood', tint: T, gain: 1.4 });
      k.feat({ k: 'arch', id: 'cam:w:stand', x: r2(x), z: r2(z), rot: 0, y: 0, parts: P2 }); }
    A('sea_chest', 51.5, 14.5, { face: 180 }); A('wooden_barrel', 55.4, 18.5); A('campfire', 53.5, 18.4);
    /* the ford and the old oak */
    A('psxg_stepping_stone_1', 31, 44.6); A('psxg_stepping_stone_2', 32.2, 45.2); A('psxg_stepping_stone_1', 16, 46.3); A('psxg_stepping_stone_2', 17.2, 46.6); A('reeds', 34.6, 42.4); A('reeds', 29.4, 46.6); A('lake_rock', 35.4, 44.6); A('fern', 29.5, 41.4);
    k.feat({ k: 'tree', x: r2(mx(30.5)), z: r2(mz(53.5)), kind: 'tree_3', h: 17, r: 1.4 });
    [[28, 51.4], [32.6, 51.6], [27.6, 55.4], [33, 55.5]].forEach((q, i) => A(i % 2 ? 'fern' : 'psxg_rock_1', q[0], q[1])); A('hw_candles', 31.6, 52.4); A('owl_perched', 29, 55.6);
    /* the charcoal burners: two kilns (drawn: an earth mound, black at the crown, smoking), cut wood, their cart and their tent */
    { const P2 = []; [[38, 38.4, 2.3], [40.2, 42.2, 2.0]].forEach(q => { P2.push({ s: 'dome', p: [r2(mx(q[0])), -0.1, r2(mz(q[1]))], r: q[2], h: r2(q[2] * 0.8), rz: q[2], seg: 12, rings: 4, key: 'dirt_2', tint: 0x5a4a3a }, { s: 'dome', p: [r2(mx(q[0])), r2(q[2] * 0.45), r2(mz(q[1]))], r: r2(q[2] * 0.55), h: r2(q[2] * 0.42), rz: r2(q[2] * 0.55), seg: 10, rings: 3, key: 'scorched', tint: 0x2a2624 }); k.at('chimney_smoke', mx(q[0]), mz(q[1]), { y: r2(q[2] * 0.8), rise: 5 }); });
      k.feat({ k: 'arch', id: 'cam:w:kilns', x: 0, z: 0, rot: 0, y: 0, parts: P2 }); }
    P('firewood_stack', 36, 36); P('firewood_stack', 36, 44, { face: 90 }); A('hand_cart', 40.4, 36.6, { face: 30 }); A('axe_chopping_block', 37.4, 41.5); A('canvas_tent', 38.5, 44.2, { face: 0 }); A('wooden_barrel', 41.4, 40.4);

    /* ── WHO LIVES HERE (races; no invented lines) ── */
    k.native('mushroom girl', gcx(7), gcz(31), 90);
    k.native('tree person', gcx(31), gcz(55), 0);

    /* the air: gold motes over the hollow and the oak, mist on the brook */
    k.air({ x0: mx(1), z0: mz(25), x1: mx(11), z1: mz(35), kind: 'motes', color: 0xffe0a0, n: 40 });
    k.air({ x0: mx(26), z0: mz(49), x1: mx(35), z1: mz(58), kind: 'fireflies', n: 30 });
    if (process.env.WROOM_DUMP) dump(k);
}
function dump(k) { let open = 0, all = 0;
    for (let y = 0; y < k.rows * 12; y++) { let s = ''; for (let x = 0; x < k.cols * 12; x++) { const c = k.ch(x, y), on = !!k.plot(x, y); if (on) { all++; if (k.open(x, y)) open++; } s += !on ? '.' : k.stood(x, y) && c !== 't' ? 'o' : c === 't' ? ' ' : c; if (x % 12 === 11) s += '|'; } console.log(String(y).padStart(2) + ' ' + s); if (y % 12 === 11) console.log('   ' + '-'.repeat(65)); }
    console.log('open ' + open + ' of ' + all + ' squares = ' + Math.round(100 * open / all) + ' %'); }
module.exports = { room };
