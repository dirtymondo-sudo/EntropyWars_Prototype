---
name: spell-audit-findings-20261026
description: Root causes found by the 10-26 spell audit (report only, nothing fixed yet) — B1-A damage + B4 movement batches
metadata:
  type: project
  modified: 2026-10-26T12:58:02.604Z
---
10-26 spell audit, batch B1-single-damage-A (111 spells): 5 broken, 13 off, 7 suspect. Full list:
/mnt/project-files/spell-audit/findings/B1-single-damage-A.md. Nothing fixed (mondo asked for a report only).

Shared root causes worth knowing before a fix pass:
- battle.js `_applyDamageSpellHit` (single-target `damage` kind) never reads `statStageBoost`, `groundsFlyers` or
  `terrainDeform`; only the debuff / AoE / terrainCreate paths do. Broken: Acid Flask, Death Gaze (no DEF -1),
  Piledriver, Air Mail (flyer not grounded), Colossal Crush (no stamp).
- Marked (`markBonus`) is consumed only by basic attacks: single-target spells pass allowMarkBonus:false, so Dead Eye /
  Knife Throw "next hit" text is off. The flat bonus is level-scaled (60 lands ~90-110).
- The turn-start log "is stunned and cannot move!" fires for any blockMove status (root/frozen/charm), ~battle.js 54270.
- Harness gotcha: the spell-lab tick clears cooldowns and refills AP after every cast; to test CD/AP, stub
  window._spellLabTick for that cast. Round 1 ends without enemies acting, so DoTs tick one extra time.

B4 movement/displacement (118 spells): 1 broken, 29 off, 9 suspect; findings/B4-movement-displacement.md.
- BROKEN: Infernal Waltz never Charms (swap branch battle.js ~73368 ignores statusEffects).
- Haymaker/Kinetic Hurl "shove sideways" but push straight back; Haymaker text says Rooted, row bonus is Stagger.
- 7 leap strikes need the caster above the target (text silent; uncastable on flat ground); >3 levels up = "out of range".
- Infect text 4 activations vs row 2; Nimble Dodge text 2 tiles/3 rounds vs row 3/2; sky throw forecast 0; drop forecast
  leaves out the fall.
- Harness gotchas: seed 12345 always resists (use 27); board vision is 2, so aims past 2 tiles need spotter allies;
  setHeightAt alone does not raise walkable columns (rebuild state.boardColumns too).

See [[spell-audit-harness-20261026]].

B1-single-damage-B (110 spells): 9 broken, 19 off, 2 suspect; findings/B1-single-damage-B.md. Same damage-path root
causes (no statStageBoost: Synthetic Blade/Love Bite/Migraine/Valkyrie Spear; no terrainDeform: Ape Fury/Flat Earth), plus:
- executeBelowPct judged on PRE-hit HP; Termination Protocol / Ammit text says "if the hit leaves it under N%".
- High Noon "always crits" has no critChance (guaranteedCrit is a dead field).
- echoLastDealt (Overfit, Paradox) replaces the base (cap 500) instead of a second hit; log number != damage dealt.
- Forecast misses: Goo Shot statusFirst x1.25, sneakBonus while invisible, Ammit execute, Swing Door hinge (blank).
