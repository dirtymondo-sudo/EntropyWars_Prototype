---
name: grid-fit-group6-20261026
description: Grid fit group 6 (PR #548, 10-26): 38 field-fight terrain rooms + garage kickers snapped to 1.75 m squares; res 0.4375, 2-square ramps, cave caveats
metadata:
  type: project
  modified: 2026-10-26T09:36:34.374Z
---
mondo 10-26: "redesign the maps with the square grid in mind" (ramps 1 or 2 squares wide, sitting in the grid). Group 6 = 38 site/zone terrain rooms (cave rooms, mall, Vatican, Hell pit, Camelot, Area 51, D.U.M.B., sewers/tunnels/cells/workings, sea/harbour/abyss, astral rooms, hwing_floor, woodstair) + garage kickers. PR #548 merged; zip r2-sync/ENTROPY_WARS_SYNC_20261026-0936. Plans/shots /mnt/project-files/grid-fit/group6/.
Calls made (flagged to him in the reply):
- Walked terrain ramps (>=2.2 m) became 2 squares wide (a 1-square terrain ramp never makes an IN battle square). Never steeper.
- 0.5 m-sampled rooms now `terrain.res: 0.4375` + moved lips `edge: 0.2` (at 0.5 an on-line cliff smears a row OUT). Huge rooms keep 0.5.
- Same-height tiers meeting on a line overlap 0.5 m.
- Cave-gen rooms (`gen.kind:'cave'`) regrow rock chaotically from ANY piece/prop move: Nightmare kept only moves that keep it whole (3 fangs + props unmoved); Oubliette torch unmoved.
- Left round/slanted: garage drum, harbour causeway, mall ring bridges, astral library radial stairs, Hell pit obsidian walls.

**Why:** a later thread touching these rooms needs to know the res/edge/cave traps.
**How to apply:** before moving pieces in a cave room, measure reach before/after; don't drop res back to 0.5 on snapped rooms. Notes in docs/notes/areas-complexes.md "THE GRID FIT, GROUP 6".
