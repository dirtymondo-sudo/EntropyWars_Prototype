---
name: storm-zone-sheet-20261103
description: Storm Zone 'storm' terrain look replaced (black cloud + yellow bolt doodle -> fog.png storm-cloud sheet), PR #832, zip 20261103-0745
metadata:
  type: project
  modified: 2026-11-03T07:45:46.791Z
---
On 2026-11-03 mondo asked to replace "this weird looking cloud with a lightning bolt" everywhere in the game. His screenshot showed the walls in the Saturn arena.

Cause: the `storm` key never had a TERRAIN_SPRITES row, so it fell back to a legacy SVG placeholder (a smudge plus one yellow bolt). On walls and tiles that rendered as a black blob stamped with bolts. The key is used by:
- the Storm Zone terrain
- Saturn's cliff
- Saturn's storm walls

Fix (PR #832, merged): `storm` now uses `terrain/fog.png`, the same pixel cloud sheet as the fog wall. TERRAIN_BASE_TINT.storm `#a4b0cc` gives it a slate tint on the board. HQ room walls skip the base tint.

- Token: 20261103-stormzone-01-cors
- Zip: /mnt/project-files/r2-sync/ENTROPY_WARS_SYNC_20261103-0745.zip, containing sprites.js only
- Before/after image: /mnt/project-files/storm-zone/
- No rules changed.

Follow-up the same day: mondo said "yes i want the cloud thick gone too". PR #833 (merged) points `cloud_thick` at `terrain/cloud_2.png`, the painted puffy cloud. Map tints still colour it.
- Token: 20261103-thickcloud-01-cors
- Zip: ENTROPY_WARS_SYNC_20261103-0757.zip, containing sprites.js. It supersedes 0745.

mondo also said fog_wall is dead code and no longer in the game.
