---
name: grid-fit-group4-20261026
description: Grid fit group 4 (Stonehenge, Giza, Babel, Atlantis, Technoticlan, Camelot ward, Vatican, Göbekli) — calls made, tool gotchas
metadata:
  type: project
  modified: 2026-10-26T10:00:28.420Z
---
Grid fit GROUP 4 (2026-10-26, mondo: "redesign the maps with the square grid in mind"): Stonehenge, Giza, Babel, Atlantis temple,
Technoticlan templecity, Camelot ward, Vatican basilica, Göbekli tell moved/resized onto the 1.75 m squares; arenas re-baked 12/9/10/11.
Brief: /mnt/project-files/grid-fit/GROUPS_AND_BRIEF.md. Shots: /mnt/project-files/grid-fit/group4/before + after.

Calls flagged to mondo (his pick pending): thin barrier walls that would sit ON a square line became one-square blocks
(ball-court walls, Vatican rood screen, Camelot stand tiers, Stonehenge sarsens) because a thin wall on a line vanishes in battle
(neither neighbouring cell centre is inside it); Camelot wall-walk 3.2→3.5 m, gate passage 5→3.5 m, moat realigned (w 7.55,
bank 0.6); Vatican altar+apse steps one flight; Göbekli enclosures re-centred/enlarged, sentinel moved; Technoticlan observatory
r 4.375; Atlantis back-terrace parapets on the terrace edge line.

Tool gotchas (Group 1 tools in /mnt/project-files/grid-fit/tools, EW_REPO env):
- proud.js finds rows by "x:, z:" text: CONCENTRIC rounds (Babel tiers) all hit the first row — fix those radii by hand.
- proud.js can grow a drum past a built stair's top and cut the reach (Stonehenge king barrow) — re-run verify.js after it.
- hqTerrainWallAudit counts railing walls (ghost) as invisible: a built stair's railing END near a tier top shows as an
  "invisible wall" though the railing is drawn (Stonehenge 1, Babel 2 left as is).
- A plateau filling a w 3.5 hall exactly (incl. the hall's end cap) leaves a trapped ditch: run it 0.5 m past the walls and ends.
