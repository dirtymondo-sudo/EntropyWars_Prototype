---
name: minimap-previews-20261112
description: Minimap stays up in the command menu (PR #1196) and mirrors the board previews (PR #1203): how it reads the board, what is skipped, what is unchecked
metadata:
  type: project
  modified: 2026-11-12T11:36:12.802Z
---

mondo 11-12: "make the minimap not disappear while im navigating the combat menu. I also want the minimap to kind of mirror the spell previews and have arrows and tile highlights and damage aoes etc, like a simplified mini version of the board". Thread (thread in the owner project).

PART 1 SHIPPED PR #1196 (token 20261112-mmapmenu-02-cors, styles-hud.css + three-renderer.js uploaded): cause = the menu's own camera glides set body.ew-board-busy/ew-board-cam and the minimap (Hide while = game has the board) faded each time. Fix = body.ew-deciding (three-renderer.js `_playerDeciding`: own unit's turn, nothing playing out); .ew-mmap stays up under it. Combat log untouched. Unchecked: his Mac, online guest.

PART 2 SHIPPED PR #1203 (token 20261112-mmappreview-02-cors; three-renderer.js + hud.js uploaded) after his "looks good, go ahead" on the mock-up (artifact "Minimap Preview Mirror" https://claude.ai/artifact/StdLcbNjY8PN3rqWCE6fu6). three-renderer.js `_mmPreview` reads the board's own visible highlight plates in highlightGroup (selection reach + every setOverlay layer), `_arrowBuilds` and the hover cursor: reach = faint wash, hit/landing plates (_OVERLAY_STYLE fill >= 0.5) = solid squares, white ring on units standing on them, arrows flat, cursor white square. Skipped (`_MM_PV_SKIP`): zones, weather, telegraph, actionGlow, enemyRange, searchMap. UI Maker > Layout > Minimap > Previews: gPvReach/gPvArea/gPvArrow/gPvCursor/gPvOp. Viewer-local. Proof /mnt/project-files/minimap/previews-20261112/. Unchecked: WebGPU, his Mac, online guest, round/turned/near views. Possible asks: reach wash is dim (alpha 0.26 in _mmPreview), enemy hover range on the minimap, zones/telegraphs on it.

**How to apply:** minimap follow-ups go to this thread. A new board overlay name shows on the minimap by itself; add it to _MM_PV_SKIP if it should not. Related: [[hud-rules]] [[ui-maker]] [[aim-side-colours-20261111]].
