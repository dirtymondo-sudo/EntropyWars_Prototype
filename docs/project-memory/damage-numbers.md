---
name: damage-numbers
description: Floating damage number layout + action-cam TOTAL DMG readout pass (PR #271, 2026-10-17) — number is the hero, tags stack above
metadata:
  type: project
  modified: 2026-10-17T15:25:00.593Z
---
PR #271 merged 2026-10-17 (token 20261017-dmgnum-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261017-1524.zip).
mondo: tags (HIGH GROUND, CRITICAL, SUPER EFFECTIVE) covered the damage number; "the number is where the dopamine comes from"; corner damage counter too easy to miss.
- three-renderer.js `_layoutFloatTexts`: per-frame screen layout; numbers never covered, tags stacked above, tags wait 110ms and draw ×0.8; numbers have a min on-screen size (6.5% screen height).
- CRIT stamp moved to the number's shoulder; corner TOTAL DMG bigger, holds 1.4s/hit + lingers 1.7s after bars leave; guest now rolls its own corner total (online.js).
- PR #280 (2026-10-18, zip ENTROPY_WARS_SYNC_20261018-0146): turn clock (body.ew-spell-shot) stays hidden until the corner total fades (it overlapped); linger cut 1.7→1.4 s at mondo's ask.
- **How to apply:** new floating text needs nothing special — any non-numeric string is treated as a tag by the layout. Details: docs/notes/spells-vfx.md "THE NUMBER IS THE HERO". Browser-checked a multi-tag hit; not yet seen by mondo.
Related: [[combat-clarity]], [[element-share]].
