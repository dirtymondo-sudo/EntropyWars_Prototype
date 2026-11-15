---
name: spell-audit-fix-f5-20261026
description: Spell audit fix batch F5 (riders, HP costs, CPU aims) shipped as PR #562 on 10-26; what changed and the calls flagged to mondo
metadata:
  type: project
---
PR #562 (10-26, branch claude/project-thread-bz4yur, sync zip ENTROPY_WARS_SYNC_20261026-1620) = batch F5 of
[[spell-audit-fix-20261026]]. HP costs (selfDamagePct/recoilPct) are paid straight off HP; Overfit/Paradox replay the
last blow as a SECOND exact hit (new applyDamageToUnit opt `exactDamage`); Chivalry ward doesn't counter an intercepted
swing; Inner Peace castable for the M DEF stage alone; Grievous/Gooed halve round regen; Dead Eye/Knife Throw text
says "basic attack"; Crash Loop dead fields dropped; ai.js `_aimOkAt` (spellAimProblem) gates dash/trap/seed tiles,
big traps judge the whole _trapFootprint, Voodoo never picks the caster.
Precision Shot's actedTargetBonus WORKS in real matches (spell-lab board keeps enemies at 0 AP, so it fired both ways).
Calls flagged to mondo: replay ignores Vulnerable-type taken multipliers; costs bypass shields/Protect; CPU seeds go
under hurt allies/enemies; CPU Inner Peace still only on debuffed allies.
