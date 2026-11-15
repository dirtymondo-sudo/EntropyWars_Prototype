---
name: meteor-crater-paint-20261105
description: PR #950 (11-05) units hidden under Training Room mats after Meteor = room paint (marks) never deformed; fix + harness gotchas
metadata:
  type: project
  modified: 2026-11-05T12:06:20.725Z
---
mondo 11-05: Meteor in the Training Room, "floor does not deform and the units are underneath the floor". Cause: the room's PAINT
(three-renderer.js _hqBuildMarks: board-feature mats, stadium chalk, rings, text) is a flat mesh over the field; _fieldDeformApply
bent only the field. Fix PR #950 (token 20261105-craterpaint-02-cors, three-renderer.js 4ccfb6ae uploaded): marks cut on the field
lattice + take the field nodes' drop (_fieldMarksCut/_fieldDeformMarks); paint on dug squares dropped. Switch EW_NO_MARKS_DEFORM.
Shots /mnt/project-files/meteor-crater-floor/. Notes docs/notes/seamless-field-encounter.md "THE CRATER UNDER THE PAINT".

Harness gotchas: arenas only become their room after window.hqArenaUpgrade(map,{compile:true}) before applyGameMode (else voxel
board, no bug). Draw-on-demand (sv page.js) gave stale/half frames in room boards: set __ph.draw.mode="always" a few s before a shot.
Local origin/main ref can be stale at session start: git fetch before branching.
Seen, not fixed: index.html CDN CORS probe fetches Assets/Sprites/terrain/scorched.png, which 404s since the R2 reorg -> false
"CDN BLOCKED" banner. Related [[crater-floor-fissure-gap]] [[sandbox-playtest-speed]]
