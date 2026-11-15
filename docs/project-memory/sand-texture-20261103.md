---
name: sand-texture-20261103
description: 11-03 sand = ambientCG Ground097 (mondo's pick A); two colours: desert gold sand.png, beach cream sand_beach.png (PR #872)
metadata:
  type: project
  modified: 2026-11-03T13:35:35.427Z
---
mondo 11-03: "find a sand texture the same way you found another gold texture" (see [[gold-sheet-out-20261103]]); options sheet
/mnt/project-files/sand-texture/sand_texture_options.png (A-G); he picked A (Ground097 dune ripples) and said "you need to
differentiate between beach sand and desert sand in the game through color/tint".
PR #872 (token 20261103-sand-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261103-1335.zip + the two PNGs by hand):
- `desert` stays ONE terrain key (rules untouched). TERRAIN_SPRITES.desert = R2 terrain/sand.png (desert gold). Beach =
  terrain/sand_beach.png (same ripples, pale cream, mean 0.73 to stay under the white-sheet blowout). Repo copies in
  Assets/Sprites/terrain/. Bake script /mnt/project-files/sand-texture/grade.py. desert.png unreferenced now.
- Beach places: sprites.js SAND_BEACH.maps (id prefixes: prebuilt_bermuda, site_prebuilt_bermuda, site_prebuilt_atlantis_abyss,
  site_prebuilt_downtown_harbour) + any room with shell/terrain `sand: 'beach'` (hqSeaShell, hqAbyssShell). Renderer
  three-renderer.js _ewSandBeach/_ewSandUrl/_ewSandPart. Add a new beach board to SAND_BEACH.maps.
- Bermuda tints.desert, sea shell floor/apron colour, Bermuda horizon kit: #e8d8a8 -> #f2ead6.
- Proof render (mini three.js scene, not in-game): sand-texture/desert_vs_beach.png.
- mondo "hate the giza tint, just make it the default tint": PR #873 (token 20261103-sand-02-cors, zip 1337) removed Giza boards tints.desert + Giza room floor/apron colour. Desert sand should stay UNTINTED; do not add per-map desert tints back.
