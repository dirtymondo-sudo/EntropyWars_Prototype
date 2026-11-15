---
name: aaa-creator-face-sliders-20261102
description: 11-02 PR #789: 45 MakeHuman face sliders in FACE tabs on MPFB heads; AAA-creator plan phases 2-5 (body macros, skeleton proportions, head shapes, creature targets) in plan doc rows 25-29
metadata:
  type: project
  modified: 2026-11-02T03:25:39.325Z
---
mondo 11-02 asked: other MPFB face/head options? established creator way? female short/thick/tall-thin? AAA eye/lip sliders? face bones?

Facts told him: MPFB2 ships ~1,250 MakeHuman targets (face: eyes 68, mouth 44, nose 42, ears 44, head 27, chin 15, cheeks 16...);
game used 9. The 5 MPFB bodies are macro presets; heavy/thin/short are all MALE. game_engine rig has no face bones; MPFB
`default` rig has ~60 face bones for expression posing; recommended NO face bones (per-frame skinning cost, retarget), shapes
baked once = free. Packs: 160 community targets (131 CC0 / 29 CC-BY jaldmic animal heads + muzzles) for creature races (row 18).

Shipped PR #789, zip r2-sync/ENTROPY_WARS_SYNC_20261102-0325.zip (incl. Assets/Models/charactercreation/mpfb/mpfb_shapes.glb by hand),
token 20261102-facesliders-01-cors. Range = MakeHuman +-1 (2x tested: lids gap, nose crease, flat forehead).
Proof: /mnt/project-files/aaa-creator/face_sliders_proof.png. Probe = copy of playtest_creator.js, click the DOOR Agent slot, freeze
EWCharViewer.dev.state().mixer.timeScale=0 + EW_DISABLE_FACE_IDLE for comparable shots.
mondo picked BOTH (11-02 03:43) -> PR #793 DONE, zip 20261102-0358, token femalebodies-01: MPFB FEMALE HEAVY / TALL THIN / SHORT (FIT_FROM female via _FIT_D, no garment rebake) + BODY > Body shape sliders (Weight/Muscle macros gain 1.4/1.25 + 10 body details). Muscle +100 = 2 specks through tight tee (known). Row 27 limb-length sliders DROPPED (mondo OK 11-02 04:07, PR #794): creatures needing other proportions get baked preset bodies in row 18. Was: next (asked him on a decision card): phase 2 Weight/Muscle macro sliders (female thick without new GLBs), phase 3 skeleton-follow
proportions (real short/tall female) vs baking female preset GLBs. Doc: character-models-plan.md section 7.
Related [[character-models-plan-doc]] [[mpfb-asset-packs]] [[bust-slider-20261101]]
