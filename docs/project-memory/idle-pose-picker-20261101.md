---
name: idle-pose-picker-20261101
description: Creator idle pose picker (11-01): appearance.idle, sprites.js EW_IDLE_POSES, renderer bakes the pick per rig as a 'clip:' slot
metadata:
  type: project
  modified: 2026-11-01T23:36:26.997Z
---
mondo 11-01: "can we also add an option to change their idle pose in the character creator?"
Built in thread "Add idle pose picker to creator": BODY > "Idle pose" = Default (body/race's own idle) + 13 standing idles ALREADY in the
animation library (no new clips): Idle_5/11/10, UAL Idle_Loop, FoldArms, Talking, No, Sword_Idle, Pistol_Idle_Loop, Shield, Spell_Simple_Idle,
Crouch, Zombie. Left out: prop idles (torch/lantern/phone), sit/rail/swim/ninja loops, Block3 (hides face + hat).

How it works: appearance.idle is an EW_APPEARANCE_ENUMS key, so EXPORT DEFAULT LOOK + bake-looks.js carry it. getCharacterAppearanceModel
sets def.idlePick; three-renderer.js _animLibBakeForModel wraps _animLibBakeForModel0 and swaps the caller's `idle` for an on-demand
'clip:<clip>' bake — the shared per-model bake (_libBaked, shared by every unit on that body) is never changed. Viewer: _cvSwapIdle.

**Why:** a later creator/animation thread must not put a per-look clip into def.libClips (the bake key only counts slots, so a
per-look slot would leak to every unit on the same body).
**How to apply:** per-look animation choices go through def.idlePick-style per-caller swaps. Notes: docs/notes/character-creator.md
"THE IDLE POSE"; character-models-plan.md row 12e. Related [[character-models-plan-doc]] [[creator-clipping-20261101]]
