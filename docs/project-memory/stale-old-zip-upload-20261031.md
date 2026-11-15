---
name: stale-old-zip-upload-20261031
description: 2026-10-31 "New Team button does nothing" = an old pre-cumulative zip (team-select-room) re-uploaded to R2, not a code bug
metadata:
  type: project
  modified: 2026-10-31T18:14:23.213Z
---
2026-10-31: mondo reported the Party Builder (Team Archive) NEW TEAM card does nothing. Not a code bug.
At 2026-10-31 02:45 UTC R2 got map.js / three-renderer.js / styles-base.css from
/mnt/project-files/team-select-room/ENTROPY_WARS_TEAM_SELECT_ROOM.zip (dated 2026-10-07, pre-cumulative era).
That old map.js lacks unitSeesTile etc., so battle.js dies at load, defaultAllTeams() throws inside
renderBoard ("_walkAnimUnitId is not defined"), and tbNewTeam stops before switching to the forge.
With origin/main files the click works (browser-checked; jsdelivr is blocked in the sandbox, so three@0.186.1 and the
other import-map packages were npm-installed and routed in Playwright).
Fix = fresh sync zip r2-sync/ENTROPY_WARS_SYNC_20261031-1808.zip (data.js, map.js, styles-base.css, three-renderer.js).
No token bump pre-upload (would cache the stale files under the new token). After his upload the token URL was still
stale, so PR #712 bumped the token to 20261031-newteam-01-cors; every R2 file then matched main and the click worked live.
**How to apply:** when a basic button "does nothing", diff live R2 vs main first and match the live sha against old zips
in /mnt/project-files/*/*.zip; old per-feature zips in project files are a re-upload hazard. Related: [[index-delivery-open-questions]]
