---
name: race-signature-families
description: Every race got its own unique "signature" spell family (mondo 2026-10-23); A-F done in PR #432, P-Z in PR #429; conventions for adding more
metadata:
  type: project
  modified: 2026-10-23T05:14:27.462Z
---

mondo (2026-10-23) asked for every race to have at least one spell family that only it can use, "each race as its own JRPG or Dark Souls boss". The work was split across parallel threads by race letter. The A-F thread (PR #432, merged 10-23: 32 families, 66 spells) uses `sig*`; A-F appends its family LAST in RACE_FAMILIES and its rows at the BOTTOM of RACE_ABILITIES (either order works). The P-Z thread (PR #429, merged 10-23) uses `pz*`.

**Conventions:**
- Each family row in SPELL_FAMILIES has:
  - `kind: 'signature'`
  - `unique: '<race>'`. This keeps other races and Adaptable kits from borrowing it.
  - an `identity: {who, adj, look, vibe}` kit for the Spell Library IDENTITY tab.
- The new family goes first in RACE_FAMILIES.
- Spells go at the top of RACE_ABILITIES[race].
- Usually a tier 1-2 setup spell applies an EXISTING status, and a tier 3-4 finisher does x1.5 against that status and applies nothing.
- All spells cost 1 AP, use the twelve elements and existing riders only, and add no new statuses or rules.

**P-Z calls flagged to mondo:**
- Heat Vision moved to the superhero's `solarpowered` family, so antihero and sidekick lose it.
- 11 single-race families were flagged unique: piracy, politics, football, mirrormagic, animalhandling, archery, sentai, vampiricabilties, arachnid, werewolf, zombie.
- The three leap finishers need higher ground (the existing leapStrike rule).

**A-F calls flagged to mondo:** 6 one-race families flagged unique (gambling, feline, internetaddiction, door, dragonabilities, fortunetelling); no spell moved. TRAP: `randomTargets`/`splash` on a literal data.js row crashes boot (TDZ).

VFX pass: A-F (sig* + the 11 PR #423 race* spells) done in PR #457 (2026-10-23), three-vfx-effects.js block "THE A-F SIGNATURE VFX PASS" (_af*), battle.js `_sigVfxGeom` doors (':swap' ':throw' ':deploy' ':detonate' ':mark' ':view' ':solo'; deploy/mark owner-only); sheets in /mnt/project-files/signature-vfx-af/. Traps: an aoe def with geom3D double-builds (_fireAoeMapped already calls the registry); a bolt-carried piece needs boltGeometry; never Object.assign a mesh's position (read-only in r186).

Pages: P-Z https://claude.ai/artifact/HSTa8a5Pr7tFRW94qpUtwZ · A-F https://claude.ai/artifact/FTdPvkrosiNKUGB4wVLejv

Notes: docs/notes/champions-combat.md, "THE P-Z SIGNATURE FAMILIES". Related: [[spell-family-audit]] [[spell-library-plan]]
