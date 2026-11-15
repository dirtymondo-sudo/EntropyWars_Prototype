---
name: editor-hq-textures-20261030
description: DOOR HQ TEXTURES IN EDITOR (PR #705, 10-30): painted tileables were hidden past the picker's 400 cap; now listed first, hq:<name> keys
metadata:
  type: project
  modified: 2026-10-30T08:59:14.422Z
---

mondo 10-30: "werent there some textures that were used to make door hq? why arent those in the textures of the editor". PR #705, token 20261030-edhqtex-02-cors, zip ENTROPY_WARS_SYNC_20261030-0859 (editor.js, three-renderer.js).

- Cause: DOOR_HQ.textures (8 painted tileables, R2 Assets/door/textures/) were listed last in editor.js texSources, after ~540 sheets; texPick drew only 400, so they (and Tile*/Metro/Liquids) never showed unless searched.
- Fix: groups "DOOR HQ · the eight painted tileables" + "DOOR HQ · the other sheets its rooms wear" (hqBuildingSheets, from DOOR_HQ.rooms shells) lead picker + TEXTURES tab; cap 1200.
- stone/drywall/carpet collide with TERRAIN_SPRITES names (terrain rooms' _hzTex read the battle sheet first). Picker writes hq:stone/hq:drywall/hq:carpet; _hzTex and _hqTex read `hq:`.
- Notes docs/notes/editor.md "DOOR HQ'S TEXTURES IN THE PICKER". See [[editor-building-look-20261030]].
