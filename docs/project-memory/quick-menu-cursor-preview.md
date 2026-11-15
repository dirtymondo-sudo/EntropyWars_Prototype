---
name: quick-menu-cursor-preview
description: PR #537 (2026-10-26): enemy/ally quick menu's highlighted row shows its hover preview on open and on key/wheel steps
metadata:
  type: project
  modified: 2026-10-26T07:54:26.013Z
---
mondo 2026-10-26: the first quick-menu row was highlighted on open but its predicted damage only showed after a mouse hover.

PR #537, token 20261026-qmrowprev-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261026-0754.zip (hud.js only). hud.js HorologeMenu "THE CURSOR ROW'S PREVIEW": on `enemy|`/`ally|` panels the cursor row runs its own `hoverIn` (the existing `_showMoveArrowPreview`) when the menu opens or the keys/wheel/pad step. A hover or a fire takes over (`autoPrev` ref). Cleanup only runs `hoverOut` while `window._hoverActionForecast` is still the one it set. Checked in the playtest harness (enemy, ally, ArrowDown/Up, ESC, Enter→CONFIRM cast).

Thread's call: key/wheel steps preview too ("hover IS selection"); the Abilities list and tile menu are unchanged. Related: [[quick-cast-aim]] [[quick-menu-aoe-placement]].
