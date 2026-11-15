---
name: spell-target-stays
description: mondo rule (2026-10-18, PR #313): no whole-screen spell layer (void veil, whiteout, flash) may ever hide the target; Lump of Coal has no void
metadata:
  type: feedback
  modified: 2026-10-18T11:58:43.026Z
---
mondo 2026-10-18: "there shouldnt ever be a time where the target becomes invisible and i just see nothing at all on the screen. the target is the main priority for a damage spell animation." Lump of Coal "doesnt even need one, its just supposed to be santa clause throwing a lump of coal".

**Why:** the VoidStage veil was a solid palette sheet (black on abyss/shadow/hearth) for ~0.5 s in and out, and the void hid the spell's own VFX and unitLights.

**How to apply:** PR #313 (token 20261018-target-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261018-1158.zip). Any new full-screen layer must cut a hole around the target: battle.js `_cineBodyHoles` / `_cineStampFocusHole` (--cine-hole-* CSS vars) / `window._cineFocusScreen`, renderer `ThreeRenderer.unitScreenBox`. New VFX must go through three-vfx-effects `_vfxAdd` so the void keeps them. Notes: docs/notes/spells-vfx.md "THE TARGET STAYS". Related: [[action-camera-frame-guard]], [[spell-director-revision]].
