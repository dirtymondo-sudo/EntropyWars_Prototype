---
name: editor-simple-20261028
description: EDITOR PLAIN WORDS + BOX RAISE + JUST THE ROOM (PR #645, 10-28): room settings renamed/folded, Around the room dropdown, straight-sided stackable boxes
metadata:
  type: project
  modified: 2026-10-28T12:11:14.762Z
---

mondo 10-28 (furious-ish, "still a confusing mess"): "wtf is a dado", ceiling default grass, wants a straight cube raise to build with, and "a setting that shows the map as the dimensions i set, with a sky, no big landscape, no sea, no floating". PR #645, token 20261028-edsimple-01-cors, zip ENTROPY_WARS_SYNC_20261028-1211 (data.js, editor.js, hud.js, styles-editor.css, three-renderer.js).

- Inspector: THE SHELL -> THE ROOM'S SHAPE AND LOOK; Sky / Edge / Around the room dropdowns; plain names + tips; keys the room doesn't draw folded under NOT USED IN THIS ROOM with the reason (nothing deleted). New rooms' ceiling = concrete.
- Around the room = terrain.outer (endless) / outer:false (just the room, straight cliff sides, _hqBuildRoomSides) / outer:false + apron:true (the old apron strip, now visible). Old outer kept in terrain.outerWas.
- Why apron "did nothing": in terrain rooms the outer ground replaced apron/skirt/shell floor since 09-17. floorColor tints the ground field; wallColor tints every drawn wall.
- BOX RAISE / BOX LOWER (GROUND tab): wall rows with block:true on 1.75 m editor squares, stackable, fights stand on tops (checked). Exploration fights on 3.5 m squares read them by the cover rule (not changed).
- PAST THE EDGE (PR #647, 10-28, mondo: map sticks out past the yellow line): Just the room ground now ends ON the yellow line; `terrain.edgeOut` m (editor "past the edge (squares)", default 0) adds more. data.js info.cut + _hqTOutside walker bound; fight board unchanged. Zip ENTROPY_WARS_SYNC_20261028-1227.
- WALL TINT (PR #648, 10-28, mondo: placed walls tinted, can't change): new rooms' shell wallColor 0x86a066 tinted every drawn wall. Wall rows now take `tint` (#ffffff = none) in place of the room's; editor writes none on new walls, panel tint box + NONE + note. Zip ENTROPY_WARS_SYNC_20261028-1247.
- Notes: docs/notes/editor.md "THE PLAIN WORDS + THE BOXES + JUST THE ROOM". Shots /mnt/project-files/editor-simple/. See [[easy-editor-20261028]] [[editor-plan]].
