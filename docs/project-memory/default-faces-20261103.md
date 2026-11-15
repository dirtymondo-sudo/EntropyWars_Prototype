---
name: default-faces-20261103
description: 11-03 PR #813: good-looking male + female default faces on MPFB bodies (EW_MPFB_DEFAULT_FACES, mpfbFacePatch, FACE > DEFAULT/NEUTRAL FACE); community face references answer
metadata:
  type: project
  modified: 2026-11-03T01:30:53.087Z
---
mondo 11-03 asked: community references for attractive MakeHuman faces? + make good-looking male/female default faces.

Answer given: no plug-in library. MakeHuman community shares .mhm characters (CC0 output) but no curated attractive presets, no .mhm in the 64 packs; forum/docs only explain sliders. Our FACE sliders ARE MakeHuman modifiers (x SHAPE_GAIN), so a CC0 .mhm face could be mapped in later key by key.

Shipped PR #813, zip r2-sync/ENTROPY_WARS_SYNC_20261103-0130.zip (sprites.js, party-builder.js), token 20261103-defaultfaces-02-cors.
- sprites.js EW_MPFB_DEFAULT_FACES {male, female} from existing sliders only; mpfbFacePatch(a, body, force): untouched/default face -> body gender's default; NOT in normalize, so saved + baked race looks unchanged.
- Applied at forge CREATE APPEARANCE + RESET, mirror/intake first look + RESET, body switch; FACE > DEFAULT FACE / NEUTRAL FACE.
- Known limit told to him: MPFB bases rest with lips slightly parted (teeth line) + stock skin; outside sliders.
- Shots /mnt/project-files/default-faces/. Probe: stage mounted on EWCharViewer, bind pose (skeleton.pose(), mixer stopped, EW_DISABLE_FACE_IDLE) for same head pose. Plan row 29a.
Related [[aaa-creator-face-sliders-20261102]] [[character-models-plan-doc]]

Follow-up 11-03 PR #814 (zip 20261103-0227, token facepresets-01): bake-faces.js (.mhm / MPFB preset json -> sprites.js EW_MPFB_FACE_PRESETS block; FACE buttons; map.js credits list preset authors). Block EMPTY: this env can't reach www.makehumancommunity.org (its community services were offline 11-03 anyway); a full-network thread ((session)) downloads .mhm to /mnt/project-files/mhm-faces/ and bakes with the tool. Plan row 29b.
