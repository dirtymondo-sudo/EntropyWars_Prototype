---
name: lg-chess-positions-20261103
description: Looking-Glass arena (PR #862, 11-03): 8x8 chess board in the 12x12, one of mondo's 3 positions rolled per battle; how the roll/sync works and calls flagged
metadata:
  type: project
  modified: 2026-11-03T12:10:15.501Z
---
PR #862 merged 2026-11-03. Sync zip r2-sync/ENTROPY_WARS_SYNC_20261103-1210.zip (data.js, map.js, three-renderer.js, online.js). Token 20261103-chesspos-02-cors.

- mondo's ask: the Looking-Glass chess board 8x8 inside the 12x12 battle board, one of his 3 real positions (Forward Cover, Central Screen, Open Junction) at random each battle, and the pieces carve the lanes. Spawns stay on 4 edge squares (rows 0/11, x 4..7).
- data.js HQ_LG_CHESS (FEN rows, north = black = P2, `cur`). The pieces are chess trees made by hqLgChessFeatures(). Only one white bishop differs (c4/d3/e2); it carries `chessPos`, and hqLgChessOn filters it in the lattice, the roofs and the renderer (three-renderer _hqChessVar, ThreeRenderer.chessPosSync).
- Roll: hqLgChessRoll(mapId) in map.js _msArenaGate and the lab launch. Online, the host rolls in _onlineArenaGo (NET._chessRolledFor), and `arena-check.chess` plus a `|chess<k>` room sig make the guest match.
- hqArenaUpgrade stamps field.build. The renderer's _hqBattleRoom / _fieldGround caches key on it.
- Calls flagged to mondo: the 9/10/11 sizes cannot sit on the 8x8 under the house rules (the back ranks land on the egress rows), so they were re-baked to other garden windows; the 11 overlaps the board's west files. The explore garden shows the last rolled position. Not checked in a browser (no playtest rule).
