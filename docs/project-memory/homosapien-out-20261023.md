---
name: homosapien-out-20261023
description: Homosapien removed from the game (PR #447, 10-23); DOOR Agent is the default, story starter and the creator's race
metadata:
  type: project
  modified: 2026-10-23T07:49:41.981Z
---
mondo (2026-10-23): "take homosapien out of the game ... door agent should be the default for story mode and create a character should be accessed through door agent".

PR #447 (merged 10-23, token 20261023-agentdefault-01-cors):
- Homosapien is out of AVAILABLE_RACES and ACCT_STARTER_UNITS. Its data rows and model stay, because the werewolf day form uses the model and old saves still draw.
- DOOR Agent is now DEFAULT_IDENTITY, the fallback race, the Mystery Dungeon starter, the Challenge creator's default and the mirror's look race.
- The forge's GEAR > CHARACTER CREATOR works only on a DOOR Agent slot.
- Old saved teams are flagged REMOVED, never deleted (state.js teamRemovedRaces). They can't start until the unit is swapped out.
- Flagged to mondo: the Disaster City harbour angler NPC still uses the plain human model (it can't be fought).

Related: [[visual-rules]]
