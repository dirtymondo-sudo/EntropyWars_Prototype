/* C-room.js — THE CLEARING'S ROOM DESIGN, what stands on the plan's new ground (2026-11-20, world polish thread 6, mondo's OK on plan 3).
   The squares and levels are docs/plans/world-polish/thread6/plan3.js; bake-woods.js THE ROOM DESIGN (step 5d) lays them. This file works in the
   ROOM's own frame (squares 0..143 x 0..59), not the home frame the district files C.js / M.js write in: a new plot has no home square.
   `extra(o)` = square changes on top of the plan; `dress(a)` = pieces on the new plots. Pack pieces only (mondo 11-20: totems and effigies only
   "if they are ones from asset packs already": the ward totem and the effigy are Meshy-made, so the Stick Men are the Halloween pack's scarecrows). */
'use strict';
module.exports = {
    /* until Dead Man's Cave is built: one ramp from Deep woods, east (level 4) down to the Culvert's crossing as it stands (level 1, squares y 19..21) */
    extra(o) { for (let y = 18; y <= 21; y++) for (let x = 51; x <= 53; x++) { o.c2[y][x] = 'p'; o.LV[y][x] = 4; }
        for (let x = 54; x <= 58; x++) { o.c2[18][x] = 'g'; o.LV[18][x] = 4; }   // the glade's south row (the playground stands on it)
        for (let x = 54; x <= 59; x++) for (let y = 19; y <= 21; y++) { o.c2[y][x] = 'p'; o.LV[y][x] = 4 - (x - 53.5) * 0.5; o.RP[x + ',' + y] = { d: [-1, 0], g: 0.5 }; } },
    dress(a) { const P = a.P, box = a.box;
        /* THE STICK MEN (plot 2,2): scarecrows among dead trees, webs between them */
        P('hw_scarecrow', 30, 26, { face: 160 }); P('hw_scarecrow_2', 33, 27, { face: 250 }); P('hw_scarecrow', 31, 29, { face: 20 });
        P('hw_tree_3', 29, 28); P('psxg_dead_tree_2', 33, 29); P('psxg_dead_tree_1', 32, 26); P('hw_web', 29, 26, { dx: 0.8 }); P('psxg_dead_bush_1', 30, 28, { dx: -0.9, dz: 0.7 });
        /* the stub's end: a stone pile, where you turn back */
        P('cairn', 27, 34);
        /* THE BURNED HOUSE (plot 1,2): a shell you walk into, no roof, charred boards on a stone base course; dead trees in its yard */
        { const cx = a.gx(14) + 5.25, cz = a.gz(31) + 3.5, w = 10.5, d = 7, y0 = a.h(15, 31), CH = 0x2a2420, ST = 0x8f8a80, WD = 'urban:WoodGeneric1a';
          a.feat({ k: 'texbuilding', id: 'woods:burned', x: cx, z: cz, w, d, rot: 180, storeys: 1, seed: 5, skin: false, hollow: true, leaf: 'leaf_shabby_wood', keyIn: WD, floorIn: 'dirt_2' });
          const L = w - 0.12, cols = Math.round(L / 1.75), cw = L / cols, lx = -L / 2 + (Math.floor((cols - 1) / 2) + 0.5) * cw, parts = [];   // data.js hqTexbDoor: the doorway's middle along the front (rot 180: the front is the north side)
          const wall = (x0, x1, z, hh) => parts.push(box((x0 + x1) / 2, 0, z, x1 - x0, hh, 0.16, WD, CH, { uv: [1.75, 1.75] })), side = (x, z0, z1, hh) => parts.push(box(x, 0, (z0 + z1) / 2, 0.16, hh, z1 - z0, WD, CH, { uv: [1.75, 1.75] }));
          /* burned down unevenly: every run of wall its own height */
          wall(-w / 2, -1.6, d / 2, 2.6); wall(-1.6, 1.4, d / 2, 1.1); wall(1.4, w / 2, d / 2, 3.1);
          wall(-w / 2, -lx - 0.7, -d / 2, 2.9); wall(-lx + 0.7, w / 2, -d / 2, 1.9);
          side(-w / 2, -d / 2, 0.4, 3.2); side(-w / 2, 0.4, d / 2, 1.4); side(w / 2, -d / 2, -1, 0.9); side(w / 2, -1, d / 2, 2.7);
          parts.push(box(0, 0, 0, w + 0.3, 0.3, d + 0.3, 'rocks_5', ST, { uv: [3.5, 3.5] }));
          parts.push(box(w / 2 - 1.1, 0, d / 2 - 0.9, 1.5, 4.4, 1.1, 'urban:BrickMasonry1a', 0x6d5a50, { uv: [1.75, 1.75] }));   // the chimney still stands
          a.feat({ k: 'arch', id: 'woods:burned:arch', x: cx, z: cz, y: y0, rot: 180, parts }); }
        P('burnt_tree', 18, 30); P('hw_tree_4', 13, 33); P('psxg_dead_bush_1', 18, 33, { dx: 0.6 }); P('hw_bricks', 17, 33, { dx: -0.5, dz: 0.4 }); P('hw_bricks', 13, 30, { dx: 0.4 });
        /* UNDER THE BLUFF (plot 4,2): the pump yard, a tank and a pump gone to rust */
        P('ind_silo', 57, 29); P('centrifugal_pump', 55, 30); P('valve_wheel', 56, 32); P('utility_box', 54, 29, { face: 90 });
        /* THE DEAD END (plot 4,3): a road that just ends, a barricade across it, a wreck on it */
        P('item_police_barricade', 58, 43, { face: 90 }); P('item_police_barricade', 58, 45, { face: 90 }); P('traffic_barrel', 58, 44); P('crashed_car_2', 56, 44, { face: 70 }); P('tire_stack', 54, 45, { dx: 0.7 });
        /* the quiet glade (Deep woods, south): one dead tree, a tyre swing nobody is on */
        P('hw_tree_2', 39, 40); P('tyre_swing', 41, 38);
        /* trail lamps at the turns of the new ways, each in a pocket beside the trail (never on it) */
        [[47, 12], [36, 9], [26, 6], [50, 11], [59, 6], [54, 34], [50, 43], [47, 46], [21, 26], [36, 27]].forEach(q => P('lantern_post', q[0], q[1], { pocket: true }));
        /* the tops: a stone pile on each lip you hop from, a trail sign where the climb starts */
        P('cairn', 53, 4); P('trail_sign', 54, 14, { face: 180 }); P('hw_tree_5', 54, 6, { dx: 1.2 });
    },
};
