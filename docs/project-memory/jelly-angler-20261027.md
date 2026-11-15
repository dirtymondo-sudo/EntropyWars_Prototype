---
name: jelly-angler-20261027
description: PR #588 (10-27) mondo's jellyfish + anglerfish GLBs in Assets/oceanic: loader, editor rows, underwater placements, jellyfish spell looks, Sting fix
metadata:
  type: project
  modified: 2026-10-27T06:23:02.308Z
---
mondo 10-27 uploaded 7 GLBs to R2 Assets/oceanic (Jellyfish_Moon_Jelly/_Box_Jelly/_Bioluminescent/_Pulsing_Frames, Anglerfish_Lure_Lit/_Lure_Dim/_Jaws_Open): "use them for the jellyfish spells and add them underwater and the angler fish too". PR #588 merged, zip ENTROPY_WARS_SYNC_20261027-0622.

- Loader: three-renderer.js _isOceanGlb/_oceanGlbPrep keeps the file's alpha + emissive glow (else _hqPropMatPick drew them white). Pulsing jelly's clip = rig.
- Editor: 7 HQ_CATALOGUE_OCEAN rows (Ocean group 56). Anglerfish nose +X → turn -90.
- Placed: Bermuda sea swim down + the hole (anglerfish in the hole), Atlantis abyss (upwelling bloom, road, steps, kelp, trench/wreck anglerfish). Not temple (dry).
- Spells: Bloom, Immortal Cycle, The Bloom finisher, Nematocyst Net, Sting, Ocean Current (_jellyPiece / _jellyCurrent3D).
- FOUND: a staged bolt spell never fires 'impact' — its _spell3DGeometry look never draws unless the id is in _GEOM_ON_BURST (Sting's lash was dead since 09-22; added). Other bolt spells with impact-only geometry may have the same gap.
- Proof shots /mnt/project-files/jelly-angler-proof/. Follow-up PR #590 (zip 20261027-0632): Deep Sea Fish Lure = lit anglerfish, lure tip is the bulb; Abyss Jaws = open-jawed anglerfish rises under victim. sv-ctl tip: zoom the battle cam by dispatching WheelEvent on #threeCanvas; VFX3D.fire(intent,id,{tx,ty}) replays a look on any tile.
Related [[ocean-pack-20261027]] [[animals-20261027]]
