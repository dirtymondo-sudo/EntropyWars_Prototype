---
name: beam-height-aim
description: Line beams aim at the target's DRAWN body: side-lane ax/ay + flyer hover sink (PR #361, 2026-10-20)
metadata:
  type: project
  modified: 2026-10-20T10:00:09.671Z
---
PR #361 merged 2026-10-20 (token 20261020-beamh-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261020-0959.zip: battle.js fdb41217, online.js e0b56bd5, three-vfx-effects.js f0b8993c).
mondo: Plasma Cannon from a raised block at a flyer about level with it "went at like a high angle pointed up".
- Cause: Plasma Cannon is 2 wide; flyer in the side lane left the spine tile empty, so three-vfx-effects `_worldTorsoAtLevel` used the flyer's logic z, 0.65 tile above where `_flyVisualY` draws it. Block 1, flyer clr 2, 1 tile out: 45° up before, 19° after (browser probe).
- Fix: battle.js line cast sends `ax/ay` (clicked body tile; online.js relays), `_fireBeamMapped` takes aim Y from that body; air fallback applies the hover sink (1.35 floor, -0.65).
- **How to apply:** any VFX aimed at a level in the air must use the drawn height (unitSurfaceY or the sink), never raw z.
- Browser probe in sandbox: jsdelivr blocked, serve npm packages (three@0.186.1 etc.) from a scratch node_modules via ctx.route; Mount Shasta Arena has real height drops. Not yet seen by mondo.
Related: [[spell-strike-area]], [[spell-camera-sightline]].
