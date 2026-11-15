---
name: priest-nun-merged-20261027
description: Priest + Nun merged into one race 'priest' (male Priest, female Nun) in PR #609, 10-27; gender-only spells, RACE_MERGED alias, calls flagged to mondo
metadata:
  type: project
  modified: 2026-10-27T09:00:12.061Z
---
mondo 10-27: "the priest and the nun are supposed to be male and female versions of the same race ... like the cowboy and cowgirl". PR #609 (merged 10-27, token 20261027-priestnun-02-cors, zip ENTROPY_WARS_SYNC_20261027-0859).

- One key `priest`: labelMale Priest, labelFemale Nun. `nun` gone from AVAILABLE_RACES/server. "Priestess" label gone.
- data.js RACE_MERGED {nun → priest female}: old saves/teams/captures/owned read as female priest; team with both = flagged by ONE OF EACH.
- NEW MECHANISM: data.js RACE_GENDER_SPELLS — gender-only spells. Pool functions (raceFamilyPoolIds, unitSpellPool(Parts), spellAddVerdict, treeLegalSubset, buildTreeLegalLoadout, raceDefaultKit...) take an optional trailing `gender`.
- `<race>:female` keys now also work for FINISHERS (getFinisherDefForRace gender) and CODEX_LORE, besides DOOR_ROSTER_LINES.
- Male model: R2 Races/priest/Meshy_AI_priest_Running.glb + priest.png (same pixels as the male whitemage sheet).
- Room npcSpots honour `gender` (three-renderer).

CALLS flagged to mondo (awaiting his word): Priest-only Holy Water + Last Rites, Nun-only Ruler Smack + Vow of Silence; both use the Priest's stats (Nun old row in a comment: vision 2→3 etc.); Devout passive now both genders; Nun keeps the Ruler finisher.
