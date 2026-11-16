/* THE ESTATE · THE HAUNTED HOUSE + GRAVEYARD (district H, the south-west nine: plots x 0..2 · y 3..5, squares sx 0..35 · sy 36..71,
   levels 2..4: the house stands on its rise at 7 m). Repo tooling only: bake-estate.js loads this file through its one hook
   (THE DISTRICT FILES) and writes the room `site_prebuilt_skinwalker_estate` into data.js. One thread works this file; nobody else edits it.
   THE PLOTS (docs/areas/estate/layout.json):
     P00-03  The Treehouse          level 2  the treehouse in the pines
     P01-03  The Iron Gate          level 2  the gate at the end of the corn
     P02-03  The Drive              level 2  the drive curving up to the house
     P00-04  The Gazebo             level 3  the gazebo on the lawn
     P01-04  The Haunted House      level 4  LANDMARK: the house on its rise; five floors inside
     P02-04  The Lawn               level 3  dead lawn, fountain
     P00-05  The Crypt              level 2  the crypt
     P01-05  The Family Plot        level 2  the family graves
     P02-05  The Graveyard          level 2  rows of stones, open graves
   WHAT STANDS HERE TODAY: THE HAUNTED HOUSE (solid out here: dark clapboard, mansard, tower, two gabled bays, porch, chimneys, three lit
     windows), THE CRYPT (walk-in: sarcophagus, demon statue, candles), THE GAZEBO, THE IRON GATE with its two iron leaves, THE TREEHOUSE
     (a 5.25 m block with a ladder, a hut on top), the Lawn's fountain and benches, the iron fence at the foot of the house's lawn, the
     Family Plot and the Graveyard (Halloween pack + PSX graveyard pack: headstones, mounds, open coffins, pillars and small gates, dead
     trees, jack-o'-lanterns), two rim houses past the corn, and nine people: ghost, ghoul, vampire, werewolf, eagleman, undead,
     jack o lantern, zombie, necromancer.
   MISSING / WAITING:
     - the house is not walked into from here: its five floors (Hall, Upstairs, Nursery, Attic, Cellar) are the OLD rooms
       (`site_prebuilt_haunted_*`), not redesigned. Those rooms are not in this file; the front door `house` is the tool's.
     - the vampire has no line (its old line named the terrace, which is gone); most of the nine have none.
     - not carried over from the old Grounds (plan 2 does not draw them): the coach house, the terrace, the footbridge pond, the
       balcony bridges.
     - not seen on screen: the Crypt's inside, the district at night.
     - the pines on the corn bank round the grounds are the tool's (they stand on the shared wall).
     - no residents with routines, no encounter table (mondo's baked tables).
   THE HOOKS (bake-estate.js "THE DISTRICT FILES"; a file exports any of these, each is called with this district's own ctx):
     plan(ctx)    first of all: change the plan's squares (ctx.setRect(x0, y0, x1, y1, ch); 'c' = corn, anything else is walked).
     houses(ctx)  the main buildings (ctx.building: a hollow texbuilding + its drawn look; ctx.put: a prop in a building's own frame).
     sheds(ctx)   the out-buildings (same helpers).
     pieces(ctx)  drawn pieces on open ground (ctx.look) + their rows; ctx.flat(x0, y0, x1, y1) levels the ground under one.
     water(ctx)   pools, decks, rocks in the water.
     dress(ctx)   everything else: props (ctx.P on a square, ctx.dec off its middle), trees, rails, people (ctx.native), animals.
   ctx = { d, C, N, G, W, HALF, gx, gc, r2, PLAN, plot, cell, setRect, open, distAt, feat, props, npc, taken, building, put, look, sheet,
           windows, SOLID, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, P, dec, tree, native, rail, rnd, flat, sayOf, O_FIELDS, O_GROUNDS, BUILT }.
   Squares are (sx 0..72 west to east, sy 0..72 north to south); gx() = a square's west / north line in metres, gc() = its middle.
   ctx.rnd / ctx.dec throw THIS district's own dice, so nothing here moves another district's pieces. Row ids start 'est:'.
   NOT YOURS (the tool's, shared: a note on docs/notes/claims.md before anyone touches them): the corn wall and the pines on it, the levels,
   the paint rule, the sky and shell, the ways out (the Woods gate, the house's front door, `bay`, `bay13`, the well, the Lodge door).
   Rules for district threads: docs/notes/areas-complexes.md "THE ESTATE, THE DISTRICT FILES". Rebake: `node bake-estate.js`. */
