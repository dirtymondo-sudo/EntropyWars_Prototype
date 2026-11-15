---
name: pendant-cords-20261105
description: 11-05 PR #913: every creator pendant wears a code-built neck cord (three-renderer.js THE PENDANT CORDS); where to tune it
metadata:
  type: project
  modified: 2026-11-05T07:58:36.176Z
---
mondo 11-05: "all of the pendants in the character creator need strings ... make the string yourself". PR #913 (thread
 (thread in the owner project), live on R2 (token 20261105-cords-02-cors).
- Code only, no model file: three-renderer.js wearCords/wearCord, run at the end of wearLayers (old body renamed wearLayers0).
  Applies to any solid piece with wearGroupOf(id) === 'pendants' (cross, talisman, hagstone; future pendants automatic).
- Tuning knobs: WEAR_CORD (radius r, skin/cloth clearance, levels/iters, pull, fall, step, colors per id).
- Cord goes over garments the pendant hangs over, under ones it is under (closed coat). Weights = the triangle it lies on.
- Slider moves warm-start from w.cordWarm (a cold solve each drag tick stuttered).
- Proof shots /mnt/project-files/pendant-cords/. Notes character-creator.md "THE PENDANT CORDS", plan row 12u.
**Why:** a later "cord clips / wrong colour / add chain" ask should start from these knobs, not a Blender bake.
Related [[meshy-creator-pieces-20261103]] [[creator-tabs-body-slots-20261103]]
