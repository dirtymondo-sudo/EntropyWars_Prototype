---
name: no-walk-first-20261107
description: PR #999 (11-07) forced-movement playtest B1/I/P3 fixed — dash/leap flat reach, charge rows, Soul Bind pair rule, self teleports never MOVE→CAST
metadata:
  type: project
  modified: 2026-11-07T06:41:15.513Z
---
PR #999 merged + uploaded 11-07 (?v=20261107-noapproach-01-cors). Families B1, I, P3 of [[playtest-mechanics-20261107]].
- `spellReachIsFlat` (battle.js): dash + leapStrike gate on flat steps (doSpell's own rule); LOS/fog unchanged.
- Charge dashes (kind dash + chargeToTarget) list enemy rows (hud.js `_aimCharge`).
- `_pairPhasePick`: Soul Bind 2nd pick judged within pairRange of the 1st pick.
- `_spellNeverApproaches`: self teleports + two-click mid-pick never offer MOVE→CAST; self teleport has a target when a free landing tile is in reach (Icky with no ooze greys "No target" = P2 too).
- Gravity Crush "walked away" was NOT a bug: log shows caster on J6, 6 from target, range 4.
Proof staging trick: Spell Lab + JSON-clone a unit into state.units for a 2nd enemy / an ally (lab vision radius is 2, add an ally clone for team sight); hide lab panels with a CSS style.
