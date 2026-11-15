---
name: throw-blood-20261110
description: PR #1087 throws (Infernal Hurl etc.) put blood on the landing tile; bloodAt opt; Spell Lab throw harness
metadata:
  type: project
---
PR #1087 (2026-11-10, merged + uploaded, token 20261110-throwblood-01-cors): mondo "used infernal hurl ... blood splatter was on the tile they were originally on". Cause: battle.js `_applyThrowLanding` (kind skyThrow: Infernal Hurl, Abduction Beam, Rocket Toss, Dragon Toss) pays damage before writing the body's tile; applyDamageToUnit fired blood at target.x/y. Fix: throw hits pass `opts.bloodAt: {x,y}`; display only. Rest of forced movement audited, no other damage-before-tile site (slides write the tile first; pushes hit then slide). Not checked in a two-seat match.
Harness: /mnt/project-files/throw-blood-20261110/tools/throw.js `<tag> <battle.js path> [spellId]` = Spell Lab (`_slbEnterLab`), real doSpell grab + throw, logs fireBlood tiles. Use executablePath /opt/pw-browsers/chromium with NODE_PATH=repo node_modules; route cdn .js to local files; two browsers at once crash, run one at a time. Unit GLB models did not draw in this harness (plates only).
Related [[gore-rules]] [[forced-movement-rules]]
