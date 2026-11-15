---
name: big-squares-iz-20261028
description: 2x squares I-Z share (PR #642, 10-28): ten arena rooms + five side rooms grown for 3.5 m squares, grow-room.js tool, calls flagged
metadata:
  type: project
  modified: 2026-10-28T10:27:00.065Z
---

PR #642 merged 2026-10-28, sync zip ENTROPY_WARS_SYNC_20261028-1023 (data.js 2f5b43aa, map.js dffc46ba, styles-base.css 7f30627d), token 20261028-sq2xiz-02-cors.

- Grown ×2 (stamped `grown: 2`): Lodge, Looking-Glass, North Pole, Olympus, Revenge (label "The Flying Dutchman"), Saturn, Shasta, Singularity, Skinwalker, Technoticlan. Re-cut at 12/9/10/11 on 3.5 m. Olympus still has no 11×11.
- Procedural `rooms` gens take `gen.grow: 2`. The plan is drawn at the old size, then scaled, so the seeded layout stays the same.
- Repo-root tool `grow-room.js <site|room…> [--k] [--dry-run]`. It keeps props real size, keeps furniture clusters together and keeps wall gaps. It also compares lattices. A sibling tool lives in /mnt/project-files/big-squares/tools/.
- Side rooms: Looking-Glass waiting, Revenge gundeck + hold ×2, cabin ×2.5. Sea: only the fight island grew, and the jump gaps were kept. All now give hqFieldSquareFor 3.5.
- Calls flagged to mondo: cabin ×2.5; the sea's stones/gaps are unchanged; thin walls no longer fill a 3.5 m square.
- Shots: /mnt/project-files/big-squares-iz/ (before/after/move per site).
- Gotcha: in the harness, the site search for Revenge is "Dutchman". The first card is the deck.

Related: [[strip-big-squares-20261028]] [[floor-gaps-20261028]]
