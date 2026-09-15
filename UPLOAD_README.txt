SKATEBOARD CONTROLS FIX — 2026-09-15

Complete replacement files, based on current GitHub main.

R2: three-renderer.js
Render: index.html (redeploy so the updated shared cache token is served)
Repository only: hq-skate.test.js, CLAUDE.md, DOOR_MASTER.md,
DOOR_HQ_BUILD_PLAN.md, VALIDATION.txt, this readme.

Fixes W pushing opposite the camera, reversed A/D steering, and camera
tracking during turns. Mouse-look offset remains under player control;
airborne tricks do not spin the camera. Grinds now update visible rider
position and facing. Cache token: 20260915-skate-controls-02-cors.

No deployment or browser playtest performed. Upload the complete renderer
and redeploy index.html together, then sync the changed files to the repo.
