---
name: squad-desk-menu
description: Menu + PvP entry flow rework (Squad Desk, pick 4, ready room, random online map), PR #24, 2026-09-30
metadata:
  type: project
---

DONE + MERGED 2026-09-30 (PR #24, main d077b83, token 20260930-menu-01-cors, zip menu/ENTROPY_WARS_MENU.zip = map.js, online.js, match-select.js, party-builder.js, styles-base.css).

mondo's asks: Play reads "New Game" first time, "Continue" after (profile.storyStarted / hqOfficerOnFile). Practice renamed "Play VS CPU", Online renamed "Online PvP". Both open the Squad Desk (pick a saved team from profile.teamPresets; no team = prompt to build the first one in the forge, which returns to the desk). Teams over 4 get a "pick 4" panel (remembered as preset.lastPick). Online needs 4 units. Online map is always random (server pickRandomMap for Quick Play; friendly host draws a random map, no map select). VS CPU still picks its map in the terminal; the squad skips the party builder.

Online: squad is window._ewSquad -> NET._squad (never on state); both seats auto-lock and a Ready Room card shows until the loading screen. Also fixed guest partyNames clamping. Notes: docs/notes/ui-menus-audio.md "THE SQUAD DESK". Not playtested beyond a two-page Quick Play probe.
