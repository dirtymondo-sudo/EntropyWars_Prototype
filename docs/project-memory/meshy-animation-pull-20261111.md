---
name: meshy-animation-pull-20261111
description: Meshy animation library pulled via API (no key needed in cloud env); libs 7 MAL4 + 8 MAL5, creator picks only; PR #1111
metadata:
  type: project
  modified: 2026-11-11T09:08:08.595Z
---

mondo 11-11 (thread in the owner project): asked for more Meshy animations than his 20-at-a-time hand downloads.

- MESHY ACCESS WORKS WITHOUT A KEY: api.meshy.ai is a connected service in the cloud environment (the proxy injects the key; send any
  dummy Bearer). The old "waiting on env secret MESHY_API_KEY" note is obsolete. Never ask him for the key.
- Pipeline (repo root): `pull-meshy-anims.py meshy-anim-pull.json <dir>` (rig once 5 credits, 3 credits a clip, batches of 10 action_ids;
  `--library` lists Meshy's 678 clips), then `build-mal.py` packs animation-only GLBs (`--inplace` for walks with root motion).
- Shipped PR #1111: MAL4_Sniper.glb (lib 7: 53 idles/walks/runs) + MAL5_Sniper.glb (lib 8: 74 casts/attacks/hits/deaths/guards/emotes),
  130 clips, 395 credits. 16 idles + 19 walks added as CREATOR PICKS ONLY (his 11-05 rule, see [[mocap-library-rev2-20261105]]).
- OPEN: MAL5 clips are on no slot (only in the spell editor's clip picker). Putting them on attacks/casts per race needs a strike frame
  per clip and his say on which race gets what. Picked walks were not viewed on the board. Sheets + proof in
  /mnt/project-files/meshy-anim-pull-20261111/. Details: docs/notes/models-assets.md "THE MESHY ANIMATION PULL".

**How to apply:** new clips go in as creator picks; ask before changing any race default. His taste: subtle, hated CMU acted idles.

KNEES FIX 11-11 (PR #1115, mondo: "Their knees look bent backwards"): Meshy's API rig rests in the sniper's Idle_5 crouch and the game's
retarget is relative to the library file's rest, so clips lost knee bend. build-mal.py `--rest <calib.glb> <MAL1> Idle_5,Regular_Jump`
calibrates the rest from clips both rigs share. ALWAYS pass --rest; a NEW rigging task needs its own calib pull (spec set `calib`).
Check new clips with a knee-angle measure in the creator (EWCharViewer.dev.model() bones), not by eye on the sniper sheets.
