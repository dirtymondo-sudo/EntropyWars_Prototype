# HAND-OFF PROMPTS — open work, updated 2026-11-15 22:15 UTC

One prompt per piece of open work. Paste one prompt into a NEW chat on the other account. Each prompt stands alone.

The live state is always `docs/notes/claims.md` (the board). This file is rewritten from it; when the two disagree,
the board wins. A chat that takes a prompt changes that row on the board in its first PR.

**"Waits mondo's OK" means exactly that.** Nothing unapproved gets built.

Paste this block at the top of every prompt (it is the same for all of them):

```
You are working on Entropy Wars in the repo dirtymondo-sudo/EntropyWars_Prototype.
First: git fetch origin main && git merge origin/main. Then read CLAUDE.md, docs/notes/onboarding.md,
docs/notes/owner-rules.md and docs/notes/claims.md, and follow them exactly (delivery workflow, no tests, no browser
runs unless I ask, mondo's rules, the board). You are pre-approved to commit, push, open a PR, merge it to main and
run node sync-zip.js --upload in the same turn as each change. Paths under /mnt/project-files in the notes do not
exist for you; the plan files you need are in docs/plans/. Do not build anything the notes mark as waiting for
mondo's OK: ask me instead. Take this work's row on the board (side: second) in your first PR.
```

---

## ALREADY RUNNING ON THE OTHER ACCOUNT (no prompt needed: carry on in the same chat)

