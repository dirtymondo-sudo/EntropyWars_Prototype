---
name: pack-fabrics-misfiled-20261103
description: 11-03 PR #880: viking boots/pants/tunic (+EMT pants/jackets) no longer knock each other off; pack trousers get a fabric row (appearance.wearFabric)
metadata:
  type: project
  modified: 2026-11-03T17:27:16.472Z
---
mondo 11-03: viking boots removed viking pants and vice versa; wanted cotton/leather etc. for pants.
Cause: MakeHuman pack filed them under `suits`; normalizeWearList = one per category. Fix PR #880 (token 20261103-packfab-01-cors, uploaded to R2 directly):
sprites.js EW_WEAR_KIND (real kind, also read by three-renderer.js buildWear for layering) + EW_WEAR_PICK_AS_COAT (EMT jackets, winter coat).
A new mis-filed piece = one EW_WEAR_KIND line.
Fabrics: appearance.wearFabric {id: EW_FABRICS key}, wearFabricable = pack trousers only (kind bottoms); UI row under the piece's colour in OUTFIT > LEGS > BOTTOMS; renderer THE PACK FABRICS (paintWear).
Extending to tops/skirts = widen wearFabricable. Known: viking boot fur pokes through tight jeans at the shin.
Shots /mnt/project-files/pack-fabrics/. Notes character-creator.md, plan row 12p. Related [[wear-tint-20261101]] [[creator-tabs-body-slots-20261103]]
