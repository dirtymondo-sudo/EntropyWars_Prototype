/* HOLLOW EARTH, THE ROOM DESIGN (2026-11-20, world polish thread 9; one thread a file). Read by `node bake-ug.js hollow`.
   THE ROOM IS THE PLAN: docs/plans/world-polish/plans/ug-hollow-earth.js (APPROVED by mondo 11-20), 6 x 4 plots, levels 72 down to 0 over the
   Inner Sun (126 m): the bottom half of the underground, the Inner Sun its lowest place. bake-ug.js lays its squares, ladders, falls and pools.
   mondo 11-20: "its hollow earth its supposed to be like a paradise or oasis inside earth, its okay if the water is blue for hollow earth".
   So it is NOT the Cavern: no rock roof (open up to the crust, lit by the sun that never sets), the walls between the passages are JUNGLE
   (the plan's closed squares grow jungle trees and palms), meadows in the chambers, clear blue water, the waterfalls blue. The labyrinth is the
   same plan: terraces and cliffs falling toward the Sun, so the Sun is always downhill and in sight over the trees.
   THE GROUND (mondo 11-20: no calm sheets; the horror and urban packs have no grass): the game's own pixel grass (`grass` on the trails,
   `grass_3` the flowered meadow in the chambers, `leaves` the jungle floor), horror-pack sand (`hz_stone_13`) on the Sun's shore, mossy horror
   rock (`hz_stone_06`) on every cliff.
   THE PLACES (each was a place of the old Hollow Earth, set on the plan's chamber that fits it):
     THE LANDING          chamber 3,0 · 72 · the foot of the long way down from the Cavern's Mouth (the spawn); a spring on its east side.
     THE CRYSTAL FOREST   chamber 0,0 · 57 · crystals taller than a man, glowcaps, a spring.
     THE MUSHROOM SHELF   chamber 1,2 · 46 · giant caps, a pool.
     THE GIANT'S SEAT     chamber 3,2 · 46 · the giant's throne and his foot, the old trees, a pool.
     THE NESTING GROUND   chamber 5,3 · 10 · the dinosaurs, their nests, the hot spring.
     THE SHORE            chamber 5,0 · 0 · the lake shore under the Sun; the Polar Opening (up to Antarctica).
     THE INNER SUN        chamber 5,1 · 0 · the sun on its spire, the altar facing it (the plan's landmark).
   THE PITS (the plan's dead ends, two levels down, a ladder out) are paradise ones: fossil beds, nests, crystal pockets, an explorer's camp
   (Admiral Byrd's, the old room's story), flowered clefts, spring pools; two dead ends keep a chest. */
'use strict';
const CH = { landing: [38, 2, 45, 9], crystal: [2, 2, 9, 9], shelf: [14, 26, 21, 33], seat: [38, 26, 45, 33], nest: [62, 38, 69, 45], shore: [62, 2, 69, 9], sun: [62, 14, 69, 21] };
const inR = (r, x, y) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
/* the plan's pits (the square named by its branch) and what each holds here */
const PITS = [[8, 17, 'fossil'], [27, 17, 'fossil'], [56, 29, 'fossil'], [3, 29, 'nest'], [29, 39, 'nest'], [63, 29, 'nest'], [3, 41, 'crystal'], [41, 20, 'crystal'],
    [17, 20, 'camp'], [41, 44, 'camp'], [17, 44, 'cleft'], [53, 3, 'cleft'], [29, 3, 'spring'], [56, 17, 'spring']];
