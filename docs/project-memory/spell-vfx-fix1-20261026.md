---
name: spell-vfx-fix1-20261026
description: FX-1 spell look fixes (fire/earth/water/ice/wind), PR #573 merged 2026-10-26; where its notes, sheets and calls live
metadata:
  type: project
  modified: 2026-10-26T23:26:02.456Z
---

Batch FX-1 of the spell VFX audit fix ([[spell-vfx-audit-20261026]]) merged as PR #573 on 2026-10-26 (token 20261026-fx1-2-cors, zip ENTROPY_WARS_SYNC_20261026-2325).
- Look pass only. Code is one block near the end of three-vfx-effects.js wrapping `_fireStage` (kill switch `window.EW_DISABLE_FX1`); chef clip override in sprites.js; football lenTiles 0.22 in three-renderer.js.
- Several looks draw on the windup HOLD (the burst beat lands 0.5-1 s after the numbers): Chain Reaction, Inferno, Burnout, Throne, Simoom, Timber Stomp, Arrow Volley, Decapitation.
- Lite craft blasts (per-tile) have no sphere at all; Lamp Smoke zone is blue (keyed on zone.spellName), other smoke zones grey.
- 11 look calls flagged to mondo: /mnt/project-files/spell-vfx-audit/fix/FX-1/NOTES.md. Missing models (9) in fix/MISSING_MODELS.md.
- Left: board water slabs (mondo keep water), Gust Door order / Loch raise / Descending Wrath log (rules), petrify grey creep (no tech), camera items -> FX-CAM, washes -> FX-WASH.

**How to apply:** a follow-up on these spells goes to the FX-1 block; read NOTES.md first. Notes in docs/notes/spells-vfx.md "THE FX-1 LOOK FIXES".
