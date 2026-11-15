---
name: strong-races-check-20261023
description: Strong races check (Atlantean, Dinosaur, Mech, Demon Princess), 10-23: why they win, proposed nerfs, lab test results; spell nerfs SHIPPED in PR #473 (10-24).
metadata:
  type: project
  modified: 2026-10-23T10:11:56.586Z
---

mondo 10-23 asked for a playthrough + diagnosis of the strongest races. Report: https://claude.ai/artifact/VaZD3PzHR3vyYJ6uuGMVGo (files /mnt/project-files/strong-races/). Sibling weak-race report: [[weak-races]] artifact P159GAtjGKrTGzquEvyVgA. Harness: /mnt/project-files/balance/weak-races-harness/.

Baseline lab (321 matches, one of the four per match): Atl 66%, Dino 60%, Mech 68%, DP 68%. Hand-played VS CPU on Stonehenge 12x12: won 352-294, MVP Demon Princess.

Diagnosis: Mech + Dino = stats (budget #4/#6 of 124, move 5); Mech Siege Mode (+2 range) and Full Burst (1,302 dmg/cast, #1 of all spells). Atlantean = spells (Crystal Resonator x1.5 vs Wet stacks with Wet-conducts x1.5 = x2.25 on a 3x3). DP = pool breadth (33 spells, 12 self-status finishers, 6 drains), stats are median.

Lab tests (proposals, NOT built): spell trims -> Atl 59%, Dino 61%, Mech 60%, DP 64%. Spells + stats (Mech SPD 160, Dino ATK 175, DP MDEF 140) -> Atl 57%, Dino 69%, Mech 62%, DP 67%. Only Atlantean really responded; Dino needs SPD/HP (untested); DP would need a pool trim (removes content, flagged as his call).

Unconfirmed: rounds 7 and 12 of the hand-played match passed with no unit acting (cloud harness, not investigated).

SHIPPED 10-24 (PR #473, mondo: "go with your fixes and what you think is best"): Full Burst 120, Mortar Salvo 70 range 4, Siege Mode 2 rounds (siegeMode status shared with Sniper Bipod, so +2 RNG untouched), Crystal Resonator x1.25 vs Wet, Tail Whip 85, Kiss of Decay drain 25%, Last Dance drain 30%. NOT shipped: shared-spell trims, Jurassic Jaw (its AP refund was broken until 10-23), all stat cuts (Dino SPD 160, DP INT 150, Mech SPD 160 showed no lab effect). Final lab (251 matches): Atl 57%, Dino 65%, Mech 67%, DP 68% (+-11, noise). DP pool trim still his call.

**Why:** mondo picks which nerfs to build. **How to apply:** don't build any of these without his pick; balance spells before race stats; a bigger-cut lab round (v3) was offered.
