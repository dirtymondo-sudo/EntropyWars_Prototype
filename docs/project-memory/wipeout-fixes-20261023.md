---
name: wipeout-fixes-20261023
description: PR #422 (10-23) fixes from the wipeout playtest: Entropy picker real-hit range, Nexus counter max size, Imitation Report folded after result, camera over near models, tile-aim pre-pick in frame, ATTACK lit check, setup size once
metadata:
  type: project
---
PR #422 merged 2026-10-23 (main 3ba434b, token 20261023-wipeout-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261023-0415.zip: battle.js 4b5bdb46, hud.js ca196484, match-select.js 5a259067, state.js 66d5e464, three-camera.js ee8e230f, three-renderer.js 6d4cec1c).
- Entropy picker shows lo–hi from forecastHitOnUnit per enemy (getEntropyStrikeForecast hits/dmgLo/dmgHi). AI untouched.
- NEXUS_PLATE_MAX_PX 260 caps the Nexus counter up close.
- Imitation Report opens only after the result overlay, folded (▸ opens).
- Camera: model within 2.5 tiles of the lens = block (menu cam NEAR_LENS, board rig BOARD_NEAR_BODY_TILES). EW_NO_CLEAR_BOARD = old look.
- Tile-aim spell list: range fit widens to include a MOVE→CAST pre-pick.
- ATTACK lit only if _getAttackValidTargets has a target. Setup card size once.
- Not bugs: "Player holds the field" = default profile name; BOOT kick warning = slow sandbox; low menu cam = design.
mondo's calls: green ! = super effective, intended. Layout items skipped except Nexus counter.
Related: [[playtest-wipeout-20261023]]
