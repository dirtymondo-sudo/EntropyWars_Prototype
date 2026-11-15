---
name: unique-race-families
description: Every race has a unique signature spell family (2026-10-23, PRs for A-F sig*, G-O #433 go*, P-Z pz*); conventions and VFX pass status.
metadata:
  type: project
  modified: 2026-10-23T05:48:17.759Z
---

mondo 10-23: "each race to have at least one spell family that is unique to itself ... think of each race as its own JRPG or Dark Souls boss". Done in three threads (A-F ids `sig*`, G-O ids `go*` PR #433, P-Z ids `pz*`) plus a "Shared spell family exclusions" thread.

Conventions: SPELL_FAMILIES row `kind: 'signature'`, `unique: '<race>'` (never borrowable), `identity` block feeds the IDENTITY tab; rows live in RACE_ABILITIES[race]; listed first in RACE_FAMILIES. All 124 races have one. No new statuses; T1-2 apply a status, T3-4 are bonusVsStatus finishers.

G-O list: https://claude.ai/artifact/Nvu6Ua8Et28KfQfWzu9mgw. All 85 G-O rows cast in a browser probe. Renames to avoid duplicate names: Orb of Light "Plasma Loop" (P-Z owns Solar Flare), Necromancer "The Reaping" (A-F owns Soul Harvest).

**Why:** mondo wants a reason to try each race. **How to apply:** next step he named is a separate VFX pass on these spells; new race spells go in the race's unique family; check spell names are unique across all three prefixes.

VFX PASS: G-O done in PR #445 (2026-10-23): own look per go* spell + Fee Fi Fo Fum, Atomic Breath, Labyrinth Roar in three-vfx-effects.js "THE G-O SIGNATURES"; Excalibur Strike kept its sword. Sheets in /mnt/project-files/g-o-vfx/. A-F and P-Z were sibling threads. Follow-up PR #456: real foot/hand/clay props, baked shading on solid props (_goBake); all 85 shot on screen, 10 on real WebGPU.
