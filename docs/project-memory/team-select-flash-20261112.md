---
name: team-select-flash-20261112
description: Team select left buttons flashed inward on open; fixed PR #1209 (transform animation on the dock broke screen-pinned pieces)
metadata:
  type: project
  modified: 2026-11-12T13:02:21.240Z
---
PR #1209 (merged 2026-11-12, token 20261112-sqflash-03-cors, styles-base.css 1483a0d9 uploaded live). Thread (thread in the owner project).
mondo: team select buttons on the left "briefly show more inward" before the correct place.
Cause: entrance animation sqCardIn transformed the whole `.sq-dock`; a transformed box is the frame for its `position: fixed`
children, so the UI Maker screen-pinned stack (sqact pin l, pinM 32) stood inside the dock for ~0.66 s.
Fix: dock does not animate; `.sq-bar` flies in, `.sq-actions` only fades (sqFadeIn). Final position unchanged.
**How to apply:** any "piece flashes in the wrong place then jumps" report on a menu with UI Maker pinned pieces: look for a
transform / filter animation on an ancestor first. Headless proof = per-frame getBoundingClientRect after `_openSquadDesk('cpu')`.
Not checked on his Mac Firefox. The Oculus eyeball missing on this screen is a separate thread.
Related: [[ui-maker]] [[hud-rules]]
