---
name: hp-damage-trail-20261027
description: Yellow damage trail on every HP bar (ui.js THE DAMAGE TRAIL, PR #619, 2026-10-27) + how to capture mid-drain proof in the slow cloud harness
metadata:
  type: project
  modified: 2026-10-27T11:07:20.571Z
---
PR #619 merged 2026-10-27 (rev 1, the yellow drained; superseded by rev 2 below) (token 20261027-hptrail-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261027-1107.zip). mondo: lost HP shows yellow, then drains, plus a glow/pulse/grow.
- One tracker in ui.js `_hpTrailTick` (hold 550 ms, drain 750 ms; heals clear it). Any `.ew-hp-trail[data-hp-trail=<id>]` gets painted; its bar gets `data-ew-drain` for the grow + glow. Ring vitals use the `uTrail` uniform. Keys: unit id, `cube:<p>`, `dep:<x>_<y>` (state.doors). Kill switch `EW_NO_HP_TRAIL`.
- Nothing is relayed: host and guest each track the HP they already have. Verified on 2 seats.
- REV 2 (PR #621, token 20261027-hptrail-03-cors, zip ENTROPY_WARS_SYNC_20261027-1129.zip): mondo said "the health is supposed to drain down and reveal the yellow". So the FILL drains, not the yellow. The yellow shows at once, the fill holds for 180 ms, drains over 800 ms (min-width on the bar's fill = the trail's previous sibling; a held dash on ring arcs; uHp on the 3D ring), and the yellow lingers 450 ms then fades over 300 ms. The timings are my call.

**How to apply (proof capture):** llvmpipe screenshots take 1-18 s, which is longer than a 1.3 s effect. Read the painted plate canvas instead: `#ewPlateMirror .tp-plate-outer`._ewPm.cvs.toDataURL() through fast `ph eval` polling. My helper scripts in /tmp/ph (pgrab.js, the /grab and /cast endpoints) are not in the shared harness. The shot clock ends turns quickly while you script, and seat 1 is not always P1 (use getViewerPlayer()). [[sandbox-playtest-speed]] [[world-name-plates]]
