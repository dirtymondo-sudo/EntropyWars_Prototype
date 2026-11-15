---
name: playtest-zones-traps-20261107
description: 11-07 zones/traps/walls/summons VS CPU playtest (report only, 11 battles, all 149 spells checked): bug families A-K, worst = trap cap deletes traps, jump skips traps, summon targeting, desc mismatches
metadata:
  type: project
  modified: 2026-11-07T06:30:42.520Z
---

11-07 thread "Playtest zone, trap, wall and summon spells" (part of mondo's "test every unique-mechanic spell" ask), main b3ab112,
report only, nothing changed. Report: /mnt/project-files/playtest-mechanics-20261107/PLAYTEST_ZONES_TRAPS_20261107.md
Part 1 = battles 1-3 (shots-zones/, zones-ledger.jsonl, zones-match-1..3.json). Part 2 = battles 4-11 appended after the
coordinator asked for full coverage (shots-zones2/, zones2-ledger.jsonl, zones2-match-1..8.json = battles 4-11).
Part 2 ends with a table of all 149 family spells: 89 cast, 57 grouped (same kind), 3 not castable (Baleful Gaze: Cyclops
locked in shop; Titan Drop / Seismic Leap: need a target below caster, flat arena).

Families: A traps (deployObject cap counts ALL caster objects -> silently deletes other traps, seen again with Tesla+Cloning
Machine; doJump never calls _chainFuses; 5G Tower shoots 8); B targeting (summons list own units / Summon Creation offers an
ENEMY and spends a jump; Swing Door MOVE->CAST walks into own fire; Call of the Deep / Walk the Plank tile-select, no rows,
wrong "no longer in range" text; Raise the Dead says NO TARGET for AP); C units on Mimicry double; D desc mismatches
(Plaguefield not permanent, Swing Door push 1 not 2 + Twin Door no carry, Hellmouth no lava, Dragon Breath 1 tile not 3,
Bumper Crop kills own objects + rim seeds, Walk the Plank no overflow, Beacon 20 not 40?); E CPU walks into zones;
F Hound/Elephant idle silently; G zones outline-only (Dimensional Web is the good one); H log nits; I Shadow Realm leaks
(Wolf bites hidden Fairy, Oath buffs Demon in realm); J Stone Drop camera under terrain, HIGH GROUND banner cut off;
K balance (Stone Drop WEAK 1113 one-shot; Quake castable with no enemy; Raise the Dead nearly uncastable).

Harness tips: summon/trap/ground spells: click a free board square (ctile), not the target list; zoom out (ph wheel) when the
camera hides adjacent squares; party builder after a match: slots `.pb-party-name`, ROSTER tab, search `input.pb-pill-input`,
spells `.pb-sc-name` (scrollIntoView then re-measure before clicking). Raise the Dead: keep the Necro unmoved next to allies.
FIXED 11-07: summons B1 + Bumper Crop D (PR #1019: summonUnit never aims at a unit, summonTileFree, rim seeds skip own pieces, walkers go round decoys; Bumper own-piece hits were already fixed by PR #987).
FIXED 11-07: D area/duration (PR #1030: Dragon Breath line levels off past aim = 3 tiles; line spells mark ground under airborne beam; Plaguefield permanentTerrain; Rampart mounds over field water + revert sinks first). Ooze Trail/Poison Swamp/Walk the Plank overflow = derived getLiquidFlowAt halo, already as written. Proofs: playtest-mechanics-20261107/zone-area-duration/.
Related [[playtest-elements-20261106]] [[forced-movement-rules]]
