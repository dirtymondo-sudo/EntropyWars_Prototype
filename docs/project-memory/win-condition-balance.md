---
name: win-condition-balance
description: 10-23 proposals page on whether Arena's three wins (Cube/Keys/Wipeout) are fair; recommends measuring before cutting Cube HP. Nothing changed.
metadata:
  type: project
  modified: 2026-10-23T21:17:23.372Z
---

10-23 (mondo's question 2 after the three win-condition playtests): page https://claude.ai/artifact/9qfVw118FExWEgPz5yHHva. Proposals only, mondo decides; no code changed.

Verdict: rounds already close (Wipeout 12, Keys 12 on 12x12, Cube 14 on 3rd try). Do NOT lower Cube HP yet: Balance Lab 66-81% Cube numbers predate the 10-14 Cube rework (3600 HP, max(ATK,M.ATK), DEF 100) and Keys 5/5; by rough hit math today's Cube (~15 hits of ~240) is about as many hits as the 1800-HP Cube that ended 66% of lab matches.

Order proposed: 1) rerun Balance Lab on current rules; 2) CPU hunts Keys/chases carriers (AI thread); 3) only if lab shows Cube behind: 3600 -> 3000; 4) then Keys carrier reveal at 4/5 (NEW RULE, touches online fog) and Cube score cap 150 -> 200. Not recommended: Cube hit doesn't end turn (breaks AP rule); respawn-next-round counts as standing (would have voided the R12 wipeout win). Low priority: crits on Cube without refund.

CUBE SCORE CAP REMOVED (mondo 10-23, PR #462, zip ENTROPY_WARS_SYNC_20261023-2117.zip, token 20261023-cubenocap-01-cors): no towerDmgCap anywhere; rate unchanged (1 pt per 0.4% Cube HP, whole Cube = 250).

Cloud browser checks: cdn.jsdelivr.net, cdnjs, cdn.socket.io are proxy-blocked (403). Route jsdelivr /npm/<pkg>@<ver>/<path> to a scratch `npm install` of the same versions and socket.io to node_modules/socket.io/client-dist; asset_cache.js's NPM_MIRROR is stale (r128 only).

Cube HP history (map.js comment): 2500->1800 09-07, 1800->2400 10-07, 2400->3600 10-14. See [[playtest-cube]] [[playtest-wipeout-20261023]] [[hands-on-playtest]].
