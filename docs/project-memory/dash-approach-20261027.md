---
name: dash-approach-20261027
description: PR #605 (10-27): jumps + move-only spells (Sprint, blinks, Door Dash, Grapple, escapes, ally swaps) count in move+attack / move+cast reach
metadata:
  type: project
  modified: 2026-10-27T08:29:34.695Z
---
PR #605 merged 2026-10-27 (token 20261027-dashreach-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261027-0829.zip).
mondo: "Any spell that is a non damaging dash move ... needs to be included in move+attack/cast calculations" + "is jump+cast/attack calculated too?" (jump+cast was; jump+attack was NOT, now is).

- battle.js `spellOnlyMovesCaster`, `selfMoveApproaches(unit)` (approach entries with `_viaSpell`), `selfMoveAllowsCast/Attack`, `_runSelfMoveStep` (window._ewRunSelfMoveStep). hud.js `_mtVerb` labels rows SPRINT→ATK / JUMP→CAST.
- Order: walk → jump → move-only spell (→ height verbs for casts). No rule changed: dash+cast only lists when the 1-spell/turn rule allows (after a press).
- Grapple aims use the Grapple thread's grappleLandingFor (PR same day, anchor rule removed).
- Browser-proved: Sprint→Love Bite (after crit press), rooted DOOR Agent Door Dash→attack. Jump→attack NOT seen on screen (no spot came up in 2 matches); code path mirrors jump→cast.
- Existing rule surfaced: rooted only blocks walk/jump, so a rooted unit's teleports/dashes list. Not changed. AI not changed.
Related: [[pvp-targeting-fixes-20261023]] [[ice-slide-forecast]]
