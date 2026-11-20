/* THE CAVERN, THE ROOM DESIGN (2026-11-20, world polish thread 9; one thread a file). Read by `node bake-ug.js cavern`.
   THE ROOM IS THE PLAN: docs/plans/world-polish/plans/ug-cavern.js (APPROVED by mondo 11-20), 6 x 3 plots, levels 105 down to 82 over the
   Inner Sun; bake-ug.js lays its squares, ladders, falls, sumps and roof. This file sets THE CAVERN'S PLACES on the plan's chambers and
   dresses the labyrinth as the biggest and darkest cave in the game (mondo 11-20: "The most Cavernous cave to ever exist"; "underground
   horror like the descent movie"). Squares are the plan's own (x 0..71 west to east, y 0..35 north to south).

   THE PLACES (each was a place of the old Cavern; it is set on the plan's chamber that fits it):
     THE LAST CAMP     chamber 2,0 · level 105 · the way in from the Tunnel-Way (the top): the explorers' last camp before the dark.
     THE SHELF         chamber 0,0 · 97 · the crystal shelf: crystals and glowcaps, the only cold light, a sump to the north.
     THE CROSSROADS    chamber 0,1 · 92 · THE GREAT CHAMBER: the Needle (the plan's landmark), the old signpost, the people; the West Tunnel.
     THE GROTTO        chamber 0,2 · 83 · the low tier: a black pool, mushrooms, the bats.
     THE MOUTH         chamber 3,2 · 88 · the lip over the way down to Hollow Earth (16 levels, its own room).
     THE OUBLIETTE     chamber 4,2 · 82 · the lowest place: reached only by the long fall or the 6-level ladder from the Mouth; the cells.
     THE FISSURE       junction 5,1 · 94 · the hot rock and the way to Hell.
   THE PITS (the plan's dead ends, two levels down, each with its own ladder): bone pits, nests, crystal pockets, an old camp, a squeeze,
   a sump; two dead-end plots each keep something (a secret). */
