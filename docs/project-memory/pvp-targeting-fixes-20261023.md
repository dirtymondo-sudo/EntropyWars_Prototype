---
name: pvp-targeting-fixes-20261023
description: PR #444 (10-23) fixed the attack targeting/preview/menu items from the online PvP playtests (MOVE→ATK rows, guest CONFIRM, landing-tile previews); open questions for mondo.
metadata:
  type: project
  modified: 2026-10-23T07:02:38.383Z
---

PR #444 merged 2026-10-23 ~07:00 (main 9446aaf, token 20261023-pvptarget-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261023-0702.zip: battle.js d93ea542, hud.js 970a0083, online.js ea09bfb4, state.js d274b1ea (from another thread), ui.js 5acb0182). Companion to [[online-playtest-fixes-20261023]] (sync/fog thread, PR #438).

Fixed from [[online-pvp-playtest-guest-20261023]] + [[online-pvp-playtest-host-20261023]]:
- Attack list has MOVE→ATK rows (battle.js _getAttackApproachTargets). A board click on an out-of-reach enemy PICKS it; CONFIRM/second click walks + hits. Unreachable = refused on first click, mode holds. This is a flow change from "board click walks and swings at once" (flag to mondo).
- Guest armed clicks go through battle.js window._ewGuestBoardPick (called from online.js guest clickTile): no more tile picks ("CONFIRM → Checkerboard I4").
- Enter in aim view fires CONFIRM; list cursor follows ✓ pick; approach CONFIRM label "CONFIRM / MOVE→ATK".
- Previews from landing tile: approachCastFrom (battle.js), used by hud list, ui.js getPendingDamagePreview, forecastSpellPlan.
- Status chips per target (ui.js _getStatusPreviewLabels(spell,target)): immune/absorb dropped, resist "½ CHANCE".
- Online ESC menu title "MENU · ONLINE · THE MATCH KEEPS GOING".

Left for mondo: lists open on lowest-HP target (existing sort, T4); row slide-in lag = SwiftShader; ENDS TURN tag intended; heals do get MOVE→CAST (Divine Light case not reproduced).
Sandbox note: with fog on, a guest didn't get an enemy 3 tiles away that host isInVision said visible (manually teleported units, lodge arena) — not chased, fog thread's area.
Two-browser recipe: scratchpad driver.js per seat, lobbyCreateRoom → lobbyJoinRoom with #lobbyJoinInput, applyPartyBuild(false) both, host _lockState.host/guestPartyReceived=true then startMatch(); _ewShotRecApi.place refuses online, move units by hand + _broadcastState. See [[hands-on-playtest]].
