---
name: shared-family-exclusions
description: Shared spell family pass (PR #426, 2026-10-23): RACE_SPELL_EXCLUDES filled, 292 exclusions, Lasso cowboy only, cosmic split by race
metadata:
  type: project
  modified: 2026-10-23T04:48:52.319Z
---
mondo asked (2026-10-23) for every race to get a unique family (three sibling threads A-F / G-O / P-Z) and for shared families to exclude spells that don't fit some races. Thread "Shared spell family exclusions" did the shared part.

- data.js RACE_SPELL_EXCLUDES (per-race toggle that already existed since 10-17, was empty) now has 292 exclusions on 97 races. Rule used: a spell whose text names one race, or that only fits some races, is off for the others. Floor: every race keeps 12+ spells (door agent's size). No spell deleted, no tag changed in that PR.
- Lasso: kept in Ropework, cowboy only (mondo's own example). Ringmaster lost its Lasso rung.
- Cosmic split: annunaki/astronaut = gravity, wraith = entropy, watcher = sight/time, orb = Supernova/Nebula/Black Hole, ice queen = Entropic Beam/Heat Death/Star Decree.
- Sibling moves out of shared families (families tag changed by them): Excalibur Strike → King Arthur, Atomic Breath → Kaiju, Fee Fi Fo Fum → Giant, Labyrinth Roar → Minotaur (G-O), Heat Vision → Superhero (P-Z). Siren Song and Shadow Realm stayed shared and got exclusions instead.
- flRacePool (Adaptable borrow) now lends a family spell only from an owned race that learns it.
- Full per-family list with reasons: https://claude.ai/artifact/2kPgzXj9Qb1HZRWCt7T2qL (file /mnt/project-files/shared-families/).

**Why:** later spell/family threads should change exclusions in RACE_SPELL_EXCLUDES (or the POOLS tab ✓ boxes) rather than moving or deleting spells.
**How to apply:** a new shared spell that fits only some races gets an exclusion; keep every race at 12+ spells. See [[spell-library-plan]] [[spell-family-audit]].
