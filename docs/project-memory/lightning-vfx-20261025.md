---
name: lightning-vfx-20261025
description: THE LIGHTNING PASS (PR #520, 10-25): lightning VFX kit, cage+scar mark on every lightning hit, Ball Lightning T2 + Bolt from the Blue T4, flagged calls
metadata:
  type: project
  modified: 2026-10-25T10:28:57.206Z
---
PR #520 merged 2026-10-25 (one of the per-element passes after [[nature-vfx-20261025]]). Sync zip ENTROPY_WARS_SYNC_20261025-1028 (data.js 04ff7966, three-vfx-effects.js 7a938c6d). Stills: /mnt/project-files/lightning-vfx/.

- three-vfx-effects.js block "THE LIGHTNING PASS" (helpers `_lz*`): 3D jagged bolts (haze+glow+core tubes), body cages, Lichtenberg scars, ground crawl, storm cloud; one `_lzStage` run per cast.
- `fire()` burst beat -> `_lzBurstMark`: EVERY lightning damage spell not in `_LZ_OWN` gets cage + scar on top of its own look.
- Own looks: Static Shock (violet), Thunderbolt (old sky rune/screen flash replaced), Chain Lightning, Tempest, Ball Lightning, Bolt from the Blue.
- Gotcha: for `line` kind, `beam` fires at launch, damage ~430 ms later, staging `burst` ~1 s after damage (burst is NOT the hit for lines).
- New rows: Ball Lightning T2 line r4 100 magic Jammed 1, 50 MP; Bolt from the Blue T4 r4 170 magic x1.5 vs Jammed, applies nothing, cd 2, 100 MP. Family = 8 rows, mothman + wizard.

**Why:** mondo asked for every element to be identifiable with a nice spell spread.
**How to apply:** flagged calls awaiting mondo: the new rows' stats, Thunderbolt look replaced, mark stacking on signature looks, Tempest/EMP Burst/EMP Grenade still apply statuses at T3-4 (left unchanged).
