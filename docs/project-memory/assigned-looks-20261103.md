---
name: assigned-looks-20261103
description: Creator ASSIGN TO <unit> + EXPORT ALL ASSIGNED (PR #853, 11-03): many race looks in one bake file; how to bake what mondo sends
metadata:
  type: project
  modified: 2026-11-05T07:18:05.112Z
---

mondo 11-03 asked for one button that assigns a created character to its unit (separate from SAVE CHARACTER) and one button that exports every newly assigned look in a single file for baking.

PR #853 (zip ENTROPY_WARS_SYNC_20261103-1042) added the Assigned looks box under the forge creator.
- ASSIGN TO <RACE> ♂/♀ stores the look in localStorage `ew_assigned_looks`, one per race + gender.
- EXPORT ALL ASSIGNED writes `Entropy_Wars_Race_Looks_<n>_assigned_<stamp>.json`. It uses the same `entropy-wars-race-looks` shape as EXPORT RACE LOOK.
- Each assigned look shows a chip: NEW, EXPORTED, or IN THE GAME (equal to the baked row; skipped by the export).

- 11-05 PR #907: pressing a chip LOADS that look (this slot if same race, else the team's slot of that race, else that race goes on this slot); ON THE STAGE tag on the loaded one.

**Why:** before this he had to export each unit separately.
**How to apply:** when he sends that file, run `node bake-looks.js <file>`. The baked looks become SAVED looks, and Meshy stays the default until he says otherwise. Notes: character-creator.md "THE ASSIGNED LOOKS", plan row 20c. Related: [[race-looks-cowboy-20261101]] [[meshy-default-20261103]]
