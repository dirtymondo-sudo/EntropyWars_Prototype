---
name: fbx-four-weights-20261105
description: FBXLoader ">4 skinning weights" warning fixed at source PR #943 (21 ocean pack + elephant FBX); bake-fbx-weights.py for new FBX uploads
metadata:
  type: project
  modified: 2026-11-05T11:21:57.592Z
---
2026-11-05, PR #943 (token 20261105-fbxw-01-cors). The console warning "THREE.FBXLoader: Vertex has more than 4 skinning weights" came from 20 ocean pack FBX (Assets/world/packs/ocean/) + elephant-3d.fbx.

- Fixed with repo-root `python3 -I bake-fbx-weights.py in.fbx out.fbx`. It rewrites only the cluster arrays (4 largest weights, scaled to the original total), so FBXLoader output is unchanged.
- The fixed files went to R2 under the same keys and are listed in ASSET_MANIFEST.json (?h= sha).
- Originals are in dirtymondo `archive/2026-11/fbx-weights-originals/`.
- Character_Ghost.fbx is also over 4 weights but the game loads its GLB, so it was left alone.
- Any new FBX upload that shows the warning: run it through the tool and add a manifest entry.
- Notes: docs/notes/models-assets.md "THE FOUR WEIGHTS".
