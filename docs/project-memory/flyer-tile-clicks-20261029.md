---
name: flyer-tile-clicks-20261029
description: PR #657 + #687 (10-29): a tile click always means the ground unit, a flyer only by clicking its body; picked target row louder than the hovered row
metadata:
  type: project
  modified: 2026-10-29T23:28:50.949Z
---

mondo 2026-10-29 (notes on the 10-28 VS CPU playtest, shot 5 / bug 3): "clicking a flying unit and clicking a tile need to be 2 separate things". Then (answering the flagged call): "the tile click should always mean the unit on the ground, clicking a flyer should require clicking on the actual flyer". Shot 4: the hovered row looked like the pick.

PR #657 (root/Move clicks + body pick + hud has-pick) and PR #687 (armed clicks + hover), main 4347812, zip r2-sync/ENTROPY_WARS_SYNC_20261029-2328.zip.
- three-renderer _screenClick sets window._ewGroundClick = !unitHit; _boardPickBody shared by click + armed hover; armed hover aims at the body under the pointer (window._ewHoverBodyId).
- battle.js: _groundClickPassesFlyer (no verb / Move: ground under flyer = tile menu / move); _armedUnitAim + _boardBodyPick (body click = that body's list row, items too) + _groundAimPick (armed ground click = the unit on the ground, none = "Nobody on the ground there. Click <flyer> itself"); _hoverAimBody. Host + guest (_ewGuestBoardPick). Tile/self/directional/line casts keep the tile.
- Supersedes the board-click column rule in [[target-column-rule]].
- hud.js .hrlg-list.has-pick: picked row wears Selected look (UI Maker selectors too), hovered non-pick row washed out.
- Staging note: units can't move under an ENEMY flyer, and Shot Recorder place() refuses taken tiles, so shared columns are same-team only; the enemy-flyer-over-enemy-ground pick wasn't browser-staged.
Notes: docs/notes/champions-combat.md "THE FLYER IS NOT THE TILE".
