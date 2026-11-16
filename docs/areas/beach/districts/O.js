/* THE BEACH · THE OCEAN (district O, 93 plots: open water you sail and swim, the Volcano Island far out north) — the district file (2026-11-16).
   Part of `node bake-beach.js` (its one hook). Notes: docs/notes/areas-complexes.md "THE BEACH ON PLOTS" + "THE BEACH, THE DISTRICT FILES".
   mondo 11-15: "like an ocean from a final fantasy overworld map, big enough to sail and explore"; "add a remote island with a volcano and
   unconnected tribe (eventually will make models for)".

   THE PLOTS (docs/areas/beach/layout.json):
     P08-00  The Volcano (level 4): LANDMARK: a volcano, lava in its crater (never climbed)
     P09-00  The Volcano Island (level 1): a remote island, black sand under the cone
     P08-01  The Landing (level 0): the beach the skiff lands on
     P09-01  The Village (level 1): the uncontacted tribe's huts and fire (their models come later)
     P11-01  the waterspout (level 0): scenery: the waterspout
     P13-01  islet (no name) (level 0): a small islet to land on
     P06-02  the whale (level 0): scenery: the whale
     P03-09  islet (no name) (level 0): a small islet to land on
     + 85 plots with no name, open ocean (every plot of this district not listed above; `ctx.plot` / `ctx.Pxy` tell you whose a square is)

   WHAT STANDS HERE TODAY (pass 1, 2026-11-16, all SEEN on screen): open water 3.5 m deep (the sea, its floor and the skiff / swimmer rules
   are the tool's and the game's); the ocean pack's animals on rings and six fish schools.
   THE VOLCANO ISLAND: dark volcanic ground (plan letters `b` = `dirt_2`, `c` = `scorched` at the cone's foot), the cone (the height map's,
   obsidian, 16 m, never climbed, lava in the crater) with TWO LAVA FLOWS down it (`fall` rows, east and south), black smokers off it; the
   Landing (THE GATE, three boats, torches); THE VILLAGE = THE BIG HUT (walk-in, 109-110 x 15-17, door east to the fire) and THE NORTH HUT
   (walk-in, 114-115 x 12-13, door south), both EMPTY INSIDE, the plan's three open shelters (the cook's 113,15 / the drum's 115,17 / the
   sleepers' 112,18) round the fire, a drying rack; THE SHRINE at the cone's east foot (an idol, an altar, standing stones, two fire baskets);
   boulders and dead trees on the scorched ring, 19 palms, ferns.
   THE SEA'S PLACES: THE WHALE (P06-02: a humpback and a whale showing their backs, dolphins), THE WATERSPOUT (P11-01: drawn, 63 m, its own
   cloud), THE ROCKS (P04-01: eight drawn sea stacks, seals), THE KRAKEN (P07-03: six arms, a taken boat, sharks), THE PALM ROCKS (P02-00,
   P12-09: `palmisle`), FLOTSAM (P06-07), THE SEA LANE (six unlit buoys from the Harbour's Mouth to the Landing), the two islets (a
   castaway's camp with a pirate; seals, flamingos, crabs).

   MISSING / NOT DONE:
   - THE TRIBE HAS NO PEOPLE (mondo: models come later); no model for a hut, a canoe, a totem pole, a mask, whale bones, gulls, black sand
     (the sheet is `dirt_2`), smoke for the crater. The huts' insides are bare (pass 2). Night never looked at (pass 4).
   - Nothing under the water shows (the sea is opaque from above). No fight set up.
   - LEARNT: a whale's model hangs about 3 m over its origin (humpback y -4.6, whale y -3.3 = the back shows); a thing in deep water is
     typed `y: -0.5` + `hover` (this file's `seaAt`); a drawn thing in water is an `arch` row with `y: 0` (`works`); the ocean pack's rocks
     grown big are flat black slabs; `dinosaur_skeleton` is a museum mount; a long `fall` hangs in the air (use short ones); a Meshy prop
     is about 10,000 triangles (place few).
   - FRAME RATE: the cloud's software GPU gives 0.2 fps at the Landing and 1.4-2.0 mid-sea before AND after pass 1 (too low to compare);
     triangles drawn at the Landing 1.62 M -> 2.5 M, mid-sea 1.61 M -> 2.2 M.
   THE HOOKS (all optional; bake-beach.js "THE DISTRICT FILES" runs each stage for S, H, O, T in that order):
     tailor(ctx)  before the heights are made: the plan's squares. Turn each plan building ('B') you build back into its ground with
                  ctx.setRect(x0, y0, x1, y1, ch) / ctx.cell[y][x] = ch (the tool refuses to bake while a 'B' is left that nobody builds).
     build(ctx)   the buildings: ctx.building(id, [sx0, sy0, sx1, sy1, front side], height, row opts, (a, w, d, door) => parts) = a walk-in
                  (a hollow texbuilding + its arch look; returns the frame for ctx.put(B, key, lx, lz, opts) = a prop inside it);
                  ctx.look(id, x, z, rot, a => parts) = a thing that is only drawn.
     place(ctx)   props, palms, people, scatters: ctx.P (a blocker on a square's middle), ctx.dec (decor, off the middle, shares a square),
                  ctx.afloat, ctx.swimmer, ctx.under (sea things), ctx.palm, ctx.native(race, sx, sy, face, say), ctx.feat(row), ctx.props.push(row).
     dress(ctx)   the same tools, run after every district's place (the second pass: THE DRESSING).
     reach        [[sx, sy, 'name'], ...]: squares the walker must reach on foot from the city door (the tool's walk check).
   ctx also carries: C N W H OY, gx gz mx mz r2, rnd (YOUR OWN dice, one stream per district and stage: a new throw at the END of a hook moves
   nothing; a new throw in the middle re-throws only your own later ones), cell plot Pxy flat taken spot, the sheets U WD WD2 SHG FLR GLS COR
   BRK SHUT CORR PAINT, the old rooms' lines sayOf O_SEA O_HARB, and the tool's fixed places MAEL POOL BAY GANG SP SHIP PIER_END LIGHT
   (read them, never move them: they are doors, links and the Dutchman's berth).
   Squares are (sx 0..168 west to east, sy 0..120 north to south), 3.5 m each; a plot is 12 x 12 of them.
   RULES for the thread that holds this file: docs/notes/areas-complexes.md "THE BEACH, THE DISTRICT FILES". This file only; never bake-beach.js,
   layout.json or another district's file without a note on docs/notes/claims.md. Not a game file, never uploaded. */
