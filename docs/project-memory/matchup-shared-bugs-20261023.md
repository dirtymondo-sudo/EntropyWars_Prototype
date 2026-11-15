---
name: matchup-shared-bugs-20261023
description: PR #470 (10-23) fixed bugs common to the six matchup playtests: watchdog round skip, CONFIRM lag, loading card overlap, Online chip; which shared items were already fixed
metadata:
  type: project
  modified: 2026-10-23T22:02:32.536Z
---

PR #470 merged 2026-10-23 (main 00a2cce, token 20261023-shared-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261023-2202.zip: battle.js 76ebe225, hud.js b9205adf, online.js c7b99c77).

All six matchup playtests ran on main <= PR #434, so many "shared" bugs were already fixed when this thread started:
- guest no result on round-limit end + watchdog during reconnect: PR #438.
- MOVE->CAST forecasts: PR #444. Verified headless: 119/120 real move-then-cast hits inside the forecast range (20 spells).

Fixed in #470:
- Watchdog (battle.js _noActiveUnitWatchdog) needs 7 answered ticks and an unchanged signature (_ewStallSignature). A long blocked frame used to read as 15 s of stall mid end-of-round, and the round end ran twice (that's how WvW R9 got skipped). _eorChainGen allows one end-of-round chain at a time.
- CONFIRM chip lagged the cursor by a frame (seconds on slow PCs). battle.js _hudPickNow -> 'ew-state-change-now' -> hud.js useGameState setTick right away.
- Loading card _lsFitCard: the note moves down first, then the title shrinks (floor 45%).
- Online chip sits under .ew-matchmeta.
Left as is: rows "slide" = the list's open animation (one frame on real hardware). Wording "returned to the void" and story ON FILE lines in online Arena were not changed.
Probe harness: scratchpad ctl2.js (weak-races-harness ctl.js plus EW_INIT/CPORT envs, executablePath /opt/pw-browsers/chromium). balancesim + set controllers[1]='local', devAutoSim=false gives a P1-controlled match without menus.
Related: [[matchups-20261023]] [[online-playtest-fixes-20261023]] [[pvp-targeting-fixes-20261023]]
