---
name: race-looks-cowboy-20261101
description: Race looks (creator look replaces a race's Meshy model) + mondo's cowboy hat solid piece; cowboy/cowgirl test, PR #765, 2026-11-01
metadata:
  type: project
  modified: 2026-11-01T17:30:21.901Z
---

2026-11-01, PR #765: mondo wants EVERY race eventually rebuilt from the character creator, editable by him, exported and baked in as the default look. Test = cowboy (MPFB classic male) + cowgirl (MPFB classic female).

- sprites.js RACE_CREATOR_LOOKS (between RACE_CREATOR_LOOKS:BEGIN/END markers, written only by `node bake-looks.js <export.json>`); RACE_CREATOR_LOOK_DEFS carries def extras (cowboy: ranged basic attack, R2 revolver hold).
- Forge > slot of a baked race > GEAR > CHARACTER CREATOR: opens on the race look; EXPORT DEFAULT LOOK writes Entropy_Wars_Race_Look_<race>_<gender>_<stamp>.json; RESET TO DEFAULT LOOK; USE ORIGINAL MODEL keeps the old Meshy model per slot (nothing deleted). window.EW_DISABLE_RACE_LOOKS = all races back to Meshy.
- Export button only shows on races with a baked look: a new race needs a thread to bake a first look, then mondo edits.
- mondo's cowboy hat (R2 wear/cowboyhat .blend + his textures) → charactercreation/wear/ewb_cowboyhat.glb via bake-clothes.py SOLIDS (character-models-plan row 16 started, row 17 done → waiting on his go/no-go).
- Gun belt (Meshy list #2) not made yet; coded belt stands in.
- PR #768 (11-01 follow-up): MPFB bodies hide the classic painted beard; FACE now has a Facial hair pick (pack beards, EW_MH_FACIAL_HAIR) + colour (beardTint hair/pick/own, beardColor). MPFB classic rig ALREADY has skinned finger bones (no hand graft); _gripHand curls the hand holding a def's `hold`. Finger animation from the clips not done (retarget stops at the hand).
- Notes: docs/notes/character-creator.md "THE RACE LOOKS", models-assets.md "THE SOLID PIECES". Related: [[character-models-plan-doc]] [[blender-clothes-row12]] [[modular-characters-plan-20261101]]
