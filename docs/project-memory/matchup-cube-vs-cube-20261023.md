---
name: matchup-cube-vs-cube-20261023
description: Cube vs Cube Arena matchup playtest (10-23, report only): Range team won on time 446-339; key bugs found
metadata:
  type: project
  modified: 2026-10-23T12:31:06.892Z
---

Matchup thread (one of six "Matchup:" threads from mondo's win-condition request, 2026-10-23). REPORT ONLY, no code changes.
Report: https://claude.ai/artifact/TwcKLAbprB1CXEcU1VjkjS (copy in /mnt/project-files/matchup-cube-vs-cube/).

Setup: friendly online room, 2 browsers, Technoticlan Arena 12x12, 15 rounds (room default), shot clock raised to 900 s.
P1 Range (Marksman, Mech, Mantid, Dragon) vs P2 Brutes (Dinosaur, Antihero, Juggernaut, Superhero), both going for the Cube.
Result: no Cube fell; P1 won on time 446-339 (kills 9-3 = 225 vs 75; Cube dmg capped 150; nexus 114 each). P1 Cube ended at 818, P2 Cube at 2058.

Key findings:
- Guest never got the result on a round-limit end (stayed in battle 3+ min); a manual host state push showed DEFEAT.
- Rangefinder/remoteView can't target fog: clickTile fog gate (battle.js ~59398-59430) ignores kind fogExempt (battle.js:882).
- Cube is listed as a target with no vision check, so CONFIRM gives "Out of sight". Flyers get no message when they lose the Cube to 3D distance or don't count on a Nexus.
- CONFIRM lags the highlighted row by 3-5 s; default target is not the highest predicted damage.
- Stacked Fire for Effect craters trap units.
- 15 rounds was a BUG, not a choice: the friendly room's round counter starts at a hard-coded 15 (online.js:3106 and index.html:1257). Arena's 20 is only applied when a mode chip is clicked (friendlySetMode), and Arena comes pre-selected.

Balance: Brute rush (SE hit, then press refund, then Cube hit) is viable and got the enemy Cube to 23%. The Range Cube plan isn't viable as built. On time, kills decide, because Cube damage points are capped at 150.

Related: [[win-condition-balance]] [[playtest-cube]] [[press-refund-20261023]]

FIXED 10-23 PR #463 (main 9434bc9, token 20261023-cubecube-01-cors, zip ENTROPY_WARS_SYNC_20261023-2119.zip): Cube row needs sight (greyed OUT OF SIGHT), Cube body no longer hides its own tile from higher rays (map.js _isRayBlocked3D), flyer TOO HIGH Cube row, flyer-over-Nexus own-team log line, grounded flyers ride craters down, walk drop shows hazard + "Move here (−N HP)". Rangefinder fog + 20-round room were already fixed (#449/#452/#438). "Move here didn't move" in a crater not reproduced. Open rule question to mondo: stacked craters deepen + blast craters permanent (thread call from PR #392) can trap jump-1 units.
