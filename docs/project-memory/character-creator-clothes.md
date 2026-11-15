---
name: character-creator-clothes
description: Character creator clothes rev 12 (2026-09-30): what shipped, where the notes are, what is still open, how it was probed
metadata:
  type: project
  modified: 2026-09-30T09:34:09.417Z
---

mondo asked (2026-09-30) to improve the creator's clothes: "Lots of weird jagged edges and clipping through the body ... look as good and realistic as possible", and allowed playtesting FOR THAT TASK (not a general permission; [[no-long-browser-sweeps]] still holds elsewhere).

Shipped: rev 12, PR #27 merged to main 57f071f, index token 20260930-creator-01-cors. R2 zip creator/ENTROPY_WARS_CREATOR_CLOTHES.zip = three-renderer.js only (built on top of the party dash-in PR #26 copy, so it goes up after battles/ENTROPY_WARS_DASH_IN.zip). All code is in three-renderer.js `rebuildGeometry`; no data.js change.

Full write-up: docs/notes/character-creator.md, section "CHARACTER CREATOR rev 12". Covers the filled base, layer ordering/clearance/untangle, one-fold rims, level-line cuts, cut-patch pockets, hanging skirt + coat tail lathes, tucked tops, cloth UV frames per layer (rounded joints, level v on torso/legs, upright prints, wrap seam split), trench belt as a plane-cut closed loop.

Still open (seen, not fixed): plaid stretches over flat shoulder tops (cylinder mapping); small print jags near the rear armpit on printed coats (pre-existing flipped triangles at upper back, t 0.76-0.84, also on tees); welt pocket lower wall reads as a thin dark line; skirt worn over trousers (bottoms2) stands ~2 cm(q) off the waist.

Probe trick: a same-look update does not rebuild the mesh, so capture scripts nudge width by ~3e-6 random to force a rebuild. Posed captures used Playwright chromium + swiftshader against the local server; slow (~2 fps), so only on a creator task mondo OKs.
