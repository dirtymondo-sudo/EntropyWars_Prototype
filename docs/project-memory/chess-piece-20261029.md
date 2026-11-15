---
name: chess-piece-20261029
description: Chess Piece race (PR #685, 10-29): piece spells, chess movement, Checkmate dragon finisher; the calls made that mondo hasn't confirmed
metadata:
  type: project
  modified: 2026-10-29T23:27:42.367Z
---

CHESS PIECE race shipped in PR #685 (merged 2026-10-29). Sync zip ENTROPY_WARS_SYNC_20261029-2327. Notes: docs/notes/champions-combat.md "THE CHESS PIECE".

- Six piece spells: Pawn, Knight, Bishop, Rook, Queen, King. Since PR #691 they are ordinary Chess-family spells that cost SP (mondo: "why dont his spells cost sp?"); the families are Chess + Camelot Powers + Knighthood, which mondo picked on 10-29. Each hits only the first enemy in that piece's pattern. The piece strikes, pushes the victim 1 along the line (the shared push; light bodies can go further), and takes its square. A kill means the piece takes the victim's square. Casting a spell turns the unit into that piece; it starts and respawns as the pawn.
- Movement follows the current piece. Any body blocks a line. No Jump or Climb. Clash uses the normal rules.
- Checkmate finisher = the chess dragon built from the set's pieces (`_sigCheckmate3D`).

Calls I made that mondo HAS NOT confirmed (flagged in the delivery):
- Pawn moves 1 in any straight direction (there is no "forward") and captures diagonally 1.
- Sliders can go any distance on the first move; a second move is capped.
- Allies block lines.
- Damage: Pawn 130 (the strongest); Knight 120; Queen 110; Bishop, Rook and King 105. Tiers T1/T2/T3.
- Stats: hp 1200, atk 135. Type anomaly, element earth, class bruiser, home The Looking-Glass, 300 credits.
- Both teams use the black pieces.

**Why:** if mondo changes any of these, edit battle.js `chessPattern` and the data.js RACE_ABILITIES 'chess piece' rows.
**How to apply:** follow-ups about chess-piece rules go to that code; never invent new rules beyond what he says. Related: [[forced-movement-rules]]
