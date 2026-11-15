---
name: occulus-wings-20261027
description: PR #592 (10-27) 3D Occulus = mondo's R2 Assets/misc/wings.glb + the Seraphim eyeball via procRig 'occulusWings', own spell moves, creator Wings part, vColor shader fix
metadata:
  type: project
  modified: 2026-10-27T06:48:38.168Z
---

mondo uploaded R2 Assets/misc/wings.glb (two separate wing meshes in one file, ~237k tris, heavy). PR #592 merged 10-27, token 20261027-occulus-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261027-0646.zip.

- sprites.js RACE_MODELS_3D 'occulus' uses `procRig:'occulusWings'`. three-renderer.js _PROC_RIGS.occulusWings hinges Wing_L/Wing_R on their own (each flaps alone) and adds the eye (ewSerEye, OCC_EYE_R) plus ewOccGaze (stare-forward weight). The clips in _OCC_POSES are cast clips of 1.4 s or less, because the board cuts cast one-shots at 1400 ms. There is deliberately no castMagic, so the channel chain falls to castChannel.
- SPELL_ANIM_VERBS: Antimagic Gaze -> channel, Every Eye at Once (goEyeStalks) -> lantern.
- Shader fix: in _ewVColorEmissiveHook, vColor is a vec4 in r186, so it reads vColor.rgb. Before the fix the vertex-coloured model was invisible and only the x-ray twin showed.
- Creator: a Wings part (none/feathered, wingsColor) in party-builder ACCESSORIES. It is bound to the chest bone in _createAppearanceRig and the wings beat in tick(). Random looks give wings 15% of the time.
- Calls flagged to mondo: Occulus becomes playable through the existing 3D-ready rule; heightRatio 0.85; wings kept white as uploaded. A lighter optimized GLB would need his upload.
- Proof stills: /mnt/project-files/occulus-wings/.

- SINGLE WINGS (PR #604, later 10-27, token 20261027-wings-02-cors, zip ENTROPY_WARS_SYNC_20261027-0828): mondo's R2 Assets/misc/wings/ one-wing Meshy GLBs (angel/bat/dragon). three-renderer.js _ewWingPair (EW_WING_FILES.root = shoulder x end) doubles+mirrors into the old frame; ThreeRenderer.getWingPair(kind) for spells. Creator Feathered = angel; Occulus = bat (heightRatio 0.67 keeps eye/span); Hoard finisher wears the dragon pair. The unicorn (separate thread) can reuse ThreeRenderer.getWingPair('angel').

**How to apply:** Occulus move tweaks go in _OCC_POSES; new procedural rigs follow the procRig hook. Related [[seraphim-rings-20261026]].
