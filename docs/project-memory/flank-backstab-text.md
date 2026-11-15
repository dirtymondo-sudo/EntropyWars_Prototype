---
name: flank-backstab-text
description: Flanked/Backstab floating text shows the real multiplier (PR #451, 2026-10-23) — ×1.1 side, ×1.25 back, basic attacks only
metadata:
  type: project
  modified: 2026-10-23T09:20:16.625Z
---
PR #451 merged 2026-10-23 (token 20261023-flankmult-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261023-0920.zip).
mondo asked: "flanked and backstab do bonus damage right? they should have the amount next to their floating number like "Flanked X1.25"".
- Facing bonus = basic attacks only: battle.js FACING_BACK_DMG_MULT 1.25, FACING_SIDE_DMG_MULT 1.10. Spells get none except the door rear rider.
- Pops now "FLANKED ×1.1" (kind counter), "BACKSTAB ×1.25" (kind crit), "🚪 REAR ×1.25", built from the live multiplier.
- Browser check: in a fresh profile the default 'stack' float layout pushed the words off the top edge under the close action cam (existing layout behaviour, not changed); the screenshot used Side by side. Screenshot /mnt/project-files/flank-backstab/.
Related: [[damage-numbers]], [[ui-maker]].
