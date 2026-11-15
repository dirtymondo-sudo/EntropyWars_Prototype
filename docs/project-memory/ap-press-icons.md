---
name: ap-press-icons
description: AP press icons (PR #246) + ENDS TURN display (PR #323): AP icons, cost pips show real cost, ENDS TURN tags, TargetQuery.apUse
metadata:
  type: project
  modified: 2026-10-18T14:26:13.909Z
---
PR #246 merged 2026-10-17 (AP press icons). PR #323 merged 2026-10-18 (ENDS TURN), zip r2-sync/ENTROPY_WARS_SYNC_20261018-1425.zip.
- hud.js ApPress: bare icons top left by default (UI Maker piece 'press'). Spent fade on the left, live glow, the cursor/armed action's COST flashes; refunds add icons (unit._apRefundIcons, battle.js).
- mondo 2026-10-18: "damaging spells really cost 1 ap and end your turn". So the display shows COST, not drain: battle.js TargetQuery.apUse(unit, kind, opts) -> {n, ends} feeds row pips (n) + a red ENDS TURN tag (.hrlg-endsturn; root verbs show it under the name) + AP icons (n flash, rest .lost with red slash, .ew-ap-ends words). TargetQuery.apSpend (whole-pool drain) is still the engine truth; spendAllAP + press refund unchanged.
- New AP actions: map them in hud.js _hrlgApUseOf / _hrlgArmedApUse (_HRLG_ENDS_IDS, or endsTurn: true on the row).
- UI Maker: AP press icons > ENDS TURN words > Where (ux.aEnds); text parts "ENDS TURN words" / "ENDS TURN tags".
**Why:** mondo wants to know at a glance how much AP is left after an action, and which actions end the turn.
**How to apply:** extend these rather than adding another AP readout. Related: [[battle-hud-turn-column]], [[ui-maker]].
