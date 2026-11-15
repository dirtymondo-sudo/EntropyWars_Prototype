---
name: log-lines-one-event-20261029
description: PR #654 (10-29) fixed 10-28 playtest Bugs 4+5: Nexus burn / fall write one log line; area casts name the caster once
metadata:
  type: project
  modified: 2026-10-29T00:58:31.540Z
---

PR #654 (merged 10-29, token 20261029-loglines-01-cors, zip ENTROPY_WARS_SYNC_20261029-0058 = battle.js + state.js). From [[playtest-vscpu-r10-20261028]] Bugs 4 ("fix this") and 5 ("fix both").

- Nexus/spawn-zone burn: battle.js `_zoneBurnHit` writes one line through applyDamageToUnit's one-hit logSink ("⬡ The enemy-held Nexus burns X for N HP damage."). The number is the HIT (overkill included, like every hit line), not the HP lost. My call, not asked of mondo.
- Fall: state.js applyFallDamage writes one line "Fall: X falls 4 levels for 95 HP damage." + notes.
- Area casts: `_castLeadOnce(unit, spell)` names "X casts Spell:" on the first body, then "Spell: Y takes N" (aoe/cross/aoePull, line, zoneCastDamage, wall/flood).
- New hit lines: reuse the logSink (`_multiHitLogSink`, `sink.last = true`, then `_multiHitLogFlush`) instead of a second addLog.
