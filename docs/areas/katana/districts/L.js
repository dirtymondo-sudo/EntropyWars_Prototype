/* KATANA ISLAND, district L: THE VILLAGE (world polish thread 21, 2026-11-20). bake-katana.js runs build(ctx). ISLAND squares.
   Four plots: the Paddies 1 (x 36..47, y 48..59) · the Shore Hamlet 1 (x 36..47, y 60..71) · the Village 3 (x 48..59, y 48..59) · the Terraces 5
   (x 48..59, y 36..47). The Shore Road (2 squares) runs through all four on the paddies' banks; the Hot Spring trail comes down into the Terraces.
   LEVEL ON PURPOSE: the Paddies (flooded fields between bank paths), the village square (x 52..56, y 53..55).
   Thatch and timber: farm houses, a store, the fishermen's houses. PASS 1 = ground, outsides, first props. */
'use strict';
module.exports = {
    reach: [[43, 58, 'the Paddies'], [39, 66, 'the Shore Hamlet'], [53, 52, 'the village square'], [55, 44, 'the Terraces'], [51, 40, 'the upper field']],
    build(ctx) {
        /* ── THE RELIEF (the pass after the insides) ── */
        ctx.hill(58, 49.5, 1.6, 2.0);                                                             // the Village: a knoll in its north-east corner
        ctx.set(57, 36, 59, 40, 'g', 6);                                                          // the Terraces: a second upper field on the east (its stair below)
        const { rnd, thatch, house } = ctx, B = {};
        const hut = (id, q, h) => { B[id] = ctx.building(id, q, h || 2.8, {}, (a, w, d, door) => thatch(a, w, h || 2.8, d, door)); };
        /* ── THE PADDIES: four flooded fields between the bank paths, rice in rows ── */
        [[39, 51.5, 6.5], [39.5, 60 - 1.2, 3.2], [46.5, 51.5, 3.6], [46.4, 58.6, 2.6]].forEach(q => { ctx.feat({ k: 'pool', x: ctx.gx(q[0]), z: ctx.gz(q[1]), r: q[2], y: -0.12, depth: 0.35 }); const r = Math.ceil(q[2] / 3.5); for (let y = Math.floor(q[1]) - r; y <= Math.floor(q[1]) + r; y++) for (let x = Math.floor(q[0]) - r; x <= Math.floor(q[0]) + r; x++) if (Math.hypot(x + 0.5 - q[0], y + 0.5 - q[1]) * 3.5 < q[2] + 0.5) ctx.take(x, y); });
        ctx.sow(36, 48, 47, 59, 0.3, (x, y, v) => ctx.dec(v < 0.5 ? 'hw_crop' : v < 0.8 ? 'hw_crop_2' : 'hw_crop_3', x, y));
        [[42, 55], [45, 49]].forEach(q => { if (ctx.open(q[0], q[1])) ctx.P('hw_scarecrow', q[0], q[1], { face: 200 }); });
        /* ── THE SHORE HAMLET: fishermen's houses on the firm ground behind the sand ── */
        hut('fisher1', [40, 64, 43, 66, 'N']); hut('fisher2', [36, 64, 38, 67, 'E']); hut('fisher3', [40, 60, 42, 61, 'S']);
        /* ── THE VILLAGE: farm houses round a square, the store, the headman's house ── */
        hut('farm1', [48, 53, 50, 56, 'E'], 3.0); hut('farm2', [51, 49, 54, 51, 'S'], 3.0);
        B.store = ctx.building('store', [52, 55, 55, 57, 'N'], 3.6, {}, (a, w, d, door) => { house(a, w, 3.6, d, door, { plain: true, roof: { top: 'hip', over: 0.7 } }); });
        B.headman = ctx.building('headman', [48, 49, 50, 51, 'E'], 3.4, {}, (a, w, d, door) => house(a, w, 3.4, d, door, { roof: { top: 'gable', over: 1.0 } }));
        /* ── THE TERRACES: a higher field on the north-west (one level up, its own stair), a farm house, tea rows ── */
        ctx.set(48, 36, 53, 41, 'g', 6); ctx.stairs('field', 52, 42, 52, 42, 'N', 5, 6, { kind: 'g', paint: 'dirt', model: 'timber' }); ctx.stairs('field2', 57, 41, 57, 41, 'N', 5, 6, { kind: 'g', paint: 'dirt', model: 'timber' });
        ctx.feat({ k: 'pool', x: ctx.gx(50.5), z: ctx.gz(38.5), r: 5.0, y: -0.12, depth: 0.35 }); for (let y = 37; y <= 39; y++) for (let x = 49; x <= 51; x++) ctx.take(x, y);
        hut('farm3', [57, 44, 59, 47, 'W'], 3.0);
        ctx.sow(48, 36, 59, 47, 0.22, (x, y, v) => ctx.dec(v < 0.6 ? 'hw_crop_2' : 'hw_crop', x, y));
        /* ── props ── */
        const P = (key, x, y, o) => { if (ctx.open(x, y)) ctx.P(key, x, y, o); };
        P('ancient_well', 54, 54); P('stone_lantern', 52, 53); P('stone_lantern', 56, 55); P('market_stall', 56, 53, { face: 270 }); P('hay_cart', 52, 50 + 3 + 1, { face: 30 }); P('plough', 49, 57 - 5, { face: 80 }); P('wheelbarrow', 57, 51, { face: 10 });
        P('firewood_stack', 51, 55 + 3, { face: 0 }); P('wooden_barrel', 56, 57); P('woven_baskets', 55, 59 - 3); P('hw_scarecrow_2', 58, 40, { face: 180 }); P('lantern_post', 45, 56 + 2); P('lantern_post', 45, 62 - 1);
        P('drying_fish', 44, 64, { face: 0 }); P('drying_fish', 38, 62 - 2 + 1, { face: 90 }); P('meshy_rowboat', 43, 68, { face: 40 }); P('dugout_canoe', 39, 69, { face: 100 }); P('fishing_net_wall', 44, 66, { face: 90 }); P('campfire', 39, 63);
        [[54, 57 - 5], [50, 59 - 1], [47, 60], [36, 59 + 2]].forEach(q => { if (ctx.open(q[0], q[1])) ctx.dec('chicken', q[0], q[1]); }); if (ctx.open(57, 52)) ctx.dec('cow', 57, 52); if (ctx.open(58, 42)) ctx.dec('rooster', 58, 42);
        [[48, 52 - 1], [59 - 1, 49], [48, 59 - 2], [36, 60], [44, 63 - 3], [59, 37], [54, 36], [48, 47 - 1], [36, 48], [47, 55 - 7]].forEach((q, i) => { if (ctx.open(q[0], q[1])) ctx.tree(i % 3 === 0 ? 'tree_52' : i % 3 === 1 ? 'cherry_2' : 'cherry', q[0], q[1], 5 + rnd() * 2); });
                [['farmer', 53, 53, 90], ['farmer', 44 - 2, 57 - 1, 0], ['farmer', 54, 43 + 1, 180], ['fairy', 51, 40 - 4 + 5, 0], ['karate frog', 41, 62 - 2 + 3, 0], ['swordfighter', 57, 56 - 2, 270]].forEach(q => { if (!ctx.open(q[1], q[2])) return; ctx.take(q[1], q[2]); ctx.npc.push({ x: ctx.mx(q[1]), z: ctx.mz(q[2]), face: q[3], race: q[0] }); });
    },
};
