---
name: ui-maker-bar-colour-specificity
description: UI Maker Health bars CSS (hud.js barsCss) only hits the HUD bars once a bar setting is touched; enemy-red-vs-green bug fixed PR #406 (2026-10-22)
metadata:
  type: project
  modified: 2026-10-22T06:51:35.971Z
---

mondo 2026-10-22: "in the unit info panel enemy health bar should still show up as red, not green". Fixed in PR #406 (merged, main a7154b5, hud.js f2e7a8c4, live on R2 by 06:50 UTC).

- Cause: hud.js `barsCss` writes `!important` colour rules for every bar, but ONLY once some bar look setting (fill, segments, glow, colours) differs from BARS_DEF. A fresh profile never shows the bug. mondo's profile has bar settings changed, so bugs here only show for him.
- The HP selector `.hrlg-thp:not(.mp) > .hrlg-thp-fill` outranked the foe selector `.hrlg-thp-fill.foe`. The foe one is now `.hrlg-thp:not(.mp) > .hrlg-thp-fill.foe`.
- Still open (not asked): the ally low-HP selector `.hrlg-thp-fill.low` loses to the HP rule the same way on the unit info card / target rows.

**How to apply:** to reproduce bar-colour reports, seed localStorage `ew_ui_maker` = `{"bars":{"look":{"fill":"segments"}}}` before load. Online guest: the card's enemy/ally class is picked relative to the viewer (isEnemyUnit / getViewerPlayer), so CSS fixes cover the guest too. [[hud-rules]] [[ui-maker]]
