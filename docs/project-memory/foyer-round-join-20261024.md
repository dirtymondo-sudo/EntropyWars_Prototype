---
name: foyer-round-join-20261024
description: PR #480 (10-24) removed the foyer ⇄ main hall load card; the revolving door turns and you walk through (THE ROUND JOIN)
metadata:
  type: project
  modified: 2026-10-24T10:45:23.535Z
---

mondo asked (10-24) to get rid of the loading screen between the foyer and the main hall, either a different door or make the revolving door actually turn. Done in PR #480 (merged 2026-10-24, sync zip ENTROPY_WARS_SYNC_20261024-1045).

- data.js HQ_STAGE_RULES.round row joins hall door `foyer` (deg 195) to foyer door `egress`; the stage now handles a ROUND room (rotunda) as well as boxes (fractional rel.rot).
- The hall's existing revolving-door GLB stands in the doorway and spins while the walker is near, settling on a quarter turn; foyer's own leaf hides.
- Trade-off: the first arrival in the foyer keeps the load card until the hall is built behind it (one longer load, ~1 min in the slow cloud harness); later crossings have no card.
- Kill-switch: window.EW_HQ_NO_STAGE = true restores the old door + card.
- Notes: docs/notes/hq-building-rooms.md "THE ROUND JOIN". Other rotunda doors still use cards; the same `round` row pattern could join them.

**Why:** future HQ door/stage threads should reuse this instead of re-inventing it.
**How to apply:** to remove another card on a hall door, add a `round` row and check hqStageRoundGeom fits that room. Related: [[zones-plan]] [[stacked-floors-pick]]
