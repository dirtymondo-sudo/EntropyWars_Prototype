/* THE BEACH · THE BERMUDA TRIANGLE (district T, 25 plots: a 3-4-5 right triangle of sea, sides 6, 8 and 10 plots) — the district file (2026-11-16).
   Part of `node bake-beach.js` (its one hook). Notes: docs/notes/areas-complexes.md "THE BEACH ON PLOTS" + "THE BEACH, THE DISTRICT FILES".
   DOOR_MASTER: "it's a right triangle" (Room 345). West point = the Lighthouse Rock, right angle = the island, north point = the Maelstrom.

   THE PLOTS (docs/areas/beach/layout.json):
     P12-03  The Maelstrom (level 0): the whirlpool at the north point: the way down  [the plan's way out: The Deep (the whirlpool)]
     P10-05  No Fixed Position (level 0): open water; the Flight 19 tape
     P10-06  The Sandbar (level 0): the sandbar, the way over
     P08-07  The Wreck Islet (level 0): a scrap of sand and a wreck
     P09-07  The Reef (level 0): shallows, coral
     P11-07  The Jetty (level 1): the island's jetty; the skiff lands here
     P12-07  The Cay (level 2): LANDMARK: the cay, its dune and the lookout, at the right angle
     P05-08  The Lighthouse Rock (level 3): the lighthouse on its rock, at the west point
     P11-08  The Lagoon (level 0): still green water inside the reef  [the plan's way out: DOOR HQ pool]
     P12-08  The Island Beach (level 1): white sand, wreckage
     no name (open water or bare sand): P11-04 P12-04 P11-05 P12-05 P08-06 P09-06 P11-06 P12-06 P07-07 P10-07 P06-08 P07-08 P08-08 P09-08 P10-08

   WHAT STANDS HERE TODAY: the LIGHTHOUSE on its rock (3.4 m; the game's own, the beam turns; the tape lies there: ctx.LIGHT is the tool's);
   the WRECK ISLET (the old wreck, a chest, skulls, an octopus under it); THE REEF (waded, five coral scatters, clams, tube coral, reef
   fish); the Sandbar's seals; jellyfish in the middle water; THE MAELSTROM (the drop, a ring of four buoys, sharks, an eel and a squid
   down the hole, coral and weed round it); THE ISLAND at the right angle: the Jetty (the island's skiff, a lantern, a ring), the Cay and
   its dune, the Lagoon, the Island Beach (palms, a camp fire, a gun, a telescope, a rowboat, an umbrella, shells).
   People: siren (Wreck Islet), pirate (the island), jellyfish (Lagoon), sharkman (Island Beach), deep sea fish (Reef).
   THE TOOL'S, NOT THIS FILE'S (doors and links, checked against data.js on every bake): ctx.MAEL (link `bermuda_abyss`, down to The
   Deep), ctx.POOL (link `weir_bermuda`, Room 8's weir, the tide pool by the Lagoon), ctx.BAY (Room 345's cabin door on the Island
   Beach + the fight marker beside it), the tape on the Lighthouse Rock. Their squares are kept clear by the tool.

   MISSING / NEVER SEEN ON SCREEN (from the notes + the board):
   - Seen 11-15 from far: the Triangle's island draws. Never seen: the island's and the Reef's pieces up close, the Maelstrom (there is no
     whirlpool to look at from above beyond the buoys and the link's own mark), anything under the water, the wreck, the lighthouse beam here.
   - Not carried over from the old rooms: the old cay's LOOKOUT and its stair (the plan's own words for the Cay: "its dune and the lookout").
     The undersea coral and fish of the old dive route are only partly placed (the Reef, the Maelstrom).
   - "No Fixed Position" (P10-05, the Flight 19 tape) is empty water; the Island Beach's "wreckage" is a box and a sheet of paper.
   - 15 no-name plots are empty water. The Triangle's edge is not marked on the sea (only `plots.triangle` for the map).
   - No residents with routines; Room 345's fight is entered at the cabin door, nothing else is set up. Still mondo's open question: a
     Deep-to-Area-51 way.
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
const B_WRECK = [99, 89];   // the plan's building square: the old wreck (a prop on sand). The lighthouse's squares are ctx.LIGHT (the tool's: the tape lies there)
module.exports = {
tailor(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    setRect(LIGHT[0], LIGHT[1], LIGHT[0] + 2, LIGHT[1] + 2, 'r'); cell[B_WRECK[1]][B_WRECK[0]] = 'd';
},

place(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    props.push({ key: 'lighthouse', x: gx(LIGHT[0] + 1), z: gz(LIGHT[1] + 1), face: 0 });                                         // on its rock at the west point (the beam turns; the tape)
    props.push({ key: 'ship_wreck', x: mx(B_WRECK[0]), z: mz(B_WRECK[1]), face: 30 }); dec('sea_chest', 98, 88); dec('skull_pile', 100, 90); native('siren', 100, 88, 250, sayOf(O_SEA, 'siren'));
    [[146, 37], [154, 37], [146, 47], [154, 47]].forEach(q => afloat('sea_buoy', q[0], q[1]));                                         // the Maelstrom's ring of four red buoys
    props.push({ key: 'ocean_shark', x: MAEL.x, z: MAEL.z, y: -4.2, hover: 0, swim: { r: 9, v: 1.3, bob: 0.2 } }, { key: 'ocean_hammerhead', x: MAEL.x, z: MAEL.z, y: -5.4, hover: 0, swim: { r: 6, v: 1.1, bob: 0.2, dir: -1 } });
    swimmer('ocean_shark', 104, 92, { y: -0.85, hover: 0.25, swim: { r: 14, v: 1.4, bob: 0.1 } }); dec('ocean_seal_resting', 122, 72); dec('ocean_seal_resting', 126, 73); dec('ocean_rock_7', 119, 72);
    swimmer('ocean_moon_jelly', 124, 62, { y: -1.2, hover: 0 }); swimmer('ocean_box_jelly', 128, 66, { y: -1.4, hover: 0 }); swimmer('ocean_bioluminescent_jelly', 120, 80, { y: -1.2, hover: 0 }); swimmer('ocean_moon_jelly_pulsing', 136, 58, { y: -1.0, hover: 0 });
    for (const k of ['ocean_coral', 'ocean_coral_3', 'ocean_coral_6', 'coral_fan', 'coral_brain']) feat({ k: 'scatter', key: k, n: 8, x: mx(113), z: mz(90), r: 16, seed: k.length * 7, sea: true });   // THE REEF
    feat({ k: 'scatter', key: 'ocean_coral_2', n: 5, x: MAEL.x, z: MAEL.z, r: 17, seed: 85, sea: true }); feat({ k: 'scatter', key: 'ocean_seaweed', n: 6, x: MAEL.x, z: MAEL.z, r: 15, seed: 88, sea: true });
    /* the island at the right angle: the Jetty, the Cay and its dune, the Lagoon, the Island Beach */
    for (let y = 84; y < 108; y++) for (let x = 132; x < 156; x++) if (cell[y][x] === 't') palm(x, y);
    [[142, 86], [150, 86], [153, 92], [141, 95], [152, 104], [143, 106]].forEach(q => palm(q[0], q[1]));
    P('campfire', 148, 99); dec('folding_chair', 149, 100); dec('cardboard_box', 147, 101); dec('paper_sheet', 148, 101, { y: 0.01 }); P('signpost', 141, 92, { face: 270 }); dec('wet_floor_sign', 140, 90);
    dec('ocean_crab', 150, 96); dec('ocean_starfish', 143, 98); dec('ocean_conch', 152, 100); dec('ocean_sand_dollar', 145, 104); dec('dockring', 133, 90); P('railway_lantern', 132, 89);
    props.push({ key: 'skiff', x: gx(131), z: gz(90), y: 0.32, face: 90 });                                                           // the island's own skiff, at the Jetty
    native('pirate', 144, 93, 220, sayOf(O_SEA, 'pirate')); native('jellyfish', 139, 104, 20); native('sharkman', 151, 102, 300); native('deep sea fish', 113, 91, 90);
},

