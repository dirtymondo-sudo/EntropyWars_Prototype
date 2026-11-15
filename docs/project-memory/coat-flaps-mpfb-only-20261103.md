---
name: coat-flaps-mpfb-only-20261103
description: 11-03 THE FLAPS FIX (coat side flaps / legs through closed coats / flicker) + mondo's rule: fit clothes to MPFB bodies only, not MPFB classic
metadata:
  type: project
  modified: 2026-11-03T17:55:29.889Z
---
RULE (mondo 2026-11-03, (thread in the owner project): "the clothes just fit better with the mpfb bodies (not the classic), so we'll use those from now on and you dont have to worry about fitting stuff to the mpfb classic bodies anymore". Check/fix clothes on mpfb_male / mpfb_female only; keep classic bodies as picks, no fitting passes for them. Recorded in docs/notes/character-models-plan.md section 2.

THE FLAPS FIX (thread in the owner project), plan row 9 pass 2, notes character-creator.md "THE FLAPS FIX"): the two flaps at the hips on every Blender long coat came from THE COAT HANG chains ([[coat-hang-20261103]]), not the GLBs. Fixed in three-renderer.js COAT_HANG: rootFollow, rootUp 0.25 / rootW 0.01 (chains root at the waist), thighTop 0.25 + a seat-only capsule, maxPush [30,40], gravity 0.2, rad 0.03, limExtra 0.008. His closed greatcoat in Wide stance 1,325/1,834 -> 54/0 px of jeans through. Shots /mnt/project-files/coat-flaps/.

**Why:** next coat clipping report should start from these params, not re-add hip-pinned roots.
**How to apply:** probe harness = Playwright + swiftshader, EWCharViewer.mount on a fixed div, unmount between looks (same-character mounts reuse the rig), freeze with dev.state().mixer.setTime(t) + timeScale 0 (Idle_5 at 1.3 = his pose), walk via play('walk',{loop:true}) then preview.act.time; flat ID colours (wear_outer red, jeans green) + count enclosed green pixels. Related [[clothes-holes-20261102]] [[coat-fronts-shirts-20261102]].
