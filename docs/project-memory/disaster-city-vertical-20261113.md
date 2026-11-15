---
name: disaster-city-vertical-20261113
description: Disaster City LEVELS (a height per plot, sloped streets, stairs, ramps) LIVE PR #1299 11-13; where the numbers live, the rules other city threads must follow, known limits, not yet seen in game
metadata:
  type: project
  modified: 2026-11-13T18:58:36.853Z
---
Thread (thread in the owner project) "Add verticality to Disaster City". mondo 11-13 18:07 asked for sloped streets, ramps, stairs, districts at different elevations with Bayside at sea level; 18:30 tapped "Build it as drawn". LIVE PR #1299 (data.js ec0af29b). Thread left open for his look.

- Numbers: `docs/disaster-city/levels.js` (`grid[y][x]` level per plot, 1 level = 1.75 m, 0 Bayside .. 14 Church; `pieces` bowls; `stairs` kind per district). Rerun `node bake-disaster-city.js` after any change. Notes: docs/notes/areas-complexes.md "DISASTER CITY, THE LEVELS".
- Engine: `terrain.slope.cells` (four corner heights a square, flag byte for walk-in floors); every slope-riding row follows it, so district files need no edits. `absY: true` = row already absolute. District hooks get `ctx.LEVELS` + `ctx.lvOf(plot)`.
- Rules for other city threads: a building that spans plots (the stadium P04-09/P05-09/P04-10/P05-10) needs those plots on ONE level; Bayside north row is 3,2,2,1, the rest 0 (beach at 0); arch rows / props are lifted by the tool; after merging main ALWAYS rebake (the DC144 block conflicts every time, take either side then rerun the tool).
- Known, not fixed: back-to-back walk-in buildings on a plot line at two levels (P03-05-B1) show a bank inside the lower one; doors P08-02-B1 + P02-05-B1 face an infill wall (older flaw); some door stoops end at the next building's back wall.
- Not built from the mock-up: park knoll + Dish (stadium now), Hero plaza stage, garage roof ramp, loading docks, Marina beach steps.
- NOT SEEN IN GAME: the headless browser run was refused (RULE #1c: no playtest unless he asks). Checked offline only: compile, walk reach of all 144 plots, each flight climbed. He owes a look: stairs, retaining walls, fences at drops, traffic on hills, FPS.
- Mock-up + tools (old grid): /mnt/project-files/disaster-city-vertical/.
Related [[disaster-city-144-20261113]] [[disaster-city-traffic-plan-20261113]] [[perf-city-chunks-20261113]]