'use strict';
const B_TRIBE = [[113, 15], [115, 17], [112, 18]];   // the plan's building squares: the tribe's three shelters, one square each
const ISLE = [96, 0, 121, 24];                       // the Volcano Island's box of squares
const G1 = 1.2;                                      // the village's flat sand (a level 1 plot's cap, bake-beach.js CAP[1])
const THATCH = 0xd2b060, POLE = 0x6a4a30, WATTLE = 0xcdb88a, DARK = 0x1a120c, BONE = 0xe8e0cc, OCHRE = 0xa8452a;
/* a thing in open water (the Ocean's own squares only): `y` -0.5 + `hover` = its foot's height over the sea (three-renderer.js THE TIER HEIGHT) */
const seaAt = (ctx, key, sx, sy, up, o) => { const p = ctx.Pxy(sx, sy); if (!p || p.d !== 'O') ctx.errs.push(key + ' is outside the Ocean at ' + sx + ',' + sy); ctx.spot(sx, sy, key, 'sea', true);
    ctx.props.push(Object.assign({ key, x: ctx.mx(sx), z: ctx.mz(sy), y: -0.5, hover: ctx.r2(0.5 + up) }, o || {})); };
/* a drawn row in WORLD metres with its foot at the sea (the Harbour's `works`): everything that stands in water */
const works = (ctx, id, ox, oz, fn) => { const a = ctx.sheet(), X0 = ctx.r2(ox), Z0 = ctx.r2(oz); fn(a); ctx.feat({ k: 'arch', id: 'bch:o_' + id + ':look', x: X0, z: Z0, y: 0, rot: 0, parts: a.P }); };
module.exports = {
tailor(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    B_TRIBE.forEach(q => { cell[q[1]][q[0]] = 'd'; });
    /* THE BLACK GROUND (the plan: "a remote island, black sand under the cone"): the island's sand is dark volcanic grit ('b', `dirt_2`) and
       the squares at the cone's foot are scorched ('c'); both are sand in every other way (bake-beach.js, the two letters are this thread's) */
    const nearCone = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const r = cell[y + dy]; if (r && (r[x + dx] === 'h' || r[x + dx] === 'l')) return true; } return false; };
    const mark = []; for (let y = ISLE[1]; y < ISLE[3]; y++) for (let x = ISLE[0]; x < ISLE[2]; x++) if (cell[y][x] === 'd') mark.push([x, y, nearCone(x, y) ? 'c' : 'b']);
    mark.forEach(q => { cell[q[1]][q[0]] = q[2]; });
},