const SUN = [66, 18];
module.exports = {
    room: {
        world: { hub: 'cavern', layer: 'under', wx: -8, wy: 10 },   // THE ONE WORLD: right under the Cavern, where the old room's south half stood (one row more)
        label: 'HOLLOW EARTH',
        sub: 'THE LANDING · THE CRYSTAL FOREST · THE GIANT\'S SEAT · THE NESTING GROUND · THE INNER SUN',
        parti: 'A whole country inside the earth, 126 metres from the top terrace to the Sun: jungle terraces and cliffs fall away under a sun that never sets, waterfalls drop through the trees, and at the bottom the Sun stands over a lake shore where the dinosaurs nest.',
        roof: false, look: 'mountain', fogColor: '0xb8c8a0',
        spawn: [41, 3], spawnFace: 180,
        mood: { light: 0xfff0c8, ambient: 0.5, hero: false },
        fallKey: 'water', sumpKey: 'deep_water',
        tex: { floor: 'grass', wall: 'hz_stone_08', dado: 'hz_stone_08', trim: 'hz_stone_08', ceiling: 'hz_stone_01', cliff: 'hz_stone_08', path: 'grass' },   // the rock between the trails: dark earthy moss (Stone_06 read as pale wallpaper)
        /* the paint: 1 the flowered meadow (the chambers) · 2 the jungle floor (the pits, the trails' edges) · 3 sand (the Sun's shore) · 4 mineral stone (the crystals) */
        pal: ['grass_3', 'leaves', 'hz_stone_13', 'hz_stone_06'],
        /* THE JUNGLE IS THE WALL: every square that is not a `space` grows jungle trees and palms (the House Trail's dead woods are the pattern) */
        gen: { kind: 'plan', look: 'trees', seed: 31, rim: 0, forceGrow: 0, treeGap: 2.6, treeIn: 0.9, spacing: 3.5, depth: 24.5, maxTrees: 3200, treeH: [9, 17],
               kinds: ['fl_jungle_tree', 'palm', 'fl_jungle_tree', 'tree_52', 'fae_bloom_tree', 'palm'] },
        plotNames: { '3,0': 'The Landing', '0,0': 'The Crystal Forest', '1,2': 'The Mushroom Shelf', '3,2': 'The Giant\'s Seat', '5,3': 'The Nesting Ground', '5,0': 'The Shore', '5,1': 'The Inner Sun',
            '4,1': 'The Great Fall', '3,1': 'The High Terrace', '2,0': 'The Upper Terrace', '1,0': 'The Fern Walk', '0,1': 'The Spring Steps', '1,1': 'The Old Trees', '2,1': 'The Vine Walk',
            '0,2': 'The Lower Terrace', '2,2': 'The Garden Steps', '4,2': 'The Long Drop', '5,2': 'The Sun Steps', '0,3': 'The Fossil Beds', '1,3': 'The Low Walk', '2,3': 'The Sunken Garden', '3,3': 'The Reed Walk', '4,3': 'The Warm Walk', '4,0': 'The Deep Steps' },
        lines: [
            '“The sun does not set.” “It is not allowed.”',
            '“The floor on the far side is the ceiling.” “Mind your head, in a while.”',
            '“The sun does not move.” “Neither do we, much.”',
            '“Which way is down?” “Toward the light.” “That is not how down works.” “It is here.”',
            '“The water is warm.” “All of it?” “All of it.”',
            '“The admiral wrote that it was beautiful.” “And then?” “And then he wrote nothing.”',
        ],
    },
    /* the plan's door: 0 = the Cavern (the Mouth, 16 levels up) */
    doors: {
        0: { id: 'ug_hollow_cavern', label: 'THE CAVERN', sub: 'THE LONG WAY UP · 16 LEVELS · THE MOUTH', action: { room: 'site_prebuilt_hollow_earth_ug_cavern', at: 'ug_cavern_hollow' }, desc: 'The way back up into the dark. The light stops a few steps in.' },
    },
    /* the ways in that stood in the old Hollow Earth */
    extraDoors: [
        { at: [69, 2], side: 'n', link: 'hollow_byrd', end: 'a' },   // THE SHORE: the Polar Opening, up to the ice (Antarctica)
    ],
    paint(ctx, x, y) {
        for (const [px, py, what] of PITS) if (Math.abs(x - px) <= 1 && Math.abs(y - py) <= 1 && ctx.lv(x, y) < ctx.lv(px, py) + 0.5) return what === 'crystal' ? 4 : 2;
        if (inR(CH.shore, x, y) || (inR(CH.sun, x, y) && (x >= 68 || y <= 15))) return 3;
        if (inR(CH.crystal, x, y) && (x * 7 + y * 3) % 4 === 0) return 4;
        for (const k of ['landing', 'crystal', 'shelf', 'seat', 'nest', 'sun']) if (inR(CH[k], x, y)) return 1;
        return ((x * 13 + y * 7) % 9 === 0) ? 2 : 0;   // the trails: grass with a little jungle floor
    },
    suns(ctx) {
        const at = (x, y, dy, color, intensity, dist, decay) => ({ x: ctx.gcx(x), y: ctx.r2(ctx.h(x, y) + dy), z: ctx.gcz(y), color, intensity, dist, decay });
        return [
            at(SUN[0], SUN[1], 28, 0xffe2a8, 2.6, 260, 1),   // THE INNER SUN: it never sets
            at(18, 14, 26, 0xfff0d0, 1.0, 140, 1.2),          // its light up on the high terraces (the west)
            at(41, 6, 22, 0xfff0d0, 0.9, 120, 1.2),           // and on the Landing
            at(66, 42, 10, 0xffb070, 0.8, 50, 1.4),           // THE HOT SPRING's glow at the Nesting Ground
        ];
    },
    dress(ctx) {
        const { r2, rnd } = ctx, PUT = (key, x, y, o) => { if (ctx.free(x, y)) ctx.P(key, x, y, o); }, DEC = (key, x, y, o) => { if (ctx.open(x, y)) ctx.dec(key, x, y, o); };
        const tree = (x, y, kind, h) => { if (!ctx.free(x, y)) return; ctx.taken.add(x + ',' + y); ctx.feat({ k: 'tree', x: ctx.gcx(x), z: ctx.gcz(y), kind, h: r2(h), r: 0.8 }); };
        /* ── THE INNER SUN: a column of rock, and the sun over it (the old Hollow Earth's own, on the plan's landmark square) ── */
        { const [x, y] = SUN, b = ctx.h(x, y); ctx.taken.add(x + ',' + y);
          ctx.feat({ k: 'arch', id: 'ug:hollow:sun', x: ctx.gcx(x), z: ctx.gcz(y), rot: 0, base: b, parts: [
              { s: 'cyl', p: [0, 0, 0], r: 2.4, r2: 0.7, h: 22, seg: 10, key: 'hz_stone_06', tint: 0xe8e0d0, uv: 3 },
              { s: 'dome', p: [0, 0, 0], r: 3.4, h: 1.0, seg: 12, rings: 3, key: 'hz_stone_06', tint: 0xd8d0c0, uv: 3 },
              { s: 'dome', p: [0, 29, 0], r: 6.5, h: 6.5, seg: 24, rings: 8, tint: 0xffd98a, glow: 0.85, ds: true }, { s: 'dome', p: [0, 29, 0], r: 6.5, h: -6.5, seg: 24, rings: 8, tint: 0xffcf78, glow: 0.85, ds: true } ] });
          ctx.feat({ k: 'wall', x0: r2(ctx.gcx(x) - 1), z0: ctx.gcz(y), x1: r2(ctx.gcx(x) + 1), z1: ctx.gcz(y), h: 3, t: 2, ghost: true }); }
        PUT('stone_altar', 66, 20, { face: 0 }); PUT('brazier', 64, 20); PUT('brazier', 68, 20); DEC('hw_candles', 65, 21); DEC('reeds', 69, 17); DEC('reeds', 69, 19);
        /* ── THE SHORE: palms on the sand, a rowboat drawn up, the jetty's posts ── */
        [[62, 3], [62, 8], [68, 8], [63, 6]].forEach(([x, y], i) => tree(x, y, 'palm', 7 + i));
        PUT('rowboat', 65, 3, { face: 0 }); DEC('mooring_bollard', 64, 2); DEC('mooring_bollard', 67, 2); DEC('reeds', 63, 2); DEC('ocean_rock_5', 69, 5); DEC('psx_fish_skeleton_mp_1', 66, 5);
        /* ── THE LANDING: the foot of the long way down; a campfire, the signpost, the spring ── */
        PUT('signpost', 43, 4, { face: 180 }); PUT('campfire', 40, 7, { noLight: true }); DEC('firewood_stack', 38, 8); DEC('backpack', 42, 8); DEC('reeds', 45, 5); DEC('reeds', 45, 6);
        [[38, 2], [45, 9], [38, 5]].forEach(([x, y], i) => tree(x, y, i ? 'palm' : 'fl_jungle_tree', 8 + i * 2));
        /* ── THE CRYSTAL FOREST ── */
        ctx.squares(2, 2, 9, 9).filter(() => rnd() < 0.22).forEach(([x, y]) => { if (ctx.free(x, y)) ctx.P(rnd() < 0.75 ? 'meshy_crystal_shards' : 'crystal_cluster', x, y, { h: r2(2.5 + rnd() * 4.5), face: Math.round(rnd() * 360) }); });
        ctx.squares(2, 2, 9, 9).filter(() => rnd() < 0.3).forEach(([x, y]) => DEC('woods_glowcap', x, y));
        /* ── THE MUSHROOM SHELF: giant caps ── */
        [[14, 26], [21, 26], [14, 33], [21, 33], [16, 29], [19, 31], [15, 31]].forEach(([x, y], i) => tree(x, y, i % 2 ? 'fae_cap_2' : 'fae_cap', 4 + (i % 3) * 2));
        ctx.squares(14, 26, 21, 33).filter(() => rnd() < 0.25).forEach(([x, y]) => DEC(rnd() < 0.5 ? 'mushroom2' : 'woods_glowcap', x, y));
        /* ── THE GIANT'S SEAT: the throne, the foot, the old trees ── */
        PUT('royal_throne', 41, 28, { h: 5.5, face: 180 }); PUT('meshy_giant_foot', 44, 30, { h: 3.4 });
        [[38, 26], [45, 26], [38, 33], [45, 33], [39, 31]].forEach(([x, y], i) => tree(x, y, i % 2 ? 'tree_3' : 'tree_52', 12 + i * 1.5));
        DEC('fallen_log', 40, 32); PUT('hollow_tree', 43, 33);
        /* ── THE NESTING GROUND: the dinosaurs' nests, a skeleton, the hot spring ── */
        PUT('dinosaur_skeleton', 64, 41, { face: 60 }); [[63, 44], [68, 39], [67, 44]].forEach(([x, y]) => { DEC('hw_straw', x, y); DEC('hw_straw', x, y); });
        PUT('anthill', 62, 38, { h: 3.2 }); DEC('ant', 63, 39); DEC('ant', 62, 40); DEC('ocean_rock_5', 69, 45); DEC('ocean_rock_5', 65, 45);
        [[69, 38], [62, 45]].forEach(([x, y], i) => tree(x, y, i ? 'palm' : 'fl_jungle_tree', 9 + i * 2));
        /* ── THE PITS ── */
        PITS.forEach(([px, py, what]) => { const sq = ctx.squares(px - 1, py - 1, px + 1, py + 1).filter(([x, y]) => ctx.lv(x, y) === ctx.lv(px, py) && !(x === px && y === py)), at = i => sq[i % Math.max(1, sq.length)] || [px, py];
            if (what === 'fossil') { DEC('femur', ...at(0)); DEC('femur', ...at(1)); DEC('psx_fish_skeleton_mp_1', ...at(2)); DEC('ocean_rock_5', ...at(1)); }
            if (what === 'nest') { DEC('hw_straw', ...at(0)); DEC('hw_straw', ...at(1)); DEC('hw_straw', ...at(2)); DEC('fae_toadstool', ...at(2)); }
            if (what === 'crystal') { DEC('meshy_crystal_shards', ...at(0)); DEC('crystal_cluster', ...at(1)); DEC('woods_glowcap', ...at(2)); }
            if (what === 'camp') { DEC('sleeping_bag', ...at(0)); DEC('backpack', ...at(1)); DEC('ship_lantern', ...at(2), { noLight: true }); DEC('psx_flashlight_1', ...at(0)); DEC('paper_sheet', ...at(1)); }
            if (what === 'cleft') { DEC('woods_glowcap', ...at(0)); DEC('fae_toadstool', ...at(1)); DEC('mushroom2', ...at(2)); }
            if (what === 'spring') { DEC('reeds', ...at(0)); DEC('reeds', ...at(1)); DEC('meshy_frog', ...at(2)); DEC('ocean_rock_5', ...at(0)); } });
        /* THE TWO SECRETS (the plan's dead ends that keep something) */
        PUT('sea_chest', 16, 16, { face: 90 }); PUT('sea_chest', 52, 4, { face: 180 });
        /* ── along the trails: ferns and mushrooms, a frog by the water, a torch-free light: the glowcaps ── */
        const walls = ctx.walled(0, 0, ctx.W - 1, ctx.H - 1, 1).filter(([x, y]) => !ctx.chamberAt.has(x + ',' + y));
        for (let i = 0; i < 90 && walls.length; i++) { const [x, y] = walls[Math.floor(rnd() * walls.length)], k = rnd();
            DEC(k < 0.35 ? 'woods_glowcap' : k < 0.6 ? 'mushroom2' : k < 0.75 ? 'reeds' : k < 0.85 ? 'ocean_rock_5' : k < 0.93 ? 'fae_toadstool' : 'fallen_log', x, y); }
    },
    people(ctx) {
        ctx.npc('giant', 42, 30, 180, '“The sun does not set. It is not allowed.”');
        ctx.npc('reptilian', 66, 7, 30, '“The floor on the far side is the ceiling. Mind your head, in a while.”');
        ctx.npc('gnome', 44, 6, 180); ctx.npc('goblin', 18, 29, 180); ctx.npc('mushroom girl', 17, 31, 90);
        ctx.npc('dinosaur', 65, 40, 90); ctx.npc('dinosaur', 68, 43, 200); ctx.npc('dinosaur', 63, 17, 120);
        ctx.npc('antperson', 64, 39, 0); ctx.npc('mole man', 5, 6, 270);
    },
};
