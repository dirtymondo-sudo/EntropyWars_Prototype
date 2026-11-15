---
name: playtest2-log-preview-fixes
description: PR #414 (2026-10-22) playtest-2 combat log + preview fixes: one hit one number, multi-hit one line, corner total = caster only, crash forecast, clean back out, log hides while aiming
metadata:
  type: project
  modified: 2026-10-22T20:07:21.545Z
---
PR #414 merged 2026-10-22 (token 20261022-clogfix-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261022-2006.zip).
- Rule now: a hit's number appears ONCE in the log (applyDamageToUnit's own line, after defence). Never add a second "for N" flavour line with the raw number.
- Multi-hit casts pass opts.logSink (battle.js _multiHitLogSink/_multiHitLogAdd/_multiHitLogFlush) → one line "(9 hits)". Floating numbers per hit kept (mondo likes them).
- Corner TOTAL DMG counts only the shot caster's hits (showActionCamChrome casterId, _actionCamTallyBlocked; relay flag nt).
- Adrenaline Rush = type heal; selfHealPct rows show "+40% HP".
- Dash forecast adds a −12 'crash' self hit per wall (dashCrashTiles).
- ui.js clearSpellAimPreviews on every back out. body.ew-aiming hides the combat log while aiming.
- Judgment call flagged to mondo: the red ENDS TURN tag by the AP icons (his 10-18 ask) was left as is; it follows the row under the cursor.
Notes: docs/notes/ui-menus-audio.md "PLAYTEST 2 LOG + PREVIEW FIXES". Related: [[combat-log]], [[hands-on-playtest]].