build(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    /* ── THE VILLAGE (pass 1, 2026-11-16; seen before: three bare roofs on pale sand). The tribe's people come later (mondo: "eventually will
       make models for"), so this is their PLACE: THE BIG HUT (a walk-in long hut, its door to the fire), THE NORTH HUT (a walk-in), the plan's
       three open shelters, the gate at the Landing. Wattle = the wood sheet left its own brown (a light tint), thatch = the shingle sheet in straw. ── */
    const hut = (a, w, h, d, door, roofForm, rh) => {
        a.shell(w, h, d, WD2, WATTLE, door, [1.75, 1.75], 1.5); a.frame(door, d, WD, POLE);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.cyl(sx * (w / 2 + 0.08), 0, sz * (d / 2 + 0.08), 0.16, h + 0.2, WD2, POLE, { seg: 8, uv: 1 });          // corner posts
        a.box(0, h * 0.5, d / 2 + 0.07, w + 0.2, 0.12, 0.08, WD2, POLE); a.box(0, h * 0.5, -d / 2 - 0.07, w + 0.2, 0.12, 0.08, WD2, POLE);                                  // a lashing rail front and back
        for (const sx of [-1, 1]) a.box(sx * (w / 2 + 0.07), h * 0.5, 0, 0.08, 0.12, d + 0.2, WD2, POLE);
        a.roof(roofForm, 0, h, 0, w + 2.2, rh, d + 2.2, SHG, THATCH, { gain: 1.7, uv: [1.2, 1.2] });
        a.box(0, h + rh - 0.12, 0, roofForm === 'pyramid' ? 0.5 : w * 0.5, 0.22, 0.5, SHG, 0x8a6a34, { roof: true });                                                 // the ridge cap
        a.box(door.lx, 0, d / 2 + 0.9, door.cw + 1.6, 0.14, 1.6, FLR, 0xb09870); };                                                                                        // a plank step at the door
    building('bighut', [109, 15, 111, 18, 'E'], 3.4, { leaf: 'leaf_stable', keyIn: WD2, floorIn: FLR }, (a, w, d, door) => {
        hut(a, w, 3.4, d, door, 'hip', 3.8);
        for (const s of [-1, 1]) { const x = door.lx + s * (door.cw / 2 + 0.75); a.cyl(x, 0, d / 2 + 1.5, 0.2, 3.3, WD2, OCHRE, { seg: 8, uv: 1 }); a.cyl(x, 3.3, d / 2 + 1.5, 0.3, 0.16, WD2, POLE, { seg: 8 });
            for (const y of [0.9, 1.7, 2.5]) a.cyl(x, y, d / 2 + 1.5, 0.23, 0.14, null, BONE, { seg: 8 }); }                                                           // two painted door posts, banded in bone white
        a.box(door.lx, 3.05, d / 2 + 1.5, door.cw + 2.4, 0.2, 0.26, WD2, POLE);
        for (const x of [-3.4, 3.2]) { a.P.push({ s: 'quad', p: [x, 1.5, r2(d / 2 + 0.065)], size: [0.9, 0.7], key: null, tint: DARK, kind: 'wall' }); for (const k of [-0.22, 0.22]) a.box(x + k, 1.5, d / 2 + 0.09, 0.06, 0.7, 0.05, WD2, POLE); } });   // two barred window holes
    building('northhut', [114, 12, 116, 14, 'S'], 2.9, { leaf: 'leaf_wooden', keyIn: WD2, floorIn: FLR }, (a, w, d, door) => { hut(a, w, 2.9, d, door, 'pyramid', 3.4);
        a.P.push({ s: 'quad', p: [2.0, 1.4, r2(d / 2 + 0.065)], size: [0.8, 0.6], key: null, tint: DARK, kind: 'wall' }); for (const k of [-0.2, 0.2]) a.box(2.0 + k, 1.4, d / 2 + 0.09, 0.06, 0.6, 0.05, WD2, POLE); });
    /* the plan's three open shelters: four posts, a plank floor, a cone of thatch; each has a use (the dressing below): the cook's, the drum's, the sleepers' */
    B_TRIBE.forEach((q, i) => look('shelter' + (i + 1), mx(q[0]), mz(q[1]), 0, a => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.cyl(sx * 1.5, 0, sz * 1.5, 0.12, 2.35, WD2, POLE, { seg: 8, uv: 1 });
        for (const s of [-1, 1]) { a.box(0, 2.2, s * 1.5, 3.3, 0.12, 0.12, WD2, POLE); a.box(s * 1.5, 2.2, 0, 0.12, 0.12, 3.3, WD2, POLE); }
        a.cyl(0, 2.3, 0, 2.8, 2.0, SHG, THATCH, { r2: 0, seg: 10, roof: true, gain: 1.7, uv: [1.2, 1.2] }); a.cyl(0, 2.3, 0, 2.8, 0.02, WD2, 0x4a3626, { seg: 10, roof: true }); a.box(0, 0, 0, 2.7, 0.1, 2.7, FLR, 0xb09870); }));
    /* THE GATE at the Landing (the way up from the boats): two tall posts, a lintel, bone-white bands; bone-white bands */
    look('gate', gx(108), gz(20), 0, a => { for (const s of [-1, 1]) { a.cyl(s * 2.4, -0.6, 0, 0.24, 4.9, WD2, OCHRE, { seg: 8, uv: 1 }); for (const y of [1.2, 2.2, 3.2]) a.cyl(s * 2.4, y, 0, 0.27, 0.16, null, BONE, { seg: 8 }); a.cyl(s * 2.4, 4.3, 0, 0.1, 1.1, WD2, POLE, { r2: 0.02, seg: 6 }); }
        a.box(0, 3.7, 0, 6.2, 0.26, 0.3, WD2, POLE); a.box(0, 3.3, 0, 5.2, 0.14, 0.2, WD2, POLE); });
    /* a drying rack by the cook's shelter and a boat rest on the Landing: poles lashed in the village's own wood */
    look('rack', mx(116), gz(16) + 0.4, 0, a => { for (const s of [-1, 1]) { a.cyl(s * 1.3, 0, 0, 0.07, 1.9, WD2, POLE, { seg: 6 }); } a.box(0, 1.8, 0, 3.0, 0.08, 0.08, WD2, POLE); a.box(0, 1.2, 0, 3.0, 0.06, 0.06, WD2, POLE); });
},

