---
name: editor-building-look-20261030
description: EDITOR BUILDING LOOK (PR #695, 10-30): placed building takes key (sheet or prism building) + style; prism buildings = board building sprites
metadata:
  type: project
  modified: 2026-10-30T02:38:02.281Z
---

mondo 10-30: couldn't change a placed building's texture like a wall; asked where the prism building textures went. PR #695, token 20261030-edbldtex-01-cors, zip ENTROPY_WARS_SYNC_20261030-0237 (data.js, editor.js, three-renderer.js).

- "Prism buildings" = OBJECT_SPRITES building_1..11, ancient_building, abandoned_building_1/2, church_1/2, shop (the battle board's building prisms, city prism lots via _nrSpriteBuilding). data.js HQ_TEXB_PRISMS / hqTexbPrism.
- texbuilding `key`: a sheet = on every face cell (door stays); a prism key = drawn as that prism (_hqBuildTexPrisms, flatRoof). `style` dropdown. Picker lists prisms first only for a building key; BUILDING tool has Look/Style opts (bldKey/bldStyle); PAINT works on buildings.
- Ramps/stairs on squares: mondo solved via SNAP himself, no change.
- PRISM ROOFS + INSIDE (PR #697, 10-30, zip ENTROPY_WARS_SYNC_20261030-0255, token 20261030-edbldtex-03-cors): prism buildings wear the textured roof + parapet (roofOnly, noRoof). texbuilding `hollow` = "inside (walk in)": doorway in front (hqTexbDoor, `door` square, hung lintel), inside walls keyIn / floorIn / ceiling, HIDE ROOFS opens it; prisms stay solid. Walked in with PLAY HERE. Harness `ph hold k ms` added locally.
- Harness: added a local `ph drag x0 y0 x1 y1` to /tmp/ph copy (not the shared one) to drag-draw in the editor.
- Shots /mnt/project-files/editor-building-textures/. Notes docs/notes/editor.md "THE BUILDING'S LOOK". See [[editor-simple-20261028]] [[easy-editor-20261028]].
