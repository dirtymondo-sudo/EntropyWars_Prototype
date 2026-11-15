---
name: pack-hair-colour-20261101
description: 11-01 PR #755: MakeHuman pack hair that stayed black now takes the picked colour; 12 styles got a Second hair colour row
metadata:
  type: project
  modified: 2026-11-01T12:27:36.865Z
---
mondo 11-01 11:31: some pack hair (Hair 14, Curly 01, Alpha 7 curly, Alpha 7 long 2, Double mh braid...) stays black/dark brown
whatever colour he picks, or only a secondary piece changes. Asked for a secondary hair colour picker.

Cause: ~35 of the 70 pack textures are painted near-black; the grey mask lifted at most x2.4. Fix PR #755 (zip
r2-sync/ENTROPY_WARS_SYNC_20261101-1227.zip, token 20261101-haircolour-02-cors): three-renderer.js _ccPackHairTexture
(pack only; classic 14 unchanged) = levels from the texels the triangles use, floor 0.45, mean 0.75.
Second colour: sprites.js `accent: true` on 12 styles (Hair 11/13/17, 50s updo, Braided rows, Island princess, Keylth,
Lady hippy, Lara, Reverse french braid bun, Hair bun brown, Blond with headband). _ccHairAccent picks the UV islands
whose colour is far from the hair's. appearance.hairAccent own|tint + hairColor2. Builder row "Second hair colour".
All 70 shot in the creator: /mnt/project-files/hair-colour/. Braids still show the painted strand shading (lighter now).
Plan doc row 10b. Related [[mpfb-asset-packs]] [[character-models-plan-doc]]