| Work | Where it stands | Waiting on |
|---|---|---|
| The Estate | Built, look pass merged and seen in the browser. | mondo's look. |
| The Beach (`site_prebuilt_bermuda_beach`, plan 4) | First delivery merged; the Flying Dutchman moored at the Long Pier. | mondo's look. |
| The Mountains + the Hollywood Hills + the city's north beach | Plan 2 built: Hills room, Shasta / Olympus swap, north beach. | mondo's look. |
| The Desert's insides | Hangar 18, the White Rooms and the inside of the Great Pyramid built. Row is `free` again. | mondo's look; his answer on the King's Chamber > Turning Tomb door. |
| Disaster City frame rate | 36.9 FPS at 3,264 meshes after THE SPLIT STACK (#1508); THE KEPT LIGHT LIST merged. | mondo's F3 numbers. |

## DONE SINCE THE FIRST LIST (nothing to hand over)

- The Woods trees: approved and live (PR #1501, #1503, #1507). The cabin has no game role yet (mondo's answer).
- Camelot castle redesign 2: built (one palace on a two-step hill). Not seen on screen yet.
- University Tomb plaque: live (PR #1493); only the look check is left (prompt 5).

---

## PROMPTS STILL OPEN

### 1. First quest cutscenes: the three open shots
```
Task: finish what is left of the first quest's cutscenes (quest ORIENTATION, six scenes A-F).
Read: docs/notes/story-party-progression.md "THE QUESTS", "THE CUTSCENES" and every later cutscene section down to
the newest (the 15 Nov notes, the shaft ride, the foyer), "THE CUTSCENE EDITOR";
docs/project-memory/first-quest-cutscenes-20261112.md, cutscene-camera-rules.md, cutscene-editor-20261115.md,
quest-system-20261112.md; docs/plans/cutscenes/ (plan_15nov_ride.jpg, plan_15nov_foyer.jpg, the storyboards).
State: everything shipped in PR #1518: all 15 of mondo's editor notes, the shaft ride (open cage, glimpses of The
Sewers, The D.U.M.B., The Cavern, Atlantis, Leylines) and the bigger foyer (7 m atrium, the DOOR logo wall). Three
things are NOT proven: (1) the lift-door opening shot: the doors may not open on screen; (2) walking into the foyer
from the hall after the atrium change; (3) Agent Locke's walk-off.
Do: check those three in the code, fix what is wrong, and tell me exactly what to look at on my screen for each.
Rules: the lines in data.js STORY_CUTSCENES are mondo's words, never rewrite or invent dialogue; bake his Cutscene
Editor exports with node bake-cutscenes.js; the player never speaks; no NPC walks into a scene; faces sit above the
subtitle bar; follow cutscene-camera-rules.md. Code: director EWScene (three-camera.js), host map.js _questHqScene.
PLAY in the cutscene editor must work from anywhere.
```

### 2. Camelot Kingdom: Keep floors, Undercroft, Sky Castle, house kinds
```
Task: continue Camelot Kingdom (room site_prebuilt_camelot_kingdom, built by bake-camelot.js from
docs/areas/camelot/layout.json).
Read: docs/notes/areas-complexes.md "CAMELOT CASTLE, REDESIGN 2", "CAMELOT KINGDOM, PLAN 3" and the two
"CAMELOT KINGDOM ON PLOTS" sections; docs/project-memory/camelot-kingdom-plots-20261115.md; docs/plans/camelot/
(camelot_castle2_next_plan.png + draw-castle2-next.py are the plan for this task).
State: plan 3 and castle redesign 2 are built and live (one symmetrical palace on a two-step hill in the centre, the
village inside the town wall, the moat, the woods ring). Redesign 2 has not been seen on screen. The plan for the
next four pieces (the Keep's upper floors, the Undercroft, the Sky Castle, the village house kinds) is posted as
camelot_castle2_next_plan.png and WAITS mondo's OK.
Do: ask me whether that plan is approved and for mondo's notes on the built castle. Build only after the OK, through
bake-camelot.js. Known trap: sloped rooms make hqCastleTower arc decks NaN.
```

### 3. Disaster City, Civic Center as Washington DC
```
Task: continue the Civic Center district of Disaster City (district file docs/disaster-city/districts/C.js; the city
room site_prebuilt_downtown_streets is written by bake-disaster-city.js).
Read: docs/notes/areas-complexes.md "DISASTER CITY, CIVIC CENTER", "DISASTER CITY, THE DISTRICT MOVE", "THE ROADS
JOIN AGAIN"; docs/project-memory/disaster-city-civic-20261113.md, disaster-city-civic-interiors-20261115.md,
dc-civic-interiors-pass2-20261115.md, disaster-city-real-cities-20261115.md; docs/disaster-city/pack-claims.md;
docs/plans/disaster-city/civic-dc/; the notes at the bottom of docs/notes/claims.md addressed to the Disaster City
holder (the Beach door and the north beach).
State: exteriors and two interior passes are live. The Washington DC restyle is in progress. Two concepts wait
mondo's OK: the seated statue and the blossom tree (pictures in civic-dc/). They are Meshy pieces, so they need his
approval before they are made.
Do: ask me whether the two concepts are approved; continue the DC restyle. A plot id is a NAME, not a place: district
files write in their home squares and docs/disaster-city/move.js places them. When you bake the city, point its
`harbour` door at { room: 'site_prebuilt_bermuda_beach', at: 'quay' } (see the board's notes).
```

### 4. Disaster City, Financial district (design + interiors second pass)
```
Task: continue the Financial district of Disaster City (docs/disaster-city/districts/F.js, F-detail.js, F-inside.js,
F-london.js, F-atmos.js).
Read: docs/notes/areas-complexes.md "DISASTER CITY, THE FINANCIAL DISTRICT'S ARCHITECTURE" and "FINANCIAL'S BOX LETTERS";
docs/project-memory/dc-financial-district-20261113.md, dc-financial-interiors-pass2-20261114.md.
State: London look and interiors pass 2 are live. Both the design work and the interiors work stopped on a question
to mondo (see the "open" lines at the end of those two memory files).
Do: tell me the open questions from those files in one short list, get mondo's answers through me, then build.
```

### 5. Disaster City, University: check the Tomb plaque
```
Task: small follow-up in the University district of Disaster City (docs/disaster-city/districts/U.js).
Read: docs/notes/areas-complexes.md "DISASTER CITY, THE UNIVERSITY DISTRICT";
docs/project-memory/dc-university-buildings-20261113.md, dc-university-interiors-pass2-20261113.md.
State: the Tomb plaque is live (PR #1493). Nobody has checked that it faces OUT from the wall and sits centred over
the doors. The University interiors atmosphere work also stopped on a question to mondo.
Do: check the plaque's facing and position from the numbers in U.js (which way the wall's outside is, where the
doors are) and fix it if wrong; tell me what to look at on screen. List the open interior question for me.
```

### 6. Disaster City, plot heights after the district move
```
Task: the plot heights of Disaster City after the district move.
Read: docs/notes/areas-complexes.md "DISASTER CITY, THE DISTRICT MOVE" and "THE ROADS JOIN AGAIN";
docs/disaster-city/move.js, levels.js; docs/plans/disaster-city/ (city_built_map.jpg, city_relayout_plan.jpg,
city_roads_joined.jpg, levels-proposed.json); docs/project-memory/disaster-city-relayout-20261115.md,
disaster-city-vertical-20261113.md.
State: the district move is built and live (PR #1482): coast = Entertainment, Bayside, Industrial from north to
south; Southside in the south; the roads join again. The heights still need their own pass, and there is an open
highway-column question in the relayout memory file. Two optional calls mondo has not made: delete the Boxing gym,
turn the tanker (do neither unasked).
Do: post a heights plan picture first and wait for mondo's OK. The ocean stays by Bayside and the Beach; the north
beach strip (B.js beach(), EDGES.n.cap) belongs to the Mountains holder.
```

### 7. DOOR HQ elevator redesign
```
Task: the DOOR HQ elevator redesign.
Read: docs/plans/door-hq/elevator_redesign_mockup.jpg; docs/notes/hq-building-rooms.md (search "elevator" / "LIFT");
the newest cutscene sections of docs/notes/story-party-progression.md (the foyer's front lift and the shaft ride were
rebuilt on 11-15 and must keep working).
State: the fix for the elevator (bigger car, exit fix) is live. The redesign is a MOCK-UP that waits mondo's OK.
DOOR HQ is the one handmade area: it is never plot-built.
Do: ask me whether the redesign mock-up is approved, then build it as drawn.
```

### 8. DOOR HQ Main Hall freeze / crash
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

### 9. The next zone of the world plan
```
Task: plot-build the next zone of the world plan. Built so far: Disaster City, The Woods, Camelot Kingdom, The
Desert, The Mountains, The Estate, The Beach. Not built: The Sewers, The D.U.M.B., The Cavern, Leylines, Heaven +
Hell + Vatican, Outer Space, The Deep (with Atlantis), Antarctica, the Astral Realm. Ask me which one mondo wants.
Read: docs/plans/world-zones/zone-layout-proposals.md and that zone's <zone>-layout.json + <zone>_plot_plan.png
(layout 3 is the approved world layout); docs/plans/world-areas/world-areas-proposal.md (revision 2 holds mondo's
answers); docs/project-memory/world-zones-plan-20261115.md; how the finished ones were made: bake-estate.js and
bake-beach.js (the newest) and their sections in docs/notes/areas-complexes.md.
Rules: every area is plot-built like Disaster City (12x12 squares of 3.5 m per plot, districts). Post a plot plan
picture and WAIT for mondo's explicit OK before building. When the new area ships, retire its old rooms in the same
PR (data.js DOOR_HQ.retired) and point saves, map and doors at the new room; leave a note on the board for the holder
of any neighbour whose door must change. Units' homes follow data.js DOOR_TEXT.POINT_OF_ENTRY. Never invent names,
characters or rules.
```
