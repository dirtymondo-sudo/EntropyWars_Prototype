---
name: door-gun-grip-20261102
description: Door gun scaled to 0.21 m and seated in the hand like the cowboy revolver (PR #785, 2026-11-02); Meshy hands stay open
metadata:
  type: project
  modified: 2026-11-02T01:39:11.776Z
---
PR #785 (2026-11-02, mondo: door gun "fit in the hands like the revolver does for the cowboy ... scaled down"):
- data.js HQ_PORTAL_RULES.gun: span 0.21 (was 0.36; the board/forge had used the catalogue's 0.62), `grip` measured off the GLB, `meshAt`/`meshUp` for Meshy hands, `vmSpan`/`vmMuzzle` keep the first-person viewmodel unchanged, muzzle moved to the dish.
- Creator (MPFB) bodies: fist curls, index at trigger guard — board, forge AND the HQ walker (_hqAttachHeld now seats grips).
- Meshy rigs (cast Player/Belle) have no finger bones: three-renderer.js `_gripFrameMesh` puts the handle on the palm read off the skin; the FINGERS STAY OPEN. Closing them would need a mesh bend or finger bones (offered to mondo as follow-up, not done).
- Shots: /mnt/project-files/door-gun-grip/door_gun_grip_before_after.jpg. Probe = forge stage EWCharViewer.dev.state() + a camera on the gun's flanks.
Related [[race-looks-cowboy-20261101]] [[character-models-plan-doc]]
