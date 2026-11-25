---
name: grounded-fences-20261123
description: Floating fences fixed game-wide PR #2474 (11-23): rail runs now follow the ground (data.js _hqRailFollow); kill switch, what was left alone
metadata:
  type: project
  modified: 2026-11-23T12:43:15.680Z
---
Thread (owner-project id). Cause (mondo's diagnosis right): a ground-following `rail` row read the ground only at its two ends. Fix: data.js `_hqRailFollow` samples every 0.25 m, steps at jumps over 0.45 m, simplifies slopes within 0.1 m. LIVE PR #2474, data.js d2df3ea8, token 20261123-fences-01-cors.
- Off: `window.EW_RAIL_NO_FOLLOW = true` (before room load; used for "before" pictures), or `noFollow: true` on a row.
- Left alone: rows with explicit y/y0/y1 (castle parapets, deck pens), flight railings, single fence props (chain_fence etc).
- Disaster City probe OOMs in cloud with several views: one view per run + `EW_HQ_NO_TEX_BUILDINGS` works. Proof /mnt/project-files/grounded-fences/.
- Notes: docs/notes/areas-complexes.md "THE GROUNDED FENCES".
