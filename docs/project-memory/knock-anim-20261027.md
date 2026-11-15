---
name: knock-anim-20261027
description: PR #618 (10-27) THE KNOCK: pushed/flung units fall back + get up, pulled units stumble; looks only; calls made
metadata:
  type: project
---
mondo asked (10-27) for a falling-backwards reaction instead of units sliding when pushed/pulled/displaced. PR #618 merged.

- Hooked into battle.js `resolveForcedSlide` (the one shared forced-move system) + sky throw / vortex fling arcs. Looks only: tiles, timing, hits unchanged. Guest gets it via displace-anim / jump-anim relay `knock` field.
- Fall = UAL2 Hit_Knockback -> lie 240 ms -> UAL2 LayToIdle (sprites.js slots hitKnockdown / hitGetUp). Pull = built (no forward-stumble clip in any library): run clip x1.45 + forward lean. Kill-switch `window.EW_NO_KNOCK`.
- Calls I made (told mondo): 1-tile clean push keeps the old stagger only (fall needs 2+ tiles or a bounce); flyers/airborne stagger; body turns to face the hit (back to a push, front to a pull).
- Proof frames: /mnt/project-files/knock-anim/. Notes: docs/notes/spells-vfx.md "THE KNOCK". Related [[forced-movement-rules]] [[forced-movement]].
