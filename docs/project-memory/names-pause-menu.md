---
name: names-pause-menu
description: Unit names default to the race, story pause rename, one battle pause menu, ESC-ends-battle fix (PR #25, 2026-09-30)
metadata:
  type: project
  modified: 2026-09-30T08:43:43.693Z
---
DONE + MERGED 2026-09-30 (PR #25, main 4806162, token 20260930-pause-01-cors, zip pause-menu/ENTROPY_WARS_PAUSE_MENU.zip =
battle.js, data.js, map.js, party-builder.js, profile.js, state.js, ui.js, styles-base.css, styles-hud.css).

- No random names anywhere: empty name = the race label. data.js hqPartyRename for the story pause sheet.
- ESC bug cause: the pre-match forge (party-builder.js) stays mounted in #builderOverlay during battle and its ESC
  listener called backToModeSelect. Guarded by state.phase === 'battle' + on-screen check. Watch for other hidden
  React screens with document keydown listeners (match-select.js has one too, guarded by visibility).
- Battle pause = ui.js _renderPauseMenu, command column in the HQ pause frame (THE HQ HUD PASS tokens on #pauseOverlay).
  Strike Mode controls removed from the shared controls page.
- Sandbox probe for a live story fight: playtest_field_offline.js pattern (hollow earth gallery, teleport + hq.strike());
  strike sometimes needs retries; slow but works.
Notes in docs/notes/ui-menus-audio.md "THE NAMES + THE ONE BATTLE PAUSE MENU". Related: [[squad-desk-menu]].
