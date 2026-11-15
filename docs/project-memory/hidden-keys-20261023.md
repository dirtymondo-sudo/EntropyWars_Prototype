---
name: hidden-keys-20261023
description: Hidden Keys rule (PR #452, 10-23) was UNDONE by PR #632 (10-28); only rule left = the Key drop log line never names the tile
metadata:
  type: project
  modified: 2026-10-28T06:13:49.854Z
---

HISTORY: PR #452 (10-23) hid the other team's Keys everywhere (log, plate badge, "?/5" scoreboard, score, cards, orbs, key-private relay).

mondo 2026-10-28: "get rid of all those hidden key rules ... I just dont want the combat log to give away the exact tile the key is dropped on". PR #632 (merged 10-28, token 20261028-keysshown-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261028-0613.zip) removed keysHiddenFor / shownCarriedKeys / addKeyLog / _logKeyHidden / _presentKeyFind / key-private. Enemy carriers show the Key badge under the plate again, real counts, Keys in score, KEY SECURED relayed, dropped Keys visible to both, Inspect lines tagged to the searcher's team (as before #452).

THE ONE RULE: map.js dropHourglassesFromUnit logs "X drops N Keys." with NO tile, for everyone.
Kept from #452 as bug fixes: Far Sight tile pick, guest tile-cast reach refusal, conduction forecast, MOVE→CAST chip.
Note: plate status rows (incl. the Key badge) hide at far camera zoom for every plate (pre-existing tp-far CSS).

**How to apply:** never re-hide enemy Keys; no new log line may name a Key drop tile. Proof shot /mnt/project-files/keys-shown/. See [[matchup-keys-vs-keys-20261023]] [[inspect-one-tile-random-keys-20261023]].
