---
name: plot-dungeons-plan-20261114
description: Puzzle dungeons ("PLOT DUNGEONS") 11-14: mondo's rules for them, where the plan lives, how the ten prototypes are built (data rows, easy to add levels), mondo's control rules from his review (levers, no console, wide view), what is still stand-in
metadata:
  type: project
  modified: 2026-11-14T11:04:54.044Z
---
Plan (thread in the owner project); BUILD (thread in the owner project)
("Build the puzzle dungeons"). mondo 11-14 03:00 uploaded two prototype packs (copies /mnt/project-files/dungeons/source/).

- MONDO 11-14 09:32 (his rules): "We are just testing out the puzzles dungeons right now" = a STANDALONE TEST BUILD; "Dungeons is not
  a separate mode, it will be a part of the stoy mode and connect" (puzzles ARE allowed in dungeons; the old no-puzzles rule does not
  cover them); "no swaps, just build all of them" = all TEN; enemies depend on the zone and who he wants there, never tie a dungeon
  type to a place or enemies; names / wiring / enemies low priority; plan §13 recommendations = decisions.
- MONDO 11-14 (build ask): "Make it so it is easy for us to tweak them and build on top of them like add more complex stuff, like
  adding more/harder levels to the dungeon types. But first lets just get the 10 prototypes built".
- BUILT 11-14 (PR #1387, live): all ten prototypes, each walked start to exit in the cloud browser. Entry: Settings > Developer > Open Plot Dungeons
  (or `?pd=crypt1` etc.). HOW TO TWEAK / ADD A LEVEL + the honest limits: repo docs/notes/areas-complexes.md "PLOT DUNGEONS, THE
  BUILD". Short version: data.js `PD_DUNGEONS.<type>.levels[]` between PD-LEVELS-BEGIN/END, a harder level = one more row; rooms are
  built at load by `pdInstall()` (no bake, no json); `node bake-dungeons.js` checks and prints each shortest solution.
- SECOND PASS 11-15 (PR #1398, live). MONDO's RULES from his review (11-14): controls are BUTTONS / LEVERS / GEARS in the
  world, never text lists of moves ("slide west rubble" = "confusing, totally unintuitive"); never one console that moves every
  piece ("defeats the purpose of exploration"): spread the controls so you explore; NO console / model ("the game has a map and
  there is going to be a minimap"); show a WIDE VIEW of the dungeon when a plot moves; he tests ON THE SKATEBOARD; lights must not
  switch on as you walk. Built: `lever` mark (one lever = one move of one plot), you ride the plot, wide view on every move,
  skateboard crosses plots, seam = whole doorway, all lamps lit. Details: repo notes "PLOT DUNGEONS, THE SECOND PASS".
- THIRD PASS 11-15 (his words: "what is up with that lever? It looks nothing like a lever and there are 10 of them in a row, why? you
  can only interact with one of them anyway ... Make a new lever. Do another pass on all the dungeons, visually and aesthetically").
  RULES I take from it (mine): a control must LOOK like the one thing it is (ONE lever, never a row of props where one is usable);
  bare rooms / plain boxes / stick lamps read as sloppy to him: dress every room. Built: Meshy `pd_lever` (arm swings on pull),
  `PD_DRESS` auto dressing per look, dark caps in the wide view, lanterns, pedestals, turbine battery. Repo notes "PLOT DUNGEONS,
  THE THIRD PASS". Meshy originals: /mnt/project-files/dungeons/meshy/.
- STILL STAND-IN (say so when he asks): fights (FIGHT counts as won), the Procession's guardian (angel statue prop), Three Little
  Worlds flat, no drawn water in Missing Channel, no undo / reset in the world (START OVER on the list).
  Mystery Dungeon untouched.
- Harness tip: /tmp/pd scripts are gone with the container; console hooks `PD.state()`, `PD.act('<counter id>')`,
  `ThreeRenderer.hq.pd.top({x,z,h})`, `ThreeRenderer.hq.skateIssued(true)` + `.skate(true)`. Run the harness on draw demand.
Related [[disaster-city-144-20261113]] [[quest-system-20261112]]
