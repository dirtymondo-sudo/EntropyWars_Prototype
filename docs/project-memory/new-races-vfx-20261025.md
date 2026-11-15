---
name: new-races-vfx-20261025
description: PR #507 (10-25) signature VFX for the 21 spells of chef/eagleman/flesheater/mime/mummy/swamp monster/undead
metadata:
  type: project
  modified: 2026-10-25T05:51:59.065Z
---

PR #507 (merged 2026-10-25) gave the 21 signature spells of the seven 10-25 races ([[new-races-chef-eagleman-flesheater-mime]], PR #504/#505) their own looks in three-vfx-effects.js ("THE 2026-10-25 BATCH SIGNATURE VFX", same pzSig hook as [[pz-signature-vfx]]). Visuals only, no rule calls made. Notes in docs/notes/spells-vfx.md.

- Proof stills + contact sheet: /mnt/project-files/new-races-vfx/.
- Taste Test (single heal) can't be cast in Spell Lab (no ally); proved in a VS CPU match.
- Stoop Dive: charge-first path fires IMPACT, adjacent cast fires BOLT; both mapped. The eagle sprite is hard to see in the charge camera (streaks, flare and wind ring show); bird proved by direct fire. Possible follow-up if mondo says it's missing.

**How to apply:** when a new race's spell needs a look, add a `_PZ_SIGS`-style row the same way; check which intent the spell fires first.