dress(ctx) {
    const { C, N, W, H, OY, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, flat, taken, spot, feat, props, building, put, look, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT } = ctx;   // eslint-disable-line no-unused-vars
    /* the Bermuda Triangle: an eel and a squid down the Maelstrom's
       hole, an octopus under the wreck, clams and tube coral and reef fish on the Reef, a gun and a telescope and a boat on the island */
    props.push({ key: 'ocean_eel', x: r2(MAEL.x + 3), z: r2(MAEL.z - 3), y: -5.8, hover: 0 }, { key: 'ocean_squid', x: r2(MAEL.x - 3), z: r2(MAEL.z + 3), y: -4.8, hover: 0 });
    under('ocean_octopus', 97, 91, -1.6); [[110, 86], [114, 92], [117, 94]].forEach(q => under('giant_clam', q[0], q[1], -0.8)); [[111, 89], [116, 91], [113, 94], [109, 87]].forEach(q => under('coral_tube', q[0], q[1], -0.8));
    [[112, 88, 'ocean_clownfish'], [115, 92, 'ocean_dory'], [110, 90, 'ocean_fish'], [117, 90, 'ocean_fish_2'], [113, 92, 'ocean_fish_3'], [114, 87, 'ocean_brown_fish']].forEach(q => under(q[2], q[0], q[1], -0.5));
    P('ship_cannon', 150, 105, { face: 180 }); P('brass_telescope', 151, 88, { face: 90 }); P('rowboat', 152, 98, { face: 60 }); dec('ocean_seal_resting', 142, 100); dec('psxg_rock_2', 153, 94);
    P('pool_umbrella', 145, 98); dec('pool_lounger', 146, 98, { face: 90 });
},
};
