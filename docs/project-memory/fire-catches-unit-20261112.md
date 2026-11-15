---
name: fire-catches-unit-20261112
description: 11-12 PR #1165: a square lit under a unit sets it Burning at once on every ignite path (mondo's Dragon Fist / Chess Piece report)
metadata:
  type: project
  modified: 2026-11-12T04:54:17.466Z
---

11-12 thread "Fix burning tile not applying Burning" (thread in the owner project), PR #1165, battle.js live.
mondo: "this chess piece is clearly on a tile on fire but it doesnt have the burning status effect" (Dragon Fist on Training Room tall grass).
Cause: only the forest fire set the unit Burning at ignition; grass fire spells, Wall of Fire, fanned flames, round spread, Hell door own-side
bodies waited for the end-of-round tick. Fix: battle.js igniteTile -> _fireCatchesUnitAt (Burn 2, status only, NO ignition damage; skips flyers,
lava-adapted, fire drinkers, already Burning; status immunity still answers, e.g. Astronaut "resists Burn").
Proof /mnt/project-files/burning-tile-catch-20261112/ (WebGL2). Not seen: online match, Wall of Fire / spread paths on screen (code path shared).
Harness: playtest_spellcam.js offline routing is STALE (three r128 mirror; game says "cannot start"). Works when only cdn.entropywars.net
.js/.css are served from the repo, the rest goes through the proxy (chromium proxy = $HTTPS_PROXY), URL ?nohq&ew_gpu=webgl2, global playwright.
Related [[playtest-elements-20261106]]
