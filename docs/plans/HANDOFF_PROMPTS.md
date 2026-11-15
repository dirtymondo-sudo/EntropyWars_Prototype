# HAND-OFF PROMPTS — open work as of 2026-11-15 20:30 UTC

One prompt per piece of open work. Paste one prompt into a NEW chat on the other account. Each prompt stands alone.

**Before handing one over:** tell the owner's side which ones you gave away, so no thread there keeps working the same
area. Two sides running the same bake tool (`bake-camelot.js`, `bake-disaster-city.js`, ...) overwrite each other's rooms.

**"Waits mondo's OK" means exactly that.** The prompt says what is approved and what is not. Nothing unapproved gets built.

Paste this block at the top of every prompt (it is the same for all of them):

```
You are working on Entropy Wars in the repo dirtymondo-sudo/EntropyWars_Prototype.
First: git fetch origin main && git merge origin/main. Then read CLAUDE.md, docs/notes/onboarding.md and
docs/notes/owner-rules.md, and follow them exactly (delivery workflow, no tests, no browser runs unless I ask,
mondo's rules). You are pre-approved to commit, push, open a PR, merge it to main and run node sync-zip.js --upload
in the same turn as each change. Paths under /mnt/project-files in the notes do not exist for you; the plan files
you need are in docs/plans/. Do not build anything the notes mark as waiting for mondo's OK: ask me instead.
```

---

## ZONES, MAPS, PLOTS

### 1. Camelot Kingdom: the castle redesign and the old inner rooms
```
Task: continue Camelot Kingdom (room site_prebuilt_camelot_kingdom, built by bake-camelot.js from
docs/areas/camelot/layout.json).
Read: docs/notes/areas-complexes.md sections "CAMELOT KINGDOM ON PLOTS" (three sections) and "CAMELOT KINGDOM, PLAN 3";
docs/project-memory/camelot-kingdom-plots-20261115.md; docs/plans/camelot/.
State: plan 3 is built and live (castle in the middle, village inside the town wall, moat, woods ring).
Castle redesign 2 (docs/plans/camelot/camelot_castle_redesign_2.png: no inner curtain wall, ONE symmetrical palace with
keep, throne hall, two mirrored wings, eight cone towers and a great spire, on a two-step hill higher than the village,
Grand Stair from the Market) is a MOCK-UP that waits mondo's OK. The second lower-court building is undecided.
mondo's words on the castle: "like an epic fantasy dragon quest or final fantasy or medieval castle. Disney world
cinderella's palace. Hogwarts", "in the center of the map and relatively symmetrical", "higher elevation compared to
the village".
Do: ask me whether redesign 2 is approved and what the second lower-court building is. Once approved, build it through
bake-camelot.js. After that: the Keep's upper floors, the Undercroft and the Sky Castle are still the old rooms and
need rebuilding to match; richer village house exteriors.
Known trap: sloped rooms make hqCastleTower arc decks NaN.
```

### 2. The Desert: finish the interiors
```
Task: finish the interiors of The Desert (room site_prebuilt_area51_desert, built by bake-desert.js from
docs/areas/desert/layout.json; districts: the Road, Western Town, Area 51, Giza).
Read: docs/notes/areas-complexes.md "THE DESERT ON PLOTS" (and any later Desert sections); docs/plans/desert/
(desert_plot_plan.png, insides_plan.png, draw-insides.py); docs/project-memory/desert-plots-20261115.md (older than
the build: the room IS built now).
State: the area is built, approved and live. Meshy props are in (cacti, covered wagons, water tower, hitching rails;
PR #1485). mondo's calls: NO sand mounds, NO prickly pear. The interiors plan (insides_plan.png) is approved. The
interiors build stopped partway.
Do: find out which interiors of the plan already exist in layout.json / data.js, then build the rest per the plan.
Interiors follow docs/notes/owner-rules.md section 3 (blockers centred on whole 3.5 m squares, working swinging doors,
every building unique and purposeful). Reuse R2 models first (MODEL_LIST.md).
```

### 3. The Woods: trees and the cabin
```
Task: continue The Woods (room site_prebuilt_fairy_forest_plots, built by bake-woods.js from
docs/areas/woods/layout.json).
Read: docs/notes/areas-complexes.md "THE WOODS ON PLOTS" and any later Woods sections;
docs/project-memory/world-areas-plan-20261115.md; docs/plans/world-areas/ (woods_plot_plan.png, woods_horror_plan.png).
State: built and live; trails done. A second try at the trees (the current "A" trunks with realistic leaves) is live
and waits mondo's reaction. The cabin's purpose is an open question for mondo.
Do: ask me for mondo's reaction to the trees and what the cabin is for, then act on the answers. Trees stand only on
grass, dirt or sand. No Meshy trees. Its north door joins the Mountains (Snowline plot), its west trail joins Camelot:
if you move an end, rerun the neighbour's bake tool too.
```

