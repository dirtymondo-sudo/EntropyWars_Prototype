---
name: grass-fire-20261026
description: THE GRASS FIRE (PR #534, 10-26): every fire-pass flame swapped to the burning-tile volumetric flame shader; calls flagged
metadata:
  type: project
  modified: 2026-10-26T06:59:35.031Z
---

PR #534 merged 2026-10-26, sync zip ENTROPY_WARS_SYNC_20261026-0659 (three-vfx-effects.js 49c1bbd6). mondo: the fire pass flames ([[fire-vfx-20261025]], PR #514) "look worse than" burning grass tiles, use that fire everywhere.

- Burning-tile fire = ray-marched volume shader `_FLAME_FRAG` on a BackSide box (`_buildFlameVolume`); now shared via `_flameVolumeMat(seed, blue)`. Fire pass canvas tongues (`_fpTongue`) removed; `_fpVolMesh/_fpVol/_fpVolSet` drive volumes in mark, windup ring, Fireball, Combust, Flamethrower, Inferno.
- Keep volumes near the tile's ~1:1.4 proportions or the columns become thin needles. DOF blurs them badly over the void (no depth write).
- Calls flagged: Wall of Fire curtain dropped, the old recipe's per-tile volumes are the wall; atomic fire stays blue via new `uBlue` uniform (0 on tiles).
- Capture tip: VFX shots lag 1-1.5 s in the harness; a time-dilation script wrapping performance.now/Date.now/setTimeout/setInterval/rAF at 0.2x catches mid-spell frames. Spell Lab = real cast pipeline. Before/after sheets: /mnt/project-files/grass-fire/.
- FLAMETHROWER REVERTED (PR #535, same day, mondo: "from the screenshots the flamethrower looked better before"): jet is the PR #514 tongue cone again; zip ENTROPY_WARS_SYNC_20261026-0720 supersedes 0659.
