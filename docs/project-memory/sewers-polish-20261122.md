---
name: sewers-polish-20261122
description: Sewers polish pass 1 (PR #2408, 11-22): what was fixed, what mondo still has to confirm, what was left
metadata:
  type: project
  modified: 2026-11-22T16:17:47.944Z
---
Thread (owner-project id). PR #2408 merged 2026-11-22, token 20261122-sewerpolish-02-cors, R2 live. Notes: docs/notes/areas-complexes.md "THE SEWERS, POLISH PASS 1". Pictures /mnt/project-files/sewers-polish/.

Fixed on mondo's four complaints: floor grates lie flat (`drain_grate_floor`), cobwebs hang in wall corners, radioactive sludge is waded at any depth + sump brims are climbed (`hqTerrainWades`, `hqTerrainHaulOut`), waterfalls wear their own streak sheet (`_hqFallMat`, every room's falls).

WAITS ON MONDO: the cobweb "black background" could not be reproduced in the cloud (WebGL2 draws the web nearly invisible); fix was by reading (no depth write, alphaTest). He must confirm on his Mac (WebGPU). Also his look at the new waterfall.

FOLLOW-UP PR #2409 (11-22, token 20261122-sewerpolish-03-cors): floor cobwebs (`psx_cobweb_*`) hang on the nearest wall in EVERY room at build (three-renderer.js `_hqCobwebHang`); liquid sheets no longer climb sheer banks; sludge ripple raised. LEFT: the walk covered 14 open spots, not every square; `hw_web*` (Halloween pack 3D webs) untouched. He said there are "many more issues" he could not describe: ask him for spots / screenshots.

**How to apply:** a next Sewers pass starts from his own screenshots / spots; never claim the black cobweb card is fixed until he confirms.
