---
name: self-cast-confirm
description: mondo rule (2026-10-18, PR #322): self-cast spells never fire on the pick; they arm on the caster and wait for the green CONFIRM, no target list
metadata:
  type: feedback
  modified: 2026-10-18T14:26:15.387Z
---
mondo 2026-10-18: "self cast spells still get a confirm button ... the self cast doesnt need a target list since it can only be the caster, it just needs the green confirm button after i click it".

**Why:** picking an AoE from Abilities that turned out to be a self-cast fired instantly.

**How to apply:** PR #322 (zip r2-sync/ENTROPY_WARS_SYNC_20261018-1426.zip). battle.js setTool arms `pendingTarget {caster, selfCast:true}`; confirm → selectTargetFromMenu → `_fireSelfCast`. hud.js `_aimSelf` (no list, "CONFIRM — SELF"), quick-menu rows wrapped by `_hrlgSelfCastRow` (first click ✓, inline CONFIRM casts). Any new cast path for self-casts must go through the same arm + confirm. Notes: docs/notes/ui-menus-audio.md "THE SELF-CAST CONFIRM". Related: [[spell-aim-rule]], [[quick-cast-aim]].
