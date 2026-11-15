---
name: seraphim-rings-20261026
description: PR #549 (10-26) Seraphim = boneless Meshy ring-of-eyes GLB, two rings gyroscoping via a procedural rig (procRig 'seraphRings'), core eyeball; calls flagged
metadata:
  type: project
  modified: 2026-10-26T09:42:53.402Z
---

PR #549 (merged 2026-10-26) made the Seraphim a biblically accurate angel from mondo's R2 model
`Assets/Sprites/Races/seraphim/Meshy_AI_a_circular_ring_of_ey_1026083741_texture.glb` (boneless).

- Hook: `procRig: 'seraphRings'` on the RACE_MODELS_3D def; three-renderer.js `_PROC_RIGS` builds two rings + the game's sky
  eyeball at the core and returns keyframe clips (idle, walk, cast kinds, hit, death) wired like library clips. A new
  boneless model can get its own `_PROC_RIGS` builder the same way. Notes: docs/notes/models-assets.md "THE SERAPHIM RINGS".
- Eye texture: the shared `_miscTex` Eye_D drew solid black on the board; each surface (board/dock/viewer) gets its own
  512px canvas copy. Eye's back is black, so it turns to face the camera.
- Calls flagged to mondo: both genders wear the rings (3D-only roster rule would drop the female); ring size heightRatio
  1.25; eye faces viewer; motion per spell kind (bolt = one ring flies out, AoE/ultimate = halo fast spin, heal/support =
  halo slow, melee = somersault lunge).
- Proof stills: /mnt/project-files/seraphim-rings/. Sync zip ENTROPY_WARS_SYNC_20261026-0942.

**How to apply:** follow-ups to the Seraphim look go to this hook; don't use animation libraries on it.
