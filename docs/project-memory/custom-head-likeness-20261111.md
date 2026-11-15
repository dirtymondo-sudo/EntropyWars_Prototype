---
name: custom-head-likeness-20261111
description: Morgan face likeness in the creator (PR #1134, 11-11): custom head shape + skin, hidden behind ?likeness=1; how custom shapes ship
metadata:
  type: project
  modified: 2026-11-11T14:52:57.024Z
---
mondo 11-11 had another session build a "Morgan" face likeness (a real person; he says she agreed) on branch claude/morgan-creator-head. Merged as PR #1134 from (thread in the owner project).
- His words: "hide behind a switch anyway, im really just testing something". So both picks (OUTFIT > Head > Creature heads > Morgan, SKIN > Morgan) only list in a browser that opened the game once with `?likeness=1` (`?likeness=0` off; localStorage ew_likeness). sprites.js EW_LIKENESS_PICKS / ewPickSwitchedOff, party-builder.js pickOff.
- Custom shapes = charactercreation/mpfb/custom_shapes/*.json baked into mpfb_shapes.glb by `node bake-custom-shape.js` (rerun after bake-mpfb.py --shapes).
- **How to apply:** mpfb_shapes.glb changes in place, so update its ASSET_MANIFEST.json row ([bytes, sha1[:12]]) and `--put` it, or the live game keeps the old cached file. Any new real-person likeness: add its keys to EW_LIKENESS_PICKS (hidden by default) unless mondo says to show it to everyone.
- Not checked: male bodies, WebGPU. Proof shots /mnt/project-files/custom-head-20261111/. Related [[cat-ears-20261103]] [[character-models-plan-doc]]
