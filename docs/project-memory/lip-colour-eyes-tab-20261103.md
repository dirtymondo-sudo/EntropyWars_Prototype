---
name: lip-colour-eyes-tab-20261103
description: 11-03 PR #810: MPFB lip colour (FACE > MOUTH, lipTint + lipColor, EW_MH_LIPS/tintLips) and all eye settings merged into FACE > EYES
metadata:
  type: project
  modified: 2026-11-03T00:53:49.637Z
---
mondo 11-03: no way to change just the lips; two separate Eyes tabs (FACE sliders vs "MakeHuman skin and face") should be one.

Shipped PR #810, zip r2-sync/ENTROPY_WARS_SYNC_20261103-0053.zip (sprites.js, three-renderer.js, party-builder.js), token 20261103-lips-01-cors.
- Lip colour on MPFB bodies: FACE > MOUTH > Lip colour, appearance.lipTint ('own' default | 'pick') + existing lipColor. Lip outline on the
  hm08 1024 sheet = sprites.js EW_MH_LIPS (traced from toigo lipstick skins, x 914-948, y 503-555); three-renderer.js tintLips keeps shading.
- FACE > EYES = sliders + Eye colour (mhEyes) + Lashes; FACE > BROWS = sliders + Brows; old MakeHuman block is now SKIN (after facial hair).
Shots: /mnt/project-files/creator-lips-eyes/. Probe that worked: click the DOOR Agent slot (IV), GEAR, CHARACTER CREATOR, MPFB FEMALE.
Pass 2 PR #811 (zip 20261103-0112, token lookcolours-01): Original colours / Pick a colour + picker for Skin colour (SKIN, skinTint+skin), Iris colour (eyeTint+eyeColor), Lash colour (lashTint/lashColor), Brow colour (browTint own|hair|pick / browColor); three-renderer tintSheet/tintLayer; EW_MH_IRIS r 3.8, EW_MH_SKIN_SAMPLE/KEEP. mondo was angry these weren't done in the 'organize creator' pass: every colourable thing needs a picker. Every-tab shots: /mnt/project-files/creator-usability/. Plan row 26c. Related [[character-models-plan-doc]] [[aaa-creator-face-sliders-20261102]]
