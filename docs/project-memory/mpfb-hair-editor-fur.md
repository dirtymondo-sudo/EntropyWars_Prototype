---
name: mpfb-hair-editor-fur
description: Werewolf fur work 11-03 (PR #863 + #866): hair editor fur shell, wolf head in Creature heads, Meshy Retexture fur skin + matching tail/feet, tail root fix
metadata:
  type: project
  modified: 2026-11-03T13:03:57.282Z
---
mondo 11-03 (thread in the owner project) ("Add fur to the werewolf").
ROUND 1 PR #863 (zip 1212): bake-fur.py grows MPFB 2 hair editor fur_full on a FRESH UNBAKED male -> BODY_SHELL -> wear ewf_fur.glb
(tufts tried, dropped: flat flakes). wolfHead = jaldmic wolf target (CC-BY) via bake-mpfb.py ANIMAL_SHAPES. mondo: "looks rough".
ROUND 2 PR #866 (zip ENTROPY_WARS_SYNC_20261103-1303, 8 asset files added by hand):
- Wolf head = Creature heads pick (+ strength slider), off Face tabs (sprites.js EW_SHAPE_HEADS from groups with inHeads; party-builder ccShapeHeads).
- Meshy Retexture (meshy-6, enable_original_uv, remove_lighting) on heavy body + wolfHead (built from mpfb_heavy.glb + wolfHead offsets,
  hm08 UVs; same orientation as skin jpgs) -> mpfb/looks/skin_ew_werewolf_fur.jpg (A text prompt, the good one) + _dark (B, style image =
  Meshy werewolf render, murkier). Pushed after EW_MH_LOOKS:END. Sources project files meshy/retexture/werewolf/. Proxy injects Meshy key.
- bake-meshy.py tex= (Retexture base colour on piece UVs): ewm_wolftail_fura/b, ewm_beastfeet_fura/b.
- bake-fur.py --from-skin S.jpg --name ewf_fur_werewolf: shell recoloured from a skin (no Blender).
- Tail root: bake-meshy taper=(0.25,0.22) sink=0.05 on wolftail (was a flat disc off the lower back). Lizard + shark tails got the same fix 11-05 (PR #909/#910/#911, uploaded to R2 by the thread with sync-zip.js --upload / --put).
- Werewolf saved look = heavy, wolf head, skin A, tail/feet A, claws, no shell. Meshy werewolf still the unit default.
Related [[mpfb-asset-packs]] [[character-models-plan-doc]] [[meshy-default-20261103]] [[meshy-retexture-20261103]]
R2 GOTCHA (11-05): creator files now live at Assets/characters/creator/ (sprites.js EW_CHARACTER_ASSET_BASE), not Assets/Models/charactercreation/; manifest keys + hand-zipped assets must use the new path.
