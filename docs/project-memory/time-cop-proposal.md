---
name: time-cop-proposal
description: Time Cop race (PR #498, 2026-10-24) — sheriff/cop/future-cop look picked by the cast spell's family, look persists; flagged calls
metadata:
  type: project
  modified: 2026-10-24T15:54:04.012Z
---

mondo asked on 2026-10-24 for a Time Cop that is a sheriff, a cop or a future cop (the Cyberpunk City cops) depending on the ability it uses. He picked "look stays until next ability". It shipped in PR #498 (merged) with sync zip ENTROPY_WARS_SYNC_20261024-1553.

**Looks:**
- the cop = the black police officer. This is the starting look.
- the sheriff = the western_sherrif rig.
- the future cop = the cyberpunk_police_officer rig.

**Which ability picks which look (by the spell's family):**
- policetraining → cop
- cowboyskills or marksmanship → sheriff
- cyberpunkweapons or advancedtechnology → future cop

**Mechanism:**
- sprites.js TIME_COP_LOOKS feeds overrideForms.
- battle.js UNIT_ANIM_OVERRIDES['time cop'].castSprite sets the look.
- There is no revertAfter.

**Kit (RACE_TREE):**
- T1: Nightstick or Taser Bolt
- T2: Taser or Long Rifle
- T3: Slap Leather or Classified Weapon
- T4: High Noon or Railgun

**Flagged calls (mondo hasn't objected):**
- The Police Officer's stats, passive and Book 'Em finisher.
- Male only.
- NO signature family.
- Not in story or capture.
- No lore.

Notes are in docs/notes/champions-combat.md under "THE TIME COP". Screenshots are in /mnt/project-files/time-cop/.

Related: [[unique-race-families]]
