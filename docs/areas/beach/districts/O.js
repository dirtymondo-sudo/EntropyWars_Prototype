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

   WHAT STANDS HERE TODAY: open water 3.5 m deep (the sea, its floor and the skiff / swimmer rules are the tool's and the game's); the
   ocean pack's animals swimming rings (whales, a humpback, dolphin pods, mantas, rays, turtles, tuna, a shark, a seal) and six fish schools;
   THE VOLCANO ISLAND: the cone (the height map's, obsidian, 16 m, never climbed, lava in the crater), black smokers off it, the Landing
   (a rowboat, torches), the VILLAGE = three open thatch shelters (drawn only, squares 113,15 / 115,17 / 112,18) round a fire, a drum,
   spears, a totem, skulls, nine palms, a scatter of stones; the two no-name islets (a palm and a chest; a palm and a log).

   MISSING / NEVER SEEN ON SCREEN (from the notes + the board):
   - Seen 11-15 from far: the Volcano Island draws. Never seen: the village up close, the smokers, anything under the water (the sea is
     opaque from above), the animals' rings, the two islets.
   - THE TRIBE HAS NO PEOPLE (mondo: models come later) and no proper huts; there is no volcano MODEL (the cone is ground).
   - The plan's two scenery plots are not built: "the waterspout" (P11-01) and "the whale" (P06-02; a whale swims near, nothing marks the plot).
   - 85 plots are empty water: nothing to find on a crossing but animals. TRIED, NOT SHIPPED: the `palmisle` tiny islands and the kraken
     `tentacle` models did not show at any height in deep water. A whale with a `hover` flies over the sea (use y -2.6, hover 0).
   - The frame rate of the 588 x 420 m sea room was never measured. No fight set up.
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
module.exports = {
tailor(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    B_TRIBE.forEach(q => { cell[q[1]][q[0]] = 'd'; });
},

build(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    /* the tribe's three open shelters on the Volcano Island (their people come later: mondo "eventually will make models for"): four posts and a
       cone of thatch each, walked under */
    B_TRIBE.forEach((q, i) => look('shelter' + (i + 1), mx(q[0]), mz(q[1]), 0, a => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.cyl(sx * 1.5, 0, sz * 1.5, 0.11, 2.3, WD2, 0x6a5038);
        a.cyl(0, 2.3, 0, 2.7, 1.9, SHG, 0xb89a52, { r2: 0, seg: 8, roof: true }); a.box(0, 0, 0, 2.6, 0.1, 2.6, FLR, 0x9a8460); }));
},

place(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    [[60, 20, 'ocean_whale'], [70, 30, 'ocean_humpback'], [60, 80, 'ocean_dolphin'], [62, 82, 'ocean_dolphin'], [84, 50, 'ocean_manta'], [100, 40, 'ocean_turtle'], [120, 60, 'ocean_dolphin'], [76, 100, 'ocean_manta'],
     [50, 100, 'ocean_turtle'], [140, 12, 'ocean_shark'], [30, 112, 'ocean_stingray'], [162, 60, 'ocean_humpback'], [90, 70, 'ocean_tuna'], [130, 28, 'ocean_dolphin']].forEach(q => swimmer(q[2], q[0], q[1], /whale|humpback/.test(q[2]) ? { y: -2.6, hover: 0, swim: { r: 14, v: 1.2, bob: 0.3 } }   /* seen on screen: with a hover the whales flew over the sea */ : { swim: { r: 5 + (q[0] % 4), v: 1.2 + (q[1] % 5) * 0.25, bob: 0.25 } }));
    for (const q of [[52, 30], [80, 20], [70, 70], [110, 50], [60, 110], [150, 70]]) feat({ k: 'scatter', key: 'fish_school', n: 3, x: mx(q[0]), z: mz(q[1]), r: 40, seed: q[0], sea: true });
    P('palm_tree', 160, 20, { h: 4.2 }); dec('ocean_conch', 161, 21); dec('sea_chest', 159, 20); P('palm_tree', 40, 112, { h: 3.8 }); dec('ocean_starfish', 41, 112); dec('fallen_log', 39, 113);    // the two unnamed islets
    /* THE VOLCANO ISLAND: the landing, the village round its fire, palms along the shore, the cone's glow */
    props.push({ key: 'campfire', x: mx(114), z: mz(17), glow: 0.8 }); taken.add('114:17');
    dec('taiko_drum', 113, 17); dec('spear', 115, 16); dec('spear', 112, 19); dec('skull_pile', 115, 18); dec('item_ward_totem', 111, 16); dec('wooden_bucket', 114, 19); dec('fallen_log', 113, 19);
    P('cave_torch', 110, 20); P('cave_torch', 116, 14); P('cave_torch', 106, 20); dec('meshy_rowboat', 108, 21, { face: 80 });
    [[99, 9], [99, 13], [101, 17], [104, 20], [111, 21], [113, 20], [117, 10], [114, 5], [108, 3]].forEach(q => palm(q[0], q[1]));
    feat({ k: 'scatter', key: 'cave_stone', n: 14, x: mx(106), z: mz(10), r: 30, seed: 41 });
},

dress(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    /* the Ocean: black smokers off the volcano, a second pod of dolphins, rays and tuna on the long crossings. (TRIED, NOT SHIPPED: the `palmisle`
       tiny islands and the kraken `tentacle` models round the Maelstrom did not show in the probe at any `y`; they need a look at how a misc model
       stands in deep water before they go in.) */
    [[124, 10], [126, 14], [122, 18], [127, 8]].forEach(q => under('sea_vent', q[0], q[1], -3.5));
    [[72, 16, 'ocean_dolphin'], [74, 18, 'ocean_dolphin'], [76, 15, 'ocean_dolphin'], [110, 30, 'ocean_stingray'], [88, 96, 'ocean_tuna'], [140, 24, 'ocean_manta'], [46, 96, 'ocean_seal'], [164, 96, 'ocean_turtle'], [20, 108, 'ocean_stingray']]
        .forEach(q => swimmer(q[2], q[0], q[1], { swim: { r: 5 + (q[0] % 4), v: 1.2 + (q[1] % 5) * 0.25, bob: 0.25 } }));
},
};
