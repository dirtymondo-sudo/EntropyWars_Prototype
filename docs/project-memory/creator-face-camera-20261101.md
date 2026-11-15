---
name: creator-face-camera-20261101
description: creator camera: face close-up on face/hair/headwear edits (PR #767/#769) + wheel zoom path body<->face (PR #903)
metadata:
  type: project
  modified: 2026-11-01T18:10:27.070Z
---
mondo 11-01: "when editing facial features or hair or headwear in the character creator, please make the camera zoom into the face closeup".

Shipped PR #767, zip r2-sync/ENTROPY_WARS_SYNC_20261101-1810.zip (party-builder.js, three-renderer.js), token 20261101-facecam-02-cors.
- party-builder.js CreatorControls: `data-cc-cam` section markers + `data-cc-cam-own` overrides -> EWCharViewer.frameCreator('face'|'body').
  Face = FACE, HAIR, Glasses, MakeHuman Eyes/Brows/Lashes, pack Hats/Glasses/Masks + beards/horns/antlers. MakeHuman Skin = body.
- three-renderer.js: face framing follows the Head bone (classic: midpoint Head/head_end; MPFB: Head + 1%), all camera values eased.
  CV_FACE_FRAME 0.38, CV_FACE_LIFT 0.035. A new face-type control needs a face marker or it frames the body.
- Shots: /mnt/project-files/face-camera/face_camera_before_after.jpg. Probe = a copy of playtest_creator.js (DOOR Agent slot opens the creator).
Notes: docs/notes/character-creator.md "THE FACE CAMERA". Related [[character-models-plan-doc]]
Rev 2 (PR #769, zip r2-sync/ENTROPY_WARS_SYNC_20261101-1840.zip, token 20261101-facecam-03-cors): mondo wanted it closer and looking UP at the
face (idle heads bow, hat brims hid it, his reference = camera low, angled up). CV_FACE_FRAME 0.26, CV_FACE_POLAR -0.34 (eased via polarTo).
Rev 3 ZOOM PATH (11-05, PR #903, token 20261105-zoompath-01-cors, R2 uploaded): mondo wanted wheel-in = toward the face, wheel-out = centered full body, from both views. Wheel now moves one distance dist0<->faceD; _cvFrame blends look point/height/tilt by s (log). Shots /mnt/project-files/creator-zoom/.
