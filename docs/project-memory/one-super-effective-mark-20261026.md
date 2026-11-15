---
name: one-super-effective-mark-20261026
description: Abilities-menu green ! over heads now shows on every hovered cast (quick lists, board aim); Wall of Fire fix (PR #536, 2026-10-26)
metadata:
  type: project
  modified: 2026-10-26T07:43:06.590Z
---
PR #536 was merged on 2026-10-26 with token 20261026-onemark-01-cors. Sync zip: r2-sync/ENTROPY_WARS_SYNC_20261026-0742.zip (battle.js 27e908c3, hud.js 4c7b6a6d, three-renderer.js fdfceb74, ui.js 0091ca23).

mondo likes the abilities menu's big green ! over targets and wants it everywhere. He also said: "from the quick action menu, it will still show other useful info like resisted or grounded or poisons it etc, so keep that".

- three-renderer `showPressMarks(ids, half, group, lifts)` takes group 'menu' (the abilities hover) or 'forecast' (a hovered cast). There is one ! per body, and lifts put the ! above the plate stack.
- ui.js `_ewShowForecastPressMarks` is called from `_fcRenderBadges` and from the updateIntentPreview fallback. The plates keep their words; only their small inline ! moved to the head. With UI Maker "Over the enemies" off, the plates show the small ! as before.
- The Wall of Fire bug: terrainCreate is not in `_FORECAST_KINDS`, so its hover drew nothing. hud.js `_showMoveArrowPreview` now marks the target from the row's own `press`, which also covers the attack and combo rows.
- forecastPressOn returns no press for a `missesFlyers` spell against an airborne flyer.

Calls the thread made: dropped the small ! inside the plates (the words stay) and the flyer fix. Before/after shots are in /mnt/project-files/super-effective-mark/. Related: [[wall-of-fire-flyers-20261026]] [[spell-buttons]]

FOG VETO REMOVED (PR #556, 2026-10-26, token 20261026-fogpress-01-cors, zip ENTROPY_WARS_SYNC_20261026-1430.zip battle.js 20eaa272). mondo reported Chain Reaction / Chemical Concoction showing SUPER EFFECTIVE with no !. The cause was _forecastHideFogged's fog veto: it dropped the press whenever any blast tile was fogged. mondo picked "Judge what you can see" on the card, so the ! is now judged only on visible bodies (hidden enemies still leave the plan) and a hidden resister can still cut the real refund.
