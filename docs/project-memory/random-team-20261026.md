---
name: random-team-20261026
description: RANDOM button on the Squad Desk (VS CPU + online team select), PR #540, 2026-10-26
metadata:
  type: project
  modified: 2026-10-26T08:28:33.683Z
---
PR #540 (merged 2026-10-26, token 20261026-rndteam-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261026-0828.zip = map.js).
mondo asked for a random button on the team select for VS CPU + online; each press shows a new random team, then he deploys.
- map.js Squad Desk "THE RANDOM TEAM": RANDOM in the action row (RANDOM TEAM in the no-teams state). It rolls the desk size
  with randomizePartyIdentities (one of each unit), uses raceDefaultKit spells, and puts the team first as "Random Team".
- It is NEVER saved to profile.teamPresets. It has no Edit button, 4v4/5v5 tops it up or trims it, and Back / the main menu drop it.
- Calls I made (flag if he objects): spells = race default kit (not a random kit); no "save this random team" button.
- Browser-checked VS CPU + online friendly (both seats) with the playtest harness. Screenshots are in /mnt/project-files/random-team/.
Related: [[squad-desk-menu]]
11-07 (PR #1039): mondo "get rid of the random stamp": the gold RANDOM stamp on the plate is gone; the RANDOM button stays (read as the stamp, not the button; Layout > Random button > Hide hides the button).
