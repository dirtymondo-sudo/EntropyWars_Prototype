---
name: pistol-ready-support-hand-20261102
description: Pistol ready idle: off hand now WRAPS the gun hand (PR #819, 11-03) in the gun hand's own frame; earlier PR #801 cup-under-wrist was rejected by mondo
metadata:
  type: project
  modified: 2026-11-03T03:28:52.503Z
---
mondo 11-02: "The other hand just awkwardly crosses over their arm" -> PR #801 re-reached the off arm to the SOURCE clip's off-hand spot relative to the gun hand (a cup under it).
mondo 11-03: "Their left hand goes under their other wrist and is holding nothing, it looks weird" -> PR #819 THE WRAP.

PR #819 (three-renderer.js `_libSupportHand`, `_libHandFrame`, `SUPPORT_WRAP`, `SUPPORT_CURL`): off hand placed in the GUN HAND'S frame (along hand / thumb side / out of palm; from finger bones on MPFB, else skin read `_gripHandSkin`, else library mannequin via roff). Off palm on the grip's open side, fingers tilted 38 deg down round the gun hand's fingers, forearm takes half the roll. MPFB fingers curl more. Classic (fingerless) hands: palm flat on the handle where `_gripFrameMesh` seats it (`SUPPORT_WRAP.flat`), fingers can't close.
Gotcha: never cache `_gripHandSkin` on the shared GLB root during the bake (clones copy userData as JSON -> gun seat breaks); use a throwaway userData proxy.

**Why:** mondo wants a real two-handed pistol hold, the support hand wrapping the gun hand/grip, not a cup under the wrist.
**How to apply:** another two-handed clip = add it to `_LIB_SUPPORT_HAND`. Probe without playtest harness clicks: mount `EWCharViewer.mount(div, race, gender, {appearance})` via page eval and render `EWCharViewer.dev.state()` scene with a custom camera at the hands.
Shots /mnt/project-files/pistol-ready/pistol_ready_wrap_before_after.jpg. Notes character-creator.md "THE IDLE POSE" Pass 3-5. Related [[idle-pose-picker-20261101]] [[door-gun-grip-20261102]]
