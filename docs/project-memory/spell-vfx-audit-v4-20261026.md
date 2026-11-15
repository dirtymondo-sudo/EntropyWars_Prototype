---
name: spell-vfx-audit-v4-20261026
description: V4-sonic-psychic of the 10-26 spell VFX audit was shot twice; pass2 addendum file, and the sheet-overwrite gotcha
metadata:
  type: project
  modified: 2026-10-26T18:37:57.656Z
---
V4-sonic-psychic (10-26) was shot by TWO threads. The first writer finished findings/V4-sonic-psychic.md at 18:14 (main
9fe8899, 10 S1, already in COMBINED.md). The second pass (main 068ec33) wrote findings/V4-sonic-psychic-pass2.md with
additions only:
- Swing Door: looks fine.
- Enthrall: S1, the shared gold chevron.
- Re-shoots confirm Stadium Show's read-only `position` throw (three-vfx-effects.js:26649, also :36080 Farewell Tour),
  and that Door Slam, Air Mail and Mic Drop show no door/mic.
- Extras: Probe's beam is green; the linePush cam looks through the edge force field; a shared stone-textured sphere
  sits over heads; pops say "+1 INT" for M ATK.

The giant gold triangle in debuff cams is the turn chevron (three-renderer.js _buildSelectionChevron, depthTest off),
which is never hidden in the action cam.

Gotcha: the second pass's sheet copy overwrote the first writer's top-level V4 sheets. Before copying sheets, check that
findings/<batch>.md doesn't exist yet. Two-pick door casts on the interactive page: set state._spellPick1={tile:true,
id:null,spellId,x,y}, then GAME.doSpell on the second tile. Trapdoor's 2×2 goes down-right from the picked tile.
Related [[spell-vfx-audit-20261026]].
