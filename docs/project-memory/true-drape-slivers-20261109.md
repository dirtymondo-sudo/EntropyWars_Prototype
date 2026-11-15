---
name: true-drape-slivers-20261109
description: PR #1071 (11-09) old-ground slivers (green strips) at changed/deformed squares = terrain skins draped too coarsely; THE TRUE DRAPE fix + harness
metadata:
  type: project
---
mondo 11-09 (Bohemian Grove Arena, Firefox webgpu): "little seams/edges where it's still the old terrain ... sliver of grass where it should be sand". Thread (thread in the owner project).

- Cause: three-renderer.js skins (_fieldPatchGeo dry sheets, _liqBlendGeo liquids) draped every other 0.5 m lattice node and read exact deform drop; floor mesh is lattice-linear, so floor poked through along crater walls/banks/ledges.
- Fix PR #1071 "THE TRUE DRAPE": DRAPE_SKIN_SEGS 8, floor-as-drawn reads (_fieldMeshFix, _fieldDeformDyDrawn), _trueDrapeCell (liquid cliff cut on natural heights; dry skips triangles over sheer natural rise DRAPE_SHEER_RISE 3; poke lift shared per vertex). Switch window.EW_NO_TRUE_DRAPE. Token 20261109-trueDrape-01-cors, three-renderer.js fd8c75a7 uploaded. Notes seamless-field-encounter.md.
- Proof /mnt/project-files/terrain-slivers/ (WebGL2 headless only). Left: natural mound cliff face shows room's own cliff sheet as a stepped band, two tiny leaf flecks at crest. Cold skin rebuild ~170 ms vs ~80 (llvmpipe).
- Harness: dig via deform + paint desert, ray probe floor-vs-skin raycasts over a tile range was the decisive check. Related [[meteor-crater-paint-20261105]]
