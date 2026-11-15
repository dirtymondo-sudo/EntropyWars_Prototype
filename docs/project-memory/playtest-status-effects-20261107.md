---
name: playtest-status-effects-20261107
description: 11-07 status effects playtest (report only): durations mostly 1-2 not 3, statuses on killed units, DoT extra tick, BLD badge clash, page mismatches
metadata:
  type: project
  modified: 2026-11-07T04:11:53.280Z
---

11-07 thread "Playtest every status effect against its description" (thread in the owner project), main 913c719, report only.
Report: /mnt/project-files/playtest-mechanics-20261107/PLAYTEST_STATUS_EFFECTS_20261107.md (+ status-effects/: shots, ledger, match exports, library_text.txt, status_rows_from_data.json).

Facts found: 62 real statuses (68 STATUS_DEFS, 6 display-only); Pause > STATUSES lists all 62, none obsolete. 398 spell rows apply statuses: 171 at 1 round, 188 at 2, 39 at 3 (11 = Jammed). Descriptions match data (228/229). So mondo's "most statuses last 3 rounds" is NOT how the game is built: open question to him. Stat stages + terrain timers do last 3.
Bugs: A statuses/stat drops land on the unit the same hit killed (Vivisection grievous, Migraine weakened; PR #971 gate checks dead/_dying only); B DoT landing after victim's turn ticks N+1 times (ONE ROUND = ONE TURN skip); C Blind and Bleeding both badge "BLD"; D active-unit arrow cuts nameplate name ("COWBO"); E log wording ("is Charm", super effective on 12-dmg bump, no Blessed/Regen heal line).
Mismatch table M1-M14 (Taser Bolt "a round" vs Jammed 3; Charm blocks all movement vs "against the charmer"; Minimized has no dodge; Marked physical-only; page DoT numbers are level-1 base, ×1.75 at VS CPU level; Feared flees every turn; Hexed not on attacks; Spawn Guard ×0.5 not immune; etc).
Harness tip: VS CPU CPU units carry the Lingering upgrade (+1 round statuses). Party builder search box 690,103; slots y=590 first pick then y=575 and click ROSTER tab 507,51 between picks.
Related [[playtest-elements-20261106]] [[playtest-vscpu-20261103]]

FIX 11-07 PR #980 (thread in the owner project): mismatch table M1-M14 fixed by making TEXT match code (no rules changed). Open: mondo asked to pick Charm rule (decision card (thread in the owner project): can't move only / can't move or hit charmer / hard CC). Also listed for him: Minimized dodge, Marked any hit, Feared one flee.
