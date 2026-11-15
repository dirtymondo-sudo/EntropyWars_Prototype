---
name: four-new-looks-20261025
description: PR #502 (2026-10-25) swapped shadow entity, tree person, female marksman and female men in black (now "Spy") to mondo's new R2 models/sprites; Spy + female sniper portraits = zoomed sprite face (PR #503)
metadata:
  type: project
  modified: 2026-10-25T03:11:34.734Z
---

PR #502 merged 2026-10-25: new Meshy models + 2D sprites for shadow entity (male; R2 folder shadowentity/male, file shadowperson), tree person (treeperson/), female marksman (Homosapien/Female/sniper/sniper_female) and female men in black (R2 folder spy/, file spy_female). The female men in black is now labelled "Spy" (was "Intel Spy"); mondo wants her as a sexy James Bond spy. No stat/spell/rule change.

Portraits: mondo picked the zoomed-in sprite face (PR #503): the female entries left RACE_PORTRAITS, so hud.js EWFaces cuts the face from the new sprite.

Proof sheet: /mnt/project-files/race-updates/new_looks_in_battle.jpg. Harness tip: right-drag orbit can be dispatched as synthetic mousedown(button 2)/mousemove/mouseup events via `ph eval` to tilt the battle camera (state.dioramaTiltDeg ~100 = side view).

Related: [[new-races-0930]]
