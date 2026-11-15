---
name: blender-clothes-pilot-20261101
description: Row 12 pilot (PR #753, 11-01): trench coat built in cloud Blender (bake-garment.py) as creator Outer pick "Trench coat (Blender)"; classic clothes NOT replaced, mondo to decide
metadata:
  type: project
  modified: 2026-11-01T12:14:25.236Z
---
mondo 11-01 10:22 wanted to see ONE garment built the new Blender way before replacing the classic coded clothes.
Pilot = trench coat, PR #753 merged 11-01 (thread in the owner project), sync zip ENTROPY_WARS_SYNC_20261101-1213.
- Tool: repo-root bake-garment.py (bpy + MPFB2, ~1 min) -> charactercreation/wear/ewb_trench.glb (R2 Assets/Models/charactercreation/wear/).
- Creator: Outer layer id `btrench`, beside coded "Trench coat"; old Meshy MALE/FEMALE bodies fall back to the coded trench.
- Shots: /mnt/project-files/blender-clothes/trench_before_after_{male,female,heavy,classic}.png; pilot copy for other threads in blender-clothes/pilot/.
- Lessons (creator idle is a WIDE stance): skirt hangs from hip joints (pelvis 0.1 + thigh 0.9, thigh by x where cloth hangs);
  classic/slider offsets must be averaged over 5 cm of skin (three-renderer nearSet) or layered pieces tear.
**Why:** mondo decides from the screenshots whether to replace the classic clothes with this method.
**How to apply:** don't replace the classic coded clothes until he says so; the row-12 list thread (thread in the owner project), capes on a new Cape layer) builds on this script.
Related [[character-models-plan-doc]] [[modular-characters-plan-20261101]]
