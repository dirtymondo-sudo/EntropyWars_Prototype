---
name: one-brightness-20261024
description: Pause-menu Brightness is ONE value for battles + exploring (PR #474, 2026-10-24); never split it per place again
metadata:
  type: feedback
  modified: 2026-10-24T02:19:04.750Z
---
mondo (10-24) was confused that the battle pause menu said "Brightness · EXPLORING": VS CPU arenas are cut from rooms, so
the fight ran in the building's exposure context, and the game kept two values (ew_exposure / ew_exposure_hq).
PR #474: one value (localStorage ew_exposure) everywhere; setExposureContext only gates the building's auto-exposure.
Label is plain "Brightness" + hint "one setting for battles and exploring alike". Proof shots in /mnt/project-files/brightness-slider/.

**Why:** mondo: "the exploration and battle areas are supposed to be the same environment ... the whole thing is just confusing".
**How to apply:** never reintroduce per-place (battle vs exploring) copies of a player setting or place-named labels on it.
