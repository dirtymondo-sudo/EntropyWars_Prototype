---
name: halloween-graves-20261029
description: PR #683 (10-29): fallen allies' graves are the Halloween pack's six upright headstones; enemy bones unchanged; zip ENTROPY_WARS_SYNC_20261029-2242
metadata:
  type: project
  modified: 2026-10-29T22:42:13.404Z
---
PR #683 merged 2026-10-29, token 20261029-hwgraves-02-cors, sync zip r2-sync/ENTROPY_WARS_SYNC_20261029-2242.zip.
mondo: "There are gravestones that we can use for when a character dies, replacing the current one."
- three-renderer.js `_buildGravestone3D`: ally grave = halloween.fbx `Stone`..`Stone_05` via shared loader (PR #677), `_GRAVE_HW_STONES[seed % 6]` (seed = FNV of unit id; the rng's first draw gave a whole team the same stone), real size, pack Lambert sheets, flowers kept. Empty marker while streaming; old procedural slab only with EW_NO_HALLOWEEN_PACK or file failed. Editor `gravestone` prop uses it too.
- Enemy bone piles + PR #393 own/seen rules unchanged; no relay needed (both screens build from state.units).
- Not used: tomb plots Stone_06-08 (1.8-2 m, wider than a tile). Possible ask for him: bones -> headstones for enemies too, or tomb plots.
- No new R2 upload: stones come from Assets/halloween already in the bucket.
- Proof shots /mnt/project-files/halloween-graves/. Harness tip: clean close-ups by rendering the game scene with a custom PerspectiveCamera via `ph eval` + `draw always` (toDataURL right after render).
Related: [[gore-rules]] [[shipped-prs-20261028-29]]
