---
name: pause-menu-place-20261105
description: Pause menu (11-05, PR #904): settings no longer replay the UI Maker open animation; both pause menus reopen on same page/scroll/folds
metadata:
  type: project
  modified: 2026-11-05T06:46:05.303Z
---
mondo 11-05: changing a setting closed+reopened the pause menu; wants reopen at the same spot (tests video settings).
PR #904 merged, token 20261105-pauseplace-02-cors, ui.js + map.js uploaded to R2.
- Cause: ui.js _renderPauseMenu rebuilt the whole .pause-card via innerHTML; the UI Maker motion (hud.js pause panel role, shipped theme uim-stretch) replayed on the new element.
- Rule: never rebuild a UIM panel-role element on a re-render; refill its inside (any screen with a motion.open theme replays otherwise).
- Reopen place: ui.js _pauseLastPlace (filed in closePauseMenu), map.js _hqPauseLast (filed in _hqPauseDrop). Memory only.
Notes: docs/notes/ui-menus-audio.md "THE PAUSE MENU STAYS PUT". [[ui-maker]]