### 4. The Mountains: first look, chairlift, encounters
```
Task: follow up on The Mountains (rooms site_prebuilt_shasta_mountains and site_prebuilt_northpole_plots, built by
bake-mountains.js from docs/areas/mountains/layout.json).
Read: docs/notes/areas-complexes.md "THE MOUNTAINS ON PLOTS"; docs/project-memory/mountains-plots-20261115.md;
docs/plans/world-zones/mountains_plot_plan.png.
State: built and live (PR #1492): Snowy Pass, Ski Lodge with five runs, half-pipe and chairlift, Mount Shasta, Mount
Olympus, the North Pole village. Nobody has seen it on screen yet. The chairlift is only a door pair (nothing rides
it). The Woods Upper Shelf has no door. No encounter tables. No Ice Queen. The big room compiles slowly (about 23 s
headless): watch the load time.
Do: wait for mondo's notes from his own look, then fix what he reports. Candidates to propose to him (do not build
unasked): a chairlift that carries you, encounter tables (data.js HQ_AREA_ENCOUNTERS), the Upper Shelf door.
```

### 5. The next zone: The Estate (then The Beach)
```
Task: plot-build the next zone of the world plan. The suggested next one is The Estate; confirm with me first.
Read: docs/plans/world-zones/zone-layout-proposals.md and estate-layout.json + estate_plot_plan.png (layout 3 is the
approved world layout); docs/plans/world-areas/world-areas-proposal.md (revision 2 holds mondo's answers);
docs/project-memory/world-zones-plan-20261115.md; how the finished ones were made: bake-woods.js, bake-camelot.js,
bake-desert.js, bake-mountains.js and their sections in docs/notes/areas-complexes.md.
Rules: every area is plot-built like Disaster City (12x12 squares of 3.5 m per plot, districts). Post a plot plan
picture and WAIT for mondo's explicit OK before building. When the new area ships, retire its old rooms in the same PR
(data.js DOOR_HQ.retired) and point saves, map and doors at the new room. Units' homes follow data.js
DOOR_TEXT.POINT_OF_ENTRY. Never invent names, characters or rules.
Do: write bake-estate.js + docs/areas/estate/layout.json the same way as the other areas, add its row to CLAUDE.md
TOOLING and its section to areas-complexes.md.
```

### 6. Disaster City, Civic Center as Washington DC
```
Task: continue the Civic Center district of Disaster City (district file docs/disaster-city/districts/C.js; the city
room site_prebuilt_downtown_streets is written by bake-disaster-city.js).
Read: docs/notes/areas-complexes.md "DISASTER CITY, CIVIC CENTER" and "DISASTER CITY, THE DISTRICT MOVE";
docs/project-memory/disaster-city-civic-20261113.md, disaster-city-civic-interiors-20261115.md,
dc-civic-interiors-pass2-20261115.md, disaster-city-real-cities-20261115.md; docs/disaster-city/pack-claims.md;
docs/plans/disaster-city/civic-dc/.
State: exteriors and two interior passes are live. The Washington DC restyle was in progress. Two concepts wait
mondo's OK: the seated statue and the blossom tree (pictures in civic-dc/). They are Meshy pieces, so they need his
approval before they are made.
Do: ask me whether the two concepts are approved; continue the DC restyle. A plot id is a NAME, not a place: district
files write in their home squares and docs/disaster-city/move.js places them.
```

### 7. Disaster City, Financial district (design + interiors second pass)
```
Task: continue the Financial district of Disaster City (docs/disaster-city/districts/F.js, F-detail.js, F-inside.js,
F-london.js, F-atmos.js).
Read: docs/notes/areas-complexes.md "DISASTER CITY, THE FINANCIAL DISTRICT'S ARCHITECTURE" and "FINANCIAL'S BOX LETTERS";
docs/project-memory/dc-financial-district-20261113.md, dc-financial-interiors-pass2-20261114.md.
State: London look and interiors pass 2 are live. Both the design thread and the interiors thread stopped on a
question to mondo (see the "open" lines at the end of those two memory files).
Do: tell me the open questions from those files in one short list, get mondo's answers through me, then build.
```

### 8. Disaster City, University: check the Tomb plaque
```
Task: small follow-up in the University district of Disaster City (docs/disaster-city/districts/U.js).
Read: docs/notes/areas-complexes.md "DISASTER CITY, THE UNIVERSITY DISTRICT";
docs/project-memory/dc-university-buildings-20261113.md, dc-university-interiors-pass2-20261113.md.
State: the Tomb plaque is live but nobody has checked it on screen. The University interiors atmosphere thread also
stopped on a question to mondo.
Do: wait for mondo's look at the plaque and fix what he reports; list the open interior question for me.
```

### 9. Disaster City, plot heights after the district move
```
Task: the plot heights of Disaster City after the district move.
Read: docs/notes/areas-complexes.md "DISASTER CITY, THE DISTRICT MOVE"; docs/disaster-city/move.js, levels.js;
docs/plans/disaster-city/ (city_built_map.jpg, city_relayout_plan.jpg, city_roads_joined.jpg, levels-proposed.json);
docs/project-memory/disaster-city-relayout-20261115.md, disaster-city-vertical-20261113.md.
State: the district move is built and live (PR #1482): coast = Entertainment, Bayside, Industrial from north to
south; Southside in the south. The heights still need their own pass, and there is an open highway-column question in
the relayout memory file. Two optional calls mondo has not made: delete the Boxing gym, turn the tanker (do neither
unasked).
Do: post a heights plan picture first and wait for mondo's OK. The ocean stays by Bayside and the Beach.
```

