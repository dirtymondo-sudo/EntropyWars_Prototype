---
name: meshy-decor-wired-20261103
description: The 71 Meshy decor models are in the game (PR #839): procs wear them via _hqDecorWear; GLBs on R2 Assets/decor/, zipped by hand
metadata:
  type: project
  modified: 2026-11-03T09:09:53.253Z
---

2026-11-03, PR #839 (thread "put the 71 new meshy models in the game"): the decor models from [[meshy-decor-concepts-20261103]] are wired.

- three-renderer.js THE MESHY DECOR: `_HQ_DECOR_GLB` (name → file) + `_hqDecorWear(name, U, g, opts)` at the end of each proc builder. Catalogue rows stay `proc` (every placement gets the model). Proc pieces hide but keep collision (`_ew_mcKeep`); model fitted into their box (fit contain/height/width/stretch, wall, top, into, onDone).
- 60 procs + 8 sub-part models (armour post, carousel horse, ferris wheel/gondola, music box dancer, trophy cup, closed umbrella, wall torch bracket). Spell props: piano (Things That Go Bump), sheep (Counting Sheep), tripod (Tripod Sweep) in three-vfx-effects `_WPN_MODELS`. Polaroid S03 was never made; Ack Ack Ack still code legs.
- Files: R2 `Assets/decor/<name>.glb` (meshopt+WebP 1024, 24 MB). sync-zip.js does NOT pick them up: hand-add to zips until mondo confirms uploaded (check live with random query). Before/after sheets: project files meshy/decor/in-game/.
- Kill switch `window.EW_NO_DECOR_GLB`.
- Zip 20261103-0908 also carried the 26 `Assets/misc/ebd_*.glb` (PR #837 swap) and `Castles_and_Forts.glb`, which were 404 on the CDN at the time.

**How to apply:** a new decor model for a proc = add to `_HQ_DECOR_GLB` + one `_hqDecorWear` call; rerun `node list-models.js`.

ROUND 2 (mondo 11-03, PR #845): server rack back to proc (Meshy one unused); space divider single; flood mast pole thinned in
Blender; tanker desk retextured (Meshy retexture + red toned to oxblood); high striker split into striker + high_striker_hammer
(Blender, scratch split.py/lay.py); armour stand = suit ON new Meshy square oak plinth `armour_plinth` (D15c, he picked A);
Göbekli board `_hzTPillar` wears the hands t_pillar. mondo had uploaded the 0908 zip (62 decor live by 09:35). Zip 0936 = round 2.
ROUND 3 (11-03, PR #849): flood mast regenerated on Meshy from concept D04c (he picked C: slim pole, crossbar of 8 lamps); zip 1006. Round 2 GLBs were live by 10:06.
