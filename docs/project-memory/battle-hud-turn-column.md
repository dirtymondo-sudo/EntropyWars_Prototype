---
name: battle-hud-turn-column
description: PR #192 (2026-10-13) battle HUD turn-order column above the Horologe + scoreboard tower bar = entropy gauge width; sandbox screenshot recipe
metadata:
  type: project
  modified: 2026-10-13T21:21:17.397Z
---
PR #192 merged 2026-10-13, token 20261013-turncol-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261013-2121.zip.
- hud.js TurnColumn replaced the bottom-right party dock (PartyRoster) and the scoreboard portrait flanks. Plate docks on .hrlg-side, reads bottom-up, acted units loop to top, Horologe portrait = NOW on your turn, row click = ⓘ stat card (card now docks right of the column).
- ScoreSide: name row, TowerBar, EntropyWing at one shared width.
- UI Maker piece id `turns` replaced `party`.
- Sandbox screenshots: jsdelivr is blocked by egress policy; a Playwright route that serves jsdelivr files from `npm pack` tarballs and fetches everything else Node-side (NODE_USE_ENV_PROXY=1, chromium --proxy-server=direct://) got a real arena battle on screen (~3 min first run).
Details: docs/notes/ui-menus-audio.md "THE TURN ORDER COLUMN". Related: [[ui-maker]].
- Same day PR #193 (token 20261013-turncol-02-cors): mondo hated the panel version ("looks retarded. just circular icons not big old panels that take up too much screen space"). Now bare ring portraits, no names/plate. Lesson: he wants minimal HUD footprint; don't add panels/text rows when he says "icons".
- PR #194 (turncol-03): icons flush on the left screen edge, not centred over the clock ("like a normal turn clock").
- PR #243 (2026-10-17, token 20261017-spellclock-01-cors): turn icons fade out during spell shots via body.ew-spell-shot (battle.js showActionCamChrome adds, final hideActionCamChrome removes). The Horologe already leaves during shots (ActionMenu returns null while the board is busy). PR #244 (spellclock-02): Reserves box hides too (mondo said yes).