place(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    /* ── THE SEA'S ANIMALS (the first delivery's; the whales now show their backs: seen on screen, at y -2.6 nothing of them broke the opaque sea) ── */
    [[60, 20, 'ocean_whale'], [70, 30, 'ocean_humpback'], [60, 80, 'ocean_dolphin'], [62, 82, 'ocean_dolphin'], [84, 50, 'ocean_manta'], [100, 40, 'ocean_turtle'], [120, 60, 'ocean_dolphin'], [76, 100, 'ocean_manta'],
     [50, 100, 'ocean_turtle'], [140, 12, 'ocean_shark'], [30, 112, 'ocean_stingray'], [162, 60, 'ocean_humpback'], [90, 70, 'ocean_tuna'], [130, 28, 'ocean_dolphin']].forEach(q => swimmer(q[2], q[0], q[1], /whale|humpback/.test(q[2]) ? { y: /humpback/.test(q[2]) ? -4.6 : -3.3, hover: 0, swim: { r: 14, v: 1.2, bob: 0.3 } }   /* seen on screen: the models hang about 3 m over their own origin; at -1.5 the whole whale flew over the sea, at these depths the back shows */ : { swim: { r: 5 + (q[0] % 4), v: 1.2 + (q[1] % 5) * 0.25, bob: 0.25 } }));
    for (const q of [[52, 30], [80, 20], [70, 70], [110, 50], [60, 110], [150, 70]]) feat({ k: 'scatter', key: 'fish_school', n: 3, x: mx(q[0]), z: mz(q[1]), r: 40, seed: q[0], sea: true });
    P('palm_tree', 160, 20, { h: 4.2 }); dec('ocean_conch', 161, 21); dec('sea_chest', 159, 20); P('palm_tree', 40, 112, { h: 3.8 }); dec('ocean_starfish', 41, 112); dec('fallen_log', 39, 113);    // the two unnamed islets
    /* THE VOLCANO ISLAND: the landing, the village round its fire, palms along the shore, the cone's glow */
    props.push({ key: 'campfire', x: mx(114), z: mz(17), glow: 0.8 }); taken.add('114:17');
    dec('taiko_drum', 115, 17); dec('spear', 115, 16); dec('spear', 112, 19); dec('skull_pile', 115, 18); dec('item_ward_totem', 112, 14); dec('wooden_bucket', 114, 19); dec('fallen_log', 113, 19);
    P('cave_torch', 110, 20); P('cave_torch', 117, 14); P('cave_torch', 106, 20); dec('meshy_rowboat', 108, 21, { face: 80 });
    [[99, 9], [99, 13], [101, 17], [104, 20], [111, 21], [113, 20], [117, 10], [114, 5], [108, 3]].forEach(q => palm(q[0], q[1]));
    feat({ k: 'scatter', key: 'cave_stone', n: 14, x: mx(106), z: mz(10), r: 30, seed: 41 });

    /* ── PASS 1 (2026-11-16), THE ISLAND ── */
    /* the village: the cook's shelter (113,15), the drum's (115,17), the sleepers' (112,18) */
    dec('cauldron', 113, 15); dec('stock_pots', 113, 16); dec('psx_meat_1', 116, 16, { y: r2(G1 + 1.25), floor: true }); dec('psx_fish_skeleton_mp_1', 116, 16, { y: r2(G1 + 1.3), floor: true }); dec('greek_amphora', 114, 15); dec('stone_urn', 112, 16);
    dec('instrument_drum', 115, 17); dec('instrument_maracas', 116, 17); dec('psx_carpet_mp_1', 112, 18, { y: 0.12 }); dec('spear', 111, 19);
    /* THE SHRINE at the cone's foot (east): an idol with its back to the fire mountain, an altar before it, standing stones, two fire baskets */
    P('demon_statue', 113, 10, { face: 90 }); P('stone_altar', 115, 10, { face: 90 }); P('sarsen', 113, 8); P('menhir', 115, 8, { face: 40 }); P('menhir', 116, 9); P('sarsen', 116, 11, { face: 70 }); P('menhir', 112, 11, { face: 20 }); P('brazier', 114, 9); P('brazier', 114, 11);
    dec('skull_pile', 115, 11); dec('greek_amphora', 115, 9); dec('psx_gold_bar_pcs_1', 115, 10, { y: 0.97 });
    /* rock thrown from the cone (the graveyard pack's boulders, grown; SEEN: the ocean pack's rocks grown are flat black slabs with no sheet), dead trees on the scorched ring */
    [[100, 14, 4.2], [112, 12, 3.4], [100, 6, 5.0], [112, 5, 3.8], [103, 16, 2.8], [107, 16, 3.6], [98, 11, 3.0], [113, 6, 2.6]].forEach((q, i) => P('psxg_rock_' + (1 + i % 4), q[0], q[1], { h: r2(q[2] * 0.7), face: (i * 67) % 360 }));
    [[102, 4, 'dead_snag'], [101, 15, 'psxg_dead_tree_1'], [108, 16, 'dead_snag'], [112, 7, 'psxg_dead_tree_2'], [98, 8, 'psxg_dead_tree_1'], [105, 17, 'hollow_dead_tree']].forEach(q => P(q[2], q[0], q[1], { face: (q[0] * 37) % 360 }));
    /* the far shore (west and north): more palms, ferns under them, boats on the Landing (SEEN and taken out: `dinosaur_skeleton` is a museum mount on a plinth, not a whale's bones) */
    [[98, 15], [100, 18], [103, 19], [106, 21], [114, 19], [117, 12], [115, 6], [111, 3], [104, 3], [101, 5]].forEach(q => palm(q[0], q[1]));
    [[100, 16], [105, 20], [116, 8], [109, 4], [99, 14]].forEach(q => dec('fern', q[0], q[1]));   // (few: a fern is 7,700 triangles)
    dec('rowboat', 105, 21, { face: 15 }); dec('rowboat', 111, 20, { face: 340 }); dec('ocean_crab', 104, 21); dec('ocean_crab', 110, 21); dec('ocean_conch', 107, 21); dec('ocean_starfish', 103, 20);
    /* LAVA DOWN THE CONE (data.js THE WATERFALLS, the liquid = lava): two flows over the crater's lip, east to the shrine's side and south to
       the Landing's. SEEN: one long fall is a ballistic arc that hangs in the air off the cone; a flow = four short falls, one a square, each
       from the cone's own height on one square line to the next (the cone falls 4.2 m a square), so it runs down the rock as cascades */
    for (let k = 0; k < 8; k++) { const y0 = r2(15.7 - (k ? 1.6 : 0) - k * 1.72), y1 = r2(14.1 - (k + 1) * 1.72), o = { w: r2(3.0 - k * 0.14), y0, y1, key: 'lava', out: 1.75, foam: false };   // (SEEN: whole-square falls still arched 2 m off the rock from the side; half-square ones typed at the cone's own height still hung 1 m off it, so they are typed 1 m into the rock)
        feat(Object.assign({ k: 'fall', x: r2(gx(108) + 0.2 + k * 1.75), z: mz(10), face: 90 }, o)); feat(Object.assign({ k: 'fall', x: mx(105), z: r2(gz(12) + 0.2 + k * 1.75), face: 180 }, o)); }

    /* ── PASS 1, THE SEA: things to sail to (every one on the Ocean's own squares; the sea between them stays open) ── */
    /* THE WHALE (plot P06-02, the plan's "scenery: the whale"): a humpback and a whale showing their backs, a pod of dolphins round them */
    swimmer('ocean_humpback', 78, 30, { y: -4.5, hover: 0, swim: { r: 9, v: 1.0, bob: 0.5 } }); swimmer('ocean_whale', 75, 27, { y: -3.2, hover: 0, swim: { r: 7, v: 1.2, bob: 0.4 } });
    [[80, 27], [81, 29], [74, 31], [77, 33]].forEach(q => swimmer('ocean_dolphin', q[0], q[1], { swim: { r: 4 + (q[0] % 3), v: 2.0, bob: 0.3 } }));
    /* THE WATERSPOUT (plot P11-01, the plan's "scenery: the waterspout"): drawn, 62 m of twisting water from a ring of spray up into its own
       dark cloud (the game's `waterspout` is a sky landmark of the shell, the tool's; this one stands on the plot and is sailed round) */
    works(ctx, 'spout', mx(138), mz(18), a => { const WAT = 'water', NSEG = 30, SH = 2.0, bend = i => [r2(3.4 * Math.sin(i * 0.2)), r2(2.4 * Math.cos(i * 0.17) - 2.4)], rad = i => r2(i < 10 ? 2.4 - i * 0.11 : 1.3 + (i - 10) * (i - 10) * 0.016);
        a.cyl(0, 0, 0, 8.5, 1.2, WAT, 0xffffff, { r2: 5, seg: 16, cap: false, glow: 0.35, ds: true }); a.cyl(0, 0.6, 0, 5.2, 3.0, WAT, 0xeaf6ff, { r2: 2.5, seg: 14, cap: false, glow: 0.3, ds: true });
        for (let i = 0; i < NSEG; i++) { const b0 = bend(i); a.cyl(b0[0], 3.2 + i * SH, b0[1], rad(i) + 0.12, SH + 0.1, WAT, i % 2 ? 0xd6ecf8 : 0xcae4f4, { r2: rad(i + 1) + 0.12, seg: 12, cap: false, glow: 0.22, ds: true }); }
        /* its cloud: plain paint (SEEN: the terrain key `storm` draws black here), a dark belly the funnel runs into, grey heads over it */
        const top = bend(NSEG), CY = 3.2 + NSEG * SH; a.cyl(top[0], CY - 1.5, top[1], rad(NSEG), 5, null, 0x6c7684, { r2: 27, seg: 18, cap: false, ds: true, glow: 0.55 });   // (lit by its own glow: a face that looks down draws black)
        [[0, 0, 28, 9, 0x9aa4b2], [-17, 6, 16, 7, 0xb4bcc8], [16, -9, 18, 8, 0xa6aebc], [6, 15, 14, 6, 0xbcc4d0], [-8, -14, 13, 6, 0xaab2c0]].forEach(q => a.P.push({ s: 'dome', p: [r2(top[0] + q[0]), r2(CY + 3.4), r2(top[1] + q[1])], r: q[2], h: q[3], seg: 16, rings: 4, tint: q[4], glow: 0.35 })); });
    [[136, 16], [140, 19], [137, 21]].forEach(q => feat({ k: 'scatter', key: 'fish_school', n: 2, x: mx(q[0]), z: mz(q[1]), r: 12, seed: q[0], sea: true }));
    /* THE ROCKS (plot P04-01, no name in the plan): black sea stacks, seals hauled out between them */
    works(ctx, 'rocks', mx(54), mz(18), a => { let sd = 77; const rn = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
        /* a stack = tapering seven-sided tiers in the cliff sheet, each a little smaller, turned and off its middle (SEEN: the ocean pack's
           rocks grown to this size are flat black slabs; straight prisms read as a stepped cake; a dark tint on `rocks_5` is black here) */
        const stack = (x, z, r, h) => { const tiers = Math.max(2, Math.round(h / 2.2)); let y = -3.6, rr = r, cx = x, cz = z;
            for (let t = 0; t < tiers; t++) { const th = t ? (h / tiers) * (0.8 + rn() * 0.4) : 3.6 + h / tiers, r1 = rr * (t === tiers - 1 ? 0.5 : 0.8 + rn() * 0.1);
                a.cyl(r2(cx), r2(y), r2(cz), r2(rr), r2(th), 'rocks_5', t % 2 ? 0xe4e4ea : 0xcfcfd8, { r2: r2(r1), seg: 7, a0: Math.round(rn() * 50), uv: [3.5, 3.5] }); y += th; rr = r1 * 1.04; cx += (rn() - 0.5) * r * 0.1; cz += (rn() - 0.5) * r * 0.1; } };
        [[-7, -3, 3.4, 9], [0, 0, 4.6, 14], [4, -7, 2.6, 6], [-3, 7, 3.0, 7.5], [8, 4, 3.6, 10.5], [-11, 4, 2.2, 4], [12, -3, 2.4, 5], [3, 9, 1.8, 2.2]].forEach(q => stack(q[0], q[1], q[2], q[3])); });
    [[52, 17], [54, 18], [55, 16], [53, 20], [56, 19]].forEach(q => seaAt(ctx, 'ocean_rock_7', q[0], q[1], -1.6, { h: 1.2 }));   // their blockers: a small rock inside each stack's foot (the skiff and the swimmer go round)
    seaAt(ctx, 'ocean_seal_resting', 54, 20, 0.0, { swim: false }); swimmer('ocean_seal', 50, 17, { swim: { r: 4, v: 1.4, bob: 0.2 } }); swimmer('ocean_seal', 57, 21, { swim: { r: 5, v: 1.2, bob: 0.2 } });
    /* THE KRAKEN (plot P07-03): arms out of the water in a ring, a boat it has taken, sharks waiting */
    [[89, 41, 'tentacle', 0], [91, 40, 'tentacle2', 60], [92, 42, 'tentacle', 130], [91, 44, 'tentacle2', 200], [89, 44, 'tentacle', 260], [88, 42, 'tentacle2', 320]].forEach(q => seaAt(ctx, q[2], q[0], q[1], -1.4, { face: q[3], h: 5.2, noBlock: true }));
    seaAt(ctx, 'rowboat', 90, 42, -0.25, { face: 30 }); swimmer('ocean_shark', 86, 40, { swim: { r: 7, v: 1.6, bob: 0.2 } }); swimmer('ocean_hammerhead', 94, 45, { y: -0.7, hover: 0.4, swim: { r: 6, v: 1.3, bob: 0.2 } });
    /* THE PALM ROCKS (plots P02-00 and P12-09): one tiny island with a palm each */
    seaAt(ctx, 'palmisle', 30, 6, -0.6, { face: 40 }); seaAt(ctx, 'palmisle', 150, 114, -0.6, { face: 200 });
    /* FLOTSAM (plot P06-07): what a lost cargo leaves: crates, drums, a bottle, a ring, a boat adrift */
    [[77, 89, 'psx_wooden_crate_5'], [79, 91, 'psx_supply_crate_1_4'], [80, 88, 'psx_metal_barrel_mp_2'], [76, 92, 'psx_supply_crate_1_2_empty'], [81, 90, 'psx_glass_bottle_2'], [78, 87, 'beach_life_ring'], [75, 90, 'psx_metal_barrel_mp_0']]
        .forEach((q, i) => seaAt(ctx, q[2], q[0], q[1], /bottle|ring/.test(q[2]) ? 0.0 : -0.2, { face: (i * 71) % 360 }));
    seaAt(ctx, 'meshy_rowboat', 78, 90, -0.2, { face: 250 });
    /* THE SEA LANE: unlit buoys from the Harbour's Mouth out to the Landing (the way a skiff finds the island) */
    [[50, 44], [62, 38], [74, 40], [86, 32], [96, 27], [104, 24]].forEach(q => afloat('sea_buoy', q[0], q[1], { noLight: true }));
    /* the two islets: a castaway's camp (north-east), a haul-out of seals, crabs and flamingos (south-west) */
    palm(158, 20); palm(162, 19); dec('meshy_campfire_ring', 160, 21); dec('fallen_log', 161, 20); dec('psx_glass_bottle_1', 159, 21); dec('ship_anchor', 162, 21); dec('rowboat', 158, 21, { face: 120 }); dec('ocean_crab', 160, 19); dec('ocean_crab', 162, 20);
    native('pirate', 160, 19, 180);
    palm(38, 112); palm(42, 111); dec('ocean_seal_resting', 39, 111); dec('ocean_seal_resting', 41, 113); dec('ocean_seal_resting', 38, 113); dec('flamingo', 42, 112); dec('flamingo', 43, 112); dec('psxg_rock_2', 37, 112); dec('psxg_rock_3', 40, 110); dec('ocean_crab', 40, 113); dec('ocean_sand_dollar', 42, 113);
},

dress(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    /* the Ocean: black smokers off the volcano, a second pod of dolphins, rays and tuna on the long crossings */
    [[124, 10], [126, 14], [122, 18], [127, 8]].forEach(q => under('sea_vent', q[0], q[1], -3.5));
    [[72, 16, 'ocean_dolphin'], [74, 18, 'ocean_dolphin'], [76, 15, 'ocean_dolphin'], [110, 30, 'ocean_stingray'], [88, 96, 'ocean_tuna'], [140, 24, 'ocean_manta'], [46, 96, 'ocean_seal'], [164, 96, 'ocean_turtle'], [20, 108, 'ocean_stingray']]
        .forEach(q => swimmer(q[2], q[0], q[1], { swim: { r: 5 + (q[0] % 4), v: 1.2 + (q[1] % 5) * 0.25, bob: 0.25 } }));
},
};
