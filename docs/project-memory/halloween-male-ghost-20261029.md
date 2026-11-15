---
name: halloween-male-ghost-20261029
description: PR #676 (10-29) male Ghost = Halloween pack Character_Ghost.fbx rebaked to a library-compatible GLB; 2 GLBs await mondo's R2 upload
metadata:
  type: project
  modified: 2026-10-29T22:02:22.632Z
---

mondo 10-29 asked to use the Halloween pack's Character_Ghost.fbx as the male Ghost. PR #676 merged on 10-29.
- Token: 20261029-ghostm-01-cors.
- Sync zip: r2-sync/ENTROPY_WARS_SYNC_20261029-2202.zip (sprites.js 941a405d, ASSET_MANIFEST.json 45a5ce53).

**The FBX:**
- It IS rigged: 20 bones, no clips.
- The bone names are its own (L_Shoulder = the upper arm, L_Leg_01, ...).
- It has NO hips bone, it is in centimetres, and it faces -Z.
- So the library retarget (which looks up the Meshy names and needs Hips) could not use it as uploaded.

**The rebake** (/mnt/project-files/halloween-ghost/bake-ghost.mjs):
- Bones renamed to the Meshy names.
- A Hips root added, with the legs under it.
- Turned 180 degrees, scaled to metres, UV v flipped, Ghost.png embedded.
- Gotcha: without the UV flip, the black trouser texels land on the sheet.
- Notes are in docs/notes/models-assets.md under "THE MALE GHOST".

**MONDO MUST UPLOAD** /mnt/project-files/halloween-ghost/GHOST_MODEL_UPLOAD.zip. It holds:
- Assets/halloween/characters/Character_Ghost.glb
- Assets/opt/3f4926ad_Character_Ghost.opt.glb

Until those two files are uploaded, the male ghost's model 404s.

**Proof:** /mnt/project-files/halloween-ghost/male_ghost_on_screen.jpg shows idle, run, magic attack and death on the harness. Close-ups were taken by rendering the scene from a temporary camera through ThreeRenderer.hq.dev.renderer() (screenshot only).

Related: [[sandbox-playtest-speed]] [[model-compression-check-20261027]]
