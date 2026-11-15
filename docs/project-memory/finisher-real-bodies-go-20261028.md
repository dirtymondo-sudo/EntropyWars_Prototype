---
name: finisher-real-bodies-go-20261028
description: PR #650 (10-28) G-O Entropy finishers use the units' own models, catalogue props and terrain sheets; gotchas + missing models
metadata:
  type: project
  modified: 2026-10-28T16:53:55.512Z
---
mondo 10-28 was angry that finishers used blobs / bigger crude copies of the unit and crude walls. The work was split into three threads (A-F, G-O, P-Z). P-Z merged as PR #649 and G-O as PR #650. A-F was still open on 10-28. Visuals only.

**What G-O built:**
- `ThreeVFXEffects.finSetCast(unit, target, {hitAt})` is called in battle.js `_finPlayCinematic`.
- `_finRealBody`, `_finCasterBody`, `_finRaceBody`, `_finCopyBody` and `_finCat` (catalogue props).
- The `_finTex*` terrain-sheet solids.
- In `_raceActor`: `tint(col, {map})` and `clip(plane | [planes])`.

**Gotchas:**
- The `finSetCast` export was missing at first, so every real body silently fell back. Check the export before judging captures.
- A fake `.material` on a Group needs `dispose(){}`, otherwise `_sigDisposeGroup` throws.
- The bat wing comes from `ThreeRenderer.getWingPair('bat')`. A halfdemon on the board warms it.

**Calls flagged to mondo:**
- The Pile On horde is 24 real models (it was 40 stand-ins), for weak PCs.
- The Praying and The Probe cut the victim's own model with clip planes.

**Missing models** (in MISSING_MODELS.md): tripod fighting machine, lawnmower, parachute, shovel, pigeon, open hand, skyscraper, headstone.

**Captures:** /mnt/project-files/finisher-visuals/. The harness is /tmp/fin/fin-run.js, which lives only in the session container.

See also [[spell-vfx-fx3-20261026]].