'use strict';
module.exports = {
    plan(ctx) { const { setRect } = ctx;
        setRect(8, 65, 10, 66, 'p');                               // THE CRYPT: the path reaches its door (the plan's path met its corner)
    },
    houses(ctx) { const { building, SOLID, WD, WD2, SHG, FLR, GLS, BRK } = ctx;
        /* THE HAUNTED HOUSE (the district's landmark, on its rise): its five floors are the rooms that exist (the Hall, Upstairs, the Nursery, the Attic, the
           Cellar), so out here it is a solid house and its front door leads into the Hall. Dark clapboard, a mansard, a tower over the door, two gabled bays,
           a porch across the front, brick chimneys; three windows lit, the rest dark. */
        const HOUSE = building('house', [14, 50, 22, 56, 'S'], 10.5, SOLID, (a, w, d) => {
            const WALL = 0x8a8494, TRIM = 0x26222a, ROOF = 0x2c2830, LIT = 0xf0c868, DARK = 0x2a3040, f = d / 2;
            a.box(0, 0, 0, w + 0.1, 7, d + 0.1, WD, WALL, { top: false, uv: [3.5, 1.75] });
            a.roof('hip', 0, 7, 0, w + 1.4, 3.4, d + 1.4, SHG, ROOF);
            a.box(0, 0, f - 2.7, 5.6, 12.6, 5.6, WD, WALL, { top: false, uv: [3.5, 1.75] }); a.roof('pyramid', 0, 12.6, f - 2.7, 6.6, 5.2, 6.6, SHG, ROOF);   // the tower over the door (flush with the front: nothing drawn stands where you walk)
            a.box(0, 12.2, f - 2.7, 6.0, 0.3, 6.0, WD2, TRIM, { roof: true });
            for (const s of [-1, 1]) { a.box(s * 9.6, 0, f - 0.85, 5.2, 8.4, 1.9, WD, WALL, { top: false, uv: [3.5, 1.75] }); a.roof('gable', s * 9.6, 8.4, f - 0.85, 5.8, 2.4, 2.4, SHG, ROOF, { keyEnd: WD, tintEnd: WALL });   // the two gabled bays
                for (const y of [1.1, 4.4]) a.box(s * 9.6, y, f + 0.14, 1.4, 1.7, 0.08, GLS, (s < 0 && y > 4) ? LIT : DARK, { glow: (s < 0 && y > 4) ? 0.6 : 0.05 });
                a.box(s * 10.6, 7, -4.2, 1.3, 5.6, 1.3, BRK, 0x7a5a50, { roof: true }); a.box(s * 10.6, 12.6, -4.2, 1.6, 0.3, 1.6, BRK, 0x5a4640, { roof: true }); }
            for (const x of [-5.6, 5.6]) for (const y of [1.1, 4.4]) a.box(x, y, f + 0.1, 1.3, 1.7, 0.08, GLS, (x > 0 && y < 4) ? LIT : DARK, { glow: (x > 0 && y < 4) ? 0.6 : 0.05 });
            a.box(0, 8.6, f + 0.14, 1.4, 2.0, 0.08, GLS, LIT, { glow: 0.7 });                                                        // the tower's lit window
            a.box(0, 4.4, f + 0.14, 1.4, 1.7, 0.08, GLS, DARK, { glow: 0.05 });
            for (const s of [-1, 1]) for (let z = -f + 2.6; z < f - 1; z += 5.25) for (const y of [1.1, 4.4]) a.box(s * (w / 2 + 0.08), y, z, 0.08, 1.7, 1.3, GLS, DARK, { glow: 0.05 });
            /* the porch on the square row before the door: boards, posts, a lean-to roof */
            a.box(0, 0, f + 1.75, 13.6, 0.16, 3.4, FLR, 0x5a5048);
            for (const x of [-6.6, -3.4, 3.4, 6.6]) a.box(x, 0, f + 3.3, 0.22, 3.0, 0.22, WD2, TRIM);
            a.roof('shed', 0, 3.0, f + 1.85, 14.2, 0.8, 3.8, SHG, ROOF);
            a.box(-1.05, 0, f + 0.14, 0.2, 2.5, 0.2, WD2, TRIM); a.box(1.05, 0, f + 0.14, 0.2, 2.5, 0.2, WD2, TRIM); a.box(0, 2.4, f + 0.14, 2.5, 0.25, 0.2, WD2, TRIM);   // the front door's frame
        });
    },
    sheds(ctx) { const { building, put } = ctx;
        /* THE CRYPT (walk-in): a stone mausoleum, two columns and a pediment, a barred gate; the old crypt's sarcophagus and demon inside */
        const CRYPT = building('crypt', [4, 64, 8, 67, 'E'], 4.2, { leaf: 'leaf_cell', keyIn: 'castle_wall', floorIn: 'marble' }, (a, w, d, door) => {
            const STONE = 0xb4b0a8, DARK = 0x7a7670;
            a.shell(w, 4.2, d, 'castle_wall', STONE, door, [3.5, 1.75]);
            a.roof('gable', 0, 4.2, 0, d + 0.8, 1.9, w + 0.8, 'castle_wall', DARK, { ry: 90, keyEnd: 'castle_wall', tintEnd: STONE });
            a.box(0, 0, d / 2 + 0.9, w + 0.6, 0.2, 1.8, 'marble', 0xc8c4bc);
            for (const x of [-3.6, 3.6]) { a.cyl(x, 0.2, d / 2 + 1.2, 0.36, 3.8, 'marble', 0xd0ccc4); a.box(x, 4.0, d / 2 + 1.2, 0.9, 0.2, 0.9, 'marble', 0xc0bcb4); }
            a.box(0, 4.2, d / 2 + 0.9, w + 0.8, 0.5, 1.9, 'castle_wall', DARK, { roof: true });
            a.frame(door, d, 'castle_wall', DARK);
        });
        put(CRYPT, 'sarcophagus', 0, -3.0, { face: 90 }); put(CRYPT, 'demon_statue', 0, -6.0, { face: 180 }); put(CRYPT, 'candle', -2.2, -3.0); put(CRYPT, 'candle', 2.2, -3.0);
        put(CRYPT, 'skull_pile', -3.9, -5.8); put(CRYPT, 'psx_cobweb_1', 4.2, -6.2, { y: 2.8 }); put(CRYPT, 'stone_urn', 3.9, 5.4);
    },
    pieces(ctx) { const { gx, r2, feat, props, taken, look, flat, WD, WD2, SHG, FLR, BRK } = ctx;
        /* THE GAZEBO on the plan's paving: a thin stone floor, eight white posts, a pointed roof */
        look('gazebo', gx(6.5), gx(54.5), 0, a => { a.cyl(0, 0, 0, 5.2, 0.12, 'marble', 0xd0ccc4); a.box(4.6, 0.12, 0, 0.24, 3.0, 0.24, WD2, 0xe2ded2, { ring: { n: 8, r: 4.6 } });
            a.cyl(0, 3.12, 0, 5.4, 0.22, WD2, 0xe2ded2, { roof: true }); a.cyl(0, 3.34, 0, 5.6, 2.6, SHG, 0x4a5a50, { r2: 0, seg: 8, roof: true }); a.cyl(0, 5.94, 0, 0.12, 0.9, WD2, 0x2a2622, { roof: true }); });
        for (let y = 53; y < 56; y++) for (let x = 5; x < 8; x++) taken.add(x + ':' + y);
        /* THE IRON GATE: two brick piers and the iron arch over the track where the corn ends */
        look('irongate', gx(19), gx(38), 0, a => { for (const s of [-1, 1]) { a.box(s * 3.0, 0, 0, 0.9, 3.4, 0.9, BRK, 0x6a5650); a.box(s * 3.0, 3.4, 0, 1.1, 0.25, 1.1, 'marble', 0xb0aca4); a.box(s * 3.0, 3.65, 0, 0.4, 0.5, 0.4, 'marble', 0xb0aca4); }
            a.box(0, 3.5, 0, 5.4, 0.12, 0.12, null, 0x1c1c20); a.box(0, 3.9, 0, 4.0, 0.1, 0.1, null, 0x1c1c20); a.box(-2.0, 3.5, 0, 0.08, 0.45, 0.08, null, 0x1c1c20, { n: 9, step: [0.5, 0, 0] }); });
        props.push({ key: 'hw_gate_leaf', x: r2(gx(19) - 2.75), z: r2(gx(38) + 2.1), face: 90 }, { key: 'hw_gate_leaf_2', x: r2(gx(19) + 2.75), z: r2(gx(38) + 2.1), face: 90 });   // the two iron leaves (the Halloween pack's), standing open along the track
        /* THE TREEHOUSE: the old room's block you climb (a ladder up its south face), boarded round, a hut on top, the old oak beside it */
        feat({ k: 'plateau', x: gx(6), z: gx(42), w: 7, d: 7, h: 5.25, edge: 0.3 }); feat({ k: 'climb', x: gx(6), z: r2(gx(43) - 0.3), face: 0, look: 'ladder' });
        look('treehouse', gx(6), gx(42), 0, a => { a.box(0, 0, 0, 7.1, 5.25, 7.1, WD, 0x6a5a48, { top: false, uv: [3.5, 1.75] }); a.box(0, 5.25, 0, 7.4, 0.14, 7.4, FLR, 0x7a6a55);
            a.box(0, 5.39, -1.9, 4.6, 2.3, 0.14, WD, 0x7a6248); for (const s of [-1, 1]) a.box(s * 2.3, 5.39, -0.5, 0.14, 2.3, 2.9, WD, 0x7a6248);
            a.roof('gable', 0, 7.69, -0.5, 5.4, 1.5, 3.6, SHG, 0x4a4238, { keyEnd: WD, tintEnd: 0x7a6248 });
            for (const s of [-1, 1]) a.box(s * 3.55, 5.39, 0, 0.1, 0.9, 7.0, WD2, 0x4a3a2c); a.box(0, 5.39, -3.55, 7.0, 0.9, 0.1, WD2, 0x4a3a2c); });
        for (let y = 41; y < 43; y++) for (let x = 5; x < 7; x++) taken.add(x + ':' + y);
        flat(5, 41, 7, 43); flat(5, 53, 8, 56);   // the ground levelled under the treehouse and the gazebo
    },
    dress(ctx) { const { gx, gc, r2, feat, props, P, dec, tree, native, sayOf, O_GROUNDS } = ctx;
        tree(4, 41, 'tree_4', 12, 1.2); tree(8, 42, 'pine', 6.5); tree(5, 44, 'pine', 6); dec('fallen_log', 7, 43); P('cave_torch', 5, 40);
        P('cave_torch', 15, 41); P('cave_torch', 19, 43); P('stone_urn', 13, 58); P('stone_urn', 22, 58); P('cave_torch', 15, 57); P('cave_torch', 20, 57); P('planter', 14, 57); P('planter', 21, 57);
        P('hw_tree', 12, 49, { face: 40 }); P('hw_tree_2', 23, 49, { face: 200 }); tree(13, 53, 'tree_5', 6.5); tree(23, 59, 'tree_6', 6); P('hollow_dead_tree', 12, 59, { face: 120 });
        P('fountain', 30, 52); P('iron_garden_bench', 28, 50, { face: 180 }); P('iron_garden_bench', 32, 54, { face: 0 }); P('hw_tree_3', 34, 51, { face: 120 }); tree(28, 54, 'tree_6', 6.5); P('brazier', 29, 55); dec('crow', 31, 50);
        P('park_bench', 2, 54, { face: 90 }); tree(1, 56, 'tree_5', 6.5); tree(3, 52, 'tree_6', 6); P('cave_torch', 4, 57);
        P('skull_pile', 1, 64); P('cave_torch', 3, 63); P('hw_tree_4', 2, 66, { face: 300 }); dec('candle', 3, 65); P('angel_statue', 2, 62, { face: 90 });
        /* the family graves and the graveyard's rows: the Halloween pack's headstones and graves (mondo's pack; data.js HQ_CATALOGUE_HALLOWEEN) */
        { const ST = ['hw_stone', 'psxg_tombstone_1', 'hw_stone_2', 'hw_stone_3', 'psxg_tombstone_2', 'hw_stone_1', 'hw_grave', 'psxg_tombstone_3', 'hw_stone_4', 'hw_stone_5', 'hw_grave_low'];
          const row = (xs, y) => xs.forEach((x, i) => { const k = ST[(x * 3 + y + i) % ST.length]; P(k, x, y, { face: 180 });
              if (/tombstone|hw_stone/.test(k) && (x + y) % 2 === 0) props.push({ key: 'psxg_dirt_grave', x: gc(x), z: r2(gc(y) + 1.5), y: 0.02, face: 0 }); });   // a fresh mound before every other stone (the PSX graveyard pack's)
          row([14, 16, 18, 20], 67); row([15, 17, 19], 68); row([15, 19], 62); P('angel_statue', 17, 69, { face: 0 }); P('hollow_dead_tree', 13, 65, { face: 40 }); dec('candle', 17, 68); dec('crow', 16, 61);
          row([25, 27, 29, 31], 67); row([25, 27, 29, 31], 69); row([27, 29, 31], 62); row([26, 28, 30], 71);
          P('trap_coffin_open', 33, 68, { y: -0.3, face: 20 }); dec('trap_coffin_lid', 32, 68); P('trap_coffin_wood', 24, 70, { y: -0.3, face: 300 }); P('skull_pile', 28, 62); P('stocks', 25, 70, { face: 180 });
          P('cave_torch', 24, 67); P('cave_torch', 33, 67); dec('crow', 28, 68); dec('crow', 32, 70); dec('skull', 30, 70); dec('hw_shovel', 32, 68, { y: 0.02 }); dec('hw_pumpkin', 26, 66); dec('hw_pumpkin_2', 31, 68); dec('hw_pumpkin_3', 29, 70); dec('hw_candles', 28, 66); dec('hw_candles_2', 16, 68);
          /* the PSX graveyard pack: stone pillars and small iron leaves where each walk enters, dead trees and bushes, rocks, carved jack-o'-lanterns */
          for (const q of [[17, 61], [30, 62]]) { const X = gx(q[0] + 1), Z = gx(q[1]); props.push({ key: 'psxg_wall_pillar', x: r2(X - 3.1), z: Z }, { key: 'psxg_wall_pillar', x: r2(X + 3.1), z: Z }, { key: 'psxg_iron_gate_1', x: r2(X - 2.9), z: r2(Z + 0.7), face: 90 }, { key: 'psxg_iron_gate_2', x: r2(X + 2.9), z: r2(Z + 0.7), face: 270 }); }
          P('psxg_dead_tree_1', 14, 65, { face: 60 }); P('psxg_dead_tree_2', 32, 65, { face: 200 }); P('psxg_dead_tree_1', 25, 71, { face: 310 }); dec('psxg_dead_bush_1', 20, 66); dec('psxg_dead_bush_2', 24, 66); dec('psxg_dead_bush_1', 33, 66); dec('psxg_dead_bush_2', 18, 65);
          dec('psxg_rock_1', 13, 66); dec('psxg_rock_3', 19, 66); dec('psxg_rock_2', 24, 69); dec('psxg_rock_4', 30, 66); dec('psxg_jack_o_lantern_1', 29, 68, { face: 180 }); dec('psxg_jack_o_lantern_2', 31, 67, { face: 200 }); dec('psxg_jack_o_lantern_1', 18, 66, { face: 160 });
          P('wooden_cross', 24, 68, { h: 1.7, face: 180 }); P('wooden_cross', 21, 65, { h: 1.5, face: 180 }); }
        for (const x of [12, 13, 14, 15, 16, 19, 20, 21, 22, 23]) props.push({ key: 'hw_fence_iron', x: gc(x), z: r2(gx(60) - 0.25), face: 0 });   // the iron fence along the foot of the house's lawn, the walk's gap in its middle
        dec('psxg_jack_o_lantern_1', 16, 56, { face: 180 }); dec('psxg_jack_o_lantern_2', 19, 56, { face: 180 }); dec('psxg_dead_bush_1', 14, 58); dec('psxg_dead_bush_2', 21, 58); dec('hw_pumpkin_2', 15, 58); dec('hw_web', 20, 56, { y: 1.6, face: 0 });
        native('ghost', 28, 52, 30, sayOf(O_GROUNDS, 'ghost')); native('ghoul', 14, 66, 160, sayOf(O_GROUNDS, 'ghoul')); native('vampire', 13, 57, 180); native('werewolf', 7, 44, 90); native('eagleman', 3, 55, 90);
        native('undead', 26, 68, 200); native('jack o lantern', 30, 68, 180); native('zombie', 32, 70, 300); native('necromancer', 2, 63, 90);
        props.push({ key: 'abandoned_house', x: -168, z: 60, face: 0 }, { key: 'abandoned_house', x: -60, z: 168, face: 90 });       // the houses past the corn (the old Grounds' rim houses), outside the room
    },
};
