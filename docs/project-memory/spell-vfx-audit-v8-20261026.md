---
name: spell-vfx-audit-v8-20261026
description: V8-plain-attacks batch of the 10-26 spell visual audit: done, counts and the main causes found
metadata:
  type: project
  modified: 2026-10-26T17:58:26.455Z
---
V8-plain-attacks DONE 10-26 ~17:55 UTC (report only): findings/V8-plain-attacks.md = 112 unique spells (rampage listed
twice), 10 S1, 54 S2, 29 S3, 2 not judged (To the Moon, Suplex: two-step picks). Main causes: the caster's gold turn
chevron (three-renderer _buildSelectionChevron, depthTest off) is not hidden in the action camera and covers the target
in 7 single-target debuffs; Car Toss + Skyscraper Toss have no VFX entry in three-vfx-effects.js; Ink Cloud shows no ink;
charge cam hides the target behind the caster; leap shots are far overviews. Part of [[spell-vfx-audit-20261026]].
