---
name: dull-liquids-20261112
description: Spell liquid glare fix (11-12, PR #1202): the six calm liquids' own dim highlight; where to tune; what is unseen
metadata:
  type: project
---
mondo 11-12 (Hollow Earth screenshot, white sparkly pool = the black goo `swamp`): "fix how bright and reflective these liquids are ... Water and lava are fine". Thread (thread in the owner project). Related [[calm-rollout-20261111]] [[noise-packs-20261112]].

- Cause: poison, poison_bog, purple_bog, swamp, oil, blood shared the calm water's Phong highlight (0xb4c4c8, shininess 140, ripple 0.05); every board light glinted white off every ripple. Entropy Style was NOT the cause (same with it off).
- SHIPPED PR #1202 (?v=20261112-dullliquids-01-cors, three-renderer.js 402ac514 live): `_CALM.liquids` rows = [colour, opacity, glow, highlight colour, shininess, ripple depth, sky sheen]. Tune there (console `EW_CALM.liquids.<key>`, shows at next board build). Notes maps-terrain-battle.md "THE DULL LIQUIDS".
- Not touched: pixel water + lava, healing_spring (plain calm sheet), the six nz_* moving looks (canvas sheets, no highlight).
- Proof /mnt/project-files/dull-liquids-20261112/. NOT SEEN: his Mac / real WebGPU, classic WebGL. If he says "too flat / can't tell it's liquid": raise ripple + shininess a little, keep the highlight colour dim.
- HARNESS: /mnt/project-files/liquid-spread-20261111/boot.js with MAP label picks the 20x20 twin (not in the list, falls to Mount Shasta); match the `_delta` id for the 12x12. camera.snap zoom 1.25 tilt 30 hung the headless browser; zoom 0.8 tilt 20 is fine. After ThreePost.setStyle('off') wait ~20 s before a shot (first frame is a flat green).
