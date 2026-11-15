---
name: meshy-default-20261103
description: 11-03 PR #812: Meshy models are the default for every race again; baked creator looks are saved options; the creator opens on every unit
metadata:
  type: project
  modified: 2026-11-03T01:18:20.308Z
---
mondo 11-03: "Let the character creator be available to all units so i can make custom models for them. Don't get rid of the old models, the old models should stay the default until i say so or we have all new characters models through the character creator. So even the cowboy, its default model should still be the meshy model" + "make sure that custom cowboy is still saved and there as an option".

PR #812 (zip ENTROPY_WARS_SYNC_20261103-0118, token 20261103-meshydef-02-cors):
- sprites.js `EW_RACE_LOOKS_ARE_DEFAULT = false`. RACE_CREATOR_LOOKS rows (the cowboy and cowgirl, plus batch 1) are now SAVED looks. Every race and every CPU wears Meshy/sprite. Only mondo may flip the switch.
- The forge creator opens on every race:
  - USE THE SAVED <RACE> LOOK, CREATE APPEARANCE and RANDOM.
  - RESET TO SAVED LOOK, USE ORIGINAL MODEL, and EXPORT RACE LOOK (renamed from EXPORT DEFAULT LOOK).
- bake-looks.js takes any race.
- Sprite-only races stand in creator looks.
- Plan row 20b. Notes: character-creator.md "THE MESHY DEFAULT".

**Why:** future race-look batches must NOT make looks the default. Baking only adds a saved option.
**How to apply:** never set EW_RACE_LOOKS_ARE_DEFAULT true without mondo saying so. Related: [[race-looks-cowboy-20261101]] [[race-looks-batch1-20261102]] [[character-models-plan-doc]]