'use strict';
const TORCH = 'cave_torch';
/* the chambers: [name, x0, y0, x1, y1] (the plan's flats) */
const CH = { camp: [26, 2, 33, 9], shelf: [2, 2, 9, 9], cross: [2, 14, 9, 21], grotto: [2, 26, 9, 33], mouth: [38, 26, 45, 33], oub: [50, 26, 57, 33] };
const FISSURE = [64, 16, 67, 19];
/* the pits: the square the ladder lands in, and what is in it */
const PITS = [[17, 8, 'bones'], [53, 3, 'bones'], [17, 32, 'nest'], [68, 5, 'nest'], [32, 17, 'crystal'], [68, 17, 'crystal'], [29, 32, 'camp'], [41, 3, 'squeeze'], [39, 17, 'sump']];
const HOT = ['5,0', '5,1', '4,1'];   // the plots by the Fissure: obsidian, the red light
module.exports = {
    room: {
        world: { hub: 'cavern', layer: 'under', wx: -8, wy: 7 },   // THE ONE WORLD: where the old Cavern + Hollow Earth room's north half stood
        label: 'THE CAVERN',
        sub: 'THE LAST CAMP · THE CROSSROADS · THE OUBLIETTE · THE FISSURE · THE MOUTH OF HOLLOW EARTH',
        parti: 'A labyrinth of rock 40 metres deep: from the last camp at the top the passages split, climb, drop off cliffs and down waterfalls through six great chambers to the cells at the bottom; the Fissure breathes hot air from Hell, and the Mouth opens on the long way down to Hollow Earth.',
        ceil: 3, ceilChamber: 6, tallChambers: { 'Chamber 0,1': 6, 'Chamber 3,2': 3 },   // the Crossroads is the great chamber: its roof stands 21 m over its floor
        spawn: [29, 4], spawnFace: 180,
        mood: { light: 0xffb070, ambient: 0.14, hero: false },
        fallKey: 'swamp',   // mondo 11-20: the Cavern's falls murky (Hollow Earth keeps its blue water)
        /* THE SHEETS (mondo 11-20: "don't use the calm textures, use from the urban decay or horror pack"): every surface wears a horror-pack sheet
           (Screaming Brain Studios, `hz_<family>_<nn>`): the rock black and cracked, the floor dark cracked stone, the ledge faces rough brown */
        tex: { floor: 'hz_stone_02', wall: 'hz_stone_01', dado: 'hz_stone_02', trim: 'hz_stone_01', ceiling: 'hz_stone_01', cliff: 'hz_stone_10', path: 'hz_floor_03',
               genWall: 'hz_stone_01', roof: 'hz_stone_01', stalactite: 'hz_stone_02' },
        /* the paint: 1 the hot rock by the Fissure · 2 (spare) · 3 mud (the pits, the camp) · 4 mineral stone (the crystal pockets, the Shelf) */
        pal: ['hz_stone_10', 'hz_stone_02', 'hz_floor_03', 'hz_stone_06'],
        plotNames: { '2,0': 'The Last Camp', '0,0': 'The Shelf', '0,1': 'The Crossroads', '0,2': 'The Grotto', '3,2': 'The Mouth', '4,2': 'The Oubliette', '5,1': 'The Fissure',
            '1,0': 'The High Gallery', '3,0': 'The Wet Run', '4,0': 'The Long Shelf', '5,0': 'The Hot Gallery', '1,1': 'The Narrows', '2,1': 'The Cliff Gallery', '3,1': 'The Knot',
            '4,1': 'The Falls', '1,2': 'The Low Gallery', '2,2': 'The Dead End', '5,2': 'The Drip' },
        lines: [
            '“The sign says four ways out.” “There are six doors.” “Four ways OUT. The other two are in.”',
            '“Follow the water.” “Where does it go?” “Down.” “And then?” “Down.”',
            '“The draught goes down.” “Draughts go up.” “Tell it that.”',
            '“Which way is up?” “Yes.”',
            '“Oubliette.” “From the French.” “For?” “Forget.”',
            '“No doors on the cells.” “No. A step.” “A step is not a door.” “Down here it is.”',
            '“Who left the camp?” “Nobody left the camp.” “Then where are they?” “Further in.”',
            '“Count the ropes.” “Six.” “We came down with five.”',
            '“Is the light warm?” “The light is warm.” “Lights are not warm.” “This one is warm.”',
            '“Which way is down?” “Out.”',
        ],
    },
    /* the plan's doors, by index: 0 the Tunnel-Way (N), 1 Hollow Earth (S), 2 the West Tunnel (W), 3 Hell (the Fissure)
       (THE PILOT: the Tunnel-Way, the West Tunnel and Hollow Earth are still the old rooms until their own threads build them: each door here
       lands at that old room's door nearest this one; Hell is the link, re-pointed here) */
    doors: {
        0: { id: 'ug_cavern_tunnelway', label: 'THE TUNNEL-WAY', sub: 'THE PASSAGE UP · 12 LEVELS · TOWARD THE WOODS', action: { room: 'site_prebuilt_hollow_earth_ow_tunnelway', at: 'ow_v_m8_9' }, desc: 'The rope the camp came down on, and the passage up past it.' },
        1: { id: 'ug_cavern_hollow', label: 'HOLLOW EARTH', sub: 'THE MOUTH · THE LONG WAY DOWN · 16 LEVELS', action: { room: 'site_prebuilt_hollow_earth_ug_hollow', at: 'ug_hollow_cavern' }, desc: 'The rock opens on warm air and light from below. A long way below.' },
        2: { id: 'ow_v_m8_11',   /* the old seam's id: the West Tunnel's door (bake-cavern.js OUTER) lands here */ label: 'THE WEST TUNNEL', sub: 'THE PASSAGE WEST · 6 LEVELS UP · UNDER THE ESTATE', action: { room: 'site_prebuilt_hollow_earth_ow_west', at: 'ow_v_m8_11' }, desc: 'A low passage west. The air in it is cold.' },
        3: { link: 'cave_hell', end: 'a' },
    },
    /* THE WAYS IN THE PLAN HAS NO SPOT FOR (mondo 11-20, "just do it" to the proposal): each stood in the old Cavern room */
    extraDoors: [
        { at: [31, 29], side: 'e', link: 'cave_dumb', end: 'a' },                 // THE DEAD END (86): the D.U.M.B.'s blast door, cut square in the rock
        { at: [26, 4], side: 'w', link: 'workings_oubliette', end: 'b' },          // THE LAST CAMP (105): the Sewers' Old Workings, the old portcullis
        { at: [8, 16], well: true, face: 0, link: 'well_cellar', end: 'b' },        // THE CROSSROADS (92): the Haunted House's cellar well, a rope down
        { at: [57, 30], side: 'e', id: 'dungeon', secret: true, label: 'A DRAUGHT', sub: 'THE WALL MOVES', action: { room: 'dungeon', at: 'oubliette' },   // THE OUBLIETTE (82): DOOR HQ's fourth cell
          desc: 'A draught along the back wall, and the back wall moves. On the other side the building keeps a cell it says is vacant.' },
    ],
    /* THE PAINT: 0 the cave floor · 1 obsidian (the hot side) · 2 dungeon stone (the Oubliette) · 3 dirt (the pits, the camp) · 4 crystal */
    paint(ctx, x, y) {
        const p = ctx.plotOf(x, y); if (!p) return 0;
        for (const [px, py, what] of PITS) if (Math.abs(x - px) <= 1 && Math.abs(y - py) <= 1 && ctx.lv(x, y) < ctx.lv(px, py) + 0.5) return what === 'crystal' ? 4 : 3;
        if (HOT.includes(p.bx + ',' + p.by)) return 1;
        const [e, f, g, h] = CH.camp; if (x >= e && x <= g && y >= f && y <= h && (x - 29) * (x - 29) + (y - 5) * (y - 5) < 9) return 3;
        const [i, j, k, l] = CH.shelf; if (x >= i && x <= k && y >= j && y <= l && ((x + y) % 5 === 0)) return 4;
        return 0;
    },
    suns(ctx) {
        const at = (x, y, dy, color, intensity, dist, decay) => ({ x: ctx.gcx(x), y: ctx.r2(ctx.h(x, y) + dy), z: ctx.gcz(y), color, intensity, dist, decay });
        return [
            at(65, 17, 1.2, 0xff4a18, 1.6, 40, 1.4),     // THE FISSURE: Hell's red, out of the crack
            at(6, 16, 5.5, 0xffa860, 1.1, 34, 1.5),      // THE CROSSROADS: the camp-fire glow round the Needle
            at(44, 33, 0.4, 0xfff0b0, 1.0, 30, 1.6),     // THE MOUTH: Hollow Earth's sun, from far below
            at(5, 4, 1.0, 0x7fd8ff, 0.8, 26, 1.6),       // THE SHELF: the crystals' cold light
        ];
    },
    dress(ctx) {
        const { r2, rnd, C } = ctx, PUT = (key, x, y, o) => { if (ctx.free(x, y)) ctx.P(key, x, y, o); }, DEC = (key, x, y, o) => { if (ctx.open(x, y)) ctx.dec(key, x, y, o); };
        const pick = a => a[Math.floor(rnd() * a.length)];
        /* ── THE ROCK KIT: every wall foot of the labyrinth wears boulders (squashed domes half in the wall) and stalagmites (point up),
           in four dark greys (obsidian by the Fissure); one `arch` row a plot. Drawn only: nothing here blocks a walk. ── */
        const TINT = [0xffffff, 0xe6e2da, 0xf0ece4, 0xd6d2ca], HOTT = [0xffffff, 0xf0e0dc, 0xe0d4d0];   // near white: the horror sheet's own colour shows
        for (let by = 0; by < ctx.H / ctx.N; by++) for (let bx = 0; bx < ctx.W / ctx.N; bx++) {
            const hot = HOT.includes(bx + ',' + by), key = hot ? 'hz_stone_10' : 'hz_stone_02', ox = ctx.gx(bx * ctx.N) + ctx.N * C / 2, oz = ctx.gz(by * ctx.N) + ctx.N * C / 2, parts = [];
            for (let y = by * ctx.N; y < (by + 1) * ctx.N; y++) for (let x = bx * ctx.N; x < (bx + 1) * ctx.N; x++) { if (!ctx.open(x, y)) continue;
                ctx.rockSides(x, y).forEach(s => { if (rnd() > 0.9) return; const v = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }[s], t = (rnd() - 0.5) * 2.6;
                    const wx = ctx.gcx(x) - ox + v[0] * 1.75 + (v[0] ? 0 : t), wz = ctx.gcz(y) - oz + v[1] * 1.75 + (v[1] ? 0 : t), y0 = ctx.h(x, y), tn = hot ? pick(HOTT) : pick(TINT);
                    /* the rock behind this face: a big piece only where it is two squares thick (a thin wall between two passages takes a small one, never pokes through) */
                    const thick = !ctx.open(x + 2 * v[0], y + 2 * v[1]) && !ctx.wet(x + 2 * v[0], y + 2 * v[1]), k = thick ? rnd() : 0.6 + rnd() * 0.2;
                    if (k < 0.3) { const r = 0.8 + rnd() * 1.1; parts.push({ s: 'dome', p: [r2(wx), y0, r2(wz)], r: r2(r), rz: r2(r * (0.7 + rnd() * 0.5)), h: r2(0.6 + rnd() * 1.6), seg: 7, rings: 3, key, tint: tn, uv: 2.5 }); }
                    else if (k < 0.55 && thick) { /* a slumped mass of rock half out of the wall, over the walker's head */ const r = 1.5 + rnd() * 0.9; parts.push({ s: 'dome', p: [r2(wx + v[0] * 0.4), y0, r2(wz + v[1] * 0.4)], r: r2(r), rz: r2(r * (0.8 + rnd() * 0.4)), h: r2(2.2 + rnd() * 2.6), seg: 8, rings: 4, key, tint: tn, uv: 3 }); }
                    else if (k < 0.8 || !thick) { const hh = 0.7 + rnd() * 2.2; parts.push({ s: 'cyl', p: [r2(wx - v[0] * 0.7), y0, r2(wz - v[1] * 0.7)], r: r2(0.16 + hh * 0.13), r2: 0.03, h: r2(hh), seg: 6, key, tint: tn, uv: 2.5 }); }
                    else { /* a flowstone curtain up the wall, floor to roof (thick rock only) */ parts.push({ s: 'cyl', p: [r2(wx), y0, r2(wz)], r: r2(0.9 + rnd() * 0.5), r2: r2(0.45 + rnd() * 0.3), h: r2(ctx.ceil(x, y) - y0 + 0.2), seg: 7, key, tint: tn, uv: 3.5 }); } }); }
            if (parts.length) ctx.feat({ k: 'arch', id: 'ug:cavern:rock:' + bx + '_' + by, x: r2(ox), z: r2(oz), rot: 0, base: 0, parts });
        }
        /* ── THE CROSSROADS: THE NEEDLE (the plan's landmark at 6,18), a column of dripstone floor to roof in the great chamber ── */
        { const x = 6, y = 18, top = ctx.ceil(x, y) - ctx.h(x, y), b = ctx.h(x, y); ctx.taken.add(x + ',' + y);
          ctx.feat({ k: 'arch', id: 'ug:cavern:needle', x: ctx.gcx(x), z: ctx.gcz(y), rot: 0, base: b, parts: [
              { s: 'cyl', p: [0, 0, 0], r: 1.6, r2: 0.45, h: r2(top * 0.6), seg: 9, key: 'hz_stone_07', tint: 0xbcb6a8, uv: 3 }, { s: 'cyl', p: [0, r2(top * 0.55), 0], r: 0.4, r2: 1.6, h: r2(top * 0.45 + 0.2), seg: 9, key: 'hz_stone_07', tint: 0xb0aa9c, uv: 3 },
              { s: 'dome', p: [0, 0, 0], r: 2.4, h: 0.8, seg: 10, rings: 3, key: 'hz_stone_07', tint: 0x9e9888, uv: 3 }, { s: 'cyl', p: [1.5, 0, 0.9], r: 0.5, r2: 0.04, h: 2.6, seg: 6, key: 'hz_stone_07', tint: 0xb0aa9c }, { s: 'cyl', p: [-1.2, 0, -1.4], r: 0.4, r2: 0.04, h: 1.9, seg: 6, key: 'hz_stone_07', tint: 0xbcb6a8 } ] });
          ctx.feat({ k: 'wall', x0: r2(ctx.gcx(x) - 1), z0: ctx.gcz(y), x1: r2(ctx.gcx(x) + 1), z1: ctx.gcz(y), h: 3, t: 2, ghost: true }); }
        PUT('signpost', 4, 15, { face: 135 }); PUT('brazier', 3, 20); PUT('brazier', 9, 15);
        DEC('candleRing', 7, 20); DEC('candleRing', 4, 17); DEC('skull', 7, 20); DEC('cave_stone', 8, 21); DEC('cave_stone', 2, 14);
        PUT('menhir', 2, 21, { face: 30 }); PUT('ocean_rock_5', 9, 21, { face: 120 }); PUT('cave_stone', 2, 14, { face: 300 }); PUT('cave_stone', 9, 17, { face: 10 });
        PUT('cave_stone', 9, 9, { face: 30 }); PUT('ocean_rock_5', 2, 33, { face: 80 }); PUT('ore_heap', 45, 27, { face: 0 }); PUT('cave_stone', 57, 33, { face: 250 });
        /* ── THE LAST CAMP: the explorers' camp at the top, by the rope up; nobody in it ── */
        PUT('canvas_tent', 27, 3, { face: 160 }); PUT('canvas_tent', 32, 3, { face: 200 });
        PUT('campfire', 29, 6, { noLight: true }); DEC('firewood_stack', 31, 6); DEC('sleeping_bag', 28, 7); DEC('sleeping_bag', 30, 7, { face: 20 });
        DEC('backpack', 27, 5); DEC('backpack', 33, 6); PUT('ship_lantern', 33, 8, { noLight: true }); DEC('pickaxe', 26, 8); PUT('psx_wooden_crate_2', 26, 9); DEC('psx_wooden_crate_1', 33, 2);
        PUT('trail_sign', 31, 4, { face: 180 }); DEC('rope_coils', 30, 2); DEC('meshy_rope', 28, 2); DEC('psx_flashlight_1', 32, 7); DEC('lit_candle', 27, 6); PUT('stretcher', 32, 9, { face: 90 });
        PUT('cave_stone', 26, 2, { face: 40 }); PUT('ocean_rock_5', 33, 9, { face: 200 });
        /* ── THE SHELF: crystals and glowcaps, the cold light ── */
        [[2, 2], [9, 2], [3, 8], [8, 9], [5, 5], [2, 6]].forEach(([x, y], i) => PUT(i % 2 ? 'crystal_cluster' : 'meshy_crystal_shards', x, y, { face: Math.round(rnd() * 360) }));
        [[4, 3], [7, 7], [6, 2], [3, 5], [9, 6]].forEach(([x, y]) => DEC('woods_glowcap', x, y));
        /* ── THE GROTTO: the low tier; mushrooms, bats, the bones of something that came down and did not climb back ── */
        [[3, 27], [8, 28], [5, 32], [2, 30], [9, 32]].forEach(([x, y]) => DEC(rnd() < 0.5 ? 'mushroom2' : 'woods_glowcap', x, y));
        PUT('dinosaur_skeleton', 6, 30, { face: 70 }); DEC('skull_pile', 3, 33); DEC('psx_cobweb_1', 9, 26); DEC('psx_cobweb_2', 2, 26);
        [['bat_black', 4, 29], ['bat_brown', 8, 31], ['bat_grey', 7, 27]].forEach(([k, x, y]) => DEC(k, x, y, { y: r2(ctx.ceil(x, y) - 1.2) }));
        /* ── THE MOUTH: the lip; the light of Hollow Earth comes up from below ── */
        PUT('signpost', 41, 31, { face: 180 }); DEC('pickaxe', 39, 27); PUT('mine_cart', 38, 33, { face: 90 }); DEC('psx_cobweb_1', 45, 26);
        DEC('rat', 40, 29); DEC('cave_stone', 45, 30); DEC('cave_stone', 38, 26);
        /* ── THE OUBLIETTE: the cells at the bottom of everything ── */
        PUT('stocks', 52, 27, { face: 180 }); PUT('chain_bunk', 56, 27, { face: 90 }); PUT('chain_bunk', 56, 31, { face: 90 }); PUT('hw_body_rising', 53, 32, { face: 200 }); DEC('floor_stain', 52, 29); DEC('floor_stain', 55, 30); DEC('femur', 51, 31); DEC('lit_candle', 57, 32); DEC('psx_old_mattress_mp_1', 50, 32);
        PUT('trap_iron_maiden', 50, 26, { face: 135 }); DEC('trap_chain_draped', 54, 26); DEC('wall_chains', 57, 29); DEC('wall_chains', 50, 29);
        DEC('hw_body', 55, 32); DEC('skull_pile', 51, 30); DEC('skull', 54, 29); DEC('hw_part_3', 52, 33); DEC('candleRing', 53, 31); DEC('hw_candles', 57, 33);
        DEC('rat', 51, 28); DEC('rat', 56, 29); DEC('psx_cobweb_1', 57, 26); DEC('psx_cobweb_2', 50, 33);
        /* ── THE FISSURE: the hot rock; braziers someone keeps lit, and the crack to Hell ── */
        PUT('brazier', 67, 19); PUT('brazier', 64, 19); DEC('skull', 66, 18); DEC('hw_stone_2', 67, 16); PUT('stone_altar', 66, 17, { face: 0 });
        /* ── THE PITS ── */
        PITS.forEach(([px, py, what]) => { const sq = ctx.squares(px - 1, py - 1, px + 1, py + 1).filter(([x, y]) => ctx.lv(x, y) === ctx.lv(px, py) && !(x === px && y === py));
            const at = i => sq[i % Math.max(1, sq.length)] || [px, py];
            if (what === 'bones') { DEC('skull_pile', ...at(0)); DEC('skull', ...at(1)); DEC('hw_part_1', ...at(2)); DEC('psx_cobweb_1', ...at(1)); DEC('femur', ...at(2)); DEC('femur', ...at(0)); }
            if (what === 'nest') { if (ctx.free(...at(1))) ctx.P('goo_tendril', ...at(1)); DEC('hw_straw', ...at(0)); DEC('hw_straw', ...at(2)); DEC('skull', ...at(2)); DEC('hw_part_3', ...at(0)); DEC('hw_web', ...at(2)); DEC('spider', ...at(0)); DEC('femur', ...at(0)); }
            if (what === 'crystal') { DEC('meshy_crystal_shards', ...at(0)); DEC('crystal_cluster', ...at(1)); DEC('woods_glowcap', ...at(2)); }
            if (what === 'camp') { DEC('sleeping_bag', ...at(0)); DEC('backpack', ...at(1)); DEC('ship_lantern', ...at(2), { noLight: true }); DEC('hw_body', ...at(0)); DEC('psx_flashlight_1', ...at(2)); DEC('meshy_rope', ...at(1)); }
            if (what === 'squeeze') { DEC('backpack', ...at(0)); DEC('cave_stone', ...at(1)); DEC('psx_cobweb_1', ...at(2)); }
            if (what === 'sump') { DEC('cave_stone', ...at(0)); DEC('psx_fish_skeleton_mp_1', ...at(1)); } });
        /* THE TWO SECRETS (the plan's dead ends that keep something): a chest at the end of the Dead End, a chest under the Drip */
        PUT('sea_chest', 28, 29, { face: 0 }); DEC('skull', 29, 29); PUT('sea_chest', 65, 30, { face: 180 }); DEC('hw_candles', 64, 31);
        /* ── THE TORCHES: one at a corner of every plot (a lit one in ten places; the rest only glow) ── */
        const LIT = ['2,0', '0,1', '3,2', '4,2', '1,0', '3,0', '1,2', '2,1', '4,0', '5,2'];
        for (let by = 0; by < 3; by++) for (let bx = 0; bx < 6; bx++) { const c = ctx.walled(bx * 12, by * 12, bx * 12 + 11, by * 12 + 11, 2);
            if (!c.length) continue; const q = c[Math.floor(rnd() * c.length)]; ctx.P(TORCH, q[0], q[1], LIT.includes(bx + ',' + by) ? {} : { noLight: true });
            if (c.length > 6) { const q2 = c[Math.floor(rnd() * c.length)]; if (ctx.free(q2[0], q2[1])) ctx.P(TORCH, q2[0], q2[1], { noLight: true }); } }
        /* ── the passages: cobwebs at the bends, bones and stones along the walls, rats ── */
        const walls = ctx.walled(0, 0, ctx.W - 1, ctx.H - 1, 1).filter(([x, y]) => !ctx.chamberAt.has(x + ',' + y));
        for (let i = 0; i < 110 && walls.length; i++) { const [x, y] = walls[Math.floor(rnd() * walls.length)], k = rnd();
            DEC(k < 0.25 ? 'cave_stone' : k < 0.4 ? 'psx_cobweb_1' : k < 0.48 ? 'hw_web' : k < 0.56 ? 'skull' : k < 0.62 ? 'femur' : k < 0.7 ? 'rat' : k < 0.76 ? 'spider' : k < 0.84 ? 'hw_stone_2' : k < 0.9 ? 'mushroom2' : k < 0.93 ? 'psx_flashlight_1' : 'ocean_rock_5', x, y); }
        /* ── the bats, high in the big chambers ── */
        [[30, 8], [5, 19], [8, 14], [42, 30], [55, 30], [3, 3]].forEach(([x, y], i) => DEC(['bat_black', 'bat_brown', 'bat_grey'][i % 3], x, y, { y: r2(ctx.ceil(x, y) - 1.5) }));
    },
    people(ctx) {
        ctx.npc('gnome', 5, 15, 180); ctx.npc('mole man', 8, 19, 270); ctx.npc('goblin', 3, 18, 90);
        ctx.npc('gnome', 40, 28, 180); ctx.npc('goblin', 31, 9, 0);
        ctx.npc('skeleton', 54, 30, 0); ctx.npc('flesheater', 7, 31, 90); ctx.npc('shadow entity', 66, 30, 180); ctx.npc('antperson', 43, 18, 270);
    },
};
