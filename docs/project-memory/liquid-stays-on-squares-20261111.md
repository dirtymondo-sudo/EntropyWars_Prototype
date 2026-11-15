---
name: liquid-stays-on-squares-20261111
description: Liquid rule 11-11 (PR #1113): spell liquid = exactly the spell's AoE squares, no halo; runs downhill; fills a hole
metadata:
  type: project
---
mondo 2026-11-11: "a regular line spell on flat terrain shouldnt make a whole 3x3 of liquid, just a 1x3" and "whatever the aoe of the spell is is what tiles the liquid should be, not just line spells". He keeps: liquid flowing from higher to lower terrain, and filling a hole.

Shipped PR #1113 (map.js `_recomputeLiquidFlow`, `_liquidInHole`, `liquidRunsOnto`; battle.js forecast mirror). The old one-square spring halo is gone for every liquid and shape (also weather puddles). A HOLE = level floor with higher ground or board edge on every side, no lower neighbour, at most 16 squares: that definition and the cap are the thread's pick, he can overturn. Side effect: Poison Swamp and Call of the Deep no longer hit the squares beside them on flat ground (text corrected). Ground fire has its own spread, untouched.

**How to apply:** never reintroduce sideways liquid creep on level ground. Proof + harness: /mnt/project-files/liquid-spread-20261111/ (proof.js stages casts on Proving Grounds; clear `u._spellsUsedThisTurn` between staged casts). 12x12 check 11-11 (mondo asked "will it still work on the new maps"): Stonehenge Arena, same results (line 4+0, blast own squares, raised runs down 4, 2x2 hole fills); run with `MAP="Stonehenge Arena" TAG=arena_` (boot.js launches via _msSelectedMap + _msConfirm, then forces startMatch after 60 s). Pictures there are muddy: the only flat patch sits under the yellow nexus zone, and poison is green on green; use lava/ooze/water. Not checked: online guest, WebGPU. Related [[playtest-elements-20261106]].
