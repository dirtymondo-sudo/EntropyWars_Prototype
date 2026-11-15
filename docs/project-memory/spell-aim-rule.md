---
name: spell-aim-rule
description: One shared spell range/target check (spellAimProblem) feeds Abilities button, quick menus, target drum, approach finder and doSpell (PR #224, 2026-10-16)
metadata:
  type: project
---

PR #224 merged 2026-10-16 (token 20261016-aimrule-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261016-0544.zip: battle.js 737a45dc, hud.js 9742c841).
mondo's bug: Dragon Slash greyed "No target" under Abilities, offered on the enemy quick menu, then "Spell target is out of range". He wants it solved for ALL spells.

- battle.js `spellAimProblem(unit, spell, x, y, z)` = doSpell's own aim gates (returns null or 'range'/'los'/'sight'/'hidden'/'above'); doSpell reads `_spellAimTarget` / `_spellAimReach`. `spellCastableOnUnit` adds cloak + spellTargetUsableOn.
- **How to apply:** any new menu/AI check of "can this spell hit that unit" must call spellAimProblem / spellCastableOnUnit, never re-derive range. A new doSpell aim gate goes into spellAimProblem too.
- Lit tiles (getSpellRangeTiles) unchanged. Blink landing rule from PR #221 kept. Not yet seen in-game by mondo.
Related: [[quick-cast-aim]], [[combat-clarity]].
