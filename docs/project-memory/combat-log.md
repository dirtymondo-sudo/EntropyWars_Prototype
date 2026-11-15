---
name: combat-log
description: Right-side combat log (PR #319, 2026-10-18): where it lives, how auto-hide and the HP readout work, UI Maker piece clog
metadata:
  type: project
  modified: 2026-10-18T13:52:44.769Z
---
PR #319 merged 2026-10-18 (token 20261018-clog-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261018-1352.zip). Not yet seen by mondo.
- ui.js `renderFloatCombatLog` builds `#ewCombatLog` from state.logEntries (text box filters) + state.logDialogue (text box beats, battle.js `_clogKeepBeats`, host only). Duplicate hits (same names + number) dropped in render.
- HP after a hit: `addLog(msg, vis, [hp,max])` → entry.h; heals via `_clogNoteHp` / `_clogHealHp`.
- Auto-hide: three-renderer `_syncTakeoverHighlights` sets body.ew-board-busy / ew-board-cam; CSS hides in 0.18 s, back after 0.5 s. Hidden for the whole CPU turn by default (UI Maker "Hide while" can narrow it to spell shots + camera, or never).
- UI Maker piece `clog` + db.ux `l*` keys (clogForm). Fold = localStorage ew_clog_folded.
- End of round (PR #340, 2026-10-19, mondo asked steady): log stays ON the whole end of round via synced state._eorLive → body.ew-eor (battle.js _setRoundAdvance / isEndOfRoundLive). Zip r2-sync/ENTROPY_WARS_SYNC_20261019-2328.zip.
- Short opening (PR #347, 2026-10-19, mondo): log opens with only "A fight breaks out!" + Round 1 divider, every mode; battle.js _afterVSSplash "THE SHORT OPENING" empties the log there. Zip r2-sync/ENTROPY_WARS_SYNC_20261019-2355.zip.
Details: docs/notes/ui-menus-audio.md "THE COMBAT LOG". Related: [[combat-text-colours]], [[ui-maker]].
