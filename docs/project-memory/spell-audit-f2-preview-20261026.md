---
name: spell-audit-f2-preview-20261026
description: Spell audit batch F2 (CONFIRM preview) PR #563 merged 10-26; self-laid terrain fixed by the NO SELF-COMBO runoff watch, not by adding the bonus to the preview
metadata:
  type: project
  modified: 2026-10-26T16:36:17.096Z
---
PR #563 merged 2026-10-26 (token 20261026-preview-f2-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261026-1635.zip).
- CALL flagged to mondo: the brief picked "add the self-laid terrain ×1.25 to the preview" (Miasma, Hellmouth, Chemtrails,
  Formic Acid, Tidal Slam). The thread instead followed the existing NO SELF-COMBO terrain rule (PR #392): the leak was
  the spring RUNOFF (getLiquidFlowAt), which the map.js cast watch didn't record. `castPreFlowAt` fixes it, so those
  casts lose the ×1.25 they took from their own terrain (Hellmouth 539 → ~404). If mondo wants the bonus, revert that one map.js/battle.js change.
- Preview now covers: conduction on area/line/barrage, statusFirst, sneak, Blood Frenzy prey, random shots badge,
  Swing Door hinge, sky swoop (`skySwoopTakeoffZ`) + sky-throw grab, damaging debuff/steal/Plunder/doorBreach/
  zoneDebuff/deployObject/terrainCreate (`_FORECAST_DAMAGE_KINDS`), multi-hit split badge.
Notes: docs/notes/champions-combat.md "THE SPELL AUDIT FIX F2". Related: [[spell-audit-fix-20261026]] [[element-terrain]]
