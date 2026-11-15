---
name: flyer-aim-camera-20261108
description: PR #1047 (11-08) Dead Eye / sniper scope, bullet ride and beam end cap frame flyers at real height; kill switch EW_NO_FLYER_AIM
metadata:
  type: project
  modified: 2026-11-08T02:39:51.365Z
---
mondo 11-08: "Dead eye spell camera zoom in doesnt account for flyers". PR #1047 merged, battle.js live 144c56d8, token 20261108-flyeraim-01-cors.
- Causes: cineSniperPov added a flying shooter's hover twice, aimed at logic height, and THE LEVEL LENS (_cineTiltCap, CINE_SHOT_TILT_MAX 90) clamps any look UP to level -> flyer above frame. cineBulletCam/cineEndCapReverse pivot = ground + shoulder (TPS pivot ignores elevZ!).
- Fix: scope eye from drawn feet, aim at drawn head, eye RISES to aim when aim is higher (keeps level-lens rule). Bullet ride lift tweens shooter hover -> target hover. End cap adds victim hover. Shared by Dead Eye, Take Aim, Precision Shot, Kneecap Shot, Railgun + every beam end cap.
- Action Cam is OFF in the shipped default (index.html SHIPPED-KEYS ew_cinematicActionCam "0"); the scope only plays with it ON. Set via window._setCinematicActionCam(true).
- Proof /mnt/project-files/dead-eye-flyer-camera/ (real casts, same Vampire, before via kill switch).
- Harness lessons: jetpack gear (party builder Gear column) makes any unit a flyer; after a page reload `ph draw always` again or in-page canvas grabs are black; in-page grab = wrap ThreeRenderer.hq.dev.renderer().render and drawImage after null-target renders (~2 fps on llvmpipe). Calling window.playOffensiveActionCamera(c, t, {spellId, _noCinematic:true}) replays a spell camera without a cast (lab only). Related [[camera-one-move-20261107]] [[guard-carry-camera-20261107]]
