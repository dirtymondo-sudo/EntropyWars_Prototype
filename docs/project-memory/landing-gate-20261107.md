---
name: landing-gate-20261107
description: PR #1000 (11-07) turn waits for thrown bodies to land (playtest H3/E6); harness slow-fps artefacts + frame-stepped clock recipe
metadata:
  type: project
  modified: 2026-11-07T06:45:03.559Z
---
Playtest H3 (To the Moon kill, camera low in gore over next unit's menu) + E6 (CPU moves between grab and throw result). PR #1000 merged, token 20261107-landgate-02-cors, battle.js a538cd8b + three-renderer.js c51e204f live.
- Cause: throw arcs land on the ANIM clock (slow-mo, freezes, dt cap 250 ms at low fps) but doSpell finishAction runs on a wall-clock timer; hasBlockingAnims ignored _throwTweens. Turn passed mid-flight -> death close-up over next menu, PRESS refund missed.
- Fix: battle.js `_landingGate()` on THE HIT GATE (_pendingSpellHits) for sky throw/drop/slam/leap arcs; three-renderer counts _throwTweens as blocking.
- At real 60 fps (frame-stepped) main already returned the camera fine: the bug shows when frames are slow (harness ~2 fps, weak PCs). Shipped default has Action Cam OFF (index.html SHIPPED-KEYS ew_cinematicActionCam "0").
- Harness recipe: local /tmp/ph/ph.js patched with `--clock` (ctx.clock.install) + /pause (pauseAt now+1500), /run?ms, /fshot endpoints = 60 fps-equivalent stepping. Staging by eval: copy getSpellById('raceRocketToss') into the active unit's spells, move victim adjacent, low HP.
- Proof /mnt/project-files/moon-camera/. Notes docs/notes/spells-vfx.md "THE LANDING GATE". Not fixed: death close-up lens can sit inside a tree/hill (seen in runs). [[lens-footprint-camera-20261107]] [[playtest-mechanics-20261107]]
