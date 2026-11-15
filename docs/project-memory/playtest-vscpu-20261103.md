---
name: playtest-vscpu-20261103
description: VS CPU bug-hunt playtest 2026-11-03 — report doc, mondo's answers on respawn/wipeout/silence/jammed/rain fire, fix pass
metadata:
  type: project
  modified: 2026-11-03T04:55:04.252Z
---

Playtest on main 2026-11-03. Doc: https://claude.ai/artifact/U361MKkT3rzqvpMHD66vUj
Shots + combat log: /mnt/project-files/playtest-vscpu-20261103/ (shots/ = match 1 Arena Cyberpunk City; match2/ = TDM Camelot).

mondo's answers (11-03) — DESIGN, never report again:
- Match ends the moment all 4 of your units are down, even with respawns pending ("get good").
- Dead units miss a round: a 1-round respawn = out for 1 round starting the round after death; 0 AP on return is right.
- Abilities row number = the spell's base damage used in the formula, NOT predicted damage. Fine.
- Forfeit payouts: ignore for now.

mondo's rulings that ARE bugs:
- SILENCE lasts 1 round (it's strong); JAMMED must last 3 rounds like other statuses.
- Fire still burning in rain = definitely a bug (rain should douse fires, not only at formation).
- ANY cut-off text is HIGH priority (players must read spells). Confirm button cut off at the edge of the spell/action list = bug.
- End screen: NO sideways scroll ("ugly"); redesign the panel to fit everything.
- He asked to fix all 21 bugs from the doc.

**How to apply:** fix threads start from the doc table; don't re-raise the design answers above.

FIX PASS (11-03, PR #825, zip ENTROPY_WARS_SYNC_20261103-0541): all 21 fixed except #7 (Hellmouth lava 3 wide = spell-lava runoff halo, lava for every rule — design, told mondo). Calls made: Tactics list now sits BESIDE its party list (overrides UI Maker -200px cascade for that view only); MOVE click on a move-climb block passes to a lit move square behind it on the ray; forecast adds oil blast / recoil / walk-in fire badges; hidden UI Maker words now hide their empty pill (data-ew-words-empty).
