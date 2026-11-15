---
name: support-log-lines-20261107
description: 11-07 PR #989 fixed buffs/utility family E (cleanse/HoT/escape/Free Energy log lines, CHV badge, shield chip); seat-scoped addLog tool
metadata:
  type: project
  modified: 2026-11-07T05:58:46.727Z
---

Buffs/utility playtest family E DELIVERED 11-07, PR #989 (thread in the owner project),
token 20261107-supportlog-02-cors, uploaded battle/hud/ui/online/three-renderer.js. Text + badges only, no rules changed.
- battle.js `_logCleansed` (every cleanse kind), `_logStatusTickHeal` (round-end heal ticks), escape cast line, Free Energy MP number.
- New log tool: `addLog(msg, undefined, undefined, { seats: [p] })` → entry.sn = only those seats see it (battle.js _logVisible,
  online.js _gvLogShows). Escapes use it: the side that saw the unit leave reads "X casts S and vanishes" (no tile).
- `getChivalryGuardian(unit)` → CHV badge (plates, unit panel, Pause > Party); Pause > Party shows a shield as "🛡 96".
- Online two-seat run NOT done; proven only with VS CPU + fog. Proof shots: /mnt/project-files/support-log-lines/.
Lab probe tip: before each GAME.doSpell, delete caster._spellsUsedThisTurn and set state._blitzActiveUnitId = caster.id
(else the 1-spell/turn gate refuses); serve local edited JS via a Playwright route on cdn.entropywars.net.
Related [[playtest-buffs-utility-20261107]]
