---
name: balance-stats21-20261025
description: 10-25 stats21 Balance Lab read + PR #528 (HP/spell trims top, buffs bottom, race detail export); calls flagged to mondo
metadata:
  type: project
  modified: 2026-10-25T21:05:25.405Z
---
mondo 10-25 sent ew-balance-stats21.json (1,239 Arena matches, build 20261025-climb-02-cors, AI v4.19); stats20 is
/mnt/project-files/uploads/hearth/748e3762-c316-4bf2-ab27-a5461f39b419. Report doc: https://claude.ai/artifact/5MWV76CeSqY9m6XotjqWRg

Findings: true race spread ~8 pts both runs (n~80/race = ±11 noise). HP dominates (r 0.50), then SPD/move; ATK/INT ~0
with HP held; CRT/MDEF negative -> racePowerBudget underprices HP/SPD (repricing = mondo's call, not done). Earth +
blood elements 57%, psychic 46%. Bleed 63%. AI v4.19 tripled zero-damage utility casts (Trick Room/Mimicry/
Misdirection/Shake It Off) - AI follow-up offered, not done.

PR #528 (merged, token 20261025-stats21-01-cors, zip ENTROPY_WARS_SYNC_20261025-2103.zip = battle.js + data.js):
nerfs Descending Wrath, Stone Drop, Cataclysm Stomp, Whole House Shakes; HP cuts Kaiju/Ghoul/Flesheater/Gargoyle/Mech.
Buffs: 9 bottom-race own spells; HP Telepath/Shadow Entity/Mime/Voidweaver; SPD 50 Nun/Jellyfish (move 2). Stat
changes flagged as my calls. Export: races[r].detail/base, spell castWr/row, analysis.teamAdjusted (logistic fit,
matchLog cap 2000), statVsWinRate, flags; DoT kills now counted. Notes: docs/notes/champions-combat.md "STATS21".
Related [[balance-fx-tracking-20261025]] [[weak-races-lab-20261023]].