### 10. DOOR HQ elevator redesign
```
Task: the DOOR HQ elevator redesign.
Read: docs/plans/door-hq/elevator_redesign_mockup.jpg; docs/notes/hq-building-rooms.md (search "elevator" / "LIFT");
docs/project-memory/INDEX.md line "elevator redesign OK".
State: the fix for the elevator (bigger car, exit fix) is live. The redesign is a MOCK-UP that waits mondo's OK.
DOOR HQ is the one handmade area: it is never plot-built.
Do: ask me whether the redesign mock-up is approved, then build it as drawn.
```

---

## QUEST AND CUTSCENES

### 11. First quest cutscenes: 13 notes, the ride down, the foyer
```
Task: finish the first quest's cutscenes (quest ORIENTATION, six scenes A-F).
Read: docs/notes/story-party-progression.md "THE QUESTS", "THE CUTSCENES", "EVERY SCENE REPLAYS", "SCENE F",
"SCENE B", "HIS NOTES ON E + F", "THE CUTSCENE EDITOR"; docs/project-memory/first-quest-cutscenes-20261112.md,
cutscene-camera-rules.md, cutscene-editor-20261115.md, quest-system-20261112.md; docs/plans/cutscenes/.
State: all six scenes are built and replay from the pause menu (QUESTS). mondo sent 15 editor notes on 11-15; fixes
for 13 of them plus two approved builds were in progress: THE RIDE (an open cage going down a shaft with glimpses of
The Sewers, The D.U.M.B., The Cavern, Atlantis, Leylines, about 17 s; plan_15nov_ride.jpg) and THE FOYER (17.5 x
10.5 m, 7 m ceiling, all props kept, a 9 m DOOR logo wall made from his own logo files over the hall doors, shots
13-16; plan_15nov_foyer.jpg).
Do: check git log for what of that already merged, then finish the rest. Rules: the lines in data.js STORY_CUTSCENES
are mondo's words, never rewrite or invent dialogue; bake his Cutscene Editor exports with node bake-cutscenes.js;
the player never speaks; no NPC walks into a scene; faces sit above the subtitle bar; follow cutscene-camera-rules.md.
Code: director EWScene (three-camera.js), host map.js _questHqScene. PLAY in the cutscene editor must work from
anywhere.
```

---

## FRAME RATE AND STABILITY

### 12. Disaster City to a stable 60 FPS
```
Task: get Disaster City (and battles in it) to a stable 60 FPS on mondo's machine (Firefox, M1 Mac, WebGPU).
Read: docs/notes/rendering-loading-perf.md from "THE CHUNKS" to the end (THE STILL WALK, THE SHELL CELLS, THE ONE
PAINT, THE SHEET STACK); docs/project-memory/perf-city-60fps-20261115.md, perf-city-meshprice-20261115.md,
perf-city-propchunks-20261114.md, perf-city-chunks-20261113.md; WEBGPU_PLAN.md before any shader work.
State: measured price on his Mac: frame is about 12.5 ms + 4.8 microseconds per replayed mesh on the F3 line, so 60
FPS needs under about 900 meshes in view. 22 FPS became about 32 FPS (PR #1450); THE SHEET STACK (PR #1478) should
give about 38 and waits his F3 walk and his eyes on the walls. Kill switches: EW_HQ_NO_ONE_PAINT, EW_HQ_NO_STACK.
Next cuts by yield: sign canvases (about 400, one draw each) onto shared sheets; instance cells + prop chunks (635 in
view); loose shell parts the batch refuses; the sun shadow map held between frames.
Do: ask me for mondo's F3 numbers after PR #1478, then take the next cut. Every cut gets a console kill switch and
must look identical. Bloom and fog stay off. Never repaint his textures.
```

### 13. DOOR HQ Main Hall freeze / crash
```
Task: the DOOR HQ Main Hall crash on mondo's machine (Firefox, M1 Mac, WebGPU, no console error).
Read: docs/notes/rendering-loading-perf.md "THE CRASH TRAIL", "THE HOLDERS", "THE UNDRAWN MAPS", "THE WALK DROPS UNIT
MODELS TOO", "THE SMALL PROPS", "THE CITY AT 5.5 GB", "THE BUILD IN ONE GO";
docs/project-memory/hall-crash-trail-20261115.md.
State: memory fixes are live (PR #1438 to #1458, then #1479). The crash was never reproduced in a cloud browser, so
the fix is unconfirmed. Every load prints a [CRASH TRAIL] block in the console.
Do: wait for mondo's report. If it still crashes, ask me for the [CRASH TRAIL] block and the F3 MEM line from his
machine and work from those. Do not guess a cause without them.
```
