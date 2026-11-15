---
name: menu-playout-hold
description: Horologe stays hidden for an action's whole play-out (no flicker), PR #358 2026-10-20, how to hold it for new timed actions
metadata:
  type: project
  modified: 2026-10-20T09:15:40.259Z
---
mondo 2026-10-20: potion use made the action menu hide, flash back, hide again — "must only show when it is actually to be used ... so sloppy".

PR #358 (token 20261020-playout-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261020-0915.zip: battle 7f0b4112, online da73a525).
- battle.js `_playoutLive()` in GAME.boardBusy: true while an action-cam shot is live (`_acChromeState`) or a `window._ewHoldPlayout(ms)` hold runs (max 6 s). doItem holds for heal/mana potions + bane throw.
- online.js relays `playout-hold` host→guest; guest item click holds 700 ms.
- **How to apply:** any new action built from setTimeout beats without `_actionExecuting` must call `window._ewHoldPlayout(totalMs)` or the menu pops up in the gaps. Camera-only glides still never hide the menu.
- Browser probe pattern: scratchpad potion_probe.js (viewport 480x270, npm-packed import-map pkgs in scratchpad/pkgs, react/MeshLine curled from R2), samples `.hrlg-rig:not(.hrlg-peek)` every 16 ms. See [[sandbox-webgpu]], [[takeover-highlights]].
