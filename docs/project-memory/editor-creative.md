---
name: editor-creative
description: Editor Minecraft-style rework 2026-10-05 (PRs #119 controls, #120 SHAPES tab, #122 MODULAR building kit) and what it changed in the engine
metadata:
  type: project
  modified: 2026-10-05T08:01:48.223Z
---

mondo asked (2026-10-05) for the editor to work like Minecraft creative mode. Three PRs, all merged:
- **#119:** WASD fly, E mouse look, RIGHT places, MIDDLE takes the block in hand, a 1-9 hotbar. Game rooms are pickable, and the first edit makes his own copy.
- **#120:** a SHAPES tab of WorldEdit-style terrain stamps (hill, mesa, pit, block, level, ridge, trench, round wall).
- **#122:** a MODULAR tab, a 4 m cell grid kit (floor, wall, door, window, stairs, roof), built floor by floor with `[` `]`.

**Engine changes in #122 (data.js):**
- wall `y0` = an absolute foot;
- openings are measured from it;
- hqTerrainFeet now stops a walker on a bridge slab at walls taller than a climb (hqTerrainWallAt has a new `minTop`);
- where the ground rises over the slab, the ground is the surface.

**Why:** possible regression in older rooms where a raised walkway passes beside tall walls.
**How to apply:** if mondo reports walkers blocked on bridges, look there first. Details are in docs/notes/editor.md. Related: [[editor-plan]]

**Game room edits (PR #299, 2026-10-18):** editing a game room in the editor now saves INTO that room (project `doc.edits[id]` = diff vs data.js, applied at game load from IndexedDB by data.js hqRoomEditsBoot); arenas cut from it rebuild from it at launch (all sizes), online host relays its edit in `arena-check`. MAKE A COPY = the old new-room copy. Lives only in that browser's editor project (last opened); not in data.js, so other browsers see it only via the online host relay.

**Tile grid + SNAP TILE (PR #332, 2026-10-19):** editor shows room edge (yellow) + 1.75 m board squares draped on ground; SNAP "TILE" places on square middles / whole squares. Fixed new-room bug: flat outer ground copied edge height to the fog (endless strip) + wedge from outer quads on the bound. PR #333: rooms sized in SQUARES (NEW ROOM + shell w/d squares); his w_ rooms with odd square counts get an odd battle lattice offset half a square (data.js hqFieldGridOffset) so room edge = square edge = battle board. mondo: exploration must flow seamlessly into the square battle grid, build everything around the 1.75 m squares.
