---
name: spell-audit-f3-loglines-20261026
description: Spell audit fix batch F3 (log lines) shipped as PR #560 on 10-26; what changed and the calls flagged
metadata:
  type: project
  modified: 2026-10-26T16:07:11.560Z
---
PR #560 merged 2026-10-26 (main a30c242, token 20261026-loglines-f3-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261026-1606.zip).
Part of [[spell-audit-fix-20261026]]. Log text only, no rule changes. Merged after F6 (PR #559): the physicalHitStatus loop is F6's, and the passive names in its lines come from F3.
- battle.js `SUMMON_LOOK` maps summonDef.key to an icon and verb. Any new summon key needs a row there, or it falls back to 🧟 "strikes".
- The levitating onApply now receives `info.sourceLabel`; `unit._levitateBy` is a string.
- resolveForcedSlide logs the Windborne "holds" line. `opts.noAnchorLog` means the caller already logged it (pull kind).
- doSpell's can't-afford branch logs any getSpellBlockReason other than 'No AP'.
- Extras beyond the brief, flagged to mondo: Fermata's leftover "carried by the chord" line was replaced on team-status war cries; the hud hover icon per summon.
Notes: docs/notes/champions-combat.md "F3 log lines".
