---
name: ocean-pack-20261027
description: Ocean pack (PR #577 + on-screen fixes PR #581, 10-27) — mondo's 48 FBX sea models in Assets/oceanic: loader, editor "Ocean" group, rooms, spell looks, calls flagged
metadata:
  type: project
---
OCEAN PACK (PR #577, 2026-10-27, mondo uploaded 48 FBX to R2 Assets/oceanic): FBXLoader added to index.html; three-renderer.js
_asFbx/_oceanBake bakes a still copy + keeps the rig; data.js HQ_CATALOGUE_OCEAN = 49 rows (palette group "Ocean"), row keys
hover/anim/swim. Kill-switches window.EW_NO_OCEAN_PACK, EW_OCEAN_STILL.
Rooms: Atlantis abyss + temple, Bermuda sea + island, Downtown harbour, pirate ship deck. fish_school proc + abyss whale now real models.
Spells: shark in Blood in the Water, Feeding Frenzy, Jaws finisher (o.shark on nessieSurfaces), Walk the Plank; fish/dolphins in
Tsunami, Whirlpool, Temporal Tide, Great Flood, Poseidon's Wrath, Depth Charge; real starfish in Five-Armed Crush.

ON-SCREEN CHECK (PR #581, coordinator asked "prove on screen"): outdoor sea + temple pool are OPAQUE, so swimmers got hover to
break the surface (placeOne keeps an underwater y for swimmers); Bermuda reef coral/weed + reef/lagoon fish REMOVED (flagged);
beach items moved to dry sand; Eel nose +Z, BrownFish turn 180; flat colours 0.3 self-lift; rig budget 44, weed max 8; Blood in
the Water breach arc raised to clear the built jaws. Editor blank-thumbnail bug (cached model) fixed by main's #580 too.
Shots: /mnt/project-files/ocean-proof/. Spell captures via the spell-vfx-audit harness (HUD path) — warm models first
(ThreeRenderer.warmOceanModels) since SA.boot skips the loading card; Poseidon's Wrath needs enemies in water (cast Great Flood first).
PR #582: sea-scatter fish_school (catalogue surf + row sea) now skims the sea surface (was 0.8-2.4 m over the harbour).
Bermuda reef/lagoon rows removed in #581 were all added by #577 itself (none pre-existed). Not dressed: Antarctica, Looking Glass sea.
Gotcha: a paused Playwright clock makes `await backToMainMenu()` hang — resume first. Two browsers at once OOM-killed the container.
PR #583 (10-27, "swimming underwater to atlantis? and atlantis?"): route = Bermuda sea surface/dive → maelstrom (22,-28) → abyss
upwelling → road → temple (or Dutchman hatch). Dressed the Bermuda sea floor + abyss path. FIXED two live bugs: surface swim threw
(undeclared LW → swimmer froze; dive skipped it) and SeaWeed.fbx's embedded 1000-intensity light whited out the abyss. Rig cap 64,
mixers skip past 45 m. Harness gotcha: draw-on-demand + ph eval blurs drop held keys — hold via setInterval inside one eval.
