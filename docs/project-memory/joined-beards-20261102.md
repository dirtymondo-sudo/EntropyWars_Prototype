---
name: joined-beards-20261102
description: 11-02 PR #790: 4 joined beard+moustache Facial hair picks built in cloud Blender (bake-beards.py, ewb_beard_*.glb), zip 20261102-0335
metadata:
  type: project
  modified: 2026-11-02T03:35:46.213Z
---
mondo 11-02: pack "Full beard" has no moustache; asked for Blender-edited combos. PR #790 (plan row 12h): bake-beards.py joins a pack
beard + pack moustache into one piece (one mesh, 2-cell texture sheet, moustache ends turned down onto the beard via .mhclo offsets,
baked with bake-mpfb.py bake_one_wear on all 5 MPFB bodies). Picks: Full beard with moustache, Full beard with bushy moustache,
Viking beard with moustache, Scruffy beard with moustache (list end of FACE > Facial hair, MPFB bodies only).
Faun beard + moustache tried and DROPPED (ends stretched ~5 cm into strings).
Already-connected pack pieces exist too: "Beard sigmund wip" and "Scruffy beard1" have a moustache.
Shots: /mnt/project-files/joined-beards/. Zip r2-sync/ENTROPY_WARS_SYNC_20261102-0335.zip (carries the 4 GLBs + mpfb_shapes.glb by hand;
sync-zip.js only zips root files). Setup: pip install bpy==5.2.3 meshoptimizer; mpfb2 clone; unzip mhpacks bodyparts05/06 to /tmp/mhpacks.
Related [[character-models-plan-doc]] [[mpfb-asset-packs]] [[r2-only-assets-dropped-20261101]]
