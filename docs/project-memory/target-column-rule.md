---
name: target-column-rule
description: How menus vs board clicks pick a body in a shared column (flyer over ground unit) since PR #400 (2026-10-21)
metadata:
  type: project
  modified: 2026-10-21T13:17:27.631Z
---

PR #400 (merged 2026-10-21, main 539324b, token 20261021-menus-02-cors) fixed the hands-on playtest's "CONFIRM row and bar name different enemies".

- A MENU ROW names one body: battle.js `spellAimProblemOn(unit, spell, u)` = spellAimProblem + 'range' when the column rule would hand the cast to the other body. The drum, quick menus, spellCastableOnUnit, findSpellApproachTile and selectTargetFromMenu (`_mtcReachesPick`) use it, so an out-of-reach flyer row reads MOVE→CAST (walk/jump/raise ground) instead of hitting the unit below.
- A BOARD CLICK keeps the old column rule (resolveUnitInColumn: the in-reach body takes the hit). Thread's call, not asked of mondo.
- Picks carry z (pendingTarget.z); hud.js `_hrlgPickIs` puts ✓ on the right row.
- Also in #400: finisher victim list = pick then CONFIRM; Sprint/dash no caster pre-pick; SPACE follows END TURN gates; MOVE→CAST lighting judges sight from where the caster stands (`_reachProbe`).

**Why:** the drum listed a body by its own reach check while doSpell redirected to the other body.
**How to apply:** any new per-unit target list must call spellAimProblemOn, not spellAimProblem(x,y,z). Related: [[hud-rules]] [[hands-on-playtest]]

PR #402 (2026-10-21, mondo picked "SUPER EFFECTIVE everywhere"): a type-weak hit pops "×1.3 SUPER EFFECTIVE!" (was "WEAK!"); element pops keep "FIRE WEAK"; Entropy picker / reserve chips show "▲n" (title says SUPER EFFECTIVE). Respawn round skip is intended (mondo). Party Builder first visit needs no hints (checked fresh profile).
