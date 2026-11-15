---
name: wipeout-vs-wipeout-fixes-20261023
description: PR #464 (10-23) fixes from the Wipeout vs Wipeout matchup: mid-move death freeze, on-kill AP refund, Cube/ward-seen enemies drawn, clicks look past the caster
metadata:
  type: project
  modified: 2026-10-23T21:24:33.169Z
---
PR #464 merged 2026-10-23 (main 39f5e22, token 20261023-wipewipe-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261023-2124.zip: ai.js 520fdc00, battle.js adbd0223, data.js 68edc9c5, hud.js 37cabcfa, map.js 8a47da21, three-renderer.js e052b3b1, ui.js 34d126bb).
From [[playtest-wipeout-vs-wipeout-20261023]]:
- Freeze: endUnitIfDone returned early for a `_dying` unit with AP left (OA kill on its own move); now dying = done. Reproduced + verified in browser (VS CPU).
- On-kill AP refund (Jurassic Jaw etc.): finishAction's spendAllAP wiped it; refund now re-paid after the spend (seq-tagged per cast).
- "Fog leak" was really the renderer: three-renderer _unitLosSeen ignored team structure sight (Cube/wards/doors/flares), so an enemy on a lit, targetable tile stayed undrawn. Now drawn. Screenshot /mnt/project-files/wipeout-wipeout-fixes/.
- Tail Whip self-target: guest side already fixed by PR #444; renderer click now looks past the caster's own model (battle.js _ewPickSkipsUnitId).
Left to the shared-bugs thread: CONFIRM chip vs row, sliding rows, MOVE→CAST forecasts, Mortar out-of-range default row (looked like the chip issue).
Harness: /mnt/project-files/balance/weak-races-harness ctl.js works; chromium path now /opt/pw-browsers/chromium-1243/chrome-linux64/chrome.
