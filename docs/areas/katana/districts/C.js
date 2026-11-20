/* KATANA ISLAND, district C: THE CITY (world polish thread 21, 2026-11-20). bake-katana.js runs build(ctx). ISLAND squares, x east, y south.
   Six plots, each a level terrace: the Merchants' Town 3 (x 24..35, y 48..59) · the Samurai Quarter 4 (x 0..11, y 48..59) · the Temple Quarter 5
   (x 24..35, y 36..47) · the High Town 6 (x 12..23, y 36..47) · the Castle Garden 7 (x 0..11, y 24..35) · the Castle 8 (x 0..11, y 36..47).
   The streets are the layout's ways (the Mountain Road 3 squares, the Castle Road, the West Steps + the Main Gate, the Postern); they jog at right
   angles the way a castle town's streets do, and the tool stands a stone flight wherever one changes level. Every building keeps off them.
   LEVEL ON PURPOSE: the castle yard (x 4..11, y 40..46), the temple court (x 29..30, y 39..43 and the pagoda's foot), every street.
   PASS 1 = the ground, the buildings' outsides, the keep, the pagoda, the gates, the first props. Insides: bare rooms, a few things.
   STAND-INS mondo named 11-20: `sword` for the katana, the knight armour for samurai armour; roofs in code. */
