---
name: spell-power-review
description: 2026-10-23 spell power review — built in PR #423 (11 new spells, Stagger 41->20, Wet conducts lightning, element spread); open balance questions for mondo
metadata:
  type: project
---
Page: https://claude.ai/artifact/5v2kAZFtLm1yCam99A89kw. mondo approved 04:05Z 10-23 ("add those spells, fewer stagger, wet must conduct like water, even out elements, too much metal"). BUILT in PR #423 (merged fe3c11c, token 20261023-spellreview-02-cors, zip ENTROPY_WARS_SYNC_20261023-0418: ai.js battle.js data.js). Details: docs/notes/champions-combat.md "THE SPELL POWER REVIEW".
- 11 new rows: Open Vein, Arterial Spray, Conduction, Thornlash, Overgrowth, Crosswind, Eye of the Storm, Mudslide, Tailwind, Far Sight (remote Inspect via battle.js _inspectFootprintAt), Rustle (pull + stealKeys).
- Stagger appliers 41->20 (T3/4 became finishers; T1/2 moved to Jammed/Silence/Burn/Feared). Thread's calls on which status each moved to — not confirmed by mondo.
- Soaked units conduct lightning (_isConductiveWetTile); rain = Soaked. Drowning untouched.
- 38 rows retyped; metal 34->27. Hacking not made lightning (tech overclock rule).
STILL OPEN (asked mondo, not built): Eternal Slumber 5x5 stun -> 3x3?; cd 2 on 5x5+ nukes?; Meteor/Requiem/Tidal Slam "Cooldown: 2" text but no cd (_applyBaselineCooldowns runs before applyTreeRingCosts — likely bug); Cataclysm Stomp T2 5x5; Spirit Bomb weaker than Meteor.
Related: [[spell-family-audit]] [[playtest-cube]].