'use strict';
module.exports = {
    reach: [[27, 50, 'the Merchants’ Town'], [31, 51, 'the Bath House'], [28, 45, 'the Temple Quarter'], [32, 42, 'the pagoda'], [21, 38, 'the High Town'], [16, 39, 'the Theatre'],
        [6, 41, 'the castle yard'], [5, 38, 'the keep’s door'], [7, 55, 'the Dojo'], [5, 33, 'the Castle Garden'], [15, 30, 'the shrine stair’s head']],
    build(ctx) {
        const { r2, rnd, WD, WD2, PLS, TILE, DARK, PLASTER, house, tiers } = ctx;
        const STONE = 0x8d8a84, RED = 0xc23a22, B = {};
        const bld = (id, q, h, o, ho, extra) => { B[id] = ctx.building(id, q, h, o || {}, (a, w, d, door) => { house(a, w, h, d, door, ho || {}); if (extra) extra(a, w, d, door); }); return B[id]; };
        /* ── THE MERCHANTS' TOWN (3) ── */
        bld('bathhouse', [29, 52, 34, 56, 'N'], 4.6, { leafDouble: true }, { roof: { top: 'gable', over: 1.4 } }, (a, w, d) => { a.box(w / 2 - 1.2, 4.6, -d / 2 + 1.2, 0.9, 3.2, 0.9, PLS, 0x77746e, { uv: [1.75, 1.75] }); });   // its chimney
        bld('teashop', [24, 54, 27, 56, 'N'], 3.4, {}, { roof: { top: 'gable' } });
        bld('brewery', [30, 57, 35, 60, 'N'], 4.4, { leafDouble: true }, { plain: true, roof: { top: 'hip', over: 0.8 } }, (a, w, d) => { a.box(0, 0, 0, w + 0.3, 1.1, d + 0.3, PLS, 0x3c4048, { top: false, uv: [1.75, 1.75] }); });
        bld('lanternmaker', [24, 48, 26, 51, 'E'], 3.2, {}, { roof: { top: 'gable', over: 0.9 } });
        bld('noodles', [24, 45, 26, 47, 'E'], 3.2, {}, { roof: { top: 'gable', over: 0.9 } });
        /* ── THE TEMPLE QUARTER (5): the pagoda is the City's landmark from the bay ── */
        B.pagoda = ctx.building('pagoda', [31, 39, 34, 42, 'S'], 4.2, {}, (a, w, d, door) => { a.shell(w, 4.2, d, PLS, 0xb23a26, door, [1.75, 1.75], 2.0); a.timber(w, 4.2, d, DARK); a.frame(door, d, WD2, DARK);
            const sub = ctx.sheet(), top = tiers(sub, w, d, 5, 0, 2.6, { wallTint: 0xb23a26, top: 'pyramid', shrink: 0.82, over: 1.5 }); void top;
            /* tiers() draws storey 0 as nothing (h0 0) + its roof at y 0: lift the whole stack onto the first storey's wall head */
            sub.P.forEach(q => { q.p = [q.p[0], r2(q.p[1] + 4.2), q.p[2]]; a.P.push(q); }); });
        bld('templehall', [29, 36, 35, 38, 'S'], 4.8, { leafDouble: true }, { wallTint: 0xe8dcc0, roof: { top: 'gable', over: 1.6 } });
        bld('monks', [24, 42, 26, 44, 'E'], 3.0, {}, { roof: { top: 'hip', over: 0.8 } });
        /* ── THE HIGH TOWN (6) ── */
        bld('theatre', [13, 40, 19, 44, 'N'], 5.4, { leafDouble: true }, { storeys: 2, roof: { top: 'gable', over: 1.5 } });
        bld('teahouse', [19, 45, 23, 47, 'N'], 3.2, {}, { roof: { top: 'gable' } });
        bld('townhouse1', [12, 45, 15, 47, 'N'], 3.2, {}, { roof: { top: 'gable', over: 0.9 } });
        bld('townhouse2', [22, 42, 24, 45, 'W'], 3.0, {}, { roof: { top: 'hip', over: 0.6 } });
        /* ── THE SAMURAI QUARTER (4) ── */
        bld('dojo', [1, 53, 7, 58, 'E'], 4.8, { leafDouble: true }, { roof: { top: 'gable', over: 1.5 } });
        bld('samurai1', [0, 48, 3, 51, 'E'], 3.4, {}, { roof: { top: 'gable' } });
        bld('samurai2', [6, 48, 9, 50, 'S'], 3.4, {}, { roof: { top: 'gable' } });
        bld('armoury', [10, 48, 12, 54, 'W'], 3.6, {}, { plain: true, roof: { top: 'hip', over: 0.7 } }, (a, w, d) => { a.box(0, 0, 0, w + 0.3, 1.1, d + 0.3, PLS, 0x3c4048, { top: false, uv: [1.75, 1.75] }); });
        /* ── THE CASTLE (8): the keep on a stone foot, three roofs high; the yard is open ── */
        B.keep = ctx.building('keep', [1, 36, 5, 40, 'E'], 6.0, { leafDouble: true }, (a, w, d, door) => { a.shell(w, 6.0, d, PLS, PLASTER, door, [1.75, 1.75], 2.1); a.frame(door, d, WD2, DARK);
            a.box(0, 0, 0, w + 1.6, 3.0, d + 1.6, PLS, 0x77746e, { top: true, uv: [1.75, 1.75], faces: 'blr' });                                 // the stone foot, battered out (open on the door's side)
            const sub = ctx.sheet(); tiers(sub, w, d, 4, 0, 3.4, { top: 'gable', shrink: 0.8, over: 1.5 }); sub.P.forEach(q => { q.p = [q.p[0], r2(q.p[1] + 6.0), q.p[2]]; a.P.push(q); }); });
        bld('guardhouse', [7, 43, 11, 46, 'N'], 3.4, {}, { roof: { top: 'gable' } });
        /* the castle's wall: white plaster under a tiled cap along the terrace's east and south edges, open at the two gates (drawn; the terrace's own rock face is the wall you cannot climb) */
        const wall = (id, x0, y0, x1, y1) => ctx.look('wall_' + id, x0, y0, 0, a => { const L = Math.hypot(x1 - x0, y1 - y0) * 3.5, ew = y0 === y1, cx = (x1 - x0) * 3.5 / 2, cz = (y1 - y0) * 3.5 / 2;
            a.box(cx, 0, cz, ew ? L : 0.6, 2.2, ew ? 0.6 : L, PLS, PLASTER, { uv: [1.75, 1.75], gain: 2.1 }); a.box(cx, 0, cz, ew ? L + 0.1 : 0.75, 0.6, ew ? 0.75 : L + 0.1, PLS, 0x77746e, { uv: [1.75, 1.75] });
            a.roof('gable', cx, 2.2, cz, ew ? L + 0.2 : 1.5, 0.5, ew ? 1.5 : L + 0.2, TILE, 0x5a6676, ew ? {} : { ry: 90 }); });
        wall('e1', 12, 39, 12, 48); wall('s1', 0, 48, 3.5, 48); wall('s2', 6.5, 48, 12, 48); wall('n1', 6.5, 36, 9, 36);
        /* the gates: two posts, a beam and a small roof over the way (the East Gate on the Castle Road, the Main Gate on the south way) */
        const gate = (id, ix, iy, rot, span) => ctx.look('gate_' + id, ix, iy, rot, a => { for (const sx of [-1, 1]) a.box(sx * span / 2, 0, 0, 0.5, 4.4, 0.5, WD2, DARK); a.box(0, 3.6, 0, span + 1.4, 0.5, 0.5, WD2, DARK); a.jroof(4.4, span + 0.6, 1.4, { top: 'gable', over: 1.0 }); });
        gate('east', 12, 37.5, 90, 9.6); gate('main', 5, 47.8, 0, 6.2);
        /* the shrine stair's gates: three red gates over the Mountain Road where it climbs out of the High Town (drawn, like the Great Gate) */
        [34.6, 33.2, 31.8].forEach((y, i) => ctx.look('torii' + i, 15.5, y, 0, a => { for (const sx of [-1, 1]) a.cyl(sx * 4.6, 0, 0, 0.28, 5.6, PLS, RED, { r2: 0.24, seg: 10, gain: 2.2 }); a.box(0, 4.3, 0, 10.4, 0.4, 0.34, PLS, RED, { gain: 2.2 }); a.box(0, 5.2, 0, 11.6, 0.5, 0.5, PLS, RED, { gain: 2.2 }); a.box(0, 5.7, 0, 12.2, 0.22, 0.8, PLS, 0x2a2a2e, { roof: true }); }));
        /* ── THE CASTLE GARDEN (7): a pond, a pavilion, cherries ── */
        bld('pavilion', [2, 27, 5, 30, 'S'], 3.0, {}, { roof: { top: 'pyramid', over: 1.2 } });
        ctx.feat({ k: 'pool', x: ctx.gx(8.5), z: ctx.gz(28), r: 5.2, y: -0.2, depth: 0.7 }); for (let y = 26; y <= 29; y++) for (let x = 7; x <= 9; x++) ctx.take(x, y);
        /* ── THE FIRST PROPS ── */
        const P = (key, x, y, o) => { if (!ctx.onWay(x, y) && ctx.free(x, y)) ctx.P(key, x, y, o); };
        [[25, 52], [29, 51], [35, 51], [25, 47], [29, 43], [35, 43], [29, 47], [19, 42 - 3], [23, 38], [13, 39], [17, 36 - 0 + 3], [6, 47], [3, 47], [7, 40], [11, 40], [6, 52], [3, 52], [10, 57], [1, 33], [9, 33], [6, 26]].forEach(q => P('stone_lantern', q[0], q[1]));
        P('market_stall', 29, 50, { face: 180 }); P('market_stall', 31, 48, { face: 180 }); P('market_stall', 25, 53, { face: 0 }); P('hand_cart', 35, 50, { face: 100 }); P('wooden_barrel', 35, 56); P('wooden_barrel', 29, 58);
        P('bell_frame', 29, 40, { face: 90 }); P('gong', 30, 43, { face: 0 }); P('brazier', 29, 39); P('brazier', 35, 40); P('prayer_flags', 27, 38 - 1, { face: 0 }); P('taiko_drum', 20, 44); P('taiko_drum', 12, 44);
        P('dojo_weapon_rack', 7, 53, { face: 270 }); P('wing_chun_dummy', 7, 57); P('wing_chun_dummy', 7, 59); P('decor_armour_stand_post', 3, 53 - 1, { face: 90 }); P('banner', 6, 43, { face: 90 }); P('banner', 6, 46 - 1, { face: 90 }); P('banner', 11, 39, { face: 0 });
        P('ancient_well', 9, 44 - 4 + 2); P('stepping_stones', 6, 31); P('footbridge', 8, 31, { face: 0 });
        /* trees: cherries and pines on the terraces' free ground (earth, never on a street) */
        [[3, 25], [10, 25], [1, 30], [11, 31], [3, 33], [7, 34], [10, 35], [1, 41], [2, 45], [9, 47 - 1], [35, 36], [24, 37], [35, 45], [24, 46], [22, 43], [20, 43], [14, 45 - 6], [35, 53], [35, 58], [28, 59], [1, 59], [9, 58], [11, 59]].forEach((q, i) => { if (!ctx.onWay(q[0], q[1])) ctx.tree(i % 4 === 3 ? 'tree_56' : ['cherry', 'cherry_2', 'cherry_3'][i % 3], q[0], q[1], 5 + rnd() * 2.5); });
        /* ── a first few things inside ── */
        ctx.put(B.dojo, 'dojo_weapon_rack', -6, -7, { face: 0 }); ctx.put(B.dojo, 'sword', 6, -7, {}); ctx.put(B.dojo, 'wing_chun_dummy', 0, -6, {}); ctx.put(B.dojo, 'taiko_drum', -7, 0, {});
        ctx.put(B.keep, 'decor_armour_stand_post', -4, -5, {}); ctx.put(B.keep, 'decor_armour_stand_post', 4, -5, {}); ctx.put(B.keep, 'sword', 0, -6, {}); ctx.put(B.keep, 'banner', -5, 0, {}); ctx.put(B.keep, 'privacy_screen', 0, -4, { face: 0 });
        ctx.put(B.armoury, 'spear', -2, -6, {}); ctx.put(B.armoury, 'spear', 2, -6, {}); ctx.put(B.armoury, 'decor_armour_stand_post', 0, 0, {}); ctx.put(B.bathhouse, 'hot_tub', -4, -3, {}); ctx.put(B.bathhouse, 'hot_tub', 4, -3, {}); ctx.put(B.bathhouse, 'wooden_bucket', 0, -5, {});
        ctx.put(B.teashop, 'psx_coffee_table_1', 0, -1, {}); ctx.put(B.teashop, 'teapot', 0, -1, { y: 0.66 }); ctx.put(B.teahouse, 'psx_coffee_table_1', -3, -1, {}); ctx.put(B.teahouse, 'teacups', -3, -1, { y: 0.66 }); ctx.put(B.templehall, 'votive_stand', 0, -2, {}); ctx.put(B.templehall, 'gong', -7, -1, { face: 90 });
        ctx.put(B.theatre, 'taiko_drum', -6, -5, {}); ctx.put(B.theatre, 'privacy_screen', 0, -5.5, { face: 0 }); ctx.put(B.brewery, 'wooden_barrel', -6, -3, {}); ctx.put(B.brewery, 'wooden_barrel', -4.5, -3.4, {}); ctx.put(B.brewery, 'wooden_barrel', 5, -3, {}); ctx.put(B.noodles, 'stock_pots', 0, -2, {});
        /* ── people (the Katana Empire of mondo's web holds the castle: shogun, samurai slug, ninja, monk, spy; the town: his Katana Bay list) ── */
        [['shogun', 8, 41, 90], ['samurai slug', 6, 44, 0], ['samurai slug', 6, 39 + 9, 180], ['ninja', 11, 43, 270], ['monk', 29, 41, 90], ['monk', 30, 39, 180], ['ki fighter', 7, 55, 90], ['swordfighter', 7, 54, 90], ['farmer', 30, 51, 0], ['catgirl', 20, 39, 180], ['vtuber', 16, 39, 0], ['karate frog', 28, 53 + 1, 0]]
            .forEach(q => { if (ctx.onWay(q[1], q[2]) || !ctx.free(q[1], q[2])) return; ctx.take(q[1], q[2]); ctx.npc.push({ x: ctx.mx(q[1]), z: ctx.mz(q[2]), face: q[3], race: q[0] }); });
        void WD; void STONE;
    },
};
